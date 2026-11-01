import { Link, useSearchParams } from 'react-router-dom'
import { SearchX, BadgeCheck, Flower2 } from 'lucide-react'
import { useAppState, useAsync, useSeo } from '../lib/app-state.jsx'
import { searchProviders } from '../lib/api.js'
import { arNum } from '../lib/arabic.js'
import { SearchBar, suggestServices } from '../components/SearchBar.jsx'
import { ProviderCard } from '../components/ProviderCard.jsx'
import { Empty, SkeletonList } from '../components/ui.jsx'
import { SITE } from '../config.js'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const sort = params.get('sort') === 'recent' ? 'recent' : 'best'
  const verified = params.get('verified') === '1'
  const women = params.get('women') === '1'
  const { catalog, locationId } = useAppState()
  const place = locationId ? catalog?.locLabel(locationId) : ''
  // تصفّح من غير كلمة بحث: الكل، الموثّقين، الخدمة النسائية، أو اللي انضموا حديثاً
  const browsing = !q && (sort === 'recent' || verified || women || params.has('all'))
  const res = useAsync(
    () => (q || browsing ? searchProviders({ q, sort, verified, women, location: locationId }) : []),
    [q, sort, verified, women, locationId],
  )
  const toggle = (key) => {
    const next = new URLSearchParams(params)
    if (next.get(key) === '1') next.delete(key)
    else next.set(key, '1')
    if (!next.get('q') && !next.has('sort') && !next.has('verified') && !next.has('women')) next.set('all', '1')
    setParams(next, { replace: true })
  }
  const title =
    q || !browsing
      ? 'دوّر على خدمة'
      : women && verified
        ? 'خدمة نسائية موثّقة'
        : women
          ? 'خدمة نسائية'
          : verified
            ? 'مقدمي خدمة موثّقين'
            : sort === 'recent'
              ? 'انضم حديثاً'
              : 'كل مقدمي الخدمة'
  const services = suggestServices(catalog, q, 8)

  useSeo({ title: `${q ? `${q} — ` : ''}${title} | ${SITE.name}`, description: SITE.description })

  return (
    <div className="container">
      <h1 className="page-title">{title}</h1>
      {!browsing && <SearchBar key={q} initial={q} autoFocus={!q} />}
      {(q || browsing) && (
        <div className="chips" style={{ marginTop: 14 }}>
          <button className="chip" aria-pressed={verified} onClick={() => toggle('verified')}>
            <BadgeCheck size={18} /> موثّق
          </button>
          <button className="chip" aria-pressed={women} onClick={() => toggle('women')}>
            <Flower2 size={18} /> خدمة نسائية
          </button>
        </div>
      )}

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
              text={
                q
                  ? `ملقيناش نتايج لـ "${q}"${place ? ` في ${place}` : ''}. جرّب كلمة تانية، أو غيّر المكان من فوق.`
                  : `لسه مفيش حد هنا${place ? ` في ${place}` : ''}. جرّب تشيل الفلتر أو تغيّر المكان من فوق.`
              }
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
