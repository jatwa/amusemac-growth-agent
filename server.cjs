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

// Middleware: Server Authentication & Authorization Boundary
function authenticateServerRequest(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  const queryToken = req.query && req.query.token;
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : queryToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Authentication token required.' });
  }

  let payload = null;
  try {
    if (token.startsWith('amu_sess_')) {
      const rawB64 = token.slice('amu_sess_'.length).replace(/-/g, '+').replace(/_/g, '/');
      const padLen = (4 - (rawB64.length % 4)) % 4;
      const paddedB64 = rawB64 + '='.repeat(padLen);
      const jsonStr = Buffer.from(paddedB64, 'base64').toString('utf8');
      payload = JSON.parse(jsonStr);
    }
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid authentication token.' });
  }

  if (!payload || !payload.orgId || (payload.exp && payload.exp < Date.now())) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Expired or invalid token payload.' });
  }

  // Cross-tenant organization tamper check: Compare client-asserted organization ID against token payload
  const clientOrgId = req.headers['x-organization-id'] || (req.query && req.query.orgId) || (req.body && req.body.orgId);
  if (clientOrgId && clientOrgId !== payload.orgId) {
    return res.status(403).json({ success: false, message: 'Forbidden: Access denied to requested organization resource.' });
  }

  req.auth = payload;
  next();
}

// 1. GET /api/mail/status - Verification & Status indicator endpoint
app.get('/api/mail/status', authenticateServerRequest, async (req, res) => {
  const orgId = req.auth.orgId;

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
app.post('/api/mail/send', authenticateServerRequest, async (req, res) => {
  if (req.auth.orgId !== 'amusemac-studio') {
    return res.status(403).json({ success: false, message: 'Forbidden: Mailbox not connected for this organization.' });
  }

  const { to, subject, body, leadId, cc, attachments } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ success: false, message: 'Recipient (to), subject, and body are required.' });
  }

  const result = await sendEmail({ to, subject, body, leadId, cc, attachments });
  res.json(result);
});

// 3. POST /api/mail/sync - Real IMAP sync from Zoho
app.post('/api/mail/sync', authenticateServerRequest, async (req, res) => {
  if (req.auth.orgId !== 'amusemac-studio') {
    return res.json({ success: true, syncedCount: 0, message: 'No connected mailbox for customer tenant.' });
  }

  const { leads = [] } = req.body;
  const result = await syncInbox(leads);
  res.json(result);
});

// 4. GET /api/mail/logs - Retrieve email logs
app.get('/api/mail/logs', authenticateServerRequest, (req, res) => {
  if (req.auth.orgId !== 'amusemac-studio') {
    return res.json({ success: true, logs: [] });
  }

  const logs = getAllEmailLogs();
  res.json({ success: true, logs });
});

// 5. GET /api/mail/thread/:leadId - Get thread for specific lead ID
app.get('/api/mail/thread/:leadId', authenticateServerRequest, (req, res) => {
  if (req.auth.orgId !== 'amusemac-studio') {
    return res.json({ success: true, thread: [] });
  }

  const { leadId } = req.params;
  const thread = getThreadByLeadId(leadId);
  res.json({ success: true, thread });
});

// 6. POST /api/mail/associate - Link unassigned email to a lead ID
app.post('/api/mail/associate', authenticateServerRequest, (req, res) => {
  if (req.auth.orgId !== 'amusemac-studio') {
    return res.status(403).json({ success: false, message: 'Forbidden: Resource ownership mismatch.' });
  }

  const { emailId, leadId } = req.body;
  if (!emailId || !leadId) {
    return res.status(400).json({ success: false, message: 'emailId and leadId are required.' });
  }
  const result = associateEmailWithLead(emailId, leadId);
  res.json(result);
});

// 7. POST /api/mail/draft - Save draft email
app.post('/api/mail/draft', authenticateServerRequest, (req, res) => {
  if (req.auth.orgId !== 'amusemac-studio') {
    return res.json({ success: true, draftId: 'draft-local' });
  }

  const result = saveDraft(req.body);
  res.json(result);
});

// 8. POST /api/mail/read - Mark message as read
app.post('/api/mail/read', authenticateServerRequest, (req, res) => {
  if (req.auth.orgId !== 'amusemac-studio') {
    return res.status(403).json({ success: false, message: 'Forbidden: Resource ownership mismatch.' });
  }

  const { emailId } = req.body;
  const result = markAsRead(emailId);
  res.json(result);
});

// 9. POST /api/mail/trash - Move message to trash
app.post('/api/mail/trash', authenticateServerRequest, (req, res) => {
  if (req.auth.orgId !== 'amusemac-studio') {
    return res.status(403).json({ success: false, message: 'Forbidden: Resource ownership mismatch.' });
  }

  const { emailId } = req.body;
  const result = moveToTrash(emailId);
  res.json(result);
});

// 10. POST /api/mail/test-send - Send real test email via Zoho SMTP
app.post('/api/mail/test-send', authenticateServerRequest, async (req, res) => {
  if (req.auth.orgId !== 'amusemac-studio') {
    return res.status(403).json({ success: false, message: 'Forbidden: Test email endpoint restricted to primary enterprise workspace.' });
  }

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
  console.log(`AMUSEMAC GROWTH AGENT - AUTHENTICATED MULTI-TENANT BACKEND SERVER`);
  console.log(`Server listening on: http://localhost:${PORT}`);
  console.log(`Zoho Primary Mailbox: ${process.env.ZOHO_EMAIL || 'hello@amusemacstudio.in'}`);
  console.log(`==================================================`);
});
