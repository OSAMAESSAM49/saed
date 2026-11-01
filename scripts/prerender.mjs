// بيشتغل بعد `vite build`: بيعمل صفحة HTML لكل فئة وخدمة وبلد ومقدم خدمة،
// فيها العنوان والوصف والصورة، عشان جوجل يفهرسها والروابط تظهر حلوة لما تتشارك على واتساب وفيسبوك.
// + sitemap.xml و robots.txt
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { locations, categoryRows, subcategoryRows, demoProviders } from '../src/data/seed.js'
import { activeCatalog } from '../src/lib/search.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'dist')
// نفس المتغيرات اللي Vite بيقراها (من GitHub Variables أو من .env.local على جهازك)
const env = { ...loadEnv('production', ROOT, 'VITE_'), ...process.env }
const FIREBASE = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}
const LIVE = !!(FIREBASE.apiKey && FIREBASE.projectId)
const SITE_URL = (env.VITE_SITE_URL || 'http://localhost:4173/').replace(/\/?$/, '/')
const NAME = 'ساعد'
// الصور اللي اتنزلت قبل كده (GitHub Actions بيحتفظ بالمجلد ده بين المرات) — عشان منقراهاش من Firestore كل مرة
const PHOTO_CACHE = join(ROOT, '.photo-cache')

async function loadData() {
  if (!LIVE) {
    // الوضع التجريبي: نفس البيانات اللي في src/data/seed.js
    const locBySlug = Object.fromEntries(locations.map((l) => [l.slug, l.id]))
    const subBySlug = Object.fromEntries(subcategoryRows.map((s) => [s.slug, s.id]))
    return {
      categories: categoryRows,
      subcategories: subcategoryRows,
      locations,
      ads: [],
      providers: demoProviders.map((p) => ({
        ...p,
        home_location_id: locBySlug[p.home],
        service_ids: p.services.map((s) => subBySlug[s]),
        area_ids: p.areas.map((a) => locBySlug[a]),
      })),
    }
  }
  const { initializeApp } = await import('firebase/app')
  const { getFirestore, doc, getDoc, getDocs, collection } = await import('firebase/firestore/lite')
  const db = getFirestore(initializeApp(FIREBASE))
  const catSnap = await getDoc(doc(db, 'catalog', 'main'))
  const catalog = catSnap.exists() ? activeCatalog(catSnap.data()) : { categories: [], subcategories: [], locations: [] }
  const byId = new Map()
  for (const d of (await getDocs(collection(db, 'public_index'))).docs)
    for (const p of Object.values(d.data().items || {})) byId.set(p.id, p)
  const adsSnap = await getDoc(doc(db, 'public', 'ads'))
  const data = { ...catalog, providers: [...byId.values()], ads: adsSnap.exists() ? adsSnap.data().items || [] : [] }

  // نسخ الصور من Firestore لملفات على GitHub Pages
  mkdirSync(PHOTO_CACHE, { recursive: true })
  mkdirSync(join(DIST, 'photos'), { recursive: true })
  const wanted = [
    ...data.providers.filter((p) => p.photo_key).map((p) => [p.photo_key, p.photo_v, p.photo_ext]),
    ...data.ads.filter((a) => a.image_key).map((a) => [a.image_key, a.image_v, a.image_ext]),
  ]
  let fetched = 0
  for (const [key, v, ext] of wanted) {
    const name = `${key}-${v}.${ext || 'webp'}`
    const cached = join(PHOTO_CACHE, name)
    if (!existsSync(cached)) {
      const snap = await getDoc(doc(db, 'photos', key))
      const dataUrl = snap.exists() ? snap.data().data : null
      if (!dataUrl) continue
      writeFileSync(cached, Buffer.from(dataUrl.split(',')[1], 'base64'))
      fetched++
    }
    copyFileSync(cached, join(DIST, 'photos', name))
  }
  console.log(`✓ الصور: ${wanted.length} (${fetched} جديدة من Firestore)`)
  return data
}

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function page(template, { path, title, description, image, jsonLd }) {
  const url = SITE_URL + path
  const img = image || `${SITE_URL}og-default.png`
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : '',
  ].join('\n    ')
  return template
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace(/<meta property="og:title"[^>]*>/, '')
    .replace(/<meta property="og:description"[^>]*>/, '')
    .replace('</head>', `    ${head}\n  </head>`)
}

function write(path, html) {
  const file = join(DIST, path, 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

const data = await loadData()
const template = readFileSync(join(DIST, 'index.html'), 'utf8')
const { categories, subcategories, providers } = data
const locs = data.locations
const locById = new Map(locs.map((l) => [l.id, l]))
const subById = new Map(subcategories.map((s) => [s.id, s]))
const places = locs.filter((l) => l.type === 'village' || l.type === 'city')

// المكان + اللي فوقه (مقدم خدمة بيغطي المركز كله بيظهر في كل قراه)
function ancestors(id) {
  const out = new Set()
  for (let cur = locById.get(id); cur; cur = locById.get(cur.parent_id)) out.add(cur.id)
  return out
}
const servesPlace = (p, placeId) => {
  const up = ancestors(placeId)
  return up.has(p.home_location_id) || p.area_ids.some((a) => up.has(a))
}

const urls = []
const add = (path, meta) => {
  write(path, page(template, { path, ...meta }))
  urls.push(path)
}
const desc = (what, where) =>
  `أرقام ${what}${where ? ` في ${where}` : ''} — كلّمهم على طول بالواتساب أو التليفون. مقدمي خدمة موثّقين من أهل بلدك على منصة ${NAME}.`

// الرئيسية والصفحات الثابتة
add('', { title: `${NAME} — خدمات بلدك في إيدك`, description: `منصة مجانية بتوصلك بأهل بلدك اللي بيقدموا خدمات: تمريض، تحفيظ قرآن، دروس، كهربائي، سباك، توكتوك وأكتر.` })
for (const [path, title, description] of [
  ['join/', `سجّل اسمك ببلاش | ${NAME}`, `عندك صنعة أو بتقدّم خدمة؟ سجّل اسمك على ${NAME} ببلاش وخلّي أهل بلدك يوصلولك.`],
  ['advertise/', `أعلن معانا | ${NAME}`, `وصّل محلك أو شركتك لأهل بلدك على منصة ${NAME}.`],
  ['about/', `عن ${NAME}`, `${NAME} منصة مجانية بتوصّل اللي بيقدّم خدمة باللي محتاجها في القرى والمدن.`],
  ['terms/', `الشروط وإخلاء المسؤولية | ${NAME}`, `شروط استخدام منصة ${NAME}.`],
  ['privacy/', `سياسة الخصوصية | ${NAME}`, `إزاي ${NAME} بتتعامل مع البيانات.`],
]) add(path, { title, description })

// الفئات، والفئة في كل بلد فيها حد
for (const c of categories) {
  const inCat = providers.filter((p) => p.service_ids.some((id) => subById.get(id)?.category_id === c.id))
  add(`c/${c.slug}/`, { title: `${c.name_ar} | ${NAME}`, description: desc(c.name_ar) })
  for (const pl of places) {
    if (inCat.some((p) => servesPlace(p, pl.id)))
      add(`c/${c.slug}/${pl.slug}/`, { title: `${c.name_ar} في ${pl.name_ar} | ${NAME}`, description: desc(c.name_ar, pl.name_ar) })
  }
}

// الخدمة في البلد: "كهربائي في البجلات"
for (const s of subcategories) {
  const withSub = providers.filter((p) => p.service_ids.includes(s.id))
  for (const pl of places) {
    if (withSub.some((p) => servesPlace(p, pl.id)))
      add(`s/${s.slug}/${pl.slug}/`, { title: `${s.name_ar} في ${pl.name_ar} | ${NAME}`, description: desc(s.name_ar, pl.name_ar) })
  }
}

// صفحة لكل مقدم خدمة
for (const p of providers) {
  const main = subById.get(p.service_ids[0])
  const home = locById.get(p.home_location_id)?.name_ar
  const title = `${p.name} — ${main?.name_ar || ''}${home ? ` في ${home}` : ''} | ${NAME}`
  const description = (p.bio || desc(main?.name_ar || 'خدمات', home)).slice(0, 160)
  const photo = p.photo_key ? `${SITE_URL}photos/${p.photo_key}-${p.photo_v}.${p.photo_ext || 'webp'}` : undefined
  add(`p/${p.slug}/`, {
    title,
    description,
    image: photo,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: p.name,
      description,
      image: photo,
      url: `${SITE_URL}p/${p.slug}/`,
      areaServed: p.area_ids.map((id) => locById.get(id)?.name_ar).filter(Boolean),
      address: home ? { '@type': 'PostalAddress', addressLocality: home, addressCountry: 'EG' } : undefined,
      knowsAbout: p.service_ids.map((id) => subById.get(id)?.name_ar).filter(Boolean),
    },
  })
}

const today = new Date().toISOString().slice(0, 10)
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${esc(SITE_URL + u)}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`,
)
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${SITE_URL}sitemap.xml\n`)

console.log(`✓ prerender: ${urls.length} صفحة (${LIVE ? 'Firebase' : 'بيانات تجريبية'}) + sitemap.xml`)
