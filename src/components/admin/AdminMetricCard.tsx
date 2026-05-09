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
    <Card className="space-y-4 border border-stone-900/8 bg-white/88">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-950 text-white">
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
