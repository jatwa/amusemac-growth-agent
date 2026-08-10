import { loginWithOAuthProvider, loginUser, logoutUser } from './src/services/authService.ts';
import http from 'http';

function makeApiRequest(path, method, token, customHeaders = {}, bodyData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:3001');
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path,
      method,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (bodyData) {
      req.write(JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function runSecurityHardeningTestSuite() {
  console.log("==================================================");
  console.log("CRITICAL SECURITY HARDENING VERIFICATION SUITE");
  console.log("==================================================");

  let passed = 0;
  let total = 8;

  // Setup Customer A and Amusemac Admin sessions
  logoutUser();
  const customerA = await loginWithOAuthProvider('GOOGLE', `custA.${Date.now()}@domain.com`, 'Customer A');
  const tokenA = customerA.token;

  logoutUser();
  const amusemacAdmin = await loginUser('admin@amusemacstudio.in', 'Admin@123');
  const tokenAdmin = amusemacAdmin.token;

  // TEST A: Customer A sends X-Organization-Id: amusemac-studio -> 403
  console.log("\nTEST A — Customer A Header Tamper Check (X-Organization-Id: amusemac-studio):");
  try {
    const resA = await makeApiRequest('/api/mail/status', 'GET', tokenA, { 'X-Organization-Id': 'amusemac-studio' });
    const passedA = resA.status === 403;
    console.log(`   - Status Code: ${resA.status} (Expected: 403)`);
    console.log(`   - Response: ${JSON.stringify(resA.body)}`);
    console.log(`   - Result: ${passedA ? 'PASS' : 'FAIL'}`);
    if (passedA) passed++;
  } catch (err) {
    console.log(`   - Error: ${err.message} (Server on localhost:3001 must be running)`);
  }

  // TEST B: Customer A sends ?orgId=amusemac-studio -> 403
  console.log("\nTEST B — Customer A Query Param Tamper Check (?orgId=amusemac-studio):");
  try {
    const resB = await makeApiRequest('/api/mail/status?orgId=amusemac-studio', 'GET', tokenA);
    const passedB = resB.status === 403;
    console.log(`   - Status Code: ${resB.status} (Expected: 403)`);
    console.log(`   - Result: ${passedB ? 'PASS' : 'FAIL'}`);
    if (passedB) passed++;
  } catch (err) {
    console.log(`   - Error: ${err.message}`);
  }

  // TEST C: Customer A puts { "orgId": "amusemac-studio" } in body -> 403
  console.log("\nTEST C — Customer A Body Payload Tamper Check ({ orgId: 'amusemac-studio' }):");
  try {
    const resC = await makeApiRequest('/api/mail/sync', 'POST', tokenA, {}, { orgId: 'amusemac-studio' });
    const passedC = resC.status === 403;
    console.log(`   - Status Code: ${resC.status} (Expected: 403)`);
    console.log(`   - Result: ${passedC ? 'PASS' : 'FAIL'}`);
    if (passedC) passed++;
  } catch (err) {
    console.log(`   - Error: ${err.message}`);
  }

  // TEST D: Unauthenticated Request (No Token) -> 401
  console.log("\nTEST D — Unauthenticated Request Check (No Token):");
  try {
    const resD = await makeApiRequest('/api/mail/status', 'GET', null);
    const passedD = resD.status === 401;
    console.log(`   - Status Code: ${resD.status} (Expected: 401)`);
    console.log(`   - Response: ${JSON.stringify(resD.body)}`);
    console.log(`   - Result: ${passedD ? 'PASS' : 'FAIL'}`);
    if (passedD) passed++;
  } catch (err) {
    console.log(`   - Error: ${err.message}`);
  }

  // TEST E: Authenticated Amusemac Super Admin -> 200 OK for Amusemac Mailbox
  console.log("\nTEST E — Authenticated Amusemac Super Admin Mailbox Check:");
  try {
    const resE = await makeApiRequest('/api/mail/status', 'GET', tokenAdmin);
    const passedE = resE.status === 200 && resE.body.email === 'hello@amusemacstudio.in';
    console.log(`   - Status Code: ${resE.status}`);
    console.log(`   - Returned Email: ${resE.body.email}`);
    console.log(`   - Result: ${passedE ? 'PASS' : 'FAIL'}`);
    if (passedE) passed++;
  } catch (err) {
    console.log(`   - Error: ${err.message}`);
  }

  // TEST F: Authenticated Customer A -> NOT_CONNECTED Status
  console.log("\nTEST F — Authenticated Customer A Status Check (NOT_CONNECTED):");
  try {
    const resF = await makeApiRequest('/api/mail/status', 'GET', tokenA);
    const passedF = resF.status === 200 && resF.body.email === 'Not Connected' && resF.body.status === 'NOT_CONNECTED';
    console.log(`   - Status Code: ${resF.status}`);
    console.log(`   - Returned Email: ${resF.body.email}`);
    console.log(`   - Result: ${passedF ? 'PASS' : 'FAIL'}`);
    if (passedF) passed++;
  } catch (err) {
    console.log(`   - Error: ${err.message}`);
  }

  // TEST G: Customer A attempts Send Mail without connected mailbox -> 403 Forbidden
  console.log("\nTEST G — Customer A Send Mail without Mailbox Check:");
  try {
    const resG = await makeApiRequest('/api/mail/send', 'POST', tokenA, {}, { to: 'target@client.com', subject: 'Hi', body: 'Test' });
    const passedG = resG.status === 403;
    console.log(`   - Status Code: ${resG.status} (Expected: 403)`);
    console.log(`   - Result: ${passedG ? 'PASS' : 'FAIL'}`);
    if (passedG) passed++;
  } catch (err) {
    console.log(`   - Error: ${err.message}`);
  }

  // TEST H: Customer A attempts Email Modification (Trash) on unowned resource -> 403 Forbidden
  console.log("\nTEST H — Customer A Resource Tamper Check (Trash Unowned Email):");
  try {
    const resH = await makeApiRequest('/api/mail/trash', 'POST', tokenA, {}, { emailId: 'msg-amusemac-101' });
    const passedH = resH.status === 403;
    console.log(`   - Status Code: ${resH.status} (Expected: 403)`);
    console.log(`   - Result: ${passedH ? 'PASS' : 'FAIL'}`);
    if (passedH) passed++;
  } catch (err) {
    console.log(`   - Error: ${err.message}`);
  }

  console.log("\n==================================================");
  console.log(`SECURITY SUITE SUMMARY: ${passed}/${total} TESTS PASSED (${Math.round(passed/total * 100)}%)`);
  console.log("==================================================");
}

runSecurityHardeningTestSuite();
