import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  /** 标题右侧的补充说明，比如「1/3」 */
  hint?: ReactNode
  children: ReactNode
  /** 底部固定操作区，不随内容滚动 */
  footer?: ReactNode
  /** 全屏弹窗用于引导漏斗，底部弹层用于发布/充值这类局部操作 */
  fullscreen?: boolean
  /** 引导漏斗这类必须走完的流程要设成 false：不给关闭键，遮罩与 Esc 也不响应 */
  dismissible?: boolean
}

/**
 * 底部弹层 / 全屏弹窗。
 * 背板模糊是本产品的统一手法，引导漏斗和局部操作共用同一个壳，动效才不会各说各话。
 */
export function Sheet({
  open,
  onClose,
  title,
  hint,
  children,
  footer,
  fullscreen = false,
  dismissible = true,
}: Props) {
  useEffect(() => {
    if (!open || !dismissible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, dismissible])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          /* 用 absolute 而非 fixed：弹层必须被约束在手机壳内，否则桌面端会跑到窗口底部去 */
          className="absolute inset-0 z-50 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* 遮罩用 div 而非 button：键盘用户走 Esc，无障碍用户走「关闭弹窗」，
              两个同名按钮只会让读屏和自动化都分不清该点哪个 */}
          <div
            aria-hidden="true"
            onClick={dismissible ? onClose : undefined}
            className="absolute inset-0 cursor-default"
            style={{ background: 'rgba(58, 32, 22, 0.42)', backdropFilter: 'blur(6px)' }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: fullscreen ? 24 : 320, opacity: fullscreen ? 0 : 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: fullscreen ? 24 : 320, opacity: fullscreen ? 0 : 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className={`relative mt-auto flex w-full max-w-[430px] flex-col bg-cream ${
              fullscreen
                ? 'h-full rounded-none sm:h-[calc(100%-0px)]'
                : 'max-h-[88%] rounded-t-[28px] shadow-[0_-20px_50px_-20px_rgba(90,40,20,.4)]'
            }`}
          >
            <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
              <div>
                <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
                {hint && <div className="mt-1 text-[13px] text-ink-soft">{hint}</div>}
              </div>
              {dismissible && (
                <button
                  type="button"
                  aria-label="关闭弹窗"
                  onClick={onClose}
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-ink/5 text-ink-soft transition-colors hover:bg-ink/10"
                >
                  <X size={16} strokeWidth={2.4} />
                </button>
              )}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>

            {footer && (
              <div className="border-t border-hairline px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
