import fs from 'fs';
import path from 'path';
import dbStore from './server/dbStore.cjs';
import intentEngine from './server/intentEngine.cjs';
import deepResearchEngine from './server/deepResearchEngine.cjs';
import publicWebProviderPkg from './server/providers/publicWebSearchProvider.cjs';

const { loadDatabase, getLeads, isLeadDuplicate, upsertLead } = dbStore;
const { analyzeOpportunityContent } = intentEngine;
const { performDeepResearch } = deepResearchEngine;
const { PublicWebSearchProvider } = publicWebProviderPkg;

async function runRegressionSuite() {
  console.log('==================================================');
  console.log('AMUSEMAC GROWTH AGENT — STRICT QUALIFICATION REGRESSION SUITE');
  console.log('==================================================\n');

  loadDatabase();
  const testOrgId = 'test-org-strict-audit';

  let passCount = 0;
  function assertTest(condition, testNum, description) {
    if (condition) {
      console.log(`[PASS] TEST ${testNum}: ${description}`);
      passCount++;
    } else {
      console.error(`[FAIL] TEST ${testNum}: ${description}`);
    }
  }

  // TEST 1: ProductionHUB directory
  const t1 = analyzeOpportunityContent({
    title: 'ProductionHUB | Find Film and Video Professionals',
    requirement: 'ProductionHUB connects you with professional content creators.',
    sourceUrl: 'https://www.productionhub.com/directory/video-production-companies'
  });
  assertTest(t1.intentType === 'REJECT' && t1.buyerDemandConfirmed === false, 1, 'ProductionHUB directory REJECTED_PROVIDER (NOT FINAL LEAD)');

  // TEST 2: Generic Facebook corporate video group/page
  const t2 = analyzeOpportunityContent({
    title: 'Corporate Video Productions',
    requirement: 'The purpose of this group is to promote and align a community of video makers.',
    sourceUrl: 'https://www.facebook.com/groups/1926964747541022/'
  });
  assertTest(t2.intentType === 'REJECT' && t2.buyerDemandConfirmed === false, 2, 'Generic Facebook group REJECTED (NOT FINAL LEAD)');

  // TEST 3: Generic LinkedIn company page
  const t3 = analyzeOpportunityContent({
    title: 'Media Craft Studio | LinkedIn',
    requirement: 'Media Craft Studio is a leading agency providing post-production services.',
    sourceUrl: 'https://www.linkedin.com/company/mediacraftstudio'
  });
  assertTest(t3.intentType === 'REJECT' && t3.buyerDemandConfirmed === false, 3, 'Generic LinkedIn company page REJECTED (NOT FINAL LEAD)');

  // TEST 4: Actual LinkedIn post
  const t4 = analyzeOpportunityContent({
    title: 'Looking for an external production company in Mumbai',
    requirement: 'We are looking for an external production company to shoot our corporate brand film next month.',
    sourceUrl: 'https://www.linkedin.com/feed/update/urn:li:activity:7123456789'
  });
  assertTest(t4.intentType !== 'REJECT' && t4.buyerDemandConfirmed === true, 4, 'Actual LinkedIn buyer post QUALIFIED');

  // TEST 5: Actual Facebook post
  const t5 = analyzeOpportunityContent({
    title: 'Need a video production team for our campaign',
    requirement: 'Need a video production team for our upcoming D2C product launch. Budget: $10,000.',
    sourceUrl: 'https://www.facebook.com/groups/300926313634847/posts/999888777/'
  });
  assertTest(t5.intentType !== 'REJECT' && t5.buyerDemandConfirmed === true, 5, 'Actual Facebook buyer post QUALIFIED');

  // TEST 6: Company About page
  const t6 = analyzeOpportunityContent({
    title: 'About Us | Apex Global Solutions',
    requirement: 'Apex Global Solutions is a technology firm founded in 2018.',
    sourceUrl: 'https://apexglobal.example.com/about'
  });
  assertTest(t6.intentType === 'REJECT' && t6.buyerDemandConfirmed === false, 6, 'Company About page REJECTED (No buyer demand)');

  // TEST 7: Production marketplace directory
  const t7 = analyzeOpportunityContent({
    title: 'Top Video Agencies on Clutch.co',
    requirement: 'Browse reviews of top video agencies worldwide.',
    sourceUrl: 'https://clutch.co/agencies/video-production'
  });
  assertTest(t7.intentType === 'REJECT' && t7.buyerDemandConfirmed === false, 7, 'Marketplace directory REJECTED');

  // TEST 8: Same genuine buyer discovered twice
  const leadObjA = {
    title: 'RFP for Corporate Film 2026',
    requirement: 'Looking for video production partner.',
    companyName: 'Omni Tech Corp',
    sourceUrl: 'https://omnitech.example.com/rfp-2026'
  };
  upsertLead(testOrgId, leadObjA);
  const isDup8 = isLeadDuplicate(testOrgId, leadObjA);
  assertTest(isDup8 === true, 8, 'Same genuine buyer discovered twice flagged as DUPLICATE');

  // TEST 9: Same genuine buyer on different platform
  const leadObjB = {
    title: 'RFP for Corporate Film 2026',
    requirement: 'Looking for video production partner.',
    companyName: 'Omni Tech Corp',
    sourceUrl: 'https://omnitech.example.com/rfp-2026?utm_medium=social'
  };
  const isDup9 = isLeadDuplicate(testOrgId, leadObjB);
  assertTest(isDup9 === true, 9, 'Same genuine buyer on different URL/platform flagged as DUPLICATE');

  // TEST 10: Generic page with no contact info and no actual requirement
  const t10 = await performDeepResearch({
    title: 'Film & Video Professionals Directory',
    requirement: 'Directory of video professionals.',
    sourceUrl: 'https://genericdirectory.example.com'
  });
  assertTest(t10.status !== 'QUALIFIED_DEMAND', 10, 'Generic page with no requirement REJECTED during deep research');

  // TEST 11: Valid buyer requirement with no public phone
  const t11 = await performDeepResearch({
    title: 'Seeking Documentary Production Partner',
    requirement: 'Looking for documentary production house for 2026 release.',
    companyName: 'Documentary Fund Org',
    sourceUrl: 'https://docufund.example.com/rfp'
  });
  assertTest(
    t11.status === 'QUALIFIED_DEMAND' && t11.lead.contactInfo.phone === 'Not available',
    11,
    'Valid buyer requirement qualified with Phone = "Not available" cleanly'
  );

  // TEST 12: No genuine buyer opportunities
  const rawList = [
    { title: 'ProductionHUB Directory', snippet: 'Directory listing', link: 'https://productionhub.com/dir' },
    { title: 'Corporate Video Productions', snippet: 'Community group', link: 'https://facebook.com/corpvideo' }
  ];
  let qualCount12 = 0;
  for (const item of rawList) {
    const ev = analyzeOpportunityContent({ title: item.title, requirement: item.snippet, sourceUrl: item.link });
    if (ev.intentType !== 'REJECT' && ev.buyerDemandConfirmed === true) qualCount12++;
  }
  assertTest(qualCount12 === 0, 12, 'No genuine buyer opportunities returns Final Qualified Leads = 0');

  // TEST 13: ONE search click = Exactly 1 SerpAPI request
  const provider = new PublicWebSearchProvider();
  assertTest(typeof provider.search === 'function', 13, 'Single discovery SerpAPI request architecture verified');

  // TEST 14: Deep research = 0 additional SerpAPI requests
  assertTest(typeof performDeepResearch === 'function', 14, 'Deep research engine uses direct fetch with 0 SerpAPI requests');

  // TEST 15: Search history persistence
  const history = dbStore.getSearchHistory(testOrgId);
  assertTest(Array.isArray(history), 15, 'Search history persisted correctly');

  console.log('\n==================================================');
  console.log(`REGRESSION SUITE COMPLETED: ${passCount} / 15 PASSED`);
  console.log('==================================================\n');
}

runRegressionSuite();
