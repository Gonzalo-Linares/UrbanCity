import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatAvailabilityLabel, formatCurrency } from '@/lib/formatters'
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

export function ProductCard({ product }: { product: StorefrontProduct }) {
  return (
    <article className="surface-card group overflow-hidden border border-black/8 p-2.5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(0,0,0,0.16)]">
      <Link to={`/catalogo/${product.slug}`} className="block">
        <ProductVisual
          seed={product.slug}
          name={product.name}
          categoryName={product.category?.name}
          imageUrl={product.primaryImage?.url}
          className="aspect-[4/4.5]"
        />
      </Link>

      <div className="space-y-4 p-3 sm:p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-[#506d00]">
              {product.category?.name ?? 'Catalogo'}
            </p>
            <Link
              to={`/catalogo/${product.slug}`}
              className="block text-xl font-semibold tracking-[-0.03em] text-stone-950 transition group-hover:text-black"
            >
              {product.name}
            </Link>
          </div>
          <StatusBadge tone={availabilityTone(product.availability)}>
            {formatAvailabilityLabel(product.availability)}
          </StatusBadge>
        </div>

        <p className="line-clamp-2 min-h-12 text-sm leading-6 text-muted">
          {product.description}
        </p>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              Desde
            </p>
            <p className="text-2xl font-semibold tracking-[-0.03em] text-stone-950">
              {formatCurrency(product.price)}
            </p>
          </div>
          <Link
            to={`/catalogo/${product.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
          >
            Ver detalle
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}
