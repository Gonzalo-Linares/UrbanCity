import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface AdminPageHeaderProps {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
  hideDescriptionOnMobile?: boolean
  variant?: 'panel' | 'compact'
  mobileCompact?: boolean
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  hideDescriptionOnMobile = false,
  variant = 'panel',
  mobileCompact = true,
}: AdminPageHeaderProps) {
  return (
    <section
      className={cn(
        mobileCompact
          ? 'rounded-[18px] border border-white/10 bg-[#101010] px-3.5 py-3 text-white shadow-none sm:rounded-[24px] sm:bg-[#111111] sm:p-6 sm:shadow-[0_24px_56px_rgba(0,0,0,0.22)] lg:p-8'
          : 'rounded-[24px] border border-white/10 bg-[#111111] p-4 text-white shadow-[0_24px_56px_rgba(0,0,0,0.22)] sm:p-6 lg:p-8',
        variant === 'compact' && 'sm:shadow-none',
        className,
      )}
    >
      <div className="flex flex-col gap-2.5 sm:gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1.5 sm:space-y-3">
          <p className="eyebrow inline-flex w-fit rounded-full border border-white/8 bg-black/20 px-2 py-0.5 text-[0.58rem] tracking-[0.18em] text-brand-strong/78 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-[0.62rem] sm:tracking-[0.24em]">
            {eyebrow}
          </p>
          <h1 className="text-lg font-semibold tracking-[-0.04em] text-white sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p
              className={cn(
                'max-w-3xl text-xs leading-5 text-white/58 sm:text-base sm:leading-7',
                hideDescriptionOnMobile && 'hidden sm:block',
              )}
            >
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex flex-wrap gap-2 sm:gap-3 lg:justify-end">{actions}</div>
        ) : null}
      </div>
    </section>
  )
}
