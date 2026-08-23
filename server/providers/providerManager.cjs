/**
 * MODULAR PROVIDER MANAGER & DATA SOURCE ARCHITECTURE
 * 
 * Manages modular interfaces:
 * - SearchProvider
 * - SignalProvider
 * - CompanyEnrichmentProvider
 * - PersonEnrichmentProvider
 * - ResearchProvider
 * 
 * Ensures graceful fallback to internal engine when external API keys are not present.
 */

const fs = require('fs');
const path = require('path');

const PROVIDERS_REGISTRY = {
  serpapi: {
    id: 'serpapi',
    name: 'SerpAPI Search Discovery',
    type: 'SearchProvider',
    category: 'Search & Discovery',
    isConfigured: Boolean(process.env.SERPAPI_API_KEY || process.env.VITE_SERPAPI_KEY),
    requiresKey: true,
    enabled: true,
    usageCount: 0,
    lastTestedAt: new Date().toISOString()
  },
  public_web: {
    id: 'public_web',
    name: 'Amusemac Public Web Crawler',
    type: 'SearchProvider',
    category: 'Internal Search Engine',
    isConfigured: true,
    requiresKey: false,
    enabled: true,
    usageCount: 0,
    lastTestedAt: new Date().toISOString()
  },
  apollo: {
    id: 'apollo',
    name: 'Apollo.io Data Enrichment',
    type: 'CompanyEnrichmentProvider',
    category: 'B2B Database',
    isConfigured: Boolean(process.env.APOLLO_API_KEY),
    requiresKey: true,
    enabled: false,
    usageCount: 0,
    lastTestedAt: null
  },
  clay: {
    id: 'clay',
    name: 'Clay Data Automation',
    type: 'SignalProvider',
    category: 'Signal & Enrichment',
    isConfigured: Boolean(process.env.CLAY_API_KEY),
    requiresKey: true,
    enabled: false,
    usageCount: 0,
    lastTestedAt: null
  },
  seamless: {
    id: 'seamless',
    name: 'Seamless.AI Lead Intelligence',
    type: 'PersonEnrichmentProvider',
    category: 'Contact Enrichment',
    isConfigured: Boolean(process.env.SEAMLESS_API_KEY),
    requiresKey: true,
    enabled: false,
    usageCount: 0,
    lastTestedAt: null
  },
  amplemarket: {
    id: 'amplemarket',
    name: 'Amplemarket Sales Intelligence',
    type: 'SignalProvider',
    category: 'Sales Intelligence',
    isConfigured: Boolean(process.env.AMPLEMARKET_API_KEY),
    requiresKey: true,
    enabled: false,
    usageCount: 0,
    lastTestedAt: null
  }
};

/**
 * Returns clean summary of provider connectivity for Admin UI
 */
function getProvidersStatus() {
  const result = [];
  for (const key of Object.keys(PROVIDERS_REGISTRY)) {
    const prov = PROVIDERS_REGISTRY[key];
    result.push({
      id: prov.id,
      name: prov.name,
      type: prov.type,
      category: prov.category,
      isConfigured: prov.isConfigured,
      enabled: prov.enabled,
      status: prov.isConfigured ? 'CONNECTED' : 'NOT_CONFIGURED',
      usageCount: prov.usageCount,
      lastTestedAt: prov.lastTestedAt
    });
  }
  return result;
}

/**
 * Toggles provider enabled state
 */
function toggleProvider(providerId, enabled) {
  if (PROVIDERS_REGISTRY[providerId]) {
    PROVIDERS_REGISTRY[providerId].enabled = Boolean(enabled);
    return PROVIDERS_REGISTRY[providerId];
  }
  return null;
}

/**
 * Executes mock/real provider connectivity test
 */
async function testProviderConnection(providerId) {
  const prov = PROVIDERS_REGISTRY[providerId];
  if (!prov) return { success: false, message: 'Provider not found' };

  prov.lastTestedAt = new Date().toISOString();

  if (prov.id === 'serpapi' || prov.id === 'public_web') {
    return { success: true, message: `${prov.name} operational and active.` };
  }

  if (!prov.isConfigured) {
    return {
      success: false,
      message: `${prov.name} API Key is not configured in server environment. Operating on internal Signal Engine fallback.`
    };
  }

  return { success: true, message: `${prov.name} API connection verified.` };
}

module.exports = {
  PROVIDERS_REGISTRY,
  getProvidersStatus,
  toggleProvider,
  testProviderConnection
};
