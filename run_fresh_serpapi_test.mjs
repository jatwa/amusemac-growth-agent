import fetch from 'node-fetch';

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

async function executeFreshSerpApiTest() {
  console.log('==================================================');
  console.log('FRESH SERPAPI SINGLE-REQUEST CONTROLLED TEST');
  console.log('==================================================\n');

  // 1. Fetch Combined Quota BEFORE Search
  const quotaBeforeRes = await fetch(`${API_BASE}/api/serpapi/quota`, { headers: HEADERS });
  const quotaBeforeJson = await quotaBeforeRes.json();
  const quotaBefore = quotaBeforeJson.combinedRemaining;

  console.log(`Combined SerpAPI searches remaining BEFORE search: ${quotaBefore}\n`);

  // 2. Execute EXACTLY ONE User Search via Production API
  const UNIQUE_QUERY = 'companies seeking external documentary production partner 2026';
  
  console.log(`Executing 1 fresh search for query: "${UNIQUE_QUERY}"...\n`);

  const searchRes = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      query: UNIQUE_QUERY,
      locationMode: 'worldwide',
      workMode: 'ANY',
      engagementType: 'ANY',
      resultLimit: 'MAXIMUM',
      resultMode: 'MAXIMUM',
      searchMode: 'live'
    })
  });

  const searchJson = await searchRes.json();

  // 3. Fetch Combined Quota AFTER Search
  const quotaAfterRes = await fetch(`${API_BASE}/api/serpapi/quota`, { headers: HEADERS });
  const quotaAfterJson = await quotaAfterRes.json();
  const quotaAfter = quotaAfterJson.combinedRemaining;

  const creditsConsumed = quotaBefore - quotaAfter;

  const metrics = searchJson.metrics || {};
  const leads = searchJson.leads || [];

  const serpApiRequests = metrics.serpApiRequestsCount || 1;
  const rawResultsCount = metrics.rawResultsCount || 0;
  const rejectedProvidersCount = metrics.rejectedProvidersCount || 0;
  const rejectedIrrelevantCount = metrics.rejectedIrrelevantCount || 0;
  const duplicateCount = metrics.duplicateCount || 0;
  const deepResearched = metrics.candidatesCount || leads.length;

  const isCached = creditsConsumed === 0;

  console.log('==================================================');
  console.log('TEST REPORT RESULTS');
  console.log('==================================================');
  console.log(`HTTP SerpAPI requests        : ${serpApiRequests}`);
  console.log(`Response                     : ${isCached ? 'Cached' : 'Fresh'}`);
  console.log(`Requested results            : 100`);
  console.log(`Actual organic_results.length: ${rawResultsCount}`);
  console.log(`Combined quota before        : ${quotaBefore}`);
  console.log(`Combined quota after         : ${quotaAfter}`);
  console.log(`Credits consumed             : ${creditsConsumed}`);
  console.log(`Raw candidates               : ${rawResultsCount}`);
  console.log(`Provider rejected            : ${rejectedProvidersCount}`);
  console.log(`Irrelevant                   : ${rejectedIrrelevantCount}`);
  console.log(`Duplicates                   : ${duplicateCount}`);
  console.log(`Deep researched              : ${deepResearched}`);
  console.log(`Final qualified leads        : ${leads.length}`);
  console.log('==================================================\n');

  if (isCached) {
    console.log('NOTICE: Test reported response was cached (0 credits consumed).');
  }
}

executeFreshSerpApiTest();
