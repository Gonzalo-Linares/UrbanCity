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
  imageFit?: 'cover' | 'contain'
  visualStyle?: 'stage' | 'compact'
  imageScale?: 'normal' | 'large' | 'fill'
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
  imageFit = 'cover',
  visualStyle = 'stage',
  imageScale = 'normal',
}: ProductVisualProps) {
  if (imageUrl && /^(https?:\/\/|\/)/.test(imageUrl)) {
    const isContain = imageFit === 'contain'
    const isCompact = visualStyle === 'compact'
    const containImageClass = isCompact
      ? imageScale === 'fill'
        ? 'object-contain p-1 sm:p-1.5 scale-[1.10] drop-shadow-[0_10px_18px_rgba(0,0,0,0.22)]'
        : imageScale === 'large'
          ? 'object-contain p-1.5 sm:p-2 scale-[1.06] drop-shadow-[0_11px_18px_rgba(0,0,0,0.23)]'
          : 'object-contain p-2 sm:p-2.5 scale-100 drop-shadow-[0_12px_18px_rgba(0,0,0,0.24)]'
      : imageScale === 'fill'
        ? 'object-contain p-1 sm:p-1.5 scale-[1.12] drop-shadow-[0_18px_30px_rgba(0,0,0,0.34)]'
        : imageScale === 'large'
          ? 'object-contain p-2 sm:p-2.5 scale-[1.06] drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]'
          : 'object-contain p-3 sm:p-4 scale-100 drop-shadow-[0_18px_30px_rgba(0,0,0,0.36)]'

    return (
      <div
        className={cn(
          'relative isolate overflow-hidden rounded-[24px] bg-[#101010]',
          className,
        )}
      >
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 h-full w-full object-cover',
            isCompact
              ? 'scale-105 opacity-[0.12] blur-xl'
              : 'scale-110 opacity-[0.18] blur-2xl',
          )}
          loading="lazy"
          decoding="async"
        />
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0',
            isCompact
              ? 'bg-[radial-gradient(circle_at_20%_18%,rgba(182,255,0,0.06),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(6,6,6,0.18)_42%,rgba(4,4,4,0.42)_100%)]'
              : 'bg-[radial-gradient(circle_at_18%_16%,rgba(182,255,0,0.1),transparent_34%),radial-gradient(circle_at_84%_0%,rgba(255,255,255,0.06),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_28%,rgba(3,3,3,0.42)_100%)]',
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0',
            isCompact
              ? 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03),inset_0_-18px_28px_rgba(0,0,0,0.24)]'
              : 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),inset_0_-28px_48px_rgba(0,0,0,0.34),inset_0_0_48px_rgba(0,0,0,0.18)]',
          )}
        />
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          className={cn(
            'relative z-10 h-full w-full transform-gpu',
            isContain ? containImageClass : 'object-cover p-0 scale-100',
          )}
        />
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
