import React, { useState } from 'react';
import { History, Search, Download, Trash2, ExternalLink, Calendar, MapPin, Sparkles, RefreshCw } from 'lucide-react';
import { PersistentSearchRecord, getSearchHistoryRecords, deleteSearchHistoryRecord } from '../services/searchHistoryService';
import { Organization } from '../types/saas';

interface SearchHistoryViewProps {
  activeOrg: Organization;
  onRepeatSearch: (query: string, location: string) => void;
}

export const SearchHistoryView: React.FC<SearchHistoryViewProps> = ({
  activeOrg,
  onRepeatSearch
}) => {
  const [history, setHistory] = useState<PersistentSearchRecord[]>(() =>
    getSearchHistoryRecords(activeOrg.orgId)
  );

  const handleDelete = (id: string) => {
    const updated = deleteSearchHistoryRecord(activeOrg.orgId, id);
    setHistory(updated);
  };

  const handleExportJson = (record: PersistentSearchRecord) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(record, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Search_Report_${record.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="glass-card-gold p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#f5b82e]/20 text-[#f5b82e] text-xs font-semibold border border-[#f5b82e]/30 mb-2">
            <History className="w-3.5 h-3.5" />
            <span>SEARCH AUDIT TRAIL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            PERSISTENT <span className="text-gold-gradient">SEARCH HISTORY</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Review past B2B prospect discovery runs, repeat searches, export intelligence reports, and track historical results
          </p>
        </div>
      </div>

      {/* History Directory */}
      <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-4">
        {history.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Search className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-white">No Search Runs Logged Yet</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Executions from the Lead Hunter engine will automatically persist here for auditing, reporting, and quick re-runs.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((rec) => (
              <div
                key={rec.id}
                className="p-5 rounded-2xl border border-[#22273c] bg-[#141624] space-y-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#23273d] pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-white font-display">{rec.searchQuery}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f5b82e]/10 text-[#f5b82e] border border-[#f5b82e]/30 flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{rec.location}</span>
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] flex items-center space-x-2">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>Executed on {rec.date}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onRepeatSearch(rec.searchQuery, rec.location)}
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
                      <span>Export JSON</span>
                    </button>

                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30"
                      title="Delete History Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[#181b2c] border border-[#25293d]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Discovered Pool</span>
                    <span className="text-base font-bold font-mono text-white mt-0.5 block">{rec.rawResultsCount}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#181b2c] border border-[#25293d]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Qualified Candidates</span>
                    <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">{rec.qualifiedCount}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#181b2c] border border-[#25293d]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Shortlisted Leads</span>
                    <span className="text-base font-bold font-mono text-[#f5b82e] mt-0.5 block">{rec.shortlistedCount}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#181b2c] border border-[#25293d]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Hot Opportunities</span>
                    <span className="text-base font-bold font-mono text-purple-300 mt-0.5 block">{rec.hotCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
