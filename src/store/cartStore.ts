import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Availability } from '@/types/database'
import type { CartItem, StorefrontProduct } from '@/types/store'

interface CartState {
  items: CartItem[]
  addItem: (
    product: StorefrontProduct,
    quantity?: number,
    sizeLabel?: string | null,
  ) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  clearCart: () => void
}

const maxCartQuantity = 99
const cartStoreVersion = 2

function clampQuantity(quantity: number) {
  return Math.min(Math.max(Math.trunc(quantity), 0), maxCartQuantity)
}

function buildCartItemId(productId: string, sizeLabel: string | null) {
  return `${productId}:${sizeLabel ?? 'sin-talle'}`
}

function normalizeSizeLabel(sizeLabel: unknown) {
  if (typeof sizeLabel !== 'string') {
    return null
  }

  const trimmed = sizeLabel.trim()
  return trimmed ? trimmed : null
}

function normalizeCartItem(item: Partial<CartItem> & { productId?: string }): CartItem | null {
  if (!item.productId) {
    return null
  }

  const sizeLabel = normalizeSizeLabel(item.sizeLabel)
  const availability = (item.availability ?? 'available') as Availability
  const quantity = clampQuantity(typeof item.quantity === 'number' ? item.quantity : 1)

  if (quantity <= 0) {
    return null
  }

  return {
    cartItemId:
      typeof item.cartItemId === 'string' && item.cartItemId
        ? item.cartItemId
        : buildCartItemId(item.productId, sizeLabel),
    productId: item.productId,
    slug: item.slug ?? '',
    name: item.name ?? '',
    price: typeof item.price === 'number' ? item.price : 0,
    quantity,
    availability,
    imageUrl: item.imageUrl ?? null,
    sizeLabel,
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity = 1, sizeLabel = null) =>
        set((state) => {
          const normalizedQuantity = clampQuantity(quantity)
          const normalizedSizeLabel = normalizeSizeLabel(sizeLabel)
          const cartItemId = buildCartItemId(product.id, normalizedSizeLabel)
          const existingItem = state.items.find((item) => item.cartItemId === cartItemId)

          if (existingItem) {
            const nextQuantity = clampQuantity(
              existingItem.quantity + normalizedQuantity,
            )

            return {
              items: state.items.map((item) =>
                item.cartItemId === cartItemId
                  ? { ...item, quantity: nextQuantity }
                  : item,
              ),
            }
          }

          if (normalizedQuantity === 0) {
            return state
          }

          return {
            items: [
              ...state.items,
              {
                cartItemId,
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                quantity: normalizedQuantity,
                availability: product.availability,
                imageUrl: product.primaryImage?.url ?? null,
                sizeLabel: normalizedSizeLabel,
              },
            ],
          }
        }),
      removeItem: (cartItemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        })),
      updateQuantity: (cartItemId, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.cartItemId === cartItemId
                ? { ...item, quantity: clampQuantity(quantity) }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'urbancity-cart',
      version: cartStoreVersion,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = persistedState as { items?: Array<Partial<CartItem> & { productId?: string }> }

        return {
          ...state,
          items: (state.items ?? [])
            .map((item) => normalizeCartItem(item))
            .filter((item): item is CartItem => Boolean(item)),
        }
      },
    },
  ),
)
