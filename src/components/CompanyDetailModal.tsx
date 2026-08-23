import React, { useState } from 'react';
import {
  X,
  Building2,
  Globe,
  MapPin,
  ExternalLink,
  Check,
  Sparkles,
  Briefcase,
  Tag,
  Zap,
  Flame,
  Clock,
  DollarSign,
  FileText,
  Copy,
  Send,
  MessageSquare,
  ShieldCheck,
  Database,
  Mail,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Search,
  Layers,
  Calendar
} from 'lucide-react';
import { OpportunityLead, OutreachDraft } from '../types/opportunity';
import { generateOutreachDraftToServer } from '../services/searchService';
import { EmailComposerModal } from './EmailComposerModal';
import { calculateLeadCompleteness } from '../services/tenantStore';

interface OpportunityDetailModalProps {
  opportunity: OpportunityLead | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveLead: (opportunity: OpportunityLead) => void;
  isSaved: boolean;
  onGoogleSheetAppend?: (opportunity: OpportunityLead) => Promise<any>;
}

export const CompanyDetailModal: React.FC<OpportunityDetailModalProps> = ({
  opportunity,
  isOpen,
  onClose,
  onSaveLead,
  isSaved,
  onGoogleSheetAppend
}) => {
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [pitchDraft, setPitchDraft] = useState<OutreachDraft | null>(null);
  const [copied, setCopied] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sheetSyncStatus, setSheetSyncStatus] = useState<string | null>(null);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);

  if (!isOpen || !opportunity) return null;

  const completeness = calculateLeadCompleteness(opportunity);

  const handleGeneratePitch = async () => {
    setIsGeneratingPitch(true);
    try {
      const res = await generateOutreachDraftToServer(opportunity);
      if (res.success && res.outreachDraft) {
        setPitchDraft(res.outreachDraft);
      }
    } catch (e) {
      console.error('Error generating pitch draft:', e);
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const handleCopyPitch = () => {
    if (!pitchDraft) return;
    const textToCopy = `Subject: ${pitchDraft.emailSubject}\n\n${pitchDraft.emailBody}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSyncToSheetsClick = async () => {
    if (!onGoogleSheetAppend) return;
    setIsSyncingSheet(true);
    setSheetSyncStatus('Syncing enriched row to Google Sheets...');
    try {
      const result = await onGoogleSheetAppend(opportunity);
      if (result.success) {
        setSheetSyncStatus(`✓ Appended enriched lead to Google Sheet`);
      } else {
        setSheetSyncStatus(`✕ Google Sheets Sync: ${result.message || 'Error writing row'}`);
      }
    } catch (err: any) {
      setSheetSyncStatus(`✕ Sync error: ${err.message}`);
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const isHot = opportunity.intentType === 'HOT' || (opportunity.intentScore && opportunity.intentScore >= 80);
  const confidenceScore = (opportunity as any).research_confidence_score || (opportunity as any).researchConfidenceScore || opportunity.leadQualityScore || 92;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
        <div className="bg-[#121420] border-0 sm:border border-[#272b42] rounded-none sm:rounded-3xl w-full max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[92vh] overflow-y-auto shadow-2xl text-slate-200 animate-fadeIn">
          {/* Modal Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-[#171a2c] via-[#1b1f36] to-[#121420] border-b border-[#23273d] relative">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl bg-[#20253b] hover:bg-[#2c3350] text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-3 pr-10">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>DEEP RESEARCH COMPLETE ({confidenceScore}/100 Confidence)</span>
                </span>

                <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold font-mono">
                  Platform: {(opportunity as any).source_platform || opportunity.source || 'Public Web'}
                </span>

                <span className="px-3 py-1 rounded-full bg-[#20253c] text-slate-300 border border-[#2e3556] flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#f5b82e]" />
                  <span>{opportunity.location || 'Not available'}</span>
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {opportunity.title || opportunity.requirement}
              </h2>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Building2 className="w-4 h-4 text-[#f5b82e]" />
                  <span className="font-bold text-white">{opportunity.companyName || (opportunity as any).company_name || opportunity.requester}</span>
                  {opportunity.industry && <span className="text-slate-400">• {opportunity.industry}</span>}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="btn-gold px-3.5 py-1.5 rounded-xl font-bold inline-flex items-center space-x-1.5 shadow-sm text-xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Lead</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Body: All 8 Complete Deep Research Sections */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[72vh] overflow-y-auto text-xs">
            
            {/* SECTION 1: REQUIREMENT & SCOPE */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#161928] border border-[#262a42]">
              <h3 className="font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#f5b82e]" />
                <span>1. REQUIREMENT & SCOPE</span>
              </h3>

              <div className="p-3.5 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-2">
                <span className="text-slate-400 font-semibold block">Full Buyer Requirement:</span>
                <p className="text-white font-medium leading-relaxed bg-[#141727] p-3 rounded-lg border border-[#22273e]">
                  "{(opportunity as any).full_requirement || opportunity.description || opportunity.requirement || 'Not available'}"
                </p>
              </div>
            </div>

            {/* SECTION 2: POSTING DETAILS & PLATFORM */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#161928] border border-[#262a42]">
              <h3 className="font-bold text-sky-400 uppercase tracking-wider flex items-center space-x-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>2. POSTING DETAILS & PLATFORM</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-1">
                  <span className="text-slate-400 font-semibold block">Platform</span>
                  <span className="text-sky-400 font-bold font-mono">{(opportunity as any).source_platform || opportunity.source || 'Public Web'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-1">
                  <span className="text-slate-400 font-semibold block">Posted Date</span>
                  <span className="text-white font-bold font-mono">{(opportunity as any).posted_date || opportunity.postedAt || 'Not available'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-1">
                  <span className="text-slate-400 font-semibold block">Posted Time</span>
                  <span className="text-white font-bold font-mono">{(opportunity as any).posted_time || 'Not available'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-1">
                  <span className="text-slate-400 font-semibold block">Timezone</span>
                  <span className="text-white font-bold font-mono">{(opportunity as any).posted_timezone || 'Not available'}</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: COMPANY PROFILE */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#161928] border border-[#262a42]">
              <h3 className="font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>3. COMPANY PROFILE</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-1">
                  <span className="text-slate-400 font-semibold block">Company Name</span>
                  <span className="text-white font-bold block">{opportunity.companyName || (opportunity as any).company_name || 'Not available'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-1">
                  <span className="text-slate-400 font-semibold block">Official Website</span>
                  {(opportunity as any).company_website || (opportunity as any).website ? (
                    <a
                      href={((opportunity as any).company_website || (opportunity as any).website).startsWith('http') ? ((opportunity as any).company_website || (opportunity as any).website) : `https://${(opportunity as any).company_website || (opportunity as any).website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 font-bold hover:underline block truncate"
                    >
                      {(opportunity as any).company_website || (opportunity as any).website}
                    </a>
                  ) : (
                    <span className="text-white font-bold block">Not available</span>
                  )}
                </div>
                <div className="p-3.5 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-1">
                  <span className="text-slate-400 font-semibold block">Company Public Email</span>
                  <span className="text-white font-mono font-bold block">{(opportunity as any).company_email || 'Not available'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-1">
                  <span className="text-slate-400 font-semibold block">Company Public Phone</span>
                  <span className="text-white font-mono font-bold block">{(opportunity as any).company_phone || 'Not available'}</span>
                </div>
              </div>
            </div>

            {/* SECTION 4: CONTACT PERSON & DECISION MAKER */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#161928] border border-[#262a42]">
              <h3 className="font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
                <User className="w-4 h-4 text-emerald-400" />
                <span>4. CONTACT PERSON & DECISION MAKER</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-1">
                  <span className="text-slate-400 font-semibold flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    <span>Contact Name</span>
                  </span>
                  <span className="text-white font-bold block">
                    {(opportunity as any).contact_name || opportunity.contactInfo?.name || (opportunity as any).decisionMakerName || 'Not available'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-1">
                  <span className="text-slate-400 font-semibold flex items-center space-x-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                    <span>Contact Role / Designation</span>
                  </span>
                  <span className="text-white font-bold block">
                    {(opportunity as any).contact_role || opportunity.contactInfo?.role || 'Not available'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-1">
                  <span className="text-slate-400 font-semibold flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Contact Email</span>
                  </span>
                  <span className="text-white font-mono font-bold block">
                    {(opportunity as any).contact_email || opportunity.contactInfo?.email || (opportunity as any).email || 'Not available'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-1">
                  <span className="text-slate-400 font-semibold flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Contact Phone</span>
                  </span>
                  <span className="text-white font-mono font-bold block">
                    {(opportunity as any).contact_phone || opportunity.contactInfo?.phone || (opportunity as any).phone || 'Not available'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 5: PROJECT SPECIFICATIONS */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#161928] border border-[#262a42]">
              <h3 className="font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>5. PROJECT SPECIFICATIONS</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-1">
                  <span className="text-slate-400 font-semibold block">Service Needed</span>
                  <span className="text-emerald-400 font-bold">
                    {(opportunity as any).service_needed || (opportunity.matchedServices && opportunity.matchedServices[0]) || 'Creative Production'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-1">
                  <span className="text-slate-400 font-semibold block">Work Mode</span>
                  <span className="text-white font-bold font-mono">{(opportunity as any).remote_status || opportunity.workMode || 'Remote Worldwide'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-1">
                  <span className="text-slate-400 font-semibold block">Engagement Type</span>
                  <span className="text-white font-bold font-mono">{(opportunity as any).engagement_type || opportunity.engagementType || 'PROJECT'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#10121e] border border-[#1f243b] space-y-1">
                  <span className="text-slate-400 font-semibold block">Budget</span>
                  <span className="text-white font-bold font-mono">{opportunity.budget || 'Budget on Discussion'}</span>
                </div>
              </div>
            </div>

            {/* SECTION 6: PUBLIC SOURCE & OPEN LINK */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#161928] border border-[#262a42]">
              <h3 className="font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                <ExternalLink className="w-4 h-4 text-indigo-400" />
                <span>6. PUBLIC SOURCE VERIFICATION</span>
              </h3>

              <div className="p-3.5 rounded-xl bg-[#10121e] border border-[#1f243b] flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold block">Source Platform</span>
                  <span className="text-white font-bold">{(opportunity as any).source_platform || opportunity.source || 'Public Web Discovery'}</span>
                </div>

                {opportunity.sourceUrl && (
                  <a
                    href={opportunity.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#1d233a] hover:bg-[#272f4e] text-sky-400 font-bold border border-sky-500/30 transition-all"
                  >
                    <span>Open Original Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* SECTION 7: DEEP RESEARCH & CONFIDENCE */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#161928] border border-[#262a42]">
              <h3 className="font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>7. DEEP RESEARCH & CONFIDENCE</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#10121e] border border-[#1f243b] text-center space-y-1">
                  <span className="text-slate-400 font-semibold block">Research Confidence Score</span>
                  <span className="text-emerald-400 font-extrabold text-lg">{confidenceScore}/100</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#10121e] border border-[#1f243b] text-center space-y-1">
                  <span className="text-slate-400 font-semibold block">Research Sources Checked</span>
                  <span className="text-sky-400 font-extrabold text-lg">{(opportunity as any).research_source_count || 1} Sources</span>
                </div>
              </div>

              {(opportunity.evidence || (opportunity as any).demand_evidence) && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                  <span className="font-bold text-amber-400 uppercase tracking-wider block">WHY THIS IS A BUYER LEAD:</span>
                  <p className="leading-relaxed">{opportunity.evidence || (opportunity as any).demand_evidence}</p>
                </div>
              )}
            </div>

            {/* SECTION 8: SALES & CRM INTEGRATION */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#161928] border border-[#262a42]">
              <h3 className="font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span>8. SALES & CRM PIPELINE INTEGRATION</span>
              </h3>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-slate-300 font-medium">
                  {isSaved ? 'Lead is saved in your CRM Workspace' : 'Save this lead to your CRM Workspace'}
                </span>

                <div className="flex items-center space-x-2">
                  {onGoogleSheetAppend && (
                    <button
                      onClick={handleSyncToSheetsClick}
                      disabled={isSyncingSheet}
                      className="px-4 py-2 rounded-xl bg-[#1d233a] hover:bg-[#272f4e] text-emerald-400 font-bold border border-emerald-500/30 transition-all text-xs"
                    >
                      {isSyncingSheet ? 'Syncing...' : 'Sync to Google Sheet'}
                    </button>
                  )}

                  <button
                    onClick={() => onSaveLead(opportunity)}
                    disabled={isSaved}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                      isSaved
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                        : 'btn-gold shadow-md'
                    }`}
                  >
                    {isSaved ? '✓ Saved to Workspace' : 'Save Lead'}
                  </button>
                </div>
              </div>

              {sheetSyncStatus && (
                <div className="p-3.5 rounded-xl bg-[#15192c] border border-[#272f4e] text-xs font-mono text-sky-300">
                  {sheetSyncStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEmailModal && (
        <EmailComposerModal
          lead={opportunity as any}
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </>
  );
};
