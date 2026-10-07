import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';
import responsiveImages from './tools/responsive-images.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.mariaparadodebellido.com',

  integrations: [
    react(),
    // Variantes de cada foto y srcset en el HTML final (ver el archivo).
    responsiveImages(),
    // /datos aún no está enlazada en la UI: fuera del sitemap hasta activarla.
    sitemap({ filter: (page) => !page.includes('/datos') }),
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