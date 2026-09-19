import type { FastifyInstance, FastifyReply } from 'fastify'
import { isValidSkillId, type ApiErrorBody, type GenerateOutlineRequest } from '@skillswap/shared'
import { config, llmAvailable } from '../config'
import { LlmError, chat } from '../llm/deepseek'
import { mockOutline, mockParseSkills } from '../llm/mock'
import { outlinePrompt, parseSkillsPrompt, repairPrompt } from '../llm/prompts'
import { ALL_SKILL_IDS, extractJson, sanitizeParsedSkills } from '../llm/validate'

function fail(reply: FastifyReply, status: number, code: ApiErrorBody['code'], message: string) {
  return reply.code(status).send({ code, message })
}

/** LlmError 是上游/超时一类的故障，统一映射成 502；其余按 500 处理 */
function mapError(err: unknown): { status: number; code: ApiErrorBody['code']; message: string } {
  if (err instanceof LlmError) return { status: 502, code: err.code, message: err.message }
  return {
    status: 500,
    code: 'LLM_UPSTREAM',
    message: err instanceof Error ? err.message : '未知错误',
  }
}

export async function llmRoutes(app: FastifyInstance) {
  // ── 简历 / 自介 → 技能标签 ──
  app.post('/api/llm/parse-skills', async (req, reply) => {
    const body = req.body as { text?: unknown } | null
    const text = typeof body?.text === 'string' ? body.text.trim() : ''
    if (!text) return fail(reply, 400, 'BAD_REQUEST', '缺少要解析的文本')
    if (!llmAvailable()) return fail(reply, 503, 'NO_API_KEY', '服务端未配置 DEEPSEEK_API_KEY')

    const started = Date.now()

    if (config.mock) {
      const { skills, unmatched } = mockParseSkills(text)
      return {
        skills,
        unmatched,
        model: 'mock',
        ms: Date.now() - started,
        mocked: true,
      }
    }

    try {
      const { system, user } = parseSkillsPrompt(text)
      const raw = await chat({ system, user, json: true, temperature: 0.2 })
      let result = sanitizeParsedSkills(extractJson(raw))

      // 模型返回了 id，但一个都不合法 —— 这是它不听话，回灌错误让它修一次
      if (!result.skills.length && result.droppedIds.length) {
        app.log.warn({ dropped: result.droppedIds }, '首次返回的技能 id 全部非法，重试一次')
        const repair = repairPrompt(raw, ALL_SKILL_IDS)
        const retryRaw = await chat({ ...repair, json: true, temperature: 0 })
        result = sanitizeParsedSkills(extractJson(retryRaw))
      }

      // 修完还是全非法，说明确实做不到，返回类型化错误让前端降级到手动选择
      if (!result.skills.length && result.droppedIds.length) {
        return fail(reply, 502, 'LLM_INVALID', '模型没能按技能库返回结果，请手动选择技能')
      }

      return {
        skills: result.skills,
        unmatched: result.unmatched,
        model: config.model,
        ms: Date.now() - started,
      }
    } catch (err) {
      app.log.error(err, 'parse-skills 失败')
      const mapped = mapError(err)
      return fail(reply, mapped.status, mapped.code, mapped.message)
    }
  })

  // ── 一键生成课程大纲 ──
  app.post('/api/llm/generate-outline', async (req, reply) => {
    const body = req.body as Partial<GenerateOutlineRequest> | null
    if (!body || !isValidSkillId(body.skillId) || typeof body.title !== 'string' || !body.title.trim()) {
      return fail(reply, 400, 'BAD_REQUEST', '技能或课程标题不合法')
    }
    if (!llmAvailable()) return fail(reply, 503, 'NO_API_KEY', '服务端未配置 DEEPSEEK_API_KEY')

    const request: GenerateOutlineRequest = {
      skillId: body.skillId,
      title: body.title.trim().slice(0, 120),
      level: body.level ?? 'novice',
      mode: body.mode === 'offline' ? 'offline' : 'online',
      userNote: typeof body.userNote === 'string' ? body.userNote.slice(0, 500) : undefined,
    }

    const started = Date.now()

    if (config.mock) {
      return {
        outlineMarkdown: mockOutline(request),
        model: 'mock',
        ms: Date.now() - started,
        mocked: true,
      }
    }

    try {
      const { system, user } = outlinePrompt(request)
      const outlineMarkdown = (await chat({ system, user, temperature: 0.6, maxTokens: 900 })).trim()
      return { outlineMarkdown, model: config.model, ms: Date.now() - started }
    } catch (err) {
      app.log.error(err, 'generate-outline 失败')
      const mapped = mapError(err)
      return fail(reply, mapped.status, mapped.code, mapped.message)
    }
  })
}
