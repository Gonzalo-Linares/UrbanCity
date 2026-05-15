import { MapPin, Timer } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SocialIcon } from '@/components/ui/SocialIcon'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

export function ContactPage() {
  const { storeSettings } = useStorefrontData()
  const hasWhatsApp = Boolean(storeSettings.whatsapp_phone)
  const instagramUrl =
    storeSettings.instagram_url?.trim() ||
    'https://www.instagram.com/citycalzadourbano/'
  const fallbackAddress =
    'Galería Provincial, General Acha 172 Sur, San Juan, Argentina'
  const fallbackEmbedUrl =
    'https://www.google.com/maps?q=-31.5368791,-68.5240926&z=18&output=embed'
  const fallbackPlaceUrl =
    'https://www.google.com/maps/place/Galer%C3%ADa+Provincial/@-31.5318519,-68.5324635,14870m/data=!3m1!1e3!4m6!3m5!1s0x96816b81c8db64d1:0xf4ab9011369707b3!8m2!3d-31.5368791!4d-68.5240926!16s%2Fg%2F11h1b08m_y?entry=ttu&g_ep=EgoyMDI2MDUwNi4wIKXMDSoASAFQAw%3D%3D'
  const normalizedAddress = storeSettings.address?.trim()
  const address = normalizedAddress || fallbackAddress
  const embeddedMapUrl = fallbackEmbedUrl
  const openMapUrl = fallbackPlaceUrl

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="surface-panel p-5 sm:p-8 lg:p-10">
        <SectionTitle
          eyebrow="Contacto"
          title="Visitá City Calzado Urbano"
          description="Encontrá la ubicación, horarios y redes del local."
          tone="light"
        />
      </section>

      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#111111]">
        <div className="space-y-4 p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-strong/76">
                Ubicación
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
                Encontranos en el local
              </h2>
              <p className="text-sm leading-6 text-white/68 sm:leading-7">
                {address}
              </p>
            </div>

            <a
              href={openMapUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({ variant: 'outline' })}
            >
              <MapPin className="h-4 w-4" />
              Abrir en Google Maps
            </a>
          </div>

          <div className="min-h-[260px] overflow-hidden rounded-[24px] border border-white/10 sm:min-h-[360px] sm:rounded-[28px]">
            <iframe
              title="Ubicación de City Calzado Urbano"
              src={embeddedMapUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[260px] w-full bg-[#0c0c0c] sm:min-h-[360px]"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Card className="space-y-2.5 border border-white/10 bg-[#151515] p-4 sm:space-y-3 sm:p-5">
          <MapPin className="h-4 w-4 text-brand-strong sm:h-5 sm:w-5" />
          <h2 className="text-base font-semibold tracking-[-0.03em] text-white sm:text-lg">
            Dirección
          </h2>
          <p className="text-xs leading-6 text-white/68 sm:text-sm sm:leading-7">
            {address}
          </p>
        </Card>

        <Card className="space-y-2.5 border border-white/10 bg-[#151515] p-4 sm:space-y-3 sm:p-5">
          <Timer className="h-4 w-4 text-brand-strong sm:h-5 sm:w-5" />
          <h2 className="text-base font-semibold tracking-[-0.03em] text-white sm:text-lg">
            Horarios
          </h2>
          <p className="text-xs leading-6 text-white/68 sm:text-sm sm:leading-7">
            {storeSettings.opening_hours?.trim() || 'Horarios a completar.'}
          </p>
        </Card>

        <Card className="space-y-2.5 border border-white/10 bg-[#151515] p-4 sm:space-y-3 sm:p-5">
          <SocialIcon type="instagram" className="h-4 w-4 sm:h-5 sm:w-5" />
          <h2 className="text-base font-semibold tracking-[-0.03em] text-white sm:text-lg">
            Instagram
          </h2>
          <p className="text-xs leading-6 text-white/68 sm:text-sm sm:leading-7">
            Novedades y modelos.
          </p>
        </Card>

        <Card className="space-y-2.5 border border-white/10 bg-[#151515] p-4 sm:space-y-3 sm:p-5">
          <SocialIcon type="whatsapp" className="h-4 w-4 sm:h-5 sm:w-5" />
          <h2 className="text-base font-semibold tracking-[-0.03em] text-white sm:text-lg">
            WhatsApp
          </h2>
          <p className="text-xs leading-6 text-white/68 sm:text-sm sm:leading-7">
            Consultas del local.
          </p>
        </Card>
      </div>

      <Card className="border border-white/10 bg-[#151515] p-4 text-white shadow-none sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href={openMapUrl}
            target="_blank"
            rel="noreferrer"
            className={`${buttonStyles({ variant: 'outline' })} w-full justify-center sm:w-auto`}
          >
            <MapPin className="h-4 w-4" />
            Abrir Google Maps
          </a>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className={`${buttonStyles({ variant: 'outline' })} w-full justify-center sm:w-auto`}
          >
            <SocialIcon type="instagram" className="h-4 w-4" />
            Ir a Instagram
          </a>

          {hasWhatsApp ? (
            <a
              href={buildWhatsAppUrl(
                storeSettings.whatsapp_phone,
                'Hola, quiero hacer una consulta sobre el local.',
              )}
              target="_blank"
              rel="noreferrer"
              className={`${buttonStyles({ variant: 'whatsapp' })} w-full justify-center sm:w-auto`}
            >
              <SocialIcon type="whatsapp" className="h-4 w-4" />
              Escribir WhatsApp
            </a>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
