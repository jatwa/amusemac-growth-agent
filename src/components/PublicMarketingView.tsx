import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Zap,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ArrowRight,
  Globe,
  Database,
  Mail,
  Sliders,
  Layers,
  Lock,
  ExternalLink
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, PRICING_CONFIG, BillingPeriod } from '../data/plansCatalog';
import { initiatePlanUpgrade } from '../services/subscriptionService';
import { AmusemacLogo } from './ProviderLogos';

interface PublicMarketingViewProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
  onStartFreeSearch: () => void;
}

export const PublicMarketingView: React.FC<PublicMarketingViewProps> = ({
  onLoginClick,
  onSignUpClick,
  onStartFreeSearch
}) => {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('MONTHLY');
  const plansList = Object.values(SUBSCRIPTION_PLANS);

  const handlePaidPlanClick = async (planId: string) => {
    if (planId === 'FREE') {
      onSignUpClick();
      return;
    }
    if (planId === 'ENTERPRISE') {
      window.open('mailto:hello@amusemacstudio.in?subject=Enterprise%20Growth%20Plan%20Inquiry', '_blank');
      return;
    }
    await initiatePlanUpgrade(planId as any, billingPeriod);
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#f1f5f9] font-sans selection:bg-[#f5b82e] selection:text-black">
      {/* Top Marketing Header */}
      <header className="border-b border-[#1c2033] bg-[#0b0c10]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <AmusemacLogo className="w-9 h-9" iconSize="w-5 h-5" />
            <div>
              <span className="text-lg font-black font-display text-white tracking-tight">AMUSEMAC</span>
              <span className="text-xs text-[#f5b82e] font-bold block -mt-1 tracking-wider uppercase">GROWTH AGENT</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-[#f5b82e] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#f5b82e] transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-[#f5b82e] transition-colors">Pricing</a>
            <a href="#integrations" className="hover:text-[#f5b82e] transition-colors">Integrations</a>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={onLoginClick}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white border border-[#262b42] hover:border-[#f5b82e]/50 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={onSignUpClick}
              className="btn-gold px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-[#f5b82e]/20"
            >
              Start Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 max-w-6xl mx-auto text-center space-y-8 overflow-hidden">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#f5b82e]/10 text-[#f5b82e] text-xs font-bold border border-[#f5b82e]/30">
          <Sparkles className="w-4 h-4" />
          <span>AI-POWERED B2B PROSPECTING & SALES INTELLIGENCE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black font-display text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Find Your Next <span className="text-gold-gradient">Customer</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          AI-powered B2B prospecting, buyer intelligence and outreach — built to discover companies that actually have a verifiable reason to buy.
        </p>

        <div className="flex items-center justify-center pt-4">
          <button
            onClick={onSignUpClick}
            className="btn-gold px-8 py-3.5 rounded-2xl text-sm font-bold flex items-center space-x-2 shadow-2xl shadow-[#f5b82e]/30"
          >
            <span>Start Free</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* 5-Tier Interactive Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#f5b82e] tracking-widest uppercase">TRANSPARENT PRICING</span>
          <h2 className="text-3xl sm:text-4xl font-black font-display text-white">
            Choose the Right Plan for Your <span className="text-gold-gradient">Growth</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Scale from basic prospecting to high-volume enterprise outreach. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Monthly / Yearly Billing Toggle */}
        <div className="flex justify-center items-center">
          <div className="bg-[#121422] p-1.5 rounded-2xl border border-[#272b42] flex items-center space-x-1 shadow-inner">
            <button
              type="button"
              onClick={() => setBillingPeriod('MONTHLY')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                billingPeriod === 'MONTHLY'
                  ? 'bg-[#f5b82e] text-[#0c0d12] shadow-md shadow-[#f5b82e]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              MONTHLY
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('YEARLY')}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                billingPeriod === 'YEARLY'
                  ? 'bg-[#f5b82e] text-[#0c0d12] shadow-md shadow-[#f5b82e]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>YEARLY</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-[#0c0d12] text-[9px] font-black uppercase tracking-wider">
                Save up to 30%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {plansList.map((plan) => {
            const isPopular = plan.planId === 'PRO';
            const isFree = plan.planId === 'FREE';
            const isEnterprise = plan.planId === 'ENTERPRISE';
            const cfg = PRICING_CONFIG[plan.planId];

            const displayPrice = billingPeriod === 'YEARLY' && cfg?.annualPriceLabel
              ? cfg.annualPriceLabel
              : (plan.priceLabel || (plan.monthlyPrice === 0 ? 'FREE' : `₹${plan.monthlyPrice}`));

            const billingPeriodLabel = isFree || isEnterprise
              ? ''
              : billingPeriod === 'YEARLY'
              ? '/year'
              : '/month';

            return (
              <div
                key={plan.planId}
                className={`p-6 rounded-3xl border flex flex-col justify-between space-y-6 transition-all relative ${
                  isPopular
                    ? 'border-[#f5b82e] bg-[#161828] shadow-2xl shadow-[#f5b82e]/10 scale-105 z-10'
                    : 'border-[#22273d] bg-[#121420] hover:border-[#2d3452]'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-[#f5b82e] text-[#0c0d12] font-black text-[10px] uppercase tracking-wider">
                    MOST POPULAR
                  </span>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold font-display text-white">
                      {billingPeriod === 'YEARLY' && cfg?.name ? cfg.name : plan.name}
                    </h3>

                    {billingPeriod === 'YEARLY' && cfg?.discountPercent && (
                      <div className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        {cfg.discountPercent}% OFF (Save {cfg.discountPercent}%)
                      </div>
                    )}

                    <div className="text-3xl font-black text-[#f5b82e] font-display">
                      {displayPrice}
                      {billingPeriodLabel && <span className="text-xs text-slate-400 font-normal">{billingPeriodLabel}</span>}
                    </div>

                    {billingPeriod === 'YEARLY' && cfg?.firstPaymentLabel && (
                      <p className="text-xs text-emerald-400 font-medium pt-0.5">
                        {cfg.firstPaymentLabel}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-[#23273d]">
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-[#f5b82e] shrink-0" />
                      <span><strong>{plan.monthlySearchesLimit}</strong> searches/mo</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-[#f5b82e] shrink-0" />
                      <span>Up to <strong>{plan.maxLeadsPerSearch}</strong> results/search</span>
                    </li>
                    {plan.enrichmentCreditsLimit > 0 && (
                      <li className="flex items-center space-x-2 text-amber-300 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-[#f5b82e] shrink-0" />
                        <span><strong>{plan.enrichmentCreditsLimit.toLocaleString()}</strong> enrichment credits/mo</span>
                      </li>
                    )}
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-[#f5b82e] shrink-0" />
                      <span>Google Sheets Sync</span>
                    </li>
                    {plan.featureFlags.lockPremiumFields ? (
                      <li className="text-amber-400 font-bold flex items-center space-x-1.5 pt-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked Premium Contact Data</span>
                      </li>
                    ) : (
                      <li className="flex items-center space-x-2 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Full Lead Intelligence</span>
                      </li>
                    )}
                  </ul>
                </div>

                <button
                  onClick={() => handlePaidPlanClick(plan.planId)}
                  className={`w-full py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 ${
                    isPopular
                      ? 'btn-gold shadow-lg shadow-[#f5b82e]/20'
                      : isFree
                      ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                      : 'bg-[#1a1d2e] text-white hover:bg-[#252a42] border border-[#2d334d]'
                  }`}
                >
                  <span>{isFree ? 'Start Free' : isEnterprise ? 'Contact Sales' : 'Upgrade Plan'}</span>
                  {!isFree && !isEnterprise && <ExternalLink className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1c2033] py-12 px-4 text-center text-xs text-slate-500 space-y-2">
        <p>© 2026 Amusemac Studio. All rights reserved. Amusemac Growth Agent Platform.</p>
        <p className="font-mono text-[10px] text-slate-600">app.amusemacgrowth.com · amusemacgrowth.com</p>
      </footer>
    </div>
  );
};
