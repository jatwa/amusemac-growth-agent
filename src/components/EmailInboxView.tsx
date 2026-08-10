import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Send,
  MessageSquare,
  UserX,
  FileEdit,
  Trash2,
  RefreshCw,
  Mail,
  Plus,
  CheckCircle2,
  X,
  Paperclip,
  Search,
  Eye,
  Link,
  ChevronRight,
  Clock,
  Sparkles,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { Lead, SalesStatus } from '../types/lead';
import { EmailMessage, EmailAttachment } from '../types/email';
import { REUSABLE_EMAIL_TEMPLATES, populateTemplateVariables } from '../data/emailTemplates';
import {
  sendZohoEmail,
  syncZohoInbox,
  fetchEmailLogs,
  associateEmailToLead,
  saveDraftEmail,
  markEmailAsRead,
  moveEmailToTrash
} from '../services/apiMailService';

interface EmailInboxViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLeadStatus: (leadId: string, status: SalesStatus) => void;
  onUpdateLeadDetails: (leadId: string, updates: Partial<Lead>) => void;
}

type MailFolder = 'inbox' | 'sent' | 'threads' | 'unassigned' | 'drafts' | 'trash';

export const EmailInboxView: React.FC<EmailInboxViewProps> = ({
  leads,
  onSelectLead,
  onUpdateLeadStatus,
  onUpdateLeadDetails
}) => {
  const [activeFolder, setActiveFolder] = useState<MailFolder>('inbox');
  const [emailLogs, setEmailLogs] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.leadId || '');

  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');

  // Compose Modal State
  const [showComposer, setShowComposer] = useState(false);
  const [composerTo, setComposerTo] = useState('');
  const [composerCc, setComposerCc] = useState('');
  const [composerSubject, setComposerSubject] = useState('');
  const [composerBody, setComposerBody] = useState('');
  const [composerLeadId, setComposerLeadId] = useState<string>('');
  const [composerTemplateId, setComposerTemplateId] = useState('initial-outreach');
  const [composerAttachments, setComposerAttachments] = useState<EmailAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // Load all logs from API
  const loadLogs = async () => {
    const logs = await fetchEmailLogs();
    setEmailLogs(logs);
    if (logs.length > 0 && !selectedMessage) {
      setSelectedMessage(logs[0]);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Filtered Email Lists per Folder
  const inboxMessages = emailLogs.filter(e => e.direction === 'INBOUND' && e.status !== 'TRASH');
  const sentMessages = emailLogs.filter(e => e.direction === 'OUTBOUND' && e.status === 'SENT');
  const unassignedMessages = emailLogs.filter(e => e.direction === 'INBOUND' && !e.leadId && e.status !== 'TRASH');
  const draftMessages = emailLogs.filter(e => e.status === 'DRAFT');
  const trashMessages = emailLogs.filter(e => e.status === 'TRASH');

  const unreadCount = inboxMessages.filter(e => e.readStatus === 'UNREAD').length;

  // Folder Display Items
  const currentFolderMessages = () => {
    let list: EmailMessage[] = [];
    if (activeFolder === 'inbox') list = inboxMessages;
    else if (activeFolder === 'sent') list = sentMessages;
    else if (activeFolder === 'unassigned') list = unassignedMessages;
    else if (activeFolder === 'drafts') list = draftMessages;
    else if (activeFolder === 'trash') list = trashMessages;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return list.filter(e =>
        e.subject.toLowerCase().includes(term) ||
        e.from.toLowerCase().includes(term) ||
        e.to.toLowerCase().includes(term) ||
        e.body.toLowerCase().includes(term)
      );
    }
    return list;
  };

  const currentLead = leads.find(l => l.leadId === selectedLeadId) || leads[0];
  const currentThreadMessages = emailLogs.filter(e => e.leadId === currentLead?.leadId && e.status !== 'TRASH').sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const handleSyncInbox = async () => {
    setIsSyncing(true);
    setSyncNotice('Connecting to Zoho IMAP (imappro.zoho.com:993)...');

    const result = await syncZohoInbox(leads);
    setSyncNotice(result.message);

    if (result.logs) {
      setEmailLogs(result.logs);
    } else {
      await loadLogs();
    }

    if (result.newReplies && result.newReplies.length > 0) {
      result.newReplies.forEach(reply => {
        if (reply.leadId) {
          onUpdateLeadStatus(reply.leadId, 'REPLIED');
          onUpdateLeadDetails(reply.leadId, {
            lastContacted: new Date().toISOString().slice(0, 10),
            lastContactMethod: 'Zoho Mail Inbound'
          });
        }
      });
    }

    setIsSyncing(false);
    setTimeout(() => setSyncNotice(''), 4000);
  };

  const handleOpenComposer = (targetLead?: Lead, initialDraft?: EmailMessage) => {
    const lead = targetLead || currentLead;
    setComposerLeadId(lead ? lead.leadId : '');
    setComposerTo(lead && lead.email !== 'Not found' ? lead.email : (initialDraft ? initialDraft.to : ''));
    setComposerCc(initialDraft ? initialDraft.cc || '' : '');

    if (initialDraft) {
      setCurrentDraftId(initialDraft.emailId);
      setComposerSubject(initialDraft.subject);
      setComposerBody(initialDraft.body);
      setComposerAttachments(initialDraft.attachments || []);
    } else {
      setCurrentDraftId(null);
      const tpl = REUSABLE_EMAIL_TEMPLATES.find(t => t.id === composerTemplateId) || REUSABLE_EMAIL_TEMPLATES[0];
      setComposerSubject(populateTemplateVariables(tpl.subjectTemplate, lead));
      setComposerBody(populateTemplateVariables(tpl.bodyTemplate, lead));
      setComposerAttachments([]);
    }

    setShowComposer(true);
  };

  const handleTemplateChange = (tplId: string) => {
    setComposerTemplateId(tplId);
    const tpl = REUSABLE_EMAIL_TEMPLATES.find(t => t.id === tplId);
    const lead = leads.find(l => l.leadId === composerLeadId) || currentLead;
    if (tpl) {
      setComposerSubject(populateTemplateVariables(tpl.subjectTemplate, lead));
      setComposerBody(populateTemplateVariables(tpl.bodyTemplate, lead));
    }
  };

  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newAtt: EmailAttachment = {
        name: file.name,
        size: Math.round(file.size / 1024),
        type: file.type || 'document'
      };
      setComposerAttachments(prev => [...prev, newAtt]);
    }
  };

  const handleSaveDraft = async () => {
    const draftPayload = {
      emailId: currentDraftId || undefined,
      leadId: composerLeadId || null,
      to: composerTo,
      cc: composerCc,
      subject: composerSubject,
      body: composerBody,
      attachments: composerAttachments
    };

    const res = await saveDraftEmail(draftPayload);
    if (res.success) {
      setSyncNotice('Draft saved to Drafts folder.');
      setShowComposer(false);
      await loadLogs();
    }
    setTimeout(() => setSyncNotice(''), 3000);
  };

  const handleSendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerTo || !composerSubject || !composerBody) return;

    setIsSending(true);
    setSyncNotice('Connecting to Zoho SMTP (smtppro.zoho.com:465)...');

    const res = await sendZohoEmail({
      to: composerTo,
      subject: composerSubject,
      body: composerBody,
      leadId: composerLeadId || undefined,
      cc: composerCc,
      attachments: composerAttachments
    });

    if (res.success) {
      setSyncNotice('Test email sent successfully through Zoho Mail.');
      if (composerLeadId) {
        onUpdateLeadStatus(composerLeadId, 'CONTACTED');
        onUpdateLeadDetails(composerLeadId, {
          lastContacted: new Date().toISOString().slice(0, 10),
          lastContactMethod: 'Zoho Mail Outbound'
        });
      }
      setShowComposer(false);
      await loadLogs();
    } else {
      setSyncNotice(res.message);
    }

    setIsSending(false);
    setTimeout(() => setSyncNotice(''), 5000);
  };

  const handleSelectMessage = (msg: EmailMessage) => {
    setSelectedMessage(msg);
    if (msg.readStatus === 'UNREAD') {
      markEmailAsRead(msg.emailId);
      setEmailLogs(prev => prev.map(m => m.emailId === msg.emailId ? { ...m, readStatus: 'READ' } : m));
    }
  };

  const handleMoveToTrash = async (emailId: string) => {
    await moveEmailToTrash(emailId);
    setSyncNotice('Message moved to Trash.');
    await loadLogs();
    setTimeout(() => setSyncNotice(''), 3000);
  };

  const handleAssociateUnassigned = async (emailId: string, leadId: string) => {
    const res = await associateEmailToLead(emailId, leadId);
    if (res.success) {
      onUpdateLeadStatus(leadId, 'REPLIED');
      setSyncNotice('Associated client email to lead and updated status to REPLIED!');
      await loadLogs();
    }
    setTimeout(() => setSyncNotice(''), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-card-gold p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#f5b82e]/20 text-[#f5b82e] text-xs font-semibold border border-[#f5b82e]/30 mb-2">
            <Mail className="w-3.5 h-3.5" />
            <span>ZOHO MAILBOX (hello@amusemacstudio.in)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            EMAIL & <span className="text-gold-gradient">THREADS WORKBENCH</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Real enterprise mailbox client connected to Zoho SMTP (465 SSL) and IMAP (993 SSL)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSyncInbox}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1e2235] text-[#f5b82e] hover:bg-[#282d46] border border-[#2d334e] flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'SYNCING ZOHO IMAP...' : 'SYNC INBOX NOW'}</span>
          </button>

          <button
            onClick={() => handleOpenComposer()}
            className="btn-gold px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-[#f5b82e]/20"
          >
            <Plus className="w-4 h-4" />
            <span>COMPOSE EMAIL</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Main Mailbox Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Folder Navigation Sidebar (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card p-4 rounded-2xl border border-[#202436] space-y-2">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Mailbox Folders
            </div>

            <button
              onClick={() => setActiveFolder('inbox')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeFolder === 'inbox'
                  ? 'bg-[#f5b82e] text-[#0c0d12] shadow-md shadow-[#f5b82e]/20'
                  : 'bg-[#151724] text-slate-300 hover:bg-[#1e2235]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Inbox className="w-4 h-4" />
                <span>INBOX</span>
              </div>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveFolder('sent')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeFolder === 'sent'
                  ? 'bg-[#f5b82e] text-[#0c0d12] shadow-md shadow-[#f5b82e]/20'
                  : 'bg-[#151724] text-slate-300 hover:bg-[#1e2235]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Send className="w-4 h-4" />
                <span>SENT</span>
              </div>
              <span className="text-[11px] opacity-70">{sentMessages.length}</span>
            </button>

            <button
              onClick={() => setActiveFolder('threads')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeFolder === 'threads'
                  ? 'bg-[#f5b82e] text-[#0c0d12] shadow-md shadow-[#f5b82e]/20'
                  : 'bg-[#151724] text-slate-300 hover:bg-[#1e2235]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>THREADS</span>
              </div>
              <span className="text-[11px] opacity-70">{leads.length}</span>
            </button>

            <button
              onClick={() => setActiveFolder('unassigned')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeFolder === 'unassigned'
                  ? 'bg-[#f5b82e] text-[#0c0d12] shadow-md shadow-[#f5b82e]/20'
                  : 'bg-[#151724] text-slate-300 hover:bg-[#1e2235]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <UserX className="w-4 h-4" />
                <span>UNASSIGNED</span>
              </div>
              {unassignedMessages.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500 text-white rounded-full">
                  {unassignedMessages.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveFolder('drafts')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeFolder === 'drafts'
                  ? 'bg-[#f5b82e] text-[#0c0d12] shadow-md shadow-[#f5b82e]/20'
                  : 'bg-[#151724] text-slate-300 hover:bg-[#1e2235]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileEdit className="w-4 h-4" />
                <span>DRAFTS</span>
              </div>
              <span className="text-[11px] opacity-70">{draftMessages.length}</span>
            </button>

            <button
              onClick={() => setActiveFolder('trash')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeFolder === 'trash'
                  ? 'bg-[#f5b82e] text-[#0c0d12] shadow-md shadow-[#f5b82e]/20'
                  : 'bg-[#151724] text-slate-300 hover:bg-[#1e2235]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Trash2 className="w-4 h-4" />
                <span>TRASH</span>
              </div>
              <span className="text-[11px] opacity-70">{trashMessages.length}</span>
            </button>
          </div>

          {/* Quick Lead Selector for Threads View */}
          {activeFolder === 'threads' && (
            <div className="glass-card p-4 rounded-2xl border border-[#202436] space-y-2 max-h-[40vh] overflow-y-auto">
              <div className="px-2 text-[10px] font-bold text-slate-500 uppercase">Select Lead Thread</div>
              {leads.map((l) => {
                const leadMsgs = emailLogs.filter(e => e.leadId === l.leadId && e.status !== 'TRASH');
                const isSel = l.leadId === currentLead?.leadId;
                return (
                  <button
                    key={l.leadId}
                    onClick={() => setSelectedLeadId(l.leadId)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all ${
                      isSel ? 'bg-[#f5b82e]/10 border border-[#f5b82e] text-white' : 'bg-[#141624] text-slate-300 hover:bg-[#1c2032]'
                    }`}
                  >
                    <div className="font-bold text-white truncate">{l.companyName}</div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
                      <span>{l.projectName}</span>
                      <span className="font-mono text-slate-500">{leadMsgs.length} msgs</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Message List & Reader Master Detail (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          {/* Threads View Mode */}
          {activeFolder === 'threads' && currentLead ? (
            <div className="space-y-4">
              {/* Lead Thread Header */}
              <div className="glass-card p-5 rounded-2xl border border-[#202436] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold font-display text-white">{currentLead.companyName} Thread</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Project: <strong className="text-white">{currentLead.projectName}</strong> • Decision Maker: <strong className="text-[#f5b82e]">{currentLead.decisionMakerName}</strong> ({currentLead.email})
                  </p>
                </div>
                <button
                  onClick={() => handleOpenComposer(currentLead)}
                  className="btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>NEW MESSAGE</span>
                </button>
              </div>

              {/* Thread Timeline Messages */}
              <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-1">
                {currentThreadMessages.length === 0 ? (
                  <div className="glass-card p-12 rounded-2xl text-center text-slate-400 space-y-2">
                    <Mail className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="font-semibold text-white">No email messages sent or received yet for this lead thread.</p>
                    <button onClick={() => handleOpenComposer(currentLead)} className="btn-gold px-4 py-2 rounded-xl text-xs font-bold mt-2">
                      SEND FIRST EMAIL VIA ZOHO
                    </button>
                  </div>
                ) : (
                  currentThreadMessages.map((msg) => {
                    const isOutbound = msg.direction === 'OUTBOUND';
                    return (
                      <div
                        key={msg.emailId}
                        className={`p-5 rounded-2xl border space-y-3 ${
                          isOutbound
                            ? 'bg-[#181b2a] border-[#292f46] ml-6'
                            : 'bg-[#161a28] border-purple-500/30 mr-6 glass-card'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-[#22273c]">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                              isOutbound ? 'bg-[#f5b82e]/20 text-[#f5b82e] border-[#f5b82e]/40' : 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                            }`}>
                              {isOutbound ? 'OUTBOUND (hello@amusemacstudio.in)' : 'INBOUND CLIENT REPLY'}
                            </span>
                            <span className="text-slate-400 font-medium">{msg.from} → {msg.to}</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">{new Date(msg.timestamp).toLocaleString()}</span>
                        </div>

                        <div className="text-xs font-bold text-white">{msg.subject}</div>
                        <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">{msg.body}</pre>

                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="pt-2 flex items-center space-x-2">
                            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                            {msg.attachments.map((att, idx) => (
                              <span key={idx} className="px-2 py-1 bg-[#141624] text-slate-300 text-[10px] rounded border border-[#23273c]">
                                {att.name} ({att.size}KB)
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Split Pane Email List & Reader View for INBOX, SENT, UNASSIGNED, DRAFTS, TRASH */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Left Email List (5 cols) */}
              <div className="md:col-span-5 glass-card p-4 rounded-2xl border border-[#202436] space-y-3 max-h-[70vh] overflow-y-auto">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search folder emails..."
                    className="w-full bg-[#141624] border border-[#22273c] text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  {currentFolderMessages().length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No messages found in {activeFolder.toUpperCase()}.
                    </div>
                  ) : (
                    currentFolderMessages().map((msg) => {
                      const isSel = selectedMessage?.emailId === msg.emailId;
                      const isUnread = msg.readStatus === 'UNREAD';

                      return (
                        <button
                          key={msg.emailId}
                          onClick={() => handleSelectMessage(msg)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                            isSel
                              ? 'bg-[#f5b82e]/10 border-[#f5b82e] text-white shadow-md'
                              : isUnread
                              ? 'bg-[#1a1e30] border-purple-500/40 text-white font-bold'
                              : 'bg-[#141624] border-[#22273c] text-slate-300 hover:bg-[#1a1e30]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold truncate max-w-[170px]">{msg.direction === 'OUTBOUND' ? msg.to : msg.from}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{new Date(msg.timestamp).toLocaleDateString()}</span>
                          </div>

                          <div className="text-xs font-bold mt-1 text-white truncate">{msg.subject}</div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">{msg.body}</p>

                          <div className="flex items-center justify-between text-[10px] mt-2 pt-1.5 border-t border-[#1e2338]">
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              msg.direction === 'OUTBOUND' ? 'bg-[#f5b82e]/20 text-[#f5b82e]' : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {msg.direction}
                            </span>
                            {msg.autoMatched && (
                              <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Linked to Lead</span>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Email Reader (7 cols) */}
              <div className="md:col-span-7 glass-card p-6 rounded-2xl border border-[#202436] space-y-5">
                {selectedMessage ? (
                  <div className="space-y-4">
                    {/* Header Controls */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#23273c]">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                        selectedMessage.direction === 'OUTBOUND'
                          ? 'bg-[#f5b82e]/20 text-[#f5b82e] border-[#f5b82e]/40'
                          : 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                      }`}>
                        {selectedMessage.direction === 'OUTBOUND' ? 'OUTBOUND EMAIL (hello@amusemacstudio.in)' : 'INBOUND CLIENT EMAIL'}
                      </span>

                      <div className="flex items-center space-x-2">
                        {activeFolder === 'drafts' ? (
                          <button
                            onClick={() => handleOpenComposer(undefined, selectedMessage)}
                            className="btn-gold px-3 py-1.5 rounded-lg text-xs font-bold"
                          >
                            Edit & Send Draft
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenComposer(leads.find(l => l.leadId === selectedMessage.leadId))}
                            className="btn-gold px-3 py-1.5 rounded-lg text-xs font-bold"
                          >
                            Reply
                          </button>
                        )}
                        <button
                          onClick={() => handleMoveToTrash(selectedMessage.emailId)}
                          className="p-1.5 rounded-lg bg-[#1f2336] text-rose-400 hover:bg-rose-500/20"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Email Meta */}
                    <div className="space-y-1 text-xs">
                      <h3 className="text-base font-bold font-display text-white">{selectedMessage.subject}</h3>
                      <p className="text-slate-300">From: <strong className="text-white">{selectedMessage.from}</strong></p>
                      <p className="text-slate-300">To: <strong className="text-white">{selectedMessage.to}</strong></p>
                      {selectedMessage.cc && <p className="text-slate-400">CC: {selectedMessage.cc}</p>}
                      <p className="text-slate-500 font-mono text-[11px]">Timestamp: {new Date(selectedMessage.timestamp).toLocaleString()}</p>
                    </div>

                    {/* Unassigned Lead Matching Option */}
                    {!selectedMessage.leadId && selectedMessage.direction === 'INBOUND' && (
                      <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs space-y-2">
                        <span className="font-bold text-purple-300 block">Unassigned Message — Associate to CRM Lead:</span>
                        <select
                          onChange={(e) => {
                            if (e.target.value) handleAssociateUnassigned(selectedMessage.emailId, e.target.value);
                          }}
                          className="w-full bg-[#141624] border border-[#2b314a] text-white rounded-lg px-3 py-2 outline-none"
                        >
                          <option value="">Select Lead to Attach...</option>
                          {leads.map((l) => (
                            <option key={l.leadId} value={l.leadId}>{l.companyName} ({l.projectName})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Body */}
                    <div className="p-4 rounded-xl bg-[#141624] border border-[#21263c] text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed min-h-[160px]">
                      {selectedMessage.body}
                    </div>

                    {/* Attachments */}
                    {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                      <div className="pt-2 border-t border-[#23273c] space-y-1">
                        <span className="text-xs font-bold text-slate-400 flex items-center space-x-1">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Attachments ({selectedMessage.attachments.length})</span>
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {selectedMessage.attachments.map((att, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-[#181b2a] text-slate-200 text-xs rounded-xl border border-[#262c44]">
                              {att.name} ({att.size}KB)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                    <Eye className="w-8 h-8 mx-auto opacity-50" />
                    <p>Select an email from the list to view full message.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Email Modal */}
      {showComposer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSendEmailSubmit} className="bg-[#141622] border border-[#2c324a] rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#24293e] pb-3">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-[#f5b82e]" />
                <h3 className="text-lg font-bold text-white font-display">Compose Outreach Email</h3>
              </div>
              <button type="button" onClick={() => setShowComposer(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Sender: <strong>hello@amusemacstudio.in</strong> (smtppro.zoho.com:465)</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Select Lead</label>
                  <select
                    value={composerLeadId}
                    onChange={(e) => {
                      setComposerLeadId(e.target.value);
                      const l = leads.find(item => item.leadId === e.target.value);
                      if (l && l.email !== 'Not found') setComposerTo(l.email);
                    }}
                    className="w-full bg-[#181b2a] border border-[#2a2f47] text-white rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="">No Lead Linked</option>
                    {leads.map((l) => (
                      <option key={l.leadId} value={l.leadId}>{l.companyName} ({l.projectName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Reusable Template</label>
                  <select
                    value={composerTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full bg-[#181b2a] border border-[#2a2f47] text-white rounded-xl px-3 py-2 outline-none"
                  >
                    {REUSABLE_EMAIL_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">To (Recipient)</label>
                  <input
                    type="email"
                    value={composerTo}
                    onChange={(e) => setComposerTo(e.target.value)}
                    placeholder="prospect@client.com"
                    className="w-full bg-[#181b2a] border border-[#2a2f47] text-white rounded-xl px-3 py-2 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">CC (Optional)</label>
                  <input
                    type="text"
                    value={composerCc}
                    onChange={(e) => setComposerCc(e.target.value)}
                    placeholder="team@client.com"
                    className="w-full bg-[#181b2a] border border-[#2a2f47] text-white rounded-xl px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Subject</label>
                <input
                  type="text"
                  value={composerSubject}
                  onChange={(e) => setComposerSubject(e.target.value)}
                  className="w-full bg-[#181b2a] border border-[#2a2f47] text-white rounded-xl px-3 py-2 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Message Body</label>
                <textarea
                  rows={7}
                  value={composerBody}
                  onChange={(e) => setComposerBody(e.target.value)}
                  className="w-full bg-[#181b2a] border border-[#2a2f47] text-white rounded-xl p-3 outline-none font-sans"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1 flex items-center space-x-1">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attachments</span>
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    onChange={handleAddAttachment}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#22273d] file:text-slate-200 hover:file:bg-[#2e3552]"
                  />
                  {composerAttachments.map((att, idx) => (
                    <span key={idx} className="px-2 py-1 bg-[#181b2a] text-slate-300 text-[10px] rounded border border-[#262c44]">
                      {att.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#24293e]">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1e2235] text-slate-300 hover:text-white border border-[#2c324a]"
              >
                Save Draft
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowComposer(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#22273d] text-slate-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSending}
                  className="btn-gold px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'SENDING VIA ZOHO...' : 'CONFIRM & SEND VIA ZOHO'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
