import type { Session, SessionStatus } from '@skillswap/shared'
import { CalendarClock } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { SessionList } from '../components/profile/SessionList'

interface Props {
  sessions: Session[]
  onAdvance: (id: string, from: SessionStatus) => void
}

export function SessionsPage({ sessions, onAdvance }: Props) {
  const active = sessions.filter((s) => s.status === 'active').length
  const pending = sessions.filter((s) => s.status === 'pending').length
  const reviewing = sessions.filter((s) => s.status === 'reviewing').length

  return (
    <>
      <PageHeader title="交换中" subtitle="正在进行与待赴约的交换都在这里" />

      <div className="mx-5 mb-4 grid grid-cols-3 gap-2 rounded-card bg-shell p-4 shadow-card">
        <Cell value={active} label="进行中" />
        <Cell value={pending} label="待赴约" />
        <Cell value={reviewing} label="待互评" />
      </div>

      <SessionList sessions={sessions} onAdvance={onAdvance} />

      <div className="mx-5 mt-4 rounded-card border border-dashed border-hairline bg-shell/60 px-5 py-4">
        <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-soft">
          <CalendarClock size={14} className="mt-0.5 shrink-0 text-ink-faint" strokeWidth={2.2} />
          准时赴约会被记进你的履约率。这条声誉指标会直接显示在别人的匹配卡上 —— 平台的防鸽子机制靠它。
        </p>
      </div>
    </>
  )
}

function Cell({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="num text-[20px] leading-none font-semibold text-ink">{value}</div>
      <div className="mt-1.5 text-[11px] text-ink-faint">{label}</div>
    </div>
  )
}
