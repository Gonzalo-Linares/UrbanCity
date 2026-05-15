import cityLogo from '@/assets/city-logo.jpg'
import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SocialIcon } from '@/components/ui/SocialIcon'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

export function SiteFooter() {
  const { storeSettings } = useStorefrontData()
  const hasWhatsApp = Boolean(storeSettings.whatsapp_phone)

  return (
    <footer className="mt-10 border-t border-white/10 bg-[#050505]">
      <div className="shell-container py-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img
              src={cityLogo}
              alt="City Calzado Urbano"
              className="h-10 w-10 rounded-full border border-white/10 object-cover"
            />
            <div>
              <p className="text-sm font-semibold tracking-[-0.03em] text-white sm:text-base">
                {storeSettings.store_name || 'City Calzado Urbano'}
              </p>
              <p className="text-xs text-white/54">Sneakers y calzado urbano</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/66">
            <Link to="/" className="hover:text-white">
              Inicio
            </Link>
            <Link to="/catalogo" className="hover:text-white">
              {'Cat\u00e1logo'}
            </Link>
            <Link to="/contacto" className="hover:text-white">
              Contacto
            </Link>
            <Link to="/carrito" className="hover:text-white">
              Carrito
            </Link>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/66 md:justify-end">
            {hasWhatsApp ? (
              <a
                href={buildWhatsAppUrl(
                  storeSettings.whatsapp_phone,
                  'Hola, quiero hacer una consulta.',
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-white"
              >
                <SocialIcon type="whatsapp" className="h-4 w-4" />
                WhatsApp
              </a>
            ) : null}
            {storeSettings.instagram_url ? (
              <a
                href={storeSettings.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-white"
              >
                <SocialIcon type="instagram" className="h-4 w-4" />
                Instagram
              </a>
            ) : null}
            {storeSettings.address ? (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-strong" />
                {storeSettings.address}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-3 text-center text-xs text-white/50">
          {'Pedidos por WhatsApp \u00b7 Retiro coordinado \u00b7 City Calzado Urbano'}
        </div>
      </div>
    </footer>
  )
}
