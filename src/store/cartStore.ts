import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CartItem, StorefrontProduct } from '@/types/store'

interface CartState {
  items: CartItem[]
  addItem: (product: StorefrontProduct, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

const maxCartQuantity = 99

function clampQuantity(quantity: number) {
  return Math.min(Math.max(Math.trunc(quantity), 0), maxCartQuantity)
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity = 1) =>
        set((state) => {
          const normalizedQuantity = clampQuantity(quantity)
          const existingItem = state.items.find(
            (item) => item.productId === product.id,
          )

          if (existingItem) {
            const nextQuantity = clampQuantity(
              existingItem.quantity + normalizedQuantity,
            )

            return {
              items: state.items.map((item) =>
                item.productId === product.id
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
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                quantity: normalizedQuantity,
                availability: product.availability,
                imageUrl: product.primaryImage?.url ?? null,
              },
            ],
          }
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.productId === productId
                ? { ...item, quantity: clampQuantity(quantity) }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'urbancity-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
