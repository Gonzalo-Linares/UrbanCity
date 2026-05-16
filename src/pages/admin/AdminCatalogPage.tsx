import { useEffect, useMemo, useState } from 'react'
import {
  ImagePlus,
  ListOrdered,
  Package,
  Save,
  Store,
  Trash2,
} from 'lucide-react'
import { AdminMetricCard } from '@/components/admin/AdminMetricCard'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/LoadingState'
import { useAdminOutletData } from '@/hooks/useAdminShellData'
import { formatCurrency } from '@/lib/formatters'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type {
  CatalogFeaturedProductRow,
  ProductImageRow,
  ProductRow,
} from '@/types/database'

interface CatalogProductItem extends ProductRow {
  categoryName: string | null
  primaryImage: ProductImageRow | null
}

interface CatalogSlotDraft {
  slot: number
  productId: string
}

const catalogPositionNumbers = Array.from({ length: 8 }, (_, index) => index + 1)

function buildProductImagesMap(images: ProductImageRow[]) {
  return images.reduce<Record<string, ProductImageRow[]>>((accumulator, image) => {
    if (!accumulator[image.product_id]) {
      accumulator[image.product_id] = []
    }

    accumulator[image.product_id]?.push(image)
    return accumulator
  }, {})
}

function buildCatalogSlotDrafts(
  rows: Pick<CatalogFeaturedProductRow, 'product_id' | 'slot'>[],
) {
  return catalogPositionNumbers.map((slot) => ({
    slot,
    productId: rows.find((row) => row.slot === slot)?.product_id ?? '',
  }))
}

function buildCatalogSlotsSignature(slots: CatalogSlotDraft[]) {
  return slots
    .map((slot) => `${slot.slot}:${slot.productId || ''}`)
    .join('|')
}

export function AdminCatalogPage() {
  const { loading } = useAdminOutletData()
  const [products, setProducts] = useState<CatalogProductItem[]>([])
  const [savedRows, setSavedRows] = useState<CatalogFeaturedProductRow[]>([])
  const [slotDrafts, setSlotDrafts] = useState<CatalogSlotDraft[]>(
    buildCatalogSlotDrafts([]),
  )
  const [pageLoading, setPageLoading] = useState(isSupabaseConfigured)
  const [pageError, setPageError] = useState<string | null>(
    isSupabaseConfigured ? null : 'Configura Supabase para administrar el catálogo.',
  )
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const savedSlotDrafts = useMemo(
    () => buildCatalogSlotDrafts(savedRows),
    [savedRows],
  )
  const hasChanges =
    buildCatalogSlotsSignature(slotDrafts) !==
    buildCatalogSlotsSignature(savedSlotDrafts)
  const visibleProducts = useMemo(
    () =>
      products.filter(
        (product) => product.is_active && product.availability !== 'hidden',
      ),
    [products],
  )
  const selectedProductsCount = slotDrafts.filter((slot) => slot.productId).length
  const selectedProductIds = new Set(
    slotDrafts
      .map((slot) => slot.productId)
      .filter((productId): productId is string => productId.length > 0),
  )
  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  )

  useEffect(() => {
    if (!supabase) {
      return
    }

    const client = supabase
    let ignore = false

    async function loadCatalogAdminPage() {
      setPageLoading(true)
      setPageError(null)

      const [
        categoriesResult,
        productsResult,
        imagesResult,
        catalogFeaturedProductsResult,
      ] = await Promise.all([
        client.from('categories').select('*').order('name', { ascending: true }),
        client.from('products').select('*').order('name', { ascending: true }),
        client
          .from('product_images')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        client
          .from('catalog_featured_products')
          .select('*')
          .order('slot', { ascending: true }),
      ])

      if (ignore) {
        return
      }

      if (
        categoriesResult.error ||
        productsResult.error ||
        imagesResult.error ||
        catalogFeaturedProductsResult.error
      ) {
        const isMissingCatalogTable =
          catalogFeaturedProductsResult.error?.code === '42P01' ||
          catalogFeaturedProductsResult.error?.message
            ?.toLowerCase()
            .includes('catalog_featured_products')

        setPageError(
          isMissingCatalogTable
            ? 'Aplicá el SQL nuevo para administrar el orden del catálogo.'
            : 'No se pudo cargar la configuración del catálogo.',
        )
        setPageLoading(false)
        return
      }

      const nextCategories = categoriesResult.data ?? []
      const nextProducts = productsResult.data ?? []
      const nextImages = imagesResult.data ?? []
      const nextRows = (catalogFeaturedProductsResult.data ?? []) as CatalogFeaturedProductRow[]
      const categoryById = new Map(nextCategories.map((category) => [category.id, category]))
      const productImagesMap = buildProductImagesMap(nextImages)

      setProducts(
        nextProducts.map((product) => ({
          ...product,
          categoryName: product.category_id
            ? categoryById.get(product.category_id)?.name ?? null
            : null,
          primaryImage: productImagesMap[product.id]?.[0] ?? null,
        })),
      )
      setSavedRows(nextRows)
      setSlotDrafts(buildCatalogSlotDrafts(nextRows))
      setPageLoading(false)
    }

    void loadCatalogAdminPage()

    return () => {
      ignore = true
    }
  }, [reloadKey])

  if (loading || pageLoading) {
    return <LoadingState label="Cargando configuración del catálogo..." />
  }

  function setSlotProduct(slot: number, productId: string) {
    setSlotDrafts((current) =>
      current.map((item) =>
        item.slot === slot
          ? {
              ...item,
              productId,
            }
          : item,
      ),
    )
    setActionError(null)
    setActionSuccess(null)
  }

  function clearSlot(slot: number) {
    setSlotProduct(slot, '')
  }

  async function reloadPage() {
    setReloadKey((current) => current + 1)
  }

  async function persistCatalogOrder(
    nextSlots: CatalogSlotDraft[],
    successMessage: string,
  ) {
    if (!supabase) {
      setActionError('Configura Supabase para administrar el catálogo.')
      return
    }

    const selectedIds = nextSlots
      .map((slot) => slot.productId)
      .filter((productId): productId is string => productId.length > 0)

    if (new Set(selectedIds).size !== selectedIds.length) {
      setActionError('Ese producto ya está asignado a otro lugar.')
      return
    }

    setBusy(true)
    setActionError(null)
    setActionSuccess(null)

    const currentIds = savedRows.map((row) => row.id)

    if (currentIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('catalog_featured_products')
        .delete()
        .in('id', currentIds)

      if (deleteError) {
        setBusy(false)
        setActionError('No se pudo actualizar el orden del catálogo.')
        return
      }
    }

    const assignmentsToInsert = nextSlots
      .filter((slot) => slot.productId)
      .map((slot) => ({
        slot: slot.slot,
        product_id: slot.productId,
      }))

    if (assignmentsToInsert.length === 0) {
      setSavedRows([])
      setSlotDrafts(buildCatalogSlotDrafts([]))
      setBusy(false)
      setActionSuccess(successMessage)
      return
    }

    const { data: insertedRows, error: insertError } = await supabase
      .from('catalog_featured_products')
      .insert(assignmentsToInsert)
      .select('*')
      .order('slot', { ascending: true })

    if (insertError) {
      setBusy(false)
      setActionError('No se pudo guardar el orden del catálogo.')
      await reloadPage()
      return
    }

    const nextRows = (insertedRows ?? []) as CatalogFeaturedProductRow[]

    setSavedRows(nextRows)
    setSlotDrafts(buildCatalogSlotDrafts(nextRows))
    setBusy(false)
    setActionSuccess(successMessage)
  }

  async function handleSaveOrder() {
    await persistCatalogOrder(slotDrafts, 'Orden del catálogo guardado.')
  }

  async function handleClearAll() {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        '¿Quitar todos los productos del inicio del catálogo?',
      )

      if (!confirmed) {
        return
      }
    }

    await persistCatalogOrder([], 'Orden del catálogo limpiado.')
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Orden del catálogo"
        description="Elegí hasta 8 productos para mostrarlos primero en el catálogo cuando el orden sea Relevancia."
        variant="compact"
        hideDescriptionOnMobile
      />

      {pageError ? (
        <div className="rounded-[18px] border border-rose-500/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {pageError}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-[18px] border border-rose-500/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {actionError}
        </div>
      ) : null}

      {actionSuccess ? (
        <div className="rounded-[18px] border border-emerald-500/18 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {actionSuccess}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        <AdminMetricCard
          title="Posiciones ocupadas"
          value={selectedProductsCount}
          description="Productos elegidos"
          icon={ListOrdered}
        />
        <AdminMetricCard
          title="Lugares libres"
          value={8 - selectedProductsCount}
          description="Se saltean automáticamente"
          icon={Store}
        />
        <AdminMetricCard
          title="Productos visibles"
          value={visibleProducts.length}
          description="Disponibles para elegir"
          icon={Package}
        />
      </div>

      <Card className="space-y-4 border border-white/10 bg-[#111111] p-3.5 text-white shadow-none sm:p-6 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">Primero en catálogo</p>
            <p className="text-sm leading-6 text-white/58">
              Los lugares vacíos se saltean. Después de estos productos, el
              catálogo sigue mostrando el resto automáticamente.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-rose-500/20 text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
              disabled={busy || selectedProductsCount === 0}
              onClick={() => void handleClearAll()}
            >
              <Trash2 className="h-4 w-4" />
              Limpiar todo
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy || !hasChanges}
              onClick={() => void handleSaveOrder()}
            >
              <Save className="h-4 w-4" />
              {busy ? 'Guardando...' : 'Guardar orden'}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          {slotDrafts.map((slotDraft) => {
            const selectedProduct = productById.get(slotDraft.productId) ?? null

            return (
              <div
                key={slotDraft.slot}
                className="rounded-[18px] border border-white/10 bg-black/20 p-3"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.62rem] uppercase tracking-[0.18em] text-white/40">
                        Posición
                      </p>
                      <p className="text-2xl font-semibold tracking-[-0.03em] text-white">
                        #{slotDraft.slot}
                      </p>
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-xs text-white/70">
                      {selectedProduct ? 'Asignado' : 'Libre'}
                    </span>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white">Producto</span>
                    <select
                      value={slotDraft.productId}
                      onChange={(event) =>
                        setSlotProduct(slotDraft.slot, event.target.value)
                      }
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 text-sm text-white"
                    >
                      <option value="">Sin producto</option>
                      {visibleProducts.map((product) => {
                        const isUsedInAnotherSlot =
                          selectedProductIds.has(product.id) &&
                          slotDraft.productId !== product.id

                        return (
                          <option
                            key={product.id}
                            value={product.id}
                            disabled={isUsedInAnotherSlot}
                          >
                            {product.name}
                          </option>
                        )
                      })}
                    </select>
                  </label>

                  {selectedProduct ? (
                    <div className="rounded-[16px] border border-white/10 bg-[#0d0d0d] p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white">
                          {selectedProduct.primaryImage ? (
                            <img
                              src={selectedProduct.primaryImage.url}
                              alt={
                                selectedProduct.primaryImage.alt ??
                                selectedProduct.name
                              }
                              className="h-full w-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-black/20 text-white/34">
                              <ImagePlus className="h-5 w-5" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <p className="line-clamp-2 text-sm font-medium text-white">
                            {selectedProduct.name}
                          </p>
                          <p className="text-sm text-white/60">
                            {formatCurrency(selectedProduct.price)}
                          </p>
                          <p className="text-xs text-white/46">
                            {selectedProduct.categoryName ?? 'Sin categoría'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[16px] border border-dashed border-white/12 bg-[#0d0d0d] px-4 py-5 text-sm text-white/58">
                      Sin producto asignado.
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-white/72 hover:bg-white/8 hover:text-white"
                      disabled={!selectedProduct}
                      onClick={() => clearSlot(slotDraft.slot)}
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
