// طلبات لوحة الأدمن (Firebase Auth + Firestore)، وبتتحمّل بس لما الأدمن يفتح اللوحة
import { IS_DEMO } from '../config.js'
import {
  loadProviders, saveProviders, loadCatalogAll, saveCatalogAll, loadAds, saveAds, loadReports, saveReports, loadEvents,
} from '../lib/demo.js'
import { governorateOf, toPublic } from '../lib/search.js'
import { locations as seedLocations, categoryRows, subcategoryRows, demoProviders } from '../data/seed.js'

let fbPromise
const fb = () =>
  (fbPromise ||= Promise.all([import('../lib/firebase.js'), import('firebase/firestore/lite'), import('firebase/auth')]).then(
    ([{ app, db }, fs, authMod]) => ({ db, ...fs, ...authMod, auth: authMod.getAuth(app) }),
  ))

// Firestore مش بيقبل undefined
const clean = (obj) => JSON.parse(JSON.stringify(obj))
const nowISO = () => new Date().toISOString()

const blobToDataURL = (blob) =>
  new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.readAsDataURL(blob)
  })
const extOf = (blob) => (blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg')

// ---------- الدخول ----------
const DEMO_SESSION = 'saed.demo.admin'

export async function getSession() {
  if (IS_DEMO) return sessionStorage.getItem(DEMO_SESSION) ? { email: 'demo' } : null
  const { auth } = await fb()
  await auth.authStateReady()
  return auth.currentUser
}

export async function checkAdmin() {
  if (IS_DEMO) return true
  const { db, auth, doc, getDoc } = await fb()
  if (!auth.currentUser) return false
  return (await getDoc(doc(db, 'admins', auth.currentUser.uid))).exists()
}

export async function signIn(email, password) {
  if (IS_DEMO) return sessionStorage.setItem(DEMO_SESSION, '1')
  const { auth, signInWithEmailAndPassword } = await fb()
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password)
  } catch (e) {
    throw new Error(e.code === 'auth/too-many-requests' ? 'محاولات كتير — استنى شوية وجرّب تاني' : 'الإيميل أو الباسورد غلط')
  }
}

export async function signOut() {
  if (IS_DEMO) return sessionStorage.removeItem(DEMO_SESSION)
  const { auth, signOut: out } = await fb()
  await out(auth)
}

// ---------- الفئات والخدمات والأماكن (مستند واحد: catalog/main) ----------
let catalogCache = null

export async function listCatalogAll() {
  if (IS_DEMO) return loadCatalogAll()
  const { db, doc, getDoc } = await fb()
  const snap = await getDoc(doc(db, 'catalog', 'main'))
  catalogCache = snap.exists() ? snap.data() : { categories: [], subcategories: [], locations: [] }
  return catalogCache
}

// إضافة أو تعديل صف في categories / subcategories / locations
export async function saveCatalogRow(table, row) {
  const apply = (all) => {
    const list = all[table]
    if (list.some((r) => r.slug === row.slug && r.id !== row.id)) throw new Error('الـ slug ده مستخدم قبل كده')
    if (row.id) {
      const i = list.findIndex((r) => r.id === row.id)
      list[i] = { ...list[i], ...row }
    } else {
      list.push({ ...row, id: Math.max(0, ...list.map((r) => r.id)) + 1 })
    }
    return all
  }
  if (IS_DEMO) return saveCatalogAll(apply(loadCatalogAll()))
  const { db, doc, runTransaction } = await fb()
  const ref = doc(db, 'catalog', 'main')
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const all = snap.exists() ? snap.data() : { categories: [], subcategories: [], locations: [] }
    tx.set(ref, clean({ ...apply(all), updated_at: nowISO() }))
  })
  catalogCache = null
}

// أول مرة: بيحط الفئات الـ 15 والأماكن (ومقدمي خدمة تجريبيين لو عايز)
export async function isInitialized() {
  if (IS_DEMO) return true
  const all = await listCatalogAll()
  return all.categories.length > 0
}

export async function initializeData({ withDemo = false } = {}) {
  const { db, doc, setDoc } = await fb()
  await setDoc(doc(db, 'catalog', 'main'), {
    categories: categoryRows.map((c) => ({ ...c, is_active: true })),
    subcategories: subcategoryRows.map((s) => ({ ...s, is_active: true })),
    locations: seedLocations.map((l) => ({ ...l, is_active: true })),
    updated_at: nowISO(),
  })
  catalogCache = null
  if (withDemo) {
    const locBySlug = Object.fromEntries(seedLocations.map((l) => [l.slug, l.id]))
    const subBySlug = Object.fromEntries(subcategoryRows.map((s) => [s.slug, s.id]))
    for (const { services, areas, home, id, ...p } of demoProviders) {
      await saveProvider({
        ...p,
        home_location_id: locBySlug[home],
        service_ids: services.map((s) => subBySlug[s]),
        area_ids: areas.map((a) => locBySlug[a]),
        private: { notes: 'تجريبي — امسحه قبل الإطلاق' },
      })
    }
  }
}

// ---------- مقدمي الخدمة ----------
export async function listProviders() {
  if (IS_DEMO) return loadProviders().slice().sort((a, b) => b.id - a.id)
  const { db, collection, getDocs } = await fb()
  const snap = await getDocs(collection(db, 'providers'))
  return snap.docs.map((d) => d.data()).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
}

export async function getProviderById(id) {
  if (IS_DEMO) return loadProviders().find((p) => String(p.id) === String(id)) || null
  const { db, doc, getDoc } = await fb()
  const snap = await getDoc(doc(db, 'providers', String(id)))
  return snap.exists() ? snap.data() : null
}

export async function slugTaken(slug, exceptId) {
  if (IS_DEMO) return loadProviders().some((p) => p.slug === slug && p.id !== exceptId)
  const { db, collection, query, where, getDocs } = await fb()
  const snap = await getDocs(query(collection(db, 'providers'), where('slug', '==', slug)))
  return snap.docs.some((d) => d.id !== String(exceptId))
}

// المحافظات اللي مقدم الخدمة بيظهر فيها (اللي ساكن فيها + اللي بيغطيها)
async function governoratesOf(p) {
  if (!p || p.status !== 'active') return new Set()
  const locs = (catalogCache || (await listCatalogAll())).locations
  return new Set([p.home_location_id, ...(p.area_ids || [])].map((id) => governorateOf(locs, id)).filter((g) => g != null))
}

// بيكتب مقدم الخدمة في كل الأماكن اللي الزوار بيقروا منها (في عملية واحدة)
async function publish(record, previous) {
  const { db, doc, writeBatch, deleteField } = await fb()
  const batch = writeBatch(db)
  const id = String(record.id)
  batch.set(doc(db, 'providers', id), clean(record))

  if (record.status === 'active') batch.set(doc(db, 'public_providers', id), clean({ ...toPublic(record), bio: record.bio || null }))
  else batch.delete(doc(db, 'public_providers', id))

  const now = await governoratesOf(record)
  const before = await governoratesOf(previous)
  const entry = clean(toPublic(record))
  for (const g of now) batch.set(doc(db, 'public_index', String(g)), { items: { [id]: entry }, updated_at: nowISO() }, { merge: true })
  for (const g of before) if (!now.has(g)) batch.update(doc(db, 'public_index', String(g)), { [`items.${id}`]: deleteField() })
  await batch.commit()
}

/**
 * photo: { blob } لصورة جديدة، أو { remove: true } لشيلها
 */
export async function saveProvider(form, photo = null) {
  if (IS_DEMO) {
    const list = loadProviders()
    const id = form.id || Math.max(0, ...list.map((p) => p.id)) + 1
    let photo_url = form.photo_url
    if (photo?.blob) photo_url = await blobToDataURL(photo.blob)
    if (photo?.remove) photo_url = null
    const row = { ...form, id, photo_url, home_location_id: Number(form.home_location_id) || null }
    const i = list.findIndex((p) => p.id === id)
    i >= 0 ? (list[i] = row) : list.push(row)
    saveProviders(list)
    return { id }
  }

  const { db, doc, collection, setDoc, deleteDoc } = await fb()
  const id = form.id || doc(collection(db, 'providers')).id
  const previous = form.id ? await getProviderById(form.id) : null
  let photoFields = { photo_key: form.photo_key || null, photo_v: form.photo_v || null, photo_ext: form.photo_ext || null }
  if (photo?.blob) {
    const v = Date.now()
    await setDoc(doc(db, 'photos', id), { data: await blobToDataURL(photo.blob), v })
    photoFields = { photo_key: id, photo_v: v, photo_ext: extOf(photo.blob) }
  } else if (photo?.remove) {
    await deleteDoc(doc(db, 'photos', id)).catch(() => {})
    photoFields = { photo_key: null, photo_v: null, photo_ext: null }
  }
  const { photo_url, ...rest } = form
  await publish({ ...rest, ...photoFields, id, created_at: previous?.created_at || nowISO(), updated_at: nowISO() }, previous)
  return { id }
}

export async function setProviderStatus(id, status) {
  if (IS_DEMO) {
    const list = loadProviders()
    const p = list.find((x) => x.id === id)
    if (p) p.status = status
    return saveProviders(list)
  }
  const previous = await getProviderById(id)
  await publish({ ...previous, status, updated_at: nowISO() }, previous)
}

// مسح نهائي (من كل الأماكن + الصورة)
export async function deleteProvider(id) {
  if (IS_DEMO) return saveProviders(loadProviders().filter((p) => p.id !== id))
  const previous = await getProviderById(id)
  const { db, doc, writeBatch, deleteField } = await fb()
  const batch = writeBatch(db)
  const key = String(id)
  batch.delete(doc(db, 'providers', key))
  batch.delete(doc(db, 'public_providers', key))
  batch.delete(doc(db, 'photos', key))
  for (const g of await governoratesOf(previous)) batch.update(doc(db, 'public_index', String(g)), { [`items.${key}`]: deleteField() })
  await batch.commit()
}

// ---------- الإعلانات ----------
export async function listAds() {
  if (IS_DEMO) return loadAds().slice().sort((a, b) => b.id - a.id)
  const { db, collection, getDocs } = await fb()
  return (await getDocs(collection(db, 'ads'))).docs.map((d) => d.data()).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
}

// كل الإعلانات في مستند واحد (public/ads) عشان الزائر يقراها مرة واحدة
async function rebuildPublicAds() {
  const { db, doc, setDoc } = await fb()
  const items = (await listAds()).map(({ id, title, advertiser, placement, starts_at, ends_at, priority, is_active, location_ids, link_url, whatsapp, image_key, image_v, image_ext }) =>
    ({ id, title, advertiser, placement, starts_at, ends_at, priority, is_active, location_ids, link_url, whatsapp, image_key, image_v, image_ext }))
  await setDoc(doc(db, 'public', 'ads'), clean({ items, updated_at: nowISO() }))
}

/**
 * image: { blob } لصورة جديدة، أو { remove: true }
 */
export async function saveAd(form, image = null) {
  if (IS_DEMO) {
    const list = loadAds()
    const id = form.id || Math.max(0, ...list.map((a) => a.id)) + 1
    let image_url = form.image_url
    if (image?.blob) image_url = await blobToDataURL(image.blob)
    if (image?.remove) image_url = null
    const i = list.findIndex((a) => a.id === id)
    const row = { ...form, id, image_url, priority: Number(form.priority) || 0 }
    i >= 0 ? (list[i] = row) : list.push(row)
    return saveAds(list)
  }
  const { db, doc, collection, setDoc, deleteDoc } = await fb()
  const id = form.id || doc(collection(db, 'ads')).id
  let imageFields = { image_key: form.image_key || null, image_v: form.image_v || null, image_ext: form.image_ext || null }
  if (image?.blob) {
    const v = Date.now()
    await setDoc(doc(db, 'photos', `ad_${id}`), { data: await blobToDataURL(image.blob), v })
    imageFields = { image_key: `ad_${id}`, image_v: v, image_ext: extOf(image.blob) }
  } else if (image?.remove) {
    await deleteDoc(doc(db, 'photos', `ad_${id}`)).catch(() => {})
    imageFields = { image_key: null, image_v: null, image_ext: null }
  }
  const { image_url, ...rest } = form
  await setDoc(doc(db, 'ads', id), clean({ ...rest, ...imageFields, id, priority: Number(form.priority) || 0, created_at: form.created_at || nowISO() }))
  await rebuildPublicAds()
}

export async function deleteAd(id) {
  if (IS_DEMO) return saveAds(loadAds().filter((a) => a.id !== id))
  const { db, doc, deleteDoc } = await fb()
  await deleteDoc(doc(db, 'ads', String(id)))
  await deleteDoc(doc(db, 'photos', `ad_${id}`)).catch(() => {})
  await rebuildPublicAds()
}

// ---------- البلاغات ----------
export async function listReports() {
  if (IS_DEMO) return loadReports()
  const { db, collection, query, orderBy, limit, getDocs } = await fb()
  const snap = await getDocs(query(collection(db, 'reports'), orderBy('created_at', 'desc'), limit(300)))
  return snap.docs.map((d) => {
    const r = d.data()
    return { ...r, id: d.id, created_at: r.created_at?.toDate?.().toISOString() || nowISO() }
  })
}

export async function setReportStatus(id, status) {
  if (IS_DEMO) {
    const list = loadReports()
    const r = list.find((x) => x.id === id)
    if (r) r.status = status
    return saveReports(list)
  }
  const { db, doc, updateDoc } = await fb()
  await updateDoc(doc(db, 'reports', String(id)), { status })
}

// ---------- الإحصائيات ----------
// من الأحداث (الوضع التجريبي) أو من العدّادات اليومية (Firebase) — نفس الشكل في الحالتين
function summarize({ totals, daily, byDim }) {
  const list = (dim) => [...(byDim[dim] || new Map()).entries()]
  return {
    totals,
    daily: [...daily.values()].sort((a, b) => a.day.localeCompare(b.day)),
    providers: list('p').map(([id, c]) => ({ id, whatsapp: c.whatsapp || 0, call: c.call || 0, views: c.profile_views || 0 }))
      .sort((a, b) => b.whatsapp + b.call - (a.whatsapp + a.call) || b.views - a.views).slice(0, 50),
    categories: list('c').map(([id, c]) => ({ id: Number(id), contacts: (c.whatsapp || 0) + (c.call || 0), views: c.profile_views || 0 }))
      .sort((a, b) => b.contacts - a.contacts || b.views - a.views),
    locations: list('l').map(([id, c]) => ({ id: Number(id), views: c.views || 0, contacts: (c.whatsapp || 0) + (c.call || 0) }))
      .sort((a, b) => b.views - a.views),
    ads: list('a').map(([id, c]) => ({ id, clicks: c.ad_click || 0 })).filter((a) => a.clicks).sort((a, b) => b.clicks - a.clicks),
  }
}

const FIELD = { page_view: 'views', profile_view: 'profile_views', whatsapp: 'whatsapp', call: 'call', share: 'share', ad_click: 'ad_click' }
const COUNTS = Object.values(FIELD)

function aggregate(rows) {
  const totals = {}
  const daily = new Map()
  const byDim = {}
  for (const r of rows) {
    if (r.dim === 'all') {
      for (const [kind, field] of Object.entries(FIELD)) totals[kind] = (totals[kind] || 0) + (r[field] || 0)
      const d = daily.get(r.date) || { day: r.date, views: 0, contacts: 0 }
      d.views += r.views || 0
      d.contacts += (r.whatsapp || 0) + (r.call || 0)
      daily.set(r.date, d)
      continue
    }
    const m = (byDim[r.dim] ||= new Map())
    const acc = m.get(r.ref) || {}
    for (const f of COUNTS) acc[f] = (acc[f] || 0) + (r[f] || 0)
    m.set(r.ref, acc)
  }
  return summarize({ totals, daily, byDim })
}

export async function getAdminStats(days = 30) {
  const since = new Date(Date.now() - (days - 1) * 864e5)
  if (IS_DEMO) {
    // الأحداث المحفوظة في المتصفح ← نفس شكل العدّادات
    const rows = []
    for (const e of loadEvents()) {
      if (Date.parse(e.created_at) < since.getTime()) continue
      const date = e.created_at.slice(0, 10)
      const field = FIELD[e.kind]
      rows.push({ dim: 'all', date, [field]: 1 })
      if (e.provider_id != null) rows.push({ dim: 'p', ref: e.provider_id, date, [field]: 1 })
      if (e.category_id != null) rows.push({ dim: 'c', ref: e.category_id, date, [field]: 1 })
      if (e.location_id != null) rows.push({ dim: 'l', ref: e.location_id, date, [field]: 1 })
      if (e.ad_id != null) rows.push({ dim: 'a', ref: e.ad_id, date, [field]: 1 })
    }
    return aggregate(rows)
  }
  const sinceDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(since)
  const { db, collection, query, where, getDocs } = await fb()
  const snap = await getDocs(query(collection(db, 'counters'), where('date', '>=', sinceDate)))
  return aggregate(snap.docs.map((d) => d.data()))
}
