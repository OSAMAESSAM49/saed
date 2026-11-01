// بيرسم أيقونات التطبيق (PWA) وصورة المشاركة بخط Tajawal الحقيقي.
// التشغيل: npm run icons ← افتح الرابط اللي هيظهر في المتصفح، والصور هتتحفظ في public/ لوحدها.
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url))
const PORT = 5199
// شكل الإيد من مكوّن اللوجو
const HAND = readFileSync(root('src/components/Logo.jsx'), 'utf8').match(/HAND_PATH =\s*'([^']+)'/)[1]
const font = (w) => readFileSync(root(`node_modules/@fontsource/tajawal/files/tajawal-arabic-${w}-normal.woff2`))

// اسم الملف ← [عرض، طول، نوع الرسم]
const TARGETS = {
  'icons/icon-192.png': [192, 192, 'rounded'],
  'icons/icon-512.png': [512, 512, 'rounded'],
  'icons/maskable-512.png': [512, 512, 'maskable'],
  'icons/apple-touch-icon.png': [180, 180, 'maskable'],
  'og-default.png': [1200, 630, 'og'],
}

const page = `<!doctype html><html dir="rtl"><head><meta charset="utf-8">
<style>
@font-face{font-family:T;font-weight:800;src:url(/font/800.woff2)}
@font-face{font-family:T;font-weight:500;src:url(/font/500.woff2)}
body{font-family:T;background:#ddd}
</style></head><body><p id="s">بيرسم...</p><script type="module">
const T = ${JSON.stringify(TARGETS)}
const HAND = new Path2D(${JSON.stringify(HAND)})
const INK = '#0b0b0c', LIME = '#d6f35c', LAV = '#a99df4', GRAY = '#9c9ca4'
await document.fonts.load('800 100px T'); await document.fonts.load('500 40px T')

function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); c.fill() }
function mark(c, cx, cy, size, color = LIME) {
  // نفس شعار الموقع: الإيد
  c.save(); c.translate(cx - size / 2, cy - size / 2); c.scale(size / 100, size / 100)
  c.fillStyle = color; c.fill(HAND, 'evenodd'); c.restore()
}

for (const [name, [w, h, kind]] of Object.entries(T)) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  const c = cv.getContext('2d'); c.direction = 'rtl'
  if (kind === 'rounded') { c.fillStyle = INK; rr(c, 0, 0, w, h, w * 0.23); mark(c, w / 2, h / 2, w * 0.6) }
  if (kind === 'maskable') { c.fillStyle = INK; c.fillRect(0, 0, w, h); mark(c, w / 2, h / 2, w * 0.5) }
  if (kind === 'og') {
    c.fillStyle = '#e6e6e8'; c.fillRect(0, 0, w, h)
    c.fillStyle = INK; rr(c, 40, 40, w - 80, h - 80, 56)
    // الشعار
    c.fillStyle = LIME; rr(c, w - 40 - 64 - 120, 104, 120, 120, 34)
    mark(c, w - 40 - 64 - 60, 104 + 60, 84, INK)
    c.textAlign = 'right'; c.textBaseline = 'alphabetic'
    c.fillStyle = '#f4f4f5'; c.font = '800 128px T'; c.fillText('ساعد', w - 40 - 64 - 150, 210)
    c.fillStyle = '#f4f4f5'; c.font = '500 58px T'; c.fillText('خدمات بلدك في', w - 104, 340)
    const gap = c.measureText('خدمات بلدك في ').width
    c.fillStyle = LIME; c.font = '800 58px T'; c.fillText('إيدك', w - 104 - gap, 340)
    c.fillStyle = GRAY; c.font = '500 34px T'; c.fillText('تمريض · تحفيظ قرآن · دروس · صيانة · مواصلات وأكتر', w - 104, 420)
    // بيلز زي المرجع
    const pills = [['مجاني تماماً', LIME, INK], ['كلّمهم واتساب على طول', LAV, INK]]
    let x = w - 104
    c.font = '800 30px T'
    for (const [t, bg, fg] of pills) {
      const tw = c.measureText(t).width + 56
      c.fillStyle = bg; rr(c, x - tw, 470, tw, 64, 32)
      c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, x - tw / 2, 470 + 34)
      c.textAlign = 'right'; c.textBaseline = 'alphabetic'
      x -= tw + 14
    }
  }
  const blob = await new Promise((r) => cv.toBlob(r, 'image/png'))
  await fetch('/save?name=' + encodeURIComponent(name), { method: 'POST', body: blob })
  document.body.append(cv)
}
document.getElementById('s').textContent = 'خلص ✓'
await fetch('/done', { method: 'POST' })
</script></body></html>`

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  if (url.pathname === '/') return res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(page)
  if (url.pathname.startsWith('/font/')) return res.writeHead(200, { 'Content-Type': 'font/woff2' }).end(font(url.pathname.slice(6, 9)))
  if (url.pathname === '/save' && req.method === 'POST') {
    const name = url.searchParams.get('name')
    if (!TARGETS[name]) return res.writeHead(400).end()
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      const file = root(`public/${name}`)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, Buffer.concat(chunks))
      console.log('✓', name)
      res.writeHead(200).end()
    })
    return
  }
  if (url.pathname === '/done') {
    res.writeHead(200).end()
    console.log('خلص — كل الصور في public/')
    return setTimeout(() => process.exit(0), 200)
  }
  res.writeHead(404).end()
})

server.listen(PORT, '127.0.0.1', () => console.log(`افتح الرابط ده في المتصفح: http://localhost:${PORT}`))
