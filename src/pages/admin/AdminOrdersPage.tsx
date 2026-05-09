import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  CheckCheck,
  Clock3,
  Copy,
  MessageCircle,
  RefreshCw,
  Search,
  ShoppingBag,
  XCircle,
} from 'lucide-react'
import { AdminMetricCard } from '@/components/admin/AdminMetricCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/LoadingState'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { SelectField } from '@/components/ui/SelectField'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAdminOutletData } from '@/hooks/useAdminShellData'
import { formatCrudError } from '@/lib/admin'
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
} from '@/lib/formatters'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import type { OrderItemRow, OrderRow, OrderStatus } from '@/types/database'

interface OrderListItem extends OrderRow {
  items: OrderItemRow[]
  itemCount: number
}

const orderStatusOptions: Array<{ value: 'all' | OrderStatus; label: string }> = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'ready_for_pickup', label: 'Listo para retirar' },
  { value: 'completed', label: 'Entregado / Pagado manualmente' },
  { value: 'cancelled', label: 'Cancelado' },
]

function orderStatusTone(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'confirmed':
      return 'success'
    case 'ready_for_pickup':
      return 'success'
    case 'completed':
      return 'muted'
    case 'cancelled':
      return 'danger'
    default:
      return 'muted'
  }
}

function buildCustomerFollowUpMessage(
  order: OrderRow,
  storeName: string,
  items: OrderItemRow[],
) {
  const lines = [
    `Hola ${order.customer_name}, te escribimos de ${storeName}.`,
    '',
    `Pedido: ${order.order_code}`,
    `Estado actual: ${formatOrderStatus(order.status)}`,
    '',
    'Detalle:',
    ...items.map(
      (item) =>
        `- ${item.product_name} x${item.quantity} | ${formatCurrency(item.subtotal)}`,
    ),
    '',
    `Total: ${formatCurrency(order.total)}`,
  ]

  if (order.status === 'pending') {
    lines.push('Estamos revisando disponibilidad y te confirmamos por este medio.')
  }

  if (order.status === 'confirmed') {
    lines.push('Tu pedido ya fue confirmado. Te avisamos cuando este listo.')
  }

  if (order.status === 'ready_for_pickup') {
    lines.push('Tu pedido esta listo para retirar. Coordinamos retiro y pago por WhatsApp.')
  }

  if (order.status === 'completed') {
    lines.push('Marcamos tu pedido como entregado/pagado manualmente. Gracias por tu compra.')
  }

  if (order.status === 'cancelled') {
    lines.push('Tu pedido fue cancelado. Si quieres, podemos ayudarte a armar uno nuevo.')
  }

  return lines.join('\n')
}

export function AdminOrdersPage() {
  const { counts, loading, refresh, storeName } = useAdminOutletData()
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [pageLoading, setPageLoading] = useState(isSupabaseConfigured)
  const [pageError, setPageError] = useState<string | null>(
    isSupabaseConfigured ? null : 'Configura Supabase para administrar pedidos.',
  )
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const [searchValue, setSearchValue] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null)
  const deferredSearch = useDeferredValue(searchValue)

  useEffect(() => {
    if (!supabase) {
      return
    }

    const client = supabase
    let ignore = false

    async function loadOrders() {
      setPageLoading(true)
      setPageError(null)

      const [ordersResult, itemsResult] = await Promise.all([
        client
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false }),
        client
          .from('order_items')
          .select('*')
          .order('created_at', { ascending: true }),
      ])

      if (ignore) {
        return
      }

      if (ordersResult.error || itemsResult.error) {
        setPageError('No se pudieron cargar los pedidos desde Supabase.')
        setPageLoading(false)
        return
      }

      const itemsByOrderId = new Map<string, OrderItemRow[]>()

      for (const item of itemsResult.data ?? []) {
        const currentItems = itemsByOrderId.get(item.order_id) ?? []
        currentItems.push(item)
        itemsByOrderId.set(item.order_id, currentItems)
      }

      const nextOrders = (ordersResult.data ?? []).map((order) => {
        const items = itemsByOrderId.get(order.id) ?? []

        return {
          ...order,
          items,
          itemCount: items.reduce((total, item) => total + item.quantity, 0),
        }
      })

      setOrders(nextOrders)
      setSelectedOrderId((current) => {
        if (current && nextOrders.some((order) => order.id === current)) {
          return current
        }

        return nextOrders[0]?.id ?? null
      })
      setPageLoading(false)
    }

    void loadOrders()

    return () => {
      ignore = true
    }
  }, [reloadKey])

  const filteredOrders = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter
      const matchesSearch =
        normalizedSearch.length === 0 ||
        order.order_code.toLowerCase().includes(normalizedSearch) ||
        order.customer_name.toLowerCase().includes(normalizedSearch) ||
        order.customer_phone.toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [deferredSearch, orders, statusFilter])

  const selectedOrder =
    filteredOrders.find((order) => order.id === selectedOrderId) ??
    filteredOrders[0] ??
    null

  if (loading || pageLoading) {
    return <LoadingState label="Cargando panel de pedidos..." />
  }

  async function reloadPage() {
    setReloadKey((current) => current + 1)
    refresh()
  }

  async function updateOrderStatus(order: OrderListItem, status: OrderStatus) {
    if (!supabase) {
      return
    }

    if (status === order.status) {
      return
    }

    if (
      typeof window !== 'undefined' &&
      status === 'cancelled' &&
      !window.confirm(
        `Cancelar el pedido ${order.order_code}? Esta accion corta el circuito comercial actual.`,
      )
    ) {
      return
    }

    if (
      typeof window !== 'undefined' &&
      status === 'completed' &&
      !window.confirm(
        `Marcar ${order.order_code} como entregado/pagado manualmente? Esto no registra ningun pago online.`,
      )
    ) {
      return
    }

    setBusyOrderId(order.id)
    setActionError(null)
    setActionSuccess(null)

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', order.id)

    setBusyOrderId(null)

    if (error) {
      setActionError(
        `No se pudo actualizar ${order.order_code} a ${formatOrderStatus(status).toLowerCase()}. ${formatCrudError(
          error.message,
          error.code,
        )}`,
      )
      return
    }

    setActionSuccess(
      `Pedido ${order.order_code} actualizado a ${formatOrderStatus(status)}. El pago sigue coordinado por WhatsApp.`,
    )
    await reloadPage()
  }

  async function copyMessage(order: OrderListItem) {
    const message =
      order.whatsapp_message?.trim() ||
      buildCustomerFollowUpMessage(order, storeName, order.items)

    try {
      await navigator.clipboard.writeText(message)
      setActionError(null)
      setActionSuccess(`Resumen del pedido ${order.order_code} copiado.`)
    } catch {
      setActionError(`No se pudo copiar el resumen del pedido ${order.order_code}.`)
    }
  }

  const selectedOrderMessage = selectedOrder
    ? selectedOrder.whatsapp_message?.trim() ||
      buildCustomerFollowUpMessage(selectedOrder, storeName, selectedOrder.items)
    : ''

  return (
    <div className="space-y-8">
      <section className="surface-panel p-6 sm:p-8 lg:p-10">
        <SectionTitle
          eyebrow="Pedidos"
          title="Seguimiento operativo de pedidos"
          description="Listado, filtros, detalle, contacto por WhatsApp y cambios de estado sin mezclar el flujo con pagos online."
          tone="light"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-4 md:grid-cols-2">
        <AdminMetricCard
          title="Total"
          value={counts.ordersTotal}
          description="Pedidos guardados en Supabase."
          icon={ShoppingBag}
        />
        <AdminMetricCard
          title="Pendientes"
          value={counts.ordersPending}
          description="Requieren confirmacion inicial por WhatsApp."
          icon={Clock3}
        />
        <AdminMetricCard
          title="Confirmados + listos"
          value={counts.ordersConfirmed + counts.ordersReady}
          description="Pedidos que ya avanzaron en el circuito comercial."
          icon={CheckCheck}
        />
        <AdminMetricCard
          title="Cancelados"
          value={counts.ordersCancelled}
          description="Pedidos cerrados sin entrega."
          icon={XCircle}
        />
      </div>

      {pageError ? (
        <div className="rounded-[22px] border border-rose-500/15 bg-rose-500/8 px-4 py-3 text-sm text-rose-700">
          {pageError}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-[22px] border border-rose-500/15 bg-rose-500/8 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      {actionSuccess ? (
        <div className="rounded-[22px] border border-emerald-500/15 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
          {actionSuccess}
        </div>
      ) : null}

      <Card className="space-y-5 border border-stone-900/8 bg-white/88">
        <div className="grid gap-4 lg:grid-cols-[1fr_240px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              label="Buscar"
              placeholder="Codigo, nombre o telefono"
              className="pl-10"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>

          <SelectField
            label="Estado"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | OrderStatus)
            }
          >
            {orderStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>

          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              className="w-full lg:w-auto"
              onClick={() => void reloadPage()}
            >
              <RefreshCw className="h-4 w-4" />
              Recargar
            </Button>
          </div>
        </div>
      </Card>

      {orders.length === 0 ? (
        <EmptyState
          title="Todavia no hay pedidos generados"
          description="Los pedidos apareceran aqui cuando un cliente complete el checkout y envie su pedido por WhatsApp."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => void reloadPage()}
            >
              Revisar nuevamente
            </Button>
          }
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="No encontramos pedidos con ese filtro"
          description="Prueba otro estado, otro termino de busqueda o limpia los filtros para volver al listado completo."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSearchValue('')
                setStatusFilter('all')
              }}
            >
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="space-y-4 border border-stone-900/8 bg-white/88">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-stone-950">Listado</p>
                <p className="text-sm text-muted">
                  {filteredOrders.length} pedido
                  {filteredOrders.length === 1 ? '' : 's'} visibles.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`w-full rounded-[24px] border p-4 text-left transition ${
                    selectedOrder?.id === order.id
                      ? 'border-stone-950 bg-stone-950 text-white shadow-[0_22px_44px_rgba(23,16,12,0.18)]'
                      : 'border-stone-900/8 bg-stone-50/85 text-stone-950 hover:border-stone-900/14'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold tracking-[-0.02em]">
                        {order.order_code}
                      </p>
                      <p
                        className={`text-sm ${
                          selectedOrder?.id === order.id
                            ? 'text-white/75'
                            : 'text-muted'
                        }`}
                      >
                        {order.customer_name} | {order.customer_phone}
                      </p>
                    </div>

                    <StatusBadge
                      tone={orderStatusTone(order.status)}
                      className={
                        selectedOrder?.id === order.id
                          ? 'border-white/12 bg-white/10 text-white'
                          : ''
                      }
                    >
                      {formatOrderStatus(order.status)}
                    </StatusBadge>
                  </div>

                  <div
                    className={`mt-4 grid gap-2 text-sm sm:grid-cols-3 ${
                      selectedOrder?.id === order.id
                        ? 'text-white/78'
                        : 'text-muted'
                    }`}
                  >
                    <span>{order.itemCount} item{order.itemCount === 1 ? '' : 's'}</span>
                    <span>{formatCurrency(order.total)}</span>
                    <span>{formatDateTime(order.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {selectedOrder ? (
            <Card className="space-y-6 border border-stone-900/8 bg-white/88">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-2xl font-semibold tracking-[-0.04em] text-stone-950">
                      {selectedOrder.order_code}
                    </p>
                    <StatusBadge tone={orderStatusTone(selectedOrder.status)}>
                      {formatOrderStatus(selectedOrder.status)}
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-muted">
                    Creado el {formatDateTime(selectedOrder.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={buildWhatsAppUrl(
                      selectedOrder.customer_phone,
                      selectedOrderMessage,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-success px-4 text-sm font-medium text-white transition hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Abrir WhatsApp del cliente
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void copyMessage(selectedOrder)}
                  >
                    <Copy className="h-4 w-4" />
                    Copiar resumen
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[24px] border border-stone-900/8 bg-stone-50/80 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">
                    Cliente
                  </p>
                  <div className="mt-3 space-y-1 text-sm text-stone-950">
                    <p>{selectedOrder.customer_name}</p>
                    <p>{selectedOrder.customer_phone}</p>
                    <p className="text-muted">
                      {selectedOrder.customer_message || 'Sin mensaje adicional.'}
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-stone-900/8 bg-stone-50/80 p-4">
                  <SelectField
                    label="Cambiar estado"
                    value={selectedOrder.status}
                    disabled={busyOrderId === selectedOrder.id}
                    onChange={(event) =>
                      void updateOrderStatus(
                        selectedOrder,
                        event.target.value as OrderStatus,
                      )
                    }
                  >
                    {orderStatusOptions
                      .filter((option) => option.value !== 'all')
                      .map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                  </SelectField>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    Entregado / Pagado manualmente solo marca cierre operativo.
                    No registra pagos online ni reemplaza la coordinacion por WhatsApp.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-stone-950">Items del pedido</p>
                {selectedOrder.items.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-stone-900/10 bg-stone-50/80 px-4 py-8 text-sm text-muted">
                    Este pedido no tiene items asociados.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 rounded-[22px] border border-stone-900/8 bg-stone-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-stone-950">
                            {item.product_name}
                          </p>
                          <p className="text-sm text-muted">
                            {item.quantity} x {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-stone-950">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                <div className="rounded-[24px] border border-stone-900/8 bg-stone-50/80 p-4">
                  <p className="text-sm font-medium text-stone-950">
                    Resumen para copiar o enviar
                  </p>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-stone-700">
                    {selectedOrderMessage}
                  </pre>
                </div>

                <div className="rounded-[24px] border border-stone-900/8 bg-stone-950 px-5 py-4 text-white">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                    Total
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                    {formatCurrency(selectedOrder.total)}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  )
}
