import { useEffect, useState } from 'react'
import { ArrowUpRight, ShoppingBag, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductVisual } from '@/components/product/ProductVisual'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/lib/cn'
import { formatAvailabilityLabel, formatCurrency } from '@/lib/formatters'
import { getDiscountPercent, getInstallmentPerQuota } from '@/lib/pricing'
import { useCartStore } from '@/store/cartStore'
import type { StorefrontProduct } from '@/types/store'

function availabilityTone(availability: StorefrontProduct['availability']) {
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

function availabilityBadgeClassName(availability: StorefrontProduct['availability']) {
  switch (availability) {
    case 'available':
      return 'border-emerald-400/18 bg-emerald-500/10 text-emerald-200'
    case 'inquiry':
      return 'border-brand-strong/20 bg-brand-strong/12 text-brand-strong'
    case 'out_of_stock':
      return 'border-rose-400/18 bg-rose-500/10 text-rose-200'
    default:
      return 'border-white/12 bg-white/6 text-white/64'
  }
}

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const addItem = useCartStore((state) => state.addItem)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [selectedSizeLabel, setSelectedSizeLabel] = useState<string | null>(null)
  const [quickAddError, setQuickAddError] = useState<string | null>(null)
  const [cartFeedback, setCartFeedback] = useState<string | null>(null)

  const discountPercent = getDiscountPercent(
    product.price,
    product.compare_at_price,
  )
  const installmentPerQuota = getInstallmentPerQuota(product.installment_price)
  const hasSizes = product.sizes.length > 0
  const isSoldOut = product.availability === 'out_of_stock'

  useEffect(() => {
    if (!cartFeedback) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCartFeedback(null)
    }, 2500)

    return () => window.clearTimeout(timeoutId)
  }, [cartFeedback])

  useEffect(() => {
    if (!showQuickAdd || typeof window === 'undefined') {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowQuickAdd(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showQuickAdd])

  useEffect(() => {
    if (!showQuickAdd || typeof document === 'undefined') {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [showQuickAdd])

  function closeQuickAdd() {
    setShowQuickAdd(false)
    setQuickAddError(null)
  }

  function openQuickAdd() {
    setSelectedSizeLabel(null)
    setQuickAddError(null)
    setShowQuickAdd(true)
  }

  function handleDirectAdd() {
    addItem(product, 1, null)
    setCartFeedback('Agregado al carrito')
  }

  function handleQuickAction() {
    if (isSoldOut) {
      return
    }

    if (hasSizes) {
      openQuickAdd()
      return
    }

    handleDirectAdd()
  }

  function handleConfirmQuickAdd() {
    if (!selectedSizeLabel) {
      setQuickAddError('Seleccioná un talle para continuar.')
      return
    }

    addItem(product, 1, selectedSizeLabel)
    closeQuickAdd()
    setSelectedSizeLabel(null)
    setCartFeedback(`Agregado al carrito · Talle ${selectedSizeLabel}`)
  }

  return (
    <>
      <article className="group overflow-hidden rounded-[22px] border border-white/10 bg-[#111111] p-1.5 transition duration-300 hover:-translate-y-1 hover:border-brand-strong/35 hover:shadow-[0_24px_44px_rgba(0,0,0,0.34)] sm:rounded-[30px] sm:p-2.5">
        <Link to={`/catalogo/${product.slug}`} className="relative block">
          <ProductVisual
            seed={product.slug}
            name={product.name}
            categoryName={product.category?.name}
            imageUrl={product.primaryImage?.url}
            className="aspect-square rounded-[18px] border border-white/8 bg-[#0d0d0d] sm:aspect-[4/4.5] sm:rounded-[24px]"
          />
          {discountPercent ? (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center rounded-full bg-brand-strong px-2 py-1 text-[0.56rem] font-semibold uppercase tracking-[0.14em] text-black sm:top-4 sm:left-4 sm:px-3 sm:text-[0.68rem] sm:tracking-[0.18em]">
              {discountPercent}% OFF
            </span>
          ) : null}
        </Link>

        <div className="space-y-3 p-2.5 sm:space-y-4 sm:p-4">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0 space-y-2">
              <p className="text-[0.62rem] uppercase tracking-[0.16em] text-brand-strong/78 sm:text-xs sm:tracking-[0.22em]">
                {product.category?.name ?? 'Catálogo'}
              </p>
              <Link
                to={`/catalogo/${product.slug}`}
                className="block min-h-[3.75rem] line-clamp-3 text-[0.95rem] leading-5 font-semibold tracking-[-0.03em] text-white transition group-hover:text-brand-strong sm:min-h-[4.5rem] sm:text-xl sm:leading-6"
              >
                {product.name}
              </Link>
            </div>
            <StatusBadge
              tone={availabilityTone(product.availability)}
              className={availabilityBadgeClassName(
                product.availability,
              ).concat(' hidden px-2 py-1 text-[0.6rem] sm:inline-flex sm:px-3 sm:text-xs')}
            >
              {formatAvailabilityLabel(product.availability)}
            </StatusBadge>
          </div>

          <div className="space-y-2.5">
            <div>
              {installmentPerQuota ? (
                <p className="text-[0.72rem] font-medium text-white/48 sm:text-sm">
                  3 cuotas de {formatCurrency(installmentPerQuota)}
                </p>
              ) : null}
              <p className="mt-1 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-white/42 sm:text-[0.72rem] sm:tracking-[0.22em]">
                Contado
              </p>
              <p className="text-lg font-semibold tracking-[-0.03em] text-white sm:text-2xl">
                {formatCurrency(product.price)}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(118px,1fr)_minmax(112px,auto)] sm:items-center">
              <Button
                type="button"
                size="sm"
                variant={isSoldOut ? 'outline' : 'secondary'}
                disabled={isSoldOut}
                className={cn(
                  'order-1 w-full min-w-0 px-3 text-[0.8rem] sm:order-1 sm:h-10 sm:px-3 sm:text-[0.78rem] xl:text-sm',
                  !isSoldOut &&
                    'sm:border sm:border-white/12 sm:bg-white/6 sm:text-white sm:shadow-none sm:hover:bg-white/10',
                )}
                onClick={handleQuickAction}
              >
                <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate whitespace-nowrap">
                  {isSoldOut
                    ? 'Sin stock'
                    : hasSizes
                      ? 'Elegir talle'
                      : 'Agregar'}
                </span>
              </Button>

              <Link
                to={`/catalogo/${product.slug}`}
                className={cn(
                  buttonStyles({
                    variant: 'outline',
                    size: 'sm',
                    className:
                      'order-2 w-full justify-center gap-1.5 px-3 text-[0.8rem] sm:order-2 sm:h-10 sm:w-auto sm:min-w-[108px] sm:px-3 sm:text-[0.78rem] xl:text-sm',
                  }),
                  'whitespace-nowrap text-white/76 shadow-none sm:border-transparent sm:bg-brand-strong sm:text-black sm:shadow-[0_14px_28px_rgba(182,255,0,0.2)] sm:hover:bg-[#d1ff52]',
                )}
              >
                <span className="sm:hidden">Ver</span>
                <span className="hidden whitespace-nowrap sm:inline">Ver detalle</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:h-4 sm:w-4" />
              </Link>
            </div>

            {cartFeedback ? (
              <div className="rounded-[18px] border border-emerald-500/18 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
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
          </div>
        </div>
      </article>

      {showQuickAdd ? (
        <div
          className="fixed inset-0 z-[90] bg-black/72 backdrop-blur-[3px] sm:backdrop-blur-[4px]"
          onClick={closeQuickAdd}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(182,255,0,0.06),transparent_36%)]" />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`quick-add-title-${product.id}`}
            className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#101010]/98 p-4 text-white shadow-[0_-24px_80px_rgba(0,0,0,0.55)] sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:w-[min(420px,calc(100vw-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[30px] sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-brand-strong/76">
                    {product.category?.name ?? 'Catálogo'}
                  </p>
                  <h3
                    id={`quick-add-title-${product.id}`}
                    className="text-lg font-semibold tracking-[-0.03em] text-white"
                  >
                    {product.name}
                  </h3>
                  <p className="text-sm text-white/62">
                    Precio contado {formatCurrency(product.price)}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/12 bg-black/20 text-white/72 transition hover:bg-white/8 hover:text-white"
                  onClick={closeQuickAdd}
                  aria-label="Cerrar elección de talle"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 rounded-[24px] border border-white/10 bg-white/6 p-3.5">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">Elegí talle</p>
                  <p className="text-xs leading-5 text-white/56">
                    Seleccioná un talle disponible para agregar al carrito.
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
                          setQuickAddError(null)
                        }}
                      >
                        {size.size_label}
                      </button>
                    )
                  })}
                </div>
                {quickAddError ? (
                  <p className="text-sm text-rose-200">{quickAddError}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to={`/catalogo/${product.slug}`}
                  className={buttonStyles({
                    variant: 'outline',
                    size: 'md',
                    className: 'w-full sm:w-auto',
                  })}
                  onClick={closeQuickAdd}
                >
                  Ver detalle
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={handleConfirmQuickAdd}
                >
                  Agregar al carrito
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
