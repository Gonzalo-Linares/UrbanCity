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
export const adminImageBucket = productImagesBucket
export const adminImageMaxSizeBytes = productImageMaxSizeBytes
export const adminImageAllowedMimeTypes = productImageAllowedMimeTypes

export interface OptimizeImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  outputType?: 'image/webp' | 'image/jpeg'
  outputExtension?: 'webp' | 'jpg'
}

export interface OptimizedImageResult {
  file: File
  originalSize: number
  optimizedSize: number
  wasOptimized: boolean
}

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
    return 'No se puede eliminar este registro porque ya tiene pedidos asociados. Retiralo de la tienda o dejalo inactivo en lugar de borrarlo.'
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

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }

  const valueInMb = bytes / (1024 * 1024)
  return `${valueInMb >= 10 ? valueInMb.toFixed(0) : valueInMb.toFixed(1)} MB`
}

export function validateImageMimeType(
  file: File,
  allowedMimeTypes = productImageAllowedMimeTypes,
) {
  if (!allowedMimeTypes.includes(file.type)) {
    return `Tipo de archivo no permitido. Usa ${allowedMimeTypes
      .map((type) => type.replace('image/', '').toUpperCase())
      .join(', ')}.`
  }

  return null
}

export function validateImageSize(
  file: File,
  maxSizeBytes = productImageMaxSizeBytes,
  oversizedMessage?: string,
) {
  if (file.size > maxSizeBytes) {
    return (
      oversizedMessage ??
      `La imagen supera el máximo de ${formatBytesAsMb(maxSizeBytes)}.`
    )
  }

  return null
}

export function validateProductImageFile(file: File) {
  return (
    validateImageMimeType(file, productImageAllowedMimeTypes) ??
    validateImageSize(file, productImageMaxSizeBytes)
  )
}

export const validateAdminImageFile = validateProductImageFile

function extensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case 'image/webp':
      return 'webp'
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    default:
      return null
  }
}

export async function optimizeImageFile(
  file: File,
  options: OptimizeImageOptions = {},
): Promise<OptimizedImageResult> {
  const originalSize = file.size
  const fallbackResult: OptimizedImageResult = {
    file,
    originalSize,
    optimizedSize: originalSize,
    wasOptimized: false,
  }

  if (validateImageMimeType(file, adminImageAllowedMimeTypes)) {
    return fallbackResult
  }

  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof globalThis.createImageBitmap !== 'function'
  ) {
    return fallbackResult
  }

  const {
    maxWidth = 1400,
    maxHeight = 1400,
    quality = 0.82,
    outputType = 'image/webp',
    outputExtension = outputType === 'image/jpeg' ? 'jpg' : 'webp',
  } = options

  let bitmap: ImageBitmap | null = null

  try {
    bitmap = await globalThis.createImageBitmap(file)

    const width = bitmap.width || 1
    const height = bitmap.height || 1
    const scale = Math.min(maxWidth / width, maxHeight / height, 1)
    const targetWidth = Math.max(1, Math.round(width * scale))
    const targetHeight = Math.max(1, Math.round(height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight

    const context = canvas.getContext('2d')

    if (!context) {
      return fallbackResult
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, 0, 0, targetWidth, targetHeight)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, quality)
    })

    if (!blob || blob.size <= 0 || blob.size >= originalSize) {
      return fallbackResult
    }

    const resolvedMimeType = blob.type || outputType
    const resolvedExtension =
      extensionFromMimeType(resolvedMimeType) ?? outputExtension ?? null

    if (!resolvedMimeType || !resolvedExtension) {
      return fallbackResult
    }

    const dotIndex = file.name.lastIndexOf('.')
    const baseName = dotIndex >= 0 ? file.name.slice(0, dotIndex) : file.name
    const optimizedFile = new File([blob], `${baseName}.${resolvedExtension}`, {
      type: resolvedMimeType,
      lastModified: Date.now(),
    })

    return {
      file: optimizedFile,
      originalSize,
      optimizedSize: optimizedFile.size,
      wasOptimized: true,
    }
  } catch {
    return fallbackResult
  } finally {
    bitmap?.close()
  }
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

export function buildHeroSlideImageObjectPath(
  slideId: string,
  originalFileName: string,
) {
  const dotIndex = originalFileName.lastIndexOf('.')
  const baseName = dotIndex >= 0 ? originalFileName.slice(0, dotIndex) : originalFileName
  const extension = dotIndex >= 0 ? originalFileName.slice(dotIndex + 1).toLowerCase() : 'bin'
  const safeBaseName = slugify(baseName) || 'hero-slide'
  const suffix = globalThis.crypto.randomUUID().slice(0, 8)

  return `hero-slides/${slideId}/${safeBaseName}-${Date.now()}-${suffix}.${extension}`
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
