import { isDemoMode } from '@/lib/demo-mode';
import { env } from '@/lib/env';
import type { PaymentProvider } from '@/types/ride';
import { MockPaymentProvider } from './mock';
import { RazorpayProvider } from './razorpay';
import type { PaymentProviderInterface } from './types';

/**
 * Provider factory. In demo mode, always returns the mock. In prod, returns
 * the Razorpay provider (the only supported real provider).
 *
 * Lazily instantiated — the first call constructs the client; subsequent
 * calls reuse it.
 *
 * Stripe was removed in favor of a 100% free stack. Razorpay has zero
 * upfront cost (no monthly fee, no setup fee) and is the de-facto standard
 * for Indian digital payments — perfect for a Bhopal-focused app.
 */
const instances = new Map<PaymentProvider, PaymentProviderInterface>();

export function getPaymentProvider(name?: PaymentProvider): PaymentProviderInterface {
  if (isDemoMode) {
    if (!instances.has('RAZORPAY')) instances.set('RAZORPAY', new MockPaymentProvider());
    return instances.get('RAZORPAY')!;
  }
  // Only Razorpay is supported in production
  const key: PaymentProvider = 'RAZORPAY';
  const existing = instances.get(key);
  if (existing) return existing;
  const instance = new RazorpayProvider();
  instances.set(key, instance);
  return instance;
}

/** True if real (non-mock) Razorpay is configured. */
export function isRazorpayConfigured(): boolean {
  return !isDemoMode && !!env.RAZORPAY_KEY_ID && !!env.RAZORPAY_KEY_SECRET;
}
