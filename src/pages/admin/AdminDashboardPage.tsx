import {
  CheckCircle2,
  Clock3,
  Package,
  ShoppingBag,
  Tags,
} from 'lucide-react'
import { AdminMetricCard } from '@/components/admin/AdminMetricCard'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/LoadingState'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { useAuth } from '@/hooks/useAuth'
import { useAdminOutletData } from '@/hooks/useAdminShellData'

export function AdminDashboardPage() {
  const { adminUser, user } = useAuth()
  const { counts, loading, storeName } = useAdminOutletData()

  if (loading) {
    return <LoadingState label="Cargando resumen del panel..." />
  }

  return (
    <div className="space-y-8">
      <section className="surface-panel p-6 sm:p-8 lg:p-10">
        <SectionTitle
          eyebrow="Admin"
          title={`Resumen de ${storeName}`}
          description="Vista operativa simple para saber si el catalogo, los pedidos y la configuracion base del comercio estan en orden."
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-4 md:grid-cols-2">
        <AdminMetricCard
          title="Productos"
          value={counts.productsTotal}
          description={`${counts.productsActive} activos y ${counts.productsSellable} listos para vender.`}
          icon={Package}
        />
        <AdminMetricCard
          title="Categorias"
          value={counts.categoriesTotal}
          description={`${counts.categoriesActive} activas para ordenar el catalogo.`}
          icon={Tags}
        />
        <AdminMetricCard
          title="Pedidos"
          value={counts.ordersTotal}
          description={`${counts.ordersPending} pendientes de confirmacion.`}
          icon={ShoppingBag}
        />
        <AdminMetricCard
          title="Listos para retirar"
          value={counts.ordersReady}
          description="Pedidos ya confirmados y preparados para cierre manual."
          icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border border-stone-900/8 bg-white/88">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-stone-950">
                Estado rapido de pedidos
              </p>
              <p className="mt-1 text-sm text-muted">
                Conteos basicos para priorizar seguimiento comercial.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Pendientes', counts.ordersPending],
                ['Confirmados', counts.ordersConfirmed],
                ['Listos para retirar', counts.ordersReady],
                ['Entregados/pagados', counts.ordersCompleted],
                ['Cancelados', counts.ordersCancelled],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[22px] border border-stone-900/8 bg-stone-50/80 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="border border-stone-900/8 bg-white/88">
          <div className="grid gap-4">
            <div>
              <p className="text-sm font-medium text-stone-950">Sesion</p>
              <p className="mt-1 text-sm text-muted">
                El acceso sigue limitado a Supabase Auth + admin activo.
              </p>
            </div>
            <div className="rounded-[22px] border border-stone-900/8 bg-stone-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">
                Email autenticado
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-950">
                {user?.email ?? 'Sin email'}
              </p>
            </div>
            <div className="rounded-[22px] border border-stone-900/8 bg-stone-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">
                Estado admin
              </p>
              <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-stone-950">
                <Clock3 className="h-4 w-4 text-emerald-600" />
                {adminUser?.is_active ? 'Activo' : 'Inactivo'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
