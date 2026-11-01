// أيام الأسبوع بأرقام JavaScript: 0 = الحد ... 6 = السبت
export const DAY_NAMES = ['الحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت']
export const DAY_SHORT = ['حد', 'اتنين', 'تلات', 'أربع', 'خميس', 'جمعة', 'سبت']
// ترتيب العرض بيبدأ من السبت زي ما الناس متعودة
export const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5]

const toMin = (t = '00:00') => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

const isAllDay = (s) => s?.from === '00:00' && (s?.to === '23:59' || s?.to === '24:00')

function cairoNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now)
  const get = (t) => parts.find((p) => p.type === t)?.value
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) }
}

// "متاح الآن" بتتحسب من أيام ومواعيد الشغل بتوقيت مصر
export function isAvailableNow(schedule, now) {
  if (!schedule?.days?.length) return false
  const { day, minutes } = cairoNow(now)
  const from = toMin(schedule.from)
  const to = toMin(schedule.to)
  if (from <= to) return schedule.days.includes(day) && minutes >= from && minutes <= to
  // مواعيد بتعدّي نص الليل (مثلاً من 6 المغرب لـ 2 بالليل)
  const prev = (day + 6) % 7
  return (schedule.days.includes(day) && minutes >= from) || (schedule.days.includes(prev) && minutes <= to)
}

export function formatTime(t) {
  const [h, m] = t.split(':').map(Number)
  const h12 = h % 12 === 0 ? 12 : h % 12
  const period = h < 5 ? 'بالليل' : h < 12 ? 'الصبح' : h < 15 ? 'الضهر' : h < 18 ? 'العصر' : h < 20 ? 'المغرب' : 'بالليل'
  return `${h12}${m ? ':' + String(m).padStart(2, '0') : ''} ${period}`
}

export function formatHours(s) {
  if (!s?.from || !s?.to) return ''
  if (isAllDay(s)) return 'طول اليوم (24 ساعة)'
  return `من ${formatTime(s.from)} لـ ${formatTime(s.to)}`
}

export function formatDays(days = []) {
  const set = new Set(days)
  if (set.size === 7) return 'كل يوم'
  if (set.size === 0) return 'بالاتفاق'
  const missing = WEEK_ORDER.filter((d) => !set.has(d))
  if (missing.length === 1) return `كل يوم ماعدا ${DAY_NAMES[missing[0]]}`
  return WEEK_ORDER.filter((d) => set.has(d)).map((d) => DAY_NAMES[d]).join('، ')
}
