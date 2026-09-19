# SkillSwap（技能互换平台）产品与开发落地方案

> 原始需求存档（用户提供，2026-09-19）。本文件是唯一权威需求源，后续实现以此为准。
> 交付形态：**美观的手机端仿 App 网页产品**。

## 一、产品架构与核心定位

- **产品名称**：SkillSwap（或拟定名：“技搭”）
- **产品定位**：基于“双向技能交换 + 技能币流通”的双轨制 C2C 技能互助平台。
- **核心解法**：
  - 通过 AI 解析降低建档门槛
  - 通过“等级与认证体系”建立履约信任
  - 通过“直接交换 + 集市代币”破除撮合匹配瓶颈

## 二、首次进入：3 步引导式美观流式弹窗（Onboarding Funnel）

沉浸式全屏弹窗（Modal / Stepper），背景支持平滑模糊（Backdrop Blur）与渐变动效，右上角进度指示器（1/3、2/3、3/3）。

### Step 1：「初见·你是谁」（身份与基本信息）

- 文案契机：“开始交换前，先让我们认识独特的你”
- 输入项：
  - 头像上传（支持默认萌趣头像一键生成）
  - 用户昵称（必填，限制 12 字符）
  - 身份标签（如：在校学生、职场新人、自由职业者、斜杠青年）
  - 一句话个人签名/交换宣言（选填，如“想用吉他换一切编程技能”）
- 交互：点击“下一步：点亮我的技能库”进入 Step 2。

### Step 2：「能力·我会什么」（AI 智能技能录入）

- 文案契机：“展示你的闪光点，每个人都有能教会别人的事情”
- 双通道技能输入设计：
  1. **AI 简历/自我介绍智能解析通道**：支持拖拽上传 PDF / Word 简历，或点击“粘贴文本/即兴介绍”。Agent 侧调用 LLM 提取技能关键词，自动与平台的二级级联技能库映射并高亮选中。
  2. **二级级联手动点选通道**（Cascader / Tree-Select）：用户可直观检索或按分类点选。
- **【关键配置】二级级联技能库规范**（供 Agent 快速初始化 JSON）：

  | 一级分类 | 二级技能 |
  | --- | --- |
  | 编程与科技 | Python / 爬虫、Web前端 / React、数据分析 / SQL、AI提示词工程 / 提效 |
  | 艺术与音乐 | 民谣吉他 / 尤克里里、钢琴伴奏、数字插画 / Procreate、声乐进阶 |
  | 视觉与设计 | 摄影构图 / 后期调色、UI/UX原型设计、视频剪辑 / PR/剪映、3D建模 |
  | 生活与语言 | 日常口语 / 雅思托福、小语种入门、烘焙料理、健身塑形 / 动作指导 |
  | 职场与学术 | 求职面试辅导、论文写作逻辑、商业计划书编制、产品需求拆解 |

- 交互：用户选定技能后生成精美的“我的技能气泡芯片（Chips）”，支持点击“下一步：挑选我的心愿”进入 Step 3。

### Step 3：「心愿·你想收获什么」（智能推荐与心愿清单）

- 文案契机：“最最重要的——我们希望你收获成长，你想学会什么？”
- 视觉与交互：
  - 视觉中心为一个“心愿清单收集器”。
  - **智能排他性推荐**：系统自动过滤 Step 2 中用户已掌握的技能，结合当下最热门的技能分类，以动态呼吸灯/高亮卡片形式推荐（如“大家都在学的 Top 10”）。
  - 检索与选择：顶部支持全局技能模糊检索，支持从二级技能库中点选。
- 交互：点击“开启技能互换之旅”，完成初始化建档并进入主界面。

## 三、首次进入主界面：新手交互漫游指引（Feature Tour）

完成 Step 3 首次降落主界面时，遮罩变暗，触发 4 步引导式气泡（Popover Tour），帮助用户建立对底部导航栏的心智：

1. **指引 1 · 对对碰（交换）**：“这里是你的主匹配区！系统已根据你‘能教的’和‘想学的’算出了最高契合度伙伴，双向奔赴直接发起互换。”
2. **指引 2 · 公开集市（集市）**：“遇不到双向匹配？来集市用「技能币」向大神悬赏或挑选心仪课程，单向也能自由学。”
3. **指引 3 · 我的主页（我的）**：“管理你的个人资料、课程进度，查看你的技能币钱包、充值与会员权益。”
4. **指引 4（终局行动催化）· 中间【+（发布）】**：“最后一步，也是最重要的一步：点击中间的「+」，把你的技能打包成一个课程，才能被大家发现并开启交换哦！”点击“立即去发布”，直接唤起发布弹窗，完成冷启动发布闭环。

## 四、底部导航栏与四大核心模块

固定底部导航栏（Bottom Navigation Bar）：

```
[ 🔀 对对碰 (Swap) ]   [ 🛒 技能集市 (Market) ]   [ ➕ 发布 (Publish) ]   [ 👤 个人主页 (Profile) ]
```

### 1. 【对对碰】（智能互换中心）

- **定位**：极速撮合双向匹配用户。
- **核心功能**：
  - 卡片式双向展示：卡片上半部分标明对方「能教：吉他编配（熟练级）」，下半部分标明对方「想学：Python自动化（小白级）」。
  - AI 契合度标签：高亮显示“98% 契合（双向互补）”。
  - 交互动作：支持“发起互换邀请”（锁定彼此时间）、“稍后再看”。

### 2. 【技能集市】（技能币流转交易池）

- **定位**：解决单向需求，破除“双重巧合难题”。
- **核心功能**：
  - 公开课时流：用户上架的明码标价课程（例如：“Python爬虫0到1实战 · 30技能币/小时”）。
  - 学时悬赏区：需求方发布悬赏（例如：“出 50 技能币找个摄影师教人像布光”）。
  - 筛选维度：按二级技能分类、导师等级（小白/熟练/精英）、好评率、所需技能币区间筛选。

### 3. 【+ 发布】（课程与技能供给发布 — 中间高亮主键）

- **定位**：用户将自己的知识能力产品化。
- **表单要素**：
  - 选择关联技能（从已掌握技能中选择）
  - 课程标题与交付大纲（提供 AI 一键生成大纲功能）
  - 授课方式（线上会议 / 同城线下）
- **【核心机制】技能准入三级认证分层**：

  1. **小白级（Lv.1 陪伴型）**
     - 门槛：无需上传凭证，一键发布
     - 定位：自学打卡伙伴、练习督促、初级入门答疑
     - 权益：收费上限较低（如 5-15 币/小时），重在建立同伴陪伴感
  2. **熟练级（Lv.2 进阶型）**
     - 门槛：必须上传凭证材料（如职业资格证、考级证书、作品集链接、GitHub 仓库等）
     - 定位：体系化实操传授
     - 审核：资质凭证由平台后台/算法进行真实性校验
  3. **精英级（Lv.3 导师型）**
     - 门槛：凭证达标 + 平台运营 1 对 1 面试考核
     - 定位：高阶行业技能、求职冲刺、专家级一对一指导
     - 机制：发布时勾选“申请精英考核”，提交预约面试时间段，运营审核通过后点亮“金牌导师认证”，享有集市首页推荐位与高技能币定价权

### 4. 【我的】（个人资产、履约与声誉主页）

- **个人声誉名片**：昵称、认证等级勋章、完成交换次数、准时履约率（防鸽子指标）
- **技能币钱包（Wallet）**：
  - 余额展示：当前可用技能币、冻结中代币（履约中）
  - 获取记录：教人获得的收入流水
  - 充值入口：支持直接充值技能币（破冰初期缺乏代币的用户）
- **会员增值（VIP Pass）**：免手续费、每月赠送置顶推荐卡、优先解锁精英级导师
- **履约工作台（My Sessions）**：进行中的交换进度、待打卡日程、待相互评价订单
- **系统设置**：账号安全、技能库重新校准、消息提醒、黑名单等

## 五、开发执行提示词（原始 Implementation Prompt）

```
Role: Senior Full-Stack Engineer & UI/UX Designer.
Task: Scaffold and implement a clean, modern prototype for "SkillSwap (技能互换平台)" based on the following exact specs:

1. Visual Style:
- Aesthetic: Modern Tailwind CSS design, clean typography (Inter / PingFang), dynamic subtle gradients, cards with drop-shadows and rounded-2xl corners, backdrop blur for modals.

2. Onboarding Modal Flow (Triggered on first load, step-by-step):
- Step 1 [Identity]: Avatar picker, Nickname, Role Tag, Bio.
- Step 2 [Skills I Can Teach]:
  * File dropzone with a simulated "AI Resume Parsing" button that auto-populates skills.
  * Hierarchical 2-level Cascader Skill Picker:
    - 编程与科技 (Python, Web前端, 数据分析, AI Prompt)
    - 艺术与音乐 (民谣吉他, 钢琴伴奏, 数字插画, 声乐进阶)
    - 视觉与设计 (摄影构图, UI/UX设计, 视频剪辑, 3D建模)
    - 生活与职场 (英语口语, 烘焙料理, 面试辅导, 论文逻辑)
- Step 3 [Skills I Want To Learn]:
  * Smart recommendation cards excluding skills picked in Step 2.
  * Search input to quickly add wanted skill tags.
  * Button "开启技能互换之旅" to enter main view.

3. Interactive Tour (Popover Guide after Onboarding):
- 4 steps highlighting bottom navigation:
  1. 对对碰 (Swap matching)
  2. 技能集市 (Market with coins)
  3. 个人主页 (Profile & Wallet)
  4. Publish Button (+) with CTA "立即去发布你的第一个技能课程".

4. Bottom Navigation & Core Views:
- Tab 1: 对对碰 (Cards showing "Teach" & "Learn" tags with AI Match Score, e.g. 96%).
- Tab 2: 技能集市 (Marketplace feed filtered by 2-level skills, coin price, and mentor levels).
- Tab 3: 发布中心 (Modal triggered by middle '+' button):
  * Select skill from user's learned skills.
  * Level radio selection with clear tier requirements:
    - 小白 (No proof required, companionship)
    - 熟练 (Proof/Certificate upload required)
    - 精英 (Proof required + "预约平台运营面试考核" checkbox)
- Tab 4: 个人主页 (Profile card, Skill Coin wallet balance, Recharging modal, Member VIP section, Settings).

Tech Stack: React / Next.js, Tailwind CSS, Lucide-react (icons), Framer Motion (for smooth step animations).
State Management: Use React Context or Zustand with localStorage persistence so that onboarding status and user-created courses persist across refreshes.
```

## 六、协作方式（用户指定流程）

**澄清需求 → 分阶段落地 → 交付测试**，逐阶段确认后再推进。

## 七、待澄清清单

> 这些是文档中未明确、需要在动工前定下的决策点。

- [ ] 技术栈最终选型（Next.js 原文 vs Vite SPA vs 单文件 HTML）
- [ ] 数据层：纯 localStorage mock / mock API / 真后端
- [ ] 第一阶段交付范围与优先级
- [ ] 视觉方向（配色、明暗、调性）
- [ ] 「技能币」充值是否走真实支付（mock 即可？）
- [ ] 消息/交换中 Tab 是否纳入（导航栏描述为“五位四栏”，存在歧义）
- [ ] AI 简历解析：真实调用 LLM 还是前端模拟
