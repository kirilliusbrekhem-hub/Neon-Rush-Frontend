import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { localApiPlugin } from './vite-plugin-local-api.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
})
