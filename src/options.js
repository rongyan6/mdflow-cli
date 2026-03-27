const CODE_THEME_PREFIX = 'https://cdn-doocs.oss-cn-shenzhen.aliyuncs.com/npm/highlightjs/11.11.1/styles/'

export const THEME_OPTIONS = {
  '经典': 'default',
  '优雅': 'grace',
  '简洁': 'simple',
  default: 'default',
  grace: 'grace',
  simple: 'simple',
  classic: 'default',
}

export const FONT_FAMILY_OPTIONS = {
  '无衬线': '-apple-system-font,BlinkMacSystemFont, Helvetica Neue, PingFang SC, Hiragino Sans GB , Microsoft YaHei UI , Microsoft YaHei ,Arial,sans-serif',
  '衬线': "Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, 'PingFang SC', Cambria, Cochin, Georgia, Times, 'Times New Roman', serif",
  '等宽': "Menlo, Monaco, 'Courier New', monospace",
  sans: '-apple-system-font,BlinkMacSystemFont, Helvetica Neue, PingFang SC, Hiragino Sans GB , Microsoft YaHei UI , Microsoft YaHei ,Arial,sans-serif',
  serif: "Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, 'PingFang SC', Cambria, Cochin, Georgia, Times, 'Times New Roman', serif",
  mono: "Menlo, Monaco, 'Courier New', monospace",
  monospace: "Menlo, Monaco, 'Courier New', monospace",
}

export const FONT_SIZE_OPTIONS = {
  '更小': '14px',
  '稍小': '15px',
  '推荐': '16px',
  '稍大': '17px',
  '更大': '18px',
  '14px': '14px',
  '15px': '15px',
  '16px': '16px',
  '17px': '17px',
  '18px': '18px',
}

export const PRIMARY_COLOR_OPTIONS = {
  '经典蓝': '#0F4C81',
  '翡翠绿': '#009874',
  '活力橘': '#FA5151',
  '柠檬黄': '#FECE00',
  '薰衣紫': '#92617E',
  '天空蓝': '#55C9EA',
  '玫瑰金': '#B76E79',
  '橄榄绿': '#556B2F',
  '石墨黑': '#333333',
  '雾烟灰': '#A9A9A9',
  '樱花粉': '#FFB7C5',
  blue: '#0F4C81',
  green: '#009874',
  orange: '#FA5151',
  yellow: '#FECE00',
  purple: '#92617E',
  sky: '#55C9EA',
  rosegold: '#B76E79',
  olive: '#556B2F',
  black: '#333333',
  gray: '#A9A9A9',
  pink: '#FFB7C5',
}

export const HEADING_STYLE_OPTIONS = {
  '默认': 'default',
  '主题色文字': 'color-only',
  '下边框': 'border-bottom',
  '左边框': 'border-left',
  default: 'default',
  color: 'color-only',
  'color-only': 'color-only',
  bottom: 'border-bottom',
  'border-bottom': 'border-bottom',
  left: 'border-left',
  'border-left': 'border-left',
}

export const LEGEND_OPTIONS = {
  'title 优先': 'title-alt',
  'alt 优先': 'alt-title',
  '只显示 title': 'title',
  '只显示 alt': 'alt',
  '文件名': 'filename',
  '不显示': 'none',
  'title-alt': 'title-alt',
  'alt-title': 'alt-title',
  title: 'title',
  alt: 'alt',
  filename: 'filename',
  none: 'none',
}

export const DEFAULT_CONFIG = {
  theme: 'default',
  fontFamily: FONT_FAMILY_OPTIONS['无衬线'],
  fontSize: FONT_SIZE_OPTIONS['推荐'],
  primaryColor: PRIMARY_COLOR_OPTIONS['经典蓝'],
  codeBlockTheme: 'github-dark',
  legend: LEGEND_OPTIONS['只显示 alt'],
  macCodeBlock: true,
  codeLineNumbers: false,
  citeStatus: false,
  useIndent: false,
  useJustify: false,
  headingStyles: {
    h1: 'default',
    h2: 'default',
    h3: 'default',
  },
}

export function getCodeThemeUrl(nameOrUrl) {
  if (!nameOrUrl) {
    return `${CODE_THEME_PREFIX}${DEFAULT_CONFIG.codeBlockTheme}.min.css`
  }
  if (/^https?:\/\//.test(nameOrUrl)) {
    return nameOrUrl
  }
  return `${CODE_THEME_PREFIX}${nameOrUrl}.min.css`
}

export function parseBooleanLike(value, optionName) {
  if (typeof value === 'boolean') {
    return value
  }

  const normalized = String(value).trim().toLowerCase()
  if (['开启', '开', 'true', '1', 'yes', 'on'].includes(normalized)) {
    return true
  }
  if (['关闭', '关', 'false', '0', 'no', 'off'].includes(normalized)) {
    return false
  }
  throw new Error(`参数 ${optionName} 仅支持 开启/关闭 或 true/false`)
}

export function validateColor(value, optionName) {
  const normalized = String(value).trim()
  const isHex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)
  const isRgb = /^rgb(a)?\(/i.test(normalized)
  const isHsl = /^hsl(a)?\(/i.test(normalized)
  if (!isHex && !isRgb && !isHsl) {
    throw new Error(`参数 ${optionName} 需要是合法颜色值，例如 #1677ff`)
  }
  return normalized
}

export function resolveChoice(value, options, optionName) {
  if (!value) {
    return undefined
  }
  if (Object.hasOwn(options, value)) {
    return options[value]
  }
  const normalizedValue = String(value).trim().toLowerCase()
  const directEntry = Object.values(options).find(item => String(item).toLowerCase() === normalizedValue)
  if (directEntry) {
    return directEntry
  }
  throw new Error(`参数 ${optionName} 不合法: ${value}`)
}

export function resolvePrimaryColor(preset, customColor) {
  if (customColor) {
    return validateColor(customColor, '--custom-primary-color')
  }
  return resolveChoice(preset, PRIMARY_COLOR_OPTIONS, '--primary-color')
}
