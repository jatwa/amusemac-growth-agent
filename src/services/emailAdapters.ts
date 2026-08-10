import { OrganizationEmailConfig, EmailProviderType } from '../types/saas';
import { API_URL } from '../config/env';

export interface EmailSendOptions {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  leadId?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: EmailProviderType;
  senderEmail: string;
}

export interface EmailAdapter {
  provider: EmailProviderType;
  sendEmail(config: OrganizationEmailConfig, options: EmailSendOptions): Promise<EmailSendResult>;
  syncInbox(config: OrganizationEmailConfig): Promise<{ success: boolean; count: number }>;
}

export class ZohoEmailAdapter implements EmailAdapter {
  provider: EmailProviderType = 'ZOHO';

  async sendEmail(config: OrganizationEmailConfig, options: EmailSendOptions): Promise<EmailSendResult> {
    try {
      const response = await fetch(`${API_URL}/api/mail/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          body: options.body,
          cc: options.cc,
          bcc: options.bcc,
          leadId: options.leadId
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        return {
          success: true,
          messageId: data.messageId || `ZOHO-MSG-${Date.now()}`,
          provider: 'ZOHO',
          senderEmail: config.email
        };
      }
      return {
        success: false,
        error: data.error || 'Zoho SMTP error',
        provider: 'ZOHO',
        senderEmail: config.email
      };
    } catch (e: any) {
      return {
        success: false,
        error: e.message || `Failed to reach Zoho backend on ${API_URL}`,
        provider: 'ZOHO',
        senderEmail: config.email
      };
    }
  }

  async syncInbox(config: OrganizationEmailConfig): Promise<{ success: boolean; count: number }> {
    try {
      const res = await fetch(`${API_URL}/api/mail/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: [] })
      });
      const data = await res.json();
      return { success: res.ok, count: data.syncedCount || 0 };
    } catch (e) {
      return { success: false, count: 0 };
    }
  }
}

export class GmailEmailAdapter implements EmailAdapter {
  provider: EmailProviderType = 'GMAIL';

  async sendEmail(config: OrganizationEmailConfig, options: EmailSendOptions): Promise<EmailSendResult> {
    await new Promise(r => setTimeout(r, 400));
    return {
      success: true,
      messageId: `GMAIL-MSG-${Date.now()}`,
      provider: 'GMAIL',
      senderEmail: config.email
    };
  }

  async syncInbox(config: OrganizationEmailConfig): Promise<{ success: boolean; count: number }> {
    return { success: true, count: 0 };
  }
}

export class MicrosoftEmailAdapter implements EmailAdapter {
  provider: EmailProviderType = 'MICROSOFT';

  async sendEmail(config: OrganizationEmailConfig, options: EmailSendOptions): Promise<EmailSendResult> {
    await new Promise(r => setTimeout(r, 400));
    return {
      success: true,
      messageId: `MS-MSG-${Date.now()}`,
      provider: 'MICROSOFT',
      senderEmail: config.email
    };
  }

  async syncInbox(config: OrganizationEmailConfig): Promise<{ success: boolean; count: number }> {
    return { success: true, count: 0 };
  }
}

export class CustomSmtpAdapter implements EmailAdapter {
  provider: EmailProviderType = 'CUSTOM_SMTP';

  async sendEmail(config: OrganizationEmailConfig, options: EmailSendOptions): Promise<EmailSendResult> {
    await new Promise(r => setTimeout(r, 400));
    return {
      success: true,
      messageId: `SMTP-MSG-${Date.now()}`,
      provider: 'CUSTOM_SMTP',
      senderEmail: config.email
    };
  }

  async syncInbox(config: OrganizationEmailConfig): Promise<{ success: boolean; count: number }> {
    return { success: true, count: 0 };
  }
}

export function getEmailAdapter(provider: EmailProviderType): EmailAdapter {
  switch (provider) {
    case 'ZOHO':
      return new ZohoEmailAdapter();
    case 'GMAIL':
      return new GmailEmailAdapter();
    case 'MICROSOFT':
      return new MicrosoftEmailAdapter();
    case 'CUSTOM_SMTP':
    default:
      return new CustomSmtpAdapter();
  }
}
