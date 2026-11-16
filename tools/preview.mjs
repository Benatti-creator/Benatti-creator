// Monta preview.html que imita o layout do README no GitHub, para julgar o render.
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const t = process.argv[2] || 'dark'
const bg = t === 'dark' ? '#0d1117' : '#ffffff'
const V = Date.now()
const A = (n) => `assets/${n}-${t}.svg?v=${V}`
const full = (n, alt = '') => `<img src="${A(n)}" alt="${alt}" style="width:100%;display:block;margin:0 auto">`
const btn = (n) => `<img src="${A(n)}" style="height:36px;vertical-align:middle">`
const card = (n) => `<img src="${A(n)}" style="width:49%;vertical-align:top">`
const br = '<div style="height:26px"></div>'
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{background:${bg};margin:0;padding:32px 0;font-family:sans-serif}
.wrap{max-width:860px;margin:0 auto;text-align:center}
</style></head><body><div class="wrap">
${full('banner')}
<div style="height:16px"></div>
${full('terminal')}
<div style="height:18px"></div>
${btn('btn-github')}&nbsp;${btn('btn-whatsapp')}&nbsp;${btn('btn-email')}
${br}
${full('sec-sobre')}${full('sobre')}${br}
${full('sec-servicos')}${full('servicos')}${br}
${full('sec-stack')}${full('stack')}${br}
${full('sec-trabalhos')}
<div style="display:flex;gap:2%;flex-wrap:wrap;justify-content:center">${card('card-iplanet')}${card('card-isabella')}</div>
<div style="height:12px"></div>
<div style="display:flex;gap:2%;justify-content:flex-start">${card('card-jatahy')}</div>
${br}
${full('sec-seguranca')}${full('seguranca')}${br}
${full('sec-contato')}${full('contato')}${br}
${full('rodape')}
</div></body></html>`
writeFileSync(join(ROOT, `preview-${t}.html`), html)
console.log(`preview-${t}.html`)
