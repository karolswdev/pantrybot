import { z } from 'zod';

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Login form schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email'),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Signup form schema
export const signupSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: passwordSchema,
  householdName: z
    .string()
    .min(1, 'Household name is required')
    .min(2, 'Household name must be at least 2 characters')
    .max(50, 'Household name must be less than 50 characters'),
  timezone: z
    .string()
    .min(1, 'Timezone is required'),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must agree to the terms and privacy policy',
    }),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;