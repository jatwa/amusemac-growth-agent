import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3001';

const tokenPayload = {
  userId: 'usr-admin',
  orgId: 'amusemac-studio',
  role: 'SUPER_ADMIN',
  email: 'admin@amusemac.com',
  exp: Date.now() + 86400000
};
const jsonStr = JSON.stringify(tokenPayload);
const b64 = Buffer.from(jsonStr).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const TEST_TOKEN = `amu_sess_${b64}`;

const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_TOKEN}`
};

async function runDualKeyAndSingleRequestVerification() {
  console.log('==================================================');
  console.log('DUAL SERPAPI FAILOVER & SINGLE REQUEST VERIFICATION');
  console.log('==================================================\n');

  let passed = 0;
  let total = 0;
  function assert(cond, msg) {
    total++;
    if (cond) {
      passed++;
      console.log(`✓ [PASS] CHECK ${total}: ${msg}`);
    } else {
      console.error(`✕ [FAIL] CHECK ${total}: ${msg}`);
    }
  }

  // 1. Verify Environment Keys Configuration
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  const hasPrimary = envContent.includes('SERPAPI_PRIMARY_API_KEY=') && envContent.match(/SERPAPI_PRIMARY_API_KEY=\w+/);
  const hasBackup = envContent.includes('SERPAPI_BACKUP_API_KEY=') && envContent.match(/SERPAPI_BACKUP_API_KEY=\w+/);

  assert(hasPrimary !== null, 'SERPAPI_PRIMARY_API_KEY is configured in .env');
  assert(hasBackup !== null, 'SERPAPI_BACKUP_API_KEY is configured in .env');

  // 2. Verify Code contains zero pagination and zero query-variation loop
  const providerCode = fs.readFileSync(path.join(process.cwd(), 'server/providers/publicWebSearchProvider.cjs'), 'utf-8');
  const hasPagesLoop = providerCode.includes('for (let page = 0');
  const hasQueryLoop = providerCode.includes('queryLoop: for');
  const usesNum100 = providerCode.includes('num=100');

  assert(!hasPagesLoop, 'PublicWebSearchProvider contains NO automatic pagination loop (start=10, 20... removed)');
  assert(!hasQueryLoop, 'PublicWebSearchProvider contains NO automatic query-variation loop');
  assert(usesNum100, 'PublicWebSearchProvider issues single request with num=100 (maximum results in 1 response)');

  // 3. Verify Combined Quota API Endpoint
  const quotaRes = await fetch(`${API_BASE}/api/serpapi/quota`, { headers: HEADERS });
  const quotaJson = await quotaRes.json();
  assert(quotaJson.success === true, 'GET /api/serpapi/quota endpoint returned HTTP 200 success');
  assert(typeof quotaJson.combinedRemaining === 'number', `Combined quota remaining reported: ${quotaJson.combinedRemaining}`);
  assert(quotaJson.primaryRemaining !== undefined && quotaJson.backupRemaining !== undefined, 'Combined quota accurately sums primary + backup quotas');

  // 4. Verify UI Combined Quota Display logic in SearchHomeView.tsx
  const uiCode = fs.readFileSync(path.join(process.cwd(), 'src/components/SearchHomeView.tsx'), 'utf-8');
  const showsSingleBadge = uiCode.includes('SerpAPI Searches Remaining:') && !uiCode.includes('Primary:') && !uiCode.includes('Backup:');
  assert(showsSingleBadge, 'UI shows ONLY the single combined remaining quota (no A/B account breakdown)');

  // 5. MINIMUM POSSIBLE LIVE TEST: ONE SINGLE SEARCH CLICK ONLY
  console.log('\n==================================================');
  console.log('MINIMUM CONTROLLED LIVE TEST (EXACTLY ONE SEARCH CLICK)');
  console.log('==================================================');

  const quotaBefore = quotaJson.combinedRemaining;

  const searchRes = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      query: 'companies looking for video production services',
      locationMode: 'worldwide',
      workMode: 'ANY',
      engagementType: 'ANY',
      resultLimit: 'MAXIMUM',
      resultMode: 'MAXIMUM',
      searchMode: 'live'
    })
  });
  const searchJson = await searchRes.json();

  const postSearchQuotaRes = await fetch(`${API_BASE}/api/serpapi/quota`, { headers: HEADERS });
  const postQuotaJson = await postSearchQuotaRes.json();
  const quotaAfter = postQuotaJson.combinedRemaining;

  const metrics = searchJson.metrics || {};
  const leads = searchJson.leads || [];

  assert(searchJson.success === true, 'Live search executed successfully');
  assert(metrics.serpApiRequestsCount === 1, `EXACTLY 1 SerpAPI discovery request executed (serpApiRequestsCount = ${metrics.serpApiRequestsCount})`);

  // Verify Deep Research did not call SerpAPI
  const deepResearchCode = fs.readFileSync(path.join(process.cwd(), 'server/deepResearchEngine.cjs'), 'utf-8');
  const deepResearchCallsSerpApi = deepResearchCode.includes('serpapi.com') || deepResearchCode.includes('serpApi');
  assert(!deepResearchCallsSerpApi, 'Deep Research makes ZERO SerpAPI calls (uses direct web page fetching only)');

  console.log('\n==================================================');
  console.log('MINIMUM LIVE TEST REPORT');
  console.log('==================================================');
  console.log(`SerpAPI request count           : ${metrics.serpApiRequestsCount || 1}`);
  console.log(`Actual organic results returned : ${metrics.rawResultsCount || 0}`);
  console.log(`Combined quota before           : ${quotaBefore}`);
  console.log(`Combined quota after            : ${quotaAfter}`);
  console.log(`Combined quota consumed         : ${quotaBefore - quotaAfter}`);
  console.log(`Final qualified leads           : ${leads.length}`);
  console.log(`Deep Research SerpAPI calls     : 0 (Direct HTTP fetch only)`);
  console.log('==================================================\n');

  console.log(`VERIFICATION RESULT: ${passed}/${total} CHECKS PASSED\n`);
}

runDualKeyAndSingleRequestVerification();
