const express = require('express');
const cors = require('cors');
require('dotenv').config();

const {
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
} = require('./server/emailService.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper to resolve request organization context
function resolveOrgId(req) {
  return (
    req.headers['x-organization-id'] ||
    req.query.orgId ||
    (req.body && req.body.orgId) ||
    'amusemac-studio'
  );
}

// 1. GET /api/mail/status - Verification & Status indicator endpoint
app.get('/api/mail/status', async (req, res) => {
  const orgId = resolveOrgId(req);

  // Tenant isolation boundary: hello@amusemacstudio.in Zoho mailbox is returned ONLY for amusemac-studio
  if (orgId !== 'amusemac-studio') {
    return res.json({
      email: 'Not Connected',
      provider: 'None',
      status: 'NOT_CONNECTED',
      smtp: {
        host: 'N/A',
        port: 'N/A',
        secure: false,
        connected: false,
        message: 'No mailbox connected for this customer workspace'
      },
      imap: {
        host: 'N/A',
        port: 'N/A',
        secure: false,
        connected: false,
        message: 'No mailbox connected for this customer workspace'
      }
    });
  }

  const email = process.env.ZOHO_EMAIL || 'hello@amusemacstudio.in';
  const smtpHost = process.env.ZOHO_SMTP_HOST || 'smtppro.zoho.com';
  const smtpPort = process.env.ZOHO_SMTP_PORT || '465';
  const imapHost = process.env.ZOHO_IMAP_HOST || 'imappro.zoho.com';
  const imapPort = process.env.ZOHO_IMAP_PORT || '993';

  const smtpCheck = await verifySmtpConnection();
  const imapCheck = await verifyImapConnection();

  res.json({
    email,
    provider: 'Zoho Mail Enterprise',
    status: 'CONNECTED',
    smtp: {
      host: smtpHost,
      port: smtpPort,
      secure: process.env.ZOHO_SMTP_SECURE !== 'false',
      connected: smtpCheck.success,
      message: smtpCheck.message
    },
    imap: {
      host: imapHost,
      port: imapPort,
      secure: process.env.ZOHO_IMAP_SECURE !== 'false',
      connected: imapCheck.success,
      message: imapCheck.message
    }
  });
});

// 2. POST /api/mail/send - Send real email via Zoho SMTP
app.post('/api/mail/send', async (req, res) => {
  const { to, subject, body, leadId, cc, attachments } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ success: false, message: 'Recipient (to), subject, and body are required.' });
  }

  const result = await sendEmail({ to, subject, body, leadId, cc, attachments });
  res.json(result);
});

// 3. POST /api/mail/sync - Real IMAP sync from Zoho
app.post('/api/mail/sync', async (req, res) => {
  const { leads = [] } = req.body;
  const result = await syncInbox(leads);
  res.json(result);
});

// 4. GET /api/mail/logs - Retrieve all email logs
app.get('/api/mail/logs', (req, res) => {
  const logs = getAllEmailLogs();
  res.json({ success: true, logs });
});

// 5. GET /api/mail/thread/:leadId - Get thread for specific lead ID
app.get('/api/mail/thread/:leadId', (req, res) => {
  const { leadId } = req.params;
  const thread = getThreadByLeadId(leadId);
  res.json({ success: true, thread });
});

// 6. POST /api/mail/associate - Link unassigned email to a lead ID
app.post('/api/mail/associate', (req, res) => {
  const { emailId, leadId } = req.body;
  if (!emailId || !leadId) {
    return res.status(400).json({ success: false, message: 'emailId and leadId are required.' });
  }
  const result = associateEmailWithLead(emailId, leadId);
  res.json(result);
});

// 7. POST /api/mail/draft - Save draft email
app.post('/api/mail/draft', (req, res) => {
  const result = saveDraft(req.body);
  res.json(result);
});

// 8. POST /api/mail/read - Mark message as read
app.post('/api/mail/read', (req, res) => {
  const { emailId } = req.body;
  const result = markAsRead(emailId);
  res.json(result);
});

// 9. POST /api/mail/trash - Move message to trash
app.post('/api/mail/trash', (req, res) => {
  const { emailId } = req.body;
  const result = moveToTrash(emailId);
  res.json(result);
});

// 10. POST /api/mail/test-send - Send real test email via Zoho SMTP
app.post('/api/mail/test-send', async (req, res) => {
  const { testRecipient } = req.body;

  if (!testRecipient) {
    return res.status(400).json({ success: false, message: 'Test recipient email address is required.' });
  }

  const subject = 'Amusemac Studio Zoho Mail Enterprise Connection Test';
  const body = `Hi,\n\nThis is an automated verification email sent from hello@amusemacstudio.in via Zoho Mail Enterprise (smtppro.zoho.com:465).\n\nSent at: ${new Date().toLocaleString()}\n\nAmusemac Growth Agent Enterprise`;

  const result = await sendEmail({ to: testRecipient, subject, body, leadId: 'TEST-LEAD' });
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`AMUSEMAC GROWTH AGENT - REAL ZOHO MAIL ENTERPRISE SERVER`);
  console.log(`Server listening on: http://localhost:${PORT}`);
  console.log(`Zoho Mailbox: ${process.env.ZOHO_EMAIL || 'hello@amusemacstudio.in'}`);
  console.log(`==================================================`);
});
