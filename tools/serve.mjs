import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const MIME = { '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.css': 'text/css', '.js': 'text/javascript' }
const port = Number(process.argv[2] || 8799)
createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p === '/') p = '/preview-dark.html'
  const fp = join(ROOT, p)
  if (!existsSync(fp)) { res.writeHead(404); res.end('nf'); return }
  res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
  res.end(readFileSync(fp))
}).listen(port, () => console.log('serving on ' + port))
