import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deflateRawSync } from 'node:zlib'
import { extractByFilename, looksScanned } from './extract'

/**
 * .docx 用现造的最小文件来测，不依赖外部素材 ——
 * 否则这条路径就只能靠「上线后有人传了个 Word 才知道行不行」。
 * docx 本质是个 zip，这里手写一个只含必要条目的 STORED/DEFLATE 包。
 */
function crc32(buf: Buffer): number {
  let c: number
  const table: number[] = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function makeZip(files: { name: string; content: string }[]): Buffer {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0

  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf8')
    const raw = Buffer.from(f.content, 'utf8')
    const deflated = deflateRawSync(raw)
    const crc = crc32(raw)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(8, 8) // deflate
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(deflated.length, 18)
    local.writeUInt32LE(raw.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    locals.push(local, nameBuf, deflated)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(8, 10)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(deflated.length, 20)
    central.writeUInt32LE(raw.length, 24)
    central.writeUInt16LE(nameBuf.length, 28)
    central.writeUInt32LE(offset, 42)
    centrals.push(central, nameBuf)

    offset += local.length + nameBuf.length + deflated.length
  }

  const centralBuf = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralBuf.length, 12)
  end.writeUInt32LE(offset, 16)

  return Buffer.concat([...locals, centralBuf, end])
}

function makeDocx(paragraphs: string[]): Buffer {
  const body = paragraphs.map((p) => `<w:p><w:r><w:t>${p}</w:t></w:r></w:p>`).join('')
  return makeZip([
    {
      name: '[Content_Types].xml',
      content:
        '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    },
    {
      name: '_rels/.rels',
      content:
        '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    },
    {
      name: 'word/document.xml',
      content: `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`,
    },
  ])
}

test('docx 能被提取出正文文字', async () => {
  // 文本要足够长，否则会落进「疑似扫描件」的判定里，那是另一条测试的事
  const buf = makeDocx([
    '三年 Python 爬虫与数据抓取开发经验，负责过日均千万级页面的采集调度系统。',
    '业余弹民谣吉他五年，能带零基础学员从四个和弦弹到完整弹唱。',
  ])
  const { text, scanned } = await extractByFilename('张三的简历.docx', buf)
  assert.match(text, /Python 爬虫/)
  assert.match(text, /民谣吉他/)
  assert.equal(scanned, false)
})

test('不支持的格式抛出可识别的错误', async () => {
  await assert.rejects(
    () => extractByFilename('resume.txt', Buffer.from('hello')),
    /UNSUPPORTED:\.txt/,
  )
})

test('旧版二进制 .doc 不给过', async () => {
  await assert.rejects(() => extractByFilename('resume.doc', Buffer.from('x')), /UNSUPPORTED:\.doc/)
})

test('文字过少判定为扫描件', () => {
  assert.equal(looksScanned(''), true)
  assert.equal(looksScanned('   短   '), true)
  // 空白不算数，要看非空白字符
  assert.equal(looksScanned('张'.repeat(39)), true)
  assert.equal(looksScanned('张'.repeat(40)), false)
  assert.equal(looksScanned('这是一份正常长度的简历正文'.repeat(5)), false)
})
