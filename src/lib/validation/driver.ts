import { z } from 'zod';
import { driverApprovalSchema, vehicleTypeSchema, phoneSchema, emailSchema, passwordSchema } from './user';

export const driverRegisterSchema = z.object({
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  licenseNumber: z.string().min(5).max(30),
  licenseFrontUrl: z.string().url(),
  licenseBackUrl: z.string().url(),
  vehicle: z.object({
    make: z.string().min(2).max(40),
    model: z.string().min(1).max(40),
    year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
    color: z.string().min(2).max(30),
    licensePlate: z.string().regex(/^[A-Z]{2}\d{1,2}\s?[A-Z]{1,3}\s?\d{4}$/i, 'Invalid Indian license plate'),
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
