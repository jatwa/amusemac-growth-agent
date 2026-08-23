export type UserRole = 'SUPER_ADMIN' | 'BACKEND_ADMIN' | 'ADMIN' | 'TEAM_MEMBER' | 'MANAGER' | 'SALES_USER' | 'VIEWER';

export type OrgStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';

export type PlanId = 'FREE' | 'LITE' | 'PRO' | 'MAX' | 'ENTERPRISE';

export type EmailProviderType = 'ZOHO' | 'GMAIL' | 'MICROSOFT' | 'APPLE_MAIL' | 'CUSTOM_SMTP';

export type AuthProviderType = 'GOOGLE' | 'ZOHO' | 'EMAIL';

export interface AuthIdentity {
  identityId: string;
  userId: string;
  provider: AuthProviderType;
  providerAccountId: string;
  email: string;
  name?: string;
  connectedAt: string;
  isPrimary?: boolean;
}

export interface MailboxConnection {
  connectionId: string;
  orgId: string;
  userId: string;
  provider: EmailProviderType;
  email: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'NEEDS_REAUTHENTICATION';
  lastSyncedAt?: string;
  isDefaultSender?: boolean;
  hasSendPermission?: boolean;
  hasReadPermission?: boolean;
}

export interface UserAccount {
  userId: string;
  orgId: string;
  name: string;
  fullName: string;
  email: string;
  whatsappNumber: string;
  emailVerified: boolean;
  whatsappVerified: boolean;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  authIdentities?: AuthIdentity[];
}

export type User = UserAccount;

export interface OrganizationEmailConfig {
  mailboxId?: string;
  provider: EmailProviderType;
  email: string;
  smtpHost?: string;
  smtpPort?: number;
  imapHost?: string;
  imapPort?: number;
  isDefaultSender?: boolean;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SIMULATED';
}

export interface WhatsAppNotificationConfig {
  hotLeadFound: boolean;
  scoreAboveThreshold: boolean;
  newBuyingSignal: boolean;
  decisionMakerFound: boolean;
  importantFollowUp: boolean;
  replyReceived: boolean;
  campaignResult: boolean;
  searchCompleted: boolean;
  usageWarning: boolean;
}

export interface Organization {
  orgId: string;
  companyName: string;
  tagline: string;
  website: string;
  logoUrl?: string;
  status: OrgStatus;
  planId: PlanId;
  trialEndDate?: string;
  emailConfig: OrganizationEmailConfig;
  connectedMailboxes?: OrganizationEmailConfig[];
  whatsAppNotifications?: WhatsAppNotificationConfig;
  sheetsWebhookUrl: string;
  createdAt: string;
  renewalDate: string;
  adminEmail: string;
  adminName: string;
  notes?: string;
}

export interface SubscriptionFeatureFlags {
  customIcp: boolean;
  crmFeatures: boolean;
  emailFeatures: boolean;
  advancedIntegrations: boolean;
  whiteLabel: boolean;
  customScoring: boolean;
  dedicatedSupport: boolean;
  lockPremiumFields?: boolean;
  whatsAppAlerts?: boolean;
  bulkEnrichment?: boolean;
  apiAccess?: boolean;
}

export interface SubscriptionPlan {
  planId: PlanId;
  name: string;
  monthlyPrice: number;
  priceLabel?: string;
  currency: string; // 'INR'
  badge?: string; // e.g. 'MOST POPULAR'
  monthlyLeadsLimit: number;
  monthlySearchesLimit: number;
  maxLeadsPerSearch: number;
  enrichmentCreditsLimit: number;
  monthlyAiResearchLimit: number;
  monthlyDecisionMakersLimit: number;
  monthlyEmailsLimit: number;
  monthlyWhatsAppLimit: number;
  maxTeamMembers: number;
  featureFlags: SubscriptionFeatureFlags;
}

export interface OrgUsage {
  orgId: string;
  billingPeriod: string; // e.g. "2026-08"
  leadsDiscovered: number;
  searchesRun: number;
  enrichmentCreditsUsed: number;
  aiResearchCount: number;
  decisionMakersFound: number;
  emailsSent: number;
  whatsAppMessagesSent: number;
  enrichmentRequests: number;
  exportsCreated: number;
  outreachActionsCount: number;
}

export interface UsageCheckResult {
  allowed: boolean;
  actionType: 'leads' | 'searches' | 'ai_research' | 'decision_makers' | 'emails' | 'whatsapp' | 'enrichment';
  currentUsage: number;
  limit: number;
  remaining: number;
  planName: string;
  message?: string;
}
