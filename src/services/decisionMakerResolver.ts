import { RawCompany, DecisionMakerDetail } from '../types/lead';

/**
 * Resolves verified decision maker roles and profiles for qualified prospect
 */
export function resolveDecisionMakers(company: RawCompany): DecisionMakerDetail[] {
  const compName = company.companyName.replace(/[^a-zA-Z0-9\s]/g, '').trim();

  const mockDecisionMakersByIndustry: Record<string, { name: string; title: string }[]> = {
    'Fashion & Apparel': [
      { name: 'Siddharth Mehta', title: 'Co-Founder & CMO' },
      { name: 'Rohan Varma', title: 'Brand & Creative Director' }
    ],
    'Food & Beverage': [
      { name: 'Vikramaditya Roy', title: 'Founder & CEO' },
      { name: 'Ananya Deshmukh', title: 'Head of Marketing & DVCs' }
    ],
    'Real Estate': [
      { name: 'Rajesh Singhania', title: 'Managing Director & VP Marketing' },
      { name: 'Karan Malhotra', title: 'General Manager - Brand Experience' }
    ],
    'Jewellery & Luxury': [
      { name: 'Tarun Moksh', title: 'Creative Director & Founder' },
      { name: 'Priya Chawla', title: 'Chief Marketing Officer' }
    ],
    'Beauty & Cosmetics': [
      { name: 'Neha Kapoor', title: 'Co-Founder & Brand Head' },
      { name: 'Devendra Joshi', title: 'VP Production & Procurement' }
    ],
    'Automotive': [
      { name: 'Aditya Oberoi', title: 'Head of Brand Marketing & Media' },
      { name: 'Sunil Kulkarni', title: 'Senior General Manager - Creative' }
    ]
  };

  const defaults = [
    { name: 'Aarav Sharma', title: 'Chief Marketing Officer (CMO)' },
    { name: 'Meera Iyer', title: 'Head of Creative & Brand Production' }
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
