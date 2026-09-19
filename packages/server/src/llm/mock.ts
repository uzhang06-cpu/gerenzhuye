import { ALL_SKILLS, getSkill, getTier, type GenerateOutlineRequest, type ParsedSkill } from '@skillswap/shared'

/**
 * MOCK_LLM=1 时走的本地模拟。
 *
 * 刻意用「按别名做子串匹配」而不是返回固定假数据：
 * 它天生只会产出分类库内的合法 id，同时又真的会随输入变化，
 * 这样在没有 key 的情况下也能把整条链路（含自动点亮技能、灰显未命中项）跑通并截图。
 */
export function mockParseSkills(text: string): { skills: ParsedSkill[]; unmatched: string[] } {
  const lower = text.toLowerCase()
  const skills: ParsedSkill[] = []

  for (const skill of ALL_SKILLS) {
    const hits = [skill.label, ...skill.aliases].filter((a) => lower.includes(a.toLowerCase()))
    if (!hits.length) continue
    skills.push({
      id: skill.id,
      confidence: Math.min(0.95, 0.55 + hits.length * 0.12),
      evidence: hits.slice(0, 2).join('、'),
    })
  }

  skills.sort((a, b) => b.confidence - a.confidence)

  return {
    skills: skills.slice(0, 8),
    // 模拟通道不用假装发现了库外技能，留空比编一个更诚实
    unmatched: [],
  }
}

export function mockOutline(req: GenerateOutlineRequest): string {
  const skill = getSkill(req.skillId)?.label ?? req.skillId
  const tier = getTier(req.level)

  return [
    `第 1 节 摸底与边界对齐：用十分钟问清你现在的基础和真实目标，当场定下这门课交付到哪一步`,
    `第 2 节 最小可用动作：把「${skill}」拆成今天就能上手的第一步，你跟着做一遍，我在旁边纠错`,
    `第 3 节 三个真实案例对照：拿三个典型场景对比，指出新手最容易卡住的位置和绕过办法`,
    `第 4 节 独立走完一遍：你自己完整做一次，我只提问不代做，做完当场复盘问题出在哪`,
    `第 5 节 课后怎么练：给出接下来两周的练习安排和自查标准（按${tier.label}级的交付深度）`,
    req.mode === 'offline' ? '同城线下：材料与设备我会提前列清单给你' : '线上会议：课前发你一份可复用的清单',
  ].join('\n')
}
