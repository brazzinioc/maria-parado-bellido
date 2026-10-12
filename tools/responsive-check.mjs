// Auditoría responsive: recorre TODAS las páginas del sitio compilado en muchos dispositivos.
//
//   npm run build && npm run test:responsive
//   npm run test:responsive -- --solo /,/datos/        (solo algunas páginas)
//   npm run test:responsive -- --dispositivos "iPad Mini landscape,Pixel 7"
//
// Sirve dist/ en un puerto local, descubre cada página (todos los index.html) y la abre en
// celulares, tablets (vertical y horizontal) y escritorio. En cada una revisa:
//   - desborde horizontal (y qué elementos lo causan);
//   - contenido del encabezado (hero) cortado o tapado por el menú fijo;
//   - títulos que no caben en el ancho de la pantalla;
//   - textos visibles menores a 11 px.
// Deja capturas de la primera pantalla en .responsive/<dispositivo>/ y un informe en
// .responsive/informe.md (y .json). Sale con código 1 si encuentra errores.
//
// Navegador: usa Chromium de Playwright. Si no está instalado: npx playwright install chromium
// (o define PLAYWRIGHT_CHROMIUM con la ruta a un Chromium).
import { createServer } from "node:http";
import { readFile, readdir, mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "playwright";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(raiz, "dist");
const salida = join(raiz, ".responsive");

const DISPOSITIVOS = [
  // Celulares
  ["Galaxy S8", "celular"],
  ["iPhone SE", "celular"],
  ["iPhone 14", "celular"],
  ["Pixel 7", "celular"],
  ["iPhone SE landscape", "celular horizontal"],
  // Tablets
  ["iPad Mini", "tablet"],
  ["iPad Mini landscape", "tablet horizontal"],
  ["iPad (gen 7) landscape", "tablet horizontal"],
  ["iPad Pro 11", "tablet"],
  ["iPad Pro 11 landscape", "tablet horizontal"],
  ["Galaxy Tab S4 landscape", "tablet horizontal"],
  // Escritorio (ventanas habituales)
  [{ name: "Laptop 1280×720", viewport: { width: 1280, height: 720 } }, "escritorio"],
  [{ name: "Laptop 1366×768", viewport: { width: 1366, height: 768 } }, "escritorio"],
  [{ name: "Escritorio 1440×900", viewport: { width: 1440, height: 900 } }, "escritorio"],
  [{ name: "Escritorio 1920×1080", viewport: { width: 1920, height: 1080 } }, "escritorio"],
];

const args = process.argv.slice(2);
const opcion = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const solo = opcion("--solo")?.split(",").map((s) => s.trim());
const filtroDisp = opcion("--dispositivos")?.split(",").map((s) => s.trim());

if (!existsSync(dist)) {
  console.error("No existe dist/. Ejecuta primero: npm run build");
  process.exit(2);
}

// --- Páginas: todos los index.html de dist (cada página del sitio) ---
async function paginas(dir, base = "/") {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (base === "/" && ["_astro", "og", "images", "media", "fonts"].includes(e.name)) continue;
      out.push(...(await paginas(join(dir, e.name), `${base}${e.name}/`)));
    } else if (e.name === "index.html") out.push(base);
  }
  return out;
}

// --- Servidor estático mínimo para dist/ ---
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json", ".mp4": "video/mp4", ".csv": "text/csv", ".xml": "application/xml", ".txt": "text/plain", ".ico": "image/x-icon" };
const servidor = createServer(async (req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (ruta.endsWith("/")) ruta += "index.html";
  try {
    const datos = await readFile(join(dist, ruta));
    res.writeHead(200, { "content-type": TIPOS[extname(ruta)] ?? "application/octet-stream" });
    res.end(datos);
  } catch {
    res.writeHead(404, { "content-type": "text/html" });
    res.end(await readFile(join(dist, "404.html")).catch(() => "404"));
  }
});
await new Promise((r) => servidor.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${servidor.address().port}`;

// --- Revisión dentro de la página ---
function revisar() {
  const vw = document.documentElement.clientWidth;
  const problemas = [];
  const describir = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const cls = typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : "";
    const txt = (el.innerText || el.alt || "").trim().replace(/\s+/g, " ").slice(0, 50);
    return `${el.tagName.toLowerCase()}${id}${cls === "." ? "" : cls}${txt ? ` «${txt}»` : ""}`;
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  // Un ancestro con overflow oculto/auto recorta el elemento: no desborda la página.
  const recortado = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/(hidden|clip|auto|scroll)/.test(s.overflowX)) return true;
    }
    return false;
  };

  // 1. Desborde horizontal
  if (document.documentElement.scrollWidth > vw + 1) {
    const culpables = [...document.querySelectorAll("body *")]
      .filter((el) => visible(el) && el.getBoundingClientRect().right > vw + 1 && !recortado(el))
      .slice(0, 5)
      .map(describir);
    problemas.push({ tipo: "error", regla: "desborde-horizontal", detalle: `La página mide ${document.documentElement.scrollWidth}px de ancho en una pantalla de ${vw}px`, elementos: culpables });
  }

  // 2. Encabezado (hero): contenido cortado por arriba/abajo o tapado por el menú fijo
  const menu = document.querySelector("body header.sticky, body > header");
  const altoMenu = menu && getComputedStyle(menu).position.match(/fixed|sticky/) ? menu.getBoundingClientRect().bottom : 0;
  const hero = document.querySelector("#home-hero") || document.querySelector("main header, main > header");
  if (hero) {
    const h = hero.getBoundingClientRect();
    const piezas = [...hero.querySelectorAll("h1, p, a, nav, dl, [data-hero-fiesta]")].filter(visible);
    for (const el of piezas) {
      const r = el.getBoundingClientRect();
      if (r.top < Math.max(h.top, altoMenu) - 1) problemas.push({ tipo: "error", regla: "hero-cortado-arriba", detalle: `Queda ${Math.round(Math.max(h.top, altoMenu) - r.top)}px por encima del área visible del encabezado`, elementos: [describir(el)] });
      if (r.bottom > h.bottom + 1) problemas.push({ tipo: "error", regla: "hero-cortado-abajo", detalle: `Sobresale ${Math.round(r.bottom - h.bottom)}px por debajo del encabezado`, elementos: [describir(el)] });
    }
    const h1 = hero.querySelector("h1");
    if (h1) {
      const alto = h1.getBoundingClientRect().height;
      const disponible = innerHeight - altoMenu;
      if (alto > disponible * 0.45) problemas.push({ tipo: "aviso", regla: "titulo-hero-muy-grande", detalle: `El título ocupa ${Math.round((alto / disponible) * 100)}% del alto visible`, elementos: [describir(h1)] });
    }
  }

  // 3. Títulos que no caben en el ancho
  for (const el of document.querySelectorAll("h1, h2, h3")) {
    if (!visible(el) || recortado(el)) continue;
    if (el.scrollWidth > el.clientWidth + 2) problemas.push({ tipo: "error", regla: "titulo-no-cabe", detalle: "Una palabra del título es más ancha que su contenedor", elementos: [describir(el)] });
  }

  // 4. Texto demasiado pequeño
  const chicos = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || !visible(el) || el.closest("[aria-hidden='true'], svg, .leaflet-container")) continue;
    if (parseFloat(getComputedStyle(el).fontSize) < 11) chicos.push(describir(el));
  }
  if (chicos.length) problemas.push({ tipo: "aviso", regla: "texto-muy-chico", detalle: `${chicos.length} texto(s) menores a 11px`, elementos: [...new Set(chicos)].slice(0, 5) });

  return problemas;
}

// --- Recorrido ---
let lista = (await paginas(dist)).sort();
if (solo) lista = lista.filter((p) => solo.includes(p));
const dispositivos = DISPOSITIVOS.filter(([d]) => !filtroDisp || filtroDisp.includes(typeof d === "string" ? d : d.name));

await rm(salida, { recursive: true, force: true });
const navegador = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {});
const resultados = [];
const t0 = Date.now();

for (const [d, grupo] of dispositivos) {
  const nombre = typeof d === "string" ? d : d.name;
  const perfil = typeof d === "string" ? devices[d] : { viewport: d.viewport, deviceScaleFactor: 1 };
  const carpeta = join(salida, nombre.replace(/[^\w-]+/g, "_"));
  await mkdir(carpeta, { recursive: true });
  const contexto = await navegador.newContext({ ...perfil, serviceWorkers: "block" });
  // Sin red externa (mapas, analítica): solo el sitio local.
  await contexto.route(/^(?!http:\/\/127\.0\.0\.1)/, (r) => r.abort());
  const pagina = await contexto.newPage();
  for (const ruta of lista) {
    try {
      await pagina.goto(BASE + ruta, { waitUntil: "load", timeout: 30000 });
      // Espera a que terminen las entradas animadas (p. ej., el aviso de la fiesta en la home).
      await pagina.waitForTimeout(1200);
      await pagina.screenshot({ path: join(carpeta, `${ruta.replace(/\//g, "_") || "_"}.png`) });
      const problemas = await pagina.evaluate(revisar);
      resultados.push({ dispositivo: nombre, grupo, ancho: perfil.viewport.width, alto: perfil.viewport.height, ruta, problemas });
    } catch (e) {
      resultados.push({ dispositivo: nombre, grupo, ruta, problemas: [{ tipo: "error", regla: "no-carga", detalle: e.message.split("\n")[0], elementos: [] }] });
    }
  }
  await contexto.close();
  process.stdout.write(`✓ ${nombre} (${lista.length} páginas)\n`);
}
await navegador.close();
servidor.close();

// --- Informe ---
const conProblemas = resultados.filter((r) => r.problemas.length);
const errores = conProblemas.flatMap((r) => r.problemas.filter((p) => p.tipo === "error").map((p) => ({ ...p, ...r })));
const avisos = conProblemas.flatMap((r) => r.problemas.filter((p) => p.tipo === "aviso").map((p) => ({ ...p, ...r })));
await writeFile(join(salida, "informe.json"), JSON.stringify(resultados, null, 2));
const fila = (p) => `| ${p.ruta} | ${p.dispositivo} (${p.ancho}×${p.alto}) | ${p.regla} | ${p.detalle} | ${(p.elementos || []).join("<br>")} |`;
const md = [
  `# Auditoría responsive`,
  ``,
  `${lista.length} páginas × ${dispositivos.length} dispositivos = ${resultados.length} vistas en ${Math.round((Date.now() - t0) / 1000)} s.`,
  `**${errores.length} errores** y **${avisos.length} avisos**.`,
  ``,
  `## Errores`,
  errores.length ? `| Página | Dispositivo | Regla | Detalle | Elementos |\n|---|---|---|---|---|\n${errores.map(fila).join("\n")}` : "Ninguno.",
  ``,
  `## Avisos`,
  avisos.length ? `| Página | Dispositivo | Regla | Detalle | Elementos |\n|---|---|---|---|---|\n${avisos.map(fila).join("\n")}` : "Ninguno.",
  ``,
].join("\n");
await writeFile(join(salida, "informe.md"), md);
console.log(`\n${lista.length} páginas × ${dispositivos.length} dispositivos: ${errores.length} errores, ${avisos.length} avisos.`);
console.log(`Informe: .responsive/informe.md · Capturas: .responsive/<dispositivo>/`);
process.exit(errores.length ? 1 : 0);
