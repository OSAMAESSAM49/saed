// الاتصال بـ Firebase (الخطة المجانية Spark)
// بنستخدم "Firestore Lite": أخف بكتير من النسخة الكاملة ومناسب للنت الضعيف (مفيش realtime ومش محتاجينه)
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore/lite'
import { FIREBASE } from '../config.js'

export const app = getApps()[0] || initializeApp(FIREBASE)
export const db = getFirestore(app)

// شكل البيانات في Firestore:
//   catalog/main              ← الفئات والخدمات والأماكن (مستند واحد = قراية واحدة للزائر)
//   public_index/{محافظة}     ← بيانات كروت مقدمي الخدمة المعتمدين في المحافظة (مستند واحد)
//   public_providers/{id}     ← صفحة مقدم الخدمة (فيها النبذة)
//   public/ads                ← الإعلانات كلها في مستند واحد
//   photos/{key}              ← الصور مضغوطة (Firebase Storage مش متاح في الخطة المجانية)
//   providers/{id}            ← البيانات الكاملة (الأدمن بس)
//   ads/{id}                  ← الإعلانات بالتفصيل (الأدمن بس)
//   reports/{id}              ← البلاغات (الزائر بيضيف بس، والأدمن بيقرا)
//   counters/{يوم__نوع__id}   ← عدّادات الإحصائيات
//   admins/{uid}              ← حسابات الأدمن (بتتضاف من Firebase Console)
