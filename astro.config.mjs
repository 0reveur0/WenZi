import { defineConfig } from 'astro/config';

const isBuild = process.env.NODE_ENV === 'production';

export default defineConfig({
  output: 'static',
  site: 'https://yourusername.github.io',
  base: isBuild ? '/wenzi/' : '/',
  server: {
    host: true,
    allowedHosts: ['replit.dev', '.replit.dev'],
  },
  vite: {
    optimizeDeps: {
      exclude: ['sql.js'],
    },
    server: {
      allowedHosts: ['replit.dev', '.replit.dev'],
    },
  },
});
