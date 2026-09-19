/**
 * 契合度算法。
 *
 * 刻意不调 LLM：分数要即时出现在卡片上、同输入永远同输出（刷新一次数字就变的
 * 匹配度会立刻失去可信度），而且这一步没有语义理解的需求，纯粹是集合重叠。
 */

/** FNV-1a，用来给分数加一点可复现的抖动，避免所有卡片都是同一个整数。 */
function stableHash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export interface MatchScoreInput {
  /** 我能教的技能 id 列表 */
  myTeachSkillIds: readonly string[]
  /** 我想学的技能 id 列表 */
  myWantSkillIds: readonly string[]
  /** 对方能教、且是我心愿清单里的技能 */
  theirTeachSkillId: string
  /** 对方想学、且在我能力范围内的技能 */
  theirWantSkillId: string
  /** 对方 id，仅用于抖动，保证同一对用户分数稳定 */
  partnerId: string
}

/**
 * 双向互补的加权：
 * - 对方能教的是我想学的（我获益）
 * - 对方想学的是我能教的（我付出）
 *
 * 权重刻意留出天花板：任何双向匹配都会落进 86–94 这一带，再由稳定哈希拉开差距。
 * 若让双向匹配一律顶到 99，这个数字就不再区分任何两个人，卡片上的百分比会立刻显得是编的。
 */
export function computeMatchScore(input: MatchScoreInput): number {
  const want = new Set(input.myWantSkillIds)
  const teach = new Set(input.myTeachSkillIds)

  const iLearn = want.has(input.theirTeachSkillId)
  const iTeach = teach.has(input.theirWantSkillId)

  let score = 62
  if (iLearn) score += 12
  if (iTeach) score += 10
  if (iLearn && iTeach) score += 2

  score += stableHash(`${input.partnerId}:${input.theirTeachSkillId}`) % 9

  return Math.max(0, Math.min(99, score))
}

/** 分数对应的措辞，供卡片使用。分档与上面的落点对齐。 */
export function matchScoreLabel(score: number): string {
  if (score >= 86) return '双向互补'
  if (score >= 76) return '高度契合'
  if (score >= 68) return '值得一试'
  return '可先聊聊'
}
