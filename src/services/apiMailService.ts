import { EmailMessage, ZohoMailConfigStatus } from '../types/email';
import { Lead } from '../types/lead';

export async function fetchZohoMailStatus(): Promise<ZohoMailConfigStatus> {
  try {
    const res = await fetch('/api/mail/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch Zoho Mail status:', err);
  }

  return {
    email: 'hello@amusemacstudio.in',
    provider: 'Zoho Mail Enterprise',
    smtp: { host: 'smtppro.zoho.com', port: 465, connected: false, message: 'Server offline' },
    imap: { host: 'imappro.zoho.com', port: 993, connected: false, message: 'Server offline' }
  };
}

export async function sendZohoEmail(payload: {
  to: string;
  subject: string;
  body: string;
  leadId?: string;
  cc?: string;
  attachments?: any[];
}): Promise<{ success: boolean; message: string; email?: EmailMessage }> {
  try {
    const res = await fetch('/api/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      return await res.json();
    } else {
      return { success: false, message: `Server error (${res.status}) sending email.` };
    }
  } catch (err: any) {
    return { success: false, message: `Unable to send email: ${err?.message || 'Check connection'}` };
  }
}

export async function syncZohoInbox(leads: Lead[] = []): Promise<{
  success: boolean;
  message: string;
  syncedCount: number;
  newReplies?: EmailMessage[];
  logs?: EmailMessage[];
  diagnostics?: any;
}> {
  try {
    const res = await fetch('/api/mail/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.error('Inbox sync error:', err);
    return { success: false, message: `Unable to sync inbox: ${err?.message}`, syncedCount: 0 };
  }

  return { success: false, message: 'Unable to sync inbox. Backend server unavailable.', syncedCount: 0 };
}

export async function fetchEmailLogs(): Promise<EmailMessage[]> {
  try {
    const res = await fetch('/api/mail/logs');
    if (res.ok) {
      const data = await res.json();
      return data.logs || [];
    }
  } catch (err) {}
  return [];
}

export async function fetchLeadThread(leadId: string): Promise<EmailMessage[]> {
  try {
    const res = await fetch(`/api/mail/thread/${leadId}`);
    if (res.ok) {
      const data = await res.json();
      return data.thread || [];
    }
  } catch (err) {}
  return [];
}

export async function associateEmailToLead(emailId: string, leadId: string): Promise<{ success: boolean; email?: EmailMessage }> {
  try {
    const res = await fetch('/api/mail/associate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId, leadId })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}
  return { success: false };
}

export async function saveDraftEmail(payload: any): Promise<{ success: boolean; email?: EmailMessage }> {
  try {
    const res = await fetch('/api/mail/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}
  return { success: false };
}

export async function markEmailAsRead(emailId: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch('/api/mail/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}
  return { success: false };
}

export async function moveEmailToTrash(emailId: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch('/api/mail/trash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}
  return { success: false };
}

export async function sendTestEmail(testRecipient: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/mail/test-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testRecipient })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection error' };
  }
  return { success: false, message: 'Failed to send test email.' };
}
