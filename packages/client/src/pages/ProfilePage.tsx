import { VIP_PERKS, VIP_PRICE_COINS, type CoinTx, type Session, type UserProfile } from '@skillswap/shared'
import { Bell, ChevronRight, ShieldCheck, Sliders, Sparkles, UserX } from 'lucide-react'
import type { ReactNode } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { ReputationCard } from '../components/profile/ReputationCard'
import { SessionSummary } from '../components/profile/SessionSummary'
import { WalletCard } from '../components/profile/WalletCard'
import { Coin } from '../components/ui/Coin'

interface Props {
  profile: UserProfile
  balance: number
  frozen: number
  txs: CoinTx[]
  sessions: Session[]
  completedSwaps: number
  onTimeRate: number | null
  onRecharge: () => void
  onOpenSessions: () => void
}

const SETTINGS = [
  { icon: ShieldCheck, label: '账号安全' },
  { icon: Sliders, label: '技能库重新校准' },
  { icon: Bell, label: '消息提醒' },
  { icon: UserX, label: '黑名单' },
]

export function ProfilePage({
  profile,
  balance,
  frozen,
  txs,
  sessions,
  completedSwaps,
  onTimeRate,
  onRecharge,
  onOpenSessions,
}: Props) {
  return (
    <>
      <PageHeader title="我的" subtitle="资料、钱包、履约与会员权益都在这里" />

      <ReputationCard profile={profile} completedSwaps={completedSwaps} onTimeRate={onTimeRate} />

      <div className="mt-4 flex flex-col gap-4">
        <Section title="技能币钱包">
          <WalletCard balance={balance} frozen={frozen} txs={txs} onRecharge={onRecharge} />
        </Section>

        <Section title="会员增值">
          <section className="mx-5 overflow-hidden rounded-card shadow-card">
            <div
              className="px-5 pt-4.5 pb-5"
              style={{ background: 'linear-gradient(135deg, #FF7A5C 0%, #E24E2E 62%, #C93A1E 100%)' }}
            >
              <div className="flex items-center gap-2 text-white">
                <Sparkles size={16} strokeWidth={2.4} />
                <span className="text-[15px] font-semibold">SkillSwap 会员</span>
                <span className="ml-auto flex items-baseline gap-1 rounded-full bg-white/18 px-2.5 py-1">
                  <Coin value={VIP_PRICE_COINS} size="sm" onDark />
                  <span className="text-[11px] text-white/85">/月</span>
                </span>
              </div>
              <ul className="mt-3.5 flex flex-col gap-1.5">
                {VIP_PERKS.map((perk) => (
                  <li key={perk} className="text-[12.5px] text-white/90">
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              className="w-full bg-shell px-5 py-3.5 text-[13.5px] font-medium text-coral-deep active:bg-cream"
            >
              开通会员
            </button>
          </section>
        </Section>

        <Section title="履约工作台">
          <SessionSummary sessions={sessions} onOpen={onOpenSessions} />
        </Section>

        <Section title="设置">
          <ul className="mx-5 overflow-hidden rounded-card bg-shell shadow-card">
            {SETTINGS.map(({ icon: Icon, label }, i) => (
              <li key={label}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-cream ${
                    i > 0 ? 'border-t border-hairline' : ''
                  }`}
                >
                  <Icon size={17} strokeWidth={2} className="text-ink-soft" />
                  <span className="text-[13.5px] text-ink">{label}</span>
                  <ChevronRight size={16} className="ml-auto text-ink-faint" />
                </button>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="h-6" />
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="px-5 pb-2.5 text-[13px] font-medium text-ink-soft">{title}</h2>
      {children}
    </section>
  )
}
