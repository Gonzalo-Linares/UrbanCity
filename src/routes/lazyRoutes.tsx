import { lazy, Suspense, type ReactNode } from 'react'

export const AdminLayout = lazy(() =>
  import('@/components/admin/AdminLayout').then((module) => ({
    default: module.AdminLayout,
  })),
)
export const AdminCategoriesPage = lazy(() =>
  import('@/pages/admin/AdminCategoriesPage').then((module) => ({
    default: module.AdminCategoriesPage,
  })),
)
export const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/AdminDashboardPage').then((module) => ({
    default: module.AdminDashboardPage,
  })),
)
export const AdminCatalogPage = lazy(() =>
  import('@/pages/admin/AdminCatalogPage').then((module) => ({
    default: module.AdminCatalogPage,
  })),
)
export const AdminLoginPage = lazy(() =>
  import('@/pages/admin/AdminLoginPage').then((module) => ({
    default: module.AdminLoginPage,
  })),
)
export const AdminOrdersPage = lazy(() =>
  import('@/pages/admin/AdminOrdersPage').then((module) => ({
    default: module.AdminOrdersPage,
  })),
)
export const AdminProductsPage = lazy(() =>
  import('@/pages/admin/AdminProductsPage').then((module) => ({
    default: module.AdminProductsPage,
  })),
)
export const AdminSettingsPage = lazy(() =>
  import('@/pages/admin/AdminSettingsPage').then((module) => ({
    default: module.AdminSettingsPage,
  })),
)
export const CartPage = lazy(() =>
  import('@/pages/public/CartPage').then((module) => ({
    default: module.CartPage,
  })),
)
export const CatalogPage = lazy(() =>
  import('@/pages/public/CatalogPage').then((module) => ({
    default: module.CatalogPage,
  })),
)
export const CheckoutPage = lazy(() =>
  import('@/pages/public/CheckoutPage').then((module) => ({
    default: module.CheckoutPage,
  })),
)
export const ContactPage = lazy(() =>
  import('@/pages/public/ContactPage').then((module) => ({
    default: module.ContactPage,
  })),
)
export const ProductDetailPage = lazy(() =>
  import('@/pages/public/ProductDetailPage').then((module) => ({
    default: module.ProductDetailPage,
  })),
)

export function RouteSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}
