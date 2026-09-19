import { computeMatchScore, type Bounty, type CoinTx, type Course, type Session, type SwapMatch, type UserProfile } from '@skillswap/shared'

/**
 * 冷启动用的种子内容。
 * P1 阶段全部是静态数据，用来验证信息架构与视觉；P3 起用户自己发布的内容会和它合并。
 */

/** 尚未做引导建档时用的默认身份，保证 P1 打开就能看到算得出的契合度 */
export const DEFAULT_PROFILE: UserProfile = {
  nickname: '林一',
  avatar: '🦊',
  roleTag: '自由职业者',
  bio: '想用编程换一切能动手的技能',
  teachSkillIds: ['code.python', 'code.prompt', 'design.uiux', 'career.interview'],
  wantSkillIds: ['art.guitar', 'life.english', 'design.video', 'design.photo'],
  tierBySkillId: { 'code.python': 'skilled', 'code.prompt': 'skilled', 'design.uiux': 'novice' },
}

const RAW_MATCHES = [
  {
    partnerId: 'u-ali',
    partnerName: '阿栗',
    partnerAvatar: '🌰',
    partnerRoleTag: '在校学生',
    teachSkillId: 'art.guitar',
    teachTier: 'skilled' as const,
    teachNote: '民谣指弹五年，能带你从四个和弦弹到完整弹唱，琴我有两把',
    wantSkillId: 'code.python',
    wantTier: 'novice' as const,
    wantNote: '想写个自动整理课程表的脚本，完全零基础，需要有人盯我交作业',
  },
  {
    partnerId: 'u-chenmo',
    partnerName: '陈默',
    partnerAvatar: '🎬',
    partnerRoleTag: '职场新人',
    teachSkillId: 'design.video',
    teachTier: 'elite' as const,
    teachNote: '商业短片剪辑八年，卡点、调色、声音设计都能拆开讲',
    wantSkillId: 'code.prompt',
    wantTier: 'novice' as const,
    wantNote: '想把写脚本的流程接上大模型，提示词总是写不出想要的镜头感',
  },
  {
    partnerId: 'u-xiaoman',
    partnerName: '小满',
    partnerAvatar: '🍋',
    partnerRoleTag: '斜杠青年',
    teachSkillId: 'life.english',
    teachTier: 'skilled' as const,
    teachNote: '雅思 8 分，擅长把说不满两分钟的口语卡壳问题拆成可练的动作',
    wantSkillId: 'design.uiux',
    wantTier: 'novice' as const,
    wantNote: '在做独立产品，需要有人教我过一遍 Figma 交互稿',
  },
  {
    partnerId: 'u-ken',
    partnerName: 'Ken',
    partnerAvatar: '📷',
    partnerRoleTag: '自由职业者',
    teachSkillId: 'design.photo',
    teachTier: 'skilled' as const,
    teachNote: '人像摄影六年，布光与后期调色，棚拍外拍都能带',
    wantSkillId: 'career.interview',
    wantTier: 'novice' as const,
    wantNote: '想转行做商业摄影，需要人帮我把作品集讲成一个故事',
  },
  {
    partnerId: 'u-taozi',
    partnerName: '桃子',
    partnerAvatar: '🍑',
    partnerRoleTag: '在校学生',
    teachSkillId: 'art.illustration',
    teachTier: 'skilled' as const,
    teachNote: 'Procreate 厚涂，画了三年同人，能教光影和体积感',
    wantSkillId: 'code.prompt',
    wantTier: 'novice' as const,
    wantNote: '想让 AI 帮我出一版配色草稿，再把控细节，提示词一直调不好',
  },
]

/** 契合度在种子数据生成时算好，保证刷新前后数字完全稳定 */
export const SEED_MATCHES: SwapMatch[] = RAW_MATCHES.map((m) => ({
  ...m,
  id: `m-${m.partnerId}`,
  score: computeMatchScore({
    myTeachSkillIds: DEFAULT_PROFILE.teachSkillIds,
    myWantSkillIds: DEFAULT_PROFILE.wantSkillIds,
    theirTeachSkillId: m.teachSkillId,
    theirWantSkillId: m.wantSkillId,
    partnerId: m.partnerId,
  }),
}))

const DAY = 86_400_000
const NOW = Date.UTC(2026, 8, 19, 4, 0, 0)

export const SEED_COURSES: Course[] = [
  {
    id: 'c-1',
    ownerId: 'u-chenmo',
    ownerName: '陈默',
    ownerAvatar: '🎬',
    skillId: 'design.video',
    title: '剪映卡点剪辑：从一堆素材到一条成片',
    outline: '第 1 节 素材整理与叙事线\n第 2 节 卡点与节奏对齐\n第 3 节 调色与声音处理\n第 4 节 成片导出与平台适配',
    mode: 'online',
    tier: 'elite',
    coinsPerHour: 68,
    rating: 0.98,
    ratingCount: 212,
    sessionsDone: 128,
    createdAt: NOW - 3 * DAY,
    goldMentor: true,
  },
  {
    id: 'c-2',
    ownerId: 'u-xiaoman',
    ownerName: '小满',
    ownerAvatar: '🍋',
    skillId: 'life.english',
    title: '口语卡壳急救：把 Part 2 说满两分钟',
    outline: '第 1 节 万能延展结构\n第 2 节 三个能套用的话题框架\n第 3 节 当场录音复盘',
    mode: 'online',
    tier: 'skilled',
    coinsPerHour: 32,
    rating: 0.96,
    ratingCount: 87,
    sessionsDone: 64,
    createdAt: NOW - 5 * DAY,
  },
  {
    id: 'c-3',
    ownerId: 'u-ali',
    ownerName: '阿栗',
    ownerAvatar: '🌰',
    skillId: 'art.guitar',
    title: '零基础弹唱第一课：四个和弦弹完一首歌',
    outline: '第 1 节 持琴与按弦不疼的手型\n第 2 节 四个和弦的换法\n第 3 节 右手节奏型\n第 4 节 完整弹唱一遍',
    mode: 'offline',
    tier: 'skilled',
    coinsPerHour: 24,
    rating: 0.99,
    ratingCount: 46,
    sessionsDone: 39,
    createdAt: NOW - 1 * DAY,
  },
  {
    id: 'c-4',
    ownerId: 'u-taozi',
    ownerName: '桃子',
    ownerAvatar: '🍑',
    skillId: 'art.illustration',
    title: 'Procreate 厚涂入门：先画对光影，再谈笔刷',
    outline: '第 1 节 三大面五大调\n第 2 节 铺色与叠色\n第 3 节 边缘处理与材质',
    mode: 'online',
    tier: 'skilled',
    coinsPerHour: 28,
    rating: 0.94,
    ratingCount: 33,
    sessionsDone: 21,
    createdAt: NOW - 8 * DAY,
  },
  {
    id: 'c-5',
    ownerId: 'u-zhou',
    ownerName: '老周',
    ownerAvatar: '🧭',
    skillId: 'career.interview',
    title: '技术岗行为面：把你的项目讲成决策链',
    outline: '第 1 节 项目叙述的 STAR 骨架\n第 2 节 追问压力的应对\n第 3 节 一轮完整模拟面试',
    mode: 'online',
    tier: 'elite',
    coinsPerHour: 88,
    rating: 0.97,
    ratingCount: 156,
    sessionsDone: 94,
    createdAt: NOW - 2 * DAY,
    goldMentor: true,
  },
  {
    id: 'c-6',
    ownerId: 'u-yiming',
    ownerName: '一鸣',
    ownerAvatar: '🐟',
    skillId: 'code.python',
    title: '爬虫陪练：每天 30 分钟，两周跑通第一个项目',
    outline: '陪你搭环境\n陪你写第一行请求\n陪你处理反爬与分页\n陪你把自己的脚本跑起来',
    mode: 'online',
    tier: 'novice',
    coinsPerHour: 12,
    rating: 0.93,
    ratingCount: 18,
    sessionsDone: 15,
    createdAt: NOW - 6 * DAY,
  },
]

export const SEED_BOUNTIES: Bounty[] = [
  {
    id: 'b-1',
    ownerId: 'u-momo',
    ownerName: '默默',
    ownerAvatar: '🐨',
    skillId: 'design.photo',
    title: '出 50 币找个摄影师教人像布光，棚拍或外拍都行',
    budgetCoins: 50,
    mode: 'offline',
    createdAt: NOW - 12 * 3600_000,
  },
  {
    id: 'b-2',
    ownerId: 'u-lu',
    ownerName: '阿鹭',
    ownerAvatar: '🦩',
    skillId: 'life.english',
    title: '出 35 币求带练英语口语，每周两次，主要是敢开口',
    budgetCoins: 35,
    mode: 'online',
    createdAt: NOW - 26 * 3600_000,
  },
  {
    id: 'b-3',
    ownerId: 'u-qiu',
    ownerName: '秋刀',
    ownerAvatar: '🐙',
    skillId: 'code.web',
    title: '出 80 币求一位 React 老手帮我把项目结构 review 一遍',
    budgetCoins: 80,
    mode: 'online',
    createdAt: NOW - 40 * 3600_000,
  },
]

export const SEED_SESSIONS: Session[] = [
  {
    id: 's-1',
    partnerName: '阿栗',
    partnerAvatar: '🌰',
    teachingSkillId: 'code.python',
    learningSkillId: 'art.guitar',
    mode: 'offline',
    status: 'active',
    nextAt: NOW + DAY,
    coinsEarned: 40,
  },
  {
    id: 's-2',
    partnerName: '小满',
    partnerAvatar: '🍋',
    teachingSkillId: 'design.uiux',
    learningSkillId: 'life.english',
    mode: 'online',
    status: 'pending',
    nextAt: NOW + 3 * DAY,
    coinsEarned: 0,
  },
  {
    id: 's-3',
    partnerName: '陈默',
    partnerAvatar: '🎬',
    teachingSkillId: 'code.prompt',
    learningSkillId: 'design.video',
    mode: 'online',
    status: 'reviewing',
    coinsEarned: 25,
  },
]

export const SEED_TX: CoinTx[] = [
  { id: 't-1', kind: 'earn', amount: 40, note: '教阿栗 Python 基础（2 课时）', at: NOW - DAY },
  { id: 't-2', kind: 'earn', amount: 25, note: '教陈默 提示词工作流', at: NOW - 2 * DAY },
  { id: 't-3', kind: 'spend', amount: -30, note: '向小满约口语练习', at: NOW - 3 * DAY },
  { id: 't-4', kind: 'recharge', amount: 100, note: '充值', at: NOW - 9 * DAY },
]

/** 钱包初始余额 = 注册赠送 + 流水合计，避免两处数字对不上 */
export const SEED_BALANCE = 30 + SEED_TX.reduce((sum, t) => sum + t.amount, 0)

/** 履约中冻结的技能币 */
export const SEED_FROZEN = 40
