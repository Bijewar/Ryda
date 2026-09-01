import crypto from 'node:crypto';
import { env } from '@/lib/env';
import { logger } from '@/lib/observability/logger';
import type { PaymentProviderInterface } from './types';
import type {
  CreateOrderParams,
  CreateOrderResult,
  RefundParams,
  RefundResult,
  VerifyParams,
  VerifyResult,
  WebhookEvent,
} from '@/types/payment';

/**
 * Razorpay (India) payment provider.
 *
 * Razorpay's flow:
 *   1. Backend creates an `order` via REST → returns `order_id`.
 *   2. Frontend loads the Razorpay checkout modal with the `order_id`.
 *   3. After payment, frontend gets `razorpay_payment_id` + `razorpay_signature`.
 *   4. Backend verifies the signature with `HMAC-SHA256(order_id|payment_id, secret)`.
 *
 * Refunds use the Payments API. There's no native "Connect" equivalent —
 * driver payouts would go through Razorpay Route (not implemented here, but
 * the abstraction supports it via `createDriverAccount` returning a virtual
 * account id).
 */
export class RazorpayProvider implements PaymentProviderInterface {
  readonly name = 'RAZORPAY' as const;
  private keyId: string;
  private keySecret: string;

  constructor() {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required when not in demo mode');
    }
    this.keyId = env.RAZORPAY_KEY_ID;
    this.keySecret = env.RAZORPAY_KEY_SECRET;
  }

  private authHeader(): string {
    return `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`;
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        receipt: params.rideId,
        notes: { rideId: params.rideId, userId: params.userId, ...(params.notes ?? {}) },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Razorpay create-order failed: ${res.status} ${err}`);
    }
    const json = (await res.json()) as { id: string; amount: number; currency: string };
    return {
      provider: 'RAZORPAY',
      providerOrderId: json.id,
      checkoutUrl: null, // Razorpay opens a modal, not a redirect
      clientSecret: json.id, // passed to the client SDK as `order_id`
      amount: json.amount,
      currency: json.currency,
    };
  }

  async verifyPayment(params: VerifyParams): Promise<VerifyResult> {
    if (!params.signature) {
      throw new Error('Razorpay verify requires a signature');
    }
    const expected = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${params.providerOrderId}|${params.providerPaymentId}`)
      .digest('hex');
    if (expected !== params.signature) {
      throw new Error('Razorpay signature mismatch');
    }
    // Fetch the payment to confirm its status.
    const res = await fetch(`https://api.razorpay.com/v1/payments/${params.providerPaymentId}`, {
      headers: { Authorization: this.authHeader() },
    });
    if (!res.ok) {
      throw new Error(`Razorpay fetch payment failed: ${res.status}`);
    }
    const json = (await res.json()) as { status: string; id: string };
    const status =
      json.status === 'captured' ? 'CAPTURED' : json.status === 'authorized' ? 'AUTHORIZED' : 'FAILED';
    return { status: status as VerifyResult['status'], providerPaymentId: json.id };
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${params.providerPaymentId}/refund`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amount,
        notes: { reason: params.reason ?? 'Customer requested refund' },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Razorpay refund failed: ${res.status} ${err}`);
    }
    const json = (await res.json()) as { id: string; status: string; amount: number };
    return {
      refundId: json.id,
      status: json.status === 'processed' || json.status === 'created' ? 'SUCCEEDED' : 'PENDING',
      amount: json.amount,
    };
  }

  async handleWebhook(req: Request): Promise<WebhookEvent> {
    const sig = req.headers.get('x-razorpay-signature');
    if (!sig || !env.RAZORPAY_WEBHOOK_SECRET) {
      throw new Error('Missing razorpay signature or webhook secret');
    }
    const body = await req.text();
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');
    if (expected !== sig) {
      throw new Error('Razorpay webhook signature mismatch');
    }
    const json = JSON.parse(body) as {
      event: string;
      payload?: {
        payment?: { entity?: { id?: string; order_id?: string } };
      };
    };
    return {
      provider: 'RAZORPAY',
      eventType: json.event,
      paymentId: json.payload?.payment?.entity?.id,
      orderId: json.payload?.payment?.entity?.order_id,
      rawPayload: json,
    };
  }

  async createDriverAccount(driver: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  }): Promise<{ accountId: string; onboardingUrl: string }> {
    // Razorpay Route — create a virtual account for payouts.
    const res = await fetch('https://api.razorpay.com/v1/contacts', {
      method: 'POST',
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${driver.firstName} ${driver.lastName}`,
        email: driver.email,
        contact: driver.phone,
        type: 'employee',
        reference_id: driver.id,
      }),
    });
    if (!res.ok) {
      throw new Error(`Razorpay contact create failed: ${res.status}`);
    }
    const json = (await res.json()) as { id: string };
    logger.info({ contactId: json.id, driverId: driver.id }, 'Razorpay contact created');
    // Onboarding URL — drivers visit the Razorpay dashboard to add bank details.
    return {
      accountId: json.id,
      onboardingUrl: 'https://dashboard.razorpay.com/app/payouts/bank_accounts',
    };
  }
}
