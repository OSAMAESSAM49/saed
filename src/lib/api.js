// كل طلبات الزوار بتعدّي من هنا.
// مع Firebase المجاني: الزائر بيقرا مستندات قليلة جداً (الفئات + كروت المحافظة + الإعلانات)
// والبحث والفلترة بيحصلوا في الموبايل نفسه — عشان نفضل جوه الحصة المجانية بسهولة.
import { IS_DEMO } from '../config.js'
import { demoCatalog, demoSearch, demoGetProvider, demoActiveAds, demoReport, demoLog } from './demo.js'
import { activeCatalog, filterProviders, filterAds, governorateOf, locationFamily, servesFamily } from './search.js'

// Firebase بيتحمّل بس لما نحتاجه (في الوضع التجريبي مش بيتحمّل خالص)
let fbPromise
const fb = () =>
  (fbPromise ||= Promise.all([import('./firebase.js'), import('firebase/firestore/lite')]).then(([{ db }, lite]) => ({ db, ...lite })))

const EMPTY_CATALOG = { categories: [], subcategories: [], locations: [] }

const readCache = (store, key, ttl) => {
  try {
    const c = JSON.parse(store.getItem(key))
    if (c && Date.now() - c.t < ttl) return c.data
  } catch {}
  return null
}
const writeCache = (store, key, data) => {
  try {
    store.setItem(key, JSON.stringify({ t: Date.now(), data }))
  } catch {}
}

// ---------- الفئات والأماكن (بتتخزن في المتصفح وتتحدّث في الخلفية) ----------
const CATALOG_KEY = 'saed.catalog'
const CATALOG_TTL = 60 * 60 * 1000

export function getCachedCatalog() {
  if (IS_DEMO) return demoCatalog()
  try {
    return JSON.parse(localStorage.getItem(CATALOG_KEY))?.data || null
  } catch {
    return null
  }
}

export async function fetchCatalog({ force = false } = {}) {
  if (IS_DEMO) return demoCatalog()
  if (!force) {
    const cached = readCache(localStorage, CATALOG_KEY, CATALOG_TTL)
    if (cached) return cached
  }
  const { db, doc, getDoc } = await fb()
  const snap = await getDoc(doc(db, 'catalog', 'main'))
  const data = snap.exists() ? activeCatalog(snap.data()) : EMPTY_CATALOG
  writeCache(localStorage, CATALOG_KEY, data)
  return data
}

// ---------- كروت مقدمي الخدمة (مستند لكل محافظة) ----------
const INDEX_TTL = 5 * 60 * 1000
const indexMemory = new Map()

async function loadIndex(location) {
  const catalog = getCachedCatalog() || (await fetchCatalog())
  const gov = location != null ? governorateOf(catalog.locations, location) : null
  const key = `saed.index.${gov ?? 'all'}`
  const mem = indexMemory.get(key)
  if (mem && Date.now() - mem.t < INDEX_TTL) return { list: mem.list, catalog }
  const cached = readCache(sessionStorage, key, INDEX_TTL)
  if (cached) return { list: cached, catalog }

  const { db, doc, getDoc, getDocs, collection } = await fb()
  let docs
  if (gov != null) {
    const snap = await getDoc(doc(db, 'public_index', String(gov)))
    docs = snap.exists() ? [snap.data()] : []
  } else {
    docs = (await getDocs(collection(db, 'public_index'))).docs.map((d) => d.data())
  }
  // مقدم الخدمة اللي بيغطي أكتر من محافظة بيبقى موجود في أكتر من مستند
  const byId = new Map()
  for (const d of docs) for (const p of Object.values(d.items || {})) byId.set(p.id, p)
  const list = [...byId.values()]
  indexMemory.set(key, { t: Date.now(), list })
  writeCache(sessionStorage, key, list)
  return { list, catalog }
}

export async function searchProviders(opts = {}) {
  if (IS_DEMO) return demoSearch(opts)
  const { list, catalog } = await loadIndex(opts.location)
  return filterProviders(list, catalog, opts)
}

export async function getStats(location) {
  const list = IS_DEMO ? demoSearch({ limit: 100000 }) : (await loadIndex(location)).list
  const catalog = getCachedCatalog() || EMPTY_CATALOG
  const fam = locationFamily(catalog.locations, location)
  const mine = list.filter((p) => servesFamily(p, fam))
  return {
    providers: mine.length,
    verified: mine.filter((p) => p.is_verified).length,
    women: mine.filter((p) => p.women_service).length,
  }
}

export async function getProvider(slug) {
  if (IS_DEMO) return demoGetProvider(slug)
  const { db, collection, query, where, limit, getDocs } = await fb()
  const snap = await getDocs(query(collection(db, 'public_providers'), where('slug', '==', slug), limit(1)))
  return snap.empty ? null : snap.docs[0].data()
}

// ---------- الإعلانات (كلها في مستند واحد) ----------
let adsPromise
export async function getAds(placement, location) {
  if (IS_DEMO) return demoActiveAds(placement, location)
  try {
    adsPromise ||= fb().then(async ({ db, doc, getDoc }) => {
      const snap = await getDoc(doc(db, 'public', 'ads'))
      return snap.exists() ? snap.data().items || [] : []
    })
    const catalog = getCachedCatalog() || EMPTY_CATALOG
    return filterAds(await adsPromise, catalog.locations, placement, location)
  } catch {
    return []
  }
}

// ---------- البلاغات ----------
export async function submitReport({ providerId, reason, details, contact, website }) {
  if (website) return true // خانة مخفية اتملت = بوت
  if (IS_DEMO) return demoReport({ providerId, reason, details, contact })
  const { db, collection, addDoc, serverTimestamp } = await fb()
  await addDoc(collection(db, 'reports'), {
    provider_id: String(providerId),
    reason: String(reason).slice(0, 120),
    details: String(details || '').slice(0, 1000),
    contact: String(contact || '').slice(0, 30),
    status: 'new',
    created_at: serverTimestamp(),
  })
  return true
}

// ---------- الإحصائيات (عدّادات يومية، من غير ما نأخر الزائر) ----------
const FIELD = {
  page_view: 'views', profile_view: 'profile_views', whatsapp: 'whatsapp', call: 'call', share: 'share', ad_click: 'ad_click',
}
const cairoDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())

// الزيارة بتتحسب مرة واحدة في الجلسة، وفتح صفحة مقدم الخدمة مرة لكل مقدم خدمة
function firstTime(key) {
  try {
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
  } catch {}
  return true
}

export function logEvent(kind, { provider, category, location, ad, path } = {}) {
  if (IS_DEMO) {
    return demoLog(kind, { provider_id: provider ?? null, category_id: category ?? null, location_id: location ?? null, ad_id: ad ?? null, path })
  }
  if (kind === 'page_view' && !firstTime('saed.ev.visit')) return
  if (kind === 'profile_view' && !firstTime(`saed.ev.p.${provider}`)) return
  const field = FIELD[kind]
  if (!field) return

  const dims = [['all', 'all']]
  if (provider != null && kind !== 'page_view' && kind !== 'ad_click') dims.push(['p', provider])
  if (category != null && kind !== 'page_view' && kind !== 'ad_click') dims.push(['c', category])
  if (location != null && kind !== 'profile_view') dims.push(['l', location])
  if (ad != null && kind === 'ad_click') dims.push(['a', ad])

  fb()
    .then(({ db, doc, writeBatch, increment }) => {
      const date = cairoDate()
      const batch = writeBatch(db)
      for (const [dim, ref] of dims) {
        batch.set(doc(db, 'counters', `${date}__${dim}__${ref}`), { date, dim, ref: String(ref), [field]: increment(1) }, { merge: true })
      }
      return batch.commit()
    })
    .catch(() => {})
}
