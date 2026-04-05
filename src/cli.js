import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { resolveRenderConfig, renderMarkdown } from './index.js'

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
  assetDir: 'asset-dir',
  mermaidTheme: 'mermaid-theme',
  mermaidScale: 'mermaid-scale',
  chromePath: 'chrome-path',
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
mdflow <input.md> [options]

用法:
  mdflow post.md
  mdflow post.md --theme=优雅 --output=post.html
  mdflow post.md --wxoutput
  mdflow post.md --asset-dir ./assets

输入输出:
  <input.md>                         Markdown 文件路径，必填
  -o, --output <file|dir>            输出 HTML 文件
                                     可传文件名或目录；默认输出到 Markdown 同目录同名 .html
  --wxoutput <file|dir>              输出公众号内容形态 .wxhtml 文件
                                     可传文件名或目录；默认输出到 Markdown 同目录同名 .wxhtml
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
  --asset-dir <dir>                  指定 Mermaid PNG 输出目录
                                     不传时默认输出到 Markdown 同级 assets 目录
  --mermaid-theme <name>             Mermaid 主题，默认 github-light
                                     可选: github-light|github-dark|nord|tokyo-night 等 15 种
  --mermaid-scale <n>                Mermaid 截图像素比，默认 2（Retina 质量），可传 1/2/3
  --chrome-path <path>               Chrome 可执行文件路径（默认自动检测）
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
  return resolveFileOutputPath(inputPath, outputArg, '.html')
}

function resolveWxoutputPath(inputPath, outputArg) {
  return resolveFileOutputPath(inputPath, outputArg, '.wxhtml')
}

function resolveFileOutputPath(inputPath, outputArg, extension) {
  const defaultFileName = `${path.basename(inputPath, path.extname(inputPath))}${extension}`

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
    throw new Error('请提供 Markdown 文件路径，例如 mdflow post.md --output post.html')
  }

  const resolvedInput = path.resolve(input)
  const output = resolveOutputPath(resolvedInput, args.output)
  const wxoutput = args.wxoutput === undefined
    ? undefined
    : resolveWxoutputPath(resolvedInput, args.wxoutput)

  return {
    input: resolvedInput,
    output,
    wxoutput,
    ...resolveRenderConfig({
      markdownPath: resolvedInput,
      htmlOutputPath: output,
      theme: args.theme,
      fontFamily: args['font-family'],
      fontSize: args['font-size'],
      primaryColor: args['primary-color'],
      customPrimaryColor: args['custom-primary-color'],
      codeTheme: args['code-theme'],
      assetDir:     args['asset-dir'],
      mermaidTheme: args['mermaid-theme'],
      mermaidScale: args['mermaid-scale'],
      chromePath:   args['chrome-path'],
      legend: args.legend,
      macCodeBlock: args['mac-code-block'],
      codeLineNumbers: args['code-line-numbers'],
      citeStatus: args['cite-status'],
      useIndent: args['use-indent'],
      useJustify: args['use-justify'],
      heading1: args['heading-1'],
      heading2: args['heading-2'],
      heading3: args['heading-3'],
    }),
  }
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
    const result = await renderMarkdown(raw, {
      ...config,
      onWarning(message) {
        console.warn(`mdflow: ${message}`)
      },
    })

    if (config.wxoutput) {
      await mkdir(path.dirname(config.wxoutput), { recursive: true })
      await writeFile(config.wxoutput, result.wxhtml, 'utf8')
      console.log(`WXHTML 已输出到 ${config.wxoutput}`)
    }

    await mkdir(path.dirname(config.output), { recursive: true })
    await writeFile(config.output, result.html, 'utf8')
    console.log(`HTML 已输出到 ${config.output}`)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`mdflow: ${message}`)
    console.error(`运行 mdflow --help 查看可用参数`)
    process.exitCode = 1
  }
}
