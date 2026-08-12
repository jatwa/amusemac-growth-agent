import React, { useState } from 'react';
import { ShieldAlert, Sparkles, ArrowRight, X, Check, ExternalLink, CreditCard } from 'lucide-react';
import { UsageCheckResult, PlanId } from '../types/saas';
import { SUBSCRIPTION_PLANS, PRICING_CONFIG, BillingPeriod } from '../data/plansCatalog';
import { initiatePlanUpgrade } from '../services/subscriptionService';

interface PlanLimitModalProps {
  checkResult: UsageCheckResult | null;
  onClose: () => void;
  onUpgradePlan?: (planId?: string) => void;
}

export const PlanLimitModal: React.FC<PlanLimitModalProps> = ({
  checkResult,
  onClose,
  onUpgradePlan
}) => {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('MONTHLY');
  const [selectedNoticePlan, setSelectedNoticePlan] = useState<{ planId: PlanId; planName: string; priceLabel: string } | null>(null);

  if (!checkResult) return null;

  const plansList = Object.values(SUBSCRIPTION_PLANS);

  const handlePlanClick = async (planId: PlanId) => {
    const res = await initiatePlanUpgrade(planId, billingPeriod);
    if (res.redirected) {
      onClose();
      onUpgradePlan?.(planId);
    } else {
      setSelectedNoticePlan({ planId, planName: res.planName, priceLabel: res.priceLabel });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#141624] border border-[#2c324a] rounded-3xl w-full max-w-4xl p-6 sm:p-8 space-y-6 shadow-2xl text-xs text-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#23273d] pb-4">
          <div className="flex items-center space-x-3 text-rose-400">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="text-lg font-bold font-display text-white">Upgrade Subscription Plan</h3>
              <p className="text-xs text-slate-400">
                {checkResult.message || `Monthly ${checkResult.actionType} limit reached (${checkResult.currentUsage}/${checkResult.limit}).`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Monthly / Yearly Billing Toggle */}
        <div className="flex justify-center items-center">
          <div className="bg-[#111320] p-1 rounded-2xl border border-[#23273d] flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setBillingPeriod('MONTHLY')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                billingPeriod === 'YEARLY'
                  ? 'bg-[#f5b82e] text-[#0c0d12] shadow-md shadow-[#f5b82e]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>YEARLY</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-400 text-[#0c0d12] text-[9px] font-black uppercase tracking-wider">
                Save up to 30%
              </span>
            </button>
          </div>
        </div>

        {/* Payment Setup Notice Modal State */}
        {selectedNoticePlan && (
          <div className="p-4 rounded-2xl bg-[#1a1d2e] border border-[#f5b82e]/40 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#f5b82e]">
                <CreditCard className="w-5 h-5 shrink-0" />
                <span className="font-bold text-sm">Payment Integration Ready ({selectedNoticePlan.planName} - {selectedNoticePlan.priceLabel})</span>
              </div>
              <button onClick={() => setSelectedNoticePlan(null)} className="text-slate-400 hover:text-white text-xs">
                ✕ Close Notice
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              Direct checkout integration is ready. Provide the payment URL for <strong>{selectedNoticePlan.planName}</strong> via environment variable:
            </p>
            <div className="p-3 rounded-xl bg-[#111320] border border-[#282d44] font-mono text-[11px] text-amber-300">
              VITE_PAYMENT_URL_{selectedNoticePlan.planId}{billingPeriod === 'YEARLY' ? '_YEARLY' : ''} or VITE_PAYMENT_CHECKOUT_URL
            </div>
            <div className="flex items-center space-x-3 pt-1">
              <a
                href={`mailto:hello@amusemacstudio.in?subject=Upgrade%20Plan%20Request%20(${selectedNoticePlan.planName})`}
                target="_blank"
                rel="noreferrer"
                className="btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5"
              >
                <span>Contact Amusemac Sales</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* 5-Tier Pricing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {plansList.map((p) => {
            const isCurrent = p.name === checkResult.planName || p.planId === checkResult.planName;
            const isPopular = p.planId === 'PRO';
            const isFree = p.planId === 'FREE';
            const isEnterprise = p.planId === 'ENTERPRISE';
            const cfg = PRICING_CONFIG[p.planId];

            const displayPrice = billingPeriod === 'YEARLY' && cfg?.annualPriceLabel
              ? cfg.annualPriceLabel
              : (p.priceLabel || (p.monthlyPrice === 0 ? 'FREE' : `₹${p.monthlyPrice}`));

            const billingPeriodLabel = isFree || isEnterprise
              ? ''
              : billingPeriod === 'YEARLY'
              ? '/year'
              : '/month';

            return (
              <div
                key={p.planId}
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all relative ${
                  isCurrent
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : isPopular
                    ? 'border-[#f5b82e] bg-[#1a1d2e] shadow-xl shadow-[#f5b82e]/10'
                    : 'border-[#23273d] bg-[#111320]'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-[#f5b82e] text-[#0c0d12] font-black text-[9px] uppercase">
                    Most Popular
                  </span>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white uppercase font-display block">
                      {billingPeriod === 'YEARLY' && cfg?.name ? cfg.name : p.name}
                    </span>
                  </div>

                  {billingPeriod === 'YEARLY' && cfg?.discountPercent && (
                    <div className="inline-block px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      {cfg.discountPercent}% OFF (Save {cfg.discountPercent}%)
                    </div>
                  )}

                  <div className="text-lg font-black text-[#f5b82e]">
                    {displayPrice}
                    {billingPeriodLabel && <span className="text-[10px] text-slate-400 font-normal">{billingPeriodLabel}</span>}
                  </div>

                  {billingPeriod === 'YEARLY' && cfg?.firstPaymentLabel && (
                    <p className="text-[10px] text-emerald-400 font-medium">
                      {cfg.firstPaymentLabel}
                    </p>
                  )}

                  <ul className="space-y-1.5 text-[10px] text-slate-300 pt-2 border-t border-[#23273d]">
                    <li className="flex items-center space-x-1">
                      <Check className="w-3 h-3 text-[#f5b82e] shrink-0" />
                      <span>{p.monthlySearchesLimit} searches/mo</span>
                    </li>
                    <li className="flex items-center space-x-1">
                      <Check className="w-3 h-3 text-[#f5b82e] shrink-0" />
                      <span>{p.maxLeadsPerSearch} results/search</span>
                    </li>
                    {p.enrichmentCreditsLimit > 0 && (
                      <li className="flex items-center space-x-1 text-amber-300 font-semibold">
                        <Check className="w-3 h-3 text-[#f5b82e] shrink-0" />
                        <span>{p.enrichmentCreditsLimit.toLocaleString()} credits/mo</span>
                      </li>
                    )}
                    {p.featureFlags.lockPremiumFields && (
                      <li className="text-amber-400 font-bold">🔒 Locked Intelligence</li>
                    )}
                  </ul>
                </div>

                <button
                  disabled={isCurrent}
                  onClick={() => handlePlanClick(p.planId)}
                  className={`w-full py-2 rounded-xl text-[10px] font-bold transition-all ${
                    isCurrent
                      ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                      : isPopular
                      ? 'btn-gold shadow-md shadow-[#f5b82e]/20'
                      : 'bg-[#1e2338] text-white hover:bg-[#282e4a] border border-[#2d334d]'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : p.planId === 'ENTERPRISE' ? 'Contact Sales' : 'Upgrade Plan'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
