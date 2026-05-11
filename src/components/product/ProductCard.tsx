import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatAvailabilityLabel, formatCurrency } from '@/lib/formatters'
import { getDiscountPercent } from '@/lib/pricing'
import type { StorefrontProduct } from '@/types/store'
import { ProductVisual } from '@/components/product/ProductVisual'

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
  const discountPercent = getDiscountPercent(
    product.price,
    product.compare_at_price,
  )

  return (
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

      <div className="space-y-2.5 p-2.5 sm:space-y-4 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="space-y-2">
            <p className="text-[0.62rem] uppercase tracking-[0.16em] text-brand-strong/78 sm:text-xs sm:tracking-[0.22em]">
              {product.category?.name ?? 'Cat\u00e1logo'}
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

        <div className="flex items-end justify-between gap-2 sm:items-center sm:gap-4">
          <div>
            {discountPercent ? (
              <>
                <p className="text-[0.72rem] font-medium text-white/42 line-through sm:text-sm">
                  {formatCurrency(product.compare_at_price ?? 0)}
                </p>
                <p className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-white/42 sm:text-[0.72rem] sm:tracking-[0.22em]">
                  Contado
                </p>
              </>
            ) : (
              <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/42 sm:text-xs sm:tracking-[0.22em]">
                Contado
              </p>
            )}
            <p className="text-lg font-semibold tracking-[-0.03em] text-white sm:text-2xl">
              {formatCurrency(product.price)}
            </p>
          </div>
          <Link
            to={`/catalogo/${product.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-strong px-2.5 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#d1ff52] sm:gap-2 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.18em]"
          >
            <span className="sm:hidden">Ver</span>
            <span className="hidden sm:inline">Ver detalle</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:h-4 sm:w-4" />
          </Link>
        </div>
      </div>
    </article>
  )
}
