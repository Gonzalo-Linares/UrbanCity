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
    <div className="grid gap-4 rounded-[28px] border border-white/10 bg-[#111111] p-3.5 shadow-[0_18px_40px_rgba(0,0,0,0.2)] transition hover:border-brand-strong/28 sm:grid-cols-[124px_1fr] sm:p-4">
      <Link to={`/catalogo/${item.slug}`}>
        <ProductVisual
          seed={item.slug}
          name={item.name}
          imageUrl={item.imageUrl}
          className="aspect-[1/1] h-full min-h-32"
        />
      </Link>

      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Link
              to={`/catalogo/${item.slug}`}
              className="text-lg font-semibold tracking-[-0.03em] text-white sm:text-xl"
            >
              {item.name}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={availabilityTone(item)}>
                {formatAvailabilityLabel(item.availability)}
              </StatusBadge>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-white/64">
                {formatCurrency(item.price)} c/u
              </span>
            </div>
          </div>

          <div className="space-y-1 text-left sm:text-right">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.22em] text-white/42">
              Subtotal
            </p>
            <p className="text-2xl font-semibold tracking-[-0.03em] text-white">
              {formatCurrency(item.price * item.quantity)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-2 py-1.5">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/76 transition hover:bg-white/8 hover:text-white"
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              aria-label={`Restar una unidad de ${item.name}`}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-7 text-center text-sm font-semibold text-white">
              {item.quantity}
            </span>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/76 transition hover:bg-white/8 hover:text-white"
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              aria-label={`Sumar una unidad de ${item.name}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="h-auto px-0 py-0 text-sm text-white/58 hover:bg-transparent hover:text-white"
            onClick={() => removeItem(item.productId)}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  )
}
