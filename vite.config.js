import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// GitHub Pages: لو الموقع على username.github.io/saed يبقى VITE_BASE=/saed/
// ولو على دومين خاص أو username.github.io يبقى /
const base = process.env.VITE_BASE || '/'

// GitHub Pages بيرجّع 404.html لأي رابط مش موجود، فبنخليه نسخة من index.html
// عشان الروابط زي /p/electrician-mahmoud تفتح على طول
const spaFallback = () => ({
  name: 'spa-404-fallback',
  closeBundle() {
    const dist = resolve(__dirname, 'dist')
    copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
  },
})

// بيبني dist/sw.js: قايمة ملفات الموقع اللي تتحفظ على الموبايل من أول زيارة
// (الخطوط العربي والإنجليزي بس، woff2 بس، عشان الحجم)
const serviceWorker = () => ({
  name: 'service-worker',
  closeBundle() {
    const dist = resolve(__dirname, 'dist')
    const assets = readdirSync(resolve(dist, 'assets'))
      .filter((f) => /.(js|css)$/.test(f) || /^tajawal-(arabic|latin)-.*.woff2$/.test(f))
      // لوحة الأدمن ومكتبة الدخول مش محتاجها الزائر
      .filter((f) => !f.startsWith('AdminApp') && !f.startsWith('firebase-auth'))
      .map((f) => `assets/${f}`)
    const precache = ['index.html', 'manifest.webmanifest', 'favicon.svg', 'icons/icon-192.png', ...assets]
    const sw = readFileSync(resolve(__dirname, 'pwa/sw.js'), 'utf8')
      .replace('__VERSION__', Date.now().toString(36))
      .replace('__PRECACHE__', JSON.stringify(precache))
    writeFileSync(resolve(dist, 'sw.js'), sw)
  },
})

export default defineConfig({
  base,
  plugins: [react(), spaFallback(), serviceWorker()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@firebase/auth') || id.includes('firebase/auth')) return 'firebase-auth'
          if (id.includes('@firebase/') || id.includes('/firebase/')) return 'firebase'
        },
      },
    },
  },
})
