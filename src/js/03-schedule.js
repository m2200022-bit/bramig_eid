/* ══════════════════════════════════════════════════════════════════════
   جدول المقدّمين — أحدث الفعاليات وإتاحة مقدّمي المبادرات
   ══════════════════════════════════════════════════════════════════════ */
let schedRange = 'week';
/* ══════════════════════════════════════════════════════════════════════
   مقترح توزيع فعاليات جهة على الأشهر — يتجنّب الإجازات والاختبارات
   ══════════════════════════════════════════════════════════════════════ */
function openPlanWizard(){
  const schools = (state.schools||[]).slice().sort((a,b)=>a.name.localeCompare(b.name,'ar'));
  if(!schools.length){ toast('لا توجد جهات مسجّلة'); return; }
  const guess = schools.find(s=>/أسامة\s*بن\s*زيد/.test(s.name)) || schools[0];
  openModal('اقتراح توزيع فعاليات', [
    {name:'school',  label:'الجهة', type:'select',
     options: schools.map(s=>({value:s.id, label:s.name}))},
    {name:'perMonth',label:'عدد الفعاليات شهريًا', type:'number'},
    {name:'from',    label:'من تاريخ', type:'date'},
    {name:'to',      label:'إلى تاريخ', type:'date'},
    {name:'pin',     label:'تواريخ تُثبَّت ولا تُغيَّر (مفصولة بفاصلة)'},
  ], v=>{
    const sid = v.school || guess.id;
    const per = Math.max(1, Number(v.perMonth) || 2);
    const from = v.from || todayStr();
    const to   = v.to   || addDaysISO(from, 364);
    const pins = String(v.pin||'').split(/[،,]/).map(x=>normPinDate(x)).filter(Boolean);
    setTimeout(()=>showPlan(sid, per, from, to, pins), 60);
  });
  setTimeout(()=>{
    const s=document.getElementById('mf_school'); if(s) s.value = guess.id;
    const p=document.getElementById('mf_perMonth'); if(p) p.value = 2;
    const f=document.getElementById('mf_from'); if(f) f.value = todayStr();
    const t=document.getElementById('mf_to');   if(t) t.value = addDaysISO(todayStr(), 364);
    const pn=document.getElementById('mf_pin'); if(pn) pn.value = '30-9-2026';
  },0);
}
/* يقبل 30-9-2026 أو 2026-09-30 أو 30/09/2026 */
function normPinDate(s){
  const t = String(s||'').trim(); if(!t) return '';
  let m = t.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if(m) return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
  m = t.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if(m) return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
  return '';
}
function showPlan(schoolId, perMonth, from, to, pins){
  pins = pins || [];
  const sc = state.schools.find(x=>x.id===schoolId);
  if(!sc){ toast('الجهة غير موجودة'); return; }
  const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const isWeekend = iso => { const d=new Date(iso+'T00:00:00').getDay(); return d===5 || d===6; };
  /* يوم صالح: ليس عطلة ولا محظورًا بالتقويم ولا مشغولًا بفعالية أخرى لنفس الجهة */
  function dayInfo(iso){
    if(isWeekend(iso)) return {ok:false, why:'عطلة نهاية الأسبوع'};
    const notes = (typeof checkAcademicDate==='function') ? (checkAcademicDate(iso)||[]) : [];
    const block = notes.find(n=>n && n.type==='block');
    if(block) return {ok:false, why:block.msg || 'محظور بالتقويم'};
    const warn = notes.find(n=>n && n.type==='warn');
    const busy = (state.orders||[]).some(o=>{
      if(isCancelledOrder(o)) return false;
      const s=o.date||''; if(!s) return false;
      const e=orderEnd(o);
      return iso>=s && iso<=e && o.schoolId===schoolId;
    });
    if(busy) return {ok:false, why:'الجهة مرتبطة بفعالية في هذا اليوم'};
    return {ok:true, warn: warn ? (warn.msg||'تنبيه') : null};
  }
  /* بناء قائمة الأشهر */
  const months = [];
  let cur = from.slice(0,7);
  const last = to.slice(0,7);
  let guard = 0;
  while(cur <= last && guard < 36){
    months.push(cur);
    const [y,m] = cur.split('-').map(Number);
    const ny = m===12 ? y+1 : y, nm = m===12 ? 1 : m+1;
    cur = `${ny}-${String(nm).padStart(2,'0')}`;
    guard++;
  }
  const plan = months.map(mk=>{
    const [y,m] = mk.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    /* المواعيد المثبّتة في هذا الشهر تبقى كما هي وتُحسب من نصيبه */
    const pinned = pins.filter(p=>p.slice(0,7)===mk).sort();
    const need = Math.max(0, perMonth - pinned.length);
    const cands = [];
    for(let d=1; d<=lastDay; d++){
      const iso = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if(iso < from || iso > to) continue;
      if(pins.includes(iso)) continue;              // لا نقترح فوق مثبّت
      const inf = dayInfo(iso);
      if(inf.ok) cands.push({iso, warn:inf.warn});
    }
    /* نوزّع المقترحات على الشهر بتباعد متساوٍ، ونفضّل الأيام بلا تنبيه */
    const clean = cands.filter(c=>!c.warn);
    const pool  = clean.length >= need ? clean : cands;
    const picks = pinned.map(p=>({iso:p, pinned:true}));
    if(pool.length && need>0){
      const step = pool.length / need;
      for(let i=0;i<need;i++){
        const idx = Math.min(pool.length-1, Math.floor(i*step + step/2));
        if(!picks.some(p=>p.iso===pool[idx].iso)) picks.push(pool[idx]);
      }
    }
    picks.sort((a,b)=>a.iso.localeCompare(b.iso));
    return {mk, label:`${MONTHS[m-1]} ${y}`, picks, avail:cands.length, pinnedN:pinned.length};
  });
  const totalPicks = plan.reduce((s,p)=>s+p.picks.length, 0);
  const shortMonths = plan.filter(p=>p.picks.length < perMonth);
  const DW = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const body = `
    <div class="helper" style="margin-bottom:10px;line-height:1.9;">
      <b>${escapeHtml(sc.name)}</b> — ${perMonth} فعالية شهريًا<br>
      ${plan.length} شهرًا · <b>${totalPicks}</b> موعدًا مقترحًا
      ${shortMonths.length?`<br><span style="color:var(--warning);">⚠ ${shortMonths.length} شهرًا لم تكتمل مواعيدها (أيام متاحة غير كافية)</span>`:''}
    </div>
    <div style="max-height:52vh;overflow:auto;">
      <table class="set-table" style="width:100%;"><thead><tr>
        <th style="text-align:right;">الشهر</th><th style="text-align:right;">المواعيد المقترحة</th><th>أيام متاحة</th>
      </tr></thead><tbody>
        ${plan.map(p=>`<tr>
          <td style="text-align:right;white-space:nowrap;"><b>${escapeHtml(p.label)}</b></td>
          <td style="text-align:right;white-space:normal;">
            ${p.picks.length ? p.picks.map(k=>{
              const dw = DW[new Date(k.iso+'T00:00:00').getDay()];
              const cls = k.pinned ? ' pinned' : (k.warn ? ' warn' : '');
              const tip = k.pinned ? 'موعد مثبّت — لن يتغيّر' : (k.warn || 'يوم متاح');
              return `<span class="plan-chip${cls}" title="${escapeHtml(tip)}">
                ${k.pinned?'📌 ':''}${dw} ${fmtDate(k.iso)}</span>`;
            }).join(' ') : `<span class="helper">لا توجد أيام متاحة</span>`}
          </td>
          <td>${p.avail}</td>
        </tr>`).join('')}
      </tbody></table>
    </div>
    <div class="helper" style="margin-top:9px;">
      استُبعدت عطلات نهاية الأسبوع وأيام الاختبارات والإجازات وأيام ارتباط الجهة بفعالية أخرى.
      المواعيد المميّزة بلون تحذيري تقع قرب فترة حساسة.
    </div>`;
  showInfoModal(`مقترح توزيع — ${escapeHtml(sc.name)}`, body, box=>{
    box.style.maxWidth = '760px';
    /* زر تطبيق التوزيع على فعاليات الجهة فعليًا */
    const act = box.querySelector('.modal-actions');
    if(act){
      const b = document.createElement('button');
      b.className = 'btn btn-primary';
      b.innerHTML = `${icon('checkCircle',15)} تطبيق التوزيع على الفعاليات`;
      b.onclick = ()=>applyPlan(schoolId, plan, pins);
      act.insertBefore(b, act.firstChild);
    }
  });
}
/* تطبيق التوزيع: يعيد تأريخ فعاليات الجهة على المواعيد المقترحة، ويترك المثبّتة كما هي */
async function applyPlan(schoolId, plan, pins){
  const sc = state.schools.find(x=>x.id===schoolId);
  const slots = plan.flatMap(p=>p.picks.map(k=>({iso:k.iso, pinned:!!k.pinned})))
    .sort((a,b)=>a.iso.localeCompare(b.iso));
  /* فعاليات الجهة النشطة مرتّبة زمنيًا */
  const evts = (state.orders||[]).filter(o=>
    o.schoolId===schoolId && (o.status||'active')!=='cancelled' && o.date)
    .sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  if(!evts.length){ toast('لا توجد فعاليات لهذه الجهة'); return; }
  /* الفعاليات الواقعة على تواريخ مثبّتة تبقى مكانها */
  const pinnedEvts = evts.filter(o=>pins.includes(o.date));
  const movable    = evts.filter(o=>!pins.includes(o.date));
  const freeSlots  = slots.filter(s=>!s.pinned).map(s=>s.iso);
  const changes = [];
  movable.forEach((o,i)=>{
    const target = freeSlots[i];
    if(!target || target===o.date) return;
    changes.push({o, from:o.date, to:target});
  });
  if(!changes.length){ toast('لا توجد تواريخ تحتاج تغييرًا'); return; }
  const extra = movable.length - freeSlots.length;
  const msg = `سيتم تعديل تواريخ ${changes.length} فعالية لـ${sc?sc.name:''}:\n\n`
    + changes.slice(0,12).map(c=>`• ${c.o.title||c.o.serial}\n   ${fmtDate(c.from)}  ←  ${fmtDate(c.to)}`).join('\n')
    + (changes.length>12 ? `\n… و${changes.length-12} أخرى` : '')
    + (pinnedEvts.length ? `\n\n📌 ${pinnedEvts.length} فعالية على تواريخ مثبّتة لن تتغيّر.` : '')
    + (extra>0 ? `\n\n⚠ ${extra} فعالية تتجاوز المواعيد المقترحة وستبقى بتواريخها.` : '')
    + `\n\nمتابعة؟`;
  if(!confirm(msg)) return;
  changes.forEach(c=>{
    const days = daysCount(c.o.date, c.o.dateTo);
    c.o.date = c.to;
    c.o.dateTo = days>1 ? addDaysISO(c.to, days-1) : c.to;   // نحافظ على مدة الفعالية
  });
  await saveState();
  closeModal();
  toast(`تم تعديل ${changes.length} فعالية`);
  render();
}

function renderSchedulePage(c){
  const today = todayStr();
  const spans = {
    week:  {label:'خلال أسبوع', from:today, to:addDaysISO(today, 6)},
    month: {label:'خلال شهر',   from:today, to:addDaysISO(today, 29)},
    past:  {label:'الأسبوع الماضي', from:addDaysISO(today,-7), to:today},
  };
  if(!window.__schedFrom) window.__schedFrom = spans[schedRange].from;
  if(!window.__schedTo)   window.__schedTo   = spans[schedRange].to;
  const F = window.__schedFrom, T = window.__schedTo;

  const inRange = o=>{
    const s=o.date||''; if(!s) return false;
    const e=orderEnd(o);
    return s<=T && e>=F && !isCancelledOrder(o);
  };
  /* المقدّمون المختارون: مصفوفة فارغة = الكل.
     نحافظ على التوافق مع الاختيار المفرد القديم (__schedTr). */
  if(!Array.isArray(window.__schedTrs)){
    window.__schedTrs = window.__schedTr ? [window.__schedTr] : [];
  }
  const allTrainers = (state.trainers||[]).slice().sort((a,b)=>a.name.localeCompare(b.name,'ar'));
  const validIds = new Set(allTrainers.map(t=>t.id));
  window.__schedTrs = window.__schedTrs.filter(id=>validIds.has(id));
  const selTr = new Set(window.__schedTrs);
  const trPicked = id => selTr.size===0 || selTr.has(id);
  const trFilter = window.__schedTrs.length===1 ? window.__schedTrs[0] : '';
  const list = (state.orders||[]).filter(o=> inRange(o)
      && (selTr.size===0 || (o.trainerIds||[]).some(id=>selTr.has(id))))
    .sort((a,b)=>(a.date||'').localeCompare(b.date||'') || (a.timeFrom||'').localeCompare(b.timeFrom||''));

  /* الأيام المشغولة لكل مقدّم */
  const busyBy = {}, clashBy = {};
  (state.orders||[]).filter(inRange).forEach(o=>{
    (o.trainerIds||[]).forEach(tid=>{
      const s=o.date, e=orderEnd(o);
      let cur=s, guard=0;
      while(cur<=e && guard<90){
        if(cur>=F && cur<=T){
          busyBy[tid] = busyBy[tid] || {};
          if(busyBy[tid][cur] && busyBy[tid][cur].id!==o.id){
            const m = (clashBy[tid] = clashBy[tid] || {});
            m[cur] = m[cur] || [busyBy[tid][cur]];
            if(!m[cur].some(x=>x.id===o.id)) m[cur].push(o);
          } else busyBy[tid][cur] = o;
        }
        cur = addDaysISO(cur,1); guard++;
      }
    });
  });
  const clashCount = Object.values(clashBy).reduce((s,m)=>s+Object.keys(m).length, 0);
  /* كل أيام الفترة */
  const MAX_SPAN_DAYS = 400;
  const days = []; let spanTruncated = false;
  { let cur=F, guard=0;
    while(cur<=T && guard<MAX_SPAN_DAYS){ days.push(cur); cur=addDaysISO(cur,1); guard++; }
    if(cur<=T) spanTruncated = true; }
  const DW = ['ح','ن','ث','ر','خ','ج','س'];
  const isOff = iso => { const d=new Date(iso+'T00:00:00').getDay(); return d===5 || d===6; };

  const trainers = allTrainers.filter(t=>trPicked(t.id));

  const SC_ST = {
    prog: o=>!o.completionStatus && (o.status||'active')!=='postponed' && orderEnd(o) >= today,
    wait: o=>!o.completionStatus && orderEnd(o) < today,
    done: o=>o.completionStatus==='تم',
  };
  if(window.__schedSt===undefined) window.__schedSt = '';
  const _scDone = list.filter(SC_ST.done).length;
  const SC_KPIS = [
    {k:'',     l:'إجمالي الفعاليات', v:list.length, s:`${fmtDate(F)} — ${fmtDate(T)}`, ic:'clipboard', ...PK_KC.all},
    {k:'prog', l:'قيد التنفيذ', v:list.filter(SC_ST.prog).length, s:'قادمة وجارية', ic:'activity', ...PK_KC.new},
    {k:'wait', l:'بانتظار الإجراء', v:list.filter(SC_ST.wait).length, s:'مضى موعدها بلا تقييم', ic:'alert', ...PK_KC.late},
    {k:'done', l:'المكتملة', v:_scDone, s:list.length?`${Math.round(_scDone/list.length*100)}% من فعاليات الفترة`:'—', ic:'checkCircle', ...PK_KC.done},
  ];
  c.innerHTML = `
  ${pkKpisHtml(SC_KPIS, window.__schedSt, 'data-scst')}
  <div class="pk-card sc-card">
    <div class="pk-head">
      <h2 class="pk-title">${icon('calendar',18)} جدول المقدّمين <span class="pk-sub">${escapeHtml(fmtDate(F))} — ${escapeHtml(fmtDate(T))}</span></h2>
      <span class="sp">
        <button class="pk-btn gold" type="button" id="sc_plan">${icon('sparkles',15)} اقتراح توزيع لجهة</button>
        <button class="pk-btn" type="button" id="sc_printMenu" aria-haspopup="menu">${icon('printer',15)} طباعة ${icon('chevronDown',13,'caret')}</button>
        <button class="pk-btn pri" type="button" id="sc_exportMenu" aria-haspopup="menu">${icon('download',15)} تصدير ${icon('chevronDown',13,'caret')}</button>
        <span hidden>
          <button id="sc_printAvail" type="button"></button><button id="sc_print" type="button"></button><button id="sc_excel" type="button"></button>
        </span>
      </span>
    </div>
    <div class="pk-toolbar">
      <div class="pk-search">${icon('search',16)}
        <input id="sc_q" type="search" autocomplete="off" aria-label="بحث في كل الفعاليات"
          placeholder="ابحث برقم التكليف أو العنوان أو الجهة أو المقدّم — يشمل كل الفعاليات..." value="${escapeHtml(window.__schedQ||'')}">
      </div>
    </div>
    <div class="pk-toolbar sc-filters">
      <span class="pk-seg" role="tablist" aria-label="الفترة">
        ${Object.entries(spans).map(([k,v])=>`<button type="button" data-span="${k}" class="${schedRange===k?'on':''}">${v.label}</button>`).join('')}
      </span>
      <span class="pk-dates">
        <label class="pk-date"><span>من</span><input id="sc_from" type="date" lang="en-GB" value="${F}"></label>
        <label class="pk-date"><span>إلى</span><input id="sc_to" type="date" lang="en-GB" value="${T}"></label>
      </span>
      <div class="sc-trwrap" style="position:relative;">
        <button type="button" id="sc_trBtn" class="pk-btn sc-trbtn2" aria-haspopup="listbox">
          ${icon('users',15)}
          <span id="sc_trLbl">${selTr.size ? escapeHtml(
            trainers.length<=2 ? trainers.map(t=>t.name).join('، ') : trainers.length+' مقدّمين')
            : 'كل المقدّمين'}</span>
          <b class="pk-cnt">${selTr.size || allTrainers.length}</b>${icon('chevronDown',13,'caret')}
        </button>
        <div id="sc_trPanel" class="sc-trpanel" hidden>
          <label class="sc-trall"><input type="checkbox" id="sc_trAll" ${selTr.size===0?'checked':''}>
            <span>كل المقدّمين</span></label>
          <div class="sc-trlist">
            ${allTrainers.map(t=>`<label class="sc-trrow${selTr.has(t.id)?' on':''}">
              <input type="checkbox" class="sc-trchk" value="${t.id}" ${selTr.has(t.id)?'checked':''}>
              <span class="sc-trnm">${escapeHtml(t.name)}</span>
              ${t.phone?`<span class="sc-trph">${escapeHtml(t.phone)}</span>`:''}
            </label>`).join('') || '<span class="helper">لا يوجد مقدمو مبادرات</span>'}
          </div>
        </div>
      </div>
      <span class="sp" style="margin-inline-start:auto;display:inline-flex;gap:6px;">
        <button class="pk-btn ic" type="button" id="sc_stage" title="فرز حسب نوع المدرسة" aria-label="فرز حسب نوع المدرسة">${icon('school',16)}</button>
        <button class="pk-btn ic mt-btn" type="button" id="sc_multi" title="فعاليات يشارك فيها أكثر من مقدّم" aria-label="فعاليات يشارك فيها أكثر من مقدّم">${icon('users',16)}<span class="mt-badge bdg" hidden></span></button>
        <button class="pk-btn ic" type="button" id="sc_check" title="فحص التضارب خلال الفترة" aria-label="فحص التضارب">${icon('alert',16)}${clashCount?`<span class="bdg">${clashCount}</span>`:''}</button>
      </span>
    </div>
  </div>

  <div id="sc_qResult"></div>

  <div class="pk-card" id="sc_listCard">
    <div class="pk-head">
      <h2 class="pk-title">${icon('list',17)} فعاليات الفترة <span class="n" id="sc_count">${list.length}</span></h2>
      <span class="sp pk-sub" id="sc_stLbl"></span>
    </div>
    <div id="sc_tbl"></div>
  </div>


  <div class="pk-card av2" id="av2">
    <div class="pk-head">
      <h2 class="pk-title">${icon('users',18)} إتاحة مقدّمي المبادرات <span class="pk-sub">${escapeHtml(fmtDate(F))} — ${escapeHtml(fmtDate(T))}</span></h2>
      <span class="sp">
        <span class="av-nav" role="group" aria-label="التنقل بين الفترات">
          <button type="button" class="pk-btn ic sm" id="av_prev" title="الفترة السابقة" aria-label="الفترة السابقة">${icon('chevronRight',15)}</button>
          <label class="av-month" title="اختيار الشهر">${icon('calendar',14)}<input type="month" id="av_month" value="${F.slice(0,7)}" aria-label="اختيار الشهر"></label>
          <button type="button" class="pk-btn ic sm" id="av_next" title="الفترة التالية" aria-label="الفترة التالية">${icon('chevronLeft',15)}</button>
        </span>
        <button type="button" class="pk-btn" id="av_group" title="جمع مقدّمين محددين في جدول واحد وطباعة كشف للجهات">${icon('users',15)} مجموعة المقدّمين</button>
        <button type="button" class="pk-btn" id="av_print">${icon('printer',15)} طباعة</button>
        <button type="button" class="pk-btn pri" id="av_export" aria-haspopup="menu">${icon('download',15)} تصدير ${icon('chevronDown',13,'caret')}</button>
      </span>
    </div>
    <div class="av-body">
      <div id="av_kpis"></div>
      <div class="av-tools">
        <div class="pk-search">${icon('search',15)}<input id="av_q" type="search" autocomplete="off" placeholder="ابحث عن مقدّم المبادرة..." aria-label="ابحث عن مقدّم المبادرة" value="${escapeHtml(window.__avQ||'')}"></div>
        <span class="pk-seg" id="av_flt" role="tablist" aria-label="تصفية">
          ${[['','الكل'],['clash','لديه تعارض'],['busy','مشغول'],['free','متاح بالكامل'],['leave','في إجازة']].map(x=>`<button type="button" data-avf="${x[0]}" class="${(window.__avF||'')===x[0]?'on':''}">${x[1]}</button>`).join('')}
        </span>
      </div>
      <div class="av-legend" aria-label="دليل الألوان">
        <span><i class="lg free"></i>متاح</span><span><i class="lg busy"></i>مشغول</span><span><i class="lg off"></i>عطلة أسبوعية</span>
        <span><i class="lg leave"></i>إجازة</span><span><i class="lg clash">!</i>تعارض</span>
        <span class="hint">${icon('info',13)} اضغط على أي يوم لعرض تفاصيله</span>
      </div>
      <div id="av_grid" class="av-grid-wrap"></div>
      <div id="av_clash"></div>
    </div>
  </div>

  <div class="card">
    <h2>${icon('clipboard',15)} الطلبات المقدَّمة لكل مقدّم مبادرة</h2>
    ${trainers.map(t=>{
      const mine = list.filter(o=>(o.trainerIds||[]).includes(t.id));
      if(!mine.length) return '';
      const reqs = {};
      mine.forEach(o=>(o.adminRequests||[]).forEach(rid=>{
        const r = state.adminRequestsList.find(x=>x.id===rid); if(!r) return;
        reqs[r.name] = (reqs[r.name]||0)+1;
      }));
      const sorted = Object.entries(reqs).sort((a,b)=>a[0].localeCompare(b[0],'ar'));
      return `<div style="border-top:1px solid var(--border-light);padding:11px 0;">
        <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;">
          <b style="font-size:13px;">${escapeHtml(t.name)}</b>
          ${t.phone?`<span class="helper" style="direction:ltr;">${escapeHtml(t.phone)}</span>`:''}
          <span class="badge">${mine.length} ${eventWord(mine.length)}</span>
        </div>
        ${sorted.length ? `<div style="margin-top:7px;display:flex;flex-wrap:wrap;gap:5px;">
          ${sorted.map(([n,cnt])=>`<span class="req-chip">${escapeHtml(n)}${cnt>1?` ×${cnt}`:''}</span>`).join('')}
        </div>` : `<div class="helper" style="margin-top:5px;">لا توجد طلبات إدارية</div>`}
      </div>`;
    }).join('') || `<div class="empty-state">لا توجد بيانات</div>`}
  </div>`;

  /* التفاعل */
  c.querySelectorAll('[data-span]').forEach(b=>{
    b.onclick = ()=>{ schedRange=b.dataset.span;
      window.__schedFrom = spans[schedRange].from; window.__schedTo = spans[schedRange].to; render(); };
  });
  /* تغيير "من" يضبط "إلى" تلقائيًا حسب المدى المختار */
  const SPAN_DAYS = {week:6, month:29, past:7};
  document.getElementById('sc_from').addEventListener('change', ()=>{
    const v = document.getElementById('sc_from').value; if(!v) return;
    window.__schedFrom = v;
    window.__schedTo   = addDaysISO(v, SPAN_DAYS[schedRange] ?? 6);
    render();
  });
  document.getElementById('sc_to').addEventListener('change', ()=>{
    const v = document.getElementById('sc_to').value; if(!v) return;
    window.__schedTo = v;
    if(v < window.__schedFrom) window.__schedFrom = addDaysISO(v, -(SPAN_DAYS[schedRange] ?? 6));
    render();
  });
  /* ══════════════════════════════════════════════════════════════
     البحث: يبحث في كل الفعاليات — لا في الفترة المعروضة فقط —
     فإن كانت النتيجة خارج الفترة يقولها صراحةً بدل أن تختفي بصمت.
     ══════════════════════════════════════════════════════════════ */
  function schedSearch(){
    const box = document.getElementById('sc_qResult');
    const q = (document.getElementById('sc_q').value||'').trim();
    window.__schedQ = q;
    if(!q){ box.innerHTML=''; return; }
    const nq = _mzNz(q);
    const hits = (state.orders||[]).filter(o=>{
      if(String(o.serial||'')===q) return true;
      const sc = (state.schools||[]).find(x=>x.id===o.schoolId);
      const tn = (o.trainerIds||[]).map(id=>{
        const t=(state.trainers||[]).find(x=>x.id===id); return t?t.name:''; }).join(' ');
      return _mzNz(o.title||'').includes(nq)
          || _mzNz(sc?sc.name:'').includes(nq)
          || _mzNz(tn).includes(nq)
          || String(o.serial||'').includes(q);
    }).sort((a,b)=>(a.date||'').localeCompare(b.date||''));

    if(!hits.length){
      box.innerHTML = `<div class="card" style="border:2px solid #C0334D;">
        <div class="clash-bar" style="margin:0;">${icon('alert',15)}
          <span>لا توجد أي فعالية تطابق «<b>${escapeHtml(q)}</b>» في النظام كلّه —
          وليست مسألة فترة معروضة.</span></div></div>`;
      return;
    }
    const inR  = o => { const s=o.date||'', e=orderEnd(o); return s<=T && e>=F; };
    const out  = hits.filter(o=>!inR(o));
    const isIn = hits.filter(o=>inR(o));
    const row = (o, outside) => {
      const sc = (state.schools||[]).find(x=>x.id===o.schoolId);
      const tn = (o.trainerIds||[]).map(id=>{
        const t=(state.trainers||[]).find(x=>x.id===id); return t?t.name:''; }).filter(Boolean);
      const bad = hasBadEnd(o);
      return `<tr${outside?' style="background:#FFFBEB;"':''}>
        <td><span class="badge">${o.serial}</span></td>
        <td style="text-align:right;">${escapeHtml(o.title||'')}
          ${bad?`<span class="badge bad" title="تاريخ الانتهاء أقدم من تاريخ البداية">تاريخ تالف</span>`:''}</td>
        <td style="white-space:nowrap;">${fmtDate(o.date)}${orderEnd(o)!==o.date?` — ${fmtDate(orderEnd(o))}`:''}</td>
        <td style="white-space:nowrap;direction:ltr;">${escapeHtml(fullTimeRange(o.timeFrom,o.timeTo))}</td>
        <td style="text-align:right;">${sc?escapeHtml(sc.name):'—'}</td>
        <td style="text-align:right;">${tn.length?escapeHtml(tn.join('، ')):'—'}</td>
        <td>${(o.status||'active')==='postponed'?'<span class="badge" style="background:#FFF2C9;color:#A66B08;">مؤجّلة</span>':
             (o.status||'active')==='cancelled'?'<span class="badge bad">ملغاة</span>':doneBadge(o.completionStatus)}</td>
        <td style="white-space:nowrap;">
          <button class="btn btn-sm btn-outline" data-view="${o.id}">عرض</button>
          ${outside?`<button class="btn btn-sm btn-primary" data-jump="${o.date}">انتقل لتاريخها</button>`:''}
        </td></tr>`;
    };
    box.innerHTML = `<div class="card" style="border:2px solid var(--gold);">
      <h2>${icon('search',15)} نتائج البحث عن «${escapeHtml(q)}» — ${hits.length} ${eventWord(hits.length)}</h2>
      ${out.length ? `<div class="clash-bar" style="background:#FFF7E0;border-color:#E8D46A;color:#7A5800;">
        ${icon('alert',15)}<span><b>${out.length}</b> ${out.length===1?'نتيجة':'نتائج'} خارج الفترة المعروضة
        (${fmtDate(F)} — ${fmtDate(T)}) — لذلك لا تظهر في الجدول أدناه.
        اضغط «انتقل لتاريخها» لعرضها.</span></div>` : ''}
      <div class="tbl-scroll"><table style="font-size:12.5px;"><thead><tr>
        <th style="width:46px;">#</th><th style="text-align:right;">الفعالية</th><th>التاريخ</th>
        <th>الوقت</th><th>الجهة</th><th>المقدّمون</th><th>الحالة</th><th>إجراء</th>
      </tr></thead><tbody>
        ${isIn.map(o=>row(o,false)).join('')}${out.map(o=>row(o,true)).join('')}
      </tbody></table></div>
      <div class="helper" style="margin-top:8px;">
        الصفوف ذات الخلفية الصفراء خارج الفترة المعروضة. البحث يشمل كل فعاليات النظام.
      </div></div>`;
    box.querySelectorAll('[data-jump]').forEach(b=>{
      b.onclick = ()=>{
        const d = b.dataset.jump;
        window.__schedFrom = addDaysISO(d, -3);
        window.__schedTo   = addDaysISO(d,  3);
        render();
      };
    });
    box.querySelectorAll('[data-view]').forEach(b=>{
      b.onclick = ()=>viewOrderReadOnly(b.dataset.view);
    });
  }
  const _scq = document.getElementById('sc_q');
  if(_scq){
    let _t=null;
    _scq.addEventListener('input', ()=>{ clearTimeout(_t); _t=setTimeout(schedSearch, 220); });
    _scq.addEventListener('search', schedSearch);
    if(window.__schedQ) schedSearch();
  }

  c.querySelectorAll('[data-edit]').forEach(b=>{
    b.onclick = e=>{ e.stopPropagation(); editOrder(b.dataset.edit); };
  });
  c.querySelectorAll('[data-view]').forEach(b=>{
    b.onclick = e=>{
      /* النقر على خانة التعديل لا يفتح نافذة العرض */
      if(e.target.closest('.no-view')) return;
      viewOrderReadOnly(b.dataset.view);
    };
  });
  /* جدول فعاليات الفترة: حالة ملوّنة + إجراءات + ترقيم */
  function drawSchedTable(){
    const box = document.getElementById('sc_tbl'); if(!box) return;
    const stKey = window.__schedSt;
    const L = stKey && SC_ST[stKey] ? list.filter(SC_ST[stKey]) : list;
    window.__schedLastList = L;
    const lbl = document.getElementById('sc_stLbl');
    const kp = SC_KPIS.find(k=>k.k===stKey);
    if(lbl) lbl.innerHTML = stKey ? `معروض: <b>${escapeHtml(kp?kp.l:'')}</b> — <a href="#" id="sc_stClr">عرض الكل</a>` : '';
    const clr = document.getElementById('sc_stClr'); if(clr) clr.onclick = e=>{ e.preventDefault(); setSt(''); };
    document.getElementById('sc_count').textContent = L.length;
    if(!L.length){ box.innerHTML = `<div class="pk-empty">${icon('calendar',34)}لا توجد فعاليات ${stKey?'بهذه الحالة ':''}في هذه الفترة</div>`; return; }
    if(!window.__schedPer){ try{ window.__schedPer = Number(localStorage.getItem('schedPer'))||15; }catch(e){ window.__schedPer = 15; } }
    const per = window.__schedPer, pages = Math.max(1, Math.ceil(L.length/per));
    window.__schedPage = Math.min(Math.max(1, window.__schedPage||1), pages);
    const pg = window.__schedPage;
    const rows = L.slice((pg-1)*per, pg*per);
    box.innerHTML = `<div class="pk-tblwrap"><table class="pk-tbl sc-tbl"><thead><tr>
        <th class="c" style="width:56px;">#</th><th>الفعالية</th><th>التاريخ</th><th>الوقت</th>
        <th class="c">الأيام</th><th>المكان</th><th>المقدّمون</th><th>الحالة</th><th class="c" style="width:104px;">إجراءات</th>
      </tr></thead><tbody>
      ${rows.map(o=>{
        const sc = state.schools.find(x=>x.id===o.schoolId);
        const pt = state.programTypes.find(p=>p.id===o.programTypeId);
        const fd = state.fields.find(f=>f.id===o.fieldId);
        const tn = (o.trainerIds||[]).map(id=>{const t=state.trainers.find(x=>x.id===id);return t?t.name:'';}).filter(Boolean);
        const end = orderEnd(o);
        return `<tr data-oid="${o.id}">
          <td class="c"><span class="pk-no">${o.serial}</span></td>
          <td class="pk-ttl"><b data-act="view" role="button" tabindex="0">${escapeHtml(o.title||'بلا عنوان')}</b>${seriesTag(o)}
            <small>${[pt&&pt.name, fd&&fd.name].filter(Boolean).map(escapeHtml).join(' · ')||'—'}</small></td>
          <td class="nw">${fmtDate(o.date)}${end&&end!==o.date?` — ${fmtDate(end)}`:''}<span class="pk-2nd">${o.date?escapeHtml(dayNameOf(o.date)):''}</span></td>
          <td class="nw" style="direction:ltr;text-align:right;">${escapeHtml(fullTimeRange(o.timeFrom,o.timeTo))}</td>
          <td class="c">${daysCount(o.date,o.dateTo)}</td>
          <td>${sc?escapeHtml(sc.name):'—'}${o.venue?`<span class="pk-2nd">${icon('mapPin',11)} ${escapeHtml(o.venue)}</span>`:''}</td>
          <td>${tn.length?tn.map(n=>`<span class="sc-tn">${escapeHtml(n)}</span>`).join(''):'—'}</td>
          <td class="nw">${pkStatePill(o)}</td>
          <td><div class="pk-acts">
            <button type="button" data-act="view" title="عرض" aria-label="عرض">${icon('eye',15)}</button>
            <button type="button" data-act="edit" title="فتح الطلب وتعديله" aria-label="تعديل">${icon('edit',15)}</button>
            <button type="button" data-act="more" title="مزيد من الإجراءات" aria-label="مزيد من الإجراءات" aria-haspopup="menu">${icon('more',15)}</button>
          </div></td>
        </tr>`;
      }).join('')}
      </tbody></table></div>${pkPagerHtml(L.length, pg, per, [10,15,25,50])}`;
    try{ cardifyTables(box); }catch(e){}
    pkBindPager(box, p=>{ window.__schedPage = p; drawSchedTable(); document.getElementById('sc_listCard').scrollIntoView({block:'start',behavior:'smooth'}); },
      n=>{ window.__schedPer = n; window.__schedPage = 1; try{ localStorage.setItem('schedPer', n); }catch(e){} drawSchedTable(); });
  }
  function setSt(k){
    window.__schedSt = k; window.__schedPage = 1;
    c.querySelectorAll('[data-scst]').forEach(x=>{ const on = x.dataset.scst===k; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    drawSchedTable();
  }
  c.querySelectorAll('[data-scst]').forEach(b=>b.onclick = ()=>setSt(window.__schedSt===b.dataset.scst ? '' : b.dataset.scst));
  { const tb = document.getElementById('sc_tbl');
    bindOrdersTable(tb, ()=>render()); }
  drawSchedTable();
  const scDesc = ()=>{ const kp = SC_KPIS.find(k=>k.k===window.__schedSt);
    return `الفترة ${fmtDate(F)} — ${fmtDate(T)}${kp&&kp.k?` · ${kp.l}`:''}${selTr.size?` · ${trainers.map(t=>t.name).join('، ')}`:''}`; };
  document.getElementById('sc_printMenu').onclick = e=>pkMenu(e.currentTarget, [
    {hd:'طباعة'},
    {ic:'calendar', l:'جدول الإتاحة', run:()=>document.getElementById('sc_printAvail').click()},
    {ic:'clipboard', l:'طلبات المقدّمين', run:()=>document.getElementById('sc_print').click()},
    {ic:'list', l:'قائمة فعاليات الفترة', run:()=>ordPrintList(window.__schedLastList||list, scDesc())},
  ]);
  document.getElementById('sc_exportMenu').onclick = e=>pkMenu(e.currentTarget, [
    {hd:'PDF — من نافذة الطباعة اختر «حفظ كـ PDF»'},
    {ic:'download', l:'جدول الإتاحة PDF', run:()=>document.getElementById('sc_printAvail').click()},
    {ic:'download', l:'قائمة الفعاليات PDF', run:()=>ordPrintList(window.__schedLastList||list, scDesc())},
    '-',
    {hd:'Excel'},
    {ic:'sheet', l:'طلبات المقدّمين Excel', run:()=>document.getElementById('sc_excel').click()},
    {ic:'sheet', l:'قائمة الفعاليات Excel', run:()=>ordExcelList(window.__schedLastList||list, scDesc())},
  ]);
  /* ══════ إتاحة مقدّمي المبادرات: جدول ملوّن + بحث وتصفية + تفاصيل اليوم + تفاصيل التعارض ══════ */
  const avCanEdit = currentRole === 'admin' || currentRole === 'user';
  const AV_MN = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const avStatus = (t, d)=>{
    if(isOff(d)) return {k:'off'};
    const lv = trainerLeaveOn(t.id, d); if(lv) return {k:'leave', lv};
    const cl = (clashBy[t.id]||{})[d]; if(cl) return {k:'clash', evs:cl};
    const o = (busyBy[t.id]||{})[d]; if(o) return {k:'busy', evs:[o]};
    return {k:'free'};
  };
  const avRows = trainers.map(t=>{
    const st = days.map(d=>avStatus(t,d));
    const n = k=>st.filter(x=>x.k===k).length;
    return {t, st, busy:n('busy')+n('clash'), clash:n('clash'), leave:n('leave'), free:n('free')};
  });
  const clashItems = [];
  trainers.forEach(t=>{ const m = clashBy[t.id]||{}; Object.keys(m).sort().forEach(d=>clashItems.push({t, d, evs:m[d]})); });
  const clashEvIds = new Set(clashItems.flatMap(x=>x.evs.map(o=>o.id)));
  function drawAvail(){
    const kb = document.getElementById('av_kpis'); if(!kb) return;
    const q = _pnz((window.__avQ||'').trim()), f = window.__avF||'';
    const rows = avRows.filter(r=>(!q || _pnz(r.t.name).includes(q))
      && (!f || (f==='clash'?r.clash>0 : f==='busy'?r.busy>0 : f==='free'?(r.busy===0 && r.leave===0) : f==='leave'?r.leave>0 : true)));
    kb.innerHTML = pkKpisHtml([
      {k:'', l:'مقدّمو المبادرات', v:avRows.length, s:`${avRows.filter(r=>r.busy===0&&r.leave===0).length} متاح طوال الفترة`, ic:'users', ...PK_KC.all, t:'عرض الكل'},
      {k:'clash', l:'حالات التعارض', v:clashItems.length, s:clashItems.length?'مقدّم بأكثر من فعالية في اليوم':'لا توجد تعارضات', ic:'alert', ...(clashItems.length?PK_KC.late:PK_KC.done), t:'عرض من لديه تعارض'},
      {k:'clashEv', l:'الفعاليات المتعارضة', v:clashEvIds.size, s:'فعاليات تحتاج مراجعة', ic:'calendar', ...PK_KC.off, t:'الانتقال إلى تفاصيل التعارض'},
      {k:'period', l:'الفترة المعروضة', v:`${days.length} يوم`, s:`${fmtDate(F)} — ${fmtDate(T)}`, ic:'clock', ...PK_KC.gold, t:'الفترة'},
    ], f==='clash'?'clash':'', 'data-avk');
    kb.querySelectorAll('[data-avk]').forEach(b=>b.onclick = ()=>{
      const k = b.dataset.avk;
      if(k==='clashEv'){ const el = document.getElementById('av_clash'); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); return; }
      if(k==='period'){ const m = document.getElementById('av_month'); if(m){ try{ m.showPicker(); }catch(e){ m.focus(); } } return; }
      setAvF(k==='clash' ? (window.__avF==='clash'?'':'clash') : '');
    });
    /* الجدول */
    const g = document.getElementById('av_grid');
    if(!rows.length){
      g.innerHTML = `<div class="pk-empty">${icon('users',34)}${avRows.length?'لا يوجد مقدّمون مطابقون للبحث أو التصفية':'لا يوجد مقدّمو مبادرات'}</div>`;
    } else {
      const td = todayStr();
      g.innerHTML = `<div class="av-scroll"><table class="av-tbl"><thead><tr>
          <th class="nm">مقدّم المبادرة</th>
          ${days.map((d,i)=>{ const dd = new Date(d+'T00:00:00'); const newM = i===0 || d.slice(8)==='01';
            return `<th class="${isOff(d)?'off':''}${d===td?' today':''}" title="${escapeHtml(dayNameOf(d))} ${fmtDate(d)}">
              ${newM?`<em>${AV_MN[dd.getMonth()]}</em>`:''}<i>${DW[dd.getDay()]}</i><b>${dd.getDate()}</b></th>`; }).join('')}
          <th class="sum">مشغول</th><th class="sum">متاح</th>
        </tr></thead><tbody>
        ${rows.map(r=>`<tr>
          <th class="nm" scope="row"><button type="button" class="av-who" data-tp="${r.t.id}">
            <span class="av">${escapeHtml((r.t.name||'؟').replace(/^أ\.\s*/,'').trim().charAt(0))}</span>
            <span class="tx"><b>${escapeHtml(r.t.name)}</b>${r.t.phone?`<i>${escapeHtml(r.t.phone)}</i>`:''}</span>
            ${r.clash?`<span class="cl" title="${r.clash} تعارض">${icon('alert',12)} ${r.clash}</span>`:''}</button></th>
          ${r.st.map((x,i)=>{ const d = days[i];
            const tip = x.k==='off'?'عطلة أسبوعية': x.k==='leave'?`إجازة: ${leaveTxt(x.lv)}`: x.k==='free'?'متاح'
              : x.evs.map(o=>`#${o.serial} ${o.title||''}`).join(' + ');
            return `<td class="c ${x.k}${d===td?' today':''}"><button type="button" data-avc="${r.t.id}|${d}" aria-label="${escapeHtml(r.t.name+' — '+fmtDate(d)+' — '+tip)}" title="${escapeHtml(tip)}">${
              x.k==='clash'?`${icon('alert',13)}<small>${x.evs.length}</small>`: x.k==='busy'?'<span class="dot"></span>': x.k==='leave'?'إ':''}</button></td>`; }).join('')}
          <td class="sum b">${r.busy}</td><td class="sum f">${r.free}</td>
        </tr>`).join('')}
        </tbody></table></div>
        ${spanTruncated?`<div class="helper" style="padding:6px 2px;">${icon('info',13)} عُرض أول ${days.length} يومًا من الفترة.</div>`:''}`;
    }
    /* تفاصيل التعارض */
    const cb = document.getElementById('av_clash');
    const items = clashItems.filter(x=>rows.some(r=>r.t.id===x.t.id));
    cb.innerHTML = `<div class="av-ch">${icon('alert',16)} <b>تفاصيل التعارض</b> <span class="n">${items.length}</span></div>
      ${items.length ? `<div class="av-cl-list">${items.map(it=>`<article class="av-cl">
        <header><span class="av">${escapeHtml((it.t.name||'؟').replace(/^أ\.\s*/,'').trim().charAt(0))}</span>
          <span class="who"><b>${escapeHtml(it.t.name)}</b><i>${escapeHtml(dayNameOf(it.d))} ${fmtDate(it.d)}</i></span>
          <span class="cnt">${it.evs.length} فعاليات متعارضة</span></header>
        ${it.evs.map(o=>{ const s2 = state.schools.find(x=>x.id===o.schoolId);
          return `<div class="ev-r"><span class="pk-no">${o.serial}</span>
            <span class="tx"><b>${escapeHtml(o.title||'بلا عنوان')}</b>
              <i>${icon('mapPin',11)} ${s2?escapeHtml(s2.name):'—'}${o.venue?` · ${escapeHtml(o.venue)}`:''} &nbsp; ${icon('clock',11)} <span dir="ltr">${escapeHtml((o.timeFrom||'—')+' – '+(o.timeTo||'—'))}</span></i></span>
            <span class="acts"><button type="button" class="pk-btn sm" data-avv="${o.id}">${icon('eye',13)} عرض الفعالية</button>${avCanEdit?`
              <button type="button" class="pk-btn sm ic warn" data-avp="${o.id}" title="تأجيل / تاريخ جديد" aria-label="تأجيل إلى تاريخ جديد">${icon('calendar',13)}</button>
              <button type="button" class="pk-btn sm ic dang" data-avx="${o.id}" title="إلغاء الفعالية" aria-label="إلغاء الفعالية">${icon('ban',13)}</button>`:''}</span></div>`; }).join('')}
      </article>`).join('')}</div>`
      : `<div class="av-ok">${icon('checkCircle',18)} لا توجد تعارضات${q||f?' مطابقة':''} في هذه الفترة.</div>`}`;
  }
  function setAvF(k){
    window.__avF = k;
    document.querySelectorAll('#av_flt [data-avf]').forEach(b=>b.classList.toggle('on', b.dataset.avf===k));
    drawAvail();
  }
  function avDayDetails(tid, d){
    const t = state.trainers.find(x=>x.id===tid); if(!t) return;
    const x = avStatus(t, d);
    const all = (state.orders||[]).filter(o=>(o.trainerIds||[]).includes(tid) && o.date && (o.status||'active')!=='cancelled'
      && dateRangesOverlap(o.date, orderEnd(o), d, d)).sort((a,b)=>(a.timeFrom||'').localeCompare(b.timeFrom||''));
    const head = {free:['متاح','free','لا توجد ارتباطات لهذا المقدّم في هذا اليوم.'], busy:['مشغول','busy',''], clash:['تعارض','clash','مرتبط بأكثر من فعالية في اليوم نفسه — يُنصح بمراجعة إحداها.'],
      off:['عطلة أسبوعية','off','يوم عطلة نهاية الأسبوع.'], leave:['إجازة','leave', x.lv?`إجازة: ${leaveTxt(x.lv)}`:'']}[x.k];
    showInfoModal(`${escapeHtml(t.name)} — ${escapeHtml(dayNameOf(d))} ${fmtDate(d)}`, `
      <div class="av-dd"><div class="st ${head[1]}">${head[0]}</div>${head[2]?`<p>${escapeHtml(head[2])}</p>`:''}
      ${all.map(o=>{ const s2 = state.schools.find(y=>y.id===o.schoolId);
        return `<div class="ev-r"><span class="pk-no">${o.serial}</span><span class="tx"><b>${escapeHtml(o.title||'')}</b>
          <i>${s2?escapeHtml(s2.name):'—'} · <span dir="ltr">${escapeHtml(fullTimeRange(o.timeFrom,o.timeTo))}</span></i></span>
          <span class="acts"><button type="button" class="pk-btn sm" data-avv="${o.id}">${icon('eye',13)} عرض</button>${avCanEdit?`
          <button type="button" class="pk-btn sm ic warn" data-avp="${o.id}" title="تأجيل / تاريخ جديد" aria-label="تأجيل إلى تاريخ جديد">${icon('calendar',13)}</button>
          <button type="button" class="pk-btn sm ic dang" data-avx="${o.id}" title="إلغاء الفعالية" aria-label="إلغاء الفعالية">${icon('ban',13)}</button>`:''}</span></div>`; }).join('')}</div>`, box=>{
      box.style.maxWidth = '560px';
      box.querySelectorAll('[data-avv]').forEach(b=>b.onclick = ()=>{ closeModal(); setTimeout(()=>viewOrderReadOnly(b.dataset.avv), 60); });
      box.querySelectorAll('[data-avp]').forEach(b=>b.onclick = ()=>{ closeModal(); setTimeout(()=>openPostponeModal(b.dataset.avp), 60); });
      box.querySelectorAll('[data-avx]').forEach(b=>b.onclick = ()=>{ closeModal(); setTimeout(()=>toggleCancelOrder(b.dataset.avx), 60); });
    });
  }
  function avExcel(){
    const hdr = ['مقدّم المبادرة', ...days.map(d=>`${DW[new Date(d+'T00:00:00').getDay()]} ${fmtDateRaw(d)}`), 'أيام مشغولة', 'أيام متاحة'];
    const L = {free:'متاح', busy:'مشغول', clash:'تعارض', off:'عطلة', leave:'إجازة'};
    const rows = avRows.map(r=>[r.t.name, ...r.st.map(x=>x.k==='busy'||x.k==='clash' ? `${L[x.k]}: ${x.evs.map(o=>'#'+o.serial).join('، ')}` : L[x.k]), r.busy, r.free]);
    const sheets = [{name:'الإتاحة', headers:hdr, rows}];
    if(clashItems.length) sheets.push({name:'التعارضات', headers:['مقدّم المبادرة','التاريخ','العدد','رقم التكليف','الفعالية','المكان','الوقت'],
      rows:clashItems.flatMap(it=>it.evs.map(o=>{ const s2 = state.schools.find(x=>x.id===o.schoolId);
        return [it.t.name, fmtDateRaw(it.d), it.evs.length, o.serial, o.title||'', s2?s2.name:'—', fullTimeRange(o.timeFrom,o.timeTo)]; }))});
    exportToExcelMultiSheet('إتاحة_مقدمي_المبادرات.xlsx', sheets, `إتاحة مقدّمي المبادرات (${fmtDateRaw(F)} — ${fmtDateRaw(T)})`);
  }
  { const av = document.getElementById('av2');
    if(av){
      const goRange = (f2, t2)=>{ const y = window.scrollY; window.__schedFrom = f2; window.__schedTo = t2; window.__schedPage = 1;
        av.classList.add('is-loading'); setTimeout(()=>{ render(); setTimeout(()=>{ const el = document.getElementById('av2'); if(el) el.scrollIntoView({block:'start'}); else window.scrollTo(0,y); }, 30); }, 30); };
      const span = days.length || 7;
      document.getElementById('av_prev').onclick = ()=>goRange(addDaysISO(F, -span), addDaysISO(T, -span));
      document.getElementById('av_next').onclick = ()=>goRange(addDaysISO(F, span), addDaysISO(T, span));
      document.getElementById('av_month').onchange = e=>{ const v = e.target.value; if(!v) return;
        const [yy,mm] = v.split('-').map(Number); goRange(`${v}-01`, `${v}-${String(new Date(yy,mm,0).getDate()).padStart(2,'0')}`); };
      document.getElementById('av_group').onclick = ()=>openTrainerGroup();
      document.getElementById('av_print').onclick = ()=>document.getElementById('sc_printAvail').click();
      document.getElementById('av_export').onclick = e=>pkMenu(e.currentTarget, [
        {hd:'تصدير جدول الإتاحة'},
        {ic:'sheet', l:'Excel — الإتاحة والتعارضات', run:avExcel},
        {ic:'download', l:'PDF — من نافذة الطباعة', hint:'حفظ كـ PDF', run:()=>document.getElementById('sc_printAvail').click()},
      ]);
      const qi = document.getElementById('av_q');
      qi.addEventListener('input', ()=>{ clearTimeout(qi.__t); qi.__t = setTimeout(()=>{ window.__avQ = qi.value; drawAvail(); }, 180); });
      av.querySelectorAll('#av_flt [data-avf]').forEach(b=>b.onclick = ()=>setAvF(b.dataset.avf));
      av.addEventListener('click', e=>{
        const c1 = e.target.closest('[data-avc]');
        if(c1){ av.querySelectorAll('.av-tbl td.sel').forEach(x=>x.classList.remove('sel')); c1.parentElement.classList.add('sel');
          const [tid, d] = c1.dataset.avc.split('|'); avDayDetails(tid, d); return; }
        const v1 = e.target.closest('[data-avv]'); if(v1){ viewOrderReadOnly(v1.dataset.avv); return; }
        const p2 = e.target.closest('[data-avp]'); if(p2){ openPostponeModal(p2.dataset.avp); return; }
        const x2 = e.target.closest('[data-avx]'); if(x2){ toggleCancelOrder(x2.dataset.avx); return; }
        const p1 = e.target.closest('[data-tp]'); if(p1 && av.contains(p1)){ openTrainerProfile(p1.dataset.tp); }
      });
      drawAvail();
    }
  }
  const sortPick = cb => {
    openModal('فرز التقرير', [{name:'by', label:'الفرز حسب', type:'select', options:[
      {value:'date', label:'تاريخ المبادرة (الأحدث أولًا)'},
      {value:'trainer', label:'مقدّم المبادرة (أبجديًا)'},
    ]}], v=> setTimeout(()=>cb(v.by||'date'), 60));
  };
  document.getElementById('sc_print').onclick = ()=>sortPick(by=>printTrainerRequests(F, T, by));
  { const mtOrders = (state.orders||[]).filter(o=>inRange(o) && (selTr.size===0 || (o.trainerIds||[]).some(id=>selTr.has(id))));
    const sb = document.getElementById('sc_stage'); if(sb) sb.onclick = ()=>openStageModal(mtOrders, F, T);
    const n = multiTrainerRows(mtOrders).length, b = document.getElementById('sc_multi');
    if(b){ const bd = b.querySelector('.mt-badge'); if(bd){ bd.textContent = n; bd.hidden = !n; }
      b.onclick = ()=>showInfoModal('', '<div id="mtBox"></div>', box=>{ box.style.maxWidth='1120px';
        const h = box.querySelector('h3'); if(h) h.remove(); bindMultiTrainer(box.querySelector('#mtBox'), mtOrders, F, T); }); } }
  document.getElementById('sc_excel').onclick = ()=>sortPick(by=>exportTrainerRequests(F, T, by));
  document.getElementById('sc_plan').onclick = ()=>openPlanWizard();
  /* لوحة اختيار المقدّمين */
  /* ⚠ لوحة نُقلت إلى body في رسم سابق: نزيلها أولًا كي لا تتكرّر المعرّفات */
  document.querySelectorAll('body > .sc-trfloat').forEach(x=>x.remove());
  const _tb = c.querySelector('#sc_trBtn'), _tp = c.querySelector('#sc_trPanel');
  if(_tb && _tp){
    /* ⚠ البطاقة الحاوية تقصّ المنسدلات (overflow:hidden)، وبعض عناصرها
       تحمل transform فيفقد position:fixed إسناده للنافذة. الحل: ننقل
       اللوحة إلى body عند الفتح ونحسب موضعها من الزر. */
    /* نضع اللوحة بموضع محسوب من الزر، ونقيّدها داخل حدود الشاشة */
    const placePanel = ()=>{
      const r = _tb.getBoundingClientRect();
      const w = _tp.offsetWidth || 270, hgt = _tp.offsetHeight || 220;
      let top = r.bottom + 5;
      if(top + hgt > window.innerHeight - 8) top = Math.max(8, r.top - hgt - 5);
      let left = r.right - w;                       /* محاذاة يمين الزر (RTL) */
      left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
      _tp.style.top = top + 'px';
      _tp.style.left = left + 'px';
    };
    _tb.onclick = e=>{
      e.stopPropagation();
      const show = _tp.hidden;
      if(show){
        if(_tp.parentElement !== document.body){
          _tp.classList.add('sc-trfloat');
          document.body.appendChild(_tp);
        }
        _tp.hidden = false;
        placePanel();
      } else {
        _tp.hidden = true;
      }
    };
    window.addEventListener('resize', ()=>{ if(!_tp.hidden) placePanel(); });
    window.addEventListener('scroll', ()=>{ if(!_tp.hidden) placePanel(); }, true);
    _tp.onclick  = e=> e.stopPropagation();
    document.addEventListener('click', ()=>{ _tp.hidden = true; }, {once:true});
    const apply = ()=>{
      window.__schedTrs = Array.from(_tp.querySelectorAll('.sc-trchk:checked')).map(c=>c.value);
      window.__schedTr  = window.__schedTrs.length===1 ? window.__schedTrs[0] : '';
      render();
    };
    const _all = document.getElementById('sc_trAll');
    if(_all) _all.onchange = ()=>{
      /* «كل المقدّمين» = لا تصفية */
      _tp.querySelectorAll('.sc-trchk').forEach(c=>{ c.checked = false; });
      window.__schedTrs = []; window.__schedTr=''; render();
    };
    _tp.querySelectorAll('.sc-trchk').forEach(cb=>{ cb.onchange = apply; });
  }

  /* ══════════════════════════════════════════════════════════════
     طباعة جدول إتاحة المقدّمين خلال الفترة المختارة.
     الفترة القصيرة (≤10 أيام) تُكتب فيها الكلمة كاملة «متاح/مشغول»،
     والطويلة تُعرض بشبكة ملوّنة مع دليل الألوان وملخّص رقمي لكل مقدّم.
     ══════════════════════════════════════════════════════════════ */
  function buildAvailabilityDoc(){
    /* ══════════════════════════════════════════════════════════════
       الشبكة تُقسَّم إلى أشهر ميلادية، شهر تحت الآخر.
       ──────────────────────────────────────────────────────────────
       فترة طويلة (٨٧ يومًا مثلًا) لا يمكن أن تتسع عرضًا في ورقة واحدة
       مهما ضاقت الأعمدة؛ أما الشهر فحدّه ٣١ عمودًا ويتسع دائمًا.
       ══════════════════════════════════════════════════════════════ */
    const MONTH_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                      'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const BUDGET = 268, TAIL = 26;

    const stateOf = (tid, d)=>{
      if((clashBy[tid]||{})[d]) return 'clash';
      if(isOff(d) || trainerLeaveOn(tid, d)) return 'off';
      return (busyBy[tid]||{})[d] ? 'busy' : 'free';
    };
    const LBL = {free:'متاح', busy:'مشغول', off:'إجازة', clash:'تضارب'};
    const MARK = {free:'✓', busy:'●', clash:'!', off:'—'};

    /* تقسيم أيام الفترة على الأشهر */
    const months = [];
    days.forEach(d=>{
      const k = d.slice(0,7);
      let m = months.find(x=>x.key===k);
      if(!m) months.push(m = {key:k, label:`${MONTH_AR[Number(k.slice(5,7))-1]} ${k.slice(0,4)}`, days:[]});
      m.days.push(d);
    });

    /* شبكة شهر واحد: الكلمات كاملة إذا كانت أيامه قليلة، وإلا رموز */
    function gridFor(m){
      const wordy  = m.days.length <= 10;
      const nameMM = m.days.length > 20 ? 34 : 44;
      const dayMM  = (BUDGET - nameMM - TAIL) / Math.max(m.days.length, 1);
      const dayW   = Math.min(wordy ? 26 : 11, dayMM).toFixed(2) + 'mm';

      const colg = `<colgroup><col style="width:${nameMM}mm">`
        + m.days.map(()=>`<col style="width:${dayW}">`).join('')
        + `<col style="width:12mm"><col style="width:14mm"></colgroup>`;

      const head = `<tr><th class="av-nm">مقدّم المبادرة</th>`
        + m.days.map(d=>`<th class="av-d${isOff(d)?' off':''}">`
            + `<b>${DW[new Date(d+'T00:00:00').getDay()]}</b>`
            + `<i>${Number(d.slice(8,10))}</i></th>`).join('')
        + `<th class="av-n">متاح</th><th class="av-n">مشغول</th></tr>`;

      const body = trainers.map(t=>{
        let free=0, busy=0;
        const cells = m.days.map(d=>{
          const st = stateOf(t.id, d);
          if(st==='free') free++;
          if(st==='busy' || st==='clash') busy++;
          return `<td class="av-c av-${st}">${wordy ? LBL[st] : MARK[st]}</td>`;
        }).join('');
        return `<tr><td class="av-nm">${escapeHtml(t.name)}`
          + (t.phone?`<u>${escapeHtml(t.phone)}</u>`:'') + `</td>${cells}`
          + `<td class="av-n av-free"><b>${free}</b></td>`
          + `<td class="av-n av-busy"><b>${busy}</b></td></tr>`;
      }).join('') || `<tr><td colspan="${m.days.length+3}" style="text-align:center;color:#999;padding:14px;">لا يوجد مقدّمو مبادرات</td></tr>`;

      return `<div class="av-month">`
        + `<div class="av-mt">${m.label}<span>${m.days.length} ${dayWord(m.days.length)}`
        + ` · ${fmtDate(m.days[0])} — ${fmtDate(m.days[m.days.length-1])}</span></div>`
        + `<table class="rep-tbl av-tbl">${colg}<thead>${head}</thead><tbody>${body}</tbody></table>`
        + `</div>`;
    }

    const legend = `<div class="av-lg">`
      + [['free','متاح'],['busy','مشغول'],['clash','تضارب — أكثر من فعالية في اليوم نفسه'],['off','إجازة (الجمعة والسبت)']]
        .map(([k,l])=>`<span><i class="av-${k}"></i>${l}</span>`).join('')
      + `</div>`;

    /* إجمالي الفترة كلها — يظهر فقط حين تمتدّ على أكثر من شهر */
    let totals = '';
    if(months.length > 1){
      const rows = trainers.map(t=>{
        let free=0, busy=0, off=0;
        days.forEach(d=>{ const st=stateOf(t.id,d);
          if(st==='free') free++; else if(st==='off') off++; else busy++; });
        const pct = days.length-off ? Math.round(free/(days.length-off)*100) : 0;
        return `<tr><td class="av-nm">${escapeHtml(t.name)}</td>`
          + `<td class="av-n av-free"><b>${free}</b></td>`
          + `<td class="av-n av-busy"><b>${busy}</b></td>`
          + `<td class="av-n av-off"><b>${off}</b></td>`
          + `<td class="av-n"><b>${pct}%</b></td></tr>`;
      }).join('');
      totals = `<div class="sec-t">إجمالي الفترة كاملة — ${fmtDate(F)} إلى ${fmtDate(T)}</div>`
        + `<table class="rep-tbl av-det av-tot">`
        + `<colgroup><col style="width:60mm"><col style="width:26mm"><col style="width:26mm"><col style="width:26mm"><col style="width:30mm"></colgroup>`
        + `<thead><tr><th>مقدّم المبادرة</th><th>أيام متاحة</th><th>أيام مشغولة</th>`
        + `<th>إجازات</th><th>نسبة الإتاحة</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    /* تفصيل أيام الانشغال لكل مقدّم — يُقرأ بلا ألوان */
    const detail = trainers.map(t=>{
      const bd = days.filter(d=>{ const s=stateOf(t.id,d); return s==='busy'||s==='clash'; });
      if(!bd.length) return `<tr><td class="av-nm">${escapeHtml(t.name)}</td>`
        + `<td class="av-n"><b>0</b></td><td style="color:#1F6B4C;">متاح طوال الفترة</td></tr>`;
      return `<tr><td class="av-nm">${escapeHtml(t.name)}</td><td class="av-n"><b>${bd.length}</b></td><td>`
        + bd.map(d=>{
            const o = (busyBy[t.id]||{})[d];
            const cl = (clashBy[t.id]||{})[d];
            const ttl = cl ? cl.map(x=>x.title||'').filter(Boolean).join(' + ') : (o&&o.title)||'';
            return `<span class="av-chip${cl?' cl':''}">${fmtDate(d)}${ttl?` — ${escapeHtml(ttl)}`:''}</span>`;
          }).join('')
        + `</td></tr>`;
    }).join('');

    /* التفصيل في صفحة مستقلة متى كان المحتوى كبيرًا */
    const busyTotal = trainers.reduce((s,t)=>s + days.filter(d=>{
      const st=stateOf(t.id,d); return st==='busy'||st==='clash'; }).length, 0);
    const detailOwnPage = (months.length > 1) || (trainers.length > 6) || (busyTotal > 18);

    return buildReportDoc({
      titleAr:'جدول إتاحة مقدّمي المبادرات',
      subtitle:`من ${fmtDate(F)} إلى ${fmtDate(days[days.length-1]||T)} — ${days.length} ${dayWord(days.length)}`
        + (months.length>1 ? ` · ${months.length} أشهر` : '')
        + (spanTruncated ? ` · (اقتُصرت الفترة على ${MAX_SPAN_DAYS} يومًا)` : ''),
      kpis:[
        {v:trainers.length, l:'👥 المقدّمون'},
        {v:days.length,     l:'🗓️ أيام الفترة'},
        {v:list.length,     l:'📋 الفعاليات'},
        {v:clashCount,      l:'⚠️ حالات التضارب'},
      ],
      extraHtml: AVAIL_CSS + legend
        + months.map(gridFor).join('')
        + totals
        + `<div class="sec-t${detailOwnPage?' av-break':''}">تفصيل أيام الانشغال</div>`
        + `<table class="rep-tbl av-det"><colgroup><col style="width:44mm"><col style="width:22mm"><col></colgroup>`
        + `<thead><tr><th>مقدّم المبادرة</th><th>أيام مشغولة</th><th>التواريخ والفعاليات</th></tr></thead>`
        + `<tbody>${detail}</tbody></table>`
    });
  }
  const _pa = document.getElementById('sc_printAvail');
  if(_pa) _pa.onclick = ()=>{
    if(!trainers.length){ toast('لا يوجد مقدّمو مبادرات لعرضهم'); return; }
    doPrintDoc(buildAvailabilityDoc(), true, 'A4');
  };
  /* فحص التضارب */
  document.getElementById('sc_check').onclick = ()=>{
    const items = [];
    Object.entries(clashBy).forEach(([tid, days])=>{
      const t = state.trainers.find(x=>x.id===tid); if(!t) return;
      Object.entries(days).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([d, evs])=>{
        items.push({t, d, evs});
      });
    });
    if(!items.length){ toast('لا يوجد تضارب خلال هذه الفترة'); return; }
    showInfoModal(`تضارب المواعيد — ${items.length} حالة`, `
      <div style="max-height:58vh;overflow:auto;">
        ${items.map(it=>`<div class="clash-item">
          <div class="clash-head">${icon('alert',13)}
            <b>${escapeHtml(it.t.name)}</b>
            <span>${fmtDate(it.d)}</span></div>
          ${it.evs.map(o=>{
            const sc = state.schools.find(x=>x.id===o.schoolId);
            return `<button type="button" class="clash-ev" data-view="${o.id}">
              <span class="badge">${o.serial}</span>
              <span style="flex:1;min-width:0;text-align:right;">
                <b>${escapeHtml(o.title||'')}</b>
                <i>${sc?escapeHtml(sc.name):'—'} · ${escapeHtml(fullTimeRange(o.timeFrom,o.timeTo))}</i>
              </span></button>`;
          }).join('')}
        </div>`).join('')}
      </div>`, box=>{
      box.style.maxWidth='640px';
      box.querySelectorAll('[data-view]').forEach(b=>{
        b.onclick=()=>{ closeModal(); setTimeout(()=>viewOrderReadOnly(b.dataset.view), 60); };
      });
    });
  };
  c.querySelectorAll('[data-clash]').forEach(b=>{
    b.onclick = ()=>{
      const [tid, d] = b.dataset.clash.split('|');
      const evs = (clashBy[tid]||{})[d] || [];
      const t = state.trainers.find(x=>x.id===tid);
      showInfoModal(`تضارب — ${escapeHtml(t?t.name:'')} · ${fmtDate(d)}`, `
        ${evs.map(o=>{
          const sc = state.schools.find(x=>x.id===o.schoolId);
          return `<button type="button" class="clash-ev" data-view="${o.id}">
            <span class="badge">${o.serial}</span>
            <span style="flex:1;min-width:0;text-align:right;">
              <b>${escapeHtml(o.title||'')}</b>
              <i>${sc?escapeHtml(sc.name):'—'} · ${escapeHtml(fullTimeRange(o.timeFrom,o.timeTo))}</i>
            </span></button>`;
        }).join('')}`, box=>{
        box.style.maxWidth='560px';
        box.querySelectorAll('[data-view]').forEach(x=>{
          x.onclick=()=>{ closeModal(); setTimeout(()=>viewOrderReadOnly(x.dataset.view), 60); };
        });
      });
    };
  });
}

/* طباعة طلبات الفعاليات لمقدّمي المبادرات — كل طلب في سطر ومرتّب أبجديًا */
function printTrainerRequests(from, to, sortBy){
  const list = (state.orders||[]).filter(o=>{
    const s=o.date||''; if(!s) return false;
    const e=orderEnd(o);
    return s<=to && e>=from && !isCancelledOrder(o);
  });
  if(!list.length){ toast('لا توجد فعاليات في هذه الفترة'); return; }
  const rows = buildTrainerReqRows(list, sortBy);
  if(!rows.length){ toast('لا توجد طلبات لمقدّمي المبادرات في هذه الفترة'); return; }
  doPrintDoc(buildReportDoc({
    titleAr:'طلبات الفعاليات لمقدّمي المبادرات',
    subtitle:`من ${fmtDate(from)} إلى ${fmtDate(to)}`,
    kpis:[{v:rows.length,l:'📄 عدد الأسطر'},
          {v:new Set(rows.map(r=>r[4])).size,l:'👥 المقدّمون'},
          {v:list.length,l:'📋 الفعاليات'}],
    headers:TRQ_HDR,
    tableClass:'trq-tbl',
    /* تاريخ · مكان · هاتف المشرف · الأيام · المقدّم · هاتفه · الطلب */
    colWidths:['26mm','62mm','24mm','14mm','48mm','24mm','auto'],
    rows: rows.map(r=>r.map(v=>escapeHtml(String(v))))
  }), true, 'A4');
}
const TRQ_HDR = ['تاريخ المبادرة','مكان المبادرة','هاتف المشرف','الأيام','مقدّم المبادرة','هاتف المقدّم','الطلب المقدَّم'];
/* صفوف الطلبات — مفرزة من الأحدث للأقدم، وكل طلب في سطر مرتّب أبجديًا */
function buildTrainerReqRows(list, sortBy){
  const rows = [];
  /* الفرز الافتراضي: تاريخ المبادرة من الأحدث للأقدم */
  if((sortBy||'date') === 'date'){
    const byDate = list.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    byDate.forEach(o=>{
      const sc = state.schools.find(x=>x.id===o.schoolId);
      const sv = sc ? (sc.supervisors||[]).find(x=>x.id===o.supervisorId) : null;
      const trs = (o.trainerIds||[]).map(id=>state.trainers.find(y=>y.id===id)).filter(Boolean)
        .sort((a,b)=>a.name.localeCompare(b.name,'ar'));
      const reqs = (o.adminRequests||[])
        .map(id=>{ const r=state.adminRequestsList.find(x=>x.id===id); return r?r.name:''; })
        .filter(Boolean).sort((a,b)=>a.localeCompare(b,'ar'));
      const people = trs.length ? trs : [{name:'—', phone:''}];
      people.forEach(t=>{
        if(!reqs.length){
          rows.push([fmtDate(o.date), sc?sc.name:'—', sv&&sv.phone?sv.phone:'—',
                     daysCount(o.date,o.dateTo), t.name, t.phone||'—', '—']);
        } else reqs.forEach(rq=>{
          rows.push([fmtDate(o.date), sc?sc.name:'—', sv&&sv.phone?sv.phone:'—',
                     daysCount(o.date,o.dateTo), t.name, t.phone||'—', rq]);
        });
      });
    });
    return rows;
  }
  /* الفرز حسب المقدّم */
  (state.trainers||[]).slice().sort((a,b)=>a.name.localeCompare(b.name,'ar')).forEach(t=>{
    const mine = list.filter(o=>(o.trainerIds||[]).includes(t.id))
      .sort((a,b)=>(b.date||'').localeCompare(a.date||''));   // الأحدث أولًا
    mine.forEach(o=>{
      const sc = state.schools.find(x=>x.id===o.schoolId);
      const sv = sc ? (sc.supervisors||[]).find(x=>x.id===o.supervisorId) : null;
      const reqs = (o.adminRequests||[])
        .map(id=>{ const r=state.adminRequestsList.find(x=>x.id===id); return r?r.name:''; })
        .filter(Boolean).sort((a,b)=>a.localeCompare(b,'ar'));
      /* سطر لكل طلب إداري — ومن بلا طلبات يظهر بسطر واحد */
      if(!reqs.length){
        rows.push([fmtDate(o.date), sc?sc.name:'—', sv&&sv.phone?sv.phone:'—',
                   daysCount(o.date,o.dateTo), t.name, t.phone||'—', '—']);
      } else reqs.forEach(rq=>{
        rows.push([fmtDate(o.date), sc?sc.name:'—', sv&&sv.phone?sv.phone:'—',
                   daysCount(o.date,o.dateTo), t.name, t.phone||'—', rq]);
      });
    });
  });
  return rows;
}
/* تصدير نفس الجدول إلى Excel */
function exportTrainerRequests(from, to, sortBy){
  const list = (state.orders||[]).filter(o=>{
    const s=o.date||''; if(!s) return false;
    const e=orderEnd(o);
    return s<=to && e>=from && !isCancelledOrder(o);
  });
  const rows = buildTrainerReqRows(list, sortBy);
  if(!rows.length){ toast('لا توجد طلبات في هذه الفترة'); return; }
  exportToExcel('طلبات_مقدمي_المبادرات.xlsx', TRQ_HDR, rows,
    `طلبات الفعاليات لمقدّمي المبادرات (من ${fmtDate(from)} إلى ${fmtDate(to)})`);
}

function renderOperationsCenter(c){
  const orders = (state.orders||[]).filter(o=>(o.status||'active')!=='cancelled');
  const t = todayStr();
  const groups = {decide:[], preparing:[], documented:[], postponed:[]};
  (state.orders||[]).forEach(o=>{ const s=opsStageOf(o); if(groups[s]) groups[s].push(o); });
  Object.values(groups).forEach(g=>g.sort((a,b)=>(a.date||'').localeCompare(b.date||'')));

  const kpis = [
    {label:'يحتاج قرارًا',  value:groups.decide.length,     ic:'clipboard',   tone:'amber'},
    {label:'قيد التجهيز',   value:groups.preparing.length,  ic:'calendar',    tone:'teal'},
    {label:'أثر موثق',      value:groups.documented.length, ic:'checkCircle', tone:'green'},
    {label:'مؤجلة',         value:groups.postponed.length,  ic:'bell',        tone:'blue'},
  ].map((s,i)=>`
    <article class="stat-card card-hover fade-up delay-${i+1}">
      <div class="stat-icon stat-icon-${s.tone}">${icon(s.ic,18)}</div>
      <p class="stat-label">${escapeHtml(s.label)}</p>
      <strong class="stat-value" data-countup="${s.value}">0</strong>
    </article>`).join('');

  /* بطاقة طلب داخل مرحلة */
  function opsCard(o){
    const sc = state.schools.find(x=>x.id===o.schoolId);
    const pt = state.programTypes.find(p=>p.id===o.programTypeId);
    const st = opsStageOf(o);
    const badgeCls = st==='decide'?'status-new':st==='preparing'?'status-review':st==='documented'?'status-approved':'status-late';
    const badgeTx  = st==='decide'?'يحتاج قرارًا':st==='preparing'?'قيد التجهيز':st==='documented'?'أثر موثق':'مؤجلة';
    const canAdvance = st!=='documented';
    /* الاختيار متاح في مرحلة القرار وحدها — هي التي تُتّخذ فيها قرارات جماعية */
    const pick = st==='decide'
      ? `<label class="ops-pick" title="تحديد لاتخاذ قرار جماعي">
           <input type="checkbox" class="ops-chk" value="${o.id}"
             aria-label="تحديد ${escapeHtml(o.title)}"></label>`
      : '';
    return `<article class="ops-card${st==='decide'?' can-pick':''}">
      ${pick}
      <button type="button" class="ops-open" data-open="${o.id}" aria-label="فتح تفاصيل ${escapeHtml(o.title)}">
        <span class="ops-title">${escapeHtml(o.title)}</span>
        <span class="ops-meta">${o.serial} · ${sc?escapeHtml(sc.name):'—'}</span>
        <span class="ops-meta">${fmtDate(o.date)} · ${o.timeFrom||''}${pt?' · '+escapeHtml(pt.name):''}</span>
        <span class="status-badge ${badgeCls}" style="margin-top:8px;">${badgeTx}</span>
      </button>
      ${canAdvance?`<button type="button" class="ops-next" data-next="${o.id}"
        aria-label="نقل ${escapeHtml(o.title)} للمرحلة التالية" title="نقل للمرحلة التالية">
        نقل للمرحلة التالية ${icon('arrowLeft',14)}</button>`:''}
    </article>`;
  }
  function column(title, list, hint, stage){
    const bulk = (stage==='decide' && list.length) ? `
      <div class="ops-bulk">
        <label class="ops-all">
          <input type="checkbox" id="opsAll"> <span>تحديد الكل</span>
        </label>
        <span class="ops-sel" id="opsSel" hidden><b>0</b> محدّدة</span>
        <div class="ops-bulk-acts" id="opsActs" hidden>
          <select id="opsDecision" aria-label="القرار">
            <option value="">— اختر القرار —</option>
            <option value="تم">تم التنفيذ</option>
            <option value="لم يتم">لم يتم</option>
            <option value="المشرف لا يرد">المشرف لا يرد</option>
            <option value="الغيت">أُلغيت</option>
          </select>
          <button class="btn btn-sm btn-primary" id="opsApply">تطبيق</button>
          <button class="btn btn-sm btn-outline" id="opsClear">إلغاء التحديد</button>
        </div>
      </div>` : '';
    return `<section class="ops-col">
      <div class="ops-col-head">
        <span class="ops-col-title">${escapeHtml(title)}</span>
        <span class="ops-count">${list.length}</span>
      </div>
      <p class="ops-col-hint">${escapeHtml(hint)}</p>
      ${bulk}
      <div class="ops-col-body">${
        (stage==='decide' ? list : list.slice(0,8)).map(opsCard).join('') ||
        `<div class="empty-state" style="padding:18px;font-size:12px;">لا توجد مبادرات في هذه المرحلة</div>`}
        ${(stage!=='decide' && list.length>8)?`<div style="text-align:center;font-size:11px;color:var(--muted);padding:6px;">+ ${list.length-8} أخرى</div>`:''}
      </div>
    </section>`;
  }

  /* أكثر العناوين طلبًا — بدمج المتشابهة */
  const topT = (function(){
    const norm = s => String(s||'')
      .replace(/[\u064B-\u0652\u0670\u0640]/g,'')
      .replace(/[أإآا]/g,'ا').replace(/[ىي]/g,'ي').replace(/ة/g,'ه').replace(/[ؤئء]/g,'ء')
      .replace(/[^\u0600-\u06FF0-9a-zA-Z ]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
    const stem = w => w.replace(/^(وال|بال|كال|فال|ال|و|ف|ب|ك|ل)/,'')
      .replace(/(اتها|اتهم|تها|هما|كما|ونها|انها|ات|ون|ين|ان|ها|هم|كم|نا|ية|ي|ه|ا)$/,'');
    const STOP = new Set(['في','من','علي','عن','الي','مع','و','هذا','هذه','التي','الذي','ما',
      'برنامج','فعاليه','مبادره','دوره','ورشه','يوم','حول','بين','كل']);
    const toks = s => [...new Set(norm(s).split(' ').map(stem).filter(w=>w.length>2 && !STOP.has(w)))];
    const sim = (a,b)=>{ const A=new Set(toks(a)), B=new Set(toks(b));
      if(!A.size||!B.size) return 0; let i=0; A.forEach(x=>{ if(B.has(x)) i++; });
      return i/(A.size+B.size-i); };
    const g = [];
    orders.forEach(o=>{
      const t=(o.title||'').trim(); if(!t) return;
      let x = g.find(y=>sim(y.rep,t) >= 0.55);
      if(!x){ x={rep:t, n:0, schools:new Set()}; g.push(x); }
      x.n++; if(o.schoolId) x.schools.add(o.schoolId);
      if(t.length < x.rep.length) x.rep = t;
    });
    /* إثراء كل مجموعة ببياناتها */
    g.forEach(x=>{
      const items = orders.filter(o=>{
        const t=(o.title||'').trim(); return t && sim(x.rep,t) >= 0.55;
      });
      x.items = items;
      const fc = {}, pc = {};
      items.forEach(o=>{
        const f = state.fields.find(y=>y.id===o.fieldId);
        const p = state.programTypes.find(y=>y.id===o.programTypeId);
        if(f) fc[f.name] = (fc[f.name]||0)+1;
        if(p) pc[p.name] = (pc[p.name]||0)+1;
      });
      x.field = Object.entries(fc).sort((a,b)=>b[1]-a[1])[0];
      x.path  = Object.entries(pc).sort((a,b)=>b[1]-a[1])[0];
      x.hours = Math.round(items.reduce((s,o)=>s+computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo),0)*10)/10;
      x.people= items.reduce((s,o)=>s+(Number(o.participantsCount)||0),0);
      x.last  = items.map(o=>o.date).filter(Boolean).sort().pop();
      x.done  = items.filter(o=>o.completionStatus==='تم').length;
    });
    return g.sort((a,b)=>b.n-a.n).slice(0,8);
  })();
  const maxT = Math.max(...topT.map(x=>x.n), 1);
  const topTitlesHtml = topT.length ? `
    <div class="tt-list">${topT.map((x,i)=>`
      <button type="button" class="tt-row" data-tt="${i}">
        <span class="tt-rank">${i+1}</span>
        <span class="tt-main">
          <span class="tt-title" title="${escapeHtml(x.rep)}">${escapeHtml(x.rep)}</span>
          <span class="tt-meta">
            ${x.field?`<em>${escapeHtml(x.field[0])}</em>`:''}
            ${x.path?`<em>${escapeHtml(x.path[0])}</em>`:''}
            <em>${x.schools.size} جهة</em>
            <em>${x.hours} ساعة</em>
            ${x.people?`<em>${x.people} مستهدف</em>`:''}
            ${x.last?`<em>آخر تنفيذ ${fmtDate(x.last)}</em>`:''}
          </span>
          <span class="tt-bar"><i style="width:${Math.round(x.n/maxT*100)}%"></i></span>
        </span>
        <span class="tt-num">${x.n}<b>طلب</b></span>
      </button>`).join('')}</div>`
    : `<div class="empty-state" style="padding:18px;">لا توجد بيانات كافية</div>`;

  /* أين يتركز العمل؟ — حسب مسار المبادرة */
  const byPath = (state.programTypes||[]).map(p=>({
    name:p.name, count:orders.filter(o=>o.programTypeId===p.id).length
  })).filter(x=>x.count>0).sort((a,b)=>b.count-a.count);
  const maxPath = Math.max(...byPath.map(x=>x.count), 1);
  const focusHtml = byPath.length ? byPath.map(x=>`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:11px;">
      <span style="flex:0 0 150px;font-size:12.5px;color:#3A2A30;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(x.name)}</span>
      <div style="flex:1;height:8px;background:#EDEAE1;border-radius:999px;overflow:hidden;">
        <div style="width:${Math.round((x.count/maxPath)*100)}%;height:100%;background:#327B74;border-radius:999px;"></div>
      </div>
      <span style="flex:0 0 34px;text-align:left;font-size:12.5px;font-weight:600;color:#2B1B21;direction:ltr;">${x.count}</span>
    </div>`).join('') : `<div class="empty-state" style="padding:18px;">لا توجد بيانات مسارات بعد</div>`;

  /* تنبيهات التدخل */
  const soon = orders.filter(o=>{
    if(o.completionStatus==='تم' || !isLiveOrder(o)) return false;
    if(!o.date || o.date < t) return false;
    const diff = (new Date(o.date+'T00:00:00') - new Date(t+'T00:00:00'))/86400000;
    return diff <= 3;
  });
  const alerts = [
    ...groups.decide.slice(0,4).map(o=>({o, txt:'انتهت ولم تُوثَّق نتيجتها'})),
    ...groups.postponed.slice(0,3).map(o=>({o, txt:'مؤجلة وتحتاج إعادة جدولة'})),
    ...soon.slice(0,3).map(o=>({o, txt:'موعدها خلال ثلاثة أيام'})),
  ];
  const alertsHtml = alerts.length ? alerts.map((a,i)=>{
    const sc = state.schools.find(x=>x.id===a.o.schoolId);
    return `<button type="button" class="activity-row" data-open="${a.o.id}">
      <span class="request-mark mark-${['amber','slate','teal'][i%3]}">${icon('alert',16)}</span>
      <span style="min-width:0;flex:1;text-align:right;">
        <span class="ar-title">${escapeHtml(a.o.title)}</span>
        <span class="ar-sub">${a.o.serial} · ${sc?escapeHtml(sc.name):'—'} · ${escapeHtml(a.txt)}</span>
      </span>
      <span class="ar-chev">${icon('chevronLeft',16)}</span>
    </button>`;
  }).join('') : `<div class="empty-state" style="padding:20px;">لا توجد تنبيهات عاجلة. مساحة العمل تحت السيطرة.</div>`;

  const postponedBox = groups.postponed.length ? `<section class="panel fade-up delay-3" style="margin-top:18px;border-color:#E5D6C4;background:#FCF7EF;">
    <div class="panel-heading">
      <div><p class="section-eyebrow" style="color:#A96936;">تحتاج إعادة جدولة</p><h3 class="panel-title">طلبات مؤجلة</h3></div>
      <span class="status-badge status-late">${groups.postponed.length}</span>
    </div>
    <div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:10px;">
      ${groups.postponed.slice(0,6).map(o=>{
        const sc = state.schools.find(x=>x.id===o.schoolId);
        return `<button type="button" class="ops-chip" data-open="${o.id}">
          ${escapeHtml(o.title)} <span style="opacity:.65;">· ${sc?escapeHtml(sc.name):'—'}</span></button>`;
      }).join('')}
    </div>
  </section>` : '';

  c.innerHTML = `
    <section class="ops-hero fade-up">
      <h2>مركز التشغيل</h2>
      <p class="ops-hero-sub">رؤية واحدة لكل ما يحتاج قرارًا أو متابعة أو توثيقًا اليوم.</p>
      <p class="ops-hero-hint">لا تبحث عن الطلب المتعثر؛ ستراه أمامك.</p>
    </section>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:16px;margin-bottom:18px;">${kpis}</div>
    <div class="ops-board fade-up delay-2">
      ${column('يحتاج قرار', groups.decide, 'مبادرات انتهت ولم تُوثَّق نتيجتها بعد', 'decide')}
      ${column('قيد التجهيز', groups.preparing, 'مبادرات قادمة قيد الإعداد والتنسيق', 'preparing')}
      ${column('أثر موثق', groups.documented, 'مبادرات اكتملت وسُجِّل أثرها', 'documented')}
    </div>
    ${postponedBox}
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:18px;align-items:start;margin-top:18px;">
      <section class="panel fade-up delay-3">
        <div class="panel-heading"><div>
          <p class="section-eyebrow">توزيع الجهد</p><h3 class="panel-title">أين يتركز العمل؟</h3></div></div>
        <div style="margin-top:18px;">${focusHtml}</div>
      </section>
      <section class="panel fade-up delay-4">
        <div class="panel-heading"><div>
          <p class="section-eyebrow">يحتاج انتباهك</p><h3 class="panel-title">تنبيهات التدخل</h3></div></div>
        <div style="margin-top:14px;">${alertsHtml}</div>
      </section>
    </div>
    <section class="panel fade-up delay-4" style="margin-top:18px;">
      <div class="panel-heading" style="flex-wrap:wrap;gap:10px;"><div>
        <p class="section-eyebrow">الأكثر تكرارًا</p>
        <h3 class="panel-title">أكثر عناوين المبادرات طلبًا</h3>
        <p class="helper" style="margin:4px 0 0;">
          ${topT.length ? `${orders.length} فعالية · ${topT.length} عنوان في الصدارة · العناوين المتشابهة مدموجة تلقائيًا` : ''}
        </p></div>
        <button class="btn btn-outline" id="opsTopReport" style="min-height:34px;font-size:12px;">
          ${icon('barChart',14)} التقرير الكامل</button>
      </div>
      <div style="margin-top:14px;">${topTitlesHtml}</div>
    </section>`;

  /* فتح التقرير الكامل */
  const _tr = document.getElementById('opsTopReport');
  if(_tr) _tr.onclick = ()=>{ currentPage='reports'; setSubTab('reports','rep'); render();
    setTimeout(()=>{ const s=document.getElementById('rep_type'); if(s){ s.value='topPrograms'; s.dispatchEvent(new Event('change')); } }, 60); };
  /* النقر على عنوان يعرض فعالياته */
  c.querySelectorAll('[data-tt]').forEach(b=>{
    b.onclick = ()=>{
      const g = topT[Number(b.dataset.tt)]; if(!g) return;
      const rows = (g.items||[]).slice().sort((a,b2)=>(b2.date||'').localeCompare(a.date||''));
      showInfoModal(`${escapeHtml(g.rep)} — ${g.n} ${eventWord(g.n)}`, `
        <div style="max-height:56vh;overflow:auto;">
          ${rows.map(o=>{
            const sc = state.schools.find(x=>x.id===o.schoolId);
            return `<button type="button" class="activity-row" data-view="${o.id}" style="width:100%;">
              <span class="request-mark mark-teal">${icon('fileText',15)}</span>
              <span style="min-width:0;flex:1;text-align:right;">
                <span class="ar-title">${escapeHtml(o.title)}</span>
                <span class="ar-sub">${o.serial} · ${sc?escapeHtml(sc.name):'—'} · ${fmtDate(o.date)}</span>
              </span>${doneBadge(o.completionStatus)}</button>`;
          }).join('')}
        </div>`, box=>{
        box.style.maxWidth='620px';
        box.querySelectorAll('[data-view]').forEach(x=>{
          x.onclick=()=>{ closeModal(); setTimeout(()=>viewOrderReadOnly(x.dataset.view), 60); };
        });
      });
    };
  });

  c.querySelectorAll('[data-countup]').forEach(el=>countUp(el, el.dataset.countup));
  c.querySelectorAll('[data-open]').forEach(b=>{ b.onclick=()=>editOrder(b.dataset.open); });
  c.querySelectorAll('[data-next]').forEach(b=>{ b.onclick=(e)=>{ e.stopPropagation(); opsAdvance(b.dataset.next); }; });

  /* ══════════════════════════════════════════════════════════════
     القرار الجماعي في عمود «يحتاج قرار»
     ──────────────────────────────────────────────────────────────
     بدل فتح كل مبادرة على حدة لتسجيل نتيجتها: تُحدَّد دفعةً واحدة
     ويُطبَّق القرار نفسه عليها، بحفظ واحد لا حفظ لكل سجل.
     ══════════════════════════════════════════════════════════════ */
  (function wireOpsBulk(){
    const all = c.querySelector('#opsAll');
    const chks = [...c.querySelectorAll('.ops-chk')];
    if(!chks.length) return;
    const selBox = c.querySelector('#opsSel'), acts = c.querySelector('#opsActs');
    const applyBtn = c.querySelector('#opsApply'), clearBtn = c.querySelector('#opsClear');
    const decision = c.querySelector('#opsDecision');

    const picked = ()=>chks.filter(x=>x.checked);
    const sync = ()=>{
      const n = picked().length;
      if(selBox){ selBox.hidden = !n; const b=selBox.querySelector('b'); if(b) b.textContent = n; }
      if(acts) acts.hidden = !n;
      if(all){ all.checked = n===chks.length && n>0; all.indeterminate = n>0 && n<chks.length; }
      chks.forEach(x=>{ const card=x.closest('.ops-card'); if(card) card.classList.toggle('picked', x.checked); });
    };
    chks.forEach(x=>{ x.onchange = sync;
      x.onclick = e=>e.stopPropagation(); });
    if(all) all.onchange = ()=>{ chks.forEach(x=>{ x.checked = all.checked; }); sync(); };
    if(clearBtn) clearBtn.onclick = ()=>{ chks.forEach(x=>{ x.checked=false; }); sync(); };

    if(applyBtn) applyBtn.onclick = async ()=>{
      const v = decision ? decision.value : '';
      if(!v){ toast('اختر القرار أولًا'); if(decision) decision.focus(); return; }
      const ids = picked().map(x=>x.value);
      if(!ids.length){ toast('لم تُحدَّد أي مبادرة'); return; }
      const names = ids.slice(0,6).map(id=>{
        const o = state.orders.find(x=>x.id===id); return '• ' + ((o&&o.title)||id);
      }).join('\n') + (ids.length>6 ? `\n… و${ids.length-6} أخرى` : '');
      if(!confirm(`سيُسجَّل القرار «${v}» على ${ids.length} ${eventWord(ids.length)}:\n\n${names}\n\nمتابعة؟`)) return;
      let n = 0;
      ids.forEach(id=>{
        const o = state.orders.find(x=>x.id===id); if(!o) return;
        o.completionStatus = v; logAudit('status', o, v);
        if(v === 'الغيت' && o.status!=='cancelled') markCancelled(o, 'سُجّل الإنجاز «أُلغيت»');
        o.evaluatedBy = currentRole==='trainer' ? 'trainer' : 'admin';
        n++;
      });
      await saveState();                      /* حفظ واحد للدفعة كلها */
      toast(`سُجِّل القرار «${v}» على ${n} ${eventWord(n)}`);
      render();
    };
    sync();
  })();
}

/* ══════════════════════════════════════════════════════════════════
   الشاشة الرئيسية — لوحة تنفيذية
   ──────────────────────────────────────────────────────────────────
   تجيب بمجرد الدخول عن خمسة أسئلة: ما لديك، وما يحتاج انتباهك،
   وما المتأخر، وما القادم، وما أُنجز. لا تغيّر منطق العمل ولا
   إجراءاته — إنما طريقة العرض والتنظيم.
   ══════════════════════════════════════════════════════════════════ */

/* عدّاد تصاعدي قصير — يُظهر أن الرقم محسوب لا ثابت */
function countUp(el, to, ms){
  to = Number(to) || 0;
  if(!el) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce || to === 0){ el.textContent = to; return; }
  const dur = ms || 650, t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
    if(k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const ST_TOKENS = { new:'var(--ds-info)', run:'#0E7C86', done:'var(--ds-ok)',
                    late:'var(--ds-dan)', hold:'var(--ds-warn)', draft:'var(--ds-ink-3)' };
const ST_NAMES  = { new:'قادمة', run:'اليوم', done:'منجزة', late:'تحتاج متابعة', hold:'مؤجّلة', draft:'ملغاة' };
/* حالة الفعالية كما تُعرض للمستخدم */
function orderState(o, today){
  if(isCancelledOrder(o)) return {k:'draft', l:'ملغاة'};
  if((o.status||'active') === 'postponed') return {k:'hold',  l:'مؤجّلة'};
  if(o.completionStatus === 'تم')          return {k:'done',  l:'مكتملة'};
  if(o.completionStatus)                   return {k:'late',  l:o.completionStatus};
  if(o.date && o.date < today)             return {k:'late',  l:'متأخرة التقييم'};
  if(o.date === today)                     return {k:'run',   l:'اليوم'};
  return {k:'new', l:'قادمة'};
}

function renderHome(c){
  const orders = (state.orders || []);
  const today  = todayStr();
  const live   = orders.filter(o=>(o.status||'active') !== 'cancelled');

  /* ── المؤشّرات ── */
  const total     = orders.length;
  const upcoming  = live.filter(o=>o.date && o.date >= today);
  const completed = orders.filter(o=>o.completionStatus === 'تم');
  const lateEval  = live.filter(o=>o.date && o.date < today && !o.completionStatus);
  const noAnswer  = orders.filter(o=>o.completionStatus === 'المشرف لا يرد');
  const pendingAppr = (state.trainerRequests||[]).filter(r=>r.status === 'pending');
  const soon      = upcoming.filter(o=>{ const d = daysDiffSafe(today, o.date); return d !== null && d <= 3; });
  const noSup     = live.filter(o=>!o.supervisorId && o.date && o.date >= today);
  const clashes   = (function(){
    const seen = {}, out = [];
    live.forEach(o=>(o.trainerIds||[]).forEach(t=>{
      const k = t + '|' + o.date;
      if(seen[k]) out.push(o); else seen[k] = 1;
    }));
    return out;
  })();

  const KPI = [
    {k:'total', v:total,            l:'إجمالي الفعاليات', s:`${live.length} سارية`,
     ic:'clipboard', c:'var(--ds-navy)',  b:'#E7EDF4', go:()=>{ currentPage='ordersList'; }},
    {k:'run',   v:upcoming.length,  l:'قيد التنفيذ والقادمة', s:`${soon.length} خلال ٣ أيام`,
     ic:'calendar',  c:'var(--ds-teal)',  b:'var(--ds-teal-l)', go:()=>{ currentPage='schedule'; }},
    {k:'done',  v:completed.length, l:'مكتملة',
     s: total ? `${Math.round(completed.length/total*100)}% من الإجمالي` : 'لا توجد بيانات',
     ic:'checkCircle', c:'var(--ds-ok)', b:'var(--ds-ok-l)',  go:()=>{ currentPage='results'; }},
    {k:'late',  v:lateEval.length,  l:'تحتاج متابعة', s:'مضى موعدها بلا تقييم',
     ic:'alert',     c:'var(--ds-dan)',  b:'var(--ds-dan-l)', go:()=>{ currentPage='operations'; }},
  ];

  /* ── تحتاج انتباهك ── */
  const ATT = [
    {n:lateEval.length,     t:'فعاليات مضى موعدها بلا تقييم', s:'تحتاج إغلاقًا وتوثيقًا',
     ic:'alert',       c:'var(--ds-dan)',  b:'var(--ds-dan-l)',  go:()=>{ currentPage='operations'; }},
    {n:soon.length,         t:'تكليفات خلال الأيام الثلاثة القادمة', s:'تأكّد من الجاهزية',
     ic:'clock',       c:'var(--ds-warn)', b:'var(--ds-warn-l)', go:()=>{ currentPage='schedule'; }},
    {n:pendingAppr.length,  t:'طلبات تنتظر موافقتك', s:'مقدّمة من مقدّمي المبادرات',
     ic:'checkCircle', c:'var(--ds-info)', b:'var(--ds-info-l)', go:()=>{ currentPage='approvals'; }},
    {n:noSup.length,        t:'فعاليات قادمة بلا مشرف', s:'يلزم تحديد مشرف الجهة',
     ic:'users',       c:'var(--ds-gold-d)', b:'var(--ds-gold-l)', go:()=>{ currentPage='ordersList'; }},
    {n:clashes.length,      t:'تضارب في إسناد المقدّمين', s:'مقدّم في أكثر من فعالية باليوم نفسه',
     ic:'alert',       c:'var(--ds-dan)',  b:'var(--ds-dan-l)',  go:()=>{ currentPage='schedule'; }},
    {n:noAnswer.length,     t:'فعاليات لم يردّ مشرفها', s:'تحتاج تواصلًا مع الجهة',
     ic:'users',       c:'var(--ds-warn)', b:'var(--ds-warn-l)', go:()=>{ currentPage='operations'; }},
  ].filter(x=>x.n > 0);

  /* ── الرسم: فعاليات حسب الفترة ── */
  if(!window.__homePeriod) window.__homePeriod = 'month';
  function series(period){
    const out = [];
    if(period === 'week'){
      const DW = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
      const start = getWeekBounds(today).start;
      for(let i=0;i<7;i++){ const d = addDaysISO(start,i);
        out.push({ label:DW[new Date(d+'T00:00:00').getDay()].slice(0,3),
          n:live.filter(o=>o.date <= d && orderEnd(o) >= d).length, key:d }); }
    } else if(period === 'month'){
      const MN = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      const now = new Date();
      for(let i=-2;i<=3;i++){
        const d = new Date(now.getFullYear(), now.getMonth()+i, 1);
        const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
        out.push({ label:MN[d.getMonth()].slice(0,4) + (i===0?' ·':''),
          n:live.filter(o=>(o.date||'').slice(0,7) === key).length, key, now:i===0 });
      }
    } else {
      const y = new Date().getFullYear();
      for(let i=-2;i<=1;i++){ const yy = y + i;
        out.push({ label:String(yy), n:live.filter(o=>(o.date||'').slice(0,4) === String(yy)).length,
          key:String(yy), now:i===0 }); }
    }
    return out;
  }
  const ser = series(window.__homePeriod);
  const maxN = Math.max(1, ...ser.map(x=>x.n));

  /* ── توزيع الحالات ── */
  const stCount = {};
  live.forEach(o=>{ const s = orderState(o, today); stCount[s.k] = stCount[s.k] || {n:0, l:s.l, k:s.k}; stCount[s.k].n++; });
  const ST_COLOR = ST_TOKENS;
  const ST_LABEL = { new:'قادمة', run:'اليوم', done:'مكتملة', late:'تحتاج متابعة',
                     hold:'مؤجّلة', draft:'ملغاة' };
  const dist = Object.values(stCount).sort((a,b)=>b.n-a.n);
  const distTotal = dist.reduce((s,x)=>s+x.n,0) || 1;

  /* ── الرزنامة الأسبوعية ── */
  const wkStart = getWeekBounds(today).start;
  const DWS = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const week = Array.from({length:7},(_,i)=>{
    const d = addDaysISO(wkStart, i);
    const dow = new Date(d+'T00:00:00').getDay();
    return { d, dow, off:(dow===5||dow===6), today:d===today,
      n:live.filter(o=>o.date <= d && orderEnd(o) >= d).length };
  });

  /* ── آخر التكليفات ── */
  const recent = orders.slice()
    .sort((a,b)=>(Number(b.serial)||0) - (Number(a.serial)||0))
    .slice(0, 7);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'صباح الخير' : hour < 17 ? 'طاب يومك' : 'مساء الخير';
  const name  = currentUser ? (currentUser.displayName || currentUser.username) : '';
  const attTotal = ATT.reduce((s,x)=>s+x.n, 0);

  c.innerHTML = `
  <div class="dash">

    <section class="dash-hero">
      <div class="dash-hero-in">
        <div class="dash-hello">
          <span class="eyebrow">${icon('sparkles',14)} ${greet}${name?'، '+escapeHtml(name):''}</span>
          <h2>${attTotal ? `${attTotal} ${attTotal===1?'بند يحتاج':'بندًا تحتاج'} انتباهك اليوم`
                         : 'كل شيء تحت السيطرة'}</h2>
          <p>${upcoming.length} ${eventWord(upcoming.length)} قادمة · ${completed.length} مكتملة
             · ${(state.schools||[]).length} جهة · ${(state.trainers||[]).length} مقدّم مبادرة</p>
        </div>
        <div class="dash-hero-acts">
          <button class="btn btn-primary" id="dhNew">${icon('filePlus',16)} إنشاء طلب جديد</button>
          <button class="btn btn-outline" id="dhOps" style="background:rgba(255,255,255,.10);color:#fff;border-color:rgba(255,255,255,.28);">
            ${icon('activity',16)} مركز التشغيل</button>
        </div>
      </div>
    </section>

    <section class="kpi-row">
      ${KPI.map((k,i)=>`
        <article class="kpi" data-kpi="${i}" style="--kc:${k.c};--kb:${k.b};" tabindex="0" role="button">
          <div class="kpi-top">
            <div>
              <div class="kpi-v" data-countup="${k.v}">0</div>
              <div class="kpi-l">${escapeHtml(k.l)}</div>
            </div>
            <span class="kpi-ic">${icon(k.ic,20)}</span>
          </div>
          <div class="kpi-sub">${escapeHtml(k.s)}</div>
        </article>`).join('')}
    </section>

    <section class="dash-2col">
      <div class="dcard">
        <div class="dcard-h"><span class="t">${icon('alert',16)} تحتاج انتباهك</span>
          ${attTotal?`<span class="sp"><span class="st st-late">${attTotal}</span></span>`:''}</div>
        <div class="dcard-b flush">
          ${ATT.length ? `<div class="att-list">${ATT.map((a,i)=>`
            <div class="att" data-att="${i}" tabindex="0" role="button" style="--ac:${a.c};--ab:${a.b};">
              <span class="att-ic">${icon(a.ic,17)}</span>
              <span class="att-tx"><b>${escapeHtml(a.t)}</b><span>${escapeHtml(a.s)}</span></span>
              <span class="att-n">${a.n}</span>
            </div>`).join('')}</div>`
          : `<div class="att-empty">${icon('checkCircle',26)}<div>لا شيء متأخر ولا معلّق — كل الأعمال في مسارها.</div></div>`}
        </div>
      </div>
      <div class="dcard">
        <div class="dcard-h">
          <span class="t">${icon('calendar',16)} هذا الأسبوع</span>
          <span class="sp"><button class="btn btn-sm btn-outline" id="dhWeek">جدول المقدّمين</button></span>
        </div>
        <div class="dcard-b">
          <div class="wk">
            ${week.map(w=>`<div class="wk-d${w.off?' off':''}${w.today?' today':''}${w.n?'':' empty'}" data-day="${w.d}">
              <span class="dn">${DWS[w.dow].slice(0,3)}</span>
              <span class="dd">${Number(w.d.slice(8,10))}</span>
              <span class="dc">${w.n ? w.n + ' فعالية' : '—'}</span>
            </div>`).join('')}
          </div>
        </div>
      </div>

    </section>

    <section class="dcard">
      <div class="dcard-h">
        <span class="t">${icon('clipboard',16)} آخر التكليفات</span>
        <span class="sp"><button class="btn btn-sm btn-outline" id="dhAll">عرض كل الطلبات</button></span>
      </div>
      <div class="dcard-b flush">
        ${recent.length ? `<div class="tbl-scroll"><table class="dtbl"><thead><tr>
          <th style="width:62px;">التكليف</th><th>الفعالية</th><th style="width:110px;">التاريخ</th>
          <th style="width:150px;">الجهة</th><th style="width:140px;">المقدّم</th>
          <th style="width:110px;">الحالة</th><th style="width:118px;"></th>
        </tr></thead><tbody>
          ${recent.map(o=>{
            const sc = (state.schools||[]).find(x=>x.id===o.schoolId);
            const tn = (o.trainerIds||[]).map(id=>{ const t=(state.trainers||[]).find(y=>y.id===id); return t?t.name:''; }).filter(Boolean);
            const st = orderState(o, today);
            return `<tr data-row="${o.id}">
              <td><span class="badge">${o.serial}</span></td>
              <td><span class="ttl">${escapeHtml(o.title||'بلا عنوان')}</span>
                  <span class="sub">${escapeHtml(fullTimeRange(o.timeFrom,o.timeTo)||'—')}</span></td>
              <td style="white-space:nowrap;">${fmtDate(o.date)}</td>
              <td>${sc?escapeHtml(sc.name):'—'}</td>
              <td>${tn.length?escapeHtml(tn[0]) + (tn.length>1?` +${tn.length-1}`:''):'—'}</td>
              <td><span class="st st-${st.k}">${escapeHtml(st.l)}</span></td>
              <td><span class="row-acts">
                <button data-act="view" data-id="${o.id}" data-tip="عرض" title="عرض التفاصيل" aria-label="عرض">${icon('eye',14)}</button>
                <button data-act="edit" data-id="${o.id}" data-tip="تعديل" title="تعديل الطلب" aria-label="تعديل">${icon('edit',14)}</button>
                <button data-act="print" data-id="${o.id}" data-tip="طباعة" title="طباعة أمر التكليف" aria-label="طباعة">${icon('printer',14)}</button>
              </span></td>
            </tr>`;
          }).join('')}
        </tbody></table></div>`
        : `<div class="att-empty">${icon('filePlus',26)}
            <div>لا توجد تكليفات بعد. ابدأ بإنشاء أول طلب فعالية.</div></div>`}
      </div>
    </section>

  </div>`;

  /* ── التفاعل ── */
  c.querySelectorAll('[data-countup]').forEach(el=>countUp(el, el.dataset.countup));

  const go = fn => { fn(); render(); };
  const nb = document.getElementById('dhNew');
  if(nb) nb.onclick = ()=>go(()=>{ currentPage='newOrder'; editingOrderId=null; });
  const ob = document.getElementById('dhOps');
  if(ob) ob.onclick = ()=>go(()=>{ currentPage='operations'; });
  const wb = document.getElementById('dhWeek');
  if(wb) wb.onclick = ()=>go(()=>{ currentPage='schedule'; });
  const ab = document.getElementById('dhAll');
  if(ab) ab.onclick = ()=>go(()=>{ currentPage='ordersList'; });

  c.querySelectorAll('[data-kpi]').forEach(el=>{
    const act = ()=>go(KPI[Number(el.dataset.kpi)].go);
    el.onclick = act;
    el.onkeydown = e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); act(); } };
  });
  c.querySelectorAll('[data-att]').forEach(el=>{
    const act = ()=>go(ATT[Number(el.dataset.att)].go);
    el.onclick = act;
    el.onkeydown = e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); act(); } };
  });
  const per = document.getElementById('dhPer');
  if(per) per.querySelectorAll('[data-per]').forEach(b=>{
    b.onclick = ()=>{ window.__homePeriod = b.dataset.per; render(); };
  });
  c.querySelectorAll('[data-day]').forEach(el=>{
    el.onclick = ()=>{ window.__schedFrom = el.dataset.day; window.__schedTo = el.dataset.day;
      currentPage='schedule'; render(); };
  });
  c.querySelectorAll('.row-acts [data-act]').forEach(b=>{
    b.onclick = async e=>{
      e.stopPropagation();
      const id = b.dataset.id, o = state.orders.find(x=>x.id===id);
      if(b.dataset.act === 'view')  return viewOrderReadOnly(id);
      if(b.dataset.act === 'edit')  return editOrder(id);
      if(b.dataset.act === 'print' && o)
        return doPrintDoc(await buildOrderPrintDoc(o, {showAdminNote:false}, 'نسخة الجهة الطالبة'), true, 'A4');
    };
  });
  c.querySelectorAll('[data-row]').forEach(tr=>{
    tr.style.cursor = 'pointer';
    tr.onclick = e=>{ if(e.target.closest('.row-acts')) return; viewOrderReadOnly(tr.dataset.row); };
  });
}

/* حلقة توزيع بسيطة مرسومة بـ SVG */
function donutSvg(parts, total){
  const R = 54, C = 2 * Math.PI * R, W = 15;
  const sum = parts.reduce((s,p)=>s+p.v, 0) || 1;
  let off = 0;
  const arcs = parts.map(p=>{
    const len = p.v / sum * C;
    const seg = `<circle cx="70" cy="70" r="${R}" fill="none" stroke="${p.c}" stroke-width="${W}"
      stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
      transform="rotate(-90 70 70)" stroke-linecap="butt"></circle>`;
    off += len; return seg;
  }).join('');
  return `<svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label="توزيع الحالات" style="flex:none;">
    <circle cx="70" cy="70" r="${R}" fill="none" stroke="var(--ds-line-2)" stroke-width="${W}"></circle>
    ${arcs}
    <text x="70" y="66" text-anchor="middle" font-size="25" font-weight="800" fill="var(--ds-ink)">${total}</text>
    <text x="70" y="86" text-anchor="middle" font-size="11" fill="var(--ds-ink-3)">فعالية سارية</text>
  </svg>`;
}

function trainerNames(order){
  return (order.trainerIds||[]).map(id=>{ const t=state.trainers.find(x=>x.id===id); return t?t.name:''; }).filter(Boolean).join('، ');
}
function trainerPhones(order){
  return (order.trainerIds||[]).map(id=>{ const t=state.trainers.find(x=>x.id===id); return t?t.phone:''; }).filter(Boolean).join('، ');
}
/* Renders a phone number as a clickable tel: link for reports (on-screen and print) */
function phoneLink(phone){
  const p = (phone||'').toString().trim();
  if(!p) return '';
  const digits = p.replace(/[^\d+]/g,'');
  return `<a href="tel:${digits}" style="color:inherit;text-decoration:underline;white-space:nowrap;">${escapeHtml(p)}</a>`;
}
/* رقم هاتف + أيقونة اتصال + أيقونة واتساب، تُستخدم في أمر التكليف بجانب هاتف المشرف/مقدم المبادرة */
function phoneLinkWithIcons(phone){
  const p = (phone||'').toString().trim();
  if(!p) return '-';
  const digits = p.replace(/[^\d+]/g,'');
  const bare = digits.replace(/^\+/,'').replace(/^0+/,'');
  const waDigits = bare.length<=8 ? '974'+bare : bare;
  const waSvg = `<svg viewBox="0 0 24 24" width="12" height="12" fill="#25D366" style="vertical-align:-1px;"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.09c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.17-1.56-1.17-2.97s.74-2.11 1-2.4c.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.65.49.24.58.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.15.31-.29.48-.14.17-.3.38-.43.51-.14.14-.29.29-.12.57.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.41.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.65-.14.26.1 1.67.79 1.96.93.29.14.48.22.55.34.07.12.07.7-.17 1.38z"/></svg>`;
  const telSvg = `<svg viewBox="0 0 24 24" width="12" height="12" fill="#1E9E57" style="vertical-align:-1px;"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .7-.2 1l-2.3 2.2z"/></svg>`;
  return `<span style="white-space:nowrap;color:#111;"><span class="num-f">${escapeHtml(p)}</span>
    <a href="tel:${digits}" title="اتصال" style="text-decoration:none;margin-inline-start:5px;">${telSvg}</a>
    <a href="https://wa.me/${waDigits}" target="_blank" title="واتساب" style="text-decoration:none;margin-inline-start:3px;">${waSvg}</a>
  </span>`;
}

/* ============ Order tables ============ */
/* Enhances a report table: wraps it for horizontal scroll, adds a toolbar with
   "reset column widths" and "toggle text wrap", and makes each column's border
   draggable to resize manually. Auto-fit-to-content is the browser default
   (table-layout:auto) and is restored any time "reset" is pressed or the table
   is re-rendered (e.g. after filtering/searching), since a fresh render has no
   inline widths. Call this once, right after inserting a <table> into `container`. */
function enhanceReportTable(container){
  if(!container) return;
  const tables = container.querySelectorAll('table');
  if(!tables.length) return;

  if(!container.querySelector('.tbl-enhance-toolbar')){
    const toolbar = document.createElement('div');
    toolbar.className = 'tbl-enhance-toolbar';
    toolbar.innerHTML = '';   // أُخفيت أزرار ضبط الأعمدة والعرض المضغوط
    toolbar.style.display = 'none';
    if(tables[0].parentNode) tables[0].parentNode.insertBefore(toolbar, tables[0]);
    /* ⚠ الأزرار مُخفاة فعلًا، فلا نربط أحداثًا على عناصر غير موجودة —
       كان ذلك يرفع استثناءً يقطع render() فلا تُرسم بقية الصفحة. */
    const btns = toolbar.querySelectorAll('button');
    if(btns[0]) btns[0].onclick = ()=>{ container.querySelectorAll('th').forEach(th=>{ th.style.width=''; }); };
    if(btns[1]) btns[1].onclick = ()=>{ container.querySelectorAll('.tbl-scroll').forEach(w=>w.classList.toggle('tbl-nowrap')); };
  }

  /* ضبط أعمدة الأرقام والمدة على الشاشة كما في الطباعة */
  /* نفس عروض الطباعة بالضبط — مصدر واحد (REP_COL_W) فلا تختلف الشاشة عن الورق.
     ⚠ العنوان لا يُجبَر على سطر واحد: إجباره كان يُخرج نصّه خارج خط العمود
     في الأعمدة الضيقة (عدد الساعات، أمر التكليف). */
  const MM = mm => Math.round(parseFloat(mm) * 96 / 25.4) + 'px';
  tables.forEach(table=>{
    /* جداول التقارير فقط — لا جدول الطلبات ولا غيره من جداول الشاشة */
    if(!table.classList.contains('rep-tbl')) return;
    const ths = table.querySelectorAll(':scope > thead > tr > th');
    ths.forEach((th,i)=>{
      const t = (th.textContent||'').trim();
      let spec; try{ spec = repColSpec(t); }catch(e){ return; }
      if(!spec || spec.w==='auto') return;
      const px = MM(spec.w);
      th.style.width = px;
      th.style.whiteSpace = 'normal';
      th.style.overflowWrap = 'break-word';
      th.style.textAlign = 'center';
      if(spec.fit) th.style.minWidth = px;
      table.querySelectorAll(':scope > tbody > tr').forEach(tr=>{
        const td = tr.children[i];
        if(!td) return;
        td.style.width = px;
        if(spec.fit){ td.style.whiteSpace='nowrap'; td.style.textAlign='center'; td.style.minWidth=px; }
        else { td.style.whiteSpace='normal'; td.style.overflowWrap='anywhere'; }
      });
    });
  });
  tables.forEach(table=>{
    if(!table.parentElement.classList.contains('tbl-scroll')){
      const scrollWrap = document.createElement('div');
      scrollWrap.className = 'tbl-scroll';
      table.parentNode.insertBefore(scrollWrap, table);
      scrollWrap.appendChild(table);
    }
    table.querySelectorAll('th').forEach(th=>{
      if(th.querySelector('.col-resizer')) return;
      const handle = document.createElement('span');
      handle.className = 'col-resizer';
      th.appendChild(handle);
      handle.addEventListener('mousedown', (e)=>{
        e.preventDefault(); e.stopPropagation();
        handle.classList.add('active');
        const startX = e.clientX, startWidth = th.offsetWidth;
        function onMove(ev){
          const delta = startX - ev.clientX; // RTL: dragging the left edge left increases width
          th.style.width = Math.max(40, startWidth + delta) + 'px';
        }
        function onUp(){
          handle.classList.remove('active');
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  });
}
let __orderTableSelections = {};
function otblSelectAll(containerId, headerCheckbox){
  const container = document.getElementById(containerId);
  if(!__orderTableSelections[containerId]) __orderTableSelections[containerId] = new Set();
  const set = __orderTableSelections[containerId];
  container.querySelectorAll('.otbl-check').forEach(cb=>{ cb.checked = headerCheckbox.checked;
    if(cb.checked) set.add(cb.dataset.id); else set.delete(cb.dataset.id); });
  otblSyncBar(containerId);
}
function otblSelect(containerId, checkbox){
  if(!__orderTableSelections[containerId]) __orderTableSelections[containerId] = new Set();
  const set = __orderTableSelections[containerId];
  if(checkbox.checked) set.add(checkbox.dataset.id); else set.delete(checkbox.dataset.id);
  const container = document.getElementById(containerId);
  const allChecks = container.querySelectorAll('.otbl-check');
  const headerCheckbox = container.querySelector('.otbl-check-all');
  if(headerCheckbox) headerCheckbox.checked = allChecks.length>0 && Array.from(allChecks).every(cb=>cb.checked);
  otblSyncBar(containerId);
}
function otblAction(containerId, action){
  const set = __orderTableSelections[containerId] || new Set();
  const id = set.size===1 ? Array.from(set)[0] : null;
  if(!id){ toast('الرجاء تحديد طلب واحد فقط عبر مربع الاختيار لهذا الإجراء'); return; }
  if(action==='edit') editOrder(id);
  else if(action==='eval') openEvaluationModal(id);
  else if(action==='postpone') openPostponeModal(id);
  else if(action==='cancel') toggleCancelOrder(id);
  else if(action==='qr') openQrCodeModal(id);
  else if(action==='printSchool') printOrderSchoolCopy(id);
  else if(action==='printAdmin') printOrderAdminCopy(id);
  else if(action==='email') emailOrder(id);
  else if(action==='whatsapp') shareOrderWhatsApp(id);
  else if(action==='duplicate') duplicateOrder(id);
  else if(action==='delete') deleteOrder(id);
}
function otblActionFromSelect(containerId){
  const _sel = document.getElementById(containerId+'_actionSelect');
  if(_sel && !_sel.value) return;                       // لا تنفيذ بلا اختيار
  const select = document.getElementById(containerId+'_actionSelect');
  const action = select.value;
  if(!action){ toast('اختر إجراءً أولًا من القائمة'); return; }
  otblAction(containerId, action);
  select.value = '';
}
/* حذف كل الفعاليات المحددة من جدول كل الطلبات */
/* ══════════ تقرير الفعاليات المحددة ══════════ */
const SEL_HDR = ['رقم التكليف','عنوان المبادرة','التاريخ','من','إلى','مكان التنفيذ','هاتف المشرف','مقدم المبادرة','المجال','المسار'];
function selectedOrderRows(containerId){
  const ids = __orderTableSelections[containerId] ? Array.from(__orderTableSelections[containerId]) : [];
  const list = (state.orders||[]).filter(o=>ids.includes(o.id))
    .sort((a,b)=>(a.date||'').localeCompare(b.date||'') || (a.timeFrom||'').localeCompare(b.timeFrom||''));
  return list.map(o=>{
    const sc = state.schools.find(x=>x.id===o.schoolId);
    const sv = sc ? (sc.supervisors||[]).find(x=>x.id===o.supervisorId) : null;
    const fd = state.fields.find(x=>x.id===o.fieldId);
    const pt = state.programTypes.find(x=>x.id===o.programTypeId);
    const trs = (o.trainerIds||[]).map(id=>{ const t=state.trainers.find(y=>y.id===id); return t?t.name:''; })
      .filter(Boolean).join('، ');
    const d1 = o.date, d2 = orderEnd(o);
    return [
      o.serial,
      o.title || '',
      (d2 && d2!==d1) ? `${fmtDate(d1)} — ${fmtDate(d2)}` : fmtDate(d1),
      o.timeFrom || '—',
      o.timeTo || '—',
      sc ? sc.name : '—',
      sv && sv.phone ? sv.phone : '—',
      trs || '—',
      fd ? fd.name : '—',
      pt ? pt.name : '—',
    ];
  });
}
function otblPrintSelected(containerId){
  const rows = selectedOrderRows(containerId);
  if(!rows.length){ toast('حدد فعالية واحدة على الأقل'); return; }
  const dates = rows.map(r=>r[2]).filter(Boolean);
  doPrintDoc(buildReportDoc({
    titleAr:'تقرير الفعاليات المحددة',
    subtitle:`${rows.length} ${eventWord(rows.length)}`,
    kpis:[{v:rows.length,l:'📋 الفعاليات'},
          {v:new Set(rows.map(r=>r[5])).size,l:'🏫 الجهات'},
          {v:new Set(rows.flatMap(r=>String(r[7]).split('، ')).filter(x=>x&&x!=='—')).size,l:'👥 المقدّمون'}],
    headers:SEL_HDR,
    tableClass:'sel-tbl',
    /* تكليف · عنوان · تاريخ · من · إلى · مكان · هاتف · مقدّم · مجال · مسار */
    colWidths:['18mm','auto','30mm','15mm','15mm','46mm','22mm','40mm','30mm','30mm'],
    rows: rows.map(r=>r.map(v=>escapeHtml(String(v))))
  }), true, 'A4');
}
function otblExportSelected(containerId){
  const rows = selectedOrderRows(containerId);
  if(!rows.length){ toast('حدد فعالية واحدة على الأقل'); return; }
  exportToExcel('تقرير_الفعاليات_المحددة.xlsx', SEL_HDR, rows,
    `تقرير الفعاليات المحددة (${rows.length} ${eventWord(rows.length)})`);
}
async function otblBulkDelete(containerId){
  const ids = __orderTableSelections[containerId] ? Array.from(__orderTableSelections[containerId]) : [];
  if(!ids.length){ toast('حدد فعالية واحدة على الأقل'); return; }
  /* لا حذف: تُلغى الطلبات المحددة وتبقى بأرقامها */
  const tgt = state.orders.filter(o=>ids.includes(o.id) && !isCancelledOrder(o));
  if(!tgt.length){ toast('الطلبات المحددة ملغاة مسبقًا'); return; }
  const why = askCancelReason(tgt.length); if(why===null) return;
  tgt.forEach(o=>{ markCancelled(o, why); logAudit('cancel', o, why||'', true); });
  __orderTableSelections[containerId] = new Set();
  await saveState(); toast(`أُلغي ${tgt.length} طلب — محفوظة بأرقامها بحالة «ملغي»`); render();
}
async function otblBulkStatus(containerId){
  const set = __orderTableSelections[containerId] || new Set();
  if(set.size<1){ toast('الرجاء تحديد فعالية واحدة على الأقل'); return; }
  const select = document.getElementById(containerId+'_bulkStatus');
  const status = select.value;
  if(!status){ toast('اختر حالة الإنجاز أولًا'); return; }
  const ok = confirm(`سيتم تغيير حالة الإنجاز إلى "${status}" لعدد ${set.size} فعالية محددة. هل تريد المتابعة؟`);
  if(!ok) return;
  set.forEach(id=>{
    const o = state.orders.find(x=>x.id===id);
    if(o){ o.completionStatus = status; logAudit('status', o, status); }
  });
  await saveState(); toast('تم تحديث حالة الإنجاز'); render();
}
/* ══════════ مكوّنات الصفحات الموحّدة (pk) ══════════ */
/* قائمة منبثقة بجوار زر — items: [{ic,l,run,danger,hint}|'-'|{hd:'عنوان'}] */
function pkMenu(anchor, items){
  document.querySelectorAll('.pk-pop').forEach(x=>x.remove());
  if(anchor.__pkOpen){ anchor.__pkOpen=false; return; }
  const pop = document.createElement('div');
  pop.className = 'pk-pop'; pop.setAttribute('role','menu');
  pop.innerHTML = items.filter(Boolean).map((it,i)=> it==='-' ? '<div class="sep"></div>'
    : it.hd ? `<div class="hd">${escapeHtml(it.hd)}</div>`
    : `<button type="button" role="menuitem" data-i="${i}" class="${it.danger?'danger':''}">${icon(it.ic||'chevronLeft',15)}<span>${escapeHtml(it.l)}</span>${it.hint?`<small>${escapeHtml(it.hint)}</small>`:''}</button>`).join('');
  document.body.appendChild(pop);
  const list = items.filter(Boolean);
  pop.querySelectorAll('button[data-i]').forEach(b=>b.onclick = e=>{
    e.stopPropagation(); close(); const it = list[Number(b.dataset.i)]; if(it && it.run) it.run(); });
  const r = anchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  let top = r.bottom + 6; if(top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
  let left = r.right - w; left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
  pop.style.top = top+'px'; pop.style.left = left+'px';
  anchor.__pkOpen = true; anchor.setAttribute('aria-expanded','true');
  const first = pop.querySelector('button'); if(first) first.focus({preventScroll:true});
  function close(){ pop.remove(); anchor.__pkOpen=false; anchor.setAttribute('aria-expanded','false');
    document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', esc, true);
    window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close); }
  function outside(e){ if(!pop.contains(e.target) && !anchor.contains(e.target)) close(); }
  function esc(e){ if(e.key==='Escape'){ close(); anchor.focus(); } }
  setTimeout(()=>{ document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', esc, true);
    window.addEventListener('scroll', close, true); window.addEventListener('resize', close); }, 0);
}
/* بطاقات المؤشرات — [{k,l,v,s,ic,c,b}] */
function pkKpisHtml(list, activeKey, attr){
  return `<section class="pk-kpis">${list.map(k=>`<button type="button" class="pk-kpi${activeKey===k.k?' on':''}" ${attr||'data-kpi'}="${escapeHtml(k.k)}"
      style="--kc:${k.c};--kb:${k.b};" aria-pressed="${activeKey===k.k}" title="${escapeHtml(k.t||('عرض: '+k.l))}">
      <span class="ic">${icon(k.ic,20)}</span>
      <span class="tx"><span class="v">${k.v}</span><span class="l">${escapeHtml(k.l)}</span>${k.s?`<span class="s">${escapeHtml(k.s)}</span>`:''}</span>
    </button>`).join('')}</section>`;
}
const PK_KC = {
  all:{c:'var(--ds-teal)', b:'var(--ds-teal-l)'}, new:{c:'var(--ds-info)', b:'var(--ds-info-l)'},
  run:{c:'#0E7C86', b:'rgba(14,124,134,.12)'}, late:{c:'var(--ds-dan)', b:'var(--ds-dan-l)'},
  done:{c:'var(--ds-ok)', b:'var(--ds-ok-l)'}, off:{c:'var(--ds-warn)', b:'var(--ds-warn-l)'},
  gold:{c:'var(--ds-gold-d)', b:'var(--ds-gold-l)'}
};
/* ترقيم الصفحات */
function pkPagerHtml(total, page, per, sizes){
  const pages = Math.max(1, Math.ceil(total/per));
  page = Math.min(Math.max(1,page), pages);
  const a = total ? (page-1)*per+1 : 0, b = Math.min(total, page*per);
  const nums = [];
  for(let i=1;i<=pages;i++){ if(i===1 || i===pages || Math.abs(i-page)<=1) nums.push(i); else if(nums[nums.length-1]!=='…') nums.push('…'); }
  return `<div class="pk-pager">
    <span class="info">عرض <b>${a}–${b}</b> من <b>${total}</b> ${total===1?'سجل':'سجلًا'}</span>
    <span class="pg">
      <select data-pgper aria-label="عدد السجلات في الصفحة">${(sizes||[10,25,50,100]).map(n=>`<option value="${n}" ${n===per?'selected':''}>${n} / صفحة</option>`).join('')}</select>
      <button type="button" data-pg="${page-1}" ${page<=1?'disabled':''} aria-label="الصفحة السابقة">${icon('chevronRight',14)}</button>
      ${nums.map(n=>n==='…'?'<i>…</i>':`<button type="button" data-pg="${n}" class="${n===page?'on':''}" aria-label="صفحة ${n}">${n}</button>`).join('')}
      <button type="button" data-pg="${page+1}" ${page>=pages?'disabled':''} aria-label="الصفحة التالية">${icon('chevronLeft',14)}</button>
    </span></div>`;
}
function pkBindPager(box, onPage, onPer){
  box.querySelectorAll('[data-pg]').forEach(b=>b.onclick=()=>onPage(Number(b.dataset.pg)));
  const s = box.querySelector('[data-pgper]'); if(s) s.onchange=()=>onPer(Number(s.value));
}
function pkStatePill(o){ const s = orderState(o, todayStr()); return `<span class="st st-${s.k}">${escapeHtml(s.l)}</span>`; }
/* قائمة إجراءات الفعالية الواحدة */
function orderRowMenu(anchor, id, after){
  const o = (state.orders||[]).find(x=>x.id===id); if(!o) return;
  const cancelled = (o.status||'active')==='cancelled';
  const done = typeof after==='function' ? after : ()=>{};
  pkMenu(anchor, [
    {hd:`أمر ${o.serial||''}`},
    {ic:'eye', l:'عرض التفاصيل', run:()=>viewOrderReadOnly(id)},
    {ic:'edit', l:'تعديل', run:()=>editOrder(id)},
    {ic:'checkCircle', l:'تقييم وإنجاز', run:()=>openEvaluationModal(id)},
    {ic:'clock', l:'ترحيل / تأجيل', run:()=>openPostponeModal(id)},
    {ic:'copy', l:'نسخ لتاريخ آخر', run:()=>duplicateOrder(id)},
    '-',
    {hd:'طباعة ومشاركة'},
    {ic:'school', l:'طباعة نسخة الجهة الطالبة', run:()=>printOrderSchoolCopy(id)},
    {ic:'clipboard', l:'طباعة نسخة الإدارة', run:()=>printOrderAdminCopy(id)},
    {ic:'phone', l:'إرسال بالواتساب', run:()=>shareOrderWhatsApp(id)},
    {ic:'mail', l:'إرسال بالبريد', run:()=>emailOrder(id)},
    {ic:'qr', l:'رمز QR', run:()=>openQrCodeModal(id)},
    '-',
    {ic:cancelled?'refresh':'x', l:cancelled?'تراجع عن الإلغاء':'إلغاء الفعالية', run:()=>{ Promise.resolve(toggleCancelOrder(id)).then(done); }},
    {ic:'ban', l:'إلغاء الطلب (يبقى برقمه)', danger:true, run:()=>{ Promise.resolve(deleteOrder(id)).then(done); }},
  ]);
}
function otblSyncBar(containerId){
  const set = __orderTableSelections[containerId] || new Set();
  const bar = document.getElementById(containerId+'_toolbar');
  if(bar){
    bar.classList.toggle('has-sel', set.size>0);
    const c = bar.querySelector('.cnt'); if(c) c.textContent = `تم تحديد ${set.size} ${set.size===1?'طلب':'طلبات'}`;
    bar.querySelectorAll('.single-only').forEach(b=>{ b.disabled = set.size!==1; });
    bar.querySelectorAll('button.multi-ok').forEach(b=>{ b.disabled = set.size<1; });
    const select = bar.querySelector('.bulk-status-select'); if(select) select.disabled = set.size<1;
  }
  const cont = document.getElementById(containerId);
  if(cont) cont.querySelectorAll('.otbl-check').forEach(cb=>{ const tr = cb.closest('tr'); if(tr) tr.classList.toggle('sel', cb.checked); });
}
function ordersTableHtml(list, containerId, opts){
  containerId = containerId || ('otbl_'+uid());
  opts = opts || {};
  if(!list.length) return `<div class="pk-empty">${icon('inbox',34)}لا توجد طلبات مطابقة</div>`;
  const per = opts.per || list.length, page = opts.page || 1;
  const rows = list.slice((page-1)*per, page*per);
  const set = __orderTableSelections[containerId] || (__orderTableSelections[containerId] = new Set());
  const today = todayStr();
  const toolbar = `<div class="table-toolbar pk-selbar${set.size?' has-sel':''}" id="${containerId}_toolbar">
    <span class="cnt">تم تحديد ${set.size}</span>
    <select class="single-action-select single-only" id="${containerId}_actionSelect" ${set.size===1?'':'disabled'}
      onchange="otblActionFromSelect('${containerId}')" title="إجراء على الطلب المحدد (طلب واحد)">
      <option value="">إجراء على طلب واحد…</option>
      <option value="edit">تعديل</option>
      <option value="eval">تقييم وإنجاز</option>
      <option value="postpone">ترحيل / تأجيل</option>
      <option value="cancel">إلغاء / تراجع عن الإلغاء</option>
      <option value="qr">رمز QR</option>
      <option value="printSchool">طباعة نسخة الجهة الطالبة</option>
      <option value="printAdmin">طباعة نسخة الإدارة</option>
      <option value="whatsapp">إرسال بالواتساب</option>
      <option value="duplicate">نسخ الفعالية لتاريخ آخر</option>
      <option value="email">إرسال بالبريد</option>
      <option value="delete">حذف</option>
    </select>
    <select class="bulk-status-select" id="${containerId}_bulkStatus" ${set.size?'':'disabled'} title="تغيير حالة الإنجاز للمحدد">
      <option value="">تغيير حالة الإنجاز…</option>
      <option value="تم">تم الإنجاز</option>
      <option value="لم يتم">لم يتم الإنجاز</option>
      <option value="الغيت">أُلغيت</option>
      <option value="المشرف لا يرد">المشرف لا يرد</option>
    </select>
    <button class="pk-btn sm" type="button" onclick="otblBulkStatus('${containerId}')">${icon('check',14)} تطبيق</button>
    <span class="pk-sep"></span>
    <button class="icon-btn rect multi-ok" ${set.size?'':'disabled'} title="طباعة تقرير المحدد" aria-label="طباعة تقرير المحدد" onclick="otblPrintSelected('${containerId}')">${icon('printer',16)}</button>
    <button class="icon-btn rect multi-ok" ${set.size?'':'disabled'} title="تصدير المحدد Excel" aria-label="تصدير المحدد Excel" onclick="otblExportSelected('${containerId}')">${icon('sheet',16)}</button>
    <button class="icon-btn rect danger multi-ok" ${set.size?'':'disabled'} title="إلغاء المحدد (يبقى برقمه)" aria-label="إلغاء المحدد" onclick="otblBulkDelete('${containerId}')">${icon('ban',16)}</button>
    <button class="pk-btn sm" type="button" style="margin-inline-start:auto;" onclick="otblClearSel('${containerId}')">${icon('x',13)} إلغاء التحديد</button>
  </div>`;
  const allOn = rows.length && rows.every(o=>set.has(o.id));
  const table = `<table class="pk-tbl pk-eq"><thead><tr>
      <th class="chk"><input type="checkbox" class="otbl-check-all" title="تحديد كل الصفحة" aria-label="تحديد كل الصفحة" ${allOn?'checked':''} onchange="otblSelectAll('${containerId}', this)"></th>
      <th class="c c5">م</th><th class="eq w-ttl">الفعالية</th><th class="eq w-dt">التاريخ</th>
      <th class="c eq w-hr" title="المدة بالساعات">الساعات</th><th class="eq w-sc">الجهة</th><th class="eq w-tr">مقدم المبادرة</th><th class="eq w-st">الحالة</th><th class="c ac">إجراءات</th>
    </tr></thead><tbody>
  ${rows.map(o=>{
    const field = state.fields.find(f=>f.id===o.fieldId);
    const pt = state.programTypes.find(p=>p.id===o.programTypeId);
    const school = state.schools.find(s=>s.id===o.schoolId);
    const st = orderState(o, today);
    const end = orderEnd(o);
    const on = set.has(o.id);
    return `<tr class="${st.k==='draft'?'off ':''}${on?'sel':''}" data-oid="${o.id}">
      <td class="chk"><input type="checkbox" class="otbl-check" data-id="${o.id}" ${on?'checked':''} aria-label="تحديد الطلب ${o.serial}" onchange="otblSelect('${containerId}', this)"></td>
      <td class="c"><span class="pk-no">${o.serial}</span></td>
      <td class="pk-ttl"><b data-act="view" role="button" tabindex="0">${escapeHtml(o.title||'بلا عنوان')}</b>${seriesTag(o)}
        <small>${[pt&&pt.name, field&&field.name].filter(Boolean).map(escapeHtml).join(' · ')||'—'}</small></td>
      <td class="nw">${fmtDate(o.date)}${end&&end!==o.date?` <span class="pk-2nd" style="display:inline">— ${fmtDate(end)}</span>`:''}
        <span class="pk-2nd">${o.date?escapeHtml(dayNameOf(o.date)):''}${o.timeFrom?` · ${escapeHtml(o.timeFrom)}${o.timeTo?'–'+escapeHtml(o.timeTo):''}`:''}</span></td>
      <td class="c">${computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo)}</td>
      <td>${school?escapeHtml(school.name):'—'}${o.venue?`<span class="pk-2nd">${icon('mapPin',11)} ${escapeHtml(o.venue)}</span>`:''}</td>
      <td>${escapeHtml(trainerNames(o))||'—'}</td>
      <td class="nw">${`<span class="st st-${st.k}">${escapeHtml(st.l)}</span>`}</td>
      <td><div class="pk-acts">
        <button type="button" data-act="view" title="عرض" aria-label="عرض">${icon('eye',15)}</button>
        <button type="button" data-act="edit" title="تعديل" aria-label="تعديل">${icon('edit',15)}</button>
        <button type="button" data-act="eval" class="${o.completionStatus?'':'go'}" title="تقييم وإنجاز" aria-label="تقييم وإنجاز">${icon('checkCircle',15)}</button>
        <button type="button" data-act="more" title="مزيد من الإجراءات" aria-label="مزيد من الإجراءات" aria-haspopup="menu">${icon('more',15)}</button>
      </div></td>
    </tr>`;
  }).join('')}</tbody></table>`;
  return `${toolbar}<div id="${containerId}" class="pk-tblwrap">${table}</div>${opts.per?pkPagerHtml(list.length, page, per):''}`;
}
function otblClearSel(containerId){
  __orderTableSelections[containerId] = new Set();
  const cont = document.getElementById(containerId);
  if(cont){ cont.querySelectorAll('.otbl-check,.otbl-check-all').forEach(cb=>cb.checked=false); }
  otblSyncBar(containerId);
}
function bindOrdersTable(box, after){
  box.addEventListener('click', e=>{
    const b = e.target.closest('[data-act]'); if(!b || !box.contains(b)) return;
    const tr = b.closest('tr[data-oid]'); if(!tr) return;
    const id = tr.dataset.oid, a = b.dataset.act;
    if(a==='view') viewOrderReadOnly(id);
    else if(a==='edit') editOrder(id);
    else if(a==='eval') openEvaluationModal(id);
    else if(a==='more') orderRowMenu(b, id, after);
  });
  box.addEventListener('keydown', e=>{ if(e.key==='Enter' && e.target.matches('b[data-act="view"]')) e.target.click(); });
}
/* صفوف القائمة للطباعة والتصدير */
function orderRowsFor(list){
  return list.map(o=>{
    const sc = state.schools.find(x=>x.id===o.schoolId);
    const sv = sc ? (sc.supervisors||[]).find(x=>x.id===o.supervisorId) : null;
    const fd = state.fields.find(x=>x.id===o.fieldId);
    const pt = state.programTypes.find(x=>x.id===o.programTypeId);
    const trs = (o.trainerIds||[]).map(id=>{ const t=state.trainers.find(y=>y.id===id); return t?t.name:''; }).filter(Boolean).join('، ');
    const d1 = o.date, d2 = orderEnd(o);
    return [o.serial, o.title||'', (d2 && d2!==d1) ? `${fmtDate(d1)} — ${fmtDate(d2)}` : fmtDate(d1),
      o.timeFrom||'—', o.timeTo||'—', sc?sc.name:'—', sv&&sv.phone?sv.phone:'—', trs||'—', fd?fd.name:'—', pt?pt.name:'—',
      orderState(o, todayStr()).l];
  });
}
const ORD_LIST_HDR = [...SEL_HDR, 'الحالة'];
function ordPrintList(list, desc){
  if(!list.length){ toast('لا توجد طلبات في القائمة'); return; }
  const rows = orderRowsFor(list);
  doPrintDoc(buildReportDoc({
    titleAr:'قائمة طلبات الفعاليات والمبادرات',
    subtitle: desc || `${rows.length} ${eventWord(rows.length)}`,
    kpis:[{v:rows.length,l:'الفعاليات'},
          {v:list.filter(o=>o.completionStatus==='تم').length,l:'المكتملة'},
          {v:new Set(rows.map(r=>r[5]).filter(x=>x!=='—')).size,l:'الجهات'}],
    headers:ORD_LIST_HDR, tableClass:'sel-tbl',
    colWidths:['16mm','auto','28mm','14mm','14mm','42mm','22mm','36mm','26mm','26mm','22mm'],
    rows: rows.map(r=>r.map(v=>escapeHtml(String(v))))
  }), true, 'A4');
}
function ordExcelList(list, desc){
  if(!list.length){ toast('لا توجد طلبات في القائمة'); return; }
  exportToExcel('قائمة_الطلبات.xlsx', ORD_LIST_HDR, orderRowsFor(list),
    `قائمة طلبات الفعاليات والمبادرات (${list.length} ${eventWord(list.length)})${desc?' — '+desc:''}`);
}
function ordersTableHtmlPrint(list){
  if(!list.length) return `<div class="empty-state">لا توجد بيانات ضمن هذه المعايير</div>`;
  return `<table class="print-table"><thead><tr><th>م</th><th>العنوان</th><th>التاريخ</th><th>الوقت</th><th>المدرسة</th><th>مقدم المبادرة</th><th>الإنجاز</th></tr></thead><tbody>
  ${list.map(o=>{
    const school = state.schools.find(s=>s.id===o.schoolId);
    return `<tr><td>${o.serial}</td><td>${escapeHtml(o.title)}</td><td>${fullDateStr(o.date)}</td><td>${escapeHtml(fullTimeRange(o.timeFrom,o.timeTo))}</td>
      <td>${school?escapeHtml(school.name):''}</td><td>${trainerMiniTable(o)}</td><td>${doneBadge(o.completionStatus)}</td></tr>`;
  }).join('')}</tbody></table>`;
}

