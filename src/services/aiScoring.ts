import { Lead, AmusemacService, LeadPriority, ScoreTier, OutreachChannel, OutreachPackage, CompetitorStatus, BuyingSignalType, ScoreBreakdown } from '../types/lead';

/**
 * Calculates contactability score (0-100) based on verified public information
 */
export function calculateContactabilityScore(lead: Partial<Lead>): number {
  let score = 0;
  
  if (lead.website && lead.website !== 'Not found') score += 20;
  if (lead.phone && lead.phone !== 'Not found') score += 20;
  if (lead.email && lead.email !== 'Not found') score += 25;
  if (lead.linkedin && lead.linkedin !== 'Not found') score += 15;
  if (lead.instagram && lead.instagram !== 'Not found') score += 5;
  if (lead.decisionMakerName && lead.decisionMakerName !== 'Not found') score += 10;
  if (lead.location && lead.location !== 'Not found') score += 5;

  return Math.min(100, Math.max(0, score));
}

/**
 * Determines relevant Amusemac services for a business project need
 */
export function determineServiceMatch(
  industry: string,
  businessDescription: string,
  serviceNeed: string,
  userSelectedServices?: AmusemacService[]
): {
  primaryService: AmusemacService;
  secondaryServices: AmusemacService[];
  matchScore: number;
  rationale: string;
} {
  const desc = (businessDescription + ' ' + industry + ' ' + serviceNeed).toLowerCase();
  
  if (userSelectedServices && userSelectedServices.length > 0) {
    const primary = userSelectedServices[0];
    const secondary = userSelectedServices.slice(1);
    return {
      primaryService: primary,
      secondaryServices: secondary.length > 0 ? secondary : ['Production Design', 'Art Direction'],
      matchScore: 95,
      rationale: `Selected based on target service requirement for ${primary} matching the client's current project brief.`
    };
  }

  // Need-based matching heuristics
  if (desc.includes('set design') || desc.includes('art direction') || desc.includes('production design') || desc.includes('set build')) {
    return {
      primaryService: 'Production Design',
      secondaryServices: ['Set Design', 'Art Direction', 'Visual Development'],
      matchScore: 96,
      rationale: 'Project specifically calls for turnkey production design, thematic spatial art direction, and custom set construction.'
    };
  }

  if (desc.includes('commercial') || desc.includes('ad film') || desc.includes('dvc') || desc.includes('tv commercial') || desc.includes('tvc')) {
    return {
      primaryService: 'Commercial/Ad Film Production',
      secondaryServices: ['Creative Production', 'End-to-End Creative Execution', 'Art Direction'],
      matchScore: 98,
      rationale: 'Client has an active requirement for TV commercial and high-converting digital ad film production.'
    };
  }

  if (desc.includes('music video') || desc.includes('music') || desc.includes('track') || desc.includes('single launch')) {
    return {
      primaryService: 'Music Video Production',
      secondaryServices: ['Production Design', 'Visual Development', 'Art Direction'],
      matchScore: 94,
      rationale: 'High-concept music video production requirement requiring stylized visual direction and specialized lighting set builds.'
    };
  }

  if (desc.includes('visual development') || desc.includes('pre-viz') || desc.includes('concept art') || desc.includes('lookdev')) {
    return {
      primaryService: 'Visual Development',
      secondaryServices: ['Creative Production', 'Art Direction'],
      matchScore: 92,
      rationale: 'Client requires upfront concept art, character design, pre-visualization, and cinematic visual development.'
    };
  }

  if (desc.includes('film production') || desc.includes('feature film') || desc.includes('movie') || desc.includes('narrative')) {
    return {
      primaryService: 'Film Production',
      secondaryServices: ['Production Design', 'Set Design', 'End-to-End Creative Execution'],
      matchScore: 95,
      rationale: 'Narrative feature film or short film production brief demanding cinema-grade execution.'
    };
  }

  // Default End-to-End Creative Execution
  return {
    primaryService: 'End-to-End Creative Execution',
    secondaryServices: ['Creative Production', 'Commercial/Ad Film Production', 'Art Direction'],
    matchScore: 90,
    rationale: 'Turnkey creative execution brief requiring full production management from concept to final master delivery.'
  };
}

/**
 * Need-Based 7-Factor Deterministic AI Lead Scoring Algorithm (0-100)
 */
export function calculateAiLeadScore(lead: Partial<Lead>): {
  aiScore: number;
  scoreTier: ScoreTier;
  priority: LeadPriority;
  scoreReason: string;
  priorityReason: string;
  scoreBreakdown: ScoreBreakdown;
} {
  const competitorStatus = lead.competitorCheckStatus || 'CLIENT_END_USER';
  const signalType = lead.buyingSignalType || 'CAMPAIGN_ANNOUNCEMENT';
  const hasDecisionMaker = lead.decisionMakerName && lead.decisionMakerName !== 'Not found';
  const location = lead.location || '';

  // Factor 1: ICP Fit (Max 20 pts)
  const icpFitScore = competitorStatus === 'EXCLUDED_COMPETITOR' ? 0 : 20;

  // Factor 2: Service Fit (Max 20 pts)
  const serviceFitScore = lead.serviceMatchScore ? Math.round((lead.serviceMatchScore / 100) * 20) : 18;

  // Factor 3: Buyer Fit (Max 15 pts)
  const buyerFitScore = competitorStatus === 'CLIENT_END_USER' ? 15 : 10;

  // Factor 4: Buying Signal Strength (Max 20 pts)
  let buyingSignalScore = 14;
  if (signalType === 'RFP_VENDOR_CALL' || signalType === 'NEW_PRODUCT_LAUNCH') buyingSignalScore = 20;
  else if (signalType === 'SEASONAL_FESTIVE_CAMPAIGN' || signalType === 'CAMPAIGN_ANNOUNCEMENT') buyingSignalScore = 18;
  else if (signalType === 'FUNDING_RAISED' || signalType === 'EXPANSION_SIGNAL') buyingSignalScore = 16;

  // Factor 5: Location Fit (Max 10 pts)
  const locationFitScore = (location.toLowerCase().includes('mumbai') || location.toLowerCase().includes('bengaluru') || location.toLowerCase().includes('delhi')) ? 10 : 7;

  // Factor 6: Company Profile Fit (Max 10 pts)
  const companyFitScore = 9;

  // Factor 7: Contact Quality & Decision Maker (Max 5 pts)
  const contactQualityScore = hasDecisionMaker ? 5 : (lead.email && lead.email !== 'Not found' ? 3 : 2);

  const totalScore = Math.min(100, icpFitScore + serviceFitScore + buyerFitScore + buyingSignalScore + locationFitScore + companyFitScore + contactQualityScore);

  let scoreTier: ScoreTier = 'LOW';
  let priority: LeadPriority = 'COLD';

  if (totalScore >= 90) {
    scoreTier = 'HOT';
    priority = 'HOT';
  } else if (totalScore >= 75) {
    scoreTier = 'HOT/WARM';
    priority = 'HOT';
  } else if (totalScore >= 60) {
    scoreTier = 'WARM';
    priority = 'WARM';
  } else {
    scoreTier = 'COLD';
    priority = 'COLD';
  }

  const primaryEvidence = (lead.sourceUrls && lead.sourceUrls.length > 0 && lead.sourceUrls[0] !== 'Not found')
    ? lead.sourceUrls[0]
    : lead.website || 'Verified Public Press Release';

  const scoreReason = `Deterministic 7-factor score of ${totalScore}/100 based on ICP Fit (${icpFitScore}/20), Service Need (${serviceFitScore}/20), Buyer Status (${buyerFitScore}/15), and Verified Signal (${buyingSignalScore}/20).`;
  const priorityReason = `High outreach priority due to active ${signalType.replace(/_/g, ' ')} signal and decision maker reachability.`;

  const scoreBreakdown: ScoreBreakdown = {
    icpFitScore,
    serviceFitScore,
    buyerFitScore,
    buyingSignalScore,
    locationFitScore,
    companyFitScore,
    contactQualityScore,
    totalScore,
    scoreReason,
    evidence: primaryEvidence
  };

  return {
    aiScore: totalScore,
    scoreTier,
    priority,
    scoreReason,
    priorityReason,
    scoreBreakdown
  };
}

/**
 * Generates personalized 8-part outreach message package anchored on the specific project name & current need
 */
export function generateOutreachPackage(lead: Partial<Lead>): OutreachPackage {
  const company = lead.companyName || 'your team';
  const project = lead.projectName || 'upcoming campaign';
  const need = lead.serviceNeed || 'commercial video production';
  const person = lead.decisionMakerName && lead.decisionMakerName !== 'Not found' ? lead.decisionMakerName : 'Team';
  const role = lead.decisionMakerDesignation && lead.decisionMakerDesignation !== 'Not found' ? lead.decisionMakerDesignation : 'Leadership';
  const primaryService = lead.primaryService || 'Commercial/Ad Film Production';
  const location = lead.location && lead.location !== 'Not found' ? lead.location : 'your region';

  return {
    emailSubject: `Regarding ${company}'s ${project} — Amusemac Studio Production Proposal`,
    personalizedEmail: `Hi ${person},

I saw ${company}'s public announcement regarding the "${project}" and noticed your active requirement for ${need}.

At Amusemac Studio (MAD ABOUT CINEMA), we specialize in ${primaryService}, Production Design, and End-to-End Creative Execution for high-stakes brand campaigns.

We have turnkey line production teams and soundstage set designers ready to support the "${project}" shoot schedule without operational delay.

Would you be open to a 10-minute discovery call next Tuesday or Wednesday to discuss production design and line execution for this project?

Best regards,

Business Development Team
Amusemac Studio | MAD ABOUT CINEMA
https://amusemac.com`,

    linkedinConnection: `Hi ${person}, saw ${company}'s announcement for "${project}". Amusemac Studio produces cinema-grade ${primaryService} & Production Design. Would love to connect and share visual concepts for this brief.`,

    linkedinFollowup: `Thanks for connecting, ${person}! Quick follow-up regarding "${project}": We can handle turnkey set design and line production for your shoot dates. Open to taking a look at our relevant portfolio deck?`,

    whatsappMessage: `Hi ${person}, this is Amusemac Studio (MAD ABOUT CINEMA). Re: ${company}'s "${project}" — we specialize in ${primaryService} and custom set design. Are you currently finalizing external production vendors for this brief?`,

    shortIntroPitch: `${company} ("${project}") + Amusemac Studio: TV Commercial-grade ${primaryService}, bespoke production design, and end-to-end line execution built specifically for your upcoming shoot.`,

    followupMessage1: `Hi ${person}, following up regarding the production brief for "${project}". We recently wrapped a similar ${primaryService} shoot—happy to send over a 60-second visual breakdown tailored for ${company}. Do you have 5 minutes this week?`,

    followupMessage2: `Hi ${person}, last check-in from my side regarding "${project}"! If ${company} is still evaluating external production vendors or art direction teams for this brief, we'd be glad to submit a formal bid. Best regards!`
  };
}

/**
 * Recommends the optimal outreach strategy
 */
export function recommendOutreachStrategy(lead: Partial<Lead>): {
  recommendedChannel: OutreachChannel;
  bestRole: string;
  pitchAngle: string;
} {
  const hasEmail = lead.email && lead.email !== 'Not found';
  const hasLinkedin = lead.linkedin && lead.linkedin !== 'Not found';
  const hasPhone = lead.phone && lead.phone !== 'Not found';

  let recommendedChannel: OutreachChannel = 'Email';
  if (hasEmail) recommendedChannel = 'Email';
  else if (hasLinkedin) recommendedChannel = 'LinkedIn';
  else if (hasPhone) recommendedChannel = 'WhatsApp';
  else recommendedChannel = 'Website Contact Form';

  const bestRole = lead.decisionMakerDesignation && lead.decisionMakerDesignation !== 'Not found'
    ? lead.decisionMakerDesignation
    : 'Creative Director / Marketing Head';

  const pitchAngle = `Position Amusemac Studio's ${lead.primaryService} as the turnkey execution partner for "${lead.projectName || 'the current campaign'}", addressing their exact need for ${lead.serviceNeed || 'commercial film production'}.`;

  return { recommendedChannel, bestRole, pitchAngle };
}
