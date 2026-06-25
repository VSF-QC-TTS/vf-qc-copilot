import { z } from 'zod/v4'

// ---------------------------------------------------------------------------
// All auth form schemas in one place — Single Responsibility
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.email({ message: 'email.invalid' }),
  password: z.string().min(1, { message: 'password.required' }),
})

export const registerSchema = z
  .object({
    email: z.email({ message: 'email.invalid' }),
    password: z
      .string()
      .min(8, { message: 'password.min_8' })
      .max(128, { message: 'password.max_128' }),
    confirmPassword: z.string().min(1, { message: 'confirmPassword.required' }),
    displayName: z
      .string()
      .max(100, { message: 'displayName.max_100' })
      .optional()
      .or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'confirmPassword.mismatch',
  })

export const forgotPasswordSchema = z.object({
  email: z.email({ message: 'email.invalid' }),
})

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: 'newPassword.min_8' })
      .max(128, { message: 'newPassword.max_128' }),
    confirmPassword: z.string().min(1, { message: 'confirmPassword.required' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'confirmPassword.mismatch',
  })

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
