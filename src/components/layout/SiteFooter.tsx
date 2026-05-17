import cityLogo from '@/assets/city-logo.jpg'
import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStorefrontData } from '@/hooks/useStorefrontData'

export function SiteFooter() {
  const { storeSettings } = useStorefrontData()

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
              <p className="text-xs text-white/54">Galería Provincial · San Juan</p>
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
            {storeSettings.address ? (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-strong" />
                {storeSettings.address}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-3 text-center text-xs text-white/50">
          {'City Calzado Urbano \u00b7 Galería Provincial \u00b7 San Juan'}
        </div>
      </div>
    </footer>
  )
}
