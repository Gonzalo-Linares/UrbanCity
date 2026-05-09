import type {
  Availability,
  CategoryRow,
  OrderStatus,
  ProductImageRow,
  ProductRow,
  StoreSettingsRow,
} from '@/types/database'

export interface StorefrontProduct extends ProductRow {
  category: CategoryRow | null
  images: ProductImageRow[]
  primaryImage: ProductImageRow | null
}

export interface CartItem {
  productId: string
  slug: string
  name: string
  price: number
  quantity: number
  availability: Availability
  imageUrl: string | null
}

export interface CheckoutFormValues {
  customerName: string
  customerPhone: string
  customerMessage: string
}

export interface GeneratedOrderDraft {
  orderCode: string
  customerName: string
  customerPhone: string
  customerMessage: string
  whatsappMessage: string
  whatsappUrl: string
  total: number
  status: OrderStatus
  createdAt: string
}

export interface StorefrontState {
  categories: CategoryRow[]
  products: StorefrontProduct[]
  storeSettings: StoreSettingsRow
  source: 'mock' | 'supabase'
}
