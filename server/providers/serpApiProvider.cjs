/**
 * SERPAPI SEARCH PROVIDER MODULE
 */
const { executeSerpApiSearch } = require('../serpApiEngine.cjs');

class SerpApiProvider {
  constructor() {
    this.name = 'SerpAPI Discovery Provider';
    this.type = 'SearchProvider';
  }

  async search({ query, location, num = 10 }) {
    try {
      const res = await executeSerpApiSearch(query, location, num);
      return res;
    } catch (e) {
      console.warn('[SerpApiProvider Error]:', e.message);
      return { success: false, rawOrganicItems: [], error: e.message };
    }
  }
}

module.exports = SerpApiProvider;
