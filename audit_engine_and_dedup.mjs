import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), 'server', 'data', 'db.json');

// Load environment variables
const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
let primaryKey = '';
let backupKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('SERPAPI_PRIMARY_API_KEY=')) {
    primaryKey = line.split('=')[1].trim();
  } else if (line.startsWith('SERPAPI_BACKUP_API_KEY=')) {
    backupKey = line.split('=')[1].trim();
  }
});

async function getAccountQuota(apiKey) {
  if (!apiKey) return 0;
  try {
    const res = await fetch(`https://serpapi.com/account?api_key=${apiKey}`);
    if (res.ok) {
      const data = await res.json();
      return data.searches_per_month - data.this_month_usage;
    }
  } catch (e) {}
  return 0;
}

function normalizeUrl(urlStr) {
  if (!urlStr) return '';
  return urlStr
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/\/$/, '')
    .split('?')[0]
    .split('#')[0]
    .trim();
}

function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function generateFingerprint(title, company, sourceUrl) {
  const normUrlStr = normalizeUrl(sourceUrl);
  const normTitleStr = normalizeText(title).slice(0, 50);
  const normCompStr = normalizeText(company).slice(0, 30);
  const raw = `${normUrlStr}|${normTitleStr}|${normCompStr}`;
  return crypto.createHash('md5').update(raw).digest('hex');
}

async function runControlledTest() {
  console.log('==================================================');
  console.log('PART 1 — GOOGLE LIGHT FAST ENGINE TEST');
  console.log('==================================================\n');

  // 1. Record Quota Before
  const primaryBefore = await getAccountQuota(primaryKey);
  const backupBefore = await getAccountQuota(backupKey);
  const quotaBefore = primaryBefore + backupBefore;

  const activeApiKey = primaryBefore > 0 ? primaryKey : backupKey;

  const QUERY = 'companies seeking external documentary production partner 2026';
  const url = `https://serpapi.com/search.json?engine=google_light_fast&q=${encodeURIComponent(QUERY)}&num=100&start=0&api_key=${activeApiKey}`;

  console.log(`Executing 1 SerpAPI request: engine=google_light_fast, num=100, start=0...\n`);

  const searchRes = await fetch(url);
  const searchJson = await searchRes.json();

  // 2. Record Quota After
  const primaryAfter = await getAccountQuota(primaryKey);
  const backupAfter = await getAccountQuota(backupKey);
  const quotaAfter = primaryAfter + backupAfter;

  const creditsConsumed = quotaBefore - quotaAfter;
  const isCached = creditsConsumed === 0;

  const organicResults = searchJson.organic_results || [];

  console.log(`Engine                 : google_light_fast`);
  console.log(`HTTP requests          : 1`);
  console.log(`Requested              : 100`);
  console.log(`Actual organic_results : ${organicResults.length}`);
  console.log(`Response               : ${isCached ? 'Cached' : 'Fresh'}`);
  console.log(`Quota before           : ${quotaBefore}`);
  console.log(`Quota after            : ${quotaAfter}`);
  console.log(`Credits consumed       : ${creditsConsumed}\n`);

  if (isCached) {
    console.log('Test inconclusive — cached response.');
  }

  console.log('==================================================');
  console.log('PART 2 — CROSS-SEARCH DUPLICATE PREVENTION AUDIT');
  console.log('==================================================\n');

  // Load existing persisted leads
  let dbData = { leads: {} };
  try {
    if (fs.existsSync(DB_PATH)) {
      dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
  } catch (e) {}

  const allLeads = [];
  Object.values(dbData.leads || {}).forEach(orgLeads => {
    Object.values(orgLeads || {}).forEach(lead => allLeads.push(lead));
  });

  console.log(`Existing persisted leads in database: ${allLeads.length}`);
  console.log(`Raw candidates from Light Fast request: ${organicResults.length}\n`);

  const detectedDuplicates = [];
  const newCandidates = [];

  organicResults.forEach((cand, idx) => {
    const candTitle = cand.title || '';
    const candUrl = cand.link || cand.url || '';
    const candSnippet = cand.snippet || '';
    const candCompany = cand.displayed_link || (new URL(candUrl || 'https://unknown.com').hostname.replace(/^www\./, ''));
    
    const candNormUrl = normalizeUrl(candUrl);
    const candNormTitle = normalizeText(candTitle);
    const candFp = generateFingerprint(candTitle, candCompany, candUrl);

    let matchedExistingLead = null;
    let matchReason = '';

    for (const existing of allLeads) {
      const existUrl = existing.sourceUrl || existing.source_url || existing.original_source_url || '';
      const existNormUrl = normalizeUrl(existUrl);
      const existTitle = existing.title || existing.source_title || existing.requirement || '';
      const existNormTitle = normalizeText(existTitle);
      const existCompany = existing.companyName || existing.company_name || '';
      const existNormCompany = normalizeText(existCompany);
      const existFp = existing.fingerprint || generateLeadFingerprint(existTitle, existCompany, existUrl);

      // 1. Canonical URL Match
      if (candNormUrl && existNormUrl && candNormUrl === existNormUrl) {
        matchedExistingLead = existing;
        matchReason = `Canonical URL Match (${candNormUrl})`;
        break;
      }

      // 2. Fingerprint Match
      if (candFp === existFp) {
        matchedExistingLead = existing;
        matchReason = `Fingerprint Hash Match (${candFp})`;
        break;
      }

      // 3. Title + Domain Match
      if (candNormTitle && existNormTitle && candNormTitle === existNormTitle) {
        matchedExistingLead = existing;
        matchReason = `Normalized Requirement Title Match ("${candTitle}")`;
        break;
      }
    }

    if (matchedExistingLead) {
      detectedDuplicates.push({
        candidateIndex: idx + 1,
        newCandidate: {
          title: candTitle,
          url: candUrl,
          company: candCompany,
          snippet: candSnippet
        },
        existingLead: {
          id: matchedExistingLead.id || matchedExistingLead.leadId,
          title: matchedExistingLead.title,
          company: matchedExistingLead.companyName || matchedExistingLead.company_name,
          url: matchedExistingLead.sourceUrl || matchedExistingLead.source_url
        },
        reason: matchReason
      });
    } else {
      newCandidates.push({
        candidateIndex: idx + 1,
        title: candTitle,
        url: candUrl,
        company: candCompany,
        snippet: candSnippet
      });
    }
  });

  console.log(`Already-known duplicates detected : ${detectedDuplicates.length}`);
  console.log(`New unique candidates            : ${newCandidates.length}\n`);

  console.log('--------------------------------------------------');
  console.log('DETAILED DEDUPLICATION BREAKDOWN:');
  console.log('--------------------------------------------------');

  if (detectedDuplicates.length === 0) {
    console.log('No duplicate matches found between new candidates and existing database records.');
  } else {
    detectedDuplicates.forEach((dup, i) => {
      console.log(`\nDUPLICATE #${i + 1}:`);
      console.log(`New Candidate: "${dup.newCandidate.title}" (${dup.newCandidate.url})`);
      console.log(`Existing Lead: [ID: ${dup.existingLead.id}] "${dup.existingLead.title}" (${dup.existingLead.url})`);
      console.log(`Why Considered Duplicate: ${dup.reason}`);
    });
  }

  console.log('\n==================================================\n');
}

function generateLeadFingerprint(title, company, sourceUrl) {
  const normUrlStr = normalizeUrl(sourceUrl);
  const normTitleStr = normalizeText(title).slice(0, 50);
  const normCompStr = normalizeText(company).slice(0, 30);
  const raw = `${normUrlStr}|${normTitleStr}|${normCompStr}`;
  return crypto.createHash('md5').update(raw).digest('hex');
}

runControlledTest();
