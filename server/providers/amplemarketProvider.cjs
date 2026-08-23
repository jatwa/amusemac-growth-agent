/**
 * AMPLEMARKET SALES INTELLIGENCE PROVIDER STUB
 */
class AmplemarketProvider {
  constructor() {
    this.name = 'Amplemarket Intelligence Provider';
    this.type = 'SignalProvider';
    this.apiKey = process.env.AMPLEMARKET_API_KEY || null;
  }

  async getCompanySignals(companyDomain) {
    if (!this.apiKey) {
      return { success: false, reason: 'AMPLEMARKET_API_KEY_NOT_CONFIGURED', signals: [] };
    }
    return { success: true, signals: [] };
  }
}

module.exports = AmplemarketProvider;
