import { Button } from './Button'

interface Props {
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
}

/** 空态不是情绪，是下一步该做什么。 */
export function EmptyState({ title, body, actionLabel, onAction }: Props) {
  return (
    <div className="mx-5 rounded-card border border-dashed border-hairline bg-shell/60 px-6 py-10 text-center">
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-[30ch] text-[13px] leading-relaxed text-ink-soft">{body}</p>
      {actionLabel && onAction && (
        <Button variant="soft" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
