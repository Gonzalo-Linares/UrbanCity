export function getDiscountPercent(
  price: number,
  compareAtPrice?: number | null,
): number | null {
  if (!compareAtPrice || compareAtPrice <= price || compareAtPrice <= 0) {
    return null
  }

  const discountPercent = Math.round(
    ((compareAtPrice - price) / compareAtPrice) * 100,
  )

  return discountPercent > 0 ? discountPercent : null
}

export function isOnSale(
  price: number,
  compareAtPrice?: number | null,
): boolean {
  return getDiscountPercent(price, compareAtPrice) !== null
}
