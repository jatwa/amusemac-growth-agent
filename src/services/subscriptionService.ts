import { PlanId } from '../types/saas.js';
import { SUBSCRIPTION_PLANS } from '../data/plansCatalog.js';

interface PaymentUrls {
  LITE?: string;
  PRO?: string;
  MAX?: string;
  ENTERPRISE?: string;
  CHECKOUT?: string;
}

/**
 * Resolves the payment / checkout link for a given subscription plan ID.
 */
export async function getSubscriptionPaymentUrl(planId: PlanId): Promise<string> {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
  const envKey = `VITE_PAYMENT_URL_${planId}`;
  const envVal = (env as any)[envKey] || (env as any).VITE_PAYMENT_CHECKOUT_URL;

  if (envVal && typeof envVal === 'string' && envVal.trim()) {
    return envVal.trim();
  }

  if (typeof window !== 'undefined' && (window as any).__AMUSEMAC_CONFIG__) {
    const config = (window as any).__AMUSEMAC_CONFIG__;
    const winVal = config[`PAYMENT_URL_${planId}`] || config.PAYMENT_CHECKOUT_URL;
    if (winVal && typeof winVal === 'string' && winVal.trim()) {
      return winVal.trim();
    }
  }

  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data && data.paymentUrls) {
        const urls: PaymentUrls = data.paymentUrls;
        const serverVal = (urls as any)[planId] || urls.CHECKOUT;
        if (serverVal && typeof serverVal === 'string' && serverVal.trim()) {
          return serverVal.trim();
        }
      }
    }
  } catch (e) {}

  return '';
}

/**
 * Handles plan upgrade action by launching payment URL or triggering setup notice
 */
export async function initiatePlanUpgrade(planId: PlanId): Promise<{ success: boolean; redirected: boolean; url?: string; planName: string; priceLabel: string }> {
  const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.PRO;
  const paymentUrl = await getSubscriptionPaymentUrl(planId);

  if (paymentUrl) {
    if (typeof window !== 'undefined') {
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    }
    return {
      success: true,
      redirected: true,
      url: paymentUrl,
      planName: plan.name,
      priceLabel: plan.priceLabel || `₹${plan.monthlyPrice}`
    };
  }

  return {
    success: false,
    redirected: false,
    planName: plan.name,
    priceLabel: plan.priceLabel || `₹${plan.monthlyPrice}`
  };
}
