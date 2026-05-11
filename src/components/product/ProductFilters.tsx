import { Search } from 'lucide-react'
import type { CategoryRow } from '@/types/database'
import { cn } from '@/lib/cn'

export type ProductSortOption =
  | 'relevance'
  | 'price-asc'
  | 'price-desc'
  | 'sale'
  | 'newest'

interface ProductFiltersProps {
  categories: CategoryRow[]
  searchValue: string
  selectedCategory: string
  resultCount: number
  sortOption: ProductSortOption
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSortChange: (value: ProductSortOption) => void
}

export function ProductFilters({
  categories,
  searchValue,
  selectedCategory,
  resultCount,
  sortOption,
  onSearchChange,
  onCategoryChange,
  onSortChange,
}: ProductFiltersProps) {
  return (
    <div className="space-y-4 rounded-[28px] border border-white/10 bg-[#151515] p-4 shadow-[0_24px_50px_rgba(0,0,0,0.26)] sm:space-y-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
        <label className="relative block w-full max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-white/44" />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={'Buscar por nombre o descripci\u00f3n'}
            className="h-12 w-full rounded-2xl border border-white/10 bg-[#101010] pl-11 pr-4 text-sm text-white placeholder:text-white/38 focus:border-brand-strong/55 focus:ring-4 focus:ring-brand-strong/10"
          />
        </label>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:gap-3">
          <label className="block space-y-2">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/46">
              Ordenar por
            </span>
            <select
              value={sortOption}
              onChange={(event) =>
                onSortChange(event.target.value as ProductSortOption)
              }
              className="h-12 min-w-[210px] rounded-2xl border border-white/10 bg-[#101010] px-4 text-sm text-white focus:border-brand-strong/55 focus:ring-4 focus:ring-brand-strong/10"
            >
              <option value="relevance">Relevancia</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="sale">Ofertas primero</option>
              <option value="newest">Nuevos primero</option>
            </select>
          </label>

          <p className="pb-3 text-sm text-white/68">
            {resultCount} producto{resultCount === 1 ? '' : 's'} visible
            {resultCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={cn(
            'rounded-full px-3.5 py-1.5 text-sm font-medium transition sm:px-4 sm:py-2',
            selectedCategory === 'all'
              ? 'bg-brand-strong text-black'
              : 'border border-white/12 bg-white/6 text-white/78 hover:bg-white/10 hover:text-white',
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
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition sm:px-4 sm:py-2',
              selectedCategory === category.slug
                ? 'bg-brand-strong text-black'
                : 'border border-white/12 bg-white/6 text-white/78 hover:bg-white/10 hover:text-white',
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
