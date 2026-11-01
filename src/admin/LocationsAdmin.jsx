import { useState } from 'react'
import { Plus, Pencil, MapPinned } from 'lucide-react'
import { useAppState, useAsync } from '../lib/app-state.jsx'
import { slugify, isValidSlug } from '../lib/slug.js'
import { Toast, useToast, Empty } from '../components/ui.jsx'
import { listCatalogAll, saveCatalogRow } from './adminApi.js'
import { AdminTop, Toggle, Modal } from './shared.jsx'

export const LOC_TYPES = { governorate: 'محافظة', center: 'مركز', city: 'مدينة', village: 'قرية' }
const PARENT_TYPE = { governorate: null, center: ['governorate'], city: ['center'], village: ['center'] }

function LocationForm({ initial, all, onClose, onSaved }) {
  const [f, setF] = useState(initial)
  const [slugEdited, setSlugEdited] = useState(!!initial.id)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const parents = all.filter((l) => PARENT_TYPE[f.type]?.includes(l.type))

  const save = async () => {
    setError('')
    if (!f.name_ar.trim()) return setError('اكتب الاسم')
    if (PARENT_TYPE[f.type] && !f.parent_id) return setError('اختار المكان اللي هو تبعه')
    if (!isValidSlug(f.slug)) return setError('الـ slug لازم يكون حروف إنجليزي صغيرة وأرقام و - بس')
    setBusy(true)
    try {
      await saveCatalogRow('locations', {
        ...f,
        parent_id: PARENT_TYPE[f.type] ? Number(f.parent_id) : null,
        sort: Number(f.sort) || 0,
      })
      onSaved(initial.id ? 'اتعدّل' : `${f.name_ar} اتضافت`)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title={initial.id ? `تعديل: ${initial.name_ar}` : 'مكان جديد'}
      onClose={onClose}
      footer={
        <>
          {error && <div className="err-note spacer">{error}</div>}
          <button className="btn" onClick={onClose}>إلغاء</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>حفظ</button>
        </>
      }
    >
      <div className="chips wrap">
        {Object.entries(LOC_TYPES).map(([k, v]) => (
          <button key={k} type="button" className="chip soft" aria-pressed={f.type === k} onClick={() => set({ type: k, parent_id: '' })}>
            {v}
          </button>
        ))}
      </div>
      <label className="field">
        <span>الاسم</span>
        <input
          className="input"
          value={f.name_ar}
          onChange={(e) => set({ name_ar: e.target.value, ...(!slugEdited && { slug: slugify(e.target.value.replace(/^(قرية|مدينة|مركز|محافظة)\s+/, '')) }) })}
          placeholder="مثلاً: ميت عاصم"
        />
      </label>
      {PARENT_TYPE[f.type] && (
        <label className="field">
          <span>تبع</span>
          <select className="select" value={f.parent_id || ''} onChange={(e) => set({ parent_id: e.target.value })}>
            <option value="">اختار...</option>
            {parents.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name_ar}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="f-2">
        <label className="field">
          <span>الـ slug (للروابط)</span>
          <input className="input" dir="ltr" value={f.slug} onChange={(e) => (setSlugEdited(true), set({ slug: e.target.value.toLowerCase() }))} />
        </label>
        <label className="field">
          <span>الترتيب</span>
          <input className="input" inputMode="numeric" value={f.sort} onChange={(e) => set({ sort: e.target.value.replace(/\D/g, '') })} />
        </label>
      </div>
      <Toggle checked={f.is_active} onChange={(v) => set({ is_active: v })} label="ظاهر في الموقع" hint="لو اتقفل، المكان بيختفي من الاختيارات" />
    </Modal>
  )
}

export function LocationsAdmin() {
  const { refreshCatalog } = useAppState()
  const [reload, setReload] = useState(0)
  const { data, loading, error } = useAsync(listCatalogAll, [reload])
  const [editing, setEditing] = useState(null)
  const [toast, setToast, clearToast] = useToast()
  const all = data?.locations || []
  const childrenOf = (id) => all.filter((l) => l.parent_id === id).sort((a, b) => a.sort - b.sort || a.id - b.id)

  const add = (parent) =>
    setEditing({
      name_ar: '', slug: '', sort: '0', is_active: true,
      type: !parent ? 'governorate' : parent.type === 'governorate' ? 'center' : 'village',
      parent_id: parent?.id || '',
    })

  const Row = ({ loc, depth }) => (
    <>
      <div className="tree-row" style={{ marginInlineStart: depth * 22 }}>
        <span className={`tag ${loc.type === 'governorate' ? 'featured' : loc.type === 'center' ? 'lavender' : 'lime'}`}>
          {LOC_TYPES[loc.type]}
        </span>
        <b className="spacer">{loc.name_ar}</b>
        {!loc.is_active && <span className="status-tag suspended">مقفول</span>}
        {loc.type !== 'city' && loc.type !== 'village' && (
          <button className="icon-btn" onClick={() => add(loc)} aria-label={`ضيف مكان جوه ${loc.name_ar}`} title="ضيف مكان جواه">
            <Plus size={18} />
          </button>
        )}
        <button className="icon-btn dark" onClick={() => setEditing({ ...loc, sort: String(loc.sort) })} aria-label={`تعديل ${loc.name_ar}`}>
          <Pencil size={17} />
        </button>
      </div>
      {childrenOf(loc.id).map((c) => (
        <Row key={c.id} loc={c} depth={depth + 1} />
      ))}
    </>
  )

  return (
    <>
      <AdminTop title="الأماكن">
        <button className="btn btn-primary" onClick={() => add(null)}>
          <Plus size={20} /> محافظة
        </button>
      </AdminTop>
      <div className="admin-body">
        <p className="muted" style={{ marginBottom: 14 }}>
          عشان تضيف قرية جديدة: اضغط + جنب المركز بتاعها. المنصة بتتوسع لأي محافظة من هنا من غير أي تعديل في الكود.
        </p>
        {loading ? (
          <div className="skeleton" style={{ height: 300 }} />
        ) : error ? (
          <div className="err-note">{error.message}</div>
        ) : !all.length ? (
          <Empty icon={MapPinned} title="مفيش أماكن" text="ابدأ بإضافة محافظة." />
        ) : (
          <div className="tree">
            {all.filter((l) => !l.parent_id).map((g) => (
              <Row key={g.id} loc={g} depth={0} />
            ))}
          </div>
        )}
      </div>
      {editing && (
        <LocationForm
          initial={editing}
          all={all}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null)
            setToast(msg)
            setReload((n) => n + 1)
            refreshCatalog()
          }}
        />
      )}
      <Toast message={toast} onDone={clearToast} />
    </>
  )
}
