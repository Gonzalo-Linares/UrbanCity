import { ArrowRight, AtSign, MessageCircle, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductCard } from '@/components/product/ProductCard'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { LoadingState } from '@/components/ui/LoadingState'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

export function HomePage() {
  const { products, storeSettings, loading } = useStorefrontData()
  const hasWhatsApp = Boolean(storeSettings.whatsapp_phone)

  if (loading) {
    return <LoadingState label="Preparando el storefront..." />
  }

  const featuredProducts = products.filter((product) => product.featured)
  const visibleProducts =
    featuredProducts.length > 0 ? featuredProducts.slice(0, 4) : products.slice(0, 4)

  return (
    <div className="space-y-10 sm:space-y-14">
      <section className="surface-panel overflow-hidden">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div className="space-y-6">
            <p className="eyebrow">Storefront v1</p>
            <div className="space-y-4">
              <h1 className="page-title">
                Una tienda simple para vender bien, sin complicar el cierre.
              </h1>
              <p className="page-copy">
                {storeSettings.store_name} combina catalogo, carrito y checkout
                resuelto por WhatsApp para que el comercio confirme disponibilidad,
                retiro y pago de forma manual.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/catalogo" className={buttonStyles({ size: 'lg' })}>
                Ver catalogo
                <ArrowRight className="h-4 w-4" />
              </Link>
              {hasWhatsApp ? (
                <a
                  href={buildWhatsAppUrl(
                    storeSettings.whatsapp_phone,
                    'Hola, quiero consultar productos del catalogo.',
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonStyles({ variant: 'whatsapp', size: 'lg' })}
                >
                  <MessageCircle className="h-4 w-4" />
                  Consultar por WhatsApp
                </a>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-stone-900/8 bg-white/82 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">
                  Pedido
                </p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-stone-950">
                  Pendiente de confirmacion
                </p>
              </div>
              <div className="rounded-[24px] border border-stone-900/8 bg-white/82 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">
                  Pago
                </p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-stone-950">
                  Manual y coordinado
                </p>
              </div>
              <div className="rounded-[24px] border border-stone-900/8 bg-white/82 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">
                  Canal
                </p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-stone-950">
                  WhatsApp directo
                </p>
              </div>
            </div>
          </div>

          <div className="subtle-grid relative overflow-hidden rounded-[32px] border border-stone-900/10 bg-stone-950 p-6 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_22%)]" />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white/70">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-[0.24em]">
                    Flujo recomendado
                  </span>
                </div>
                <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                  Menos friccion, mejor cierre para un comercio chico.
                </h2>
                <p className="text-sm leading-7 text-white/72">
                  El cliente arma el pedido, deja sus datos y el comercio toma el
                  control en la conversacion final.
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  'El cliente agrega productos al carrito.',
                  'Completa nombre, telefono y mensaje opcional.',
                  'El pedido viaja por WhatsApp con total estimado.',
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-white/6 p-4"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
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
          title="Productos listos para empezar"
          description="El storefront arranca con una curaduria simple, productos claros y un recorrido de compra corto."
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
            title="Lo importante esta visible"
            description="La app evita promesas falsas: no cobra online, no reserva stock en tiempo real y deja claros los siguientes pasos."
          />
          <div className="grid gap-4">
            {[
              {
                title: 'Catalogo claro',
                copy: 'Categorias, buscador y estados de disponibilidad sin ruido innecesario.',
              },
              {
                title: 'Carrito persistente',
                copy: 'El cliente no pierde el pedido si recarga o vuelve mas tarde.',
              },
              {
                title: 'Checkout corto',
                copy: 'Solo nombre, telefono y mensaje opcional antes de pasar a WhatsApp.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-stone-900/8 bg-white/75 p-5"
              >
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-stone-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card flex flex-col justify-between gap-6 bg-stone-950 text-white">
          <div className="space-y-4">
            <p className="eyebrow bg-white/10 text-white">Contacto directo</p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em]">
              Botones visibles para cerrar consultas sin friccion.
            </h2>
            <p className="text-sm leading-7 text-white/72">
              Instagram y WhatsApp quedan siempre a mano para captar mensajes sin
              forzar un registro previo ni una pasarela de pago.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {hasWhatsApp ? (
              <a
                href={buildWhatsAppUrl(
                  storeSettings.whatsapp_phone,
                  'Hola, quiero asesoramiento para elegir un producto.',
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
            className="justify-start border border-white/10 bg-white/6 text-white hover:bg-white/10"
            disabled
          >
            La disponibilidad sera confirmada por WhatsApp
          </Button>
        </div>
      </section>
    </div>
  )
}
