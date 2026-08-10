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

/**
 * Retrieves leads exclusively belonging to specified organization_id
 */
export function getOrgLeads(orgId: string, defaultLeads: Lead[] = []): Lead[] {
  try {
    const saved = localStorage.getItem(`${TENANT_LEADS_PREFIX}${orgId}`);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(`Failed to parse leads for org ${orgId}:`, e);
  }
  return defaultLeads;
}

/**
 * Saves leads isolated by organization_id
 */
export function saveOrgLeads(orgId: string, leads: Lead[]): void {
  try {
    localStorage.setItem(`${TENANT_LEADS_PREFIX}${orgId}`, JSON.stringify(leads));
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
