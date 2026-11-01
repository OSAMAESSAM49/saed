// "الوضع التجريبي": بيشغّل الموقع كامل من غير Firebase، بنفس منطق البحث والفلترة
// كل تعديلات الأدمن في الوضع ده بتتحفظ في المتصفح بس (localStorage)
import { locations, categoryRows, subcategoryRows, demoProviders } from '../data/seed.js'
import { activeCatalog, filterProviders, filterAds, toPublic } from './search.js'

const KEYS = {
  providers: 'saed.demo.providers',
  catalog: 'saed.demo.catalog',
  ads: 'saed.demo.ads',
  reports: 'saed.demo.reports',
  events: 'saed.demo.events',
}

function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    if (v) return v
  } catch {}
  return fallback()
}

export function save(key, value) {
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(value))
  } catch {
    throw new Error('مساحة المتصفح مليانة — في الوضع التجريبي الصور بتتحفظ في المتصفح')
  }
}

// ---------- الفئات والأماكن ----------
export const loadCatalogAll = () =>
  load(KEYS.catalog, () => ({
    categories: categoryRows.map((c) => ({ ...c, is_active: true })),
    subcategories: subcategoryRows.map((s) => ({ ...s, is_active: true })),
    locations: locations.map((l) => ({ ...l, is_active: true })),
  }))

export const saveCatalogAll = (c) => save('catalog', c)

export const demoCatalog = () => activeCatalog(loadCatalogAll())

// ---------- مقدمي الخدمة ----------
const seedProviders = () => {
  const locBySlug = Object.fromEntries(locations.map((l) => [l.slug, l.id]))
  const subBySlug = Object.fromEntries(subcategoryRows.map((s) => [s.slug, s.id]))
  return demoProviders.map(({ services, areas, home, ...p }) => ({
    ...p,
    home_location_id: locBySlug[home] ?? null,
    service_ids: services.map((s) => subBySlug[s]),
    area_ids: areas.map((a) => locBySlug[a]),
    private: {},
  }))
}

export const loadProviders = () => load(KEYS.providers, seedProviders)
export const saveProviders = (list) => save('providers', list)

export const demoSearch = (opts) =>
  filterProviders(loadProviders().filter((p) => p.status === 'active').map(toPublic), demoCatalog(), opts)

export function demoGetProvider(slug) {
  const p = loadProviders().find((x) => x.slug === slug && x.status === 'active')
  return p ? { ...toPublic(p), bio: p.bio || null } : null
}

// ---------- الإعلانات ----------
export const loadAds = () => load(KEYS.ads, () => [])
export const saveAds = (list) => save('ads', list)

export const demoActiveAds = (placement, location) => filterAds(loadAds(), loadCatalogAll().locations, placement, location)

// ---------- البلاغات والأحداث ----------
export const loadReports = () => load(KEYS.reports, () => [])
export const saveReports = (list) => save('reports', list)

export function demoReport({ providerId, reason, details, contact }) {
  const list = loadReports()
  list.unshift({
    id: Date.now(), provider_id: providerId, reason, details, contact, status: 'new', created_at: new Date().toISOString(),
  })
  saveReports(list)
  return true
}

export const loadEvents = () => load(KEYS.events, () => [])

export function demoLog(kind, data) {
  const list = loadEvents()
  list.push({ kind, ...data, created_at: new Date().toISOString() })
  try {
    save('events', list.slice(-3000))
  } catch {}
}
