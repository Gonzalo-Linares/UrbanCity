import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck, ShoppingBag } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { SocialIcon } from '@/components/ui/SocialIcon'
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
    .map(
      (item) =>
        `${item.cartItemId}:${item.productId}:${item.sizeLabel ?? 'sin-talle'}:${item.quantity}`,
    )
    .sort()
    .join('|')
}

function buildCheckoutOrderItems(items: CartItem[]): CheckoutOrderItem[] {
  return items.map((item) => ({
    productId: item.productId,
    productName: item.name,
    sizeLabel: item.sizeLabel,
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
      ? 'Hay productos del carrito que ya no están disponibles para pedir. Revisá el carrito antes de generar el pedido.'
      : invalidQuantityItems.length > 0
        ? 'Hay cantidades fuera del límite permitido. Revisá el carrito antes de generar el pedido.'
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
        description="Agregá al menos un producto al carrito antes de pasar al checkout."
        action={
          <Link to="/catalogo" className="text-sm font-medium text-brand-strong">
            Ver catálogo
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
            size_label: item.sizeLabel,
          })),
        } as never,
      )

      if (rpcError) {
        setSubmitError(
          rpcError.message?.toLowerCase().includes('talle')
            ? 'No pudimos confirmar el pedido. Revisá que el talle elegido siga disponible.'
            : 'No pudimos confirmar el pedido en este momento. Intentá nuevamente en unos minutos.',
        )
        return
      }

      const savedOrderRows = (data as CreateOrderWithItemsRow[] | null) ?? []
      const savedOrder = savedOrderRows[0]

      if (!savedOrder) {
        setSubmitError(
          'No pudimos confirmar el pedido en este momento. Intentá nuevamente en unos minutos.',
        )
        return
      }

      finalOrderCode = savedOrder.order_code || orderCode
      finalTotal = Number(savedOrder.total)
      finalItems = savedOrderRows.map((row) => ({
        productId: row.product_id,
        productName: row.product_name,
        sizeLabel: row.size_label,
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

    if (nextDraft.whatsappUrl) {
      window.location.assign(nextDraft.whatsappUrl)
    }
  }

  return (
    <div className="space-y-8">
      <section className="surface-panel p-6 sm:p-8 lg:p-10">
        <SectionTitle
          eyebrow="Checkout"
          title="Completá tus datos y generá el pedido"
          description="Tu pedido queda pendiente de confirmación. Coordinás disponibilidad, retiro y pago por WhatsApp."
          tone="light"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <Card className="space-y-6 border border-white/10 bg-[#111111] shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
          {!hasWhatsApp ? (
            <div className="rounded-[22px] border border-rose-500/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              El canal de WhatsApp del local no está disponible en este momento.
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/42">
                Confirmación
              </p>
              <p className="mt-2 text-sm leading-6 text-white/74">
                Pedido pendiente de confirmación.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/42">
                Pago
              </p>
              <p className="mt-2 text-sm leading-6 text-white/74">
                El pago se coordina con el comercio.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/74">
            Al generar el pedido no estás pagando online. Confirmamos
            disponibilidad, talle, forma de pago y precio final por WhatsApp.
          </div>

          <form
            className="space-y-5 [&_label>span]:text-white [&_label>p]:text-white/58 [&_input]:border-white/10 [&_input]:bg-[#0d0d0d] [&_input]:text-white [&_input]:placeholder:text-white/34 [&_textarea]:border-white/10 [&_textarea]:bg-[#0d0d0d] [&_textarea]:text-white [&_textarea]:placeholder:text-white/34"
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
                label="Teléfono"
                placeholder="Tu WhatsApp"
                autoComplete="tel"
                error={form.formState.errors.customerPhone?.message}
                {...form.register('customerPhone')}
              />
            </div>

            <Textarea
              label="Mensaje opcional"
              placeholder="Ej: necesito retirar hoy o quiero dos unidades para regalo."
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
              <SocialIcon type="whatsapp" className="h-4 w-4" />
              {draft
                ? 'Pedido ya generado'
                : form.formState.isSubmitting
                  ? 'Generando pedido...'
                  : 'Generar pedido y abrir WhatsApp'}
            </Button>
          </form>

          {submitError ? (
            <div className="rounded-[22px] border border-rose-500/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {submitError}
            </div>
          ) : null}

          {!submitError && checkoutBlockingMessage ? (
            <div className="rounded-[22px] border border-amber-500/18 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {checkoutBlockingMessage}
            </div>
          ) : null}

          {draft ? (
            <div className="space-y-4 rounded-[28px] border border-success/18 bg-[#101c16] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-success" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    Pedido generado
                  </p>
                  <p className="text-sm leading-6 text-white/74">
                    Código {draft.orderCode}. Confirmamos disponibilidad, forma
                    de pago y precio final por WhatsApp.
                  </p>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-white/76">
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
                <SocialIcon type="whatsapp" className="h-4 w-4" />
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
          <Card className="space-y-5 border border-white/10 bg-[#111111] shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/30 text-white">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Resumen</p>
                <p className="text-sm text-white/58">
                  {items.length} producto{items.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-[24px] border border-white/10 bg-black/20 p-4">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    {item.sizeLabel ? (
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/42">
                        Talle: {item.sizeLabel}
                      </p>
                    ) : null}
                    <p className="text-white/50">x{item.quantity}</p>
                  </div>
                  <span className="font-medium text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="glass-divider bg-gradient-to-r from-transparent via-white/18 to-transparent" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/58">Total contado estimado</span>
                <span className="text-2xl font-semibold tracking-[-0.03em] text-white">
                  {formatCurrency(total)}
                </span>
              </div>
              <p className="text-sm leading-6 text-white/62">
                El precio publicado corresponde a pago contado. Tarjeta/cuotas y
                precio final se confirman por WhatsApp.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
