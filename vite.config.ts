import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves project sites from /<repo-name>/, so the base path
// must not assume root ("/"). Override via VITE_BASE_PATH in CI if the repo
// name differs, otherwise this defaults to a relative base that works from
// any subpath.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || './',
})
