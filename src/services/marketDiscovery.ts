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

  const candidateBrands = [
    {
      name: 'Snitch Fashion',
      industry: 'Fashion & Apparel',
      category: 'D2C / E-Commerce',
      desc: 'Fast-growing men\'s D2C fashion apparel brand launching 15 new retail stores and quarterly festive digital video ad campaigns.',
      phone: '+91 98201 12345',
      email: 'marketing@snitch.co.in',
      website: 'https://snitch.co.in',
      maps: 'https://maps.google.com/?q=Snitch+Fashion+Mumbai',
      socials: ['https://linkedin.com/company/snitch-apparel', 'https://instagram.com/snitch.co.in']
    },
    {
      name: 'Bakehouse & Co.',
      industry: 'Food & Beverage',
      category: 'FMCG / Retail',
      desc: 'Artisanal bakery and gourmet packaged food brand launching national retail distribution and Q4 festive ad campaign.',
      phone: '+91 98202 23456',
      email: 'brand@bakehouseco.in',
      website: 'https://bakehouseco.in',
      maps: 'https://maps.google.com/?q=Bakehouse+Co+Mumbai',
      socials: ['https://instagram.com/bakehouse.co']
    },
    {
      name: 'Prestige Living Developers',
      industry: 'Real Estate',
      category: 'Real Estate & Infrastructure',
      desc: 'Premium luxury residential real estate developer launching a flagship 40-story beachfront luxury project in Bandra West.',
      phone: '+91 98203 34567',
      email: 'corporate@prestigeliving.in',
      website: 'https://prestigeliving.in',
      maps: 'https://maps.google.com/?q=Prestige+Living+Mumbai',
      socials: ['https://linkedin.com/company/prestige-living-mumbai']
    },
    {
      name: 'Moksh Jewellery Studio',
      industry: 'Jewellery & Luxury',
      category: 'Luxury / Retail',
      desc: 'High-end heritage diamond and bridal gold jewellery house preparing national bridal campaign shoot and set design.',
      phone: '+91 98204 45678',
      email: 'contact@mokshjewels.com',
      website: 'https://mokshjewels.com',
      maps: 'https://maps.google.com/?q=Moksh+Jewels+Mumbai',
      socials: ['https://instagram.com/mokshjewels']
    },
    {
      name: 'Kaya Glow Organics',
      industry: 'Beauty & Cosmetics',
      category: 'D2C / Personal Care',
      desc: 'Organic D2C skincare and beauty brand expanding with 20 new SKUs and hiring for commercial video film production.',
      phone: '+91 98205 56789',
      email: 'pr@kayaglow.in',
      website: 'https://kayaglow.in',
      maps: 'https://maps.google.com/?q=Kaya+Glow+Organics+Mumbai',
      socials: ['https://instagram.com/kayaglow.in']
    },
    {
      name: 'Aether Motors India',
      industry: 'Automotive',
      category: 'EV / Consumer Tech',
      desc: 'Next-gen electric two-wheeler manufacturer launching new flagship scooter line and producing high-octane commercial TVCs.',
      phone: '+91 98206 67890',
      email: 'media@aethermotors.in',
      website: 'https://aethermotors.in',
      maps: 'https://maps.google.com/?q=Aether+Motors+Mumbai',
      socials: ['https://linkedin.com/company/aether-motors-india']
    },
    {
      name: 'Saffron Bay Resorts',
      industry: 'Hospitality & Hotels',
      category: 'Luxury Hospitality',
      desc: 'Bespoke luxury boutique hotel chain opening 3 new eco-resorts with requirement for visual promo films and aerial cinematography.',
      phone: '+91 98207 78901',
      email: 'marketing@saffronbayresorts.com',
      website: 'https://saffronbayresorts.com',
      maps: 'https://maps.google.com/?q=Saffron+Bay+Resorts+Mumbai',
      socials: ['https://instagram.com/saffronbayresorts']
    },
    {
      name: 'Aura Home Decor',
      industry: 'Home & Furnishing',
      category: 'D2C / Lifestyle',
      desc: 'D2C home aesthetics and furniture brand launching experiential festive set design catalog and digital video ads.',
      phone: '+91 98208 89012',
      email: 'hello@aurahome.in',
      website: 'https://aurahome.in',
      maps: 'https://maps.google.com/?q=Aura+Home+Decor+Mumbai',
      socials: ['https://instagram.com/aurahome.in']
    },
    {
      name: 'Apex Motion Pictures',
      industry: 'Film Production',
      category: 'Production House',
      desc: 'Independent film and video production house specializing in regional cinema and TV commercial production.',
      phone: '+91 98209 90123',
      email: 'info@apexmotionpictures.com',
      website: 'https://apexmotionpictures.com',
      maps: 'https://maps.google.com/?q=Apex+Motion+Pictures+Mumbai',
      socials: ['https://linkedin.com/company/apex-motion-pictures']
    },
    {
      name: 'Red Dot Creative Agency',
      industry: 'Advertising & Marketing',
      category: 'Advertising Agency',
      desc: 'Full-service advertising and digital marketing agency managing brand campaigns for FMCG and retail clients.',
      phone: '+91 98210 01234',
      email: 'hello@reddotagency.in',
      website: 'https://reddotagency.in',
      maps: 'https://maps.google.com/?q=Red+Dot+Creative+Agency+Mumbai',
      socials: ['https://linkedin.com/company/red-dot-creative-agency']
    }
  ];

  let idCounter = 100;
  const queries = generateIcpSearchQueries(clientProfile, targetLocation, userQuery);

  for (let i = 0; i < Math.max(requestedCount, candidateBrands.length); i++) {
    const brand = candidateBrands[i % candidateBrands.length];
    const query = queries[i % queries.length];

    rawPool.push({
      companyId: `RAW-${Date.now()}-${idCounter++}`,
      companyName: brand.name + (i >= candidateBrands.length ? ` ${Math.floor(i / candidateBrands.length) + 1}` : ''),
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
