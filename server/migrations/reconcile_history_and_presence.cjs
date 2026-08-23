const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'server', 'data', 'db.json');
const REPORT_PATH = path.join(process.cwd(), 'server', 'data', 'history_presence_reconciliation_report.json');

console.log('==================================================');
console.log('IDEMPOTENT HISTORY & PRESENCE RECONCILIATION MIGRATION');
console.log('==================================================\n');

if (!fs.existsSync(DB_PATH)) {
  console.error('db.json not found at:', DB_PATH);
  process.exit(1);
}

const raw = fs.readFileSync(DB_PATH, 'utf8');
const dbData = JSON.parse(raw);

if (!dbData.leads) dbData.leads = {};
if (!dbData.searchHistory) dbData.searchHistory = {};
if (!dbData.searchSessionResults) dbData.searchSessionResults = {};
if (!dbData.rawSearchResults) dbData.rawSearchResults = {};
if (!dbData.presence) dbData.presence = {};
if (!dbData.userSessions) dbData.userSessions = {};

let totalSessionsFound = 0;
let sessionsWithSnapshotBefore = 0;
let snapshotsRepaired = 0;
let snapshotsUnrecoverable = 0;
let govindSessionsFound = 0;
let govindSessionsRepaired = 0;
let usersMappedToWorkspace = 0;

// Ensure primary workspace keys exist
if (!dbData.searchHistory['amusemac-studio']) dbData.searchHistory['amusemac-studio'] = [];
if (!dbData.searchSessionResults['amusemac-studio']) dbData.searchSessionResults['amusemac-studio'] = {};
if (!dbData.presence['amusemac-studio']) dbData.presence['amusemac-studio'] = {};

// 1. Audit and repair search sessions across all org keys
Object.keys(dbData.searchHistory || {}).forEach(orgKey => {
  const sessions = dbData.searchHistory[orgKey] || [];
  
  sessions.forEach(sess => {
    totalSessionsFound++;
    const sessionId = sess.search_session_id || sess.id;
    const cleanUserEmail = (sess.user || sess.user_email || '').toLowerCase().trim();

    // Map Govind sessions to canonical identity and primary workspace
    if (cleanUserEmail === 'govindvkumar27@gmail.com' || cleanUserEmail.includes('govind') || sess.userId === 'usr-govind-001') {
      govindSessionsFound++;
      sess.orgId = 'amusemac-studio';
      sess.userId = 'usr-govind-001';
      sess.user = 'govindvkumar27@gmail.com';
      sess.user_email = 'govindvkumar27@gmail.com';
      sess.userName = 'Govind Kumar';
      sess.role = 'TEAM_MEMBER';

      // Move session to amusemac-studio array if it was under another org key
      if (orgKey !== 'amusemac-studio') {
        const existsInStudio = dbData.searchHistory['amusemac-studio'].some(s => (s.search_session_id || s.id) === sessionId);
        if (!existsInStudio) {
          dbData.searchHistory['amusemac-studio'].push(sess);
          govindSessionsRepaired++;
        }
      }
    } else if (cleanUserEmail === 'admin@amusemacstudio.in' || cleanUserEmail === 'admin' || sess.userId === 'usr-super-admin') {
      sess.orgId = 'amusemac-studio';
      sess.userId = 'usr-super-admin';
      sess.user = 'admin@amusemacstudio.in';
      sess.user_email = 'admin@amusemacstudio.in';
      sess.userName = 'Admin User';
      sess.role = 'SUPER_ADMIN';
    } else if (!sess.userId) {
      sess.orgId = 'amusemac-studio';
      sess.userId = 'usr-super-admin';
      sess.user = 'admin@amusemacstudio.in';
      sess.userName = 'Workspace Member';
      sess.role = 'ADMIN';
    }

    // Check if snapshot exists
    const currentOrgKey = sess.orgId || orgKey;
    if (!dbData.searchSessionResults[currentOrgKey]) dbData.searchSessionResults[currentOrgKey] = {};
    const existingSnapshot = dbData.searchSessionResults[currentOrgKey][sessionId];

    if (Array.isArray(existingSnapshot) && existingSnapshot.length > 0) {
      sessionsWithSnapshotBefore++;
    } else {
      // Attempt snapshot recovery from db.leads using session ID, timestamp proximity & query
      const orgLeads = Object.values(dbData.leads[currentOrgKey] || {});
      const matchedLeads = orgLeads.filter(lead => {
        if (lead.search_session_id === sessionId) return true;
        if (lead.search_query && sess.query && lead.search_query.toLowerCase().trim() === sess.query.toLowerCase().trim()) {
          const sessionTime = new Date(sess.created_at || sess.started_at).getTime();
          const leadTime = new Date(lead.created_at || lead.first_seen_at || lead.first_discovered_at).getTime();
          if (!isNaN(sessionTime) && !isNaN(leadTime)) {
            return Math.abs(sessionTime - leadTime) <= 3600000; // Within 1 hour window
          }
        }
        return false;
      });

      if (matchedLeads.length > 0) {
        dbData.searchSessionResults[currentOrgKey][sessionId] = matchedLeads.map(l => ({
          ...l,
          search_session_id: sessionId
        }));
        snapshotsRepaired++;
      } else {
        snapshotsUnrecoverable++;
      }
    }
  });
});

// 2. Initialize and repair canonical presence records in dbData.presence
const studioPresence = dbData.presence['amusemac-studio'];

studioPresence['usr-super-admin'] = {
  userId: 'usr-super-admin',
  orgId: 'amusemac-studio',
  userName: 'Admin User',
  email: 'admin@amusemacstudio.in',
  role: 'SUPER_ADMIN',
  status: 'OFFLINE',
  lastLoginAt: studioPresence['usr-super-admin']?.lastLoginAt || new Date().toISOString(),
  lastSeenAt: studioPresence['usr-super-admin']?.lastSeenAt || new Date().toISOString(),
  lastLogoutAt: studioPresence['usr-super-admin']?.lastLogoutAt || null,
  activeSessionCount: studioPresence['usr-super-admin']?.activeSessionCount || 0,
  currentSessionId: studioPresence['usr-super-admin']?.currentSessionId || null
};

studioPresence['usr-govind-001'] = {
  userId: 'usr-govind-001',
  orgId: 'amusemac-studio',
  userName: 'Govind Kumar',
  email: 'govindvkumar27@gmail.com',
  role: 'TEAM_MEMBER',
  status: 'OFFLINE',
  lastLoginAt: studioPresence['usr-govind-001']?.lastLoginAt || new Date().toISOString(),
  lastSeenAt: studioPresence['usr-govind-001']?.lastSeenAt || new Date().toISOString(),
  lastLogoutAt: studioPresence['usr-govind-001']?.lastLogoutAt || null,
  activeSessionCount: studioPresence['usr-govind-001']?.activeSessionCount || 0,
  currentSessionId: studioPresence['usr-govind-001']?.currentSessionId || null
};

usersMappedToWorkspace = Object.keys(studioPresence).length;

// Count total leads preserved
const totalLeadsPreserved = Object.values(dbData.leads || {}).reduce((acc, map) => acc + Object.keys(map).length, 0);

// Save updated database
fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf8');

// Generate reconciliation report
const report = {
  reconciliationTimestamp: new Date().toISOString(),
  totalUsersFound: usersMappedToWorkspace,
  adminUsers: 1,
  teamMembers: 1,
  historicalSessions: totalSessionsFound,
  sessionsWithSnapshotsBefore: sessionsWithSnapshotBefore,
  snapshotsRepaired: snapshotsRepaired,
  snapshotsUnrecoverable: snapshotsUnrecoverable,
  govindSessionsFound: govindSessionsFound,
  govindSessionsRepaired: govindSessionsRepaired,
  usersMappedToWorkspace: usersMappedToWorkspace,
  duplicateSessionsPrevented: 0,
  leadsPreserved: totalLeadsPreserved,
  serpApiRequestsConsumed: 0,
  presence: {
    usersWithPresenceRecords: usersMappedToWorkspace,
    currentlyOnline: 0,
    currentlyOffline: usersMappedToWorkspace,
    activeSessions: 0
  }
};

fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

console.log('RECONCILIATION SUMMARY:');
console.log(`- Total Search Sessions Processed: ${totalSessionsFound}`);
console.log(`- Snapshots Intact Before Migration: ${sessionsWithSnapshotBefore}`);
console.log(`- Historical Snapshots Repaired: ${snapshotsRepaired}`);
console.log(`- Unrecoverable Historical Snapshots: ${snapshotsUnrecoverable}`);
console.log(`- Govind Sessions Found & Reconciled: ${govindSessionsFound}`);
console.log(`- Total DB Lead Records Preserved: ${totalLeadsPreserved}`);
console.log(`- SerpAPI Credits Consumed: 0`);
console.log(`\nReconciliation report written to: ${REPORT_PATH}`);
