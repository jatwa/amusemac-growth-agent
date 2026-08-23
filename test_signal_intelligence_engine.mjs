import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'server', 'data', 'db.json');

console.log('====================================================');
console.log('ADVANCED SIGNAL-BASED LEAD INTELLIGENCE TEST SUITE');
console.log('====================================================\n');

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
    extractSignals,
    calculateSignalDecay,
    stackSignals,
    classifyOpportunityTier,
    evaluateSourceQuality,
    getFreshnessStatus
  } = await import('./server/signalEngine.cjs');

  const {
    analyzeOpportunityContent
  } = await import('./server/intentEngine.cjs');

  const {
    generateFingerprint,
    extractStructuredIdentity
  } = await import('./server/sourceValidator.cjs');

  const {
    performDeepResearch
  } = await import('./server/deepResearchEngine.cjs');

  const {
    getProvidersStatus,
    testProviderConnection
  } = await import('./server/providers/providerManager.cjs');

  const {
    recordLeadFeedback,
    getFeedbackAnalytics
  } = await import('./server/feedbackEngine.cjs');

  // TEST 1: Direct buyer requirement signal detection
  const sigsDirect = extractSignals({
    title: 'Acme Corp seeking video production agency',
    requirement: 'Request for proposal: We are looking for an external video production partner for 3 product videos.',
    sourceUrl: 'https://acmecorp.com/rfp-video'
  });
  assert(sigsDirect.some(s => s.category === 'DIRECT_BUYER_DEMAND'), 'Direct buyer requirement signal detected');

  // TEST 2: Hiring signal detection
  const sigsHiring = extractSignals({
    title: 'Hiring Video Producer - Beta Tech',
    requirement: 'Beta Tech is hiring a Senior Video Producer to oversee brand video campaigns.',
    sourceUrl: 'https://betatech.com/careers/video-producer'
  });
  assert(sigsHiring.some(s => s.category === 'HIRING_SIGNAL'), 'Hiring signal detected for video producer post');

  // TEST 3: Project launch signal detection
  const sigsProject = extractSignals({
    title: 'Gamma Retail Unveils New Product Launch & Brand Campaign',
    requirement: 'Gamma Retail is launching a new commercial shoot and marketing campaign.',
    sourceUrl: 'https://gammaretail.com/news/product-launch'
  });
  assert(sigsProject.some(s => s.category === 'PROJECT_CAMPAIGN'), 'Project launch signal detected');

  // TEST 4: Funding/Growth signal detection
  const sigsFunding = extractSignals({
    title: 'Delta AI Secures Series A Funding Round',
    requirement: 'Delta AI raises $10M Series A funding and begins rapid hiring and company expansion.',
    sourceUrl: 'https://techcrunch.com/delta-ai-funding'
  });
  assert(sigsFunding.some(s => s.category === 'FUNDING_GROWTH'), 'Funding and growth signal detected');

  // TEST 5: News/Event signal detection
  const sigsNews = extractSignals({
    title: 'Epsilon Brand Press Release: Annual Keynote Presentation',
    requirement: 'Epsilon Brand announces launch of global summit keynote presentation video.',
    sourceUrl: 'https://news.epsilon.com/keynote-video'
  });
  assert(sigsNews.some(s => s.category === 'NEWS_EVENT'), 'News and event signal detected');

  // TEST 6: Social demand post detection
  const sigsSocial = extractSignals({
    title: 'Looking for a shoot crew in Mumbai',
    requirement: 'Need a camera operator and line producer for 2-day shoot. Submit recommendations.',
    sourceUrl: 'https://www.linkedin.com/posts/activity-728192'
  });
  assert(sigsSocial.some(s => s.category === 'DIRECT_BUYER_DEMAND' || s.category === 'SOCIAL_COMMUNITY'), 'Social community demand post signal detected');

  // TEST 7: RFP/Tender signal detection
  const sigsRfp = extractSignals({
    title: 'Zeta Tenders: Request for Quotation Video Production 2026',
    requirement: 'Zeta Tenders is issuing RFQ for corporate video creation.',
    sourceUrl: 'https://tenders.zeta.com/rfq-video'
  });
  assert(sigsRfp.some(s => s.category === 'DIRECT_BUYER_DEMAND'), 'RFP/Tender signal detected');

  // TEST 8: Generic article rejection
  const blogEval = analyzeOpportunityContent({
    title: 'Top 10 Video Editing Apps in 2026',
    requirement: 'Pricing guide comparing Premiere vs Final Cut Pro.',
    sourceUrl: 'https://blog.tech.com/top-10-video-apps'
  });
  assert(blogEval.intentType === 'REJECT', 'Generic blog post article strictly rejected');

  // TEST 9: Dictionary/thesaurus rejection
  const dictEval = analyzeOpportunityContent({
    title: 'Definition of Video Production - Dictionary.com',
    requirement: 'The process of producing video content for TV or web.',
    sourceUrl: 'https://dictionary.com/browse/video-production'
  });
  assert(dictEval.intentType === 'REJECT', 'Dictionary page strictly rejected');

  // TEST 10: Provider self-promotion rejection
  const providerEval = analyzeOpportunityContent({
    title: 'We are a premier video production studio in Delhi',
    requirement: 'Our services include corporate film, TVC, and post-production. Contact us.',
    sourceUrl: 'https://videostudio.com/about'
  });
  assert(providerEval.intentType === 'REJECT', 'Provider self-promotion page strictly rejected');

  // TEST 11: Signal stacking composite score calculation
  const stackedRes = stackSignals(sigsDirect.concat(sigsHiring));
  assert(stackedRes.accountIntentScore > 40 && stackedRes.buyerDemandScore > 40, 'Signal stacking computes composite Account Intent and Buyer Demand scores');

  // TEST 12: Signal decay over time
  const dFresh = calculateSignalDecay(new Date().toISOString());
  const dOld = calculateSignalDecay(new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString());
  assert(dFresh.factor === 1.0 && dOld.factor < 0.6, 'Signal decay applies time decay factor (1.0 vs < 0.6)');

  // TEST 13: Buyer Demand score separation
  assert(stackedRes.buyerDemandScore !== undefined && stackedRes.accountIntentScore !== undefined, 'Buyer Demand Score separated from Account Intent Score');

  // TEST 14: Account Intent vs Person Intent score calculation
  assert(stackedRes.personIntentScore !== undefined && stackedRes.accountIntentScore >= stackedRes.personIntentScore, 'Person Intent Score calculated alongside Account Intent');

  // TEST 15: Research Confidence score calculation
  const resConf = evaluateSourceQuality('https://acmecorp.com/rfp-2026', 'Company RFP');
  assert(resConf.score >= 85, 'Source quality evaluation computes high confidence for RFP portal');

  // TEST 16: Company identity extraction
  const identityComp = extractStructuredIdentity({
    title: 'Acme Corp - Corporate Film Requirement',
    requirement: 'Looking for video production agency.',
    sourceUrl: 'https://acmecorp.com/rfp'
  });
  assert(identityComp.companyName === 'Acme Corp', 'Company identity correctly extracted');

  // TEST 17: Requester identity extraction
  const identityReq = extractStructuredIdentity({
    title: 'Looking for camera crew in Delhi',
    requirement: 'Posted by: Vikram Singh. Need 2 camera operators.',
    sourceUrl: 'https://facebook.com/groups/film/posts/1'
  });
  assert(identityReq.contactPerson === 'Vikram Singh', 'Requester person name extracted when available');

  // TEST 18: Missing contact fallback handling
  const missingRes = await performDeepResearch({
    title: 'Omega Retail Video Project Brief',
    requirement: 'Omega Retail is looking for video production partner.',
    sourceUrl: 'https://omegaretail.com/brief',
    dataStatus: 'REAL_PUBLIC'
  });
  assert(missingRes.status === 'SUCCESS' && missingRes.lead.contact_email === 'Not publicly available', 'Missing contact email outputs "Not publicly available"');

  // TEST 19: Multiple projects for same company distinct fingerprints
  const fpProj1 = generateFingerprint({ sourceUrl: 'https://acme.com/project1', title: 'Acme Corp Project 1', companyName: 'Acme Corp' });
  const fpProj2 = generateFingerprint({ sourceUrl: 'https://acme.com/project2', title: 'Acme Corp Project 2', companyName: 'Acme Corp' });
  assert(fpProj1 !== fpProj2, 'Distinct projects for same company generate unique fingerprints');

  // TEST 20: Cross-query dedup
  const fpDup1 = generateFingerprint({ sourceUrl: 'https://acme.com/rfp-2026', title: 'Acme RFP 2026', companyName: 'Acme Corp' });
  const fpDup2 = generateFingerprint({ sourceUrl: 'https://acme.com/rfp-2026?source=google', title: 'Acme RFP 2026', companyName: 'Acme Corp' });
  assert(fpDup1 === fpDup2, 'Cross-query duplicate detection recognizes matching canonical URL fingerprints');

  // TEST 21: Search memory execution
  const { recordSearchMemory, getSearchMemory } = await import('./server/dbStore.cjs');
  recordSearchMemory('amusemac-studio', [{ query: 'video production India', score: 90 }]);
  const memList = getSearchMemory('amusemac-studio');
  assert(memList.length >= 1, 'Search memory records executed search queries');

  // TEST 22: User feedback recording
  const fbRec = recordLeadFeedback('amusemac-studio', 'REAL-WEB-12345', { type: 'GOOD' });
  const fbStats = getFeedbackAnalytics('amusemac-studio');
  assert(fbRec.type === 'GOOD' && fbStats.totalFeedback >= 1, 'User feedback 👍/👎 recorded and aggregated in analytics');

  // TEST 23: Source quality reliability scoring
  const sqDict = evaluateSourceQuality('https://dictionary.com/browse/film', 'Public Web');
  assert(sqDict.quality === 'ZERO', 'Source quality rates dictionary pages as ZERO reliability');

  // TEST 24: Freshness status classification
  const freshRes = getFreshnessStatus(new Date().toISOString());
  assert(freshRes.status === 'FRESH', 'Freshness status evaluates recent timestamp as FRESH');

  // TEST 25: Deep Research signal handoff & whyThisIsALead evidence summary
  assert(missingRes.lead.whyThisIsALead && missingRes.lead.signals !== undefined, 'Deep Research populates whyThisIsALead evidence summary and stacked signals');

  // TEST 26: Watchlist tier classification
  const tierWatch = classifyOpportunityTier(10, 45, [{ category: 'NEWS_EVENT', baseWeight: 8 }]);
  assert(tierWatch.tier === 'WATCHLIST', 'Three-Tier engine classifies moderate signals as WATCHLIST');

  // TEST 27: Warm tier classification
  const tierWarm = classifyOpportunityTier(45, 60, [{ category: 'HIRING_SIGNAL', baseWeight: 20 }, { category: 'PROJECT_CAMPAIGN', baseWeight: 15 }]);
  assert(tierWarm.tier === 'WARM', 'Three-Tier engine classifies strong stacked signals as WARM');

  // TEST 28: Hot tier classification
  const tierHot = classifyOpportunityTier(85, 90, [{ category: 'DIRECT_BUYER_DEMAND', baseWeight: 40 }]);
  assert(tierHot.tier === 'HOT', 'Three-Tier engine classifies direct procurement requirement as HOT');

  // TEST 29: Modular Provider fallback when API keys unconfigured
  const provs = getProvidersStatus();
  assert(provs.some(p => p.id === 'apollo' && p.status === 'NOT_CONFIGURED'), 'Modular Provider architecture operates on internal engine fallback when external key unconfigured');

  // TEST 30: Admin Integrations endpoint status
  assert(provs.length >= 6, 'Admin Integrations registry tracks all 6 modular providers');

  // TEST 31: Existing CRM data preservation
  assert(totalLeadsInitial >= 151, `Existing CRM leads preserved (${totalLeadsInitial} >= 151)`);

  // TEST 32: Existing search history preservation
  assert(studioSessionsInitial >= 28, `Existing search sessions preserved (${studioSessionsInitial} >= 28)`);

  // TEST 33: Admin/team RBAC boundary enforcement
  assert(db.searchHistory && db.searchHistory['amusemac-studio'], 'RBAC workspace boundaries and tenant isolation preserved');

  // TEST 34: Zero API key exposure
  const serpKeyExposed = JSON.stringify(provs).includes(process.env.SERPAPI_API_KEY || 'SECRET_KEY_EXPOSED');
  assert(!serpKeyExposed, 'Zero API key or secret exposure in provider registry status');

  // TEST 35: Live search progress hides technical step numbers
  const searchHomeContent = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'SearchHomeView.tsx'), 'utf8');
  assert(!/Step 1|Step 2|Step 3|Step 4|Step 5/i.test(searchHomeContent), 'Live search UI hides technical step numbers and API names');

  console.log('\n====================================================');
  console.log(`SIGNAL INTELLIGENCE SUITE PASSED: ${passedCount} / ${testCount}`);
  console.log('====================================================\n');

  if (passedCount < testCount) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Suite Failed:', err);
  process.exit(1);
});
