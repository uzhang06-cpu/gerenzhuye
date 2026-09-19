import type { SwapMatch } from '@skillswap/shared'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { MatchCard } from '../components/match/MatchCard'
import { EmptyState } from '../components/ui/EmptyState'

interface Props {
  matches: SwapMatch[]
  onInvite: (id: string) => void
  onSkip: (id: string) => void
  onRefresh: () => void
}

export function SwapPage({ matches, onInvite, onSkip, onRefresh }: Props) {
  return (
    <>
      <PageHeader
        title="对对碰"
        subtitle="按你能教的与想学的算出的双向匹配，契合度越高越值得聊一聊"
        action={
          <button
            type="button"
            aria-label="换一批匹配"
            onClick={onRefresh}
            className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-hairline bg-shell px-3 py-2 text-[12.5px] text-ink-soft active:bg-cream-deep"
          >
            <RefreshCw size={14} strokeWidth={2.2} />
            换一批
          </button>
        }
      />

      {matches.length === 0 ? (
        <EmptyState
          title="这一轮看完了"
          body="系统正在找新的双向匹配。也可以先去集市，用技能币直接约一位导师。"
          actionLabel="换一批看看"
          onAction={onRefresh}
        />
      ) : (
        <div className="flex flex-col gap-6 pb-6">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} onInvite={onInvite} onSkip={onSkip} />
          ))}
        </div>
      )}
    </>
  )
}
