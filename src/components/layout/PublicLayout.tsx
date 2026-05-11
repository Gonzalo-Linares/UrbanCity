import { Outlet } from 'react-router-dom'
import whatsAppIcon from '@/assets/WhatsApp_icon.png'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

export function PublicLayout() {
  const { error, storeSettings } = useStorefrontData()
  const hasWhatsApp = Boolean(storeSettings.whatsapp_phone)

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
      <SiteFooter />

      {hasWhatsApp ? (
        <a
          href={buildWhatsAppUrl(
            storeSettings.whatsapp_phone,
            'Hola, quiero hacer una consulta sobre un producto.',
          )}
          target="_blank"
          rel="noreferrer"
          className="
            fixed right-4 bottom-4 z-40
            flex h-16 w-16 items-center justify-center
            overflow-hidden rounded-full
            bg-[#25D366]
            shadow-[0_18px_40px_rgba(37,211,102,0.35)]
            ring-1 ring-white/15
            transition duration-200
            hover:scale-105 hover:bg-[#1ebe5d]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-black
            sm:right-6 sm:bottom-6
          "
          aria-label="Abrir WhatsApp"
        >
          <img
            src={whatsAppIcon}
            alt=""
            aria-hidden="true"
            className="
              h-full w-full
              scale-[1.55]
              object-contain
              drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]
            "
          />
        </a>
      ) : null}
    </div>
  )
}
