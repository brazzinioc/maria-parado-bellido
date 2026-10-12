// Integración de Astro: red de seguridad para que ningún comentario llegue al HTML publicado.
//
// Los comentarios del código van como {/* … */} en los .astro, y Astro no los publica.
// Si alguien escribe un <!-- … --> por costumbre, se publicaría tal cual y cualquiera lo leería
// con «ver código fuente». Al terminar el build se quitan de todas las páginas y se avisa en
// el log qué archivo tocar. No se tocan <script>, <style>, <pre> ni <textarea>, ni los
// marcadores vacíos que Astro usa para los componentes interactivos (<!--astro:end-->, <!-- -->).
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (entry.name.endsWith(".html")) out.push(path);
  }
  return out;
}

const PROTEGIDO = /(<(script|style|pre|textarea)\b[\s\S]*?<\/\2>)/i;
const MARCADOR = /^(astro:end|\s*)$/;

export function quitarComentarios(html) {
  let quitados = 0;
  const partes = html.split(PROTEGIDO);
  // split con dos grupos: [texto, bloque protegido, nombre de etiqueta, texto, …]
  for (let i = 0; i < partes.length; i += 3) {
    partes[i] = partes[i].replace(/<!--([\s\S]*?)-->/g, (todo, texto) => {
      if (MARCADOR.test(texto)) return todo;
      quitados++;
      return "";
    });
  }
  return { html: partes.filter((_, i) => i % 3 !== 2).join(""), quitados };
}

export default function sinComentarios() {
  return {
    name: "sin-comentarios",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        for (const file of await walk(root)) {
          const { html, quitados } = quitarComentarios(await readFile(file, "utf8"));
          if (!quitados) continue;
          await writeFile(file, html);
          logger.warn(`${relative(root, file)}: se quitaron ${quitados} comentario(s) <!-- -->. Usa {/* … */} en el .astro.`);
        }
      },
    },
  };
}
