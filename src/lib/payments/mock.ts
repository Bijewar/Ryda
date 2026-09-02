import { isDemoMode, shouldFailNextPayment } from '@/lib/demo-mode';
import { logger } from '@/lib/observability/logger';
import type {
  CreateOrderParams,
  CreateOrderResult,
  RefundParams,
  RefundResult,
  VerifyParams,
  VerifyResult,
  WebhookEvent,
} from '@/types/payment';
import type { PaymentProviderInterface } from './types';

/**
 * MockPaymentProvider — used when `DEMO_MODE=true`.
 *
 * Returns fake order ids, auto-verifies payments, supports a "fail next
 * payment" toggle (via `setFailNextPayment(true)` from the dev page) for
 * testing the error UI. No external API calls, no API keys required.
 */
export class MockPaymentProvider implements PaymentProviderInterface {
  readonly name = 'RAZORPAY' as const; // demo mode mimics Razorpay flow

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const orderId = `mock_order_${params.rideId}_${Date.now()}`;
    logger.info({ orderId, rideId: params.rideId, amount: params.amount }, '[DEMO] createOrder');
    return {
      provider: 'RAZORPAY',
      providerOrderId: orderId,
      checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/demo/checkout?order=${orderId}`,
      clientSecret: null,
      amount: params.amount,
      currency: params.currency,
    };
  }

  async verifyPayment(params: VerifyParams): Promise<VerifyResult> {
    if (shouldFailNextPayment()) {
      logger.info({ orderId: params.providerOrderId }, '[DEMO] verifyPayment → FAILED (toggle)');
      return { status: 'FAILED', providerPaymentId: `mock_pay_${params.providerOrderId}` };
    }
    // Simulate network + processing delay.
    await new Promise((r) => setTimeout(r, 400));
    return { status: 'CAPTURED', providerPaymentId: `mock_pay_${params.providerOrderId}` };
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    const refundId = `mock_refund_${params.providerPaymentId}_${Date.now()}`;
    logger.info({ refundId, paymentId: params.providerPaymentId }, '[DEMO] refund');
    return {
      refundId,
      status: 'SUCCEEDED',
      amount: params.amount,
    };
  }

  async handleWebhook(_req: Request): Promise<WebhookEvent> {
    return {
      provider: 'RAZORPAY',
      eventType: 'mock.payment_succeeded',
      paymentId: `mock_pay_${Date.now()}`,
      orderId: `mock_order_${Date.now()}`,
      rawPayload: { mock: true, isDemoMode },
    };
  }

  async createDriverAccount(driver: { id: string; email: string }): Promise<{
    accountId: string;
    onboardingUrl: string;
  }> {
    return {
      accountId: `mock_acct_${driver.id}`,
      onboardingUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/demo/connect?driver=${driver.id}`,
    };
  }
}
