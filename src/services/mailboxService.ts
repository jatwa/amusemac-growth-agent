import { MailboxConnection, EmailProviderType } from '../types/saas';

const MAILBOX_STORAGE_PREFIX = 'amusemac_mailboxes_';

export function getOrgMailboxes(orgId: string): MailboxConnection[] {
  try {
    const saved = localStorage.getItem(`${MAILBOX_STORAGE_PREFIX}${orgId}`);
    if (saved) return JSON.parse(saved);
  } catch (e) {}

  // Seed default Zoho mailbox connection for primary org
  if (orgId === 'amusemac-studio') {
    return [
      {
        connectionId: 'mbx-zoho-primary',
        orgId: 'amusemac-studio',
        userId: 'usr-amusemac-lead',
        provider: 'ZOHO',
        email: 'hello@amusemacstudio.in',
        status: 'CONNECTED',
        lastSyncedAt: new Date().toISOString(),
        isDefaultSender: true,
        hasSendPermission: true,
        hasReadPermission: true
      }
    ];
  }

  return [];
}

export function saveOrgMailboxes(orgId: string, connections: MailboxConnection[]): void {
  try {
    localStorage.setItem(`${MAILBOX_STORAGE_PREFIX}${orgId}`, JSON.stringify(connections));
  } catch (e) {}
}

export function addMailboxConnection(orgId: string, connection: Omit<MailboxConnection, 'connectionId'>): MailboxConnection {
  const existing = getOrgMailboxes(orgId);
  const newConn: MailboxConnection = {
    ...connection,
    connectionId: `mbx-${connection.provider.toLowerCase()}-${Date.now()}`
  };

  const updated = [...existing.filter(c => c.email !== connection.email), newConn];
  saveOrgMailboxes(orgId, updated);
  return newConn;
}

export function disconnectMailbox(orgId: string, connectionId: string): MailboxConnection[] {
  const existing = getOrgMailboxes(orgId);
  const updated = existing.filter(c => c.connectionId !== connectionId);
  saveOrgMailboxes(orgId, updated);
  return updated;
}
