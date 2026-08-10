import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Sliders,
  Filter,
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
  ChevronDown,
  ChevronUp,
  Lock,
  ArrowRight,
  Layers,
  Calendar
} from 'lucide-react';
import { Lead, SearchReport, ClientProfile } from '../types/lead';
import { PlanId } from '../types/saas';
import { parseNaturalLanguageQuery } from '../services/queryParser';
import { executeLeadSearch } from '../services/searchEngine';
import { maskLeadsForEntitlements } from '../services/entitlementService';
import { syncLeadsToGoogleSheet } from '../services/googleSheets';
import { saveSearchHistoryRecord } from '../services/searchHistoryService';

interface SearchHomeViewProps {
  existingLeads: Lead[];
  onAddLeads: (leads: Lead[]) => void;
  onNavigate: (tab: string) => void;
  webhookUrl: string;
  activeProfile: ClientProfile;
  activePlanId: PlanId;
  onOpenIntelligenceReport: (lead: Lead) => void;
  onCheckAllowance: (actionType: 'leads' | 'searches' | 'ai_research', count: number) => { allowed: boolean; message?: string };
  onTrackUsage: (actionType: 'leads' | 'searches' | 'ai_research', count: number) => void;
  onShowLimitModal: (checkRes: any) => void;
}

export const SearchHomeView: React.FC<SearchHomeViewProps> = ({
  existingLeads,
  onAddLeads,
  onNavigate,
  webhookUrl,
  activeProfile,
  activePlanId,
  onOpenIntelligenceReport,
  onCheckAllowance,
  onTrackUsage,
  onShowLimitModal
}) => {
  const [naturalQuery, setNaturalQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filter Categories State (Initially empty & neutral)
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterCompanySize, setFilterCompanySize] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterBuyingSignal, setFilterBuyingSignal] = useState('');
  const [filterDecisionMakerRole, setFilterDecisionMakerRole] = useState('');
  const [filterMinScore, setFilterMinScore] = useState(50);
  const [filterMaxLeads, setFilterMaxLeads] = useState(10);
  const [filterRequireContact, setFilterRequireContact] = useState(false);

  // Inferred Filters Notification
  const [inferredCount, setInferredCount] = useState(0);

  // Search Engine Execution State
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

  // Results State (Initially empty!)
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [searchReport, setSearchReport] = useState<SearchReport | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [saveNotice, setSaveNotice] = useState('');

  // Handle Natural Language Input Change & Auto-Inference
  const handleQueryChange = (val: string) => {
    setNaturalQuery(val);
    if (val.length > 5) {
      const parsed = parseNaturalLanguageQuery(val);
      if (parsed.inferredIndustry) setFilterIndustry(parsed.inferredIndustry);
      if (parsed.inferredLocation) setFilterLocation(parsed.inferredLocation);
      if (parsed.inferredSignal) setFilterBuyingSignal(parsed.inferredSignal);
      if (parsed.inferredService) setFilterService(parsed.inferredService);
      setInferredCount(parsed.appliedFilterCount);
    } else {
      setInferredCount(0);
    }
  };

  const handleStartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalQuery && !filterService && !filterIndustry) return;

    // Check Plan Allowance first
    const allowanceCheck = onCheckAllowance('leads', filterMaxLeads);
    if (!allowanceCheck.allowed) {
      onShowLimitModal(allowanceCheck);
      return;
    }

    setIsSearching(true);
    setSearchProgress(10);
    setProgressStatus('Searching available sources (Google, LinkedIn, Directories)...');

    const searchRes = await executeLeadSearch({
      query: naturalQuery || filterService || filterIndustry,
      location: filterLocation,
      count: filterMaxLeads,
      minAiScore: filterMinScore,
      industryCategory: filterIndustry,
      existingLeads,
      clientId: activeProfile.clientId,
      clientProfile: activeProfile,
      onProgress: (step: string, percent: number) => {
        setProgressStatus(step);
        setSearchProgress(percent);
      }
    });

    onTrackUsage('searches', 1);
    onTrackUsage('leads', searchRes.leads.length);

    // Apply Entitlement Field Masking for Free Plan
    const maskedLeads = maskLeadsForEntitlements(searchRes.leads, activePlanId);

    // Persistent Search History Logging
    saveSearchHistoryRecord(activeProfile.clientId, {
      searchQuery: naturalQuery || filterService || 'Target Buyers Scan',
      location: filterLocation,
      icp: activeProfile.companyName,
      service: filterService || activeProfile.services[0] || 'Commercial Services',
      date: new Date().toISOString().slice(0, 10),
      rawResultsCount: searchRes.totalFound,
      qualifiedCount: maskedLeads.length,
      shortlistedCount: maskedLeads.length,
      hotCount: maskedLeads.filter(l => l.priority === 'HOT').length,
      report: searchRes.report,
      leads: maskedLeads
    });

    setSearchProgress(100);
    setIsSearching(false);
    setSearchResults(maskedLeads);
    setSearchReport(searchRes.report);
    setSelectedLeadIds(maskedLeads.map(l => l.leadId));
  };

  const handleSaveSelectedLeads = async () => {
    const toSave = searchResults.filter(l => selectedLeadIds.includes(l.leadId));
    if (toSave.length === 0) return;

    onAddLeads(toSave);

    if (webhookUrl) {
      syncLeadsToGoogleSheet(webhookUrl, toSave);
    }

    setSaveNotice(`Saved ${toSave.length} leads to CRM & Google Sheets!`);
    setTimeout(() => setSaveNotice(''), 4000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Clean Search Section */}
      <div className="glass-card-gold p-8 sm:p-12 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#f5b82e]/20 text-[#f5b82e] text-xs font-bold border border-[#f5b82e]/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI B2B PROSPECTING & INTELLIGENCE ENGINE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black font-display text-white tracking-tight">
            Find your next <span className="text-gold-gradient">customer</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Enter your natural language prospecting request. The engine researches Google, LinkedIn, Directories, and Public Signals to discover verified buyer brands.
          </p>
        </div>

        {/* Natural Language Search Input Form */}
        <form onSubmit={handleStartSearch} className="max-w-3xl mx-auto space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
            <input
              type="text"
              value={naturalQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder='Example: "Find fashion brands in Mumbai that may need branded content"'
              className="w-full bg-[#121422] border-2 border-[#2b304a] focus:border-[#f5b82e] text-white text-sm rounded-2xl pl-12 pr-32 py-3.5 outline-none shadow-inner placeholder-slate-500 font-medium"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="btn-gold absolute right-2 top-2 px-6 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-[#f5b82e]/20 disabled:opacity-50"
            >
              <span>{isSearching ? 'SEARCHING...' : 'SEARCH'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Inferred Filter Helper Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-[#f5b82e] font-bold flex items-center space-x-1.5 hover:underline"
            >
              <Sliders className="w-4 h-4" />
              <span>{showAdvancedFilters ? 'Hide Advanced Filters' : '+ Advanced Filters'}</span>
              {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {inferredCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                ✨ {inferredCount} filters auto-inferred · Results will be targeted
              </span>
            )}
          </div>

          {/* Expandable Optional Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="p-6 rounded-2xl bg-[#121422] border border-[#272c44] text-left space-y-5 text-xs text-slate-200 animate-fadeIn shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#23273d] pb-3">
                <span className="font-bold text-white uppercase text-[11px]">Optional Advanced Filter Constraints</span>
                <span className="text-slate-400 text-[10px]">Add details to make research faster & precise</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Category 1: Business */}
                <div className="space-y-3 p-3.5 rounded-xl bg-[#171929] border border-[#24293e]">
                  <span className="font-bold text-[#f5b82e] block text-[11px]">🏢 BUSINESS</span>
                  <div>
                    <label className="text-slate-400 block mb-1">Target Industry</label>
                    <input
                      type="text"
                      value={filterIndustry}
                      onChange={(e) => setFilterIndustry(e.target.value)}
                      placeholder="e.g. Fashion & Apparel"
                      className="w-full bg-[#121420] border border-[#2a2f47] text-white rounded-lg px-3 py-1.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Target Location / City</label>
                    <input
                      type="text"
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full bg-[#121420] border border-[#2a2f47] text-white rounded-lg px-3 py-1.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Company Size</label>
                    <input
                      type="text"
                      value={filterCompanySize}
                      onChange={(e) => setFilterCompanySize(e.target.value)}
                      placeholder="e.g. 50-500 employees"
                      className="w-full bg-[#121420] border border-[#2a2f47] text-white rounded-lg px-3 py-1.5 outline-none"
                    />
                  </div>
                </div>

                {/* Category 2: Opportunity & Signal */}
                <div className="space-y-3 p-3.5 rounded-xl bg-[#171929] border border-[#24293e]">
                  <span className="font-bold text-[#f5b82e] block text-[11px]">⚡ OPPORTUNITY & SIGNAL</span>
                  <div>
                    <label className="text-slate-400 block mb-1">Required Service</label>
                    <input
                      type="text"
                      value={filterService}
                      onChange={(e) => setFilterService(e.target.value)}
                      placeholder="e.g. Advertising Film Production"
                      className="w-full bg-[#121420] border border-[#2a2f47] text-white rounded-lg px-3 py-1.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Buying Trigger Signal</label>
                    <input
                      type="text"
                      value={filterBuyingSignal}
                      onChange={(e) => setFilterBuyingSignal(e.target.value)}
                      placeholder="e.g. Product Launch, Funding"
                      className="w-full bg-[#121420] border border-[#2a2f47] text-white rounded-lg px-3 py-1.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Max Leads to Discover</label>
                    <select
                      value={filterMaxLeads}
                      onChange={(e) => setFilterMaxLeads(Number(e.target.value))}
                      className="w-full bg-[#121420] border border-[#2a2f47] text-[#f5b82e] font-bold rounded-lg px-3 py-1.5 outline-none"
                    >
                      <option value={5}>5 Leads</option>
                      <option value={10}>10 Leads</option>
                      <option value={25}>25 Leads</option>
                      <option value={50}>50 Leads</option>
                    </select>
                  </div>
                </div>

                {/* Category 3: Decision Maker & Quality */}
                <div className="space-y-3 p-3.5 rounded-xl bg-[#171929] border border-[#24293e]">
                  <span className="font-bold text-[#f5b82e] block text-[11px]">🎯 DECISION MAKER & QUALITY</span>
                  <div>
                    <label className="text-slate-400 block mb-1">Target Roles</label>
                    <input
                      type="text"
                      value={filterDecisionMakerRole}
                      onChange={(e) => setFilterDecisionMakerRole(e.target.value)}
                      placeholder="CMO, Founder, Creative Director"
                      className="w-full bg-[#121420] border border-[#2a2f47] text-white rounded-lg px-3 py-1.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Min Score Cutoff</label>
                    <input
                      type="number"
                      value={filterMinScore}
                      onChange={(e) => setFilterMinScore(Number(e.target.value))}
                      className="w-full bg-[#121420] border border-[#2a2f47] text-white rounded-lg px-3 py-1.5 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Progress State */}
      {isSearching && (
        <div className="glass-card p-6 rounded-2xl border border-[#2b304a] text-center space-y-3 max-w-xl mx-auto">
          <Sparkles className="w-8 h-8 text-[#f5b82e] mx-auto animate-spin" />
          <h4 className="text-sm font-bold text-white">{progressStatus}</h4>
          <div className="w-full bg-[#151726] h-2 rounded-full overflow-hidden border border-[#23273e]">
            <div
              className="bg-gradient-to-r from-[#f5b82e] to-amber-500 h-full transition-all duration-300"
              style={{ width: `${searchProgress}%` }}
            />
          </div>
        </div>
      )}

      {saveNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Results Section (Appears below search bar after execution) */}
      {searchResults.length > 0 && (
        <div className="space-y-5 animate-fadeIn">
          {/* Results Header Bar */}
          <div className="glass-card p-4 rounded-2xl border border-[#202436] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-white font-display">
                {searchResults.length} RELEVANT PROSPECT BRANDS FOUND
              </span>
              {activePlanId === 'FREE' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  🔒 FREE PLAN (RESTRICTED FIELDS LOCKED)
                </span>
              )}
            </div>

            <button
              onClick={handleSaveSelectedLeads}
              className="btn-gold px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-[#f5b82e]/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>SAVE {selectedLeadIds.length} LEADS TO CRM & SHEETS</span>
            </button>
          </div>

          {/* Prospect Lead Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((lead) => {
              const isSelected = selectedLeadIds.includes(lead.leadId);

              return (
                <div
                  key={lead.leadId}
                  className={`p-6 rounded-2xl border transition-all space-y-4 ${
                    isSelected ? 'border-[#f5b82e] bg-[#161828]' : 'border-[#22273c] bg-[#121420]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-[#23273d] pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-bold text-white font-display">{lead.companyName}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          lead.priority === 'HOT' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          🔥 {lead.aiScore}/100
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center space-x-2">
                        <span>📍 {lead.location}</span>
                        <span>•</span>
                        <span>🏢 {lead.industry}</span>
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedLeadIds(prev =>
                          prev.includes(lead.leadId) ? prev.filter(id => id !== lead.leadId) : [...prev, lead.leadId]
                        );
                      }}
                      className="w-5 h-5 accent-[#f5b82e] cursor-pointer"
                    />
                  </div>

                  {/* Opportunity & Signal */}
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-[#181a29] border border-[#25293d] space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Opportunity Angle</span>
                      <p className="font-semibold text-slate-200">{lead.potentialOpportunity}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#181a29] border border-[#25293d] space-y-1">
                      <span className="text-[10px] text-amber-400 font-bold uppercase block">Buying Trigger Signal</span>
                      <p className="font-semibold text-amber-200">{lead.buyingSignal}</p>
                    </div>
                  </div>

                  {/* Decision Maker & Contact Details (Entitlement Locked for Free Plan) */}
                  <div className="p-3.5 rounded-xl bg-[#161828] border border-[#262b42] text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="font-bold text-slate-400">Decision Maker:</span>
                      <span className={`font-semibold ${lead.decisionMakerName.includes('🔒') ? 'text-amber-400' : 'text-white'}`}>
                        {lead.decisionMakerName}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="font-bold text-slate-400">Email:</span>
                      <span className={`font-mono ${lead.email.includes('🔒') ? 'text-amber-400' : 'text-slate-200'}`}>
                        {lead.email}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#23273d]">
                    <button
                      onClick={() => onOpenIntelligenceReport(lead)}
                      className="px-4 py-2 rounded-xl bg-[#1c2033] text-[#f5b82e] hover:bg-[#282d46] border border-[#f5b82e]/30 font-bold text-xs flex items-center space-x-1"
                    >
                      <span>VIEW LEAD INTELLIGENCE REPORT</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
