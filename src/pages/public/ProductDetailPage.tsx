import { useState } from 'react'
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
import { getDiscountPercent } from '@/lib/pricing'
import { useCartStore } from '@/store/cartStore'

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

export function ProductDetailPage() {
  const { slug } = useParams()
  const { products, loading } = useStorefrontData()
  const addItem = useCartStore((state) => state.addItem)
  const [quantity, setQuantity] = useState(1)

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

  const isSoldOut = product.availability === 'out_of_stock'
  const discountPercent = getDiscountPercent(
    product.price,
    product.compare_at_price,
  )

  return (
    <div className="space-y-8 pb-20 sm:pb-0">
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-2 text-sm font-medium text-white/72 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>

      <section className="surface-panel overflow-hidden">
        <div className="grid gap-5 p-4 sm:p-8 lg:grid-cols-[1fr_0.95fr] lg:p-10">
          <ProductVisual
            seed={product.slug}
            name={product.name}
            categoryName={product.category?.name}
            imageUrl={product.primaryImage?.url}
            className="h-[260px] sm:h-auto sm:aspect-[1/1.05] sm:min-h-[320px]"
          />

          <div className="space-y-6">
            <div className="space-y-4">
              <p className="eyebrow">{product.category?.name ?? 'Catálogo'}</p>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  {product.name}
                </h1>
                <p className="line-clamp-3 text-sm leading-7 text-white/72 sm:line-clamp-none sm:text-base sm:leading-8">
                  {product.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone={availabilityTone(product.availability)}>
                  {formatAvailabilityLabel(product.availability)}
                </StatusBadge>
                {discountPercent ? (
                  <span className="inline-flex items-center rounded-full bg-brand-strong px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black">
                    {discountPercent}% OFF
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-end gap-3">
                {discountPercent ? (
                  <span className="text-lg font-medium text-white/42 line-through">
                    {formatCurrency(product.compare_at_price ?? 0)}
                  </span>
                ) : null}
                <span className="text-xs font-medium uppercase tracking-[0.22em] text-white/42">
                  Precio contado
                </span>
                <span className="text-3xl font-semibold tracking-[-0.04em] text-white">
                  {formatCurrency(product.price)}
                </span>
              </div>
              {discountPercent ? (
                <p className="text-sm font-medium text-brand-strong">
                  Oferta vigente sujeta a disponibilidad.
                </p>
              ) : null}
              <div className="space-y-2 rounded-[24px] border border-white/12 bg-white/6 p-3.5 text-sm leading-6 text-white/78 sm:p-4">
                <p>💳 3 cuotas sin interés disponibles</p>
                <p>💰 20% OFF pago contado</p>
                <p>📲 Billeteras virtuales incluidas como pago contado</p>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/12 bg-white/6 p-3.5 text-sm leading-6 text-white/78 sm:p-4">
              Pedido pendiente de confirmación. El total publicado corresponde a
              precio contado estimado. Confirmamos disponibilidad, talle, forma de
              pago y precio final por WhatsApp.
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-2 py-2 sm:w-auto">
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
                className="w-full sm:w-auto"
                disabled={isSoldOut}
                onClick={() => addItem(product, quantity)}
              >
                <ShoppingBag className="h-4 w-4" />
                {isSoldOut ? 'Sin stock' : 'Agregar al carrito'}
              </Button>
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
    </div>
  )
}
