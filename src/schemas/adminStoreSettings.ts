import { z } from 'zod'
import { normalizeWhatsAppPhone } from '@/lib/whatsapp'

export const adminStoreSettingsSchema = z.object({
  storeName: z
    .string()
    .trim()
    .min(2, 'Ingresa un nombre valido para el comercio.')
    .max(120, 'El nombre del comercio es demasiado largo.'),
  whatsappPhone: z
    .string()
    .trim()
    .refine(
      (value) => normalizeWhatsAppPhone(value).length >= 8,
      'Ingresa un WhatsApp valido.',
    )
    .refine(
      (value) => normalizeWhatsAppPhone(value).length <= 20,
      'El WhatsApp es demasiado largo.',
    ),
  instagramUrl: z
    .string()
    .trim()
    .url('Ingresa una URL valida para Instagram.')
    .max(240, 'La URL de Instagram es demasiado larga.')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .trim()
    .max(240, 'La direccion es demasiado larga.')
    .optional()
    .or(z.literal('')),
  openingHours: z
    .string()
    .trim()
    .max(240, 'Los horarios son demasiado largos.')
    .optional()
    .or(z.literal('')),
  checkoutMessage: z
    .string()
    .trim()
    .max(300, 'El mensaje de checkout no puede superar los 300 caracteres.')
    .optional()
    .or(z.literal('')),
})

export type AdminStoreSettingsSchema = z.output<typeof adminStoreSettingsSchema>
