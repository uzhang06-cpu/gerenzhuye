import { getTier, type CertificationTier } from '@skillswap/shared'
import { Crown } from 'lucide-react'

interface Props {
  tier: CertificationTier
  /** 卡片里用 sm，表单里选等级用 md */
  size?: 'sm' | 'md'
}

/**
 * 认证等级徽章。三个等级必须在扫一眼时就分得出高低：
 * 小白是灰底低调，熟练是珊瑚色描边，精英是实心渐变加冠冕。
 */
export function TierBadge({ tier, size = 'sm' }: Props) {
  const spec = getTier(tier)
  const pad = size === 'sm' ? 'px-2 py-[3px] text-[11px]' : 'px-2.5 py-1 text-xs'

  if (tier === 'elite') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium text-white ${pad}`}
        style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #F0A020 100%)' }}
      >
        <Crown size={size === 'sm' ? 11 : 13} strokeWidth={2.4} />
        {spec.label}
      </span>
    )
  }

  if (tier === 'skilled') {
    return (
      <span className={`inline-flex items-center rounded-full bg-coral/12 font-medium text-coral-deep ${pad}`}>
        {spec.label}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center rounded-full border border-hairline text-ink-soft ${pad}`}>
      {spec.label}
    </span>
  )
}
