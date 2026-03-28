# 适应AI时代的Markdown渲染器：mdflow-cli

Markdown 转 HTML 命令行工具。支持兼容微信公众号富文本、普通HTML，配置参数丰富。

将 Markdown 转成带样式的 HTML 文件，或直接输出可用于微信公众号 `content` 的富文本内容。

仓库地址：[https://github.com/rongyan6/mdflow-cli](https://github.com/rongyan6/mdflow-cli)

如果这个项目对你有帮助，欢迎关注我的微信公众号：

<p align="center">
  <img src="images/wechat-qrcode.jpg" width="280" alt="微信公众号二维码" />
</p>

## 安装

```bash
npm i -g @rongyan/mdflow-cli
```

也可以直接用 `npx`：

```bash
npx @rongyan/mdflow-cli post.md
```

## 基本用法

```bash
npx @rongyan/mdflow-cli post.md
```

不传 `--output` 时，会默认生成到 Markdown 同目录、同名的 `.html` 文件。

例如：

```bash
npx @rongyan/mdflow-cli post.md
```

会生成：

```bash
post.html
```

如果 `--output` 只传目录，则会自动使用 Markdown 文件名：

```bash
npx @rongyan/mdflow-cli post.md --output dist/
```

会生成：

```bash
dist/post.html
```

如果要直接输出微信公众号富文本内容：

```bash
npx @rongyan/mdflow-cli post.md --wxhtml
```

## 效果示例

以下示例文件会随 npm 包一起发布，可直接本地运行：
`examples/minimal-showcase.md`

### 主题

<table>
  <tr>
    <td width="33.33%"><img src="images/theme-default.png" width="100%" alt="theme default" /></td>
    <td width="33.33%"><img src="images/theme-grace.png" width="100%" alt="theme grace" /></td>
    <td width="33.33%"><img src="images/theme-simple.png" width="100%" alt="theme simple" /></td>
  </tr>
  <tr>
    <td><code>--theme=经典</code></td>
    <td><code>--theme=优雅</code></td>
    <td><code>--theme=简洁</code></td>
  </tr>
</table>

### 主题色

以下截图固定使用 `--theme=经典`，主要观察标题颜色和边框色变化。

<table>
  <tr>
    <td width="33.33%"><img src="images/color-blue.png" width="100%" alt="color blue" /></td>
    <td width="33.33%"><img src="images/color-green.png" width="100%" alt="color green" /></td>
    <td width="33.33%"><img src="images/color-orange.png" width="100%" alt="color orange" /></td>
  </tr>
  <tr>
    <td><code>--theme=经典 --primary-color=经典蓝</code></td>
    <td><code>--theme=经典 --primary-color=翡翠绿</code></td>
    <td><code>--theme=经典 --primary-color=活力橘</code></td>
  </tr>
</table>

<table>
  <tr>
    <td width="33.33%"><img src="images/color-yellow.png" width="100%" alt="color yellow" /></td>
    <td width="33.33%"><img src="images/color-purple.png" width="100%" alt="color purple" /></td>
    <td width="33.33%"><img src="images/color-sky.png" width="100%" alt="color sky" /></td>
  </tr>
  <tr>
    <td><code>--theme=经典 --primary-color=柠檬黄</code></td>
    <td><code>--theme=经典 --primary-color=薰衣紫</code></td>
    <td><code>--theme=经典 --primary-color=天空蓝</code></td>
  </tr>
</table>

<table>
  <tr>
    <td width="33.33%"><img src="images/color-rosegold.png" width="100%" alt="color rosegold" /></td>
    <td width="33.33%"><img src="images/color-olive.png" width="100%" alt="color olive" /></td>
    <td width="33.33%"><img src="images/color-black.png" width="100%" alt="color black" /></td>
  </tr>
  <tr>
    <td><code>--theme=经典 --primary-color=玫瑰金</code></td>
    <td><code>--theme=经典 --primary-color=橄榄绿</code></td>
    <td><code>--theme=经典 --primary-color=石墨黑</code></td>
  </tr>
</table>

<table>
  <tr>
    <td width="33.33%"><img src="images/color-gray.png" width="100%" alt="color gray" /></td>
    <td width="33.33%"><img src="images/color-pink.png" width="100%" alt="color pink" /></td>
    <td width="33.33%"></td>
  </tr>
  <tr>
    <td><code>--theme=经典 --primary-color=雾烟灰</code></td>
    <td><code>--theme=经典 --primary-color=樱花粉</code></td>
    <td></td>
  </tr>
</table>

### 标题样式

以下截图固定使用 `--theme=经典`，并让一级、二级、三级标题使用同一套样式，便于对比。

<table>
  <tr>
    <td width="33.33%"><img src="images/heading-default.png" width="100%" alt="heading default" /></td>
    <td width="33.33%"><img src="images/heading-color-only.png" width="100%" alt="heading color only" /></td>
    <td width="33.33%"><img src="images/heading-border-bottom.png" width="100%" alt="heading border bottom" /></td>
  </tr>
  <tr>
    <td><code>--theme=经典 --heading-1=默认 --heading-2=默认 --heading-3=默认</code></td>
    <td><code>--theme=经典 --heading-1=主题色文字 --heading-2=主题色文字 --heading-3=主题色文字</code></td>
    <td><code>--theme=经典 --heading-1=下边框 --heading-2=下边框 --heading-3=下边框</code></td>
  </tr>
</table>

<table>
  <tr>
    <td width="33.33%"><img src="images/heading-border-left.png" width="100%" alt="heading border left" /></td>
    <td width="33.33%"></td>
    <td width="33.33%"></td>
  </tr>
  <tr>
    <td><code>--theme=经典 --heading-1=左边框 --heading-2=左边框 --heading-3=左边框</code></td>
    <td></td>
    <td></td>
  </tr>
</table>

## Mermaid 输出

如果 Markdown 中包含 ` ```mermaid ` 代码块，CLI 会自动调用官方 `@mermaid-js/mermaid-cli` 转成 PNG。

生成规则：

- HTML 文件：写到 `--output` 指定位置，或 Markdown 同级同名 `.html`
- Mermaid 图片：写到 Markdown 同级的 `assets/` 目录
- HTML 中使用相对路径引用这些 PNG 文件

例如：

```bash
post.md
assets/mermaid-1-xxxxxx.png
post.html
```

## 参数

### 输入与输出

- `mdflow-cli <input.md>`：必填，Markdown 文件路径
- `-o, --output=out.html`：输出 HTML 文件路径；可传文件名或目录
- `--wxhtml`：直接输出紧凑的公众号 `content` 形态到 stdout，不写文件
- `-h, --help`：显示帮助

### 主题

- `--theme=经典|优雅|简洁`
- `--theme=default|grace|simple`
- 兼容别名：`classic`
- 默认值：`经典`，即 `default`

### 字体

- `--font-family=无衬线|衬线|等宽`
- `--font-family=sans|serif|mono|monospace`
- 兼容别名参数名：`--font`、`--fontFamily`
- 默认值：`无衬线`

对应关系：

- `无衬线` / `sans`
- `衬线` / `serif`
- `等宽` / `mono` / `monospace`

### 字号

- `--font-size=更小|稍小|推荐|稍大|更大`
- `--font-size=14px|15px|16px|17px|18px`
- 兼容别名参数名：`--size`、`--fontSize`
- 默认值：`推荐`，即 `16px`

对应关系：

- `更小` = `14px`
- `稍小` = `15px`
- `推荐` = `16px`
- `稍大` = `17px`
- `更大` = `18px`

### 主题色

- `--primary-color=经典蓝|翡翠绿|活力橘|柠檬黄|薰衣紫|天空蓝|玫瑰金|橄榄绿|石墨黑|雾烟灰|樱花粉`
- `--primary-color=blue|green|orange|yellow|purple|sky|rosegold|olive|black|gray|pink`
- `--custom-primary-color=#1677ff`
- 兼容别名参数名：
  `--color`、`--primaryColor`、`--customColor`、`--customPrimaryColor`
- 默认值：`经典蓝`

自定义颜色当前支持：

- `#RGB`
- `#RRGGBB`
- `rgb(...)`
- `rgba(...)`
- `hsl(...)`
- `hsla(...)`

### 标题样式

- `--heading-1=默认|主题色文字|下边框|左边框`
- `--heading-2=默认|主题色文字|下边框|左边框`
- `--heading-3=默认|主题色文字|下边框|左边框`
- 英文兼容值：
  `default|color-only|border-bottom|border-left`
- 额外兼容短别名：
  `color|bottom|left`
- 兼容别名参数名：
  `--heading1`、`--heading2`、`--heading3`
- 默认值：`h1/h2/h3` 都是 `默认`

### 代码块主题

- `--code-theme=github-dark`
- 也支持任意 highlight.js 主题名，比如：
  `github`、`github-dark`、`atom-one-dark`、`monokai`、`vs2015`
- 也支持直接传完整 CSS URL
- 兼容别名参数名：`--codeTheme`
- 默认值：`github-dark`

说明：

- 当传主题名时，会自动拼成
  `https://cdn-doocs.oss-cn-shenzhen.aliyuncs.com/npm/highlightjs/11.11.1/styles/<theme>.min.css`

### 图注格式

- `--legend=title 优先|alt 优先|只显示 title|只显示 alt|文件名|不显示`
- 英文兼容值：
  `title-alt|alt-title|title|alt|filename|none`
- 默认值：`只显示 alt`

### 布尔开关

以下参数都支持：

- 中文：`开启|关闭`、`开|关`
- 英文：`true|false`、`yes|no`、`on|off`
- 数字：`1|0`

支持的布尔参数：

- `--mac-code-block=开启|关闭`
  默认值：`开启`
- `--code-line-numbers=开启|关闭`
  兼容别名参数名：`--codeLineNumbers`
  默认值：`关闭`
- `--cite-status=开启|关闭`
  兼容别名参数名：`--cite`
  默认值：`关闭`
- `--use-indent=开启|关闭`
  兼容别名参数名：`--useIndent`
  默认值：`关闭`
- `--use-justify=开启|关闭`
  兼容别名参数名：`--useJustify`
  默认值：`关闭`

## 示例

```bash
npx @rongyan/mdflow-cli article.md \
  --theme=优雅 \
  --font-family=衬线 \
  --font-size=稍大 \
  --primary-color=翡翠绿 \
  --heading-1=下边框 \
  --heading-2=主题色文字 \
  --heading-3=左边框 \
  --code-theme=github-dark \
  --legend=文件名 \
  --mac-code-block=开启 \
  --code-line-numbers=开启 \
  --cite-status=开启 \
  --use-indent=开启 \
  --use-justify=开启 \
  --output=article.html
```

```bash
npx @rongyan/mdflow-cli article.md --wxhtml
```
