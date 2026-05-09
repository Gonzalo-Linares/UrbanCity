import cityLogo from '@/assets/city-logo.jpg'
import { cn } from '@/lib/cn'

const gradientPresets = [
  'from-[#050505] via-[#181818] to-[#2b2b2b]',
  'from-[#0a0a0a] via-[#202020] to-[#4a4a4a]',
  'from-[#050505] via-[#1b1b1b] to-[#b6ff00]/40',
  'from-[#111111] via-[#2a2a2a] to-[#707070]',
]

interface ProductVisualProps {
  name: string
  categoryName?: string | null
  imageUrl?: string | null
  seed: string
  className?: string
}

function hashSeed(seed: string) {
  return Array.from(seed).reduce((total, character) => {
    return total + character.charCodeAt(0)
  }, 0)
}

export function ProductVisual({
  name,
  categoryName,
  imageUrl,
  seed,
  className,
}: ProductVisualProps) {
  if (imageUrl && /^(https?:\/\/|\/)/.test(imageUrl)) {
    return (
      <div className={cn('overflow-hidden rounded-[24px] bg-[#111111]', className)}>
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    )
  }

  const gradient = gradientPresets[hashSeed(seed) % gradientPresets.length]
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className={cn(
        'subtle-grid relative overflow-hidden rounded-[24px] border border-white/8 bg-gradient-to-br text-white',
        gradient,
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(182,255,0,0.18),transparent_24%)]" />
      <img
        src={cityLogo}
        alt=""
        className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full opacity-[0.08] grayscale"
      />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 text-[0.68rem] uppercase tracking-[0.22em] text-white/64">
        <span>{categoryName ?? 'Seleccion'}</span>
        <span>City</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl font-semibold tracking-[0.2em] text-white/92">
          {initials}
        </span>
      </div>
    </div>
  )
}
