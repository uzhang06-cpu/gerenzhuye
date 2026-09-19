/** 技能准入三级认证。 */
export type CertificationTier = 'novice' | 'skilled' | 'elite'

/** 授课方式。 */
export type TeachingMode = 'online' | 'offline'

export type SessionStatus = 'pending' | 'active' | 'reviewing' | 'done'

/** 技能币流水类型。 */
export type CoinTxKind = 'earn' | 'spend' | 'recharge' | 'bonus' | 'freeze' | 'unfreeze'

export interface UserProfile {
  nickname: string
  /** 头像用 emoji 表示，避免上传与存储成本 */
  avatar: string
  roleTag: string
  bio: string
  /** 我能教的（Step 2） */
  teachSkillIds: string[]
  /** 我想学的（Step 3） */
  wantSkillIds: string[]
  /** 每项已教技能对应的认证等级；未认证的默认按小白处理 */
  tierBySkillId: Record<string, CertificationTier>
}

/** 凭证材料。只记录文件名与大小 —— localStorage 有配额，存字节会直接撑爆。 */
export interface ProofFile {
  name: string
  size: number
}

export interface Course {
  id: string
  /** 平台内置导师用 'seed'，用户自己发布的用 'me' */
  ownerId: string
  ownerName: string
  ownerAvatar: string
  skillId: string
  title: string
  outline: string
  mode: TeachingMode
  tier: CertificationTier
  coinsPerHour: number
  /** 好评率 0-1 */
  rating: number
  ratingCount: number
  sessionsDone: number
  createdAt: number
  /** 精英级通过考核后置为 true，集市首页推荐位要用 */
  goldMentor?: boolean
  /** 熟练/精英级提交的凭证 */
  proofFiles?: ProofFile[]
  /** 精英级预约的面试时间 */
  interviewAt?: string
}

export interface Bounty {
  id: string
  ownerId: string
  ownerName: string
  ownerAvatar: string
  skillId: string
  title: string
  /** 悬赏预算，单位为技能币 */
  budgetCoins: number
  mode: TeachingMode
  createdAt: number
}

/**
 * 对对碰匹配卡。
 * 上半是对方能教、下半是对方想学 —— 卡片本身就是一次「双向奔赴」的凭证。
 */
export interface SwapMatch {
  id: string
  partnerId: string
  partnerName: string
  partnerAvatar: string
  partnerRoleTag: string
  /** 对方能教、而我想学的技能 */
  teachSkillId: string
  teachTier: CertificationTier
  teachNote: string
  /** 对方想学、而我能教的技能 */
  wantSkillId: string
  wantTier: CertificationTier
  wantNote: string
  /** 契合度 0-100，客户端确定性算出，不调 LLM */
  score: number
}

export interface Session {
  id: string
  partnerName: string
  partnerAvatar: string
  /**
   * 我在这段交换里教出去的技能。
   * 单向约课（在集市花钱买课）时没有这一项 —— 那是纯消费，不是互换。
   */
  teachingSkillId?: string
  /**
   * 我在这段交换里学到的技能。
   * 接下来自悬赏（我出技能换币）时没有这一项 —— 我只教不学。
   */
  learningSkillId?: string
  mode: TeachingMode
  status: SessionStatus
  /** 下次约定的时间戳 */
  nextAt?: number
  /** 这段交换给我带来的技能币收入；纯互换为 0，只有收费授课才有 */
  coinsEarned: number
  /** 已付出的技能币（集市约课用） */
  coinsSpent?: number
}

export interface CoinTx {
  id: string
  kind: CoinTxKind
  /** 正数为入账，负数为出账 */
  amount: number
  note: string
  at: number
}
