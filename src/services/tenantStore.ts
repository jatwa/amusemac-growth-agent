import { Lead, ClientProfile } from '../types/lead';
import { Organization } from '../types/saas';
import { INITIAL_ORGANIZATIONS } from '../data/plansCatalog';
import { AMUSEMAC_CLIENT_PROFILE, SECONDARY_CLIENT_PROFILE } from '../data/clientProfiles';

const TENANT_LEADS_PREFIX = 'amusemac_tenant_leads_';
const TENANT_PROFILE_PREFIX = 'amusemac_tenant_profile_';

export const DEFAULT_CUSTOMER_PROFILE: ClientProfile = {
  clientId: 'cli-default-workspace',
  companyName: 'Client Workspace',
  tagline: 'Growth & Business Prospecting Workspace',
  industry: 'General Business & Technology',
  services: ['B2B Solutions', 'Technology Services', 'Consulting'],
  products: ['Digital Products', 'Enterprise Solutions'],
  targetCategories: ['Technology', 'Services', 'Retail', 'E-commerce'],
  targetLocations: ['India', 'Global'],
  positiveKeywords: ['Growth', 'Expansion', 'Technology', 'Solutions'],
  negativeKeywords: ['Internship', 'Job Seeker', 'Student'],
  competitorExclusions: [],
  minIcpScore: 50
};

export interface LeadCompletenessResult {
  availableCount: number;
  totalCount: number;
  percentage: number;
  availableFields: string[];
  missingFields: string[];
}

export function calculateLeadCompleteness(lead: any): LeadCompletenessResult {
  if (!lead) {
    return { availableCount: 0, totalCount: 12, percentage: 0, availableFields: [], missingFields: [] };
  }

  const fieldsCheck = [
    { name: 'Company Name', val: lead.companyName || lead.requester },
    { name: 'Requirement', val: lead.requirement || lead.description || lead.serviceNeed },
    { name: 'Service Needed', val: (Array.isArray(lead.matchedServices) && lead.matchedServices.length > 0) ? lead.matchedServices.join(', ') : lead.primaryService },
    { name: 'Location', val: lead.location },
    { name: 'Source', val: lead.source },
    { name: 'Source URL', val: lead.sourceUrl || (Array.isArray(lead.sourceUrls) ? lead.sourceUrls[0] : '') },
    { name: 'Contact Name', val: lead.contactInfo?.name || (lead.decisionMakerName && lead.decisionMakerName !== 'Not found' ? lead.decisionMakerName : '') },
    { name: 'Email', val: lead.contactInfo?.email || (lead.email && lead.email !== 'Not found' ? lead.email : '') },
    { name: 'Phone', val: lead.contactInfo?.phone || (lead.phone && lead.phone !== 'Not found' ? lead.phone : '') },
    { name: 'Website', val: lead.website && lead.website !== 'Not found' ? lead.website : '' },
    { name: 'Budget', val: lead.budget && lead.budget !== 'Budget on Discussion' ? lead.budget : '' },
    { name: 'Deadline', val: lead.deadline }
  ];

  const availableFields: string[] = [];
  const missingFields: string[] = [];

  for (const f of fieldsCheck) {
    if (f.val && String(f.val).trim() !== '' && String(f.val) !== 'Not found') {
      availableFields.push(f.name);
    } else {
      missingFields.push(f.name);
    }
  }

  const availableCount = availableFields.length;
  const totalCount = fieldsCheck.length;
  const percentage = Math.round((availableCount / totalCount) * 100);

  return {
    availableCount,
    totalCount,
    percentage,
    availableFields,
    missingFields
  };
}

/**
 * Filter function ensuring demo leads never populate normal CRM lists
 */
export function filterRealPublicLeadsOnly<T extends { dataStatus?: string; leadId?: string }>(leads: T[]): T[] {
  if (!Array.isArray(leads)) return [];
  return leads.filter(l => l && l.dataStatus !== 'DEMO_LOCAL' && !(l.leadId && l.leadId.startsWith('DEMO-')));
}

/**
 * Retrieves leads exclusively belonging to specified organization_id (Real Public leads ONLY)
 */
export function getOrgLeads(orgId: string, defaultLeads: Lead[] = []): Lead[] {
  try {
    const saved = localStorage.getItem(`${TENANT_LEADS_PREFIX}${orgId}`);
    if (saved) {
      const parsed: Lead[] = JSON.parse(saved);
      const cleaned = filterRealPublicLeadsOnly(parsed);
      // Automatically purge demo leads from local storage
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(`${TENANT_LEADS_PREFIX}${orgId}`, JSON.stringify(cleaned));
      }
      return cleaned;
    }
  } catch (e) {
    console.error(`Failed to parse leads for org ${orgId}:`, e);
  }
  return filterRealPublicLeadsOnly(defaultLeads);
}

/**
 * Saves leads isolated by organization_id (ensures DEMO_LOCAL leads are never persisted as normal leads)
 */
export function saveOrgLeads(orgId: string, leads: Lead[]): void {
  try {
    const realPublicLeads = filterRealPublicLeadsOnly(leads);
    localStorage.setItem(`${TENANT_LEADS_PREFIX}${orgId}`, JSON.stringify(realPublicLeads));
  } catch (e) {
    console.error(`Failed to save leads for org ${orgId}:`, e);
  }
}

/**
 * Retrieves Client ICP Profile for organization_id
 */
export function getOrgClientProfile(orgId: string): ClientProfile {
  try {
    const saved = localStorage.getItem(`${TENANT_PROFILE_PREFIX}${orgId}`);
    if (saved) return JSON.parse(saved);
  } catch (e) {}

  if (orgId === 'amusemac-studio') return AMUSEMAC_CLIENT_PROFILE;
  if (orgId === 'plusone-design') return SECONDARY_CLIENT_PROFILE;
  return DEFAULT_CUSTOMER_PROFILE;
}

/**
 * Saves Client ICP Profile for organization_id
 */
export function saveOrgClientProfile(orgId: string, profile: ClientProfile): void {
  try {
    localStorage.setItem(`${TENANT_PROFILE_PREFIX}${orgId}`, JSON.stringify(profile));
  } catch (e) {
    console.error(`Failed to save profile for org ${orgId}:`, e);
  }
}

/**
 * Saves all Organizations list
 */
export function saveOrganizationsList(orgs: Organization[]): void {
  try {
    localStorage.setItem('amusemac_organizations_list', JSON.stringify(orgs));
  } catch (e) {}
}

/**
 * Loads Organizations list
 */
export function loadOrganizationsList(): Organization[] {
  try {
    const saved = localStorage.getItem('amusemac_organizations_list');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return INITIAL_ORGANIZATIONS;
}
