export interface CartAddedEventDetail {
  name: string
  price: number
  imageUrl: string | null
  sizeLabel: string | null
  quantity: number
}

export const CART_ADDED_EVENT = 'city-cart-added'

export function dispatchCartAddedEvent(detail: CartAddedEventDetail) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent<CartAddedEventDetail>(CART_ADDED_EVENT, { detail }),
  )
}
