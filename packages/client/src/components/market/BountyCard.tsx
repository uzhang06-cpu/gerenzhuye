import { getSkill, type Bounty } from '@skillswap/shared'
import { Monitor, MapPin } from 'lucide-react'
import { Coin } from '../ui/Coin'

interface Props {
  bounty: Bounty
  /** 已经接过的悬赏不能再接一次 */
  accepted?: boolean
  onTake?: () => void
}

/** 悬赏卡刻意比课时卡轻：它是「需求」，不该跟成型的课程抢视觉重量。 */
export function BountyCard({ bounty, accepted = false, onTake }: Props) {
  const skill = getSkill(bounty.skillId)
  const ModeIcon = bounty.mode === 'online' ? Monitor : MapPin

  return (
    <div className="rounded-card border border-hairline bg-shell/70 p-4">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-7 shrink-0 place-items-center rounded-full bg-cream-deep text-sm"
        >
          {bounty.ownerAvatar}
        </span>
        <span className="text-[12.5px] text-ink-soft">{bounty.ownerName}</span>
        <span className="rounded-md bg-peach/40 px-2 py-0.5 text-[11px] text-ink-soft">悬赏</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-ink-faint">
          <ModeIcon size={12} strokeWidth={2.2} />
          {bounty.mode === 'online' ? '线上' : '同城'}
        </span>
      </div>

      <p className="mt-2.5 text-[14px] leading-snug text-ink">{bounty.title}</p>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11.5px] text-ink-faint">{skill?.label}</span>
        <span className="flex items-center gap-2">
          <Coin value={bounty.budgetCoins} size="md" />
          {accepted ? (
            <span className="rounded-full bg-leaf/12 px-3 py-1.5 text-[12px] font-medium text-leaf">
              已接单
            </span>
          ) : (
            <button
              type="button"
              aria-label={`接单：${bounty.title}`}
              onClick={onTake}
              className="rounded-full bg-coral/10 px-3 py-1.5 text-[12px] font-medium text-coral-deep active:bg-coral/16"
            >
              去接单
            </button>
          )}
        </span>
      </div>
    </div>
  )
}
