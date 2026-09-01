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
 * Legacy Stripe provider stub.
 * Note: Ryda v2 uses Razorpay for digital payments (zero upfront cost / free tier).
 */
export class StripeProvider implements PaymentProviderInterface {
  readonly name = 'RAZORPAY' as const;

  async createOrder(_params: CreateOrderParams): Promise<CreateOrderResult> {
    throw new Error('Stripe is not configured in Ryda v2. Please use Razorpay.');
  }

  async verifyPayment(_params: VerifyParams): Promise<VerifyResult> {
    throw new Error('Stripe is not configured in Ryda v2. Please use Razorpay.');
  }

  async refund(_params: RefundParams): Promise<RefundResult> {
    throw new Error('Stripe is not configured in Ryda v2. Please use Razorpay.');
  }

  async handleWebhook(_req: Request): Promise<WebhookEvent> {
    throw new Error('Stripe is not configured in Ryda v2. Please use Razorpay.');
  }

  async createDriverAccount(_driver: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  }): Promise<{ accountId: string; onboardingUrl: string }> {
    throw new Error('Stripe is not configured in Ryda v2. Please use Razorpay Route.');
  }
}
