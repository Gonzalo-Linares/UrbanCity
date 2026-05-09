import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Eye,
  EyeOff,
  Package,
  Pencil,
  RefreshCw,
  Star,
  Store,
  Trash2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
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

const defaultValues: AdminProductSchemaInput = {
  name: '',
  slug: '',
  description: '',
  price: 0,
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
  const [reloadKey, setReloadKey] = useState(0)
  const [busyProductId, setBusyProductId] = useState<string | null>(null)
  const editingProduct =
    products.find((product) => product.id === editingProductId) ?? null
  const editingProductImages = editingProduct
    ? productImagesMap[editingProduct.id] ?? []
    : []

  const form = useForm<
    AdminProductSchemaInput,
    undefined,
    AdminProductSchema
  >({
    resolver: zodResolver(adminProductSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(
      editingProduct
        ? {
            name: editingProduct.name,
            slug: editingProduct.slug,
            description: editingProduct.description ?? '',
            price: editingProduct.price,
            availability: editingProduct.availability,
            categoryId: editingProduct.category_id ?? '',
            featured: editingProduct.featured,
            isActive: editingProduct.is_active,
          }
        : defaultValues,
    )
  }, [editingProduct, form])

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

    setSubmitSuccess(
      editingProduct
        ? 'Producto actualizado correctamente.'
        : 'Producto creado correctamente. Ya puedes cargar imagenes.',
    )
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
        'No se puede eliminar el producto porque tiene pedidos asociados.',
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
          title="CRUD del catalogo comercial"
          description="Alta, edicion y ajustes operativos de precio, disponibilidad, destacado, visibilidad y categoria sin tocar pagos ni stock transaccional."
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
          description="Productos visibles para operacion comercial."
          icon={Eye}
        />
        <AdminMetricCard
          title="Vendibles"
          value={counts.productsSellable}
          description="Activos con disponibilidad available o inquiry."
          icon={Store}
        />
      </div>

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
              El slug se genera automaticamente si lo dejas vacio. La visibilidad
              usa `is_active`; la disponibilidad sigue siendo un estado separado.
            </p>
          </div>

          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <Input
              label="Nombre"
              placeholder="Ej: Box ritual ambar"
              error={form.formState.errors.name?.message}
              {...form.register('name')}
            />

            <Input
              label="Slug"
              placeholder="box-ritual-ambar"
              hint="Si queda vacio, se autogenera desde el nombre."
              error={form.formState.errors.slug?.message}
              {...form.register('slug')}
            />

            <Textarea
              label="Descripcion"
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

              <SelectField
                label="Disponibilidad"
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
              label="Categoria"
              error={form.formState.errors.categoryId?.message}
              {...form.register('categoryId')}
            >
              <option value="">Sin categoria</option>
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
                    setEditingProductId(null)
                    form.reset(defaultValues)
                  }}
                >
                  Cancelar edicion
                </Button>
              ) : null}
            </div>
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
                No hay productos cargados todavia.
              </div>
            ) : null}

            {products.map((product) => {
              const visible = isProductVisible(product)
              const isBusy = busyProductId === product.id

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
                          <StatusBadge tone={visible ? 'success' : 'muted'}>
                            {visible ? 'Visible' : 'Oculto'}
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
                            Categoria: {product.categoryName ?? 'Sin categoria'}
                          </p>
                          <p>Precio: {formatCurrency(product.price)}</p>
                          <p>
                            Estado publico: {product.is_active ? 'Activo' : 'Inactivo'}
                          </p>
                        </div>

                        <p className="text-sm leading-7 text-muted">
                          {product.description || 'Sin descripcion.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingProductId(product.id)
                            setSubmitError(null)
                            setSubmitSuccess(null)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
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
                                ? 'Producto ocultado.'
                                : 'Producto visible nuevamente.',
                            )
                          }
                        >
                          {visible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          {visible ? 'Ocultar' : 'Mostrar'}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isBusy || product.hasOrders}
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
                            'Disponibilidad actualizada.',
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
                          ? 'No se permite eliminacion fisica porque el producto ya aparece en pedidos.'
                          : 'Sin pedidos asociados. El producto se puede eliminar fisicamente si ya no se necesita.'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {editingProduct ? (
        <AdminProductImageManager
          product={editingProduct}
          images={editingProductImages}
          onRefresh={reloadPage}
        />
      ) : (
        <Card className="border border-stone-900/8 bg-white/88">
          <div className="space-y-3">
            <p className="text-sm font-medium text-stone-950">Imagenes del producto</p>
            <p className="text-sm leading-7 text-muted">
              Guarda o selecciona un producto existente para subir imagenes al
              bucket <code>product-images</code>, ordenar su galeria y eliminar
              archivos.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
