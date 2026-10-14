import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';
import responsiveImages from './tools/responsive-images.mjs';
import ogImages from './tools/og-images.mjs';
import sinComentarios from './tools/sin-comentarios.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.mariaparadodebellido.com',

  integrations: [
    react(),
    // Variantes de cada foto y srcset en el HTML final (ver el archivo).
    responsiveImages(),
    // og:image en JPEG 1200x630 para WhatsApp y Facebook (ver el archivo).
    ogImages(),
    // Quita del HTML final cualquier <!-- comentario --> que se haya colado (ver el archivo).
    sinComentarios(),
    sitemap({ filter: (page) => !page.includes('/404') && !page.includes('/creditos') }),
  ],

  output: 'static',

  // Precarga la página al pasar el cursor (o enfocar) un enlace: al hacer clic ya está descargada.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },

  build: {
    inlineStylesheets: 'auto',
  },

  image: {
    domains: ['api.example.com'],
    remotePatterns: [{ protocol: 'https' }],
  },

  vite: {
    plugins: [tailwindcss()],
  },
});