import fs from 'fs';
import dbStore from './server/dbStore.cjs';
import intentEngine from './server/intentEngine.cjs';

const { loadDatabase, getLeads } = dbStore;
const { analyzeOpportunityContent } = intentEngine;

console.log('==================================================');
console.log('DATABASE SANITIZATION TEST');
console.log('==================================================\n');

loadDatabase();
const leadsBefore = getLeads('amusemac-studio');
console.log(`Leads in amusemac-studio workspace: ${leadsBefore.length}`);

const invalidProdHub = leadsBefore.filter(l => (l.sourceUrl || '').includes('productionhub.com'));
const invalidFb = leadsBefore.filter(l => (l.title || '').toLowerCase() === 'corporate video productions');

console.log(`ProductionHUB active leads: ${invalidProdHub.length}`);
console.log(`Corporate Video Productions Facebook active leads: ${invalidFb.length}`);
