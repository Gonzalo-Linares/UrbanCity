import { Menu, LogOut, RefreshCw, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AdminAccessState } from '@/components/admin/AdminAccessState'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { useAuth } from '@/hooks/useAuth'
import { useAdminShellData } from '@/hooks/useAdminShellData'

const pageTitles: Record<string, string> = {
  '/admin': 'Resumen general',
  '/admin/productos': 'Productos',
  '/admin/categorias': 'Categorias',
  '/admin/pedidos': 'Pedidos',
  '/admin/configuracion': 'Configuracion',
}

function AdminShell() {
  const location = useLocation()
  const { signOut, user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const adminData = useAdminShellData()
  const currentTitle = pageTitles[location.pathname] ?? 'Panel admin'

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#050505_0%,#0c0c0c_18%,#151515_100%)] lg:grid lg:grid-cols-[18rem_1fr]">
      <AdminSidebar
        counts={adminData.counts}
        storeName={adminData.storeName}
        sessionEmail={user?.email ?? 'admin'}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050505]/88 backdrop-blur-xl">
          <div className="shell-container flex min-h-20 items-center justify-between gap-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir navegacion admin"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex min-w-0 items-center gap-3">
                <span className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-brand-strong sm:inline-flex">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold tracking-[-0.03em] text-white">
                    {adminData.storeName}
                  </p>
                  <p className="truncate text-sm text-white/62">{currentTitle}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 sm:flex">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-brand-strong" />
                <span className="text-sm text-white/70">Sesion activa</span>
                <span className="text-sm font-medium text-white">
                  {user?.email ?? 'admin'}
                </span>
              </div>

              <button
                type="button"
                onClick={adminData.refresh}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white transition hover:bg-white/10"
                aria-label="Actualizar datos del panel"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              <Link
                to="/"
                className="hidden text-sm text-white/68 hover:text-white sm:inline"
              >
                Ver tienda
              </Link>

              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/6 text-white hover:bg-white/10 hover:text-white"
                onClick={() => void signOut()}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Cerrar sesion</span>
              </Button>
            </div>
          </div>

          {adminData.error ? (
            <div className="shell-container pb-4">
              <div className="rounded-[20px] border border-amber-400/20 bg-amber-400/12 px-4 py-3 text-sm text-amber-100">
                {adminData.error}
              </div>
            </div>
          ) : null}
        </header>

        <main className="shell-container py-8 sm:py-10">
          <Outlet context={adminData} />
        </main>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const location = useLocation()
  const { error, isAdmin, isAuthenticated, loading, signOut } = useAuth()

  if (loading) {
    return <LoadingState label="Verificando acceso admin..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  if (!isAdmin) {
    return (
      <AdminAccessState
        title="No autorizado"
        description={
          error ??
          'Tu usuario esta autenticado, pero no tiene acceso habilitado al panel admin.'
        }
        action={
          <Button type="button" variant="secondary" onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </Button>
        }
      />
    )
  }

  return <AdminShell />
}
