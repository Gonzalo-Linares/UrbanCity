import { z } from 'zod'

export const adminProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Ingresa un nombre valido.')
    .max(120, 'El nombre es demasiado largo.'),
  slug: z
    .string()
    .trim()
    .max(160, 'El slug es demasiado largo.')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .trim()
    .max(2000, 'La descripcion es demasiado larga.')
    .optional()
    .or(z.literal('')),
  price: z.number().min(0, 'El precio no puede ser negativo.'),
  availability: z.enum(['available', 'inquiry', 'out_of_stock', 'hidden']),
  categoryId: z.string().optional().or(z.literal('')),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export type AdminProductSchema = z.output<typeof adminProductSchema>
export type AdminProductSchemaInput = z.input<typeof adminProductSchema>
