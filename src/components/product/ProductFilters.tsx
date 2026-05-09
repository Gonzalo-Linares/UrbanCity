import { Search } from 'lucide-react'
import type { CategoryRow } from '@/types/database'
import { cn } from '@/lib/cn'

interface ProductFiltersProps {
  categories: CategoryRow[]
  searchValue: string
  selectedCategory: string
  resultCount: number
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
}

export function ProductFilters({
  categories,
  searchValue,
  selectedCategory,
  resultCount,
  onSearchChange,
  onCategoryChange,
}: ProductFiltersProps) {
  return (
    <div className="surface-card space-y-5 border border-black/10 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nombre o descripcion"
            className="h-12 w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-sm text-stone-950 placeholder:text-muted/80 focus:border-brand-strong/60 focus:ring-4 focus:ring-brand-strong/12"
          />
        </label>

        <p className="text-sm text-stone-600">
          {resultCount} producto{resultCount === 1 ? '' : 's'} visible
          {resultCount === 1 ? '' : 's'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition',
            selectedCategory === 'all'
              ? 'bg-brand-strong text-black'
              : 'border border-black/10 bg-white text-stone-700 hover:border-black/18 hover:text-stone-950',
          )}
          onClick={() => onCategoryChange('all')}
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition',
              selectedCategory === category.slug
                ? 'bg-brand-strong text-black'
                : 'border border-black/10 bg-white text-stone-700 hover:border-black/18 hover:text-stone-950',
            )}
            onClick={() => onCategoryChange(category.slug)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  )
}
