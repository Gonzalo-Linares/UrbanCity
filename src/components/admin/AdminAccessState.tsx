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
      <Card className="w-full space-y-5 border border-white/10 bg-[#111111] text-center text-white shadow-[0_28px_64px_rgba(0,0,0,0.24)]">
        <p className="eyebrow">Panel admin</p>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
            {title}
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-7 text-white/64">
            {description}
          </p>
        </div>
        {action ? <div className="flex justify-center">{action}</div> : null}
      </Card>
    </div>
  )
}
