import { getSkill, type Course } from '@skillswap/shared'
import { Monitor, MapPin } from 'lucide-react'
import { Coin } from '../ui/Coin'
import { TierBadge } from '../ui/TierBadge'

interface Props {
  course: Course
  /** 当前可用技能币，用来判断买不买得起 */
  balance: number
  onEnroll: (course: Course) => void
}

export function CourseCard({ course, balance, onEnroll }: Props) {
  const skill = getSkill(course.skillId)
  const ModeIcon = course.mode === 'online' ? Monitor : MapPin
  const affordable = balance >= course.coinsPerHour
  const isMine = course.ownerId === 'me'

  return (
    <article data-course={course.id} className="rounded-card bg-shell p-4 shadow-card">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full bg-cream-deep text-base"
        >
          {course.ownerAvatar}
        </span>
        <span className="text-[13px] font-medium text-ink">{course.ownerName}</span>
        <TierBadge tier={course.tier} />
        {course.goldMentor && (
          <span className="rounded-full bg-coin/15 px-2 py-[3px] text-[11px] font-medium text-[#9A6400]">
            金牌导师
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-ink-faint">
          <ModeIcon size={12} strokeWidth={2.2} />
          {course.mode === 'online' ? '线上' : '同城'}
        </span>
      </div>

      <h3 className="mt-3 text-[15px] leading-snug font-semibold text-ink">{course.title}</h3>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="rounded-md bg-coral/10 px-2 py-0.5 text-[11.5px] text-coral-deep">
          {skill?.label}
        </span>
        <span className="text-[11.5px] text-ink-faint">
          {course.ratingCount > 0
            ? `好评 ${Math.round(course.rating * 100)}% · 已教 ${course.sessionsDone} 课时`
            : '新上架 · 还没有评价'}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
        <span className="flex items-baseline gap-1">
          <Coin value={course.coinsPerHour} size="lg" />
          <span className="text-[12px] text-ink-soft">/ 课时</span>
        </span>

        {isMine ? (
          <span className="text-[12px] text-ink-faint">我发布的</span>
        ) : (
          <button
            type="button"
            disabled={!affordable}
            aria-label={`约课：${course.title}`}
            onClick={() => onEnroll(course)}
            className={`rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors duration-150 ${
              affordable
                ? 'bg-coral text-white active:brightness-95'
                : 'cursor-not-allowed bg-ink/6 text-ink-faint'
            }`}
          >
            {affordable ? '约课' : '技能币不足'}
          </button>
        )}
      </div>
    </article>
  )
}
