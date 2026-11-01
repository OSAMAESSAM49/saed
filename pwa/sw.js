// Service worker لمنصة ساعد — بيتبني أوتوماتيك (vite.config.js بيحط فيه قايمة الملفات)
// الهدف: الموقع يفتح بسرعة على النت الضعيف، ويشتغل حتى لو النت فصل لحظة.
const VERSION = '__VERSION__'
const PRECACHE = __PRECACHE__
const BASE = new URL('./', self.location).pathname
const SHELL = `shell-${VERSION}`
const PAGES = 'pages-v1'
const IMAGES = 'images-v1'
const MAX_IMAGES = 150

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE.map((p) => BASE + p))).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('shell-') && k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  for (const k of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(k)
}

// الصفحات: من النت الأول (عشان البيانات تبقى جديدة)، ولو النت فصل من الكاش
async function networkFirst(req) {
  const cache = await caches.open(PAGES)
  try {
    const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))])
    if (res.ok) cache.put(req, res.clone())
    return res
  } catch {
    return (await cache.match(req)) || (await caches.match(BASE + 'index.html')) || Response.error()
  }
}

// ملفات الموقع والصور: من الكاش على طول
async function cacheFirst(req, cacheName, max) {
  const hit = await caches.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok || res.type === 'opaque') {
    const cache = await caches.open(cacheName)
    await cache.put(req, res.clone())
    if (max) trim(cacheName, max)
  }
  return res
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') return e.respondWith(networkFirst(req))
    if (url.pathname.startsWith(BASE + 'assets/') || url.pathname.startsWith(BASE + 'icons/'))
      return e.respondWith(cacheFirst(req, SHELL))
    // صور مقدمي الخدمة والإعلانات (اسم الملف فيه رقم النسخة، فمبتتغيّرش)
    if (url.pathname.startsWith(BASE + 'photos/')) return e.respondWith(cacheFirst(req, IMAGES, MAX_IMAGES))
  }
})
