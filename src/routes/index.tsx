import { createBrowserRouter } from 'react-router-dom'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminCatalogPage } from '@/pages/admin/AdminCatalogPage'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage'
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'
import { CartPage } from '@/pages/public/CartPage'
import { CatalogPage } from '@/pages/public/CatalogPage'
import { CheckoutPage } from '@/pages/public/CheckoutPage'
import { ContactPage } from '@/pages/public/ContactPage'
import { HomePage } from '@/pages/public/HomePage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { ProductDetailPage } from '@/pages/public/ProductDetailPage'

export const router = createBrowserRouter([
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
      },
      {
        path: 'productos',
        element: <AdminProductsPage />,
      },
      {
        path: 'catalogo',
        element: <AdminCatalogPage />,
      },
      {
        path: 'categorias',
        element: <AdminCategoriesPage />,
      },
      {
        path: 'pedidos',
        element: <AdminOrdersPage />,
      },
      {
        path: 'configuracion',
        element: <AdminSettingsPage />,
      },
    ],
  },
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'catalogo',
        element: <CatalogPage />,
      },
      {
        path: 'catalogo/:slug',
        element: <ProductDetailPage />,
      },
      {
        path: 'carrito',
        element: <CartPage />,
      },
      {
        path: 'checkout',
        element: <CheckoutPage />,
      },
      {
        path: 'contacto',
        element: <ContactPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
