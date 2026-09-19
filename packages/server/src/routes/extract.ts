import type { FastifyInstance } from 'fastify'
import type { ExtractTextResponse } from '@skillswap/shared'
import { extractByFilename } from '../llm/extract'

const MAX_MB = 8

/**
 * 简历文件 → 纯文本。
 *
 * 刻意只做提取，不顺手做分类：让用户先看到提取出来的文字、改掉乱码，
 * 再交给 parse-skills。一条龙看起来省事，但提取出错时用户完全无从下手。
 */
export async function extractRoutes(app: FastifyInstance) {
  app.post('/api/extract-text', async (req, reply) => {
    const tooLarge = {
      code: 'FILE_TOO_LARGE' as const,
      message: `文件不能超过 ${MAX_MB} MB`,
    }

    const file = await req.file().catch(() => null)
    if (!file) {
      return reply.code(400).send({ code: 'BAD_REQUEST', message: '没有收到文件' })
    }

    let buffer: Buffer
    try {
      // 超过 limits 时 toBuffer 会抛错，而不是静默截断
      buffer = await file.toBuffer()
    } catch {
      return reply.code(413).send(tooLarge)
    }

    const filename = file.filename || 'resume'

    try {
      const { text, scanned } = await extractByFilename(filename, buffer)
      if (!text) {
        return reply.code(422).send({
          code: 'EXTRACT_FAILED',
          message: '这个文件里没读到文字，可能是扫描件。直接粘贴文本一样可以识别。',
        })
      }
      const body: ExtractTextResponse = { filename, text, chars: text.length, scanned }
      return body
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message.startsWith('UNSUPPORTED:')) {
        const ext = message.slice('UNSUPPORTED:'.length)
        return reply.code(415).send({
          code: 'UNSUPPORTED_FILE',
          message: `暂不支持 ${ext || '这种'} 格式，请上传 PDF 或 .docx，或者直接粘贴文本`,
        })
      }
      app.log.error(err, 'extract-text 失败')
      return reply.code(422).send({
        code: 'EXTRACT_FAILED',
        message: '读取这个文件时出错，请改用粘贴文本',
      })
    }
  })
}
