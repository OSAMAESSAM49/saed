import { MessageCircle, ShieldCheck, Copy } from 'lucide-react'
import { useSeo } from '../lib/app-state.jsx'
import { adminWaLink } from '../lib/phone.js'
import { JOIN_TEMPLATE } from '../lib/template.js'
import { Toast, useToast } from '../components/ui.jsx'
import { SITE } from '../config.js'

export default function Join() {
  const [toast, setToast, clearToast] = useToast()
  useSeo({
    title: `سجّل اسمك ببلاش | ${SITE.name}`,
    description: `عندك صنعة أو بتقدّم خدمة؟ سجّل اسمك على ${SITE.name} ببلاش وخلّي أهل بلدك يوصلولك بالواتساب.`,
  })

  const copy = () =>
    navigator.clipboard?.writeText(JOIN_TEMPLATE).then(() => setToast('اتنسخ — الصقه في الواتساب'))

  return (
    <div className="container">
      <h1 className="page-title">سجّل اسمك ببلاش</h1>
      <p className="lead">
        عندك صنعة أو بتقدّم خدمة؟ خلّي أهل بلدك يعرفوك ويكلّموك على طول. التسجيل مجاني تماماً، ومفيش أي عمولة.
      </p>

      <div className="steps">
        <div className="step">
          <h3>اضغط الزرار الأخضر</h3>
          <p>هيفتحلك واتساب برسالة جاهزة.</p>
        </div>
        <div className="step">
          <h3>اكتب بياناتك</h3>
          <p>املا الرسالة وابعتها، وابعت بعدها صورة شخصية واضحة.</p>
        </div>
        <div className="step">
          <h3>هنكلّمك نتأكد</h3>
          <p>هنتأكد من شخصيتك على الواتساب بس. مفيش أي ورق بيترفع على الموقع.</p>
        </div>
        <div className="step">
          <h3>اسمك يظهر</h3>
          <p>بعد الموافقة صفحتك بتظهر، والناس تكلّمك مباشرة.</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <a className="btn btn-wa btn-block" style={{ minHeight: 62, fontSize: 19 }} href={adminWaLink(JOIN_TEMPLATE)} target="_blank" rel="noopener">
          <MessageCircle size={26} /> سجّل اسمي على الواتساب
        </a>
        <p className="muted" style={{ textAlign: 'center', marginTop: 10, fontSize: 14 }}>
          لو الزرار مفتحش، ابعت الرسالة دي على رقم{' '}
          <b dir="ltr" style={{ color: 'var(--ink)' }}>
            {SITE.adminWhatsapp.replace(/^20/, '0')}
          </b>
        </p>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>شكل الرسالة</h2>
          <button className="btn btn-sm" onClick={copy}>
            <Copy size={16} /> انسخ
          </button>
        </div>
        <div className="template">{JOIN_TEMPLATE}</div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>
          <ShieldCheck size={20} /> الشروط
        </h2>
        <div className="prose" style={{ fontSize: 16 }}>
          <ul>
            <li>البيانات لازم تكون حقيقية، والصورة صورتك انت.</li>
            <li>رقمك لازم يكون شغال وعليه واتساب.</li>
            <li>تتعامل مع الناس بأمانة واحترام. أي شكاوي متكررة صفحتك بتتوقف.</li>
            <li>انت اللي بتتفق مع الزبون على السعر والميعاد. المنصة مش وسيط في الفلوس.</li>
            <li>تقدر تطلب تعديل بياناتك أو مسح صفحتك في أي وقت من نفس رقم الواتساب.</li>
          </ul>
        </div>
      </div>
      <Toast message={toast} onDone={clearToast} />
    </div>
  )
}
