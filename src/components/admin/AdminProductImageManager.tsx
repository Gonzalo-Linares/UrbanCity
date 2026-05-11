import { useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  buildProductImageObjectPath,
  extractStorageObjectPathFromPublicUrl,
  formatBytesAsMb,
  formatCrudError,
  productImageAllowedMimeTypes,
  productImageMaxSizeBytes,
  productImagesBucket,
  validateProductImageFile,
} from '@/lib/admin'
import { supabase } from '@/lib/supabase'
import type { ProductImageRow, ProductRow } from '@/types/database'

interface AdminProductImageManagerProps {
  product: Pick<ProductRow, 'id' | 'name'>
  images: ProductImageRow[]
  onRefresh: () => Promise<void>
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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const orderedImages = sortImages(images)

  async function uploadFiles(fileList: FileList | null) {
    if (!supabase || !fileList || fileList.length === 0) {
      return
    }

    const files = Array.from(fileList)

    for (const file of files) {
      const validationError = validateProductImageFile(file)

      if (validationError) {
        setError(validationError)
        setSuccess(null)
        return
      }
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    const currentMaxOrder = orderedImages.reduce(
      (maxValue, image) => Math.max(maxValue, image.sort_order),
      -1,
    )

    for (const [index, file] of files.entries()) {
      const objectPath = buildProductImageObjectPath(product.id, file.name)

      const uploadResult = await supabase.storage
        .from(productImagesBucket)
        .upload(objectPath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        })

      if (uploadResult.error) {
        setUploading(false)
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
        setError(formatCrudError(insertResult.error.message, insertResult.error.code))
        return
      }
    }

    setUploading(false)
    setSuccess(
      files.length === 1
        ? 'Imagen cargada correctamente.'
        : `${files.length} imágenes cargadas correctamente.`,
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
      client
        .from('product_images')
        .update({ sort_order: index })
        .eq('id', image.id),
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

    if (
      typeof window !== 'undefined' &&
      !window.confirm('¿Eliminar esta imagen del producto?')
    ) {
      return
    }

    setBusyImageId(image.id)
    setError(null)
    setSuccess(null)

    const objectPath = extractStorageObjectPathFromPublicUrl(
      image.url,
      productImagesBucket,
    )

    if (objectPath) {
      const removeResult = await supabase.storage
        .from(productImagesBucket)
        .remove([objectPath])

      if (removeResult.error) {
        setBusyImageId(null)
        setError(formatCrudError(removeResult.error.message, removeResult.error.name))
        return
      }
    }

    const deleteResult = await supabase
      .from('product_images')
      .delete()
      .eq('id', image.id)

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
    <Card className="space-y-5 border border-white/10 bg-[#111111] text-white shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
      <div className="space-y-2">
        <p className="text-sm font-medium text-white">Imágenes de {product.name}</p>
        <p className="text-sm leading-6 text-white/64">
          Podés seleccionar una o varias imágenes. Formatos permitidos:{' '}
          {productImageAllowedMimeTypes
            .map((type) => type.replace('image/', '').toUpperCase())
            .join(', ')}
          . Máximo por archivo: {formatBytesAsMb(productImageMaxSizeBytes)}.
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

      <div className="rounded-[24px] border border-dashed border-white/12 bg-black/20 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/30 text-brand-strong">
              <ImagePlus className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-white">Subir imágenes</p>
              <p className="text-sm text-white/64">
                Producto seleccionado: {product.name}. Podés subir una o varias imágenes.
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
            {uploading ? 'Subiendo...' : 'Subir imágenes'}
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
              className="grid gap-4 rounded-[24px] border border-white/10 bg-black/20 p-4 lg:grid-cols-[110px_1fr_auto]"
            >
              <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#0d0d0d]">
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
