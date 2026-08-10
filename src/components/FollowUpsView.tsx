import React, { useState } from 'react';
import {
  CalendarCheck,
  Clock,
  AlertCircle,
  Calendar,
  Send,
  User,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { Lead, SalesStatus } from '../types/lead';

interface FollowUpsViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onNavigate: (tab: string) => void;
  onUpdateLeadStatus: (leadId: string, status: SalesStatus) => void;
  onUpdateLeadDetails: (leadId: string, updates: Partial<Lead>) => void;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  leads,
  onSelectLead,
  onNavigate,
  onUpdateLeadStatus,
  onUpdateLeadDetails
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'upcoming'>('today');
  const [copiedId, setCopiedId] = useState<string>('');

  const todayStr = new Date().toISOString().slice(0, 10);

  const leadsWithFollowup = leads.filter(l => l.followUpDate && l.outreachStatus !== 'WON' && l.outreachStatus !== 'LOST' && l.outreachStatus !== 'NOT A FIT');

  const todayFollowups = leadsWithFollowup.filter(l => (l.followUpDate || '') === todayStr);
  const overdueFollowups = leadsWithFollowup.filter(l => (l.followUpDate || '') < todayStr);
  const upcomingFollowups = leadsWithFollowup.filter(l => (l.followUpDate || '') > todayStr);

  const currentList = activeTab === 'today' ? todayFollowups : activeTab === 'overdue' ? overdueFollowups : upcomingFollowups;

  const handleCopyMessage = (msg: string, leadId: string) => {
    navigator.clipboard.writeText(msg);
    setCopiedId(leadId);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleMarkFollowupDone = (leadId: string) => {
    const nextDate = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10);
    onUpdateLeadDetails(leadId, {
      lastContacted: todayStr,
      followUpDate: nextDate
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-card-gold p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#f5b82e]/20 text-[#f5b82e] text-xs font-semibold border border-[#f5b82e]/30 mb-2">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>FOLLOW-UP TRACKING ENGINE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            FOLLOW-UPS <span className="text-gold-gradient">MANAGER</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Track scheduled touchpoints, overdue follow-ups, and auto-generated follow-up pitch angles
          </p>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center space-x-3 border-b border-[#212538] pb-3">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'today'
              ? 'bg-[#f5b82e] text-[#0c0d12] shadow-md shadow-[#f5b82e]/20'
              : 'bg-[#151724] text-slate-400 hover:text-white border border-[#22273d]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Today's Follow-ups ({todayFollowups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overdue'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'bg-[#151724] text-rose-400 hover:text-white border border-[#22273d]'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Overdue ({overdueFollowups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'upcoming'
              ? 'bg-[#f5b82e] text-[#0c0d12] shadow-md shadow-[#f5b82e]/20'
              : 'bg-[#151724] text-slate-400 hover:text-white border border-[#22273d]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Upcoming ({upcomingFollowups.length})</span>
        </button>
      </div>

      {/* Followups List */}
      {currentList.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center text-slate-400 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="font-semibold text-white">No follow-ups in this section!</p>
          <p className="text-xs text-slate-400">All client follow-ups are up to date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {currentList.map((lead) => {
            const followUpMsg = lead.outreachPackage?.followupMessage1 || `Hi ${lead.decisionMakerName}, following up on our previous commercial production conversation for ${lead.companyName}...`;

            return (
              <div key={lead.leadId} className="glass-card p-6 rounded-2xl border border-[#202436] space-y-4 hover:border-[#f5b82e]/40 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white font-display">{lead.companyName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Contact: <span className="text-white font-medium">{lead.decisionMakerName}</span> ({lead.decisionMakerDesignation})
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                    activeTab === 'overdue' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-[#f5b82e]/20 text-[#f5b82e] border-[#f5b82e]/40'
                  }`}>
                    Due: {lead.followUpDate}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#141624] p-3 rounded-xl border border-[#22263b]">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Last Contacted</span>
                    <span className="text-slate-300">{lead.lastContacted} ({lead.lastContactMethod})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Next Action</span>
                    <span className="text-emerald-400 font-semibold truncate block">{lead.nextAction}</span>
                  </div>
                </div>

                {/* Auto-generated Follow-up Message Preview */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Recommended Follow-up Pitch</label>
                  <pre className="p-3 rounded-xl bg-[#121420] border border-[#23273c] text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed line-clamp-3">
                    {followUpMsg}
                  </pre>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1e2235]">
                  <button
                    onClick={() => handleCopyMessage(followUpMsg, lead.leadId)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#21263a] text-slate-200 hover:text-white border border-[#2e344e] flex items-center space-x-1.5"
                  >
                    {copiedId === lead.leadId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === lead.leadId ? 'COPIED!' : 'COPY MSG'}</span>
                  </button>

                  <button
                    onClick={() => handleMarkFollowupDone(lead.leadId)}
                    className="btn-gold px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>LOG COMPLETED</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
