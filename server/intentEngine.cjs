const DEMAND_HIGH_KEYWORDS = [
  'looking for', 'seeking', 'need', 'needs', 'require', 'requires', 'required',
  'hiring', 'hire', 'outsourcing', 'outsource', 'wanted', 'project requirement',
  'rfp', 'rfq', 'request for proposal', 'request for quotation', 'vendor wanted',
  'agency wanted', 'agency required', 'production partner needed', 'creative partner needed',
  'contractor needed', 'freelancer needed', 'external team needed', 'submit proposal',
  'submit bid', 'project brief', 'upcoming project', 'campaign requirement',
  'production requirement', 'remote contractor', 'remote agency', 'remote production partner',
  'looking to commission', 'commissioning', 'seeking proposals', 'vendor required',
  'looking to hire', 'freelancer required', 'budget', 'deadline', 'bidding', 'client brief',
  'rfp for', 'seeking partner', 'seeking vendor', 'requesting quotes', 'request for quotation'
];

const SUPPLY_COMPETITOR_KEYWORDS = [
  'we provide', 'our services', 'services offered', 'our portfolio', 'our work', 'our clients',
  'hire us', 'contact us for services', 'agency directory', 'vendor directory', 'marketplace listing',
  'company profile', 'we are a video production company', 'we are a premier video production company',
  'we offer video editing', 'our agency offers', 'we are a production company', 'our production company',
  'about our production company', 'leading production company', 'freelance video editor available',
  'available for freelance work', 'open for work', 'hire me', 'my portfolio', 'graphic design studio based in',
  'we provide video production', 'our studio offers', 'leading video production house', 'award winning production house',
  'we specialize in video production', 'our team of editors', 'our services include', 'we create corporate videos',
  'about our agency', 'find film and video professionals', 'find video production', 'browse video professionals'
];

const EMPLOYMENT_JOB_KEYWORDS = [
  'full time', 'full-time', 'part time', 'part-time', 'permanent',
  'salary', 'ctc', 'employee', 'employment', 'join our team',
  'job opening', 'vacancy', 'career', 'internship',
  'intern', 'employee benefits', 'on-site job', 'work from office',
  'apply for job', 'required to join our team', 'job vacancy'
];

const INFORMATIONAL_BLOG_KEYWORDS = [
  'cost in india', 'pricing guide', 'price range', 'how much does',
  'how to', 'guide to', 'what is', 'top 10', 'top 5', 'top 20', 'best 10', 'best 5',
  'top agencies', 'best companies', 'list of best', 'best video production', 'top video production',
  'viral video', 'a video of', 'news story', 'blog post', 'video production cost',
  'corporate video pricing', 'ai video tools', 'best agencies in', 'top 15', 'top 30', 'best video agencies'
];

const DICTIONARY_THESAURUS_PATTERNS = [
  /dictionary\.com/i,
  /merriam-webster\.com/i,
  /thesaurus\.com/i,
  /wikipedia\.org/i,
  /wiktionary\.org/i,
  /cambridge\.org\/dictionary/i,
  /collinsdictionary\.com/i
];

const DICTIONARY_THESAURUS_KEYWORDS = [
  'meaning of', 'definition of', 'synonyms for', 'antonyms for', 'wikipedia', 'dictionary definition', 'what does mean'
];

const GENERIC_TEMPLATE_KEYWORDS = [
  'rfp template', 'proposal template', 'contract template', 'quote template', 'agreement template', 'sample rfp format', 'free template download', 'template for video production'
];

const MARKETPLACE_CATEGORY_PATTERNS = [
  /productionhub\.com/i,
  /clutch\.co/i,
  /designrush\.com/i,
  /sortlist\.com/i,
  /goodfirms\.co/i,
  /bark\.com/i,
  /twine\.net/i,
  /justdial\.com/i,
  /indiamart\.com/i,
  /themanifest\.com/i,
  /upwork\.com\/hire\//i,
  /upwork\.com\/services\//i,
  /upwork\.com\/freelancers\//i,
  /fiverr\.com\/categories\//i,
  /freelancer\.[a-z.]+\/jobs\//i,
  /workhoppers\.com\/.*\/hirefreelancer/i,
  /in\.indeed\.com\/q-.*-jobs\.html/i,
  /internshala\.com\/jobs\/.*\/work-from-home/i,
  /glassdoor\.(com|co\.in)\/Job\//i
];

const SERVICE_TAXONOMY_MAP = [
  { service: 'AI Video Production', keywords: ['ai video', 'ai product video', 'ai product', 'ai generated video', 'generative video', 'midjourney video', 'sora', 'runway'] },
  { service: 'AI Image Generation', keywords: ['ai image', 'ai artwork', 'midjourney', 'stable diffusion', 'dall-e'] },
  { service: 'Promotional Videos', keywords: ['promotional video', 'promo video', 'product launch video', 'ad film', 'tvc', 'commercial video'] },
  { service: 'Corporate Videos', keywords: ['corporate video', 'corporate film', 'explainer video', 'company video', 'brand film', 'ceo message'] },
  { service: 'Brand Films', keywords: ['brand film', 'brand video', 'manifesto video', 'brand campaign'] },
  { service: 'Product Videos', keywords: ['product video', 'product demo', 'saas explainer', 'unboxing video', '3d product video'] },
  { service: 'Social Media Videos', keywords: ['social media video', 'social media content', 'social media', 'instagram video', 'reels', 'shorts', 'tiktok video', 'd2c video'] },
  { service: 'Reels / Shorts', keywords: ['reels', 'shorts', 'tiktok', 'vertical video', 'short form video'] },
  { service: 'Motion Graphics', keywords: ['motion graphics', 'motion design', '2d animation', 'explainer animation', 'after effects'] },
  { service: 'Music Videos', keywords: ['music video', 'lyric video', 'track video'] },
  { service: 'Trailer Editing', keywords: ['trailer editing', 'film trailer', 'teaser trailer', 'game trailer'] },
  { service: 'Film Editing', keywords: ['video editing', 'film editor', 'post production editor', 'cutter', 'davinci'] },
  { service: 'Film Production', keywords: ['film production', 'feature film', 'ott series production', 'line production', 'shoot execution'] },
  { service: 'Pre-Production', keywords: ['pre-production', 'storyboarding', 'location scouting', 'casting'] },
  { service: 'Post-Production', keywords: ['post-production', 'vfx', 'color grading', 'di', 'sound post'] },
  { service: 'Production Design', keywords: ['production design', 'production designer', 'set designer', 'art direction', 'set design'] },
  { service: 'Art Direction', keywords: ['art direction', 'art director', 'visual direction'] },
  { service: 'Graphic Design', keywords: ['graphic design', 'posters', 'key art', 'banner design', 'visual design'] },
  { service: 'Motion Design', keywords: ['motion design', 'title design', 'logo animation'] },
  { service: 'Sound Design', keywords: ['sound design', 'background score', 'audio post', 'foley', 'music composition'] },
  { service: 'Website Creation', keywords: ['website creation', 'website design', 'web development', 'landing page', 'web app'] },
  { service: 'Social Media Management', keywords: ['social media management', 'social media agency', 'content creation'] }
];

const CITIES = ['mumbai', 'bangalore', 'bengaluru', 'delhi', 'gurgaon', 'noida', 'hyderabad', 'pune', 'chennai'];

/**
 * Detailed Content-Based Intent & Quality Analysis
 * LIGHTWEIGHT PRE-DEEP-RESEARCH FILTER: Only rejects obvious non-opportunities.
 */
function analyzeOpportunityContent({ title = '', requirement = '', description = '', sourceUrl = '' }) {
  const fullText = `${title} ${requirement} ${description}`.toLowerCase();
  const normUrl = (sourceUrl || '').toLowerCase();

  let rejectionCategory = null;

  // 1. Check Dictionary & Thesaurus Rejection
  for (const pattern of DICTIONARY_THESAURUS_PATTERNS) {
    if (pattern.test(normUrl)) {
      rejectionCategory = 'DICTIONARY_THESAURUS_PAGE';
      break;
    }
  }
  if (!rejectionCategory) {
    for (const kw of DICTIONARY_THESAURUS_KEYWORDS) {
      if (fullText.includes(kw)) {
        rejectionCategory = 'DICTIONARY_THESAURUS_PAGE';
        break;
      }
    }
  }

  // 2. Check Generic RFP/Proposal Template Rejection (Distinguishes Template vs Actual RFP Request)
  if (!rejectionCategory) {
    for (const kw of GENERIC_TEMPLATE_KEYWORDS) {
      if (fullText.includes(kw)) {
        rejectionCategory = 'GENERIC_TEMPLATE_PAGE';
        break;
      }
    }
  }

  // 3. Check ProductionHUB & Marketplace Category Rejection
  if (!rejectionCategory) {
    for (const pattern of MARKETPLACE_CATEGORY_PATTERNS) {
      if (pattern.test(normUrl)) {
        rejectionCategory = 'MARKETPLACE_CATEGORY_PAGE';
        break;
      }
    }
    if (!rejectionCategory && normUrl.includes('productionhub.com')) {
      rejectionCategory = 'MARKETPLACE_CATEGORY_PAGE';
    }
  }

  // 4. Check Social Media / Generic Profile Rejection (Facebook, Instagram, LinkedIn Company Pages without post demand)
  if (!rejectionCategory) {
    if (normUrl.includes('facebook.com') || normUrl.includes('instagram.com') || normUrl.includes('linkedin.com/company')) {
      const hasExplicitPostDemand = DEMAND_HIGH_KEYWORDS.some(kw => fullText.includes(kw) && kw.length >= 4);
      const isGenericGroupTitle = title.toLowerCase().includes('group') || title.toLowerCase() === 'corporate video productions' || title.toLowerCase().includes('productions');
      if (!hasExplicitPostDemand || isGenericGroupTitle) {
        rejectionCategory = 'GENERIC_SOCIAL_PAGE';
      }
    }
  }

  // 5. Check Informational / Blog Article Rejection
  if (!rejectionCategory) {
    for (const kw of INFORMATIONAL_BLOG_KEYWORDS) {
      if (fullText.includes(kw)) {
        rejectionCategory = 'INFORMATIONAL_BLOG_ARTICLE';
        break;
      }
    }
  }

  // 6. Check Provider / Competitor Explicit Self-Promotion Rejection
  if (!rejectionCategory) {
    for (const kw of SUPPLY_COMPETITOR_KEYWORDS) {
      if (fullText.includes(kw)) {
        rejectionCategory = 'PROVIDER_SUPPLIER_PAGE';
        break;
      }
    }
  }

  // 7. Check Employment / Full-time Job Opportunity Rejection
  if (!rejectionCategory) {
    const isProjectContext = (fullText.includes('freelance') || fullText.includes('contract') || fullText.includes('rfp')) && (fullText.includes('project') || fullText.includes('campaign') || fullText.includes('launch') || fullText.includes('client'));
    if (!isProjectContext) {
      for (const kw of EMPLOYMENT_JOB_KEYWORDS) {
        if (fullText.includes(kw)) {
          rejectionCategory = 'EMPLOYMENT_JOB_PAGE';
          break;
        }
      }
    }
  }

  if (rejectionCategory) {
    return {
      intentScore: 0,
      serviceMatchScore: 0,
      leadQualityScore: 0,
      buyerDemandScore: 0,
      intentType: 'REJECT',
      buyerDemandConfirmed: false,
      rejectionCategory,
      evidence: `Rejected as ${rejectionCategory.replace(/_/g, ' ').toLowerCase()}. Non-buyer or informational page.`
    };
  }

  // Calculate Buyer Demand Signals (Broad Signal Matching)
  let buyerDemandScore = 50; // Baseline for non-garbage candidate
  let strongSignalsCount = 0;
  for (const kw of DEMAND_HIGH_KEYWORDS) {
    if (fullText.includes(kw)) {
      strongSignalsCount++;
      buyerDemandScore += 10;
    }
  }

  if (fullText.includes('budget') || fullText.includes('₹') || fullText.includes('$')) {
    buyerDemandScore += 10;
  }
  if (fullText.includes('deadline') || fullText.includes('urgent') || fullText.includes('immediate')) {
    buyerDemandScore += 10;
  }

  buyerDemandScore = Math.min(Math.max(buyerDemandScore, 40), 99);

  // Service Match Evaluation
  const serviceEval = matchAmusemacServices(fullText);
  const serviceMatchScore = serviceEval.serviceMatchScore;
  const primaryService = serviceEval.matchedServices[0] || 'Creative Production';

  // Lead Quality Score (combines demand strength and service match)
  const leadQualityScore = Math.round(buyerDemandScore * 0.6 + serviceMatchScore * 0.4);

  let intentType = 'LOW';
  if (leadQualityScore >= 80) intentType = 'HOT';
  else if (leadQualityScore >= 60) intentType = 'WARM';

  // Generate Evidence String
  let companyName = title.split(/[-|:|—]/)[0].trim() || 'Client Requester';
  let evidence = `Demand Evidence: ${companyName} shows active buyer interest for ${primaryService} services.`;
  if (fullText.includes('budget')) evidence += ` Budget signals present.`;
  if (fullText.includes('deadline') || fullText.includes('urgent')) evidence += ` Timeline signals present.`;

  return {
    intentScore: buyerDemandScore,
    buyerDemandScore,
    serviceMatchScore,
    leadQualityScore,
    intentType,
    buyerDemandConfirmed: true,
    buyerDemandEvidenceType: 'EXPLICIT_REQUIREMENT',
    evidence,
    matchedServices: serviceEval.matchedServices
  };
}

function calculateBuyerIntentScore(text = '', isSupplyExplicit = false) {
  const res = analyzeOpportunityContent({ title: text, requirement: text, description: '' });
  return { intentScore: res.intentScore, intentType: res.intentType };
}

function matchAmusemacServices(requirementText = '', keywords = []) {
  const fullText = (requirementText + ' ' + keywords.join(' ')).toLowerCase();
  const matched = new Set();

  for (const item of SERVICE_TAXONOMY_MAP) {
    const hasMatch = item.keywords.some(kw => fullText.includes(kw));
    if (hasMatch) {
      matched.add(item.service);
    }
  }

  const matchedServices = Array.from(matched);
  const serviceMatchScore = Math.min(matchedServices.length * 30 + 30, 95);

  return {
    matchedServices: matchedServices.length > 0 ? matchedServices : ['Creative Production'],
    serviceMatchScore
  };
}

function parseNaturalLanguageQuery(query = '') {
  const clean = (query || '').toLowerCase().trim();
  let detectedCity = '';
  let detectedServices = [];
  let detectedIndustry = '';

  for (const city of CITIES) {
    if (clean.includes(city)) {
      detectedCity = city === 'bengaluru' ? 'Bangalore' : city.charAt(0).toUpperCase() + city.slice(1);
      break;
    }
  }

  for (const item of SERVICE_TAXONOMY_MAP) {
    if (item.keywords.some(kw => clean.includes(kw))) {
      detectedServices.push(item.service);
    }
  }

  if (clean.includes('startup')) detectedIndustry = 'Software & AI';
  if (clean.includes('d2c') || clean.includes('brand')) detectedIndustry = 'E-Commerce & Retail';
  if (clean.includes('film') || clean.includes('producer')) detectedIndustry = 'Film & Media Production';
  if (clean.includes('fintech')) detectedIndustry = 'Fintech';

  return {
    cleanQuery: clean,
    detectedCity,
    detectedServices,
    detectedIndustry
  };
}

/**
 * AI Search Intent Extractor
 */
function extractSearchIntent(query = '', locationInput = '') {
  const clean = (query || '').trim();
  const lower = clean.toLowerCase();

  // Extract location
  let location = (locationInput || '').trim();
  if (!location) {
    const locMatch = clean.match(/\b(?:in|at|for|around)\s+([A-Z][a-zA-Z\s]{2,15})$/);
    if (locMatch && locMatch[1]) {
      const candidateLoc = locMatch[1].trim();
      if (!/production|editing|video|agency|team|studio|company|partner/i.test(candidateLoc)) {
        location = candidateLoc;
      }
    }
  }

  // Extract service
  let service = clean
    .replace(/looking for|seeking|need|needing|hiring|require|requires|rfp|rfq|tender|vendor|in\s+[A-Za-z\s]+$/gi, '')
    .replace(/companies|brands|restaurants|businesses|startups/gi, '')
    .trim();

  if (!service || service.length < 3) {
    for (const item of SERVICE_TAXONOMY_MAP) {
      if (item.keywords.some(kw => lower.includes(kw))) {
        service = item.service;
        break;
      }
    }
  }

  if (!service) service = clean;

  // Extract buyer intent
  let buyerIntent = 'Direct Requirement';
  if (/rfp|rfq|proposal request/i.test(lower)) buyerIntent = 'Procurement / RFP';
  else if (/hiring|hire|wanted|team needed/i.test(lower)) buyerIntent = 'Hiring';
  else if (/partner|collaboration|outsourcing/i.test(lower)) buyerIntent = 'Partnership';
  else if (/tender|government|bid/i.test(lower)) buyerIntent = 'Tender / Institutional';

  return {
    originalQuery: clean,
    service: service.charAt(0).toUpperCase() + service.slice(1),
    location,
    buyerIntent,
    cleanService: service.toLowerCase()
  };
}

/**
 * Automatic Discovery Query Generator Across 7 Angles
 */
function generateDiscoveryQueries(intent = {}) {
  const service = (intent.service || 'creative production').trim();
  const locSuffix = intent.location ? ` in ${intent.location}` : '';

  const candidates = [
    // Angle 1: Direct Buyer Requirement
    { query: `looking for ${service}${locSuffix}`, angle: 'Buyer Requirement' },
    { query: `seeking ${service} partner${locSuffix}`, angle: 'Buyer Requirement' },
    { query: `need ${service}${locSuffix}`, angle: 'Buyer Requirement' },
    { query: `require ${service}${locSuffix}`, angle: 'Buyer Requirement' },

    // Angle 2: Procurement / RFP
    { query: `${service} RFP${locSuffix}`, angle: 'Procurement / RFP' },
    { query: `${service} proposal request${locSuffix}`, angle: 'Procurement / RFP' },
    { query: `${service} vendor required${locSuffix}`, angle: 'Procurement / RFP' },

    // Angle 3: Hiring / External Team
    { query: `${service} team wanted${locSuffix}`, angle: 'Hiring' },
    { query: `hiring ${service} team${locSuffix}`, angle: 'Hiring' },
    { query: `${service} agency needed${locSuffix}`, angle: 'Hiring' },

    // Angle 4: Partnership
    { query: `${service} partner needed${locSuffix}`, angle: 'Partnership' },
    { query: `external ${service} partner${locSuffix}`, angle: 'Partnership' },

    // Angle 5: Project Announcement
    { query: `new ${service} project${locSuffix}`, angle: 'Project Announcement' },
    { query: `upcoming campaign requiring ${service}${locSuffix}`, angle: 'Project Announcement' },

    // Angle 6: Tender / Institutional
    { query: `${service} tender${locSuffix}`, angle: 'Tender / Institutional' },
    { query: `media ${service} RFP${locSuffix}`, angle: 'Tender / Institutional' }
  ];

  return candidates;
}

/**
 * Score Query Quality (0–100) and Penalize Overlapping Search Memory
 */
function scoreQueryQuality(candidate = {}, intent = {}, searchMemoryHistory = []) {
  const query = (candidate.query || '').toLowerCase();
  let score = 75;

  if (query.includes('rfp') || query.includes('vendor required') || query.includes('proposal request')) score += 18;
  else if (query.includes('partner needed') || query.includes('seeking') || query.includes('looking for')) score += 12;
  else if (query.includes('tender')) score += 10;

  if (intent.location && query.includes(intent.location.toLowerCase())) score += 8;

  // Search Memory Overlap Check
  const normQuery = query.replace(/\s+/g, ' ').trim();
  const existsInMem = searchMemoryHistory.some(mem => {
    const memNorm = (mem.normalizedQuery || mem.query || '').toLowerCase().replace(/\s+/g, ' ').trim();
    return memNorm === normQuery || (memNorm.length > 10 && normQuery.includes(memNorm));
  });

  if (existsInMem) {
    score -= 35; // Penalize recent memory overlaps to force alternative angles
  }

  score = Math.min(Math.max(score, 15), 98);
  return {
    ...candidate,
    score,
    scoreTier: score >= 85 ? 'HIGH' : score >= 65 ? 'MEDIUM' : 'LOW'
  };
}

/**
 * Select Queries Allowed by User Plan Limits
 */
function selectQueriesForPlan(scoredQueries = [], userPlan = 'PRO') {
  const planLimits = {
    FREE: 1,
    LITE: 1,
    PRO: 3,
    MAX: 5,
    ENTERPRISE: 8
  };

  const maxAllowed = planLimits[userPlan.toUpperCase()] || 3;
  const sorted = [...scoredQueries].sort((a, b) => b.score - a.score);

  return sorted.slice(0, maxAllowed);
}

function generatePitchDraft(opportunity) {
  const company = opportunity.companyName || opportunity.requester || 'the client team';
  const requirement = opportunity.requirement || opportunity.title || 'your video and creative production requirement';
  const primaryService = opportunity.matchedServices[0] || 'Creative Production';

  const emailSubject = `Pitch: Turnkey ${primaryService} for ${company}`;
  const emailBody = `Hi ${opportunity.contactInfo?.name || company + ' Team'},

I saw your requirement regarding "${requirement}" on ${opportunity.source || 'public listings'}.

At Amusemac Studio, we specialize in high-end ${primaryService}, Motion Graphics, and AI Content Creation. We have delivered ad films, product launch videos, and production services for top Indian brands and film studios.

Key Capabilities for your project:
- Fast turnaround turnkey production & post-production
- Cutting-edge AI video & motion design capabilities
- Dedicated production design, editing, and sound post teams

Would you be open to a 10-minute call or quick portfolio review to see how we can partner on this?

Best regards,
Amusemac Growth & Production Team
hello@amusemacstudio.in | +91 98765 43210`;

  return {
    emailSubject,
    emailBody,
    pitchSummary: `Turnkey ${primaryService} proposal tailored for ${company}`,
    recommendedAngle: `Emphasize fast turnaround, AI video integration, and proven track record in ${primaryService}.`
  };
}

module.exports = {
  analyzeOpportunityContent,
  calculateBuyerIntentScore,
  matchAmusemacServices,
  parseNaturalLanguageQuery,
  generatePitchDraft,
  SERVICE_TAXONOMY_MAP,
  extractSearchIntent,
  generateDiscoveryQueries,
  scoreQueryQuality,
  selectQueriesForPlan
};
