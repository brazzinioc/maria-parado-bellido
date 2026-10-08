// Integración de Astro: imágenes para compartir en redes (Open Graph).
//
// WhatsApp, Facebook y LinkedIn no muestran og:image en SVG y fallan a menudo con
// WebP o con imágenes pesadas. Al terminar el build, cada og:image propio del sitio
// se convierte en un JPEG de 1200x630 (el tamaño que piden) de menos de ~300 KB en
// /og/, y se reescriben og:image y twitter:image para que apunten a él.
// Las imágenes que vienen del CMS (otro dominio) se dejan como están.
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const OWN_HOST = /(^|\.)mariaparadodebellido\.com$|\.vercel\.app$/;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (entry.name.endsWith(".html")) out.push(path);
  }
  return out;
}

export default function ogImages() {
  return {
    name: "og-images",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        await mkdir(join(root, "og"), { recursive: true });
        const done = new Map(); // ruta original -> ruta /og/...jpg

        const toJpeg = async (path) => {
          if (done.has(path)) return done.get(path);
          const source = join(root, decodeURIComponent(path));
          if (!existsSync(source)) return null;
          const name = path.replace(/^\/images\//, "").replace(/\//g, "-");
          const out = `/og/${basename(name, extname(name))}.jpg`;
          await sharp(source, { density: 150 })
            // Fotos: recorte en la zona de interés. Ilustraciones: centrado, para no cortar el sol o el templo.
            .resize(1200, 630, { fit: "cover", position: path.endsWith(".svg") ? "centre" : "attention" })
            .flatten({ background: "#faf6f0" })
            .jpeg({ quality: 78, mozjpeg: true })
            .toFile(join(root, out));
          done.set(path, out);
          return out;
        };

        let pages = 0;
        for (const file of await walk(root)) {
          const html = await readFile(file, "utf8");
          const content = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
          if (!content) continue;
          let url;
          try {
            url = new URL(content);
          } catch {
            continue;
          }
          if (!OWN_HOST.test(url.hostname)) {
            // Foto del CMS: no se convierte; se quitan las medidas fijas, que no le corresponden.
            await writeFile(file, html.replace(/<meta property="og:image:(width|height)" content="\d+"\s*\/?>/g, ""));
            continue;
          }
          if (url.pathname.endsWith(".jpg")) continue;
          const jpg = await toJpeg(url.pathname);
          if (!jpg) continue;
          const next = new URL(jpg, url.origin).href;
          const replaced = html
            .replaceAll(`content="${content}"`, `content="${next}"`)
            .replace(/(<meta property="og:image" content="[^"]+"\s*\/?>)/, '$1<meta property="og:image:type" content="image/jpeg">');
          await writeFile(file, replaced);
          pages++;
        }
        logger.info(`${done.size} imágenes para compartir (JPEG 1200x630) en ${pages} páginas`);
      },
    },
  };
}
