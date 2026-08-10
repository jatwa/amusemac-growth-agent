import { Lead } from '../types/lead';
import { PlanId, UserAccount, Organization, UserRole } from '../types/saas';
import { SUBSCRIPTION_PLANS } from '../data/plansCatalog';

/**
 * Checks if a user is authorized to access the platform Admin Panel (/admin).
 * Platform SUPER_ADMIN is the ONLY role authorized to access Admin Panel.
 * Subscription plans (PRO, MAX, ENTERPRISE) DO NOT grant platform Admin Panel access.
 */
export function canAccessAdminPanel(user: UserAccount | null, org?: Organization): boolean {
  if (!user) return false;
  return user.role === 'SUPER_ADMIN';
}

/**
 * Checks if a feature is enabled for an organization based on its subscription plan flags.
 */
export function canUseFeature(org: Organization, featureKey: keyof typeof SUBSCRIPTION_PLANS.FREE.featureFlags): boolean {
  const plan = SUBSCRIPTION_PLANS[org.planId] || SUBSCRIPTION_PLANS.FREE;
  return Boolean(plan.featureFlags[featureKey]);
}

/**
 * Enforces role hierarchy permissions (SUPER_ADMIN > ADMIN > MANAGER > SALES_USER > VIEWER)
 */
export function hasPermission(user: UserAccount | null, requiredRole: UserRole): boolean {
  if (!user) return false;
  const roleHierarchy: Record<UserRole, number> = {
    SUPER_ADMIN: 5,
    ADMIN: 4,
    MANAGER: 3,
    SALES_USER: 2,
    VIEWER: 1
  };
  return (roleHierarchy[user.role] || 0) >= (roleHierarchy[requiredRole] || 0);
}

/**
 * Applies field-level entitlement masking for Free plan users
 */
export function maskLeadForEntitlements(lead: Lead, planId: PlanId): Lead {
  const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.FREE;

  if (!plan.featureFlags.lockPremiumFields) {
    return lead; // Paid plan -> Full access
  }

  // Free Plan Masking
  return {
    ...lead,
    decisionMakerName: '🔒 Unlock Full Lead Intelligence',
    decisionMakerDesignation: '🔒 Premium Designation Field',
    email: '🔒 Upgrade Plan to View Email',
    phone: '🔒 Upgrade Plan to View Phone',
    linkedin: '🔒 Upgrade to View Profile',
    decisionMakerProfileUrl: undefined,
    decisionMakerSourceUrl: undefined,
    decisionMakerDetails: [],
    whyThisIsAGoodProspect: lead.whyThisIsAGoodProspect ? `${lead.whyThisIsAGoodProspect.slice(0, 45)}... 🔒 [Upgrade to view full analysis]` : '🔒 Locked Analysis',
    scoreReason: '🔒 Full deterministic 7-factor breakdown locked on Free Plan. Upgrade to view factor weights.',
    scoreBreakdown: lead.scoreBreakdown ? {
      ...lead.scoreBreakdown,
      scoreReason: '🔒 Upgrade to view factor breakdown',
      evidence: '🔒 Upgrade to view evidence links'
    } : undefined
  };
}

/**
 * Batch entitlement mask helper
 */
export function maskLeadsForEntitlements(leads: Lead[], planId: PlanId): Lead[] {
  return leads.map(l => maskLeadForEntitlements(l, planId));
}
