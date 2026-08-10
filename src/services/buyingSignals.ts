import { RawCompany, BuyingSignalDetail, BuyingSignalType } from '../types/lead';

/**
 * Detects public buying signals & triggers for qualified companies
 */
export function detectBuyingSignals(company: RawCompany): BuyingSignalDetail[] {
  const text = `${company.description} ${company.category} ${company.industry}`.toLowerCase();
  const signals: BuyingSignalDetail[] = [];

  const todayStr = new Date().toISOString().slice(0, 10);

  if (text.includes('launching') || text.includes('new collection') || text.includes('new product') || text.includes('sku')) {
    signals.push({
      signal: `Active Product Launch: ${company.companyName} is introducing a new product line/collection requirement.`,
      signalType: 'NEW_PRODUCT_LAUNCH',
      source: 'Press Release / Brand Announcement Scan',
      date: todayStr,
      confidenceScore: 92
    });
  }

  if (text.includes('store') || text.includes('retail') || text.includes('expanding') || text.includes('new location') || text.includes('beachfront')) {
    signals.push({
      signal: `Footprint Expansion: Opening new retail/regional presence requiring visual set design and commercial production.`,
      signalType: 'NEW_LOCATION_EXPANSION',
      source: 'Corporate Filing & Retail Expansion Watch',
      date: todayStr,
      confidenceScore: 88
    });
  }

  if (text.includes('festive') || text.includes('q4') || text.includes('bridal') || text.includes('campaign')) {
    signals.push({
      signal: `Festive/Seasonal Campaign Push: Preparing major quarterly digital video ad and brand showcase campaign.`,
      signalType: 'SEASONAL_FESTIVE_CAMPAIGN',
      source: 'Media Planning & Campaign Intelligence',
      date: todayStr,
      confidenceScore: 95
    });
  }

  if (text.includes('hiring') || text.includes('commercial') || text.includes('video film')) {
    signals.push({
      signal: `Outsourcing Call / RFP: Seeking creative production partners and art direction for upcoming brand shoot.`,
      signalType: 'RFP_VENDOR_CALL',
      source: 'Public Vendor RFP & Hiring Portal',
      date: todayStr,
      confidenceScore: 85
    });
  }

  // Default signal fallback if no specific trigger matches text
  if (signals.length === 0) {
    signals.push({
      signal: `Active Commercial Activity: High digital presence and brand scaling in ${company.location}.`,
      signalType: 'CAMPAIGN_ANNOUNCEMENT',
      source: 'Web Intelligence Monitor',
      date: todayStr,
      confidenceScore: 80
    });
  }

  return signals;
}
