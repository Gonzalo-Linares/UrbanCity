import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

interface AdminMetricCardProps {
  title: string
  value: number | string
  description: string
  icon: LucideIcon
  className?: string
  compact?: boolean
}

export function AdminMetricCard({
  title,
  value,
  description,
  icon: Icon,
  className,
  compact = true,
}: AdminMetricCardProps) {
  return (
    <Card
      className={cn(
        compact
          ? 'relative overflow-hidden space-y-1.5 rounded-[18px] border border-white/10 bg-[#111111] p-3 text-white shadow-none sm:space-y-4 sm:rounded-[24px] sm:p-5 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)] lg:p-6'
          : 'relative overflow-hidden space-y-2 border border-white/10 bg-[#111111] p-4 text-white shadow-[0_24px_56px_rgba(0,0,0,0.22)] sm:space-y-4 sm:p-6',
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-strong/80 to-transparent" />
      <div className="flex h-8 w-8 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-brand-strong sm:h-11 sm:w-11">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <p className="text-[0.62rem] uppercase tracking-[0.16em] text-white/40 sm:text-xs sm:tracking-[0.22em]">
          {title}
        </p>
        <p className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
          {value}
        </p>
        <p className="text-xs leading-4 text-white/60 sm:text-sm sm:leading-6">
          {description}
        </p>
      </div>
    </Card>
  )
}
