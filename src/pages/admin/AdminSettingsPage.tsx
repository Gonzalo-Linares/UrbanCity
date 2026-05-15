import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
  ImagePlus,
  MessageCircle,
  Plus,
  Save,
  Store,
  Upload,
} from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/LoadingState'
import { Textarea } from '@/components/ui/Textarea'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { useAdminOutletData } from '@/hooks/useAdminShellData'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import {
  adminImageAllowedMimeTypes,
  adminImageBucket,
  adminImageMaxSizeBytes,
  buildHeroSlideImageObjectPath,
  formatFileSize,
  formatBytesAsMb,
  formatCrudError,
  optimizeImageFile,
  toNullableText,
  validateImageMimeType,
  validateImageSize,
} from '@/lib/admin'
import { cn } from '@/lib/cn'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { buildWhatsAppUrl, normalizeWhatsAppPhone } from '@/lib/whatsapp'
import {
  adminStoreSettingsSchema,
  type AdminStoreSettingsSchema,
} from '@/schemas/adminStoreSettings'
import type { HomeHeroSlideRow, StoreSettingsRow } from '@/types/database'

const defaultValues: AdminStoreSettingsSchema = {
  storeName: '',
  whatsappPhone: '',
  instagramUrl: '',
  address: '',
  openingHours: '',
  checkoutMessage: '',
}

const maxHeroSlides = 5

interface HeroSlideDraft {
  eyebrow: string
  title: string
  subtitle: string
  description: string
  imageAlt: string
  sortOrder: string
  isActive: boolean
}

function toFormValues(storeSettings: StoreSettingsRow | null): AdminStoreSettingsSchema {
  if (!storeSettings) {
    return defaultValues
  }

  return {
    storeName: storeSettings.store_name,
    whatsappPhone: storeSettings.whatsapp_phone,
    instagramUrl: storeSettings.instagram_url ?? '',
    address: storeSettings.address ?? '',
    openingHours: storeSettings.opening_hours ?? '',
    checkoutMessage: storeSettings.checkout_message ?? '',
  }
}

function sortHeroSlides(slides: HomeHeroSlideRow[]) {
  return [...slides].sort((left, right) => {
    if (left.sort_order !== right.sort_order) {
      return left.sort_order - right.sort_order
    }

    return left.created_at.localeCompare(right.created_at)
  })
}

function toHeroSlideDraft(slide: HomeHeroSlideRow): HeroSlideDraft {
  return {
    eyebrow: slide.eyebrow,
    title: slide.title,
    subtitle: slide.subtitle ?? '',
    description: slide.description ?? '',
    imageAlt: slide.image_alt ?? '',
    sortOrder: String(slide.sort_order),
    isActive: slide.is_active,
  }
}

function buildHeroSlidePlaceholderUrl(title: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
      <rect width="1200" height="720" fill="#101010" />
      <rect x="32" y="32" width="1136" height="656" rx="36" fill="#171717" stroke="#2a2a2a" />
      <text x="600" y="322" fill="#f4f4f5" font-size="64" font-family="Arial, sans-serif" text-anchor="middle">${title}</text>
      <text x="600" y="400" fill="#b6ff00" font-size="28" font-family="Arial, sans-serif" text-anchor="middle">Reemplazá esta imagen desde el panel</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function AdminSettingsPage() {
  const { loading, refresh, storeSettings } = useAdminOutletData()
  const { refresh: refreshStorefront } = useStorefrontData()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [heroSlides, setHeroSlides] = useState<HomeHeroSlideRow[]>([])
  const [heroSlidesLoading, setHeroSlidesLoading] = useState(isSupabaseConfigured)
  const [heroSlidesError, setHeroSlidesError] = useState<string | null>(null)
  const [heroSlidesSuccess, setHeroSlidesSuccess] = useState<string | null>(null)
  const [expandedSlideId, setExpandedSlideId] = useState<string | null>(null)
  const [heroSlideDrafts, setHeroSlideDrafts] = useState<Record<string, HeroSlideDraft>>({})
  const [heroSlideBusyId, setHeroSlideBusyId] = useState<string | null>(null)
  const [heroSlideUploadId, setHeroSlideUploadId] = useState<string | null>(null)
  const [heroSlideUploadStatus, setHeroSlideUploadStatus] = useState<string | null>(null)

  const form = useForm<AdminStoreSettingsSchema>({
    resolver: zodResolver(adminStoreSettingsSchema),
    defaultValues,
  })

  async function loadHeroSlides() {
    if (!supabase || !isSupabaseConfigured) {
      return
    }

    setHeroSlidesLoading(true)
    setHeroSlidesError(null)

    const result = await supabase
      .from('home_hero_slides')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (result.error) {
      setHeroSlides([])
      setHeroSlidesLoading(false)
      setHeroSlidesError(formatCrudError(result.error.message, result.error.code))
      return
    }

    const nextSlides = sortHeroSlides(result.data ?? [])
    setHeroSlides(nextSlides)
    setHeroSlideDrafts(
      Object.fromEntries(nextSlides.map((slide) => [slide.id, toHeroSlideDraft(slide)])),
    )
    setHeroSlidesLoading(false)
  }

  useEffect(() => {
    form.reset(toFormValues(storeSettings))
  }, [form, storeSettings])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void loadHeroSlides()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const storeNameValue = useWatch({
    control: form.control,
    name: 'storeName',
    defaultValue: defaultValues.storeName,
  })
  const whatsappPhoneValue = useWatch({
    control: form.control,
    name: 'whatsappPhone',
    defaultValue: defaultValues.whatsappPhone,
  })
  const instagramUrlValue = useWatch({
    control: form.control,
    name: 'instagramUrl',
    defaultValue: defaultValues.instagramUrl,
  })
  const addressValue = useWatch({
    control: form.control,
    name: 'address',
    defaultValue: defaultValues.address,
  })
  const openingHoursValue = useWatch({
    control: form.control,
    name: 'openingHours',
    defaultValue: defaultValues.openingHours,
  })
  const checkoutMessageValue = useWatch({
    control: form.control,
    name: 'checkoutMessage',
    defaultValue: defaultValues.checkoutMessage,
  })

  const normalizedWhatsAppPhone = useMemo(
    () => normalizeWhatsAppPhone(whatsappPhoneValue ?? ''),
    [whatsappPhoneValue],
  )

  const previewStoreName = (storeNameValue ?? '').trim() || 'Comercio sin nombre'
  const previewWhatsAppUrl =
    !form.formState.errors.whatsappPhone && normalizedWhatsAppPhone.length >= 8
      ? buildWhatsAppUrl(
          normalizedWhatsAppPhone,
          `Hola ${previewStoreName}, quiero hacer una consulta.`,
        )
      : null
  const previewInstagramUrl = form.formState.errors.instagramUrl
    ? null
    : (instagramUrlValue ?? '').trim() || null

  const canCreateHeroSlide = heroSlides.length < maxHeroSlides

  function replaceHeroSlide(
    savedSlide: HomeHeroSlideRow,
    options?: { syncDraft?: boolean },
  ) {
    setHeroSlides((current) => {
      const nextSlides = current.some((slide) => slide.id === savedSlide.id)
        ? current.map((slide) => (slide.id === savedSlide.id ? savedSlide : slide))
        : [...current, savedSlide]

      return sortHeroSlides(nextSlides)
    })

    if (options?.syncDraft === false) {
      return
    }

    setHeroSlideDrafts((current) => ({
      ...current,
      [savedSlide.id]: toHeroSlideDraft(savedSlide),
    }))
  }

  function updateHeroSlideDraft(
    slideId: string,
    patch: Partial<HeroSlideDraft>,
  ) {
    setHeroSlideDrafts((current) => ({
      ...current,
      [slideId]: {
        ...(current[slideId] ?? {
          eyebrow: '',
          title: '',
          subtitle: '',
          description: '',
          imageAlt: '',
          sortOrder: '0',
          isActive: false,
        }),
        ...patch,
      },
    }))
  }

  async function handleSubmit(values: AdminStoreSettingsSchema) {
    if (!supabase || !isSupabaseConfigured) {
      setSubmitError('Configurá Supabase para editar los datos de la tienda.')
      return
    }

    setSubmitError(null)
    setSubmitSuccess(null)

    const payload = {
      store_name: values.storeName.trim(),
      whatsapp_phone: normalizeWhatsAppPhone(values.whatsappPhone),
      instagram_url: toNullableText(values.instagramUrl ?? ''),
      address: toNullableText(values.address ?? ''),
      opening_hours: toNullableText(values.openingHours ?? ''),
      checkout_message: toNullableText(values.checkoutMessage ?? ''),
    }

    const existingSettingsResult = await supabase
      .from('store_settings')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (existingSettingsResult.error) {
      setSubmitError(
        formatCrudError(
          existingSettingsResult.error.message,
          existingSettingsResult.error.code,
        ),
      )
      return
    }

    const currentSettingsId = existingSettingsResult.data?.id ?? null
    const result = currentSettingsId
      ? await supabase.from('store_settings').update(payload).eq('id', currentSettingsId)
      : await supabase.from('store_settings').insert(payload)

    if (result.error) {
      setSubmitError(formatCrudError(result.error.message, result.error.code))
      return
    }

    setSubmitSuccess(
      currentSettingsId
        ? 'Configuración de la tienda actualizada correctamente.'
        : 'Configuración de la tienda creada correctamente.',
    )
    form.reset({
      storeName: payload.store_name,
      whatsappPhone: payload.whatsapp_phone,
      instagramUrl: payload.instagram_url ?? '',
      address: payload.address ?? '',
      openingHours: payload.opening_hours ?? '',
      checkoutMessage: payload.checkout_message ?? '',
    })
    refresh()
    refreshStorefront()
  }

  async function handleCreateHeroSlide() {
    if (!supabase || !isSupabaseConfigured) {
      setHeroSlidesError('Configurá Supabase para editar la portada de inicio.')
      return
    }

    if (!canCreateHeroSlide) {
      setHeroSlidesError('Recomendado: máximo 5 imágenes principales.')
      return
    }

    setHeroSlideBusyId('new')
    setHeroSlidesError(null)
    setHeroSlidesSuccess(null)

    const nextSortOrder = heroSlides.reduce(
      (currentMax, slide) => Math.max(currentMax, slide.sort_order),
      -1,
    ) + 1
    const payload = {
      eyebrow: '',
      title: `Imagen ${heroSlides.length + 1}`,
      subtitle: null,
      description: null,
      image_url: buildHeroSlidePlaceholderUrl(`Imagen ${heroSlides.length + 1}`),
      image_alt: null,
      sort_order: nextSortOrder,
      is_active: false,
    }

    const result = await supabase
      .from('home_hero_slides')
      .insert(payload)
      .select('*')
      .single()

    setHeroSlideBusyId(null)

    if (result.error || !result.data) {
      setHeroSlidesError(
        formatCrudError(result.error?.message ?? 'No se pudo crear la imagen principal.'),
      )
      return
    }

    replaceHeroSlide(result.data)
    setExpandedSlideId(result.data.id)
    setHeroSlidesSuccess('Imagen creada. Ahora podés completar el texto y subir la foto.')
  }

  async function handleSaveHeroSlide(slideId: string) {
    if (!supabase || !isSupabaseConfigured) {
      setHeroSlidesError('Configurá Supabase para editar la portada de inicio.')
      return
    }

    const draft = heroSlideDrafts[slideId]

    if (!draft) {
      return
    }

    if (!draft.title.trim()) {
      setHeroSlidesError('La imagen necesita un título.')
      return
    }

    setHeroSlideBusyId(slideId)
    setHeroSlidesError(null)
    setHeroSlidesSuccess(null)

    const sortOrder = Number.isFinite(Number(draft.sortOrder))
      ? Math.max(0, Math.trunc(Number(draft.sortOrder)))
      : 0

    const payload = {
      eyebrow: draft.eyebrow.trim(),
      title: draft.title.trim(),
      subtitle: toNullableText(draft.subtitle),
      description: toNullableText(draft.description),
      image_alt: toNullableText(draft.imageAlt),
      sort_order: sortOrder,
      is_active: draft.isActive,
    }

    const result = await supabase
      .from('home_hero_slides')
      .update(payload)
      .eq('id', slideId)
      .select('*')
      .single()

    setHeroSlideBusyId(null)

    if (result.error || !result.data) {
      setHeroSlidesError(
        formatCrudError(result.error?.message ?? 'No se pudo guardar la imagen principal.'),
      )
      return
    }

    replaceHeroSlide(result.data)
    setHeroSlidesSuccess('Imagen principal actualizada correctamente.')
    refreshStorefront()
  }

  async function handleToggleHeroSlide(slide: HomeHeroSlideRow) {
    if (!supabase || !isSupabaseConfigured) {
      setHeroSlidesError('Configurá Supabase para editar la portada de inicio.')
      return
    }

    const nextIsActive = !slide.is_active
    const activeSlidesWithoutCurrent = heroSlides.filter(
      (current) => current.is_active && current.id !== slide.id,
    ).length

    if (nextIsActive && activeSlidesWithoutCurrent >= maxHeroSlides) {
      setHeroSlidesError('Recomendado: máximo 5 imágenes visibles.')
      return
    }

    setHeroSlideBusyId(slide.id)
    setHeroSlidesError(null)
    setHeroSlidesSuccess(null)

    const result = await supabase
      .from('home_hero_slides')
      .update({ is_active: nextIsActive })
      .eq('id', slide.id)
      .select('*')
      .single()

    setHeroSlideBusyId(null)

    if (result.error || !result.data) {
      setHeroSlidesError(
        formatCrudError(result.error?.message ?? 'No se pudo cambiar la visibilidad de la imagen.'),
      )
      return
    }

    replaceHeroSlide(result.data)
    setHeroSlidesSuccess(
      nextIsActive ? 'Imagen visible en el inicio.' : 'Imagen oculta del inicio.',
    )
    refreshStorefront()
  }

  async function handleUploadHeroSlideImage(
    slide: HomeHeroSlideRow,
    file: File | null,
  ) {
    if (!supabase || !isSupabaseConfigured || !file) {
      return
    }

    const validationError = validateImageMimeType(file, adminImageAllowedMimeTypes)

    if (validationError) {
      setHeroSlidesError(validationError)
      return
    }

    setHeroSlideUploadId(slide.id)
    setHeroSlideUploadStatus('Optimizando imagen...')
    setHeroSlidesError(null)
    setHeroSlidesSuccess(null)

    const optimizedResult = await optimizeImageFile(file, {
      maxWidth: 1800,
      maxHeight: 1800,
      quality: 0.84,
      outputType: 'image/webp',
    })
    const sizeError = validateImageSize(
      optimizedResult.file,
      adminImageMaxSizeBytes,
      'La imagen sigue siendo demasiado pesada. Probá con una foto más liviana.',
    )

    if (sizeError) {
      setHeroSlideUploadId(null)
      setHeroSlideUploadStatus(null)
      setHeroSlidesError(sizeError)
      return
    }

    setHeroSlideUploadStatus('Subiendo imagen...')
    const uploadFile = optimizedResult.file
    const objectPath = buildHeroSlideImageObjectPath(slide.id, uploadFile.name)
    const uploadResult = await supabase.storage.from(adminImageBucket).upload(objectPath, uploadFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: uploadFile.type,
    })

    if (uploadResult.error) {
      setHeroSlideUploadId(null)
      setHeroSlideUploadStatus(null)
      setHeroSlidesError(formatCrudError(uploadResult.error.message, uploadResult.error.name))
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from(adminImageBucket)
      .getPublicUrl(objectPath)

    const updateResult = await supabase
      .from('home_hero_slides')
      .update({ image_url: publicUrlData.publicUrl })
      .eq('id', slide.id)
      .select('*')
      .single()

    setHeroSlideUploadId(null)
    setHeroSlideUploadStatus(null)

    if (updateResult.error || !updateResult.data) {
      setHeroSlidesError(
        formatCrudError(updateResult.error?.message ?? 'No se pudo guardar la foto de la portada.'),
      )
      return
    }

    replaceHeroSlide(updateResult.data, { syncDraft: false })
    setHeroSlidesSuccess(
      optimizedResult.wasOptimized
        ? `Imagen principal actualizada correctamente. Imagen optimizada automáticamente para el inicio: ${formatFileSize(
            optimizedResult.originalSize,
          )} → ${formatFileSize(optimizedResult.optimizedSize)}.`
        : 'Imagen principal actualizada correctamente.',
    )
    refreshStorefront()
  }

  if (loading) {
    return <LoadingState label="Cargando configuración de la tienda..." />
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <AdminPageHeader
        eyebrow="Configuración"
        title="Configuración"
        description="Datos públicos de la tienda."
        hideDescriptionOnMobile
        variant="compact"
      />

      {!storeSettings ? (
        <div className="rounded-[18px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Falta cargar los datos principales de la tienda.
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

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="min-w-0 space-y-4 border border-white/10 bg-[#111111] p-3.5 text-white shadow-none sm:p-6 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-white">
              {storeSettings ? 'Editar datos de la tienda' : 'Cargar datos de la tienda'}
            </p>
            <p className="text-sm leading-6 text-white/60">
              Estos datos se muestran en la tienda y en el pedido por WhatsApp.
            </p>
          </div>

          <form
            className="space-y-4 [&_label]:min-w-0 [&_label>span]:text-white [&_label>p]:text-white/54 [&_input]:min-w-0 [&_input]:border-white/10 [&_input]:bg-[#0d0d0d] [&_input]:text-white [&_input]:placeholder:text-white/32 [&_textarea]:border-white/10 [&_textarea]:bg-[#0d0d0d] [&_textarea]:text-white [&_textarea]:placeholder:text-white/32"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nombre de la tienda"
                placeholder="City Calzado Urbano"
                autoComplete="organization"
                error={form.formState.errors.storeName?.message}
                {...form.register('storeName')}
              />

              <Input
                label="WhatsApp"
                placeholder="5491122334455"
                autoComplete="tel"
                hint="Se guarda solo con números."
                error={form.formState.errors.whatsappPhone?.message}
                {...form.register('whatsappPhone')}
              />
            </div>

            <Input
              label="Instagram"
              type="url"
              placeholder="https://instagram.com/tucomercio"
              autoComplete="url"
              error={form.formState.errors.instagramUrl?.message}
              {...form.register('instagramUrl')}
            />

            <Input
              label="Dirección"
              placeholder="Galería Provincial, General Acha 172 Sur"
              error={form.formState.errors.address?.message}
              {...form.register('address')}
            />

            <Input
              label="Horarios"
              placeholder="Lunes a sábado de 10 a 19 hs"
              error={form.formState.errors.openingHours?.message}
              {...form.register('openingHours')}
            />

            <Textarea
              label="Mensaje de checkout"
              placeholder="Te confirmamos disponibilidad, retiro y pago por WhatsApp."
              hint={`${(checkoutMessageValue ?? '').trim().length}/300 caracteres.`}
              error={form.formState.errors.checkoutMessage?.message}
              {...form.register('checkoutMessage')}
            />

            <div className="flex flex-wrap gap-2.5">
              <Button type="submit" variant="secondary" disabled={form.formState.isSubmitting}>
                <Save className="h-4 w-4" />
                {form.formState.isSubmitting
                  ? 'Guardando...'
                  : storeSettings
                    ? 'Guardar cambios'
                    : 'Crear configuración'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="text-white/72 hover:bg-white/8 hover:text-white"
                onClick={() => {
                  form.reset(toFormValues(storeSettings))
                  setSubmitError(null)
                  setSubmitSuccess(null)
                }}
              >
                Restablecer
              </Button>
            </div>
          </form>
        </Card>

        <div className="min-w-0 space-y-5">
          <Card className="min-w-0 space-y-4 border border-white/10 bg-[#111111] p-3.5 text-white shadow-none sm:p-6 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-white">Vista rápida</p>
              <p className="text-sm leading-6 text-white/60">
                Revisá los datos antes de guardar.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 rounded-[18px] border border-white/10 bg-black/20 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black/20 text-brand-strong">
                  <Store className="h-5 w-5" />
                </div>
                <p className="mt-3 text-[0.62rem] uppercase tracking-[0.18em] text-white/40">
                  Tienda
                </p>
                <p className="mt-2 break-words text-base font-semibold tracking-[-0.03em] text-white">
                  {previewStoreName}
                </p>
              </div>

              <div className="min-w-0 rounded-[18px] border border-white/10 bg-black/20 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black/20 text-brand-strong">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <p className="mt-3 text-[0.62rem] uppercase tracking-[0.18em] text-white/40">
                  WhatsApp
                </p>
                <p className="mt-2 break-words text-sm text-white">
                  {normalizedWhatsAppPhone || 'Sin número válido todavía'}
                </p>
                {previewWhatsAppUrl ? (
                  <a
                    href={previewWhatsAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-success hover:text-emerald-300"
                  >
                    Abrir preview
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-white/54">Completá un número válido.</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="min-w-0 space-y-4 border border-white/10 bg-[#111111] p-3.5 text-white shadow-none sm:p-6 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
            <p className="text-sm font-medium text-white">Datos públicos</p>

            <div className="space-y-3 text-sm">
              <div className="min-w-0 rounded-[18px] border border-white/10 bg-black/20 p-4">
                <p className="text-[0.62rem] uppercase tracking-[0.18em] text-white/40">
                  Instagram
                </p>
                {previewInstagramUrl ? (
                  <div className="mt-2 min-w-0 space-y-2">
                    <a
                      href={previewInstagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-2 font-medium text-white hover:border-white/20 hover:bg-white/8"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir Instagram
                    </a>
                    <p className="min-w-0 truncate text-xs text-white/50 sm:whitespace-normal sm:break-all">
                      {previewInstagramUrl}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-white/54">Sin link configurado.</p>
                )}
              </div>

              <div className="min-w-0 rounded-[18px] border border-white/10 bg-black/20 p-4">
                <p className="text-[0.62rem] uppercase tracking-[0.18em] text-white/40">
                  Dirección y horarios
                </p>
                <p className="mt-2 break-words text-white">
                  {(addressValue ?? '').trim() || 'Dirección sin configurar'}
                </p>
                <p className="mt-1 break-words text-white/54">
                  {(openingHoursValue ?? '').trim() || 'Horarios sin configurar'}
                </p>
              </div>

              <div className="min-w-0 rounded-[18px] border border-white/10 bg-black/20 p-4">
                <p className="text-[0.62rem] uppercase tracking-[0.18em] text-white/40">
                  Mensaje del pedido
                </p>
                <p className="mt-2 break-words text-white/54">
                  {(checkoutMessageValue ?? '').trim() || 'Sin mensaje configurado'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="space-y-4 border border-white/10 bg-[#111111] p-3.5 text-white shadow-none sm:p-6 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-white">Portada de inicio</p>
            <p className="text-sm leading-6 text-white/60">
              Cambiá las imágenes y textos principales que aparecen al entrar a la tienda.
            </p>
          </div>

          {canCreateHeroSlide ? (
            <Button
              type="button"
              variant="secondary"
              disabled={heroSlideBusyId === 'new'}
              onClick={() => void handleCreateHeroSlide()}
            >
              <Plus className="h-4 w-4" />
              {heroSlideBusyId === 'new' ? 'Creando...' : 'Agregar imagen'}
            </Button>
          ) : (
            <p className="text-xs text-white/50">Recomendado: máximo 5 imágenes principales.</p>
          )}
        </div>

        {heroSlidesError ? (
          <div className="rounded-[18px] border border-rose-500/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {heroSlidesError}
          </div>
        ) : null}

        {heroSlidesSuccess ? (
          <div className="rounded-[18px] border border-emerald-500/18 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {heroSlidesSuccess}
          </div>
        ) : null}

        <div className="rounded-[18px] border border-white/10 bg-black/15 px-3 py-2 text-xs text-white/54">
          Formatos permitidos: {adminImageAllowedMimeTypes
            .map((type) => type.replace('image/', '').toUpperCase())
            .join(', ')}
          . La imagen se optimiza automáticamente antes de subir. Podés subir fotos desde tu celular. Máximo final por archivo: {formatBytesAsMb(
            adminImageMaxSizeBytes,
          )}. Recomendado: fotos claras y bien encuadradas.
        </div>

        {heroSlidesLoading ? (
          <div className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-6 text-center text-sm text-white/60">
            Cargando portada de inicio...
          </div>
        ) : heroSlides.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-white/12 bg-black/15 px-4 py-6 text-center text-sm text-white/60">
            Todavía no cargaste imágenes para la portada. Mientras tanto, la tienda usa las imágenes predeterminadas.
          </div>
        ) : (
          <div className="space-y-3">
            {heroSlides.map((slide, index) => {
              const draft = heroSlideDrafts[slide.id] ?? toHeroSlideDraft(slide)
              const isExpanded = expandedSlideId === slide.id
              const isBusy = heroSlideBusyId === slide.id
              const isUploading = heroSlideUploadId === slide.id

              return (
                <Card
                  key={slide.id}
                  className="space-y-4 border border-white/10 bg-[#0f0f0f] p-3.5 text-white shadow-none sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] border border-white/10 bg-[#181818]">
                      <img
                        src={slide.image_url}
                        alt={slide.image_alt ?? slide.title}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold tracking-[-0.03em] text-white sm:text-base">
                          Imagen {index + 1}
                        </p>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.18em]',
                            slide.is_active
                              ? 'border-emerald-400/20 bg-emerald-500/12 text-emerald-200'
                              : 'border-white/10 bg-white/6 text-white/55',
                          )}
                        >
                          {slide.is_active ? 'Visible en inicio' : 'Oculto'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="line-clamp-1 text-base font-medium text-white">
                          {slide.title}
                        </p>
                        <p className="line-clamp-1 text-sm text-white/60">
                          {slide.subtitle ?? 'Sin subtítulo'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-white/45">
                        <span>Orden {slide.sort_order}</span>
                        <span>·</span>
                        <span>{slide.image_url.startsWith('data:') ? 'Foto pendiente' : 'Foto cargada'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:flex sm:flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      disabled={isBusy}
                      onClick={() =>
                        setExpandedSlideId((current) =>
                          current === slide.id ? null : slide.id,
                        )
                      }
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {isExpanded ? 'Ocultar' : 'Editar'}
                    </Button>

                    <label
                      className={cn(
                        buttonStyles({ variant: 'outline' }),
                        'w-full cursor-pointer sm:w-auto',
                        isUploading ? 'pointer-events-none opacity-70' : '',
                      )}
                    >
                      {isUploading ? (
                        <Upload className="h-4 w-4" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                      {isUploading
                        ? heroSlideUploadStatus ?? 'Subiendo...'
                        : 'Cambiar imagen'}
                      <input
                        type="file"
                        accept={adminImageAllowedMimeTypes.join(',')}
                        className="sr-only"
                        disabled={isUploading}
                        onChange={(event) => {
                          const nextFile = event.target.files?.[0] ?? null
                          void handleUploadHeroSlideImage(slide, nextFile)
                          event.currentTarget.value = ''
                        }}
                      />
                    </label>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-white/72 hover:bg-white/8 hover:text-white sm:w-auto"
                      disabled={isBusy}
                      onClick={() => void handleToggleHeroSlide(slide)}
                    >
                      {slide.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {slide.is_active ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  </div>

                  {isExpanded ? (
                    <div className="space-y-4 border-t border-white/10 pt-4 [&_label]:min-w-0 [&_label>span]:text-white [&_label>p]:text-white/54 [&_input]:min-w-0 [&_input]:border-white/10 [&_input]:bg-[#0d0d0d] [&_input]:text-white [&_input]:placeholder:text-white/32 [&_textarea]:border-white/10 [&_textarea]:bg-[#0d0d0d] [&_textarea]:text-white [&_textarea]:placeholder:text-white/32">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                          label="Etiqueta superior"
                          placeholder="NUEVOS INGRESOS"
                          value={draft.eyebrow}
                          onChange={(event) =>
                            updateHeroSlideDraft(slide.id, { eyebrow: event.target.value })
                          }
                        />

                        <Input
                          label="Orden"
                          type="number"
                          min={0}
                          value={draft.sortOrder}
                          onChange={(event) =>
                            updateHeroSlideDraft(slide.id, { sortOrder: event.target.value })
                          }
                        />
                      </div>

                      <Input
                        label="Título"
                        placeholder="CITY DROP"
                        value={draft.title}
                        onChange={(event) =>
                          updateHeroSlideDraft(slide.id, { title: event.target.value })
                        }
                      />

                      <Input
                        label="Subtítulo"
                        placeholder="TU PRÓXIMO PAR"
                        value={draft.subtitle}
                        onChange={(event) =>
                          updateHeroSlideDraft(slide.id, { subtitle: event.target.value })
                        }
                      />

                      <Textarea
                        label="Texto corto"
                        placeholder="Modelos urbanos seleccionados por el local."
                        value={draft.description}
                        onChange={(event) =>
                          updateHeroSlideDraft(slide.id, { description: event.target.value })
                        }
                      />

                      <Input
                        label="Descripción de la imagen"
                        placeholder="Imagen principal con modelos nuevos"
                        value={draft.imageAlt}
                        onChange={(event) =>
                          updateHeroSlideDraft(slide.id, { imageAlt: event.target.value })
                        }
                      />

                      <label className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-black/15 px-4 py-3 text-sm text-white">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-white/18 bg-[#0d0d0d] text-brand-strong focus:ring-brand-strong"
                          checked={draft.isActive}
                          onChange={(event) =>
                            updateHeroSlideDraft(slide.id, { isActive: event.target.checked })
                          }
                        />
                        Mostrar en el inicio
                      </label>

                      <div className="flex flex-wrap gap-2.5">
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={isBusy}
                          onClick={() => void handleSaveHeroSlide(slide.id)}
                        >
                          <Save className="h-4 w-4" />
                          {isBusy ? 'Guardando...' : 'Guardar cambios'}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          className="text-white/72 hover:bg-white/8 hover:text-white"
                          onClick={() =>
                            setHeroSlideDrafts((current) => ({
                              ...current,
                              [slide.id]: toHeroSlideDraft(slide),
                            }))
                          }
                        >
                          Restablecer
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </Card>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
