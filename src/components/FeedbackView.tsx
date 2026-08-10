import React, { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  Award
} from 'lucide-react';
import { Lead, FeedbackRating, UserFeedbackLog } from '../types/lead';

interface FeedbackViewProps {
  leads: Lead[];
  onUpdateLeadFeedback: (leadId: string, feedback: FeedbackRating) => void;
  feedbackLogs: UserFeedbackLog[];
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({
  leads,
  onUpdateLeadFeedback,
  feedbackLogs
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.leadId || '');
  const [selectedRating, setSelectedRating] = useState<FeedbackRating>('GOOD LEAD');
  const [noteInput, setNoteInput] = useState('');
  const [notice, setNotice] = useState('');

  const targetLead = leads.find(l => l.leadId === selectedLeadId) || leads[0];

  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLead) return;

    onUpdateLeadFeedback(targetLead.leadId, selectedRating);
    setNotice(`Feedback logged for ${targetLead.companyName}! Scoring engine weights refined.`);
    setNoteInput('');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-card-gold p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#f5b82e]/20 text-[#f5b82e] text-xs font-semibold border border-[#f5b82e]/30 mb-2">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>AI CONTINUOUS REINFORCEMENT LEARNING</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            FEEDBACK LOOP & <span className="text-gold-gradient">AI TRAINING</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Rate qualified leads to dynamically train and fine-tune future Amusemac lead scoring weights
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center space-x-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Grid: Feedback Form + Training Weights Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rate Lead Form */}
        <form onSubmit={handleSaveFeedback} className="glass-card p-6 rounded-2xl border border-[#202436] space-y-5">
          <h3 className="text-base font-bold font-display text-white">Mark Lead Feedback</h3>

          {/* Select Lead */}
          <div className="space-y-1.5 text-xs">
            <label className="text-slate-400 font-semibold">Select Lead to Rate</label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full bg-[#151724] border border-[#2a2f47] text-white rounded-xl px-3 py-3 outline-none"
            >
              {leads.map((l) => (
                <option key={l.leadId} value={l.leadId}>
                  {l.companyName} ({l.industry}) — AI Score: {l.aiScore}
                </option>
              ))}
            </select>
          </div>

          {/* Feedback Buttons */}
          <div className="space-y-2 text-xs">
            <label className="text-slate-400 font-semibold block">Feedback Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'GOOD LEAD', label: 'GOOD LEAD', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
                { id: 'BAD LEAD', label: 'BAD LEAD', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
                { id: 'CONVERTED', label: 'CONVERTED', color: 'bg-green-500/20 text-green-300 border-green-500/50' },
                { id: 'NOT RELEVANT', label: 'NOT RELEVANT', color: 'bg-slate-500/20 text-slate-300 border-slate-500/40' },
                { id: 'WRONG INFORMATION', label: 'WRONG INFO', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedRating(item.id as FeedbackRating)}
                  className={`p-3 rounded-xl font-bold border transition-all text-center ${
                    selectedRating === item.id
                      ? `${item.color} shadow-lg ring-2 ring-[#f5b82e]`
                      : 'bg-[#161926] text-slate-400 border-[#24283c] hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div className="space-y-1 text-xs">
            <label className="text-slate-400 font-semibold">Feedback Rationale (Optional)</label>
            <textarea
              rows={3}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="e.g. Budget was too low, or high enthusiasm for Advertising Film Production..."
              className="w-full bg-[#151724] border border-[#2a2f47] text-white rounded-xl p-3 outline-none"
            />
          </div>

          <button
            type="submit"
            className="btn-gold w-full py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#f5b82e]/20"
          >
            LOG FEEDBACK & REFINE SCORING
          </button>
        </form>

        {/* Dynamic Model Weights Dashboard */}
        <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-4">
          <h3 className="text-base font-bold font-display text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#f5b82e]" />
            <span>AI Scoring Model Adjustments</span>
          </h3>

          <p className="text-xs text-slate-300">
            Internal evaluation criteria dynamically adjusted based on user feedback history:
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#161826] border border-[#24283c] flex items-center justify-between">
              <span className="font-semibold text-slate-200">Advertising & Campaign Activity</span>
              <span className="font-mono font-bold text-emerald-400">+25% Weight</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#161826] border border-[#24283c] flex items-center justify-between">
              <span className="font-semibold text-slate-200">Decision Maker Availability</span>
              <span className="font-mono font-bold text-[#f5b82e]">+20% Weight</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#161826] border border-[#24283c] flex items-center justify-between">
              <span className="font-semibold text-slate-200">Public Contactability Rating</span>
              <span className="font-mono font-bold text-cyan-400">+15% Weight</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#161826] border border-[#24283c] flex items-center justify-between">
              <span className="font-semibold text-slate-200">D2C & Agency Outsource Propensity</span>
              <span className="font-mono font-bold text-purple-400">+20% Weight</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
