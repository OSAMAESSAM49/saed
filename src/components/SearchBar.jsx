import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ArrowLeft } from 'lucide-react'
import { useCatalog } from '../lib/app-state.jsx'
import { normalizeAr } from '../lib/arabic.js'
import { CategoryIcon } from '../lib/icons.jsx'

// بيقترح الخدمات وانت بتكتب (من غير ما يكلم السيرفر)
export function suggestServices(catalog, q, limit = 6) {
  const nq = normalizeAr(q)
  if (!catalog || nq.length < 2) return []
  const hit = (t) => {
    const n = normalizeAr(t)
    return n.includes(nq) || (n.length > 2 && nq.includes(n))
  }
  return catalog.subcategories
    .filter((s) => hit(s.name_ar) || s.keywords.some(hit) || hit(catalog.catById.get(s.category_id)?.name_ar || ''))
    .slice(0, limit)
}

export function SearchBar({ initial = '', autoFocus = false, dark = false }) {
  const catalog = useCatalog()
  const navigate = useNavigate()
  const [q, setQ] = useState(initial)
  const [focus, setFocus] = useState(false)
  const blurTimer = useRef()
  const suggestions = useMemo(() => suggestServices(catalog, q), [catalog, q])

  const submit = (e) => {
    e.preventDefault()
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <form className={`search ${dark ? 'dark' : ''}`} onSubmit={submit} role="search">
      <label className="search-box">
        <Search size={24} />
        <span className="sr-only">محتاج إيه؟</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => (clearTimeout(blurTimer.current), setFocus(true))}
          onBlur={() => (blurTimer.current = setTimeout(() => setFocus(false), 150))}
          placeholder="محتاج إيه؟ ممرضة، سباك، مدرس..."
          autoFocus={autoFocus}
          enterKeyHint="search"
        />
        <button className="go-btn" type="submit" aria-label="دوّر">
          <ArrowLeft size={22} />
        </button>
      </label>
      {focus && suggestions.length > 0 && (
        <div className="suggest">
          {suggestions.map((s) => {
            const cat = catalog.catById.get(s.category_id)
            return (
              <Link key={s.id} to={`/c/${cat.slug}?sub=${s.slug}`} onMouseDown={(e) => e.preventDefault()}>
                <span className="cat-icon" data-tone={cat.tone} style={{ width: 44, height: 44 }}>
                  <CategoryIcon name={cat.icon} size={22} />
                </span>
                <span className="spacer">
                  {s.name_ar}
                  <small>{cat.name_ar}</small>
                </span>
                <ArrowLeft size={18} className="muted" />
              </Link>
            )
          })}
        </div>
      )}
    </form>
  )
}
