import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, ShoppingBag, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductVisual } from '@/components/product/ProductVisual'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { StatusBadge } from '@/components/ui/StatusBadge'
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

function formatProductSizesSummary(sizes: StorefrontProduct['sizes']) {
  const labels = Array.from(
    new Set(
      sizes
        .map((size) => size.size_label.trim())
        .filter((sizeLabel) => sizeLabel.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right, 'es', { numeric: true }))

  if (labels.length === 0) {
    return null
  }

  if (labels.length === 1) {
    return `Talle ${labels[0]}`
  }

  const numericLabels = labels.map((label) =>
    /^\d+$/.test(label) ? Number(label) : null,
  )
  const allNumeric = numericLabels.every((value) => value !== null)
  const firstLabel = labels[0]
  const lastLabel = labels[labels.length - 1]

  if (allNumeric) {
    const numericValues = numericLabels as number[]
    const isContinuous = numericValues.every(
      (value, index) => {
        if (index === 0) {
          return true
        }

        const previousValue = numericValues[index - 1]
        return previousValue !== undefined && value - previousValue === 1
      },
    )

    if (isContinuous && labels.length >= 3) {
      return `Talles: ${firstLabel}-${lastLabel}`
    }
  }

  if (labels.length <= 5) {
    return `Talles: ${labels.join(', ')}`
  }

  if (allNumeric) {
    return `Talles: ${firstLabel}-${lastLabel}`
  }

  return 'Talles disponibles'
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
  const sizesSummary = useMemo(
    () => formatProductSizesSummary(product.sizes),
    [product.sizes],
  )
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
            <div className="space-y-2">
              <p className="text-[0.62rem] uppercase tracking-[0.16em] text-brand-strong/78 sm:text-xs sm:tracking-[0.22em]">
                {product.category?.name ?? 'Catálogo'}
              </p>
              <Link
                to={`/catalogo/${product.slug}`}
                className="block line-clamp-2 text-[0.95rem] leading-5 font-semibold tracking-[-0.03em] text-white transition group-hover:text-brand-strong sm:text-xl"
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

          <p className="hidden min-h-12 text-sm leading-6 text-white/60 sm:block sm:line-clamp-2">
            {product.description}
          </p>

          <div className="space-y-2.5">
            <div>
              {installmentPerQuota ? (
                <p className="text-[0.72rem] font-medium text-white/48 sm:text-sm">
                  3 cuotas de {formatCurrency(installmentPerQuota)}
                </p>
              ) : null}
              {sizesSummary ? (
                <p className="mt-1 truncate text-[0.68rem] font-medium text-white/46 sm:text-xs">
                  {sizesSummary}
                </p>
              ) : null}
              <p className="mt-1 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-white/42 sm:text-[0.72rem] sm:tracking-[0.22em]">
                Contado
              </p>
              <p className="text-lg font-semibold tracking-[-0.03em] text-white sm:text-2xl">
                {formatCurrency(product.price)}
              </p>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <Button
                type="button"
                size="sm"
                variant={isSoldOut ? 'outline' : 'secondary'}
                disabled={isSoldOut}
                className="min-w-0 px-3.5"
                onClick={handleQuickAction}
              >
                <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {isSoldOut
                    ? 'Sin stock'
                    : hasSizes
                      ? 'Elegir talle'
                      : 'Agregar'}
                </span>
              </Button>

              <Link
                to={`/catalogo/${product.slug}`}
                className={buttonStyles({
                  variant: 'outline',
                  size: 'sm',
                  className: 'gap-1.5 whitespace-nowrap px-3.5',
                })}
              >
                <span className="sm:hidden">Ver</span>
                <span className="hidden sm:inline">Ver detalle</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:h-4 sm:w-4" />
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
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
          onClick={closeQuickAdd}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`quick-add-title-${product.id}`}
            className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#101010] p-4 text-white shadow-[0_-24px_80px_rgba(0,0,0,0.55)] sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:w-[min(420px,calc(100vw-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[30px] sm:p-5"
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
