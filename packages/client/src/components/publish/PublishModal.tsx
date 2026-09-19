import {
  TIERS,
  clampCoins,
  getTier,
  retuneCoins,
  type CertificationTier,
  type ProofFile,
  type TeachingMode,
} from '@skillswap/shared'
import { Crown, Loader2, Paperclip, Sparkles, X } from 'lucide-react'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { ApiError, generateOutline } from '../../lib/api'
import { useLlmStatus } from '../../lib/useLlmStatus'
import { Button } from '../ui/Button'
import { Coin } from '../ui/Coin'
import { Sheet } from '../ui/Sheet'
import { SkillChip } from '../ui/SkillChip'

export interface CourseDraft {
  skillId: string
  title: string
  outline: string
  tier: CertificationTier
  coinsPerHour: number
  mode: TeachingMode
  proofFiles?: ProofFile[]
  interviewAt?: string
}

interface Props {
  open: boolean
  onClose: () => void
  /** 用户已掌握、可作为课程关联的技能 */
  teachSkillIds: string[]
  onSubmit: (draft: CourseDraft) => void
}

/**
 * 发布课程。
 * 三级认证的差异必须在这一个表单里说清楚：选了哪一级，下方立刻长出该级要求的材料，
 * 而不是提交后被打回来才知道缺什么。
 */
export function PublishModal({ open, onClose, teachSkillIds, onSubmit }: Props) {
  const [skillId, setSkillId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [outline, setOutline] = useState('')
  const [tier, setTier] = useState<CertificationTier>('novice')
  const [coins, setCoins] = useState(getTier('novice').suggestedCoinsPerHour)
  const [mode, setMode] = useState<TeachingMode>('online')
  const [proofFiles, setProofFiles] = useState<ProofFile[]>([])
  const [wantsInterview, setWantsInterview] = useState(false)
  const [interviewAt, setInterviewAt] = useState('')
  const [outlineLoading, setOutlineLoading] = useState(false)
  const [outlineError, setOutlineError] = useState<string | null>(null)

  const { llm, checked } = useLlmStatus()
  // 探测没回来之前先乐观放行，避免按钮闪一下禁用；真不可用时会由 503 报错兜住
  const llmReady = checked ? Boolean(llm?.configured) : true

  async function runOutline() {
    if (!skillId || !title.trim() || outlineLoading) return
    setOutlineLoading(true)
    setOutlineError(null)
    try {
      const res = await generateOutline({ skillId, title: title.trim(), level: tier, mode, userNote: outline })
      setOutline(res.outlineMarkdown)
    } catch (err) {
      setOutlineError(err instanceof ApiError ? err.message : '生成失败，请稍后重试')
    } finally {
      setOutlineLoading(false)
    }
  }

  const spec = getTier(tier)
  const proofOk = !spec.requiresProof || proofFiles.length > 0
  const interviewOk = !spec.requiresInterview || (wantsInterview && interviewAt !== '')
  const canSubmit = skillId !== null && title.trim().length > 0 && proofOk && interviewOk

  const blockedReason = !skillId
    ? '先选一个你要教的技能'
    : !title.trim()
      ? '再给课程写个标题'
      : !proofOk
        ? `${spec.label}级需要先上传凭证`
        : !interviewOk
          ? `${spec.label}级需要预约面试考核时间`
          : null

  function chooseTier(next: CertificationTier) {
    setTier(next)
    // 换等级必须同时把价格挪回新区间，否则会出现「小白级挂着 80 币」的非法状态
    setCoins((c) => retuneCoins(next, c))
    // 降到不需要材料的等级时，把上一级填的东西清掉，避免误提交
    if (!getTier(next).requiresProof) {
      setProofFiles([])
      setWantsInterview(false)
      setInterviewAt('')
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="发布一个技能课程"
      hint="把你会的打包成课程，才会被正在找你的人发现"
      footer={
        <div>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!canSubmit}
            onClick={() => {
              if (!skillId) return
              onSubmit({
                skillId,
                title: title.trim(),
                outline: outline.trim(),
                tier,
                coinsPerHour: coins,
                mode,
                proofFiles: spec.requiresProof ? proofFiles : undefined,
                interviewAt: spec.requiresInterview ? interviewAt : undefined,
              })
            }}
          >
            {canSubmit ? '发布到集市' : blockedReason}
          </Button>
        </div>
      }
    >
      <Field label="关联技能" hint="从你已掌握并想教的技能里选">
        <div className="flex flex-wrap gap-2">
          {teachSkillIds.length ? (
            teachSkillIds.map((id) => (
              <SkillChip
                key={id}
                skillId={id}
                tone="teach"
                selected={skillId === id}
                onToggle={() => setSkillId(skillId === id ? null : id)}
              />
            ))
          ) : (
            <p className="text-[12.5px] text-ink-faint">你还没有登记任何能教的技能。</p>
          )}
        </div>
      </Field>

      <Field label="课程标题">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例：零基础弹唱第一课：四个和弦弹完一首歌"
          aria-label="课程标题"
          className="w-full rounded-2xl border border-hairline bg-shell px-3.5 py-3 text-[14px] text-ink placeholder:text-ink-faint focus:border-coral/50 focus:outline-none"
        />
      </Field>

      <Field
        label="交付大纲"
        action={
          <button
            type="button"
            aria-label="用 AI 生成大纲"
            disabled={!skillId || !title.trim() || outlineLoading || !llmReady}
            onClick={runOutline}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors duration-150 ${
              !skillId || !title.trim() || !llmReady
                ? 'bg-cream text-ink-faint'
                : 'bg-coral/10 text-coral-deep active:bg-coral/16'
            }`}
          >
            {outlineLoading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Sparkles size={12} strokeWidth={2.4} />
            )}
            {outlineLoading ? '生成中…' : 'AI 生成'}
          </button>
        }
      >
        <textarea
          rows={4}
          value={outline}
          onChange={(e) => setOutline(e.target.value)}
          placeholder={
            !skillId || !title.trim()
              ? '先选技能并写上标题，就能用 AI 生成一版大纲'
              : '写下你会怎么教，或点右上角让 AI 起一版草稿'
          }
          aria-label="交付大纲"
          className="w-full resize-none rounded-2xl border border-hairline bg-shell px-3.5 py-3 text-[14px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-coral/50 focus:outline-none"
        />
        {outlineError && (
          <p className="mt-2 rounded-xl bg-coral/8 px-3 py-2 text-[12.5px] text-coral-deep">
            {outlineError}
          </p>
        )}
        {!llmReady && !outlineError && (
          <p className="mt-2 text-[11.5px] text-ink-faint">
            服务端未配置 DEEPSEEK_API_KEY，AI 生成暂不可用，手写大纲即可。
          </p>
        )}
      </Field>

      <Field label="认证等级" hint="等级决定你要交给平台的凭证，也决定定价权">
        <div className="flex flex-col gap-2">
          {TIERS.map((t) => {
            const active = tier === t.id
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={active}
                aria-label={`认证等级：${t.label}`}
                onClick={() => chooseTier(t.id)}
                className={`rounded-2xl border p-3.5 text-left transition-colors duration-150 ${
                  active ? 'border-coral/45 bg-coral/6' : 'border-hairline bg-shell'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-ink">{t.label}</span>
                  <span className="text-[11.5px] text-ink-faint">{t.levelLabel}</span>
                  {t.id === 'elite' && <Crown size={13} className="text-coin" strokeWidth={2.4} />}
                  <span className="ml-auto text-[11.5px] text-ink-faint">
                    {t.minCoinsPerHour}–{t.maxCoinsPerHour} 币/时
                  </span>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">{t.positioning}</p>
              </button>
            )
          })}
        </div>
      </Field>

      {/* 熟练级及以上才要求凭证；选到那一级就立刻把上传区露出来 */}
      {spec.requiresProof && (
        <Field label="资质凭证" hint="职业资格证、考级证书、作品集链接或代码仓库">
          <label
            className={`flex cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed px-4 py-4 transition-colors ${
              proofOk ? 'border-hairline bg-shell' : 'border-coral/45 bg-coral/6'
            }`}
          >
            <Paperclip size={16} className="text-ink-soft" strokeWidth={2.2} />
            <span className="text-[13px] text-ink-soft">
              {proofOk ? '继续添加材料' : `上传材料后才能发布${spec.label}级课程`}
            </span>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              aria-label="上传资质凭证"
              className="hidden"
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []).map((f) => ({
                  name: f.name,
                  size: f.size,
                }))
                if (picked.length) setProofFiles((prev) => [...prev, ...picked])
                e.target.value = ''
              }}
            />
          </label>

          {proofFiles.length > 0 && (
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {proofFiles.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{f.name}</span>
                  <span className="num shrink-0 text-[11px] text-ink-faint">
                    {Math.max(1, Math.round(f.size / 1024))} KB
                  </span>
                  <button
                    type="button"
                    aria-label={`移除材料 ${f.name}`}
                    onClick={() => setProofFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="shrink-0 text-ink-faint"
                  >
                    <X size={13} strokeWidth={2.6} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Field>
      )}

      {/* 精英级额外要一道平台面试，预约时间必须一起交上来 */}
      {spec.requiresInterview && (
        <Field label="精英考核" hint="通过运营 1 对 1 面试后点亮金牌导师认证">
          <label className="flex items-center gap-2.5 rounded-2xl border border-hairline bg-shell px-4 py-3.5">
            <input
              type="checkbox"
              checked={wantsInterview}
              aria-label="申请精英考核"
              onChange={(e) => setWantsInterview(e.target.checked)}
              className="size-4 accent-[#FF6B4A]"
            />
            <span className="text-[13px] text-ink">申请精英考核</span>
          </label>

          {wantsInterview && (
            <div className="mt-2.5">
              <label className="block text-[12px] text-ink-soft">预约面试时间</label>
              <input
                type="datetime-local"
                value={interviewAt}
                aria-label="预约面试时间"
                onChange={(e) => setInterviewAt(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-hairline bg-shell px-3.5 py-3 text-[14px] text-ink focus:border-coral/50 focus:outline-none"
              />
            </div>
          )}
        </Field>
      )}

      <Field
        label="定价"
        hint={`${spec.label}级的合法区间是 ${spec.minCoinsPerHour}–${spec.maxCoinsPerHour} 币/小时`}
      >
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={spec.minCoinsPerHour}
            max={spec.maxCoinsPerHour}
            value={coins}
            aria-label="每课时技能币定价"
            onChange={(e) => setCoins(clampCoins(tier, Number(e.target.value)))}
            className="range flex-1"
            style={
              {
                '--fill': `${((coins - spec.minCoinsPerHour) / (spec.maxCoinsPerHour - spec.minCoinsPerHour)) * 100}%`,
              } as CSSProperties
            }
          />
          <span className="flex items-baseline gap-1">
            <Coin value={coins} size="md" />
            <span className="text-[11.5px] text-ink-soft">/时</span>
          </span>
        </div>
      </Field>

      <Field label="授课方式">
        <div className="flex gap-2">
          {(
            [
              ['online', '线上会议'],
              ['offline', '同城线下'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
              className={`flex-1 rounded-2xl border py-3 text-[13px] transition-colors duration-150 ${
                mode === id
                  ? 'border-coral/45 bg-coral/10 font-medium text-coral-deep'
                  : 'border-hairline bg-shell text-ink-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>
    </Sheet>
  )
}

function Field({
  label,
  hint,
  action,
  children,
}: {
  label: string
  hint?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        {action}
      </div>
      {hint && <p className="mb-2 text-[11.5px] text-ink-faint">{hint}</p>}
      {children}
    </div>
  )
}
