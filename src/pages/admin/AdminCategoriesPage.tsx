import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronDown,
  ChevronUp,
  Layers3,
  Pencil,
  Power,
  Tag,
  Tags,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { AdminMetricCard } from '@/components/admin/AdminMetricCard'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/LoadingState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Textarea } from '@/components/ui/Textarea'
import { useAdminOutletData } from '@/hooks/useAdminShellData'
import { formatCrudError, resolveSlug, toNullableText } from '@/lib/admin'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  adminCategorySchema,
  type AdminCategorySchema,
} from '@/schemas/adminCategory'
import type { CategoryRow } from '@/types/database'

interface CategoryListItem extends CategoryRow {
  productCount: number
}

const defaultValues: AdminCategorySchema = {
  name: '',
  slug: '',
  description: '',
}

export function AdminCategoriesPage() {
  const { counts, loading, refresh } = useAdminOutletData()
  const [categories, setCategories] = useState<CategoryListItem[]>([])
  const [listLoading, setListLoading] = useState(isSupabaseConfigured)
  const [pageError, setPageError] = useState<string | null>(
    isSupabaseConfigured ? null : 'Configura Supabase para administrar categorías.',
  )
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<CategoryListItem | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyCategoryId, setBusyCategoryId] = useState<string | null>(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)
  const categoryFormRef = useRef<HTMLDivElement | null>(null)
  const categoryListRef = useRef<HTMLDivElement | null>(null)

  const form = useForm<AdminCategorySchema>({
    resolver: zodResolver(adminCategorySchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(
      editingCategory
        ? {
            name: editingCategory.name,
            slug: editingCategory.slug,
            description: editingCategory.description ?? '',
          }
        : defaultValues,
    )
  }, [editingCategory, form])

  useEffect(() => {
    if (!supabase) {
      return
    }

    const client = supabase
    let ignore = false

    async function loadCategories() {
      setListLoading(true)
      setPageError(null)

      const [categoriesResult, productsResult] = await Promise.all([
        client.from('categories').select('*').order('created_at', { ascending: false }),
        client.from('products').select('category_id'),
      ])

      if (ignore) {
        return
      }

      if (categoriesResult.error || productsResult.error) {
        setPageError('No se pudieron cargar las categorías desde Supabase.')
        setListLoading(false)
        return
      }

      const productCountMap = new Map<string, number>()

      for (const product of productsResult.data ?? []) {
        if (!product.category_id) {
          continue
        }

        productCountMap.set(
          product.category_id,
          (productCountMap.get(product.category_id) ?? 0) + 1,
        )
      }

      setCategories(
        (categoriesResult.data ?? []).map((category) => ({
          ...category,
          productCount: productCountMap.get(category.id) ?? 0,
        })),
      )
      setListLoading(false)
    }

    void loadCategories()

    return () => {
      ignore = true
    }
  }, [reloadKey])

  if (loading || listLoading) {
    return <LoadingState label="Cargando categorías..." />
  }

  function scrollToCategoryForm() {
    requestAnimationFrame(() =>
      categoryFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  function scrollToCategoryList() {
    requestAnimationFrame(() =>
      categoryListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  function startNewCategory() {
    setEditingCategory(null)
    setExpandedCategoryId(null)
    form.reset(defaultValues)
    setSubmitError(null)
    setSubmitSuccess(null)
    setShowCategoryForm(true)
    scrollToCategoryForm()
  }

  async function reloadPage() {
    setReloadKey((current) => current + 1)
    refresh()
  }

  async function handleSubmit(values: AdminCategorySchema) {
    if (!supabase) {
      setSubmitError('Configura Supabase para administrar categorías.')
      return
    }

    setSubmitError(null)
    setSubmitSuccess(null)

    const payload = {
      name: values.name.trim(),
      slug: resolveSlug(values.name, values.slug),
      description: toNullableText(values.description ?? ''),
    }

    const result = editingCategory
      ? await supabase.from('categories').update(payload).eq('id', editingCategory.id)
      : await supabase.from('categories').insert({
          ...payload,
          is_active: true,
        })

    if (result.error) {
      setSubmitError(formatCrudError(result.error.message, result.error.code))
      return
    }

    setSubmitSuccess(
      editingCategory
        ? `Categoría "${values.name.trim()}" actualizada correctamente.`
        : `Categoría "${values.name.trim()}" creada correctamente.`,
    )
    setEditingCategory(null)
    setExpandedCategoryId(null)
    form.reset(defaultValues)
    setShowCategoryForm(false)
    await reloadPage()
  }

  async function toggleCategory(category: CategoryListItem) {
    if (!supabase) {
      return
    }

    setBusyCategoryId(category.id)
    setSubmitError(null)
    setSubmitSuccess(null)

    const { error } = await supabase
      .from('categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id)

    setBusyCategoryId(null)

    if (error) {
      setSubmitError(formatCrudError(error.message, error.code))
      return
    }

    setSubmitSuccess(
      category.is_active
        ? `Categoría "${category.name}" desactivada.`
        : `Categoría "${category.name}" activada nuevamente.`,
    )
    await reloadPage()
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <AdminPageHeader
        eyebrow="Categorías"
        title="Creá y editá las categorías del catálogo"
        description="Organizá el catálogo."
        hideDescriptionOnMobile
        variant="compact"
      />

      <Card className="border border-white/10 bg-[#111111] p-3 text-white shadow-none sm:p-4 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-full px-3 text-sm sm:w-auto sm:px-5"
            onClick={startNewCategory}
          >
            Nueva categoría
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full px-3 text-sm sm:w-auto sm:px-5"
            onClick={scrollToCategoryList}
          >
            Ver listado
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <AdminMetricCard title="Total" value={counts.categoriesTotal} description="Cargadas" icon={Tags} />
        <AdminMetricCard title="Activas" value={counts.categoriesActive} description="Visibles" icon={Tag} />
        <AdminMetricCard
          title="Inactivas"
          value={Math.max(counts.categoriesTotal - counts.categoriesActive, 0)}
          description="A revisar"
          icon={Layers3}
        />
      </div>

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
        {showCategoryForm ? (
          <Card
            ref={categoryFormRef}
            className="border border-white/10 bg-[#111111] p-3.5 text-white shadow-none sm:p-6 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-white">
                  {editingCategory ? 'Editar categoría' : 'Nueva categoría'}
                </p>
              </div>

              <form
                className="space-y-4 [&_label>span]:text-white [&_label>p]:text-white/54 [&_input]:border-white/10 [&_input]:bg-[#0d0d0d] [&_input]:text-white [&_input]:placeholder:text-white/32 [&_textarea]:border-white/10 [&_textarea]:bg-[#0d0d0d] [&_textarea]:text-white [&_textarea]:placeholder:text-white/32"
                onSubmit={form.handleSubmit(handleSubmit)}
              >
                <Input
                  label="Nombre"
                  placeholder="Ej: Sneakers, Urbanas o Accesorios"
                  error={form.formState.errors.name?.message}
                  {...form.register('name')}
                />

                <Input
                  label="Slug"
                  placeholder="sneakers"
                  hint="Se genera solo si lo dejás vacío."
                  error={form.formState.errors.slug?.message}
                  {...form.register('slug')}
                />

                <Textarea
                  label="Descripción"
                  placeholder="Breve referencia interna u orientativa."
                  error={form.formState.errors.description?.message}
                  {...form.register('description')}
                />

                <div className="flex flex-wrap gap-2.5">
                  <Button type="submit" variant="secondary" disabled={form.formState.isSubmitting}>
                    {editingCategory ? 'Guardar cambios' : 'Crear categoría'}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="text-white/72 hover:bg-white/8 hover:text-white"
                    onClick={() => {
                      setEditingCategory(null)
                      setExpandedCategoryId(null)
                      setShowCategoryForm(false)
                      form.reset(defaultValues)
                    }}
                  >
                    {editingCategory ? 'Cancelar edición' : 'Cerrar formulario'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        ) : null}

        <Card
          ref={categoryListRef}
          className="space-y-4 border border-white/10 bg-[#111111] p-3.5 text-white shadow-none sm:p-6 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">Listado</p>
              <p className="text-sm text-white/58">
                {categories.length} categoría{categories.length === 1 ? '' : 's'} cargadas.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {categories.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-white/12 bg-black/20 px-4 py-6 text-sm text-white/58">
                Todavía no hay categorías cargadas.
              </div>
            ) : null}

            {categories.map((category) => {
              const isExpanded = expandedCategoryId === category.id

              return (
                <div
                  key={category.id}
                  className="rounded-[18px] border border-white/10 bg-black/20 p-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-base font-semibold tracking-[-0.03em] text-white">
                          {category.name}
                        </p>
                        <p className="text-sm text-white/58">
                          {category.productCount} producto{category.productCount === 1 ? '' : 's'}
                        </p>
                      </div>

                      <StatusBadge tone={category.is_active ? 'success' : 'muted'}>
                        {category.is_active ? 'Activa' : 'Inactiva'}
                      </StatusBadge>
                    </div>

                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] gap-2 sm:flex sm:flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full min-w-0 gap-1.5 border-white/12 px-2 text-sm text-white hover:border-white/20 hover:bg-white/8 sm:w-auto sm:px-3"
                        onClick={() => {
                          setEditingCategory(category)
                          setExpandedCategoryId(category.id)
                          setSubmitError(null)
                          setSubmitSuccess(null)
                          setShowCategoryForm(true)
                          scrollToCategoryForm()
                        }}
                      >
                        <Pencil className="h-4 w-4 shrink-0" />
                        Editar
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full min-w-0 gap-1.5 px-2 text-sm text-white/72 hover:bg-white/8 hover:text-white sm:w-auto sm:px-3"
                        onClick={() => void toggleCategory(category)}
                        disabled={busyCategoryId === category.id}
                      >
                        <Power className="h-4 w-4 shrink-0" />
                        {category.is_active ? 'Desactivar' : 'Activar'}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        className="h-11 w-11 min-w-0 px-0 text-white/72 hover:bg-white/8 hover:text-white sm:h-auto sm:w-auto sm:px-3"
                        onClick={() =>
                          setExpandedCategoryId((current) =>
                            current === category.id ? null : category.id,
                          )
                        }
                        aria-label={isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        <span className="hidden sm:inline">{isExpanded ? 'Ocultar' : 'Detalle'}</span>
                      </Button>
                    </div>

                    {isExpanded ? (
                      <div className="space-y-2 border-t border-white/10 pt-3 text-sm text-white/58">
                        <p>Slug: {category.slug}</p>
                        <p>{category.description || 'Sin descripción.'}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
