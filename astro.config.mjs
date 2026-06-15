import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  server: {
    host: true,
    port: 5000,
  },
  vite: {
    optimizeDeps: {
      exclude: ['sql.js'],
    },

    server: {
      allowedHosts: 'all',
    },

    plugins: [tailwindcss()],
  },
});