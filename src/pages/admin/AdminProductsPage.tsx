import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Eye,
  EyeOff,
  ImagePlus,
  Package,
  Pencil,
  Star,
  Store,
  Trash2,
} from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminProductImageManager } from '@/components/admin/AdminProductImageManager'
import { AdminMetricCard } from '@/components/admin/AdminMetricCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/LoadingState'
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
  type AdminProductSchema,
  type AdminProductSchemaInput,
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
      label: 'Oculto',
      tone: 'muted' as const,
      description: 'No aparece en la tienda, pero sigue guardado.',
    }
  }

  if (product.availability === 'hidden') {
    return {
      label: 'Oculto',
      tone: 'muted' as const,
      description: 'Está cargado, pero no se muestra en la tienda.',
    }
  }

  return {
    label: 'Visible',
    tone: 'success' as const,
    description: 'Se muestra en la tienda según la disponibilidad.',
  }
}

function buildDraftKey(productId: string | null) {
  return productId ? `${editingProductDraftKeyPrefix}${productId}` : newProductDraftKey
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

function normalizeProductDraftValues(values: AdminProductSchemaInput) {
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

  window.localStorage.setItem(key, JSON.stringify(normalizeProductDraftValues(values)))
}

function clearProductDraft(key: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(key)
}

function areProductDraftsEqual(left: AdminProductSchemaInput, right: AdminProductSchemaInput) {
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
  const [productImagesMap, setProductImagesMap] = useState<Record<string, ProductImageRow[]>>(
    {},
  )
  const [pageLoading, setPageLoading] = useState(isSupabaseConfigured)
  const [pageError, setPageError] = useState<string | null>(
    isSupabaseConfigured ? null : 'Configura Supabase para administrar productos.',
  )
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyProductId, setBusyProductId] = useState<string | null>(null)
  const [showProductGuide, setShowProductGuide] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)
  const imageManagerRef = useRef<HTMLDivElement | null>(null)
  const productFormRef = useRef<HTMLDivElement | null>(null)
  const productListRef = useRef<HTMLDivElement | null>(null)
  const baseValuesRef = useRef<AdminProductSchemaInput>(defaultValues)
  const lastHydratedSignatureRef = useRef<string | null>(null)
  const pendingImageScrollRef = useRef(false)
  const editingProduct = products.find((product) => product.id === editingProductId) ?? null
  const editingProductImages = editingProduct ? productImagesMap[editingProduct.id] ?? [] : []
  const isEditingProductReady = Boolean(editingProduct)
  const currentDraftKey = buildDraftKey(editingProductId)

  const form = useForm<AdminProductSchemaInput, undefined, AdminProductSchema>({
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
    form.reset(recoveredDraft ? { ...modeBaseValues, ...recoveredDraft } : modeBaseValues)
    lastHydratedSignatureRef.current = hydrationSignature
  }, [currentDraftKey, editingProduct, editingProductId, form])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentValues = form.getValues()

      if (areProductDraftsEqual(currentValues, baseValuesRef.current)) {
        clearProductDraft(currentDraftKey)
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

      const [categoriesResult, productsResult, orderItemsResult, productImagesResult] =
        await Promise.all([
          client.from('categories').select('*').order('name', { ascending: true }),
          client.from('products').select('*').order('created_at', { ascending: false }),
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

        orderCountMap.set(item.product_id, (orderCountMap.get(item.product_id) ?? 0) + 1)
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
  }

  function confirmDiscardChanges() {
    if (!hasUnsavedChanges() || typeof window === 'undefined') {
      return true
    }

    return window.confirm('Tenés cambios sin guardar. ¿Querés descartarlos?')
  }

  function scrollToProductForm() {
    requestAnimationFrame(() =>
      productFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  function scrollToProductList() {
    requestAnimationFrame(() =>
      productListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  function startNewProduct() {
    if (editingProductId && !confirmDiscardChanges()) {
      return
    }

    if (editingProductId && hasUnsavedChanges()) {
      discardDraftForCurrentMode()
    }

    setEditingProductId(null)
    setExpandedProductId(null)
    setShowProductForm(true)
    setSubmitError(null)
    setSubmitSuccess(null)
    scrollToProductForm()
  }

  function beginEditingProduct(productId: string, options?: { scrollToImages?: boolean }) {
    const nextProductId = productId

    if (nextProductId !== editingProductId && !confirmDiscardChanges()) {
      return
    }

    if (nextProductId !== editingProductId && hasUnsavedChanges()) {
      discardDraftForCurrentMode()
    }

    setSubmitError(null)
    setSubmitSuccess(null)
    setExpandedProductId(productId)

    if (options?.scrollToImages) {
      pendingImageScrollRef.current = true
    }

    setShowProductForm(true)

    if (nextProductId === editingProductId) {
      if (options?.scrollToImages && imageManagerRef.current) {
        imageManagerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        scrollToProductForm()
      }
      return
    }

    setEditingProductId(nextProductId)

    if (!options?.scrollToImages) {
      scrollToProductForm()
    }
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
    setEditingProductId(createdOrUpdatedProduct.id)
    setExpandedProductId(createdOrUpdatedProduct.id)
    setShowProductForm(true)
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

    const { error } = await supabase.from('products').update(updates).eq('id', productId)

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
        `"${product.name}" no se puede eliminar porque ya aparece en ${product.orderCount} pedido${product.orderCount === 1 ? '' : 's'}. Si necesitás retirarlo de la tienda, dejalo oculto.`,
      )
      return
    }

    if (typeof window !== 'undefined' && !window.confirm(`Eliminar definitivamente "${product.name}"?`)) {
      return
    }

    setBusyProductId(product.id)
    setSubmitError(null)
    setSubmitSuccess(null)

    const imagePaths = (productImagesMap[product.id] ?? [])
      .map((image) => extractStorageObjectPathFromPublicUrl(image.url, productImagesBucket))
      .filter((path): path is string => Boolean(path))

    if (imagePaths.length > 0) {
      const removeResult = await supabase.storage.from(productImagesBucket).remove(imagePaths)

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
      setShowProductForm(false)
      form.reset(defaultValues)
    }

    if (expandedProductId === product.id) {
      setExpandedProductId(null)
    }

    setSubmitSuccess('Producto eliminado correctamente.')
    await reloadPage()
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <AdminPageHeader
        eyebrow="Productos"
        title="Cargá, editá y organizá los productos"
        description="Cargá productos, precios, ofertas e imágenes."
        hideDescriptionOnMobile
        variant="compact"
      />

      <Card className="border border-white/10 bg-[#111111] p-3 text-white shadow-none sm:p-4 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-full px-3 text-sm sm:w-auto sm:px-5"
            onClick={startNewProduct}
          >
            Nuevo producto
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full px-3 text-sm sm:w-auto sm:px-5"
            onClick={scrollToProductList}
          >
            Ver listado
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <AdminMetricCard
          title="Total"
          value={counts.productsTotal}
          description="Cargados"
          icon={Package}
        />
        <AdminMetricCard
          title="Activos"
          value={counts.productsActive}
          description="Visibles"
          icon={Eye}
        />
        <AdminMetricCard
          title="Vendibles"
          value={counts.productsSellable}
          description="Listos"
          icon={Store}
        />
      </div>

      <Card className="space-y-3 border border-white/10 bg-[#111111] p-3.5 text-white shadow-none sm:p-5 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-black/20 text-white">
              <CircleHelp className="h-4 w-4" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-white">Guía rápida</p>
              <p className="text-xs leading-5 text-white/60 sm:text-sm sm:leading-6">
                Cómo se muestra un producto en la tienda.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="shrink-0 px-3 text-white/72 hover:bg-white/8 hover:text-white"
            onClick={() => setShowProductGuide((current) => !current)}
          >
            {showProductGuide ? 'Ocultar' : 'Ver guía'}
          </Button>
        </div>

        {showProductGuide ? (
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['Visible', 'Se ve en la tienda.'],
              ['Oculto', 'No se muestra, pero sigue guardado.'],
              ['Disponible', 'Se puede pedir normalmente.'],
              ['Consultar', 'Se confirma por WhatsApp.'],
              ['Sin stock', 'Se informa que hoy no está disponible.'],
              ['Destacado', 'Tiene prioridad en la tienda.'],
            ].map(([title, copy]) => (
              <div
                key={title}
                className="rounded-[18px] border border-white/10 bg-black/20 p-3"
              >
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="mt-1.5 text-xs leading-5 text-white/56 sm:text-sm sm:leading-6">
                  {copy}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      {pageError ? (
        <div className="rounded-[18px] border border-rose-500/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {pageError}
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-[18px] border border-rose-500/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {submitError}
        </div>
      ) : null}

      {submitSuccess ? (
        <div className="rounded-[18px] border border-emerald-500/18 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {submitSuccess}
        </div>
      ) : null}

      <div className="space-y-5">
        {showProductForm ? (
          <Card
            ref={productFormRef}
            className="border border-white/10 bg-[#111111] p-3.5 text-white shadow-none sm:p-6 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-white">
                  {editingProduct ? 'Editar producto' : 'Nuevo producto'}
                </p>
              </div>

              <form
                className="space-y-4 [&_label>span]:text-white [&_label>p]:text-white/54 [&_input]:border-white/10 [&_input]:bg-[#0d0d0d] [&_input]:text-white [&_input]:placeholder:text-white/32 [&_select]:border-white/10 [&_select]:bg-[#0d0d0d] [&_select]:text-white [&_textarea]:border-white/10 [&_textarea]:bg-[#0d0d0d] [&_textarea]:text-white [&_textarea]:placeholder:text-white/32"
                onSubmit={(event) => {
                  void form.handleSubmit(handleSubmit)(event)
                }}
              >
                <Input
                  label="Nombre"
                  placeholder="Ej: Nike Air Max o zapatilla urbana"
                  error={form.formState.errors.name?.message}
                  {...form.register('name')}
                />

                <Input
                  label="Slug"
                  placeholder="nike-air-max"
                  hint="Se genera solo si lo dejás vacío."
                  error={form.formState.errors.slug?.message}
                  {...form.register('slug')}
                />

                <Textarea
                  label="Descripción"
                  placeholder="Describe el modelo, materiales o estilo."
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
                    hint="Opcional. Si es mayor al actual, se muestra como oferta."
                    error={form.formState.errors.compareAtPrice?.message}
                    {...form.register('compareAtPrice')}
                  />
                </div>

                <SelectField
                  label="Disponibilidad"
                  hint="Disponible, consultar, sin stock u oculto."
                  error={form.formState.errors.availability?.message}
                  {...form.register('availability')}
                >
                  {availabilityOptions.map((availability) => (
                    <option key={availability} value={availability}>
                      {formatAvailabilityLabel(availability)}
                    </option>
                  ))}
                </SelectField>

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
                  <label className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white">
                    <input type="checkbox" {...form.register('featured')} />
                    Marcar como destacado
                  </label>
                  <label className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white">
                    <input type="checkbox" {...form.register('isActive')} />
                    Visible en tienda
                  </label>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Button type="submit" variant="secondary" disabled={form.formState.isSubmitting}>
                    {editingProduct ? 'Guardar cambios' : 'Crear producto'}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="text-white/72 hover:bg-white/8 hover:text-white"
                    onClick={() => {
                      if (editingProduct && !confirmDiscardChanges()) {
                        return
                      }

                      if (editingProduct && hasUnsavedChanges()) {
                        discardDraftForCurrentMode()
                      }

                      setEditingProductId(null)
                      setShowProductForm(false)
                      setSubmitError(null)
                      setSubmitSuccess(null)
                      scrollToProductList()
                    }}
                  >
                    {editingProduct ? 'Cancelar edición' : 'Cerrar formulario'}
                  </Button>
                </div>

                <p className="text-sm text-white/54">
                  {editingProduct
                    ? 'Producto seleccionado. Podés guardar cambios y gestionar imágenes abajo.'
                    : 'Primero guardá el producto. Después vas a poder subir imágenes.'}
                </p>
              </form>
            </div>
          </Card>
        ) : null}

        <Card
          ref={productListRef}
          className="space-y-4 border border-white/10 bg-[#111111] p-3.5 text-white shadow-none sm:p-6 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">Listado</p>
              <p className="text-sm text-white/58">
                {products.length} producto{products.length === 1 ? '' : 's'} cargados.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {products.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-white/12 bg-black/20 px-4 py-6 text-sm text-white/58">
                No hay productos cargados todavía.
              </div>
            ) : null}

            {products.map((product) => {
              const visible = isProductVisible(product)
              const isBusy = busyProductId === product.id
              const visibility = productVisibilityMeta(product)
              const discountPercent = getDiscountPercent(product.price, product.compare_at_price)
              const isExpanded = expandedProductId === product.id

              return (
                <div
                  key={product.id}
                  className="rounded-[18px] border border-white/10 bg-black/20 p-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-base font-semibold tracking-[-0.03em] text-white">
                          {product.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-white/58">
                          <span>{formatCurrency(product.price)}</span>
                          <span>•</span>
                          <span className="truncate">{product.categoryName ?? 'Sin categoría'}</span>
                        </div>
                      </div>

                      <StatusBadge tone={visibility.tone}>{visibility.label}</StatusBadge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={adminAvailabilityTone(product.availability)}>
                        {formatAvailabilityLabel(product.availability)}
                      </StatusBadge>
                      {product.featured ? <StatusBadge tone="warning">Destacado</StatusBadge> : null}
                      <StatusBadge tone="muted">
                        {(productImagesMap[product.id] ?? []).length} imagen
                        {(productImagesMap[product.id] ?? []).length === 1 ? '' : 'es'}
                      </StatusBadge>
                    </div>

                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] gap-2 sm:flex sm:flex-wrap">
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full min-w-0 gap-1.5 px-2 text-sm sm:w-auto sm:px-3"
                        onClick={() => beginEditingProduct(product.id)}
                      >
                        <Pencil className="h-4 w-4 shrink-0" />
                        Editar
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full min-w-0 gap-1.5 border-white/12 px-2 text-sm text-white hover:border-white/20 hover:bg-white/8 sm:w-auto sm:px-3"
                        onClick={() => beginEditingProduct(product.id, { scrollToImages: true })}
                      >
                        <ImagePlus className="h-4 w-4 shrink-0" />
                        Fotos
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        className="h-11 w-11 min-w-0 px-0 text-white/72 hover:bg-white/8 hover:text-white sm:h-auto sm:w-auto sm:px-3"
                        onClick={() =>
                          setExpandedProductId((current) =>
                            current === product.id ? null : product.id,
                          )
                        }
                        aria-label={isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        <span className="hidden sm:inline">{isExpanded ? 'Ocultar' : 'Detalle'}</span>
                      </Button>
                    </div>

                    {isExpanded ? (
                      <div className="space-y-3 border-t border-white/10 pt-3">
                        <div className="grid gap-2 text-sm text-white/58 sm:grid-cols-2">
                          <p>Slug: {product.slug}</p>
                          <p>Visible en tienda: {visible ? 'Sí' : 'No'}</p>
                          {discountPercent ? (
                            <>
                              <p>Antes: {formatCurrency(product.compare_at_price ?? 0)}</p>
                              <p className="font-medium text-brand-strong">{discountPercent}% OFF</p>
                            </>
                          ) : product.compare_at_price ? (
                            <p>Precio anterior: {formatCurrency(product.compare_at_price)}</p>
                          ) : null}
                        </div>

                        <p className="text-sm leading-6 text-white/58">
                          {product.description || 'Sin descripción.'}
                        </p>
                        <p className="text-sm leading-6 text-white/54">{visibility.description}</p>

                        <div className="[&_label>span]:text-white [&_label>p]:text-white/54 [&_select]:border-white/10 [&_select]:bg-[#0d0d0d] [&_select]:text-white">
                          <SelectField
                            label="Disponibilidad"
                            value={product.availability}
                            disabled={isBusy}
                            onChange={(event) =>
                              void updateProduct(
                                product.id,
                                { availability: event.target.value as Availability },
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
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-white/72 hover:bg-white/8 hover:text-white"
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
                            className="text-white/72 hover:bg-white/8 hover:text-white"
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
                                  ? 'Producto retirado de la tienda.'
                                  : 'Producto visible nuevamente en la tienda.',
                              )
                            }
                          >
                            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            {visible ? 'Ocultar' : 'Mostrar'}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            className="text-white/72 hover:bg-white/8 hover:text-white"
                            disabled={isBusy}
                            onClick={() => void handleDelete(product)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>

                        <div className="rounded-[16px] border border-white/10 bg-[#0d0d0d] px-4 py-3 text-sm text-white/54">
                          {product.hasOrders
                            ? 'Este producto ya aparece en pedidos. Si no querés venderlo, ocultalo o cambiale la disponibilidad.'
                            : 'Sin pedidos asociados. Podés eliminarlo si ya no lo necesitás.'}
                        </div>
                      </div>
                    ) : null}
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
          <Card className="border border-white/10 bg-[#111111] p-4 text-white shadow-none sm:p-6 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Imágenes del producto</p>
              <p className="text-sm leading-6 text-white/60">
                Primero guardá un producto. Después vas a poder subir y ordenar imágenes.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
