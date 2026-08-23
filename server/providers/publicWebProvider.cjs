/**
 * PUBLIC WEB PROVIDER FALLBACK MODULE
 */
class PublicWebProvider {
  constructor() {
    this.name = 'Amusemac Public Web Crawler';
    this.type = 'SearchProvider';
  }

  async search({ query, location, num = 10 }) {
    return {
      success: true,
      rawOrganicItems: []
    };
  }
}

module.exports = PublicWebProvider;
