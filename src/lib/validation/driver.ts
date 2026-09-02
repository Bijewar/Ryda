import { z } from 'zod';
import { driverApprovalSchema, vehicleTypeSchema, phoneSchema, emailSchema, passwordSchema } from './user';

export const driverRegisterSchema = z.object({
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  licenseNumber: z.string().min(3).max(30),
  licenseFrontUrl: z.string().default('https://images.unsplash.com/photo-1544717305-2782549b5136?w=600'),
  licenseBackUrl: z.string().default('https://images.unsplash.com/photo-1544717305-2782549b5136?w=600'),
  vehicle: z.object({
    make: z.string().min(1).max(40),
    model: z.string().min(1).max(40),
    year: z.number().int().min(1990).max(new Date().getFullYear() + 2).default(new Date().getFullYear()),
    color: z.string().min(1).max(30),
    licensePlate: z
      .string()
      .min(4)
      .transform((val) => val.toUpperCase().replace(/[^A-Z0-9]/g, ''))
      .refine((val) => val.length >= 6 && val.length <= 12, {
        message: 'Enter a valid vehicle license plate (e.g. MP04AB1234)',
      }),
    type: vehicleTypeSchema,
  }),
});
export type DriverRegisterInput = z.infer<typeof driverRegisterSchema>;

export const driverLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const driverLocationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
});
export type DriverLocationUpdate = z.infer<typeof driverLocationUpdateSchema>;

export const driverStatusUpdateSchema = z.object({
  isOnline: z.boolean(),
  /** Required when going online — driver must be inside Bhopal. */
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

export const driverApprovalUpdateSchema = z.object({
  approvalStatus: driverApprovalSchema,
  rejectionReason: z.string().max(500).optional(),
});
