import { useEffect, useState } from 'react'
import { BrandMark } from '../components/Logo.jsx'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { Users, FolderTree, MapPinned, Megaphone, Flag, BarChart3, LogOut, ExternalLink, Lock, ShieldCheck } from 'lucide-react'
import { getSession, checkAdmin, signIn, signOut, isInitialized, initializeData } from './adminApi.js'
import { ProvidersList } from './ProvidersList.jsx'
import { ProviderForm } from './ProviderForm.jsx'
import { LocationsAdmin } from './LocationsAdmin.jsx'
import { CategoriesAdmin } from './CategoriesAdmin.jsx'
import { AdsAdmin } from './AdsAdmin.jsx'
import { ReportsAdmin } from './ReportsAdmin.jsx'
import { StatsAdmin } from './StatsAdmin.jsx'
import { ModeratorsAdmin } from './ModeratorsAdmin.jsx'
import { RoleContext } from './shared.jsx'
import { SITE, IS_DEMO } from '../config.js'
import { useAppState, useSeo } from '../lib/app-state.jsx'
import './admin.css'

function Login({ onDone, notAdmin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email, password)
      onDone()
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="brand">
          <BrandMark /> لوحة {SITE.name}
        </div>
        {IS_DEMO && <div className="ok-note">وضع تجريبي: اضغط "دخول" على طول من غير بيانات.</div>}
        {notAdmin && <div className="err-note">الحساب ده مش متضاف في الإدارة. لو إنت مشرف، كلّم صاحب الموقع يضيفك من صفحة «المشرفين».</div>}
        <label className="field">
          <span>الإيميل</span>
          <input className="input" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required={!IS_DEMO} autoComplete="username" />
        </label>
        <label className="field">
          <span>الباسورد</span>
          <input className="input" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required={!IS_DEMO} autoComplete="current-password" />
        </label>
        {error && <div className="err-note">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          <Lock size={18} /> دخول
        </button>
        <Link to="/" className="muted" style={{ textAlign: 'center', fontSize: 14 }}>
          رجوع للموقع
        </Link>
      </form>
    </div>
  )
}

// أول تشغيل على Firebase: قاعدة البيانات فاضية، فبنحط الفئات والأماكن بضغطة زرار
function Setup({ onDone }) {
  const { refreshCatalog } = useAppState()
  const [withDemo, setWithDemo] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const start = async () => {
    setBusy(true)
    setError('')
    try {
      await initializeData({ withDemo })
      await refreshCatalog()
      onDone()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand">
          <BrandMark /> أهلاً بيك في {SITE.name}
        </div>
        <p className="muted">
          قاعدة البيانات لسه فاضية. اضغط الزرار عشان نحط الفئات الـ 15 وخدماتها، والأماكن (الدقهلية ← مركز منية النصر ← البجلات).
        </p>
        <label className="toggle">
          <span>
            ومعاهم 18 مقدم خدمة تجريبي
            <small>بأرقام وهمية — عشان تشوف الشكل. امسحهم قبل الإطلاق.</small>
          </span>
          <input type="checkbox" checked={withDemo} onChange={(e) => setWithDemo(e.target.checked)} />
        </label>
        {error && <div className="err-note">{error}</div>}
        <button className="btn btn-primary btn-block" onClick={start} disabled={busy}>
          {busy ? 'بيتحط...' : 'ابدأ'}
        </button>
      </div>
    </div>
  )
}

// owner: الصفحة لصاحب الموقع بس (المشرف مش بيشوفها)
const LINKS = [
  { to: '/admin', label: 'مقدمي الخدمة', icon: Users, end: true },
  { to: '/admin/categories', label: 'الفئات والخدمات', icon: FolderTree, owner: true },
  { to: '/admin/locations', label: 'الأماكن', icon: MapPinned, owner: true },
  { to: '/admin/ads', label: 'الإعلانات', icon: Megaphone, owner: true },
  { to: '/admin/reports', label: 'البلاغات', icon: Flag },
  { to: '/admin/stats', label: 'الإحصائيات', icon: BarChart3, owner: true },
  { to: '/admin/moderators', label: 'المشرفين', icon: ShieldCheck, owner: true },
]

export default function AdminApp() {
  const [state, setState] = useState({ loading: true, session: null, role: null, ready: true })
  useSeo({ title: `لوحة التحكم | ${SITE.name}` })

  const refresh = async () => {
    const session = await getSession()
    const role = session ? await checkAdmin().catch(() => null) : null
    // أول تشغيل (حط الفئات والأماكن) لصاحب الموقع بس
    const ready = role === 'owner' ? await isInitialized().catch(() => true) : true
    setState({ loading: false, session, role, ready })
  }
  useEffect(() => {
    refresh()
  }, [])

  if (state.loading) return <div className="login-wrap muted">جاري التحميل...</div>
  if (!state.session || !state.role) return <Login onDone={refresh} notAdmin={!!state.session && !state.role} />
  if (!state.ready) return <Setup onDone={refresh} />

  const logout = async () => {
    await signOut()
    refresh()
  }

  const owner = state.role === 'owner'
  const links = LINKS.filter((l) => owner || !l.owner)
  const home = <ProvidersList onLogout={logout} />
  const ownerOnly = (el) => (owner ? el : home)

  return (
    <RoleContext.Provider value={state.role}>
    <div className="admin">
      <aside className="admin-side">
        <Link to="/admin" className="brand">
          <BrandMark /> لوحة {SITE.name}
        </Link>
        {links.map(({ to, label, icon: Icon, end, soon }) => (
          <NavLink key={to} to={to} end={end} className={`admin-link ${soon ? 'soon' : ''}`}>
            <Icon size={20} /> {label} {soon && <small>قريباً</small>}
          </NavLink>
        ))}
        <div className="spacer" />
        <div className="admin-who">
          <span dir="ltr">{state.session.email}</span>
          <small>{owner ? 'صاحب الموقع' : 'مشرف'}</small>
        </div>
        <a href={import.meta.env.BASE_URL} target="_blank" rel="noopener" className="admin-link">
          <ExternalLink size={20} /> افتح الموقع
        </a>
        <button className="admin-link" onClick={logout}>
          <LogOut size={20} /> خروج
        </button>
      </aside>
      <div className="admin-main">
        {IS_DEMO && <div className="demo-bar">وضع تجريبي — التعديلات بتتحفظ في المتصفح ده بس</div>}
        <nav className="admin-mnav" aria-label="أقسام اللوحة">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="chip">
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>
        <Routes>
          <Route index element={home} />
          <Route path="providers/new" element={<ProviderForm />} />
          <Route path="providers/:id" element={<ProviderForm />} />
          <Route path="categories" element={ownerOnly(<CategoriesAdmin />)} />
          <Route path="locations" element={ownerOnly(<LocationsAdmin />)} />
          <Route path="ads" element={ownerOnly(<AdsAdmin />)} />
          <Route path="reports" element={<ReportsAdmin />} />
          <Route path="stats" element={ownerOnly(<StatsAdmin />)} />
          <Route path="moderators" element={ownerOnly(<ModeratorsAdmin />)} />
          <Route path="*" element={home} />
        </Routes>
      </div>
    </div>
    </RoleContext.Provider>
  )
}
