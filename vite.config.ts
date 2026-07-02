import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

const runtimeVersion = readFileSync('runtime-template/VERSION', 'utf-8').trim()
const siteVersion = JSON.parse(readFileSync('package.json', 'utf-8')).version as string

// https://vite.dev/config/
export default defineConfig({
  base: '/native-settings-builder/',
  plugins: [react()],
  define: {
    __RUNTIME_VERSION__: JSON.stringify(runtimeVersion),
    __SITE_VERSION__: JSON.stringify(siteVersion),
  },
})
