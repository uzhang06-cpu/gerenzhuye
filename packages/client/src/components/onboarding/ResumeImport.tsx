import { sanitizeSkillIds } from '@skillswap/shared'
import { FileUp, Loader2, Sparkles } from 'lucide-react'
import { useState, type DragEvent } from 'react'
import { ApiError, extractText, parseSkills } from '../../lib/api'
import { useLlmStatus } from '../../lib/useLlmStatus'
import { Button } from '../ui/Button'

interface Props {
  /** 拿到的是已经过服务端白名单过滤的合法 id */
  onParsed: (skillIds: string[]) => void
}

/**
 * 快速导入：文件或粘贴 → 自动点亮技能。
 *
 * 上传与解析刻意分成两步：先拿到纯文本让用户过目、改掉乱码，再交给模型分类。
 * 扫描件提不出文字时也不是死路，直接在手写区粘贴即可。
 * 服务端没有 key 时整块收起来 —— 这时候它剩下的唯一价值只是把文件内容显示出来，
 * 不如直接告诉用户手动选。
 */
export function ResumeImport({ onParsed }: Props) {
  const { llm, checked } = useLlmStatus()
  const [text, setText] = useState('')
  const [sourceName, setSourceName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ count: number; unmatched: string[]; mocked: boolean } | null>(null)

  if (checked && !llm?.configured) {
    return (
      <div className="mb-5 rounded-2xl border border-dashed border-hairline bg-shell/60 px-4 py-3.5">
        <p className="text-[12.5px] leading-relaxed text-ink-soft">
          AI 自动导入当前不可用（服务端未配置 DEEPSEEK_API_KEY）。直接手动勾选下面的技能就行，不影响使用。
        </p>
      </div>
    )
  }

  async function upload(file: File) {
    setUploading(true)
    setError(null)
    setDone(null)
    try {
      const res = await extractText(file)
      if (res.scanned) {
        setError('这个文件里几乎提取不到文字，多半是扫描件或图片。请直接把手打的内容粘贴到下面的输入框。')
        return
      }
      setText(res.text)
      setSourceName(res.filename)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '读取文件失败，请改用粘贴文本')
    } finally {
      setUploading(false)
    }
  }

  async function run() {
    if (!text.trim() || loading) return
    setLoading(true)
    setError(null)
    setDone(null)
    try {
      const res = await parseSkills(text)
      // 服务端已经过滤过一遍白名单，这里再过一次是廉价的纵深防御：
      // 保证就算服务端被换成一个会返回任意 id 的实现，前端也不会渲染出库外的技能
      const ids = sanitizeSkillIds(res.skills.map((s) => s.id))
      onParsed(ids)
      setDone({ count: ids.length, unmatched: res.unmatched, mocked: Boolean(res.mocked) })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '解析失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void upload(file)
  }

  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkles size={13} strokeWidth={2.4} className="text-coral" />
        <span className="text-[13px] font-medium text-ink">快速导入</span>
        <span className="text-[11.5px] text-ink-faint">选填 · 上传简历或直接粘贴</span>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer items-center gap-2.5 rounded-2xl border border-dashed px-4 py-3.5 transition-colors duration-150 ${
          dragging ? 'border-coral/60 bg-coral/8' : 'border-hairline bg-shell'
        }`}
      >
        {uploading ? (
          <Loader2 size={16} className="animate-spin text-ink-soft" />
        ) : (
          <FileUp size={16} className="text-ink-soft" strokeWidth={2.2} />
        )}
        <span className="text-[13px] text-ink-soft">
          {uploading ? '正在读取文件…' : '拖一份 PDF / Word 进来，或点击选择'}
        </span>
        <input
          type="file"
          accept=".pdf,.docx"
          aria-label="上传简历文件"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void upload(file)
            e.target.value = ''
          }}
        />
      </label>

      {sourceName && !error && (
        <p className="mt-2 text-[11.5px] text-ink-faint">
          已从 {sourceName} 读取，下面是提取出来的文字，可以直接改。
        </p>
      )}

      <textarea
        rows={4}
        value={text}
        aria-label="简历或自我介绍文本"
        onChange={(e) => {
          setText(e.target.value)
          setSourceName(null)
        }}
        placeholder="也可以直接在这里粘贴：例「做后端三年，主要写 Python 爬虫和数据处理，业余弹了五年吉他。」"
        className="mt-2.5 w-full resize-none rounded-2xl border border-hairline bg-shell px-3.5 py-3 text-[13.5px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-coral/50 focus:outline-none"
      />

      <div className="mt-2 flex items-center gap-2">
        <Button variant="soft" onClick={run} disabled={!text.trim() || loading} aria-label="解析并自动勾选技能">
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              正在解析…
            </>
          ) : (
            '解析并自动勾选'
          )}
        </Button>
        {done?.mocked && <span className="text-[11px] text-ink-faint">模拟数据（未调真实模型）</span>}
      </div>

      {error && (
        <p className="mt-2 rounded-xl bg-coral/8 px-3 py-2 text-[12.5px] leading-relaxed text-coral-deep">
          {error}
        </p>
      )}

      {done && (
        <div className="mt-2 rounded-xl bg-cream px-3 py-2.5">
          <p className="text-[12.5px] text-ink">
            {done.count > 0
              ? `已按识别结果自动勾选 ${done.count} 项，下面可以再手动增减。`
              : '这段话里没有能对应到技能库的内容，请手动勾选。'}
          </p>
          {done.unmatched.length > 0 && (
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-faint">
              技能库里还没有：{done.unmatched.join('、')}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
