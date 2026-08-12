export interface SearchProviderResult {
  companyName: string;
  website: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceSnippet: string;
  sourceType: 'OFFICIAL_WEBSITE' | 'PUBLIC_WEB_RESULT' | 'GOOGLE_MAPS' | 'COMPANY_DIRECTORY';
  discoveredAt: string;
  location?: string;
}

export class SerpApiSearchProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || (typeof process !== 'undefined' ? (process.env.SERPAPI_API_KEY || process.env.VITE_SERPAPI_API_KEY || '') : '');
  }

  async search(query: string, location?: string, maxResults: number = 10): Promise<SearchProviderResult[]> {
    if (!this.apiKey) {
      throw new Error('SERPAPI_UNCONFIGURED: SERPAPI_API_KEY environment variable is not configured on server.');
    }

    const searchQuery = location ? `${query} in ${location}` : query;
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(searchQuery)}&engine=google&api_key=${this.apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`SERPAPI_HTTP_ERROR_${response.status}: SerpAPI query failed with status ${response.status} (${errText.slice(0, 100)})`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`SERPAPI_RESPONSE_ERROR: ${data.error}`);
    }

    const results: SearchProviderResult[] = [];
    const organic = data.organic_results || [];
    const localPlaces = data.local_results?.places || data.local_results || [];

    // Parse organic search results
    for (const item of organic) {
      if (!item.link || item.link.includes('google.com') || item.link.includes('wikipedia.org') || item.link.includes('youtube.com')) {
        continue;
      }

      try {
        const urlObj = new URL(item.link);
        const domain = urlObj.hostname.replace(/^www\./i, '');
        const companyName = item.title
          ? item.title.split(/[-|:|—]/)[0].trim()
          : domain.split('.')[0];

        results.push({
          companyName: companyName || domain,
          website: `${urlObj.protocol}//${urlObj.hostname}`,
          sourceUrl: item.link,
          sourceTitle: item.title || companyName,
          sourceSnippet: item.snippet || `Web search result for ${query}`,
          sourceType: 'PUBLIC_WEB_RESULT',
          discoveredAt: new Date().toISOString(),
          location: location || ''
        });
      } catch (e) {
        // Skip invalid URL
      }
    }

    // Parse local map places results
    for (const place of localPlaces) {
      if (place.title && (place.website || place.link)) {
        const targetWebsite = place.website || place.link || `https://maps.google.com/?q=${encodeURIComponent(place.title)}`;
        results.push({
          companyName: place.title,
          website: targetWebsite.startsWith('http') ? targetWebsite : `https://${targetWebsite}`,
          sourceUrl: place.link || `https://maps.google.com/?q=${encodeURIComponent(place.title)}`,
          sourceTitle: `${place.title} - ${place.type || 'Google Maps'}`,
          sourceSnippet: place.address ? `Located at ${place.address}` : `Local place result for ${query}`,
          sourceType: 'GOOGLE_MAPS',
          discoveredAt: new Date().toISOString(),
          location: place.address || location || ''
        });
      }
    }

    return results.slice(0, maxResults);
  }
}
