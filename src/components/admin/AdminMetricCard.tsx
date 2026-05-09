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
    <Card className="relative overflow-hidden space-y-4 border border-white/10 bg-white/92">
      <div className="absolute inset-x-0 top-0 h-1 bg-brand-strong" />
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-950 text-brand-strong">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-muted">{title}</p>
        <p className="text-3xl font-semibold tracking-[-0.04em] text-stone-950">
          {value}
        </p>
        <p className="text-sm leading-6 text-muted">{description}</p>
      </div>
    </Card>
  )
}
