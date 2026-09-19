import { getSkill, type Session, type SessionStatus } from '@skillswap/shared'
import { ArrowLeftRight, CalendarClock } from 'lucide-react'
import { Button } from '../ui/Button'
import { Coin } from '../ui/Coin'

interface Props {
  sessions: Session[]
  onAdvance: (id: string, from: SessionStatus, coinsEarned: number) => void
}

const STATUS: Record<SessionStatus, { label: string; cls: string }> = {
  pending: { label: '待开始', cls: 'bg-cream text-ink-soft' },
  active: { label: '进行中', cls: 'bg-coral/12 text-coral-deep' },
  reviewing: { label: '待互评', cls: 'bg-coin/15 text-[#9A6400]' },
  done: { label: '已完成', cls: 'bg-leaf/12 text-leaf' },
}

/** 每个状态下唯一有意义的下一步动作，措辞就是点下去会发生的事 */
const ACTION: Partial<Record<SessionStatus, { label: string; to: string }>> = {
  pending: { label: '确认开始', to: '进行中' },
  active: { label: '完成这次交换', to: '已完成' },
  reviewing: { label: '完成互评', to: '已完成' },
}

function formatDay(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日 ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`
}

export function SessionList({ sessions, onAdvance }: Props) {
  if (sessions.length === 0) {
    return (
      <p className="mx-5 rounded-card border border-dashed border-hairline bg-shell/60 px-5 py-6 text-center text-[13px] text-ink-soft">
        还没有进行中的交换。去对对碰接受一个邀请，或到集市约一节课。
      </p>
    )
  }

  return (
    <ul className="mx-5 flex flex-col gap-2.5">
      {sessions.map((s) => {
        const status = STATUS[s.status]
        const action = ACTION[s.status]
        return (
          <li key={s.id} className="rounded-card bg-shell p-4 shadow-card">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-full bg-cream-deep text-base"
              >
                {s.partnerAvatar}
              </span>
              <span className="text-[13.5px] font-medium text-ink">{s.partnerName}</span>
              <span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-medium ${status.cls}`}>
                {status.label}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-ink-soft">
              {s.teachingSkillId ? (
                <>
                  <span className="inline-flex items-center gap-1">
                    我教 <span className="text-ink">{getSkill(s.teachingSkillId)?.label}</span>
                  </span>
                  {s.learningSkillId && <ArrowLeftRight size={12} className="text-ink-faint" />}
                </>
              ) : (
                <span className="rounded-md bg-peach/40 px-2 py-0.5 text-[11px] text-ink-soft">
                  单向约课
                </span>
              )}
              {s.learningSkillId ? (
                <span className="inline-flex items-center gap-1">
                  我学 <span className="text-ink">{getSkill(s.learningSkillId)?.label}</span>
                </span>
              ) : (
                <span className="rounded-md bg-cream px-2 py-0.5 text-[11px] text-ink-soft">接单授课</span>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {s.nextAt && (
                <span className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-faint">
                  <CalendarClock size={12} strokeWidth={2.2} />
                  下次 {formatDay(s.nextAt)}
                </span>
              )}
              {s.coinsSpent ? (
                <span className="inline-flex items-center gap-1 text-[11.5px] text-ink-faint">
                  已付 <Coin value={s.coinsSpent} size="sm" />
                </span>
              ) : null}
              {s.coinsEarned > 0 && (
                <span className="inline-flex items-center gap-1 text-[11.5px] text-ink-faint">
                  收入 <Coin value={s.coinsEarned} signed size="sm" />
                </span>
              )}
            </div>

            {action && (
              <Button
                variant="soft"
                size="md"
                className="mt-3 w-full"
                aria-label={`${action.label}：与 ${s.partnerName}`}
                onClick={() => onAdvance(s.id, s.status, s.coinsEarned)}
              >
                {action.label}
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
