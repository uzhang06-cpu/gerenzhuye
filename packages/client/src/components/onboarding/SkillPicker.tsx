import { TAXONOMY, searchSkills } from '@skillswap/shared'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SkillChip } from '../ui/SkillChip'

interface Props {
  selectedIds: string[]
  onToggle: (skillId: string) => void
  tone?: 'teach' | 'want'
  /** 需要从候选里彻底排除的技能（Step 3 用来排除用户已经会教的） */
  excludeIds?: string[]
  searchPlaceholder?: string
}

/**
 * 二级级联技能选择器：顶部全局检索，下方按五个一级分类平铺。
 *
 * 刻意不做折叠面板 —— 折叠会把 20 个选项藏起来，用户得先猜哪个分类里才有他要的东西。
 * 平铺加检索，一眼看得完，滚动也不算负担。
 */
export function SkillPicker({
  selectedIds,
  onToggle,
  tone = 'teach',
  excludeIds = [],
  searchPlaceholder = '搜技能，比如「吉他」「爬虫」',
}: Props) {
  const [query, setQuery] = useState('')
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds])
  const selected = useMemo(() => new Set(selectedIds), [selectedIds])

  const results = useMemo(
    () => (query.trim() ? searchSkills(query).filter((s) => !excluded.has(s.id)) : []),
    [query, excluded],
  )

  return (
    <div>
      <label className="flex items-center gap-2 rounded-2xl border border-hairline bg-shell px-3.5 py-2.5">
        <Search size={15} className="shrink-0 text-ink-faint" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label="搜索技能"
          className="w-full bg-transparent text-[14px] text-ink placeholder:text-ink-faint focus:outline-none"
        />
      </label>

      {query.trim() ? (
        <div className="mt-3.5">
          {results.length ? (
            <div className="flex flex-wrap gap-2">
              {results.map((s) => (
                <SkillChip
                  key={s.id}
                  skillId={s.id}
                  tone={tone}
                  selected={selected.has(s.id)}
                  onToggle={onToggle}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-hairline px-4 py-6 text-center text-[13px] text-ink-soft">
              技能库里没有「{query.trim()}」。换个说法试试，或者直接选个相近的。
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {TAXONOMY.map((category) => {
            const options = category.skills.filter((s) => !excluded.has(s.id))
            if (!options.length) return null
            return (
              <section key={category.id}>
                <h3 className="mb-2 text-[12px] font-medium text-ink-soft">{category.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {options.map((s) => (
                    <SkillChip
                      key={s.id}
                      skillId={s.id}
                      tone={tone}
                      selected={selected.has(s.id)}
                      onToggle={onToggle}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
