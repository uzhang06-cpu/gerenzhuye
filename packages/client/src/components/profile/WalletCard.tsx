import type { CoinTx } from '@skillswap/shared'
import { Snowflake } from 'lucide-react'
import { Button } from '../ui/Button'
import { Coin } from '../ui/Coin'

interface Props {
  balance: number
  frozen: number
  txs: CoinTx[]
  onRecharge: () => void
}

/** 钱包里最多列几条流水 */
const RECENT_TX = 6

const TX_LABEL: Record<CoinTx['kind'], string> = {
  earn: '教人收入',
  spend: '约课支出',
  recharge: '充值',
  bonus: '注册赠送',
  freeze: '冻结中',
  unfreeze: '解冻',
}

export function WalletCard({ balance, frozen, txs, onRecharge }: Props) {
  return (
    <section className="mx-5 rounded-card bg-shell p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] text-ink-soft">可用技能币</p>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <Coin value={balance} size="lg" />
            <span className="text-[12px] text-ink-soft">币</span>
          </div>
          {frozen > 0 && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-[11.5px] text-ink-soft">
              <Snowflake size={12} strokeWidth={2.2} />
              履约中冻结 <span className="num font-semibold">{frozen}</span> 币
            </p>
          )}
        </div>
        <Button variant="soft" onClick={onRecharge}>
          充值
        </Button>
      </div>

      <ul className="mt-4 border-t border-hairline pt-1">
        {/* 只列最近几条：流水是种子生成的，几十条全铺出来会把个人页拉成一屏半的空滚动 */}
        {txs.slice(0, RECENT_TX).map((tx) => (
          <li key={tx.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-ink">{tx.note}</p>
              {/* 备注已经说清楚是什么时，就不再重复一遍类型 */}
              {tx.note !== TX_LABEL[tx.kind] && (
                <p className="mt-0.5 text-[11px] text-ink-faint">{TX_LABEL[tx.kind]}</p>
              )}
            </div>
            <Coin value={tx.amount} signed size="sm" />
          </li>
        ))}
      </ul>

      {txs.length > RECENT_TX && (
        <p className="pt-1 text-center text-[11.5px] text-ink-faint">
          共 {txs.length} 条流水，这里显示最近 {RECENT_TX} 条
        </p>
      )}
    </section>
  )
}
