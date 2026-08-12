import { Lead, SearchReport } from '../types/lead';

export interface ServerSearchOptions {
  query: string;
  location?: string;
  count?: number;
  industryCategory?: string;
  selectedServices?: string[];
  clientId?: string;
  authToken?: string;
}

export interface ServerSearchResult {
  success: boolean;
  mode?: string;
  query?: string;
  location?: string;
  total?: number;
  totalFound?: number;
  report?: SearchReport;
  leads: Lead[];
  errorCode?: string;
  message?: string;
}

export async function executeServerSearch(options: ServerSearchOptions): Promise<ServerSearchResult> {
  const token = options.authToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('amu_auth_token') : '');

  if (!token) {
    return {
      success: false,
      errorCode: 'UNAUTHENTICATED',
      message: 'Authentication required. Please sign in to perform lead searches.',
      leads: []
    };
  }

  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: options.query,
        location: options.location || '',
        count: options.count || 10,
        industryCategory: options.industryCategory,
        selectedServices: options.selectedServices,
        clientId: options.clientId
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
        errorCode: data.errorCode || 'SEARCH_ERROR',
        message: data.message || 'Live lead discovery is temporarily unavailable. Please try again.',
        leads: []
      };
    }

    return {
      success: true,
      mode: data.mode || 'live',
      query: data.query,
      location: data.location,
      total: data.total || data.leads.length,
      totalFound: data.total || data.leads.length,
      leads: data.leads || []
    };
  } catch (err) {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Live lead discovery is temporarily unavailable. Please check your connection and try again.',
      leads: []
    };
  }
}
