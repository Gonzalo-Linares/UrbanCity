import type { ReactNode } from 'react'
import cityLogo from '@/assets/city-logo.jpg'
import { Search, ShoppingBag } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { SocialIcon } from '@/components/ui/SocialIcon'
import { cn } from '@/lib/cn'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { useCartStore } from '@/store/cartStore'

const promoStripItems = [
  '\ud83d\udcb3 3 CUOTAS SIN INTER\u00c9S',
  '\ud83d\udcb0 20% OFF PAGO CONTADO',
  '\ud83d\udcf2 BILLETERAS VIRTUALES CON 20% OFF',
  'PEDIDOS POR WHATSAPP',
]

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/catalogo', label: 'Cat\u00e1logo' },
  { to: '/contacto', label: 'Contacto' },
]

function HeaderAction({
  href,
  to,
  label,
  badge,
  icon,
  mobileLabel = false,
}: {
  href?: string
  to?: string
  label: string
  badge?: number
  icon: ReactNode
  mobileLabel?: boolean
}) {
  const content = (
    <>
      {icon}
      <span
        className={cn(
          'hidden text-sm font-medium sm:inline',
          mobileLabel && 'inline text-sm sm:inline',
        )}
      >
        {label}
      </span>
      {typeof badge === 'number' ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-strong px-1.5 text-[0.65rem] font-bold text-black">
          {badge}
        </span>
      ) : null}
    </>
  )

  const className =
    'inline-flex items-center gap-2 whitespace-nowrap text-white/72 transition hover:text-white'

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    )
  }

  return (
    <Link to={to ?? '/'} className={className}>
      {content}
    </Link>
  )
}

export function SiteHeader() {
  const { storeSettings } = useStorefrontData()
  const hasWhatsApp = Boolean(storeSettings.whatsapp_phone)
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  )

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/96 backdrop-blur-xl">
      <div className="promo-strip-full border-b border-black/10 bg-[#b6ff00] py-2 text-[#050505]">
        <div className="promo-strip-track">
          {[...promoStripItems, ...promoStripItems].map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex items-center gap-4 px-5 text-[0.68rem] font-semibold uppercase tracking-[0.28em]"
            >
              {item}
              <span className="h-1.5 w-1.5 rounded-full bg-[#050505]" />
            </span>
          ))}
        </div>
      </div>

      <div className="shell-container">
        <div className="grid min-h-[72px] items-center gap-4 py-3 lg:grid-cols-[1fr_auto_1fr] lg:gap-6 lg:py-0">
          <div className="hidden lg:block">
            <Link
              to="/catalogo"
              aria-label="Ir al cat\u00e1logo para buscar productos"
              className="inline-flex h-11 w-full max-w-[290px] items-center gap-3 rounded-full border border-white/10 bg-[#111111] px-4 text-sm text-white/44 transition hover:bg-white/8 hover:text-white/62"
            >
              <Search className="h-4 w-4 text-white/54" />
              <span>{'\u00bfQu\u00e9 est\u00e1s buscando?'}</span>
            </Link>
          </div>

          <div className="flex items-center justify-between gap-4 lg:contents">
            <Link to="/" className="min-w-0 lg:justify-self-center">
              <div className="flex items-center gap-3 lg:flex-col lg:gap-2">
                <img
                  src={cityLogo}
                  alt="City Calzado Urbano"
                  className="h-12 w-12 rounded-full border border-white/10 object-cover shadow-[0_14px_34px_rgba(0,0,0,0.28)] lg:h-14 lg:w-14"
                />
                <div className="min-w-0 lg:text-center">
                  <p className="truncate text-base font-semibold tracking-[-0.03em] text-white sm:text-lg">
                    {storeSettings.store_name || 'City Calzado Urbano'}
                  </p>
                  <p className="truncate text-[0.68rem] uppercase tracking-[0.18em] text-white/46 sm:text-[0.72rem]">
                    Sneakers y calzado urbano
                  </p>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2 lg:justify-self-end">
              {storeSettings.instagram_url ? (
                <HeaderAction
                  href={storeSettings.instagram_url}
                  label="Instagram"
                  icon={<SocialIcon type="instagram" className="h-4 w-4" />}
                  mobileLabel={false}
                />
              ) : null}

              {storeSettings.instagram_url ? (
                <span className="hidden h-4 w-px bg-white/12 sm:block" />
              ) : null}

              {hasWhatsApp ? (
                <HeaderAction
                  href={buildWhatsAppUrl(
                    storeSettings.whatsapp_phone,
                    'Hola, quiero consultar talles y disponibilidad.',
                  )}
                  label="WhatsApp"
                  icon={<SocialIcon type="whatsapp" className="h-4 w-4" />}
                  mobileLabel={false}
                />
              ) : null}

              {hasWhatsApp ? (
                <span className="hidden h-4 w-px bg-white/12 sm:block" />
              ) : null}

              <HeaderAction
                to="/carrito"
                label="Carrito"
                badge={itemCount}
                icon={<ShoppingBag className="h-4 w-4" />}
                mobileLabel={false}
              />
            </div>
          </div>

          <div className="lg:hidden">
            <Link
              to="/catalogo"
              aria-label="Ir al cat\u00e1logo para buscar productos"
              className="inline-flex h-11 w-full items-center gap-3 rounded-full border border-white/10 bg-[#111111] px-4 text-sm text-white/44 transition hover:bg-white/8 hover:text-white/62"
            >
              <Search className="h-4 w-4 text-white/54" />
              <span>{'\u00bfQu\u00e9 est\u00e1s buscando?'}</span>
            </Link>
          </div>
        </div>
      </div>

      <nav className="border-t border-white/10">
        <div className="shell-container flex justify-start gap-6 overflow-x-auto py-3 text-[0.85rem] uppercase tracking-[0.16em] [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden">
          {navLinks.map((link, index) => (
            <NavLink
              key={`${link.to}-${link.label}-${index}`}
              to={link.to}
              end
              className={({ isActive }) =>
                cn(
                  'border-b-2 border-transparent pb-2 whitespace-nowrap text-white/70 transition hover:text-white',
                  isActive
                    ? 'border-brand-strong text-brand-strong'
                    : 'hover:border-white/10',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
