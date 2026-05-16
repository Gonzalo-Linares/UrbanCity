import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductVisual } from '@/components/product/ProductVisual'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useStorefrontData } from '@/hooks/useStorefrontData'
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

  useEffect(() => {
    if (!cartFeedback) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCartFeedback(null)
    }, 2500)

    return () => window.clearTimeout(timeoutId)
  }, [cartFeedback])

  function handleAddToCart() {
    if (product.sizes.length > 0 && !selectedSizeLabel) {
      setSizeError('Seleccioná un talle para continuar.')
      return
    }

    setSizeError(null)
    addItem(product, quantity, selectedSizeLabel)
    setCartFeedback(
      selectedSizeLabel
        ? `Agregado al carrito · Talle ${selectedSizeLabel}`
        : 'Agregado al carrito',
    )
  }

  return (
    <div className="space-y-6 pb-24 sm:space-y-8 sm:pb-0">
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-2 text-sm font-medium text-white/72 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>

      <section className="surface-panel overflow-hidden">
        <div className="grid gap-4 p-3.5 sm:gap-5 sm:p-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(480px,0.95fr)] lg:p-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(520px,0.92fr)] xl:p-10 2xl:grid-cols-[minmax(0,1.1fr)_minmax(560px,0.9fr)]">
          <div className="space-y-3">
            <ProductVisual
              seed={product.slug}
              name={product.name}
              categoryName={product.category?.name}
              imageUrl={selectedImage?.url}
              imageFit="contain"
              className="h-[220px] rounded-[22px] border border-white/8 bg-white sm:h-auto sm:aspect-[1/1.02] sm:min-h-[420px] lg:min-h-[520px] xl:min-h-[580px]"
            />

            {productImages.length > 1 ? (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {productImages.map((image, index) => {
                  const isSelected = index === safeSelectedImageIndex

                  return (
                    <button
                      key={image.id}
                      type="button"
                      className={`h-[58px] w-[58px] shrink-0 overflow-hidden rounded-[18px] border transition sm:h-[72px] sm:w-[72px] ${
                        isSelected
                          ? 'border-brand-strong bg-brand-strong/10 shadow-[0_0_0_1px_rgba(182,255,0,0.25)]'
                          : 'border-white/10 bg-white/6 hover:border-white/22'
                      }`}
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
                })}
              </div>
            ) : null}
          </div>

          <div className="space-y-4 lg:self-start lg:space-y-4 xl:space-y-5">
            <div className="space-y-3">
              <p className="eyebrow">{product.category?.name ?? 'Catálogo'}</p>

              <div className="space-y-3">
                <h1 className="text-2xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-4xl lg:text-[2.8rem] xl:text-5xl">
                  {product.name}
                </h1>
                {product.description ? (
                  <p className="max-w-[52ch] text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
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

            <div className="space-y-3 border-b border-white/10 pb-4">
              {product.installment_price ? (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(220px,1fr)] sm:items-start">
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
                      3 cuotas sin interés de {formatCurrency(installmentPerQuota)}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <p className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-[3.3rem]">
                  {formatCurrency(product.price)}
                </p>
                <p className="text-sm font-medium text-brand-strong sm:text-base">
                  con transferencia o contado
                </p>
              </div>
            </div>

            {product.sizes.length > 0 ? (
              <div className="space-y-2.5 rounded-[24px] border border-white/12 bg-white/6 p-3 sm:p-3.5">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">Elegí talle</p>
                  <p className="text-xs leading-5 text-white/58 sm:text-sm">
                    Seleccioná un talle disponible.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const isSelected = selectedSizeLabel === size.size_label

                    return (
                      <button
                        key={size.id}
                        type="button"
                        className={`inline-flex min-w-[52px] items-center justify-center rounded-full border px-3 py-2 text-sm font-medium transition ${
                          isSelected
                            ? 'border-brand-strong bg-brand-strong text-black'
                            : 'border-white/12 bg-black/20 text-white/78 hover:border-white/24 hover:bg-white/8'
                        }`}
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

            <div className="grid gap-3 sm:grid-cols-[140px_1fr] sm:items-center">
              <div className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-2">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/76 hover:bg-white/10"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
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
                  onClick={() => setQuantity((current) => Math.min(99, current + 1))}
                  aria-label="Sumar cantidad"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                type="button"
                size="lg"
                variant={isSoldOut ? 'outline' : 'secondary'}
                className="h-12 w-full justify-center sm:h-14"
                disabled={isSoldOut}
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-4 w-4" />
                {isSoldOut ? 'Sin stock' : 'Agregar al carrito'}
              </Button>
            </div>

            {cartFeedback ? (
              <div className="hidden items-center justify-between gap-3 rounded-[18px] border border-emerald-500/18 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 sm:flex">
                <p>{cartFeedback}</p>
                <Link to="/carrito" className="shrink-0 font-medium text-brand-strong">
                  Ver carrito
                </Link>
              </div>
            ) : null}

            <div className="space-y-2.5 rounded-[24px] border border-white/12 bg-white/6 p-3.5 sm:p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/42">
                Medios de pago
              </p>
              <div className="space-y-2 text-sm leading-6 text-white/72">
                {installmentPerQuota ? <p>3 cuotas sin interés disponibles.</p> : null}
                <p>Go Cuotas y CrediApp disponibles.</p>
                <p>20% OFF abonando contado o transferencia.</p>
              </div>
            </div>
          </div>
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

      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#050505]/92 px-4 py-3 backdrop-blur sm:hidden">
        <div className="mx-auto max-w-screen-sm space-y-3">
          {cartFeedback ? (
            <div className="rounded-[18px] border border-emerald-500/18 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              <div className="flex items-center justify-between gap-3">
                <p>{cartFeedback}</p>
                <Link to="/carrito" className="shrink-0 font-medium text-brand-strong">
                  Ver carrito
                </Link>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-white/42">
                Precio contado
              </p>
              <p className="truncate text-base font-semibold text-white">
                {formatCurrency(product.price)}
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
              onClick={handleAddToCart}
              className="shrink-0"
            >
              {isSoldOut ? 'Sin stock' : 'Agregar'}
            </Button>
          </div>
        </div>
      </div>
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
