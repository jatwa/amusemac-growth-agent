/**
 * AMUSEMAC PRODUCTION DEMAND INTELLIGENCE - SIGNAL ENGINE
 * 
 * Central Signal Engine for discovering, categorizing, scoring, decay-weighting,
 * and stacking production industry intent signals across 8 core categories.
 */

// 1. SIGNAL CATEGORY TAXONOMIES & PATTERNS
const SIGNAL_DEFINITIONS = {
  DIRECT_BUYER_DEMAND: {
    category: 'DIRECT_BUYER_DEMAND',
    name: 'Direct Buyer Procurement / Requirement',
    baseWeight: 40,
    keywords: [
      'looking for', 'seeking', 'need', 'needs', 'required', 'requires', 'hiring vendor',
      'looking for agency', 'looking for production partner', 'looking for freelancer',
      'requesting proposals', 'rfp', 'rfq', 'tender', 'procurement', 'submit proposal',
      'submit bid', 'vendor required', 'agency required', 'production partner needed',
      'creative partner needed', 'contractor needed', 'seeking vendor', 'request for quotation'
    ]
  },
  HIRING_SIGNAL: {
    category: 'HIRING_SIGNAL',
    name: 'Hiring / Team Expansion Signal',
    baseWeight: 20,
    keywords: [
      'hiring video producer', 'hiring creative producer', 'hiring content producer',
      'hiring production manager', 'hiring documentary producer', 'hiring ai video specialist',
      'hiring video editor', 'hiring motion designer', 'hiring cinematographer',
      'hiring director of photography', 'hiring creative director', 'head of production vacancy',
      'hiring video team', 'hiring in-house video', 'video production job'
    ]
  },
  PROJECT_CAMPAIGN: {
    category: 'PROJECT_CAMPAIGN',
    name: 'Upcoming Project / Brand Campaign',
    baseWeight: 15,
    keywords: [
      'product launch', 'marketing campaign', 'brand campaign', 'new content initiative',
      'documentary project', 'film project', 'commercial shoot', 'rebranding',
      'expansion campaign', 'new market launch', 'advertising campaign', 'brand film',
      'annual report video', 'explainer video project', 'launch event'
    ]
  },
  FUNDING_GROWTH: {
    category: 'FUNDING_GROWTH',
    name: 'Funding / Capital / Business Expansion',
    baseWeight: 12,
    keywords: [
      'funding round', 'raised series a', 'raised series b', 'raised series c',
      'raised seed', 'secures funding', 'major investment', 'rapid hiring',
      'market expansion', 'new office in', 'acquisition', 'geographic expansion',
      'company expansion', 'doubles team size'
    ]
  },
  NEWS_EVENT: {
    category: 'NEWS_EVENT',
    name: 'Company Press / Industry Event',
    baseWeight: 8,
    keywords: [
      'press release', 'announces launch', 'unveils new', 'keynote presentation',
      'industry conference', 'brand summit', 'sponsorship', 'partnership announcement',
      'milestone event', 'annual convention'
    ]
  },
  SOCIAL_COMMUNITY: {
    category: 'SOCIAL_COMMUNITY',
    name: 'Social / Community Public Request',
    baseWeight: 15,
    keywords: [
      'linkedin.com/feed', 'linkedin.com/posts', 'facebook.com/groups', 'reddit.com/r/',
      'looking for recommendations video', 'can anyone recommend a video agency',
      'need a shoot crew', 'looking to hire a film crew', 'freelance recommendation'
    ]
  },
  WEBSITE_CONTENT: {
    category: 'WEBSITE_CONTENT',
    name: 'Website Launch / Major Content Change',
    baseWeight: 10,
    keywords: [
      'new website launch', 'new product page', 'new case study', 'new campaign page',
      'rebranded website', 'content portal launch', 'media hub launch'
    ]
  },
  TECH_BUSINESS: {
    category: 'TECH_BUSINESS',
    name: 'Technology / Production Stack Adoption',
    baseWeight: 8,
    keywords: [
      'ai video technology', 'virtual production studio', 'martech expansion',
      'content production platform', 'unreal engine workflow', 'generative video'
    ]
  }
};

/**
 * Evaluates raw item content and extracts all matching signal objects
 */
function extractSignals(candidate = {}, referenceDate = new Date()) {
  const title = (candidate.title || candidate.requirement_title || candidate.source_title || '').toLowerCase();
  const snippet = (candidate.requirement || candidate.description || candidate.snippet || '').toLowerCase();
  const url = (candidate.sourceUrl || candidate.source_url || '').toLowerCase();
  const fullText = `${title} ${snippet} ${url}`;

  const extractedSignals = [];

  for (const key of Object.keys(SIGNAL_DEFINITIONS)) {
    const def = SIGNAL_DEFINITIONS[key];
    const matchedKeywords = [];

    for (const kw of def.keywords) {
      if (fullText.includes(kw)) {
        matchedKeywords.push(kw);
      }
    }

    if (matchedKeywords.length > 0) {
      // Calculate signal strength based on number of matches and match location
      let matchBonus = Math.min(matchedKeywords.length * 5, 20);
      let titleBonus = title.includes(matchedKeywords[0]) ? 10 : 0;
      let rawScore = def.baseWeight + matchBonus + titleBonus;

      const evidenceText = extractEvidenceSnippet(candidate, matchedKeywords);
      const pubDate = candidate.posted_at_iso || candidate.postedAt || candidate.discovered_at || referenceDate.toISOString();

      extractedSignals.push({
        id: `sig_${key.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        category: def.category,
        name: def.name,
        baseWeight: def.baseWeight,
        rawScore,
        matchedKeywords,
        evidence: evidenceText,
        sourceUrl: candidate.sourceUrl || candidate.source_url || '',
        publishedAt: pubDate,
        discoveredAt: candidate.discovered_at || new Date().toISOString()
      });
    }
  }

  return extractedSignals;
}

/**
 * Extracts concise evidence snippet around matched keywords
 */
function extractEvidenceSnippet(candidate, keywords = []) {
  const text = candidate.requirement || candidate.description || candidate.snippet || candidate.title || '';
  if (!text) return 'Signal evidence detected in page metadata.';

  const kw = keywords[0];
  if (!kw) return text.slice(0, 200);

  const idx = text.toLowerCase().indexOf(kw.toLowerCase());
  if (idx === -1) return text.slice(0, 200);

  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + kw.length + 120);
  let snippet = text.slice(start, end).trim();

  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Calculates signal decay multiplier based on age:
 * 0-7 days   = 1.0  (Full strength)
 * 8-14 days  = 0.85 (Strong)
 * 15-30 days = 0.65 (Moderate)
 * 31-90 days = 0.45 (Weak)
 * 90+ days   = 0.20 (Historical)
 */
function calculateSignalDecay(publishedAtStr, referenceDate = new Date()) {
  if (!publishedAtStr) return { factor: 1.0, ageDays: 0, status: 'FRESH' };

  const pubDate = new Date(publishedAtStr);
  if (isNaN(pubDate.getTime())) return { factor: 1.0, ageDays: 0, status: 'FRESH' };

  const diffMs = referenceDate.getTime() - pubDate.getTime();
  const ageDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (ageDays <= 7) return { factor: 1.0, ageDays, status: 'FRESH' };
  if (ageDays <= 14) return { factor: 0.85, ageDays, status: 'RECENT' };
  if (ageDays <= 30) return { factor: 0.65, ageDays, status: 'AGING' };
  if (ageDays <= 90) return { factor: 0.45, ageDays, status: 'HISTORICAL' };
  return { factor: 0.20, ageDays, status: 'HISTORICAL' };
}

/**
 * Performs Signal Stacking to compute composite Account Intent and Person Intent scores
 */
function stackSignals(signals = [], referenceDate = new Date()) {
  if (!Array.isArray(signals) || signals.length === 0) {
    return {
      accountIntentScore: 15,
      personIntentScore: 10,
      buyerDemandScore: 10,
      intentScore: 15,
      stackedSignals: []
    };
  }

  let totalAccountScore = 0;
  let totalPersonScore = 0;
  let buyerDemandScore = 0;
  const processedSignals = [];

  const seenCategories = new Set();

  for (const sig of signals) {
    const decayInfo = calculateSignalDecay(sig.publishedAt, referenceDate);
    const effectiveScore = Math.round((sig.rawScore || sig.baseWeight || 10) * decayInfo.factor);

    processedSignals.push({
      ...sig,
      decayFactor: decayInfo.factor,
      ageDays: decayInfo.ageDays,
      freshnessStatus: decayInfo.status,
      effectiveScore
    });

    // Bonus for independent signal diversity across categories
    const categoryMultiplier = seenCategories.has(sig.category) ? 0.7 : 1.0;
    seenCategories.add(sig.category);

    totalAccountScore += effectiveScore * categoryMultiplier;

    if (sig.category === 'DIRECT_BUYER_DEMAND') {
      buyerDemandScore = Math.max(buyerDemandScore, Math.min(effectiveScore * 1.8, 98));
    }

    if (sig.category === 'HIRING_SIGNAL' || sig.category === 'DIRECT_BUYER_DEMAND' || sig.category === 'SOCIAL_COMMUNITY') {
      totalPersonScore += effectiveScore * 0.8;
    }
  }

  // Cross-category stacking diversity bonus (+15% if 3+ distinct signal categories exist)
  if (seenCategories.size >= 3) {
    totalAccountScore *= 1.15;
  }

  const finalAccountIntent = Math.min(Math.round(totalAccountScore), 98);
  const finalPersonIntent = Math.min(Math.round(totalPersonScore), 98);
  const finalBuyerDemand = Math.min(Math.round(buyerDemandScore), 98);
  const compositeIntentScore = Math.max(finalAccountIntent, finalBuyerDemand);

  return {
    accountIntentScore: finalAccountIntent,
    personIntentScore: finalPersonIntent,
    buyerDemandScore: finalBuyerDemand,
    intentScore: compositeIntentScore,
    stackedSignals: processedSignals
  };
}

/**
 * Three-Tier Opportunity Classification Engine:
 * - HOT: Clear current direct requirement (buyerDemandScore >= 70 OR intentScore >= 80 with direct signal)
 * - WARM: Strong combination of intent signals without direct procurement brief (intentScore >= 60)
 * - WATCHLIST: Contextual signals with moderate evidence (intentScore >= 40)
 * - REJECT: Informational / generic article / dictionary / low intent (intentScore < 40)
 */
function classifyOpportunityTier(buyerDemandScore = 0, intentScore = 0, signals = []) {
  const hasDirectDemand = signals.some(s => s.category === 'DIRECT_BUYER_DEMAND');

  if (buyerDemandScore >= 70 || (intentScore >= 75 && hasDirectDemand)) {
    return {
      tier: 'HOT',
      tierLabel: '🔥 HIGH INTENT (HOT)',
      qualificationReason: 'Direct buyer procurement requirement confirmed.'
    };
  }

  if (intentScore >= 55 || (hasDirectDemand && buyerDemandScore >= 40)) {
    return {
      tier: 'WARM',
      tierLabel: '⚡ WARM INTENT',
      qualificationReason: 'Strong stacked intent signals detected across hiring, projects, or market activity.'
    };
  }

  if (intentScore >= 35 || signals.length >= 2) {
    return {
      tier: 'WATCHLIST',
      tierLabel: '👁️ WATCHLIST',
      qualificationReason: 'Interesting company activity detected for ongoing monitoring.'
    };
  }

  return {
    tier: 'REJECT',
    tierLabel: '⛔ REJECTED',
    qualificationReason: 'Insufficient buyer demand or intent signals.'
  };
}

/**
 * Source Quality Reliability Evaluator
 */
function evaluateSourceQuality(urlStr = '', platformStr = '') {
  if (!urlStr) return { quality: 'MEDIUM', score: 50 };
  const lowerUrl = urlStr.toLowerCase();
  const lowerPlat = (platformStr || '').toLowerCase();

  if (lowerUrl.includes('rfp') || lowerUrl.includes('tender') || lowerUrl.includes('procurement')) {
    return { quality: 'HIGH', score: 95 };
  }
  if (lowerPlat.includes('linkedin') || lowerPlat.includes('upwork') || lowerPlat.includes('contra') || lowerPlat.includes('wellfound')) {
    return { quality: 'HIGH', score: 90 };
  }
  if (lowerUrl.includes('.gov') || lowerUrl.includes('.edu') || lowerUrl.includes('/careers') || lowerUrl.includes('/jobs')) {
    return { quality: 'HIGH', score: 88 };
  }
  if (lowerUrl.includes('techcrunch.com') || lowerUrl.includes('reuters.com') || lowerUrl.includes('bloomberg.com') || lowerUrl.includes('forbes.com')) {
    return { quality: 'MEDIUM', score: 70 };
  }
  if (lowerUrl.includes('dictionary.com') || lowerUrl.includes('thesaurus.com') || lowerUrl.includes('wikipedia.org')) {
    return { quality: 'ZERO', score: 0 };
  }
  if (lowerUrl.includes('productionhub.com') || lowerUrl.includes('clutch.co') || lowerUrl.includes('bark.com')) {
    return { quality: 'ZERO', score: 0 };
  }
  return { quality: 'MEDIUM', score: 60 };
}

/**
 * Freshness Status Classification
 */
function getFreshnessStatus(dateStr) {
  const { status, ageDays } = calculateSignalDecay(dateStr);
  return { status, ageDays };
}

module.exports = {
  SIGNAL_DEFINITIONS,
  extractSignals,
  calculateSignalDecay,
  stackSignals,
  classifyOpportunityTier,
  evaluateSourceQuality,
  getFreshnessStatus
};
