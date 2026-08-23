import fs from 'fs';
import dbStore from './server/dbStore.cjs';
import intentEngine from './server/intentEngine.cjs';
import deepResearchEngine from './server/deepResearchEngine.cjs';
import publicWebProviderPkg from './server/providers/publicWebSearchProvider.cjs';

const { loadDatabase, getLeads } = dbStore;
const { analyzeOpportunityContent } = intentEngine;
const { performDeepResearch } = deepResearchEngine;
const { PublicWebSearchProvider } = publicWebProviderPkg;

console.log('==================================================');
console.log('LIVE PIPELINE AUDIT & DATABASE INSPECTION');
console.log('==================================================\n');

loadDatabase();
const leadsInDb = getLeads('amusemac-studio');

console.log(`Total Leads in db.json for 'amusemac-studio': ${leadsInDb.length}`);

const prodHubDbItems = leadsInDb.filter(l =>
  (l.title || '').toLowerCase().includes('productionhub') ||
  (l.companyName || '').toLowerCase().includes('productionhub') ||
  (l.sourceUrl || '').toLowerCase().includes('productionhub.com')
);

const fbDbItems = leadsInDb.filter(l =>
  (l.title || '').toLowerCase().includes('corporate video productions') ||
  (l.companyName || '').toLowerCase().includes('corporate video productions') ||
  (l.sourceUrl || '').toLowerCase().includes('facebook.com')
);

console.log(`ProductionHUB items in db.json: ${prodHubDbItems.length}`);
prodHubDbItems.forEach(i => console.log(`  - [${i.id}] Title: "${i.title}" | URL: ${i.sourceUrl}`));

console.log(`Facebook items in db.json: ${fbDbItems.length}`);
fbDbItems.forEach(i => console.log(`  - [${i.id}] Title: "${i.title}" | URL: ${i.sourceUrl}`));

console.log('\n--- TESTING INTENT ANALYSIS ON PRODUCTIONHUB ITEM ---');
const sampleProdHub = {
  title: 'ProductionHUB | Find Film and Video Professionals',
  requirement: 'Find Film and Video Professionals. ProductionHUB connects you with professional content creators.',
  sourceUrl: 'https://www.productionhub.com/directory/video-production-companies'
};
const res1 = analyzeOpportunityContent(sampleProdHub);
console.log('ProdHub intent analysis result:', res1);

console.log('\n--- TESTING INTENT ANALYSIS ON FACEBOOK ITEM ---');
const sampleFb = {
  title: 'Corporate Video Productions',
  requirement: 'The purpose of this group is to promote corporate video productions community.',
  sourceUrl: 'https://www.facebook.com/corporatevideoproductions'
};
const res2 = analyzeOpportunityContent(sampleFb);
console.log('Facebook intent analysis result:', res2);
