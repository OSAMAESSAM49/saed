// تحويل الاسم العربي لـ slug إنجليزي للروابط (البجلات ← elbaglat). الأدمن يقدر يعدّله بإيده.
import { normalizeAr } from './arabic.js'

const MAP = {
  ا: 'a', ب: 'b', ت: 't', ث: 's', ج: 'g', ح: 'h', خ: 'kh', د: 'd', ذ: 'z', ر: 'r', ز: 'z', س: 's', ش: 'sh',
  ص: 's', ض: 'd', ط: 't', ظ: 'z', ع: 'a', غ: 'gh', ف: 'f', ق: 'k', ك: 'k', ل: 'l', م: 'm', ن: 'n', ه: 'a',
  و: 'w', ي: 'y', ء: '',
}

export function slugify(text = '') {
  return normalizeAr(text)
    .replace(/(^|\s)ال/g, '$1el-')
    .split('')
    .map((ch) => (ch in MAP ? MAP[ch] : /[a-z0-9]/.test(ch) ? ch : '-'))
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

export const isValidSlug = (s) => /^[a-z0-9-]{2,60}$/.test(s)
