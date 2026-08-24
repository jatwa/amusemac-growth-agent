import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Filter,
  Building2,
  MapPin,
  Globe,
  Users,
  ExternalLink,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Clock,
  Briefcase,
  Layers,
  Tag,
  Flame,
  FileText,
  Send,
  Info,
  MessageSquare,
  Database,
  Sliders,
  AlertCircle,
  Mail,
  User,
  Phone,
  CheckCircle2
} from 'lucide-react';
import { Lead, ClientProfile } from '../types/lead';
import { OpportunityLead, OpportunityProviderInfo } from '../types/opportunity';
import { PlanId } from '../types/saas';
import { executeServerSearch, saveLeadToServer, fetchSerpApiQuota, SearchFilterParams } from '../services/searchService';
import { CompanyDetailModal } from './CompanyDetailModal';
import { WORLD_COUNTRIES } from '../data/countriesList';

interface SearchHomeViewProps {
  existingLeads: any[];
  onAddLeads: (leads: any[]) => void;
  onNavigate: (tab: string) => void;
  webhookUrl: string;
  activeProfile: ClientProfile;
  activePlanId: PlanId;
  onOpenIntelligenceReport: (lead: any) => void;
  onCheckAllowance: (actionType: 'leads' | 'searches' | 'ai_research', count: number) => { allowed: boolean; message?: string };
  onTrackUsage: (actionType: 'leads' | 'searches' | 'ai_research', count: number) => void;
  onShowLimitModal: (checkRes: any) => void;
}

const RECENT_SEARCHES_KEY = 'amusemac_buyer_recent_searches';

const POPULAR_WORK_CATEGORIES = [
  { name: 'AI Video', query: 'looking for AI video production', icon: '🤖' },
  { name: 'Corporate Video', query: 'need corporate video production', icon: '🏢' },
  { name: 'Motion Graphics', query: 'motion graphics project requirement', icon: '🎨' },
  { name: 'Film Editing', query: 'film editor required', icon: '✂️' },
  { name: 'Production Design', query: 'production designer required', icon: '🎬' },
  { name: 'Graphic Design', query: 'graphic designer required for campaign', icon: '✏️' },
  { name: 'Sound Design', query: 'sound designer required', icon: '🎧' },
  { name: 'Website', query: 'website development requirement', icon: '💻' },
  { name: 'Social Media', query: 'social media content requirement', icon: '📱' },
  { name: 'Film Production', query: 'film production company required', icon: '🎥' }
];

const RECENCY_OPTIONS = [
  { label: 'Last 30 Days (Default)', value: '30d' },
  { label: '1 Day', value: '1d' },
  { label: '2 Days', value: '2d' },
  { label: '5 Days', value: '5d' },
  { label: '7 Days', value: '7d' },
  { label: '15 Days', value: '15d' },
  { label: '30 Days', value: '30d' }
];

const SERVICES_LIST = [
  'All Services',
  'AI Video Production',
  'Corporate Videos',
  'Promotional Videos',
  'Brand Films',
  'Product Videos',
  'Motion Graphics',
  'Production Design',
  'Sound Design',
  'Website Creation',
  'Social Media Content',
  'Film Production',
  'Film Editing'
];

const OPPORTUNITY_TYPES = [
  'All Opportunity Types',
  'Project Requirement',
  'RFP / RFQ',
  'Hiring / Contract',
  'Vendor Search',
  'Agency Search',
  'Production Requirement',
  'Creative Requirement',
  'Event Requirement',
  'Other Buyer Demand'
];

const WORK_MODE_OPTIONS: { label: string; value: 'REMOTE_WORLDWIDE' | 'REMOTE' | 'ONSITE' | 'HYBRID' | 'ANY' }[] = [
  { label: '🌐 Remote Worldwide', value: 'REMOTE_WORLDWIDE' },
  { label: '💻 Remote', value: 'REMOTE' },
  { label: '🏢 On-site', value: 'ONSITE' },
  { label: '🔀 Hybrid', value: 'HYBRID' },
  { label: '🌍 Any Work Mode', value: 'ANY' }
];

const ENGAGEMENT_TYPE_OPTIONS: { label: string; value: 'PROJECT' | 'CONTRACT' | 'FREELANCE' | 'RETAINER' | 'RFP_VENDOR' | 'OUTSOURCING' | 'FULL_TIME' | 'PART_TIME' | 'ANY' }[] = [
  { label: 'Engagement: Project', value: 'PROJECT' },
  { label: 'Engagement: Contract', value: 'CONTRACT' },
  { label: 'Engagement: Freelance', value: 'FREELANCE' },
  { label: 'Engagement: Retainer', value: 'RETAINER' },
  { label: 'Engagement: RFP / Vendor', value: 'RFP_VENDOR' },
  { label: 'Engagement: Outsourcing', value: 'OUTSOURCING' },
  { label: 'Engagement: Full-time', value: 'FULL_TIME' },
  { label: 'Engagement: Part-time', value: 'PART_TIME' },
  { label: 'Engagement: Any / Not Specified', value: 'ANY' }
];

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
  // Query & Location System States
  const [query, setQuery] = useState('');
  const [locationMode, setLocationMode] = useState<'worldwide' | 'countries' | 'manual'>('worldwide');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [showCountryPopover, setShowCountryPopover] = useState(false);
  const [manualLocationInput, setManualLocationInput] = useState('');

  const [workMode, setWorkMode] = useState<'REMOTE_WORLDWIDE' | 'REMOTE' | 'ONSITE' | 'HYBRID' | 'ANY'>('REMOTE_WORLDWIDE');
  const [engagementType, setEngagementType] = useState<'PROJECT' | 'CONTRACT' | 'FREELANCE' | 'RETAINER' | 'RFP_VENDOR' | 'OUTSOURCING' | 'FULL_TIME' | 'PART_TIME' | 'ANY'>('ANY');
  const [opportunityType, setOpportunityType] = useState('');
  const [resultLimit, setResultLimit] = useState<number | 'MAXIMUM'>('MAXIMUM');
  const [showIntelligenceStrategy, setShowIntelligenceStrategy] = useState(false);

  // Other Quick Filter States
  const [filterService, setFilterService] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [postedWithin, setPostedWithin] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Recent Searches State
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {}
    return ['companies looking for AI video production', 'corporate video startup requirement', 'production designer needed film', 'motion graphics product launch'];
  });

  // Results State
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<OpportunityLead[]>([]);
  const [totalFound, setTotalFound] = useState<number>(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentMode, setCurrentMode] = useState<string>('');
  const [isDemoUsed, setIsDemoUsed] = useState<boolean>(false);
  const [searchMetrics, setSearchMetrics] = useState<any>(null);
  const [errorNotice, setErrorNotice] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState('');

  // Progress Message Rotation
  const SEARCH_PROGRESS_MESSAGES = [
    "Finding relevant buyer opportunities...",
    "Searching for fresh opportunities...",
    "Analyzing buyer requirements...",
    "Deep researching promising opportunities...",
    "Verifying company and project details...",
    "Preparing qualified leads..."
  ];
  const [searchProgressIndex, setSearchProgressIndex] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isSearching) {
      setSearchProgressIndex(0);
      interval = setInterval(() => {
        setSearchProgressIndex(prev => (prev + 1) % SEARCH_PROGRESS_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // Detail & Feedback Modal State
  const [detailOpportunity, setDetailOpportunity] = useState<OpportunityLead | null>(null);
  const [feedbackModalLead, setFeedbackModalLead] = useState<OpportunityLead | null>(null);

  const handleSendFeedback = async (leadId: string, type: 'GOOD' | 'BAD', reasonCategory?: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, reasonCategory })
      }).then(r => r.json());
      if (res.success) {
        setSaveSuccessNotice(type === 'GOOD' ? 'Feedback recorded: 👍 Marked as Good Lead!' : 'Feedback recorded: 👎 Marked as Bad Lead');
        setTimeout(() => setSaveSuccessNotice(''), 3000);
        setFeedbackModalLead(null);
      }
    } catch (e) {}
  };

  // Combined SerpAPI Quota State
  const [serpApiQuotaRemaining, setSerpApiQuotaRemaining] = useState<number | null>(null);
  const [isQuotaExhausted, setIsQuotaExhausted] = useState<boolean>(false);

  const loadSerpApiQuota = async () => {
    try {
      const res = await fetchSerpApiQuota();
      if (res.success) {
        setSerpApiQuotaRemaining(res.combinedRemaining);
        setIsQuotaExhausted(res.isExhausted);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadSerpApiQuota();
  }, []);

  // Set of saved lead IDs for quick UI status toggle
  const savedLeadIds = new Set(existingLeads.map(l => l.id || l.leadId));

  const handleSaveRecentSearch = (q: string) => {
    if (!q || !q.trim()) return;
    const clean = q.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 8);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        }
      } catch (e) {}
      return updated;
    });
  };

  const handleToggleCountry = (countryName: string) => {
    setSelectedCountries(prev => {
      if (prev.includes(countryName)) {
        return prev.filter(c => c !== countryName);
      } else {
        return [...prev, countryName];
      }
    });
  };

  const handleExecuteSearch = async (
    overrideQuery?: string,
    overrideService?: string
  ) => {
    const searchQuery = overrideQuery !== undefined ? overrideQuery : query;
    const svcFilter = overrideService !== undefined ? overrideService : filterService;

    setIsSearching(true);
    setSearchResults([]);
    setErrorNotice('');
    setSaveSuccessNotice('');

    if (searchQuery.trim()) {
      handleSaveRecentSearch(searchQuery.trim());
    }

    const filtersObj: SearchFilterParams = {
      service: svcFilter === 'All Services' ? '' : svcFilter,
      industry: filterIndustry === 'All Industries' ? '' : filterIndustry,
      source: filterSource === 'All Sources' ? '' : filterSource,
      engagementType,
      opportunityType: opportunityType === 'All Opportunity Types' ? '' : opportunityType,
      postedWithin
    };

    try {
      const res = await executeServerSearch({
        query: searchQuery,
        locationMode,
        countries: selectedCountries,
        manualLocation: manualLocationInput,
        workMode,
        engagementType,
        opportunityType: opportunityType === 'All Opportunity Types' ? '' : opportunityType,
        filters: filtersObj,
        count: resultLimit === 'MAXIMUM' ? 100 : resultLimit,
        resultLimit,
        resultMode: resultLimit === 'MAXIMUM' ? 'MAXIMUM' : 'FIXED',
        searchMode: 'live',
        explicitDemo: false,
        includeDemoFallback: false,
        postedWithin
      });

      if (res.success) {
        setSearchResults(res.leads);
        setTotalFound(res.total || res.leads.length);
        setCurrentMode(res.mode || 'live');
        setIsDemoUsed(res.isDemoUsed || false);
        if (res.metrics) setSearchMetrics(res.metrics);
        setHasSearched(true);

        if (Array.isArray(res.leads) && res.leads.length > 0) {
          onAddLeads(res.leads);
        }

        if (res.leads.length === 0) {
          setErrorNotice('No live public buyer opportunities found matching your criteria.');
        }
      } else {
        setErrorNotice(res.message || 'Search execution failed. Please check your query or API key.');
        setSearchResults([]);
        setTotalFound(0);
      }
    } catch (e: any) {
      setErrorNotice('Network error executing automated deep research search. Please try again.');
    } finally {
      setIsSearching(false);
      loadSerpApiQuota();
    }
  };

  const handleSaveOpportunity = async (opp: OpportunityLead) => {
    const saveRes = await saveLeadToServer(opp);
    onAddLeads([opp]);
    onTrackUsage('leads', 1);
    if ((saveRes as any)?.alreadySaved) {
      setSaveSuccessNotice(`Opportunity '${opp.title || opp.companyName}' is already saved in your workspace.`);
    } else {
      setSaveSuccessNotice(`Saved '${opp.title || opp.companyName}' to workspace leads & synced to Google Sheets!`);
    }
    setTimeout(() => setSaveSuccessNotice(''), 4000);
  };

  const filteredCountryOptions = WORLD_COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearchQuery.toLowerCase())
  );

  const hasActiveFilters = Boolean(
    filterService || filterIndustry || filterSource || postedWithin || opportunityType || engagementType !== 'ANY' || workMode !== 'REMOTE_WORLDWIDE'
  );

  const handleClearFilters = () => {
    setFilterService('');
    setFilterIndustry('');
    setFilterSource('');
    setPostedWithin('');
    setOpportunityType('');
    setEngagementType('ANY');
    setWorkMode('REMOTE_WORLDWIDE');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#151728] via-[#1a1e35] to-[#121422] border border-[#242944] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f5b82e]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#202640] border border-[#2e365b] text-xs font-semibold text-[#f5b82e]">
              <Zap className="w-4 h-4" />
              <span>AUTOMATED DEEP RESEARCH SEARCH ENGINE</span>
            </div>
            <div className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-bold ${
              isQuotaExhausted
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-[#181d33] border-[#2d3557] text-sky-400'
            }`}>
              <Database className="w-3.5 h-3.5" />
              <span>SerpAPI Searches Remaining: {serpApiQuotaRemaining !== null ? serpApiQuotaRemaining : '...'}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
            Find People & Companies <span className="gradient-text">Seeking Your Services</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            Search once. The system automatically searches live public sources, qualifies demand, filters out service provider listicles, and performs <strong>deep multi-source research</strong> before displaying final verified buyer leads.
          </p>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 flex items-center justify-between animate-fadeIn">
          <span className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccessNotice}</span>
          </span>
          <button onClick={() => setSaveSuccessNotice('')} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Search Panel */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#131524] border border-[#23273e] space-y-6 shadow-xl relative">
        {/* LOCATION SELECTOR SYSTEM */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Globe className="w-4 h-4 text-[#f5b82e]" />
              <span>Target Location Scope</span>
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {locationMode === 'worldwide' ? 'Searching public web worldwide' : locationMode === 'countries' ? `${selectedCountries.length} countries selected` : 'Custom manual location'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setLocationMode('worldwide')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                locationMode === 'worldwide'
                  ? 'border-[#f5b82e] bg-[#1d2238] text-[#f5b82e] shadow-md'
                  : 'border-[#24283f] bg-[#171a2d] text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>🌐 Worldwide (Default)</span>
            </button>

            <button
              type="button"
              onClick={() => setLocationMode('countries')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                locationMode === 'countries'
                  ? 'border-[#f5b82e] bg-[#1d2238] text-[#f5b82e] shadow-md'
                  : 'border-[#24283f] bg-[#171a2d] text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>📍 Select Country / Countries ({selectedCountries.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setLocationMode('manual')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                locationMode === 'manual'
                  ? 'border-[#f5b82e] bg-[#1d2238] text-[#f5b82e] shadow-md'
                  : 'border-[#24283f] bg-[#171a2d] text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>✍️ Enter Manual Location</span>
            </button>
          </div>

          {/* MULTI-SELECT COUNTRY PICKER */}
          {locationMode === 'countries' && (
            <div className="p-4 rounded-2xl bg-[#131524] border border-[#272c46] space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-xs font-semibold">Searchable Global Countries List</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCountries(['India', 'United States', 'United Kingdom', 'Canada', 'Australia'])}
                    className="text-[11px] text-[#f5b82e] font-semibold hover:underline"
                  >
                    Select Key Markets
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCountries([])}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={countrySearchQuery}
                  onChange={(e) => setCountrySearchQuery(e.target.value)}
                  placeholder="Filter countries (e.g. India, United States, Germany, Japan, UAE...)"
                  className="w-full bg-[#181b2e] border border-[#2a2f4a] text-white text-xs rounded-xl pl-9 pr-4 py-2 outline-none focus:border-[#f5b82e]"
                />
              </div>

              <div className="max-h-36 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5 pr-2 custom-scrollbar">
                {filteredCountryOptions.map(c => {
                  const isSelected = selectedCountries.includes(c.name);
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleToggleCountry(c.name)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-left truncate flex items-center justify-between border transition-all ${
                        isSelected
                          ? 'bg-[#1e243d] border-[#f5b82e] text-[#f5b82e] font-bold'
                          : 'bg-[#17192b] border-[#252a42] text-slate-300 hover:border-[#384066]'
                      }`}
                    >
                      <span className="truncate">{c.flag} {c.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-[#f5b82e] shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>

              {selectedCountries.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#22263d]">
                  <span className="text-[11px] text-slate-400 font-semibold">Selected ({selectedCountries.length}):</span>
                  {selectedCountries.map(cName => {
                    const found = WORLD_COUNTRIES.find(c => c.name === cName);
                    return (
                      <span key={cName} className="px-2.5 py-0.5 rounded-full bg-[#1d2238] border border-[#2f375a] text-[#f5b82e] text-[11px] font-semibold inline-flex items-center space-x-1">
                        <span>{found?.flag} {cName}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleCountry(cName)}
                          className="text-slate-400 hover:text-white ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MANUAL LOCATION FIELD */}
          {locationMode === 'manual' && (
            <div className="p-4 rounded-2xl bg-[#131524] border border-[#272c46] space-y-2 animate-fadeIn">
              <label className="text-slate-300 block text-xs font-semibold">Enter city, region or location</label>
              <div className="relative max-w-md">
                <MapPin className="w-4 h-4 text-[#f5b82e] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={manualLocationInput}
                  onChange={(e) => setManualLocationInput(e.target.value)}
                  placeholder="e.g. Mumbai, London, Los Angeles, Dubai, New York, Bengaluru..."
                  className="w-full bg-[#181b2e] border border-[#2a2f4a] text-white text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[#f5b82e]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Search Input Box */}
        <div className="space-y-3 pt-2">
          {isQuotaExhausted && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-400 flex items-center space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>SerpAPI search quota exhausted (0 searches remaining). Please configure a valid API key.</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isQuotaExhausted) return;
              handleExecuteSearch();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="companies looking for AI video production, startups needing corporate films..."
                className="w-full bg-[#11131f] border border-[#2c324e] text-white rounded-2xl pl-12 pr-4 py-3 text-sm outline-none focus:border-[#f5b82e] shadow-inner font-sans"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearching || isQuotaExhausted}
              className="btn-gold px-8 py-3 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-[#f5b82e]/20 disabled:opacity-50 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? 'Deep Researching Opportunities...' : isQuotaExhausted ? 'SerpAPI Quota Exhausted' : 'Find Public Buyers'}</span>
            </button>
          </form>

          {/* Quick Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as any)}
                className="bg-[#1a1d30] border border-[#f5b82e]/40 text-[#f5b82e] font-bold rounded-xl px-3 py-1.5 outline-none focus:border-[#f5b82e]"
                title="Work Mode Filter"
              >
                {WORK_MODE_OPTIONS.map(wm => (
                  <option key={wm.value} value={wm.value}>{wm.label}</option>
                ))}
              </select>

              <select
                value={engagementType}
                onChange={(e) => setEngagementType(e.target.value as any)}
                className="bg-[#1a1d30] border border-[#3b82f6]/40 text-sky-400 font-bold rounded-xl px-3 py-1.5 outline-none focus:border-sky-400"
                title="Engagement Type Filter"
              >
                {ENGAGEMENT_TYPE_OPTIONS.map(et => (
                  <option key={et.value} value={et.value}>{et.label}</option>
                ))}
              </select>

              <select
                value={resultLimit}
                onChange={(e) => {
                  const val = e.target.value;
                  setResultLimit(val === 'MAXIMUM' ? 'MAXIMUM' : Number(val));
                }}
                className="bg-[#161928] border border-[#2a2f4a] text-slate-200 font-mono font-bold rounded-xl px-3 py-1.5 outline-none focus:border-[#f5b82e]"
                title="Result Count Selector"
              >
                <option value="MAXIMUM">Maximum Results</option>
                <option value={10}>10 Results</option>
                <option value={25}>25 Results</option>
                <option value={50}>50 Results</option>
                <option value={100}>100 Results</option>
              </select>

              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="bg-[#161928] border border-[#2a2f4a] text-slate-300 rounded-xl px-3 py-1.5 outline-none focus:border-[#f5b82e]"
              >
                {SERVICES_LIST.map(svc => (
                  <option key={svc} value={svc === 'All Services' ? '' : svc}>{svc}</option>
                ))}
              </select>

              <select
                value={postedWithin}
                onChange={(e) => setPostedWithin(e.target.value)}
                className="bg-[#161928] border border-[#2a2f4a] text-slate-300 rounded-xl px-3 py-1.5 outline-none focus:border-[#f5b82e]"
              >
                {RECENCY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowAdvancedFilters(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 font-semibold transition-all ${
                  showAdvancedFilters || hasActiveFilters
                    ? 'border-[#f5b82e] bg-[#1d2238] text-[#f5b82e]'
                    : 'border-[#2a2f4a] bg-[#161928] text-slate-400 hover:text-white'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>More Filters</span>
                {showAdvancedFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-slate-400 hover:text-white text-xs font-semibold underline"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* ADVANCED EXPANDED FILTERS PANEL */}
          {showAdvancedFilters && (
            <div className="p-4 rounded-2xl bg-[#141626] border border-[#272c46] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-fadeIn">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Opportunity Type</label>
                <select
                  value={opportunityType}
                  onChange={(e) => setOpportunityType(e.target.value)}
                  className="w-full bg-[#181b2e] border border-[#2c324e] text-white rounded-xl px-3 py-2 outline-none focus:border-[#f5b82e]"
                >
                  {OPPORTUNITY_TYPES.map(opt => (
                    <option key={opt} value={opt === 'All Opportunity Types' ? '' : opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Industry Sector</label>
                <input
                  type="text"
                  value={filterIndustry}
                  onChange={(e) => setFilterIndustry(e.target.value)}
                  placeholder="e.g. Technology, Healthcare, SaaS, E-commerce, Entertainment..."
                  className="w-full bg-[#181b2e] border border-[#2c324e] text-white rounded-xl px-3 py-2 outline-none focus:border-[#f5b82e]"
                />
              </div>
            </div>
          )}

          {/* RECENT SEARCHES CHIPS */}
          {recentSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs">
              <span className="text-slate-400 font-semibold flex items-center space-x-1">
                <Clock className="w-3 h-3 text-[#f5b82e]" />
                <span>Recent Searches:</span>
              </span>
              {recentSearches.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(s);
                    handleExecuteSearch(s);
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#171a2d] hover:bg-[#20253f] border border-[#272b45] text-slate-300 hover:text-white transition-all text-[11px]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {errorNotice && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-400 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* EMPTY SEARCH SCREEN */}
      {!isSearching && !hasSearched && (
        <div className="p-8 sm:p-12 rounded-3xl bg-[#131524] border border-[#23273e] space-y-6 text-center shadow-xl">
          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
              What kind of work are you looking for?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select a service category or type a custom query above to discover active buyer demand requirements.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3 max-w-3xl mx-auto pt-2">
            {POPULAR_WORK_CATEGORIES.map((cat, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(cat.query);
                  handleExecuteSearch(cat.query);
                }}
                className="p-4 rounded-2xl bg-[#171a2d] hover:bg-[#1f243f] border border-[#262a45] hover:border-[#3b446e] transition-all text-left space-y-2 group shadow-sm"
              >
                <span className="text-2xl block">{cat.icon}</span>
                <span className="text-xs font-bold text-white group-hover:text-[#f5b82e] transition-colors block">
                  {cat.name}
                </span>
                <span className="text-[10px] text-slate-500 block">Explore Opportunities →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Header (When search executed) */}
      {hasSearched && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#23273d] pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Flame className="w-5 h-5 text-rose-500 fill-current" />
              <span>Deep-Researched Buyer Opportunities</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1d2238] border border-[#2b3252] text-xs font-mono text-[#f5b82e]">
                {totalFound} Final Researched Leads
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Displaying final deep-researched opportunities matching "{query || 'All Opportunities'}"
            </p>
          </div>

          <div>
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Live Multi-Source Deep Research Complete</span>
            </span>
          </div>
        </div>
      )}

      {/* Transparent Search Summary Metrics Banner */}
      {hasSearched && searchMetrics && (
        <div className="p-4 rounded-2xl bg-[#141727] border border-[#2b304c] space-y-2 font-mono text-xs shadow-xl animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300 font-bold border-b border-[#22273e] pb-2">
            <span className="flex items-center space-x-1.5 text-amber-400">
              <Zap className="w-4 h-4" />
              <span>AUTOMATED DEEP RESEARCH FUNNEL METRICS</span>
            </span>
            <span className="text-slate-400">Mode: <strong className="text-[#f5b82e] uppercase">{workMode}</strong></span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-[11px]">
            <div className="p-2.5 rounded-xl bg-[#191c2e] border border-[#282e47]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Result Limit</span>
              <strong className="text-white text-xs">{searchMetrics.resultLimitLabel || (resultLimit === 'MAXIMUM' ? 'Maximum' : `${resultLimit} Results`)}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-[#191c2e] border border-[#282e47]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">SerpAPI Requests</span>
              <strong className="text-amber-400 text-sm">{searchMetrics.serpApiRequestsCount || 0}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-[#191c2e] border border-[#282e47]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Raw SERP Results</span>
              <strong className="text-sky-400 text-sm">{searchMetrics.rawResultsCount || 0}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-[#191c2e] border border-[#282e47]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Providers Rejected</span>
              <strong className="text-rose-400 text-sm">{searchMetrics.rejectedProvidersCount || 0}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-[#191c2e] border border-[#282e47]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Irrelevant Rejected</span>
              <strong className="text-amber-400 text-sm">{searchMetrics.rejectedIrrelevantCount || 0}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-[#191c2e] border border-[#282e47]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Duplicates Removed</span>
              <strong className="text-purple-400 text-sm">{searchMetrics.duplicateCount || 0}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-[#191c2e] border border-[#282e47]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Deep Researched</span>
              <strong className="text-emerald-400 text-sm">{searchMetrics.deepResearchedCount || totalFound}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-[#191c2e] border border-[#282e47]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Final Qualified Leads</span>
              <strong className="text-emerald-300 text-sm">{searchMetrics.qualifiedLeadsCount || totalFound}</strong>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#22273e]">
            <button
              type="button"
              onClick={() => setShowIntelligenceStrategy(prev => !prev)}
              className="text-[#f5b82e] hover:underline font-bold text-[11px] flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showIntelligenceStrategy ? 'Hide Search Strategy' : 'View Search Intelligence Strategy & Multi-Query Expansion'}</span>
              {showIntelligenceStrategy ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <span className="text-[11px] text-slate-400 font-sans italic">
              💡 {searchMetrics.qualifiedLeadsCount || totalFound} final lead results produced using {searchMetrics.serpApiRequestsCount || 0} actual SerpAPI API request(s).
            </span>
          </div>

          {showIntelligenceStrategy && (
            <div className="p-3 rounded-xl bg-[#161928] border border-[#262b45] space-y-2 font-sans animate-fadeIn text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300 font-bold">
                <span className="flex items-center space-x-1.5 text-[#f5b82e]">
                  <Globe className="w-3.5 h-3.5" />
                  <span>AI Extracted Intent: Service: <strong className="text-white">{searchMetrics.intent_extracted?.service || 'Creative Production'}</strong> • Location: <strong className="text-white">{searchMetrics.intent_extracted?.location || 'Worldwide'}</strong></span>
                </span>
                <span className="text-amber-400 font-mono text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                  Plan Quota: {activePlanId} (Max {activePlanId === 'ENTERPRISE' ? 8 : activePlanId === 'MAX' ? 5 : activePlanId === 'PRO' ? 3 : 1} Queries/Search)
                </span>
              </div>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-slate-200">Multi-Query Discovery Angles:</strong> Direct Buyer Requirement, Procurement/RFP, Hiring, Partnership, Project Announcement, Tender, Budget/Contract. Low quality & overlapping queries penalized automatically.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clean Human-Friendly Live Search Progress Banner */}
      {isSearching && (
        <div className="p-8 rounded-3xl bg-[#141728] border border-[#292f4c] space-y-4 shadow-xl animate-fadeIn text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center space-x-3 text-[#f5b82e] text-base sm:text-lg font-bold font-display">
            <Zap className="w-5 h-5 animate-bounce text-[#f5b82e]" />
            <span>{SEARCH_PROGRESS_MESSAGES[searchProgressIndex]}</span>
          </div>
          <div className="w-full bg-[#1e2338] h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-[#f5b82e] via-amber-400 to-emerald-400 h-full animate-pulse transition-all duration-500 w-full" />
          </div>
          <p className="text-xs text-slate-400">
            Scanning multi-source channels, discovering genuine buyer requirements, and conducting automated Deep Research...
          </p>
        </div>
      )}

      {/* Opportunity Cards Grid (Click ANYWHERE to view detail modal) */}
      {!isSearching && searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {searchResults.map((opp) => {
            const isSaved = savedLeadIds.has(opp.id || opp.leadId);
            const isReal = opp.dataStatus === 'REAL_PUBLIC';

            return (
              <div
                key={opp.id || opp.leadId}
                onClick={() => setDetailOpportunity(opp)}
                className="p-6 rounded-3xl bg-[#131524] hover:bg-[#161a2e] border border-[#23273e] hover:border-[#f5b82e]/50 transition-all space-y-4 shadow-xl flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-3">
                  {/* Card Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Three-Tier Intent Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1 border ${
                        (opp.intentTier || opp.intent_tier) === 'HOT'
                          ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                          : (opp.intentTier || opp.intent_tier) === 'WATCHLIST'
                          ? 'bg-purple-500/10 border-purple-500/40 text-purple-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}>
                        <Flame className="w-3 h-3 fill-current" />
                        <span>{opp.tierLabel || ((opp.intentTier || opp.intent_tier) === 'HOT' ? '🔥 HIGH INTENT' : (opp.intentTier || opp.intent_tier) === 'WATCHLIST' ? '👁️ WATCHLIST' : '⚡ WARM INTENT')}</span>
                      </span>

                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>CONFIDENCE: {opp.research_confidence_score || opp.confidenceScore || 85}/100</span>
                      </span>

                      <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-bold font-mono">
                        {opp.freshnessStatus || opp.freshness_status || 'FRESH'}
                      </span>

                      <span className="text-[11px] text-slate-400 font-mono font-bold">
                        Platform: {opp.source_platform || opp.source || 'Public Web'}
                      </span>
                    </div>

                    {/* 👍 / 👎 Lead Feedback Action Buttons */}
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSendFeedback(opp.id || opp.leadId, 'GOOD'); }}
                        title="Good Lead"
                        className="p-1.5 rounded-lg bg-[#1a1f36] hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors border border-[#2a3254]"
                      >
                        👍
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFeedbackModalLead(opp); }}
                        title="Bad Lead"
                        className="p-1.5 rounded-lg bg-[#1a1f36] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors border border-[#2a3254]"
                      >
                        👎
                      </button>
                    </div>
                  </div>

                  {/* Title & Requester */}
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white group-hover:text-[#f5b82e] transition-colors leading-snug">
                      {opp.title || opp.requirement}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold flex items-center space-x-2">
                      <Building2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>{opp.companyName || opp.company_name || opp.requester}</span>
                      {opp.location && <span>• {opp.location}</span>}
                    </p>
                  </div>

                  {/* Researched Contact Info Row */}
                  <div className="p-3 rounded-xl bg-[#161929] border border-[#262a44] grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate font-semibold">{opp.contact_name || opp.contactInfo?.name || 'Contact: Not available'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate font-semibold">{opp.contact_role || opp.contactInfo?.role || 'Role: Not available'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate font-mono">{opp.contact_email || opp.contactInfo?.email || 'Email: Not available'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-[#f5b82e] shrink-0" />
                      <span className="truncate font-mono">{opp.contact_phone || opp.contactInfo?.phone || 'Phone: Not available'}</span>
                    </div>
                  </div>

                  {/* Requirement Highlight Box */}
                  <div className="p-3 rounded-xl bg-[#171a2c] border border-[#252940] text-xs text-slate-200 font-medium leading-relaxed">
                    "{opp.requirement || opp.description}"
                  </div>

                  {/* Demand Evidence Box */}
                  {(opp.demand_evidence || opp.evidence) && (
                    <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300 leading-relaxed font-medium">
                      <strong className="text-amber-400 font-bold block mb-0.5">WHY THIS IS A BUYER LEAD:</strong>
                      {opp.demand_evidence || opp.evidence}
                    </div>
                  )}

                  {/* Matched Services Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {(opp.matchedServices || ['Creative Production']).map((svc, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                        ✓ {svc}
                      </span>
                    ))}
                  </div>

                  {/* Parameters */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-[#202438]">
                    <span>Budget: <strong className="text-slate-200">{opp.budget || 'Not available'}</strong></span>
                    <span>Posted: <strong className="text-slate-200">{opp.posted_date || opp.postedAt || 'Recently'} {opp.posted_time && opp.posted_time !== 'Not available' ? `(${opp.posted_time})` : ''}</strong></span>
                  </div>
                </div>

                {/* Card Actions (stopPropagation prevents double clicks) */}
                <div className="pt-4 border-t border-[#21253a] flex items-center justify-between gap-2 text-xs">
                  {opp.sourceUrl && (
                    <a
                      href={opp.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-2 rounded-xl bg-[#1c2136] hover:bg-[#272e4a] text-slate-300 hover:text-sky-400 text-xs font-semibold inline-flex items-center space-x-1 transition-all border border-[#2c3454]"
                    >
                      <span>Open Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailOpportunity(opp);
                    }}
                    className="px-3 py-2 rounded-xl bg-[#1d2238] hover:bg-[#282f4d] text-slate-200 font-semibold transition-all border border-[#2e3657] flex items-center space-x-1"
                  >
                    <Info className="w-3.5 h-3.5 text-[#f5b82e]" />
                    <span>Full Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveOpportunity(opp);
                    }}
                    disabled={isSaved}
                    className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center space-x-1 ${
                      isSaved
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-default'
                        : 'btn-gold shadow-sm'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Save Lead</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Requirement Detail Modal */}
      <CompanyDetailModal
        opportunity={detailOpportunity}
        isOpen={Boolean(detailOpportunity)}
        onClose={() => setDetailOpportunity(null)}
        onSaveLead={handleSaveOpportunity}
        isSaved={Boolean(detailOpportunity && savedLeadIds.has(detailOpportunity.id || detailOpportunity.leadId))}
      />

      {/* Bad Lead Feedback Modal */}
      {feedbackModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#141728] border border-[#292f4c] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-rose-400">👎 Why is this a Bad Lead?</span>
            </h3>
            <p className="text-xs text-slate-300">
              Help train the Demand Intelligence Engine by selecting the main reason:
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {[
                { key: 'NOT_A_BUYER', label: 'Not a buyer (No buying/hiring intent)' },
                { key: 'DUPLICATE', label: 'Duplicate opportunity' },
                { key: 'WRONG_SERVICE', label: 'Wrong service category' },
                { key: 'TOO_OLD', label: 'Expired / Too old' },
                { key: 'PROVIDER_SELF_PROMO', label: 'Agency self-promotion / Portfolio' },
                { key: 'ARTICLE_BLOG', label: 'Generic blog post / Article' },
                { key: 'IRRELEVANT', label: 'Irrelevant result' },
                { key: 'FAKE_LOW_QUALITY', label: 'Fake or low quality' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => handleSendFeedback(feedbackModalLead.id || feedbackModalLead.leadId, 'BAD', opt.key)}
                  className="p-3 rounded-xl bg-[#1c2038] hover:bg-rose-500/20 hover:border-rose-500/50 border border-[#2a3152] text-left text-slate-200 transition-all font-medium flex items-center justify-between"
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setFeedbackModalLead(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#1c2038] hover:bg-[#252a4a]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
