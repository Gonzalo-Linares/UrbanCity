import { useDeferredValue, useMemo, useState } from 'react'
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

export function CatalogPage() {
  const { categories, products, loading } = useStorefrontData()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState('')
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [sortOption, setSortOption] = useState<ProductSortOption>('relevance')
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

  if (loading) {
    return <LoadingState label="Cargando catálogo..." />
  }

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
