import { Link } from 'react-router-dom'
import { MapPinOff } from 'lucide-react'
import { Empty } from '../components/ui.jsx'
import { useSeo } from '../lib/app-state.jsx'
import { SITE } from '../config.js'

export default function NotFound() {
  useSeo({ title: `الصفحة مش موجودة | ${SITE.name}` })
  return (
    <div className="container" style={{ marginTop: 24 }}>
      <Empty icon={MapPinOff} title="الصفحة دي مش موجودة" text="ممكن الرابط يكون غلط أو الصفحة اتشالت.">
        <Link to="/" className="btn btn-primary">
          ارجع للرئيسية
        </Link>
      </Empty>
    </div>
  )
}
