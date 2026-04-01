import { baseCss, themeCssMap } from './css.js'
import { processCss } from './css-processor.js'

function generateHeadingCss(level, style) {
  const selector = `#output ${level}`
  const baseStyles = `
  display: block;
  text-align: left;
  background: transparent;`

  switch (style) {
    case 'color-only':
      return `${selector} {
  color: var(--md-primary-color);
  background: transparent;
}`
    case 'border-bottom':
      return `${selector} {${baseStyles}
  padding-bottom: 0.3em;
  border-bottom: 2px solid var(--md-primary-color);
  color: var(--md-primary-color);
}`
    case 'border-left':
      return `${selector} {${baseStyles}
  margin-left: 0;
  padding-left: 10px;
  border-left: 4px solid var(--md-primary-color);
  color: var(--md-primary-color);
}`
    default:
      return ''
  }
}

function generateHeadingStylesCss(headingStyles) {
  return ['h1', 'h2', 'h3']
    .map(level => generateHeadingCss(level, headingStyles[level]))
    .filter(Boolean)
    .join('\n\n')
}

function generateVariableCss(config) {
  return `
:root {
  --md-primary-color: ${config.primaryColor};
  --md-font-family: ${config.fontFamily};
  --md-font-size: ${config.fontSize};
  --foreground: 0 0% 15%;
  --background: 0 0% 100%;
  --blockquote-background: #f7f7f7;
}

body {
  margin: 0;
}

#output p {
  ${config.useIndent ? 'text-indent: 2em;' : ''}
  ${config.useJustify ? 'text-align: justify;' : ''}
}

.hljs.code__pre {
  position: relative;
  overflow: auto;
  padding: 0;
  border-radius: 6px;
}

.hljs.code__pre > code {
  display: block;
  padding: 16px;
  overflow-x: auto;
}

.hljs.code__pre > .mac-sign {
  display: ${config.macCodeBlock ? 'flex' : 'none'};
}

.code-line {
  display: grid;
  grid-template-columns: ${config.codeLineNumbers ? '40px 1fr' : '1fr'};
  gap: 12px;
}

.line-number {
  user-select: none;
  text-align: right;
  opacity: 0.45;
}

.line-content {
  white-space: pre-wrap;
  word-break: break-word;
}

figure {
  margin: 1.5em 8px;
}

figure img {
  max-width: 100%;
}

figcaption {
  margin-top: 0.5em;
}

table.preview-table {
  width: calc(100% - 16px);
}
  `.trim()
}

export async function buildThemeCss(config) {
  let themeCss = themeCssMap.default
  if (config.theme !== 'default' && themeCssMap[config.theme]) {
    themeCss = `${themeCss}\n\n${themeCssMap[config.theme]}`
  }
  const variableCss = generateVariableCss(config)
  const headingCss = generateHeadingStylesCss(config.headingStyles)
  return processCss([variableCss, baseCss, themeCss, headingCss].filter(Boolean).join('\n\n'))
}
