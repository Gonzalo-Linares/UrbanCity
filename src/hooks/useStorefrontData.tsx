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
  mockStoreSettings,
} from '@/data/mockProducts'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type {
  CategoryRow,
  ProductImageRow,
  ProductRow,
  StoreSettingsRow,
} from '@/types/database'
import type { StorefrontProduct } from '@/types/store'

interface StorefrontContextValue {
  categories: CategoryRow[]
  products: StorefrontProduct[]
  storeSettings: StoreSettingsRow
  source: 'mock' | 'supabase'
  loading: boolean
  error: string | null
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null)

const emptyStoreSettings: StoreSettingsRow = {
  id: '',
  store_name: 'UrbanCity',
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
) {
  return products.map<StorefrontProduct>((product) => {
    const productImages = images.filter((image) => image.product_id === product.id)

    return {
      ...product,
      category:
        categories.find((category) => category.id === product.category_id) ?? null,
      images: productImages,
      primaryImage: productImages[0] ?? null,
    }
  })
}

export function StorefrontDataProvider({ children }: PropsWithChildren) {
  const [value, setValue] = useState<StorefrontContextValue>({
    categories: isSupabaseConfigured ? [] : mockCategories,
    products: isSupabaseConfigured
      ? []
      : hydrateProducts(mockProducts, mockCategories, mockProductImages),
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
            products: hydrateProducts(
              mockProducts,
              mockCategories,
              mockProductImages,
            ),
            storeSettings: mockStoreSettings,
            source: 'mock',
            loading: false,
            error: null,
          })
        }

        return
      }

      const [categoriesResult, productsResult, imagesResult, settingsResult] =
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
          supabase.from('store_settings').select('*').limit(1).maybeSingle(),
        ])

      if (ignore) {
        return
      }

      const loadError =
        categoriesResult.error ?? productsResult.error ?? imagesResult.error

      if (loadError) {
        setValue({
          categories: [],
          products: [],
          storeSettings: emptyStoreSettings,
          source: 'supabase',
          loading: false,
          error:
            'No se pudieron cargar los datos del storefront desde Supabase.',
        })
        return
      }

      const categories = categoriesResult.data ?? []
      const products = productsResult.data ?? []
      const images = imagesResult.data ?? []
      const hydratedProducts = hydrateProducts(products, categories, images)

      if (settingsResult.error || !settingsResult.data) {
        setValue({
          categories,
          products: hydratedProducts,
          storeSettings: emptyStoreSettings,
          source: 'supabase',
          loading: false,
          error:
            'Supabase esta configurado pero falta una fila valida en store_settings.',
        })
        return
      }

      setValue({
        categories,
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
  }, [])

  return (
    <StorefrontContext.Provider value={value}>
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
