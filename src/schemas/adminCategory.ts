import { z } from 'zod'

export const adminCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Ingresa un nombre valido.')
    .max(80, 'El nombre es demasiado largo.'),
  slug: z
    .string()
    .trim()
    .max(120, 'El slug es demasiado largo.')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .trim()
    .max(240, 'La descripcion no puede superar los 240 caracteres.')
    .optional()
    .or(z.literal('')),
})

export type AdminCategorySchema = z.infer<typeof adminCategorySchema>
