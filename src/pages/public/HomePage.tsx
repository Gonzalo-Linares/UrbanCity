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
              <h1 className="page-title">
                Calzado urbano listo para verse bien y vender rapido.
              </h1>
              <p className="page-copy">
                {storeSettings.store_name} muestra catalogo, carrito y cierre por
                WhatsApp en un recorrido simple. El cliente elige, arma su pedido
                y el local coordina disponibilidad, retiro y pago manualmente.
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
                    Identidad comercial
                  </span>
                </div>
                <img
                  src={cityLogo}
                  alt="City Calzado Urbano"
                  className="h-28 w-28 rounded-full border border-white/10 object-cover shadow-[0_18px_40px_rgba(0,0,0,0.32)]"
                />
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                    Negro, blanco y grises con una sola salida clara: vender mejor.
                  </h2>
                  <p className="text-sm leading-7 text-white/72">
                    El foco esta en mostrar producto, dejar claro el circuito de
                    compra y llevar la conversacion al canal que el comercio ya usa.
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
          title="Modelos destacados para rotar rapido"
          description="Producto claro, lectura rapida y una identidad visual mas cercana al streetwear que a una tienda generica."
          tone="light"
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <div className="surface-card space-y-5">
          <SectionTitle
            eyebrow="Proceso"
            title="Todo lo importante queda claro"
            description="Sin letras chicas, sin pasarela de pago y sin promesas falsas. Solo producto, pedido y cierre comercial por WhatsApp."
          />
          <div className="grid gap-4">
            {[
              {
                title: 'Catalogo limpio',
                copy: 'Categorias, buscador y estados de disponibilidad legibles para que el cliente no se pierda.',
              },
              {
                title: 'Carrito persistente',
                copy: 'El pedido sigue ahi si la persona vuelve mas tarde o recarga la pagina.',
              },
              {
                title: 'Checkout corto',
                copy: 'Nombre, telefono y mensaje opcional antes de pasar a WhatsApp sin friccion extra.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-black/8 bg-white p-5"
              >
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-stone-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-stone-600">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel flex flex-col justify-between gap-6 p-6 sm:p-8">
          <div className="space-y-4">
            <p className="eyebrow">Contacto directo</p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white">
              Instagram y WhatsApp visibles para cerrar consultas rapido.
            </h2>
            <p className="text-sm leading-7 text-white/72">
              La tienda no obliga a registrarse ni simula un pago online. El cierre
              comercial sigue donde mejor funciona para el local: la conversacion.
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
