import { getSkill, recommendWantSkills } from '@skillswap/shared'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'
import { ResumeImport } from './ResumeImport'
import { SkillPicker } from './SkillPicker'

const AVATARS = ['🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐙', '🦉', '🐳', '🦩', '🌻']
const ROLE_TAGS = ['在校学生', '职场新人', '自由职业者', '斜杠青年']

interface Props {
  open: boolean
  onComplete: (payload: {
    nickname: string
    avatar: string
    roleTag: string
    bio: string
    teachSkillIds: string[]
    wantSkillIds: string[]
  }) => void
}

export function OnboardingModal({ open, onComplete }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const [avatar, setAvatar] = useState(AVATARS[0])
  const [nickname, setNickname] = useState('')
  const [roleTag, setRoleTag] = useState(ROLE_TAGS[0])
  const [bio, setBio] = useState('')

  const [teachSkillIds, setTeachSkillIds] = useState<string[]>([])
  const [wantSkillIds, setWantSkillIds] = useState<string[]>([])

  const toggleTeach = (id: string) =>
    setTeachSkillIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const toggleWant = (id: string) =>
    setWantSkillIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const recommendations = recommendWantSkills(teachSkillIds)

  const canAdvance =
    step === 1 ? nickname.trim().length > 0 : step === 2 ? teachSkillIds.length > 0 : wantSkillIds.length > 0

  const meta = {
    1: { title: '初见 · 你是谁', hint: '开始交换前，先让我们认识独特的你' },
    2: { title: '能力 · 我会什么', hint: '展示你的闪光点，每个人都有能教会别人的事情' },
    3: { title: '心愿 · 你想收获什么', hint: '最最重要的——我们希望你收获成长' },
  }[step]

  return (
    <Sheet
      open={open}
      onClose={() => {}}
      title={meta.title}
      hint={meta.hint}
      fullscreen
      dismissible={false}
      footer={
        <div className="flex items-center gap-3">
          {step > 1 && (
            <Button variant="ghost" size="lg" onClick={() => setStep((s) => (s === 3 ? 2 : 1))}>
              上一步
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            disabled={!canAdvance}
            onClick={() => {
              if (step < 3) return setStep((s) => (s === 1 ? 2 : 3))
              onComplete({
                nickname: nickname.trim(),
                avatar,
                roleTag,
                bio: bio.trim(),
                teachSkillIds,
                wantSkillIds,
              })
            }}
          >
            {step === 1 ? '下一步：点亮我的技能库' : step === 2 ? '下一步：挑选我的心愿' : '开启技能互换之旅'}
          </Button>
        </div>
      }
    >
      <Progress step={step} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <Field label="头像" hint="挑一个顺眼的，之后随时能换">
                <div className="flex flex-wrap gap-2.5">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      aria-label={`选择头像 ${a}`}
                      aria-pressed={avatar === a}
                      onClick={() => setAvatar(a)}
                      className={`grid size-12 place-items-center rounded-full text-2xl transition-all duration-150 ${
                        avatar === a
                          ? 'bg-coral/12 ring-2 ring-coral'
                          : 'bg-cream-deep/60 ring-1 ring-transparent'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="昵称" hint={`${nickname.length} / 12`}>
                <input
                  type="text"
                  value={nickname}
                  maxLength={12}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="别人会这样称呼你"
                  aria-label="昵称"
                  className="w-full rounded-2xl border border-hairline bg-shell px-3.5 py-3 text-[15px] text-ink placeholder:text-ink-faint focus:border-coral/50 focus:outline-none"
                />
              </Field>

              <Field label="身份标签">
                <div className="flex flex-wrap gap-2">
                  {ROLE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={roleTag === tag}
                      onClick={() => setRoleTag(tag)}
                      className={`rounded-full border px-3.5 py-2 text-[13px] transition-colors duration-150 ${
                        roleTag === tag
                          ? 'border-transparent bg-coral font-medium text-white'
                          : 'border-hairline bg-shell text-ink-soft'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="一句话签名" hint="选填">
                <input
                  type="text"
                  value={bio}
                  maxLength={40}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="例：想用吉他换一切编程技能"
                  aria-label="一句话签名"
                  className="w-full rounded-2xl border border-hairline bg-shell px-3.5 py-3 text-[14px] text-ink placeholder:text-ink-faint focus:border-coral/50 focus:outline-none"
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div>
              <ResumeImport
                onParsed={(ids) =>
                  // 合并而不是覆盖：用户可以先用 AI 打底，再手动补几项
                  setTeachSkillIds((prev) => [...new Set([...prev, ...ids])])
                }
              />
              <SkillPicker
                selectedIds={teachSkillIds}
                onToggle={toggleTeach}
                tone="teach"
                searchPlaceholder="搜你会的技能，比如「吉他」「SQL」"
              />
              <SelectedBar ids={teachSkillIds} emptyHint="至少选一项你愿意教别人的技能" />
            </div>
          )}

          {step === 3 && (
            <div>
              {recommendations.length > 0 && (
                <section className="mb-5">
                  <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-ink-soft">
                    <Sparkles size={13} strokeWidth={2.4} className="text-coral" />
                    大家都在学的 Top {recommendations.length}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={wantSkillIds.includes(s.id)}
                        aria-label={`心愿推荐：${s.label}`}
                        onClick={() => toggleWant(s.id)}
                        /* 只让最热的一项呼吸：八张卡一起脉动等于没有重点 */
                        className={`${i === 0 ? 'breathe' : ''} rounded-2xl border px-3.5 py-2.5 text-left text-[13px] transition-colors duration-150 ${
                          wantSkillIds.includes(s.id)
                            ? 'border-coral/45 bg-coral/12 font-medium text-coral-deep'
                            : 'border-hairline bg-shell text-ink'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <SkillPicker
                selectedIds={wantSkillIds}
                onToggle={toggleWant}
                tone="want"
                excludeIds={teachSkillIds}
                searchPlaceholder="还想学什么？搜一搜"
              />
              <SelectedBar ids={wantSkillIds} emptyHint="至少选一项你这次想学的技能" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Sheet>
  )
}

function Progress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-5 flex items-center gap-2" aria-label={`引导进度 ${step} / 3`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
            i <= step ? 'bg-coral' : 'bg-hairline'
          }`}
        />
      ))}
      <span className="num ml-1 text-[11px] text-ink-faint">{step} / 3</span>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        {hint && <span className="text-[11px] text-ink-faint">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

/**
 * 已选概况。
 * 刻意只渲染文字而不是再来一遍 chips：上方列表里已勾选项本来就是珊瑚色带对勾的，
 * 再摆一份可点的芯片既重复，也让人分不清该在哪一处取消。
 */
function SelectedBar({ ids, emptyHint }: { ids: string[]; emptyHint: string }) {
  return (
    <div className="mt-5 rounded-2xl bg-cream px-3.5 py-3">
      {ids.length ? (
        <>
          <span className="text-[12px] text-ink-soft">
            已选 <span className="num font-semibold text-ink">{ids.length}</span> 项
          </span>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink">
            {ids.map((id) => getSkill(id)?.label ?? id).join('、')}
          </p>
        </>
      ) : (
        <p className="text-[12.5px] text-ink-faint">{emptyHint}</p>
      )}
    </div>
  )
}
