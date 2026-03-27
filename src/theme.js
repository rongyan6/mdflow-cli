import { baseCss, themeCssMap } from './css.js'

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
  background: #f5f5f5;
  color: #222;
}

.mdflow-page {
  width: min(750px, calc(100vw - 32px));
  margin: 24px auto;
  padding: 20px;
  background: #fff;
  box-sizing: border-box;
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

export function buildThemeCss(config) {
  const themeCss = themeCssMap[config.theme] || themeCssMap.default
  const variableCss = generateVariableCss(config)
  const headingCss = generateHeadingStylesCss(config.headingStyles)
  return [variableCss, baseCss, themeCss, headingCss].filter(Boolean).join('\n\n')
}
