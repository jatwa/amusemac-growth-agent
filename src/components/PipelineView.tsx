import React, { useState } from 'react';
import {
  KanbanSquare,
  Sparkles,
  User,
  Calendar,
  FileEdit,
  ArrowRight,
  Plus,
  Send,
  X,
  CheckCircle2
} from 'lucide-react';
import { Lead, SalesStatus } from '../types/lead';
import { SALES_STATUSES } from '../data/services';

interface PipelineViewProps {
  leads: Lead[];
  onUpdateLeadStatus: (leadId: string, status: SalesStatus) => void;
  onUpdateLeadDetails: (leadId: string, updates: Partial<Lead>) => void;
  onSelectLead: (lead: Lead) => void;
  onNavigate: (tab: string) => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  leads,
  onUpdateLeadStatus,
  onUpdateLeadDetails,
  onSelectLead,
  onNavigate
}) => {
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [nextActionInput, setNextActionInput] = useState('');
  const [followUpDateInput, setFollowUpDateInput] = useState('');

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setNotesInput(lead.notes || '');
    setNextActionInput(lead.nextAction || '');
    setFollowUpDateInput(lead.followUpDate || '');
  };

  const handleSaveLeadEdit = () => {
    if (!editingLead) return;
    onUpdateLeadDetails(editingLead.leadId, {
      notes: notesInput,
      nextAction: nextActionInput,
      followUpDate: followUpDateInput
    });
    setEditingLead(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-card-gold p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#f5b82e]/20 text-[#f5b82e] text-xs font-semibold border border-[#f5b82e]/30 mb-2">
            <KanbanSquare className="w-3.5 h-3.5" />
            <span>12-STAGE B2B SALES PIPELINE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            SALES <span className="text-gold-gradient">PIPELINE BOARD</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Track lead lifecycle from initial discovery to proposal and deal completion
          </p>
        </div>
      </div>

      {/* Kanban Horizontal Scroll Board */}
      <div className="flex space-x-4 overflow-x-auto pb-6 pt-2 snap-x">
        {SALES_STATUSES.map((statusObj) => {
          const statusLeads = leads.filter(l => l.outreachStatus === statusObj.id);

          return (
            <div
              key={statusObj.id}
              className="w-80 shrink-0 bg-[#12141e] border border-[#212538] rounded-2xl flex flex-col max-h-[75vh] glass-card"
            >
              {/* Column Header */}
              <div className="p-4 border-b border-[#212538] flex items-center justify-between bg-[#171a28] rounded-t-2xl">
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-1 text-xs font-extrabold rounded-lg border ${statusObj.color}`}>
                    {statusObj.label}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 bg-[#21263a] px-2 py-0.5 rounded-full">
                  {statusLeads.length}
                </span>
              </div>

              {/* Lead Cards List */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {statusLeads.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-600 border border-dashed border-[#24283b] rounded-xl">
                    No leads in this stage
                  </div>
                ) : (
                  statusLeads.map((lead) => (
                    <div
                      key={lead.leadId}
                      onClick={() => onSelectLead(lead)}
                      className="bg-[#181b28] hover:bg-[#1f2336] p-4 rounded-xl border border-[#262b42] hover:border-[#f5b82e]/40 transition-all space-y-3 group shadow-md cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white font-display group-hover:text-[#f5b82e] transition-colors">
                            {lead.companyName}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">{lead.industry}</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#f5b82e]">{lead.aiScore} pts</span>
                      </div>

                      <div className="text-xs text-slate-300 bg-[#141622] p-2.5 rounded-lg border border-[#22263a]">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Primary Service</span>
                        <span className="font-semibold text-white truncate block">{lead.primaryService}</span>
                      </div>

                      {lead.nextAction && (
                        <div className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
                          <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{lead.nextAction}</span>
                        </div>
                      )}

                      {/* Card Action Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#22263a] text-xs" onClick={(e) => e.stopPropagation()}>
                        {/* Status Select */}
                        <select
                          value={lead.outreachStatus}
                          onChange={(e) => onUpdateLeadStatus(lead.leadId, e.target.value as SalesStatus)}
                          className="bg-[#131520] border border-[#2a2f46] text-white text-[10px] rounded-lg px-1.5 py-1"
                        >
                          {SALES_STATUSES.map((st) => (
                            <option key={st.id} value={st.id}>{st.label}</option>
                          ))}
                        </select>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => openEditModal(lead)}
                            className="p-1.5 rounded-lg bg-[#22273d] text-slate-300 hover:text-white"
                            title="Edit Notes & Next Action"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onSelectLead(lead);
                              onNavigate('outreach');
                            }}
                            className="p-1.5 rounded-lg bg-[#f5b82e] text-[#0c0d12] font-bold"
                            title="Open Outreach Generator"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Notes & Action Modal */}
      {editingLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141622] border border-[#2c324a] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#24293e] pb-3">
              <h3 className="text-lg font-bold text-white font-display">Update CRM Record</h3>
              <button onClick={() => setEditingLead(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Next Action Step</label>
                <input
                  type="text"
                  value={nextActionInput}
                  onChange={(e) => setNextActionInput(e.target.value)}
                  placeholder="e.g. Follow up on proposal deck"
                  className="w-full bg-[#181b2a] border border-[#2a2f47] text-white rounded-xl px-3 py-2.5 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={followUpDateInput}
                  onChange={(e) => setFollowUpDateInput(e.target.value)}
                  className="w-full bg-[#181b2a] border border-[#2a2f47] text-white rounded-xl px-3 py-2.5 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">CRM Notes & Log</label>
                <textarea
                  rows={4}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Add notes about client response, call summary..."
                  className="w-full bg-[#181b2a] border border-[#2a2f47] text-white rounded-xl p-3 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#24293e]">
              <button
                onClick={() => setEditingLead(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#22273d] text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLeadEdit}
                className="btn-gold px-5 py-2 rounded-xl text-xs font-bold"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
