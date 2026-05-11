import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/buttonStyles'
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
    <div className="space-y-5 rounded-[28px] border border-white/10 bg-[#111111] p-5 shadow-[0_24px_56px_rgba(0,0,0,0.22)] sm:p-6">
      <div className="space-y-1">
        <p className="eyebrow">Resumen</p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
          Total estimado
        </h2>
      </div>

      <div className="grid gap-3 rounded-[24px] border border-white/10 bg-black/20 p-5 text-white">
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>Productos</span>
          <span>{itemCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>Estado del pedido</span>
          <span>Pendiente de confirmación</span>
        </div>
        <div className="glass-divider bg-gradient-to-r from-transparent via-white/18 to-transparent" />
        <div className="flex items-end justify-between gap-4">
          <span className="text-sm text-white/70">Total</span>
          <span className="text-3xl font-semibold tracking-[-0.04em]">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/72">
        Coordinás pago, disponibilidad y retiro por WhatsApp.
      </div>

      <Link
        to="/checkout"
        className={cn(buttonStyles({ variant: 'secondary', size: 'lg' }), 'w-full')}
      >
        Continuar al checkout
        <ArrowRight className="h-4 w-4" />
      </Link>

      <Button
        type="button"
        variant="ghost"
        className="w-full border border-white/10 bg-black/20 text-white/72 hover:bg-white/8 hover:text-white"
        onClick={onClearCart}
      >
        Vaciar carrito
      </Button>
    </div>
  )
}
