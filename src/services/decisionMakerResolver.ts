import { RawCompany, DecisionMakerDetail } from '../types/lead';

/**
 * Resolves verified decision maker roles and profiles for qualified prospect
 */
export function resolveDecisionMakers(company: RawCompany, isLive: boolean = false): DecisionMakerDetail[] {
  // If in production/live search and no explicit verified decision maker exists in raw company record:
  if (isLive || (typeof process !== 'undefined' && process.env.DEMO_MODE !== 'true')) {
    return [{
      personName: 'Not verified',
      designation: 'Not verified',
      company: company.companyName,
      publicProfileUrl: '',
      sourceUrl: company.source || company.website || '',
      confidenceScore: 0
    }];
  }

  const compName = company.companyName.replace(/[^a-zA-Z0-9\s]/g, '').trim();

  const mockDecisionMakersByIndustry: Record<string, { name: string; title: string }[]> = {
    'Fashion & Apparel': [
      { name: 'Siddharth Mehta', title: 'Co-Founder & CMO' },
      { name: 'Rohan Varma', title: 'Brand & Creative Director' }
    ],
    'Food & Beverage': [
      { name: 'Vikramaditya Roy', title: 'Founder & CEO' },
      { name: 'Ananya Deshmukh', title: 'Head of Marketing & DVCs' }
    ]
  };

  const defaults = [
    { name: 'Aarav Sharma', title: 'Chief Marketing Officer (CMO)' }
  ];

  const matchedList = mockDecisionMakersByIndustry[company.industry] || defaults;

  return matchedList.map((dm, idx) => ({
    personName: dm.name,
    designation: dm.title,
    company: company.companyName,
    publicProfileUrl: `https://linkedin.com/in/${dm.name.toLowerCase().replace(/\s+/g, '-')}-${compName.toLowerCase().slice(0, 5)}`,
    sourceUrl: company.source || company.website || 'https://linkedin.com',
    confidenceScore: 90 - (idx * 5)
  }));
}
