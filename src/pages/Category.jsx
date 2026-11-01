import { Fragment, useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Flower2, Clock, SearchX, Share2 } from 'lucide-react'
import { useAppState, useAsync, useSeo } from '../lib/app-state.jsx'
import { searchProviders } from '../lib/api.js'
import { CategoryIcon } from '../lib/icons.jsx'
import { isAvailableNow } from '../lib/schedule.js'
import { arNum } from '../lib/arabic.js'
import { ProviderCard } from '../components/ProviderCard.jsx'
import { AdSlot } from '../components/AdSlot.jsx'
import { Empty, SkeletonList } from '../components/ui.jsx'
import { SITE, AD_EVERY } from '../config.js'
import NotFound from './NotFound.jsx'

export default function Category() {
  // الروابط: /c/health ، /c/health/bagalat ، /s/electrician/bagalat (دي اللي بتظهر في جوجل)
  const { slug, sub: subParam, loc } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { catalog, locationId, setLocationId } = useAppState()
  const subFromPath = subParam ? catalog?.subcategories.find((s) => s.slug === subParam) : null
  const category = subFromPath ? catalog.catById.get(subFromPath.category_id) : catalog?.catBySlug.get(slug)
  const catSlug = category?.slug
  const subs = category ? catalog.subsOf(category.id) : []
  const sub = subParam || params.get('sub') || ''

  // الرابط اللي فيه اسم البلد بيختارها للزائر
  useEffect(() => {
    const l = loc && catalog?.locBySlug.get(loc)
    if (l && l.id !== locationId) setLocationId(l.id)
  }, [loc, catalog])
  const women = params.get('women') === '1'
  const nowOnly = params.get('now') === '1'
  const subRow = subs.find((s) => s.slug === sub)
  const place = locationId ? catalog.locLabel(locationId) : ''

  const res = useAsync(
    () => (category ? searchProviders({ category: catSlug, sub, women, location: locationId }) : []),
    [catSlug, sub, women, locationId],
  )
  const list = useMemo(
    () => (nowOnly ? (res.data || []).filter((p) => isAvailableNow(p.schedule)) : res.data || []),
    [res.data, nowOnly],
  )

  const what = subRow?.name_ar || category?.name_ar || ''
  useSeo({
    title: `${what}${place ? ` في ${place}` : ''} | ${SITE.name}`,
    description: `أرقام ${what}${place ? ` في ${place}` : ''} — تواصل مباشرة بالواتساب أو التليفون مع مقدمي خدمة موثّقين من أهل بلدك.`,
  })

  if (catalog && !category) return <NotFound />
  if (!category) return <div className="container"><SkeletonList /></div>

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (subParam && !next.has('sub')) next.set('sub', subParam)
    value ? next.set(key, value) : next.delete(key)
    // من رابط SEO نرجع للرابط العادي عشان الفلاتر تشتغل
    if (subParam || loc) navigate(`/c/${catSlug}${next.toString() ? `?${next}` : ''}`, { replace: true })
    else setParams(next, { replace: true })
  }

  const share = () => {
    const url = location.href
    const text = `${what}${place ? ` في ${place}` : ''} على منصة ${SITE.name}`
    if (navigator.share) navigator.share({ title: text, url }).catch(() => {})
    else window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank')
  }

  return (
    <div className="container">
      <div className="cat-hero" data-tone={category.tone}>
        <Link to="/" className="icon-btn" aria-label="رجوع للرئيسية">
          <ArrowRight size={22} />
        </Link>
        <div className="spacer">
          <h1>{subRow?.name_ar || category.name_ar}</h1>
          <p>{place ? `في ${place} وحواليها` : 'في كل الأماكن'}</p>
        </div>
        <span className="cat-icon">
          <CategoryIcon name={category.icon} size={28} />
        </span>
      </div>

      <div className="toolbar">
        <div className="chips" role="group" aria-label="نوع الخدمة">
          <button className="chip" aria-pressed={!sub} onClick={() => setParam('sub', '')}>
            الكل
          </button>
          {subs.map((s) => (
            <button key={s.id} className="chip" aria-pressed={sub === s.slug} onClick={() => setParam('sub', s.slug)}>
              {s.name_ar}
            </button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="فلاتر">
          <button className="chip soft" aria-pressed={women} onClick={() => setParam('women', women ? '' : '1')}>
            <Flower2 size={18} /> خدمة نسائية
          </button>
          <button className="chip soft" aria-pressed={nowOnly} onClick={() => setParam('now', nowOnly ? '' : '1')}>
            <Clock size={18} /> متاح دلوقتي
          </button>
          <button className="chip soft" onClick={share}>
            <Share2 size={18} /> شارك
          </button>
        </div>
      </div>

      {res.loading ? (
        <SkeletonList />
      ) : res.error ? (
        <Empty icon={SearchX} title="النت ضعيف شوية" text="مقدرناش نجيب النتايج. جرّب تاني كمان شوية." />
      ) : list.length === 0 ? (
        <Empty
          icon={SearchX}
          title="لسه مفيش حد هنا"
          text={`مفيش ${what} ${place ? `في ${place}` : ''} على المنصة لسه${women || nowOnly ? ' بالفلاتر دي' : ''}. تعرف حد شاطر؟ قوله يسجّل اسمه ببلاش.`}
        >
          <Link to="/join" className="btn btn-primary">
            إزاي يسجّل اسمه؟
          </Link>
        </Empty>
      ) : (
        <>
          <div className="result-count">{arNum(list.length)} مقدم خدمة</div>
          <div className="p-list">
            {list.map((p, i) => (
              <Fragment key={p.id}>
                <ProviderCard provider={p} />
                {(i + 1) % AD_EVERY === 0 && i < list.length - 1 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <AdSlot placement="category_inline" index={Math.floor(i / AD_EVERY)} />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
