import React from 'react';
import { ShieldAlert, Sparkles, ArrowRight, X, Check } from 'lucide-react';
import { UsageCheckResult } from '../types/saas';
import { SUBSCRIPTION_PLANS } from '../data/plansCatalog';

interface PlanLimitModalProps {
  checkResult: UsageCheckResult | null;
  onClose: () => void;
  onUpgradePlan: (planId?: string) => void;
}

export const PlanLimitModal: React.FC<PlanLimitModalProps> = ({
  checkResult,
  onClose,
  onUpgradePlan
}) => {
  if (!checkResult) return null;

  const plansList = Object.values(SUBSCRIPTION_PLANS);

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

        {/* 5-Tier Pricing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {plansList.map((p) => {
            const isCurrent = p.name === checkResult.planName || p.planId === checkResult.planName;
            const isPopular = p.planId === 'PRO';

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
                  <span className="text-[11px] font-bold text-white uppercase font-display block">{p.name}</span>
                  <div className="text-lg font-black text-[#f5b82e]">
                    {p.priceLabel || (p.monthlyPrice === 0 ? 'FREE' : `₹${p.monthlyPrice}`)}
                    {p.monthlyPrice > 0 && <span className="text-[10px] text-slate-400 font-normal">/mo</span>}
                  </div>

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
                  onClick={() => {
                    onClose();
                    onUpgradePlan(p.planId);
                  }}
                  className={`w-full py-2 rounded-xl text-[10px] font-bold transition-all ${
                    isCurrent
                      ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                      : isPopular
                      ? 'btn-gold shadow-md shadow-[#f5b82e]/20'
                      : 'bg-[#1e2338] text-white hover:bg-[#282e4a] border border-[#2d334d]'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : p.planId === 'ENTERPRISE' ? 'Contact Sales' : 'Upgrade'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
