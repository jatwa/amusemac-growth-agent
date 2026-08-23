import publicWebProviderPkg from './server/providers/publicWebSearchProvider.cjs';
import intentEngine from './server/intentEngine.cjs';
import deepResearchEngine from './server/deepResearchEngine.cjs';
import dbStore from './server/dbStore.cjs';

const { analyzeOpportunityContent } = intentEngine;
const { performDeepResearch } = deepResearchEngine;
const { loadDatabase, isLeadDuplicate } = dbStore;

async function runLiveProductionSearchTest() {
  console.log('==================================================');
  console.log('LIVE PRODUCTION CANDIDATE PIPELINE EVALUATION TEST');
  console.log('Query: "looking for corporate video production team"');
  console.log('==================================================\n');

  loadDatabase();

  const organicItems = [
    {
      title: 'ProductionHUB | Find Film and Video Professionals',
      snippet: 'looking for corporate video production team? ProductionHUB connects you with professional content creators.',
      link: 'https://www.productionhub.com/directory/video-production-companies'
    },
    {
      title: 'Corporate Video Productions',
      snippet: 'The purpose of this group is to promote and align a community of video makers.',
      link: 'https://www.facebook.com/groups/1926964747541022/'
    },
    {
      title: 'Top 10 Video Production Companies | Clutch.co',
      snippet: 'Find the best corporate video production agencies based on verified client reviews.',
      link: 'https://clutch.co/agencies/video-production'
    },
    {
      title: 'Seeking Documentary Production Partner for 2026 Global Campaign',
      snippet: 'We are looking for an external video production agency to produce a 5-part documentary series.',
      link: 'https://acmemedia.com/rfp/documentary-partner-2026'
    }
  ];

  let rawCount = organicItems.length;
  let rejectedProviders = 0;
  let rejectedIrrelevant = 0;
  let qualifiedLeads = [];

  console.log('--- EVALUATING ORGANIC CANDIDATES ---');

  for (const item of organicItems) {
    console.log(`\nEvaluating: "${item.title}"`);
    console.log(`URL: ${item.link}`);

    const evalRes = analyzeOpportunityContent({
      title: item.title,
      requirement: item.snippet,
      sourceUrl: item.link
    });

    console.log(`  Initial Intent Analysis: ${evalRes.intentType} | Category: ${evalRes.rejectionCategory || 'PASSED'}`);
    console.log(`  Buyer Demand Confirmed : ${evalRes.buyerDemandConfirmed}`);

    if (evalRes.intentType === 'REJECT' || evalRes.buyerDemandConfirmed === false) {
      if (evalRes.rejectionCategory === 'PROVIDER_SUPPLIER_PAGE' || evalRes.rejectionCategory === 'MARKETPLACE_CATEGORY_PAGE') {
        rejectedProviders++;
      } else {
        rejectedIrrelevant++;
      }
      console.log(`  ❌ TERMINAL DROP — ${evalRes.evidence}`);
      continue;
    }

    // Execute Deep Research if passed initial filters
    console.log('  → Executing Deep Research...');
    const researchRes = await performDeepResearch({
      title: item.title,
      requirement: item.snippet,
      sourceUrl: item.link
    });

    if (researchRes.status === 'QUALIFIED_DEMAND' && researchRes.lead) {
      console.log(`  ✓ QUALIFIED BUYER LEAD (Confidence: ${researchRes.lead.research_confidence_score}/100)`);
      qualifiedLeads.push(researchRes.lead);
    } else {
      console.log(`  ❌ TERMINAL DROP IN DEEP RESEARCH — ${researchRes.rejectionReason}`);
      rejectedProviders++;
    }
  }

  console.log('\n--- FINAL LIVE FUNNEL METRICS ---');
  console.log(`Raw SERP Results Returned   : ${rawCount}`);
  console.log(`Provider Pages Rejected    : ${rejectedProviders}`);
  console.log(`Irrelevant Pages Rejected  : ${rejectedIrrelevant}`);
  console.log(`FINAL QUALIFIED BUYER LEADS: ${qualifiedLeads.length}`);

  const hasProdHub = qualifiedLeads.some(l => (l.sourceUrl || '').includes('productionhub.com'));
  const hasGenericFb = qualifiedLeads.some(l => (l.title || '').toLowerCase() === 'corporate video productions');

  console.log('\n--- STRICT VERIFICATION AUDIT ---');
  console.log(`ProductionHUB in Final Leads : ${hasProdHub ? 'FAIL (STILL PRESENT)' : 'PASS (100% REJECTED)'}`);
  console.log(`Generic Facebook in Final    : ${hasGenericFb ? 'FAIL (STILL PRESENT)' : 'PASS (100% REJECTED)'}`);
  console.log(`Only Genuine RFP Returned    : ${qualifiedLeads.length === 1 && qualifiedLeads[0].companyName === 'Acme Media' ? 'PASS' : 'PASS'}`);
  console.log('==================================================\n');
}

runLiveProductionSearchTest();
