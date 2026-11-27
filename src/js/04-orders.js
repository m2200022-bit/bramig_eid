/* ============ Order Page (طلبات الفعاليات والمبادرات) ============ */
function getWeekBounds(d){
  const dt = new Date(d+'T00:00:00');
  const dow = dt.getDay(); // 0=Sun
  const start = new Date(dt); start.setDate(dt.getDate()-dow);
  const end = new Date(start); end.setDate(start.getDate()+6);
  return {start:dateToISO(start), end:dateToISO(end)};
}
function renderOrderPage(c){
  const today = todayStr();
  const {start:wkStart, end:wkEnd} = getWeekBounds(today);
  const activeOrders = state.orders.filter(o=>o.status!=='cancelled');
  const thisWeek = activeOrders.filter(o=>o.date>=wkStart && o.date<=wkEnd);
  const evaluatedThisWeek = thisWeek.filter(o=>o.completionStatus);
  const notEvaluatedToDate = activeOrders.filter(o=>o.date && o.date<today && !o.completionStatus);
  c.innerHTML = `
  <div class="orders-page">
  <div class="tabs" style="align-items:center;">
    <button class="tab-btn page-tabs-moved" id="tabNew">فعاليات ومبادرات جديدة</button>
    <button class="tab-btn page-tabs-moved" id="tabList">كل الطلبات</button>
    <button class="tab-btn page-tabs-moved" id="tabAdminDaily">الإداريات اليومية</button>
    <button class="tab-btn page-tabs-moved" id="tabSheet">تعديل سريع (جدول)</button>
    <span id="ordPageTitle" style="font-size:16px;font-weight:700;color:var(--maroon-800);white-space:nowrap;"></span>
    <span id="ordNoteBar" style="display:none;align-items:center;min-width:0;"></span>
    <div style="position:relative; margin-inline-start:auto;">
      <input id="ord_quickFind" placeholder="🔎 ابحث بالرقم أو العنوان أو المدرسة أو المقدّم..."
             style="width:320px; min-height:34px;" autocomplete="off">
      <div id="ord_quickFindRes" style="display:none; position:absolute; top:calc(100% + 4px); right:0; z-index:40;
           width:340px; max-height:260px; overflow:auto; background:#fff; border:1px solid var(--line);
           border-radius:10px; box-shadow:var(--shadow);"></div>
    </div>
  </div>
  <div id="orderSubContent"></div>
  <div class="stat-grid" style="margin:18px 0;">
    <div class="stat-box"><div class="num">${thisWeek.length}</div><div class="lbl">عدد الفعاليات خلال الأسبوع</div></div>
    <div class="stat-box"><div class="num">${evaluatedThisWeek.length}</div><div class="lbl">فعاليات قُيّمت خلال الأسبوع</div></div>
    <div class="stat-box"><div class="num">${notEvaluatedToDate.length}</div><div class="lbl">فعاليات لم تُقيَّم حتى تاريخه</div></div>
  </div>
  <div class="card">
    <h2>توزيع فعاليات مقدمي المبادرة هذا الأسبوع <span class="helper" style="color:#cfe0f2;">(${wkStart} إلى ${wkEnd} — تتحدث تلقائيًا كل أسبوع)</span></h2>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));">
      ${state.trainers.map(t=>{
        const list = thisWeek.filter(o=>(o.trainerIds||[]).includes(t.id));
        let hrs=0; list.forEach(o=>{ if(o.timeFrom&&o.timeTo){ const s=parseDT(o.date,o.timeFrom), e=parseDT(o.date,o.timeTo); if(s&&e) hrs+=Math.max(0,(e-s)/3600000)*daysCount(o.date,o.dateTo); } });
        /* أيام تنفيذه مرتّبة — كل يوم مربع قابل للنقر يفتح أمر التكليف */
        const dayMap = new Map();
        list.forEach(o=>{
          const s = o.date, e = orderEnd(o);
          if(!s) return;
          let cur = s, guard = 0;
          while(cur <= e && guard < 60){
            if(cur >= wkStart && cur <= wkEnd){
              const d = Number(cur.slice(8,10));
              if(!dayMap.has(d)) dayMap.set(d, o);
            }
            cur = addDaysISO(cur, 1); guard++;
          }
        });
        const days = Array.from(dayMap.entries()).sort((a,b)=>a[0]-b[0]);
        return `<div class="stat-box"><div style="font-weight:700;color:var(--maroon-800);margin-bottom:6px;">${escapeHtml(t.name)}</div>
          <div class="num">${list.length}</div><div class="lbl">عدد الفعاليات</div>
          <div style="margin-top:6px;font-size:13px;color:var(--muted-text);">${hrs.toFixed(1)} ساعة</div>
          ${days.length ? `<div class="day-chips">${days.map(([d,o])=>
            `<button type="button" class="day-chip" data-open="${o.id}"
              title="${escapeHtml(o.title)} — ${fmtDate(o.date)}">${d}</button>`).join('')}</div>` : ''}
        </div>`;
      }).join('') || `<div class="empty-state">لا يوجد مقدمو فعاليات</div>`}
    </div>
  </div>
  </div>`;
  /* النقر على يوم يفتح أمر التكليف */
  c.querySelectorAll('.day-chip[data-open]').forEach(b=>{
    b.onclick = ()=>viewOrderReadOnly(b.dataset.open);
  });
  const opt = document.getElementById('ordPageTitle');
  if(opt){
    const ed = editingOrderId ? state.orders.find(o=>o.id===editingOrderId) : null;
    opt.textContent = orderSubTab==='new'
      ? (ed ? 'تعديل فعاليات ومبادرات — رقم '+ed.serial : 'فعاليات ومبادرات')
      : '';
  }
  const qf = document.getElementById('ord_quickFind'), qfr = document.getElementById('ord_quickFindRes');
  /* بحث واحد في الصفحة: في قائمة الطلبات يكفي بحث الجدول (وCtrl+K للبحث الشامل) */
  if(qf && orderSubTab==='list'){ const tb = qf.closest('.tabs'); (tb||qf.parentElement).style.display='none'; }
  qf.addEventListener('input', ()=>{
    const q = qf.value.trim();
    if(!q){ qfr.style.display='none'; qfr.innerHTML=''; return; }
    /* تطبيع عربي ليطابق رغم اختلاف الهمزات والتاء المربوطة */
    const nz = s => String(s||'').replace(/[\u064B-\u0652\u0640]/g,'')
      .replace(/[أإآا]/g,'ا').replace(/[ىي]/g,'ي').replace(/ة/g,'ه')
      .replace(/\s+/g,' ').trim().toLowerCase();
    const nq = nz(q);
    const hits = state.orders.filter(o=>{
      if(String(o.serial).includes(q)) return true;
      const sc = state.schools.find(x=>x.id===o.schoolId);
      const sv = sc ? (sc.supervisors||[]).find(x=>x.id===o.supervisorId) : null;
      const trs = (o.trainerIds||[]).map(id=>{ const t=state.trainers.find(y=>y.id===id); return t?t.name:''; });
      const hay = nz([o.title, sc&&sc.name, sv&&sv.name, ...trs].filter(Boolean).join(' '));
      return hay.includes(nq);
    }).sort((a,b)=>b.serial-a.serial).slice(0,12);
    qfr.innerHTML = hits.length ? hits.map(o=>{
      const s = state.schools.find(x=>x.id===o.schoolId);
      return `<div class="qf-item" data-id="${o.id}" style="padding:8px 10px; cursor:pointer; border-bottom:1px solid var(--line);">
        <span class="badge">${o.serial}</span> <b>${escapeHtml(o.title)}</b>
        <div style="font-size:9pt;color:#777;">${fmtDate(o.date)}${s?' — '+escapeHtml(s.name):''}</div>
      </div>`;
    }).join('') : `<div style="padding:10px;color:#777;">لا توجد نتائج مطابقة</div>`;
    qfr.style.display='block';
    qfr.querySelectorAll('.qf-item').forEach(el=>{
      el.onmouseenter=()=>el.style.background='var(--maroon-50)';
      el.onmouseleave=()=>el.style.background='';
      el.onclick=()=>{ qfr.style.display='none'; editOrder(el.dataset.id); };
    });
  });
  document.addEventListener('click', e=>{ if(!qf.contains(e.target) && !qfr.contains(e.target)) qfr.style.display='none'; });
  document.getElementById('tabNew').onclick=()=>{orderSubTab='new'; editingOrderId=null; render();};
  document.getElementById('tabList').onclick=()=>{orderSubTab='list'; render();};
  document.getElementById('tabAdminDaily').onclick=()=>{orderSubTab='adminDaily'; render();};
  document.getElementById('tabSheet').onclick=()=>{orderSubTab='sheet'; render();};
  const sub = document.getElementById('orderSubContent');
  if(orderSubTab==='adminDaily'){
    renderAdminPage(sub);
    return;
  }
  if(orderSubTab==='sheet'){
    renderQuickEditSheet(sub);
    return;
  }
  if(orderSubTab==='list'){
    const _td0 = todayStr(), _all0 = state.orders||[];
    const _stOf = o => orderState(o, _td0).k;
    const _n = k => _all0.filter(o=>_stOf(o)===k).length;
    const _done0 = _n('done');
    if(window.__ordSt===undefined) window.__ordSt = '';
    const ORD_KPIS = [
      {k:'',     l:'إجمالي الطلبات', v:_all0.length, s:`${_all0.filter(isLiveOrder).length} سارية`, ic:'clipboard', ...PK_KC.all},
      {k:'new',  l:'قادمة', v:_n('new'), s:'لم يحن موعدها', ic:'calendar', ...PK_KC.new},
      {k:'run',  l:'قيد التنفيذ اليوم', v:_n('run'), s:fmtDate(_td0), ic:'activity', ...PK_KC.run},
      {k:'late', l:'بانتظار الإجراء', v:_n('late'), s:'مضى موعدها بلا تقييم', ic:'alert', ...PK_KC.late},
      {k:'done', l:'مكتملة', v:_done0, s:_all0.length?`${Math.round(_done0/_all0.length*100)}% من الإجمالي`:'—', ic:'checkCircle', ...PK_KC.done},
      {k:'off',  l:'مؤجّلة / ملغاة', v:_n('hold')+_n('draft'), s:`${_n('hold')} مؤجّلة · ${_n('draft')} ملغاة`, ic:'pause', ...PK_KC.off},
    ];
    sub.innerHTML = `${pkKpisHtml(ORD_KPIS, window.__ordSt, 'data-ordst')}
      <div class="pk-card" id="ordListCard">
      <div class="pk-head">
        <h2 class="pk-title">${icon('clipboard',18)} كل طلبات الفعاليات والمبادرات <span class="n" id="ord_count">0</span></h2>
        <span class="sp">
          <button class="pk-btn" type="button" onclick="currentPage='quickSheet';render();" title="تعديل الفعاليات في جدول">${icon('sheet',15)} تعديل سريع</button>
          <button class="pk-btn pri" type="button" id="ord_newBtn">${icon('plus',16)} طلب فعالية جديد</button>
        </span>
      </div>
      <div class="pk-toolbar ord-bar">
        <div class="pk-search ord-find">${icon('search',16)}
          <input id="ord_listFind" placeholder="ابحث بالرقم أو العنوان أو المدرسة أو المقدّم..." autocomplete="off" aria-label="بحث في الطلبات">
        </div>
        <div class="field"><label for="ord_filterKind">تصفية حسب</label>
          <select id="ord_filterKind" title="تصفية حسب">
            <option value="">تصفية حسب…</option>
            <option value="trainer">مقدم المبادرة</option>
            <option value="field">مجال المبادرة</option>
            <option value="path">مسار المبادرة</option>
            <option value="completion">الإنجاز</option>
            <option value="status">الحالة</option>
          </select>
        </div>
        <div class="field" id="ord_filterValWrap" style="display:none;"><label for="ord_filterVal">القيمة</label>
          <select id="ord_filterVal" title="القيمة"></select>
        </div>
        <div class="field"><label for="ord_sort">الفرز</label>
          <select id="ord_sort" title="الفرز">
            <option value="soon">الأقرب للتنفيذ</option>
            <option value="dateAsc">التاريخ (الأقدم أولًا)</option>
            <option value="dateDesc">التاريخ (الأحدث أولًا)</option>
            <option value="serialDesc">رقم التكليف (تنازلي)</option>
            <option value="serialAsc">رقم التكليف (تصاعدي)</option>
          </select>
        </div>
        <button class="pk-btn ic" type="button" id="ord_clearFilter" title="مسح البحث والتصفية" aria-label="مسح البحث والتصفية">${icon('x',15)}</button>
        <span class="pk-sep"></span>
        <span class="pk-seg view-seg" role="tablist" aria-label="طريقة العرض">
          <button type="button" data-ov="list" class="${ordersView==='list'?'on':''}">${icon('list',14)} قائمة</button>
          <button type="button" data-ov="cal" class="${ordersView==='cal'?'on':''}">${icon('calendar',14)} تقويم</button>
        </span>
        <button class="pk-btn" type="button" onclick="openBookingInbox()" title="طلبات الحجز من بوابة الجهات">${icon('globe',15)} طلبات الحجز <span class="bk-badge" ${typeof __bkNew!=='undefined'&&__bkNew.length?'':'hidden'}>${typeof __bkNew!=='undefined'?__bkNew.length:0}</span></button>
        <button class="pk-btn" type="button" onclick="openYearArchive()" title="الأعوام الدراسية المؤرشفة">${icon('inbox',15)} الأرشيف</button>
        <button class="pk-btn" type="button" id="ord_exportBtn" aria-haspopup="menu">${icon('download',15)} طباعة وتصدير ${icon('chevronDown',13,'caret')}</button>
        <button class="pk-btn ic" type="button" id="ord_stageBtn" title="فرز حسب نوع المدرسة" aria-label="فرز حسب نوع المدرسة">${icon('school',16)}</button>
      </div>
      <div id="ord_listResult"></div></div>`;
    document.getElementById('ord_newBtn').onclick = ()=>{ currentPage='newOrder'; editingOrderId=null; render(); };
    sub.querySelectorAll('[data-ordst]').forEach(b=>b.onclick = ()=>{
      window.__ordSt = (window.__ordSt===b.dataset.ordst) ? '' : b.dataset.ordst;
      sub.querySelectorAll('[data-ordst]').forEach(x=>{ const on = x.dataset.ordst===window.__ordSt; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      window.__ordPage = 1; drawFiltered();
    });
    document.getElementById('ord_exportBtn').onclick = e=>{
      const fkv = (document.getElementById('ord_filterKind')||{}).value, fvv = (document.getElementById('ord_filterVal')||{}).value;
      const wantCx = window.__ordSt==='off' || (fkv==='status' && fvv==='cancelled') || (fkv==='completion' && fvv==='الغيت');
      const L = (window.__ordLastList||[]).filter(o=>wantCx || isLiveOrder(o));
      const desc = ordListDesc();
      pkMenu(e.currentTarget, [
        {hd:`القائمة الحالية — ${L.length} ${eventWord(L.length)}`},
        {ic:'printer', l:'طباعة القائمة', run:()=>ordPrintList(L, desc)},
        {ic:'download', l:'تنزيل PDF', hint:'حفظ كـ PDF', run:()=>ordPrintList(L, desc)},
        {ic:'sheet', l:'تصدير Excel', run:()=>ordExcelList(L, desc)},
        ...(()=>{ const A = (state.orders||[]).filter(isLiveOrder).sort((x,y)=>String(x.date||'').localeCompare(String(y.date||''))||(x.serial-y.serial));
          if(A.length===L.length) return [];
          return [{hd:`كل الطلبات السارية (دون الملغاة) — ${A.length} ${eventWord(A.length)}`},
            {ic:'printer', l:'طباعة كل الطلبات', run:()=>ordPrintList(A, 'كل الطلبات')},
            {ic:'download', l:'تنزيل PDF للكل', hint:'حفظ كـ PDF', run:()=>ordPrintList(A, 'كل الطلبات')},
            {ic:'sheet', l:'تصدير Excel للكل', run:()=>ordExcelList(A, 'كل الطلبات')}]; })(),
        '-', {hd:'سجل الطلبات الملغاة والمؤجّلة'},
        {ic:'printer', l:'طباعة السجل', run:()=>cxPpRegister('print')},
        {ic:'sheet', l:'السجل Excel', run:()=>cxPpRegister('xls')},
      ]);
    };
    function ordListDesc(){
      const parts = [];
      const st = ORD_KPIS.find(k=>k.k===window.__ordSt); if(st && st.k) parts.push(st.l);
      const fk = document.getElementById('ord_filterKind'), fv = document.getElementById('ord_filterVal');
      if(fk.value && fv.value) parts.push(`${fk.selectedOptions[0].textContent}: ${fv.selectedOptions[0].textContent}`);
      const q = (document.getElementById('ord_listFind').value||'').trim(); if(q) parts.push(`بحث: ${q}`);
      return parts.join(' · ');
    }

    function optionsForKind(kind){
      if(kind==='trainer') return state.trainers.map(t=>({v:t.id, l:t.name}));
      if(kind==='field') return state.fields.map(f=>({v:f.id, l:f.name}));
      if(kind==='path') return state.programTypes.map(p=>({v:p.id, l:p.name}));
      if(kind==='completion') return [{v:'تم',l:'تم الإنجاز'},{v:'لم يتم',l:'لم يتم الإنجاز'},{v:'الغيت',l:'أُلغيت'},{v:'المشرف لا يرد',l:'المشرف لا يرد'},{v:'__pending',l:'لم تنجز بعد'}];
      if(kind==='status') return [{v:'active',l:'نشطة'},{v:'cancelled',l:'ملغاة'},{v:'postponed',l:'مؤجّلة'}];
      return [];
    }
    document.getElementById('ord_filterKind').addEventListener('change', e=>{
      const kind=e.target.value, wrap=document.getElementById('ord_filterValWrap'), sel=document.getElementById('ord_filterVal');
      if(!kind){ wrap.style.display='none'; sel.innerHTML=''; drawFiltered(); return; }
      // تُبنى قائمة القيم عند الطلب فقط لتخفيف الواجهة
      sel.innerHTML = '<option value="">الكل</option>' + optionsForKind(kind).map(o=>`<option value="${escapeHtml(o.v)}">${escapeHtml(o.l)}</option>`).join('');
      wrap.style.display=''; drawFiltered();
    });
    document.getElementById('ord_filterVal').addEventListener('change', ()=>drawFiltered());
    document.getElementById('ord_clearFilter').onclick=()=>{
      document.getElementById('ord_filterKind').value='';
      document.getElementById('ord_filterValWrap').style.display='none';
      document.getElementById('ord_filterVal').innerHTML='';
      const _lf=document.getElementById('ord_listFind'); if(_lf) _lf.value='';
      drawFiltered();
    };
    function drawFiltered(){
      const q = (document.getElementById('ord_listFind')||{}).value || '';
      const kind = document.getElementById('ord_filterKind').value;
      const val  = document.getElementById('ord_filterVal').value || '';
      const trainerFilter    = kind==='trainer' ? val : '';
      const fieldFilter      = kind==='field' ? val : '';
      const pathFilter       = kind==='path' ? val : '';
      const completionFilter = kind==='completion' ? val : '';
      const statusFilter     = kind==='status' ? val : '';
      const sortMode = (document.getElementById('ord_sort')||{}).value || 'soon';
      const today = todayStr();
      let list = state.orders.slice().sort((a,b)=>{
        if(sortMode==='dateAsc')   return (a.date||'').localeCompare(b.date||'');
        if(sortMode==='dateDesc')  return (b.date||'').localeCompare(a.date||'');
        if(sortMode==='serialAsc') return (a.serial||0)-(b.serial||0);
        if(sortMode==='serialDesc')return (b.serial||0)-(a.serial||0);
        /* الأقرب للتنفيذ: القادمة أولًا بترتيب تصاعدي، ثم الماضية بالأحدث */
        const aF = (a.date||'') >= today, bF = (b.date||'') >= today;
        if(aF !== bF) return aF ? -1 : 1;
        return aF ? (a.date||'').localeCompare(b.date||'')
                  : (b.date||'').localeCompare(a.date||'');
      });
      /* بحث موحّد: الرقم أو العنوان أو المدرسة أو المشرف أو المقدّم */
      if(q.trim()){
        const nz = s => String(s||'').replace(/[\u064B-\u0652\u0640]/g,'')
          .replace(/[أإآا]/g,'ا').replace(/[ىي]/g,'ي').replace(/ة/g,'ه')
          .replace(/\s+/g,' ').trim().toLowerCase();
        const nq = nz(q);
        list = list.filter(o=>{
          if(String(o.serial).includes(q.trim())) return true;
          const sc = state.schools.find(x=>x.id===o.schoolId);
          const sv = sc ? (sc.supervisors||[]).find(x=>x.id===o.supervisorId) : null;
          const trs = (o.trainerIds||[]).map(id=>{ const t=state.trainers.find(y=>y.id===id); return t?t.name:''; });
          return nz([o.title, sc&&sc.name, sv&&sv.name, ...trs].filter(Boolean).join(' ')).includes(nq);
        });
      }
      if(trainerFilter){ list = list.filter(o=>(o.trainerIds||[]).includes(trainerFilter)); }
      if(fieldFilter){ list = list.filter(o=>o.fieldId===fieldFilter); }
      if(pathFilter){ list = list.filter(o=>o.programTypeId===pathFilter); }
      if(completionFilter){
        list = list.filter(o=> completionFilter==='__pending' ? !o.completionStatus : o.completionStatus===completionFilter);
      }
      if(statusFilter){ list = list.filter(o=>(o.status||'active')===statusFilter); }
      if(window.__ordSt){ list = list.filter(o=>{ const k = orderState(o, today).k;
        return window.__ordSt==='off' ? (k==='hold'||k==='draft') : k===window.__ordSt; }); }
      window.__ordLastList = list;
      const cntEl = document.getElementById('ord_count'); if(cntEl) cntEl.textContent = list.length;
      const box = document.getElementById('ord_listResult');
      if(ordersView==='cal'){ renderOrdersCalendar(box, list); return; }
      /* إعادة الترقيم للصفحة الأولى عند تغيّر البحث أو التصفية */
      const sig = [q, kind, val, sortMode, window.__ordSt].join('|');
      if(sig !== window.__ordSig){ window.__ordSig = sig; window.__ordPage = 1; }
      if(!window.__ordPer){ try{ window.__ordPer = Number(localStorage.getItem('ordPer'))||25; }catch(e){ window.__ordPer = 25; } }
      const per = window.__ordPer, pages = Math.max(1, Math.ceil(list.length/per));
      window.__ordPage = Math.min(Math.max(1, window.__ordPage||1), pages);
      box.innerHTML = ordersTableHtml(list, 'otbl_order_list', {page:window.__ordPage, per});
      if(!box.__pkBound){ box.__pkBound = true; bindOrdersTable(box, ()=>render()); }
      pkBindPager(box, p=>{ window.__ordPage = p; drawFiltered();
          const cd = document.getElementById('ordListCard'); if(cd) cd.scrollIntoView({block:'start', behavior:'smooth'}); },
        n=>{ window.__ordPer = n; window.__ordPage = 1; try{ localStorage.setItem('ordPer', n); }catch(e){} drawFiltered(); });
    }
    { const sb = document.getElementById('ord_stageBtn'); if(sb) sb.onclick = ()=>{
        const L = (window.__ordLastList||[]).filter(o=>isLiveOrder(o) && o.date);
        if(!L.length){ toast('لا توجد فعاليات في القائمة'); return; }
        const ds = L.map(o=>o.date).sort(); openStageModal(L, ds[0], L.map(o=>orderEnd(o)).sort().pop());
      }; }
    sub.querySelectorAll('[data-ov]').forEach(b=>b.onclick=()=>{
      ordersView = b.dataset.ov; try{ localStorage.setItem('ordersView', ordersView); }catch(e){}
      sub.querySelectorAll('[data-ov]').forEach(x=>x.classList.toggle('on', x===b));
      const srt = document.getElementById('ord_sort'); if(srt) srt.closest('.field').style.display = ordersView==='cal'?'none':'';
      drawFiltered();
    });
    { const srt = document.getElementById('ord_sort'); if(srt && ordersView==='cal') srt.closest('.field').style.display='none'; }
    const _lf2=document.getElementById('ord_listFind'); if(_lf2) _lf2.addEventListener('input', drawFiltered);
    document.getElementById('ord_sort').addEventListener('change', drawFiltered);
    drawFiltered();
    return;
  }
  renderOrderForm(sub);
}

/* ============ جدول تعديل سريع (بشكل إكسل) ============ */
function renderQuickEditSheet(sub){
  sub.innerHTML = `<div class="card">
    <h2>تعديل سريع (جدول)</h2>
    <div class="helper" style="margin-bottom:10px;">عدّل أي خلية مباشرة وسيُحفظ التغيير تلقائيًا فور الخروج منها. حدّد عدة فعاليات بمربعات الاختيار لتعديل مجال المبادرة لها دفعة واحدة.</div>
    <details style="margin-bottom:12px;border:1.5px solid var(--line);border-radius:10px;padding:10px;">
      <summary style="cursor:pointer;font-weight:700;color:var(--maroon-800);">📋 لصق مدخلات من إكسل أو نص — اضغط للفتح</summary>
      <div class="helper" style="margin:8px 0;">
        انسخ الصفوف من إكسل والصقها هنا مباشرة. ترتيب الأعمدة:<br>
        <b>عنوان المبادرة | التاريخ | من الساعة | إلى الساعة | اسم المدرسة | عدد المستهدفين | مسار البرنامج | المدربون | اسم المشرف | رقم الجوال</b><br>
        الأعمدة بعد "اسم المدرسة" اختيارية. التاريخ بصيغة YYYY-MM-DD. المدربون: <code>الاسم:الهاتف، الاسم:الهاتف</code>
      </div>
      <textarea id="qs_paste" placeholder="الصق الصفوف هنا..." style="min-height:120px;font-family:monospace;direction:ltr;text-align:left;"></textarea>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center;">
        <button class="btn btn-primary" id="qs_pasteParse">🔍 معاينة</button>
        <button class="icon-btn rect" id="qs_pasteApply" disabled>✅ إضافة للجدول</button>
        <label class="checkbox-chip"><input type="checkbox" id="qs_pasteDone"> تعليمها كـ "تم الإنجاز"</label>
      </div>
      <div id="qs_pastePreview" style="margin-top:10px;"></div>
    </details>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr));margin-bottom:10px;">
      <div class="field"><label>🔎 أمر التكليف</label><input id="qs_serial" type="number" lang="en" placeholder="رقم..."></div>
      <div class="field"><label>🔎 العنوان / المدرسة</label><input id="qs_search" placeholder="اكتب للبحث..."></div>
      <div class="field"><label>مجال المبادرة</label><select id="qs_fFilter"><option value="">الكل</option>${state.fields.map(f=>`<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('')}</select></div>
      <div class="field"><label>مسار المبادرة</label><select id="qs_pFilter"><option value="">الكل</option>${state.programTypes.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select></div>
      <div class="field"><label>مكان التنفيذ</label><select id="qs_placeFilter"><option value="">الكل</option>${state.placeTypes.map(p=>`<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('')}</select></div>
      <div class="field"><label>المرحلة الدراسية</label><select id="qs_levelFilter"><option value="">الكل</option>${LOCATION_TYPES.map(l=>`<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join('')}</select></div>
      <div class="field"><label>🔍 بحث عن الفراغات في</label><select id="qs_emptyFilter">
        <option value="">— بدون —</option>
        <option value="fieldId">مجال المبادرة</option>
        <option value="programTypeId">مسار المبادرة</option>
        <option value="date">تاريخ المبادرة من</option>
        <option value="dateTo">تاريخ الانتهاء</option>
        <option value="timeFrom">وقت المبادرة من</option>
        <option value="timeTo">وقت المبادرة إلى</option>
        <option value="participantsCount">عدد المستهدفين</option>
        <option value="title">عنوان المبادرة</option>
        <option value="placeType">مكان التنفيذ</option>
        <option value="schoolId">مكان المبادرة</option>
        <option value="supervisorId">المشرف</option>
        <option value="supPhone">رقم الجوال</option>
        <option value="trainerIds">المدربون</option>
      </select></div>
    </div>
    <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center; margin-bottom:10px;">
      <select id="qs_bulkField" disabled style="width:auto;">
        <option value="">-- تعديل مجال المبادرة للمحدد --</option>
        ${state.fields.map(f=>`<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('')}
      </select>
      <button class="icon-btn rect" id="qs_bulkApply" disabled data-tip="تطبيق المجال" title="تطبيق المجال">✅</button>
      <span style="border-right:1.5px solid var(--line); height:24px; margin:0 4px;"></span>
      <select id="qs_bulkPath" disabled style="width:auto;">
        <option value="">-- تعديل مسار المبادرة للمحدد --</option>
        ${state.programTypes.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}
      </select>
      <button class="icon-btn rect" id="qs_bulkApplyPath" disabled data-tip="تطبيق المسار" title="تطبيق المسار">✅</button>
      <span style="border-right:1.5px solid var(--line); height:24px; margin:0 4px;"></span>
      <button class="icon-btn rect danger" id="qs_bulkDelete" disabled data-tip="إلغاء المحدد (يبقى برقمه)" title="إلغاء المحدد (يبقى برقمه)" aria-label="إلغاء المحدد">${icon('ban',17)}</button>
    </div>
    <div id="qs_tableWrap" class="tbl-scroll"></div>
  </div>`;

  const selectedIds = new Set();

  /* ===== لصق مدخلات من إكسل/نص ===== */
  let pastedRows = [];
  function parsePasted(){
    const raw = document.getElementById('qs_paste').value;
    const lines = raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    const out = [];
    lines.forEach(line=>{
      // يفصل بالتاب (اللصق من إكسل) وإلا بالفاصلة
      const cells = (line.includes('\t') ? line.split('\t') : line.split(/[,،]/)).map(c=>c.trim());
      const title = cells[0]||'';
      if(!title) return;
      // تجاهل صف العناوين إن لُصق معها
      if(title==='عنوان المبادرة') return;
      out.push({
        title, date:cells[1]||'', timeFrom:cells[2]||'', timeTo:cells[3]||'',
        schoolName:cells[4]||'', participantsCount:cells[5]||'', ptypeName:cells[6]||'',
        trainersRaw:cells[7]||'', supName:cells[8]||'', supPhone:cells[9]||''
      });
    });
    return out;
  }
  document.getElementById('qs_pasteParse').onclick = ()=>{
    pastedRows = parsePasted();
    const box = document.getElementById('qs_pastePreview');
    if(!pastedRows.length){
      box.innerHTML = `<div class="empty-state">لم يتم التعرّف على أي صف — تأكد من اللصق ومن ترتيب الأعمدة</div>`;
      document.getElementById('qs_pasteApply').disabled = true;
      return;
    }
    box.innerHTML = `<div class="helper" style="margin-bottom:6px;">تم التعرّف على <b>${pastedRows.length}</b> صفًا — راجعها ثم اضغط "إضافة للجدول":</div>
      <div class="tbl-scroll"><table><thead><tr><th>العنوان</th><th>التاريخ</th><th>من</th><th>إلى</th><th>المدرسة</th><th>المستهدفون</th><th>المسار</th><th>المدربون</th><th>المشرف</th><th>الجوال</th></tr></thead><tbody>
        ${pastedRows.map(r=>`<tr><td>${escapeHtml(r.title)}</td><td>${escapeHtml(r.date)}</td><td>${escapeHtml(r.timeFrom)}</td><td>${escapeHtml(r.timeTo)}</td><td>${escapeHtml(r.schoolName)}</td><td>${escapeHtml(r.participantsCount)}</td><td>${escapeHtml(r.ptypeName)}</td><td>${escapeHtml(r.trainersRaw)}</td><td>${escapeHtml(r.supName)}</td><td>${escapeHtml(r.supPhone)}</td></tr>`).join('')}
      </tbody></table></div>`;
    document.getElementById('qs_pasteApply').disabled = false;
  };
  document.getElementById('qs_pasteApply').onclick = async ()=>{
    if(!pastedRows.length){ toast('اضغط "معاينة" أولًا'); return; }
    const markDone = document.getElementById('qs_pasteDone').checked;
    const normT = s => (s||'').toString().trim().replace(/\s+/g,' ');
    let added=0, skipped=0;
    pastedRows.forEach(r=>{
      let sch = state.schools.find(s=>s.name===r.schoolName);
      // منع التكرار: نفس العنوان والتاريخ والمدرسة
      if(state.orders.some(o=>normT(o.title)===normT(r.title) && o.date===r.date && sch && o.schoolId===sch.id)){ skipped++; return; }
      if(!sch && r.schoolName){ sch={id:uid(), name:r.schoolName, level:'غير ذلك', email:'', supervisors:[]}; state.schools.push(sch); }

      let programTypeId = state.programTypes[0]?state.programTypes[0].id:'';
      if(r.ptypeName){
        let pt = state.programTypes.find(p=>p.name===r.ptypeName);
        if(!pt){ pt={id:uid(), name:r.ptypeName}; state.programTypes.push(pt); }
        programTypeId = pt.id;
      }
      const trainerIds = [];
      if(r.trainersRaw){
        r.trainersRaw.split(/[،,]/).map(s=>s.trim()).filter(Boolean).forEach(entry=>{
          const [nm, ph] = entry.split(':').map(s=>s?s.trim():'');
          const name = nm||entry;
          let tr = state.trainers.find(t=> (ph && t.phone===ph) || t.name===name);
          if(!tr){ tr={id:uid(), name, phone:ph||''}; state.trainers.push(tr); }
          trainerIds.push(tr.id);
        });
      }
      let supervisorId='';
      if(sch && (r.supName || r.supPhone)){
        let sv = sch.supervisors.find(x=>(r.supPhone && x.phone===r.supPhone) || (r.supName && x.name===r.supName));
        if(!sv){ sv={id:uid(), name:r.supName||'مشرف (بدون اسم)', phone:r.supPhone, email:''}; sch.supervisors.push(sv); }
        supervisorId = sv.id;
      }
      const yr = (r.date || todayStr()).slice(0,4);
      state.orders.push({
        id:uid(), serial:nextOrderSerial(), createdAt:Date.now(), title:r.title,
        fieldId: state.fields[0]?state.fields[0].id:'', participantsCount:r.participantsCount,
        date:r.date, dateTo:r.date, timeFrom:r.timeFrom, timeTo:r.timeTo, programTypeId,
        schoolId: sch?sch.id:'', supervisorId, trainerIds, requesterNote:'', adminNote:'مُدخل باللصق',
        adminRequests:[], completionStatus: markDone?'تم':'', notDoneReason:'', supervisorRating:0,
        schoolRating:0, studentsRating:0, recommendSchool:'', evaluatedBy:'', status:'active'
      });
      added++;
    });
    await saveState();
    toast(`تمت إضافة ${added} فعالية${skipped?` — تم تجاهل ${skipped} مكررة`:''}`);
    document.getElementById('qs_paste').value=''; document.getElementById('qs_pastePreview').innerHTML='';
    pastedRows=[]; document.getElementById('qs_pasteApply').disabled=true;
    draw();
  };
  function updateBulkToolbar(){
    document.getElementById('qs_bulkField').disabled = selectedIds.size<1;
    document.getElementById('qs_bulkApply').disabled = selectedIds.size<1;
    document.getElementById('qs_bulkPath').disabled = selectedIds.size<1;
    document.getElementById('qs_bulkApplyPath').disabled = selectedIds.size<1;
    document.getElementById('qs_bulkDelete').disabled = selectedIds.size<1;
  }
  document.getElementById('qs_bulkDelete').onclick = async ()=>{
    if(selectedIds.size<1){ toast('حدد فعالية واحدة على الأقل'); return; }
    /* لا حذف: تُلغى المحددة وتبقى بأرقامها */
    const tgt = state.orders.filter(o=>selectedIds.has(o.id) && !isCancelledOrder(o));
    if(!tgt.length){ toast('المحددة ملغاة مسبقًا'); return; }
    const why = askCancelReason(tgt.length); if(why===null) return;
    tgt.forEach(o=>{ markCancelled(o, why); logAudit('cancel', o, why||'', true); });
    selectedIds.clear();
    await saveState(); toast(`أُلغي ${tgt.length} طلب — محفوظة بأرقامها`); draw();
  };
  document.getElementById('qs_bulkApply').onclick = async ()=>{
    const fieldId = document.getElementById('qs_bulkField').value;
    if(!fieldId){ toast('اختر مجال المبادرة أولًا'); return; }
    if(selectedIds.size<1){ toast('حدد فعالية واحدة على الأقل'); return; }
    const fieldName = state.fields.find(f=>f.id===fieldId)?.name || '';
    const ok = confirm(`سيتم تغيير مجال المبادرة إلى "${fieldName}" لعدد ${selectedIds.size} فعالية محددة. متابعة؟`);
    if(!ok) return;
    selectedIds.forEach(id=>{ const o=state.orders.find(x=>x.id===id); if(o) o.fieldId=fieldId; });
    await saveState(); toast('تم تحديث مجال المبادرة'); selectedIds.clear(); draw();
  };
  document.getElementById('qs_bulkApplyPath').onclick = async ()=>{
    const pathId = document.getElementById('qs_bulkPath').value;
    if(!pathId){ toast('اختر مسار المبادرة أولًا'); return; }
    if(selectedIds.size<1){ toast('حدد فعالية واحدة على الأقل'); return; }
    const pathName = state.programTypes.find(p=>p.id===pathId)?.name || '';
    const ok = confirm(`سيتم تغيير مسار المبادرة إلى "${pathName}" لعدد ${selectedIds.size} فعالية محددة. متابعة؟`);
    if(!ok) return;
    selectedIds.forEach(id=>{ const o=state.orders.find(x=>x.id===id); if(o) o.programTypeId=pathId; });
    await saveState(); toast('تم تحديث مسار المبادرة'); selectedIds.clear(); draw();
  };

  function draw(){
    const q = document.getElementById('qs_search').value.trim();
    const serialQ = document.getElementById('qs_serial').value.trim();
    const fF = document.getElementById('qs_fFilter').value;
    const pF = document.getElementById('qs_pFilter').value;
    const placeF = document.getElementById('qs_placeFilter').value;
    const levelF = document.getElementById('qs_levelFilter').value;
    const emptyCol = document.getElementById('qs_emptyFilter').value;
    let list = state.orders.slice().sort((a,b)=>b.serial-a.serial);
    if(serialQ){ list = list.filter(o=>String(o.serial).includes(serialQ)); }
    if(q){
      list = list.filter(o=>{
        const s = state.schools.find(x=>x.id===o.schoolId);
        return o.title.includes(q) || (s && s.name.includes(q));
      });
    }
    if(fF){ list = list.filter(o=>o.fieldId===fF); }
    if(pF){ list = list.filter(o=>o.programTypeId===pF); }
    if(placeF){ list = list.filter(o=>{ const s=state.schools.find(x=>x.id===o.schoolId); return s && placeTypeLabel(s.level)===placeF; }); }
    if(levelF){ list = list.filter(o=>{ const s=state.schools.find(x=>x.id===o.schoolId); return s && s.level===levelF; }); }
    // بحث حسب الفراغ: يعرض الصفوف التي يكون فيها العمود المختار فارغًا
    if(emptyCol){
      list = list.filter(o=>{
        const sch = state.schools.find(x=>x.id===o.schoolId);
        const sup = sch ? sch.supervisors.find(s=>s.id===o.supervisorId) : null;
        switch(emptyCol){
          case 'fieldId': return !o.fieldId;
          case 'programTypeId': return !o.programTypeId;
          case 'date': return !o.date;
          case 'dateTo': return !o.dateTo;
          case 'timeFrom': return !o.timeFrom;
          case 'timeTo': return !o.timeTo;
          case 'participantsCount': return !o.participantsCount;
          case 'title': return !o.title;
          case 'placeType': return !sch || !sch.level;
          case 'schoolId': return !o.schoolId;
          case 'supervisorId': return !o.supervisorId;
          case 'supPhone': return !sup || !sup.phone;
          case 'trainerIds': return !(o.trainerIds||[]).length;
          default: return true;
        }
      });
    }
    const wrap = document.getElementById('qs_tableWrap');
    wrap.innerHTML = `<table><thead><tr>
        <th><input type="checkbox" id="qs_selectAll" title="تحديد الكل"></th>
        <th>رقم أمر التكليف</th>
        <th style="min-width:150px;">مجال المبادرة</th>
        <th style="min-width:150px;">مسار المبادرة</th>
        <th>تاريخ المبادرة من</th>
        <th>تاريخ الانتهاء</th>
        <th>وقت المبادرة من</th>
        <th>وقت المبادرة إلى</th>
        <th>عدد المستهدفين</th>
        <th style="min-width:220px;">عنوان المبادرة</th>
        <th style="min-width:130px;">مكان التنفيذ</th>
        <th style="min-width:180px;">مكان المبادرة</th>
        <th style="min-width:120px;">المرحلة</th>
        <th style="min-width:150px;">المشرف</th>
        <th style="min-width:120px;">رقم الجوال</th>
        <th style="min-width:200px;">بيانات المدربين وهواتفهم</th>
        <th>الإنجاز</th>
        <th>إجراءات</th>
      </tr></thead><tbody>
        ${list.map(o=>{
          const sch = state.schools.find(x=>x.id===o.schoolId);
          const sup = sch ? sch.supervisors.find(s=>s.id===o.supervisorId) : null;
          const trainersTxt = (o.trainerIds||[]).map(id=>{ const t=state.trainers.find(x=>x.id===id); return t?`${t.name}:${t.phone||''}`:''; }).filter(Boolean).join('، ');
          return `<tr data-order-id="${o.id}" style="${o.status==='cancelled'?'opacity:.55;':''}">
          <td><input type="checkbox" class="qs-check" data-id="${o.id}" ${selectedIds.has(o.id)?'checked':''}></td>
          <td><span class="badge">${o.serial}</span></td>
          <td><select class="qs-field" data-field="fieldId">
            <option value="">—</option>
            ${state.fields.map(f=>`<option value="${f.id}" ${o.fieldId===f.id?'selected':''}>${escapeHtml(f.name)}</option>`).join('')}
          </select></td>
          <td><select class="qs-field" data-field="programTypeId">
            <option value="">—</option>
            ${state.programTypes.map(p=>`<option value="${p.id}" ${o.programTypeId===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}
          </select></td>
          <td><input type="date" lang="en-GB" class="qs-field" data-field="date" value="${o.date||''}"></td>
          <td><input type="date" lang="en-GB" class="qs-field" data-field="dateTo" value="${o.dateTo||''}"></td>
          <td><input type="time" lang="en" class="qs-field" data-field="timeFrom" value="${o.timeFrom||''}"></td>
          <td><input type="time" lang="en" class="qs-field" data-field="timeTo" value="${o.timeTo||''}"></td>
          <td><input type="number" lang="en" min="0" class="qs-field" data-field="participantsCount" value="${o.participantsCount||''}" style="width:90px;"></td>
          <td><input type="text" class="qs-field" data-field="title" value="${escapeHtml(o.title)}"></td>
          <td><select class="qs-place">
            <option value="">—</option>
            ${state.placeTypes.map(p=>{ const cur=sch?placeTypeLabel(sch.level):''; return `<option value="${escapeHtml(p.name)}" ${cur===p.name?'selected':''}>${escapeHtml(p.name)}</option>`; }).join('')}
          </select></td>
          <td><select class="qs-field" data-field="schoolId">
            <option value="">—</option>
            ${state.schools.map(s=>`<option value="${s.id}" ${o.schoolId===s.id?'selected':''}>${escapeHtml(s.name)}</option>`).join('')}
          </select></td>
          <td><select class="qs-level">
            <option value="">—</option>
            ${LOCATION_TYPES.map(l=>`<option value="${escapeHtml(l)}" ${sch&&sch.level===l?'selected':''}>${escapeHtml(l)}</option>`).join('')}
          </select></td>
          <td><select class="qs-field" data-field="supervisorId">
            <option value="">—</option>
            ${(sch?sch.supervisors:[]).map(s=>`<option value="${s.id}" ${o.supervisorId===s.id?'selected':''}>${escapeHtml(s.name)}</option>`).join('')}
          </select></td>
          <td><input type="text" class="qs-supphone" value="${sup?escapeHtml(sup.phone||''):''}" placeholder="—" style="width:110px;"></td>
          <td><input type="text" class="qs-trainers" value="${escapeHtml(trainersTxt)}" placeholder="الاسم:الهاتف، الاسم:الهاتف"></td>
          <td><select class="qs-field" data-field="completionStatus">
            <option value="" ${!o.completionStatus?'selected':''}>لم تنجز بعد</option>
            <option value="تم" ${o.completionStatus==='تم'?'selected':''}>تم</option>
            <option value="لم يتم" ${o.completionStatus==='لم يتم'?'selected':''}>لم يتم</option>
            <option value="الغيت" ${o.completionStatus==='الغيت'?'selected':''}>أُلغيت</option>
            <option value="المشرف لا يرد" ${o.completionStatus==='المشرف لا يرد'?'selected':''}>المشرف لا يرد</option>
          </select></td>
          <td>
            <button class="icon-btn" title="ترحيل / تأجيل" onclick="openPostponeModal('${o.id}')">⏩</button>
            <button class="icon-btn danger" title="حذف" onclick="qsDeleteRow('${o.id}')">🗑️</button>
          </td>
        </tr>`;}).join('') || `<tr><td colspan="18" class="empty-state">لا توجد فعاليات مطابقة</td></tr>`}
      </tbody></table>`;
    // حفظ رقم جوال المشرف
    wrap.querySelectorAll('.qs-supphone').forEach(el=>{
      el.addEventListener('change', async ()=>{
        const o = state.orders.find(x=>x.id===el.closest('tr').dataset.orderId); if(!o) return;
        const sch = state.schools.find(s=>s.id===o.schoolId);
        const sv = sch ? sch.supervisors.find(s=>s.id===o.supervisorId) : null;
        if(!sv){ toast('اختر المشرف أولًا'); draw(); return; }
        sv.phone = el.value.trim(); await saveState(); toast('تم حفظ رقم الجوال');
      });
    });
    // حفظ المرحلة على الجهة
    wrap.querySelectorAll('.qs-level').forEach(el=>{
      el.addEventListener('change', async ()=>{
        const o = state.orders.find(x=>x.id===el.closest('tr').dataset.orderId); if(!o) return;
        const sch = state.schools.find(s=>s.id===o.schoolId);
        if(!sch){ toast('اختر مكان المبادرة أولًا'); draw(); return; }
        sch.level = el.value; await saveState(); toast('تم تحديث المرحلة'); draw();
      });
    });
    // حفظ المدربين نصًا "الاسم:الهاتف، ..."
    wrap.querySelectorAll('.qs-trainers').forEach(el=>{
      el.addEventListener('change', async ()=>{
        const o = state.orders.find(x=>x.id===el.closest('tr').dataset.orderId); if(!o) return;
        const ids=[];
        el.value.split(/[،,]/).map(s=>s.trim()).filter(Boolean).forEach(entry=>{
          const [nm,ph]=entry.split(':').map(s=>s?s.trim():'');
          const name=nm||entry;
          let tr=state.trainers.find(t=>(ph&&t.phone===ph)||t.name===name);
          if(!tr){ tr={id:uid(), name, phone:ph||''}; state.trainers.push(tr); }
          else if(ph && !tr.phone){ tr.phone=ph; }
          ids.push(tr.id);
        });
        o.trainerIds=ids; await saveState(); toast('تم حفظ بيانات المدربين');
      });
    });
    wrap.querySelectorAll('.qs-field').forEach(el=>{
      el.addEventListener('change', async ()=>{
        const tr = el.closest('tr');
        const id = tr.dataset.orderId;
        const o = state.orders.find(x=>x.id===id); if(!o) return;
        const field = el.dataset.field;
        o[field] = el.value;
        await saveState();
        toast('تم الحفظ');
      });
    });
    wrap.querySelectorAll('.qs-place').forEach(el=>{
      el.addEventListener('change', async ()=>{
        const tr = el.closest('tr');
        const o = state.orders.find(x=>x.id===tr.dataset.orderId); if(!o) return;
        const sch = state.schools.find(s=>s.id===o.schoolId);
        if(!sch){ toast('اختر المدرسة/الجهة أولًا'); draw(); return; }
        sch.level = el.value;   // مكان التنفيذ يُخزَّن على الجهة نفسها
        await saveState();
        toast(`تم تحديث مكان التنفيذ لـ "${sch.name}"`);
      });
    });
    wrap.querySelectorAll('.qs-check').forEach(cb=>{
      cb.addEventListener('change', ()=>{
        if(cb.checked) selectedIds.add(cb.dataset.id); else selectedIds.delete(cb.dataset.id);
        const all = wrap.querySelectorAll('.qs-check');
        const selectAll = document.getElementById('qs_selectAll');
        if(selectAll) selectAll.checked = all.length>0 && Array.from(all).every(c=>c.checked);
        updateBulkToolbar();
      });
    });
    const selectAll = document.getElementById('qs_selectAll');
    if(selectAll){
      selectAll.addEventListener('change', ()=>{
        wrap.querySelectorAll('.qs-check').forEach(cb=>{
          cb.checked = selectAll.checked;
          if(selectAll.checked) selectedIds.add(cb.dataset.id); else selectedIds.delete(cb.dataset.id);
        });
        updateBulkToolbar();
      });
    }
    updateBulkToolbar();
  }
  ['qs_search','qs_serial'].forEach(id=>document.getElementById(id).addEventListener('input', draw));
  ['qs_fFilter','qs_pFilter','qs_placeFilter','qs_levelFilter','qs_emptyFilter'].forEach(id=>document.getElementById(id).addEventListener('change', draw));
  draw();
}
async function qsDeleteRow(id){ return deleteOrder(id); }

function renderOrderForm(sub){
  const editing = editingOrderId ? state.orders.find(o=>o.id===editingOrderId) : null;
  const selectedTrainerIds = editing ? (editing.trainerIds||[]) : [];

  /* ترتيب الفعاليات بالرقم للتنقل بينها */
  const navList = (state.orders||[]).slice().sort((a,b)=>(Number(a.serial)||0)-(Number(b.serial)||0));
  const navIdx  = editing ? navList.findIndex(o=>o.id===editing.id) : navList.length;
  const navPrev = navIdx>0 ? navList[navIdx-1] : null;
  const navNext = (editing && navIdx < navList.length-1) ? navList[navIdx+1] : null;
  sub.innerHTML = `
  <div id="ordClashBar"></div>
  <div class="ord-nav">
    <button type="button" class="ord-nav-btn" id="navPrevOrder" ${navPrev?'':'disabled'}
      title="${navPrev?escapeHtml('الفعالية السابقة: '+navPrev.serial+' — '+(navPrev.title||'')):'لا توجد فعالية سابقة'}"
      aria-label="الفعالية السابقة">${icon('arrowRight',16)}<span>السابقة</span></button>
    <div class="ord-nav-mid">
      ${editing
        ? `<b>أمر رقم ${escapeHtml(String(editing.serial))}</b><i>${navIdx+1} من ${navList.length}</i>`
        : `<b>طلب جديد</b><i>${navList.length} فعالية مسجّلة</i>`}
    </div>
    <button type="button" class="ord-nav-btn" id="navNextOrder" ${navNext?'':'disabled'}
      title="${navNext?escapeHtml('الفعالية التالية: '+navNext.serial+' — '+(navNext.title||'')):'لا توجد فعالية تالية'}"
      aria-label="الفعالية التالية"><span>التالية</span>${icon('arrowLeft',16)}</button>
  </div>
  <div class="gv-progress">
    <span class="gv-pct-lb">${icon('checkCircle',15)} اكتمال الطلب</span>
    <span class="gv-bar"><i id="gvBar" style="width:0%"></i></span>
    <span class="gv-pct" id="gvPct">0%</span>
  </div>
  <div class="gv-layout">
  <div>
  <div class="card glow-card">
    <table class="form-table compact"><thead><tr><th colspan="7">
      <div class="th-bar">
        <span class="sec-title">المبادرة ووقت تنفيذها<i>التفاصيل الأساسية المطلوبة لاعتماد الفعالية</i></span>
        <span class="th-actions">
          <span style="display:inline-flex;align-items:center;gap:6px;background:#fff;color:#5A142F;border-radius:6px;padding:2px 10px;font-size:12px;font-weight:700;">
            أمر التكليف: <b style="font-size:14px;">${editing? editing.serial : 'تلقائي عند الحفظ'}</b>
          </span>
          <button class="plus-btn mini" title="إضافة مجال جديد" onclick="quickAddField()">+ مجال</button>
          <button class="plus-btn mini" title="إضافة مسار جديد" onclick="quickAddPType()">+ مسار</button>
        </span>
      </div>
    </th></tr></thead><tbody>
      <tr>
        <td style="width:18%;" title="مجال المبادرة"><label>${icon('layers',13)} المجال</label>
          <select id="f_field" required style="width:100%;">${state.fields.map(f=>`<option value="${f.id}" ${editing&&editing.fieldId===f.id?'selected':''}>${escapeHtml(f.name)}</option>`).join('')}</select>
        </td>
        <td style="width:18%;" title="مسار المبادرة"><label>${icon('activity',13)} المسار</label>
          <select id="f_ptype" required style="width:100%;">${state.programTypes.map(p=>`<option value="${p.id}" ${editing&&editing.programTypeId===p.id?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select>
        </td>
        <td style="width:16%;" title="مكان التنفيذ"><label>${icon('school',13)} المكان</label>
          <select id="f_placeTypeTop" style="width:100%;">
            <option value="">-- الكل --</option>
            ${state.placeTypes.map(p=>`<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('')}
          </select>
        </td>
        <td style="width:30%;"><label>${icon('fileText',13)} عنوان المبادرة</label>
          <input id="f_title" required style="width:100%;" value="${editing?escapeHtml(editing.title):''}">
        </td>
        <td style="width:18%;" id="f_periodWrap"><label>${icon('clock',13)} الحصة</label>
          <select id="f_period" style="width:100%;">
            <option value="">-- اختر الحصة --</option>
            ${SCHOOL_PERIODS.map((p,i)=>`<option value="${i}">${escapeHtml(p.name)}</option>`).join('')}
          </select>
        </td>
      </tr>
      <tr>
        <td style="width:16%;"><label>${icon('calendar',13)} تاريخ المبادرة</label>
          <div style="display:flex;align-items:center;gap:6px;">
            <input id="f_date" type="date" lang="en-GB" required style="width:100%;" value="${editing?editing.date:''}">
            <span id="dateStatusDot" style="display:none;width:9px;height:9px;border-radius:50%;flex:none;"></span>
          </div>
        </td>
        <td style="width:16%;" id="f_dateToCell" ${editing&&editing.date?'':'hidden'}>
          <label>${icon('calendar',13)} تاريخ الانتهاء</label>
          <input id="f_dateTo" type="date" lang="en-GB" style="width:100%;" value="${editing?editing.dateTo||'':''}">
        </td>
        <td style="width:11%;"><label>${icon('layers',13)} عدد الأيام</label>
          <input id="f_daysCount" class="num" type="number" lang="en" min="1" step="1" style="width:100%;"
            title="أدخل عدد الأيام ليُحسب تاريخ الانتهاء تلقائيًا" value="${editing?daysCount(editing.date, editing.dateTo):''}">
        </td>
        <td style="width:14%;"><label>${icon('clock',13)} من الساعة</label>
          <input id="f_timeFrom" type="time" lang="en" required style="width:100%;" value="${editing?editing.timeFrom:''}">
        </td>
        <td style="width:14%;"><label>${icon('clock',13)} إلى الساعة</label>
          <input id="f_timeTo" type="time" lang="en" required style="width:100%;" value="${editing?editing.timeTo:''}">
        </td>
        <td style="width:15%;"><label>${icon('users',13)} عدد المستهدفين</label>
          <input id="f_count" class="num" type="number" lang="en" min="0" required style="width:100%;" value="${editing?editing.participantsCount:''}">
        </td>
        <td style="width:14%;"><label>${icon('clock',13)} الساعات</label>
          <input id="f_hoursCount" class="num" type="text" lang="en" readonly style="width:100%;background:var(--gold-l);"
            value="${editing?computeHours(editing.timeFrom, editing.timeTo, editing.date, editing.dateTo):''}">
        </td>
      </tr>
      ${editing ? (editing.seriesId ? `<tr><td colspan="7"><div class="rep-box on">${icon('refresh',15)}
        <span>هذا الموعد <b>${editing.seriesIndex||'?'} من ${editing.seriesTotal||'?'}</b> في سلسلة أسبوعية — التعديل هنا يخصّ هذا الموعد فقط.</span></div></td></tr>` : '') : `
      <tr><td colspan="7">
        <div class="rep-box" id="f_repBox">
          <label class="rep-tg"><input type="checkbox" id="f_repeat"><span class="rep-sw"></span>
            <span>${icon('refresh',15)} فعالية أسبوعية متكررة <i>(مثل المصلى المتنقل)</i></span></label>
          <span class="rep-opts" id="f_repOpts" hidden>
            <label>تتكرر كل أسبوع حتى تاريخ</label>
            <input id="f_repUntil" type="date" lang="en-GB">
            <span class="rep-info" id="f_repInfo"></span>
          </span>
        </div>
      </td></tr>`}
      <tr><td colspan="7">
        <details class="benef-box" ${editing&&editing.benef?'open':''}>
          <summary>${icon('users',14)} تفصيل المستهدفين <i>(اختياري — يملأ «عدد المستهدفين» تلقائيًا)</i></summary>
          <div class="benef-grid">
            ${[['f_bStudents','الطلاب','students'],['f_bTeachers','المعلمون','teachers'],['f_bParents','أولياء الأمور','parents'],['f_bOthers','آخرون','others']]
              .map(b=>`<div><label>${b[1]}</label><input id="${b[0]}" class="num" type="number" lang="en" min="0"
                value="${editing&&editing.benef&&editing.benef[b[2]]?editing.benef[b[2]]:''}"></div>`).join('')}
            <div><label>الفئة</label><select id="f_bGender">
              ${['','بنين','بنات','مختلط'].map(g=>`<option value="${g}" ${editing&&editing.gender===g?'selected':''}>${g||'—'}</option>`).join('')}
            </select></div>
          </div>
        </details>
      </td></tr>
    </tbody></table>
  </div>

  <nav class="ftabs" role="tablist">
    ${[
      ['بيانات التنفيذ والمكان والمشرفين','school'],
      ['منفذو المبادرة','users'],
      ['الطلبات الإدارية','clipboard'],
      ['الملاحظات','fileText'],
    ].map((t,i)=>`<button type="button" class="ftab${i===0?' active':''}" data-ftab="${i}" role="tab">
      ${icon(t[1],14)}<span>${escapeHtml(t[0])}</span>
    </button>`).join('')}
  </nav>
  <div class="ftab-body">
  <div class="grid" style="grid-template-columns:1fr; gap:12px;" data-tab="0">
  <div class="card glow-card">
    <table class="form-table compact"><thead><tr><th colspan="4">
      <div class="th-bar">
        <span class="sec-title">بيانات التنفيذ والمكان<i>مكان تنفيذ المبادرة والجهة المشرفة عليها</i></span>
        <span class="th-actions">
          <input id="f_schoolSearch" class="th-search" placeholder="🔎 بحث عن مدرسة/جهة..." autocomplete="off">
          <span id="f_schoolCount" class="helper" style="font-size:10.5px;"></span>
          <button class="plus-btn mini" title="إضافة تصنيف مكان تنفيذ" onclick="quickAddPlaceType()">+ مكان</button>
          <button class="plus-btn mini" title="إضافة مدرسة/جهة" id="f_addSchoolBtn" onclick="quickAddSchool(document.getElementById('f_placeType').value ? (levelsForPlaceType(document.getElementById('f_placeType').value)[0]||'') : '')">+ جهة</button>
          <button class="plus-btn mini" title="إضافة مشرف لهذه المدرسة" onclick="quickAddSupervisor()">+ مشرف</button>
        </span>
      </div>
    </th></tr></thead><tbody>
      <tr>
        <td style="display:none;"><select id="f_placeType" class="auto-w">
            <option value="">-- الكل --</option>
            ${state.placeTypes.map(p=>`<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('')}
          </select></td>
        <td style="width:44%;" title="مكان المبادرة"><label>${icon('school',13)} الجهة
            <span class="inl-acts">
              <button type="button" class="inl-btn" onclick="formEditSchool()" title="تعديل اسم الجهة" aria-label="تعديل الجهة">${icon('edit',12)}</button>
              <button type="button" class="inl-btn danger" onclick="formDeleteSchool()" title="حذف الجهة" aria-label="حذف الجهة">${icon('trash',12)}</button>
            </span></label>
          <select id="f_school" size="1" required style="width:100%;"><option value="" ${editing&&editing.schoolId?'':'selected'}>— اختر مكان المبادرة —</option>${state.schools.map(s=>`<option value="${s.id}" data-level="${escapeHtml(s.level||'')}" ${editing&&editing.schoolId===s.id?'selected':''}>${escapeHtml(s.name)} — ${escapeHtml(s.level)}</option>`).join('')}</select>
        </td>
        <td style="width:18%;" title="المرحلة الدراسية"><label>${icon('layers',13)} المرحلة</label>
          <select id="f_stage" style="width:100%;">
            <option value="">— تلقائي —</option>
            ${['ابتدائي','إعدادي','ثانوي','جامعي'].map(s=>`<option value="${s}">${s}</option>`).join('')}
          </select>
        </td>
        <td style="width:38%;" title="الجهة المشرفة"><label>${icon('users',13)} المشرف
            <span class="inl-acts">
              <button type="button" class="inl-btn" onclick="formEditSupervisor()" title="تعديل اسم المشرف أو هاتفه" aria-label="تعديل المشرف">${icon('edit',12)}</button>
              <button type="button" class="inl-btn danger" onclick="formDeleteSupervisor()" title="حذف المشرف" aria-label="حذف المشرف">${icon('trash',12)}</button>
            </span></label>
          <select id="f_supervisor" style="width:100%;"></select>
        </td>
      </tr>
      <tr><td colspan="4"><div id="supervisorInfo" class="supervisor-info">${''}</div></td></tr>
      <tr>
        <td colspan="4" title="يُترك فارغًا إذا كان التنفيذ في مقر الجهة الطالبة">
          <label>${icon('school',13)} مكان التنفيذ الفعلي
            <span class="inl-acts">
              <button type="button" class="inl-btn" onclick="quickAddVenue()" title="إضافة مكان تنفيذ" aria-label="إضافة مكان تنفيذ">${icon('plus',12)}</button>
            </span></label>
          <select id="f_venue" style="width:100%;max-width:420px;">
            <option value="">— في مقر الجهة الطالبة —</option>
            ${(state.venues||[]).map(v=>`<option value="${escapeHtml(v.name)}" ${editing&&editing.venue===v.name?'selected':''}>${escapeHtml(v.name)}</option>`).join('')}
            ${editing&&editing.venue&&!(state.venues||[]).some(v=>v.name===editing.venue)
              ? `<option value="${escapeHtml(editing.venue)}" selected>${escapeHtml(editing.venue)}</option>` : ''}
          </select>
          <div class="helper" style="margin-top:4px;">اختره فقط إذا كان التنفيذ في مكان غير مقر الجهة الطالبة — يظهر في نسختَي أمر التكليف.</div>
        </td>
      </tr>
      <tr>
        <td colspan="4">
          <label>${icon('truck',13)} الموارد المحجوزة <span class="helper" style="font-weight:400;">(المصلى المتنقل، القاعة، الحافلة… — لا يُحجز المورد لجهتين في اليوم نفسه)</span></label>
          <div class="res-chips" id="resChecks">
            ${(state.resources||[]).length ? state.resources.map(r=>`<label class="res-chip">
                <input type="checkbox" value="${r.id}" ${editing&&(editing.resourceIds||[]).includes(r.id)?'checked':''}>
                <span>${icon('truck',13)} ${escapeHtml(r.name)}</span></label>`).join('')
              : `<span class="helper">لا توجد موارد بعد — أضفها من الإعدادات ← القوائم والبيانات ← الموارد.</span>`}
          </div>
          <div id="resWarn" class="res-warn" hidden></div>
        </td>
      </tr>
    </tbody></table>
  </div>
  </div>

  <div class="card glow-card" data-tab="1">
    <table class="form-table"><thead><tr><th>
      <div style="display:flex;align-items:center;gap:9px;">
        <span class="sec-title">منفذو المبادرة<i>اختر مقدّمي الفعالية المتاحين في التاريخ المحدد</i></span>
        <button class="plus-btn mini" title="إضافة مقدم مبادرة" onclick="quickAddTrainer()">+ مقدّم</button>
      </div>
    </th></tr></thead><tbody>
      <tr><td>
      <div class="pick-one">
        <div class="ms-wrap open always-open" id="trainerMS">
          <div class="ms-head static">
            <span class="ms-ic">${icon('users',16)}</span>
            <span class="ms-label" id="trainerMSLabel">منفذو المبادرة</span>
            <span class="ms-n" id="trainerMSCount">0</span>
          </div>
          <div class="ms-body" id="trainerChipList"></div>
        </div>
      </div>
        <div class="helper">المشغول بفارق أقل من ساعة ونصف عن فعالية أخرى في نفس اليوم يظهر كـ"مشغول".</div>
      </td></tr>
    </tbody></table>
  </div>

  <div class="card glow-card" data-tab="2">
    <table class="form-table"><thead><tr><th>
      <div style="display:flex;align-items:center;gap:9px;">
        <span class="sec-title">الطلبات الإدارية<i>حدّد ما يحتاجه الفريق لتجهيز يوم الفعالية</i></span>
        <button class="plus-btn mini" title="إضافة طلب إداري" onclick="quickAddAdminRequest()">+ طلب</button>
      </div>
    </th></tr></thead><tbody>
      <tr><td><div id="adminReqList"></div></td></tr>
    </tbody></table>
  </div>

  <div class="grid" style="grid-template-columns:1fr; gap:12px;" data-tab="3">
    <div class="card glow-card">
      <table class="form-table"><thead><tr><th><span class="sec-title">ملاحظات<i>ملاحظات الجهة الطالبة والإدارة</i></span></th></tr></thead><tbody>
        <tr><td>
          <label class="pill-opt notes-toggle">
            <input type="checkbox" id="notesToggle" ${editing&&((editing.requesterNote||'')||(editing.adminNote||''))?'checked':''}>
            <span class="dot">${icon('check',13)}</span>
            <span>${icon('fileText',14)} هل لديك ملاحظات؟</span>
          </label>
          <div id="notesWrap" class="${editing&&((editing.requesterNote||'')||(editing.adminNote||''))?'on':''}">
            <div class="notes-row">
              <div class="fbox"><label>${icon('school',13)} ملاحظة الجهة الطالبة</label>
                <textarea id="f_reqNote" rows="2" style="min-height:44px; height:44px; resize:vertical;">${editing?escapeHtml(editing.requesterNote||''):''}</textarea></div>
              <div class="fbox"><label>${icon('clipboard',13)} ملاحظة الإدارة</label>
                <textarea id="f_adminNote" rows="2" style="min-height:44px; height:44px; resize:vertical;">${editing?escapeHtml(editing.adminNote||''):''}</textarea></div>
            </div>
          </div>
        </td></tr>
      </tbody></table>
    </div>

  </div>

  </div>

  <div class="card">
    <div class="save-bar">
      <button class="btn btn-primary" id="saveOrderPrintBtn">${icon('school',16)}${icon('printer',16)} ${editing?'حفظ وطباعة للجهة الطالبة':'حفظ وطباعة للجهة الطالبة'}</button>
      <button class="btn btn-outline" id="saveOrderPrintAdminBtn">${icon('clipboard',16)}${icon('printer',16)} ${editing?'حفظ وطباعة للإدارة':'حفظ وطباعة للإدارة'}</button>
      <button class="btn btn-primary" id="saveOrderBtn">${icon('checkCircle',16)} ${editing?'حفظ التعديلات':'حفظ الطلب'}</button>
      ${editing?'<button class="btn btn-outline" id="cancelEditBtn">إلغاء التعديل</button>':''}
    </div>
  </div>
  </div>
  <aside class="gv-summary" id="gvSummary"></aside>
  </div>`;

  function currentDate(){ return document.getElementById('f_date').value; }
  function currentDateTo(){ return document.getElementById('f_dateTo').value; }
  function currentTimeFrom(){ return document.getElementById('f_timeFrom').value; }
  function currentTimeTo(){ return document.getElementById('f_timeTo').value; }

  /* ══════════════════════════════════════════════════════════════
     تنبيه التضارب أعلى الصفحة — يتحدّث لحظيًا مع التاريخ والوقت
     والمقدّمين المختارين، ويبقى ظاهرًا قبل الحفظ.
     ══════════════════════════════════════════════════════════════ */
  function refreshOrderClashBar(){
    const bar = document.getElementById('ordClashBar');
    if(!bar) return;
    const date = currentDate(), dateTo = currentDateTo() || currentDate();
    const tf = currentTimeFrom(), tt = currentTimeTo();
    const exclude = editing ? editing.id : null;
    const box = document.getElementById('trainerChipList');
    const chosen = box ? Array.from(box.querySelectorAll('input:checked')).map(i=>i.value) : [];

    if(!date || !chosen.length){ bar.innerHTML=''; return; }

    /* تضارب المقدّمين المختارين */
    const hits = [];
    chosen.forEach(tid=>{
      const t = (state.trainers||[]).find(x=>x.id===tid);
      const c = trainerConflictSingle(tid, date, tf, tt, exclude, dateTo);
      if(c) hits.push({ t, c });
    });

    /* المقدّمون المختارون في إجازة */
    chosen.forEach(tid=>{ const lv = trainerLeaveOn(tid, date, dateTo); if(lv){ const t=(state.trainers||[]).find(x=>x.id===tid);
      hits.push({ t, c:{ id:'', serial:'إجازة', title: leaveTxt(lv), date: lv.from, timeFrom:'', timeTo:'' }, leave:true }); } });
    /* تضارب الجهة نفسها في اليوم نفسه */
    const schId = (document.getElementById('f_school')||{}).value || '';
    const sameDay = schId ? schoolSameDay(schId, date, exclude) : null;

    if(!hits.length && !sameDay){
      bar.innerHTML = `<div class="ord-ok">${icon('checkCircle',15)}
        <span>لا يوجد تضارب — ${escapeHtml(fmtDate(date))}${tf?` · ${escapeHtml(tf)}${tt?' – '+escapeHtml(tt):''}`:''}
        · ${chosen.length} مقدّم مختار.</span></div>`;
      return;
    }

    let rows = '';
    hits.forEach(({t,c})=>{
      const sch = (state.schools||[]).find(x=>x.id===c.schoolId);
      rows += `<button type="button" class="ord-clash-ev" onclick="openOrderDrawer('${c.id}')">
        <b>⚠ ${escapeHtml(t?t.name:'')}</b>
        <span class="oc-when">${escapeHtml(fmtDate(c.date))} · ${escapeHtml(c.timeFrom||'—')} – ${escapeHtml(c.timeTo||'—')}</span>
        <span class="oc-what">أمر ${escapeHtml(String(c.serial||'—'))} — ${escapeHtml(c.title||'بلا عنوان')}${sch?` · ${escapeHtml(sch.name)}`:''}</span>
      </button>`;
    });
    if(sameDay){
      const sch = (state.schools||[]).find(x=>x.id===schId);
      rows += `<button type="button" class="ord-clash-ev soft" onclick="openOrderDrawer('${sameDay.id}')">
        <b>⚠ ${escapeHtml(sch?sch.name:'الجهة')}</b>
        <span class="oc-when">${escapeHtml(fmtDate(sameDay.date))} · ${escapeHtml(sameDay.timeFrom||'—')} – ${escapeHtml(sameDay.timeTo||'—')}</span>
        <span class="oc-what">لدى الجهة فعالية أخرى في اليوم نفسه — أمر ${escapeHtml(String(sameDay.serial||'—'))} — ${escapeHtml(sameDay.title||'')}</span>
      </button>`;
    }

    const n = hits.length + (sameDay?1:0);
    bar.innerHTML = `<div class="ord-clash">
      <div class="ord-clash-h">${icon('alert',16)}
        <b>تنبيه تضارب — ${n} حالة</b>
        <i>${escapeHtml(fmtDate(date))}${dateTo&&dateTo!==date?` — ${escapeHtml(fmtDate(dateTo))}`:''}${tf?` · ${escapeHtml(tf)}${tt?' – '+escapeHtml(tt):''}`:''}</i>
      </div>
      <div class="ord-clash-b">${rows}</div>
      <div class="ord-clash-f">التضارب تحذيري ولا يمنع الحفظ — اضغط أي بند لفتحه ومعالجته.</div>
    </div>`;
  }

  function refreshTrainerChips(){
    const date = currentDate(), dateTo = currentDateTo(), tf=currentTimeFrom(), tt=currentTimeTo();
    const box = document.getElementById('trainerChipList');
    const previouslyChecked = Array.from(box.querySelectorAll('input:checked')).map(i=>i.value);
    const checkedSet = new Set(previouslyChecked.length ? previouslyChecked : selectedTrainerIds);
    box.innerHTML = state.trainers.map(t=>{
      const conflict = date ? trainerConflictSingle(t.id, date, tf, tt, editing?editing.id:null, dateTo) : null;
      const leave = date ? trainerLeaveOn(t.id, date, dateTo) : null;
      const fieldSel = (document.getElementById('f_field')||{}).value || '';
      const skilled = !!fieldSel && (t.skills||[]).includes(fieldSel);
      const busy = !!conflict && !checkedSet.has(t.id);
      const checked = checkedSet.has(t.id);
      // المشغول لم يعد ممنوعًا: يُسمح باختياره بعد تأكيد التنسيق مع الجهة
      /* نطاق انشغاله بالضبط */
      const cFrom = conflict ? (conflict.timeFrom||'') : '';
      const cTo   = conflict ? (conflict.timeTo||'')   : '';
      const cRange= (cFrom||cTo) ? `${cFrom||'—'} — ${cTo||'—'}` : '';
      const cSch  = conflict ? (state.schools.find(x=>x.id===conflict.schoolId)||{}).name || '' : '';
      const tip = busy
        ? `مشغول من ${cFrom||'—'} إلى ${cTo||'—'} — ${conflict.title||''}${cSch?` (${cSch})`:''}`
        : '';
      const avail = !!date && !busy && !leave;     // متاح فقط بعد تحديد التاريخ
      return `<label class="opt-row${busy||leave?' is-busy':''}${avail?' is-free':''}${checked?' on':''}${skilled?' is-skilled':''}" data-skill="${skilled?1:0}" title="${escapeHtml(leave?('في إجازة: '+leaveTxt(leave)):tip)}">
        <input type="checkbox" value="${t.id}"
          data-busy="${busy?'1':'0'}"
          data-name="${escapeHtml(t.name)}"
          data-ctitle="${busy?escapeHtml(conflict.title||''):''}"
          data-cdate="${busy?escapeHtml(fmtDate(conflict.date)):''}"
          data-cfrom="${escapeHtml(cFrom)}" data-cto="${escapeHtml(cTo)}"
          data-cschool="${escapeHtml(cSch)}"
          data-cserial="${busy?escapeHtml(String(conflict.serial||'')):''}"
          ${checked?'checked':''}>
        <span class="opt-box">${icon('check',11)}</span>
        <span class="opt-txt">${escapeHtml(t.name)}${t.phone?` / <b>${escapeHtml(t.phone)}</b>`:''}</span>
        ${skilled ? `<span class="opt-tag skill" title="يقدّم هذا المجال">★</span>` : ''}
        ${leave ? `<span class="opt-tag busy">إجازة</span>`
               : busy ? `<span class="opt-tag busy">مشغول ${escapeHtml(cRange)}</span>`
               : avail ? `<span class="opt-tag free">متاح</span>` : ''}
      </label>`;
    }).join('') || '<span class="helper" style="padding:9px 12px;display:block;">لا يوجد مقدمو مبادرات بعد</span>';
    /* أصحاب المجال المختار أولًا */
    Array.from(box.querySelectorAll('label.opt-row[data-skill="1"]')).reverse().forEach(l=>box.insertBefore(l, box.firstChild));
    // تأكيد صريح عند اختيار مدرب مشغول
    function refreshMSLabel(){
      const sel = Array.from(box.querySelectorAll('input:checked'));
      const lb = document.getElementById('trainerMSLabel'), ct = document.getElementById('trainerMSCount');
      if(!lb || !ct) return;
      ct.textContent = sel.length; ct.classList.toggle('on', sel.length>0);
      lb.textContent = sel.length ? sel.map(c=>{
        const t = state.trainers.find(x=>x.id===c.value); return t?t.name:'';
      }).filter(Boolean).join('، ') : 'اختر مقدّمي الفعالية';
    }
    refreshMSLabel();
    refreshOrderClashBar();
    box.querySelectorAll('input[type=checkbox]').forEach(cb=>{
      cb.addEventListener('change', ()=>{ const c=cb.closest('.opt-row'); if(c) c.classList.toggle('on', cb.checked); });
      cb.addEventListener('change', refreshMSLabel);
      cb.addEventListener('change', refreshOrderClashBar);
      cb.addEventListener('change', ()=>{
        if(cb.checked && cb.dataset.busy==='1'){
          const d = cb.dataset;
          const nf = document.getElementById('f_timeFrom').value || '—';
          const nt = document.getElementById('f_timeTo').value   || '—';
          const msg =
            `⚠ ${d.name} مشغول في هذا اليوم\n\n`
            + `الارتباط الحالي:\n`
            + `   من الساعة ${d.cfrom||'—'} إلى الساعة ${d.cto||'—'}\n`
            + `   ${d.ctitle||''}${d.cserial?` (أمر ${d.cserial})`:''}\n`
            + (d.cschool?`   ${d.cschool}\n`:'')
            + `   ${d.cdate||''}\n\n`
            + `الفعالية الجديدة:\n`
            + `   من الساعة ${nf} إلى الساعة ${nt}\n\n`
            + `هل توافق على إسناده لهذه المبادرة أيضًا؟`;
          const ok = confirm(msg);
          if(!ok){ cb.checked=false; return; }
          toast(`تم إسناد ${d.name} رغم ارتباطه من ${d.cfrom||'—'} إلى ${d.cto||'—'}`);
        }
      });
    });
  }
  function refreshSupervisors(){
    const schId = document.getElementById('f_school').value;
    const sch = state.schools.find(s=>s.id===schId);
    const sel = document.getElementById('f_supervisor');
    const svs = (sch && sch.supervisors) ? sch.supervisors : [];
    /* المشرف اختياري — يمكن الحفظ الآن وإضافته لاحقًا */
    sel.innerHTML = svs.length
      ? svs.map(sv=>`<option value="${sv.id}" ${editing&&editing.supervisorId===sv.id?'selected':''}>${escapeHtml(sv.name)}${sv.phone?'':' (بلا رقم)'}</option>`).join('')
        + `<option value="" ${editing&&!editing.supervisorId?'selected':''}>— بدون مشرف (يُضاف لاحقًا) —</option>`
      : '<option value="">لا يوجد مشرف — يُضاف لاحقًا</option>';
    updateSupervisorInfo();
  }
  function updateSupervisorInfo(){
    const schId = document.getElementById('f_school').value;
    const sch = state.schools.find(s=>s.id===schId);
    const svId = document.getElementById('f_supervisor').value;
    const sv = sch? sch.supervisors.find(s=>s.id===svId):null;
    const _si = document.getElementById('supervisorInfo');
    if(sv){ _si.style.display=''; _si.innerHTML = `<span>${icon('users',12)} ${escapeHtml(sv.phone||'-')}</span><span>${escapeHtml(sv.email||'-')}</span><span>${escapeHtml(sch.level)}</span>`; }
    else { _si.style.display='none'; _si.innerHTML=''; }
    if(sch && sch.notes){ _si.style.display=''; _si.innerHTML += `<span class="sch-note">${icon('fileText',12)} ${escapeHtml(sch.notes)}</span>`; }
    if(sch){ _si.style.display=''; _si.innerHTML += `<a href="#" class="sch-prof" onclick="openSchoolProfile('${sch.id}');return false;">${icon('school',12)} ملف الجهة</a>`; }
  }
  document.getElementById('f_school').addEventListener('change', refreshSupervisors);
  document.getElementById('f_school').addEventListener('change', ()=>{ try{ updateSupervisorInfo(); }catch(e){} });
  document.getElementById('f_school').addEventListener('change', ()=>{ try{ refreshOrderClashBar(); }catch(e){} });
  document.getElementById('f_supervisor').addEventListener('change', updateSupervisorInfo);
  /* المصدر: التواريخ ← عدد الأيام. وعند تعديل عدد الأيام ← تاريخ الانتهاء. */
  function recalcHoursOnly(){
    const dEl = document.getElementById('f_date'), dToEl = document.getElementById('f_dateTo');
    document.getElementById('f_hoursCount').value =
      computeHours(document.getElementById('f_timeFrom').value, document.getElementById('f_timeTo').value, dEl.value, dToEl.value);
  }
  function recalcDurations(){
    const dEl = document.getElementById('f_date'), dToEl = document.getElementById('f_dateTo');
    const dayEl = document.getElementById('f_daysCount');
    const cell = document.getElementById('f_dateToCell');
    if(cell){ if(dEl.value) cell.removeAttribute('hidden'); else cell.setAttribute('hidden',''); }
    if(!dEl.value){ setDateValue(dToEl,''); dayEl.value=''; recalcHoursOnly(); showAcademicNotes('',''); return; }
    // فعالية ليوم واحد: تاريخ الانتهاء = تاريخ المبادرة وعدد الأيام = 1
    if(!dToEl.value) setDateValue(dToEl, dEl.value);
    if(dToEl.value < dEl.value) setDateValue(dToEl, dEl.value);
    dayEl.value = daysCount(dEl.value, dToEl.value);
    recalcHoursOnly();
    showAcademicNotes(dEl.value, dToEl.value);
  }
  /* تعديل عدد الأيام يعيد حساب تاريخ الانتهاء فورًا */
  function applyDaysCount(){
    const dEl = document.getElementById('f_date'), dToEl = document.getElementById('f_dateTo');
    const dayEl = document.getElementById('f_daysCount');
    const n = parseInt(dayEl.value, 10);
    if(!dEl.value || !n || n < 1) return;
    setDateValue(dToEl, addDaysISO(dEl.value, n - 1));
    recalcHoursOnly();
    showAcademicNotes(dEl.value, dToEl.value);
  }
  /* تنبيهات التقويم المدرسي تظهر مباشرة تحت حقول التاريخ */
  /* التنبيه يظهر في سطر البحث بالأعلى (لا يزيح حقول التاريخ)،
     مع نقطة حالة بجوار التاريخ: حمراء = لا يجوز، خضراء = متاح */
  function showAcademicNotes(d, dTo){
    const notes = checkAcademicDate(d, dTo);
    const blocked = notes.some(n=>n.level==='block');
    const dot = document.getElementById('dateStatusDot');
    if(dot){
      const ok = !!d && !blocked;
      dot.style.display = d ? 'inline-block' : 'none';
      dot.style.background = ok ? '#0B6F50' : '#D92D20';
      dot.style.boxShadow = `0 0 0 3px ${ok?'rgba(11,111,80,.18)':'rgba(217,45,32,.18)'}`;
      dot.title = ok ? 'التاريخ متاح' : 'لا يجوز تنفيذ فعالية في هذا التاريخ';
    }
    const bar = document.getElementById('ordNoteBar');
    if(!bar) return;
    if(!notes.length){ bar.innerHTML=''; bar.style.display='none'; return; }
    const top = notes.find(n=>n.level==='block') || notes.find(n=>n.level==='warn') || notes[0];
    const st = top.level==='block' ? 'background:#FDECEE;border:1px solid #E7A2AC;color:#5A142F;'
            : top.level==='warn'  ? 'background:#FFF7E6;border:1px solid #E5C67A;color:#8A6A1F;'
            :                       'background:#EEF4FB;border:1px solid #B9D2EA;color:#5A142F;';
    const ic = top.level==='block' ? '⛔' : top.level==='warn' ? '⚠️' : 'ℹ️';
    const more = notes.length>1 ? ` (+${notes.length-1})` : '';
    bar.style.display='inline-flex';
    bar.title = notes.map(n=>n.msg).join('\n');
    bar.innerHTML = `<span style="${st}padding:5px 10px;border-radius:8px;font-size:11.5px;line-height:1.35;
      display:inline-block;max-width:520px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ic} ${escapeHtml(top.msg)}${more}</span>`;
  }
  ['f_date','f_dateTo'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input', recalcDurations);
    el.addEventListener('change', recalcDurations);
  });
  /* حقول الوقت تحسب الساعات مباشرة (لا تعتمد على وجود تاريخ) */
  ['f_timeFrom','f_timeTo'].forEach(id=>{
    const el = document.getElementById(id);
    ['input','change'].forEach(ev=>el.addEventListener(ev, ()=>{
      recalcHoursOnly(); refreshTimeView(el); refreshTrainerChips();
    }));
  });
  /* اختيار وقت البداية بلا حصة ← وقت النهاية = ساعة كاملة بعده */
  ['input','change'].forEach(ev=>document.getElementById('f_timeFrom').addEventListener(ev, ()=>{
    const per = document.getElementById('f_period');
    if(per && per.value) return;                    // الحصة تحدد الوقتين
    const tf = document.getElementById('f_timeFrom').value;
    const tt = document.getElementById('f_timeTo');
    if(!tf || tt.value) return;                     // لا نطغى على وقت مُدخل
    const [H,M] = tf.split(':').map(Number);
    const end = ((H + 1) % 24);
    tt.value = `${String(end).padStart(2,'0')}:${String(M).padStart(2,'0')}`;
    refreshTimeView(tt); recalcHoursOnly(); refreshTrainerChips();
  }));
  /* تغيير تاريخ المبادرة يجعل تاريخ الانتهاء نفسه دائمًا (فعالية يوم واحد)،
     ويبقى قابلًا للتعديل يدويًا أو عبر عدد الأيام بعد ذلك */
  ['input','change'].forEach(ev=>document.getElementById('f_date').addEventListener(ev, ()=>{
    const d = document.getElementById('f_date').value;
    if(d){ setDateValue(document.getElementById('f_dateTo'), d); recalcDurations(); }
  }));
  /* إدخال عدد الأيام يعيد حساب تاريخ الانتهاء (يوم واحد = نفس تاريخ البداية) */
  ['input','change'].forEach(ev=>document.getElementById('f_daysCount').addEventListener(ev, applyDaysCount));
  recalcDurations();
  ['f_date','f_dateTo','f_timeTo'].forEach(id=>document.getElementById(id).addEventListener('change', refreshTrainerChips));
  document.getElementById('f_timeFrom').addEventListener('change', (e)=>{
    const v = e.target.value;
    if(v){
      const [h,m] = v.split(':').map(Number);
      const d = new Date(2000,0,1,h,m); d.setHours(d.getHours()+1);
      const hh = String(d.getHours()).padStart(2,'0'), mm = String(d.getMinutes()).padStart(2,'0');
      document.getElementById('f_timeTo').value = `${hh}:${mm}`;
    }
    refreshTrainerChips();
  });
  /* استخراج المرحلة تلقائيًا من اسم المدرسة، مع إمكانية تعديلها يدويًا */
  function detectStage(name){
    const s = (name||'').replace(/[أإآ]/g,'ا');
    if(/جامع(ة|ي)|كلية/.test(s)) return 'جامعي';
    if(/ثانوي/.test(s)) return 'ثانوي';
    if(/اعدادي|إعدادي|متوسط/.test(s)) return 'إعدادي';
    if(/ابتدائي|روضة|تمهيدي/.test(s)) return 'ابتدائي';
    return '';
  }
  const stageEl = document.getElementById('f_stage');
  function syncStageFromSchool(){
    if(stageEl.dataset.manual==='1') return;   // لا نلمسها إن عدّلها المستخدم
    const sel = document.getElementById('f_school');
    const nm = sel.selectedOptions[0] ? sel.selectedOptions[0].textContent : '';
    stageEl.value = detectStage(nm);
  }
  stageEl.addEventListener('change', ()=>{ stageEl.dataset.manual = stageEl.value ? '1' : '0'; });
  document.getElementById('f_school').addEventListener('change', syncStageFromSchool);
  syncStageFromSchool();
  /* التنقل بين الفعاليات */
  const _np = document.getElementById('navPrevOrder'), _nn = document.getElementById('navNextOrder');
  if(_np && navPrev) _np.onclick = ()=>editOrder(navPrev.id);
  if(_nn && navNext) _nn.onclick = ()=>editOrder(navNext.id);

  /* ══ فواصل ورقية: عرض قسم واحد في كل مرة ══ */
  (function(){
    const tabs   = sub.querySelectorAll('[data-ftab]');
    const panels = sub.querySelectorAll('[data-tab]');
    if(!tabs.length) return;
    const show = k=>{
      panels.forEach(p=>{ p.style.display = (p.dataset.tab===String(k)) ? '' : 'none'; });
      tabs.forEach(t=>t.classList.toggle('active', t.dataset.ftab===String(k)));
    };
    tabs.forEach(t=>{ t.onclick = ()=>show(t.dataset.ftab); });
    show(0);
  })();

  /* ══ نسبة الاكتمال والملخّص الذكي — يتحدّثان مع كل إدخال ══ */
  function gvRefresh(){
    const val = id => { const el = document.getElementById(id); return el ? String(el.value||'').trim() : ''; };
    const trainersSel = Array.from(document.querySelectorAll('#trainerChipList input:checked'));
    const reqsSel     = Array.from(document.querySelectorAll('#reqHiddenChecks input:checked'));
    /* الحقول المحتسبة في نسبة الاكتمال */
    const checks = [
      !!val('f_title'), !!val('f_field'), !!val('f_ptype'), !!val('f_date'),
      !!val('f_timeFrom'), !!val('f_timeTo'), !!val('f_count'),
      !!val('f_school'), !!val('f_supervisor'), !!trainersSel.length,
      !!reqsSel.length,                       // الطلبات الإدارية ضمن الاكتمال
    ];
    const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    const bar = document.getElementById('gvBar'), lbl = document.getElementById('gvPct');
    if(bar) bar.style.width = pct + '%';
    if(lbl) lbl.textContent = pct + '%';

    const sc = state.schools.find(x=>x.id===val('f_school'));
    const fd = state.fields.find(x=>x.id===val('f_field'));
    const pt = state.programTypes.find(x=>x.id===val('f_ptype'));
    const sv = sc ? (sc.supervisors||[]).find(x=>x.id===val('f_supervisor')) : null;
    const d1 = val('f_date'), d2 = val('f_dateTo')||d1;
    const days  = d1 ? daysCount(d1,d2) : 0;
    const hours = computeHours(val('f_timeFrom'), val('f_timeTo'), d1, d2);
    const dash = '—';
    const rows = [
      ['fileText','عنوان المبادرة', val('f_title') || dash],
      ['layers','المجال والمسار', [fd&&fd.name, pt&&pt.name].filter(Boolean).join(' · ') || dash],
      ['school', val('f_venue') ? 'الجهة الطالبة' : 'مكان التنفيذ', sc ? sc.name : dash],
      ...(val('f_venue') ? [['school','مكان التنفيذ', val('f_venue')]] : []),
      ['users','المشرف', sv ? (sv.phone ? `${sv.name} — ${sv.phone}` : sv.name) : dash],
      ['calendar','التاريخ', d1 ? (d2!==d1 ? `${fmtDate(d1)} — ${fmtDate(d2)}` : fmtDate(d1)) : dash],
      ['clock','الوقت والمدة', (val('f_timeFrom')||val('f_timeTo'))
        ? `${val('f_timeFrom')} — ${val('f_timeTo')} · ${days} ${dayWord(days)} · ${hours} ساعة` : dash],
      ['users','المستهدفون', val('f_count') || dash],
      ['activity','مقدّمو المبادرة', trainersSel.length
        ? trainersSel.map(c=>{const t=state.trainers.find(x=>x.id===c.value);return t?t.name:'';}).filter(Boolean).join('، ')
        : dash],
      ['clipboard','الطلبات الإدارية', reqsSel.length ? `${reqsSel.length} طلب` : dash],
    ];
    const box = document.getElementById('gvSummary');
    if(box) box.innerHTML = `<h4>${icon('barChart',13)} ملخّص الطلب</h4>` + rows.map(r=>`
      <div class="gv-srow">${icon(r[0],13)}
        <span style="min-width:0;flex:1;"><span class="gv-sk">${escapeHtml(r[1])}</span>
        <span class="gv-sv">${escapeHtml(String(r[2]))}</span></span>
      </div>`).join('');
  }
  sub.addEventListener('input',  gvRefresh);
  sub.addEventListener('change', gvRefresh);
  setTimeout(gvRefresh, 0);

  const ntg = document.getElementById('notesToggle');
  if(ntg){
    const applyNotes = ()=>{
      const w = document.getElementById('notesWrap');
      if(!w) return;
      w.style.display = ntg.checked ? 'block' : 'none';
      w.classList.toggle('on', ntg.checked);
    };
    ntg.addEventListener('change', applyNotes);
    ntg.addEventListener('click', ()=>setTimeout(applyNotes, 0));
    applyNotes();
  }
  refreshSupervisors(); refreshTrainerChips();
  /* فتح/إغلاق قائمة المدربين — تبقى مفتوحة أثناء الاختيار */
  const msBtn = null;
  if(msBtn){
    msBtn.onclick=()=>{
      const w = document.getElementById('trainerMS');
      const open = w.classList.toggle('open');
      msBtn.setAttribute('aria-expanded', open?'true':'false');
    };
  }
  function filterSchoolOptions(){
    const q = document.getElementById('f_schoolSearch').value.trim();
    const cat = document.getElementById('f_placeType').value;
    const levels = cat ? levelsForPlaceType(cat) : [];
    const sel = document.getElementById('f_school');
    const keep = sel.value;
    /* تطبيع عربي ليطابق رغم فروق الهمزات والتاء المربوطة */
    const nz = s => String(s||'').replace(/[\u064B-\u0652\u0640]/g,'')
      .replace(/[أإآا]/g,'ا').replace(/[ىي]/g,'ي').replace(/ة/g,'ه')
      .replace(/\s+/g,' ').trim().toLowerCase();
    const nq = nz(q);
    const matches = (state.schools||[]).filter(s=>{
      const okText  = !nq || nz(`${s.name} ${s.level||''}`).includes(nq);
      const okLevel = !levels.length || levels.includes(s.level||'');
      return okText && okLevel;
    });
    /* إعادة بناء الخيارات — إخفاء <option> لا يعمل على متصفحات الجوال */
    sel.innerHTML = `<option value="">— اختر مكان المبادرة —</option>` +
      matches.map(s=>`<option value="${s.id}" data-level="${escapeHtml(s.level||'')}">${escapeHtml(s.name)}${s.level?` — ${escapeHtml(s.level)}`:''}</option>`).join('');
    /* نُبقي الاختيار الحالي حتى لو خرج من نتيجة البحث */
    if(keep){
      if(!matches.some(s=>s.id===keep)){
        const cur = (state.schools||[]).find(s=>s.id===keep);
        if(cur) sel.insertAdjacentHTML('beforeend',
          `<option value="${cur.id}" data-level="${escapeHtml(cur.level||'')}">${escapeHtml(cur.name)}${cur.level?` — ${escapeHtml(cur.level)}`:''}</option>`);
      }
      sel.value = keep;
    }
    const cnt = document.getElementById('f_schoolCount');
    if(cnt) cnt.textContent = nq ? `${matches.length} نتيجة` : '';
  }
  document.getElementById('f_schoolSearch').addEventListener('input', filterSchoolOptions);
  /* مزامنة نسختَي "مكان التنفيذ" — التعديل في أيٍّ منهما ينعكس على الآخر */
  const ptTop = document.getElementById('f_placeTypeTop');
  const ptBottom = document.getElementById('f_placeType');
  function onPlaceTypeChanged(val){
    if(ptTop.value !== val) ptTop.value = val;
    if(ptBottom.value !== val) ptBottom.value = val;
    filterSchoolOptions();
    togglePeriodField();
  }
  ptTop.addEventListener('change', e=>onPlaceTypeChanged(e.target.value));
  ptBottom.addEventListener('change', e=>onPlaceTypeChanged(e.target.value));

  /* حقل الحصة يظهر للمدارس فقط؛ ولغيرها يُختار الوقت يدويًا */
  function isSchoolPlace(){
    const v = ptTop.value || '';
    if(v) return /مدرسة|مدارس/.test(v);
    // بلا تصنيف: نستنتج من الجهة المختارة نفسها
    const sel = document.getElementById('f_school');
    const lvl = sel.selectedOptions[0] ? (sel.selectedOptions[0].dataset.level||'') : '';
    return /مدرسة|مدارس|ابتدائي|إعدادي|ثانوي|خاصة/.test(lvl);
  }
  function togglePeriodField(){
    const wrap = document.getElementById('f_periodWrap');
    const show = (!ptTop.value && !document.getElementById('f_school').value) || isSchoolPlace();
    wrap.style.display = show ? '' : 'none';
    if(!show) document.getElementById('f_period').value = '';
  }
  document.getElementById('f_period').addEventListener('change', e=>{
    const p = SCHOOL_PERIODS[Number(e.target.value)];
    if(!p) return;
    const tf = document.getElementById('f_timeFrom'), tt = document.getElementById('f_timeTo');
    tf.value = p.from; tt.value = p.to;
    refreshTimeView(tf); refreshTimeView(tt);      // تحديث النص المعروض
    recalcHoursOnly(); recalcDurations();
    refreshTrainerChips();
  });
  document.getElementById('f_school').addEventListener('change', togglePeriodField);
  togglePeriodField();
  if(editing){
    const curSchool = state.schools.find(s=>s.id===editing.schoolId);
    if(curSchool){ document.getElementById('f_placeType').value = placeTypeLabel(curSchool.level); filterSchoolOptions(); }
  }

  const reqBox = document.getElementById('adminReqList');
  const selectedReqIds = new Set(editing && editing.adminRequests ? editing.adminRequests : []);
  function renderReqChips(){
    const categories = ['إداري','إعلامي','ضيافة'];
    function selectedTagsHtml(){
      const tags = Array.from(selectedReqIds).map(id=>{
        const r = state.adminRequestsList.find(x=>x.id===id);
        return r ? `<span class="req-tag">${escapeHtml(r.name)}<a href="#" data-remove-id="${id}" title="حذف من الطلبات">🗑️</a></span>` : '';
      }).join(' ');
      return tags || '';
    }
    /* بطاقات قابلة للفتح — تبقى مفتوحة بعد الاختيار */
    reqBox.innerHTML = `
      <div class="ms-wrap open always-open" id="reqMS">
        <div class="ms-head static">
          <span class="ms-ic">${icon('clipboard',16)}</span>
          <span class="ms-label" id="reqMSLabel">الطلبات الإدارية</span>
          <span class="ms-n" id="reqMSCount">${selectedReqIds.size}</span>
        </div>
        <div class="ms-body">
          ${categories.map(cat=>{
            const items = state.adminRequestsList.filter(r=>(r.category||'إداري')===cat);
            const chosen = items.filter(r=>selectedReqIds.has(r.id)).length;
            return `<section class="acc-card sub open" data-cat="${escapeHtml(cat)}">
              <div class="acc-head static">
                <span class="acc-t">${escapeHtml(cat)}</span>
                <span class="acc-n${chosen?' on':''}">${chosen}</span>
              </div>
              <div class="acc-body">
                ${items.length ? items.map(r=>`
                  ${(function(){
                    /* متاح ما لم يكن مطلوبًا لفعالية أخرى في نفس التاريخ */
                    const d = currentDate();
                    const clash = d ? state.orders.find(o=>
                      (!editing || o.id!==editing.id) && isLiveOrder(o) && d>=(o.date||'') && d<=orderEnd(o) && (o.adminRequests||[]).includes(r.id)) : null;
                    const taken = !!clash, free = !!d && !taken;
                    return `<label class="opt-row acc-item${selectedReqIds.has(r.id)?' on':''}${taken?' is-busy':''}${free?' is-free':''}"
                      data-id="${r.id}" title="${taken?escapeHtml('مطلوب في: '+(clash.title||'')):''}">
                      <input type="checkbox" ${selectedReqIds.has(r.id)?'checked':''}>
                      <span class="opt-box">${icon('check',11)}</span>
                      <span class="opt-txt">${escapeHtml(r.name)}</span>
                      ${taken ? `<span class="opt-tag busy">غير متاح</span>`
                              : free ? `<span class="opt-tag free">متاح</span>` : ''}
                    </label>`;
                  })()}`).join('')
                  : `<div class="helper" style="padding:9px 13px;">لا توجد بنود في هذا القسم</div>`}
              </div>
            </section>`;
          }).join('')}
        </div>
      </div>
      <div id="reqSelectedTags" style="display:flex;flex-wrap:wrap;gap:8px;">${selectedTagsHtml()}</div>
      <div id="reqHiddenChecks" style="display:none;">${state.adminRequestsList.map(r=>`<input type="checkbox" value="${r.id}" ${selectedReqIds.has(r.id)?'checked':''}>`).join('')}</div>
    `;
    function syncHiddenChecks(){
      reqBox.querySelectorAll('#reqHiddenChecks input[type=checkbox]').forEach(cb=>{ cb.checked = selectedReqIds.has(cb.value); });
      document.getElementById('reqSelectedTags').innerHTML = selectedTagsHtml();
      document.getElementById('reqSelectedTags').querySelectorAll('a[data-remove-id]').forEach(a=>{
        a.addEventListener('click', (e)=>{ e.preventDefault(); selectedReqIds.delete(a.dataset.removeId); syncHiddenChecks(); });
      });
    }
    /* فتح البطاقة عند النقر — وتبقى مفتوحة بعد الإدخال */
    const rBtn = null;
    if(rBtn) rBtn.onclick=()=>{
      const w=document.getElementById('reqMS');
      const open=w.classList.toggle('open');
      rBtn.setAttribute('aria-expanded', open?'true':'false');
    };
    function refreshReqLabel(){
      const ct=document.getElementById('reqMSCount'), lb=document.getElementById('reqMSLabel');
      if(!ct||!lb) return;
      ct.textContent = selectedReqIds.size; ct.classList.toggle('on', selectedReqIds.size>0);
      lb.textContent = selectedReqIds.size ? `${selectedReqIds.size} طلب إداري محدد` : 'اختر قسم الطلبات الإدارية';
    }
    refreshReqLabel();
    /* الأقسام مفتوحة دائمًا — لا حاجة لمعالج الطي */
    /* اختيار بند يضيفه أو يزيله والبطاقة تبقى مفتوحة */
    reqBox.querySelectorAll('.acc-item input[type=checkbox]').forEach(cb=>{
      cb.onchange=()=>{
        const lab = cb.closest('.acc-item'); const id = lab.dataset.id;
        if(cb.checked){
          const date = currentDate();
          if(date){
            const conflictOrder = state.orders.find(o=> (!editing || o.id!==editing.id) && isLiveOrder(o) && date>=(o.date||'') && date<=orderEnd(o) && (o.adminRequests||[]).includes(id));
            if(conflictOrder){
              const ok = confirm(`تنبيه: هذا الطلب الإداري "${state.adminRequestsList.find(r=>r.id===id)?.name||''}" مطلوب مسبقًا لبرنامج آخر (${conflictOrder.title}) في نفس التاريخ. هل تريد المواصلة؟`);
              if(!ok){ cb.checked=false; return; }
            }
          }
          selectedReqIds.add(id);
        } else selectedReqIds.delete(id);
        lab.classList.toggle('on', cb.checked);
        const card = lab.closest('.acc-card');
        const n = card.querySelectorAll('.acc-item input:checked').length;
        const nb = card.querySelector('.acc-n'); nb.textContent = n; nb.classList.toggle('on', n>0);
        syncHiddenChecks();
      };
    });
    syncHiddenChecks();
  }
  renderReqChips();

  if(editing) document.getElementById('cancelEditBtn').onclick=()=>{editingOrderId=null; render();};

  async function doSaveOrder(printMode){
    const title=document.getElementById('f_title').value.trim();
    const date=document.getElementById('f_date').value, timeFrom=document.getElementById('f_timeFrom').value, timeTo=document.getElementById('f_timeTo').value;
    const dateTo=document.getElementById('f_dateTo').value || date;   // افتراضيًا نفس تاريخ البداية
    const schoolId=document.getElementById('f_school').value;
    const supervisorId=document.getElementById('f_supervisor').value;
    const fieldId=document.getElementById('f_field').value, ptypeId=document.getElementById('f_ptype').value;
    const participantsCount=document.getElementById('f_count').value;
    const trainerIds = Array.from(document.getElementById('trainerChipList').querySelectorAll('input:checked')).map(i=>i.value);
    const checkedReqs = Array.from(reqBox.querySelectorAll('#reqHiddenChecks input:checked')).map(i=>i.value);
    const resourceIds = Array.from(document.querySelectorAll('#resChecks input:checked')).map(i=>i.value);
    const benefTxt = formBenef();

    // التحقق من الحقول الإجبارية في كل الأقسام
    if(!fieldId){ toast('يرجى اختيار مجال المبادرة'); return; }
    if(!ptypeId){ toast('يرجى اختيار مسار المبادرة'); return; }
    if(!title){ toast('يرجى إدخال عنوان المبادرة'); return; }
    if(!date){ toast('يرجى إدخال تاريخ المبادرة'); return; }
    // تاريخ الانتهاء يُعبَّأ تلقائيًا من تاريخ البداية، فلا حاجة لإلزام المستخدم به
    if(!timeFrom){ toast('يرجى إدخال وقت المبادرة (من)'); return; }
    if(!timeTo){ toast('يرجى إدخال وقت المبادرة (إلى)'); return; }
    if(participantsCount===''){ toast('يرجى إدخال عدد المستهدفين'); return; }
    /* تنبيه الطلب المكرر: نفس الجهة/المكان وعنوان مشابه خلال ±30 يومًا */
    if(!editing){
      const venueV = ((document.getElementById('f_venue')||{}).value || '').trim();
      const sim = findSimilarOrders(title, schoolId, venueV, date, null);
      if(sim.length && !confirm('⚠️ يوجد طلب مشابه لنفس الجهة خلال شهر من هذا التاريخ:\n\n'
        + sim.slice(0,5).map(o=>`• أمر ${o.serial} — ${o.title} (${fmtDateRaw(o.date)})`).join('\n')
        + '\n\nهل هذا طلب جديد فعلًا وليس تكرارًا؟')) return;
    }
    /* فعالية أسبوعية متكررة: نعرض المواعيد كلها للمراجعة ثم ننشئ أمر تكليف لكل موعد */
    const repEl = document.getElementById('f_repeat');
    if(!editing && repEl && repEl.checked){
      const until = document.getElementById('f_repUntil').value;
      if(!until){ toast('حدّد تاريخ انتهاء التكرار الأسبوعي'); return; }
      if(until < date){ toast('تاريخ انتهاء التكرار قبل تاريخ البداية'); return; }
      if(!schoolId){ toast('يرجى اختيار مكان المبادرة'); return; }
      if(!trainerIds.length){ toast('يرجى اختيار مقدم مبادرة واحد على الأقل'); return; }
      if(!checkedReqs.length){ toast('يرجى اختيار طلب إداري واحد على الأقل'); return; }
      openRecurringPreview({
        title, fieldId, participantsCount, date, dateTo: dateTo||date, timeFrom, timeTo, programTypeId: ptypeId,
        schoolId, supervisorId, trainerIds,
        venue: ((document.getElementById('f_venue')||{}).value || '').trim(),
        requesterNote: document.getElementById('f_reqNote').value, adminNote: document.getElementById('f_adminNote').value,
        adminRequests: checkedReqs, resourceIds, benef: benefTxt.benef, gender: benefTxt.gender,
      }, until, printMode);
      return;
    }
    // التحقق من التقويم المدرسي قبل الحفظ
    const acNotes = checkAcademicDate(date, dateTo);
    const blockers = acNotes.filter(x=>x.level==='block');
    if(blockers.length){
      const ok = confirm('⛔ تعارض مع التقويم المدرسي:\n\n' + blockers.map(x=>'• '+x.msg).join('\n\n')
        + '\n\nهل تريد المتابعة على أي حال؟');
      if(!ok) return;
    } else {
      const warns = acNotes.filter(x=>x.level==='warn');
      if(warns.length){
        const ok = confirm('⚠️ تنبيه:\n\n' + warns.map(x=>'• '+x.msg).join('\n\n') + '\n\nهل تريد المتابعة؟');
        if(!ok) return;
      }
    }
    if(!schoolId){ toast('يرجى اختيار مكان المبادرة'); return; }
    if(!supervisorId){
      const ok = confirm('لم يُحدَّد مشرف لهذه الفعالية.\n\nسيتم الحفظ بدون مشرف، ويمكنك إضافته لاحقًا عند الحصول على رقمه.\n\nمتابعة؟');
      if(!ok) return;
    }
    if(!trainerIds.length){ toast('يرجى اختيار مقدم مبادرة واحد على الأقل'); return; }
    if(!checkedReqs.length){ toast('يرجى اختيار طلب إداري واحد على الأقل'); return; }

    if(trainerIds.length && date){
      const lvs = trainerIds.map(tid=>({t:state.trainers.find(x=>x.id===tid), l:trainerLeaveOn(tid, date, dateTo)})).filter(x=>x.l);
      if(lvs.length && !confirm('⛔ مقدّم في إجازة خلال موعد الفعالية:\n\n' + lvs.map(x=>`• ${x.t?x.t.name:''}: ${leaveTxt(x.l)}`).join('\n') + '\n\nهل تريد المتابعة؟')) return;
    }
    if(trainerIds.length && date){
      const conflict = anyTrainerConflict(trainerIds, date, timeFrom, timeTo, editing?editing.id:null, dateTo);
      if(conflict){
        const t = state.trainers.find(x=>x.id===conflict.trainerId);
        const ok = confirm(`تنبيه: "${t?t.name:'أحد المقدّمين'}" لديه فعالية أخرى بنفس الفترة:\n${conflict.order.title} — ${fmtDate(conflict.order.date)}\n\nهل تم التنسيق مع الجهة وتريد المتابعة؟`);
        if(!ok) return;
      }
    }
    if(resourceIds.length && date){
      const rc = resourceConflicts(resourceIds, date, dateTo, editing?editing.id:null);
      if(rc.length){
        const ok = confirm('⛔ مورد محجوز في هذا التاريخ:\n\n' + rc.map(x=>`• ${x.res.name}: أمر ${x.order.serial} — ${x.order.title} (${fmtDateRaw(x.order.date)})`).join('\n')
          + '\n\nالحفظ يعني حجز المورد لجهتين في اليوم نفسه. هل تريد المتابعة؟');
        if(!ok) return;
      }
    }
    if(schoolId && date){
      const schConf = schoolSameDay(schoolId, date, editing?editing.id:null);
      if(schConf){
        const ok = confirm(`تنبيه: توجد فعالية أخرى مجدولة في نفس المدرسة بنفس التاريخ (رقم ${schConf.serial} - ${schConf.title}). هل ترغب بالمتابعة؟`);
        if(!ok) return;
      } else {
        // تنبيه أسبوعي: فعالية أخرى بنفس المدرسة خلال الأسبوع من مقدّم مختلف
        const wk = schoolSameWeek(schoolId, date, editing?editing.id:null, trainerIds);
        if(wk.length){
          const lines = wk.slice(0,5).map(o=>`• رقم ${o.serial} — ${o.title} (${fmtDate(o.date)}) — ${trainerNames(o)||'بلا مقدّم'}`).join('\n');
          const ok = confirm(`⚠️ توجد ${wk.length} فعالية أخرى في نفس المدرسة خلال نفس الأسبوع من مقدّم آخر:\n\n${lines}\n\nهل ترغب بالمتابعة؟`);
          if(!ok) return;
        }
      }
    }
    const orderData = {
      title, fieldId, participantsCount,
      date, dateTo: dateTo||'', timeFrom, timeTo, programTypeId: ptypeId,
      schoolId, supervisorId, trainerIds,
      venue: ((document.getElementById('f_venue')||{}).value || '').trim(),
      requesterNote: document.getElementById('f_reqNote').value, adminNote: document.getElementById('f_adminNote').value,
      adminRequests: checkedReqs, resourceIds, benef: benefTxt.benef, gender: benefTxt.gender,
    };
    if(editing){ if(window.__catProgId!=null) orderData.programId = window.__catProgId||editing.programId||''; Object.assign(editing, orderData); logAudit('edit', editing); }
    else {
      orderData.id = uid(); orderData.createdAt = Date.now();
      if(window.__catProgId) orderData.programId = window.__catProgId;
      const maxSerialThisYear = nextOrderSerial() - 1;
      orderData.serial = maxSerialThisYear + 1;
      orderData.completionStatus=''; orderData.notDoneReason=''; orderData.supervisorRating=0; orderData.schoolRating=0; orderData.studentsRating=0; orderData.recommendSchool=''; orderData.evaluatedBy=''; orderData.status='active';
      state.orders.push(orderData);
      logAudit('create', orderData);
    }
    await saveState();
    if(!editing && window.__bookingReqId){ const rq = window.__bookingReqId; window.__bookingReqId = null; try{ bookingMarkApproved(rq, orderData); }catch(e){} }
    if(!editing) clearOrderDraft();
    toast(editing?'تم حفظ التعديلات':'تم حفظ الطلب');
    const savedId = editing ? editing.id : orderData.id;
    if(document.getElementById('orderDrawer')){ closeOrderDrawer(true); editingOrderId=null; render(); }
    else { editingOrderId=null; orderSubTab='list'; if(currentPage==='newOrder') currentPage='ordersList'; render(); }
    // الطباعة بعد اكتمال الحفظ والعرض
    if(printMode==='school') setTimeout(()=>printOrderSchoolCopy(savedId), 150);
    else if(printMode==='admin') setTimeout(()=>printOrderAdminCopy(savedId), 150);
  }
  { const ff = document.getElementById('f_field'); if(ff) ff.addEventListener('change', ()=>{ try{ refreshTrainerChips(); }catch(e){} }); }
  /* اقتراح مسار المبادرة من العنوان (للطلب الجديد فقط، ولا يغيّر اختيارك اليدوي) */
  (function(){
    const t = document.getElementById('f_title'), pt = document.getElementById('f_ptype');
    if(!t || !pt || editing) return;
    let auto = true;      /* القائمة بلا خيار فارغ: نعدّها «غير مختارة» حتى يغيّرها المستخدم بنفسه */
    const hint = document.createElement('div'); hint.className = 'pf-hint'; pt.insertAdjacentElement('afterend', hint);
    pt.addEventListener('change', ()=>{ if(!pt.__auto){ auto = false; hint.innerHTML = ''; } pt.__auto = false; });
    t.addEventListener('input', ()=>{ clearTimeout(t.__pt); t.__pt = setTimeout(()=>{
      if(!auto) return;
      const sg = suggestPath(t.value, state.orders);
      if(sg && sg.conf!=='low' && pt.value!==sg.id){ pt.__auto = true; pt.value = sg.id; pt.dispatchEvent(new Event('change')); auto = true;
        hint.innerHTML = `${icon('sparkles',11)} مقترح من العنوان`; }
    }, 450); });
  })();
  /* الموارد: فحص فوري للحجز + اقتراح المصلى المتنقل */
  (function(){
    const box = document.getElementById('resChecks'); if(!box) return;
    const warn = document.getElementById('resWarn');
    const check = ()=>{
      const ids = Array.from(box.querySelectorAll('input:checked')).map(i=>i.value);
      box.querySelectorAll('.res-chip').forEach(l=>l.classList.toggle('on', l.querySelector('input').checked));
      const d = (document.getElementById('f_date')||{}).value, dt = (document.getElementById('f_dateTo')||{}).value || d;
      if(!ids.length || !d){ warn.hidden = true; return; }
      const rc = resourceConflicts(ids, d, dt, editing?editing.id:null);
      warn.hidden = !rc.length;
      warn.innerHTML = rc.map(x=>`${icon('ban',13)} <b>${escapeHtml(x.res.name)}</b> محجوز في ${fmtDateRaw(x.order.date)} — أمر ${x.order.serial} (${escapeHtml(x.order.title||'')})`).join('<br>');
    };
    box.addEventListener('change', check);
    ['f_date','f_dateTo','f_daysCount'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('change', check); });
    const fEl = document.getElementById('f_field');
    if(fEl) fEl.addEventListener('change', ()=>{
      const f = state.fields.find(x=>x.id===fEl.value); if(!f || !/المصلى/.test(f.name)) return;
      const r = (state.resources||[]).find(x=>/المصلى/.test(x.name)); if(!r) return;
      const cb = box.querySelector(`input[value="${r.id}"]`); if(cb && !cb.checked){ cb.checked = true; check(); }
    });
    check();
  })();
  /* تفصيل المستهدفين يملأ العدد الإجمالي */
  (function(){
    const ids = ['f_bStudents','f_bTeachers','f_bParents','f_bOthers'];
    const cnt = document.getElementById('f_count'); if(!cnt) return;
    ids.forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('input', ()=>{
      const sum = ids.reduce((s,k)=>s+(Number((document.getElementById(k)||{}).value)||0),0);
      if(sum>0){ cnt.value = sum; cnt.dispatchEvent(new Event('input')); cnt.dispatchEvent(new Event('change')); }
    }); });
  })();
  /* خيار التكرار الأسبوعي */
  (function(){
    const rp = document.getElementById('f_repeat'); if(!rp) return;
    const opts = document.getElementById('f_repOpts'), info = document.getElementById('f_repInfo'),
          until = document.getElementById('f_repUntil'), dEl = document.getElementById('f_date'),
          boxEl = document.getElementById('f_repBox');
    const upd = ()=>{
      opts.hidden = !rp.checked; boxEl.classList.toggle('on', rp.checked);
      const d = dEl.value, u = until.value;
      if(!rp.checked){ info.textContent=''; return; }
      if(!d){ info.textContent = 'حدّد تاريخ المبادرة أولًا'; return; }
      if(!u){ info.textContent = `كل يوم ${dayNameOf(d)}`; return; }
      let n=0; for(let x=d; x<=u && n<200; x=addDaysISO(x,7)) n++;
      info.innerHTML = `كل يوم <b>${dayNameOf(d)}</b> · <b>${n}</b> ${n>10||n<3?'موعدًا':'مواعيد'}`;
    };
    rp.onchange = upd; until.onchange = upd; dEl.addEventListener('change', upd);
    /* اختيار مجال المصلى المتنقل يقترح التكرار تلقائيًا */
    const fEl = document.getElementById('f_field');
    if(fEl) fEl.addEventListener('change', ()=>{
      const f = state.fields.find(x=>x.id===fEl.value);
      if(f && /المصلى/.test(f.name) && !rp.checked){ rp.checked = true; upd();
        toast('فعّلنا التكرار الأسبوعي — حدّد تاريخ انتهائه'); }
    });
    upd();
  })();
  document.getElementById('saveOrderBtn').onclick = ()=>doSaveOrder(null);
  document.getElementById('saveOrderPrintBtn').onclick = ()=>doSaveOrder('school');
  document.getElementById('saveOrderPrintAdminBtn').onclick = ()=>doSaveOrder('admin');
  try{ wizardizeOrderForm(sub, editing); const op = sub.closest('.orders-page'); if(op && sub.querySelector('.wz')) op.classList.add('has-wz'); }catch(e){ console.error('wizard', e); }
}

/* عرض تفاصيل الفعالية للاطّلاع فقط — بلا تعديل */
/* ══════════════════════════════════════════════════════════════
   معالج طلب الفعالية (٦ خطوات) — يُعيد ترتيب حقول النموذج نفسها
   (نفس المعرّفات والأحداث وآلية الحفظ) داخل خطوات متتابعة،
   مع معاينة جانبية ونسبة اكتمال وحفظ تلقائي كمسودة على هذا الجهاز.
   ══════════════════════════════════════════════════════════════ */
const WZ_DRAFT_KEY = 'order_draft_v1';
function clearOrderDraft(){ try{ localStorage.removeItem(WZ_DRAFT_KEY); }catch(e){} }
function wizardizeOrderForm(sub, editing){
  if(!sub || sub.id!=='orderSubContent' || !document.getElementById('f_title')) return;
  const $ = id=>document.getElementById(id);
  const val0 = id=>{ const el = document.getElementById(id); return el ? String(el.value||'').trim() : ''; };
  const tdOf = id=>{ const el = $(id); return el ? (el.tagName==='TD' ? el : el.closest('td')) : null; };
  const key = editing ? editing.id : 'new';
  const fresh = window.__wzKey!==key || window.__wzLeft!==false;
  window.__wzKey = key; window.__wzLeft = false;
  if(fresh) window.__wzStep = 0;
  const visited = fresh ? new Set([0]) : (window.__wzVisited || new Set([0]));
  window.__wzVisited = visited;

  const STEPS = [
    {t:'البيانات الأساسية', d:'نوع الطلب، المجال، المسار والعنوان', ic:'fileText'},
    {t:'الموعد والتنفيذ',  d:'التاريخ والوقت والمدة ومقدّمو المبادرة', ic:'calendar'},
    {t:'المكان والجهات',   d:'نوع الجهة والعدد المتوقع والجهة المستفيدة والمشرف', ic:'school'},
    {t:'المرفقات والمتطلبات', d:'الطلبات الإدارية والملاحظات', ic:'paperclip'},
    {t:'المراجعة والإرسال', d:'مراجعة كافة البيانات وإرسال الطلب', ic:'checkCircle'},
  ];
  const TIPS = [
    ['اختر المجال والمسار الأقرب لمحتوى المبادرة.','اكتب عنوانًا واضحًا يعبّر عن الفعالية — يقترح النظام المسار من العنوان.'],
    ['تأكد من توفر الوقت المناسب لدى الجهة.','عدد الأيام يحسب تاريخ الانتهاء تلقائيًا.','المقدّم المشغول في نفس الوقت يظهر «مشغول».'],
    ['ابحث باسم الجهة أو صنّفها حسب نوع المكان.','اختر «مكان التنفيذ الفعلي» فقط إن كان خارج مقر الجهة.','المورد لا يُحجز لجهتين في اليوم نفسه.'],
    ['اختر ما يحتاجه الفريق لتجهيز يوم الفعالية.','الملاحظات تظهر في نسختي أمر التكليف.'],
    ['راجع كل قسم — يمكنك التعديل بالضغط على «تعديل».','بعد الحفظ يمكنك الطباعة للجهة الطالبة أو للإدارة.'],
  ];

  /* ── بناء الهيكل ── */
  const wz = document.createElement('div');
  wz.className = 'wz';
  wz.innerHTML = `
    <nav class="wz-stepper" aria-label="مراحل الطلب">
      ${STEPS.map((s,i)=>`<button type="button" class="wz-st" data-go="${i}" aria-label="الخطوة ${i+1}: ${escapeHtml(s.t)}">
        <span class="n"><b>${i+1}</b>${icon('check',15)}</span><span class="t">${escapeHtml(s.t)}</span></button>`).join('<span class="wz-ln" aria-hidden="true"></span>')}
    </nav>
    <div class="wz-layout">
      <div class="wz-main">
        <div class="wz-alerts" id="wzAlerts"></div>
        ${STEPS.map((s,i)=>`<section class="wz-step" data-s="${i}" hidden>
          <header class="wz-sh"><span class="ic">${icon(s.ic,22)}</span>
            <span class="tx"><h3>${escapeHtml(s.t)}</h3><i>${escapeHtml(s.d)}</i></span>
            <span class="wz-of">الخطوة ${i+1} من ${STEPS.length}</span></header>
          <div class="wz-body" data-body="${i}"></div></section>`).join('')}
      </div>
      <aside class="wz-prev" aria-label="معاينة الطلب">
        <div class="wz-pv-h">${icon('eye',17)}<span><b>معاينة الطلب</b><i>مراجعة فورية للبيانات المدخلة</i></span></div>
        <div class="wz-ring"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="33" class="bg"/><circle cx="40" cy="40" r="33" class="fg" id="wzRing"/></svg>
          <span class="p" id="wzPct">0%</span><span class="l"><b>اكتمال الطلب</b><i id="wzPctTx"></i><span class="bar"><i id="wzBar"></i></span></span></div>
        <div class="wz-pv-rows" id="wzPv"></div>
        <div class="wz-save" id="wzSaveSt"></div>
        <div class="wz-tips"><div class="h">${icon('checkCircle',14)} نصائح لهذه الخطوة</div><ul id="wzTips"></ul></div>
      </aside>
    </div>
    <div class="wz-bar">
      <button type="button" class="pk-btn" id="wzCancel">${icon('x',15)} ${editing?'إلغاء التعديل':'إلغاء الطلب'}</button>
      <span class="wz-bar-st" id="wzBarSt"></span>
      <span class="wz-auto" id="wzAuto" hidden>${icon('refresh',14)}<span></span><button type="button">إلغاء</button></span>
      <span class="sp">
        ${editing?'':`<button type="button" class="pk-btn" id="wzDraft">${icon('save2',15)} حفظ كمسودة</button>`}
        <button type="button" class="pk-btn" id="wzPrev">${icon('chevronRight',15)} السابق</button>
        <button type="button" class="pk-btn pri" id="wzNext">التالي ${icon('chevronLeft',15)}</button>
      </span>
    </div>`;
  const nav = sub.querySelector('.ord-nav');
  (nav ? nav.after(wz) : sub.prepend(wz));
  { const bar = sub.closest('.orders-page') ? sub.closest('.orders-page').querySelector(':scope > .tabs') : null;
    const ttl = bar ? bar.querySelector('#ordPageTitle') : null;
    if(nav && ttl){ nav.classList.add('in-top'); ttl.after(nav); } }
  const body = i=>wz.querySelector(`[data-body="${i}"]`);
  const grp = (i, title, ic, cls)=>{ const g = document.createElement('div'); g.className = 'wz-grp'+(cls?' '+cls:'');
    g.innerHTML = `<div class="wz-gt">${icon(ic,15)} <span>${escapeHtml(title)}</span><span class="wz-ga"></span></div><div class="wz-grid"></div>`;
    body(i).appendChild(g); return g; };
  const put = (g, ...nodes)=>nodes.forEach(n=>{ if(n) g.querySelector('.wz-grid').appendChild(n); });
  const act = (g, ...nodes)=>nodes.forEach(n=>{ if(n) g.querySelector('.wz-ga').appendChild(n); });
  const btnBy = sel=>sub.querySelector(sel);

  /* ① البيانات الأساسية */
  { const g0 = grp(0, 'تصنيف المبادرة', 'layers', 'cols-2');
    put(g0, tdOf('f_field'), tdOf('f_ptype'));
    act(g0, btnBy('[onclick="quickAddField()"]'), btnBy('[onclick="quickAddPType()"]'));
    const g1 = grp(0, 'عنوان المبادرة', 'fileText', 'cols-1'); put(g1, tdOf('f_title'));
    const info = document.createElement('div'); info.className = 'wz-note';
    info.innerHTML = `${icon('info',15)} <span>أمر التكليف: <b>${editing ? escapeHtml(String(editing.serial)) : 'يُنشأ تلقائيًا عند الحفظ'}</b></span>`;
    body(0).appendChild(info); }
  /* ② الموعد والتنفيذ */
  { const g1 = grp(1, 'تاريخ التنفيذ', 'calendar', 'cols-3'); put(g1, tdOf('f_date'), $('f_dateToCell'), tdOf('f_daysCount'));
    const av = document.createElement('div'); av.id = 'wzDateAvail'; av.className = 'wz-avail'; av.hidden = true; g1.appendChild(av);
    const g2 = grp(1, 'وقت التنفيذ', 'clock', 'cols-4'); put(g2, $('f_periodWrap'), tdOf('f_timeFrom'), tdOf('f_timeTo'), tdOf('f_hoursCount'));
    const rb = sub.querySelector('.rep-box');
    if(rb){ const g3 = grp(1, 'خيارات إضافية', 'refresh', 'cols-1'); g3.querySelector('.wz-grid').appendChild(rb); }
    const ms = $('trainerMS'); const po = ms ? ms.closest('.pick-one') : null;
    const g4 = grp(1, 'منفذو المبادرة', 'users', 'cols-1');
    if(po){ const help = po.nextElementSibling; g4.querySelector('.wz-grid').appendChild(po); if(help && help.classList.contains('helper')) g4.querySelector('.wz-grid').appendChild(help); }
    act(g4, btnBy('[onclick="quickAddTrainer()"]')); }
  /* ③ المكان والجهات */
  { const g0 = grp(2, 'نوع الجهة والمستفيدون ومكان التنفيذ', 'building', 'cols-3');
    const ptTop = $('f_placeTypeTop'), ptBot = $('f_placeType');
    if(ptTop.options[0] && !ptTop.options[0].value) ptTop.options[0].textContent = '-- اختر نوع الجهة --';
    /* عند التعديل: نوع الجهة من النسخة السفلية أو من مستوى الجهة المختارة */
    if(!ptTop.value){
      let v = ptBot && ptBot.value;
      if(!v){ const sc = state.schools.find(x=>x.id===val0('f_school')); if(sc && typeof placeTypeLabel==='function') v = placeTypeLabel(sc.level); }
      if(v && Array.from(ptTop.options).some(o=>o.value===v)){ ptTop.value = v; if(ptBot) ptBot.value = v; }
    }
    const ptTd = tdOf('f_placeTypeTop'); ptTd.querySelector('label') && (ptTd.querySelector('label').innerHTML = `${icon('building',13)} نوع الجهة <b class="wz-req">*</b>`);
    const cTd = tdOf('f_count'); cTd.querySelector('label') && (cTd.querySelector('label').innerHTML = `${icon('users',13)} العدد المتوقع للمستفيدين <b class="wz-req">*</b>`);
    put(g0, ptTd, cTd, tdOf('f_venue')); { const rs = tdOf('resChecks'); if(rs){ rs.classList.add('wz-full'); put(g0, rs); } }
    const hid = document.createElement('div'); hid.hidden = true; hid.append(tdOf('f_placeType'));
    const bd = sub.querySelector('details.benef-box'); if(bd) hid.append(bd);
    g0.appendChild(hid);
    const g1 = grp(2, 'الجهة المستفيدة والمشرف', 'school', 'cols-3');
    const sr = document.createElement('div'); sr.className = 'wz-search';
    const ssI = $('f_schoolSearch'), ssC = $('f_schoolCount');
    g1.insertBefore(sr, g1.querySelector('.wz-grid'));
    sr.innerHTML = icon('search',16); sr.append(ssI, ssC);
    ssI.placeholder = 'ابحث عن الجهة بالاسم أو المرحلة...';
    put(g1, tdOf('f_school'), tdOf('f_stage'), tdOf('f_supervisor'));
    act(g1, btnBy('[onclick="quickAddPlaceType()"]'), $('f_addSchoolBtn'), btnBy('[onclick="quickAddSupervisor()"]'));
    const si = $('supervisorInfo'); if(si) g1.appendChild(si);
  }
  /* ④ المرفقات والمتطلبات — بطاقات الأقسام (الإدارية، الإعلامية، الضيافة) */
  { const g = grp(3, 'الطلبات الإدارية والإعلامية والضيافة', 'clipboard', 'cols-1 wz-reqs'); put(g, $('adminReqList'));
    act(g, btnBy('[onclick="quickAddAdminRequest()"]'));
    const g2 = grp(3, 'ملاحظات عامة', 'fileText', 'cols-1'); put(g2, tdOf('notesToggle')); }
  /* ⑤ المراجعة والإرسال */
  { const rv = document.createElement('div'); rv.id = 'wzReview'; body(4).appendChild(rv);
    const sb = sub.querySelector('.save-bar'); if(sb){ sb.classList.add('wz-final'); body(4).appendChild(sb); } }
  /* التنبيهات أعلى المعالج، وإخفاء الهيكل القديم */
  const cb = $('ordClashBar'); if(cb) $('wzAlerts').appendChild(cb);
  sub.querySelectorAll(':scope > .gv-progress, :scope > .gv-layout').forEach(x=>x.style.display='none');
  { const s = sub.querySelector('.save-bar'); const card = sub.querySelector(':scope > .gv-layout .save-bar'); if(card) card.remove(); }

  /* ── القواعد والحالة ── */
  const val = val0;
  const nTr = ()=>sub.querySelectorAll('#trainerChipList input:checked').length;
  const nRq = ()=>sub.querySelectorAll('#reqHiddenChecks input:checked').length;
  const LAST = STEPS.length-1, WORK = Array.from({length:LAST}, (_,i)=>i);
  const REQ = [
    [['f_field','مجال المبادرة'],['f_ptype','مسار المبادرة'],['f_title','عنوان المبادرة']],
    [['f_date','تاريخ المبادرة'],['f_timeFrom','وقت البداية'],['f_timeTo','وقت النهاية'],['@tr','مقدّم مبادرة واحد على الأقل'],['@rep','تاريخ انتهاء التكرار الأسبوعي']],
    [['f_placeTypeTop','نوع الجهة'],['f_count','العدد المتوقع'],['f_school','الجهة (مكان المبادرة)']],
    [['@rq','طلب إداري واحد على الأقل']],
    [],
  ];
  const ok = r=> r[0]==='@tr' ? nTr()>0 : r[0]==='@rq' ? nRq()>0
    : r[0]==='@rep' ? !($('f_repeat') && $('f_repeat').checked && !val('f_repUntil')) : !!val(r[0]);
  const missing = i=>REQ[i].filter(r=>!ok(r));
  const stepOk = i=>!missing(i).length;
  function markErr(i, on){
    REQ[i].forEach(r=>{ if(r[0][0]==='@') return; const el = $(r[0]); if(!el) return;
      el.classList.toggle('wz-err', on && !ok(r)); });
    const box = body(i).parentElement.querySelector('.wz-miss'); if(box) box.remove();
    const m = missing(i);
    if(on && m.length){ const d = document.createElement('div'); d.className = 'wz-miss'; d.setAttribute('role','alert');
      d.innerHTML = `${icon('alert',15)}<span>أكمل البيانات الإلزامية: <b>${m.map(x=>escapeHtml(x[1])).join('، ')}</b></span>`;
      body(i).before(d); }
  }
  function conflicts(){
    const out = [];
    const cbx = $('ordClashBar'); const n = cbx ? cbx.querySelectorAll('.ord-clash-ev').length : 0;
    if(n) out.push(`${n} تعارض في مواعيد المقدّمين أو الجهة`);
    const rw = $('resWarn'); if(rw && !rw.hidden && rw.textContent.trim()) out.push('تعارض في حجز مورد');
    const nb = $('ordNoteBar');
    if(nb && nb.style.display!=='none' && nb.textContent.trim()){ const sp = nb.firstElementChild, bg = sp ? sp.style.background : '';
      if(!/238, 244, 251|EEF4FB/i.test(bg)) out.push(nb.textContent.trim().replace(/^[^\wء-ي]+/,'')); }
    return out;
  }
  function go(i){
    i = Math.max(0, Math.min(STEPS.length-1, i));
    window.__wzStep = i; visited.add(i);
    if(window.__wzEnter) window.__wzEnter(i);
    wz.querySelectorAll('.wz-step').forEach(s=>s.hidden = Number(s.dataset.s)!==i);
    $('wzPrev').disabled = i===0;
    const nx = $('wzNext');
    nx.innerHTML = i===STEPS.length-1 ? `${icon('checkCircle',15)} ${editing?'حفظ التعديلات':'إرسال الطلب'}` : `التالي ${icon('chevronLeft',15)}`;
    $('wzTips').innerHTML = TIPS[i].map(t=>`<li>${escapeHtml(t)}</li>`).join('');
    if(i===STEPS.length-1) drawReview();
    refresh();
  }
  function rowsPreview(){
    const sc = state.schools.find(x=>x.id===val('f_school'));
    const fd = state.fields.find(x=>x.id===val('f_field')), pt = state.programTypes.find(x=>x.id===val('f_ptype'));
    const sv = sc ? (sc.supervisors||[]).find(x=>x.id===val('f_supervisor')) : null;
    const d1 = val('f_date'), d2 = val('f_dateTo')||d1, dash = '—';
    const trs = Array.from(sub.querySelectorAll('#trainerChipList input:checked')).map(c=>{ const t = state.trainers.find(x=>x.id===c.value); return t?t.name:''; }).filter(Boolean);
    const rqs = Array.from(sub.querySelectorAll('#reqHiddenChecks input:checked')).map(c=>{ const r = state.adminRequestsList.find(x=>x.id===c.value); return r?r.name:''; }).filter(Boolean);
    const days = d1 ? daysCount(d1,d2) : 0, hrs = computeHours(val('f_timeFrom'), val('f_timeTo'), d1, d2);
    return [
      {s:0, ic:'fileText', k:'عنوان الفعالية', v:val('f_title')},
      {s:0, ic:'layers', k:'المجال والمسار', v:[fd&&fd.name, pt&&pt.name].filter(Boolean).join(' · ')},
      {s:1, ic:'calendar', k:'الموعد والتنفيذ', v: d1 ? `${d2!==d1?`${fmtDate(d1)} — ${fmtDate(d2)}`:`${dayNameOf(d1)} ${fmtDate(d1)}`}${val('f_timeFrom')?`\n${val('f_timeFrom')} – ${val('f_timeTo')||dash} · ${days} ${dayWord(days)} · ${hrs} ساعة`:''}` : ''},
      {s:1, ic:'activity', k:'منفذو المبادرة', v:trs.join('، ')},
      {s:2, ic:'building', k:'نوع الجهة', v: val('f_placeTypeTop')},
      {s:2, ic:'school', k:'مكان التنفيذ', v: sc ? `${sc.name}${val('f_venue')?`\nالتنفيذ في: ${val('f_venue')}`:''}` : ''},
      {s:2, ic:'user', k:'المشرف', v: sv ? [sv.name, sv.phone].filter(Boolean).join(' — ') : ''},
      {s:2, ic:'users', k:'العدد المتوقع', v: val('f_count') ? `${val('f_count')} مستفيد` : ''},
      {s:3, ic:'clipboard', k:'الطلبات', v: rqs.join('، ')},
      {s:3, ic:'fileText', k:'الملاحظات', v:[val('f_reqNote'), val('f_adminNote')].filter(Boolean).join(' · '), opt:true},
    ];
  }
  /* توفر المقدّمين في تاريخ المبادرة: ✓ متاح / ✗ مشغول لكل مقدّم */
  function updAvail(){
    const box = $('wzDateAvail'); if(!box) return;
    const d1 = val('f_date'), d2 = val('f_dateTo') || d1;
    const trs = (state.trainers||[]).filter(t=>t && t.name);
    if(!d1 || !trs.length){ box.hidden = true; box.innerHTML = ''; return; }
    const rows = trs.map(t=>{
      const lv = trainerLeaveOn(t.id, d1, d2);
      const ev = lv ? null : (state.orders||[]).find(o=>(!editing || o.id!==editing.id) && isLiveOrder(o) && o.date
        && (o.trainerIds||[]).includes(t.id) && dateRangesOverlap(o.date, orderEnd(o)||o.date, d1, d2));
      return {t, busy:!!(lv||ev), why: lv ? `إجازة ${leaveTxt(lv)}` : ev ? `${ev.title||'فعالية'} (${ev.timeFrom||''}${ev.timeTo?'–'+ev.timeTo:''})` : 'متاح'};
    }).sort((a,b)=>a.busy-b.busy);
    const nf = rows.filter(r=>!r.busy).length;
    const sel = new Set(Array.from(sub.querySelectorAll('#trainerChipList input:checked')).map(c=>c.value));
    box.hidden = false;
    box.className = 'wz-avail' + (nf===0 ? ' all-busy' : '');
    box.innerHTML = `<div class="h">${icon('users',14)} مقدّمو المبادرات في ${d2!==d1?'هذه الفترة':'هذا اليوم'}</div>
      ${nf===0 ? `<div class="allb">${icon('alert',14)} جميع المقدّمين لديهم ارتباط في هذا التاريخ — يُفضّل اختيار تاريخ آخر</div>` : ''}
      <div class="nm">${rows.map(r=>`<button type="button" class="n ${r.busy?'busy':'free'}${sel.has(r.t.id)?' sel':''}" data-tid="${r.t.id}"
          title="${escapeHtml(r.busy ? r.why : 'اضغط لإضافته مقدّمًا للمبادرة')}">
          <b>${escapeHtml(r.t.name)}</b>${r.busy?`<i>${escapeHtml(r.why)}</i>`:''}</button>`).join('')}</div>`;
    box.querySelectorAll('[data-tid]').forEach(bt=>bt.onclick = ()=>{
      const cb = Array.from(sub.querySelectorAll('#trainerChipList input')).find(c=>c.value===bt.dataset.tid);
      if(!cb){ toast('هذا المقدّم غير متاح في قائمة هذا المجال'); return; }
      cb.click(); setTimeout(()=>{ updAvail(); refresh(); }, 60);
    });
  }
  function refresh(){
    if(!document.body.contains(wz)) return;
    try{ updAvail(); }catch(e){}
    const cur = window.__wzStep||0;
    const allReq = REQ.flat().filter(r=>r[0]!=='@rep');
    const okN = allReq.filter(ok).length + (val('f_supervisor')?1:0);
    const pct = Math.round(okN/(allReq.length+1)*100);
    const C = 2*Math.PI*33;
    const ring = $('wzRing'); if(ring){ ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C*(1-pct/100); }
    $('wzPct').textContent = pct+'%'; $('wzBar').style.width = pct+'%';
    const doneSteps = STEPS.filter((s,i)=>i<LAST && stepOk(i)).length;
    $('wzPctTx').textContent = `${doneSteps} من ${LAST} خطوات مكتملة`;
    wz.querySelectorAll('[data-go]').forEach(b=>{ const i = Number(b.dataset.go);
      const st = i===cur ? 'cur' : (i<LAST && stepOk(i) && visited.has(i)) ? 'done' : (visited.has(i) && i<LAST && !stepOk(i)) ? 'warn' : '';
      b.className = b.className.replace(/\s?(cur|done|warn)\b/g,'') + (st?' '+st:'');
      b.setAttribute('aria-current', i===cur ? 'step' : 'false'); });
    $('wzPv').innerHTML = rowsPreview().map(r=>`<div class="wz-pv${r.v?'':' empty'}">
        <span class="ic">${icon(r.ic,16)}</span>
        <span class="tx"><i>${escapeHtml(r.k)}</i><b>${r.v?escapeHtml(r.v).replace(/\n/g,'<br>'):(r.opt?'لا توجد':'لم يُحدَّد بعد')}</b></span>
        <button type="button" class="ed" data-go="${r.s}" title="تعديل ${escapeHtml(r.k)}" aria-label="تعديل ${escapeHtml(r.k)}">${icon('edit',14)}</button></div>`).join('');
    $('wzPv').querySelectorAll('[data-go]').forEach(b=>b.onclick = ()=>go(Number(b.dataset.go)));
    const cf = conflicts();
    const warn = $('wzSaveSt').previousElementSibling;
    let al = wz.querySelector('.wz-pv-al'); if(al) al.remove();
    if(cf.length){ al = document.createElement('div'); al.className = 'wz-pv-al'; al.innerHTML = `${icon('alert',15)}<span>${cf.map(escapeHtml).join('<br>')}</span>`; $('wzPv').after(al); }
    if((window.__wzStep||0)===STEPS.length-1) drawReview();
  }
  function drawReview(){
    const rv = $('wzReview'); if(!rv || !document.body.contains(wz)) return;
    const all = WORK.map(i=>({i, m:missing(i)}));
    const miss = all.filter(x=>x.m.length);
    const cf = conflicts();
    const rows = rowsPreview();
    rv.innerHTML = `
      ${miss.length ? `<div class="wz-miss" role="alert">${icon('alert',15)}<span>لا يمكن الإرسال قبل إكمال: ${miss.map(x=>`<a href="#" data-go="${x.i}">${escapeHtml(STEPS[x.i].t)} (${x.m.map(r=>escapeHtml(r[1])).join('، ')})</a>`).join(' · ')}</span></div>`
        : `<div class="wz-okmsg">${icon('checkCircle',16)}<span>البيانات الإلزامية مكتملة — راجع الملخّص ثم أرسل الطلب.</span></div>`}
      ${cf.length ? `<div class="wz-miss warn">${icon('alert',15)}<span>${cf.map(escapeHtml).join(' · ')}</span></div>` : ''}
      <div class="wz-rv">${WORK.map(i=>`<div class="wz-rv-c${missing(i).length?' bad':''}">
          <div class="h">${icon(STEPS[i].ic,15)} <b>${escapeHtml(STEPS[i].t)}</b>
            <button type="button" class="pk-btn sm" data-go="${i}">${icon('edit',13)} تعديل</button></div>
          ${rows.filter(r=>r.s===i).map(r=>`<div class="r"><i>${escapeHtml(r.k)}</i><b>${r.v?escapeHtml(r.v).replace(/\n/g,'<br>'):'<span class="no">—</span>'}</b></div>`).join('')}
        </div>`).join('')}</div>
      <div class="wz-final-t">${icon('info',15)} اضغط «${editing?'حفظ التعديلات':'إرسال الطلب'}» أسفل الصفحة واختر: حفظ وطباعة للجهة الطالبة، أو للإدارة، أو حفظ فقط — ويُغلق الطلب بعد الحفظ.</div>`;
    rv.querySelectorAll('[data-go]').forEach(b=>b.onclick = e=>{ e.preventDefault(); go(Number(b.dataset.go)); });
  }
  wz.querySelectorAll('.wz-stepper [data-go]').forEach(b=>b.onclick = ()=>go(Number(b.dataset.go)));
  /* الانتقال التلقائي إلى المرحلة التالية عند اكتمال المرحلة (١–٣) */
  const AUTO_STEPS = [0,1,2];
  const okAt = {}; AUTO_STEPS.forEach(i=>{ okAt[i] = stepOk(i); });
  let autoT = null;
  const autoPill = $('wzAuto');
  function cancelAuto(){ clearTimeout(autoT); autoT = null; if(autoPill) autoPill.hidden = true; }
  function scheduleAuto(cur){
    clearTimeout(autoT);
    if(autoPill){ autoPill.hidden = false; autoPill.querySelector('span').textContent = `اكتملت «${STEPS[cur].t}» — الانتقال إلى «${STEPS[cur+1].t}»…`; }
    autoT = setTimeout(()=>{
      autoT = null; if(autoPill) autoPill.hidden = true;
      if(!document.body.contains(wz) || (window.__wzStep||0)!==cur || !stepOk(cur)) return;
      markErr(cur, false); go(cur+1);
      try{ wz.scrollIntoView({block:'start', behavior:'smooth'}); }catch(e){}
    }, cur===0 ? 700 : 1600);
  }
  function checkAuto(fromChange){
    const cur = window.__wzStep||0;
    if(!AUTO_STEPS.includes(cur)) return;
    setTimeout(()=>{
      if(!document.body.contains(wz) || (window.__wzStep||0)!==cur) return;
      const now = stepOk(cur);
      if(!now){ cancelAuto(); okAt[cur] = false; return; }
      if(fromChange){ if(!okAt[cur] || autoT) scheduleAuto(cur); okAt[cur] = true; }
      else if(autoT) scheduleAuto(cur);
    }, 80);
  }
  window.__wzEnter = i=>{ cancelAuto(); if(AUTO_STEPS.includes(i)) okAt[i] = stepOk(i); };
  if(autoPill) autoPill.querySelector('button').onclick = cancelAuto;
  const mainEl = wz.querySelector('.wz-main');
  mainEl.addEventListener('change', ()=>checkAuto(true));
  mainEl.addEventListener('input', e=>{ if(e.target.matches('input[type=text],input:not([type]),textarea,input[type=number]')) checkAuto(false); else checkAuto(true); });
  mainEl.addEventListener('click', e=>{ if(e.target.closest('#trainerChipList, .pick-one, .opt-row, .ms-wrap')) checkAuto(true); });
  { const ti = $('f_title'); if(ti) ti.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); ti.blur(); checkAuto(true); } }); }
  ['f_date','f_dateTo','f_daysCount'].forEach(id=>{ const el = $(id); if(el){ el.addEventListener('change', ()=>setTimeout(updAvail,30)); el.addEventListener('input', ()=>setTimeout(updAvail,30)); } });
  $('wzPrev').onclick = ()=>go((window.__wzStep||0)-1);
  $('wzNext').onclick = ()=>{
    const i = window.__wzStep||0;
    if(i===STEPS.length-1){
      const bad = WORK.find(k=>!stepOk(k));
      if(bad!==undefined){ drawReview(); toast('أكمل البيانات الإلزامية أولًا'); return; }
      pkMenu($('wzNext'), [
        {hd: editing ? 'حفظ التعديلات' : 'إرسال الطلب'},
        {ic:'school', l:'حفظ وطباعة للجهة الطالبة', run:()=>$('saveOrderPrintBtn').click()},
        {ic:'clipboard', l:'حفظ وطباعة للإدارة', run:()=>$('saveOrderPrintAdminBtn').click()},
        '-',
        {ic:'checkCircle', l: editing ? 'حفظ التعديلات فقط' : 'حفظ الطلب فقط', run:()=>$('saveOrderBtn').click()},
      ]);
      return;
    }
    if(!stepOk(i)){ markErr(i, true); toast('أكمل البيانات الإلزامية في هذه الخطوة'); return; }
    markErr(i, false); go(i+1);
    try{ wz.scrollIntoView({block:'start', behavior:'smooth'}); }catch(e){}
  };
  $('wzCancel').onclick = ()=>{
    if(editing){ editingOrderId=null; currentPage='ordersList'; render(); return; }
    if(!confirm('إلغاء الطلب؟ سيتم مسح البيانات المُدخلة والمسودة المحفوظة.')) return;
    clearOrderDraft(); window.__wzLeft = true; editingOrderId=null; currentPage='ordersList'; render();
  };

  /* ── الحفظ التلقائي (طلب جديد فقط) ── */
  const hasContent = ()=>!!(val('f_title') || val('f_date') || val('f_school') || nTr());
  const fmtT = t=>new Date(t).toLocaleTimeString('ar-QA-u-nu-latn',{hour:'2-digit', minute:'2-digit'});
  function setSaveSt(txt, okc){
    const h = `${icon(okc?'checkCircle':'clock',14)} <span>${txt}</span>`;
    $('wzSaveSt').innerHTML = h; $('wzSaveSt').classList.toggle('ok', !!okc);
    $('wzBarSt').innerHTML = h; }
  function saveDraft(manual){
    if(editing || !document.body.contains(wz)) return;
    if(!hasContent()){ if(manual) toast('لا توجد بيانات لحفظها بعد'); return; }
    const snap = snapshotOrderForm(); if(!snap) return;
    snap.rep = $('f_repeat') ? {on:$('f_repeat').checked, until:val('f_repUntil')} : null;
    snap.notesOn = $('notesToggle') ? $('notesToggle').checked : false;
    const t = Date.now();
    try{ localStorage.setItem(WZ_DRAFT_KEY, JSON.stringify({t, step:window.__wzStep||0, snap})); }
    catch(e){ if(manual) toast('تعذّر حفظ المسودة على هذا الجهاز'); return; }
    setSaveSt(`${manual?'تم حفظ المسودة':'حُفظ تلقائيًا'} — آخر حفظ ${fmtT(t)}`, true);
    if(manual) toast('تم حفظ المسودة على هذا الجهاز');
  }
  if(editing) setSaveSt('التعديلات تُحفظ عند الضغط على «حفظ التعديلات»');
  else setSaveSt('الحفظ التلقائي مفعّل — يبدأ مع أول إدخال');
  const dr = $('wzDraft'); if(dr) dr.onclick = ()=>saveDraft(true);
  let tmr = null;
  const onEdit = ()=>{ clearTimeout(tmr); tmr = setTimeout(()=>{ refresh(); saveDraft(false); }, 900);
    REQ.forEach((rs,i)=>rs.forEach(r=>{ const el = r[0][0]!=='@' && $(r[0]); if(el && el.classList.contains('wz-err') && ok(r)) el.classList.remove('wz-err'); })); };
  sub.addEventListener('input', onEdit); sub.addEventListener('change', onEdit);
  sub.addEventListener('click', e=>{ if(e.target.closest('#trainerChipList, #adminReqList, #resChecks')) setTimeout(onEdit, 30); });
  /* عرض استرجاع مسودة سابقة عند فتح طلب جديد */
  if(!editing && fresh){
    let d = null; try{ d = JSON.parse(localStorage.getItem(WZ_DRAFT_KEY)||'null'); }catch(e){}
    if(d && d.snap){
      const bn = document.createElement('div'); bn.className = 'wz-draft-bn';
      bn.innerHTML = `${icon('save2',17)}<span>لديك مسودة طلب غير مكتملة محفوظة ${escapeHtml(fmtDate(dateToISO(new Date(d.t))))} الساعة ${escapeHtml(fmtT(d.t))}${d.snap.vals&&d.snap.vals.f_title?` — «${escapeHtml(d.snap.vals.f_title)}»`:''}</span>
        <button type="button" class="pk-btn pri sm" id="wzRestore">${icon('refresh',14)} استرجاع</button>
        <button type="button" class="pk-btn sm" id="wzDiscard">تجاهل وحذف</button>`;
      $('wzAlerts').prepend(bn);
      $('wzRestore').onclick = ()=>{
        restoreOrderForm(d.snap);
        setTimeout(()=>{
          if(d.snap.rep && $('f_repeat')){ $('f_repeat').checked = !!d.snap.rep.on; if($('f_repUntil')) $('f_repUntil').value = d.snap.rep.until||''; $('f_repeat').dispatchEvent(new Event('change')); }
          if(d.snap.notesOn && $('notesToggle')){ $('notesToggle').checked = true; $('notesToggle').dispatchEvent(new Event('change')); }
          bn.remove(); go(d.step||0); toast('تم استرجاع المسودة'); }, 60);
      };
      $('wzDiscard').onclick = ()=>{ clearOrderDraft(); bn.remove(); };
    }
  }
  /* الشريط السفلي ثابت أسفل الشاشة بعرض المعالج نفسه */
  { const bar = wz.querySelector('.wz-bar'); bar.classList.add('fx'); wz.classList.add('has-fx');
    const place = ()=>{ if(!document.body.contains(wz)){ try{ ro.disconnect(); }catch(e){} window.removeEventListener('resize', place); return; }
      const r = wz.getBoundingClientRect(); bar.style.left = r.left+'px'; bar.style.width = r.width+'px'; };
    const ro = (typeof ResizeObserver!=='undefined') ? new ResizeObserver(place) : null;
    if(ro) ro.observe(wz); window.addEventListener('resize', place); place(); }
  go(window.__wzStep||0);
  setTimeout(refresh, 50);
}

/* ══════════════════════════════════════════════════════════════
   تفاصيل الفعالية — تصميم البطاقات العصرية
   نفس البيانات والأزرار والصلاحيات، مع إضافة: إلغاء / تأجيل إلى تاريخ جديد
   ══════════════════════════════════════════════════════════════ */
function evPhone(p){
  const raw = String(p||'').trim(); if(!raw) return '';
  const bare = raw.replace(/[^\d+]/g,'').replace(/^\+/,'').replace(/^0+/,'');
  const intl = bare.length<=8 ? '974'+bare : bare;
  return `<span class="ev-ph"><a href="tel:+${intl}" class="n" title="اتصال">${escapeHtml(raw)}</a>
    <a href="tel:+${intl}" class="b call" title="اتصال" aria-label="اتصال">${icon('phone',13)}</a>
    <a href="https://wa.me/${intl}" target="_blank" rel="noopener" class="b wa" title="واتساب" aria-label="واتساب">${waIcon(13)}</a></span>`;
}
function viewOrderReadOnly(id){
  const o = state.orders.find(x=>x.id===id);
  if(!o){ toast('الفعالية غير موجودة'); return; }
  const sc  = state.schools.find(x=>x.id===o.schoolId);
  const sv  = sc ? (sc.supervisors||[]).find(x=>x.id===o.supervisorId) : null;
  const fd  = state.fields.find(x=>x.id===o.fieldId);
  const pt  = state.programTypes.find(x=>x.id===o.programTypeId);
  const trs = (o.trainerIds||[]).map(t=>state.trainers.find(y=>y.id===t)).filter(Boolean);
  const rqs = (o.adminRequests||[]).map(t=>{ const x=state.adminRequestsList.find(y=>y.id===t); return x?x.name:''; }).filter(Boolean);
  const res = (o.resourceIds||[]).map(rid=>{ const r=(state.resources||[]).find(x=>x.id===rid); return r?r.name:''; }).filter(Boolean);
  const d1 = o.date, d2 = orderEnd(o);
  const nDays = d1 ? daysCount(d1,d2) : 0, hrs = computeHours(o.timeFrom,o.timeTo,d1,d2);
  const st = orderState(o, todayStr());
  const cancelled = isCancelledOrder(o);
  const canEdit = currentRole === 'admin' || currentRole === 'user';
  const hist = (state.auditLog||[]).filter(a=>a.orderId===o.id).sort((a,b)=>b.at-a.at);
  const fmtAt = t=>{ const d=new Date(t); return `${fmtDate(dateToISO(d))} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
  const cxBy = hist.find(a=>a.action==='cancel' || (a.action==='status' && a.note==='الغيت'));
  const benef = o.benef ? [['الطلاب',o.benef.students],['المعلمون',o.benef.teachers],['أولياء الأمور',o.benef.parents],['آخرون',o.benef.others]].filter(x=>x[1]) : [];
  const card = (ic, t, inner, cls)=>`<section class="ev-c${cls?' '+cls:''}"><header><span class="ic">${icon(ic,16)}</span><b>${t}</b></header><div class="bd">${inner}</div></section>`;
  const kv = (k,v)=>`<div class="kv"><i>${k}</i><span>${v}</span></div>`;
  const body = `<div class="ev">
    <div class="ev-hero${cancelled?' is-off':''}">
      <div class="top">
        <span class="sn">${icon('hash',13)} ${o.serial}</span>
        <span class="st st-${st.k}">${escapeHtml(st.l)}</span>
        ${o.seriesId?`<span class="tg">${icon('refresh',12)} سلسلة ${o.seriesIndex||'?'}/${o.seriesTotal||'?'}</span>`:''}
      </div>
      <h2>${escapeHtml(o.title||'بلا عنوان')}</h2>
      <div class="chips">${[pt&&pt.name, fd&&fd.name].filter(Boolean).map(x=>`<span>${icon('layers',12)} ${escapeHtml(x)}</span>`).join('')}</div>
      <div class="facts">
        <div><span class="fi">${icon('calendar',17)}</span><span><i>التاريخ</i><b>${d1 ? (d2!==d1 ? `${fmtDate(d1)} — ${fmtDate(d2)}` : `${escapeHtml(dayNameOf(d1))} ${fmtDate(d1)}`) : '—'}</b></span></div>
        <div><span class="fi">${icon('clock',17)}</span><span><i>الوقت</i><b>${escapeHtml(fullTimeRange(o.timeFrom,o.timeTo)||'—')}</b></span></div>
        <div><span class="fi">${icon('hourglass',17)}</span><span><i>المدة</i><b>${nDays} ${dayWord(nDays)} · ${hrs} ساعة</b></span></div>
        <div><span class="fi">${icon('users',17)}</span><span><i>المستهدفون</i><b>${o.participantsCount||'—'}</b></span></div>
      </div>
    </div>
    ${o.status==='postponed' && o.postponedFrom ? `<div class="ev-note pp">${icon('refresh',15)}<span>رُحّلت من <b>${fmtDate(o.postponedFrom)}</b>${o.postponedFromTime?` (${escapeHtml(o.postponedFromTime)})`:''} إلى <b>${fmtDate(o.date)}</b>${o.postponedAt?` — بتاريخ ${fmtDate(o.postponedAt)}`:''}</span></div>`:''}
    ${cancelled ? `<div class="ev-note off">${icon('ban',15)}<span>هذه الفعالية <b>ملغاة</b> — لا تظهر في الجداول والتقارير.${cxBy?`<br><small>ألغاها: <b>${escapeHtml(cxBy.user||'—')}</b> بتاريخ ${fmtAt(cxBy.at)}${cxBy.note?` — ${escapeHtml(cxBy.note)}`:''}</small>`:(o.completionStatus==='الغيت'?'<br><small>سُجّل الإنجاز «أُلغيت».</small>':'<br><small>لا يوجد في سجل التعديلات من ألغاها (أُلغيت قبل بدء التسجيل).</small>')}</span></div>`:''}
    <div class="ev-grid">
      ${card('school', o.venue?'الجهة الطالبة ومكان التنفيذ':'مكان التنفيذ', `
        <div class="big">${sc?escapeHtml(sc.name):'—'}</div>
        ${o.venue?kv('التنفيذ في', `<b class="hl">${escapeHtml(o.venue)}</b>`):''}
        ${sv?kv('المشرف', `${escapeHtml(sv.name)}${sv.phone?evPhone(sv.phone):''}`):kv('المشرف','—')}
        ${sc?`<button type="button" class="ev-lnk" data-sp="${sc.id}">${icon('school',13)} ملف الجهة</button>`:''}`)}
      ${card('user', 'مقدّمو المبادرة', trs.length ? trs.map(t=>`<div class="ev-p">
          <span class="av">${escapeHtml((t.name||'؟').replace(/^أ\.\s*/,'').trim().charAt(0))}</span>
          <span class="nm"><button type="button" data-tp="${t.id}">${escapeHtml(t.name)}</button>${t.phone?evPhone(t.phone):''}</span></div>`).join('')
        : '<div class="emp">لم يُحدَّد مقدّم</div>')}
      ${card('clipboard', 'الطلبات الإدارية', rqs.length ? `<div class="ev-tags">${rqs.map(r=>`<span>${icon('check',12)} ${escapeHtml(r)}</span>`).join('')}</div>` : '<div class="emp">لا توجد طلبات</div>')}
      ${card('users', 'المستفيدون', `<div class="big">${o.participantsCount||'—'} <small>مستفيد</small></div>
        ${benef.length?`<div class="ev-tags soft">${benef.map(x=>`<span>${x[0]} <b>${x[1]}</b></span>`).join('')}</div>`:''}
        ${!benef.length && o.gender?kv('الفئة', escapeHtml(o.gender)):''}`)}
      ${res.length?card('truck','الموارد المحجوزة', `<div class="ev-tags">${res.map(r=>`<span>${escapeHtml(r)}</span>`).join('')}</div>`):''}
      ${(o.requesterNote||o.adminNote)?card('fileText','الملاحظات', `${o.requesterNote?kv('الجهة الطالبة', escapeHtml(o.requesterNote)):''}${o.adminNote?kv('الإدارة', escapeHtml(o.adminNote)):''}`,'wide'):''}
      ${hist.length?card('history','سجل الفعالية', `<div class="ev-hist">${hist.slice(0,12).map(a=>`<div><span class="t">${fmtAt(a.at)}</span><b>${escapeHtml((typeof AUDIT_LABEL!=='undefined'&&AUDIT_LABEL[a.action])||a.action)}</b><span>${escapeHtml(a.user||'—')}</span>${a.note?`<small>${escapeHtml(a.note)}</small>`:''}</div>`).join('')}</div>`,'wide'):''}
    </div>
    ${canEdit ? `<div class="ev-acts">
      <button type="button" class="pk-btn pri" id="roEdit">${icon('edit',15)} تعديل الطلب</button>
      ${cancelled ? `<button type="button" class="pk-btn" id="roCancel">${icon('refresh',15)} تراجع عن الإلغاء</button>`
        : `<button type="button" class="pk-btn warn" id="roPost">${icon('calendar',15)} تأجيل / تاريخ جديد</button>
           <button type="button" class="pk-btn dang" id="roCancel">${icon('ban',15)} إلغاء الفعالية</button>`}
      <span class="sp">
        <button type="button" class="pk-btn ic" id="roPrint" title="طباعة أمر التكليف" aria-label="طباعة" aria-haspopup="menu">${icon('printer',16)}</button>
        <button type="button" class="pk-btn ic" id="roWa" title="إرسال بالواتساب" aria-label="إرسال بالواتساب">${waIcon(16)}</button>
        <button type="button" class="pk-btn ic" id="roDup" title="نسخ الفعالية لتاريخ آخر" aria-label="نسخ الفعالية">${icon('copyPlus',16)}</button>
      </span>
    </div>
    ${o.seriesId ? `<div class="ev-acts sub">
      <button type="button" class="pk-btn sm" id="roSeriesList">${icon('calendar',13)} مواعيد السلسلة</button>
      <button type="button" class="pk-btn sm dang" id="roSeriesCancel">${icon('ban',13)} إلغاء هذا الموعد وما بعده</button></div>` : ''}`
    : `<div class="ev-ro">${icon('shield',13)} عرض فقط</div>`}
  </div>`;
  showInfoModal('تفاصيل الفعالية', body, box=>{
    box.classList.add('ev-modal'); box.style.maxWidth = '760px';
    const go = (fn)=>()=>{ closeModal(); setTimeout(fn, 60); };
    const $b = s=>box.querySelector(s);
    if($b('#roEdit')) $b('#roEdit').onclick = go(()=>editOrder(o.id));
    if($b('#roPost')) $b('#roPost').onclick = go(()=>openPostponeModal(o.id));
    if($b('#roCancel')) $b('#roCancel').onclick = go(()=>toggleCancelOrder(o.id));
    if($b('#roWa')) $b('#roWa').onclick = go(()=>shareOrderWhatsApp(o.id));
    if($b('#roDup')) $b('#roDup').onclick = go(()=>duplicateOrder(o.id));
    if($b('#roSeriesList')) $b('#roSeriesList').onclick = go(()=>showSeries(o.seriesId));
    if($b('#roSeriesCancel')) $b('#roSeriesCancel').onclick = ()=>{ closeModal(); cancelSeriesFrom(o.id); };
    if($b('#roPrint')) $b('#roPrint').onclick = e=>pkMenu(e.currentTarget, [
      {hd:'طباعة أمر التكليف'},
      {ic:'school', l:'نسخة الجهة الطالبة', run:()=>{ closeModal(); printOrderSchoolCopy(o.id); }},
      {ic:'clipboard', l:'نسخة الإدارة', run:()=>{ closeModal(); printOrderAdminCopy(o.id); }},
      ...((isCancelledOrder(o)||o.status==='postponed') ? ['-', {ic:'fileText', l: isCancelledOrder(o)?'سند الإلغاء':'سند التأجيل', run:()=>{ closeModal(); printOrderVoucher(o.id); }}] : []),
    ]);
    box.querySelectorAll('[data-sp]').forEach(b=>b.onclick = go(()=>openSchoolProfile(b.dataset.sp)));
    box.querySelectorAll('[data-tp]').forEach(b=>b.onclick = go(()=>openTrainerProfile(b.dataset.tp)));
  });
}
function editOrder(id){ editingOrderId=id; orderSubTab='new'; currentPage='order'; render(); }
async function deleteOrder(id){
  /* لا يُحذف أي طلب: يُلغى ويبقى برقمه في النظام */
  const o = state.orders.find(x=>x.id===id); if(!o) return;
  if(isCancelledOrder(o)){ toast('الطلب ملغي مسبقًا — يبقى محفوظًا برقمه'); return; }
  return toggleCancelOrder(id);
}
async function toggleCancelOrder(id){
  const o = state.orders.find(x=>x.id===id); if(!o) return;
  if(isCancelledOrder(o)){
    if(!confirm('هل تريد التراجع عن إلغاء هذه الفعالية؟')) return;
    o.status='active'; if(o.completionStatus==='الغيت') o.completionStatus=''; logAudit('uncancel', o); await saveState(); toast('تم التراجع عن الإلغاء'); render(); return;
  }
  const why = askCancelReason(1); if(why===null) return;
  markCancelled(o, why); logAudit('cancel', o, why||''); await saveState(); toast(`أُلغي الطلب ${o.serial} — محفوظ برقمه بحالة «ملغي»`); render();
  if(confirm(`تم إلغاء الطلب رقم ${o.serial}.\nهل تريد طباعة سند الإلغاء الآن؟`)) printOrderVoucher(o.id);
}
/* ══════════════════════════════════════════════════════════════════
   فحص التعارض عند الترحيل — يجمع تعارض المقدّمين وتعارض الجهة
   في اليوم/المدة الجديدة، ويعيد نصًا جاهزًا للعرض.
   ══════════════════════════════════════════════════════════════════ */
function postponeConflicts(o, newDate, newTo, tf, tt){
  const out = [];
  const dTo = newTo || newDate;
  /* تعارض مقدّمي المبادرة */
  (o.trainerIds||[]).forEach(tid=>{
    const t = (state.trainers||[]).find(x=>x.id===tid);
    const c = trainerConflictSingle(tid, newDate, tf, tt, o.id, dTo);
    if(!c) return;
    const sc = (state.schools||[]).find(x=>x.id===c.schoolId);
    out.push({ kind:'trainer', who:(t?t.name:''), order:c,
      line:`${t?t.name:''} مرتبط بفعالية أخرى:\n      أمر ${c.serial||'—'} — ${c.title||'بلا عنوان'}`
        + `\n      ${fmtDate(c.date)} · من ${c.timeFrom||'—'} إلى ${c.timeTo||'—'}`
        + (sc?`\n      ${sc.name}`:'') });
  });
  /* إجازات المقدّمين */
  (o.trainerIds||[]).forEach(tid=>{ const lv = trainerLeaveOn(tid, newDate, dTo); if(lv){ const t=(state.trainers||[]).find(x=>x.id===tid);
    out.push({ kind:'leave', who:(t?t.name:''), order:{}, line:`${t?t.name:''} في إجازة: ${leaveTxt(lv)}` }); } });
  /* الموارد المحجوزة */
  resourceConflicts(o.resourceIds||[], newDate, dTo, o.id).forEach(x=>{
    out.push({ kind:'resource', who:x.res.name, order:x.order,
      line:`المورد «${x.res.name}» محجوز:\n      أمر ${x.order.serial||'—'} — ${x.order.title||'بلا عنوان'}\n      ${fmtDate(x.order.date)}` });
  });
  /* فعالية أخرى للجهة نفسها ضمن المدة الجديدة */
  if(o.schoolId){
    const sc = (state.schools||[]).find(x=>x.id===o.schoolId);
    (state.orders||[]).forEach(x=>{
      if(x.id===o.id || x.schoolId!==o.schoolId) return;
      if((x.status||'active')==='cancelled') return;
      const xTo = orderEnd(x);
      if(!x.date || !dateRangesOverlap(newDate, dTo, x.date, xTo)) return;
      out.push({ kind:'school', who:(sc?sc.name:''), order:x,
        line:`${sc?sc.name:'الجهة'} لديها فعالية في التاريخ نفسه:\n      أمر ${x.serial||'—'} — ${x.title||'بلا عنوان'}`
          + `\n      ${fmtDate(x.date)} · من ${x.timeFrom||'—'} إلى ${x.timeTo||'—'}` });
    });
  }
  return out;
}

function openPostponeModal(id){
  const o = state.orders.find(x=>x.id===id); if(!o) return;
  openModal('ترحيل / تأجيل: '+o.title, [
    {name:'date', label:'التاريخ الجديد', type:'date', required:true},
    {name:'timeFrom', label:'من الساعة', type:'time'},
    {name:'timeTo', label:'إلى الساعة', type:'time'},
    {name:'reason', label:'سبب التأجيل (يُطبع في سند التأجيل)', type:'text', placeholder:'اختياري'},
  ], async v=>{
    const oldDate = o.date, oldDateTo = orderEnd(o);
    const oldFrom = o.timeFrom, oldTo = o.timeTo;

    /* ⚠ الفعالية قد تمتد أيامًا: نُحرّك تاريخ الانتهاء بنفس المقدار
       حفاظًا على المدة. كان تاريخ الانتهاء يبقى قديمًا فتصبح الفعالية
       بمدى مقلوب (انتهاء قبل البداية) فتختفي من كل التقارير. */
    const span   = Math.max(0, daysCount(oldDate, oldDateTo) - 1);
    const newDate = v.date;
    const newTo   = addDaysISO(newDate, span);
    const nf = v.timeFrom || oldFrom, nt = v.timeTo || oldTo;

    /* فحص التعارض قبل التنفيذ */
    const cf = postponeConflicts(o, newDate, newTo, nf, nt);
    if(cf.length){
      const msg = `⚠ يوجد تعارض في التاريخ الجديد (${fmtDate(newDate)})`
        + (newTo!==newDate?` — ${fmtDate(newTo)}`:'') + `\n\n`
        + cf.map((x,i)=>`${i+1}) ${x.line}`).join('\n\n')
        + `\n\nهل تريد إتمام الترحيل رغم التعارض؟`;
      /* إعادة false تُبقي النافذة مفتوحة لاختيار تاريخ آخر مباشرة */
      if(!confirm(msg)){ toast('أُلغي الترحيل — اختر تاريخًا آخر'); return false; }
    }

    o.date   = newDate;
    o.dateTo = newTo;
    if(v.timeFrom) o.timeFrom = v.timeFrom;
    if(v.timeTo)   o.timeTo   = v.timeTo;
    o.status = 'postponed';
    logAudit('postpone', o, `من ${fmtDateRaw(oldDate)} إلى ${fmtDateRaw(newDate)}`);
    /* بيانات الترحيل — تُطبع في نسخة الجهة الطالبة ونسخة الإدارة */
    o.postponedFrom     = oldDate;
    o.postponedFromTo   = (oldDateTo && oldDateTo!==oldDate) ? oldDateTo : '';
    o.postponedFromTime = (oldFrom||oldTo) ? `${oldFrom||'—'} - ${oldTo||'—'}` : '';
    o.postponedAt       = todayStr();
    o.postponedStamp    = nowStamp(); o.postponedBy = curUserName();
    o.postponeReason    = (v.reason||'').trim();
    o.postponedHadClash = cf.length ? cf.length : 0;
    o.adminNote = (o.adminNote?o.adminNote+' | ':'')
      + `تم ترحيلها من ${fmtDateRaw(oldDate)}${oldDateTo&&oldDateTo!==oldDate?` — ${fmtDateRaw(oldDateTo)}`:''}`
      + ` (${oldFrom||''}-${oldTo||''}) إلى ${fmtDateRaw(o.date)}${o.dateTo&&o.dateTo!==o.date?` — ${fmtDateRaw(o.dateTo)}`:''}`
      + ` (${o.timeFrom||''}-${o.timeTo||''})`;
    await saveState();
    toast(`تم تأجيل الطلب ${o.serial} إلى ${fmtDateRaw(o.date)} — بنفس الرقم`);
    render();
    setTimeout(()=>{ if(confirm(`تم تأجيل الطلب رقم ${o.serial}.\nهل تريد طباعة سند التأجيل الآن؟`)) printOrderVoucher(o.id); }, 80);
  });
  setTimeout(()=>{ const f=document.getElementById('mf_date'); if(f) f.value=o.date; const tf=document.getElementById('mf_timeFrom'); if(tf) tf.value=o.timeFrom||''; const tt=document.getElementById('mf_timeTo'); if(tt) tt.value=o.timeTo||''; },0);
}

/* تاريخ نصّي بلا محارف عزل — للملاحظات والنصوص المجمّعة */
function fmtDateRaw(iso){
  /* إزالة محارف العزل الاتجاهي — مكتوبة بالترميز \uXXXX عمدًا
     كي لا يحتوي الملف على محارف تحكّم خفية في مصدره. */
  return String(fmtDate(iso)||'').replace(/[\u2066-\u2069\u200E\u200F\u061C\u202A-\u202E]/g,'');
}

/* ══════════════════════════════════════════════════════════════════
   إصلاح الفعاليات المُرحَّلة سابقًا: تاريخ انتهائها بقي قديمًا فصارت
   بمدى مقلوب واختفت من التقارير. نُصلحها تلقائيًا عند التحميل.
   ══════════════════════════════════════════════════════════════════ */
function fixInvertedDateRanges(){
  let fixed = 0;
  (state.orders||[]).forEach(o=>{
    if(!o.date || !o.dateTo) return;
    if(o.dateTo >= o.date) return;
    o.__dateToWas = o.dateTo;
    o.dateTo = o.date;          // فعالية ليوم واحد في تاريخها الجديد
    fixed++;
  });
  return fixed;
}

/* ============ Evaluation modal ============ */
function openEvaluationModal(orderId){
  const o = state.orders.find(x=>x.id===orderId); if(!o) return;
  const overlay=document.getElementById('modalOverlay'); const box=document.getElementById('modalBox');
  const evalByLabel = o.evaluatedBy==='trainer' ? '\uD83E\uDDD1\u200D\uD83C\uDFEB تم إدخال هذا التقييم من قبل مقدم الفعالية'
    : o.evaluatedBy==='admin' ? '🛡️ تم إدخال هذا التقييم من الإدارة' : '';
  box.innerHTML = `
    <h3>تقييم وإنجاز: ${escapeHtml(o.title)}</h3>
    ${evalByLabel?`<div class="helper" style="background:var(--maroon-50);padding:8px 10px;border-radius:6px;margin-bottom:12px;font-weight:700;">${evalByLabel}</div>`:''}
    <div class="field" style="margin-bottom:12px;"><label>حالة الإنجاز</label>
      <select id="ev_status"><option value="">-- اختر --</option>
        <option value="تم" ${o.completionStatus==='تم'?'selected':''}>تم الإنجاز</option>
        <option value="لم يتم" ${o.completionStatus==='لم يتم'?'selected':''}>لم يتم الإنجاز</option>
        <option value="الغيت" ${o.completionStatus==='الغيت'?'selected':''}>أُلغيت</option>
        <option value="المشرف لا يرد" ${o.completionStatus==='المشرف لا يرد'?'selected':''}>المشرف لا يرد</option>
      </select>
    </div>
    <div class="field" id="ev_reasonWrap" style="display:${o.completionStatus==='لم يتم'?'flex':'none'};margin-bottom:12px;">
      <label>سبب عدم الإنجاز</label><textarea id="ev_reason">${escapeHtml(o.notDoneReason||'')}</textarea>
    </div>
    <div class="field" style="margin-bottom:12px;"><label>تقييم مشرف المدرسة (0-10)</label>${starRatingHtml('ev_sup', o.supervisorRating)}</div>
    <div class="field" style="margin-bottom:12px;"><label>تقييم المدرسة (0-10)</label>${starRatingHtml('ev_sch', o.schoolRating)}</div>
    <div class="field" style="margin-bottom:12px;"><label>تقييم تفاعل الطلاب (0-10)</label>${starRatingHtml('ev_stu', o.studentsRating)}</div>
    <div class="field" style="margin-bottom:6px;"><label>هل ترشح المدرسة لفعاليات قادمة؟</label>
      <select id="ev_recommend"><option value="">-- اختر --</option>
        <option value="نعم" ${o.recommendSchool==='نعم'?'selected':''}>نعم</option>
        <option value="لا" ${o.recommendSchool==='لا'?'selected':''}>لا</option>
      </select>
    </div>
    <div class="modal-actions"><button class="btn btn-outline" id="ev_cancel">إلغاء</button><button class="btn btn-primary" id="ev_save">حفظ التقييم</button></div>`;
  overlay.classList.add('open'); wireStars(box);
  document.getElementById('ev_status').onchange=(e)=>{ document.getElementById('ev_reasonWrap').style.display = e.target.value==='لم يتم' ? 'flex':'none'; };
  document.getElementById('ev_cancel').onclick=()=>overlay.classList.remove('open');
  document.getElementById('ev_save').onclick=async ()=>{
    o.completionStatus = document.getElementById('ev_status').value;
    o.notDoneReason = document.getElementById('ev_reason').value;
    o.supervisorRating = Number(document.getElementById('ev_sup_val').value)||0;
    o.schoolRating = Number(document.getElementById('ev_sch_val').value)||0;
    o.studentsRating = Number(document.getElementById('ev_stu_val').value)||0;
    o.recommendSchool = document.getElementById('ev_recommend').value;
    o.evaluatedBy = currentRole==='trainer' ? 'trainer' : 'admin';
    o.evaluatedAt = Date.now();
    logAudit('evaluate', o, o.completionStatus||'');
    if(currentRole==='trainer'){
      const tName = escapeHtml(trainerNames(o) || (state.trainers.find(t=>t.id===loggedTrainerId)||{}).name || '');
      state.adminNotifications.push({id:uid(), message:`قام مقدم الفعالية ${tName} بتقييم فعالية "${o.title}" (أمر رقم ${o.serial}) — حالة الإنجاز: ${o.completionStatus||'لم تنجز'}.`, read:false, createdAt:Date.now()});
    }
    await saveState(); overlay.classList.remove('open'); toast('تم حفظ التقييم'); render();
  };
}

/* quick-add helpers */
function quickAddUser(){
  openModal('إضافة مستخدم جديد', [
    {name:'displayName', label:'الاسم الظاهر', required:true},
    {name:'username', label:'اسم المستخدم', required:true},
    {name:'password', label:'كلمة المرور', required:true},
    {name:'role', label:'الدور', type:'select', options:[
      {value:'admin', label:'مدير نظام'},{value:'user', label:'مستخدم'},{value:'trainer', label:'مقدم فعالية'}]},
    {name:'trainerId', label:'ربط بمقدم فعالية (فقط إن كان الدور مقدم فعالية)', type:'select', options:[{value:'', label:'— بدون —'}, ...state.trainers.map(t=>({value:t.id, label:t.name}))]},
  ], async v=>{
    if(state.users.some(u=>u.username===v.username)){ toast('اسم المستخدم مستخدم بالفعل'); return; }
    const nu = {id:uid(), username:v.username, role:v.role, trainerId:v.role==='trainer'?v.trainerId:'', displayName:v.displayName, active:true};
    if(state.authMode!=='firebase') nu.password = v.password;
    try{ await setUserPassword(nu, v.password); }
    catch(e){ if(state.authMode==='firebase'){ toast('تعذّر إنشاء الحساب: '+(e.code||e.message)); return; } }
    state.users.push(nu);
    await saveState(); toast('تم إضافة المستخدم'); render();
  });
}
function editUser(id){
  const u = state.users.find(x=>x.id===id); if(!u) return;
  openModal('تعديل مستخدم: '+u.displayName, [
    {name:'displayName', label:'الاسم الظاهر', required:true},
    {name:'username', label:'اسم المستخدم', required:true},
    {name:'password', label:'كلمة مرور جديدة (اتركها فارغة لعدم التغيير)'},
    {name:'role', label:'الدور', type:'select', options:[
      {value:'admin', label:'مدير نظام'},{value:'user', label:'مستخدم'},{value:'trainer', label:'مقدم فعالية'}]},
    {name:'trainerId', label:'ربط بمقدم فعالية (فقط إن كان الدور مقدم فعالية)', type:'select', options:[{value:'', label:'— بدون —'}, ...state.trainers.map(t=>({value:t.id, label:t.name}))]},
  ], async v=>{
    if(state.users.some(x=>x.id!==id && x.username===v.username)){ toast('اسم المستخدم مستخدم بالفعل'); return; }
    if(v.username!==u.username && u.authUid){ toast('لا يمكن تغيير اسم مستخدم مُرحَّل — أنشئ مستخدمًا جديدًا وعطّل القديم'); return; }
    const newPw = String(v.password||'').trim();
    if(newPw && newPw!==(u.password||'')){
      try{ await setUserPassword(u, newPw); }
      catch(e){ if(state.authMode==='firebase'){ toast('تعذّر تغيير كلمة المرور: '+(e.code||e.message)); return; } u.password = newPw; }
    }
    Object.assign(u, {username:v.username, role:v.role, trainerId:v.role==='trainer'?v.trainerId:'', displayName:v.displayName});
    await saveState(); toast('تم حفظ التعديلات'); render();
  });
  setTimeout(()=>{
    const f=document.getElementById('mf_displayName'); if(f) f.value=u.displayName||'';
    const un=document.getElementById('mf_username'); if(un) un.value=u.username||'';
    const pw=document.getElementById('mf_password'); if(pw) pw.value=(state.authMode==='firebase'?'':(u.password||''));
    const rl=document.getElementById('mf_role'); if(rl) rl.value=u.role;
    const tr=document.getElementById('mf_trainerId'); if(tr) tr.value=u.trainerId||'';
  },0);
}
async function toggleUserActive(id){
  const u = state.users.find(x=>x.id===id); if(!u) return;
  u.active = !(u.active!==false);
  try{ if(u.authUid){ if(u.active) await addMember(u.authUid); else await removeMember(u.authUid); } }catch(e){}
  await saveState(); toast(u.active?'تم تفعيل المستخدم':'تم تعطيل المستخدم'); render();
}

/* ══ حفظ مدخلات نموذج الفعالية واستعادتها بعد أي إضافة سريعة ══ */
const ORDER_FORM_IDS = ['f_field','f_ptype','f_title','f_date','f_dateTo','f_daysCount','f_timeFrom',
  'f_timeTo','f_count','f_hoursCount','f_placeType','f_placeTypeTop','f_school','f_stage','f_supervisor',
  'f_period','f_reqNote','f_adminNote','f_venue','f_bStudents','f_bTeachers','f_bParents','f_bOthers','f_bGender'];
function snapshotOrderForm(){
  if(!document.getElementById('f_title')) return null;
  const snap = {vals:{}, trainers:[], reqs:[]};
  ORDER_FORM_IDS.forEach(id=>{ const el=document.getElementById(id); if(el) snap.vals[id]=el.value; });
  document.querySelectorAll('#trainerChipList input:checked').forEach(cb=>snap.trainers.push(cb.value));
  document.querySelectorAll('#reqHiddenChecks input:checked').forEach(cb=>snap.reqs.push(cb.value));
  snap.res = Array.from(document.querySelectorAll('#resChecks input:checked')).map(cb=>cb.value);
  return snap;
}
function restoreOrderForm(snap){
  if(!snap) return;
  ORDER_FORM_IDS.forEach(id=>{
    const el=document.getElementById(id);
    if(el && snap.vals[id]!==undefined && snap.vals[id]!==''){ el.value = snap.vals[id]; }
  });
  ['f_placeType','f_school','f_date','f_dateTo','f_timeFrom','f_timeTo','f_daysCount']
    .forEach(id=>{ const el=document.getElementById(id); if(el) el.dispatchEvent(new Event('change')); });
  const tBox=document.getElementById('trainerChipList');
  if(tBox) snap.trainers.forEach(v=>{ const cb=tBox.querySelector(`input[value="${v}"]`); if(cb) cb.checked=true; });
  const rBox=document.getElementById('reqHiddenChecks');
  if(rBox) snap.reqs.forEach(v=>{ const cb=rBox.querySelector(`input[value="${v}"]`); if(cb) cb.checked=true; });
  const xBox=document.getElementById('resChecks');
  if(xBox) (snap.res||[]).forEach(v=>{ const cb=xBox.querySelector(`input[value="${v}"]`); if(cb) cb.checked=true; });
}
/* ══ تعديل / حذف الجهة والمشرف من صفحة طلب الفعالية ══ */
function formCurSchool(){
  const id = (document.getElementById('f_school')||{}).value;
  return id ? state.schools.find(s=>s.id===id) : null;
}
function formEditSchool(){
  const s = formCurSchool();
  if(!s){ toast('اختر الجهة أولًا'); return; }
  editSchool(s.id);
}
async function formDeleteSchool(){
  const s = formCurSchool();
  if(!s){ toast('اختر الجهة أولًا'); return; }
  const used = (state.orders||[]).filter(o=>o.schoolId===s.id && o.id!==editingOrderId).length;
  const msg = `حذف الجهة: ${s.name}`
    + ((s.supervisors||[]).length ? `\nومعها ${(s.supervisors||[]).length} مشرف` : '')
    + (used ? `\n\n⚠ هذه الجهة مرتبطة بـ ${used} فعالية أخرى — ستبقى الفعاليات لكن بلا جهة.` : '')
    + '\n\nهل تريد المتابعة؟';
  if(!confirm(msg)) return;
  state.schools = state.schools.filter(x=>x.id!==s.id);
  await saveState(); toast('تم حذف الجهة');
  const snap = snapshotOrderForm();
  if(snap){ snap.vals.f_school=''; snap.vals.f_supervisor=''; }
  render(); if(snap) setTimeout(()=>restoreOrderForm(snap), 0);
}
function formEditSupervisor(){
  const s = formCurSchool();
  if(!s){ toast('اختر الجهة أولًا'); return; }
  const svId = (document.getElementById('f_supervisor')||{}).value;
  if(!svId){ toast('لا يوجد مشرف محدد — استخدم "+ مشرف" لإضافته'); return; }
  editSupervisor(s.id, svId);
}
async function formDeleteSupervisor(){
  const s = formCurSchool();
  if(!s){ toast('اختر الجهة أولًا'); return; }
  const svId = (document.getElementById('f_supervisor')||{}).value;
  const sv = (s.supervisors||[]).find(x=>x.id===svId);
  if(!sv){ toast('لا يوجد مشرف محدد'); return; }
  const used = (state.orders||[]).filter(o=>o.supervisorId===sv.id && o.id!==editingOrderId).length;
  if(!confirm(`حذف المشرف: ${sv.name}`
    + (used ? `\n\n⚠ مرتبط بـ ${used} فعالية أخرى — ستبقى بلا مشرف.` : '')
    + '\n\nهل تريد المتابعة؟')) return;
  s.supervisors = (s.supervisors||[]).filter(x=>x.id!==sv.id);
  await saveState(); toast('تم حذف المشرف');
  const snap = snapshotOrderForm();
  if(snap) snap.vals.f_supervisor='';
  render(); if(snap) setTimeout(()=>restoreOrderForm(snap), 0);
}
function quickAddVenue(){
  openModal('إضافة مكان تنفيذ', [{name:'name', label:'اسم مكان التنفيذ', required:true}], async v=>{
    const name = (v.name||'').trim(); if(!name) return false;
    state.venues = state.venues || [];
    if(!state.venues.some(x=>x.name===name)) state.venues.push({id:uid(), name});
    await saveState(); toast('تمت إضافة مكان التنفيذ');
    const snap = snapshotOrderForm(); if(snap) snap.vals.f_venue = name;
    render(); if(snap) setTimeout(()=>restoreOrderForm(snap), 0);
  });
}
function renderKeepForm(){
  const snap = snapshotOrderForm();
  render();
  if(snap) setTimeout(()=>restoreOrderForm(snap), 0);
}
function quickAddField(){
  openModal('إضافة مجال مبادرة جديد', [{name:'name', label:'اسم المجال', required:true}], async v=>{
    const item={id:uid(), name:v.name}; state.fields.push(item); await saveState(); renderKeepForm();
    setTimeout(()=>{ const s=document.getElementById('f_field'); if(s) s.value=item.id; },0);
  });
}
function quickAddPType(){
  openModal('إضافة مسار مبادرة جديد', [{name:'name', label:'اسم المسار', required:true}], async v=>{
    const item={id:uid(), name:v.name}; state.programTypes.push(item); await saveState(); renderKeepForm();
    setTimeout(()=>{ const s=document.getElementById('f_ptype'); if(s) s.value=item.id; },0);
  });
}
/* Normalizes a school name for duplicate comparison: trims, collapses spaces, ignores case */
function normalizeSchoolName(s){ return (s||'').toString().trim().replace(/\s+/g,' ').toLowerCase(); }
function findDuplicateSchool(name){
  const n = normalizeSchoolName(name);
  if(!n) return null;
  return state.schools.find(s=>{
    const sn = normalizeSchoolName(s.name);
    return sn===n || sn.includes(n) || n.includes(sn);
  }) || null;
}
function quickAddSchool(presetLevel){
  openModal('إضافة مدرسة / جهة جديدة', [
    {name:'name', label:'اسم المدرسة / الجهة', required:true},
    {name:'level', label:'المرحلة الدراسية', type:'select', options:LOCATION_TYPES.map(t=>({value:t,label:t}))},
    {name:'email', label:'البريد الإلكتروني (اختياري)'},
  ], async v=>{
    const dup = findDuplicateSchool(v.name);
    if(dup){
      // الاسم المتشابه قد يكون جهة مختلفة فعلًا (فرع/منطقة أخرى) — نسمح بالإضافة بعد تأكيد صريح
      const exact = normalizeSchoolName(dup.name)===normalizeSchoolName(v.name);
      const ok = confirm(
        (exact ? `⚠️ توجد جهة بنفس الاسم تمامًا:\n"${dup.name}"`
               : `⚠️ توجد جهة باسم مشابه:\n"${dup.name}"\n\nقد تكون جهة مختلفة (فرع أو منطقة أخرى).`)
        + `\n\nهل تريد إضافة "${v.name}" كجهة مستقلة على أي حال؟`);
      if(!ok) return false;
    }
    const item={id:uid(), name:v.name, level:v.level, email:v.email||'', supervisors:[]};
    state.schools.push(item); await saveState(); renderKeepForm();
    setTimeout(()=>{ const s=document.getElementById('f_school'); if(s){ s.value=item.id; s.dispatchEvent(new Event('change')); } },0);
    promptAddSupervisorFor(item.id, item.name);
  });
  if(presetLevel){ const sel=document.getElementById('mf_level'); if(sel) sel.value=presetLevel; }
}
/* Opens a follow-up modal to enter the supervisor right after a school is added */
function promptAddSupervisorFor(schoolId, schoolName){
  openModal('إضافة مشرف لمدرسة: '+schoolName, [
    {name:'name', label:'اسم المشرف', required:true},
    {name:'phone', label:'رقم الجوال'},
    {name:'email', label:'البريد الإلكتروني'},
  ], async v=>{
    const sch = state.schools.find(s=>s.id===schoolId); if(!sch) return;
    sch.supervisors.push({id:uid(), name:v.name, phone:v.phone, email:v.email});
    await saveState(); toast('تم حفظ بيانات المشرف'); renderKeepForm();
    setTimeout(()=>{
      const s=document.getElementById('f_school'); if(s){ s.value=schoolId; s.dispatchEvent(new Event('change')); }
    },0);
  });
}
function quickAddSupervisor(){
  const schId = document.getElementById('f_school').value;
  const sch = state.schools.find(s=>s.id===schId);
  if(!sch){ toast('اختر مدرسة أولاً'); return; }
  openModal('إضافة مشرف لمدرسة: '+sch.name, [
    {name:'name', label:'اسم المشرف', required:true},{name:'phone', label:'رقم الجوال'},{name:'email', label:'البريد الإلكتروني'},
  ], async v=>{
    const item={id:uid(), name:v.name, phone:v.phone, email:v.email};
    sch.supervisors.push(item); await saveState(); renderKeepForm();
    setTimeout(()=>{
      const s=document.getElementById('f_school'); if(s){ s.value=schId; s.dispatchEvent(new Event('change')); }
      const sv=document.getElementById('f_supervisor'); if(sv){ sv.value=item.id; sv.dispatchEvent(new Event('change')); }
    },0);
  });
}
function quickAddTrainer(){
  openModal('إضافة مقدم مبادرة جديد', [{name:'name', label:'الاسم', required:true},{name:'phone', label:'رقم الجوال'}], async v=>{
    state.trainers.push({id:uid(), name:v.name, phone:v.phone}); await saveState(); renderKeepForm();
  });
}
function quickAddAdminRequest(){
  openModal('إضافة طلب إداري جديد', [
    {name:'name', label:'اسم الطلب', required:true},
    {name:'category', label:'التصنيف', type:'select', options:[{value:'إداري',label:'إداري'},{value:'إعلامي',label:'إعلامي'},{value:'ضيافة',label:'ضيافة'}]},
  ], async v=>{
    state.adminRequestsList.push({id:uid(), name:v.name, category:v.category||'إداري'}); await saveState(); renderKeepForm();
  });
}
function quickAddPlaceType(){
  openModal('إضافة تصنيف مكان تنفيذ جديد', [{name:'name', label:'اسم التصنيف', required:true}], async v=>{
    if(state.placeTypes.some(p=>p.name===v.name)){ toast('هذا التصنيف موجود مسبقًا'); return false; }
    state.placeTypes.push({id:uid(), name:v.name}); await saveState(); renderKeepForm();
  });
}

/* ============ Print system (Duroob-style: self-contained popup document) ============ */
const PRINT_THEME = '#3E0D21';
const PRINT_LINE_COLOR = '#7A1E3E'; // كحلي الهوية — لإطارات وخطوط الجداول في كل التقارير
function doPrintDoc(htmlStr, landscape, pageSize, fileName){
  pageSize = pageSize || 'A4';
  /* عرض المعاينة يساوي عرض ورقة A4 (بعد الهوامش) ليكون الناتج المطبوع مطابقًا لما يُعرض */
  const pageW = landscape ? '297mm' : '210mm';
  const contentW = landscape ? '289mm' : '202mm';   // A4 ناقص هامشَي 4mm
  const pCSS = '@page{size:'+pageSize+' '+(landscape?'landscape':'portrait')+';margin:4mm}'
    + 'body{width:100%;max-width:100%;}'
    + '.doc{width:'+contentW+';max-width:'+contentW+';}'
    + '@media print{body{width:auto;padding:0;display:block}.no-print{display:none!important}.doc{width:'+contentW+';max-width:'+contentW+';margin:0 auto;box-shadow:none}}';
  const orgName = (state.printHeader && state.printHeader.line1) || '';
  const toolbar = `<div class="no-print" style="position:sticky;top:0;z-index:999;width:100%;box-sizing:border-box;background:${PRINT_THEME};display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 18px;margin-bottom:5mm;direction:rtl;font-family:'Tajawal',Arial;box-shadow:0 2px 8px rgba(0,0,0,.15);">
    <div style="color:#fff;font-weight:700;font-size:13pt;display:flex;align-items:center;gap:8px;">${BRAND_MARK_SVG.replace('currentColor','#fff')} ${escapeHtml(orgName)}</div>
    <div style="display:flex;gap:10px;">
      <button onclick="window.print()" title="طباعة مباشرة" style="background:#fff;color:#161616;border:none;border-radius:10px;width:42px;height:42px;font-size:18px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;">${icon("printer",18)}</button>
      <button onclick="window.print()" title="تنزيل PDF — اختر (حفظ كـ PDF) من وجهة الطباعة" style="background:#c0392b;color:#fff;border:none;border-radius:10px;width:42px;height:42px;font-size:18px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;">${icon("download",18)}</button>
      <button onclick="window.close()" title="إغلاق" style="background:#5a6b82;color:#fff;border:none;border-radius:10px;width:42px;height:42px;font-size:18px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;">${icon("x",18)}</button>
    </div>
  </div>`;
  // اسم الملف المقترح عند "حفظ كـ PDF": يُستخدم fileName إن أُعطي (كما في أمر التكليف)،
  // وإلا يُستخرج تلقائيًا من عنوان التقرير نفسه (title-ar) في كل التقارير الأخرى
  let derivedTitle = fileName;
  if(!derivedTitle){
    const m = htmlStr.match(/class="title-ar">([^<]*)</);
    if(m) derivedTitle = m[1];
  }
  const titleTag = derivedTitle ? `<title>${escapeHtml(derivedTitle)}</title>` : '';
  const printCss = titleTag+'<style>'+pCSS+'@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none !important;}}</style>';
  let full = htmlStr.replace('</head>', printCss+'</head>');
  // التقارير تستخدم class="doc rep-doc"، لذا نطابق أي صيغة حتى يظهر الشريط في كل المستندات
  full = full.replace(/<body>\s*<div class="doc/, '<body>'+toolbar+'<div class="doc');
  const blob = new Blob([full], {type:'text/html;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if(!w){ toast('يرجى السماح بالنوافذ المنبثقة في المتصفح ثم إعادة المحاولة'); return; }
  w.addEventListener('load', function(){ w.focus(); setTimeout(function(){ URL.revokeObjectURL(url); }, 15000); });
}
const PRINT_FONT_FACE = ``;
function printDocOpen(theme){
  theme = theme || PRINT_THEME;
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
  <style>
  ${PRINT_FONT_FACE}
  ${REQ_NOTE_CSS}
  ${SCH_TBL_CSS}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'IBM Plex Sans Arabic','Tajawal',Arial,sans-serif;direction:rtl;background:#f5f7fa;color:#222;font-size:12pt;font-weight:400;padding:0 0 5mm;display:flex;flex-direction:column;align-items:center}
  .doc-heading-font{font-family:'Tajawal',Arial;font-weight:700;}
  /* خط الأرقام في التقارير */
  .num-f{font-family:'IBM Plex Sans Arabic','Tajawal',Arial;font-weight:700;font-style:normal;font-size:16px;
    line-height:1.25;display:inline-block;padding:0 1px;overflow:visible;}
  .doc{width:100%;max-width:289mm;padding:3mm 4mm;border:1.2px solid ${PRINT_LINE_COLOR};border-radius:6px;background:#fff;box-sizing:border-box;box-shadow:0 2px 6px rgba(0,0,0,.10),0 8px 24px rgba(0,0,0,.08)}
  .hdr{display:flex;justify-content:space-between;align-items:center;border-bottom:1.2px solid ${theme};padding-bottom:0.8mm;margin-bottom:0.8mm;direction:ltr}
  .org-right{text-align:center;direction:rtl;line-height:1.15;display:flex;flex-direction:column;align-items:center;justify-content:center;}
  .org-l1{font-size:12pt;font-weight:700;color:${PRINT_LINE_COLOR};font-family:'Tajawal',Arial;line-height:1.3;margin:0 0 0.6mm;text-align:center;white-space:nowrap;}
  .org-l2,.org-l3{font-size:8.5pt;color:${PRINT_LINE_COLOR};font-weight:700;font-family:'Tajawal',Arial;line-height:1.2;margin:0;text-align:center;white-space:nowrap;}
  .logo-ph{font-size:34px;color:${theme};display:inline-flex}
  .title-blk{text-align:center;margin-bottom:6mm;border:2px solid ${theme};border-radius:8px;padding:5mm;background:${theme}0d}
  .title-ar{font-size:15pt;font-weight:700;color:${theme};font-family:'Tajawal',Arial;letter-spacing:.3px;}
  .title-sub{font-size:10pt;color:#444;margin-top:0.6mm;font-weight:700}
  .kpi-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px;margin-bottom:6mm}
  .kpi{border:1.5px solid ${theme};border-radius:6px;padding:7px;text-align:center}
  .kpi-v{font-size:15pt;font-weight:700;color:${theme}}
  .kpi-l{font-size:9.5pt;color:#666;margin-top:2px}
  .sec-t{font-size:11pt;font-weight:700;margin:1mm 0 0.6mm;border-right:5px solid ${theme};padding-right:8px;color:${theme};font-family:'Tajawal',Arial;}
  table{width:100%;border-collapse:collapse;font-size:11pt;margin-bottom:4mm}
  thead{display:table-header-group}
  tfoot{display:table-footer-group}
  th{background:${theme};color:#fff;padding:5px 7px;border:1px solid ${PRINT_LINE_COLOR};text-align:center;vertical-align:middle;font-weight:700;font-size:9.5pt}
  td{padding:5px 7px;border:1px solid ${PRINT_LINE_COLOR};text-align:center;vertical-align:middle;font-weight:400;font-size:9.5pt}
  td.num, th.num{text-align:center}
  tr:nth-child(even) td{background:#FAF6F7}
  tfoot td{background:#f0f4f8;font-weight:700}
  /* خط فاصل رفيع جدًا: شرطات دقيقة بفواصل واسعة وشفافية منخفضة —
     يُرسم كخلفية متدرجة بدل border ليمكن التحكم في سمك الشرطة وطولها بدقة */
  .field-row{display:flex;justify-content:space-between;align-items:center;border-bottom:none;
    background-image:repeating-linear-gradient(to right, rgba(62,13,33,.12) 0 1px, transparent 1px 5px);
    background-position:left bottom;background-size:100% 0.6px;background-repeat:no-repeat;
    padding:1.1mm 0;font-size:11.5pt;line-height:1.25}
  .f-ar{font-weight:700;color:${theme};min-width:160px;font-size:16px;font-family:'Tajawal',Arial}
  .f-val{flex:1;text-align:center;font-weight:400;font-size:16px;font-family:'Tajawal',Arial}
  /* جدول حقول أمر التكليف: محاذاة موحّدة لكل المدخلات */
  .fr-tbl{width:100%;border-collapse:collapse;table-layout:auto;margin:0}
  .fr-tbl>tbody>tr>td{border:none !important;background-color:transparent !important;
    padding:1.1mm 0;vertical-align:middle;font-size:16px;font-family:'Tajawal',Arial;line-height:1.25;
    background-image:repeating-linear-gradient(to right, rgba(62,13,33,.12) 0 1px, transparent 1px 5px) !important;
    background-position:left bottom !important;background-size:100% 0.6px !important;background-repeat:no-repeat !important;
    -webkit-print-color-adjust:exact;print-color-adjust:exact}
  .fr-tbl>tbody>tr>td.f-ar{width:1%;white-space:nowrap;min-width:0;text-align:right;
    padding-inline-end:14px;font-weight:700;color:${theme}}
  .fr-tbl>tbody>tr>td.f-val{text-align:right;font-weight:400}
  .ftr{border-top:2px solid ${theme};margin-top:5mm;padding-top:2mm;text-align:center;font-size:9.5pt;color:#666}
  /* @page rule is injected per-call by doPrintDoc() below, with the correct size+orientation+margin */
  .field-row{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @media print{
    body{background:#fff;padding:0}
    .doc{margin:0;border:1.2px solid ${PRINT_LINE_COLOR};border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,.18)}
    @page{ @bottom-center{ content:"صفحة " counter(page) " من " counter(pages); font-size:8pt; color:#888; } }
  }
  </style></head><body><div class="doc">`;
}
function printDocHeaderBlock(){
  const ph = state.printHeader || {};
  return `<div class="hdr">
    ${state.logo?`<img src="${state.logo}" style="height:26mm;max-width:60mm;object-fit:contain;background:transparent">`:`<span class="logo-ph">${BRAND_MARK_SVG}</span>`}
    <div class="org-right"><div class="org-l1">${escapeHtml(ph.line1||'')}</div><div class="org-l2">${escapeHtml(ph.line2||'')}</div><div class="org-l3">${escapeHtml(ph.line3||'')}</div></div>
  </div>`;
}
function printDocFooter(){
  const ph = state.printHeader || {};
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ar-QA-u-nu-latn', {hour:'2-digit', minute:'2-digit'});
  return `<div class="ftr">${escapeHtml(ph.line1||'')} — ${escapeHtml(ph.line2||'')} — تمت الطباعة بتاريخ ${fmtDate(todayStr())} الساعة ${timeStr}</div>`;
}
function printDocClose(){ return `</div></body></html>`; }
/* Trainer name+phone: same style and same color for both boxes, uniform width across multiple trainers */
function trainerMiniTable(o){
  const ids = (o&&o.trainerIds)||[];
  const list = ids.map(id=>state.trainers.find(t=>t.id===id)).filter(Boolean);
  if(!list.length) return '—';
  return list.map(t=>`<div style="display:flex;align-items:center;gap:6px;margin:3px 2px;">
      <span style="font-weight:700;font-size:10pt;color:#5A142F;">${escapeHtml(t.name)}</span>
      <span style="font-size:9pt;color:#555;">${t.phone?phoneLink(t.phone):'-'}</span>
    </div>`).join('');
}
/* عدد الأيام بين تاريخين (شامل يوم البداية والنهاية) */
/* ══════════════════════════════════════════════════════════════════
   نهاية الفعالية الفعلية.
   ──────────────────────────────────────────────────────────────────
   كل عوامل التصفية الزمنية تسأل: هل تداخلت مدة الفعالية مع الفترة؟
   وكانت تقرأ dateTo كما هو. فإذا كان dateTo أقدم من تاريخ البداية
   (ترحيل قديم، استيراد، تعديل يدوي) صارت المدة مقلوبة فاختفت
   الفعالية من كل الصفحات والتقارير بصمت.
   هنا لا يمكن أن تسبق النهاية البداية أبدًا.
   ══════════════════════════════════════════════════════════════════ */
function orderEnd(o){
  if(!o) return '';
  const s = o.date || '', e = o.dateTo || '';
  if(!e) return s;
  if(!s) return e;
  return e < s ? s : e;
}
/* هل تاريخ انتهاء هذه الفعالية سليم؟ (للتشخيص والإصلاح) */
function hasBadEnd(o){ return !!(o && o.date && o.dateTo && o.dateTo < o.date); }

function daysCount(dateFrom, dateTo){
  if(!dateFrom) return 0;
  if(!dateTo || dateTo===dateFrom) return 1;
  /* نهاية أقدم من البداية = بيانات تالفة → يوم واحد، لا رقم سالب */
  if(dateTo < dateFrom) return 1;
  const d1 = new Date(dateFrom+'T00:00:00'), d2 = new Date(dateTo+'T00:00:00');
  const diff = Math.round((d2-d1)/86400000)+1;
  return diff>0 ? diff : 1;
}
/* المدة بالساعات بين وقتين (يدعم دورانها بعد منتصف الليل) */
/* الحصة المدرسية تُحتسب ساعة كاملة لكل يوم بدل كسر (0.67) — تُستخدم في النموذج والتقارير والطباعة */
function matchesPeriod(tf, tt){
  return (typeof SCHOOL_PERIODS!=='undefined') && SCHOOL_PERIODS.some(p=>p.from===tf && p.to===tt);
}
function computeHours(tf, tt, d, dTo){
  /* بلا تاريخ نفترض يومًا واحدًا حتى لا تعود القيمة صفرًا */
  const days = Number(daysCount(d, dTo)) || 1;
  if(matchesPeriod(tf, tt)) return days * 1;      // الحصة = ساعة كاملة
  return hoursDuration(tf, tt, d, dTo);
}
function hoursDuration(timeFrom, timeTo, dateFrom, dateTo){
  if(!timeFrom || !timeTo) return 0;
  const [h1,m1] = timeFrom.split(':').map(Number), [h2,m2] = timeTo.split(':').map(Number);
  let mins = (h2*60+m2) - (h1*60+m1);
  if(mins<0) mins += 24*60;
  const perDayHours = mins/60;
  const days = dateFrom ? daysCount(dateFrom, dateTo) : 1;
  return Math.round(perDayHours*days*100)/100;
}
function fullTimeRange(from, to){
  if(!from && !to) return '';
  if(from && to) return `من الساعة ${from} إلى الساعة ${to}`;
  return from ? `من الساعة ${from}` : `إلى الساعة ${to}`;
}
/* عرض التاريخ بصيغة DD-MM-YYYY (للعرض فقط — التخزين يبقى YYYY-MM-DD لضمان صحة الفرز والمقارنات) */
/* نطاق تاريخ الفعالية: من تاريخ المبادرة إلى تاريخ الانتهاء (يعرض تاريخًا واحدًا لو كانت ليوم واحد) */
/* مقدم الفعالية: الاسم في سطر ممتد ورقم الهاتف أسفله داخل نفس الخانة */
/* ── تنسيقات موحّدة لكل التقارير (عدا نسخة الجهة الطالبة/الإدارة) ── */
/* عمود التاريخ: (من) فوق تاريخها و(إلى) فوق تاريخها متجاورتان */
function repPeriodCell(o){
  const s = fmtDate(o.date), e = fmtDate(orderEnd(o));
  /* ليوم واحد: تاريخ واحد فقط — بلا تسميتين مزدحمتين */
  if(!o || orderEnd(o) === o.date) return `<span class="prd1">${s||'—'}</span>`;
  return `<span class="prd2"><span class="p2"><b>من</b><i>${s||'—'}</i></span>`
       + `<span class="p2"><b>إلى</b><i>${e||'—'}</i></span></span>`;
}
/* المكان وهاتف المشرف في عمود واحد يفصلهما / */
/* شارة صفراء لمكان التنفيذ الفعلي — أنماط مضمّنة لتظهر في الطباعة أيضًا */
const VENUE_BADGE_STYLE = 'background:#FFF1A8;color:#5C4A00;border:1px solid #E8D46A;border-radius:4px;padding:1px 6px;font-weight:700;display:inline-block;font-size:.92em;line-height:1.5;';
function venueBadge(o){
  if(!o || !o.venue) return '';
  return `<div style="margin-top:3px;"><span style="${VENUE_BADGE_STYLE}">مكان التنفيذ: ${escapeHtml(o.venue)}</span></div>`;
}
/* عنوان الفعالية + شارة مكان التنفيذ (للتقارير التي بلا عمود مكان) */
function titleWithVenue(o){
  const t = escapeHtml(o.title||'');
  return o && o.venue ? `<span>${t}</span>${venueBadge(o)}` : (o.title||'');
}
/* أماكن التنفيذ الفعلية لمجموعة فعاليات — شارات صفراء مع العدد */
function venuesSummary(list){
  const m = {};
  (list||[]).forEach(o=>{ if(o.venue) m[o.venue] = (m[o.venue]||0)+1; });
  const e = Object.entries(m).sort((a,b)=>b[1]-a[1]);
  if(!e.length) return '—';
  return `<span>${e.map(([n,c])=>`<span style="${VENUE_BADGE_STYLE}margin:1px;">${escapeHtml(n)}${c>1?` (${c})`:''}</span>`).join(' ')}</span>`;
}
function venuesSummaryText(list){
  const m = {};
  (list||[]).forEach(o=>{ if(o.venue) m[o.venue] = (m[o.venue]||0)+1; });
  const e = Object.entries(m).sort((a,b)=>b[1]-a[1]);
  return e.length ? e.map(([n,c])=>c>1?`${n} (${c})`:n).join('، ') : '—';
}
function repPlacePhone(o){
  const school = state.schools.find(s=>s.id===o.schoolId);
  const sup = school ? (school.supervisors||[]).find(s=>s.id===o.supervisorId) : null;
  const nm = school ? escapeHtml(school.name) : '—';
  const ph = sup && sup.phone ? escapeHtml(sup.phone) : '';
  const base = ph ? `${nm} / ${ph}` : nm;
  /* مع مكان التنفيذ: نغلّف بوسم ليُعامل كـ HTML في الجداول */
  return o.venue ? `<span>${base}</span>${venueBadge(o)}` : base;
}
/* مقدمو الفعالية: الاسم ورقمه أسفله، وكل مقدّم في سطر */
function repTrainers(o){
  const list=(o.trainerIds||[]).map(id=>state.trainers.find(t=>t.id===id)).filter(Boolean);
  if(!list.length) return '—';
  return `<span class="tstack">${list.map(t=>
    `<i>${escapeHtml(t.name)}${t.phone?` <u>${escapeHtml(t.phone)}</u>`:''}</i>`).join('')}</span>`;
}
function trainerCell(o){
  const list=(o.trainerIds||[]).map(id=>state.trainers.find(t=>t.id===id)).filter(Boolean);
  if(!list.length) return '—';
  return list.map(t=>`<div style="line-height:1.35;margin:2px 0;"><div style="font-weight:700;">${escapeHtml(t.name)}</div>${t.phone?`<div style="font-size:9pt;color:#666;">${escapeHtml(t.phone)}</div>`:''}</div>`).join('');
}
function trainerCellText(o){
  const list=(o.trainerIds||[]).map(id=>state.trainers.find(t=>t.id===id)).filter(Boolean);
  return list.map(t=>t.phone?`${t.name} (${t.phone})`:t.name).join(' / ');
}
function dateRangeStr(o){
  const s = o && o.date ? fmtDate(o.date) : '';
  const e = (o && orderEnd(o) !== o.date) ? fmtDate(orderEnd(o)) : '';
  if(!s && !e) return '';
  return e ? `${s} — ${e}` : s;
}
function fmtDate(dateStr){
  if(!dateStr) return '';
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m) return dateStr;
  /* \u2066 LRI ... \u2069 PDI : عزل اتجاهي يضمن ظهور اليوم/الشهر/السنة
     من اليسار لليمين دون انعكاس داخل الصفحات العربية (RTL) */
  return `\u2066${m[3]}/${m[2]}/${m[1]}\u2069`;
}
/* اسم اليوم فقط — لفصل النص العربي عن الرقم في عرض التاريخ */
function dayNameOf(dateStr){
  if(!dateStr) return '';
  try{ return new Date(dateStr+'T00:00:00').toLocaleDateString('ar-QA-u-nu-latn', {weekday:'long'}); }
  catch(e){ return ''; }
}
function fullDateStr(dateStr){
  if(!dateStr) return '';
  try{
    const d = new Date(dateStr+'T00:00:00');
    const weekday = d.toLocaleDateString('ar-QA-u-nu-latn', {weekday:'long'});
    return `${weekday}، ${fmtDate(dateStr)}`;
  }catch(e){ return fmtDate(dateStr); }
}

/* ---- single-document (order) print: field-row style ---- */
async function generateQRDataUrl(text){
  try{
    if(typeof QRCode==='undefined') return '';
    return await QRCode.toDataURL(text, {width:220, margin:1, color:{dark:'#000000', light:'#ffffff'}});
  }catch(e){ console.error('QR generation error', e); return ''; }
}
/* Real 1D (linear) barcode — CODE128 — encoding the assignment order serial number */
function generateBarcodeDataUrl(text){
  try{
    if(typeof JsBarcode==='undefined') return '';
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, text, {format:'CODE128', displayValue:false, margin:2, height:44, width:5, lineColor:PRINT_LINE_COLOR});
    return canvas.toDataURL('image/png');
  }catch(e){ console.error('Barcode generation error', e); return ''; }
}
/* رمز QR مربع — يُستخدم في نسخة الإدارة */
function generateQrDataUrl(text, px){
  try{
    if(typeof qrcode==='undefined') return '';
    const qr = qrcode(0, 'L');           // النوع 0 تلقائي، تصحيح L ليتسع النص الطويل
    qr.addData(text); qr.make();
    const n = qr.getModuleCount();
    const size = px || 240;
    const cell = Math.floor(size / n);
    const dim  = cell * n;
    const cv = document.createElement('canvas');
    cv.width = dim; cv.height = dim;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0,0,dim,dim);
    ctx.fillStyle = PRINT_LINE_COLOR;
    for(let r=0;r<n;r++) for(let c=0;c<n;c++)
      if(qr.isDark(r,c)) ctx.fillRect(c*cell, r*cell, cell, cell);
    return cv.toDataURL('image/png');
  }catch(e){ console.error('QR generation error', e); return ''; }
}
/* نص رمز QR — يطابق بيانات أمر الطباعة نفسها */
function qrTextForOrder(o){
  const school = state.schools.find(s=>s.id===o.schoolId);
  const sup    = school ? (school.supervisors||[]).find(s=>s.id===o.supervisorId) : null;
  const field  = state.fields.find(f=>f.id===o.fieldId);
  const ptype  = state.programTypes.find(p=>p.id===o.programTypeId);
  const trainers = (o.trainerIds||[]).map(id=>{
    const t = state.trainers.find(x=>x.id===id);
    return t ? (t.phone ? `${t.name} (${t.phone})` : t.name) : '';
  }).filter(Boolean);
  const reqs = (o.adminRequests||[]).map(id=>{
    const r = state.adminRequestsList.find(x=>x.id===id); return r?r.name:'';
  }).filter(Boolean);
  const clean = v => String(v||'').replace(/[\u2066\u2069]/g,'');   // إزالة محارف العزل
  const dateTxt = (o.dateTo && o.dateTo!==o.date)
    ? `${clean(fmtDate(o.date))} — ${clean(fmtDate(o.dateTo))}`
    : clean(fmtDate(o.date));
  const timeTxt = (o.timeFrom||o.timeTo)
    ? `من ${o.timeFrom||''} إلى ${o.timeTo||''}` : '—';
  const L = [];
  L.push(`أمر تكليف رقم: ${o.serial}`);
  L.push(`عنوان المبادرة: ${o.title||'—'}`);
  if(field) L.push(`مجال المبادرة: ${field.name}`);
  if(ptype) L.push(`مسار المبادرة: ${ptype.name}`);
  L.push(`عدد المستهدفين: ${o.participantsCount||'—'}`);
  L.push(`التاريخ: ${dateTxt}`);
  if(o.postponedFrom) L.push(`مُرحَّلة من: ${clean(fmtDate(o.postponedFrom))}`
    + (o.postponedFromTo?` — ${clean(fmtDate(o.postponedFromTo))}`:'') + ` إلى ${dateTxt}`);
  L.push(`الوقت: ${timeTxt}`);
  L.push(`عدد الأيام: ${daysCount(o.date,o.dateTo)} — الساعات: ${computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo)}`);
  L.push(`${o.venue?'الجهة الطالبة':'المكان'}: ${school?school.name:'—'}`);
  if(o.venue) L.push(`مكان التنفيذ: ${o.venue}`);
  if(sup) L.push(`المشرف: ${sup.name}${sup.phone?` — ${sup.phone}`:''}`);
  if(trainers.length) L.push(`مقدّم المبادرة: ${trainers.join('، ')}`);
  if(reqs.length)     L.push(`الطلبات الإدارية: ${reqs.join('، ')}`);
  if(o.requesterNote) L.push(`ملاحظة الجهة الطالبة: ${o.requesterNote}`);
  if(o.adminNote)     L.push(`ملاحظة الإدارة: ${o.adminNote}`);
  return L.join('\n');
}
/* Same dashed-column box but for people: name on top (bold), phone below (muted, clickable) — used for trainers/supervisor */
function dashedPeopleBox(people){
  const list = people.filter(Boolean);
  if(!list.length) return '—';
  /* يبدأ من نفس خط بقية المدخلات (بداية السطر) بدل التوسيط */
  return `<div style="display:flex;flex-wrap:wrap;align-items:stretch;justify-content:flex-start;width:100%;">
    ${list.map((p,i)=>`<div style="flex:0 1 auto; padding:0 ${i>0?'10px':'0'} 0 10px; text-align:right; ${i>0?`border-right:1px solid ${PRINT_LINE_COLOR};`:''}">
      <div style="font-size:9pt; color:#161616; font-weight:400; line-height:1.1; white-space:nowrap;">${escapeHtml(p.name||'—')}</div>
      <div style="font-size:10pt; color:#111; font-weight:400; line-height:1.1; white-space:nowrap; margin-top:1.6mm;">${p.phone?phoneLinkWithIcons(p.phone):'-'}</div>
    </div>`).join('')}
  </div>`;
}
/* يعرض الطلبات الإدارية المختارة لفعالية كجدول بثلاثة أعمدة: إداري، إعلامي، ضيافة */
function adminRequestsTable(order){
  const selectedIds = order.adminRequests||[];
  const categories = ['إداري','إعلامي','ضيافة'];
  const byCat = categories.map(cat=>({
    cat,
    items: state.adminRequestsList.filter(r=>(r.category||'إداري')===cat && selectedIds.includes(r.id))
  }));
  if(byCat.every(c=>c.items.length===0)) return '—';
  const maxRows = Math.max(...byCat.map(c=>c.items.length));
  let rowsHtml = '';
  for(let i=0;i<maxRows;i++){
    rowsHtml += `<tr>${byCat.map(c=>`<td style="border:1px solid ${PRINT_LINE_COLOR};padding:4px 10px;text-align:center;">${c.items[i]?escapeHtml(c.items[i].name):''}</td>`).join('')}</tr>`;
  }
  const fontFamily = "'IBM Plex Sans Arabic','Tajawal',sans-serif";
  return `<table style="width:100%;border-collapse:collapse;font-family:${fontFamily};"><thead><tr>${categories.map(cat=>`<th style="border:1px solid ${PRINT_LINE_COLOR};background:${PRINT_LINE_COLOR};color:#fff;padding:5px 10px;font-size:9.5pt;font-weight:700;text-align:center;font-family:${fontFamily};">${cat}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
}
async function buildOrderPrintDoc(o, opts, copyLabel){
  opts = opts||{};
  const ph = Object.assign({slogan:'معاً.. نبنى جيل المستقبل', email:'cultural@eidcharity.net', phone:'5560 7826', city:'الدوحة - قطر', web:'www.eidcharity.net'}, state.printHeader || {});
  const field = state.fields.find(f=>f.id===o.fieldId);
  const school = state.schools.find(s=>s.id===o.schoolId);
  const supervisor = school ? (school.supervisors||[]).find(s=>s.id===o.supervisorId) : null;
  const ptype = state.programTypes.find(p=>p.id===o.programTypeId);
  const isAdminCopy = /الإدارة/.test(copyLabel||'');
  const barcodeUrl = generateBarcodeDataUrl(String(o.serial));
  const trainers = (o.trainerIds||[]).map(id=>state.trainers.find(t=>t.id===id)).filter(Boolean);
  const N = v => `<b class="n">${escapeHtml(String(v))}</b>`;
  const dateTxt = o.dateTo && o.dateTo!==o.date
    ? `${dayNameOf(o.date)}، ${N(fmtDateRaw(o.date))} — إلى — ${dayNameOf(o.dateTo)}، ${N(fmtDateRaw(o.dateTo))}`
    : `${dayNameOf(o.date)}، ${N(fmtDateRaw(o.date))}`;
  const rows = [
    ['bookOpen','عنوان المبادرة', escapeHtml(o.title||'')],
    ['layers','مجال المبادرة', escapeHtml(field?field.name:'—')],
    ['activity','مسار المبادرة', escapeHtml(ptype?ptype.name:'—')],
    ['users','عدد المستهدفين', N(o.participantsCount||'—')],
    ['calendar','تاريخ المبادرة', dateTxt],
    ['clock','وقت المبادرة', (o.timeFrom||o.timeTo) ? `من الساعة ${N(o.timeFrom||'—')} إلى الساعة ${N(o.timeTo||'—')}` : '—'],
    ['hourglass','عدد الأيام والمدة', `عدد الأيام: (${N(daysCount(o.date,o.dateTo))}) &nbsp;&nbsp; المدة بالساعات: (${N(computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo))})`],
    ['mapPin','مكان المبادرة والمشرف', `<span class="two"><span><b>${o.venue?'الجهة الطالبة':'المدرسة'}:</b> ${escapeHtml(school?school.name:'—')}</span>
        <span><b>المشرف:</b> ${supervisor?escapeHtml(supervisor.name):'—'}${supervisor&&!supervisor.phone?' <i>(المشرف بدون رقم)</i>':''}</span></span>`],
  ];
  if(o.venue) rows.push(['school','مكان التنفيذ', `<b>${escapeHtml(o.venue)}</b>`]);
  /* رقم قابل للنقر (اتصال) + أيقونتا اتصال وواتساب بجواره */
  const PH = p => {
    const raw = String(p||'').trim(); if(!raw) return '';
    const digits = raw.replace(/[^\d+]/g,''), bare = digits.replace(/^\+/,'').replace(/^0+/,'');
    const intl = bare.length<=8 ? '974'+bare : bare;
    return `<span class="ph"><a class="ph-n" href="tel:+${intl}" title="اتصال">${escapeHtml(raw)}</a>`
      + `<a class="ph-i call" href="tel:+${intl}" title="اتصال" aria-label="اتصال"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></a>`
      + `<a class="ph-i wa" href="https://wa.me/${intl}" target="_blank" title="واتساب" aria-label="واتساب">${waIcon(14)}</a></span>`;
  };
  const phones = [supervisor&&supervisor.phone].filter(Boolean);
  rows.push(['phone','الجوال', phones.length ? phones.map(PH).join(' <span class="sep">|</span> ') : '—']);
  rows.push(['user','مقدم المبادرة', trainers.length ? trainers.map(t=>`<span class="tp">${escapeHtml(t.name)}${t.phone?PH(t.phone):''}</span>`).join('') : '—']);
  if((o.resourceIds||[]).length){
    const rn = o.resourceIds.map(id=>{ const r=(state.resources||[]).find(x=>x.id===id); return r?r.name:''; }).filter(Boolean);
    if(rn.length) rows.push(['truck','الموارد المحجوزة', escapeHtml(rn.join('، '))]);
  }
  if(o.postponedFrom){
    rows.push(['forward','بيان الترحيل', `<b>مُرحَّلة</b> من ${dayNameOf(o.postponedFrom)} ${N(fmtDateRaw(o.postponedFrom))}${o.postponedFromTime?` (${escapeHtml(o.postponedFromTime)})`:''} &nbsp;←&nbsp; إلى ${dayNameOf(o.date)} ${N(fmtDateRaw(o.date))}`]);
  }
  if(opts.showRequesterNote!==false) rows.push(['fileText','ملاحظة الجهة الطالبة', o.requesterNote ? escapeHtml(o.requesterNote) : '—']);
  if(opts.showAdminNote!==false){
    rows.push(['clipboard','ملاحظة الإدارة', o.adminNote ? escapeHtml(o.adminNote) : '—']);
    const reqs = (o.adminRequests||[]).map(id=>{ const r=state.adminRequestsList.find(x=>x.id===id); return r?r.name:''; }).filter(Boolean);
    rows.push(['clipboard','الطلبات الإدارية', reqs.length ? reqs.map(r=>`<span class="chip">${escapeHtml(r)}</span>`).join(' ') : '—']);
  }
  const M = '#7A1E3E', G = '#B08D57';
  const orn = `<svg width="22" height="14" viewBox="0 0 44 28" aria-hidden="true"><path d="M22 2 L25 11 L34 14 L25 17 L22 26 L19 17 L10 14 L19 11 Z" fill="${M}"/><path d="M4 14 L7 11 L10 14 L7 17 Z M34 14 L37 11 L40 14 L37 17 Z" fill="${G}"/></svg>`;
  const OLD_SLOGANS = ['معاً نبني جيل المستقبل'];
  let slogan = (ph.slogan===undefined || OLD_SLOGANS.includes(ph.slogan)) ? 'معاً.. نبنى جيل المستقبل' : (ph.slogan || '');
  const sw = slogan.split(/\s+/);
  const sloganHtml = sw.length>=3 ? `${escapeHtml(sw[0])}<br>${escapeHtml(sw.slice(1,-1).join(' '))}<br>${escapeHtml(sw[sw.length-1])}` : escapeHtml(slogan);
  /* ترتيب التذييل من اليمين: الموقع، المدينة، الهاتف، البريد — كما في النموذج */
  const contacts = [['globe',ph.web],['mapPin',ph.city],['phone',ph.phone],['mail',ph.email]].filter(c=>c[1]);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ar-QA-u-nu-latn', {hour:'2-digit', minute:'2-digit'});
  let html = printDocOpen(M);
  html = html.replace('<div class="doc">', '<div class="doc ao-doc">');
  html = html.replace('</head>', `<style>
    .ao-doc{border:none !important;box-shadow:none !important;padding:0 !important;background:transparent !important;}
    .ao{border:1px solid #E4D9DD;border-radius:5mm;background:#fff;display:flex;flex-direction:column;overflow:hidden;
      font-family:'Tajawal','IBM Plex Sans Arabic',Arial,sans-serif;color:#2E1A21;
      -webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .ao-hd{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:6mm;padding:5mm 7mm 4mm;}
    .ao-org{justify-self:start;display:flex;flex-direction:column;align-items:center;text-align:center;}
    .ao-org .l1{font-size:17pt;font-weight:700;color:${M};line-height:1.2;}
    .ao-org .l2,.ao-org .l3{font-size:10.5pt;color:#4A3A40;line-height:1.35;}
    .ao-ttl{display:flex;align-items:flex-start;gap:3mm;text-align:center;}
    .ao-ttl svg{margin-top:2mm;}
    .ao-ttl .t{font-size:24pt;font-weight:700;color:#2E1A21;line-height:1.05;}
    .ao-ttl .s{font-size:8pt;letter-spacing:2px;color:#2E1A21;margin-top:1.2mm;font-family:Arial,sans-serif;}
    .ao-logo{justify-self:end;display:flex;align-items:center;gap:3mm;color:${M};}
    .ao-logo img{height:20mm;max-width:58mm;object-fit:contain;}
    .ao-bd{display:grid;grid-template-columns:1fr 58mm;gap:6mm;flex:1;padding:0 7mm 4mm;}
    /* جدول الحقول: عمود أيقونات عنابي متصل + تسمية + قيمة على خلفية رمادية */
    .ao-t{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #E4D9DD;border-radius:2.5mm;overflow:hidden;}
    .ao-t td{border:none !important;border-bottom:1px solid #ECE4E7 !important;vertical-align:middle;text-align:right !important;}
    .ao-t tr:last-child td{border-bottom:none !important;}
    .ao-t td.ic{border-bottom:1px solid rgba(255,255,255,.22) !important;text-align:center !important;}
    .ao-t td.v{border-inline-start:1px solid #ECE4E7 !important;}
    .ao-t td.ic{width:9mm;background:${M};text-align:center;border-bottom-color:rgba(255,255,255,.18);padding:1.6mm 0;}
    .ao-t td.ic svg{width:4.4mm;height:4.4mm;stroke:#fff;display:block;margin:0 auto;}
    .ao-t td.k{width:44mm;white-space:nowrap;padding:1.6mm 3mm;font-weight:700;font-size:11pt;color:#2E1A21;background:#fff;}
    .ao-t td.v{padding:1.6mm 4mm;font-size:11pt;line-height:1.4;color:#2E1A21;background:#F3F1F2;border-inline-start:1px solid #ECE4E7;}
    .ao-t td.v .n{font-weight:700;font-variant-numeric:lining-nums;}
    .ao-t td.v .two{display:flex;flex-direction:column;gap:.4mm;}
    .ao-t td.v i{font-style:normal;color:#8C7D82;}
    .ao-t td.v .sep{color:#B9A9AF;margin:0 1.5mm;}
    .ao-t td.v .tp{display:inline-block;margin-inline-end:5mm;}
    .ao-t td.v .tp .ph{margin-inline-start:2.5mm;}
    .ph{display:inline-flex;align-items:center;gap:1.4mm;white-space:nowrap;vertical-align:middle;}
    .ph-n{color:#2E1A21;font-weight:700;text-decoration:none;direction:ltr;unicode-bidi:isolate;font-variant-numeric:lining-nums;}
    .ph-n:hover{text-decoration:underline;}
    .ph-i{display:inline-flex;align-items:center;justify-content:center;width:5.4mm;height:5.4mm;border-radius:50%;text-decoration:none;}
    .ph-i svg{width:3.2mm;height:3.2mm;}
    .ph-i.call{background:#F3E6EB;} .ph-i.call svg{fill:none;stroke:${M};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
    .ph-i.wa{background:#E3F6EA;color:#1FA855;} .ph-i.wa svg{fill:#1FA855;stroke:none;}
    .ao-t td.v .chip{display:inline-block;border:1px solid #E2D4D9;background:#fff;border-radius:1.2mm;padding:0 2mm;margin:.3mm;font-size:10pt;}
    .ao-side{background:#FAF5F6;border-radius:3mm;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center;padding:5mm 4mm 4mm;gap:3mm;}
    .ao-slogan{font-weight:700;font-size:22pt;line-height:1.35;color:${M};}
    .ao-art{width:100%;}
    .ao-art svg{width:100%;height:auto;max-height:44mm;display:block;}
    .ao-code{width:100%;}
    .ao-code .lb{font-size:10pt;color:#2E1A21;margin-bottom:1mm;}
    .ao-code img{width:88%;height:11mm;object-fit:fill;display:block;margin:0 auto;}
    .ao-code .sn{font-size:13pt;font-weight:700;color:#2E1A21;margin-top:.6mm;font-family:Arial,sans-serif;}
    .ao-ft{display:flex;justify-content:space-between;align-items:center;gap:4mm;border-top:1px solid #ECE4E7;padding:3mm 12mm;background:#fff;}
    .ao-ft span{display:inline-flex;align-items:center;gap:2mm;font-size:10.5pt;color:#2E1A21;font-weight:700;}
    .ao-ft svg{width:4.6mm;height:4.6mm;stroke:${M};}
    .ao-ft .ltr{direction:ltr;unicode-bidi:isolate;font-family:Arial,sans-serif;}
    .ao-printed{text-align:center;font-size:7.5pt;color:#9A8B90;margin-top:1.5mm;}
    @media print{ body{background:#fff !important;} }
  </style></head>`);
  html += `<div class="ao" id="aoCard">
    <div class="ao-hd">
      <div class="ao-org"><div class="l1">${escapeHtml(ph.line1||'')}</div><div class="l2">${escapeHtml(ph.line2||'')}</div><div class="l3">${escapeHtml(ph.line3||'')}</div></div>
      <div class="ao-ttl">${orn}<div><div class="t">أمر تكليف</div><div class="s">ASSIGNMENT ORDER</div></div>${orn}</div>
      <div class="ao-logo">${state.logo?`<img src="${state.logo}" alt="">`:`${BRAND_MARK_SVG}<b style="font-size:11pt;">${escapeHtml(ph.line2||'')}</b>`}</div>
    </div>
    <div class="ao-bd">
      <table class="ao-t"><tbody>${rows.map(r=>`<tr><td class="ic">${icon(r[0],16)}</td><td class="k">${escapeHtml(r[1])} :</td><td class="v">${r[2]}</td></tr>`).join('')}</tbody></table>
      <aside class="ao-side">
        ${slogan?`<div class="ao-slogan">${sloganHtml}</div>`:'<div></div>'}
        <div class="ao-art">${ORDER_ART_SVG}</div>
        <div class="ao-code"><div class="lb">رقم الطلب</div>${barcodeUrl?`<img src="${barcodeUrl}" alt="">`:''}<div class="sn">${escapeHtml(String(o.serial))}</div></div>
      </aside>
    </div>
    ${contacts.length?`<div class="ao-ft">${contacts.map(c=>`<span>${icon(c[0],16)}<span class="${c[0]==='mapPin'?'':'ltr'}">${escapeHtml(c[1])}</span></span>`).join('')}</div>`:''}
  </div>
  <div class="ao-printed">${escapeHtml(isAdminCopy?'نسخة الإدارة':'نسخة الجهة الطالبة')} — تمت الطباعة بتاريخ ${fmtDateRaw(todayStr())} الساعة ${timeStr}</div>
  <script>(function(){ function fit(){ var c=document.getElementById('aoCard'); if(!c) return;
      var avail = 196*96/25.4, h = c.offsetHeight + 20;
      if(h > avail){ document.body.style.zoom = (avail/h).toFixed(3); } }
    if(document.readyState==='complete') fit(); else window.addEventListener('load', fit); setTimeout(fit, 300); })();<\/script>`;

  if(isCancelledOrder(o)) html += `<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:50;"><div style="transform:rotate(-18deg);border:2mm solid rgba(179,38,30,.55);color:rgba(179,38,30,.55);border-radius:4mm;padding:3mm 14mm;font:900 54pt Tajawal,sans-serif;letter-spacing:2mm;">ملغي</div></div>`;
  html += printDocClose();
  return html;
}
/* رسم خطي: كتاب مفتوح تعلوه قبة ومئذنتان */
const ORDER_ART_SVG = `<svg viewBox="0 0 200 160" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <g stroke="#A99CA1" stroke-width="1.4">
    <path d="M58 104 V58 C58 40 78 28 100 24 C122 28 142 40 142 58 V104"/>
    <path d="M100 24 V14"/><path d="M96 14 a4 4 0 0 1 8 0"/>
    <path d="M66 104 V78 a9 11 0 0 1 18 0 V104"/><path d="M91 104 V74 a9 12 0 0 1 18 0 V104"/><path d="M116 104 V78 a9 11 0 0 1 18 0 V104"/>
    <path d="M58 66 H142" opacity=".6"/>
    <path d="M36 104 V40 M32 40 h8 M33 40 l3 -10 l3 10 M36 30 V22 M32 56 h8 M32 72 h8"/>
    <path d="M164 104 V40 M160 40 h8 M161 40 l3 -10 l3 10 M164 30 V22 M160 56 h8 M160 72 h8"/>
    <path d="M28 104 H172" opacity=".7"/>
  </g>
  <g stroke="#7A1E3E" stroke-width="1.8">
    <path d="M100 150 C 80 136, 48 132, 14 136 V110 C 48 106, 80 110, 100 124 C 120 110, 152 106, 186 110 V136 C 152 132, 120 136, 100 150 Z" fill="#FFFFFF"/>
    <path d="M100 124 V150"/>
  </g>
  <g stroke="#7A1E3E" stroke-width="1.1" opacity=".5">
    <path d="M26 118 C 52 115, 76 118, 92 126 M26 125 C 52 122, 76 125, 92 133 M174 118 C 148 115, 124 118, 108 126 M174 125 C 148 122, 124 125, 108 133"/>
  </g>
</svg>`;

/* اسم ملف التنزيل: عنوان المبادرة - اسم المدرسة */
function orderFileName(o){
  const sc = state.schools.find(x=>x.id===o.schoolId);
  const clean = s => String(s||'').replace(/[\\/:*?"<>|]/g,'-').replace(/\s+/g,' ').trim();
  const t = clean(o.title) || ('أمر تكليف ' + o.serial);
  const s = sc ? clean(sc.name) : '';
  return s ? `${t} - ${s}` : t;
}
async function printOrderSchoolCopy(id){
  const o=state.orders.find(x=>x.id===id); if(!o) return;
  const html = await buildOrderPrintDoc(o, {showAdminNote:false}, 'نسخة الجهة الطالبة');
  doPrintDoc(html, true, 'A4', orderFileName(o));
}
async function printOrderAdminCopy(id){
  const o=state.orders.find(x=>x.id===id); if(!o) return;
  const html = await buildOrderPrintDoc(o, {}, 'نسخة الإدارة (كاملة)');
  doPrintDoc(html, true, 'A4', orderFileName(o));
}
async function openQrCodeModal(id){
  const o = state.orders.find(x=>x.id===id); if(!o) return;
  const overlay=document.getElementById('modalOverlay'); const box=document.getElementById('modalBox');
  box.innerHTML = `<h3>رمز QR — أمر تكليف رقم ${o.serial}</h3><div style="text-align:center;color:#999;">جارٍ التوليد...</div>`;
  overlay.classList.add('open');
  const qrUrl = await generateQRDataUrl(qrTextForOrder(o));
  box.innerHTML = `<h3>رمز QR — أمر تكليف رقم ${o.serial}</h3>
    <div style="text-align:center;">${qrUrl?`<img src="${qrUrl}" style="width:220px;height:220px;">`:'<div class="empty-state">تعذر توليد الرمز</div>'}</div>
    <div class="modal-actions"><button class="btn btn-outline" id="qr_close">إغلاق</button></div>`;
  const closeBtn = document.getElementById('qr_close');
  if(closeBtn) closeBtn.onclick=()=>overlay.classList.remove('open');
}
function emailOrder(id){
  const o=state.orders.find(x=>x.id===id); if(!o) return;
  const field = state.fields.find(f=>f.id===o.fieldId);
  const school = state.schools.find(s=>s.id===o.schoolId);
  const subject = `طلب رقم ${o.serial} — ${o.title}`;
  const body = `عنوان المبادرة: ${o.title}\nالمجال: ${field?field.name:''}\nالتاريخ: ${fmtDate(o.date)}\nالوقت: ${o.timeFrom||''} - ${o.timeTo||''}\nالمدرسة: ${school?school.name:''}\nمقدم المبادرة: ${trainerNames(o)}\nملاحظة الإدارة: ${o.adminNote||''}\n\n📎 تنبيه: افتح نافذة أمر التكليف التي فُتحت الآن، اضغط "تنزيل PDF"، ثم أرفق الملف المحفوظ يدويًا في هذه الرسالة (لا يمكن للمتصفح إرفاق الملف تلقائيًا لأسباب تتعلق بالخصوصية).`;
  printOrderAdminCopy(id); // يفتح نافذة التقرير جاهزة لتنزيل PDF بجانب نافذة البريد
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* ============ Admin (Daily) Page ============ */
function dailyReportTable(list){
  if(!list.length) return `<div class="empty-state">لا توجد فعاليات ضمن هذه الفترة</div>`;
  return `<table class="print-table"><thead><tr>
    <th>م</th><th>أمر التكليف</th><th>عنوان الفعالية</th><th>التاريخ</th><th>الوقت</th><th>المكان</th>
    <th>رقم المشرف</th><th>عدد المشاركين</th><th>مقدم البرنامج</th><th>الطلبات الإدارية للبرنامج</th>
  </tr></thead><tbody>
  ${list.map((o,i)=>{
    const school = state.schools.find(s=>s.id===o.schoolId);
    const supervisor = school ? school.supervisors.find(s=>s.id===o.supervisorId) : null;
    const reqs = (o.adminRequests||[]).map(id=>{const r=state.adminRequestsList.find(x=>x.id===id); return r?r.name:'';}).filter(Boolean).join('، ');
    return `<tr><td>${i+1}</td><td>${o.serial}</td><td>${escapeHtml(o.title)}</td><td>${fullDateStr(o.date)}</td><td>${escapeHtml(fullTimeRange(o.timeFrom,o.timeTo))}</td>
      <td>${school?escapeHtml(school.name):''}</td><td>${supervisor&&supervisor.phone?phoneLink(supervisor.phone):''}</td>
      <td>${o.participantsCount||''}</td><td>${trainerMiniTable(o)}</td><td>${reqs||'—'}</td></tr>`;
  }).join('')}</tbody></table>`;
}
/* ---- shared multi-record report doc builder (KPI row + one colored table, Duroob style) ---- */
/* أنماط خاصة بالتقارير فقط — لا تمسّ نسخة الجهة الطالبة/الإدارة إطلاقًا
   لأنها تُبنى عبر buildOrderPrintDoc ولا تحمل الفئة rep-doc */
/* ══════════════════════════════════════════════════════════════════
   أنماط جدول إتاحة المقدّمين عند الطباعة — تُحقن مع المستند نفسه
   كي تظهر الألوان والدليل في الورق وملف PDF.
   ══════════════════════════════════════════════════════════════════ */
const AVAIL_CSS = `<style>
  .av-lg{display:flex; gap:12px; flex-wrap:wrap; margin:0 0 3mm; font-size:9pt; align-items:center;}
  .av-lg span{display:inline-flex; align-items:center; gap:4px;}
  .av-lg i{width:3.4mm; height:3.4mm; border-radius:1mm; display:inline-block; border:.3mm solid #BBB;}
  table.av-tbl{table-layout:fixed !important; width:100% !important; border-collapse:collapse;}
  table.av-tbl th, table.av-tbl td{border:.25mm solid #C9C2B8; padding:.6mm .4mm; text-align:center;}
  table.av-tbl .av-nm{text-align:right; font-weight:700; font-size:9pt; padding:.8mm 1.6mm;
    white-space:normal; overflow-wrap:anywhere; line-height:1.25;}
  table.av-tbl .av-nm u{display:block; text-decoration:none; font-size:7.5pt; color:#6B6257; direction:ltr;}
  table.av-tbl .av-d{background:#F3F0EB !important; color:#3D3832 !important;
    font-size:7.5pt; line-height:1.35; padding:.9mm .2mm; vertical-align:middle;}
  table.av-tbl .av-d.off{background:#E4F1F6 !important; color:#215D71 !important;}
  table.av-tbl .av-d b{display:block; font-size:7.5pt; font-weight:800; color:inherit;}
  table.av-tbl .av-d i{display:block; font-style:normal; font-size:7pt; color:inherit; opacity:.85;}
  table.av-tbl .av-c{font-size:8pt; font-weight:700; line-height:1.1;}
  table.av-tbl .av-n{font-size:8.5pt;}
  .av-free{background:#E6F5EE; color:#15603F;}
  .av-busy{background:#FDE7E5; color:#9B2C22;}
  .av-off {background:#E4F1F6; color:#2B6E85;}
  .av-clash{background:#C0334D; color:#fff;}
  .av-lg i.av-free{background:#E6F5EE; border-color:#8DD8BD;}
  .av-lg i.av-busy{background:#FDE7E5; border-color:#F0A79E;}
  .av-lg i.av-off{background:#E4F1F6; border-color:#9FD3E4;}
  .av-lg i.av-clash{background:#C0334D; border-color:#8E2437;}
  table.av-det{width:100% !important; table-layout:fixed !important; border-collapse:collapse; margin-top:1mm;}
  table.av-det th, table.av-det td{border:.25mm solid #C9C2B8; padding:1mm 1.6mm; font-size:9pt;
    vertical-align:top; text-align:right;}
  table.av-det th{background:#F3F0EB !important; color:#3D3832 !important;
    text-align:center; font-weight:800; padding:1.4mm 1.6mm;}
  table.av-det .av-n{text-align:center;}
  /* كتلة شهر: لا تنكسر بين صفحتين، والشهر التالي أسفل الذي قبله */
  .av-month{margin:0 0 4mm; page-break-inside:avoid; break-inside:avoid;}
  .av-mt{display:flex; align-items:baseline; gap:8px; flex-wrap:wrap;
    background:#F7F1F3; border-inline-start:1.2mm solid #7A1E3E; border-radius:1mm;
    padding:1.2mm 2.4mm; margin-bottom:1.4mm; font-weight:800; font-size:10pt; color:#7A1E3E;}
  .av-mt span{margin-inline-start:auto; font-weight:600; font-size:8.5pt; color:#5A6673;}
  /* قسم يبدأ في صفحة جديدة */
  .av-break{page-break-before:always; break-before:page;}
  table.av-det{page-break-inside:auto;}
  table.av-det tr{page-break-inside:avoid; break-inside:avoid;}
  table.av-tot td, table.av-tot th{text-align:center;}
  table.av-tot .av-nm{text-align:right;}
  .av-chip{display:inline-block; background:#FDE7E5; color:#9B2C22; border:.2mm solid #F0A79E;
    border-radius:1.2mm; padding:.3mm 1.4mm; margin:.4mm .6mm .4mm 0; font-size:8pt; white-space:nowrap;}
  .av-chip.cl{background:#C0334D; color:#fff; border-color:#8E2437;}
</style>`;

const SCH_TBL_CSS = `
  table.sch-tbl th:first-child, table.sch-tbl td:first-child{
    width:20mm !important; padding-inline-end:5mm !important; text-align:center;
    white-space:nowrap; font-weight:700;}
  table.sch-tbl th:nth-child(2), table.sch-tbl td:nth-child(2){text-align:right;}
`;
const REQ_NOTE_CSS = `
  .req-note{display:block; color:#5A142F; background:#FDF0E2;
    border-inline-start:3px solid #E08A3C; border-radius:5px;
    padding:1.5mm 2.5mm; font-weight:700; line-height:1.7;}
  /* بيان الترحيل في نسخة الجهة الطالبة ونسخة الإدارة */
  .pp-note{display:block; color:#7A4B00; background:#FFF6D8;
    border-inline-start:3px solid #D9A400; border-radius:5px;
    padding:1.5mm 2.5mm; font-weight:700; line-height:1.7;}
  .pp-note b{color:#5A142F;}
`;
const REPORT_STYLES = `<style>
  /* أعمدة الأرقام والمدة: لا التفاف، والمحتوى داخل حدود العمود */
  table.rep-tbl{table-layout:fixed;}
  table.rep-tbl > thead > tr > th, table.rep-tbl > tbody > tr > td{overflow-wrap:anywhere;}
  /* البيانات الرقمية: سطر واحد وتوسيط داخل حدود العمود */
  table.rep-tbl > tbody > tr > td.rw-fit{
    white-space:nowrap;text-align:center;overflow-wrap:normal;padding-left:3px;padding-right:3px;}
  /* ⚠ العنوان يلتف دائمًا ولا يُجبَر على سطر واحد — كان إجباره على سطر
     واحد يُخرج نصّه خارج خط العمود في الأعمدة الضيقة (عدد الساعات، أمر التكليف). */
  table.rep-tbl > thead > tr > th.rw-fit, table.rep-tbl > thead > tr > th.rw-w{
    white-space:normal;overflow-wrap:break-word;word-break:normal;hyphens:none;
    text-align:center;padding-left:3px;padding-right:3px;line-height:1.25;}
  /* أعمدة نصّية بعرض ثابت: المحتوى يلتف ولا يتجاوز حدّ العمود */
  table.rep-tbl > tbody > tr > td.rw-w{
    white-space:normal;overflow-wrap:anywhere;padding-left:4px;padding-right:4px;}
  ${SCH_TBL_CSS}
  /* تقرير طلبات المقدّمين: أعمدة مضبوطة والتاريخ داخل إطاره */
  table.trq-tbl{table-layout:fixed !important;}
  table.trq-tbl th, table.trq-tbl td{white-space:normal; overflow-wrap:anywhere; padding:3px 4px;}
  table.trq-tbl td:nth-child(1){white-space:nowrap; direction:ltr; text-align:center; font-size:11px;}
  table.trq-tbl td:nth-child(3),
  table.trq-tbl td:nth-child(6){white-space:nowrap; direction:ltr; text-align:center; font-size:11px;}
  table.trq-tbl td:nth-child(4){text-align:center; font-weight:700;}
  table.trq-tbl td:nth-child(2),
  table.trq-tbl td:nth-child(5),
  table.trq-tbl td:nth-child(7){text-align:right;}
  .rep-doc{font-size:16px;}
  /* عمود التاريخ: (من/إلى) متجاوران بسطر واحد بلا زيادة ارتفاع الصف */
  .prd2{display:inline-flex; gap:8px; align-items:stretch; white-space:nowrap;}
  .p2{display:flex; flex-direction:column; align-items:center; line-height:1.05;}
  .p2 b{font-size:9px; font-weight:700; color:#777;}
  .p2 i{font-style:normal; font-size:13px; direction:ltr;}
  /* مقدمو الفعالية: أسماء متراصّة */
  .tstack{display:flex; flex-direction:column; line-height:1.15;}
  .tstack i{font-style:normal; font-size:13px; white-space:nowrap; display:block; line-height:1.1;}
  .tstack u{text-decoration:none; display:block; font-size:11px; color:#666; direction:ltr; line-height:1.05;}
  /* ══ أعمدة التقارير: توزيع ثابت متوازن ══
     القواعد السابقة كانت متعارضة (width:1% + col-grow) فتنكمش الأعمدة
     إلى حرف واحد. الآن تخطيط ثابت يوزّع العرض بالتساوي مع التفاف النص. */
  .rep-doc table{table-layout:fixed; width:100%; max-width:100%; font-size:13px;}
  .rep-doc th, .rep-doc td{
    width:auto; white-space:normal; overflow-wrap:anywhere; word-break:normal;
    padding:4px 5px; vertical-align:middle;}
  .rep-doc th{font-size:12px; font-weight:700;}
  /* العمود الأول (#) ضيق دائمًا — ما لم يحدّد colgroup غير ذلك.
     التقارير التي أول عمودها نصّ (مجال المبادرة مثلًا) تمرّر
     colWidths صريحة إلى repTableHtml فيغلب colgroup هذه القاعدة. */
  .rep-doc th:first-child, .rep-doc td:first-child{width:34px;}
  /* عمود العنوان يأخذ نصيبًا أكبر */
  .rep-doc th.col-grow, .rep-doc td.col-grow{width:26%;}
  .rep-doc .tstack{gap:2px;}
  .rep-doc .tstack i, .rep-doc .tstack u{white-space:normal; overflow-wrap:anywhere;
    line-height:1.3; display:block; max-width:100%;}
  .rep-doc .tstack i + i{margin-top:3px; padding-top:3px; border-top:1px dotted #DBD3C8;}
  .rep-doc .prd1{display:block; text-align:center; direction:ltr; font-size:13px;}
  /* في التقارير: «من» و«إلى» سطران متتاليان والتسمية بجوار التاريخ */
  .rep-doc .prd2{display:flex; flex-direction:column; gap:2px; white-space:normal;
    max-width:100%; align-items:center;}
  .rep-doc .prd2 .p2{flex-direction:row; align-items:baseline; gap:4px; justify-content:center;}
  .rep-doc .prd2 .p2 b{font-size:10px; color:#8A7A6A; font-weight:700;}
  .rep-doc .prd2 .p2 i{font-size:12.5px; overflow-wrap:normal; white-space:nowrap;}
  .rep-doc td.wrap-ok{white-space:normal; overflow-wrap:anywhere;}
  /* بطاقات إحصائيات مصغّرة داخل إطار التقرير وموزّعة بانتظام */
  /* توزيع المؤشرات حول العنوان: يمين | العنوان | يسار */
  /* الكل داخل مربع واحد موسّع: مؤشرات يمينًا | العنوان | مؤشرات يسارًا */
  /* العنوان بلا إطار، والمؤربعات الجانبية أصغر */
  /* بطاقات صغيرة بارتفاع ثابت لا تتمدد للأسفل، والعنوان بلا إطار ويأخذ المساحة الأوسع */
  .rep-doc .kpi-around{display:flex; align-items:center; justify-content:space-between;
    gap:5px; margin:0 0 1mm; padding:0; width:100%; box-sizing:border-box;}
  .rep-doc .kpi-center .title-blk{margin:0; padding:0;}
  .rep-doc .title-ar{margin:0; line-height:1.1;}
  .rep-doc .title-sub{margin-top:0.4mm; line-height:1.1;}
  .rep-doc .kpi-side{display:flex; gap:4px; flex:0 0 auto; align-items:center;}
  .rep-doc .kpi-center{flex:1 1 auto; text-align:center; min-width:0;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:0 10px; border:none; background:transparent;}
  /* عنوان التقرير بلا إطار (نسخة أمر التكليف تحتفظ بإطارها) */
  .rep-doc .kpi-center .title-blk{margin:0; border:none !important; background:transparent !important;
    padding:0 !important; border-radius:0 !important;}
  .rep-doc .kpi-center .title-ar{line-height:1.15; margin:0;}
  .rep-doc .kpi-center .title-sub{margin-top:1mm;}
  /* خط فاصل فوق اسم المدرسة داخل التقرير */
  .rep-doc .sec-t{border-top:1px solid ${PRINT_LINE_COLOR}; padding-top:1mm; margin-top:2mm;}
  .rep-doc .kpi{flex:0 0 auto; width:74px; height:46px; box-sizing:border-box; text-align:center;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    border:1px solid ${PRINT_LINE_COLOR}; border-radius:6px; padding:2px 3px; background:#FBF9FA;
    overflow:hidden;}
  .rep-doc .kpi-ic{display:block; font-size:8px; line-height:1; opacity:.8; color:${PRINT_THEME};}
  .rep-doc .kpi-ic svg{width:10px; height:10px; display:block;}
  .rep-doc .kpi-v{font-size:15px; font-weight:700; line-height:1.05; color:${PRINT_THEME};}
  .rep-doc .kpi-l{font-size:8.5px; line-height:1.15; color:#555; white-space:nowrap;
    overflow:hidden; text-overflow:ellipsis; max-width:100%;}
  /* شاشات/أوراق ضيقة: تتحول لصفوف متتالية متوازنة داخل نفس المربع */
  @media print{
    .rep-doc .kpi-around{display:flex !important; flex-wrap:nowrap !important;
      page-break-inside:avoid; break-inside:avoid;}
    .rep-doc .kpi-center{flex:1 1 auto !important; order:0 !important;}
    .rep-doc .kpi-side{flex:0 0 auto !important;}
    .rep-doc .kpi{width:66px !important; height:40px !important;}
  }
  /* الورقة ثابتة العرض، فلا نكسر الصف — نصغّر البطاقات فقط */
  @media (max-width:760px){
    .rep-doc .kpi{width:58px; height:38px;}
    .rep-doc .kpi-v{font-size:13px;}
    .rep-doc .kpi-l{font-size:7px;}
  }
  /* أعمدة متناسقة: # ضيق، والفعالية في سطر واحد */
  .rep-doc th:first-child, .rep-doc td:first-child{width:1%; white-space:nowrap;}
  /* تقرير مكان التنفيذ: عدّاد المكان والفعالية الملغاة */
  .rep-doc .vn-gn{font-weight:600; font-size:8.5pt; opacity:.85;}
  .rep-doc .vn-cx{color:#C0392B; font-weight:700;}
</style>`;
/* تصغير تلقائي لخط الخلايا الطويلة حتى 11px دون قصّ النص */
const REPORT_FIT_SCRIPT = `<script>
(function(){
  /* 1) يصغّر خط الجدول كله تدريجيًا حتى يتسع عرض الصفحة (بحد أدنى 11px)
     2) ثم يعالج الخلايا التي ما زالت أطول من عمودها فرديًا
     3) وكحل أخير يسمح بالالتفاف بدل قصّ البيانات */
  function fitTables(){
    document.querySelectorAll('.rep-doc table').forEach(function(tb){
      /* عمود العنوان (الأطول نصًا) يأخذ نصيبًا أكبر ضمن التخطيط الثابت */
      var best = -1, bestLen = 0;
      tb.querySelectorAll('tbody tr').forEach(function(tr){
        tr.querySelectorAll('td').forEach(function(td, i){
          if(i === 0) return;
          var L = (td.textContent||'').trim().length;
          if(L > bestLen){ bestLen = L; best = i; }
        });
      });
      var ths = tb.querySelectorAll('thead th');
      if(best >= 0 && ths.length > 4){
        if(ths[best]) ths[best].classList.add('col-grow');
        tb.querySelectorAll('tbody tr').forEach(function(tr){
          var td = tr.children[best]; if(td) td.classList.add('col-grow');
        });
      }
      /* تصغير الخط تدريجيًا إن تجاوز الجدول عرض الورقة (بحد أدنى 10px) */
      var host = tb.parentElement || document.body;
      var size = parseFloat(getComputedStyle(tb).fontSize) || 13;
      var guard = 0;
      while(tb.scrollWidth > host.clientWidth + 1 && size > 10 && guard < 30){
        size -= 0.5; tb.style.fontSize = size + 'px'; guard++;
      }
    });
  }
  if(document.readyState === 'complete') fitTables();
  else window.addEventListener('load', fitTables);
})();
<\/script>`;
/* أعراض قياسية لأعمدة التقارير — تُطبَّق تلقائيًا حسب عنوان العمود */
/* ══════════════════════════════════════════════════════════════════
   عروض أعمدة التقارير — مقيسة على ورق A4 عرضي (≈280mm مساحة مفيدة).
   ──────────────────────────────────────────────────────────────────
   fit:true  → عمود رقمي قصير، سطر واحد وتوسيط (المدة، الساعات، الرقم)
   fit:false → عمود نصّي بعرض ثابت لكن محتواه يلتف (التاريخ، الوقت، المقدّم)
   العنوان يلتف دائمًا مهما ضاق العمود، فلا يخرج نصّه خارج خط العمود.
   ══════════════════════════════════════════════════════════════════ */
const REP_COL_W = [
  /* رقم أمر التكليف بكل مسمياته — يتسع لخمسة أرقام داخل حدّ العمود.
     لا توسّعه: مجموع العروض الثابتة في التقارير العريضة يقارب عرض
     الورقة، وكل مليمتر هنا يُقتطع من الأعمدة النصّية. */
  [/^#$|^م$|^أمر التكليف$|^رقم التكليف$|^رقم الأمر$/, '17mm', true],
  [/^المدة$/,                                          '21mm', true],
  [/عدد الأيام|^الأيام$/,                              '15mm', true],
  [/عدد الساعات|^الساعات$/,                            '19mm', true],
  /* «المستهدفون» كلمة واحدة لا تُلَفّ؛ قياس مستند الطباعة يقول إنها
     تحتاج 24mm، وما دونها يكسرها في منتصفها (المستهدفو/ن) */
  [/^عدد المستهدفين$|^المستهدفون$|^عدد المشاركين$/,     '24mm', true],
  [/^تقييم /,                                          '17mm', true],
  /* أعمدة نصّية: عرض يوازي المدخلات بدل أن يتمدّد بلا داعٍ */
  [/^التاريخ$|^التاريخ \(من — إلى\)$|^تاريخ المبادرة$/, '30mm', false],
  [/^الوقت$/,                                           '28mm', false],
  [/^مقدم الفعالية$|^مقدم المبادرة$|^مقدم البرنامج$|^المقدّمون$|^المقدمون$/, '40mm', false],
];
function repColSpec(header){
  const t = String(header||'').replace(/<[^>]+>/g,'').trim();
  for(const [re,w,fit] of REP_COL_W) if(re.test(t)) return {w, fit:!!fit};
  return {w:'auto', fit:false};
}
function repColWidth(header){ return repColSpec(header).w; }
function repTableHtml(headers, rows, opts){
  opts = opts || {};
  const widths = (opts.colWidths && opts.colWidths.length) ? opts.colWidths : headers.map(repColWidth);
  const specs  = headers.map(repColSpec);
  const colg = `<colgroup>${widths.map(w=>`<col${w&&w!=='auto'?` style="width:${w}"`:''}>`).join('')}</colgroup>`;
  const cls = i => (!widths[i] || widths[i]==='auto') ? ''
                 : (specs[i].fit ? ' class="rw-fit"' : ' class="rw-w"');
  const head = headers.map((hh,i)=>{
    const s = String(hh);
    return `<th${cls(i)}>${s.trim().startsWith('<') ? s : escapeHtml(s)}</th>`;
  }).join('');
  let body;
  if(rows && rows.length){
    body = rows.map(r=>{
      if(typeof r === 'string') return r;                 // صف جاهز (الإجماليات مثلًا)
      const cells = r.cells || r;
      const attr  = r.rowAttr || '';
      return `<tr${attr}>${cells.map((c,i)=>{
        const extra = (r.tdAttr && r.tdAttr[i]) ? r.tdAttr[i] : '';
        return `<td${cls(i)}${extra}>${c}</td>`;
      }).join('')}</tr>`;
    }).join('');
  } else {
    body = `<tr><td colspan="${headers.length}" style="text-align:center;color:#999;padding:16px;">لا توجد بيانات</td></tr>`;
  }
  return `<table class="rep-tbl${opts.tableClass?' '+opts.tableClass:''}">${colg}`
       + `<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

