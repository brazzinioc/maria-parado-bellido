import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://mariaparadodebellido.com',

  integrations: [
    react(),
    sitemap(),
  ],

  output: 'static',

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