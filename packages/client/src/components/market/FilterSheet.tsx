import { TIERS, type CertificationTier } from '@skillswap/shared'
import type { ReactNode } from 'react'
import {
  DEFAULT_FILTERS,
  PRICE_BANDS,
  RATING_OPTIONS,
  type MarketFilters,
} from '../../lib/marketFilters'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'

interface Props {
  open: boolean
  onClose: () => void
  /** 受控草稿：由调用方在打开时初始化，这样面板内部不需要用 effect 去同步状态 */
  draft: MarketFilters
  onDraftChange: (f: MarketFilters) => void
  onApply: (f: MarketFilters) => void
  /** 按草稿算出的结果数，用作按钮上的预览 */
  matchCount: number
}

export function FilterSheet({ open, onClose, draft, onDraftChange, onApply, matchCount }: Props) {
  const toggleTier = (id: CertificationTier) =>
    onDraftChange({
      ...draft,
      tiers: draft.tiers.includes(id) ? draft.tiers.filter((x) => x !== id) : [...draft.tiers, id],
    })

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="筛选课程"
      hint="按导师等级、价格区间与好评率收窄结果"
      footer={
        <div className="flex gap-2.5">
          <Button
            variant="ghost"
            size="lg"
            className="flex-1"
            onClick={() => onDraftChange(DEFAULT_FILTERS)}
          >
            重置
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-[1.6]"
            onClick={() => {
              onApply(draft)
              onClose()
            }}
          >
            查看 {matchCount} 个结果
          </Button>
        </div>
      }
    >
      <Group label="导师等级">
        {TIERS.map((t) => (
          <Chip
            key={t.id}
            label={t.label}
            active={draft.tiers.includes(t.id)}
            onClick={() => toggleTier(t.id)}
          />
        ))}
      </Group>

      <Group label="价格区间">
        {PRICE_BANDS.map((b) => (
          <Chip
            key={b.id}
            label={b.label}
            active={draft.priceBand === b.id}
            onClick={() => onDraftChange({ ...draft, priceBand: b.id })}
          />
        ))}
      </Group>

      <Group label="好评率">
        {RATING_OPTIONS.map((r) => (
          <Chip
            key={r.label}
            label={r.label}
            active={draft.minRating === r.value}
            onClick={() => onDraftChange({ ...draft, minRating: r.value })}
          />
        ))}
      </Group>
    </Sheet>
  )
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2.5 text-[13px] font-medium text-ink">{label}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-[13px] transition-colors duration-150 ${
        active
          ? 'border-transparent bg-coral font-medium text-white'
          : 'border-hairline bg-shell text-ink-soft'
      }`}
    >
      {label}
    </button>
  )
}
