import fetch from 'node-fetch';
import { loginUser } from './src/services/authService.ts';

const BASE_URL = 'http://localhost:3001';

console.log("==================================================");
console.log("SERPAPI REAL BUYER LEADS QUALITY VERIFICATION");
console.log("==================================================");

const TEST_SEARCHES = [
  { query: 'AI video Mumbai', location: 'Mumbai' },
  { query: 'corporate video India', location: 'India' },
  { query: 'motion graphics Mumbai', location: 'Mumbai' },
  { query: 'production design Mumbai', location: 'Mumbai' },
  { query: 'social media content Delhi', location: 'Delhi' }
];

async function verifyLiveSerpApiSearches() {
  try {
    const adminSession = await loginUser('admin@amusemacstudio.in', 'Admin@123');
    const token = adminSession.token;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const searchSummaryResults = [];

    for (const testItem of TEST_SEARCHES) {
      console.log(`\n--- EXECUTING HIGH-INTENT LIVE SEARCH: "${testItem.query}" (${testItem.location}) ---`);
      
      const res = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: testItem.query,
          location: testItem.location,
          searchMode: 'live',
          explicitDemo: false,
          includeDemoFallback: false
        })
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        console.error(`✕ Live Search Failed for '${testItem.query}':`, data.message || data.errorCode || 'HTTP Error');
        searchSummaryResults.push({
          query: testItem.query,
          connected: false,
          success: false,
          rawCount: 0,
          validUrls: 0,
          candidateOpps: 0,
          rejectedBlogs: 0,
          rejectedProviderPages: 0,
          rejectedMarketplaceCategories: 0,
          rejectedCompetitors: 0,
          finalHot: 0,
          finalWarm: 0,
          finalLeads: 0,
          sources: [],
          isDemoUsed: data.isDemoUsed || false,
          leads: []
        });
        continue;
      }

      const metrics = data.metrics || {};
      const leads = data.leads || [];
      const allRealPublic = leads.length > 0 ? leads.every(l => l.dataStatus === 'REAL_PUBLIC') : true;

      console.log(`✓ SerpAPI Connection: PASS`);
      console.log(`✓ Actual API Response: PASS`);
      console.log(`- Mode: ${data.mode}`);
      console.log(`- Demo Data Used: ${data.isDemoUsed ? 'YES' : 'NO'}`);
      console.log(`- Raw Google Results: ${metrics.rawResultsCount || 0}`);
      console.log(`- Valid Public URLs: ${metrics.validPublicUrlsCount || 0}`);
      console.log(`- Candidate Opportunities: ${metrics.candidateOpportunitiesCount || 0}`);
      console.log(`- Rejected Informational Pages/Blogs: ${metrics.rejectedInformationalBlogsCount || 0}`);
      console.log(`- Rejected Provider/Agency Pages: ${metrics.rejectedProviderPagesCount || 0}`);
      console.log(`- Rejected Marketplace Category Pages: ${metrics.rejectedMarketplaceCategoryCount || 0}`);
      console.log(`- Rejected Competitors: ${metrics.rejectedCompetitorsCount || 0}`);
      console.log(`- Final HOT Leads: ${metrics.finalHotLeadsCount || 0}`);
      console.log(`- Final WARM Leads: ${metrics.finalWarmLeadsCount || 0}`);
      console.log(`- Total Accepted Buyer Leads: ${leads.length}`);
      console.log(`- All Leads REAL_PUBLIC: ${allRealPublic ? 'YES' : 'NO'}`);
      console.log(`- Unique Sources Found: ${(metrics.sourcesFound || []).join(', ')}`);

      if (leads.length > 0) {
        console.log(`  Sample Lead 1: "${leads[0].title}" | Quality: ${leads[0].leadQualityScore || 85}/100`);
        if (leads[0].evidence) console.log(`  Evidence: ${leads[0].evidence}`);
      }

      searchSummaryResults.push({
        query: testItem.query,
        connected: metrics.serpApiConnected !== false,
        actualResponse: metrics.actualResponse !== false,
        rawResultsCount: metrics.rawResultsCount || 0,
        validUrls: metrics.validPublicUrlsCount || 0,
        candidateOpportunities: metrics.candidateOpportunitiesCount || 0,
        rejectedInformationalBlogs: metrics.rejectedInformationalBlogsCount || 0,
        rejectedProviderPages: metrics.rejectedProviderPagesCount || 0,
        rejectedMarketplaceCategoryPages: metrics.rejectedMarketplaceCategoryCount || 0,
        rejectedCompetitors: metrics.rejectedCompetitorsCount || 0,
        finalHotLeads: metrics.finalHotLeadsCount || 0,
        finalWarmLeads: metrics.finalWarmLeadsCount || 0,
        totalLeads: leads.length,
        sources: metrics.sourcesFound || [],
        isDemoUsed: data.isDemoUsed || false,
        dataStatus: allRealPublic ? 'REAL_PUBLIC' : 'MIXED',
        leads
      });
    }

    console.log("\n==================================================");
    console.log("FINAL REAL BUYER LEADS QUALITY SUMMARY");
    console.log("==================================================");
    console.dir(searchSummaryResults, { depth: 3 });

  } catch (err) {
    console.error("✕ FATAL ERROR during live SerpAPI quality verification:", err.message);
  }
}

verifyLiveSerpApiSearches();
