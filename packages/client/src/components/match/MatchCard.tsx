import { getSkill, matchScoreLabel, type SwapMatch } from '@skillswap/shared'
import { Button } from '../ui/Button'
import { TierBadge } from '../ui/TierBadge'

interface Props {
  match: SwapMatch
  onInvite: (id: string) => void
  onSkip: (id: string) => void
}

/**
 * 匹配卡 = 一张可撕的交换凭证。
 * 上下两半分别是对方「能教」与「想学」，中缝的封印是这张卡唯一被允许张扬的地方；
 * 人物身份留在卡片外的上方，因为中缝必须恒在 50%（见 index.css 注释）。
 */
export function MatchCard({ match, onInvite, onSkip }: Props) {
  const teachSkill = getSkill(match.teachSkillId)
  const wantSkill = getSkill(match.wantSkillId)

  return (
    <article className="px-5">
      <header className="flex items-center gap-3 pb-3">
        <span
          aria-hidden
          className="grid size-11 shrink-0 place-items-center rounded-full bg-cream-deep text-xl shadow-[inset_0_0_0_1px_rgba(255,177,153,.5)]"
        >
          {match.partnerAvatar}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-ink">{match.partnerName}</h3>
          <p className="text-[11px] text-ink-soft">{match.partnerRoleTag}</p>
        </div>
      </header>

      <div className="voucher-cast">
        <div className="voucher">
          <div className="voucher__perf" aria-hidden />

          <section className="flex flex-col justify-center gap-2 px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="rounded-md bg-coral/12 px-1.5 py-0.5 text-[11px] font-medium text-coral-deep">
                能教
              </span>
              <span className="text-[15px] font-semibold text-ink">{teachSkill?.label}</span>
              <TierBadge tier={match.teachTier} />
            </div>
            <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-soft">
              {match.teachNote}
            </p>
          </section>

          <div className="voucher__seal">
            <div className="voucher__seal-disc">
              <span className="num text-[16px] leading-none font-bold">{match.score}%</span>
            </div>
            <span className="rounded-full bg-shell px-2.5 py-1 text-[13px] font-semibold text-coral-deep">
              {matchScoreLabel(match.score)}
            </span>
          </div>

          <section className="flex flex-col justify-center gap-2 px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="rounded-md bg-peach/40 px-1.5 py-0.5 text-[11px] font-medium text-ink-soft">
                想学
              </span>
              <span className="text-[15px] font-semibold text-ink">{wantSkill?.label}</span>
              <TierBadge tier={match.wantTier} />
            </div>
            <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-soft">{match.wantNote}</p>
          </section>
        </div>
      </div>

      <div className="flex gap-2.5 pt-4">
        <Button variant="ghost" size="lg" className="flex-1" onClick={() => onSkip(match.id)}>
          稍后再看
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-[1.4]"
          aria-label={`向 ${match.partnerName} 发起互换邀请`}
          onClick={() => onInvite(match.id)}
        >
          发起互换
        </Button>
      </div>
    </article>
  )
}
