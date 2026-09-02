import type { PaymentMethod, PaymentProvider, PaymentStatus } from '@/types/ride';

export interface PaymentRecord {
  id: string;
  rideId: string;
  userId: string;
  provider: PaymentProvider;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  amount: number; // paise
  currency: string;
  status: PaymentStatus;
  refundId: string | null;
  refundAmount: number | null;
  refundedAt: string | null;
  createdAt: string;
}

export interface CreateOrderParams {
  rideId: string;
  amount: number; // paise
  currency: string;
  userId: string;
  /** User-facing description shown on the checkout page. */
  description: string;
  /** Where to redirect after payment completion (Stripe only). */
  successUrl?: string | undefined;
  cancelUrl?: string | undefined;
  /** Razorpay-style notes — arbitrary key/value. */
  notes?: Record<string, string> | undefined;
}

export interface CreateOrderResult {
  provider: PaymentProvider;
  providerOrderId: string;
  /** Stripe Checkout URL (for redirect-based flow). Razorpay returns null. */
  checkoutUrl: string | null;
  /** Razorpay order_id to be passed to the client SDK. */
  clientSecret: string | null;
  amount: number;
  currency: string;
}

export interface VerifyParams {
  providerOrderId: string;
  providerPaymentId: string;
  /** Razorpay signature; Stripe payment_intent id. */
  signature?: string | undefined;
}

export interface VerifyResult {
  status: PaymentStatus;
  providerPaymentId: string;
}

export interface RefundParams {
  providerPaymentId: string;
  amount: number; // paise; full refund if undefined
  reason?: string | undefined;
}

export interface RefundResult {
  refundId: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  amount: number;
}

export interface WebhookEvent {
  provider: PaymentProvider;
  eventType: string;
  paymentId?: string | undefined;
  orderId?: string | undefined;
  rawPayload: unknown;
}

/** Payment status transitions — see src/lib/payments/state-machine.ts. */
export const ALLOWED_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ['AUTHORIZED', 'CAPTURED', 'FAILED'],
  AUTHORIZED: ['CAPTURED', 'FAILED'],
  CAPTURED: ['REFUNDED'],
  FAILED: [],
  REFUNDED: [],
};

export type PaymentMethodUnion = PaymentMethod;
