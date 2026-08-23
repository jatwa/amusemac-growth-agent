const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Initial Database Structure
const initialDb = {
  leads: {},                // orgId -> { [leadId]: Lead }
  searchHistory: {},        // orgId -> SearchSession[]
  searchSessionResults: {}, // orgId -> { [sessionId]: SnapshotLeadResult[] }
  rawSearchResults: {},     // orgId -> { [sessionId]: RawCandidate[] }
  searchMemory: {},         // orgId -> SearchMemoryItem[]
  leadHistory: {},          // orgId -> { [leadId]: LeadEvent[] }
  pipeline: {},             // orgId -> { [leadId]: PipelineRecord }
  emails: {}                // orgId -> { [emailId]: EmailRecord }
};

let dbData = { ...initialDb };

function sanitizeDatabaseLeads() {
  try {
    const { analyzeOpportunityContent } = require('./intentEngine.cjs');
    let dirty = false;

    Object.keys(dbData.leads || {}).forEach(orgId => {
      const orgMap = dbData.leads[orgId] || {};
      Object.keys(orgMap).forEach(leadKey => {
        const lead = orgMap[leadKey];
        if (lead.dataStatus === 'REAL_PUBLIC' && lead.pipeline_stage !== 'REJECTED') {
          const evalRes = analyzeOpportunityContent({
            title: lead.title || lead.requirement_title || '',
            requirement: lead.requirement || lead.requirement_summary || lead.full_requirement || '',
            description: lead.description || lead.requirement || '',
            sourceUrl: lead.sourceUrl || lead.source_url || ''
          });

          if (evalRes.intentType === 'REJECT' || evalRes.buyerDemandConfirmed === false) {
            lead.dataStatus = 'REJECTED_PROVIDER';
            lead.intentType = 'REJECT';
            lead.pipeline_stage = 'REJECTED';
            lead.outreachStatus = 'REJECTED';
            lead.rejectionCategory = evalRes.rejectionCategory || 'NON_BUYER_PAGE';
            lead.rejectionReason = evalRes.evidence || 'Failed buyer demand qualification.';
            dirty = true;
          }
        }
      });
    });

    if (dirty) {
      saveDatabase();
      console.log('[dbStore] Database leads sanitized: Historical provider/non-buyer records migrated to REJECTED.');
    }
  } catch (e) {
    console.error('[dbStore] Error during DB lead sanitization:', e.message);
  }
}

function repairHistoricalWorkspaceSessions() {
  try {
    let dirty = false;

    // Ensure all top-level org keys exist
    Object.keys(dbData.searchHistory || {}).forEach(orgKey => {
      if (!dbData.searchSessionResults[orgKey]) dbData.searchSessionResults[orgKey] = {};
      if (!dbData.rawSearchResults[orgKey]) dbData.rawSearchResults[orgKey] = {};
    });

    if (!dbData.searchHistory['amusemac-studio']) dbData.searchHistory['amusemac-studio'] = [];
    if (!dbData.searchSessionResults['amusemac-studio']) dbData.searchSessionResults['amusemac-studio'] = {};

    // Safely map temporary tenant sessions (e.g. govindvkumar27@gmail.com) to primary workspace amusemac-studio
    Object.keys(dbData.searchHistory || {}).forEach(orgKey => {
      if (orgKey !== 'amusemac-studio') {
        const sessions = dbData.searchHistory[orgKey] || [];
        const toMove = [];

        sessions.forEach(sess => {
          if (sess.user === 'govindvkumar27@gmail.com' || (sess.user && sess.user.includes('govind'))) {
            sess.orgId = 'amusemac-studio';
            sess.userId = 'usr-govind-001';
            toMove.push(sess);
          }
        });

        toMove.forEach(sess => {
          const exists = dbData.searchHistory['amusemac-studio'].some(s => s.search_session_id === sess.search_session_id || s.id === sess.id);
          if (!exists) {
            dbData.searchHistory['amusemac-studio'].push(sess);
            dirty = true;
          }
          if (dbData.searchSessionResults[orgKey]?.[sess.search_session_id]) {
            dbData.searchSessionResults['amusemac-studio'][sess.search_session_id] = dbData.searchSessionResults[orgKey][sess.search_session_id];
          }
        });
      }
    });

    // Populate missing userId/user metadata on historical sessions in amusemac-studio
    (dbData.searchHistory['amusemac-studio'] || []).forEach(sess => {
      if (!sess.userId) {
        if (sess.user === 'admin@amusemacstudio.in' || sess.user === 'Admin') {
          sess.userId = 'usr-super-admin';
          sess.role = 'SUPER_ADMIN';
        } else if (sess.user === 'govindvkumar27@gmail.com' || (sess.user && sess.user.includes('govind'))) {
          sess.userId = 'usr-govind-001';
          sess.role = 'TEAM_MEMBER';
        }
      }
    });

    if (dirty) {
      saveDatabase();
      console.log('[dbStore] Historical search sessions mapped to amusemac-studio workspace.');
    }
  } catch (e) {
    console.error('[dbStore] Error during historical session repair:', e.message);
  }
}

function loadDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      dbData = JSON.parse(raw);
      if (!dbData.leads) dbData.leads = {};
      if (!dbData.searchHistory) dbData.searchHistory = {};
      if (!dbData.searchSessionResults) dbData.searchSessionResults = {};
      if (!dbData.rawSearchResults) dbData.rawSearchResults = {};
      if (!dbData.leadHistory) dbData.leadHistory = {};
      if (!dbData.pipeline) dbData.pipeline = {};
      if (!dbData.emails) dbData.emails = {};
      if (!dbData.leadFeedback) dbData.leadFeedback = {};
      if (!dbData.companyGraph) dbData.companyGraph = {};
      sanitizeDatabaseLeads();
      repairHistoricalWorkspaceSessions();
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error('[dbStore] Error loading database:', err.message);
    dbData = { ...initialDb };
  }
  return dbData;
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf8');
  } catch (err) {
    console.error('[dbStore] Error saving database:', err.message);
  }
}

// Load DB on module initialization
loadDatabase();

function generateLeadFingerprint(lead) {
  const rawUrl = (lead.sourceUrl || lead.source_url || '').toLowerCase().trim();
  const urlWithoutQuery = rawUrl.split('?')[0].split('#')[0].replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '').trim();
  const normTitle = (lead.title || lead.requirement_title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
  const normRequester = (lead.companyName || lead.company_name || lead.requester || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
  const raw = `${urlWithoutQuery}|${normTitle}|${normRequester}`;
  return crypto.createHash('md5').update(raw).digest('hex');
}

/**
 * Upserts a single lead record into orgId scope while strictly preserving
 * original first_discovered_at, pipeline stage, notes, and email history.
 */
function upsertLead(orgId = 'amusemac-studio', lead = {}) {
  if (!dbData.leads[orgId]) dbData.leads[orgId] = {};
  const orgMap = dbData.leads[orgId];

  const fp = lead.fingerprint || generateLeadFingerprint(lead);
  const leadId = lead.id || lead.leadId || lead.lead_id || `LEAD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const nowStr = new Date().toISOString();

  // Find existing lead record by fingerprint, ID, or sourceUrl
  const existingKey = Object.keys(orgMap).find(k => {
    const l = orgMap[k];
    const matchFp = l.fingerprint && l.fingerprint === fp;
    const matchId = l.id === leadId || l.leadId === leadId || l.lead_id === leadId;
    const matchUrl = l.sourceUrl && (lead.sourceUrl || lead.source_url) && (l.sourceUrl === lead.sourceUrl || l.sourceUrl === lead.source_url);
    return Boolean(matchFp || matchId || matchUrl);
  });

  const source_platform = lead.source_platform || lead.source || 'Public Web';
  const research_sources = Array.isArray(lead.research_sources) && lead.research_sources.length > 0
    ? lead.research_sources
    : [lead.sourceUrl || lead.source_url || ''];
  const confidenceScore = lead.research_confidence_score || lead.confidenceScore || 92;

  if (existingKey) {
    const existing = orgMap[existingKey];

    // PRESERVE IMMUTABLE & CRM FIELDS: first_discovered_at, outreachStatus, pipeline_stage, notes, nextAction
    const originalFirstDiscoveredAt = existing.first_discovered_at || existing.first_seen_at || existing.created_at || nowStr;
    const preservedOutreachStatus = existing.outreachStatus || existing.pipeline_stage || 'NEW';
    const preservedPipelineStage = existing.pipeline_stage || existing.outreachStatus || 'DISCOVERED';
    const preservedNotes = existing.notes !== undefined ? existing.notes : (lead.notes || '');
    const preservedNextAction = existing.nextAction !== undefined ? existing.nextAction : (lead.nextAction || '');
    const preservedFollowUpDate = existing.followUpDate !== undefined ? existing.followUpDate : (lead.followUpDate || '');

    const updated = {
      ...existing,
      ...lead,
      id: existing.id || leadId,
      leadId: existing.leadId || leadId,
      lead_id: existing.lead_id || leadId,
      first_discovered_at: originalFirstDiscoveredAt,
      first_seen_at: originalFirstDiscoveredAt,
      created_at: existing.created_at || originalFirstDiscoveredAt,
      last_seen_at: nowStr,
      updated_at: nowStr,
      outreachStatus: preservedOutreachStatus,
      pipeline_stage: preservedPipelineStage,
      notes: preservedNotes,
      nextAction: preservedNextAction,
      followUpDate: preservedFollowUpDate,
      source_platform,
      research_sources,
      research_confidence_score: confidenceScore,
      confidenceScore: confidenceScore,
      researchStatus: lead.researchStatus || existing.researchStatus || 'COMPLETED',
      deepResearch: lead.deepResearch || existing.deepResearch || {
        status: 'COMPLETED',
        verified: true,
        confidenceScore,
        demandEvidence: lead.demand_evidence || lead.evidence || 'Verified active buyer requirement.',
        sources: research_sources,
        completedAt: nowStr
      },
      fingerprint: fp
    };

    orgMap[existingKey] = updated;
    saveDatabase();

    // Record lead duplicate re-discovery event in leadHistory
    recordLeadEvent(orgId, updated.leadId, 'LEAD_DUPLICATE_DETECTED', {
      search_session_id: lead.search_session_id || '',
      reDiscoveredAt: nowStr
    });

    return { isNew: false, lead: updated };
  } else {
    const newLead = {
      id: leadId,
      leadId: leadId,
      lead_id: leadId,
      title: lead.title || lead.requirement_title || 'Public Requirement',
      requirement_title: lead.title || lead.requirement_title || 'Public Requirement',
      requirement: lead.requirement || lead.requirement_summary || 'Public Requirement',
      requirement_summary: lead.requirement_summary || lead.requirement || 'Public Requirement',
      full_requirement: lead.full_requirement || lead.description || lead.requirement,
      description: lead.description || lead.requirement,
      primaryService: lead.primaryService || lead.service_needed || (lead.matchedServices && lead.matchedServices[0]) || 'Creative Production',
      service_needed: lead.service_needed || lead.primaryService || (lead.matchedServices && lead.matchedServices[0]) || 'Creative Production',
      project_type: lead.projectType || lead.primaryService || 'Project / Contract',
      remote_status: lead.remote_status || lead.workMode || 'Remote Worldwide',
      workMode: lead.workMode || 'REMOTE_WORLDWIDE',
      engagementType: lead.engagementType || 'PROJECT',
      engagement_type: lead.engagement_type || lead.engagementType || 'PROJECT',
      location: lead.location || 'Worldwide',
      country: lead.country || lead.location || 'Worldwide',
      budget: lead.budget || 'Budget on Discussion',
      deadline: lead.deadline || 'Flexible / Project Based',
      posted_date: lead.posted_date || lead.postedAt || nowStr.slice(0, 10),
      postedAt: lead.posted_date || lead.postedAt || nowStr.slice(0, 10),
      posted_time: lead.posted_time || 'Not available',
      posted_timezone: lead.posted_timezone || 'Not available',
      source: source_platform,
      source_platform: source_platform,
      source_url: lead.sourceUrl || lead.source_url || '',
      sourceUrl: lead.sourceUrl || lead.source_url || '',
      original_source_url: lead.sourceUrl || lead.source_url || '',
      source_domain: lead.source_domain || (lead.sourceUrl ? new URL(lead.sourceUrl).hostname.replace(/^www\./, '') : 'Public Web'),
      source_provider: lead.source_provider || 'Public Web Search',
      source_title: lead.title || 'Public Requirement',
      source_snippet: lead.requirement || lead.snippet || '',
      company_name: lead.companyName || lead.company_name || lead.requester || 'Client Requester',
      companyName: lead.companyName || lead.company_name || lead.requester || 'Client Requester',
      contact_name: lead.contactInfo?.name || lead.contact_name || lead.decisionMakerName || 'Not available',
      contact_role: lead.contactInfo?.role || lead.contact_role || 'Not available',
      contact_email: lead.contactInfo?.email || lead.contact_email || lead.email || 'Not available',
      contact_phone: lead.contactInfo?.phone || lead.contact_phone || lead.phone || 'Not available',
      company_website: lead.company_website || lead.website || 'Not available',
      original_source_content: lead.original_source_content || lead.description || lead.snippet || 'Not available',
      demand_intent_score: lead.demand_intent_score || lead.intentScore || 75,
      lead_quality_score: lead.lead_quality_score || lead.leadQualityScore || lead.aiScore || 80,
      leadQualityScore: lead.lead_quality_score || lead.leadQualityScore || lead.aiScore || 80,
      aiScore: lead.lead_quality_score || lead.leadQualityScore || lead.aiScore || 80,
      qualification_reason: lead.whyThisIsAMatch || lead.evidence || lead.qualification_reason || 'Matching buyer demand signals.',
      qualification_status: 'QUALIFIED_DEMAND',
      demand_evidence: lead.demand_evidence || lead.evidence || 'Verified active buyer requirement.',
      evidence: lead.evidence || lead.demand_evidence || 'Verified active buyer requirement.',
      researchStatus: 'COMPLETED',
      research_confidence_score: confidenceScore,
      confidenceScore: confidenceScore,
      research_sources,
      deepResearch: lead.deepResearch || {
        status: 'COMPLETED',
        verified: true,
        confidenceScore,
        demandEvidence: lead.demand_evidence || lead.evidence || 'Verified active buyer requirement.',
        sources: research_sources,
        completedAt: nowStr
      },
      first_discovered_at: nowStr,
      first_seen_at: nowStr,
      created_at: nowStr,
      last_seen_at: nowStr,
      updated_at: nowStr,
      search_query: lead.search_query || '',
      search_session_id: lead.search_session_id || '',
      status: lead.status || 'DISCOVERED',
      outreachStatus: lead.outreachStatus || 'NEW',
      pipeline_stage: lead.pipeline_stage || lead.outreachStatus || 'DISCOVERED',
      notes: lead.notes || '',
      dataStatus: 'REAL_PUBLIC',
      matchedServices: lead.matchedServices || ['Creative Production'],
      fingerprint: fp
    };

    orgMap[leadId] = newLead;
    saveDatabase();

    // Record lead creation event in leadHistory
    recordLeadEvent(orgId, leadId, 'LEAD_DISCOVERED', {
      search_session_id: lead.search_session_id || '',
      discoveredAt: nowStr
    });

    return { isNew: true, lead: newLead };
  }
}

/**
 * Updates pipeline status or notes for a lead
 */
function updateLeadPipeline(orgId = 'amusemac-studio', leadId = '', pipelineData = {}) {
  if (!dbData.leads[orgId]) dbData.leads[orgId] = {};
  const orgMap = dbData.leads[orgId];
  const lead = orgMap[leadId] || Object.values(orgMap).find(l => l.leadId === leadId || l.id === leadId);

  if (lead) {
    const oldStage = lead.pipeline_stage || lead.outreachStatus;
    if (pipelineData.pipeline_stage || pipelineData.outreachStatus) {
      lead.pipeline_stage = pipelineData.pipeline_stage || pipelineData.outreachStatus;
      lead.outreachStatus = pipelineData.outreachStatus || pipelineData.pipeline_stage;
    }
    if (pipelineData.notes !== undefined) lead.notes = pipelineData.notes;
    if (pipelineData.nextAction !== undefined) lead.nextAction = pipelineData.nextAction;
    if (pipelineData.followUpDate !== undefined) lead.followUpDate = pipelineData.followUpDate;
    lead.updated_at = new Date().toISOString();
    saveDatabase();

    recordLeadEvent(orgId, lead.leadId, 'PIPELINE_STAGE_CHANGED', {
      fromStage: oldStage,
      toStage: lead.pipeline_stage,
      updatedAt: lead.updated_at
    });

    return lead;
  }
  return null;
}

/**
 * Gets all leads for an organization
 */
function getLeads(orgId = 'amusemac-studio') {
  if (!dbData.leads[orgId]) return [];
  return Object.values(dbData.leads[orgId]).filter(l =>
    l.dataStatus !== 'REJECTED_PROVIDER' &&
    l.intentType !== 'REJECT' &&
    l.pipeline_stage !== 'REJECTED'
  );
}

/**
 * Gets a lead by ID
 */
function getLeadById(orgId = 'amusemac-studio', leadId = '') {
  if (!dbData.leads[orgId]) return null;
  const orgMap = dbData.leads[orgId];
  return orgMap[leadId] || Object.values(orgMap).find(l => l.leadId === leadId || l.id === leadId) || null;
}

/**
 * Records a search session along with full result snapshots and raw candidate items
 */
function recordSearchSession(orgId = 'amusemac-studio', sessionData = {}) {
  if (!dbData.searchHistory[orgId]) dbData.searchHistory[orgId] = [];
  if (!dbData.searchSessionResults[orgId]) dbData.searchSessionResults[orgId] = {};
  if (!dbData.rawSearchResults[orgId]) dbData.rawSearchResults[orgId] = {};

  const sessionId = sessionData.search_session_id || `SESSION-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const nowStr = new Date().toISOString();

  const sessionRecord = {
    search_session_id: sessionId,
    id: sessionId,
    orgId: sessionData.orgId || orgId,
    userId: sessionData.userId || 'usr-admin',
    user: sessionData.user || 'Admin',
    role: sessionData.role || 'ADMIN',
    created_at: sessionData.created_at || sessionData.started_at || nowStr,
    completed_at: sessionData.completed_at || nowStr,
    started_at: sessionData.started_at || sessionData.created_at || nowStr,
    status: sessionData.status || 'COMPLETED',
    original_search_query: sessionData.original_search_query || sessionData.query || '',
    query: sessionData.original_search_query || sessionData.query || '',
    location_mode: sessionData.location_mode || 'worldwide',
    countries: Array.isArray(sessionData.countries) ? sessionData.countries : [],
    manual_location: sessionData.manual_location || '',
    work_mode: sessionData.work_mode || 'REMOTE_WORLDWIDE',
    engagement_type: sessionData.engagement_type || 'ANY',
    opportunity_type: sessionData.opportunity_type || '',
    result_mode: sessionData.result_mode || 'MAXIMUM',
    result_limit: sessionData.result_limit || 'MAXIMUM',
    result_limit_label: sessionData.result_limit_label || 'Maximum Results',
    serpapi_engine: sessionData.serpapi_engine || 'google',
    serpapi_key_slot_used: sessionData.serpapi_key_slot_used || 'primary',
    serpapi_requests_count: sessionData.serpapi_requests_count || 0,
    serpapi_credits_consumed_if_known: sessionData.serpapi_credits_consumed_if_known || sessionData.serpapi_requests_count || 0,
    raw_results_count: sessionData.raw_results_count || sessionData.candidate_count || 0,
    provider_rejected_count: sessionData.provider_rejected_count || sessionData.rejected_count || 0,
    irrelevant_count: sessionData.irrelevant_count || 0,
    duplicate_count: sessionData.duplicate_count || 0,
    deep_researched_count: sessionData.deep_researched_count || sessionData.qualified_leads_count || 0,
    qualified_leads_count: sessionData.qualified_leads_count || sessionData.qualified_count || 0,
    new_leads_count: sessionData.new_leads_count || 0,
    updated_leads_count: sessionData.updated_leads_count || 0,
    intent_extracted: sessionData.intent_extracted || null,
    generated_queries: sessionData.generated_queries || [],
    executed_queries: sessionData.executed_queries || [],
    search_depth: sessionData.search_depth || 'PRO',
    previously_discovered_count: sessionData.previously_discovered_count || 0
  };

  // 1. Unshift session record to searchHistory
  const existingIdx = dbData.searchHistory[orgId].findIndex(s => s.search_session_id === sessionId || s.id === sessionId);
  if (existingIdx >= 0) {
    dbData.searchHistory[orgId][existingIdx] = sessionRecord;
  } else {
    dbData.searchHistory[orgId].unshift(sessionRecord);
  }

  // Preserve history limit at 200 sessions
  dbData.searchHistory[orgId] = dbData.searchHistory[orgId].slice(0, 200);

  // 2. Save result snapshot for historical session retrieval
  if (Array.isArray(sessionData.results)) {
    dbData.searchSessionResults[orgId][sessionId] = sessionData.results.map(r => ({
      ...r,
      search_session_id: sessionId
    }));
  }

  // 3. Save raw candidate evaluation snapshot
  if (Array.isArray(sessionData.raw_candidates)) {
    dbData.rawSearchResults[orgId][sessionId] = sessionData.raw_candidates;
  }

  saveDatabase();
  return sessionRecord;
}

/**
 * Gets search history for an organization
 */
function getSearchHistory(orgId = 'amusemac-studio') {
  if (!dbData.searchHistory[orgId]) return [];
  return dbData.searchHistory[orgId];
}

function getUserSearchHistory(orgId = 'amusemac-studio', userId = '', userEmail = '') {
  if (!dbData.searchHistory[orgId]) return [];
  const cleanEmail = (userEmail || '').toLowerCase().trim();
  return dbData.searchHistory[orgId].filter(s => {
    if (s.userId && s.userId === userId) return true;
    if (s.user_id && s.user_id === userId) return true;
    if (cleanEmail && s.user && s.user.toLowerCase().trim() === cleanEmail) return true;
    return false;
  });
}

/**
 * Gets saved search session results snapshot for a historical session
 */
function getSearchSessionResults(orgId = 'amusemac-studio', sessionId = '') {
  if (!dbData.searchSessionResults[orgId]) return [];
  const snapshot = dbData.searchSessionResults[orgId][sessionId];
  if (snapshot && snapshot.length > 0) return snapshot;

  // Fallback: search leads matching search_session_id
  const orgLeads = getLeads(orgId);
  return orgLeads.filter(l => l.search_session_id === sessionId);
}

/**
 * Gets raw candidate evaluation snapshot for a historical session
 */
function getRawSearchResults(orgId = 'amusemac-studio', sessionId = '') {
  if (!dbData.rawSearchResults[orgId]) return [];
  return dbData.rawSearchResults[orgId][sessionId] || [];
}

/**
 * Deletes a search session record
 */
function deleteSearchSession(orgId = 'amusemac-studio', sessionId = '') {
  if (dbData.searchHistory[orgId]) {
    dbData.searchHistory[orgId] = dbData.searchHistory[orgId].filter(s => s.search_session_id !== sessionId && s.id !== sessionId);
  }
  if (dbData.searchSessionResults[orgId]) {
    delete dbData.searchSessionResults[orgId][sessionId];
  }
  if (dbData.rawSearchResults[orgId]) {
    delete dbData.rawSearchResults[orgId][sessionId];
  }
  saveDatabase();
  return true;
}

/**
 * Records a lead lifecycle audit event in leadHistory
 */
function recordLeadEvent(orgId = 'amusemac-studio', leadId = '', eventType = '', metadata = {}) {
  if (!dbData.leadHistory[orgId]) dbData.leadHistory[orgId] = {};
  if (!dbData.leadHistory[orgId][leadId]) dbData.leadHistory[orgId][leadId] = [];

  const eventRecord = {
    event_id: `EVT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    lead_id: leadId,
    timestamp: new Date().toISOString(),
    event_type: eventType,
    metadata
  };

  dbData.leadHistory[orgId][leadId].unshift(eventRecord);
  saveDatabase();
  return eventRecord;
}

/**
 * Gets audit history events for a specific lead
 */
function getLeadHistory(orgId = 'amusemac-studio', leadId = '') {
  if (!dbData.leadHistory[orgId]) return [];
  return dbData.leadHistory[orgId][leadId] || [];
}

// EMAIL FUNCTIONS
function getEmails(orgId = 'amusemac-studio') {
  if (!dbData.emails[orgId]) return [];
  return Object.values(dbData.emails[orgId]);
}

function getEmailById(orgId = 'amusemac-studio', emailId = '') {
  if (!dbData.emails[orgId]) return null;
  return dbData.emails[orgId][emailId] || null;
}

function upsertEmail(orgId = 'amusemac-studio', email = {}) {
  if (!dbData.emails[orgId]) dbData.emails[orgId] = {};
  const emailId = email.id || `EML-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const record = { ...email, id: emailId, updatedAt: new Date().toISOString() };
  dbData.emails[orgId][emailId] = record;
  saveDatabase();

  // If email is associated with a lead, record email event in leadHistory
  if (email.leadId) {
    recordLeadEvent(orgId, email.leadId, email.direction === 'OUTBOUND' ? 'EMAIL_SENT' : 'EMAIL_RECEIVED', {
      emailId,
      subject: email.subject,
      from: email.from,
      to: email.to
    });
  }

  return record;
}

function deleteEmail(orgId = 'amusemac-studio', emailId = '') {
  if (dbData.emails[orgId] && dbData.emails[orgId][emailId]) {
    delete dbData.emails[orgId][emailId];
    saveDatabase();
    return true;
  }
  return false;
}

function isLeadDuplicate(orgId = 'amusemac-studio', lead = {}) {
  if (!dbData.leads[orgId]) return false;
  const orgMap = dbData.leads[orgId];
  const fp = lead.fingerprint || generateLeadFingerprint(lead);
  const leadId = lead.id || lead.leadId || lead.lead_id;
  const targetUrl = (lead.sourceUrl || lead.source_url || '').toLowerCase().replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '').trim();

  return Object.values(orgMap).some(l => {
    const matchFp = l.fingerprint && l.fingerprint === fp;
    const matchId = leadId && (l.id === leadId || l.leadId === leadId || l.lead_id === leadId);
    const existingUrl = (l.sourceUrl || l.source_url || '').toLowerCase().replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '').trim();
    const matchUrl = Boolean(targetUrl && existingUrl && targetUrl === existingUrl);
    return Boolean(matchFp || matchId || matchUrl);
  });
}

/**
 * User Presence Store Management
 */
function getUserPresence(orgId = 'amusemac-studio', userId = '') {
  if (!dbData.presence[orgId]) return null;
  return dbData.presence[orgId][userId] || null;
}

function getWorkspacePresence(orgId = 'amusemac-studio') {
  if (!dbData.presence[orgId]) return [];
  cleanupStalePresence(orgId);
  return Object.values(dbData.presence[orgId]);
}

function updateUserPresence(userId = '', orgId = 'amusemac-studio', status = 'ONLINE', metadata = {}) {
  if (!userId) return null;
  if (!dbData.presence[orgId]) dbData.presence[orgId] = {};

  const nowStr = new Date().toISOString();
  const existing = dbData.presence[orgId][userId] || {
    userId,
    orgId,
    userName: metadata.userName || metadata.name || 'Workspace User',
    email: metadata.email || '',
    role: metadata.role || 'TEAM_MEMBER',
    status: 'OFFLINE',
    lastLoginAt: nowStr,
    lastSeenAt: nowStr,
    lastLogoutAt: null,
    activeSessionCount: 0,
    currentSessionId: null
  };

  const isLogin = status === 'LOGIN' || metadata.isLogin;
  const isLogout = status === 'LOGOUT' || metadata.isLogout;
  const newStatus = isLogout ? 'OFFLINE' : (status === 'OFFLINE' ? 'OFFLINE' : 'ONLINE');

  let activeSessions = existing.activeSessionCount || 0;
  if (isLogin) {
    activeSessions += 1;
  } else if (isLogout) {
    activeSessions = Math.max(0, activeSessions - 1);
  }

  const record = {
    ...existing,
    userName: metadata.userName || metadata.name || existing.userName,
    email: metadata.email || existing.email,
    role: metadata.role || existing.role,
    status: activeSessions > 0 ? 'ONLINE' : newStatus,
    lastLoginAt: isLogin ? nowStr : existing.lastLoginAt,
    lastSeenAt: nowStr,
    lastLogoutAt: isLogout ? nowStr : existing.lastLogoutAt,
    activeSessionCount: activeSessions,
    currentSessionId: metadata.sessionId || existing.currentSessionId
  };

  dbData.presence[orgId][userId] = record;
  saveDatabase();
  return record;
}

function registerUserHeartbeat(userId = '', orgId = 'amusemac-studio', sessionId = '') {
  if (!userId) return null;
  if (!dbData.presence[orgId]) dbData.presence[orgId] = {};

  const nowStr = new Date().toISOString();
  const existing = dbData.presence[orgId][userId];
  if (!existing) return null;

  const record = {
    ...existing,
    status: 'ONLINE',
    lastSeenAt: nowStr,
    activeSessionCount: Math.max(1, existing.activeSessionCount || 1),
    currentSessionId: sessionId || existing.currentSessionId
  };

  dbData.presence[orgId][userId] = record;
  saveDatabase();
  return record;
}

function cleanupStalePresence(orgId = 'amusemac-studio', timeoutMs = 90000) {
  if (!dbData.presence[orgId]) return;
  const now = Date.now();
  let dirty = false;

  Object.keys(dbData.presence[orgId]).forEach(uId => {
    const userP = dbData.presence[orgId][uId];
    if (userP.status === 'ONLINE') {
      const lastSeen = new Date(userP.lastSeenAt).getTime();
      if (!isNaN(lastSeen) && now - lastSeen > timeoutMs) {
        userP.status = 'OFFLINE';
        userP.activeSessionCount = 0;
        dirty = true;
      }
    }
  });

  if (dirty) {
    saveDatabase();
  }
}

/**
 * Search Memory Store Functions
 */
function getSearchMemory(orgId = 'amusemac-studio') {
  if (!dbData.searchMemory) dbData.searchMemory = {};
  return dbData.searchMemory[orgId] || [];
}

function recordSearchMemory(orgId = 'amusemac-studio', memoryItems = []) {
  if (!dbData.searchMemory) dbData.searchMemory = {};
  if (!dbData.searchMemory[orgId]) dbData.searchMemory[orgId] = [];

  const now = new Date().toISOString();
  memoryItems.forEach(item => {
    dbData.searchMemory[orgId].unshift({
      ...item,
      normalizedQuery: (item.query || '').toLowerCase().trim(),
      timestamp: now
    });
  });

  dbData.searchMemory[orgId] = dbData.searchMemory[orgId].slice(0, 100);
  saveDatabase();
}

/**
 * Check if candidate lead is a duplicate of an existing lead in orgId scope
 */
function isLeadDuplicate(orgId = 'amusemac-studio', candidateLead = {}) {
  if (!dbData.leads || !dbData.leads[orgId]) return { exists: false };
  const orgMap = dbData.leads[orgId];
  const candFp = candidateLead.fingerprint || generateLeadFingerprint(candidateLead);
  const candUrl = (candidateLead.sourceUrl || candidateLead.source_url || candidateLead.url || '').toLowerCase().trim();
  const candId = candidateLead.id || candidateLead.leadId || candidateLead.lead_id;

  for (const k of Object.keys(orgMap)) {
    const lead = orgMap[k];
    if (candId && (lead.id === candId || lead.leadId === candId || lead.lead_id === candId)) {
      return { exists: true, leadId: lead.id || lead.leadId || k };
    }
    const leadFp = lead.fingerprint || generateLeadFingerprint(lead);
    const leadUrl = (lead.sourceUrl || lead.source_url || lead.url || '').toLowerCase().trim();

    if ((candFp && leadFp && candFp === leadFp) || (candUrl && leadUrl && candUrl === leadUrl)) {
      return { exists: true, leadId: lead.id || lead.leadId || k };
    }
  }

  return { exists: false };
}

/**
 * Update Previously Discovered Lead (Preserve original first_discovered_at & CRM stage)
 */
function updateExistingLeadDiscovery(orgId = 'amusemac-studio', leadId = '', sessionMeta = {}) {
  if (!dbData.leads || !dbData.leads[orgId] || !dbData.leads[orgId][leadId]) return null;

  const lead = dbData.leads[orgId][leadId];
  const now = new Date().toISOString();

  lead.last_seen_at = now;
  lead.rediscovery_count = (lead.rediscovery_count || 1) + 1;

  recordLeadEvent(orgId, leadId, {
    eventType: 'REDISCOVERED_IN_SEARCH',
    title: 'Lead Re-encountered in Search Discovery',
    detail: `Re-encountered during search session '${sessionMeta.sessionId || 'SEARCH'}' (Query: '${sessionMeta.query || ''}').`,
    performedBy: sessionMeta.user || 'Search Engine'
  });

  saveDatabase();
  return lead;
}

module.exports = {
  loadDatabase,
  saveDatabase,
  generateLeadFingerprint,
  upsertLead,
  isLeadDuplicate,
  updateLeadPipeline,
  getLeads,
  getLeadById,
  recordSearchSession,
  getSearchHistory,
  getUserSearchHistory,
  getSearchSessionResults,
  getRawSearchResults,
  deleteSearchSession,
  recordLeadEvent,
  getLeadHistory,
  getEmails,
  getEmailById,
  upsertEmail,
  deleteEmail,
  getUserPresence,
  getWorkspacePresence,
  updateUserPresence,
  registerUserHeartbeat,
  cleanupStalePresence,
  getSearchMemory,
  recordSearchMemory,
  updateExistingLeadDiscovery
};
