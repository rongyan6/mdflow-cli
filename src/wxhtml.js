import { readFile } from 'node:fs/promises'
import juice from 'juice'
import { parseHTML } from 'linkedom'

async function getCodeThemeCss(codeThemeUrl) {
  if (!codeThemeUrl) {
    return ''
  }

  try {
    if (/^https?:\/\//.test(codeThemeUrl)) {
      const response = await fetch(codeThemeUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return await response.text()
    }

    return await readFile(codeThemeUrl, 'utf8')
  }
  catch (error) {
    console.warn(`mdflow-cli: 获取代码块主题样式失败，已跳过。${error instanceof Error ? error.message : String(error)}`)
    return ''
  }
}

function stripOutputScope(cssContent) {
  let css = cssContent
  css = css.replace(/#output\s*\{/g, 'body {')
  css = css.replace(/#output\s+/g, '')
  css = css.replace(/^#output\s*/gm, '')
  return css
}

function formatCssNumber(value) {
  const rounded = Math.round(value * 1000) / 1000
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/\.?0+$/, '')
}

function normalizeWeChatCalcExpressions(cssContent) {
  return cssContent
    .replace(
      /calc\(\s*(-?\d*\.?\d+)(px|em|rem)\s*\*\s*(-?\d*\.?\d+)\s*\)/g,
      (_, rawValue, unit, rawMultiplier) => `${formatCssNumber(Number(rawValue) * Number(rawMultiplier))}${unit}`,
    )
    .replace(
      /calc\(\s*(-?\d*\.?\d+)\s*\*\s*(-?\d*\.?\d+)(px|em|rem)\s*\)/g,
      (_, rawMultiplier, rawValue, unit) => `${formatCssNumber(Number(rawValue) * Number(rawMultiplier))}${unit}`,
    )
}

function resolveWeChatCss(cssContent, primaryColor, fontFamily, fontSize) {
  return normalizeWeChatCalcExpressions(
    stripOutputScope(cssContent)
    .replace(/hsl\(var\(--foreground\)\)/g, '#3f3f3f')
    .replace(/var\(--blockquote-background\)/g, '#f7f7f7')
    .replace(/var\(--md-primary-color\)/g, primaryColor)
    .replace(/var\(--md-font-family\)/g, fontFamily)
    .replace(/var\(--md-font-size\)/g, fontSize)
    .replace(/--md-primary-color:.+?;/g, '')
    .replace(/--md-font-family:.+?;/g, '')
    .replace(/--md-font-size:.+?;/g, ''),
  )
}

function mergeCss(html) {
  return juice(html, {
    inlinePseudoElements: true,
    preserveImportant: true,
    resolveCSSVariables: false,
  })
}

function modifyHtmlStructure(document) {
  document.querySelectorAll('li > ul, li > ol').forEach((originalItem) => {
    originalItem.parentElement?.insertAdjacentElement('afterend', originalItem)
  })
}

function solveWeChatImage(document) {
  const images = document.getElementsByTagName('img')
  Array.from(images).forEach((image) => {
    const width = image.getAttribute('width')
    const height = image.getAttribute('height')

    if (width) {
      image.removeAttribute('width')
      image.style.width = /^\d+$/.test(width) ? `${width}px` : width
    }

    if (height) {
      image.removeAttribute('height')
      image.style.height = /^\d+$/.test(height) ? `${height}px` : height
    }
  })
}

function encodeCodeTextForWeChat(document) {
  document.querySelectorAll('pre.code__pre > code, pre.hljs.code__pre > code').forEach((code) => {
    if (/<br\s*\/?>/i.test(code.innerHTML)) {
      return
    }

    const text = code.textContent ?? ''
    const normalized = text.replace(/\r\n/g, '\n')
    const encoded = normalized
      .split('\n')
      .map(line => line
        .replace(/ /g, '&nbsp;')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;'))
      .join('<br/>')

    code.innerHTML = encoded
  })
}

function applyCodeBlockWrap(document) {
  document.querySelectorAll('pre.code__pre, pre.hljs.code__pre').forEach((pre) => {
    pre.style.whiteSpace = 'pre-wrap'
    pre.style.wordBreak = 'break-word'
    pre.style.overflowWrap = 'anywhere'
  })

  document.querySelectorAll('pre.code__pre > code, pre.hljs.code__pre > code').forEach((code) => {
    code.style.whiteSpace = 'inherit'
    code.style.wordBreak = 'inherit'
    code.style.overflowWrap = 'inherit'
  })
}

function createEmptyNode(document) {
  const node = document.createElement('p')
  node.style.fontSize = '0'
  node.style.lineHeight = '0'
  node.style.margin = '0'
  node.innerHTML = '&nbsp;'
  return node
}

function applyWeChatCompatibility(document, primaryColor, fontFamily, fontSize) {
  const output = document.getElementById('output')
  if (!output) {
    throw new Error('未找到 #output 节点，无法生成 wxhtml')
  }

  modifyHtmlStructure(document)

  output.innerHTML = output.innerHTML
    .replace(/([^-])top:(.*?)em/g, '$1transform: translateY($2em)')
    .replace(
      /<span class="nodeLabel"([^>]*)><p[^>]*>(.*?)<\/p><\/span>/g,
      '<span class="nodeLabel"$1>$2</span>',
    )
    .replace(
      /<span class="edgeLabel"([^>]*)><p[^>]*>(.*?)<\/p><\/span>/g,
      '<span class="edgeLabel"$1>$2</span>',
    )

  solveWeChatImage(document)
  encodeCodeTextForWeChat(document)
  applyCodeBlockWrap(document)

  output.insertBefore(createEmptyNode(document), output.firstChild)
  output.appendChild(createEmptyNode(document))

  output.querySelectorAll('.nodeLabel').forEach((node) => {
    const parent = node.parentElement
    if (!parent) {
      return
    }
    const xmlns = parent.getAttribute('xmlns') || ''
    const style = parent.getAttribute('style') || ''
    const section = document.createElement('section')
    section.setAttribute('xmlns', xmlns)
    section.setAttribute('style', style)
    section.innerHTML = parent.innerHTML

    const grand = parent.parentElement
    if (!grand) {
      return
    }

    grand.innerHTML = ''
    grand.appendChild(section)
  })

  output.innerHTML = output.innerHTML.replace(
    /<tspan([^>]*)>/g,
    '<tspan$1 style="fill: #333333 !important; color: #333333 !important; stroke: none !important;">',
  )

  output.querySelectorAll('.infographic-diagram').forEach((diagram) => {
    diagram.querySelectorAll('text').forEach((textElem) => {
      const dominantBaseline = textElem.getAttribute('dominant-baseline')
      const variantMap = {
        alphabetic: '',
        central: '0.35em',
        middle: '0.35em',
        hanging: '-0.55em',
        ideographic: '0.18em',
        'text-before-edge': '-0.85em',
        'text-after-edge': '0.15em',
      }
      if (dominantBaseline) {
        textElem.removeAttribute('dominant-baseline')
        const dy = variantMap[dominantBaseline] || ''
        if (dy) {
          textElem.setAttribute('dy', dy)
        }
      }
    })
  })

  return output.innerHTML
}

function compactHtmlFragment(fragment) {
  return fragment.trim()
}

export async function exportWxhtml({
  html,
  themeCss,
  codeThemeUrl,
  primaryColor,
  fontFamily,
  fontSize,
}) {
  const codeThemeCss = await getCodeThemeCss(codeThemeUrl)
  const inlineCss = [
    resolveWeChatCss(themeCss, primaryColor, fontFamily, fontSize),
    codeThemeCss,
  ].filter(Boolean).join('\n\n')

  const wrapperHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${inlineCss}</style>
</head>
<body>
  <div id="output">${html}</div>
</body>
</html>`

  const { document } = parseHTML(mergeCss(wrapperHtml))

  return compactHtmlFragment(applyWeChatCompatibility(document, primaryColor, fontFamily, fontSize))
}
