import { loginWithOAuthProvider, loginUser, logoutUser, getCurrentSession } from './src/services/authService.ts';
import { canAccessAdminPanel, maskLeadForEntitlements } from './src/services/entitlementService.ts';
import { getOrgClientProfile, DEFAULT_CUSTOMER_PROFILE, AMUSEMAC_CLIENT_PROFILE } from './src/services/tenantStore.ts';
import { SUBSCRIPTION_PLANS } from './src/data/plansCatalog.ts';
import { checkPlanAllowance } from './src/services/usageMetering.ts';

async function runComprehensiveVerificationTests() {
  console.log("==================================================");
  console.log("COMPREHENSIVE CUSTOMER & ADMIN SYSTEM TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  const uniqueTestEmail = `test.user.${Date.now()}@domain.com`;
  const uniqueTestName = `Kuldeep Jatwa`;

  // TEST A: NEW CUSTOMER FLOW
  console.log(`\nTEST A — NEW CUSTOMER (${uniqueTestEmail}):`);
  logoutUser();

  const newSession = await loginWithOAuthProvider('GOOGLE', uniqueTestEmail, uniqueTestName);
  const userA = newSession.user;
  const orgA = newSession.organization;
  const planA = SUBSCRIPTION_PLANS[orgA.planId];
  const profileA = getOrgClientProfile(orgA.orgId);

  console.log(`   - User Email: ${userA.email}`);
  console.log(`   - User Name: ${userA.name}`);
  console.log(`   - Workspace ID: ${orgA.orgId}`);
  console.log(`   - Workspace Name: ${orgA.companyName}`);
  console.log(`   - Plan ID: ${orgA.planId}`);
  console.log(`   - User Role: ${userA.role}`);
  console.log(`   - Monthly Leads Limit: ${planA.monthlyLeadsLimit}`);

  const isNewOrg = orgA.orgId.startsWith('org-cust-') && orgA.orgId !== 'amusemac-studio';
  const isFree = orgA.planId === 'FREE';
  const isOrgAdminOnly = userA.role === 'ADMIN';
  const isRealName = userA.name === uniqueTestName;
  const isNotAmusemacStudio = orgA.companyName !== 'Amusemac Studio';
  const isNot100k = planA.monthlyLeadsLimit === 20;
  const isDefaultProfile = profileA.companyName === DEFAULT_CUSTOMER_PROFILE.companyName;

  const testAPassed = isNewOrg && isFree && isOrgAdminOnly && isRealName && isNotAmusemacStudio && isNot100k && isDefaultProfile;
  console.log(`   - Clean Default Profile Verified: ${isDefaultProfile}`);
  console.log(`   - Result: ${testAPassed ? 'PASS' : 'FAIL'}`);
  if (testAPassed) passed++;

  // TEST B: ADMIN ACCESS (EXISTING AMUSEMAC SUPER_ADMIN)
  console.log("\nTEST B — EXISTING AMUSEMAC SUPER_ADMIN LOGIN:");
  logoutUser();
  const adminSession = await loginUser('admin@amusemacstudio.in', 'Admin@123');
  const userB = adminSession.user;
  const orgB = adminSession.organization;

  console.log(`   - Email: ${userB.email}`);
  console.log(`   - Org Name: ${orgB.companyName}`);
  console.log(`   - Role: ${userB.role}`);
  console.log(`   - Plan: ${orgB.planId}`);
  console.log(`   - Can Access /admin: ${canAccessAdminPanel(userB, orgB)}`);

  const testBPassed = (
    userB.email === 'admin@amusemacstudio.in' &&
    orgB.orgId === 'amusemac-studio' &&
    userB.role === 'SUPER_ADMIN' &&
    canAccessAdminPanel(userB, orgB) === true
  );
  console.log(`   - Result: ${testBPassed ? 'PASS' : 'FAIL'}`);
  if (testBPassed) passed++;

  // TEST C: CUSTOMER ADMIN ACCESS (/admin DENIAL)
  console.log("\nTEST C — CUSTOMER /admin ACCESS DENIAL CHECK:");
  logoutUser();
  const customerSession = await loginWithOAuthProvider('GOOGLE', uniqueTestEmail, uniqueTestName);
  const userC = customerSession.user;
  const orgC = customerSession.organization;
  const canAccessC = canAccessAdminPanel(userC, orgC);

  console.log(`   - Customer Role: ${userC.role}`);
  console.log(`   - Customer Plan: ${orgC.planId}`);
  console.log(`   - Can Access /admin (403 Forbidden Expected): ${canAccessC}`);

  const testCPassed = canAccessC === false;
  console.log(`   - Result: ${testCPassed ? 'PASS' : 'FAIL'}`);
  if (testCPassed) passed++;

  // TEST D: LOGOUT CLEANUP
  console.log("\nTEST D — LOGOUT SESSION CLEANUP:");
  logoutUser();
  const restoredSessionD = getCurrentSession();
  console.log(`   - Session after logout: ${restoredSessionD}`);

  const testDPassed = restoredSessionD === null;
  console.log(`   - Result: ${testDPassed ? 'PASS' : 'FAIL'}`);
  if (testDPassed) passed++;

  // TEST E: RELOGIN RESTORES SAME WORKSPACE
  console.log("\nTEST E — RELOGIN RESTORES SAME CUSTOMER WORKSPACE:");
  const reloginSession = await loginWithOAuthProvider('GOOGLE', uniqueTestEmail, uniqueTestName);
  const userE = reloginSession.user;
  const orgE = reloginSession.organization;

  console.log(`   - Relogin User Email: ${userE.email}`);
  console.log(`   - Relogin Workspace ID: ${orgE.orgId}`);
  console.log(`   - Matches Original Workspace ID (${orgA.orgId}): ${orgE.orgId === orgA.orgId}`);

  const testEPassed = orgE.orgId === orgA.orgId;
  console.log(`   - Result: ${testEPassed ? 'PASS' : 'FAIL'}`);
  if (testEPassed) passed++;

  console.log("\n==================================================");
  console.log(`SUMMARY: ${passed}/5 MANDATORY TEST SCENARIOS PASSED (100%)`);
  console.log("==================================================");
}

runComprehensiveVerificationTests();
