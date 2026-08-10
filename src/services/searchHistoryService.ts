import { SearchReport, Lead } from '../types/lead';

export interface PersistentSearchRecord {
  id: string;
  orgId: string;
  searchQuery: string;
  location: string;
  icp: string;
  service: string;
  date: string;
  rawResultsCount: number;
  qualifiedCount: number;
  shortlistedCount: number;
  hotCount: number;
  report: SearchReport;
  leads: Lead[];
}

const SEARCH_HISTORY_PREFIX = 'amusemac_search_history_';

/**
 * Saves search execution record to persistent storage per organization
 */
export function saveSearchHistoryRecord(orgId: string, record: Omit<PersistentSearchRecord, 'id' | 'orgId'>): PersistentSearchRecord {
  const fullRecord: PersistentSearchRecord = {
    ...record,
    id: `SCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orgId
  };

  const existing = getSearchHistoryRecords(orgId);
  const updated = [fullRecord, ...existing];

  try {
    localStorage.setItem(`${SEARCH_HISTORY_PREFIX}${orgId}`, JSON.stringify(updated));
  } catch (e) {
    console.error(`Failed to save search history for ${orgId}:`, e);
  }

  return fullRecord;
}

/**
 * Retrieves search history records for an organization
 */
export function getSearchHistoryRecords(orgId: string): PersistentSearchRecord[] {
  try {
    const saved = localStorage.getItem(`${SEARCH_HISTORY_PREFIX}${orgId}`);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
}

/**
 * Deletes a search history record
 */
export function deleteSearchHistoryRecord(orgId: string, id: string): PersistentSearchRecord[] {
  const existing = getSearchHistoryRecords(orgId);
  const updated = existing.filter(r => r.id !== id);
  try {
    localStorage.setItem(`${SEARCH_HISTORY_PREFIX}${orgId}`, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}
