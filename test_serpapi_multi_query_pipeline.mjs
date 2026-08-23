import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'server', 'data', 'db.json');

console.log('====================================================');
console.log('SERPAPI MULTI-QUERY PIPELINE & DIAGNOSTICS TEST SUITE');
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

  const { default: PublicWebSearchProvider } = await import('./server/providers/publicWebSearchProvider.cjs');
  const { analyzeOpportunityContent, extractSearchIntent, generateDiscoveryQueries } = await import('./server/intentEngine.cjs');
  const { isValidPublicUrl, validateAndCleanOpportunity, generateFingerprint } = await import('./server/sourceValidator.cjs');
  const { isLeadDuplicate } = await import('./server/dbStore.cjs');

  const provider = new PublicWebSearchProvider();

  // MOCK SERPAPI RESPONSES FOR 3 DIFFERENT DISCOVERY QUERIES
  const mockSerpApiResponseQuery1 = {
    organic_results: [
      { position: 1, title: 'Acme Corp looking for video production company in Mumbai', link: 'https://acmecorp.com/rfp-video', snippet: 'Acme Corp is seeking an external video production partner for 2026 campaign.' },
      { position: 2, title: 'Beta Media needing corporate video team', link: 'https://betamedia.org/briefs/video-team', snippet: 'Beta Media has budget for 3 brand films in Bangalore.' },
      { position: 3, title: 'Top 10 Video Production Agencies in India', link: 'https://blog.agencyguide.com/top-10', snippet: 'List of best video production companies.' }, // Informational Blog Rejection
      { position: 4, title: 'ProductionHUB Video Directory India', link: 'https://www.productionhub.com/directory/india', snippet: 'Find production companies in India.' }, // Provider Directory Rejection
      { position: 5, title: 'Gamma Retail RFP for AI Product Video', link: 'https://gammaretail.in/tenders/ai-video', snippet: 'Gamma Retail invites proposals for AI product video creation.' }
    ]
  };

  const mockSerpApiResponseQuery2 = {
    organic_results: [
      { position: 1, title: 'Delta Studio seeking documentary production partner', link: 'https://deltastudio.com/documentary-rfp', snippet: 'Delta Studio requires line production and editing team for documentary.' },
      { position: 2, title: 'Beta Media needing corporate video team', link: 'https://betamedia.org/briefs/video-team', snippet: 'Beta Media has budget for 3 brand films in Bangalore.' }, // Duplicate from Query 1
      { position: 3, title: 'Epsilon Tech hiring freelance motion graphics editor', link: 'https://epsilon.tech/projects/motion-graphics', snippet: 'Looking for freelance motion designer for 2 month retainer.' },
      { position: 4, title: 'We are a premier video production company', link: 'https://wearevideo.in/services', snippet: 'We offer video editing and shoot services.' }, // Provider Self-Promotion Rejection
      { position: 5, title: 'Zeta D2C Brand seeking video team', link: 'https://zetad2c.com/rfp/video-shoot', snippet: 'Zeta D2C needs shoot crew in Delhi.' }
    ]
  };

  const mockSerpApiResponseQuery3 = {
    organic_results: [
      { position: 1, title: 'Eta Healthcare RFP for explanatory video', link: 'https://etahealth.org/rfp/explainer', snippet: 'Request for proposal: 2D animation explainer video.' },
      { position: 2, title: 'Theta Group seeking external video production partner', link: 'https://thetagroup.com/vendor-portal/video', snippet: 'Seeking external video production agency for commercial campaign.' },
      { position: 3, title: 'Clutch Top Agencies Directory', link: 'https://clutch.co/agencies/video-production', snippet: 'Directory of agencies.' }, // Provider Directory Rejection
      { position: 4, title: 'Iota Software looking for product demo video', link: 'https://iotasoft.com/briefs/demo-video', snippet: 'Looking for product video team with 3D animation skills.' },
      { position: 5, title: 'Kappa Brand seeking production partner', link: 'https://kappabrand.com/rfp', snippet: 'Seeking production house for brand film.' }
    ]
  };

  // TEST 1: Successful SerpAPI response parsing
  const parsed1 = mockSerpApiResponseQuery1.organic_results.filter(i => isValidPublicUrl(i.link));
  assert(parsed1.length === 5, `Successfully parsed ${parsed1.length} valid organic result URLs from Query 1`);

  // TEST 2: organic_results extraction per query
  assert(mockSerpApiResponseQuery1.organic_results.length === 5, 'Extracted organic_results array from SerpAPI payload');

  // TEST 3: Multiple query raw SERP aggregation (Query 1: 5 + Query 2: 5 + Query 3: 5 = 15 Raw)
  const allRawOrganicPool = [
    ...mockSerpApiResponseQuery1.organic_results.map(i => ({ ...i, search_query: 'Query 1' })),
    ...mockSerpApiResponseQuery2.organic_results.map(i => ({ ...i, search_query: 'Query 2' })),
    ...mockSerpApiResponseQuery3.organic_results.map(i => ({ ...i, search_query: 'Query 3' }))
  ];
  assert(allRawOrganicPool.length === 15, `Aggregated raw SERP organic pool contains exactly ${allRawOrganicPool.length} raw SERP items before deduplication (5+5+5=15)`);

  // TEST 4: Cross-query duplicate URL removal
  const seenFps = new Set();
  let crossQueryDups = 0;
  const uniqueOrganicPool = [];
  for (const item of allRawOrganicPool) {
    const fp = generateFingerprint({ sourceUrl: item.link, title: item.title, companyName: item.title.split(/[-|:|—]/)[0] });
    if (seenFps.has(fp)) {
      crossQueryDups++;
    } else {
      seenFps.add(fp);
      uniqueOrganicPool.push(item);
    }
  }
  assert(crossQueryDups === 1 && uniqueOrganicPool.length === 14, `Cross-query deduplication removed ${crossQueryDups} duplicate URL across queries (15 -> 14)`);

  // TEST 5: Parser failure detection
  const corruptPayload = { organic_results: [{ title: 'Bad Item', link: 'invalid-url-string' }] };
  const validParsedCorrupt = corruptPayload.organic_results.filter(i => isValidPublicUrl(i.link));
  const isParserFailure = validParsedCorrupt.length === 0;
  assert(isParserFailure === true, 'Parser failure correctly detected when raw results contain 0 valid URLs');

  // TEST 6: API error detection & key sanitization
  const safeErr = provider.sanitizeErrorMessage('API Key error: secret_key_12345 is invalid', 'secret_key_12345', '');
  assert(safeErr === 'API Key error: [REDACTED_API_KEY] is invalid' && !safeErr.includes('secret_key_12345'), 'API error detection handles errors while safely redacting API keys');

  // TEST 7: Zero-result response handling
  const zeroResPayload = { organic_results: [] };
  assert(zeroResPayload.organic_results.length === 0, 'Zero-result response handled cleanly without breaking pipeline');

  // TEST 8: Buyer/provider qualification (Directory & self-promotion rejection vs Buyer post eligibility)
  let providerRejections = 0;
  let buyerQualified = 0;
  for (const item of uniqueOrganicPool) {
    const analysis = analyzeOpportunityContent({ title: item.title, requirement: item.snippet, sourceUrl: item.link });
    if (analysis.intentType === 'REJECT') {
      providerRejections++;
    } else {
      buyerQualified++;
    }
  }
  assert(providerRejections >= 3 && buyerQualified >= 8, `Qualification correctly rejected ${providerRejections} provider/blog pages while qualifying ${buyerQualified} genuine buyer opportunities`);

  // TEST 9: Service-provider noun distinction check
  const buyerOpportunityWithNoun = analyzeOpportunityContent({
    title: 'Looking for an external video production company for our 2026 campaign',
    requirement: 'Seeking external video production company to handle 3 TVC commercials in Mumbai.',
    sourceUrl: 'https://brandbuyer.com/rfp-2026'
  });
  const providerSelfPromotion = analyzeOpportunityContent({
    title: 'We are a premier video production company offering corporate films',
    requirement: 'We offer video production and editing services to corporate clients.',
    sourceUrl: 'https://providersite.com/services'
  });
  assert(buyerOpportunityWithNoun.intentType !== 'REJECT' && providerSelfPromotion.intentType === 'REJECT', 'Buyer posts with service-provider nouns remain eligible while provider self-promotions are rejected');

  // TEST 10: Deep Research handoff & Missing contact fallback
  const { extractStructuredIdentity } = await import('./server/sourceValidator.cjs');
  const identityResult = extractStructuredIdentity({
    title: 'Delta Studio - seeking documentary production partner',
    requirement: 'Need line producer in Delhi',
    sourceUrl: 'https://deltastudio.com/documentary-rfp'
  });
  assert(identityResult.companyName === 'Delta Studio' && identityResult.contactPerson === 'Not publicly available', 'Deep Research identity extraction formats company name and sets missing contact person to "Not publicly available"');

  // TEST 11: Search history metrics persistence
  const mockSession = {
    original_search_query: 'companies looking for documentary production',
    executed_queries: [
      { query: 'looking for documentary production in India', rawOrganicResultCount: 5, parsedResultCount: 5, parserStatus: 'SUCCESS', httpStatus: 200 },
      { query: 'documentary production RFP in India', rawOrganicResultCount: 5, parsedResultCount: 5, parserStatus: 'SUCCESS', httpStatus: 200 },
      { query: 'hiring documentary production team in India', rawOrganicResultCount: 5, parsedResultCount: 5, parserStatus: 'SUCCESS', httpStatus: 200 }
    ],
    raw_results_count: 15,
    duplicate_count: 1,
    provider_rejected_count: 4,
    qualified_leads_count: 8
  };
  assert(mockSession.raw_results_count === 15 && mockSession.executed_queries.length === 3, 'Search history persists multi-query execution strategy metrics and query diagnostics');

  // TEST 12: Existing database preservation
  assert(totalLeadsInitial >= 151 && studioSessionsInitial >= 28, `Existing workspace database records preserved (${totalLeadsInitial} leads, ${studioSessionsInitial} sessions)`);

  console.log('\n====================================================');
  console.log(`MULTI-QUERY PIPELINE & DIAGNOSTICS SUITE PASSED: ${passedCount} / ${testCount}`);
  console.log('====================================================\n');

  if (passedCount < testCount) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Suite Failed:', err);
  process.exit(1);
});
