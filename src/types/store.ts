import type {
  Availability,
  CategoryRow,
  HomeHeroSlideRow,
  OrderStatus,
  ProductImageRow,
  ProductRow,
  ProductSizeRow,
  StoreSettingsRow,
} from '@/types/database'

export interface StorefrontProduct extends ProductRow {
  category: CategoryRow | null
  images: ProductImageRow[]
  primaryImage: ProductImageRow | null
  sizes: ProductSizeRow[]
  catalogSlot: number | null
}

export interface CartItem {
  cartItemId: string
  productId: string
  slug: string
  name: string
  price: number
  quantity: number
  availability: Availability
  imageUrl: string | null
  sizeLabel: string | null
}

export interface CheckoutFormValues {
  customerName: string
  customerPhone: string
  customerMessage: string
}

export interface CheckoutOrderItem {
  productId: string
  productName: string
  sizeLabel: string | null
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface GeneratedOrderDraft {
  orderCode: string
  customerName: string
  customerPhone: string
  customerMessage: string
  items: CheckoutOrderItem[]
  whatsappMessage: string
  whatsappUrl: string
  total: number
  status: OrderStatus
  createdAt: string
}

export interface StorefrontState {
  categories: CategoryRow[]
  homeHeroSlides: HomeHeroSlideRow[]
  products: StorefrontProduct[]
  storeSettings: StoreSettingsRow
  source: 'mock' | 'supabase'
}
