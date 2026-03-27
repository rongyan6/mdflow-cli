import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const assetsDir = path.resolve(__dirname, '../assets')

function readAsset(name) {
  return readFileSync(path.join(assetsDir, name), 'utf8')
}

export const baseCss = readAsset('base.css')

export const themeCssMap = {
  default: readAsset('default.css'),
  grace: readAsset('grace.css'),
  simple: readAsset('simple.css'),
}
