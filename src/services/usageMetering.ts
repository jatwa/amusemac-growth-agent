import { Organization, OrgUsage, UsageCheckResult, SubscriptionPlan } from '../types/saas';
import { SUBSCRIPTION_PLANS } from '../data/plansCatalog';

const USAGE_PREFIX = 'amusemac_org_usage_';

function getCurrentBillingPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getOrgUsage(orgId: string): OrgUsage {
  const period = getCurrentBillingPeriod();
  const key = `${USAGE_PREFIX}${orgId}_${period}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {}

  return {
    orgId,
    billingPeriod: period,
    leadsDiscovered: 0,
    searchesRun: 0,
    enrichmentCreditsUsed: 0,
    aiResearchCount: 0,
    decisionMakersFound: 0,
    emailsSent: 0,
    whatsAppMessagesSent: 0,
    enrichmentRequests: 0,
    exportsCreated: 0,
    outreachActionsCount: 0
  };
}

export function saveOrgUsage(usage: OrgUsage): void {
  const key = `${USAGE_PREFIX}${usage.orgId}_${usage.billingPeriod}`;
  try {
    localStorage.setItem(key, JSON.stringify(usage));
  } catch (e) {}
}

export function trackOrgUsage(
  orgId: string,
  actionType: 'leads' | 'searches' | 'ai_research' | 'decision_makers' | 'emails' | 'enrichment',
  count: number = 1
): OrgUsage {
  const usage = getOrgUsage(orgId);

  if (actionType === 'leads') usage.leadsDiscovered += count;
  if (actionType === 'searches') usage.searchesRun += count;
  if (actionType === 'enrichment') usage.enrichmentCreditsUsed += count;
  if (actionType === 'ai_research') usage.aiResearchCount += count;
  if (actionType === 'decision_makers') usage.decisionMakersFound += count;
  if (actionType === 'emails') usage.emailsSent += count;

  saveOrgUsage(usage);
  return usage;
}

export function checkPlanAllowance(
  org: Organization,
  actionType: 'leads' | 'searches' | 'ai_research' | 'decision_makers' | 'emails' | 'enrichment',
  requestedCount: number = 1
): UsageCheckResult {
  const plan: SubscriptionPlan = SUBSCRIPTION_PLANS[org.planId] || SUBSCRIPTION_PLANS.FREE;
  const usage = getOrgUsage(org.orgId);

  let currentUsage = 0;
  let limit = 0;

  if (actionType === 'leads') {
    currentUsage = usage.leadsDiscovered;
    limit = plan.monthlyLeadsLimit;
  } else if (actionType === 'searches') {
    currentUsage = usage.searchesRun;
    limit = plan.monthlySearchesLimit;
  } else if (actionType === 'ai_research') {
    currentUsage = usage.aiResearchCount;
    limit = plan.monthlyAiResearchLimit;
  } else if (actionType === 'decision_makers') {
    currentUsage = usage.decisionMakersFound;
    limit = plan.monthlyDecisionMakersLimit;
  } else if (actionType === 'emails') {
    currentUsage = usage.emailsSent;
    limit = plan.monthlyEmailsLimit;
  }

  const remaining = Math.max(0, limit - currentUsage);
  const allowed = (currentUsage + requestedCount) <= limit;

  return {
    allowed,
    actionType,
    currentUsage,
    limit,
    remaining,
    planName: plan.name,
    message: allowed
      ? undefined
      : `You have reached your monthly ${actionType.replace('_', ' ')} limit (${currentUsage}/${limit}) on the ${plan.name} plan. Please upgrade your subscription.`
  };
}

export function resetOrgUsage(orgId: string): OrgUsage {
  const usage = getOrgUsage(orgId);
  usage.leadsDiscovered = 0;
  usage.searchesRun = 0;
  usage.aiResearchCount = 0;
  usage.decisionMakersFound = 0;
  usage.emailsSent = 0;
  usage.exportsCreated = 0;
  saveOrgUsage(usage);
  return usage;
}
