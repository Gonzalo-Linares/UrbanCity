import { AtSign, MapPin, MessageCircle, Timer } from 'lucide-react'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { Card } from '@/components/ui/Card'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

export function ContactPage() {
  const { storeSettings } = useStorefrontData()
  const hasWhatsApp = Boolean(storeSettings.whatsapp_phone)

  return (
    <div className="space-y-8">
      <section className="surface-panel p-6 sm:p-8 lg:p-10">
        <SectionTitle
          eyebrow="Contacto"
          title="Informacion visible para convertir consultas en pedidos."
          description="Direccion, horarios y accesos rapidos a redes para que la persona llegue al comercio sin friccion."
        />
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="space-y-3">
          <MapPin className="h-5 w-5 text-brand" />
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-stone-950">
            Direccion
          </h2>
          <p className="text-sm leading-7 text-muted">
            {storeSettings.address ?? 'Definila desde la configuracion del comercio.'}
          </p>
        </Card>
        <Card className="space-y-3">
          <Timer className="h-5 w-5 text-brand" />
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-stone-950">
            Horarios
          </h2>
          <p className="text-sm leading-7 text-muted">
            {storeSettings.opening_hours ?? 'Horarios a completar.'}
          </p>
        </Card>
        <Card className="space-y-3">
          <MessageCircle className="h-5 w-5 text-brand" />
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-stone-950">
            WhatsApp
          </h2>
          <p className="text-sm leading-7 text-muted">
            Canal principal para confirmar disponibilidad, retiro y pago.
          </p>
        </Card>
        <Card className="space-y-3">
          <AtSign className="h-5 w-5 text-brand" />
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-stone-950">
            Instagram
          </h2>
          <p className="text-sm leading-7 text-muted">
            Ideal para contenido, novedades y derivar trafico al catalogo.
          </p>
        </Card>
      </div>

      <Card className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-stone-950">
            La disponibilidad sera confirmada por WhatsApp.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted">
            No hay pago online en esta version. El comercio toma el pedido, valida
            stock o tiempos y coordina el cierre manualmente.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {hasWhatsApp ? (
            <a
              href={buildWhatsAppUrl(
                storeSettings.whatsapp_phone,
                'Hola, quiero consultar disponibilidad y formas de retiro.',
              )}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({ variant: 'whatsapp' })}
            >
              <MessageCircle className="h-4 w-4" />
              Abrir WhatsApp
            </a>
          ) : null}
          {storeSettings.instagram_url ? (
            <a
              href={storeSettings.instagram_url}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({ variant: 'outline' })}
            >
              <AtSign className="h-4 w-4" />
              Ir a Instagram
            </a>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
