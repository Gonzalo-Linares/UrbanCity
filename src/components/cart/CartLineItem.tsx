import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductVisual } from '@/components/product/ProductVisual'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatAvailabilityLabel, formatCurrency } from '@/lib/formatters'
import { useCartStore } from '@/store/cartStore'
import type { CartItem } from '@/types/store'

function availabilityTone(item: CartItem) {
  switch (item.availability) {
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

export function CartLineItem({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeItem = useCartStore((state) => state.removeItem)

  return (
    <article className="rounded-[28px] border border-white/10 bg-[#111111] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.2)] transition hover:border-brand-strong/28 sm:p-4">
      <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-4 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center">
        <Link
          to={`/catalogo/${item.slug}`}
          className="block h-24 w-24 shrink-0 overflow-hidden rounded-[20px] bg-[#0d0d0d] sm:h-[120px] sm:w-[120px]"
        >
          <ProductVisual
            seed={item.slug}
            name={item.name}
            imageUrl={item.imageUrl}
            imageFit="contain"
            visualStyle="compact"
            imageScale="normal"
            className="h-full w-full rounded-[20px] bg-[#101010]"
          />
        </Link>

        <div className="min-w-0 space-y-3">
          <div className="min-w-0 space-y-2">
            <Link
              to={`/catalogo/${item.slug}`}
              className="block line-clamp-2 text-base font-semibold tracking-[-0.03em] text-white sm:text-xl"
            >
              {item.name}
            </Link>
            {item.sizeLabel ? (
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/42">
                Talle: {item.sizeLabel}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                tone={availabilityTone(item)}
                className="px-2 py-1 text-[0.6rem] sm:px-3 sm:text-xs"
              >
                {formatAvailabilityLabel(item.availability)}
              </StatusBadge>
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[0.68rem] font-medium text-white/64 sm:px-3 sm:text-xs">
                {formatCurrency(item.price)} c/u
              </span>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/20 px-2 py-1.5">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/76 transition hover:bg-white/8 hover:text-white sm:h-9 sm:w-9"
              onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
              aria-label={`Restar una unidad de ${item.name}`}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-7 text-center text-sm font-semibold text-white">
              {item.quantity}
            </span>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/76 transition hover:bg-white/8 hover:text-white sm:h-9 sm:w-9"
              onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
              aria-label={`Sumar una unidad de ${item.name}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="col-span-2 flex items-center justify-between gap-3 border-t border-white/10 pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:justify-between sm:self-stretch sm:border-t-0 sm:pt-0">
          <div className="space-y-1 text-left sm:text-right">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.22em] text-white/42">
              Subtotal
            </p>
            <p className="text-lg font-semibold tracking-[-0.03em] text-white sm:text-2xl">
              {formatCurrency(item.price * item.quantity)}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="h-auto px-0 py-0 text-xs text-white/58 hover:bg-transparent hover:text-white sm:text-sm"
            onClick={() => removeItem(item.cartItemId)}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>
    </article>
  )
}
