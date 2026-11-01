import { toLatinDigits } from './arabic.js'
import { SITE } from '../config.js'

// أي شكل للرقم ← 01xxxxxxxxx (أو '' لو مش رقم مصري صحيح)
export function normalizeEgPhone(raw = '') {
  let d = toLatinDigits(raw).replace(/\D/g, '')
  if (d.startsWith('0020')) d = d.slice(4)
  else if (d.startsWith('20') && d.length === 12) d = d.slice(2)
  if (d.length === 10 && d.startsWith('1')) d = '0' + d
  return /^01[0125]\d{8}$/.test(d) ? d : ''
}

const intl = (phone) => '20' + phone.replace(/^0/, '')

export const waLink = (phone, text = '') =>
  `https://wa.me/${intl(phone)}${text ? `?text=${encodeURIComponent(text)}` : ''}`

export const telLink = (phone) => `tel:${phone}`

export const adminWaLink = (text = '') =>
  `https://wa.me/${SITE.adminWhatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`

// 01000000001 ← 0100 000 0001 (أسهل في القراية)
export const formatPhone = (p = '') => p.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3')
