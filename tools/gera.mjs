// Gera os SVGs do perfil (Benatti-creator/Benatti-creator).
// Cada peça sai em dark e light; os textos ficam em CONTEUDO.
// Rodar:  node tools/gera.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const FONTS = join(ROOT, 'tools', 'fonts')
const SRC = join(ROOT, 'tools', 'src')
const OUT = join(ROOT, 'assets')
mkdirSync(OUT, { recursive: true })

const b64 = (p) => readFileSync(p).toString('base64')
const font = (f) => `data:font/woff2;base64,${b64(join(FONTS, f))}`
const shot = (f) => `data:image/webp;base64,${b64(join(SRC, f))}`
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const FONTCSS = `
@font-face{font-family:'Disp';font-weight:700;font-display:block;src:url(${font('space-grotesk-700.woff2')}) format('woff2')}
@font-face{font-family:'Disp';font-weight:500;font-display:block;src:url(${font('space-grotesk-500.woff2')}) format('woff2')}
@font-face{font-family:'Mono';font-weight:400;font-display:block;src:url(${font('jetbrains-mono-400.woff2')}) format('woff2')}
@font-face{font-family:'Mono';font-weight:700;font-display:block;src:url(${font('jetbrains-mono-700.woff2')}) format('woff2')}`

const TH = {
  dark: {
    bg0: '#060a12', bg1: '#0b1322', panel: '#0d1829', panel2: '#0a1424',
    line: '#182941', line2: '#26405f',
    ink: '#eaf2fc', mut: '#97adc7', dim: '#5f7a97',
    cyan: '#5ad6ff', blue: '#2b7fff', amber: '#ffcf6b', ok: '#5ad6ff',
    dot: '#2b7fff', dotOp: 0.18, fadeOp: 0.22, shadow: 0.55, chrome: '#0a1526'
  },
  light: {
    bg0: '#e6ecf5', bg1: '#ffffff', panel: '#ffffff', panel2: '#eef3fb',
    line: '#d4deec', line2: '#bccde3',
    ink: '#0a1422', mut: '#2f4258', dim: '#52657c',
    cyan: '#0a6f9c', blue: '#1552d6', amber: '#9a6410', ok: '#0a6f9c',
    dot: '#1f6fe6', dotOp: 0.085, fadeOp: 0.08, shadow: 0.16, chrome: '#e9f0f9'
  }
}

// --- helpers --------------------------------------------------------------
function head(w, h, C, t) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" role="img">
<defs>
<style>${FONTCSS}</style>
<linearGradient id="acc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.cyan}"/><stop offset="1" stop-color="${C.blue}"/></linearGradient>
<linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${C.bg1}"/><stop offset="1" stop-color="${C.bg0}"/></linearGradient>
<pattern id="dots" width="13" height="13" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.05" fill="${C.dot}" opacity="${C.dotOp}"/></pattern>
<radialGradient id="fade" cx="80%" cy="22%" r="75%"><stop offset="0" stop-color="${C.blue}" stop-opacity="${C.fadeOp}"/><stop offset="1" stop-color="${C.blue}" stop-opacity="0"/></radialGradient>
<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="7" stdDeviation="16" flood-color="#000" flood-opacity="${C.shadow}"/></filter>
</defs>`
}
const panel = (x, y, w, h, C, { r = 16, fill = C.panel, stroke = C.line, sw = 1.5 } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`

function hexagon(cx, cy, s, C, { op = 1, sw = 3, node = 5 } = {}) {
  const P = [[0, -1], [0.866, -0.5], [0.866, 0.5], [0, 1], [-0.866, 0.5], [-0.866, -0.5]]
  const pts = P.map(([x, y]) => `${(cx + x * s).toFixed(1)},${(cy + y * s).toFixed(1)}`).join(' ')
  const nodes = P.map(([x, y]) => `<circle cx="${(cx + x * s).toFixed(1)}" cy="${(cy + y * s).toFixed(1)}" r="${node}" fill="url(#acc)"/>`).join('')
  return `<g opacity="${op}"><polygon points="${pts}" fill="none" stroke="url(#acc)" stroke-width="${sw}" stroke-linejoin="round"/><polygon points="${P.map(([x, y]) => `${(cx + x * s * 0.82).toFixed(1)},${(cy + y * s * 0.82).toFixed(1)}`).join(' ')}" fill="none" stroke="url(#acc)" stroke-width="1" opacity="0.3"/>${nodes}</g>`
}
const T = (x, y, s, txt, { f = 'Mono', w = 400, fill, ls = 0, anchor = 'start', op = 1 } = {}) =>
  `<text x="${x}" y="${y}" font-family="${f}" font-weight="${w}" font-size="${s}" fill="${fill}" letter-spacing="${ls}" text-anchor="${anchor}" opacity="${op}">${esc(txt)}</text>`

function wrap(txt, max) {
  const words = txt.split(' '); const lines = []; let cur = ''
  for (const wd of words) {
    if ((cur + ' ' + wd).trim().length > max) { if (cur) lines.push(cur); cur = wd } else cur = (cur + ' ' + wd).trim()
  }
  if (cur) lines.push(cur); return lines
}
const para = (x, y, lh, s, txt, max, opts) =>
  wrap(txt, max).map((ln, i) => T(x, y + i * lh, s, ln, opts)).join('')

function sectionHeader(num, label, C) {
  const w = 1000, h = 58
  let b = head(w, h, C)
  b += `<line x1="0" y1="${h - 10}" x2="${w}" y2="${h - 10}" stroke="${C.line}" stroke-width="1"/>`
  b += `<rect x="0" y="${h - 11}" width="118" height="2" fill="url(#acc)"/>`
  b += T(2, 34, 30, num, { f: 'Mono', w: 700, fill: C.cyan, ls: 1 })
  b += T(66, 34, 30, '//', { f: 'Mono', w: 400, fill: C.dim })
  b += T(112, 33, 23, label, { f: 'Disp', w: 700, fill: C.ink, ls: 3 })
  b += `</svg>`
  return b
}

function browserFrame(x, y, w, h, C, { url = '', img = null, clipId = 'c' } = {}) {
  const bar = 30
  let g = panel(x, y, w, h, C, { r: 12, fill: C.chrome, stroke: C.line2, sw: 1.5 })
  g += `<circle cx="${x + 18}" cy="${y + 15}" r="4" fill="#ff5f57"/><circle cx="${x + 33}" cy="${y + 15}" r="4" fill="#febc2e"/><circle cx="${x + 48}" cy="${y + 15}" r="4" fill="#28c840"/>`
  g += `<rect x="${x + 66}" y="${y + 7}" width="${w - 84}" height="16" rx="8" fill="${C.panel2}" stroke="${C.line}" stroke-width="1"/>`
  g += T(x + 76, y + 19, 10.5, url, { f: 'Mono', w: 400, fill: C.dim })
  const ih = h - bar
  g += `<defs><clipPath id="${clipId}"><rect x="${x + 1.5}" y="${y + bar}" width="${w - 3}" height="${ih - 1.5}" rx="2"/></clipPath></defs>`
  if (img) g += `<image href="${img}" x="${x + 1.5}" y="${y + bar}" width="${w - 3}" height="${ih - 1.5}" preserveAspectRatio="xMidYMin slice" clip-path="url(#${clipId})"/>`
  else g += `<rect x="${x + 1.5}" y="${y + bar}" width="${w - 3}" height="${ih - 1.5}" fill="${C.panel2}" clip-path="url(#${clipId})"/>`
  return g
}

// --- CONTEÚDO -------------------------------------------------------------
const C_ = {
  nome1: 'CAUÃ', nome2: 'BENATTI',
  kicker: 'BENATTI & BENATTI   //   SEGURANÇA · DESENVOLVIMENTO',
  tagline: 'Pentest web autorizado · Criação de sites · Cardápios & catálogos online',
  coord: 'LAT −17.88   LON −51.71   //   JATAÍ-GO · SUDOESTE GOIANO',
  intro: 'Venho da segurança ofensiva. Faço sites que já nascem protegidos.',
  sobre: 'Trabalho com segurança ofensiva — pentest de aplicações web, sempre com autorização e escopo. Foi daí que entrei no desenvolvimento: hoje crio sites, cardápios e catálogos online e ferramentas sob medida. A diferença é que eu construo já pensando em quem vai tentar invadir. Atendo Jataí e o sudoeste goiano, e trabalho remoto pro Brasil inteiro.',
  servicos: [
    ['01', 'Criação de sites', 'Site rápido, bonito e feito pra vender. Código limpo, SEO e celular em primeiro lugar.', 'WEB'],
    ['02', 'Cardápios & catálogos online', 'Vitrine com pedido direto no WhatsApp — pra restaurante, loja e serviço local.', 'CATÁLOGO + WHATSAPP'],
    ['03', 'Cibersegurança', 'Pentest web autorizado e proteção de site: acho a brecha antes que usem contra você.', 'PENTEST · HARDENING'],
    ['04', 'Desenvolvimento sob medida', 'Automação, painel, integração e ferramenta interna — o que seu processo precisar.', 'FERRAMENTA'],
  ],
  stack: [
    ['SEGURANÇA', 'Burp Suite · Nmap · Wireshark · OWASP · Linux · Bash'],
    ['WEB', 'HTML · CSS · JavaScript · Node.js · SEO · Git'],
    ['DEV', 'Python · APIs & MCP · SQLite · automação'],
  ],
  trabalhos: [
    { tag: 'CLIENTE · LOJA', nome: 'iPlanet Store', url: 'iplanet-store ↗', shot: 'shot-iplanet.webp', desc: 'Loja de iPhone e assistência técnica. Catálogo, montador de orçamento e pedido no WhatsApp.', feito: 'HTML · CSS · JS · MULTI-PÁGINA', link: 'https://benatti-creator.github.io/previas/iplanet-store/' },
    { tag: 'CLIENTE · JATAÍ-GO', nome: 'Isabella Ribeiro', url: 'isabella-ribeiro ↗', shot: 'shot-isabella.webp', desc: 'Site de autoridade pra biomédica esteta. Agendamento no WhatsApp, SEO e prova social (5,0 no Google).', feito: 'HTML · CSS · JS · SEO', link: 'https://benatti-creator.github.io/previas/isabella-ribeiro-biomedica/' },
    { tag: 'CLIENTE · JATAÍ-GO', nome: 'Jatahy Dreams Eventos', url: 'jatahy-dreams ↗', shot: 'shot-jatahy.webp', desc: 'Salão de festas. Consulta de data e orçamento no WhatsApp, foto do espaço e avaliações.', feito: 'HTML · CSS · JS · MULTI-PÁGINA', link: 'https://benatti-creator.github.io/previas/jatahy-dreams-eventos/' },
  ],
  checklist: ['headers de segurança no lugar', 'formulário sem injeção', 'dependências atualizadas', 'dados do cliente fora de risco', 'HTTPS e back-up ativos'],
  segText: 'Todo site que eu entrego passa por uma revisão de segurança antes de ir pro ar. Não é enfeite: é o mesmo olhar que eu uso num pentest, virado pra proteger o seu.',
  segNota: 'Pentest completo de um sistema seu? Só com contrato e escopo definido.',
  contatoTit: 'Vamos conversar',
  contatoTxt: 'Orçamento, uma dúvida ou um site pra tirar do papel — me chama. Respondo de Jataí-GO.',
  contatoLinhas: ['WhatsApp  ·  (número em breve)', 'E-mail  ·  (em breve)', 'Base  ·  Jataí · Rio Verde · Mineiros'],
  rodape: 'CAUÃ BENATTI   ·   BENATTI & BENATTI   ·   JATAÍ-GO · SUDOESTE GOIANO',
}

// --- PEÇAS ----------------------------------------------------------------
function banner(C, t) {
  const w = 1000, h = 300
  let b = head(w, h, C)
  b += panel(0.75, 0.75, w - 1.5, h - 1.5, C, { r: 18, fill: 'url(#bg)', stroke: C.line2, sw: 1.5 })
  b += `<rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="18" fill="url(#dots)"/>`
  b += `<rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="18" fill="url(#fade)"/>`
  b += hexagon(862, 150, 150, C, { op: t === 'dark' ? 0.9 : 0.75, sw: 3, node: 6 })
  b += `<text x="862" y="152" font-family="Disp" font-weight="700" font-size="76" letter-spacing="-5" fill="url(#acc)" text-anchor="middle" dominant-baseline="central" opacity="${t === 'dark' ? 0.95 : 0.9}">BB</text>`
  b += T(56, 58, 13, C_.kicker, { f: 'Mono', w: 700, fill: C.cyan, ls: 2.5 })
  b += `<line x1="56" y1="72" x2="300" y2="72" stroke="${C.line2}" stroke-width="1"/>`
  b += `<text x="54" y="150" font-family="Disp" font-weight="700" font-size="76" letter-spacing="-1">`
  b += `<tspan fill="${C.ink}">${C_.nome1} </tspan><tspan fill="url(#acc)">${C_.nome2}</tspan></text>`
  b += T(56, 196, 16.5, C_.tagline, { f: 'Mono', w: 400, fill: C.mut })
  b += `<rect x="56" y="232" width="9" height="9" fill="url(#acc)"/>`
  b += T(78, 241, 13, C_.coord, { f: 'Mono', w: 400, fill: C.dim, ls: 1 })
  // barrinha "secure build"
  b += T(56, 275, 11.5, 'SECURE BUILD', { f: 'Mono', w: 700, fill: C.dim, ls: 2 })
  b += `<rect x="168" y="266" width="150" height="7" rx="3.5" fill="${C.line}"/>`
  b += `<rect x="168" y="266" width="138" height="7" rx="3.5" fill="url(#acc)"/>`
  b += T(330, 275, 11.5, 'OK', { f: 'Mono', w: 700, fill: C.cyan, ls: 1 })
  b += `</svg>`; return b
}

function terminal(C, t) {
  const w = 1000, h = 132
  let b = head(w, h, C)
  b += panel(0.75, 0.75, w - 1.5, h - 1.5, C, { r: 14, fill: C.panel, stroke: C.line2 })
  b += `<rect x="0.75" y="0.75" width="${w - 1.5}" height="30" rx="14" fill="${C.chrome}"/>`
  b += `<rect x="0.75" y="16" width="${w - 1.5}" height="15" fill="${C.chrome}"/>`
  b += `<circle cx="22" cy="16" r="4.5" fill="#ff5f57"/><circle cx="39" cy="16" r="4.5" fill="#febc2e"/><circle cx="56" cy="16" r="4.5" fill="#28c840"/>`
  b += T(w / 2, 20, 11.5, 'caua@benatti — bash', { f: 'Mono', w: 400, fill: C.dim, anchor: 'middle' })
  b += `<line x1="0.75" y1="30.75" x2="${w - 0.75}" y2="30.75" stroke="${C.line}" stroke-width="1"/>`
  b += T(26, 64, 15.5, '$ whoami', { f: 'Mono', w: 700, fill: C.ink })
  b += `<tspan/>`
  b += `<text x="26" y="88" font-family="Mono" font-size="15.5"><tspan fill="${C.cyan}">caua benatti</tspan><tspan fill="${C.mut}"> — pentester &amp; dev · jataí-go</tspan></text>`
  b += `<text x="26" y="114" font-family="Mono" font-size="15.5"><tspan fill="${C.dim}">// </tspan><tspan fill="${C.mut}">${esc(C_.intro)}</tspan><tspan fill="${C.cyan}" font-weight="700">▊</tspan></text>`
  b += `</svg>`; return b
}

function button(label, C, t, glyph) {
  const w = Math.round(58 + label.length * 9.6), h = 44
  let b = head(w, h, C)
  b += panel(1, 1, w - 2, h - 2, C, { r: 10, fill: C.panel, stroke: C.line2, sw: 1.5 })
  b += `<rect x="1" y="1" width="4" height="${h - 2}" rx="2" fill="url(#acc)"/>`
  b += T(20, h / 2 + 4.5, 13.5, glyph, { f: 'Mono', w: 700, fill: C.cyan })
  b += T(40, h / 2 + 4.5, 13.5, label, { f: 'Mono', w: 700, fill: C.ink, ls: 0.5 })
  b += `</svg>`; return b
}

function sobre(C, t) {
  const w = 1000, h = 150
  let b = head(w, h, C)
  b += panel(0.75, 0.75, w - 1.5, h - 1.5, C, { r: 14, fill: C.panel, stroke: C.line })
  b += `<rect x="0.75" y="0.75" width="5" height="${h - 1.5}" rx="2" fill="url(#acc)"/>`
  b += para(34, 44, 29, 17, C_.sobre, 92, { f: 'Mono', w: 400, fill: C.mut })
  b += `</svg>`; return b
}

function servicos(C, t) {
  const w = 1000, rowH = 76, h = rowH * 4 + 8
  let b = head(w, h, C)
  C_.servicos.forEach((s, i) => {
    const y = i * rowH
    b += `<line x1="0" y1="${y + rowH}" x2="${w}" y2="${y + rowH}" stroke="${C.line}" stroke-width="1"/>`
    b += T(4, y + 48, 26, s[0], { f: 'Mono', w: 700, fill: C.cyan })
    b += T(70, y + 40, 21, s[1], { f: 'Disp', w: 700, fill: C.ink })
    b += T(70, y + 64, 14, s[2], { f: 'Mono', w: 400, fill: C.mut })
    // tag à direita
    const tw = s[3].length * 8.2 + 26
    b += panel(w - tw - 2, y + 24, tw, 26, C, { r: 13, fill: C.panel2, stroke: C.line2, sw: 1 })
    b += T(w - tw / 2 - 2, y + 41, 11.5, s[3], { f: 'Mono', w: 700, fill: C.cyan, ls: 1, anchor: 'middle' })
  })
  b += `</svg>`; return b
}

function stack(C, t) {
  const w = 1000, rowH = 52, h = rowH * 3 + 6
  let b = head(w, h, C)
  C_.stack.forEach((g, i) => {
    const y = i * rowH + 34
    b += T(4, y, 13, g[0], { f: 'Mono', w: 700, fill: C.cyan, ls: 2 })
    b += T(190, y, 15, g[1], { f: 'Mono', w: 400, fill: C.mut })
    if (i < 2) b += `<line x1="0" y1="${y + 20}" x2="${w}" y2="${y + 20}" stroke="${C.line}" stroke-width="1"/>`
  })
  b += `</svg>`; return b
}

function card(d, i, C, t) {
  const w = 490, h = 388
  let b = head(w, h, C)
  b += panel(0.75, 0.75, w - 1.5, h - 1.5, C, { r: 16, fill: C.panel, stroke: C.line2 })
  b += browserFrame(16, 16, w - 32, 206, C, { url: d.url, img: shot(d.shot), clipId: 'cl' + i })
  let y = 256
  b += T(18, y, 11, d.tag, { f: 'Mono', w: 700, fill: C.cyan, ls: 1.5 })
  b += T(18, y + 28, 23, d.nome, { f: 'Disp', w: 700, fill: C.ink })
  b += para(18, y + 54, 20, 13.5, d.desc, 50, { f: 'Mono', w: 400, fill: C.mut })
  b += `<line x1="18" y1="${h - 44}" x2="${w - 18}" y2="${h - 44}" stroke="${C.line}" stroke-width="1"/>`
  b += T(18, h - 22, 10.5, d.feito, { f: 'Mono', w: 400, fill: C.dim, ls: 0.5 })
  b += T(w - 18, h - 22, 12.5, 'ver ao vivo ↗', { f: 'Mono', w: 700, fill: C.cyan, anchor: 'end' })
  b += `</svg>`; return b
}

function seguranca(C, t) {
  const w = 1000, h = 268
  let b = head(w, h, C)
  // esquerda: texto
  b += T(4, 40, 27, 'Seu site nasce protegido', { f: 'Disp', w: 700, fill: C.ink })
  b += para(4, 78, 26, 15, C_.segText, 52, { f: 'Mono', w: 400, fill: C.mut })
  b += `<rect x="4" y="196" width="9" height="9" fill="${C.amber}"/>`
  b += para(26, 204, 22, 13.5, C_.segNota, 54, { f: 'Mono', w: 700, fill: C.amber })
  // direita: painel de relatório (sem janela-terminal, para não repetir o recurso do hero)
  const tx = 520, tw = w - tx
  b += panel(tx, 4, tw - 4, h - 8, C, { r: 14, fill: C.panel, stroke: C.line2 })
  b += `<rect x="${tx}" y="4" width="${tw - 4}" height="32" rx="14" fill="${C.chrome}"/>`
  b += `<rect x="${tx}" y="20" width="${tw - 4}" height="16" fill="${C.chrome}"/>`
  // escudo com check (identidade de segurança, diferente da janela mac do hero)
  b += `<path d="M${tx + 19} 12 H${tx + 35} V19 Q${tx + 35} 28 ${tx + 27} 31 Q${tx + 19} 28 ${tx + 19} 19 Z" fill="none" stroke="url(#acc)" stroke-width="1.6" stroke-linejoin="round"/>`
  b += `<path d="M${tx + 23.5} 20 l 2.6 2.8 l 4.6 -5.6" fill="none" stroke="url(#acc)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`
  b += T(tx + 46, 26, 12.5, 'RELATÓRIO DE SEGURANÇA', { f: 'Mono', w: 700, fill: C.ink, ls: 1 })
  b += `<line x1="${tx}" y1="36" x2="${tx + tw - 4}" y2="36" stroke="${C.line}" stroke-width="1"/>`
  b += T(tx + 20, 60, 12, '// CHECAGEM ANTES DE PUBLICAR', { f: 'Mono', w: 700, fill: C.dim, ls: 0.5 })
  C_.checklist.forEach((c, i) => {
    const y = 90 + i * 31
    b += `<text x="${tx + 20}" y="${y}" font-family="Mono" font-size="13.5"><tspan fill="${C.cyan}" font-weight="700">[ok]</tspan><tspan fill="${C.mut}">  ${esc(c)}</tspan></text>`
  })
  b += `</svg>`; return b
}

function contato(C, t) {
  const w = 1000, h = 168
  let b = head(w, h, C)
  b += panel(0.75, 0.75, w - 1.5, h - 1.5, C, { r: 16, fill: 'url(#bg)', stroke: C.line2 })
  b += `<rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="16" fill="url(#dots)"/>`
  b += hexagon(905, 84, 74, C, { op: t === 'dark' ? 0.7 : 0.6, sw: 2.5, node: 4 })
  b += `<text x="905" y="85" font-family="Disp" font-weight="700" font-size="34" letter-spacing="-2" fill="url(#acc)" text-anchor="middle" dominant-baseline="central" opacity="0.9">BB</text>`
  b += T(36, 56, 32, C_.contatoTit, { f: 'Disp', w: 700, fill: C.ink })
  b += para(36, 92, 24, 15, C_.contatoTxt, 72, { f: 'Mono', w: 400, fill: C.mut })
  C_.contatoLinhas.forEach((l, i) => {
    b += `<text x="36" y="${132 + i * 0}" font-family="Mono" font-size="13.5"></text>`
  })
  // três linhas de contato lado a lado
  let cx = 36
  C_.contatoLinhas.forEach((l) => {
    const lw = l.length * 7.4 + 24
    b += panel(cx, 128, lw, 28, C, { r: 14, fill: C.panel, stroke: C.line2, sw: 1 })
    b += T(cx + 12, 146, 12.5, l, { f: 'Mono', w: 700, fill: C.cyan })
    cx += lw + 10
  })
  b += `</svg>`; return b
}

function rodape(C, t) {
  const w = 1000, h = 52
  let b = head(w, h, C)
  b += `<line x1="0" y1="2" x2="${w}" y2="2" stroke="${C.line}" stroke-width="1"/>`
  b += `<rect x="0" y="1" width="118" height="2" fill="url(#acc)"/>`
  b += hexagon(24, 30, 13, C, { op: 1, sw: 2, node: 2.5 })
  b += T(48, 35, 12, C_.rodape, { f: 'Mono', w: 700, fill: C.dim, ls: 1.5 })
  b += `</svg>`; return b
}

// --- GERAR ----------------------------------------------------------------
const pieces = {
  banner, terminal, sobre, servicos, stack, seguranca, contato, rodape,
}
const sections = [
  ['sec-sobre', '01', 'SOBRE'], ['sec-servicos', '02', 'SERVIÇOS'],
  ['sec-stack', '03', 'STACK & FERRAMENTAS'], ['sec-trabalhos', '04', 'TRABALHOS'],
  ['sec-seguranca', '05', 'SEGURANÇA'], ['sec-contato', '06', 'CONTATO'],
]
const buttons = [
  ['btn-github', 'GitHub', '▸'], ['btn-whatsapp', 'WhatsApp', '✦'], ['btn-email', 'E-mail', '✉'],
]

let count = 0
for (const t of ['dark', 'light']) {
  const C = TH[t]
  for (const [name, fn] of Object.entries(pieces)) {
    writeFileSync(join(OUT, `${name}-${t}.svg`), fn(C, t)); count++
  }
  for (const [name, num, label] of sections) {
    writeFileSync(join(OUT, `${name}-${t}.svg`), sectionHeader(num, label, C)); count++
  }
  for (const [name, label, glyph] of buttons) {
    writeFileSync(join(OUT, `${name}-${t}.svg`), button(label, C, t, glyph)); count++
  }
  C_.trabalhos.forEach((d, i) => {
    writeFileSync(join(OUT, `card-${['iplanet', 'isabella', 'jatahy'][i]}-${t}.svg`), card(d, i, C, t)); count++
  })
}
console.log(`gerados ${count} svgs em ${OUT}`)
