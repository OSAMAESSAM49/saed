import { Phone, MessageCircle } from 'lucide-react'
import { waLink, telLink } from '../lib/phone.js'
import { logEvent } from '../lib/api.js'
import { useAppState } from '../lib/app-state.jsx'

export function customerMessage(provider, serviceName) {
  return `السلام عليكم، أنا لقيت حضرتك على منصة ساعد${serviceName ? ` وكنت عايز أسأل عن ${serviceName}` : ''}.`
}

// زرار واتساب (ليموني) + زرار اتصال (دايرة سودا)، وكل ضغطة بتتسجل في الإحصائيات
export function ContactButtons({ provider, serviceName, category, size = 'md' }) {
  const { locationId } = useAppState()
  const track = (kind) => logEvent(kind, { provider: provider.id, category: category?.id, location: locationId })
  const wa = provider.whatsapp || provider.phone
  const h = size === 'lg' ? 56 : 50

  return (
    <>
      {wa && (
        <a
          className="btn btn-wa"
          style={{ minHeight: h, fontSize: size === 'lg' ? 18 : 16 }}
          href={waLink(wa, customerMessage(provider, serviceName))}
          target="_blank"
          rel="noopener"
          onClick={() => track('whatsapp')}
        >
          <MessageCircle size={22} />
          كلّمه واتساب
        </a>
      )}
      {provider.phone && (
        <a
          className="btn btn-round btn-primary"
          style={{ width: h, minHeight: h }}
          href={telLink(provider.phone)}
          onClick={() => track('call')}
          aria-label={`اتصل بـ ${provider.name}`}
        >
          <Phone size={21} />
        </a>
      )}
    </>
  )
}
