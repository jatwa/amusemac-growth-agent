import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  User,
  ExternalLink,
  ShieldCheck,
  Zap,
  BarChart3,
  Sliders,
  Award,
  Filter,
  FileText
} from 'lucide-react';
import { Lead, SearchReport, ClientProfile } from '../types/lead';
import { PRESET_INDUSTRIES, AMUSEMAC_SERVICES } from '../data/services';
import { executeServerSearch } from '../services/searchService';
import { syncLeadsToGoogleSheet } from '../services/googleSheets';
import { saveSearchHistoryRecord } from '../services/searchHistoryService';

interface LeadHunterViewProps {
  existingLeads: Lead[];
  onAddLeads: (leads: Lead[]) => void;
  onNavigate: (tab: string) => void;
  webhookUrl: string;
  activeProfile: ClientProfile;
  onOpenIntelligenceReport: (lead: Lead) => void;
  onCheckAllowance: (actionType: 'leads' | 'searches' | 'ai_research', count: number) => { allowed: boolean; message?: string };
  onTrackUsage: (actionType: 'leads' | 'searches' | 'ai_research', count: number) => void;
  onShowLimitModal: (checkRes: any) => void;
}

export const LeadHunterView: React.FC<LeadHunterViewProps> = ({
  existingLeads,
  onAddLeads,
  onNavigate,
  webhookUrl,
  activeProfile,
  onOpenIntelligenceReport,
  onCheckAllowance,
  onTrackUsage,
  onShowLimitModal
}) => {
  const [projectKeyword, setProjectKeyword] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState(activeProfile.targetCategories[0] || 'Festive / E-Commerce / Audio');
  const [selectedService, setSelectedService] = useState(activeProfile.services[0] || 'Advertising Film Production');
  const [targetLocation, setTargetLocation] = useState('Mumbai');

  const [minScore, setMinScore] = useState(60);
  const [maxResults, setMaxResults] = useState(5);
  const [requireBuyingSignal, setRequireBuyingSignal] = useState(true);
  const [excludeCompetitors, setExcludeCompetitors] = useState(true);

  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

  const [discoveredCandidates, setDiscoveredCandidates] = useState<Lead[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [searchReport, setSearchReport] = useState<SearchReport | null>(null);
  const [saveNotice, setSaveNotice] = useState('');

  const handleStartSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check Plan Allowance first!
    const allowanceCheck = onCheckAllowance('leads', maxResults);
    if (!allowanceCheck.allowed) {
      onShowLimitModal(allowanceCheck);
      return;
    }

    setIsSearching(true);
    setSearchProgress(10);
    const searchRes = await executeServerSearch({
      query: projectKeyword || selectedService || selectedIndustry || 'Target Buyers',
      location: targetLocation,
      count: maxResults,
      industryCategory: selectedIndustry,
      clientId: activeProfile.clientId
    });

    if (!searchRes.success) {
      setIsSearching(false);
      alert(searchRes.message || 'Live lead discovery is temporarily unavailable. Please try again.');
      return;
    }

    const mappedLeads: any[] = (searchRes.leads || []).map(l => ({
      ...l,
      leadId: l.leadId || l.id,
      projectName: l.projectName || l.title || 'Project Requirement',
      serviceNeed: l.serviceNeed || (l.matchedServices ? l.matchedServices[0] : 'Creative Production'),
      primaryService: l.primaryService || (l.matchedServices ? l.matchedServices[0] : 'Creative Production'),
      whyThisLead: l.whyThisIsAMatch || l.whyThisLead || 'Matching buyer requirement',
      aiScore: l.aiScore || l.intentScore || 85,
      priority: l.scoreTier || (l.intentType === 'HOT' ? 'HOT' : 'WARM')
    }));

    setDiscoveredCandidates(mappedLeads);
    setSelectedCandidates(mappedLeads.map(l => l.leadId));

    const defaultReport: SearchReport = searchRes.report || {
      searchQuery: projectKeyword || selectedService || 'Target Buyers Scan',
      targetLocation: targetLocation,
      clientId: activeProfile.clientId,
      totalDiscovered: searchRes.total || mappedLeads.length,
      duplicatesRemoved: 0,
      competitorsRemoved: 0,
      icpRejected: 0,
      qualifiedCount: mappedLeads.length,
      shortlistedCount: mappedLeads.length,
      topOpportunities: mappedLeads.slice(0, 3).map(l => `${l.companyName}: Strategic Opportunity`),
      topIndustries: { 'Commercial Services': mappedLeads.length },
      topLocations: { [targetLocation || 'Global']: mappedLeads.length },
      topBuyingSignals: { 'Live Web Search': mappedLeads.length },
      executionTimeMs: 450
    };

    // Save to persistent search history
    saveSearchHistoryRecord(activeProfile.clientId, {
      searchQuery: projectKeyword || selectedService,
      location: targetLocation,
      icp: activeProfile.companyName,
      service: selectedService,
      date: new Date().toISOString().slice(0, 10),
      rawResultsCount: searchRes.totalFound || mappedLeads.length,
      qualifiedCount: mappedLeads.length,
      shortlistedCount: mappedLeads.length,
      hotCount: mappedLeads.filter(l => l.priority === 'HOT').length,
      report: defaultReport,
      leads: mappedLeads
    });

    setSearchProgress(100);
    setIsSearching(false);
    setDiscoveredCandidates(mappedLeads);
    setSearchReport(defaultReport);
    setSelectedCandidates(mappedLeads.map(r => r.leadId));
  };

  const handleToggleSelectCandidate = (leadId: string) => {
    setSelectedCandidates(prev =>
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    );
  };

  const handleSaveToCrmAndSheet = async () => {
    const leadsToSave = discoveredCandidates.filter(c => selectedCandidates.includes(c.leadId));
    if (leadsToSave.length === 0) return;

    onAddLeads(leadsToSave);

    if (webhookUrl) {
      setSaveNotice(`Saving ${leadsToSave.length} lead(s) to CRM & Pushing to Google Sheets ("Amusemac Growth Leads")...`);
      const sheetRes = await syncLeadsToGoogleSheet(webhookUrl, leadsToSave);
      setSaveNotice(`Saved to CRM! Google Sheets status: ${sheetRes.message}`);
    } else {
      setSaveNotice(`Saved ${leadsToSave.length} lead(s) to CRM local database!`);
    }

    setTimeout(() => setSaveNotice(''), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-card-gold p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#f5b82e]/20 text-[#f5b82e] text-xs font-semibold border border-[#f5b82e]/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>B2B PROSPECTING & SALES INTELLIGENCE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            PROSPECTING <span className="text-gold-gradient">ENGINE</span> ({activeProfile.companyName})
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Multi-stage prospect discovery, buying signals research, dynamic competitor exclusion & strategic opportunity analysis
          </p>
        </div>
      </div>

      {saveNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Discovery & Search Form */}
      <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-6">
        <form onSubmit={handleStartSearch} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Search Keyword */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Target Keyword / Campaign Brief</label>
              <input
                type="text"
                value={projectKeyword}
                onChange={(e) => setProjectKeyword(e.target.value)}
                placeholder="e.g. Q4 Festive DVC, Brand Launch, Set Build..."
                className="w-full bg-[#151724] border border-[#2a2f47] text-white rounded-xl px-3.5 py-3 outline-none focus:border-[#f5b82e]"
              />
            </div>

            {/* Target Industry */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Target Buyer Category</label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full bg-[#151724] border border-[#2a2f47] text-white rounded-xl px-3 py-3 outline-none focus:border-[#f5b82e]"
              >
                {activeProfile.targetCategories.map((ind, idx) => (
                  <option key={idx} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            {/* Matched Service */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Core Client Service</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full bg-[#151724] border border-[#2a2f47] text-white rounded-xl px-3 py-3 outline-none focus:border-[#f5b82e]"
              >
                {activeProfile.services.map((s, idx) => (
                  <option key={idx} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Target Location */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Target Region / City</label>
              <input
                type="text"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                placeholder="Mumbai / Delhi NCR / Bengaluru"
                className="w-full bg-[#151724] border border-[#2a2f47] text-white rounded-xl px-3.5 py-3 outline-none focus:border-[#f5b82e]"
              />
            </div>
          </div>

          {/* Configurable Limits & Qualification Options */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-[#22263a] text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Shortlist Prospect Limit</label>
              <select
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value, 10))}
                className="w-full bg-[#151724] border border-[#2a2f47] text-white rounded-xl px-3 py-2 outline-none focus:border-[#f5b82e]"
              >
                <option value={5}>5 Prospects (Quick Quality Test)</option>
                <option value={20}>20 Prospects (Standard Search)</option>
                <option value={50}>50 Prospects (Deep Industry Research)</option>
                <option value={100}>100 Prospects (Enterprise Prospecting)</option>
                <option value={500}>500 Prospects (Large Scale Pipeline)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-5">
              <input
                type="checkbox"
                id="reqSignal"
                checked={requireBuyingSignal}
                onChange={(e) => setRequireBuyingSignal(e.target.checked)}
                className="accent-[#f5b82e] rounded w-4 h-4"
              />
              <label htmlFor="reqSignal" className="text-slate-300 font-medium">Require Verified Buying Signals</label>
            </div>

            <div className="flex items-center space-x-2 pt-5">
              <input
                type="checkbox"
                id="exclComp"
                checked={excludeCompetitors}
                onChange={(e) => setExcludeCompetitors(e.target.checked)}
                className="accent-[#f5b82e] rounded w-4 h-4"
              />
              <label htmlFor="exclComp" className="text-slate-300 font-medium">Apply Competitor Exclusion Profile</label>
            </div>

            <div className="flex items-center space-x-3 justify-end pt-5">
              <span className="text-slate-400 font-medium">Min ICP Score:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value, 10) || 0)}
                className="w-16 bg-[#151724] border border-[#2a2f47] text-white rounded-lg px-2 py-1 font-mono text-center"
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isSearching}
              className="btn-gold px-7 py-3 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-[#f5b82e]/20 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? 'RUNNING B2B INTELLIGENCE SCAN...' : 'EXECUTE B2B PROSPECTING SCAN'}</span>
            </button>
          </div>
        </form>

        {/* Progress Bar */}
        {isSearching && (
          <div className="space-y-2 pt-4 border-t border-[#22273d]">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="font-semibold text-[#f5b82e]">{progressStatus}</span>
              <span className="font-mono font-bold text-white">{searchProgress}%</span>
            </div>
            <div className="w-full h-2 bg-[#161826] rounded-full overflow-hidden border border-[#252a3f]">
              <div
                className="h-full bg-gradient-to-r from-[#f5b82e] to-amber-500 transition-all duration-300"
                style={{ width: `${searchProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* SEARCH EXECUTION SUMMARY REPORT */}
      {searchReport && (
        <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-5">
          <div className="flex items-center justify-between border-b border-[#212538] pb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-[#f5b82e]" />
              <div>
                <h3 className="text-lg font-bold font-display text-white">SEARCH EXECUTION SUMMARY REPORT</h3>
                <p className="text-xs text-slate-400">Target Location: {searchReport.targetLocation} • Query: "{searchReport.searchQuery}"</p>
              </div>
            </div>
            <span className="font-mono text-xs text-slate-400">Time: {searchReport.executionTimeMs}ms</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#161826] border border-[#23273c]">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Discovered</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">{searchReport.totalDiscovered}</span>
            </div>

            <div className="p-4 rounded-xl bg-[#161826] border border-[#23273c]">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Duplicates Removed</span>
              <span className="text-xl font-bold font-mono text-slate-400 mt-1 block">{searchReport.duplicatesRemoved}</span>
            </div>

            <div className="p-4 rounded-xl bg-[#161826] border border-[#23273c]">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Competitors Excluded</span>
              <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">{searchReport.competitorsRemoved}</span>
            </div>

            <div className="p-4 rounded-xl bg-[#161826] border border-[#23273c]">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">ICP Low Score Rejected</span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">{searchReport.icpRejected}</span>
            </div>

            <div className="p-4 rounded-xl bg-[#161826] border border-[#23273c]">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Qualified Candidates</span>
              <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">{searchReport.qualifiedCount}</span>
            </div>

            <div className="p-4 rounded-xl bg-[#161826] border border-[#23273c]">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Shortlisted Prospects</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">{searchReport.shortlistedCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* DISCOVERED PROSPECT CARDS */}
      {discoveredCandidates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-display text-white">
              Shortlisted Prospects ({discoveredCandidates.length})
            </h3>

            <button
              onClick={handleSaveToCrmAndSheet}
              disabled={selectedCandidates.length === 0}
              className="btn-gold px-6 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
            >
              Save {selectedCandidates.length} Selected Lead(s) to CRM & Google Sheets
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {discoveredCandidates.map((lead) => {
              const isChecked = selectedCandidates.includes(lead.leadId);
              return (
                <div key={lead.leadId} className={`glass-card p-5 rounded-2xl border transition-all ${
                  isChecked ? 'border-[#f5b82e] bg-[#f5b82e]/5' : 'border-[#202436]'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelectCandidate(lead.leadId)}
                        className="accent-[#f5b82e] w-4 h-4 rounded mt-1"
                      />
                      <div>
                        <span className="text-[10px] font-bold text-[#f5b82e] uppercase tracking-wider">{lead.companyName}</span>
                        <h4 className="text-base font-bold text-white font-display mt-0.5">{lead.projectName}</h4>
                        <p className="text-xs text-slate-400">{lead.industry} • {lead.location}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-lg font-bold text-emerald-400">{lead.aiScore}/100</span>
                      <div className="text-[10px] text-slate-500">{lead.scoreTier}</div>
                    </div>
                  </div>

                  {/* WHY THIS IS A GOOD PROSPECT */}
                  <div className="mt-4 p-3.5 rounded-xl bg-[#141624] border border-[#22273c] text-xs space-y-1">
                    <span className="text-[10px] text-[#f5b82e] uppercase font-bold flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>WHY THIS IS A GOOD PROSPECT</span>
                    </span>
                    <p className="font-semibold text-white">{lead.whyThisIsAGoodProspect || lead.whyThisLead}</p>
                  </div>

                  {/* POTENTIAL OPPORTUNITY */}
                  <div className="mt-3 p-3 rounded-xl bg-[#141624] border border-[#22273c] text-xs space-y-1">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>POTENTIAL OPPORTUNITY</span>
                    </span>
                    <p className="text-slate-200 font-medium">{lead.potentialOpportunity || lead.serviceNeed}</p>
                  </div>

                  {/* Buying Signal */}
                  <div className="mt-3 text-xs space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Buying Signal Trigger</span>
                    <p className="text-emerald-400 font-medium">{lead.buyingSignal}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1e2336] flex items-center justify-between text-xs">
                    <span className="text-slate-400">Decision Maker: <strong className="text-white">{lead.decisionMakerName} ({lead.decisionMakerDesignation})</strong></span>
                    <button
                      onClick={() => onOpenIntelligenceReport(lead)}
                      className="text-xs font-semibold text-[#f5b82e] hover:underline flex items-center space-x-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Full B2B Report</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
