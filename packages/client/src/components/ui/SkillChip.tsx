import { getSkill } from '@skillswap/shared'
import { Check, X } from 'lucide-react'

interface Props {
  skillId: string
  /** teach 用珊瑚实心，want 用蜜桃描边，两者在心愿页与技能页必须一眼可分 */
  tone?: 'teach' | 'want'
  selected?: boolean
  onToggle?: (skillId: string) => void
  /** 未命中分类库的建议词，灰显不可选 */
  muted?: boolean
}

export function SkillChip({ skillId, tone = 'teach', selected = false, onToggle, muted = false }: Props) {
  const skill = getSkill(skillId)
  const label = skill?.label ?? skillId

  if (muted) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink-faint/70 px-3 py-1.5 text-[13px] text-ink-faint">
        {label}
      </span>
    )
  }

  const activeTeach = selected && tone === 'teach'
  const activeWant = selected && tone === 'want'

  const cls = activeTeach
    ? 'bg-coral text-white border-transparent shadow-[0_4px_12px_-4px_rgba(226,78,46,.5)]'
    : activeWant
      ? 'bg-peach/45 text-ink border-coral/35'
      : 'bg-shell text-ink-soft border-hairline'

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${selected ? '取消' : '选择'}技能：${label}`}
      onClick={() => onToggle?.(skillId)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors duration-150 ${cls}`}
    >
      {selected && <Check size={13} strokeWidth={3} />}
      {label}
      {selected && onToggle && <X size={12} strokeWidth={2.4} className="opacity-60" />}
    </button>
  )
}
