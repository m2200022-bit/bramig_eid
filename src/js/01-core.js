/* ============ Storage & State ============ */
/* Backed by Firebase Firestore — document: appState/main
   البيانات مخزّنة كنص JSON داخل الحقل json، والاتصال مباشر من المتصفح
   بدون أي دوال serverless. */
let state = null;
/* تصنيف مكان المبادرة الموحّد: مراحل دراسية للمدارس الحكومية + أنواع جهات أخرى */
const LOCATION_TYPES = ['مدرسة','مدارس حكومية','مدارس خاصة','نادي','مركز','استراحة','جامعة','مكان عام','ابتدائي','إعدادي','ثانوي','خاصة','غير ذلك'];
/* يربط تصنيف "مكان التنفيذ" بقيم level المخزّنة (يقبل التسمية الجديدة والقديمة معًا) */
/* جدول الحصص المدرسية — عند اختيار حصة يُعبَّأ وقت المبادرة تلقائيًا */
const SCHOOL_PERIODS = [
  {name:'الحصة الأولى',   from:'07:00', to:'07:55'},
  {name:'الحصة الثانية',  from:'07:55', to:'08:40'},
  {name:'الحصة الثالثة',  from:'08:40', to:'09:20'},
  {name:'الحصة الرابعة',  from:'09:20', to:'10:00'},
  {name:'الحصة الخامسة',  from:'10:00', to:'10:40'},
  {name:'الحصة السادسة',  from:'11:10', to:'11:50'},
  {name:'الحصة السابعة',  from:'12:05', to:'12:45'},
];
function levelsForPlaceType(typeName){
  const map = {
    'مدرسة': ['مدرسة','مدارس حكومية','مدارس خاصة','ابتدائي','إعدادي','ثانوي','خاصة'],
    'مدارس حكومية': ['مدارس حكومية','ابتدائي','إعدادي','ثانوي'],
    'مدارس خاصة': ['مدارس خاصة','خاصة'],
    'نادي': ['نادي'],
    'مركز': ['مركز'],
    'استراحة': ['استراحة'],
    'جامعة': ['جامعة'],
    'مكان عام': ['مكان عام','غير ذلك'],
  };
  return map[typeName] || [];
}
/* الاتجاه المعاكس: يحوّل level المدرسة إلى اسم تصنيف "مكان التنفيذ" لعرضه في التقارير */
function placeTypeLabel(level){
  // القيم المخزّنة بتسمية "مكان التنفيذ" تُعاد كما هي
  if(['مدرسة','مدارس حكومية','مدارس خاصة','نادي','مركز','استراحة','جامعة','مكان عام'].includes(level)) return level;
  // توافق مع القيم القديمة (المراحل الدراسية)
  if(['ابتدائي','إعدادي','ثانوي'].includes(level)) return 'مدارس حكومية';
  if(level==='خاصة') return 'مدارس خاصة';
  if(level==='نادي') return 'نادي';
  if(level==='مركز') return 'مركز';
  if(level==='استراحة') return 'استراحة';
  return 'مكان عام';
}
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

function defaultState(){
  return {
    orgName:'إدارة الفعاليات', logo:'',
    printHeader:{ line1:'مؤسسة عيد الخيرية', line2:'مركز عيد الثقافي', line3:'قسم البرامج المجتمعية' },
    nextSerial:1,
    venues:['مركز عيد الثقافي - دحل الحمام','مخيم أم العمد','عزبة سمسمة'].map(name=>({id:uid(), name})),
    fields:[
      {id:uid(), name:'طلب إداري'},{id:uid(), name:'ثقافي إجتماعي صحي'},{id:uid(), name:'البرامج القيمية الترفيهية'},
      {id:uid(), name:'ثقافي تنافسي'},{id:uid(), name:'ثقافي تطوير معرفي'},{id:uid(), name:'البرامج القيمية - المصلى المتنقل'},
      {id:uid(), name:'البرامج القيمية'},{id:uid(), name:'الأنشطة النوعية'},
    ],
    programTypes:[{id:uid(), name:'حملات'},{id:uid(), name:'مدارك'},{id:uid(), name:'مواهب ومسابقات'},{id:uid(), name:'صحبة'}],
    schools:[
      {id:uid(), name:'مدرسة الشمال الابتدائية', level:'ابتدائي', supervisors:[{id:uid(), name:'أ. خالد المري', phone:'55511111', email:'khaled@example.com'}]},
      {id:uid(), name:'مدرسة عبدالله بن زيد آل محمود', level:'إعدادي', supervisors:[{id:uid(), name:'أ. سعد العبدالله', phone:'55522222', email:'saad@example.com'}]},
      {id:uid(), name:'مدرسة اليرموك الإعدادية', level:'إعدادي', supervisors:[{id:uid(), name:'أ. محمد الكواري', phone:'55533333', email:'mohd@example.com'}]},
    ],
    trainers:(function(){ const t1=uid(), t2=uid(); window.__seedTrainerIds=[t1,t2]; return [{id:t1, name:'أ. أحمد النعيمي', phone:'55011122'},{id:t2, name:'أ. فيصل السليطي', phone:'55033344'}]; })(),
    adminRequestsList:[
      {id:uid(), name:'توفير سيارة', category:'إداري'},
      {id:uid(), name:'حجز مخيم', category:'إداري'},
      {id:uid(), name:'حجز استراحة المؤسسة', category:'إداري'},
      {id:uid(), name:'توفير مندوب لإيصال المدرب', category:'إداري'},
      {id:uid(), name:'تصوير وتوثيق', category:'إعلامي'},
      {id:uid(), name:'مونتاج', category:'إعلامي'},
      {id:uid(), name:'تغذية', category:'ضيافة'},
      {id:uid(), name:'قفشات ومياه', category:'ضيافة'},
    ],
    placeTypes:[
      {id:uid(), name:'مدرسة'},
      {id:uid(), name:'مدارس حكومية'},
      {id:uid(), name:'مدارس خاصة'},
      {id:uid(), name:'نادي'},
      {id:uid(), name:'مركز'},
      {id:uid(), name:'استراحة'},
      {id:uid(), name:'جامعة'},
      {id:uid(), name:'مكان عام'},
    ],
    users:[
      {id:uid(), username:'admin', password:'admin123', role:'admin', trainerId:'', displayName:'مدير النظام', active:true},
      {id:uid(), username:'user', password:'user123', role:'user', trainerId:'', displayName:'مستخدم النظام', active:true},
      {id:uid(), username:'trainer1', password:'trainer123', role:'trainer', trainerId:window.__seedTrainerIds[0], displayName:'أ. أحمد النعيمي', active:true},
      {id:uid(), username:'trainer2', password:'trainer123', role:'trainer', trainerId:window.__seedTrainerIds[1], displayName:'أ. فيصل السليطي', active:true},
    ],
    orders:[], trainerRequests:[], notifications:[], adminNotifications:[], reminderFlags:{}, tasks:[], quranActivities:[]
  };
}
/* ══════════════════════════════════════════════════════════════════
   ⚠️ تحذير لأي أداة ذكاء اصطناعي أو مطوّر يعدّل هذا الملف ⚠️
   ══════════════════════════════════════════════════════════════════
   هذا الموقع منشور فعليًا (Live)، والدالتان أدناه (loadState و saveState)
   متصلتان بقاعدة بيانات حقيقية: Firebase Firestore — مستند appState/main
   وهذا هو ما يجعل البيانات محفوظة ومشتركة بين كل المستخدمين.

   ✘ لا تستبدل Firestore بـ window.storage.get/set إطلاقًا
     (window.storage تعمل فقط داخل معاينة claude.ai ولا تعمل على
     الموقع المنشور فعليًا — استخدامها هنا سيوقف الحفظ تمامًا).
   ✘ لا تستخدم localStorage أو sessionStorage كبديل أيضًا
     (بيانات محلية للمتصفح فقط، غير مشتركة بين المستخدمين).
   ✔ إن احتجت تغيير منطق التطبيق (البيانات، الحقول، الواجهة) عدّل
     بحرية في أي مكان آخر من الملف، فقط لا تلمس آلية الحفظ نفسها.
   ══════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════
   آلية الحفظ: Firebase Firestore
   البيانات كلها محفوظة في مستند واحد مشترك:  appState/main
   لا حاجة لأي دوال serverless — الاتصال يتم مباشرة من المتصفح.
   ══════════════════════════════════════════════════════════════════ */
const firebaseConfig = {
  apiKey: "AIzaSyAYn7DzTC03I7Q_My7xuJD33ELQwwuhe84",
  authDomain: "droub-55931.firebaseapp.com",
  projectId: "droub-55931",
  storageBucket: "droub-55931.firebasestorage.app",
  messagingSenderId: "183460755575",
  appId: "1:183460755575:web:7c17ff7ed58249da8b2e72",
  measurementId: "G-58BHQKNGS9"
};
let __db = null;
function getDb(){
  if(__db) return __db;
  if(typeof firebase === 'undefined'){ throw new Error('Firebase SDK لم يتم تحميله'); }
  if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  __db = firebase.firestore();
  return __db;
}
const STATE_DOC = () => getDb().collection('appState').doc('main');

/* ══════════════════════════════════════════════════════════════════
   تشخيص أخطاء الاتصال بقاعدة البيانات
   ──────────────────────────────────────────────────────────────────
   كانت الرسالة تعرض نص الخطأ الإنجليزي الخام من Firebase، وهو لا يدلّ
   المستخدم على شيء. هنا نترجم كل حالة إلى سببها وعلاجها.
   ══════════════════════════════════════════════════════════════════ */
const FB_ERRORS = {
  'unavailable': {
    why:'تعذّر الوصول إلى خادم قاعدة البيانات.',
    fix:'غالبًا انقطاع إنترنت مؤقّت أو حجب من الشبكة. تأكّد من الاتصال ثم أعد المحاولة.',
    transient:true },
  'deadline-exceeded': {
    why:'انتهت مهلة الاتصال قبل وصول البيانات.',
    fix:'الشبكة بطيئة. أعد المحاولة، وإن تكرّر فجرّب شبكة أخرى.',
    transient:true },
  'internal': {
    why:'خطأ مؤقّت في خدمة قاعدة البيانات.',
    fix:'أعد المحاولة بعد لحظات.', transient:true },
  'permission-denied': {
    why:'قاعدة البيانات رفضت القراءة (قواعد الأمان).',
    fix:'سجّل الخروج ثم ادخل من جديد (البيانات محمية ولا تُقرأ إلا بعد الدخول).\n'
      + '       إن استمر: تحقق أن حسابك مفعّل ومُرحَّل في الإعدادات ← الأمان.' },
  'unauthenticated': {
    why:'الطلب غير موثّق.',
    fix:'راجع قواعد Firestore — قد تشترط تسجيل دخول.' },
  'not-found': {
    why:'لم يُعثر على قاعدة البيانات أو المشروع.',
    fix:'تأكّد أن مشروع Firebase ما زال قائمًا وأن Firestore مُفعّل فيه.' },
  'failed-precondition': {
    why:'خدمة Firestore غير مُهيّأة في المشروع.',
    fix:'افتح Firebase Console وفعّل Firestore Database.' },
  'resource-exhausted': {
    why:'تجاوزت حصّة الاستخدام المجانية لليوم.',
    fix:'انتظر إعادة ضبط الحصّة (منتصف الليل بتوقيت المحيط الهادئ) أو فعّل الفوترة.' },
  'cancelled': { why:'أُلغي الطلب قبل اكتماله.', fix:'أعد المحاولة.', transient:true },
};
function describeFbError(e){
  const code = String((e && e.code) || '').replace(/^firestore\//,'');
  const known = FB_ERRORS[code];
  if(known) return { code, ...known };
  const msg = String((e && e.message) || e || '');
  /* الحجب من إضافة متصفح أو جدار ناري يظهر كفشل شبكة دون رمز */
  if(/network|fetch|Failed to get document|offline|ERR_/i.test(msg)){
    return { code: code||'network',
      why:'لم يصل الطلب إلى الخادم أصلًا.',
      fix:'تحقّق من الإنترنت، وجرّب تعطيل مانع الإعلانات أو إضافات الخصوصية،\n'
        + '       فبعضها يحجب googleapis.com. جرّب أيضًا نافذة تصفّح خفي.',
      transient:true };
  }
  return { code: code||'unknown', why:'خطأ غير متوقّع.', fix:'أعد المحاولة، وإن تكرّر فأرسل نص الخطأ للمطوّر.', raw:msg };
}

/* فحص اتصال متدرّج — يُشغّل من زر «فحص الاتصال» */
async function diagnoseConnection(){
  const steps = [];
  const add = (ok, label, note)=>steps.push({ok, label, note:note||''});

  add(navigator.onLine, 'اتصال الجهاز بالإنترنت',
      navigator.onLine ? '' : 'المتصفح يرى الجهاز غير متصل');

  /* هل يصل المتصفح إلى نطاق Google أصلًا؟ (يكشف الحجب بالإضافات والجدار الناري) */
  let reach = false;
  try{
    await fetch('https://firestore.googleapis.com/', {mode:'no-cors', cache:'no-store'});
    reach = true;
  }catch(e){ reach = false; }
  add(reach, 'الوصول إلى نطاق googleapis.com',
      reach ? '' : 'محجوب — غالبًا مانع إعلانات أو إضافة خصوصية أو جدار ناري');

  /* القراءة الفعلية من المستند */
  let readOk = false, detail = '';
  try{
    const snap = await STATE_DOC().get();
    readOk = true;
    if(snap.exists){
      const raw = snap.data() || {};
      const n = raw.json ? JSON.parse(raw.json) : null;
      detail = n ? `${(n.orders||[]).length} فعالية · ${(n.schools||[]).length} جهة`
                 + (raw.updatedAt ? ` · آخر تحديث ${new Date(raw.updatedAt).toLocaleString('ar')}` : '')
                 : 'المستند موجود لكنه فارغ';
    } else detail = 'المستند غير موجود (أول تشغيل)';
  }catch(e){
    const d = describeFbError(e);
    detail = `[${d.code}] ${d.why}\n       ${d.fix}`;
  }
  add(readOk, 'قراءة البيانات من Firestore', detail);

  const allOk = steps.every(s=>s.ok);
  alert('فحص الاتصال بقاعدة البيانات\n'
    + '══════════════════════════════\n\n'
    + steps.map(s=>`${s.ok?'✅':'❌'} ${s.label}${s.note?'\n       '+s.note:''}`).join('\n\n')
    + '\n\n' + (allOk
        ? '✅ الاتصال سليم. إن كان الحفظ متوقّفًا فاضغط «إعادة المحاولة».'
        : '⚠ عالج البند المعلّم بـ ❌ ثم أعد المحاولة.')
    + '\n\nالمشروع: ' + (firebaseConfig && firebaseConfig.projectId || '—'));
  return allOk;
}

/* إعادة محاولة القراءة دون إعادة تحميل الصفحة */
async function retryConnection(){
  toast('جارٍ إعادة المحاولة...');
  __readFailed = false; __docExisted = false;
  try{
    await loadState();
    if(!__readFailed){ toast('✅ تم الاتصال — الحفظ مُفعّل الآن'); render(); return true; }
  }catch(e){ __readFailed = true; }
  toast('⚠️ ما زال الاتصال متعذّرًا');
  render();
  return false;
}

async function loadState(){
  try{
    const snap = await STATE_DOC().get();
    syncState.ok = true; syncState.lastAt = Date.now();
    if(snap.exists){
      __docExisted = true;
      const raw = snap.data();
      // البيانات مخزّنة كنص JSON لتفادي قيود Firestore على المصفوفات المتداخلة
      state = raw && raw.json ? JSON.parse(raw.json) : null;
      if(state){ __rememberBase(raw.json, raw.updatedAt); }
    }
    if(state){
      if(!state.printHeader) state.printHeader={line1:'مؤسسة عيد الخيرية',line2:'مركز عيد الثقافي',line3:'قسم البرامج المجتمعية'};
      { const D = {slogan:'معاً.. نبنى جيل المستقبل', email:'cultural@eidcharity.net', phone:'5560 7826', city:'الدوحة - قطر', web:'www.eidcharity.net'};
        Object.keys(D).forEach(k=>{ if(state.printHeader[k]===undefined) state.printHeader[k] = D[k]; }); }
      if(!state.trainerRequests) state.trainerRequests=[];
      if(!state.notifications) state.notifications=[];
      if(!state.adminNotifications) state.adminNotifications=[];
      if(!state.reminderFlags) state.reminderFlags={};
      if(!state.quranActivities) state.quranActivities=[];
      if(!Array.isArray(state.auditLog)) state.auditLog=[];
      if(!Array.isArray(state.resources)) state.resources=[];
      if(!Array.isArray(state.targets)) state.targets=[];
      try{ ensureOccasions(); }catch(e){}
      try{ stripPasswordsIfLocked(); dropArchivedOrders(); }catch(e){}
      try{ if(ensureSchoolStages()) setTimeout(()=>saveState(), 1500); }catch(e){}
      try{ if(dedupeAdminRequests()) setTimeout(()=>saveState(), 1500); }catch(e){}
      /* أماكن التنفيذ الفعلية (حين يختلف مكان التنفيذ عن الجهة الطالبة) */
      if(!Array.isArray(state.venues)) state.venues = ['مركز عيد الثقافي - دحل الحمام','مخيم أم العمد','عزبة سمسمة'].map(name=>({id:uid(), name}));
      if(!state.placeTypes || !state.placeTypes.length){
        state.placeTypes = ['مدرسة','مدارس حكومية','مدارس خاصة','نادي','مركز','استراحة','جامعة','مكان عام'].map(name=>({id:uid(), name}));
      }
      if(!state.__locationTypesMigrated){
        (state.schools||[]).forEach(s=>{
          if(!LOCATION_TYPES.includes(s.level)){
            const name = s.name||'';
            if(name.includes('جامعة')) s.level='جامعة';
            else if(name.includes('الدولية')||name.includes('الحديثة')||name.includes('الخاصة')) s.level='خاصة';
            else if(name.includes('نادي')) s.level='نادي';
            else if(name.includes('استراحة')) s.level='استراحة';
            else if(name.includes('مركز')) s.level='مركز';
            else s.level='غير ذلك';
          }
        });
        state.__locationTypesMigrated = true;
      }
      if(!state.users || !state.users.length){
        state.users=[
          {id:uid(), username:'admin', password:'admin123', role:'admin', trainerId:'', displayName:'مدير النظام', active:true},
          {id:uid(), username:'user', password:'user123', role:'user', trainerId:'', displayName:'مستخدم النظام', active:true},
        ];
      }
      // migrate old single trainerId -> trainerIds array
      state.orders.forEach(o=>{ if(!o.trainerIds){ o.trainerIds = o.trainerId ? [o.trainerId] : []; } if(!o.status){ o.status='active'; } if(o.evaluatedBy===undefined){ o.evaluatedBy=''; } });
      state.trainerRequests.forEach(r=>{ if(!r.trainerId && r.trainerIds && r.trainerIds[0]) r.trainerId=r.trainerIds[0]; });
      state.users.forEach(u=>{ if(u.active===undefined) u.active=true; });
      state.tasks.forEach(t=>{ if(!t.status){ t.status = t.done ? 'مكتملة' : 'لم تبدأ'; } if(!t.priority){ t.priority='متوسطة'; } });
      /* إصلاح المدى المقلوب الناتج عن ترحيل سابق — قبل أي عرض أو تقرير */
      const __fixedRanges = fixInvertedDateRanges();
      if(__fixedRanges){
        setTimeout(()=>{ try{
          toast(`✅ أُصلح تاريخ انتهاء ${__fixedRanges} فعالية مُرحَّلة — ستظهر الآن في التقارير`);
          saveState();
        }catch(e){} }, 1800);
      }
      __rememberBase(JSON.stringify(state), __baseUpdatedAt);
      __startLiveSync();
      return;
    }
  }catch(e){
    console.error('load error', e);
    syncState.ok = false;
    const d = describeFbError(e);
    /* الأخطاء المؤقّتة (انقطاع لحظي، بطء شبكة) تُعاد محاولتها تلقائيًا
       قبل إيقاف الحفظ — كان أي انقطاع عابر يوقف النظام حتى إعادة التحميل. */
    if(d.transient && (loadState.__tries||0) < 2){
      loadState.__tries = (loadState.__tries||0) + 1;
      await new Promise(r=>setTimeout(r, 800 * loadState.__tries));
      return loadState();
    }
    loadState.__tries = 0;
    if(d.code==='permission-denied' && !(firebase.auth && fbAuth().currentUser)){
      /* القواعد مفعّلة: البيانات تُقرأ بعد تسجيل الدخول فقط */
      __locked = true; __readFailed = true; state = defaultState(); state.users = [];
      return;
    }
    if((navigator.onLine===false || d.transient) && tryOfflineBoot()){ return; }
    /* ⚠ لا نكتب بيانات افتراضية فوق قاعدة البيانات عند فشل القراءة —
       كان هذا يمحو البيانات الحقيقية عند أي انقطاع شبكة أو خطأ صلاحيات. */
    state = defaultState();
    __readFailed = true;
    alert('تعذّر الاتصال بقاعدة البيانات\n'
      + '══════════════════════════════\n\n'
      + 'السبب: ' + d.why + '\n'
      + 'الرمز: ' + d.code + '\n\n'
      + 'الحل:   ' + d.fix + '\n\n'
      + '🛡 بياناتك محفوظة: أوقفنا الحفظ تمامًا كي لا يُكتب شيء فوقها.\n'
      + 'استخدم زر «إعادة المحاولة» أعلى الصفحة بعد معالجة السبب.');
    return;
  }
  /* المستند موجود لكن محتواه غير صالح → لا نكتب فوقه */
  if(__docExisted){
    state = defaultState();
    __readFailed = true;
    alert('البيانات المخزّنة غير قابلة للقراءة.\n\n'
      + '⚠ لن يُحفظ أي تعديل حمايةً لما هو مخزّن.\n'
      + 'تواصل مع المطوّر قبل المتابعة.');
    return;
  }
  /* لا يوجد مستند إطلاقًا → أول تشغيل، ننشئ البيانات الابتدائية */
  state = defaultState();
  await saveState();
}
/* أعلام حماية: تمنع الكتابة عند فشل القراءة */
let __readFailed = false, __docExisted = false;

/* ══════════════════════════════════════════════════════════════════
   حماية من ضياع البيانات بين الأجهزة/التبويبات  (Last-Write-Wins fix)
   ──────────────────────────────────────────────────────────────────
   المشكلة التي كانت: كل النظام محفوظ في مستند واحد، وكل حفظ يكتب
   الحالة كاملة فوق ما في القاعدة. فإذا كان النظام مفتوحًا على جهازين
   (أو تبويبين، أو الجوال والحاسب) فإن الجهاز الذي فُتح أولًا يحمل
   نسخة قديمة، وأي حفظ منه يمسح كل ما أضافه الجهاز الآخر بعده.
   وهذا سبب اختفاء «معلومات اليوم» رغم أنها حُفظت فعليًا.

   الحل: قبل كل كتابة نقرأ المستند داخل Transaction، وإن كان قد تغيّر
   بعد قراءتنا، ندمج الجديد القادم من الأجهزة الأخرى مع تعديلاتنا
   (دمج ثلاثي الاتجاه: الأساس / نسختنا / النسخة البعيدة) ثم نكتب.
   إضافةً إلى مستمع حيّ يجلب تعديلات الأجهزة الأخرى فورًا.
   ══════════════════════════════════════════════════════════════════ */
let __baseJson = '', __baseUpdatedAt = null, __baseIds = {};
let __liveUnsub = null, __ourLastWriteAt = 0, __mergeNoticeAt = 0;

/* المجموعات التي تُدمج بالمعرّف id */
const MERGE_COLLECTIONS = ['auditLog','resources','targets','occasions','orders','schools','trainers','users','fields','programTypes',
  'placeTypes','venues','adminRequestsList','trainerRequests','quranActivities','tasks',
  'notifications','adminNotifications'];

function __rememberBase(json, upAt){
  __baseJson = json || '';
  if(upAt != null) __baseUpdatedAt = upAt;
  __baseIds = {};
  let b = null;
  try{ b = JSON.parse(__baseJson); }catch(e){ b = null; }
  MERGE_COLLECTIONS.forEach(k=>{
    const arr = (b && Array.isArray(b[k])) ? b[k] : [];
    const s = Object.create(null);
    arr.forEach(x=>{ if(x && x.id) s[x.id] = JSON.stringify(x); });
    __baseIds[k] = s;
  });
}

/* دمج ثلاثي الاتجاه: الأساس (ما قرأناه) + نسختنا + النسخة البعيدة.
   النتيجة تُكتب في local وتُعاد إحصائية بما أُضيف من الأجهزة الأخرى. */
function __mergeRemoteInto(local, remote){
  const stats = { added:0, updated:0, collections:[] };
  if(!remote || typeof remote !== 'object') return stats;
  /* الأرشيف: اتحاد المعرّفات المؤرشفة + أحدث قائمة أعوام */
  if(Array.isArray(remote.archivedIds)){
    local.archivedIds = Array.from(new Set([...(local.archivedIds||[]), ...remote.archivedIds]));
    if(Array.isArray(remote.archives) && remote.archives.length >= (local.archives||[]).length) local.archives = remote.archives;
    const S = new Set(local.archivedIds);
    if(Array.isArray(remote.orders)) remote.orders = remote.orders.filter(o=>!S.has(o&&o.id));
    if(!__archMode && Array.isArray(local.orders)) local.orders = local.orders.filter(o=>!S.has(o&&o.id));
  }

  MERGE_COLLECTIONS.forEach(k=>{
    const rArr = Array.isArray(remote[k]) ? remote[k] : null;
    if(!rArr) return;
    if(!Array.isArray(local[k])) local[k] = [];
    const base   = __baseIds[k] || Object.create(null);
    const lIndex = Object.create(null);
    local[k].forEach((x,i)=>{ if(x && x.id) lIndex[x.id] = i; });

    let addedHere = 0, updHere = 0;
    rArr.forEach(r=>{
      if(!r || !r.id) return;
      const inBase = Object.prototype.hasOwnProperty.call(base, r.id);
      const li = lIndex[r.id];
      if(li === undefined){
        /* غير موجود عندنا: إن لم يكن موجودًا في الأساس فهو سجل جديد
           من جهاز آخر → نضيفه. وإن كان في الأساس فقد حُذف عندنا
           عن قصد → لا نُعيده. */
        if(!inBase){ local[k].push(r); addedHere++; }
        return;
      }
      /* موجود في الجهتين: إن لم نُعدّله نحن (يطابق الأساس) وكان البعيد
         مختلفًا → نأخذ البعيد. وإن عدّلناه نحن فتعديلنا هو الأحدث. */
      const rs = JSON.stringify(r);
      const ls = JSON.stringify(local[k][li]);
      if(ls === rs) return;
      if(inBase && base[r.id] === ls){ local[k][li] = r; updHere++; }
    });
    if(addedHere || updHere){
      stats.added += addedHere; stats.updated += updHere;
      stats.collections.push(k);
    }
  });

  /* الترقيم التسلسلي: نأخذ الأكبر دائمًا لتفادي تكرار أرقام التكليف */
  const rn = Number(remote.nextSerial||0), ln = Number(local.nextSerial||0);
  if(rn > ln) local.nextSerial = rn;

  /* حقول غير مصفوفية (الإعدادات والشعار...): نأخذ البعيد إن لم نُعدّله نحن */
  let baseObj = null; try{ baseObj = JSON.parse(__baseJson||'null'); }catch(e){}
  if(baseObj){
    Object.keys(remote).forEach(k=>{
      if(MERGE_COLLECTIONS.includes(k) || k==='nextSerial') return;
      const rs = JSON.stringify(remote[k]);
      const ls = JSON.stringify(local[k]);
      if(rs === ls) return;
      if(JSON.stringify(baseObj[k]) === ls) local[k] = remote[k];
    });
  }
  return stats;
}

function __mergeNotice(stats, where){
  if(!stats || (!stats.added && !stats.updated)) return;
  const now = Date.now();
  if(now - __mergeNoticeAt < 4000) return;
  __mergeNoticeAt = now;
  const parts = [];
  if(stats.added)   parts.push('أُضيف ' + stats.added + ' سجلًا');
  if(stats.updated) parts.push('حُدِّث ' + stats.updated + ' سجلًا');
  toast('🔄 مزامنة من جهاز آخر: ' + parts.join(' و '));
}

/* مستمع حيّ: أي تعديل من جهاز آخر يظهر فورًا بلا إعادة تحميل */
function __startLiveSync(){
  if(__liveUnsub) return;
  try{
    __liveUnsub = STATE_DOC().onSnapshot(snap=>{
      if(!snap.exists || __archMode) return;
      const raw = snap.data();
      if(!raw || !raw.json) return;
      const upAt = raw.updatedAt;
      if(upAt != null && __baseUpdatedAt != null && upAt === __baseUpdatedAt) return;
      /* تجاهل صدى كتابتنا نحن */
      if(Date.now() - __ourLastWriteAt < 2500) return;
      let remote = null;
      try{ remote = JSON.parse(raw.json); }catch(e){ return; }
      const stats = __mergeRemoteInto(state, remote);
      __rememberBase(raw.json, upAt);
      if(stats.added || stats.updated){
        __mergeNotice(stats, 'live');
        if(!__isUserTyping()) { try{ render(); }catch(e){} }
      }
    }, err=>{ console.warn('live sync error', err); });
  }catch(e){ console.warn('live sync unavailable', e); }
}

/* لا نُعِد رسم الصفحة أثناء كتابة المستخدم في حقل */
function __isUserTyping(){
  const a = document.activeElement;
  if(!a) return false;
  const t = (a.tagName||'').toLowerCase();
  return t==='input' || t==='textarea' || t==='select' || a.isContentEditable === true;
}
const syncState = { ok:false, lastAt:null };
let saving=false, pendingSave=false;
/* ══════════════════════════════════════════════════════════════════
   الحفظ مع تجميع الطلبات (Debounce) — تحسين أداء
   ──────────────────────────────────────────────────────────────────
   كان كل تعديل صغير يُنفّذ JSON.stringify لكامل البيانات + كتابة شبكية
   كاملة، فيبطؤ النظام مع كثرة السجلات. الآن تُجمَّع التعديلات المتتابعة
   في كتابة واحدة بعد 600ms، مع ضمان الحفظ عند إغلاق الصفحة.
   ══════════════════════════════════════════════════════════════════ */
let __saveTimer = null, __pendingBase = null;
function dropArchivedOrders(){
  /* طلبات نُقلت إلى الأرشيف لا تعود للعام الحالي (حتى لو حفظها جهاز قديم) */
  if(__archMode || !state || !Array.isArray(state.archivedIds) || !state.archivedIds.length) return;
  const S = new Set(state.archivedIds);
  if((state.orders||[]).some(o=>S.has(o.id))) state.orders = state.orders.filter(o=>!S.has(o.id));
}
function saveState(){
  try{ stripPasswordsIfLocked(); dropArchivedOrders(); }catch(e){}
  try{ const mx=(state.orders||[]).reduce((m,o)=>Math.max(m, Number(o.serial)||0), 0);
       if(mx+1 > (Number(state.nextSerial)||0)) state.nextSerial = mx+1; }catch(e){}
  return new Promise(resolve=>{
    if(__saveTimer) clearTimeout(__saveTimer);
    __saveTimer = setTimeout(()=>{ __saveTimer=null; flushSave().then(resolve); }, 600);
  });
}
async function flushSave(){
  if(__archMode){ toast('وضع الأرشيف للقراءة فقط — لم يُحفظ أي تعديل. ارجع للعام الحالي للتعديل.'); return; }
  /* ⚠ حماية: لا نكتب إطلاقًا إذا لم تنجح قراءة البيانات */
  if(__readFailed){
    toast('⚠️ الحفظ متوقف: لم تُقرأ البيانات بنجاح. أعد تحميل الصفحة.');
    return;
  }
  if(saving){ pendingSave=true; return; }
  /* بلا إنترنت: نحفظ على الجهاز ونرفع لاحقًا */
  if(typeof navigator!=='undefined' && navigator.onLine===false){ queueOfflineSave(); return; }
  /* تطبيع قبل الكتابة: لا يُحفظ تاريخ انتهاء أقدم من تاريخ البداية */
  try{ fixInvertedDateRanges(); }catch(e){}
  try{ ensureSchoolStages(); }catch(e){}
  try{ dedupeAdminRequests(); }catch(e){}
  saving=true;
  try{
    /* نسخة احتياطية محلية قبل كل كتابة — للاسترجاع عند أي خطأ */
    try{
      const pre = JSON.stringify(state);
      localStorage.setItem('backup_prev', localStorage.getItem('backup_last') || '');
      localStorage.setItem('backup_last', pre);
      localStorage.setItem('backup_at', new Date().toISOString());
      localStorage.setItem('backup_base_at', String(__baseUpdatedAt==null?'':__baseUpdatedAt));
    }catch(e){}

    /* ⚠ الكتابة داخل Transaction: نقرأ آخر نسخة، وإن تغيّرت بعد قراءتنا
       ندمج تعديلات الأجهزة الأخرى قبل الكتابة — بدل مسحها. */
    let mergeStats = null;
    await getDb().runTransaction(async tx=>{
      const ref  = STATE_DOC();
      const snap = await tx.get(ref);
      if(snap.exists){
        const raw = snap.data();
        const upAt = raw && raw.updatedAt;
        if(raw && raw.json && upAt != null && __baseUpdatedAt != null && upAt !== __baseUpdatedAt){
          let remote = null;
          try{ remote = JSON.parse(raw.json); }catch(e){ remote = null; }
          if(remote) mergeStats = __mergeRemoteInto(state, remote);
        }
      }
      const payload = JSON.stringify(state);
      const stamp = Date.now();
      tx.set(ref, { json: payload, updatedAt: stamp });
      __ourLastWriteAt = stamp;
      __pendingBase = { json: payload, at: stamp };
    });
    if(__pendingBase){ __rememberBase(__pendingBase.json, __pendingBase.at); __pendingBase = null; }
    __mergeNotice(mergeStats, 'save');
    __startLiveSync();
    syncState.ok = true; syncState.lastAt = Date.now(); renderUserBox();
    if(__offline || localStorage.getItem('offline_state')){ clearOfflineQueue(); try{ render(); }catch(e){} }
  }catch(e){
    console.error('save error', e);
    syncState.ok = false; renderUserBox();
    const dfe = describeFbError(e);
    if(navigator.onLine===false || dfe.transient || /unavailable|deadline|network/i.test(dfe.code||'')){ saving=false; queueOfflineSave(); return; }
    // إظهار الخطأ بوضوح بدل الفشل الصامت الذي كان يسبب فقدان البيانات
    toast('⚠️ لم يتم حفظ البيانات! ' + (e && e.message ? e.message : ''));
  }
  saving=false;
  if(pendingSave){ pendingSave=false; flushSave(); }
}
/* ضمان عدم ضياع أي تعديل معلّق عند إغلاق الصفحة أو تركها */
window.addEventListener('beforeunload', ()=>{ if(__saveTimer){ clearTimeout(__saveTimer); __saveTimer=null; flushSave(); } });
document.addEventListener('visibilitychange', ()=>{ if(document.hidden && __saveTimer){ clearTimeout(__saveTimer); __saveTimer=null; flushSave(); } });

/* ============ Roles & Navigation ============ */
/* ══════════════════════════════════════════════════════════════════
   أيقونات Lucide — مسارات SVG الأصلية مضمّنة (بسمك 1.8px)
   السبب: lucide-react حزمة React تحتاج npm وبناء، والنظام ملف واحد
   بلا بناء — فاستُخدمت نفس أيقونات Lucide كرسوم SVG مباشرة.
   ══════════════════════════════════════════════════════════════════ */
const LU = {
  home:        '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  filePlus:    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="M9 15h6"/>',
  clipboard:   '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  barChart:    '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
  bookOpen:    '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  users:       '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  settings:    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2"/><circle cx="12" cy="12" r="3"/>',
  layers:      '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m6.08 9.5-3.5 1.6a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.5-1.59"/><path d="m6.08 14.5-3.5 1.6a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.5-1.59"/>',
  logOut:      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  calendar:    '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  clock:       '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  school:      '<path d="M14 22v-4a2 2 0 1 0-4 0v4"/><path d="m18 10 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.382a1 1 0 0 1 .553-.894L6 10"/><path d="M18 5v17"/><path d="m4 6 7.106-3.553a2 2 0 0 1 1.788 0L20 6"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/>',
  alert:       '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  hourglass:   '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
  printer:     '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect width="12" height="8" x="6" y="14" rx="1"/>',
  download:    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  sheet:       '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>',
  x:           '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  search:      '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  trash:       '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  edit:        '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>',
  copy:        '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  plus:        '<path d="M5 12h14"/><path d="M12 5v14"/>',
  sparkles:    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  fileText:    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  hash:        '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>',
  megaphone:   '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  fileEdit:    '<path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z"/>',
  more:        '<circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/><circle cx="5" cy="12" r="1.3"/>',
  filter:      '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  star:        '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  pieChart:    '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
  save2:       '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
  check:       '<path d="M20 6 9 17l-5-5"/>',
  activity:    '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  arrowRight:  '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  moon:        '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"/>',
  sun:         '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  eye:         '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:      '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>',
  shield:      '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  bell:        '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  arrowLeft:   '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  arrowUp:     '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
  arrowUpRight:'<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  refresh:     '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  upload:      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  pin:         '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  building:    '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  pause:       '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  play:        '<polygon points="6 3 20 12 6 21 6 3"/>',
  mail:        '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  qr:          '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
  save:        '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
  info:        '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  ban:         '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  forward:     '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>',
  menu:        '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  message:     '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  trendingUp:  '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  command:     '<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>',
  history:     '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  landmark:    '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  zap:         '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  flag:        '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  penLine:     '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
  gift:        '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  paperclip:   '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  inbox:       '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  chevronRight:'<path d="m9 18 6-6-6-6"/>',
  truck:       '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  list:        '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
  mapPin:      '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  phone:       '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  user:        '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  globe:       '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  copyPlus:    '<line x1="15" x2="15" y1="12" y2="18"/><line x1="12" x2="18" y1="15" y2="15"/><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
};

/* ══════════════════════════════════════════════════════════════════
   نظام الأيقونات الموحّد — يحوّل أي إيموجي متبقٍ إلى أيقونة Lucide
   ──────────────────────────────────────────────────────────────────
   الإيموجي يظهر مختلفًا على كل جهاز ولا يُطبع بانتظام. بدل تعديل مئات
   المواضع يدويًا، يمرّ هذا المحوّل على كل ما يُرسم في الواجهة ويستبدل
   الإيموجي المعروف بأيقونة SVG بنفس الحجم واللون.
   ══════════════════════════════════════════════════════════════════ */
const EMOJI_ICON = {
  '🖨':'printer','📄':'download','📊':'sheet','✅':'checkCircle','📋':'clipboard','👥':'users',
  '🔎':'search','🔍':'search','❌':'x','🗑':'trash','📝':'penLine','🗓':'calendar','📅':'calendar',
  '🔔':'bell','🏫':'school','⏱':'clock','⏰':'clock','🗂':'layers','🕌':'landmark','✏':'edit',
  '📥':'upload','🔄':'refresh','🔁':'refresh','📌':'pin','⏩':'forward','🏢':'building','🏛':'landmark',
  '⚠':'alert','⏳':'hourglass','🛡':'shield','📖':'bookOpen','📈':'trendingUp','💐':'gift',
  '💾':'save','⏸':'pause','▶':'play','✉':'mail','🔲':'qr','⛔':'ban','ℹ':'info','⚡':'zap',
  '🏁':'flag','✍':'penLine','📎':'paperclip','☰':'menu','🧑‍🏫':'users'
};
const EMOJI_TONE = { '⚠':'warn','⛔':'dan','✅':'ok','ℹ':'info','⏳':'warn' };
const EMOJI_RE = /(🧑‍🏫|[ℹ⌨⏩-⏺☀-➿⬀-⯿]|[\uD83C-\uDBFF][\uDC00-\uDFFF])️?/g;
function emojiKey(e){ return String(e||'').replace(/️/g,''); }
function emojiToIcon(e, size){
  const k = emojiKey(e);
  const name = EMOJI_ICON[k] || EMOJI_ICON[k.slice(0,2)];
  if(!name || !LU[name]) return '';
  const tone = EMOJI_TONE[k];
  return icon(name, size||16, 'emj'+(tone?' emj-'+tone:''));
}
const BRAND_MARK_SVG = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${'<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>'}</svg>`;
function waIcon(size){
  const z=size||16;
  return `<svg class="lu" width="${z}" height="${z}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.09c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.17-1.56-1.17-2.97s.74-2.11 1-2.4c.26-.29.57-.36.76-.36l.55.01c.18.01.41-.07.65.49.24.58.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.15.31-.29.48-.14.17-.3.38-.43.51-.14.14-.29.29-.12.57.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.41.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.65-.14.26.1 1.67.79 1.96.93.29.14.48.22.55.34.07.12.07.7-.17 1.38z"/></svg>`;
}
/* يستبدل الإيموجي داخل عقدة نصية بأيقونات */
function __iconifyTextNode(tn){
  const txt = tn.nodeValue;
  if(!txt || !EMOJI_RE.test(txt)) return;
  EMOJI_RE.lastIndex = 0;
  const parent = tn.parentNode; if(!parent) return;
  const tag = parent.nodeName;
  if(tag==='SCRIPT' || tag==='STYLE' || tag==='TEXTAREA' || tag==='TITLE') return;
  if(tag==='OPTION'){                       /* لا SVG داخل الخيارات — نحذف الإيموجي فقط */
    tn.nodeValue = txt.replace(EMOJI_RE, m => EMOJI_ICON[emojiKey(m)]||EMOJI_ICON[emojiKey(m).slice(0,2)] ? '' : m).replace(/^\s+/,'');
    return;
  }
  const frag = document.createDocumentFragment();
  let last = 0, m, changed = false;
  EMOJI_RE.lastIndex = 0;
  while((m = EMOJI_RE.exec(txt))){
    const svg = emojiToIcon(m[0]);
    if(!svg) continue;
    if(m.index>last) frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
    const span = document.createElement('span');
    span.className = 'emj-wrap'; span.innerHTML = svg;
    frag.appendChild(span);
    last = m.index + m[0].length; changed = true;
  }
  if(!changed) return;
  if(last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
  parent.replaceChild(frag, tn);
}
/* يضيف تسمية العمود لكل خلية ليتحوّل الجدول إلى بطاقات على الجوال */
function cardifyTables(root){
  if(!root || !root.querySelectorAll) return;
  const sel = '#ord_listResult table, #reportContent table, .audit-tbl, .tg-tbl';
  const tables = (root.matches && root.matches(sel)) ? [root] : Array.from(root.querySelectorAll(sel));
  tables.forEach(t=>{
    if(t.closest('.oc-grid') || t.classList.contains('form-table')) return;
    const ths = Array.from(t.querySelectorAll('thead th')).map(th=>th.textContent.trim());
    if(!ths.length || ths.length > 14) return;
    t.classList.add('m-cards');
    t.querySelectorAll('tbody tr').forEach(tr=>Array.from(tr.children).forEach((td,i)=>{ if(!td.hasAttribute('data-label')) td.setAttribute('data-label', ths[i]||''); }));
  });
}
function iconifyEmoji(root){
  if(!root) return;
  if(root.nodeType===1) cardifyTables(root);
  if(root.nodeType===3){ __iconifyTextNode(root); return; }
  if(root.nodeType!==1) return;
  if(root.matches && root.matches('input[placeholder],textarea[placeholder]'))
    root.placeholder = root.placeholder.replace(EMOJI_RE,'').trim();
  root.querySelectorAll && root.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(el=>{
    if(EMOJI_RE.test(el.placeholder)){ EMOJI_RE.lastIndex=0; el.placeholder = el.placeholder.replace(EMOJI_RE,'').trim(); }
    EMOJI_RE.lastIndex=0;
  });
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const nodes = []; let n;
  while((n = w.nextNode())){ if(EMOJI_RE.test(n.nodeValue)) nodes.push(n); EMOJI_RE.lastIndex=0; }
  nodes.forEach(__iconifyTextNode);
}
(function startIconObserver(){
  const go = ()=>{
    iconifyEmoji(document.body);
    new MutationObserver(muts=>{
      for(const m of muts){
        if(m.type==='characterData') __iconifyTextNode(m.target);
        else m.addedNodes.forEach(iconifyEmoji);
      }
    }).observe(document.body, {childList:true, subtree:true, characterData:true});
  };
  if(document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();

/* يبني أيقونة Lucide بالحجم واللون المطلوبين */
function icon(name, size, cls){
  const p = LU[name]; if(!p) return '';
  return `<svg class="lu ${cls||''}" width="${size||18}" height="${size||18}" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true" focusable="false">${p}</svg>`;
}
const PAGES = [
  {id:'home', label:'الصفحة الرئيسية', icon:'home', roles:['admin','user']},
  {id:'newOrder', label:'طلب فعالية جديد', icon:'filePlus', roles:['admin','user'], hidden:true},
  {id:'quickSheet', label:'تعديل سريع', icon:'sheet', roles:['admin','user'], hidden:true},
  {id:'ordersList', label:'الطلبات', icon:'clipboard', roles:['admin','user']},
  {id:'order', label:'طلبات الفعاليات والمبادرات', icon:'clipboard', roles:['admin','user'], hidden:true},
  {id:'distributions', label:'الطلبات والتوزيعات والإداريات', icon:'layers', roles:['admin','user'], hidden:true},
  {id:'operations', label:'مركز التشغيل', icon:'activity', roles:['admin','user']},
  {id:'schedule', label:'جدول المقدّمين', icon:'calendar', roles:['admin','user']},
  {id:'reports', label:'التقارير', icon:'barChart', roles:['admin','user']},
  {id:'quranActivities', label:'الأنشطة القرآنية', icon:'bookOpen', roles:['admin','user']},
  {id:'tasks', label:'المهام', icon:'checkCircle', roles:['admin','user'], hidden:true},
  {id:'trainerPortal', label:'بوابة مقدم الفعالية', icon:'users', roles:['admin','user','trainer'], navRoles:['trainer']},
  {id:'approvals', label:'الموافقات', icon:'checkCircle', roles:['admin'], hidden:true},
  {id:'settings', label:'الإعدادات', icon:'settings', roles:['admin','user']},
];
let currentRole=null;      // 'admin' | 'user' | 'trainer'
let currentUser=null;      // the matched user record from state.users
let currentPage='home';
let orderSubTab='new';
let quranSubTab='entry';
let editingQuranId=null;
let editingOrderId=null;
let loggedTrainerId=null;
let trainerPortalTab='upcoming';
let tpAutoOpened=false;

function visiblePages(){ return PAGES.filter(p=>p.roles.includes(currentRole) && !p.hidden && (!p.navRoles || p.navRoles.includes(currentRole))); }
let settingsTab='lists';

function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>t.classList.remove('show'),2600);
}
function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function fileToDataUrl(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
/* تحويل كائن Date إلى YYYY-MM-DD من المكوّنات المحلية — بديل آمن لـ toISOString */
function dateToISO(d){
  const p = n => String(n).padStart(2,'0');
  return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate());
}
function todayStr(){
  /* ⚠ لا نستخدم toISOString: يُحوّل إلى UTC فيُرجع تاريخ الأمس
     في الساعات الأولى من اليوم بتوقيت قطر (+3). نبني من المكوّنات المحلية. */
  return dateToISO(new Date());
}
/* يحوّل قيمة الشهر (YYYY-MM) إلى اسم الشهر بالعربية + السنة، مثل "يونيو 2026" */
/* اسم الشهر فقط بدون سنة (لفلاتر من شهر / إلى شهر) */
function monthOnlyAr(m){
  if(!m) return '';
  const names=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const mm = String(m).includes('-') ? String(m).split('-')[1] : m;
  return names[parseInt(mm,10)-1] || m;
}
function monthNameAr(m){
  if(!m) return '';
  const names = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const [y, mm] = m.split('-');
  const idx = parseInt(mm,10)-1;
  return (names[idx]||mm) + ' ' + y;
}

/* ============ Modal helper ============ */
/* نافذة عرض معلومات (بلا حقول إدخال) */
function showInfoModal(title, bodyHtml, onReady){
  const overlay=document.getElementById('modalOverlay'), box=document.getElementById('modalBox');
  box.classList.remove('ev-modal'); box.style.maxWidth = '';
  box.innerHTML = `<h3>${title}</h3><div id="modalInfoBody" style="margin-top:10px;">${bodyHtml}</div>
    <div class="modal-actions"><button class="btn btn-outline" id="modalClose">إغلاق</button></div>`;
  overlay.classList.add('open');
  box.querySelector('#modalClose').onclick = closeModal;
  overlay.onclick = e=>{ if(e.target===overlay) closeModal(); };
  if(onReady) onReady(box);
}
/* زر العودة لأعلى: يظهر بعد تمرير كافٍ فقط، ويعمل على الصفحة وعلى
   الحاوية الداخلية أيّهما هو المُمرَّر فعلًا. */
function ensureToTop(){
  let btn = document.getElementById('toTop');
  if(!btn){
    btn = document.createElement('button');
    btn.id = 'toTop'; btn.type = 'button';
    btn.title = 'العودة إلى أعلى الصفحة';
    btn.setAttribute('aria-label','العودة إلى أعلى الصفحة');
    btn.innerHTML = icon('arrowUp',18) || '↑';
    document.body.appendChild(btn);
    const scroller = () => {
      const m = document.querySelector('.main') || document.scrollingElement || document.documentElement;
      return (m && m.scrollHeight > m.clientHeight + 40) ? m : (document.scrollingElement||document.documentElement);
    };
    btn.onclick = ()=> scroller().scrollTo({top:0, behavior:'smooth'});
    const sync = ()=>{ btn.classList.toggle('on', scroller().scrollTop > 320); };
    window.addEventListener('scroll', sync, true);
    window.addEventListener('resize', sync);
    btn.__sync = sync;
  }
  if(btn.__sync) btn.__sync();
}

function closeModal(){
  const overlay=document.getElementById('modalOverlay');
  if(overlay){ overlay.classList.remove('open'); overlay.onclick=null; }
}
function openModal(title, fieldsConfig, onSubmit){
  const overlay=document.getElementById('modalOverlay'); const box=document.getElementById('modalBox');
  box.classList.remove('ev-modal'); box.style.maxWidth = '';
  box.innerHTML = `<h3>${title}</h3><div id="modalFields" class="grid"></div>
    <div class="modal-actions"><button class="btn btn-outline" id="modalCancel">إلغاء</button><button class="btn btn-primary" id="modalSave">حفظ</button></div>`;
  const fc = box.querySelector('#modalFields');
  fieldsConfig.forEach(f=>{
    const wrap=document.createElement('div'); wrap.className='field';
    wrap.innerHTML = `<label>${f.label}</label>` + (f.type==='select'
      ? `<select id="mf_${f.name}">${f.options.map(o=>`<option value="${o.value}">${o.label}</option>`).join('')}</select>`
      : `<input id="mf_${f.name}" type="${f.type||'text'}" placeholder="${f.placeholder||''}">`);
    fc.appendChild(wrap);
  });
  overlay.classList.add('open');
  box.querySelector('#modalCancel').onclick=()=>overlay.classList.remove('open');
  box.querySelector('#modalSave').onclick=async ()=>{
    const values={};
    fieldsConfig.forEach(f=>{ values[f.name]=document.getElementById('mf_'+f.name).value.trim(); });
    if(fieldsConfig.some(f=>f.required && !values[f.name])){ toast('يرجى تعبئة الحقول المطلوبة'); return; }
    const __result = await onSubmit(values);
    if(__result !== false){ overlay.classList.remove('open'); }
  };
}
function starRatingHtml(name, val){
  val = Number(val)||0; let stars='';
  for(let i=1;i<=10;i++){ stars += `<span class="star" data-name="${name}" data-val="${i}" style="cursor:pointer;font-size:19px;color:${i<=val?'var(--gold)':'#ddd'}">★</span>`; }
  return `<div id="stars_${name}">${stars}</div><input type="hidden" id="${name}_val" value="${val}"><div class="helper">التقييم الحالي: <span id="${name}_lbl">${val}</span> / 10</div>`;
}
function wireStars(container){
  container.querySelectorAll('.star').forEach(s=>{
    s.onclick=()=>{
      const name=s.dataset.name, val=Number(s.dataset.val);
      document.getElementById(name+'_val').value = val;
      const lbl=document.getElementById(name+'_lbl'); if(lbl) lbl.textContent=val;
      container.querySelectorAll(`.star[data-name="${name}"]`).forEach(st=>{ st.style.color = Number(st.dataset.val)<=val ? 'var(--gold)':'#ddd'; });
    };
  });
}

/* ============ Scheduling conflict helpers ============ */
function parseDT(dateStr, timeStr){ if(!dateStr) return null; return new Date(dateStr+'T'+(timeStr||'00:00')+':00'); }
function dateRangesOverlap(aFrom, aTo, bFrom, bTo){
  return aFrom <= (bTo||aFrom) && (aTo||aFrom) >= bFrom;
}
/* الفعالية الملغاة لا تُحتسب في أي تعارض — لا للمقدّم ولا للجهة */
function isCancelledOrder(o){ return !!o && ((o.status||'active')==='cancelled' || o.completionStatus==='الغيت'); }
function isLiveOrder(o){ return !!o && !isCancelledOrder(o); }

function trainerConflictSingle(trainerId, date, timeFrom, timeTo, excludeOrderId, dateTo){
  if(!trainerId || !date) return null;
  const dTo = dateTo || date;
  const bufferMs = 90*60*1000;
  // نقارن وقت اليوم فقط (بغض النظر عن التاريخ الفعلي) باستخدام يوم مرجعي ثابت،
  // لأن الفعالية متعددة الأيام تتكرر بنفس الفترة الزمنية كل يوم ضمن مدتها
  const refDay = '2000-01-01';
  const newStart = parseDT(refDay, timeFrom||'00:00'), newEnd = parseDT(refDay, timeTo||timeFrom||'23:59');
  return state.orders.find(o=>{
    if(o.id===excludeOrderId) return false;
    if(!isLiveOrder(o)) return false;          /* ملغاة ← لا تحجز المقدّم */
    if(!(o.trainerIds||[]).includes(trainerId)) return false;
    const oTo = orderEnd(o);
    if(!dateRangesOverlap(date, dTo, o.date, oTo)) return false;
    const exStart = parseDT(refDay, o.timeFrom||'00:00'), exEnd = parseDT(refDay, o.timeTo||o.timeFrom||'23:59');
    const winStart = new Date(exStart.getTime()-bufferMs), winEnd = new Date(exEnd.getTime()+bufferMs);
    return newStart < winEnd && newEnd > winStart;
  }) || null;
}
function anyTrainerConflict(trainerIds, date, timeFrom, timeTo, excludeOrderId, dateTo){
  for(const tId of (trainerIds||[])){
    const c = trainerConflictSingle(tId, date, timeFrom, timeTo, excludeOrderId, dateTo);
    if(c) return {trainerId:tId, order:c};
  }
  return null;
}
/* رقم أمر التكليف: تسلسل عام مستمر لا يُصفَّر مع بداية كل سنة */
/* تصريف كلمة يوم حسب العدد: 1 يوم | 2 يومان | 3-10 أيام | 11+ يومًا */
/* تصريف كلمة فعالية: 1 فعالية | 2 فعاليتان | 3-10 فعاليات | 11+ فعالية */
function eventWord(n){
  n = Number(n)||0;
  if(n === 1) return 'فعالية';
  if(n === 2) return 'فعاليتان';
  const r = n % 100;
  if(r >= 3 && r <= 10) return 'فعاليات';
  return 'فعالية';
}
function dayWord(n){
  n = Number(n)||0;
  if(n === 1) return 'يوم';
  if(n === 2) return 'يومان';
  const r = n % 100;
  if(r >= 3 && r <= 10) return 'أيام';
  return 'يومًا';
}
function nextOrderSerial(){
  const mx = (state.orders||[]).reduce((m,o)=>Math.max(m, Number(o.serial)||0), 0);
  return Math.max(mx + 1, Number(state.nextSerial)||1);   /* لا يُعاد استخدام رقم سبق إصداره */
}
function schoolSameDay(schoolId, date, excludeOrderId){
  if(!schoolId||!date) return null;
  return state.orders.find(o=> o.id!==excludeOrderId && isLiveOrder(o)
    && o.schoolId===schoolId && o.date===date) || null;
}
/* فعاليات أخرى في نفس المدرسة خلال نفس الأسبوع (يُستثنى ما كان لنفس المدرب) */
function schoolSameWeek(schoolId, date, excludeOrderId, trainerIds){
  if(!schoolId||!date) return [];
  const {start, end} = getWeekBounds(date);
  const mine = new Set(trainerIds||[]);
  return state.orders.filter(o=>{
    if(o.id===excludeOrderId || o.schoolId!==schoolId) return false;
    if(!isLiveOrder(o)) return false;          /* ملغاة ← لا تمنع الجهة */
    const s = o.date||'', e = orderEnd(o);
    if(!(s <= end && e >= start)) return false;
    const others = (o.trainerIds||[]);
    // ننبّه فقط إن كان هناك مقدّم مختلف عن المقدّمين المختارين
    return others.some(id=>!mine.has(id)) || others.length===0;
  });
}

/* ============ Root render ============ */
function renderRoot(){
  const root=document.getElementById('rootWrap');
  if(!currentRole){ renderGate(root); return; }
  if(currentRole==='trainer' && !loggedTrainerId){
    root.innerHTML = `<div class="gate-wrap"><div class="gate-card"><h1>⚠️ حساب غير مرتبط</h1><p>هذا الحساب من نوع "مقدم فعالية" لكنه غير مرتبط بأي سجل مقدّم فعالية. تواصل مع مدير النظام.</p>
      <button class="btn btn-outline" onclick="currentRole=null;currentUser=null;renderRoot();">رجوع لتسجيل الدخول</button></div></div>`;
    return;
  }
  // القائمة منطوية افتراضيًا عند الدخول (تُحترم رغبة المستخدم إن غيّرها لاحقًا)
  let opened='0'; try{ const v=localStorage.getItem(navPrefKey()); if(v!==null) opened=v; }catch(e){}
  document.body.classList.toggle('nav-open', opened==='1');
  renderAppShell(root);
  applyTheme();
}
function renderGate(root){
  root.innerHTML = `<div class="lgw">
    <div class="lgcard">
      <div class="lgbrand">
        <div class="lglogo">${state.logo ? `<img src="${state.logo}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">` : icon('landmark',38)}</div>
        <h1>${escapeHtml((state.printHeader&&state.printHeader.line2)||state.orgName||'نظام الفعاليات')}</h1>
        <p>برنامج طلبات الفعاليات والمبادرات</p>
      </div>
      <div id="lg_err" class="lgerr">اسم المستخدم أو كلمة المرور غير صحيحة</div>
      <div class="lgf">
        <label for="lg_user">اسم المستخدم</label>
        <div class="lgin">
          <span class="ic">${icon('users',18)}</span>
          <input id="lg_user" type="text" placeholder="اسم المستخدم" autocomplete="username">
        </div>
      </div>
      <div class="lgf">
        <label for="lg_pass">كلمة المرور</label>
        <div class="lgin">
          <span class="ic">${icon('shield',18)}</span>
          <input id="lg_pass" type="password" placeholder="كلمة المرور" autocomplete="current-password"
                 onkeydown="if(event.key==='Enter')doLogin()">
          <button type="button" class="eye" id="lg_eye" aria-label="إظهار كلمة المرور" title="إظهار كلمة المرور">${icon('eye',17)}</button>
        </div>
      </div>
      <div class="lgrow">
        <label><input type="checkbox" id="lg_remember"> تذكّرني</label>
        <a id="lg_forgot">نسيت كلمة المرور؟</a>
      </div>
      <button class="lgbtn" onclick="doLogin()">الدخول إلى النظام</button>
      
    </div>
  </div>`;
  /* إظهار وإخفاء كلمة المرور */
  const eyeBtn = document.getElementById('lg_eye');
  eyeBtn.onclick = ()=>{
    const p = document.getElementById('lg_pass');
    const show = p.type === 'password';
    p.type = show ? 'text' : 'password';
    eyeBtn.innerHTML = icon(show ? 'eyeOff' : 'eye', 17);
    eyeBtn.setAttribute('aria-label', show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
    p.focus();
  };
  document.getElementById('lg_forgot').onclick = ()=>alert('تواصل مع مدير النظام لإعادة تعيين كلمة المرور.');
  /* تذكّرني */
  try{
    const rem = localStorage.getItem('rememberUser');
    if(rem){ document.getElementById('lg_user').value = rem; document.getElementById('lg_remember').checked = true; }
  }catch(e){}
  setTimeout(()=>{ const u=document.getElementById('lg_user'); if(u && !u.value) u.focus(); }, 60);
  document.getElementById('lg_user').focus();
}
function doLogin(){
  const eBox = document.getElementById('lg_err');
  const fail = msg => { if(eBox){ eBox.textContent=msg; eBox.style.display='block'; } };
  const uEl = document.getElementById('lg_user'), pEl = document.getElementById('lg_pass');
  if(!uEl || !pEl) return;
  /* تنظيف المدخلات: مسافات ومحارف اتجاهية قد تلتصق عند النسخ أو التعبئة التلقائية */
  const clean = v => String(v||'').replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,'').trim();
  const u = clean(uEl.value);
  const p = clean(pEl.value);
  if(!u || !p){ fail('يرجى إدخال اسم المستخدم وكلمة المرور'); return; }
  const users = (!__locked && state && Array.isArray(state.users)) ? state.users : [];
  /* اسم المستخدم غير حسّاس لحالة الأحرف، وكلمة المرور مطابقة تامة (فترة الترحيل فقط) */
  const match = users.find(x =>
    clean(x.username).toLowerCase() === u.toLowerCase() && x.password!=null && clean(x.password) === p) || null;
  const btn = document.querySelector('.lgw .lgbtn');
  if(btn && btn.disabled) return;
  if(btn){ btn.disabled = true; btn.dataset.t = btn.dataset.t || btn.innerHTML; btn.innerHTML = 'جارٍ التحقق…'; }
  const reset = ()=>{ if(btn){ btn.disabled=false; btn.innerHTML = btn.dataset.t; } };
  doLoginSecure(u, p, match, m=>{ reset(); fail(m); }, m=>{ reset(); finishLogin(m, u); })
    .catch(e=>{ reset(); console.error(e); fail('تعذّر تسجيل الدخول: '+(e.code||e.message)); });
}
function finishLogin(match, u){
  try{
    const rem = document.getElementById('lg_remember');
    if(rem && rem.checked) localStorage.setItem('rememberUser', u); else localStorage.removeItem('rememberUser');
  }catch(e){}
  if(match.active===false){ document.getElementById('lg_err').textContent='هذا الحساب معطّل، تواصل مع مدير النظام'; document.getElementById('lg_err').style.display='block'; try{ fbAuth().signOut(); }catch(e){} return; }
  currentUser = match;
  currentRole = match.role;
  loggedTrainerId = match.role==='trainer' ? match.trainerId : null;
  currentPage='home'; trainerPortalTab='upcoming'; tpAutoOpened=false;
  renderRoot();
  try{ dailyBackupPrompt(); }catch(e){ console.warn(e); }
}

function navPrefKey(){
  const u = (currentUser && (currentUser.username||currentUser.id)) || 'guest';
  return 'navCollapsed:'+u;   // حالة الطي محفوظة لكل مستخدم على حدة
}
function toggleNav(){
  document.body.classList.toggle('nav-open');
  toast(document.body.classList.contains('nav-open') ? 'القائمة مثبّتة مفتوحة' : 'القائمة مطويّة — تظهر عند مرور المؤشر');
  try{ localStorage.setItem(navPrefKey(), document.body.classList.contains('nav-open')?'1':'0'); }catch(e){}
}
function closeMobileDrawer(){
  const sb=document.getElementById('sideNav');
  if(sb) sb.classList.remove('open');
}
/* الصفحات الفرعية لكل قسم رئيسي — تظهر كأوراق متصلة بالشريط العلوي */
/* عناوين الصفحات مع وصفها — تُعرض في ترويسة موحّدة أعلى كل صفحة */
const PAGE_HEADS = {
  reports:          ['التقارير', 'تقارير الفعاليات والمدارس والساعات', 'اختر نوع التقرير من القائمة، ثم حدّد الفترة والخيارات.'],
  distributions:    ['التوزيعات', 'التوزيعات والنتائج والطلبات الإدارية', 'تابع توزيع الفعاليات على المقدّمين ونتائجها.'],
  quranActivities:  ['الأنشطة القرآنية', 'برنامجا روح والرحيق', 'سجّل البيانات الشهرية، ثم أنشئ التقارير القابلة للطباعة.'],
};
const SUBPAGES = {
  reports: [],
  distributions: [
    {key:'dist',     label:'التوزيعات',        icon:'🗂️'},
    {key:'results',  label:'النتائج',          icon:'🏁'},
    {key:'adminReq', label:'الطلبات الإدارية', icon:'📋'},
  ],
  quranActivities: [
    {key:'entry',   label:'إدخال البيانات', icon:'✍️'},
    {key:'report',  label:'التقارير',       icon:'📊'},
  ],
};
function currentSubKey(page){
  if(page==='reports') return reportsSubTab;
  if(page==='order') return orderSubTab;
  if(page==='distributions') return distSubTab;
  if(page==='quranActivities') return quranSubTab;
  return null;
}
function setSubTab(page, key){
  if(page==='reports'){ reportsSubTab=key; }
  else if(page==='order'){ orderSubTab=key; if(key!=='new') editingOrderId=null; }
  else if(page==='distributions') distSubTab=key;
  else if(page==='quranActivities') quranSubTab=key;
  render();
}
/* مجموعات القائمة الجانبية — مصدر واحد تستعمله القائمة ومسار التنقّل */
const NAV_GROUPS_DEF = [
  { t:'', ids:['home','trainerPortal'] },
  { t:'الفعاليات', ids:['ordersList','newOrder','order','quickSheet','operations','schedule','distributions','tasks'] },
  { t:'التقارير', ids:['reports','quranActivities'] },
  { t:'النظام', ids:['settings','approvals'] },
];
const NAV_GROUP_OF = (function(){
  const m = {};
  NAV_GROUPS_DEF.forEach(g=>g.ids.forEach(id=>{ if(g.t) m[id] = g.t; }));
  return m;
})();

function renderTopNav(){
  const mainWrap = document.getElementById('topMainNav');
  const subWrap  = document.getElementById('topSubNav');
  if(!mainWrap) return;
  const pendingCount = state.trainerRequests.filter(r=>r.status==='pending').length;
  /* مجموعات القائمة — كل صفحة إلى مجموعتها، وما لا مجموعة له يُلحق بالأخيرة */
  const NAV_GROUPS = NAV_GROUPS_DEF;
  const pages = visiblePages();
  const btn = p=>{
    const badge = (p.id==='settings' && currentRole==='admin' && pendingCount) ? `<span class="nv-badge" title="طلبات بانتظار الموافقة">${pendingCount}</span>` : '';
    return `<button class="sn-item${p.id===currentPage?' active':''}" data-page="${p.id}" data-tip="${escapeHtml(p.label)}" title="${escapeHtml(p.label)}">
      <span class="sn-ic">${icon(p.icon,18)}</span><span class="nav-text">${escapeHtml(p.label)}</span>${badge}</button>`;
  };
  const used = new Set();
  let navHtml = NAV_GROUPS.map(g=>{
    const inG = pages.filter(p=>g.ids.includes(p.id));
    inG.forEach(p=>used.add(p.id));
    if(!inG.length) return '';
    return (g.t ? `<div class="sn-group">${escapeHtml(g.t)}</div>` : '') + inG.map(btn).join('');
  }).join('');
  const rest = pages.filter(p=>!used.has(p.id));
  if(rest.length) navHtml += `<div class="sn-group">أخرى</div>` + rest.map(btn).join('');
  if(currentRole==='admin' || currentRole==='user'){
    navHtml = `<button class="sn-item sn-cta${currentPage==='newOrder'?' active':''}" data-page="newOrder" data-tip="طلب فعالية جديد" title="طلب فعالية جديد">
      <span class="sn-ic">${icon('plus',18)}</span><span class="nav-text">طلب فعالية جديد</span></button>` + navHtml;
  }
  mainWrap.innerHTML = navHtml;
  mainWrap.querySelectorAll('.sn-item').forEach(b=>{
    b.onclick=()=>{
      closeMobileDrawer();
      /* طلب فعالية صفحة داخل النظام لا نافذة منبثقة */
      currentPage=b.dataset.page; if(currentPage==='order'){editingOrderId=null;} render();
    };
  });
  // الأوراق الفرعية أسفل القسم الرئيسي مباشرة
  /* شريط الأوراق العلوي مخفي — كل صفحة تعرض ترويستها بحبّة منزلقة */
  subWrap.innerHTML=''; subWrap.style.display='none';
}
/* ترويسة موحّدة: سطر تعريفي + عنوان + وصف + حبّة أوراق منزلقة */
function pageHeader(pageId){
  const info = PAGE_HEADS[pageId];
  const subs = SUBPAGES[pageId];
  if(!info) return '';
  const cur = currentSubKey(pageId);
  const seg = (subs && subs.length) ? `<div class="seg">${subs.map(s=>
    `<button data-seg="${s.key}" class="${s.key===cur?'active':''}">${escapeHtml(s.label)}</button>`).join('')}</div>` : '';
  /* العنوان يظهر مرة واحدة في الشريط العلوي — هنا الوصف والأوراق فقط */
  return `<div class="pg-head pg-head-slim">
    <div><p>${escapeHtml(info[2])}</p></div>
    ${seg}
  </div>`;
}
function bindPageHeader(container, pageId){
  container.querySelectorAll('[data-seg]').forEach(b=>{
    b.onclick=()=>setSubTab(pageId, b.dataset.seg);
  });
}
function renderAppShell(root){
  root.innerHTML = `
  <div id="app" class="sidenav-layout">
    <aside id="sideNav">
      <div class="sn-brand">
        <div id="logoSlot"><span class="madar-logo" style="--lg-size:38px;" aria-hidden="true"><i></i><i></i><b></b></span></div>
        <div class="sn-name" id="orgNameDisplay">مدار</div>
        <div class="sn-sub" id="orgSubDisplay"></div>
      </div>
      <div class="sn-user">
        <div class="sn-uname" id="sideUser"></div>
        <div class="sn-role" id="sideRole"></div>
      </div>
      <button id="navToggle2" title="تثبيت القائمة مفتوحة / طيّها (يُحفظ اختيارك)" aria-label="تثبيت القائمة" onclick="toggleNav()">${icon('menu',18)}</button>
      <nav class="sn-list" id="topMainNav"></nav>
      <button id="switchRoleBtn" class="sn-logout" data-tip="تسجيل الخروج" aria-label="تسجيل الخروج" title="تسجيل الخروج"><span class="sn-ic">${icon('logOut',18)}</span><span class="nav-text">تسجيل الخروج</span></button>
    </aside>
    <div id="mainCol">
      <header id="topHeader">
        <button class="mob-toggle" id="mobToggleBtn" aria-label="القائمة">${icon('menu',18)}</button>
        <div style="flex:1;min-width:0;">
          <h1 id="pageTitle" class="th-title"></h1>
          <div class="sub" id="pageSub"></div>
        </div>
        <button id="themeToggle" aria-label="تبديل الوضع الليلي" title="الوضع الليلي" onclick="toggleTheme()"></button>
        <span id="syncPill" class="th-sync"></span>
        <span id="topbarUser" class="th-user"></span>
        <div id="topbarActions" style="display:flex; align-items:center; gap:6px;"></div>
      </header>
      <nav class="th-sub" id="topSubNav"></nav>
      <div class="content" id="content"></div>
    </div>
  </div>`;
  document.getElementById('switchRoleBtn').onclick=()=>{
    if(!confirm('هل تريد تسجيل الخروج من النظام؟')) return;
    const app=document.getElementById('app');
    if(app){ app.style.transition='opacity .28s ease, transform .28s ease';
             app.style.opacity='0'; app.style.transform='scale(.99)'; }
    setTimeout(()=>{ try{ exitArchive(true); }catch(e){} try{ if(__liveUnsub){ __liveUnsub(); __liveUnsub=null; } fbAuth().signOut(); }catch(e){} currentRole=null; loggedTrainerId=null; currentUser=null; renderRoot(); }, 260);
  };
  document.getElementById('mobToggleBtn').onclick=()=>{ document.getElementById('sideNav').classList.toggle('open'); };
  if(currentRole==='trainer'){ currentPage='trainerPortal'; }
  else if(!visiblePages().find(p=>p.id===currentPage)){ currentPage='home'; }
  render();
}

