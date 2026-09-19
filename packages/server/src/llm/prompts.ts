import { getSkill, getTier, serializeTaxonomyForPrompt } from '@skillswap/shared'
import type { GenerateOutlineRequest } from '@skillswap/shared'

/**
 * 技能分类的 prompt。
 *
 * 分类库本身由 serializeTaxonomyForPrompt 从共享模块生成，
 * 与校验用的 isValidSkillId 是同一份数据 —— 这两处一旦不一致就会静默出错，
 * 所以绝不允许在这里手写技能名。
 */
export function parseSkillsPrompt(text: string) {
  const system = [
    '你的唯一任务：把用户的简历或自我介绍，映射到下面这份固定的技能库上。',
    '',
    '技能库（每行格式：id | 名称 | 别名）：',
    serializeTaxonomyForPrompt(),
    '',
    '规则：',
    '1. 只能从上面出现过的 id 里选，绝对不许编造新的 id。',
    '2. 用户提到但技能库里没有对应项的说法，原样放进 unmatched 数组。',
    '3. 每个命中项都要给 evidence：照抄用户原文里支撑判断的短语，不要改写、不要总结。',
    '4. confidence 是 0 到 1 之间的小数，表示用户确实具备该技能的把握。',
    '5. 宁少不错：只是「感兴趣」「想学」「在了解」的不算具备，不要命中。',
    '6. skills 最多 8 项，按 confidence 从高到低排。',
    '7. 只输出 json，不要解释文字，不要 markdown 代码块。',
    '',
    '输出格式（严格遵守）：',
    '{"skills":[{"id":"code.python","confidence":0.9,"evidence":"三年 Python 爬虫开发"}],"unmatched":["乐器维修"]}',
  ].join('\n')

  return { system, user: text.slice(0, 6000) }
}

/** 生成大纲用的 prompt。这个场景不需要 JSON，直接要正文。 */
export function outlinePrompt(req: GenerateOutlineRequest) {
  const skill = getSkill(req.skillId)
  const tier = getTier(req.level)

  const system = [
    '你是课程设计助手，为技能互换平台上的一节小课写交付大纲。',
    '',
    '要求：',
    '- 4 到 5 节，每节一行，格式为「第 N 节 标题：这一节解决什么问题」。',
    '- 面向成年人业余学习，每节 45–60 分钟，只写一节课真能交付的东西，不要画大饼。',
    '- 写法要具体到动作（例如「拆三个真实案例」「当场录音复盘」），不要写「深入理解」这类空话。',
    '- 不要写价格、不要写营销话术、不要开场白和结束语。',
    '- 直接输出大纲正文，不要 markdown 标题、不要代码块。',
  ].join('\n')

  const user = [
    `技能：${skill?.label ?? req.skillId}`,
    `课程标题：${req.title}`,
    `导师认证等级：${tier.label}（${tier.levelLabel}）— ${tier.positioning}`,
    `授课方式：${req.mode === 'online' ? '线上会议' : '同城线下'}`,
    req.userNote ? `导师自己的说明：${req.userNote}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return { system, user }
}

/** 第一次返回的 id 全都不合法时，把错误结果回灌让它自己修一次 */
export function repairPrompt(rawOutput: string, validIds: string[]) {
  const system = [
    '你上次的输出里，skills 数组的 id 一个都不在允许的列表里。',
    '请重新输出 json，只使用下面这些 id，不要编造，也不要输出任何解释：',
    validIds.join(', '),
    '',
    '输出格式：{"skills":[{"id":"...","confidence":0.8,"evidence":"原文片段"}],"unmatched":[]}',
  ].join('\n')

  return { system, user: rawOutput.slice(0, 2000) }
}
