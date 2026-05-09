import { z } from 'zod'

export const checkoutSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Ingresa un nombre valido.')
    .max(80, 'El nombre es demasiado largo.'),
  customerPhone: z
    .string()
    .trim()
    .min(8, 'Ingresa un telefono valido.')
    .max(20, 'El telefono es demasiado largo.'),
  customerMessage: z
    .string()
    .trim()
    .max(240, 'El mensaje no puede superar los 240 caracteres.')
    .optional()
    .or(z.literal('')),
})

export type CheckoutSchema = z.infer<typeof checkoutSchema>
