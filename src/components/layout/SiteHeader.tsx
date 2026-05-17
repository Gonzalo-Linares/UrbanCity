import cityLogo from '@/assets/city-logo.jpg'
import { Search, ShoppingBag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { SocialIcon } from '@/components/ui/SocialIcon'
import { cn } from '@/lib/cn'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import {
  CART_ADDED_EVENT,
  type CartAddedEventDetail,
} from '@/lib/cartEvents'
import { formatCurrency } from '@/lib/formatters'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { useCartStore } from '@/store/cartStore'

const promoStripItems = [
  '3 CUOTAS SIN INTERÉS',
  '20% OFF PAGO CONTADO',
  'BILLETERAS VIRTUALES CON 20% OFF',
  'PEDIDOS POR WHATSAPP',
]

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/contacto', label: 'Contacto' },
]

export function SiteHeader() {
  const { storeSettings } = useStorefrontData()
  const hasWhatsApp = Boolean(storeSettings.whatsapp_phone)
  const [lastAddedItem, setLastAddedItem] = useState<CartAddedEventDetail | null>(null)
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    function handleCartAdded(event: Event) {
      const customEvent = event as CustomEvent<CartAddedEventDetail>
      setLastAddedItem(customEvent.detail)
    }

    window.addEventListener(CART_ADDED_EVENT, handleCartAdded as EventListener)

    return () => {
      window.removeEventListener(CART_ADDED_EVENT, handleCartAdded as EventListener)
    }
  }, [])

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
              aria-label="Ir al catálogo para buscar productos"
              className="inline-flex h-11 w-full max-w-[290px] items-center gap-3 rounded-full border border-white/10 bg-[#111111] px-4 text-sm text-white/44 transition hover:bg-white/8 hover:text-white/62"
            >
              <Search className="h-4 w-4 text-white/54" />
              <span>¿Qué estás buscando?</span>
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
                  <p className="max-w-[180px] text-[0.58rem] uppercase leading-3 tracking-[0.10em] text-white/46 sm:max-w-none sm:text-[0.72rem] sm:tracking-[0.18em] lg:text-center">
                    Galería Provincial · San Juan
                  </p>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2 lg:justify-self-end">
              {storeSettings.instagram_url ? (
                <a
                  href={storeSettings.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/82 transition hover:border-white/18 hover:bg-white/10 hover:text-white sm:h-auto sm:w-auto sm:gap-2 sm:rounded-none sm:border-transparent sm:bg-transparent sm:text-white/72"
                >
                  <SocialIcon type="instagram" className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="hidden text-sm font-medium sm:inline">Instagram</span>
                </a>
              ) : null}

              {storeSettings.instagram_url ? (
                <span className="hidden h-4 w-px bg-white/12 sm:block" />
              ) : null}

              {hasWhatsApp ? (
                <a
                  href={buildWhatsAppUrl(
                    storeSettings.whatsapp_phone,
                    'Hola, quiero hacer una consulta.',
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden items-center gap-2 text-white/72 transition hover:text-white sm:inline-flex"
                >
                  <SocialIcon type="whatsapp" className="h-4 w-4" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </a>
              ) : null}

              {hasWhatsApp ? (
                <span className="hidden h-4 w-px bg-white/12 sm:block" />
              ) : null}

              <div className="relative">
                <Link
                  to="/carrito"
                  className="relative inline-flex h-9 min-w-[44px] items-center justify-center rounded-full border border-white/10 bg-white/6 px-2.5 text-white/82 transition hover:border-white/18 hover:bg-white/10 hover:text-white sm:h-auto sm:min-w-0 sm:gap-2 sm:rounded-none sm:border-transparent sm:bg-transparent sm:px-0 sm:text-white/72"
                  onClick={() => setLastAddedItem(null)}
                >
                  <ShoppingBag className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="hidden text-sm font-medium sm:inline">Carrito</span>
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-strong px-1.5 text-[0.65rem] font-bold text-black sm:static sm:ml-0 sm:h-5 sm:min-w-5">
                    {itemCount}
                  </span>
                </Link>

                {lastAddedItem ? (
                  <div className="absolute right-0 top-full z-50 mt-3 hidden w-[320px] rounded-[28px] border border-black/8 bg-[#f8f8f4] p-4 text-[#111111] shadow-[0_24px_54px_rgba(0,0,0,0.28)] md:block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#111111]/48">
                          ¡Agregado al carrito!
                        </p>
                        <p className="text-lg font-semibold tracking-[-0.03em] text-[#111111]">
                          {lastAddedItem.name}
                        </p>
                        {lastAddedItem.sizeLabel ? (
                          <p className="text-sm text-[#111111]/62">
                            Talle {lastAddedItem.sizeLabel}
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-[#111111]/60 transition hover:bg-black/5 hover:text-[#111111]"
                        onClick={() => setLastAddedItem(null)}
                        aria-label="Cerrar resumen del carrito"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      {lastAddedItem.imageUrl ? (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-black/8 bg-white">
                          <img
                            src={lastAddedItem.imageUrl}
                            alt=""
                            aria-hidden="true"
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] border border-black/8 bg-white text-[#111111]/42">
                          <ShoppingBag className="h-6 w-6" />
                        </div>
                      )}

                      <div className="min-w-0 space-y-1 text-sm text-[#111111]/70">
                        <p>
                          {lastAddedItem.quantity} x {formatCurrency(lastAddedItem.price)}
                        </p>
                        <p className="font-semibold text-[#111111]">
                          Total ({lastAddedItem.quantity}{' '}
                          {lastAddedItem.quantity === 1 ? 'producto' : 'productos'}):{' '}
                          {formatCurrency(lastAddedItem.price * lastAddedItem.quantity)}
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/carrito"
                      className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#111111] px-4 text-sm font-semibold text-white transition hover:bg-black"
                      onClick={() => setLastAddedItem(null)}
                    >
                      Ver carrito
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="lg:hidden">
            <Link
              to="/catalogo"
              aria-label="Ir al catálogo para buscar productos"
              className="inline-flex h-11 w-full items-center gap-3 rounded-full border border-white/10 bg-[#111111] px-4 text-sm text-white/44 transition hover:bg-white/8 hover:text-white/62"
            >
              <Search className="h-4 w-4 text-white/54" />
              <span>¿Qué estás buscando?</span>
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
