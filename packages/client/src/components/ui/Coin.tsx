interface Props {
  value: number
  /** 带正负号的流水用 signed */
  signed?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** 放在深色/渐变底上时用，文字转白 */
  onDark?: boolean
  className?: string
}

const SIZES = {
  sm: { coin: 12, text: 'text-[13px]' },
  md: { coin: 14, text: 'text-[15px]' },
  lg: { coin: 18, text: 'text-xl' },
} as const

/**
 * 技能币金额。金币图形用纯 CSS 画，免得为一个图标引入图片资源。
 */
export function Coin({ value, signed = false, size = 'md', onDark = false, className = '' }: Props) {
  const s = SIZES[size]
  const shown = signed && value > 0 ? `+${value}` : String(value)
  const tone = onDark ? 'text-white' : signed ? (value >= 0 ? 'text-leaf' : 'text-ink-soft') : 'text-ink'

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span
        aria-hidden
        className="inline-block shrink-0 rounded-full"
        style={{
          width: s.coin,
          height: s.coin,
          background: 'linear-gradient(140deg, #FFD37A 0%, #F0A020 55%, #D9820B 100%)',
          boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.45)',
        }}
      />
      <span className={`num font-semibold ${s.text} ${tone}`}>{shown}</span>
    </span>
  )
}
