import { AmusemacService, BuyingSignalType } from '../types/lead';

export const CORE_AMUSEMAC_SERVICES: AmusemacService[] = [
  'Film Production',
  'Production Design',
  'Art Direction',
  'Set Design',
  'Visual Development',
  'Creative Production',
  'Commercial/Ad Film Production',
  'Music Video Production',
  'End-to-End Creative Execution'
];

export const AMUSEMAC_SERVICES: { id: AmusemacService; label: string; category: string; description: string }[] = [
  {
    id: 'Film Production',
    label: 'Film Production',
    category: 'Core Cinema',
    description: 'Cinema-grade feature film and narrative production execution.'
  },
  {
    id: 'Production Design',
    label: 'Production Design',
    category: 'Core Art & Design',
    description: 'Complete visual direction, set architecture, and spatial world-building.'
  },
  {
    id: 'Art Direction',
    label: 'Art Direction',
    category: 'Core Art & Design',
    description: 'Styling, color palettes, visual mood boards, and aesthetic curation.'
  },
  {
    id: 'Set Design',
    label: 'Set Design',
    category: 'Core Art & Design',
    description: 'Custom set construction, studio builds, and bespoke prop engineering.'
  },
  {
    id: 'Visual Development',
    label: 'Visual Development',
    category: 'Core Pre-Production',
    description: 'Concept art, character design, lookdev, and cinematic pre-visualization.'
  },
  {
    id: 'Creative Production',
    label: 'Creative Production',
    category: 'Core Execution',
    description: 'Turnkey creative film, commercial, and visual media production.'
  },
  {
    id: 'Commercial/Ad Film Production',
    label: 'Commercial/Ad Film Production',
    category: 'Core Commercial',
    description: 'TV Commercials, DVCs, and high-impact advertising video ad shoots.'
  },
  {
    id: 'Music Video Production',
    label: 'Music Video Production',
    category: 'Core Music & Media',
    description: 'High-concept music video production, stylized direction, and lighting.'
  },
  {
    id: 'End-to-End Creative Execution',
    label: 'End-to-End Creative Execution',
    category: 'Core Full Service',
    description: 'Complete end-to-end creative solution from concept to final master delivery.'
  },
  {
    id: 'Advertising Film Production',
    label: 'Advertising Film Production',
    category: 'Commercial',
    description: 'TV Commercials and digital video advertising films.'
  },
  {
    id: 'Commercial Production',
    label: 'Commercial Production',
    category: 'Commercial',
    description: 'Production for television, digital ad campaigns, and product promos.'
  },
  {
    id: 'Branded Content',
    label: 'Branded Content',
    category: 'Creative Content',
    description: 'Story-driven brand films and docu-style content.'
  },
  {
    id: 'Corporate Films',
    label: 'Corporate Films',
    category: 'Corporate',
    description: 'Corporate brand films and executive showcases.'
  },
  {
    id: 'Video Production',
    label: 'Video Production',
    category: 'General',
    description: 'HD/4K video creation for marketing and launches.'
  },
  {
    id: 'Photography Production',
    label: 'Photography Production',
    category: 'Stills',
    description: 'Fashion, commercial product, and key visual photography.'
  },
  {
    id: 'Studio Rental',
    label: 'Studio Rental',
    category: 'Facilities',
    description: 'Soundstage and studio facility rentals.'
  },
  {
    id: 'Creative Development',
    label: 'Creative Development',
    category: 'Pre-Production',
    description: 'Scripting, storyboarding, and concept development.'
  },
  {
    id: 'AI Film Production',
    label: 'AI Film Production',
    category: 'Next-Gen AI',
    description: 'Generative AI synthetic film pipelines.'
  },
  {
    id: 'AI Video Production',
    label: 'AI Video Production',
    category: 'Next-Gen AI',
    description: 'AI-assisted video ad variation creation.'
  },
  {
    id: 'Campaign Production',
    label: 'Campaign Production',
    category: 'Full Service',
    description: 'Multi-platform integrated campaign execution.'
  }
];

export const BUYING_SIGNAL_TYPES: { id: BuyingSignalType; label: string; description: string; badgeColor: string }[] = [
  {
    id: 'RFP_VENDOR_CALL',
    label: 'RFP / Vendor Tender Call',
    description: 'Company actively issued an RFP or call for external film/production vendors.',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'CAMPAIGN_ANNOUNCEMENT',
    label: 'New Campaign Brief',
    description: 'Public announcement of an upcoming product launch or festive campaign.',
    badgeColor: 'bg-[#f5b82e]/20 text-[#f5b82e] border-[#f5b82e]/30'
  },
  {
    id: 'PRODUCTION_HIRING',
    label: 'Production / Line Hiring Signal',
    description: 'Hiring or contracting activity for specific shoot dates or art directors.',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  },
  {
    id: 'EXPANSION_SIGNAL',
    label: 'Brand Media Expansion',
    description: 'Rapid marketing expansion with multi-channel video ad requirements.',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  }
];

export const PRESET_INDUSTRIES = [
  'Advertising agencies',
  'Production houses',
  'Brands',
  'Startups',
  'FMCG companies',
  'Fashion brands',
  'D2C brands',
  'Restaurants',
  'Hotels',
  'Real estate companies',
  'Corporate companies',
  'Entertainment companies',
  'Music companies',
  'Media companies',
  'Event companies',
  'Marketing agencies'
];

export const SALES_STATUSES = [
  { id: 'NEW', label: 'New', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'RESEARCHED', label: 'Researched', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { id: 'QUALIFIED', label: 'Qualified', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { id: 'CONTACTED', label: 'Contacted', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'REPLIED', label: 'Replied', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'INTERESTED', label: 'Interested', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { id: 'MEETING', label: 'Meeting Scheduled', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'PROPOSAL', label: 'Proposal Sent', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { id: 'WON', label: 'Won Deal', color: 'bg-green-500/20 text-green-300 border-green-500/50' },
  { id: 'LOST', label: 'Lost Deal', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  { id: 'NOT A FIT', label: 'Not a Fit', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
] as const;
