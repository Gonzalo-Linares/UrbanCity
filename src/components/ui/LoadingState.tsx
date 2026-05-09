export function LoadingState({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#151515] p-10 text-center">
      <div className="space-y-3">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-brand-strong" />
        <p className="text-sm text-white/70">{label}</p>
      </div>
    </div>
  )
}
