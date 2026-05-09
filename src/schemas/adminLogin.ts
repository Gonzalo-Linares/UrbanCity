import { z } from 'zod'

export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresa tu email.')
    .email('Ingresa un email valido.'),
  password: z.string().min(1, 'Ingresa tu password.'),
})

export type AdminLoginSchema = z.infer<typeof adminLoginSchema>
