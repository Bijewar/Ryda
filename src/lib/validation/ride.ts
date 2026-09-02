import { z } from 'zod';
import { paymentMethodSchema } from './user';
import { pointSchema } from './user';

export const rideCreateSchema = z.object({
  pickup: z.object({
    address: z.string().min(3).max(200),
    point: pointSchema,
  }),
  dropoff: z.object({
    address: z.string().min(3).max(200),
    point: pointSchema,
  }),
  paymentMethod: paymentMethodSchema,
  /** Optional passenger note for the driver ("call on arrival"). */
  note: z.string().max(500).optional(),
});
export type RideCreateInput = z.infer<typeof rideCreateSchema>;

export const rideCancelSchema = z.object({
  reason: z.string().min(3).max(300),
});
export type RideCancelInput = z.infer<typeof rideCancelSchema>;

export const rideRateSchema = z.object({
  /** 1-5 star rating. */
  rating: z.number().int().min(1).max(5),
  /** Optional written feedback. */
  feedback: z.string().max(1000).optional(),
});
export type RideRateInput = z.infer<typeof rideRateSchema>;

export const rideListSchema = z.object({
  status: z
    .enum([
      'REQUESTED',
      'MATCHING',
      'OFFERED',
      'ACCEPTED',
      'ARRIVED',
      'IN_PROGRESS',
      'COMPLETED',
      'PAID',
      'CANCELED',
      'NO_DRIVERS',
    ])
    .optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
