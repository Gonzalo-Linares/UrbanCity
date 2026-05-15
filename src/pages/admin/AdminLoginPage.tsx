import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { LockKeyhole, LogOut } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import cityLogo from '@/assets/city-logo.jpg'
import { AdminAccessState } from '@/components/admin/AdminAccessState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/LoadingState'
import { isSupabaseConfigured } from '@/lib/supabase'
import { adminLoginSchema, type AdminLoginSchema } from '@/schemas/adminLogin'
import { useAuth } from '@/hooks/useAuth'

export function AdminLoginPage() {
  const { error, isAdmin, isAuthenticated, loading, signIn, signOut } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<AdminLoginSchema>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  if (loading) {
    return <LoadingState label="Verificando sesión admin..." />
  }

  if (isAuthenticated && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  if (isAuthenticated && !isAdmin) {
    return (
      <AdminAccessState
        title="No autorizado"
        description={
          error ??
          'Tu usuario no tiene acceso habilitado al panel.'
        }
        action={
          <Button type="button" variant="secondary" onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        }
      />
    )
  }

  async function handleSubmit(values: AdminLoginSchema) {
    setSubmitError(null)

    const nextError = await signIn(values.email, values.password)

    if (nextError) {
      setSubmitError('Email o password inválidos.')
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-6 sm:px-6 sm:py-10">
      <div className="grid w-full gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="surface-panel flex flex-col justify-between gap-6 p-5 sm:p-8 lg:p-10">
          <div className="space-y-4">
            <p className="eyebrow">Admin</p>
            <div className="space-y-3">
              <img
                src={cityLogo}
                alt="City Calzado Urbano"
                className="h-14 w-14 rounded-3xl border border-white/10 object-cover shadow-[0_20px_46px_rgba(0,0,0,0.34)] sm:h-20 sm:w-20"
              />
              <h1 className="text-2xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                Panel de administracion
              </h1>
              <p className="text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
                Ingresa para cargar productos, actualizar precios, revisar pedidos y
                administrar la tienda.
              </p>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/6 p-4 text-sm leading-6 text-white/74">
            Desde aca podes gestionar productos, categorias, pedidos y los datos
            principales de la tienda.
          </div>
        </section>

        <Card className="border border-white/10 bg-[#111111] p-5 text-white shadow-[0_28px_64px_rgba(0,0,0,0.24)] sm:p-8">
          <form className="space-y-5 [&_label>span]:text-white [&_label>p]:text-white/54 [&_input]:border-white/10 [&_input]:bg-[#0d0d0d] [&_input]:text-white [&_input]:placeholder:text-white/32" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Iniciar sesión</p>
              <p className="text-sm leading-6 text-white/60">
                Ingresa con tu email y contrasena.
              </p>
            </div>

            {!isSupabaseConfigured ? (
              <div className="rounded-[22px] border border-rose-500/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                Configura <code>VITE_SUPABASE_URL</code> y{' '}
                <code>VITE_SUPABASE_ANON_KEY</code> para habilitar el login
                admin.
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-[22px] border border-rose-500/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {submitError}
              </div>
            ) : null}

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="admin@citycalzado.com"
              error={form.formState.errors.email?.message}
              {...form.register('email')}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="********"
              error={form.formState.errors.password?.message}
              {...form.register('password')}
            />

            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="w-full"
              disabled={form.formState.isSubmitting || !isSupabaseConfigured}
            >
              <LockKeyhole className="h-4 w-4" />
              {form.formState.isSubmitting ? 'Ingresando...' : 'Ingresar al panel'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
