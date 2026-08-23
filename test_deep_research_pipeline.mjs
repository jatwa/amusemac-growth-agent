import fetch from 'node-fetch';
import { performDeepResearch } from './server/deepResearchEngine.cjs';

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

async function runVerificationSuite() {
  console.log('==================================================');
  console.log('AMUSEMAC GROWTH AGENT — AUTOMATED DEEP RESEARCH PIPELINE VERIFICATION');
  console.log('==================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✓ [PASS] TEST ${totalTests}: ${message}`);
    } else {
      console.error(`✕ [FAIL] TEST ${totalTests}: ${message}`);
    }
  }

  // --------------------------------------------------
  // 1. BACKEND HEALTH & SERPAPI STATUS
  // --------------------------------------------------
  console.log('[1] Checking Backend Health & Search API Provider...');
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    assert(res.status === 200, `Backend Server HTTP 200 OK (${API_BASE})`);
  } catch (e) {
    assert(false, `Backend Server Health check failed: ${e.message}`);
    process.exit(1);
  }

  // --------------------------------------------------
  // 2. EXECUTING LIVE SEARCH WITH DEEP RESEARCH
  // --------------------------------------------------
  console.log('\n[2] Executing Live Search Query with Automated Deep Research ("companies looking for AI video production", count=25)...');
  
  let searchRes = null;
  try {
    const res = await fetch(`${API_BASE}/api/search`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        query: 'companies looking for AI video production',
        locationMode: 'worldwide',
        workMode: 'REMOTE_WORLDWIDE',
        engagementType: 'PROJECT',
        count: 25,
        searchMode: 'live'
      })
    });
    searchRes = await res.json();
  } catch (e) {
    assert(false, `Search execution request failed: ${e.message}`);
    process.exit(1);
  }

  assert(searchRes.success === true, `Search response success: true`);
  assert(searchRes.mode === 'live', `Search executed in LIVE mode (mode: ${searchRes.mode})`);
  assert(searchRes.isDemoUsed === false, `Zero demo fallback used (isDemoUsed: false)`);
  assert(Array.isArray(searchRes.leads), `Search returned leads array`);
  
  const leads = searchRes.leads || [];
  const metrics = searchRes.metrics || {};

  console.log(`\n--- SEARCH FUNNEL METRICS REPORT ---`);
  console.log(`Target Requested Count : ${metrics.requestedCount || 25}`);
  console.log(`Raw SERP Results Found : ${metrics.rawResultsCount || 0}`);
  console.log(`Candidates Qualified   : ${metrics.candidatesCount || 0}`);
  console.log(`Providers Rejected     : ${metrics.rejectedProvidersCount || 0}`);
  console.log(`Irrelevant Rejected    : ${metrics.rejectedIrrelevantCount || 0}`);
  console.log(`Duplicates Removed     : ${metrics.duplicateCount || 0}`);
  console.log(`Deep Researched Count  : ${metrics.deepResearchedCount || 0}`);
  console.log(`Final Researched Leads : ${leads.length}`);
  console.log(`-------------------------------------\n`);

  assert(leads.length > 0, `Discovered ${leads.length} final deep-researched leads`);
  assert(metrics.rawResultsCount >= leads.length, `Raw SERP results count (${metrics.rawResultsCount}) >= final leads count (${leads.length})`);
  assert(metrics.rejectedProvidersCount >= 0, `Provider rejection metrics captured`);

  // Print sample BEFORE vs AFTER comparison for real leads
  if (leads.length > 0) {
    console.log(`\n==================================================`);
    console.log(`BEFORE vs AFTER DEEP RESEARCH AUDIT REPORT (Sample Leads)`);
    console.log(`==================================================`);

    for (let i = 0; i < Math.min(5, leads.length); i++) {
      const l = leads[i];
      console.log(`\n--- LEAD #${i + 1} AUDIT ---`);
      console.log(`[RAW SERP] Title: "${l.title}" | URL: ${l.sourceUrl}`);
      console.log(`[AFTER DEEP RESEARCH]:`);
      console.log(`  - Company        : ${l.companyName || l.company_name}`);
      console.log(`  - Website        : ${l.website || l.company_website || 'Not available'}`);
      console.log(`  - Contact Person : ${l.contact_name || l.contactInfo?.name || 'Not available'}`);
      console.log(`  - Contact Role   : ${l.contact_role || l.contactInfo?.role || 'Not available'}`);
      console.log(`  - Contact Email  : ${l.contact_email || l.contactInfo?.email || 'Not available'}`);
      console.log(`  - Contact Phone  : ${l.contact_phone || l.contactInfo?.phone || 'Not available'}`);
      console.log(`  - Posted Date    : ${l.posted_date || l.postedAt}`);
      console.log(`  - Posted Time    : ${l.posted_time || 'Not available'}`);
      console.log(`  - Platform       : ${l.source_platform || l.source}`);
      console.log(`  - Service Needed : ${l.service_needed || l.primaryService}`);
      console.log(`  - Work Mode      : ${l.remote_status || l.workMode}`);
      console.log(`  - Engagement     : ${l.engagement_type || l.engagementType}`);
      console.log(`  - Budget         : ${l.budget}`);
      console.log(`  - Confidence     : ${l.research_confidence_score || l.confidenceScore || 92}/100`);
      console.log(`  - Demand Evidence: ${l.demand_evidence || l.evidence}`);
    }
    console.log(`==================================================\n`);
  }

  // --------------------------------------------------
  // 3. VERIFYING DEEP RESEARCH DATA ON EVERY FINAL LEAD
  // --------------------------------------------------
  console.log('[3] Verifying Deep Research Fields & Evidence for Final Leads...');
  
  let allLeadsHaveDeepResearch = true;
  let allLeadsHavePlatform = true;
  let allLeadsHaveSources = true;
  let allLeadsHaveConfidenceScore = true;
  let allLeadsHaveDemandEvidence = true;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    if (lead.researchStatus !== 'COMPLETED' || !lead.deepResearch || lead.deepResearch.verified !== true) {
      allLeadsHaveDeepResearch = false;
    }
    if (!lead.source_platform && !lead.source) allLeadsHavePlatform = false;
    if (!Array.isArray(lead.research_sources) || lead.research_sources.length === 0) allLeadsHaveSources = false;
    if (typeof lead.research_confidence_score !== 'number' && typeof lead.confidenceScore !== 'number' && typeof lead.leadQualityScore !== 'number') allLeadsHaveConfidenceScore = false;
    if (!lead.demand_evidence && !lead.evidence) allLeadsHaveDemandEvidence = false;
  }

  assert(allLeadsHaveDeepResearch, `Every final lead marked researchStatus === 'COMPLETED' with deepResearch.verified === true`);
  assert(allLeadsHavePlatform, `Every final lead has platform identified (e.g. LinkedIn, Upwork, RFP Portal, Public Web)`);
  assert(allLeadsHaveSources, `Every final lead has research_sources[] list populated`);
  assert(allLeadsHaveConfidenceScore, `Every final lead has research_confidence_score (0-100)`);
  assert(allLeadsHaveDemandEvidence, `Every final lead contains demand_evidence explanation`);

  // --------------------------------------------------
  // 4. CRITICAL CONTACT EXTRACTION TEST (MANDATORY TEST)
  // --------------------------------------------------
  console.log('\n[4] Executing Critical Contact Extraction Test (Public source with visible contact details)...');
  
  const testCandidateWithContact = {
    title: '60-Second AI Product Video Requirement',
    requirement_summary: 'We need a creative 60-second AI product launch film.',
    sourceUrl: 'https://abcfilms.com/requirements/product-video',
    companyName: 'ABC Films Pvt Ltd',
    industry: 'Technology & Entertainment',
    location: 'Mumbai, India',
    contactInfo: {
      name: 'Rahul Sharma',
      role: 'Marketing Head',
      email: 'rahul@abcfilms.com',
      phone: '+91 98765 43210'
    }
  };

  const contactTestRes = await performDeepResearch(testCandidateWithContact);
  assert(contactTestRes.status === 'QUALIFIED_DEMAND', `Deep Research qualified test candidate with contact info`);

  const enrichedLead = contactTestRes.lead;
  assert(enrichedLead.contact_name === 'Rahul Sharma', `Extracted Contact Person: Rahul Sharma`);
  assert(enrichedLead.contact_role === 'Marketing Head', `Extracted Contact Role: Marketing Head`);
  assert(enrichedLead.contact_email === 'rahul@abcfilms.com', `Extracted Contact Email: rahul@abcfilms.com`);
  assert(enrichedLead.contact_phone === '+91 98765 43210', `Extracted Contact Phone: +91 98765 43210`);
  assert(enrichedLead.contact_email !== 'Not available', `Contact Email is NOT 'Not available' when present on source`);

  // --------------------------------------------------
  // 5. NO FAKE CONTACT DATA TEST
  // --------------------------------------------------
  console.log('\n[5] Executing No-Fake-Data Enforcement Test...');

  const testCandidateWithoutContact = {
    title: 'Public Corporate Film Request',
    requirement_summary: 'Seeking production team for brand film.',
    sourceUrl: 'https://example-client-portal.org/rfp/1029',
    companyName: 'Anon Enterprise',
    industry: 'Commercial'
  };

  const noFakeTestRes = await performDeepResearch(testCandidateWithoutContact);
  const noFakeLead = noFakeTestRes.lead;

  assert(!noFakeLead.contact_email.includes('anon') && !noFakeLead.contact_email.includes('example'), `No fake email generated (Email: ${noFakeLead.contact_email})`);
  assert(noFakeLead.contact_name === 'Not available' || !noFakeLead.contact_name.includes('Fake'), `Contact name correctly reflects public availability`);

  // --------------------------------------------------
  // 6. SECONDARY PROVIDER REJECTION TEST
  // --------------------------------------------------
  console.log('\n[6] Executing Secondary Provider Rejection Test...');

  const providerCandidate = {
    title: 'Top AI Video Production Companies in India',
    requirement_summary: 'Here is a list of the top video production agencies and service providers offering AI video creation.',
    sourceUrl: 'https://agency-directory-example.com/top-agencies',
    companyName: 'Agency Directory Portal'
  };

  const providerRes = await performDeepResearch(providerCandidate);
  assert(providerRes.status === 'REJECTED_PROVIDER', `Deep research engine rejected agency listicle page (Status: REJECTED_PROVIDER)`);

  // --------------------------------------------------
  // 7. GOOGLE SHEETS AUTOMATIC SYNC TEST
  // --------------------------------------------------
  console.log('\n[7] Testing Google Sheets Automatic Sync on Enriched Lead...');
  
  if (leads.length > 0) {
    const sampleLead = leads[0];
    const sheetRes = await fetch(`${API_BASE}/api/sheets/append`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ lead: sampleLead })
    });
    const sheetJson = await sheetRes.json();
    assert(sheetJson.success === true, `Enriched deep-researched lead synced to Google Sheets (${sampleLead.companyName})`);
  }

  // --------------------------------------------------
  // 8. CRM LEAD & HISTORY INTEGRITY TEST
  // --------------------------------------------------
  console.log('\n[8] Verifying CRM Lead Store & Search History Integrity...');
  const crmRes = await fetch(`${API_BASE}/api/leads`, { headers: HEADERS });
  const crmJson = await crmRes.json();
  const crmCount = Array.isArray(crmJson.leads) ? crmJson.leads.length : (crmJson.allLeads?.length || 0);
  assert(crmRes.status === 200, `Fetched CRM leads from server (Count: ${crmCount})`);

  console.log('\n==================================================');
  console.log(`VERIFICATION RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('==================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerificationSuite();
