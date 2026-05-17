import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import goCuotasLogo from '@/assets/GoCuotas_icon.png'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductVisual } from '@/components/product/ProductVisual'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { dispatchCartAddedEvent } from '@/lib/cartEvents'
import { cn } from '@/lib/cn'
import { formatAvailabilityLabel, formatCurrency } from '@/lib/formatters'
import { getDiscountPercent, getInstallmentPerQuota } from '@/lib/pricing'
import { useCartStore } from '@/store/cartStore'
import type { ProductImageRow } from '@/types/database'
import type { StorefrontProduct } from '@/types/store'

function availabilityTone(availability: string) {
  switch (availability) {
    case 'available':
      return 'success'
    case 'inquiry':
      return 'warning'
    case 'out_of_stock':
      return 'danger'
    default:
      return 'muted'
  }
}

function ProductDetailContent({
  product,
  relatedProducts,
}: {
  product: StorefrontProduct
  relatedProducts: StorefrontProduct[]
}) {
  const addItem = useCartStore((state) => state.addItem)
  const [quantity, setQuantity] = useState(1)
  const [selectedSizeLabel, setSelectedSizeLabel] = useState<string | null>(null)
  const [sizeError, setSizeError] = useState<string | null>(null)
  const [cartFeedback, setCartFeedback] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [paymentsOpen, setPaymentsOpen] = useState(false)
  const [sizePickerOpen, setSizePickerOpen] = useState(false)

  const isSoldOut = product.availability === 'out_of_stock'
  const discountPercent = getDiscountPercent(
    product.price,
    product.compare_at_price,
  )
  const installmentPerQuota = getInstallmentPerQuota(product.installment_price)
  const productImages = useMemo<ProductImageRow[]>(() => {
    if (product.images.length > 0) {
      return product.images
    }

    return product.primaryImage ? [product.primaryImage] : []
  }, [product.images, product.primaryImage])
  const safeSelectedImageIndex =
    selectedImageIndex < productImages.length ? selectedImageIndex : 0
  const selectedImage = productImages[safeSelectedImageIndex] ?? null
  const hasDesktopImageRail = productImages.length > 1

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      })
    }
  }, [product.id])

  useEffect(() => {
    if (!cartFeedback) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCartFeedback(null)
    }, 2500)

    return () => window.clearTimeout(timeoutId)
  }, [cartFeedback])

  function addCurrentSelectionToCart(
    sizeLabel: string | null = selectedSizeLabel,
  ) {
    if (product.sizes.length > 0 && !sizeLabel) {
      setSizeError('Seleccioná un talle para continuar.')
      return false
    }

    setSizeError(null)
    addItem(product, quantity, sizeLabel)
    dispatchCartAddedEvent({
      name: product.name,
      price: product.installment_price ?? product.price,
      imageUrl: product.primaryImage?.url ?? product.images[0]?.url ?? null,
      sizeLabel,
      quantity,
    })
    setCartFeedback(
      sizeLabel
        ? `Agregado al carrito · Talle ${sizeLabel}`
        : 'Agregado al carrito',
    )

    return true
  }

  function handleAddToCart(options?: { openSizePickerOnMissingSize?: boolean }) {
    if (product.sizes.length > 0 && !selectedSizeLabel) {
      setSizeError('Seleccioná un talle para continuar.')

      if (options?.openSizePickerOnMissingSize) {
        setSizePickerOpen(true)
      }

      return
    }

    addCurrentSelectionToCart()
  }

  function handleAddToCartFromSizePicker() {
    const added = addCurrentSelectionToCart(selectedSizeLabel)

    if (added) {
      setSizePickerOpen(false)
    }
  }

  function renderThumbnail(
    image: ProductImageRow,
    index: number,
    desktop = false,
  ) {
    const isSelected = index === safeSelectedImageIndex

    return (
      <button
        key={image.id}
        type="button"
        className={cn(
          'shrink-0 overflow-hidden border transition',
          desktop
            ? 'h-16 w-16 rounded-[18px] xl:h-20 xl:w-20'
            : 'h-[58px] w-[58px] rounded-[18px] sm:h-[72px] sm:w-[72px]',
          isSelected
            ? 'border-brand-strong bg-brand-strong/10 shadow-[0_0_0_1px_rgba(182,255,0,0.25)]'
            : 'border-white/10 bg-white/6 opacity-84 hover:border-white/22 hover:opacity-100',
        )}
        onClick={() => setSelectedImageIndex(index)}
        aria-label={`Ver foto ${index + 1} de producto`}
      >
        <img
          src={image.url}
          alt={image.alt ?? `${product.name} foto ${index + 1}`}
          className="h-full w-full bg-white object-contain"
        />
      </button>
    )
  }

  return (
    <div className="relative w-full space-y-6 pb-32 sm:space-y-8 sm:pb-0">
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-2 text-sm font-medium text-white/72 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>

      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen border-y border-white/10 bg-[#080808]">
        <div
          className={cn(
            'mx-auto grid w-full max-w-[1800px] grid-cols-1 gap-0 px-4 py-6 sm:px-6 lg:min-h-[calc(100vh-190px)] lg:items-start lg:px-8 lg:py-8',
            hasDesktopImageRail
              ? 'lg:grid-cols-[96px_minmax(620px,1fr)_minmax(430px,520px)] xl:grid-cols-[112px_minmax(760px,1fr)_minmax(460px,560px)] 2xl:grid-cols-[120px_minmax(880px,1fr)_minmax(500px,600px)]'
              : 'lg:grid-cols-[minmax(620px,1fr)_minmax(430px,520px)] xl:grid-cols-[minmax(760px,1fr)_minmax(460px,560px)] 2xl:grid-cols-[minmax(880px,1fr)_minmax(500px,600px)]',
          )}
        >
          {hasDesktopImageRail ? (
            <aside className="hidden lg:flex lg:flex-col lg:items-center lg:gap-3 lg:self-start">
              {productImages.map((image, index) =>
                renderThumbnail(image, index, true),
              )}
            </aside>
          ) : null}

          <div className="space-y-3 lg:pr-8 xl:pr-10">
            <div className="flex min-h-[360px] items-center justify-center lg:min-h-[calc(100vh-230px)]">
              <ProductVisual
                seed={product.slug}
                name={product.name}
                categoryName={product.category?.name}
                imageUrl={selectedImage?.url}
                imageFit="contain"
                className="h-[300px] w-full max-w-full rounded-[24px] border border-white/8 bg-white sm:h-[460px] lg:h-[calc(100vh-230px)] lg:min-h-[580px] lg:max-h-[760px] xl:min-h-[640px] 2xl:min-h-[700px]"
              />
            </div>

            {productImages.length > 1 ? (
              <div className="flex gap-2.5 overflow-x-auto pb-1 lg:hidden">
                {productImages.map((image, index) =>
                  renderThumbnail(image, index),
                )}
              </div>
            ) : null}
          </div>

          <aside className="lg:self-start">
            <div className="space-y-4 lg:border-l lg:border-white/10 lg:pl-8 xl:space-y-5 xl:pl-10">
              <div className="space-y-3">
                <p className="eyebrow">{product.category?.name ?? 'Catálogo'}</p>

                <div className="space-y-2.5">
                  <h1 className="text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-4xl xl:text-[2.7rem] 2xl:text-5xl">
                    {product.name}
                  </h1>
                  {product.description ? (
                    <p className="max-w-[52ch] text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
                      {product.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <StatusBadge
                    tone={availabilityTone(product.availability)}
                    className="px-2 py-1 text-[0.62rem] sm:px-3 sm:text-xs"
                  >
                    {formatAvailabilityLabel(product.availability)}
                  </StatusBadge>
                  {discountPercent ? (
                    <span className="inline-flex items-center rounded-full bg-brand-strong px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-black sm:px-3 sm:text-xs">
                      {discountPercent}% OFF
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 border-y border-white/10 py-4">
                {product.installment_price ? (
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(180px,1fr)] sm:items-start sm:gap-4">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/42">
                        Precio lista
                      </p>
                      <p className="text-lg font-semibold text-white/78">
                        {formatCurrency(product.installment_price)}
                      </p>
                    </div>

                    {installmentPerQuota ? (
                      <div className="sm:text-right">
                        <p className="text-sm font-semibold leading-5 text-brand-strong">
                          3 cuotas sin interés de{' '}
                          {formatCurrency(installmentPerQuota)}
                        </p>
                        <div className="mt-2 flex items-center gap-2 sm:inline-flex sm:justify-end">
                          <img
                            src={goCuotasLogo}
                            alt="Go Cuotas"
                            className="h-6 w-auto object-contain sm:h-8"
                            loading="lazy"
                          />
                          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-white/82 sm:text-[0.8rem]">
                            SIN interés con DÉBITO
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-1">
                  <p className="text-4xl font-semibold tracking-[-0.04em] text-white xl:text-5xl">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-sm font-semibold text-brand-strong">
                    con transferencia o contado
                  </p>
                </div>
              </div>

              {product.sizes.length > 0 ? (
                <div className="space-y-2 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/45">
                      Talle
                    </p>
                    {selectedSizeLabel ? (
                      <p className="text-sm font-semibold text-white">
                        {selectedSizeLabel}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => {
                      const isSelected = selectedSizeLabel === size.size_label

                      return (
                        <button
                          key={size.id}
                          type="button"
                          className={cn(
                            'inline-flex h-10 min-w-[42px] items-center justify-center rounded-xl border px-3 text-sm font-medium transition',
                            isSelected
                              ? 'border-brand-strong bg-brand-strong text-black'
                              : 'border-white/14 bg-black/20 text-white/78 hover:border-white/24 hover:bg-white/8',
                          )}
                          onClick={() => {
                            setSelectedSizeLabel(size.size_label)
                            setSizeError(null)
                          }}
                        >
                          {size.size_label}
                        </button>
                      )
                    })}
                  </div>

                  {sizeError ? (
                    <p className="text-sm text-rose-200">{sizeError}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <div className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-2">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/76 hover:bg-white/10"
                    onClick={() =>
                      setQuantity((current) => Math.max(1, current - 1))
                    }
                    aria-label="Restar cantidad"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/76 hover:bg-white/10"
                    onClick={() =>
                      setQuantity((current) => Math.min(99, current + 1))
                    }
                    aria-label="Sumar cantidad"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <Button
                  type="button"
                  size="lg"
                  variant={isSoldOut ? 'outline' : 'secondary'}
                  className="h-14 w-full justify-center"
                  disabled={isSoldOut}
                  onClick={() => handleAddToCart()}
                >
                  <ShoppingBag className="h-4 w-4" />
                  {isSoldOut ? 'Sin stock' : 'Agregar al carrito'}
                </Button>
              </div>

              <div className="border-t border-white/10 py-4">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 text-left"
                  onClick={() => setPaymentsOpen((current) => !current)}
                  aria-expanded={paymentsOpen}
                  aria-controls="product-payments-panel"
                >
                  <span className="text-sm font-semibold text-white">
                    Medios de pago
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-white/62 transition',
                      paymentsOpen && 'rotate-180',
                    )}
                  />
                </button>

                {paymentsOpen ? (
                  <div
                    id="product-payments-panel"
                    className="mt-3 space-y-2 text-sm leading-6 text-white/72"
                  >
                    <p>Tarjetas de crédito 3 cuotas sin interés disponibles.</p>
                    <p>Go Cuotas SIN interés con DÉBITO y CrediApp disponibles.</p>
                    <p>20% OFF abonando contado o transferencia.</p>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="space-y-5">
          <SectionTitle
            eyebrow="Relacionados"
            title="También puede interesarte"
            description="Productos de la misma categoría para completar el pedido sin salir del flujo."
            tone="light"
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      {sizePickerOpen ? (
        <div className="fixed inset-0 z-[100] h-[100dvh] overflow-hidden sm:hidden">
          <button
            type="button"
            aria-label="Cerrar selección de talle"
            className="absolute inset-0 h-full w-full bg-black/74 backdrop-blur-md"
            onClick={() => setSizePickerOpen(false)}
          />

          <div className="absolute inset-x-0 bottom-0 max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#101010] p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-[0_-24px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-white">Elegí tu talle</p>
                <p className="text-sm leading-6 text-white/60">
                  Seleccioná un talle disponible para agregar al carrito.
                </p>
              </div>

              <button
                type="button"
                aria-label="Cerrar selector de talle"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/72"
                onClick={() => setSizePickerOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-1">
              <p className="text-sm font-semibold text-white">{product.name}</p>
              <p className="text-sm text-brand-strong">
                {formatCurrency(product.price)} · con transferencia o contado
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {product.sizes.map((size) => {
                  const isSelected = selectedSizeLabel === size.size_label

                  return (
                    <button
                      key={`mobile-size-${size.id}`}
                      type="button"
                      className={cn(
                        'inline-flex h-11 min-w-0 items-center justify-center rounded-xl border px-3 text-sm font-medium transition',
                        isSelected
                          ? 'border-brand-strong bg-brand-strong text-black'
                          : 'border-white/14 bg-black/20 text-white/78 hover:border-white/24 hover:bg-white/8',
                      )}
                      onClick={() => {
                        setSelectedSizeLabel(size.size_label)
                        setSizeError(null)
                      }}
                    >
                      {size.size_label}
                    </button>
                  )
                })}
              </div>

              {sizeError ? (
                <p className="text-sm text-rose-200">{sizeError}</p>
              ) : null}

              <Button
                type="button"
                size="lg"
                variant={isSoldOut ? 'outline' : 'secondary'}
                className="h-12 w-full justify-center"
                disabled={isSoldOut}
                onClick={handleAddToCartFromSizePicker}
              >
                <ShoppingBag className="h-4 w-4" />
                {isSoldOut ? 'Sin stock' : 'Agregar al carrito'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {!sizePickerOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#050505]/92 px-4 py-3 backdrop-blur sm:hidden">
          <div className="mx-auto max-w-screen-sm space-y-3">
            {cartFeedback ? (
              <div className="rounded-[18px] border border-emerald-500/18 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                <div className="flex items-center justify-between gap-3">
                  <p>{cartFeedback}</p>
                  <Link
                    to="/carrito"
                    className="shrink-0 font-medium text-brand-strong"
                  >
                    Ver carrito
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-white">
                  {formatCurrency(product.price)}
                </p>
                <p className="text-xs font-medium text-brand-strong">
                  con transferencia o contado
                </p>
                {selectedSizeLabel ? (
                  <p className="text-xs text-white/52">Talle {selectedSizeLabel}</p>
                ) : product.sizes.length > 0 ? (
                  <p className="text-xs text-white/52">Elegí talle</p>
                ) : null}
              </div>

              <Button
                type="button"
                variant={isSoldOut ? 'outline' : 'secondary'}
                disabled={isSoldOut}
                onClick={() =>
                  handleAddToCart({ openSizePickerOnMissingSize: true })
                }
                className="h-12 shrink-0 px-4 text-sm"
              >
                <ShoppingBag className="h-4 w-4" />
                {isSoldOut ? (
                  'Sin stock'
                ) : (
                  <>
                    <span className="hidden min-[380px]:inline">
                      Agregar al carrito
                    </span>
                    <span className="min-[380px]:hidden">Agregar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function ProductDetailPage() {
  const { slug } = useParams()
  const { products, loading } = useStorefrontData()

  if (loading) {
    return <LoadingState label="Cargando producto..." />
  }

  const product = products.find((item) => item.slug === slug)

  if (!product) {
    return (
      <EmptyState
        title="Ese producto no existe o ya no está visible"
        description="Volvé al catálogo para seguir navegando la tienda."
        action={
          <Link to="/catalogo" className="text-sm font-medium text-brand-strong">
            Ir al catálogo
          </Link>
        }
      />
    )
  }

  const relatedProducts = products
    .filter(
      (item) => item.id !== product.id && item.category_id === product.category_id,
    )
    .slice(0, 3)

  return (
    <ProductDetailContent
      key={product.id}
      product={product}
      relatedProducts={relatedProducts}
    />
  )
}
