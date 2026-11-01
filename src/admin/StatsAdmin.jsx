import { useMemo, useState } from 'react'
import { Copy } from 'lucide-react'
import { useAsync, useCatalog } from '../lib/app-state.jsx'
import { arNum } from '../lib/arabic.js'
import { Toast, useToast } from '../components/ui.jsx'
import { getAdminStats, listProviders, listAds } from './adminApi.js'
import { AdminTop } from './shared.jsx'
import { SITE } from '../config.js'

const PERIODS = [
  [7, 'آخر أسبوع'],
  [30, 'آخر شهر'],
  [90, 'آخر 3 شهور'],
]

const dayLabel = (d) => new Date(d + 'T12:00:00').toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })

// عمود واحد لكل يوم (الأيام الفاضية بصفر) + تولتيب لما تقف على العمود
function DailyBars({ title, days, field }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...days.map((d) => d[field]))
  const total = days.reduce((s, d) => s + d[field], 0)
  const h = hover != null ? days[hover] : null

  return (
    <section className="f-card">
      <div className="row">
        <h2 className="spacer">{title}</h2>
        <b style={{ fontSize: 22, fontWeight: 500 }}>{arNum(total)}</b>
      </div>
      <div className="bars-wrap">
        <span className="bars-max">{arNum(max)}</span>
        <div className="bars" role="img" aria-label={`${title}: ${arNum(total)} في الفترة دي`} onMouseLeave={() => setHover(null)}>
          {days.map((d, i) => (
            <button
              key={d.day}
              type="button"
              className={`bar-hit ${hover === i ? 'on' : ''}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${dayLabel(d.day)}: ${arNum(d[field])}`}
            >
              <span className="bar" style={{ height: d[field] ? `max(3px, ${(d[field] / max) * 100}%)` : 0 }} />
            </button>
          ))}
        </div>
        {h && (
          <div className="bar-tip" style={{ insetInlineStart: `${((hover + 0.5) / days.length) * 100}%` }}>
            {dayLabel(h.day)} · <b>{arNum(h[field])}</b>
          </div>
        )}
      </div>
      <div className="row muted" style={{ fontSize: 13, justifyContent: 'space-between' }}>
        <span>{dayLabel(days[0].day)}</span>
        <span>{dayLabel(days[days.length - 1].day)}</span>
      </div>
    </section>
  )
}

function Table({ title, hint, cols, rows }) {
  return (
    <section className="f-card">
      <div>
        <h2>{title}</h2>
        {hint && <small className="muted">{hint}</small>}
      </div>
      {!rows.length ? (
        <p className="muted">مفيش بيانات في الفترة دي.</p>
      ) : (
        <div className="table-scroll">
          <table className="stats-table">
            <thead>
              <tr>
                {cols.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {r.map((cell, j) => (
                    <td key={j}>{typeof cell === 'number' ? arNum(cell) : cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function StatsAdmin() {
  const catalog = useCatalog()
  const [days, setDays] = useState(30)
  const stats = useAsync(() => getAdminStats(days), [days])
  const providers = useAsync(listProviders, [])
  const ads = useAsync(listAds, [])
  const [toast, setToast, clearToast] = useToast()

  const s = stats.data
  const t = s?.totals || {}
  const nameOf = useMemo(() => new Map((providers.data || []).map((p) => [p.id, p.name])), [providers.data])
  const adName = useMemo(() => new Map((ads.data || []).map((a) => [a.id, a.title])), [ads.data])

  // كل أيام الفترة، حتى اللي مفيهاش حاجة
  const daily = useMemo(() => {
    const map = new Map((s?.daily || []).map((d) => [d.day, d]))
    return Array.from({ length: days }, (_, i) => {
      const day = new Date(Date.now() - (days - 1 - i) * 864e5).toISOString().slice(0, 10)
      return { day, views: map.get(day)?.views || 0, contacts: map.get(day)?.contacts || 0 }
    })
  }, [s, days])

  const report = () => {
    const period = PERIODS.find(([d]) => d === days)[1]
    const lines = [
      `تقرير منصة ${SITE.name} — ${period}`,
      `زيارات الموقع: ${arNum(t.page_view || 0)}`,
      `ناس كلّمت مقدمي خدمة: ${arNum((t.whatsapp || 0) + (t.call || 0))}`,
      '',
      'الزيارات حسب البلد:',
      ...(s?.locations || []).map((l) => `• ${catalog?.locLabel(l.id) || '—'}: ${arNum(l.views)} زيارة`),
    ]
    navigator.clipboard?.writeText(lines.join('\n')).then(() => setToast('التقرير اتنسخ — ابعته للمعلن'))
  }

  const tiles = [
    ['زيارات الموقع', t.page_view, true],
    ['فتحوا صفحة مقدم خدمة', t.profile_view],
    ['ضغطات واتساب', t.whatsapp],
    ['اتصالات', t.call],
    ['مشاركات', t.share],
    ['ضغطات على إعلانات', t.ad_click],
  ]

  return (
    <>
      <AdminTop title="الإحصائيات">
        <button className="btn btn-sm" onClick={report} disabled={!s}>
          <Copy size={16} /> تقرير للمعلن
        </button>
      </AdminTop>
      <div className="admin-body stack" style={{ gap: 14 }}>
        <div className="chips">
          {PERIODS.map(([d, label]) => (
            <button key={d} className="chip" aria-pressed={days === d} onClick={() => setDays(d)}>
              {label}
            </button>
          ))}
        </div>

        {stats.loading ? (
          <div className="skeleton" style={{ height: 300 }} />
        ) : stats.error ? (
          <div className="err-note">{stats.error.message}</div>
        ) : (
          <>
            <div className="stat-row" style={{ margin: 0 }}>
              {tiles.map(([label, value, lime]) => (
                <div key={label} className={`stat ${lime ? 'lime' : ''}`}>
                  <b>{arNum(value || 0)}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="f-2">
              <DailyBars title="الزيارات كل يوم" days={daily} field="views" />
              <DailyBars title="واتساب واتصال كل يوم" days={daily} field="contacts" />
            </div>

            <Table
              title="أكتر مقدمي الخدمة اتطلبوا"
              cols={['مقدم الخدمة', 'واتساب', 'اتصال', 'فتحوا صفحته']}
              rows={(s.providers || []).map((p) => [nameOf.get(p.id) || `#${p.id}`, p.whatsapp, p.call, p.views])}
            />
            <div className="f-2">
              <Table
                title="الزوار حسب البلد"
                hint="البلد اللي الزائر اختارها — دي الأرقام اللي بتوريها للمعلن"
                cols={['البلد', 'زيارات', 'تواصل']}
                rows={(s.locations || []).map((l) => [catalog?.locLabel(l.id) || '—', l.views, l.contacts])}
              />
              <Table
                title="الفئات"
                cols={['الفئة', 'تواصل', 'فتحوا صفحات']}
                rows={(s.categories || []).map((c) => [catalog?.catById.get(c.id)?.name_ar || '—', c.contacts, c.views])}
              />
            </div>
            <Table
              title="الإعلانات"
              cols={['الإعلان', 'ضغطات']}
              rows={(s.ads || []).map((a) => [adName.get(a.id) || `#${a.id}`, a.clicks])}
            />
          </>
        )}
      </div>
      <Toast message={toast} onDone={clearToast} />
    </>
  )
}
