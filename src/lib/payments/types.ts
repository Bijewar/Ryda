import type {
  CreateOrderParams,
  CreateOrderResult,
  RefundParams,
  RefundResult,
  VerifyParams,
  VerifyResult,
  WebhookEvent,
} from '@/types/payment';
import type { PaymentProvider } from '@/types/ride';

/**
 * Payment provider abstraction — Razorpay implements this interface,
 * plus a MockPaymentProvider for demo mode.
 *
 * The factory `getPaymentProvider()` picks the right one based on the
 * `DEMO_MODE` flag. Razorpay is the only real provider — Stripe was
 * removed to keep the stack 100% free (no API-key signup required for
 * the demo, no monthly fees for production).
 *
 * All methods are async and throw on failure — the caller (payment-service.ts)
 * catches and converts to a typed `ApiResponse`.
 */

export interface PaymentProviderInterface {
  readonly name: PaymentProvider;
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  verifyPayment(params: VerifyParams): Promise<VerifyResult>;
  refund(params: RefundParams): Promise<RefundResult>;
  handleWebhook(req: Request): Promise<WebhookEvent>;
  /**
   * Create a Razorpay Route account for a driver (or a mock id in demo mode).
   * Razorpay Route is the free driver-payout system — no Stripe Connect needed.
   * Returns the account id + an onboarding URL the driver must visit.
   */
  createDriverAccount(driver: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  }): Promise<{ accountId: string; onboardingUrl: string }>;
}
