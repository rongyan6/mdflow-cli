import path from 'node:path'
import process from 'node:process'
import {
  DEFAULT_CONFIG,
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  HEADING_STYLE_OPTIONS,
  LEGEND_OPTIONS,
  THEME_OPTIONS,
  getCodeThemeUrl,
  parseBooleanLike,
  resolveChoice,
  resolvePrimaryColor,
} from './options.js'
import { preprocessMarkdown } from './preprocess.js'
import { renderMarkdownToHtml } from './renderer.js'
import { buildThemeCss } from './theme.js'
import { exportWxhtml } from './wxhtml.js'

function escapeTitle(title) {
  return String(title)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function createHtmlDocument(content, css, title, codeThemeUrl) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="stylesheet" href="${codeThemeUrl}" />
  <style>${css}</style>
</head>
<body>
  <div class="mdflow-page">
    <div id="output">
      ${content}
    </div>
  </div>
</body>
</html>`
}

export function resolveRenderConfig(input = {}) {
  return {
    assetDir: input.assetDir ? path.resolve(input.assetDir) : undefined,
    markdownPath: input.markdownPath ? path.resolve(input.markdownPath) : undefined,
    htmlOutputPath: input.htmlOutputPath ? path.resolve(input.htmlOutputPath) : undefined,
    theme: resolveChoice(input.theme, THEME_OPTIONS, 'theme') || DEFAULT_CONFIG.theme,
    fontFamily: resolveChoice(input.fontFamily || input['font-family'], FONT_FAMILY_OPTIONS, 'fontFamily') || DEFAULT_CONFIG.fontFamily,
    fontSize: resolveChoice(input.fontSize || input['font-size'], FONT_SIZE_OPTIONS, 'fontSize') || DEFAULT_CONFIG.fontSize,
    primaryColor: resolvePrimaryColor(
      input.primaryColor || input['primary-color'],
      input.customPrimaryColor || input['custom-primary-color'],
    ) || DEFAULT_CONFIG.primaryColor,
    codeThemeUrl: getCodeThemeUrl(input.codeTheme || input['code-theme'] || DEFAULT_CONFIG.codeBlockTheme),
    legend: resolveChoice(input.legend, LEGEND_OPTIONS, 'legend') || DEFAULT_CONFIG.legend,
    macCodeBlock: input.macCodeBlock ?? input['mac-code-block'] ?? DEFAULT_CONFIG.macCodeBlock,
    codeLineNumbers: input.codeLineNumbers ?? input['code-line-numbers'] ?? DEFAULT_CONFIG.codeLineNumbers,
    citeStatus: input.citeStatus ?? input['cite-status'] ?? DEFAULT_CONFIG.citeStatus,
    useIndent: input.useIndent ?? input['use-indent'] ?? DEFAULT_CONFIG.useIndent,
    useJustify: input.useJustify ?? input['use-justify'] ?? DEFAULT_CONFIG.useJustify,
    headingStyles: {
      h1: resolveChoice(input.heading1 || input['heading-1'], HEADING_STYLE_OPTIONS, 'heading1') || DEFAULT_CONFIG.headingStyles.h1,
      h2: resolveChoice(input.heading2 || input['heading-2'], HEADING_STYLE_OPTIONS, 'heading2') || DEFAULT_CONFIG.headingStyles.h2,
      h3: resolveChoice(input.heading3 || input['heading-3'], HEADING_STYLE_OPTIONS, 'heading3') || DEFAULT_CONFIG.headingStyles.h3,
    },
  }
}

function normalizeBooleanConfig(config) {
  return {
    ...config,
    macCodeBlock: typeof config.macCodeBlock === 'boolean' ? config.macCodeBlock : parseBooleanLike(config.macCodeBlock, 'macCodeBlock'),
    codeLineNumbers: typeof config.codeLineNumbers === 'boolean' ? config.codeLineNumbers : parseBooleanLike(config.codeLineNumbers, 'codeLineNumbers'),
    citeStatus: typeof config.citeStatus === 'boolean' ? config.citeStatus : parseBooleanLike(config.citeStatus, 'citeStatus'),
    useIndent: typeof config.useIndent === 'boolean' ? config.useIndent : parseBooleanLike(config.useIndent, 'useIndent'),
    useJustify: typeof config.useJustify === 'boolean' ? config.useJustify : parseBooleanLike(config.useJustify, 'useJustify'),
  }
}

export async function renderMarkdown(markdown, input = {}) {
  const config = normalizeBooleanConfig(resolveRenderConfig(input))
  const preparedMarkdown = await preprocessMarkdown(markdown, {
    markdownPath: config.markdownPath,
    htmlOutputPath: config.htmlOutputPath,
    assetDir: config.assetDir,
    onWarning: input.onWarning,
    onInfo: input.onInfo,
  })
  const result = renderMarkdownToHtml(preparedMarkdown, config)
  const css = buildThemeCss(config)
  const titleSource = result.frontMatter.title
    || result.title
    || input.title
    || 'Document'
  const title = escapeTitle(titleSource)

  return {
    html: createHtmlDocument(result.html, css, title, config.codeThemeUrl),
    wxhtml: await exportWxhtml({
      html: result.html,
      themeCss: css,
      codeThemeUrl: config.codeThemeUrl,
      primaryColor: config.primaryColor,
    }),
    contentHtml: result.html,
    css,
    title,
    frontMatter: result.frontMatter,
    readingTime: result.readingTime,
    config,
  }
}
