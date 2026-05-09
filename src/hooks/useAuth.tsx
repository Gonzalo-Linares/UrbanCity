import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { AdminUserRow } from '@/types/database'

interface AuthContextValue {
  session: Session | null
  user: User | null
  adminUser: AdminUserRow | null
  isAuthenticated: boolean
  isAdmin: boolean
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

interface AuthState {
  session: Session | null
  adminUser: AdminUserRow | null
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

const initialAuthState: AuthState = {
  session: null,
  adminUser: null,
  loading: isSupabaseConfigured,
  error: isSupabaseConfigured
    ? null
    : 'Configura Supabase para habilitar el acceso admin.',
}

async function fetchAdminUser(session: Session) {
  if (!supabase) {
    return {
      adminUser: null,
      error: 'Configura Supabase para habilitar el acceso admin.',
    }
  }

  const { data, error } = await supabase
    .from('admin_users')
    .select('id, user_id, is_active, created_at')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    return {
      adminUser: null,
      error: 'No se pudo verificar el acceso admin en Supabase.',
    }
  }

  return {
    adminUser: data,
    error: null,
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>(initialAuthState)

  useEffect(() => {
    if (!supabase) {
      return
    }

    const client = supabase
    let ignore = false

    async function syncSession(nextSession: Session | null) {
      if (ignore) {
        return
      }

      if (!nextSession) {
        setState({
          session: null,
          adminUser: null,
          loading: false,
          error: null,
        })
        return
      }

      setState((current) => ({
        ...current,
        session: nextSession,
        loading: true,
        error: null,
      }))

      const result = await fetchAdminUser(nextSession)

      if (ignore) {
        return
      }

      setState({
        session: nextSession,
        adminUser: result.adminUser,
        loading: false,
        error: result.error,
      })
    }

    async function bootstrap() {
      const {
        data: { session },
      } = await client.auth.getSession()

      await syncSession(session)
    }

    void bootstrap()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession)
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session: state.session,
      user: state.session?.user ?? null,
      adminUser: state.adminUser,
      isAuthenticated: Boolean(state.session),
      isAdmin: Boolean(state.adminUser?.is_active),
      loading: state.loading,
      error: state.error,
      signIn: async (email, password) => {
        if (!supabase) {
          return 'Configura Supabase para habilitar el acceso admin.'
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        return error?.message ?? null
      },
      signOut: async () => {
        if (!supabase) {
          return
        }

        await supabase.auth.signOut()
      },
    }),
    [state.adminUser, state.error, state.loading, state.session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.')
  }

  return context
}
