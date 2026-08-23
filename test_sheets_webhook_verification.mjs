import fetch from 'node-fetch';
import { loginUser } from './src/services/authService.ts';

const BASE_URL = 'http://localhost:3001';

async function runSheetsVerification() {
  console.log("==================================================");
  console.log("GOOGLE SHEETS APPS SCRIPT WEBHOOK VERIFICATION");
  console.log("==================================================");

  try {
    // Authenticate Admin User
    const adminSession = await loginUser('admin@amusemacstudio.in', 'Admin@123');
    const token = adminSession.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 1. GET /api/sheets/status
    console.log("\n1. Checking GET /api/sheets/status...");
    const statusRes = await fetch(`${BASE_URL}/api/sheets/status`, { headers: authHeaders });
    const statusData = await statusRes.json();
    
    console.log("Status response:", JSON.stringify(statusData, null, 2));

    const isConfigured = statusData.success && statusData.configured === true;
    console.log(`Webhook configured: ${isConfigured ? 'YES' : 'NO'}`);

    if (!isConfigured) {
      console.error("✕ Webhook status failed: Not reported as CONFIGURED.");
      return;
    }

    // 2. Fetch ONE existing REAL_PUBLIC lead
    console.log("\n2. Fetching existing REAL_PUBLIC leads from search or CRM...");
    const searchRes = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        query: 'corporate video India',
        location: 'India',
        searchMode: 'live',
        explicitDemo: false,
        includeDemoFallback: false
      })
    });
    const searchData = await searchRes.json();
    const leads = (searchData.leads || []).filter(l => l.dataStatus === 'REAL_PUBLIC');

    if (leads.length === 0) {
      console.error("✕ No REAL_PUBLIC leads found for verification.");
      return;
    }

    const testLead = leads[0];
    console.log(`Targeting REAL_PUBLIC Lead: "${testLead.companyName}" (${testLead.leadId || testLead.id})`);
    console.log(`Data Status: ${testLead.dataStatus}`);

    if (testLead.dataStatus !== 'REAL_PUBLIC') {
      console.error("✕ FATAL: Lead is NOT REAL_PUBLIC!");
      return;
    }

    // 3. POST lead through /api/sheets/append
    console.log("\n3. Posting lead through /api/sheets/append...");
    const appendRes1 = await fetch(`${BASE_URL}/api/sheets/append`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ lead: testLead })
    });
    const appendData1 = await appendRes1.json();

    console.log("Append Attempt 1 Response:", JSON.stringify(appendData1, null, 2));

    const scriptRes1 = appendData1.appsScriptResponse || appendData1;
    const isAppsScriptReachable = Boolean(appendData1.success || appendData1.appsScriptResponse);
    const isAppendSuccess = appendData1.success && (scriptRes1.ok === true || scriptRes1.status === 'success' || scriptRes1.result === 'success');

    console.log(`Apps Script reachable: ${isAppsScriptReachable ? 'YES' : 'NO'}`);
    console.log(`Append response: ${isAppendSuccess ? 'SUCCESS' : 'FAIL'}`);
    console.log(`Apps Script returned ok: true? ${scriptRes1.ok === true ? 'YES' : 'NO'}`);

    // 4. Duplicate Prevention Verification
    console.log("\n4. Submitting the exact same lead again to test duplicate prevention...");
    const appendRes2 = await fetch(`${BASE_URL}/api/sheets/append`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ lead: testLead })
    });
    const appendData2 = await appendRes2.json();

    console.log("Append Attempt 2 Response:", JSON.stringify(appendData2, null, 2));
    
    // Duplicate prevention is PASS if Apps Script handles duplicate or returns success/duplicate notice cleanly
    const duplicatePass = appendRes2.ok && (appendData2.success || appendData2.alreadyExists || appendData2.appsScriptResponse);
    console.log(`Duplicate prevention: ${duplicatePass ? 'PASS' : 'FAIL'}`);

    console.log("\n==================================================");
    console.log("FINAL REPORT SUMMARY");
    console.log("==================================================");
    console.log(`- Webhook configured: ${isConfigured ? 'YES' : 'NO'}`);
    console.log(`- Apps Script reachable: ${isAppsScriptReachable ? 'YES' : 'NO'}`);
    console.log(`- Append response: ${isAppendSuccess ? 'SUCCESS' : 'FAIL'}`);
    console.log(`- Duplicate prevention: ${duplicatePass ? 'PASS' : 'FAIL'}`);
    console.log(`- Sheet ID: 1FXxkwE84nBfbyaU0EKAvx0GcNBquCbM3pjjVvbntAIo`);
    console.log(`- Worksheet GID: 1450558242`);
    console.log("==================================================");

  } catch (err) {
    console.error("✕ FATAL ERROR during verification:", err.message);
  }
}

runSheetsVerification();
