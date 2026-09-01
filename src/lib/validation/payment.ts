import { z } from 'zod';
import { paymentProviderSchema } from './user';

export const createOrderSchema = z.object({
  rideId: z.string().min(1),
  provider: paymentProviderSchema,
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const verifyPaymentSchema = z.object({
  rideId: z.string().min(1),
  provider: paymentProviderSchema,
  providerOrderId: z.string().min(1),
  providerPaymentId: z.string().min(1),
  signature: z.string().optional(),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

export const refundSchema = z.object({
  rideId: z.string().min(1),
  reason: z.string().min(3).max(300),
  amount: z.number().int().positive().optional(), // full refund if undefined
});
export type RefundInput = z.infer<typeof refundSchema>;
