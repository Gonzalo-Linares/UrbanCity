import { Outlet } from 'react-router-dom'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { useStorefrontData } from '@/hooks/useStorefrontData'

export function PublicLayout() {
  const { error } = useStorefrontData()

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="shell-container py-6 sm:py-8">
        {error ? (
          <div className="mb-6 rounded-[24px] border border-amber-500/18 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
            {error}
          </div>
        ) : null}
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
