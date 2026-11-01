import { useEffect, useState } from 'react'
import { BrandMark } from './Logo.jsx'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, Search, UserPlus, Megaphone, MapPin, ChevronDown, Moon, Sun, Lock } from 'lucide-react'
import { useAppState } from '../lib/app-state.jsx'
import { LocationSheet } from './LocationSheet.jsx'
import { InstallPrompt } from './InstallPrompt.jsx'
import { logEvent } from '../lib/api.js'
import { SITE, IS_DEMO } from '../config.js'

export function LocationChip() {
  const { catalog, locationId } = useAppState()
  const [open, setOpen] = useState(false)
  const label = locationId ? catalog?.locLabel(locationId) : 'كل الأماكن'
  return (
    <>
      <button className="loc-chip" onClick={() => setOpen(true)} aria-label={`المكان: ${label}. اضغط للتغيير`}>
        <i className="pin">
          <MapPin size={16} />
        </i>
        <span>{label}</span>
        <ChevronDown size={16} />
      </button>
      {open && <LocationSheet onClose={() => setOpen(false)} />}
    </>
  )
}

function ThemeButton() {
  const { theme, toggleTheme } = useAppState()
  const [, force] = useState(0)
  const isDark =
    theme === 'dark' || (!theme && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return (
    <button
      className="icon-btn"
      onClick={() => {
        toggleTheme()
        force((n) => n + 1)
      }}
      aria-label={isDark ? 'الوضع الفاتح' : 'الوضع الليلي'}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}

const NAV = [
  { to: '/', label: 'الرئيسية', icon: Home, end: true },
  { to: '/search', label: 'دوّر', icon: Search },
  { to: '/join', label: 'سجّل اسمك', icon: UserPlus },
  { to: '/advertise', label: 'أعلن', icon: Megaphone },
]

export function Layout() {
  const { pathname, search } = useLocation()
  const { locationId } = useAppState()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    logEvent('page_view', { path: pathname + search, location: locationId })
  }, [pathname])

  return (
    <>
      {IS_DEMO && <div className="demo-bar">وضع تجريبي — البيانات والأرقام وهمية</div>}
      <header className="app-header">
        <div className="container">
          <Link to="/" className="brand" aria-label={`${SITE.name} — الرئيسية`}>
            <BrandMark />
            {SITE.name}
          </Link>
          <nav className="desk-nav" aria-label="القائمة">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="spacer" />
          <LocationChip />
          <ThemeButton />
        </div>
      </header>

      <main className="page">
        <Outlet />
        <footer className="footer container">
          <InstallPrompt />
          <nav>
            <Link to="/about">عن {SITE.name}</Link>
            <Link to="/join">سجّل اسمك</Link>
            <Link to="/advertise">أعلن معانا</Link>
            <Link to="/terms">الشروط وإخلاء المسؤولية</Link>
            <Link to="/privacy">الخصوصية</Link>
          </nav>
          <p>
            {SITE.name} منصة مجانية بتوصّل الناس ببعض بس. الاتفاق والدفع بيكون بينك وبين مقدم الخدمة مباشرة.
          </p>
          <Link to="/admin" className="footer-admin">
            <Lock size={13} /> دخول الإدارة
          </Link>
        </footer>
      </main>

      <nav className="bottom-nav" aria-label="التنقل">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <i>
              <Icon size={20} />
            </i>
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
