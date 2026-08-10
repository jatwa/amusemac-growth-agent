export type EmailDirection = 'INBOUND' | 'OUTBOUND';
export type EmailStatus = 'PENDING' | 'SENDING' | 'SENT' | 'RECEIVED' | 'DRAFT' | 'TRASH' | 'FAILED';
export type ReadStatus = 'UNREAD' | 'READ';

export interface EmailAttachment {
  name: string;
  size: number;
  type: string;
}

export interface EmailMessage {
  emailId: string;
  leadId: string | null;
  direction: EmailDirection;
  from: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  timestamp: string; // ISO String
  status: EmailStatus;
  readStatus: ReadStatus;
  messageId: string;
  threadId: string;
  deliveryStatus?: string;
  provider: string; // "Zoho Mail"
  autoMatched?: boolean;
  attachments?: EmailAttachment[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
}

export interface ZohoMailConfigStatus {
  email: string;
  provider: string;
  smtp: {
    host: string;
    port: string | number;
    connected: boolean;
    message: string;
  };
  imap: {
    host: string;
    port: string | number;
    connected: boolean;
    message: string;
  };
}
