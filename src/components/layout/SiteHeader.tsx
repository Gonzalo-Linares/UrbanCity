import cityLogo from '@/assets/city-logo.jpg'
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
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050505]/94 backdrop-blur-xl">
      <div className="border-b border-white/8">
        <div className="shell-container flex min-h-11 items-center gap-3 text-xs text-white/68">
          <span className="inline-flex h-2 w-2 rounded-full bg-brand-strong" />
          <p className="truncate">
            Pedidos por WhatsApp. El pago y la disponibilidad se coordinan con el
            comercio.
          </p>
        </div>
      </div>

      <div className="shell-container flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="min-w-0">
            <div className="flex items-center gap-3">
              <img
                src={cityLogo}
                alt="City Calzado Urbano"
                className="h-12 w-12 rounded-full border border-white/10 object-cover shadow-[0_14px_34px_rgba(0,0,0,0.28)]"
              />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-[-0.03em] text-white">
                  {storeSettings.store_name || 'City Calzado Urbano'}
                </p>
                <p className="truncate text-xs uppercase tracking-[0.18em] text-white/48">
                  Sneakers y calzado urbano
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
                    'rounded-full border px-4 py-2 text-sm font-medium transition',
                    isActive
                      ? 'border-brand-strong bg-brand-strong text-black'
                      : 'border-white/10 text-white/72 hover:bg-white/6 hover:text-white',
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
                className={buttonStyles({ variant: 'outline', size: 'sm' })}
              >
                <AtSign className="h-4 w-4" />
                Instagram
              </a>
            ) : null}
            {hasWhatsApp ? (
              <a
                href={buildWhatsAppUrl(
                  storeSettings.whatsapp_phone,
                  'Hola, quiero consultar por calzado y stock disponible.',
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
              <span className="rounded-full bg-black px-2 py-0.5 text-[0.7rem] font-semibold text-brand-strong">
                {itemCount}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
