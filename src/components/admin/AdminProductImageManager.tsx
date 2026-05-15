import { useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  buildProductImageObjectPath,
  extractStorageObjectPathFromPublicUrl,
  formatBytesAsMb,
  formatCrudError,
  formatFileSize,
  optimizeImageFile,
  productImageAllowedMimeTypes,
  productImageMaxSizeBytes,
  productImagesBucket,
  validateImageMimeType,
  validateImageSize,
} from '@/lib/admin'
import { supabase } from '@/lib/supabase'
import type { ProductImageRow, ProductRow } from '@/types/database'

interface AdminProductImageManagerProps {
  product: Pick<ProductRow, 'id' | 'name'>
  images: ProductImageRow[]
  onRefresh: () => Promise<void>
}

interface PreparedUploadFile {
  originalFile: File
  uploadFile: File
  originalSize: number
  optimizedSize: number
  wasOptimized: boolean
}

function sortImages(images: ProductImageRow[]) {
  return [...images].sort((left, right) => {
    if (left.sort_order === right.sort_order) {
      return left.created_at.localeCompare(right.created_at)
    }

    return left.sort_order - right.sort_order
  })
}

export function AdminProductImageManager({
  product,
  images,
  onRefresh,
}: AdminProductImageManagerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busyImageId, setBusyImageId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const orderedImages = sortImages(images)

  async function uploadFiles(fileList: FileList | null) {
    if (!supabase || !fileList || fileList.length === 0) {
      return
    }

    const files = Array.from(fileList)

    for (const file of files) {
      const validationError = validateImageMimeType(file, productImageAllowedMimeTypes)

      if (validationError) {
        setError(validationError)
        setSuccess(null)
        return
      }
    }

    setUploading(true)
    setUploadStatus('Optimizando imágenes...')
    setError(null)
    setSuccess(null)

    const preparedFiles: PreparedUploadFile[] = []

    for (const file of files) {
      const optimizedResult = await optimizeImageFile(file, {
        maxWidth: 1400,
        maxHeight: 1400,
        quality: 0.82,
        outputType: 'image/webp',
      })

      const sizeError = validateImageSize(
        optimizedResult.file,
        productImageMaxSizeBytes,
        'La imagen sigue siendo demasiado pesada. Probá con una foto más liviana.',
      )

      if (sizeError) {
        setUploading(false)
        setUploadStatus(null)
        setError(sizeError)
        return
      }

      preparedFiles.push({
        originalFile: file,
        uploadFile: optimizedResult.file,
        originalSize: optimizedResult.originalSize,
        optimizedSize: optimizedResult.optimizedSize,
        wasOptimized: optimizedResult.wasOptimized,
      })
    }

    const currentMaxOrder = orderedImages.reduce(
      (maxValue, image) => Math.max(maxValue, image.sort_order),
      -1,
    )
    let optimizedFilesCount = 0
    let singleOptimizationMessage: string | null = null

    for (const [index, preparedFile] of preparedFiles.entries()) {
      if (preparedFile.wasOptimized) {
        optimizedFilesCount += 1

        if (preparedFiles.length === 1) {
          singleOptimizationMessage = `Imagen optimizada: ${formatFileSize(
            preparedFile.originalSize,
          )} → ${formatFileSize(preparedFile.optimizedSize)}.`
        }
      }

      setUploadStatus('Subiendo imágenes...')
      const objectPath = buildProductImageObjectPath(
        product.id,
        preparedFile.uploadFile.name,
      )

      const uploadResult = await supabase.storage
        .from(productImagesBucket)
        .upload(objectPath, preparedFile.uploadFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: preparedFile.uploadFile.type,
        })

      if (uploadResult.error) {
        setUploading(false)
        setUploadStatus(null)
        setError(formatCrudError(uploadResult.error.message, uploadResult.error.name))
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(productImagesBucket).getPublicUrl(objectPath)

      const insertResult = await supabase.from('product_images').insert({
        product_id: product.id,
        url: publicUrl,
        alt: `${product.name} - ${index + 1}`,
        sort_order: currentMaxOrder + index + 1,
      })

      if (insertResult.error) {
        await supabase.storage.from(productImagesBucket).remove([objectPath])
        setUploading(false)
        setUploadStatus(null)
        setError(formatCrudError(insertResult.error.message, insertResult.error.code))
        return
      }
    }

    setUploading(false)
    setUploadStatus(null)

    const baseSuccessMessage =
      preparedFiles.length === 1
        ? 'Imagen cargada correctamente.'
        : `${preparedFiles.length} imágenes cargadas correctamente.`
    const optimizationMessage =
      preparedFiles.length === 1
        ? singleOptimizationMessage
        : optimizedFilesCount > 0
          ? `Se optimizaron ${optimizedFilesCount} imágenes antes de subir.`
          : null

    setSuccess(
      optimizationMessage
        ? `${baseSuccessMessage} ${optimizationMessage}`
        : baseSuccessMessage,
    )

    if (inputRef.current) {
      inputRef.current.value = ''
    }

    await onRefresh()
  }

  async function persistOrder(nextImages: ProductImageRow[], successMessage: string) {
    if (!supabase) {
      return
    }

    const client = supabase
    const updates = nextImages.map((image, index) =>
      client.from('product_images').update({ sort_order: index }).eq('id', image.id),
    )

    const results = await Promise.all(updates)
    const failedResult = results.find((result) => result.error)

    if (failedResult?.error) {
      setError(formatCrudError(failedResult.error.message, failedResult.error.code))
      return
    }

    setSuccess(successMessage)
    await onRefresh()
  }

  async function moveImage(imageId: string, direction: 'up' | 'down') {
    const currentIndex = orderedImages.findIndex((image) => image.id === imageId)

    if (currentIndex === -1) {
      return
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= orderedImages.length) {
      return
    }

    setBusyImageId(imageId)
    setError(null)
    setSuccess(null)

    const nextImages = [...orderedImages]
    const currentImage = nextImages[currentIndex]
    const targetImage = nextImages[targetIndex]

    if (!currentImage || !targetImage) {
      return
    }

    nextImages[currentIndex] = targetImage
    nextImages[targetIndex] = currentImage

    await persistOrder(
      nextImages,
      direction === 'up' ? 'Imagen movida hacia arriba.' : 'Imagen movida hacia abajo.',
    )
    setBusyImageId(null)
  }

  async function deleteImage(image: ProductImageRow) {
    if (!supabase) {
      return
    }

    if (typeof window !== 'undefined' && !window.confirm('Eliminar esta imagen del producto?')) {
      return
    }

    setBusyImageId(image.id)
    setError(null)
    setSuccess(null)

    const objectPath = extractStorageObjectPathFromPublicUrl(image.url, productImagesBucket)

    if (objectPath) {
      const removeResult = await supabase.storage.from(productImagesBucket).remove([objectPath])

      if (removeResult.error) {
        setBusyImageId(null)
        setError(formatCrudError(removeResult.error.message, removeResult.error.name))
        return
      }
    }

    const deleteResult = await supabase.from('product_images').delete().eq('id', image.id)

    if (deleteResult.error) {
      setBusyImageId(null)
      setError(formatCrudError(deleteResult.error.message, deleteResult.error.code))
      return
    }

    const remainingImages = orderedImages.filter((current) => current.id !== image.id)
    await persistOrder(remainingImages, 'Imagen eliminada correctamente.')
    setBusyImageId(null)
  }

  return (
    <Card className="space-y-4 border border-white/10 bg-[#111111] p-4 text-white shadow-[0_24px_56px_rgba(0,0,0,0.22)] sm:space-y-5 sm:p-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-white">Imágenes de {product.name}</p>
        <p className="text-sm leading-6 text-white/64">
          Podés subir fotos desde tu celular. Las imágenes se optimizan automáticamente antes de subir. Formatos permitidos:{' '}
          {productImageAllowedMimeTypes
            .map((type) => type.replace('image/', '').toUpperCase())
            .join(', ')}
          . Máximo final por archivo: {formatBytesAsMb(productImageMaxSizeBytes)}. Recomendado: fotos claras y bien encuadradas.
        </p>
      </div>

      {error ? (
        <div className="rounded-[22px] border border-rose-500/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-[22px] border border-emerald-500/18 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}

      <div className="rounded-[22px] border border-dashed border-white/12 bg-black/20 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/30 text-brand-strong sm:h-11 sm:w-11">
              <ImagePlus className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-white">Subir imágenes</p>
              <p className="text-sm text-white/64">
                Producto seleccionado: {product.name}. Las imágenes se optimizan automáticamente antes de subir.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {uploading ? uploadStatus ?? 'Subiendo...' : 'Subir imágenes'}
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={productImageAllowedMimeTypes.join(',')}
          className="hidden"
          onChange={(event) => void uploadFiles(event.target.files)}
        />
      </div>

      <div className="space-y-3">
        {orderedImages.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-white/12 bg-black/20 px-4 py-8 text-sm text-white/58">
            Este producto todavía no tiene imágenes.
          </div>
        ) : null}

        {orderedImages.map((image, index) => {
          const isBusy = busyImageId === image.id

          return (
            <div
              key={image.id}
              className="grid gap-4 rounded-[22px] border border-white/10 bg-black/20 p-4 lg:grid-cols-[110px_1fr_auto]"
            >
              <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#0d0d0d]">
                <img
                  src={image.url}
                  alt={image.alt ?? product.name}
                  className="h-28 w-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-white">Imagen {index + 1}</p>
                <p className="break-all text-sm text-white/56">{image.url}</p>
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                  Orden actual: {index + 1}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 lg:flex-col">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy || index === 0}
                  onClick={() => void moveImage(image.id, 'up')}
                >
                  <ArrowUp className="h-4 w-4" />
                  Subir
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy || index === orderedImages.length - 1}
                  onClick={() => void moveImage(image.id, 'down')}
                >
                  <ArrowDown className="h-4 w-4" />
                  Bajar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-white/72 hover:bg-white/8 hover:text-white"
                  disabled={isBusy}
                  onClick={() => void deleteImage(image)}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
