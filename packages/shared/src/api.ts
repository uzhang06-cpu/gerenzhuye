import type { CertificationTier, TeachingMode } from './types'

/**
 * 前后端共用的 LLM 接口契约。
 * 前端只看得到这些类型，API key 永远不出现在浏览器侧。
 */

export interface ParseSkillsRequest {
  /** 简历或自我介绍的自由文本 */
  text: string
}

export interface ParsedSkill {
  /** 一定是分类库里存在的 id，服务端已用白名单过滤过 */
  id: string
  /** 0-1，模型自评的置信度 */
  confidence: number
  /** 模型给出这个判断的依据原文片段，方便用户核对 */
  evidence: string
}

export interface ParseSkillsResponse {
  skills: ParsedSkill[]
  /** 模型认为属于技能但不在这 20 项分类库里的说法，前端灰显展示 */
  unmatched: string[]
  model: string
  ms: number
  mocked?: boolean
}

export interface GenerateOutlineRequest {
  skillId: string
  title: string
  level: CertificationTier
  mode: TeachingMode
  /** 用户自己写的补充说明，可选 */
  userNote?: string
}

export interface GenerateOutlineResponse {
  outlineMarkdown: string
  model: string
  ms: number
  mocked?: boolean
}

export interface ExtractTextResponse {
  filename: string
  text: string
  chars: number
  /**
   * 提取到的文字少得不正常，多半是扫描件或图片型 PDF。
   * 这时不是报错，而是让前端提示改用手动粘贴 —— 用户得知道下一步该做什么。
   */
  scanned: boolean
}

export interface ApiErrorBody {
  code:
    | 'NO_API_KEY'
    | 'BAD_REQUEST'
    | 'LLM_INVALID'
    | 'LLM_UPSTREAM'
    | 'LLM_EMPTY'
    | 'UNSUPPORTED_FILE'
    | 'FILE_TOO_LARGE'
    | 'EXTRACT_FAILED'
  message: string
}

export interface HealthResponse {
  ok: boolean
  version: string
  uptime: number
  /** LLM 是否可用，前端据此决定要不要露出 AI 入口 */
  llm: {
    configured: boolean
    mocked: boolean
    model: string
  }
}
