/* Gera as imagens do perfil (assets/*.png) a partir de tools/perfil.html.
 * Uso: node tools/gerar.cjs
 * Precisa do Playwright com o Chrome instalado (aqui usamos o do projeto do Decoder)
 * e de internet na hora de gerar, para as fontes do Google (as mesmas do portfólio). */
const path = require("path");
const fs = require("fs");
const { chromium } = require(process.env.PLAYWRIGHT || "C:/dev/decoder-carreiras-policiais/node_modules/playwright");

(async () => {
  const saida = path.join(__dirname, "..", "assets");
  fs.mkdirSync(saida, { recursive: true });
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
  await p.goto("file:///" + path.join(__dirname, "perfil.html").replace(/\\/g, "/"), { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  const faltando = await p.evaluate(() => ["Archivo", "Instrument Sans", "IBM Plex Mono"].filter((f) => !document.fonts.check(`16px "${f}"`)));
  if (faltando.length) throw new Error("fontes não carregaram: " + faltando.join(", "));
  const pecas = await p.$$eval("[data-peca]", (els) => els.map((e) => e.dataset.peca));
  for (const nome of pecas) {
    const el = await p.$(`[data-peca="${nome}"]`);
    const alvo = (await el.$(".botao")) || el; // botões: só o botão, com fundo transparente
    await alvo.screenshot({ path: path.join(saida, `${nome}.png`), omitBackground: alvo !== el });
    console.log("ok", nome);
  }
  await b.close();
})();
