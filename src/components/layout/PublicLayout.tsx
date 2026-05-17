import { Outlet, useLocation } from 'react-router-dom'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SocialIcon } from '@/components/ui/SocialIcon'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

export function PublicLayout() {
  const { error, storeSettings } = useStorefrontData()
  const location = useLocation()
  const hasWhatsApp = Boolean(storeSettings.whatsapp_phone)
  const hideFloatingWhatsApp =
    location.pathname.startsWith('/checkout') || location.pathname.startsWith('/carrito')
  const isProductDetailPage =
    location.pathname.startsWith('/catalogo/') && location.pathname !== '/catalogo'

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="shell-container py-6 sm:py-8">
        {error ? (
          <div className="mb-6 rounded-[24px] border border-amber-500/18 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
            {error}
          </div>
        ) : null}
        <Outlet />
      </main>
      {hasWhatsApp && !hideFloatingWhatsApp ? (
        <a
          href={buildWhatsAppUrl(
            storeSettings.whatsapp_phone,
            'Hola, quiero hacer una consulta.',
          )}
          target="_blank"
          rel="noreferrer"
          aria-label="Escribir por WhatsApp"
          className={`fixed right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_36px_rgba(37,211,102,0.28)] transition hover:scale-[1.03] hover:bg-[#1ebe5d] ${
            isProductDetailPage ? 'bottom-28 sm:bottom-5' : 'bottom-5'
          }`}
        >
          <SocialIcon type="whatsapp" className="h-7 w-7" />
        </a>
      ) : null}
      <SiteFooter />
    </div>
  )
}
