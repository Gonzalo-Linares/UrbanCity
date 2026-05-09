import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/cn'

interface CartSummaryProps {
  itemCount: number
  total: number
  onClearCart: () => void
}

export function CartSummary({
  itemCount,
  total,
  onClearCart,
}: CartSummaryProps) {
  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <p className="eyebrow">Resumen</p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-stone-950">
          Total estimado
        </h2>
      </div>

      <div className="grid gap-3 rounded-[24px] border border-stone-900/8 bg-stone-950 p-5 text-white">
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>Productos</span>
          <span>{itemCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>Estado del pedido</span>
          <span>Pendiente de confirmacion</span>
        </div>
        <div className="glass-divider bg-gradient-to-r from-transparent via-white/18 to-transparent" />
        <div className="flex items-end justify-between gap-4">
          <span className="text-sm text-white/70">Total</span>
          <span className="text-3xl font-semibold tracking-[-0.04em]">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-brand/12 bg-brand/7 p-4 text-sm leading-6 text-stone-700">
        <p>Pedido pendiente de confirmacion.</p>
        <p>El pago se coordina con el comercio.</p>
        <p>La disponibilidad sera confirmada por WhatsApp.</p>
      </div>

      <Link
        to="/checkout"
        className={cn(buttonStyles({ variant: 'secondary', size: 'lg' }), 'w-full')}
      >
        Continuar al checkout
        <ArrowRight className="h-4 w-4" />
      </Link>

      <Button type="button" variant="ghost" className="w-full" onClick={onClearCart}>
        Vaciar carrito
      </Button>
    </Card>
  )
}
