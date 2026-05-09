import cityLogo from '@/assets/city-logo.jpg'
import { ArrowRight, AtSign, MessageCircle, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { ProductCard } from '@/components/product/ProductCard'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

export function HomePage() {
  const { products, storeSettings, loading } = useStorefrontData()
  const hasWhatsApp = Boolean(storeSettings.whatsapp_phone)

  if (loading) {
    return <LoadingState label="Preparando la tienda..." />
  }

  const featuredProducts = products.filter((product) => product.featured)
  const visibleProducts =
    featuredProducts.length > 0 ? featuredProducts.slice(0, 4) : products.slice(0, 4)

  return (
    <div className="space-y-10 sm:space-y-14">
      <section className="surface-panel subtle-grid overflow-hidden">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.08fr_0.92fr] lg:p-10">
          <div className="space-y-6">
            <p className="eyebrow">Streetwear | Sneakers | WhatsApp</p>
            <div className="space-y-4">
              <h1 className="page-title">Zapatillas urbanas para todos los dias.</h1>
              <p className="page-copy">
                Elegi tu modelo, arma tu pedido y coordinamos por WhatsApp.
                Consulta disponibilidad, combina talles y retira en el local.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/catalogo" className={buttonStyles({ size: 'lg', variant: 'secondary' })}>
                Ver catalogo
                <ArrowRight className="h-4 w-4" />
              </Link>
              {hasWhatsApp ? (
                <a
                  href={buildWhatsAppUrl(
                    storeSettings.whatsapp_phone,
                    'Hola, quiero consultar modelos y talles disponibles.',
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonStyles({ variant: 'outline', size: 'lg' })}
                >
                  <MessageCircle className="h-4 w-4" />
                  Consultar por WhatsApp
                </a>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/46">
                  Pedido
                </p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                  Pendiente de confirmacion
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/46">
                  Pago
                </p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                  Coordinado con el local
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/46">
                  Canal
                </p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                  WhatsApp directo
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#050505] p-6 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(182,255,0,0.18),transparent_22%)]" />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div className="space-y-5">
                <div className="flex items-center gap-3 text-white/68">
                  <Sparkles className="h-4 w-4 text-brand-strong" />
                  <span className="text-xs uppercase tracking-[0.24em]">
                    City Calzado Urbano
                  </span>
                </div>
                <img
                  src={cityLogo}
                  alt="City Calzado Urbano"
                  className="h-28 w-28 rounded-full border border-white/10 object-cover shadow-[0_18px_40px_rgba(0,0,0,0.32)]"
                />
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                    Modelos urbanos para usar todos los dias.
                  </h2>
                  <p className="text-sm leading-7 text-white/72">
                    Mira modelos, consulta talles y deja el pedido listo para
                    seguir la coordinacion por WhatsApp.
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                {[
                  'El cliente filtra, elige y suma productos al carrito.',
                  'Completa nombre, telefono y mensaje sin crear cuenta.',
                  'El pedido sale por WhatsApp con total y resumen listo.',
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-white/6 p-4"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-strong text-sm font-semibold text-black">
                      0{index + 1}
                    </span>
                    <p className="text-sm leading-6 text-white/80">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionTitle
          eyebrow="Destacados"
          title="Modelos destacados"
          description="Zapatillas urbanas, comodas y listas para combinar con tu estilo diario."
          tone="light"
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[32px] border border-white/10 bg-[#151515] p-5 shadow-[0_26px_56px_rgba(0,0,0,0.26)] sm:p-6">
          <SectionTitle
            eyebrow="Como comprar"
            title="Elegi tu par y coordina facil"
            description="Filtra por categoria, revisa disponibilidad y deja tu pedido listo para coordinar por WhatsApp."
            tone="light"
          />
          <div className="grid gap-4">
            {[
              {
                title: 'Modelos faciles de ver',
                copy: 'Categorias y buscador para encontrar zapatillas urbanas sin dar vueltas.',
              },
              {
                title: 'Carrito persistente',
                copy: 'Tu pedido sigue guardado si vuelves mas tarde o recargas la pagina.',
              },
              {
                title: 'Pedido por WhatsApp',
                copy: 'Dejas nombre, telefono y mensaje para seguir la coordinacion con el local.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-white/10 bg-[#101010] p-5"
              >
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-white/68">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel flex flex-col justify-between gap-6 p-6 sm:p-8">
          <div className="space-y-4">
            <p className="eyebrow">Contacto directo</p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white">
              Consulta disponibilidad y coordina directo con el local.
            </h2>
            <p className="text-sm leading-7 text-white/72">
              Elegi tu modelo, revisa talles y retira en el local con una
              conversacion simple por WhatsApp.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {hasWhatsApp ? (
              <a
                href={buildWhatsAppUrl(
                  storeSettings.whatsapp_phone,
                  'Hola, quiero asesoramiento para elegir un modelo.',
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
                Ver Instagram
              </a>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="justify-start border border-white/10 bg-white/6 text-white hover:bg-white/10 hover:text-white"
            disabled
          >
            La disponibilidad y el pago se coordinan con el comercio
          </Button>
        </div>
      </section>
    </div>
  )
}
