import postcss from 'postcss'
import postcssCalc from 'postcss-calc'
import postcssCustomProperties from 'postcss-custom-properties'

export async function processCss(css) {
  try {
    const result = await postcss([
      postcssCustomProperties({
        preserve: false,
      }),
      postcssCalc({
        preserve: false,
        mediaQueries: false,
        selectors: false,
      }),
    ]).process(css, {
      from: undefined,
    })

    return result.css
  }
  catch (error) {
    console.warn(`mdflow-cli: CSS 处理失败，已回退到原始样式。${error instanceof Error ? error.message : String(error)}`)
    return css
  }
}
