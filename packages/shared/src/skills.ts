import { TAXONOMY, type Skill, type SkillCategory } from './taxonomy'

/** 扁平化的全部技能。 */
export const ALL_SKILLS: readonly Skill[] = TAXONOMY.flatMap((c) => c.skills)

/** id → Skill 索引，用于 O(1) 校验与回查。 */
export const SKILL_BY_ID: ReadonlyMap<string, Skill> = new Map(
  ALL_SKILLS.map((s) => [s.id, s]),
)

/** id → 所属一级分类，集市筛选与 chips 分组要用。 */
export const CATEGORY_BY_SKILL_ID: ReadonlyMap<string, SkillCategory> = new Map(
  TAXONOMY.flatMap((c) => c.skills.map((s) => [s.id, c] as const)),
)

export function getSkill(id: string): Skill | undefined {
  return SKILL_BY_ID.get(id)
}

export function getCategoryOfSkill(id: string): SkillCategory | undefined {
  return CATEGORY_BY_SKILL_ID.get(id)
}

/** 白名单校验 —— LLM 返回的 id 只有通过它才允许回给前端。 */
export function isValidSkillId(id: unknown): id is string {
  return typeof id === 'string' && SKILL_BY_ID.has(id)
}

/** 只保留合法 id，去重，保序。所有来自外部的 id 列表都要过这一关。 */
export function sanitizeSkillIds(ids: readonly unknown[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    if (isValidSkillId(id) && !seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
  }
  return out
}

function haystack(skill: Skill, category: SkillCategory): string {
  return [skill.label, skill.id, category.label, ...skill.aliases].join(' ').toLowerCase()
}

/**
 * 模糊检索：跨 label、id、一级分类名与别名做子串匹配。
 * 级联选择器检索、心愿清单检索、集市筛选共用同一实现。
 */
export function searchSkills(query: string, limit = 50): Skill[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...ALL_SKILLS].slice(0, limit)
  const out: Skill[] = []
  for (const category of TAXONOMY) {
    for (const skill of category.skills) {
      if (haystack(skill, category).includes(q)) out.push(skill)
      if (out.length >= limit) return out
    }
  }
  return out
}

/**
 * 未选技能时的默认推荐顺序（Step 3「大家都在学的 Top 10」）。
 * 手写顺序而非按标签长度算分，是为了让推荐结果稳定、可控。
 */
export const POPULAR_SKILL_IDS: readonly string[] = [
  'code.prompt',
  'design.video',
  'life.english',
  'code.python',
  'design.uiux',
  'life.fitness',
  'career.interview',
  'art.guitar',
  'code.data',
  'life.baking',
]

/**
 * 心愿推荐：热门序列里排除掉用户已掌握（Step 2 选过）的技能。
 * 派生自 POPULAR_SKILL_IDS，不额外维护数据。
 */
export function recommendWantSkills(teachSkillIds: readonly string[], limit = 10): Skill[] {
  const owned = new Set(sanitizeSkillIds(teachSkillIds))
  const out: Skill[] = []
  for (const id of POPULAR_SKILL_IDS) {
    if (owned.has(id)) continue
    const skill = SKILL_BY_ID.get(id)
    if (skill) out.push(skill)
    if (out.length >= limit) break
  }
  return out
}

/**
 * 序列化分类库给 LLM 做受限分类。
 * 每行一个技能，紧凑格式；id 与 isValidSkillId 校验的是同一批字符串。
 */
export function serializeTaxonomyForPrompt(): string {
  return TAXONOMY.map(
    (c) => `# ${c.label}\n` + c.skills.map((s) => `${s.id} | ${s.label} | ${s.aliases.join('/')}`).join('\n'),
  ).join('\n')
}
