/**
 * 运行配置。dev 下自动读项目根的 .env（Node 22+ 的 process.loadEnvFile），
 * 生产环境靠 Sealos 注入环境变量，那里没有 .env 文件。
 */
if (process.env.NODE_ENV !== 'production') {
  try {
    process.loadEnvFile('.env')
  } catch {
    // 没有 .env 就用默认值，不该因此启动失败
  }
}

export const config = {
  apiKey: (process.env.DEEPSEEK_API_KEY ?? '').trim(),
  model: (process.env.DEEPSEEK_MODEL ?? '').trim() || 'deepseek-flash',
  baseUrl: ((process.env.DEEPSEEK_BASE_URL ?? '').trim() || 'https://api.deepseek.com').replace(
    /\/$/,
    '',
  ),
  /** 没有 key 时用它跑通整条链路，返回的一定是分类库内的合法 id */
  mock: process.env.MOCK_LLM === '1',
  timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 30_000),
  port: Number(process.env.PORT ?? 80),
}

/** LLM 是否可用。前端通过 /api/health 拿到这个值，据此决定要不要露出 AI 入口。 */
export function llmAvailable(): boolean {
  return config.mock || config.apiKey.length > 0
}
