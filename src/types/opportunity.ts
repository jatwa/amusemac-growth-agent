import { Lead } from './lead';

export type IntentType = 'HOT' | 'WARM' | 'LOW' | 'REJECT';

export type EmploymentType =
  | 'Project / Contract'
  | 'Retainer'
  | 'Freelance'
  | 'Full-Time'
  | 'RFP / Tender';

export type OpportunityDataStatus = 'REAL_PUBLIC' | 'DEMO_LOCAL';

export type OpportunitySourceType =
  | 'PUBLIC_WEB'
  | 'LINKEDIN_PUBLIC'
  | 'UPWORK_PUBLIC'
  | 'FREELANCER_PUBLIC'
  | 'CONTRA_PUBLIC'
  | 'PEOPLEPERHOUR_PUBLIC'
  | 'WELLFOUND_PUBLIC'
  | 'COMPANY_RFP'
  | 'LOCAL_DEMO';

export interface OpportunityProviderInfo {
  id: OpportunitySourceType;
  name: string;
  status: 'IMPLEMENTED' | 'REQUIRES_OFFICIAL_API';
  statusMessage: string;
  isImplemented: boolean;
}

export interface OpportunityContact {
  name?: string;
  role?: string;
  designation?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  profileUrl?: string;
}

export interface OutreachDraft {
  emailSubject: string;
  emailBody: string;
  pitchSummary: string;
  recommendedAngle: string;
}

export interface OpportunityLead {
  id: string;
  leadId: string; // for compatibility with Lead
  title: string;
  companyName: string; // Requester / Company name
  requester: string;
  requirement: string;
  matchedServices: string[];
  serviceMatchScore: number;
  source: string; // 'LinkedIn Jobs', 'Upwork', 'Contra', 'Company RFP', 'Wellfound', 'Public Web', etc.
  sourceUrl: string;
  location: string;
  country: string;
  postedAt: string;
  deadline?: string;
  budget: string;
  employmentType: EmploymentType;
  projectType: string;
  intentType: IntentType;
  intentScore: number; // 0 - 100
  buyerDemandScore?: number;
  buyer_demand_score?: number;
  researchConfidenceScore?: number;
  signals?: any[];
  intentTier?: 'HOT' | 'WARM' | 'WATCHLIST' | 'REJECT';
  intent_tier?: 'HOT' | 'WARM' | 'WATCHLIST' | 'REJECT';
  tierLabel?: string;
  accountIntentScore?: number;
  account_intent_score?: number;
  personIntentScore?: number;
  person_intent_score?: number;
  freshnessStatus?: 'FRESH' | 'RECENT' | 'AGING' | 'HISTORICAL';
  freshness_status?: 'FRESH' | 'RECENT' | 'AGING' | 'HISTORICAL';
  whyThisIsALead?: string;
  userFeedback?: any;
  leadQualityScore?: number; // 0 - 100
  matchScore: number; // 0 - 100
  contactInfo?: OpportunityContact;
  description: string;
  keywords: string[];
  status: string; // 'DISCOVERED', 'NEW', 'QUALIFIED', 'SAVED'
  dataStatus: OpportunityDataStatus; // 'REAL_PUBLIC' | 'DEMO_LOCAL'
  savedAt?: string;
  whyThisIsAMatch: string;
  evidence?: string;
  outreachDraft?: OutreachDraft;

  // Location, Work Mode, and Engagement Type fields
  locationMode?: 'worldwide' | 'countries' | 'manual';
  countries?: string[];
  manualLocation?: string;
  workMode?: 'REMOTE_WORLDWIDE' | 'REMOTE' | 'ONSITE' | 'HYBRID' | 'ANY';
  engagementType?: 'PROJECT' | 'CONTRACT' | 'FREELANCE' | 'RETAINER' | 'RFP_VENDOR' | 'OUTSOURCING' | 'FULL_TIME' | 'PART_TIME' | 'ANY';
  opportunityType?: string;
  demand_evidence?: string;
  provider_evidence?: string;
  qualification_status?: string;
  qualification_reason?: string;

  // Deep Research fields
  company_name?: string;
  company_website?: string;
  company_email?: string;
  company_phone?: string;
  company_linkedin?: string;
  contact_name?: string;
  contact_role?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_linkedin?: string;
  decisionMakerName?: string;
  decision_maker_name?: string;
  posted_date?: string;
  posted_time?: string;
  posted_timezone?: string;
  posted_at_raw?: string;
  posted_at_iso?: string;
  discovered_at?: string;
  source_platform?: string;
  source_provider?: string;
  source_domain?: string;
  source_url?: string;
  original_source_url?: string;
  research_confidence_score?: number;
  confidenceScore?: number;
  research_sources?: string[];
  research_source_count?: number;
  researchStatus?: string;
  deepResearch?: any;

  // Compatibility fields with Lead type
  industry: string;
  businessDescription?: string;
  aiScore: number;
  scoreTier: 'HOT' | 'WARM' | 'COLD';
  website?: string;
  email?: string;
  phone?: string;
  outreachStatus?: string;
  verificationStatus?: string;
  sourceUrls?: string[];
  fingerprint?: string;
  projectName?: string;
  serviceNeed?: string;
  primaryService?: string;
  whyThisLead?: string;
  priority?: string;
}

export const AMUSEMAC_SERVICE_TAXONOMY: Record<string, string[]> = {
  VIDEO: [
    'AI Video Production',
    'AI Image Generation',
    'Promotional Videos',
    'Corporate Videos',
    'Brand Films',
    'Product Videos',
    'Social Media Videos',
    'Reels / Shorts',
    'Motion Videos',
    'Motion Graphics',
    'Music Videos',
    'Trailer Editing',
    'Documentary/Video Editing',
    'Film Editing'
  ],
  FILM_PRODUCTION: [
    'Film Production',
    'Pre-Production',
    'Post-Production',
    'Production Design',
    'Art Direction',
    'Direction',
    'Script Development',
    'Film Budgeting',
    'Production Planning'
  ],
  DESIGN: [
    'Graphic Design',
    'Posters',
    'Campaign Creatives',
    'Key Art',
    'Motion Design',
    'Title Design',
    'Visual Development'
  ],
  AUDIO: [
    'Sound Design',
    'Music',
    'Background Score',
    'Audio Post'
  ],
  DIGITAL: [
    'Website Creation',
    'Social Media Management',
    'Social Media Content',
    'Digital Campaigns',
    'Promotional Campaigns',
    'AI Content Creation'
  ]
};
