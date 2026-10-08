// Integración de Astro: imágenes responsivas para las fotos de public/images.
//
// Al terminar el build:
//   1. Genera variantes más livianas de cada foto (nombre-480w.webp, -800w, -1200w, -1600w),
//      solo para los anchos menores que el original.
//   2. Agrega srcset (y sizes="100vw" si la etiqueta no trae uno) a cada <img> del HTML
//      que apunte a esas fotos, para que un celular no descargue la versión de 1920 px.
//
// Las variantes solo existen en dist/: no se versionan en el repositorio.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const WIDTHS = [480, 800, 1200, 1600];
const MIN_WIDTH = 700; // Fotos más chicas (retratos, miniaturas) se dejan como están.
const PHOTO = /\.(webp|jpe?g|png)$/i;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

export default function responsiveImages() {
  return {
    name: "responsive-images",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const imagesDir = join(root, "images");
        const variants = new Map(); // "/images/x.webp" -> "srcset"

        for (const file of await walk(imagesDir).catch(() => [])) {
          if (!PHOTO.test(file) || /-\d+w\.\w+$/.test(file) || file.includes("/placeholders/")) continue;
          const { width } = await sharp(file).metadata();
          if (!width || width < MIN_WIDTH) continue;
          const url = "/" + relative(root, file).split("\\").join("/");
          const base = url.slice(0, -extname(url).length);
          const set = [];
          for (const w of WIDTHS.filter((w) => w < width * 0.9)) {
            const target = join(root, `${base}-${w}w.webp`);
            await sharp(file).resize({ width: w }).webp({ quality: 78 }).toFile(target);
            set.push(`${base}-${w}w.webp ${w}w`);
          }
          set.push(`${url} ${width}w`);
          variants.set(url, set.join(", "));
        }

        let tags = 0;
        for (const file of (await walk(root)).filter((f) => f.endsWith(".html"))) {
          const html = await readFile(file, "utf8");
          const next = html.replace(/<img\b[^>]*>/g, (tag) => {
            if (/\ssrcset=/.test(tag)) return tag;
            const src = tag.match(/\ssrc="([^"]+)"/)?.[1];
            const srcset = src && variants.get(src);
            if (!srcset) return tag;
            tags++;
            const sizes = /\ssizes=/.test(tag) ? "" : ' sizes="100vw"';
            return tag.replace(/\ssrc="[^"]+"/, (m) => `${m} srcset="${srcset}"${sizes}`);
          });
          if (next !== html) await writeFile(file, next);
        }
        logger.info(`${variants.size} fotos con variantes, ${tags} <img> con srcset`);
      },
    },
  };
}
