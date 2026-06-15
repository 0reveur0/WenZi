import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  vite: {
    // sql.js ha bisogno del WASM — exclude dalla ottimizzazione Vite
    optimizeDeps: {
      exclude: ['sql.js'],
    },
    ssr: {
      noExternal: [],
    },
  },
});
