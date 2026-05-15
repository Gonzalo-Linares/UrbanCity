import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProductCard } from '@/components/product/ProductCard'
import {
  ProductFilters,
  type ProductSortOption,
} from '@/components/product/ProductFilters'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { useStorefrontData } from '@/hooks/useStorefrontData'
import { getDiscountPercent } from '@/lib/pricing'

const catalogStateStorageKey = 'city-catalog-state'

interface CatalogStateSnapshot {
  searchValue: string
  selectedCategory: string
  selectedSizes: string[]
  sortOption: ProductSortOption
  scrollY: number
}

function isProductSortOption(value: unknown): value is ProductSortOption {
  return (
    value === 'relevance' ||
    value === 'price-asc' ||
    value === 'price-desc' ||
    value === 'sale' ||
    value === 'newest'
  )
}

function readStoredCatalogState(): CatalogStateSnapshot | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawValue = window.sessionStorage.getItem(catalogStateStorageKey)

    if (!rawValue) {
      return null
    }

    const parsedValue = JSON.parse(rawValue) as Partial<CatalogStateSnapshot>

    return {
      searchValue:
        typeof parsedValue.searchValue === 'string' ? parsedValue.searchValue : '',
      selectedCategory:
        typeof parsedValue.selectedCategory === 'string'
          ? parsedValue.selectedCategory
          : 'all',
      selectedSizes: Array.isArray(parsedValue.selectedSizes)
        ? parsedValue.selectedSizes.filter(
            (value): value is string => typeof value === 'string' && value.trim().length > 0,
          )
        : [],
      sortOption: isProductSortOption(parsedValue.sortOption)
        ? parsedValue.sortOption
        : 'relevance',
      scrollY:
        typeof parsedValue.scrollY === 'number' && Number.isFinite(parsedValue.scrollY)
          ? parsedValue.scrollY
          : 0,
    }
  } catch {
    return null
  }
}

function persistCatalogState(snapshot: CatalogStateSnapshot) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.setItem(
      catalogStateStorageKey,
      JSON.stringify(snapshot),
    )
  } catch {
    // Ignore storage write failures and keep the catalog usable.
  }
}

export function CatalogPage() {
  const { categories, products, loading } = useStorefrontData()
  const [storedCatalogState] = useState<CatalogStateSnapshot | null>(
    readStoredCatalogState,
  )
  const catalogStateReadyRef = useRef(!storedCatalogState)
  const restoredScrollRef = useRef(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState(
    () => storedCatalogState?.searchValue ?? '',
  )
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    () => storedCatalogState?.selectedSizes ?? [],
  )
  const [sortOption, setSortOption] = useState<ProductSortOption>(
    () => storedCatalogState?.sortOption ?? 'relevance',
  )
  const deferredSearch = useDeferredValue(searchValue)
  const selectedCategory = useMemo(() => {
    const categoryParam = searchParams.get('categoria')?.trim()

    if (!categoryParam) {
      return 'all'
    }

    return categories.some((category) => category.slug === categoryParam)
      ? categoryParam
      : 'all'
  }, [categories, searchParams])
  const storedCategoryToApply = useMemo(() => {
    const categoryParam = searchParams.get('categoria')?.trim()
    const storedCategory = storedCatalogState?.selectedCategory?.trim()

    if (
      loading ||
      categoryParam ||
      !storedCategory ||
      storedCategory === 'all'
    ) {
      return null
    }

    return categories.some((category) => category.slug === storedCategory)
      ? storedCategory
      : null
  }, [categories, loading, searchParams, storedCatalogState])
  const availableSizes = useMemo(() => {
    return Array.from(
      new Set(
        products.flatMap((product) =>
          product.sizes
            .filter((size) => size.is_available)
            .map((size) => size.size_label),
        ),
      ),
    ).sort((left, right) =>
      left.localeCompare(right, 'es', { numeric: true }),
    )
  }, [products])
  const normalizedSearch = deferredSearch.trim().toLowerCase()
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category?.slug === selectedCategory
    const matchesSearch =
      normalizedSearch.length === 0 ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.description?.toLowerCase().includes(normalizedSearch)
    const matchesSize =
      selectedSizes.length === 0 ||
      product.sizes.some(
        (size) =>
          size.is_available && selectedSizes.includes(size.size_label),
      )

    return matchesCategory && matchesSearch && matchesSize
  })
  const visibleProducts =
    sortOption === 'relevance'
      ? filteredProducts
      : [...filteredProducts].sort((left, right) => {
          switch (sortOption) {
            case 'price-asc':
              return left.price - right.price
            case 'price-desc':
              return right.price - left.price
            case 'sale': {
              const leftDiscount = getDiscountPercent(
                left.price,
                left.compare_at_price,
              )
              const rightDiscount = getDiscountPercent(
                right.price,
                right.compare_at_price,
              )

              if (leftDiscount !== null && rightDiscount !== null) {
                if (rightDiscount !== leftDiscount) {
                  return rightDiscount - leftDiscount
                }

                return right.price - left.price
              }

              if (leftDiscount !== null) {
                return -1
              }

              if (rightDiscount !== null) {
                return 1
              }

              return (
                new Date(right.created_at).getTime() -
                new Date(left.created_at).getTime()
              )
            }
            case 'newest':
              return (
                new Date(right.created_at).getTime() -
                new Date(left.created_at).getTime()
              )
            default:
              return 0
          }
        })

  useEffect(() => {
    if (!storedCategoryToApply) {
      return
    }

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('categoria', storedCategoryToApply)
    setSearchParams(nextSearchParams, { replace: true })
  }, [searchParams, setSearchParams, storedCategoryToApply])

  useEffect(() => {
    if (!catalogStateReadyRef.current) {
      return
    }

    persistCatalogState({
      searchValue,
      selectedCategory,
      selectedSizes,
      sortOption,
      scrollY: typeof window === 'undefined' ? 0 : window.scrollY,
    })
  }, [searchValue, selectedCategory, selectedSizes, sortOption])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let frameId = 0

    function handleScroll() {
      if (!catalogStateReadyRef.current || frameId) {
        return
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0
        persistCatalogState({
          searchValue,
          selectedCategory,
          selectedSizes,
          sortOption,
          scrollY: window.scrollY,
        })
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }

      window.removeEventListener('scroll', handleScroll)
    }
  }, [searchValue, selectedCategory, selectedSizes, sortOption])

  useEffect(() => {
    if (
      loading ||
      storedCategoryToApply ||
      restoredScrollRef.current ||
      typeof window === 'undefined'
    ) {
      return
    }

    restoredScrollRef.current = true
    catalogStateReadyRef.current = true
    const savedScrollY = storedCatalogState?.scrollY ?? 0

    if (savedScrollY <= 0) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      window.scrollTo({ top: savedScrollY, left: 0, behavior: 'auto' })
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: savedScrollY, left: 0, behavior: 'auto' })
      })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loading, storedCatalogState, storedCategoryToApply, visibleProducts.length])

  function handleCategoryChange(value: string) {
    const nextSearchParams = new URLSearchParams(searchParams)

    if (value === 'all') {
      nextSearchParams.delete('categoria')
    } else {
      nextSearchParams.set('categoria', value)
    }

    setSearchParams(nextSearchParams, { replace: true })
  }

  function toggleSelectedSize(size: string) {
    setSelectedSizes((current) =>
      current.includes(size)
        ? current.filter((item) => item !== size)
        : [...current, size],
    )
  }

  function clearSelectedSizes() {
    setSelectedSizes([])
  }

  function clearFilters() {
    setSearchValue('')
    handleCategoryChange('all')
    setSelectedSizes([])
  }

  if (loading) {
    return <LoadingState label="Cargando catálogo..." />
  }

  return (
    <div className="space-y-8">
      <section className="surface-panel p-4 sm:p-8 lg:p-10">
        <SectionTitle
          eyebrow="Catálogo"
          title="Encontrá tu próximo par"
          description="Filtrá por categoría y talle para encontrar rápido tu próximo par."
          tone="light"
          compactMobile
        />
      </section>

      <ProductFilters
        categories={categories}
        searchValue={searchValue}
        selectedCategory={selectedCategory}
        resultCount={visibleProducts.length}
        sortOption={sortOption}
        availableSizes={availableSizes}
        selectedSizes={selectedSizes}
        onSearchChange={setSearchValue}
        onCategoryChange={handleCategoryChange}
        onSortChange={setSortOption}
        onSizeToggle={toggleSelectedSize}
        onClearSizes={clearSelectedSizes}
        onClearFilters={clearFilters}
      />

      {visibleProducts.length === 0 ? (
        <EmptyState
          title="No encontramos productos con ese filtro"
          description="Probá cambiar de talle, limpiar la búsqueda o elegir otra categoría."
          action={
            <Button type="button" variant="secondary" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-2 text-sm text-white/62 sm:flex-row sm:items-center">
        <p>Consultá disponibilidad y coordiná el pago por WhatsApp.</p>
        <Link to="/carrito" className="font-medium text-brand-strong">
          Ver carrito
        </Link>
      </div>
    </div>
  )
}
