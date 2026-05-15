import { Link } from 'react-router-dom'
import { CartLineItem } from '@/components/cart/CartLineItem'
import { CartSummary } from '@/components/cart/CartSummary'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { cn } from '@/lib/cn'
import { useCartStore } from '@/store/cartStore'

export function CartPage() {
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const itemCount = items.reduce((total, item) => total + item.quantity, 0)
  const total = items.reduce(
    (subtotal, item) => subtotal + item.price * item.quantity,
    0,
  )

  if (items.length === 0) {
    return (
      <EmptyState
        title="Tu carrito está vacío"
        description="Sumá productos desde el catálogo y coordiná tu pedido por WhatsApp."
        action={
          <Link
            to="/catalogo"
            className={cn(buttonStyles({ variant: 'secondary' }), 'min-w-[180px]')}
          >
            Ir al catálogo
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-8">
      <section className="surface-panel p-5 sm:p-8 lg:p-10">
        <SectionTitle
          eyebrow="Carrito"
          title="Tu carrito"
          description="Revisá tus productos antes de coordinar el pedido por WhatsApp."
          tone="light"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-4">
          {items.map((item) => (
            <CartLineItem key={item.productId} item={item} />
          ))}
        </div>
        <div className="lg:sticky lg:top-28">
          <CartSummary
            itemCount={itemCount}
            total={total}
            onClearCart={clearCart}
          />
        </div>
      </div>
    </div>
  )
}
