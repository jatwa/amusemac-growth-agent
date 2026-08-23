/**
 * APOLLO.IO ENRICHMENT PROVIDER STUB
 */
class ApolloProvider {
  constructor() {
    this.name = 'Apollo.io Enrichment Provider';
    this.type = 'CompanyEnrichmentProvider';
    this.apiKey = process.env.APOLLO_API_KEY || null;
  }

  async enrichCompany(companyName) {
    if (!this.apiKey) {
      return { success: false, reason: 'APOLLO_API_KEY_NOT_CONFIGURED', data: null };
    }
    // Stub for modular external API integration when credentials are connected
    return { success: true, data: { companyName, industry: 'Creative Services' } };
  }
}

module.exports = ApolloProvider;
