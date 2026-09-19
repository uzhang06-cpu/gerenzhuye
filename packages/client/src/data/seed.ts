import {
  ALL_SKILLS,
  SIGNUP_BONUS_COINS,
  TIERS,
  getTier,
  type Bounty,
  type CoinTx,
  type Course,
  type Session,
  type SessionStatus,
  type SwapMatch,
  type TeachingMode,
  type UserProfile,
} from '@skillswap/shared'
import { MENTORS, SKILL_CONTENT } from './seedContent'

/**
 * 冷启动用的种子内容。
 *
 * 内容来自 seedContent.ts 里按技能组织的手写池，这里只负责补齐
 * 等级、定价、评分、时间这类可推导的字段。全部走确定性哈希 ——
 * 种子数据每次加载必须一模一样，否则匹配分数和列表顺序会来回跳。
 */

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const pick = <T>(arr: readonly T[], seed: number): T => arr[seed % arr.length]

/** 仅用于冷启动前展示的默认身份，引导做完后会被用户自己的选择覆盖 */
export const DEFAULT_PROFILE: UserProfile = {
  nickname: '林一',
  avatar: '🦊',
  roleTag: '自由职业者',
  bio: '想用编程换一切能动手的技能',
  teachSkillIds: ['code.python', 'code.prompt', 'design.uiux', 'career.interview'],
  wantSkillIds: ['art.guitar', 'life.english', 'design.video', 'design.photo'],
  tierBySkillId: { 'code.python': 'skilled', 'code.prompt': 'skilled', 'design.uiux': 'novice' },
}

const DAY = 86_400_000
const HOUR = 3_600_000
const NOW = Date.UTC(2026, 8, 19, 4, 0, 0)

// ─────────────────────────── 课程（60 门） ───────────────────────────

const COURSES: Course[] = []
let courseSeq = 0

ALL_SKILLS.forEach((skill, skillIdx) => {
  const content = SKILL_CONTENT[skill.id]
  if (!content) return

  content.courses.forEach(([title, outline], courseIdx) => {
    const seed = hash(`${skill.id}#${courseIdx}`)
    // 等级轮转，保证三档都有货；价格严格落在该档的合法区间内
    const tier = TIERS[(skillIdx + courseIdx) % TIERS.length].id
    const spec = getTier(tier)
    const span = spec.maxCoinsPerHour - spec.minCoinsPerHour
    const coinsPerHour = spec.minCoinsPerHour + (seed % (span + 1))
    const ratingCount = 5 + (seed % 180)
    // 乘 7 与 50 互质，前 50 门课正好把 50 位导师各用一次
    const mentor = MENTORS[(courseSeq * 7 + 6) % MENTORS.length]

    COURSES.push({
      id: `c-${skill.id}-${courseIdx}`,
      ownerId: `u-${mentor[0]}`,
      ownerName: mentor[0],
      ownerAvatar: mentor[1],
      skillId: skill.id,
      title,
      outline,
      mode: seed % 3 === 0 ? 'offline' : 'online',
      tier,
      coinsPerHour,
      rating: 0.9 + (seed % 10) / 100,
      ratingCount,
      sessionsDone: 4 + (seed % 160),
      createdAt: NOW - (seed % 30) * DAY,
      goldMentor: tier === 'elite' && seed % 3 === 0,
      proofFiles: tier === 'novice' ? undefined : [{ name: '资格证明.pdf', size: 120_000 + (seed % 800_000) }],
    })
    courseSeq += 1
  })
})

export const SEED_COURSES: Course[] = COURSES

// ─────────────────────────── 悬赏（30 条） ───────────────────────────

const BOUNTIES: Bounty[] = []
ALL_SKILLS.forEach((skill, i) => {
  const content = SKILL_CONTENT[skill.id]
  if (!content?.bounties.length) return

  // 前 10 个技能出两条，凑满 30
  const count = i < 10 ? 2 : 1
  for (let k = 0; k < count; k++) {
    const seed = hash(`bounty-${skill.id}-${k}`)
    const mentor = MENTORS[(i * 11 + k * 5) % MENTORS.length]
    BOUNTIES.push({
      id: `b-${skill.id}-${k}`,
      ownerId: `u-${mentor[0]}`,
      ownerName: mentor[0],
      ownerAvatar: mentor[1],
      skillId: skill.id,
      title: pick(content.bounties, seed + k),
      budgetCoins: 25 + (seed % 75),
      mode: seed % 3 === 0 ? 'offline' : 'online',
      createdAt: NOW - (seed % 60) * HOUR,
    })
  }
})

export const SEED_BOUNTIES: Bounty[] = BOUNTIES

// ─────────────────────── 对对碰候选（50 组） ───────────────────────

/**
 * 刻意不在这里算契合度。
 * 分数必须按「用户真实登记的能教/想学」当场算，否则引导里选完技能后，
 * 卡片上的百分比还是拿默认身份算的 —— 这个产品的核心承诺就是匹配准，不能糊弄。
 */
export type MatchCandidate = Omit<SwapMatch, 'score'>

export const SEED_MATCHES: MatchCandidate[] = MENTORS.map((mentor) => {
  const seed = hash(`match-${mentor[0]}`)
  const teach = ALL_SKILLS[seed % ALL_SKILLS.length]
  const want = ALL_SKILLS[(seed >>> 3) % ALL_SKILLS.length]

  return {
    id: `m-${mentor[0]}`,
    partnerId: `u-${mentor[0]}`,
    partnerName: mentor[0],
    partnerAvatar: mentor[1],
    partnerRoleTag: mentor[2],
    teachSkillId: teach.id,
    teachTier: TIERS[seed % TIERS.length].id,
    teachNote: pick(SKILL_CONTENT[teach.id]?.teachNotes ?? ['', '', ''], seed),
    wantSkillId: want.id,
    wantTier: TIERS[(seed >>> 5) % TIERS.length].id,
    wantNote: pick(SKILL_CONTENT[want.id]?.wantNotes ?? ['', '', ''], seed >>> 7),
  }
})

// ─────────────────────────── 会话（30 条） ───────────────────────────

const STATUS_CYCLE: SessionStatus[] = ['pending', 'active', 'reviewing', 'done', 'active', 'done']

export const SEED_SESSIONS: Session[] = Array.from({ length: 30 }, (_, i) => {
  const seed = hash(`session-${i}`)
  const mentor = MENTORS[(i * 3 + 1) % MENTORS.length]
  const a = ALL_SKILLS[seed % ALL_SKILLS.length]
  const b = ALL_SKILLS[(seed >>> 4) % ALL_SKILLS.length]
  const status = STATUS_CYCLE[i % STATUS_CYCLE.length]
  // 每五条里有一条是单向约课（我只学）或接单授课（我只教）
  const kind = i % 5

  const base = {
    id: `s-seed-${i}`,
    partnerName: mentor[0],
    partnerAvatar: mentor[1],
    mode: (seed % 2 === 0 ? 'online' : 'offline') as TeachingMode,
    status,
    nextAt: status === 'done' ? undefined : NOW + ((seed % 9) - 2) * DAY,
    coinsEarned: 0,
  }

  if (kind === 4) {
    return { ...base, teachingSkillId: a.id, coinsEarned: 20 + (seed % 60) }
  }
  if (kind === 3) {
    return { ...base, learningSkillId: b.id, coinsSpent: 15 + (seed % 50) }
  }
  return { ...base, teachingSkillId: a.id, learningSkillId: b.id }
})

// ─────────────────────────── 钱包流水（40 条） ───────────────────────────

export const SEED_TX: CoinTx[] = Array.from({ length: 40 }, (_, i) => {
  const seed = hash(`tx-${i}`)
  const mentor = MENTORS[(i * 7 + 3) % MENTORS.length][0]
  const skill = ALL_SKILLS[seed % ALL_SKILLS.length]
  const kind = pick(['earn', 'earn', 'spend', 'recharge'] as const, seed)
  const amount = kind === 'recharge' ? pick([50, 100, 300], seed) : 15 + (seed % 70)

  const note =
    kind === 'earn'
      ? `教${mentor} ${skill.label}`
      : kind === 'spend'
        ? `向${mentor}约「${skill.label}」`
        : '充值'

  return {
    id: `t-seed-${i}`,
    kind,
    amount: kind === 'spend' ? -amount : amount,
    note,
    at: NOW - (i * 7 + (seed % 5)) * HOUR,
  }
})

/**
 * 注册赠送作为最老的一笔挂在流水末尾。
 * 这样钱包里每一笔加起来正好等于余额 —— 历史对不上账的钱包是一眼可见的假。
 */
SEED_TX.push({
  id: 't-seed-bonus',
  kind: 'bonus',
  amount: SIGNUP_BONUS_COINS,
  note: '新人注册赠送',
  at: NOW - 120 * DAY,
})

/** 初始余额由流水推导，不写死魔数 */
export const SEED_BALANCE = SEED_TX.reduce((sum, t) => sum + t.amount, 0)
