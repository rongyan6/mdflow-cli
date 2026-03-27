import frontMatter from 'front-matter'
import hljs from 'highlight.js'
import { marked } from 'marked'

const AMPERSAND_REGEX = /&/g
const LESS_THAN_REGEX = /</g
const GREATER_THAN_REGEX = />/g
const DOUBLE_QUOTE_REGEX = /"/g
const SINGLE_QUOTE_REGEX = /'/g
const BACKTICK_REGEX = /`/g
const UNDERSCORE_REGEX = /_/g
const HEADING_TAG_REGEX = /^h\d$/
const PARAGRAPH_WRAPPER_REGEX = /^<p(?:\s[^>]*)?>([\s\S]*?)<\/p>$/
const MP_WEIXIN_LINK_REGEX = /^https?:\/\/mp\.weixin\.qq\.com/

const macCodeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" width="45px" height="13px" viewBox="0 0 450 130">
  <ellipse cx="50" cy="65" rx="50" ry="52" stroke="rgb(220,60,54)" stroke-width="2" fill="rgb(237,108,96)" />
  <ellipse cx="225" cy="65" rx="50" ry="52" stroke="rgb(218,151,33)" stroke-width="2" fill="rgb(247,193,81)" />
  <ellipse cx="400" cy="65" rx="50" ry="52" stroke="rgb(27,161,37)" stroke-width="2" fill="rgb(100,200,86)" />
</svg>
`.trim()

function escapeHtml(text) {
  return text
    .replace(AMPERSAND_REGEX, '&amp;')
    .replace(LESS_THAN_REGEX, '&lt;')
    .replace(GREATER_THAN_REGEX, '&gt;')
    .replace(DOUBLE_QUOTE_REGEX, '&quot;')
    .replace(SINGLE_QUOTE_REGEX, '&#39;')
    .replace(BACKTICK_REGEX, '&#96;')
}

function styledContent(styleLabel, content, tagName) {
  const tag = tagName ?? styleLabel
  const className = styleLabel.replace(UNDERSCORE_REGEX, '-')
  const headingAttr = HEADING_TAG_REGEX.test(tag) ? ' data-heading="true"' : ''
  return `<${tag} class="${className}"${headingAttr}>${content}</${tag}>`
}

function extractFileName(href) {
  try {
    const urlPath = href.split('?')[0].split('#')[0]
    const fileName = urlPath.split('/').pop() || ''
    return fileName.replace(/\.[^.]*$/, '')
  }
  catch {
    return ''
  }
}

function transformLegend(legend, text, title, href = '') {
  const options = legend.split('-')
  for (const option of options) {
    if (option === 'alt' && text) {
      return text
    }
    if (option === 'title' && title) {
      return title
    }
    if (option === 'filename' && href) {
      const fileName = extractFileName(href)
      if (fileName) {
        return escapeHtml(fileName)
      }
    }
  }
  return ''
}

function buildAddition() {
  return `
<style>
  .preview-wrapper pre::before {
    position: absolute;
    top: 0;
    right: 0;
    color: #ccc;
    text-align: center;
    font-size: 0.8em;
    padding: 5px 10px 0;
    line-height: 15px;
    height: 15px;
    font-weight: 600;
  }
</style>
  `.trim()
}

function buildFootnoteHtml(footnotes) {
  return footnotes
    .map(([index, title, link]) => (
      link === title
        ? `<code style="font-size: 90%; opacity: 0.6;">[${index}]</code>: <i style="word-break: break-all">${escapeHtml(title)}</i><br/>`
        : `<code style="font-size: 90%; opacity: 0.6;">[${index}]</code> ${escapeHtml(title)}: <i style="word-break: break-all">${escapeHtml(link)}</i><br/>`
    ))
    .join('\n')
}

function readingTime(text) {
  const chars = text.length
  const words = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length

  return {
    chars,
    words,
    minutes: words / 220,
  }
}

function extractFirstHeading(markdownText) {
  const match = markdownText.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : ''
}

function parseFrontMatterAndContent(markdownText) {
  try {
    const parsed = frontMatter(markdownText)
    return {
      yamlData: parsed.attributes || {},
      markdownContent: parsed.body,
      title: String(parsed.attributes?.title || extractFirstHeading(parsed.body) || '').trim(),
      readingTime: readingTime(parsed.body),
    }
  }
  catch {
    return {
      yamlData: {},
      markdownContent: markdownText,
      title: extractFirstHeading(markdownText),
      readingTime: readingTime(markdownText),
    }
  }
}

function highlightAndFormatCode(text, language, showLineNumbers) {
  let highlighted = escapeHtml(text)
  if (language && hljs.getLanguage(language)) {
    highlighted = hljs.highlight(text, { language }).value
  }
  else if (language !== 'plaintext') {
    highlighted = hljs.highlightAuto(text).value
  }

  if (!showLineNumbers) {
    return highlighted
  }

  return highlighted
    .split('\n')
    .map((line, index) => {
      const safeLine = line === '' ? '&nbsp;' : line
      return `<span class="code-line"><span class="line-number">${index + 1}</span><span class="line-content">${safeLine}</span></span>`
    })
    .join('\n')
}

function createRenderer(options) {
  const footnotes = []
  let footnoteIndex = 0
  const listOrderedStack = []
  const listCounters = []

  const addFootnote = (title, link) => {
    const existing = footnotes.find(([, , existingLink]) => existingLink === link)
    if (existing) {
      return existing[0]
    }
    footnotes.push([++footnoteIndex, title, link])
    return footnoteIndex
  }

  return {
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens)
        return styledContent(`h${depth}`, text)
      },

      paragraph({ tokens }) {
        const text = this.parser.parseInline(tokens)
        const isFigureImage = text.includes('<figure') && text.includes('<img')
        const isEmpty = text.trim() === ''
        return isFigureImage || isEmpty ? text : styledContent('p', text)
      },

      blockquote({ tokens }) {
        return styledContent('blockquote', this.parser.parse(tokens))
      },

      code({ text, lang = '' }) {
        const langText = lang.split(' ')[0]
        const language = hljs.getLanguage(langText) ? langText : 'plaintext'
        const highlighted = highlightAndFormatCode(text, language, options.codeLineNumbers)
        const span = `<span class="mac-sign" style="padding: 10px 14px 0;">${macCodeSvg}</span>`
        return `<pre class="hljs code__pre">${span}<code class="language-${escapeHtml(langText || language)}">${highlighted}</code></pre>`
      },

      codespan({ text }) {
        return styledContent('codespan', escapeHtml(text), 'code')
      },

      list({ ordered, items, start = 1 }) {
        listOrderedStack.push(ordered)
        listCounters.push(Number(start))
        const html = items.map(item => this.listitem(item)).join('')
        listOrderedStack.pop()
        listCounters.pop()
        return styledContent(ordered ? 'ol' : 'ul', html)
      },

      listitem(token) {
        const ordered = listOrderedStack[listOrderedStack.length - 1]
        const idx = listCounters[listCounters.length - 1]
        listCounters[listCounters.length - 1] = idx + 1
        const prefix = ordered ? `${idx}. ` : '• '
        let content
        try {
          content = this.parser.parseInline(token.tokens)
        }
        catch {
          content = this.parser.parse(token.tokens).replace(PARAGRAPH_WRAPPER_REGEX, '$1')
        }
        return styledContent('listitem', `${prefix}${content}`, 'li')
      },

      image({ href, title, text }) {
        const captionText = options.legend && options.legend !== 'none'
          ? transformLegend(options.legend, text, title, href)
          : ''
        const subText = captionText ? styledContent('figcaption', captionText) : ''
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
        return `<figure><img src="${escapeHtml(href)}"${titleAttr} alt="${escapeHtml(text || '')}"/>${subText}</figure>`
      },

      link({ href, title, text, tokens }) {
        const parsedText = this.parser.parseInline(tokens)
        if (MP_WEIXIN_LINK_REGEX.test(href)) {
          return `<a href="${escapeHtml(href)}" title="${escapeHtml(title || text || href)}">${parsedText}</a>`
        }
        if (href === text) {
          return parsedText
        }
        if (options.citeStatus) {
          const ref = addFootnote(title || text || href, href)
          return `<a href="${escapeHtml(href)}" title="${escapeHtml(title || text || href)}">${parsedText}<sup>[${ref}]</sup></a>`
        }
        return `<a href="${escapeHtml(href)}" title="${escapeHtml(title || text || href)}">${parsedText}</a>`
      },

      strong({ tokens }) {
        return styledContent('strong', this.parser.parseInline(tokens))
      },

      em({ tokens }) {
        return styledContent('em', this.parser.parseInline(tokens))
      },

      table({ header, rows }) {
        const headerRow = header.map(cell => styledContent('th', this.parser.parseInline(cell.tokens))).join('')
        const body = rows.map((row) => {
          const rowContent = row.map(cell => this.tablecell(cell)).join('')
          return styledContent('tr', rowContent)
        }).join('')
        return `
<section style="max-width: 100%; overflow: auto">
  <table class="preview-table">
    <thead>${headerRow}</thead>
    <tbody>${body}</tbody>
  </table>
</section>`.trim()
      },

      tablecell(token) {
        return styledContent('td', this.parser.parseInline(token.tokens))
      },

      hr() {
        return styledContent('hr', '')
      },
    },
    buildFootnotes() {
      if (!footnotes.length) {
        return ''
      }
      return styledContent('h4', '引用链接') + styledContent('footnotes', buildFootnoteHtml(footnotes), 'p')
    },
  }
}

export function renderMarkdownToHtml(rawMarkdown, options) {
  marked.setOptions({ breaks: true, gfm: true })
  const { yamlData, markdownContent, title, readingTime: stats } = parseFrontMatterAndContent(rawMarkdown)
  const { renderer, buildFootnotes } = createRenderer(options)
  marked.use({ renderer })

  let html = marked.parse(markdownContent)
  html += buildFootnotes()
  html += buildAddition()

  return {
    html: `<section class="container">${html}</section>`,
    frontMatter: yamlData,
    title,
    readingTime: stats,
  }
}
