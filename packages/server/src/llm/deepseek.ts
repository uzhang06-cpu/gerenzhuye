import { config } from '../config'

export type LlmErrorCode = 'LLM_UPSTREAM' | 'LLM_EMPTY'

export class LlmError extends Error {
  constructor(
    public code: LlmErrorCode,
    message: string,
  ) {
    super(message)
  }
}

interface ChatOptions {
  system: string
  user: string
  temperature?: number
  maxTokens?: number
  /** 开启 JSON 输出模式；prompt 里必须出现 "json" 字样，否则 DeepSeek 会报错 */
  json?: boolean
}

/**
 * DeepSeek 的 OpenAI 兼容接口。
 * 直接用 fetch 而不是引 SDK：只有一个端点，省一个依赖。
 */
export async function chat(opts: ChatOptions): Promise<string> {
  const body: Record<string, unknown> = {
    model: config.model,
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 1500,
    stream: false,
  }
  if (opts.json) body.response_format = { type: 'json_object' }

  let res: Response
  try {
    res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.timeoutMs),
    })
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    throw new LlmError('LLM_UPSTREAM', `连不上 DeepSeek（${config.baseUrl}）：${reason}`)
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new LlmError(
      'LLM_UPSTREAM',
      `DeepSeek 返回 ${res.status}${detail ? `：${detail.slice(0, 200)}` : ''}`,
    )
  }

  const data = (await res.json().catch(() => null)) as {
    choices?: { message?: { content?: unknown } }[]
  } | null

  const content = data?.choices?.[0]?.message?.content
  // 官方文档明确承认偶发返回空内容，这里必须当成一种正常失败来处理
  if (typeof content !== 'string' || !content.trim()) {
    throw new LlmError('LLM_EMPTY', '模型返回了空内容，请重试')
  }
  return content
}

/** 启动时打印账号下真实可用的模型，避免模型名猜错却只有运行时才暴露 */
export async function logAvailableModels(log: {
  info: (msg: string) => void
  warn: (msg: string) => void
}): Promise<void> {
  if (config.mock) {
    log.info('MOCK_LLM=1，跳过模型列表探测（整条 AI 链路走本地模拟）')
    return
  }
  if (!config.apiKey) {
    log.warn('未配置 DEEPSEEK_API_KEY，AI 接口将返回 503')
    return
  }
  try {
    const res = await fetch(`${config.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return log.warn(`探测模型列表失败：HTTP ${res.status}`)
    const data = (await res.json()) as { data?: { id?: string }[] }
    const ids = (data.data ?? []).map((m) => m.id).filter(Boolean)
    log.info(`账号可用模型：${ids.join(', ') || '(空)'}；当前使用 ${config.model}`)
    if (ids.length && !ids.includes(config.model)) {
      log.warn(`注意：当前配置的 DEEPSEEK_MODEL=${config.model} 不在可用列表里，请改 .env`)
    }
  } catch {
    log.warn('探测模型列表超时，跳过')
  }
}
