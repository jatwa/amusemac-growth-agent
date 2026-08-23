import React, { useState } from 'react';
import {
  Database,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Sheet,
  ExternalLink,
  Flame,
  User,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight,
  X,
  FileText,
  Sliders,
  CheckCircle2,
  Tag,
  DollarSign,
  HelpCircle,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { Lead, SearchFilterOptions, SalesStatus } from '../types/lead';
import { PRESET_INDUSTRIES, AMUSEMAC_SERVICES, SALES_STATUSES } from '../data/services';
import { downloadCsv, syncLeadsToGoogleSheet } from '../services/googleSheets';
import { calculateLeadCompleteness, filterRealPublicLeadsOnly } from '../services/tenantStore';
import { EmailComposerModal } from './EmailComposerModal';
import { appendLeadToGoogleSheetsServer } from '../services/searchService';

interface LeadsDatabaseViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLeadStatus: (leadId: string, status: SalesStatus) => void;
  onNavigate: (tab: string) => void;
  webhookUrl: string;
}

export const LeadsDatabaseView: React.FC<LeadsDatabaseViewProps> = ({
  leads,
  onSelectLead,
  onUpdateLeadStatus,
  onNavigate,
  webhookUrl
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedService, setSelectedService] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [minScoreFilter, setMinScoreFilter] = useState(0);

  const [sortBy, setSortBy] = useState<'aiScore' | 'companyName' | 'researchDate' | 'confidenceScore' | 'priority'>('aiScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [inspectingLead, setInspectingLead] = useState<Lead | null>(null);
  const [emailingLead, setEmailingLead] = useState<Lead | null>(null);
  const [syncNotice, setSyncNotice] = useState('');

  // Explicitly ensure DEMO_LOCAL leads are NEVER present in normal CRM view
  const realPublicLeadsOnly = filterRealPublicLeadsOnly(leads);

  // Filter Logic
  const filteredLeads = realPublicLeadsOnly.filter(lead => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = (lead.companyName || '').toLowerCase().includes(term);
      const matchProject = (lead.projectName || '').toLowerCase().includes(term);
      const matchNeed = (lead.serviceNeed || '').toLowerCase().includes(term);
      const matchInd = (lead.industry || '').toLowerCase().includes(term);
      const matchLoc = (lead.location || '').toLowerCase().includes(term);
      const matchPerson = (lead.decisionMakerName || '').toLowerCase().includes(term);
      if (!matchName && !matchProject && !matchNeed && !matchInd && !matchLoc && !matchPerson) return false;
    }

    if (selectedIndustry !== 'ALL' && lead.industry !== selectedIndustry) return false;
    if (selectedPriority !== 'ALL' && lead.priority !== selectedPriority) return false;
    if (selectedService !== 'ALL' && lead.primaryService !== selectedService) return false;
    if (selectedStatus !== 'ALL' && lead.outreachStatus !== selectedStatus) return false;
    if (lead.aiScore < minScoreFilter) return false;

    return true;
  });

  // Sort Logic
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'aiScore') comparison = a.aiScore - b.aiScore;
    else if (sortBy === 'companyName') comparison = (a.companyName || '').localeCompare(b.companyName || '');
    else if (sortBy === 'researchDate') comparison = (a.researchDate || '').localeCompare(b.researchDate || '');
    else if (sortBy === 'confidenceScore') comparison = a.confidenceScore - b.confidenceScore;
    else if (sortBy === 'priority') {
      const priorityWeight: Record<string, number> = { HOT: 3, WARM: 2, COLD: 1, LOW: 1, 'HOT/WARM': 2.5 };
      comparison = (priorityWeight[a.priority] || 1) - (priorityWeight[b.priority] || 1);
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const handleExportFilteredCsv = () => {
    downloadCsv(sortedLeads, `Amusemac_Need_Based_Leads_${Date.now()}.csv`);
  };

  const handleSyncToSheets = async () => {
    setSyncNotice('Syncing filtered leads to Google Sheets...');
    try {
      if (sortedLeads.length > 0) {
        const res = await appendLeadToGoogleSheetsServer(sortedLeads[0], webhookUrl);
        if (res.success) {
          setSyncNotice(`✓ Successfully appended row to Google Sheet (1FXxkwE84nBfbyaU0EKAvx0GcNBquCbM3pjjVvbntAIo).`);
        } else {
          setSyncNotice(`Google Sheets Sync: ${res.message}`);
        }
      } else {
        setSyncNotice('No real leads available to sync.');
      }
    } catch (e: any) {
      setSyncNotice(`Sync failed: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-card-gold p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#f5b82e]/20 text-[#f5b82e] text-xs font-semibold border border-[#f5b82e]/30 mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>REAL PUBLIC BUYER CRM</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            PROJECT LEADS <span className="text-gold-gradient">DATABASE</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Displaying {sortedLeads.length} of {realPublicLeadsOnly.length} REAL_PUBLIC leads in workspace memory
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSyncToSheets}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 flex items-center space-x-2 transition-colors"
          >
            <Sheet className="w-4 h-4" />
            <span>SYNC TO GOOGLE SHEETS</span>
          </button>
          <button
            onClick={handleExportFilteredCsv}
            className="btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-[#f5b82e]/20"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 text-center">
          {syncNotice}
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="glass-card p-5 rounded-2xl border border-[#202436] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search project, company, need, person..."
              className="w-full bg-[#151724] border border-[#2a2f47] focus:border-[#f5b82e] text-white text-xs rounded-xl pl-10 pr-4 py-3 outline-none"
            />
          </div>

          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="bg-[#151724] border border-[#2a2f47] focus:border-[#f5b82e] text-white text-xs rounded-xl px-3 py-3 outline-none"
          >
            <option value="ALL">All Client Categories</option>
            {PRESET_INDUSTRIES.map((ind, idx) => (
              <option key={idx} value={ind}>{ind}</option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-[#151724] border border-[#2a2f47] focus:border-[#f5b82e] text-white text-xs rounded-xl px-3 py-3 outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="HOT">HOT Priority</option>
            <option value="WARM">WARM Priority</option>
            <option value="COLD">COLD Priority</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#151724] border border-[#2a2f47] focus:border-[#f5b82e] text-white text-xs rounded-xl px-3 py-3 outline-none"
          >
            <option value="ALL">All Sales Statuses</option>
            {SALES_STATUSES.map((st) => (
              <option key={st.id} value={st.id}>{st.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#22263a] text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Min Score:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={minScoreFilter}
                onChange={(e) => setMinScoreFilter(parseInt(e.target.value, 10) || 0)}
                className="w-16 bg-[#151724] border border-[#2a2f47] text-white rounded-lg px-2 py-1 text-center font-mono"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#151724] border border-[#2a2f47] text-white rounded-lg px-2 py-1"
              >
                <option value="aiScore">AI Score</option>
                <option value="companyName">Company Name</option>
                <option value="researchDate">Research Date</option>
                <option value="confidenceScore">Confidence Score</option>
                <option value="priority">Priority Tier</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-1 rounded bg-[#181b2a] border border-[#2b3149] text-slate-300 hover:text-white"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                viewMode === 'table' ? 'bg-[#f5b82e] text-[#0c0d12]' : 'bg-[#181b2a] text-slate-400 border border-[#2b3149]'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                viewMode === 'cards' ? 'bg-[#f5b82e] text-[#0c0d12]' : 'bg-[#181b2a] text-slate-400 border border-[#2b3149]'
              }`}
            >
              Card Grid
            </button>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      {viewMode === 'table' ? (
        <div className="glass-card rounded-2xl border border-[#202436] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#25293c] bg-[#161926] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Company & Project</th>
                  <th className="py-3.5 px-4">Requirement</th>
                  <th className="py-3.5 px-4">Service Needed</th>
                  <th className="py-3.5 px-4">Completeness</th>
                  <th className="py-3.5 px-4">AI Score</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Outreach Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2233] text-xs">
                {sortedLeads.length > 0 ? (
                  sortedLeads.map((lead) => {
                    const completeness = calculateLeadCompleteness(lead);
                    return (
                      <tr
                        key={lead.leadId}
                        onClick={() => setInspectingLead(lead)}
                        className="hover:bg-[#181b29] transition-colors group cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div className="text-xs text-[#f5b82e] font-bold uppercase">{lead.companyName}</div>
                          <div className="font-bold text-white text-xs mt-0.5">{lead.projectName || lead.companyName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{lead.location || 'Location Not Specified'}</div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-200 max-w-[220px]">
                          <span className="line-clamp-2">{lead.serviceNeed || lead.whyThisLead}</span>
                        </td>

                        <td className="py-3.5 px-4 text-[#f5b82e] font-medium">{lead.primaryService}</td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {completeness.availableCount}/{completeness.totalCount} ({completeness.percentage}%)
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center space-x-1 font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <span>{lead.aiScore}/100</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            lead.priority === 'HOT' ? 'bg-[#f5b82e]/20 text-[#f5b82e] border-[#f5b82e]/40' :
                            lead.priority === 'WARM' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                            'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                          }`}>
                            {lead.priority}
                          </span>
                        </td>

                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.outreachStatus || 'NEW'}
                            onChange={(e) => onUpdateLeadStatus(lead.leadId, e.target.value as SalesStatus)}
                            className="bg-[#151724] border border-[#2a2f47] text-white text-[11px] rounded-lg px-2 py-1 font-medium"
                          >
                            {SALES_STATUSES.map((st) => (
                              <option key={st.id} value={st.id}>{st.label}</option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setEmailingLead(lead)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-[#f5b82e] hover:bg-[#e5a417] text-[#0c0d12] rounded-lg transition-colors inline-flex items-center space-x-1"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Email</span>
                          </button>
                          <button
                            onClick={() => setInspectingLead(lead)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-[#21263a] hover:bg-[#303754] text-slate-200 rounded-lg transition-colors border border-[#303754]"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No REAL_PUBLIC leads currently in workspace memory. Perform a search to discover real public buyer opportunities.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedLeads.map((lead) => {
            const completeness = calculateLeadCompleteness(lead);
            return (
              <div
                key={lead.leadId}
                onClick={() => setInspectingLead(lead)}
                className="glass-card p-5 rounded-2xl border border-[#202436] space-y-4 hover:border-[#f5b82e]/40 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#f5b82e] uppercase tracking-wider">{lead.companyName}</span>
                    <h4 className="text-base font-bold text-white font-display mt-0.5">{lead.projectName || lead.companyName}</h4>
                    <p className="text-xs text-slate-400">{lead.industry} • {lead.location}</p>
                  </div>
                  <div className="text-right font-mono text-[#f5b82e] font-bold text-lg">{lead.aiScore}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#141724] text-xs text-slate-300 border border-[#22273c] space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Requirement</div>
                  <div className="font-semibold text-white">{lead.serviceNeed}</div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1e2235]">
                  <span className="text-[10px] font-mono text-purple-300">Completeness: {completeness.availableCount}/{completeness.totalCount}</span>
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setEmailingLead(lead)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#f5b82e] text-[#0c0d12] hover:bg-[#e5a417] inline-flex items-center space-x-1"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </button>
                    <button
                      onClick={() => setInspectingLead(lead)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#21263a] text-slate-200 hover:text-white"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Email Composer Modal */}
      <EmailComposerModal
        isOpen={Boolean(emailingLead)}
        onClose={() => setEmailingLead(null)}
        lead={emailingLead}
        onSendSuccess={(recipient, subject) => {
          if (emailingLead) {
            onUpdateLeadStatus(emailingLead.leadId, 'CONTACTED');
          }
        }}
      />
    </div>
  );
};
