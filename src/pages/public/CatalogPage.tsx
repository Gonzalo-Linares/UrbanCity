import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductFilters } from '@/components/product/ProductFilters'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { useStorefrontData } from '@/hooks/useStorefrontData'

export function CatalogPage() {
  const { categories, products, loading } = useStorefrontData()
  const [searchValue, setSearchValue] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const deferredSearch = useDeferredValue(searchValue)

  if (loading) {
    return <LoadingState label="Cargando catalogo..." />
  }

  const normalizedSearch = deferredSearch.trim().toLowerCase()
  const visibleProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category?.slug === selectedCategory
    const matchesSearch =
      normalizedSearch.length === 0 ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.description?.toLowerCase().includes(normalizedSearch)

    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-8">
      <section className="surface-panel p-6 sm:p-8 lg:p-10">
        <SectionTitle
          eyebrow="Catalogo"
          title="Productos con foco comercial, sin capas innecesarias."
          description="Buscador simple, filtros por categoria y estados de disponibilidad legibles para que el cliente resuelva rapido."
        />
      </section>

      <ProductFilters
        categories={categories}
        searchValue={searchValue}
        selectedCategory={selectedCategory}
        resultCount={visibleProducts.length}
        onSearchChange={setSearchValue}
        onCategoryChange={setSelectedCategory}
      />

      {visibleProducts.length === 0 ? (
        <EmptyState
          title="No encontramos productos con ese filtro"
          description="Probá limpiar la busqueda o cambiar de categoria para volver al catalogo completo."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSearchValue('')
                setSelectedCategory('all')
              }}
            >
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-stone-950">
            El pago se coordina con el comercio.
          </p>
          <p className="text-sm text-muted">
            Si un producto figura como “consultar disponibilidad”, el cierre se
            termina por WhatsApp.
          </p>
        </div>
        <Link to="/carrito" className="text-sm font-medium text-brand-strong">
          Ver carrito
        </Link>
      </div>
    </div>
  )
}
