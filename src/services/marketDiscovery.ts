import { ClientProfile, RawCompany } from '../types/lead';

/**
 * Sector Expansion Engine: Generates targeted sector search queries from Client ICP
 */
export function generateIcpSearchQueries(clientProfile: ClientProfile, targetLocation: string, userQuery?: string): string[] {
  const queries: string[] = [];

  if (userQuery && userQuery.trim().length > 0) {
    queries.push(`${userQuery} ${targetLocation}`.trim());
  }

  // Generate queries across target categories
  const categories = clientProfile.targetCategories.slice(0, 10);
  for (const cat of categories) {
    queries.push(`${cat} brands ${targetLocation}`.trim());
  }

  // Add service-matched buyer queries
  for (const service of clientProfile.services.slice(0, 4)) {
    queries.push(`buyers of ${service} in ${targetLocation}`.trim());
    queries.push(`companies hiring for ${service} ${targetLocation}`.trim());
  }

  return Array.from(new Set(queries));
}

/**
 * Raw Prospect Harvester: Simulated multi-source harvester delivering raw un-qualified prospect candidates
 */
export function harvestRawProspectPool(
  clientProfile: ClientProfile,
  targetLocation: string,
  userQuery?: string,
  requestedCount: number = 20
): RawCompany[] {
  const rawPool: RawCompany[] = [];
  const qLower = (userQuery || '').toLowerCase().trim();

  // Dynamic industry & brand catalog mapping
  const masterCatalog = [
    // Fashion & Apparel
    { name: 'Snitch Fashion', industry: 'Fashion & Apparel', category: 'D2C / E-Commerce', desc: 'Fast-growing men\'s D2C fashion apparel brand launching 15 retail stores and digital ad campaigns.', phone: '+91 98201 12345', email: 'marketing@snitch.co.in', website: 'https://snitch.co.in', maps: 'https://maps.google.com/?q=Snitch+Fashion+' + targetLocation, socials: ['https://linkedin.com/company/snitch-apparel'] },
    { name: 'FabAlley Apparel', industry: 'Fashion & Apparel', category: 'D2C / Fashion', desc: 'Women\'s online fast-fashion label launching autumn festive campaign and video ad production.', phone: '+91 98201 22334', email: 'contact@faballey.com', website: 'https://faballey.com', maps: 'https://maps.google.com/?q=FabAlley+Fashion+' + targetLocation, socials: ['https://instagram.com/faballey'] },

    // Food & Beverage / Restaurants
    { name: 'Bakehouse & Co.', industry: 'Food & Beverage', category: 'FMCG / Retail', desc: 'Artisanal bakery and gourmet packaged food brand launching national retail distribution.', phone: '+91 98202 23456', email: 'brand@bakehouseco.in', website: 'https://bakehouseco.in', maps: 'https://maps.google.com/?q=Bakehouse+Co+' + targetLocation, socials: ['https://instagram.com/bakehouse.co'] },
    { name: 'Olive Bar & Kitchen', industry: 'Food & Beverage', category: 'Restaurants & Dining', desc: 'Premium fine dining restaurant group expanding with 4 new coastal dining venues.', phone: '+91 98202 33445', email: 'hello@olivebarandkitchen.com', website: 'https://olivebarandkitchen.com', maps: 'https://maps.google.com/?q=Olive+Bar+Kitchen+' + targetLocation, socials: ['https://instagram.com/olivemumbai'] },

    // Film & Video Production
    { name: 'Apex Motion Pictures', industry: 'Film Production', category: 'Production House', desc: 'Independent film and video production house specializing in cinema and commercial ad shoots.', phone: '+91 98209 90123', email: 'info@apexmotionpictures.com', website: 'https://apexmotionpictures.com', maps: 'https://maps.google.com/?q=Apex+Motion+Pictures+' + targetLocation, socials: ['https://linkedin.com/company/apex-motion-pictures'] },
    { name: 'Starlight CineWorks', industry: 'Film Production', category: 'Film & Media', desc: 'Feature film VFX and post-production studio producing OTT series and TV commercial ads.', phone: '+91 98209 88776', email: 'contact@starlightcineworks.in', website: 'https://starlightcineworks.in', maps: 'https://maps.google.com/?q=Starlight+CineWorks+' + targetLocation, socials: ['https://vimeo.com/starlightcineworks'] },

    // Tech & AI Startups
    { name: 'Aether Motors India', industry: 'Automotive', category: 'EV / Consumer Tech', desc: 'Next-gen electric two-wheeler manufacturer launching flagship scooter line and commercial TVCs.', phone: '+91 98206 67890', email: 'media@aethermotors.in', website: 'https://aethermotors.in', maps: 'https://maps.google.com/?q=Aether+Motors+' + targetLocation, socials: ['https://linkedin.com/company/aether-motors-india'] },
    { name: 'InVideo AI Tech', industry: 'Software / AI', category: 'AI Startup', desc: 'Generative AI video creation startup expanding engineering team and B2B marketing push.', phone: '+91 98206 11223', email: 'pr@invideo.io', website: 'https://invideo.io', maps: 'https://maps.google.com/?q=InVideo+AI+' + targetLocation, socials: ['https://linkedin.com/company/invideo'] },

    // Interior Design & Home Decor
    { name: 'Aura Home Decor', industry: 'Home & Furnishing', category: 'D2C / Interior Design', desc: 'D2C home aesthetics and furniture brand launching festive set design catalog and video ads.', phone: '+91 98208 89012', email: 'hello@aurahome.in', website: 'https://aurahome.in', maps: 'https://maps.google.com/?q=Aura+Home+Decor+' + targetLocation, socials: ['https://instagram.com/aurahome.in'] },
    { name: 'Livspace Interior Studio', industry: 'Interior Design', category: 'Interior & Architecture', desc: 'Tech-enabled interior design and home renovation service launching national ad campaign.', phone: '+91 98208 33445', email: 'projects@livspace.com', website: 'https://livspace.com', maps: 'https://maps.google.com/?q=Livspace+Interior+' + targetLocation, socials: ['https://linkedin.com/company/livspace'] },

    // Real Estate
    { name: 'Prestige Living Developers', industry: 'Real Estate', category: 'Real Estate & Infrastructure', desc: 'Premium luxury residential developer launching a 40-story beachfront luxury project.', phone: '+91 98203 34567', email: 'corporate@prestigeliving.in', website: 'https://prestigeliving.in', maps: 'https://maps.google.com/?q=Prestige+Living+' + targetLocation, socials: ['https://linkedin.com/company/prestige-living-mumbai'] },

    // Luxury & Jewellery
    { name: 'Moksh Jewellery Studio', industry: 'Jewellery & Luxury', category: 'Luxury / Retail', desc: 'High-end heritage diamond and bridal gold jewellery house preparing national campaign shoot.', phone: '+91 98204 45678', email: 'contact@mokshjewels.com', website: 'https://mokshjewels.com', maps: 'https://maps.google.com/?q=Moksh+Jewels+' + targetLocation, socials: ['https://instagram.com/mokshjewels'] },

    // Hospitality & Hotels
    { name: 'Saffron Bay Resorts', industry: 'Hospitality & Hotels', category: 'Luxury Hospitality', desc: 'Bespoke luxury boutique hotel chain opening 3 new eco-resorts with requirement for promo films.', phone: '+91 98207 78901', email: 'marketing@saffronbayresorts.com', website: 'https://saffronbayresorts.com', maps: 'https://maps.google.com/?q=Saffron+Bay+Resorts+' + targetLocation, socials: ['https://instagram.com/saffronbayresorts'] }
  ];

  // Filter candidates matching user query if user query is present
  let filteredCandidates = masterCatalog;

  if (qLower.length > 0) {
    const queryTokens = qLower.split(/\s+/).filter(w => w.length > 2 && !['in', 'for', 'the', 'and', 'with', 'brands', 'companies', 'startups', 'studios', 'agencies'].includes(w));

    const matched = masterCatalog.filter(c => {
      const targetStr = `${c.industry} ${c.category} ${c.name} ${c.desc}`.toLowerCase();
      if (targetStr.includes(qLower)) return true;

      return queryTokens.some(token => {
        if (targetStr.includes(token)) return true;
        if ((token.startsWith('restauran') || token === 'dining' || token === 'food' || token === 'bakery') && targetStr.includes('food')) return true;
        if ((token.startsWith('fashion') || token === 'apparel' || token === 'clothing') && targetStr.includes('fashion')) return true;
        if ((token.startsWith('film') || token === 'cinema' || token === 'movie' || token === 'production') && targetStr.includes('film')) return true;
        if ((token === 'ai' || token === 'tech' || token === 'software') && targetStr.includes('tech')) return true;
        return false;
      });
    });

    if (matched.length > 0) {
      filteredCandidates = matched;
    } else {
      // Dynamic query-synthesized candidate generation for specific niche queries
      const normalizedQueryName = qLower
        .replace(/in\s+[a-z\s]+/i, '')
        .replace(/(companies|brands|startups|studios|agencies|services)/i, '')
        .trim();
      const capitalizedTopic = normalizedQueryName.charAt(0).toUpperCase() + normalizedQueryName.slice(1);

      filteredCandidates = [
        {
          name: `${capitalizedTopic || 'Growth'} Enterprise Group`,
          industry: capitalizedTopic || 'Commercial Services',
          category: 'Qualified Prospect',
          desc: `Leading provider of ${userQuery} solutions expanding commercial operations in ${targetLocation}.`,
          phone: '+91 98211 55667',
          email: `contact@${(normalizedQueryName || 'enterprise').replace(/\s+/g, '')}group.in`,
          website: `https://${(normalizedQueryName || 'enterprise').replace(/\s+/g, '')}group.in`,
          maps: `https://maps.google.com/?q=${encodeURIComponent(userQuery || '')}`,
          socials: [`https://linkedin.com/company/${(normalizedQueryName || 'enterprise')}-group`]
        },
        {
          name: `${capitalizedTopic || 'Apex'} Solutions`,
          industry: capitalizedTopic || 'Commercial Services',
          category: 'Qualified Prospect',
          desc: `Specialized ${userQuery || ''} vendor servicing high-growth B2B brands in ${targetLocation}.`,
          phone: '+91 98211 88990',
          email: `info@${(normalizedQueryName || 'apex').replace(/\s+/g, '')}solutions.in`,
          website: `https://${(normalizedQueryName || 'apex').replace(/\s+/g, '')}solutions.in`,
          maps: `https://maps.google.com/?q=${encodeURIComponent((userQuery || '') + ' ' + targetLocation)}`,
          socials: [`https://linkedin.com/company/${(normalizedQueryName || 'apex')}-solutions`]
        }
      ];
    }
  }

  let idCounter = 100;
  const queries = generateIcpSearchQueries(clientProfile, targetLocation, userQuery);

  for (let i = 0; i < Math.max(requestedCount, filteredCandidates.length); i++) {
    const brand = filteredCandidates[i % filteredCandidates.length];
    const query = queries[i % queries.length];

    rawPool.push({
      companyId: `RAW-${Date.now()}-${idCounter++}`,
      companyName: brand.name + (i >= filteredCandidates.length ? ` ${Math.floor(i / filteredCandidates.length) + 1}` : ''),
      industry: brand.industry,
      category: brand.category,
      location: targetLocation,
      website: brand.website,
      phone: brand.phone,
      email: brand.email,
      socialLinks: brand.socials,
      mapsUrl: brand.maps,
      description: brand.desc,
      source: 'Google Search / Web Intelligence Harvester',
      searchQuery: query,
      discoveredAt: new Date().toISOString()
    });
  }

  return rawPool;
}
