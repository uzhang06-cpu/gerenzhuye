import { ALL_SKILLS, isValidSkillId, type ParsedSkill } from '@skillswap/shared'

/**
 * 这里才是受限分类真正的强制点。
 * response_format 只是「建议」，prompt 里的规则只是「请求」——模型都可能不遵守。
 * 只有把返回结果逐条过白名单，才能保证落到前端的 id 一定存在于分类库。
 */

/** 模型偶尔会包 ```json 围栏，或在 JSON 前后加解释文字，这里把对象抠出来 */
export function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1] ?? raw
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(candidate.slice(start, end + 1))
  } catch {
    return null
  }
}

const MAX_SKILLS = 8
const MAX_UNMATCHED = 6
const MAX_EVIDENCE = 120

export interface SanitizedParse {
  skills: ParsedSkill[]
  unmatched: string[]
  /** 模型给出的 id 里被白名单丢掉了几个，仅用于日志与自检 */
  droppedIds: string[]
}

export function sanitizeParsedSkills(payload: unknown): SanitizedParse {
  const empty: SanitizedParse = { skills: [], unmatched: [], droppedIds: [] }
  if (!payload || typeof payload !== 'object') return empty

  const raw = payload as { skills?: unknown; unmatched?: unknown }
  const byId = new Map<string, ParsedSkill>()
  const droppedIds: string[] = []

  if (Array.isArray(raw.skills)) {
    for (const item of raw.skills) {
      if (!item || typeof item !== 'object') continue
      const { id, confidence, evidence } = item as Record<string, unknown>

      if (!isValidSkillId(id)) {
        if (typeof id === 'string' && id.trim()) droppedIds.push(id.trim())
        continue
      }
      // 同一个 id 出现多次时保留置信度更高的那条
      const prev = byId.get(id)
      const conf = typeof confidence === 'number' && Number.isFinite(confidence) ? confidence : 0.5
      const clamped = Math.min(1, Math.max(0, conf))
      if (prev && prev.confidence >= clamped) continue

      byId.set(id, {
        id,
        confidence: clamped,
        evidence:
          typeof evidence === 'string' && evidence.trim()
            ? evidence.trim().slice(0, MAX_EVIDENCE)
            : '',
      })
    }
  }

  const skills = [...byId.values()]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_SKILLS)

  const unmatched: string[] = []
  if (Array.isArray(raw.unmatched)) {
    for (const item of raw.unmatched) {
      if (typeof item !== 'string') continue
      const s = item.trim().slice(0, 40)
      if (s && !unmatched.includes(s)) unmatched.push(s)
      if (unmatched.length >= MAX_UNMATCHED) break
    }
  }

  return { skills, unmatched, droppedIds }
}

/** 兜底提示词里要用到的 id 全集 */
export const ALL_SKILL_IDS: string[] = ALL_SKILLS.map((s) => s.id)
