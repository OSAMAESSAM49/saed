// نفس منطق normalize_ar في قاعدة البيانات، عشان البحث يتصرف بنفس الطريقة في المتصفح
const MAP = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ة': 'ه', 'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي' }

export function toLatinDigits(s = '') {
  return String(s)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
}

export function normalizeAr(s = '') {
  return toLatinDigits(s)
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآٱةىؤئ]/g, (c) => MAP[c])
    .toLowerCase()
    .trim()
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
export const arNum = (n) => String(n).replace(/\d/g, (d) => AR_DIGITS[d])

export function matchesText(haystack, needle) {
  const h = normalizeAr(haystack)
  const n = normalizeAr(needle)
  return !!n && (h.includes(n) || n.includes(h))
}
