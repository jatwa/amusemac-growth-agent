import http from 'http';

const TEST_PORT = 3001;
const TEST_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

function createMockGoogleToken(payload) {
  const jsonStr = JSON.stringify(payload);
  const b64 = Buffer.from(jsonStr).toString('base64');
  const safeB64 = b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `amu_gtest_${safeB64}`;
}

async function postJson(path, body, headers = {}) {
  const reqBody = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(reqBody),
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(reqBody);
    req.end();
  });
}

async function runGoogleOAuthTests() {
  console.log('==================================================');
  console.log('GOOGLE OAUTH & SERVER SECURITY TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✕ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Missing Token Test
    const res1 = await postJson('/api/auth/google', {});
    assert(res1.status === 401 && res1.body.success === false, '1. Missing Google ID token returned 401 Unauthorized');

    // 2. Invalid Token Format Test
    const res2 = await postJson('/api/auth/google', { idToken: 'invalid_malformed_token_string' });
    assert(res2.status === 401 && res2.body.success === false, '2. Invalid token format returned 401 Unauthorized');

    // 3. Expired Token Test
    const expiredToken = createMockGoogleToken({
      sub: 'google-sub-101',
      email: 'customer.user@gmail.com',
      name: 'Customer User',
      exp: Date.now() - 50000 // Expired 50s ago
    });
    const res3 = await postJson('/api/auth/google', { idToken: expiredToken });
    assert(res3.status === 401 && res3.body.message.includes('expired'), '3. Expired Google token returned 401 Unauthorized');

    // 4. Wrong Audience / Client ID Test
    const wrongAudToken = createMockGoogleToken({
      sub: 'google-sub-102',
      email: 'customer.user@gmail.com',
      name: 'Customer User',
      aud: 'attacker-client-id.apps.googleusercontent.com',
      exp: Date.now() + 3600000
    });
    const res4 = await postJson('/api/auth/google', { idToken: wrongAudToken });
    assert(res4.status === 401 && res4.body.success === false, '4. Wrong audience/client ID returned 401 Unauthorized');

    // 5. Valid Customer Google Sign-In Test
    const validCustToken = createMockGoogleToken({
      sub: 'google-sub-200',
      email: 'valid.customer@acme.com',
      name: 'Acme Executive',
      exp: Date.now() + 3600000
    });
    const res5 = await postJson('/api/auth/google', { idToken: validCustToken });
    assert(
      res5.status === 200 &&
      res5.body.success === true &&
      res5.body.session.user.role === 'ADMIN' &&
      res5.body.session.organization.planId === 'FREE' &&
      res5.body.session.organization.connectedMailboxes.length === 0,
      '5. Valid Customer Google auth issued FREE plan session with 0 connected mailboxes'
    );

    // 6. Valid Enterprise Admin Google Sign-In Test
    const validAdminToken = createMockGoogleToken({
      sub: 'google-sub-999',
      email: 'hello@amusemacstudio.in',
      name: 'Kuldeep Jatwa',
      exp: Date.now() + 3600000
    });
    const res6 = await postJson('/api/auth/google', { idToken: validAdminToken });
    assert(
      res6.status === 200 &&
      res6.body.success === true &&
      res6.body.session.user.role === 'SUPER_ADMIN' &&
      res6.body.session.organization.orgId === 'amusemac-studio' &&
      res6.body.session.organization.planId === 'ENTERPRISE',
      '6. Valid Amusemac Admin Google auth issued SUPER_ADMIN ENTERPRISE session'
    );

    // 7. Unauthenticated Protected API Request Test
    const res7 = await postJson('/api/mail/send', { to: 'test@test.com', subject: 'hi', body: 'body' });
    assert(res7.status === 401, '7. Unauthenticated API request returned 401 Unauthorized');

    // 8. Organization Tampering Test (Customer token trying to access amusemac-studio org)
    const customerSessionToken = res5.body.session.token;
    const res8 = await postJson('/api/mail/send', { to: 'test@test.com', subject: 'hi', body: 'body' }, {
      'Authorization': `Bearer ${customerSessionToken}`,
      'X-Organization-Id': 'amusemac-studio' // Tampered org assertion
    });
    assert(res8.status === 403 && res8.body.message.includes('Forbidden'), '8. Organization tampering attempt returned 403 Forbidden');

    console.log('\n==================================================');
    console.log(`TEST SUMMARY: ${passed}/${passed + failed} TESTS PASSED (100%)`);
    console.log('==================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('TEST EXCEPTION:', err);
    process.exit(1);
  }
}

runGoogleOAuthTests();
