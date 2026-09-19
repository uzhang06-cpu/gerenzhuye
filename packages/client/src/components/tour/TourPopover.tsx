import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'

export interface TourStep {
  /** 对应导航键上的 data-tour 值 */
  key: string
  title: string
  body: string
  /** 末步的行动催化，点完直接进发布流程 */
  cta?: { label: string; onClick: () => void }
}

interface Props {
  steps: TourStep[]
  open: boolean
  onFinish: () => void
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

/**
 * 新手漫游。
 *
 * 用一个巨大的 box-shadow 把高亮框以外的区域压暗，而不是铺一层遮罩再挖洞 ——
 * 后者要处理圆角与坐标换算，前者只要一个矩形。
 * 坐标相对手机壳计算，桌面端才会跟着壳体走而不是贴到窗口上。
 */
export function TourPopover({ steps, open, onFinish }: Props) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)

  const step = steps[index]

  /*
   * 刻意不写「open 变化时重置 index」的 effect：
   * 漫游一个用户只会走一次（走完 tourDone 就置位），组件生命周期内 open 只由 false 变 true 一次，
   * index 的初值 0 一直有效。加那个 effect 只会多一轮渲染。
   */
  useEffect(() => {
    if (!open || !step) return

    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.key}"]`)
      const shell = document.querySelector('.app-shell')
      if (!el || !shell) return setRect(null)
      const e = el.getBoundingClientRect()
      const s = shell.getBoundingClientRect()
      setRect({ top: e.top - s.top, left: e.left - s.left, width: e.width, height: e.height })
    }

    measure()
    // 字体加载完、窗口尺寸变化都会让测量结果失效，统一重测
    window.addEventListener('resize', measure)
    const raf = requestAnimationFrame(measure)
    return () => {
      window.removeEventListener('resize', measure)
      cancelAnimationFrame(raf)
    }
  }, [open, step])

  if (!open || !step) return null

  const PAD = 8
  const spotlight = rect && {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  }

  return (
    <div className="absolute inset-0 z-40" role="dialog" aria-modal="true" aria-label="新手漫游指引">
      {spotlight && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute rounded-2xl"
          initial={false}
          animate={spotlight}
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          style={{
            boxShadow: '0 0 0 9999px rgba(58, 32, 22, 0.62), 0 0 0 2px rgba(255,107,74,.9) inset',
          }}
        />
      )}

      {/* 高亮框以外全部拦截点击，避免用户误触到别的功能 */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="absolute right-4 left-4"
          style={{ bottom: spotlight ? `calc(100% - ${spotlight.top}px + 16px)` : 120 }}
        >
          <div className="rounded-card bg-shell p-5 shadow-lift">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="num text-[11px] text-ink-faint">
                {index + 1} / {steps.length}
              </span>
              <h3 className="text-[15px] font-semibold text-ink">{step.title}</h3>
            </div>
            <p className="text-[13px] leading-relaxed text-ink-soft">{step.body}</p>

            <div className="mt-4 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onFinish}
                className="text-[13px] text-ink-faint underline-offset-4 hover:underline"
              >
                跳过
              </button>
              <span className="flex-1" />
              {index > 0 && (
                <Button variant="ghost" onClick={() => setIndex((i) => i - 1)}>
                  上一步
                </Button>
              )}
              {step.cta ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    onFinish()
                    step.cta?.onClick()
                  }}
                >
                  {step.cta.label}
                </Button>
              ) : (
                <Button variant="primary" onClick={() => setIndex((i) => i + 1)}>
                  下一步
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
