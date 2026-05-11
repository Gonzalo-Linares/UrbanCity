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

  if (loading) {
    return <LoadingState label={'Cargando cat\u00e1logo...'} />
  }

  const normalizedSearch = deferredSearch.trim().toLowerCase()
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category?.slug === selectedCategory
    const matchesSearch =
      normalizedSearch.length === 0 ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.description?.toLowerCase().includes(normalizedSearch)

    return matchesCategory && matchesSearch
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

  return (
    <div className="space-y-8">
      <section className="surface-panel p-6 sm:p-8 lg:p-10">
        <SectionTitle
          eyebrow={'Cat\u00e1logo'}
          title={'Encontr\u00e1 tu pr\u00f3ximo par'}
          description={
            'Filtr\u00e1 por categor\u00eda, revis\u00e1 disponibilidad y hac\u00e9 tu pedido por WhatsApp.'
          }
          tone="light"
        />
      </section>

      <ProductFilters
        categories={categories}
        searchValue={searchValue}
        selectedCategory={selectedCategory}
        resultCount={visibleProducts.length}
        sortOption={sortOption}
        onSearchChange={setSearchValue}
        onCategoryChange={handleCategoryChange}
        onSortChange={setSortOption}
      />

      {visibleProducts.length === 0 ? (
        <EmptyState
          title="No encontramos productos con ese filtro"
          description={
            'Prob\u00e1 limpiar la b\u00fasqueda o cambiar de categor\u00eda para volver al cat\u00e1logo completo.'
          }
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSearchValue('')
                handleCategoryChange('all')
              }}
            >
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
        <p>{'Consult\u00e1 disponibilidad y coordin\u00e1 el pago por WhatsApp.'}</p>
        <Link to="/carrito" className="font-medium text-brand-strong">
          Ver carrito
        </Link>
      </div>
    </div>
  )
}
