import { Link } from 'react-router-dom'
import { ArrowUpLeft, MapPin, Check } from 'lucide-react'
import { useAppState, useAsync, useSeo } from '../lib/app-state.jsx'
import { getStats, searchProviders } from '../lib/api.js'
import { arNum } from '../lib/arabic.js'
import { CategoryIcon } from '../lib/icons.jsx'
import { SearchBar } from '../components/SearchBar.jsx'
import { ProviderTile } from '../components/ProviderCard.jsx'
import { AdSlot } from '../components/AdSlot.jsx'
import { SITE } from '../config.js'

function StatTile({ label, value, lime }) {
  return (
    <div className={`stat-tile ${lime ? 'lime' : ''}`}>
      <span>
        <i>{lime && <Check size={12} strokeWidth={3} />}</i>
        {label}
      </span>
      <b>{value == null ? '—' : arNum(value)}</b>
    </div>
  )
}

export default function Home() {
  const { catalog, locationId } = useAppState()
  const place = locationId ? catalog?.locLabel(locationId) : ''
  const recent = useAsync(() => searchProviders({ location: locationId, sort: 'recent', limit: 10 }), [locationId])
  const stats = useAsync(() => getStats(locationId), [locationId])

  useSeo({
    title: `${SITE.name} — ${SITE.tagline}${place ? ` | ${place}` : ''}`,
    description: SITE.description,
  })

  return (
    <div className="container">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">
            <i>
              <MapPin size={13} />
            </i>
            {place || 'كل الأماكن'}
          </span>
          <h1>
            محتاج <b>إيه</b> النهارده؟
          </h1>
          <p className="lead">
            {place ? `أهل ${place} اللي بيقدموا خدمات` : 'أهل بلدك اللي بيقدموا خدمات'}، وتكلّمهم على طول بالواتساب.
          </p>
          <SearchBar dark />
        </div>
        <div className="hero-stats">
          <StatTile label="مقدم خدمة" value={stats.data?.providers} lime />
          <StatTile label="موثّق" value={stats.data?.verified} />
          <StatTile label="خدمة نسائية" value={stats.data?.women} />
          <StatTile label="نوع خدمة" value={catalog?.subcategories.length} />
        </div>
      </section>

      <section className="section" aria-labelledby="cats">
        <div className="section-head">
          <div>
            <h2 id="cats">اختار الخدمة</h2>
            <p>{catalog ? `${arNum(catalog.categories.length)} فئة` : ''}</p>
          </div>
        </div>
        <div className="cat-grid">
          {catalog?.categories.map((c) => (
            <Link key={c.id} to={`/c/${c.slug}`} className="cat-tile" data-tone={c.tone}>
              <span className="cat-icon">
                <CategoryIcon name={c.icon} size={26} />
              </span>
              <span className="round-arrow">
                <ArrowUpLeft size={16} />
              </span>
              <div>
                <h3>{c.name_ar}</h3>
                {c.description && <p>{c.description}</p>}
              </div>
            </Link>
          )) ??
            Array.from({ length: 10 }, (_, i) => <div key={i} className="skeleton" style={{ height: 160 }} />)}
        </div>
      </section>

      <section className="section">
        <AdSlot placement="home_banner" />
      </section>

      {recent.data?.length > 0 && (
        <section className="section dark-panel" aria-labelledby="recent">
          <div className="section-head">
            <div>
              <h2 id="recent">انضم حديثاً</h2>
              <p>وشوش جديدة في {place || 'المنصة'}</p>
            </div>
            <Link to="/search?sort=recent" className="round-arrow" aria-label="شوف الكل">
              <ArrowUpLeft size={18} />
            </Link>
          </div>
          <div className="rail">
            {recent.data.map((p, i) => (
              <ProviderTile key={p.id} provider={p} highlight={i === 0} />
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <AdSlot placement="home_banner" index={1} />
      </section>
    </div>
  )
}
