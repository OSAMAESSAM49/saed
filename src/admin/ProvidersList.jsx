import { useMemo, useState } from 'react'
import { BrandMark } from '../components/Logo.jsx'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Pause, Play, ExternalLink, Search, LogOut, Users } from 'lucide-react'
import { useAsync, useCatalog } from '../lib/app-state.jsx'
import { normalizeAr, arNum } from '../lib/arabic.js'
import { Avatar, Verified, Empty, Toast, useToast } from '../components/ui.jsx'
import { listProviders, setProviderStatus, deleteProvider } from './adminApi.js'
import { SITE } from '../config.js'
import { useIsOwner } from './shared.jsx'

const STATUS = { active: 'نشط', pending: 'مراجعة', suspended: 'موقوف' }

export function ProvidersList({ onLogout }) {
  const catalog = useCatalog()
  const isOwner = useIsOwner()
  const [reload, setReload] = useState(0)
  const { data, loading, error } = useAsync(listProviders, [reload])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [toast, setToast, clearToast] = useToast()

  const all = data || []
  const counts = useMemo(
    () => all.reduce((acc, p) => ((acc[p.status] = (acc[p.status] || 0) + 1), acc), {}),
    [all],
  )
  const list = useMemo(() => {
    const nq = normalizeAr(q)
    return all.filter((p) => {
      if (status && p.status !== status) return false
      if (!nq) return true
      const svc = p.service_ids.map((id) => catalog?.subById.get(id)?.name_ar).join(' ')
      return normalizeAr(`${p.name} ${p.phone} ${p.whatsapp} ${svc}`).includes(nq)
    })
  }, [all, q, status, catalog])

  const toggle = async (p) => {
    const next = p.status === 'active' ? 'suspended' : 'active'
    try {
      await setProviderStatus(p.id, next)
      setToast(next === 'active' ? `${p.name} بقى ظاهر على الموقع` : `${p.name} اتوقف واختفى من الموقع`)
      setReload((n) => n + 1)
    } catch (e) {
      setToast(e.message)
    }
  }

  // مقدمي الخدمة التجريبيين (أرقامهم 0100000xxxx)
  const demoOnes = all.filter((p) => /^0100000\d{4}$/.test(p.phone || ''))
  const removeDemo = async () => {
    if (!confirm(`هتمسح ${demoOnes.length} مقدم خدمة تجريبي نهائياً. متأكد؟`)) return
    try {
      for (const p of demoOnes) await deleteProvider(p.id)
      setToast('البيانات التجريبية اتمسحت')
      setReload((n) => n + 1)
    } catch (e) {
      setToast(e.message)
    }
  }

  return (
    <>
      <div className="admin-top">
        <Link to="/admin" className="brand">
          <BrandMark />
        </Link>
        <h1 className="admin-title spacer">مقدمي الخدمة</h1>
        <Link to="/admin/providers/new" className="btn btn-primary">
          <Plus size={20} /> إضافة
        </Link>
        <button className="icon-btn" onClick={onLogout} aria-label="خروج">
          <LogOut size={20} />
        </button>
      </div>
      <div className="admin-body">
        <div className="stat-row">
          <div className="stat lime">
            <b>{arNum(counts.active || 0)}</b>
            <span>ظاهرين على {SITE.name}</span>
          </div>
          <div className="stat">
            <b>{arNum(counts.pending || 0)}</b>
            <span>مستنيين مراجعة</span>
          </div>
          <div className="stat">
            <b>{arNum(counts.suspended || 0)}</b>
            <span>موقوفين</span>
          </div>
          <div className="stat">
            <b>{arNum(all.filter((p) => p.is_verified).length)}</b>
            <span>موثّقين</span>
          </div>
        </div>

        {isOwner && demoOnes.length > 0 && (
          <div className="ok-note row" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
            <span className="spacer">فيه {arNum(demoOnes.length)} مقدم خدمة تجريبي بأرقام وهمية. امسحهم قبل ما تعلن عن الموقع.</span>
            <button className="btn btn-sm btn-primary" onClick={removeDemo}>
              امسح التجريبيين
            </button>
          </div>
        )}

        <label className="search-box" style={{ height: 54, boxShadow: 'none' }}>
          <Search size={20} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر بالاسم أو الرقم أو الخدمة" />
        </label>
        <div className="chips" style={{ margin: '12px 0' }}>
          <button className="chip" aria-pressed={!status} onClick={() => setStatus('')}>
            الكل ({arNum(all.length)})
          </button>
          {Object.entries(STATUS).map(([k, v]) => (
            <button key={k} className="chip" aria-pressed={status === k} onClick={() => setStatus(k)}>
              {v} ({arNum(counts[k] || 0)})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 300 }} />
        ) : error ? (
          <div className="err-note">{error.message}</div>
        ) : !list.length ? (
          <Empty icon={Users} title="مفيش نتايج" text="جرّب كلمة تانية أو ضيف مقدم خدمة جديد." />
        ) : (
          <div className="a-list">
            {list.map((p) => {
              const svc = catalog?.subById.get(p.service_ids[0])?.name_ar
              return (
                <div key={p.id} className="a-row">
                  <Avatar provider={p} />
                  <div className="a-row-info">
                    <b>
                      {p.name} {p.is_verified && <Verified size={16} />}
                      <span className={`status-tag ${p.status}`}>{STATUS[p.status]}</span>
                    </b>
                    <small>
                      {svc} · {catalog?.locLabel(p.home_location_id)} · <span dir="ltr">{p.whatsapp || p.phone}</span>
                    </small>
                  </div>
                  <div className="a-row-actions">
                    {p.status === 'active' && (
                      <a className="icon-btn ext" href={`${import.meta.env.BASE_URL}p/${p.slug}`} target="_blank" rel="noopener" aria-label="افتح الصفحة">
                        <ExternalLink size={18} />
                      </a>
                    )}
                    <button className="icon-btn" onClick={() => toggle(p)} aria-label={p.status === 'active' ? 'إيقاف' : 'تفعيل'} title={p.status === 'active' ? 'إيقاف' : 'تفعيل'}>
                      {p.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <Link className="icon-btn" to={`/admin/providers/${p.id}`} aria-label="تعديل" style={{ background: 'var(--primary)', color: 'var(--primary-ink)', borderColor: 'transparent' }}>
                      <Pencil size={18} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Toast message={toast} onDone={clearToast} />
    </>
  )
}
