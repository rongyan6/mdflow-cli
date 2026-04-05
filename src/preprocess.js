import { mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { convertMermaid } from '@rongyan/mermaid-plus-cli'

const MERMAID_BLOCK_REGEX = /```mermaid\r?\n([\s\S]*?)\r?\n```/g

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

function resolveAssetDir(context) {
  if (context.assetDir) {
    return path.resolve(context.assetDir)
  }
  if (context.markdownPath) {
    return path.join(path.dirname(context.markdownPath), 'assets')
  }
  return path.join(process.cwd(), 'assets')
}

function toAssetHref(assetFilePath, htmlOutputPath) {
  if (htmlOutputPath) {
    return encodeURI(
      toPosixPath(path.relative(path.dirname(htmlOutputPath), assetFilePath)),
    )
  }

  if (process.platform === 'win32') {
    return pathToFileURL(assetFilePath).href
  }

  return encodeURI(toPosixPath(assetFilePath))
}

async function renderMermaidBlockToPng(code, index, context) {
  const assetDir = resolveAssetDir(context)
  await mkdir(assetDir, { recursive: true })

  const assetFileName = createAssetFileName(code, index)
  const assetFilePath = path.join(assetDir, assetFileName)

  await convertMermaid(code, assetFilePath, {
    theme: context.mermaidTheme ?? 'github-light',
    width:  context.mermaidWidth,
    scale:  context.mermaidScale,
    chrome: context.chromePath,
  })

  const href = toAssetHref(assetFilePath, context.htmlOutputPath)
  return `![${escapeMarkdownAlt(`mermaid diagram ${index + 1}`)}](${href})`
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
        markdownPath:   options.markdownPath,
        htmlOutputPath: options.htmlOutputPath,
        assetDir:       options.assetDir,
        mermaidTheme:   options.mermaidTheme,
        mermaidWidth:   options.mermaidWidth,
        mermaidScale:   options.mermaidScale,
        chromePath:     options.chromePath,
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
