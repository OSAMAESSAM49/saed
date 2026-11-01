// قالب رسالة "سجّل اسمك" + قارئ الرسالة اللي بيملا فورم الأدمن أوتوماتيك
import { normalizeAr, toLatinDigits } from './arabic.js'
import { normalizeEgPhone } from './phone.js'
import { SITE } from '../config.js'

export const JOIN_FIELDS = [
  ['name', 'الاسم'],
  ['age', 'السن'],
  ['gender', 'النوع (راجل / ست)'],
  ['home', 'البلد اللي ساكن فيها'],
  ['services', 'الخدمة اللي بقدمها'],
  ['areas', 'الأماكن اللي بروحها'],
  ['days', 'أيام الشغل'],
  ['hours', 'المواعيد (من كام لكام)'],
  ['whatsapp', 'رقم الواتساب'],
  ['phone', 'رقم الاتصال'],
  ['show_phone', 'أظهر رقم الاتصال على الموقع؟ (أيوه / لأ)'],
  ['bio', 'نبذة عني وعن خبرتي'],
  ['price', 'السعر (اختياري)'],
]

export const JOIN_TEMPLATE = [
  `السلام عليكم 👋 عايز أسجّل اسمي في منصة ${SITE.name}`,
  '',
  ...JOIN_FIELDS.map(([, label]) => `${label}: `),
  '',
  '📸 هبعتلكم صورة شخصية واضحة في الرسالة الجاية',
].join('\n')

// ---------- قراءة الرسالة ----------

// الترتيب مهم: "أظهر رقم الاتصال" لازم تتشيك قبل "رقم الاتصال"
const LABELS = [
  ['show_phone', ['اظهر', 'يظهر', 'اظهار']],
  ['whatsapp', ['واتساب', 'واتس', 'whatsapp']],
  ['phone', ['الاتصال', 'التليفون', 'الموبايل', 'رقم']],
  ['name', ['الاسم', 'اسم']],
  ['age', ['السن', 'العمر']],
  ['gender', ['النوع']],
  ['home', ['البلد', 'القريه', 'المدينه', 'السكن', 'ساكن']],
  ['services', ['الخدمه', 'الخدمات', 'الشغلانه', 'المهنه', 'بقدم']],
  ['areas', ['الاماكن', 'المناطق', 'بروح', 'بغطي']],
  ['days', ['ايام']],
  ['hours', ['المواعيد', 'الساعات', 'من كام']],
  ['bio', ['نبذه', 'خبرتي', 'عني']],
  ['price', ['السعر', 'الاسعار']],
]

function labelKey(label) {
  const n = normalizeAr(label)
  for (const [key, words] of LABELS) if (words.some((w) => n.includes(w))) return key
  return null
}

const DAY_WORDS = {
  6: ['السبت', 'سبت'],
  0: ['الحد', 'الاحد', 'احد'],
  1: ['الاتنين', 'الاثنين', 'اتنين', 'اثنين'],
  2: ['التلات', 'الثلاثاء', 'الثلاثا', 'التلاتاء', 'تلات', 'ثلاثاء'],
  3: ['الاربع', 'الاربعاء', 'الاربعا', 'اربع', 'اربعاء'],
  4: ['الخميس', 'خميس'],
  5: ['الجمعه', 'جمعه'],
}
function dayOf(token) {
  let t = token.replace(/^و/, '')
  if (t.startsWith('لل')) t = 'ال' + t.slice(2)
  for (const [d, words] of Object.entries(DAY_WORDS)) if (words.includes(t)) return Number(d)
  return null
}

export function parseDays(text) {
  const n = normalizeAr(text)
  const tokens = n.split(/[\s،,\-–—/]+/).filter(Boolean)
  const found = tokens.map(dayOf).filter((d) => d !== null)
  let days
  if (/كل يوم|كل الايام|طول الاسبوع|الاسبوع كله|يوميا/.test(n)) {
    days = [0, 1, 2, 3, 4, 5, 6]
    // "كل يوم ماعدا الجمعة"
    if (/ماعدا|ما عدا|الا |غير/.test(n)) days = days.filter((d) => !found.includes(d))
  } else if (found.length === 2 && /(^|\s)من|لحد|الى|حتى|لل|-|–/.test(n)) {
    // "من السبت للخميس" ← مدى
    const [a, b] = found
    days = []
    for (let d = a; ; d = (d + 1) % 7) {
      days.push(d)
      if (d === b || days.length > 7) break
    }
  } else {
    days = [...new Set(found)]
  }
  return days.length ? days.sort() : null
}

const PM = /العصر|عصرا|المغرب|بالليل|الليل|مساء|بليل|^م$/
const NOON = /الضهر|الظهر|ضهرا|ظهرا/
const AM = /الصبح|صباحا|الفجر|^ص$/

export function parseHours(text) {
  const n = normalizeAr(text)
  if (/24|طول اليوم|اي وقت|طول الوقت|ليل ونهار/.test(n) && !/\d+\s*[:.]/.test(n)) return { from: '00:00', to: '23:59' }
  const re = /(\d{1,2})(?:[:.](\d{2}))?\s*(الصبح|صباحا|الفجر|الضهر|الظهر|ضهرا|ظهرا|العصر|عصرا|المغرب|بالليل|الليل|بليل|مساء|ص|م)?/g
  const hits = [...n.matchAll(re)].slice(0, 2)
  if (hits.length < 2) return null
  const conv = ([, h, m, p], isEnd, fromH) => {
    let hour = Number(h) % 24
    if (p && PM.test(p)) hour = hour === 12 ? 0 : hour < 12 ? hour + 12 : hour
    else if (p && NOON.test(p)) hour = hour < 12 && hour !== 12 ? (hour <= 4 ? hour + 12 : hour) : hour
    else if (p && AM.test(p)) hour = hour === 12 ? 0 : hour
    else if (!isEnd && hour > 0 && hour < 7) hour += 12
    else if (isEnd && hour <= fromH && hour < 12) hour += 12
    return { hour, min: Number(m || 0) }
  }
  const from = conv(hits[0], false)
  const to = conv(hits[1], true, from.hour)
  const fmt = ({ hour, min }) => `${String(hour % 24).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  return { from: fmt(from), to: fmt(to) === '00:00' ? '23:59' : fmt(to) }
}

const splitList = (text) =>
  text
    .split(/[،,\/\n+]|\s+و(?=\S)|\s+-\s+|\s+و\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)

function matchServices(text, catalog) {
  const ids = []
  const unmatched = []
  // كل خدمة بتاخد درجة، والأعلى بتكسب (عشان "مدرس إنجليزي" تروح لـ إنجليزي مش ابتدائي)
  const score = (s, n) => {
    const name = normalizeAr(s.name_ar)
    let best = 0
    if (name === n) best = 100
    else if (name.includes(n) || n.includes(name)) best = 50 + Math.min(n.length, name.length)
    for (const k of s.keywords) {
      const kn = normalizeAr(k)
      if (kn === n) best = Math.max(best, 40)
      else if (kn.length > 2 && n.includes(kn)) best = Math.max(best, 10 + kn.length)
    }
    return best
  }
  for (const part of splitList(text)) {
    const n = normalizeAr(part)
    let sub = null
    let top = 0
    for (const s of catalog.subcategories) {
      const sc = score(s, n)
      if (sc > top) (top = sc), (sub = s)
    }
    if (sub && !ids.includes(sub.id)) ids.push(sub.id)
    else if (!sub) unmatched.push(part)
  }
  return { ids, unmatched }
}

const stripPlaceWords = (s) => normalizeAr(s).replace(/^(قريه|مدينه|مركز|محافظه|بلد|عزبه)\s+/, '').replace(/\s+(كلها|كله)$/, '').trim()

// لو فيه مدينة ومركز بنفس الاسم (منية النصر)، المدينة/القرية تكسب إلا لو كاتب "مركز" صراحة
const TYPE_RANK = { village: 0, city: 1, center: 2, governorate: 3 }

function matchLocation(text, catalog) {
  const n = stripPlaceWords(text)
  if (!n) return null
  const wantsCenter = /^مركز/.test(normalizeAr(text))
  const ordered = [...catalog.locations].sort((a, b) =>
    wantsCenter ? (b.type === 'center') - (a.type === 'center') : TYPE_RANK[a.type] - TYPE_RANK[b.type],
  )
  return (
    ordered.find((l) => stripPlaceWords(l.name_ar) === n) ||
    ordered.find((l) => {
      const ln = stripPlaceWords(l.name_ar)
      return ln.length > 2 && (n.includes(ln) || ln.includes(n))
    }) ||
    null
  )
}

function matchAreas(text, catalog, homeId) {
  const ids = []
  const unmatched = []
  for (const part of splitList(text)) {
    const n = normalizeAr(part)
    if (/^(البلد|بلدي|القريه)( بس| كلها)?$/.test(n) && homeId) {
      ids.push(homeId)
      continue
    }
    if (/كل المركز|المركز كله/.test(n) && homeId) {
      const parent = catalog.locById.get(homeId)?.parent_id
      if (parent) ids.push(parent)
      continue
    }
    const loc = matchLocation(part, catalog)
    loc ? ids.push(loc.id) : unmatched.push(part)
  }
  return { ids: [...new Set(ids)], unmatched }
}

/**
 * بيقرا رسالة الواتساب ويرجّع:
 *  - fields: القيم اللي اتعرفت (بنفس أسماء فورم الأدمن)
 *  - notes: ملاحظات للأدمن عن الحاجات اللي محتاجة مراجعة
 */
export function parseJoinMessage(text, catalog) {
  const raw = {}
  let current = null
  for (let line of toLatinDigits(text).split(/\r?\n/)) {
    line = line.replace(/[*_~`]/g, '').replace(/^[\s•\-–]+/, '').trim()
    if (!line) continue
    const m = line.match(/^([^:：]{1,45})[:：]\s*(.*)$/)
    const key = m && labelKey(m[1])
    if (key) {
      current = key
      raw[key] = m[2].trim()
    } else if (current === 'bio' || current === 'price') {
      raw[current] = [raw[current], line].filter(Boolean).join('\n')
    }
  }

  const fields = {}
  const notes = []

  if (raw.name) fields.name = raw.name
  if (raw.age) {
    const age = parseInt(raw.age, 10)
    if (age > 0 && age < 100) fields.age = age
  }
  if (raw.gender) {
    const g = normalizeAr(raw.gender)
    fields.gender = /ست|انثي|سيده|بنت|انسه|female/.test(g) ? 'female' : 'male'
  }
  if (raw.home) {
    const loc = matchLocation(raw.home, catalog)
    if (loc) fields.home_location_id = loc.id
    else notes.push(`البلد "${raw.home}" مش موجودة في الأماكن — ضيفها من إدارة الأماكن أو اختار أقرب مكان.`)
  }
  if (raw.services) {
    const { ids, unmatched } = matchServices(raw.services, catalog)
    if (ids.length) fields.service_ids = ids
    if (unmatched.length) notes.push(`خدمات معرفناش نطابقها: ${unmatched.join('، ')} — اختارها بإيدك.`)
  }
  if (raw.areas) {
    const { ids, unmatched } = matchAreas(raw.areas, catalog, fields.home_location_id)
    if (ids.length) fields.area_ids = ids
    if (unmatched.length) notes.push(`أماكن مش موجودة: ${unmatched.join('، ')}`)
  }
  const days = raw.days && parseDays(raw.days)
  const hours = raw.hours && parseHours(raw.hours)
  if (days || hours) fields.schedule = { ...(days && { days }), ...(hours || {}) }
  if (raw.days && !days) notes.push(`مفهمناش أيام الشغل: "${raw.days}"`)
  if (raw.hours && !hours) notes.push(`مفهمناش المواعيد: "${raw.hours}"`)

  if (raw.whatsapp) {
    const p = normalizeEgPhone(raw.whatsapp)
    p ? (fields.whatsapp = p) : notes.push(`رقم الواتساب "${raw.whatsapp}" شكله غلط.`)
  }
  if (raw.phone) {
    const p = normalizeEgPhone(raw.phone)
    if (p) fields.phone = p
    else if (/نفس|هو هو|زي/.test(raw.phone) && fields.whatsapp) fields.phone = fields.whatsapp
  }
  if (!fields.phone && fields.whatsapp) fields.phone = fields.whatsapp
  if (raw.show_phone) fields.show_phone = !/^(لا|لأ|لاء|لا يظهر|مش عايز|no)/.test(normalizeAr(raw.show_phone))
  if (raw.bio) fields.bio = raw.bio
  if (raw.price) fields.price_note = raw.price

  if (!Object.keys(fields).length) notes.push('مش لاقيين أي بيانات — اتأكد إن الرسالة فيها "الاسم: ..." وهكذا.')
  return { fields, notes }
}
