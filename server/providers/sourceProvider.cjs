const { BUYER_OPPORTUNITY_CATALOG } = require('../buyerOpportunityData.cjs');
const { calculateBuyerIntentScore, matchAmusemacServices, parseNaturalLanguageQuery } = require('../intentEngine.cjs');
const { isValidPublicUrl, validateAndCleanOpportunity, generateFingerprint } = require('../sourceValidator.cjs');
const { PublicWebSearchProvider } = require('./publicWebSearchProvider.cjs');

/**
 * Provider Status Registry
 */
const PROVIDERS_REGISTRY = [
  {
    id: 'PUBLIC_WEB',
    name: 'Public Web Search Discovery',
    status: 'IMPLEMENTED',
    statusMessage: 'Live — Search index query & buyer intent filter active',
    isImplemented: true
  },
  {
    id: 'COMPANY_RFP',
    name: 'Corporate RFP & Tender Index',
    status: 'IMPLEMENTED',
    statusMessage: 'Live — Public RFP & procurement feed active',
    isImplemented: true
  },
  {
    id: 'LOCAL_DEMO',
    name: 'Local Demo Dataset Fallback',
    status: 'IMPLEMENTED',
    statusMessage: 'Active — Fallback development catalog',
    isImplemented: true
  },
  {
    id: 'LINKEDIN_PUBLIC',
    name: 'LinkedIn Public Jobs & Posts',
    status: 'REQUIRES_OFFICIAL_API',
    statusMessage: 'NOT IMPLEMENTED — REQUIRES OFFICIAL API/INTEGRATION',
    isImplemented: false
  },
  {
    id: 'UPWORK_PUBLIC',
    name: 'Upwork Public Projects',
    status: 'REQUIRES_OFFICIAL_API',
    statusMessage: 'NOT IMPLEMENTED — REQUIRES OFFICIAL API/INTEGRATION',
    isImplemented: false
  },
  {
    id: 'FREELANCER_PUBLIC',
    name: 'Freelancer Public Board',
    status: 'REQUIRES_OFFICIAL_API',
    statusMessage: 'NOT IMPLEMENTED — REQUIRES OFFICIAL API/INTEGRATION',
    isImplemented: false
  },
  {
    id: 'CONTRA_PUBLIC',
    name: 'Contra Independent Projects',
    status: 'REQUIRES_OFFICIAL_API',
    statusMessage: 'NOT IMPLEMENTED — REQUIRES OFFICIAL API/INTEGRATION',
    isImplemented: false
  },
  {
    id: 'PEOPLEPERHOUR_PUBLIC',
    name: 'PeoplePerHour Projects',
    status: 'REQUIRES_OFFICIAL_API',
    statusMessage: 'NOT IMPLEMENTED — REQUIRES OFFICIAL API/INTEGRATION',
    isImplemented: false
  },
  {
    id: 'WELLFOUND_PUBLIC',
    name: 'Wellfound Startup Projects',
    status: 'REQUIRES_OFFICIAL_API',
    statusMessage: 'NOT IMPLEMENTED — REQUIRES OFFICIAL API/INTEGRATION',
    isImplemented: false
  }
];

/**
 * Abstract OpportunitySourceProvider Base Class
 */
class OpportunitySourceProvider {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  async search(queryOptions) {
    throw new Error('Method search() must be implemented by subclass');
  }
}

/**
 * Public Web Opportunity Provider Wrapper Class
 */
class PublicWebOpportunityProvider extends OpportunitySourceProvider {
  constructor() {
    super('PUBLIC_WEB', 'Public Web Search Discovery');
    this.realProvider = new PublicWebSearchProvider();
  }

  async getCombinedQuota() {
    return await this.realProvider.getCombinedQuota();
  }

  async executeSerpApiQuery(singleQuery, options = {}) {
    return await this.realProvider.executeSerpApiQuery(singleQuery, options);
  }

  async search(options = {}) {
    return await this.realProvider.search(options);
  }
}

/**
 * Local Demo Dataset Provider Class (ONLY used when demo explicitly requested)
 */
class LocalDemoProvider extends OpportunitySourceProvider {
  constructor() {
    super('LOCAL_DEMO', 'Local Demo Dataset Fallback');
  }

  async search({ query = '', location = '', filters = {} }) {
    const cleanQuery = (query || '').toLowerCase().trim();
    const serviceFilter = (filters.service || '').toLowerCase().trim();

    let matched = BUYER_OPPORTUNITY_CATALOG.map(item => ({
      ...item,
      id: item.id || `DEMO-LEAD-${Math.random()}`,
      leadId: item.leadId || item.id || `DEMO-LEAD-${Math.random()}`,
      dataStatus: 'DEMO_LOCAL',
      isDemoUsed: true,
      scoreTier: item.intentType || 'HOT',
      leadQualityScore: item.leadQualityScore || 85,
      aiScore: item.aiScore || 85
    }));

    if (cleanQuery) {
      matched = matched.filter(item =>
        item.title.toLowerCase().includes(cleanQuery) ||
        item.requirement.toLowerCase().includes(cleanQuery) ||
        item.companyName.toLowerCase().includes(cleanQuery) ||
        item.matchedServices.some(s => s.toLowerCase().includes(cleanQuery))
      );
    }

    if (serviceFilter) {
      matched = matched.filter(item =>
        item.matchedServices.some(s => s.toLowerCase().includes(serviceFilter))
      );
    }

    return {
      success: true,
      status: 'DEMO_FALLBACK',
      provider: this.id,
      total: matched.length,
      leads: matched,
      metrics: {
        requestedCount: matched.length,
        rawResultsCount: matched.length,
        candidatesCount: matched.length,
        qualifiedLeadsCount: matched.length,
        rejectedProvidersCount: 0,
        rejectedIrrelevantCount: 0,
        duplicateCount: 0,
        isDemoUsed: true
      }
    };
  }
}

module.exports = {
  PROVIDERS_REGISTRY,
  OpportunitySourceProvider,
  PublicWebOpportunityProvider,
  LocalDemoProvider
};
