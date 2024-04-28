import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/tx/',
  plugins: [svelte()],
  build: {
    chunkSizeWarningLimit: 16384
  }
})
