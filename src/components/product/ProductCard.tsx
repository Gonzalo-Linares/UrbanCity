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
    <article className="group overflow-hidden rounded-[30px] border border-white/10 bg-[#111111] p-2.5 transition duration-300 hover:-translate-y-1 hover:border-brand-strong/35 hover:shadow-[0_24px_44px_rgba(0,0,0,0.34)]">
      <Link to={`/catalogo/${product.slug}`} className="relative block">
        <ProductVisual
          seed={product.slug}
          name={product.name}
          categoryName={product.category?.name}
          imageUrl={product.primaryImage?.url}
          className="aspect-[4/4.5] border border-white/8 bg-[#0d0d0d]"
        />
        {discountPercent ? (
          <span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-brand-strong px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-black">
            {discountPercent}% OFF
          </span>
        ) : null}
      </Link>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-strong/78">
              {product.category?.name ?? 'Cat\u00e1logo'}
            </p>
            <Link
              to={`/catalogo/${product.slug}`}
              className="block text-xl font-semibold tracking-[-0.03em] text-white transition group-hover:text-brand-strong"
            >
              {product.name}
            </Link>
          </div>
          <StatusBadge
            tone={availabilityTone(product.availability)}
            className={availabilityBadgeClassName(product.availability)}
          >
            {formatAvailabilityLabel(product.availability)}
          </StatusBadge>
        </div>

        <p className="line-clamp-2 min-h-12 text-sm leading-6 text-white/60">
          {product.description}
        </p>

        <div className="flex items-center justify-between gap-4">
          <div>
            {discountPercent ? (
              <p className="text-sm font-medium text-white/42 line-through">
                {formatCurrency(product.compare_at_price ?? 0)}
              </p>
            ) : (
              <p className="text-xs uppercase tracking-[0.22em] text-white/42">
                Desde
              </p>
            )}
            <p className="text-2xl font-semibold tracking-[-0.03em] text-white">
              {formatCurrency(product.price)}
            </p>
          </div>
          <Link
            to={`/catalogo/${product.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-brand-strong px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#d1ff52]"
          >
            Ver detalle
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}
