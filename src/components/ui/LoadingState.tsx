export function LoadingState({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="surface-card flex min-h-48 items-center justify-center p-10 text-center">
      <div className="space-y-3">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-black/10 border-t-brand-strong" />
        <p className="text-sm text-stone-600">{label}</p>
      </div>
    </div>
  )
}
