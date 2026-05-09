import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { MessageCircle, ShieldCheck, ShoppingBag } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/buttonStyles'
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
import type { Database } from '@/types/database'
import type {
  CartItem,
  CheckoutOrderItem,
  GeneratedOrderDraft,
} from '@/types/store'

const checkoutDraftStorageKey = 'urbancity-checkout-draft'

interface PersistedCheckoutDraft extends GeneratedOrderDraft {
  cartFingerprint: string
}

type CreateOrderWithItemsRow =
  Database['public']['Functions']['create_order_with_items']['Returns'][number]

function buildCartFingerprint(items: CartItem[]) {
  return items
    .map((item) => `${item.productId}:${item.quantity}`)
    .sort()
    .join('|')
}

function buildCheckoutOrderItems(items: CartItem[]): CheckoutOrderItem[] {
  return items.map((item) => ({
    productId: item.productId,
    productName: item.name,
    unitPrice: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }))
}

function clearPersistedDraft() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(checkoutDraftStorageKey)
  }
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
  const clearCart = useCartStore((state) => state.clearCart)
  const { products, storeSettings } = useStorefrontData()
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
  const sellableProductsMap = useMemo(
    () =>
      new Map(
        products
          .filter(
            (product) =>
              product.is_active &&
              (product.availability === 'available' ||
                product.availability === 'inquiry'),
          )
          .map((product) => [product.id, product]),
      ),
    [products],
  )
  const invalidAvailabilityItems = isSupabaseConfigured
    ? items.filter((item) => !sellableProductsMap.has(item.productId))
    : []
  const invalidQuantityItems = items.filter((item) => item.quantity > 99)
  const checkoutBlockingMessage =
    invalidAvailabilityItems.length > 0
      ? 'Hay productos del carrito que ya no estan disponibles para pedir. Revisa el carrito antes de generar el pedido.'
      : invalidQuantityItems.length > 0
        ? 'Hay cantidades fuera del limite permitido. Revisa el carrito antes de generar el pedido.'
        : null

  const form = useForm<CheckoutSchema>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerMessage: '',
    },
  })

  function handleResetDraft() {
    setDraftState(null)
    setSubmitError(null)
    clearPersistedDraft()
    clearCart()
    form.reset()
  }

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

    if (checkoutBlockingMessage) {
      setSubmitError(checkoutBlockingMessage)
      return
    }

    setSubmitError(null)

    const orderCode = generateOrderCode()
    let finalOrderCode = orderCode
    let finalTotal = total
    let finalItems = buildCheckoutOrderItems(items)

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
          'No pudimos confirmar el pedido en este momento. Intenta nuevamente en unos minutos.',
        )
        return
      }

      const savedOrderRows = (data as CreateOrderWithItemsRow[] | null) ?? []
      const savedOrder = savedOrderRows[0]

      if (!savedOrder) {
        setSubmitError(
          'No pudimos confirmar el pedido en este momento. Intenta nuevamente en unos minutos.',
        )
        return
      }

      finalOrderCode = savedOrder.order_code || orderCode
      finalTotal = Number(savedOrder.total)
      finalItems = savedOrderRows.map((row) => ({
        productId: row.product_id,
        productName: row.product_name,
        unitPrice: Number(row.unit_price),
        quantity: row.quantity,
        subtotal: Number(row.subtotal),
      }))
    }

    const whatsappMessage = buildWhatsAppMessage({
      orderCode: finalOrderCode,
      storeName: storeSettings.store_name,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      customerMessage: values.customerMessage ?? '',
      checkoutMessage: storeSettings.checkout_message,
      items: finalItems,
      total: finalTotal,
    })

    const nextDraft: PersistedCheckoutDraft = {
      orderCode: finalOrderCode,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      customerMessage: values.customerMessage ?? '',
      items: finalItems,
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
          tone="light"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <Card className="space-y-6">
          {!hasWhatsApp ? (
            <div className="rounded-[22px] border border-rose-500/15 bg-rose-500/8 px-4 py-3 text-sm text-rose-700">
              El canal de WhatsApp del comercio no esta disponible en este momento.
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
                form.formState.isSubmitting ||
                Boolean(draft) ||
                !hasWhatsApp ||
                Boolean(checkoutBlockingMessage)
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

          {!submitError && checkoutBlockingMessage ? (
            <div className="rounded-[22px] border border-amber-500/15 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
              {checkoutBlockingMessage}
            </div>
          ) : null}

          {draft ? (
            <div className="space-y-4 rounded-[28px] border border-success/15 bg-success/8 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-success" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-stone-950">
                    Pedido generado
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
                className={buttonStyles({
                  variant: 'whatsapp',
                  size: 'md',
                })}
              >
                <MessageCircle className="h-4 w-4" />
                Enviar pedido por WhatsApp
              </a>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/carrito"
                  className={buttonStyles({ variant: 'outline', size: 'md' })}
                >
                  Editar carrito
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetDraft}
                >
                  Vaciar carrito y hacer nuevo pedido
                </Button>
              </div>
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
