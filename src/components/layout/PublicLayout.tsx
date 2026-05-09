import { MessageCircle } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { buttonStyles } from '@/components/ui/buttonStyles'
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
          className={buttonStyles({
            variant: 'whatsapp',
            className:
              'fixed right-4 bottom-4 z-20 h-14 w-14 rounded-full border border-white/12 p-0 shadow-[0_20px_34px_rgba(22,130,93,0.3)] sm:right-6 sm:bottom-6',
          })}
          aria-label="Abrir WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
      ) : null}
    </div>
  )
}
