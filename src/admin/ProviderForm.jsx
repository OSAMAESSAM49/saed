import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight, ClipboardPaste, Wand2, ImagePlus, UserRound, Phone, Sparkles, MapPinned, CalendarDays, FileText,
  ShieldCheck, Star, X, Save, Search,
} from 'lucide-react'
import { useCatalog } from '../lib/app-state.jsx'
import { normalizeAr } from '../lib/arabic.js'
import { normalizeEgPhone } from '../lib/phone.js'
import { DAY_NAMES, WEEK_ORDER } from '../lib/schedule.js'
import { compressImage, kb } from '../lib/image.js'
import { parseJoinMessage } from '../lib/template.js'
import { CategoryIcon } from '../lib/icons.jsx'
import { Avatar } from '../components/ui.jsx'
import { ProviderCard } from '../components/ProviderCard.jsx'
import { getProviderById, saveProvider, slugTaken, deleteProvider } from './adminApi.js'
import { useIsOwner } from './shared.jsx'

const today = () => new Date().toISOString().slice(0, 10)
const randomSuffix = () => Math.random().toString(36).slice(2, 6)

const EMPTY = {
  id: null, slug: '', name: '', photo_url: '', phone: '', whatsapp: '', show_phone: true, gender: 'male',
  women_service: false, bio: '', home_location_id: '', price_note: '', is_verified: true, status: 'active',
  is_featured: false, featured_until: '', joined_at: today(), service_ids: [], area_ids: [],
  schedule: { days: [6, 0, 1, 2, 3, 4], from: '09:00', to: '21:00' },
  private: { age: '', notes: '', raw_message: '' },
}

function Toggle({ checked, onChange, label, hint }) {
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

export function ProviderForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const catalog = useCatalog()
  const isOwner = useIsOwner()
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(!!id)
  const [paste, setPaste] = useState('')
  const [parseResult, setParseResult] = useState(null)
  const [photo, setPhoto] = useState(null) // { blob, preview, before, after }
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [svcQuery, setSvcQuery] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const slugEdited = useRef(!!id)
  const suffix = useRef(randomSuffix())

  useEffect(() => {
    if (!id) return
    getProviderById(id).then((p) => {
      if (p) setForm({ ...EMPTY, ...p, private: { ...EMPTY.private, ...(p.private || {}) }, featured_until: p.featured_until || '' })
      setLoading(false)
    })
  }, [id])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const setSchedule = (patch) => setForm((f) => ({ ...f, schedule: { ...f.schedule, ...patch } }))
  const setPrivate = (patch) => setForm((f) => ({ ...f, private: { ...f.private, ...patch } }))

  // رابط الصفحة بيتعمل أوتوماتيك من الخدمة الأساسية (لحد ما الأدمن يعدّله بإيده)
  useEffect(() => {
    if (slugEdited.current || !catalog) return
    const base = catalog.subById.get(form.service_ids[0])?.slug || 'provider'
    set({ slug: `${base}-${suffix.current}` })
  }, [form.service_ids[0], catalog])

  if (!catalog || loading) return <div className="admin-body"><div className="skeleton" style={{ height: 400 }} /></div>

  // ---------- لصق رسالة الواتساب ----------
  const fill = () => {
    const { fields, notes } = parseJoinMessage(paste, catalog)
    setForm((f) => ({
      ...f,
      ...fields,
      schedule: { ...f.schedule, ...(fields.schedule || {}) },
      women_service: fields.gender === 'female' ? true : f.women_service,
      private: { ...f.private, age: fields.age ?? f.private.age, raw_message: paste },
    }))
    const filled = Object.keys(fields).length
    setParseResult({ filled, notes })
  }

  // ---------- الصورة ----------
  const pickPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      // 480×600 وحوالي 100KB: كفاية لأي موبايل، وخفيفة على Firestore
      const res = await compressImage(file, { width: 480, height: 600, maxBytes: 100 * 1024 })
      setPhotoRemoved(false)
      setPhoto({ ...res, preview: URL.createObjectURL(res.blob) })
    } catch (err) {
      setError(err.message)
    }
    e.target.value = ''
  }

  // ---------- الخدمات ----------
  const toggleService = (sid) =>
    set({ service_ids: form.service_ids.includes(sid) ? form.service_ids.filter((x) => x !== sid) : [...form.service_ids, sid] })
  const makePrimary = (sid) => set({ service_ids: [sid, ...form.service_ids.filter((x) => x !== sid)] })
  const nq = normalizeAr(svcQuery)
  const svcMatch = (s) => !nq || normalizeAr(s.name_ar).includes(nq) || s.keywords.some((k) => normalizeAr(k).includes(nq))

  const toggleArea = (lid) =>
    set({ area_ids: form.area_ids.includes(lid) ? form.area_ids.filter((x) => x !== lid) : [...form.area_ids, lid] })
  const toggleDay = (d) =>
    setSchedule({ days: form.schedule.days.includes(d) ? form.schedule.days.filter((x) => x !== d) : [...form.schedule.days, d].sort() })
  const allDay = form.schedule.from === '00:00' && form.schedule.to === '23:59'

  // ---------- الحفظ ----------
  const save = async () => {
    setError('')
    const phone = form.phone ? normalizeEgPhone(form.phone) : ''
    const whatsapp = form.whatsapp ? normalizeEgPhone(form.whatsapp) : ''
    const problems = []
    if (!form.name.trim()) problems.push('الاسم')
    if (!form.service_ids.length) problems.push('خدمة واحدة على الأقل')
    if (!form.home_location_id) problems.push('مكان السكن')
    if (!phone && !whatsapp) problems.push('رقم واتساب أو اتصال صحيح')
    if (form.phone && !phone) problems.push('رقم الاتصال مكتوب غلط')
    if (form.whatsapp && !whatsapp) problems.push('رقم الواتساب مكتوب غلط')
    if (!/^[a-z0-9-]{3,60}$/.test(form.slug)) problems.push('رابط الصفحة (حروف إنجليزي صغيرة وأرقام و - بس)')
    if (problems.length) return setError('ناقص أو غلط: ' + problems.join('، '))

    setSaving(true)
    try {
      if (await slugTaken(form.slug, form.id)) throw new Error('رابط الصفحة ده مستخدم لحد تاني، غيّره')
      await saveProvider(
        {
        ...form,
        phone: phone || whatsapp,
        whatsapp: whatsapp || phone,
        home_location_id: Number(form.home_location_id),
        featured_until: form.is_featured ? form.featured_until || null : null,
        },
        photo ? { blob: photo.blob } : photoRemoved ? { remove: true } : null,
      )
      navigate('/admin')
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  const hasPhoto = !!(photo || (!photoRemoved && (form.photo_url || form.photo_key)))
  const preview = {
    ...form,
    id: form.id || 0,
    ...(photo && { photo_url: photo.preview }),
    ...(photoRemoved && !photo && { photo_url: null, photo_key: null }),
    phone: form.show_phone ? form.phone || form.whatsapp : null,
  }
  const centers = catalog.locations.filter((l) => l.type === 'center')
  const governorates = catalog.locations.filter((l) => l.type === 'governorate')

  return (
    <>
      <div className="admin-top">
        <Link to="/admin" className="icon-btn" aria-label="رجوع">
          <ArrowRight size={20} />
        </Link>
        <h1 className="admin-title spacer">{id ? `تعديل: ${form.name}` : 'مقدم خدمة جديد'}</h1>
      </div>

      <div className="admin-body form-grid">
        <div className="stack" style={{ gap: 14 }}>
          {/* 1) لصق رسالة الواتساب */}
          <section className="f-card paste-card">
            <h2>
              <ClipboardPaste size={20} /> ألصق رسالة الواتساب
            </h2>
            <textarea
              className="textarea"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={'الاسم: ...\nالخدمة اللي بقدمها: ...\nرقم الواتساب: ...'}
            />
            <button type="button" className="btn btn-primary" onClick={fill} disabled={!paste.trim()}>
              <Wand2 size={20} /> املا الفورم من الرسالة
            </button>
            {parseResult && (
              <>
                {parseResult.filled > 0 && (
                  <div className="ok-note">
                    اتملت {parseResult.filled} {parseResult.filled > 10 ? 'خانة' : 'خانات'}. راجعهم تحت قبل الحفظ.
                  </div>
                )}
                {parseResult.notes.length > 0 && (
                  <ul className="notes">
                    {parseResult.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>

          {/* 2) الصورة والبيانات الأساسية */}
          <section className="f-card">
            <h2>
              <UserRound size={20} /> البيانات الأساسية
            </h2>
            <div className="photo-pick">
              <Avatar provider={preview} />
              <div className="stack" style={{ gap: 6 }}>
                <label className="btn btn-sm">
                  <ImagePlus size={18} /> {hasPhoto ? 'غيّر الصورة' : 'ارفع صورة'}
                  <input type="file" accept="image/*" hidden onChange={pickPhoto} />
                </label>
                {photo && <small className="muted">اتضغطت من {kb(photo.before)} لـ {kb(photo.after)}</small>}
                {hasPhoto && (
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => (setPhoto(null), setPhotoRemoved(true))}>
                    شيل الصورة
                  </button>
                )}
                <small className="muted">صورة شخصية بس. ممنوع صور بطايق أو مستندات.</small>
              </div>
            </div>
            <div className="f-2">
              <label className="field">
                <span>الاسم اللي هيظهر</span>
                <input className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} />
              </label>
              <label className="field">
                <span>السن (مش بيظهر)</span>
                <input className="input" inputMode="numeric" value={form.private.age ?? ''} onChange={(e) => setPrivate({ age: e.target.value.replace(/\D/g, '') })} />
              </label>
            </div>
            <div className="chips wrap">
              <button type="button" className="chip" aria-pressed={form.gender === 'male'} onClick={() => set({ gender: 'male' })}>
                راجل
              </button>
              <button type="button" className="chip" aria-pressed={form.gender === 'female'} onClick={() => set({ gender: 'female', women_service: true })}>
                ست
              </button>
            </div>
            <Toggle
              checked={form.women_service}
              onChange={(v) => set({ women_service: v })}
              label="خدمة نسائية"
              hint="بتظهر في فلتر الخدمة النسائية (مقدمة الخدمة ست)"
            />
          </section>

          {/* 3) التواصل */}
          <section className="f-card">
            <h2>
              <Phone size={20} /> التواصل
            </h2>
            <div className="f-2">
              <label className="field">
                <span>رقم الواتساب</span>
                <input className="input" dir="ltr" inputMode="tel" value={form.whatsapp || ''} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="01xxxxxxxxx" />
              </label>
              <label className="field">
                <span>رقم الاتصال</span>
                <input className="input" dir="ltr" inputMode="tel" value={form.phone || ''} onChange={(e) => set({ phone: e.target.value })} placeholder="لو فاضي = نفس الواتساب" />
              </label>
            </div>
            <Toggle
              checked={form.show_phone}
              onChange={(v) => set({ show_phone: v })}
              label="يظهر زرار الاتصال"
              hint="لو اتشال، التواصل هيبقى بالواتساب بس"
            />
          </section>

          {/* 4) الخدمات */}
          <section className="f-card">
            <h2>
              <Sparkles size={20} /> الخدمات
            </h2>
            {form.service_ids.length > 0 && (
              <div className="selected-svcs">
                {form.service_ids.map((sid, i) => (
                  <span key={sid} className={`sel-chip ${i === 0 ? 'primary' : ''}`}>
                    {i === 0 && <Star size={14} fill="currentColor" />}
                    {catalog.subById.get(sid)?.name_ar}
                    {i > 0 && (
                      <button type="button" onClick={() => makePrimary(sid)} title="خليها الأساسية" aria-label="خليها الأساسية">
                        <Star size={14} />
                      </button>
                    )}
                    <button type="button" onClick={() => toggleService(sid)} aria-label="شيل">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <small className="muted">أول خدمة (اللي عليها نجمة) هي اللي بتظهر على الكارت.</small>
            <label className="search-box" style={{ height: 48, boxShadow: 'none' }}>
              <Search size={18} />
              <input value={svcQuery} onChange={(e) => setSvcQuery(e.target.value)} placeholder="دوّر على خدمة" />
            </label>
            <div className="svc-scroll">
              {catalog.categories.map((c) => {
                const subs = catalog.subsOf(c.id).filter(svcMatch)
                if (!subs.length) return null
                return (
                  <div key={c.id} className="svc-group">
                    <b>
                      <CategoryIcon name={c.icon} size={16} /> {c.name_ar}
                    </b>
                    <div className="chips wrap">
                      {subs.map((s) => (
                        <button type="button" key={s.id} className="chip" aria-pressed={form.service_ids.includes(s.id)} onClick={() => toggleService(s.id)}>
                          {s.name_ar}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 5) الأماكن */}
          <section className="f-card">
            <h2>
              <MapPinned size={20} /> الأماكن
            </h2>
            <label className="field">
              <span>ساكن في</span>
              <select className="select" value={form.home_location_id || ''} onChange={(e) => set({ home_location_id: Number(e.target.value) || '' })}>
                <option value="">اختار...</option>
                {centers.map((c) => (
                  <optgroup key={c.id} label={c.name_ar}>
                    {catalog.childrenOf(c.id).map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name_ar}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <div className="field">
              <span>بيغطي (بيروح فين)</span>
              <div className="chips wrap">
                {governorates.map((g) => (
                  <button type="button" key={g.id} className="chip" aria-pressed={form.area_ids.includes(g.id)} onClick={() => toggleArea(g.id)}>
                    {g.name_ar} كلها
                  </button>
                ))}
                {centers.map((c) => (
                  <button type="button" key={c.id} className="chip" aria-pressed={form.area_ids.includes(c.id)} onClick={() => toggleArea(c.id)}>
                    {c.name_ar} كله
                  </button>
                ))}
                {catalog.places.map((l) => (
                  <button type="button" key={l.id} className="chip" aria-pressed={form.area_ids.includes(l.id)} onClick={() => toggleArea(l.id)}>
                    {l.name_ar}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 6) المواعيد */}
          <section className="f-card">
            <h2>
              <CalendarDays size={20} /> المواعيد
            </h2>
            <div className="chips wrap">
              {WEEK_ORDER.map((d) => (
                <button type="button" key={d} className="chip" aria-pressed={form.schedule.days.includes(d)} onClick={() => toggleDay(d)}>
                  {DAY_NAMES[d]}
                </button>
              ))}
            </div>
            <Toggle
              checked={allDay}
              onChange={(v) => setSchedule(v ? { from: '00:00', to: '23:59' } : { from: '09:00', to: '21:00' })}
              label="متاح 24 ساعة"
            />
            {!allDay && (
              <div className="f-2">
                <label className="field">
                  <span>من</span>
                  <input className="input" type="time" value={form.schedule.from} onChange={(e) => setSchedule({ from: e.target.value })} />
                </label>
                <label className="field">
                  <span>لحد</span>
                  <input className="input" type="time" value={form.schedule.to} onChange={(e) => setSchedule({ to: e.target.value })} />
                </label>
              </div>
            )}
          </section>

          {/* 7) التفاصيل */}
          <section className="f-card">
            <h2>
              <FileText size={20} /> التفاصيل
            </h2>
            <label className="field">
              <span>نبذة</span>
              <textarea className="textarea" value={form.bio || ''} onChange={(e) => set({ bio: e.target.value })} maxLength={600} />
              <small>{(form.bio || '').length}/600</small>
            </label>
            <label className="field">
              <span>ملاحظة عن السعر (اختياري)</span>
              <input className="input" value={form.price_note || ''} onChange={(e) => set({ price_note: e.target.value })} placeholder="مثلاً: الحصة 40 جنيه" />
            </label>
          </section>

          {/* 8) الإدارة */}
          <section className="f-card">
            <h2>
              <ShieldCheck size={20} /> الإدارة
            </h2>
            <div className="chips wrap">
              {[
                ['active', 'نشط (ظاهر)'],
                ['pending', 'مراجعة'],
                ['suspended', 'موقوف'],
              ].map(([k, v]) => (
                <button type="button" key={k} className="chip" aria-pressed={form.status === k} onClick={() => set({ status: k })}>
                  {v}
                </button>
              ))}
            </div>
            <Toggle checked={form.is_verified} onChange={(v) => set({ is_verified: v })} label="موثّق" hint="اتأكدت من شخصيته ورقمه على الواتساب" />
            <Toggle checked={form.is_featured} onChange={(v) => set({ is_featured: v })} label="مقدم خدمة مميز" hint="بيظهر في أول النتائج" />
            {form.is_featured && (
              <label className="field">
                <span>مميز لحد (فاضي = على طول)</span>
                <input className="input" type="date" value={form.featured_until || ''} onChange={(e) => set({ featured_until: e.target.value })} />
              </label>
            )}
            <div className="f-2">
              <label className="field">
                <span>تاريخ الانضمام</span>
                <input className="input" type="date" value={form.joined_at} onChange={(e) => set({ joined_at: e.target.value })} />
              </label>
              <label className="field">
                <span>رابط الصفحة</span>
                <input
                  className="input"
                  dir="ltr"
                  value={form.slug}
                  onChange={(e) => {
                    slugEdited.current = true
                    set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })
                  }}
                />
                <small dir="ltr" style={{ textAlign: 'right' }}>/p/{form.slug}</small>
              </label>
            </div>
            <label className="field">
              <span>ملاحظات خاصة (مش بتظهر)</span>
              <textarea className="textarea" style={{ minHeight: 80 }} value={form.private.notes || ''} onChange={(e) => setPrivate({ notes: e.target.value })} />
            </label>
          </section>
        </div>

        <aside className="form-aside stack">
          <b className="muted">كده هيظهر للناس:</b>
          <div style={{ pointerEvents: 'none' }}>
            <ProviderCard provider={preview} />
          </div>
        </aside>
      </div>

      <div className="save-bar">
        {error && <div className="err-note spacer">{error}</div>}
        {!error && form.updated_by && (
          <small className="muted spacer" style={{ fontSize: 13 }}>
            آخر تعديل: <span dir="ltr">{form.updated_by}</span>
          </small>
        )}
        {id && isOwner && (
          <button
            className="btn btn-danger"
            disabled={saving}
            onClick={async () => {
              if (!confirm(`تمسح ${form.name} نهائياً؟ (لو عايز توقفه مؤقتاً استخدم "موقوف" بدل المسح)`)) return
              setSaving(true)
              try {
                await deleteProvider(form.id)
                navigate('/admin')
              } catch (e) {
                setError(e.message)
                setSaving(false)
              }
            }}
          >
            مسح
          </button>
        )}
        <Link to="/admin" className="btn">
          إلغاء
        </Link>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          <Save size={20} /> {saving ? 'بيتحفظ...' : 'حفظ'}
        </button>
      </div>
    </>
  )
}
