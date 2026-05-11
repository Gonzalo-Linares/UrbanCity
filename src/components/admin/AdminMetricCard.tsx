import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface AdminMetricCardProps {
  title: string
  value: number | string
  description: string
  icon: LucideIcon
}

export function AdminMetricCard({
  title,
  value,
  description,
  icon: Icon,
}: AdminMetricCardProps) {
  return (
    <Card className="relative overflow-hidden space-y-4 border border-white/10 bg-[#111111] text-white shadow-[0_24px_56px_rgba(0,0,0,0.22)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-strong/80 to-transparent" />
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-brand-strong">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-white/40">{title}</p>
        <p className="text-3xl font-semibold tracking-[-0.04em] text-white">
          {value}
        </p>
        <p className="text-sm leading-6 text-white/60">{description}</p>
      </div>
    </Card>
  )
}
