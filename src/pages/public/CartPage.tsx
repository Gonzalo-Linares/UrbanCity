import { Link } from 'react-router-dom'
import { CartLineItem } from '@/components/cart/CartLineItem'
import { CartSummary } from '@/components/cart/CartSummary'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionTitle } from '@/components/ui/SectionTitle'
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
        title="Tu carrito esta vacio"
        description="Suma productos desde el catalogo para generar un pedido por WhatsApp."
        action={
          <Link to="/catalogo" className="text-sm font-medium text-brand-strong">
            Ir al catalogo
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-8">
      <section className="surface-panel p-6 sm:p-8 lg:p-10">
        <SectionTitle
          eyebrow="Carrito"
          title="Revisa cantidades y total estimado antes del checkout."
          description="Nada se cobra online en esta etapa. El pedido queda pendiente de confirmacion hasta que el comercio responda por WhatsApp."
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
