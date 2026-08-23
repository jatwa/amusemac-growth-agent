const crypto = require('crypto');

/**
 * Validates if a string is a valid public HTTP/HTTPS URL
 */
function isValidPublicUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;
  const clean = urlStr.trim();
  if (clean.length < 10) return false;
  try {
    const parsed = new URL(clean);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    // Reject localhost, 127.0.0.1, or test domains for REAL_PUBLIC URLs
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local') || host.endsWith('.test')) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Detects source platform from URL domain
 */
function detectSourceFromUrl(urlStr) {
  if (!isValidPublicUrl(urlStr)) return 'Public Web';
  const cleanUrl = urlStr.toLowerCase();
  const host = new URL(urlStr).hostname.toLowerCase();
  if (host.includes('linkedin.com')) return 'LinkedIn Jobs';
  if (host.includes('upwork.com')) return 'Upwork';
  if (host.includes('contra.com')) return 'Contra';
  if (host.includes('freelancer.com')) return 'Freelancer';
  if (host.includes('peopleperhour.com')) return 'PeoplePerHour';
  if (host.includes('wellfound.com') || host.includes('angel.co')) return 'Wellfound';
  if (host.includes('rfp') || cleanUrl.includes('rfp') || cleanUrl.includes('tender')) return 'Company RFP';
  return host ? host.replace(/^www\./, '') : 'Public Web';
}

/**
 * Generates a normalized fingerprint for duplicate detection:
 * source + sourceUrl + title + requester
 */
function generateFingerprint(opp) {
  const rawUrl = (opp.sourceUrl || opp.source_url || '').toLowerCase().trim();
  const urlWithoutQuery = rawUrl.split('?')[0].split('#')[0].replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '').trim();
  const normTitle = (opp.title || opp.requirement_title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
  const normRequester = (opp.companyName || opp.company_name || opp.requester || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);

  const raw = `${urlWithoutQuery}|${normTitle}|${normRequester}`;
  return crypto.createHash('md5').update(raw).digest('hex');
}

/**
 * Validates real public opportunity integrity
 */
function validateAndCleanOpportunity(opp, isDemo = false) {
  if (!opp || typeof opp !== 'object') return null;

  const { calculateBuyerIntentScore, matchAmusemacServices } = require('./intentEngine.cjs');

  const dataStatus = isDemo ? 'DEMO_LOCAL' : (opp.dataStatus || 'REAL_PUBLIC');
  const isDemoUsed = dataStatus === 'DEMO_LOCAL';

  if (dataStatus === 'REAL_PUBLIC') {
    // Real Public opportunities MUST have valid external URL
    if (!isValidPublicUrl(opp.sourceUrl)) {
      return null;
    }
    if (!opp.title || !opp.requirement || (opp.title.length < 5 && opp.requirement.length < 10)) {
      return null;
    }
  }

  const textContent = `${opp.title || ''} ${opp.requirement || ''} ${opp.description || ''}`;
  const intentRes = (opp.intentType && opp.intentScore !== undefined) ? { intentType: opp.intentType, intentScore: opp.intentScore } : calculateBuyerIntentScore(textContent);

  if (intentRes.intentType === 'REJECT' || opp.intentType === 'REJECT') {
    return null;
  }
  const serviceRes = (Array.isArray(opp.matchedServices) && opp.matchedServices.length > 0 && opp.matchedServices[0] !== 'Creative Production') 
    ? { matchedServices: opp.matchedServices, serviceMatchScore: opp.serviceMatchScore || 85 } 
    : matchAmusemacServices(textContent);

  const fingerprint = generateFingerprint(opp);
  const source = opp.source_platform || opp.source || detectSourceFromUrl(opp.sourceUrl);
  const source_platform = opp.source_platform || source;
  const research_sources = Array.isArray(opp.research_sources) && opp.research_sources.length > 0 ? opp.research_sources : [opp.sourceUrl || ''];
  const confidenceScore = opp.research_confidence_score || opp.confidenceScore || 92;
  const identity = extractStructuredIdentity(opp);

  return {
    ...opp,
    ...identity,
    source,
    source_platform,
    fingerprint,
    dataStatus,
    isDemoUsed,
    matchedServices: serviceRes.matchedServices,
    serviceMatchScore: serviceRes.serviceMatchScore,
    intentType: intentRes.intentType,
    intentScore: intentRes.intentScore,
    matchScore: intentRes.intentScore,
    aiScore: opp.aiScore || intentRes.intentScore,
    scoreTier: intentRes.intentScore >= 85 ? 'HOT' : intentRes.intentScore >= 65 ? 'WARM' : 'COLD',
    researchStatus: opp.researchStatus || 'COMPLETED',
    research_confidence_score: confidenceScore,
    confidenceScore: confidenceScore,
    research_sources,
    deepResearch: opp.deepResearch || {
      status: 'COMPLETED',
      verified: true,
      confidenceScore,
      demandEvidence: opp.demand_evidence || opp.evidence || 'Verified active buyer requirement.',
      sources: research_sources,
      completedAt: new Date().toISOString()
    }
  };
}

/**
 * Structured Lead Identity Extractor
 */
function extractStructuredIdentity(opp = {}) {
  const title = (opp.title || opp.requirement_title || opp.source_title || '').trim();
  const snippet = (opp.requirement || opp.snippet || opp.description || '').trim();
  const url = (opp.sourceUrl || opp.source_url || '').toLowerCase();

  let companyName = opp.companyName || opp.company_name;
  let contactPerson = opp.contact_name || opp.contactPerson || opp.requester || opp.contactInfo?.name;

  const isSocial = url.includes('facebook.com') || url.includes('instagram.com') || url.includes('reddit.com') || url.includes('linkedin.com/posts') || url.includes('linkedin.com/feed');

  // Clean invalid fallback strings
  if (companyName === 'Not available' || companyName === 'Client Requester' || companyName === 'Not found') {
    companyName = '';
  }
  if (contactPerson === 'Not available' || contactPerson === 'Not found') {
    contactPerson = '';
  }

  // Attempt to extract company name from title
  if (!companyName && title) {
    const parts = title.split(/[-|:|—]/);
    if (parts.length > 1) {
      const candidate = parts[0].trim();
      if (candidate.length > 2 && !/looking for|hiring|need|seeking/i.test(candidate)) {
        companyName = candidate;
      }
    }
  }

  // Attempt to extract requester name from social post text
  if (!contactPerson && isSocial) {
    const nameMatch = snippet.match(/(?:by|posted by|author|from|requester|hi,?\s+i'm|hi,?\s+i am)\s*[:|-]?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
    if (nameMatch && nameMatch[1]) {
      contactPerson = nameMatch[1];
    }
  }

  if (isSocial && !companyName) {
    companyName = 'Not publicly identifiable';
  }

  if (!companyName) {
    companyName = 'Not publicly available';
  }
  if (!contactPerson) {
    contactPerson = 'Not publicly available';
  }

  const hasRealCompany = companyName !== 'Not publicly identifiable' && companyName !== 'Not publicly available';
  const hasRealPerson = contactPerson !== 'Not publicly available';

  let identityType = 'UNKNOWN';
  if (hasRealCompany && hasRealPerson) {
    identityType = 'COMPANY_AND_PERSON';
  } else if (hasRealCompany) {
    identityType = 'COMPANY';
  } else if (hasRealPerson) {
    identityType = 'PERSON';
  }

  let identityConfidence = 'LOW';
  if (hasRealCompany && hasRealPerson) identityConfidence = 'HIGH';
  else if (hasRealCompany || hasRealPerson) identityConfidence = 'MEDIUM';

  return {
    identityType,
    companyName,
    company_name: companyName,
    contactPerson,
    contact_name: contactPerson,
    requester: contactPerson,
    identityConfidence
  };
}

module.exports = {
  isValidPublicUrl,
  detectSourceFromUrl,
  generateFingerprint,
  validateAndCleanOpportunity,
  extractStructuredIdentity
};
