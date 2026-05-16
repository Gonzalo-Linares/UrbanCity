import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import {
  mockCategories,
  mockProductImages,
  mockProducts,
  mockProductSizes,
  mockStoreSettings,
} from '@/data/mockProducts'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type {
  CatalogFeaturedProductRow,
  CategoryRow,
  HomeHeroSlideRow,
  ProductImageRow,
  ProductRow,
  ProductSizeRow,
  StoreSettingsRow,
} from '@/types/database'
import type { StorefrontProduct } from '@/types/store'

interface StorefrontContextValue {
  categories: CategoryRow[]
  homeHeroSlides: HomeHeroSlideRow[]
  products: StorefrontProduct[]
  storeSettings: StoreSettingsRow
  source: 'mock' | 'supabase'
  loading: boolean
  error: string | null
  refresh: () => void
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null)

const emptyStoreSettings: StoreSettingsRow = {
  id: '',
  store_name: 'City Calzado Urbano',
  whatsapp_phone: '',
  instagram_url: null,
  address: null,
  opening_hours: null,
  checkout_message: null,
  created_at: '',
  updated_at: '',
}

function hydrateProducts(
  products: ProductRow[],
  categories: CategoryRow[],
  images: ProductImageRow[],
  sizes: ProductSizeRow[],
) {
  return products.map<StorefrontProduct>((product) => {
    const productImages = images.filter((image) => image.product_id === product.id)
    const productSizes = sizes.filter((size) => size.product_id === product.id)

    return {
      ...product,
      category:
        categories.find((category) => category.id === product.category_id) ?? null,
      images: productImages,
      primaryImage: productImages[0] ?? null,
      sizes: productSizes,
      catalogSlot: null,
    }
  })
}

function applyCatalogSlots(
  products: StorefrontProduct[],
  catalogFeaturedProducts: CatalogFeaturedProductRow[],
) {
  const catalogSlotByProductId = new Map(
    catalogFeaturedProducts.map((item) => [item.product_id, item.slot]),
  )

  return products.map<StorefrontProduct>((product) => ({
    ...product,
    catalogSlot: catalogSlotByProductId.get(product.id) ?? null,
  }))
}

export function StorefrontDataProvider({ children }: PropsWithChildren) {
  const [reloadKey, setReloadKey] = useState(0)
  const [value, setValue] = useState<Omit<StorefrontContextValue, 'refresh'>>({
    categories: isSupabaseConfigured ? [] : mockCategories,
    homeHeroSlides: [],
    products: isSupabaseConfigured
      ? []
      : applyCatalogSlots(
          hydrateProducts(
            mockProducts,
            mockCategories,
            mockProductImages,
            mockProductSizes,
          ),
          [],
        ),
    storeSettings: isSupabaseConfigured ? emptyStoreSettings : mockStoreSettings,
    source: isSupabaseConfigured ? 'supabase' : 'mock',
    loading: isSupabaseConfigured,
    error: null,
  })

  useEffect(() => {
    let ignore = false

    async function loadStorefront() {
      if (!isSupabaseConfigured || !supabase) {
        if (!ignore) {
          setValue({
            categories: mockCategories,
            homeHeroSlides: [],
            products: applyCatalogSlots(
              hydrateProducts(
                mockProducts,
                mockCategories,
                mockProductImages,
                mockProductSizes,
              ),
              [],
            ),
            storeSettings: mockStoreSettings,
            source: 'mock',
            loading: false,
            error: null,
          })
        }

        return
      }

      const [
        categoriesResult,
        productsResult,
        imagesResult,
        sizesResult,
        settingsResult,
        heroSlidesResult,
        catalogFeaturedProductsResult,
      ] =
        await Promise.all([
          supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true }),
          supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .neq('availability', 'hidden')
            .order('featured', { ascending: false })
            .order('created_at', { ascending: false }),
          supabase
            .from('product_images')
            .select('*')
            .order('sort_order', { ascending: true }),
          supabase
            .from('product_sizes')
            .select('*')
            .eq('is_available', true)
            .order('sort_order', { ascending: true })
            .order('size_label', { ascending: true }),
          supabase
            .from('store_settings')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('home_hero_slides')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('catalog_featured_products')
            .select('*')
            .order('slot', { ascending: true }),
        ])

      if (ignore) {
        return
      }

      const loadError =
        categoriesResult.error ?? productsResult.error ?? imagesResult.error
      const heroSlides = heroSlidesResult.error ? [] : heroSlidesResult.data ?? []
      const sizes = sizesResult.error ? [] : sizesResult.data ?? []
      const catalogFeaturedProducts =
        catalogFeaturedProductsResult.error
          ? []
          : catalogFeaturedProductsResult.data ?? []

      if (loadError) {
        setValue({
          categories: [],
          homeHeroSlides: heroSlides,
          products: [],
          storeSettings: emptyStoreSettings,
          source: 'supabase',
          loading: false,
          error: 'No se pudieron cargar los datos de la tienda en este momento.',
        })
        return
      }

      const categories = categoriesResult.data ?? []
      const products = productsResult.data ?? []
      const images = imagesResult.data ?? []
      const hydratedProducts = applyCatalogSlots(
        hydrateProducts(products, categories, images, sizes),
        catalogFeaturedProducts,
      )

      if (settingsResult.error || !settingsResult.data) {
        setValue({
          categories,
          homeHeroSlides: heroSlides,
          products: hydratedProducts,
          storeSettings: emptyStoreSettings,
          source: 'supabase',
          loading: false,
          error: 'Falta configurar los datos del comercio.',
        })
        return
      }

      setValue({
        categories,
        homeHeroSlides: heroSlides,
        products: hydratedProducts,
        storeSettings: settingsResult.data,
        source: 'supabase',
        loading: false,
        error: null,
      })
    }

    loadStorefront()

    return () => {
      ignore = true
    }
  }, [reloadKey])

  return (
    <StorefrontContext.Provider
      value={{
        ...value,
        refresh: () => setReloadKey((current) => current + 1),
      }}
    >
      {children}
    </StorefrontContext.Provider>
  )
}

export function useStorefrontData() {
  const context = useContext(StorefrontContext)

  if (!context) {
    throw new Error('useStorefrontData debe usarse dentro de StorefrontDataProvider.')
  }

  return context
}
