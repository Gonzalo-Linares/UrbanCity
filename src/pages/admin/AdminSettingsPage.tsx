import { AtSign, MapPin, MessageCircle, Store, Timer } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/LoadingState'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAdminOutletData } from '@/hooks/useAdminShellData'

export function AdminSettingsPage() {
  const { loading, storeSettings, storeName } = useAdminOutletData()

  if (loading) {
    return <LoadingState label="Cargando configuracion del comercio..." />
  }

  return (
    <div className="space-y-8">
      <section className="surface-panel p-6 sm:p-8 lg:p-10">
        <SectionTitle
          eyebrow="Configuracion"
          title="Estado de la ficha comercial"
          description="Todavia no hay formulario de edicion. Esta pantalla sirve para validar que store_settings ya responde y que los datos base existen."
        />
      </section>

      <Card className="border border-stone-900/8 bg-white/88">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              Comercio
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-stone-950">
              {storeName}
            </h2>
          </div>
          <StatusBadge tone={storeSettings ? 'success' : 'warning'}>
            {storeSettings ? 'Configuracion encontrada' : 'Falta store_settings'}
          </StatusBadge>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            title: 'WhatsApp',
            value: storeSettings?.whatsapp_phone || 'Sin configurar',
            ok: Boolean(storeSettings?.whatsapp_phone),
            icon: MessageCircle,
          },
          {
            title: 'Instagram',
            value: storeSettings?.instagram_url || 'Sin configurar',
            ok: Boolean(storeSettings?.instagram_url),
            icon: AtSign,
          },
          {
            title: 'Direccion',
            value: storeSettings?.address || 'Sin configurar',
            ok: Boolean(storeSettings?.address),
            icon: MapPin,
          },
          {
            title: 'Horarios',
            value: storeSettings?.opening_hours || 'Sin configurar',
            ok: Boolean(storeSettings?.opening_hours),
            icon: Timer,
          },
          {
            title: 'Store name',
            value: storeSettings?.store_name || 'Sin configurar',
            ok: Boolean(storeSettings?.store_name),
            icon: Store,
          },
        ].map((item) => {
          const Icon = item.icon

          return (
            <Card
              key={item.title}
              className="space-y-4 border border-stone-900/8 bg-white/88"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-950 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">
                  {item.title}
                </p>
                <p className="text-sm leading-7 text-stone-950">{item.value}</p>
                <StatusBadge tone={item.ok ? 'success' : 'warning'}>
                  {item.ok ? 'Completo' : 'Pendiente'}
                </StatusBadge>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
