import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, Megaphone } from 'lucide-react'
import { getAds, logEvent } from '../lib/api.js'
import { useAppState } from '../lib/app-state.jsx'
import { waLink } from '../lib/phone.js'
import { usePhoto } from '../lib/photos.js'

// الإعلانات الداخلية اللي بتظهر لما مفيش إعلان مدفوع
const HOUSE_ADS = [
  {
    key: 'join', tone: 'lime', icon: UserPlus, to: '/join',
    title: 'عندك صنعة أو بتقدّم خدمة؟', text: 'سجّل اسمك ببلاش وخلّي أهل بلدك يوصلولك.', cta: 'سجّل اسمك',
  },
  {
    key: 'advertise', tone: 'lavender', icon: Megaphone, to: '/advertise',
    title: 'عندك محل أو شركة؟', text: 'إعلانك هنا بيوصل لأهل بلدك وهما بيدوّروا على اللي محتاجينه.', cta: 'أعلن معانا',
  },
]

const cache = new Map()

function AdImage({ ad }) {
  const { src, onError } = usePhoto(ad, 'image')
  return src ? <img src={src} alt={ad.title} loading="lazy" decoding="async" onError={onError} /> : <div style={{ aspectRatio: '3 / 1' }} />
}

export function AdSlot({ placement, index = 0 }) {
  const { locationId } = useAppState()
  const key = `${placement}:${locationId}`
  const [ads, setAds] = useState(() => cache.get(key) || null)

  useEffect(() => {
    if (cache.has(key)) return setAds(cache.get(key))
    getAds(placement, locationId).then((list) => {
      cache.set(key, list)
      setAds(list)
    })
  }, [key])

  // في الرئيسية كل مكان ليه إعلان مختلف؛ وبين النتائج الإعلانات بتلف
  const ad = !ads?.length ? null : placement === 'category_inline' ? ads[index % ads.length] : ads[index] || null

  if (ad) {
    const href = ad.whatsapp ? waLink(ad.whatsapp, `السلام عليكم، شفت إعلانكم على منصة ساعد`) : ad.link_url
    const onClick = () => logEvent('ad_click', { ad: ad.id, location: locationId })
    if (ad.image_url || ad.image_key) {
      return (
        <a className="ad-img" href={href} target="_blank" rel="noopener sponsored" onClick={onClick}>
          <span className="promo-badge">إعلان</span>
          <AdImage ad={ad} />
        </a>
      )
    }
    return (
      <a className="promo" href={href} target="_blank" rel="noopener sponsored" onClick={onClick}>
        <span className="promo-badge">إعلان</span>
        <div className="spacer" style={{ position: 'relative', zIndex: 1, paddingTop: 8 }}>
          <h3>{ad.title}</h3>
          {ad.advertiser && <p>{ad.advertiser}</p>}
        </div>
      </a>
    )
  }

  const house = HOUSE_ADS[index % HOUSE_ADS.length]
  const Icon = house.icon
  return (
    <div className={`promo ${house.tone}`}>
      <div className="spacer" style={{ position: 'relative', zIndex: 1 }}>
        <h3>{house.title}</h3>
        <p>{house.text}</p>
      </div>
      <Link to={house.to} className="btn">
        <Icon size={20} /> {house.cta}
      </Link>
    </div>
  )
}
