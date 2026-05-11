import { useEffect, useState } from 'react'
import cityLogo from '@/assets/city-logo.jpg'
import {
  ArrowRight,
  AtSign,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Ruler,
  Store,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductVisual } from '@/components/product/ProductVisual'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { cn } from '@/lib/cn'
import { isOnSale } from '@/lib/pricing'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

const instagramTiles = [
  'Streetwear diario',
  'New drop',
  '@citycalzadourbano',
  'Sneakers urbanas',
  'City essentials',
  'Comodidad urbana',
]

export function HomePage() {
  const { products, storeSettings, loading } = useStorefrontData()
  const hasWhatsApp = Boolean(storeSettings.whatsapp_phone)
  const [activeSlide, setActiveSlide] = useState(0)

  const featuredProducts = products.filter((product) => product.featured)
  const saleProducts = products.filter((product) =>
    isOnSale(product.price, product.compare_at_price),
  )
  const visibleProducts =
    featuredProducts.length > 0 ? featuredProducts.slice(0, 4) : products.slice(0, 4)
  const heroProducts = Array.from(
    new Map(
      [...featuredProducts, ...saleProducts, ...products].map((product) => [
        product.id,
        product,
      ]),
    ).values(),
  ).slice(0, 3)
  const quickCategories = Array.from(
    new Map(
      products
        .filter((product) => product.category)
        .map((product) => [
          product.category?.id,
          {
            id: product.category?.id ?? product.id,
            name: product.category?.name ?? 'Categor\u00eda',
          },
        ]),
    ).values(),
  ).slice(0, 6)
  const instagramUrl =
    storeSettings.instagram_url ?? 'https://www.instagram.com/citycalzadourbano/'

  const heroSlides = [
    {
      eyebrow: 'NUEVOS INGRESOS',
      title: 'ZAPATILLAS URBANAS',
      subtitle: 'PARA TODOS LOS D\u00cdAS',
      description: 'Eleg\u00ed tu modelo y coordin\u00e1 talles por WhatsApp.',
      primaryLabel: 'Ver cat\u00e1logo',
      primaryTo: '/catalogo',
      secondaryLabel: 'Consultar talles',
      secondaryHref: hasWhatsApp
        ? buildWhatsAppUrl(
            storeSettings.whatsapp_phone,
            'Hola, quiero consultar talles disponibles.',
          )
        : null,
      backdropWord: 'CITY',
      badge: 'NUEVO',
      product: heroProducts[0] ?? null,
    },
    {
      eyebrow: 'MODELOS DESTACADOS',
      title: 'CITY DROP',
      subtitle: 'ELEG\u00cd TU PR\u00d3XIMO PAR',
      description: 'Sneakers y urbanas listas para combinar con tu estilo.',
      primaryLabel: 'Ver destacados',
      primaryTo: '/catalogo',
      secondaryLabel: 'WhatsApp',
      secondaryHref: hasWhatsApp
        ? buildWhatsAppUrl(
            storeSettings.whatsapp_phone,
            'Hola, quiero consultar disponibilidad de un modelo destacado.',
          )
        : null,
      backdropWord: 'DROP',
      badge: 'DESTACADO',
      product: heroProducts[1] ?? heroProducts[0] ?? null,
    },
    {
      eyebrow: 'PEDIDOS POR WHATSAPP',
      title: 'ARM\u00c1 TU PEDIDO',
      subtitle: 'RETIR\u00c1 EN EL LOCAL',
      description: 'Confirmamos disponibilidad, talle y retiro por WhatsApp.',
      primaryLabel: 'Ir al cat\u00e1logo',
      primaryTo: '/catalogo',
      secondaryLabel: 'Consultar disponibilidad',
      secondaryHref: hasWhatsApp
        ? buildWhatsAppUrl(
            storeSettings.whatsapp_phone,
            'Hola, quiero consultar disponibilidad de un modelo.',
          )
        : null,
      backdropWord: 'SNEAKERS',
      badge: 'WHATSAPP',
      product: heroProducts[2] ?? heroProducts[0] ?? null,
    },
  ]

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return
    }

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length)
    }, 4800)

    return () => window.clearInterval(intervalId)
  }, [heroSlides.length])

  function goToPreviousSlide() {
    setActiveSlide((current) =>
      current === 0 ? heroSlides.length - 1 : current - 1,
    )
  }

  function goToNextSlide() {
    setActiveSlide((current) => (current + 1) % heroSlides.length)
  }

  if (loading) {
    return <LoadingState label="Preparando la tienda..." />
  }

  return (
    <div className="space-y-10 sm:space-y-14">
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-b border-white/10 bg-[#050505]">
        <div className="relative min-h-[520px] lg:min-h-[620px]">
          <div
            className="hero-slider-track"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {heroSlides.map((slide) => (
              <div key={slide.eyebrow} className="hero-slide">
                <div className="shell-container grid min-h-[520px] items-center gap-8 py-10 sm:py-12 lg:min-h-[620px] lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:py-16">
                  <div className="relative z-10 max-w-xl space-y-6">
                    <div className="space-y-4">
                      <p className="eyebrow">{slide.eyebrow}</p>
                      <div className="space-y-1">
                        <h1 className="font-[var(--font-display)] text-5xl leading-[0.94] font-bold uppercase tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
                          {slide.title}
                        </h1>
                        <p className="font-[var(--font-display)] text-4xl leading-[0.94] font-bold uppercase tracking-[-0.04em] text-brand-strong sm:text-5xl lg:text-6xl">
                          {slide.subtitle}
                        </p>
                      </div>
                      <p className="max-w-lg text-sm leading-7 text-white/72 sm:text-base">
                        {slide.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        to={slide.primaryTo}
                        className={buttonStyles({
                          variant: 'secondary',
                          size: 'lg',
                        })}
                      >
                        {slide.primaryLabel}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      {slide.secondaryHref ? (
                        <a
                          href={slide.secondaryHref}
                          target="_blank"
                          rel="noreferrer"
                          className={buttonStyles({
                            variant: 'outline',
                            size: 'lg',
                          })}
                        >
                          <MessageCircle className="h-4 w-4" />
                          {slide.secondaryLabel}
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="relative flex min-h-[280px] items-center justify-center lg:min-h-[500px]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(182,255,0,0.18),transparent_20%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_28%)]" />
                    <div className="absolute top-4 left-0 text-[4.4rem] leading-none font-black uppercase tracking-[-0.08em] text-white/6 sm:text-[6rem] lg:top-0 lg:text-[9rem]">
                      {slide.backdropWord}
                    </div>
                    <div className="absolute top-6 right-0 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                      {slide.badge}
                    </div>

                    {slide.product ? (
                      <div className="relative z-10 w-full max-w-[640px] lg:translate-x-6 lg:rotate-[-6deg]">
                        <ProductVisual
                          seed={slide.product.slug}
                          name={slide.product.name}
                          categoryName={slide.product.category?.name}
                          imageUrl={slide.product.primaryImage?.url}
                          className="h-[300px] sm:h-[380px] lg:h-[500px]"
                        />
                      </div>
                    ) : (
                      <div className="relative z-10 flex h-[320px] w-full max-w-[620px] items-center justify-center rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.12))] lg:h-[500px]">
                        <img
                          src={cityLogo}
                          alt="City Calzado Urbano"
                          className="h-44 w-44 rounded-full border border-white/10 object-cover shadow-[0_28px_60px_rgba(0,0,0,0.28)] sm:h-52 sm:w-52"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            aria-label="Slide anterior"
            onClick={goToPreviousSlide}
            className="absolute top-1/2 left-4 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0f0f0f]/88 text-white backdrop-blur-sm hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            aria-label="Slide siguiente"
            onClick={goToNextSlide}
            className="absolute top-1/2 right-4 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0f0f0f]/88 text-white backdrop-blur-sm hover:bg-white/10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute right-0 bottom-6 left-0 z-20 flex justify-center gap-2">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.eyebrow}
                type="button"
                aria-label={`Ir al slide ${index + 1}`}
                onClick={() => setActiveSlide(index)}
                className={cn(
                  'h-2.5 rounded-full transition',
                  activeSlide === index
                    ? 'w-9 bg-brand-strong'
                    : 'w-2.5 bg-white/26 hover:bg-white/42',
                )}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: MessageCircle,
            title: 'Consult\u00e1 talles por WhatsApp',
            copy: 'Te respondemos r\u00e1pido para ayudarte a elegir.',
          },
          {
            icon: Store,
            title: 'Retiro coordinado',
            copy: 'Confirmamos disponibilidad y retiro con el local.',
          },
          {
            icon: Ruler,
            title: 'Atenci\u00f3n personalizada',
            copy: 'Escribinos y te ayudamos con el modelo que busc\u00e1s.',
          },
        ].map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.title}
              className="rounded-[28px] border border-white/10 bg-[#151515] p-5 shadow-[0_22px_48px_rgba(0,0,0,0.22)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-white/68">{item.copy}</p>
            </div>
          )
        })}
      </section>

      <section className="space-y-6">
        <SectionTitle
          eyebrow="Destacados"
          title="Modelos destacados"
          description="Elegí tu próximo par y consultá disponibilidad."
          tone="light"
        />

        {visibleProducts.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Todavía no hay modelos destacados"
            description="En cuanto haya productos publicados, los vas a ver aquí primero."
            action={
              <Link to="/catalogo" className="text-sm font-medium text-brand-strong">
                {'Ver catálogo'}
              </Link>
            }
          />
        )}
      </section>

      <section className="space-y-5">
        <SectionTitle
          eyebrow="Categorías"
          title="Compra por categoría"
          description="Sneakers, urbanas y accesorios para encontrar rápido tu próximo par."
          tone="light"
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickCategories.map((category) => (
            <Link
              key={category.id}
              to="/catalogo"
              className="rounded-[26px] border border-white/10 bg-[#151515] p-5 shadow-[0_20px_44px_rgba(0,0,0,0.22)] transition hover:border-brand-strong/30 hover:bg-[#1a1a1a]"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-brand-strong/82">
                {'Categoría'}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                {category.name}
              </h3>
              <p className="mt-2 text-sm leading-7 text-white/64">
                Ver modelos y consultá disponibilidad.
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[32px] border border-white/10 bg-[#151515] p-6 shadow-[0_28px_60px_rgba(0,0,0,0.24)] sm:p-8">
          <p className="eyebrow">Instagram</p>
          <div className="mt-5 space-y-4">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Seguinos en Instagram
            </h2>
            <p className="text-lg text-brand-strong">@citycalzadourbano</p>
            <p className="max-w-lg text-sm leading-7 text-white/68">
              {'Mirá nuevos ingresos, combinaciones urbanas y modelos que van'}
              {' '}
              entrando al local.
            </p>
          </div>

          <div className="mt-6">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({ variant: 'outline', size: 'lg' })}
            >
              <AtSign className="h-4 w-4" />
              Seguir en Instagram
            </a>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {instagramTiles.map((tile, index) => (
            <a
              key={tile}
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="group relative min-h-[150px] overflow-hidden rounded-[26px] border border-white/10 bg-[#111111] p-4 shadow-[0_22px_50px_rgba(0,0,0,0.2)]"
            >
              <div
                className={cn(
                  'absolute inset-0',
                  index % 3 === 0
                    ? 'bg-[radial-gradient(circle_at_top_right,rgba(182,255,0,0.18),transparent_28%)]'
                    : index % 3 === 1
                      ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]'
                      : 'bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_32%)]',
                )}
              />
              <img
                src={cityLogo}
                alt=""
                className="pointer-events-none absolute -right-8 -bottom-8 h-24 w-24 rounded-full opacity-[0.08] grayscale"
              />
              <div className="relative flex h-full flex-col justify-between">
                <p className="text-xs uppercase tracking-[0.24em] text-brand-strong/82">
                  Instagram
                </p>
                <p className="max-w-[12rem] text-lg font-semibold tracking-[-0.03em] text-white transition group-hover:text-brand-strong">
                  {tile}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="surface-panel overflow-hidden">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
          <div className="space-y-4">
            <p className="eyebrow">WhatsApp</p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              {'¿Querés consultar talles o disponibilidad?'}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
              Escribinos y coordinamos directo con el local.
            </p>
          </div>

          {hasWhatsApp ? (
            <a
              href={buildWhatsAppUrl(
                storeSettings.whatsapp_phone,
                'Hola, quiero consultar talles y disponibilidad.',
              )}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({ variant: 'whatsapp', size: 'lg' })}
            >
              <MessageCircle className="h-4 w-4" />
              Escribir por WhatsApp
            </a>
          ) : (
            <div className="rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm text-white/72">
              WhatsApp pendiente de configurar
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
