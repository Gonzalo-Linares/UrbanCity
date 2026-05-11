import {
  LayoutGrid,
  Package,
  Settings,
  ShoppingBag,
  Tags,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import cityLogo from '@/assets/city-logo.jpg'
import { cn } from '@/lib/cn'
import type { AdminShellOutletContext } from '@/hooks/useAdminShellData'

interface AdminSidebarProps {
  counts: AdminShellOutletContext['counts']
  storeName: string
  sessionEmail: string
  mobileOpen: boolean
  onClose: () => void
}

const navItems = [
  {
    to: '/admin',
    label: 'Resumen',
    icon: LayoutGrid,
    badgeKey: null,
  },
  {
    to: '/admin/productos',
    label: 'Productos',
    icon: Package,
    badgeKey: 'productsTotal',
  },
  {
    to: '/admin/categorias',
    label: 'Categorías',
    icon: Tags,
    badgeKey: 'categoriesTotal',
  },
  {
    to: '/admin/pedidos',
    label: 'Pedidos',
    icon: ShoppingBag,
    badgeKey: 'ordersPending',
  },
  {
    to: '/admin/configuracion',
    label: 'Configuración',
    icon: Settings,
    badgeKey: null,
  },
] as const

export function AdminSidebar({
  counts,
  storeName,
  sessionEmail,
  mobileOpen,
  onClose,
}: AdminSidebarProps) {
  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 lg:px-6">
        <div className="space-y-3">
          <img
            src={cityLogo}
            alt="City Calzado Urbano"
            className="h-14 w-14 rounded-2xl border border-white/10 object-cover shadow-[0_20px_44px_rgba(0,0,0,0.35)]"
          />
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">
            Admin
          </p>
          <p className="text-lg font-semibold tracking-[-0.03em] text-white">
            {storeName}
          </p>
          <p className="text-xs text-white/55">Catálogo, pedidos y operación.</p>
          <p className="text-xs text-white/40">{sessionEmail}</p>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/10 lg:hidden"
          onClick={onClose}
          aria-label="Cerrar menú admin"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-5">
        {navItems.map((item) => {
          const Icon = item.icon
          const badgeValue =
            item.badgeKey === null ? null : counts[item.badgeKey]

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-strong text-black shadow-[0_18px_40px_rgba(0,0,0,0.26)]'
                    : 'text-white/72 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              {badgeValue !== null ? (
                <span className="rounded-full bg-black/10 px-2.5 py-1 text-xs text-current">
                  {badgeValue}
                </span>
              ) : null}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-5 text-sm leading-6 text-white/62">
        Los pedidos siguen siendo coordinados por WhatsApp. El panel solo ordena la operación.
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden min-h-screen border-r border-white/10 bg-stone-950 lg:flex lg:w-72 lg:flex-col">
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-stone-950/55 backdrop-blur-[2px]"
            onClick={onClose}
            aria-label="Cerrar navegación admin"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[86vw] max-w-sm flex-col bg-stone-950 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            {sidebarContent}
          </aside>
        </div>
      ) : null}
    </>
  )
}
