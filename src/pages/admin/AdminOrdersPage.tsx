import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  MessageCircle,
  Search,
  ShoppingBag,
  Trash2,
} from 'lucide-react'
import { AdminMetricCard } from '@/components/admin/AdminMetricCard'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
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

type OrderStatusFilter = 'active' | 'all' | OrderStatus

const activeStatuses: OrderStatus[] = [
  'pending',
  'confirmed',
  'ready_for_pickup',
]

const orderStatusFilterOptions: Array<{
  value: OrderStatusFilter
  label: string
}> = [
  { value: 'active', label: 'Activos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'ready_for_pickup', label: 'Listo para retirar' },
  { value: 'completed', label: 'Entregados' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'all', label: 'Todos' },
]

const orderUpdateOptions: Array<{ value: OrderStatus; label: string }> = [
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
      return 'success'
    case 'cancelled':
      return 'danger'
    default:
      return 'muted'
  }
}

function orderStatusCompactLabel(status: OrderStatus) {
  if (status === 'completed') {
    return 'Entregado'
  }

  return formatOrderStatus(status)
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
        `- ${item.product_name}${
          item.size_label ? ` - Talle ${item.size_label}` : ''
        } x${item.quantity} | ${formatCurrency(item.subtotal)}`,
    ),
    '',
    `Total: ${formatCurrency(order.total)}`,
  ]

  if (order.status === 'pending') {
    lines.push('Estamos revisando disponibilidad y te confirmamos por este medio.')
  }

  if (order.status === 'confirmed') {
    lines.push('Tu pedido ya fue confirmado. Te avisamos cuando esté listo.')
  }

  if (order.status === 'ready_for_pickup') {
    lines.push('Tu pedido está listo para retirar. Coordinamos retiro y pago por WhatsApp.')
  }

  if (order.status === 'completed') {
    lines.push('Marcamos tu pedido como entregado/pagado manualmente. Gracias por tu compra.')
  }

  if (order.status === 'cancelled') {
    lines.push('Tu pedido fue cancelado. Si querés, podemos ayudarte a armar uno nuevo.')
  }

  return lines.join('\n')
}

function buildVisibleOrdersLabel(
  statusFilter: OrderStatusFilter,
  count: number,
) {
  if (statusFilter === 'active') {
    return `${count} pedido${count === 1 ? '' : 's'} activo${count === 1 ? '' : 's'}`
  }

  if (statusFilter === 'all') {
    return `${count} pedido${count === 1 ? '' : 's'} visible${count === 1 ? '' : 's'}`
  }

  switch (statusFilter) {
    case 'pending':
      return `${count} pedido${count === 1 ? '' : 's'} pendiente${count === 1 ? '' : 's'}`
    case 'confirmed':
      return `${count} pedido${count === 1 ? '' : 's'} confirmado${count === 1 ? '' : 's'}`
    case 'ready_for_pickup':
      return `${count} listo${count === 1 ? '' : 's'} para retirar`
    case 'completed':
      return `${count} pedido${count === 1 ? '' : 's'} entregado${count === 1 ? '' : 's'}`
    case 'cancelled':
      return `${count} pedido${count === 1 ? '' : 's'} cancelado${count === 1 ? '' : 's'}`
    default:
      return `${count} pedido${count === 1 ? '' : 's'}`
  }
}

function getEmptyStateCopy(
  statusFilter: OrderStatusFilter,
  hasSearch: boolean,
) {
  if (hasSearch) {
    return {
      title: 'No encontramos pedidos con ese filtro',
      description: 'Probá otra búsqueda o cambia el estado seleccionado.',
    }
  }

  switch (statusFilter) {
    case 'active':
      return {
        title: 'No hay pedidos activos',
        description:
          'Los pedidos pendientes, confirmados o listos para retirar aparecerán acá.',
      }
    case 'completed':
      return {
        title: 'No hay pedidos entregados',
        description:
          'Los pedidos marcados como entregados o pagados manualmente aparecerán acá.',
      }
    case 'cancelled':
      return {
        title: 'No hay pedidos cancelados',
        description: 'Los pedidos cancelados aparecerán acá cuando existan.',
      }
    case 'pending':
      return {
        title: 'No hay pedidos pendientes',
        description: 'Los nuevos pedidos aparecerán acá para poder confirmarlos.',
      }
    case 'confirmed':
      return {
        title: 'No hay pedidos confirmados',
        description: 'Los pedidos confirmados aparecerán acá hasta quedar listos.',
      }
    case 'ready_for_pickup':
      return {
        title: 'No hay pedidos listos para retirar',
        description:
          'Los pedidos listos para retirar aparecerán acá para marcar la entrega.',
      }
    default:
      return {
        title: 'Todavía no hay pedidos',
        description: 'Los pedidos aparecerán acá cuando un cliente termine su pedido.',
      }
  }
}

function getQuickAction(order: OrderListItem) {
  if (order.status === 'pending') {
    return {
      label: 'Confirmar',
      nextStatus: 'confirmed' as OrderStatus,
    }
  }

  if (order.status === 'confirmed') {
    return {
      label: 'Listo',
      nextStatus: 'ready_for_pickup' as OrderStatus,
    }
  }

  if (order.status === 'ready_for_pickup') {
    return {
      label: 'Entregado',
      nextStatus: 'completed' as OrderStatus,
    }
  }

  return null
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
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('active')
  const [searchValue, setSearchValue] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
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
        client.from('orders').select('*').order('created_at', { ascending: false }),
        client.from('order_items').select('*').order('created_at', { ascending: true }),
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
      setExpandedOrderId((current) =>
        current && nextOrders.some((order) => order.id === current) ? current : null,
      )
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
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? activeStatuses.includes(order.status)
            : order.status === statusFilter

      const matchesSearch =
        normalizedSearch.length === 0 ||
        order.order_code.toLowerCase().includes(normalizedSearch) ||
        order.customer_name.toLowerCase().includes(normalizedSearch) ||
        order.customer_phone.toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [deferredSearch, orders, statusFilter])

  if (loading || pageLoading) {
    return <LoadingState label="Cargando pedidos..." />
  }

  async function reloadPage() {
    setReloadKey((current) => current + 1)
    refresh()
  }

  async function updateOrderStatus(order: OrderListItem, status: OrderStatus) {
    if (!supabase || status === order.status) {
      return
    }

    if (
      typeof window !== 'undefined' &&
      status === 'cancelled' &&
      !window.confirm(`¿Cancelar definitivamente el pedido ${order.order_code}?`)
    ) {
      return
    }

    if (
      typeof window !== 'undefined' &&
      status === 'completed' &&
      !window.confirm('¿Marcar este pedido como entregado/pagado?')
    ) {
      return
    }

    setBusyOrderId(order.id)
    setActionError(null)
    setActionSuccess(null)

    const { error } = await supabase.from('orders').update({ status }).eq('id', order.id)

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

    setActionSuccess(`Pedido ${order.order_code} actualizado a ${formatOrderStatus(status)}.`)
    await reloadPage()
  }

  async function deleteOrder(order: OrderListItem) {
    if (!supabase) {
      return
    }

    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        `¿Eliminar definitivamente el pedido ${order.order_code}? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }

    setBusyOrderId(order.id)
    setActionError(null)
    setActionSuccess(null)

    const deleteItemsResult = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', order.id)

    if (deleteItemsResult.error) {
      setBusyOrderId(null)
      setActionError(
        `No se pudo eliminar ${order.order_code}. ${formatCrudError(
          deleteItemsResult.error.message,
          deleteItemsResult.error.code,
        )}`,
      )
      return
    }

    const deleteOrderResult = await supabase.from('orders').delete().eq('id', order.id)

    setBusyOrderId(null)

    if (deleteOrderResult.error) {
      setActionError(
        `No se pudo eliminar ${order.order_code}. ${formatCrudError(
          deleteOrderResult.error.message,
          deleteOrderResult.error.code,
        )}`,
      )
      return
    }

    setActionSuccess(`Pedido ${order.order_code} eliminado correctamente.`)
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

  const emptyStateCopy = getEmptyStateCopy(
    statusFilter,
    deferredSearch.trim().length > 0,
  )

  return (
    <div className="space-y-5 sm:space-y-8">
      <AdminPageHeader
        eyebrow="Pedidos"
        title="Gestioná tus ventas"
        description="Revisá pedidos y actualizá estados."
        hideDescriptionOnMobile
        variant="compact"
      />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        <AdminMetricCard
          title="Activos"
          value={counts.ordersPending + counts.ordersConfirmed + counts.ordersReady}
          description="Pendientes, confirmados y listos."
          icon={ShoppingBag}
        />
        <AdminMetricCard
          title="Pendientes"
          value={counts.ordersPending}
          description="Para revisar"
          icon={Clock3}
        />
        <AdminMetricCard
          title="En curso"
          value={counts.ordersConfirmed + counts.ordersReady}
          description="Confirmados y listos"
          icon={CheckCheck}
        />
        <AdminMetricCard
          title="Entregados"
          value={counts.ordersCompleted}
          description="Ventas cerradas"
          icon={CheckCircle2}
        />
      </div>

      {pageError ? (
        <div className="rounded-[18px] border border-rose-500/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {pageError}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-[18px] border border-rose-500/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {actionError}
        </div>
      ) : null}

      {actionSuccess ? (
        <div className="rounded-[18px] border border-emerald-500/18 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {actionSuccess}
        </div>
      ) : null}

      <Card className="space-y-3 border border-white/10 bg-[#111111] p-3 text-white shadow-none sm:p-5 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)] [&_label>span]:text-white [&_label>p]:text-white/54 [&_select]:border-white/10 [&_select]:bg-[#0d0d0d] [&_select]:text-white">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <label className="block min-w-0 space-y-2">
            <span className="text-sm font-medium text-white">Buscar</span>
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Código, nombre o teléfono"
                className="h-11 w-full rounded-2xl border border-white/10 bg-[#0d0d0d] pl-10 pr-3 text-sm text-white placeholder:text-white/32"
              />
            </div>
          </label>

          <SelectField
            label="Estado"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as OrderStatusFilter)
            }
          >
            {orderStatusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </div>
      </Card>

      {orders.length === 0 ? (
        <EmptyState
          title="Todavía no hay pedidos"
          description="Los pedidos aparecerán acá cuando un cliente termine su pedido."
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title={emptyStateCopy.title}
          description={emptyStateCopy.description}
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSearchValue('')
                setStatusFilter('active')
              }}
            >
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <Card className="space-y-4 border border-white/10 bg-[#111111] p-3.5 text-white shadow-none sm:p-6 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
          <div>
            <p className="text-sm font-medium text-white">Listado</p>
            <p className="text-sm text-white/58">
              {buildVisibleOrdersLabel(statusFilter, filteredOrders.length)}.
            </p>
          </div>

          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id
              const orderMessage =
                order.whatsapp_message?.trim() ||
                buildCustomerFollowUpMessage(order, storeName, order.items)
              const quickAction = getQuickAction(order)

              return (
                <div
                  key={order.id}
                  className="rounded-[18px] border border-white/10 bg-black/20 p-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-base font-semibold tracking-[-0.03em] text-white">
                          {order.order_code}
                        </p>
                        <p className="truncate text-sm text-white/70">{order.customer_name}</p>
                      </div>

                      <StatusBadge
                        tone={orderStatusTone(order.status)}
                        className={
                          order.status === 'completed'
                            ? 'border-emerald-400/20 bg-emerald-500/14 text-emerald-200'
                            : undefined
                        }
                      >
                        {orderStatusCompactLabel(order.status)}
                      </StatusBadge>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-xs text-white/58 sm:grid-cols-4 sm:text-sm">
                      <span>{formatCurrency(order.total)}</span>
                      <span>{order.itemCount} item{order.itemCount === 1 ? '' : 's'}</span>
                      <span className="truncate">{order.customer_phone}</span>
                      <span>{formatDateTime(order.created_at)}</span>
                    </div>

                    <div className="grid gap-2 sm:flex sm:flex-wrap">
                      {quickAction ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full sm:w-auto"
                          disabled={busyOrderId === order.id}
                          onClick={() =>
                            void updateOrderStatus(order, quickAction.nextStatus)
                          }
                        >
                          {quickAction.label}
                        </Button>
                      ) : null}

                      <a
                        href={buildWhatsAppUrl(order.customer_phone, orderMessage)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-success px-4 text-sm font-medium text-white transition hover:bg-emerald-700 sm:w-auto"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </a>

                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full px-3 text-white/72 hover:bg-white/8 hover:text-white sm:w-auto"
                        onClick={() =>
                          setExpandedOrderId((current) =>
                            current === order.id ? null : order.id,
                          )
                        }
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        {isExpanded ? 'Ocultar' : 'Ver detalle'}
                      </Button>
                    </div>

                    {isExpanded ? (
                      <div className="space-y-4 border-t border-white/10 pt-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[16px] border border-white/10 bg-[#0d0d0d] p-3.5 text-sm">
                            <p className="text-[0.62rem] uppercase tracking-[0.18em] text-white/40">
                              Cliente
                            </p>
                            <div className="mt-2 space-y-1 text-white">
                              <p>{order.customer_name}</p>
                              <p>{order.customer_phone}</p>
                              <p className="text-white/56">
                                {order.customer_message || 'Sin mensaje adicional.'}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-[16px] border border-white/10 bg-[#0d0d0d] p-3.5 [&_label>span]:text-white [&_label>p]:text-white/54 [&_select]:border-white/10 [&_select]:bg-black/20 [&_select]:text-white">
                            <SelectField
                              label="Cambiar estado"
                              value={order.status}
                              disabled={busyOrderId === order.id}
                              onChange={(event) =>
                                void updateOrderStatus(
                                  order,
                                  event.target.value as OrderStatus,
                                )
                              }
                            >
                              {orderUpdateOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </SelectField>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-white">Items</p>
                          {order.items.length === 0 ? (
                            <div className="rounded-[16px] border border-dashed border-white/12 bg-[#0d0d0d] px-4 py-4 text-sm text-white/58">
                              Este pedido no tiene items asociados.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex flex-col gap-1.5 rounded-[16px] border border-white/10 bg-[#0d0d0d] p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div>
                                    <p className="font-medium text-white">{item.product_name}</p>
                                    <p className="text-white/56">
                                      {item.quantity} x {formatCurrency(item.unit_price)}
                                    </p>
                                    {item.size_label ? (
                                      <p className="text-white/48">Talle: {item.size_label}</p>
                                    ) : null}
                                  </div>
                                  <p className="font-semibold text-white">
                                    {formatCurrency(item.subtotal)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="rounded-[16px] border border-white/10 bg-[#0d0d0d] p-3.5">
                            <p className="text-sm font-medium text-white">Resumen para copiar</p>
                            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-white/74">
                              {orderMessage}
                            </pre>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => void copyMessage(order)}
                            >
                              <Copy className="h-4 w-4" />
                              Copiar resumen
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              className="border-rose-500/20 text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
                              disabled={busyOrderId === order.id}
                              onClick={() => void deleteOrder(order)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar pedido
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
