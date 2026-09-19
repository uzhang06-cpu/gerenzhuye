/**
 * 简历文本提取。
 *
 * 拆成独立一步（先出纯文本，再交给 parse-skills 做分类）而不是一条龙：
 * 提取是确定性的、可以单独验证的；而且用户能先看到提取结果、改掉乱码再解析。
 * 扫描件本来就提取不出文字，粘贴通道无论如何都得留着。
 */

/** 提取到的字符数低于这个值，基本可以断定是扫描件或图片型 PDF */
const SCANNED_THRESHOLD = 40

export function looksScanned(text: string): boolean {
  return text.replace(/\s/g, '').length < SCANNED_THRESHOLD
}

export async function extractPdf(buffer: Buffer): Promise<string> {
  // Node 环境要用 legacy 构建，现代构建依赖浏览器 API
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

  // destroy() 在 loading task 上，不在 document proxy 上（v6 的 API）
  const task = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    // 提取文字用不到系统字体，关掉可以少一堆资源加载与警告
    useSystemFonts: false,
  })

  try {
    const doc = await task.promise
    const pages: string[] = []
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      pages.push(
        content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim(),
      )
    }
    return pages.filter(Boolean).join('\n')
  } finally {
    await task.destroy()
  }
}

export async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
  const { value } = await mammoth.extractRawText({ buffer })
  return value.replace(/\n{3,}/g, '\n\n').trim()
}

export interface ExtractResult {
  text: string
  scanned: boolean
}

export async function extractByFilename(filename: string, buffer: Buffer): Promise<ExtractResult> {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'))
  if (ext === '.pdf') {
    const text = await extractPdf(buffer)
    return { text, scanned: looksScanned(text) }
  }
  if (ext === '.docx') {
    const text = await extractDocx(buffer)
    return { text, scanned: looksScanned(text) }
  }
  // 旧版二进制 .doc 不在这里支持：格式封闭且工具链难缠，让用户粘贴更快
  throw new Error(`UNSUPPORTED:${ext}`)
}
