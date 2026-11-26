/* ══════════════════════════════════════════════════════════════════
   نسخ فعالية لتاريخ آخر (قالب) — يحتفظ بكل البيانات ويغيّر التاريخ
   ══════════════════════════════════════════════════════════════════ */
function duplicateOrder(id){
  const src = state.orders.find(o=>o.id===id); if(!src) return;
  const span = Math.max(0, daysCount(src.date, orderEnd(src)) - 1);
  openModal('نسخ الفعالية: '+(src.title||''), [
    {name:'date', label:'تاريخ الفعالية الجديدة', type:'date', required:true},
    {name:'timeFrom', label:'من الساعة', type:'time'},
    {name:'timeTo', label:'إلى الساعة', type:'time'},
  ], async v=>{
    const clash = (src.trainerIds||[]).map(tid=>{
      const c = trainerConflictSingle(tid, v.date, v.timeFrom||src.timeFrom, v.timeTo||src.timeTo, null, addDaysISO(v.date, span));
      const t = state.trainers.find(x=>x.id===tid);
      return c ? `• ${t?t.name:''}: أمر ${c.serial} — ${c.title}` : '';
    }).filter(Boolean);
    if(clash.length && !confirm('تنبيه تضارب في التاريخ الجديد:\n\n'+clash.join('\n')+'\n\nمتابعة النسخ؟')) return false;
    const copy = JSON.parse(JSON.stringify(src));
    Object.assign(copy, {
      id: uid(), createdAt: Date.now(), serial: nextOrderSerial(),
      date: v.date, dateTo: addDaysISO(v.date, span),
      timeFrom: v.timeFrom || src.timeFrom, timeTo: v.timeTo || src.timeTo,
      status:'active', completionStatus:'', notDoneReason:'', supervisorRating:0, schoolRating:0,
      studentsRating:0, recommendSchool:'', evaluatedBy:'', evaluatedAt:undefined
    });
    ['postponedFrom','postponedFromTo','postponedFromTime','postponedAt','postponedHadClash'].forEach(k=>delete copy[k]);
    state.orders.push(copy);
    logAudit('duplicate', copy, `نسخة من أمر ${src.serial}`);
    await saveState();
    toast(`أُنشئ أمر التكليف ${copy.serial} بتاريخ ${fmtDateRaw(copy.date)}`);
    editOrder(copy.id);
  });
  setTimeout(()=>{
    const tf=document.getElementById('mf_timeFrom'); if(tf) tf.value=src.timeFrom||'';
    const tt=document.getElementById('mf_timeTo'); if(tt) tt.value=src.timeTo||'';
  },0);
}

/* ══════════════════════════════════════════════════════════════════
   إرسال أمر التكليف بالواتساب — رسالة جاهزة للمشرف أو المقدّم
   ══════════════════════════════════════════════════════════════════ */
function waNumber(phone){
  const d = String(phone||'').replace(/\D/g,'').replace(/^0+/,'');
  if(!d) return '';
  return d.length <= 8 ? '974' + d : d;
}
function orderWhatsAppText(o, who){
  const sc = state.schools.find(x=>x.id===o.schoolId);
  const sv = sc ? (sc.supervisors||[]).find(x=>x.id===o.supervisorId) : null;
  const trs = (o.trainerIds||[]).map(id=>state.trainers.find(t=>t.id===id)).filter(Boolean);
  const d1 = fmtDateRaw(o.date), d2 = fmtDateRaw(orderEnd(o));
  const L = [];
  L.push(`السلام عليكم ورحمة الله${who?` ${who}`:''}،`);
  L.push('');
  L.push(`*أمر تكليف رقم ${o.serial}*`);
  L.push(`📌 ${o.title||''}`);
  L.push(`📅 ${dayNameOf(o.date)} ${d1}${d2!==d1?` — ${dayNameOf(orderEnd(o))} ${d2}`:''}`);
  if(o.timeFrom||o.timeTo) L.push(`⏰ من ${o.timeFrom||'—'} إلى ${o.timeTo||'—'}`);
  if(sc) L.push(`🏫 ${sc.name}`);
  if(o.venue) L.push(`📍 مكان التنفيذ: ${o.venue}`);
  if(o.participantsCount) L.push(`👥 عدد المستهدفين: ${o.participantsCount}`);
  if(sv) L.push(`👤 المشرف: ${sv.name}${sv.phone?` — ${sv.phone}`:''}`);
  if(trs.length) L.push(`🎤 مقدّم المبادرة: ${trs.map(t=>t.phone?`${t.name} (${t.phone})`:t.name).join('، ')}`);
  L.push('');
  L.push(((state.printHeader&&state.printHeader.line2)||state.orgName||''));
  return L.join('\n');
}
function shareOrderWhatsApp(id){
  const o = state.orders.find(x=>x.id===id); if(!o) return;
  const sc = state.schools.find(x=>x.id===o.schoolId);
  const sv = sc ? (sc.supervisors||[]).find(x=>x.id===o.supervisorId) : null;
  const people = [];
  if(sv) people.push({role:'المشرف', name:sv.name, phone:sv.phone});
  (o.trainerIds||[]).map(i=>state.trainers.find(t=>t.id===i)).filter(Boolean)
    .forEach(t=>people.push({role:'مقدّم المبادرة', name:t.name, phone:t.phone}));
  const body = `
    <div class="helper" style="margin-bottom:10px;">اختر المستلم لتُفتح محادثة واتساب برسالة جاهزة بتفاصيل أمر التكليف.</div>
    <div style="display:flex;flex-direction:column;gap:7px;">
      ${people.map((p,i)=>`<button type="button" class="wa-pick" data-i="${i}" ${p.phone?'':'disabled'}>
          <span class="wa-ic">${waIcon(18)}</span>
          <span style="flex:1;min-width:0;text-align:right;"><b>${escapeHtml(p.name)}</b>
            <i>${escapeHtml(p.role)}${p.phone?` · ${escapeHtml(p.phone)}`:' · لا يوجد رقم'}</i></span>
        </button>`).join('')}
      <button type="button" class="wa-pick" data-i="any">
        <span class="wa-ic">${icon('message',18)}</span>
        <span style="flex:1;text-align:right;"><b>مستلم آخر</b><i>اختر جهة الاتصال من واتساب</i></span>
      </button>
      <button type="button" class="wa-pick" data-i="copy">
        <span class="wa-ic">${icon('copy',18)}</span>
        <span style="flex:1;text-align:right;"><b>نسخ نص الرسالة</b><i>للصقه في أي تطبيق</i></span>
      </button>
    </div>`;
  showInfoModal(`إرسال أمر التكليف ${o.serial} بالواتساب`, body, box=>{
    box.style.maxWidth='460px';
    box.querySelectorAll('.wa-pick').forEach(b=>{
      b.onclick = async ()=>{
        const i = b.dataset.i;
        if(i==='copy'){
          try{ await navigator.clipboard.writeText(orderWhatsAppText(o)); toast('نُسخ نص الرسالة'); }
          catch(e){ toast('تعذّر النسخ'); }
          return;
        }
        const p = i==='any' ? null : people[Number(i)];
        const txt = encodeURIComponent(orderWhatsAppText(o, p ? p.name : ''));
        const url = p ? `https://wa.me/${waNumber(p.phone)}?text=${txt}` : `https://wa.me/?text=${txt}`;
        window.open(url, '_blank');
        closeModal();
      };
    });
  });
}

/* ══════════════════════════════════════════════════════════════════
   البحث الشامل — Ctrl+K (أو ⌘K) من أي صفحة
   ══════════════════════════════════════════════════════════════════ */
function renderSearchBtn(){
  const host = document.getElementById('topbarActions'); if(!host) return;
  const b = document.createElement('button');
  b.className = 'cmdk-trigger'; b.type='button';
  b.title = 'بحث شامل (Ctrl+K)'; b.setAttribute('aria-label','بحث شامل');
  b.innerHTML = `${icon('search',15)}<span>ابحث في النظام</span><kbd>Ctrl K</kbd>`;
  b.onclick = openCommandPalette;
  host.appendChild(b);
}
function openCommandPalette(){
  if(!currentRole || document.getElementById('cmdkScrim')) return;
  const scrim = document.createElement('div'); scrim.id='cmdkScrim'; scrim.className='cmdk-scrim';
  scrim.innerHTML = `<div class="cmdk" role="dialog" aria-modal="true" aria-label="بحث شامل">
    <div class="cmdk-in">${icon('search',18)}
      <input id="cmdkQ" placeholder="ابحث عن فعالية برقمها أو عنوانها، جهة، مقدّم مبادرة، أو صفحة..." autocomplete="off">
      <kbd>Esc</kbd></div>
    <div class="cmdk-list" id="cmdkList"></div>
    <div class="cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd> تنقّل</span><span><kbd>Enter</kbd> فتح</span><span><kbd>Esc</kbd> إغلاق</span></div>
  </div>`;
  document.body.appendChild(scrim);
  const q = scrim.querySelector('#cmdkQ'), list = scrim.querySelector('#cmdkList');
  let items = [], sel = 0;
  const close = ()=>{ scrim.remove(); document.removeEventListener('keydown', onKey, true); };
  function build(){
    const t = q.value.trim(), nq = _mzNz(t);
    const res = [];
    const pages = visiblePages().filter(p=>!t || _mzNz(p.label).includes(nq));
    pages.slice(0, t?6:8).forEach(p=>res.push({grp:'الصفحات', ic:icon(p.icon,16), t:p.label, s:'', run:()=>{ currentPage=p.id; render(); }}));
    if(t){
      const orders = (state.orders||[]).filter(o=>{
        if(String(o.serial)===t || String(o.serial).startsWith(t)) return true;
        const sc = state.schools.find(x=>x.id===o.schoolId);
        const tn = (o.trainerIds||[]).map(id=>{const x=state.trainers.find(y=>y.id===id);return x?x.name:'';}).join(' ');
        return _mzNz(`${o.title} ${sc?sc.name:''} ${tn}`).includes(nq);
      }).sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,8);
      orders.forEach(o=>{
        const sc = state.schools.find(x=>x.id===o.schoolId);
        res.push({grp:'الفعاليات', ic:icon('fileText',16), t:`${o.serial} — ${o.title||''}`,
          s:`${fmtDateRaw(o.date)}${sc?' · '+sc.name:''}`, run:()=>viewOrderReadOnly(o.id)});
      });
      (state.schools||[]).filter(s=>_mzNz(s.name).includes(nq)).slice(0,5).forEach(s=>{
        const n = state.orders.filter(o=>o.schoolId===s.id).length;
        res.push({grp:'الجهات', ic:icon('school',16), t:s.name, s:`${n} ${eventWord(n)}`, run:()=>openSchoolProfile(s.id)});
      });
      (state.trainers||[]).filter(x=>_mzNz(x.name).includes(nq) || String(x.phone||'').includes(t)).slice(0,5).forEach(x=>{
        const n = state.orders.filter(o=>(o.trainerIds||[]).includes(x.id)).length;
        res.push({grp:'مقدّمو المبادرات', ic:icon('users',16), t:x.name, s:`${x.phone||''}${x.phone?' · ':''}${n} ${eventWord(n)}`, run:()=>openTrainerProfile(x.id)});
      });
    }
    res.push({grp:'إجراءات', ic:icon('filePlus',16), t:'إنشاء طلب فعالية جديد', s:'', run:()=>{ currentPage='newOrder'; editingOrderId=null; render(); }});
    items = res; sel = 0; draw();
  }
  function draw(){
    if(!items.length){ list.innerHTML = `<div class="cmdk-empty">لا توجد نتائج</div>`; return; }
    let html = '', g = '';
    items.forEach((it,i)=>{
      if(it.grp!==g){ g = it.grp; html += `<div class="cmdk-grp">${escapeHtml(g)}</div>`; }
      html += `<button type="button" class="cmdk-it${i===sel?' on':''}" data-i="${i}">
        <span class="cmdk-ic">${it.ic}</span><span class="cmdk-t">${escapeHtml(it.t)}</span>
        ${it.s?`<span class="cmdk-s">${escapeHtml(it.s)}</span>`:''}</button>`;
    });
    list.innerHTML = html;
    list.querySelectorAll('.cmdk-it').forEach(b=>{
      b.onclick = ()=>{ const it = items[Number(b.dataset.i)]; close(); it.run(); };
      b.onmousemove = ()=>{ if(sel!==Number(b.dataset.i)){ sel=Number(b.dataset.i); mark(); } };
    });
  }
  function mark(){
    list.querySelectorAll('.cmdk-it').forEach(b=>b.classList.toggle('on', Number(b.dataset.i)===sel));
    const on = list.querySelector('.cmdk-it.on'); if(on) on.scrollIntoView({block:'nearest'});
  }
  function onKey(e){
    if(e.key==='Escape'){ e.preventDefault(); close(); }
    else if(e.key==='ArrowDown'){ e.preventDefault(); sel = Math.min(items.length-1, sel+1); mark(); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); sel = Math.max(0, sel-1); mark(); }
    else if(e.key==='Enter' && items[sel]){ e.preventDefault(); const it=items[sel]; close(); it.run(); }
  }
  document.addEventListener('keydown', onKey, true);
  scrim.onclick = e=>{ if(e.target===scrim) close(); };
  q.addEventListener('input', build);
  build(); setTimeout(()=>q.focus(), 20);
}
function openOrdersFiltered(text){
  currentPage='ordersList'; render();
  setTimeout(()=>{
    const el = document.getElementById('ord_listFind');
    if(el){ el.value = text; el.dispatchEvent(new Event('input')); el.focus(); }
  }, 30);
}
document.addEventListener('keydown', e=>{
  if((e.ctrlKey||e.metaKey) && (e.key==='k' || e.key==='K' || e.key==='ك')){ e.preventDefault(); openCommandPalette(); }
});


/* ══════════════════════════════════════════════════════════════════
   مركز الإعدادات — القوائم، الموافقات، بوابة المقدّم، سجل التعديلات
   ══════════════════════════════════════════════════════════════════ */
function renderSettingsHub(c){
  const pending = state.trainerRequests.filter(r=>r.status==='pending').length;
  const tabs = currentRole==='admin'
    ? [['lists','القوائم والبيانات','settings',0],['approvals','الموافقات','checkCircle',pending],
       ['targets','المستهدفات السنوية','flag',0],['occasions','تقويم المناسبات','calendar',0],['portal','بوابة مقدّم الفعالية','users',0],['audit','سجل التعديلات','history',0],['security','الأمان','shield',0]]
    : [['portal','بوابة مقدّم الفعالية','users',0],['occasions','تقويم المناسبات','calendar',0]];
  if(!tabs.find(t=>t[0]===settingsTab)) settingsTab = tabs[0][0];
  c.innerHTML = `<div class="hub-tabs" role="tablist">
      ${tabs.map(t=>`<button type="button" role="tab" class="hub-tab${t[0]===settingsTab?' on':''}" data-hub="${t[0]}" aria-selected="${t[0]===settingsTab}">
        ${icon(t[2],16)}<span>${escapeHtml(t[1])}</span>${t[3]?`<em>${t[3]}</em>`:''}</button>`).join('')}
    </div><div id="hubBody"></div>`;
  const body = c.querySelector('#hubBody');
  if(settingsTab==='lists') renderSettingsPage(body);
  else if(settingsTab==='approvals') renderApprovalsPage(body);
  else if(settingsTab==='portal') renderTrainerPortalPage(body);
  else if(settingsTab==='audit') body.innerHTML = auditCardHtml();
  else if(settingsTab==='targets') renderTargetsEditor(body);
  else if(settingsTab==='security') renderSecurityTab(body);
  else if(settingsTab==='occasions') renderOccasionsTab(body);
  c.querySelectorAll('[data-hub]').forEach(b=>b.onclick=()=>{ settingsTab=b.dataset.hub; render(); });
}

/* ══════════════════════════════════════════════════════════════════
   الفعاليات الأسبوعية المتكررة (المصلى المتنقل وأمثاله)
   كل موعد أمر تكليف مستقل (له رقمه وتقييمه ومستفيدوه)، وتجمعها سلسلة واحدة
   ══════════════════════════════════════════════════════════════════ */
function seriesTag(o){
  return o && o.seriesId ? ` <span class="series-tag" title="سلسلة أسبوعية — الموعد ${o.seriesIndex||'?'} من ${o.seriesTotal||'?'}">${icon('refresh',11)} ${o.seriesIndex||''}/${o.seriesTotal||''}</span>` : '';
}
function openRecurringPreview(base, until, printMode){
  const span = Math.max(0, daysCount(base.date, base.dateTo) - 1);
  const dates = [];
  for(let d = base.date; d <= until && dates.length < 60; d = addDaysISO(d, 7)) dates.push(d);
  if(dates.length < 2){ toast('التكرار يحتاج موعدين على الأقل — مدّد تاريخ الانتهاء'); return; }
  const info = dates.map(d=>{
    const end = addDaysISO(d, span), notes = [];
    const cf = anyTrainerConflict(base.trainerIds, d, base.timeFrom, base.timeTo, null, end);
    if(cf){ const t = state.trainers.find(x=>x.id===cf.trainerId); notes.push({k:'dan', t:`${t?t.name:'مقدّم'} مشغول (أمر ${cf.order.serial})`}); }
    checkAcademicDate(d, end).forEach(a=>notes.push({k: a.level==='block'?'dan':'warn', t:a.msg}));
    (base.trainerIds||[]).forEach(tid=>{ const lv = trainerLeaveOn(tid, d, end); if(lv){ const t=state.trainers.find(x=>x.id===tid); notes.push({k:'dan', t:`${t?t.name:'مقدّم'} في إجازة`}); } });
    resourceConflicts(base.resourceIds||[], d, end, null).forEach(x=>notes.push({k:'dan', t:`${x.res.name} محجوز (أمر ${x.order.serial})`}));
    const sd = schoolSameDay(base.schoolId, d, null);
    if(sd) notes.push({k:'warn', t:`فعالية أخرى بالجهة (أمر ${sd.serial})`});
    return {d, end, notes, on: !notes.some(n=>n.k==='dan')};
  });
  /* تنبيه يتكرر على كل المواعيد يُعرض مرة واحدة أعلى القائمة */
  const shortN = t => { const a = String(t).replace(/[\u2066-\u2069\u200e\u200f]/g,'').split(' — ')[0]; return a.length>70 ? a.slice(0,68)+'…' : a; };
  const freq = {};
  info.forEach(x=>{ new Set(x.notes.filter(n=>n.k!=='dan').map(n=>shortN(n.t))).forEach(k=>freq[k]=(freq[k]||0)+1); });
  const common = Object.keys(freq).filter(k=>freq[k] > info.length/2).map(k=>{
    const src = info.flatMap(x=>x.notes).find(n=>shortN(n.t)===k); return {k:src.k, t:k, n:freq[k]}; });
  info.forEach(x=>{ x.notes = x.notes.filter(n=>!common.some(c=>c.t===shortN(n.t))); });
  const body = `
    <div class="helper" style="margin-bottom:10px;">
      «${escapeHtml(base.title)}» كل يوم <b>${dayNameOf(base.date)}</b> من ${fmtDateRaw(base.date)} إلى ${fmtDateRaw(until)}.
      ألغِ تحديد أي موعد لا تريده (إجازة، اختبارات…). المواعيد المتعارضة مُلغاة التحديد تلقائيًا.</div>
    ${common.map(n=>`<div class="rep-banner ${n.k}">${icon('info',14)} <span>${escapeHtml(n.t)} <b>(${n.n} من ${info.length} مواعيد)</b></span></div>`).join('')}
    <div class="rep-list">
      ${info.map((x,i)=>`<label class="rep-row${x.on?'':' off'}">
        <input type="checkbox" data-i="${i}" ${x.on?'checked':''}>
        <span class="rep-n">${i+1}</span>
        <span class="rep-d">${dayNameOf(x.d)} <b>${fmtDateRaw(x.d)}</b>${x.end!==x.d?` — ${fmtDateRaw(x.end)}`:''}</span>
        <span class="rep-notes">${x.notes.map(n=>`<span class="rep-note ${n.k}" title="${escapeHtml(n.t)}">${escapeHtml(shortN(n.t))}</span>`).join('') || '<span class="rep-note ok">متاح</span>'}</span>
      </label>`).join('')}
    </div>
    <div class="rep-foot">
      <span id="repCount"></span>
      <button class="btn btn-primary" id="repCreate">${icon('plus',15)} إنشاء أوامر التكليف</button>
    </div>`;
  showInfoModal(`${icon('refresh',17)} مراجعة مواعيد الفعالية الأسبوعية`, body, box=>{
    box.style.maxWidth = '640px';
    const cbs = Array.from(box.querySelectorAll('.rep-list input'));
    const cnt = box.querySelector('#repCount'), btn = box.querySelector('#repCreate');
    const upd = ()=>{ const n = cbs.filter(c=>c.checked).length;
      cnt.innerHTML = `سيُنشأ <b>${n}</b> أمر تكليف`; btn.disabled = n<1;
      cbs.forEach(c=>c.closest('.rep-row').classList.toggle('off', !c.checked)); };
    cbs.forEach(c=>c.onchange = upd); upd();
    btn.onclick = async ()=>{
      const chosen = cbs.filter(c=>c.checked).map(c=>info[Number(c.dataset.i)]);
      const seriesId = uid(), made = [];
      chosen.forEach((x,i)=>{
        const o = JSON.parse(JSON.stringify(base));
        Object.assign(o, { id: uid(), createdAt: Date.now(), serial: nextOrderSerial(),
          date: x.d, dateTo: x.end, seriesId, seriesIndex: i+1, seriesTotal: chosen.length,
          completionStatus:'', notDoneReason:'', supervisorRating:0, schoolRating:0, studentsRating:0,
          recommendSchool:'', evaluatedBy:'', status:'active' });
        state.orders.push(o); made.push(o);
      });
      logAudit('series', made[0], `${made.length} موعدًا كل ${dayNameOf(base.date)} — الأوامر ${made[0].serial} إلى ${made[made.length-1].serial}`, true);
      await saveState(); clearOrderDraft();
      closeModal();
      toast(`أُنشئ ${made.length} أمر تكليف (${made[0].serial} – ${made[made.length-1].serial})`);
      if(document.getElementById('orderDrawer')) closeOrderDrawer(true);
      editingOrderId = null; currentPage = 'ordersList'; render();
      if(printMode==='school') setTimeout(()=>printOrderSchoolCopy(made[0].id), 150);
      else if(printMode==='admin') setTimeout(()=>printOrderAdminCopy(made[0].id), 150);
    };
  });
}
function showSeries(seriesId){
  const list = state.orders.filter(o=>o.seriesId===seriesId).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  if(!list.length) return;
  const today = todayStr();
  const body = `<div class="rep-list">
    ${list.map(o=>`<button type="button" class="rep-row as-btn${o.status==='cancelled'?' off':''}" data-id="${o.id}">
      <span class="rep-n">${o.seriesIndex||''}</span>
      <span class="rep-d">${dayNameOf(o.date)} <b>${fmtDateRaw(o.date)}</b> · أمر ${o.serial}</span>
      <span class="rep-notes">${o.status==='cancelled' ? '<span class="rep-note dan">ملغاة</span>'
        : o.completionStatus==='تم' ? '<span class="rep-note ok">منجزة</span>'
        : (o.date < today ? '<span class="rep-note warn">بلا تقييم</span>' : '<span class="rep-note">قادمة</span>')}</span>
    </button>`).join('')}</div>`;
  showInfoModal(`${icon('refresh',17)} ${escapeHtml(list[0].title)} — ${list.length} موعدًا`, body, box=>{
    box.style.maxWidth='560px';
    box.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{ closeModal(); setTimeout(()=>viewOrderReadOnly(b.dataset.id),60); });
  });
}
async function cancelSeriesFrom(id){
  const o = state.orders.find(x=>x.id===id); if(!o || !o.seriesId) return;
  const rest = state.orders.filter(x=>x.seriesId===o.seriesId && (x.date||'') >= (o.date||'') && x.status!=='cancelled' && x.completionStatus!=='تم');
  if(!rest.length){ toast('لا توجد مواعيد قادمة قابلة للإلغاء'); return; }
  if(!confirm(`سيُلغى ${rest.length} موعدًا من ${fmtDateRaw(o.date)} فما بعد.\nتبقى مسجّلة بحالة «ملغاة» ويمكن التراجع عن كل موعد منفردًا.\n\nمتابعة؟`)) return;
  rest.forEach(x=>{ markCancelled(x, 'ضمن إلغاء بقية السلسلة'); logAudit('cancel', x, 'ضمن إلغاء بقية السلسلة', true); });
  await saveState(); toast(`أُلغي ${rest.length} موعدًا`); render();
}


/* ══════════════════════════════════════════════════════════════════
   الموارد التي تُحجز (المصلى المتنقل وأمثاله) — حجز يوم كامل
   ══════════════════════════════════════════════════════════════════ */
function resourceConflicts(resIds, date, dateTo, excludeId){
  const out = []; if(!resIds || !resIds.length || !date) return out;
  const dTo = dateTo || date;
  resIds.forEach(rid=>{
    const res = (state.resources||[]).find(r=>r.id===rid); if(!res) return;
    const x = state.orders.find(o=> o.id!==excludeId && isLiveOrder(o) && (o.resourceIds||[]).includes(rid)
      && o.date && dateRangesOverlap(date, dTo, o.date, orderEnd(o)));
    if(x) out.push({res, order:x});
  });
  return out;
}
function quickAddResource(){
  openModal('إضافة مورد يُحجز', [{name:'name', label:'اسم المورد (مثل: المصلى المتنقل)', required:true}], async v=>{
    const name = (v.name||'').trim(); if(!name) return false;
    state.resources = state.resources || [];
    if(state.resources.some(x=>x.name===name)){ toast('المورد موجود مسبقًا'); return false; }
    state.resources.push({id:uid(), name}); await saveState(); toast('تمت إضافة المورد'); render();
  });
}
function formBenef(){
  const g = k => Number((document.getElementById(k)||{}).value)||0;
  const b = {students:g('f_bStudents'), teachers:g('f_bTeachers'), parents:g('f_bParents'), others:g('f_bOthers')};
  const any = Object.values(b).some(Boolean);
  return { benef: any ? b : null, gender: (document.getElementById('f_bGender')||{}).value || '' };
}
/* جدول تفصيل المستفيدين لمجموعة فعاليات (يظهر فقط إن وُجد تفصيل) */
function benefBlock(list, forPrint){
  const withB = list.filter(o=>o.benef || o.gender);
  if(!withB.length) return '';
  const T = {students:0, teachers:0, parents:0, others:0}; const G = {};
  withB.forEach(o=>{ if(o.benef) Object.keys(T).forEach(k=>T[k]+=Number(o.benef[k])||0);
    if(o.gender) G[o.gender] = (G[o.gender]||0) + (Number(o.participantsCount)||0); });
  const cells = [['الطلاب',T.students],['المعلمون',T.teachers],['أولياء الأمور',T.parents],['آخرون',T.others]]
    .concat(Object.entries(G).map(([g,n])=>[`فعاليات ${g}`, n]));
  const th = forPrint ? `style="background:${PRINT_THEME};color:#fff;padding:1.5mm;border:1px solid ${PRINT_LINE_COLOR};font-size:9pt;"` : '';
  const td = forPrint ? `style="padding:1.5mm;border:1px solid ${PRINT_LINE_COLOR};text-align:center;font-weight:700;"` : '';
  return `<div class="${forPrint?'':'benef-sum'}" style="margin-top:${forPrint?'4mm':'14px'};">
    <div style="font-weight:800;font-size:${forPrint?'10pt':'13px'};margin-bottom:6px;">تفصيل المستفيدين <span style="font-weight:400;font-size:.85em;color:#666;">(من ${withB.length} ${eventWord(withB.length)} فيها تفصيل)</span></div>
    <table style="width:100%;border-collapse:collapse;"><thead><tr>${cells.map(c=>`<th ${th}>${escapeHtml(c[0])}</th>`).join('')}</tr></thead>
    <tbody><tr>${cells.map(c=>`<td ${td}>${c[1]}</td>`).join('')}</tr></tbody></table></div>`;
}

/* ══════════════════════════════════════════════════════════════════
   السنة الدراسية + المستهدفات السنوية لكل مجال
   ══════════════════════════════════════════════════════════════════ */
function acadYearOf(iso){
  if(!iso) return '';
  const y = Number(iso.slice(0,4)), m = Number(iso.slice(5,7));
  return m >= 8 ? `${y}-${y+1}` : `${y-1}-${y}`;
}
function acadYearLabel(k){ return k ? k.replace('-', '/') : ''; }
function acadYearRange(k){ const [a,b] = k.split('-'); return {start:`${a}-08-01`, end:`${b}-07-31`}; }
function targetOf(year, fieldId){ const t = (state.targets||[]).find(x=>x.id===`${year}|${fieldId}`); return t ? Number(t.target)||0 : 0; }
function targetsProgress(year){
  const yr = acadYearRange(year);
  const live = state.orders.filter(o=>isLiveOrder(o) && o.date && o.date>=yr.start && o.date<=yr.end && o.completionStatus!=='الغيت');
  return (state.fields||[]).map(f=>{
    const l = live.filter(o=>o.fieldId===f.id);
    const done = l.filter(o=>o.completionStatus==='تم').length;
    const target = targetOf(year, f.id);
    return {id:f.id, name:f.name, target, done, planned:l.length-done, total:l.length,
      pct: target ? Math.round(done/target*100) : null,
      people: l.filter(o=>o.completionStatus==='تم').reduce((s,o)=>s+(Number(o.participantsCount)||0),0)};
  });
}
function progressBarHtml(r){
  if(!r.target) return `<span class="helper">لا مستهدف</span>`;
  const d = Math.min(100, r.done/r.target*100), p = Math.min(100-d, r.planned/r.target*100);
  return `<div class="tg-bar" title="منجزة ${r.done} · مجدولة ${r.planned} · المستهدف ${r.target}">
    <i class="d" style="width:${d}%"></i><i class="p" style="width:${p}%"></i></div>`;
}
function yearOptions(sel){
  const set = new Set([acadYearOf(todayStr())]);
  state.orders.forEach(o=>{ if(o.date) set.add(acadYearOf(o.date)); });
  (state.targets||[]).forEach(t=>set.add(t.year));
  const cur = acadYearOf(todayStr()); const [a] = cur.split('-').map(Number); set.add(`${a+1}-${a+2}`);
  return Array.from(set).filter(Boolean).sort().reverse().map(y=>`<option value="${y}" ${y===sel?'selected':''}>${acadYearLabel(y)}${y===cur?' (الحالية)':''}</option>`).join('');
}
let targetsYear = '';
function renderTargetsEditor(c){
  if(!targetsYear) targetsYear = acadYearOf(todayStr());
  const rows = targetsProgress(targetsYear);
  c.innerHTML = `<div class="card">
    <h2>${icon('flag',15)} المستهدفات السنوية لكل مجال
      <select id="tg_year" style="width:auto;">${yearOptions(targetsYear)}</select></h2>
    <div class="helper" style="margin-bottom:10px;">حدّد عدد الفعاليات المستهدف لكل مجال في السنة الدراسية (من أغسطس إلى يوليو). يُحسب المنجز من الفعاليات المقيّمة «تم»، ويظهر المجدول بلون أفتح. يظهر التقدّم في الصفحة الرئيسية وفي تقرير «المستهدفات السنوية».</div>
    <table class="set-table tg-tbl"><thead><tr><th style="text-align:right;">المجال</th><th style="width:120px;">المستهدف</th><th>المنجزة</th><th>المجدولة</th><th style="width:34%;">التقدّم</th><th>النسبة</th></tr></thead>
    <tbody>${rows.map(r=>`<tr><td style="text-align:right;font-weight:700;">${escapeHtml(r.name)}</td>
      <td><input type="number" min="0" lang="en" class="num tg-in" data-f="${r.id}" value="${r.target||''}" style="width:90px;text-align:center;"></td>
      <td>${r.done}</td><td>${r.planned}</td><td>${progressBarHtml(r)}</td>
      <td><b class="tg-pct ${r.pct===null?'':r.pct>=100?'ok':r.pct>=60?'mid':'low'}">${r.pct===null?'—':r.pct+'%'}</b></td></tr>`).join('')}</tbody></table>
    <div style="margin-top:12px;"><button class="btn btn-primary" id="tg_save">${icon('save',15)} حفظ المستهدفات</button></div>
  </div>`;
  c.querySelector('#tg_year').onchange = e=>{ targetsYear = e.target.value; renderTargetsEditor(c); };
  c.querySelector('#tg_save').onclick = async ()=>{
    state.targets = state.targets || [];
    c.querySelectorAll('.tg-in').forEach(inp=>{
      const id = `${targetsYear}|${inp.dataset.f}`, v = Number(inp.value)||0;
      const ex = state.targets.find(x=>x.id===id);
      if(v){ if(ex) ex.target = v; else state.targets.push({id, year:targetsYear, fieldId:inp.dataset.f, target:v}); }
      else if(ex) state.targets = state.targets.filter(x=>x.id!==id);
    });
    await saveState(); toast('حُفظت المستهدفات'); renderTargetsEditor(c);
  };
}
function appendHomeTargets(c){
  const year = acadYearOf(todayStr());
  const rows = targetsProgress(year).filter(r=>r.target).sort((a,b)=>(b.pct||0)-(a.pct||0));
  if(!rows.length) return;
  const T = rows.reduce((s,r)=>({t:s.t+r.target, d:s.d+r.done}),{t:0,d:0});
  const card = document.createElement('div');
  card.className = 'card home-targets';
  card.innerHTML = `<h2>${icon('flag',15)} المنجز مقابل المستهدف — ${acadYearLabel(year)}
      <span class="helper">${T.d} من ${T.t} (${Math.round(T.d/T.t*100)}%)</span></h2>
    <div class="tg-list">${rows.slice(0,8).map(r=>`<div class="tg-row">
      <span class="tg-n">${escapeHtml(r.name)}</span>${progressBarHtml(r)}
      <span class="tg-v"><b>${r.done}</b>/${r.target}</span></div>`).join('')}</div>
    <div class="tg-legend"><span><i class="d mid"></i> منجزة</span><span><i class="p"></i> مجدولة</span></div>`;
  c.appendChild(card);
}
function drawTargetsReport(box, back){
  if(!targetsYear) targetsYear = acadYearOf(todayStr());
  const COLS = ['المجال','المستهدف','المنجزة','المجدولة','المتبقي','نسبة الإنجاز','مستفيدو المنجز'];
  const gen = ()=>targetsProgress(targetsYear).filter(r=>r.target||r.total);
  const arr = r => [r.name, r.target||'—', r.done, r.planned, r.target?Math.max(0,r.target-r.done):'—', r.pct===null?'—':r.pct+'%', r.people];
  box.innerHTML = `<div class="card"><h2>${icon('flag',15)} المستهدفات السنوية
      <button class="btn btn-outline btn-sm" type="button" id="tgr_back">${icon('chevronRight',14)} كل التقارير</button></h2>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;margin-bottom:12px;">
      <div class="rp-date"><label>السنة الدراسية</label><select id="tgr_year">${yearOptions(targetsYear)}</select></div>
      <button class="icon-btn rect" id="tgr_print" title="طباعة" aria-label="طباعة">${icon('printer',17)}</button>
      <button class="icon-btn rect" id="tgr_excel" title="تنزيل Excel" aria-label="تنزيل Excel">${icon('sheet',17)}</button>
      ${currentRole==='admin'?`<button class="btn btn-outline btn-sm" id="tgr_edit">${icon('edit',14)} تعديل المستهدفات</button>`:''}
    </div><div id="tgr_res"></div></div>`;
  const draw = ()=>{
    const rows = gen(); const b = box.querySelector('#tgr_res');
    if(!rows.length){ b.innerHTML = `<div class="empty-state">لا توجد مستهدفات ولا فعاليات لهذه السنة</div>`; return; }
    b.innerHTML = repTableHtml(COLS.concat(['التقدّم']), rows.map(r=>({cells: arr(r).map(String).map(escapeHtml).concat([progressBarHtml(r)]),
      tdAttr:{0:' style="text-align:right;font-weight:700;"'}})), {});
    enhanceReportTable(b);
  };
  box.querySelector('#tgr_back').onclick = back;
  box.querySelector('#tgr_year').onchange = e=>{ targetsYear = e.target.value; draw(); };
  const ed = box.querySelector('#tgr_edit'); if(ed) ed.onclick = ()=>{ currentPage='settings'; settingsTab='targets'; render(); };
  box.querySelector('#tgr_print').onclick = ()=>{
    const rows = gen(); if(!rows.length){ toast('لا توجد بيانات'); return; }
    const T = rows.reduce((s,r)=>({t:s.t+(r.target||0), d:s.d+r.done, p:s.p+r.planned}),{t:0,d:0,p:0});
    doPrintDoc(buildReportDoc({ titleAr:'المستهدفات السنوية', subtitle:`السنة الدراسية ${acadYearLabel(targetsYear)}`,
      kpis:[{v:T.t,l:'📋 المستهدف'},{v:T.d,l:'✅ المنجزة'},{v:T.p,l:'⏳ المجدولة'},{v:T.t?Math.round(T.d/T.t*100)+'%':'—',l:'📈 الإنجاز'}],
      headers: COLS, rows: rows.map(r=>arr(r).map(String)) }), false, 'A4');
  };
  box.querySelector('#tgr_excel').onclick = ()=>{
    const rows = gen(); if(!rows.length){ toast('لا توجد بيانات'); return; }
    exportToExcel(`المستهدفات_${targetsYear}.xlsx`, COLS, rows.map(arr), `المستهدفات السنوية — ${acadYearLabel(targetsYear)}`);
  };
  draw();
}

/* ══════════════════════════════════════════════════════════════════
   أرشفة السنوات الدراسية السابقة — تنزيل ملف ثم إزالة من النظام
   ══════════════════════════════════════════════════════════════════ */
function openArchiveModal(){
  const cur = acadYearOf(todayStr());
  const by = {};
  state.orders.forEach(o=>{ const y = acadYearOf(o.date); if(y && y < cur) (by[y] = by[y] || []).push(o); });
  const years = Object.keys(by).sort();
  const body = years.length ? `
    <div class="helper" style="margin-bottom:10px;">الأرشفة تنقل فعاليات سنة دراسية منتهية إلى ملف على جهازك، ثم تُزيلها من النظام ليبقى سريعًا وبعيدًا عن حد حجم قاعدة البيانات. يمكنك استعراض الملف لاحقًا من «استعراض ملف أرشيف».</div>
    <div class="rep-list">${years.map(y=>`<label class="rep-row"><input type="radio" name="arch_y" value="${y}">
      <span class="rep-d"><b>${acadYearLabel(y)}</b></span><span class="rep-notes"><span class="rep-note">${by[y].length} ${eventWord(by[y].length)}</span></span></label>`).join('')}</div>
    <div class="arch-steps">
      <button class="btn btn-primary" id="arch_dl" disabled>${icon('download',15)} 1. تنزيل ملف الأرشيف</button>
      <button class="btn btn-outline danger-outline" id="arch_rm" disabled>${icon('trash',15)} 2. إزالتها من النظام</button>
    </div>
    <div class="helper">لا يُتاح الحذف إلا بعد تنزيل الملف. السنة الحالية (${acadYearLabel(cur)}) لا تُؤرشف.</div>`
    : `<div class="empty-state">لا توجد سنوات دراسية سابقة لأرشفتها — كل الفعاليات ضمن السنة الحالية (${acadYearLabel(cur)}).</div>`;
  showInfoModal(`${icon('inbox',17)} أرشفة سنة دراسية`, body, box=>{
    box.style.maxWidth='520px';
    let sel = '', downloaded = '';
    const dl = box.querySelector('#arch_dl'), rm = box.querySelector('#arch_rm');
    box.querySelectorAll('input[name=arch_y]').forEach(r=>r.onchange=()=>{ sel = r.value; dl.disabled = false; rm.disabled = downloaded!==sel; });
    if(dl) dl.onclick = ()=>{
      const list = by[sel]; const ids = new Set(list.map(o=>o.id));
      const data = { type:'events-archive', version:1, year:sel, exportedAt:new Date().toISOString(),
        org: state.orgName||'', orders:list, auditLog:(state.auditLog||[]).filter(a=>ids.has(a.orderId)),
        lookups:{ schools:state.schools, trainers:state.trainers, fields:state.fields, programTypes:state.programTypes, resources:state.resources||[] } };
      const blob = new Blob([JSON.stringify(data, null, 1)], {type:'application/json'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `أرشيف-الفعاليات-${sel}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
      downloaded = sel; rm.disabled = false; toast('نُزّل ملف الأرشيف — احفظه في مكان آمن');
    };
    if(rm) rm.onclick = async ()=>{
      const list = by[sel]; if(!list || downloaded!==sel) return;
      if(!confirm(`ستُزال ${list.length} فعالية من السنة ${acadYearLabel(sel)} من النظام.\nتأكّد أن ملف الأرشيف محفوظ لديك.\n\nمتابعة؟`)) return;
      const ids = new Set(list.map(o=>o.id));
      state.orders = state.orders.filter(o=>!ids.has(o.id));
      logAudit('archive', null, `أرشفة السنة ${acadYearLabel(sel)}: ${list.length} فعالية`, true);
      await saveState(); closeModal(); toast(`أُرشفت ${list.length} فعالية`); render();
    };
  });
}
function viewArchiveFile(file){
  if(!file) return;
  const rd = new FileReader();
  rd.onload = ()=>{
    let data; try{ data = JSON.parse(rd.result); }catch(e){ toast('ملف غير صالح'); return; }
    if(!data || data.type!=='events-archive' || !Array.isArray(data.orders)){ toast('هذا ليس ملف أرشيف فعاليات'); return; }
    const L = data.lookups || {};
    const nm = (arr,id) => { const x=(arr||[]).find(y=>y.id===id); return x?x.name:''; };
    const rows = data.orders.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(o=>[
      o.serial, o.title||'', fmtDateRaw(o.date), nm(L.schools,o.schoolId), nm(L.fields,o.fieldId), nm(L.programTypes,o.programTypeId),
      (o.trainerIds||[]).map(id=>nm(L.trainers,id)).filter(Boolean).join('، '), o.participantsCount||'', o.status==='cancelled'?'ملغاة':(o.completionStatus||'—')]);
    const COLS = ['الرقم','العنوان','التاريخ','الجهة','المجال','المسار','المقدّم','المستهدفون','الإنجاز'];
    const body = `<div class="helper" style="margin-bottom:8px;">السنة الدراسية <b>${acadYearLabel(data.year)}</b> · ${rows.length} فعالية · أُرشفت ${fmtDateRaw((data.exportedAt||'').slice(0,10))}</div>
      <input id="arv_q" placeholder="ابحث في الأرشيف..." style="width:100%;margin-bottom:8px;">
      <div style="max-height:52vh;overflow:auto;"><table class="set-table arv-tbl"><thead><tr>${COLS.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${escapeHtml(String(v))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <div style="margin-top:10px;"><button class="btn btn-outline" id="arv_x">${icon('sheet',15)} تنزيل Excel</button></div>`;
    showInfoModal(`${icon('bookOpen',17)} ملف أرشيف`, body, box=>{
      box.style.maxWidth='980px';
      const q = box.querySelector('#arv_q'), trs = Array.from(box.querySelectorAll('.arv-tbl tbody tr'));
      q.oninput = ()=>{ const v = _mzNz(q.value); trs.forEach(tr=>tr.style.display = !v || _mzNz(tr.textContent).includes(v) ? '' : 'none'); };
      box.querySelector('#arv_x').onclick = ()=>exportToExcel(`أرشيف_${data.year}.xlsx`, COLS, rows, `أرشيف الفعاليات — ${acadYearLabel(data.year)}`);
    });
  };
  rd.readAsText(file);
}

/* ══════════════════════════════════════════════════════════════════
   التقويم الشهري للفعاليات — السحب لتغيير التاريخ
   ══════════════════════════════════════════════════════════════════ */
let ordersView = (function(){ try{ return localStorage.getItem('ordersView') || 'list'; }catch(e){ return 'list'; } })();
let ordCalMonth = '';
function renderOrdersCalendar(box, list){
  const today = todayStr();
  if(!ordCalMonth) ordCalMonth = today.slice(0,7);
  const [Y,M] = ordCalMonth.split('-').map(Number);
  const first = `${ordCalMonth}-01`, lastDay = new Date(Y, M, 0).getDate();
  const startDow = new Date(Y, M-1, 1).getDay();             /* الأحد = 0 */
  const gridStart = addDaysISO(first, -startDow);
  const weeks = Math.ceil((startDow + lastDay)/7);
  const canEdit = currentRole==='admin' || currentRole==='user';
  const byDay = {};
  list.forEach(o=>{
    if(!o.date) return;
    const e = orderEnd(o); let d = o.date, g = 0;
    while(d <= e && g < 62){ (byDay[d] = byDay[d] || []).push({o, start:d===o.date, end:d===e}); d = addDaysISO(d,1); g++; }
  });
  const monthLabel = new Date(Y, M-1, 1).toLocaleDateString('ar-QA-u-nu-latn',{month:'long', year:'numeric'});
  let occMap = {}; try{ ensureOccasions(); occMap = occasionsOnDays(gridStart, addDaysISO(gridStart, weeks*7)); }catch(e){}
  const DOW = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  let cells = '';
  for(let i=0;i<weeks*7;i++){
    const d = addDaysISO(gridStart, i), inM = d.slice(0,7)===ordCalMonth, dow = i%7;
    const items = (byDay[d]||[]).sort((a,b)=>(a.o.timeFrom||'').localeCompare(b.o.timeFrom||''));
    const MAX = 3;
    cells += `<div class="oc-day${inM?'':' out'}${d===today?' today':''}${dow>=5?' wkend':''}" data-day="${d}">
      <div class="oc-dh"><span class="oc-num">${Number(d.slice(8,10))}</span>
        ${canEdit?`<button type="button" class="oc-add" data-new="${d}" title="طلب جديد بتاريخ ${fmtDateRaw(d)}" aria-label="طلب جديد">${icon('plus',12)}</button>`:''}</div>
      ${(occMap[d]||[]).map(n=>`<div class="oc-occ" title="${escapeHtml(n)}">${icon('flag',10)} ${escapeHtml(n)}</div>`).join('')}
      ${items.slice(0,MAX).map(({o,start,end})=>{ const st = orderState(o, today);
        return `<div class="oc-ev st-${st.k}${start?' s':''}${end?' e':''}" data-id="${o.id}" ${canEdit && st.k!=='draft' && start?'draggable="true"':''}
          title="${escapeHtml(`${o.serial} — ${o.title||''} · ${o.timeFrom||''}-${o.timeTo||''} · ${ST_NAMES[st.k]||st.l}`)}">
          ${start?`<b>${o.serial}</b> ${escapeHtml(o.title||'')}${o.seriesId?` ${icon('refresh',10)}`:''}`:`<span class="oc-cont">↤ ${escapeHtml(o.title||'')}</span>`}</div>`; }).join('')}
      ${items.length>MAX?`<button type="button" class="oc-more" data-more="${d}">+${items.length-MAX} أخرى</button>`:''}
    </div>`;
  }
  box.innerHTML = `<div class="oc-wrap">
    <div class="oc-bar">
      <div class="oc-nav">
        <button type="button" class="icon-btn" id="oc_prev" title="الشهر السابق" aria-label="الشهر السابق">${icon('chevronRight',16)}</button>
        <b class="oc-title">${monthLabel}</b>
        <button type="button" class="icon-btn" id="oc_next" title="الشهر التالي" aria-label="الشهر التالي">${icon('chevronLeft',16)}</button>
        <button type="button" class="btn btn-outline btn-sm" id="oc_today">اليوم</button>
      </div>
      <div class="oc-legend">${['new','run','done','late','hold','draft'].map(k=>`<span><i style="background:${ST_TOKENS[k]}"></i>${ST_NAMES[k]}</span>`).join('')}</div>
    </div>
    ${canEdit?`<div class="helper" style="margin:-2px 0 8px;">${icon('info',13)} اسحب الفعالية إلى يوم آخر لتغيير تاريخها، أو اضغط + لإنشاء طلب بذلك اليوم.</div>`:''}
    <div class="oc-grid">${DOW.map((n,i)=>`<div class="oc-dow${i>=5?' wkend':''}">${n}</div>`).join('')}${cells}</div>
  </div>`;
  const redraw = ()=>renderOrdersCalendar(box, list);
  box.querySelector('#oc_prev').onclick = ()=>{ const d=new Date(Y,M-2,1); ordCalMonth=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; redraw(); };
  box.querySelector('#oc_next').onclick = ()=>{ const d=new Date(Y,M,1); ordCalMonth=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; redraw(); };
  box.querySelector('#oc_today').onclick = ()=>{ ordCalMonth = today.slice(0,7); redraw(); };
  box.querySelectorAll('.oc-ev').forEach(el=>{
    el.onclick = ()=>viewOrderReadOnly(el.dataset.id);
    el.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', el.dataset.id); e.dataTransfer.effectAllowed='move'; el.classList.add('dragging'); box.classList.add('oc-dragging'); });
    el.addEventListener('dragend', ()=>{ el.classList.remove('dragging'); box.classList.remove('oc-dragging'); });
  });
  box.querySelectorAll('.oc-add').forEach(b=>b.onclick = e=>{ e.stopPropagation(); newOrderOnDate(b.dataset.new); });
  box.querySelectorAll('.oc-more').forEach(b=>b.onclick = ()=>showDayList(b.dataset.more, byDay[b.dataset.more]||[]));
  /* على الجوال الشرائط صغيرة: لمس اليوم يعرض فعالياته */
  box.querySelectorAll('.oc-day').forEach(day=>day.addEventListener('click', e=>{
    if(window.innerWidth > 760 || e.target.closest('.oc-add')) return;
    const it = byDay[day.dataset.day]||[]; if(it.length){ e.stopPropagation(); e.preventDefault(); showDayList(day.dataset.day, it); }
  }, true));
  if(canEdit) box.querySelectorAll('.oc-day').forEach(day=>{
    day.addEventListener('dragover', e=>{ e.preventDefault(); day.classList.add('drop'); });
    day.addEventListener('dragleave', ()=>day.classList.remove('drop'));
    day.addEventListener('drop', e=>{ e.preventDefault(); day.classList.remove('drop');
      const id = e.dataTransfer.getData('text/plain'); if(id) moveOrderToDate(id, day.dataset.day); });
  });
}
function newOrderOnDate(d){
  currentPage='newOrder'; editingOrderId=null; render();
  setTimeout(()=>{ const f=document.getElementById('f_date'); if(f){ f.value=d; f.dispatchEvent(new Event('change')); f.dispatchEvent(new Event('input')); } }, 30);
}
function showDayList(d, items){
  const today = todayStr();
  const body = `<div class="rep-list">${items.map(({o})=>{ const st = orderState(o, today);
    return `<button type="button" class="rep-row as-btn" data-id="${o.id}"><span class="rep-n">${o.serial}</span>
      <span class="rep-d"><b>${escapeHtml(o.title||'')}</b> · ${o.timeFrom||''}-${o.timeTo||''}</span>
      <span class="rep-notes"><span class="st st-${st.k}">${ST_NAMES[st.k]||st.l}</span></span></button>`; }).join('')}</div>`;
  showInfoModal(`${dayNameOf(d)} ${fmtDateRaw(d)} — ${items.length} ${eventWord(items.length)}`, body, box=>{
    box.style.maxWidth='520px';
    box.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{ closeModal(); setTimeout(()=>viewOrderReadOnly(b.dataset.id),60); });
  });
}
function moveOrderToDate(id, newDate){
  const o = state.orders.find(x=>x.id===id); if(!o || !newDate || o.date===newDate) return;
  const span = Math.max(0, daysCount(o.date, orderEnd(o)) - 1);
  const newTo = addDaysISO(newDate, span);
  const cf = postponeConflicts(o, newDate, newTo, o.timeFrom, o.timeTo);
  const ac = checkAcademicDate(newDate, newTo).filter(a=>a.level==='block');
  const body = `
    <div class="mv-sum"><b>${o.serial} — ${escapeHtml(o.title||'')}</b><br>
      من <b>${dayNameOf(o.date)} ${fmtDateRaw(o.date)}</b> إلى <b>${dayNameOf(newDate)} ${fmtDateRaw(newDate)}</b>${span?` (حتى ${fmtDateRaw(newTo)})`:''}</div>
    ${cf.length||ac.length ? `<div class="rep-banner dan">${icon('alert',14)} <span>${cf.map(c=>escapeHtml(c.line.split('\n')[0])).concat(ac.map(a=>escapeHtml(a.msg))).join('<br>')}</span></div>`
      : `<div class="rep-banner ok">${icon('checkCircle',14)} <span>لا يوجد تضارب في التاريخ الجديد</span></div>`}
    <div class="mv-opts">
      <button type="button" class="mv-opt" data-mv="postpone">${icon('forward',18)}<span><b>ترحيل</b><i>يُسجَّل في أمر التكليف المطبوع أنها رُحّلت من التاريخ السابق</i></span></button>
      <button type="button" class="mv-opt" data-mv="fix">${icon('edit',18)}<span><b>تصحيح التاريخ فقط</b><i>تغيير صامت — لخطأ إدخال أو تعديل قبل الاعتماد</i></span></button>
    </div>`;
  showInfoModal(`${icon('calendar',17)} نقل الفعالية`, body, box=>{
    box.style.maxWidth='520px';
    box.querySelectorAll('[data-mv]').forEach(b=>b.onclick = async ()=>{
      const oldDate = o.date, oldTo = orderEnd(o);
      if(b.dataset.mv==='postpone'){
        o.status = 'postponed';
        o.postponedFrom = oldDate; o.postponedFromTo = oldTo!==oldDate ? oldTo : '';
        o.postponedFromTime = (o.timeFrom||o.timeTo) ? `${o.timeFrom||'—'} - ${o.timeTo||'—'}` : '';
        o.postponedAt = todayStr(); o.postponedHadClash = cf.length;
        o.adminNote = (o.adminNote?o.adminNote+' | ':'') + `تم ترحيلها من ${fmtDateRaw(oldDate)} إلى ${fmtDateRaw(newDate)}`;
        o.date = newDate; o.dateTo = newTo;
        logAudit('postpone', o, `من ${fmtDateRaw(oldDate)} إلى ${fmtDateRaw(newDate)} (بالسحب في التقويم)`, true);
      } else {
        o.date = newDate; o.dateTo = newTo;
        logAudit('move', o, `من ${fmtDateRaw(oldDate)} إلى ${fmtDateRaw(newDate)}`, true);
      }
      await saveState(); closeModal(); toast(`نُقلت إلى ${fmtDateRaw(newDate)}`); render();
    });
  });
}

/* ══════════════════════════════════════════════════════════════════
   المقدّمون معًا — مقدّمو مبادرات يجتمعون في نفس المكان (نفس اليوم أو خلال الفترة)
   ══════════════════════════════════════════════════════════════════ */
let coworkMode = 'day';
function placeNameOf(o){ if(o.venue) return o.venue; const sc = state.schools.find(x=>x.id===o.schoolId); return sc ? sc.name : ''; }
function coworkGroups(orders, F, T, mode){
  const groups = new Map();
  orders.forEach(o=>{
    const place = placeNameOf(o); if(!place || !(o.trainerIds||[]).length) return;
    if(mode==='day'){
      let d = o.date < F ? F : o.date; const e = orderEnd(o) > T ? T : orderEnd(o); let g = 0;
      while(d <= e && g < 62){ const k = place+'¦'+d; if(!groups.has(k)) groups.set(k,{place, date:d, orders:[]}); groups.get(k).orders.push(o); d = addDaysISO(d,1); g++; }
    } else {
      if(!groups.has(place)) groups.set(place,{place, orders:[]}); groups.get(place).orders.push(o);
    }
  });
  return Array.from(groups.values()).map(g=>{
    const tids = Array.from(new Set(g.orders.flatMap(o=>o.trainerIds||[])));
    const dates = Array.from(new Set(g.orders.map(o=>o.date))).sort();
    return {...g, trainers: tids.map(id=>state.trainers.find(t=>t.id===id)).filter(Boolean), dates,
      people: g.orders.reduce((s,o)=>s+(Number(o.participantsCount)||0),0)};
  }).filter(g=>g.trainers.length >= 2)
    .sort((a,b)=>(a.date||a.dates[0]||'').localeCompare(b.date||b.dates[0]||'') || a.place.localeCompare(b.place,'ar'));
}
function coworkCardHtml(groups, F, T){
  return `<h2>${icon('users',15)} المقدّمون معًا في نفس المكان — ${groups.length} ${groups.length>10||groups.length<3?'موقعًا':'مواقع'}
      <span style="display:inline-flex;gap:6px;align-items:center;">
        <span class="view-seg"><button type="button" data-cw="day" class="${coworkMode==='day'?'on':''}">نفس اليوم</button>
          <button type="button" data-cw="period" class="${coworkMode==='period'?'on':''}">خلال الفترة</button></span>
        <button class="icon-btn" id="cw_print" title="طباعة" aria-label="طباعة" style="width:32px;height:32px;padding:0;">${icon('printer',15)}</button>
        <button class="icon-btn" id="cw_excel" title="تنزيل Excel" aria-label="تنزيل Excel" style="width:32px;height:32px;padding:0;">${icon('sheet',15)}</button>
      </span></h2>
    <div class="helper" style="margin-bottom:10px;">${coworkMode==='day'
      ? 'الأماكن التي يحضرها مقدّمان أو أكثر <b>في اليوم نفسه</b>'
      : 'الأماكن التي يخدمها مقدّمان أو أكثر <b>خلال الفترة</b>'} — من ${fmtDateRaw(F)} إلى ${fmtDateRaw(T)}.</div>
    ${groups.length ? `<div class="tbl-scroll"><table class="cw-tbl" style="font-size:12.5px;"><thead><tr>
      <th style="text-align:right;">المكان</th><th>${coworkMode==='day'?'التاريخ':'التواريخ'}</th><th style="text-align:right;">مقدّمو المبادرة</th>
      <th style="text-align:right;">المبادرات</th><th>المستهدفون</th></tr></thead><tbody>
      ${groups.map(g=>`<tr>
        <td style="text-align:right;font-weight:700;">${escapeHtml(g.place)}</td>
        <td style="white-space:nowrap;">${coworkMode==='day' ? `${dayNameOf(g.date)}<br><b>${fmtDateRaw(g.date)}</b>` : g.dates.map(fmtDateRaw).join('<br>')}</td>
        <td style="text-align:right;">${g.trainers.map(t=>`<div class="cw-tr">${icon('user',12)} ${escapeHtml(t.name)}${t.phone?` <span>${escapeHtml(t.phone)}</span>`:''}</div>`).join('')}</td>
        <td style="text-align:right;">${g.orders.map(o=>`<div class="cw-ev"><a href="#" onclick="viewOrderReadOnly('${o.id}');return false;"><b>${o.serial}</b> ${escapeHtml(o.title||'')}</a>
          <span>${o.timeFrom||''}${o.timeTo?'–'+o.timeTo:''}${coworkMode==='period'?' · '+fmtDateRaw(o.date):''}</span></div>`).join('')}</td>
        <td><b>${g.people}</b></td></tr>`).join('')}
    </tbody></table></div>` : `<div class="empty-state">لا يوجد مقدّمان في مكان واحد ${coworkMode==='day'?'في اليوم نفسه ':''}خلال هذه الفترة</div>`}`;
}
function bindCowork(box, orders, F, T){
  const draw = ()=>{
    const groups = coworkGroups(orders, F, T, coworkMode);
    box.innerHTML = coworkCardHtml(groups, F, T);
    box.querySelectorAll('[data-cw]').forEach(b=>b.onclick=()=>{ coworkMode=b.dataset.cw; draw(); });
    const rowsArr = groups.map(g=>[g.place, coworkMode==='day'?`${dayNameOf(g.date)} ${fmtDateRaw(g.date)}`:g.dates.map(fmtDateRaw).join('، '),
      g.trainers.map(t=>t.name+(t.phone?` (${t.phone})`:'')).join('، '),
      g.orders.map(o=>`${o.serial} - ${o.title||''} (${o.timeFrom||''}${o.timeTo?'-'+o.timeTo:''})`).join('، '), g.people]);
    const COLS = ['المكان', coworkMode==='day'?'التاريخ':'التواريخ', 'مقدّمو المبادرة', 'المبادرات', 'المستهدفون'];
    box.querySelector('#cw_print').onclick = ()=>{
      if(!groups.length){ toast('لا توجد بيانات'); return; }
      doPrintDoc(buildReportDoc({ titleAr:'المقدّمون معًا في نفس المكان',
        subtitle:`${coworkMode==='day'?'في اليوم نفسه':'خلال الفترة'} — من ${fmtDateRaw(F)} إلى ${fmtDateRaw(T)}`,
        kpis:[{v:groups.length,l:'🏫 المواقع'},{v:new Set(groups.flatMap(g=>g.trainers.map(t=>t.id))).size,l:'👥 المقدّمون'},
              {v:new Set(groups.flatMap(g=>g.orders.map(o=>o.id))).size,l:'📋 المبادرات'}],
        headers: COLS, colWidths:['48mm','30mm','58mm','auto','22mm'],
        rows: groups.map(g=>[escapeHtml(g.place),
          coworkMode==='day' ? `${dayNameOf(g.date)}<br>${fmtDateRaw(g.date)}` : g.dates.map(fmtDateRaw).join('<br>'),
          g.trainers.map(t=>`${escapeHtml(t.name)}${t.phone?` — ${escapeHtml(t.phone)}`:''}`).join('<br>'),
          g.orders.map(o=>`<b>${o.serial}</b> ${escapeHtml(o.title||'')} <span style="color:#777;">(${o.timeFrom||''}${o.timeTo?'-'+o.timeTo:''}${coworkMode==='period'?' · '+fmtDateRaw(o.date):''})</span>`).join('<br>'),
          String(g.people)])
      }), true, 'A4');
    };
    box.querySelector('#cw_excel').onclick = ()=>{
      if(!groups.length){ toast('لا توجد بيانات'); return; }
      exportToExcel(`المقدمون_معا_${F}_${T}.xlsx`, COLS, rowsArr, `المقدّمون معًا في نفس المكان — من ${fmtDateRaw(F)} إلى ${fmtDateRaw(T)}`);
    };
  };
  draw();
}

/* ══════════════════════════════════════════════════════════════════
   تصحيح مسارات المبادرة من عناوينها
   كلمات دالّة لكل مسار (افتراضية حسب اسم المسار + كلمات تضيفها أنت)،
   ثم الاستئناس بالعناوين المتطابقة. لا يُطبَّق شيء قبل مراجعتك.
   ══════════════════════════════════════════════════════════════════ */
const PATH_HINT_RULES = [
  [/حمل/,            'حملة حملات توعية توعوي توعوية نظافة بيئة بيئي تشجير تبرع سلامة مرور وقاية صحة صحي أسبوع اليوم العالمي مبادرة مجتمعية ترشيد'],
  [/موهب|مواهب|مسابق/,'مسابقة مسابقات تحدي التحدي فرسان بطولة موهبة مواهب دوري تنافس تنافسي جائزة ألعاب العاب لعب اللعب سباق ابتكار رسم إلقاء الإلقاء شعر مهارات أولمبياد'],
  [/مدارك|معرف|ثقاف/,'ورشة ورش محاضرة دورة ندوة درس تطوير معرفة معرفي قراءة كتاب علوم تعلم تعليم فكر فكري وعي حوار نقاش تدريب تدريبي مهارة لقاء علمي'],
  [/صحب/,           'صحبة رحلة زيارة مخيم إفطار فطور ملتقى تجمع نزهة كشاف كشافة رفقة لقاء أسري'],
  [/قيم/,           'قيم القيم قيمة أخلاق احترام الاحترام انضباط الانضباط صدق أمانة بر تعاون مسؤولية انتماء هوية'],
  [/قرآ|قران|حفظ|تحفيظ/,'قرآن القرآن قران تلاوة تجويد حفظ تحفيظ سرد'],
  [/مصل|صلا/,       'المصلى مصلى صلاة الصلاة وضوء الوضوء'],
  [/ترفي/,          'ترفيه ترفيهي ترفيهية مرح فعاليات ترفيهية مهرجان'],
  [/إرشاد|ارشاد|دعو|وعظ/,'خطبة موعظة دعوة دعوي إرشاد ارشاد درس ديني'],
];
/* ══════ مجموعة مقدّمين في جدول إتاحة واحد + كشف للجهات ══════ */
const GRP_DEFAULT_NAMES = ['غشيمه','الشربيني','البكري'];
function grpGetIds(){
  let ids = null;
  try{ ids = JSON.parse(localStorage.getItem('avGroupIds')||'null'); }catch(e){}
  const valid = new Set((state.trainers||[]).map(t=>t.id));
  if(Array.isArray(ids)) ids = ids.filter(id=>valid.has(id));
  if(!ids || !ids.length){
    ids = GRP_DEFAULT_NAMES.map(n=>{ const t=(state.trainers||[]).find(x=>_pnz(x.name).includes(_pnz(n))); return t&&t.id; }).filter(Boolean);
  }
  return ids;
}
function grpSetIds(ids){ try{ localStorage.setItem('avGroupIds', JSON.stringify(ids)); }catch(e){} }
function grpStatus(tid, d){
  const dw = new Date(d+'T00:00:00').getDay();
  if(dw===5 || dw===6) return {k:'off', l:'عطلة'};
  try{ const lv = trainerLeaveOn(tid, d); if(lv) return {k:'leave', l:'إجازة'}; }catch(e){}
  const evs = (state.orders||[]).filter(o=>isLiveOrder(o) && o.date && (o.trainerIds||[]).includes(tid) && d>=o.date && d<=orderEnd(o));
  if(evs.length) return {k:'busy', l:'مشغول', evs};
  return {k:'free', l:'متاح'};
}
function grpCompute(ids, F, T, workOnly){
  const rows = []; let cur = F, g = 0;
  while(cur<=T && g<370){
    const dw = new Date(cur+'T00:00:00').getDay();
    if(!(workOnly && (dw===5||dw===6))){
      const st = ids.map(id=>grpStatus(id, cur));
      rows.push({d:cur, st, free:st.filter(x=>x.k==='free').length});
    }
    cur = addDaysISO(cur,1); g++;
  }
  return rows;
}
function openTrainerGroup(){
  const today = todayStr();
  const G = window.__grp = window.__grp || {
    F: window.__schedFrom || today, T: window.__schedTo || addDaysISO(today, 29), work:true, flt:'any' };
  let ids = grpGetIds();
  const allT = (state.trainers||[]).slice().sort((a,b)=>a.name.localeCompare(b.name,'ar'));
  showInfoModal(`${icon('users',17)} إتاحة مجموعة المقدّمين`, `<div class="grp">
      <div class="grp-chips" id="grp_chips"></div>
      <div class="grp-bar">
        <label>من <input type="date" id="grp_F" value="${G.F}"></label>
        <label>إلى <input type="date" id="grp_T" value="${G.T}"></label>
        <label class="grp-ck"><input type="checkbox" id="grp_work" ${G.work?'checked':''}> أيام العمل فقط</label>
        <span class="pk-seg" id="grp_flt">${[['any','كل الأيام'],['some','فيها متاح'],['all','الجميع متاح']].map(x=>`<button type="button" data-f="${x[0]}" class="${G.flt===x[0]?'on':''}">${x[1]}</button>`).join('')}</span>
      </div>
      <div class="grp-sum" id="grp_sum"></div>
      <div class="grp-tbl" id="grp_tbl"></div>
      <div class="grp-acts">
        <button type="button" class="pk-btn pri" id="grp_pub">${icon('printer',15)} طباعة كشف للجهات</button>
        <button type="button" class="pk-btn" id="grp_int">${icon('clipboard',15)} كشف داخلي بالتفاصيل</button>
        <button type="button" class="pk-btn" id="grp_xls">${icon('sheet',15)} Excel</button>
      </div></div>`, box=>{
    box.style.maxWidth = '980px';
    const tName = id=>{ const t=allT.find(x=>x.id===id); return t?t.name:''; };
    const visible = rows => G.flt==='some' ? rows.filter(r=>r.free>0) : G.flt==='all' ? rows.filter(r=>r.free===ids.length && ids.length) : rows;
    function chips(){
      box.querySelector('#grp_chips').innerHTML = `<span class="lb">المقدّمون في المجموعة:</span>` +
        ids.map(id=>`<button type="button" class="grp-chip on" data-rm="${id}" title="إزالة">${escapeHtml(tName(id))} ${icon('x',12)}</button>`).join('') +
        `<select id="grp_add" aria-label="إضافة مقدّم"><option value="">+ إضافة مقدّم</option>${allT.filter(t=>!ids.includes(t.id)).map(t=>`<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('')}</select>`;
      box.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{ ids = ids.filter(x=>x!==b.dataset.rm); grpSetIds(ids); chips(); draw(); });
      box.querySelector('#grp_add').onchange = e=>{ if(e.target.value){ ids.push(e.target.value); grpSetIds(ids); chips(); draw(); } };
    }
    function cell(s, detail){
      if(s.k==='free') return `<span class="gs free">${icon('check',13)} متاح</span>`;
      if(s.k==='busy') return `<span class="gs busy">مشغول</span>${detail?s.evs.map(o=>`<small>${escapeHtml(o.title||'')}${o.timeFrom?` · ${escapeHtml(o.timeFrom)}`:''}</small>`).join(''):''}`;
      if(s.k==='leave') return `<span class="gs leave">إجازة</span>`;
      return `<span class="gs off">عطلة</span>`;
    }
    function draw(){
      const rows = visible(grpCompute(ids, G.F, G.T, G.work)); window.__grpRows = rows;
      const all = rows.filter(r=>r.free===ids.length).length, some = rows.filter(r=>r.free>0).length;
      box.querySelector('#grp_sum').innerHTML = ids.length ? `<span><b>${rows.length}</b> يوم معروض</span><span class="g"><b>${some}</b> يوم فيه متاح</span><span class="g2"><b>${all}</b> يوم الجميع متاح</span>` : '';
      box.querySelector('#grp_tbl').innerHTML = !ids.length ? `<div class="pk-empty">أضف مقدّمًا واحدًا على الأقل</div>` : !rows.length ? `<div class="pk-empty">لا توجد أيام مطابقة في هذه الفترة</div>` :
        `<table class="pk-tbl"><thead><tr><th>التاريخ</th><th>اليوم</th>${ids.map(id=>`<th class="c">${escapeHtml(tName(id))}</th>`).join('')}<th class="c">المتاحون</th></tr></thead><tbody>
        ${rows.map(r=>`<tr><td class="nw">${fmtDate(r.d)}</td><td>${escapeHtml(dayNameOf(r.d))}</td>${r.st.map(s=>`<td class="c">${cell(s,true)}</td>`).join('')}<td class="c"><b>${r.free}</b> / ${ids.length}</td></tr>`).join('')}
        </tbody></table>`;
    }
    const rd = ()=>{ G.F = box.querySelector('#grp_F').value||G.F; G.T = box.querySelector('#grp_T').value||G.T; if(G.T<G.F) G.T=G.F; draw(); };
    box.querySelector('#grp_F').onchange = rd; box.querySelector('#grp_T').onchange = rd;
    box.querySelector('#grp_work').onchange = e=>{ G.work = e.target.checked; draw(); };
    box.querySelectorAll('#grp_flt [data-f]').forEach(b=>b.onclick=()=>{ G.flt=b.dataset.f; box.querySelectorAll('#grp_flt [data-f]').forEach(x=>x.classList.toggle('on',x===b)); draw(); });
    const printIt = detail=>{
      const rows = window.__grpRows||[]; if(!rows.length||!ids.length){ toast('لا توجد بيانات للطباعة'); return; }
      const pc = s => s.k==='free' ? '<b style="color:#1E7A46">متاح</b>'
        : detail && s.k==='busy' ? `<span style="color:#8A8A8A">مشغول</span><br><small>${s.evs.map(o=>escapeHtml(o.title||'')).join('، ')}</small>`
        : `<span style="color:#9A9A9A">${s.k==='busy'?'غير متاح':s.l}</span>`;
      doPrintDoc(buildReportDoc({
        titleAr: detail ? 'إتاحة مقدّمي المبادرات — كشف داخلي' : 'كشف إتاحة مقدّمي المبادرات',
        subtitle: `الفترة من ${fmtDate(G.F)} إلى ${fmtDate(G.T)}`,
        kpis:[{v:ids.length,l:'المقدّمون'},{v:rows.length,l:'الأيام'},{v:rows.filter(r=>r.free>0).length,l:'أيام فيها متاح'}],
        headers:['التاريخ','اليوم', ...ids.map(tName), 'عدد المتاحين'],
        rows: rows.map(r=>[fmtDate(r.d), escapeHtml(dayNameOf(r.d)), ...r.st.map(pc), `${r.free} / ${ids.length}`])
      }), false, 'A4');
    };
    box.querySelector('#grp_pub').onclick = ()=>printIt(false);
    box.querySelector('#grp_int').onclick = ()=>printIt(true);
    box.querySelector('#grp_xls').onclick = ()=>{
      const rows = window.__grpRows||[]; if(!rows.length){ toast('لا توجد بيانات'); return; }
      exportToExcel('إتاحة_المجموعة.xlsx', ['التاريخ','اليوم', ...ids.map(tName), 'عدد المتاحين'],
        rows.map(r=>[fmtDate(r.d), dayNameOf(r.d), ...r.st.map(s=>s.k==='busy'?'مشغول: '+s.evs.map(o=>o.title).join('، '):s.l), r.free]),
        `إتاحة مقدّمي المبادرات ${fmtDate(G.F)} — ${fmtDate(G.T)}`);
    };
    chips(); draw();
  });
}

/* ══════ الإلغاء والتأجيل: الطلب يبقى برقمه في النظام + سند إلغاء / سند تأجيل ══════ */
function curUserName(){ return currentUser ? (currentUser.displayName || currentUser.username || '—') : '—'; }
function nowStamp(){ const d=new Date(); return `${dateToISO(d)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function markCancelled(o, reason){
  o.status = 'cancelled';
  o.cancelledAt = nowStamp(); o.cancelledBy = curUserName();
  if(reason!=null) o.cancelReason = String(reason||'').trim();
}
function askCancelReason(n){
  const r = prompt(`سبب إلغاء ${n>1?`${n} طلبات`:'الطلب'} (يُطبع في سند الإلغاء — يمكن تركه فارغًا):\nملاحظة: الطلب لا يُحذف، يبقى في النظام برقمه بحالة «ملغي».`, '');
  return r; /* null = تراجع */
}
function printOrderVoucher(id){
  const o = state.orders.find(x=>x.id===id); if(!o) return;
  const cx = isCancelledOrder(o), pp = !cx && o.status==='postponed';
  if(!cx && !pp){ toast('الطلب ليس ملغيًا ولا مؤجلًا'); return; }
  const sc = state.schools.find(x=>x.id===o.schoolId);
  const sv = sc ? (sc.supervisors||[]).find(x=>x.id===o.supervisorId) : null;
  const trs = (o.trainerIds||[]).map(t=>{ const x=state.trainers.find(y=>y.id===t); return x?x.name:''; }).filter(Boolean).join('، ');
  const fd = state.fields.find(x=>x.id===o.fieldId), pt = state.programTypes.find(x=>x.id===o.programTypeId);
  const dt = (a,b)=> a ? (b && b!==a ? `${fmtDate(a)} — ${fmtDate(b)}` : `${escapeHtml(dayNameOf(a))} ${fmtDate(a)}`) : '—';
  const hist = (state.auditLog||[]).filter(a=>a.orderId===o.id).sort((a,b)=>b.at-a.at);
  const hc = hist.find(a=>a.action==='cancel' || (a.action==='status'&&a.note==='الغيت'));
  const hp = hist.find(a=>a.action==='postpone');
  const atStr = s=>{ if(!s) return '—'; const [d,t]=String(s).split(' '); return `${fmtDate(d)}${t?` الساعة ${t}`:''}`; };
  const fromAudit = a=>{ if(!a) return '—'; const d=new Date(a.at); return `${fmtDate(dateToISO(d))} الساعة ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
  const rows = [
    ['رقم أمر التكليف', `<b style="font-size:13pt">${o.serial}</b>`],
    ['عنوان المبادرة', escapeHtml(o.title||'—')],
    ['المجال / المسار', escapeHtml([fd&&fd.name, pt&&pt.name].filter(Boolean).join(' — ')||'—')],
    ['الجهة الطالبة', escapeHtml(sc?sc.name:'—') + (sv?` — المشرف: ${escapeHtml(sv.name)}${sv.phone?` (${escapeHtml(sv.phone)})`:''}`:'')],
    ['مقدّم المبادرة', escapeHtml(trs||'—')],
  ];
  if(cx){
    rows.push(['تاريخ المبادرة الملغاة', dt(o.date, orderEnd(o)) + (o.timeFrom?` · ${escapeHtml(fullTimeRange(o.timeFrom,o.timeTo))}`:'')]);
    rows.push(['تاريخ الإلغاء', o.cancelledAt ? atStr(o.cancelledAt) : fromAudit(hc)]);
    rows.push(['أُلغي بواسطة', escapeHtml(o.cancelledBy || (hc&&hc.user) || '—')]);
    rows.push(['سبب الإلغاء', escapeHtml(o.cancelReason || (o.completionStatus==='الغيت'?'سُجّل الإنجاز «أُلغيت»':'') || (hc&&hc.note) || '—')]);
  } else {
    rows.push(['الموعد السابق', dt(o.postponedFrom, o.postponedFromTo||o.postponedFrom) + (o.postponedFromTime?` · ${escapeHtml(o.postponedFromTime)}`:'')]);
    rows.push(['الموعد الجديد', `<b>${dt(o.date, orderEnd(o))}</b>` + (o.timeFrom?` · ${escapeHtml(fullTimeRange(o.timeFrom,o.timeTo))}`:'')]);
    rows.push(['تاريخ التأجيل', o.postponedStamp ? atStr(o.postponedStamp) : (o.postponedAt ? fmtDate(o.postponedAt) : fromAudit(hp))]);
    rows.push(['أُجّل بواسطة', escapeHtml(o.postponedBy || (hp&&hp.user) || '—')]);
    rows.push(['سبب التأجيل', escapeHtml(o.postponeReason || '—')]);
  }
  const stampTxt = cx ? 'ملغي' : 'مؤجَّل', stampCol = cx ? '#B3261E' : '#B26A00';
  const extra = `<style>
      .vch{border:1px solid #E6D3DA;border-radius:3mm;overflow:hidden;position:relative;margin-top:2mm}
      .vch table{width:100%;border-collapse:collapse;font-size:11pt}
      .vch td{padding:2.6mm 4mm !important;border-bottom:1px dashed #E6D3DA;vertical-align:top;text-align:right !important}
      .vch td.k{width:46mm;font-weight:800;color:#6B1834;background:#FBF6F8;white-space:nowrap}
      .vch-stamp{position:absolute;left:10mm;top:8mm;transform:rotate(-14deg);border:1.2mm solid ${stampCol};color:${stampCol};
        border-radius:3mm;padding:1.5mm 7mm;font-size:24pt;font-weight:900;opacity:.85;letter-spacing:1mm}
      .vch-note{margin:4mm 0 0;font-size:10pt;color:#555;line-height:1.8}
      .vch-sign{display:flex;justify-content:space-between;gap:10mm;margin-top:12mm;font-size:10.5pt;font-weight:700;color:#6B1834}
      .vch-sign div{flex:1;text-align:center;border-top:1px solid #B08D57;padding-top:2mm}
    </style>
    <div class="vch"><span class="vch-stamp">${stampTxt}</span>
      <table>${rows.map(r=>`<tr><td class="k">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table></div>
    <p class="vch-note">${cx
      ? 'يُفيد هذا السند بإلغاء أمر التكليف المذكور أعلاه، ويبقى الطلب محفوظًا في النظام برقمه وبياناته بحالة «ملغي» ولا يُعاد استخدام رقمه.'
      : 'يُفيد هذا السند بتأجيل أمر التكليف المذكور أعلاه إلى الموعد الجديد، مع بقاء الطلب برقمه نفسه في النظام بحالة «مؤجَّل».'}</p>
    <div class="vch-sign"><div>المختص</div><div>رئيس القسم</div><div>الختم</div></div>`;
  doPrintDoc(buildReportDoc({
    titleAr: cx ? 'سند إلغاء أمر تكليف' : 'سند تأجيل أمر تكليف',
    subtitle: `أمر التكليف رقم ${o.serial}`,
    extraHtml: extra
  }), false, 'A4');
}
function cxPpRegister(kind){
  const L = (state.orders||[]).filter(o=>isCancelledOrder(o) || o.status==='postponed')
    .sort((a,b)=>(Number(a.serial)||0)-(Number(b.serial)||0));
  if(!L.length){ toast('لا توجد طلبات ملغاة أو مؤجلة'); return; }
  const H = ['رقم التكليف','عنوان المبادرة','الجهة','الحالة','الموعد الأصلي','الموعد الجديد','تاريخ الإجراء','بواسطة','السبب'];
  const rows = L.map(o=>{
    const cx = isCancelledOrder(o), sc = state.schools.find(x=>x.id===o.schoolId);
    const h = (state.auditLog||[]).filter(a=>a.orderId===o.id && (cx ? (a.action==='cancel'||(a.action==='status'&&a.note==='الغيت')) : a.action==='postpone')).sort((a,b)=>b.at-a.at)[0];
    const hAt = h ? fmtDate(dateToISO(new Date(h.at))) : '—';
    return cx
      ? [o.serial, o.title||'', sc?sc.name:'—', 'ملغي', fmtDate(o.date), '—', o.cancelledAt?fmtDate(o.cancelledAt.split(' ')[0]):hAt, o.cancelledBy||(h&&h.user)||'—', o.cancelReason||(o.completionStatus==='الغيت'?'أُلغيت (الإنجاز)':'')||'—']
      : [o.serial, o.title||'', sc?sc.name:'—', 'مؤجَّل', o.postponedFrom?fmtDate(o.postponedFrom):'—', fmtDate(o.date), o.postponedAt?fmtDate(o.postponedAt):hAt, o.postponedBy||(h&&h.user)||'—', o.postponeReason||'—'];
  });
  if(kind==='xls'){ exportToExcel('سجل_الملغاة_والمؤجلة.xlsx', H, rows, 'سجل الطلبات الملغاة والمؤجلة'); return; }
  doPrintDoc(buildReportDoc({
    titleAr:'سجل الطلبات الملغاة والمؤجّلة', subtitle:`${L.length} طلب — محفوظة في النظام بأرقامها`,
    kpis:[{v:rows.filter(r=>r[3]==='ملغي').length,l:'ملغاة'},{v:rows.filter(r=>r[3]!=='ملغي').length,l:'مؤجّلة'}],
    headers:H, rows: rows.map(r=>r.map(v=>escapeHtml(String(v))))
  }), true, 'A4');
}

/* ══════════════════════════════════════════════════════════════════
   الأمان: الدخول عبر Firebase Authentication
   ──────────────────────────────────────────────────────────────────
   • كل مستخدم في النظام يقابله حساب في Firebase Auth (بريد داخلي مشتق
     من اسم المستخدم — لا يُرسل إليه شيء).
   • قائمة الأعضاء المسموح لهم بالبيانات: appAccess/members {uids:[...]}
   • رقم «جيل» الحساب عند تغيير كلمة المرور: appLogin/gen {hash: n}
     (عامّ القراءة، لا يحوي أسماء ولا كلمات مرور).
   • بعد ترحيل الجميع تُمسح كلمات المرور من قاعدة البيانات نهائيًا.
   ══════════════════════════════════════════════════════════════════ */
const AUTH_DOMAIN_SUFFIX = '@users.bramig-eid.app';
const ACCESS_DOC = () => getDb().collection('appAccess').doc('members');
const GEN_DOC    = () => getDb().collection('appLogin').doc('gen');
let __locked = false;          /* قاعدة البيانات رفضت القراءة قبل الدخول (القواعد مفعّلة) */
function fbAuth(){ getDb(); if(typeof firebase.auth!=='function') throw new Error('auth sdk missing'); return firebase.auth(); }
function authPw(p){ return 'bE#' + String(p) + '#bE'; }   /* يضمن الحد الأدنى (6 أحرف) */
async function userHash(u){
  const b = new TextEncoder().encode(String(u||'').trim().toLowerCase());
  const h = await crypto.subtle.digest('SHA-256', b);
  return Array.from(new Uint8Array(h)).map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,24);
}
async function authEmailFor(username, gen){
  const h = await userHash(username);
  return `u${h}${gen && gen>1 ? '-g'+gen : ''}${AUTH_DOMAIN_SUFFIX}`;
}
async function readGenMap(){ try{ const s = await GEN_DOC().get(); return (s.exists && s.data()) || {}; }catch(e){ return {}; } }
async function addMember(uid){ await ACCESS_DOC().set({uids: firebase.firestore.FieldValue.arrayUnion(uid)}, {merge:true}); }
async function removeMember(uid){ if(uid) await ACCESS_DOC().set({uids: firebase.firestore.FieldValue.arrayRemove(uid)}, {merge:true}); }
/* تطبيق ثانوي لإنشاء حسابات الآخرين دون تسجيل خروج المدير */
function auxAuth(){
  let app = firebase.apps.find(a=>a.name==='aux');
  if(!app) app = firebase.initializeApp(firebaseConfig, 'aux');
  return app.auth();
}
/* ينشئ (أو يعثر على) حساب Firebase لمستخدم بكلمة مرور معلومة — يعيد uid */
async function provisionAuthUser(u, password, gen){
  const A = auxAuth(), email = await authEmailFor(u.username, gen||1);
  let cred;
  try{ cred = await A.createUserWithEmailAndPassword(email, authPw(password)); }
  catch(e){
    if(e && e.code==='auth/email-already-in-use'){ cred = await A.signInWithEmailAndPassword(email, authPw(password)); }
    else throw e;
  }
  const uid = cred.user.uid; await A.signOut().catch(()=>{});
  return uid;
}
function authMigratedAll(){ return (state.users||[]).every(u=>u.authUid); }
function stripPasswordsIfLocked(){
  if(state && state.authMode==='firebase') (state.users||[]).forEach(u=>{ if('password' in u) delete u.password; });
}

/* ══ الدخول ══ */
async function doLoginSecure(u, p, match, fail, done){
  const users = (state && Array.isArray(state.users)) ? state.users : [];
  const rec = users.find(x=>String(x.username||'').trim().toLowerCase()===u.toLowerCase());
  const genMap = await readGenMap();
  const h = await userHash(u);
  const gen = (rec && rec.authGen) || genMap[h] || 1;
  const email = await authEmailFor(u, gen);
  let A = null;
  try{ A = fbAuth(); }catch(e){}
  if(!A || typeof A.signInWithEmailAndPassword!=='function'){
    /* مكتبة الدخول لم تُحمَّل (حجب شبكة/إضافة) — قبل قفل القواعد نكمل بالطريقة القديمة */
    return match ? done(match) : fail('تعذّر تحميل خدمة الدخول — حدّث الصفحة');
  }
  try{
    const cred = await A.signInWithEmailAndPassword(email, authPw(p));
    /* بعد الدخول: حمّل البيانات إن كانت مقفلة */
    if(__locked || __readFailed || !users.length){ __locked=false; __readFailed=false; await loadState(); }
    const r2 = (state.users||[]).find(x=>String(x.username||'').trim().toLowerCase()===u.toLowerCase());
    if(!r2){ await A.signOut(); return fail('هذا الحساب غير موجود في قائمة المستخدمين'); }
    if(r2.authUid && r2.authUid!==cred.user.uid){ await A.signOut(); return fail('كلمة المرور قديمة — استخدم كلمة المرور الحالية'); }
    if(!r2.authUid){ r2.authUid = cred.user.uid; r2.authGen = gen; try{ await addMember(cred.user.uid); }catch(e){} saveState(); }
    return done(r2);
  }catch(e){
    const code = e && e.code || '';
    if(code==='auth/network-request-failed') return fail('تعذّر الاتصال — تحقق من الإنترنت');
    if(code==='auth/too-many-requests') return fail('محاولات كثيرة — انتظر قليلًا ثم أعد المحاولة');
    if(code==='auth/operation-not-allowed' || code==='auth/configuration-not-found'){
      /* الدخول عبر Firebase غير مفعّل بعد في المشروع — نكمل بالطريقة القديمة */
      return match ? done(match) : fail('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
    /* ترحيل تلقائي: الحساب لم يُنشأ بعد، وكلمة المرور القديمة صحيحة */
    if(match && !match.authUid){
      try{
        const cred = await A.createUserWithEmailAndPassword(email, authPw(p));
        match.authUid = cred.user.uid; match.authGen = gen;
        try{ await addMember(cred.user.uid); }catch(x){}
        saveState();
        return done(match);
      }catch(x){
        if(x && x.code==='auth/operation-not-allowed') return done(match);
        console.warn('auth migrate', x);
        return done(match);     /* لا نمنع الدخول أثناء فترة الترحيل */
      }
    }
    if(match) return done(match);   /* قبل قفل القواعد: نسمح بالطريقة القديمة */
    return fail(__locked ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : (rec ? 'كلمة المرور غير صحيحة' : 'اسم المستخدم غير موجود'));
  }
}

/* ══ إدارة المستخدمين بعد الترحيل ══ */
async function setUserPassword(u, newPw){
  const gen = (u.authGen||1) + (u.authUid ? 1 : 0);
  const oldUid = u.authUid;
  const uid = await provisionAuthUser(u, newPw, gen);
  await addMember(uid);
  if(oldUid && oldUid!==uid) await removeMember(oldUid);
  u.authUid = uid; u.authGen = gen;
  const h = await userHash(u.username);
  await GEN_DOC().set({[h]: gen}, {merge:true});
  if(state.authMode!=='firebase') u.password = newPw; else delete u.password;
}

/* ══ لوحة الأمان (الإعدادات ← الأمان) ══ */
function renderSecurityTab(c){
  const users = state.users||[];
  const done = users.filter(u=>u.authUid).length;
  const locked = state.authMode==='firebase';
  const rules = securityRulesText();
  c.innerHTML = `<div class="card sec">
    <h2>${icon('shield',17)} أمان الدخول والبيانات</h2>
    <ol class="sec-steps">
      <li class="${done===users.length?'ok':''}"><b>ترحيل الحسابات إلى Firebase</b> — ${done} من ${users.length} مستخدم
        ${done<users.length?`<div><button class="btn btn-primary btn-sm" id="sec_migrate">${icon('refresh',14)} ترحيل كل الحسابات الآن</button></div>`:''}</li>
      <li class="${locked?'ok':''}"><b>مسح كلمات المرور من قاعدة البيانات</b>
        ${locked?' — تم':`<div><button class="btn btn-outline btn-sm" id="sec_strip" ${done<users.length?'disabled':''}>${icon('trash',14)} مسح كلمات المرور</button>
        <span class="helper">يتاح بعد ترحيل الجميع. بعده لا تُحفظ أي كلمة مرور في النظام.</span></div>`}</li>
      <li><b>تفعيل قواعد الحماية في Firebase Console</b> — تُلصق في Firestore ← Rules:
        <pre class="sec-rules" dir="ltr">${escapeHtml(rules)}</pre>
        <button class="btn btn-outline btn-sm" id="sec_copy">${icon('copy',14)} نسخ القواعد</button></li>
    </ol>
    <table class="audit-tbl"><thead><tr><th>المستخدم</th><th>الدور</th><th>حساب Firebase</th></tr></thead><tbody>
      ${users.map(u=>`<tr><td>${escapeHtml(u.displayName||u.username)} <small dir="ltr">(${escapeHtml(u.username)})</small></td><td>${u.role==='admin'?'مدير نظام':u.role==='user'?'مستخدم':'مقدم فعالية'}</td>
        <td>${u.authUid?'<span class="badge ok">مُرحَّل</span>':'<span class="badge bad">لم يُرحَّل</span>'}</td></tr>`).join('')}
    </tbody></table></div>`;
  const mg = c.querySelector('#sec_migrate');
  if(mg) mg.onclick = async ()=>{
    mg.disabled = true; let ok=0, bad=[];
    for(const u of users){
      if(u.authUid) continue;
      if(!u.password){ bad.push(u.username+' (بلا كلمة مرور)'); continue; }
      mg.textContent = `جارٍ ترحيل ${u.username}…`;
      try{ u.authUid = await provisionAuthUser(u, u.password, 1); u.authGen = 1; await addMember(u.authUid); ok++; }
      catch(e){ bad.push(`${u.username} (${e.code||e.message})`); }
    }
    /* المستخدم الحالي ضمن الأعضاء أيضًا */
    try{ const cu = fbAuth().currentUser; if(cu) await addMember(cu.uid); }catch(e){}
    await saveState();
    alert(`تم ترحيل ${ok} حساب.` + (bad.length?`\n\nتعذّر:\n${bad.join('\n')}`:''));
    render();
  };
  const st = c.querySelector('#sec_strip');
  if(st) st.onclick = async ()=>{
    if(!authMigratedAll()){ toast('رحّل كل الحسابات أولًا'); return; }
    if(!fbAuth().currentUser){ alert('سجّل الخروج ثم ادخل من جديد أولًا، ليتأكد النظام أن دخولك عبر Firebase يعمل.'); return; }
    if(!confirm('سيتم حذف كلمات المرور من قاعدة البيانات نهائيًا، ويصبح الدخول عبر Firebase فقط.\nتأكد أنك تعرف كلمات مرور المستخدمين (لن تظهر بعد الآن).\nمتابعة؟')) return;
    state.authMode = 'firebase'; stripPasswordsIfLocked();
    await saveState(); toast('تم مسح كلمات المرور — الدخول الآن عبر Firebase فقط'); render();
  };
  c.querySelector('#sec_copy').onclick = ()=>{ navigator.clipboard.writeText(rules).then(()=>toast('تم نسخ القواعد')); };
}
function securityRulesText(){
  return `// Events system (طلبات الفعاليات والبرامج) rules
function isMember() {
  return request.auth != null &&
    request.auth.uid in get(/databases/$(database)/documents/appAccess/members).data.uids;
}
match /appState/{doc} {
  allow read, write: if isMember();
}
match /appAccess/{doc} {
  allow read: if request.auth != null;
  allow write: if isMember();
}
match /appLogin/{doc} {
  allow read: if true;
  allow write: if isMember();
}`;
}

/* ══════════════════════════════════════════════════════════════════
   أرشيف الأعوام داخل النظام (Firestore) + النسخة الاحتياطية اليومية
   • طلبات عام منتهٍ تُنقل إلى مستندات مستقلة appState/arch_<key>_p<n>
     بأرقامها كما هي، ويبقى المستند الرئيسي خفيفًا (حدّ Firestore: 1MB).
   • عرض الأرشيف للقراءة فقط: تقارير وبحث وطباعة كالمعتاد.
   ══════════════════════════════════════════════════════════════════ */
const ARCH_CHUNK = 700000;
let __archMode = null;     /* {key,label,savedOrders,savedAudit} أثناء عرض أرشيف */
function stateBytes(){ try{ return new TextEncoder().encode(JSON.stringify(state)).length; }catch(e){ return 0; } }
function fmtKB(n){ return (n/1024).toLocaleString('en',{maximumFractionDigits:0}) + ' KB'; }
async function archiveWrite(meta, payload){
  const txt = JSON.stringify(payload);
  const parts = Math.max(1, Math.ceil(txt.length / ARCH_CHUNK));
  const col = getDb().collection('appState');
  for(let i=0;i<parts;i++){
    await col.doc(`arch_${meta.key}_p${i}`).set({chunk: txt.slice(i*ARCH_CHUNK, (i+1)*ARCH_CHUNK), i, updatedAt: Date.now()});
  }
  await col.doc(`arch_${meta.key}`).set(Object.assign({}, meta, {parts, bytes: txt.length, updatedAt: Date.now()}));
  return parts;
}
async function archiveRead(key){
  const col = getDb().collection('appState');
  const ix = await col.doc(`arch_${key}`).get();
  if(!ix.exists) throw new Error('الأرشيف غير موجود');
  const meta = ix.data(); let txt = '';
  for(let i=0;i<meta.parts;i++){ const d = await col.doc(`arch_${key}_p${i}`).get(); txt += (d.data()||{}).chunk || ''; }
  return {meta, data: JSON.parse(txt)};
}
/* ── نافذة «أرشيف الأعوام» ── */
function openYearArchive(){
  const archives = state.archives || [];
  const preset = {key:'2025-2026', label:'2025/2026', to:'2026-05-31'};
  const isAdmin = currentRole==='admin';
  const bytes = stateBytes(), pct = Math.round(bytes/1048576*100);
  showInfoModal(`${icon('inbox',17)} أرشيف الأعوام الدراسية`, `<div class="ya">
    <div class="ya-size ${pct>=75?'warn':''}"><span>حجم بيانات العام الحالي</span><b>${fmtKB(bytes)}</b><span>من 1024 KB (${pct}%)</span>
      <i style="--p:${Math.min(pct,100)}%"></i></div>
    <h4>الأعوام المؤرشفة</h4>
    ${archives.length ? `<div class="ya-list">${archives.map(a=>`<div class="ya-row"><div><b>العام ${escapeHtml(a.label)}</b><small>${a.count} طلب · حتى ${fmtDate(a.to)} · أُرشف ${fmtDate(String(a.archivedAt||'').slice(0,10))}</small></div>
        <button class="pk-btn pri" data-open="${a.key}">${icon('eye',14)} عرض</button></div>`).join('')}</div>`
      : `<div class="pk-empty">لا توجد أعوام مؤرشفة بعد.</div>`}
    ${isAdmin ? `<h4>أرشفة عام منتهٍ</h4>
    <div class="ya-form">
      <label>اسم العام <input id="ya_label" value="${preset.label}"></label>
      <label>تشمل الطلبات حتى تاريخ <input type="date" id="ya_to" value="${preset.to}"></label>
      <div class="ya-cnt" id="ya_cnt"></div>
      <button class="pk-btn pri" id="ya_go">${icon('inbox',14)} أرشفة الآن</button>
    </div>
    <div class="helper">تُنقل الطلبات بأرقامها كما هي إلى أرشيف مستقل داخل النظام (لا تُحذف)، ويبقى الترقيم متسلسلًا. تُنزَّل نسخة احتياطية كاملة تلقائيًا قبل النقل.</div>` : ''}
  </div>`, box=>{
    box.style.maxWidth = '620px';
    box.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{ closeModal(); enterArchive(b.dataset.open); });
    if(!isAdmin) return;
    const cnt = ()=>{ const to = box.querySelector('#ya_to').value; const n = (state.orders||[]).filter(o=>o.date && o.date<=to).length;
      box.querySelector('#ya_cnt').innerHTML = `سيُنقل <b>${n}</b> طلب (كل الطلبات التي تاريخها حتى ${fmtDate(to)})`; return n; };
    box.querySelector('#ya_to').onchange = cnt; cnt();
    box.querySelector('#ya_go').onclick = async ()=>{
      const to = box.querySelector('#ya_to').value, label = box.querySelector('#ya_label').value.trim() || to.slice(0,4);
      const key = label.replace(/[^\d]+/g,'-').replace(/^-|-$/g,'') || to;
      const list = (state.orders||[]).filter(o=>o.date && o.date<=to);
      if(!list.length){ toast('لا توجد طلبات في هذه الفترة'); return; }
      if((state.archives||[]).some(a=>a.key===key)){ toast('يوجد أرشيف بهذا الاسم — غيّر اسم العام'); return; }
      if(!confirm(`سيُنقل ${list.length} طلب (حتى ${fmtDate(to)}) إلى أرشيف العام ${label}.\nتبقى بأرقامها، ويمكن عرضها وطباعتها في أي وقت.\nستُنزَّل نسخة احتياطية كاملة أولًا.\n\nمتابعة؟`)) return;
      const btn = box.querySelector('#ya_go'); btn.disabled = true;
      try{
        downloadBackup();
        btn.textContent = 'جارٍ حفظ الأرشيف…';
        const ids = new Set(list.map(o=>o.id));
        const audit = (state.auditLog||[]).filter(a=>ids.has(a.orderId));
        const meta = {key, label, to, count:list.length, archivedAt:new Date().toISOString(), by: curUserName()};
        await archiveWrite(meta, {orders:list, auditLog:audit, meta});
        btn.textContent = 'جارٍ التحقق…';
        const back = await archiveRead(key);
        if(!back.data || (back.data.orders||[]).length!==list.length) throw new Error('التحقق من الأرشيف فشل — لم يُنقل شيء');
        /* بعد التحقق فقط: إزالة من العام الحالي */
        const mx = (state.orders||[]).reduce((m,o)=>Math.max(m, Number(o.serial)||0), 0);
        state.nextSerial = Math.max(Number(state.nextSerial)||1, mx+1);
        state.orders = state.orders.filter(o=>!ids.has(o.id));
        state.auditLog = (state.auditLog||[]).filter(a=>!ids.has(a.orderId));
        state.archives = (state.archives||[]).concat([meta]);
        state.archivedIds = (state.archivedIds||[]).concat(list.map(o=>o.id));
        logAudit('archive', null, `أرشفة العام ${label}: ${list.length} طلب`, true);
        await saveState();
        alert(`تمت أرشفة ${list.length} طلب في «أرشيف العام ${label}».\nحجم بيانات العام الحالي الآن: ${fmtKB(stateBytes())}`);
        closeModal(); render();
      }catch(e){ console.error(e); alert('تعذّرت الأرشفة: '+(e.message||e.code)+'\nلم يُحذف أي طلب من العام الحالي.'); btn.disabled=false; btn.textContent='أرشفة الآن'; }
    };
  });
}
/* ── عرض أرشيف (للقراءة فقط) ── */
async function enterArchive(key){
  if(__archMode) exitArchive(true);
  toast('جارٍ تحميل الأرشيف…');
  let res; try{ res = await archiveRead(key); }catch(e){ alert('تعذّر تحميل الأرشيف: '+(e.message||e.code)); return; }
  __archMode = {key, label: res.meta.label, savedOrders: state.orders, savedAudit: state.auditLog};
  state.orders = res.data.orders || [];
  state.auditLog = (state.auditLog||[]).concat(res.data.auditLog||[]);
  let bar = document.getElementById('archBar');
  if(!bar){ bar = document.createElement('div'); bar.id='archBar'; document.body.appendChild(bar); }
  bar.innerHTML = `${icon('inbox',16)} <span>تعرض الآن <b>أرشيف العام ${escapeHtml(res.meta.label)}</b> — ${state.orders.length} طلب · للقراءة والطباعة فقط</span>
    <button type="button" onclick="exitArchive()">${icon('arrowRight',14)} العودة للعام الحالي</button>`;
  document.body.classList.add('arch-mode');
  currentPage = 'ordersList'; render();
}
function exitArchive(silent){
  if(!__archMode) return;
  state.orders = __archMode.savedOrders; state.auditLog = __archMode.savedAudit;
  __archMode = null;
  document.body.classList.remove('arch-mode');
  const bar = document.getElementById('archBar'); if(bar) bar.remove();
  if(!silent){ render(); retryConnection(); }
}
/* ── رسالة النسخ الاحتياطي عند أول دخول في اليوم ── */
function dailyBackupPrompt(){
  if(currentRole!=='admin' && currentRole!=='user') return;
  const today = todayStr();
  let shown=''; try{ shown = localStorage.getItem('dailyBackupShown')||''; }catch(e){}
  if(shown===today) return;
  try{ localStorage.setItem('dailyBackupShown', today); }catch(e){}
  let last=''; try{ last = localStorage.getItem('backup_dl_at')||''; }catch(e){}
  const days = last ? Math.round((new Date(today) - new Date(last.slice(0,10)))/86400000) : null;
  const endedYear = currentRole==='admin' && (()=>{ const t=new Date(today); const y=t.getMonth()>=5 ? t.getFullYear() : t.getFullYear()-1;
      const cut = `${y}-05-31`; return (state.orders||[]).some(o=>o.date && o.date<=cut) ? cut : ''; })();
  setTimeout(()=>showInfoModal(`${icon('shield',17)} النسخة الاحتياطية اليومية`, `<div class="dbk">
      <p>${new Date().getHours()<12?'صباح الخير':'مساء الخير'}${currentUser&&currentUser.displayName?' '+escapeHtml(currentUser.displayName):''} — هذا أول دخول لك اليوم.</p>
      <div class="dbk-st ${days===null||days>=7?'warn':''}">${last ? `آخر نسخة احتياطية نُزّلت من هذا الجهاز: <b>${fmtDate(last.slice(0,10))}</b>${days?` (قبل ${days} يوم)`:' (اليوم)'}` : 'لم تُنزَّل أي نسخة احتياطية من هذا الجهاز بعد.'}</div>
      <p class="helper">النسخة ملف واحد فيه كل بيانات العام الحالي (${(state.orders||[]).length} طلب). احفظه في مجلد آمن أو على Google Drive.</p>
      ${endedYear ? `<div class="dbk-st">يوجد طلبات من عام دراسي منتهٍ (حتى ${fmtDate(endedYear)}) — يمكنك نقلها إلى الأرشيف من «أرشيف الأعوام».</div>`:''}
      <div class="dbk-acts"><button class="pk-btn pri" id="dbk_go">${icon('download',15)} تنزيل نسخة احتياطية الآن</button>
        ${endedYear?`<button class="pk-btn" id="dbk_arch">${icon('inbox',15)} أرشيف الأعوام</button>`:''}
      </div></div>`, box=>{
      box.style.maxWidth = '480px';
      box.querySelector('#dbk_go').onclick = ()=>{ downloadBackup(); closeModal(); };
      const ar = box.querySelector('#dbk_arch'); if(ar) ar.onclick = ()=>{ closeModal(); openYearArchive(); };
    }), 700);
}

function _pnz(s){ return String(s||'').replace(/[ً-ْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').toLowerCase().trim(); }
function _ptoks(s){ return _pnz(s).split(/[^ء-يa-z0-9]+/).filter(w=>w.length>1).map(w=>w.replace(/^(وال|بال|لل|ال)/,'')).filter(w=>w.length>1); }
function pathKeywords(p){
  const base = PATH_HINT_RULES.filter(r=>r[0].test(p.name)).map(r=>r[1]).join(' ');
  const own = String(p.keywords||'').replace(/[،,]/g,' ');
  return Array.from(new Set(_ptoks(base+' '+own+' '+p.name)));
}
function suggestPath(title, others){
  const toks = _ptoks(title); if(!toks.length) return null;
  const nt = _pnz(title);
  const scores = (state.programTypes||[]).map(p=>{
    const kws = pathKeywords(p); const hits = [];
    let sc = 0;
    kws.forEach(k=>{ if(toks.includes(k)){ sc += 2; hits.push(k); } else if(k.length>=4 && toks.some(t=>t.startsWith(k)||k.startsWith(t)&&t.length>=4)){ sc += 1; hits.push(k); } });
    return {p, sc, hits};
  }).sort((a,b)=>b.sc-a.sc);
  if(scores.length && scores[0].sc>0){
    const top = scores[0], second = scores[1] ? scores[1].sc : 0;
    const words = String(title).split(/\s+/).filter(Boolean);
    const shown = Array.from(new Set(top.hits.map(k=>words.find(w=>{ const t=_ptoks(w)[0]||''; return t===k || (k.length>=4 && (t.startsWith(k)||k.startsWith(t))); }) || k))).slice(0,3);
    return {id: top.p.id, name: top.p.name, conf: top.sc - second >= 2 ? 'high' : top.sc>second ? 'mid' : 'low', why: shown.join('، ')};
  }
  /* لا كلمات دالّة: نستأنس بالمسار الغالب لنفس العنوان */
  if(others){
    const same = others.filter(o=>_pnz(o.title)===nt && o.programTypeId);
    if(same.length>=2){
      const cnt = {}; same.forEach(o=>cnt[o.programTypeId]=(cnt[o.programTypeId]||0)+1);
      const [id, n] = Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
      const p = state.programTypes.find(x=>x.id===id);
      if(p && n/same.length>=0.6) return {id, name:p.name, conf:'mid', why:`عناوين مطابقة (${n})`};
    }
  }
  return null;
}
function openPathFixer(){
  let showAll = false, q = '';
  const overlay=document.getElementById('modalOverlay'), box=document.getElementById('modalBox');
  const compute = ()=>state.orders.filter(o=>o.title).map(o=>{ const s = suggestPath(o.title, state.orders); return {o, s, diff: !!(s && s.id!==o.programTypeId)}; });
  function draw(){
    const all = compute();
    const diffs = all.filter(r=>r.diff);
    const nq = _pnz(q);
    const rows = (showAll ? all : diffs).filter(r=>!nq || _pnz(r.o.title).includes(nq) || String(r.o.serial)===q.trim())
      .sort((a,b)=>({high:0,mid:1,low:2}[(a.s||{}).conf]??3) - ({high:0,mid:1,low:2}[(b.s||{}).conf]??3));
    const pName = id => { const p=state.programTypes.find(x=>x.id===id); return p?p.name:'—'; };
    box.innerHTML = `<h3>${icon('activity',17)} تصحيح مسارات المبادرة من العناوين</h3>
      <div class="helper" style="margin:6px 0 10px;">قرأ النظام عناوين ${all.length} مبادرة واقترح المسار الأقرب لكل عنوان. <b>${diffs.length}</b> مبادرة مسارها الحالي يختلف عن المقترح. راجع، عدّل الاختيار إن لزم، ثم طبّق المحدد. لا يتغيّر شيء قبل الضغط على «تطبيق».</div>
      <details class="pf-kw"><summary>${icon('edit',14)} الكلمات الدالّة لكل مسار (أضف كلماتك لتحسين الاقتراح)</summary>
        <div class="pf-kwgrid">${state.programTypes.map(p=>`<div class="pf-kwrow"><b>${escapeHtml(p.name)}</b>
          <i>${escapeHtml(PATH_HINT_RULES.filter(r=>r[0].test(p.name)).map(r=>r[1]).join(' ').split(' ').slice(0,10).join('، ')||'لا كلمات افتراضية')}</i>
          <input data-kw="${p.id}" value="${escapeHtml(p.keywords||'')}" placeholder="كلمات إضافية مفصولة بفاصلة..."></div>`).join('')}</div>
        <button class="btn btn-outline btn-sm" id="pf_kwSave" style="margin-top:8px;">${icon('save',14)} حفظ الكلمات وإعادة الاقتراح</button>
      </details>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0;">
        <input id="pf_q" placeholder="بحث بالعنوان أو الرقم..." value="${escapeHtml(q)}" style="flex:1;min-width:180px;">
        <span class="view-seg"><button type="button" data-pf="diff" class="${showAll?'':'on'}">المختلفة (${diffs.length})</button>
          <button type="button" data-pf="all" class="${showAll?'on':''}">الكل (${all.length})</button></span>
      </div>
      <div style="max-height:46vh;overflow:auto;border:1px solid var(--ds-line);border-radius:10px;">
      <table class="set-table pf-tbl"><thead><tr><th style="width:34px;"><input type="checkbox" id="pf_all"></th><th>#</th>
        <th style="text-align:right;">عنوان المبادرة</th><th>المسار الحالي</th><th>المسار المقترح</th><th>الثقة</th><th style="text-align:right;">السبب</th></tr></thead>
      <tbody>${rows.length ? rows.map(r=>`<tr data-id="${r.o.id}">
        <td><input type="checkbox" class="pf-ck" ${r.diff && r.s.conf==='high'?'checked':''}></td>
        <td><span class="badge">${r.o.serial}</span></td>
        <td style="text-align:right;font-weight:700;">${escapeHtml(r.o.title)}</td>
        <td>${escapeHtml(pName(r.o.programTypeId))}</td>
        <td><select class="pf-sel">${state.programTypes.map(p=>`<option value="${p.id}" ${(r.s?r.s.id:r.o.programTypeId)===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select></td>
        <td>${r.s?`<span class="pf-c ${r.s.conf}">${{high:'عالية',mid:'متوسطة',low:'ضعيفة'}[r.s.conf]}</span>`:'<span class="helper">—</span>'}</td>
        <td style="text-align:right;" class="helper">${r.s?escapeHtml(r.s.why):'لا كلمة دالّة'}</td></tr>`).join('')
        : `<tr><td colspan="7"><div class="empty-state">${showAll?'لا توجد مبادرات':'كل المسارات متوافقة مع العناوين'}</div></td></tr>`}</tbody></table></div>
      <div class="modal-actions" style="justify-content:space-between;">
        <button class="btn btn-outline" id="pf_close">إغلاق</button>
        <button class="btn btn-primary" id="pf_apply">${icon('check',15)} <span>تطبيق المحدد (<span id="pf_n">0</span>)</span></button>
      </div>`;
    box.style.maxWidth = '1040px';
    const upd = ()=>{ box.querySelector('#pf_n').textContent = box.querySelectorAll('.pf-ck:checked').length; };
    box.querySelectorAll('.pf-ck').forEach(c=>c.onchange=upd);
    box.querySelectorAll('.pf-sel').forEach(s=>s.onchange=()=>{ const ck=s.closest('tr').querySelector('.pf-ck'); ck.checked=true; upd(); });
    box.querySelector('#pf_all').onchange = e=>{ box.querySelectorAll('.pf-ck').forEach(c=>c.checked=e.target.checked); upd(); };
    box.querySelectorAll('[data-pf]').forEach(b=>b.onclick=()=>{ showAll = b.dataset.pf==='all'; draw(); });
    const qi = box.querySelector('#pf_q'); qi.oninput = ()=>{ q = qi.value; clearTimeout(qi.__t); qi.__t = setTimeout(()=>{ draw(); const n=box.querySelector('#pf_q'); n.focus(); n.setSelectionRange(n.value.length,n.value.length); }, 250); };
    box.querySelector('#pf_close').onclick = closeModal;
    box.querySelector('#pf_kwSave').onclick = async ()=>{
      box.querySelectorAll('[data-kw]').forEach(inp=>{ const p = state.programTypes.find(x=>x.id===inp.dataset.kw); if(p) p.keywords = inp.value.trim(); });
      await saveState(); toast('حُفظت الكلمات الدالّة'); draw();
      const d = box.querySelector('.pf-kw'); if(d) d.open = true;
    };
    box.querySelector('#pf_apply').onclick = async ()=>{
      const picks = Array.from(box.querySelectorAll('tbody tr[data-id]')).filter(tr=>tr.querySelector('.pf-ck').checked)
        .map(tr=>({o: state.orders.find(x=>x.id===tr.dataset.id), to: tr.querySelector('.pf-sel').value})).filter(x=>x.o && x.o.programTypeId!==x.to);
      if(!picks.length){ toast('لا تغييرات محددة'); return; }
      if(!confirm(`سيتغيّر مسار ${picks.length} مبادرة. متابعة؟`)) return;
      picks.forEach(x=>{ const from = pName(x.o.programTypeId); x.o.programTypeId = x.to; logAudit('edit', x.o, `المسار: ${from} ← ${pName(x.to)}`, true); });
      await saveState(); toast(`عُدّل مسار ${picks.length} مبادرة`); draw();
    };
    upd();
  }
  overlay.classList.add('open'); overlay.onclick = e=>{ if(e.target===overlay) closeModal(); };
  draw();
}

/* ══════════════════════════════════════════════════════════════════
   فعاليات يشارك فيها أكثر من مقدّم مبادرة (خلال فترة جدول المقدّمين)
   ══════════════════════════════════════════════════════════════════ */
function multiTrainerRows(orders){
  return orders.filter(o=>(o.trainerIds||[]).filter(Boolean).length >= 2)
    .sort((a,b)=>(a.date||'').localeCompare(b.date||'') || (a.timeFrom||'').localeCompare(b.timeFrom||''));
}
function bindMultiTrainer(box, orders, F, T){
  const list = multiTrainerRows(orders);
  const trs = o => (o.trainerIds||[]).map(id=>state.trainers.find(t=>t.id===id)).filter(Boolean);
  const reqs = o => (o.adminRequests||[]).map(id=>{ const r=state.adminRequestsList.find(x=>x.id===id); return r?r.name:''; }).filter(Boolean);
  const timeTxt = o => (o.timeFrom||o.timeTo) ? `من الساعة ${o.timeFrom||'—'} إلى الساعة ${o.timeTo||'—'}` : '—';
  const dateTxt = o => o.dateTo && o.dateTo!==o.date ? `${fmtDateRaw(o.date)} — ${fmtDateRaw(o.dateTo)}` : fmtDateRaw(o.date);
  const COLS = ['#','الفعالية','التاريخ','الوقت','الجهة / المكان','مقدّمو المبادرة','الجوال','الطلبات الإدارية'];
  box.innerHTML = `<h2>${icon('users',15)} فعاليات يشارك فيها أكثر من مقدّم — ${list.length} ${eventWord(list.length)}
      <span style="display:inline-flex;gap:6px;">
        <button class="icon-btn" id="mt_print" title="طباعة" aria-label="طباعة" style="width:32px;height:32px;padding:0;">${icon('printer',15)}</button>
        <button class="icon-btn" id="mt_excel" title="تنزيل Excel" aria-label="تنزيل Excel" style="width:32px;height:32px;padding:0;">${icon('sheet',15)}</button>
      </span></h2>
    <div class="helper" style="margin-bottom:10px;">الفعاليات التي أُسند إليها مقدّمان أو أكثر — من ${fmtDateRaw(F)} إلى ${fmtDateRaw(T)}.</div>
    ${list.length ? `<div class="tbl-scroll"><table class="mt-tbl" style="font-size:12.5px;width:100%;"><thead><tr>
      ${COLS.map((c,i)=>`<th${i===1||i===4||i===5?' style="text-align:right;"':''}>${c}</th>`).join('')}</tr></thead><tbody>
      ${list.map(o=>{ const sc = state.schools.find(x=>x.id===o.schoolId); const t = trs(o);
        return `<tr>
        <td><span class="badge">${o.serial}</span></td>
        <td style="text-align:right;font-weight:700;"><a href="#" onclick="viewOrderReadOnly('${o.id}');return false;" style="color:inherit;">${escapeHtml(o.title||'')}</a></td>
        <td style="white-space:nowrap;">${dayNameOf(o.date)}<br><b>${dateTxt(o)}</b></td>
        <td style="white-space:nowrap;">${escapeHtml(timeTxt(o))}</td>
        <td style="text-align:right;">${escapeHtml(sc?sc.name:'—')}${o.venue?`<div class="helper">مكان التنفيذ: ${escapeHtml(o.venue)}</div>`:''}</td>
        <td style="text-align:right;">${t.map(x=>`<div class="cw-tr">${icon('user',12)} ${escapeHtml(x.name)}</div>`).join('')}</td>
        <td style="white-space:nowrap;direction:ltr;">${t.map(x=>escapeHtml(x.phone||'—')).join('<br>')}</td>
        <td>${reqs(o).map(r=>`<span class="badge">${escapeHtml(r)}</span>`).join(' ')||'—'}</td></tr>`; }).join('')}
    </tbody></table></div>` : `<div class="empty-state">لا توجد فعاليات بأكثر من مقدّم خلال هذه الفترة</div>`}`;
  box.querySelector('#mt_print').onclick = ()=>{
    if(!list.length){ toast('لا توجد بيانات'); return; }
    doPrintDoc(buildReportDoc({ titleAr:'فعاليات يشارك فيها أكثر من مقدّم مبادرة',
      subtitle:`من ${fmtDateRaw(F)} إلى ${fmtDateRaw(T)}`,
      kpis:[{v:list.length,l:'📋 الفعاليات'},{v:new Set(list.flatMap(o=>o.trainerIds||[])).size,l:'👥 المقدّمون'}],
      headers: COLS, colWidths:['10mm','52mm','28mm','42mm','52mm','46mm','24mm','auto'],
      rows: list.map(o=>{ const sc = state.schools.find(x=>x.id===o.schoolId); const t = trs(o);
        return [String(o.serial), escapeHtml(o.title||''), `${dayNameOf(o.date)}<br>${dateTxt(o)}`, escapeHtml(timeTxt(o)),
          escapeHtml(sc?sc.name:'—') + (o.venue?`<br><span style="color:#777;">${escapeHtml(o.venue)}</span>`:''),
          t.map(x=>escapeHtml(x.name)).join('<br>'), t.map(x=>escapeHtml(x.phone||'—')).join('<br>'), escapeHtml(reqs(o).join('، ')||'—')]; })
    }), true, 'A4');
  };
  box.querySelector('#mt_excel').onclick = ()=>{
    if(!list.length){ toast('لا توجد بيانات'); return; }
    exportToExcel(`فعاليات_بأكثر_من_مقدم_${F}_${T}.xlsx`, COLS, list.map(o=>{ const sc = state.schools.find(x=>x.id===o.schoolId); const t = trs(o);
      return [o.serial, o.title||'', dateTxt(o), timeTxt(o), (sc?sc.name:'') + (o.venue?` — ${o.venue}`:''),
        t.map(x=>x.name).join('، '), t.map(x=>x.phone||'').filter(Boolean).join('، '), reqs(o).join('، ')]; }),
      `فعاليات يشارك فيها أكثر من مقدّم — من ${fmtDateRaw(F)} إلى ${fmtDateRaw(T)}`);
  };
}

/* ══════════════════════════════════════════════════════════════════
   إجازات المقدّمين
   ══════════════════════════════════════════════════════════════════ */
function trainerLeaveOn(tid, date, dateTo){
  const t = (state.trainers||[]).find(x=>x.id===tid); if(!t || !date) return null;
  return (t.leaves||[]).find(l=>l.from && dateRangesOverlap(date, dateTo||date, l.from, l.to||l.from)) || null;
}
function leaveTxt(l){ return `${fmtDateRaw(l.from)}${l.to&&l.to!==l.from?` — ${fmtDateRaw(l.to)}`:''}${l.note?` (${l.note})`:''}`; }

/* ══════════════════════════════════════════════════════════════════
   ملف المقدّم
   ══════════════════════════════════════════════════════════════════ */
function avgRating(list){
  const v = list.flatMap(o=>[o.supervisorRating,o.schoolRating,o.studentsRating]).map(Number).filter(x=>x>0);
  return v.length ? Math.round(v.reduce((s,x)=>s+x,0)/v.length*10)/10 : null;
}
function profileEventsTable(list, showTrainers, reopen){
  if(!list.length) return `<div class="empty-state">لا توجد فعاليات</div>`;
  const today = todayStr();
  const canEdit = currentRole==='admin' || currentRole==='user';
  const acts = o => !canEdit ? '' : `<td style="white-space:nowrap;">
      <button type="button" class="icon-btn" title="تعديل الفعالية" aria-label="تعديل" onclick="profEditOrder('${o.id}')" style="width:26px;height:26px;padding:0;">${icon('edit',12)}</button>
      ${(o.status||'active')!=='cancelled' ? `<button type="button" class="icon-btn" title="تأجيل / تاريخ جديد" aria-label="تأجيل إلى تاريخ جديد" onclick="profPostpone('${o.id}')" style="width:26px;height:26px;padding:0;">${icon('calendar',12)}</button>` : ''}
      ${o.status==='cancelled'
        ? `<button type="button" class="icon-btn" title="تراجع عن الإلغاء" aria-label="تراجع عن الإلغاء" onclick="profToggleCancel('${o.id}', ${reopen||'null'})" style="width:26px;height:26px;padding:0;">${icon('refresh',12)}</button>`
        : `<button type="button" class="icon-btn danger" title="إلغاء الفعالية" aria-label="إلغاء الفعالية" onclick="profToggleCancel('${o.id}', ${reopen||'null'})" style="width:26px;height:26px;padding:0;">${icon('ban',12)}</button>`}</td>`;
  return `<div style="max-height:260px;overflow:auto;"><table class="set-table pr-tbl"><thead><tr><th>#</th><th style="text-align:right;">الفعالية</th><th>التاريخ</th><th style="text-align:right;">${showTrainers?'المقدّمون':'الجهة'}</th><th>الحالة</th>${canEdit?'<th>إجراء</th>':''}</tr></thead><tbody>
    ${list.map(o=>{ const st = orderState(o, today); const sc = state.schools.find(x=>x.id===o.schoolId);
      return `<tr><td><span class="badge">${o.serial}</span></td>
        <td style="text-align:right;"><a href="#" onclick="closeModal();setTimeout(()=>viewOrderReadOnly('${o.id}'),60);return false;">${escapeHtml(o.title||'')}</a></td>
        <td style="white-space:nowrap;">${fmtDateRaw(o.date)}</td>
        <td style="text-align:right;">${showTrainers ? escapeHtml(trainerNames(o)||'—') : escapeHtml(sc?sc.name:'—')}</td>
        <td><span class="st st-${st.k}">${ST_NAMES[st.k]||st.l}</span></td>${acts(o)}</tr>`; }).join('')}
  </tbody></table></div>`;
}
function profEditOrder(id){ closeModal(); setTimeout(()=>editOrder(id), 60); }
function profPostpone(id){ closeModal(); setTimeout(()=>openPostponeModal(id), 60); }
async function profToggleCancel(id, reopen){
  const o = state.orders.find(x=>x.id===id); if(!o) return;
  const wasCancelled = o.status==='cancelled';
  await toggleCancelOrder(id);
  if(o.status!=='cancelled' && !wasCancelled) return;           /* أُلغي الإجراء من نافذة التأكيد */
  if(typeof reopen==='function') setTimeout(reopen, 120);
}
function openTrainerProfile(id){
  const t = (state.trainers||[]).find(x=>x.id===id); if(!t) return;
  const year = acadYearOf(todayStr()), yr = acadYearRange(year), today = todayStr();
  const all = state.orders.filter(o=>(o.trainerIds||[]).includes(id) && isLiveOrder(o));
  const inYear = all.filter(o=>o.date>=yr.start && o.date<=yr.end);
  const done = inYear.filter(o=>o.completionStatus==='تم');
  const hours = Math.round(inYear.reduce((s,o)=>s+computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo),0)*10)/10;
  const schools = {}; all.forEach(o=>{ const n = placeNameOf(o); if(n) schools[n]=(schools[n]||0)+1; });
  const upcoming = all.filter(o=>o.date>=today).sort((a,b)=>a.date.localeCompare(b.date));
  const past = all.filter(o=>o.date<today).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30);
  const rating = avgRating(done);
  const canEdit = currentRole==='admin' || currentRole==='user';
  const leaves = (t.leaves||[]).slice().sort((a,b)=>(b.from||'').localeCompare(a.from||''));
  const body = `
    <div class="pr-head">
      <div class="pr-av">${icon('user',26)}</div>
      <div style="flex:1;min-width:0;"><b class="pr-name">${escapeHtml(t.name)}</b>
        <div class="pr-sub">${t.phone?`<a href="tel:${escapeHtml(t.phone)}" dir="ltr">${escapeHtml(t.phone)}</a> · <a href="https://wa.me/${waNumber(t.phone)}" target="_blank">${waIcon(13)} واتساب</a>`:'لا يوجد رقم'}</div></div>
      ${trainerLeaveOn(id, today) ? `<span class="pr-pill warn">${icon('pause',12)} في إجازة اليوم</span>` : ''}
    </div>
    <div class="pr-kpis">
      ${[['fileText','فعاليات السنة',inYear.length],['checkCircle','منجزة',done.length],['clock','الساعات',hours],
         ['school','جهات خدمها',Object.keys(schools).length],['flag','متوسط التقييم',rating===null?'—':rating]]
        .map(k=>`<div class="pr-kpi">${icon(k[0],15)}<b>${k[2]}</b><i>${k[1]}</i></div>`).join('')}
    </div>
    <div class="pr-sec"><h4>${icon('layers',14)} المجالات التي يقدّمها <span class="helper">(تُقدَّم أسماؤهم أولًا عند اختيار المجال في الطلب)</span></h4>
      <div class="pr-chips">${(state.fields||[]).map(f=>`<label class="pr-chip${(t.skills||[]).includes(f.id)?' on':''}">
        <input type="checkbox" value="${f.id}" ${(t.skills||[]).includes(f.id)?'checked':''} ${canEdit?'':'disabled'}><span>${escapeHtml(f.name)}</span></label>`).join('')}</div></div>
    <div class="pr-sec"><h4>${icon('pause',14)} الإجازات <span class="helper">(تُعامل كتضارب عند الإسناد والترحيل والتكرار)</span></h4>
      ${leaves.length ? `<div class="pr-leaves">${leaves.map(l=>`<div class="pr-leave${(l.to||l.from)<today?' old':''}">
          ${icon('calendar',13)} <span>${escapeHtml(leaveTxt(l))}</span>
          ${canEdit?`<button type="button" class="icon-btn danger" data-delleave="${l.id}" title="حذف" aria-label="حذف الإجازة" style="width:24px;height:24px;padding:0;">${icon('trash',12)}</button>`:''}</div>`).join('')}</div>`
        : `<div class="helper">لا توجد إجازات مسجّلة</div>`}
      ${canEdit?`<div class="pr-addleave"><label>من</label><input type="date" id="lv_from" lang="en-GB"><label>إلى</label><input type="date" id="lv_to" lang="en-GB">
        <input id="lv_note" placeholder="السبب (اختياري)"><button class="btn btn-outline btn-sm" id="lv_add">${icon('plus',13)} إضافة إجازة</button></div>`:''}
    </div>
    <div class="pr-sec"><h4>${icon('school',14)} الجهات التي خدمها</h4>
      <div class="pr-chips">${Object.entries(schools).sort((a,b)=>b[1]-a[1]).map(([n,c])=>`<span class="pr-tag">${escapeHtml(n)} <b>${c}</b></span>`).join('') || '<span class="helper">—</span>'}</div></div>
    <div class="pr-sec"><h4>${icon('calendar',14)} القادمة (${upcoming.length})</h4>${profileEventsTable(upcoming, false, `()=>openTrainerProfile('${id}')`)}</div>
    <div class="pr-sec"><h4>${icon('history',14)} السابقة (آخر ${past.length})</h4>${profileEventsTable(past, false, `()=>openTrainerProfile('${id}')`)}</div>
    <div class="pr-actions"><button class="btn btn-outline btn-sm" id="pr_print">${icon('printer',14)} طباعة الملف</button></div>`;
  showInfoModal(`${icon('user',17)} ملف مقدّم المبادرة`, body, box=>{
    box.style.maxWidth = '860px';
    box.querySelectorAll('.pr-chip input').forEach(cb=>cb.onchange = async ()=>{
      t.skills = Array.from(box.querySelectorAll('.pr-chip input:checked')).map(x=>x.value);
      cb.closest('.pr-chip').classList.toggle('on', cb.checked); await saveState(); toast('حُفظت المجالات');
    });
    box.querySelectorAll('[data-delleave]').forEach(b=>b.onclick = async ()=>{
      t.leaves = (t.leaves||[]).filter(l=>l.id!==b.dataset.delleave); await saveState(); toast('حُذفت الإجازة'); openTrainerProfile(id);
    });
    const add = box.querySelector('#lv_add');
    if(add) add.onclick = async ()=>{
      const f = box.querySelector('#lv_from').value, to = box.querySelector('#lv_to').value || f, note = box.querySelector('#lv_note').value.trim();
      if(!f){ toast('حدّد تاريخ بداية الإجازة'); return; }
      if(to < f){ toast('تاريخ النهاية قبل البداية'); return; }
      const hit = state.orders.filter(o=>isLiveOrder(o) && (o.trainerIds||[]).includes(id) && o.date && dateRangesOverlap(f, to, o.date, orderEnd(o)));
      if(hit.length && !confirm(`للمقدّم ${hit.length} ${eventWord(hit.length)} خلال هذه الإجازة:\n\n${hit.slice(0,6).map(o=>`• أمر ${o.serial} — ${o.title} (${fmtDateRaw(o.date)})`).join('\n')}\n\nتسجيل الإجازة لا يلغيها — ستحتاج إلى إعادة إسنادها. متابعة؟`)) return;
      t.leaves = (t.leaves||[]).concat([{id:uid(), from:f, to, note}]);
      await saveState(); toast('سُجّلت الإجازة'); openTrainerProfile(id);
    };
    box.querySelector('#pr_print').onclick = ()=>{
      doPrintDoc(buildReportDoc({ titleAr:`ملف مقدّم المبادرة: ${t.name}`, subtitle:`السنة الدراسية ${acadYearLabel(year)}${t.phone?' — '+t.phone:''}`,
        kpis:[{v:inYear.length,l:'📋 الفعاليات'},{v:done.length,l:'✅ المنجزة'},{v:hours,l:'⏱️ الساعات'},{v:Object.keys(schools).length,l:'🏫 الجهات'}],
        headers:['#','الفعالية','التاريخ','الجهة','الحالة'],
        rows: inYear.sort((a,b)=>a.date.localeCompare(b.date)).map(o=>{ const sc=state.schools.find(x=>x.id===o.schoolId); const st=orderState(o,today);
          return [String(o.serial), escapeHtml(o.title||''), fmtDateRaw(o.date), escapeHtml(sc?sc.name:'—'), ST_NAMES[st.k]||st.l]; })
      }), false, 'A4');
    };
  });
}

/* ══════════════════════════════════════════════════════════════════
   ملف الجهة
   ══════════════════════════════════════════════════════════════════ */
function openSchoolProfile(id){
  const s = (state.schools||[]).find(x=>x.id===id); if(!s) return;
  const today = todayStr(), year = acadYearOf(today), yr = acadYearRange(year);
  const withCancelled = state.orders.filter(o=>o.schoolId===id && o.date);
  const all = withCancelled.filter(o=>isLiveOrder(o));
  const inYear = all.filter(o=>o.date>=yr.start && o.date<=yr.end);
  const done = inYear.filter(o=>o.completionStatus==='تم');
  const upcoming = withCancelled.filter(o=>o.date>=today).sort((a,b)=>a.date.localeCompare(b.date));
  const past = all.filter(o=>o.date<today).sort((a,b)=>b.date.localeCompare(a.date));
  const last = past[0], next = upcoming[0];
  const people = done.reduce((x,o)=>x+(Number(o.participantsCount)||0),0);
  const byField = {}; inYear.forEach(o=>{ const f=state.fields.find(x=>x.id===o.fieldId); const n=f?f.name:'غير محدد'; byField[n]=(byField[n]||0)+1; });
  const trs = {}; all.forEach(o=>(o.trainerIds||[]).forEach(tid=>{ trs[tid]=(trs[tid]||0)+1; }));
  const rating = avgRating(done);
  const canEdit = currentRole==='admin' || currentRole==='user';
  const body = `
    <div class="pr-head">
      <div class="pr-av">${icon('school',26)}</div>
      <div style="flex:1;min-width:0;"><b class="pr-name">${escapeHtml(s.name)}</b>
        <div class="pr-sub">${escapeHtml(s.level||'')}${s.email?` · <span dir="ltr">${escapeHtml(s.email)}</span>`:''}</div></div>
      ${canEdit?`<button class="btn btn-primary btn-sm" id="sp_new">${icon('plus',13)} طلب جديد لهذه الجهة</button>`:''}
    </div>
    <div class="pr-kpis">
      ${[['fileText','فعاليات السنة',inYear.length],['checkCircle','منجزة',done.length],['users','المستفيدون',people],
         ['history','آخر زيارة',last?fmtDateRaw(last.date):'—'],['calendar','القادمة',next?fmtDateRaw(next.date):'—'],['flag','متوسط التقييم',rating===null?'—':rating]]
        .map(k=>`<div class="pr-kpi">${icon(k[0],15)}<b>${k[2]}</b><i>${k[1]}</i></div>`).join('')}
    </div>
    <div class="pr-sec"><h4>${icon('fileText',14)} ملاحظات دائمة <span class="helper">(تظهر في نموذج الطلب عند اختيار هذه الجهة)</span></h4>
      <textarea id="sp_notes" rows="2" style="width:100%;" placeholder="مثل: الدخول من البوابة الخلفية، تفضّل الحصة الثالثة..." ${canEdit?'':'disabled'}>${escapeHtml(s.notes||'')}</textarea>
      ${canEdit?`<button class="btn btn-outline btn-sm" id="sp_saveNotes" style="margin-top:6px;">${icon('save',13)} حفظ الملاحظات</button>`:''}</div>
    <div class="pr-sec"><h4>${icon('users',14)} المشرفون</h4>
      <div class="pr-chips">${(s.supervisors||[]).map(v=>`<span class="pr-tag">${escapeHtml(v.name)}${v.phone?` <span dir="ltr">${escapeHtml(v.phone)}</span>`:''}</span>`).join('') || '<span class="helper">لا يوجد مشرفون</span>'}</div></div>
    <div class="pr-sec"><h4>${icon('layers',14)} المجالات هذه السنة</h4>
      <div class="pr-chips">${Object.entries(byField).sort((a,b)=>b[1]-a[1]).map(([n,c])=>`<span class="pr-tag">${escapeHtml(n)} <b>${c}</b></span>`).join('') || '<span class="helper">—</span>'}</div></div>
    <div class="pr-sec"><h4>${icon('user',14)} مقدّمون خدموها</h4>
      <div class="pr-chips">${Object.entries(trs).sort((a,b)=>b[1]-a[1]).map(([tid,c])=>{ const t=state.trainers.find(x=>x.id===tid); return t?`<a href="#" class="pr-tag" onclick="openTrainerProfile('${tid}');return false;">${escapeHtml(t.name)} <b>${c}</b></a>`:''; }).join('') || '<span class="helper">—</span>'}</div></div>
    <div class="pr-sec"><h4>${icon('calendar',14)} القادمة (${upcoming.filter(o=>isLiveOrder(o)).length})</h4>${profileEventsTable(upcoming, true, `()=>openSchoolProfile('${id}')`)}</div>
    <div class="pr-sec"><h4>${icon('history',14)} السابقة (${past.length})</h4>${profileEventsTable(past.slice(0,40), true, `()=>openSchoolProfile('${id}')`)}</div>
    <div class="pr-actions"><button class="btn btn-outline btn-sm" id="sp_print">${icon('printer',14)} طباعة الملف</button></div>`;
  showInfoModal(`${icon('school',17)} ملف الجهة`, body, box=>{
    box.style.maxWidth = '880px';
    const sn = box.querySelector('#sp_saveNotes'); if(sn) sn.onclick = async ()=>{ s.notes = box.querySelector('#sp_notes').value.trim(); await saveState(); toast('حُفظت الملاحظات'); };
    const nw = box.querySelector('#sp_new'); if(nw) nw.onclick = ()=>{ closeModal(); currentPage='newOrder'; editingOrderId=null; render();
      setTimeout(()=>{ const f=document.getElementById('f_school'); if(f){ if(!Array.from(f.options).some(o=>o.value===id)){ const op=document.createElement('option'); op.value=id; op.textContent=s.name; f.appendChild(op); }
        f.value=id; f.dispatchEvent(new Event('change')); } }, 60); };
    box.querySelector('#sp_print').onclick = ()=>{
      doPrintDoc(buildReportDoc({ titleAr:`ملف الجهة: ${s.name}`, subtitle:`السنة الدراسية ${acadYearLabel(year)}`,
        kpis:[{v:inYear.length,l:'📋 الفعاليات'},{v:done.length,l:'✅ المنجزة'},{v:people,l:'👥 المستفيدون'}],
        headers:['#','الفعالية','التاريخ','المقدّمون','الحالة'],
        rows: inYear.sort((a,b)=>a.date.localeCompare(b.date)).map(o=>{ const st=orderState(o,today);
          return [String(o.serial), escapeHtml(o.title||''), fmtDateRaw(o.date), escapeHtml(trainerNames(o)||'—'), ST_NAMES[st.k]||st.l]; })
      }), false, 'A4');
    };
  });
}

/* ══════════════════════════════════════════════════════════════════
   تقويم المناسبات — ميلادي ثابت، هجري (أم القرى)، أو «الثلاثاء الثاني من فبراير»
   ══════════════════════════════════════════════════════════════════ */
const OCC_DEFAULTS = [
  ['اليوم الوطني لدولة قطر','g','12-18','مسابقات وطنية، برامج الهوية والانتماء'],
  ['اليوم العالمي للغة العربية','g','12-18','مسابقات الإلقاء والخط العربي'],
  ['اليوم الرياضي للدولة','nth','2-2-2','برامج صحية ورياضية، المصلى المتنقل في الفعاليات'],
  ['بداية شهر رمضان','h','9-1','برامج رمضانية، التهيئة لرمضان، المصلى المتنقل'],
  ['عيد الفطر','h','10-1','برامج العيد والقيم الاجتماعية'],
  ['عيد الأضحى','h','12-10','برامج العشر من ذي الحجة'],
  ['رأس السنة الهجرية','h','1-1','الهجرة النبوية ودروسها'],
  ['الإسراء والمعراج','h','7-27','قصص السيرة وفضل الصلاة'],
  ['اليوم العالمي للمعلم','g','10-05','تكريم المعلمين ورسائل الشكر'],
  ['اليوم العالمي لمكافحة التنمر','nth','11-4-1','ورش التنمر والعرض المسرحي'],
  ['اليوم العالمي للتسامح','g','11-16','قيم التسامح والتعايش'],
  ['اليوم العالمي للطفل','g','11-20','برامج الطفل وحقوقه'],
  ['يوم الصحة العالمي','g','04-07','حملات التوعية الصحية'],
];
const __hijriCache = {};
function hijriMD(iso){
  if(__hijriCache[iso]) return __hijriCache[iso];
  try{
    const p = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{month:'numeric',day:'numeric',year:'numeric'}).formatToParts(new Date(iso+'T12:00:00'));
    const g = k => Number((p.find(x=>x.type===k)||{}).value);
    return (__hijriCache[iso] = {m:g('month'), d:g('day'), y:g('year')});
  }catch(e){ return (__hijriCache[iso] = {m:0,d:0,y:0}); }
}
function hijriLabel(iso){
  try{ return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn',{day:'numeric',month:'long',year:'numeric'}).format(new Date(iso+'T12:00:00')); }catch(e){ return ''; }
}
function occDatesBetween(oc, from, to){
  const out = [];
  const y1 = Number(from.slice(0,4)), y2 = Number(to.slice(0,4));
  if(oc.type==='g'){ for(let y=y1;y<=y2;y++){ const d = `${y}-${oc.rule}`; if(d>=from && d<=to) out.push(d); } }
  else if(oc.type==='nth'){ const [m,wd,n] = oc.rule.split('-').map(Number);
    for(let y=y1;y<=y2;y++){ const first = new Date(y, m-1, 1); const off = (wd - first.getDay() + 7) % 7;
      const d = dateToISO(new Date(y, m-1, 1 + off + (n-1)*7)); if(d>=from && d<=to && Number(d.slice(5,7))===m) out.push(d); } }
  else if(oc.type==='once'){ if(oc.rule>=from && oc.rule<=to) out.push(oc.rule); }
  else if(oc.type==='h'){ const [m,dd] = oc.rule.split('-').map(Number);
    let d = from, g = 0; while(d<=to && g<800){ const h = hijriMD(d); if(h.m===m && h.d===dd) out.push(d); d = addDaysISO(d,1); g++; } }
  return out;
}
function occRuleLabel(oc){
  if(oc.type==='g'){ const [m,d]=oc.rule.split('-').map(Number); return `${d} ${['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][m-1]} سنويًا`; }
  if(oc.type==='h'){ const [m,d]=oc.rule.split('-').map(Number); return `${d} ${['محرم','صفر','ربيع الأول','ربيع الآخر','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'][m-1]} (هجري)`; }
  if(oc.type==='nth'){ const [m,wd,n]=oc.rule.split('-').map(Number); return `${['الأول','الثاني','الثالث','الرابع'][n-1]} ${['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'][wd]} من ${['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][m-1]}`; }
  return fmtDateRaw(oc.rule);
}
function ensureOccasions(){
  if(!Array.isArray(state.occasions)) state.occasions = [];
  if(!state.__occSeeded){
    state.occasions = state.occasions.concat(OCC_DEFAULTS.map(x=>({id:uid(), name:x[0], type:x[1], rule:x[2], suggest:x[3], lead:21})));
    state.__occSeeded = true;
  }
}
function upcomingOccasions(days){
  const from = todayStr(), to = addDaysISO(from, days||120);
  return (state.occasions||[]).flatMap(oc=>occDatesBetween(oc, from, to).map(d=>({oc, date:d,
    left: daysCount(from, d)-1,
    planned: state.orders.filter(o=>isLiveOrder(o) && o.date && dateRangesOverlap(addDaysISO(d,-7), addDaysISO(d,2), o.date, orderEnd(o))).length })))
    .sort((a,b)=>a.date.localeCompare(b.date));
}
function occasionsOnDays(from, to){
  const m = {}; (state.occasions||[]).forEach(oc=>occDatesBetween(oc, from, to).forEach(d=>{ (m[d]=m[d]||[]).push(oc.name); })); return m;
}
function newOrderForOccasion(date, title){
  newOrderOnDate(date);
  setTimeout(()=>{ const t=document.getElementById('f_title'); if(t && title){ t.value = title; t.dispatchEvent(new Event('input')); } }, 80);
}
function editOccasion(id){
  const oc = id ? state.occasions.find(x=>x.id===id) : {type:'g', rule:'', name:'', suggest:'', lead:21};
  if(!oc) return;
  const [a,b,c] = String(oc.rule||'').split('-');
  const body = `<div class="oc-form">
    <label>اسم المناسبة</label><input id="oe_name" value="${escapeHtml(oc.name||'')}">
    <label>نوع التاريخ</label><select id="oe_type">
      <option value="g" ${oc.type==='g'?'selected':''}>ميلادي ثابت كل سنة</option>
      <option value="h" ${oc.type==='h'?'selected':''}>هجري ثابت كل سنة</option>
      <option value="nth" ${oc.type==='nth'?'selected':''}>يوم محدد من الأسبوع في شهر (مثل الثلاثاء الثاني)</option>
      <option value="once" ${oc.type==='once'?'selected':''}>تاريخ واحد فقط</option></select>
    <div id="oe_rule"></div>
    <label>البرامج المقترحة</label><input id="oe_sug" value="${escapeHtml(oc.suggest||'')}">
    <label>التنبيه قبلها بـ (يوم)</label><input id="oe_lead" type="number" min="1" lang="en" value="${oc.lead||21}">
    <div class="modal-actions" style="justify-content:flex-start;"><button class="btn btn-primary" id="oe_save">${icon('save',14)} حفظ</button></div></div>`;
  showInfoModal(`${icon('calendar',17)} ${id?'تعديل مناسبة':'إضافة مناسبة'}`, body, box=>{
    box.style.maxWidth='520px';
    const MON = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const HMON = ['محرم','صفر','ربيع الأول','ربيع الآخر','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'];
    const opts = (arr, sel) => arr.map((n,i)=>`<option value="${i+1}" ${Number(sel)===i+1?'selected':''}>${n}</option>`).join('');
    const days = sel => Array.from({length:31},(_,i)=>`<option value="${i+1}" ${Number(sel)===i+1?'selected':''}>${i+1}</option>`).join('');
    const drawRule = ()=>{
      const t = box.querySelector('#oe_type').value, r = box.querySelector('#oe_rule');
      const same = t===oc.type;
      if(t==='g') r.innerHTML = `<label>اليوم والشهر</label><div class="oc-row"><select id="oe_d">${days(same?b:1)}</select><select id="oe_m">${opts(MON, same?a:1)}</select></div>`;
      else if(t==='h') r.innerHTML = `<label>اليوم والشهر الهجري</label><div class="oc-row"><select id="oe_d">${days(same?b:1)}</select><select id="oe_m">${opts(HMON, same?a:1)}</select></div>`;
      else if(t==='nth') r.innerHTML = `<label>الترتيب واليوم والشهر</label><div class="oc-row"><select id="oe_n">${opts(['الأول','الثاني','الثالث','الرابع'], same?c:1)}</select>
          <select id="oe_wd">${['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'].map((n,i)=>`<option value="${i}" ${same&&Number(b)===i?'selected':''}>${n}</option>`).join('')}</select><select id="oe_m">${opts(MON, same?a:1)}</select></div>`;
      else r.innerHTML = `<label>التاريخ</label><input id="oe_date" type="date" lang="en-GB" value="${same?oc.rule:''}">`;
    };
    box.querySelector('#oe_type').onchange = drawRule; drawRule();
    box.querySelector('#oe_save').onclick = async ()=>{
      const name = box.querySelector('#oe_name').value.trim(); if(!name){ toast('اكتب اسم المناسبة'); return; }
      const t = box.querySelector('#oe_type').value; const v = k => (box.querySelector('#'+k)||{}).value;
      const rule = t==='g' ? `${String(v('oe_m')).padStart(2,'0')}-${String(v('oe_d')).padStart(2,'0')}`
                 : t==='h' ? `${v('oe_m')}-${v('oe_d')}` : t==='nth' ? `${v('oe_m')}-${v('oe_wd')}-${v('oe_n')}` : v('oe_date');
      if(!rule){ toast('حدّد التاريخ'); return; }
      const rec = {name, type:t, rule, suggest: box.querySelector('#oe_sug').value.trim(), lead: Number(box.querySelector('#oe_lead').value)||21};
      if(id) Object.assign(oc, rec); else state.occasions.push(Object.assign({id:uid()}, rec));
      await saveState(); closeModal(); toast('حُفظت المناسبة'); render();
    };
  });
}
function renderOccasionsTab(c){
  ensureOccasions();
  const up = upcomingOccasions(365);
  const canEdit = currentRole==='admin';
  c.innerHTML = `<div class="card"><h2>${icon('calendar',15)} تقويم المناسبات
      ${canEdit?`<button class="btn btn-primary btn-sm" onclick="editOccasion()">${icon('plus',13)} إضافة مناسبة</button>`:''}</h2>
    <div class="helper" style="margin-bottom:10px;">المناسبات خلال السنة القادمة بتاريخها الميلادي والهجري (تقويم أم القرى). «مخطط لها» = فعاليات في الأسبوع السابق للمناسبة أو يومها. تظهر المناسبة في الصفحة الرئيسية حين يقترب موعدها، وفي تقويم الطلبات.</div>
    <table class="set-table occ-tbl"><thead><tr><th style="text-align:right;">المناسبة</th><th>التاريخ</th><th>الهجري</th><th>المتبقي</th><th>مخطط لها</th><th style="text-align:right;">برامج مقترحة</th><th></th></tr></thead><tbody>
    ${up.map(x=>`<tr class="${x.left<=x.oc.lead&&!x.planned?'occ-warn':''}">
      <td style="text-align:right;"><b>${escapeHtml(x.oc.name)}</b><div class="helper">${escapeHtml(occRuleLabel(x.oc))}</div></td>
      <td style="white-space:nowrap;">${dayNameOf(x.date)}<br><b>${fmtDateRaw(x.date)}</b></td>
      <td style="white-space:nowrap;" class="helper">${escapeHtml(hijriLabel(x.date))}</td>
      <td><b>${x.left===0?'اليوم':x.left+' يوم'}</b></td>
      <td>${x.planned?`<span class="st st-done">${x.planned}</span>`:`<span class="st st-late">لا شيء</span>`}</td>
      <td style="text-align:right;" class="helper">${escapeHtml(x.oc.suggest||'')}</td>
      <td style="white-space:nowrap;">${currentRole!=='trainer'?`<button class="icon-btn" title="طلب فعالية لهذه المناسبة" aria-label="طلب فعالية" onclick="newOrderForOccasion('${addDaysISO(x.date, 0)}', ${JSON.stringify(x.oc.name).replace(/"/g,'&quot;')})">${icon('filePlus',13)}</button>`:''}
        ${canEdit?`<button class="icon-btn" title="تعديل" aria-label="تعديل" onclick="editOccasion('${x.oc.id}')">${icon('edit',13)}</button>
        <button class="icon-btn danger" title="حذف" aria-label="حذف" onclick="if(confirm('حذف المناسبة؟')){state.occasions=state.occasions.filter(o=>o.id!=='${x.oc.id}');saveState();render();}">${icon('trash',13)}</button>`:''}</td></tr>`).join('')
      || `<tr><td colspan="7"><div class="empty-state">لا توجد مناسبات</div></td></tr>`}
    </tbody></table></div>`;
}
function appendHomeOccasions(c){
  ensureOccasions();
  const list = upcomingOccasions(60).filter(x=>x.left <= (x.oc.lead||21));
  if(!list.length) return;
  const card = document.createElement('div'); card.className='card home-occ';
  card.innerHTML = `<h2>${icon('calendar',15)} مناسبات قادمة <button class="btn btn-outline btn-sm" onclick="currentPage='settings';settingsTab='occasions';render();">التقويم الكامل</button></h2>
    <div class="occ-list">${list.map(x=>`<div class="occ-item${x.planned?'':' warn'}">
      <div class="occ-d"><b>${x.left===0?'اليوم':x.left}</b><i>${x.left===0?'':'يوم'}</i></div>
      <div style="flex:1;min-width:0;"><b>${escapeHtml(x.oc.name)}</b>
        <div class="helper">${dayNameOf(x.date)} ${fmtDateRaw(x.date)} · ${escapeHtml(hijriLabel(x.date))}${x.oc.suggest?` · مقترح: ${escapeHtml(x.oc.suggest)}`:''}</div></div>
      ${x.planned?`<span class="st st-done">${x.planned} مخطط لها</span>`:`<span class="st st-late">لا فعاليات بعد</span>`}
      <button class="icon-btn" title="طلب فعالية" aria-label="طلب فعالية" onclick="newOrderForOccasion('${x.date}', ${JSON.stringify(x.oc.name).replace(/"/g,'&quot;')})">${icon('filePlus',14)}</button>
    </div>`).join('')}</div>`;
  const anchor = c.querySelector('.home-targets');
  if(anchor) c.insertBefore(card, anchor); else c.appendChild(card);
}

/* ══════════════════════════════════════════════════════════════════
   تنبيه الطلب المكرر
   ══════════════════════════════════════════════════════════════════ */
function similarTitles(a, b){
  const na = _pnz(a), nb = _pnz(b); if(!na || !nb) return false;
  if(na===nb || na.includes(nb) || nb.includes(na)) return true;
  const A = new Set(_ptoks(a)), B = new Set(_ptoks(b)); if(!A.size || !B.size) return false;
  const inter = [...A].filter(x=>B.has(x)).length;
  return inter / Math.min(A.size, B.size) >= 0.6;
}
function findSimilarOrders(title, schoolId, venue, date, excludeId){
  if(!title || !date || (!schoolId && !venue)) return [];
  const from = addDaysISO(date,-30), to = addDaysISO(date,30);
  return state.orders.filter(o=>o.id!==excludeId && isLiveOrder(o) && o.date && o.date>=from && o.date<=to
    && ((schoolId && o.schoolId===schoolId) || (venue && o.venue===venue)) && similarTitles(title, o.title));
}

/* ══════════════════════════════════════════════════════════════════
   العمل عند انقطاع الإنترنت
   التعديلات تُحفظ على هذا الجهاز وتُرفع تلقائيًا (مع الدمج) عند عودة الاتصال
   ══════════════════════════════════════════════════════════════════ */
let __offline = false;
function __lsSet(k, v){
  try{ localStorage.setItem(k, v); return true; }
  catch(e){ try{ localStorage.removeItem('backup_prev'); localStorage.setItem(k, v); return true; }catch(e2){ return false; } }
}
function queueOfflineSave(){
  const ok = __lsSet('offline_state', JSON.stringify(state));
  __lsSet('offline_base_at', String(__baseUpdatedAt==null?'':__baseUpdatedAt));
  const n = (Number(localStorage.getItem('offline_n'))||0) + 1; __lsSet('offline_n', String(n));
  const first = !__offline;
  __offline = true; syncState.ok = false; renderOfflineBar(); try{ renderUserBox(); }catch(e){}
  if(first) toast(ok ? 'لا يوجد اتصال — حُفظ التعديل على هذا الجهاز وسيُرفع تلقائيًا' : 'لا يوجد اتصال، وتعذّر الحفظ على الجهاز (المساحة ممتلئة)');
}
function clearOfflineQueue(){
  const had = __offline || localStorage.getItem('offline_state');
  ['offline_state','offline_base_at','offline_n'].forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
  __offline = false; renderOfflineBar();
  if(had) toast('عاد الاتصال — رُفعت تعديلاتك ودُمجت مع الخادم');
}
function renderOfflineBar(){
  let bar = document.getElementById('offlineBar');
  if(!__offline){ if(bar) bar.remove(); return; }
  if(!bar){ bar = document.createElement('div'); bar.id = 'offlineBar'; document.body.appendChild(bar); }
  const n = Number(localStorage.getItem('offline_n'))||0;
  bar.innerHTML = `${icon('alert',15)} <b>غير متصل بالإنترنت</b> — تعديلاتك محفوظة على هذا الجهاز${n?` (${n})`:''} وستُرفع تلقائيًا عند عودة الاتصال.
    <button type="button" onclick="flushSave()">إعادة المحاولة</button>`;
}
/* بدء التشغيل بلا إنترنت: نعمل من آخر نسخة محلية بدل إيقاف النظام */
function tryOfflineBoot(){
  let raw = null, baseAt = null;
  try{ raw = localStorage.getItem('offline_state'); baseAt = localStorage.getItem('offline_base_at'); }catch(e){}
  if(!raw){ try{ raw = localStorage.getItem('backup_last'); baseAt = localStorage.getItem('backup_base_at'); }catch(e){} }
  if(!raw) return false;
  try{ state = JSON.parse(raw); }catch(e){ return false; }
  if(!state || !Array.isArray(state.orders)) return false;
  /* الأساس = النسخة المحلية نفسها؛ وطابع زمني «مجهول» يفرض الدمج عند أول رفع */
  __rememberBase(raw, baseAt ? Number(baseAt) : -1);
  __readFailed = false; __offline = true; syncState.ok = false;
  setTimeout(renderOfflineBar, 50);
  return true;
}
window.addEventListener('online', ()=>{ if(__offline || localStorage.getItem('offline_state')){ setTimeout(()=>flushSave(), 800); } });
window.addEventListener('offline', ()=>{ syncState.ok = false; try{ renderUserBox(); }catch(e){} });

/* ══════════════════════════════════════════════════════════════════
   فرز الفعاليات حسب نوع المدرسة: ثانوية، ابتدائية، إعدادية، مشتركة، نموذجية، أخرى
   (يُستنتج من اسم المدرسة، وعند غيابه من مرحلتها المسجّلة)
   ══════════════════════════════════════════════════════════════════ */
const SCHOOL_TYPES = ['ثانوية','ابتدائية','إعدادية','مشتركة','نموذجية','روضة','أخرى'];
function schoolTypeOf(s){
  if(!s) return 'أخرى';
  if(s.stage && SCHOOL_TYPES.includes(s.stage)) return s.stage;
  return detectSchoolStage(s);
  const n = _pnz(s.name||'');
  if(/نموذج/.test(n)) return 'نموذجية';
  const prim = /ابتدا/.test(n), prep = /اعداد/.test(n), sec = /ثانو/.test(n);
  if(/مشترك|مجمع/.test(n) || (prim+prep+sec) >= 2) return 'مشتركة';
  if(sec) return 'ثانوية';
  if(prep) return 'إعدادية';
  if(prim) return 'ابتدائية';
  const lv = String(s.level||'');
  if(lv==='ثانوي') return 'ثانوية';
  if(lv==='إعدادي') return 'إعدادية';
  if(lv==='ابتدائي') return 'ابتدائية';
  return 'أخرى';
}
function stageGroups(orders){
  const g = {}; SCHOOL_TYPES.forEach(t=>g[t]=[]);
  orders.forEach(o=>{ const s = state.schools.find(x=>x.id===o.schoolId); g[schoolTypeOf(s)].push(o); });
  SCHOOL_TYPES.forEach(t=>g[t].sort((a,b)=>(a.date||'').localeCompare(b.date||'') || (a.timeFrom||'').localeCompare(b.timeFrom||'')));
  return g;
}
function stageSummary(list){
  return { events:list.length,
    schools:new Set(list.map(o=>o.schoolId).filter(Boolean)).size,
    people:list.reduce((s,o)=>s+(Number(o.participantsCount)||0),0),
    hours:Math.round(list.reduce((s,o)=>s+computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo),0)*10)/10,
    trainers:new Set(list.flatMap(o=>o.trainerIds||[])).size };
}
/* واجهة التقرير — تُستخدم في جدول المقدّمين (نافذة) وفي صفحة التقارير */
function bindStageReport(box, getOrders, getRange, opts){
  opts = opts || {};
  let pick = '';
  const COLS = ['#','الفعالية','التاريخ','الوقت','المدرسة','مقدّمو المبادرة','المستهدفون'];
  const rowArr = o => { const s = state.schools.find(x=>x.id===o.schoolId);
    return [o.serial, o.title||'', `${dayNameOf(o.date)} ${fmtDateRaw(o.date)}`, (o.timeFrom||o.timeTo)?`${o.timeFrom||'—'} - ${o.timeTo||'—'}`:'—',
      s?s.name:'—', trainerNames(o)||'—', o.participantsCount||'']; };
  function draw(){
    const orders = getOrders(), [F,T] = getRange();
    const G = stageGroups(orders);
    const types = SCHOOL_TYPES.filter(t=>!pick || t===pick);
    const body = box.querySelector('.stg-body');
    body.innerHTML = `
      <div class="stg-chips">
        <button type="button" data-st="" class="${pick?'':'on'}">الكل <b>${orders.length}</b></button>
        ${SCHOOL_TYPES.map(t=>`<button type="button" data-st="${t}" class="${pick===t?'on':''}" ${G[t].length?'':'disabled'}>${t} <b>${G[t].length}</b></button>`).join('')}
      </div>
      <table class="set-table stg-sum"><thead><tr><th style="text-align:right;">نوع المدرسة</th><th>الفعاليات</th><th>المدارس</th><th>المقدّمون</th><th>المستهدفون</th><th>الساعات</th></tr></thead><tbody>
        ${SCHOOL_TYPES.map(t=>{ const x = stageSummary(G[t]); return `<tr class="${pick&&pick!==t?'dim':''}"><td style="text-align:right;font-weight:700;">${t}</td><td>${x.events}</td><td>${x.schools}</td><td>${x.trainers}</td><td>${x.people}</td><td>${x.hours}</td></tr>`; }).join('')}
        ${(()=>{ const x = stageSummary(orders); return `<tr class="tot"><td style="text-align:right;">الإجمالي</td><td>${x.events}</td><td>${x.schools}</td><td>${x.trainers}</td><td>${x.people}</td><td>${x.hours}</td></tr>`; })()}
      </tbody></table>
      ${types.filter(t=>G[t].length).map(t=>`<div class="stg-sec"><h4>${icon('school',14)} ${t} <span>${G[t].length} ${eventWord(G[t].length)}</span></h4>
        <div class="tbl-scroll"><table class="set-table stg-tbl"><thead><tr>${COLS.map((c,i)=>`<th${[1,4,5].includes(i)?' style="text-align:right;"':''}>${c}</th>`).join('')}</tr></thead><tbody>
        ${G[t].map(o=>{ const r = rowArr(o); return `<tr><td><span class="badge">${r[0]}</span></td>
          <td style="text-align:right;"><a href="#" onclick="${opts.inModal?'closeModal();setTimeout(()=>viewOrderReadOnly(\''+o.id+'\'),60)':'viewOrderReadOnly(\''+o.id+'\')'};return false;">${escapeHtml(r[1])}</a></td>
          <td style="white-space:nowrap;">${escapeHtml(r[2])}</td><td style="white-space:nowrap;">${escapeHtml(r[3])}</td>
          <td style="text-align:right;">${escapeHtml(r[4])}</td><td style="text-align:right;">${escapeHtml(r[5])}</td><td>${escapeHtml(String(r[6]))}</td></tr>`; }).join('')}
        </tbody></table></div></div>`).join('') || `<div class="empty-state">لا توجد فعاليات خلال هذه الفترة</div>`}`;
    body.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{ pick = b.dataset.st; draw(); });
  }
  box.querySelector('.stg-print').onclick = ()=>{
    const orders = getOrders(), [F,T] = getRange();
    if(!orders.length){ toast('لا توجد فعاليات'); return; }
    const G = stageGroups(orders);
    const types = SCHOOL_TYPES.filter(t=>(!pick || t===pick) && G[t].length);
    const sumRows = SCHOOL_TYPES.filter(t=>!pick || t===pick).map(t=>{ const x = stageSummary(G[t]); return [t, x.events, x.schools, x.trainers, x.people, x.hours].map(String); });
    if(!pick){ const x = stageSummary(orders); sumRows.push(['الإجمالي', x.events, x.schools, x.trainers, x.people, x.hours].map(v=>`<b>${v}</b>`)); }
    const W = ['10mm','58mm','34mm','26mm','58mm','auto','20mm'];
    const extra = `<div class="sec-t">الملخّص حسب نوع المدرسة</div>`
      + repTableHtml(['نوع المدرسة','الفعاليات','المدارس','المقدّمون','المستهدفون','الساعات'], sumRows.map(r=>({cells:r, tdAttr:{0:' style="text-align:center;font-weight:700;"'}})), {colWidths:['46mm','40mm','40mm','40mm','40mm','auto']})
      + types.map(t=>`<div class="sec-t">${t} — ${G[t].length} ${eventWord(G[t].length)}</div>`
          + repTableHtml(COLS, G[t].map(o=>rowArr(o).map(v=>escapeHtml(String(v)))), {colWidths:W})).join('');
    doPrintDoc(buildReportDoc({
      titleAr: pick ? `فعاليات المدارس ${pick==='أخرى'?'الأخرى':pick}` : 'الفعاليات حسب نوع المدرسة',
      subtitle: `من ${fmtDateRaw(F)} إلى ${fmtDateRaw(T)}`,
      kpis: SCHOOL_TYPES.map((t,i)=>({v:G[t].length, l:`🏫 ${t}`})),
      extraHtml: extra
    }), true, 'A4');
  };
  box.querySelector('.stg-excel').onclick = ()=>{
    const orders = getOrders(), [F,T] = getRange();
    if(!orders.length){ toast('لا توجد فعاليات'); return; }
    const G = stageGroups(orders);
    const types = SCHOOL_TYPES.filter(t=>(!pick || t===pick) && G[t].length);
    exportToExcel(`الفعاليات_حسب_نوع_المدرسة_${F}_${T}.xlsx`, ['نوع المدرسة'].concat(COLS),
      types.flatMap(t=>G[t].map(o=>[t].concat(rowArr(o)))), `الفعاليات حسب نوع المدرسة — من ${fmtDateRaw(F)} إلى ${fmtDateRaw(T)}`);
  };
  box.__stageDraw = draw;
  draw();
}
function stageReportShell(title, withDates, F, T){
  return `<h2>${icon('school',15)} ${title}
      <span style="display:inline-flex;gap:6px;">
        <button class="icon-btn stg-print" title="طباعة" aria-label="طباعة" style="width:32px;height:32px;padding:0;">${icon('printer',15)}</button>
        <button class="icon-btn stg-excel" title="تنزيل Excel" aria-label="تنزيل Excel" style="width:32px;height:32px;padding:0;">${icon('sheet',15)}</button>
      </span></h2>
    ${withDates ? `<div class="rp-dates" style="margin-bottom:10px;">
        <div class="rp-date"><label>من تاريخ</label><input class="stg-from" type="date" lang="en-GB" value="${F}"></div>
        <div class="rp-date"><label>إلى تاريخ</label><input class="stg-to" type="date" lang="en-GB" value="${T}"></div></div>`
      : `<div class="helper" style="margin-bottom:10px;">الفترة: من ${fmtDateRaw(F)} إلى ${fmtDateRaw(T)} — حسب الفعاليات المعروضة في الصفحة وتصفيتها.</div>`}
    <div class="helper" style="margin-bottom:8px;">نوع المدرسة = المرحلة المسجّلة لها (تُحدَّد تلقائيًا من الاسم ويمكن تعديلها من الإعدادات أو تقرير «تصنيف المدارس حسب المرحلة»).</div>
    <div class="stg-body"></div>`;
}
function openStageModal(orders, F, T){
  showInfoModal('', `<div id="stgBox">${stageReportShell('الفعاليات حسب نوع المدرسة', false, F, T)}</div>`, box=>{
    box.style.maxWidth = '1120px';
    const h = box.querySelector('h3'); if(h) h.remove();
    bindStageReport(box.querySelector('#stgBox'), ()=>orders, ()=>[F,T], {inModal:true});
  });
}

/* ══════════════════════════════════════════════════════════════════
   مرحلة الجهة — تُسجَّل تلقائيًا من الاسم، ويمكن تعديلها يدويًا
   ══════════════════════════════════════════════════════════════════ */
/* مدارس صنّفها المستخدم بنفسه — تُطبَّق مرة واحدة وتُحفظ كاختيار يدوي */
const STAGE_OVERRIDES = [
  ['عثمان بن عفان','ابتدائية'], ['جابر بن حيان','ابتدائية'], ['سعد بن ابي وقاص','ابتدائية'], ['روضه النور','روضة'],
];
function detectSchoolStage(s){
  const n = _pnz((s && s.name)||'');
  if(/روضه|رياض الاطفال|رياض اطفال/.test(n)) return 'روضة';
  if(/نموذج/.test(n)) return 'نموذجية';
  const prim = /ابتدا/.test(n), prep = /اعداد/.test(n), sec = /ثانو/.test(n);
  if(/مشترك|مجمع/.test(n) || (prim+prep+sec) >= 2) return 'مشتركة';
  if(sec) return 'ثانوية';
  if(prep) return 'إعدادية';
  if(prim) return 'ابتدائية';
  const lv = String((s && s.level)||'');
  if(lv==='ثانوي') return 'ثانوية';
  if(lv==='إعدادي') return 'إعدادية';
  if(lv==='ابتدائي') return 'ابتدائية';
  return 'أخرى';
}
function ensureSchoolStages(){
  let changed = 0;
  (state.schools||[]).forEach(s=>{
    if(!s.stageManual){
      const n = _pnz(s.name||'');
      const ov = STAGE_OVERRIDES.find(([k])=>n.includes(_pnz(k)));
      if(ov){ s.stage = ov[1]; s.stageManual = true; changed++; return; }
      const st = detectSchoolStage(s);
      if(s.stage !== st){ s.stage = st; changed++; }
    }
  });
  return changed;
}
function stageSelectHtml(s){
  const cur = s.stage || detectSchoolStage(s);
  return `<select class="stg-sel${cur==='أخرى'?' other':''}" onchange="setSchoolStage('${s.id}', this.value)" title="${s.stageManual?'محدّدة يدويًا':'محدّدة تلقائيًا من الاسم'}">
    ${SCHOOL_TYPES.map(t=>`<option value="${t}" ${cur===t?'selected':''}>${t}</option>`).join('')}
    <option value="__auto">↺ تلقائي من الاسم</option></select>`;
}
async function setSchoolStage(id, v){
  const s = state.schools.find(x=>x.id===id); if(!s) return;
  if(v==='__auto'){ s.stageManual = false; s.stage = detectSchoolStage(s); }
  else { s.stage = v; s.stageManual = true; }
  await saveState(); toast(`المرحلة: ${s.stage}`);
  const d = document.getElementById('stgSchoolsBox'); if(d && d.__redraw) d.__redraw();
}
/* تقرير: المدارس حسب المرحلة — افتراضيًا «أخرى» للمراجعة */
function drawSchoolStagesReport(box, back){
  ensureSchoolStages();
  let pick = 'أخرى', q = '';
  box.innerHTML = `<div class="card" id="stgSchoolsBox"><h2>${icon('school',15)} تصنيف المدارس حسب المرحلة
      <span style="display:inline-flex;gap:6px;align-items:center;">
        <button class="icon-btn" id="ss_print" title="طباعة" aria-label="طباعة" style="width:32px;height:32px;padding:0;">${icon('printer',15)}</button>
        <button class="icon-btn" id="ss_excel" title="تنزيل Excel" aria-label="تنزيل Excel" style="width:32px;height:32px;padding:0;">${icon('sheet',15)}</button>
        ${back?`<button class="btn btn-outline btn-sm" type="button" id="ss_back">${icon('chevronRight',14)} كل التقارير</button>`:''}
      </span></h2>
    <div class="helper" style="margin-bottom:10px;">يُسجِّل النظام مرحلة كل جهة تلقائيًا من اسمها. المصنّفة «أخرى» لم يُعرف نوعها من الاسم — اختر مرحلتها من القائمة بجانبها فتُحفظ فورًا وتُعتمد في كل التقارير.</div>
    <div class="ss-body"></div></div>`;
  const card = box.querySelector('#stgSchoolsBox');
  const rows = ()=>state.schools.filter(s=>(!pick || (s.stage||detectSchoolStage(s))===pick) && (!q || _pnz(s.name).includes(_pnz(q))))
    .sort((a,b)=>a.name.localeCompare(b.name,'ar'));
  const evCount = id => state.orders.filter(o=>o.schoolId===id && isLiveOrder(o)).length;
  function draw(){
    const cnt = {}; SCHOOL_TYPES.forEach(t=>cnt[t]=0); state.schools.forEach(s=>cnt[s.stage||detectSchoolStage(s)]++);
    const list = rows();
    card.querySelector('.ss-body').innerHTML = `
      <div class="stg-chips">
        <button type="button" data-ss="" class="${pick?'':'on'}">الكل <b>${state.schools.length}</b></button>
        ${SCHOOL_TYPES.map(t=>`<button type="button" data-ss="${t}" class="${pick===t?'on':''}${t==='أخرى'&&cnt[t]?' warn':''}">${t} <b>${cnt[t]}</b></button>`).join('')}
      </div>
      <input class="ss-q" placeholder="بحث باسم المدرسة..." value="${escapeHtml(q)}" style="width:100%;margin-bottom:10px;">
      ${list.length ? `<div class="tbl-scroll"><table class="set-table" style="width:100%;"><thead><tr><th>#</th><th style="text-align:right;">اسم الجهة</th><th style="width:170px;">المرحلة</th><th>الطريقة</th><th style="text-align:right;">المشرفون</th><th>الفعاليات</th><th></th></tr></thead><tbody>
        ${list.map((s,i)=>`<tr><td>${i+1}</td><td style="text-align:right;font-weight:700;">${escapeHtml(s.name)}</td>
          <td>${stageSelectHtml(s)}</td><td class="helper">${s.stageManual?'يدوي':'من الاسم'}</td>
          <td style="text-align:right;" class="helper">${(s.supervisors||[]).map(v=>escapeHtml(v.name)+(v.phone?` (${escapeHtml(v.phone)})`:'')).join('، ')||'—'}</td>
          <td>${evCount(s.id)}</td>
          <td><button class="icon-btn" title="ملف الجهة" aria-label="ملف الجهة" onclick="openSchoolProfile('${s.id}')" style="width:28px;height:28px;padding:0;">${icon('school',13)}</button></td></tr>`).join('')}
      </tbody></table></div>` : `<div class="empty-state">${pick==='أخرى'?'لا توجد مدارس مصنّفة «أخرى» — كل المدارس معروفة المرحلة':'لا توجد مدارس'}</div>`}`;
    card.querySelectorAll('[data-ss]').forEach(b=>b.onclick=()=>{ pick=b.dataset.ss; draw(); });
    const qi = card.querySelector('.ss-q'); qi.oninput = ()=>{ q = qi.value; clearTimeout(qi.__t); qi.__t = setTimeout(()=>{ draw(); const n=card.querySelector('.ss-q'); n.focus(); n.setSelectionRange(n.value.length,n.value.length); }, 250); };
  }
  card.__redraw = draw;
  const COLS = ['#','اسم الجهة','المرحلة','الطريقة','المشرفون','الفعاليات'];
  const arr = list => list.map((s,i)=>[i+1, s.name, s.stage||detectSchoolStage(s), s.stageManual?'يدوي':'من الاسم',
    (s.supervisors||[]).map(v=>v.name+(v.phone?` (${v.phone})`:'')).join('، ')||'—', evCount(s.id)]);
  card.querySelector('#ss_print').onclick = ()=>{
    const list = rows(); if(!list.length){ toast('لا توجد بيانات'); return; }
    const cnt = {}; SCHOOL_TYPES.forEach(t=>cnt[t]=0); state.schools.forEach(s=>cnt[s.stage||detectSchoolStage(s)]++);
    doPrintDoc(buildReportDoc({ titleAr: pick ? `المدارس المصنّفة: ${pick}` : 'تصنيف المدارس حسب المرحلة',
      subtitle: `${list.length} جهة — ${fmtDateRaw(todayStr())}`,
      kpis: SCHOOL_TYPES.map(t=>({v:cnt[t], l:`🏫 ${t}`})),
      headers: COLS, colWidths:['10mm','80mm','28mm','22mm','auto','20mm'],
      rows: arr(list).map(r=>r.map(v=>escapeHtml(String(v)))) }), true, 'A4');
  };
  card.querySelector('#ss_excel').onclick = ()=>{
    const list = rows(); if(!list.length){ toast('لا توجد بيانات'); return; }
    exportToExcel(`تصنيف_المدارس${pick?'_'+pick:''}.xlsx`, COLS, arr(list), pick?`المدارس المصنّفة: ${pick}`:'تصنيف المدارس حسب المرحلة');
  };
  const bk = card.querySelector('#ss_back'); if(bk) bk.onclick = back;
  draw();
}
function openSchoolStagesModal(){
  showInfoModal('', '<div id="ssHost"></div>', box=>{ box.style.maxWidth='1000px'; const h=box.querySelector('h3'); if(h) h.remove();
    drawSchoolStagesReport(box.querySelector('#ssHost')); });
}

/* ══════════════════════════════════════════════════════════════════
   نماذج الطلبات الإدارية (Excel) — بنفس جداول ملف «النماذج» المعتمد:
   تغطية إعلامية · سيارة المركز · طلب مندوب · مرافق
   كل ورقة تُملأ تلقائيًا من الطلبات الإدارية المختارة في كل فعالية
   ══════════════════════════════════════════════════════════════════ */
const REQ_FORM_RULES = {
  media:  /تصوير|توثيق|مونتاج|تغطيه|اعلام/,
  car:    /سياره/,
  rep:    /مندوب/,
  venue:  /مخيم|استراحه|مقر المركز|مرافق|قاعه/,
};
function orderReqNames(o){
  return (o.adminRequests||[]).map(id=>{ const r=state.adminRequestsList.find(x=>x.id===id); return r?r.name:''; }).filter(Boolean);
}
function reqsMatching(o, key){ return orderReqNames(o).filter(n=>REQ_FORM_RULES[key].test(_pnz(n).replace(/\s+/g,' '))); }
let __xlsxStyleLoading = null;
function loadXlsxStyle(){
  if(window.__XLSXS) return Promise.resolve(window.__XLSXS);
  if(__xlsxStyleLoading) return __xlsxStyleLoading;
  __xlsxStyleLoading = new Promise(res=>{
    const prev = window.XLSX;
    const sc = document.createElement('script');
    sc.src = 'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js';
    sc.onload = ()=>{ window.__XLSXS = window.XLSX; if(prev) window.XLSX = prev; res(window.__XLSXS); };
    sc.onerror = ()=>{ if(prev) window.XLSX = prev; res(null); };
    document.head.appendChild(sc);
  });
  return __xlsxStyleLoading;
}
async function exportRequestFormsBasic(list, from, to){
  const live = list.filter(o=>o.status!=='cancelled' && o.completionStatus!=='الغيت')
    .sort((a,b)=>(a.date||'').localeCompare(b.date||'') || (a.timeFrom||'').localeCompare(b.timeFrom||''));
  const X = await loadXlsxStyle() || (xlsxReady() ? window.XLSX : null);
  if(!X){ toast('تعذّر تحميل مكتبة Excel — تحقق من الاتصال'); return; }
  const styled = !!window.__XLSXS && X===window.__XLSXS;
  const time = o => (o.timeFrom||o.timeTo) ? `من الساعة ${o.timeFrom||'—'} إلى الساعة ${o.timeTo||'—'}` : '';
  const date = o => o.dateTo && o.dateTo!==o.date ? `${fmtDateRaw(o.date)} - ${fmtDateRaw(o.dateTo)}` : fmtDateRaw(o.date);
  const place = o => { const s = state.schools.find(x=>x.id===o.schoolId); return (s?s.name:'') + (o.venue ? ` — مكان التنفيذ: ${o.venue}` : ''); };
  const trs = o => (o.trainerIds||[]).map(id=>state.trainers.find(t=>t.id===id)).filter(Boolean);
  const contact = o => { const t = trs(o); const ph = t.map(x=>x.phone).filter(Boolean);
    return t.map(x=>x.name).join('، ') + (ph.length ? ' — ' + ph.join('، ') : ''); };
  const dept = (state.printHeader && state.printHeader.line3) || '';
  const S = {
    title: { font:{name:'Arial', sz:18, bold:true, color:{rgb:'5A142F'}}, alignment:{horizontal:'center', vertical:'center'} },
    head:  { font:{name:'Arial', sz:14, bold:true, color:{rgb:'FFFFFF'}}, fill:{fgColor:{rgb:'7A1E3E'}},
             alignment:{horizontal:'center', vertical:'center', wrapText:true},
             border:{top:{style:'thin',color:{rgb:'5A142F'}},bottom:{style:'thin',color:{rgb:'5A142F'}},left:{style:'thin',color:{rgb:'5A142F'}},right:{style:'thin',color:{rgb:'5A142F'}}} },
    cell:  { font:{name:'Arial', sz:13, bold:true}, alignment:{horizontal:'center', vertical:'center', wrapText:true},
             border:{top:{style:'thin',color:{rgb:'999999'}},bottom:{style:'thin',color:{rgb:'999999'}},left:{style:'thin',color:{rgb:'999999'}},right:{style:'thin',color:{rgb:'999999'}}} },
    group: { font:{name:'Arial', sz:13, bold:true}, fill:{fgColor:{rgb:'FCE4D6'}}, alignment:{horizontal:'center', vertical:'center'},
             border:{top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}} },
  };
  /* يبني ورقة: عنوان مدمج + رأس (صف أو صفان) + بيانات، مع إزاحة أعمدة اختيارية */
  function sheet({title, headers, sub, rows, widths, col0=0, minRows=5}){
    const c0 = col0, nC = headers.length, aoa = [];
    const pad = arr => Array(c0).fill('').concat(arr);
    aoa.push(pad([title].concat(Array(nC-1).fill(''))));
    aoa.push(pad(headers));
    if(sub) aoa.push(pad(sub));
    const body = rows.length ? rows : [];
    body.forEach((r,i)=>aoa.push(pad([i+1].concat(r))));
    for(let i=body.length; i<minRows; i++) aoa.push(pad([i+1].concat(Array(nC-1).fill(''))));
    const ws = X.utils.aoa_to_sheet(aoa);
    const merges = [{s:{r:0,c:c0}, e:{r:0,c:c0+nC-1}}];
    const hRows = sub ? 2 : 1;
    if(sub) headers.forEach((h,i)=>{ if(!sub[i]) merges.push({s:{r:1,c:c0+i}, e:{r:2,c:c0+i}}); });
    ws['!merges'] = merges;
    ws['!cols'] = Array(c0).fill({wch:3}).concat(widths.map(w=>({wch:w})));
    ws['!rows'] = [{hpt:46}].concat(Array(hRows).fill({hpt:28}));
    if(styled){
      const st = (r,c,s)=>{ const a = X.utils.encode_cell({r,c}); if(!ws[a]) ws[a] = {t:'s', v:''}; ws[a].s = s; };
      st(0, c0, S.title);
      for(let r=1; r<=hRows; r++) for(let c=0;c<nC;c++) st(r, c0+c, S.head);
      for(let r=1+hRows; r<aoa.length; r++) for(let c=0;c<nC;c++) st(r, c0+c, S.cell);
    }
    return ws;
  }
  const wb = X.utils.book_new();
  wb.Workbook = { Views:[{RTL:true}] };
  const pick = key => live.filter(o=>reqsMatching(o,key).length);

  /* 1) تغطية إعلامية — تصوير وتوثيق، مونتاج */
  const media = pick('media');
  X.utils.book_append_sheet(wb, sheet({ title:'طلب تغطية إعلامية',
    headers:['م','التكليف','الفعالية','التاريخ','الوقت','المكان','للتواصل','ملاحظات'],
    widths:[5,12,44,16,38,44,44,26],
    rows: media.map(o=>[String(o.serial), o.title||'', date(o), time(o), place(o), contact(o), reqsMatching(o,'media').join('، ')]) }), 'تغطية اعلامية');

  /* 2) سيارة المركز — توفير سيارة */
  const car = pick('car');
  X.utils.book_append_sheet(wb, sheet({ title:'نموذج طلب السيارة المركز', col0:1,
    headers:['م','تكليف','الغرض /المبادرة','تاريخ التسليم','الوقت','المكان','المسؤول','الطلب الإداري','تلفيات /مخالفات','الإجراء'],
    widths:[5,10,40,16,36,44,40,24,16,20],
    rows: car.map(o=>[String(o.serial), o.title||'', date(o), time(o), place(o), contact(o), reqsMatching(o,'car').join('، '), '', '']) }), 'سيارة المركز');

  /* 3) طلب مندوب — توفير مندوب لإيصال المدرب */
  const rep = pick('rep');
  X.utils.book_append_sheet(wb, sheet({ title:'نموذج طلب مندوب',
    headers:['م','تكليف','عنوان الفعالية','التاريخ','الوقت','المكان','للتواصل'],
    sub:    ['','','','','من - إلى','',''],
    widths:[5,10,36,16,40,44,44],
    rows: rep.map(o=>[String(o.serial), o.title||'', date(o), time(o), place(o), contact(o)]) }), 'طلب مندوب');

  /* 4) مرافق — حجز مخيم، حجز استراحة المؤسسة، توفير مقر المركز */
  const ven = pick('venue');
  X.utils.book_append_sheet(wb, sheet({ title:'نموذج حجز مرافق',
    headers:['م','التكليف','القسم','اسم النشاط','المستفيد','المرافق المطلوبة','تاريخ الدخول','وقت الدخول','تاريخ الخروج','وقت الخروج','المسؤول','رقم الجوال','الجهة'],
    widths:[5,10,20,34,10,30,14,14,14,14,34,22,40],
    rows: ven.map(o=>{ const t = trs(o); const s = state.schools.find(x=>x.id===o.schoolId);
      const need = reqsMatching(o,'venue').join('، ');
      return [String(o.serial), dept, o.title||'', String(o.participantsCount||''), o.venue ? `${o.venue} (${need})` : need,
        fmtDateRaw(o.date), o.timeFrom||'', fmtDateRaw(o.dateTo||o.date), o.timeTo||'',
        t.map(x=>x.name).join('، '), t.map(x=>x.phone).filter(Boolean).join('، '), s?s.name:'']; }) }), 'مرافق');

  const tag = from||to ? `_${from||''}_${to||''}` : '';
  X.writeFile(wb, `نماذج_الطلبات_الإدارية${tag}.xlsx`);
  toast(`نماذج الطلبات: تغطية ${media.length} · سيارة ${car.length} · مندوب ${rep.length} · مرافق ${ven.length}`);
}

/* ══════════════════════════════════════════════════════════════════
   نماذج الطلبات الإدارية المعتمدة — يُملأ ملف النماذج الأصلي نفسه
   (كل الأوراق موجودة بتصميمها كما هي، وتُملأ أربع منها من النظام)
   ══════════════════════════════════════════════════════════════════ */
let __jszipLoading = null;
function loadJSZip(){
  if(window.JSZip) return Promise.resolve(window.JSZip);
  if(__jszipLoading) return __jszipLoading;
  __jszipLoading = new Promise(res=>{
    const sc = document.createElement('script');
    sc.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
    sc.onload = ()=>res(window.JSZip || null); sc.onerror = ()=>res(null);
    document.head.appendChild(sc);
  });
  return __jszipLoading;
}
function _colIdx(L){ let n=0; for(const ch of L) n = n*26 + (ch.charCodeAt(0)-64); return n; }
function _colOf(ref){ return ref.replace(/\d+/g,''); }
async function exportRequestForms(list, from, to){
  const live = list.filter(o=>o.status!=='cancelled' && o.completionStatus!=='الغيت')
    .sort((a,b)=>(a.date||'').localeCompare(b.date||'') || (a.timeFrom||'').localeCompare(b.timeFrom||''));
  const JSZip = await loadJSZip();
  if(!JSZip){ toast('تعذّر تحميل أداة الملفات — يُنزَّل نموذج مبسّط بدلًا منه'); return exportRequestFormsBasic(list, from, to); }
  const bin = Uint8Array.from(atob(REQ_TEMPLATE_B64), ch=>ch.charCodeAt(0));
  const zip = await JSZip.loadAsync(bin);
  const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const XMLNS = 'http://www.w3.org/XML/1998/namespace';
  const parse = s => new DOMParser().parseFromString(s, 'application/xml');
  const ser = d => new XMLSerializer().serializeToString(d);

  /* ── الأنماط: نسخة صفراء من كل نمط خلية نحتاجه ── */
  const stDoc = parse(await zip.file('xl/styles.xml').async('string'));
  const fills = stDoc.getElementsByTagName('fills')[0], xfs = stDoc.getElementsByTagName('cellXfs')[0];
  const yFill = stDoc.createElementNS(NS,'fill'), pf = stDoc.createElementNS(NS,'patternFill');
  pf.setAttribute('patternType','solid');
  const fg = stDoc.createElementNS(NS,'fgColor'); fg.setAttribute('rgb','FFFFFF99'); pf.appendChild(fg);
  const bg = stDoc.createElementNS(NS,'bgColor'); bg.setAttribute('indexed','64'); pf.appendChild(bg);
  yFill.appendChild(pf); fills.appendChild(yFill);
  const yellowFillId = fills.getElementsByTagName('fill').length - 1;
  fills.setAttribute('count', String(yellowFillId+1));
  const yMap = {};
  const yellowOf = s => {
    s = String(s||0); if(yMap[s]!==undefined) return yMap[s];
    const src = xfs.getElementsByTagName('xf')[Number(s)];
    const xf = src ? src.cloneNode(true) : stDoc.createElementNS(NS,'xf');
    xf.setAttribute('fillId', String(yellowFillId)); xf.setAttribute('applyFill','1');
    xfs.appendChild(xf);
    const idx = xfs.getElementsByTagName('xf').length - 1; xfs.setAttribute('count', String(idx+1));
    return (yMap[s] = String(idx));
  };

  /* ── تعبئة ورقة: start = أول صف بيانات، cols = {حرف العمود: دالة القيمة} ── */
  const printAreas = {};
  async function fillSheet(file, start, numCol, cols, items, highlight, pa){
    const doc = parse(await zip.file(file).async('string'));
    const sd = doc.getElementsByTagName('sheetData')[0];
    const rowsBy = {}; Array.from(sd.getElementsByTagName('row')).forEach(r=>rowsBy[Number(r.getAttribute('r'))] = r);
    const tplRow = rowsBy[start];
    const tplStyle = {};
    if(tplRow) Array.from(tplRow.getElementsByTagName('c')).forEach(c=>tplStyle[_colOf(c.getAttribute('r'))] = c.getAttribute('s'));
    const nearestStyle = col => { if(tplStyle[col]) return tplStyle[col];
      const ks = Object.keys(tplStyle).sort((a,b)=>Math.abs(_colIdx(a)-_colIdx(col))-Math.abs(_colIdx(b)-_colIdx(col))); return ks.length ? tplStyle[ks[0]] : null; };
    function getRow(n){
      if(rowsBy[n]) return rowsBy[n];
      const r = doc.createElementNS(NS,'row'); r.setAttribute('r', String(n));
      if(tplRow){ ['spans','ht','customHeight'].forEach(a=>{ if(tplRow.hasAttribute(a)) r.setAttribute(a, tplRow.getAttribute(a)); }); }
      const after = Object.keys(rowsBy).map(Number).filter(k=>k>n).sort((a,b)=>a-b)[0];
      if(after) sd.insertBefore(r, rowsBy[after]); else sd.appendChild(r);
      return (rowsBy[n] = r);
    }
    function getCell(row, col, n){
      const ref = col + n;
      const cs = Array.from(row.getElementsByTagName('c'));
      let c = cs.find(x=>x.getAttribute('r')===ref);
      if(c) return c;
      c = doc.createElementNS(NS,'c'); c.setAttribute('r', ref);
      const st = nearestStyle(col); if(st) c.setAttribute('s', st);
      const nxt = cs.find(x=>_colIdx(_colOf(x.getAttribute('r'))) > _colIdx(col));
      if(nxt) row.insertBefore(c, nxt); else row.appendChild(c);
      return c;
    }
    function setVal(c, v){
      while(c.firstChild) c.removeChild(c.firstChild);
      c.removeAttribute('t');
      if(v===null || v===undefined || v==='') return;
      if(typeof v==='number'){ const e = doc.createElementNS(NS,'v'); e.textContent = String(v); c.appendChild(e); return; }
      c.setAttribute('t','inlineStr');
      const is = doc.createElementNS(NS,'is'), t = doc.createElementNS(NS,'t');
      t.setAttributeNS(XMLNS,'xml:space','preserve'); t.textContent = String(v); is.appendChild(t); c.appendChild(is);
    }
    let maxRow = start;
    items.forEach((o,i)=>{
      const n = start + i; maxRow = n;
      const row = getRow(n);
      const all = Object.assign({[numCol]: ()=>i+1}, cols);
      Object.entries(all).forEach(([col, fn])=>{ setVal(getCell(row, col, n), fn(o)); });
      if(highlight(o)){
        /* تظليل السطر كله (كل خلايا الجدول في هذا الصف) */
        Object.keys(tplStyle).concat(Object.keys(all)).forEach(col=>{ const c = getCell(row, col, n); c.setAttribute('s', yellowOf(c.getAttribute('s'))); });
      }
    });
    /* منطقة الطباعة تشمل كل البيانات + طباعة أفقية بعرض صفحة واحدة */
    if(pa){
      const last = Math.max(maxRow, start + 4);
      printAreas[pa.sheetIdx] = `'${pa.name}'!$${pa.c1}$${pa.r1}:$${pa.c2}$${last}`;
      const root = doc.documentElement;
      let sp = doc.getElementsByTagName('sheetPr')[0];
      if(!sp){ sp = doc.createElementNS(NS,'sheetPr'); root.insertBefore(sp, root.firstChild); }
      let psp = sp.getElementsByTagName('pageSetUpPr')[0];
      if(!psp){ psp = doc.createElementNS(NS,'pageSetUpPr'); sp.appendChild(psp); }
      psp.setAttribute('fitToPage','1');
      const ps = doc.getElementsByTagName('pageSetup')[0];
      if(ps){ ps.setAttribute('orientation','landscape'); ps.removeAttribute('scale'); ps.setAttribute('fitToWidth','1'); ps.setAttribute('fitToHeight','0'); }
    }
    const dim = doc.getElementsByTagName('dimension')[0];
    if(dim){ const m = (dim.getAttribute('ref')||'').match(/^([A-Z]+\d+):([A-Z]+)(\d+)$/); if(m && maxRow > Number(m[3])) dim.setAttribute('ref', `${m[1]}:${m[2]}${maxRow}`); }
    zip.file(file, ser(doc));
  }

  /* ── المدخلات بنفس صيغة النظام ── */
  const time = o => (o.timeFrom||o.timeTo) ? `من الساعة ${o.timeFrom||'—'} إلى الساعة ${o.timeTo||'—'}` : '';
  const date = o => o.dateTo && o.dateTo!==o.date ? `${fmtDateRaw(o.date)} - ${fmtDateRaw(o.dateTo)}` : fmtDateRaw(o.date);
  const sch = o => state.schools.find(x=>x.id===o.schoolId);
  const place = o => { const s = sch(o); return (s?s.name:'') + (o.venue ? ` — مكان التنفيذ: ${o.venue}` : ''); };
  const trs = o => (o.trainerIds||[]).map(id=>state.trainers.find(t=>t.id===id)).filter(Boolean);
  const contact = o => { const t = trs(o); const ph = t.map(x=>x.phone).filter(Boolean); return t.map(x=>x.name).join('، ') + (ph.length ? ' — ' + ph.join('، ') : ''); };
  const dept = (state.printHeader && state.printHeader.line3) || '';
  const hasVenue = o => !!(o.venue && String(o.venue).trim());
  const pick = key => live.filter(o=>reqsMatching(o,key).length);
  const media = pick('media'), car = pick('car'), rep = pick('rep'), ven = pick('venue');

  /* تغطية اعلامية — sheet12: م، التكليف، الفعالية، التاريخ، الوقت، المكان، للتواصل، ملاحظات */
  await fillSheet('xl/worksheets/sheet12.xml', 4, 'A', {
    B:o=>String(o.serial), C:o=>o.title||'', D:date, E:time, F:place, G:contact, H:o=>reqsMatching(o,'media').join('، ')
  }, media, hasVenue, {sheetIdx:11, name:'تغطية اعلامية', c1:'A', r1:1, c2:'H'});
  /* سيارة المركز — sheet9: م، تكليف، الغرض/المبادرة، تاريخ التسليم، الوقت، المكان، المسؤول، الطلب الإداري، تلفيات، الإجراء */
  await fillSheet('xl/worksheets/sheet9.xml', 3, 'B', {
    C:o=>String(o.serial), D:o=>o.title||'', E:date, F:time, G:place, H:contact, I:o=>reqsMatching(o,'car').join('، ')
  }, car, hasVenue, {sheetIdx:8, name:'سيارة المركز', c1:'B', r1:1, c2:'K'});
  /* طلب مندوب — sheet8: م، تكليف، عنوان الفعالية، التاريخ، الوقت، المكان، للتواصل */
  await fillSheet('xl/worksheets/sheet8.xml', 5, 'A', {
    B:o=>String(o.serial), C:o=>o.title||'', D:date, E:time, F:place, G:contact
  }, rep, hasVenue, {sheetIdx:7, name:'طلب مندوب', c1:'A', r1:1, c2:'G'});
  /* مرافق — sheet5: م، القسم، اسم النشاط، المستفيد، المرافق المطلوبة، دخول/خروج، المسؤول، الجهة */
  await fillSheet('xl/worksheets/sheet5.xml', 9, 'A', {
    B:()=>dept, C:o=>o.title||'', D:o=>Number(o.participantsCount)||'',
    F:o=>{ const need = reqsMatching(o,'venue').join('، '); return o.venue ? `${o.venue} (${need})` : need; },
    H:o=>fmtDateRaw(o.date), I:time, J:o=>fmtDateRaw(o.dateTo||o.date), M:contact, O:o=>{ const s = sch(o); return s?s.name:''; }
  }, ven, hasVenue, {sheetIdx:4, name:'مرافق', c1:'A', r1:4, c2:'O'});

  zip.file('xl/styles.xml', ser(stDoc));
  { const wbDoc = parse(await zip.file('xl/workbook.xml').async('string'));
    Array.from(wbDoc.getElementsByTagName('definedName')).forEach(dn=>{
      const id = dn.getAttribute('localSheetId');
      if(dn.getAttribute('name')==='_xlnm.Print_Area' && printAreas[id]) dn.textContent = printAreas[id];
    });
    zip.file('xl/workbook.xml', ser(wbDoc)); }
  /* يُجبر Excel على إعادة الحساب عند الفتح */
  const blob = await zip.generateAsync({type:'blob', mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', compression:'DEFLATE'});
  const d = new Date(); const ds = `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `نماذج الطلبات الإدارية المعتمدة - ${ds}.xlsx`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
  toast(`نماذج الطلبات: تغطية ${media.length} · سيارة ${car.length} · مندوب ${rep.length} · مرافق ${ven.length}`);
}

/* ══════════════════════════════════════════════════════════════════
   الطلبات الإدارية المكررة بالاسم (مثل «توفير مقر المركز» مرتين):
   يُبقى واحد، وتُنقل إليه كل الفعاليات التي اختارت المكرر
   ══════════════════════════════════════════════════════════════════ */
function dedupeAdminRequests(){
  const L = state.adminRequestsList || []; const keep = {}; const remap = {}; let removed = 0;
  const out = [];
  L.forEach(r=>{ const k = _pnz(r.name||'').replace(/\s+/g,' '); if(!k){ out.push(r); return; }
    if(keep[k]){ remap[r.id] = keep[k].id; removed++; } else { keep[k] = r; out.push(r); } });
  if(!removed) return 0;
  state.adminRequestsList = out;
  (state.orders||[]).forEach(o=>{ if(!o.adminRequests) return;
    o.adminRequests = Array.from(new Set(o.adminRequests.map(id=>remap[id]||id))); });
  return removed;
}

/* قالب «نماذج الطلبات الإدارية المعتمدة» — الملف الأصلي بعد تفريغ البيانات التجريبية */
const REQ_TEMPLATE_B64 = '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';

/* ============ Init ============ */
(async function init(){
  try{ const A = fbAuth();
       await new Promise(r=>{ const un = A.onAuthStateChanged(()=>{ un(); r(); }); setTimeout(r, 2500); });
       if(A.currentUser) await A.signOut();
  }catch(e){ console.warn('auth init', e); }
  await loadState(); renderRoot();
})();

