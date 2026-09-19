import { ArrowLeftRight, CircleUser, Plus, Shuffle, Store } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type TabId = 'swap' | 'market' | 'sessions' | 'profile'

interface NavItem {
  id: TabId
  label: string
  icon: LucideIcon
}

/** 五格：发布键独占正中一格，所以左右各两项，FAB 正好落在 50% */
const LEFT: NavItem[] = [
  { id: 'swap', label: '对对碰', icon: Shuffle },
  { id: 'market', label: '技能集市', icon: Store },
]
const RIGHT: NavItem[] = [
  { id: 'sessions', label: '交换中', icon: ArrowLeftRight },
  { id: 'profile', label: '我的', icon: CircleUser },
]

interface Props {
  active: TabId
  onSelect: (tab: TabId) => void
  onPublish: () => void
}

function NavButton({
  item,
  active,
  onSelect,
}: {
  item: NavItem
  active: boolean
  onSelect: (t: TabId) => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      /* 漫游指引靠这个属性定位高亮目标，比在组件之间传 ref 干净 */
      data-tour={item.id}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      onClick={() => onSelect(item.id)}
      className={`flex flex-col items-center gap-1 py-2 text-[11px] transition-colors duration-150 ${
        active ? 'text-coral-deep' : 'text-ink-faint'
      }`}
    >
      <Icon size={21} strokeWidth={active ? 2.4 : 2} />
      <span className={active ? 'font-medium' : ''}>{item.label}</span>
    </button>
  )
}

export function BottomNav({ active, onSelect, onPublish }: Props) {
  return (
    <nav className="nav-bar relative z-20 grid shrink-0 grid-cols-5 items-end px-1">
      {LEFT.map((item) => (
        <NavButton key={item.id} item={item} active={active === item.id} onSelect={onSelect} />
      ))}

      <div className="flex justify-center">
        <button
          type="button"
          data-tour="publish"
          aria-label="发布课程"
          onClick={onPublish}
          className="-mt-7 grid size-14 place-items-center rounded-full text-white transition-transform duration-150 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #FF7A5C 0%, #E24E2E 100%)',
            boxShadow: '0 0 0 4px var(--color-cream), 0 10px 22px -6px rgba(226,78,46,.6)',
          }}
        >
          <Plus size={26} strokeWidth={2.6} />
        </button>
      </div>

      {RIGHT.map((item) => (
        <NavButton key={item.id} item={item} active={active === item.id} onSelect={onSelect} />
      ))}
    </nav>
  )
}
