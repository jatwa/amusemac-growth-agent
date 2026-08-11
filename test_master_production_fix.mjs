import { loginWithOAuthProvider, loginUser, logoutUser, getCurrentSession } from './src/services/authService.ts';
import { canAccessAdminPanel, maskLeadForEntitlements } from './src/services/entitlementService.ts';
import { getOrgClientProfile, DEFAULT_CUSTOMER_PROFILE } from './src/services/tenantStore.ts';
import { AMUSEMAC_CLIENT_PROFILE } from './src/data/clientProfiles.ts';
import { SUBSCRIPTION_PLANS } from './src/data/plansCatalog.ts';
import { getOrgMailboxes } from './src/services/mailboxService.ts';
import { fetchZohoMailStatus } from './src/services/apiMailService.ts';
import { parseNaturalLanguageQuery } from './src/services/queryParser.ts';

async function runMasterProductionVerificationTests() {
  console.log("==================================================");
  console.log("MASTER PRODUCTION TENANT ISOLATION TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let total = 14;

  // TEST 1: Fresh Google Customer
  console.log("\nTEST 1 — Fresh Google Customer:");
  logoutUser();
  const email1 = `google.test.${Date.now()}@gmail.com`;
  const sess1 = await loginWithOAuthProvider('GOOGLE', email1, 'Google Customer');
  const t1Passed = (
    sess1.organization.orgId.startsWith('org-cust-') &&
    sess1.organization.planId === 'FREE' &&
    sess1.user.role === 'ADMIN' &&
    getOrgMailboxes(sess1.organization.orgId).length === 0 &&
    sess1.organization.companyName !== 'Amusemac Studio'
  );
  console.log(`   - Org ID: ${sess1.organization.orgId}`);
  console.log(`   - Plan: ${sess1.organization.planId}`);
  console.log(`   - Role: ${sess1.user.role}`);
  console.log(`   - Mailboxes: ${getOrgMailboxes(sess1.organization.orgId).length}`);
  console.log(`   - Result: ${t1Passed ? 'PASS' : 'FAIL'}`);
  if (t1Passed) passed++;

  // TEST 2: Fresh Customer Zoho Login
  console.log("\nTEST 2 — Fresh Zoho Customer:");
  logoutUser();
  const email2 = `zoho.test.${Date.now()}@zoho.com`;
  const sess2 = await loginWithOAuthProvider('ZOHO', email2, 'Zoho Customer');
  const t2Passed = (
    sess2.organization.orgId.startsWith('org-cust-') &&
    sess2.organization.planId === 'FREE' &&
    sess2.user.role === 'ADMIN' &&
    getOrgMailboxes(sess2.organization.orgId).length === 0
  );
  console.log(`   - Result: ${t2Passed ? 'PASS' : 'FAIL'}`);
  if (t2Passed) passed++;

  // TEST 3: Fresh Customer Email Signup
  console.log("\nTEST 3 — Fresh Email Customer:");
  logoutUser();
  const email3 = `email.test.${Date.now()}@acme.com`;
  const sess3 = await loginWithOAuthProvider('EMAIL', email3, 'Email Customer');
  const t3Passed = (
    sess3.organization.orgId.startsWith('org-cust-') &&
    sess3.organization.planId === 'FREE' &&
    getOrgMailboxes(sess3.organization.orgId).length === 0
  );
  console.log(`   - Result: ${t3Passed ? 'PASS' : 'FAIL'}`);
  if (t3Passed) passed++;

  // TEST 4: Fresh Zoho Customer
  console.log("\nTEST 4 — Fresh Zoho Customer:");
  logoutUser();
  const email4 = `zoho.test.${Date.now()}@zoho.com`;
  const sess4 = await loginWithOAuthProvider('ZOHO', email4, 'Zoho Customer');
  const t4Passed = (
    sess4.organization.orgId.startsWith('org-cust-') &&
    sess4.organization.planId === 'FREE' &&
    sess4.organization.orgId !== 'amusemac-studio' &&
    getOrgMailboxes(sess4.organization.orgId).length === 0
  );
  console.log(`   - Result: ${t4Passed ? 'PASS' : 'FAIL'}`);
  if (t4Passed) passed++;

  // TEST 5: Fresh Email Signup
  console.log("\nTEST 5 — Fresh Email Signup:");
  logoutUser();
  const email5 = `email.signup.${Date.now()}@client.com`;
  const sess5 = await loginWithOAuthProvider('EMAIL', email5, 'Email Customer');
  const t5Passed = (
    sess5.organization.orgId.startsWith('org-cust-') &&
    sess5.organization.planId === 'FREE' &&
    sess5.user.role === 'ADMIN'
  );
  console.log(`   - Result: ${t5Passed ? 'PASS' : 'FAIL'}`);
  if (t5Passed) passed++;

  // TEST 6: SKIP FOR NOW Keeps Mailbox Disconnected
  console.log("\nTEST 6 — SKIP FOR NOW Keeps Mailbox Disconnected:");
  const t6Passed = (
    sess1.organization.connectedMailboxes.length === 0 &&
    getOrgMailboxes(sess1.organization.orgId).length === 0
  );
  console.log(`   - Connected Mailboxes: ${sess1.organization.connectedMailboxes.length}`);
  console.log(`   - Result: ${t6Passed ? 'PASS' : 'FAIL'}`);
  if (t6Passed) passed++;

  // TEST 7: Existing Amusemac Admin
  console.log("\nTEST 7 — Existing Amusemac Super Admin Login:");
  logoutUser();
  const adminSess = await loginUser('admin@amusemacstudio.in', 'Admin@123');
  const t7Passed = (
    adminSess.organization.orgId === 'amusemac-studio' &&
    adminSess.organization.planId === 'ENTERPRISE' &&
    adminSess.user.role === 'SUPER_ADMIN'
  );
  console.log(`   - Org ID: ${adminSess.organization.orgId}`);
  console.log(`   - Plan: ${adminSess.organization.planId}`);
  console.log(`   - Role: ${adminSess.user.role}`);
  console.log(`   - Result: ${t7Passed ? 'PASS' : 'FAIL'}`);
  if (t7Passed) passed++;

  // TEST 8: Existing hello@amusemacstudio.in Zoho Mailbox Preserved
  console.log("\nTEST 8 — Existing Amusemac Mailbox Preserved:");
  const amusemacMailboxes = getOrgMailboxes('amusemac-studio');
  const zohoStatusAdmin = await fetchZohoMailStatus('amusemac-studio');
  const t8Passed = (
    amusemacMailboxes.length > 0 &&
    amusemacMailboxes[0].email === 'hello@amusemacstudio.in' &&
    zohoStatusAdmin.email === 'hello@amusemacstudio.in'
  );
  console.log(`   - Mailbox Email: ${amusemacMailboxes[0]?.email}`);
  console.log(`   - Result: ${t8Passed ? 'PASS' : 'FAIL'}`);
  if (t8Passed) passed++;

  // TEST 9: Customer A Mailbox Isolation
  console.log("\nTEST 9 — Customer A vs Customer B Mailbox Isolation:");
  const mailboxesCustomerA = getOrgMailboxes(sess1.organization.orgId);
  const mailboxesCustomerB = getOrgMailboxes(sess2.organization.orgId);
  const t9Passed = (
    mailboxesCustomerA.length === 0 &&
    mailboxesCustomerB.length === 0
  );
  console.log(`   - Customer A Mailboxes: ${mailboxesCustomerA.length}`);
  console.log(`   - Customer B Mailboxes: ${mailboxesCustomerB.length}`);
  console.log(`   - Result: ${t9Passed ? 'PASS' : 'FAIL'}`);
  if (t9Passed) passed++;

  // TEST 10: Cross-Tenant Data Leak Block
  console.log("\nTEST 10 — Cross-Tenant Data Leak Block:");
  const profileCustomer1 = getOrgClientProfile(sess1.organization.orgId);
  const profileCustomer2 = getOrgClientProfile(sess2.organization.orgId);
  const t10Passed = (
    profileCustomer1.companyName !== 'Amusemac Studio' &&
    profileCustomer2.companyName !== 'Amusemac Studio' &&
    sess1.organization.sheetsWebhookUrl === ''
  );
  console.log(`   - Customer 1 Sheets Webhook: "${sess1.organization.sheetsWebhookUrl}"`);
  console.log(`   - Result: ${t10Passed ? 'PASS' : 'FAIL'}`);
  if (t10Passed) passed++;

  // TEST 11: /admin Gate Denial for Customer
  console.log("\nTEST 11 — /admin Gate Denial for Customer:");
  const canAccess1 = canAccessAdminPanel(sess1.user, sess1.organization);
  const t11Passed = (canAccess1 === false);
  console.log(`   - Customer can access /admin: ${canAccess1}`);
  console.log(`   - Result: ${t11Passed ? 'PASS' : 'FAIL'}`);
  if (t11Passed) passed++;

  // TEST 12: Search Engine Initial Neutral Profile Check
  console.log("\nTEST 12 — Search Engine Neutral Profile Check:");
  const profile1 = getOrgClientProfile(sess1.organization.orgId);
  const t12Passed = (profile1.companyName === DEFAULT_CUSTOMER_PROFILE.companyName);
  console.log(`   - Profile Company Name: ${profile1.companyName}`);
  console.log(`   - Result: ${t12Passed ? 'PASS' : 'FAIL'}`);
  if (t12Passed) passed++;

  // TEST 13: Natural Language Search Auto-Inference
  console.log("\nTEST 13 — Natural Language Search Auto-Inference:");
  const parsedQuery = parseNaturalLanguageQuery("Find fashion brands in Mumbai needing advertising films");
  const t13Passed = (
    parsedQuery.inferredLocation === 'Mumbai' &&
    parsedQuery.appliedFilterCount >= 1
  );
  console.log(`   - Inferred Location: ${parsedQuery.inferredLocation}`);
  console.log(`   - Applied Filters: ${parsedQuery.appliedFilterCount}`);
  console.log(`   - Result: ${t13Passed ? 'PASS' : 'FAIL'}`);
  if (t13Passed) passed++;

  // TEST 14: FREE Entitlement Field Masking
  console.log("\nTEST 14 — FREE Entitlement Field Masking:");
  const sampleLead = {
    leadId: 'L-500',
    companyName: 'TechCorp',
    decisionMakerName: 'John Doe',
    decisionMakerEmail: 'john@techcorp.com',
    decisionMakerPhone: '+91 9876543210',
    whyThisLead: 'Expanding sales force',
    buyingSignal: 'Funding Round',
    serviceNeed: 'SaaS Software',
    primaryService: 'SaaS Software',
    location: 'Bangalore',
    industry: 'Technology',
    aiScore: 88,
    priority: 'HOT'
  };
  const masked = maskLeadForEntitlements(sampleLead, 'FREE');
  const t14Passed = (
    masked.decisionMakerName === '🔒 Unlock Full Lead Intelligence' &&
    masked.email === '🔒 Upgrade Plan to View Email'
  );
  console.log(`   - Masked Name: ${masked.decisionMakerName}`);
  console.log(`   - Masked Email: ${masked.email}`);
  console.log(`   - Result: ${t14Passed ? 'PASS' : 'FAIL'}`);
  if (t14Passed) passed++;

  console.log("\n==================================================");
  console.log(`MASTER TEST SUMMARY: ${passed}/${total} TESTS PASSED (${Math.round(passed/total * 100)}%)`);
  console.log("==================================================");
}

runMasterProductionVerificationTests();
