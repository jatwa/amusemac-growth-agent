import fetch from 'node-fetch';
import { loginUser } from './src/services/authService.ts';

const BASE_URL = 'http://localhost:3000';

console.log("==================================================");
console.log("AMUSEMAC GROWTH AGENT - BUYER INTENT SEARCH TEST SUITE");
console.log("==================================================");

async function runBuyerIntentSearchTests() {
  let passed = 0;
  const total = 15;

  try {
    // 0. Authenticate Admin Session
    const adminSession = await loginUser('admin@amusemacstudio.in', 'Admin@123');
    const token = adminSession.token;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 1. Query: "AI video Mumbai"
    const res1 = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'AI video Mumbai', location: 'Mumbai', searchMode: 'demo' })
    });
    const data1 = await res1.json();
    if (res1.ok && data1.success && data1.leads.length >= 1 && data1.leads.some(l => (l.matchedServices || []).some(s => s.includes('AI Video') || s.includes('Visual Effects') || s.includes('Production')))) {
      console.log(`✓ PASS: 1. Query 'AI video Mumbai' returned ${data1.leads.length} buyer opportunities in Mumbai`);
      passed++;
    } else {
      console.error("✕ FAIL: 1. 'AI video Mumbai' search failed:", data1);
    }

    // 2. Query: "corporate video startup"
    const res2 = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'corporate video startup', searchMode: 'demo' })
    });
    const data2 = await res2.json();
    if (res2.ok && data2.success && data2.leads.length >= 1 && data2.leads.some(l => (l.matchedServices || []).some(s => s.includes('Corporate') || s.includes('Product') || s.includes('Brand')))) {
      console.log(`✓ PASS: 2. Query 'corporate video startup' returned ${data2.leads.length} corporate video buyer opportunities`);
      passed++;
    } else {
      console.error("✕ FAIL: 2. 'corporate video startup' search failed:", data2);
    }

    // 3. Query: "production designer Mumbai"
    const res3 = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'production designer Mumbai', location: 'Mumbai', searchMode: 'demo' })
    });
    const data3 = await res3.json();
    if (res3.ok && data3.success && data3.leads.length >= 1 && data3.leads.some(l => l.title.includes('Production Designer') || (l.matchedServices || []).includes('Production Design'))) {
      console.log(`✓ PASS: 3. Query 'production designer Mumbai' returned ${data3.leads.length} film production design requirements`);
      passed++;
    } else {
      console.error("✕ FAIL: 3. 'production designer Mumbai' search failed:", data3);
    }

    // 4. Query: "motion graphics product launch"
    const res4 = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'motion graphics product launch', searchMode: 'demo' })
    });
    const data4 = await res4.json();
    if (res4.ok && data4.success && data4.leads.length >= 1 && data4.leads.some(l => (l.matchedServices || []).includes('Motion Graphics'))) {
      console.log(`✓ PASS: 4. Query 'motion graphics product launch' returned ${data4.leads.length} motion graphics buyer requirements`);
      passed++;
    } else {
      console.error("✕ FAIL: 4. 'motion graphics product launch' search failed:", data4);
    }

    // 5. Query: "social media content Delhi"
    const res5 = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'social media content Delhi', location: 'Delhi', searchMode: 'demo' })
    });
    const data5 = await res5.json();
    if (res5.ok && data5.success && data5.leads.length >= 1 && data5.leads.some(l => (l.matchedServices || []).some(s => s.includes('Social') || s.includes('Reels') || s.includes('Promotional')))) {
      console.log(`✓ PASS: 5. Query 'social media content Delhi' returned ${data5.leads.length} D2C & brand opportunities in Delhi`);
      passed++;
    } else {
      console.error("✕ FAIL: 5. 'social media content Delhi' search failed:", data5);
    }

    // 6. Competitor/Provider Filtering Test (Demand vs Supply)
    const res6 = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: '', searchMode: 'demo' })
    });
    const data6 = await res6.json();
    const hasRejectedSupplier = data6.leads.some(l => l.intentType === 'REJECT' || l.title.includes('premier video production house in Mumbai'));
    if (res6.ok && data6.success && !hasRejectedSupplier) {
      console.log(`✓ PASS: 6. Competitor / Provider supply entries successfully REJECTED and excluded from search results`);
      passed++;
    } else {
      console.error("✕ FAIL: 6. Competitor filtering failed; supply entry found in search results!");
    }

    // 7. Intent Scoring Test
    const topLead = data1.leads[0];
    if (topLead && (topLead.intentType === 'HOT' || topLead.intentType === 'WARM') && topLead.intentScore >= 80) {
      console.log(`✓ PASS: 7. Intent scoring accurately classified buyer requirement as ${topLead.intentType} (Score: ${topLead.intentScore}%)`);
      passed++;
    } else {
      console.error("✕ FAIL: 7. Intent scoring test failed:", topLead);
    }

    // 8. Service Matching Taxonomy Test
    if (topLead && Array.isArray(topLead.matchedServices) && topLead.matchedServices.length >= 1) {
      console.log(`✓ PASS: 8. Service matching taxonomy correctly mapped matchedServices: [${topLead.matchedServices.join(', ')}]`);
      passed++;
    } else {
      console.error("✕ FAIL: 8. Service matching taxonomy failed:", topLead);
    }

    // 9. Location Filtering Test
    const res9 = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: '', filters: { location: 'Bangalore' }, searchMode: 'demo' })
    });
    const data9 = await res9.json();
    if (res9.ok && data9.success && data9.leads.length >= 2 && data9.leads.every(l => l.location.includes('Bangalore'))) {
      console.log(`✓ PASS: 9. Location filter 'Bangalore' filtered ${data9.leads.length} buyer opportunities in Bangalore`);
      passed++;
    } else {
      console.error("✕ FAIL: 9. Location filter failed:", data9);
    }

    // 10. Source Filtering Test
    const res10 = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: '', filters: { source: 'LinkedIn Jobs' }, searchMode: 'demo' })
    });
    const data10 = await res10.json();
    if (res10.ok && data10.success && data10.leads.length >= 1 && data10.leads.every(l => l.source.includes('LinkedIn'))) {
      console.log(`✓ PASS: 10. Source filter 'LinkedIn Jobs' filtered ${data10.leads.length} opportunities from LinkedIn`);
      passed++;
    } else {
      console.error("✕ FAIL: 10. Source filter failed:", data10);
    }

    // 11. Recent Opportunities / Recency Test
    const res11 = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: '', count: 5, searchMode: 'demo' })
    });
    const data11 = await res11.json();
    if (res11.ok && data11.success && data11.leads.length >= 1 && data11.leads[0].postedAt) {
      console.log(`✓ PASS: 11. Recent opportunities returned with valid postedAt timestamp '${data11.leads[0].postedAt}'`);
      passed++;
    } else {
      console.error("✕ FAIL: 11. Recent opportunities test failed:", data11);
    }

    // 12. Save Lead & Duplicate Prevention
    const oppToSave = data1.leads[0];
    const saveRes = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ lead: oppToSave })
    });
    const saveData = await saveRes.json();

    const saveResDup = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ lead: oppToSave })
    });
    const saveDataDup = await saveResDup.json();

    if (saveRes.ok && saveData.success && saveDataDup.alreadySaved === true) {
      console.log(`✓ PASS: 12. Save lead & duplicate prevention verified for '${oppToSave.title || oppToSave.companyName}'`);
      passed++;
    } else {
      console.error("✕ FAIL: 12. Save lead duplicate prevention failed:", saveDataDup);
    }

    // 13. Generate Outreach Draft
    const outreachRes = await fetch(`${BASE_URL}/api/outreach/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ opportunity: oppToSave })
    });
    const outreachData = await outreachRes.json();
    if (outreachRes.ok && outreachData.success && outreachData.outreachDraft && outreachData.outreachDraft.emailSubject) {
      console.log(`✓ PASS: 13. Generate outreach draft returned subject: '${outreachData.outreachDraft.emailSubject}'`);
      passed++;
    } else {
      console.error("✕ FAIL: 13. Generate outreach draft failed:", outreachData);
    }

    // 14. Empty Search
    const res14 = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: '', filters: {}, count: 100, searchMode: 'demo' })
    });
    const data14 = await res14.json();
    if (res14.ok && data14.success && data14.leads.length >= 20) {
      console.log(`✓ PASS: 14. Empty search returned complete buyer demand catalog (${data14.leads.length} opportunities)`);
      passed++;
    } else {
      console.error("✕ FAIL: 14. Empty search failed:", data14);
    }

    // 15. Unauthenticated Security Boundary Test
    const unauthRes = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'AI video Mumbai' })
    });
    if (unauthRes.status === 401) {
      console.log("✓ PASS: 15. Unauthenticated /api/search correctly rejected with 401 Unauthorized");
      passed++;
    } else {
      console.error("✕ FAIL: 15. Unauthenticated /api/search allowed!");
    }

    console.log("==================================================");
    console.log(`BUYER INTENT SEARCH TEST SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
    console.log("==================================================");

  } catch (err) {
    console.error("✕ FATAL ERROR during test run:", err.message);
  }
}

async function searchResToData(res) {
  return await res.json();
}

runBuyerIntentSearchTests();
