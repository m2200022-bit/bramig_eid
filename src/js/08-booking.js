/* ══════════════════════════════════════════════════════════════════
   الحجوزات: كتالوج البرامج + ساعات عمل المقدّمين + المواعيد المتاحة
   + بوابة حجز للجهات (bookingPublic / bookingRequests) + صندوق الاعتماد
   ══════════════════════════════════════════════════════════════════ */
const WORK_DEFAULT = { days:[0,1,2,3,4], from:'07:30', to:'13:30', max:2, buffer:30 };
const DUR_OPTS = [30,45,60,90,120,150,180,240];
const DAY_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
function tMin(s){ const m = /^(\d{1,2}):(\d{2})/.exec(String(s||'')); return m ? (+m[1])*60 + (+m[2]) : null; }
function tStr(n){ n = Math.max(0, Math.min(1439, n|0)); return String(Math.floor(n/60)).padStart(2,'0') + ':' + String(n%60).padStart(2,'0'); }
function durTxt(m){ m=+m||0; const h=Math.floor(m/60), r=m%60; return (h?`${h} ساعة`:'') + (h&&r?' و':'') + (r?`${r} دقيقة`:'') || '—'; }
function trWork(t){ return Object.assign({}, WORK_DEFAULT, (t&&t.work)||{}); }
function bkCfg(){ return Object.assign({enabled:false, lead:3, horizon:60, note:''}, state.booking||{}); }
function catPrograms(onlyActive){ return (state.programs||[]).filter(p=>!onlyActive || p.active!==false); }
function catProg(id){ return (state.programs||[]).find(p=>p.id===id); }

/* ── فترات انشغال مقدّم في يوم (دقائق)؛ فعالية بلا وقت = اليوم كله ── */
function trBusy(tid, d, excludeId){
  return (state.orders||[]).filter(o=>isLiveOrder(o) && o.date && o.id!==excludeId && (o.trainerIds||[]).includes(tid) && d>=o.date && d<=orderEnd(o))
    .map(o=>{ const a=tMin(o.timeFrom), b=tMin(o.timeTo); return (a==null) ? [0,1440] : [a, b==null||b<=a ? a+60 : b]; });
}
/* ── قلب الحجز: المواعيد المتاحة (يُستخدم في النظام وبنسخة مطابقة في صفحة الحجز) ── */
function slotEngine(day, dur, trainers, busyOf, isLeave, opt){
  opt = opt||{}; const step = opt.step || 30, out = [];
  const dw = new Date(day+'T00:00:00').getDay();
  for(const t of trainers){
    const w = Object.assign({}, WORK_DEFAULT, t.work||{});
    if(!(w.days||[]).includes(dw) || isLeave(t.id, day)) continue;
    const busy = busyOf(t.id, day);
    if(busy.length >= (+w.max||2)) continue;
    const s = tMin(w.from), e = tMin(w.to), buf = +w.buffer||0, starts = [];
    if(s==null || e==null) continue;
    for(let x=s; x+dur<=e; x+=step){
      if(busy.every(([a,b])=> x+dur+buf <= a || x >= b+buf)) starts.push(x);
    }
    if(starts.length) out.push({tid:t.id, name:t.name, starts});
  }
  return out;
}
function slotsFor(day, dur, tids, excludeId){
  const trs = (state.trainers||[]).filter(t=>t && t.name && (!tids || !tids.length || tids.includes(t.id))).map(t=>({id:t.id, name:t.name, work:trWork(t)}));
  return slotEngine(day, dur, trs, (tid,d)=>trBusy(tid,d,excludeId), (tid,d)=>!!trainerLeaveOn(tid,d,d));
}

/* ══════ الإعدادات ← الكتالوج والمواعيد ══════ */
function renderCatalogTab(c){
  const P = catPrograms(false), cfg = bkCfg();
  const fName = id=>{ const f=(state.fields||[]).find(x=>x.id===id); return f?f.name:'—'; };
  const pName = id=>{ const f=(state.programTypes||[]).find(x=>x.id===id); return f?f.name:'—'; };
  const link = location.origin + location.pathname.replace(/[^/]*$/, '') + 'book.html';
  c.innerHTML = `
  <div class="card bk-set">
    <div class="bk-h"><h2>${icon('layers',17)} كتالوج البرامج</h2>
      <span class="sp"><button class="btn btn-outline btn-sm" id="cat_import">${icon('download',14)} استيراد من الفعاليات السابقة</button>
      <button class="btn btn-primary btn-sm" id="cat_add">${icon('plus',14)} برنامج جديد</button></span></div>
    <p class="helper">كل برنامج له مدة وفئة مستهدفة ومقدّمون مؤهلون. يُستخدم في «طلب فعالية جديد» لتعبئة البيانات واقتراح المواعيد المتاحة، ويظهر للجهات في بوابة الحجز.</p>
    ${P.length ? `<div class="bk-scroll"><table class="bk-tbl"><thead><tr><th>البرنامج</th><th>المجال / المسار</th><th>المدة</th><th>الفئة</th><th>المقدّمون</th><th>في البوابة</th><th></th></tr></thead><tbody>
      ${P.map(p=>`<tr class="${p.active===false?'off':''}"><td><b>${escapeHtml(p.name)}</b>${p.desc?`<small>${escapeHtml(p.desc)}</small>`:''}</td>
        <td>${escapeHtml(fName(p.fieldId))}<small>${escapeHtml(pName(p.programTypeId))}</small></td>
        <td class="nw">${durTxt(p.dur)}</td><td>${escapeHtml(p.audience||'—')}${p.max?`<small>حتى ${p.max} مستفيد</small>`:''}</td>
        <td>${(p.trainerIds||[]).length ? (p.trainerIds||[]).map(id=>{const t=state.trainers.find(x=>x.id===id);return t?`<span class="bk-chip">${escapeHtml(t.name)}</span>`:'';}).join('') : '<small>كل المقدّمين</small>'}</td>
        <td>${p.active===false?'<span class="badge">موقوف</span>':p.pub===false?'<span class="badge">داخلي</span>':'<span class="badge ok">ظاهر</span>'}</td>
        <td class="nw"><button class="btn btn-outline btn-sm" data-ed="${p.id}">${icon('edit',13)} تعديل</button></td></tr>`).join('')}
    </tbody></table></div>` : `<div class="pk-empty">${icon('layers',28)}<div>لا توجد برامج بعد — أضف برنامجًا أو استورد من الفعاليات السابقة</div></div>`}
  </div>

  <div class="card bk-set">
    <div class="bk-h"><h2>${icon('clock',17)} ساعات عمل المقدّمين</h2>
      <span class="sp"><button class="btn btn-primary btn-sm" id="wk_save">${icon('save',14)} حفظ الساعات</button></span></div>
    <p class="helper">تُحسب المواعيد المتاحة من هذه الساعات، مع الحد الأقصى للفعاليات في اليوم ووقت التنقّل بين فعاليتين.</p>
    <div class="bk-scroll"><table class="bk-tbl wk"><thead><tr><th>المقدّم</th><th>أيام العمل</th><th>من</th><th>إلى</th><th>أقصى/يوم</th><th>تنقّل (دقيقة)</th></tr></thead><tbody>
      ${(state.trainers||[]).filter(t=>t&&t.name).map(t=>{ const w=trWork(t); return `<tr data-tw="${t.id}"><td><b>${escapeHtml(t.name)}</b></td>
        <td><span class="wk-days">${DAY_AR.map((d,i)=>`<label class="${w.days.includes(i)?'on':''}"><input type="checkbox" value="${i}" ${w.days.includes(i)?'checked':''}>${d.replace('ال','').slice(0,3)}</label>`).join('')}</span></td>
        <td><input type="time" class="wk-f" value="${w.from}"></td><td><input type="time" class="wk-t" value="${w.to}"></td>
        <td><input type="number" class="wk-m" min="1" max="8" value="${w.max}"></td><td><input type="number" class="wk-b" min="0" max="180" step="5" value="${w.buffer}"></td></tr>`; }).join('')}
    </tbody></table></div>
  </div>

  <div class="card bk-set">
    <div class="bk-h"><h2>${icon('globe',17)} بوابة الحجز للجهات</h2>
      <span class="sp"><label class="bk-sw"><input type="checkbox" id="bk_on" ${cfg.enabled?'checked':''}> <b>${cfg.enabled?'مفعّلة':'متوقفة'}</b></label></span></div>
    <p class="helper">تختار الجهة البرنامج وترى المواعيد المتاحة فقط وترسل طلبها، فيصلك في «طلبات الحجز» لتعتمده بضغطة فيتحول إلى أمر تكليف. لا تظهر في البوابة أي بيانات داخلية — فقط البرامج وأسماء المقدّمين والأوقات المتاحة.</p>
    <div class="bk-grid">
      <label>أقل مدة قبل الموعد (أيام)<input type="number" id="bk_lead" min="0" max="30" value="${cfg.lead}"></label>
      <label>أقصى مدة للحجز مقدّمًا (أيام)<input type="number" id="bk_hor" min="7" max="180" value="${cfg.horizon}"></label>
      <label class="w">ملاحظة تظهر للجهات<input id="bk_note" value="${escapeHtml(cfg.note||'')}" placeholder="مثال: يُرجى الحجز قبل أسبوع على الأقل"></label>
    </div>
    <div class="bk-link"><span dir="ltr">${escapeHtml(link)}</span>
      <button class="btn btn-outline btn-sm" id="bk_copy">${icon('copy',14)} نسخ الرابط</button>
      <a class="btn btn-outline btn-sm" href="${escapeHtml(link)}" target="_blank" rel="noopener">${icon('eye',14)} فتح البوابة</a>
      <button class="btn btn-primary btn-sm" id="bk_save">${icon('refresh',14)} حفظ ونشر المواعيد</button></div>
    <div class="helper" id="bk_st">${state.bookingPublishedAt?`آخر نشر للمواعيد: ${new Date(state.bookingPublishedAt).toLocaleString('en-GB')}`:'لم تُنشر المواعيد بعد'} — تُحدَّث تلقائيًا بعد كل حفظ في النظام.</div>
  </div>`;
  c.querySelectorAll('[data-ed]').forEach(b=>b.onclick=()=>openProgramModal(b.dataset.ed));
  c.querySelector('#cat_add').onclick = ()=>openProgramModal(null);
  c.querySelector('#cat_import').onclick = importProgramsFromOrders;
  c.querySelectorAll('.wk-days input').forEach(i=>i.onchange=()=>i.parentElement.classList.toggle('on', i.checked));
  c.querySelector('#wk_save').onclick = async ()=>{
    c.querySelectorAll('[data-tw]').forEach(r=>{ const t=state.trainers.find(x=>x.id===r.dataset.tw); if(!t) return;
      t.work = { days:[...r.querySelectorAll('.wk-days input:checked')].map(i=>+i.value), from:r.querySelector('.wk-f').value||WORK_DEFAULT.from,
        to:r.querySelector('.wk-t').value||WORK_DEFAULT.to, max:+r.querySelector('.wk-m').value||2, buffer:+r.querySelector('.wk-b').value||0 }; });
    await saveState(); toast('تم حفظ ساعات العمل');
  };
  c.querySelector('#bk_on').onchange = e=>{ e.target.nextElementSibling.textContent = e.target.checked?'مفعّلة':'متوقفة'; };
  c.querySelector('#bk_copy').onclick = ()=>navigator.clipboard.writeText(link).then(()=>toast('تم نسخ رابط البوابة'));
  c.querySelector('#bk_save').onclick = async ()=>{
    state.booking = { enabled:c.querySelector('#bk_on').checked, lead:+c.querySelector('#bk_lead').value||0, horizon:+c.querySelector('#bk_hor').value||60, note:c.querySelector('#bk_note').value.trim() };
    await saveState(); const ok = await publishBookingSnapshot(true);
    toast(ok ? 'تم الحفظ ونشر المواعيد في البوابة' : 'تم الحفظ — تعذّر النشر الآن'); render();
  };
}
function openProgramModal(id){
  const p = id ? catProg(id) : {id:uid(), name:'', desc:'', fieldId:'', programTypeId:'', dur:60, audience:'', max:0, trainerIds:[], pub:true, active:true};
  const isNew = !id;
  showInfoModal(`${icon('layers',17)} ${isNew?'برنامج جديد':'تعديل برنامج'}`, `<div class="bk-form">
    <label class="w">اسم البرنامج *<input id="pm_name" value="${escapeHtml(p.name)}" placeholder="مثال: ورشة القيم"></label>
    <label class="w">وصف مختصر (يظهر للجهات)<input id="pm_desc" value="${escapeHtml(p.desc||'')}"></label>
    <label>المجال<select id="pm_field"><option value="">—</option>${(state.fields||[]).map(f=>`<option value="${f.id}" ${f.id===p.fieldId?'selected':''}>${escapeHtml(f.name)}</option>`).join('')}</select></label>
    <label>المسار<select id="pm_pt"><option value="">—</option>${(state.programTypes||[]).map(f=>`<option value="${f.id}" ${f.id===p.programTypeId?'selected':''}>${escapeHtml(f.name)}</option>`).join('')}</select></label>
    <label>المدة<select id="pm_dur">${DUR_OPTS.map(d=>`<option value="${d}" ${+p.dur===d?'selected':''}>${durTxt(d)}</option>`).join('')}</select></label>
    <label>الفئة المستهدفة<input id="pm_aud" value="${escapeHtml(p.audience||'')}" placeholder="مثال: طلاب المرحلة الإعدادية"></label>
    <label>أقصى عدد مستفيدين<input id="pm_max" type="number" min="0" value="${p.max||''}" placeholder="بلا حد"></label>
    <div class="w"><span class="lb">المقدّمون المؤهلون (بلا اختيار = الكل)</span><div class="bk-checks">
      ${(state.trainers||[]).filter(t=>t&&t.name).map(t=>`<label class="${(p.trainerIds||[]).includes(t.id)?'on':''}"><input type="checkbox" value="${t.id}" ${(p.trainerIds||[]).includes(t.id)?'checked':''}>${escapeHtml(t.name)}</label>`).join('')}</div></div>
    <label class="ck"><input type="checkbox" id="pm_pub" ${p.pub!==false?'checked':''}> يظهر في بوابة الحجز للجهات</label>
    <label class="ck"><input type="checkbox" id="pm_act" ${p.active!==false?'checked':''}> البرنامج فعّال</label>
    <div class="w acts"><button class="btn btn-primary" id="pm_save">${icon('save',15)} حفظ</button>
      ${isNew?'':`<button class="btn btn-outline" id="pm_del">${icon('trash',15)} حذف البرنامج من الكتالوج</button>`}</div></div>`, box=>{
    box.style.maxWidth = '640px';
    box.querySelectorAll('.bk-checks input').forEach(i=>i.onchange=()=>i.parentElement.classList.toggle('on', i.checked));
    box.querySelector('#pm_save').onclick = async ()=>{
      const name = box.querySelector('#pm_name').value.trim(); if(!name){ toast('اكتب اسم البرنامج'); return; }
      Object.assign(p, { name, desc:box.querySelector('#pm_desc').value.trim(), fieldId:box.querySelector('#pm_field').value, programTypeId:box.querySelector('#pm_pt').value,
        dur:+box.querySelector('#pm_dur').value, audience:box.querySelector('#pm_aud').value.trim(), max:+box.querySelector('#pm_max').value||0,
        trainerIds:[...box.querySelectorAll('.bk-checks input:checked')].map(i=>i.value), pub:box.querySelector('#pm_pub').checked, active:box.querySelector('#pm_act').checked });
      if(isNew) state.programs = (state.programs||[]).concat([p]);
      await saveState(); closeModal(); toast('تم حفظ البرنامج'); render();
    };
    const del = box.querySelector('#pm_del');
    if(del) del.onclick = async ()=>{ if(!confirm('حذف البرنامج من الكتالوج؟ (لا يؤثر على الفعاليات المسجّلة)')) return;
      state.programs = (state.programs||[]).filter(x=>x.id!==p.id); await saveState(); closeModal(); render(); };
  });
}
async function importProgramsFromOrders(){
  const have = new Set(catPrograms(false).map(p=>_pnz(p.name)));
  const g = {};
  (state.orders||[]).filter(o=>isLiveOrder(o) && o.title).forEach(o=>{
    const k = _pnz(o.title); if(have.has(k)) return;
    const a=tMin(o.timeFrom), b=tMin(o.timeTo);
    (g[k] = g[k] || {name:o.title.trim(), n:0, fields:{}, pts:{}, durs:{}, trs:{}}).n++;
    g[k].fields[o.fieldId]=(g[k].fields[o.fieldId]||0)+1; g[k].pts[o.programTypeId]=(g[k].pts[o.programTypeId]||0)+1;
    if(a!=null && b!=null && b>a){ const d = Math.round((b-a)/15)*15; g[k].durs[d]=(g[k].durs[d]||0)+1; }
    (o.trainerIds||[]).forEach(t=>g[k].trs[t]=(g[k].trs[t]||0)+1);
  });
  const top = o => Object.entries(o).sort((x,y)=>y[1]-x[1])[0];
  const list = Object.values(g).filter(x=>x.n>=2).sort((a,b)=>b.n-a.n).slice(0,40);
  if(!list.length){ toast('لا توجد فعاليات متكررة جديدة للاستيراد'); return; }
  if(!confirm(`سيُضاف ${list.length} برنامجًا إلى الكتالوج من عناوين الفعاليات المتكررة (مرتين فأكثر)، مع المجال والمسار والمدة والمقدّمين الأكثر استخدامًا.\nيمكنك تعديلها أو حذفها بعد ذلك. متابعة؟`)) return;
  state.programs = (state.programs||[]).concat(list.map(x=>({ id:uid(), name:x.name, desc:'', fieldId:(top(x.fields)||[''])[0]||'', programTypeId:(top(x.pts)||[''])[0]||'',
    dur:+((top(x.durs)||[60])[0])||60, audience:'', max:0, trainerIds:Object.keys(x.trs).filter(t=>state.trainers.some(y=>y.id===t)), pub:true, active:true })));
  await saveState(); toast(`أُضيف ${list.length} برنامجًا`); render();
}

/* ══════ تعزيز نموذج الطلب: اختيار من الكتالوج + المواعيد المتاحة ══════ */
function catalogEnhanceForm(sub){
  if(!sub || sub.querySelector('#catPick')) return;
  const $ = id=>sub.querySelector('#'+id) || document.getElementById(id);
  const title = $('f_title'); if(!title) return;
  const editing = editingOrderId ? state.orders.find(o=>o.id===editingOrderId) : null;
  const P = catPrograms(true);
  const wrap = document.createElement('div'); wrap.className = 'cat-pick'; wrap.id = 'catPick';
  wrap.innerHTML = `<span class="lb">${icon('layers',15)} من الكتالوج</span>
    <select id="catSel" aria-label="اختيار برنامج من الكتالوج"><option value="">${P.length?'— اختر برنامجًا لتعبئة البيانات تلقائيًا —':'لا توجد برامج في الكتالوج (الإعدادات ← كتالوج البرامج)'}</option>
      ${P.map(p=>`<option value="${p.id}" ${editing&&editing.programId===p.id?'selected':''}>${escapeHtml(p.name)} · ${durTxt(p.dur)}</option>`).join('')}</select>
    <span class="cat-info" id="catInfo"></span>`;
  const anchor = title.closest('.card') || title.closest('table') || title.parentElement;
  anchor.parentElement.insertBefore(wrap, anchor);
  const slotsBox = document.createElement('div'); slotsBox.className = 'cat-slots'; slotsBox.id = 'catSlots'; slotsBox.hidden = true;
  const avail = $('wzDateAvail'); const dateEl = $('f_date');
  (avail || (dateEl && (dateEl.closest('.card')||dateEl.parentElement)))?.insertAdjacentElement('afterend', slotsBox);
  const set = (id, v)=>{ const el=$(id); if(!el || v==null) return; el.value = v; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); };
  const curProg = ()=>catProg($('catSel').value);
  window.__catProgId = editing ? (editing.programId||'') : '';
  function info(){ const p = curProg();
    $('catInfo').innerHTML = p ? `<span>${icon('clock',13)} ${durTxt(p.dur)}</span>${p.audience?`<span>${icon('users',13)} ${escapeHtml(p.audience)}</span>`:''}${p.max?`<span>حتى ${p.max} مستفيد</span>`:''}` : ''; }
  $('catSel').onchange = ()=>{
    const p = curProg(); window.__catProgId = p ? p.id : '';
    if(p){ set('f_title', p.name); if(p.fieldId) set('f_field', p.fieldId); if(p.programTypeId) set('f_ptype', p.programTypeId); }
    info(); slots();
  };
  function slots(){
    const p = curProg(), d = (($('f_date')||{}).value)||'';
    if(!p || !d){ slotsBox.hidden = true; return; }
    const S = slotsFor(d, +p.dur||60, p.trainerIds, editing&&editing.id);
    slotsBox.hidden = false;
    slotsBox.innerHTML = `<div class="h">${icon('clock',14)} المواعيد المتاحة لـ«${escapeHtml(p.name)}» يوم ${escapeHtml(dayNameOf(d))} ${fmtDate(d)} <small>(${durTxt(p.dur)})</small></div>
      ${S.length ? S.map(r=>`<div class="r"><b>${escapeHtml(r.name)}</b><span>${r.starts.map(x=>`<button type="button" data-st="${x}" data-tid="${r.tid}">${tStr(x)}</button>`).join('')}</span></div>`).join('')
        : `<div class="none">${icon('alert',14)} لا توجد مواعيد متاحة في هذا اليوم — جرّب يومًا آخر</div>`}`;
    slotsBox.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{
      const st = +b.dataset.st; set('f_timeFrom', tStr(st)); set('f_timeTo', tStr(st + (+p.dur||60)));
      const cb = Array.from(sub.querySelectorAll('#trainerChipList input')).find(c=>c.value===b.dataset.tid);
      if(cb && !cb.checked) cb.click();
      slotsBox.querySelectorAll('[data-st]').forEach(x=>x.classList.toggle('on', x===b));
      toast(`تم اختيار ${tStr(st)} مع ${r_name(b.dataset.tid)}`);
    });
  }
  const r_name = tid=>{ const t=state.trainers.find(x=>x.id===tid); return t?t.name:''; };
  ['f_date','f_dateTo'].forEach(id=>{ const el=$(id); if(el) el.addEventListener('change', ()=>setTimeout(slots, 50)); });
  const tf = $('f_timeFrom');
  if(tf) tf.addEventListener('change', ()=>{ const p=curProg(), a=tMin(tf.value), to=$('f_timeTo');
    if(p && a!=null && to && !to.value) set('f_timeTo', tStr(a + (+p.dur||60))); });
  info(); slots();
  /* تعبئة من طلب حجز معتمد */
  const pf = window.__prefill; window.__prefill = null;
  if(pf && !editing){
    if(pf.programId && catProg(pf.programId)){ $('catSel').value = pf.programId; $('catSel').dispatchEvent(new Event('change')); }
    if(pf.title) set('f_title', pf.title);
    if(pf.date) set('f_date', pf.date);
    if(pf.timeFrom) set('f_timeFrom', pf.timeFrom); if(pf.timeTo) set('f_timeTo', pf.timeTo);
    if(pf.count) set('f_count', pf.count);
    if(pf.schoolId){ set('f_school', pf.schoolId); }
    if(pf.note) set('f_reqNote', pf.note);
    setTimeout(()=>{ if(pf.trainerId){ const cb = Array.from(sub.querySelectorAll('#trainerChipList input')).find(c=>c.value===pf.trainerId); if(cb && !cb.checked) cb.click(); } }, 150);
    const bar = document.createElement('div'); bar.className = 'bk-from';
    bar.innerHTML = `${icon('inbox',15)} هذا الطلب من بوابة الحجز: <b>${escapeHtml(pf.contact||'')}</b> ${pf.phone?`<span dir="ltr">${escapeHtml(pf.phone)}</span>`:''} — ${escapeHtml(pf.schoolName||'')}. راجع البيانات ثم احفظ لاعتماده.`;
    wrap.parentElement.insertBefore(bar, wrap);
  }
}
(function(){
  if(typeof renderOrderForm !== 'function') return;
  const _rof = renderOrderForm;
  renderOrderForm = function(sub){ const r = _rof.apply(this, arguments); try{ catalogEnhanceForm(sub); }catch(e){ console.warn('catalog form', e); } return r; };
})();

/* ══════ نشر المواعيد للبوابة العامة (بلا أي بيانات داخلية) ══════ */
function bookingSnapshot(){
  const cfg = bkCfg(), today = todayStr(), end = addDaysISO(today, (+cfg.horizon||60) + 1);
  const trs = (state.trainers||[]).filter(t=>t && t.name);
  const busy = [], leaves = [], blocked = [];
  (state.orders||[]).filter(o=>isLiveOrder(o) && o.date && orderEnd(o)>=today && o.date<=end).forEach(o=>{
    (o.trainerIds||[]).forEach(t=>busy.push({t, d1:o.date, d2:orderEnd(o), f:o.timeFrom||'', to:o.timeTo||''})); });
  for(let d=today, g=0; d<=end && g<200; d=addDaysISO(d,1), g++){
    trs.forEach(t=>{ if(trainerLeaveOn(t.id,d,d)) leaves.push({t:t.id, d}); });
    try{ if(checkAcademicDate(d,d).some(x=>x.level==='block')) blocked.push(d); }catch(e){}
  }
  const ptName = id=>{ const f=(state.programTypes||[]).find(x=>x.id===id); return f?f.name:''; };
  const fdName = id=>{ const f=(state.fields||[]).find(x=>x.id===id); return f?f.name:''; };
  return {
    v:1, updatedAt: Date.now(), enabled: !!cfg.enabled, lead:+cfg.lead||0, horizon:+cfg.horizon||60, note: cfg.note||'',
    org: (state.printHeader && state.printHeader.line2) || state.orgName || '',
    programs: catPrograms(true).filter(p=>p.pub!==false).map(p=>({id:p.id, name:p.name, desc:p.desc||'', path:ptName(p.programTypeId), field:fdName(p.fieldId),
      dur:+p.dur||60, aud:p.audience||'', max:+p.max||0, trs:p.trainerIds||[]})),
    trainers: trs.map(t=>({id:t.id, name:t.name, work:trWork(t)})),
    busy, leaves, blocked,
    schools: (state.schools||[]).map(s=>({id:s.id, name:s.name})).sort((a,b)=>a.name.localeCompare(b.name,'ar')),
    placeTypes: (state.placeTypes||[]).map(p=>p.name),
  };
}
let __bkPubT = null;
async function publishBookingSnapshot(force){
  try{
    if(__archMode || !(currentRole==='admin' || currentRole==='user')) return false;
    if(!(firebase.auth && fbAuth().currentUser)) return false;
    if(!force && !(state.booking && state.booking.enabled) && !state.bookingPublishedAt) return false;
    const snap = bookingSnapshot();
    await getDb().collection('bookingPublic').doc('catalog').set({json: JSON.stringify(snap), updatedAt: snap.updatedAt});
    state.bookingPublishedAt = snap.updatedAt;
    return true;
  }catch(e){ console.warn('publish booking', e); return false; }
}
(function(){
  if(typeof saveState !== 'function') return;
  const _ss = saveState;
  saveState = function(){ const r = _ss.apply(this, arguments); clearTimeout(__bkPubT); __bkPubT = setTimeout(()=>publishBookingSnapshot(false), 4000); return r; };
})();

/* ══════ صندوق طلبات الحجز ══════ */
let __bkNew = [], __bkUnsub = null, __bkSeen = -1;
function bookingWatch(){
  if(__bkUnsub || !(currentRole==='admin' || currentRole==='user')) return;
  try{
    __bkUnsub = getDb().collection('bookingRequests').where('status','==','new').onSnapshot(s=>{
      __bkNew = s.docs.map(d=>Object.assign({_id:d.id}, d.data())).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
      document.querySelectorAll('.bk-badge').forEach(b=>{ b.textContent = __bkNew.length; b.hidden = !__bkNew.length; });
      if(__bkSeen>=0 && __bkNew.length > __bkSeen) toast(`${icon('inbox',14)} طلب حجز جديد من بوابة الجهات`);
      if(__bkSeen<0 && __bkNew.length) setTimeout(()=>toast(`لديك ${__bkNew.length} طلب حجز بانتظار الاعتماد`), 2500);
      __bkSeen = __bkNew.length;
    }, e=>{ console.warn('booking watch', e && e.code); __bkUnsub = null; });
  }catch(e){ console.warn(e); }
}
function bookingStop(){ try{ if(__bkUnsub) __bkUnsub(); }catch(e){} __bkUnsub = null; __bkSeen = -1; __bkNew = []; }
async function openBookingInbox(tab){
  tab = tab || 'new';
  let list = __bkNew;
  if(tab!=='new'){
    try{ const s = await getDb().collection('bookingRequests').where('status','==',tab).limit(60).get();
      list = s.docs.map(d=>Object.assign({_id:d.id}, d.data())).sort((a,b)=>(b.decidedAt||b.createdAt||0)-(a.decidedAt||a.createdAt||0)); }
    catch(e){ list = []; toast('تعذّر تحميل الطلبات'); }
  }
  const prog = r=>{ const p=catProg(r.programId); return p ? p.name : (r.programName||'—'); };
  const sch = r=>{ const s=(state.schools||[]).find(x=>x.id===r.schoolId); return s ? s.name : (r.schoolName||'—'); };
  const trn = id=>{ const t=(state.trainers||[]).find(x=>x.id===id); return t?t.name:''; };
  showInfoModal(`${icon('inbox',17)} طلبات الحجز من الجهات`, `<div class="bki">
    <div class="pk-seg bki-tabs">${[['new','بانتظار الاعتماد'],['approved','معتمدة'],['rejected','مرفوضة']].map(t=>`<button type="button" data-tab="${t[0]}" class="${tab===t[0]?'on':''}">${t[1]}${t[0]==='new'?` (${__bkNew.length})`:''}</button>`).join('')}</div>
    ${!list.length ? `<div class="pk-empty">${icon('inbox',28)}<div>لا توجد طلبات هنا</div></div>` : list.map(r=>`<div class="bki-c">
      <div class="t"><b>${escapeHtml(prog(r))}</b><span class="when">${icon('calendar',13)} ${escapeHtml(dayNameOf(r.date||''))} ${fmtDate(r.date||'')} · <span dir="ltr">${escapeHtml(r.timeFrom||'')}${r.timeTo?'–'+escapeHtml(r.timeTo):''}</span></span></div>
      <div class="g"><span>${icon('school',13)} ${escapeHtml(sch(r))}</span><span>${icon('user',13)} ${escapeHtml(r.contact||'—')}</span>
        ${r.phone?`<span>${evPhone(r.phone)}</span>`:''}${r.count?`<span>${icon('users',13)} ${escapeHtml(String(r.count))} مستفيد</span>`:''}
        ${r.trainerId?`<span>${icon('user',13)} المقدّم المفضّل: ${escapeHtml(trn(r.trainerId)||'—')}</span>`:''}
        ${r.alt?`<span>${icon('clock',13)} موعد بديل: ${escapeHtml(r.alt)}</span>`:''}</div>
      ${r.note?`<div class="n">${escapeHtml(r.note)}</div>`:''}
      <div class="m">أُرسل ${r.createdAt?new Date(r.createdAt).toLocaleString('en-GB'):''}${r.status==='approved'?` · اعتُمد أمر التكليف رقم <b>${escapeHtml(String(r.orderSerial||''))}</b>`:''}${r.status==='rejected'?` · سبب الرفض: ${escapeHtml(r.reason||'—')}`:''}${r.decidedBy?` · بواسطة ${escapeHtml(r.decidedBy)}`:''}</div>
      ${r.status==='new'?`<div class="a"><button class="btn btn-primary btn-sm" data-ok="${r._id}">${icon('checkCircle',14)} اعتماد وإنشاء أمر تكليف</button>
        <button class="btn btn-outline btn-sm" data-no="${r._id}">${icon('x',14)} رفض</button></div>`:''}
    </div>`).join('')}</div>`, box=>{
    box.style.maxWidth = '720px';
    box.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ closeModal(); openBookingInbox(b.dataset.tab); });
    box.querySelectorAll('[data-ok]').forEach(b=>b.onclick=()=>{
      const r = list.find(x=>x._id===b.dataset.ok); if(!r) return;
      const p = catProg(r.programId);
      window.__prefill = { programId:r.programId, title:p?p.name:r.programName, date:r.date, timeFrom:r.timeFrom, timeTo:r.timeTo, count:r.count,
        schoolId:(state.schools||[]).some(s=>s.id===r.schoolId)?r.schoolId:'', schoolName:sch(r), trainerId:r.trainerId, contact:r.contact, phone:r.phone,
        note:[r.note, `طلب من بوابة الحجز — ${r.contact||''} ${r.phone||''}${r.schoolId?'':' — الجهة: '+(r.schoolName||'')}`].filter(Boolean).join('\n') };
      window.__bookingReqId = r._id;
      closeModal(); editingOrderId = null; currentPage = 'newOrder'; render();
    });
    box.querySelectorAll('[data-no]').forEach(b=>b.onclick=async ()=>{
      const why = prompt('سبب الرفض (يظهر للجهة عند متابعة طلبها):', 'الموعد غير متاح، يُرجى اختيار موعد آخر'); if(why===null) return;
      try{ await getDb().collection('bookingRequests').doc(b.dataset.no).update({status:'rejected', reason:why.trim(), decidedAt:Date.now(), decidedBy:curUserName()});
        logAudit('booking', null, `رفض طلب حجز: ${why}`, true); toast('تم رفض الطلب'); closeModal(); openBookingInbox('new'); }
      catch(e){ toast('تعذّر التحديث: '+(e.code||e.message)); }
    });
  });
}
async function bookingMarkApproved(reqId, order){
  try{ await getDb().collection('bookingRequests').doc(reqId).update({status:'approved', orderSerial:order.serial, orderId:order.id, decidedAt:Date.now(), decidedBy:curUserName()});
    toast(`اعتُمد طلب الحجز وصدر أمر التكليف رقم ${order.serial}`); }
  catch(e){ console.warn('booking approve', e); toast('حُفظ الطلب، لكن تعذّر تحديث حالة طلب الحجز'); }
}
/* بدء المراقبة بعد الدخول، وإيقافها عند الخروج */
(function(){
  const t = setInterval(()=>{
    if((currentRole==='admin' || currentRole==='user') && !__bkUnsub){ try{ if(firebase.auth && fbAuth().currentUser) bookingWatch(); }catch(e){} }
    if(!currentRole && __bkUnsub) bookingStop();
  }, 3000);
})();



/* ══════ استرجاع كلمة المرور بالبريد ══════ */
const RECOV_DOC = h => getDb().collection('appLogin').doc('u_'+h);
async function readRecoveryEmail(h){ try{ const s = await RECOV_DOC(h).get(); return (s.exists && s.data().email) || ''; }catch(e){ return ''; } }
/* يجرّب البريد/الكلمة بالترتيب: الكلمة المحوّلة ثم الخام (بعد إعادة التعيين من رابط البريد) */
async function signInAny(A, emails, p){
  let last = null;
  for(const em of emails){ if(!em) continue;
    for(const pw of [authPw(p), p]){
      if(pw.length < 6) continue;
      try{ return await A.signInWithEmailAndPassword(em, pw); }
      catch(e){ last = e; if(!/invalid-credential|wrong-password|user-not-found|invalid-email/.test(e.code||'')) throw e; }
    }
  }
  throw last || {code:'auth/invalid-credential'};
}
function maskEmail(e){ const [a,b] = String(e).split('@'); return (a.length<=2 ? a[0]+'*' : a.slice(0,2)+'*'.repeat(Math.min(6,a.length-2))) + '@' + b; }
function openForgotPassword(){
  const pre = ((document.getElementById('lg_user')||{}).value||'').trim();
  showInfoModal(`${icon('mail',17)} نسيت كلمة المرور`, `<div class="fp">
    <p>اكتب اسم المستخدم أو البريد المسجّل، وسنرسل رابط إعادة تعيين كلمة المرور إلى بريدك.</p>
    <label>اسم المستخدم أو البريد<input id="fp_u" value="${escapeHtml(pre)}" autocomplete="username"></label>
    <div class="fp-msg" id="fp_msg"></div>
    <button class="btn btn-primary" id="fp_go">${icon('mail',15)} إرسال رابط إعادة التعيين</button>
    <p class="helper">بعد فتح الرابط اكتب كلمة المرور الجديدة (6 أحرف على الأقل)، ثم ادخل بها إلى النظام. إن لم يكن لحسابك بريد مسجّل فتواصل مع مدير النظام.</p></div>`, box=>{
    box.style.maxWidth = '440px';
    const go = box.querySelector('#fp_go'), msg = box.querySelector('#fp_msg');
    go.onclick = async ()=>{
      const v = box.querySelector('#fp_u').value.trim(); if(!v){ msg.textContent='اكتب اسم المستخدم أو البريد'; return; }
      go.disabled = true; msg.className='fp-msg'; msg.textContent='جارٍ الإرسال…';
      try{
        const em = v.includes('@') ? v : await readRecoveryEmail(await userHash(v));
        if(!em){ msg.className='fp-msg bad'; msg.textContent='لا يوجد بريد مسجّل لهذا الحساب — تواصل مع مدير النظام لإعادة التعيين.'; go.disabled=false; return; }
        try{ fbAuth().languageCode = 'ar'; }catch(e){}
        await fbAuth().sendPasswordResetEmail(em);
        msg.className='fp-msg ok'; msg.innerHTML = `${icon('checkCircle',15)} أُرسل الرابط إلى <b dir="ltr">${escapeHtml(maskEmail(em))}</b> — افحص البريد الوارد ومجلد الرسائل غير المرغوبة.`;
      }catch(e){
        msg.className='fp-msg bad';
        msg.textContent = e && e.code==='auth/user-not-found' ? 'هذا البريد غير مربوط بأي حساب في النظام.' : e && e.code==='auth/too-many-requests' ? 'محاولات كثيرة — انتظر قليلًا ثم أعد المحاولة.' : 'تعذّر الإرسال: '+((e&&e.code)||e);
        go.disabled = false;
      }
    };
  });
}
/* ربط بريد حقيقي بحساب: للمستخدم نفسه (تحقّق عبر البريد) أو للمدير عند وضع كلمة مرور جديدة */
async function linkRecoveryEmail(u, email, newPw){
  email = String(email||'').trim().toLowerCase();
  if(!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('البريد غير صحيح');
  const h = await userHash(u.username);
  const me = fbAuth().currentUser;
  if(newPw){
    /* إنشاء حساب بالبريد الحقيقي وكلمة المرور الجديدة (يحلّ محل الحساب السابق) */
    const A = auxAuth(); let cred;
    try{ cred = await A.createUserWithEmailAndPassword(email, authPw(newPw)); }
    catch(e){ if(e.code==='auth/email-already-in-use') throw new Error('هذا البريد مستخدم لحساب آخر'); throw e; }
    const uid = cred.user.uid; await A.signOut().catch(()=>{});
    await addMember(uid); if(u.authUid && u.authUid!==uid && !(me && me.uid===u.authUid)) await removeMember(u.authUid);
    if(me && me.uid===u.authUid){ /* المستخدم الحالي: نُبقي حسابه القديم عضوًا حتى يخرج */ }
    u.authUid = uid;
  } else if(me && me.uid===u.authUid){
    await me.verifyBeforeUpdateEmail(email);   /* يُرسل رابط تأكيد؛ بعد التأكيد يصبح البريد بريد الدخول */
  } else {
    throw new Error('لربط بريد مستخدم آخر اكتب له كلمة مرور جديدة أيضًا');
  }
  await RECOV_DOC(h).set({email});
  u.email = email;
}

