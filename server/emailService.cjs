const nodemailer = require('nodemailer');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
require('dotenv').config();

let emailLogsStore = [
  {
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
    readStatus: 'READ',
    messageId: '<msg-1001@amusemacstudio.in>',
    threadId: 'THREAD-AMU-NEED-201',
    deliveryStatus: 'ACCEPTED_BY_SMTP',
    provider: 'Zoho Mail',
    attachments: []
  },
  {
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
    readStatus: 'UNREAD',
    messageId: '<reply-1002@boat-lifestyle.com>',
    threadId: 'THREAD-AMU-NEED-201',
    deliveryStatus: 'DELIVERED',
    provider: 'Zoho Mail',
    autoMatched: true,
    attachments: []
  }
];

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
    if (err.message.includes('554 5.7.8') || err.message.includes('Invalid login') || err.message.includes('Authentication Failed')) {
      return {
        success: false,
        message: 'Zoho SMTP authentication failed. Check the Zoho App Password and Email Access settings.'
      };
    }
    return {
      success: false,
      message: `Zoho SMTP Error: ${err.message}`
    };
  }
}

async function verifyImapConnection() {
  const host = process.env.ZOHO_IMAP_HOST || 'imappro.zoho.com';
  const port = parseInt(process.env.ZOHO_IMAP_PORT || '993', 10);
  const secure = process.env.ZOHO_IMAP_SECURE !== 'false';
  const user = process.env.ZOHO_IMAP_USER || process.env.ZOHO_EMAIL || 'hello@amusemacstudio.in';
  const pass = process.env.ZOHO_IMAP_PASSWORD || '';

  if (!pass || pass === 'your_zoho_app_password_here' || pass.trim() === '') {
    return {
      success: false,
      message: 'Zoho Mail credentials are not configured.'
    };
  }

  const client = new ImapFlow({
    host,
    port,
    secure,
    auth: { user, pass },
    logger: false
  });

  try {
    await client.connect();
    let lock = await client.getMailboxLock('INBOX');
    const totalMessages = lock.mailbox ? lock.mailbox.exists : 0;
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
      message: 'Zoho IMAP authentication failed. Check the Zoho App Password and IMAP Access settings.'
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
    emailLogsStore.unshift(logRecord);

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
    emailLogsStore.unshift(logRecord);

    return {
      success: true,
      message: 'Test email sent successfully through Zoho Mail.',
      messageId: info.messageId,
      accepted: info.accepted,
      email: logRecord
    };
  } catch (err) {
    console.error('[Zoho SMTP Send Error]', err.message);
    logRecord.status = 'FAILED';
    logRecord.deliveryStatus = err.message;
    emailLogsStore.unshift(logRecord);

    let errMsg = `Unable to send email via Zoho SMTP: ${err.message}`;
    if (err.message.includes('554 5.7.8') || err.message.includes('Invalid login') || err.message.includes('Authentication Failed')) {
      errMsg = 'Zoho SMTP authentication failed. Check the Zoho App Password and Email Access settings.';
    }

    return {
      success: false,
      message: errMsg,
      email: logRecord
    };
  }
}

async function syncInbox(crmLeads = []) {
  const host = process.env.ZOHO_IMAP_HOST || 'imappro.zoho.com';
  const port = parseInt(process.env.ZOHO_IMAP_PORT || '993', 10);
  const secure = process.env.ZOHO_IMAP_SECURE !== 'false';
  const user = process.env.ZOHO_IMAP_USER || process.env.ZOHO_EMAIL || 'hello@amusemacstudio.in';
  const pass = process.env.ZOHO_IMAP_PASSWORD || '';

  if (!pass || pass === 'your_zoho_app_password_here' || pass.trim() === '') {
    return {
      success: false,
      message: 'Zoho Mail credentials are not configured.',
      syncedCount: 0,
      newReplies: [],
      logs: emailLogsStore
    };
  }

  const client = new ImapFlow({
    host,
    port,
    secure,
    auth: { user, pass },
    logger: false
  });

  const diagnostics = {
    imapConnected: false,
    selectedFolder: 'INBOX',
    messagesFound: 0,
    messagesFetched: 0,
    newMessagesSaved: 0,
    duplicatesSkipped: 0
  };

  const newFetchedEmails = [];

  try {
    await client.connect();
    diagnostics.imapConnected = true;

    let lock = await client.getMailboxLock('INBOX');
    diagnostics.selectedFolder = lock.mailbox ? lock.mailbox.path : 'INBOX';
    diagnostics.messagesFound = lock.mailbox ? lock.mailbox.exists : 0;

    if (diagnostics.messagesFound > 0) {
      const fetchStart = Math.max(1, diagnostics.messagesFound - 99);
      const rangeSequence = `${fetchStart}:${diagnostics.messagesFound}`;

      for await (let message of client.fetch(rangeSequence, { envelope: true, source: true, flags: true })) {
        diagnostics.messagesFetched++;

        let parsed;
        try {
          parsed = await simpleParser(message.source);
        } catch (parseErr) {
          parsed = {};
        }

        let senderEmail = '';
        if (parsed.from && parsed.from.value && parsed.from.value[0] && parsed.from.value[0].address) {
          senderEmail = parsed.from.value[0].address.trim().toLowerCase();
        } else if (message.envelope && message.envelope.from && message.envelope.from[0] && message.envelope.from[0].address) {
          senderEmail = message.envelope.from[0].address.trim().toLowerCase();
        }

        const rawMessageId = (message.envelope && message.envelope.messageId) || (parsed.messageId) || `IMAP-UID-${message.uid}`;
        const messageIdStr = rawMessageId.trim();

        const isDuplicate = emailLogsStore.some(l => l.messageId === messageIdStr || (l.timestamp === (parsed.date ? parsed.date.toISOString() : '') && l.from === senderEmail));

        if (isDuplicate) {
          diagnostics.duplicatesSkipped++;
          continue;
        }

        const ccStr = parsed.cc && parsed.cc.text ? parsed.cc.text : '';
        const subjectStr = parsed.subject || message.envelope.subject || 'No Subject';
        const bodyStr = parsed.text || (parsed.html ? parsed.html.replace(/<[^>]+>/g, '') : '') || '';
        const receivedAtIso = parsed.date ? parsed.date.toISOString() : new Date().toISOString();

        let matchedLead = null;
        if (senderEmail) {
          matchedLead = crmLeads.find(l => {
            const leadEmail = l.email ? l.email.trim().toLowerCase() : '';
            return leadEmail && leadEmail !== 'not found' && (leadEmail === senderEmail || senderEmail.includes(leadEmail));
          });
        }

        const isSeen = message.flags ? message.flags.has('\\Seen') : false;

        const inboundRecord = {
          emailId: `EML-IN-${message.uid}-${Date.now()}`,
          leadId: matchedLead ? matchedLead.leadId : null,
          direction: 'INBOUND',
          from: senderEmail || 'unknown@client.com',
          to: user,
          cc: ccStr,
          subject: subjectStr,
          body: bodyStr,
          timestamp: receivedAtIso,
          status: 'RECEIVED',
          readStatus: isSeen ? 'READ' : 'UNREAD',
          messageId: messageIdStr,
          threadId: matchedLead ? `THREAD-${matchedLead.leadId}` : `UNASSIGNED-${message.uid}-${Date.now()}`,
          deliveryStatus: 'DELIVERED',
          provider: 'Zoho Mail',
          autoMatched: Boolean(matchedLead),
          attachments: (parsed.attachments || []).map(a => ({
            name: a.filename || 'attachment',
            size: a.size || 0,
            type: a.contentType || 'file'
          }))
        };

        emailLogsStore.unshift(inboundRecord);
        newFetchedEmails.push(inboundRecord);
        diagnostics.newMessagesSaved++;
      }
    }

    lock.release();
    await client.logout();

    return {
      success: true,
      message: `Real Zoho IMAP Sync Complete (${diagnostics.selectedFolder}). Messages Found: ${diagnostics.messagesFound}, Fetched: ${diagnostics.messagesFetched}, New Saved: ${diagnostics.newMessagesSaved}, Duplicates Skipped: ${diagnostics.duplicatesSkipped}.`,
      syncedCount: diagnostics.newMessagesSaved,
      newReplies: newFetchedEmails,
      logs: emailLogsStore,
      diagnostics
    };

  } catch (err) {
    console.error('[Zoho IMAP Sync Failure]', err);
    return {
      success: false,
      message: `Zoho IMAP authentication failed. Check the Zoho App Password and IMAP Access settings. (${err.message})`,
      syncedCount: 0,
      logs: emailLogsStore,
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
    readStatus: 'READ',
    messageId: `<draft-${Date.now()}@amusemacstudio.in>`,
    threadId: draftPayload.leadId ? `THREAD-${draftPayload.leadId}` : `DRAFT-${Date.now()}`,
    deliveryStatus: 'DRAFT',
    provider: 'Zoho Mail',
    attachments: draftPayload.attachments || []
  };

  const existingIdx = emailLogsStore.findIndex(e => e.emailId === emailId);
  if (existingIdx >= 0) {
    emailLogsStore[existingIdx] = draftRecord;
  } else {
    emailLogsStore.unshift(draftRecord);
  }

  return { success: true, email: draftRecord };
}

function markAsRead(emailId) {
  const msg = emailLogsStore.find(e => e.emailId === emailId);
  if (msg) {
    msg.readStatus = 'READ';
    return { success: true, email: msg };
  }
  return { success: false, message: 'Message not found' };
}

function moveToTrash(emailId) {
  const msg = emailLogsStore.find(e => e.emailId === emailId);
  if (msg) {
    msg.status = 'TRASH';
    return { success: true, email: msg };
  }
  return { success: false, message: 'Message not found' };
}

function getThreadByLeadId(leadId) {
  return emailLogsStore
    .filter(e => e.leadId === leadId && e.status !== 'TRASH')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function associateEmailWithLead(emailId, leadId) {
  const email = emailLogsStore.find(e => e.emailId === emailId);
  if (email) {
    email.leadId = leadId;
    email.threadId = `THREAD-${leadId}`;
    email.autoMatched = true;
    return { success: true, email };
  }
  return { success: false, message: 'Email ID not found.' };
}

function getAllEmailLogs() {
  return emailLogsStore;
}

module.exports = {
  verifySmtpConnection,
  verifyImapConnection,
  sendEmail,
  syncInbox,
  saveDraft,
  markAsRead,
  moveToTrash,
  getThreadByLeadId,
  associateEmailWithLead,
  getAllEmailLogs
};
