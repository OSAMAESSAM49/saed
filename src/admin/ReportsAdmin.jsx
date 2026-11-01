import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flag, Check, X, Pause, Phone } from 'lucide-react'
import { useAsync } from '../lib/app-state.jsx'
import { arNum } from '../lib/arabic.js'
import { normalizeEgPhone, telLink } from '../lib/phone.js'
import { Toast, useToast, Empty } from '../components/ui.jsx'
import { listReports, setReportStatus, listProviders, setProviderStatus } from './adminApi.js'
import { AdminTop } from './shared.jsx'

const STATUS = { new: 'جديد', reviewed: 'اتراجع', dismissed: 'اتجاهل' }
const CLS = { new: 'pending', reviewed: 'active', dismissed: 'suspended' }

export function ReportsAdmin() {
  const [reload, setReload] = useState(0)
  const reports = useAsync(listReports, [reload])
  const providers = useAsync(listProviders, [reload])
  const [filter, setFilter] = useState('new')
  const [toast, setToast, clearToast] = useToast()

  const byId = useMemo(() => new Map((providers.data || []).map((p) => [p.id, p])), [providers.data])
  const all = reports.data || []
  // عدد البلاغات على كل مقدم خدمة (عشان تاخد بالك من المتكرر)
  const countFor = useMemo(() => {
    const m = new Map()
    for (const r of all) m.set(r.provider_id, (m.get(r.provider_id) || 0) + 1)
    return m
  }, [all])
  const list = filter ? all.filter((r) => r.status === filter) : all

  const act = async (fn, msg) => {
    try {
      await fn()
      setToast(msg)
      setReload((n) => n + 1)
    } catch (e) {
      setToast(e.message)
    }
  }

  return (
    <>
      <AdminTop title="البلاغات" />
      <div className="admin-body">
        <div className="chips" style={{ marginBottom: 12 }}>
          {[['new', 'الجديدة'], ['', 'الكل'], ['reviewed', 'اتراجعت'], ['dismissed', 'اتجاهلت']].map(([k, v]) => (
            <button key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {v} ({arNum(k ? all.filter((r) => r.status === k).length : all.length)})
            </button>
          ))}
        </div>

        {reports.loading ? (
          <div className="skeleton" style={{ height: 240 }} />
        ) : reports.error ? (
          <div className="err-note">{reports.error.message}</div>
        ) : !list.length ? (
          <Empty icon={Flag} title="مفيش بلاغات هنا" text="لما حد يبلّغ عن مشكلة من صفحة مقدم خدمة، هتلاقيها هنا." />
        ) : (
          <div className="a-list">
            {list.map((r) => {
              const p = byId.get(r.provider_id)
              const contact = r.contact && normalizeEgPhone(r.contact)
              const n = countFor.get(r.provider_id) || 0
              return (
                <div key={r.id} className="report-card">
                  <div className="row" style={{ flexWrap: 'wrap' }}>
                    <span className={`status-tag ${CLS[r.status]}`}>{STATUS[r.status]}</span>
                    <b className="spacer">{r.reason}</b>
                    <small className="muted">{new Date(r.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</small>
                  </div>
                  {r.details && <p className="bio" style={{ fontSize: 15, marginTop: 8 }}>{r.details}</p>}
                  <div className="row" style={{ marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
                    <span className="muted spacer" style={{ fontSize: 14 }}>
                      على:{' '}
                      {p ? (
                        <Link to={`/admin/providers/${p.id}`} style={{ textDecoration: 'underline', color: 'var(--ink)' }}>
                          {p.name}
                        </Link>
                      ) : (
                        'مقدم خدمة اتمسح'
                      )}
                      {n > 1 && <span className="status-tag suspended" style={{ marginInlineStart: 6 }}>{arNum(n)} بلاغات</span>}
                    </span>
                    {contact && (
                      <a className="chip soft" href={telLink(contact)}>
                        <Phone size={16} /> كلّم المبلّغ
                      </a>
                    )}
                    {p?.status === 'active' && (
                      <button className="chip soft" onClick={() => act(() => setProviderStatus(p.id, 'suspended'), `${p.name} اتوقف`)}>
                        <Pause size={16} /> أوقف مقدم الخدمة
                      </button>
                    )}
                    {r.status !== 'dismissed' && (
                      <button className="chip soft" onClick={() => act(() => setReportStatus(r.id, 'dismissed'), 'اتجاهل')}>
                        <X size={16} /> تجاهل
                      </button>
                    )}
                    {r.status !== 'reviewed' && (
                      <button className="chip" aria-pressed="true" onClick={() => act(() => setReportStatus(r.id, 'reviewed'), 'اتعلّم إنه اتراجع')}>
                        <Check size={16} /> اتراجع
                      </button>
                    )}
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
