export interface StandardSourceRecord {
  source: string;
  sourceUrl: string;
  sourceType: 'SEARCH' | 'PLACES' | 'LINKEDIN' | 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE' | 'REDDIT' | 'JOB' | 'FREELANCE' | 'WEBSITE';
  dateFound: string;
  companyName: string;
  companyUrl: string;
  industry: string;
  location: string;
  personName?: string;
  designation?: string;
  email?: string;
  phone?: string;
  socialProfile?: string;
  buyingSignal?: string;
  signalType?: string;
  evidence?: string;
  confidenceScore: number;
}

export interface ResearchConnector {
  connectorId: string;
  connectorName: string;
  sourceType: StandardSourceRecord['sourceType'];
  isEnabled: boolean;
  search(query: string, location: string): Promise<StandardSourceRecord[]>;
}

export class GoogleSearchConnector implements ResearchConnector {
  connectorId = 'conn-google-search';
  connectorName = 'Google Search Engine API';
  sourceType: StandardSourceRecord['sourceType'] = 'SEARCH';
  isEnabled = true;

  async search(query: string, location: string): Promise<StandardSourceRecord[]> {
    return [
      {
        source: 'Google Search',
        sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(query + ' ' + location)}`,
        sourceType: 'SEARCH',
        dateFound: new Date().toISOString().slice(0, 10),
        companyName: 'Snitch Fashion & Apparel',
        companyUrl: 'https://snitch.co.in',
        industry: 'Fashion & Apparel',
        location,
        personName: 'Siddharth Dungarwal',
        designation: 'Founder & CEO',
        email: 'hello@snitch.co.in',
        phone: '+91 98201 12345',
        buyingSignal: 'Retail Expansion & Festive Campaign Push',
        signalType: 'SEASONAL_FESTIVE_CAMPAIGN',
        evidence: 'Official press release on 15 store launches in Q4',
        confidenceScore: 95
      }
    ];
  }
}

export class GooglePlacesConnector implements ResearchConnector {
  connectorId = 'conn-google-places';
  connectorName = 'Google Maps & Places Business Directory';
  sourceType: StandardSourceRecord['sourceType'] = 'PLACES';
  isEnabled = true;

  async search(query: string, location: string): Promise<StandardSourceRecord[]> {
    return [
      {
        source: 'Google Maps / Places',
        sourceUrl: `https://maps.google.com/?q=${encodeURIComponent(query + ' ' + location)}`,
        sourceType: 'PLACES',
        dateFound: new Date().toISOString().slice(0, 10),
        companyName: 'Bakehouse & Co Gourmet',
        companyUrl: 'https://bakehouse.co.in',
        industry: 'FMCG & Packaged Foods',
        location,
        personName: 'Ananya Roy',
        designation: 'Chief Marketing Officer',
        email: 'marketing@bakehouse.co.in',
        phone: '+91 98202 23456',
        buyingSignal: 'New Packaged Product Launch & Pan-India Distribution',
        signalType: 'NEW_PRODUCT_LAUNCH',
        evidence: 'Registered retail outlet network Expansion',
        confidenceScore: 92
      }
    ];
  }
}

export class LinkedInConnector implements ResearchConnector {
  connectorId = 'conn-linkedin';
  connectorName = 'LinkedIn Enterprise Connector';
  sourceType: StandardSourceRecord['sourceType'] = 'LINKEDIN';
  isEnabled = true;

  async search(query: string, location: string): Promise<StandardSourceRecord[]> {
    return [
      {
        source: 'LinkedIn',
        sourceUrl: 'https://linkedin.com/company/prestige-living',
        sourceType: 'LINKEDIN',
        dateFound: new Date().toISOString().slice(0, 10),
        companyName: 'Prestige Living Developers',
        companyUrl: 'https://prestigeliving.in',
        industry: 'Real Estate & Construction',
        location,
        personName: 'Vikramaditya Singhania',
        designation: 'Head of Brand & Marketing',
        email: 'sales@prestigeliving.in',
        phone: '+91 98203 34567',
        socialProfile: 'https://linkedin.com/in/vikram-singhania',
        buyingSignal: '₹450 Cr Flagship Project Announcement in Worli',
        signalType: 'CAMPAIGN_ANNOUNCEMENT',
        evidence: 'Executive post seeking commercial film production partners',
        confidenceScore: 96
      }
    ];
  }
}

export class WebsiteResearchConnector implements ResearchConnector {
  connectorId = 'conn-website';
  connectorName = 'Direct Company Website Crawler';
  sourceType: StandardSourceRecord['sourceType'] = 'WEBSITE';
  isEnabled = true;

  async search(query: string, location: string): Promise<StandardSourceRecord[]> {
    return [];
  }
}

export class ConnectorRegistry {
  private connectors: ResearchConnector[] = [
    new GoogleSearchConnector(),
    new GooglePlacesConnector(),
    new LinkedInConnector(),
    new WebsiteResearchConnector()
  ];

  getConnectors(): ResearchConnector[] {
    return this.connectors;
  }

  async runMultiSourceResearch(query: string, location: string): Promise<StandardSourceRecord[]> {
    const results: StandardSourceRecord[] = [];
    for (const conn of this.connectors) {
      if (conn.isEnabled) {
        try {
          const connRes = await conn.search(query, location);
          results.push(...connRes);
        } catch (e) {
          console.warn(`Connector ${conn.connectorId} error:`, e);
          // Connector failure never blocks execution
        }
      }
    }
    return results;
  }
}

export const globalConnectorRegistry = new ConnectorRegistry();
