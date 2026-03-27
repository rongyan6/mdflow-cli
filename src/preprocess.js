import { execFile } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const MERMAID_BLOCK_REGEX = /```mermaid\r?\n([\s\S]*?)\r?\n```/g
const moduleDir = path.dirname(fileURLToPath(import.meta.url))

function escapeMarkdownAlt(text) {
  return String(text).replaceAll('[', '\\[').replaceAll(']', '\\]')
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/')
}

function createAssetFileName(code, index) {
  const hash = createHash('sha1').update(code).digest('hex').slice(0, 6)
  return `mermaid-${index + 1}-${hash}.png`
}

function resolveMmdcPath() {
  return path.resolve(
    moduleDir,
    '..',
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'mmdc.cmd' : 'mmdc',
  )
}

async function renderMermaidBlockToPng(code, index, context) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mdflow-mermaid-'))
  const inputFile = path.join(tempDir, `diagram-${index}.mmd`)
  const outputFile = path.join(tempDir, `diagram-${index}.png`)
  const configFile = path.join(tempDir, `diagram-${index}.json`)

  try {
    await writeFile(inputFile, code, 'utf8')
    await writeFile(
      configFile,
      JSON.stringify({
        backgroundColor: 'transparent',
      }),
      'utf8',
    )

    const mmdcPath = resolveMmdcPath()
    await execFileAsync(
      mmdcPath,
      [
        '-i',
        inputFile,
        '-o',
        outputFile,
        '-e',
        'png',
        '-b',
        'transparent',
        '-p',
        configFile,
      ],
      {
        maxBuffer: 20 * 1024 * 1024,
      },
    )

    const assetDir = path.join(
      path.dirname(context.markdownPath),
      'assets',
    )
    await mkdir(assetDir, { recursive: true })

    const assetFileName = createAssetFileName(code, index)
    const assetFilePath = path.join(assetDir, assetFileName)
    await copyFile(outputFile, assetFilePath)

    const relativePath = path.relative(path.dirname(context.htmlOutputPath), assetFilePath)
    const href = encodeURI(toPosixPath(relativePath))
    return `![${escapeMarkdownAlt(`mermaid diagram ${index + 1}`)}](${href})`
  }
  finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

export async function preprocessMarkdown(markdown, options = {}) {
  let hasMermaid = false
  const matches = [...markdown.matchAll(MERMAID_BLOCK_REGEX)]

  if (!matches.length) {
    return markdown
  }

  let result = markdown

  for (const [index, match] of matches.entries()) {
    const rawBlock = match[0]
    const code = match[1].trim()
    hasMermaid = true

    try {
      const imageMarkdown = await renderMermaidBlockToPng(code, index, {
        markdownPath: options.markdownPath,
        htmlOutputPath: options.htmlOutputPath,
      })
      result = result.replace(rawBlock, imageMarkdown)
    }
    catch (error) {
      if (options.onWarning) {
        const message = error instanceof Error ? error.message : String(error)
        options.onWarning(`Mermaid 渲染失败，已保留原始代码块: ${message}`)
      }
    }
  }

  if (hasMermaid && options.onInfo) {
    options.onInfo(`已将 Mermaid 代码块转换为 PNG 图片`)
  }

  return result
}
