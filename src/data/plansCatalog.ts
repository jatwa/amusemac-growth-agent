import { SubscriptionPlan, Organization, User } from '../types/saas';

export type BillingPeriod = 'MONTHLY' | 'YEARLY';

export interface PlanPricingDetail {
  planId: 'FREE' | 'LITE' | 'PRO' | 'MAX' | 'ENTERPRISE';
  name: string;
  monthlyPrice: number;
  monthlyPriceLabel: string;
  monthlyRazorpayUrl: string;
  annualBasePrice?: number;
  annualPriceLabel?: string;
  discountPercent?: number;
  firstPaymentPrice?: number;
  firstPaymentLabel?: string;
  offerId?: string;
  yearlyRazorpayUrl?: string;
}

export const PRICING_CONFIG: Record<string, PlanPricingDetail> = {
  FREE: {
    planId: 'FREE',
    name: 'Free Trial',
    monthlyPrice: 0,
    monthlyPriceLabel: 'FREE',
    monthlyRazorpayUrl: ''
  },
  LITE: {
    planId: 'LITE',
    name: 'Growth Lite',
    monthlyPrice: 499,
    monthlyPriceLabel: '₹499',
    monthlyRazorpayUrl: 'https://rzp.io/rzp/O7hxPS3',
    annualBasePrice: 5988,
    annualPriceLabel: '₹5,988',
    discountPercent: 16.67,
    firstPaymentPrice: 4989.80,
    firstPaymentLabel: 'First payment ≈ ₹4,989.80',
    offerId: 'offer_TOZstXqadkpvM8',
    yearlyRazorpayUrl: 'https://rzp.io/rzp/DkD0oqC'
  },
  PRO: {
    planId: 'PRO',
    name: 'Growth Pro',
    monthlyPrice: 1499,
    monthlyPriceLabel: '₹1,499',
    monthlyRazorpayUrl: 'https://rzp.io/rzp/IZB7zFj',
    annualBasePrice: 17988,
    annualPriceLabel: '₹17,988',
    discountPercent: 22.17,
    firstPaymentPrice: 14000.06,
    firstPaymentLabel: 'First payment ≈ ₹14,000.06',
    offerId: 'offer_TOZuHFxBaItBP0',
    yearlyRazorpayUrl: 'https://rzp.io/rzp/gOW5X0B9'
  },
  MAX: {
    planId: 'MAX',
    name: 'Growth Max',
    monthlyPrice: 2999,
    monthlyPriceLabel: '₹2,999',
    monthlyRazorpayUrl: 'https://rzp.io/rzp/Ecanmsp',
    annualBasePrice: 35988,
    annualPriceLabel: '₹35,988',
    discountPercent: 30,
    firstPaymentPrice: 25191.60,
    firstPaymentLabel: 'First payment ₹25,191.60',
    offerId: 'offer_TOZp2LabOdB2X8',
    yearlyRazorpayUrl: 'https://rzp.io/rzp/5p35p0N'
  },
  ENTERPRISE: {
    planId: 'ENTERPRISE',
    name: 'Enterprise Scale',
    monthlyPrice: 0,
    monthlyPriceLabel: 'Custom',
    monthlyRazorpayUrl: ''
  }
};

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  FREE: {
    planId: 'FREE',
    name: 'Free Trial',
    monthlyPrice: 0,
    priceLabel: 'FREE',
    currency: 'INR',
    monthlyLeadsLimit: 20,
    monthlySearchesLimit: 2,
    maxLeadsPerSearch: 10,
    enrichmentCreditsLimit: 0,
    monthlyAiResearchLimit: 10,
    monthlyDecisionMakersLimit: 0,
    monthlyEmailsLimit: 0,
    monthlyWhatsAppLimit: 0,
    maxTeamMembers: 1,
    featureFlags: {
      customIcp: false,
      crmFeatures: true,
      emailFeatures: false,
      advancedIntegrations: false,
      whiteLabel: false,
      customScoring: false,
      dedicatedSupport: false,
      lockPremiumFields: true,
      whatsAppAlerts: false,
      bulkEnrichment: false,
      apiAccess: false
    }
  },
  LITE: {
    planId: 'LITE',
    name: 'Growth Lite',
    monthlyPrice: 499,
    priceLabel: '₹499',
    currency: 'INR',
    monthlyLeadsLimit: 500,
    monthlySearchesLimit: 15,
    maxLeadsPerSearch: 50,
    enrichmentCreditsLimit: 100,
    monthlyAiResearchLimit: 100,
    monthlyDecisionMakersLimit: 200,
    monthlyEmailsLimit: 500,
    monthlyWhatsAppLimit: 100,
    maxTeamMembers: 2,
    featureFlags: {
      customIcp: true,
      crmFeatures: true,
      emailFeatures: true,
      advancedIntegrations: false,
      whiteLabel: false,
      customScoring: false,
      dedicatedSupport: false,
      lockPremiumFields: false,
      whatsAppAlerts: true,
      bulkEnrichment: false,
      apiAccess: false
    }
  },
  PRO: {
    planId: 'PRO',
    name: 'Growth Pro',
    monthlyPrice: 1499,
    priceLabel: '₹1,499',
    currency: 'INR',
    badge: 'MOST POPULAR',
    monthlyLeadsLimit: 5000,
    monthlySearchesLimit: 50,
    maxLeadsPerSearch: 100,
    enrichmentCreditsLimit: 1000,
    monthlyAiResearchLimit: 1000,
    monthlyDecisionMakersLimit: 2000,
    monthlyEmailsLimit: 5000,
    monthlyWhatsAppLimit: 500,
    maxTeamMembers: 5,
    featureFlags: {
      customIcp: true,
      crmFeatures: true,
      emailFeatures: true,
      advancedIntegrations: true,
      whiteLabel: false,
      customScoring: true,
      dedicatedSupport: false,
      lockPremiumFields: false,
      whatsAppAlerts: true,
      bulkEnrichment: true,
      apiAccess: false
    }
  },
  MAX: {
    planId: 'MAX',
    name: 'Growth Max',
    monthlyPrice: 2999,
    priceLabel: '₹2,999',
    currency: 'INR',
    monthlyLeadsLimit: 37500,
    monthlySearchesLimit: 150,
    maxLeadsPerSearch: 250,
    enrichmentCreditsLimit: 5000,
    monthlyAiResearchLimit: 10000,
    monthlyDecisionMakersLimit: 15000,
    monthlyEmailsLimit: 25000,
    monthlyWhatsAppLimit: 2000,
    maxTeamMembers: 15,
    featureFlags: {
      customIcp: true,
      crmFeatures: true,
      emailFeatures: true,
      advancedIntegrations: true,
      whiteLabel: true,
      customScoring: true,
      dedicatedSupport: true,
      lockPremiumFields: false,
      whatsAppAlerts: true,
      bulkEnrichment: true,
      apiAccess: true
    }
  },
  ENTERPRISE: {
    planId: 'ENTERPRISE',
    name: 'Enterprise Scale',
    monthlyPrice: 0,
    priceLabel: 'Custom',
    currency: 'INR',
    monthlyLeadsLimit: 100000,
    monthlySearchesLimit: 1000,
    maxLeadsPerSearch: 500,
    enrichmentCreditsLimit: 50000,
    monthlyAiResearchLimit: 50000,
    monthlyDecisionMakersLimit: 50000,
    monthlyEmailsLimit: 100000,
    monthlyWhatsAppLimit: 10000,
    maxTeamMembers: 50,
    featureFlags: {
      customIcp: true,
      crmFeatures: true,
      emailFeatures: true,
      advancedIntegrations: true,
      whiteLabel: true,
      customScoring: true,
      dedicatedSupport: true,
      lockPremiumFields: false,
      whatsAppAlerts: true,
      bulkEnrichment: true,
      apiAccess: true
    }
  }
};

export const DEFAULT_WHATSAPP_NOTIFICATIONS = {
  hotLeadFound: true,
  scoreAboveThreshold: true,
  newBuyingSignal: true,
  decisionMakerFound: true,
  importantFollowUp: true,
  replyReceived: true,
  campaignResult: true,
  searchCompleted: true,
  usageWarning: true
};

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    orgId: 'amusemac-studio',
    companyName: 'Amusemac Studio',
    tagline: 'MAD ABOUT CINEMA',
    website: 'https://amusemacstudio.in',
    status: 'ACTIVE',
    planId: 'ENTERPRISE',
    emailConfig: {
      mailboxId: 'mbx-zoho-primary',
      provider: 'ZOHO',
      email: 'hello@amusemacstudio.in',
      smtpHost: 'smtppro.zoho.com',
      smtpPort: 465,
      imapHost: 'imappro.zoho.com',
      imapPort: 993,
      isDefaultSender: true,
      status: 'CONNECTED'
    },
    connectedMailboxes: [
      {
        mailboxId: 'mbx-zoho-primary',
        provider: 'ZOHO',
        email: 'hello@amusemacstudio.in',
        smtpHost: 'smtppro.zoho.com',
        smtpPort: 465,
        imapHost: 'imappro.zoho.com',
        imapPort: 993,
        isDefaultSender: true,
        status: 'CONNECTED'
      }
    ],
    whatsAppNotifications: DEFAULT_WHATSAPP_NOTIFICATIONS,
    sheetsWebhookUrl: 'https://script.google.com/macros/s/AKfycbz_amusemac_sheet/exec',
    createdAt: '2026-01-01',
    renewalDate: '2027-01-01',
    adminEmail: 'hello@amusemacstudio.in',
    adminName: 'Amusemac Admin',
    notes: 'Primary Amusemac Studio platform owner workspace.'
  },
  {
    orgId: 'plusone-design',
    companyName: 'Plus One Design',
    tagline: 'Branding & UI/UX Experience Studio',
    website: 'https://plusonedesign.in',
    status: 'TRIAL',
    planId: 'PRO',
    trialEndDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    emailConfig: {
      mailboxId: 'mbx-custom-primary',
      provider: 'CUSTOM_SMTP',
      email: 'contact@plusonedesign.in',
      isDefaultSender: true,
      status: 'SIMULATED'
    },
    connectedMailboxes: [
      {
        mailboxId: 'mbx-custom-primary',
        provider: 'CUSTOM_SMTP',
        email: 'contact@plusonedesign.in',
        isDefaultSender: true,
        status: 'SIMULATED'
      }
    ],
    whatsAppNotifications: DEFAULT_WHATSAPP_NOTIFICATIONS,
    sheetsWebhookUrl: '',
    createdAt: '2026-08-01',
    renewalDate: '2026-09-01',
    adminEmail: 'alex@plusonedesign.in',
    adminName: 'Alex Rivera',
    notes: '7-day trial evaluation for design studio client.'
  }
];

export const INITIAL_USERS: User[] = [
  {
    userId: 'usr-super-admin',
    orgId: 'amusemac-studio',
    name: 'Super Admin',
    fullName: 'Super Admin',
    email: 'admin@amusemacstudio.in',
    whatsappNumber: '+91 98765 00001',
    emailVerified: true,
    whatsappVerified: true,
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01',
    authIdentities: [
      {
        identityId: 'id-superadmin-email',
        userId: 'usr-super-admin',
        provider: 'EMAIL',
        providerAccountId: 'admin@amusemacstudio.in',
        email: 'admin@amusemacstudio.in',
        name: 'Super Admin',
        connectedAt: '2026-01-01',
        isPrimary: true
      }
    ]
  },
  {
    userId: 'usr-amusemac-lead',
    orgId: 'amusemac-studio',
    name: 'Growth Lead',
    fullName: 'Growth Lead',
    email: 'hello@amusemacstudio.in',
    whatsappNumber: '+91 98765 00002',
    emailVerified: true,
    whatsappVerified: true,
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01',
    authIdentities: [
      {
        identityId: 'id-amusemac-zoho',
        userId: 'usr-amusemac-lead',
        provider: 'ZOHO',
        providerAccountId: 'hello@amusemacstudio.in',
        email: 'hello@amusemacstudio.in',
        name: 'Growth Lead',
        connectedAt: '2026-01-01',
        isPrimary: true
      }
    ]
  },
  {
    userId: 'usr-plusone-admin',
    orgId: 'plusone-design',
    name: 'Alex Rivera',
    fullName: 'Alex Rivera',
    email: 'alex@plusonedesign.in',
    whatsappNumber: '+91 98765 00003',
    emailVerified: true,
    whatsappVerified: true,
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-08-01',
    authIdentities: [
      {
        identityId: 'id-plusone-email',
        userId: 'usr-plusone-admin',
        provider: 'EMAIL',
        providerAccountId: 'alex@plusonedesign.in',
        email: 'alex@plusonedesign.in',
        name: 'Alex Rivera',
        connectedAt: '2026-08-01',
        isPrimary: true
      }
    ]
  }
];
