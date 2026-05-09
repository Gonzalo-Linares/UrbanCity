import cityLogo from '@/assets/city-logo.jpg'
import { AtSign, MapPin, MessageCircle, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

export function SiteFooter() {
  const { storeSettings } = useStorefrontData()
  const hasWhatsApp = Boolean(storeSettings.whatsapp_phone)

  return (
    <footer className="mt-14 border-t border-white/10 bg-[#050505]">
      <div className="shell-container grid gap-8 py-10 sm:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <img
              src={cityLogo}
              alt="City Calzado Urbano"
              className="h-14 w-14 rounded-full border border-white/10 object-cover"
            />
            <div className="space-y-1">
              <p className="eyebrow">City</p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                {storeSettings.store_name}
              </h2>
            </div>
          </div>

          <p className="max-w-xl text-sm leading-7 text-white/68">
            Catalogo, carrito y pedido por WhatsApp en un flujo simple para vender
            sin sumar capas innecesarias ni sugerir pagos online.
          </p>

          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/4 p-4 text-white/70">
              <div className="mb-3 flex items-center gap-2 text-white">
                <MapPin className="h-4 w-4 text-brand-strong" />
                <span className="text-xs uppercase tracking-[0.2em]">Zona</span>
              </div>
              <p>{storeSettings.address ?? 'Direccion a confirmar con el local.'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/4 p-4 text-white/70">
              <div className="mb-3 flex items-center gap-2 text-white">
                <Timer className="h-4 w-4 text-brand-strong" />
                <span className="text-xs uppercase tracking-[0.2em]">Horarios</span>
              </div>
              <p>{storeSettings.opening_hours ?? 'Consultanos horarios por WhatsApp.'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/4 p-4 text-white/70">
              <div className="mb-3 flex items-center gap-2 text-white">
                <MessageCircle className="h-4 w-4 text-brand-strong" />
                <span className="text-xs uppercase tracking-[0.2em]">Canal</span>
              </div>
              {hasWhatsApp ? (
                <a
                  href={buildWhatsAppUrl(
                    storeSettings.whatsapp_phone,
                    'Hola, quiero hacer una consulta.',
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  WhatsApp directo
                </a>
              ) : (
                <span>WhatsApp pendiente de configurar</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 text-sm text-white/68 sm:justify-self-end">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-white/42">Navegacion</p>
            <div className="grid gap-2">
              <Link to="/" className="hover:text-white">
                Inicio
              </Link>
              <Link to="/catalogo" className="hover:text-white">
                Catalogo
              </Link>
              <Link to="/carrito" className="hover:text-white">
                Carrito
              </Link>
              <Link to="/contacto" className="hover:text-white">
                Contacto
              </Link>
            </div>
          </div>

          {storeSettings.instagram_url ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/42">Redes</p>
              <a
                href={storeSettings.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-white"
              >
                <AtSign className="h-4 w-4" />
                Instagram
              </a>
            </div>
          ) : null}

          <div className="rounded-2xl border border-brand-strong/20 bg-brand-soft p-4 text-sm leading-6 text-white">
            Pedido por WhatsApp, pago coordinado con el comercio y disponibilidad
            confirmada de forma manual.
          </div>
        </div>
      </div>
    </footer>
  )
}
