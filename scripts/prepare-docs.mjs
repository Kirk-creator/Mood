import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const docs = join(process.cwd(), 'docs')
const indexPath = join(docs, 'index.html')

let html = readFileSync(indexPath, 'utf8')
html = html.replace(
  /\s*<script>\s*\/\/ GitHub Pages[\s\S]*?\)\(\)\s*<\/script>/,
  '',
)
writeFileSync(indexPath, html)
writeFileSync(join(docs, '.nojekyll'), '')
console.log('Prepared docs/ for GitHub Pages')
