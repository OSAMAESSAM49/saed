import { useState } from 'react'
import { Plus, Pencil, Trash2, Megaphone, ImagePlus } from 'lucide-react'
import { useAsync, useCatalog } from '../lib/app-state.jsx'
import { normalizeEgPhone } from '../lib/phone.js'
import { compressImage, kb } from '../lib/image.js'
import { Toast, useToast, Empty } from '../components/ui.jsx'
import { listAds, saveAd, deleteAd } from './adminApi.js'
import { usePhoto } from '../lib/photos.js'
import { AdminTop, Toggle, Modal } from './shared.jsx'

export const PLACEMENTS = {
  home_banner: 'بانر الرئيسية',
  category_inline: 'كارت بين النتائج (كل 6)',
  provider_banner: 'بانر صفحة مقدم الخدمة',
}

const today = () => new Date().toISOString().slice(0, 10)
const plusDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)

export function adState(ad) {
  if (!ad.is_active) return ['suspended', 'موقوف']
  if (ad.ends_at < today()) return ['suspended', 'خلص']
  if (ad.starts_at > today()) return ['pending', 'لسه مبدأش']
  return ['active', 'شغال']
}

function AdForm({ initial, onClose, onSaved }) {
  const catalog = useCatalog()
  const [f, setF] = useState(initial)
  const [img, setImg] = useState(null)
  const [imgRemoved, setImgRemoved] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const toggleLoc = (id) =>
    set({ location_ids: f.location_ids.includes(id) ? f.location_ids.filter((x) => x !== id) : [...f.location_ids, id] })

  const pick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await compressImage(file, { width: 1200, height: 400, maxBytes: 200 * 1024 })
      setImgRemoved(false)
      setImg({ ...res, preview: URL.createObjectURL(res.blob) })
    } catch (err) {
      setError(err.message)
    }
    e.target.value = ''
  }

  const save = async () => {
    setError('')
    const wa = f.whatsapp ? normalizeEgPhone(f.whatsapp) : ''
    if (!f.title.trim()) return setError('اكتب عنوان الإعلان')
    if (f.whatsapp && !wa) return setError('رقم الواتساب مكتوب غلط')
    if (!wa && !/^https?:\/\//.test(f.link_url || '')) return setError('حط رقم واتساب أو رابط يبدأ بـ https://')
    if (!f.ends_at || f.ends_at < f.starts_at) return setError('تاريخ النهاية لازم يكون بعد البداية')
    setBusy(true)
    try {
      await saveAd(
        { ...f, whatsapp: wa, priority: Number(f.priority) || 0 },
        img ? { blob: img.blob } : imgRemoved ? { remove: true } : null,
      )
      onSaved()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const saved = usePhoto(imgRemoved ? null : f, 'image')
  const preview = img?.preview || saved.src
  return (
    <Modal
      title={initial.id ? 'تعديل الإعلان' : 'إعلان جديد'}
      onClose={onClose}
      footer={
        <>
          {error && <div className="err-note spacer">{error}</div>}
          <button className="btn" onClick={onClose}>إلغاء</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'بيتحفظ...' : 'حفظ'}</button>
        </>
      }
    >
      <label className="field">
        <span>عنوان الإعلان</span>
        <input className="input" value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="مثلاً: صيدلية الشفاء — خصم 10%" />
        <small>بيظهر لو مفيش صورة، وبيتقري للي مش بيشوفوا الصور.</small>
      </label>
      <label className="field">
        <span>اسم المعلن</span>
        <input className="input" value={f.advertiser || ''} onChange={(e) => set({ advertiser: e.target.value })} />
      </label>
      <div className="field">
        <span>مكان الظهور</span>
        <div className="chips wrap">
          {Object.entries(PLACEMENTS).map(([k, v]) => (
            <button key={k} type="button" className="chip soft" aria-pressed={f.placement === k} onClick={() => set({ placement: k })}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>صورة الإعلان (عرض 3 × طول 1)</span>
        {preview && <img src={preview} alt="" style={{ borderRadius: 18, aspectRatio: '3 / 1', objectFit: 'cover', width: '100%' }} />}
        <div className="row">
          <label className="btn btn-sm">
            <ImagePlus size={18} /> {preview ? 'غيّر الصورة' : 'ارفع صورة'}
            <input type="file" accept="image/*" hidden onChange={pick} />
          </label>
          {img && <small className="muted">اتضغطت من {kb(img.before)} لـ {kb(img.after)}</small>}
          {preview && (
            <button type="button" className="btn btn-sm btn-danger" onClick={() => (setImg(null), setImgRemoved(true))}>
              شيل
            </button>
          )}
        </div>
      </div>
      <div className="f-2">
        <label className="field">
          <span>رقم واتساب المعلن</span>
          <input className="input" dir="ltr" inputMode="tel" value={f.whatsapp || ''} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="01xxxxxxxxx" />
        </label>
        <label className="field">
          <span>أو رابط</span>
          <input className="input" dir="ltr" value={f.link_url || ''} onChange={(e) => set({ link_url: e.target.value })} placeholder="https://facebook.com/..." />
        </label>
      </div>
      <div className="f-2">
        <label className="field">
          <span>يبدأ</span>
          <input className="input" type="date" value={f.starts_at} onChange={(e) => set({ starts_at: e.target.value })} />
        </label>
        <label className="field">
          <span>ينتهي (بيختفي لوحده بعدها)</span>
          <input className="input" type="date" value={f.ends_at} onChange={(e) => set({ ends_at: e.target.value })} />
        </label>
      </div>
      <div className="field">
        <span>يظهر لمين؟</span>
        <div className="chips wrap">
          <button type="button" className="chip soft" aria-pressed={!f.location_ids.length} onClick={() => set({ location_ids: [] })}>
            كل الأماكن
          </button>
          {catalog?.locations.map((l) => (
            <button key={l.id} type="button" className="chip soft" aria-pressed={f.location_ids.includes(l.id)} onClick={() => toggleLoc(l.id)}>
              {l.name_ar}
            </button>
          ))}
        </div>
        <small>لو اخترت مركز، الإعلان بيظهر لكل القرى اللي فيه.</small>
      </div>
      <div className="f-2">
        <label className="field">
          <span>الأولوية (الأكبر يظهر الأول)</span>
          <input className="input" inputMode="numeric" value={f.priority} onChange={(e) => set({ priority: e.target.value.replace(/\D/g, '') })} />
        </label>
        <Toggle checked={f.is_active} onChange={(v) => set({ is_active: v })} label="شغال" />
      </div>
    </Modal>
  )
}

function AdThumb({ ad }) {
  const { src, onError } = usePhoto(ad, 'image')
  return <div className="ad-thumb">{src ? <img src={src} alt="" onError={onError} /> : <Megaphone size={22} />}</div>
}

export function AdsAdmin() {
  const catalog = useCatalog()
  const [reload, setReload] = useState(0)
  const { data, loading, error } = useAsync(listAds, [reload])
  const [editing, setEditing] = useState(null)
  const [toast, setToast, clearToast] = useToast()

  const remove = async (ad) => {
    if (!confirm(`تمسح إعلان "${ad.title}" نهائي؟`)) return
    await deleteAd(ad.id)
    setToast('الإعلان اتمسح')
    setReload((n) => n + 1)
  }

  return (
    <>
      <AdminTop title="الإعلانات">
        <button
          className="btn btn-primary"
          onClick={() =>
            setEditing({
              title: '', advertiser: '', placement: 'home_banner', image_url: '', link_url: '', whatsapp: '',
              starts_at: today(), ends_at: plusDays(30), priority: '0', is_active: true, location_ids: [],
            })
          }
        >
          <Plus size={20} /> إعلان
        </button>
      </AdminTop>
      <div className="admin-body">
        <p className="muted" style={{ marginBottom: 14 }}>
          لما مفيش إعلان شغال في مكان، الموقع بيعرض مكانه "سجّل اسمك" أو "أعلن معانا" لوحده.
        </p>
        {loading ? (
          <div className="skeleton" style={{ height: 240 }} />
        ) : error ? (
          <div className="err-note">{error.message}</div>
        ) : !data.length ? (
          <Empty icon={Megaphone} title="مفيش إعلانات لسه" text="أول ما محل يتفق معاك، ضيف إعلانه من هنا." />
        ) : (
          <div className="a-list">
            {data.map((ad) => {
              const [cls, label] = adState(ad)
              const places = ad.location_ids?.length ? ad.location_ids.map((id) => catalog?.locLabel(id)).join('، ') : 'كل الأماكن'
              return (
                <div key={ad.id} className="a-row">
                  <AdThumb ad={ad} />
                  <div className="a-row-info">
                    <b>
                      {ad.title} <span className={`status-tag ${cls}`}>{label}</span>
                    </b>
                    <small>
                      {PLACEMENTS[ad.placement]} · {places}
                    </small>
                    <small dir="ltr" style={{ textAlign: 'right' }}>
                      {ad.starts_at} → {ad.ends_at}
                    </small>
                  </div>
                  <div className="a-row-actions">
                    <button className="icon-btn" onClick={() => remove(ad)} aria-label="مسح">
                      <Trash2 size={18} />
                    </button>
                    <button
                      className="icon-btn dark"
                      onClick={() => setEditing({ ...ad, priority: String(ad.priority), location_ids: ad.location_ids || [] })}
                      aria-label="تعديل"
                    >
                      <Pencil size={17} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {editing && (
        <AdForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            setToast('الإعلان اتحفظ')
            setReload((n) => n + 1)
          }}
        />
      )}
      <Toast message={toast} onDone={clearToast} />
    </>
  )
}
