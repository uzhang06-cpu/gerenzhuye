import assert from 'node:assert/strict'
import { test } from 'node:test'
import { extractJson, sanitizeParsedSkills } from './validate'

/**
 * 这个文件守的是本服务最关键的一条保证：
 * 模型返回的任何东西，只要不在分类库里，就绝不允许到达前端。
 * 所以边界情况要一条条钉死，而不是只跑一遍理想输入。
 */

test('extractJson 能剥掉 markdown 围栏', () => {
  const raw = '```json\n{"skills":[{"id":"code.python","confidence":0.9,"evidence":"x"}]}\n```'
  const parsed = extractJson(raw) as { skills: unknown[] }
  assert.equal(parsed.skills.length, 1)
})

test('extractJson 能从解释文字里抠出对象', () => {
  const raw = '好的，结果如下：{"skills":[]} 希望有帮助。'
  assert.deepEqual(extractJson(raw), { skills: [] })
})

test('extractJson 对完全不是 JSON 的输入返回 null', () => {
  assert.equal(extractJson('我不知道'), null)
  assert.equal(extractJson(''), null)
})

test('白名单丢掉不存在的 id', () => {
  const out = sanitizeParsedSkills({
    skills: [
      { id: 'code.python', confidence: 0.9, evidence: 'ok' },
      { id: 'code.rust', confidence: 0.9, evidence: '编造的' },
      { id: '随便写的', confidence: 0.9, evidence: '更离谱' },
    ],
  })
  assert.deepEqual(
    out.skills.map((s) => s.id),
    ['code.python'],
  )
  assert.deepEqual(out.droppedIds, ['code.rust', '随便写的'])
})

test('同一 id 重复出现时保留置信度更高的', () => {
  const out = sanitizeParsedSkills({
    skills: [
      { id: 'art.guitar', confidence: 0.4, evidence: '低' },
      { id: 'art.guitar', confidence: 0.85, evidence: '高' },
    ],
  })
  assert.equal(out.skills.length, 1)
  assert.equal(out.skills[0].confidence, 0.85)
  assert.equal(out.skills[0].evidence, '高')
})

test('置信度被夹进 0-1，非法值回落到默认', () => {
  const out = sanitizeParsedSkills({
    skills: [
      { id: 'code.web', confidence: 9.9, evidence: 'a' },
      { id: 'code.data', confidence: -3, evidence: 'b' },
      { id: 'code.prompt', confidence: 'x', evidence: 'c' },
    ],
  })
  const conf = Object.fromEntries(out.skills.map((s) => [s.id, s.confidence]))
  assert.equal(conf['code.web'], 1)
  assert.equal(conf['code.data'], 0)
  assert.equal(conf['code.prompt'], 0.5)
})

test('结果按置信度降序，且最多 8 项', () => {
  const all = [
    'code.python',
    'code.web',
    'code.data',
    'code.prompt',
    'art.guitar',
    'art.piano',
    'art.illustration',
    'art.vocal',
    'design.photo',
    'design.uiux',
  ]
  // 置信度随数组下标递增，所以数组末尾才是高分项
  const out = sanitizeParsedSkills({
    skills: all.map((id, i) => ({ id, confidence: i / 20, evidence: 'e' })),
  })
  assert.equal(out.skills.length, 8)
  const confs = out.skills.map((s) => s.confidence)
  assert.deepEqual(confs, [...confs].sort((a, b) => b - a))
  // 被截掉的应该是置信度最低的两条，而不是数组末尾那两条
  assert.ok(!out.skills.some((s) => s.id === 'code.python' || s.id === 'code.web'))
})

test('unmatched 去重、去空、限长，且只收字符串', () => {
  const out = sanitizeParsedSkills({
    skills: [],
    unmatched: ['乐器维修', '乐器维修', '  ', 42, null, 'A'.repeat(80)],
  })
  assert.equal(out.unmatched.length, 2)
  assert.equal(out.unmatched[0], '乐器维修')
  assert.equal(out.unmatched[1].length, 40)
})

test('evidence 超长被截断', () => {
  const out = sanitizeParsedSkills({
    skills: [{ id: 'code.python', confidence: 0.5, evidence: 'x'.repeat(500) }],
  })
  assert.equal(out.skills[0].evidence.length, 120)
})

test('缺字段与畸形输入都不会抛异常', () => {
  assert.deepEqual(sanitizeParsedSkills(null).skills, [])
  assert.deepEqual(sanitizeParsedSkills('字符串').skills, [])
  assert.deepEqual(sanitizeParsedSkills({ skills: '不是数组' }).skills, [])
  assert.deepEqual(sanitizeParsedSkills({ skills: [null, 1, 'x', {}] }).skills, [])
})
