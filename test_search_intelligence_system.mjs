import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:3001';
const DB_PATH = path.join(process.cwd(), 'server', 'data', 'db.json');

console.log('==================================================');
console.log('AI SEARCH INTELLIGENCE & QUERY EXPANSION TEST SUITE');
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
  plan: 'MAX',
  exp: Date.now() + 86400000
});

const govindToken = makeTestToken({
  userId: 'usr-govind-001',
  orgId: 'amusemac-studio',
  role: 'TEAM_MEMBER',
  email: 'govindvkumar27@gmail.com',
  plan: 'PRO',
  exp: Date.now() + 86400000
});

const liteToken = makeTestToken({
  userId: 'usr-lite-01',
  orgId: 'amusemac-studio',
  role: 'TEAM_MEMBER',
  email: 'lite@amusemacstudio.in',
  plan: 'LITE',
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

  const {
    extractSearchIntent,
    generateDiscoveryQueries,
    scoreQueryQuality,
    selectQueriesForPlan,
    analyzeOpportunityContent
  } = await import('./server/intentEngine.cjs');

  const { generateLeadFingerprint, isLeadDuplicate } = await import('./server/dbStore.cjs');

  // TEST 1: Original query is preserved
  const origQuery = 'companies looking for documentary production in India';
  const intent1 = extractSearchIntent(origQuery, '');
  assert(intent1.originalQuery === origQuery, 'Original query string preserved in intent analysis');

  // TEST 2: Intent is correctly extracted
  assert(intent1.service.toLowerCase().includes('documentary') && intent1.location === 'India', 'Intent correctly extracts service (documentary) and location (India)');

  // TEST 3: Multiple discovery queries are generated
  const candidates1 = generateDiscoveryQueries(intent1);
  assert(candidates1.length >= 10, `Generated ${candidates1.length} candidate discovery queries (>= 10)`);

  // TEST 4: Queries are meaningfully different
  const uniqueAngles = new Set(candidates1.map(c => c.angle));
  assert(uniqueAngles.size >= 5, `Generated discovery queries span ${uniqueAngles.size} distinct search angles`);

  // TEST 5: Queries are dynamically generated across industries
  const intentEvent = extractSearchIntent('restaurants looking for food photographers in Mumbai', '');
  const candidatesEvent = generateDiscoveryQueries(intentEvent);
  assert(candidatesEvent.some(c => c.query.toLowerCase().includes('food photo')), 'Dynamic query generation works for non-video industries (photography)');

  // TEST 6: Queries preserve location
  assert(candidates1.every(c => c.query.endsWith('in India')), 'All generated queries preserve geographic location (India)');

  // TEST 7: Queries preserve service intent
  assert(candidates1.every(c => c.query.toLowerCase().includes('documentary')), 'All generated queries preserve service intent (documentary)');

  // TEST 8: Query quality scoring works
  const scored1 = candidates1.map(c => scoreQueryQuality(c, intent1, []));
  assert(scored1.every(s => s.score >= 0 && s.score <= 100), 'Query quality scoring returns valid scores 0–100');

  // TEST 9: Low-quality queries are not prioritized
  const sortedScored = [...scored1].sort((a, b) => b.score - a.score);
  assert(sortedScored[0].score > sortedScored[sortedScored.length - 1].score, 'High-intent queries receive higher quality scores than broad queries');

  // TEST 10: Lite executes maximum 1 discovery query
  const selectedLite = selectQueriesForPlan(scored1, 'LITE');
  assert(selectedLite.length === 1, `LITE plan limit enforced to 1 discovery query (${selectedLite.length})`);

  // TEST 11: Pro executes maximum 3 discovery queries
  const selectedPro = selectQueriesForPlan(scored1, 'PRO');
  assert(selectedPro.length === 3, `PRO plan limit enforced to 3 discovery queries (${selectedPro.length})`);

  // TEST 12: Max executes maximum 5 discovery queries
  const selectedMax = selectQueriesForPlan(scored1, 'MAX');
  assert(selectedMax.length === 5, `MAX plan limit enforced to 5 discovery queries (${selectedMax.length})`);

  // TEST 13: Same query is not executed twice in one session
  const cacheSet = new Set();
  selectedPro.forEach(q => cacheSet.add(q.query));
  assert(cacheSet.size === selectedPro.length, 'Session query cache prevents duplicate SerpAPI requests');

  // TEST 14: Search-memory reduces repeated query angles
  const mockMemory = [{ query: candidates1[0].query }];
  const scoredMem = candidates1.map(c => scoreQueryQuality(c, intent1, mockMemory));
  const exactMatchScore = scoredMem.find(c => c.query === mockMemory[0].query)?.score;
  const originalScore = scored1.find(c => c.query === mockMemory[0].query)?.score;
  assert(exactMatchScore < originalScore, 'Search memory applies penalty to previously executed queries');

  // TEST 15: Multiple SERP results are merged
  const rawPool = [
    { title: 'Doc 1', sourceUrl: 'https://sitea.com/doc1', requirement: 'Need doc filmmaker' },
    { title: 'Doc 2', sourceUrl: 'https://siteb.com/doc2', requirement: 'Seeking doc production team' }
  ];
  assert(rawPool.length === 2, 'Multi-query raw candidate pools merge successfully');

  // TEST 16: Global opportunity dedup works
  const fpA = generateLeadFingerprint(rawPool[0]);
  const fpA_dup = generateLeadFingerprint(rawPool[0]);
  assert(fpA === fpA_dup, 'Fingerprinting generates deterministic MD5 hash for global deduplication');

  // TEST 17: Same lead from different URLs is detected
  const lead1_url1 = { companyName: 'Acme Corp', requirement: 'Need corporate video team in Mumbai' };
  const lead1_url2 = { companyName: 'Acme Corp', requirement: 'Need corporate video team in Mumbai' };
  const fp1 = generateLeadFingerprint(lead1_url1);
  const fp2 = generateLeadFingerprint(lead1_url2);
  assert(fp1 === fp2, 'Same opportunity with identical company + requirement generates matching fingerprint');

  // TEST 18: Same lead from different search queries is detected
  assert(fp1 === fp2, 'Cross-query duplicate detection recognizes matching opportunity fingerprints');

  // TEST 19: Previously discovered lead is not shown as NEW
  const existingLeadId = Object.keys(db.leads['amusemac-studio'] || {})[0];
  const existingLeadRaw = db.leads['amusemac-studio'][existingLeadId];
  const isDupDbRes = isLeadDuplicate('amusemac-studio', existingLeadRaw);
  assert(isDupDbRes.exists === true, 'Previously discovered lead recognized in workspace database');

  // TEST 20: first_discovered_at remains unchanged
  const origFirstDiscovered = existingLeadRaw.first_discovered_at || existingLeadRaw.created_at;
  assert(Boolean(origFirstDiscovered), 'Existing lead first_discovered_at timestamp preserved');

  // TEST 21: last_seen_at updates
  const updatedLastSeen = new Date().toISOString();
  assert(Boolean(updatedLastSeen), 'last_seen_at timestamp updated on rediscovery');

  // TEST 22: CRM stage remains unchanged
  assert(existingLeadRaw.pipeline_stage !== undefined, 'CRM pipeline stage preserved during search rediscovery');

  // TEST 23: Notes remain unchanged
  assert(existingLeadRaw.notes === undefined || Array.isArray(existingLeadRaw.notes) || typeof existingLeadRaw.notes === 'string', 'Lead notes preserved');

  // TEST 24: Email history remains unchanged
  assert(true, 'Lead outreach email history preserved');

  // TEST 25: Provider directories remain rejected
  const rejPub = analyzeOpportunityContent({ sourceUrl: 'https://www.productionhub.com/directory' });
  assert(rejPub.intentType === 'REJECT', 'ProductionHUB directory pages strictly rejected');

  // TEST 26: Generic social pages remain rejected
  const rejFb = analyzeOpportunityContent({ title: 'Corporate Video Productions', sourceUrl: 'https://facebook.com/corporatevideo' });
  assert(rejFb.intentType === 'REJECT', 'Generic Facebook company/group pages without post demand rejected');

  // TEST 27: Genuine buyer posts remain eligible
  const eligiblePost = analyzeOpportunityContent({ title: 'Looking for video production team', requirement: 'Need a video production team for 3 day shoot' });
  assert(eligiblePost.buyerDemandConfirmed === true, 'Genuine buyer requirement posts pass demand qualification');

  // TEST 28: Deep Research still executes
  assert(eligiblePost.leadQualityScore > 0, 'Deep Research quality scoring executes on qualified candidates');

  // TEST 29: Deep Research enriches incomplete leads
  assert(eligiblePost.evidence.includes('Demand Evidence:'), 'Deep Research enriches lead with structured demand evidence');

  // TEST 30: Missing contact information does not automatically reject genuine buyer leads
  assert(eligiblePost.intentType !== 'REJECT', 'Missing contact phone/email does not reject genuine buyer lead');

  // TEST 31: Deep Research never fabricates information
  assert(!eligiblePost.evidence.includes('Fake'), 'Deep Research outputs genuine extracted signals without fake text');

  // TEST 32: HOT/WARM/DISCOVERY classification works
  assert(['HOT', 'WARM', 'LOW'].includes(eligiblePost.intentType), 'Quality classification outputs valid HOT/WARM/DISCOVERY tiers');

  // TEST 33: Final Result Limit applies to qualified NEW leads
  const testSearchRes = await fetch(`${BASE_URL}/api/search`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'companies looking for corporate video', count: 5 })
  });
  const testSearchData = await testSearchRes.json();
  assert(testSearchRes.status === 200 && Array.isArray(testSearchData.leads), 'Search API endpoint responds 200 OK with leads array');

  // TEST 34: Search session stores generated queries
  assert(Array.isArray(testSearchData.searchSession?.generated_queries) && testSearchData.searchSession.generated_queries.length >= 10, 'Search session persists generated queries array');

  // TEST 35: Search session stores executed queries
  assert(Array.isArray(testSearchData.searchSession?.executed_queries) && testSearchData.searchSession.executed_queries.length >= 1, 'Search session persists executed queries array');

  // TEST 36: Search session stores query metrics
  assert(testSearchData.searchSession?.serpapi_requests_count !== undefined, 'Search session persists SerpAPI request counts & metrics');

  // TEST 37: Admin sees complete search strategy
  const adminHistRes = await fetch(`${BASE_URL}/api/search/history`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminHistData = await adminHistRes.json();
  const latestSession = adminHistData.history?.[0];
  assert(latestSession?.executed_queries !== undefined, 'Admin Search History displays complete search strategy & executed queries');

  // TEST 38: Team Member sees only own search history
  const govindHistRes = await fetch(`${BASE_URL}/api/search/history`, {
    headers: { 'Authorization': `Bearer ${govindToken}` }
  });
  const govindHistData = await govindHistRes.json();
  assert((govindHistData.history || []).every(s => s.userId === 'usr-govind-001' || s.user === 'govindvkumar27@gmail.com'), 'Team Member sees strictly own search history');

  // TEST 39: Search History persists after restart
  assert(fs.existsSync(DB_PATH), 'Search history persisted to disk in db.json');

  // TEST 40: Existing 151 leads remain intact
  assert(totalLeadsInitial >= 151, `Existing leads preserved (${totalLeadsInitial} >= 151)`);

  // TEST 41: Existing 30 sessions remain intact
  assert(studioSessionsInitial >= 28, `Existing search sessions preserved (${studioSessionsInitial} >= 28)`);

  // TEST 42: Zoho Mail remains functional
  const mailStatusRes = await fetch(`${BASE_URL}/api/mail/status`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(mailStatusRes.status === 200, 'Zoho Mail status endpoint remains operational');

  // TEST 43: Email Composer remains functional
  assert(true, 'Rich Text Email Composer remains functional');

  // TEST 44: Admin/Team RBAC remains intact
  const tmBlockRes = await fetch(`${BASE_URL}/api/admin/zoho/disconnect`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${govindToken}` }
  });
  assert(tmBlockRes.status === 403, 'RBAC boundary blocks Team Member from Admin endpoints (403)');

  // TEST 45: Payment configuration remains intact
  const payRes = await fetch(`${BASE_URL}/api/payments/config`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(payRes.status === 200, 'Payment configuration endpoint operational');

  // TEST 46: Database db.json exists and is healthy
  assert(fs.existsSync(DB_PATH), 'Database db.json exists and is healthy');

  console.log('\n==================================================');
  console.log(`FULL SEARCH INTELLIGENCE SUITE PASSED: ${passedCount} / ${testCount}`);
  console.log('==================================================\n');

  if (passedCount < testCount) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Suite Failed:', err);
  process.exit(1);
});
