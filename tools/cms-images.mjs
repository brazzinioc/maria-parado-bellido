// Integración de Astro: fotos del CMS servidas desde el propio sitio.
//
// Al terminar el build, cada foto de Supabase Storage que aparezca en el HTML
// (https://<proyecto>.supabase.co/storage/v1/object/public/images/<ruta>) se descarga
// una vez a dist/images/cms/<ruta> y se reescriben sus URLs:
//   - en <img>, CSS, etc.: /images/cms/<ruta> (relativa, para que responsive-images le
//     genere variantes y srcset; por eso esta integración va antes que esa);
//   - en <meta content> y JSON-LD, que necesitan URL absoluta: <site>/images/cms/<ruta>.
// Así Google atribuye las fotos al dominio del sitio, con su nombre SEO, y las sirve la
// CDN de Vercel en vez de Supabase. Si una descarga falla, queda la URL original.
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// La ruta solo admite caracteres de URL "seguros": así el patrón no se extiende más allá
// de la URL dentro de JSON escapado (props de las islas de React: &quot;...&quot;).
const STORAGE_URL = /https:\/\/[a-z0-9.-]+\/storage\/v1\/object\/public\/images\/([A-Za-z0-9._~%\/-]+?\.(?:webp|jpe?g|png|gif|avif|svg))(?![A-Za-z0-9._~%\/-])/gi;
const CONCURRENCY = 6;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (entry.name.endsWith(".html")) out.push(path);
  }
  return out;
}

export default function cmsImages() {
  let site = "";
  return {
    name: "cms-images",
    hooks: {
      "astro:config:done": ({ config }) => {
        site = (config.site ?? "").replace(/\/$/, "");
      },
      "astro:build:done": async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = await walk(root);
        const pages = new Map(); // archivo -> html
        const remote = new Map(); // URL de Supabase -> ruta en el bucket (ruta: dentro de "images")

        for (const file of files) {
          const html = await readFile(file, "utf8");
          let found = false;
          for (const m of html.matchAll(STORAGE_URL)) {
            remote.set(m[0], m[1]);
            found = true;
          }
          if (found) pages.set(file, html);
        }
        if (!remote.size) return;

        // Descarga, una vez por ruta del bucket.
        const local = new Map(); // ruta en el bucket -> /images/cms/<ruta> (o null si falló)
        const paths = [...new Set(remote.values())];
        let next = 0;
        const worker = async () => {
          while (next < paths.length) {
            const path = paths[next++];
            const href = [...remote].find(([, p]) => p === path)[0];
            try {
              const res = await fetch(href, { signal: AbortSignal.timeout(20000) });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const target = join(root, "images", "cms", decodeURIComponent(path));
              await mkdir(dirname(target), { recursive: true });
              await writeFile(target, Buffer.from(await res.arrayBuffer()));
              local.set(path, `/images/cms/${path}`);
            } catch (error) {
              logger.warn(`No se pudo descargar ${href}: ${error.message}`);
              local.set(path, null);
            }
          }
        };
        await Promise.all(Array.from({ length: CONCURRENCY }, worker));

        // Reescritura: absoluta dentro de <meta content> y JSON-LD; relativa en el resto.
        const swap = (absolute) => (url) => {
          const to = local.get(remote.get(url));
          return to ? (absolute ? site + to : to) : url;
        };
        for (const [file, html] of pages) {
          const out = html
            .replace(/<meta\b[^>]*>/g, (tag) => tag.replace(STORAGE_URL, swap(true)))
            .replace(/<script\b[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/g, (block) => block.replace(STORAGE_URL, swap(true)))
            .replace(STORAGE_URL, swap(false));
          await writeFile(file, out);
        }
        const ok = [...local.values()].filter(Boolean).length;
        logger.info(`${ok} fotos del CMS descargadas a /images/cms/ (${paths.length - ok} fallidas) en ${pages.size} páginas`);
      },
    },
  };
}
