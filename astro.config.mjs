import { defineConfig } from 'astro/config';

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
  },
});
