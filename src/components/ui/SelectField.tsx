import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  error?: string
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField({ label, hint, error, className, id, children, ...props }, ref) {
    const fieldId = id ?? props.name

    return (
      <label className="block space-y-2" htmlFor={fieldId}>
        <span className="text-sm font-medium text-stone-900">{label}</span>
        <select
          ref={ref}
          id={fieldId}
          className={cn(
            'h-12 w-full rounded-2xl border border-stone-900/10 bg-white px-4 text-sm text-stone-950 focus:border-brand/50 focus:ring-4 focus:ring-brand/10',
            error
              ? 'border-rose-400/60 focus:border-rose-500 focus:ring-rose-500/10'
              : '',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        {!error && hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </label>
    )
  },
)
