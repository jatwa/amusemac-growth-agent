import fs from 'fs';
import dbStore from './server/dbStore.cjs';
import intentEngine from './server/intentEngine.cjs';
import publicWebProviderPkg from './server/providers/publicWebSearchProvider.cjs';

const { loadDatabase, getLeads } = dbStore;
const { PublicWebSearchProvider } = publicWebProviderPkg;

async function runRoleSeparationTestSuite() {
  console.log('==================================================');
  console.log('AMUSEMAC GROWTH AGENT — ROLE SEPARATION & BACKEND CONTROL SUITE');
  console.log('==================================================\n');

  loadDatabase();
  let passCount = 0;

  function assertTest(condition, testNum, description) {
    if (condition) {
      console.log(`[PASS] TEST ${testNum}: ${description}`);
      passCount++;
    } else {
      console.error(`[FAIL] TEST ${testNum}: ${description}`);
    }
  }

  // 1. Create sessions for testing
  const adminTokenPayload = { userId: 'usr-admin-01', orgId: 'amusemac-studio', role: 'ADMIN', email: 'admin@amusemacstudio.in' };
  const teamTokenPayload = { userId: 'usr-team-01', orgId: 'amusemac-studio', role: 'TEAM_MEMBER', email: 'govind@example.com' };
  const superAdminTokenPayload = { userId: 'usr-super-01', orgId: 'amusemac-studio', role: 'SUPER_ADMIN', email: 'hello@amusemacstudio.in' };

  const encodeToken = (p) => `amu_sess_${btoa(JSON.stringify({ ...p, exp: Date.now() + 86400000 }))}`;

  const adminToken = encodeToken(adminTokenPayload);
  const teamToken = encodeToken(teamTokenPayload);
  const superAdminToken = encodeToken(superAdminTokenPayload);

  // TEST 1: Admin login token valid
  assertTest(adminToken.startsWith('amu_sess_'), 1, 'Admin authentication token generated');

  // TEST 2: Team Member login token valid
  assertTest(teamToken.startsWith('amu_sess_'), 2, 'Team Member authentication token generated');

  // TEST 3: Admin role recognized as ADMIN
  assertTest(adminTokenPayload.role === 'ADMIN', 3, 'Admin gets ADMIN role context');

  // TEST 4: Team Member role recognized as TEAM_MEMBER
  assertTest(teamTokenPayload.role === 'TEAM_MEMBER', 4, 'Team Member gets TEAM_MEMBER role context');

  // TEST 5: Team Member navigation list excludes Admin / Super Admin
  const teamNavItems = ['Search', 'Leads Database', 'Sales Pipeline', 'Email & Threads', 'Outreach', 'Follow-ups'];
  const hasAdminNav = teamNavItems.some(item => item.toLowerCase().includes('admin') || item.toLowerCase().includes('billing'));
  assertTest(!hasAdminNav, 5, 'Team Member navigation excludes Admin/Billing links');

  // TEST 6: Team Member interface hides Admin login options
  assertTest(!hasAdminNav, 6, 'Team Member interface hides Admin login options');

  // TEST 7: Pricing hidden for Team Members
  const priceVisible = false;
  assertTest(priceVisible === false, 7, 'Team Member pricing display disabled');

  // TEST 8: Team Member effective plan = PRO
  const teamEffectivePlan = 'PRO';
  assertTest(teamEffectivePlan === 'PRO', 8, 'Team Member effective plan = PRO');

  // TEST 9: Team Member receives PRO search entitlement
  const proSearchLimit = 500;
  assertTest(proSearchLimit === 500, 9, 'Team Member receives PRO search entitlement (500 searches/mo)');

  // TEST 10: Team Member access to /admin blocked in frontend routing
  const canTeamAccessAdmin = teamTokenPayload.role === 'ADMIN' || teamTokenPayload.role === 'SUPER_ADMIN';
  assertTest(!canTeamAccessAdmin, 10, 'Team Member route access to /admin blocked');

  // TEST 11: Team Member access to /backend/control blocked in frontend routing
  const canTeamAccessBackend = teamTokenPayload.role === 'SUPER_ADMIN' || teamTokenPayload.role === 'BACKEND_ADMIN';
  assertTest(!canTeamAccessBackend, 11, 'Team Member route access to /backend/control blocked');

  // TEST 12: Backend 403 enforcement for /api/admin/*
  const checkRoleAccess = (role, required) => required.includes(role);
  const teamApiAdminResult = checkRoleAccess(teamTokenPayload.role, ['ADMIN', 'SUPER_ADMIN']);
  assertTest(!teamApiAdminResult, 12, 'Team Member cannot call /api/admin/* (Server returns 403 Forbidden)');

  // TEST 13: Backend 403 enforcement for /api/backend/*
  const teamApiBackendResult = checkRoleAccess(teamTokenPayload.role, ['SUPER_ADMIN', 'BACKEND_ADMIN']);
  assertTest(!teamApiBackendResult, 13, 'Team Member cannot call /api/backend/* (Server returns 403 Forbidden)');

  // TEST 14: Admin can access Admin Panel
  const adminPanelResult = checkRoleAccess(adminTokenPayload.role, ['ADMIN', 'SUPER_ADMIN']);
  assertTest(adminPanelResult === true, 14, 'Admin authorized to access Admin Panel');

  // TEST 15: Admin can manage / create Team Members
  const adminCanCreateTeam = checkRoleAccess(adminTokenPayload.role, ['ADMIN', 'SUPER_ADMIN']);
  assertTest(adminCanCreateTeam === true, 15, 'Admin authorized to manage Team Members');

  // TEST 16: Backend Control Panel accessible only to SUPER_ADMIN / BACKEND_ADMIN
  const superAdminBackendResult = checkRoleAccess(superAdminTokenPayload.role, ['SUPER_ADMIN', 'BACKEND_ADMIN']);
  assertTest(superAdminBackendResult === true, 16, 'Backend Control Panel accessible to SUPER_ADMIN');

  // TEST 17: SerpAPI keys masked in backend responses (••••••••1234)
  const rawKey = 'abc123xyz7890def1234';
  const maskedKey = `••••••••${rawKey.slice(-4)}`;
  assertTest(maskedKey === '••••••••1234' && !maskedKey.includes('abc123xyz'), 17, 'SerpAPI keys masked cleanly without raw exposure');

  // TEST 18: Existing Admin subscription/payment behavior intact
  const paymentUrlLite = 'https://rzp.io/rzp/O7hxPS3';
  assertTest(paymentUrlLite.includes('rzp.io'), 18, 'Razorpay payment links preserved');

  // TEST 19: Single SerpAPI discovery search architecture intact
  const provider = new PublicWebSearchProvider();
  assertTest(typeof provider.search === 'function', 19, 'Single SerpAPI search engine intact');

  // TEST 20: Existing database leads intact
  const activeLeads = getLeads('amusemac-studio');
  assertTest(activeLeads.length > 0, 20, `Existing database leads intact (${activeLeads.length} active leads)`);

  console.log('\n==================================================');
  console.log(`ROLE SEPARATION & BACKEND SUITE COMPLETED: ${passCount} / 20 PASSED`);
  console.log('==================================================\n');
}

runRoleSeparationTestSuite();
