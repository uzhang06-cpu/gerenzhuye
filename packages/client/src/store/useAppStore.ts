import {
  SIGNUP_BONUS_COINS,
  type Bounty,
  type CoinTx,
  type Course,
  type Session,
  type SessionStatus,
  type SwapMatch,
  type UserProfile,
} from '@skillswap/shared'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CourseDraft } from '../components/publish/PublishModal'
import { DEFAULT_PROFILE } from '../data/seed'

/**
 * 全局状态。
 *
 * 持久化只存「用户产生的差异」，种子数据始终留在代码里 —— 否则一旦改了种子内容，
 * 老用户 localStorage 里那份旧种子会一直盖着新代码，问题极难查。
 * 因此种子会话的状态变化走 sessionOverrides 覆盖层，而不是把整条会话复制一份存起来。
 */
export interface AppState {
  onboardingDone: boolean
  tourDone: boolean
  profile: UserProfile

  coins: number
  txs: CoinTx[]

  /** 用户自己发布的课程 */
  myCourses: Course[]
  /** 用户发起的交换 / 约课产生的会话 */
  invitedSessions: Session[]
  /** 对种子会话的状态覆盖，key 为会话 id */
  sessionOverrides: Record<string, Pick<Session, 'status'>>
  /**
   * 已「稍后再看」的匹配卡。
   * 与 invitedMatchIds 分开存：「换一批」只该还原稍后再看的卡，
   * 把已经发起过邀请的也一起还原，用户就能对同一个人重复发起邀请。
   */
  skippedMatchIds: string[]
  /** 已发起过互换邀请的匹配卡 */
  invitedMatchIds: string[]
  /** 已接过的悬赏，避免重复接单 */
  acceptedBountyIds: string[]

  completeOnboarding: (payload: {
    nickname: string
    avatar: string
    roleTag: string
    bio: string
    teachSkillIds: string[]
    wantSkillIds: string[]
  }) => void
  finishTour: () => void
  skipMatch: (matchId: string) => void
  inviteMatch: (match: SwapMatch) => void
  publishCourse: (draft: CourseDraft) => void
  /** 在集市花技能币约一节课 */
  enrollCourse: (course: Course) => boolean
  /** 接下悬赏：我出技能，对方出币 */
  takeBounty: (bounty: Bounty) => void
  /** 推进会话状态；走到「已完成」时按 coinsEarned 结算收入 */
  advanceSession: (id: string, from: SessionStatus, coinsEarned?: number) => void
  recharge: (coins: number) => void
  resetAll: () => void
}

const initial = {
  onboardingDone: false,
  tourDone: false,
  profile: DEFAULT_PROFILE,
  coins: SIGNUP_BONUS_COINS,
  txs: [] as CoinTx[],
  myCourses: [] as Course[],
  invitedSessions: [] as Session[],
  sessionOverrides: {} as Record<string, Pick<Session, 'status'>>,
  skippedMatchIds: [] as string[],
  invitedMatchIds: [] as string[],
  acceptedBountyIds: [] as string[],
}

/** 会话状态的推进顺序。done 是终点，再调用不会产生新状态。 */
const NEXT_STATUS: Record<SessionStatus, SessionStatus> = {
  pending: 'active',
  active: 'done',
  reviewing: 'done',
  done: 'done',
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial,

      completeOnboarding: ({ nickname, avatar, roleTag, bio, teachSkillIds, wantSkillIds }) =>
        set({
          onboardingDone: true,
          profile: { ...get().profile, nickname, avatar, roleTag, bio, teachSkillIds, wantSkillIds },
        }),

      finishTour: () => set({ tourDone: true }),

      skipMatch: (matchId) =>
        set((s) => ({ skippedMatchIds: [...new Set([...s.skippedMatchIds, matchId])] })),

      inviteMatch: (match) =>
        set((s) => ({
          invitedMatchIds: [...new Set([...s.invitedMatchIds, match.id])],
          invitedSessions: [
            {
              id: `s-${match.id}`,
              partnerName: match.partnerName,
              partnerAvatar: match.partnerAvatar,
              teachingSkillId: match.wantSkillId,
              learningSkillId: match.teachSkillId,
              mode: 'online',
              status: 'pending',
              // 对对碰是双向互换，不涉及技能币；收费只发生在集市
              coinsEarned: 0,
            },
            ...s.invitedSessions,
          ],
        })),

      publishCourse: (draft) =>
        set((s) => ({
          myCourses: [
            {
              ...draft,
              id: `c-mine-${Date.now()}`,
              ownerId: 'me',
              ownerName: s.profile.nickname,
              ownerAvatar: s.profile.avatar,
              rating: 1,
              ratingCount: 0,
              sessionsDone: 0,
              createdAt: Date.now(),
            },
            ...s.myCourses,
          ],
          // 发布即视为在该技能上取得对应等级，后续卡片的等级徽章据此显示
          profile: {
            ...s.profile,
            tierBySkillId: { ...s.profile.tierBySkillId, [draft.skillId]: draft.tier },
          },
        })),

      enrollCourse: (course) => {
        const s = get()
        if (s.coins < course.coinsPerHour) return false
        set({
          coins: s.coins - course.coinsPerHour,
          txs: [
            {
              id: `t-${Date.now()}`,
              kind: 'spend',
              amount: -course.coinsPerHour,
              note: `向${course.ownerName}约「${course.title}」`,
              at: Date.now(),
            },
            ...s.txs,
          ],
          invitedSessions: [
            {
              id: `s-course-${course.id}-${Date.now()}`,
              partnerName: course.ownerName,
              partnerAvatar: course.ownerAvatar,
              // 单向约课：我只学，不教
              learningSkillId: course.skillId,
              mode: course.mode,
              status: 'pending',
              coinsEarned: 0,
              coinsSpent: course.coinsPerHour,
            },
            ...s.invitedSessions,
          ],
        })
        return true
      },

      advanceSession: (id, from, coinsEarned = 0) => {
        const status = NEXT_STATUS[from]
        if (status === from) return
        set((s) => {
          const next: Partial<AppState> = {
            sessionOverrides: { ...s.sessionOverrides, [id]: { status } },
          }
          // 授课收入在「完成」这一刻才结算，被放鸽子就不该收到币
          if (status === 'done' && coinsEarned > 0) {
            next.coins = s.coins + coinsEarned
            next.txs = [
              {
                id: `t-${Date.now()}`,
                kind: 'earn',
                amount: coinsEarned,
                note: '完成一次授课',
                at: Date.now(),
              },
              ...s.txs,
            ]
          }
          return next
        })
      },

      takeBounty: (bounty) =>
        set((s) => ({
          acceptedBountyIds: [...new Set([...s.acceptedBountyIds, bounty.id])],
          invitedSessions: [
            {
              id: `s-bounty-${bounty.id}-${Date.now()}`,
              partnerName: bounty.ownerName,
              partnerAvatar: bounty.ownerAvatar,
              // 接悬赏：我只教，不学
              teachingSkillId: bounty.skillId,
              mode: bounty.mode,
              status: 'pending',
              coinsEarned: bounty.budgetCoins,
            },
            ...s.invitedSessions,
          ],
        })),

      recharge: (coins) =>
        set((s) => ({
          coins: s.coins + coins,
          txs: [
            { id: `t-${Date.now()}`, kind: 'recharge', amount: coins, note: '充值', at: Date.now() },
            ...s.txs,
          ],
        })),

      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'skillswap-v1',
      version: 1,
      // 只落盘数据字段；函数不写进 localStorage
      partialize: (s) => ({
        onboardingDone: s.onboardingDone,
        tourDone: s.tourDone,
        profile: s.profile,
        coins: s.coins,
        txs: s.txs,
        myCourses: s.myCourses,
        invitedSessions: s.invitedSessions,
        sessionOverrides: s.sessionOverrides,
        skippedMatchIds: s.skippedMatchIds,
        invitedMatchIds: s.invitedMatchIds,
        acceptedBountyIds: s.acceptedBountyIds,
      }),
    },
  ),
)
