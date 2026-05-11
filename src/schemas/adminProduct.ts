import { z } from 'zod'

const compareAtPriceSchema = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (trimmed === '') {
      return null
    }

    const parsed = Number(trimmed)
    return Number.isNaN(parsed) ? Number.NaN : parsed
  }

  return value
}, z.number().min(0, 'El precio anterior no puede ser negativo.').nullable())

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
  compareAtPrice: compareAtPriceSchema.optional(),
  availability: z.enum(['available', 'inquiry', 'out_of_stock', 'hidden']),
  categoryId: z.string().optional().or(z.literal('')),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export type AdminProductSchema = z.output<typeof adminProductSchema>
export type AdminProductSchemaInput = z.input<typeof adminProductSchema>
