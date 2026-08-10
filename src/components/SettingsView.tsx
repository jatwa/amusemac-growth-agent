import React, { useState, useEffect } from 'react';
import {
  Sheet as SheetIcon,
  Copy as CopyIcon,
  Check as CheckIcon,
  Key as KeyIcon,
  Database as DatabaseIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  RefreshCw as RefreshIcon,
  Code as CodeIcon,
  ShieldCheck as ShieldIcon,
  CheckCircle2 as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
  Mail as MailIcon,
  Send as SendIcon,
  Server as ServerIcon
} from 'lucide-react';
import { Lead } from '../types/lead';
import { ZohoMailConfigStatus } from '../types/email';
import { GoogleLogo, MicrosoftLogo, AppleLogo, ZohoLogo } from './ProviderLogos';
import {
  getGoogleAppsScriptCode,
  downloadCsv,
  syncLeadsToGoogleSheet,
  runTestSyncGoogleSheet,
  GoogleSheetsSyncResult
} from '../services/googleSheets';
import { fetchZohoMailStatus, sendTestEmail, syncZohoInbox } from '../services/apiMailService';

interface SettingsViewProps {
  leads: Lead[];
  webhookUrl: string;
  onUpdateWebhookUrl: (url: string) => void;
  geminiApiKey: string;
  onUpdateGeminiApiKey: (key: string) => void;
  onImportLeads: (imported: Lead[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  leads,
  webhookUrl,
  onUpdateWebhookUrl,
  geminiApiKey,
  onUpdateGeminiApiKey,
  onImportLeads
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'email' | 'sheets' | 'connected' | 'backup'>('connected');

  const [webhookInput, setWebhookInput] = useState(webhookUrl);
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);

  const [zohoStatus, setZohoStatus] = useState<ZohoMailConfigStatus | null>(null);
  const [testRecipient, setTestRecipient] = useState('');

  // Sync Status State
  const [syncStatus, setSyncStatus] = useState<'Connected' | 'Syncing' | 'Synced' | 'Failed' | 'Disconnected'>(
    webhookUrl ? 'Connected' : 'Disconnected'
  );
  const [lastSyncTime, setLastSyncTime] = useState<string>('Never');
  const [syncResultDetails, setSyncResultDetails] = useState<GoogleSheetsSyncResult | null>(null);

  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isTestingSend, setIsTestingSend] = useState(false);
  const [isSyncingZoho, setIsSyncingZoho] = useState(false);

  const [statusNotice, setStatusNotice] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const scriptCode = getGoogleAppsScriptCode();

  const loadZohoStatus = async () => {
    const status = await fetchZohoMailStatus();
    setZohoStatus(status);
  };

  useEffect(() => {
    loadZohoStatus();
  }, []);

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    const url = webhookInput.trim();
    onUpdateWebhookUrl(url);
    if (url) {
      setSyncStatus('Connected');
      setStatusNotice('Google Sheets Webhook URL saved! Click TEST SYNC to verify.');
    } else {
      setSyncStatus('Disconnected');
      setStatusNotice('Webhook URL cleared.');
    }
    setTimeout(() => setStatusNotice(''), 4000);
  };

  const handleRunTestSync = async () => {
    if (!webhookInput) {
      setSyncStatus('Failed');
      alert('Please enter a Google Apps Script Webhook URL first.');
      return;
    }

    setIsSyncingSheets(true);
    setSyncStatus('Syncing');
    setStatusNotice('Executing REAL Google Sheets Write Test ("Amusemac Growth Leads")...');

    const res = await runTestSyncGoogleSheet(webhookInput);
    setSyncResultDetails(res);

    if (res.success) {
      setSyncStatus('Synced');
      setLastSyncTime(res.timestamp || new Date().toLocaleString());
      setStatusNotice(res.message);
    } else {
      setSyncStatus('Failed');
      setStatusNotice(`TEST SYNC FAILED: ${res.message}`);
    }

    setIsSyncingSheets(false);
  };

  const handleSyncAllNow = async () => {
    if (!webhookUrl) {
      setSyncStatus('Failed');
      alert('Google Sheets Webhook URL not configured.');
      return;
    }

    setIsSyncingSheets(true);
    setSyncStatus('Syncing');
    setStatusNotice(`Syncing ${leads.length} lead(s) to Google Sheets ("Amusemac Growth Leads")...`);

    const res = await syncLeadsToGoogleSheet(webhookUrl, leads);
    setSyncResultDetails(res);

    if (res.success) {
      setSyncStatus('Synced');
      setLastSyncTime(res.timestamp || new Date().toLocaleString());
      setStatusNotice(res.message);
    } else {
      setSyncStatus('Failed');
      setStatusNotice(`Sync Failed: ${res.message}`);
    }

    setIsSyncingSheets(false);
  };

  const handleRunTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) return;

    setIsTestingSend(true);
    setStatusNotice(`Sending test email from hello@amusemacstudio.in to ${testRecipient}...`);

    const res = await sendTestEmail(testRecipient);
    setStatusNotice(res.message);
    setIsTestingSend(false);
    await loadZohoStatus();
  };

  const handleRunTestReceive = async () => {
    setIsSyncingZoho(true);
    setStatusNotice('Testing Zoho IMAP Sync (imappro.zoho.com:993)...');

    const res = await syncZohoInbox(leads);
    setStatusNotice(res.message);
    setIsSyncingZoho(false);
    await loadZohoStatus();
  };

  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-card-gold p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#f5b82e]/20 text-[#f5b82e] text-xs font-semibold border border-[#f5b82e]/30 mb-2">
            <ServerIcon className="w-3.5 h-3.5" />
            <span>ENTERPRISE INTEGRATION HUB</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            SETTINGS & <span className="text-gold-gradient">INTEGRATIONS</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Real Google Sheets synchronization, Zoho Mail Enterprise setup, and data backup
          </p>
        </div>
      </div>

      {statusNotice && (
        <div className={`p-4 rounded-xl border text-xs font-bold flex items-center space-x-2 ${
          statusNotice.includes('FAILED') || statusNotice.includes('Failed') || statusNotice.includes('error')
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          <CheckCircleIcon className="w-4 h-4 shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Sub-Tabs Bar */}
      <div className="flex items-center space-x-3 border-b border-[#212538] pb-3">
        <button
          onClick={() => setActiveSettingsTab('connected')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSettingsTab === 'connected'
              ? 'bg-[#f5b82e] text-[#0c0d12] shadow-md shadow-[#f5b82e]/20'
              : 'bg-[#151724] text-slate-400 hover:text-white border border-[#22273d]'
          }`}
        >
          <ServerIcon className="w-4 h-4 text-[#f5b82e]" />
          <span>Connected Accounts (Email & WhatsApp)</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('sheets')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSettingsTab === 'sheets'
              ? 'bg-[#f5b82e] text-[#0c0d12] shadow-md shadow-[#f5b82e]/20'
              : 'bg-[#151724] text-slate-400 hover:text-white border border-[#22273d]'
          }`}
        >
          <SheetIcon className="w-4 h-4" />
          <span>Google Sheets Real Sync</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('email')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSettingsTab === 'email'
              ? 'bg-[#f5b82e] text-[#0c0d12] shadow-md shadow-[#f5b82e]/20'
              : 'bg-[#151724] text-slate-400 hover:text-white border border-[#22273d]'
          }`}
        >
          <MailIcon className="w-4 h-4" />
          <span>Zoho Mail Enterprise</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('backup')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSettingsTab === 'backup'
              ? 'bg-[#f5b82e] text-[#0c0d12] shadow-md shadow-[#f5b82e]/20'
              : 'bg-[#151724] text-slate-400 hover:text-white border border-[#22273d]'
          }`}
        >
          <DatabaseIcon className="w-4 h-4" />
          <span>Database & Backup</span>
        </button>
      </div>

      {/* Connected Accounts Section */}
      {activeSettingsTab === 'connected' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Section 1: Authentication Accounts */}
          <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-4 text-xs">
            <div className="border-b border-[#23273d] pb-3">
              <h3 className="text-base font-bold text-white font-display">Authentication Accounts & Identities</h3>
              <p className="text-slate-400">Manage identity providers linked to your user account for single sign-on</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#141624] border border-[#22273c] flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <GoogleLogo className="w-4 h-4" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">Google</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">✓ Connected (SSO)</span>
                  </div>
                </div>
                <button className="text-[11px] font-bold text-slate-400 hover:text-white">Manage</button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141624] border border-[#22273c] flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <MicrosoftLogo className="w-4 h-4" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">Microsoft</span>
                    <span className="text-[10px] text-slate-400 font-semibold">— Available to Link</span>
                  </div>
                </div>
                <button className="text-[11px] font-bold text-[#f5b82e] hover:underline">+ Link</button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141624] border border-[#22273c] flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <AppleLogo className="w-4 h-4" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">Apple</span>
                    <span className="text-[10px] text-slate-400 font-semibold">— Available to Link</span>
                  </div>
                </div>
                <button className="text-[11px] font-bold text-[#f5b82e] hover:underline">+ Link</button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141624] border border-[#22273c] flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <ZohoLogo className="w-5 h-3" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">Zoho</span>
                    <span className="text-[10px] text-slate-400 font-semibold">— Available to Link</span>
                  </div>
                </div>
                <button className="text-[11px] font-bold text-[#f5b82e] hover:underline">+ Link</button>
              </div>
            </div>
          </div>

          {/* Section 2: Connected Email Mailboxes */}
          <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#23273d] pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-display">Multi-Provider Connected Mailboxes</h3>
                <p className="text-slate-400">Persistent email outreach and IMAP synchronization connections</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#f5b82e]/10 text-[#f5b82e] font-bold border border-[#f5b82e]/30">
                Primary: Zoho (hello@amusemacstudio.in)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#141624] border border-[#22273c] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ZohoLogo className="w-5 h-3" />
                    <span className="font-bold text-white">Zoho Mail Enterprise</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400">ACTIVE / PRIMARY</span>
                </div>
                <p className="text-slate-400 font-mono">hello@amusemacstudio.in (smtppro.zoho.com:465 SSL)</p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">Mailbox Synced</span>
                  <button className="text-[11px] text-slate-400 hover:text-white font-bold">Disconnect</button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#141624] border border-[#22273c] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GoogleLogo className="w-4 h-4" />
                    <span className="font-bold text-white">Gmail / Google Workspace</span>
                  </div>
                  <button className="px-3 py-1 rounded-lg bg-[#1e2338] text-[#f5b82e] hover:bg-[#272d47] font-bold text-[11px]">
                    + Connect Gmail
                  </button>
                </div>
                <p className="text-slate-400">Connect Google Workspace OAuth for automated sending & replies</p>
              </div>

              <div className="p-4 rounded-xl bg-[#141624] border border-[#22273c] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MicrosoftLogo className="w-4 h-4" />
                    <span className="font-bold text-white">Outlook / Microsoft 365</span>
                  </div>
                  <button className="px-3 py-1 rounded-lg bg-[#1e2338] text-[#f5b82e] hover:bg-[#272d47] font-bold text-[11px]">
                    + Connect Outlook
                  </button>
                </div>
                <p className="text-slate-400">Connect Outlook/Office365 mailbox via Microsoft Graph</p>
              </div>

              <div className="p-4 rounded-xl bg-[#141624] border border-[#22273c] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Custom Email (SMTP / IMAP)</span>
                  <button className="px-3 py-1 rounded-lg bg-[#1e2338] text-[#f5b82e] hover:bg-[#272d47] font-bold text-[11px]">
                    + Setup SMTP
                  </button>
                </div>
                <p className="text-slate-400">Configure custom IMAP/SMTP credentials or App Passwords</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Notifications Panel */}
          <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-4 text-xs">
            <div className="border-b border-[#23273d] pb-3">
              <h3 className="text-base font-bold text-white font-display">WhatsApp Notifications & Alerts</h3>
              <p className="text-slate-400">Configure alert triggers sent to your verified user contact WhatsApp number</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="p-3 rounded-xl bg-[#141624] border border-[#22273c] flex items-center justify-between cursor-pointer">
                <span>🔥 Hot Lead Found</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#f5b82e]" />
              </label>

              <label className="p-3 rounded-xl bg-[#141624] border border-[#22273c] flex items-center justify-between cursor-pointer">
                <span>⚡ High Buying Signal</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#f5b82e]" />
              </label>

              <label className="p-3 rounded-xl bg-[#141624] border border-[#22273c] flex items-center justify-between cursor-pointer">
                <span>🎯 Decision Maker Found</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#f5b82e]" />
              </label>

              <label className="p-3 rounded-xl bg-[#141624] border border-[#22273c] flex items-center justify-between cursor-pointer">
                <span>📅 Follow-up Due</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#f5b82e]" />
              </label>

              <label className="p-3 rounded-xl bg-[#141624] border border-[#22273c] flex items-center justify-between cursor-pointer">
                <span>📩 Email Reply Received</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#f5b82e]" />
              </label>

              <label className="p-3 rounded-xl bg-[#141624] border border-[#22273c] flex items-center justify-between cursor-pointer">
                <span>⚠️ Usage Limit Warning</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#f5b82e]" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 1. Google Sheets Real Sync Tab */}
      {activeSettingsTab === 'sheets' && (
        <div className="space-y-6">
          {/* Status Indicators Grid */}
          <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-display text-white">Google Sheets Live Sync ("Amusemac Growth Leads")</h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time lead row appending and duplicate updating via Webhook</p>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-3.5 py-1 text-xs font-extrabold rounded-full border ${
                  syncStatus === 'Synced' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  syncStatus === 'Syncing' ? 'bg-[#f5b82e]/20 text-[#f5b82e] border-[#f5b82e]/40 animate-pulse' :
                  syncStatus === 'Connected' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                  'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  SYNC STATUS: {syncStatus.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#161826] border border-[#23273c]">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Connected Spreadsheet</span>
                <span className="font-bold text-white mt-1 block">Amusemac Growth Leads</span>
              </div>

              <div className="p-4 rounded-xl bg-[#161826] border border-[#23273c]">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Last Sync Time</span>
                <span className="font-bold text-[#f5b82e] font-mono mt-1 block">{lastSyncTime}</span>
              </div>

              <div className="p-4 rounded-xl bg-[#161826] border border-[#23273c]">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total CRM Leads</span>
                <span className="font-bold text-emerald-400 font-mono text-base mt-1 block">{leads.length}</span>
              </div>

              <div className="p-4 rounded-xl bg-[#161826] border border-[#23273c]">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Mapped Schema Fields</span>
                <span className="font-bold text-cyan-400 font-mono mt-1 block">23 Columns</span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleSyncAllNow}
                disabled={isSyncingSheets}
                className="btn-gold px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-[#f5b82e]/20 disabled:opacity-50"
              >
                <RefreshIcon className={`w-4 h-4 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                <span>{isSyncingSheets ? 'SYNCING TO GOOGLE SHEETS...' : 'SYNC NOW'}</span>
              </button>

              <button
                onClick={handleRunTestSync}
                disabled={isSyncingSheets}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1e2235] text-cyan-400 hover:bg-[#282d46] border border-cyan-500/30 flex items-center space-x-2 disabled:opacity-50"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>TEST SYNC (VERIFY WRITE)</span>
              </button>

              <button
                onClick={handleSyncAllNow}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1e2235] text-purple-400 hover:bg-[#282d46] border border-purple-500/30 flex items-center space-x-2"
              >
                <RefreshIcon className="w-4 h-4" />
                <span>RETRY FAILED SYNCS</span>
              </button>
            </div>
          </div>

          {/* Webhook Configuration Form */}
          <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <SheetIcon className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold font-display text-white">Google Apps Script Webhook Configuration</h3>
              </div>
              <button
                onClick={() => setShowCodeModal(true)}
                className="text-xs font-semibold text-[#f5b82e] hover:underline flex items-center space-x-1"
              >
                <CodeIcon className="w-3.5 h-3.5" />
                <span>Get Setup Code</span>
              </button>
            </div>

            <form onSubmit={handleSaveWebhook} className="space-y-4">
              <div className="space-y-1 text-xs">
                <label className="text-slate-400 font-semibold">Google Apps Script Webhook URL</label>
                <input
                  type="url"
                  value={webhookInput}
                  onChange={(e) => setWebhookInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full bg-[#151724] border border-[#2a2f47] text-white text-xs rounded-xl px-4 py-3 outline-none focus:border-[#f5b82e]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-400">
                  Deploy Webhook in Apps Script as Web App with access set to "Anyone".
                </p>
                <button type="submit" className="btn-gold px-5 py-2 rounded-xl text-xs font-bold">
                  Save Webhook URL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Zoho Mail Settings Tab */}
      {activeSettingsTab === 'email' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-display text-white">Zoho Mailbox Integration</h3>
                <p className="text-xs text-slate-400 mt-0.5">Connected Enterprise Mailbox: <strong className="text-[#f5b82e]">hello@amusemacstudio.in</strong></p>
              </div>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active System Mailbox
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#161826] border border-[#23273c]">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Connected Mailbox</span>
                <span className="font-bold text-white mt-1 block truncate">hello@amusemacstudio.in</span>
              </div>

              <div className="p-4 rounded-xl bg-[#161826] border border-[#23273c]">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Mail Provider</span>
                <span className="font-bold text-[#f5b82e] mt-1 block">Zoho Mail Enterprise</span>
              </div>

              <div className="p-4 rounded-xl bg-[#161826] border border-[#23273c]">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Outgoing SMTP</span>
                <span className="font-bold text-emerald-400 mt-1 block flex items-center space-x-1">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>smtppro.zoho.com:465 (SSL)</span>
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#161826] border border-[#23273c]">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Incoming IMAP</span>
                <span className="font-bold text-emerald-400 mt-1 block flex items-center space-x-1">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>imappro.zoho.com:993 (SSL)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Database Backup Tab */}
      {activeSettingsTab === 'backup' && (
        <div className="glass-card p-6 rounded-2xl border border-[#202436] space-y-5">
          <div className="flex items-center space-x-2">
            <DatabaseIcon className="w-5 h-5 text-[#f5b82e]" />
            <h3 className="text-base font-bold font-display text-white">CRM Database CSV Export & Backup</h3>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={() => downloadCsv(leads, `Amusemac_CRM_Full_Backup_${Date.now()}.csv`)}
              className="btn-gold px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2"
            >
              <DownloadIcon className="w-4 h-4" />
              <span>EXPORT FULL CSV BACKUP</span>
            </button>
          </div>
        </div>
      )}

      {/* Google Apps Script Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141622] border border-[#2c324a] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#24293e] pb-3">
              <h3 className="text-lg font-bold text-white font-display">1-Minute Google Sheets Webhook Setup</h3>
              <button onClick={() => setShowCodeModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <pre className="p-4 rounded-xl bg-[#0f111a] border border-[#24283c] text-[11px] text-[#f5b82e] font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
              {scriptCode}
            </pre>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button onClick={handleCopyScriptCode} className="btn-gold px-5 py-2 rounded-xl text-xs font-bold">
                {copiedCode ? 'COPIED!' : 'COPY CODE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
