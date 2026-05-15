import { useMemo, useState } from 'react'
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react'
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
  availableSizes: string[]
  selectedSize: string
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSortChange: (value: ProductSortOption) => void
  onSizeChange: (value: string) => void
  onClearFilters: () => void
}

function filterChipClass(isActive: boolean) {
  return cn(
    'rounded-full px-3.5 py-1.5 text-sm font-medium transition sm:px-4 sm:py-2',
    isActive
      ? 'bg-brand-strong text-black'
      : 'border border-white/12 bg-white/6 text-white/78 hover:bg-white/10 hover:text-white',
  )
}

export function ProductFilters({
  categories,
  searchValue,
  selectedCategory,
  resultCount,
  sortOption,
  availableSizes,
  selectedSize,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onSizeChange,
  onClearFilters,
}: ProductFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) + (selectedSize !== 'all' ? 1 : 0)
  const activeCategoryName = useMemo(
    () =>
      selectedCategory === 'all'
        ? null
        : categories.find((category) => category.slug === selectedCategory)?.name ??
          null,
    [categories, selectedCategory],
  )

  return (
    <div className="space-y-3 rounded-[28px] border border-white/10 bg-[#151515] p-4 shadow-[0_24px_50px_rgba(0,0,0,0.26)] sm:space-y-4 sm:p-6">
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

        <div className="grid gap-2.5 sm:grid-cols-[minmax(0,220px)_auto_auto] sm:items-end sm:gap-3">
          <label className="block space-y-2">
            <span className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/46">
              <SlidersHorizontal className="h-3.5 w-3.5" />
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

          <button
            type="button"
            aria-expanded={showFilters}
            aria-controls="catalog-filters-panel"
            className={cn(
              'inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition',
              activeFilterCount > 0
                ? 'border-brand-strong/30 bg-brand-strong text-black hover:bg-brand-strong/90'
                : 'border-white/12 bg-[#101010] text-white hover:border-white/20 hover:bg-white/8',
            )}
            onClick={() => setShowFilters((current) => !current)}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
          </button>

          <p className="self-center text-sm text-white/68 sm:pb-3">
            {resultCount} producto{resultCount === 1 ? '' : 's'} visible
            {resultCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {activeFilterCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/58">
          <span>Filtros activos:</span>
          {activeCategoryName ? (
            <span className="rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-white/76">
              {activeCategoryName}
            </span>
          ) : null}
          {selectedSize !== 'all' ? (
            <span className="rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-white/76">
              Talle {selectedSize}
            </span>
          ) : null}
          <button
            type="button"
            className="rounded-full border border-white/12 px-2.5 py-1 text-white/72 transition hover:bg-white/8 hover:text-white"
            onClick={onClearFilters}
          >
            Limpiar
          </button>
        </div>
      ) : null}

      {showFilters ? (
        <div
          id="catalog-filters-panel"
          className="space-y-4 rounded-[24px] border border-white/10 bg-[#101010] p-3 sm:p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">Filtrar productos</p>
              <p className="text-sm text-white/54">
                Ajustá categoría y talle según lo que estás buscando.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/12 bg-black/20 text-white/72 transition hover:bg-white/8 hover:text-white"
              onClick={() => setShowFilters(false)}
              aria-label="Cerrar filtros"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/46">
              Categorías
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={filterChipClass(selectedCategory === 'all')}
                onClick={() => onCategoryChange('all')}
              >
                Todas
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={filterChipClass(selectedCategory === category.slug)}
                  onClick={() => onCategoryChange(category.slug)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {availableSizes.length > 0 ? (
            <div className="space-y-2.5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/46">
                Talles
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={filterChipClass(selectedSize === 'all')}
                  onClick={() => onSizeChange('all')}
                >
                  Todos
                </button>
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={filterChipClass(selectedSize === size)}
                    onClick={() => onSizeChange(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/58">
              {resultCount} producto{resultCount === 1 ? '' : 's'} visible
              {resultCount === 1 ? '' : 's'}
            </p>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/12 px-4 text-sm font-medium text-white/76 transition hover:bg-white/8 hover:text-white"
              onClick={onClearFilters}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
