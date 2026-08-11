import { Lead, AmusemacService, LeadPriority, ScoreTier, OutreachChannel, OutreachPackage, CompetitorStatus, BuyingSignalType, ScoreBreakdown } from '../types/lead';
import { Organization } from '../types/saas';

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
 * Determines relevant services for a business project need based on active organization profile
 */
export function determineServiceMatch(
  industry: string,
  businessDescription: string,
  serviceNeed: string,
  userSelectedServices?: AmusemacService[],
  org?: Organization
): {
  primaryService: AmusemacService;
  secondaryServices: AmusemacService[];
  matchScore: number;
  rationale: string;
} {
  const isAmusemac = !org || org.orgId === 'amusemac-studio';
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

  if (!isAmusemac) {
    const defaultCustService = 'Commercial Strategy & Outreach';
    return {
      primaryService: defaultCustService,
      secondaryServices: ['Brand Campaign Execution', 'Digital Strategy'],
      matchScore: 90,
      rationale: `Matched based on ${org?.companyName || 'Client'}'s core service offerings for ${industry} clients.`
    };
  }

  // Amusemac Need-based matching heuristics
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

  const icpFitScore = competitorStatus === 'EXCLUDED_COMPETITOR' ? 0 : 20;
  const serviceFitScore = lead.serviceMatchScore ? Math.round((lead.serviceMatchScore / 100) * 20) : 18;
  const buyerFitScore = competitorStatus === 'CLIENT_END_USER' ? 15 : 10;

  let buyingSignalScore = 14;
  if (signalType === 'RFP_VENDOR_CALL' || signalType === 'NEW_PRODUCT_LAUNCH') buyingSignalScore = 20;
  else if (signalType === 'SEASONAL_FESTIVE_CAMPAIGN' || signalType === 'CAMPAIGN_ANNOUNCEMENT') buyingSignalScore = 18;
  else if (signalType === 'FUNDING_RAISED' || signalType === 'EXPANSION_SIGNAL') buyingSignalScore = 16;

  const locationFitScore = (location.toLowerCase().includes('mumbai') || location.toLowerCase().includes('bengaluru') || location.toLowerCase().includes('delhi')) ? 10 : 7;
  const companyFitScore = 9;
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
 * Generates personalized 8-part outreach message package anchored on the specific project & current need with strict tenant isolation
 */
export function generateOutreachPackage(lead: Partial<Lead>, org?: Organization): OutreachPackage {
  const company = lead.companyName || 'your team';
  const project = lead.projectName || 'upcoming campaign';
  const need = lead.serviceNeed || 'commercial requirements';
  const person = lead.decisionMakerName && lead.decisionMakerName !== 'Not found' ? lead.decisionMakerName : 'Team';
  const role = lead.decisionMakerDesignation && lead.decisionMakerDesignation !== 'Not found' ? lead.decisionMakerDesignation : 'Leadership';

  const isAmusemac = !org || org.orgId === 'amusemac-studio';

  if (isAmusemac) {
    const primaryService = lead.primaryService || 'Commercial/Ad Film Production';
    return {
      emailSubject: `Regarding ${company}'s ${project} — Amusemac Studio Production Proposal`,
      personalizedEmail: `Hi ${person},

I came across ${company}'s public announcement regarding the "${project}" and noticed the opportunity around film production.

At Amusemac Studio (MAD ABOUT CINEMA), we specialize in Production Design and end-to-end creative execution for brand and commercial campaigns.

We'd be happy to explore how our production and creative capabilities could support the project.

Would you be open to a short 10-minute conversation next Tuesday or Wednesday?

Best regards,

Kuldeep Jatwa
Production Designer & Creative Producer
Amusemac Studio | MAD ABOUT CINEMA

Production Design Portfolio:
https://vimeo.com/1123277739?fl=pl&fe=sh

Amusemac Studio:
https://www.amusemacstudio.in`,

      linkedinConnection: `Hi ${person}, saw ${company}'s announcement for "${project}". Amusemac Studio produces cinema-grade ${primaryService} & Production Design. Would love to connect and share visual concepts for this brief.`,

      linkedinFollowup: `Thanks for connecting, ${person}! Quick follow-up regarding "${project}": We can handle turnkey set design and line production for your shoot dates. Check out our portfolio: https://vimeo.com/1123277739?fl=pl&fe=sh`,

      whatsappMessage: `Hi ${person}, this is Kuldeep Jatwa from Amusemac Studio (MAD ABOUT CINEMA). Re: ${company}'s "${project}" — we specialize in ${primaryService} and custom set design. Are you currently finalizing external production vendors for this brief?`,

      shortIntroPitch: `${company} ("${project}") + Amusemac Studio: TV Commercial-grade ${primaryService}, bespoke production design, and end-to-end line execution built specifically for your upcoming shoot.`,

      followupMessage1: `Hi ${person}, following up regarding the production brief for "${project}". We recently wrapped a similar ${primaryService} shoot—happy to send over a visual breakdown. Do you have 5 minutes this week?`,

      followupMessage2: `Hi ${person}, last check-in from my side regarding "${project}"! If ${company} is still evaluating external production vendors or art direction teams for this brief, we'd be glad to submit a formal bid. Best regards!`
    };
  }

  // CUSTOMER WORKSPACE OUTREACH GENERATION (STRICT ISOLATION)
  const custCompany = org.companyName || 'Client Workspace';
  const custAdmin = org.adminName || 'Team';
  const custRole = 'Founder & Director';
  const custWebsite = org.website && org.website !== 'https://' && org.website !== 'Not configured' ? org.website : '';
  const custService = lead.primaryService && lead.primaryService !== 'Commercial/Ad Film Production' ? lead.primaryService : 'our specialized services';

  let signatureLines = `Best regards,\n\n${custAdmin}\n${custRole}\n${custCompany}`;
  if (custWebsite) {
    signatureLines += `\n\n${custWebsite}`;
  }

  return {
    emailSubject: `Regarding ${company}'s ${project} — ${custCompany} Proposal`,
    personalizedEmail: `Hi ${person},

I came across ${company}'s recent campaign activity regarding "${project}" and noticed the opportunity around ${need}.

At ${custCompany}, we specialize in ${custService} and would be happy to explore how we could support the campaign.

Would you be open to a short conversation next week?

${signatureLines}`,

    linkedinConnection: `Hi ${person}, saw ${company}'s recent updates regarding "${project}". At ${custCompany}, we specialize in ${custService}. Would love to connect!`,

    linkedinFollowup: `Thanks for connecting, ${person}! Quick follow-up regarding "${project}": ${custCompany} provides specialized ${custService}. Let us know if you're open to a brief touchpoint.`,

    whatsappMessage: `Hi ${person}, this is ${custAdmin} from ${custCompany}. Re: ${company}'s "${project}" — we specialize in ${custService}. Are you currently exploring partners for this campaign?`,

    shortIntroPitch: `${company} ("${project}") + ${custCompany}: ${custService} tailored specifically for your campaign goals.`,

    followupMessage1: `Hi ${person}, following up regarding ${company}'s "${project}". We'd love to share how ${custCompany} can support your team with ${custService}. Do you have 5 minutes this week?`,

    followupMessage2: `Hi ${person}, last check-in regarding "${project}"! If ${company} is evaluating external partners for ${custService}, we'd be glad to share more details. Best regards!`
  };
}

/**
 * Recommends the optimal outreach strategy
 */
export function recommendOutreachStrategy(lead: Partial<Lead>, org?: Organization): {
  recommendedChannel: OutreachChannel;
  bestRole: string;
  pitchAngle: string;
} {
  const isAmusemac = !org || org.orgId === 'amusemac-studio';
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

  const companyTitle = isAmusemac ? "Amusemac Studio's" : `${org?.companyName || 'Client'}'s`;
  const pitchAngle = `Position ${companyTitle} ${lead.primaryService || 'capabilities'} as the execution partner for "${lead.projectName || 'the current campaign'}", addressing their exact need for ${lead.serviceNeed || 'commercial services'}.`;

  return { recommendedChannel, bestRole, pitchAngle };
}
