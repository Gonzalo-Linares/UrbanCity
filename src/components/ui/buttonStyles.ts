import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'whatsapp'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#111111] text-[#f7f7f2] hover:bg-[#1a1a1a] shadow-[0_14px_30px_rgba(0,0,0,0.28)]',
  secondary:
    'bg-brand-strong text-black hover:bg-[#d1ff52] shadow-[0_14px_28px_rgba(182,255,0,0.2)]',
  outline:
    'border border-white/14 bg-white/6 text-[#f7f7f2] hover:bg-white/10',
  ghost: 'text-stone-700 hover:bg-stone-900/6',
  whatsapp:
    'bg-success text-white hover:bg-emerald-700 shadow-[0_12px_24px_rgba(22,130,93,0.18)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-10 rounded-full px-4 text-sm',
  md: 'h-11 rounded-full px-5 text-sm sm:px-6',
  lg: 'h-12 rounded-full px-6 text-sm sm:px-7',
}

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 font-medium transition duration-200 disabled:pointer-events-none disabled:opacity-45',
    variantStyles[variant],
    sizeStyles[size],
    className,
  )
}

export type { ButtonVariant, ButtonSize }
