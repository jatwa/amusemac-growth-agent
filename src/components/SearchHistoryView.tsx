import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Download,
  Calendar,
  MapPin,
  RefreshCw,
  Eye,
  X,
  CheckCircle2,
  Building2,
  Globe,
  Database,
  Briefcase,
  User
} from 'lucide-react';
import { Organization } from '../types/saas';
import { OpportunityLead } from '../types/opportunity';
import {
  fetchSearchHistoryFromServer,
  fetchSearchSessionResults,
  deleteSearchSessionRecordServer
} from '../services/searchService';
import { getSearchHistoryRecords, deleteSearchHistoryRecord } from '../services/searchHistoryService';
import { CompanyDetailModal } from './CompanyDetailModal';

interface SearchHistoryViewProps {
  activeOrg: Organization;
  onRepeatSearch: (query: string, location: string) => void;
}

export const SearchHistoryView: React.FC<SearchHistoryViewProps> = ({
  activeOrg,
  onRepeatSearch
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterUserId, setFilterUserId] = useState<string>('ALL');
  const [searchQueryFilter, setSearchQueryFilter] = useState<string>('');

  // Snapshot Inspection Modal State
  const [inspectingSession, setInspectingSession] = useState<any | null>(null);
  const [snapshotResults, setSnapshotResults] = useState<OpportunityLead[]>([]);
  const [rawCandidates, setRawCandidates] = useState<any[]>([]);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);

  // Lead Detail View within Snapshot Modal
  const [selectedSnapshotLead, setSelectedSnapshotLead] = useState<OpportunityLead | null>(null);

  const loadHistoryData = async () => {
    setIsLoading(true);
    try {
      const serverHistory = await fetchSearchHistoryFromServer();
      if (serverHistory && serverHistory.length > 0) {
        setHistory(serverHistory);
      } else {
        const local = getSearchHistoryRecords(activeOrg.orgId);
        setHistory(local);
      }
    } catch (e) {
      const local = getSearchHistoryRecords(activeOrg.orgId);
      setHistory(local);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistoryData();
  }, [activeOrg.orgId]);

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const res = await deleteSearchSessionRecordServer(sessionId);
      if (res.success && res.history) {
        setHistory(res.history);
      } else {
        deleteSearchHistoryRecord(activeOrg.orgId, sessionId);
        setHistory(prev => prev.filter(item => (item.search_session_id || item.id) !== sessionId));
      }
    } catch (e) {
      setHistory(prev => prev.filter(item => (item.search_session_id || item.id) !== sessionId));
    }
  };

  const handleOpenResultsSnapshot = async (sessionRecord: any) => {
    const sessionId = sessionRecord.search_session_id || sessionRecord.id;
    setInspectingSession(sessionRecord);
    setIsLoadingSnapshot(true);
    try {
      const snapshotData = await fetchSearchSessionResults(sessionId);
      if (snapshotData.success && snapshotData.results) {
        setSnapshotResults(snapshotData.results);
        setRawCandidates(snapshotData.rawCandidates || []);
      } else {
        // Fallback to results stored directly on record if present
        setSnapshotResults(sessionRecord.results || sessionRecord.leads || []);
        setRawCandidates(sessionRecord.raw_candidates || []);
      }
    } catch (e) {
      setSnapshotResults(sessionRecord.results || sessionRecord.leads || []);
      setRawCandidates(sessionRecord.raw_candidates || []);
    } finally {
      setIsLoadingSnapshot(false);
    }
  };

  const handleExportJson = (record: any) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(record, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Search_Session_Report_${record.search_session_id || record.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="glass-card-gold p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#f5b82e]/20 text-[#f5b82e] text-xs font-semibold border border-[#f5b82e]/30 mb-2">
            <History className="w-3.5 h-3.5" />
            <span>PERMANENT SEARCH AUDIT TRAIL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            SEARCH <span className="text-gold-gradient">SESSIONS & HISTORY</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Every search run creates a permanent session snapshot. Open historical result sets without executing new SerpAPI searches.
          </p>
        </div>

        <button
          onClick={loadHistoryData}
          className="p-2.5 rounded-xl bg-[#1e2235] text-slate-300 hover:text-white border border-[#2c324a] text-xs font-bold flex items-center space-x-1.5"
          title="Refresh History"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* History Directory List */}
      <div className="glass-card p-4 sm:p-6 rounded-2xl border border-[#202436] space-y-4">
        {/* Member Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#23273d] pb-3 text-xs">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-slate-300">Filter History by Member:</span>
            <select
              value={filterUserId}
              onChange={e => setFilterUserId(e.target.value)}
              className="bg-[#161928] border border-[#262a42] text-white rounded-xl px-3 py-2 outline-none font-bold text-xs"
            >
              <option value="ALL">All Members ({history.length} Sessions)</option>
              <option value="usr-super-admin">Admin (admin@amusemacstudio.in)</option>
              <option value="usr-govind-001">Govind Kumar (govindvkumar27@gmail.com)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQueryFilter}
              onChange={e => setSearchQueryFilter(e.target.value)}
              placeholder="Search query text..."
              className="bg-[#161928] border border-[#262a42] text-white rounded-xl px-3 py-1.5 outline-none text-xs w-48"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#f5b82e] animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-semibold">Loading persistent search session audit history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Search className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-white">No Search Runs Logged Yet</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Executions from the search engine will automatically persist here for auditing, reporting, and quick re-runs.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history
              .filter(rec => {
                if (filterUserId !== 'ALL') {
                  const matchUserId = rec.userId === filterUserId || rec.user_id === filterUserId;
                  const isGovind = filterUserId === 'usr-govind-001' && (rec.user === 'govindvkumar27@gmail.com' || (rec.user && rec.user.includes('govind')));
                  const isAdmin = filterUserId === 'usr-super-admin' && (rec.user === 'admin@amusemacstudio.in' || rec.user === 'Admin');
                  if (!matchUserId && !isGovind && !isAdmin) return false;
                }
                if (searchQueryFilter.trim()) {
                  const q = (rec.original_search_query || rec.query || '').toLowerCase();
                  if (!q.includes(searchQueryFilter.toLowerCase().trim())) return false;
                }
                return true;
              })
              .map((rec) => {
              const sessionId = rec.search_session_id || rec.id || 'SESSION-RECORD';
              const queryText = rec.original_search_query || rec.query || rec.searchQuery || 'Worldwide Buyer Discovery';
              const createdDate = rec.created_at || rec.started_at || rec.date || 'Recently';
              const locScope = rec.location_mode === 'countries'
                ? `Countries (${(rec.countries || []).join(', ')})`
                : rec.location_mode === 'manual'
                ? `Manual (${rec.manual_location})`
                : rec.location || 'Worldwide';

              return (
                <div
                  key={sessionId}
                  className="p-4 sm:p-5 rounded-2xl border border-[#22273c] bg-[#141624] space-y-4 text-xs shadow-md"
                >
                  {/* Session Header Bar */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#23273d] pb-3">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-white font-display leading-snug">{queryText}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f5b82e]/10 text-[#f5b82e] border border-[#f5b82e]/30 flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{locScope}</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Status: {rec.status || 'COMPLETED'}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] flex flex-wrap items-center gap-2 pt-1">
                        <span className="flex items-center space-x-1.5 text-[#f5b82e] font-semibold bg-[#f5b82e]/10 px-2.5 py-0.5 rounded-lg border border-[#f5b82e]/20">
                          <User className="w-3.5 h-3.5 text-[#f5b82e]" />
                          <span>Searched by: <strong className="text-white font-bold">{rec.userName || rec.user_name || (rec.user && rec.user.includes('govind') ? 'Govind Kumar' : 'Admin')}</strong></span>
                        </span>
                        <span className="bg-[#1a1e35] px-2.5 py-0.5 rounded-lg border border-[#2b3254] font-mono text-slate-300">
                          Email: <strong className="text-white">{rec.user || rec.user_email || 'admin@amusemacstudio.in'}</strong>
                        </span>
                        <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 font-bold">
                          Role: {rec.role || 'ADMIN'}
                        </span>
                        <span className="flex items-center space-x-1 text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{new Date(createdDate).toLocaleString()}</span>
                        </span>
                      </p>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleOpenResultsSnapshot(rec)}
                        className="btn-gold px-3.5 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 shadow"
                      >
                        <Eye className="w-4 h-4" />
                        <span>VIEW RESULTS SNAPSHOT</span>
                      </button>

                      <button
                        onClick={() => onRepeatSearch(queryText, locScope)}
                        className="px-3 py-1.5 rounded-xl bg-[#1e2235] text-[#f5b82e] hover:bg-[#282d46] border border-[#f5b82e]/30 font-bold flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Re-Run</span>
                      </button>

                      <button
                        onClick={() => handleExportJson(rec)}
                        className="px-3 py-1.5 rounded-xl bg-[#1e2235] text-slate-300 hover:text-white border border-[#2c324a] font-semibold flex items-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>JSON</span>
                      </button>
                    </div>
                  </div>

                  {/* Detailed Session Metrics Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1 font-mono">
                    <div className="p-2.5 rounded-xl bg-[#181b2c] border border-[#25293d]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Raw Candidates</span>
                      <span className="text-sm font-bold text-sky-400 block mt-0.5">{rec.raw_results_count || rec.candidate_count || rec.rawResultsCount || 0}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#181b2c] border border-[#25293d]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Providers Rejected</span>
                      <span className="text-sm font-bold text-rose-400 block mt-0.5">{rec.provider_rejected_count || rec.rejected_count || 0}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#181b2c] border border-[#25293d]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Irrelevant Rejected</span>
                      <span className="text-sm font-bold text-amber-400 block mt-0.5">{rec.irrelevant_count || 0}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#181b2c] border border-[#25293d]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Duplicates Handled</span>
                      <span className="text-sm font-bold text-purple-400 block mt-0.5">{rec.duplicate_count || 0}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#181b2c] border border-[#25293d]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Deep Researched</span>
                      <span className="text-sm font-bold text-emerald-400 block mt-0.5">{rec.deep_researched_count || rec.qualified_leads_count || rec.qualifiedCount || 0}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#181b2c] border border-[#25293d]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Final Qualified Leads</span>
                      <span className="text-sm font-bold text-[#f5b82e] block mt-0.5">{rec.qualified_leads_count || rec.qualified_count || rec.qualifiedCount || 0}</span>
                    </div>
                  </div>

                  {/* AI Search Strategy & Executed Discovery Queries Breakdown */}
                  {Array.isArray(rec.executed_queries) && rec.executed_queries.length > 0 && (
                    <div className="pt-2 border-t border-[#23273d] text-[11px] space-y-2">
                      <div className="flex items-center justify-between font-bold text-slate-300">
                        <span className="flex items-center space-x-1.5 text-[#f5b82e]">
                          <Globe className="w-3.5 h-3.5" />
                          <span>AI Discovery Strategy ({rec.executed_queries.length} Angles Executed • SerpAPI: {rec.serpapi_requests_count || 1}/{rec.search_depth || 'PRO'})</span>
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">Previously Discovered: {rec.previously_discovered_count || 0}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {rec.executed_queries.map((eq: any, idx: number) => (
                          <div key={idx} className="p-2 rounded-xl bg-[#161928] border border-[#25293d] flex items-center justify-between">
                            <div>
                              <span className="font-bold text-white block text-[11px]">"{eq.query}"</span>
                              <span className="text-[10px] text-slate-400">{eq.angle || 'Buyer Requirement'} • Score: {eq.score || 85}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-[#f5b82e]/10 text-[#f5b82e] font-mono text-[10px] font-bold">
                              {eq.rawCount || 0} Raw
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HISTORICAL SEARCH RESULT SNAPSHOT MODAL */}
      {inspectingSession && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#121420] border-0 sm:border border-[#272b42] rounded-none sm:rounded-3xl w-full max-w-5xl min-h-screen sm:min-h-0 sm:max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-slate-200 animate-fadeIn">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#171a2c] via-[#1b1f36] to-[#121420] border-b border-[#23273d] flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f5b82e]/20 text-[#f5b82e] text-[10px] font-bold uppercase">
                    HISTORICAL SEARCH RESULT SNAPSHOT (NO SERPAPI SEARCH CALL)
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ID: {inspectingSession.search_session_id || inspectingSession.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white font-display mt-1">
                  Query: "{inspectingSession.original_search_query || inspectingSession.query}"
                </h3>
              </div>

              <button
                onClick={() => { setInspectingSession(null); setSnapshotResults([]); }}
                className="p-2 rounded-xl bg-[#20253b] hover:bg-[#2c3350] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Area */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {isLoadingSnapshot ? (
                <div className="py-12 text-center space-y-2">
                  <RefreshCw className="w-8 h-8 text-[#f5b82e] animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-semibold">Retrieving persistent lead snapshot...</p>
                </div>
              ) : snapshotResults.length === 0 ? (
                <div className="p-8 text-center bg-[#151726] border border-[#25293d] rounded-2xl space-y-2">
                  <Database className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs font-bold text-white">No final qualified leads preserved for this search session.</p>
                  {rawCandidates.length > 0 && (
                    <p className="text-[11px] text-slate-400">{rawCandidates.length} raw candidates were evaluated during this session.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Discovered Buyer Leads ({snapshotResults.length})</span>
                    <span className="text-[11px] text-emerald-400 font-mono">✓ Retained from persistent database</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {snapshotResults.map((opp) => (
                      <div
                        key={opp.id || opp.leadId}
                        onClick={() => setSelectedSnapshotLead(opp)}
                        className="p-5 rounded-2xl bg-[#141624] hover:bg-[#181b2c] border border-[#23273e] hover:border-[#f5b82e]/50 transition-all space-y-3 shadow-md cursor-pointer group"
                      >
                        <div className="flex items-start justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>CONFIDENCE: {opp.research_confidence_score || opp.confidenceScore || 92}/100</span>
                          </span>

                          <span className="text-[10px] font-mono text-sky-400 font-bold">
                            {opp.source_platform || opp.source || 'Public Web'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-[#f5b82e] transition-colors leading-snug">
                            {opp.title || opp.requirement}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                            <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span>{opp.companyName || opp.company_name || opp.requester}</span>
                            {opp.location && <span>• {opp.location}</span>}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#10121d] border border-[#202438] text-[11px] text-slate-300">
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Requirement Summary</span>
                          <span className="line-clamp-2">{opp.requirement || opp.description}</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-[#202436]">
                          <span>Service: <strong className="text-[#f5b82e]">{opp.primaryService || (opp as any).service_needed || opp.serviceNeed}</strong></span>
                          <span className="text-[#f5b82e] font-bold">Click to view full detail →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Lead Detail View Modal */}
      {selectedSnapshotLead && (
        <CompanyDetailModal
          opportunity={selectedSnapshotLead}
          isOpen={Boolean(selectedSnapshotLead)}
          onClose={() => setSelectedSnapshotLead(null)}
          onSaveLead={() => {}}
          isSaved={true}
        />
      )}
    </div>
  );
};
