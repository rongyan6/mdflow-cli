import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {
  DEFAULT_CONFIG,
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  HEADING_STYLE_OPTIONS,
  LEGEND_OPTIONS,
  PRIMARY_COLOR_OPTIONS,
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

const OPTION_ALIASES = {
  t: 'theme',
  themeName: 'theme',
  font: 'font-family',
  fontFamily: 'font-family',
  size: 'font-size',
  fontSize: 'font-size',
  color: 'primary-color',
  primaryColor: 'primary-color',
  customColor: 'custom-primary-color',
  customPrimaryColor: 'custom-primary-color',
  codeTheme: 'code-theme',
  macCodeBlock: 'mac-code-block',
  codeLineNumbers: 'code-line-numbers',
  cite: 'cite-status',
  useIndent: 'use-indent',
  useJustify: 'use-justify',
  heading1: 'heading-1',
  heading2: 'heading-2',
  heading3: 'heading-3',
}

function printHelp() {
  console.log(`
mdflow-cli <input.md> [options]

用法:
  npx @rongyan/mdflow-cli article.md
  npx @rongyan/mdflow-cli article.md --theme=优雅 --output=article.html
  npx @rongyan/mdflow-cli article.md --wxhtml

输入输出:
  <input.md>                         Markdown 文件路径，必填
  -o, --output <file|dir>            输出 HTML 文件
                                     可传文件名或目录；默认输出到 Markdown 同目录同名 .html
  --wxhtml                           直接输出公众号 content 形态到 stdout，不写文件
  -h, --help                         显示帮助

样式:
  --theme <经典|优雅|简洁>            主题，默认 经典
                                     也支持 default|grace|simple|classic
  --font-family <无衬线|衬线|等宽>    字体，默认 无衬线
                                     也支持 sans|serif|mono
                                     别名: --font, --fontFamily
  --font-size <更小|稍小|推荐|稍大|更大>
                                     字号，默认 推荐
                                     也支持 14px|15px|16px|17px|18px
                                     别名: --size, --fontSize
  --primary-color <预设名称>         主题色，默认 经典蓝
                                     可选: 经典蓝|翡翠绿|活力橘|柠檬黄|薰衣紫|天空蓝|玫瑰金|橄榄绿|石墨黑|雾烟灰|樱花粉
                                     也支持 blue|green|orange|yellow|purple|sky|rosegold|olive|black|gray|pink
                                     别名: --color, --primaryColor
  --custom-primary-color <color>     自定义主题色，优先级高于预设
                                     支持 #RGB | #RRGGBB | rgb(...) | rgba(...) | hsl(...) | hsla(...)
                                     别名: --customColor, --customPrimaryColor

标题:
  --heading-1 <默认|主题色文字|下边框|左边框>
  --heading-2 <默认|主题色文字|下边框|左边框>
  --heading-3 <默认|主题色文字|下边框|左边框>
                                     默认均为 默认
                                     也支持 default|color-only|border-bottom|border-left
                                     别名: --heading1, --heading2, --heading3

代码与图片:
  --code-theme <name|url>            highlight.js 代码主题，默认 github-dark
                                     可传主题名或完整 CSS URL
                                     别名: --codeTheme
  --legend <title 优先|alt 优先|只显示 title|只显示 alt|文件名|不显示>
                                     图注格式，默认 只显示 alt

排版与微信兼容:
  --mac-code-block <开启|关闭>       Mac 风格代码块，默认 开启
                                     别名: --macCodeBlock
  --code-line-numbers <开启|关闭>    代码块行号，默认 关闭
                                     别名: --codeLineNumbers
  --cite-status <开启|关闭>          微信外链转底部引用，默认 关闭
                                     别名: --cite
  --use-indent <开启|关闭>           段落首行缩进，默认 关闭
                                     别名: --useIndent
  --use-justify <开启|关闭>          段落两端对齐，默认 关闭
                                     别名: --useJustify

布尔值写法:
  开启|关闭, 开|关, true|false, yes|no, on|off, 1|0
  `.trim())
}

function normalizeKey(rawKey) {
  return OPTION_ALIASES[rawKey] || rawKey
}

function parseArgs(argv) {
  const args = { _: [] }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '-h' || token === '--help') {
      args.help = true
      continue
    }
    if (token === '-o') {
      if (argv[index + 1] && !argv[index + 1].startsWith('-')) {
        args.output = argv[index + 1]
        index += 1
      }
      else {
        args.output = true
      }
      continue
    }
    if (token.startsWith('--')) {
      const [rawKey, inlineValue] = token.slice(2).split('=')
      const key = normalizeKey(rawKey)
      if (inlineValue !== undefined) {
        args[key] = inlineValue
      }
      else if (argv[index + 1] && !argv[index + 1].startsWith('-')) {
        args[key] = argv[index + 1]
        index += 1
      }
      else {
        args[key] = true
      }
      continue
    }
    args._.push(token)
  }

  return args
}

function resolveOutputPath(inputPath, outputArg) {
  const defaultFileName = `${path.basename(inputPath, path.extname(inputPath))}.html`

  if (outputArg === undefined || outputArg === true) {
    return path.join(path.dirname(inputPath), defaultFileName)
  }

  const rawOutput = String(outputArg)
  const resolvedOutput = path.resolve(rawOutput)

  if (rawOutput.endsWith(path.sep) || path.extname(resolvedOutput) === '') {
    return path.join(resolvedOutput, defaultFileName)
  }

  return resolvedOutput
}

function normalizeConfig(args) {
  const input = args._[0]
  if (!input) {
    throw new Error('请提供 Markdown 文件路径，例如 mdflow-cli demo.md --output demo.html')
  }

  const resolvedInput = path.resolve(input)
  const theme = resolveChoice(args.theme, THEME_OPTIONS, '--theme') || DEFAULT_CONFIG.theme
  const fontFamily = resolveChoice(args['font-family'], FONT_FAMILY_OPTIONS, '--font-family') || DEFAULT_CONFIG.fontFamily
  const fontSize = resolveChoice(args['font-size'], FONT_SIZE_OPTIONS, '--font-size') || DEFAULT_CONFIG.fontSize
  const primaryColor = resolvePrimaryColor(args['primary-color'], args['custom-primary-color']) || DEFAULT_CONFIG.primaryColor
  const legend = resolveChoice(args.legend, LEGEND_OPTIONS, '--legend') || DEFAULT_CONFIG.legend

  return {
    input: resolvedInput,
    output: resolveOutputPath(resolvedInput, args.output),
    wxhtml: Boolean(args.wxhtml),
    theme,
    fontFamily,
    fontSize,
    primaryColor,
    codeThemeUrl: getCodeThemeUrl(args['code-theme'] || DEFAULT_CONFIG.codeBlockTheme),
    legend,
    macCodeBlock: args['mac-code-block'] === undefined ? DEFAULT_CONFIG.macCodeBlock : parseBooleanLike(args['mac-code-block'], '--mac-code-block'),
    codeLineNumbers: args['code-line-numbers'] === undefined ? DEFAULT_CONFIG.codeLineNumbers : parseBooleanLike(args['code-line-numbers'], '--code-line-numbers'),
    citeStatus: args['cite-status'] === undefined ? DEFAULT_CONFIG.citeStatus : parseBooleanLike(args['cite-status'], '--cite-status'),
    useIndent: args['use-indent'] === undefined ? DEFAULT_CONFIG.useIndent : parseBooleanLike(args['use-indent'], '--use-indent'),
    useJustify: args['use-justify'] === undefined ? DEFAULT_CONFIG.useJustify : parseBooleanLike(args['use-justify'], '--use-justify'),
    headingStyles: {
      h1: resolveChoice(args['heading-1'], HEADING_STYLE_OPTIONS, '--heading-1') || DEFAULT_CONFIG.headingStyles.h1,
      h2: resolveChoice(args['heading-2'], HEADING_STYLE_OPTIONS, '--heading-2') || DEFAULT_CONFIG.headingStyles.h2,
      h3: resolveChoice(args['heading-3'], HEADING_STYLE_OPTIONS, '--heading-3') || DEFAULT_CONFIG.headingStyles.h3,
    },
  }
}

function buildHtmlDocument(content, css, title, codeThemeUrl) {
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

function escapeTitle(title) {
  return String(title)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export async function runCli(argv) {
  try {
    const args = parseArgs(argv)
    if (args.help) {
      printHelp()
      return
    }

    const config = normalizeConfig(args)
    const raw = await readFile(config.input, 'utf8')
    const preprocessedMarkdown = await preprocessMarkdown(raw, {
      markdownPath: config.input,
      htmlOutputPath: config.output,
      onWarning(message) {
        console.warn(`mdflow-cli: ${message}`)
      },
    })
    const result = renderMarkdownToHtml(preprocessedMarkdown, config)
    const css = buildThemeCss(config)
    const title = escapeTitle(result.frontMatter.title || result.title || path.basename(config.input, path.extname(config.input)))
    const wxhtml = await exportWxhtml({
      html: result.html,
      themeCss: css,
      codeThemeUrl: config.codeThemeUrl,
      primaryColor: config.primaryColor,
    })

    if (config.wxhtml) {
      process.stdout.write(wxhtml)
      return
    }

    const fullHtml = buildHtmlDocument(result.html, css, title, config.codeThemeUrl)
    await mkdir(path.dirname(config.output), { recursive: true })
    await writeFile(config.output, fullHtml, 'utf8')
    console.log(`HTML 已输出到 ${config.output}`)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`mdflow-cli: ${message}`)
    console.error(`运行 mdflow-cli --help 查看可用参数`)
    process.exitCode = 1
  }
}
