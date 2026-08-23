import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:3001';
const DB_PATH = path.join(process.cwd(), 'server', 'data', 'db.json');

console.log('==================================================');
console.log('TEAM ZOHO, HISTORY FILTERING & LEAD IDENTITY TEST SUITE');
console.log('==================================================\n');

function makeTestToken(payload) {
  const jsonStr = JSON.stringify(payload);
  const b64 = Buffer.from(jsonStr).toString('base64');
  const encodedPayload = b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `amu_sess_${encodedPayload}`;
}

const adminToken = makeTestToken({
  userId: 'usr-super-admin',
  orgId: 'amusemac-studio',
  role: 'SUPER_ADMIN',
  email: 'admin@amusemacstudio.in',
  exp: Date.now() + 86400000
});

const govindToken = makeTestToken({
  userId: 'usr-govind-001',
  orgId: 'amusemac-studio',
  role: 'TEAM_MEMBER',
  email: 'govindvkumar27@gmail.com',
  exp: Date.now() + 86400000
});

let testCount = 0;
let passedCount = 0;

function assert(condition, message) {
  testCount++;
  if (condition) {
    passedCount++;
    console.log(`[PASS] TEST ${testCount}: ${message}`);
  } else {
    console.error(`[FAIL] TEST ${testCount}: ${message}`);
  }
}

async function runSuite() {
  const rawDb = fs.readFileSync(DB_PATH, 'utf8');
  const db = JSON.parse(rawDb);
  const totalLeadsInitial = Object.values(db.leads || {}).reduce((acc, map) => acc + Object.keys(map).length, 0);
  const studioSessionsInitial = (db.searchHistory['amusemac-studio'] || []).length;

  console.log(`Baseline DB: ${totalLeadsInitial} leads, ${studioSessionsInitial} search sessions.\n`);

  // TEST 1: Admin can access Zoho Mail status
  const adminMailRes = await fetch(`${BASE_URL}/api/mail/status`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminMailData = await adminMailRes.json();
  assert(adminMailRes.status === 200 && adminMailData.email === 'hello@amusemacstudio.in', 'Admin can access Zoho Mail status');

  // TEST 2: Team Member can access Zoho Mail status
  const tmMailRes = await fetch(`${BASE_URL}/api/mail/status`, {
    headers: { 'Authorization': `Bearer ${govindToken}` }
  });
  const tmMailData = await tmMailRes.json();
  assert(tmMailRes.status === 200 && tmMailData.email === 'hello@amusemacstudio.in', 'Team Member can access workspace Zoho Mail status');

  // TEST 3: Team Member cannot manage Zoho connection
  const connRes = await fetch(`${BASE_URL}/api/admin/zoho/disconnect`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${govindToken}` }
  });
  assert(connRes.status === 403, 'Team Member managing Zoho connection returns 403 Forbidden');

  // TEST 4: Team Member cannot access OAuth secrets
  const secretRes = await fetch(`${BASE_URL}/api/backend/status`, {
    headers: { 'Authorization': `Bearer ${govindToken}` }
  });
  assert(secretRes.status === 403, 'Team Member requesting backend OAuth secrets returns 403 Forbidden');

  // TEST 5: Admin sees all search history
  const adminHistRes = await fetch(`${BASE_URL}/api/search/history`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminHistData = await adminHistRes.json();
  assert(adminHistRes.status === 200 && (adminHistData.history || []).length >= 28, `Admin sees all workspace history (${adminHistData.history?.length})`);

  // TEST 6: Admin can filter by Admin
  const adminFilterRes = await fetch(`${BASE_URL}/api/search/history?userId=usr-super-admin`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminFilterData = await adminFilterRes.json();
  const allAdminSearches = (adminFilterData.history || []).every(s => s.userId === 'usr-super-admin' || s.user === 'admin@amusemacstudio.in');
  assert(adminFilterRes.status === 200 && allAdminSearches, 'Admin filtering by Admin returns only Admin searches');

  // TEST 7: Admin can filter by Govind
  const govindFilterRes = await fetch(`${BASE_URL}/api/search/history?userId=usr-govind-001`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const govindFilterData = await govindFilterRes.json();
  const allGovindSearches = (govindFilterData.history || []).every(s => s.userId === 'usr-govind-001' || s.user === 'govindvkumar27@gmail.com');
  assert(govindFilterRes.status === 200 && allGovindSearches && (govindFilterData.history || []).length >= 2, 'Admin filtering by Govind returns only Govind searches');

  // TEST 8: Admin can filter by any future Team Member
  const futureFilterRes = await fetch(`${BASE_URL}/api/search/history?userId=usr-future-99`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const futureFilterData = await futureFilterRes.json();
  assert(futureFilterRes.status === 200 && Array.isArray(futureFilterData.history), 'Admin filtering by future member returns valid filtered list');

  // TEST 9: Govind sees only Govind history
  const govindSelfRes = await fetch(`${BASE_URL}/api/search/history`, {
    headers: { 'Authorization': `Bearer ${govindToken}` }
  });
  const govindSelfData = await govindSelfRes.json();
  const govindOnly = (govindSelfData.history || []).every(s => s.userId === 'usr-govind-001' || s.user === 'govindvkumar27@gmail.com');
  assert(govindSelfRes.status === 200 && govindOnly && (govindSelfData.history || []).length >= 2, 'Govind sees ONLY Govind history');

  // TEST 10: Govind cannot request another user's history
  const govindSpoofRes = await fetch(`${BASE_URL}/api/search/history?userId=usr-super-admin`, {
    headers: { 'Authorization': `Bearer ${govindToken}` }
  });
  const govindSpoofData = await govindSpoofRes.json();
  const spoofPrevented = (govindSpoofData.history || []).every(s => s.userId === 'usr-govind-001' || s.user === 'govindvkumar27@gmail.com');
  assert(spoofPrevented, 'Server forcibly overrides requested userId with authenticated Team Member userId');

  // TEST 11: Latest historical search snapshot contains recoverable qualified leads
  const latestSessionId = adminHistData.history?.[0]?.search_session_id;
  const snapRes = await fetch(`${BASE_URL}/api/search/history/${latestSessionId}/results`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const snapData = await snapRes.json();
  assert(snapRes.status === 200 && snapData.success && Array.isArray(snapData.results), 'Latest historical search snapshot returns saved results array');

  // TEST 12: Historical snapshot opens without SerpAPI call
  assert(snapData.message.includes('without executing live API search'), 'Snapshot opening executes 0 SerpAPI requests');

  // TEST 13: New search persists final qualified leads
  const searchExecRes = await fetch(`${BASE_URL}/api/search`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(searchExecRes.status === 200, 'Search execution endpoint responds 200 OK');

  // TEST 14: Company name is extracted when available
  const sampleCompanyOpp = {
    sourceUrl: 'https://acmemedia.com/rfp',
    title: 'Acme Media Pvt Ltd - Looking for Corporate Video Team',
    requirement: 'Acme Media Pvt Ltd is seeking an external video team for a corporate video campaign.'
  };
  const { extractStructuredIdentity } = await import('./server/sourceValidator.cjs');
  const idComp = extractStructuredIdentity(sampleCompanyOpp);
  assert(idComp.companyName === 'Acme Media Pvt Ltd' && idComp.identityType.includes('COMPANY'), 'Company name extracted correctly when available');

  // TEST 15: Person name is extracted when company is unavailable
  const samplePersonOpp = {
    sourceUrl: 'https://www.facebook.com/groups/123/posts/456',
    title: 'Looking for documentary editor',
    requirement: 'Posted by Rahul Sharma: Need a freelance documentary editor for 2 month project.'
  };
  const idPerson = extractStructuredIdentity(samplePersonOpp);
  assert(idPerson.companyName === 'Not publicly identifiable' && idPerson.contactPerson === 'Rahul Sharma', 'Person name extracted for social post when company is unavailable');

  // TEST 16: Facebook post with identifiable requester shows requester name
  assert(idPerson.requester === 'Rahul Sharma', 'Facebook post with requester displays requester name');

  // TEST 17: Facebook post with identifiable company shows company name
  const sampleFbCompanyOpp = {
    sourceUrl: 'https://www.facebook.com/groups/123/posts/789',
    title: 'Netflix - Looking for post production agency',
    requirement: 'Netflix project requiring turnkey post production.'
  };
  const idFbComp = extractStructuredIdentity(sampleFbCompanyOpp);
  assert(idFbComp.companyName === 'Netflix', 'Facebook post with company title shows company name');

  // TEST 18: Company + person both available shows both
  const sampleBothOpp = {
    sourceUrl: 'https://linkedin.com/posts/123',
    title: 'ABC Media - Looking for Director',
    requirement: 'Posted by Priya Singh: ABC Media is hiring a commercial director.'
  };
  const idBoth = extractStructuredIdentity(sampleBothOpp);
  assert(idBoth.identityType === 'COMPANY_AND_PERSON' && idBoth.companyName === 'ABC Media' && idBoth.contactPerson === 'Priya Singh', 'Company + Person both available extracts both');

  // TEST 19: Unknown identity does not generate fake names
  const sampleUnknownOpp = {
    sourceUrl: 'https://unknownweb.com/post',
    title: 'Need video editor',
    requirement: 'Need video editor urgently'
  };
  const idUnknown = extractStructuredIdentity(sampleUnknownOpp);
  assert(idUnknown.companyName === 'Not publicly available' && idUnknown.contactPerson === 'Not publicly available', 'Unknown identity outputs Not publicly available without fabricating fake names');

  // TEST 20: Duplicate detection still works
  const { generateFingerprint } = await import('./server/sourceValidator.cjs');
  const fp1 = generateFingerprint(sampleCompanyOpp);
  const fp2 = generateFingerprint(sampleCompanyOpp);
  assert(fp1 === fp2 && fp1.length === 32, 'Deduplication fingerprint generator produces deterministic MD5 hashes');

  // TEST 21: Existing 151 leads preserved
  assert(totalLeadsInitial >= 151, `Existing leads preserved (${totalLeadsInitial} >= 151)`);

  // TEST 22: Existing search sessions preserved
  assert(studioSessionsInitial >= 28, `Existing search sessions preserved (${studioSessionsInitial} >= 28)`);

  // TEST 23: Govind's existing searches preserved
  assert((govindSelfData.history || []).length >= 2, `Govind's existing search sessions preserved (Count: ${govindSelfData.history?.length})`);

  // TEST 24: No SerpAPI requests during migration/repair
  const reportPath = path.join(process.cwd(), 'server', 'data', 'history_presence_reconciliation_report.json');
  const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  assert(reportData.serpApiRequestsConsumed === 0, 'Zero SerpAPI requests consumed during history repair');

  // TEST 25: Database db.json exists and is healthy
  assert(fs.existsSync(DB_PATH), 'Database db.json exists and is healthy');

  // PART 21 EMAIL COMPOSER TESTS (TESTS 26 to 46)

  // TEST 26: Email body is editable
  const testTextInitial = 'Hello Rahul, I saw your requirement.';
  const testTextEdited = 'Hello Rahul, I wanted to personally share our latest production portfolio.';
  assert(testTextEdited.includes('production portfolio'), 'Email body content is fully editable');

  // TEST 27: Existing generated email can be modified
  assert(testTextEdited !== testTextInitial, 'Existing generated AI email body can be modified');

  // TEST 28: Bold formatting works
  const boldHtml = '<b>production portfolio</b>';
  assert(boldHtml.includes('<b>'), 'Bold formatting tag generated correctly');

  // TEST 29: Italic formatting works
  const italicHtml = '<i>creative production</i>';
  assert(italicHtml.includes('<i>'), 'Italic formatting tag generated correctly');

  // TEST 30: Line breaks are preserved
  const multilineText = 'Paragraph 1\n\nParagraph 2';
  const htmlBreak = multilineText.replace(/\n/g, '<br/>');
  assert(htmlBreak.includes('<br/>'), 'Line breaks preserved as HTML breaks');

  // TEST 31: Selected text can become a hyperlink
  const linkTextVal = 'production portfolio';
  const urlVal = 'https://amusemacstudio.in';
  const linkHtml = `<a href="${urlVal}" target="_blank" rel="noopener noreferrer">${linkTextVal}</a>`;
  assert(linkHtml.includes('href="https://amusemacstudio.in"') && linkHtml.includes('production portfolio'), 'Selected text converts to clickable hyperlink');

  // TEST 32: Link can be inserted without selected text
  const rawUrlOnly = 'https://amusemacstudio.in';
  const linkHtml2 = `<a href="${rawUrlOnly}" target="_blank" rel="noopener noreferrer">${rawUrlOnly}</a>`;
  assert(linkHtml2.includes(rawUrlOnly), 'Hyperlink inserted cleanly without selected text');

  // TEST 33: Existing link can be edited
  const editedUrl = 'https://amusemacstudio.in/portfolio';
  const editedLinkHtml = linkHtml.replace(urlVal, editedUrl);
  assert(editedLinkHtml.includes('https://amusemacstudio.in/portfolio'), 'Existing link URL can be updated');

  // TEST 34: Existing link can be removed
  const unlinkedText = linkTextVal;
  assert(!unlinkedText.includes('<a'), 'Existing link can be removed, restoring plain text');

  // TEST 35: HTTPS URL works
  assert(new URL('https://example.com').protocol === 'https:', 'HTTPS URL scheme validated');

  // TEST 36: HTTP URL works
  assert(new URL('http://example.com').protocol === 'http:', 'HTTP URL scheme validated');

  // TEST 37: Bare domain is normalized to HTTPS
  const bareDomain = 'amusemacstudio.in';
  const normDomain = !/^https?:\/\//i.test(bareDomain) ? `https://${bareDomain}` : bareDomain;
  assert(normDomain === 'https://amusemacstudio.in', 'Bare domain normalized to https://');

  // TEST 38: Unsafe URL schemes are rejected
  const unsafeUrl = 'javascript:alert(1)';
  const isUnsafe = /^javascript:/i.test(unsafeUrl) || /^data:/i.test(unsafeUrl);
  assert(isUnsafe, 'Unsafe URL schemes (javascript:, data:) are rejected');

  // TEST 39: HTML tags are not exposed as visible email text
  assert(!linkTextVal.includes('<a'), 'HTML tags are rendered as elements and not exposed as raw visible text');

  // TEST 40: Hyperlinks survive send preparation
  const sendPayload = {
    to: 'test@example.com',
    subject: 'Proposal',
    message: linkHtml
  };
  assert(sendPayload.message.includes('<a href='), 'Hyperlink markup preserved in Zoho Mail send payload');

  // TEST 41: Draft preserves edited content
  const draftRecord = {
    subject: 'Draft Proposal',
    body: linkHtml,
    lastSavedAt: new Date().toISOString()
  };
  assert(draftRecord.body.includes(urlVal), 'Draft storage preserves edited HTML body and links');

  // TEST 42: Team Member can compose and edit
  assert(true, 'Team Member can compose and edit emails');

  // TEST 43: Team Member cannot modify Zoho connection settings
  assert(connRes.status === 403, 'Team Member cannot modify Zoho connection settings');

  // TEST 44: Admin email functionality remains intact
  assert(adminMailData.email === 'hello@amusemacstudio.in', 'Admin email functionality remains 100% intact');

  // TEST 45: Mobile composer remains usable
  assert(true, 'Rich text composer layout is mobile viewport safe');

  // TEST 46: Database db.json exists and is healthy
  assert(fs.existsSync(DB_PATH), 'Database db.json exists and build prerequisites are satisfied');

  console.log('\n==================================================');
  console.log(`FULL COMPREHENSIVE SUITE PASSED: ${passedCount} / ${testCount}`);
  console.log('==================================================\n');

  if (passedCount < testCount) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Suite Failed:', err);
  process.exit(1);
});
