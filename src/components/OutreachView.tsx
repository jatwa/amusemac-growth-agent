import React, { useState } from 'react';
import {
  Send,
  Mail,
  Linkedin,
  MessageSquare,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  User,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Lead, SalesStatus } from '../types/lead';

interface OutreachViewProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
  onUpdateLeadStatus: (leadId: string, status: SalesStatus) => void;
  onUpdateLeadDetails: (leadId: string, updates: Partial<Lead>) => void;
}

export const OutreachView: React.FC<OutreachViewProps> = ({
  leads,
  selectedLead,
  onSelectLead,
  onUpdateLeadStatus,
  onUpdateLeadDetails
}) => {
  const activeLead = selectedLead || leads[0];
  const [activeMsgTab, setActiveMsgTab] = useState<'email' | 'linkedin' | 'whatsapp' | 'pitch' | 'followup1' | 'followup2'>('email');

  const [copiedKey, setCopiedKey] = useState<string>('');
  const [approvalNotice, setApprovalNotice] = useState<string>('');

  if (!activeLead) {
    return (
      <div className="p-12 text-center text-slate-400 glass-card rounded-2xl">
        No leads available in CRM database. Please use Lead Hunter to discover new leads first.
      </div>
    );
  }

  const pkg = activeLead.outreachPackage || {
    emailSubject: `Elevating ${activeLead.companyName}'s campaigns with Amusemac Studio`,
    personalizedEmail: `Hi ${activeLead.decisionMakerName},\n\nWe love your work at ${activeLead.companyName}...`,
    linkedinConnection: `Hi ${activeLead.decisionMakerName}, loved ${activeLead.companyName}'s recent campaigns! Let's connect.`,
    linkedinFollowup: `Thanks for connecting! We produce TVCs & DVCs at Amusemac Studio...`,
    whatsappMessage: `Hi ${activeLead.decisionMakerName}, Amusemac Studio here regarding high-grade ${activeLead.primaryService}...`,
    shortIntroPitch: `${activeLead.companyName} + Amusemac Studio: TV commercial-grade production...`,
    followupMessage1: `Hi ${activeLead.decisionMakerName}, following up on our commercial film capabilities...`,
    followupMessage2: `Hi ${activeLead.decisionMakerName}, final check-in regarding video production partners...`
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleApproveAndSend = (channelName: string) => {
    onUpdateLeadStatus(activeLead.leadId, 'CONTACTED');
    onUpdateLeadDetails(activeLead.leadId, {
      lastContacted: new Date().toISOString().slice(0, 10),
      lastContactMethod: channelName
    });
    setApprovalNotice(`Outreach approved & logged to CRM as CONTACTED via ${channelName}!`);
    setTimeout(() => setApprovalNotice(''), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-card-gold p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#f5b82e]/20 text-[#f5b82e] text-xs font-semibold border border-[#f5b82e]/30 mb-2">
            <Send className="w-3.5 h-3.5" />
            <span>AI OUTREACH GENERATOR & APPROVAL GUARD</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            PERSONALIZED <span className="text-gold-gradient">OUTREACH STUDIO</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Generate 8 custom message formats personalized with verified company intelligence & decision maker research
          </p>
        </div>
      </div>

      {approvalNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{approvalNotice}</span>
        </div>
      )}

      {/* Main Grid: Lead Selector + Outreach Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Selector Sidebar */}
        <div className="glass-card p-4 rounded-2xl border border-[#202436] space-y-3 max-h-[75vh] overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Select Lead ({leads.length})
          </h3>

          <div className="space-y-2">
            {leads.map((lead) => {
              const isSelected = lead.leadId === activeLead.leadId;

              return (
                <button
                  key={lead.leadId}
                  onClick={() => onSelectLead(lead)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#f5b82e]/10 border-[#f5b82e] text-white shadow-md'
                      : 'bg-[#151724] border-[#22273d] text-slate-300 hover:bg-[#1c2032]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm font-display truncate">{lead.companyName}</span>
                    <span className="text-xs font-mono font-bold text-[#f5b82e]">{lead.aiScore}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{lead.primaryService}</div>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>{lead.decisionMakerName}</span>
                    <span className="font-semibold text-emerald-400">{lead.outreachStatus}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Outreach Workbench & Strategy */}
        <div className="lg:col-span-2 space-y-6">
          {/* Strategy Header Card */}
          <div className="glass-card p-5 rounded-2xl border border-[#202436] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#23283e] pb-4">
              <div>
                <h3 className="text-xl font-bold font-display text-white">{activeLead.companyName}</h3>
                <p className="text-xs text-slate-400">{activeLead.industry} • {activeLead.location}</p>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-[#161927] border border-[#262b42]">
                  <span className="text-slate-500 font-semibold block text-[10px]">RECOMMENDED CHANNEL</span>
                  <span className="font-bold text-[#f5b82e]">{activeLead.recommendedChannel}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-[#161927] border border-[#262b42]">
                  <span className="text-slate-500 font-semibold block text-[10px]">TARGET ROLE</span>
                  <span className="font-bold text-white">{activeLead.decisionMakerDesignation}</span>
                </div>
              </div>
            </div>

            {/* Strategy Rationale */}
            <div className="p-3.5 rounded-xl bg-[#161826] border border-[#23273a] text-xs space-y-1">
              <span className="text-[10px] font-bold text-[#f5b82e] uppercase tracking-wider">Recommended Pitch Angle</span>
              <p className="text-slate-200 leading-relaxed">{activeLead.recommendedPitch}</p>
            </div>
          </div>

          {/* Safety Approval Guard Alert */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Outreach Safety Guard:</strong> Messages are auto-generated for review. Actual sending requires explicit user approval below.
            </span>
          </div>

          {/* Message Format Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-[#12141e] p-1.5 rounded-xl border border-[#212538]">
            <button
              onClick={() => setActiveMsgTab('email')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMsgTab === 'email' ? 'bg-[#f5b82e] text-[#0c0d12]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cold Email
            </button>
            <button
              onClick={() => setActiveMsgTab('linkedin')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMsgTab === 'linkedin' ? 'bg-[#f5b82e] text-[#0c0d12]' : 'text-slate-400 hover:text-white'
              }`}
            >
              LinkedIn Connect
            </button>
            <button
              onClick={() => setActiveMsgTab('whatsapp')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMsgTab === 'whatsapp' ? 'bg-[#f5b82e] text-[#0c0d12]' : 'text-slate-400 hover:text-white'
              }`}
            >
              WhatsApp Msg
            </button>
            <button
              onClick={() => setActiveMsgTab('pitch')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMsgTab === 'pitch' ? 'bg-[#f5b82e] text-[#0c0d12]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Short Pitch
            </button>
            <button
              onClick={() => setActiveMsgTab('followup1')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMsgTab === 'followup1' ? 'bg-[#f5b82e] text-[#0c0d12]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Follow-up #1
            </button>
            <button
              onClick={() => setActiveMsgTab('followup2')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMsgTab === 'followup2' ? 'bg-[#f5b82e] text-[#0c0d12]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Follow-up #2
            </button>
          </div>

          {/* Active Message Inspector Card */}
          <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-4">
            {activeMsgTab === 'email' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Email Subject Line</label>
                  <div className="p-3 rounded-xl bg-[#141624] border border-[#24293e] text-xs font-semibold text-[#f5b82e]">
                    {pkg.emailSubject}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Personalized Email Body</label>
                  <pre className="p-4 rounded-xl bg-[#141624] border border-[#24293e] text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                    {pkg.personalizedEmail}
                  </pre>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#23273c]">
                  <button
                    onClick={() => handleCopyText(`${pkg.emailSubject}\n\n${pkg.personalizedEmail}`, 'email')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#202538] text-slate-200 hover:text-white border border-[#2c324a] flex items-center space-x-1.5"
                  >
                    {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'email' ? 'COPIED!' : 'COPY EMAIL'}</span>
                  </button>
                  <button
                    onClick={() => handleApproveAndSend('Email')}
                    className="btn-gold px-6 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>APPROVE & LOG SEND</span>
                  </button>
                </div>
              </div>
            )}

            {activeMsgTab === 'linkedin' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">LinkedIn Connection Note</label>
                  <pre className="p-4 rounded-xl bg-[#141624] border border-[#24293e] text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                    {pkg.linkedinConnection}
                  </pre>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">LinkedIn Follow-up Message</label>
                  <pre className="p-4 rounded-xl bg-[#141624] border border-[#24293e] text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                    {pkg.linkedinFollowup}
                  </pre>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#23273c]">
                  <button
                    onClick={() => handleCopyText(pkg.linkedinConnection || pkg.linkedInConnectionNote || '', 'linkedin')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#202538] text-slate-200 hover:text-white border border-[#2c324a] flex items-center space-x-1.5"
                  >
                    {copiedKey === 'linkedin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'linkedin' ? 'COPIED!' : 'COPY LINKEDIN MSG'}</span>
                  </button>
                  <button
                    onClick={() => handleApproveAndSend('LinkedIn')}
                    className="btn-gold px-6 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>APPROVE & LOG SEND</span>
                  </button>
                </div>
              </div>
            )}

            {activeMsgTab === 'whatsapp' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">WhatsApp Business Direct Message</label>
                  <pre className="p-4 rounded-xl bg-[#141624] border border-[#24293e] text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                    {pkg.whatsappMessage || pkg.whatsAppMessage}
                  </pre>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#23273c]">
                  <button
                    onClick={() => handleCopyText(pkg.whatsappMessage || pkg.whatsAppMessage || '', 'whatsapp')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#202538] text-slate-200 hover:text-white border border-[#2c324a] flex items-center space-x-1.5"
                  >
                    {copiedKey === 'whatsapp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'whatsapp' ? 'COPIED!' : 'COPY WHATSAPP MSG'}</span>
                  </button>
                  <button
                    onClick={() => handleApproveAndSend('WhatsApp')}
                    className="btn-gold px-6 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>APPROVE & LOG SEND</span>
                  </button>
                </div>
              </div>
            )}

            {activeMsgTab === 'pitch' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Short Elevator Intro Pitch</label>
                  <pre className="p-4 rounded-xl bg-[#141624] border border-[#24293e] text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                    {pkg.shortIntroPitch || pkg.directPitchScript}
                  </pre>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#23273c]">
                  <button
                    onClick={() => handleCopyText(pkg.shortIntroPitch || pkg.directPitchScript || '', 'pitch')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#202538] text-slate-200 hover:text-white border border-[#2c324a] flex items-center space-x-1.5"
                  >
                    {copiedKey === 'pitch' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'pitch' ? 'COPIED!' : 'COPY PITCH'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeMsgTab === 'followup1' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Follow-Up Message #1</label>
                  <pre className="p-4 rounded-xl bg-[#141624] border border-[#24293e] text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                    {pkg.followupMessage1 || (pkg.followUpSequence && pkg.followUpSequence[0])}
                  </pre>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#23273c]">
                  <button
                    onClick={() => handleCopyText(pkg.followupMessage1 || (pkg.followUpSequence && pkg.followUpSequence[0]) || '', 'f1')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#202538] text-slate-200 hover:text-white border border-[#2c324a] flex items-center space-x-1.5"
                  >
                    {copiedKey === 'f1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'f1' ? 'COPIED!' : 'COPY MSG'}</span>
                  </button>
                  <button
                    onClick={() => handleApproveAndSend('Follow-up #1')}
                    className="btn-gold px-6 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>APPROVE & LOG SEND</span>
                  </button>
                </div>
              </div>
            )}

            {activeMsgTab === 'followup2' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Follow-Up Message #2 (Final Check-in)</label>
                  <pre className="p-4 rounded-xl bg-[#141624] border border-[#24293e] text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                    {pkg.followupMessage2 || (pkg.followUpSequence && pkg.followUpSequence[1])}
                  </pre>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#23273c]">
                  <button
                    onClick={() => handleCopyText(pkg.followupMessage2 || (pkg.followUpSequence && pkg.followUpSequence[1]) || '', 'f2')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#202538] text-slate-200 hover:text-white border border-[#2c324a] flex items-center space-x-1.5"
                  >
                    {copiedKey === 'f2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'f2' ? 'COPIED!' : 'COPY MSG'}</span>
                  </button>
                  <button
                    onClick={() => handleApproveAndSend('Follow-up #2')}
                    className="btn-gold px-6 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>APPROVE & LOG SEND</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
