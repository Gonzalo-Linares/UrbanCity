export function getDiscountPercent(
  price: number,
  compareAtPrice?: number | null,
): number | null {
  if (!compareAtPrice || compareAtPrice <= price || compareAtPrice <= 0) {
    return null
  }

  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
}

export function isOnSale(
  price: number,
  compareAtPrice?: number | null,
): boolean {
  return getDiscountPercent(price, compareAtPrice) !== null
}
