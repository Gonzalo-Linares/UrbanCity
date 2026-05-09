import { AtSign, MapPin, MessageCircle, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

export function SiteFooter() {
  const { storeSettings } = useStorefrontData()
  const hasWhatsApp = Boolean(storeSettings.whatsapp_phone)

  return (
    <footer className="mt-12 border-t border-stone-900/8 bg-white/55">
      <div className="shell-container grid gap-8 py-10 sm:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <p className="eyebrow">UrbanCity</p>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-stone-950">
              {storeSettings.store_name}
            </h2>
            <p className="max-w-xl text-sm leading-7 text-muted">
              Tienda simple para compras resueltas por WhatsApp. Sin pagos
              integrados, con confirmacion manual del comercio.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-muted sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-2xl border border-stone-900/8 bg-white/75 p-4">
              <MapPin className="mt-0.5 h-4 w-4 text-brand" />
              <span>{storeSettings.address ?? 'Direccion a definir'}</span>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-stone-900/8 bg-white/75 p-4">
              <Timer className="mt-0.5 h-4 w-4 text-brand" />
              <span>{storeSettings.opening_hours ?? 'Horarios a definir'}</span>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-stone-900/8 bg-white/75 p-4">
              <MessageCircle className="mt-0.5 h-4 w-4 text-brand" />
              {hasWhatsApp ? (
                <a
                  href={buildWhatsAppUrl(
                    storeSettings.whatsapp_phone,
                    'Hola, quiero hacer una consulta.',
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-stone-950"
                >
                  WhatsApp directo
                </a>
              ) : (
                <span>WhatsApp pendiente de configurar</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 text-sm text-muted sm:justify-self-end">
          <div className="space-y-2">
            <p className="font-medium text-stone-950">Enlaces</p>
            <div className="grid gap-2">
              <Link to="/" className="hover:text-stone-950">
                Inicio
              </Link>
              <Link to="/catalogo" className="hover:text-stone-950">
                Catalogo
              </Link>
              <Link to="/carrito" className="hover:text-stone-950">
                Carrito
              </Link>
              <Link to="/contacto" className="hover:text-stone-950">
                Contacto
              </Link>
            </div>
          </div>
          {storeSettings.instagram_url ? (
            <div className="space-y-2">
              <p className="font-medium text-stone-950">Redes</p>
              <a
                href={storeSettings.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-stone-950"
              >
                <AtSign className="h-4 w-4" />
                Instagram
              </a>
            </div>
          ) : null}
          <div className="rounded-2xl border border-brand/12 bg-brand/7 p-4 text-sm leading-6 text-stone-700">
            Pedido pendiente de confirmacion. La disponibilidad y el pago se
            coordinan con el comercio.
          </div>
        </div>
      </div>
    </footer>
  )
}
