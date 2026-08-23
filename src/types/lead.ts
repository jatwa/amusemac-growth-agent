export type ServiceCategory = string;
export type AmusemacService = ServiceCategory;

export type SalesStatus =
  | 'DISCOVERED'
  | 'RESEARCHED'
  | 'NEW'
  | 'QUALIFIED'
  | 'CONTACTED'
  | 'REPLIED'
  | 'INTERESTED'
  | 'MEETING'
  | 'PROPOSAL'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST'
  | 'NOT A FIT'
  | 'FOLLOW_UP_SCHEDULED'
  | 'NURTURING'
  | 'ON_HOLD';

export type PriorityTier = 'HOT' | 'WARM' | 'COLD' | 'LOW' | 'HOT/WARM';
export type LeadPriority = PriorityTier;
export type ScoreTier = PriorityTier;

export type FeedbackRating = 'GOOD_LEAD' | 'BAD_LEAD' | 'WON_LEAD' | 'LOST_LEAD' | 'NEUTRAL' | 'GOOD LEAD';
export type CompetitorCheckStatus = 'CLIENT_END_USER' | 'QUALIFIED_OUTSOURCER' | 'EXCLUDED_COMPETITOR';
export type CompetitorStatus = CompetitorCheckStatus;

export type BuyingSignalType =
  | 'RFP_VENDOR_CALL'
  | 'CAMPAIGN_ANNOUNCEMENT'
  | 'PRODUCTION_HIRING'
  | 'EXPANSION_SIGNAL'
  | 'NEW_PRODUCT_LAUNCH'
  | 'NEW_LOCATION_EXPANSION'
  | 'FUNDING_RAISED'
  | 'MARKETING_HIRING'
  | 'REBRANDING_CAMPAIGN'
  | 'SEASONAL_FESTIVE_CAMPAIGN'
  | 'ADVERTISING_PUSH'
  | 'UPCOMING_EVENT'
  | 'NEW_PARTNERSHIP';

export type OutreachChannel = 'EMAIL' | 'LINKEDIN' | 'WHATSAPP' | 'DIRECT_PITCH' | 'Email' | 'LinkedIn' | 'WhatsApp' | 'Website Contact Form';

export interface OutreachPackage {
  emailSubject: string;
  emailBody?: string;
  personalizedEmail?: string;
  linkedInConnectionNote?: string;
  linkedinConnection?: string;
  linkedInFollowUpNote?: string;
  linkedinFollowup?: string;
  whatsAppMessage?: string;
  whatsappMessage?: string;
  directPitchScript?: string;
  shortIntroPitch?: string;
  followupMessage1?: string;
  followupMessage2?: string;
  followUpSequence?: string[];
}

export interface RawCompany {
  companyId: string;
  companyName: string;
  industry: string;
  category: string;
  location: string;
  website: string;
  phone: string;
  email: string;
  socialLinks: string[];
  mapsUrl: string;
  description: string;
  source: string;
  searchQuery: string;
  discoveredAt: string;
}

export interface ClientProfile {
  clientId: string;
  companyName: string;
  tagline: string;
  logoUrl?: string;
  industry: string;
  services: string[];
  products: string[];
  targetCategories: string[];
  targetLocations: string[];
  positiveKeywords: string[];
  negativeKeywords: string[];
  competitorExclusions: string[];
  minIcpScore: number;
}

export interface BuyingSignalDetail {
  signal: string;
  signalType: BuyingSignalType;
  source: string;
  date?: string;
  confidenceScore: number;
}

export interface DecisionMakerDetail {
  personName: string;
  designation: string;
  company: string;
  publicProfileUrl: string;
  sourceUrl: string;
  confidenceScore: number;
}

export interface OpportunityAngle {
  whyThisIsAGoodProspect: string;
  potentialOpportunity: string;
  recommendedServiceFit: string;
}

export interface SearchReport {
  searchQuery: string;
  targetLocation: string;
  clientId: string;
  totalDiscovered: number;
  duplicatesRemoved: number;
  competitorsRemoved: number;
  icpRejected: number;
  qualifiedCount: number;
  shortlistedCount: number;
  topOpportunities: string[];
  topIndustries: Record<string, number>;
  topLocations: Record<string, number>;
  topBuyingSignals: Record<string, number>;
  executionTimeMs: number;
}

export interface ScoreBreakdown {
  icpFitScore: number; // Max 20
  serviceFitScore: number; // Max 20
  buyerFitScore: number; // Max 15
  buyingSignalScore: number; // Max 20
  locationFitScore: number; // Max 10
  companyFitScore: number; // Max 10
  contactQualityScore: number; // Max 5
  totalScore: number; // Max 100
  scoreReason: string;
  evidence: string;
}

export type VerificationStatus = 'VERIFIED_SOURCE' | 'AI_INFERRED' | 'UNVERIFIED' | 'LOCAL_DATASET' | 'DISCOVERED' | 'UNVERIFIED_DEMO';

export interface LeadProvenance {
  company: string;
  website: string;
  sourceUrl: string;
  sourceType: 'WEB_SEARCH' | 'GOOGLE_MAPS' | 'LINKEDIN_DIRECTORY' | 'SEEDED_DEMO_DATA';
  discoveredAt: string;
  decisionMaker: string;
  decisionMakerTitle: string;
  contactSource: string;
  buyingSignal: string;
  buyingSignalSource: string;
  verificationStatus: VerificationStatus;
  confidence: number;
  isDemoData?: boolean;
}

export interface Lead {
  leadId: string;
  companyName: string;
  projectName: string;
  serviceNeed: string;
  primaryService: ServiceCategory;
  whyThisLead: string;
  buyingSignal: string;
  buyingSignalType: BuyingSignalType;
  location: string;
  industry: string;
  aiScore: number;
  scoreTier: PriorityTier;
  confidenceScore: number;
  estimatedProjectValue: string;
  decisionMakerName: string;
  decisionMakerDesignation: string;
  email: string;
  phone: string;
  website: string;
  outreachStatus: SalesStatus;
  competitorCheckStatus: CompetitorCheckStatus;
  scoreReason: string;
  priorityReason: string;
  sourceUrls: string[];
  researchDate: string;
  priority: PriorityTier;
  scoreBreakdown?: ScoreBreakdown;

  // Extended B2B Intelligence fields
  rawCompanyId?: string;
  icpMatchScore?: number;
  whyThisIsAGoodProspect?: string;
  potentialOpportunity?: string;
  buyingSignalDetails?: BuyingSignalDetail[];
  decisionMakerDetails?: DecisionMakerDetail[];
  opportunityAngle?: OpportunityAngle;

  // Extended optional properties for backwards compatibility
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  googleMapsUrl?: string;
  rating?: number | string;
  reviewsCount?: number | string;
  businessDescription?: string;
  businessCategory?: string;
  companySize?: string;
  servicesProvided?: string[];
  secondaryServices?: string[];
  serviceMatchRationale?: string;
  decisionMakerCompany?: string;
  decisionMakerSourceUrl?: string;
  decisionMakerProfileUrl?: string;
  outreachPackage?: OutreachPackage;
  recommendedChannel?: string;
  recommendedPitch?: string;
  nextAction?: string;
  lastContacted?: string;
  lastContactMethod?: string;
  followUpDate?: string;
  contactabilityScore?: number;
  serviceMatchScore?: number;
  searchQuery?: string;
  userFeedback?: FeedbackRating;
  notes?: string;
  leadSource?: string;
  verificationStatus?: VerificationStatus;
  provenance?: LeadProvenance;
}

export interface SearchFilterOptions {
  industry: string;
  serviceNeed?: string;
  location: string;
  minScore: number;
  maxResults: number;
  requireBuyingSignal: boolean;
  excludeInHouseCompetitors: boolean;
  clientId?: string;
}

export interface LeadSearchResult {
  leads: Lead[];
  report: SearchReport;
  totalFound: number;
  deduplicatedCount: number;
  filteredOutCount: number;
  competitorsExcludedCount: number;
}

export interface UserFeedbackLog {
  id: string;
  leadId: string;
  companyName: string;
  feedback: FeedbackRating;
  timestamp: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
}
