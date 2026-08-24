import React, { useState, useEffect } from 'react';
import { X, Send, Mail, AlertCircle, CheckCircle2, FileText, Sparkles, Lock, Building2 } from 'lucide-react';
import { OpportunityLead } from '../types/opportunity';
import { Lead } from '../types/lead';
import { sendZohoEmail } from '../services/apiMailService';
import { RichTextEmailComposer } from './RichTextEmailComposer';

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: OpportunityLead | Lead | null;
  initialSubject?: string;
  initialBody?: string;
  onSendSuccess?: (recipient: string, subject: string, messageId?: string) => void;
}

export const EmailComposerModal: React.FC<EmailComposerModalProps> = ({
  isOpen,
  onClose,
  lead,
  initialSubject = '',
  initialBody = '',
  onSendSuccess
}) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [sendStatus, setSendStatus] = useState<'IDLE' | 'SENDING' | 'SENT' | 'FAILED'>('IDLE');

  useEffect(() => {
    if (lead) {
      // Determine recipient email from lead object
      const leadEmail = (lead as any).contactInfo?.email || (lead as any).email;
      const cleanEmail = leadEmail && leadEmail !== 'Not found' ? leadEmail : '';
      setRecipient(cleanEmail);

      // Default Subject
      const company = lead.companyName || (lead as any).requester || 'Target Client';
      const service = (lead as any).matchedServices?.[0] || (lead as any).primaryService || 'Video & Creative Production';
      setSubject(initialSubject || `Proposal: ${service} for ${company}`);

      // Default Message Body
      if (initialBody) {
        setBody(initialBody);
      } else {
        const req = (lead as any).requirement || (lead as any).description || 'your creative production requirement';
        const defaultBody = `Hi ${company} Team,\n\nI saw your requirement regarding "${req}".\n\nAt Amusemac Studio, we specialize in high-impact ${service}, motion graphics, and corporate film production. We can help execute this project efficiently within your target timeline.\n\nWould you be open to a quick 10-minute discovery call this week to discuss how we can support your project?\n\nBest regards,\n\nKuldeep Jatwa\nCreative Director & Production Designer\nAmusemac Studio\n+91 8770382125\namusemacstudio.in`;
        setBody(defaultBody);
      }
    }
    setSendStatus('IDLE');
    setStatusMessage(null);
  }, [lead, initialSubject, initialBody, isOpen]);

  if (!isOpen || !lead) return null;

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !recipient.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid recipient email address.' });
      return;
    }
    if (!subject.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide an email subject.' });
      return;
    }
    if (!body.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide email message content.' });
      return;
    }

    setIsSending(true);
    setSendStatus('SENDING');
    setStatusMessage({ type: 'info', text: 'Sending outreach email via Zoho Mail SMTP...' });

    const leadId = (lead as any).leadId || (lead as any).id || 'LEAD-OUTREACH';

    try {
      // Server endpoint /api/leads/:id/email validates auth & SMTP credentials server-side
      const response = await fetch(`/api/leads/${encodeURIComponent(leadId)}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('amusemac_auth_session') ? JSON.parse(localStorage.getItem('amusemac_auth_session')!).token : ''}`
        },
        body: JSON.stringify({
          to: recipient.trim(),
          subject: subject.trim(),
          message: body.trim()
        })
      });

      const resData = await response.json();

      if (response.ok && resData.success && resData.status === 'SENT') {
        setSendStatus('SENT');
        setStatusMessage({
          type: 'success',
          text: `Email successfully SENT to ${recipient} via Zoho Mail (hello@amusemacstudio.in).`
        });
        if (onSendSuccess) {
          onSendSuccess(recipient, subject, resData.messageId);
        }
      } else {
        setSendStatus('FAILED');
        const errMsg = resData.message || 'Zoho SMTP returned an error.';
        setStatusMessage({
          type: 'error',
          text: `Email FAILED: ${errMsg}`
        });
      }
    } catch (err: any) {
      setSendStatus('FAILED');
      setStatusMessage({
        type: 'error',
        text: `Email FAILED: Network error (${err.message || 'Unable to connect to backend server'})`
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-[#121420] border-0 sm:border border-[#272b42] rounded-none sm:rounded-3xl w-full max-w-2xl min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto shadow-2xl text-slate-200 animate-fadeIn">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#171a2c] via-[#1b1f36] to-[#121420] border-b border-[#23273d] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Direct Zoho Outreach</h2>
              <p className="text-xs text-slate-400">
                Sending from: <span className="text-amber-400 font-semibold">hello@amusemacstudio.in</span> (Zoho Mail SMTP)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#20253b] hover:bg-[#2c3350] text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSendEmail} className="p-6 space-y-4 text-xs">
          {/* Target Company Info Banner */}
          <div className="p-3.5 rounded-2xl bg-[#161928] border border-[#262a42] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-[#f5b82e]" />
              <span className="font-bold text-white">{lead.companyName || (lead as any).requester}</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              REAL_PUBLIC LEAD
            </span>
          </div>

          {/* Status Alert Banner */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl border flex items-start space-x-3 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <Sparkles className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}
              <div className="space-y-1">
                <span className="font-bold block">
                  {statusMessage.type === 'success' ? 'Email Sent' : statusMessage.type === 'error' ? 'Delivery Error' : 'Processing'}
                </span>
                <p className="leading-relaxed">{statusMessage.text}</p>
              </div>
            </div>
          )}

          {/* Recipient Email Field */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 flex items-center justify-between">
              <span>To (Recipient Email Address):</span>
              {!recipient && (
                <span className="text-amber-400 text-[11px] font-normal">
                  (Not available in public source — enter email manually)
                </span>
              )}
            </label>
            <input
              type="email"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              placeholder="e.g. contact@clientcompany.com"
              className="w-full px-4 py-2.5 rounded-xl bg-[#161928] border border-[#262a42] text-white focus:outline-none focus:border-[#f5b82e] font-mono text-xs transition-all"
              required
            />
          </div>

          {/* Subject Field */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#161928] border border-[#262a42] text-white focus:outline-none focus:border-[#f5b82e] text-xs transition-all"
              required
            />
          </div>

          {/* Body Message Field */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 flex items-center justify-between">
              <span>Message Body:</span>
              <span className="text-amber-400 text-[11px] font-normal">Rich Text & Hyperlinks Supported (Full Editing)</span>
            </label>
            <RichTextEmailComposer
              initialText={body}
              initialHtml={htmlBody}
              onChange={(html, text) => {
                setHtmlBody(html);
                setBody(text);
              }}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#23273d] flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zoho SMTP password is secure server-side</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#22273e] hover:bg-[#2c3350] text-slate-300 font-semibold transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSending || sendStatus === 'SENT'}
                className={`btn-gold px-6 py-2 rounded-xl font-bold inline-flex items-center space-x-2 shadow-md disabled:opacity-50 ${
                  sendStatus === 'SENT' ? 'bg-emerald-500 text-white cursor-default' : ''
                }`}
              >
                {isSending ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Sending via Zoho...</span>
                  </>
                ) : sendStatus === 'SENT' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Email Sent!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Email via Zoho</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
