import type { UserProfile } from '@skillswap/shared'
import { Leaf } from 'lucide-react'

interface Props {
  profile: UserProfile
  completedSwaps: number
  /** 准时履约率 0-1；还没有完成过交换时为 null，此时显示「—」而不是编一个数字 */
  onTimeRate: number | null
}

export function ReputationCard({ profile, completedSwaps, onTimeRate }: Props) {
  const certified = Object.keys(profile.tierBySkillId).length

  return (
    <section className="mx-5 rounded-card bg-shell p-5 shadow-card">
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden
          className="grid size-14 shrink-0 place-items-center rounded-full bg-cream-deep text-2xl shadow-[inset_0_0_0_1.5px_rgba(255,177,153,.6)]"
        >
          {profile.avatar}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-semibold text-ink">{profile.nickname}</h2>
          <p className="mt-0.5 text-[12px] text-ink-soft">{profile.roleTag}</p>
        </div>
      </div>

      {profile.bio && (
        <p className="mt-3.5 rounded-2xl bg-cream px-3.5 py-3 text-[13px] leading-relaxed text-ink-soft">
          {profile.bio}
        </p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-hairline pt-4">
        <Stat value={completedSwaps} label="完成交换" />
        <Stat
          value={onTimeRate === null ? '—' : `${Math.round(onTimeRate * 100)}%`}
          label="准时履约"
          tone="leaf"
        />
        <Stat value={certified} label="已认证技能" />
      </div>
    </section>
  )
}

function Stat({ value, label, tone }: { value: number | string; label: string; tone?: 'leaf' }) {
  return (
    <div className="text-center">
      <div
        className={`num text-[19px] leading-none font-semibold ${
          tone === 'leaf' ? 'text-leaf' : 'text-ink'
        }`}
      >
        {value}
      </div>
      <div className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-ink-faint">
        {tone === 'leaf' && <Leaf size={11} strokeWidth={2.4} />}
        {label}
      </div>
    </div>
  )
}
