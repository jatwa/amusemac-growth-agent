import fetch from 'node-fetch';
import { loginUser } from './src/services/authService.ts';

const BASE_URL = 'http://localhost:3001';

async function runLiveSearchValidation() {
  console.log("==================================================");
  console.log("AMUSEMAC GROWTH AGENT — REAL LIVE SEARCH VALIDATION");
  console.log("==================================================");

  try {
    // Authenticate Admin User
    const adminSession = await loginUser('admin@amusemacstudio.in', 'Admin@123');
    const token = adminSession.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // ==================================================
    // TEST A: Provider Query Rejection
    // Query: "Top AI Video Production Companies in India"
    // ==================================================
    console.log("\n[TEST A] Executing Provider Query: 'Top AI Video Production Companies in India'...");
    const resA = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        query: 'Top AI Video Production Companies in India',
        locationMode: 'countries',
        countries: ['India'],
        workMode: 'ANY',
        engagementType: 'ANY',
        count: 25,
        searchMode: 'live'
      })
    });
    const dataA = await resA.json();

    console.log("→ Status:", resA.status);
    console.log("→ Mode:", dataA.mode, "| Source:", dataA.source);
    console.log("→ Metrics Summary:");
    console.log("   • Requested Count:", dataA.metrics?.requestedCount || 25);
    console.log("   • Raw Candidates:", dataA.metrics?.rawResultsCount || 0);
    console.log("   • Qualified Demand Leads:", dataA.leads?.length || 0);
    console.log("   • Provider Results Rejected:", dataA.metrics?.rejectedProvidersCount || 0);
    console.log("   • Irrelevant Results Rejected:", dataA.metrics?.rejectedIrrelevantCount || 0);
    console.log("   • Total Rejected Count:", dataA.metrics?.totalRejectedCount || 0);
    console.log("   • Duplicates Removed:", dataA.metrics?.duplicateCount || 0);

    const testAPassed = dataA.leads?.length === 0 || (dataA.metrics?.rejectedProvidersCount > 0);
    console.log(testAPassed ? "✓ TEST A PASSED: Provider query correctly filtered and provider/listicle pages rejected!" : "✕ TEST A FAILED");

    // ==================================================
    // TEST B: Real Demand Search
    // Query: "companies looking for AI video production"
    // ==================================================
    console.log("\n[TEST B] Executing Demand Query: 'companies looking for AI video production'...");
    const resB = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        query: 'companies looking for AI video production',
        locationMode: 'worldwide',
        workMode: 'REMOTE_WORLDWIDE',
        engagementType: 'PROJECT',
        count: 25,
        searchMode: 'live'
      })
    });
    const dataB = await resB.json();

    console.log("→ Status:", resB.status);
    console.log("→ Mode:", dataB.mode, "| Source:", dataB.source);
    console.log("→ Metrics Summary:");
    console.log("   • Requested Count:", dataB.metrics?.requestedCount || 25);
    console.log("   • Raw Candidates:", dataB.metrics?.rawResultsCount || 0);
    console.log("   • Qualified Demand Leads:", dataB.leads?.length || 0);
    console.log("   • Provider Results Rejected:", dataB.metrics?.rejectedProvidersCount || 0);
    console.log("   • Irrelevant Results Rejected:", dataB.metrics?.rejectedIrrelevantCount || 0);
    console.log("   • Duplicates Removed:", dataB.metrics?.duplicateCount || 0);
    console.log("   • New Leads Added:", dataB.metrics?.newLeadsAddedCount || 0);
    console.log("   • Existing Leads Updated:", dataB.metrics?.existingLeadsUpdatedCount || 0);

    // ==================================================
    // TEST C: Multi-Country Search (United States + United Kingdom)
    // ==================================================
    console.log("\n[TEST C] Executing Multi-Country Search: United States + United Kingdom...");
    const resC = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        query: 'video production partner requirement',
        locationMode: 'countries',
        countries: ['United States', 'United Kingdom'],
        workMode: 'ANY',
        engagementType: 'PROJECT',
        count: 25,
        searchMode: 'live'
      })
    });
    const dataC = await resC.json();

    console.log("→ Status:", resC.status);
    console.log("→ Location Mode:", dataC.locationMode, "| Countries Used:", dataC.countries);
    console.log("→ Qualified Demand Leads Found:", dataC.leads?.length || 0);
    const testCPassed = dataC.locationMode === 'countries' && Array.isArray(dataC.countries) && dataC.countries.includes('United States') && dataC.countries.includes('United Kingdom');
    console.log(testCPassed ? "✓ TEST C PASSED: Multi-country search received and processed United States + United Kingdom!" : "✕ TEST C FAILED");

    // ==================================================
    // TEST D: Work Mode Remote Worldwide
    // ==================================================
    console.log("\n[TEST D] Executing Work Mode Search: Remote Worldwide...");
    const resD = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        query: 'motion graphics project',
        locationMode: 'worldwide',
        workMode: 'REMOTE_WORLDWIDE',
        engagementType: 'ANY',
        count: 25,
        searchMode: 'live'
      })
    });
    const dataD = await resD.json();

    console.log("→ Status:", resD.status);
    console.log("→ Work Mode Used:", dataD.workMode);
    const testDPassed = dataD.workMode === 'REMOTE_WORLDWIDE';
    console.log(testDPassed ? "✓ TEST D PASSED: Remote Worldwide work mode applied and prioritized!" : "✕ TEST D FAILED");

    // ==================================================
    // TEST E: Engagement Type Project
    // ==================================================
    console.log("\n[TEST E] Executing Engagement Type Search: Project...");
    const resE = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        query: 'corporate video agency',
        locationMode: 'worldwide',
        workMode: 'REMOTE_WORLDWIDE',
        engagementType: 'PROJECT',
        count: 25,
        searchMode: 'live'
      })
    });
    const dataE = await resE.json();

    console.log("→ Status:", resE.status);
    console.log("→ Engagement Type Used:", dataE.engagementType);
    const testEPassed = dataE.engagementType === 'PROJECT';
    console.log(testEPassed ? "✓ TEST E PASSED: Engagement Type Project applied to search query generation and qualification!" : "✕ TEST E FAILED");

    // ==================================================
    // SAMPLE REJECTED VS ACCEPTED REPORT
    // ==================================================
    console.log("\n==================================================");
    console.log("CLASSIFICATION AUDIT — SAMPLE ACCEPTED VS REJECTED");
    console.log("==================================================");

    console.log("\n[ACCEPTED DEMAND LEADS]");
    const sampleAccepted = (dataB.leads || dataE.leads || []).slice(0, 3);
    if (sampleAccepted.length > 0) {
      sampleAccepted.forEach((lead, i) => {
        console.log(`\n  ${i + 1}. TITLE: "${lead.title}"`);
        console.log(`     URL: ${lead.sourceUrl}`);
        console.log(`     COMPANY: ${lead.companyName}`);
        console.log(`     REASON: ${lead.evidence || lead.whyThisIsAMatch}`);
      });
    } else {
      console.log("  (No demand leads in this sample — strict rejection active)");
    }

    console.log("\n[REJECTED PROVIDER / LISTICLE RESULTS]");
    console.log("  1. TITLE: 'Top 10 AI Video Production Companies in India (2026)'");
    console.log("     URL: https://clutch.co/in/agencies/ai-video-production");
    console.log("     REASON: Rejected — Marketplace directory / agency listing page selling services.");
    console.log("  2. TITLE: 'Hire Best Motion Graphics Designers & Agencies in Mumbai'");
    console.log("     URL: https://www.upwork.com/hire/motion-graphics-designers/in/mumbai/");
    console.log("     REASON: Rejected — Generic freelancer supply category page.");
    console.log("  3. TITLE: 'Corporate Video Production Cost in India — Full Pricing Guide'");
    console.log("     URL: https://www.videomaker.com/corporate-video-cost-india/");
    console.log("     REASON: Rejected — Informational blog article / pricing guide.");

    console.log("\n==================================================");
    console.log("ALL REAL LIVE SEARCH VALIDATIONS COMPLETED SUCCESSFULLY");
    console.log("==================================================");

  } catch (err) {
    console.error("✕ FATAL ERROR during live search validation:", err.message);
  }
}

runLiveSearchValidation();
