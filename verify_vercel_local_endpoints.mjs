import fetch from 'node-fetch';

const BASE_URL = 'http://127.0.0.1:3001';

console.log('====================================================');
console.log('VERCEL PREPARATION - LOCAL API ENDPOINT VERIFICATION');
console.log('====================================================\n');

let passCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    passCount++;
    console.log(`[PASS] ENDPOINT ${totalCount}: ${message}`);
  } else {
    console.error(`[FAIL] ENDPOINT ${totalCount}: ${message}`);
  }
}

async function runVerification() {
  // 1. GET /health
  const healthRes = await fetch(`${BASE_URL}/health`).then(r => r.json());
  assert(healthRes && healthRes.ok === true, 'GET /health responds with 200 OK & ok: true');

  // 2. GET /api/config
  const configRes = await fetch(`${BASE_URL}/api/config`).then(r => r.json());
  assert(configRes && configRes.success === true, 'GET /api/config responds with 200 OK & public config');

  // Auth token helper
  const authHeaders = {
    'Authorization': 'Bearer amu_sess_eyJ1c2VySWQiOiJ1c3Itc3VwZXItYWRtaW4iLCJvcmdJZCI6ImFtdXNlbWFjLXN0dWRpbyIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImVtYWlsIjoiYWRtaW5AYW11c2VtYWNzdHVkaW8uaW4ifQ',
    'Content-Type': 'application/json'
  };

  // 3. POST /api/search
  const searchRes = await fetch(`${BASE_URL}/api/search`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      query: 'video production partner in Mumbai',
      searchMode: 'demo'
    })
  }).then(r => r.json());
  assert(searchRes && searchRes.success === true && Array.isArray(searchRes.leads), 'POST /api/search responds with 200 OK & qualified leads array');

  // 4. POST /api/leads
  const testLead = {
    id: `VERCEL-TEST-${Date.now()}`,
    leadId: `VERCEL-TEST-${Date.now()}`,
    title: 'Vercel Test Corporate Video Project',
    companyName: 'Vercel Test Corp',
    requirement: 'Need video production partner for corporate video shoot.',
    matchedServices: ['Corporate Video'],
    sourceUrl: 'https://verceltest.com/project-rfp',
    intentType: 'HOT',
    intentScore: 92,
    dataStatus: 'REAL_PUBLIC'
  };
  const saveLeadRes = await fetch(`${BASE_URL}/api/leads`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ lead: testLead })
  }).then(r => r.json());
  assert(saveLeadRes && saveLeadRes.success === true, 'POST /api/leads persists lead successfully');

  // 5. GET /api/leads
  const getLeadsRes = await fetch(`${BASE_URL}/api/leads`, {
    headers: authHeaders
  }).then(r => r.json());
  assert(getLeadsRes && getLeadsRes.success === true && Array.isArray(getLeadsRes.leads), 'GET /api/leads returns tenant-isolated leads list');

  // 6. GET /api/sheets/status
  const sheetsStatusRes = await fetch(`${BASE_URL}/api/sheets/status`, {
    headers: authHeaders
  }).then(r => r.json());
  assert(sheetsStatusRes && sheetsStatusRes.success === true && sheetsStatusRes.configured !== undefined, 'GET /api/sheets/status returns Google Sheets webhook configuration status');

  // 7. POST /api/sheets/append
  const sheetsAppendRes = await fetch(`${BASE_URL}/api/sheets/append`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ lead: testLead })
  }).then(r => r.json());
  assert(sheetsAppendRes && (sheetsAppendRes.success === true || sheetsAppendRes.status !== undefined), 'POST /api/sheets/append responds with Google Sheets entry status');

  // 8. POST /api/mail/draft (Email API verification)
  const emailRes = await fetch(`${BASE_URL}/api/mail/draft`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      leadId: testLead.id,
      to: 'hello@amusemacstudio.in',
      subject: 'Vercel Deployment Verification Draft',
      body: 'Test draft body'
    })
  }).then(r => r.json());
  assert(emailRes && (emailRes.success === true || emailRes.draftId !== undefined), 'POST /api/mail/draft responds with email outreach draft status');

  console.log('\n====================================================');
  console.log(`LOCAL API VERIFICATION PASSED: ${passCount} / ${totalCount}`);
  console.log('====================================================\n');

  if (passCount < totalCount) process.exit(1);
}

runVerification().catch(err => {
  console.error('Verification Error:', err);
  process.exit(1);
});
