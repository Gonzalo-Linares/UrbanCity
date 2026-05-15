import {
  CheckCircle2,
  Clock3,
  Package,
  ShoppingBag,
  Tags,
} from 'lucide-react'
import { AdminMetricCard } from '@/components/admin/AdminMetricCard'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/LoadingState'
import { useAuth } from '@/hooks/useAuth'
import { useAdminOutletData } from '@/hooks/useAdminShellData'

export function AdminDashboardPage() {
  const { adminUser, user } = useAuth()
  const { counts, loading } = useAdminOutletData()

  if (loading) {
    return <LoadingState label="Cargando resumen del panel..." />
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      <AdminPageHeader
        eyebrow="Resumen"
        title="Panel de control"
        description="Vista rápida de catálogo y pedidos."
        hideDescriptionOnMobile
        variant="compact"
      />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        <AdminMetricCard
          title="Productos"
          value={counts.productsTotal}
          description={`Activos: ${counts.productsActive}`}
          icon={Package}
        />
        <AdminMetricCard
          title="Categorías"
          value={counts.categoriesTotal}
          description={`Activas: ${counts.categoriesActive}`}
          icon={Tags}
        />
        <AdminMetricCard
          title="Pedidos"
          value={counts.ordersTotal}
          description={`Pendientes: ${counts.ordersPending}`}
          icon={ShoppingBag}
        />
        <AdminMetricCard
          title="Para retirar"
          value={counts.ordersReady}
          description={`Listos: ${counts.ordersReady}`}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-3 sm:gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border border-white/10 bg-[#111111] p-3.5 text-white shadow-none sm:p-5 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-white">Estado rápido de pedidos</p>
              <p className="mt-1 hidden text-sm text-white/58 sm:block">
                Lo esencial para priorizar el día.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                ['Pendientes', counts.ordersPending],
                ['Confirmados', counts.ordersConfirmed],
                ['Listos', counts.ordersReady],
                ['Entregados', counts.ordersCompleted],
                ['Cancelados', counts.ordersCancelled],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[14px] border border-white/10 bg-black/20 p-2.5 sm:rounded-[18px] sm:p-3.5"
                >
                  <p className="text-[0.6rem] uppercase tracking-[0.16em] text-white/40">
                    {label}
                  </p>
                  <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
                    {value}
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
  )
}
