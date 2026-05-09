import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { StoreSettingsRow } from '@/types/database'

interface AdminCounts {
  productsTotal: number
  productsActive: number
  productsSellable: number
  categoriesTotal: number
  categoriesActive: number
  ordersTotal: number
  ordersPending: number
  ordersConfirmed: number
  ordersReady: number
  ordersCompleted: number
  ordersCancelled: number
}

export interface AdminShellOutletContext {
  storeSettings: StoreSettingsRow | null
  storeName: string
  counts: AdminCounts
  loading: boolean
  error: string | null
  refresh: () => void
}

const emptyCounts: AdminCounts = {
  productsTotal: 0,
  productsActive: 0,
  productsSellable: 0,
  categoriesTotal: 0,
  categoriesActive: 0,
  ordersTotal: 0,
  ordersPending: 0,
  ordersConfirmed: 0,
  ordersReady: 0,
  ordersCompleted: 0,
  ordersCancelled: 0,
}

function countValue(result: { count: number | null }) {
  return result.count ?? 0
}

export function useAdminShellData() {
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState<Omit<AdminShellOutletContext, 'refresh'>>({
    storeSettings: null,
    storeName: 'City Calzado Urbano',
    counts: emptyCounts,
    loading: isSupabaseConfigured,
    error: isSupabaseConfigured
      ? null
      : 'Configura Supabase para cargar el panel admin.',
  })

  useEffect(() => {
    if (!supabase) {
      return
    }

    const client = supabase
    let ignore = false

    async function loadAdminShellData() {
      setState((current) => ({
        ...current,
        loading: true,
        error: null,
      }))

      const [
        settingsResult,
        productsTotalResult,
        productsActiveResult,
        productsSellableResult,
        categoriesTotalResult,
        categoriesActiveResult,
        ordersTotalResult,
        ordersPendingResult,
        ordersConfirmedResult,
        ordersReadyResult,
        ordersCompletedResult,
        ordersCancelledResult,
      ] = await Promise.all([
        client
          .from('store_settings')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
        client.from('products').select('id', { count: 'exact', head: true }),
        client
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        client
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .in('availability', ['available', 'inquiry']),
        client.from('categories').select('id', { count: 'exact', head: true }),
        client
          .from('categories')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        client.from('orders').select('id', { count: 'exact', head: true }),
        client
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        client
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'confirmed'),
        client
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'ready_for_pickup'),
        client
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed'),
        client
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'cancelled'),
      ])

      if (ignore) {
        return
      }

      const firstError = [
        settingsResult.error,
        productsTotalResult.error,
        productsActiveResult.error,
        productsSellableResult.error,
        categoriesTotalResult.error,
        categoriesActiveResult.error,
        ordersTotalResult.error,
        ordersPendingResult.error,
        ordersConfirmedResult.error,
        ordersReadyResult.error,
        ordersCompletedResult.error,
        ordersCancelledResult.error,
      ].find(Boolean)

      if (firstError) {
        setState((current) => ({
          ...current,
          loading: false,
          error: 'No se pudieron cargar los datos del panel admin desde Supabase.',
        }))
        return
      }

      const storeSettings = settingsResult.data as StoreSettingsRow | null

      setState({
        storeSettings,
        storeName: storeSettings?.store_name || 'Comercio sin configurar',
        counts: {
          productsTotal: countValue(productsTotalResult),
          productsActive: countValue(productsActiveResult),
          productsSellable: countValue(productsSellableResult),
          categoriesTotal: countValue(categoriesTotalResult),
          categoriesActive: countValue(categoriesActiveResult),
          ordersTotal: countValue(ordersTotalResult),
          ordersPending: countValue(ordersPendingResult),
          ordersConfirmed: countValue(ordersConfirmedResult),
          ordersReady: countValue(ordersReadyResult),
          ordersCompleted: countValue(ordersCompletedResult),
          ordersCancelled: countValue(ordersCancelledResult),
        },
        loading: false,
        error: null,
      })
    }

    void loadAdminShellData()

    return () => {
      ignore = true
    }
  }, [reloadKey])

  return {
    ...state,
    refresh: () => setReloadKey((current) => current + 1),
  }
}

export function useAdminOutletData() {
  return useOutletContext<AdminShellOutletContext>()
}
