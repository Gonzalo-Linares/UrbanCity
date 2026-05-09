import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, ...props },
  ref,
) {
  const fieldId = id ?? props.name

  return (
    <label className="block space-y-2" htmlFor={fieldId}>
      <span className="text-sm font-medium text-stone-900">{label}</span>
      <input
        ref={ref}
        id={fieldId}
        className={cn(
          'h-12 w-full rounded-2xl border border-stone-900/10 bg-white/96 px-4 text-sm text-stone-950 placeholder:text-muted/80 focus:border-[#b6ff00]/60 focus:ring-4 focus:ring-[#b6ff00]/12',
          error ? 'border-rose-400/60 focus:border-rose-500 focus:ring-rose-500/10' : '',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </label>
  )
})
