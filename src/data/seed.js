// البيانات الأساسية للمنصة — مصدر واحد بيستخدمه:
// 1) الموقع في "الوضع التجريبي" (قبل ربط Firebase)
// 2) شاشة "أول تشغيل" في لوحة الأدمن (بتحط الفئات والأماكن في Firestore)
// 3) سكربت scripts/prerender.mjs في الوضع التجريبي

export const locations = [
  { id: 1, parent_id: null, type: 'governorate', name_ar: 'الدقهلية', slug: 'dakahlia', sort: 1 },
  { id: 2, parent_id: 1, type: 'center', name_ar: 'مركز منية النصر', slug: 'minyat-alnasr-center', sort: 1 },
  { id: 3, parent_id: 2, type: 'village', name_ar: 'البجلات', slug: 'bagalat', sort: 1 },
  { id: 4, parent_id: 2, type: 'city', name_ar: 'منية النصر', slug: 'minyat-alnasr', sort: 2 },
  { id: 5, parent_id: 1, type: 'center', name_ar: 'مركز المنصورة', slug: 'mansoura-center', sort: 2 },
  { id: 6, parent_id: 5, type: 'city', name_ar: 'المنصورة', slug: 'mansoura', sort: 1 },
]

// [slug, الاسم, كلمات البحث]
export const categories = [
  {
    slug: 'health', name_ar: 'صحة وتمريض منزلي', icon: 'Stethoscope', tone: 'lime',
    description: 'تمريض وحقن وغيار على الجروح في البيت',
    subs: [
      ['home-nursing', 'تمريض منزلي', ['ممرض', 'ممرضه', 'تمريض', 'تمرجي']],
      ['injections', 'حقن ومحاليل وكانيولا', ['حقنه', 'حقن', 'محلول', 'كانيولا', 'سرنجه']],
      ['wound-care', 'غيار على الجروح', ['غيار', 'جرح', 'حروق', 'قدم سكري']],
      ['vitals', 'قياس ضغط وسكر', ['ضغط', 'سكر']],
      ['home-physio', 'علاج طبيعي في البيت', ['علاج طبيعي', 'مساج', 'تأهيل']],
      ['patient-companion', 'مرافق مريض', ['مرافق', 'مستشفى', 'سهر مع مريض']],
    ],
  },
  {
    slug: 'care', name_ar: 'رعاية وجليسات', icon: 'HeartHandshake', tone: 'lavender',
    description: 'رعاية كبار السن والأطفال وذوي الهمم',
    subs: [
      ['elderly-care', 'رعاية مسنين', ['مسن', 'كبار السن', 'جليس', 'جليسه']],
      ['babysitter', 'جليسة أطفال', ['اطفال', 'بيبي', 'عيال', 'حضانه']],
      ['special-needs', 'رعاية ذوي الهمم', ['ذوي الهمم', 'اعاقه', 'توحد']],
      ['home-helper', 'مساعدة منزلية', ['شغاله', 'مساعده في البيت']],
    ],
  },
  {
    slug: 'quran', name_ar: 'تحفيظ قرآن', icon: 'BookOpenText', tone: 'dark',
    description: 'تحفيظ وتجويد للكبار والصغار',
    subs: [
      ['quran-memorization', 'تحفيظ قرآن', ['قران', 'قرآن', 'تحفيظ', 'شيخ', 'محفظ', 'محفظه', 'كتاب']],
      ['tajweed', 'تجويد وتلاوة', ['تجويد', 'تلاوه', 'احكام']],
      ['islamic-lessons', 'تعليم الصلاة ودروس دينية', ['صلاه', 'فقه', 'دين']],
    ],
  },
  {
    slug: 'education', name_ar: 'تعليم ودروس', icon: 'GraduationCap', tone: 'sky',
    description: 'دروس خصوصية ولغات وكمبيوتر',
    subs: [
      ['tutoring-primary', 'دروس ابتدائي', ['ابتدائي', 'مدرس', 'مدرسه', 'درس']],
      ['tutoring-prep', 'دروس إعدادي', ['اعدادي', 'مدرس', 'درس']],
      ['tutoring-secondary', 'دروس ثانوي', ['ثانوي', 'ثانويه عامه', 'مدرس']],
      ['reading-basics', 'تأسيس قراية وكتابة', ['تاسيس', 'قرايه', 'كتابه', 'حروف']],
      ['english', 'لغة إنجليزي', ['انجليزي', 'english', 'لغات']],
      ['computer-courses', 'كورسات كمبيوتر', ['كمبيوتر', 'icdl', 'وورد', 'اكسل']],
      ['literacy', 'محو أمية', ['محو اميه', 'تعليم كبار']],
    ],
  },
  {
    slug: 'home', name_ar: 'خدمات البيت', icon: 'SprayCan', tone: 'lavender',
    description: 'تنظيف وغسيل سجاد ومكوة',
    subs: [
      ['house-cleaning', 'تنظيف منازل', ['تنظيف', 'نضافه', 'تنضيف']],
      ['post-construction', 'تنظيف بعد التشطيب', ['تشطيب', 'بعد البنا']],
      ['carpet-washing', 'غسيل سجاد', ['سجاد', 'موكيت', 'سجاجيد']],
      ['laundry', 'غسيل ومكوة', ['مكوه', 'كي', 'غسيل هدوم']],
    ],
  },
  {
    slug: 'maintenance', name_ar: 'صيانة وحِرف', icon: 'Wrench', tone: 'coral',
    description: 'كهربا وسباكة ونقاشة ونجارة',
    subs: [
      ['electrician', 'كهربائي', ['كهربا', 'كهرباء', 'كهربائي', 'لمبه', 'فيشه', 'نور']],
      ['plumber', 'سباك', ['سباكه', 'مواسير', 'حنفيه', 'تسريب', 'سيفون']],
      ['painter', 'نقاش', ['نقاشه', 'دهان', 'بويه', 'محاره']],
      ['carpenter', 'نجار', ['نجاره', 'خشب', 'باب', 'دولاب']],
      ['blacksmith', 'حداد', ['حداده', 'شباك', 'بوابه', 'لحام']],
      ['ac-appliances', 'فني تكييف وأجهزة', ['تكييف', 'تلاجه', 'غساله', 'سخان', 'بوتاجاز']],
      ['satellite', 'تركيب دش', ['دش', 'ريسيفر', 'طبق']],
      ['tiles', 'سيراميك وبلاط', ['سيراميك', 'بلاط', 'بورسلين']],
    ],
  },
  {
    slug: 'transport', name_ar: 'مواصلات ومشاوير', icon: 'CarTaxiFront', tone: 'lime',
    description: 'توكتوك وعربيات وتوصيل طلبات',
    subs: [
      ['tuktuk', 'توكتوك', ['توك توك', 'توكتوك']],
      ['delivery-bike', 'موتوسيكل توصيل طلبات', ['دليفري', 'توصيل', 'موتوسيكل', 'موتسيكل']],
      ['car-trips', 'عربية مشاوير ورحلات', ['عربيه', 'ملاكي', 'رحله', 'سفر', 'مشوار']],
      ['cargo-tricycle', 'تروسيكل وربع نقل', ['تروسيكل', 'ربع نقل', 'نص نقل']],
    ],
  },
  {
    slug: 'moving', name_ar: 'نقل وعفش', icon: 'Truck', tone: 'dark',
    description: 'نقل أثاث وفك وتركيب وتحميل',
    subs: [
      ['furniture-moving', 'نقل عفش', ['عفش', 'اثاث', 'نقل']],
      ['furniture-assembly', 'فك وتركيب أثاث', ['فك', 'تركيب', 'دولاب', 'سرير']],
      ['loading', 'تحميل وتنزيل بضائع', ['شيال', 'تحميل', 'تنزيل']],
    ],
  },
  {
    slug: 'women-home', name_ar: 'شغل الستات من البيت', icon: 'Scissors', tone: 'coral',
    description: 'خياطة وكروشيه وحلويات وأكل بيتي',
    subs: [
      ['tailoring', 'خياطة وتفصيل', ['خياطه', 'تفصيل', 'ترزي', 'خياطه']],
      ['crochet', 'كروشيه ومشغولات يدوية', ['كروشيه', 'هاند ميد', 'تريكو']],
      ['sweets', 'حلويات ومخبوزات بيتي', ['كيك', 'حلويات', 'مخبوزات', 'كحك', 'بسكوت']],
      ['home-food', 'أكل بيتي', ['اكل', 'طبيخ', 'محشي', 'وجبات']],
      ['pickles-cheese', 'جبنة ومخللات بيتي', ['جبنه', 'مش', 'مخلل', 'زبده']],
    ],
  },
  {
    slug: 'beauty', name_ar: 'تجميل وعناية', icon: 'Sparkles', tone: 'lavender',
    description: 'كوافيرة وميكب وحنة وحلاق في البيت',
    subs: [
      ['ladies-hair', 'كوافيرة حريمي', ['كوافير', 'كوافيره', 'شعر']],
      ['makeup', 'ميكب آرتست', ['ميكب', 'مكياج', 'عروسه']],
      ['henna', 'رسم حنة', ['حنه', 'حنا', 'نقش']],
      ['barber', 'حلاق رجالي في البيت', ['حلاق', 'حلاقه', 'دقن']],
    ],
  },
  {
    slug: 'work', name_ar: 'مساعدة في الشغل', icon: 'Briefcase', tone: 'sky',
    description: 'أسيستانت عيادة وسكرتارية وكاشير',
    subs: [
      ['clinic-assistant', 'أسيستانت عيادة', ['عياده', 'اسنان', 'اسيستنت', 'مساعد دكتور']],
      ['pharmacy-assistant', 'مساعد صيدلي', ['صيدليه', 'صيدلي']],
      ['secretary', 'سكرتارية واستقبال', ['سكرتيره', 'سكرتير', 'استقبال']],
      ['cashier', 'كاشير', ['كاشير', 'خزنه']],
      ['sales-rep', 'مندوب مبيعات', ['مندوب', 'مبيعات', 'سيلز']],
      ['accountant', 'محاسب', ['حسابات', 'محاسبه']],
    ],
  },
  {
    slug: 'agriculture', name_ar: 'زراعة ومواشي', icon: 'Wheat', tone: 'lime',
    description: 'عمالة زراعية ورش ورعاية مواشي',
    subs: [
      ['farm-labor', 'عمالة زراعية يومية', ['انفار', 'فاعل', 'يوميه', 'عمال']],
      ['pesticide', 'رش مبيدات', ['رش', 'مبيد', 'مبيدات']],
      ['harvest', 'جمع محاصيل', ['حصاد', 'جمع', 'قطن', 'رز', 'دره']],
      ['livestock', 'رعاية مواشي', ['مواشي', 'بهايم', 'جاموس', 'بقر']],
      ['veterinary', 'بيطري وتحصين', ['بيطري', 'تحصين', 'دكتور بهايم']],
    ],
  },
  {
    slug: 'digital', name_ar: 'ديجيتال وتقنية', icon: 'Smartphone', tone: 'dark',
    description: 'صيانة موبايلات وتصميم ومونتاج',
    subs: [
      ['phone-repair', 'صيانة موبايلات', ['موبايل', 'شاشه', 'سوفت وير']],
      ['computer-repair', 'صيانة كمبيوتر ولابتوب', ['لابتوب', 'ويندوز', 'كمبيوتر']],
      ['graphic-design', 'تصميم جرافيك', ['تصميم', 'لوجو', 'بوستر']],
      ['video-editing', 'مونتاج فيديو', ['مونتاج', 'فيديو']],
      ['social-media', 'إدارة صفحات سوشيال', ['فيسبوك', 'صفحه', 'سوشيال', 'اعلانات']],
    ],
  },
  {
    slug: 'events', name_ar: 'مناسبات وأفراح', icon: 'PartyPopper', tone: 'coral',
    description: 'تصوير وطباخ وفراشة ودي جي',
    subs: [
      ['photography', 'تصوير أفراح ومناسبات', ['تصوير', 'مصور', 'فوتوجرافر', 'فرح']],
      ['event-cook', 'طباخ أفراح وعزايم', ['طباخ', 'عزومه', 'ولايم']],
      ['event-setup', 'فراشة وتجهيز', ['فراشه', 'صوان', 'كراسي', 'كوشه']],
      ['dj', 'دي جي وصوتيات', ['دي جي', 'dj', 'سماعات']],
    ],
  },
  {
    slug: 'errands', name_ar: 'مصالح وطلبات', icon: 'ClipboardList', tone: 'sky',
    description: 'طلبات السوق والفواتير والأوراق',
    subs: [
      ['market-shopping', 'شراء طلبات من السوق', ['طلبات', 'سوق', 'خضار', 'مشتريات']],
      ['bill-payment', 'دفع فواتير', ['فاتوره', 'فواتير', 'شحن', 'غاز']],
      ['gov-papers', 'إنهاء أوراق حكومية', ['اوراق', 'شهر عقاري', 'سجل مدني', 'تموين', 'مصلحه']],
      ['clinic-booking', 'حجز كشوفات', ['حجز', 'كشف', 'دكتور']],
    ],
  },
]

// IDs ثابتة: الفئة رقم n ← n ، والخدمة الفرعية ← n*100 + ترتيبها
export const categoryRows = categories.map((c, i) => ({
  id: i + 1, slug: c.slug, name_ar: c.name_ar, description: c.description, icon: c.icon, tone: c.tone, sort: i + 1,
}))

export const subcategoryRows = categories.flatMap((c, i) =>
  c.subs.map(([slug, name_ar, keywords], j) => ({
    id: (i + 1) * 100 + j + 1, category_id: i + 1, slug, name_ar, keywords, sort: j + 1,
  })),
)

const ALL_WEEK = [0, 1, 2, 3, 4, 5, 6]
const NO_FRIDAY = [0, 1, 2, 3, 4, 6]

// بيانات تجريبية — الأرقام وهمية (0100000xxxx). امسحها قبل الإطلاق.
export const demoProviders = [
  {
    slug: 'home-nursing-souad', name: 'سعاد عبد الحميد', gender: 'female', women_service: true,
    services: ['home-nursing', 'injections', 'vitals', 'wound-care'], home: 'bagalat', areas: ['bagalat', 'minyat-alnasr'],
    bio: 'ممرضة بخبرة 12 سنة في مستشفى منية النصر المركزي. بعمل حقن ومحاليل وغيار على الجروح وقياس ضغط وسكر في البيت، وبتعامل مع كبار السن بهدوء وصبر.',
    schedule: { days: ALL_WEEK, from: '08:00', to: '22:00' }, price_note: 'الحقنة من 20 جنيه، والزيارة حسب المشوار',
    is_verified: true, joined_at: '2026-10-29', show_phone: true,
  },
  {
    slug: 'electrician-mahmoud', name: 'محمود السيد الشربيني', gender: 'male',
    services: ['electrician', 'satellite'], home: 'bagalat', areas: ['bagalat', 'minyat-alnasr-center'],
    bio: 'كهربائي منازل: تأسيس وتشطيب، تركيب نجف وسخانات، وتصليح أي عطل. وبركّب أطباق دش كمان.',
    schedule: { days: NO_FRIDAY, from: '09:00', to: '20:00' }, price_note: 'المعاينة ببلاش جوه البلد',
    is_verified: true, joined_at: '2026-10-25', show_phone: true,
  },
  {
    slug: 'quran-abdelrahman', name: 'الشيخ عبد الرحمن فتحي', gender: 'male',
    services: ['quran-memorization', 'tajweed', 'islamic-lessons'], home: 'bagalat', areas: ['bagalat'],
    bio: 'حاصل على إجازة في حفص عن عاصم. تحفيظ للأطفال من 5 سنين وللكبار، في المسجد أو في البيت.',
    schedule: { days: [6, 0, 1, 2, 3], from: '16:00', to: '21:00' }, price_note: 'الشهر 150 جنيه للطفل',
    is_verified: true, joined_at: '2026-10-20', show_phone: true,
  },
  {
    slug: 'tutoring-heba', name: 'أ. هبة مصطفى', gender: 'female', women_service: true,
    services: ['tutoring-primary', 'reading-basics'], home: 'bagalat', areas: ['bagalat'],
    bio: 'مدرسة لغة عربية. بأسّس الأطفال في القراية والكتابة وبتابع واجبات ابتدائي كله. مجموعات صغيرة في بيتي.',
    schedule: { days: [6, 0, 1, 2, 3], from: '14:00', to: '20:00' }, price_note: 'الحصة 40 جنيه',
    is_verified: true, joined_at: '2026-10-28', show_phone: false,
  },
  {
    slug: 'english-ahmed', name: 'مستر أحمد عادل', gender: 'male',
    services: ['english', 'tutoring-prep'], home: 'minyat-alnasr', areas: ['bagalat', 'minyat-alnasr'],
    bio: 'مدرس لغة إنجليزي لإعدادي وثانوي، وكورسات محادثة للكبار.',
    schedule: { days: NO_FRIDAY, from: '15:00', to: '22:00' }, price_note: null,
    is_verified: false, joined_at: '2026-10-15', show_phone: true,
  },
  {
    slug: 'tuktuk-karim', name: 'كريم حسن', gender: 'male',
    services: ['tuktuk', 'market-shopping'], home: 'bagalat', areas: ['bagalat', 'minyat-alnasr'],
    bio: 'توكتوك جديد ونضيف. مشاوير جوه البلد ولمنية النصر، وبجيب طلبات من السوق.',
    schedule: { days: ALL_WEEK, from: '07:00', to: '23:59' }, price_note: 'المشوار جوه البلد 10 جنيه',
    is_verified: true, joined_at: '2026-10-30', show_phone: true,
  },
  {
    slug: 'tailoring-mona', name: 'منى إبراهيم', gender: 'female', women_service: true,
    services: ['tailoring', 'crochet'], home: 'bagalat', areas: ['bagalat'],
    bio: 'تفصيل عبايات وجلاليب وفساتين، وتقصير وتضييق. وشغل كروشيه للأطفال.',
    schedule: { days: NO_FRIDAY, from: '10:00', to: '19:00' }, price_note: null,
    is_verified: true, joined_at: '2026-10-22', show_phone: false,
  },
  {
    slug: 'sweets-naglaa', name: 'نجلاء (أم يوسف)', gender: 'female', women_service: true,
    services: ['sweets', 'home-food'], home: 'bagalat', areas: ['bagalat', 'minyat-alnasr'],
    bio: 'كحك وبسكوت وكيك بيتي، وأكل بيتي للعزايم: محشي وممبار وبط. الطلب قبلها بيوم.',
    schedule: { days: ALL_WEEK, from: '09:00', to: '21:00' }, price_note: 'كيلو الكحك 180 جنيه',
    is_verified: true, joined_at: '2026-10-31', show_phone: true,
  },
  {
    slug: 'plumber-hossam', name: 'حسام الدين علي', gender: 'male',
    services: ['plumber', 'ac-appliances'], home: 'bagalat', areas: ['bagalat', 'minyat-alnasr-center'],
    bio: 'سباك: تأسيس حمامات ومطابخ، تصليح تسريب، تركيب سخانات وفلاتر مية.',
    schedule: { days: NO_FRIDAY, from: '08:00', to: '18:00' }, price_note: null,
    is_verified: true, joined_at: '2026-10-18', show_phone: true,
  },
  {
    slug: 'clinic-assistant-sara', name: 'سارة عادل', gender: 'female', women_service: true,
    services: ['clinic-assistant', 'secretary'], home: 'bagalat', areas: ['bagalat', 'minyat-alnasr', 'mansoura'],
    bio: 'خريجة معهد فني صحي، اشتغلت سنتين أسيستانت في عيادة أسنان. بدور على شغل في عيادة أو مركز طبي.',
    schedule: { days: NO_FRIDAY, from: '10:00', to: '22:00' }, price_note: null,
    is_verified: true, joined_at: '2026-10-26', show_phone: false,
  },
  {
    slug: 'moving-yasser', name: 'ياسر عبد الله', gender: 'male',
    services: ['furniture-moving', 'furniture-assembly', 'cargo-tricycle'], home: 'bagalat', areas: ['dakahlia'],
    bio: 'نقل عفش بربع نقل ومعايا عمال للتحميل، وفك وتركيب دواليب وغرف نوم. بنقل لأي حتة في الدقهلية.',
    schedule: { days: ALL_WEEK, from: '07:00', to: '20:00' }, price_note: 'حسب المسافة وعدد القطع',
    is_verified: true, joined_at: '2026-10-12', show_phone: true,
  },
  {
    slug: 'elderly-care-fatma', name: 'فاطمة الزهراء محمد', gender: 'female', women_service: true,
    services: ['elderly-care', 'patient-companion', 'babysitter'], home: 'bagalat', areas: ['bagalat', 'minyat-alnasr'],
    bio: 'برعى كبار السن في البيت أو برافقهم في المستشفى، وعندي خبرة مع مرضى الجلطات. ينفع نهاري أو ليلي.',
    schedule: { days: ALL_WEEK, from: '00:00', to: '23:59' }, price_note: 'اليوم أو الشهر بالاتفاق',
    is_verified: true, joined_at: '2026-10-27', show_phone: true,
  },
  {
    slug: 'phone-repair-amr', name: 'عمرو جمال', gender: 'male',
    services: ['phone-repair', 'computer-repair', 'graphic-design'], home: 'bagalat', areas: ['bagalat'],
    bio: 'تغيير شاشات وبطاريات، سوفت وير، وتصميم كروت ولافتات للمحلات.',
    schedule: { days: NO_FRIDAY, from: '12:00', to: '23:00' }, price_note: null,
    is_verified: false, joined_at: '2026-10-10', show_phone: true,
  },
  {
    slug: 'farm-labor-saeed', name: 'الحاج سعيد المتولي', gender: 'male',
    services: ['farm-labor', 'pesticide', 'harvest'], home: 'bagalat', areas: ['minyat-alnasr-center'],
    bio: 'مقاول أنفار: عندي 15 عامل للزراعة والحصاد، وموتور رش للمبيدات.',
    schedule: { days: ALL_WEEK, from: '05:00', to: '17:00' }, price_note: 'اليومية حسب الشغلانة',
    is_verified: true, joined_at: '2026-10-08', show_phone: true,
  },
  {
    slug: 'beauty-dina', name: 'دينا محمود', gender: 'female', women_service: true,
    services: ['ladies-hair', 'makeup', 'henna'], home: 'minyat-alnasr', areas: ['bagalat', 'minyat-alnasr'],
    bio: 'ميكب عرايس وسهرات، وتسريحات، ورسم حنة. بروح البيت للستات بس.',
    schedule: { days: ALL_WEEK, from: '11:00', to: '23:00' }, price_note: null,
    is_verified: true, joined_at: '2026-10-24', show_phone: false,
  },
  {
    slug: 'photography-eslam', name: 'إسلام رضا', gender: 'male',
    services: ['photography', 'video-editing'], home: 'bagalat', areas: ['dakahlia'],
    bio: 'تصوير أفراح وخطوبات وأعياد ميلاد، فوتو وفيديو، والألبوم بيتسلم خلال أسبوعين.',
    schedule: { days: ALL_WEEK, from: '12:00', to: '23:59' }, price_note: null,
    is_verified: true, joined_at: '2026-10-14', show_phone: true,
  },
  {
    slug: 'errands-mostafa', name: 'مصطفى عبده', gender: 'male',
    services: ['gov-papers', 'bill-payment', 'delivery-bike'], home: 'bagalat', areas: ['bagalat', 'minyat-alnasr', 'mansoura'],
    bio: 'بخلّص أوراقك في السجل المدني والشهر العقاري والتموين، وبدفع الفواتير، وبوصّل طلبات بالموتوسيكل.',
    schedule: { days: [6, 0, 1, 2, 3], from: '08:00', to: '16:00' }, price_note: 'المشوار من 30 جنيه',
    is_verified: false, joined_at: '2026-10-21', show_phone: true,
  },
  {
    slug: 'veterinary-shennawy', name: 'د. محمد الشناوي', gender: 'male',
    services: ['veterinary', 'livestock'], home: 'minyat-alnasr', areas: ['minyat-alnasr-center'],
    bio: 'طبيب بيطري. تحصينات وكشف على المواشي في الزريبة، وولادات بالليل.',
    schedule: { days: ALL_WEEK, from: '08:00', to: '22:00' }, price_note: null,
    is_verified: true, joined_at: '2026-10-16', show_phone: true,
  },
].map((p, i) => ({
  id: i + 1,
  women_service: false,
  is_featured: false,
  featured_until: null,
  photo_url: null,
  status: 'active',
  phone: `0100000${String(i + 1).padStart(4, '0')}`,
  whatsapp: `0100000${String(i + 1).padStart(4, '0')}`,
  ...p,
}))
