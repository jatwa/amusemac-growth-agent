const fetch = require('node-fetch');
const { analyzeOpportunityContent, parseNaturalLanguageQuery } = require('../intentEngine.cjs');
const { isValidPublicUrl, validateAndCleanOpportunity, generateFingerprint } = require('../sourceValidator.cjs');
const { performDeepResearch } = require('../deepResearchEngine.cjs');

/**
 * Single-Discovery-Request Public Web Search Provider with Dual SerpAPI Key Failover
 * - Uses Primary SerpAPI Key by default.
 * - Automatically fails over to Backup SerpAPI Key if Primary is exhausted or returns 429.
 * - ONE USER SEARCH = EXACTLY 1 SERPAPI DISCOVERY REQUEST (num=100).
 * - Zero automatic pagination loops (start=10, 20... removed).
 * - Zero query variation loops (1 single optimized query sent).
 * - Combined quota calculation (Primary remaining + Backup remaining).
 * - Zero SerpAPI calls inside Deep Research.
 */
class PublicWebSearchProvider {
  constructor() {
    this.providerName = 'serpapi';
  }

  getPrimaryApiKey() {
    return process.env.SERPAPI_PRIMARY_API_KEY || process.env.WEB_SEARCH_API_KEY || process.env.SERPAPI_API_KEY || '';
  }

  getBackupApiKey() {
    return process.env.SERPAPI_BACKUP_API_KEY || '';
  }

  /**
   * Fetches account usage for a given SerpAPI API key without consuming a search credit
   */
  async fetchAccountQuota(apiKey) {
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_serpapi_api_key')) {
      return { total: 0, usage: 0, remaining: 0, isExhausted: true, validKey: false };
    }

    try {
      const res = await fetch(`https://serpapi.com/account?api_key=${apiKey.trim()}`, { timeout: 5000 });
      if (!res.ok) {
        return { total: 0, usage: 0, remaining: 0, isExhausted: true, validKey: false, httpStatus: res.status };
      }
      const data = await res.json();
      if (data.error) {
        return { total: 0, usage: 0, remaining: 0, isExhausted: true, validKey: false, error: data.error };
      }

      const total = Number(data.plan_searches_limit || data.total_searches_left + data.this_month_usage || 250);
      const usage = Number(data.this_month_usage || 0);
      const remaining = data.plan_searches_left !== undefined ? Number(data.plan_searches_left) : Math.max(0, total - usage);
      const isExhausted = remaining <= 0;

      return { total, usage, remaining, isExhausted, validKey: true };
    } catch (e) {
      return { total: 0, usage: 0, remaining: 0, isExhausted: true, validKey: false, error: e.message };
    }
  }

  /**
   * Fetches combined quota for Primary + Backup SerpAPI accounts
   */
  async getCombinedQuota() {
    const primaryKey = this.getPrimaryApiKey();
    const backupKey = this.getBackupApiKey();

    const [primaryQuota, backupQuota] = await Promise.all([
      this.fetchAccountQuota(primaryKey),
      this.fetchAccountQuota(backupKey)
    ]);

    const primaryRemaining = primaryQuota.remaining || 0;
    const backupRemaining = backupQuota.remaining || 0;
    const combinedRemaining = primaryRemaining + backupRemaining;
    const isExhausted = combinedRemaining <= 0;

    return {
      primaryRemaining,
      backupRemaining,
      combinedRemaining,
      isExhausted,
      primaryExhausted: primaryQuota.isExhausted,
      backupExhausted: backupQuota.isExhausted,
      primaryValid: primaryQuota.validKey,
      backupValid: backupQuota.validKey
    };
  }

  /**
   * Generates ONE single optimized search query combining all user parameters
   */
  generateSingleQuery({
    userQuery = '',
    serviceFilter = '',
    locationMode = 'worldwide',
    countries = [],
    manualLocation = '',
    workMode = 'REMOTE_WORLDWIDE',
    engagementType = 'ANY',
    opportunityType = ''
  }) {
    if (userQuery && userQuery.trim()) {
      return userQuery.trim();
    }

    const parsed = parseNaturalLanguageQuery(userQuery);
    const serviceTerm = serviceFilter || parsed.detectedServices[0] || 'video production';
    const typeTerm = opportunityType ? `"${opportunityType}"` : '';

    let engageTerm = '';
    if (engagementType === 'PROJECT') engageTerm = '"project"';
    else if (engagementType === 'CONTRACT') engageTerm = '"contract"';
    else if (engagementType === 'FREELANCE') engageTerm = '"freelance"';
    else if (engagementType === 'RETAINER') engageTerm = '"retainer"';
    else if (engagementType === 'RFP_VENDOR') engageTerm = '"RFP"';
    else if (engagementType === 'OUTSOURCING') engageTerm = '"outsourcing"';

    let locTerm = '"remote"';
    if (locationMode === 'countries' && Array.isArray(countries) && countries.length > 0) {
      locTerm = `"${countries[0]}"`;
    } else if (locationMode === 'manual' && manualLocation) {
      locTerm = `"${manualLocation.trim()}"`;
    }

    return `"looking for ${serviceTerm}" ${locTerm} ${engageTerm} ${typeTerm}`.replace(/\s+/g, ' ').trim();
  }

  /**
   * Executes Single-Discovery Request search across Primary -> Backup SerpAPI Key
   */
  /**
   * Safe helper to sanitize error messages so raw SerpAPI keys are NEVER exposed
   */
  sanitizeErrorMessage(msg = '', primaryKey = '', backupKey = '') {
    if (!msg || typeof msg !== 'string') return 'SerpAPI request error.';
    let sanitized = msg;
    if (primaryKey) sanitized = sanitized.replaceAll(primaryKey, '[REDACTED_API_KEY]');
    if (backupKey) sanitized = sanitized.replaceAll(backupKey, '[REDACTED_API_KEY]');
    return sanitized;
  }

  /**
   * Executes a single SerpAPI HTTP GET query (num=100) with dual-key failover
   * and returns structured diagnostic information & raw organic items.
   */
  async executeSerpApiQuery(singleQuery = '', options = {}) {
    const requestStarted = new Date().toISOString();
    const primaryKey = this.getPrimaryApiKey();
    const backupKey = this.getBackupApiKey();

    if (!primaryKey && !backupKey) {
      return {
        success: false,
        status: 'API_ERROR',
        query: singleQuery,
        requestStarted,
        requestSucceeded: false,
        httpStatus: 401,
        serpApiError: 'MISSING_API_KEY',
        serpApiMessage: 'No SerpAPI key configured on server.',
        responseReceived: false,
        rawOrganicResultCount: 0,
        parsedResultCount: 0,
        parserStatus: 'API_ERROR',
        rejectionReason: 'No SerpAPI key configured.',
        rawOrganicItems: []
      };
    }

    let selectedKey = primaryKey || backupKey;
    let keyAccountUsed = primaryKey ? 'PRIMARY' : 'BACKUP';
    let apiRes = null;
    let data = null;
    let httpStatus = 0;

    const primaryApiUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(singleQuery)}&num=100&api_key=${selectedKey}`;

    try {
      apiRes = await fetch(primaryApiUrl);
      httpStatus = apiRes.status;
      if (apiRes.ok) {
        data = await apiRes.json();
      } else {
        try { data = await apiRes.json(); } catch (e) {}
      }
    } catch (e) {
      apiRes = null;
    }

    const isQuotaError = !apiRes || !apiRes.ok || (data && data.error && (data.error.includes('quota') || data.error.includes('search limit') || data.error.includes('Out of searches')));

    if (isQuotaError && keyAccountUsed === 'PRIMARY' && backupKey) {
      console.log('[SerpAPI Failover] Primary key error/exhausted. Retrying with Backup key...');
      selectedKey = backupKey;
      keyAccountUsed = 'BACKUP';
      const backupApiUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(singleQuery)}&num=100&api_key=${selectedKey}`;

      try {
        apiRes = await fetch(backupApiUrl);
        httpStatus = apiRes.status;
        if (apiRes.ok) {
          data = await apiRes.json();
        } else {
          try { data = await apiRes.json(); } catch (e) {}
        }
      } catch (e) {
        apiRes = null;
      }
    }

    if (!apiRes || !apiRes.ok || !data || data.error) {
      const rawErrMsg = data?.error || (apiRes ? `HTTP ${apiRes.status} Error` : 'Network fetch failed');
      const safeMsg = this.sanitizeErrorMessage(rawErrMsg, primaryKey, backupKey);
      return {
        success: false,
        status: 'API_ERROR',
        query: singleQuery,
        requestStarted,
        requestSucceeded: false,
        httpStatus: httpStatus || 500,
        serpApiError: safeMsg,
        serpApiMessage: safeMsg,
        responseReceived: Boolean(data),
        rawOrganicResultCount: 0,
        parsedResultCount: 0,
        parserStatus: 'API_ERROR',
        rejectionReason: safeMsg,
        rawOrganicItems: []
      };
    }

    const organic = data.organic_results || [];
    const rawOrganicResultCount = organic.length;

    const rawOrganicItems = [];
    for (const item of organic) {
      if (!item.link || !isValidPublicUrl(item.link)) continue;
      try {
        const domain = new URL(item.link).hostname.replace(/^www\./, '');
        rawOrganicItems.push({
          title: item.title || 'Public Project Requirement',
          link: item.link,
          sourceUrl: item.link,
          snippet: item.snippet || item.title || '',
          position: item.position || (rawOrganicItems.length + 1),
          search_query: singleQuery,
          domain
        });
      } catch (e) {}
    }

    const parsedResultCount = rawOrganicItems.length;
    let parserStatus = 'SUCCESS';
    let rejectionReason = null;

    if (rawOrganicResultCount === 0) {
      parserStatus = 'ZERO_ORGANIC_RESULTS';
      rejectionReason = 'SerpAPI returned 0 organic results for query.';
    } else if (parsedResultCount === 0) {
      parserStatus = 'PARSER_ERROR';
      rejectionReason = `Parsed 0 valid URLs from ${rawOrganicResultCount} organic results.`;
    }

    return {
      success: true,
      status: 'SUCCESS',
      query: singleQuery,
      requestStarted,
      requestSucceeded: true,
      httpStatus: httpStatus || 200,
      serpApiError: null,
      serpApiMessage: null,
      responseReceived: true,
      rawOrganicResultCount,
      parsedResultCount,
      parserStatus,
      rejectionReason,
      rawOrganicItems
    };
  }

  /**
   * Executes Single-Discovery Request search across Primary -> Backup SerpAPI Key
   */
  async search({
    query = '',
    locationMode = 'worldwide',
    countries = [],
    manualLocation = '',
    workMode = 'REMOTE_WORLDWIDE',
    engagementType = 'ANY',
    opportunityType = '',
    filters = {},
    count = 'MAXIMUM',
    resultLimit = 'MAXIMUM',
    resultMode = 'MAXIMUM',
    orgId = 'amusemac-studio'
  }) {
    const isMaximumMode = resultLimit === 'MAXIMUM' || resultMode === 'MAXIMUM' || count === 'MAXIMUM' || count === 0 || count === -1;
    const targetResultLimit = isMaximumMode ? 100 : Math.max(1, Math.min(Number(resultLimit || count || 25), 100));
    const resultLimitLabel = isMaximumMode ? 'Maximum Results' : `${targetResultLimit} Results`;

    const singleQuery = this.generateSingleQuery({
      userQuery: query,
      serviceFilter: filters.service,
      locationMode,
      countries,
      manualLocation,
      workMode,
      engagementType: engagementType || filters.engagementType || 'ANY',
      opportunityType: opportunityType || filters.opportunityType
    });

    const executionRes = await this.executeSerpApiQuery(singleQuery, { locationMode, countries, manualLocation, workMode, engagementType, opportunityType, filters, orgId });

    if (!executionRes.success) {
      return {
        success: false,
        status: executionRes.status,
        provider: this.providerName,
        leads: [],
        metrics: {
          serpApiConnected: false,
          actualResponse: executionRes.responseReceived,
          resultMode: isMaximumMode ? 'MAXIMUM' : 'FIXED',
          resultLimit: isMaximumMode ? 'MAXIMUM' : targetResultLimit,
          resultLimitLabel,
          requestedCount: resultLimitLabel,
          serpApiRequestsCount: 1,
          rawResultsCount: 0,
          candidatesCount: 0,
          qualifiedLeadsCount: 0,
          rejectedProvidersCount: 0,
          rejectedIrrelevantCount: 0,
          duplicateCount: 0,
          deepResearchedCount: 0,
          researchFailedCount: 0,
          sourcesFound: [],
          isDemoUsed: false
        },
        message: executionRes.serpApiMessage || 'SerpAPI request failed.'
      };
    }

    const organic = executionRes.rawOrganicItems || [];
    const seenFingerprints = new Set();
    const normalizedLeads = [];
    const sourcesFoundSet = new Set();

    let rejectedInformationalBlogsCount = 0;
    let rejectedProviderPagesCount = 0;
    let rejectedMarketplaceCategoryCount = 0;
    let rejectedJobsCount = 0;
    let rejectedCompetitorsCount = 0;
    let duplicateCount = 0;
    let deepResearchedCount = 0;

    for (const item of organic) {
      if (!isMaximumMode && normalizedLeads.length >= targetResultLimit) break;
      if (!item.link || !isValidPublicUrl(item.link)) continue;

      try {
        const domain = new URL(item.link).hostname.replace(/^www\./, '');
        sourcesFoundSet.add(domain);
      } catch (e) {}

      const analysis = analyzeOpportunityContent({
        title: item.title || '',
        requirement: item.snippet || '',
        description: item.snippet || '',
        sourceUrl: item.link
      });

      if (analysis.intentType === 'REJECT') {
        if (analysis.rejectionCategory === 'INFORMATIONAL_BLOG_ARTICLE') rejectedInformationalBlogsCount++;
        else if (analysis.rejectionCategory === 'PROVIDER_SUPPLIER_PAGE') rejectedProviderPagesCount++;
        else if (analysis.rejectionCategory === 'MARKETPLACE_CATEGORY_PAGE') rejectedMarketplaceCategoryCount++;
        else if (analysis.rejectionCategory === 'EMPLOYMENT_JOB_PAGE') rejectedJobsCount++;
        else rejectedCompetitorsCount++;
        continue;
      }

      let displayLocation = 'Worldwide';
      if (locationMode === 'countries' && countries.length > 0) displayLocation = countries.join(', ');
      else if (locationMode === 'manual' && manualLocation) displayLocation = manualLocation;

      const candidateLead = {
        id: `REAL-WEB-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        leadId: `REAL-WEB-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        title: item.title || 'Public Project Requirement',
        requirement: item.snippet || item.title || 'Public requirement listing',
        description: item.snippet || item.title,
        matchedServices: analysis.matchedServices,
        service_needed: analysis.matchedServices[0] || 'Creative Production',
        source: 'Public Web',
        sourceUrl: item.link,
        source_url: item.link,
        source_domain: (item.link ? new URL(item.link).hostname.replace(/^www\./, '') : 'Public Web'),
        location: displayLocation,
        workMode,
        opportunityType: opportunityType || 'Project Requirement',
        intentType: analysis.intentType,
        leadQualityScore: analysis.leadQualityScore,
        evidence: analysis.evidence,
        search_query: query,
        status: 'DISCOVERED',
        outreachStatus: 'NEW',
        pipeline_stage: 'DISCOVERED',
        dataStatus: 'REAL_PUBLIC'
      };

      const cleaned = validateAndCleanOpportunity(candidateLead, false);
      if (!cleaned) continue;

      const { isLeadDuplicate } = require('../dbStore.cjs');
      const targetOrgId = orgId || 'amusemac-studio';

      const fp = cleaned.fingerprint || generateFingerprint(cleaned);
      if (seenFingerprints.has(fp) || isLeadDuplicate(targetOrgId, cleaned).exists) {
        duplicateCount++;
        continue;
      }

      const researchResult = await performDeepResearch(cleaned);
      if (researchResult.status === 'REJECTED_PROVIDER' || researchResult.status === 'NO_BUYER_DEMAND_EVIDENCE') {
        rejectedProviderPagesCount++;
        continue;
      }

      if (researchResult.lead) {
        seenFingerprints.add(fp);
        deepResearchedCount++;
        normalizedLeads.push(researchResult.lead);
      }
    }

    const finalLeads = isMaximumMode ? normalizedLeads : normalizedLeads.slice(0, targetResultLimit);

    return {
      success: true,
      provider: this.providerName,
      leads: finalLeads,
      metrics: {
        serpApiConnected: true,
        actualResponse: true,
        resultMode: isMaximumMode ? 'MAXIMUM' : 'FIXED',
        resultLimit: isMaximumMode ? 'MAXIMUM' : targetResultLimit,
        resultLimitLabel,
        requestedCount: resultLimitLabel,
        serpApiRequestsCount: 1,
        rawResultsCount: executionRes.rawOrganicResultCount,
        candidatesCount: organic.length,
        qualifiedLeadsCount: finalLeads.length,
        rejectedProvidersCount: rejectedProviderPagesCount + rejectedMarketplaceCategoryCount,
        rejectedIrrelevantCount: rejectedInformationalBlogsCount + rejectedJobsCount + rejectedCompetitorsCount,
        duplicateCount,
        deepResearchedCount,
        sourcesFound: Array.from(sourcesFoundSet),
        isDemoUsed: false
      }
    };
  }
}

module.exports = PublicWebSearchProvider;
module.exports.PublicWebSearchProvider = PublicWebSearchProvider;
