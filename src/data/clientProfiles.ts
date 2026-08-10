import { ClientProfile } from '../types/lead';

export const AMUSEMAC_CLIENT_PROFILE: ClientProfile = {
  clientId: 'amusemac-studio',
  companyName: 'Amusemac Studio',
  tagline: 'MAD ABOUT CINEMA',
  industry: 'Film & Commercial Media Production',
  services: [
    'Film Production',
    'Advertising Film Production',
    'Branded Content',
    'Production Design',
    'Art Direction',
    'Visual Development',
    'Creative Production',
    'AI Film Production',
    'Video Production',
    'Set Design',
    'Music Video Production',
    'End-to-End Creative Execution'
  ],
  products: [
    'TV Commercials (TVC)',
    'Digital Video Commercials (DVC)',
    'Brand Films & Documentaries',
    'Art & Set Design Worldbuilding',
    'Pre-Visualization & Concept Art'
  ],
  targetCategories: [
    'Brands',
    'D2C',
    'E-commerce',
    'FMCG',
    'Fashion & Apparel',
    'Jewellery & Luxury',
    'Beauty & Cosmetics',
    'Real Estate & Developers',
    'Hospitality & Hotels',
    'Restaurants & QSR',
    'Automotive',
    'Startups & Tech',
    'Corporate Companies',
    'Entertainment & Gaming',
    'Events & Experiential'
  ],
  targetLocations: [
    'Mumbai',
    'Delhi NCR',
    'Bengaluru',
    'Hyderabad',
    'Chennai',
    'Pune',
    'National / India',
    'Dubai / UAE'
  ],
  positiveKeywords: [
    'brand',
    'd2c',
    'fmcg',
    'fashion',
    'jewellery',
    'beauty',
    'cosmetics',
    'real estate',
    'hotel',
    'resort',
    'automotive',
    'consumer',
    'retail',
    'apparel',
    'jewel',
    'footwear',
    'luxury',
    'beverage',
    'snacks',
    'skincare',
    'wellness',
    'lifestyle',
    'launch',
    'campaign',
    'collection',
    'festive',
    'expansion',
    'funding'
  ],
  negativeKeywords: [
    'production house',
    'film production',
    'video production',
    'ad agency',
    'advertising agency',
    'creative agency',
    'marketing agency',
    'digital agency',
    'media agency',
    'vfx studio',
    'post production',
    'photography studio',
    'modeling agency',
    'casting agency'
  ],
  competitorExclusions: [
    'Production House',
    'Film Production Company',
    'Video Production Company',
    'Advertising Agency',
    'Creative Agency',
    'Marketing Agency',
    'Digital Marketing Agency',
    'Design Agency',
    'VFX Studio',
    'Post Production Studio',
    'Photography Studio'
  ],
  minIcpScore: 60
};

export const SECONDARY_CLIENT_PROFILE: ClientProfile = {
  clientId: 'plusone-design',
  companyName: 'Plus One Design',
  tagline: 'Branding & UI/UX Experience Studio',
  industry: 'Brand Design & Digital Product Studio',
  services: [
    'Brand Identity Design',
    'UI/UX Product Design',
    'Website Design & Development',
    'Packaging Design',
    'Design Systems'
  ],
  products: [
    'Brand Strategy Guidelines',
    'Web & Mobile App UI/UX',
    'E-Commerce Storefronts',
    'Product Packaging Sets'
  ],
  targetCategories: [
    'SaaS & Tech Startups',
    'Fintech',
    'Healthtech',
    'D2C Brands',
    'Consumer Tech'
  ],
  targetLocations: ['Mumbai', 'Bengaluru', 'Delhi NCR', 'Remote / Global'],
  positiveKeywords: [
    'saas',
    'tech',
    'fintech',
    'app',
    'software',
    'd2c',
    'startup',
    'rebrand',
    'redesign',
    'series a',
    'funding'
  ],
  negativeKeywords: [
    'design agency',
    'branding agency',
    'ui ux agency',
    'software agency',
    'it services'
  ],
  competitorExclusions: [
    'Design Agency',
    'Branding Agency',
    'UI/UX Agency',
    'Software Development Agency',
    'IT Consulting Firm'
  ],
  minIcpScore: 65
};

export const INITIAL_CLIENT_PROFILES: ClientProfile[] = [
  AMUSEMAC_CLIENT_PROFILE,
  SECONDARY_CLIENT_PROFILE
];
