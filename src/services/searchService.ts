import { Lead, SearchReport } from '../types/lead';
import { OpportunityLead, OutreachDraft, OpportunityProviderInfo } from '../types/opportunity';

export interface SearchFilterParams {
  service?: string;
  industry?: string;
  source?: string;
  domain?: string;
  opportunityType?: string;
  engagementType?: 'PROJECT' | 'CONTRACT' | 'FREELANCE' | 'RETAINER' | 'RFP_VENDOR' | 'OUTSOURCING' | 'FULL_TIME' | 'PART_TIME' | 'ANY';
  companySize?: string;
  decisionMakerRole?: string;
  postedWithin?: string; // '1d' | '2d' | '3d' | '7d' | '30d'
}

export interface ServerSearchOptions {
  query: string;
  locationMode?: 'worldwide' | 'countries' | 'manual';
  countries?: string[];
  manualLocation?: string;
  location?: string;
  workMode?: 'REMOTE_WORLDWIDE' | 'REMOTE' | 'ONSITE' | 'HYBRID' | 'ANY';
  engagementType?: 'PROJECT' | 'CONTRACT' | 'FREELANCE' | 'RETAINER' | 'RFP_VENDOR' | 'OUTSOURCING' | 'FULL_TIME' | 'PART_TIME' | 'ANY';
  opportunityType?: string;
  count?: number | 'MAXIMUM';
  resultLimit?: number | 'MAXIMUM';
  resultMode?: 'MAXIMUM' | 'FIXED';
  filters?: SearchFilterParams;
  industryCategory?: string;
  selectedServices?: string[];
  clientId?: string;
  authToken?: string;
  searchMode?: 'live' | 'demo' | 'auto';
  explicitDemo?: boolean;
  includeDemoFallback?: boolean;
  postedWithin?: string;
}

export interface ServerSearchResult {
  success: boolean;
  mode?: string;
  isDemoUsed?: boolean;
  query?: string;
  locationMode?: string;
  countries?: string[];
  manualLocation?: string;
  location?: string;
  workMode?: string;
  engagementType?: string;
  opportunityType?: string;
  total?: number;
  totalFound?: number;
  source?: string;
  report?: SearchReport;
  leads: OpportunityLead[];
  allLeads?: OpportunityLead[];
  history?: any[];
  metrics?: any;
  providersRegistry?: OpportunityProviderInfo[];
  errorCode?: string;
  message?: string;
}

export async function fetchSerpApiQuota(): Promise<{ success: boolean; combinedRemaining: number; isExhausted: boolean }> {
  let token = '';
  let orgId = '';
  if (typeof localStorage !== 'undefined') {
    try {
      const sess = JSON.parse(localStorage.getItem('amusemac_auth_session') || '{}');
      token = sess.token || '';
      orgId = sess.organization?.orgId || '';
    } catch (e) {}
  }

  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (orgId) headers['X-Organization-Id'] = orgId;
    const res = await fetch('/api/serpapi/quota', { headers });
    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        combinedRemaining: Number(data.combinedRemaining || 0),
        isExhausted: data.isExhausted === true
      };
    }
    return { success: false, combinedRemaining: 0, isExhausted: true };
  } catch (e) {
    return { success: false, combinedRemaining: 0, isExhausted: true };
  }
}

export async function executeServerSearch(options: ServerSearchOptions): Promise<ServerSearchResult> {
  let token = options.authToken || '';
  let orgId = '';

  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('amusemac_auth_session');
      if (saved) {
        const session = JSON.parse(saved);
        if (!token && session && session.token) {
          token = session.token;
        }
        if (session && session.organization && session.organization.orgId) {
          orgId = session.organization.orgId;
        }
      }
    } catch (e) {}
  }

  if (!token) {
    return {
      success: false,
      errorCode: 'UNAUTHENTICATED',
      message: 'Authentication required. Please sign in to perform searches.',
      leads: []
    };
  }

  try {
    const filters: SearchFilterParams = options.filters || {
      service: '',
      industry: options.industryCategory || '',
      opportunityType: options.opportunityType || '',
      source: '',
      postedWithin: options.postedWithin || ''
    };

    const resLimit = options.resultLimit !== undefined ? options.resultLimit : (options.count !== undefined ? options.count : 'MAXIMUM');
    const resMode = options.resultMode || (resLimit === 'MAXIMUM' ? 'MAXIMUM' : 'FIXED');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    if (orgId) {
      headers['X-Organization-Id'] = orgId;
    }

    const response = await fetch('/api/search', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: options.query,
        locationMode: options.locationMode || 'worldwide',
        countries: options.countries || [],
        manualLocation: options.manualLocation || '',
        workMode: options.workMode || 'REMOTE_WORLDWIDE',
        engagementType: options.engagementType || filters.engagementType || 'ANY',
        opportunityType: options.opportunityType || filters.opportunityType || '',
        count: resLimit === 'MAXIMUM' ? 100 : resLimit,
        resultLimit: resLimit,
        resultMode: resMode,
        filters,
        industryCategory: filters.industry || options.industryCategory,
        selectedServices: options.selectedServices,
        clientId: options.clientId,
        searchMode: options.searchMode || 'live',
        explicitDemo: options.explicitDemo || false,
        includeDemoFallback: options.includeDemoFallback !== undefined ? options.includeDemoFallback : false,
        postedWithin: options.postedWithin || filters.postedWithin || ''
      })
    });

    if (response.status === 401) {
      return {
        success: false,
        errorCode: 'UNAUTHENTICATED',
        message: 'Your session has expired. Please sign in again.',
        leads: []
      };
    }

    const data = await response.json();
    if (!response.ok || !data.success) {
      return {
        success: false,
        errorCode: data.errorCode || 'SEARCH_FAILED',
        message: data.message || 'Server search failed.',
        leads: []
      };
    }

    return data;
  } catch (e: any) {
    console.error('[Search Execution Error]', e);
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Failed to connect to search service. Please try again.',
      leads: []
    };
  }
}

export async function fetchServerLeads(): Promise<OpportunityLead[]> {
  let token = '';
  let orgId = '';
  if (typeof localStorage !== 'undefined') {
    try {
      const sess = JSON.parse(localStorage.getItem('amusemac_auth_session') || '{}');
      token = sess.token || '';
      orgId = sess.organization?.orgId || '';
    } catch (e) {}
  }

  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (orgId) headers['X-Organization-Id'] = orgId;
    const res = await fetch('/api/leads', { headers });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.leads)) {
      return data.leads;
    }
    return [];
  } catch (e) {
    console.error('[Fetch Leads Error]', e);
    return [];
  }
}

export async function saveLeadToServer(lead: OpportunityLead | Lead | any): Promise<{ success: boolean; leadId?: string; alreadySaved?: boolean }> {
  let token = '';
  let orgId = '';
  if (typeof localStorage !== 'undefined') {
    try {
      const sess = JSON.parse(localStorage.getItem('amusemac_auth_session') || '{}');
      token = sess.token || '';
      orgId = sess.organization?.orgId || '';
    } catch (e) {}
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (orgId) headers['X-Organization-Id'] = orgId;
    const res = await fetch('/api/leads/save', {
      method: 'POST',
      headers,
      body: JSON.stringify({ lead })
    });
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('[Save Lead Error]', e);
    return { success: false };
  }
}

export async function updateLeadStatusOnServer(leadId: string, pipelineStage: string, notes?: string): Promise<boolean> {
  let token = '';
  let orgId = '';
  if (typeof localStorage !== 'undefined') {
    try {
      const sess = JSON.parse(localStorage.getItem('amusemac_auth_session') || '{}');
      token = sess.token || '';
      orgId = sess.organization?.orgId || '';
    } catch (e) {}
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (orgId) headers['X-Organization-Id'] = orgId;
    const res = await fetch(`/api/leads/${leadId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ pipeline_stage: pipelineStage, outreachStatus: pipelineStage, notes })
    });
    const data = await res.json();
    return data.success === true;
  } catch (e) {
    console.error('[Update Lead Status Error]', e);
    return false;
  }
}

export async function generateOutreachDraftToServer(lead: OpportunityLead | Lead | any, channel: string = 'email'): Promise<{ success: boolean; draft?: OutreachDraft; outreachDraft?: OutreachDraft }> {
  let token = '';
  let orgId = '';
  if (typeof localStorage !== 'undefined') {
    try {
      const sess = JSON.parse(localStorage.getItem('amusemac_auth_session') || '{}');
      token = sess.token || '';
      orgId = sess.organization?.orgId || '';
    } catch (e) {}
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (orgId) headers['X-Organization-Id'] = orgId;
    const res = await fetch('/api/outreach/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ lead, channel })
    });
    const data = await res.json();
    return {
      success: data.success,
      draft: data.draft || data.outreachDraft,
      outreachDraft: data.outreachDraft || data.draft
    };
  } catch (e) {
    return { success: false };
  }
}

export async function appendLeadToGoogleSheetsServer(lead: OpportunityLead | Lead | any, webhookUrl?: string): Promise<{ success: boolean; message?: string }> {
  let token = '';
  let orgId = '';
  if (typeof localStorage !== 'undefined') {
    try {
      const sess = JSON.parse(localStorage.getItem('amusemac_auth_session') || '{}');
      token = sess.token || '';
      orgId = sess.organization?.orgId || '';
    } catch (e) {}
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (orgId) headers['X-Organization-Id'] = orgId;
    const res = await fetch('/api/sheets/append', {
      method: 'POST',
      headers,
      body: JSON.stringify({ lead, webhookUrl })
    });
    const data = await res.json();
    return data;
  } catch (e) {
    return { success: false, message: 'Google Sheets sync failed' };
  }
}

export async function fetchSearchHistoryFromServer(): Promise<any[]> {
  let token = '';
  let orgId = '';
  if (typeof localStorage !== 'undefined') {
    try {
      const sess = JSON.parse(localStorage.getItem('amusemac_auth_session') || '{}');
      token = sess.token || '';
      orgId = sess.organization?.orgId || '';
    } catch (e) {}
  }

  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (orgId) headers['X-Organization-Id'] = orgId;
    const res = await fetch('/api/search/history', { headers });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.history)) {
      return data.history;
    }
    return [];
  } catch (e) {
    return [];
  }
}

export async function fetchSearchSessionResults(sessionId: string): Promise<{ success: boolean; session?: any; results: OpportunityLead[]; rawCandidates?: any[] }> {
  let token = '';
  let orgId = '';
  if (typeof localStorage !== 'undefined') {
    try {
      const sess = JSON.parse(localStorage.getItem('amusemac_auth_session') || '{}');
      token = sess.token || '';
      orgId = sess.organization?.orgId || '';
    } catch (e) {}
  }

  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (orgId) headers['X-Organization-Id'] = orgId;
    const res = await fetch(`/api/search/history/${encodeURIComponent(sessionId)}/results`, { headers });
    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        session: data.session,
        results: data.results || [],
        rawCandidates: data.rawCandidates || []
      };
    }
    return { success: false, results: [] };
  } catch (e) {
    return { success: false, results: [] };
  }
}

export async function deleteSearchSessionRecordServer(sessionId: string): Promise<{ success: boolean; history?: any[] }> {
  let token = '';
  let orgId = '';
  if (typeof localStorage !== 'undefined') {
    try {
      const sess = JSON.parse(localStorage.getItem('amusemac_auth_session') || '{}');
      token = sess.token || '';
      orgId = sess.organization?.orgId || '';
    } catch (e) {}
  }

  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (orgId) headers['X-Organization-Id'] = orgId;
    const res = await fetch(`/api/search/history/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
      headers
    });
    const data = await res.json();
    return {
      success: res.ok && data.success,
      history: data.history || []
    };
  } catch (e) {
    return { success: false };
  }
}
