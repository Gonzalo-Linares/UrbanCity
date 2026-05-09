import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'

export function NotFoundPage() {
  return (
    <div className="shell-container py-10">
      <EmptyState
        title="No encontramos esa pagina"
        description="La ruta no existe dentro de esta tienda. Volve al inicio para seguir navegando."
        action={
          <Link to="/" className="text-sm font-medium text-brand-strong">
            Ir al inicio
          </Link>
        }
      />
    </div>
  )
}
