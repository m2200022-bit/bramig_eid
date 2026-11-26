/* ============ Statistics Page ============ */
function renderStatsPage(c){
  c.innerHTML = `
  <div class="card">
    <h2>تقرير تصنيفيات</h2>
    <div class="grid"><div class="field"><label>من تاريخ</label><input id="st_from" type="date" lang="en-GB"></div><div class="field"><label>إلى تاريخ</label><input id="st_to" type="date" lang="en-GB"></div></div>
    <button class="btn btn-primary" id="st_go">احتساب</button>
    <button class="icon-btn rect" id="st_print" title="طباعة الكل">🖨️ طباعة الكل</button>
    <button class="btn btn-outline" id="st_excel">📊 تنزيل Excel (كل التصنيفات)</button>
  </div>
  <div id="st_field_card" class="card" style="display:none;"></div>
  <div id="st_type_card" class="card" style="display:none;"></div>
  <div id="st_level_card" class="card" style="display:none;"></div>`;
  function compute(){
    const from=document.getElementById('st_from').value, to=document.getElementById('st_to').value;
    const inRange = state.orders.filter(o=>isLiveOrder(o) && (!from||o.date>=from) && (!to||o.date<=to));
    const byField = state.fields.map(f=>{
      const rel = inRange.filter(o=>o.fieldId===f.id);
      const schoolsSet = new Set(rel.map(o=>o.schoolId).filter(Boolean));
      const trainersSet = new Set(); rel.forEach(o=>(o.trainerIds||[]).forEach(id=>trainersSet.add(id)));
      const daysSet = new Set(rel.map(o=>o.date).filter(Boolean));
      let hours=0; rel.forEach(o=>{ if(o.timeFrom&&o.timeTo){ const s=parseDT(o.date,o.timeFrom), e=parseDT(o.date,o.timeTo); if(s&&e) hours+=Math.max(0,(e-s)/3600000)*daysCount(o.date,o.dateTo); } });
      return {name:f.name, programs:rel.length, participants: rel.reduce((s,o)=>s+(Number(o.participantsCount)||0),0), schools:schoolsSet.size, hours, trainers:trainersSet.size, days:daysSet.size};
    });
    const byType = state.programTypes.map(p=>{
      const rel = inRange.filter(o=>o.programTypeId===p.id);
      const schoolsSet = new Set(rel.map(o=>o.schoolId).filter(Boolean));
      const trainersSet = new Set(); rel.forEach(o=>(o.trainerIds||[]).forEach(id=>trainersSet.add(id)));
      const daysSet = new Set(rel.map(o=>o.date).filter(Boolean));
      let hours=0; rel.forEach(o=>{ if(o.timeFrom&&o.timeTo){ const s=parseDT(o.date,o.timeFrom), e=parseDT(o.date,o.timeTo); if(s&&e) hours+=Math.max(0,(e-s)/3600000)*daysCount(o.date,o.dateTo); } });
      return {name:p.name, programs:rel.length, participants: rel.reduce((s,o)=>s+(Number(o.participantsCount)||0),0), schools:schoolsSet.size, hours, trainers:trainersSet.size, days:daysSet.size};
    });
    const levels=['ابتدائي','إعدادي','ثانوي','مركز خاص','غير ذلك'];
    const byLevel = levels.map(lv=>{
      const schoolIds = state.schools.filter(s=>s.level===lv).map(s=>s.id);
      const rel = inRange.filter(o=>schoolIds.includes(o.schoolId));
      return {name:lv, programs:rel.length};
    });
    return {byField, byType, byLevel, from, to};
  }
  function tableFrom(arr){ return `<table class="print-table"><thead><tr><th>البند</th><th>عدد المدارس</th><th>عدد المبادرات</th><th>عدد الساعات</th><th>عدد الأيام</th><th>عدد المدربين</th><th>عدد الطلاب</th></tr></thead><tbody>
      ${arr.map(x=>`<tr><td>${escapeHtml(x.name)}</td><td>${x.schools}</td><td>${x.programs}</td><td>${x.hours.toFixed(1)}</td><td>${x.days}</td><td>${x.trainers}</td><td>${x.participants}</td></tr>`).join('')}</tbody></table>`; }
  function tableLevel(arr){ return `<table class="print-table"><thead><tr><th>المرحلة</th><th>عدد البرامج المنفذة</th></tr></thead><tbody>
      ${arr.map(x=>`<tr><td>${escapeHtml(x.name)}</td><td>${x.programs}</td></tr>`).join('')}</tbody></table>`; }

  document.getElementById('st_go').onclick=()=>{
    const {byField, byType, byLevel, from, to} = compute();
    const subtitle = `من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'}`;
    window.__lastStatsData = {byField, byType, byLevel, from, to};

    const fCard=document.getElementById('st_field_card'); fCard.style.display='block';
    fCard.innerHTML = `<h2>البند — حسب مجال المبادرة <button class="icon-btn rect" id="pr_field" title="طباعة">🖨️</button><button class="icon-btn rect" id="pr_field_pdf" title="تنزيل PDF">📄</button></h2>${tableFrom(byField)} ${svgDonutChart(byField.map(x=>({name:x.name, value:x.programs})).filter(x=>x.value>0))} ${svgBarChart(byField.map(x=>({name:x.name, value:x.programs})))}`;
    enhanceReportTable(fCard);
    document.getElementById('pr_field').onclick=()=>doPrintDoc(buildReportDoc({
      titleAr:'تقرير التصنيفيات — البند (مجال المبادرة)', subtitle,
      kpis:[{v:byField.reduce((s,x)=>s+x.programs,0),l:'إجمالي البرامج'},{v:byField.reduce((s,x)=>s+x.participants,0),l:'إجمالي الطلاب'},{v:byField.reduce((s,x)=>s+x.hours,0).toFixed(1),l:'إجمالي الساعات'},{v:byField.reduce((s,x)=>s+x.days,0),l:'إجمالي الأيام'}],
      headers:['البند','عدد المدارس','عدد المبادرات','عدد الساعات','عدد الأيام','عدد المدربين','عدد الطلاب'],
      rows:byField.map(x=>[escapeHtml(x.name),x.schools,x.programs,x.hours.toFixed(1),x.days,x.trainers,x.participants]),
      extraHtml:`<div class="sec-t">الرسم البياني</div>${svgBarChart(byField.map(x=>({name:x.name, value:x.programs})))}`
    }), true, 'A4');
    document.getElementById('pr_field_pdf').onclick=()=>document.getElementById('pr_field').onclick();

    const tCard=document.getElementById('st_type_card'); tCard.style.display='block';
    tCard.innerHTML = `<h2>حسب نوع البرنامج (مسار المبادرة) <button class="icon-btn rect" id="pr_type" title="طباعة">🖨️</button><button class="icon-btn rect" id="pr_type_pdf" title="تنزيل PDF">📄</button></h2>${tableFrom(byType)} ${svgDonutChart(byType.map(x=>({name:x.name, value:x.programs})).filter(x=>x.value>0))} ${svgBarChart(byType.map(x=>({name:x.name, value:x.programs})))}`;
    enhanceReportTable(tCard);
    document.getElementById('pr_type').onclick=()=>doPrintDoc(buildReportDoc({
      titleAr:'تقرير التصنيفيات — حسب نوع البرنامج', subtitle,
      kpis:[{v:byType.reduce((s,x)=>s+x.programs,0),l:'إجمالي البرامج'},{v:byType.reduce((s,x)=>s+x.participants,0),l:'إجمالي الطلاب'},{v:byType.reduce((s,x)=>s+x.hours,0).toFixed(1),l:'إجمالي الساعات'},{v:byType.reduce((s,x)=>s+x.days,0),l:'إجمالي الأيام'}],
      headers:['البند','عدد المدارس','عدد المبادرات','عدد الساعات','عدد الأيام','عدد المدربين','عدد الطلاب'],
      rows:byType.map(x=>[escapeHtml(x.name),x.schools,x.programs,x.hours.toFixed(1),x.days,x.trainers,x.participants]),
      extraHtml:`<div class="sec-t">الرسم البياني</div>${svgBarChart(byType.map(x=>({name:x.name, value:x.programs})))}`
    }), true, 'A4');
    document.getElementById('pr_type_pdf').onclick=()=>document.getElementById('pr_type').onclick();

    const lCard=document.getElementById('st_level_card'); lCard.style.display='block';
    lCard.innerHTML = `<h2>حسب نوع المرحلة الدراسية للمدارس <button class="icon-btn rect" id="pr_level" title="طباعة">🖨️</button><button class="icon-btn rect" id="pr_level_pdf" title="تنزيل PDF">📄</button></h2>${tableLevel(byLevel)} ${svgDonutChart(byLevel.map(x=>({name:x.name, value:x.programs})).filter(x=>x.value>0))} ${svgBarChart(byLevel.map(x=>({name:x.name, value:x.programs})))}`;
    document.getElementById('pr_level').onclick=()=>doPrintDoc(buildReportDoc({
      titleAr:'تقرير التصنيفيات — حسب المرحلة الدراسية', subtitle,
      kpis:[{v:byLevel.reduce((s,x)=>s+x.programs,0),l:'إجمالي البرامج'}],
      headers:['المرحلة','عدد البرامج المنفذة'],
      rows:byLevel.map(x=>[escapeHtml(x.name),x.programs]),
      extraHtml:`<div class="sec-t">الرسم البياني</div>${svgBarChart(byLevel.map(x=>({name:x.name, value:x.programs})))}`
    }), true, 'A4');
    document.getElementById('pr_level_pdf').onclick=()=>document.getElementById('pr_level').onclick();
  };
  document.getElementById('st_excel').onclick=()=>{
    if(!window.__lastStatsData){ toast('اضغط "احتساب" أولاً'); return; }
    const {byField, byType, byLevel, from, to} = window.__lastStatsData;
    exportToExcelMultiSheet('تقرير_التصنيفيات.xlsx', [
      {name:'حسب المجال', headers:['البند','عدد المدارس','عدد المبادرات','عدد الساعات','عدد الأيام','عدد المدربين','عدد الطلاب'], rows:byField.map(x=>[x.name,x.schools,x.programs,x.hours.toFixed(1),x.days,x.trainers,x.participants])},
      {name:'حسب نوع البرنامج', headers:['البند','عدد المدارس','عدد المبادرات','عدد الساعات','عدد الأيام','عدد المدربين','عدد الطلاب'], rows:byType.map(x=>[x.name,x.schools,x.programs,x.hours.toFixed(1),x.days,x.trainers,x.participants])},
      {name:'حسب المرحلة', headers:['المرحلة','عدد البرامج المنفذة'], rows:byLevel.map(x=>[x.name,x.programs])},
    ], `تقرير التصنيفيات (من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'})`);
  };
  document.getElementById('st_print').onclick=()=>{
    if(!window.__lastStatsData){ toast('اضغط "احتساب" أولاً'); return; }
    const {byField, byType, byLevel, from, to} = window.__lastStatsData;
    const sectionTable = (rows7)=>`<table><thead><tr><th>البند</th><th>عدد المدارس</th><th>عدد المبادرات</th><th>عدد الساعات</th><th>عدد الأيام</th><th>عدد المدربين</th><th>عدد الطلاب</th></tr></thead><tbody>
      ${rows7.map(x=>`<tr><td>${escapeHtml(x.name)}</td><td>${x.schools}</td><td>${x.programs}</td><td>${x.hours.toFixed(1)}</td><td>${x.days}</td><td>${x.trainers}</td><td>${x.participants}</td></tr>`).join('')}
    </tbody></table>`;
    const levelTable = `<table><thead><tr><th>المرحلة</th><th>عدد البرامج المنفذة</th></tr></thead><tbody>
      ${byLevel.map(x=>`<tr><td>${escapeHtml(x.name)}</td><td>${x.programs}</td></tr>`).join('')}
    </tbody></table>`;
    doPrintDoc(buildReportDoc({
      titleAr:'تقرير التصنيفيات الشامل', subtitle:`من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'}`,
      kpis:[{v:byField.reduce((s,x)=>s+x.programs,0),l:'إجمالي البرامج'},{v:byField.reduce((s,x)=>s+x.participants,0),l:'إجمالي الطلاب'},{v:byField.reduce((s,x)=>s+x.hours,0).toFixed(1),l:'إجمالي الساعات'}],
      extraHtml:`<div class="sec-t">حسب مجال المبادرة</div>${sectionTable(byField)}
        <div class="sec-t">حسب مسار المبادرة (نوع البرنامج)</div>${sectionTable(byType)}
        <div class="sec-t">حسب المرحلة الدراسية</div>${levelTable}`
    }), true, 'A4');
  };
}

/* ============ Tasks Page ============ */
function renderTasksPage(c){
  c.innerHTML = `<div class="card"><h2>إضافة مهمة</h2>
    <div class="grid">
      <div class="field"><label>اسم المهمة</label><input id="tk_title"></div>
      <div class="field"><label>تاريخ البدء</label><input id="tk_start" type="date" lang="en-GB"></div>
      <div class="field"><label>تاريخ الاستحقاق</label><input id="tk_due" type="date" lang="en-GB"></div>
      <div class="field"><label>مرتبطة بمنفذ مبادرة</label><select id="tk_trainer"><option value="">— بدون —</option>${state.trainers.map(t=>`<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('')}</select></div>
      <div class="field"><label>الأولوية</label><select id="tk_priority"><option value="منخفضة">منخفضة</option><option value="متوسطة" selected>متوسطة</option><option value="عالية">عالية</option></select></div>
      <div class="field"><label>الحالة</label><select id="tk_status"><option value="لم تبدأ" selected>لم تبدأ</option><option value="قيد التنفيذ">قيد التنفيذ</option><option value="مكتملة">مكتملة</option></select></div>
    </div>
    <div class="field" style="margin-bottom:14px;"><label>ملاحظات</label><textarea id="tk_notes"></textarea></div>
    <button class="btn btn-primary" id="tk_add">إضافة</button></div>
  <div class="card"><h2>قائمة المهام</h2><div id="tk_list"></div></div>`;
  function drawList(){
    const box=document.getElementById('tk_list');
    if(!state.tasks.length){ box.innerHTML=`<div class="empty-state">لا توجد مهام</div>`; return; }
    const today=todayStr();
    box.innerHTML = `<table><thead><tr><th>المهمة</th><th>البدء</th><th>الاستحقاق</th><th>مرتبطة بـ</th><th>الأولوية</th><th>الحالة</th><th>ملاحظات</th><th></th></tr></thead><tbody>
      ${state.tasks.slice().sort((a,b)=>(a.due||'').localeCompare(b.due||'')).map(t=>{
        const trainer=state.trainers.find(x=>x.id===t.trainerId);
        const overdue = t.due && t.due<today && t.status!=='مكتملة';
        const prioBadge = t.priority==='عالية'?'<span class="badge bad">عالية</span>':t.priority==='منخفضة'?'<span class="badge">منخفضة</span>':'<span class="badge busy">متوسطة</span>';
        const statusBadge = t.status==='مكتملة'?'<span class="badge ok">مكتملة</span>':t.status==='قيد التنفيذ'?'<span class="badge busy">قيد التنفيذ</span>':'<span class="badge">لم تبدأ</span>';
        return `<tr style="${overdue?'background:#fdecec;':''}">
        <td>${escapeHtml(t.title)}</td><td>${t.start||'—'}</td><td>${t.due||'—'}${overdue?' ⚠️':''}</td>
        <td>${trainer?escapeHtml(trainer.name):'—'}</td><td>${prioBadge}</td>
        <td><select onchange="updateTaskStatus('${t.id}', this.value)"><option value="لم تبدأ" ${t.status==='لم تبدأ'?'selected':''}>لم تبدأ</option><option value="قيد التنفيذ" ${t.status==='قيد التنفيذ'?'selected':''}>قيد التنفيذ</option><option value="مكتملة" ${t.status==='مكتملة'?'selected':''}>مكتملة</option></select></td>
        <td style="max-width:180px;">${escapeHtml(t.notes||'')}</td>
        <td><button class="icon-btn danger" onclick="deleteTask('${t.id}')">🗑️</button></td></tr>`;
      }).join('')}
    </tbody></table>`;
  }
  document.getElementById('tk_add').onclick=async ()=>{
    const title=document.getElementById('tk_title').value.trim();
    if(!title){ toast('أدخل اسم المهمة'); return; }
    const trainerId = document.getElementById('tk_trainer').value;
    const due = document.getElementById('tk_due').value;
    state.tasks.push({
      id:uid(), title, start:document.getElementById('tk_start').value, due,
      trainerId, priority:document.getElementById('tk_priority').value,
      status:document.getElementById('tk_status').value, notes:document.getElementById('tk_notes').value, done:false
    });
    if(trainerId){
      state.notifications.push({id:uid(), trainerId, message:`مهمة جديدة مسندة إليك: "${title}"${due?(' — الاستحقاق: '+due):''}`, read:false, createdAt:Date.now()});
    }
    await saveState(); toast('تمت إضافة المهمة'); render();
  };
  drawList();
}
async function updateTaskStatus(id, status){ const t=state.tasks.find(x=>x.id===id); if(t){ t.status=status; t.done=(status==='مكتملة'); await saveState(); renderKeepForm(); } }
async function toggleTask(id){ const t=state.tasks.find(x=>x.id===id); if(t){ t.done=!t.done; t.status=t.done?'مكتملة':'لم تبدأ'; await saveState(); renderKeepForm(); } }
async function deleteTask(id){ state.tasks = state.tasks.filter(x=>x.id!==id); await saveState(); renderKeepForm(); }

/* ============ Results Page (النتائج) ============ */
function renderResultsPage(c){
  const today = todayStr();
  c.innerHTML = `
  <div class="card">
    <h2>النتائج والتقييمات</h2>
    <div class="grid">
      <div class="field"><label>من تاريخ</label><input id="res_from" type="date" lang="en-GB"></div>
      <div class="field"><label>إلى تاريخ</label><input id="res_to" type="date" lang="en-GB"></div>
      <div class="field"><label>عرض</label><select id="res_filter">
        <option value="all">الكل</option><option value="evaluated">المقيَّمة فقط</option><option value="notEvaluated">غير المقيَّمة فقط</option>
      </select></div>
    </div>
    <button class="btn btn-primary" id="res_go">عرض</button>
    <button class="btn btn-outline" id="res_print">🖨️ طباعة</button>
    <button class="btn btn-outline" id="res_excel">📊 استخراج إكسل</button>
    <div id="res_result" style="margin-top:16px;"></div>
  </div>`;

  function getList(){
    const from=document.getElementById('res_from').value, to=document.getElementById('res_to').value, f=document.getElementById('res_filter').value;
    let list = state.orders.filter(o=>isLiveOrder(o) && (!from||o.date>=from) && (!to||o.date<=to));
    if(f==='evaluated') list=list.filter(o=>o.completionStatus);
    else if(f==='notEvaluated') list=list.filter(o=>!o.completionStatus);
    return list.sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  }
  function rowsData(list){
    return list.map((o,i)=>{
      const school=state.schools.find(s=>s.id===o.schoolId);
      const supervisor = school ? school.supervisors.find(s=>s.id===o.supervisorId) : null;
      const reqs = (o.adminRequests||[]).map(id=>{const r=state.adminRequestsList.find(x=>x.id===id); return r?r.name:'';}).filter(Boolean).join('، ');
      const evalSrc = o.evaluatedBy==='trainer' ? 'مقدم الفعالية' : o.evaluatedBy==='admin' ? 'الإدارة' : '—';
      return {i:i+1, o, school, supervisor, reqs, evalSrc};
    });
  }
  function tableHtml(list){
    if(!list.length) return `<div class="empty-state">لا توجد بيانات</div>`;
    const rows = rowsData(list);
    return `<table><thead><tr><th>م</th><th>أمر التكليف</th><th>عنوان الفعالية</th><th>التاريخ</th><th>الوقت</th><th>المكان</th><th>مقدم البرنامج</th><th>رقم هاتفه</th><th>الطلبات الإدارية للبرنامج</th><th>الإنجاز</th><th>من قيّم؟</th><th></th></tr></thead><tbody>
      ${rows.map(r=>`<tr>
        <td>${r.i}</td><td>${r.o.serial}</td><td>${escapeHtml(r.o.title)}</td><td>${fmtDate(r.o.date)}</td><td>${r.o.timeFrom||''}-${r.o.timeTo||''}</td>
        <td>${r.school?escapeHtml(r.school.name):''}</td><td>${escapeHtml(trainerNames(r.o))}</td><td>${escapeHtml(trainerPhones(r.o))}</td>
        <td>${r.reqs||'—'}</td><td>${r.o.completionStatus||'لم تنجز'}</td><td>${r.evalSrc}</td>
        <td><button class="icon-btn" title="تقييم / تعديل" onclick="openEvaluationModal('${r.o.id}')">📝</button></td>
      </tr>`).join('')}
    </tbody></table>`;
  }
  document.getElementById('res_go').onclick=()=>{ document.getElementById('res_result').innerHTML = tableHtml(getList()); };
  document.getElementById('res_print').onclick=()=>{
    const list=getList(); const from=document.getElementById('res_from').value, to=document.getElementById('res_to').value;
    const rows = rowsData(list).map(r=>[r.i, r.o.serial, escapeHtml(r.o.title), dateRangeStr(r.o), (r.o.timeFrom||'')+'-'+(r.o.timeTo||''), r.school?escapeHtml(r.school.name):'', escapeHtml(trainerNames(r.o)), escapeHtml(trainerPhones(r.o)), r.reqs||'—', r.o.completionStatus||'لم تنجز']);
    doPrintDoc(buildReportDoc({
      titleAr:'النتائج والتقييمات', subtitle:`من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'}`,
      headers:['م','أمر التكليف','عنوان الفعالية','التاريخ (من — إلى)','الوقت','المكان','مقدم البرنامج','رقم هاتفه','الطلبات الإدارية للبرنامج','الإنجاز'],
      rows
    }), true, 'A4');
  };
  document.getElementById('res_excel').onclick=()=>{
    const list=getList();
    const rows = rowsData(list).map(r=>[r.i, r.o.serial, r.o.title, dateRangeStr(r.o), (r.o.timeFrom||'')+'-'+(r.o.timeTo||''), r.school?r.school.name:'', trainerNames(r.o), trainerPhones(r.o), r.reqs||'—', r.o.completionStatus||'لم تنجز', r.evalSrc]);
    exportToExcel('النتائج.xlsx', ['م','أمر التكليف','عنوان الفعالية','التاريخ (من — إلى)','الوقت','المكان','مقدم البرنامج','رقم هاتفه','الطلبات الإدارية للبرنامج','الإنجاز','من قيّم؟'], rows, 'النتائج والتقييمات');
  };
  document.getElementById('res_go').click();
}

/* ============ Distributions Page (التوزيعات) ============ */
/* ============ Combined Page: الطلبات والتوزيعات والإداريات ============ */
let distSubTab = 'dist';
let reportsSubTab = 'rep';
function renderDistributionsPage(c){
  c.innerHTML = `
  ${pageHeader('distributions')}
  <div class="tabs page-tabs-moved" style="display:none;">
    <button class="tab-btn" id="distTabDist">التوزيعات</button>
    <button class="tab-btn" id="distTabResults">النتائج</button>
    <button class="tab-btn" id="distTabAdminReq">الطلبات الإدارية</button>
  </div>
  <div id="distSubContent"></div>`;
  const sub = document.getElementById('distSubContent');
  bindPageHeader(c, 'distributions');
  document.getElementById('distTabDist').onclick=()=>{distSubTab='dist'; render();};
  document.getElementById('distTabResults').onclick=()=>{distSubTab='results'; render();};
  document.getElementById('distTabAdminReq').onclick=()=>{distSubTab='adminReq'; render();};
  if(distSubTab==='results'){ renderResultsPage(sub); return; }
  if(distSubTab==='adminReq'){ renderAdminRequestsReportPage(sub); return; }
  renderDistributionsTabContent(sub);
}
function renderDistributionsTabContent(c){
  const today = todayStr();
  c.innerHTML = `
  <div class="card">
    <h2>توزيع الفعاليات على مقدمي المبادرة</h2>
    <div class="grid">
      <div class="field"><label>الفترة</label><select id="dist_period"><option value="week">أسبوع</option><option value="month">شهر</option><option value="year">سنة</option></select></div>
      <div class="field"><label>تاريخ ضمن الفترة</label><input id="dist_date" type="date" lang="en-GB" value="${today}"></div>
      <div class="field"><label>أو من تاريخ (فترة مخصصة)</label><input id="dist_customFrom" type="date" lang="en-GB"></div>
      <div class="field"><label>إلى تاريخ (فترة مخصصة)</label><input id="dist_customTo" type="date" lang="en-GB"></div>
    </div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px;">
      <label class="checkbox-chip"><input type="checkbox" id="dist_showList" checked> قائمة (تفاصيل الفعاليات)</label>
      <label class="checkbox-chip"><input type="checkbox" id="dist_showSummary" checked> ملخّص لكل مقدم مبادرة</label>
    </div>
    <div id="dist_modeWrap" style="display:none;margin-bottom:10px;">
      <div class="helper" style="margin-bottom:6px;">اخترت القائمة والملخص معًا — كيف تريد عرض التقرير عند الطباعة/التصدير؟</div>
      <label class="checkbox-chip"><input type="radio" name="dist_mode" value="combined" checked> الكل في تقرير واحد</label>
      <label class="checkbox-chip"><input type="radio" name="dist_mode" value="separate"> كل قسم في تقرير منفصل</label>
    </div>
    <button class="btn btn-primary" id="dist_go">عرض</button>
    <button class="icon-btn rect" id="dist_print" title="طباعة">🖨️ طباعة</button>
    <button class="icon-btn rect" id="dist_pdf" title="تنزيل PDF">📄 تنزيل PDF</button>
    <button class="btn btn-outline" id="dist_excel">📊 تنزيل Excel</button>
  </div>
  <div id="dist_result" class="grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));"></div>`;

  function syncDistModeVisibility(){
    const both = document.getElementById('dist_showList').checked && document.getElementById('dist_showSummary').checked;
    document.getElementById('dist_modeWrap').style.display = both ? 'block' : 'none';
  }
  document.getElementById('dist_showList').addEventListener('change', syncDistModeVisibility);
  document.getElementById('dist_showSummary').addEventListener('change', syncDistModeVisibility);

  function periodBounds(period, dateStr){
    const customFrom = document.getElementById('dist_customFrom').value, customTo = document.getElementById('dist_customTo').value;
    if(customFrom && customTo) return {start:customFrom, end:customTo};
    const d = new Date(dateStr+'T00:00:00');
    if(period==='week') return getWeekBounds(dateStr);
    if(period==='month'){
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth()+1, 0);
      return {start:dateToISO(start), end:dateToISO(end)};
    }
    const start = new Date(d.getFullYear(),0,1), end = new Date(d.getFullYear(),11,31);
    return {start:dateToISO(start), end:dateToISO(end)};
  }
  const LEVEL_ORDER = LOCATION_TYPES;
  function sortedLevels(allLevels){
    const known = LEVEL_ORDER.filter(l=>allLevels.includes(l));
    const extra = allLevels.filter(l=>!LEVEL_ORDER.includes(l));
    return [...known, ...extra];
  }
  function statsFor(list){
    const daysTotal = list.reduce((s,o)=>s+daysCount(o.date,o.dateTo),0);
    const hoursTotal = list.reduce((s,o)=>s+computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo),0);
    const schoolsTotal = new Set(list.map(o=>o.schoolId).filter(Boolean)).size;
    const byPath = state.programTypes.map(pt=>({name:pt.name, count:list.filter(o=>o.programTypeId===pt.id).length})).filter(x=>x.count>0);
    const pathsCount = byPath.length;
    const allLevels = Array.from(new Set(state.schools.map(s=>s.level).filter(Boolean)));
    const byLevel = allLevels.map(lvl=>({
      level: lvl,
      count: list.filter(o=>{ const s=state.schools.find(x=>x.id===o.schoolId); return s && s.level===lvl; }).length
    })).filter(x=>x.count>0);
    // توضيح لتصنيف "غير ذلك": اسم المدرسة ورقم التكليف لكل فعالية ضمن هذا التصنيف
    const otherDetails = list.filter(o=>{ const s=state.schools.find(x=>x.id===o.schoolId); return s && s.level==='غير ذلك'; })
      .map(o=>{ const s=state.schools.find(x=>x.id===o.schoolId); return {serial:o.serial, school:s?s.name:''}; });
    return {events:list.length, daysTotal, hoursTotal:Math.round(hoursTotal*100)/100, schoolsTotal, byPath, pathsCount, byLevel, otherDetails};
  }
  document.getElementById('dist_excel').onclick=()=>{
    const period=document.getElementById('dist_period').value, dateStr=document.getElementById('dist_date').value || today;
    const {start,end} = periodBounds(period, dateStr);
    const sheets = state.trainers.map(t=>{
      const list = state.orders.filter(o=>isLiveOrder(o) && (o.trainerIds||[]).includes(t.id) && o.date>=start && o.date<=end).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
      return {name:t.name, headers:['العنوان','من تاريخ','إلى تاريخ','عدد الأيام','الوقت','عدد الساعات','المدرسة','الإنجاز'], rows:list.map(o=>{ const s=state.schools.find(x=>x.id===o.schoolId); return [o.title, fmtDate(o.date), fmtDate(orderEnd(o)), daysCount(o.date,o.dateTo), fullTimeRange(o.timeFrom,o.timeTo), computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo), s?s.name:'', o.completionStatus||'لم تنجز']; })};
    });
    exportToExcelMultiSheet('التوزيعات.xlsx', sheets, `التوزيعات (${fmtDate(start)} إلى ${fmtDate(end)})`);
  };
  function trainerGroups(){
    const period=document.getElementById('dist_period').value, dateStr=document.getElementById('dist_date').value || today;
    const {start,end} = periodBounds(period, dateStr);
    return {start, end, groups: state.trainers.map(t=>{
      const list = state.orders.filter(o=>isLiveOrder(o) && (o.trainerIds||[]).includes(t.id) && o.date>=start && o.date<=end).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
      return {t, list, stats: statsFor(list)};
    })};
  }
  function summaryTableHtml(groups){
    const activeGroups = groups.filter(g=>g.list.length>0);
    if(!activeGroups.length) return '';
    /* لا نعرض أعمدة أنواع الأماكن التي قيمتها صفر لدى الجميع — كانت تُزحم الجدول */
    const allLevelsRaw = sortedLevels(Array.from(new Set(state.schools.map(s=>s.level).filter(Boolean))));
    const allLevels = allLevelsRaw.filter(lvl =>
      activeGroups.some(g => {
        const f = (g.stats.byLevel||[]).find(x=>x.level===lvl);
        return f && f.count > 0;
      })
    );
    const totals = {
      events: activeGroups.reduce((s,g)=>s+g.stats.events,0),
      daysTotal: activeGroups.reduce((s,g)=>s+g.stats.daysTotal,0),
      hoursTotal: Math.round(activeGroups.reduce((s,g)=>s+g.stats.hoursTotal,0)*100)/100,
      pathsCount: activeGroups.reduce((s,g)=>s+g.stats.pathsCount,0),
      schoolsTotal: activeGroups.reduce((s,g)=>s+g.stats.schoolsTotal,0),
    };
    const otherNoteRows = activeGroups.filter(g=>g.stats.otherDetails.length>0);
    const otherNote = otherNoteRows.length ? `<div class="helper" style="margin-top:8px;line-height:1.9;">
        <strong>توضيح تصنيف "غير ذلك":</strong><br>
        ${otherNoteRows.map(({t,stats})=>`${escapeHtml(t.name)}: ${stats.otherDetails.map(d=>`${escapeHtml(d.school)} (رقم التكليف ${d.serial})`).join('، ')}`).join('<br>')}
      </div>` : '';
    return `<table style="text-align:center;"><thead><tr>
        <th>اسم مقدم المبادرة</th><th>عدد الفعاليات</th><th>عدد الأيام</th><th>عدد الساعات</th><th>عدد المسارات المقدَّمة</th><th>عدد المدارس</th>
        ${allLevels.map(lvl=>`<th>${escapeHtml(lvl)}</th>`).join('')}
      </tr></thead><tbody>
        ${activeGroups.map(({t,stats})=>`<tr>
          <td>${escapeHtml(t.name)}</td><td>${stats.events}</td><td>${stats.daysTotal}</td><td>${stats.hoursTotal}</td><td>${stats.pathsCount}</td><td>${stats.schoolsTotal}</td>
          ${allLevels.map(lvl=>{ const found = stats.byLevel.find(x=>x.level===lvl); return `<td>${found?found.count:0}</td>`; }).join('')}
        </tr>`).join('')}
      </tbody>
      <tfoot><tr style="font-weight:700;background:#F8F5F3;">
        <td>الإجمالي</td><td>${totals.events}</td><td>${totals.daysTotal}</td><td>${totals.hoursTotal}</td><td>${totals.pathsCount}</td><td>${totals.schoolsTotal}</td>
        ${allLevels.map(lvl=>{ const sum = activeGroups.reduce((s,g)=>{ const found=g.stats.byLevel.find(x=>x.level===lvl); return s+(found?found.count:0); },0); return `<td>${sum}</td>`; }).join('')}
      </tr></tfoot>
      </table>${otherNote}`;
  }
  function draw(){
    const {groups} = trainerGroups();
    const showList = document.getElementById('dist_showList').checked;
    const showSummary = document.getElementById('dist_showSummary').checked;
    const box = document.getElementById('dist_result');
    let html = '';
    if(showSummary){
      html += `<div class="card" style="grid-column:1/-1;"><h2>جدول ملخّص لكل مقدم مبادرة
          <span style="display:flex;gap:6px;">
            <button class="icon-btn rect" id="dist_summary_print" title="طباعة الجدول الملخّص">🖨️</button>
            <button class="icon-btn rect" id="dist_summary_pdf" title="تنزيل PDF للجدول الملخّص">📄</button>
          </span>
        </h2>${summaryTableHtml(groups) || '<div class="empty-state">لا توجد بيانات ضمن هذه الفترة</div>'}</div>`;
    }
    if(showList){
      html += (groups.map(({t,list,stats})=>`<div class="card" style="margin-bottom:0;">
        <h2 style="font-size:16px;">${escapeHtml(t.name)} <span class="badge">${list.length}</span></h2>
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">
          <span class="stat-box" style="min-width:70px;"><div class="num">${stats.events}</div><div class="lbl">فعاليات</div></span>
          <span class="stat-box" style="min-width:70px;"><div class="num">${stats.daysTotal}</div><div class="lbl">أيام</div></span>
          <span class="stat-box" style="min-width:70px;"><div class="num">${stats.hoursTotal}</div><div class="lbl">ساعات</div></span>
          <span class="stat-box" style="min-width:70px;"><div class="num">${stats.schoolsTotal}</div><div class="lbl">مدارس</div></span>
        </div>
        ${stats.byPath.length?`<div class="helper" style="margin-bottom:8px;">${stats.byPath.map(p=>`${escapeHtml(p.name)}: ${p.count}`).join(' — ')}</div>`:''}
        ${list.length? list.map(o=>{
          const school=state.schools.find(s=>s.id===o.schoolId);
          const field=state.fields.find(f=>f.id===o.fieldId);
          const dateRange = o.dateTo && o.dateTo!==o.date ? `${fmtDate(o.date)} — إلى — ${fmtDate(o.dateTo)}` : fmtDate(o.date);
          return `<div style="border-bottom:1px dashed var(--line); padding:8px 0; font-size:13px; line-height:1.8;">
            <strong>${escapeHtml(o.title)}</strong> ${field?`<span class="badge">${escapeHtml(field.name)}</span>`:''}<br>
            📅 ${dateRange} (${daysCount(o.date,o.dateTo)} يوم) — ⏰ ${o.timeFrom||''}-${o.timeTo||''} (${computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo)} ساعة)<br>
            🏫 ${school?escapeHtml(school.name):''} — الإنجاز: ${o.completionStatus||'لم تنجز'}
          </div>`;
        }).join('') : `<div class="empty-state" style="padding:16px;">لا توجد فعاليات ضمن هذه الفترة</div>`}
      </div>`).join('') || `<div class="empty-state">لا يوجد مقدمو فعاليات</div>`);
    }
    box.innerHTML = html || `<div class="empty-state">اختر "قائمة" أو "ملخّص" لعرض البيانات</div>`;
    enhanceReportTable(box);
    if(showSummary){
      document.getElementById('dist_summary_print').onclick = printSummaryOnly;
      document.getElementById('dist_summary_pdf').onclick = printSummaryOnly;
    }
  }
  function printSummaryOnly(){
    const {start, end, groups} = trainerGroups();
    doPrintDoc(buildReportDoc({
      titleAr:'جدول ملخّص لكل مقدم مبادرة', subtitle:`من ${fmtDate(start)} إلى ${fmtDate(end)}`,
      extraHtml: summaryTableHtml(groups) || '<div>لا توجد بيانات</div>'
    }), true, 'A4');
  }
  function printIt(){
    const {start, end, groups} = trainerGroups();
    const summaryHtml = `<div class="sec-t">جدول ملخّص لكل مقدم مبادرة</div>${summaryTableHtml(groups) || '<div>لا توجد بيانات</div>'}`;
    const extraHtml = summaryHtml + groups.filter(g=>g.list.length>0).map(({t,list,stats})=>`
      <div class="sec-t">${escapeHtml(t.name)} (${stats.events} فعالية)</div>
      <div style="font-size:9.5pt;margin-bottom:2mm;">عدد الأيام: ${stats.daysTotal} — عدد الساعات: ${stats.hoursTotal} — عدد المدارس: ${stats.schoolsTotal}${stats.byPath.length?' — '+stats.byPath.map(p=>`${escapeHtml(p.name)}: ${p.count}`).join('، '):''}</div>
      ${repTableHtml(['#','الفعالية','التاريخ','الوقت','الأيام','الساعات','المكان / هاتف المشرف'],
        list.map(o=>[String(o.serial||'—'), escapeHtml(o.title||''), repPeriodCell(o),
          escapeHtml(fullTimeRange(o.timeFrom,o.timeTo)||'—'),
          String(daysCount(o.date,o.dateTo)), String(computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo)),
          repPlacePhone(o)]))}`).join('');
    doPrintDoc(buildReportDoc({
      titleAr:'توزيع الفعاليات على مقدمي المبادرة', subtitle:`من ${fmtDate(start)} إلى ${fmtDate(end)}`,
      extraHtml
    }), true, 'A4');
  }
  document.getElementById('dist_print').onclick=printIt;
  document.getElementById('dist_pdf').onclick=printIt;
  document.getElementById('dist_go').onclick=draw;
  draw();
}

/* ============ Trainer Portal ============ */
/* ══ تقويم إتاحة مقدمي الفعاليات — مستقل عن تسجيل دخول المقدّم ══ */
function renderAvailabilityCalendar(box){
    /* تقويم ربع سنوي: 3 أشهر لكل ربع، ولكل مقدّم صف بأيام الشهر
       أخضر = متاح | أحمر = مرتبط بفعالية في ذلك اليوم */
    const now = new Date();
    if(!window.__tpQ) window.__tpQ = {year: now.getFullYear(), q: Math.floor(now.getMonth()/3)+1};
    const Q = window.__tpQ;
    const startMonth = (Q.q-1)*3;
    const months = [0,1,2].map(i=>({y:Q.year, m:startMonth+i}));
    const MN = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const QN = {1:'الربع الأول (يناير–مارس)',2:'الربع الثاني (أبريل–يونيو)',3:'الربع الثالث (يوليو–سبتمبر)',4:'الربع الرابع (أكتوبر–ديسمبر)'};
    const iso = (y,m,d)=>`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    /* فعاليات المقدّم في ذلك اليوم (نشطة فقط) */
    function eventsOn(tid, dISO){
      return (state.orders||[]).filter(o=>{
        if(isCancelledOrder(o)) return false;
        if(!(o.trainerIds||[]).includes(tid)) return false;
        const s=o.date||'', e=orderEnd(o);
        return s && dISO>=s && dISO<=e;
      });
    }
    function busyOn(tid, dISO){ return eventsOn(tid, dISO).length > 0; }
    /* تضارب = أكثر من فعالية للمقدّم نفسه في اليوم نفسه */
    const calClash = {};           // tid -> { dISO: [orders] }
    let calClashDays = 0;
    const monthBlocks = months.map(({y,m})=>{
      const days = new Date(y, m+1, 0).getDate();
      const rows = state.trainers.map(t=>{
        const cells = Array.from({length:days},(_,i)=>{
          const d=i+1, dISO=iso(y,m,d), wd=new Date(y,m,d).getDay(), off=(wd===5||wd===6);
          const evs = eventsOn(t.id, dISO);
          const busy = evs.length > 0;
          /* تضارب: فعاليتان أو أكثر في اليوم نفسه */
          if(evs.length > 1){
            calClash[t.id] = calClash[t.id] || {};
            if(!calClash[t.id][dISO]){ calClash[t.id][dISO] = evs; calClashDays++; }
            const tip = escapeHtml(t.name) + ' — ' + fmtDate(dISO) + ' — ⚠ تضارب: '
              + evs.length + ' فعاليات\n'
              + evs.map(o=>'• #'+(o.serial||'—')+' '+(o.title||'')+' ('+(o.timeFrom||'—')+'–'+(o.timeTo||'—')+')').join('\n');
            return `<td class="cal-c clash" data-calclash="${t.id}|${dISO}" title="${escapeHtml(tip)}">${d}</td>`;
          }
          const cls = off ? 'off' : (busy?'busy':'free');
          const lbl = off ? 'إجازة' : (busy?'غير متاح':'متاح');
          const tip = escapeHtml(t.name) + ' — ' + fmtDate(dISO) + ' — ' + lbl
            + (busy ? '\n• #'+(evs[0].serial||'—')+' '+(evs[0].title||'') : '');
          return `<td class="cal-c ${cls}" title="${escapeHtml(tip)}">${d}</td>`;
        }).join('');
        /* أيام الإجازة لا تُحتسب ضمن الأيام المشغولة */
        const busyCount = Array.from({length:days},(_,i)=>{
          const wd=new Date(y,m,i+1).getDay();
          return (wd!==5 && wd!==6) && busyOn(t.id, iso(y,m,i+1));
        }).filter(Boolean).length;
        const myClash = Object.keys(calClash[t.id]||{}).filter(k=>k.slice(0,7)===`${y}-${String(m+1).padStart(2,'0')}`).length;
        return `<tr${myClash?' class="cal-row-clash"':''}><th class="cal-nm">${escapeHtml(t.name)}`
          + (myClash ? `<span class="cal-cl" title="${myClash} يوم فيه تضارب">⚠ ${myClash}</span>` : '')
          + `<span class="cal-ct">${busyCount}</span></th>${cells}</tr>`;
      }).join('');
      /* رمز اليوم: ح ن ث ر خ ج س — الجمعة والسبت إجازة */
      const DW = ['ح','ن','ث','ر','خ','ج','س'];   // الأحد=0 ... السبت=6
      const isOff = wd => wd===5 || wd===6;        // الجمعة والسبت
      const head = Array.from({length:days},(_,i)=>{
        const wd = new Date(y, m, i+1).getDay();
        return `<th class="cal-d${isOff(wd)?' off':''}"><b>${DW[wd]}</b><i>${i+1}</i></th>`;
      }).join('');
      return `<div class="card"><h2 class="tp-h">${MN[m]} ${y}</h2>
        <div class="tbl-scroll"><table class="cal-tb"><thead><tr><th class="cal-nm">مقدم الفعالية</th>${head}</tr></thead>
        <tbody>${rows || `<tr><td colspan="${days+1}" class="empty-state">لا يوجد مقدمو فعاليات</td></tr>`}</tbody></table></div>
      </div>`;
    }).join('');

    box.innerHTML = `<div class="card">
      <h2 class="tp-h">تقويم إتاحة مقدمي الفعاليات</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;margin-bottom:10px;">
        <div class="field" style="margin:0;"><label>السنة</label>
          <select id="tpq_year" style="width:auto;min-width:100px;">
            ${[Q.year-1,Q.year,Q.year+1].map(y=>`<option value="${y}" ${y===Q.year?'selected':''}>${y}</option>`).join('')}
          </select></div>
        <div class="field" style="margin:0;"><label>الربع</label>
          <select id="tpq_q" style="width:auto;min-width:190px;">
            ${[1,2,3,4].map(q=>`<option value="${q}" ${q===Q.q?'selected':''}>${QN[q]}</option>`).join('')}
          </select></div>
        <span style="display:inline-flex;align-items:center;gap:14px;margin-inline-start:auto;font-size:12.5px;">
          <span style="display:inline-flex;align-items:center;gap:6px;"><i style="width:14px;height:14px;border-radius:4px;background:#DFF3EB;border:1px solid #8DD8BD;display:inline-block;"></i> متاح</span>
          <span style="display:inline-flex;align-items:center;gap:6px;"><i style="width:14px;height:14px;border-radius:4px;background:#FEE4E2;border:1px solid #FDA29B;display:inline-block;"></i> غير متاح</span>
          <span style="display:inline-flex;align-items:center;gap:6px;"><i style="width:14px;height:14px;border-radius:4px;background:#DFF3F8;border:1px solid #9FD3E4;display:inline-block;"></i> إجازة (الجمعة والسبت)</span>
        <span style="display:inline-flex;align-items:center;gap:6px;"><i style="width:14px;height:14px;border-radius:4px;background:#C0334D;border:1px solid #9E2840;display:inline-block;"></i> تضارب</span>
        </span>
      </div>
      ${calClashDays ? `<div class="clash-bar">${icon('alert',15)}
        <span><b>${calClashDays}</b> حالة تضارب في هذا الربع — مقدّم مرتبط بأكثر من فعالية في اليوم نفسه.
        الخلايا الحمراء الداكنة في الجدول أدناه؛ اضغط أيّها لعرض الفعاليات المتضاربة.</span>
        <button class="btn btn-sm btn-outline" id="cal_clashJump" style="margin-inline-start:auto;">عرض القائمة</button>
      </div>` : `<div class="ok-bar">${icon('checkCircle',15)} <span>لا يوجد أي تضارب في هذا الربع.</span></div>`}
      <div class="helper">الرقم بجوار الاسم = عدد الأيام المشغولة في ذلك الشهر · ⚠ = عدد أيام التضارب.</div>
    </div>${monthBlocks}${calClashTable()}`;

    /* جدول تفاصيل التضارب — نفس بطاقة الإتاحة، مرتّب حسب المقدّم ثم التاريخ */
    function calClashTable(){
      if(!calClashDays) return '';
      const rows = [];
      (state.trainers||[]).slice().sort((a,b)=>a.name.localeCompare(b.name,'ar')).forEach(t=>{
        const days = calClash[t.id] || {};
        Object.keys(days).sort().forEach(d=>{
          rows.push({ t, d, evs: days[d] });
        });
      });
      return `<div class="card" id="cal_clashCard" style="border:2px solid #C0334D;">
        <h2 class="tp-h" style="background:#C0334D !important;">${icon('alert',15)} تنبيه تضارب الفعاليات — ${rows.length} حالة</h2>
        <div class="tbl-scroll"><table class="clash-tbl"><thead><tr>
          <th style="width:19%;">مقدم الفعالية</th><th style="width:13%;">التاريخ</th>
          <th style="width:7%;">العدد</th><th>الفعاليات المتضاربة</th>
        </tr></thead><tbody>
        ${rows.map(r=>`<tr>
          <td style="font-weight:700;">${escapeHtml(r.t.name)}</td>
          <td style="white-space:nowrap;">${fmtDate(r.d)}</td>
          <td style="text-align:center;"><span class="badge bad">${r.evs.length}</span></td>
          <td>${r.evs.map(o=>`<button class="clash-ev" onclick="openOrderDrawer('${o.id}')">
              <b>#${o.serial||'—'}</b> ${escapeHtml(o.title||'بلا عنوان')}
              <span>${escapeHtml((o.timeFrom||'—')+' – '+(o.timeTo||'—'))}</span>
            </button>`).join('')}</td>
        </tr>`).join('')}
        </tbody></table></div>
        <div class="helper" style="margin-top:8px;">اضغط أي فعالية لفتحها ومعالجة التضارب.</div>
      </div>`;
    }

    document.getElementById('tpq_year').onchange=e=>{ window.__tpQ.year=Number(e.target.value); render(); };
    document.getElementById('tpq_q').onchange=e=>{ window.__tpQ.q=Number(e.target.value); render(); };
    const jump = document.getElementById('cal_clashJump');
    if(jump) jump.onclick=()=>{ const el=document.getElementById('cal_clashCard');
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); };
    /* النقر على خلية تضارب داخل الجدول */
    box.querySelectorAll('[data-calclash]').forEach(td=>{
      td.style.cursor='pointer';
      td.onclick=()=>{
        const [tid,d] = td.dataset.calclash.split('|');
        const evs = (calClash[tid]||{})[d] || [];
        const t = (state.trainers||[]).find(x=>x.id===tid);
        if(evs.length===1){ openOrderDrawer(evs[0].id); return; }
        const msg = '⚠ تضارب فعاليات\n\n' + (t?t.name:'') + ' — ' + fmtDate(d) + '\n\n'
          + evs.map((o,i)=>(i+1)+') #'+(o.serial||'—')+' — '+(o.title||'بلا عنوان')
              + '\n     من ' + (o.timeFrom||'—') + ' إلى ' + (o.timeTo||'—')).join('\n\n')
          + '\n\nاضغط «موافق» لفتح الفعالية الأولى.';
        if(confirm(msg)) openOrderDrawer(evs[0].id);
      };
    });
}
function renderTrainerPortalPage(c){
  if(!loggedTrainerId){
    /* تبويبان قبل الدخول: تقويم الإتاحة متاح للجميع دون اختيار مقدّم */
    if(!window.__tpPre) window.__tpPre = 'calendar';
    const pre = window.__tpPre;
    c.innerHTML = `
      <div class="pg-head">
        <div>
          <span class="pg-eyebrow">بوابة مقدم الفعالية</span>
          <h1>تقويم الإتاحة والدخول</h1>
          <p>اطّلع على إتاحة مقدّمي الفعاليات خلال الربع، أو ادخل بحسابك لعرض فعالياتك ومهامك.</p>
        </div>
        <div class="seg">
          <button class="${pre==='calendar'?'active':''}" id="tpp_cal">تقويم الإتاحة</button>
          <button class="${pre==='login'?'active':''}" id="tpp_login">دخول مقدم الفعالية</button>
        </div>
      </div>
      <div id="tp_preContent"></div>`;
    document.getElementById('tpp_cal').onclick=()=>{ window.__tpPre='calendar'; render(); };
    document.getElementById('tpp_login').onclick=()=>{ window.__tpPre='login'; render(); };
    const pbox = document.getElementById('tp_preContent');
    if(pre==='calendar'){
      renderAvailabilityCalendar(pbox);
    } else {
      pbox.innerHTML = `<div class="card"><h2 class="tp-h">دخول مقدم الفعالية</h2>
        <div class="grid"><div class="field"><label>اختر اسمك (معاينة من حساب إداري)</label><select id="tp_login">${state.trainers.map(t=>`<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('')}</select></div></div>
        <button class="btn btn-primary" id="tp_go">دخول</button></div>`;
      document.getElementById('tp_go').onclick=()=>{ loggedTrainerId=document.getElementById('tp_login').value; trainerPortalTab='upcoming'; render(); };
    }
    return;
  }
  const trainer = state.trainers.find(t=>t.id===loggedTrainerId);
  const today = todayStr();
  const myOrders = state.orders.filter(o=>(o.trainerIds||[]).includes(loggedTrainerId));
  const upcoming = myOrders.filter(o=>o.date>=today).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const past = myOrders.filter(o=>o.date<today).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const todaysEvents = myOrders.filter(o=>o.date===today);
  const notEvaluated = myOrders.filter(o=>o.date && o.date<today && !o.completionStatus);
  const myTasks = state.tasks.filter(t=>t.trainerId===loggedTrainerId);
  const myTasksPending = myTasks.filter(t=>t.status!=='مكتملة').length;
  const myNotifs = state.notifications.filter(n=>n.trainerId===loggedTrainerId).sort((a,b)=>b.createdAt-a.createdAt);
  const myRequests = state.trainerRequests.filter(r=>r.trainerId===loggedTrainerId).sort((a,b)=>b.createdAt-a.createdAt);
  const nearUpcoming = upcoming.filter(o=>{ const d=daysDiff(today,o.date); return d>=0 && d<=2; });

  if(!tpAutoOpened && currentRole==='trainer'){
    tpAutoOpened=true;
    if(notEvaluated.length>0){ trainerPortalTab='notEvaluated'; }
  }

  c.innerHTML = `
  <div class="card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
    <div><strong>مرحباً، ${escapeHtml(trainer?trainer.name:'')}</strong> ${nearUpcoming.length?`<span class="badge busy">🔔 ${nearUpcoming.length} فعالية قريبة</span>`:''}</div>
    ${currentRole!=='trainer' ? `<button class="btn btn-outline btn-sm" id="tp_logout">تبديل الاسم (معاينة)</button>` : ''}
  </div>
  <div class="stat-grid" style="margin-bottom:16px;">
    <div class="stat-box" style="cursor:pointer;" onclick="trainerPortalTab='upcoming';render();"><div class="num">${upcoming.length}</div><div class="lbl">فعالياتي القادمة</div></div>
    <div class="stat-box" style="cursor:pointer;" onclick="trainerPortalTab='past';render();"><div class="num">${past.length}</div><div class="lbl">فعالياتي السابقة</div></div>
    <div class="stat-box" style="cursor:pointer;" onclick="trainerPortalTab='daily';render();"><div class="num">${todaysEvents.length}</div><div class="lbl">فعاليات اليوم</div></div>
    <div class="stat-box" style="cursor:pointer;${notEvaluated.length?'border-color:#D94A4A;':''}" onclick="trainerPortalTab='notEvaluated';render();"><div class="num" style="${notEvaluated.length?'color:#D94A4A;':''}">${notEvaluated.length}</div><div class="lbl">⚠️ فعاليات لم يتم تقييمها</div></div>
  </div>
  ${myNotifs.length? `<div class="card"><h2 class="tp-h">🔔 الإشعارات</h2>${myNotifs.map(n=>`<div class="notif ${n.read?'':'unread'}"><span>${escapeHtml(n.message)}</span>${n.read?'':`<button class="btn btn-sm btn-outline" onclick="markNotifRead('${n.id}')">تمييز كمقروء</button>`}</div>`).join('')}</div>`:''}
  <div class="tabs">
    <button class="tab-btn ${trainerPortalTab==='upcoming'?'active':''}" id="tp_up">فعالياتي القادمة (${upcoming.length})</button>
    <button class="tab-btn ${trainerPortalTab==='past'?'active':''}" id="tp_past">فعالياتي السابقة (${past.length})</button>
    <button class="tab-btn ${trainerPortalTab==='daily'?'active':''}" id="tp_daily">فعاليات اليومية</button>
    <button class="tab-btn ${trainerPortalTab==='notEvaluated'?'active':''}" id="tp_notEval">غير مقيَّمة (${notEvaluated.length})</button>
    <button class="tab-btn ${trainerPortalTab==='reports'?'active':''}" id="tp_reports">تقاريري</button>
    <button class="tab-btn ${trainerPortalTab==='tasks'?'active':''}" id="tp_tasks">مهامي (${myTasksPending})</button>
    <button class="tab-btn ${trainerPortalTab==='calendar'?'active':''}" id="tp_cal">📅 تقويم الإتاحة</button>
    <button class="tab-btn ${trainerPortalTab==='newreq'?'active':''}" id="tp_new">تقديم طلب / ترشيح${myRequests.filter(r=>r.status==='pending').length?` (${myRequests.filter(r=>r.status==='pending').length})`:''}</button>
  </div>
  <div id="tp_content"></div>`;
  if(currentRole!=='trainer'){ document.getElementById('tp_logout').onclick=()=>{ loggedTrainerId=null; render(); }; }
  document.getElementById('tp_up').onclick=()=>{ trainerPortalTab='upcoming'; render(); };
  document.getElementById('tp_past').onclick=()=>{ trainerPortalTab='past'; render(); };
  document.getElementById('tp_daily').onclick=()=>{ trainerPortalTab='daily'; render(); };
  document.getElementById('tp_notEval').onclick=()=>{ trainerPortalTab='notEvaluated'; render(); };
  document.getElementById('tp_reports').onclick=()=>{ trainerPortalTab='reports'; render(); };
  document.getElementById('tp_tasks').onclick=()=>{ trainerPortalTab='tasks'; render(); };
  document.getElementById('tp_cal').onclick=()=>{ trainerPortalTab='calendar'; render(); };
  document.getElementById('tp_new').onclick=()=>{ trainerPortalTab='newreq'; render(); };

  const box=document.getElementById('tp_content');

  function upcomingTableOnScreen(list){
    if(!list.length) return `<div class="empty-state">لا توجد فعاليات</div>`;
    return `<table><thead><tr><th>م</th><th>أمر التكليف</th><th>عنوان المبادرة</th><th>المكان</th><th>هاتف المشرف</th><th>التاريخ</th><th>الوقت</th><th>الطلبات المقدمة</th><th>الإنجاز</th><th>إجراءات</th></tr></thead><tbody>
      ${list.map((o,i)=>{
        const school=state.schools.find(s=>s.id===o.schoolId);
        const supervisor = school ? school.supervisors.find(s=>s.id===o.supervisorId) : null;
        const reqs = (o.adminRequests||[]).map(id=>{const r=state.adminRequestsList.find(x=>x.id===id); return r?r.name:'';}).filter(Boolean).join('، ');
        const statusBadge = doneBadge(o.completionStatus);
        return `<tr><td>${i+1}</td><td><span class="badge">${o.serial}</span></td><td>${escapeHtml(o.title)}</td><td>${school?escapeHtml(school.name):''}</td>
          <td>${supervisor?escapeHtml(supervisor.phone||''):''}</td><td>${fmtDate(o.date)}</td><td>${o.timeFrom||''}-${o.timeTo||''}</td><td>${reqs||'—'}</td>
          <td>${statusBadge}</td><td><button class="icon-btn" title="تسجيل الإنجاز والتقييم" onclick="openEvaluationModal('${o.id}')">📝</button></td></tr>`;
      }).join('')}</tbody></table>`;
  }
  function upcomingRowsForPrint(list){
    return list.map((o,i)=>{
      const school=state.schools.find(s=>s.id===o.schoolId);
      const supervisor = school ? school.supervisors.find(s=>s.id===o.supervisorId) : null;
      const reqs = (o.adminRequests||[]).map(id=>{const r=state.adminRequestsList.find(x=>x.id===id); return r?r.name:'';}).filter(Boolean).join('، ');
      return [i+1, o.serial, escapeHtml(o.title), school?escapeHtml(school.name):'', supervisor?escapeHtml(supervisor.phone||''):'', o.date||'', (o.timeFrom||'')+'-'+(o.timeTo||''), reqs||'—', o.completionStatus||'لم تنجز'];
    });
  }

  if(trainerPortalTab==='upcoming'){
    box.innerHTML = `<div class="card"><h2 class="tp-h">فعالياتي القادمة <button class="btn btn-outline btn-sm" id="tp_print_up">🖨️ طباعة</button></h2>${upcomingTableOnScreen(upcoming)}</div>`;
    document.getElementById('tp_print_up').onclick=()=>doPrintDoc(buildReportDoc({
      titleAr:'فعاليات قادمة — '+(trainer?trainer.name:''), kpis:[{v:upcoming.length,l:'عدد الفعاليات'}],
      headers:['م','أمر التكليف','عنوان المبادرة','المكان','هاتف المشرف','التاريخ (من — إلى)','الوقت','الطلبات المقدمة','الإنجاز'], rows:upcomingRowsForPrint(upcoming)
    }), true, 'A4');

  } else if(trainerPortalTab==='past'){
    box.innerHTML = `<div class="card"><h2 class="tp-h">فعالياتي السابقة <button class="btn btn-outline btn-sm" id="tp_print_past">🖨️ طباعة</button></h2>${upcomingTableOnScreen(past)}</div>`;
    document.getElementById('tp_print_past').onclick=()=>doPrintDoc(buildReportDoc({
      titleAr:'فعاليات سابقة — '+(trainer?trainer.name:''), kpis:[{v:past.length,l:'عدد الفعاليات'}],
      headers:['م','أمر التكليف','عنوان المبادرة','المكان','هاتف المشرف','التاريخ (من — إلى)','الوقت','الطلبات المقدمة','الإنجاز'], rows:upcomingRowsForPrint(past)
    }), true, 'A4');

  } else if(trainerPortalTab==='notEvaluated'){
    box.innerHTML = `<div class="card"><h2 class="tp-h">⚠️ فعاليات لم يتم تقييمها</h2>${upcomingTableOnScreen(notEvaluated)}</div>`;

  } else if(trainerPortalTab==='daily'){
    box.innerHTML = `<div class="card">
      <h2 class="tp-h">فعالياتي اليومية</h2>
      <div class="grid"><div class="field"><label>من تاريخ</label><input id="tpd_from" type="date" lang="en-GB" value="${today}"></div><div class="field"><label>إلى تاريخ</label><input id="tpd_to" type="date" lang="en-GB" value="${today}"></div></div>
      <button class="btn btn-primary" id="tpd_go">عرض</button>
      <div id="tpd_result" style="margin-top:16px;"></div>
    </div>`;
    function doFilter(){
      const from=document.getElementById('tpd_from').value, to=document.getElementById('tpd_to').value;
      const list = myOrders.filter(o=>(!from||o.date>=from)&&(!to||o.date<=to)).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
      document.getElementById('tpd_result').innerHTML = upcomingTableOnScreen(list);
    }
    document.getElementById('tpd_go').onclick=doFilter; doFilter();

  } else if(trainerPortalTab==='reports'){
    let totalHours=0;
    const rows = myOrders.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(o=>{
      let hrs=0; if(o.timeFrom && o.timeTo){ const s=parseDT(o.date,o.timeFrom), e=parseDT(o.date,o.timeTo); hrs=Math.max(0,(e-s)/3600000)*daysCount(o.date,o.dateTo); } totalHours+=hrs;
      return {o,hrs};
    });
    const evaluatedCount = myOrders.filter(o=>o.date<today && o.completionStatus).length;
    box.innerHTML = `<div class="card">
      <h2 class="tp-h">تقاريري</h2>
      <div class="stat-grid" style="margin-bottom:16px;">
        <div class="stat-box"><div class="num">${myOrders.length}</div><div class="lbl">إجمالي فعالياتي</div></div>
        <div class="stat-box"><div class="num">${totalHours.toFixed(1)}</div><div class="lbl">إجمالي الساعات</div></div>
        <div class="stat-box"><div class="num">${evaluatedCount}</div><div class="lbl">فعاليات مقيَّمة</div></div>
        <div class="stat-box"><div class="num">${notEvaluated.length}</div><div class="lbl">بانتظار التقييم</div></div>
      </div>
      ${repTableHtml(['م','العنوان','التاريخ','الوقت','عدد الساعات'],
        rows.map(r=>[String(r.o.serial||'—'), escapeHtml(r.o.title||''), fmtDate(r.o.date),
          escapeHtml(fullTimeRange(r.o.timeFrom,r.o.timeTo)||'—'), r.hrs.toFixed(1)]))}
      <button class="btn btn-outline btn-sm" style="margin-top:12px;" id="tp_print_hours">🖨️ طباعة</button>
    </div>`;
    document.getElementById('tp_print_hours').onclick=()=>doPrintDoc(buildReportDoc({
      titleAr:'تقرير ساعات مقدم الفعالية: '+(trainer?trainer.name:''), kpis:[{v:myOrders.length,l:'عدد الفعاليات'},{v:totalHours.toFixed(1),l:'إجمالي الساعات'}],
      headers:['م','العنوان','التاريخ (من — إلى)','الوقت','عدد الساعات'], rows:rows.map(r=>[r.o.serial, escapeHtml(r.o.title), dateRangeStr(r.o), (r.o.timeFrom||'')+'-'+(r.o.timeTo||''), r.hrs.toFixed(1)])
    }), true, 'A4');

  } else if(trainerPortalTab==='calendar'){
    renderAvailabilityCalendar(box);
  } else if(trainerPortalTab==='tasks'){
    box.innerHTML = `<div class="card"><h2 class="tp-h">مهامي</h2>
      ${myTasks.length? myTasks.map(t=>{
        const overdue = t.due && t.due<today && t.status!=='مكتملة';
        return `<div style="border:1px solid var(--line); border-radius:10px; padding:12px; margin-bottom:10px; ${overdue?'background:#fdecec;':''}">
          <strong>${escapeHtml(t.title)}</strong> ${t.priority==='عالية'?'<span class="badge bad">عالية</span>':''}<br>
          <span style="font-size:13px;color:#5E4E54;">البدء: ${t.start||'—'} — الاستحقاق: ${t.due||'—'} ${overdue?'⚠️ متأخرة':''}<br>${escapeHtml(t.notes||'')}</span>
          <div style="margin-top:8px;"><select onchange="updateTaskStatus('${t.id}', this.value)">
            <option value="لم تبدأ" ${t.status==='لم تبدأ'?'selected':''}>لم تبدأ</option>
            <option value="قيد التنفيذ" ${t.status==='قيد التنفيذ'?'selected':''}>قيد التنفيذ</option>
            <option value="مكتملة" ${t.status==='مكتملة'?'selected':''}>مكتملة</option>
          </select></div>
        </div>`;
      }).join('') : `<div class="empty-state">لا توجد مهام مسندة إليك</div>`}
    </div>`;

  } else {
    box.innerHTML = `<div class="card">
      <h2 class="tp-h">تقديم طلب / ترشيح لتنفيذ مبادرة</h2>
      <div class="grid" style="grid-template-columns:minmax(160px,240px) minmax(160px,240px);">
        <div class="field"><label>مجال المبادرة</label><select id="tr_field">${state.fields.map(f=>`<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('')}</select></div>
        <div class="field"><label>مسار المبادرة</label><select id="tr_ptype">${state.programTypes.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select></div>
      </div>
      <div class="grid" style="grid-template-columns:1fr;"><div class="field"><label>عنوان المبادرة المقترحة</label><input id="tr_title" style="font-size:18px;padding:13px 14px;"></div></div>
      <div class="grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="field"><label>التاريخ المقترح</label><input id="tr_date" type="date" lang="en-GB"></div>
        <div class="field"><label>من الساعة</label><input id="tr_from" type="time" lang="en"></div>
        <div class="field"><label>إلى الساعة</label><input id="tr_to" type="time" lang="en"></div>
      </div>
      <div class="grid" style="grid-template-columns:1.6fr 0.8fr;">
        <div class="field"><label>المدرسة المقترحة</label><select id="tr_school">${state.schools.map(s=>`<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}</select></div>
        <div class="field"><label>عدد المستهدفين</label><input id="tr_count" type="number" lang="en" min="0"></div>
      </div>
      <div class="field" style="margin-bottom:14px;">
        <label>الطلبات الإدارية للبرنامج</label>
        <div class="checkbox-list" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;">
          ${['إداري','إعلامي','ضيافة'].map(cat=>{
            const items = state.adminRequestsList.filter(r=>(r.category||'إداري')===cat);
            return `<div><div style="font-weight:700;color:var(--maroon-800);background:var(--maroon-50);padding:6px 10px;border-radius:6px;margin-bottom:6px;text-align:center;">${cat}</div>
              ${items.map(r=>`<label class="checkbox-chip" style="display:block;margin-bottom:4px;"><input type="checkbox" value="${r.id}"> ${escapeHtml(r.name)}</label>`).join('') || '<span class="helper">لا توجد بنود</span>'}</div>`;
          }).join('') || '<span class="helper">لا توجد طلبات إدارية معرّفة</span>'}
        </div>
      </div>
      <div class="field" style="margin-bottom:14px;"><label>ملاحظات</label><textarea id="tr_note"></textarea></div>
      <button class="btn btn-primary" id="tr_submit">إرسال الطلب</button>
    </div>
    <div class="card"><h2 class="tp-h">طلباتي السابقة</h2>
      ${myRequests.length? `<table><thead><tr><th>العنوان</th><th>المدرسة</th><th>التاريخ</th><th>الحالة</th></tr></thead><tbody>
        ${myRequests.map(r=>{
          const sch=state.schools.find(s=>s.id===r.schoolId);
          const statusBadge = r.status==='accepted'?'<span class="badge ok">مقبول</span>':r.status==='rejected'?'<span class="badge bad">مرفوض</span>':'<span class="badge">بانتظار الرد</span>';
          return `<tr><td>${escapeHtml(r.title)}</td><td>${sch?escapeHtml(sch.name):''}</td><td>${r.date||''}</td><td>${statusBadge}</td></tr>`;
        }).join('')}</tbody></table>` : `<div class="empty-state">لا توجد طلبات بعد</div>`}
    </div>`;
    document.getElementById('tr_from').addEventListener('change', (e)=>{
      const toEl = document.getElementById('tr_to');
      if(e.target.value && !toEl.value){
        const [hh,mm] = e.target.value.split(':').map(Number);
        const d = new Date(2000,0,1,hh,mm); d.setHours(d.getHours()+1);
        toEl.value = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      }
    });
    document.getElementById('tr_submit').onclick=async ()=>{
      const title=document.getElementById('tr_title').value.trim();
      const date=document.getElementById('tr_date').value;
      const timeFrom=document.getElementById('tr_from').value, timeTo=document.getElementById('tr_to').value;
      if(!title || !date){ toast('يرجى إدخال عنوان المبادرة والتاريخ على الأقل'); return; }
      const conflict = trainerConflictSingle(loggedTrainerId, date, timeFrom, timeTo, null);
      if(conflict){ toast('لا يمكن تقديم الطلب: لديك فعالية أخرى مجدولة في نفس اليوم بوقت قريب.'); return; }
      const adminRequests = Array.from(box.querySelectorAll('.checkbox-list input:checked')).map(i=>i.value);
      state.trainerRequests.push({ id:uid(), trainerId:loggedTrainerId, title, schoolId:document.getElementById('tr_school').value,
        fieldId:document.getElementById('tr_field').value, programTypeId:document.getElementById('tr_ptype').value, participantsCount:document.getElementById('tr_count').value,
        date, timeFrom, timeTo, note:document.getElementById('tr_note').value, adminRequests, status:'pending', createdAt:Date.now() });
      await saveState();
      openAnnouncement('✅ تم إرسال طلبك', `تم استلام طلب/ترشيح المبادرة "${title}" بنجاح، وهو الآن بانتظار موافقة مدير النظام.`);
      render();
    };
  }

  if(currentRole==='trainer'){ setTimeout(()=>checkAndShowTrainerPopups(trainer, myOrders), 300); }
}

/* ---- reminders & motivational popups for the logged-in trainer ---- */
function daysDiff(from, to){ if(!from||!to) return null; return Math.round((new Date(to+'T00:00:00') - new Date(from+'T00:00:00'))/86400000); }
function isoWeekKey(d){ const dt=new Date(d); const onejan=new Date(dt.getFullYear(),0,1); const week=Math.ceil((((dt-onejan)/86400000)+onejan.getDay()+1)/7); return dt.getFullYear()+'-W'+week; }
async function checkAndShowTrainerPopups(trainer, myOrders){
  if(!trainer) return;
  const today = todayStr();
  const now = new Date();
  let changed=false;
  const flags = state.reminderFlags;

  for(const o of myOrders){
    if(daysDiff(today,o.date)===1){
      const key='dayBefore_'+o.id;
      if(!flags[key]){
        flags[key]=true; changed=true;
        openAnnouncement('🔔 تذكير بفعالية غدًا', `لديك فعالية غدًا "${o.title}" في ${o.date} الساعة ${o.timeFrom||''}. الرجاء التجهيز لها.`);
        break;
      }
    }
  }
  // same-day: 2 hours after the event's end time, if not yet evaluated
  for(const o of myOrders){
    if(o.date===today && o.timeTo && !o.completionStatus){
      const end = parseDT(o.date, o.timeTo);
      if(end && (now - end) >= 2*60*60*1000){
        const key='2hAfter_'+o.id;
        if(!flags[key]){
          flags[key]=true; changed=true;
          openAnnouncement('📝 قيّم الفعالية', `مرّ أكثر من ساعتين على انتهاء فعالية "${o.title}". الرجاء تسجيل الإنجاز والتقييم الآن.`);
          break;
        }
      }
    }
  }
  for(const o of myOrders){
    if(o.date && o.date<today && !o.completionStatus){
      const key='postEvent_'+o.id;
      if(!flags[key]){
        flags[key]=true; changed=true;
        openAnnouncement('📝 حان وقت التقييم', `فعالية "${o.title}" بتاريخ ${o.date} انتهت. الرجاء تسجيل الإنجاز والتقييم الآن.`);
        break;
      }
    }
  }
  // newly assigned tasks
  const myTasksForPopup = state.tasks.filter(t=>t.trainerId===trainer.id);
  for(const t of myTasksForPopup){
    const key='taskAssigned_'+t.id;
    if(!flags[key]){
      flags[key]=true; changed=true;
      openAnnouncement('📋 مهمة جديدة', `تم إسناد مهمة جديدة إليك: "${t.title}"${t.due?(' — الاستحقاق: '+t.due):''}.`);
      break;
    }
  }
  if(now.getDay()===4){
    const wk = isoWeekKey(now);
    const key='motivation_'+trainer.id+'_'+wk;
    if(!flags[key]){
      flags[key]=true; changed=true;
      openAnnouncement('💐 رسالة تحفيزية', 'نشكر لك جهودك المقدمة خلال الاسبوع السابق ونأمل الإطلاع على فعاليات خلال الأسبوع القادم مع التجهيز لها.');
    }
  }
  if(changed) await saveState();
}
function openAnnouncement(title, message){
  const overlay=document.getElementById('modalOverlay'); const box=document.getElementById('modalBox');
  box.innerHTML = `<h3>${escapeHtml(title)}</h3><p style="font-size:15px;line-height:1.8;white-space:pre-line;">${escapeHtml(message)}</p>
    <div class="modal-actions"><button class="btn btn-primary" id="ann_ok">حسنًا</button></div>`;
  overlay.classList.add('open');
  document.getElementById('ann_ok').onclick=()=>overlay.classList.remove('open');
}

function trainerOrdersTable(list){
  if(!list.length) return `<div class="empty-state">لا توجد فعاليات</div>`;
  return `<table><thead><tr><th>م</th><th>العنوان</th><th>التاريخ</th><th>الوقت</th><th>المدرسة</th><th>الإنجاز</th><th>إجراءات</th></tr></thead><tbody>
    ${list.map(o=>{
      const school=state.schools.find(s=>s.id===o.schoolId);
      const statusBadge = doneBadge(o.completionStatus);
      return `<tr><td><span class="badge">${o.serial}</span></td><td>${escapeHtml(o.title)}</td><td>${fmtDate(o.date)}</td><td>${o.timeFrom||''}-${o.timeTo||''}</td>
        <td>${school?escapeHtml(school.name):''}</td><td>${statusBadge}</td>
        <td><button class="icon-btn" title="تسجيل الإنجاز والتقييم" onclick="openEvaluationModal('${o.id}')">📝</button></td></tr>`;
    }).join('')}</tbody></table>`;
}
function trainerOrdersTablePrint(list){
  if(!list.length) return `<div class="empty-state">لا توجد فعاليات</div>`;
  return repTableHtml(['م','العنوان','التاريخ','الوقت','المدرسة','الإنجاز'],
    list.map(o=>{ const school=state.schools.find(s=>s.id===o.schoolId);
      return [String(o.serial||'—'), escapeHtml(o.title||''), fmtDate(o.date),
        escapeHtml(fullTimeRange(o.timeFrom,o.timeTo)||'—'),
        school?escapeHtml(school.name):'—', doneBadge(o.completionStatus)]; }));
}
async function markNotifRead(id){ const n=state.notifications.find(x=>x.id===id); if(n){ n.read=true; await saveState(); renderKeepForm(); } }

/* ============ Approvals Page (admin only) ============ */
function renderApprovalsPage(c){
  const pending = state.trainerRequests.filter(r=>r.status==='pending').sort((a,b)=>a.createdAt-b.createdAt);
  const decided = state.trainerRequests.filter(r=>r.status!=='pending').sort((a,b)=>b.createdAt-a.createdAt).slice(0,20);

  function requestCard(r){
    const trainer=state.trainers.find(t=>t.id===r.trainerId);
    const sch=state.schools.find(s=>s.id===r.schoolId);
    const field=state.fields.find(f=>f.id===r.fieldId);
    const ptype=state.programTypes.find(p=>p.id===r.programTypeId);
    const statusBadge = r.status==='accepted'?'<span class="badge ok">مقبول</span>':r.status==='rejected'?'<span class="badge bad">مرفوض</span>':'<span class="badge">بانتظار الرد</span>';
    return `<div style="border:1px solid var(--line); border-radius:10px; padding:14px; margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
        <div>
          <div style="font-weight:700; color:var(--maroon-800); margin-bottom:4px;">${escapeHtml(r.title)} ${statusBadge}</div>
          <div style="font-size:13px; color:#5E4E54; line-height:1.9;">
            مقدم الفعالية: <strong>${trainer?escapeHtml(trainer.name):''}</strong>${trainer&&trainer.phone?' — '+escapeHtml(trainer.phone):''}<br>
            المدرسة المقترحة: <strong>${sch?escapeHtml(sch.name):''}</strong><br>
            التاريخ المقترح: <strong>${r.date||'—'}</strong> — الوقت: <strong>${r.timeFrom||''}${r.timeTo?(' إلى '+r.timeTo):''}</strong>
            ${field?`<br>مجال المبادرة: <strong>${escapeHtml(field.name)}</strong>`:''}
            ${ptype?` — مسار المبادرة: <strong>${escapeHtml(ptype.name)}</strong>`:''}
            ${r.participantsCount?`<br>عدد المستهدفين المقترح: <strong>${escapeHtml(String(r.participantsCount))}</strong>`:''}
            ${r.note?`<br>ملاحظات مقدم الطلب: ${escapeHtml(r.note)}`:''}
          </div>
        </div>
        ${r.status==='pending' ? `<div class="actions-cell">
          <button class="btn btn-primary btn-sm" onclick="acceptTrainerRequest('${r.id}')">✅ قبول وإضافة للجدول</button>
          <button class="btn btn-outline btn-sm" onclick="rejectTrainerRequest('${r.id}')">❌ رفض</button>
        </div>` : ''}
      </div>
    </div>`;
  }

  c.innerHTML = `
  <div class="card">
    <h2>طلبات بانتظار الرد ${pending.length?`<span class="badge" style="background:#FDF0DC;color:#8A1F42;">${pending.length}</span>`:''}</h2>
    ${pending.length ? pending.map(requestCard).join('') : `<div class="empty-state">لا توجد طلبات ترشيح بانتظار الرد حاليًا</div>`}
  </div>
  <div class="card">
    <h2>آخر القرارات</h2>
    ${decided.length ? decided.map(requestCard).join('') : `<div class="empty-state">لا توجد قرارات سابقة بعد</div>`}
  </div>`;
}

/* ============ Settings Page (admin only) ============ */
function renderSettingsPage(c){
  c.innerHTML = `
  <div class="card">
    <h2>إدارة البيانات</h2>
    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <button class="btn btn-outline" id="dm_backup">💾 نسخة احتياطية${bkSupported()&&bkInfo()&&bkInfo().dir?` (مجلد «${escapeHtml(bkInfo().dir)}»)`:''}</button>
      ${bkSupported()?`<button class="btn btn-outline" type="button" onclick="backupNow({change:true})">${icon('folder',15)} تغيير مكان حفظ النسخ</button>`:''}
      <button class="btn btn-outline" onclick="document.getElementById('dm_restoreFile').click()">📥 استيراد نسخة احتياطية</button>
      <input type="file" id="dm_restoreFile" accept=".json" style="display:none" onchange="restoreBackup(this.files[0])">
      <button class="btn btn-outline" id="dm_refresh">🔄 تحديث البيانات من الخادم</button>
      <button class="btn btn-outline" onclick="document.getElementById('dm_ordersFile').click()">📊 استيراد فعاليات من إكسل</button>
      <input type="file" id="dm_ordersFile" accept=".xlsx,.xls,.csv" style="display:none" onchange="importOrdersExcel(this.files[0])">
      <label class="checkbox-chip"><input type="checkbox" id="dm_importAsDone"> تعليم الفعاليات المستوردة كـ "منجزة"</label>
      <button class="btn btn-primary" type="button" onclick="openYearArchive()">${icon('inbox',15)} أرشيف الأعوام (داخل النظام)</button>
      <button class="btn btn-outline" type="button" onclick="openArchiveModal()">${icon('inbox',15)} أرشفة سنة دراسية إلى ملف</button>
      <button class="btn btn-outline" type="button" onclick="document.getElementById('dm_archiveFile').click()">${icon('bookOpen',15)} استعراض ملف أرشيف</button>
      <input type="file" id="dm_archiveFile" accept=".json" style="display:none" onchange="viewArchiveFile(this.files[0]); this.value='';">
      <button class="icon-btn rect danger" id="dm_dedupe" title="حذف الفعاليات المكررة (نفس العنوان والتاريخ والمدرسة)">🗑️ حذف المكرر من الفعاليات</button>
    </div>
    
  </div>
  <div class="card">
    <h2>بيانات الجهة والشعار وترويسة الطباعة</h2>
    <div class="grid">
      <div class="field"><label>اسم الجهة (للاستخدام الداخلي)</label><input id="set_orgName" value="${escapeHtml(state.orgName||'')}"></div>
      <div class="field"><label>الشعار (يفضّل PNG بخلفية شفافة)</label><input id="set_logo" type="file" accept="image/*"></div>
      <div class="field"><label>سطر 1 في ترويسة الطباعة</label><input id="set_ph1" value="${escapeHtml(state.printHeader.line1)}"></div>
      <div class="field"><label>سطر 2 في ترويسة الطباعة</label><input id="set_ph2" value="${escapeHtml(state.printHeader.line2)}"></div>
      <div class="field"><label>سطر 3 في ترويسة الطباعة</label><input id="set_ph3" value="${escapeHtml(state.printHeader.line3)}"></div>
      <div class="field"><label>الشعار النصّي في أمر التكليف</label><input id="set_slogan" value="${escapeHtml((state.printHeader.slogan===undefined||state.printHeader.slogan==='معاً نبني جيل المستقبل')?'معاً.. نبنى جيل المستقبل':state.printHeader.slogan)}"></div>
      <div class="field"><label>البريد الإلكتروني (تذييل أمر التكليف)</label><input id="set_email" dir="ltr" value="${escapeHtml(state.printHeader.email===undefined?'cultural@eidcharity.net':state.printHeader.email)}"></div>
      <div class="field"><label>الهاتف</label><input id="set_phone" dir="ltr" value="${escapeHtml(state.printHeader.phone===undefined?'5560 7826':state.printHeader.phone)}"></div>
      <div class="field"><label>المدينة / العنوان</label><input id="set_city" value="${escapeHtml(state.printHeader.city===undefined?'الدوحة - قطر':state.printHeader.city)}"></div>
      <div class="field"><label>الموقع الإلكتروني</label><input id="set_web" dir="ltr" value="${escapeHtml(state.printHeader.web===undefined?'www.eidcharity.net':state.printHeader.web)}"></div>
    </div>
    <div class="helper" style="margin:-4px 0 10px;">اترك أي حقل فارغًا ليختفي من أمر التكليف المطبوع.</div>
    <button class="btn btn-primary" id="set_saveOrg">حفظ</button>
  </div>

  <div class="card">
    <h2>المستخدمون وحسابات الدخول <button class="plus-btn" onclick="quickAddUser()">+</button></h2>
    <table><thead><tr><th>الاسم</th><th>اسم المستخدم</th><th>كلمة المرور</th><th>الدور</th><th>مرتبط بمقدم فعالية</th><th>الحالة</th><th></th></tr></thead><tbody>
    ${state.users.map(u=>{
      const t = state.trainers.find(x=>x.id===u.trainerId);
      const roleLabel = u.role==='admin'?'مدير نظام':u.role==='user'?'مستخدم':'مقدم فعالية';
      const active = u.active!==false;
      return `<tr><td>${escapeHtml(u.displayName||'')}</td><td>${escapeHtml(u.username)}</td><td>${state.authMode==='firebase'?(u.authUid?'<span class="badge ok">محمية</span>':'—'):escapeHtml(u.password||'')}</td><td>${roleLabel}</td><td>${t?escapeHtml(t.name):'—'}</td>
        <td>${active?'<span class="badge ok">مفعّل</span>':'<span class="badge bad">معطّل</span>'}</td>
        <td class="actions-cell">
          <button class="icon-btn" title="تعديل" onclick="editUser('${u.id}')">✏️</button>
          <button class="icon-btn" title="${active?'تعطيل':'تفعيل'}" onclick="toggleUserActive('${u.id}')">${active?icon('pause',14):icon('play',14)}</button>
          <button class="icon-btn danger" title="حذف" onclick="deleteFromList('users','${u.id}')">🗑️</button>
        </td></tr>`;
    }).join('') || `<tr><td colspan="7" class="empty-state">لا يوجد مستخدمون</td></tr>`}
    </tbody></table>
    <div class="helper" style="margin-top:8px;">${state.authMode==='firebase'?'🛡 كلمات المرور محفوظة مشفّرة في Firebase ولا تُخزَّن في النظام.':'⚠️ كلمات المرور ما زالت مخزّنة كنص — أكمل خطوات «الأمان» في الإعدادات.'}</div>
  </div>

  <div class="card"><h2>مجالات المبادرة <button class="plus-btn" onclick="quickAddField()">+</button></h2>${simpleListTable(state.fields, 'fields')}</div>
  <div class="card"><h2>مسارات المبادرة <span style="display:inline-flex;gap:6px;align-items:center;"><button class="btn btn-outline btn-sm" onclick="openPathFixer()">${icon('sparkles',14)} تصحيح المسارات من العناوين</button><button class="plus-btn" onclick="quickAddPType()">+</button></span></h2>${simpleListTable(state.programTypes, 'programTypes')}</div>
  <div class="card"><h2>أماكن التنفيذ الفعلية <button class="plus-btn" onclick="quickAddVenue()">+</button></h2>${simpleListTable(state.venues||[], 'venues')}</div>
  <div class="card"><h2>${icon('truck',15)} الموارد التي تُحجز <button class="plus-btn" onclick="quickAddResource()" title="إضافة مورد">+</button></h2>
    <div class="helper" style="margin-bottom:8px;">مثل المصلى المتنقل أو قاعة أو حافلة — يُمنع حجز المورد لفعاليتين في اليوم نفسه، ويُنبَّه عليه في الطلب والترحيل والتكرار الأسبوعي.</div>
    ${simpleListTable(state.resources||[], 'resources')}</div>
  <div class="card"><h2>الطلبات الإدارية <button class="plus-btn" onclick="quickAddAdminRequest()">+</button></h2>${simpleListTable(state.adminRequestsList, 'adminRequestsList')}</div>

  <div class="card"><h2>مقدمو الفعاليات
      <span><button class="btn btn-outline btn-sm" onclick="document.getElementById('trainerImportFile').click()">📥 استيراد إكسل</button>
      <input type="file" id="trainerImportFile" accept=".xlsx,.xls,.csv" style="display:none" onchange="importTrainersExcel(this.files[0])">
      <button class="plus-btn" onclick="quickAddTrainer()">+</button></span></h2>
    <div class="helper" style="margin-bottom:8px;">أعمدة الملف المتوقعة: الاسم، الجوال (بهذا الترتيب، مع صف عناوين أول).</div>
    <table><thead><tr><th>الاسم</th><th>الجوال</th><th></th></tr></thead><tbody>
    ${state.trainers.map(t=>`<tr><td><a href="#" onclick="openTrainerProfile('${t.id}');return false;">${escapeHtml(t.name)}</a>${(t.leaves||[]).some(l=>(l.to||l.from)>=todayStr())?' <span class="st st-hold">إجازة</span>':''}</td><td>${escapeHtml(t.phone||'')}</td>
      <td class="actions-cell"><button class="icon-btn" title="تعديل" onclick="editTrainer('${t.id}')">✏️</button><button class="icon-btn danger" title="حذف" onclick="deleteFromList('trainers','${t.id}')">🗑️</button></td></tr>`).join('') || `<tr><td colspan="3" class="empty-state">لا يوجد مقدمو فعاليات</td></tr>`}
    </tbody></table>
  </div>

  <div class="card" style="border:2px solid var(--danger,#CF443A);">
    <h2 style="background:var(--danger,#CF443A) !important;">${icon('alert',15)} النسخ الاحتياطي والاسترجاع</h2>
    ${(function(){
      const b = backupInfo();
      return `<div class="helper" style="margin-bottom:10px;line-height:1.9;">
        <b>النسخة الأخيرة داخل هذا المتصفح:</b> ${b.lastSum ? escapeHtml(b.lastSum) : 'لا توجد'}
        ${b.at?` — ${escapeHtml(new Date(b.at).toLocaleString('ar'))}`:''}<br>
        <b>النسخة التي قبلها:</b> ${b.prevSum ? escapeHtml(b.prevSum) : 'لا توجد'}<br>
        <b>البيانات الحالية:</b> ${(state.orders||[]).length} فعالية · ${(state.schools||[]).length} جهة · ${(state.trainers||[]).length} مقدّم
      </div>`;
    })()}
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="downloadBackup()">${icon('download',15)} تنزيل نسخة احتياطية</button>
      <button class="btn btn-outline" onclick="document.getElementById('restoreFile').click()">${icon('copy',15)} استرجاع كامل من ملف</button>
      <input type="file" id="restoreFile" accept=".json" style="display:none" onchange="restoreFromFile(this.files[0])">
      <button class="btn btn-outline" onclick="restoreLocal('last')">استرجاع كامل — النسخة الأخيرة</button>
      <button class="btn btn-outline" onclick="restoreLocal('prev')">استرجاع كامل — النسخة السابقة</button>
    </div>

    <div style="margin-top:14px;padding-top:12px;border-top:2px dashed var(--danger,#CF443A);">
      <div style="font-weight:800;color:var(--danger,#CF443A);margin-bottom:4px;">🔎 بياناتٌ أدخلتَها ولم تظهر؟</div>
      <div class="helper" style="margin-bottom:9px;line-height:1.8;">
        هذه الأدوات <b>تُضيف فقط</b> السجلات المفقودة ولا تمسح ولا تستبدل شيئًا موجودًا —
        استخدمها من نفس الجهاز الذي أدخلت البيانات عليه.
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="diagnoseToday()">${icon('alert',15)} فحص بيانات اليوم</button>
        <button class="btn btn-outline" onclick="recoverFromLocal('last')">استرجاع المفقود — النسخة الأخيرة</button>
        <button class="btn btn-outline" onclick="recoverFromLocal('prev')">استرجاع المفقود — النسخة السابقة</button>
        <button class="btn btn-outline" onclick="document.getElementById('recoverFile').click()">${icon('copy',15)} استرجاع المفقود من ملف</button>
        <input type="file" id="recoverFile" accept=".json" style="display:none" onchange="recoverFromFile(this.files[0])">
      </div>
    </div>
    <div class="helper" style="margin-top:9px;">نزّل نسخة احتياطية دوريًا واحتفظ بها خارج المتصفح.</div>
  </div>

  <div class="card"><h2>${icon('school',15)} المدارس والمشرفون
      <span style="display:inline-flex;gap:5px;align-items:center;">
        <input id="schSearch" placeholder="بحث بالمدرسة أو المشرف أو الهاتف..." autocomplete="off"
          style="width:230px;min-height:30px;font-size:12px;padding:0 10px;">
        <button class="icon-btn" onclick="document.getElementById('schoolImportFile').click()" title="استيراد إكسل" aria-label="استيراد إكسل" style="width:28px;height:28px;padding:0;">${icon('download',14)}</button>
        <input type="file" id="schoolImportFile" accept=".xlsx,.xls,.csv" style="display:none" onchange="importSchoolsExcel(this.files[0])">
        <button class="icon-btn" onclick="openSchoolStagesModal()" title="المدارس المصنّفة «أخرى» ومراجعة المراحل" aria-label="مراجعة المراحل" style="width:auto;height:28px;padding:0 8px;font-size:12px;gap:4px;">${icon('layers',14)} المراحل${(state.schools||[]).filter(s=>(s.stage||detectSchoolStage(s))==='أخرى').length?` <b class="ss-cnt">${(state.schools||[]).filter(s=>(s.stage||detectSchoolStage(s))==='أخرى').length} أخرى</b>`:''}</button>
        <button class="icon-btn" onclick="quickAddSchoolSettings()" title="إضافة مدرسة" aria-label="إضافة مدرسة" style="width:28px;height:28px;padding:0;">${icon('plus',14)}</button>
        <button class="icon-btn" onclick="dedupeAll()" title="حذف المكرر (مدارس ومشرفين وأرقام وبريد)" aria-label="حذف المكرر" style="width:28px;height:28px;padding:0;">${icon('copy',14)}</button>
        <button class="icon-btn" onclick="mergeSameSchools()" title="دمج المدارس المتطابقة بالاسم" aria-label="دمج المدارس المتطابقة" style="width:28px;height:28px;padding:0;">${icon('layers',14)}</button>
        <button class="icon-btn" onclick="mergeSelectedSchools()" title="دمج المدارس المحددة تحت اسم واحد" aria-label="دمج المحدد" style="width:auto;height:28px;padding:0 8px;font-size:11.5px;gap:4px;display:inline-flex;align-items:center;">${icon('checkCircle',13)} دمج المحدد</button>
        <button class="icon-btn danger" onclick="bulkDeleteSchoolRows()" title="حذف المحدد" aria-label="حذف المحدد" style="width:28px;height:28px;padding:0;">${icon('trash',14)}</button>
      </span></h2>
    <div class="tbl-scroll">
    <table class="set-table" id="schoolsTable"><thead><tr>
      <th style="width:28px;"><input type="checkbox" id="schoolSelectAll"></th>
      <th>اسم المدرسة</th><th>المرحلة</th><th>بريد المدرسة</th>
      <th>المشرف</th><th>الجوال</th><th>بريد المشرف</th><th style="width:70px;"></th>
    </tr></thead><tbody>
    ${(function(){
      const rows=[];
      state.schools.slice().sort((a,b)=>{
        const aU=(!a.level||a.level==='غير ذلك')?0:1, bU=(!b.level||b.level==='غير ذلك')?0:1; return aU-bU;
      }).forEach(s=>{
        const flag = (!s.level||s.level==='غير ذلك');
        const svs = s.supervisors||[];
        if(!svs.length){
          rows.push(`<tr data-find="${escapeHtml((s.name+' '+(s.email||'')).toLowerCase())}"${flag?' style="background:#FFF8EC;"':''}>
            <td><input type="checkbox" class="schRow" data-school="${s.id}"></td>
            <td style="text-align:right;"><a href="#" onclick="openSchoolProfile('${s.id}');return false;">${escapeHtml(s.name)}</a></td>
            <td>${stageSelectHtml(s)}</td>
            <td style="text-align:right;">${escapeHtml(s.email||'—')}</td>
            <td colspan="3" class="helper">لا يوجد مشرفون</td>
            <td><button class="icon-btn" title="إضافة مشرف" onclick="quickAddSupervisorSettings('${s.id}')" style="width:24px;height:24px;padding:0;">${icon('plus',12)}</button>
                <button class="icon-btn" title="تعديل" onclick="editSchool('${s.id}')" style="width:24px;height:24px;padding:0;">${icon('edit',12)}</button></td>
          </tr>`);
        } else svs.forEach((sv,i)=>{
          rows.push(`<tr data-find="${escapeHtml((s.name+' '+sv.name+' '+(sv.phone||'')+' '+(sv.email||'')+' '+(s.email||'')).toLowerCase())}"${flag?' style="background:#FFF8EC;"':''}>
            <td><input type="checkbox" class="schRow" data-school="${s.id}" data-sv="${sv.id}"></td>
            <td style="text-align:right;">${i===0?`<a href="#" onclick="openSchoolProfile('${s.id}');return false;">${escapeHtml(s.name)}</a>`:''}</td>
            <td>${i===0?stageSelectHtml(s):''}</td>
            <td style="text-align:right;">${i===0?escapeHtml(s.email||'—'):''}</td>
            <td style="text-align:right;">${escapeHtml(sv.name)}</td>
            <td style="direction:ltr;">${escapeHtml(sv.phone||'—')}</td>
            <td style="text-align:right;">${escapeHtml(sv.email||'—')}</td>
            <td style="white-space:nowrap;">
              <button class="icon-btn" title="تعديل المشرف" aria-label="تعديل المشرف" onclick="editSupervisor('${s.id}','${sv.id}')">${icon('edit',12)}</button>
              <button class="icon-btn danger" title="حذف المشرف" aria-label="حذف المشرف" onclick="deleteSupervisor('${s.id}','${sv.id}')">${icon('trash',12)}</button>
              ${i===0?`<button class="icon-btn" title="إضافة مشرف" aria-label="إضافة مشرف" onclick="quickAddSupervisorSettings('${s.id}')">${icon('plus',12)}</button>
              <button class="icon-btn" title="تعديل المدرسة" aria-label="تعديل المدرسة" onclick="editSchool('${s.id}')">${icon('school',12)}</button>`:''}</td>
          </tr>`);
        });
      });
      return rows.join('') || `<tr><td colspan="8" class="empty-state">لا توجد مدارس</td></tr>`;
    })()}
    </tbody></table></div>
    <div class="helper" id="schCount" style="margin-top:6px;"></div>
  </div>`;

  /* بحث فوري في جدول المدارس */
  const _ss = document.getElementById('schSearch');
  if(_ss){
    const rows = Array.from(document.querySelectorAll('#schoolsTable tbody tr'));
    const cnt = document.getElementById('schCount');
    const upd = ()=>{
      const q = _ss.value.trim().toLowerCase();
      let n=0;
      rows.forEach(r=>{ const ok = !q || (r.dataset.find||'').includes(q); r.style.display = ok?'':'none'; if(ok) n++; });
      cnt.textContent = `${n} سطر`;
    };
    _ss.addEventListener('input', upd); upd();
  }
  const _sa = document.getElementById('schoolSelectAll');
  if(_sa) _sa.onchange=()=>{
    document.querySelectorAll('#schoolsTable tbody tr').forEach(r=>{
      if(r.style.display==='none') return;
      const c=r.querySelector('.schRow'); if(c) c.checked=_sa.checked;
    });
  };

  document.getElementById('set_saveOrg').onclick=async ()=>{
    state.orgName=document.getElementById('set_orgName').value.trim();
    state.printHeader.line1=document.getElementById('set_ph1').value;
    state.printHeader.line2=document.getElementById('set_ph2').value;
    state.printHeader.line3=document.getElementById('set_ph3').value;
    ['slogan','email','phone','city','web'].forEach(k=>{ state.printHeader[k] = document.getElementById('set_'+k).value.trim(); });
    const file=document.getElementById('set_logo').files[0];
    if(file){ state.logo = await fileToDataUrl(file); }
    await saveState(); toast('تم الحفظ'); render();
  };
  document.getElementById('dm_backup').onclick=()=>backupNow();
  document.getElementById('dm_refresh').onclick=async ()=>{
    toast('جارٍ التحديث...');
    await loadState();
    toast('تم تحديث البيانات من الخادم');
    render();
  };
  document.getElementById('dm_dedupe').onclick=async ()=>{
    function normTitle(s){ return (s||'').toString().trim().replace(/\s+/g,' '); }
    const seen = new Map(); // key -> kept order
    const toDelete = [];
    // نرتب حسب رقم التكليف تصاعديًا حتى نُبقي أول (أقدم) نسخة من كل تكرار
    state.orders.slice().sort((a,b)=>(a.serial||0)-(b.serial||0)).forEach(o=>{
      const key = normTitle(o.title)+'|'+(o.date||'')+'|'+(o.schoolId||'');
      if(seen.has(key)){ toDelete.push(o.id); } else { seen.set(key, o.id); }
    });
    if(!toDelete.length){ toast('لا توجد فعاليات مكررة'); return; }
    const ok = confirm(`تم العثور على ${toDelete.length} فعالية مكررة (نفس العنوان والتاريخ والمدرسة). سيتم حذفها والإبقاء على أقدم نسخة من كل مجموعة. هل تريد المتابعة؟`);
    if(!ok) return;
    state.orders = state.orders.filter(o=>!toDelete.includes(o.id));
    await saveState(); toast(`تم حذف ${toDelete.length} فعالية مكررة`); render();
  };
}
async function restoreBackup(file){
  if(!file) return;
  if(!confirm('سيتم استبدال جميع البيانات الحالية بمحتوى ملف النسخة الاحتياطية. هل تريد المتابعة؟')) return;
  try{
    const text = await file.text();
    const parsed = JSON.parse(text);
    if(!parsed || typeof parsed!=='object' || !Array.isArray(parsed.orders)){ toast('ملف النسخة الاحتياطية غير صالح'); return; }
    state = parsed;
    await saveState(); toast('تم استعادة النسخة الاحتياطية'); render();
  }catch(e){ toast('تعذّرت قراءة الملف'); console.error(e); }
}
async function importOrdersExcel(file){
  if(!file) return;
  try{
    const markDone = document.getElementById('dm_importAsDone') && document.getElementById('dm_importAsDone').checked;
    const rows = await readExcelFile(file);
    let added=0, skipped=0;
    function normTitle(s){ return (s||'').toString().trim().replace(/\s+/g,' '); }
    rows.slice(1).forEach(r=>{
      const title=(r[0]||'').toString().trim(); if(!title) return;
      let date=r[1]; if(date instanceof Date){ date = dateToISO(date); } else { date=(date||'').toString().trim(); }
      const timeFrom=(r[2]||'').toString().trim(), timeTo=(r[3]||'').toString().trim();
      const schoolName=(r[4]||'').toString().trim(); const participantsCount=(r[5]||'').toString().trim();
      // أعمدة اختيارية إضافية: G = مسار البرنامج (اسم), H = المدربون "الاسم:الهاتف، الاسم:الهاتف"
      // I = اسم المشرف, J = رقم جوال المشرف
      const ptypeName=(r[6]||'').toString().trim();
      const trainersRaw=(r[7]||'').toString().trim();
      const supName=(r[8]||'').toString().trim();
      const supPhone=(r[9]||'').toString().trim();
      // أعمدة الدمج مع كشف المدارس: K = المرحلة الدراسية, L = بريد المدرسة, M = بريد المشرف
      const schLevel=(r[10]||'').toString().trim();
      const schEmail=(r[11]||'').toString().trim();
      const supEmail=(r[12]||'').toString().trim();

      let sch = state.schools.find(s=>s.name===schoolName);
      // فحص التكرار: نفس عنوان المبادرة + نفس التاريخ + نفس المدرسة (سواء موجودة مسبقًا أو ستُنشأ الآن)
      const isDup = state.orders.some(o => normTitle(o.title)===normTitle(title) && o.date===date && sch && o.schoolId===sch.id);
      if(isDup){ skipped++; return; }

      if(!sch && schoolName){ sch={id:uid(), name:schoolName, level: schLevel||'غير ذلك', email: schEmail, supervisors:[]}; state.schools.push(sch); }
      else if(sch){
        if(schLevel && (!sch.level || sch.level==='غير ذلك')) sch.level = schLevel;
        if(schEmail && !sch.email) sch.email = schEmail;
      }

      let programTypeId = state.programTypes[0]?state.programTypes[0].id:'';
      if(ptypeName){
        let pt = state.programTypes.find(p=>p.name===ptypeName);
        if(!pt){ pt={id:uid(), name:ptypeName}; state.programTypes.push(pt); }
        programTypeId = pt.id;
      }

      const trainerIds = [];
      if(trainersRaw){
        trainersRaw.split(/[،,]/).map(s=>s.trim()).filter(Boolean).forEach(entry=>{
          const [nm, ph] = entry.split(':').map(s=>s?s.trim():'');
          const name = nm||entry;
          let tr = state.trainers.find(t=> (ph && t.phone===ph) || t.name===name);
          if(!tr){ tr={id:uid(), name, phone:ph||''}; state.trainers.push(tr); }
          trainerIds.push(tr.id);
        });
      }

      // المشرف: يُطابق برقم الجوال أو الاسم داخل نفس الجهة، ويُنشأ إن لم يوجد
      let supervisorId = '';
      if(sch && (supName || supPhone)){
        let sv = sch.supervisors.find(x => (supPhone && x.phone===supPhone) || (supName && x.name===supName));
        if(!sv){ sv = {id:uid(), name: supName||'مشرف (بدون اسم)', phone: supPhone, email: supEmail}; sch.supervisors.push(sv); }
        else {
          if(supPhone && !sv.phone) sv.phone = supPhone;
          if(supEmail && !sv.email) sv.email = supEmail;
        }
        supervisorId = sv.id;
      }

      const maxSerialThisYear = nextOrderSerial() - 1;
      state.orders.push({
        id:uid(), serial: maxSerialThisYear+1, createdAt:Date.now(), title, fieldId: state.fields[0]?state.fields[0].id:'',
        participantsCount, date, timeFrom, timeTo, programTypeId,
        schoolId: sch?sch.id:'', supervisorId, trainerIds, requesterNote:'', adminNote:'مستورد من إكسل',
        adminRequests:[], completionStatus: markDone?'تم':'', notDoneReason:'', supervisorRating:0, schoolRating:0, studentsRating:0, recommendSchool:'', evaluatedBy:'', status:'active'
      });
      added++;
    });
    await saveState(); toast(`تم استيراد ${added} فعالية${skipped?` — تم تجاهل ${skipped} فعالية مكررة (نفس العنوان والتاريخ والمدرسة)`:''}`); render();
  }catch(e){ toast('تعذّرت قراءة الملف، تأكد من صيغته'); console.error(e); }
}
function simpleListTable(list, key){
  if(!list.length) return `<div class="empty-state">لا توجد عناصر</div>`;
  /* أسطر ضيقة والأيقونات أقصى اليسار */
  return `<div class="set-list">${list.map(i=>`
    <div class="set-list-row">
      <span>${escapeHtml(i.name)}${i.phone?` <b style="color:var(--muted-text);font-weight:400;direction:ltr;">${escapeHtml(i.phone)}</b>`:''}${i.category?` <em style="color:var(--soft-text);font-style:normal;font-size:11px;">(${escapeHtml(i.category)})</em>`:''}</span>
      <button class="icon-btn" title="تعديل" aria-label="تعديل" onclick="editListItem('${key}','${i.id}')">${icon('edit',12)}</button>
      <button class="icon-btn danger" title="حذف" aria-label="حذف" onclick="deleteFromList('${key}','${i.id}')">${icon('trash',12)}</button>
    </div>`).join('')}</div>`;
}
function editListItem(key, id){
  const item = state[key].find(x=>x.id===id); if(!item) return;
  openModal('تعديل: '+item.name, [{name:'name', label:'الاسم', required:true}], async v=>{
    item.name = v.name; await saveState(); toast('تم الحفظ'); render();
  });
  setTimeout(()=>{ const f=document.getElementById('mf_name'); if(f) f.value=item.name; },0);
}
function editTrainer(id){
  const t = state.trainers.find(x=>x.id===id); if(!t) return;
  openModal('تعديل مقدم مبادرة: '+t.name, [{name:'name', label:'الاسم', required:true},{name:'phone', label:'رقم الجوال'}], async v=>{
    t.name=v.name; t.phone=v.phone; await saveState(); toast('تم الحفظ'); render();
  });
  setTimeout(()=>{ const f=document.getElementById('mf_name'); if(f) f.value=t.name; const p=document.getElementById('mf_phone'); if(p) p.value=t.phone||''; },0);
}
function editSchool(id){
  const s = state.schools.find(x=>x.id===id); if(!s) return;
  openModal('تعديل مدرسة: '+s.name, [
    {name:'name', label:'اسم المدرسة / الجهة', required:true},
    {name:'level', label:'المرحلة الدراسية', type:'select', options:LOCATION_TYPES.map(t=>({value:t,label:t}))},
    {name:'email', label:'البريد الإلكتروني للمدرسة (اختياري)'},
  ], async v=>{ s.name=v.name; s.level=v.level; s.email=v.email||''; await saveState(); toast('تم الحفظ'); renderKeepForm(); });
  setTimeout(()=>{ const f=document.getElementById('mf_name'); if(f) f.value=s.name; const l=document.getElementById('mf_level'); if(l) l.value=s.level; const em=document.getElementById('mf_email'); if(em) em.value=s.email||''; },0);
}

/* ---- Excel import (SheetJS) ---- */
/* مكتبة SheetJS تأتي من شبكة توصيل خارجية. إن تعذّر تحميلها (انقطاع
   الإنترنت أو حجب الشبكة) كانت أزرار Excel تموت صامتة بلا أي إشعار:
   ReferenceError في الكواليس والمستخدم يظنّ الزرّ معطوبًا. */
function xlsxReady(){
  if(typeof XLSX !== 'undefined' && XLSX && XLSX.utils) return true;
  toast('تعذّر تحميل مكتبة Excel — تحقّق من الاتصال بالإنترنت ثم أعد المحاولة');
  return false;
}
function readExcelFile(file){
  if(!xlsxReady()) return Promise.reject(new Error('XLSX unavailable'));
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = (e)=>{
      try{
        const wb = XLSX.read(e.target.result, {type:'array'});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {header:1, defval:''});
        resolve(rows);
      }catch(err){ reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
async function importTrainersExcel(file){
  if(!file) return;
  try{
    const rows = await readExcelFile(file);
    let added=0;
    rows.slice(1).forEach(r=>{
      const name=(r[0]||'').toString().trim(); const phone=(r[1]||'').toString().trim();
      if(name){ state.trainers.push({id:uid(), name, phone}); added++; }
    });
    await saveState(); toast(`تم استيراد ${added} مقدم فعالية`); render();
  }catch(e){ toast('تعذّرت قراءة الملف، تأكد من صيغته'); console.error(e); }
}
async function importSchoolsExcel(file){
  if(!file) return;
  try{
    const rows = await readExcelFile(file);
    let added=0, supAdded=0, emailFilled=0;
    rows.slice(1).forEach(r=>{
      const name=(r[0]||'').toString().trim(); const level=(r[1]||'غير ذلك').toString().trim();
      const schoolEmail=(r[2]||'').toString().trim();
      const svName=(r[3]||'').toString().trim(); const svPhone=(r[4]||'').toString().trim(); const svEmail=(r[5]||'').toString().trim();
      if(!name) return;
      let sch = state.schools.find(s=>s.name===name);
      if(!sch){ sch={id:uid(), name, level, email:schoolEmail, supervisors:[]}; state.schools.push(sch); added++; }
      else if(schoolEmail && !sch.email){ sch.email = schoolEmail; emailFilled++; }
      if(svName || svPhone || svEmail){
        const already = sch.supervisors.some(sv=> (svPhone && sv.phone===svPhone) || (svName && sv.name===svName && !svPhone) );
        if(!already){ sch.supervisors.push({id:uid(), name:svName||'مشرف (بدون اسم)', phone:svPhone, email:svEmail}); supAdded++; }
      }
    });
    await saveState(); toast(`تم استيراد ${added} مدرسة جديدة، ${supAdded} مشرف، وتحديث بريد ${emailFilled} مدرسة`); render();
  }catch(e){ toast('تعذّرت قراءة الملف، تأكد من صيغته'); console.error(e); }
}
/* يزيل محارف العزل الاتجاهي (LRI/PDI) قبل التصدير لملفات Excel */
function stripBidi(v){
  return (v===null||v===undefined) ? v : String(v).replace(/[\u2066-\u2069\u200E\u200F]/g,'');
}
/* يحوّل خلية HTML إلى نص نظيف قبل كتابتها في Excel */
function xlText(v){
  if(typeof v!=='string' || v.indexOf('<')===-1) return v;
  return v.replace(/<br\s*\/?>/gi,' ')
    .replace(/مكان التنفيذ:/g,'— مكان التنفيذ:')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'")
    .replace(/\s+/g,' ').trim();
}
function exportToExcel(filename, headers, rows, titleAr){
  if(!xlsxReady()) return;
  const now = new Date();
  const dateStr = fmtDate(todayStr());
  const timeStr = now.toLocaleTimeString('ar-QA-u-nu-latn', {hour:'2-digit', minute:'2-digit'});
  const aoa = [];
  if(titleAr){ aoa.push([titleAr]); aoa.push([stripBidi(`تاريخ التصدير: ${dateStr}    وقت التصدير: ${timeStr}`)]); aoa.push([]); }
  aoa.push(headers.map(stripBidi));
  rows.forEach(r=>aoa.push(r.map(v=>stripBidi(xlText(v)))));
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = headers.map(()=>({wch:18}));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'بيانات');
  XLSX.writeFile(wb, filename);
}
function exportToExcelMultiSheet(filename, sheets, titleAr){
  // sheets: [{name, headers, rows}]
  if(!xlsxReady()) return;
  const now = new Date();
  const dateStr = fmtDate(todayStr()), timeStr = now.toLocaleTimeString('ar-QA-u-nu-latn', {hour:'2-digit', minute:'2-digit'});
  const wb = XLSX.utils.book_new();
  sheets.forEach(s=>{
    const aoa = [];
    if(titleAr){ aoa.push([titleAr]); aoa.push([stripBidi(`تاريخ التصدير: ${dateStr}    وقت التصدير: ${timeStr}`)]); aoa.push([]); }
    aoa.push(s.headers.map(stripBidi));
    s.rows.forEach(r=>aoa.push(r.map(v=>stripBidi(xlText(v)))));
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = s.headers.map(()=>({wch:18}));
    XLSX.utils.book_append_sheet(wb, ws, (s.name||'بيانات').slice(0,31));
  });
  XLSX.writeFile(wb, filename);
}
async function deleteFromList(key, id){
  if(!confirm('هل تريد الحذف؟')) return;
  if(key==='users'){ const du=(state.users||[]).find(x=>x.id===id); try{ if(du&&du.authUid) await removeMember(du.authUid); }catch(e){} }
  state[key] = state[key].filter(x=>x.id!==id);
  await saveState(); renderKeepForm();
}
/* تعديل بيانات مشرف */
function editSupervisor(schoolId, svId){
  const sc = state.schools.find(x=>x.id===schoolId); if(!sc) return;
  const sv = (sc.supervisors||[]).find(x=>x.id===svId); if(!sv) return;
  openModal('تعديل المشرف: '+sv.name, [
    {name:'name',  label:'اسم المشرف', required:true},
    {name:'phone', label:'رقم الجوال'},
    {name:'email', label:'البريد الإلكتروني'},
  ], async v=>{
    if(!v.name || !v.name.trim()){ toast('أدخل اسم المشرف'); return false; }
    sv.name = v.name.trim(); sv.phone = (v.phone||'').trim(); sv.email = (v.email||'').trim();
    await saveState(); toast('تم حفظ بيانات المشرف'); renderKeepForm();
  });
  setTimeout(()=>{
    const n=document.getElementById('mf_name'), p=document.getElementById('mf_phone'), e=document.getElementById('mf_email');
    if(n) n.value = sv.name||''; if(p) p.value = sv.phone||''; if(e) e.value = sv.email||'';
  },0);
}
async function deleteSupervisor(schoolId, svId){
  if(!confirm('هل تريد حذف المشرف؟')) return;
  const sch=state.schools.find(s=>s.id===schoolId);
  if(sch){ sch.supervisors = sch.supervisors.filter(x=>x.id!==svId); await saveState(); renderKeepForm(); }
}
async function bulkDeleteSchools(){
  const ids = Array.from(document.querySelectorAll('.schoolBulkChk:checked')).map(c=>c.value);
  if(!ids.length){ toast('لم تحدد أي مدرسة'); return; }
  if(!confirm(`هل تريد حذف ${ids.length} مدرسة محددة؟`)) return;
  state.schools = state.schools.filter(s=>!ids.includes(s.id));
  await saveState(); toast('تم حذف المدارس المحددة'); render();
}
async function bulkDeleteSupervisors(schoolId){
  const ids = Array.from(document.querySelectorAll(`.svChk_${schoolId}:checked`)).map(c=>c.value);
  if(!ids.length){ toast('لم تحدد أي مشرف'); return; }
  if(!confirm(`هل تريد حذف ${ids.length} مشرف محدد؟`)) return;
  const sch = state.schools.find(s=>s.id===schoolId);
  if(sch){ sch.supervisors = sch.supervisors.filter(sv=>!ids.includes(sv.id)); await saveState(); toast('تم حذف المشرفين المحددين'); render(); }
}
function quickAddSchoolSettings(){ quickAddSchool(); }
/* حذف المدارس المكررة بالاسم — تُدمج فعالياتها في السجل الأول ولا تُفقد */
/* حذف ما هو محدد في جدول المدارس — مدارس أو مشرفين */
async function bulkDeleteSchoolRows(){
  const checks = Array.from(document.querySelectorAll('#schoolsTable .schRow:checked'));
  if(!checks.length){ toast('حدد سطرًا واحدًا على الأقل'); return; }
  const svTargets = checks.filter(c=>c.dataset.sv).map(c=>({s:c.dataset.school, sv:c.dataset.sv}));
  const schoolOnly = checks.filter(c=>!c.dataset.sv).map(c=>c.dataset.school);
  /* المدرسة تُحذف فقط إذا حُدّد كل مشرفيها أو لم يكن لها مشرفون */
  const fullSchools = new Set(schoolOnly);
  const bySchool = {};
  svTargets.forEach(t=>{ (bySchool[t.s]=bySchool[t.s]||[]).push(t.sv); });
  Object.entries(bySchool).forEach(([sid, list])=>{
    const sc = state.schools.find(x=>x.id===sid);
    if(sc && (sc.supervisors||[]).length === list.length) fullSchools.add(sid);
  });
  const used = Array.from(fullSchools).filter(id=>state.orders.some(o=>o.schoolId===id));
  let msg = `سيتم حذف ${fullSchools.size} مدرسة و${svTargets.length} مشرف.`;
  if(used.length) msg += `\n\n⚠️ ${used.length} من المدارس المحددة مرتبطة بفعاليات مسجّلة.`;
  if(!confirm(msg+'\n\nمتابعة؟')) return;
  Object.entries(bySchool).forEach(([sid, list])=>{
    const sc = state.schools.find(x=>x.id===sid);
    if(sc && !fullSchools.has(sid)) sc.supervisors = (sc.supervisors||[]).filter(v=>!list.includes(v.id));
  });
  state.schools = state.schools.filter(s=>!fullSchools.has(s.id));
  await saveState(); toast('تم الحذف'); render();
}
/* حذف المكرر: مدارس، مشرفون، أرقام، بريد */
/* دمج المدارس التي تحمل الاسم نفسه مع مشرفيها — بلا تكرار */
/* ══════════ دمج المدارس ══════════ */
const _mzNz = s => String(s||'').replace(/[\u064B-\u0652\u0640]/g,'')
  .replace(/[أإآا]/g,'ا').replace(/[ىي]/g,'ي').replace(/ة/g,'ه')
  .replace(/[\-–—_.,،()]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
const _mzDigits = s => String(s||'').replace(/\D/g,'');
/* مفتاح المطابقة: الاسم بعد إزالة البادئات العامة (مدرسة / المدرسة / مدارس)
   «مدرسة خالد بن أحمد» = «خالد بن أحمد»، أما «خالد بن أحمد الابتدائية» فتبقى مختلفة */
function schoolKey(name){
  let k = _mzNz(name);
  k = k.replace(/^(المدرسه|مدرسه|مدارس|م)\s+/, '');
  return k.trim();
}
/* يدمج سجلات مدارس في سجل واحد: الفعاليات والمشرفون والبريد */
function mergeSchoolsInto(keep, dups, finalName){
  const st = {schools:0, sups:0, orders:0};
  keep.supervisors = keep.supervisors || [];
  const same = (a,b)=>
    (_mzNz(a.name) && _mzNz(a.name)===_mzNz(b.name)) ||
    (_mzDigits(a.phone) && _mzDigits(a.phone)===_mzDigits(b.phone)) ||
    (_mzNz(a.email) && _mzNz(a.email)===_mzNz(b.email));
  dups.filter(d=>d.id!==keep.id).forEach(dup=>{
    (dup.supervisors||[]).forEach(sv=>{
      const twin = keep.supervisors.find(k=>same(k,sv));
      if(twin){
        /* نكمل الناقص من بيانات المشرف المكرر ثم نحوّل فعالياته */
        if(!twin.phone && sv.phone) twin.phone = sv.phone;
        if(!twin.email && sv.email) twin.email = sv.email;
        (state.orders||[]).forEach(o=>{ if(o.supervisorId===sv.id) o.supervisorId = twin.id; });
        st.sups++;
      } else keep.supervisors.push(sv);
    });
    (state.orders||[]).forEach(o=>{ if(o.schoolId===dup.id){ o.schoolId = keep.id; st.orders++; } });
    if(!keep.level || keep.level==='غير ذلك'){ if(dup.level && dup.level!=='غير ذلك') keep.level = dup.level; }
    if(!keep.email && dup.email) keep.email = dup.email;
    state.schools = state.schools.filter(x=>x.id!==dup.id);
    st.schools++;
  });
  if(finalName && finalName.trim()) keep.name = finalName.trim();
  return st;
}
/* الاسم المقترح للمجموعة: الأكثر اكتمالًا (الأطول) */
function bestSchoolName(g){
  return g.map(s=>s.name||'').sort((a,b)=>b.length-a.length)[0] || '';
}
/* دمج تلقائي للمدارس المتطابقة بالاسم */
async function mergeSameSchools(){
  const groups = new Map();
  (state.schools||[]).forEach(s=>{
    const k = schoolKey(s.name); if(!k) return;
    if(!groups.has(k)) groups.set(k, []);
    groups.get(k).push(s);
  });
  const dupGroups = Array.from(groups.values()).filter(g=>g.length>1);
  if(!dupGroups.length){ toast('لا توجد مدارس متطابقة بالاسم'); return; }
  const preview = dupGroups.map(g=>{
    const svN = g.reduce((s,x)=>s+((x.supervisors||[]).length), 0);
    const evN = g.reduce((s,x)=>s+(state.orders||[]).filter(o=>o.schoolId===x.id).length, 0);
    return `• ${g.map(x=>x.name).join('  +  ')}\n   ← تُدمج باسم: ${bestSchoolName(g)}\n   ${svN} مشرفًا · ${evN} فعالية`;
  }).join('\n\n');
  if(!confirm(`سيتم دمج ${dupGroups.length} مجموعة مدارس متطابقة:\n\n${preview}\n\n`
    + `تُنقل الفعاليات والمشرفون والبريد إلى سجل واحد، ويُحذف المشرفون المكررون.\n\nمتابعة؟`)) return;
  const tot = {schools:0, sups:0, orders:0};
  dupGroups.forEach(g=>{
    const keep = g.slice().sort((a,b)=>((b.supervisors||[]).length - (a.supervisors||[]).length))[0];
    const r = mergeSchoolsInto(keep, g, bestSchoolName(g));
    tot.schools+=r.schools; tot.sups+=r.sups; tot.orders+=r.orders;
  });
  await saveState();
  toast(`دُمجت ${tot.schools} مدرسة · ${tot.sups} مشرفًا مكررًا · نُقلت ${tot.orders} فعالية`);
  render();
}
/* دمج المدارس المحددة يدويًا تحت اسم يختاره المستخدم */
function mergeSelectedSchools(){
  const ids = [...new Set(Array.from(document.querySelectorAll('#schoolsTable .schRow:checked')).map(c=>c.dataset.school))];
  const picked = ids.map(id=>state.schools.find(s=>s.id===id)).filter(Boolean);
  if(picked.length < 2){ toast('حدد مدرستين أو أكثر لدمجها'); return; }
  const def = bestSchoolName(picked);
  openModal(`دمج ${picked.length} مدارس تحت اسم واحد`, [
    {name:'pick', label:'اختر الاسم النهائي', type:'select',
     options: picked.map(s=>({value:s.id, label:s.name})).concat([{value:'__new', label:'— اسم آخر (أكتبه أدناه) —'}])},
    {name:'newName', label:'الاسم الجديد (عند اختيار «اسم آخر»)'},
  ], async v=>{
    let finalName = '';
    if(v.pick==='__new'){
      finalName = (v.newName||'').trim();
      if(!finalName){ toast('اكتب الاسم الجديد'); return false; }
    } else {
      const s = picked.find(x=>x.id===v.pick); finalName = s ? s.name : def;
    }
    /* السجل المُبقى: الذي اخترت اسمه، وإلا الأكثر مشرفين */
    const keep = picked.find(x=>x.id===v.pick)
      || picked.slice().sort((a,b)=>((b.supervisors||[]).length - (a.supervisors||[]).length))[0];
    const svN = picked.reduce((s,x)=>s+((x.supervisors||[]).length), 0);
    const evN = picked.reduce((s,x)=>s+(state.orders||[]).filter(o=>o.schoolId===x.id).length, 0);
    if(!confirm(`سيتم دمج:\n\n${picked.map(s=>'• '+s.name).join('\n')}\n\nتحت اسم: ${finalName}\n\n`
      + `${svN} مشرفًا · ${evN} فعالية — تُحذف المشرفون المكررون ويُحتفظ بالبريد.\n\nمتابعة؟`)) return false;
    const r = mergeSchoolsInto(keep, picked, finalName);
    await saveState();
    toast(`دُمجت ${r.schools+1} مدارس باسم «${finalName}» · ${r.sups} مشرفًا مكررًا · نُقلت ${r.orders} فعالية`);
    render();
  });
  setTimeout(()=>{
    const p = document.getElementById('mf_pick');
    const best = picked.find(s=>s.name===def);
    if(p && best) p.value = best.id;
  },0);
}
async function dedupeAll(){
  const norm = s => (s||'').replace(/\s+/g,' ').trim().toLowerCase();
  const digits = s => (s||'').replace(/\D/g,'');
  let schoolsRemoved=0, svRemoved=0, moved=0;
  /* 1) المدارس المكررة بالاسم */
  const seen = new Map();
  [...state.schools].forEach(s=>{
    const k = norm(s.name);
    if(seen.has(k)){
      const keep = seen.get(k);
      (s.supervisors||[]).forEach(sv=>{
        if(!(keep.supervisors||[]).some(k2=>norm(k2.name)===norm(sv.name))){
          keep.supervisors = keep.supervisors||[]; keep.supervisors.push(sv);
        }
      });
      state.orders.forEach(o=>{ if(o.schoolId===s.id){ o.schoolId=keep.id; moved++; } });
      state.schools = state.schools.filter(x=>x.id!==s.id);
      schoolsRemoved++;
    } else seen.set(k, s);
  });
  /* 2) المشرفون المكررون داخل كل مدرسة (بالاسم أو الجوال أو البريد) */
  state.schools.forEach(s=>{
    const keepList=[], names=new Set(), phones=new Set(), mails=new Set();
    (s.supervisors||[]).forEach(sv=>{
      const n=norm(sv.name), p=digits(sv.phone), m=norm(sv.email);
      const dup = (n && names.has(n)) || (p && phones.has(p)) || (m && mails.has(m));
      if(dup){ svRemoved++; return; }
      if(n) names.add(n); if(p) phones.add(p); if(m) mails.add(m);
      keepList.push(sv);
    });
    s.supervisors = keepList;
  });
  if(!schoolsRemoved && !svRemoved){ toast('لا يوجد تكرار'); return; }
  if(!confirm(`سيتم حذف ${schoolsRemoved} مدرسة مكررة و${svRemoved} مشرف مكرر`+
    (moved?`\nونقل ${moved} فعالية إلى السجل الأصلي.`:'')+`\n\nمتابعة؟`)){ render(); return; }
  await saveState();
  toast(`تم حذف ${schoolsRemoved} مدرسة و${svRemoved} مشرف مكرر`);
  render();
}
/* ══════════════════════════════════════════════════════════════════
   أدوات النسخ الاحتياطي والاسترجاع
   ══════════════════════════════════════════════════════════════════ */
function backupInfo(){
  try{
    const last = localStorage.getItem('backup_last');
    const prev = localStorage.getItem('backup_prev');
    const at   = localStorage.getItem('backup_at');
    const sum = s => { try{ const o=JSON.parse(s); return `${(o.orders||[]).length} فعالية · ${(o.schools||[]).length} جهة · ${(o.trainers||[]).length} مقدّم`; }catch(e){ return 'غير صالحة'; } };
    return { last, prev, at, lastSum: last?sum(last):null, prevSum: prev?sum(prev):null };
  }catch(e){ return {}; }
}
/* تنزيل نسخة احتياطية كاملة كملف JSON */
function downloadBackup(){ return backupNow(); }
function downloadBackupFile(){
  try{
    const src = __archMode ? Object.assign({}, state, {orders: __archMode.savedOrders, auditLog: __archMode.savedAudit}) : state;
    const blob = new Blob([JSON.stringify(src, null, 2)], {type:'application/json'});
    try{ localStorage.setItem('backup_dl_at', new Date().toISOString()); }catch(e){}
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `نسخة-احتياطية-${todayStr()}.json`;
    a.click(); URL.revokeObjectURL(a.href);
    toast('تم تنزيل النسخة الاحتياطية');
  }catch(e){ toast('تعذّر التنزيل: '+e.message); }
}
/* استرجاع من ملف JSON */
function restoreFromFile(file){
  if(!file) return;
  const rd = new FileReader();
  rd.onload = async ()=>{
    try{
      const data = JSON.parse(rd.result);
      if(!data || !Array.isArray(data.orders)) throw new Error('الملف لا يحتوي بيانات النظام');
      if(!confirm(`سيتم استبدال البيانات الحالية بـ:\n\n${(data.orders||[]).length} فعالية\n${(data.schools||[]).length} جهة\n${(data.trainers||[]).length} مقدّم\n\nمتابعة؟`)) return;
      state = data; __readFailed = false;
      await flushSave(); toast('تم الاسترجاع بنجاح'); render();
    }catch(e){ alert('تعذّر قراءة الملف: '+e.message); }
  };
  rd.readAsText(file);
}
/* استرجاع من النسخة المحلية داخل المتصفح */
async function restoreLocal(which){
  const info = backupInfo();
  const raw = which==='prev' ? info.prev : info.last;
  if(!raw){ toast('لا توجد نسخة محفوظة في هذا المتصفح'); return; }
  try{
    const data = JSON.parse(raw);
    if(!confirm(`استرجاع النسخة (${which==='prev'?'السابقة':'الأخيرة'}):\n\n${which==='prev'?info.prevSum:info.lastSum}\n\nمتابعة؟`)) return;
    state = data; __readFailed = false;
    await flushSave(); toast('تم الاسترجاع'); render();
  }catch(e){ alert('النسخة غير صالحة: '+e.message); }
}
/* ══════════════════════════════════════════════════════════════════
   استرجاع السجلات المفقودة بالدمج (لا يمسح شيئًا)
   ──────────────────────────────────────────────────────────────────
   للحالة التي تُدخل فيها بيانات على جهاز ثم لا تظهر لأن جهازًا آخر
   كتب نسخة أقدم فوقها. النسخة الاحتياطية المحلية في ذلك الجهاز
   ما زالت تحملها، فنُضيف منها ما هو مفقود فقط.
   ══════════════════════════════════════════════════════════════════ */
const RECOVER_COLLECTIONS = ['orders','schools','trainers','users','fields','programTypes',
  'placeTypes','venues','adminRequestsList','trainerRequests','quranActivities','tasks'];
const RECOVER_LABEL = { orders:'فعالية', schools:'جهة/مدرسة', trainers:'مقدّم مبادرة',
  users:'مستخدم', fields:'مجال', programTypes:'مسار', placeTypes:'نوع مكان', venues:'مكان تنفيذ',
  adminRequestsList:'طلب إداري', trainerRequests:'طلب مقدّم', quranActivities:'نشاط قرآني', tasks:'مهمة' };

/* يحسب ما هو موجود في المصدر وغائب عن الحالة الحالية */
function recoverDiff(source){
  const out = { total:0, byColl:{}, records:{} };
  if(!source || typeof source !== 'object') return out;
  RECOVER_COLLECTIONS.forEach(k=>{
    const src = Array.isArray(source[k]) ? source[k] : [];
    if(!src.length) return;
    const have = new Set((Array.isArray(state[k])?state[k]:[]).map(x=>x && x.id).filter(Boolean));
    const miss = src.filter(x=>x && x.id && !have.has(x.id));
    if(miss.length){ out.byColl[k] = miss.length; out.records[k] = miss; out.total += miss.length; }
  });
  /* مشرفون مفقودون داخل مدارس موجودة */
  const svMiss = [];
  (Array.isArray(source.schools)?source.schools:[]).forEach(ss=>{
    const cur = (state.schools||[]).find(x=>x.id===ss.id);
    if(!cur) return;   // المدرسة نفسها مفقودة → تُستعاد كاملة أعلاه
    const have = new Set((cur.supervisors||[]).map(v=>v && v.id).filter(Boolean));
    (ss.supervisors||[]).forEach(v=>{ if(v && v.id && !have.has(v.id)) svMiss.push({schoolId:ss.id, sv:v}); });
  });
  if(svMiss.length){ out.supervisors = svMiss; out.byColl.__sv = svMiss.length; out.total += svMiss.length; }
  return out;
}

function recoverSummary(d){
  if(!d.total) return 'لا يوجد أي سجل مفقود — كل ما في النسخة موجود بالنظام.';
  const lines = Object.keys(d.byColl).map(k=>{
    const lbl = k==='__sv' ? 'مشرف' : (RECOVER_LABEL[k]||k);
    return '• ' + d.byColl[k] + ' ' + lbl;
  });
  return lines.join('\n');
}

/* يطبّق الاسترجاع فعليًا */
async function recoverApply(d){
  if(!d.total) return 0;
  Object.keys(d.records||{}).forEach(k=>{
    if(!Array.isArray(state[k])) state[k] = [];
    d.records[k].forEach(r=>state[k].push(r));
  });
  (d.supervisors||[]).forEach(({schoolId, sv})=>{
    const sc = (state.schools||[]).find(x=>x.id===schoolId);
    if(sc){ sc.supervisors = sc.supervisors || []; sc.supervisors.push(sv); }
  });
  /* أعلى رقم تسلسلي حتى لا تتكرر أرقام التكليف */
  const maxSerial = (state.orders||[]).reduce((m,o)=>Math.max(m, Number(o.serial)||0), 0);
  if(maxSerial >= Number(state.nextSerial||0)) state.nextSerial = maxSerial + 1;
  __readFailed = false;
  await flushSave();
  return d.total;
}

/* من النسخة المحلية في هذا المتصفح */
async function recoverFromLocal(which){
  const info = backupInfo();
  const raw = which==='prev' ? info.prev : info.last;
  if(!raw){ toast('لا توجد نسخة محفوظة في هذا المتصفح'); return; }
  let src = null;
  try{ src = JSON.parse(raw); }catch(e){ alert('النسخة غير صالحة: '+e.message); return; }
  const d = recoverDiff(src);
  if(!d.total){ alert('النسخة ' + (which==='prev'?'السابقة':'الأخيرة') + ' لا تحتوي أي سجل مفقود.\n\nكل ما فيها موجود بالنظام.'); return; }
  if(!confirm('سيتم استرجاع السجلات المفقودة التالية وإضافتها للنظام\n(لن يُحذف أو يُستبدل أي شيء موجود):\n\n'
    + recoverSummary(d) + '\n\nمتابعة؟')) return;
  const n = await recoverApply(d);
  toast('تم استرجاع ' + n + ' سجلًا مفقودًا');
  render();
}

/* من ملف نسخة احتياطية */
function recoverFromFile(file){
  if(!file) return;
  const rd = new FileReader();
  rd.onload = async ()=>{
    let src = null;
    try{ src = JSON.parse(rd.result); }catch(e){ alert('تعذّر قراءة الملف: '+e.message); return; }
    const d = recoverDiff(src);
    if(!d.total){ alert('هذا الملف لا يحتوي أي سجل مفقود — كل ما فيه موجود بالنظام.'); return; }
    if(!confirm('سيتم استرجاع السجلات المفقودة التالية من الملف\n(لن يُحذف أو يُستبدل أي شيء موجود):\n\n'
      + recoverSummary(d) + '\n\nمتابعة؟')) return;
    const n = await recoverApply(d);
    toast('تم استرجاع ' + n + ' سجلًا مفقودًا');
    render();
  };
  rd.readAsText(file);
}

/* فحص تشخيصي: هل بيانات اليوم موجودة؟ */
function diagnoseToday(){
  const today = todayStr();
  const orders = state.orders || [];
  const madeToday = orders.filter(o=>String(o.createdAt||'').slice(0,10) === today);
  const forToday  = orders.filter(o=>o.date === today && isLiveOrder(o));
  const info = backupInfo();
  let bkLine = 'لا توجد نسخة محلية في هذا المتصفح.';
  if(info.last){
    try{
      const b = JSON.parse(info.last);
      const bToday = (b.orders||[]).filter(o=>String(o.createdAt||'').slice(0,10)===today).length;
      const d = recoverDiff(b);
      bkLine = 'النسخة المحلية الأخيرة: ' + (b.orders||[]).length + ' فعالية'
        + (info.at ? ' — حُفظت ' + fmtDate(String(info.at).slice(0,10)) + ' ' + String(info.at).slice(11,16) : '')
        + '\n   منها ' + bToday + ' أُنشئت اليوم'
        + '\n   ' + (d.total ? '⚠ تحتوي ' + d.total + ' سجلًا مفقودًا من النظام — يمكن استرجاعها' : '✅ لا تحتوي أي سجل مفقود');
    }catch(e){ bkLine = 'النسخة المحلية غير صالحة.'; }
  }
  const lines = [
    'تشخيص بيانات اليوم — ' + fmtDate(today),
    '',
    'في قاعدة البيانات الآن:',
    '   • ' + orders.length + ' فعالية إجمالًا',
    '   • ' + madeToday.length + ' فعالية أُنشئت اليوم',
    '   • ' + forToday.length + ' فعالية تاريخها اليوم',
    '   • ' + (state.schools||[]).length + ' جهة · ' + (state.trainers||[]).length + ' مقدّم مبادرة',
    '',
    'حالة الاتصال والحفظ:',
    '   • القراءة: ' + (__readFailed ? '❌ فشلت — الحفظ متوقف' : '✅ ناجحة'),
    '   • المزامنة الحيّة: ' + (__liveUnsub ? '✅ مفعّلة' : '❌ متوقفة'),
    '   • آخر حفظ ناجح: ' + (syncState.lastAt ? new Date(syncState.lastAt).toLocaleTimeString('ar') : 'لا يوجد'),
    '',
    'النسخة الاحتياطية المحلية:',
    '   ' + bkLine,
  ];
  if(madeToday.length){
    lines.push('', 'الفعاليات المُنشأة اليوم:');
    madeToday.slice(0,15).forEach(o=>lines.push('   #' + (o.serial||'—') + ' — ' + (o.title||'بلا عنوان')));
    if(madeToday.length>15) lines.push('   ... و' + (madeToday.length-15) + ' أخرى');
  }
  alert(lines.join('\n'));
}

async function dedupeSchools(){
  const norm = s => (s||'').replace(/\s+/g,' ').trim();
  const seen = new Map(), dupes = [];
  (state.schools||[]).forEach(s=>{
    const k = norm(s.name);
    if(seen.has(k)) dupes.push({dup:s, keep:seen.get(k)});
    else seen.set(k, s);
  });
  if(!dupes.length){ toast('لا توجد مدارس مكررة'); return; }
  const list = dupes.map(d=>`• ${d.dup.name}`).join('\n');
  if(!confirm(`وُجدت ${dupes.length} مدرسة مكررة:\n\n${list}\n\nسيتم دمج فعالياتها ومشرفيها في السجل الأصلي ثم حذف المكرر. متابعة؟`)) return;
  let moved = 0;
  dupes.forEach(({dup, keep})=>{
    /* نقل المشرفين غير الموجودين */
    (dup.supervisors||[]).forEach(sv=>{
      const exists = (keep.supervisors||[]).some(k=>norm(k.name)===norm(sv.name));
      if(!exists){ keep.supervisors = keep.supervisors||[]; keep.supervisors.push(sv); }
    });
    /* تحويل الفعاليات للسجل الأصلي */
    (state.orders||[]).forEach(o=>{ if(o.schoolId===dup.id){ o.schoolId = keep.id; moved++; } });
    state.schools = state.schools.filter(s=>s.id!==dup.id);
  });
  await saveState();
  toast(`تم حذف ${dupes.length} مدرسة مكررة ونقل ${moved} فعالية`);
  render();
}
function quickAddSupervisorSettings(schoolId){
  const sch=state.schools.find(s=>s.id===schoolId);
  openModal('إضافة مشرف لمدرسة: '+sch.name, [
    {name:'name', label:'اسم المشرف', required:true},{name:'phone', label:'رقم الجوال'},{name:'email', label:'البريد الإلكتروني'},
  ], async v=>{ sch.supervisors.push({id:uid(), name:v.name, phone:v.phone, email:v.email}); await saveState(); render(); });
}
async function acceptTrainerRequest(id){
  const r = state.trainerRequests.find(x=>x.id===id); if(!r) return;
  r.status='accepted';
  const maxSerialThisYear = nextOrderSerial() - 1;
  const order = {
    id:uid(), serial: maxSerialThisYear+1, createdAt:Date.now(),
    title:r.title, fieldId: r.fieldId || (state.fields[0]?state.fields[0].id:''), participantsCount:r.participantsCount||'',
    date:r.date, timeFrom:r.timeFrom, timeTo:r.timeTo, programTypeId: r.programTypeId || (state.programTypes[0]?state.programTypes[0].id:''),
    schoolId:r.schoolId, supervisorId:'', trainerIds:[r.trainerId], requesterNote:r.note||'', adminNote:'مضاف من ترشيح مقدم فعالية',
    adminRequests:r.adminRequests||[], completionStatus:'', notDoneReason:'', supervisorRating:0, schoolRating:0, studentsRating:0, recommendSchool:'', evaluatedBy:'', status:'active'
  };
  state.orders.push(order);
  state.notifications.push({id:uid(), trainerId:r.trainerId, message:`تم قبول طلبك: ${r.title} — أضيف إلى برامجك المستقبلية.`, read:false, createdAt:Date.now()});
  await saveState(); toast('تم قبول الطلب وإضافته للبرامج'); render();
}
async function rejectTrainerRequest(id){
  const r = state.trainerRequests.find(x=>x.id===id); if(!r) return;
  r.status='rejected';
  state.notifications.push({id:uid(), trainerId:r.trainerId, message:`تم رفض طلبك: ${r.title}.`, read:false, createdAt:Date.now()});
  await saveState(); toast('تم رفض الطلب'); render();
}


/* ══════════════════════════════════════════════════════════════════
   سجل التعديلات — من فعل ماذا ومتى
   ══════════════════════════════════════════════════════════════════ */
const AUDIT_LABEL = { create:'إنشاء', edit:'تعديل', delete:'حذف', cancel:'إلغاء', uncancel:'تراجع عن الإلغاء',
  postpone:'ترحيل', status:'تغيير حالة الإنجاز', evaluate:'تقييم', duplicate:'نسخ', series:'سلسلة أسبوعية',
  move:'تعديل التاريخ', archive:'أرشفة' };
const AUDIT_TONE = { create:'ok', duplicate:'ok', series:'ok', move:'info', archive:'warn', edit:'info', status:'info', evaluate:'info',
  postpone:'warn', cancel:'warn', uncancel:'info', delete:'dan' };
const AUDIT_MAX = 1500;
function logAudit(action, o, note, noSave){
  try{
    if(!state) return;
    if(!Array.isArray(state.auditLog)) state.auditLog = [];
    state.auditLog.push({
      id: uid(), at: Date.now(), action,
      user: currentUser ? (currentUser.displayName || currentUser.username) : '—',
      orderId: o ? o.id : '', serial: o ? (o.serial||'') : '', title: o ? (o.title||'') : '',
      note: note || ''
    });
    if(state.auditLog.length > AUDIT_MAX) state.auditLog = state.auditLog.slice(-AUDIT_MAX);
    if(!noSave) saveState();
  }catch(e){ console.warn('audit', e); }
}
function auditCardHtml(){
  const list = (state.auditLog||[]).slice().sort((a,b)=>b.at-a.at);
  const rows = list.slice(0,150);
  const fmtAt = t => { const d=new Date(t); return `${fmtDate(dateToISO(d))} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
  return `<div class="card">
    <h2>${icon('history',15)} سجل التعديلات
      <span style="display:inline-flex;gap:6px;align-items:center;">
        <span class="helper">${list.length} عملية مسجّلة</span>
        <button class="icon-btn" onclick="exportAuditLog()" title="تنزيل Excel" aria-label="تنزيل Excel" style="width:28px;height:28px;padding:0;">${icon('sheet',14)}</button>
      </span></h2>
    ${rows.length ? `<div class="tbl-scroll" style="max-height:360px;overflow:auto;"><table class="set-table audit-tbl"><thead><tr>
      <th>الوقت</th><th>المستخدم</th><th>العملية</th><th>أمر التكليف</th><th style="text-align:right;">الفعالية</th><th style="text-align:right;">تفاصيل</th>
    </tr></thead><tbody>
      ${rows.map(r=>`<tr>
        <td style="direction:ltr;">${fmtAt(r.at)}</td>
        <td>${escapeHtml(r.user||'—')}</td>
        <td><span class="st st-${({ok:'done',info:'new',warn:'hold',dan:'late'})[AUDIT_TONE[r.action]]||'new'}">${escapeHtml(AUDIT_LABEL[r.action]||r.action)}</span></td>
        <td>${r.serial?`<span class="badge">${escapeHtml(String(r.serial))}</span>`:'—'}</td>
        <td style="text-align:right;">${r.orderId && state.orders.some(o=>o.id===r.orderId)
          ? `<a href="#" onclick="viewOrderReadOnly('${r.orderId}');return false;">${escapeHtml(r.title||'')}</a>` : escapeHtml(r.title||'')}</td>
        <td style="text-align:right;">${escapeHtml(r.note||'')}</td>
      </tr>`).join('')}
    </tbody></table></div>` : `<div class="empty-state">لا توجد عمليات مسجّلة بعد — يبدأ التسجيل من الآن</div>`}
  </div>`;
}
function exportAuditLog(){
  const list = (state.auditLog||[]).slice().sort((a,b)=>b.at-a.at);
  if(!list.length){ toast('السجل فارغ'); return; }
  exportToExcel('سجل_التعديلات.xlsx', ['الوقت','المستخدم','العملية','أمر التكليف','الفعالية','تفاصيل'],
    list.map(r=>[new Date(r.at).toLocaleString('ar-QA-u-nu-latn'), r.user, AUDIT_LABEL[r.action]||r.action, r.serial, r.title, r.note]),
    'سجل التعديلات');
}

