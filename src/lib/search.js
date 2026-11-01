// منطق البحث والفلترة — بيشتغل في المتصفح على قايمة مقدمي الخدمة
// (نفس المنطق للوضع التجريبي ولـ Firebase، ولسكربت الـ prerender)
import { normalizeAr } from './arabic.js'

// الفئات والأماكن المفتوحة بس (الأدمن يقدر يقفل فئة أو مكان من غير ما يمسحه)
export function activeCatalog(all) {
  const activeCats = new Set(all.categories.filter((c) => c.is_active !== false).map((c) => c.id))
  const bySort = (a, b) => (a.sort || 0) - (b.sort || 0) || a.id - b.id
  return {
    categories: all.categories.filter((c) => c.is_active !== false).sort(bySort),
    subcategories: all.subcategories.filter((x) => x.is_active !== false && activeCats.has(x.category_id)).sort(bySort),
    locations: all.locations.filter((l) => l.is_active !== false).sort(bySort),
  }
}

export const todayISO = () => new Date().toISOString().slice(0, 10)
export const featuredNow = (p) => !!p.is_featured && (!p.featured_until || p.featured_until >= todayISO())

// المكان نفسه + كل اللي فوقه + كل اللي تحته
// (لو اخترت البجلات: يظهر اللي ساكن فيها، واللي بيغطي مركز منية النصر كله، وهكذا)
export function locationFamily(locations, id) {
  if (id == null) return null
  const out = new Set([id])
  const byId = new Map(locations.map((l) => [l.id, l]))
  for (let cur = byId.get(id); cur?.parent_id; cur = byId.get(cur.parent_id)) out.add(cur.parent_id)
  const walk = (pid) => locations.filter((l) => l.parent_id === pid).forEach((l) => (out.add(l.id), walk(l.id)))
  walk(id)
  return out
}

// المحافظة اللي المكان تبعها (مقدمي الخدمة متقسّمين في Firestore حسب المحافظة)
export function governorateOf(locations, id) {
  const byId = new Map(locations.map((l) => [l.id, l]))
  let cur = byId.get(id)
  while (cur?.parent_id) cur = byId.get(cur.parent_id)
  return cur?.id ?? null
}

export const servesFamily = (p, fam) => !fam || fam.has(p.home_location_id) || (p.area_ids || []).some((a) => fam.has(a))

export function filterProviders(list, catalog, { location, category, sub, women, verified, q, sort = 'best', limit = 60, offset = 0 } = {}) {
  const fam = locationFamily(catalog.locations, location)
  const { subcategories: subs, categories: cats } = catalog
  const nq = normalizeAr(q || '')
  const hit = (text) => {
    const t = normalizeAr(text)
    return t && (t.includes(nq) || nq.includes(t))
  }

  const out = list.filter((p) => {
    if (women && !p.women_service) return false
    if (verified && !p.is_verified) return false
    if (!servesFamily(p, fam)) return false
    const mySubs = subs.filter((s) => p.service_ids.includes(s.id))
    if (category) {
      const cat = cats.find((c) => c.slug === category)
      if (!cat || !mySubs.some((s) => s.category_id === cat.id)) return false
    }
    if (sub && !mySubs.some((s) => s.slug === sub)) return false
    if (nq) {
      const inText = normalizeAr([p.name, p.price_note].join(' ')).includes(nq)
      const inServices = mySubs.some(
        (s) => hit(s.name_ar) || s.keywords.some(hit) || hit(cats.find((c) => c.id === s.category_id)?.name_ar),
      )
      if (!inText && !inServices) return false
    }
    return true
  })

  out.sort((a, b) => {
    if (sort !== 'recent') {
      const f = featuredNow(b) - featuredNow(a)
      if (f) return f
      const v = b.is_verified - a.is_verified
      if (v) return v
    }
    return String(b.joined_at).localeCompare(String(a.joined_at)) || String(b.id).localeCompare(String(a.id))
  })

  return out.slice(offset, offset + limit).map((p) => ({ ...p, is_featured: featuredNow(p) }))
}

// الإعلانات الشغالة في مكان معيّن (لو الإعلان مالوش أماكن = بيظهر في كل مكان)
export function filterAds(ads, locations, placement, location) {
  const fam = locationFamily(locations, location)
  const today = todayISO()
  return ads
    .filter(
      (a) =>
        a.is_active &&
        a.placement === placement &&
        a.starts_at <= today &&
        a.ends_at >= today &&
        (!a.location_ids?.length || (fam && a.location_ids.some((id) => fam.has(id)))),
    )
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
}

// اللي بيظهر للزوار من بيانات مقدم الخدمة (من غير البيانات الخاصة، ومن غير رقم الاتصال لو مش عايزه يظهر)
export function toPublic(p) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    gender: p.gender,
    women_service: !!p.women_service,
    home_location_id: p.home_location_id ?? null,
    area_ids: p.area_ids || [],
    service_ids: p.service_ids || [],
    schedule: p.schedule || null,
    is_verified: !!p.is_verified,
    is_featured: !!p.is_featured,
    featured_until: p.featured_until || null,
    joined_at: p.joined_at,
    whatsapp: p.whatsapp || null,
    phone: p.show_phone ? p.phone || null : null,
    show_phone: !!p.show_phone,
    price_note: p.price_note || null,
    photo_url: p.photo_url || null,
    photo_key: p.photo_key || null,
    photo_v: p.photo_v || null,
    photo_ext: p.photo_ext || null,
  }
}
