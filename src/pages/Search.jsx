import { Link, useSearchParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useAppState, useAsync, useSeo } from '../lib/app-state.jsx'
import { searchProviders } from '../lib/api.js'
import { arNum } from '../lib/arabic.js'
import { SearchBar, suggestServices } from '../components/SearchBar.jsx'
import { ProviderCard } from '../components/ProviderCard.jsx'
import { Empty, SkeletonList } from '../components/ui.jsx'
import { SITE } from '../config.js'

export default function Search() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const sort = params.get('sort') === 'recent' ? 'recent' : 'best'
  const { catalog, locationId } = useAppState()
  const place = locationId ? catalog?.locLabel(locationId) : ''
  const browsing = !q && sort === 'recent'
  const res = useAsync(
    () => (q || browsing ? searchProviders({ q, sort, location: locationId }) : []),
    [q, sort, locationId],
  )
  const services = suggestServices(catalog, q, 8)

  useSeo({ title: `${q ? `${q} — ` : ''}دوّر على خدمة | ${SITE.name}`, description: SITE.description })

  return (
    <div className="container">
      <h1 className="page-title">{browsing ? 'انضم حديثاً' : 'دوّر على خدمة'}</h1>
      {!browsing && <SearchBar key={q} initial={q} autoFocus={!q} />}

      {services.length > 0 && (
        <div className="section" style={{ marginTop: 18 }}>
          <div className="chips wrap">
            {services.map((s) => (
              <Link key={s.id} className="chip" to={`/c/${catalog.catById.get(s.category_id).slug}?sub=${s.slug}`}>
                {s.name_ar}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(q || browsing) && (
        <div className="section" style={{ marginTop: 18 }}>
          {res.loading ? (
            <SkeletonList />
          ) : !res.data?.length ? (
            <Empty
              icon={SearchX}
              title="ملقيناش حد"
              text={`ملقيناش نتايج لـ "${q}"${place ? ` في ${place}` : ''}. جرّب كلمة تانية، أو غيّر المكان من فوق.`}
            />
          ) : (
            <>
              <div className="result-count">
                {arNum(res.data.length)} نتيجة{place ? ` في ${place}` : ''}
              </div>
              <div className="p-list">
                {res.data.map((p) => (
                  <ProviderCard key={p.id} provider={p} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!q && !browsing && (
        <div className="section">
          <div className="section-head">
            <h2>أو اختار من هنا</h2>
          </div>
          <div className="chips wrap">
            {catalog?.categories.map((c) => (
              <Link key={c.id} to={`/c/${c.slug}`} className="chip">
                {c.name_ar}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
