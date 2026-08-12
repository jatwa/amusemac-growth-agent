import { PlanId } from '../types/saas.js';
import { SUBSCRIPTION_PLANS, PRICING_CONFIG, BillingPeriod } from '../data/plansCatalog.js';

interface PaymentUrls {
  LITE?: string;
  PRO?: string;
  MAX?: string;
  ENTERPRISE?: string;
  CHECKOUT?: string;
  LITE_YEARLY?: string;
  PRO_YEARLY?: string;
  MAX_YEARLY?: string;
}

/**
 * Resolves the payment / checkout link for a given subscription plan ID and billing period.
 */
export async function getSubscriptionPaymentUrl(planId: PlanId, billingPeriod: BillingPeriod = 'MONTHLY'): Promise<string> {
  const cfg = PRICING_CONFIG[planId];
  if (planId === 'FREE' || planId === 'ENTERPRISE') return '';

  // 1. Environment variable override check
  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
  const envKey = billingPeriod === 'YEARLY' ? `VITE_PAYMENT_URL_${planId}_YEARLY` : `VITE_PAYMENT_URL_${planId}`;
  const envVal = (env as any)[envKey] || (env as any).VITE_PAYMENT_CHECKOUT_URL;

  if (envVal && typeof envVal === 'string' && envVal.trim()) {
    return envVal.trim();
  }

  // 2. Window runtime config check
  if (typeof window !== 'undefined' && (window as any).__AMUSEMAC_CONFIG__) {
    const config = (window as any).__AMUSEMAC_CONFIG__;
    const winKey = billingPeriod === 'YEARLY' ? `PAYMENT_URL_${planId}_YEARLY` : `PAYMENT_URL_${planId}`;
    const winVal = config[winKey] || config.PAYMENT_CHECKOUT_URL;
    if (winVal && typeof winVal === 'string' && winVal.trim()) {
      return winVal.trim();
    }
  }

  // 3. Central PRICING_CONFIG default Razorpay URLs
  if (cfg) {
    if (billingPeriod === 'YEARLY' && cfg.yearlyRazorpayUrl) {
      return cfg.yearlyRazorpayUrl;
    }
    if (cfg.monthlyRazorpayUrl) {
      return cfg.monthlyRazorpayUrl;
    }
  }

  return '';
}

/**
 * Handles plan upgrade action by launching payment URL or triggering setup notice
 */
export async function initiatePlanUpgrade(
  planId: PlanId,
  billingPeriod: BillingPeriod = 'MONTHLY'
): Promise<{ success: boolean; redirected: boolean; url?: string; planName: string; priceLabel: string }> {
  const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.PRO;
  const cfg = PRICING_CONFIG[planId];

  if (planId === 'FREE' || planId === 'ENTERPRISE') {
    return {
      success: false,
      redirected: false,
      planName: plan.name,
      priceLabel: plan.priceLabel || `₹${plan.monthlyPrice}`
    };
  }

  const paymentUrl = await getSubscriptionPaymentUrl(planId, billingPeriod);

  const priceLabel = billingPeriod === 'YEARLY'
    ? (cfg?.annualPriceLabel || `₹${cfg?.annualBasePrice || (plan.monthlyPrice * 12)}`)
    : (plan.priceLabel || `₹${plan.monthlyPrice}`);

  const planName = billingPeriod === 'YEARLY' && cfg?.name
    ? `${cfg.name}${cfg.name.endsWith('Annual') ? '' : ' Annual'}`
    : plan.name;

  if (paymentUrl) {
    if (typeof window !== 'undefined') {
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    }
    return {
      success: true,
      redirected: true,
      url: paymentUrl,
      planName,
      priceLabel
    };
  }

  return {
    success: false,
    redirected: false,
    planName,
    priceLabel
  };
}
