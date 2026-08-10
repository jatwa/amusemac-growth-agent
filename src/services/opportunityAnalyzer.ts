import { RawCompany, ClientProfile, OpportunityAngle, BuyingSignalDetail } from '../types/lead';

/**
 * Generates strategic Opportunity Angle analysis for qualified prospect
 */
export function generateOpportunityAngle(
  company: RawCompany,
  clientProfile: ClientProfile,
  buyingSignals: BuyingSignalDetail[]
): OpportunityAngle {
  const signalText = buyingSignals.map(s => s.signal).join(' ');
  const primaryService = clientProfile.services[0] || 'Film Production';

  let whyGood = `${company.companyName} is an established ${company.industry} (${company.category}) operating in ${company.location} with strong growth indicators.`;

  if (signalText.includes('Product Launch')) {
    whyGood = `${company.companyName} is actively launching a new product line/collection in ${company.location}, creating an immediate requirement for high-impact visual production.`;
  } else if (signalText.includes('Expansion')) {
    whyGood = `${company.companyName} is aggressively expanding its physical and digital retail footprint, driving need for premium brand films and set design.`;
  } else if (signalText.includes('Festive')) {
    whyGood = `${company.companyName} is entering a peak seasonal campaign window requiring turnkey commercial film production and art direction.`;
  }

  let opportunity = `High potential requirement for ${primaryService}, set design worldbuilding, and digital video campaign (DVC) production to elevate brand positioning.`;

  if (company.industry.toLowerCase().includes('fashion') || company.industry.toLowerCase().includes('jewellery')) {
    opportunity = `Direct opportunity for turnkey ${clientProfile.services[1] || 'Production Design'}, high-end art direction, and campaign film production for seasonal lookbook & DVC shoots.`;
  } else if (company.industry.toLowerCase().includes('real estate') || company.industry.toLowerCase().includes('hotel')) {
    opportunity = `Requirement for architectural film production, luxury set styling, pre-visualization concept art, and high-impact project launch films.`;
  } else if (company.industry.toLowerCase().includes('beauty') || company.industry.toLowerCase().includes('d2c')) {
    opportunity = `Opportunity for high-frequency DVC ad shoot, product macro cinematography, and visual development for social/TV ad campaigns.`;
  }

  return {
    whyThisIsAGoodProspect: whyGood,
    potentialOpportunity: opportunity,
    recommendedServiceFit: primaryService
  };
}
