import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { cmsApiPlugin } from './server/api'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss(), cmsApiPlugin(root)],
  server: { port: 4000, strictPort: true },
  preview: { port: 4000, strictPort: true },
})
