/**
 * 阶段验收脚本：用无头 Chromium 在手机视口跑一遍主流程，截图并断言关键状态。
 *
 * 与 letterpress 的 shot.mjs 不同，这里不连接外部常驻调试端口 —— 本机没有，
 * 改成自己拉起 headless 实例，`node scripts/shot.mjs` 即可。
 *
 * 前置：`npm run dev` 已在 5173 端口运行。
 * 可选：`node scripts/shot.mjs phone` 只跑某个视口。
 */
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const OUT = process.env.SHOT_DIR ?? '/tmp/ss-shots'
const BASE = process.env.SHOT_BASE ?? 'http://localhost:5173'

/** 手机主验视口；360 小屏用于暴露溢出，1440 用于确认手机壳居中 */
const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'small', width: 360, height: 800 },
  { name: 'desktop', width: 1440, height: 1000 },
]

/** 第 2 步选为「我能教」的两项，第 3 步的排除断言与发布表单都要对上 */
const TEACH = ['Python / 爬虫', '民谣吉他 / 尤克里里']

mkdirSync(OUT, { recursive: true })

const problems = []
const checks = []

function check(name, pass, detail) {
  checks.push({ name, pass, detail })
  if (!pass) problems.push(`${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await chromium.launch()
const only = process.argv[2]

for (const vp of VIEWPORTS) {
  if (only && only !== vp.name) continue

  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    locale: 'zh-CN',
  })
  const page = await context.newPage()

  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`)
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()} — ${r.failure()?.errorText}`))

  const shot = async (label) => {
    await page.waitForTimeout(320)
    await page.screenshot({ path: `${OUT}/${vp.name}-${label}.png` })
  }
  const tag = (n) => `[${vp.name}] ${n}`
  const onDialog = (name) => page.getByRole('dialog', { name })
  const balance = () =>
    page.locator('section').filter({ hasText: '可用技能币' }).locator('.num').first().textContent()

  await page.goto(BASE, { waitUntil: 'load' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)

  // ───────────── P2：引导建档漏斗 ─────────────

  check(tag('首次进入弹出引导'), await onDialog('初见 · 你是谁').isVisible())
  await shot('01-onboarding-step1')

  await page.getByLabel('昵称').fill('林一')
  await page.getByRole('button', { name: '选择头像 🐻' }).click()
  await page.getByRole('button', { name: '斜杠青年' }).click()
  await page.getByRole('button', { name: '下一步：点亮我的技能库' }).click()
  await page.waitForTimeout(350)

  const step2Disabled = await page.getByRole('button', { name: '下一步：挑选我的心愿' }).isDisabled()
  check(tag('第 2 步未选技能时不能继续'), step2Disabled === true)

  // 等条件成立而不是等固定时长：首次请求要穿过 Vite 代理到后端，冷启动时并不保险
  const waitFor = async (locator) => {
    try {
      await locator.waitFor({ state: 'visible', timeout: 8000 })
      return true
    } catch {
      return false
    }
  }

  /*
   * 先探测服务端的 LLM 状态，再决定验哪条路。
   * 线上可能没配 DEEPSEEK_API_KEY，那时 AI 入口本来就该收起 ——
   * 把这种情况当成失败会误报，正确的做法是分别断言两条路各自的表现。
   */
  const health = await page.evaluate(() =>
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  )
  const llmReady = Boolean(health?.llm?.configured)
  check(tag('拿到服务端健康状态'), health !== null, JSON.stringify(health?.llm))

  if (!llmReady) {
    // 降级路径：入口收起 + 明确告诉用户手动选就行
    check(tag('未配 key 时 AI 入口收起'), await page.getByText(/AI 自动导入当前不可用/).isVisible())
    for (const label of TEACH) {
      await page.getByRole('button', { name: `选择技能：${label}` }).click()
    }
    await shot('02-onboarding-step2')
  } else {
    // ── P5：文件上传通道 ──
    // 用不支持的格式走一遍完整往返，验证上传接线与错误提示；
    // 真实的 PDF / docx 提取由服务端单测覆盖（那份 771KB 简历不便进仓库）
    await page.getByLabel('上传简历文件').setInputFiles({
      name: 'resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello'),
    })
    check(tag('不支持的格式如实提示'), await waitFor(page.getByText(/暂不支持 \.txt/)))
    check(tag('错误提示同时给出替代做法'), (await page.getByText(/直接粘贴文本|粘贴文本/).count()) > 0)

    // ── P4：粘贴自介 → AI 自动勾选 ──
    await page.getByLabel('简历或自我介绍文本').fill('我做了三年 Python 爬虫，业余弹民谣吉他。')
    await page.getByRole('button', { name: '解析并自动勾选技能' }).click()

    for (const label of TEACH) {
      check(
        tag(`AI 自动勾选了「${label}」`),
        await waitFor(page.getByRole('button', { name: `取消技能：${label}` })),
      )
    }
    // 已选概况必须是纯文字：可点的芯片若同时出现在列表和概况里，用户会分不清该在哪取消
    check(
      tag('已选概况不重复渲染可点芯片'),
      (await page.getByRole('button', { name: /^取消技能：/ }).count()) === TEACH.length,
    )

    // 纵深防御：服务端若返回库外的 id，前端也绝不能把它渲染出来
    await page.route('**/api/llm/parse-skills', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          skills: [
            { id: 'evil.hack', confidence: 0.99, evidence: 'x' },
            { id: 'also.bad', confidence: 0.9, evidence: 'y' },
          ],
          unmatched: ['乐器维修'],
          model: 'test',
          ms: 1,
        }),
      }),
    )
    await page.getByRole('button', { name: '解析并自动勾选技能' }).click()
    await waitFor(page.getByText(/没有能对应到技能库的内容/))
    check(tag('库外技能 id 不会被渲染'), (await page.getByText('evil.hack').count()) === 0)
    check(
      tag('全为非法 id 时选择数不变'),
      (await page.getByRole('button', { name: /^取消技能：/ }).count()) === TEACH.length,
    )
    check(tag('未匹配项如实回显'), (await page.getByText(/乐器维修/).count()) > 0)
    await page.unroute('**/api/llm/parse-skills')

    await shot('02-onboarding-step2')
  }

  await page.getByRole('button', { name: '下一步：挑选我的心愿' }).click()
  await page.waitForTimeout(350)

  const recNames = await page
    .getByRole('button', { name: /^心愿推荐：/ })
    .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')?.replace('心愿推荐：', '') ?? ''))
  for (const label of TEACH) {
    check(tag(`推荐排除已会的「${label}」`), !recNames.includes(label), recNames.join(' / '))
  }
  await page.getByRole('button', { name: '心愿推荐：AI提示词工程 / 提效' }).click()
  await shot('03-onboarding-step3')
  await page.getByRole('button', { name: '开启技能互换之旅' }).click()
  await page.waitForTimeout(500)

  // ───────────── P2：新手漫游 ─────────────

  check(tag('引导完成后触发漫游'), await onDialog('新手漫游指引').isVisible())
  await shot('04-tour-step1')
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: '下一步' }).click()
    await page.waitForTimeout(260)
  }
  await shot('05-tour-last')
  await page.getByRole('button', { name: '立即去发布' }).click()
  await page.waitForTimeout(450)
  check(tag('漫游末步唤起发布弹窗'), await onDialog('发布一个技能课程').isVisible())
  await page.getByRole('button', { name: '关闭弹窗' }).click()
  await page.waitForTimeout(300)

  // ───────────── P1 回归 ─────────────

  const sealText = await page.locator('.voucher__seal-disc').first().textContent()
  check(tag('契合度封印有数字'), /%\s*$/.test(sealText?.trim() ?? ''), `读到 "${sealText}"`)
  const scores = await page
    .locator('.voucher__seal-disc')
    .evaluateAll((els) => els.map((e) => e.textContent?.trim()))
  check(tag('契合度分数有区分度'), new Set(scores).size > 1, scores.join(' / '))

  // 邀请过的人不能再被「换一批」还原回来，否则可以对同一个人重复发起邀请
  const firstPartner = (await page.locator('main article h3').first().textContent())?.trim() ?? ''
  await page.getByRole('button', { name: `向 ${firstPartner} 发起互换邀请` }).click()
  await page.waitForTimeout(400)
  check(
    tag('发起互换后卡片移出列表'),
    !(await page.locator('main article h3').allTextContents()).includes(firstPartner),
  )
  await page.getByRole('button', { name: '换一批匹配' }).click()
  await page.waitForTimeout(400)
  check(
    tag('换一批不会还原已邀请的卡'),
    !(await page.locator('main article h3').allTextContents()).includes(firstPartner),
  )

  const hSpill = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  check(tag('无横向溢出'), hSpill <= 0, `溢出 ${hSpill}px`)

  const navLabels = await page
    .locator('nav button')
    .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))
  check(
    tag('底部导航五项齐全'),
    ['对对碰', '技能集市', '发布课程', '交换中', '我的'].every((l) => navLabels.includes(l)),
    navLabels.join(' / '),
  )

  const fab = await page.locator('[data-tour="publish"]').boundingBox()
  const shellBox = await page.locator('.app-shell').boundingBox()
  const drift = fab.x + fab.width / 2 - (shellBox.x + shellBox.width / 2)
  check(tag('发布键居中'), Math.abs(drift) <= 2, `偏差 ${Math.round(drift)}px`)

  const layout = await page.evaluate(() => {
    const nav = document.querySelector('nav')
    const main = document.querySelector('main')
    return {
      navBottom: Math.round(nav.getBoundingClientRect().bottom),
      viewportH: window.innerHeight,
      mainScrolls: main.scrollHeight > main.clientHeight,
      docOverflow: document.documentElement.scrollHeight - window.innerHeight,
    }
  })
  check(
    tag('底部导航钉在视口内'),
    layout.navBottom > layout.viewportH - 140 && layout.navBottom <= layout.viewportH + 1,
    `nav 底边 ${layout.navBottom} / 视口 ${layout.viewportH}`,
  )
  check(tag('内容在 main 内部滚动'), layout.mainScrolls === true)
  check(tag('整页不滚动'), layout.docOverflow <= 1, `溢出 ${layout.docOverflow}px`)

  // ───────────── P3：集市筛选 ─────────────

  await page.locator('[data-tour="market"]').click()
  await page.waitForTimeout(300)
  const scrollTop = await page.evaluate(() => document.querySelector('main')?.scrollTop ?? -1)
  check(tag('切页回到顶部'), scrollTop === 0, `scrollTop=${scrollTop}`)

  const allCourses = await page.locator('[data-course]').count()
  check(tag('集市有课程卡'), allCourses > 0, `${allCourses} 张`)
  await shot('06-market-courses')

  await page.getByRole('button', { name: '筛选课程' }).click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: '精英', exact: true }).click()
  await shot('07-filter-sheet')
  await page.getByRole('button', { name: /^查看 \d+ 个结果$/ }).click()
  await page.waitForTimeout(350)

  const eliteCourses = await page.locator('[data-course]').count()
  check(tag('等级筛选收窄了结果'), eliteCourses < allCourses && eliteCourses > 0, `${allCourses} → ${eliteCourses}`)

  // 筛选键的 aria-label 是固定的「筛选课程」，生效维度只在可见文案里，所以要读 textContent
  const filterLabel = (await page.getByRole('button', { name: '筛选课程' }).textContent()) ?? ''
  check(tag('筛选按钮显示生效维度'), filterLabel.includes('筛选 · 1'), filterLabel.trim())

  await page.getByRole('button', { name: '筛选课程' }).click()
  await page.waitForTimeout(250)
  await page.getByRole('button', { name: '重置' }).click()
  await page.getByRole('button', { name: /^查看 \d+ 个结果$/ }).click()
  await page.waitForTimeout(350)
  check(tag('重置后结果恢复'), (await page.locator('[data-course]').count()) === allCourses)

  // ───────────── P3：集市约课 → 扣币 + 生成会话 ─────────────

  await page.locator('[data-tour="profile"]').click()
  await page.waitForTimeout(250)
  const beforeEnroll = Number(await balance())
  await page.locator('[data-tour="market"]').click()
  await page.waitForTimeout(250)

  // 课程定价是生成出来的，不能写死 12 —— 从卡片上把实际价格读出来再核对
  const enrollPrice = Number(
    (await page
      .locator('[data-course]')
      .filter({ hasText: '爬虫陪练' })
      .first()
      .locator('.num')
      .first()
      .textContent())?.trim(),
  )
  check(tag('读到课程定价'), enrollPrice > 0, `${enrollPrice} 币`)

  await page.getByRole('button', { name: /^约课：爬虫陪练/ }).click()
  await page.waitForTimeout(450)

  check(tag('约课后跳到交换中'), (await page.getByText('单向约课').count()) > 0)
  await shot('08-sessions')

  await page.locator('[data-tour="profile"]').click()
  await page.waitForTimeout(250)
  const afterEnroll = Number(await balance())
  check(
    tag('约课扣掉了技能币'),
    afterEnroll === beforeEnroll - enrollPrice,
    `${beforeEnroll} → ${afterEnroll}（应减 ${enrollPrice}）`,
  )

  // ───────────── P3：会话状态流转 ─────────────

  await page.locator('[data-tour="sessions"]').click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: /^确认开始：与 一鸣$/ }).click()
  await page.waitForTimeout(300)
  check(tag('确认开始后进入进行中'), (await page.getByText('进行中').count()) > 0)

  await page.getByRole('button', { name: /^完成这次交换：与 一鸣$/ }).click()
  await page.waitForTimeout(300)
  check(tag('完成后标记为已完成'), (await page.getByText('已完成').count()) > 0)

  // ───────────── P3：接悬赏 ─────────────

  await page.locator('[data-tour="market"]').click()
  await page.getByRole('button', { name: '悬赏区' }).click()
  await page.waitForTimeout(250)
  const bountyTotal = await page.getByRole('button', { name: /^接单：/ }).count()
  check(tag('悬赏区有悬赏卡'), bountyTotal > 0, `${bountyTotal} 张`)
  await page.getByRole('button', { name: /^接单：/ }).first().click()
  await page.waitForTimeout(400)
  check(tag('接单后生成会话'), (await page.getByText('接单授课').count()) > 0)

  // 接过的悬赏不该还能再接一次
  await page.locator('[data-tour="market"]').click()
  await page.getByRole('button', { name: '悬赏区' }).click()
  await page.waitForTimeout(300)
  check(tag('接过的悬赏标记为已接单'), (await page.getByText('已接单').count()) > 0)
  check(tag('已接单的悬赏不再可点'), (await page.getByRole('button', { name: /^接单：/ }).count()) === bountyTotal - 1)

  // ───────────── P3：发布（凭证门槛真的拦得住） ─────────────

  await page.getByRole('button', { name: '发布课程' }).click()
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: '选择技能：Python / 爬虫' }).click()
  await page.getByLabel('课程标题').fill('爬虫陪跑：两周把你的脚本跑起来')

  // ── P4：AI 一键生成大纲 ──
  if (llmReady) {
    await page.getByRole('button', { name: '用 AI 生成大纲' }).click()
    // 轮询等文本落地，而不是等固定时长
    let outlineText = ''
    for (let i = 0; i < 40; i++) {
      outlineText = await page.getByLabel('交付大纲').inputValue()
      if (outlineText.trim()) break
      await page.waitForTimeout(250)
    }
    check(tag('AI 生成了大纲'), outlineText.includes('第 1 节'), outlineText.slice(0, 40))
  } else {
    check(
      tag('未配 key 时大纲按钮禁用并说明原因'),
      (await page.getByRole('button', { name: '用 AI 生成大纲' }).isDisabled()) &&
        (await page.getByText(/AI 生成暂不可用/).count()) > 0,
    )
    await page.getByLabel('交付大纲').fill('第 1 节 摸底：先问清你现在会什么\n第 2 节 动手：跟着做一遍')
  }

  await page.getByRole('button', { name: '认证等级：熟练' }).click()
  await page.waitForTimeout(300)
  check(tag('熟练级未上传凭证时不能提交'), await page.getByRole('button', { name: /需要先上传凭证/ }).isDisabled())

  await page.getByLabel('上传资质凭证').setInputFiles({
    name: '等级证书.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('demo'),
  })
  await page.waitForTimeout(250)
  await shot('09-publish-proof')
  const submit = page.getByRole('button', { name: '发布到集市' })
  check(tag('上传凭证后可以提交'), await submit.isEnabled())

  await submit.click()
  await page.waitForTimeout(450)
  check(
    tag('发布的课程出现在集市'),
    (await page.getByText('爬虫陪跑：两周把你的脚本跑起来').count()) > 0,
  )
  check(tag('自己的课标为「我发布的」'), (await page.getByText('我发布的').count()) > 0)
  await shot('10-market-mine')

  // ───────────── 钱包 ─────────────

  await page.locator('[data-tour="profile"]').click()
  await page.waitForTimeout(300)
  await shot('11-profile')

  // 钱包只列最近几条，但必须如实告知总数；余额也要能由流水推导出来
  const txSummary = await page.getByText(/共 \d+ 条流水/).textContent()
  check(tag('钱包如实告知流水总数'), /共 \d+ 条流水/.test(txSummary ?? ''), txSummary?.trim())
  const walletBalance = Number(await balance())
  const shownTxs = await page
    .locator('section')
    .filter({ hasText: '可用技能币' })
    .locator('li')
    .count()
  check(tag('钱包只展开最近几条'), shownTxs > 0 && shownTxs <= 6, `${shownTxs} 条`)
  check(tag('余额是正数且可观'), walletBalance > 0, `${walletBalance} 币`)

  const beforeRecharge = await balance()
  await page.getByRole('button', { name: '充值', exact: true }).click()
  await page.getByRole('dialog').waitFor({ state: 'visible' })
  await page.getByRole('button', { name: /^充值 \d+ 技能币$/ }).click()
  await page.waitForTimeout(400)
  check(tag('充值后余额变化'), (await balance()) !== beforeRecharge, `${beforeRecharge} → ${await balance()}`)

  // ───────────── P2：持久化 ─────────────

  await page.reload({ waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)

  check(tag('刷新后不再弹引导'), (await onDialog('初见 · 你是谁').count()) === 0)
  check(tag('刷新后不再弹漫游'), (await onDialog('新手漫游指引').count()) === 0)

  await page.locator('[data-tour="profile"]').click()
  await page.waitForTimeout(300)
  check(tag('刷新后昵称仍在'), await page.getByText('林一').first().isVisible())

  const persisted = await page.evaluate(() => {
    const raw = localStorage.getItem('skillswap-v1')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      teach: parsed?.state?.profile?.teachSkillIds ?? null,
      courses: parsed?.state?.myCourses?.length ?? 0,
      sessions: parsed?.state?.invitedSessions?.length ?? 0,
      overrides: Object.keys(parsed?.state?.sessionOverrides ?? {}).length,
    }
  })
  check(tag('技能已落 localStorage'), Array.isArray(persisted?.teach) && persisted.teach.length === 2, JSON.stringify(persisted?.teach))
  check(tag('发布的课程已持久化'), persisted?.courses === 1, `myCourses=${persisted?.courses}`)
  check(tag('会话与状态变更已持久化'), persisted?.sessions >= 2 && persisted?.overrides >= 1, JSON.stringify(persisted))

  /*
   * 上面故意上传了一个 .txt 触发 415，浏览器必然把这次失败的请求记进控制台。
   * 那是被测行为本身，不是缺陷，所以只把它排除掉 —— 其余任何报错仍然会让这条断言失败。
   */
  const unexpected = errors.filter((e) => !/415 \(Unsupported Media Type\)/.test(e))
  check(tag('无控制台报错'), unexpected.length === 0, unexpected.slice(0, 3).join(' | '))
  await context.close()
}

await browser.close()

console.log(
  JSON.stringify(
    {
      viewports: VIEWPORTS.map((v) => `${v.name} ${v.width}x${v.height}`),
      passed: checks.filter((c) => c.pass).length,
      failed: checks.filter((c) => !c.pass).length,
      problems,
    },
    null,
    2,
  ),
)
process.exit(problems.length ? 1 : 0)
