import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import type { HealthResponse } from '@skillswap/shared'
import { config, llmAvailable } from './config'
import { logAvailableModels } from './llm/deepseek'
import { extractRoutes } from './routes/extract'
import { llmRoutes } from './routes/llm'

/**
 * SkillSwap 服务端。
 *
 * 它只做两件事：托管前端静态产物，以及把需要密钥的 LLM 调用挡在服务端。
 * 没有数据库、没有鉴权、单用户 —— 这是刻意的，API key 永远不进浏览器。
 */
const HOST = '0.0.0.0'

/**
 * 静态产物目录。
 * 容器里 bundle 在 /app/dist，产物在 /app/public，所以默认取 ../public；
 * 本地直接跑 dist 时布局不同，用 PUBLIC_DIR 指过去即可。
 */
// @fastify/static 要求绝对路径，相对路径会直接抛错
const publicDir = path.resolve(
  process.env.PUBLIC_DIR ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '../public'),
)

const app = Fastify({ logger: true })

app.get('/api/health', async (): Promise<HealthResponse> => ({
  ok: true,
  version: process.env.APP_VERSION ?? 'dev',
  uptime: Math.round(process.uptime()),
  llm: {
    configured: llmAvailable(),
    mocked: config.mock,
    model: config.mock ? 'mock' : config.model,
  },
}))

app.register(fastifyMultipart, { limits: { fileSize: 8 * 1024 * 1024, files: 1 } })
app.register(llmRoutes)
app.register(extractRoutes)

app.register(fastifyStatic, {
  root: publicDir,
  index: ['index.html'],
  cacheControl: false,
  // 注意：这个回调收到的是 Fastify 的 reply，不是 Node 的 res，所以用 reply.header()
  setHeaders(reply, filepath) {
    const base = path.basename(filepath)
    if (base === 'index.html') {
      // 入口文件绝不能缓存，否则发版后用户永远拿到旧的 asset 引用
      reply.header('Cache-Control', 'no-cache')
    } else if (filepath.includes(`${path.sep}assets${path.sep}`)) {
      // Vite 只把带内容哈希的文件放进 assets/，所以整目录都可以长缓存。
      // 比去猜哈希的字符形态可靠得多。
      reply.header('Cache-Control', 'public, max-age=604800, immutable')
    } else {
      reply.header('Cache-Control', 'public, max-age=86400')
    }
  },
})

/**
 * SPA 兜底。
 * 带扩展名的请求是找静态资源，找不到就必须老实回 404 ——
 * 若也回 index.html，前端会把一个 HTML 当成 JS/CSS 解析，报错会非常难查。
 */
app.setNotFoundHandler((req, reply) => {
  if (req.url.startsWith('/api/')) {
    return reply.code(404).send({ code: 'NOT_FOUND', message: `没有这个接口：${req.url}` })
  }
  if (path.extname(req.url)) {
    return reply.code(404).send({ code: 'NOT_FOUND', message: `没有这个文件：${req.url}` })
  }
  reply.header('Cache-Control', 'no-cache')
  return reply.sendFile('index.html')
})

app
  .listen({ port: config.port, host: HOST })
  .then(() => {
    app.log.info(`SkillSwap 已启动：http://${HOST}:${config.port}`)
    return logAvailableModels(app.log)
  })
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
