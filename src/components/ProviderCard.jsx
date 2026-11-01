import { Link } from 'react-router-dom'
import { MapPin, ArrowUpLeft } from 'lucide-react'
import { Avatar, Verified } from './ui.jsx'
import { ContactButtons } from './ContactButtons.jsx'
import { useCatalog } from '../lib/app-state.jsx'
import { isAvailableNow } from '../lib/schedule.js'
import { arNum } from '../lib/arabic.js'

function useProviderInfo(provider) {
  const catalog = useCatalog()
  const service = catalog?.primaryService(provider)
  const category = catalog?.categoryOf(provider)
  const extra = (provider.service_ids?.length || 1) - 1
  const place = catalog?.locLabel(provider.home_location_id)
  return { service, category, extra, place, available: isAvailableNow(provider.schedule) }
}

// الكارت في نتائج الفئة والبحث (أبيض، والمميز بيبقى ليموني زي الكارت المختار في المرجع)
export function ProviderCard({ provider }) {
  const { service, category, extra, place, available } = useProviderInfo(provider)
  const href = `/p/${provider.slug}`

  return (
    <article className={`p-card ${provider.is_featured ? 'featured' : ''}`}>
      <Link to={href} className="p-card-main">
        <Avatar provider={provider} />
        <div className="p-card-info">
          <div className="p-name">
            <span>{provider.name}</span>
            {provider.is_verified && <Verified />}
          </div>
          <div className="p-service">
            {service?.name_ar}
            {extra > 0 && ` +${arNum(extra)} ${extra > 2 ? 'خدمات' : 'خدمة'}`}
          </div>
        </div>
      </Link>
      <Link to={href} className="round-arrow" aria-label={`تفاصيل ${provider.name}`}>
        <ArrowUpLeft size={18} />
      </Link>
      <div className="p-inner">
        <span>
          <i className={`status-dot ${available ? 'on' : ''}`} />
          {available ? 'متاح دلوقتي' : 'مش متاح دلوقتي'}
        </span>
        {place && (
          <span>
            <MapPin size={15} /> {place}
          </span>
        )}
        <span className="tags-end">
          {provider.is_featured && <span className="tag featured">مميز</span>}
          {provider.women_service && <span className="tag women">نسائية</span>}
        </span>
      </div>
      <div className="p-card-actions">
        <ContactButtons provider={provider} serviceName={service?.name_ar} category={category} />
      </div>
    </article>
  )
}

// الكارت الغامق في "انضم حديثاً" (زي كروت الـ Worklist في المرجع)
export function ProviderTile({ provider, highlight }) {
  const { service, place } = useProviderInfo(provider)
  return (
    <Link to={`/p/${provider.slug}`} className={`w-card ${highlight ? 'lime' : ''}`}>
      <div className="w-card-top">
        <Avatar provider={provider} />
        <div className="spacer">
          <div className="p-name">
            <span>{provider.name}</span>
            {provider.is_verified && <Verified size={17} />}
          </div>
          <small>{service?.name_ar}</small>
        </div>
      </div>
      <span className="round-arrow">
        <ArrowUpLeft size={16} />
      </span>
      <div className="w-inner">
        <MapPin size={16} />
        <span className="spacer">{place}</span>
        {provider.women_service ? <span className="tag lavender">نسائية</span> : highlight && <span className="tag featured">جديد</span>}
      </div>
    </Link>
  )
}
