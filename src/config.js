// الإعدادات العامة — أي تعديل في اسم المنصة أو رقم الواتساب بيتعمل هنا بس

export const SITE = {
  name: 'ساعد',
  tagline: 'خدمات بلدك في إيدك',
  description:
    'منصة مجانية بتوصلك بأهل بلدك اللي بيقدموا خدمات: تمريض، تحفيظ قرآن، دروس، كهربائي، سباك، توكتوك وأكتر.',
  // رقم واتساب الإدارة بالصيغة الدولية من غير + (مصر = 20)
  adminWhatsapp: '201008137502',
  // رابط الموقع بعد الرفع (بيتستخدم في المشاركة والـ SEO)
  url: import.meta.env.VITE_SITE_URL || (typeof location !== 'undefined' ? location.origin + import.meta.env.BASE_URL : ''),
}

// بيانات مشروع Firebase (الخطة المجانية Spark) — بتيجي من .env.local أو من GitHub Variables
export const FIREBASE = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

// لو Firebase مش متوصل، الموقع بيشتغل ببيانات تجريبية من src/data/seed.js
export const IS_DEMO = !FIREBASE.apiKey || !FIREBASE.projectId

// كارت إعلان بعد كل كام نتيجة في صفحة الفئة
export const AD_EVERY = 6
