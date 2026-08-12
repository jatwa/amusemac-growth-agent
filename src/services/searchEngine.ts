import { Lead, SearchFilterOptions, LeadSearchResult, SearchReport, ClientProfile } from '../types/lead';
import { AMUSEMAC_CLIENT_PROFILE, INITIAL_CLIENT_PROFILES } from '../data/clientProfiles';
import { DEFAULT_CUSTOMER_PROFILE } from './tenantStore';
import { harvestRawProspectPool } from './marketDiscovery';
import { deduplicateRawCompanies } from './prospectDatabase';
import { qualifyCompanyAgainstIcp } from './icpQualifier';
import { detectBuyingSignals } from './buyingSignals';
import { generateOpportunityAngle } from './opportunityAnalyzer';
import { resolveDecisionMakers } from './decisionMakerResolver';
import { calculateContactabilityScore, determineServiceMatch, calculateAiLeadScore, generateOutreachPackage, recommendOutreachStrategy } from './aiScoring';

export interface SearchOptions {
  query: string;
  location: string;
  count: number;
  minAiScore: number;
  industryCategory?: string;
  selectedServices?: string[];
  existingLeads?: Lead[];
  clientId?: string;
  clientProfile?: ClientProfile;
  geminiApiKey?: string;
  onProgress?: (step: string, percent: number) => void;
}

/**
 * Enterprise B2B Sales Intelligence Pipeline Execution
 */
export async function executeLeadSearch(options: SearchOptions): Promise<LeadSearchResult> {
  const startTime = Date.now();
  const {
    query,
    location,
    count = 5,
    minAiScore = 60,
    industryCategory = 'General Business',
    selectedServices,
    existingLeads = [],
    clientId,
    clientProfile: providedProfile,
    onProgress
  } = options;

  // Resolve active client profile safely
  const clientProfile: ClientProfile = providedProfile ||
    (clientId ? INITIAL_CLIENT_PROFILES.find(p => p.clientId === clientId) : undefined) ||
    DEFAULT_CUSTOMER_PROFILE;

  // Step 1: Market Discovery & ICP Query Expansion
  onProgress?.(`Step 1/9: Market Discovery & Sector Query Expansion (${query || clientProfile.companyName})...`, 10);
  await new Promise(r => setTimeout(r, 200));

  // Step 2: Raw Company Database Harvesting
  onProgress?.(`Step 2/9: Harvesting Raw Company Pool across Target Sectors...`, 25);
  const rawPool = harvestRawProspectPool(clientProfile, location, query, count * 4);
  await new Promise(r => setTimeout(r, 250));

  // Step 3: Aggressive Deduplication Engine
  onProgress?.(`Step 3/9: Deduplicating Raw Companies against CRM & Web Database...`, 40);
  const dedupRes = deduplicateRawCompanies(rawPool, existingLeads);
  await new Promise(r => setTimeout(r, 200));

  // Step 4: Deterministic ICP Pre-qualification & Competitor Exclusion Filtering
  onProgress?.(`Step 4/9: Applying Competitor Exclusion Profile (${clientProfile.companyName}) & ICP Scoring...`, 55);
  let competitorsRemoved = 0;
  let icpRejected = 0;
  const qualifiedRawPool = [];

  for (const company of dedupRes.uniqueCompanies) {
    const qualRes = qualifyCompanyAgainstIcp(company, clientProfile);
    if (qualRes.competitorStatus === 'EXCLUDED_COMPETITOR') {
      competitorsRemoved++;
    } else if (!qualRes.isQualified) {
      icpRejected++;
    } else {
      qualifiedRawPool.push({ company, qualRes });
    }
  }
  await new Promise(r => setTimeout(r, 250));

  // Step 5: Research & Shortlisting to target count
  onProgress?.(`Step 5/9: Researching Buying Signals, Decision Makers & Contact Data...`, 70);
  const shortlistedItems = qualifiedRawPool.slice(0, count);

  const enrichedLeads: Lead[] = [];
  const topOpportunitiesList: string[] = [];
  const topIndustriesMap: Record<string, number> = {};
  const topLocationsMap: Record<string, number> = {};
  const topSignalsMap: Record<string, number> = {};

  for (let i = 0; i < shortlistedItems.length; i++) {
    const { company, qualRes } = shortlistedItems[i];

    // Step 6: Buying Signals Detection
    const buyingSignals = detectBuyingSignals(company);
    const primarySignal = buyingSignals[0];

    // Step 7: Opportunity Angle Generation
    const opportunityAngle = generateOpportunityAngle(company, clientProfile, buyingSignals);
    topOpportunitiesList.push(`${company.companyName}: ${opportunityAngle.potentialOpportunity}`);

    // Step 8: Decision-Maker Resolution
    const decisionMakers = resolveDecisionMakers(company);
    const primaryDm = decisionMakers[0];

    // Analytics Aggregation
    topIndustriesMap[company.industry] = (topIndustriesMap[company.industry] || 0) + 1;
    topLocationsMap[company.location] = (topLocationsMap[company.location] || 0) + 1;
    if (primarySignal) {
      topSignalsMap[primarySignal.signalType] = (topSignalsMap[primarySignal.signalType] || 0) + 1;
    }

    // Step 9: Scoring & Outreach Package Generation
    const serviceMatch = determineServiceMatch(
      company.industry,
      company.description,
      opportunityAngle.potentialOpportunity,
      selectedServices
    );

    const contactabilityScore = calculateContactabilityScore({
      website: company.website,
      phone: company.phone,
      email: company.email,
      linkedin: company.socialLinks[0],
      decisionMakerName: primaryDm.personName,
      location: company.location
    });

    const scoreResult = calculateAiLeadScore({
      industry: company.industry,
      businessDescription: company.description,
      contactabilityScore,
      decisionMakerName: primaryDm.personName,
      companyName: company.companyName,
      projectName: `${company.category} Project Brief`,
      serviceNeed: opportunityAngle.recommendedServiceFit,
      buyingSignal: primarySignal.signal,
      buyingSignalType: primarySignal.signalType,
      competitorCheckStatus: qualRes.competitorStatus,
      serviceMatchScore: serviceMatch.matchScore,
      sourceUrls: [company.website, company.mapsUrl]
    });

    const strategy = recommendOutreachStrategy({
      email: company.email,
      linkedin: company.socialLinks[0],
      phone: company.phone,
      decisionMakerDesignation: primaryDm.designation,
      primaryService: serviceMatch.primaryService,
      companyName: company.companyName,
      projectName: `${company.industry} Project`,
      serviceNeed: opportunityAngle.recommendedServiceFit
    });

    const leadObject: Lead = {
      leadId: `AMU-B2B-${Date.now().toString().slice(-4)}-${i + 1}`,
      rawCompanyId: company.companyId,
      companyName: company.companyName,
      projectName: `${company.industry} Commercial Project`,
      serviceNeed: opportunityAngle.recommendedServiceFit,
      primaryService: serviceMatch.primaryService,
      secondaryServices: serviceMatch.secondaryServices,
      serviceMatchRationale: serviceMatch.rationale,

      whyThisLead: opportunityAngle.whyThisIsAGoodProspect,
      whyThisIsAGoodProspect: opportunityAngle.whyThisIsAGoodProspect,
      potentialOpportunity: opportunityAngle.potentialOpportunity,

      buyingSignal: primarySignal.signal,
      buyingSignalType: primarySignal.signalType,
      buyingSignalDetails: buyingSignals,

      location: company.location,
      industry: company.industry,
      icpMatchScore: qualRes.icpMatchScore,
      aiScore: scoreResult.aiScore,
      scoreTier: scoreResult.scoreTier,
      confidenceScore: Math.min(95, qualRes.icpMatchScore + 10),
      estimatedProjectValue: '₹20L – ₹50L',

      decisionMakerName: primaryDm.personName,
      decisionMakerDesignation: primaryDm.designation,
      decisionMakerCompany: company.companyName,
      decisionMakerProfileUrl: primaryDm.publicProfileUrl,
      decisionMakerSourceUrl: primaryDm.sourceUrl,
      decisionMakerDetails: decisionMakers,

      email: company.email,
      phone: company.phone,
      website: company.website,
      linkedin: company.socialLinks[0],
      googleMapsUrl: company.mapsUrl,
      sourceUrls: [company.website, company.mapsUrl],

      outreachStatus: 'RESEARCHED',
      competitorCheckStatus: qualRes.competitorStatus,
      scoreReason: scoreResult.scoreReason,
      priorityReason: scoreResult.priorityReason,
      researchDate: new Date().toISOString().slice(0, 10),
      priority: scoreResult.priority,
      scoreBreakdown: scoreResult.scoreBreakdown,

      recommendedChannel: strategy.recommendedChannel,
      recommendedPitch: strategy.pitchAngle,
      lastContacted: 'Never',
      lastContactMethod: 'None',
      followUpDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      nextAction: `Submit strategic line proposal via ${strategy.recommendedChannel}`,
      notes: `Prospect discovered via B2B Intelligence scan for ${clientProfile.companyName} (${query || 'Target Buyers'}).`,

      verificationStatus: (company.website && company.website.startsWith('http')) ? 'VERIFIED_SOURCE' : 'AI_INFERRED',
      provenance: {
        company: company.companyName,
        website: company.website,
        sourceUrl: company.website || company.mapsUrl,
        sourceType: company.mapsUrl ? 'GOOGLE_MAPS' : 'WEB_SEARCH',
        discoveredAt: company.discoveredAt || new Date().toISOString(),
        decisionMaker: primaryDm.personName,
        decisionMakerTitle: primaryDm.designation,
        contactSource: company.website ? `${company.website} Contact Directory` : 'Web Intelligence Harvester',
        buyingSignal: primarySignal.signal,
        buyingSignalSource: primarySignal.source || company.website,
        verificationStatus: (company.website && company.website.startsWith('http')) ? 'VERIFIED_SOURCE' : 'AI_INFERRED',
        confidence: Math.min(95, qualRes.icpMatchScore + 10),
        isDemoData: false
      }
    };

    // Generate Outreach Package
    leadObject.outreachPackage = generateOutreachPackage(leadObject);
    enrichedLeads.push(leadObject);
  }

  onProgress?.(`Step 9/9: Synthesizing Intelligence Report & Outreach Packages...`, 95);
  await new Promise(r => setTimeout(r, 200));

  const report: SearchReport = {
    searchQuery: query || `${clientProfile.targetCategories[0]} Brands`,
    targetLocation: location,
    clientId: clientProfile.clientId,
    totalDiscovered: rawPool.length,
    duplicatesRemoved: dedupRes.duplicateCount,
    competitorsRemoved,
    icpRejected,
    qualifiedCount: qualifiedRawPool.length,
    shortlistedCount: enrichedLeads.length,
    topOpportunities: topOpportunitiesList,
    topIndustries: topIndustriesMap,
    topLocations: topLocationsMap,
    topBuyingSignals: topSignalsMap,
    executionTimeMs: Date.now() - startTime
  };

  onProgress?.(`Prospecting Intelligence Scan Complete! (${enrichedLeads.length} Shortlisted)`, 100);

  return {
    leads: enrichedLeads,
    report,
    totalFound: rawPool.length,
    deduplicatedCount: dedupRes.duplicateCount,
    filteredOutCount: icpRejected,
    competitorsExcludedCount: competitorsRemoved
  };
}
