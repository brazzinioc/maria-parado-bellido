// Integración de Astro: imágenes para compartir en redes (Open Graph).
//
// WhatsApp, Facebook y LinkedIn no muestran og:image en SVG y fallan a menudo con
// WebP o con imágenes pesadas. Al terminar el build, cada og:image propio del sitio
// se convierte en un JPEG de 1200x630 (el tamaño que piden) de menos de ~300 KB en
// /og/, y se reescriben og:image y twitter:image para que apunten a él.
// Las fotos del CMS (Supabase Storage) se descargan en el build y se convierten igual,
// porque pueden ser WebP, SVG o pesar hasta 5 MB. Si la descarga falla, queda la original.
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { createHash } from "node:crypto";
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

        const toJpegRemote = async (href) => {
          if (done.has(href)) return done.get(href);
          try {
            const res = await fetch(href, { signal: AbortSignal.timeout(15000) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const input = Buffer.from(await res.arrayBuffer());
            const out = `/og/cms-${createHash("sha1").update(href).digest("hex").slice(0, 12)}.jpg`;
            await sharp(input, { density: 150 })
              .resize(1200, 630, { fit: "cover", position: "attention" })
              .flatten({ background: "#faf6f0" })
              .jpeg({ quality: 78, mozjpeg: true })
              .toFile(join(root, out));
            done.set(href, out);
            return out;
          } catch (error) {
            logger.warn(`No se pudo convertir ${href}: ${error.message}`);
            done.set(href, null);
            return null;
          }
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
          const own = OWN_HOST.test(url.hostname);
          if (own && url.pathname.endsWith(".jpg")) continue;
          const jpg = own ? await toJpeg(url.pathname) : await toJpegRemote(url.href);
          if (!jpg) {
            // Sin conversión: se quitan las medidas fijas, que no le corresponden a la original.
            await writeFile(file, html.replace(/<meta property="og:image:(width|height)" content="\d+"\s*\/?>/g, ""));
            continue;
          }
          // La imagen convertida vive en el sitio: www en producción, el despliegue en vistas previas.
          const base = own ? url.origin : (html.match(/<meta property="og:url" content="(https?:\/\/[^/"]+)/)?.[1] ?? url.origin);
          const next = new URL(jpg, process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : base).href;
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
