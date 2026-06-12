import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig(() => {
  const config = {
    plugins: [react(), svgr()],
    base: '/', // Luôn để là '/' cho cả môi trường dev và build khi dùng custom domain
  }

  return config
})