import { AtSign, MessageCircle, ShoppingBag } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { cn } from '@/lib/cn'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { useCartStore } from '@/store/cartStore'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/catalogo', label: 'Catalogo' },
  { to: '/contacto', label: 'Contacto' },
]

export function SiteHeader() {
  const { storeSettings } = useStorefrontData()
  const hasWhatsApp = Boolean(storeSettings.whatsapp_phone)
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  )

  return (
    <header className="sticky top-0 z-10 border-b border-stone-900/8 bg-white/72 backdrop-blur-xl">
      <div className="border-b border-stone-900/6">
        <div className="shell-container flex min-h-10 items-center gap-3 text-xs text-muted">
          <p className="truncate">
            Pedidos por WhatsApp. Pago manual y disponibilidad confirmada por el
            comercio.
          </p>
        </div>
      </div>

      <div className="shell-container flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-950 text-sm font-semibold text-white">
                UC
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-[-0.03em] text-stone-950">
                  {storeSettings.store_name || 'UrbanCity'}
                </p>
                <p className="truncate text-xs text-muted">
                  Curaduria simple para compras rapidas
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/carrito"
            className={cn(
              buttonStyles({ variant: 'outline', size: 'sm' }),
              'sm:hidden',
            )}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{itemCount}</span>
          </Link>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <nav className="flex flex-wrap gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-stone-950 text-white'
                      : 'text-stone-700 hover:bg-stone-900/6 hover:text-stone-950',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            {storeSettings.instagram_url ? (
              <a
                href={storeSettings.instagram_url}
                target="_blank"
                rel="noreferrer"
                className={buttonStyles({ variant: 'ghost', size: 'sm' })}
              >
                <AtSign className="h-4 w-4" />
                Instagram
              </a>
            ) : null}
            {hasWhatsApp ? (
              <a
                href={buildWhatsAppUrl(
                  storeSettings.whatsapp_phone,
                  'Hola, quiero hacer una consulta sobre un producto.',
                )}
                target="_blank"
                rel="noreferrer"
                className={buttonStyles({ variant: 'whatsapp', size: 'sm' })}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            ) : null}
            <Link
              to="/carrito"
              className={cn(
                buttonStyles({ variant: 'outline', size: 'sm' }),
                'hidden sm:inline-flex',
              )}
            >
              <ShoppingBag className="h-4 w-4" />
              Carrito
              <span className="rounded-full bg-stone-950 px-2 py-0.5 text-[0.7rem] font-semibold text-white">
                {itemCount}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
