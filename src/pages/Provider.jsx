import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight, Share2, Flag, MapPinned, CalendarDays, Banknote, Sparkles, MapPin, UserRound, UserX, Check, CalendarCheck,
} from 'lucide-react'
import { useAppState, useAsync, useSeo } from '../lib/app-state.jsx'
import { getProvider, logEvent, submitReport } from '../lib/api.js'
import { DAY_SHORT, WEEK_ORDER, formatDays, formatHours, isAvailableNow } from '../lib/schedule.js'
import { formatPhone } from '../lib/phone.js'
import { Avatar, Verified, Sheet, Empty, Toast, useToast } from '../components/ui.jsx'
import { ContactButtons } from '../components/ContactButtons.jsx'
import { AdSlot } from '../components/AdSlot.jsx'
import { SITE } from '../config.js'

const REASONS = ['الرقم غلط أو مقفول', 'اتعامل معايا بشكل وحش', 'الخدمة مكنتش زي ما هو قايل', 'السعر مختلف جداً', 'حاجة تانية']

function ReportSheet({ provider, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [contact, setContact] = useState('')
  const [website, setWebsite] = useState('')
  const [busy, setBusy] = useState(false)

  const send = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const ok = await submitReport({ providerId: provider.id, reason, details, contact, website })
      onDone(ok ? 'شكراً، البلاغ وصل وهنراجعه' : 'بعتّ بلاغات كتير، جرّب بعدين')
    } catch {
      onDone('النت فصل، جرّب تاني')
    }
    onClose()
  }

  return (
    <Sheet title="إبلاغ عن مشكلة" onClose={onClose}>
      <form className="stack" onSubmit={send}>
        <p className="muted">البلاغ بيوصل للإدارة بس، ومحدش تاني بيشوفه.</p>
        <div className="chips wrap">
          {REASONS.map((r) => (
            <button type="button" key={r} className="chip soft" aria-pressed={reason === r} onClick={() => setReason(r)}>
              {r}
            </button>
          ))}
        </div>
        <label className="field">
          <span>احكيلنا اللي حصل (اختياري)</span>
          <textarea className="textarea" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} />
        </label>
        <label className="field">
          <span>رقمك لو حابب نكلمك (اختياري)</span>
          <input className="input" dir="ltr" inputMode="tel" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={20} />
        </label>
        {/* خانة مخفية للبوتات */}
        <input className="sr-only" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} aria-hidden="true" />
        <button className="btn btn-primary btn-block" disabled={!reason || busy}>
          ابعت البلاغ
        </button>
      </form>
    </Sheet>
  )
}

export default function Provider() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { catalog, locationId } = useAppState()
  const { data: p, loading, error } = useAsync(() => getProvider(slug), [slug])
  const [reporting, setReporting] = useState(false)
  const [toast, setToast, clearToast] = useToast()

  const services = p ? p.service_ids.map((id) => catalog?.subById.get(id)).filter(Boolean) : []
  const main = services[0]
  const category = main && catalog?.catById.get(main.category_id)
  const home = p && catalog?.locLabel(p.home_location_id)
  const areas = p ? p.area_ids.map((id) => catalog?.locLabel(id)).filter(Boolean) : []
  const available = p && isAvailableNow(p.schedule)

  useSeo({
    title: p ? `${p.name} — ${main?.name_ar || ''}${home ? ` في ${home}` : ''} | ${SITE.name}` : SITE.name,
    description: p ? (p.bio || '').slice(0, 155) : '',
  })

  useEffect(() => {
    if (p) logEvent('profile_view', { provider: p.id, category: category?.id, location: locationId })
  }, [p?.id])

  if (loading) {
    return (
      <div className="container profile">
        <div className="skeleton" style={{ height: 320 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    )
  }
  if (error || !p) {
    return (
      <div className="container" style={{ marginTop: 24 }}>
        <Empty icon={UserX} title={error ? 'النت ضعيف شوية' : 'الصفحة دي مش موجودة'} text={error ? 'جرّب تاني كمان شوية.' : 'ممكن مقدم الخدمة يكون وقّف حسابه مؤقتاً.'}>
          <Link to="/" className="btn btn-primary">
            ارجع للرئيسية
          </Link>
        </Empty>
      </div>
    )
  }

  const track = (kind) => logEvent(kind, { provider: p.id, category: category?.id, location: locationId })
  const share = () => {
    const url = location.href
    const text = `${p.name} — ${main?.name_ar || ''}${home ? ` في ${home}` : ''}\nعلى منصة ${SITE.name}`
    track('share')
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank')
  }

  return (
    <div className="container">
      <div className="row" style={{ marginTop: 6 }}>
        <button className="icon-btn" onClick={() => (history.length > 1 ? navigate(-1) : navigate('/'))} aria-label="رجوع">
          <ArrowRight size={22} />
        </button>
        {category && (
          <Link to={`/c/${category.slug}`} className="chip">
            {category.name_ar}
          </Link>
        )}
      </div>

      <div className="profile">
        <div className="stack-cards">
          {/* الراس: الصورة والاسم وأزرار التواصل الدايرية زي المرجع */}
          <section className="profile-head">
            <div className="profile-top">
              <Avatar provider={p} alt={`صورة ${p.name}`} />
              <div className="spacer">
                <h1>
                  {p.name} {p.is_verified && <Verified size={26} />}
                </h1>
                <div className="p-service">
                  {main?.name_ar}
                  {home && ` · ${home}`}
                </div>
                <div className="tags">
                  <span className={`tag ${available ? 'lime' : ''}`}>
                    <i className={`status-dot ${available ? 'on' : ''}`} /> {available ? 'متاح دلوقتي' : 'مش متاح دلوقتي'}
                  </span>
                  {p.is_verified && <span className="tag featured">موثّق</span>}
                  {p.women_service && <span className="tag lavender">خدمة نسائية</span>}
                  {p.is_featured && <span className="tag coral">مميز</span>}
                </div>
              </div>
            </div>

            <div className="action-row">
              <ContactButtons provider={p} serviceName={main?.name_ar} category={category} size="lg" />
            </div>
            <div className="row" style={{ marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
              <span className="phone-line spacer" style={{ margin: 0 }}>
                {p.phone ? <span dir="ltr">{formatPhone(p.phone)}</span> : 'التواصل بالواتساب بس'}
              </span>
              <button className="chip soft" onClick={share}>
                <Share2 size={17} /> شارك
              </button>
              <button className="chip soft" onClick={() => setReporting(true)}>
                <Flag size={17} /> إبلاغ
              </button>
            </div>
          </section>

          {p.bio && (
            <section className="card">
              <h2>
                <UserRound size={20} /> نبذة
              </h2>
              <p className="bio">{p.bio}</p>
            </section>
          )}

          <section className="card">
            <h2>
              <MapPinned size={20} /> الأماكن والسعر
            </h2>
            <div className="timeline">
              <div className="t-row" data-tone="sky">
                <span className="ic"><MapPin size={20} /></span>
                <div className="t-box">
                  <small>ساكن في</small>
                  <b>{home || '—'}</b>
                </div>
              </div>
              {areas.length > 0 && (
                <div className="t-row" data-tone="lavender">
                  <span className="ic"><MapPinned size={20} /></span>
                  <div className="t-box">
                    <small>بيروح</small>
                    <b>{areas.join('، ')}</b>
                  </div>
                </div>
              )}
              {p.price_note && (
                <div className="t-row" data-tone="lime">
                  <span className="ic"><Banknote size={20} /></span>
                  <div className="t-box">
                    <small>عن السعر</small>
                    <b>{p.price_note}</b>
                  </div>
                </div>
              )}
              <div className="t-row" data-tone="dark">
                <span className="ic"><CalendarCheck size={20} /></span>
                <div className="t-box">
                  <small>على المنصة من</small>
                  <b>{new Date(p.joined_at).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</b>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="profile-aside stack-cards">
          <section className="card lavender">
            <h2>
              <Sparkles size={20} /> الخدمات
            </h2>
            <div className="check-list">
              {services.map((s) => {
                const c = catalog.catById.get(s.category_id)
                return (
                  <Link key={s.id} to={`/c/${c.slug}?sub=${s.slug}`} className="check-row">
                    <i>
                      <Check size={16} strokeWidth={2.5} />
                    </i>
                    {s.name_ar}
                  </Link>
                )
              })}
            </div>
          </section>

          <section className="card lime">
            <h2>
              <CalendarDays size={20} /> المواعيد
            </h2>
            <div style={{ fontWeight: 500 }}>{formatDays(p.schedule?.days)}</div>
            <div className="days" aria-hidden="true">
              {WEEK_ORDER.map((d) => (
                <span key={d} className={`day ${p.schedule?.days?.includes(d) ? 'on' : ''}`}>
                  {DAY_SHORT[d]}
                </span>
              ))}
            </div>
            <div className="hours">{formatHours(p.schedule)}</div>
          </section>

          <AdSlot placement="provider_banner" />

          <p className="muted" style={{ fontSize: 14, paddingInline: 6 }}>
            {SITE.name} بتوصّلك بمقدم الخدمة بس. اتفق على كل حاجة قبل ما يبدأ الشغل.{' '}
            <Link to="/terms" style={{ textDecoration: 'underline' }}>الشروط</Link>
          </p>
        </aside>
      </div>

      <div className="sticky-contact">
        <ContactButtons provider={p} serviceName={main?.name_ar} category={category} size="lg" />
      </div>

      {reporting && <ReportSheet provider={p} onClose={() => setReporting(false)} onDone={setToast} />}
      <Toast message={toast} onDone={clearToast} />
    </div>
  )
}
