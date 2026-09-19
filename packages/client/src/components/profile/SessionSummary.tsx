import type { Session } from '@skillswap/shared'
import { ChevronRight } from 'lucide-react'

/**
 * 个人页只放概况，把完整列表让给「交换中」页 ——
 * 同一份列表在两个 tab 里各渲染一遍，会让「该去哪儿办事」变得含糊。
 */
export function SessionSummary({ sessions, onOpen }: { sessions: Session[]; onOpen: () => void }) {
  const active = sessions.filter((s) => s.status === 'active' || s.status === 'pending').length
  const reviewing = sessions.filter((s) => s.status === 'reviewing').length

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="查看交换中的全部交换"
      className="mx-5 flex w-[calc(100%-2.5rem)] items-center gap-3 rounded-card bg-shell p-4 text-left shadow-card active:bg-cream"
    >
      <div className="flex-1">
        <p className="text-[13.5px] text-ink">
          有 <span className="num font-semibold text-coral-deep">{active}</span> 段交换进行中
          {reviewing > 0 && (
            <>
              ，<span className="num font-semibold text-coin">{reviewing}</span> 段待互评
            </>
          )}
        </p>
        <p className="mt-1 text-[11.5px] text-ink-faint">查看待赴约日程与互评</p>
      </div>
      <ChevronRight size={17} className="text-ink-faint" />
    </button>
  )
}
