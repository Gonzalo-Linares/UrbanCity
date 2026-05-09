import { slugify } from '@/lib/slugs'
import type { Availability, ProductRow } from '@/types/database'

export const productImagesBucket = 'product-images'
export const productImageMaxSizeBytes = 5 * 1024 * 1024
export const productImageAllowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]

export function toNullableText(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export function resolveSlug(name: string, slug?: string) {
  const candidate = slug?.trim().length ? slug : name
  return slugify(candidate)
}

export function formatCrudError(message: string, code?: string) {
  if (code === '23505') {
    return 'Ya existe un registro con ese slug. Usa otro identificador.'
  }

  if (message.toLowerCase().includes('violates foreign key constraint')) {
    return 'No se puede eliminar el producto porque tiene pedidos asociados.'
  }

  if (message.toLowerCase().includes('duplicate key')) {
    return 'Ya existe un registro con ese slug. Usa otro identificador.'
  }

  return message
}

export function adminAvailabilityTone(availability: Availability) {
  switch (availability) {
    case 'available':
      return 'success'
    case 'inquiry':
      return 'warning'
    case 'out_of_stock':
      return 'danger'
    default:
      return 'muted'
  }
}

export function isProductVisible(
  product: Pick<ProductRow, 'availability' | 'is_active'>,
) {
  return product.is_active && product.availability !== 'hidden'
}

export function formatBytesAsMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
}

export function validateProductImageFile(file: File) {
  if (!productImageAllowedMimeTypes.includes(file.type)) {
    return `Tipo de archivo no permitido. Usa ${productImageAllowedMimeTypes
      .map((type) => type.replace('image/', '').toUpperCase())
      .join(', ')}.`
  }

  if (file.size > productImageMaxSizeBytes) {
    return `La imagen supera el maximo de ${formatBytesAsMb(
      productImageMaxSizeBytes,
    )}.`
  }

  return null
}

export function buildProductImageObjectPath(
  productId: string,
  originalFileName: string,
) {
  const dotIndex = originalFileName.lastIndexOf('.')
  const baseName = dotIndex >= 0 ? originalFileName.slice(0, dotIndex) : originalFileName
  const extension = dotIndex >= 0 ? originalFileName.slice(dotIndex + 1).toLowerCase() : 'bin'
  const safeBaseName = slugify(baseName) || 'image'
  const suffix = globalThis.crypto.randomUUID().slice(0, 8)

  return `${productId}/${safeBaseName}-${Date.now()}-${suffix}.${extension}`
}

export function extractStorageObjectPathFromPublicUrl(
  publicUrl: string,
  bucketName: string,
) {
  const marker = `/storage/v1/object/public/${bucketName}/`
  const markerIndex = publicUrl.indexOf(marker)

  if (markerIndex === -1) {
    return null
  }

  return publicUrl.slice(markerIndex + marker.length)
}
