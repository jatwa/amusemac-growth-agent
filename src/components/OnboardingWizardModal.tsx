import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  Globe,
  Tag,
  Users,
  MapPin,
  ShieldCheck,
  Zap,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  X
} from 'lucide-react';
import { ClientProfile } from '../types/lead';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: ClientProfile) => void;
  existingProfile?: ClientProfile;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  existingProfile
}) => {
  const [step, setStep] = useState(1);

  const [companyName, setCompanyName] = useState(existingProfile?.companyName || '');
  const [tagline, setTagline] = useState(existingProfile?.tagline || '');
  const [website, setWebsite] = useState('https://');
  const [industry, setIndustry] = useState(existingProfile?.industry || 'B2B Services & Enterprise');
  const [services, setServices] = useState(existingProfile?.services.join(', ') || '');
  const [products, setProducts] = useState(existingProfile?.products.join(', ') || '');
  const [targetCategories, setTargetCategories] = useState(existingProfile?.targetCategories.join(', ') || '');
  const [targetLocations, setTargetLocations] = useState(existingProfile?.targetLocations.join(', ') || 'Mumbai, Delhi NCR, Bengaluru');
  const [companySize, setCompanySize] = useState('10-500 employees');
  const [positiveKeywords, setPositiveKeywords] = useState(existingProfile?.positiveKeywords.join(', ') || 'brand, D2C, FMCG, launch, expansion');
  const [negativeKeywords, setNegativeKeywords] = useState(existingProfile?.negativeKeywords.join(', ') || 'agency, production house');
  const [competitorExclusions, setCompetitorExclusions] = useState(existingProfile?.competitorExclusions.join(', ') || 'Production House, Advertising Agency');
  const [buyingSignals, setBuyingSignals] = useState('Product Launch, Funding, Marketing Hiring');
  const [avgDealValue, setAvgDealValue] = useState('₹15L – ₹40L');

  if (!isOpen) return null;

  const totalSteps = 14;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else handleFinish();
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = () => {
    const profile: ClientProfile = {
      clientId: companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') || `org-${Date.now()}`,
      companyName: companyName || 'My Business',
      tagline: tagline || 'B2B Sales Leader',
      industry: industry || 'B2B Services',
      services: services.split(',').map(s => s.trim()).filter(Boolean),
      products: products.split(',').map(p => p.trim()).filter(Boolean),
      targetCategories: targetCategories.split(',').map(c => c.trim()).filter(Boolean),
      targetLocations: targetLocations.split(',').map(l => l.trim()).filter(Boolean),
      positiveKeywords: positiveKeywords.split(',').map(k => k.trim()).filter(Boolean),
      negativeKeywords: negativeKeywords.split(',').map(k => k.trim()).filter(Boolean),
      competitorExclusions: competitorExclusions.split(',').map(c => c.trim()).filter(Boolean),
      minIcpScore: 60
    };

    onComplete(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121422] border border-[#272c44] rounded-3xl w-full max-w-2xl p-6 space-y-6 shadow-2xl overflow-hidden text-slate-200">
        {/* Step Header Bar */}
        <div className="flex items-center justify-between border-b border-[#23273d] pb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#f5b82e]" />
            <h3 className="text-lg font-bold text-white font-display">
              CUSTOMER ONBOARDING WIZARD (STEP {step}/{totalSteps})
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Line */}
        <div className="w-full bg-[#181a2a] h-2 rounded-full overflow-hidden border border-[#23273e]">
          <div
            className="bg-gradient-to-r from-[#f5b82e] to-amber-500 h-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Content Rendering */}
        <div className="min-h-[220px] flex flex-col justify-center text-xs space-y-4">
          {step === 1 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-white block">Step 1: What is your Business Name?</label>
              <p className="text-slate-400">This will be used to brand your workspace and outreach pitches.</p>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Plus One Design Studio"
                className="w-full bg-[#161828] border border-[#2a2f4a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#f5b82e]"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-white block">Step 2: What is your Business Website?</label>
              <p className="text-slate-400">Used for automatic AI feature extraction and verification.</p>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourcompany.com"
                className="w-full bg-[#161828] border border-[#2a2f4a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#f5b82e]"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-white block">Step 3: What do you sell? (Primary Category)</label>
              <p className="text-slate-400">Define your primary industry domain.</p>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. High-Impact Commercial Film Production & Production Design"
                className="w-full bg-[#161828] border border-[#2a2f4a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#f5b82e]"
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-white block">Step 4: List your Services & Products</label>
              <p className="text-slate-400">Comma-separated list of services or products offered.</p>
              <textarea
                rows={3}
                value={services}
                onChange={(e) => setServices(e.target.value)}
                placeholder="e.g. Film Production, Art Direction, Set Design, Commercial DVC Shoot"
                className="w-full bg-[#161828] border border-[#2a2f4a] text-white rounded-xl p-3 outline-none focus:border-[#f5b82e]"
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-white block">Step 5: Who normally buys from you?</label>
              <p className="text-slate-400">Describe your primary buyer persona titles.</p>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. CMOs, Brand Directors, Head of Marketing, Founders"
                className="w-full bg-[#161828] border border-[#2a2f4a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#f5b82e]"
              />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-white block">Step 6: Target Buyer Industries</label>
              <p className="text-slate-400">Comma-separated list of target client industries.</p>
              <input
                type="text"
                value={targetCategories}
                onChange={(e) => setTargetCategories(e.target.value)}
                placeholder="e.g. D2C, FMCG, Fashion, Jewellery, Beauty, Real Estate, Automotive"
                className="w-full bg-[#161828] border border-[#2a2f4a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#f5b82e]"
              />
            </div>
          )}

          {step === 7 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-white block">Step 7: Target Locations & Geographies</label>
              <input
                type="text"
                value={targetLocations}
                onChange={(e) => setTargetLocations(e.target.value)}
                placeholder="e.g. Mumbai, Delhi NCR, Bengaluru, National"
                className="w-full bg-[#161828] border border-[#2a2f4a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#f5b82e]"
              />
            </div>
          )}

          {step === 8 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-white block">Step 8: Target Company Size</label>
              <input
                type="text"
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                placeholder="e.g. 50-1000 employees"
                className="w-full bg-[#161828] border border-[#2a2f4a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#f5b82e]"
              />
            </div>
          )}

          {step === 9 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-white block">Step 9: Positive ICP Keywords</label>
              <input
                type="text"
                value={positiveKeywords}
                onChange={(e) => setPositiveKeywords(e.target.value)}
                placeholder="e.g. brand, D2C, FMCG, festive campaign, launch"
                className="w-full bg-[#161828] border border-[#2a2f4a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#f5b82e]"
              />
            </div>
          )}

          {step === 10 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-white block">Step 10: Negative Keywords</label>
              <input
                type="text"
                value={negativeKeywords}
                onChange={(e) => setNegativeKeywords(e.target.value)}
                placeholder="e.g. production house, ad agency, marketing agency"
                className="w-full bg-[#161828] border border-[#2a2f4a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#f5b82e]"
              />
            </div>
          )}

          {step === 11 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-white block">Step 11: Competitors to Exclude</label>
              <p className="text-slate-400">Any business containing these terms will be automatically filtered out.</p>
              <input
                type="text"
                value={competitorExclusions}
                onChange={(e) => setCompetitorExclusions(e.target.value)}
                placeholder="e.g. Production House, Film Production Company, Ad Agency"
                className="w-full bg-[#161828] border border-[#2a2f4a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#f5b82e]"
              />
            </div>
          )}

          {step === 12 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-white block">Step 12: Target Buying Signals</label>
              <input
                type="text"
                value={buyingSignals}
                onChange={(e) => setBuyingSignals(e.target.value)}
                placeholder="e.g. Product Launch, Store Opening, Festive Push"
                className="w-full bg-[#161828] border border-[#2a2f4a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#f5b82e]"
              />
            </div>
          )}

          {step === 13 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-white block">Step 13: Average Customer / Deal Value</label>
              <input
                type="text"
                value={avgDealValue}
                onChange={(e) => setAvgDealValue(e.target.value)}
                placeholder="e.g. ₹15L – ₹40L"
                className="w-full bg-[#161828] border border-[#2a2f4a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#f5b82e]"
              />
            </div>
          )}

          {step === 14 && (
            <div className="space-y-3 text-center py-2">
              <CheckCircle2 className="w-12 h-12 text-[#f5b82e] mx-auto animate-bounce" />
              <h4 className="text-base font-bold text-white">Step 14: Ready to Generate your Custom ICP!</h4>
              <p className="text-slate-400">Click Finish to lock in your custom prospecting strategy.</p>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between border-t border-[#23273d] pt-4">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1a1d30] text-slate-300 disabled:opacity-30 flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="btn-gold px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1 shadow-lg shadow-[#f5b82e]/20"
          >
            <span>{step === totalSteps ? 'CREATE ICP & FINISH' : 'Next Step'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
