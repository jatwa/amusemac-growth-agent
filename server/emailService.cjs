const nodemailer = require('nodemailer');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const { getEmails, getEmailById, upsertEmail, deleteEmail, getLeads } = require('./dbStore.cjs');
require('dotenv').config();

// Ensure initial seed data exists in dbStore if dbStore emails is empty
function initializeEmailStore() {
  const existing = getEmails('amusemac-studio');
  if (existing.length === 0) {
    const seed1 = {
      emailId: 'EML-1001',
      leadId: 'AMU-NEED-201',
      direction: 'OUTBOUND',
      from: process.env.ZOHO_EMAIL || 'hello@amusemacstudio.in',
      to: 'info@imaginemarketingindia.com',
      cc: '',
      subject: 'Regarding Boat Lifestyle\'s Q4 Festive Audio Launch DVC Shoot — Production Proposal',
      body: 'Hi Aman,\n\nI saw Boat Lifestyle\'s active vendor call regarding the "Q4 Festive Audio Launch DVC Shoot" and your requirement for Commercial/Ad Film Line Production & Set Design...\n\nBest regards,\nAmusemac Studio',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: 'SENT',
      folder: 'Sent',
      originalFolder: 'Sent',
      readStatus: 'READ',
      messageId: '<msg-1001@amusemacstudio.in>',
      threadId: 'THREAD-AMU-NEED-201',
      deliveryStatus: 'ACCEPTED_BY_SMTP',
      provider: 'Zoho Mail',
      attachments: []
    };
    const seed2 = {
      emailId: 'EML-1002',
      leadId: 'AMU-NEED-201',
      direction: 'INBOUND',
      from: 'info@imaginemarketingindia.com',
      to: process.env.ZOHO_EMAIL || 'hello@amusemacstudio.in',
      cc: '',
      subject: 'Re: Regarding Boat Lifestyle\'s Q4 Festive Audio Launch DVC Shoot — Production Proposal',
      body: 'Hi Amusemac Team,\n\nThanks for reaching out. We are indeed reviewing line production proposals for our Q4 shoot in Mumbai. Could you share your rate card and set design portfolio deck?\n\nBest,\nAman Gupta',
      timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
      status: 'RECEIVED',
      folder: 'INBOX',
      originalFolder: 'INBOX',
      readStatus: 'UNREAD',
      messageId: '<reply-1002@boat-lifestyle.com>',
      threadId: 'THREAD-AMU-NEED-201',
      deliveryStatus: 'DELIVERED',
      provider: 'Zoho Mail',
      autoMatched: true,
      attachments: []
    };
    upsertEmail('amusemac-studio', seed1);
    upsertEmail('amusemac-studio', seed2);
  }
}

initializeEmailStore();

function createSmtpTransporter() {
  const host = process.env.ZOHO_SMTP_HOST || 'smtppro.zoho.com';
  const port = parseInt(process.env.ZOHO_SMTP_PORT || '465', 10);
  const secure = process.env.ZOHO_SMTP_SECURE !== 'false';
  const user = process.env.ZOHO_SMTP_USER || process.env.ZOHO_EMAIL || 'hello@amusemacstudio.in';
  const pass = process.env.ZOHO_SMTP_PASSWORD || '';

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
}

function getImapClient() {
  const host = process.env.ZOHO_IMAP_HOST || 'imappro.zoho.com';
  const port = parseInt(process.env.ZOHO_IMAP_PORT || '993', 10);
  const secure = process.env.ZOHO_IMAP_SECURE !== 'false';
  const user = process.env.ZOHO_IMAP_USER || process.env.ZOHO_EMAIL || 'hello@amusemacstudio.in';
  const pass = process.env.ZOHO_IMAP_PASSWORD || '';

  if (!pass || pass === 'your_zoho_app_password_here' || pass.trim() === '') {
    return null;
  }

  return new ImapFlow({
    host,
    port,
    secure,
    auth: { user, pass },
    logger: false
  });
}

async function verifySmtpConnection() {
  const pass = process.env.ZOHO_SMTP_PASSWORD;
  if (!pass || pass === 'your_zoho_app_password_here' || pass.trim() === '') {
    return {
      success: false,
      message: 'Zoho Mail credentials are not configured.'
    };
  }

  try {
    const transporter = createSmtpTransporter();
    await transporter.verify();
    return {
      success: true,
      message: 'Zoho SMTP Connected Successfully (smtppro.zoho.com:465)'
    };
  } catch (err) {
    console.error('[Zoho SMTP Error]', err.message);
    return {
      success: false,
      message: `Zoho SMTP authentication failed. Check credentials.`
    };
  }
}

async function verifyImapConnection() {
  const client = getImapClient();
  if (!client) {
    return {
      success: false,
      message: 'Zoho Mail credentials are not configured.'
    };
  }

  try {
    await client.connect();
    let lock = await client.getMailboxLock('INBOX');
    const totalMessages = client.mailbox ? client.mailbox.exists : 0;
    lock.release();
    await client.logout();

    return {
      success: true,
      message: `Zoho IMAP Connected Successfully (imappro.zoho.com:993). INBOX contains ${totalMessages} message(s).`
    };
  } catch (err) {
    console.error('[Zoho IMAP Error]', err.message);
    return {
      success: false,
      message: 'Zoho IMAP authentication failed. Check Zoho App Password.'
    };
  }
}

async function sendEmail({ to, subject, body, leadId, cc = '', attachments = [] }) {
  const from = process.env.ZOHO_EMAIL || 'hello@amusemacstudio.in';
  const pass = process.env.ZOHO_SMTP_PASSWORD;

  const emailId = `EML-${Date.now()}`;
  const threadId = leadId ? `THREAD-${leadId}` : `THREAD-${Date.now()}`;

  const logRecord = {
    emailId,
    leadId: leadId || null,
    direction: 'OUTBOUND',
    from,
    to,
    cc,
    subject,
    body,
    timestamp: new Date().toISOString(),
    status: 'PENDING',
    folder: 'Sent',
    originalFolder: 'Sent',
    readStatus: 'READ',
    messageId: `<${emailId}@amusemacstudio.in>`,
    threadId,
    deliveryStatus: 'PENDING',
    provider: 'Zoho Mail',
    attachments
  };

  if (!pass || pass === 'your_zoho_app_password_here' || pass.trim() === '') {
    logRecord.status = 'FAILED';
    logRecord.deliveryStatus = 'MISSING_CREDENTIALS';
    upsertEmail('amusemac-studio', logRecord);

    return {
      success: false,
      message: 'Zoho Mail credentials are not configured.',
      email: logRecord
    };
  }

  try {
    const transporter = createSmtpTransporter();
    const info = await transporter.sendMail({
      from: `"Amusemac Studio" <${from}>`,
      to,
      cc: cc || undefined,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br/>')
    });

    logRecord.status = 'SENT';
    logRecord.deliveryStatus = 'ACCEPTED_BY_SMTP';
    logRecord.messageId = info.messageId || logRecord.messageId;
    upsertEmail('amusemac-studio', logRecord);

    return {
      success: true,
      message: 'Email sent successfully through Zoho Mail.',
      messageId: info.messageId,
      accepted: info.accepted,
      email: logRecord
    };
  } catch (err) {
    console.error('[Zoho SMTP Send Error]', err.message);
    logRecord.status = 'FAILED';
    logRecord.deliveryStatus = err.message;
    upsertEmail('amusemac-studio', logRecord);

    return {
      success: false,
      message: `Unable to send email via Zoho SMTP: ${err.message}`,
      email: logRecord
    };
  }
}

/**
 * Real IMAP Mailbox Sync across folders: INBOX, Sent, Drafts, Trash
 */
async function syncInbox(crmLeadsInput = []) {
  const client = getImapClient();
  if (!client) {
    return {
      success: false,
      message: 'Zoho Mail credentials are not configured.',
      syncedCount: 0,
      newReplies: [],
      logs: getEmails('amusemac-studio')
    };
  }

  const allCrmLeads = crmLeadsInput.length > 0 ? crmLeadsInput : getLeads('amusemac-studio');

  const diagnostics = {
    imapConnected: false,
    foldersProcessed: [],
    messagesFound: 0,
    messagesFetched: 0,
    newMessagesSaved: 0,
    duplicatesSkipped: 0
  };

  const newFetchedEmails = [];
  const syncedRemoteMessageIds = new Set();

  try {
    await client.connect();
    diagnostics.imapConnected = true;

    // Folders to sync from Zoho IMAP
    const targetFolders = [
      { name: 'INBOX', folderType: 'INBOX', defaultDirection: 'INBOUND', defaultStatus: 'RECEIVED' },
      { name: 'Sent', folderType: 'Sent', defaultDirection: 'OUTBOUND', defaultStatus: 'SENT' },
      { name: 'Drafts', folderType: 'Drafts', defaultDirection: 'OUTBOUND', defaultStatus: 'DRAFT' },
      { name: 'Trash', folderType: 'Trash', defaultDirection: 'INBOUND', defaultStatus: 'TRASH' }
    ];

    for (const fTarget of targetFolders) {
      try {
        let lock = await client.getMailboxLock(fTarget.name);
        const folderMsgCount = client.mailbox ? client.mailbox.exists : 0;
        diagnostics.foldersProcessed.push({ name: fTarget.name, count: folderMsgCount });
        diagnostics.messagesFound += folderMsgCount;

        if (folderMsgCount > 0) {
          // Fetch 20 most recent messages per folder for optimal performance
          const fetchStart = Math.max(1, folderMsgCount - 19);
          const rangeSequence = `${fetchStart}:${folderMsgCount}`;

          for await (let message of client.fetch(rangeSequence, { envelope: true, bodyStructure: true, flags: true, uid: true })) {
            diagnostics.messagesFetched++;

            let senderEmail = '';
            if (message.envelope && message.envelope.from && message.envelope.from[0] && message.envelope.from[0].address) {
              senderEmail = message.envelope.from[0].address.trim().toLowerCase();
            }

            let recipientEmail = '';
            if (message.envelope && message.envelope.to && message.envelope.to[0] && message.envelope.to[0].address) {
              recipientEmail = message.envelope.to[0].address.trim().toLowerCase();
            }

            const rawMessageId = (message.envelope && message.envelope.messageId) || `IMAP-${fTarget.name}-${message.uid}`;
            const messageIdStr = rawMessageId.trim();
            syncedRemoteMessageIds.add(messageIdStr);

            const subjectStr = message.envelope ? message.envelope.subject || '(No Subject)' : '(No Subject)';
            const dateVal = message.envelope ? message.envelope.date : new Date();
            const receivedAtIso = dateVal ? new Date(dateVal).toISOString() : new Date().toISOString();
            const isSeen = message.flags ? message.flags.has('\\Seen') : false;
            const bodyStr = `Message from ${senderEmail} to ${recipientEmail}.\nSubject: ${subjectStr}`;

            // CRM Lead Auto Matching
            let matchedLead = null;
            const targetEmailToMatch = fTarget.defaultDirection === 'INBOUND' ? senderEmail : recipientEmail;
            if (targetEmailToMatch) {
              matchedLead = allCrmLeads.find(l => {
                const leadEmail = (l.email || l.contact_email || '').trim().toLowerCase();
                return leadEmail && leadEmail !== 'not found' && (leadEmail === targetEmailToMatch || targetEmailToMatch.includes(leadEmail));
              });
            }

            // Check existing local record
            const existingRecord = getEmailById('amusemac-studio', messageIdStr);
            const status = fTarget.defaultStatus;
            const folder = fTarget.name;

            const record = {
              ...(existingRecord || {}),
              emailId: existingRecord?.emailId || `EML-${fTarget.name}-${message.uid}`,
              leadId: existingRecord?.leadId || (matchedLead ? (matchedLead.leadId || matchedLead.lead_id) : null),
              direction: existingRecord?.direction || fTarget.defaultDirection,
              from: senderEmail || process.env.ZOHO_EMAIL || 'hello@amusemacstudio.in',
              to: recipientEmail || 'client@example.com',
              cc: existingRecord?.cc || '',
              subject: subjectStr,
              body: bodyStr,
              timestamp: receivedAtIso,
              status: existingRecord?.status === 'TRASH' && fTarget.name !== 'Trash' ? 'TRASH' : status,
              folder: folder,
              originalFolder: existingRecord?.originalFolder || (fTarget.name !== 'Trash' ? fTarget.name : 'INBOX'),
              readStatus: isSeen ? 'READ' : 'UNREAD',
              messageId: messageIdStr,
              imapUid: message.uid,
              threadId: existingRecord?.threadId || (matchedLead ? `THREAD-${matchedLead.leadId || matchedLead.lead_id}` : `THREAD-${messageIdStr}`),
              deliveryStatus: fTarget.defaultDirection === 'OUTBOUND' ? 'SENT' : 'DELIVERED',
              provider: 'Zoho Mail',
              autoMatched: Boolean(matchedLead || existingRecord?.autoMatched),
              attachments: existingRecord?.attachments || []
            };

            upsertEmail('amusemac-studio', record);

            if (!existingRecord) {
              newFetchedEmails.push(record);
              diagnostics.newMessagesSaved++;
            } else {
              diagnostics.duplicatesSkipped++;
            }
          }
        }

        lock.release();
      } catch (fErr) {
        console.error(`[IMAP Sync Error in folder ${fTarget.name}]`, fErr.message);
      }
    }

    await client.logout();

    // Remove locally cached emails that were permanently expunged from Zoho IMAP
    // (Only prune emails marked as synced from Zoho, keeping local un-synced drafts/sent logs)
    const localEmails = getEmails('amusemac-studio');
    for (const locE of localEmails) {
      if (locE.imapUid && locE.messageId && !syncedRemoteMessageIds.has(locE.messageId)) {
        // Message was deleted permanently from Zoho server!
        deleteEmail('amusemac-studio', locE.emailId);
      }
    }

    const updatedLogs = getEmails('amusemac-studio');

    return {
      success: true,
      message: `Zoho IMAP Mailbox Sync Complete. Processed ${diagnostics.foldersProcessed.length} folder(s). Messages Found: ${diagnostics.messagesFound}, Fetched: ${diagnostics.messagesFetched}, New Saved: ${diagnostics.newMessagesSaved}.`,
      syncedCount: diagnostics.newMessagesSaved,
      newReplies: newFetchedEmails,
      logs: updatedLogs,
      diagnostics
    };

  } catch (err) {
    console.error('[Zoho IMAP Sync Failure]', err);
    return {
      success: false,
      message: `Unable to sync Zoho IMAP mailbox: ${err.message}`,
      syncedCount: 0,
      logs: getEmails('amusemac-studio'),
      diagnostics
    };
  }
}

function saveDraft(draftPayload) {
  const emailId = draftPayload.emailId || `DRAFT-${Date.now()}`;
  const draftRecord = {
    emailId,
    leadId: draftPayload.leadId || null,
    direction: 'OUTBOUND',
    from: process.env.ZOHO_EMAIL || 'hello@amusemacstudio.in',
    to: draftPayload.to || '',
    cc: draftPayload.cc || '',
    subject: draftPayload.subject || '(No Subject)',
    body: draftPayload.body || '',
    timestamp: new Date().toISOString(),
    status: 'DRAFT',
    folder: 'Drafts',
    originalFolder: 'Drafts',
    readStatus: 'READ',
    messageId: `<draft-${Date.now()}@amusemacstudio.in>`,
    threadId: draftPayload.leadId ? `THREAD-${draftPayload.leadId}` : `DRAFT-${Date.now()}`,
    deliveryStatus: 'DRAFT',
    provider: 'Zoho Mail',
    attachments: draftPayload.attachments || []
  };

  const saved = upsertEmail('amusemac-studio', draftRecord);
  return { success: true, email: saved };
}

async function markAsRead(emailId, readState = true) {
  const email = getEmailById('amusemac-studio', emailId);
  if (!email) {
    return { success: false, message: 'Message not found' };
  }

  email.readStatus = readState ? 'READ' : 'UNREAD';
  upsertEmail('amusemac-studio', email);

  // Sync flag to Zoho IMAP if client available
  const client = getImapClient();
  if (client && email.imapUid && email.folder) {
    try {
      await client.connect();
      let lock = await client.getMailboxLock(email.folder || 'INBOX');
      if (readState) {
        await client.messageFlagsAdd({ uid: email.imapUid }, ['\\Seen'], { uid: true });
      } else {
        await client.messageFlagsRemove({ uid: email.imapUid }, ['\\Seen'], { uid: true });
      }
      lock.release();
      await client.logout();
    } catch (err) {
      console.error('[IMAP MarkRead Error]', err.message);
    }
  }

  return { success: true, email };
}

async function moveToTrash(emailId) {
  const email = getEmailById('amusemac-studio', emailId);
  if (!email) {
    return { success: false, message: 'Message not found' };
  }

  const oldFolder = email.folder || 'INBOX';
  email.originalFolder = oldFolder !== 'Trash' ? oldFolder : email.originalFolder || 'INBOX';
  email.status = 'TRASH';
  email.folder = 'Trash';
  upsertEmail('amusemac-studio', email);

  // Move message on Zoho IMAP if available
  const client = getImapClient();
  if (client && email.imapUid && oldFolder !== 'Trash') {
    try {
      await client.connect();
      let lock = await client.getMailboxLock(oldFolder);
      await client.messageMove({ uid: email.imapUid }, 'Trash', { uid: true });
      lock.release();
      await client.logout();
    } catch (err) {
      console.error('[IMAP MoveToTrash Error]', err.message);
    }
  }

  return { success: true, email };
}

async function restoreFromTrash(emailId) {
  const email = getEmailById('amusemac-studio', emailId);
  if (!email) {
    return { success: false, message: 'Message not found' };
  }

  const targetFolder = email.originalFolder || (email.direction === 'OUTBOUND' ? 'Sent' : 'INBOX');
  email.status = email.direction === 'OUTBOUND' ? 'SENT' : 'RECEIVED';
  email.folder = targetFolder;
  upsertEmail('amusemac-studio', email);

  // Restore on Zoho IMAP if available
  const client = getImapClient();
  if (client && email.imapUid) {
    try {
      await client.connect();
      let lock = await client.getMailboxLock('Trash');
      await client.messageMove({ uid: email.imapUid }, targetFolder, { uid: true });
      lock.release();
      await client.logout();
    } catch (err) {
      console.error('[IMAP RestoreFromTrash Error]', err.message);
    }
  }

  return { success: true, email };
}

/**
 * Permanently deletes email from Zoho IMAP and local database
 */
async function deletePermanently(emailId) {
  const email = getEmailById('amusemac-studio', emailId);
  const targetFolder = email ? (email.folder || 'Trash') : 'Trash';

  // 1. Delete permanently from Zoho IMAP server
  const client = getImapClient();
  if (client) {
    try {
      await client.connect();
      let lock = await client.getMailboxLock(targetFolder);
      if (email && email.imapUid) {
        await client.messageDelete({ uid: email.imapUid }, { uid: true });
      }
      lock.release();
      await client.logout();
    } catch (err) {
      console.error('[IMAP PermanentDelete Error]', err.message);
    }
  }

  // 2. Permanently remove from dbStore and memory
  deleteEmail('amusemac-studio', emailId);

  return {
    success: true,
    message: 'Message permanently deleted from Zoho mailbox and database.'
  };
}

async function bulkPerformMailAction({ emailIds = [], action }) {
  if (!Array.isArray(emailIds) || emailIds.length === 0) {
    return { success: false, message: 'No emails provided for bulk action.' };
  }

  const results = [];
  for (const id of emailIds) {
    if (action === 'markRead') {
      results.push(await markAsRead(id, true));
    } else if (action === 'markUnread') {
      results.push(await markAsRead(id, false));
    } else if (action === 'trash') {
      results.push(await moveToTrash(id));
    } else if (action === 'restore') {
      results.push(await restoreFromTrash(id));
    } else if (action === 'permanentDelete') {
      results.push(await deletePermanently(id));
    }
  }

  return {
    success: true,
    action,
    processedCount: results.length,
    logs: getEmails('amusemac-studio')
  };
}

function getThreadByLeadId(leadId) {
  const all = getEmails('amusemac-studio');
  return all
    .filter(e => e.leadId === leadId && e.status !== 'TRASH')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function associateEmailWithLead(emailId, leadId) {
  const email = getEmailById('amusemac-studio', emailId);
  if (email) {
    email.leadId = leadId;
    email.threadId = `THREAD-${leadId}`;
    email.autoMatched = true;
    upsertEmail('amusemac-studio', email);
    return { success: true, email };
  }
  return { success: false, message: 'Email ID not found.' };
}

function getAllEmailLogs() {
  return getEmails('amusemac-studio');
}

module.exports = {
  verifySmtpConnection,
  verifyImapConnection,
  sendEmail,
  syncInbox,
  saveDraft,
  markAsRead,
  moveToTrash,
  restoreFromTrash,
  deletePermanently,
  bulkPerformMailAction,
  getThreadByLeadId,
  associateEmailWithLead,
  getAllEmailLogs
};
