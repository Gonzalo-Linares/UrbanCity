import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ExternalLink,
  MessageCircle,
  Save,
  Store,
} from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/LoadingState'
import { Textarea } from '@/components/ui/Textarea'
import { useAdminOutletData } from '@/hooks/useAdminShellData'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { formatCrudError, toNullableText } from '@/lib/admin'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { buildWhatsAppUrl, normalizeWhatsAppPhone } from '@/lib/whatsapp'
import {
  adminStoreSettingsSchema,
  type AdminStoreSettingsSchema,
} from '@/schemas/adminStoreSettings'
import type { StoreSettingsRow } from '@/types/database'

const defaultValues: AdminStoreSettingsSchema = {
  storeName: '',
  whatsappPhone: '',
  instagramUrl: '',
  address: '',
  openingHours: '',
  checkoutMessage: '',
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

export function AdminSettingsPage() {
  const { loading, refresh, storeSettings } = useAdminOutletData()
  const { refresh: refreshStorefront } = useStorefrontData()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const form = useForm<AdminStoreSettingsSchema>({
    resolver: zodResolver(adminStoreSettingsSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(toFormValues(storeSettings))
  }, [form, storeSettings])

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

  if (loading) {
    return <LoadingState label="Cargando configuración de la tienda..." />
  }

  async function handleSubmit(values: AdminStoreSettingsSchema) {
    if (!supabase || !isSupabaseConfigured) {
      setSubmitError('Configura Supabase para editar los datos de la tienda.')
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
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-success hover:text-emerald-700"
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
    </div>
  )
}
