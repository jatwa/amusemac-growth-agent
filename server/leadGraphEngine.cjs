/**
 * AMUSEMAC LEAD GRAPH ENGINE
 * 
 * Manages account & opportunity graph relationships:
 * Company -> People -> Projects -> Signals -> Search Sessions -> Leads
 * 
 * Maintains company signal_history[] to track recurring signals over time.
 */

const { loadDatabase, saveDatabase } = require('./dbStore.cjs');

/**
 * Record signals into company graph history
 */
function recordCompanySignals(orgId = 'amusemac-studio', companyName = '', signals = []) {
  if (!companyName || companyName === 'Not publicly available' || companyName === 'Not publicly identifiable') {
    return;
  }

  const db = loadDatabase();
  if (!db.companyGraph) db.companyGraph = {};
  if (!db.companyGraph[orgId]) db.companyGraph[orgId] = {};

  const cleanCompanyKey = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!cleanCompanyKey) return;

  if (!db.companyGraph[orgId][cleanCompanyKey]) {
    db.companyGraph[orgId][cleanCompanyKey] = {
      companyName,
      firstDiscoveredAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      signalHistory: [],
      projectsCount: 1
    };
  }

  const comp = db.companyGraph[orgId][cleanCompanyKey];
  comp.lastSeenAt = new Date().toISOString();

  for (const sig of signals) {
    comp.signalHistory.push({
      category: sig.category,
      name: sig.name,
      score: sig.effectiveScore || sig.rawScore || 10,
      evidence: sig.evidence || '',
      sourceUrl: sig.sourceUrl || '',
      discoveredAt: new Date().toISOString()
    });
  }

  // Keep last 50 historical signals per company
  if (comp.signalHistory.length > 50) {
    comp.signalHistory = comp.signalHistory.slice(-50);
  }

  saveDatabase();
  return comp;
}

/**
 * Get company historical signals
 */
function getCompanySignalHistory(orgId = 'amusemac-studio', companyName = '') {
  if (!companyName) return [];
  const db = loadDatabase();
  const cleanCompanyKey = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (db.companyGraph && db.companyGraph[orgId] && db.companyGraph[orgId][cleanCompanyKey]) {
    return db.companyGraph[orgId][cleanCompanyKey].signalHistory || [];
  }
  return [];
}

module.exports = {
  recordCompanySignals,
  getCompanySignalHistory
};
