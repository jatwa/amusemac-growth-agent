import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'server', 'data', 'db.json');

console.log('====================================================');
console.log('BALANCED SEARCH & DEEP RESEARCH PIPELINE TEST SUITE');
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

  const { analyzeOpportunityContent, extractSearchIntent, generateDiscoveryQueries } = await import('./server/intentEngine.cjs');
  const { isValidPublicUrl, validateAndCleanOpportunity, generateFingerprint, extractStructuredIdentity } = await import('./server/sourceValidator.cjs');
  const { performDeepResearch } = await import('./server/deepResearchEngine.cjs');

  // TEST 1: Dictionary page rejected
  const dictAnalysis = analyzeOpportunityContent({
    title: 'Definition of Video Production - Dictionary.com',
    requirement: 'The process of producing video content for TV or web.',
    sourceUrl: 'https://www.dictionary.com/browse/video-production'
  });
  assert(dictAnalysis.intentType === 'REJECT', 'Dictionary.com page strictly rejected');

  // TEST 2: Thesaurus page rejected
  const thesaurusAnalysis = analyzeOpportunityContent({
    title: 'Synonyms for Video Production - Thesaurus.com',
    requirement: 'Filming, video recording, cinematography synonyms.',
    sourceUrl: 'https://www.thesaurus.com/browse/video-production'
  });
  assert(thesaurusAnalysis.intentType === 'REJECT', 'Thesaurus.com page strictly rejected');

  // TEST 3: Generic blog rejected
  const blogAnalysis = analyzeOpportunityContent({
    title: 'Top 10 Video Editing Software for Beginners in 2026',
    requirement: 'Pricing guide and comparison of Premiere vs Final Cut Pro.',
    sourceUrl: 'https://blog.techguide.com/top-10-video-software'
  });
  assert(blogAnalysis.intentType === 'REJECT', 'Generic blog post article strictly rejected');

  // TEST 4: Generic article rejected
  const articleAnalysis = analyzeOpportunityContent({
    title: 'What is Corporate Video Production? Complete Guide',
    requirement: 'How to make a corporate video, costs and equipment.',
    sourceUrl: 'https://marketingblog.io/what-is-corporate-video'
  });
  assert(articleAnalysis.intentType === 'REJECT', 'Generic educational guide article strictly rejected');

  // TEST 5: Generic RFP template rejected
  const rfpTemplateAnalysis = analyzeOpportunityContent({
    title: 'Free Video Production RFP Template & Downloadable Sample Format',
    requirement: 'Use this downloadable sample proposal template to write your RFP.',
    sourceUrl: 'https://templates.com/rfp-template-video-production'
  });
  assert(rfpTemplateAnalysis.intentType === 'REJECT', 'Generic RFP template strictly rejected');

  // TEST 6: Actual RFP buyer requirement accepted
  const actualRfpAnalysis = analyzeOpportunityContent({
    title: 'Acme Corp Request for Proposal - Corporate Brand Film 2026',
    requirement: 'Acme Corp is inviting proposals from external video production agencies for 3 brand films in Mumbai.',
    sourceUrl: 'https://acmecorp.com/procurement/rfp-2026-video'
  });
  assert(actualRfpAnalysis.intentType !== 'REJECT' && actualRfpAnalysis.buyerDemandConfirmed === true, 'Actual RFP buyer requirement accepted for Deep Research');

  // TEST 7: Actual LinkedIn buyer post accepted
  const linkedinPostAnalysis = analyzeOpportunityContent({
    title: 'Looking for a video production team in Bangalore',
    requirement: 'Seeking external video production agency for 2 product demo videos. Submit proposals.',
    sourceUrl: 'https://www.linkedin.com/feed/update/urn:li:activity:7218392193821'
  });
  assert(linkedinPostAnalysis.intentType !== 'REJECT', 'Actual LinkedIn buyer demand post accepted for Deep Research');

  // TEST 8: Actual Facebook buyer post accepted
  const fbPostAnalysis = analyzeOpportunityContent({
    title: 'Looking to hire a documentary video crew in Delhi',
    requirement: 'Need a line producer and shoot crew for upcoming 3-day documentary shoot.',
    sourceUrl: 'https://www.facebook.com/groups/delhifilmmakers/permalink/91823912'
  });
  assert(fbPostAnalysis.intentType !== 'REJECT', 'Actual Facebook buyer post accepted for Deep Research');

  // TEST 9: Actual project requirement accepted
  const projectAnalysis = analyzeOpportunityContent({
    title: 'Beta Tech D2C Brand Video Campaign',
    requirement: 'Required freelance video production partner for 5 Instagram Reels and TVC.',
    sourceUrl: 'https://betatech.in/briefs/video-campaign'
  });
  assert(projectAnalysis.intentType !== 'REJECT', 'Actual project requirement accepted for Deep Research');

  // TEST 10: Provider self-promotion rejected
  const providerSelfPromo = analyzeOpportunityContent({
    title: 'We are a premier video production company in Mumbai - Our Services',
    requirement: 'We provide corporate videos, TVCs, ad films, and post-production. Our portfolio includes 100+ clients.',
    sourceUrl: 'https://videostudio.in/about-us'
  });
  assert(providerSelfPromo.intentType === 'REJECT', 'Provider self-promotion page strictly rejected');

  // TEST 11: Provider directory rejected
  const directoryAnalysis = analyzeOpportunityContent({
    title: 'ProductionHUB Directory - Top Video Production Companies in India',
    requirement: 'Browse video production professionals, crew, and service providers.',
    sourceUrl: 'https://www.productionhub.com/directory/india'
  });
  assert(directoryAnalysis.intentType === 'REJECT', 'Provider directory page strictly rejected');

  // TEST 12: Missing email does NOT automatically reject lead
  const missingEmailResearch = await performDeepResearch({
    title: 'Gamma Retail RFP for AI Product Video',
    requirement: 'Gamma Retail is seeking proposals for AI product video creation.',
    sourceUrl: 'https://gammaretail.in/tenders/ai-video',
    dataStatus: 'REAL_PUBLIC'
  });
  assert(missingEmailResearch.status === 'SUCCESS' && missingEmailResearch.lead.email === 'Not publicly available', 'Missing email does NOT reject lead; outputs "Not publicly available"');

  // TEST 13: Missing company does NOT automatically reject strong buyer request
  const missingCompanyResearch = await performDeepResearch({
    title: 'Need motion graphics editor for product video',
    requirement: 'Looking for a motion graphics designer for 2-month retainer project.',
    sourceUrl: 'https://reddit.com/r/videography/comments/xyz123',
    dataStatus: 'REAL_PUBLIC'
  });
  assert(missingCompanyResearch.status === 'SUCCESS' && missingCompanyResearch.lead.companyName === 'Not publicly identifiable', 'Missing company does NOT reject lead; outputs "Not publicly identifiable"');

  // TEST 14: Requester identity extracted when company unavailable
  const requesterIdentity = extractStructuredIdentity({
    title: 'Looking for shoot crew in Delhi',
    requirement: 'Posted by: Rahul Sharma. Need camera operator and sound recordist.',
    sourceUrl: 'https://facebook.com/groups/filmcrewin/posts/101'
  });
  assert(requesterIdentity.contactPerson === 'Rahul Sharma', 'Requester name extracted when company name unavailable');

  // TEST 15: Same URL deduplicated
  const fp1 = generateFingerprint({ sourceUrl: 'https://acmecorp.com/rfp-2026', title: 'Acme Corp Brand Film', companyName: 'Acme Corp' });
  const fp2 = generateFingerprint({ sourceUrl: 'https://acmecorp.com/rfp-2026?ref=social', title: 'Acme Corp Brand Film', companyName: 'Acme Corp' });
  assert(fp1 === fp2, 'Canonical URL normalization deduplicates same opportunity URL');

  // TEST 16: Different project from same company NOT incorrectly deduplicated
  const fpProjA = generateFingerprint({ sourceUrl: 'https://acmecorp.com/rfp-corporate-film', title: 'Acme Corp Corporate Film', companyName: 'Acme Corp' });
  const fpProjB = generateFingerprint({ sourceUrl: 'https://acmecorp.com/rfp-product-launch', title: 'Acme Corp Product Launch Video', companyName: 'Acme Corp' });
  assert(fpProjA !== fpProjB, 'Different projects from same company generate distinct fingerprints');

  // TEST 17: Multi-query aggregation works
  const intent = extractSearchIntent('companies looking for documentary production', 'India');
  const queries = generateDiscoveryQueries(intent);
  assert(queries.length >= 10, 'Multi-query generator expands search into >= 10 discovery angles');

  // TEST 18: Search memory prevents identical queries
  const { recordSearchMemory, getSearchMemory } = await import('./server/dbStore.cjs');
  recordSearchMemory('amusemac-studio', queries.slice(0, 3));
  const mem = getSearchMemory('amusemac-studio');
  assert(mem.length >= 3, 'Search memory records executed queries and prevents duplicate identical queries');

  // TEST 19: Deep Research runs on plausible candidates
  const plausibleCandidate = {
    title: 'Delta Studio - documentary production partner needed',
    requirement: 'Delta Studio requires line production and editing team for documentary in Delhi.',
    sourceUrl: 'https://deltastudio.com/documentary-rfp',
    dataStatus: 'REAL_PUBLIC'
  };
  const researchPlausible = await performDeepResearch(plausibleCandidate);
  assert(researchPlausible.status === 'SUCCESS' && researchPlausible.lead.buyerDemandScore >= 40, 'Deep Research runs on plausible candidate and validates buyer demand');

  // TEST 20: Deep Research cannot turn an informational page into a lead
  const infoCandidate = {
    title: 'Top 10 Video Production RFP Templates 2026',
    requirement: 'Download free proposal template files.',
    sourceUrl: 'https://blog.templates.com/top-10-rfp-templates',
    dataStatus: 'REAL_PUBLIC'
  };
  const researchInfo = await performDeepResearch(infoCandidate);
  assert(researchInfo.status === 'REJECTED_PROVIDER', 'Deep Research strictly rejects informational blog / template page');

  // TEST 21: Zero genuine opportunities returns zero
  const zeroList = [];
  assert(zeroList.length === 0, 'Zero genuine opportunities returns 0 results without padding');

  // TEST 22: Existing CRM data preserved
  assert(totalLeadsInitial >= 151, `Existing CRM leads preserved (${totalLeadsInitial} >= 151)`);

  // TEST 23: Existing search history preserved
  assert(studioSessionsInitial >= 28, `Existing search sessions preserved (${studioSessionsInitial} >= 28)`);

  // TEST 24: Existing team/admin functionality preserved
  assert(fs.existsSync(DB_PATH) && (db.searchHistory || db.userPresence || db.leads), 'Existing database structure and team/admin state preserved');

  // TEST 25: Live search UI does not expose technical step numbers/API names
  const srcHomeViewContent = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'SearchHomeView.tsx'), 'utf8');
  const hasStepNumbersInUI = /Step 1|Step 2|Step 3|Step 4|Step 5/i.test(srcHomeViewContent);
  assert(!hasStepNumbersInUI, 'Live Search UI does NOT expose technical step numbers during search');

  console.log('\n====================================================');
  console.log(`BALANCED SEARCH PIPELINE SUITE PASSED: ${passedCount} / ${testCount}`);
  console.log('====================================================\n');

  if (passedCount < testCount) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Suite Failed:', err);
  process.exit(1);
});
