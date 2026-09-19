import type { CertificationTier } from './types'

/**
 * 三级认证的规则与定价权。
 * 发布表单的价格滑杆上限、凭证上传的显隐、精英考核入口全部读这一份，
 * 不允许在组件里散落硬编码。
 */
export interface TierSpec {
  id: CertificationTier
  /** 小白 / 熟练 / 精英 */
  label: string
  /** Lv.1 陪伴型 */
  levelLabel: string
  /** 面向用户的一句话定位 */
  positioning: string
  /** 发布时是否需要上传凭证材料 */
  requiresProof: boolean
  /** 是否需要在发布时预约平台运营面试考核 */
  requiresInterview: boolean
  minCoinsPerHour: number
  maxCoinsPerHour: number
  /** 表单默认值 */
  suggestedCoinsPerHour: number
}

export const TIERS: readonly TierSpec[] = [
  {
    id: 'novice',
    label: '小白',
    levelLabel: 'Lv.1 陪伴型',
    positioning: '自学打卡伙伴、练习督促、初级入门答疑',
    requiresProof: false,
    requiresInterview: false,
    minCoinsPerHour: 5,
    maxCoinsPerHour: 15,
    suggestedCoinsPerHour: 10,
  },
  {
    id: 'skilled',
    label: '熟练',
    levelLabel: 'Lv.2 进阶型',
    positioning: '体系化实操传授，凭证经平台真实性校验',
    requiresProof: true,
    requiresInterview: false,
    minCoinsPerHour: 15,
    maxCoinsPerHour: 40,
    suggestedCoinsPerHour: 25,
  },
  {
    id: 'elite',
    label: '精英',
    levelLabel: 'Lv.3 导师型',
    positioning: '高阶行业技能、求职冲刺、专家级一对一指导',
    requiresProof: true,
    requiresInterview: true,
    minCoinsPerHour: 40,
    maxCoinsPerHour: 120,
    suggestedCoinsPerHour: 60,
  },
]

export const TIER_BY_ID: ReadonlyMap<CertificationTier, TierSpec> = new Map(
  TIERS.map((t) => [t.id, t]),
)

export function getTier(id: CertificationTier): TierSpec {
  const spec = TIER_BY_ID.get(id)
  if (!spec) throw new Error(`unknown tier: ${id}`)
  return spec
}

/** 把任意输入夹到该等级的合法定价区间，越界就夹紧而非报错。拖动滑杆时用。 */
export function clampCoins(tier: CertificationTier, coins: number): number {
  const spec = getTier(tier)
  if (!Number.isFinite(coins)) return spec.suggestedCoinsPerHour
  return Math.min(spec.maxCoinsPerHour, Math.max(spec.minCoinsPerHour, Math.round(coins)))
}

/**
 * 切换认证等级时的定价处理。
 * 直接夹紧会把价格永远钉在新等级的底线上（15–40 的区间永远从 15 起），
 * 所以越界时改用该等级的推荐值，让价格始终落在一个像样的位置。
 */
export function retuneCoins(tier: CertificationTier, coins: number): number {
  const spec = getTier(tier)
  if (!Number.isFinite(coins) || coins < spec.minCoinsPerHour || coins > spec.maxCoinsPerHour) {
    return spec.suggestedCoinsPerHour
  }
  return Math.round(coins)
}

/** 会员增值权益。 */
export const VIP_PERKS: readonly string[] = [
  '交换免手续费',
  '每月赠送 2 张置顶推荐卡',
  '优先解锁精英级导师档期',
]

/** 会员月费（技能币）。 */
export const VIP_PRICE_COINS = 88

/** 充值档位，供充值面板使用。 */
export const RECHARGE_PRESETS: readonly number[] = [50, 100, 300, 500]

/**
 * 注册初始赠送，破冰用 —— 新用户没有币就问不到任何人。
 * 定在 300 是因为集市里最贵的课到 120 币，30 币会让大部分课都显示「技能币不足」，
 * 演示时满屏灰按钮很打击观感。
 */
export const SIGNUP_BONUS_COINS = 300
