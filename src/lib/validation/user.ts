import { z } from 'zod';

export const accountTypeSchema = z.enum(['PASSENGER', 'ADMIN']);
export const driverApprovalSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export const vehicleTypeSchema = z.enum(['SEDAN', 'SUV', 'HATCHBACK', 'BIKE', 'AUTO']);
export const paymentMethodSchema = z.enum(['CARD', 'UPI', 'WALLET', 'CASH']);
export const paymentProviderSchema = z.enum(['RAZORPAY']);

/** Indian phone — handles raw 10 digits or `+91` prefix cleanly. */
export const phoneSchema = z
  .string()
  .transform((val) => {
    const cleaned = val.trim().replace(/[\s-]/g, '');
    if (cleaned.startsWith('+91')) return cleaned;
    if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
    return `+91${cleaned.replace(/\D/g, '')}`;
  })
  .refine((val) => /^\+91\d{10}$/.test(val), {
    message: 'Please enter a valid 10-digit mobile number',
  });

/** Strong password — 8+ chars, at least 1 letter + 1 number. */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

export const emailSchema = z.string().email('Invalid email address').max(254);

export const pointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const userRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  accountType: accountTypeSchema.default('PASSENGER'),
});
export type UserRegisterInput = z.infer<typeof userRegisterSchema>;

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  /** OTP code, if the user just received one. */
  otp: z.string().regex(/^\d{6}$/).optional(),
  /** 2FA TOTP code, if 2FA is enabled. */
  totp: z.string().regex(/^\d{6}$/).optional(),
});
export type UserLoginInput = z.infer<typeof userLoginSchema>;

export const userUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: phoneSchema.optional(),
  twoFactorEnabled: z.boolean().optional(),
});
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(16),
  password: passwordSchema,
});
