import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CircleHelp,
  Eye,
  EyeOff,
  ImagePlus,
  Package,
  Pencil,
  RefreshCw,
  Star,
  Store,
  Trash2,
} from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { AdminProductImageManager } from '@/components/admin/AdminProductImageManager'
import { AdminMetricCard } from '@/components/admin/AdminMetricCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/LoadingState'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { SelectField } from '@/components/ui/SelectField'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Textarea } from '@/components/ui/Textarea'
import { useAdminOutletData } from '@/hooks/useAdminShellData'
import {
  adminAvailabilityTone,
  extractStorageObjectPathFromPublicUrl,
  formatCrudError,
  isProductVisible,
  productImagesBucket,
  resolveSlug,
  toNullableText,
} from '@/lib/admin'
import { formatAvailabilityLabel, formatCurrency } from '@/lib/formatters'
import { getDiscountPercent } from '@/lib/pricing'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  adminProductSchema,
  type AdminProductSchemaInput,
  type AdminProductSchema,
} from '@/schemas/adminProduct'
import type {
  Availability,
  CategoryRow,
  ProductImageRow,
  ProductRow,
} from '@/types/database'

interface ProductListItem extends ProductRow {
  categoryName: string | null
  hasOrders: boolean
  orderCount: number
}

const availabilityOptions: Availability[] = [
  'available',
  'inquiry',
  'out_of_stock',
  'hidden',
]

const newProductDraftKey = 'urbancity-admin-product-new-draft'
const editingProductDraftKeyPrefix = 'urbancity-admin-product-edit-draft:'

function productVisibilityMeta(product: Pick<ProductRow, 'is_active' | 'availability'>) {
  if (!product.is_active) {
    return {
      label: 'Inactivo',
      tone: 'muted' as const,
      description: 'No se muestra en la tienda, pero el producto sigue guardado.',
    }
  }

  if (product.availability === 'hidden') {
    return {
      label: 'Oculto por disponibilidad',
      tone: 'muted' as const,
      description:
        'Sigue activo internamente, pero availability=hidden lo retira de la tienda.',
    }
  }

  return {
    label: 'Visible',
    tone: 'success' as const,
    description: 'El producto aparece en la tienda según su disponibilidad.',
  }
}

function buildDraftKey(productId: string | null) {
  return productId
    ? `${editingProductDraftKeyPrefix}${productId}`
    : newProductDraftKey
}

function buildProductFormValues(product?: ProductRow | null): AdminProductSchemaInput {
  if (!product) {
    return { ...defaultValues }
  }

  return {
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    price: product.price,
    compareAtPrice: product.compare_at_price ?? '',
    availability: product.availability,
    categoryId: product.category_id ?? '',
    featured: product.featured,
    isActive: product.is_active,
  }
}

function normalizeCompareAtPrice(value: unknown) {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? '' : value
  }

  if (typeof value === 'string') {
    return value
  }

  return ''
}

function normalizeProductDraftValues(
  values: AdminProductSchemaInput,
) {
  return {
    name: values.name ?? '',
    slug: values.slug ?? '',
    description: values.description ?? '',
    price:
      typeof values.price === 'number' && Number.isFinite(values.price)
        ? values.price
        : 0,
    compareAtPrice: normalizeCompareAtPrice(values.compareAtPrice),
    availability: values.availability ?? 'available',
    categoryId: values.categoryId ?? '',
    featured: Boolean(values.featured),
    isActive: Boolean(values.isActive),
  }
}

function readProductDraft(key: string) {
  if (typeof window === 'undefined') {
    return null
  }

  const draft = window.localStorage.getItem(key)

  if (!draft) {
    return null
  }

  try {
    const parsed = JSON.parse(draft) as Partial<AdminProductSchemaInput>

    return normalizeProductDraftValues({
      ...defaultValues,
      ...parsed,
    })
  } catch {
    window.localStorage.removeItem(key)
    return null
  }
}

function writeProductDraft(key: string, values: AdminProductSchemaInput) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    key,
    JSON.stringify(normalizeProductDraftValues(values)),
  )
}

function clearProductDraft(key: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(key)
}

function areProductDraftsEqual(
  left: AdminProductSchemaInput,
  right: AdminProductSchemaInput,
) {
  return (
    JSON.stringify(normalizeProductDraftValues(left)) ===
    JSON.stringify(normalizeProductDraftValues(right))
  )
}

const defaultValues: AdminProductSchemaInput = {
  name: '',
  slug: '',
  description: '',
  price: 0,
  compareAtPrice: '',
  availability: 'available',
  categoryId: '',
  featured: false,
  isActive: true,
}

export function AdminProductsPage() {
  const { counts, loading, refresh } = useAdminOutletData()
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [productImagesMap, setProductImagesMap] = useState<
    Record<string, ProductImageRow[]>
  >({})
  const [pageLoading, setPageLoading] = useState(isSupabaseConfigured)
  const [pageError, setPageError] = useState<string | null>(
    isSupabaseConfigured ? null : 'Configura Supabase para administrar productos.',
  )
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [recoveredDraftKey, setRecoveredDraftKey] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyProductId, setBusyProductId] = useState<string | null>(null)
  const imageManagerRef = useRef<HTMLDivElement | null>(null)
  const baseValuesRef = useRef<AdminProductSchemaInput>(defaultValues)
  const lastHydratedSignatureRef = useRef<string | null>(null)
  const pendingImageScrollRef = useRef(false)
  const editingProduct =
    products.find((product) => product.id === editingProductId) ?? null
  const editingProductImages = editingProduct
    ? productImagesMap[editingProduct.id] ?? []
    : []
  const isEditingProductReady = Boolean(editingProduct)
  const currentDraftKey = buildDraftKey(editingProductId)

  const form = useForm<
    AdminProductSchemaInput,
    undefined,
    AdminProductSchema
  >({
    resolver: zodResolver(adminProductSchema),
    defaultValues,
  })
  const watchedDraftValues = useWatch({ control: form.control })

  useEffect(() => {
    if (editingProductId && !editingProduct) {
      return
    }

    const modeBaseValues = buildProductFormValues(editingProduct)
    const hydrationSignature = `${currentDraftKey}:${JSON.stringify(
      normalizeProductDraftValues(modeBaseValues),
    )}`

    if (lastHydratedSignatureRef.current === hydrationSignature) {
      return
    }

    const recoveredDraft = readProductDraft(currentDraftKey)

    baseValuesRef.current = modeBaseValues
    form.reset(
      recoveredDraft ? { ...modeBaseValues, ...recoveredDraft } : modeBaseValues,
    )
    lastHydratedSignatureRef.current = hydrationSignature
    window.setTimeout(() => {
      setRecoveredDraftKey(recoveredDraft ? currentDraftKey : null)
    }, 0)
  }, [currentDraftKey, editingProduct, editingProductId, form])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentValues = form.getValues()

      if (areProductDraftsEqual(currentValues, baseValuesRef.current)) {
        clearProductDraft(currentDraftKey)
        setRecoveredDraftKey((current) =>
          current === currentDraftKey ? null : current,
        )
        return
      }

      writeProductDraft(currentDraftKey, currentValues)
    }, 250)

    return () => clearTimeout(timeoutId)
  }, [currentDraftKey, form, watchedDraftValues])

  useEffect(() => {
    if (!pendingImageScrollRef.current || !imageManagerRef.current) {
      return
    }

    pendingImageScrollRef.current = false
    imageManagerRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [editingProductId, isEditingProductReady])

  useEffect(() => {
    if (!supabase) {
      return
    }

    const client = supabase
    let ignore = false

    async function loadProductsPage() {
      setPageLoading(true)
      setPageError(null)

      const [
        categoriesResult,
        productsResult,
        orderItemsResult,
        productImagesResult,
      ] = await Promise.all([
        client
          .from('categories')
          .select('*')
          .order('name', { ascending: true }),
        client
          .from('products')
          .select('*')
          .order('created_at', { ascending: false }),
        client.from('order_items').select('product_id'),
        client
          .from('product_images')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
      ])

      if (ignore) {
        return
      }

      if (
        categoriesResult.error ||
        productsResult.error ||
        orderItemsResult.error ||
        productImagesResult.error
      ) {
        setPageError('No se pudieron cargar los productos desde Supabase.')
        setPageLoading(false)
        return
      }

      const nextCategories = categoriesResult.data ?? []
      const categoryMap = new Map(nextCategories.map((category) => [category.id, category]))
      const orderCountMap = new Map<string, number>()
      const nextProductImagesMap: Record<string, ProductImageRow[]> = {}

      for (const item of orderItemsResult.data ?? []) {
        if (!item.product_id) {
          continue
        }

        orderCountMap.set(
          item.product_id,
          (orderCountMap.get(item.product_id) ?? 0) + 1,
        )
      }

      for (const image of productImagesResult.data ?? []) {
        if (!nextProductImagesMap[image.product_id]) {
          nextProductImagesMap[image.product_id] = []
        }

        nextProductImagesMap[image.product_id]?.push(image)
      }

      setCategories(nextCategories)
      setProductImagesMap(nextProductImagesMap)
      setProducts(
        (productsResult.data ?? []).map((product) => ({
          ...product,
          categoryName: product.category_id
            ? categoryMap.get(product.category_id)?.name ?? null
            : null,
          hasOrders: (orderCountMap.get(product.id) ?? 0) > 0,
          orderCount: orderCountMap.get(product.id) ?? 0,
        })),
      )
      setPageLoading(false)
    }

    void loadProductsPage()

    return () => {
      ignore = true
    }
  }, [reloadKey])

  if (loading || pageLoading) {
    return <LoadingState label="Cargando productos..." />
  }

  function hasUnsavedChanges() {
    return !areProductDraftsEqual(form.getValues(), baseValuesRef.current)
  }

  function discardDraftForCurrentMode() {
    clearProductDraft(currentDraftKey)
    setRecoveredDraftKey((current) =>
      current === currentDraftKey ? null : current,
    )
  }

  function resetCurrentModeToBase() {
    const nextBaseValues = buildProductFormValues(editingProduct)
    baseValuesRef.current = nextBaseValues
    form.reset(nextBaseValues)
    setRecoveredDraftKey(null)
  }

  function confirmDiscardChanges() {
    if (!hasUnsavedChanges() || typeof window === 'undefined') {
      return true
    }

    return window.confirm('Tenés cambios sin guardar. ¿Querés descartarlos?')
  }

  function beginEditingProduct(
    productId: string,
    options?: { scrollToImages?: boolean },
  ) {
    const nextProductId = productId

    if (nextProductId !== editingProductId && !confirmDiscardChanges()) {
      return
    }

    if (nextProductId !== editingProductId && hasUnsavedChanges()) {
      discardDraftForCurrentMode()
    }

    setSubmitError(null)
    setSubmitSuccess(null)

    if (options?.scrollToImages) {
      pendingImageScrollRef.current = true
    }

    if (nextProductId === editingProductId) {
      if (options?.scrollToImages && imageManagerRef.current) {
        imageManagerRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
      return
    }

    setEditingProductId(nextProductId)
  }

  async function reloadPage() {
    setReloadKey((current) => current + 1)
    refresh()
  }

  async function handleSubmit(values: AdminProductSchema) {
    if (!supabase) {
      setSubmitError('Configura Supabase para administrar productos.')
      return
    }

    setSubmitError(null)
    setSubmitSuccess(null)

    const payload = {
      name: values.name.trim(),
      slug: resolveSlug(values.name, values.slug),
      description: toNullableText(values.description ?? ''),
      price: values.price,
      compare_at_price: values.compareAtPrice ?? null,
      availability: values.availability,
      category_id: values.categoryId || null,
      featured: values.featured,
      is_active: values.isActive,
    }

    const result = editingProduct
      ? await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id)
          .select('*')
          .single()
      : await supabase.from('products').insert(payload).select('*').single()

    if (result.error) {
      setSubmitError(formatCrudError(result.error.message, result.error.code))
      return
    }

    const createdOrUpdatedProduct = result.data
    const nextFormValues = buildProductFormValues(createdOrUpdatedProduct)

    setSubmitSuccess(
      editingProduct
        ? 'Producto actualizado correctamente.'
        : 'Producto creado correctamente. Ya podés cargar imágenes.',
    )
    discardDraftForCurrentMode()
    clearProductDraft(buildDraftKey(createdOrUpdatedProduct.id))
    baseValuesRef.current = nextFormValues
    form.reset(nextFormValues)
    setRecoveredDraftKey(null)
    setEditingProductId(createdOrUpdatedProduct.id)
    await reloadPage()
  }

  async function updateProduct(
    productId: string,
    updates: Partial<ProductRow>,
    successMessage: string,
  ) {
    if (!supabase) {
      return
    }

    setBusyProductId(productId)
    setSubmitError(null)
    setSubmitSuccess(null)

    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)

    setBusyProductId(null)

    if (error) {
      setSubmitError(formatCrudError(error.message, error.code))
      return
    }

    setSubmitSuccess(successMessage)
    await reloadPage()
  }

  async function handleDelete(product: ProductListItem) {
    if (!supabase) {
      return
    }

    if (product.hasOrders) {
      setSubmitError(
        `"${product.name}" no se puede eliminar porque ya aparece en ${product.orderCount} pedido${product.orderCount === 1 ? '' : 's'}. Si necesitás retirarlo de la tienda, déjalo inactivo o usa la disponibilidad hidden.`,
      )
      return
    }

    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Eliminar definitivamente "${product.name}"?`)
    ) {
      return
    }

    setBusyProductId(product.id)
    setSubmitError(null)
    setSubmitSuccess(null)

    const imagePaths = (productImagesMap[product.id] ?? [])
      .map((image) =>
        extractStorageObjectPathFromPublicUrl(image.url, productImagesBucket),
      )
      .filter((path): path is string => Boolean(path))

    if (imagePaths.length > 0) {
      const removeResult = await supabase.storage
        .from(productImagesBucket)
        .remove(imagePaths)

      if (removeResult.error) {
        setBusyProductId(null)
        setSubmitError(formatCrudError(removeResult.error.message, removeResult.error.name))
        return
      }
    }

    const { error } = await supabase.from('products').delete().eq('id', product.id)

    setBusyProductId(null)

    if (error) {
      setSubmitError(formatCrudError(error.message, error.code))
      return
    }

    if (editingProductId === product.id) {
      clearProductDraft(buildDraftKey(product.id))
      setEditingProductId(null)
      form.reset(defaultValues)
    }

    setSubmitSuccess('Producto eliminado correctamente.')
    await reloadPage()
  }

  return (
    <div className="space-y-8">
      <section className="surface-panel p-6 sm:p-8 lg:p-10">
        <SectionTitle
          eyebrow="Productos"
          title="CRUD del catálogo comercial"
          description="Alta, edición y ajustes operativos de precio, disponibilidad, destacado, visibilidad y categoría sin tocar pagos ni stock transaccional."
          tone="light"
        />
      </section>

      <div className="grid gap-5 md:grid-cols-3">
        <AdminMetricCard
          title="Total cargados"
          value={counts.productsTotal}
          description="Cantidad total de productos en Supabase."
          icon={Package}
        />
        <AdminMetricCard
          title="Activos"
          value={counts.productsActive}
          description="Productos visibles para operación comercial."
          icon={Eye}
        />
        <AdminMetricCard
          title="Vendibles"
          value={counts.productsSellable}
          description="Activos con disponibilidad available o inquiry."
          icon={Store}
        />
      </div>

      <Card className="space-y-5 border border-stone-900/8 bg-white/88">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-950 text-white">
            <CircleHelp className="h-5 w-5" />
          </span>
          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-950">
              Guía rápida de visibilidad y disponibilidad
            </p>
            <p className="text-sm leading-6 text-muted">
              `Visible en tienda` controla si el producto puede mostrarse. La
              `Disponibilidad` define como se ofrece comercialmente. No son lo mismo.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              title: 'Visible en tienda',
              copy:
                'Si está activo y no está hidden, el producto aparece en la tienda.',
            },
            {
              title: 'Inactivo',
              copy:
                'Retira el producto de la tienda sin borrar datos, imágenes ni pedidos asociados.',
            },
            {
              title: 'Disponible',
              copy: 'Se puede pedir normalmente desde el checkout.',
            },
            {
              title: 'Consultar disponibilidad',
              copy:
                'El cliente puede pedirlo, pero el comercio confirma stock por WhatsApp.',
            },
            {
              title: 'Sin stock',
              copy: 'Sigue visible, pero deja claro que hoy no está disponible.',
            },
            {
              title: 'Oculto',
              copy:
                'Lo saca de la tienda aunque siga activo dentro del panel admin.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[22px] border border-stone-900/8 bg-stone-50/80 p-4"
            >
              <p className="text-sm font-medium text-stone-950">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{item.copy}</p>
            </div>
          ))}
        </div>
      </Card>

      {pageError ? (
        <div className="rounded-[22px] border border-rose-500/15 bg-rose-500/8 px-4 py-3 text-sm text-rose-700">
          {pageError}
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-[22px] border border-rose-500/15 bg-rose-500/8 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      ) : null}

      {submitSuccess ? (
        <div className="rounded-[22px] border border-emerald-500/15 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
          {submitSuccess}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-5 border border-stone-900/8 bg-white/88">
          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-950">
              {editingProduct ? 'Editar producto' : 'Nuevo producto'}
            </p>
            <p className="text-sm leading-6 text-muted">
              El slug se genera automáticamente si lo dejas vacío. Si quitas
              `Visible en tienda`, el producto queda inactivo sin borrarse.
            </p>
          </div>

          {recoveredDraftKey === currentDraftKey ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
              <span>Recuperamos un borrador sin guardar.</span>
              <Button
                type="button"
                variant="ghost"
                className="text-amber-950 hover:bg-amber-500/12"
                onClick={() => {
                  discardDraftForCurrentMode()
                  resetCurrentModeToBase()
                }}
              >
                Descartar borrador
              </Button>
            </div>
          ) : null}

          <form
            className="space-y-4"
            onSubmit={(event) => {
              void form.handleSubmit(handleSubmit)(event)
            }}
          >
            <Input
              label="Nombre"
              placeholder="Ej: Box ritual ámbar"
              error={form.formState.errors.name?.message}
              {...form.register('name')}
            />

            <Input
              label="Slug"
              placeholder="box-ritual-ambar"
              hint="Si queda vacío, se autogenera desde el nombre."
              error={form.formState.errors.slug?.message}
              {...form.register('slug')}
            />

            <Textarea
              label="Descripción"
              placeholder="Describe materiales, uso o contexto del producto."
              error={form.formState.errors.description?.message}
              {...form.register('description')}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Precio"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                error={form.formState.errors.price?.message}
                {...form.register('price', { valueAsNumber: true })}
              />

              <Input
                label="Precio anterior"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej: 120000"
                hint="Opcional. Si es mayor al precio actual, se muestra como oferta."
                error={form.formState.errors.compareAtPrice?.message}
                {...form.register('compareAtPrice')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Disponibilidad"
                hint="Available e inquiry permiten pedido. Out of stock informa falta. Hidden lo retira de la tienda."
                error={form.formState.errors.availability?.message}
                {...form.register('availability')}
              >
                {availabilityOptions.map((availability) => (
                  <option key={availability} value={availability}>
                    {formatAvailabilityLabel(availability)}
                  </option>
                ))}
              </SelectField>
            </div>

            <SelectField
              label="Categoría"
              error={form.formState.errors.categoryId?.message}
              {...form.register('categoryId')}
            >
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} {category.is_active ? '' : '(inactiva)'}
                </option>
              ))}
            </SelectField>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-[20px] border border-stone-900/8 bg-stone-50/80 px-4 py-3 text-sm text-stone-900">
                <input type="checkbox" {...form.register('featured')} />
                Marcar como destacado
              </label>
              <label className="flex items-center gap-3 rounded-[20px] border border-stone-900/8 bg-stone-50/80 px-4 py-3 text-sm text-stone-900">
                <input type="checkbox" {...form.register('isActive')} />
                Visible en tienda
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                variant="secondary"
                disabled={form.formState.isSubmitting}
              >
                {editingProduct ? 'Guardar cambios' : 'Crear producto'}
              </Button>

              {editingProduct ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (!confirmDiscardChanges()) {
                      return
                    }

                    if (hasUnsavedChanges()) {
                      discardDraftForCurrentMode()
                    }

                    setEditingProductId(null)
                    setSubmitError(null)
                    setSubmitSuccess(null)
                  }}
                >
                  Cancelar edición
                </Button>
              ) : null}
            </div>

            <p className="text-sm text-muted">
              {editingProduct
                ? 'Producto seleccionado. Podés guardar cambios y gestionar imágenes abajo.'
                : 'Primero guardá el producto. Después vas a poder subir imágenes.'}
            </p>
          </form>
        </Card>

        <Card className="space-y-5 border border-stone-900/8 bg-white/88">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-stone-950">Listado</p>
              <p className="text-sm text-muted">
                {products.length} producto{products.length === 1 ? '' : 's'} en la base.
              </p>
            </div>

            <Button type="button" variant="outline" onClick={() => void reloadPage()}>
              <RefreshCw className="h-4 w-4" />
              Recargar
            </Button>
          </div>

          <div className="space-y-3">
            {products.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-stone-900/10 bg-stone-50/80 px-4 py-8 text-sm text-muted">
                No hay productos cargados todavía.
              </div>
            ) : null}

            {products.map((product) => {
              const visible = isProductVisible(product)
              const isBusy = busyProductId === product.id
              const visibility = productVisibilityMeta(product)
              const discountPercent = getDiscountPercent(
                product.price,
                product.compare_at_price,
              )

              return (
                <div
                  key={product.id}
                  className="rounded-[24px] border border-stone-900/8 bg-stone-50/85 p-4"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold tracking-[-0.03em] text-stone-950">
                            {product.name}
                          </p>
                          <StatusBadge tone={visibility.tone}>
                            {visibility.label}
                          </StatusBadge>
                          <StatusBadge tone={adminAvailabilityTone(product.availability)}>
                            {formatAvailabilityLabel(product.availability)}
                          </StatusBadge>
                          {product.featured ? (
                            <StatusBadge tone="warning">Destacado</StatusBadge>
                          ) : null}
                          <StatusBadge tone="muted">
                            {(productImagesMap[product.id] ?? []).length} imagen
                            {(productImagesMap[product.id] ?? []).length === 1 ? '' : 'es'}
                          </StatusBadge>
                          {product.hasOrders ? (
                            <StatusBadge tone="muted">
                              {product.orderCount} pedido
                              {product.orderCount === 1 ? '' : 's'}
                            </StatusBadge>
                          ) : null}
                        </div>

                        <div className="grid gap-1 text-sm text-muted sm:grid-cols-2">
                          <p>Slug: {product.slug}</p>
                          <p>
                            Categoría: {product.categoryName ?? 'Sin categoría'}
                          </p>
                          <p>Precio actual: {formatCurrency(product.price)}</p>
                          <p>
                            Estado público: {product.is_active ? 'Activo' : 'Inactivo'}
                          </p>
                          {discountPercent ? (
                            <>
                              <p>
                                Antes: {formatCurrency(product.compare_at_price ?? 0)}
                              </p>
                              <p className="font-medium text-emerald-700">
                                {discountPercent}% OFF
                              </p>
                            </>
                          ) : product.compare_at_price ? (
                            <p>
                              Precio anterior: {formatCurrency(product.compare_at_price)}
                            </p>
                          ) : null}
                          <p>
                            Oferta visible: {discountPercent ? 'Sí' : 'No'}
                          </p>
                        </div>

                        <p className="text-sm leading-7 text-muted">
                          {product.description || 'Sin descripción.'}
                        </p>
                        <p className="text-sm leading-6 text-muted">
                          {visibility.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="shadow-none"
                          onClick={() => {
                            beginEditingProduct(product.id)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            beginEditingProduct(product.id, {
                              scrollToImages: true,
                            })
                          }
                        >
                          <ImagePlus className="h-4 w-4" />
                          Gestionar imágenes
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isBusy}
                          onClick={() =>
                            void updateProduct(
                              product.id,
                              { featured: !product.featured },
                              product.featured
                                ? 'Producto quitado de destacados.'
                                : 'Producto marcado como destacado.',
                            )
                          }
                        >
                          <Star className="h-4 w-4" />
                          {product.featured ? 'Quitar destacado' : 'Destacar'}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isBusy}
                          onClick={() =>
                            void updateProduct(
                              product.id,
                              visible
                                ? { is_active: false }
                                : {
                                    is_active: true,
                                    ...(product.availability === 'hidden'
                                      ? { availability: 'available' as const }
                                      : {}),
                                  },
                              visible
                                ? 'Producto retirado de la tienda. Sigue guardado en el panel.'
                                : 'Producto visible nuevamente en la tienda.',
                            )
                          }
                        >
                          {visible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          {visible ? 'Sacar de tienda' : 'Volver a mostrar'}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isBusy}
                          onClick={() => void handleDelete(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
                      <SelectField
                        label="Disponibilidad"
                        value={product.availability}
                        disabled={isBusy}
                        onChange={(event) =>
                          void updateProduct(
                            product.id,
                            {
                              availability: event.target.value as Availability,
                            },
                            `Disponibilidad actualizada a ${formatAvailabilityLabel(
                              event.target.value as Availability,
                            )}.`,
                          )
                        }
                      >
                        {availabilityOptions.map((availability) => (
                          <option key={availability} value={availability}>
                            {formatAvailabilityLabel(availability)}
                          </option>
                        ))}
                      </SelectField>

                      <div className="rounded-[20px] border border-stone-900/8 bg-white/82 px-4 py-3 text-sm text-muted">
                        {product.hasOrders
                          ? 'Este producto ya forma parte de pedidos guardados. No se borra físicamente: retíralo de la tienda o cambia su disponibilidad.'
                          : 'Sin pedidos asociados. Podés eliminarlo físicamente si ya no se necesita.'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div ref={imageManagerRef}>
        {editingProduct ? (
          <AdminProductImageManager
            product={editingProduct}
            images={editingProductImages}
            onRefresh={reloadPage}
          />
        ) : (
          <Card className="border border-stone-900/8 bg-white/88">
            <div className="space-y-3">
              <p className="text-sm font-medium text-stone-950">Imágenes del producto</p>
              <p className="text-sm leading-7 text-muted">
                Primero guardá el producto. Después vas a poder subir imágenes al bucket{' '}
                <code>product-images</code>, ordenar la galería y eliminar archivos.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
