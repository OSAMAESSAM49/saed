import { Link } from 'react-router-dom'
import { MessageCircle, LayoutPanelTop, Rows3, PanelBottom } from 'lucide-react'
import { useSeo } from '../lib/app-state.jsx'
import { adminWaLink } from '../lib/phone.js'
import { SITE } from '../config.js'

function Page({ title, description, children }) {
  useSeo({ title: `${title} | ${SITE.name}`, description: description || SITE.description })
  return (
    <div className="container" style={{ maxWidth: 820 }}>
      <h1 className="page-title">{title}</h1>
      <div className="prose">{children}</div>
    </div>
  )
}

export function Advertise() {
  const msg = `السلام عليكم، عايز أعلن على منصة ${SITE.name}\nاسم المحل/الشركة: \nالنشاط: \nالبلد: \nمدة الإعلان: `
  const spots = [
    { icon: LayoutPanelTop, title: 'بانر الصفحة الرئيسية', text: 'أول حاجة الزائر بيشوفها.' },
    { icon: Rows3, title: 'كارت بين النتائج', text: 'بيظهر وسط مقدمي الخدمة، كل 6 كروت.' },
    { icon: PanelBottom, title: 'بانر صفحة مقدم الخدمة', text: 'قدام الناس وهي بتتواصل.' },
  ]
  return (
    <Page title="أعلن معانا" description={`وصّل محلك أو شركتك لأهل بلدك على ${SITE.name}.`}>
      <p>
        محلك أو شركتك يوصلوا لأهل بلدك بالظبط. الإعلان بيظهر بس للناس اللي اختاروا بلدك أو المنطقة اللي تحددها،
        وبنبعتلك كل شهر عدد مرات الظهور والضغطات.
      </p>
      <div className="steps" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {spots.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card" style={{ margin: 0 }}>
            <Icon size={28} className="muted" />
            <h3 style={{ fontSize: 17, marginTop: 8, color: 'var(--ink)' }}>{title}</h3>
            <p style={{ fontSize: 15 }}>{text}</p>
          </div>
        ))}
      </div>
      <a className="btn btn-wa btn-block" style={{ marginTop: 18, minHeight: 60 }} href={adminWaLink(msg)} target="_blank" rel="noopener">
        <MessageCircle size={24} /> كلّمنا على الواتساب
      </a>
    </Page>
  )
}

export function About() {
  return (
    <Page title={`عن ${SITE.name}`}>
      <p>
        <b>{SITE.name}</b> منصة مجانية هدفها توفّر فرص شغل لشباب وستات بلدنا، عن طريق إنها توصّل اللي بيقدّم خدمة
        باللي محتاجها. بدأنا من قرية البجلات (مركز منية النصر، الدقهلية)، وهنكبر لكل القرى والمدن.
      </p>
      <h2>إزاي بتشتغل؟</h2>
      <ul>
        <li>تختار الخدمة اللي محتاجها وبلدك.</li>
        <li>تشوف مقدمي الخدمة، وكل واحد ليه صفحة فيها مواعيده والأماكن اللي بيروحها.</li>
        <li>تكلّمه على طول بالواتساب أو التليفون. مفيش وسيط ولا عمولة.</li>
      </ul>
      <h2>مين اللي بيظهر على الموقع؟</h2>
      <p>
        محدش بيظهر غير بعد ما الإدارة تتواصل معاه وتتأكد منه. علامة <b>موثّق</b> معناها إننا اتأكدنا من شخصيته ورقمه.
      </p>
      <h2>المنصة بتكسب منين؟</h2>
      <p>
        {SITE.name} مجانية للكل، ومصاريفها بتيجي من إعلانات المحلات والشركات المحلية. <Link to="/advertise">أعلن معانا</Link>.
      </p>
    </Page>
  )
}

export function Terms() {
  return (
    <Page title="الشروط وإخلاء المسؤولية">
      <p>استخدامك لـ {SITE.name} معناه إنك موافق على الشروط دي:</p>
      <h2>دور المنصة</h2>
      <ul>
        <li>{SITE.name} دليل بيعرض بيانات مقدمي خدمات، وبيوصّل الناس ببعض بس.</li>
        <li>المنصة <b>مش طرف</b> في أي اتفاق أو تعامل أو دفع بين الزبون ومقدم الخدمة.</li>
        <li>المنصة مش مسؤولة عن جودة الخدمة، ولا السعر، ولا أي ضرر أو خلاف بين الطرفين.</li>
      </ul>
      <h2>التوثيق</h2>
      <p>
        علامة "موثّق" معناها إن الإدارة اتأكدت من شخصية مقدم الخدمة ورقمه وقت التسجيل. ده مش ضمان لجودة الشغل.
      </p>
      <h2>نصايح للأمان</h2>
      <ul>
        <li>اتفق على السعر والميعاد بوضوح قبل ما الشغل يبدأ.</li>
        <li>متدفعش فلوس كتير مقدماً.</li>
        <li>لو حصلت أي مشكلة، استخدم زرار "إبلاغ عن مشكلة" في صفحة مقدم الخدمة.</li>
      </ul>
      <h2>مقدمي الخدمة</h2>
      <ul>
        <li>مسؤولين عن صحة بياناتهم وعن الخدمة اللي بيقدموها.</li>
        <li>الإدارة من حقها توقف أي صفحة عليها شكاوي أو بياناتها مش صحيحة.</li>
      </ul>
    </Page>
  )
}

export function Privacy() {
  return (
    <Page title="سياسة الخصوصية">
      <h2>بنجمع إيه؟</h2>
      <ul>
        <li><b>للزوار:</b> مفيش تسجيل ولا حسابات. بنعدّ الزيارات وضغطات الواتساب والاتصال من غير ما نعرف انت مين.</li>
        <li>
          <b>لمقدمي الخدمة:</b> الاسم، والصورة، والأرقام، والخدمات، والمواعيد. دي اللي بتظهر على الموقع بموافقتهم.
        </li>
      </ul>
      <h2>مستندات التوثيق</h2>
      <p>
        صور البطايق أو أي مستندات <b>مش بتترفع على الموقع خالص</b>. التوثيق بيتم على الواتساب بس، ومش بيتحفظ عندنا.
      </p>
      <h2>رقم الاتصال</h2>
      <p>مقدم الخدمة يقدر يختار يظهر رقم الاتصال، أو يكون التواصل بالواتساب بس.</p>
      <h2>اختيار بلدك</h2>
      <p>البلد اللي بتختارها بتتحفظ على موبايلك انت بس، عشان متختارهاش كل مرة.</p>
      <h2>مسح البيانات</h2>
      <p>
        أي مقدم خدمة يقدر يطلب مسح صفحته في أي وقت. ابعتلنا على{' '}
        <a href={adminWaLink('عايز أمسح صفحتي من المنصة')} target="_blank" rel="noopener">الواتساب</a>.
      </p>
    </Page>
  )
}
