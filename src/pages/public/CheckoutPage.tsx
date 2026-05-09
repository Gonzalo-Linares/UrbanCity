import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { MessageCircle, ShieldCheck, ShoppingBag } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { Textarea } from '@/components/ui/Textarea'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { formatCurrency } from '@/lib/formatters'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  generateOrderCode,
} from '@/lib/whatsapp'
import { checkoutSchema, type CheckoutSchema } from '@/schemas/checkout'
import { useCartStore } from '@/store/cartStore'
import type { GeneratedOrderDraft } from '@/types/store'

const checkoutDraftStorageKey = 'urbancity-checkout-draft'

interface PersistedCheckoutDraft extends GeneratedOrderDraft {
  cartFingerprint: string
}

function buildCartFingerprint(
  items: ReturnType<typeof useCartStore.getState>['items'],
) {
  return items
    .map((item) => `${item.productId}:${item.quantity}`)
    .sort()
    .join('|')
}

function readPersistedDraft(cartFingerprint: string) {
  if (typeof window === 'undefined') {
    return null
  }

  if (!cartFingerprint) {
    window.localStorage.removeItem(checkoutDraftStorageKey)
    return null
  }

  const storedDraft = window.localStorage.getItem(checkoutDraftStorageKey)

  if (!storedDraft) {
    return null
  }

  try {
    const parsedDraft = JSON.parse(storedDraft) as PersistedCheckoutDraft

    if (parsedDraft.cartFingerprint !== cartFingerprint) {
      window.localStorage.removeItem(checkoutDraftStorageKey)
      return null
    }

    return parsedDraft
  } catch {
    window.localStorage.removeItem(checkoutDraftStorageKey)
    return null
  }
}

export function CheckoutPage() {
  const items = useCartStore((state) => state.items)
  const { storeSettings } = useStorefrontData()
  const [draftState, setDraftState] = useState<PersistedCheckoutDraft | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const total = items.reduce(
    (subtotal, item) => subtotal + item.price * item.quantity,
    0,
  )
  const hasWhatsApp = Boolean(storeSettings.whatsapp_phone)
  const cartFingerprint = buildCartFingerprint(items)
  const persistedDraft = useMemo(
    () => readPersistedDraft(cartFingerprint),
    [cartFingerprint],
  )
  const draft =
    draftState?.cartFingerprint === cartFingerprint ? draftState : persistedDraft

  const form = useForm<CheckoutSchema>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerMessage: '',
    },
  })

  if (items.length === 0) {
    return (
      <EmptyState
        title="No hay productos para enviar"
        description="Agrega al menos un producto al carrito antes de pasar al checkout."
        action={
          <Link to="/catalogo" className="text-sm font-medium text-brand-strong">
            Ver catalogo
          </Link>
        }
      />
    )
  }

  async function handleSubmit(values: CheckoutSchema) {
    if (draft || !hasWhatsApp) {
      return
    }

    setSubmitError(null)

    const orderCode = generateOrderCode()
    let finalOrderCode = orderCode
    let finalTotal = total

    if (isSupabaseConfigured && supabase) {
      const { data, error: rpcError } = await supabase.rpc(
        'create_order_with_items',
        {
          p_order_code: orderCode,
          p_customer_name: values.customerName,
          p_customer_phone: values.customerPhone,
          p_customer_message: values.customerMessage || null,
          p_items: items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
          })),
        } as never,
      )

      if (rpcError) {
        setSubmitError(
          'No se pudo guardar el pedido en Supabase. Revisa la RPC create_order_with_items.',
        )
        return
      }

      const savedOrder = (
        data as
          | {
              order_id: string
              order_code: string
              total: number
            }[]
          | null
      )?.[0]

      if (!savedOrder) {
        setSubmitError(
          'Supabase no devolvio confirmacion del pedido. Reintenta la operacion.',
        )
        return
      }

      finalOrderCode = savedOrder.order_code || orderCode
      finalTotal = Number(savedOrder.total)
    }

    const whatsappMessage = buildWhatsAppMessage({
      orderCode: finalOrderCode,
      storeName: storeSettings.store_name,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      customerMessage: values.customerMessage ?? '',
      checkoutMessage: storeSettings.checkout_message,
      items,
      total: finalTotal,
    })

    const nextDraft: PersistedCheckoutDraft = {
      orderCode: finalOrderCode,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      customerMessage: values.customerMessage ?? '',
      whatsappMessage,
      whatsappUrl: buildWhatsAppUrl(
        storeSettings.whatsapp_phone,
        whatsappMessage,
      ),
      total: finalTotal,
      status: 'pending',
      createdAt: new Date().toISOString(),
      cartFingerprint,
    }

    setDraftState(nextDraft)
    window.localStorage.setItem(
      checkoutDraftStorageKey,
      JSON.stringify(nextDraft),
    )
  }

  return (
    <div className="space-y-8">
      <section className="surface-panel p-6 sm:p-8 lg:p-10">
        <SectionTitle
          eyebrow="Checkout"
          title="Deja tus datos y genera el pedido para WhatsApp."
          description="La orden queda pendiente de confirmacion. El comercio valida disponibilidad, retiro y pago manualmente."
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <Card className="space-y-6">
          {!hasWhatsApp ? (
            <div className="rounded-[22px] border border-rose-500/15 bg-rose-500/8 px-4 py-3 text-sm text-rose-700">
              Falta configurar `store_settings.whatsapp_phone` en Supabase.
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-stone-900/8 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">
                Confirmacion
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                Pedido pendiente de confirmacion.
              </p>
            </div>
            <div className="rounded-[24px] border border-stone-900/8 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">
                Pago
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                El pago se coordina con el comercio.
              </p>
            </div>
          </div>

          <form
            className="space-y-5"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Nombre"
                placeholder="Tu nombre"
                autoComplete="name"
                error={form.formState.errors.customerName?.message}
                {...form.register('customerName')}
              />
              <Input
                label="Telefono"
                placeholder="Tu WhatsApp"
                autoComplete="tel"
                error={form.formState.errors.customerPhone?.message}
                {...form.register('customerPhone')}
              />
            </div>

            <Textarea
              label="Mensaje opcional"
              placeholder="Ej: necesito retiro hoy, quiero dos unidades para regalo."
              hint="Se adjunta al resumen del pedido."
              error={form.formState.errors.customerMessage?.message}
              {...form.register('customerMessage')}
            />

            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
              disabled={
                form.formState.isSubmitting || Boolean(draft) || !hasWhatsApp
              }
            >
              <MessageCircle className="h-4 w-4" />
              {draft
                ? 'Pedido ya generado'
                : form.formState.isSubmitting
                  ? 'Generando pedido...'
                  : 'Generar pedido para WhatsApp'}
            </Button>
          </form>

          {submitError ? (
            <div className="rounded-[22px] border border-rose-500/15 bg-rose-500/8 px-4 py-3 text-sm text-rose-700">
              {submitError}
            </div>
          ) : null}

          {draft ? (
            <div className="space-y-4 rounded-[28px] border border-success/15 bg-success/8 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-success" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-stone-950">
                    Pedido preparado para envio
                  </p>
                  <p className="text-sm leading-6 text-stone-700">
                    Codigo {draft.orderCode}. La disponibilidad sera confirmada
                    por WhatsApp.
                  </p>
                </div>
              </div>

              <div className="rounded-[22px] border border-stone-900/8 bg-white p-4">
                <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-stone-700">
                  {draft.whatsappMessage}
                </pre>
              </div>

              <a
                href={draft.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-success px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                Enviar pedido por WhatsApp
              </a>
            </div>
          ) : null}
        </Card>

        <div className="space-y-4 lg:sticky lg:top-28">
          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-950 text-white">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-950">Resumen</p>
                <p className="text-sm text-muted">
                  {items.length} producto{items.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-stone-900">{item.name}</p>
                    <p className="text-muted">x{item.quantity}</p>
                  </div>
                  <span className="font-medium text-stone-950">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="glass-divider" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Total estimado</span>
              <span className="text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                {formatCurrency(total)}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
