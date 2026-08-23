import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Flame,
  ExternalLink,
  Copy,
  Check,
  Send,
  Zap,
  Award,
  CheckCircle2,
  FileText,
  MessageSquare
} from 'lucide-react';
import { Lead } from '../types/lead';
import { Organization } from '../types/saas';
import { generateOutreachPackage } from '../services/aiScoring';

interface LeadIntelligenceModalProps {
  lead: Lead | null;
  onClose: () => void;
  onOpenCompose: (lead: Lead) => void;
  activeOrg?: Organization;
}

export const LeadIntelligenceModal: React.FC<LeadIntelligenceModalProps> = ({
  lead,
  onClose,
  onOpenCompose,
  activeOrg
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunity' | 'decision_makers' | 'outreach'>('overview');
  const [copiedField, setCopiedField] = useState<string>('');

  if (!lead) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const outreachPkg = generateOutreachPackage(lead, activeOrg);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-0 sm:p-6 overflow-y-auto">
      <div className="bg-[#121420] border-0 sm:border border-[#262c44] rounded-none sm:rounded-3xl w-full max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Top Drawer Header */}
        <div className="p-6 bg-gradient-to-r from-[#171929] via-[#1a1d30] to-[#171929] border-b border-[#23273c] flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-0.5 rounded-full bg-[#f5b82e]/20 text-[#f5b82e] border border-[#f5b82e]/30 text-[10px] font-bold uppercase tracking-wider">
                B2B SALES INTELLIGENCE REPORT
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                lead.priority === 'HOT' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                lead.priority === 'WARM' ? 'bg-[#f5b82e]/20 text-[#f5b82e] border-[#f5b82e]/30' :
                'bg-slate-500/20 text-slate-400 border-slate-500/30'
              }`}>
                {lead.priority} PROSPECT
              </span>
            </div>

            <h2 className="text-2xl font-extrabold text-white font-display flex items-center space-x-2">
              <span>{lead.companyName}</span>
              {lead.website && lead.website !== 'Not found' && (
                <a href={lead.website} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#f5b82e]">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </h2>
            <p className="text-xs text-slate-400 flex items-center space-x-3">
              <span>{lead.industry}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-[#f5b82e]" />
                <span>{lead.location}</span>
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-black font-mono text-emerald-400">{lead.aiScore}/100</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">AI Prospect Score</div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-[#1e2235] text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Intelligence Report Tabs */}
        <div className="flex items-center space-x-2 px-6 pt-3 bg-[#151726] border-b border-[#212538] text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 font-bold border-b-2 transition-all ${
              activeTab === 'overview' ? 'border-[#f5b82e] text-[#f5b82e]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Company Overview
          </button>

          <button
            onClick={() => setActiveTab('opportunity')}
            className={`px-4 py-2.5 font-bold border-b-2 transition-all ${
              activeTab === 'opportunity' ? 'border-[#f5b82e] text-[#f5b82e]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Why Prospect & Opportunity
          </button>

          <button
            onClick={() => setActiveTab('decision_makers')}
            className={`px-4 py-2.5 font-bold border-b-2 transition-all ${
              activeTab === 'decision_makers' ? 'border-[#f5b82e] text-[#f5b82e]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Decision Makers ({lead.decisionMakerDetails?.length || 1})
          </button>

          <button
            onClick={() => setActiveTab('outreach')}
            className={`px-4 py-2.5 font-bold border-b-2 transition-all ${
              activeTab === 'outreach' ? 'border-[#f5b82e] text-[#f5b82e]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Outreach Intelligence
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metrics Header Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#161828] border border-[#23273d]">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">ICP Match Score</span>
                  <span className="text-xl font-bold font-mono text-[#f5b82e] mt-1 block">{lead.icpMatchScore || 85}%</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#161828] border border-[#23273d]">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Estimated Project Value</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">{lead.estimatedProjectValue}</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#161828] border border-[#23273d]">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Competitor Status</span>
                  <span className="text-xs font-bold text-emerald-400 mt-2 block flex items-center space-x-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{lead.competitorCheckStatus}</span>
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#161828] border border-[#23273d]">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Primary Service Fit</span>
                  <span className="text-xs font-bold text-cyan-400 mt-2 block truncate">{lead.primaryService}</span>
                </div>
              </div>

              {/* Sourced Contact Data */}
              <div className="p-5 rounded-2xl bg-[#151726] border border-[#22263b] space-y-4">
                <h4 className="text-sm font-bold text-white font-display">Sourced Contact Information</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#1a1d30] border border-[#272c44]">
                    <div className="flex items-center space-x-2.5">
                      <Mail className="w-4 h-4 text-[#f5b82e]" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Business Email</span>
                        <span className="font-mono text-white font-bold">{lead.email}</span>
                      </div>
                    </div>
                    {lead.email !== 'Not found' && (
                      <button onClick={() => handleCopy(lead.email, 'email')} className="text-slate-400 hover:text-white">
                        {copiedField === 'email' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#1a1d30] border border-[#272c44]">
                    <div className="flex items-center space-x-2.5">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Direct Phone</span>
                        <span className="font-mono text-white font-bold">{lead.phone}</span>
                      </div>
                    </div>
                    {lead.phone !== 'Not found' && (
                      <button onClick={() => handleCopy(lead.phone, 'phone')} className="text-slate-400 hover:text-white">
                        {copiedField === 'phone' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Proof & Verification Source URLs */}
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Public Verification Source URLs:</span>
                  <div className="flex flex-wrap gap-2">
                    {lead.sourceUrls?.map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-lg bg-[#1a1d30] border border-[#292f48] text-slate-300 hover:text-[#f5b82e] font-mono text-[11px] flex items-center space-x-1"
                      >
                        <Globe className="w-3 h-3 text-[#f5b82e]" />
                        <span className="truncate max-w-[200px]">{url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHY PROSPECT & OPPORTUNITY */}
          {activeTab === 'opportunity' && (
            <div className="space-y-6">
              {/* Why Good Prospect */}
              <div className="p-5 rounded-2xl bg-[#151726] border border-[#22263b] space-y-2">
                <div className="flex items-center space-x-2 text-[#f5b82e] font-bold">
                  <Zap className="w-4 h-4" />
                  <span>WHY THIS IS A GOOD PROSPECT</span>
                </div>
                <p className="text-sm font-semibold text-white leading-relaxed">
                  {lead.whyThisIsAGoodProspect || lead.whyThisLead}
                </p>
              </div>

              {/* Potential Opportunity */}
              <div className="p-5 rounded-2xl bg-[#151726] border border-[#22263b] space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>POTENTIAL OPPORTUNITY & SERVICE FIT</span>
                </div>
                <p className="text-sm font-semibold text-emerald-300 leading-relaxed">
                  {lead.potentialOpportunity || lead.serviceNeed}
                </p>
              </div>

              {/* Verified Buying Signals */}
              <div className="p-5 rounded-2xl bg-[#151726] border border-[#22263b] space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Buying Triggers</h4>

                {lead.buyingSignalDetails?.map((sig: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#1a1d30] border border-[#272c44] flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          {sig.signalType}
                        </span>
                        <span className="text-[10px] text-slate-400">{sig.date}</span>
                      </div>
                      <p className="text-xs font-bold text-white mt-1">{sig.signal}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">Source: {sig.source}</span>
                    </div>

                    <span className="font-mono text-xs font-bold text-[#f5b82e]">{sig.confidenceScore}% Conf</span>
                  </div>
                )) || (
                  <div className="p-3.5 rounded-xl bg-[#1a1d30] text-xs font-semibold text-emerald-400">
                    {lead.buyingSignal}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DECISION MAKERS */}
          {activeTab === 'decision_makers' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white font-display">Target Decision Makers</h4>

              {lead.decisionMakerDetails?.map((dm: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#151726] border border-[#22263b] flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#f5b82e]/20 text-[#f5b82e] border border-[#f5b82e]/30 flex items-center justify-center font-bold font-display text-sm">
                      {dm.personName.slice(0, 2)}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">{dm.personName}</h5>
                      <p className="text-xs text-[#f5b82e] font-semibold">{dm.designation}</p>
                      <span className="text-[10px] text-slate-400">{dm.company}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-emerald-400">{dm.confidenceScore}% Verification</span>
                    <a
                      href={dm.publicProfileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#1e2235] text-xs font-semibold text-white hover:text-[#f5b82e] border border-[#2c324a] flex items-center space-x-1"
                    >
                      <span>Public Profile</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: OUTREACH INTELLIGENCE */}
          {activeTab === 'outreach' && outreachPkg && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#151726] border border-[#22263b] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#f5b82e]">Personalized Email Subject Line</span>
                  <button onClick={() => handleCopy(outreachPkg.emailSubject, 'subj')} className="text-slate-400 hover:text-white">
                    {copiedField === 'subj' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="font-bold text-white font-mono">{outreachPkg.emailSubject}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#151726] border border-[#22263b] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">Personalized Outreach Email Body</span>
                  <button onClick={() => handleCopy(outreachPkg.emailBody || outreachPkg.personalizedEmail || '', 'body')} className="text-slate-400 hover:text-white">
                    {copiedField === 'body' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-[#0f111c] text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed border border-[#21263d]">
                  {outreachPkg.emailBody || outreachPkg.personalizedEmail}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Bar */}
        <div className="p-5 bg-[#151726] border-t border-[#23273c] flex items-center justify-between">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-[#1a1d30]">
            Close Report
          </button>

          <button
            onClick={() => { onClose(); onOpenCompose(lead); }}
            className="btn-gold px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-[#f5b82e]/20"
          >
            <Send className="w-4 h-4" />
            <span>COMPOSE ZOHO EMAIL TO {lead.companyName.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
