/**
 * USER FEEDBACK & QUALITY ANALYTICS ENGINE
 * 
 * Handles user 👍 Good Lead / 👎 Bad Lead rating & rejection categories:
 * - Not a buyer
 * - Duplicate
 * - Wrong service
 * - Too old
 * - Provider
 * - Article/blog
 * - Irrelevant
 * - Fake/low quality
 * - Other
 */

const { loadDatabase, saveDatabase } = require('./dbStore.cjs');

const REJECTION_REASONS = [
  'NOT_A_BUYER',
  'DUPLICATE',
  'WRONG_SERVICE',
  'TOO_OLD',
  'PROVIDER_SELF_PROMO',
  'ARTICLE_BLOG',
  'IRRELEVANT',
  'FAKE_LOW_QUALITY',
  'OTHER'
];

/**
 * Records user feedback on a specific lead
 */
function recordLeadFeedback(orgId = 'amusemac-studio', leadId, feedbackData = {}) {
  const db = loadDatabase();
  if (!db.leadFeedback) db.leadFeedback = {};
  if (!db.leadFeedback[orgId]) db.leadFeedback[orgId] = {};

  const record = {
    id: `fb_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    leadId,
    type: feedbackData.type === 'GOOD' ? 'GOOD' : 'BAD', // 'GOOD' | 'BAD'
    reasonCategory: feedbackData.reasonCategory || (feedbackData.type === 'GOOD' ? 'HIGH_QUALITY_BUYER' : 'IRRELEVANT'),
    note: feedbackData.note || '',
    userEmail: feedbackData.userEmail || 'system',
    createdAt: new Date().toISOString()
  };

  db.leadFeedback[orgId][leadId] = record;

  // Also update lead's internal feedback status for UI rendering
  if (db.leads && db.leads[orgId] && db.leads[orgId][leadId]) {
    db.leads[orgId][leadId].userFeedback = record;
  }

  saveDatabase();
  return record;
}

/**
 * Calculates aggregated quality metrics across feedback
 */
function getFeedbackAnalytics(orgId = 'amusemac-studio') {
  const db = loadDatabase();
  const orgFeedback = (db.leadFeedback && db.leadFeedback[orgId]) ? Object.values(db.leadFeedback[orgId]) : [];

  let totalFeedback = orgFeedback.length;
  let goodCount = 0;
  let badCount = 0;
  const reasonBreakdown = {};

  for (const fb of orgFeedback) {
    if (fb.type === 'GOOD') {
      goodCount++;
    } else {
      badCount++;
      const cat = fb.reasonCategory || 'IRRELEVANT';
      reasonBreakdown[cat] = (reasonBreakdown[cat] || 0) + 1;
    }
  }

  const goodPercentage = totalFeedback > 0 ? Math.round((goodCount / totalFeedback) * 100) : 100;
  const badPercentage = totalFeedback > 0 ? Math.round((badCount / totalFeedback) * 100) : 0;

  return {
    totalFeedback,
    goodCount,
    badCount,
    goodPercentage,
    badPercentage,
    reasonBreakdown
  };
}

module.exports = {
  REJECTION_REASONS,
  recordLeadFeedback,
  getFeedbackAnalytics
};
