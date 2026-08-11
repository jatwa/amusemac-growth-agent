import { loginWithOAuthProvider, loginUser, logoutUser } from './src/services/authService.ts';
import { populateTemplateVariables } from './src/data/emailTemplates.ts';
import { generateOutreachPackage as aiGenerateOutreachPackage } from './src/services/aiScoring.ts';

async function runTenantOutreachTestSuite() {
  console.log("==================================================");
  console.log("TENANT-SAFE OUTREACH EMAIL GENERATION TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let total = 9;

  const testLead = {
    leadId: 'lead-test-101',
    companyName: 'Bakehouse & Co.',
    decisionMakerName: 'Vikramaditya Roy',
    decisionMakerDesignation: 'Marketing Director',
    primaryService: 'Commercial/Ad Film Production',
    serviceNeed: 'Food & Beverage Commercial Project',
    location: 'Mumbai',
    projectName: 'Food & Beverage Commercial Project'
  };

  // TEST A: Amusemac Admin Outreach
  console.log("\nTEST A — Amusemac Admin Workspace Outreach Identity:");
  logoutUser();
  const adminSession = await loginUser('admin@amusemacstudio.in', 'Admin@123');
  const adminOrg = adminSession.organization;
  const adminPkg = aiGenerateOutreachPackage(testLead, adminOrg);

  const hasKuldeep = adminPkg.personalizedEmail.includes('Kuldeep Jatwa');
  const hasAmusemacCompany = adminPkg.personalizedEmail.includes('Amusemac Studio');
  const hasAmusemacWebsite = adminPkg.personalizedEmail.includes('https://www.amusemacstudio.in');
  const hasAmusemacVimeo = adminPkg.personalizedEmail.includes('https://vimeo.com/1123277739?fl=pl&fe=sh');

  const passedA = hasKuldeep && hasAmusemacCompany && hasAmusemacWebsite && hasAmusemacVimeo;
  console.log(`   - Kuldeep Jatwa: ${hasKuldeep ? 'PRESENT' : 'MISSING'}`);
  console.log(`   - Amusemac Studio: ${hasAmusemacCompany ? 'PRESENT' : 'MISSING'}`);
  console.log(`   - Amusemac Website (www.amusemacstudio.in): ${hasAmusemacWebsite ? 'PRESENT' : 'MISSING'}`);
  console.log(`   - Amusemac Vimeo (vimeo.com/1123277739?fl=pl&fe=sh): ${hasAmusemacVimeo ? 'PRESENT' : 'MISSING'}`);
  console.log(`   - Result: ${passedA ? 'PASS' : 'FAIL'}`);
  if (passedA) passed++;

  // TEST B: Fresh Customer Outreach (No Amusemac Data)
  console.log("\nTEST B — Fresh Customer Workspace Outreach (Zero Amusemac Leak):");
  logoutUser();
  const custSession = await loginWithOAuthProvider('GOOGLE', `brandnew.user.${Date.now()}@gmail.com`, 'Brand New Customer');
  const custOrg = custSession.organization;
  const custPkg = aiGenerateOutreachPackage(testLead, custOrg);

  const leakKuldeep = custPkg.personalizedEmail.includes('Kuldeep Jatwa');
  const leakAmusemacCompany = custPkg.personalizedEmail.includes('Amusemac Studio');
  const leakAmusemacWebsite = custPkg.personalizedEmail.includes('amusemacstudio.in');
  const leakAmusemacVimeo = custPkg.personalizedEmail.includes('vimeo.com/1123277739');

  const passedB = !leakKuldeep && !leakAmusemacCompany && !leakAmusemacWebsite && !leakAmusemacVimeo;
  console.log(`   - Zero Kuldeep Leak: ${!leakKuldeep ? 'CLEAN' : 'LEAK'}`);
  console.log(`   - Zero Amusemac Studio Leak: ${!leakAmusemacCompany ? 'CLEAN' : 'LEAK'}`);
  console.log(`   - Zero Amusemac Website Leak: ${!leakAmusemacWebsite ? 'CLEAN' : 'LEAK'}`);
  console.log(`   - Zero Amusemac Vimeo Leak: ${!leakAmusemacVimeo ? 'CLEAN' : 'LEAK'}`);
  console.log(`   - Result: ${passedB ? 'PASS' : 'FAIL'}`);
  if (passedB) passed++;

  // TEST C: Customer with Website
  console.log("\nTEST C — Customer with Configured Website:");
  const custOrgWithWebsite = {
    ...custOrg,
    companyName: 'XYZ Fashion',
    website: 'https://xyzfashion.com',
    adminName: 'Sarah Connor'
  };
  const custPkgC = aiGenerateOutreachPackage(testLead, custOrgWithWebsite);
  const hasCustWebsite = custPkgC.personalizedEmail.includes('https://xyzfashion.com');
  const noAmusemacWebsiteC = !custPkgC.personalizedEmail.includes('amusemacstudio.in');
  const passedC = hasCustWebsite && noAmusemacWebsiteC;
  console.log(`   - Customer Website Present: ${hasCustWebsite ? 'YES' : 'NO'}`);
  console.log(`   - Amusemac Website Absent: ${noAmusemacWebsiteC ? 'YES' : 'NO'}`);
  console.log(`   - Result: ${passedC ? 'PASS' : 'FAIL'}`);
  if (passedC) passed++;

  // TEST D: Customer with Portfolio
  console.log("\nTEST D — Customer with Portfolio:");
  const custOrgWithPortfolio = {
    ...custOrgWithWebsite,
    portfolio: 'https://xyzfashion.com/work'
  };
  const custPkgD = aiGenerateOutreachPackage(testLead, custOrgWithPortfolio);
  const noAmusemacVimeoD = !custPkgD.personalizedEmail.includes('vimeo.com/1123277739');
  const passedD = noAmusemacVimeoD;
  console.log(`   - Amusemac Vimeo Absent: ${noAmusemacVimeoD ? 'YES' : 'NO'}`);
  console.log(`   - Result: ${passedD ? 'PASS' : 'FAIL'}`);
  if (passedD) passed++;

  // TEST E: Customer WITHOUT Portfolio
  console.log("\nTEST E — Customer WITHOUT Portfolio (No Fallback):");
  const custPkgE = aiGenerateOutreachPackage(testLead, custOrgWithWebsite);
  const noVimeoE = !custPkgE.personalizedEmail.includes('vimeo.com');
  const passedE = noVimeoE;
  console.log(`   - Vimeo Portfolio Omitted: ${noVimeoE ? 'YES' : 'NO'}`);
  console.log(`   - Result: ${passedE ? 'PASS' : 'FAIL'}`);
  if (passedE) passed++;

  // TEST F: Customer WITHOUT Website
  console.log("\nTEST F — Customer WITHOUT Website (No Fallback):");
  const custOrgNoWebsite = {
    ...custOrg,
    website: ''
  };
  const custPkgF = aiGenerateOutreachPackage(testLead, custOrgNoWebsite);
  const noWebsiteF = !custPkgF.personalizedEmail.includes('amusemacstudio.in') && !custPkgF.personalizedEmail.includes('https://');
  const passedF = noWebsiteF;
  console.log(`   - Website Link Omitted: ${noWebsiteF ? 'YES' : 'NO'}`);
  console.log(`   - Result: ${passedF ? 'PASS' : 'FAIL'}`);
  if (passedF) passed++;

  // TEST G: Customer Mailbox Isolation
  console.log("\nTEST G — Customer Mailbox Isolation:");
  const custMailboxCheck = custOrg.connectedMailboxes && custOrg.connectedMailboxes.length > 0
    ? custOrg.connectedMailboxes[0].email
    : 'Not Connected';
  const noHelloLeak = custMailboxCheck !== 'hello@amusemacstudio.in';
  const passedG = noHelloLeak;
  console.log(`   - Mailbox Address: ${custMailboxCheck}`);
  console.log(`   - Amusemac Mailbox Leak Prevented: ${noHelloLeak ? 'YES' : 'NO'}`);
  console.log(`   - Result: ${passedG ? 'PASS' : 'FAIL'}`);
  if (passedG) passed++;

  // TEST H: Cross-Tenant Security Check
  console.log("\nTEST H — Cross-Tenant Outreach Profile Access Denial:");
  const isCustDeniedAmusemacAssets = custOrg.orgId !== 'amusemac-studio';
  const passedH = isCustDeniedAmusemacAssets;
  console.log(`   - Customer Workspace Segregated: ${isCustDeniedAmusemacAssets ? 'YES' : 'NO'}`);
  console.log(`   - Result: ${passedH ? 'PASS' : 'FAIL'}`);
  if (passedH) passed++;

  // TEST I: Amusemac Regression Check
  console.log("\nTEST I — Amusemac Admin Outreach Signature Preservation:");
  const adminPkgI = aiGenerateOutreachPackage(testLead, adminOrg);
  const passedI = adminPkgI.personalizedEmail.includes('Kuldeep Jatwa') &&
                  adminPkgI.personalizedEmail.includes('Production Designer & Creative Producer') &&
                  adminPkgI.personalizedEmail.includes('https://vimeo.com/1123277739?fl=pl&fe=sh') &&
                  adminPkgI.personalizedEmail.includes('https://www.amusemacstudio.in');
  console.log(`   - Amusemac Admin Signature Complete: ${passedI ? 'YES' : 'NO'}`);
  console.log(`   - Result: ${passedI ? 'PASS' : 'FAIL'}`);
  if (passedI) passed++;

  console.log("\n==================================================");
  console.log(`TENANT OUTREACH SUMMARY: ${passed}/${total} TESTS PASSED (${Math.round(passed/total * 100)}%)`);
  console.log("==================================================");
}

runTenantOutreachTestSuite();
