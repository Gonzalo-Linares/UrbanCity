import { useEffect, useRef, useState } from 'react'
import crediAppLogo from '@/assets/CrediApp_icon.png'
import cuotasSinInteresImage from '@/assets/CuotasSinInteres.webp'
import estanteriaImage from '@/assets/Estanteria.webp'
import goCuotasLogo from '@/assets/GoCuotas_icon.png'
import localExteriorImage from '@/assets/LocalExterior1.webp'
import promoContadoImage from '@/assets/PromoContado.webp'
import zapatillas1Image from '@/assets/Zapatillas1.webp'
import zapatillas2Image from '@/assets/Zapatillas2.webp'
import zapatillas3Image from '@/assets/Zapatillas3.webp'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HandCoins,
  Store,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductCard } from '@/components/product/ProductCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { SocialIcon } from '@/components/ui/SocialIcon'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { usePageSeo } from '@/hooks/usePageSeo'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { cn } from '@/lib/cn'

const fallbackHeroSlides = [
  {
    eyebrow: 'NUEVOS INGRESOS',
    title: 'CITY DROP',
    subtitle: 'TU PRÓXIMO PAR',
    description: 'Modelos urbanos seleccionados por el local.',
    image: zapatillas3Image,
    imageAlt:
      'Modelos nuevos de zapatillas urbanas disponibles en City Calzado Urbano',
  },
  {
    eyebrow: 'MODELOS DESTACADOS',
    title: 'ZAPATILLAS URBANAS',
    subtitle: 'PARA TODOS LOS DÍAS',
    description: 'Sneakers y accesorios para tu estilo.',
    image: zapatillas2Image,
    imageAlt: 'Zapatillas urbanas destacadas en City Calzado Urbano',
  },
  {
    eyebrow: 'ESTILO CITY',
    title: 'NUEVOS MODELOS',
    subtitle: 'EN TIENDA',
    description: 'Descubrí los ingresos disponibles.',
    image: zapatillas1Image,
    imageAlt: 'Nuevos modelos de zapatillas disponibles en City Calzado Urbano',
  },
]

const paymentAppItems = [
  {
    name: 'Go Cuotas',
    logo: goCuotasLogo,
  },
  {
    name: 'CrediApp',
    logo: crediAppLogo,
  },
]

const benefitItems = [
  {
    icon: CreditCard,
    mobileTitle: '3 CUOTAS\nSIN INTERÉS',
    title: '3 cuotas sin interés',
    copy: 'Pagá con tarjeta de crédito en 3 cuotas sin interés.',
  },
  {
    icon: CreditCard,
    mobileTitle: 'OTROS MEDIOS',
    title: 'Otros medios de pago',
    logos: paymentAppItems,
  },
  {
    icon: HandCoins,
    mobileTitle: '20% OFF\nCONTADO',
    title: '20% OFF Contado',
    copy: 'Efectivo, transferencia y billeteras virtuales incluidas.',
  },
  {
    icon: Store,
    mobileTitle: 'RETIRO\nEN EL LOCAL',
    title: 'Retiro coordinado',
    copy: 'Confirmamos disponibilidad y retiro con el local.',
  },
]

const instagramShowcaseItems = [
  {
    label: 'Local',
    image: localExteriorImage,
    alt: 'Frente del local City Calzado Urbano',
  },
  {
    label: 'Nuevos ingresos',
    image: estanteriaImage,
    alt: 'Estantería con nuevos ingresos de zapatillas',
  },
  {
    label: '20% OFF contado',
    image: promoContadoImage,
    alt: 'Promoción de pago contado en City Calzado Urbano',
  },
  {
    label: '3 cuotas sin interés',
    image: cuotasSinInteresImage,
    alt: 'Promoción de 3 cuotas sin interés',
  },
  {
    label: 'Nuevos pares',
    image: zapatillas1Image,
    alt: 'Nuevos pares de zapatillas urbanas en City Calzado Urbano',
  },
]

function HomePageSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex animate-pulse flex-col gap-10 sm:gap-14"
    >
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-b border-white/10 bg-[#050505]">
        <div className="shell-container relative min-h-[380px] overflow-hidden py-7 sm:min-h-[520px] sm:py-12 lg:grid lg:min-h-[620px] lg:grid-cols-[0.94fr_1.06fr] lg:items-center lg:gap-10 lg:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(182,255,0,0.05),transparent_32%),linear-gradient(135deg,#080808_0%,#0d0d0d_55%,#050505_100%)] sm:hidden" />
          <div className="relative z-10 max-w-[72%] space-y-4 sm:max-w-[72%] sm:space-y-5 lg:max-w-xl">
            <div className="h-3 w-28 rounded-full bg-brand-strong/12" />
            <div className="space-y-3">
              <div className="h-9 w-[min(19rem,74vw)] rounded-lg bg-white/10 sm:h-14 lg:h-16" />
              <div className="h-8 w-[min(16rem,64vw)] rounded-lg bg-brand-strong/10 sm:h-12 lg:h-14" />
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-3 w-full max-w-[340px] rounded-full bg-white/8" />
              <div className="h-3 w-3/4 max-w-[260px] rounded-full bg-white/8" />
            </div>
            <div className="h-11 w-36 rounded-full bg-brand-strong/14 sm:h-14 sm:w-44" />
          </div>

          <div className="relative z-10 hidden items-center justify-end sm:flex">
            <div className="h-[360px] w-full max-w-[620px] rounded-[34px] border border-white/8 bg-[radial-gradient(circle_at_48%_36%,rgba(182,255,0,0.06),transparent_34%),linear-gradient(135deg,#121212,#090909)] lg:h-[500px]" />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded-full bg-brand-strong/12" />
          <div className="h-8 w-56 rounded-lg bg-white/10 sm:h-10 sm:w-72" />
          <div className="h-3 w-full max-w-[340px] rounded-full bg-white/8" />
        </div>
        <div className="flex gap-3 overflow-hidden sm:gap-4">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="w-[78vw] max-w-[320px] shrink-0 rounded-[22px] border border-white/8 bg-[#111111] p-1.5 sm:p-2.5"
            >
              <div className="aspect-square rounded-[18px] border border-white/6 bg-[radial-gradient(circle_at_50%_35%,rgba(182,255,0,0.05),transparent_34%),linear-gradient(140deg,#151515,#0d0d0d)] sm:rounded-[24px]" />
              <div className="space-y-3 p-3 sm:p-4">
                <div className="h-3 w-20 rounded-full bg-brand-strong/10" />
                <div className="h-5 w-4/5 rounded-md bg-white/10" />
                <div className="h-6 w-28 rounded-md bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function DelayedHomeLoadingState() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsVisible(true)
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [])

  return isVisible ? <HomePageSkeleton /> : null
}

export function HomePage() {
  const { products, storeSettings, homeHeroSlides, loading } = useStorefrontData()
  usePageSeo({
    title: 'City Calzado Urbano | Zapatillas y calzado urbano en San Juan',
    description:
      'Comprá zapatillas, sneakers, botitas, plataformas y calzado urbano en San Juan. City Calzado Urbano en Galería Provincial.',
    path: '/',
  })
  const [activeSlide, setActiveSlide] = useState(0)
  const [autoplayVersion, setAutoplayVersion] = useState(0)
  const [isHeroPaused, setIsHeroPaused] = useState(false)
  const featuredScrollerRef = useRef<HTMLDivElement | null>(null)
  const featuredLastTouchAtRef = useRef(0)

  const featuredProducts = products.filter((product) => product.featured)
  const featuredBaseProducts =
    featuredProducts.length >= 4
      ? featuredProducts
      : featuredProducts.length > 0
        ? [
            ...featuredProducts,
            ...products
              .filter(
                (product) =>
                  !featuredProducts.some((featured) => featured.id === product.id),
              )
              .slice(0, Math.max(0, 8 - featuredProducts.length)),
          ]
        : products.slice(0, 8)
  const featuredLoopProducts =
    featuredBaseProducts.length > 0
      ? Array.from({ length: 4 }).flatMap(() => featuredBaseProducts)
      : []
  const singleFeaturedProduct = featuredProducts[0] ?? null
  const heroSlides =
    homeHeroSlides.length > 0
      ? homeHeroSlides.map((slide) => ({
          eyebrow: slide.eyebrow,
          title: slide.title,
          subtitle: slide.subtitle ?? '',
          description: slide.description ?? '',
          image: slide.image_url,
          imageAlt: slide.image_alt ?? slide.title,
        }))
      : fallbackHeroSlides
  const instagramUrl =
    storeSettings.instagram_url?.trim() ||
    'https://www.instagram.com/citycalzadourbano/'
  const slideCount = heroSlides.length
  const getHeroImageLoading = (index: number) =>
    index === 0
      ? {
          loading: 'eager' as const,
          fetchPriority: 'high' as const,
        }
      : {
          loading: 'lazy' as const,
          fetchPriority: 'low' as const,
        }

  useEffect(() => {
    if (slideCount <= 1 || isHeroPaused) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setActiveSlide((current) => (current + 1) % slideCount)
    }, 4800)

    return () => window.clearTimeout(timeoutId)
  }, [activeSlide, autoplayVersion, isHeroPaused, slideCount])

  useEffect(() => {
    const scroller = featuredScrollerRef.current

    if (!scroller || featuredLoopProducts.length === 0 || typeof window === 'undefined') {
      return
    }

    const mobileQuery = window.matchMedia('(max-width: 767px)')

    if (!mobileQuery.matches) {
      return
    }

    const activeScroller = scroller
    let frameId = 0
    let lastTimestamp = 0
    let pixelAccumulator = 0
    const pixelsPerSecond = 44
    const resumeAfterMs = 2000

    function tick(timestamp: number) {
      if (!lastTimestamp) {
        lastTimestamp = timestamp
      }

      const delta = timestamp - lastTimestamp
      lastTimestamp = timestamp

      const shouldAutoScroll =
        Date.now() - featuredLastTouchAtRef.current > resumeAfterMs

      if (shouldAutoScroll) {
        pixelAccumulator += (pixelsPerSecond * delta) / 1000

        if (pixelAccumulator >= 1) {
          const pixelsToMove = Math.floor(pixelAccumulator)
          pixelAccumulator -= pixelsToMove

          activeScroller.scrollLeft += pixelsToMove

          const track =
            activeScroller.querySelector<HTMLElement>('.featured-products-track')
          const loopWidth = track ? track.scrollWidth / 4 : 0

          if (loopWidth > 0 && activeScroller.scrollLeft >= loopWidth) {
            activeScroller.scrollLeft -= loopWidth
          }
        }
      }

      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [featuredLoopProducts.length])

  function markFeaturedTouched() {
    featuredLastTouchAtRef.current = Date.now()
  }

  function goToSlide(index: number) {
    if (slideCount === 0) {
      return
    }

    const normalizedIndex = ((index % slideCount) + slideCount) % slideCount
    setActiveSlide(normalizedIndex)
    setAutoplayVersion((current) => current + 1)
  }

  function goToPreviousSlide() {
    goToSlide(activeSlide - 1)
  }

  function goToNextSlide() {
    goToSlide(activeSlide + 1)
  }

  if (loading) {
    return <DelayedHomeLoadingState />
  }

  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-b border-white/10 bg-[#050505]">
        <div
          className="relative min-h-[380px] lg:min-h-[620px]"
          onMouseEnter={() => setIsHeroPaused(true)}
          onMouseLeave={() => setIsHeroPaused(false)}
          onFocusCapture={() => setIsHeroPaused(true)}
          onBlurCapture={() => setIsHeroPaused(false)}
        >
          <div
            className="hero-slider-track"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {heroSlides.map((slide, index) => (
              <div key={`${slide.title}-${index}`} className="hero-slide">
                <div className="shell-container relative min-h-[380px] overflow-hidden py-7 sm:min-h-[520px] sm:py-12 lg:grid lg:min-h-[620px] lg:grid-cols-[0.94fr_1.06fr] lg:items-center lg:gap-10 lg:py-16">
                  <div className="absolute inset-0 sm:hidden">
                    <div className="absolute inset-0 z-0">
                      <img
                        src={slide.image}
                        alt={slide.imageAlt}
                        {...getHeroImageLoading(index)}
                        decoding="async"
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="absolute inset-0 z-[1] bg-black/42" />
                    <div className="absolute inset-0 z-[2] bg-[linear-gradient(90deg,rgba(5,5,5,0.92)_0%,rgba(5,5,5,0.72)_42%,rgba(5,5,5,0.28)_78%,rgba(5,5,5,0.10)_100%)]" />
                    <div className="absolute inset-x-0 bottom-0 z-[3] h-28 bg-gradient-to-t from-[#050505] to-transparent" />
                  </div>

                  <div className="relative z-10 max-w-[72%] space-y-4 sm:max-w-[72%] sm:space-y-5 lg:max-w-xl">
                    <div className="space-y-4">
                      <p className="eyebrow">{slide.eyebrow}</p>
                      <div className="space-y-1">
                        <h1 className="font-[var(--font-display)] text-[2rem] leading-[0.92] font-bold uppercase tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
                          {slide.title}
                        </h1>
                        <p className="font-[var(--font-display)] text-[1.7rem] leading-[0.94] font-bold uppercase tracking-[-0.04em] text-brand-strong sm:text-5xl lg:text-6xl">
                          {slide.subtitle}
                        </p>
                      </div>
                      <p className="max-w-lg text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
                        {slide.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5 sm:gap-3">
                      <Link
                        to="/catalogo"
                        className={cn(
                          buttonStyles({
                            variant: 'secondary',
                            size: 'lg',
                          }),
                          'min-h-[42px] px-4 py-2.5 text-sm sm:px-6 sm:py-4 sm:text-base',
                        )}
                      >
                        Ver catálogo
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="relative z-10 hidden items-center justify-end sm:flex">
                    <div className="relative w-full max-w-[620px] overflow-hidden rounded-[34px] border border-white/10 bg-[#0b0b0b] shadow-[0_36px_80px_rgba(0,0,0,0.36)]">
                      <img
                        src={slide.image}
                        alt={slide.imageAlt}
                        {...getHeroImageLoading(index)}
                        decoding="async"
                        className="h-[360px] w-full object-cover object-center lg:h-[500px]"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.08),rgba(5,5,5,0.18)_42%,rgba(5,5,5,0.64)_100%)]" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            aria-label="Slide anterior"
            onClick={goToPreviousSlide}
            className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0f0f0f]/88 text-white backdrop-blur-sm hover:bg-white/10 sm:inline-flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            aria-label="Slide siguiente"
            onClick={goToNextSlide}
            className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0f0f0f]/88 text-white backdrop-blur-sm hover:bg-white/10 sm:inline-flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
            {heroSlides.map((slide, index) => (
              <button
                key={`${slide.title}-${index}`}
                type="button"
                aria-label={`Ir al slide ${index + 1}`}
                onClick={() => goToSlide(index)}
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

      <section className="space-y-6">
        <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#050505] py-1">
          <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="Destacados"
              title="Modelos destacados"
              description="Elegí tu próximo par y descubrí los modelos disponibles."
              tone="light"
            />
          </div>

          {featuredLoopProducts.length > 0 ? (
            <div
              ref={featuredScrollerRef}
              className="relative mt-6 touch-pan-x overflow-x-auto overflow-y-hidden px-4 pb-2 [scrollbar-width:none] md:overflow-hidden md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden"
              onTouchStart={markFeaturedTouched}
              onTouchMove={markFeaturedTouched}
              onTouchEnd={markFeaturedTouched}
              onTouchCancel={markFeaturedTouched}
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-8 bg-gradient-to-r from-[#050505] to-transparent md:block md:w-12 lg:w-16" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-8 bg-gradient-to-l from-[#050505] to-transparent md:block md:w-12 lg:w-16" />
              <div className="featured-products-track flex w-max min-w-max gap-3 sm:gap-4">
                {featuredLoopProducts.map((product, index) => (
                  <div
                    key={`${product.id}-${index}`}
                    className="w-[78vw] shrink-0 sm:w-[260px] md:w-[280px] lg:w-[300px] xl:w-[320px]"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          ) : singleFeaturedProduct ? (
            <div className="mx-auto mt-6 w-full max-w-[1800px] px-4 sm:px-6 lg:px-8">
              <div className="max-w-[320px]">
                <ProductCard product={singleFeaturedProduct} />
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-6 w-full max-w-[1800px] px-4 sm:px-6 lg:px-8">
              <EmptyState
                title="Todavía no hay modelos destacados"
                description="En cuanto haya productos publicados, los vas a ver acá primero."
                action={
                  <Link to="/catalogo" className="text-sm font-medium text-brand-strong">
                    Ver catálogo
                  </Link>
                }
              />
            </div>
          )}
        </section>
      </section>

      <section className="grid grid-cols-2 items-stretch gap-2 md:grid-cols-4 md:gap-4">
        {benefitItems.map((item) => {
          const Icon = item.icon
          const logos = item.logos ?? []
          const isPaymentAppsCard = Boolean(item.logos)

          return (
            <div
              key={item.title}
              className="flex h-full flex-col rounded-[16px] border border-white/10 bg-[#151515] p-2.5 text-center shadow-[0_18px_36px_rgba(0,0,0,0.2)] sm:rounded-[24px] sm:p-4 md:text-left"
            >
              <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-xl bg-brand-soft text-brand-strong md:mx-0 md:h-10 md:w-10 md:rounded-2xl">
                <Icon className="h-3.5 w-3.5 md:h-5 md:w-5" />
              </div>
              <span className="mt-2 block whitespace-pre-line text-[0.72rem] font-semibold uppercase leading-4 tracking-[0.12em] text-white md:hidden">
                {item.mobileTitle}
              </span>
              <h3 className="mt-3 hidden text-lg font-semibold tracking-[-0.03em] text-white md:block">
                {item.title}
              </h3>
              {isPaymentAppsCard ? (
                <div className="mt-2.5 flex w-full items-center justify-center gap-4 md:mt-3 md:gap-6">
                  {logos.map((logo) => (
                    <img
                      key={logo.name}
                      src={logo.logo}
                      alt={logo.name}
                      className={cn(
                        'object-contain brightness-110 contrast-125',
                        logo.name === 'Go Cuotas'
                          ? 'max-h-10 max-w-[78px] md:max-h-12 md:max-w-[92px]'
                          : 'max-h-7 max-w-[92px] md:max-h-10 md:max-w-[108px]',
                      )}
                      loading="lazy"
                    />
                  ))}
                </div>
              ) : null}
              {!isPaymentAppsCard ? (
                <p className="mt-2 hidden text-sm leading-6 text-white/68 md:block">
                  {item.copy}
                </p>
              ) : null}
            </div>
          )
        })}
      </section>

      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-white/10 bg-[#080808]">
        <div className="mx-auto w-full max-w-[1800px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="min-w-0 space-y-4 lg:flex lg:items-end lg:justify-between lg:gap-8 lg:space-y-0">
            <div className="min-w-0 space-y-3">
              <p className="eyebrow">Instagram</p>
              <div className="min-w-0 space-y-2">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                  Seguinos en Instagram
                </h2>
                <p className="max-w-[54ch] text-sm leading-6 text-white/68 sm:text-base sm:leading-7">
                  Mirá nuevos ingresos, promos del local y una selección más
                  editorial del universo CITY.
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonStyles({ variant: 'outline', size: 'lg' })}
              >
                <SocialIcon type="instagram" className="h-4 w-4" />
                Ver Instagram
              </a>
              <span className="truncate text-sm text-white/42">
                @citycalzadourbano
              </span>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto pb-2 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-3">
              {instagramShowcaseItems.map((item, index) => (
                <a
                  key={`${item.alt}-${index}`}
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative h-[200px] w-[66vw] max-w-[240px] shrink-0 overflow-hidden rounded-[22px] border border-white/10 bg-[#111111]"
                >
                  <img
                    src={item.image}
                    alt={item.alt}
                    loading="lazy"
                    fetchPriority="low"
                    decoding="async"
                    className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.06),rgba(5,5,5,0.42)_54%,rgba(5,5,5,0.82)_100%)]" />
                  <div className="absolute inset-x-0 top-0 p-4">
                    <span className="inline-flex rounded-full border border-white/12 bg-black/36 px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-white">
                      {item.label}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="mt-6 hidden grid-cols-5 gap-3 lg:grid">
            {instagramShowcaseItems.map((item, index) => (
              <a
                key={`${item.alt}-${index}`}
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="group relative h-[220px] min-w-0 overflow-hidden rounded-[22px] border border-white/10 bg-[#111111] xl:h-[240px] 2xl:h-[260px]"
              >
                <img
                  src={item.image}
                  alt={item.alt}
                  loading="lazy"
                  fetchPriority="low"
                  decoding="async"
                  className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.04),rgba(5,5,5,0.28)_48%,rgba(5,5,5,0.72)_100%)]" />
                <div className="absolute inset-x-0 top-0 p-4">
                  <span className="inline-flex rounded-full border border-white/12 bg-black/36 px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-white">
                    {item.label}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
