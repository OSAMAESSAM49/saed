import { useState } from 'react'
import { Check, MapPin, Search, Globe2 } from 'lucide-react'
import { Sheet } from './ui.jsx'
import { useAppState } from '../lib/app-state.jsx'
import { normalizeAr } from '../lib/arabic.js'

// اختيار البلد: مقسّمة حسب المحافظة ← المركز، وبتتحفظ للزيارة الجاية
export function LocationSheet({ onClose }) {
  const { catalog, locationId, setLocationId } = useAppState()
  const [q, setQ] = useState('')
  if (!catalog) return null

  const pick = (id) => {
    setLocationId(id)
    onClose()
  }
  const nq = normalizeAr(q)
  const match = (l) => !nq || normalizeAr(l.name_ar).includes(nq)
  const governorates = catalog.locations.filter((l) => l.type === 'governorate')

  const Option = ({ loc, label, icon = MapPin }) => {
    const Icon = icon
    return (
      <button className={`option ${locationId === loc?.id || (!loc && !locationId) ? 'selected' : ''}`} onClick={() => pick(loc?.id ?? null)}>
        <Icon size={20} className="muted" />
        {label ?? loc.name_ar}
        {(locationId === loc?.id || (!loc && !locationId)) && <Check className="check" size={22} />}
      </button>
    )
  }

  return (
    <Sheet title="انت من أنهي بلد؟" onClose={onClose}>
      {catalog.places.length > 6 && (
        <label className="search-box" style={{ height: 52, marginBottom: 8, boxShadow: 'none' }}>
          <Search size={20} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="اكتب اسم البلد" />
        </label>
      )}
      {!nq && <Option loc={null} label="كل الأماكن" icon={Globe2} />}
      {governorates.map((g) => (
        <div key={g.id}>
          {catalog.childrenOf(g.id).map((center) => {
            const kids = catalog.childrenOf(center.id).filter(match)
            if (!kids.length && !match(center)) return null
            return (
              <div key={center.id}>
                <div className="group-label">
                  {center.name_ar} — {g.name_ar}
                </div>
                {kids.map((l) => (
                  <Option key={l.id} loc={l} />
                ))}
                {!nq && <Option loc={center} label={`كل ${center.name_ar}`} />}
              </div>
            )
          })}
        </div>
      ))}
    </Sheet>
  )
}
