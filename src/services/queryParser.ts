export interface ParsedQueryIntent {
  rawQuery: string;
  inferredIndustry?: string;
  inferredLocation?: string;
  inferredSignal?: string;
  inferredService?: string;
  appliedFilterCount: number;
}

export function parseNaturalLanguageQuery(query: string): ParsedQueryIntent {
  const q = query.toLowerCase().trim();

  let inferredIndustry: string | undefined = undefined;
  let inferredLocation: string | undefined = undefined;
  let inferredSignal: string | undefined = undefined;
  let inferredService: string | undefined = undefined;
  let filterCount = 0;

  // 1. Location Detection
  if (q.includes('mumbai') || q.includes('bombay')) {
    inferredLocation = 'Mumbai';
    filterCount++;
  } else if (q.includes('delhi') || q.includes('ncr') || q.includes('gurgaon') || q.includes('noida')) {
    inferredLocation = 'Delhi NCR';
    filterCount++;
  } else if (q.includes('bengaluru') || q.includes('bangalore')) {
    inferredLocation = 'Bengaluru';
    filterCount++;
  } else if (q.includes('hyderabad')) {
    inferredLocation = 'Hyderabad';
    filterCount++;
  }

  // 2. Industry Detection
  if (q.includes('fashion') || q.includes('apparel') || q.includes('clothing')) {
    inferredIndustry = 'Fashion & Apparel';
    filterCount++;
  } else if (q.includes('d2c') || q.includes('e-commerce') || q.includes('ecommerce')) {
    inferredIndustry = 'D2C & E-Commerce';
    filterCount++;
  } else if (q.includes('fmcg') || q.includes('food') || q.includes('packaged food')) {
    inferredIndustry = 'FMCG & Packaged Foods';
    filterCount++;
  } else if (q.includes('beauty') || q.includes('cosmetics') || q.includes('skincare')) {
    inferredIndustry = 'Beauty & Personal Care';
    filterCount++;
  } else if (q.includes('jewellery') || q.includes('jewelry') || q.includes('luxury')) {
    inferredIndustry = 'Jewellery & Luxury Goods';
    filterCount++;
  } else if (q.includes('real estate') || q.includes('property') || q.includes('builder')) {
    inferredIndustry = 'Real Estate & Construction';
    filterCount++;
  } else if (q.includes('hotel') || q.includes('hospitality') || q.includes('resort')) {
    inferredIndustry = 'Hospitality & Hotels';
    filterCount++;
  } else if (q.includes('auto') || q.includes('automotive') || q.includes('car')) {
    inferredIndustry = 'Automotive & Mobility';
    filterCount++;
  }

  // 3. Buying Signal Detection
  if (q.includes('launch') || q.includes('collection') || q.includes('new product')) {
    inferredSignal = 'Product Launch';
    filterCount++;
  } else if (q.includes('funding') || q.includes('raised') || q.includes('series a') || q.includes('seed')) {
    inferredSignal = 'Funding Raised';
    filterCount++;
  } else if (q.includes('expand') || q.includes('expansion') || q.includes('store') || q.includes('retail')) {
    inferredSignal = 'Retail Expansion';
    filterCount++;
  } else if (q.includes('hiring') || q.includes('recruit') || q.includes('team')) {
    inferredSignal = 'Marketing Hiring';
    filterCount++;
  } else if (q.includes('festive') || q.includes('diwali') || q.includes('campaign')) {
    inferredSignal = 'Festive Campaign';
    filterCount++;
  }

  // 4. Service Requirement Detection
  if (q.includes('branded content') || q.includes('brand film') || q.includes('commercial')) {
    inferredService = 'Advertising Film Production';
    filterCount++;
  } else if (q.includes('set design') || q.includes('art direction') || q.includes('production design')) {
    inferredService = 'Production Design';
    filterCount++;
  } else if (q.includes('video') || q.includes('dvc') || q.includes('ad')) {
    inferredService = 'Commercial/Ad Film Production';
    filterCount++;
  }

  return {
    rawQuery: query,
    inferredIndustry,
    inferredLocation,
    inferredSignal,
    inferredService,
    appliedFilterCount: filterCount
  };
}
