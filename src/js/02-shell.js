/* ============ Page render dispatcher ============ */
/* مربع إحصائي موحّد: أيقونة + رقم كبير + تسمية */
function statBox(icon, num, label){
  return `<div class="stat-box">
    <div class="row-ic"><div class="ic">${emojiToIcon(icon,19)||icon}</div><div class="num">${num}</div></div>
    <div class="lbl">${escapeHtml(label)}</div>
  </div>`;
}
function renderNav(){
  renderTopNav();
  const nav = document.getElementById('mainNav'); if(!nav) { renderUserBox(); const tu=document.getElementById('topbarUser'); if(tu) tu.textContent = currentUser ? (currentUser.displayName||currentUser.username) : ''; return; }
  nav.innerHTML='';
  const pendingCount = state.trainerRequests.filter(r=>r.status==='pending').length;
  visiblePages().forEach(p=>{
    const b=document.createElement('button');
    b.className = p.id===currentPage ? 'active':'';
    b.setAttribute('data-label', p.label);   // يظهر كتلميح في الوضع المضغوط
    b.title = p.label;
    const badge = (p.id==='approvals' && pendingCount) ? ` <span class="badge" style="background:#FDF0DC;color:#8A1F42;">${pendingCount}</span>` : '';
    b.innerHTML = `<span class="ic">${p.icon}</span><span class="nav-text">${p.label}</span>${badge}`;
    b.onclick=()=>{ currentPage=p.id; if(p.id==='order'){editingOrderId=null;} closeMobileDrawer(); render(); };
    nav.appendChild(b);
  });
  renderUserBox();
  const tu=document.getElementById('topbarUser');
  if(tu) tu.textContent = currentUser ? (currentUser.displayName||currentUser.username) : '';
  const su=document.getElementById('sideUser'), sr=document.getElementById('sideRole');
  if(su) su.textContent = currentUser ? (currentUser.displayName||currentUser.username) : '';
  if(sr) sr.textContent = currentRole==='admin' ? 'مدير النظام' : currentRole==='user' ? 'مستخدم' : 'مقدم فعالية';
}
/* مربع معلومات المستخدم + حالة المزامنة الحقيقية */
const APP_VERSION = '5.0';
function renderUserBox(){
  const pill = document.getElementById('syncPill');
  if(pill){
    pill.className = 'th-sync ' + (syncState.ok?'ok':'bad');
    pill.innerHTML = `<span class="sync-dot ${syncState.ok?'sync-ok':'sync-bad'}"></span>${syncState.ok?'متزامن':(__offline?'غير متصل — محفوظ محليًا':'غير متزامن')} · v${APP_VERSION}`;
  }
  const host = document.getElementById('userBoxSlot');
  if(!host) return;
  const roleLabel = currentRole==='admin' ? 'مدير نظام' : currentRole==='user' ? 'مستخدم' : 'مقدم فعالية';
  const ok = syncState.ok;
  host.innerHTML = `<div class="userbox">
    <div class="row"><span class="k">الاسم</span><span class="v">${escapeHtml((currentUser&&currentUser.displayName)||(currentUser&&currentUser.username)||'—')}</span></div>
    <div class="row"><span class="k">الدور</span><span class="v">${roleLabel}</span></div>
    <div class="row"><span class="k">الإصدار</span><span class="v">${APP_VERSION}</span></div>
    <div class="row"><span class="k">المزامنة</span><span class="v"><span class="sync-dot ${ok?'sync-ok':'sync-bad'}"></span>${ok?'متزامن':'غير متزامن'}</span></div>
  </div>`;
}
function renderBell(){
  const today = todayStr();
  let upcomingList, notifList, notifKind;
  if(currentRole==='trainer' && loggedTrainerId){
    const myOrders = state.orders.filter(o=>(o.trainerIds||[]).includes(loggedTrainerId));
    upcomingList = myOrders.filter(o=>{ const d=daysDiffSafe(today,o.date); return d!==null && d>=0 && d<=2; });
    notifList = state.notifications.filter(n=>n.trainerId===loggedTrainerId).sort((a,b)=>b.createdAt-a.createdAt).slice(0,10);
    notifKind='trainer';
  } else {
    upcomingList = state.orders.filter(o=>{ if(!isLiveOrder(o)) return false; const d=daysDiffSafe(today,o.date); return d!==null && d>=0 && d<=2; });
    notifList = state.adminNotifications.slice().sort((a,b)=>b.createdAt-a.createdAt).slice(0,10);
    notifKind='admin';
  }
  const unreadCount = notifList.filter(n=>!n.read).length;
  const wrap = document.createElement('div');
  wrap.className='bell-wrap';
  wrap.innerHTML = `<button class="bell-btn" id="bellBtn" aria-label="الإشعارات" title="الإشعارات">${icon('bell',18)}${unreadCount?'<span class="dot"></span>':''}</button>
    <div class="bell-pnl" id="bellPnl">
      ${upcomingList.length?`<div style="font-weight:700;color:var(--maroon-800);padding:8px 10px;">فعاليات قريبة (خلال يومين)</div>${upcomingList.map(o=>`<div class="bell-item">📅 ${escapeHtml(o.title)} — ${o.date} ${o.timeFrom||''}</div>`).join('')}`:''}
      <div style="font-weight:700;color:var(--maroon-800);padding:8px 10px;">الإشعارات</div>
      ${notifList.length?notifList.map(n=>`<div class="bell-item" style="${n.read?'':'background:var(--maroon-50);'}">${escapeHtml(n.message)}</div>`).join(''):'<div class="bell-item" style="color:#999;">لا توجد إشعارات</div>'}
    </div>`;
  document.getElementById('topbarActions').appendChild(wrap);
  document.getElementById('bellBtn').onclick=async (e)=>{
    e.stopPropagation();
    document.getElementById('bellPnl').classList.toggle('open');
    if(notifKind==='admin'){ state.adminNotifications.forEach(n=>n.read=true); }
    else { state.notifications.filter(n=>n.trainerId===loggedTrainerId).forEach(n=>n.read=true); }
    await saveState();
  };
  document.addEventListener('click', function closeBell(ev){ const pnl=document.getElementById('bellPnl'); if(pnl && !wrap.contains(ev.target)){ pnl.classList.remove('open'); } }, {once:true});
}
function daysDiffSafe(from,to){ if(!from||!to) return null; return Math.round((new Date(to+'T00:00:00') - new Date(from+'T00:00:00'))/86400000); }
function renderRefreshBtn(){
  const btn = document.createElement('button');
  btn.className = 'icon-btn rect';
  btn.title = 'تحديث البيانات';
  btn.innerHTML = icon('refresh',16)+' تحديث';
  btn.onclick = async ()=>{
    btn.disabled = true;
    try{ await loadState(); toast('تم تحديث البيانات'); render(); }
    catch(e){ toast('تعذر التحديث، حاول مرة أخرى'); btn.disabled = false; }
  };
  document.getElementById('topbarActions').appendChild(btn);
}
function render(){
  /* الموافقات وبوابة المقدّم صارتا تبويبين داخل الإعدادات */
  if(currentRole && currentRole!=='trainer'){
    if(currentPage==='approvals'){ currentPage='settings'; settingsTab='approvals'; }
    else if(currentPage==='trainerPortal'){ currentPage='settings'; settingsTab='portal'; }
  }
  if(currentPage==='reports' && reportsSubTab==='sheet'){ currentPage='quickSheet'; reportsSubTab='rep'; }
  renderNav();
  const titleMap={home:['الصفحة الرئيسية','نظرة عامة على البرنامج'],
    newOrder:['طلب فعالية','إنشاء أمر تكليف جديد'],
    ordersList:['الطلبات','كل طلبات الفعاليات والمبادرات'],
    order:['طلبات الفعاليات والمبادرات','إنشاء ومتابعة أوامر التكليف'],
    admin:['الإداريات','المتابعة اليومية للفعاليات'],
    reports:['التقارير','تقارير مقدمي الفعاليات والمدارس والساعات'],
    operations:['مركز التشغيل','رؤية واحدة لكل ما يحتاج قرارًا أو متابعة أو توثيقًا اليوم'],
    schedule:['جدول المقدّمين','أحدث الفعاليات وإتاحة مقدّمي المبادرات خلال الفترة'],
    adminRequestsReport:['الطلبات الإدارية','تقرير مفرز بكل الطلبات الإدارية للبرامج'],
    quranActivities:['الأنشطة القرآنية','بيانات وتقارير برنامجي روح والرحيق'],
    stats:['الإحصائيات','تصنيفات وأعداد البرامج'],
    tasks:['المهام','قائمة المهام الإدارية'],
    trainerPortal:['بوابة مقدم الفعالية','متابعة فعالياتك وتقييمها'],
    results:['النتائج','إدخال وعرض نتائج وتقييمات الفعاليات'],
    distributions:['التوزيعات','فعاليات كل مقدم مبادرة خلال أسبوع/شهر/سنة'],
    approvals:['الموافقات','مراجعة طلبات تنفيذ المبادرات المقدَّمة من مقدمي الفعاليات'],
    settings:['الإعدادات','القوائم والموافقات وبوابة المقدّمين وسجل التعديلات'],
    quickSheet:['تعديل سريع','عدّل الفعاليات مباشرة في جدول واحد']};
  document.body.classList.toggle('page-neworder', currentPage==='newOrder');
  if(!(currentPage==='newOrder' || (currentPage==='order' && orderSubTab==='new'))) window.__wzLeft = true;
  const tm = titleMap[currentPage] || ['', ''];
  document.getElementById('pageTitle').textContent = tm[0];
  document.getElementById('pageSub').textContent = tm[1];
  document.getElementById('topbarActions').innerHTML='';
  renderBell();
  renderSearchBtn();
  renderRefreshBtn();
  const c = document.getElementById('content'); c.innerHTML='';
  c.classList.remove('big-inputs');   // تُضاف فقط للصفحات التي تحتاجها
  if(currentPage==='home'){ renderHome(c); appendHomeTargets(c); try{ appendHomeOccasions(c); }catch(e){ console.warn(e); } }
  else if(currentPage==='newOrder'){ orderSubTab='new'; renderOrderPage(c); }
  else if(currentPage==='ordersList'){ orderSubTab='list'; renderOrderPage(c); }
  else if(currentPage==='order') renderOrderPage(c);
  else if(currentPage==='admin') renderAdminPage(c);
  else if(currentPage==='operations') renderOperationsCenter(c);
  else if(currentPage==='schedule') renderSchedulePage(c);
  else if(currentPage==='reports'){
    if(reportsSubTab==='sheet') renderQuickEditSheet(c);
    else renderReportsPage(c);
  }
  else if(currentPage==='adminRequestsReport') renderAdminRequestsReportPage(c);
  else if(currentPage==='quranActivities') renderQuranActivitiesPage(c);
  else if(currentPage==='stats') renderStatsPage(c);
  else if(currentPage==='tasks') renderTasksPage(c);
  else if(currentPage==='trainerPortal') renderTrainerPortalPage(c);
  else if(currentPage==='results') renderResultsPage(c);
  else if(currentPage==='distributions') renderDistributionsPage(c);
  else if(currentPage==='approvals') renderApprovalsPage(c);
  else if(currentPage==='settings') renderSettingsHub(c);
  else if(currentPage==='quickSheet') renderQuickEditSheet(c);
  /* مسار التنقّل — في كل صفحة عدا الرئيسية */
  if(currentPage !== 'home' && currentRole !== 'trainer'){
    const cr = document.createElement('nav');
    cr.className = 'crumbs'; cr.setAttribute('aria-label','مسار التنقّل');
    const grp = NAV_GROUP_OF[currentPage] || '';
    cr.innerHTML = `<button type="button" id="crHome">${icon('home',13)} الرئيسية</button>`
      + (grp && grp!==tm[0] ? `<span class="sep">/</span><b>${escapeHtml(grp)}</b>` : '')
      + `<span class="sep">/</span><b style="color:var(--ds-ink);">${escapeHtml(tm[0]||'')}</b>`;
    c.insertBefore(cr, c.firstChild);
    const ch = cr.querySelector('#crHome');
    if(ch) ch.onclick = ()=>{ currentPage='home'; render(); };
  }
  /* ⚠ بعد رسم الصفحة لا قبله: مولّدات الصفحات تُسنِد innerHTML كاملًا
     فتمحو أي شيء أُضيف قبلها. */
  if(__readFailed){
    const bar = document.createElement('div');
    bar.className = 'db-down';
    bar.innerHTML = `${icon('alert',17)}
      <div class="db-down-tx">
        <b>الاتصال بقاعدة البيانات متعذّر — الحفظ موقوف</b>
        <i>بياناتك المخزّنة سليمة، ولن يُكتب فوقها شيء حتى ينجح الاتصال.</i>
      </div>
      <span class="db-down-btns">
        <button class="btn btn-sm btn-primary" id="dbRetry">إعادة المحاولة</button>
        <button class="btn btn-sm btn-outline" id="dbDiag">فحص الاتصال</button>
      </span>`;
    c.insertBefore(bar, c.firstChild);
    bar.querySelector('#dbRetry').onclick = ()=>retryConnection();
    bar.querySelector('#dbDiag').onclick  = ()=>diagnoseConnection();
  }
  ensureToTop();
  document.getElementById('orgNameDisplay').textContent = state.orgName || 'إدارة الفعاليات';
  document.getElementById('logoSlot').innerHTML = state.logo ? `<img src="${state.logo}">` : `<div class="logo-placeholder">${icon('landmark',26)}</div>`;
  const _osd=document.getElementById('orgSubDisplay'); if(_osd) _osd.textContent=(state.printHeader&&state.printHeader.line2)||'';
  attachDateHints();
  attachDateDisplays();
  attachTimeDisplays();
  attachCardActivation();
}

/* ══════════════════════════════════════════════════════════════════
   توضيح التاريخ تحت كل حقل تاريخ
   ──────────────────────────────────────────────────────────────────
   حقل <input type="date"> يعرض ترتيب اليوم/الشهر حسب لغة المتصفح،
   وقد يظهر mm/dd/yyyy في بعض الأجهزة مما يوهم أن الشهر هو اليوم.
   القيمة المخزَّنة دائمًا صحيحة (YYYY-MM-DD)، لذا نعرض تحت كل حقل
   نصًا صريحًا بالعربية لا يحتمل اللبس، مثل: 6 أغسطس 2026 (06/08/2026)
   ══════════════════════════════════════════════════════════════════ */
function dateInWords(iso){
  if(!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m) return '';
  const names=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const day=parseInt(m[3],10), mon=names[parseInt(m[2],10)-1]||m[2], yr=m[1];
  return `${day} ${mon} ${yr} (${m[3]}/${m[2]}/${m[1]})`;
}
/* عند النقر على أي لوح يتحول للعنابي، ويعود ما سواه للأزرق الفاتح */
function attachCardActivation(){
  const host = document.getElementById('content');
  if(!host || host.dataset.cardActBound === '1') return;
  host.addEventListener('click', e=>{
    const card = e.target.closest('.card');
    if(!card || !host.contains(card)) return;
    host.querySelectorAll('.card.is-active').forEach(c=>{ if(c!==card) c.classList.remove('is-active'); });
    card.classList.add('is-active');
  });
  host.dataset.cardActBound = '1';
}
/* ══════════════════════════════════════════════════════════════════
   عرض حقول التاريخ بصيغة يوم/شهر/سنة دائمًا
   ──────────────────────────────────────────────────────────────────
   المتصفح يعرض <input type="date"> بترتيب لغة الجهاز (قد يكون mm/dd/yyyy)
   ولا يمكن فرض الترتيب عبر CSS. الحل: نخفي نص المتصفح ونضع فوقه نصًا
   من صنعنا بصيغة DD/MM/YYYY، مع بقاء تقويم المتصفح يعمل كالمعتاد.
   ══════════════════════════════════════════════════════════════════ */
/* يعرض المحتوى كما هو إن كان HTML مُعدًّا مسبقًا، وإلا يُهرّبه */
function cellHtml(v){
  const s = String(v===null||v===undefined?'':v);
  return s.trim().startsWith('<') ? s : escapeHtml(s);
}
/* تحديث النص المعروض فوق حقل التاريخ بعد تعيين القيمة برمجيًا
   (تعيين .value لا يُطلق input/change فيبقى الحقل يبدو فارغًا) */
function refreshDateView(el){
  if(!el) return;
  const wrap = el.parentElement;
  if(!wrap || !wrap.classList.contains('dwrap')) return;
  const view = wrap.querySelector('.dview');
  if(!view) return;
  view.textContent = el.value ? fmtDate(el.value).replace(/[\u2066\u2069]/g,'') : 'يوم/شهر/سنة';
  view.classList.toggle('empty', !el.value);
}
function setDateValue(el, v){
  if(!el) return;
  el.value = v || '';
  refreshDateView(el);
}
/* عرض الوقت بأرقام إنجليزية دائمًا (المتصفح يعرضه بأرقام عربية حسب لغة الجهاز) */
function fmtTime12(v){
  if(!v) return '--:-- --';
  const [H,M] = v.split(':').map(Number);
  const ap = H < 12 ? 'ص' : 'م';
  let h12 = H % 12; if(h12 === 0) h12 = 12;
  return `${String(h12).padStart(2,'0')}:${String(M).padStart(2,'0')} ${ap}`;
}
function refreshTimeView(el){
  if(!el) return;
  const wrap = el.parentElement;
  if(!wrap || !wrap.classList.contains('twrap')) return;
  const view = wrap.querySelector('.tview');
  if(!view) return;
  view.textContent = fmtTime12(el.value);
  view.classList.toggle('empty', !el.value);
}
function attachTimeDisplays(){
  document.querySelectorAll('.page-neworder .content input[type="time"], .glow-card input[type="time"]').forEach(inp=>{
    let wrap = inp.parentElement;
    if(!wrap || !wrap.classList.contains('twrap')){
      wrap = document.createElement('span'); wrap.className='twrap';
      inp.parentNode.insertBefore(wrap, inp); wrap.appendChild(inp);
      const v = document.createElement('span'); v.className='tview'; wrap.appendChild(v);
    }
    if(!inp.dataset.tviewBound){
      ['input','change'].forEach(ev=>inp.addEventListener(ev, ()=>refreshTimeView(inp)));
      inp.dataset.tviewBound='1';
    }
    refreshTimeView(inp);
  });
}
function attachDateDisplays(){
  document.querySelectorAll('input[type="date"]').forEach(inp=>{
    let wrap = inp.parentElement;
    if(!wrap || !wrap.classList.contains('dwrap')){
      wrap = document.createElement('span');
      wrap.className = 'dwrap';
      inp.parentNode.insertBefore(wrap, inp);
      wrap.appendChild(inp);
      const view = document.createElement('span');
      view.className = 'dview';
      wrap.appendChild(view);
    }
    const view = wrap.querySelector('.dview');
    const upd = ()=>{
      const v = inp.value;
      view.textContent = v ? fmtDate(v).replace(/[\u2066\u2069]/g,'') : 'يوم/شهر/سنة';
      view.classList.toggle('empty', !v);
    };
    if(!inp.dataset.dviewBound){
      inp.addEventListener('input', upd);
      inp.addEventListener('change', upd);
      inp.dataset.dviewBound = '1';
    }
    upd();
  });
}
function attachDateHints(){
  document.querySelectorAll('input[type="date"]').forEach(inp=>{
    if(inp.closest('td') && inp.classList.contains('qs-field')) return; // جدول التعديل السريع: مساحته ضيقة
    let hint = inp.nextElementSibling;
    if(!hint || !hint.classList || !hint.classList.contains('date-hint')){
      hint = document.createElement('div');
      hint.className = 'date-hint';
      inp.insertAdjacentElement('afterend', hint);
    }
    const upd = ()=>{ hint.textContent = inp.value ? dateInWords(inp.value) : ''; };
    if(!inp.dataset.hintBound){ inp.addEventListener('input', upd); inp.addEventListener('change', upd); inp.dataset.hintBound='1'; }
    upd();
  });
}

/* ============ Home ============ */
/* ══════════════════════════════════════════════════════════════════
   التقويم السنوي للمدارس — العام الأكاديمي 2026/2027
   kind: staff = بدء دوام موظفين | exam = اختبارات | holiday = إجازة
         studentStart = بدء دوام الطلبة | resume = استئناف الدوام
   ══════════════════════════════════════════════════════════════════ */
const ACADEMIC_CALENDAR = [
  {t:'بدء دوام الموظفين في المدارس للعام الأكاديمي 2026/2027', from:'2026-08-23', to:'2026-08-23', kind:'staff'},
  {t:'اختبارات الدور الثاني لجميع الصفوف (1–12) نهاري – تعليم الكبار للعام الأكاديمي 2025/2026', from:'2026-08-23', to:'2026-08-27', kind:'exam'},
  {t:'بدء الدوام للطلبة للعام الأكاديمي 2026/2027', from:'2026-08-30', to:'2026-08-30', kind:'studentStart'},
  {t:'اختبارات منتصف الفصل الدراسي الأول للصفين (10–11) نهاري', from:'2026-10-13', to:'2026-10-22', kind:'exam'},
  {t:'اختبارات منتصف الفصل الدراسي الأول للصفوف (1–9) نهاري', from:'2026-10-14', to:'2026-10-22', kind:'exam'},
  {t:'إجازة منتصف الفصل الدراسي الأول', from:'2026-10-25', to:'2026-10-29', kind:'holiday'},
  {t:'بدء الدوام بعد إجازة منتصف الفصل الدراسي الأول', from:'2026-11-01', to:'2026-11-01', kind:'resume'},
  {t:'اختبارات نهاية الفصل الدراسي الأول للصف (12) نهاري – تعليم الكبار', from:'2026-12-06', to:'2026-12-15', kind:'exam'},
  {t:'اختبارات نهاية الفصل الدراسي الأول للصفين (10–11) نهاري – تعليم الكبار', from:'2026-12-06', to:'2026-12-15', kind:'exam'},
  {t:'اختبارات نهاية الفصل الدراسي الأول للصفوف (1–9) نهاري – تعليم الكبار', from:'2026-12-07', to:'2026-12-15', kind:'exam'},
  {t:'إجازة منتصف العام الأكاديمي', from:'2026-12-20', to:'2027-01-02', kind:'holiday'},
  {t:'بدء دوام الموظفين للفصل الدراسي الثاني', from:'2027-01-03', to:'2027-01-03', kind:'staff'},
  {t:'بدء دوام الطلبة للفصل الدراسي الثاني', from:'2027-01-04', to:'2027-01-04', kind:'studentStart'},
  {t:'ملحق اختبارات نهاية الفصل الدراسي الأول للصفوف (1–12) نهاري – تعليم الكبار', from:'2027-01-17', to:'2027-01-26', kind:'exam'},
  {t:'اختبارات منتصف الفصل الدراسي الثاني للصفين (10–11) نهاري', from:'2027-03-21', to:'2027-03-30', kind:'exam'},
  {t:'اختبارات منتصف الفصل الدراسي الثاني للصفوف (1–9) نهاري', from:'2027-03-22', to:'2027-03-30', kind:'exam'},
  {t:'إجازة نهاية أسبوع مطولة', from:'2027-03-31', to:'2027-04-01', kind:'holiday'},
  {t:'بدء الدوام بعد إجازة نهاية أسبوع مطولة', from:'2027-04-04', to:'2027-04-04', kind:'resume'},
  {t:'اختبارات نهاية الفصل الدراسي الثاني للصف (12) نهاري – تعليم الكبار', from:'2027-06-01', to:'2027-06-17', kind:'exam'},
  {t:'اختبارات نهاية الفصل الدراسي الثاني للصفين (10–11) نهاري – تعليم الكبار', from:'2027-06-03', to:'2027-06-15', kind:'exam'},
  {t:'اختبارات نهاية الفصل الدراسي الثاني للصفوف (1–9) نهاري – تعليم الكبار', from:'2027-06-03', to:'2027-06-14', kind:'exam'},
  {t:'إجازة الموظفين في المدارس', from:'2027-06-27', to:'2027-08-19', kind:'holiday'},
  {t:'بدء دوام الموظفين في المدارس للعام الأكاديمي 2027/2028', from:'2027-08-22', to:'2027-08-22', kind:'staff'},
  {t:'اختبارات الدور الثاني لجميع الصفوف (1–12) نهاري – تعليم الكبار للعام 2026/2027', from:'2027-08-22', to:'2027-08-26', kind:'exam'},
  {t:'بدء الدوام للطلبة للعام الأكاديمي 2027/2028', from:'2027-08-29', to:'2027-08-29', kind:'studentStart'},
];
const KIND_LABEL = {staff:'دوام موظفين', exam:'اختبارات', holiday:'إجازة', studentStart:'بدء دوام الطلبة', resume:'استئناف الدوام'};
const KIND_COLOR = {staff:'#5A142F', exam:'#5A142F', holiday:'#A8871C', studentStart:'#1E9E57', resume:'#1E9E57'};

function addDaysISO(iso, n){
  /* نبني التاريخ من المكوّنات المحلية — toISOString يحوّل إلى UTC
     فيُرجِع اليوم السابق في التوقيتات المتقدمة عن غرينتش (مثل +3) */
  const d = new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n);
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}
/* يفحص تاريخ الفعالية مقابل التقويم ويعيد قائمة تنبيهات */
/* اختبارات التعليم النهاري للكبار — لا تمنع تقديم الفعاليات */
function isAdultEdExam(ev){
  return /تعليم\s*الكبار/.test(String(ev && ev.t || ''));
}
function checkAcademicDate(date, dateTo){
  if(!date) return [];
  const s = date, e = dateTo || date;
  const out = [];
  // أول يوم دوام للطلبة = بداية قبول طلبات الفعاليات
  const firstStudentDay = ACADEMIC_CALENDAR.filter(x=>x.kind==='studentStart').map(x=>x.from).sort()[0];
  if(firstStudentDay && s < firstStudentDay){
    out.push({level:'warn', msg:`التاريخ قبل بدء الدوام للطلبة (${fmtDate(firstStudentDay)}) — قبول طلبات الفعاليات يبدأ من ذلك التاريخ.`});
  }
  ACADEMIC_CALENDAR.forEach(ev=>{
    const overlaps = s <= ev.to && e >= ev.from;
    /* اختبارات «نهاري – تعليم الكبار» مستبعدة من المنع — تذكير فقط عند التداخل */
    if(ev.kind==='exam' && isAdultEdExam(ev)){
      if(overlaps) out.push({level:'info',
        msg:`تذكير: ${ev.t} (${fmtDate(ev.from)} — ${fmtDate(ev.to)}) — مستبعدة من المنع.`});
      return;
    }
    if(ev.kind==='exam'){
      // فترة الاختبارات + الأسبوع الذي يسبقها
      const preFrom = addDaysISO(ev.from, -7);
      if(s <= ev.to && e >= preFrom){
        const inside = overlaps;
        out.push({level:'block',
          msg:`${inside?'التاريخ داخل فترة اختبارات':'التاريخ ضمن الأسبوع الذي يسبق الاختبارات'}: ${ev.t} (${fmtDate(ev.from)} — ${fmtDate(ev.to)}) — لا يمكن تقديم برامج أو فعاليات.`});
      }
    } else if(ev.kind==='holiday' && overlaps){
      out.push({level:'block', msg:`التاريخ ضمن إجازة: ${ev.t} (${fmtDate(ev.from)} — ${fmtDate(ev.to)}) — لا يجوز تقديم فعاليات.`});
    } else if(ev.kind==='staff' && overlaps){
      out.push({level:'block', msg:`التاريخ في فترة بدء دوام الموظفين: ${ev.t} (${fmtDate(ev.from)}) — لا يجوز تقديم فعاليات.`});
    }
  });
  // تذكير: ليس يومًا دراسيًا معروفًا
  if(!out.length){
    const known = ACADEMIC_CALENDAR.some(ev=>s <= ev.to && e >= ev.from);
    const isWeekend = [5,6].includes(new Date(s+'T00:00:00').getDay()); // الجمعة والسبت
    if(isWeekend) out.push({level:'warn', msg:'التاريخ يقع في عطلة نهاية الأسبوع (الجمعة/السبت) — تذكير: قد لا يكون يومًا تعليميًا.'});
    else if(!known) out.push({level:'info', msg:'هذا التاريخ غير مدرج في التقويم المدرسي كيوم فعالية معروف — تذكير فقط في حال كان البرنامج غير خاص بالمدارس.'});
  }
  return out;
}
function academicCalendarTable(){
  return `<div class="tbl-scroll"><table>
    <thead><tr><th style="min-width:260px;">البيان</th><th>من</th><th>إلى</th><th>النوع</th></tr></thead>
    <tbody>${ACADEMIC_CALENDAR.map(ev=>`<tr>
      <td style="text-align:right;">${escapeHtml(ev.t)}</td>
      <td>${fmtDate(ev.from)}</td>
      <td>${ev.to!==ev.from?fmtDate(ev.to):'—'}</td>
      <td>${isAdultEdExam(ev)
        ? `<span class="badge" style="background:#E4EDF2;color:#3E7894;" title="مستبعدة من منع الفعاليات">تعليم الكبار — لا يمنع</span>`
        : `<span class="badge" style="background:${KIND_COLOR[ev.kind]};color:#fff;">${KIND_LABEL[ev.kind]}</span>`}</td>
    </tr>`).join('')}</tbody></table></div>`;
}
/* ══ شارات الحالة الملوّنة ══ */
/* ألوان الحالات الموحّدة — نفس الدلالة في الجداول والتقويم ومركز التشغيل والرئيسية:
   قادمة = أزرق · اليوم = تركوازي · منجزة = أخضر · تحتاج متابعة/لم تتم = أحمر · مؤجّلة = كهرماني · ملغاة = رمادي */
const DONE_STYLES = {
  'تم':            {bg:'var(--ds-ok-l)',   fg:'var(--ds-ok)'},
  'لم يتم':        {bg:'var(--ds-dan-l)',  fg:'var(--ds-dan)'},
  'الغيت':         {bg:'var(--ds-line-2)', fg:'var(--ds-ink-3)'},
  'المشرف لا يرد': {bg:'var(--ds-warn-l)', fg:'#9A5B00'},
  '':              {bg:'var(--ds-bg)',     fg:'var(--ds-ink-3)'},
};
const STATE_STYLES = {
  'active':    {bg:'var(--ds-teal-l)', fg:'var(--ds-teal-d)', label:'نشطة'},
  'cancelled': {bg:'var(--ds-line-2)', fg:'var(--ds-ink-3)',  label:'ملغاة'},
  'postponed': {bg:'var(--ds-warn-l)', fg:'#9A5B00',          label:'مؤجّلة'},
};
function pill(text, bg, fg){
  return `<span style="display:inline-block;background:${bg};color:${fg};padding:3px 10px;border-radius:20px;font-size:12px;white-space:nowrap;">${escapeHtml(text)}</span>`;
}
function doneBadge(v){
  const s = DONE_STYLES[v||''] || DONE_STYLES[''];
  return pill(v || 'لم تنجز بعد', s.bg, s.fg);
}
function stateBadge(v){
  const s = STATE_STYLES[v||'active'] || STATE_STYLES['active'];
  return pill(s.label, s.bg, s.fg);
}
/* صف تفصيلي بشريط نسبة — بأسلوب جداول لوحة التحكم */
function breakdownRows(items, total){
  if(!items.length) return `<tr><td colspan="3" style="text-align:center;color:#999;padding:10px;">لا توجد بيانات</td></tr>`;
  return items.map(it=>{
    const pct = total ? Math.round((it.count/total)*1000)/10 : 0;
    return `<tr>
      <td style="text-align:right;">${escapeHtml(it.name)}</td>
      <td style="width:44%;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="flex:1;height:8px;background:#EFEDE6;border-radius:20px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${it.color||'#5A142F'};"></div>
          </div>
        </div>
      </td>
      <td style="width:64px;">${it.count}</td>
      <td style="width:64px;direction:ltr;">${pct}%</td>
    </tr>`;
  }).join('');
}
/* ══ رسم دائري (Donut) بلا مكتبات — SVG خالص ══ */
function donutChart(items, centerLabel, centerValue){
  const total = items.reduce((s,x)=>s+x.count,0);
  if(!total) return '<div class="empty-state">لا توجد بيانات</div>';
  const R = 62, SW = 22, C = 2*Math.PI*R;
  let acc = 0;
  const arcs = items.map(it=>{
    const frac = it.count/total;
    const dash = `${(frac*C).toFixed(2)} ${(C-frac*C).toFixed(2)}`;
    const off = (-acc*C).toFixed(2);
    acc += frac;
    return `<circle cx="80" cy="80" r="${R}" fill="none" stroke="${it.color}" stroke-width="${SW}"
      stroke-dasharray="${dash}" stroke-dashoffset="${off}" transform="rotate(-90 80 80)"></circle>`;
  }).join('');
  const legend = items.map(it=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">
      <span style="width:9px;height:9px;border-radius:50%;background:${it.color};flex:none;"></span>
      <span style="flex:1;font-size:12.5px;color:#333;">${escapeHtml(it.name)}</span>
      <span style="font-size:12.5px;font-weight:700;color:#111;direction:ltr;">${it.count}</span>
    </div>`).join('');
  return `<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:center;">
    <div style="position:relative;flex:none;">
      <svg width="160" height="160" viewBox="0 0 160 160">${arcs}</svg>
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">
        <div style="font-size:11.5px;color:#777;">${escapeHtml(centerLabel)}</div>
        <div style="font-size:26px;font-weight:700;color:#111;direction:ltr;">${centerValue}</div>
      </div>
    </div>
    <div style="flex:1;min-width:150px;">${legend}</div>
  </div>`;
}
/* ══ رسم أعمدة بلا مكتبات ══ */
function barChart(items){
  const max = Math.max(...items.map(x=>x.count), 1);
  return `<div style="display:flex;align-items:flex-end;gap:12px;height:170px;padding:8px 4px 0;">
    ${items.map(it=>{
      const hpct = Math.max((it.count/max)*100, 4);
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;height:100%;justify-content:flex-end;">
        <div style="font-size:12px;font-weight:700;color:#111;direction:ltr;">${it.count}</div>
        <div style="width:100%;max-width:54px;height:${hpct}%;background:${it.color};border-radius:6px 6px 0 0;"></div>
        <div style="font-size:11px;color:#666;text-align:center;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${escapeHtml(it.name)}</div>
      </div>`;
    }).join('')}
  </div>`;
}
/* ══════════════════════════════════════════════════════════════════
   مركز التشغيل — رحلة المبادرة من الوصول حتى توثيق الأثر
   ملاحظة: مراحل النظام مشتقّة من حقول البيانات الفعلية
   (status: active/postponed/cancelled + completionStatus)
   ولم تُخترع حقول جديدة حفاظًا على البيانات القائمة.
   ══════════════════════════════════════════════════════════════════ */
function opsStageOf(o){
  if((o.status||'active')==='postponed') return 'postponed';
  if((o.status||'active')==='cancelled') return 'cancelled';
  if(o.completionStatus==='تم') return 'documented';          // أثر موثق
  const t = todayStr();
  if(o.date && o.date < t) return 'decide';                    // انتهت ولم تُقيَّم → يحتاج قرار
  return 'preparing';                                          // قادمة → قيد التجهيز
}
/* الانتقال للمرحلة التالية باستخدام الحقول القائمة */
function opsNextStage(o){
  const st = opsStageOf(o);
  if(st==='postponed') return {status:'active', completionStatus:'', label:'قيد التجهيز'};
  if(st==='preparing') return {status:'active', completionStatus:'', label:'يحتاج قرارًا', forceDecide:true};
  if(st==='decide')    return {status:'active', completionStatus:'تم', label:'أثر موثق'};
  return null;                                                  // موثق يبقى موثقًا
}
async function opsAdvance(id){
  const o = state.orders.find(x=>x.id===id); if(!o) return;
  const nx = opsNextStage(o);
  if(!nx){ toast('المبادرة موثقة بالفعل'); return; }
  if(nx.forceDecide){ toast('المبادرة لم يحن موعدها بعد — ستنتقل تلقائيًا عند انتهائها'); return; }
  o.status = nx.status;
  if(nx.completionStatus !== undefined) o.completionStatus = nx.completionStatus;
  await saveState();
  toast(`تم نقل المبادرة إلى ${nx.label}`);
  render();
}
/* ══ الوضع الليلي ══ */
function applyTheme(){
  let dark='0'; try{ dark = localStorage.getItem('theme')==='dark' ? '1':'0'; }catch(e){}
  document.body.classList.toggle('dark', dark==='1');
  const b=document.getElementById('themeToggle');
  if(b) b.innerHTML = icon(dark==='1'?'sun':'moon', 17);
}
function toggleTheme(){
  const nowDark = !document.body.classList.contains('dark');
  try{ localStorage.setItem('theme', nowDark?'dark':'light'); }catch(e){}
  applyTheme();
}
/* ══ لوح طلب الفعالية المنزلق من اليسار ══ */
function openOrderDrawer(orderId){
  closeOrderDrawer(true);
  editingOrderId = orderId || null;
  const ed = orderId ? state.orders.find(o=>o.id===orderId) : null;
  const scrim = document.createElement('div'); scrim.className='drawer-scrim'; scrim.id='orderScrim';
  const panel = document.createElement('aside'); panel.className='drawer-panel'; panel.id='orderDrawer';
  panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','true');
  panel.innerHTML = `
    <div class="drawer-head">
      <div style="flex:1;min-width:0;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;">
        <h2 style="margin:0;">${ed ? 'تعديل الفعالية — أمر رقم '+ed.serial : 'طلب فعالية جديد'}</h2>
        <span class="dh-sub" style="margin:0;">${ed ? 'عدّل البيانات ثم احفظ' : 'أدخل بيانات المبادرة وأرسلها للاعتماد'}</span>
      </div>
      <button class="drawer-close" id="drawerCloseBtn" aria-label="إغلاق" title="إغلاق">${icon('x',18)}</button>
    </div>
    <div class="drawer-body orders-page" id="orderDrawerBody"></div>`;
  document.body.appendChild(scrim); document.body.appendChild(panel);
  document.body.style.overflow='hidden';
  renderOrderForm(document.getElementById('orderDrawerBody'));
  attachDateHints(); attachDateDisplays(); attachTimeDisplays();
  scrim.onclick = ()=>closeOrderDrawer();
  document.getElementById('drawerCloseBtn').onclick = ()=>closeOrderDrawer();
  document.addEventListener('keydown', drawerEsc);
}
function drawerEsc(e){ if(e.key==='Escape') closeOrderDrawer(); }
function closeOrderDrawer(silent){
  const s=document.getElementById('orderScrim'), p=document.getElementById('orderDrawer');
  if(s) s.remove(); if(p) p.remove();
  document.body.style.overflow='';
  document.removeEventListener('keydown', drawerEsc);
  if(!silent){ editingOrderId=null; render(); }
}
