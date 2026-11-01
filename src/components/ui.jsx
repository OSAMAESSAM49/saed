import { useEffect, useState } from 'react'
import { X, BadgeCheck } from 'lucide-react'
import { TONES } from '../lib/icons.jsx'
import { usePhoto } from '../lib/photos.js'

export function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn ghost" onClick={onClose} aria-label="قفل">
            <X size={22} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

const TITLES = /^(أ\.|ا\.|د\.|م\.|مستر|ميس|الشيخ|الحاج|الحاجة|الأستاذ|الأستاذة|استاذ|أستاذ|أم|أبو)$/
export function initialOf(name = '') {
  const words = name.split(/\s+/).filter((w) => w && !TITLES.test(w))
  return (words[0] || name).charAt(0)
}

// لون ثابت لكل مقدم خدمة (الـ id ممكن يكون رقم أو نص)
const toneOf = (id = '') => TONES[[...String(id)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % TONES.length]

export function Avatar({ provider, className = '', alt }) {
  const { src, onError } = usePhoto(provider)
  return (
    <div className={`avatar ${className}`} data-tone={toneOf(provider.id)}>
      {src ? (
        <img src={src} alt={alt || provider.name} loading="lazy" decoding="async" onError={onError} />
      ) : (
        <span className="initial" aria-hidden="true">{initialOf(provider.name)}</span>
      )}
    </div>
  )
}

export const Verified = ({ size = 20 }) => (
  <BadgeCheck className="verified" size={size} fill="var(--badge-bg)" stroke="var(--badge-fg)" aria-label="موثّق" />
)

export function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [message, onDone])
  return message ? <div className="toast" role="status">{message}</div> : null
}

export function useToast() {
  const [msg, setMsg] = useState('')
  return [msg, setMsg, () => setMsg('')]
}

export function Empty({ icon: Icon, title, text, children }) {
  return (
    <div className="empty">
      {Icon && (
        <div className="ic">
          <Icon size={32} strokeWidth={1.6} />
        </div>
      )}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  )
}

export const SkeletonList = ({ count = 4, height = 168 }) => (
  <div className="p-list" aria-busy="true" aria-label="جاري التحميل">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="skeleton" style={{ height }} />
    ))}
  </div>
)
