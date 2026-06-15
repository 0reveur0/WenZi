import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

const isBuild = process.env.NODE_ENV === 'production';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
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
    ssr: {
      noExternal: [],
    },
    server: {
      allowedHosts: ['replit.dev', '.replit.dev'],
    },
  },
});
