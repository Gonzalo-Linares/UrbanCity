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

type StorefrontValue = Omit<StorefrontContextValue, 'refresh'>

const StorefrontContext = createContext<StorefrontContextValue | null>(null)
const STOREFRONT_CACHE_KEY = 'urban-city-storefront-cache-v1'
const STOREFRONT_CACHE_TTL_MS = 5 * 60 * 1000

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

interface StorefrontCacheEntry {
  cachedAt: number
  data: StorefrontValue
}

function clearStorefrontCache() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(STOREFRONT_CACHE_KEY)
  } catch {
    // Storage can be unavailable in private browsing or hardened browsers.
  }
}

function isCachedStorefrontValue(value: unknown): value is StorefrontValue {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<StorefrontValue>

  return (
    Array.isArray(candidate.categories) &&
    Array.isArray(candidate.homeHeroSlides) &&
    Array.isArray(candidate.products) &&
    Boolean(candidate.storeSettings) &&
    typeof candidate.storeSettings === 'object' &&
    candidate.source === 'supabase' &&
    candidate.loading === false &&
    candidate.error === null
  )
}

function readStorefrontCache() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawCache = window.localStorage.getItem(STOREFRONT_CACHE_KEY)

    if (!rawCache) {
      return null
    }

    const parsedCache = JSON.parse(rawCache) as Partial<StorefrontCacheEntry>
    const cacheAge = Date.now() - (parsedCache.cachedAt ?? 0)

    if (
      typeof parsedCache.cachedAt !== 'number' ||
      cacheAge < 0 ||
      cacheAge > STOREFRONT_CACHE_TTL_MS ||
      !isCachedStorefrontValue(parsedCache.data)
    ) {
      clearStorefrontCache()
      return null
    }

    return parsedCache.data
  } catch {
    clearStorefrontCache()
    return null
  }
}

function writeStorefrontCache(data: StorefrontValue) {
  if (
    typeof window === 'undefined' ||
    data.source !== 'supabase' ||
    data.loading ||
    data.error
  ) {
    return
  }

  try {
    const cacheEntry: StorefrontCacheEntry = {
      cachedAt: Date.now(),
      data,
    }

    window.localStorage.setItem(STOREFRONT_CACHE_KEY, JSON.stringify(cacheEntry))
  } catch {
    // Cache failures must not block rendering fresh public data.
  }
}

function hydrateProducts(
  products: ProductRow[],
  categories: CategoryRow[],
  images: ProductImageRow[],
  sizes: ProductSizeRow[],
) {
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const imagesByProductId = new Map<string, ProductImageRow[]>()
  const sizesByProductId = new Map<string, ProductSizeRow[]>()

  images.forEach((image) => {
    const productImages = imagesByProductId.get(image.product_id) ?? []
    productImages.push(image)
    imagesByProductId.set(image.product_id, productImages)
  })

  sizes.forEach((size) => {
    const productSizes = sizesByProductId.get(size.product_id) ?? []
    productSizes.push(size)
    sizesByProductId.set(size.product_id, productSizes)
  })

  return products.map<StorefrontProduct>((product) => {
    const productImages = imagesByProductId.get(product.id) ?? []
    const productSizes = sizesByProductId.get(product.id) ?? []

    return {
      ...product,
      category: product.category_id
        ? categoryById.get(product.category_id) ?? null
        : null,
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

function createMockStorefrontValue(): StorefrontValue {
  return {
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
  }
}

function createInitialStorefrontValue(): StorefrontValue {
  if (!isSupabaseConfigured) {
    return createMockStorefrontValue()
  }

  return (
    readStorefrontCache() ?? {
      categories: [],
      homeHeroSlides: [],
      products: [],
      storeSettings: emptyStoreSettings,
      source: 'supabase',
      loading: true,
      error: null,
    }
  )
}

function hasVisibleStorefrontData(value: StorefrontValue) {
  return (
    value.products.length > 0 ||
    value.categories.length > 0 ||
    value.homeHeroSlides.length > 0 ||
    Boolean(value.storeSettings.id)
  )
}

export function StorefrontDataProvider({ children }: PropsWithChildren) {
  const [reloadKey, setReloadKey] = useState(0)
  const [value, setValue] = useState<StorefrontValue>(createInitialStorefrontValue)

  useEffect(() => {
    let ignore = false

    async function loadStorefront() {
      if (!isSupabaseConfigured || !supabase) {
        if (!ignore) {
          setValue(createMockStorefrontValue())
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
        setValue((current) => {
          if (hasVisibleStorefrontData(current)) {
            return {
              ...current,
              loading: false,
              error: null,
            }
          }

          return {
            categories: [],
            homeHeroSlides: heroSlides,
            products: [],
            storeSettings: emptyStoreSettings,
            source: 'supabase',
            loading: false,
            error: 'No se pudieron cargar los datos de la tienda en este momento.',
          }
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
        setValue((current) => {
          if (hasVisibleStorefrontData(current)) {
            return {
              ...current,
              loading: false,
              error: null,
            }
          }

          return {
            categories,
            homeHeroSlides: heroSlides,
            products: hydratedProducts,
            storeSettings: emptyStoreSettings,
            source: 'supabase',
            loading: false,
            error: 'Falta configurar los datos del comercio.',
          }
        })
        return
      }

      const nextValue: StorefrontValue = {
        categories,
        homeHeroSlides: heroSlides,
        products: hydratedProducts,
        storeSettings: settingsResult.data,
        source: 'supabase',
        loading: false,
        error: null,
      }

      writeStorefrontCache(nextValue)
      setValue(nextValue)
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
