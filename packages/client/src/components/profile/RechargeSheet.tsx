import { RECHARGE_PRESETS } from '@skillswap/shared'
import { useState } from 'react'
import { Button } from '../ui/Button'
import { Coin } from '../ui/Coin'
import { Sheet } from '../ui/Sheet'

interface Props {
  open: boolean
  onClose: () => void
  balance: number
  onRecharge: (coins: number) => void
}

/** 充值面板。破冰期用户手上没有币，这一步是能不能约到人的前提。 */
export function RechargeSheet({ open, onClose, balance, onRecharge }: Props) {
  const [picked, setPicked] = useState<number>(RECHARGE_PRESETS[1])

  return (
    <Sheet open={open} onClose={onClose} title="充值技能币" hint="充值后可用于约课与悬赏">
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-cream px-4 py-3.5">
        <span className="text-[12.5px] text-ink-soft">当前余额</span>
        <Coin value={balance} size="md" />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {RECHARGE_PRESETS.map((amount) => (
          <button
            key={amount}
            type="button"
            aria-pressed={picked === amount}
            onClick={() => setPicked(amount)}
            className={`rounded-2xl border py-4 transition-colors duration-150 ${
              picked === amount
                ? 'border-coral/45 bg-coral/8'
                : 'border-hairline bg-shell'
            }`}
          >
            <Coin value={amount} size="lg" />
          </button>
        ))}
      </div>

      <Button
        variant="primary"
        size="lg"
        className="mt-5 w-full"
        onClick={() => {
          onRecharge(picked)
          onClose()
        }}
      >
        充值 {picked} 技能币
      </Button>
    </Sheet>
  )
}
