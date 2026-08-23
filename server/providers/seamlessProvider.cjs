/**
 * SEAMLESS.AI CONTACT ENRICHMENT PROVIDER STUB
 */
class SeamlessProvider {
  constructor() {
    this.name = 'Seamless.AI Contact Provider';
    this.type = 'PersonEnrichmentProvider';
    this.apiKey = process.env.SEAMLESS_API_KEY || null;
  }

  async enrichPerson(personName, companyName) {
    if (!this.apiKey) {
      return { success: false, reason: 'SEAMLESS_API_KEY_NOT_CONFIGURED', contact: null };
    }
    return { success: true, contact: { name: personName, company: companyName } };
  }
}

module.exports = SeamlessProvider;
