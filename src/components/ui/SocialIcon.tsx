import instagramIcon from '@/assets/instagram_icon.png'
import whatsAppIcon from '@/assets/WhatsApp_icon.png'
import { cn } from '@/lib/cn'

type SocialIconType = 'instagram' | 'whatsapp'

const iconSources: Record<SocialIconType, string> = {
  instagram: instagramIcon,
  whatsapp: whatsAppIcon,
}

interface SocialIconProps {
  type: SocialIconType
  className?: string
}

export function SocialIcon({ type, className }: SocialIconProps) {
  return (
    <img
      src={iconSources[type]}
      alt=""
      aria-hidden="true"
      className={cn('h-4 w-4 object-contain', className)}
    />
  )
}
