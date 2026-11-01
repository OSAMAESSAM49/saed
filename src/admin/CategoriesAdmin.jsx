import { useState } from 'react'
import { Plus, Pencil, FolderTree } from 'lucide-react'
import { useAppState, useAsync } from '../lib/app-state.jsx'
import { slugify, isValidSlug } from '../lib/slug.js'
import { CATEGORY_ICONS, CategoryIcon, TONES } from '../lib/icons.jsx'
import { arNum } from '../lib/arabic.js'
import { Toast, useToast, Empty } from '../components/ui.jsx'
import { listCatalogAll, saveCatalogRow } from './adminApi.js'
import { AdminTop, Toggle, Modal } from './shared.jsx'

function useForm(initial) {
  const [f, setF] = useState(initial)
  const [slugEdited, setSlugEdited] = useState(!!initial.id)
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const setName = (name_ar) => set({ name_ar, ...(!slugEdited && { slug: slugify(name_ar) }) })
  const setSlug = (slug) => (setSlugEdited(true), set({ slug: slug.toLowerCase() }))
  return { f, set, setName, setSlug }
}

function SaveFooter({ error, busy, onClose, onSave }) {
  return (
    <>
      {error && <div className="err-note spacer">{error}</div>}
      <button className="btn" onClick={onClose}>إلغاء</button>
      <button className="btn btn-primary" onClick={onSave} disabled={busy}>حفظ</button>
    </>
  )
}

function CategoryForm({ initial, onClose, onSaved }) {
  const { f, set, setName, setSlug } = useForm(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!f.name_ar.trim()) return setError('اكتب اسم الفئة')
    if (!isValidSlug(f.slug)) return setError('الـ slug لازم يكون حروف إنجليزي صغيرة وأرقام و - بس')
    setBusy(true)
    try {
      await saveCatalogRow('categories', { ...f, sort: Number(f.sort) || 0 })
      onSaved()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Modal title={initial.id ? `تعديل: ${initial.name_ar}` : 'فئة جديدة'} onClose={onClose} footer={<SaveFooter error={error} busy={busy} onClose={onClose} onSave={save} />}>
      <label className="field">
        <span>اسم الفئة</span>
        <input className="input" value={f.name_ar} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field">
        <span>وصف قصير (بيظهر تحت الاسم)</span>
        <input className="input" value={f.description || ''} onChange={(e) => set({ description: e.target.value })} />
      </label>
      <div className="field">
        <span>اللون</span>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              data-tone={t}
              className="swatch"
              aria-pressed={f.tone === t}
              aria-label={t}
              onClick={() => set({ tone: t })}
            />
          ))}
        </div>
      </div>
      <div className="field">
        <span>الأيقونة</span>
        <div className="icon-grid" data-tone={f.tone}>
          {Object.keys(CATEGORY_ICONS).map((name) => (
            <button key={name} type="button" aria-pressed={f.icon === name} onClick={() => set({ icon: name })} title={name}>
              <CategoryIcon name={name} size={22} />
            </button>
          ))}
        </div>
      </div>
      <div className="f-2">
        <label className="field">
          <span>الـ slug (للروابط)</span>
          <input className="input" dir="ltr" value={f.slug} onChange={(e) => setSlug(e.target.value)} />
        </label>
        <label className="field">
          <span>الترتيب</span>
          <input className="input" inputMode="numeric" value={f.sort} onChange={(e) => set({ sort: e.target.value.replace(/\D/g, '') })} />
        </label>
      </div>
      <Toggle checked={f.is_active} onChange={(v) => set({ is_active: v })} label="ظاهرة في الموقع" />
    </Modal>
  )
}

function SubForm({ initial, categories, onClose, onSaved }) {
  const { f, set, setName, setSlug } = useForm(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!f.name_ar.trim()) return setError('اكتب اسم الخدمة')
    if (!isValidSlug(f.slug)) return setError('الـ slug لازم يكون حروف إنجليزي صغيرة وأرقام و - بس')
    setBusy(true)
    try {
      const keywords = f.keywordsText.split(/[،,\n]/).map((k) => k.trim()).filter(Boolean)
      const { keywordsText, ...row } = f
      await saveCatalogRow('subcategories', { ...row, keywords, category_id: Number(f.category_id), sort: Number(f.sort) || 0 })
      onSaved()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Modal title={initial.id ? `تعديل: ${initial.name_ar}` : 'خدمة جديدة'} onClose={onClose} footer={<SaveFooter error={error} busy={busy} onClose={onClose} onSave={save} />}>
      <label className="field">
        <span>اسم الخدمة</span>
        <input className="input" value={f.name_ar} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: تمريض منزلي" />
      </label>
      <label className="field">
        <span>تبع فئة</span>
        <select className="select" value={f.category_id} onChange={(e) => set({ category_id: e.target.value })}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_ar}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>كلمات بيدوّر بيها الناس</span>
        <textarea className="textarea" style={{ minHeight: 80 }} value={f.keywordsText} onChange={(e) => set({ keywordsText: e.target.value })} placeholder="ممرضة، حقنة، تمرجي" />
        <small>افصل بينهم بفاصلة. مثلاً لو حد كتب "حنفية" يطلعله السباك.</small>
      </label>
      <div className="f-2">
        <label className="field">
          <span>الـ slug (للروابط)</span>
          <input className="input" dir="ltr" value={f.slug} onChange={(e) => setSlug(e.target.value)} />
        </label>
        <label className="field">
          <span>الترتيب</span>
          <input className="input" inputMode="numeric" value={f.sort} onChange={(e) => set({ sort: e.target.value.replace(/\D/g, '') })} />
        </label>
      </div>
      <Toggle checked={f.is_active} onChange={(v) => set({ is_active: v })} label="ظاهرة في الموقع" />
    </Modal>
  )
}

export function CategoriesAdmin() {
  const { refreshCatalog } = useAppState()
  const [reload, setReload] = useState(0)
  const { data, loading, error } = useAsync(listCatalogAll, [reload])
  const [editCat, setEditCat] = useState(null)
  const [editSub, setEditSub] = useState(null)
  const [toast, setToast, clearToast] = useToast()
  const cats = data?.categories || []
  const subs = data?.subcategories || []

  const saved = () => {
    setEditCat(null)
    setEditSub(null)
    setToast('اتحفظ')
    setReload((n) => n + 1)
    refreshCatalog()
  }
  const openSub = (s, catId) =>
    setEditSub(
      s
        ? { ...s, sort: String(s.sort), category_id: String(s.category_id), keywordsText: (s.keywords || []).join('، ') }
        : { name_ar: '', slug: '', sort: '0', is_active: true, category_id: String(catId), keywordsText: '' },
    )

  return (
    <>
      <AdminTop title="الفئات والخدمات">
        <button
          className="btn btn-primary"
          onClick={() => setEditCat({ name_ar: '', description: '', slug: '', icon: 'LayoutGrid', tone: 'lime', sort: String(cats.length + 1), is_active: true })}
        >
          <Plus size={20} /> فئة
        </button>
      </AdminTop>
      <div className="admin-body">
        {loading ? (
          <div className="skeleton" style={{ height: 300 }} />
        ) : error ? (
          <div className="err-note">{error.message}</div>
        ) : !cats.length ? (
          <Empty icon={FolderTree} title="مفيش فئات" />
        ) : (
          <div className="a-list">
            {cats.map((c) => {
              const mine = subs.filter((s) => s.category_id === c.id)
              return (
                <div key={c.id} className="cat-admin" data-tone={c.tone}>
                  <div className="row">
                    <span className="cat-icon" style={{ width: 48, height: 48 }}>
                      <CategoryIcon name={c.icon} size={22} />
                    </span>
                    <div className="spacer">
                      <b>{c.name_ar}</b> {!c.is_active && <span className="status-tag suspended">مقفولة</span>}
                      <small className="muted" style={{ display: 'block' }}>
                        {arNum(mine.length)} خدمة · {c.description}
                      </small>
                    </div>
                    <button className="icon-btn dark" onClick={() => setEditCat({ ...c, sort: String(c.sort) })} aria-label={`تعديل ${c.name_ar}`}>
                      <Pencil size={17} />
                    </button>
                  </div>
                  <div className="chips wrap" style={{ marginTop: 12 }}>
                    {mine.map((s) => (
                      <button key={s.id} className="chip soft" onClick={() => openSub(s)} style={!s.is_active ? { opacity: 0.45, textDecoration: 'line-through' } : undefined}>
                        {s.name_ar}
                      </button>
                    ))}
                    <button className="chip" onClick={() => openSub(null, c.id)}>
                      <Plus size={16} /> خدمة
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {editCat && <CategoryForm initial={editCat} onClose={() => setEditCat(null)} onSaved={saved} />}
      {editSub && <SubForm initial={editSub} categories={cats} onClose={() => setEditSub(null)} onSaved={saved} />}
      <Toast message={toast} onDone={clearToast} />
    </>
  )
}
