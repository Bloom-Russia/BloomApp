import { z } from 'zod';

export const loginSchema = z.object({
  phone: z
    .string()
    .min(10, { message: 'auth.errors.invalidPhone' })
    .regex(/^[0-9+\s-]+$/, { message: 'auth.errors.invalidPhoneFormat' }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
