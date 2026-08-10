import { RawCompany, ClientProfile, CompetitorCheckStatus } from '../types/lead';

export interface IcpQualificationResult {
  isQualified: boolean;
  icpMatchScore: number;
  competitorStatus: CompetitorCheckStatus;
  rejectionReason?: string;
  matchedServices: string[];
}

/**
 * Checks if a company name/description matches any competitor exclusion pattern in ClientProfile
 */
export function evaluateCompetitorStatus(
  company: RawCompany,
  clientProfile: ClientProfile
): CompetitorCheckStatus {
  const textToScan = `${company.companyName} ${company.category} ${company.industry} ${company.description}`.toLowerCase();

  for (const excludedItem of clientProfile.competitorExclusions) {
    const term = excludedItem.toLowerCase();
    if (textToScan.includes(term)) {
      // Check if there is explicit outsourcing / client-side signal overrides
      if (textToScan.includes('outsourcing') || textToScan.includes('vendor rfp') || textToScan.includes('looking for line production')) {
        return 'QUALIFIED_OUTSOURCER';
      }
      return 'EXCLUDED_COMPETITOR';
    }
  }

  return 'CLIENT_END_USER';
}

/**
 * Deterministic ICP Pre-qualification before sending to AI
 */
export function qualifyCompanyAgainstIcp(
  company: RawCompany,
  clientProfile: ClientProfile
): IcpQualificationResult {
  const competitorStatus = evaluateCompetitorStatus(company, clientProfile);

  if (competitorStatus === 'EXCLUDED_COMPETITOR') {
    return {
      isQualified: false,
      icpMatchScore: 20,
      competitorStatus,
      rejectionReason: `Excluded as direct competitor matching ${clientProfile.companyName}'s competitor profile.`,
      matchedServices: []
    };
  }

  let icpScore = 50; // base score
  const textToScan = `${company.companyName} ${company.category} ${company.industry} ${company.description} ${company.location}`.toLowerCase();

  // 1. Industry / Category Match (+20)
  const isTargetCat = clientProfile.targetCategories.some(cat => textToScan.includes(cat.toLowerCase()));
  if (isTargetCat) icpScore += 20;

  // 2. Positive Keywords Match (+15)
  const positiveMatches = clientProfile.positiveKeywords.filter(kw => textToScan.includes(kw.toLowerCase()));
  icpScore += Math.min(positiveMatches.length * 5, 15);

  // 3. Location Alignment (+10)
  const isTargetLoc = clientProfile.targetLocations.some(loc => textToScan.includes(loc.toLowerCase()));
  if (isTargetLoc) icpScore += 10;

  // 4. Negative Keywords Penalty (-25)
  const negativeMatches = clientProfile.negativeKeywords.filter(kw => textToScan.includes(kw.toLowerCase()));
  if (negativeMatches.length > 0) {
    icpScore -= (negativeMatches.length * 15);
  }

  // Determine matched services
  const matchedServices = clientProfile.services.filter(s => {
    const sTerm = s.toLowerCase();
    return textToScan.includes(sTerm) || isTargetCat;
  });

  const isQualified = icpScore >= clientProfile.minIcpScore;

  return {
    isQualified,
    icpMatchScore: Math.max(0, Math.min(100, icpScore)),
    competitorStatus,
    rejectionReason: isQualified ? undefined : `ICP Score (${icpScore}) below minimum threshold (${clientProfile.minIcpScore}).`,
    matchedServices: matchedServices.length > 0 ? matchedServices : [clientProfile.services[0]]
  };
}
