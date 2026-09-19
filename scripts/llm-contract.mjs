/**
 * DeepSeek 请求契约测试。
 *
 * 用一个假扮 DeepSeek 的本地服务替代真实 API，因此**不需要 API key** 就能验证：
 *   1. 请求打到了正确的端点、带正确的鉴权头
 *   2. body 里有 JSON 模式所需的字段，且 prompt 里确实出现了 "json" 字样与完整技能库
 *   3. 模型返回全非法 id 时，服务端会降温重试一次，并最终给出合法结果
 *
 * 第 3 条是真实 key 也未必能复现的路径（要靠模型真的不听话），所以这层用桩来保证。
 *
 * 用法：node scripts/llm-contract.mjs
 */
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'

const STUB_PORT = 8899
const APP_PORT = 8790
const ROOT = new URL('..', import.meta.url).pathname

const failures = []
const check = (name, pass, detail) => {
  console.log(`${pass ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!pass) failures.push(name)
}

let calls = 0
const seen = []

const stub = createServer((req, res) => {
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    if (req.url === '/models') {
      res.writeHead(200, { 'content-type': 'application/json' })
      return res.end(JSON.stringify({ data: [{ id: 'deepseek-flash' }] }))
    }
    calls += 1
    seen.push({ auth: req.headers.authorization, body: JSON.parse(body || '{}') })
    // 第一次故意全给非法 id，逼出修复重试；第二次才给合法结果
    const payload =
      calls === 1
        ? { skills: [{ id: 'totally.made.up', confidence: 0.9, evidence: 'x' }], unmatched: [] }
        : { skills: [{ id: 'art.guitar', confidence: 0.88, evidence: '弹了五年吉他' }], unmatched: ['乐器维修'] }
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(payload) } }] }))
  })
})

await new Promise((r) => stub.listen(STUB_PORT, r))

const app = spawn('node', ['packages/server/dist/index.js'], {
  cwd: ROOT,
  env: {
    ...process.env,
    DEEPSEEK_API_KEY: 'contract-test-key',
    DEEPSEEK_BASE_URL: `http://localhost:${STUB_PORT}`,
    PORT: String(APP_PORT),
    PUBLIC_DIR: 'packages/client/dist',
  },
  stdio: 'ignore',
})

try {
  await new Promise((r) => setTimeout(r, 2500))

  const res = await fetch(`http://localhost:${APP_PORT}/api/llm/parse-skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: '我弹了五年吉他' }),
  })
  const out = await res.json()

  check('请求打到 /chat/completions 且带 Bearer 鉴权', seen[0]?.auth === 'Bearer contract-test-key', seen[0]?.auth)
  check('请求体 model 正确', seen[0]?.body.model === 'deepseek-flash', seen[0]?.body.model)
  check('开启 JSON 模式', seen[0]?.body.response_format?.type === 'json_object')
  check('prompt 含 "json" 字样（DeepSeek 的硬性要求）', /json/i.test(JSON.stringify(seen[0]?.body.messages ?? [])))
  check('system prompt 内联了完整技能库', /code\.python/.test(seen[0]?.body.messages?.[0]?.content ?? ''))
  check('首次调用温度 0.2', seen[0]?.body.temperature === 0.2, String(seen[0]?.body.temperature))

  check('非法 id 触发了修复重试（共 2 次调用）', calls === 2, `${calls} 次`)
  check('重试把温度降到 0', seen[1]?.body.temperature === 0, String(seen[1]?.body.temperature))
  check('重试的 system prompt 里带了合法 id 清单', /art\.guitar/.test(seen[1]?.body.messages?.[0]?.content ?? ''))

  check('最终返回的是修复后的合法结果', out?.skills?.[0]?.id === 'art.guitar', JSON.stringify(out?.skills))
  check('未匹配项如实透传', out?.unmatched?.[0] === '乐器维修', JSON.stringify(out?.unmatched))
  check('非法 id 没有出现在响应里', !JSON.stringify(out).includes('totally.made.up'))
} finally {
  app.kill()
  stub.close()
}

console.log(failures.length ? `\n${failures.length} 项未通过` : '\n全部通过')
process.exit(failures.length ? 1 : 0)
