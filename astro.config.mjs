import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';
import responsiveImages from './tools/responsive-images.mjs';
import ogImages from './tools/og-images.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.mariaparadodebellido.com',

  integrations: [
    react(),
    // Variantes de cada foto y srcset en el HTML final (ver el archivo).
    responsiveImages(),
    // og:image en JPEG 1200x630 para WhatsApp y Facebook (ver el archivo).
    ogImages(),
    sitemap({ filter: (page) => !page.includes('/404') }),
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