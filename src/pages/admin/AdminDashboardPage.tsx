import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  HandCoins,
  ShoppingBag,
} from 'lucide-react'
import { AdminMetricCard } from '@/components/admin/AdminMetricCard'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/LoadingState'
import { useAuth } from '@/hooks/useAuth'
import { useAdminOutletData } from '@/hooks/useAdminShellData'
import { formatCurrency } from '@/lib/formatters'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { OrderItemRow, OrderRow } from '@/types/database'

interface TopSellingProduct {
  name: string
  quantity: number
  revenue: number
}

interface SalesSummaryState {
  todaySales: number
  todayCompletedCount: number
  monthSales: number
  monthCompletedCount: number
  averageTicket: number
  topProducts: TopSellingProduct[]
  loading: boolean
  error: string | null
  topProductsError: string | null
}

const emptySalesSummary: SalesSummaryState = {
  todaySales: 0,
  todayCompletedCount: 0,
  monthSales: 0,
  monthCompletedCount: 0,
  averageTicket: 0,
  topProducts: [],
  loading: isSupabaseConfigured,
  error: isSupabaseConfigured ? null : 'Configura Supabase para cargar ventas.',
  topProductsError: null,
}

function isSameLocalDay(value: string, currentDate: Date) {
  const date = new Date(value)

  return (
    date.getFullYear() === currentDate.getFullYear() &&
    date.getMonth() === currentDate.getMonth() &&
    date.getDate() === currentDate.getDate()
  )
}

function getMonthStartIso(currentDate: Date) {
  return new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
    0,
    0,
    0,
    0,
  ).toISOString()
}

export function AdminDashboardPage() {
  const { adminUser, user } = useAuth()
  const { counts, loading } = useAdminOutletData()
  const [salesSummary, setSalesSummary] = useState<SalesSummaryState>(emptySalesSummary)

  const activeOrdersCount =
    counts.ordersPending + counts.ordersConfirmed + counts.ordersReady

  const pendingActions = useMemo(
    () => [
      { label: 'Pendientes', value: counts.ordersPending },
      { label: 'Confirmados', value: counts.ordersConfirmed },
      { label: 'Listos', value: counts.ordersReady },
    ],
    [counts.ordersConfirmed, counts.ordersPending, counts.ordersReady],
  )

  useEffect(() => {
    if (!supabase) {
      return
    }

    const client = supabase
    let ignore = false

    async function loadSalesSummary() {
      const now = new Date()

      setSalesSummary((current) => ({
        ...current,
        loading: true,
        error: null,
        topProductsError: null,
      }))

      const completedOrdersResult = await client
        .from('orders')
        .select('id, total, created_at')
        .eq('status', 'completed')
        .gte('created_at', getMonthStartIso(now))

      if (ignore) {
        return
      }

      if (completedOrdersResult.error) {
        setSalesSummary({
          ...emptySalesSummary,
          loading: false,
          error: 'No se pudieron cargar las ventas del mes.',
          topProductsError: 'No se pudieron cargar los productos más pedidos.',
        })
        return
      }

      const completedOrders = (completedOrdersResult.data ?? []) as Pick<
        OrderRow,
        'id' | 'total' | 'created_at'
      >[]

      const monthSales = completedOrders.reduce((sum, order) => sum + order.total, 0)
      const todayCompletedOrders = completedOrders.filter((order) =>
        isSameLocalDay(order.created_at, now),
      )
      const todaySales = todayCompletedOrders.reduce(
        (sum, order) => sum + order.total,
        0,
      )
      const averageTicket =
        completedOrders.length > 0 ? monthSales / completedOrders.length : 0

      const orderIds = completedOrders.map((order) => order.id)
      let topProducts: TopSellingProduct[] = []
      let topProductsError: string | null = null

      if (orderIds.length > 0) {
        const itemsResult = await client
          .from('order_items')
          .select('order_id, product_name, quantity, subtotal')
          .in('order_id', orderIds)

        if (ignore) {
          return
        }

        if (itemsResult.error) {
          topProductsError = 'No se pudieron cargar los productos más pedidos.'
        } else {
          const groupedItems = new Map<string, TopSellingProduct>()

          for (const item of (itemsResult.data ?? []) as Pick<
            OrderItemRow,
            'product_name' | 'quantity' | 'subtotal'
          >[]) {
            const currentItem = groupedItems.get(item.product_name)

            if (currentItem) {
              currentItem.quantity += item.quantity
              currentItem.revenue += item.subtotal
              continue
            }

            groupedItems.set(item.product_name, {
              name: item.product_name,
              quantity: item.quantity,
              revenue: item.subtotal,
            })
          }

          topProducts = Array.from(groupedItems.values())
            .sort(
              (left, right) =>
                right.quantity - left.quantity ||
                right.revenue - left.revenue ||
                left.name.localeCompare(right.name, 'es'),
            )
            .slice(0, 5)
        }
      }

      setSalesSummary({
        todaySales,
        todayCompletedCount: todayCompletedOrders.length,
        monthSales,
        monthCompletedCount: completedOrders.length,
        averageTicket,
        topProducts,
        loading: false,
        error: null,
        topProductsError,
      })
    }

    void loadSalesSummary()

    return () => {
      ignore = true
    }
  }, [])

  if (loading || salesSummary.loading) {
    return <LoadingState label="Cargando resumen del panel..." />
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <AdminPageHeader
        eyebrow="Resumen"
        title="Panel de control"
        description="Vista rápida de ventas, catálogo y pedidos."
        hideDescriptionOnMobile
        variant="compact"
      />

      {salesSummary.error ? (
        <div className="rounded-[18px] border border-rose-500/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {salesSummary.error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        <AdminMetricCard
          title="Ventas de hoy"
          value={formatCurrency(salesSummary.todaySales)}
          description={`${salesSummary.todayCompletedCount} entregado${salesSummary.todayCompletedCount === 1 ? '' : 's'} hoy`}
          icon={CheckCircle2}
        />
        <AdminMetricCard
          title="Ventas del mes"
          value={formatCurrency(salesSummary.monthSales)}
          description={`${salesSummary.monthCompletedCount} venta${salesSummary.monthCompletedCount === 1 ? '' : 's'} completada${salesSummary.monthCompletedCount === 1 ? '' : 's'}`}
          icon={HandCoins}
        />
        <AdminMetricCard
          title="Ticket promedio"
          value={formatCurrency(salesSummary.averageTicket)}
          description="Solo pedidos entregados."
          icon={ShoppingBag}
        />
        <AdminMetricCard
          title="Pedidos activos"
          value={activeOrdersCount}
          description={`Pendientes: ${counts.ordersPending}`}
          icon={Clock3}
        />
      </div>

      <div className="grid gap-3 sm:gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border border-white/10 bg-[#111111] p-3.5 text-white shadow-none sm:p-5 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-white">Productos más pedidos</p>
              <p className="mt-1 text-sm text-white/58">
                Top 5 de pedidos entregados durante este mes.
              </p>
            </div>

            {salesSummary.topProductsError ? (
              <div className="rounded-[16px] border border-rose-500/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {salesSummary.topProductsError}
              </div>
            ) : salesSummary.topProducts.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-white/12 bg-black/20 px-4 py-4 text-sm text-white/58">
                Todavía no hay ventas completadas este mes.
              </div>
            ) : (
              <div className="space-y-2">
                {salesSummary.topProducts.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center justify-between gap-3 rounded-[16px] border border-white/10 bg-black/20 px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {index + 1}. {product.name}
                      </p>
                      <p className="text-sm text-white/58">
                        {product.quantity} unidades · {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-3 sm:space-y-5">
          <Card className="border border-white/10 bg-[#111111] p-3.5 text-white shadow-none sm:p-5 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-white">Acciones pendientes</p>
                <p className="mt-1 text-sm text-white/58">
                  Pedidos que requieren seguimiento.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {pendingActions.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[14px] border border-white/10 bg-black/20 p-2.5 sm:rounded-[18px] sm:p-3.5"
                  >
                    <p className="text-[0.6rem] uppercase tracking-[0.16em] text-white/40">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="border border-white/10 bg-[#111111] p-3 text-white shadow-none sm:p-5 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
            <div className="rounded-[18px] border border-white/10 bg-black/20 p-3 text-sm">
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-white/40">
                Sesión activa
              </p>
              <p className="mt-1 truncate font-medium text-white">
                {user?.email ?? 'Sin email'}
              </p>
              <p className="mt-1 inline-flex items-center gap-2 text-xs text-brand-strong">
                <Clock3 className="h-3.5 w-3.5" />
                {adminUser?.is_active ? 'Admin activo' : 'Admin inactivo'}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
