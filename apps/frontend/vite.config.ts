import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync } from 'fs'
import { join } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-sw',
      closeBundle() {
        // Copy service worker to dist
        try {
          copyFileSync(
            join(__dirname, 'public/sw.js'),
            join(__dirname, 'dist/sw.js')
          )
          console.log('Service worker copied to dist')
        } catch (err) {
          console.warn('Could not copy service worker:', err)
        }
      }
    }
  ],
  base: '/language-learner/',
  server: {
    port: 3000
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  publicDir: 'public'
})

