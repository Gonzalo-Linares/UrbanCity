import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

interface AdminAccessStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function AdminAccessState({
  title,
  description,
  action,
}: AdminAccessStateProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10 sm:px-6">
      <Card className="w-full space-y-5 border border-stone-900/8 bg-white/88 text-center">
        <p className="eyebrow">Panel admin</p>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-stone-950">
            {title}
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-7 text-muted">
            {description}
          </p>
        </div>
        {action ? <div className="flex justify-center">{action}</div> : null}
      </Card>
    </div>
  )
}
