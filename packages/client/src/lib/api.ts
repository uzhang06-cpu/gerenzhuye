import type {
  ApiErrorBody,
  ExtractTextResponse,
  GenerateOutlineRequest,
  GenerateOutlineResponse,
  HealthResponse,
  ParseSkillsResponse,
} from '@skillswap/shared'

export class ApiError extends Error {
  constructor(
    public code: ApiErrorBody['code'] | 'NETWORK',
    message: string,
  ) {
    super(message)
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiError('NETWORK', '连不上服务端，请确认后端已启动')
  }

  const data = (await res.json().catch(() => null)) as unknown
  if (!res.ok) {
    const err = data as ApiErrorBody | null
    throw new ApiError(err?.code ?? 'NETWORK', err?.message ?? `请求失败（HTTP ${res.status}）`)
  }
  return data as T
}

/** 把自由文本交给服务端做受限分类；返回的 id 已经过服务端白名单过滤 */
export function parseSkills(text: string) {
  return post<ParseSkillsResponse>('/api/llm/parse-skills', { text })
}

export function generateOutline(req: GenerateOutlineRequest) {
  return post<GenerateOutlineResponse>('/api/llm/generate-outline', req)
}

/** 上传简历文件换回纯文本。走 multipart，不能用上面那个 JSON 版 post。 */
export async function extractText(file: File): Promise<ExtractTextResponse> {
  const form = new FormData()
  form.append('file', file)

  let res: Response
  try {
    res = await fetch('/api/extract-text', { method: 'POST', body: form })
  } catch {
    throw new ApiError('NETWORK', '连不上服务端，请确认后端已启动')
  }

  const data = (await res.json().catch(() => null)) as unknown
  if (!res.ok) {
    const err = data as ApiErrorBody | null
    throw new ApiError(err?.code ?? 'NETWORK', err?.message ?? `上传失败（HTTP ${res.status}）`)
  }
  return data as ExtractTextResponse
}

export async function fetchHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch('/api/health')
    if (!res.ok) return null
    return (await res.json()) as HealthResponse
  } catch {
    // 后端没起或代理不通时静默降级，AI 入口会自己隐藏
    return null
  }
}
