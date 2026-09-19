import { TAXONOMY, type Bounty, type Course } from '@skillswap/shared'
import { SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { BountyCard } from '../components/market/BountyCard'
import { CourseCard } from '../components/market/CourseCard'
import { FilterSheet } from '../components/market/FilterSheet'
import { EmptyState } from '../components/ui/EmptyState'
import {
  DEFAULT_FILTERS,
  activeFilterCount,
  applyFilters,
  inCategory,
  type MarketFilters,
} from '../lib/marketFilters'

export type MarketSegment = 'courses' | 'bounties'

interface Props {
  courses: Course[]
  bounties: Bounty[]
  acceptedBountyIds: string[]
  balance: number
  /**
   * 课时流 / 悬赏区由上层持有：发布完一门课要跳过来让人看到自己的课，
   * 如果这个状态藏在页面内部，发布时就没法把它拨回「课时流」。
   */
  segment: MarketSegment
  onSegmentChange: (s: MarketSegment) => void
  onEnroll: (course: Course) => void
  onTakeBounty: (bounty: Bounty) => void
}

export function MarketPage({
  courses,
  bounties,
  acceptedBountyIds,
  balance,
  segment,
  onSegmentChange,
  onEnroll,
  onTakeBounty,
}: Props) {
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [filters, setFilters] = useState<MarketFilters>(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  /** 面板内的草稿，打开时从已生效的筛选复制一份，取消不会污染结果 */
  const [draft, setDraft] = useState<MarketFilters>(DEFAULT_FILTERS)

  const scopedCourses = useMemo(
    () => courses.filter((c) => inCategory(c.skillId, categoryId)),
    [courses, categoryId],
  )
  const shownCourses = useMemo(() => applyFilters(scopedCourses, filters), [scopedCourses, filters])
  const shownBounties = useMemo(
    () => bounties.filter((b) => inCategory(b.skillId, categoryId)),
    [bounties, categoryId],
  )

  const activeCount = activeFilterCount(filters)

  return (
    <>
      <PageHeader
        title="技能集市"
        subtitle="遇不到双向匹配时，用技能币直接约——单向也能学"
        action={
          segment === 'courses' ? (
            <button
              type="button"
              aria-label="筛选课程"
              onClick={() => {
                setDraft(filters)
                setFilterOpen(true)
              }}
              className={`mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[12.5px] ${
                activeCount
                  ? 'border-transparent bg-coral text-white'
                  : 'border-hairline bg-shell text-ink-soft'
              }`}
            >
              <SlidersHorizontal size={14} strokeWidth={2.2} />
              筛选{activeCount ? ` · ${activeCount}` : ''}
            </button>
          ) : undefined
        }
      />

      <div className="px-5">
        <div className="flex rounded-full bg-shell p-1 shadow-[inset_0_0_0_1px_var(--color-hairline)]">
          {(
            [
              ['courses', '课时流'],
              ['bounties', '悬赏区'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={segment === id}
              onClick={() => onSegmentChange(id)}
              className={`flex-1 rounded-full py-2 text-[13px] transition-colors duration-150 ${
                segment === id ? 'bg-coral font-medium text-white' : 'text-ink-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3.5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip label="全部" active={categoryId === null} onClick={() => setCategoryId(null)} />
        {TAXONOMY.map((c) => (
          <FilterChip
            key={c.id}
            label={c.label}
            active={categoryId === c.id}
            onClick={() => setCategoryId(categoryId === c.id ? null : c.id)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 px-5 pt-4 pb-6">
        {segment === 'courses' ? (
          shownCourses.length ? (
            shownCourses.map((c) => (
              <CourseCard key={c.id} course={c} balance={balance} onEnroll={onEnroll} />
            ))
          ) : (
            <EmptyState
              title="没有符合条件的课程"
              body="把筛选放宽一点，或者点中间的 + 把你会的技能挂上来——也许下一个需要的人就是你。"
              actionLabel="清除筛选"
              onAction={() => {
                setFilters(DEFAULT_FILTERS)
                setCategoryId(null)
              }}
            />
          )
        ) : shownBounties.length ? (
          shownBounties.map((b) => (
            <BountyCard
              key={b.id}
              bounty={b}
              accepted={acceptedBountyIds.includes(b.id)}
              onTake={() => onTakeBounty(b)}
            />
          ))
        ) : (
          <EmptyState
            title="这个分类还没有悬赏"
            body="没人求教？那正好，先把你会的挂成课程，等人来找你。"
            actionLabel="看全部分类"
            onAction={() => setCategoryId(null)}
          />
        )}
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        draft={draft}
        onDraftChange={setDraft}
        onApply={setFilters}
        matchCount={applyFilters(scopedCourses, draft).length}
      />
    </>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors duration-150 ${
        active
          ? 'border-transparent bg-coral/12 font-medium text-coral-deep'
          : 'border-hairline bg-shell text-ink-soft'
      }`}
    >
      {label}
    </button>
  )
}
