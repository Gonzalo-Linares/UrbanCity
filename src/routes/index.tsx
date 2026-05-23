import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { HomePage } from '@/pages/public/HomePage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import {
  AdminCatalogPage,
  AdminCategoriesPage,
  AdminDashboardPage,
  AdminLayout,
  AdminLoginPage,
  AdminOrdersPage,
  AdminProductsPage,
  AdminSettingsPage,
  CartPage,
  CatalogPage,
  CheckoutPage,
  ContactPage,
  ProductDetailPage,
  RouteSuspense,
} from '@/routes/lazyRoutes'

export const router = createBrowserRouter([
  {
    path: '/admin/login',
    element: (
      <RouteSuspense>
        <AdminLoginPage />
      </RouteSuspense>
    ),
  },
  {
    path: '/admin',
    element: (
      <RouteSuspense>
        <AdminLayout />
      </RouteSuspense>
    ),
    children: [
      {
        index: true,
        element: (
          <RouteSuspense>
            <AdminDashboardPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'productos',
        element: (
          <RouteSuspense>
            <AdminProductsPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'catalogo',
        element: (
          <RouteSuspense>
            <AdminCatalogPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'categorias',
        element: (
          <RouteSuspense>
            <AdminCategoriesPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'pedidos',
        element: (
          <RouteSuspense>
            <AdminOrdersPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'configuracion',
        element: (
          <RouteSuspense>
            <AdminSettingsPage />
          </RouteSuspense>
        ),
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
        element: (
          <RouteSuspense>
            <CatalogPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'catalogo/:slug',
        element: (
          <RouteSuspense>
            <ProductDetailPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'carrito',
        element: (
          <RouteSuspense>
            <CartPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'checkout',
        element: (
          <RouteSuspense>
            <CheckoutPage />
          </RouteSuspense>
        ),
      },
      {
        path: 'contacto',
        element: (
          <RouteSuspense>
            <ContactPage />
          </RouteSuspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
