/**
 * CLAY DATA AUTOMATION PROVIDER STUB
 */
class ClayProvider {
  constructor() {
    this.name = 'Clay Signal Provider';
    this.type = 'SignalProvider';
    this.apiKey = process.env.CLAY_API_KEY || null;
  }

  async fetchSignals(domain) {
    if (!this.apiKey) {
      return { success: false, reason: 'CLAY_API_KEY_NOT_CONFIGURED', signals: [] };
    }
    return { success: true, signals: [] };
  }
}

module.exports = ClayProvider;
