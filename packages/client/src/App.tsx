import { computeMatchScore } from '@skillswap/shared'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BottomNav, type TabId } from './components/layout/BottomNav'
import { OnboardingModal } from './components/onboarding/OnboardingModal'
import { PublishModal } from './components/publish/PublishModal'
import { RechargeSheet } from './components/profile/RechargeSheet'
import { TourPopover, type TourStep } from './components/tour/TourPopover'
import { SEED_BOUNTIES, SEED_COURSES, SEED_MATCHES, SEED_SESSIONS, SEED_TX } from './data/seed'
import { MarketPage, type MarketSegment } from './pages/MarketPage'
import { ProfilePage } from './pages/ProfilePage'
import { SessionsPage } from './pages/SessionsPage'
import { SwapPage } from './pages/SwapPage'
import { useAppStore } from './store/useAppStore'

export function App() {
  const {
    onboardingDone,
    tourDone,
    profile,
    coins,
    txs,
    myCourses,
    invitedSessions,
    sessionOverrides,
    skippedMatchIds,
    invitedMatchIds,
    acceptedBountyIds,
    completeOnboarding,
    finishTour,
    skipMatch,
    inviteMatch,
    publishCourse,
    enrollCourse,
    takeBounty,
    advanceSession,
    recharge,
  } = useAppStore()

  const [tab, setTab] = useState<TabId>('swap')
  const [marketSegment, setMarketSegment] = useState<MarketSegment>('courses')
  const [publishOpen, setPublishOpen] = useState(false)
  const [rechargeOpen, setRechargeOpen] = useState(false)

  const scrollerRef = useRef<HTMLElement>(null)

  // 切页必须回到顶部：滚动容器是复用的同一个元素，不重置就会落在上一页的滚动位置上
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0 })
  }, [tab])

  // 种子内容与用户内容在这里合并，store 里只存用户产生的那部分
  /**
   * 契合度必须按用户**当前**登记的能教/想学当场算，不能预先写死在种子数据里 ——
   * 否则引导里选完技能后，卡片上的百分比还是拿默认身份算的，而这个产品的核心承诺就是匹配准。
   * 算完按分数降序，保证推荐位永远是最契合的那几个人。
   */
  const matches = useMemo(
    () =>
      SEED_MATCHES.filter(
        (m) => !skippedMatchIds.includes(m.id) && !invitedMatchIds.includes(m.id),
      )
        .map((m) => ({
          ...m,
          score: computeMatchScore({
            myTeachSkillIds: profile.teachSkillIds,
            myWantSkillIds: profile.wantSkillIds,
            theirTeachSkillId: m.teachSkillId,
            theirWantSkillId: m.wantSkillId,
            partnerId: m.partnerId,
          }),
        }))
        .sort((a, b) => b.score - a.score),
    [profile.teachSkillIds, profile.wantSkillIds, skippedMatchIds, invitedMatchIds],
  )
  const courses = useMemo(() => [...myCourses, ...SEED_COURSES], [myCourses])
  // 种子会话的状态变化存在覆盖层里，这里合并出最终视图
  const sessions = useMemo(
    () =>
      [...invitedSessions, ...SEED_SESSIONS].map((s) =>
        sessionOverrides[s.id] ? { ...s, ...sessionOverrides[s.id] } : s,
      ),
    [invitedSessions, sessionOverrides],
  )
  const completedSwaps = useMemo(() => sessions.filter((s) => s.status === 'done').length, [sessions])
  // 用户自己产生的流水排在种子流水前面
  const allTxs = useMemo(() => [...txs, ...SEED_TX], [txs])

  const handleRefresh = useCallback(() => {
    // 被划掉的卡先还回来，否则「换一批」在划完一轮后就什么都不会发生
    useAppStore.setState({ skippedMatchIds: [] })
  }, [])

  const tourSteps: TourStep[] = useMemo(
    () => [
      {
        key: 'swap',
        title: '对对碰',
        body: '这里是你的主匹配区。系统已按你「能教的」和「想学的」算出契合度最高的伙伴，双向奔赴就直接发起互换。',
      },
      {
        key: 'market',
        title: '技能集市',
        body: '遇不到双向匹配？来集市用技能币向大神悬赏，或挑一门明码标价的课。单向也能自由学。',
      },
      {
        key: 'sessions',
        title: '交换中',
        body: '已经约好的交换都在这儿：看下次赴约时间、去打卡、完成后互相评价。准时赴约会记进你的履约率。',
      },
      {
        key: 'profile',
        title: '我的',
        body: '管理个人资料、技能币钱包、充值与会员权益。你的认证等级和履约率也都挂在这里。',
      },
      {
        key: 'publish',
        title: '最后一步，也是最重要的一步',
        body: '点击中间的「+」，把你会的打包成一个课程，才能被正在找你的人发现，交换才真正转起来。',
        cta: { label: '立即去发布', onClick: () => setPublishOpen(true) },
      },
    ],
    [],
  )

  return (
    <div className="app-viewport">
      <div className="app-shell">
        <main ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {tab === 'swap' && (
            <SwapPage
              matches={matches}
              onInvite={(id) => {
                const match = matches.find((m) => m.id === id)
                if (match) inviteMatch(match)
              }}
              onSkip={skipMatch}
              onRefresh={handleRefresh}
            />
          )}
          {tab === 'market' && (
            <MarketPage
              courses={courses}
              bounties={SEED_BOUNTIES}
              acceptedBountyIds={acceptedBountyIds}
              balance={coins}
              segment={marketSegment}
              onSegmentChange={setMarketSegment}
              onEnroll={(course) => {
                // 约课成功就跳到「交换中」，让用户立刻看到刚建立的这段交换
                if (enrollCourse(course)) setTab('sessions')
              }}
              onTakeBounty={(bounty) => {
                takeBounty(bounty)
                setTab('sessions')
              }}
            />
          )}
          {tab === 'sessions' && <SessionsPage sessions={sessions} onAdvance={advanceSession} />}
          {tab === 'profile' && (
            <ProfilePage
              profile={profile}
              balance={coins}
              // 进行中的付费约课，钱已付但课还没上完，算履约中冻结
              frozen={sessions
                .filter((s) => s.status === 'active')
                .reduce((sum, s) => sum + (s.coinsSpent ?? 0), 0)}
              txs={allTxs}
              sessions={sessions}
              completedSwaps={completedSwaps}
              onTimeRate={completedSwaps > 0 ? 1 : null}
              onRecharge={() => setRechargeOpen(true)}
              onOpenSessions={() => setTab('sessions')}
            />
          )}
        </main>

        <BottomNav active={tab} onSelect={setTab} onPublish={() => setPublishOpen(true)} />

        {/* 弹层放在手机壳内部，才能被 overflow 裁住并跟着壳体走 */}
        <OnboardingModal open={!onboardingDone} onComplete={completeOnboarding} />
        <TourPopover steps={tourSteps} open={onboardingDone && !tourDone} onFinish={finishTour} />
        <PublishModal
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          teachSkillIds={profile.teachSkillIds}
          onSubmit={(draft) => {
            publishCourse(draft)
            setPublishOpen(false)
            // 拨回课时流，否则用户停在悬赏区会看不到自己刚发布的课
            setMarketSegment('courses')
            setTab('market')
          }}
        />
        <RechargeSheet
          open={rechargeOpen}
          onClose={() => setRechargeOpen(false)}
          balance={coins}
          onRecharge={recharge}
        />
      </div>
    </div>
  )
}
