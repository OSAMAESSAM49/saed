import { createContext, useContext } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../components/Logo.jsx'
import { ArrowRight } from 'lucide-react'
import { SITE } from '../config.js'

// صلاحية اللي عامل دخول: 'owner' (صاحب الموقع) أو 'moderator' (مشرف)
export const RoleContext = createContext('owner')
export const useIsOwner = () => useContext(RoleContext) === 'owner'

// الشريط اللي فوق في كل صفحات الأدمن
export function AdminTop({ title, back, children }) {
  return (
    <div className="admin-top">
      {back ? (
        <Link to={back} className="icon-btn" aria-label="رجوع">
          <ArrowRight size={20} />
        </Link>
      ) : (
        <Link to="/admin" className="brand" aria-label={`لوحة ${SITE.name}`}>
          <BrandMark />
        </Link>
      )}
      <h1 className="admin-title spacer">{title}</h1>
      {children}
    </div>
  )
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="toggle">
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

// نافذة تعديل صغيرة (بتستخدمها صفحات الفئات والأماكن)
export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h2>{title}</h2>
        </div>
        <div className="sheet-body stack" style={{ gap: 14, paddingBottom: 4 }}>
          {children}
        </div>
        {footer && <div className="row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  )
}
