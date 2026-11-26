/* ══════════════════════════════════════════════════════════════
   التصميم الرسمي للتقارير (عدا نسختَي أمر التكليف)
   شريط عنوان عنابي بإطار ذهبي، بطاقات مؤشرات بأيقونات معيّنة،
   جدول برأس عنابي وأيقونات للأعمدة، وتذييل بخط ذهبي.
   ══════════════════════════════════════════════════════════════ */
const REP_TH_IC = [
  [/^#$|^م$|^رقم التكليف$|^أمر التكليف$|^رقم الأمر$/, null],
  [/مقدم|مقدّم|المدرب|المعلم/, 'user'],
  [/هاتف|جوال|رقم المشرف/, 'phone'],
  [/المشرف/, 'user'],
  [/الطلبات|طلب/, 'fileText'],
  [/عنوان|الفعالية|المبادرة|البرنامج|اسم/, 'megaphone'],
  [/تاريخ|الشهر|اليوم/, 'calendar'],
  [/الوقت|^الساعة$/, 'clock'],
  [/المدة|الساعات|الأيام/, 'hourglass'],
  [/المكان|الجهة|المدرسة|مكان|المسجد/, 'mapPin'],
  [/المجال|المسار|التصنيف|النوع|المرحلة/, 'layers'],
  [/الحالة|الإنجاز|التقييم|النتيجة/, 'checkCircle'],
  [/المستهدف|المستفيد|الطلاب|المشارك|عدد/, 'users'],
  [/نسبة|%/, 'barChart'],
];
function repThIcon(t){ for(const [re,ic] of REP_TH_IC) if(re.test(t)) return ic; return null; }
function repKpiIcon(l){
  l = String(l||'');
  if(/طلب/.test(l)) return 'fileText';
  if(/مستفيد|مستهدف|طلاب|مشارك/.test(l)) return 'users';
  if(/ساع/.test(l)) return 'clock';
  if(/مدرس|جه|أماكن|مكان|مدارس/.test(l)) return 'school';
  if(/مقدم|مقدّم|مدرب|معلم/.test(l)) return 'user';
  if(/تضارب|تعارض/.test(l)) return 'alert';
  if(/يوم|أيام/.test(l)) return 'calendar';
  if(/منجز|مكتمل|إنجاز|تم/.test(l)) return 'checkCircle';
  if(/فعالي|برامج|مبادر/.test(l)) return 'calendar';
  if(/نسبة|%/.test(l)) return 'barChart';
  return 'barChart';
}
const REP_V2_CSS = `<style>
  .rep-doc.v2{position:relative; overflow:hidden; background:#FDFBFA !important; border:1px solid #E6D9DE !important;
    border-radius:4px !important; padding:5mm 7mm 4mm !important; box-shadow:none;}
  .rep-doc.v2 > *{position:relative; z-index:1;}
  .rep-doc.v2 > .v2-deco{position:absolute; z-index:0; pointer-events:none;}
  .v2-deco.tl{top:0; left:0; width:46mm; height:40mm;}
  .v2-deco.tr{top:40mm; left:3mm; width:16mm; height:12mm;}
  .v2-deco.bl{bottom:0; left:0; width:52mm; height:34mm;}
  .v2-deco.br{bottom:0; right:0; width:44mm; height:30mm;}
  .v2-hdr{display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:5mm; margin:0 0 4mm;}
  .v2-org{text-align:right; line-height:1.35; padding-right:3mm;}
  .v2-org .l1{font-family:'Tajawal',Arial; font-weight:800; font-size:17pt; color:#8A1F42; line-height:1.2;}
  .v2-org .l2, .v2-org .l3{font-family:'Tajawal',Arial; font-weight:700; font-size:11pt; color:#8A1F42;}
  .v2-org .l3{display:inline-block; padding-bottom:1mm; border-bottom:1.6px solid #B08D57;}
  .v2-ttl{display:flex; align-items:center; justify-content:center;}
  .v2-docic{width:21mm; height:18mm; flex:none; display:flex; align-items:center; justify-content:center; color:#3E0D21;
    background:linear-gradient(135deg,#F3ECE4,#E4D5C3); clip-path:polygon(18% 0,100% 0,82% 100%,0 100%);
    margin-inline-end:-6mm; z-index:2; position:relative;}
  .v2-docic svg{width:10mm; height:10mm; stroke-width:1.7;}
  .v2-rib-g{background:linear-gradient(135deg,#D7B57C,#A9854D); clip-path:polygon(5% 0,100% 0,95% 100%,0 100%); padding:1.1mm 1.4mm;}
  .v2-rib{background:linear-gradient(135deg,#8A1F42 0%,#5E1430 60%,#3E0D21 100%); clip-path:polygon(5% 0,100% 0,95% 100%,0 100%);
    color:#fff; text-align:center; padding:2.4mm 15mm 2.6mm; min-width:110mm;}
  .v2-rib .title-ar{color:#fff !important; margin:0 !important; font-family:'Tajawal',Arial; font-weight:800; font-size:20pt; line-height:1.2; letter-spacing:.2px;}
  .v2-rib .s{font-family:'IBM Plex Sans Arabic','Tajawal',Arial; font-weight:600; font-size:10.5pt; opacity:.95; margin-top:.6mm;}
  .v2-logo{display:flex; align-items:center; justify-content:flex-start; gap:3mm; direction:ltr; padding-left:3mm;}
  .v2-logo .lg{width:19mm; height:19mm; border-radius:50%; background:#fff; box-shadow:0 1px 4px rgba(62,13,33,.18);
    display:flex; align-items:center; justify-content:center; overflow:hidden; color:#8A1F42; flex:none;}
  .v2-logo .lg img{width:100%; height:100%; object-fit:contain;}
  .v2-logo .tx{direction:rtl; text-align:right; line-height:1.15;}
  .v2-logo .tx b{display:block; font-family:'Tajawal',Arial; font-weight:800; font-size:14pt; color:#8A1F42; white-space:nowrap;}
  .v2-logo .tx i{display:block; font-style:normal; font-size:9.5pt; color:#3E0D21; direction:ltr; text-align:left;}
  .v2-kpis{display:flex; align-items:stretch; justify-content:center; margin:0 0 4mm; gap:0;}
  .v2-k{flex:0 1 66mm; min-width:0; display:flex; align-items:center; gap:5mm; background:#fff; border:1px solid #EADFE3;
    border-radius:9px; padding:2.4mm 5mm 2.4mm 4mm; box-shadow:0 1px 5px rgba(62,13,33,.07);}
  .v2-k .dm{width:12mm; height:12mm; flex:none; transform:rotate(45deg); border-radius:2.6mm; display:flex; align-items:center; justify-content:center;
    background:linear-gradient(135deg,#9A2A4E,#4A0F27); box-shadow:0 2px 5px rgba(62,13,33,.25); margin:0 1.5mm;}
  .v2-k .dm svg{transform:rotate(-45deg); color:#fff; width:6.4mm; height:6.4mm;}
  .v2-k .tx{flex:1; text-align:center; min-width:0;}
  .v2-k .v{font-family:'IBM Plex Sans Arabic','Tajawal',Arial; font-weight:800; font-size:21pt; color:#3E0D21; line-height:1.05;}
  .v2-k .l{font-family:'Tajawal',Arial; font-weight:700; font-size:11pt; color:#3E0D21; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
  .v2-k.slogan{background:linear-gradient(135deg,#fff,#F8F3EF);} 
  .v2-k.slogan .tx b{display:block; font-family:'Tajawal',Arial; font-weight:800; font-size:15pt; color:#3E0D21; line-height:1.25; white-space:nowrap;}
  .v2-k.slogan{flex:0 0 auto;}
  .v2-k.slogan .pp{color:#8A1F42; flex:none;} .v2-k.slogan .pp svg{width:12mm; height:12mm; stroke-width:2;}
  .v2-sep{width:1.2px; flex:none; background:linear-gradient(#fff0,#B08D57,#fff0); margin:2mm 4.5mm;}
  .v2-kpis.many .v2-k{flex:1 1 0; padding:2mm 3mm; gap:3mm;} .v2-kpis.many .v2-k .v{font-size:17pt;} .v2-kpis.many .v2-k .l{font-size:9.5pt;}
  .v2-kpis.many .v2-k .l{white-space:normal; line-height:1.15; overflow:visible; text-overflow:clip;}
  .v2-kpis.many .v2-k .dm{width:9.5mm; height:9.5mm; margin:0 1mm;} .v2-kpis.many .v2-sep{margin:2mm 2mm;}
  .v2-kpis.many .v2-k.slogan .tx b{font-size:11.5pt;} .v2-kpis.many .v2-k.slogan .pp svg{width:9mm; height:9mm;}
  /* الجدول */
  .rep-doc.v2 table{border-collapse:separate !important; border-spacing:0; border:1px solid #DCCBD2 !important; border-radius:10px; overflow:hidden;
    background:#fff; margin-bottom:4mm;}
  .rep-doc.v2 th{background:linear-gradient(180deg,#8A1F42,#6A1733) !important; color:#fff !important; border:none !important;
    border-left:1px solid rgba(255,255,255,.16) !important; padding:2mm 1.5mm !important; font-family:'Tajawal',Arial; font-weight:800; font-size:10.5pt !important;
    vertical-align:bottom; line-height:1.2;}
  .rep-doc.v2 th:last-child{border-left:none !important;}
  .rep-doc.v2 th:first-child, .rep-doc.v2 td:first-child{width:11mm; min-width:10mm; white-space:nowrap;}
  .rep-doc.v2 th .th-ic{display:block; margin:0 auto 1mm; line-height:0;} .rep-doc.v2 th .th-ic svg{width:5mm; height:5mm; color:#fff; stroke-width:1.9;}
  .rep-doc.v2 td{border:none !important; border-bottom:1px solid #EFE5E9 !important; border-left:1px solid #EFE5E9 !important;
    padding:1.8mm 2mm !important; font-size:10.5pt; color:#2A1A20;}
  .rep-doc.v2 td:last-child{border-left:none !important;}
  .rep-doc.v2 tbody tr:last-child td{border-bottom:none !important;}
  .rep-doc.v2 tfoot td{background:#F3EAEE !important; font-weight:800; color:#3E0D21;}
  .rep-doc.v2 .sec-t{border:none !important; border-right:4px solid #B08D57 !important; padding:0 3mm 0 0 !important; margin:3mm 0 2mm !important;
    color:#8A1F42; font-size:12.5pt;}

  /* رأس الصفحة: شريط أفقي واحد */
  .v3-hdr{display:grid; grid-template-columns:13mm auto 1.4px 1fr auto 15mm; align-items:center; gap:0; height:24mm; margin:0 0 4mm;
    background:#fff; border:1px solid #E3D6DC; border-radius:4px; overflow:hidden; box-shadow:0 1px 4px rgba(62,13,33,.06);}
  .v3-end{width:100%; height:100%; display:block;}
  .v3-org{text-align:right; padding:0 3mm 0 6mm; line-height:1.4;}
  .v3-org .l1{font-family:'Tajawal',Arial; font-weight:800; font-size:13.5pt; color:#7A1A3A; line-height:1.3; white-space:nowrap;}
  .v3-org .l2{font-family:'Tajawal',Arial; font-weight:700; font-size:10pt; color:#3E0D21; white-space:nowrap;}
  .v3-div{width:1.4px; height:62%; background:linear-gradient(#C9A46A00,#C9A46A,#C9A46A00);}
  .v3-ttl{text-align:center; padding:0 5mm; min-width:0;}
  .v3-hdr .v3-ttl .title-ar{font-family:'Tajawal',Arial; font-weight:800; font-size:18pt; color:#7A1A3A !important; line-height:1.25; margin:0;}
  .v3-sub{display:inline-flex; align-items:center; gap:2.5mm; margin-top:1mm; font-size:10.5pt; font-weight:700; color:#3E0D21;}
  .v3-sub .cal{width:7mm; height:7mm; border-radius:1.6mm; background:#7A1A3A; color:#fff; display:inline-flex; align-items:center; justify-content:center; flex:none;}
  .v3-sub .cal svg{width:4.4mm; height:4.4mm;}
  .v3-logo{display:flex; align-items:center; gap:3mm; direction:ltr; padding:0 2mm 0 4mm;}
  .v3-logo .lg{width:17mm; height:17mm; border-radius:50%; background:#fff; box-shadow:0 1px 4px rgba(62,13,33,.18); display:flex; align-items:center; justify-content:center;
    overflow:hidden; color:#7A1A3A; flex:none;}
  .v3-logo .lg img{width:100%; height:100%; object-fit:contain;} .v3-logo .lg svg{width:9mm; height:9mm;}
  .v3-logo .tx{direction:rtl; text-align:right; line-height:1.2;}
  .v3-logo .tx b{display:block; font-family:'Tajawal',Arial; font-weight:800; font-size:12pt; color:#7A1A3A; white-space:nowrap;}
  .v3-logo .tx i{display:block; font-style:normal; font-size:8.5pt; color:#3E0D21; direction:ltr; text-align:left;}
  /* التذييل */
  .v2-ftr{margin-top:5mm; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:4mm; break-inside:avoid; page-break-inside:avoid;}
  .v2-ftr .ln{height:0; border-top:1.4px solid #B08D57; position:relative;}
  .v2-ftr .ln::before{content:''; position:absolute; top:-2.1mm; width:3mm; height:3mm; border:1.3px solid #B08D57; background:#FDFBFA; transform:rotate(45deg);}
  .v2-ftr .ln.r::before{left:-1mm;} .v2-ftr .ln.l::before{right:-1mm;}
  .v2-ftr .mid{display:flex; align-items:center; gap:3mm; font-size:9.5pt; color:#3E0D21; line-height:1.5;}
  .v2-ftr .pr{width:10mm; height:10mm; border-radius:50%; background:#fff; box-shadow:0 1px 4px rgba(62,13,33,.2); display:flex; align-items:center; justify-content:center; color:#8A1F42; flex:none;}
  .v2-ftr .pr svg{width:5.4mm; height:5.4mm;}
  .v2-ftr .mid b{font-weight:700;}
  .rph{display:inline-flex; align-items:center; gap:1mm; white-space:nowrap; direction:ltr;}
  .rph-n{color:inherit !important; text-decoration:none;}
  .rph-n:hover{text-decoration:underline;}
  .rph-w{display:inline-flex; color:#1E8E4E !important; text-decoration:none; line-height:0;}
  .rph-w svg{width:3.4mm; height:3.4mm;}
  @media print{ .rep-doc.v2{border:none !important;} }
</style>`;
const REP_V2_DECO = `
  <svg class="v2-deco bl" viewBox="0 0 52 34" preserveAspectRatio="none" aria-hidden="true">
    <polygon points="0,34 0,6 30,34" fill="#8A1F42" opacity=".9"/><polygon points="0,34 0,18 46,34" fill="#B08D57" opacity=".35"/>
    <polygon points="18,34 52,10 52,34" fill="#5E1430" opacity=".12"/></svg>
  <svg class="v2-deco br" viewBox="0 0 44 30" preserveAspectRatio="none" aria-hidden="true">
    <polygon points="44,30 44,4 18,30" fill="#8A1F42" opacity=".9"/><polygon points="44,30 44,14 4,30" fill="#B08D57" opacity=".35"/></svg>`;
function repV2Header(titleAr, subtitle){
  const ph = Object.assign({line1:'مؤسسة عيد الخيرية', line2:'مركز عيد الثقافي', line3:'قسم البرامج المجتمعية'}, state.printHeader||{});
  const en = /عيد الثقافي/.test(ph.line2||'') ? 'Eid Cultural Center' : '';
  const hasDate = /\d{2}\/\d{2}\/\d{4}/.test(subtitle||'');
  return `<div class="v3-hdr">
    <svg class="v3-end r" viewBox="0 0 40 60" preserveAspectRatio="none" aria-hidden="true">
      <polygon points="22,0 40,0 40,60 22,60 33,30" fill="#7A1A3A"/>
      <polygon points="26,0 40,0 40,60 26,60 37,30" fill="#5E1430"/>
      <polyline points="15,0 27,30 15,60" fill="none" stroke="#C9A46A" stroke-width="3"/></svg>
    <div class="v3-org"><div class="l1">${escapeHtml(ph.line1||'')}</div><div class="l2">${escapeHtml(ph.line2||'')}</div>${ph.line3?`<div class="l2">${escapeHtml(ph.line3)}</div>`:''}</div>
    <span class="v3-div"></span>
    <div class="v3-ttl"><div class="title-ar">${escapeHtml(titleAr||'')}</div>
      ${subtitle?`<div class="v3-sub"><span>${escapeHtml(subtitle)}</span>${hasDate?`<span class="cal">${icon('calendar',16)}</span>`:''}</div>`:''}</div>
    <div class="v3-logo"><div class="lg">${state.logo?`<img src="${state.logo}" alt="">`:BRAND_MARK_SVG}</div>
      <div class="tx"><b>${escapeHtml(ph.line2||'')}</b>${en?`<i>${en}</i>`:''}</div></div>
    <svg class="v3-end l" viewBox="0 0 40 60" preserveAspectRatio="none" aria-hidden="true">
      <polygon points="0,0 26,0 0,44" fill="#7A1A3A"/><polygon points="0,0 14,0 0,24" fill="#5E1430"/>
      <line x1="33" y1="0" x2="0" y2="56" stroke="#C9A46A" stroke-width="3"/></svg>
  </div>`;
}
function repV2Kpis(kpis){
  const ph = Object.assign({slogan:'معاً.. نبنى جيل المستقبل'}, state.printHeader||{});
  const sl = String(ph.slogan||'').replace(/\.\.+\s*/,'…|').split('|');
  const cards = (kpis||[]).length>=5 ? [] : [`<div class="v2-k slogan"><span class="pp">${icon('users',40)}</span><span class="tx"><b>${escapeHtml(sl[0]||'')}</b>${sl[1]?`<b>${escapeHtml(sl[1])}</b>`:''}</span></div>`];
  (kpis||[]).forEach(k=>{
    const m = String(k.l).match(/^((?:\p{Extended_Pictographic}|️|‍)+)\s*(.*)$/u);
    const tx = m ? m[2] : String(k.l);
    cards.push(`<div class="v2-k"><span class="tx"><div class="v">${escapeHtml(String(k.v))}</div><div class="l">${escapeHtml(tx)}</div></span>
      <span class="dm">${icon(repKpiIcon(tx),24)}</span></div>`);
  });
  if(!cards.length) return '';
  return `<div class="v2-kpis${cards.length>4?' many':''}">${cards.join('<span class="v2-sep"></span>')}</div>`;
}
function repV2Footer(){
  const ph = state.printHeader || {};
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ar-QA-u-nu-latn', {hour:'2-digit', minute:'2-digit'});
  return `<div class="v2-ftr"><span class="ln r"></span>
    <div class="mid"><span class="pr">${icon('printer',20)}</span>
      <span><b>${escapeHtml([ph.line1, ph.line2].filter(Boolean).join(' – '))}</b><br>تمت الطباعة بتاريخ ${fmtDate(todayStr())} الساعة ${timeStr}</span></div>
    <span class="ln l"></span></div>`;
}
/* ══════ الهواتف في التقارير: رقم قابل للنقر للاتصال + أيقونة واتساب ══════ */
const REP_PH_RE = /(^|[^\d\/:.\-])((?:\+?974[\s-]?)?[3-7]\d{7})(?![\d\/:.])/g;
function repPhIntl(num){ const bare = String(num).replace(/\D/g,''); return bare.length===8 ? '974'+bare : bare; }
function repPhoneLinks(html){
  return String(html||'').replace(/>([^<]+)</g, (m, txt)=>'>' + txt.replace(REP_PH_RE, (mm, pre, num)=>{
    const intl = repPhIntl(num);
    return `${pre}<span class="rph"><a class="rph-n" href="tel:+${intl}" title="اتصال">${num}</a><a class="rph-w" href="https://wa.me/${intl}" target="_blank" rel="noopener" title="واتساب">${waIcon(12)}</a></span>`;
  }) + '<');
}
function linkifyPhonesIn(root){
  if(!root) return;
  const skip = n=>{ for(let p=n.parentElement; p && p!==root; p=p.parentElement){ if(/^(A|BUTTON|INPUT|TEXTAREA|SELECT|OPTION|SCRIPT|STYLE|LABEL)$/.test(p.tagName) || p.classList.contains('rph')) return true; } return false; };
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n=>{
    if(!n.nodeValue || !/[3-7]\d{7}/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
    return skip(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
  const nodes = []; while(w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n=>{
    REP_PH_RE.lastIndex = 0;
    const html = escapeHtml(n.nodeValue).replace(REP_PH_RE, (mm, pre, num)=>{
      const intl = repPhIntl(num);
      return `${pre}<span class="rph"><a class="rph-n" href="tel:+${intl}" title="اتصال">${num}</a><a class="rph-w" href="https://wa.me/${intl}" target="_blank" rel="noopener" title="واتساب" aria-label="واتساب">${waIcon(13)}</a></span>`;
    });
    if(html === escapeHtml(n.nodeValue)) return;
    const span = document.createElement('span'); span.innerHTML = html;
    n.replaceWith(...span.childNodes);
  });
}
(function(){
  let t = null;
  const run = ()=>{ t = null; const rc = document.getElementById('reportContent'); if(rc) linkifyPhonesIn(rc); };
  const mo = new MutationObserver(muts=>{
    if(!document.getElementById('reportContent')) return;
    if(muts.every(m=>m.target.closest && m.target.closest('.rph'))) return;
    if(!t) t = setTimeout(run, 120);
  });
  const start = ()=>mo.observe(document.body, {childList:true, subtree:true});
  if(document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();

function repV2ThIcons(html){
  html = html.replace(/من الساعة\s*([\d:]+)\s*إلى الساعة\s*([\d:]+)/g, 'من $1<br>إلى $2');
  return html.replace(/<th([^>]*)>([^<]+)<\/th>/g, (all, attrs, txt)=>{
    const t = txt.replace(/&[a-z#0-9]+;/gi,' ').trim();
    const ic = repThIcon(t);
    return ic ? `<th${attrs}><span class="th-ic">${icon(ic,18)}</span>${txt}</th>` : all;
  });
}
function buildReportDoc(opts){
  const theme = opts.theme || PRINT_THEME;
  let html = printDocOpen(theme);
  html = html.replace('</head>', REPORT_STYLES + REP_V2_CSS + '</head>');
  html = html.replace('<div class="doc">', '<div class="doc rep-doc v2">');
  html += REP_V2_DECO;
  html += repV2Header(opts.titleAr, opts.subtitle);
  html += repV2Kpis(opts.kpis);
  let body = '';
  if(opts.headers && opts.rows) body += repTableHtml(opts.headers, opts.rows, { colWidths: opts.colWidths, tableClass: opts.tableClass });
  if(opts.extraHtml) body += opts.extraHtml;
  html += repPhoneLinks(repV2ThIcons(body));
  html += repV2Footer();
  html += REPORT_FIT_SCRIPT;
  html += printDocClose();
  return html;
}

function renderAdminPage(c){
  const today=todayStr();
  c.classList.add('big-inputs');
  c.innerHTML = `
  <div class="card">
    <h2>عرض الفعاليات اليومية</h2>
    <div class="no-date-hint" style="display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end; margin-bottom:10px;">
      <div class="field" style="margin:0;"><label>من تاريخ</label><input id="adm_from" type="date" lang="en-GB" value="${today}" style="width:150px;"></div>
      <div class="field" style="margin:0;"><label>إلى تاريخ</label><input id="adm_to" type="date" lang="en-GB" value="${today}" style="width:150px;"></div>
      <div class="field" style="margin:0;"><label>🔎 أمر التكليف</label><input id="adm_serial" type="number" lang="en" placeholder="1234" style="width:150px;"></div>
    </div>
    <button class="btn btn-primary" id="adm_filter">عرض</button>
    <button class="icon-btn rect" id="adm_print" data-tip="طباعة" title="طباعة" aria-label="طباعة">${icon('printer',17)}</button>
    <button class="icon-btn rect" id="adm_pdf" data-tip="تنزيل PDF" title="تنزيل PDF" aria-label="تنزيل PDF">${icon('download',17)}</button>
    <button class="icon-btn rect" id="adm_excel" data-tip="تنزيل Excel" title="تنزيل Excel" aria-label="تنزيل Excel">${icon('sheet',17)}</button>
    <div class="adm-tools" style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-top:8px; padding-top:8px; border-top:1px dashed var(--line);">
      <select id="adm_reqPick" style="width:auto; min-width:190px;">
        <option value="">— كل الطلبات —</option>
        ${state.adminRequestsList.map(r=>`<option value="${r.id}">${escapeHtml(r.name)} — ${escapeHtml(r.category||'إداري')}</option>`).join('')}
      </select>
      <button class="icon-btn rect" id="adm_reqPrint" data-tip="طباعة هذا الطلب" title="طباعة هذا الطلب" aria-label="طباعة هذا الطلب">${icon('printer',17)}</button>
      <button class="icon-btn rect" id="adm_reqPdf" data-tip="PDF لهذا الطلب" title="PDF لهذا الطلب" aria-label="PDF لهذا الطلب">${icon('download',17)}</button>
      <button class="icon-btn rect" id="adm_reqExcel" data-tip="Excel لهذا الطلب" title="Excel لهذا الطلب" aria-label="Excel لهذا الطلب">${icon('sheet',17)}</button>
    </div>
  </div>
  <div class="card" id="adm_kpis"></div>
  <div class="card" id="adm_results"></div>`;
  function getList(){
    const from=document.getElementById('adm_from').value, to=document.getElementById('adm_to').value;
    const serialQ=document.getElementById('adm_serial').value.trim();
    // البحث برقم أمر التكليف يتجاوز فلتر التاريخ ليجد الفعالية أيًا كان تاريخها
    if(serialQ){
      return {list: state.orders.filter(o=>String(o.serial).includes(serialQ)).sort((a,b)=> (a.date||'').localeCompare(b.date||'')), from, to};
    }
    /* تصفية بالتقاطع: تُعرض الفعالية إذا تداخلت مدتها (من تاريخ البداية إلى تاريخ الانتهاء)
       مع الفترة المطلوبة — وليس فقط إذا كان تاريخ بدايتها داخلها. هذا يضمن ظهور الفعاليات
       متعددة الأيام التي تبدأ قبل الفترة وتمتد داخلها. */
    return {list: state.orders.filter(o=>{
      if(!isLiveOrder(o)) return false;
      const s = o.date || '';
      const e = orderEnd(o);
      if(!s && !e) return false;
      if(from && e && e < from) return false;
      if(to && s && s > to) return false;
      return true;
    }).sort((a,b)=> (a.date||'').localeCompare(b.date||'')), from, to};
  }
  function computeKpis(list){
    const trainerSet = new Set(); list.forEach(o=>(o.trainerIds||[]).forEach(id=>trainerSet.add(id)));
    const schoolSet = new Set(list.map(o=>o.schoolId).filter(Boolean));
    let totalHours=0; list.forEach(o=>{ if(o.timeFrom&&o.timeTo){ const s=parseDT(o.date,o.timeFrom), e=parseDT(o.date,o.timeTo); if(s&&e) totalHours+=Math.max(0,(e-s)/3600000)*daysCount(o.date,o.dateTo); } });
    let totalReqs=0; const reqCounts={};
    list.forEach(o=>(o.adminRequests||[]).forEach(id=>{ totalReqs++; reqCounts[id]=(reqCounts[id]||0)+1; }));
    return {events:list.length, trainers:trainerSet.size, hours:totalHours, schools:schoolSet.size, reqs:totalReqs, reqCounts};
  }
  function reqBreakdownTable(reqCounts){
    const rows = Object.entries(reqCounts).map(([id,count])=>{ const r=state.adminRequestsList.find(x=>x.id===id); return [r?r.name:id, count]; });
    if(!rows.length) return `<div class="empty-state">لا توجد طلبات إدارية ضمن هذه الفترة</div>`;
    return `<table><thead><tr><th>الطلب الإداري</th><th>عدد مرات الطلب</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r[0])}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table>`;
  }
  function doFilter(){
    const {list}=getList();
    const k = computeKpis(list);
    document.getElementById('adm_kpis').innerHTML = `<h2>ملخص الفترة</h2>
      <div class="stat-grid">
        ${statBox('📋', k.events, 'عدد الفعاليات')}
        ${statBox('\uD83E\uDDD1\u200D\uD83C\uDFEB', k.trainers, 'عدد المدربين')}
        ${statBox('⏱️', k.hours.toFixed(1), 'إجمالي عدد الساعات')}
        ${statBox('🏫', k.schools, 'عدد المدارس')}
        ${statBox('🗂️', k.reqs, 'عدد الطلبات الإدارية')}
      </div>
      <h3 style="margin-top:16px;font-family:var(--font-head);color:var(--maroon-800);">توزيع الطلبات الإدارية خلال الفترة</h3>
      ${reqBreakdownTable(k.reqCounts)}`;
    const box_adm = document.getElementById('adm_results');
    box_adm.innerHTML = `<h2>النتائج (${list.length})</h2>` + dailyReportTable(list);
    enhanceReportTable(box_adm);
  }
  document.getElementById('adm_filter').onclick=doFilter;
  document.getElementById('adm_serial').addEventListener('input', doFilter);
  /* طباعة/تصدير طلب إداري واحد على حدة */
  function reqFilteredRows(){
    const rid = document.getElementById('adm_reqPick').value;
    const {list, from, to} = getList();
    const req = state.adminRequestsList.find(r=>r.id===rid);
    const filtered = rid ? list.filter(o=>(o.adminRequests||[]).includes(rid)) : list;
    return {rid, req, list:filtered, from, to};
  }
  function reqRowsOf(list){
    return list.map((o,i)=>{
      const school = state.schools.find(s=>s.id===o.schoolId);
      const supervisor = school ? school.supervisors.find(s=>s.id===o.supervisorId) : null;
      return [i+1, o.serial, o.title, fmtDate(o.date), fmtDate(orderEnd(o)),
              fullTimeRange(o.timeFrom,o.timeTo), school?school.name:'',
              supervisor?supervisor.phone||'':'', trainerNames(o), trainerPhones(o)];
    });
  }
  const REQ_HEADERS = ['م','أمر التكليف','عنوان الفعالية','من تاريخ','إلى تاريخ','الوقت','المكان','رقم المشرف','مقدم البرنامج','رقم هاتفه'];
  function reqPrint(){
    const {req, list, from, to} = reqFilteredRows();
    if(!list.length){ toast('لا توجد فعاليات لهذا الطلب ضمن الفترة'); return; }
    doPrintDoc(buildReportDoc({
      titleAr: req ? `الطلب الإداري: ${req.name}` : 'كل الطلبات الإدارية',
      subtitle:`من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'} — عدد الفعاليات: ${list.length}`,
      headers: REQ_HEADERS,
      rows: reqRowsOf(list).map(r=>r.map(v=>escapeHtml(String(v))))
    }), true, 'A4');
  }
  document.getElementById('adm_reqPrint').onclick = reqPrint;
  document.getElementById('adm_reqPdf').onclick = reqPrint;
  document.getElementById('adm_reqExcel').onclick = ()=>{
    const {req, list, from, to} = reqFilteredRows();
    if(!list.length){ toast('لا توجد فعاليات لهذا الطلب ضمن الفترة'); return; }
    const nm = req ? req.name.replace(/[\\/:*?"<>|]/g,'') : 'كل_الطلبات';
    exportToExcel(`طلب_${nm}.xlsx`, REQ_HEADERS, reqRowsOf(list),
      `${req?req.name:'كل الطلبات الإدارية'} (من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'})`);
  };
  document.getElementById('adm_excel').onclick=()=>{
    const {list, from, to}=getList();
    const rows = list.map((o,i)=>{
      const school = state.schools.find(s=>s.id===o.schoolId);
      const supervisor = school ? school.supervisors.find(s=>s.id===o.supervisorId) : null;
      const reqs = (o.adminRequests||[]).map(id=>{const r=state.adminRequestsList.find(x=>x.id===id); return r?r.name:'';}).filter(Boolean).join('، ');
      return [i+1, o.serial, o.title, fmtDate(o.date), fmtDate(orderEnd(o)), fullTimeRange(o.timeFrom,o.timeTo), school?school.name:'', supervisor?supervisor.phone||'':'', o.participantsCount||'', trainerNames(o), trainerPhones(o), reqs||'—'];
    });
    exportToExcel('جدول_الفعاليات.xlsx', ['م','أمر التكليف','عنوان الفعالية','من تاريخ','إلى تاريخ','الوقت','المكان','رقم المشرف','عدد المشاركين','مقدم البرنامج','رقم هاتفه','الطلبات الإدارية للبرنامج'], rows, `جدول الفعاليات خلال فترة (من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'})`);
  };
  document.getElementById('adm_print').onclick=async ()=>{
    const {list, from, to}=getList();
    const k = computeKpis(list);
    const rows = await Promise.all(list.map(async (o,i)=>{
      const school = state.schools.find(s=>s.id===o.schoolId);
      const supervisor = school ? school.supervisors.find(s=>s.id===o.supervisorId) : null;
      const reqs = (o.adminRequests||[]).map(id=>{const r=state.adminRequestsList.find(x=>x.id===id); return r?r.name:'';}).filter(Boolean).join('، ');
      return [i+1, o.serial, escapeHtml(o.title), fmtDate(o.date), fmtDate(orderEnd(o)), escapeHtml(fullTimeRange(o.timeFrom,o.timeTo)), school?escapeHtml(school.name):'', supervisor&&supervisor.phone?phoneLink(supervisor.phone):'', o.participantsCount||'', trainerMiniTable(o), reqs||'—'];
    }));
    const reqRows = Object.entries(k.reqCounts).map(([id,count])=>{ const r=state.adminRequestsList.find(x=>x.id===id); return `<tr><td>${escapeHtml(r?r.name:id)}</td><td>${count}</td></tr>`; }).join('') || '<tr><td colspan="2" style="text-align:center;color:#999;">لا توجد</td></tr>';
    doPrintDoc(buildReportDoc({
      titleAr:'جدول الفعاليات خلال فترة', subtitle:`من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'}`,
      kpis:[{v:k.events,l:'عدد الفعاليات'},{v:k.trainers,l:'عدد المدربين'},{v:k.hours.toFixed(1),l:'إجمالي عدد الساعات'},{v:k.schools,l:'عدد المدارس'},{v:k.reqs,l:'عدد الطلبات الإدارية'}],
      headers:['م','أمر التكليف','عنوان الفعالية','من تاريخ','إلى تاريخ','الوقت','المكان','رقم المشرف','عدد المشاركين','مقدم البرنامج','الطلبات الإدارية للبرنامج'],
      rows,
      extraHtml:`<div class="sec-t">توزيع الطلبات الإدارية خلال الفترة</div><table><thead><tr><th>الطلب الإداري</th><th>عدد مرات الطلب</th></tr></thead><tbody>${reqRows}</tbody></table>`
    }), true, 'A4');
  };
  document.getElementById('adm_pdf').onclick=()=>document.getElementById('adm_print').onclick();
  doFilter();
}

/* ============ Admin Requests Report Page ============ */
function renderAdminRequestsReportPage(c){
  c.innerHTML = `
  <div class="card">
    <h2>تقرير الطلبات الإدارية</h2>
    <div class="grid">
      <div class="field"><label>البحث خلال</label><select id="arq_range"><option value="">فترة مخصصة (من/إلى)</option><option value="week">أسبوع بدءًا من</option><option value="month">شهر بدءًا من</option></select></div>
      <div class="field"><label>من تاريخ / تاريخ البداية</label><input id="arq_from" type="date" lang="en-GB"></div>
      <div class="field" id="arq_toWrap"><label>إلى تاريخ</label><input id="arq_to" type="date" lang="en-GB"></div>
    </div>
    <button class="btn btn-primary" id="arq_go">عرض</button>
    <button class="icon-btn rect" id="arq_print" title="طباعة الكل">🖨️ الكل</button>
    <button class="icon-btn rect" id="arq_excel" title="تنزيل Excel للكل">📊 الكل</button>
    <button class="icon-btn rect" id="arq_pdf" title="تنزيل PDF للكل">📄 الكل</button>
    <span style="margin-inline-start:10px;"></span>
    <button class="icon-btn rect" id="arq_printSel" title="طباعة المحدد فقط">🖨️ المحدد</button>
    <button class="icon-btn rect" id="arq_excelSel" title="تنزيل Excel للمحدد فقط">📊 المحدد</button>
    <button class="icon-btn rect" id="arq_pdfSel" title="تنزيل PDF للمحدد فقط">📄 المحدد</button>
    <span style="margin-inline-start:10px;"></span>
    <button class="btn btn-primary" id="arq_forms" title="ملف Excel بأوراق: تغطية إعلامية، سيارة المركز، طلب مندوب، مرافق — يُملأ تلقائيًا من الطلبات الإدارية (المحدد إن وُجد، وإلا كل الفترة)">${icon('sheet',15)} نماذج الطلبات (Excel)</button>
    <div class="helper" style="margin-top:8px;">«نماذج الطلبات»: تغطية إعلامية (تصوير وتوثيق، مونتاج) · سيارة المركز (توفير سيارة) · طلب مندوب (توفير مندوب لإيصال المدرب) · مرافق (حجز مخيم، حجز استراحة المؤسسة، توفير مقر المركز).</div>
  </div>
  <div class="card" id="arq_result"></div>`;

  document.getElementById('arq_range').addEventListener('change', (e)=>{
    document.getElementById('arq_toWrap').style.display = e.target.value ? 'none' : '';
  });

  function getList(){
    const range = document.getElementById('arq_range').value;
    const fromInput = document.getElementById('arq_from').value;
    let from = fromInput, to = document.getElementById('arq_to').value;
    if(range && fromInput){
      if(range==='week') to = addDaysISO(fromInput, 6);
      else if(range==='month'){
        const d = new Date(fromInput+'T00:00:00'); d.setMonth(d.getMonth()+1);
        const nx = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        to = addDaysISO(nx, -1);                     // بدون toISOString (يزيح اليوم في توقيت قطر)
      }
    }
    const list = state.orders.filter(o=> isLiveOrder(o) && (o.adminRequests||[]).length>0 && (!from||o.date>=from) && (!to||o.date<=to))
      .sort((a,b)=> (a.date||'').localeCompare(b.date||'') || a.serial-b.serial);
    return {list, from, to};
  }
  function rowsOf(list){
    const rows = [];
    list.forEach(o=>{
      const school = state.schools.find(s=>s.id===o.schoolId);
      const dateStr = o.dateTo && o.dateTo!==o.date ? `${fmtDate(o.date)} — ${fmtDate(o.dateTo)}` : fmtDate(o.date);
      const reqs = (o.adminRequests||[]).map(id=>{ const r=state.adminRequestsList.find(x=>x.id===id); return r?r.name:''; })
        .filter(Boolean).sort((a,b)=>a.localeCompare(b,'ar'));
      if(!reqs.length) return;
      /* أمر التكليف الواحد = صف واحد، وطلباته مجمّعة في مربع واحد */
      rows.push({o, school, dateStr, reqs, reqName: reqs.join('، ')});
    });
    return rows;
  }
  /* المكان + مكان التنفيذ الفعلي بخلفية صفراء للتمييز */
  function placeCell(o){ return repPlacePhone(o); }
  /* الطلبات الإدارية في مربع واحد — كل طلب في سطر */
  function reqsCell(r){
    return r.reqs.map(x=>`<div style="padding:1px 0;white-space:normal;overflow-wrap:anywhere;font-size:.9em;line-height:1.3;text-align:right;">• ${escapeHtml(x)}</div>`).join('');
  }
  function draw(){
    const {list} = getList();
    const rows = rowsOf(list);
    const box = document.getElementById('arq_result');
    const reqTotal = rows.reduce((s,r)=>s+r.reqs.length, 0);
    box.innerHTML = `<h2>النتائج — ${rows.length} ${eventWord(rows.length)} · ${reqTotal} طلب إداري</h2>
      <table><thead><tr><th></th><th>#</th><th>عنوان الفعالية</th><th>التاريخ</th><th>الوقت</th><th>المدة</th><th>المكان / هاتف المشرف</th><th>مقدم الفعالية</th><th>الطلبات الإدارية</th></tr></thead><tbody>
        ${rows.map(r=>`<tr><td><input type="checkbox" class="arq-check" data-id="${r.o.id}"></td><td>${r.o.serial}</td><td style="text-align:right;">${escapeHtml(r.o.title||'')}</td><td>${repPeriodCell(r.o)}</td><td>${escapeHtml(fullTimeRange(r.o.timeFrom,r.o.timeTo))}</td><td>${daysCount(r.o.date,r.o.dateTo)} ي / ${computeHours(r.o.timeFrom,r.o.timeTo,r.o.date,r.o.dateTo)} س</td><td>${placeCell(r.o)}</td><td>${repTrainers(r.o)}</td><td style="text-align:right;">${reqsCell(r)}</td></tr>`).join('') || '<tr><td colspan="9" class="empty-state">لا توجد طلبات إدارية ضمن هذه الفترة</td></tr>'}
      </tbody></table>`;
    enhanceReportTable(box);
  }
  document.getElementById('arq_go').onclick=draw;
  document.getElementById('arq_forms').onclick = ()=>{
    const {list, from, to} = getList();
    const ids = Array.from(document.querySelectorAll('.arq-check:checked')).map(cb=>cb.dataset.id);
    const use = ids.length ? list.filter(o=>ids.includes(o.id)) : list;
    if(!use.length){ toast('لا توجد فعاليات بطلبات إدارية في الفترة'); return; }
    exportRequestForms(use, from, to);
  };

  function selectedRows(){
    const ids = Array.from(document.querySelectorAll('.arq-check:checked')).map(cb=>cb.dataset.id);
    const {list} = getList();
    return rowsOf(list.filter(o=>ids.includes(o.id)));
  }
  function excelRowsOf(rows){
    return rows.map(r=>[r.o.serial, r.o.title||'', r.dateStr, fullTimeRange(r.o.timeFrom,r.o.timeTo), `${daysCount(r.o.date,r.o.dateTo)} يوم / ${computeHours(r.o.timeFrom,r.o.timeTo,r.o.date,r.o.dateTo)} ساعة`,
      (r.school?r.school.name:'') + (r.o.venue ? ` — مكان التنفيذ: ${r.o.venue}` : ''),
      trainerNames(r.o)+(trainerPhones(r.o)?' — '+trainerPhones(r.o):''), r.reqs.join('، ')]);
  }
  const excelHeaders = ['#','عنوان الفعالية','التاريخ','الوقت','المدة','المكان','مقدم المبادرة','الطلبات الإدارية'];

  document.getElementById('arq_excel').onclick=()=>{
    const {list, from, to} = getList();
    exportToExcel('الطلبات_الإدارية.xlsx', excelHeaders, excelRowsOf(rowsOf(list)), `تقرير الطلبات الإدارية (من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'})`);
  };
  document.getElementById('arq_excelSel').onclick=()=>{
    const rows = selectedRows();
    if(!rows.length){ toast('يرجى تحديد فعالية واحدة على الأقل'); return; }
    exportToExcel('الطلبات_الإدارية_محدد.xlsx', excelHeaders, excelRowsOf(rows), 'الطلبات الإدارية — فعاليات محددة');
  };

  function buildPrintRows(rows){
    return rows.map(r=>[r.o.serial, escapeHtml(r.o.title||''), repPeriodCell(r.o), escapeHtml(fullTimeRange(r.o.timeFrom,r.o.timeTo)), `${daysCount(r.o.date,r.o.dateTo)} ي / ${computeHours(r.o.timeFrom,r.o.timeTo,r.o.date,r.o.dateTo)} س`, placeCell(r.o), repTrainers(r.o), reqsCell(r)]);
  }
  async function printIt(){
    const {list, from, to} = getList();
    doPrintDoc(buildReportDoc({
      titleAr:'تقرير الطلبات الإدارية', subtitle:`من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'}`,
      kpis:[{v:rowsOf(list).length,l:'عدد الفعاليات'},{v:rowsOf(list).reduce((s,r)=>s+r.reqs.length,0),l:'عدد الطلبات الإدارية'}],
      headers:excelHeaders,
      rows: buildPrintRows(rowsOf(list))
    }), true, 'A4');
  }
  async function printSelected(){
    const rows = selectedRows();
    if(!rows.length){ toast('يرجى تحديد فعالية واحدة على الأقل'); return; }
    doPrintDoc(buildReportDoc({
      titleAr:'الطلبات الإدارية — فعاليات محددة', subtitle:`عدد الفعاليات المحددة: ${rows.length}`,
      headers:excelHeaders,
      rows: buildPrintRows(rows)
    }), true, 'A4');
  }
  document.getElementById('arq_print').onclick=printIt;
  document.getElementById('arq_pdf').onclick=printIt;
  document.getElementById('arq_printSel').onclick=printSelected;
  document.getElementById('arq_pdfSel').onclick=printSelected;
  draw();
}

/* ============ Quranic Activities Page (روح / الرحيق) ============ */
function renderQuranActivitiesPage(c){
  c.classList.add('big-inputs');
  c.innerHTML = `
  ${pageHeader('quranActivities')}
  <div class="tabs page-tabs-moved" style="display:none;">
    <button class="tab-btn" id="qa_tabEntry">إدخال البيانات</button>
    <button class="tab-btn" id="qa_tabReport">التقارير</button>
  </div>
  <div id="qa_sub"></div>`;
  const sub = document.getElementById('qa_sub');
  bindPageHeader(c, 'quranActivities');
  document.getElementById('qa_tabEntry').onclick=()=>{quranSubTab='entry'; editingQuranId=null; render();};
  document.getElementById('qa_tabReport').onclick=()=>{quranSubTab='report'; render();};
  if(quranSubTab==='report'){ renderQuranReportTab(sub); return; }
  renderQuranEntryForm(sub);
}

function renderQuranEntryForm(sub){
  const editing = editingQuranId ? state.quranActivities.find(x=>x.id===editingQuranId) : null;
  const _v = (k,d)=>editing ? (editing[k]??d) : d;
  const _prog = editing ? editing.programName : 'روح';
  const _meth = editing ? editing.method : 'حضوري';
  sub.innerHTML = `<div class="qa2">
    <div class="pk-card qa2-main">
      <div class="pk-head">
        <h2 class="pk-title">${icon('bookOpen',18)} ${editing?'تعديل سجل شهري':'إدخال بيانات شهرية'}
          <span class="pk-sub">${editing?`${escapeHtml(editing.programName)} — ${escapeHtml(editing.month||'')}`:'اختر البرنامج والشهر ثم أدخل الأرقام'}</span></h2>
      </div>
      <div class="qa2-body">
        <div class="qa2-prog" role="tablist" aria-label="البرنامج">
          ${['روح','الرحيق'].map(p=>`<button type="button" data-prog="${p}" class="${_prog===p?'on':''}">
            <span class="ic">${icon(p==='روح'?'sparkles':'bookOpen',20)}</span><span><b>برنامج ${p}</b><i>${p==='روح'?'8 أيام · المستهدف 450':'4 أيام · المستهدف 5'}</i></span></button>`).join('')}
          <select id="qa_program" hidden><option value="روح" ${_prog==='روح'?'selected':''}>روح</option><option value="الرحيق" ${_prog==='الرحيق'?'selected':''}>الرحيق</option></select>
        </div>

        <div class="qa2-sec"><div class="qa2-t">${icon('calendar',14)} الفترة</div>
          <div class="qa2-row">
            <label class="qa2-f w2"><span>الشهر</span><input id="qa_month" type="month" lang="en-GB" value="${_v('month','')}"></label>
            <label class="qa2-f"><span>من تاريخ</span><input id="qa_from" type="date" lang="en-GB" value="${_v('dateFrom','')}"></label>
            <label class="qa2-f"><span>إلى تاريخ</span><input id="qa_to" type="date" lang="en-GB" value="${_v('dateTo','')}"></label>
            <label class="qa2-f sm"><span>أيام التنفيذ</span><input id="qa_days" type="number" lang="en" min="0" value="${_v('execDays','')}"></label>
            <div class="qa2-f"><span>طريقة التسميع</span>
              <div class="pk-seg qa2-meth">${['حضوري','عن بُعد'].map(m=>`<button type="button" data-meth="${m}" class="${_meth===m?'on':''}">${m}</button>`).join('')}</div>
              <select id="qa_method" hidden><option value="حضوري" ${_meth==='حضوري'?'selected':''}>حضوري</option><option value="عن بُعد" ${_meth==='عن بُعد'?'selected':''}>عن بُعد</option></select>
            </div>
          </div>
        </div>

        <div class="qa2-sec"><div class="qa2-t">${icon('users',14)} المشاركون والإنجاز الشهري</div>
          <div class="qa2-nums">
            <label class="qa2-n"><span class="ic">${icon('user',16)}</span><span class="tx"><i>المعلمون</i><input id="qa_teachers" type="number" lang="en" min="0" placeholder="0" value="${_v('teachersCount','')}"></span></label>
            <label class="qa2-n"><span class="ic">${icon('users',16)}</span><span class="tx"><i>الطلاب</i><input id="qa_students" type="number" lang="en" min="0" placeholder="0" value="${_v('studentsCount','')}"></span></label>
            <label class="qa2-n"><span class="ic">${icon('bookOpen',16)}</span><span class="tx"><i>صفحات الحفظ</i><input id="qa_memPages" type="number" lang="en" min="0" placeholder="0" value="${_v('memPages','')}"></span>
              <em>= <output id="qa_memPartsTx">0</output> جزء</em></label>
            <label class="qa2-n"><span class="ic">${icon('refresh',16)}</span><span class="tx"><i>صفحات المراجعة</i><input id="qa_revPages" type="number" lang="en" min="0" placeholder="0" value="${_v('revPages','')}"></span>
              <em>= <output id="qa_revPartsTx">0</output> جزء</em></label>
          </div>
          <p class="qa2-hint">${icon('info',13)} كل ٢٠ صفحة = جزء واحد، وتُقرّب لأقرب ربع جزء تلقائيًا.</p>
        </div>

        <div class="qa2-acts">
          <button class="pk-btn pri" type="button" id="qa_save">${icon('checkCircle',15)} ${editing?'حفظ التعديلات':'حفظ البيانات'}</button>
          ${editing?`<button class="pk-btn" type="button" id="qa_cancelEdit">${icon('x',14)} إلغاء التعديل</button>`:''}
        </div>
      </div>
    </div>

    <aside class="pk-card qa2-side" aria-label="ملخص الإنجاز">
      <div class="pk-head"><h3 class="pk-title" style="font-size:14px;">${icon('barChart',16)} ملخص الإنجاز</h3></div>
      <div class="qa2-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" class="bg"/><circle cx="50" cy="50" r="42" class="fg" id="qa_ringFg"/></svg>
        <span><b id="qa_pctTx">0%</b><i>نسبة الإنجاز</i></span></div>
      <div class="qa2-kv"><span>الأجزاء المحفوظة</span><input id="qa_memParts" type="number" lang="en" value="${_v('memParts',0)}" readonly tabindex="-1"></div>
      <div class="qa2-kv"><span>الأجزاء المراجعة</span><input id="qa_revParts" type="number" lang="en" value="${_v('revParts',0)}" readonly tabindex="-1"></div>
      <div class="qa2-kv tot"><span>المنجز (أجزاء)</span><input id="qa_achieved" type="number" lang="en" value="${editing?((editing.memParts||0)+(editing.revParts||0)):0}" readonly tabindex="-1"></div>
      <label class="qa2-kv tgt"><span>${icon('activity',13)} المستهدف الشهري</span><input id="qa_target" type="number" lang="en" min="0" step="0.25" value="${editing?editing.monthlyTarget||'':''}"></label>
      <input id="qa_pct" type="number" lang="en" value="${_v('completionPct',0)}" readonly hidden>
    </aside>
  </div>`;
  sub.querySelectorAll('[data-prog]').forEach(b=>b.onclick = ()=>{
    const sel = document.getElementById('qa_program'); sel.value = b.dataset.prog;
    sub.querySelectorAll('[data-prog]').forEach(x=>x.classList.toggle('on', x===b));
    sel.dispatchEvent(new Event('change'));
  });
  sub.querySelectorAll('[data-meth]').forEach(b=>b.onclick = ()=>{
    document.getElementById('qa_method').value = b.dataset.meth;
    sub.querySelectorAll('[data-meth]').forEach(x=>x.classList.toggle('on', x===b));
  });

  /* اختيار الشهر يملأ من/إلى تاريخ بأول وآخر يوم فيه */
  const _qm = document.getElementById('qa_month');
  if(_qm) ['input','change'].forEach(ev=>_qm.addEventListener(ev, ()=>{
    const v = _qm.value;                       // YYYY-MM
    if(!/^\d{4}-\d{2}$/.test(v)) return;
    const [y,m] = v.split('-').map(Number);
    const last  = new Date(y, m, 0).getDate();  // آخر يوم في الشهر
    const pad   = n => String(n).padStart(2,'0');
    const f = document.getElementById('qa_from'), t = document.getElementById('qa_to');
    if(f){ f.value = `${y}-${pad(m)}-01`;    refreshDateView(f); }
    if(t){ t.value = `${y}-${pad(m)}-${pad(last)}`; refreshDateView(t); }
    /* أيام التنفيذ تتبع البرنامج لا عدد أيام الشهر */
  }));

  /* أيام التنفيذ الافتراضية لكل برنامج */
  const defaultDays = {'روح':8, 'الرحيق':4};
  function applyProgramDays(){
    const p = document.getElementById('qa_program').value;
    const d = document.getElementById('qa_days');
    if(d && defaultDays[p] !== undefined) d.value = defaultDays[p];
  }
  if(!editing) applyProgramDays();          // عند الإدخال الجديد فقط

  const defaultTargets = {'الرحيق':5, 'روح':450};
  document.getElementById('qa_program').addEventListener('change', (e)=>{
    applyProgramDays();
    const t = document.getElementById('qa_target');
    if(!t.value || Object.values(defaultTargets).map(String).includes(String(t.value))) t.value = defaultTargets[e.target.value] || '';
    recalc();
  });
  if(!editing){
    const t = document.getElementById('qa_target');
    if(!t.value) t.value = defaultTargets[document.getElementById('qa_program').value] || '';
  }

  function partsFromPages(pages){
    // كل 20 صفحة = جزء، مع احتساب حتى الربع والنصف جزء (تقريب لأقرب 0.25)
    return Math.round((pages/20)*4)/4;
  }
  function recalc(){
    const memPages = Number(document.getElementById('qa_memPages').value)||0;
    const revPages = Number(document.getElementById('qa_revPages').value)||0;
    const target = Number(document.getElementById('qa_target').value)||0;
    const memParts = partsFromPages(memPages);
    const revParts = partsFromPages(revPages);
    document.getElementById('qa_memParts').value = String(memParts);
    document.getElementById('qa_revParts').value = String(revParts);
    const achieved = memParts + revParts;
    document.getElementById('qa_achieved').value = String(achieved);
    const pct = target>0 ? Math.round((achieved/target)*1000)/10 : 0;
    document.getElementById('qa_pct').value = String(pct);
    const tx = (id,v)=>{ const e = document.getElementById(id); if(e) e.textContent = v; };
    tx('qa_memPartsTx', memParts); tx('qa_revPartsTx', revParts); tx('qa_pctTx', pct+'%');
    const fg = document.getElementById('qa_ringFg');
    if(fg){ const C = 2*Math.PI*42; fg.style.strokeDasharray = C; fg.style.strokeDashoffset = C*(1-Math.min(pct,100)/100);
      fg.style.stroke = pct>=100 ? 'var(--ds-ok)' : pct>=60 ? 'var(--ds-teal)' : 'var(--ds-gold)'; }
  }
  ['qa_memPages','qa_revPages','qa_target'].forEach(id=>document.getElementById(id).addEventListener('input', recalc));
  recalc();

  if(editing) document.getElementById('qa_cancelEdit').onclick=()=>{editingQuranId=null; render();};

  document.getElementById('qa_save').onclick=async ()=>{
    const programName=document.getElementById('qa_program').value;
    const month=document.getElementById('qa_month').value;
    if(!month){ toast('يرجى تحديد الشهر'); return; }
    recalc();
    const data = {
      programName, month,
      dateFrom:document.getElementById('qa_from').value,
      dateTo:document.getElementById('qa_to').value,
      execDays:Number(document.getElementById('qa_days').value)||0,
      method:document.getElementById('qa_method').value,
      teachersCount:Number(document.getElementById('qa_teachers').value)||0,
      studentsCount:Number(document.getElementById('qa_students').value)||0,
      memPages:Number(document.getElementById('qa_memPages').value)||0,
      memParts:Number(document.getElementById('qa_memParts').value)||0,
      revPages:Number(document.getElementById('qa_revPages').value)||0,
      revParts:Number(document.getElementById('qa_revParts').value)||0,
      monthlyTarget:Number(document.getElementById('qa_target').value)||0,
      completionPct:Number(document.getElementById('qa_pct').value)||0,
    };
    if(editing){
      Object.assign(editing, data);
      await saveState(); toast('تم حفظ التعديلات'); editingQuranId=null; render();
      return;
    }
    const dup = state.quranActivities.find(x=>x.programName===programName && x.month===month);
    if(dup){
      const ok = confirm(`يوجد سجل مسبق لبرنامج "${programName}" لشهر ${month}. هل تريد استبدال بياناته؟`);
      if(!ok) return;
      Object.assign(dup, data);
      await saveState(); toast('تم تحديث السجل الموجود'); render();
      return;
    }
    state.quranActivities.push({id:uid(), ...data, createdAt:Date.now()});
    await saveState(); toast('تم حفظ البيانات'); render();
  };
}

function renderQuranReportTab(sub){
  sub.innerHTML = `<div class="card">
    <h2>تقرير الأنشطة القرآنية</h2>
    <div class="fgrid">
      <div class="fbox"><label>${icon('bookOpen',13)} البرنامج</label>
        <select id="qr_program"><option value="">الكل</option><option value="روح">روح</option><option value="الرحيق">الرحيق</option></select></div>
      <div class="fbox"><label>${icon('calendar',13)} نوع التصفية</label>
        <select id="qr_mode">
          <option value="">الكل</option>
          <option value="month">شهر محدد</option>
          <option value="range">من شهر إلى شهر</option>
          <option value="dates">من تاريخ إلى تاريخ</option>
        </select></div>
      <div class="fbox" id="qr_monthBox" style="display:none;"><label>${icon('calendar',13)} الشهر</label>
        <input id="qr_month" type="month" lang="en-GB"></div>
      <div class="fbox" id="qr_fromBox" style="display:none;"><label>${icon('calendar',13)} من شهر</label>
        <input id="qr_from" type="month" lang="en-GB"></div>
      <div class="fbox" id="qr_toBox" style="display:none;"><label>${icon('calendar',13)} إلى شهر</label>
        <input id="qr_to" type="month" lang="en-GB"></div>
      <div class="fbox" id="qr_dFromBox" style="display:none;"><label>${icon('calendar',13)} من تاريخ</label>
        <input id="qr_dFrom" type="date" lang="en-GB"></div>
      <div class="fbox" id="qr_dToBox" style="display:none;"><label>${icon('calendar',13)} إلى تاريخ</label>
        <input id="qr_dTo" type="date" lang="en-GB"></div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:nowrap;align-items:center;">
      <button class="btn btn-primary" id="qr_go" style="font-size:11.5px;padding:7px 13px;">${icon('barChart',14)} عرض</button>
      <button class="icon-btn" id="qr_print" title="طباعة" aria-label="طباعة" style="width:28px;height:28px;padding:0;">${icon('printer',14)}</button>
      <button class="icon-btn" id="qr_pdf" title="تنزيل PDF" aria-label="تنزيل PDF" style="width:28px;height:28px;padding:0;">${icon('download',14)}</button>
      <button class="icon-btn" id="qr_excel" title="تنزيل Excel" aria-label="تنزيل Excel" style="width:28px;height:28px;padding:0;">${icon('sheet',14)}</button>
    </div>
  </div>`;
  /* الخيارات والنتيجة جنبًا إلى جنب */
  const _wrap = document.createElement('div'); _wrap.className='rep-split';
  const _opts = sub.firstElementChild;
  const _res  = document.createElement('div'); _res.className='card'; _res.id='qr_result';
  sub.innerHTML=''; _wrap.appendChild(_opts); _wrap.appendChild(_res); sub.appendChild(_wrap);

  /* إظهار حقول التصفية حسب النوع المختار فقط */
  const qrMode = document.getElementById('qr_mode');
  function syncQrMode(){
    const v = qrMode.value;
    const show = (id, on)=>{ const el=document.getElementById(id); if(el) el.style.display = on ? '' : 'none'; };
    show('qr_monthBox', v==='month');
    show('qr_fromBox',  v==='range');
    show('qr_toBox',    v==='range');
    show('qr_dFromBox', v==='dates');
    show('qr_dToBox',   v==='dates');
    if(v!=='month')  document.getElementById('qr_month').value='';
    if(v!=='range'){ document.getElementById('qr_from').value=''; document.getElementById('qr_to').value=''; }
    if(v!=='dates'){ document.getElementById('qr_dFrom').value=''; document.getElementById('qr_dTo').value=''; }
  }
  qrMode.addEventListener('change', ()=>{ syncQrMode(); document.getElementById('qr_go').click(); });
  syncQrMode();
  function getList(){
    const program=document.getElementById('qr_program').value;
    const month=document.getElementById('qr_month').value;
    const from=document.getElementById('qr_from').value;
    const to=document.getElementById('qr_to').value;
    const dFrom=document.getElementById('qr_dFrom').value;
    const dTo=document.getElementById('qr_dTo').value;
    return state.quranActivities.filter(x=>{
        if(program && x.programName!==program) return false;
        if(month && x.month!==month) return false;
        if(from && (x.month||'')<from) return false;
        if(to && (x.month||'')>to) return false;
        // تصفية بالتاريخ: يُقبل السجل إذا تقاطعت فترته مع الفترة المطلوبة
        if(dFrom || dTo){
          const s = x.dateFrom || x.dateTo || '';
          const e = x.dateTo || x.dateFrom || '';
          if(!s && !e) return false;
          if(dFrom && e && e < dFrom) return false;
          if(dTo && s && s > dTo) return false;
        }
        return true;
      })
      .sort((a,b)=> a.month.localeCompare(b.month) || a.programName.localeCompare(b.programName));
  }
  function totalsOf(list){
    const t = list.reduce((t,x)=>({
      memPages:t.memPages+x.memPages, memParts:t.memParts+x.memParts,
      revPages:t.revPages+x.revPages, revParts:t.revParts+x.revParts,
      execDays:t.execDays+x.execDays, pctSum:t.pctSum+x.completionPct
    }), {memPages:0,memParts:0,revPages:0,revParts:0,execDays:0,pctSum:0});

    /* المعلمون والطلاب أشخاص يتكررون كل شهر، فجمعهم شهريًا يضاعف نفس الأشخاص.
       نحتسب بدلاً من ذلك أعلى عدد سُجّل لكل برنامج خلال الفترة (يمثّل حجم المجموعة
       الفعلي دون تأثّر بغياب شهر معيّن)، ثم نجمع البرامج المختلفة معًا. */
    const maxByProgram = {};
    list.forEach(x=>{
      const p = x.programName || '';
      if(!maxByProgram[p]) maxByProgram[p] = {teachers:0, students:0};
      maxByProgram[p].teachers = Math.max(maxByProgram[p].teachers, x.teachersCount||0);
      maxByProgram[p].students = Math.max(maxByProgram[p].students, x.studentsCount||0);
    });
    t.teachersCount = Object.values(maxByProgram).reduce((s,v)=>s+v.teachers, 0);
    t.studentsCount = Object.values(maxByProgram).reduce((s,v)=>s+v.students, 0);
    return t;
  }
  function draw(){
    const list = getList();
    const t = totalsOf(list);
    const avgPct = list.length ? (t.pctSum/list.length).toFixed(1) : '0';
    const box = document.getElementById('qr_result');
    box.innerHTML = `<h2>النتائج (${list.length})</h2>
      <table><thead><tr><th>اسم البرنامج</th><th>الشهر</th><th>الفترة</th><th>أيام التنفيذ</th><th>آلية التسميع</th><th>المعلمين</th><th>الطلاب</th><th>صفحات الحفظ</th><th>الأجزاء المحفوظة</th><th>صفحات المراجعة</th><th>الأجزاء المراجعة</th><th>نسبة الإنجاز %</th>${currentRole==='admin'?'<th>إجراءات</th>':''}</tr></thead><tbody>
        ${list.map(x=>`<tr><td>${escapeHtml(x.programName)}</td><td>${monthNameAr(x.month)}</td><td>${fmtDate(x.dateFrom)} — ${fmtDate(x.dateTo)}</td><td>${x.execDays}</td><td>${escapeHtml(x.method)}</td><td>${x.teachersCount}</td><td>${x.studentsCount}</td><td>${x.memPages}</td><td>${x.memParts}</td><td>${x.revPages}</td><td>${x.revParts}</td><td>${x.completionPct}%</td>${currentRole==='admin'?`<td><button class="icon-btn" title="تعديل" aria-label="تعديل" onclick="editQuranRecord('${x.id}')">${icon('edit',16)}</button> <button class="icon-btn" title="استنساخ لشهر آخر" aria-label="استنساخ لشهر آخر" onclick="cloneQuranRecord('${x.id}')">${icon('copy',16)}</button> <button class="icon-btn" title="حذف" aria-label="حذف" onclick="deleteQuranRecord('${x.id}')">${icon('trash',16)}</button></td>`:''}</tr>`).join('') || `<tr><td colspan="13" class="empty-state">لا توجد سجلات مطابقة</td></tr>`}
      </tbody>
      ${list.length?`<tfoot><tr style="font-weight:700;background:#F8F5F3;"><td colspan="3">الإجمالي</td><td>${t.execDays}</td><td></td><td>${t.teachersCount}</td><td>${t.studentsCount}</td><td>${t.memPages}</td><td>${t.memParts}</td><td>${t.revPages}</td><td>${t.revParts}</td><td>${avgPct}%</td>${currentRole==='admin'?'<td></td>':''}</tr></tfoot>`:''}
      </table>`;
    enhanceReportTable(box);
  }
  document.getElementById('qr_go').onclick=draw;

  function periodLabel(){
    const m=document.getElementById('qr_month').value;
    const f=document.getElementById('qr_from').value, t=document.getElementById('qr_to').value;
    const df=document.getElementById('qr_dFrom').value, dt=document.getElementById('qr_dTo').value;
    if(df||dt) return `من ${df?fmtDate(df):'البداية'} إلى ${dt?fmtDate(dt):'النهاية'}`;
    if(m) return monthNameAr(m);
    if(f||t) return `من ${f?monthOnlyAr(f):'البداية'} إلى ${t?monthOnlyAr(t):'النهاية'}`;
    return 'كل الأشهر';
  }
  document.getElementById('qr_excel').onclick=()=>{
    const list=getList();
    const rows=list.map(x=>[x.programName,monthNameAr(x.month),fmtDate(x.dateFrom),fmtDate(x.dateTo),x.execDays,x.method,x.teachersCount,x.studentsCount,x.memPages,x.memParts,x.revPages,x.revParts,x.completionPct]);
    exportToExcel('تقرير_الأنشطة_القرآنية.xlsx', ['اسم البرنامج','الشهر','من','إلى','أيام التنفيذ','آلية التسميع','المعلمين','الطلاب','صفحات الحفظ','الأجزاء المحفوظة','صفحات المراجعة','الأجزاء المراجعة','نسبة الإنجاز %'], rows, `تقرير الأنشطة القرآنية (${periodLabel()})`);
  };
  function printIt(){
    const list=getList();
    const t=totalsOf(list);
    const avgPct = list.length ? (t.pctSum/list.length).toFixed(1) : '0';
    const rows=list.map(x=>[escapeHtml(x.programName),monthNameAr(x.month),`${fmtDate(x.dateFrom)} — ${fmtDate(x.dateTo)}`,x.execDays,escapeHtml(x.method),x.teachersCount,x.studentsCount,x.memPages,x.memParts,x.revPages,x.revParts,x.completionPct+'%']);
    doPrintDoc(buildReportDoc({
      titleAr:'تقرير الأنشطة القرآنية — روح والرحيق', subtitle:`${periodLabel()} — عدد السجلات: ${list.length}`, subtitleNumFont:true,
      kpis:[{v:t.teachersCount,l:'\uD83E\uDDD1\u200D\uD83C\uDFEB إجمالي المعلمين'},{v:t.studentsCount,l:'👥 إجمالي الطلاب'},{v:t.memPages,l:'📖 إجمالي صفحات الحفظ'},{v:t.revPages,l:'🔁 إجمالي صفحات المراجعة'},{v:avgPct+'%',l:'📊 متوسط نسبة الإنجاز'}],
      headers:['اسم البرنامج','الشهر','الفترة','أيام التنفيذ','آلية التسميع','المعلمين','الطلاب','صفحات الحفظ','الأجزاء المحفوظة','صفحات المراجعة','الأجزاء المراجعة','نسبة الإنجاز'],
      rows
    }), true, 'A4');
  }
  document.getElementById('qr_print').onclick=printIt;
  document.getElementById('qr_pdf').onclick=printIt;
  draw();
}
function editQuranRecord(id){ editingQuranId=id; quranSubTab='entry'; render(); }
/* استنساخ سجل نشاط قرآني بنفس بياناته مع تغيير الشهر فقط */
function cloneQuranRecord(id){
  const src = state.quranActivities.find(x=>x.id===id);
  if(!src){ toast('السجل غير موجود'); return; }
  /* الشهر التالي كقيمة مقترحة */
  let suggest = src.month || '';
  if(/^\d{4}-\d{2}$/.test(suggest)){
    const [y,m] = suggest.split('-').map(Number);
    const d = new Date(y, m, 1);   // m هنا يعني الشهر التالي (0-based)
    suggest = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  }
  openModal(`استنساخ سجل: ${src.programName}`, [
    {name:'month', label:'الشهر الجديد', type:'month', placeholder:'YYYY-MM'},
    {name:'dateFrom', label:'من تاريخ (اختياري)', type:'date'},
    {name:'dateTo', label:'إلى تاريخ (اختياري)', type:'date'},
  ], async v=>{
    const mo = (v.month||'').trim();
    if(!/^\d{4}-\d{2}$/.test(mo)){ toast('أدخل الشهر بصيغة صحيحة'); return false; }
    if(state.quranActivities.some(x=>x.programName===src.programName && x.month===mo)){
      if(!confirm(`يوجد سجل لبرنامج "${src.programName}" في ${monthNameAr(mo)}.\nهل تريد إضافة سجل آخر؟`)) return false;
    }
    const copy = Object.assign({}, src, {
      id: uid(),
      month: mo,
      dateFrom: v.dateFrom || '',
      dateTo: v.dateTo || '',
      createdAt: Date.now()
    });
    state.quranActivities.push(copy);
    await saveState();
    toast(`تم استنساخ السجل إلى ${monthNameAr(mo)}`);
    render();
  });
  const mEl = document.getElementById('mf_month'); if(mEl && suggest) mEl.value = suggest;
}
async function deleteQuranRecord(id){
  if(!confirm('هل تريد حذف هذا السجل؟')) return;
  state.quranActivities = state.quranActivities.filter(x=>x.id!==id);
  await saveState(); renderKeepForm();
}

/* ============ Reports Page ============ */
const REPORT_GROUPS = [
  { t:'تقارير دورية', icon:'calendar', items:[
    ['monthly','التقرير الشهري','calendar','المسار والمجال والأيام والمدربون والمستفيدون والأماكن', true],
    ['periodSum','الفعاليات حسب الفترة','activity','تجميع يومي وأسبوعي وشهري وسنوي'],
    ['targets','المستهدفات السنوية','flag','المنجز مقابل المستهدف لكل مجال'],
    ['stats','الإحصائيات','barChart','مؤشرات عامة ورسوم بيانية'] ]},
  { t:'حسب الشخص والمكان', icon:'users', items:[
    ['trainer','تقرير مقدم الفعالية','users','فعاليات مقدّم محدد خلال فترة'],
    ['school','تقرير فعاليات مدرسة','school','فعاليات جهة أو مدرسة خلال فترة'],
    ['venue','مكان التنفيذ الفعلي','home','ما نُفِّذ في كل مكان خلال فترة'],
    ['stageType','حسب نوع المدرسة','school','ثانوية، ابتدائية، إعدادية، مشتركة، نموذجية، روضة، أخرى'],
    ['schoolStages','تصنيف المدارس حسب المرحلة','layers','المدارس المسجّلة «أخرى» لمراجعتها'] ]},
  { t:'حسب التصنيف', icon:'layers', items:[
    ['bypath','حسب المسار / المجال','activity','قائمة الفعاليات مصنّفة'],
    ['fieldSum','ملخّص مجال المبادرة','layers','إجماليات كل مجال'],
    ['topPrograms','أكثر البرامج طلبًا','trendingUp','المجال والمسار والعناوين المتشابهة'] ]},
  { t:'الإنجاز والمتابعة', icon:'checkCircle', items:[
    ['eval','النتائج والإنجازات','checkCircle','تقييمات وإنجاز الفعاليات'],
    ['adminReq','الطلبات الإدارية','clipboard','الطلبات المرتبطة بالفعاليات'],
    ['dist','التوزيعات','sheet','توزيع الفعاليات على المقدّمين'],
    ['quran','الأنشطة القرآنية','bookOpen','برنامجا روح والرحيق'] ]},
  { t:'تقارير مخصّصة', icon:'filter', items:[
    ['custom','تقرير مخصّص','filter','اختر الفلاتر والأعمدة والتجميع ثم أنشئ التقرير', true] ]},
];
function renderReportsPage(c){
  c.innerHTML = `
  ${pageHeader('reports')}
  <div class="tabs" style="display:none;">
    <button class="tab-btn active" id="rt_start" style="display:none;">ابدأ تقريرًا</button>
    <button class="tab-btn" id="rt_trainer" style="display:none;">تقرير مقدم فعالية</button>
    <button class="tab-btn" id="rt_school" style="display:none;">تقرير فعاليات مدرسة خلال فترة</button>
    <button class="tab-btn" id="rt_hours" style="display:none;">تقرير ساعات مقدمي الفعالية</button>
    <button class="tab-btn" id="rt_eval" style="display:none;">النتائج والإنجازات</button>
    <button class="tab-btn" id="rt_general" style="display:none;">تقرير عام</button>
    <button class="tab-btn" id="rt_bypath" style="display:none;">تقرير حسب مسار المبادرة</button>
    <button class="tab-btn" id="rt_stats" style="display:none;">الإحصائيات</button>
  </div>
  <div id="reportContent"></div>`;
  let mode='start';
  const tabs = {start:'rt_start', trainer:'rt_trainer', school:'rt_school', hours:'rt_hours', eval:'rt_eval', general:'rt_general', bypath:'rt_bypath', stats:'rt_stats'};
  function setActive(){ Object.entries(tabs).forEach(([k,id])=>{ const el=document.getElementById(id); if(el) el.classList.toggle('active', mode===k); }); }
  /* ══════ مركز التقارير: فترة سريعة + ملخّص + رسوم مختصرة + وصول سريع + تصنيفات ══════ */
  function repPresetRange(k){
    const t = todayStr(), y = Number(t.slice(0,4)), m = Number(t.slice(5,7));
    const mEnd = (yy,mm)=>`${yy}-${String(mm).padStart(2,'0')}-${String(new Date(yy,mm,0).getDate()).padStart(2,'0')}`;
    const mStart = (yy,mm)=>`${yy}-${String(mm).padStart(2,'0')}-01`;
    if(k==='month') return {from:mStart(y,m), to:mEnd(y,m)};
    if(k==='prev'){ const d = new Date(y, m-2, 1); return {from:mStart(d.getFullYear(), d.getMonth()+1), to:mEnd(d.getFullYear(), d.getMonth()+1)}; }
    if(k==='quarter'){ const q0 = Math.floor((m-1)/3)*3+1; return {from:mStart(y,q0), to:mEnd(y,q0+2)}; }
    if(k==='year') return {from:`${y}-01-01`, to:`${y}-12-31`};
    if(k==='acad'){ const r = acadYearRange(acadYearOf(t)); return {from:r.start, to:r.end}; }
    return null;
  }
  const REP_PRESETS = [['month','الشهر الحالي'],['prev','الشهر الماضي'],['quarter','الربع الحالي'],['year','السنة الحالية'],['acad','العام الدراسي'],['custom','مخصّصة']];
  const repUsage = ()=>{ try{ return JSON.parse(localStorage.getItem('rep_usage')||'{}')||{}; }catch(e){ return {}; } };
  const repItemOf = k=>{ for(const g of REPORT_GROUPS){ const it = g.items.find(x=>x[0]===k); if(it) return it; } return null; };
  function repTrack(k){ try{ const u = repUsage(); u[k] = {n:((u[k]||{}).n||0)+1, t:Date.now()}; localStorage.setItem('rep_usage', JSON.stringify(u)); }catch(e){} }
  function drawStart(){
    const box=document.getElementById('reportContent');
    let preset = 'acad'; try{ preset = localStorage.getItem('rep_preset') || 'acad'; }catch(e){}
    let rng = repPresetRange(preset);
    if(!rng){ try{ rng = JSON.parse(localStorage.getItem('rep_custom')||'null'); }catch(e){} }
    if(!rng) rng = repPresetRange('acad');
    const cats = [['all','كل التقارير','layers'], ...REPORT_GROUPS.map((g,i)=>[String(i), g.t, g.icon])];
    const curCat = window.__repCat || 'all';
    box.innerHTML = `
      <div class="pk-card rp-hub rp2">
        <div class="pk-head">
          <h2 class="pk-title">${icon('barChart',18)} التقارير</h2>
          <span class="sp"><div class="pk-search rp2-q">${icon('search',15)}
            <input id="rl_search" placeholder="ابحث عن تقرير..." autocomplete="off" aria-label="ابحث عن تقرير"></div></span>
        </div>
        <div class="pk-toolbar rp-period">
          <span class="rp2-lbl">${icon('calendar',14)} الفترة</span>
          <span class="pk-seg" id="rl_presets" role="tablist" aria-label="الفترة">
            ${REP_PRESETS.map(p=>`<button type="button" data-preset="${p[0]}" class="${preset===p[0]?'on':''}">${p[1]}</button>`).join('')}
          </span>
          <span class="pk-dates">
            <label class="pk-date"><span>من</span><input id="rl_from" type="date" lang="en-GB" value="${rng.from}"></label>
            <label class="pk-date"><span>إلى</span><input id="rl_to" type="date" lang="en-GB" value="${rng.to}"></label>
          </span>
        </div>
        <div id="rl_summary" hidden></div>
        <div class="rp2-sec" id="rl_featWrap"><div class="rp2-h">${icon('star',15)} الأكثر استخدامًا</div><div class="rp2-feat" id="rl_feat"></div></div>
        <div class="rp2-sec">
          <div class="rp2-h">${icon('layers',15)} كل التقارير</div>
          <div class="rp2-groups" id="rl_list">
            ${REPORT_GROUPS.map((g,gi)=>`<section class="rt-grp rp2-grp" data-grp="${gi}">
              <div class="rp2-gt">${icon(g.icon,14)} ${escapeHtml(g.t)}</div>
              ${g.items.map(t=>`<button type="button" class="rt-item rp2-it" data-rt="${t[0]}" title="${escapeHtml(t[3])}"
                  data-find="${escapeHtml((t[1]+' '+t[3]+' '+g.t).toLowerCase())}">
                <span class="rt-ic">${icon(t[2],15)}</span><span class="rp2-n">${escapeHtml(t[1])}</span>${t[4]?'<em>جديد</em>':''}
                <span class="rt-go">${icon('chevronLeft',13)}</span>
              </button>`).join('')}
            </section>`).join('')}
          </div>
          <div class="pk-empty" id="rl_none" style="display:none;">${icon('search',30)}لا يوجد تقرير مطابق</div>
        </div>
        <select id="rl_type" style="display:none;"><option value=""></option>
          ${REPORT_GROUPS.flatMap(g=>g.items.map(t=>t[0])).map(v=>`<option value="${v}">${v}</option>`).join('')}
        </select>
      </div>`;
    const fEl = document.getElementById('rl_from'), tEl = document.getElementById('rl_to');
    const setPreset = k=>{
      preset = k; try{ localStorage.setItem('rep_preset', k); }catch(e){}
      box.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('on', b.dataset.preset===k));
      const r = repPresetRange(k);
      if(r){ fEl.value = r.from; tEl.value = r.to; try{ refreshDateView(fEl); refreshDateView(tEl); }catch(e){} }
      drawSummary();
    };
    box.querySelectorAll('[data-preset]').forEach(b=>b.onclick = ()=>setPreset(b.dataset.preset));
    [fEl,tEl].forEach(el=>el.addEventListener('change', ()=>{
      if(fEl.value && tEl.value && fEl.value > tEl.value){ const x = fEl.value; fEl.value = tEl.value; tEl.value = x; }
      preset = 'custom'; try{ localStorage.setItem('rep_preset','custom'); localStorage.setItem('rep_custom', JSON.stringify({from:fEl.value, to:tEl.value})); }catch(e){}
      box.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('on', b.dataset.preset==='custom'));
      drawSummary();
    }));

    /* الملخّص والرسوم — حساب واحد خفيف لكل تغيير فترة */
    function drawSummary(){
      const F = fEl.value, T = tEl.value, td = todayStr();
      const L = (state.orders||[]).filter(o=>isLiveOrder(o) && o.date && (!T || o.date<=T) && (!F || orderEnd(o)>=F));
      const done = L.filter(o=>o.completionStatus==='تم');
      const benef = L.reduce((s,o)=>s+(Number(o.participantsCount)||0),0);
      const hrs = Math.round(L.reduce((s,o)=>s+(Number(computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo))||0),0)*10)/10;
      const places = new Set(L.map(o=>o.venue || o.schoolId).filter(Boolean)).size;
      const trs = new Set(L.flatMap(o=>o.trainerIds||[])).size;
      const pct = L.length ? Math.round(done.length/L.length*100) : 0;
      const K = [
        {k:'periodSum', l:'الفعاليات', v:L.length, s:'الملغاة لا تُحتسب', ic:'clipboard', ...PK_KC.all, t:'فتح: الفعاليات حسب الفترة'},
        {k:'eval', l:'المكتملة', v:done.length, s:`${pct}% نسبة الإنجاز`, ic:'checkCircle', ...PK_KC.done, t:'فتح: النتائج والإنجازات'},
        {k:'monthly', l:'المستفيدون', v:benef.toLocaleString('en'), s:'مجموع المستهدفين', ic:'users', ...PK_KC.new, t:'فتح: التقرير الشهري'},
        {k:'trainer', l:'الساعات', v:hrs, s:`${trs} مقدّم مبادرة`, ic:'clock', ...PK_KC.gold, t:'فتح: تقرير مقدم الفعالية'},
        {k:'venue', l:'الجهات والأماكن', v:places, s:'أماكن تنفيذ مختلفة', ic:'school', ...PK_KC.run, t:'فتح: مكان التنفيذ الفعلي'},
      ];
      /* الرسم 1: الفعاليات شهريًا (حتى ١٢ شهرًا) */
      const months = [];
      if(F && T){ let y = Number(F.slice(0,4)), m = Number(F.slice(5,7)); const ey = Number(T.slice(0,4)), em = Number(T.slice(5,7));
        while((y<ey || (y===ey && m<=em)) && months.length<24){ months.push(`${y}-${String(m).padStart(2,'0')}`); m++; if(m>12){ m=1; y++; } } }
      const MN = ['ينا','فبر','مار','أبر','ماي','يون','يول','أغس','سبت','أكت','نوف','ديس'];
      const mm = months.slice(-12).map(k=>({k, l:MN[Number(k.slice(5,7))-1], n:L.filter(o=>o.date.slice(0,7)===k).length,
        d:L.filter(o=>o.date.slice(0,7)===k && o.completionStatus==='تم').length, now:k===td.slice(0,7)}));
      const mx = Math.max(1, ...mm.map(x=>x.n));
      /* الرسم 2: حالة الإنجاز */
      const wait = L.filter(o=>!o.completionStatus && orderEnd(o)<td).length;
      const up = L.filter(o=>!o.completionStatus && orderEnd(o)>=td).length;
      const other = L.length - done.length - wait - up;
      const ST = [['مكتملة',done.length,'var(--ds-ok)'],['قادمة',up,'var(--ds-info)'],['بانتظار التقييم',wait,'var(--ds-dan)'],['لم تُنجز / أخرى',other,'var(--ds-ink-3)']];
      /* أكثر المسارات */
      const byP = {}; L.forEach(o=>{ const p = state.programTypes.find(x=>x.id===o.programTypeId); const n = p?p.name:'غير محدد'; byP[n]=(byP[n]||0)+1; });
      const topP = Object.entries(byP).sort((a,b)=>b[1]-a[1]).slice(0,5); const tpx = Math.max(1, ...topP.map(x=>x[1]));
      document.getElementById('rl_summary').innerHTML = `
        ${pkKpisHtml(K, '__none', 'data-kopen')}
        <div class="rp-charts" hidden>
          <div class="pk-card rp-ch">
            <div class="pk-head"><h3 class="pk-title" style="font-size:14px;">${icon('barChart',16)} الفعاليات حسب الشهر</h3>
              <span class="sp rp-lg"><i style="background:var(--ds-teal)"></i>الكل <i style="background:var(--ds-ok)"></i>المكتملة</span></div>
            <div class="rp-bars">${mm.length ? mm.map(x=>`<div class="b${x.now?' now':''}" title="${x.k}: ${x.n} فعالية، ${x.d} مكتملة">
                <u>${x.n||''}</u><span class="col" style="height:${x.n?Math.max(6,Math.round(x.n/mx*100)):2}%"><span class="dn" style="height:${x.n?Math.round(x.d/x.n*100):0}%"></span></span><em>${x.l}</em></div>`).join('')
              : `<div class="pk-empty">حدّد الفترة لعرض الرسم</div>`}</div>
          </div>
          <div class="pk-card rp-ch">
            <div class="pk-head"><h3 class="pk-title" style="font-size:14px;">${icon('pieChart',16)} حالة الإنجاز</h3><span class="sp pk-sub">${L.length} ${eventWord(L.length)}</span></div>
            <div style="padding:14px 18px;">
              <div class="rp-stack">${ST.filter(x=>x[1]).map(x=>`<i style="flex:${x[1]};background:${x[2]}" title="${x[0]}: ${x[1]}"></i>`).join('') || '<i style="flex:1;background:var(--ds-line)"></i>'}</div>
              <div class="rp-leg">${ST.map(x=>`<span><i style="background:${x[2]}"></i>${x[0]} <b>${x[1]}</b></span>`).join('')}</div>
              <div class="rp-top-t">أكثر المسارات طلبًا</div>
              ${topP.length ? topP.map(([n,v])=>`<div class="rp-hb"><span class="n">${escapeHtml(n)}</span><span class="t"><i style="width:${Math.round(v/tpx*100)}%"></i></span><b>${v}</b></div>`).join('') : '<div class="helper">لا توجد بيانات في الفترة</div>'}
            </div>
          </div>
        </div>`;
      document.querySelectorAll('#rl_summary [data-kopen]').forEach(b=>b.onclick = ()=>openRep(b.dataset.kopen));
      /* بطاقات «الأكثر استخدامًا» مع رقم حيّ للفترة */
      const schoolsN = new Set(L.map(o=>o.schoolId).filter(Boolean)).size;
      const STAT = { monthly:[L.length,'فعالية'], periodSum:[L.length,'فعالية'], trainer:[trs,'مقدّم'], school:[schoolsN,'جهة'],
        venue:[places,'مكان'], eval:[done.length,'مكتملة'], stats:[L.length,'فعالية'], targets:[pct+'%','إنجاز'],
        adminReq:[L.filter(o=>(o.adminRequests||[]).length).length,'فعالية بطلبات'], dist:[trs,'مقدّم'], bypath:[Object.keys(byP).length,'مسار'],
        fieldSum:[new Set(L.map(o=>o.fieldId).filter(Boolean)).size,'مجال'], topPrograms:[topP.length,'مسار'], stageType:[schoolsN,'جهة'],
        quran:[(state.quranActivities||[]).length,'سجل'], schoolStages:[(state.schools||[]).length,'مدرسة'], custom:['+','فلاتر وأعمدة'] };
      const u = repUsage();
      const used = Object.entries(u).filter(([k])=>repItemOf(k)).sort((a,b)=>b[1].n-a[1].n).map(x=>x[0]);
      const keys = [...new Set([...used, 'monthly','trainer','school','custom'])].slice(0,4);
      const fb = document.getElementById('rl_feat');
      if(fb){ fb.innerHTML = keys.map(k=>{ const it = repItemOf(k); const st = STAT[k] || [L.length,'فعالية'];
          return `<button type="button" class="rp2-fc" data-fopen="${k}"><span class="rt-ic">${icon(it[2],18)}</span>
            <b>${escapeHtml(it[1])}</b><span class="v">${st[0]}<small>${st[1]}</small></span><i>${escapeHtml(it[3])}</i></button>`; }).join('');
        fb.querySelectorAll('[data-fopen]').forEach(b=>b.onclick = ()=>openRep(b.dataset.fopen)); }
    }
    /* الوصول السريع: الأخيرة والأكثر استخدامًا */
    function drawQuick(){
      const u = repUsage();
      const ent = Object.entries(u).filter(([k])=>repItemOf(k));
      const box2 = document.getElementById('rl_quick');
      if(!ent.length){ box2.innerHTML = ''; return; }
      const recent = ent.slice().sort((a,b)=>b[1].t-a[1].t).slice(0,4);
      const most = ent.slice().sort((a,b)=>b[1].n-a[1].n).slice(0,4);
      const chip = ([k,v], sub)=>{ const it = repItemOf(k); return `<button type="button" class="rp-q" data-qopen="${k}">
        <span class="rt-ic">${icon(it[2],15)}</span><span><b>${escapeHtml(it[1])}</b><i>${sub(v)}</i></span></button>`; };
      const ago = t=>{ const d = Math.round((Date.now()-t)/60000); return d<1?'الآن':d<60?`قبل ${d} دقيقة`:d<1440?`قبل ${Math.round(d/60)} ساعة`:`قبل ${Math.round(d/1440)} يوم`; };
      box2.innerHTML = `<div class="rp-quick">
        <div class="pk-card"><div class="pk-head"><h3 class="pk-title" style="font-size:14px;">${icon('history',16)} التقارير الأخيرة</h3></div>
          <div class="rp-qgrid">${recent.map(e=>chip(e, v=>ago(v.t))).join('')}</div></div>
        <div class="pk-card"><div class="pk-head"><h3 class="pk-title" style="font-size:14px;">${icon('star',16)} الأكثر استخدامًا</h3></div>
          <div class="rp-qgrid">${most.map(e=>chip(e, v=>`${v.n} ${v.n===1?'مرة':'مرات'}`)).join('')}</div></div>
      </div>`;
      box2.querySelectorAll('[data-qopen]').forEach(b=>b.onclick = ()=>openRep(b.dataset.qopen));
    }
    function openRep(k){ const sel = document.getElementById('rl_type'); sel.value = k; sel.onchange(); }
    /* التصنيفات والبحث */
    const items = Array.from(document.querySelectorAll('#rl_list .rt-item'));
    const q = document.getElementById('rl_search'), none = document.getElementById('rl_none');
    const upd = ()=>{
      const v = (q.value||'').trim().toLowerCase(), cat = window.__repCat || 'all';
      let n = 0;
      document.querySelectorAll('#rl_list .rt-grp').forEach(g=>{
        const inCat = cat==='all' || g.dataset.grp===cat || !!v;
        let k = 0;
        g.querySelectorAll('.rt-item').forEach(b=>{ const ok = inCat && (!v || (b.dataset.find||'').includes(v)); b.style.display = ok?'':'none'; if(ok){ k++; n++; } });
        g.style.display = k ? '' : 'none';
      });
      none.style.display = n ? 'none' : 'block';
    };
    window.__repCat = 'all';
    q.addEventListener('input', upd);
    box.querySelectorAll('[data-cat]').forEach(b=>b.onclick = ()=>{
      window.__repCat = b.dataset.cat; box.querySelectorAll('[data-cat]').forEach(x=>x.classList.toggle('on', x===b)); upd(); });
    items.forEach(b=>{ b.onclick = ()=>openRep(b.dataset.rt); });
    upd(); drawSummary();
    document.getElementById('rl_type').onchange=()=>{
      if(!document.getElementById('rl_type').value) return;
      let from = document.getElementById('rl_from').value, to = document.getElementById('rl_to').value;
      const type = document.getElementById('rl_type').value;
      repTrack(type);
      try{ window.scrollTo({top:0, behavior:'smooth'}); }catch(e){}
      if(type==='custom'){ mode='custom'; drawCustom(from, to); setActive(); return; }
      if(type==='monthly' && !['month','prev','custom'].includes(preset)) from = '';
      if(type==='monthly'){ mode='monthly'; drawMonthly(from); setActive(); }
      else if(type==='schoolStages'){ mode='schoolStages'; setActive(); drawSchoolStagesReport(document.getElementById('reportContent'), ()=>{ mode='start'; drawStart(); setActive(); }); }
      else if(type==='stageType'){ mode='stageType'; setActive();
        const now = todayStr(); const F0 = from || (now.slice(0,7)+'-01'), T0 = to || addDaysISO(addDaysISO(now.slice(0,7)+'-01', 32).slice(0,7)+'-01', -1);
        const box = document.getElementById('reportContent');
        box.innerHTML = `<div class="card" id="stgCard">${stageReportShell('الفعاليات حسب نوع المدرسة', true, F0, T0)}</div>`;
        const card = box.querySelector('#stgCard');
        card.querySelector('h2').insertAdjacentHTML('beforeend', `<button class="btn btn-outline btn-sm" type="button" id="stg_back">${icon('chevronRight',14)} كل التقارير</button>`);
        card.querySelector('#stg_back').onclick = ()=>{ mode='start'; drawStart(); setActive(); };
        const rng = ()=>[card.querySelector('.stg-from').value, card.querySelector('.stg-to').value];
        const ords = ()=>{ const [a,b] = rng(); return state.orders.filter(o=>isLiveOrder(o) && o.date && (!a || orderEnd(o)>=a) && (!b || o.date<=b)); };
        bindStageReport(card, ords, rng, {});
        card.querySelectorAll('.stg-from,.stg-to').forEach(i=>i.addEventListener('change', ()=>card.__stageDraw()));
      }
      else if(type==='targets'){ mode='targets'; drawTargetsReport(document.getElementById('reportContent'), ()=>{ mode='start'; drawStart(); setActive(); }); setActive(); }
      else if(type==='trainer'){ mode='trainer'; drawTrainer(); setActive(); if(from) document.getElementById('rp_from').value=from; if(to) document.getElementById('rp_to').value=to; }
      else if(type==='school'){ mode='school'; drawSchool(); setActive(); if(from) document.getElementById('rp_from2').value=from; if(to) document.getElementById('rp_to2').value=to; }
      else if(type==='venue'){ mode='venue'; drawVenues(); setActive(); if(from) document.getElementById('vn_from').value=from; if(to) document.getElementById('vn_to').value=to; document.getElementById('vn_go').click(); }
      else if(type==='bypath'){ mode='bypath'; drawByPath(); setActive(); if(from) document.getElementById('bp_from').value=from; if(to) document.getElementById('bp_to').value=to; }
      else if(type==='fieldSum'){ mode='fieldSum'; drawFieldSummary(); setActive(); if(from) document.getElementById('fs_from').value=from; if(to) document.getElementById('fs_to').value=to; document.getElementById('fs_go').click(); }
      else if(type==='quran'){ currentPage='quranActivities'; quranSubTab='report'; render(); }
      else if(type==='periodSum'){ mode='periodSum'; drawPeriodSum(); setActive(); if(from) document.getElementById('ps_from').value=from; if(to) document.getElementById('ps_to').value=to; document.getElementById('ps_go').click(); }
      else if(type==='topPrograms'){ mode='topPrograms'; drawTopPrograms(); setActive(); if(from) document.getElementById('tp_from').value=from; if(to) document.getElementById('tp_to').value=to; document.getElementById('tp_go').click(); }
      else if(type==='stats'){ mode='stats'; renderStatsPage(document.getElementById('reportContent')); setActive(); }
      else if(type==='eval'){ mode='eval'; drawEval(); setActive(); if(from) document.getElementById('ev_from').value=from; if(to) document.getElementById('ev_to').value=to; }
      else if(type==='adminReq'){ currentPage='distributions'; distSubTab='adminReq'; render(); }
      else if(type==='dist'){ currentPage='distributions'; distSubTab='dist'; render(); }
    };
  }
  /* ══════ التقرير المخصّص: اختيار الفلاتر والأعمدة والتجميع قبل الإنشاء ══════ */
  function drawCustom(from, to){
    const box = document.getElementById('reportContent');
    const COLS = [
      ['serial','رقم التكليف',1, o=>o.serial],
      ['title','عنوان المبادرة',1, o=>o.title||''],
      ['date','التاريخ',1, o=>{ const e=orderEnd(o); return e&&e!==o.date?`${fmtDate(o.date)} — ${fmtDate(e)}`:fmtDate(o.date); }],
      ['time','الوقت',1, o=>fullTimeRange(o.timeFrom,o.timeTo)],
      ['days','الأيام',0, o=>daysCount(o.date,o.dateTo)],
      ['hours','الساعات',0, o=>computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo)],
      ['school','الجهة',1, o=>{ const s=state.schools.find(x=>x.id===o.schoolId); return s?s.name:'—'; }],
      ['venue','مكان التنفيذ الفعلي',0, o=>o.venue||'—'],
      ['sup','المشرف وهاتفه',0, o=>{ const s=state.schools.find(x=>x.id===o.schoolId); const v=s?(s.supervisors||[]).find(x=>x.id===o.supervisorId):null; return v?[v.name,v.phone].filter(Boolean).join(' — '):'—'; }],
      ['trainers','مقدم المبادرة',1, o=>trainerNames(o)||'—'],
      ['field','المجال',1, o=>{ const f=state.fields.find(x=>x.id===o.fieldId); return f?f.name:'—'; }],
      ['path','المسار',1, o=>{ const p=state.programTypes.find(x=>x.id===o.programTypeId); return p?p.name:'—'; }],
      ['count','المستهدفون',0, o=>o.participantsCount||0],
      ['state','الحالة',1, o=>orderState(o, todayStr()).l],
    ];
    let saved = {}; try{ saved = JSON.parse(localStorage.getItem('rep_custom_cfg')||'{}')||{}; }catch(e){}
    const colOn = k=>saved.cols ? saved.cols.includes(k) : !!(COLS.find(c=>c[0]===k)||[])[2];
    const opt = (arr, v)=>arr.map(x=>`<option value="${escapeHtml(x.id)}" ${v===x.id?'selected':''}>${escapeHtml(x.name)}</option>`).join('');
    const byName = (a,b)=>String(a.name||'').localeCompare(String(b.name||''),'ar');
    box.innerHTML = `<div class="pk-card">
      <div class="pk-head">
        <h2 class="pk-title">${icon('filter',18)} تقرير مخصّص <span class="pk-sub">اختر الفلاتر والأعمدة ثم أنشئ التقرير</span></h2>
        <span class="sp"><button class="pk-btn" type="button" id="cu_back">${icon('chevronRight',14)} كل التقارير</button></span>
      </div>
      <div class="cu-body">
        <div class="cu-sec"><div class="cu-t">${icon('calendar',14)} الفترة</div>
          <div class="cu-grid">
            <label class="cu-f"><span>من تاريخ</span><input id="cu_from" type="date" lang="en-GB" value="${from||''}"></label>
            <label class="cu-f"><span>إلى تاريخ</span><input id="cu_to" type="date" lang="en-GB" value="${to||''}"></label>
          </div></div>
        <div class="cu-sec"><div class="cu-t">${icon('filter',14)} الفلاتر</div>
          <div class="cu-grid">
            <label class="cu-f"><span>المسار</span><select id="cu_path"><option value="">الكل</option>${opt(state.programTypes.slice().sort(byName), saved.path)}</select></label>
            <label class="cu-f"><span>المجال</span><select id="cu_field"><option value="">الكل</option>${opt(state.fields.slice().sort(byName), saved.field)}</select></label>
            <label class="cu-f"><span>مقدم المبادرة</span><select id="cu_tr"><option value="">الكل</option>${opt(state.trainers.slice().sort(byName), saved.tr)}</select></label>
            <label class="cu-f"><span>الجهة</span><select id="cu_school"><option value="">الكل</option>${opt(state.schools.slice().sort(byName), saved.school)}</select></label>
            <label class="cu-f"><span>الحالة</span><select id="cu_state">
              ${[['','الكل (عدا الملغاة)'],['done','مكتملة'],['new','قادمة'],['run','اليوم'],['late','بانتظار الإجراء / لم تُنجز'],['hold','مؤجّلة'],['draft','ملغاة'],['any','الكل مع الملغاة']]
                .map(x=>`<option value="${x[0]}" ${saved.st===x[0]?'selected':''}>${x[1]}</option>`).join('')}</select></label>
            <label class="cu-f"><span>بحث في العنوان</span><input id="cu_q" placeholder="جزء من عنوان المبادرة" value="${escapeHtml(saved.q||'')}"></label>
          </div></div>
        <div class="cu-sec"><div class="cu-t">${icon('list',14)} الأعمدة <a href="#" id="cu_allCols" class="cu-lnk">تحديد الكل</a></div>
          <div class="cu-cols">${COLS.map(c=>`<label class="pill-opt"><input type="checkbox" class="cu-col" value="${c[0]}" ${colOn(c[0])?'checked':''}><span class="dot">${icon('check',12)}</span><span>${escapeHtml(c[1])}</span></label>`).join('')}</div></div>
        <div class="cu-sec"><div class="cu-t">${icon('layers',14)} التجميع والترتيب</div>
          <div class="cu-grid">
            <label class="cu-f"><span>تجميع حسب</span><select id="cu_grp">
              ${[['','بلا تجميع'],['path','المسار'],['field','المجال'],['trainer','مقدم المبادرة'],['school','الجهة'],['month','الشهر']]
                .map(x=>`<option value="${x[0]}" ${saved.grp===x[0]?'selected':''}>${x[1]}</option>`).join('')}</select></label>
            <label class="cu-f"><span>الترتيب</span><select id="cu_sort">
              ${[['dateAsc','التاريخ تصاعديًا'],['dateDesc','التاريخ تنازليًا'],['serial','رقم التكليف']]
                .map(x=>`<option value="${x[0]}" ${saved.sort===x[0]?'selected':''}>${x[1]}</option>`).join('')}</select></label>
          </div></div>
        <div class="cu-acts">
          <button class="pk-btn pri" type="button" id="cu_go">${icon('barChart',15)} إنشاء التقرير</button>
          <button class="pk-btn" type="button" id="cu_print">${icon('printer',15)} طباعة</button>
          <button class="pk-btn" type="button" id="cu_pdf">${icon('download',15)} PDF</button>
          <button class="pk-btn" type="button" id="cu_xls">${icon('sheet',15)} Excel</button>
          <button class="pk-btn" type="button" id="cu_reset" style="margin-inline-start:auto;">${icon('refresh',14)} إعادة الضبط</button>
        </div>
      </div>
      <div id="cu_result"></div>
    </div>`;
    document.getElementById('cu_back').onclick = ()=>{ mode='start'; drawStart(); setActive(); };
    document.getElementById('cu_allCols').onclick = e=>{ e.preventDefault(); const all = box.querySelectorAll('.cu-col'); const on = !Array.from(all).every(c=>c.checked); all.forEach(c=>c.checked=on); };
    document.getElementById('cu_reset').onclick = ()=>{ try{ localStorage.removeItem('rep_custom_cfg'); }catch(e){} drawCustom(from, to); };
    const V = id=>(document.getElementById(id)||{}).value||'';
    function gen(){
      const cfg = {path:V('cu_path'), field:V('cu_field'), tr:V('cu_tr'), school:V('cu_school'), st:V('cu_state'), q:V('cu_q').trim(),
        grp:V('cu_grp'), sort:V('cu_sort'), cols:Array.from(box.querySelectorAll('.cu-col:checked')).map(c=>c.value)};
      try{ localStorage.setItem('rep_custom_cfg', JSON.stringify(cfg)); }catch(e){}
      const F = V('cu_from'), T = V('cu_to'), td = todayStr(), nq = _pnz(cfg.q);
      let L = (state.orders||[]).filter(o=>{
        const k = orderState(o, td).k;
        if(cfg.st==='any'){} else if(cfg.st){ if(k!==cfg.st) return false; } else if(k==='draft') return false;
        if(F && orderEnd(o) < F) return false; if(T && (o.date||'') > T) return false;
        if(cfg.path && o.programTypeId!==cfg.path) return false;
        if(cfg.field && o.fieldId!==cfg.field) return false;
        if(cfg.tr && !(o.trainerIds||[]).includes(cfg.tr)) return false;
        if(cfg.school && o.schoolId!==cfg.school) return false;
        if(nq && !_pnz(o.title||'').includes(nq)) return false;
        return true;
      });
      L.sort((a,b)=> cfg.sort==='serial' ? (a.serial||0)-(b.serial||0)
        : cfg.sort==='dateDesc' ? (b.date||'').localeCompare(a.date||'') : (a.date||'').localeCompare(b.date||''));
      const cols = COLS.filter(c=>cfg.cols.includes(c[0]));
      const gName = o=>{
        if(cfg.grp==='path'){ const p=state.programTypes.find(x=>x.id===o.programTypeId); return [p?p.name:'غير محدد']; }
        if(cfg.grp==='field'){ const f=state.fields.find(x=>x.id===o.fieldId); return [f?f.name:'غير محدد']; }
        if(cfg.grp==='school'){ const s=state.schools.find(x=>x.id===o.schoolId); return [s?s.name:'غير محدد']; }
        if(cfg.grp==='trainer'){ const n=(o.trainerIds||[]).map(id=>{const t=state.trainers.find(x=>x.id===id); return t?t.name:'';}).filter(Boolean); return n.length?n:['بلا مقدّم']; }
        if(cfg.grp==='month'){ const d=o.date||''; return [d?new Date(Number(d.slice(0,4)), Number(d.slice(5,7))-1, 1).toLocaleDateString('ar-QA-u-nu-latn',{month:'long',year:'numeric'}):'بلا تاريخ']; }
        return ['']; };
      const groups = []; const gm = {};
      L.forEach(o=>gName(o).forEach(n=>{ if(!gm[n]){ gm[n] = {name:n, list:[]}; groups.push(gm[n]); } gm[n].list.push(o); }));
      if(cfg.grp && cfg.grp!=='month') groups.sort((a,b)=>b.list.length-a.list.length);
      const parts = [];
      [['cu_path',state.programTypes,'المسار'],['cu_field',state.fields,'المجال'],['cu_tr',state.trainers,'المقدّم'],['cu_school',state.schools,'الجهة']].forEach(([id,arr,l])=>{
        const v = V(id); if(v){ const x = arr.find(y=>y.id===v); if(x) parts.push(`${l}: ${x.name}`); } });
      if(cfg.st){ const el = document.getElementById('cu_state'); parts.push(`الحالة: ${el.selectedOptions[0].textContent}`); }
      if(cfg.q) parts.push(`العنوان يحوي: ${cfg.q}`);
      return {L, cols, groups, F, T, desc:parts.join(' · '), cfg};
    }
    const kpisOf = L=>[{v:L.length,l:'الفعاليات'},{v:L.filter(o=>o.completionStatus==='تم').length,l:'المكتملة'},
      {v:L.reduce((s,o)=>s+(Number(o.participantsCount)||0),0),l:'المستهدفون'},
      {v:Math.round(L.reduce((s,o)=>s+(Number(computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo))||0),0)*10)/10,l:'الساعات'}];
    function show(){
      const R = gen(), out = document.getElementById('cu_result');
      if(!R.cols.length){ toast('اختر عمودًا واحدًا على الأقل'); return; }
      if(!R.L.length){ out.innerHTML = `<div class="pk-empty">${icon('inbox',34)}لا توجد فعاليات مطابقة للفلاتر المختارة</div>`; return; }
      const tbl = list=>`<div class="pk-tblwrap"><table class="pk-tbl"><thead><tr><th class="c" style="width:40px;">م</th>${R.cols.map(c=>`<th>${escapeHtml(c[1])}</th>`).join('')}</tr></thead><tbody>
        ${list.map((o,i)=>`<tr data-oid="${o.id}"><td class="c">${i+1}</td>${R.cols.map(c=>`<td${c[0]==='title'?' class="pk-ttl"':''}>${c[0]==='state'?pkStatePill(o):c[0]==='title'?`<b data-act="view" role="button" tabindex="0">${escapeHtml(String(c[3](o)))}</b>`:escapeHtml(String(c[3](o)))}</td>`).join('')}</tr>`).join('')}
        </tbody></table></div>`;
      out.innerHTML = `<div class="cu-kpis">${kpisOf(R.L).map(k=>`<span><b>${k.v}</b>${k.l}</span>`).join('')}${R.desc?`<span class="d">${icon('filter',13)} ${escapeHtml(R.desc)}</span>`:''}</div>
        ${R.cfg.grp ? R.groups.map(g=>`<div class="cu-gh">${escapeHtml(g.name)} <i>${g.list.length} ${eventWord(g.list.length)}</i></div>${tbl(g.list)}`).join('') : tbl(R.L)}`;
      if(!out.__b){ out.__b = true; bindOrdersTable(out, ()=>show()); }
    }
    function docOf(){
      const R = gen();
      if(!R.cols.length){ toast('اختر عمودًا واحدًا على الأقل'); return null; }
      if(!R.L.length){ toast('لا توجد فعاليات مطابقة'); return null; }
      const head = `<tr><th>م</th>${R.cols.map(c=>`<th>${escapeHtml(c[1])}</th>`).join('')}</tr>`;
      const rows = list=>list.map((o,i)=>`<tr><td>${i+1}</td>${R.cols.map(c=>`<td>${escapeHtml(String(c[3](o)))}</td>`).join('')}</tr>`).join('');
      const body = R.cfg.grp
        ? R.groups.map(g=>`<div class="sec-t">${escapeHtml(g.name)} (${g.list.length} ${eventWord(g.list.length)})</div><table class="rep-tbl"><thead>${head}</thead><tbody>${rows(g.list)}</tbody></table>`).join('')
        : `<table class="rep-tbl"><thead>${head}</thead><tbody>${rows(R.L)}</tbody></table>`;
      return buildReportDoc({ titleAr:'تقرير مخصّص', subtitle:[R.F||R.T?`الفترة ${R.F?fmtDate(R.F):'—'} — ${R.T?fmtDate(R.T):'—'}`:'', R.desc].filter(Boolean).join(' · '),
        kpis:kpisOf(R.L), extraHtml: body });
    }
    document.getElementById('cu_go').onclick = show;
    document.getElementById('cu_print').onclick = ()=>{ const d = docOf(); if(d) doPrintDoc(d, gen().cols.length>6, 'A4'); };
    document.getElementById('cu_pdf').onclick = ()=>{ const d = docOf(); if(d) doPrintDoc(d, gen().cols.length>6, 'A4'); };
    document.getElementById('cu_xls').onclick = ()=>{
      const R = gen(); if(!R.cols.length){ toast('اختر عمودًا واحدًا على الأقل'); return; }
      if(!R.L.length){ toast('لا توجد فعاليات مطابقة'); return; }
      const hdr = ['م', ...R.cols.map(c=>c[1])], title = `تقرير مخصّص${R.F||R.T?` (${R.F?fmtDate(R.F):'—'} — ${R.T?fmtDate(R.T):'—'})`:''}${R.desc?' — '+R.desc:''}`;
      if(R.cfg.grp) exportToExcelMultiSheet('تقرير_مخصص.xlsx', R.groups.map(g=>({name:String(g.name).replace(/[\\\/\?\*\[\]:]/g,' ').slice(0,30)||'—', headers:hdr, rows:g.list.map((o,i)=>[i+1, ...R.cols.map(c=>c[3](o))])})), title);
      else exportToExcel('تقرير_مخصص.xlsx', hdr, R.L.map((o,i)=>[i+1, ...R.cols.map(c=>c[3](o))]), title);
    };
    show();
  }
  bindPageHeader(c, 'reports');
  document.getElementById('rt_start').onclick=()=>{mode='start'; drawStart(); setActive();};
  document.getElementById('rt_trainer').onclick=()=>{mode='trainer'; drawTrainer(); setActive();};
  document.getElementById('rt_school').onclick=()=>{mode='school'; drawSchool(); setActive();};
  document.getElementById('rt_hours').onclick=()=>{mode='hours'; drawHours(); setActive();};
  document.getElementById('rt_eval').onclick=()=>{mode='eval'; drawEval(); setActive();};
  document.getElementById('rt_general').onclick=()=>{mode='general'; drawGeneral(); setActive();};
  document.getElementById('rt_bypath').onclick=()=>{mode='bypath'; drawByPath(); setActive();};
  document.getElementById('rt_stats').onclick=()=>{mode='stats'; renderStatsPage(document.getElementById('reportContent')); setActive();};


  /* ══════════════════════════════════════════════════════════════════
     التقرير الشهري — المسار، المجال، الأيام، الساعات، المدربون، المستفيدون، الأماكن
     + مقارنة بالشهر السابق أو بنفس الشهر من العام الماضي
     ══════════════════════════════════════════════════════════════════ */
  function drawMonthly(fromHint){
    const box = document.getElementById('reportContent');
    const now = new Date();
    const defMonth = fromHint ? fromHint.slice(0,7) : `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    box.innerHTML = `<div class="card">
      <h2>${icon('calendar',15)} التقرير الشهري
        <button class="btn btn-outline btn-sm" type="button" id="mr_back">${icon('chevronRight',14)} كل التقارير</button></h2>
      <div class="rp-dates" style="margin-bottom:12px;">
        <div class="rp-date"><label>الشهر</label><input id="mr_month" type="month" lang="en-GB" value="${defMonth}"></div>
        <div class="rp-date"><label>التجميع</label>
          <select id="mr_group">
            <option value="pathField" selected>المسار ثم المجال</option>
            <option value="path">المسار فقط</option>
            <option value="field">المجال فقط</option>
          </select></div>
        <div class="rp-date"><label>المقارنة</label>
          <select id="mr_cmp">
            <option value="prev" selected>بالشهر السابق</option>
            <option value="year">بنفس الشهر من العام الماضي</option>
            <option value="">بلا مقارنة</option>
          </select></div>
      </div>
      <div class="fs-flags">
        <label class="pill-opt"><input type="checkbox" id="mr_done" checked><span class="dot">${icon('check',12)}</span><span>المنجزة</span></label>
        <label class="pill-opt"><input type="checkbox" id="mr_notDone" checked><span class="dot">${icon('check',12)}</span><span>غير المنجزة</span></label>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" id="mr_go">عرض</button>
        <button class="icon-btn rect" id="mr_print" data-tip="طباعة" title="طباعة" aria-label="طباعة">${icon('printer',17)}</button>
        <button class="icon-btn rect" id="mr_pdf" data-tip="تنزيل PDF" title="تنزيل PDF" aria-label="تنزيل PDF">${icon('download',17)}</button>
        <button class="icon-btn rect" id="mr_excel" data-tip="تنزيل Excel" title="تنزيل Excel" aria-label="تنزيل Excel">${icon('sheet',17)}</button>
      </div>
      <div class="helper" style="margin-top:8px;">الفعاليات الملغاة لا تُحتسب. الفعالية الممتدة على شهرين تُحسب أيامها وساعاتها داخل الشهر المختار فقط.
        المكان = مكان التنفيذ الفعلي إن وُجد، وإلا الجهة الطالبة. <span class="mr-rep-key">المكان المكرر</span> = تكرر أكثر من مرة في نفس الصف.
        في سطر «إجمالي المسار» تُجمع الفعاليات والأيام والساعات والمستفيدون، أما المدربون والأماكن فتُعدّ بلا تكرار.</div>
      <div id="mr_result" style="margin-top:14px;"></div>
    </div>`;
    document.getElementById('mr_back').onclick = ()=>{ mode='start'; drawStart(); setActive(); };

    const placeOf = o => { if(o.venue) return o.venue; const sc = state.schools.find(x=>x.id===o.schoolId); return sc ? sc.name : ''; };
    const nameOf = (arr,id) => { const x=(arr||[]).find(y=>y.id===id); return x ? x.name : 'غير محدد'; };
    const REP_STYLE = 'background:#FFF1A8;border-color:#E8D46A;color:#5C4A00;font-weight:700;';
    function monthBounds(m){
      const [y,mo] = m.split('-').map(Number);
      const last = new Date(y, mo, 0).getDate();
      return {m, start:`${m}-01`, end:`${m}-${String(last).padStart(2,'0')}`,
        label: new Date(y, mo-1, 1).toLocaleDateString('ar-QA-u-nu-latn',{month:'long', year:'numeric'}),
        short: new Date(y, mo-1, 1).toLocaleDateString('ar-QA-u-nu-latn',{month:'short'})};
    }
    function shiftMonth(m, k){
      const [y,mo] = m.split('-').map(Number);
      const d = new Date(y, mo-1+k, 1);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    }
    function filterMonth(mb){
      const wDone = document.getElementById('mr_done').checked, wNot = document.getElementById('mr_notDone').checked;
      return state.orders.filter(o=>{
        if(o.status==='cancelled' || o.completionStatus==='الغيت') return false;
        if(!isLiveOrder(o)) return false;
        const isDone = o.completionStatus==='تم';
        if(isDone && !wDone) return false;
        if(!isDone && !wNot) return false;
        const s0 = o.date||'', e0 = orderEnd(o);
        return s0 && s0 <= mb.end && e0 >= mb.start;
      });
    }
    function clipDays(o, mb){
      const a = (o.date||'') < mb.start ? mb.start : o.date;
      const e = orderEnd(o), b = e > mb.end ? mb.end : e;
      return a && b && a<=b ? daysCount(a,b) : 0;
    }
    function agg(list, mb){
      const places = {};
      list.forEach(o=>{ const p = placeOf(o); if(p) places[p] = (places[p]||0)+1; });
      const pe = Object.entries(places).sort((a,b)=>b[1]-a[1]);
      const hrs = list.reduce((s,o)=>{
        const d = clipDays(o, mb); if(!d) return s;
        const per = computeHours(o.timeFrom, o.timeTo, o.date, o.date);   /* ساعات اليوم الواحد */
        return s + per*d; },0);
      return {
        events: list.length,
        days: list.reduce((s,o)=>s+clipDays(o,mb),0),
        hours: Math.round(hrs*10)/10,
        trainers: new Set(list.flatMap(o=>o.trainerIds||[])).size,
        people: list.reduce((s,o)=>s+(Number(o.participantsCount)||0),0),
        placesN: pe.length,
        repeated: pe.filter(([,c])=>c>1).length,
        placesTxt: pe.length ? pe.map(([n,c])=>c>1?`${n} (${c})`:n).join('، ') : '—',
        placesHtml: pe.length ? pe.map(([n,c])=>`<span class="mr-chip${c>1?' rep':''}" style="display:inline-block;border:1px solid #E2D4D9;border-radius:5px;padding:0 6px;margin:1px;white-space:nowrap;${c>1?REP_STYLE:''}">${escapeHtml(n)}${c>1?` ×${c}`:''}</span>`).join(' ') : '—',
      };
    }
    const keyOf = r => `${r.path}¦${r.field}`;
    function buildRows(base, mb, g){
      const rows = [];
      const byKey = (list, fn) => { const mm = new Map(); list.forEach(o=>{ const k=fn(o); if(!mm.has(k)) mm.set(k,[]); mm.get(k).push(o); }); return mm; };
      if(g==='field'){
        byKey(base, o=>nameOf(state.fields,o.fieldId)).forEach((l,k)=>rows.push({path:'', field:k, ...agg(l,mb)}));
        rows.sort((a,b)=>b.events-a.events);
      } else {
        const paths = Array.from(byKey(base, o=>nameOf(state.programTypes,o.programTypeId)).entries())
          .sort((a,b)=>b[1].length-a[1].length);
        paths.forEach(([pn,pl])=>{
          if(g==='path'){ rows.push({path:pn, field:'', ...agg(pl,mb)}); return; }
          const fs = Array.from(byKey(pl, o=>nameOf(state.fields,o.fieldId)).entries()).sort((a,b)=>b[1].length-a[1].length);
          fs.forEach(([fn,fl])=>rows.push({path:pn, field:fn, ...agg(fl,mb)}));
          /* إجمالي المسار يظهر دائمًا ويجمع كل برامجه */
          rows.push({path:pn, field:'إجمالي المسار', sub:true, ...agg(pl,mb)});
        });
      }
      return rows;
    }
    function gen(){
      const m = document.getElementById('mr_month').value;
      if(!m) return null;
      const mb = monthBounds(m);
      const g  = document.getElementById('mr_group').value;
      const cmp = document.getElementById('mr_cmp').value;
      const base = filterMonth(mb);
      const rows = buildRows(base, mb, g);
      const tot = {path:'الإجمالي', field:'', total:true, ...agg(base,mb)};
      let prev = null;
      if(cmp){
        const pmb = monthBounds(cmp==='year' ? shiftMonth(m,-12) : shiftMonth(m,-1));
        const pbase = filterMonth(pmb);
        const pmap = new Map(buildRows(pbase, pmb, g).map(r=>[keyOf(r), r]));
        prev = { mb:pmb, map:pmap, tot:{...agg(pbase,pmb)} };
      }
      /* اتجاه آخر 6 أشهر */
      const trend = [];
      for(let k=-5;k<=0;k++){ const tmb = monthBounds(shiftMonth(m,k)); const a = agg(filterMonth(tmb), tmb);
        trend.push({label:tmb.short, full:tmb.label, events:a.events, people:a.people, cur:k===0}); }
      return {rows, tot, mb, g, prev, trend};
    }
    const NUMK = ['events','days','hours','trainers','people','placesN'];
    const NUMC = ['الفعاليات','عدد الأيام','عدد الساعات','عدد المدربين','المستفيدون','عدد الأماكن','الأماكن'];
    const colsFor = g => g==='path' ? ['المسار',...NUMC] : g==='field' ? ['المجال',...NUMC] : ['المسار','المجال',...NUMC];
    const NUMW = ['19mm','19mm','19mm','21mm','22mm','20mm','auto'];
    const widthsFor = g => g==='pathField' ? ['30mm','38mm',...NUMW] : ['46mm',...NUMW];
    function pct(cur, old){
      if(old===undefined || old===null) return null;
      if(!old && !cur) return {t:'—', c:'flat'};
      if(!old) return {t:'جديد', c:'up'};
      const p = Math.round((cur-old)/old*100);
      return {t:(p>0?'▲ ':p<0?'▼ ':'')+Math.abs(p)+'%', c:p>0?'up':p<0?'down':'flat'};
    }
    const DELTA_STYLE = {up:'color:#159669;', down:'color:#D94A4A;', flat:'color:#8C7D82;'};
    function deltaHtml(cur, old){
      const d = pct(cur, old); if(!d) return '';
      return `<span class="mr-d ${d.c}" title="السابق: ${old===undefined?0:old}" style="display:block;font-size:.78em;font-weight:700;${DELTA_STYLE[d.c]}"><span dir="ltr" style="unicode-bidi:isolate;">${d.t}</span></span>`;
    }
    function lead(r, g, html){
      const P = html ? escapeHtml(r.path) : r.path, F = html ? escapeHtml(r.field) : r.field;
      if(g==='path') return [P];
      if(g==='field') return [r.total ? 'الإجمالي' : F];
      return [r.total ? P : (html && r.sub ? '' : P), F];
    }
    function prevOf(d, r){
      if(!d.prev) return null;
      if(r.total) return d.prev.tot;
      return d.prev.map.get(keyOf(r)) || {};
    }
    const asArr  = (r,g) => [...lead(r,g,false), ...NUMK.map(k=>r[k]), r.placesTxt];
    function asHtml(r, d){
      const p = prevOf(d, r);
      return [...lead(r,d.g,true), ...NUMK.map(k=>String(r[k]) + (p ? deltaHtml(r[k], p[k]||0) : '')), r.placesHtml];
    }
    function tableHtml(d){
      if(!d.rows.length) return `<div class="empty-state">لا توجد فعاليات في ${escapeHtml(d.mb.label)}</div>`;
      const body = d.rows.map(r=>({ cells:asHtml(r,d),
        rowAttr: r.sub ? ' class="mr-sub"' : '',
        tdAttr:{0:' style="text-align:right;font-weight:700;"', 1:' style="text-align:right;"'} }));
      body.push({ cells:asHtml(d.tot,d), rowAttr:' class="mr-tot"', tdAttr:{0:' style="text-align:right;"'} });
      return repTableHtml(colsFor(d.g), body, {colWidths:widthsFor(d.g)});
    }
    /* رسمان صغيران منفصلان (لا محور مزدوج): الفعاليات، والمستفيدون — الشهر المختار بلون أغمق */
    function trendSvg(trend, key, title){
      const W=300, H=104, padB=20, padT=16, bw=30, gap=(W-6*bw)/7;
      const max = Math.max(1, ...trend.map(t=>t[key]));
      const bars = trend.map((t,i)=>{
        const h = Math.max(t[key]?3:0, Math.round((t[key]/max)*(H-padB-padT)));
        const x = W - (gap + i*(bw+gap)) - bw;           /* من اليمين لليسار */
        const y = H-padB-h;
        return `<g><title>${escapeHtml(t.full)}: ${t[key]}</title>
          <path d="M${x},${H-padB} V${y+4} Q${x},${y} ${x+4},${y} H${x+bw-4} Q${x+bw},${y} ${x+bw},${y+4} V${H-padB} Z" fill="${t.cur?'#8A1F42':'#E3BFCB'}"/>
          <text x="${x+bw/2}" y="${y-4}" text-anchor="middle" font-size="10" font-weight="700" fill="#5A142F">${t[key]}</text>
          <text x="${x+bw/2}" y="${H-5}" text-anchor="middle" font-size="9.5" fill="#5E4E54">${escapeHtml(t.label)}</text></g>`;
      }).join('');
      return `<div class="mr-trend"><div class="mr-trend-t">${escapeHtml(title)} — آخر 6 أشهر</div>
        <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:340px;height:auto;display:block;" role="img" aria-label="${escapeHtml(title)}">
        <line x1="0" x2="${W}" y1="${H-padB}" y2="${H-padB}" stroke="#EDE4E7"/>${bars}</svg></div>`;
    }
    function trendBlock(d){
      return `<div class="mr-trends">${trendSvg(d.trend,'events','الفعاليات')}${trendSvg(d.trend,'people','المستفيدون')}</div>`;
    }
    function kpiDelta(k){
      return d=>{ if(!d.prev) return ''; const x = pct(d.tot[k], d.prev.tot[k]); return x ? x.t : ''; };
    }
    const KPIS = [['fileText','الفعاليات','events'],['calendar','الأيام','days'],['clock','الساعات','hours'],
                  ['users','المدربون','trainers'],['users','المستفيدون','people'],['school','الأماكن','placesN']];
    function show(){
      const d = gen(); const b = document.getElementById('mr_result');
      if(!d){ b.innerHTML=''; return; }
      b.innerHTML = `${d.prev?`<div class="helper" style="margin-bottom:8px;">${icon('trendingUp',14)} مقارنة <b>${escapeHtml(d.mb.label)}</b> مع <b>${escapeHtml(d.prev.mb.label)}</b></div>`:''}
        <div class="mr-kpis">
          ${KPIS.map(k=>{ const x = d.prev ? pct(d.tot[k[2]], d.prev.tot[k[2]]) : null;
            return `<div class="mr-kpi"><span>${icon(k[0],15)}</span><b>${d.tot[k[2]]}</b>
              <i>${k[1]}${x?` <em class="${x.c}" dir="ltr" title="${escapeHtml(d.prev.mb.label)}: ${d.prev.tot[k[2]]}">${x.t}</em>`:''}</i></div>`; }).join('')}
        </div>
        ${trendBlock(d)}` + tableHtml(d) + benefBlock(filterMonth(d.mb));
      enhanceReportTable(b);
    }
    function printIt(){
      const d = gen();
      if(!d || !d.rows.length){ toast('لا توجد فعاليات في هذا الشهر'); return; }
      doPrintDoc(buildReportDoc({
        titleAr: 'التقرير الشهري',
        subtitle: d.mb.label + (d.prev ? ` — مقارنة مع ${d.prev.mb.label}` : ''),
        kpis: [['📋','events'],['🗓️','days'],['⏱️','hours'],['👥','trainers'],['👥','people'],['🏫','placesN']].map((e,i)=>({
          v:d.tot[e[1]], l:`${e[0]} ${KPIS[i][1]}${d.prev?' '+kpiDelta(e[1])(d):''}` })),
        headers: colsFor(d.g), colWidths: widthsFor(d.g),
        rows: d.rows.map(r=>{ const a = asHtml(r,d); return r.sub ? a.map((v,i)=>i===a.length-1?v:`<b>${v}</b>`) : a; })
              .concat([asHtml(d.tot,d).map((v,i,a)=>i===a.length-1?v:`<b>${v}</b>`)]),
        extraHtml: benefBlock(filterMonth(d.mb), true) + `<div style="display:flex;gap:10mm;justify-content:center;margin-top:5mm;">${trendSvg(d.trend,'events','الفعاليات')}${trendSvg(d.trend,'people','المستفيدون')}</div>`
      }), true, 'A4');
    }
    document.getElementById('mr_go').onclick = show;
    document.getElementById('mr_print').onclick = printIt;
    document.getElementById('mr_pdf').onclick = printIt;
    document.getElementById('mr_excel').onclick = ()=>{
      const d = gen();
      if(!d || !d.rows.length){ toast('لا توجد فعاليات في هذا الشهر'); return; }
      let cols = colsFor(d.g), rows = d.rows.map(r=>asArr(r,d.g)).concat([asArr(d.tot,d.g)]);
      if(d.prev){
        const lbl = d.prev.mb.label;
        cols = cols.concat([`الفعاليات (${lbl})`,'التغيّر',`الساعات (${lbl})`,'التغيّر',`المستفيدون (${lbl})`,'التغيّر']);
        const all = d.rows.concat([d.tot]);
        rows = rows.map((row,i)=>{ const r = all[i], p = prevOf(d,r) || {};
          const c = k => { const x = pct(r[k], p[k]||0); return x ? x.t : ''; };
          return row.concat([p.events||0, c('events'), p.hours||0, c('hours'), p.people||0, c('people')]); });
      }
      exportToExcel(`التقرير_الشهري_${d.mb.m}.xlsx`, cols, rows,
        `التقرير الشهري — ${d.mb.label}${d.prev?` (مقارنة مع ${d.prev.mb.label})`:''}`);
    };
    ['mr_month','mr_group','mr_cmp','mr_done','mr_notDone'].forEach(id=>document.getElementById(id).addEventListener('change', show));
    show();
  }

  /* ══════════════════════════════════════════════════════════════════
     الفعاليات والطلبات حسب الفترة — تجميع يومي/أسبوعي/شهري/ربع/سنوي
     ══════════════════════════════════════════════════════════════════ */
  function drawPeriodSum(){
    const box = document.getElementById('reportContent');
    box.innerHTML = `<div class="card">
      <h2>الفعاليات والطلبات حسب الفترة</h2>
      <div class="rp-dates" style="margin-bottom:12px;">
        <div class="rp-date"><label>من تاريخ</label><input id="ps_from" type="date" lang="en-GB"></div>
        <div class="rp-date"><label>إلى تاريخ</label><input id="ps_to" type="date" lang="en-GB"></div>
        <div class="rp-date"><label>التجميع</label>
          <select id="ps_group">
            <option value="day">يومي</option>
            <option value="week">أسبوعي</option>
            <option value="month" selected>شهري</option>
            <option value="quarter">ربع سنوي</option>
            <option value="year">سنوي</option>
          </select></div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <button class="btn btn-primary" id="ps_go">${icon('barChart',14)} عرض</button>
        <button class="icon-btn" id="ps_print" title="طباعة" aria-label="طباعة" style="width:28px;height:28px;padding:0;">${icon('printer',14)}</button>
        <button class="icon-btn" id="ps_pdf" title="تنزيل PDF" aria-label="تنزيل PDF" style="width:28px;height:28px;padding:0;">${icon('download',14)}</button>
        <button class="icon-btn" id="ps_excel" title="تنزيل Excel" aria-label="تنزيل Excel" style="width:28px;height:28px;padding:0;">${icon('sheet',14)}</button>
      </div>
      <div id="ps_result" style="margin-top:14px;"></div>
    </div>`;

    const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    function keyOf(iso, g){
      if(!iso) return '—';
      const y = iso.slice(0,4), m = Number(iso.slice(5,7)), d = Number(iso.slice(8,10));
      if(g==='year')    return y;
      if(g==='quarter') return `${y} — الربع ${Math.ceil(m/3)}`;
      if(g==='month')   return `${MONTHS[m-1]} ${y}`;
      if(g==='week'){
        const dt = new Date(iso+'T00:00:00');
        const day = dt.getDay();                 // الأحد = 0 (بداية الأسبوع)
        const s = addDaysISO(iso, -day), e = addDaysISO(s, 6);
        return `${fmtDate(s)} — ${fmtDate(e)}`;
      }
      return fmtDate(iso);
    }
    function sortKey(iso, g){
      if(!iso) return 'zzz';
      if(g==='week'){ const dt=new Date(iso+'T00:00:00'); return addDaysISO(iso, -dt.getDay()); }
      if(g==='month')   return iso.slice(0,7);
      if(g==='quarter') return `${iso.slice(0,4)}-Q${Math.ceil(Number(iso.slice(5,7))/3)}`;
      if(g==='year')    return iso.slice(0,4);
      return iso;
    }
    function gather(){
      const from = document.getElementById('ps_from').value;
      const to   = document.getElementById('ps_to').value;
      const g    = document.getElementById('ps_group').value;
      const list = (state.orders||[]).filter(o=>{
        const s=o.date||''; if(!s) return false;
        const e=orderEnd(o);
        if(from && e<from) return false;
        if(to && s>to) return false;
        return true;
      });
      const map = new Map();
      list.forEach(o=>{
        const k = keyOf(o.date, g), sk = sortKey(o.date, g);
        if(!map.has(k)) map.set(k, {k, sk, n:0, days:0, hours:0, people:0,
          reqs:0, schools:new Set(), trainers:new Set(), done:0, cancelled:0, postponed:0, items:[]});
        const r = map.get(k);
        if(isCancelledOrder(o)){ r.cancelled++; return; }
        r.n++; r.items.push(o);
        r.days   += daysCount(o.date, o.dateTo);
        r.hours  += computeHours(o.timeFrom, o.timeTo, o.date, o.dateTo);
        r.people += Number(o.participantsCount)||0;
        r.reqs   += (o.adminRequests||[]).length;
        if(o.schoolId) r.schools.add(o.schoolId);
        (o.trainerIds||[]).forEach(t=>r.trainers.add(t));
        if(o.completionStatus==='تم') r.done++;
        if(o.status==='postponed') r.postponed++;
      });
      const rows = Array.from(map.values()).sort((a,b)=>a.sk.localeCompare(b.sk));
      rows.forEach(r=>{ r.hours = Math.round(r.hours*10)/10; });
      const tot = rows.reduce((a,r)=>({
        n:a.n+r.n, days:a.days+r.days, hours:a.hours+r.hours, people:a.people+r.people,
        reqs:a.reqs+r.reqs, done:a.done+r.done, cancelled:a.cancelled+r.cancelled, postponed:a.postponed+r.postponed
      }), {n:0,days:0,hours:0,people:0,reqs:0,done:0,cancelled:0,postponed:0});
      tot.hours = Math.round(tot.hours*10)/10;
      tot.schools  = new Set(list.map(o=>o.schoolId).filter(Boolean)).size;
      tot.trainers = new Set(list.flatMap(o=>o.trainerIds||[])).size;
      return {rows, tot, from, to, g, list};
    }
    const HDR = ['الفترة','الفعاليات','الأيام','الساعات','المستهدفون','الطلبات الإدارية','الجهات','المنفذون','منجزة','مؤجلة','ملغاة','أماكن التنفيذ الفعلية'];
    function rowsOf(d){ return d.rows.map(r=>[r.k, r.n, r.days, r.hours, r.people, r.reqs,
      r.schools.size, r.trainers.size, r.done, r.postponed, r.cancelled, venuesSummaryText(r.items)]); }
    function render(){
      const d = gather();
      const el = document.getElementById('ps_result');
      if(!d.rows.length){ el.innerHTML = `<div class="empty-state">لا توجد فعاليات ضمن هذه الفترة</div>`; return; }
      const maxN = Math.max(...d.rows.map(r=>r.n), 1);
      el.innerHTML = `
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:0 0 14px;">
          ${[['clipboard','الفعاليات',d.tot.n],['calendar','الأيام',d.tot.days],['clock','الساعات',d.tot.hours],
             ['users','المستهدفون',d.tot.people],['clipboard','طلبات إدارية',d.tot.reqs],
             ['school','الجهات',d.tot.schools],['users','المنفذون',d.tot.trainers],['checkCircle','منجزة',d.tot.done]]
            .map(([ic,l,v])=>`<div style="background:#fff;border:1px solid var(--border-c);border-radius:12px;padding:11px;text-align:center;">
              <div style="width:30px;height:30px;margin:0 auto 6px;border-radius:9px;background:var(--gold-l);
                color:var(--gold-d);display:flex;align-items:center;justify-content:center;">${icon(ic,15)}</div>
              <div style="font-family:'IBM Plex Sans Arabic',sans-serif;font-size:20px;font-weight:800;color:var(--heading-text);">${v}</div>
              <div style="font-size:11px;color:var(--muted-text);margin-top:2px;">${escapeHtml(l)}</div>
            </div>`).join('')}
        </div>
        <table class="rep-table" style="font-size:12.5px;"><thead><tr>
          <th style="text-align:right;">الفترة</th><th>التوزيع</th>
          ${HDR.slice(1).map(x=>`<th>${escapeHtml(x)}</th>`).join('')}
        </tr></thead><tbody>
          ${d.rows.map(r=>`<tr>
            <td style="text-align:right;white-space:nowrap;">${escapeHtml(r.k)}</td>
            <td style="width:20%;"><div style="height:7px;background:var(--sand-200);border-radius:999px;overflow:hidden;">
              <div style="width:${Math.round(r.n/maxN*100)}%;height:100%;background:var(--gold);border-radius:999px;"></div></div></td>
            <td><b>${r.n}</b></td><td>${r.days}</td><td>${r.hours}</td><td>${r.people}</td><td>${r.reqs}</td>
            <td>${r.schools.size}</td><td>${r.trainers.size}</td>
            <td>${r.done}</td><td>${r.postponed}</td><td>${r.cancelled}</td>
            <td style="text-align:right;">${venuesSummary(r.items)}</td>
          </tr>`).join('')}
        </tbody><tfoot><tr style="font-weight:700;background:var(--sand-100);">
          <td style="text-align:right;">الإجمالي</td><td></td>
          <td>${d.tot.n}</td><td>${d.tot.days}</td><td>${d.tot.hours}</td><td>${d.tot.people}</td>
          <td>${d.tot.reqs}</td><td>${d.tot.schools}</td><td>${d.tot.trainers}</td>
          <td>${d.tot.done}</td><td>${d.tot.postponed}</td><td>${d.tot.cancelled}</td>
          <td style="text-align:right;">${venuesSummary(d.list)}</td>
        </tr></tfoot></table>`;
      enhanceReportTable(el);
    }
    document.getElementById('ps_go').onclick = render;
    ['ps_from','ps_to','ps_group'].forEach(id=>document.getElementById(id).addEventListener('change', render));
    function printIt(){
      const d = gather();
      if(!d.rows.length){ toast('لا توجد بيانات ضمن هذه الفترة'); return; }
      doPrintDoc(buildReportDoc({
        titleAr:'الفعاليات والطلبات حسب الفترة',
        subtitle:`من ${d.from?fmtDate(d.from):'—'} إلى ${d.to?fmtDate(d.to):'—'}`,
        kpis:[{v:d.tot.n,l:'📋 الفعاليات'},{v:d.tot.hours,l:'⏱ الساعات'},
              {v:d.tot.people,l:'👥 المستهدفون'},{v:d.tot.reqs,l:'📄 الطلبات الإدارية'}],
        headers:HDR,
        rows: d.rows.map((r,i)=>rowsOf(d)[i].slice(0,11).map(v=>escapeHtml(String(v))).concat([venuesSummary(r.items)]))
      }), true, 'A4');
    }
    document.getElementById('ps_print').onclick = printIt;
    document.getElementById('ps_pdf').onclick   = printIt;
    document.getElementById('ps_excel').onclick = ()=>{
      const d = gather();
      if(!d.rows.length){ toast('لا توجد بيانات ضمن هذه الفترة'); return; }
      exportToExcel('الفعاليات_حسب_الفترة.xlsx', HDR, rowsOf(d),
        `الفعاليات والطلبات حسب الفترة (من ${d.from?fmtDate(d.from):'—'} إلى ${d.to?fmtDate(d.to):'—'})`);
    };
    render();
  }

  /* ══════════════════════════════════════════════════════════════════
     أكثر البرامج طلبًا — حسب المجال والمسار والعناوين
     العناوين تُجمَّع بتشابه دلالي (تطبيع عربي + تجذيع خفيف + Jaccard)
     ══════════════════════════════════════════════════════════════════ */
  function arNorm(s){
    return String(s||'')
      .replace(/[\u064B-\u0652\u0670\u0640]/g,'')          // تشكيل وتطويل
      .replace(/[أإآا]/g,'ا').replace(/[ىي]/g,'ي')
      .replace(/ة/g,'ه').replace(/[ؤئء]/g,'ء')
      .replace(/[^\u0600-\u06FF0-9a-zA-Z ]/g,' ')
      .replace(/\s+/g,' ').trim().toLowerCase();
  }
  function arStem(w){
    w = w.replace(/^(وال|بال|كال|فال|ال|و|ف|ب|ك|ل)/,'');
    w = w.replace(/(اتها|اتهم|تها|هما|كما|ونها|انها|ات|ون|ين|ان|ها|هم|كم|نا|ية|ي|ه|ا)$/,'');
    return w;
  }
  const AR_STOP = new Set(['في','من','علي','عن','الي','مع','و','هذا','هذه','التي','الذي','ما',
    'برنامج','فعاليه','مبادره','دوره','ورشه','يوم','حول','بين','كل']);
  function titleTokens(s){
    return [...new Set(arNorm(s).split(' ').map(arStem).filter(w=>w.length>2 && !AR_STOP.has(w)))];
  }
  function simRatio(a,b){
    const A=new Set(titleTokens(a)), B=new Set(titleTokens(b));
    if(!A.size || !B.size) return 0;
    let inter=0; A.forEach(x=>{ if(B.has(x)) inter++; });
    return inter/(A.size + B.size - inter);
  }
  function drawTopPrograms(){
    const box = document.getElementById('reportContent');
    box.innerHTML = `<div class="card">
      <h2>أكثر البرامج طلبًا</h2>
      <div class="rp-dates" style="margin-bottom:12px;">
        <div class="rp-date"><label>من تاريخ</label><input id="tp_from" type="date" lang="en-GB"></div>
        <div class="rp-date"><label>إلى تاريخ</label><input id="tp_to" type="date" lang="en-GB"></div>
        <div class="rp-date"><label>حساسية تجميع العناوين</label>
          <select id="tp_sim">
            <option value="0.75">دقيق (تشابه عالٍ)</option>
            <option value="0.55" selected>متوازن</option>
            <option value="0.40">واسع (يجمع أكثر)</option>
          </select></div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <button class="btn btn-primary" id="tp_go">${icon('barChart',14)} عرض</button>
        <button class="icon-btn" id="tp_print" title="طباعة" aria-label="طباعة" style="width:28px;height:28px;padding:0;">${icon('printer',14)}</button>
        <button class="icon-btn" id="tp_pdf" title="تنزيل PDF" aria-label="تنزيل PDF" style="width:28px;height:28px;padding:0;">${icon('download',14)}</button>
        <button class="icon-btn" id="tp_excel" title="تنزيل Excel" aria-label="تنزيل Excel" style="width:28px;height:28px;padding:0;">${icon('sheet',14)}</button>
      </div>
      <div id="tp_result" style="margin-top:14px;"></div>
    </div>`;

    function gather(){
      const from = document.getElementById('tp_from').value;
      const to   = document.getElementById('tp_to').value;
      const TH   = parseFloat(document.getElementById('tp_sim').value);
      const list = (state.orders||[]).filter(o=>{
        if(isCancelledOrder(o)) return false;
        const s=o.date||'', e=orderEnd(o);
        if(from && e && e<from) return false;
        if(to && s && s>to) return false;
        return !!s;
      });
      const total = list.length;
      /* حسب المجال */
      const byField = (state.fields||[]).map(f=>({
        name:f.name, n:list.filter(o=>o.fieldId===f.id).length
      })).filter(x=>x.n).sort((a,b)=>b.n-a.n);
      /* حسب المسار */
      const byPath = (state.programTypes||[]).map(p=>({
        name:p.name, n:list.filter(o=>o.programTypeId===p.id).length
      })).filter(x=>x.n).sort((a,b)=>b.n-a.n);
      /* تجميع العناوين المتشابهة */
      const groups = [];
      list.forEach(o=>{
        const t = (o.title||'').trim(); if(!t) return;
        let g = groups.find(x => simRatio(x.rep, t) >= TH);
        if(!g){ g = {rep:t, items:[], variants:new Set()}; groups.push(g); }
        g.items.push(o); g.variants.add(t);
        /* العنوان الممثِّل = الأكثر تكرارًا */
        if(t.length < g.rep.length) g.rep = t;
      });
      groups.forEach(g=>{
        g.n = g.items.length;
        g.variantList = Array.from(g.variants);
        g.schools = new Set(g.items.map(x=>x.schoolId).filter(Boolean)).size;
        g.hours = Math.round(g.items.reduce((s,x)=>s+computeHours(x.timeFrom,x.timeTo,x.date,x.dateTo),0)*10)/10;
        g.people = g.items.reduce((s,x)=>s+(Number(x.participantsCount)||0),0);
        const fd = state.fields.find(f=>f.id===g.items[0].fieldId);
        g.field = fd ? fd.name : '—';
      });
      groups.sort((a,b)=>b.n-a.n);
      return {list, total, byField, byPath, groups, from, to, TH};
    }

    function barRow(name, n, max, total){
      const pct = total ? Math.round(n/total*1000)/10 : 0;
      return `<tr>
        <td style="text-align:right;">${escapeHtml(name)}</td>
        <td style="width:40%;"><div style="height:8px;background:var(--sand-200);border-radius:999px;overflow:hidden;">
          <div style="width:${max?Math.round(n/max*100):0}%;height:100%;background:var(--gold);border-radius:999px;"></div></div></td>
        <td style="width:60px;">${n}</td>
        <td style="width:64px;direction:ltr;">${pct}%</td>
      </tr>`;
    }
    function render(){
      const d = gather();
      const el = document.getElementById('tp_result');
      if(!d.total){ el.innerHTML = `<div class="empty-state">لا توجد فعاليات ضمن هذه الفترة</div>`; return; }
      const maxF = Math.max(...d.byField.map(x=>x.n), 1);
      const maxP = Math.max(...d.byPath.map(x=>x.n), 1);
      const maxT = Math.max(...d.groups.map(x=>x.n), 1);
      el.innerHTML = `
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin:0 0 14px;">
          <div class="card"><h2>حسب مجال المبادرة</h2>
            <table style="font-size:12.5px;"><thead><tr><th style="text-align:right;">المجال</th><th>النسبة</th><th>العدد</th><th>%</th></tr></thead>
            <tbody>${d.byField.map(x=>barRow(x.name,x.n,maxF,d.total)).join('')}</tbody></table></div>
          <div class="card"><h2>حسب مسار المبادرة</h2>
            <table style="font-size:12.5px;"><thead><tr><th style="text-align:right;">المسار</th><th>النسبة</th><th>العدد</th><th>%</th></tr></thead>
            <tbody>${d.byPath.map(x=>barRow(x.name,x.n,maxP,d.total)).join('')}</tbody></table></div>
        </div>
        <div class="card"><h2>أكثر العناوين طلبًا — بعد دمج المتشابهة</h2>
          <div class="helper" style="margin-bottom:9px;">
            ${d.total} فعالية · ${d.groups.length} عنوان بعد الدمج
            ${d.total>d.groups.length?` · دُمج ${d.total-d.groups.length} عنوانًا متشابهًا`:''}
          </div>
          <table style="font-size:12.5px;"><thead><tr>
            <th style="width:40px;">#</th><th style="text-align:right;">العنوان</th><th>المجال</th>
            <th>الطلبات</th><th>الجهات</th><th>الساعات</th><th>المستهدفون</th><th>الصيغ</th>
          </tr></thead><tbody>
            ${d.groups.slice(0,40).map((g,i)=>`<tr>
              <td>${i+1}</td>
              <td style="text-align:right;">${escapeHtml(g.rep)}
                ${g.variantList.length>1?`<div class="helper" style="font-size:10.5px;">${
                  escapeHtml(g.variantList.filter(v=>v!==g.rep).slice(0,3).join(' · '))}</div>`:''}</td>
              <td>${escapeHtml(g.field)}</td>
              <td><b>${g.n}</b></td>
              <td>${g.schools}</td>
              <td>${g.hours}</td>
              <td>${g.people}</td>
              <td>${g.variantList.length}</td>
            </tr>`).join('')}
          </tbody></table>
          ${d.groups.length>40?`<div class="helper" style="margin-top:6px;">تُعرض أعلى 40 عنوانًا من ${d.groups.length}</div>`:''}
        </div>`;
      enhanceReportTable(el);
    }
    document.getElementById('tp_go').onclick = render;
    ['tp_from','tp_to','tp_sim'].forEach(id=>document.getElementById(id).addEventListener('change', render));

    const HDR = ['#','العنوان','المجال','الطلبات','الجهات','الساعات','المستهدفون','عدد الصيغ'];
    function rowsOf(d){ return d.groups.map((g,i)=>[i+1,g.rep,g.field,g.n,g.schools,g.hours,g.people,g.variantList.length]); }
    function printIt(){
      const d = gather();
      if(!d.total){ toast('لا توجد بيانات ضمن هذه الفترة'); return; }
      doPrintDoc(buildReportDoc({
        titleAr:'أكثر البرامج طلبًا',
        subtitle:`من ${d.from?fmtDate(d.from):'—'} إلى ${d.to?fmtDate(d.to):'—'}`,
        kpis:[
          {v:d.total,l:'📋 إجمالي الطلبات'}, {v:d.groups.length,l:'📄 عناوين بعد الدمج'},
          {v:d.byField.length,l:'🗂️ المجالات'}, {v:d.byPath.length,l:'📈 المسارات'},
        ],
        headers:HDR,
        rows: rowsOf(d).map(r=>r.map(v=>escapeHtml(String(v))))
      }), true, 'A4');
    }
    document.getElementById('tp_print').onclick = printIt;
    document.getElementById('tp_pdf').onclick   = printIt;
    document.getElementById('tp_excel').onclick = ()=>{
      const d = gather();
      if(!d.total){ toast('لا توجد بيانات ضمن هذه الفترة'); return; }
      exportToExcel('أكثر_البرامج_طلبا.xlsx', HDR, rowsOf(d),
        `أكثر البرامج طلبًا (من ${d.from?fmtDate(d.from):'—'} إلى ${d.to?fmtDate(d.to):'—'})`);
    };
    render();
  }

  /* ══ تقرير مجال المبادرة (ملخّص): صف لكل مجال بإجمالياته ══ */
  /* ══════════════════════════════════════════════════════════════════
     تقرير الفعاليات حسب مكان التنفيذ الفعلي خلال فترة
     ──────────────────────────────────────────────────────────────────
     «مكان التنفيذ الفعلي» حقل اختياري يُملأ حين يختلف موضع التنفيذ عن
     مقر الجهة الطالبة (مركز عيد الثقافي، مخيم أم العمد، عزبة سمسمة…).
     يجمع هذا التقرير فعاليات كل مكان خلال فترة: ملخّصًا وتفصيلًا.
     ══════════════════════════════════════════════════════════════════ */
  function drawVenues(){
    const box = document.getElementById('reportContent');
    /* الأماكن المعرَّفة في الإعدادات + أي مكان ورد في طلب سابق ولو حُذف لاحقًا */
    const venues = (state.venues||[]).map(v=>v.name)
      .concat((state.orders||[]).map(o=>o.venue).filter(Boolean))
      .filter((v,i,a)=>v && a.indexOf(v)===i)
      .sort((a,b)=>String(a).localeCompare(String(b),'ar'));

    box.innerHTML = `<div class="card">
      <h2>${icon('home',16)} فعاليات مكان التنفيذ الفعلي</h2>
      <div class="rp-dates" style="margin-bottom:12px;">
        <div class="rp-date"><label>من تاريخ</label><input id="vn_from" type="date" lang="en-GB"></div>
        <div class="rp-date"><label>إلى تاريخ</label><input id="vn_to" type="date" lang="en-GB"></div>
      </div>

      <div class="vn-lbl">أماكن التنفيذ</div>
      <div class="vn-picks" id="vn_picks">
        <label class="pill-opt"><input type="checkbox" id="vn_all" checked>
          <span class="dot">${icon('check',12)}</span><span>كل الأماكن</span></label>
        ${venues.map(v=>`<label class="pill-opt"><input type="checkbox" class="vn-chk" value="${escapeHtml(v)}">
          <span class="dot">${icon('check',12)}</span><span>${escapeHtml(v)}</span></label>`).join('')
          || '<span class="helper">لم تُسجَّل أماكن تنفيذ بعد</span>'}
      </div>

      <div class="fs-flags" style="margin-top:10px;">
        <label class="pill-opt"><input type="checkbox" id="vn_summary" checked>
          <span class="dot">${icon('check',12)}</span><span>ملخّص الأماكن</span></label>
        <label class="pill-opt"><input type="checkbox" id="vn_detail" checked>
          <span class="dot">${icon('check',12)}</span><span>تفصيل الفعاليات</span></label>
        <label class="pill-opt"><input type="checkbox" id="vn_host">
          <span class="dot">${icon('check',12)}</span><span>تضمين ما نُفِّذ في مقر الجهة الطالبة</span></label>
        <label class="pill-opt"><input type="checkbox" id="vn_cancel">
          <span class="dot">${icon('check',12)}</span><span>تضمين الملغاة</span></label>
      </div>

      <div class="vn-acts">
        <button class="btn btn-primary" id="vn_go">عرض</button>
        <button class="icon-btn rect" id="vn_print" data-tip="طباعة" title="طباعة" aria-label="طباعة">${icon('printer',17)}</button>
        <button class="icon-btn rect" id="vn_pdf" data-tip="تنزيل PDF" title="تنزيل PDF" aria-label="تنزيل PDF">${icon('download',17)}</button>
        <button class="icon-btn rect" id="vn_excel" data-tip="تنزيل Excel" title="تنزيل Excel" aria-label="تنزيل Excel">${icon('sheet',17)}</button>
      </div>
      <div id="vn_result" style="margin-top:14px;"></div>
    </div>`;

    const HOST = 'في مقر الجهة الطالبة';
    const SUM_COLS = ['مكان التنفيذ','الفعاليات','الأيام','الساعات','المستهدفون','عدد الجهات','عدد المقدّمين'];
    /* عرض صريح لاسم المكان — وإلا ابتلع كل المساحة المتبقية تحت
       table-layout:fixed وضاقت أعمدة الأرقام بلا داعٍ */
    const SUM_W    = ['70mm','22mm','15mm','19mm','19mm','20mm','23mm'];
    const DET_COLS = ['#','الفعالية','التاريخ','الوقت','الجهة الطالبة','مقدم المبادرة','المستهدفون','الإنجاز'];

    const picked = ()=>[...box.querySelectorAll('.vn-chk:checked')].map(x=>x.value);

    function gen(){
      const from = document.getElementById('vn_from').value;
      const to   = document.getElementById('vn_to').value;
      const withHost   = document.getElementById('vn_host').checked;
      const withCancel = document.getElementById('vn_cancel').checked;
      const sel = picked();
      /* التقاطع مع الفترة — حتى تُحتسب الفعالية الممتدة على عدة أيام */
      const base = (state.orders||[]).filter(o=>{
        if(!withCancel && isCancelledOrder(o)) return false;
        const s=o.date||'', e=orderEnd(o);
        if(!s && !e) return false;
        if(from && e && e<from) return false;
        if(to && s && s>to) return false;
        if(!o.venue) return withHost;        /* نُفِّذت في مقر الجهة الطالبة */
        if(sel.length && !sel.includes(o.venue)) return false;
        return true;
      }).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))
                  || String(a.timeFrom||'').localeCompare(String(b.timeFrom||'')));

      /* التجميع حسب مكان التنفيذ */
      const map = new Map();
      base.forEach(o=>{
        const k = o.venue || HOST;
        if(!map.has(k)) map.set(k, []);
        map.get(k).push(o);
      });
      const groups = [...map.entries()]
        .map(([venue, list])=>({ venue, list,
          events: list.length,
          days:   list.reduce((s,o)=>s+daysCount(o.date,o.dateTo),0),
          hours:  Math.round(list.reduce((s,o)=>s+computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo),0)*10)/10,
          people: list.reduce((s,o)=>s+(Number(o.participantsCount)||0),0),
          schools:new Set(list.map(o=>o.schoolId).filter(Boolean)).size,
          trainers:new Set(list.flatMap(o=>o.trainerIds||[])).size }))
        /* مقر الجهة الطالبة في الذيل دائمًا — ليس مكانًا من أماكن المؤسسة */
        .sort((a,b)=> (a.venue===HOST)-(b.venue===HOST) || b.events-a.events);

      const tot = { venue:'الإجمالي', events:base.length,
        days:   groups.reduce((s,g)=>s+g.days,0),
        hours:  Math.round(groups.reduce((s,g)=>s+g.hours,0)*10)/10,
        people: groups.reduce((s,g)=>s+g.people,0),
        schools:new Set(base.map(o=>o.schoolId).filter(Boolean)).size,
        trainers:new Set(base.flatMap(o=>o.trainerIds||[])).size };

      return { groups, tot, base, from, to };
    }

    const sumRow = g => [g.venue, g.events, g.days, g.hours, g.people, g.schools, g.trainers].map(String);
    const detRow = o => {
      const sc = (state.schools||[]).find(x=>x.id===o.schoolId);
      return [ String(o.serial||'—'), escapeHtml(o.title||''), repPeriodCell(o),
        escapeHtml(fullTimeRange(o.timeFrom,o.timeTo)||'—'),
        sc?escapeHtml(sc.name):'—', repTrainers(o),
        String(o.participantsCount||'—'),
        (o.status||'active')==='cancelled' ? '<span class="vn-cx">ملغاة</span>'
          : escapeHtml(o.completionStatus||'لم تنجز') ];
    };
    const detRowTxt = o => {
      const sc = (state.schools||[]).find(x=>x.id===o.schoolId);
      return [ o.serial||'', o.title||'',
        fmtDate(o.date) + (orderEnd(o)!==o.date ? ' — '+fmtDate(orderEnd(o)) : ''),
        fullTimeRange(o.timeFrom,o.timeTo)||'', sc?sc.name:'', trainerNames(o),
        o.participantsCount||'',
        (o.status||'active')==='cancelled' ? 'ملغاة' : (o.completionStatus||'لم تنجز') ];
    };

    function sumTable(groups, tot){
      const body = groups.map(g=>({ cells:sumRow(g), tdAttr:{0:' style="text-align:right;font-weight:700;"'} }));
      body.push({ cells:sumRow(tot), rowAttr:' style="background:#FAF9F7;font-weight:700;"',
        tdAttr:{0:' style="text-align:right;"'} });
      return repTableHtml(SUM_COLS, body, {colWidths:SUM_W});
    }
    const gHead = g => `${escapeHtml(g.venue)} <span class="vn-gn">— ${g.events} ${eventWord(g.events)}`
      + ` · ${g.days} ${dayWord(g.days)} · ${g.people} مستهدف</span>`;

    function bodyHtml(groups, tot){
      const wantSum = document.getElementById('vn_summary').checked;
      const wantDet = document.getElementById('vn_detail').checked;
      /* إن أُلغي الخياران معًا نعرض الملخّص — التقرير الفارغ بلا معنى */
      const sum = wantSum || !wantDet;
      return (sum ? `<div class="sec-t">ملخّص أماكن التنفيذ</div>` + sumTable(groups, tot) : '')
        + (wantDet ? groups.map(g=>`<div class="sec-t vn-sec">${gHead(g)}</div>`
            + repTableHtml(DET_COLS, g.list.map(detRow))).join('') : '');
    }

    const EMPTY = 'لا توجد فعاليات بمكان تنفيذ فعلي ضمن هذه الفترة';
    document.getElementById('vn_go').onclick=()=>{
      const {groups, tot} = gen();
      const b = document.getElementById('vn_result');
      if(!groups.length){ b.innerHTML = `<div class="empty-state">${EMPTY}</div>`; return; }
      b.innerHTML = bodyHtml(groups, tot);
      enhanceReportTable(b);
    };

    function printIt(){
      const {groups, tot, from, to} = gen();
      if(!groups.length){ toast(EMPTY); return; }
      doPrintDoc(buildReportDoc({
        titleAr:'فعاليات مكان التنفيذ الفعلي',
        subtitle:`من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'}`
          + (groups.length>1 ? ` · ${groups.length} أماكن تنفيذ` : ''),
        kpis:[
          {v:groups.length, l:'🏛️ أماكن التنفيذ'},
          {v:tot.events,    l:'📋 الفعاليات'},
          {v:tot.days,      l:'🗓️ الأيام'},
          {v:tot.people,    l:'👥 المستهدفون'},
        ],
        extraHtml: bodyHtml(groups, tot)
      }), true, 'A4');
    }
    document.getElementById('vn_print').onclick = printIt;
    document.getElementById('vn_pdf').onclick   = printIt;

    document.getElementById('vn_excel').onclick=()=>{
      const {groups, tot, from, to} = gen();
      if(!groups.length){ toast(EMPTY); return; }
      /* ورقة للملخّص وورقة لكل مكان — أسماء الأوراق في Excel ٣١ حرفًا بحد أقصى */
      const used = new Set();
      const sheetName = v=>{
        let n = String(v).replace(/[\\\/\?\*\[\]:]/g,' ').trim().slice(0,28) || 'مكان';
        let i=2, base=n; while(used.has(n)){ n = base.slice(0,26)+' '+i; i++; }
        used.add(n); return n;
      };
      used.add('ملخّص الأماكن');
      const sheets = [{ name:'ملخّص الأماكن', headers:SUM_COLS,
          rows: groups.map(sumRow).concat([sumRow(tot)]) }]
        .concat(groups.map(g=>({ name:sheetName(g.venue),
          headers:DET_COLS, rows:g.list.map(detRowTxt) })));
      exportToExcelMultiSheet('فعاليات_مكان_التنفيذ.xlsx', sheets,
        `فعاليات مكان التنفيذ الفعلي (من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'})`);
    };

    /* «كل الأماكن» والتحديد المفرد يتنافيان */
    const allChk = document.getElementById('vn_all');
    const chks = [...box.querySelectorAll('.vn-chk')];
    const refresh = ()=>document.getElementById('vn_go').click();
    if(allChk) allChk.onchange = ()=>{
      if(allChk.checked) chks.forEach(x=>{ x.checked=false; });
      else if(!picked().length) allChk.checked = true;   /* لا بد من مرجع واحد */
      refresh();
    };
    chks.forEach(x=>{ x.onchange = ()=>{
      if(allChk) allChk.checked = !picked().length;
      refresh();
    }; });
    ['vn_from','vn_to','vn_detail','vn_summary','vn_host','vn_cancel']
      .forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('change', refresh); });
    refresh();
  }
  function drawFieldSummary(){
    const box=document.getElementById('reportContent');
    box.innerHTML = `<div class="card">
      <h2>تقرير مجال المبادرة</h2>
      <div class="rp-dates" style="margin-bottom:12px;">
        <div class="rp-date"><label>من تاريخ</label><input id="fs_from" type="date" lang="en-GB"></div>
        <div class="rp-date"><label>إلى تاريخ</label><input id="fs_to" type="date" lang="en-GB"></div>
      </div>
      <div class="fs-flags">
        <label class="pill-opt"><input type="checkbox" id="fs_done" checked><span class="dot">${icon('check',12)}</span><span>المنجزة</span></label>
        <label class="pill-opt"><input type="checkbox" id="fs_notDone" checked><span class="dot">${icon('check',12)}</span><span>غير المنجزة</span></label>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" id="fs_go">عرض</button>
        <button class="icon-btn rect" id="fs_print" data-tip="طباعة" title="طباعة" aria-label="طباعة">${icon('printer',17)}</button>
        <button class="icon-btn rect" id="fs_pdf" data-tip="تنزيل PDF" title="تنزيل PDF" aria-label="تنزيل PDF">${icon('download',17)}</button>
        <button class="icon-btn rect" id="fs_excel" data-tip="تنزيل Excel" title="تنزيل Excel" aria-label="تنزيل Excel">${icon('sheet',17)}</button>
      </div>
      <div id="fs_result" style="margin-top:14px;"></div>
    </div>`;

    const COLS = ['مجال المبادرة','الأيام','الساعات','الفعاليات','المنفّذون','المستهدفون','الأماكن','أماكن التنفيذ الفعلية'];
    const FS_W = ['42mm','15mm','19mm','20mm','20mm','24mm','18mm','auto'];
    function gen(){
      const from=document.getElementById('fs_from').value, to=document.getElementById('fs_to').value;
      const wDone=document.getElementById('fs_done').checked;
      const wNot=document.getElementById('fs_notDone').checked;
      /* التقاطع مع الفترة حتى تُحتسب الفعاليات متعددة الأيام */
      const base = state.orders.filter(o=>{
        if(!isLiveOrder(o)) return false;
        const isDone = o.completionStatus==='تم';
        if(isDone && !wDone) return false;
        if(!isDone && !wNot) return false;
        const s=o.date||'', e=orderEnd(o);
        if(!s && !e) return false;
        if(from && e && e<from) return false;
        if(to && s && s>to) return false;
        return true;
      });
      const rows = (state.fields||[]).map(f=>{
        const list = base.filter(o=>o.fieldId===f.id);
        return {
          name: f.name,
          days: list.reduce((s,o)=>s+daysCount(o.date,o.dateTo),0),
          hours: Math.round(list.reduce((s,o)=>s+computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo),0)*10)/10,
          events: list.length,
          trainers: new Set(list.flatMap(o=>o.trainerIds||[])).size,
          people: list.reduce((s,o)=>s+(Number(o.participantsCount)||0),0),
          places: new Set(list.map(o=>o.schoolId).filter(Boolean)).size,
          venues: venuesSummary(list), venuesTxt: venuesSummaryText(list),
        };
      }).filter(r=>r.events>0).sort((a,b)=>b.events-a.events);
      const tot = {
        name:'الإجمالي',
        days: rows.reduce((s,r)=>s+r.days,0),
        hours: Math.round(rows.reduce((s,r)=>s+r.hours,0)*10)/10,
        events: rows.reduce((s,r)=>s+r.events,0),
        trainers: new Set(base.flatMap(o=>o.trainerIds||[])).size,
        people: rows.reduce((s,r)=>s+r.people,0),
        places: new Set(base.map(o=>o.schoolId).filter(Boolean)).size,
        venues: venuesSummary(base), venuesTxt: venuesSummaryText(base),
      };
      return {rows, tot, from, to};
    }
    const asArr = r => [r.name, r.days, r.hours, r.events, r.trainers, r.people, r.places, r.venuesTxt];
    /* نسخة HTML: آخر عمود شارات صفراء */
    const asHtml = r => [escapeHtml(String(r.name)), r.days, r.hours, r.events, r.trainers, r.people, r.places, r.venues].map(String);
    function tableHtml(rows, tot){
      if(!rows.length) return `<div class="empty-state">لا توجد فعاليات ضمن هذه الفترة</div>`;
      const body = rows.map(r=>({ cells:asHtml(r),
        tdAttr:{0:' style="text-align:right;font-weight:700;"'} }));
      body.push({ cells:asHtml(tot), rowAttr:' style="background:#FAF9F7;font-weight:700;"',
        tdAttr:{0:' style="text-align:right;"'} });
      /* بلا عرض صريح تسحق قاعدة :first-child العامة عمود «مجال المبادرة»
         إلى 34px فتُكسر «الإجمالي» في منتصفها — colgroup يغلب تلك القاعدة */
      return repTableHtml(COLS, body, {colWidths:FS_W});
    }
    document.getElementById('fs_go').onclick=()=>{
      const {rows,tot}=gen();
      const b=document.getElementById('fs_result');
      b.innerHTML = tableHtml(rows,tot); enhanceReportTable(b);
    };
    function printIt(){
      const {rows,tot,from,to}=gen();
      if(!rows.length){ toast('لا توجد بيانات ضمن هذه الفترة'); return; }
      doPrintDoc(buildReportDoc({
        titleAr:'تقرير مجال المبادرة',
        subtitle:`من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'}`,
        kpis:[
          {v:tot.events,l:'📋 الفعاليات'}, {v:tot.days,l:'🗓️ الأيام'},
          {v:tot.hours,l:'⏱️ الساعات'}, {v:tot.people,l:'👥 المستهدفون'},
        ],
        headers: COLS, colWidths: FS_W,
        rows: rows.map(r=>asHtml(r))
              .concat([asHtml(tot).map((v,i)=>i===7?v:`<b>${v}</b>`)])
      }), true, 'A4');
    }
    document.getElementById('fs_print').onclick=printIt;
    document.getElementById('fs_pdf').onclick=printIt;
    document.getElementById('fs_excel').onclick=()=>{
      const {rows,tot,from,to}=gen();
      if(!rows.length){ toast('لا توجد بيانات ضمن هذه الفترة'); return; }
      exportToExcel('تقرير_مجال_المبادرة.xlsx', COLS, rows.map(asArr).concat([asArr(tot)]),
        `تقرير مجال المبادرة (من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'})`);
    };
    ['fs_from','fs_to'].forEach(id=>document.getElementById(id).addEventListener('change',()=>document.getElementById('fs_go').click()));
    ['fs_done','fs_notDone'].forEach(id=>document.getElementById(id).addEventListener('change',()=>document.getElementById('fs_go').click()));
    document.getElementById('fs_go').click();
  }

  function drawByPath(){
    const box=document.getElementById('reportContent');
    box.innerHTML = `<div class="card"><h2>تقرير حسب مسار / مجال المبادرة</h2>
      <div class="grid">
        <div class="field"><label>من تاريخ</label><input id="bp_from" type="date" lang="en-GB" value="${acadYearRange(acadYearOf(todayStr())).start}"></div>
        <div class="field"><label>إلى تاريخ</label><input id="bp_to" type="date" lang="en-GB" value="${acadYearRange(acadYearOf(todayStr())).end}"></div>
      </div>
      <div class="bp-search">
        <span class="bp-sic">${icon('search',16)}</span>
        <input id="bp_q" list="bp_qList" autocomplete="off" placeholder="ابحث باسم المسار أو المجال أو عنوان المبادرة… (مثال: مواهب ومسابقات، التنمر)">
        <button type="button" class="bp-clear" id="bp_qClear" title="مسح البحث" aria-label="مسح البحث">${icon('x',14)}</button>
        <datalist id="bp_qList">
          ${state.programTypes.map(p=>`<option value="${escapeHtml(p.name)}">مسار</option>`).join('')}
          ${state.fields.map(f=>`<option value="${escapeHtml(f.name)}">مجال</option>`).join('')}
          ${Array.from(new Set(state.orders.map(o=>(o.title||'').trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'ar')).slice(0,400).map(t=>`<option value="${escapeHtml(t)}">عنوان</option>`).join('')}
        </datalist>
      </div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">
        <label class="checkbox-chip"><input type="checkbox" id="bp_doneOnly" checked> المنجزة فقط</label>
        <span class="helper" id="bp_qHint"></span>
      </div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px;">
        <label class="checkbox-chip"><input type="checkbox" id="bp_byPath" checked> مسار المبادرة</label>
        <label class="checkbox-chip"><input type="checkbox" id="bp_byField"> مجال المبادرة</label>
      </div>
      <div id="bp_modeWrap" style="display:none;margin-bottom:10px;">
        <div class="helper" style="margin-bottom:6px;">اخترت المسار والمجال معًا — كيف تريد عرض التقرير؟</div>
        <label class="checkbox-chip"><input type="radio" name="bp_mode" value="separate" checked> كل تصنيف في تقرير منفصل</label>
        <label class="checkbox-chip"><input type="radio" name="bp_mode" value="combined"> الكل في تقرير واحد (المسار والمجال كأعمدة)</label>
      </div>
      <button class="btn btn-primary" id="bp_go">عرض</button>
      <button class="icon-btn rect" id="bp_print" title="طباعة">🖨️ طباعة</button>
      <button class="icon-btn rect" id="bp_pdf" title="تنزيل PDF">📄 تنزيل PDF</button>
      <button class="btn btn-outline" id="bp_excel">📊 استخراج إكسل</button>
      <div id="bp_result" style="margin-top:16px;"></div>
    </div>`;
    function syncModeVisibility(){
      const both = document.getElementById('bp_byPath').checked && document.getElementById('bp_byField').checked;
      document.getElementById('bp_modeWrap').style.display = both ? 'block' : 'none';
    }
    document.getElementById('bp_byPath').addEventListener('change', syncModeVisibility);
    document.getElementById('bp_byField').addEventListener('change', syncModeVisibility);

    const baseCols = ['#','الفعالية','التاريخ','الوقت','المكان / هاتف المشرف','مقدم الفعالية'];
    function rowOf(o, extraCols){
      const school = state.schools.find(s=>s.id===o.schoolId);
      const supervisor = school ? school.supervisors.find(s=>s.id===o.supervisorId) : null;
      const done = o.completionStatus==='تم';
      const mark = done
        ? `<b class="bp-done" title="منجزة" style="color:#15803d;font-size:17px;font-weight:900;line-height:1;flex:none">✓</b>`
        : `<b class="bp-notdone" title="لم تنجز" style="color:#94a3b8;font-weight:700;letter-spacing:1px;line-height:1;flex:none">---</b>`;
      const trCell = `<span style="display:inline-flex;align-items:center;gap:8px;justify-content:center">${repTrainers(o)}${mark}</span>`;
      const base = [o.serial, o.title, repPeriodCell(o), fullTimeRange(o.timeFrom,o.timeTo), repPlacePhone(o), trCell];
      const extra = (extraCols||[]).map(c=>{
        if(c==='مسار المبادرة'){ const pt=state.programTypes.find(p=>p.id===o.programTypeId); return pt?pt.name:''; }
        if(c==='مجال المبادرة'){ const f=state.fields.find(x=>x.id===o.fieldId); return f?f.name:''; }
        return '';
      });
      return [...base, ...extra];
    }
    function gen(){
      const from=document.getElementById('bp_from').value, to=document.getElementById('bp_to').value;
      const byPath = document.getElementById('bp_byPath').checked;
      const byField = document.getElementById('bp_byField').checked;
      const mode = document.querySelector('input[name="bp_mode"]:checked')?.value || 'separate';
      const doneOnly = document.getElementById('bp_doneOnly').checked;
      const q = _pnz((document.getElementById('bp_q').value||'').trim()).replace(/\s+/g,' ');
      const nm = (arr,id)=>{ const x=(arr||[]).find(y=>y.id===id); return x?x.name:''; };
      const baseList = state.orders.filter(o=>(doneOnly ? o.completionStatus==='تم' : isLiveOrder(o)) && (!from||o.date>=from) && (!to||o.date<=to)
        && (!q || [o.title, nm(state.programTypes,o.programTypeId), nm(state.fields,o.fieldId)].some(t=>_pnz(t||'').replace(/\s+/g,' ').includes(q))));

      if(byPath && byField && mode==='combined'){
        return { mode:'combined', columns:[...baseCols,'مسار المبادرة','مجال المبادرة'], list: baseList.sort((a,b)=>(a.date||'').localeCompare(b.date||'')) };
      }
      // منفصل: نجمّع حسب المسار و/أو المجال كأقسام مستقلة
      let groups = [];
      if(byPath){
        groups = groups.concat(state.programTypes.map(pt=>({
          label:'مسار: '+pt.name,
          list: baseList.filter(o=>o.programTypeId===pt.id).sort((a,b)=>(a.date||'').localeCompare(b.date||''))
        })));
      }
      if(byField){
        groups = groups.concat(state.fields.map(f=>({
          label:'مجال: '+f.name,
          list: baseList.filter(o=>o.fieldId===f.id).sort((a,b)=>(a.date||'').localeCompare(b.date||''))
        })));
      }
      groups = groups.filter(g=>g.list.length>0).sort((a,b)=>b.list.length-a.list.length);
      return { mode:'separate', columns:baseCols, groups };
    }
    { const qi = document.getElementById('bp_q');
      const run = ()=>document.getElementById('bp_go').click();
      qi.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); run(); } });
      qi.addEventListener('change', run);
      qi.addEventListener('input', ()=>{ clearTimeout(qi.__t); qi.__t = setTimeout(run, 450); });
      document.getElementById('bp_qClear').onclick = ()=>{ qi.value=''; run(); qi.focus(); };
      ['bp_from','bp_to','bp_doneOnly','bp_byPath','bp_byField'].forEach(id=>document.getElementById(id).addEventListener('change', run));
      document.querySelectorAll('input[name="bp_mode"]').forEach(r=>r.addEventListener('change', run)); }
    document.getElementById('bp_go').onclick=()=>{
      const data = gen();
      const box = document.getElementById('bp_result');
      { const qv = (document.getElementById('bp_q').value||'').trim();
        const n = data.mode==='combined' ? data.list.length : new Set(data.groups.flatMap(g=>g.list.map(o=>o.id))).size;
        document.getElementById('bp_qHint').innerHTML = qv ? `نتائج البحث عن «${escapeHtml(qv)}»: <b>${n}</b> ${eventWord(n)}` : `${n} ${eventWord(n)} في الفترة`; }
      if(data.mode==='combined'){
        box.innerHTML = data.list.length ? `<table style="text-align:center;"><thead><tr>${data.columns.map(c=>`<th>${cellHtml(c)}</th>`).join('')}</tr></thead><tbody>
          ${data.list.map(o=>`<tr>${rowOf(o,['مسار المبادرة','مجال المبادرة']).map(v=>`<td>${cellHtml(v)}</td>`).join('')}</tr>`).join('')}
        </tbody></table>` : `<div class="empty-state">لا توجد فعاليات مطابقة ضمن هذه الفترة</div>`;
      } else {
        box.innerHTML = data.groups.length ? data.groups.map(g=>`
          <h3 style="font-family:var(--font-head);color:var(--maroon-800);margin:14px 0 8px;">${escapeHtml(g.label)} <span class="badge">${g.list.length} ${eventWord(g.list.length)}</span></h3>
          <table style="text-align:center;"><thead><tr>${data.columns.map(c=>`<th>${cellHtml(c)}</th>`).join('')}</tr></thead><tbody>
            ${g.list.map(o=>`<tr>${rowOf(o).map(v=>`<td>${cellHtml(v)}</td>`).join('')}</tr>`).join('')}
          </tbody></table>`).join('') : `<div class="empty-state">لا توجد فعاليات مطابقة ضمن هذه الفترة</div>`;
      }
      enhanceReportTable(box);
    };
    document.getElementById('bp_excel').onclick=()=>{
      const data = gen();
      const from=document.getElementById('bp_from').value, to=document.getElementById('bp_to').value;
      if(data.mode==='combined'){
        if(!data.list.length){ toast('لا توجد بيانات لتصديرها'); return; }
        exportToExcel('تقرير_حسب_المسار_والمجال.xlsx', data.columns, data.list.map(o=>rowOf(o,['مسار المبادرة','مجال المبادرة'])), `تقرير حسب المسار والمجال (من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'})`);
      } else {
        if(!data.groups.length){ toast('لا توجد بيانات لتصديرها'); return; }
        const qv = (document.getElementById('bp_q').value||'').trim();
        const sheets = data.groups.map(g=>({name:g.label.replace(/[\\\/\?\*\[\]:]/g,' ').slice(0,30), headers:data.columns, rows:g.list.map(o=>rowOf(o))}));
        exportToExcelMultiSheet('تقرير_حسب_مسار_المبادرة.xlsx', sheets, `تقرير حسب مسار/مجال المبادرة (من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'})${qv?` — البحث: ${qv}`:''}`);
      }
    };
    function printIt(){
      const data = gen();
      const from=document.getElementById('bp_from').value, to=document.getElementById('bp_to').value;
      const dateBox = `<div style="text-align:center;margin-bottom:5mm;font-size:11pt;font-weight:700;">
        من <span style="display:inline-block;border:1.5px solid ${PRINT_LINE_COLOR};border-radius:6px;padding:1.5mm 6mm;margin:0 3mm;font-weight:700;">${from?fmtDate(from):'—'}</span>
        إلى <span style="display:inline-block;border:1.5px solid ${PRINT_LINE_COLOR};border-radius:6px;padding:1.5mm 6mm;margin:0 3mm;font-weight:700;">${to?fmtDate(to):'—'}</span>
      </div>`;
      let bodyHtml, totalEvents;
      if(data.mode==='combined'){
        totalEvents = data.list.length;
        bodyHtml = `<table style="text-align:center;"><thead><tr>${data.columns.map(c=>`<th>${cellHtml(c)}</th>`).join('')}</tr></thead><tbody>
          ${data.list.map(o=>`<tr>${rowOf(o,['مسار المبادرة','مجال المبادرة']).map(v=>`<td>${cellHtml(v)}</td>`).join('')}</tr>`).join('')}
        </tbody></table>`;
      } else {
        totalEvents = data.groups.reduce((s,g)=>s+g.list.length,0);
        bodyHtml = data.groups.map(g=>`
          <div class="sec-t">${escapeHtml(g.label)} (${g.list.length} ${eventWord(g.list.length)})</div>
          <table style="text-align:center;"><thead><tr>${data.columns.map(c=>`<th>${cellHtml(c)}</th>`).join('')}</tr></thead><tbody>
            ${g.list.map(o=>`<tr>${rowOf(o).map(v=>`<td>${cellHtml(v)}</td>`).join('')}</tr>`).join('')}
          </tbody></table>`).join('');
      }
      const qv = (document.getElementById('bp_q').value||'').trim();
      const doneOnly = document.getElementById('bp_doneOnly').checked;
      doPrintDoc(buildReportDoc({
        titleAr:'تقرير حسب مسار / مجال المبادرة',
        subtitle: qv ? `نتائج البحث عن: «${qv}»` : '',
        kpis:[{v:totalEvents,l:doneOnly?'عدد الفعاليات المنجزة':'عدد الفعاليات'}],
        extraHtml: dateBox + bodyHtml
      }), true, 'A4');
    }
    document.getElementById('bp_print').onclick=printIt;
    document.getElementById('bp_pdf').onclick=printIt;
  }

  function drawGeneral(){
    const box=document.getElementById('reportContent');
    box.innerHTML = `<div class="card"><h2>تقرير عام</h2>
      <div class="grid">
        <div class="field"><label>البيانات</label><select id="gn_type">
          <option value="orders">كل طلبات الفعاليات والمبادرات</option>
          <option value="schools">المدارس</option>
          <option value="trainers">مقدمو الفعاليات</option>
          <option value="tasks">المهام</option>
        </select></div>
        <div class="field"><label>من تاريخ</label><input id="gn_from" type="date" lang="en-GB"></div>
        <div class="field"><label>إلى تاريخ</label><input id="gn_to" type="date" lang="en-GB"></div>
      </div>
      <button class="btn btn-primary" id="gn_go">عرض</button>
      <button class="icon-btn rect" id="gn_print" title="طباعة">🖨️ طباعة</button>
      <button class="icon-btn rect" id="gn_pdf" title="تنزيل PDF">📄 تنزيل PDF</button>
      <button class="btn btn-outline" id="gn_excel">📊 استخراج إكسل</button>
      <div id="gn_result" style="margin-top:16px;"></div>
    </div>`;
    function gen(){
      const type=document.getElementById('gn_type').value, from=document.getElementById('gn_from').value, to=document.getElementById('gn_to').value;
      if(type==='orders'){
        const list = state.orders.filter(o=>isLiveOrder(o)&&(!from||o.date>=from)&&(!to||o.date<=to));
        return {headers:['م','العنوان','التاريخ (من — إلى)','المدرسة','مقدم المبادرة','الإنجاز'],
          rows:list.map(o=>{const s=state.schools.find(x=>x.id===o.schoolId); return [o.serial, o.title, dateRangeStr(o), s?s.name:'', trainerNames(o), o.completionStatus||'لم تنجز'];})};
      }
      if(type==='schools'){
        return {headers:['اسم المدرسة','المرحلة','عدد المشرفين'], rows:state.schools.map(s=>[s.name, s.level, s.supervisors.length])};
      }
      if(type==='trainers'){
        return {headers:['الاسم','الجوال','عدد الفعاليات'], rows:state.trainers.map(t=>[t.name, t.phone||'', state.orders.filter(o=>isLiveOrder(o)&&(o.trainerIds||[]).includes(t.id)).length])};
      }
      const list = state.tasks.filter(t=>(!from||(t.due&&t.due>=from))&&(!to||(t.due&&t.due<=to)));
      return {headers:['المهمة','البدء','الاستحقاق','الأولوية','الحالة'], rows:list.map(t=>[t.title, t.start||'', t.due||'', t.priority||'', t.status||''])};
    }
    function tableOf(headers, rows){
      return repTableHtml(headers, rows.map(r=>r.map(c=>escapeHtml(String(c)))));
    }
    document.getElementById('gn_go').onclick=()=>{ const {headers,rows}=gen(); const box=document.getElementById('gn_result'); box.innerHTML = tableOf(headers,rows); enhanceReportTable(box); };
    document.getElementById('gn_print').onclick=()=>{
      const {headers,rows}=gen(); const from=document.getElementById('gn_from').value, to=document.getElementById('gn_to').value;
      doPrintDoc(buildReportDoc({titleAr:'تقرير عام', subtitle:`من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'}`, headers, rows:rows.map(r=>r.map(escapeHtml))}), true, 'A4');
    };
    document.getElementById('gn_pdf').onclick=()=>document.getElementById('gn_print').onclick();
    document.getElementById('gn_excel').onclick=()=>{ const {headers,rows}=gen(); exportToExcel('تقرير_عام.xlsx', headers, rows, 'تقرير عام'); };
  }

  function drawEval(){
    const box=document.getElementById('reportContent');
    box.innerHTML = `<div class="card"><h2>النتائج والإنجازات</h2>
      <div class="grid"><div class="field"><label>من تاريخ</label><input id="ev_from" type="date" lang="en-GB"></div><div class="field"><label>إلى تاريخ</label><input id="ev_to" type="date" lang="en-GB"></div></div>
      <button class="btn btn-primary" id="ev_go">عرض</button>
      <button class="icon-btn rect" id="ev_print" title="طباعة">🖨️ طباعة</button>
      <button class="icon-btn rect" id="ev_pdf" title="تنزيل PDF">📄 تنزيل PDF</button>
      <button class="btn btn-outline" id="ev_excel">📊 تنزيل Excel</button>
      <div id="ev_result" style="margin-top:16px;"></div>
    </div>`;
    function gen(){
      const from=document.getElementById('ev_from').value, to=document.getElementById('ev_to').value;
      const today=todayStr();
      const executed = state.orders.filter(o=>isLiveOrder(o) && o.date && o.date<today && (!from||o.date>=from) && (!to||o.date<=to));
      const evaluated = executed.filter(o=>o.completionStatus);
      const notEvaluated = executed.filter(o=>!o.completionStatus);
      return {evaluated, notEvaluated, from, to};
    }
    const headers = ['أمر التكليف','عنوان الفعالية','التاريخ (من — إلى)','الوقت','المكان','مقدم المبادرة','رقم الهاتف','الإنجاز'];
    function rowOf(o){
      const school = state.schools.find(s=>s.id===o.schoolId);
      return [o.serial, escapeHtml(o.title), dateRangeStr(o), escapeHtml(fullTimeRange(o.timeFrom,o.timeTo)), (school?escapeHtml(school.name):'') + venueBadge(o), escapeHtml(trainerNames(o))||'—', escapeHtml(trainerPhones(o)), o.completionStatus||'لم تنجز'];
    }
    function tableOf(list){
      return repTableHtml(headers, list.map(o=>rowOf(o)));
    }
    document.getElementById('ev_go').onclick=()=>{
      const {evaluated, notEvaluated} = gen();
      const box = document.getElementById('ev_result');
      box.innerHTML = `
        <h3 style="font-family:var(--font-head);color:var(--maroon-800);margin-bottom:8px;">✅ فعاليات مقيَّمة (${evaluated.length})</h3>
        ${tableOf(evaluated)}
        <div class="divider"></div>
        <h3 style="font-family:var(--font-head);color:var(--maroon-800);margin-bottom:8px;">⏳ فعاليات غير مقيَّمة (${notEvaluated.length})</h3>
        ${tableOf(notEvaluated)}`;
      enhanceReportTable(box);
    };
    document.getElementById('ev_excel').onclick=()=>{
      const {evaluated, notEvaluated, from, to} = gen();
      exportToExcelMultiSheet('النتائج_والإنجازات.xlsx', [
        {name:'مقيَّمة', headers, rows:evaluated.map(rowOf)},
        {name:'غير مقيَّمة', headers, rows:notEvaluated.map(rowOf)},
      ], `النتائج والإنجازات (من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'})`);
    };
    document.getElementById('ev_print').onclick=()=>{
      const {evaluated, notEvaluated, from, to} = gen();
      doPrintDoc(buildReportDoc({
        titleAr:'النتائج والإنجازات', subtitle:`من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'}`,
        kpis:[{v:evaluated.length,l:'فعاليات مقيَّمة'},{v:notEvaluated.length,l:'بانتظار التقييم'}],
        headers,
        rows:evaluated.map(rowOf),
        extraHtml:`<div class="sec-t">فعاليات غير مقيَّمة</div>`
          + repTableHtml(headers, notEvaluated.map(o=>rowOf(o)))
      }), true, 'A4');
    };
    document.getElementById('ev_pdf').onclick=()=>document.getElementById('ev_print').onclick();
  }

  function drawTrainer(){
    const box=document.getElementById('reportContent');
    const tCounts = {};
    (state.orders||[]).filter(isLiveOrder).forEach(o=>(o.trainerIds||[]).forEach(id=>{ tCounts[id]=(tCounts[id]||0)+1; }));
    box.innerHTML = `<div class="split-rep">
      <aside class="sp-side">
        <div class="sp-head">مقدمو الفعاليات</div>
        <input id="rp_tSearch" placeholder="🔎 بحث..." style="width:100%;margin-bottom:8px;">
        <label class="sp-all"><input type="checkbox" id="rp_trainerAll"> تحديد الكل</label>
        <div id="rp_trainerChecks" class="sp-list">
          ${state.trainers.map(t=>`<label class="sp-row" data-name="${escapeHtml(t.name)}">
            <input type="checkbox" class="rp_trainerChk" value="${t.id}">
            <span class="sp-nm">${escapeHtml(t.name)}</span>
            <span class="sp-ct">${tCounts[t.id]||0}</span>
          </label>`).join('') || '<span class="helper">لا يوجد مقدمو فعاليات</span>'}
        </div>
      </aside>
      <section class="sp-main">
        <div class="card" style="margin-bottom:12px;">
          <h2>تقرير مقدم الفعالية</h2>
          <div class="rp-dates" style="margin-bottom:12px;">
            <div class="rp-date"><label>من تاريخ</label><input id="rp_from" type="date" lang="en-GB"></div>
            <div class="rp-date"><label>إلى تاريخ</label><input id="rp_to" type="date" lang="en-GB"></div>
          </div>
          <div style="font-size:13px;font-weight:700;color:var(--maroon-800);margin-bottom:6px;">نوع البيانات المطلوبة</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
            <label class="sp-mode"><input type="checkbox" class="rp_modeChk" value="events" checked> الفعاليات</label>
            <label class="sp-mode"><input type="checkbox" class="rp_modeChk" value="hours"> الفعاليات والساعات</label>
            <label class="sp-mode"><input type="checkbox" class="rp_modeChk" value="eval"> التقييمات</label>
            <label class="sp-mode" style="border:none;background:transparent;"><input type="checkbox" id="rp_modeAll"> الكل</label>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary" id="rp_go">عرض</button>
            <button class="icon-btn rect" id="rp_print" data-tip="طباعة" title="طباعة" aria-label="طباعة">${icon('printer',17)}</button>
            <button class="icon-btn rect" id="rp_pdf" data-tip="تنزيل PDF" title="تنزيل PDF" aria-label="تنزيل PDF">${icon('download',17)}</button>
            <button class="icon-btn rect" id="rp_excel" data-tip="تنزيل Excel" title="تنزيل Excel" aria-label="تنزيل Excel">${icon('sheet',17)}</button>
          </div>
        </div>
        <div id="rp_result"></div>
      </section>
    </div>`;
    document.getElementById('rp_tSearch').addEventListener('input', e=>{
      const q=e.target.value.trim();
      box.querySelectorAll('.sp-row').forEach(r=>{ r.style.display = !q || r.dataset.name.includes(q) ? '' : 'none'; });
    });
    /* النقر على أي مقدّم يعرض تقريره فورًا */
    box.querySelectorAll('.rp_trainerChk').forEach(cb=>{
      cb.addEventListener('change', ()=>{
        cb.closest('.sp-row').classList.toggle('on', cb.checked);
        document.getElementById('rp_go').click();
      });
    });
    document.getElementById('rp_trainerAll').addEventListener('change', (e)=>{
      document.querySelectorAll('.rp_trainerChk').forEach(cb=>{
        if(cb.closest('.sp-row').style.display==='none') return;   // يحترم نتيجة البحث
        cb.checked=e.target.checked;
        cb.closest('.sp-row').classList.toggle('on', cb.checked);
      });
      document.getElementById('rp_go').click();
    });
    document.getElementById('rp_modeAll').addEventListener('change', (e)=>{
      document.querySelectorAll('.rp_modeChk').forEach(cb=>cb.checked=e.target.checked);
      document.getElementById('rp_go').click();
    });
    ['rp_from','rp_to'].forEach(id=>document.getElementById(id).addEventListener('change', ()=>document.getElementById('rp_go').click()));
    document.querySelectorAll('.rp_modeChk').forEach(cb=>cb.addEventListener('change', ()=>document.getElementById('rp_go').click()));
    function selectedTrainerIds(){ return Array.from(document.querySelectorAll('.rp_trainerChk:checked')).map(cb=>cb.value); }
    function selectedModes(){ return Array.from(document.querySelectorAll('.rp_modeChk:checked')).map(cb=>cb.value); }
    function columnsFor(modes){
      // الأعمدة الأساسية موجودة دائمًا، ثم تُضاف أعمدة إضافية حسب الأنماط المختارة
      const base = ['#','الفعالية','التاريخ','الوقت','المكان / هاتف المشرف','مقدم الفعالية'];
      const extra = [];
      if(modes.includes('hours')) extra.push('المدة','عدد الساعات');
      if(modes.includes('eval')) extra.push('تقييم المشرف','تقييم المدرسة','تقييم الطلاب');
      return [...base, ...extra];
    }
    function rowOf(o, columns){
      const school = state.schools.find(s=>s.id===o.schoolId);
      const supervisor = school ? school.supervisors.find(s=>s.id===o.supervisorId) : null;
      const map = {
        '#': o.serial,
        'الفعالية': o.title,
        'التاريخ': repPeriodCell(o),
        'الوقت': fullTimeRange(o.timeFrom,o.timeTo),
        'المكان / هاتف المشرف': repPlacePhone(o),
        'مقدم الفعالية': repTrainers(o),
        'المدة': daysCount(o.date,o.dateTo),
        'عدد الأيام': daysCount(o.date,o.dateTo),
        'عدد الساعات': computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo),
        'الإنجاز': o.completionStatus||'لم تنجز',
        'تقييم المشرف': o.supervisorRating||'',
        'تقييم المدرسة': o.schoolRating||'',
        'تقييم الطلاب': o.studentsRating||'',
      };
      return columns.map(c=>map[c]);
    }
    function gen(){
      const from=document.getElementById('rp_from').value, to=document.getElementById('rp_to').value;
      const tIds = selectedTrainerIds();
      const modes = selectedModes().length?selectedModes():['events'];
      const columns = columnsFor(modes);
      const groups = (tIds.length?tIds:state.trainers.map(t=>t.id)).map(tId=>{
        const trainer = state.trainers.find(t=>t.id===tId);
        const list = state.orders.filter(o=>isLiveOrder(o) && (o.trainerIds||[]).includes(tId) && (!from||o.date>=from) && (!to||o.date<=to)).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
        return {trainer, list};
      }).filter(g=>g.list.length>0 && g.trainer);
      return {groups, columns, from, to};
    }
    document.getElementById('rp_go').onclick=()=>{
      const {groups, columns} = gen();
      const box = document.getElementById('rp_result');
      box.innerHTML = groups.length ? groups.map(({trainer,list})=>`
        <h3 style="font-family:var(--font-head);color:var(--maroon-800);margin:14px 0 8px;">${escapeHtml(trainer.name)} <span class="badge">${list.length} ${eventWord(list.length)}</span></h3>
        ${repTableHtml(columns.map(cellHtml), list.map(o=>rowOf(o,columns).map(cellHtml)))}
        `).join('') : `<div class="empty-state">لا توجد فعاليات ضمن هذا الاختيار</div>`;
      enhanceReportTable(box);
    };
    document.getElementById('rp_excel').onclick=()=>{
      const {groups, columns, from, to} = gen();
      if(!groups.length){ toast('لا توجد بيانات لتصديرها'); return; }
      const sheets = groups.map(({trainer,list})=>({name:trainer.name.slice(0,30), headers:columns, rows:list.map(o=>rowOf(o,columns))}));
      exportToExcelMultiSheet('تقرير_مقدم_فعالية.xlsx', sheets, `تقرير مقدم فعالية (من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'})`);
    };
    function printIt(){
      const {groups, columns, from, to} = gen();
      const extraHtml = groups.map(({trainer,list})=>`
        <div class="sec-t">${escapeHtml(trainer.name)} (${list.length} ${eventWord(list.length)})</div>
        ${repTableHtml(columns.map(cellHtml), list.map(o=>rowOf(o,columns).map(cellHtml)))}
        `).join('');
      doPrintDoc(buildReportDoc({
        titleAr:'تقرير مقدم فعالية', subtitle:`من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'}`,
        kpis:(function(){
          const all = groups.flatMap(g=>g.list);
          return [
            {v:all.length, l:'📋 إجمالي الفعاليات'},
            (function(){ const d=all.reduce((s,o)=>s+daysCount(o.date,o.dateTo),0); return {v:d, l:'🗓️ المدة ('+dayWord(d)+')'}; })(),
            {v:Math.round(all.reduce((s,o)=>s+computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo),0)*10)/10, l:'⏱️ عدد الساعات'},
            {v:all.reduce((s,o)=>s+(Number(o.participantsCount)||0),0), l:'👥 المستهدفون'},
          ];
        })(),
        extraHtml
      }), true, 'A4');
    }
    document.getElementById('rp_print').onclick=printIt;
    document.getElementById('rp_pdf').onclick=printIt;
  }
  function drawSchool(){
    const box=document.getElementById('reportContent');
    const sCounts = {};
    (state.orders||[]).filter(isLiveOrder).forEach(o=>{ if(o.schoolId) sCounts[o.schoolId]=(sCounts[o.schoolId]||0)+1; });
    box.innerHTML = `<div class="split-rep">
      <aside class="sp-side">
        <div class="sp-head">المدارس والجهات</div>
        <input id="rp_schoolSearch" placeholder="🔎 بحث..." style="width:100%;margin-bottom:8px;">
        <label class="sp-all"><input type="checkbox" id="rp_schoolAll"> تحديد الكل</label>
        <div id="rp_schoolChecks" class="sp-list">
          ${state.schools.map(s=>`<label class="sp-row rp_schoolRow" data-name="${escapeHtml(s.name)}">
            <input type="checkbox" class="rp_schoolChk" value="${s.id}">
            <span class="sp-nm">${escapeHtml(s.name)}</span>
            <span class="sp-ct">${sCounts[s.id]||0}</span>
          </label>`).join('') || '<span class="helper">لا توجد مدارس</span>'}
        </div>
      </aside>
      <section class="sp-main">
        <div class="card" style="margin-bottom:12px;">
          <h2>تقرير فعاليات مدرسة خلال فترة</h2>
          <div class="rp-dates" style="margin-bottom:12px;">
            <div class="rp-date"><label>من تاريخ</label><input id="rp_from2" type="date" lang="en-GB"></div>
            <div class="rp-date"><label>إلى تاريخ</label><input id="rp_to2" type="date" lang="en-GB"></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary" id="rp_go2">عرض</button>
            <button class="icon-btn rect" id="rp_print2" data-tip="طباعة" title="طباعة" aria-label="طباعة">${icon('printer',17)}</button>
            <button class="icon-btn rect" id="rp_pdf2" data-tip="تنزيل PDF" title="تنزيل PDF" aria-label="تنزيل PDF">${icon('download',17)}</button>
            <button class="icon-btn rect" id="rp_excel2" data-tip="تنزيل Excel" title="تنزيل Excel" aria-label="تنزيل Excel">${icon('sheet',17)}</button>
          </div>
        </div>
        <div id="rp_result2"></div>
      </section>
    </div>`;
    box.querySelectorAll('.rp_schoolChk').forEach(cb=>{
      cb.addEventListener('change', ()=>{
        cb.closest('.sp-row').classList.toggle('on', cb.checked);
        document.getElementById('rp_go2').click();
      });
    });
    ['rp_from2','rp_to2'].forEach(id=>document.getElementById(id).addEventListener('change', ()=>document.getElementById('rp_go2').click()));
    document.getElementById('rp_schoolAll').addEventListener('change', (e)=>{
      document.querySelectorAll('.rp_schoolChk').forEach(cb=>{
        if(cb.closest('.rp_schoolRow').style.display==='none') return;
        cb.checked=e.target.checked;
        cb.closest('.sp-row').classList.toggle('on', cb.checked);
      });
      document.getElementById('rp_go2').click();
    });
    document.getElementById('rp_schoolSearch').addEventListener('input', (e)=>{
      const q = e.target.value.trim();
      document.querySelectorAll('.rp_schoolRow').forEach(row=>{
        row.style.display = !q || row.dataset.name.includes(q) ? '' : 'none';
      });
    });
    // حُذف عمود "المكان" (اسم المدرسة مذكور في عنوان كل قسم)، والتاريخ صار عمودين
    // عمود واحد للفترة بدل عمودين — يوفّر مساحة لبقية البيانات
    /* اسم المشرف بجوار اسم المدرسة في العنوان — فاستُبعد عمود المكان/الهاتف */
    const columns = ['#','الفعالية','التاريخ','الوقت','مقدم الفعالية'];
    function rowOf(o){
      return [o.serial, titleWithVenue(o), repPeriodCell(o), fullTimeRange(o.timeFrom,o.timeTo), repTrainers(o)];
    }
    /* مشرفو المدرسة المرتبطون بفعاليات الفترة */
    function supsOf(school, list){
      const ids = [...new Set(list.map(o=>o.supervisorId).filter(Boolean))];
      const names = ids.map(id=>{
        const s = (school.supervisors||[]).find(x=>x.id===id);
        return s ? (s.phone ? `${s.name} — ${s.phone}` : s.name) : '';
      }).filter(Boolean);
      return names.join(' · ');
    }
    function gen(){
      const from=document.getElementById('rp_from2').value, to=document.getElementById('rp_to2').value;
      const sIds = Array.from(document.querySelectorAll('.rp_schoolChk:checked')).map(cb=>cb.value);
      const groups = (sIds.length?sIds:state.schools.map(s=>s.id)).map(sId=>{
        const school = state.schools.find(s=>s.id===sId);
        const list = state.orders.filter(o=>isLiveOrder(o) && o.schoolId===sId && (!from||o.date>=from) && (!to||o.date<=to)).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
        return {school, list};
      }).filter(g=>g.list.length>0 && g.school);
      return {groups, from, to};
    }
    document.getElementById('rp_go2').onclick=()=>{
      const {groups} = gen();
      const box = document.getElementById('rp_result2');
      box.innerHTML = groups.length ? groups.map(({school,list})=>`
        <h3 style="font-family:var(--font-head);color:var(--maroon-800);margin:14px 0 8px;">
          ${escapeHtml(school.name)} <span class="badge">${list.length} ${eventWord(list.length)}</span>
          ${supsOf(school,list)?`<span class="sup-inline">${icon('users',13)} ${escapeHtml(supsOf(school,list))}</span>`:''}
        </h3>
        ${repTableHtml(columns.map(cellHtml), list.map(o=>rowOf(o).map(cellHtml)))}
        `).join('') : `<div class="empty-state">لا توجد فعاليات ضمن هذا الاختيار</div>`;
      enhanceReportTable(box);
    };
    document.getElementById('rp_excel2').onclick=()=>{
      const {groups, from, to} = gen();
      if(!groups.length){ toast('لا توجد بيانات لتصديرها'); return; }
      const sheets = groups.map(({school,list})=>({name:school.name.slice(0,30), headers:columns, rows:list.map(rowOf), note: supsOf(school,list)?('المشرف: '+supsOf(school,list)):''}));
      exportToExcelMultiSheet('تقرير_فعاليات_مدرسة.xlsx', sheets, `تقرير فعاليات مدرسة خلال فترة (من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'})`);
    };
    function printIt(){
      const {groups, from, to} = gen();
      const extraHtml = groups.map(({school,list})=>`
        <div class="sec-t">${escapeHtml(school.name)} (${list.length} ${eventWord(list.length)})${
          supsOf(school,list)?` — المشرف: ${escapeHtml(supsOf(school,list))}`:''}</div>
        ${repTableHtml(columns.map(cellHtml), list.map(o=>rowOf(o).map(cellHtml)))}
        `).join('');
      doPrintDoc(buildReportDoc({
        titleAr:'تقرير فعاليات مدرسة خلال فترة', subtitle:`من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'}`,
        tableClass:'sch-tbl',
        kpis:(function(){
          const all = groups.flatMap(g=>g.list);
          return [
            {v:all.length, l:'📋 إجمالي الفعاليات'},
            (function(){ const d=all.reduce((s,o)=>s+daysCount(o.date,o.dateTo),0); return {v:d, l:'🗓️ المدة ('+dayWord(d)+')'}; })(),
            {v:Math.round(all.reduce((s,o)=>s+computeHours(o.timeFrom,o.timeTo,o.date,o.dateTo),0)*10)/10, l:'⏱️ عدد الساعات'},
            {v:all.reduce((s,o)=>s+(Number(o.participantsCount)||0),0), l:'👥 المستهدفون'},
          ];
        })(),
        extraHtml
      }), true, 'A4');
    }
    document.getElementById('rp_print2').onclick=printIt;
    document.getElementById('rp_pdf2').onclick=printIt;
  }
  function drawHours(){
    const box=document.getElementById('reportContent');
    box.innerHTML = `<div class="card"><h2>تقرير ساعات مقدمي الفعالية</h2>
      <div class="grid">
        <div class="field"><label>مقدم الفعالية</label><select id="hr_trainer">${state.trainers.map(t=>`<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('')}</select></div>
        <div class="field"><label>من تاريخ</label><input id="hr_from" type="date" lang="en-GB"></div>
        <div class="field"><label>إلى تاريخ</label><input id="hr_to" type="date" lang="en-GB"></div>
      </div>
      <button class="btn btn-primary" id="hr_go">احتساب الساعات</button>
      <button class="icon-btn rect" id="hr_print" title="طباعة">🖨️ طباعة</button>
      <button class="icon-btn rect" id="hr_pdf" title="تنزيل PDF">📄 تنزيل PDF</button>
      <button class="btn btn-outline" id="hr_excel">📊 تنزيل Excel</button>
      <div id="hr_result" style="margin-top:16px;"></div>
    </div>`;
    function gen(){
      const tId=document.getElementById('hr_trainer').value;
      const from=document.getElementById('hr_from').value, to=document.getElementById('hr_to').value;
      const list = state.orders.filter(o=>isLiveOrder(o) && (o.trainerIds||[]).includes(tId) && (!from||o.date>=from) && (!to||o.date<=to)).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
      let totalHours=0;
      const rows = list.map(o=>{ let hrs=0; if(o.timeFrom && o.timeTo){ const s=parseDT(o.date,o.timeFrom), e=parseDT(o.date,o.timeTo); hrs = Math.max(0,(e-s)/3600000)*daysCount(o.date,o.dateTo); } totalHours+=hrs; return {o,hrs}; });
      const trainer=state.trainers.find(t=>t.id===tId);
      const table = `<table class="print-table"><thead><tr><th>م</th><th>عنوان الفعالية</th><th>التاريخ</th><th>الوقت</th><th>عدد الساعات</th></tr></thead><tbody>
        ${rows.map(r=>`<tr><td>${r.o.serial}</td><td>${escapeHtml(r.o.title)}</td><td>${fmtDate(r.o.date)}</td><td>${r.o.timeFrom||''}-${r.o.timeTo||''}</td><td>${r.hrs.toFixed(1)}</td></tr>`).join('') || '<tr><td colspan="5" class="empty-state">لا توجد بيانات</td></tr>'}
        </tbody></table><div style="margin-top:10px;font-weight:700;color:var(--maroon-800);">إجمالي الساعات: ${totalHours.toFixed(1)} ساعة</div>`;
      return {table, title:`تقرير ساعات مقدم الفعالية: ${trainer?trainer.name:''}`, from, to};
    }
    document.getElementById('hr_go').onclick=()=>{ const box=document.getElementById('hr_result'); box.innerHTML = gen().table; enhanceReportTable(box); };
    document.getElementById('hr_excel').onclick=()=>{
      const tId=document.getElementById('hr_trainer').value;
      const from=document.getElementById('hr_from').value, to=document.getElementById('hr_to').value;
      const list = state.orders.filter(o=>isLiveOrder(o) && (o.trainerIds||[]).includes(tId) && (!from||o.date>=from) && (!to||o.date<=to)).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
      const trainer=state.trainers.find(t=>t.id===tId);
      let totalHours=0;
      const rows = list.map(o=>{ let hrs=0; if(o.timeFrom && o.timeTo){ const s=parseDT(o.date,o.timeFrom), e=parseDT(o.date,o.timeTo); hrs=Math.max(0,(e-s)/3600000)*daysCount(o.date,o.dateTo); } totalHours+=hrs; return [o.serial, o.title, dateRangeStr(o), fullTimeRange(o.timeFrom,o.timeTo), hrs.toFixed(1)]; });
      rows.push(['', '', '', 'الإجمالي', totalHours.toFixed(1)]);
      exportToExcel('تقرير_ساعات.xlsx', ['م','عنوان الفعالية','التاريخ (من — إلى)','الوقت','عدد الساعات'], rows, `تقرير ساعات مقدم الفعالية: ${trainer?trainer.name:''} (من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'})`);
    };
    document.getElementById('hr_print').onclick=()=>{
      const tId=document.getElementById('hr_trainer').value;
      const from=document.getElementById('hr_from').value, to=document.getElementById('hr_to').value;
      const list = state.orders.filter(o=>isLiveOrder(o) && (o.trainerIds||[]).includes(tId) && (!from||o.date>=from) && (!to||o.date<=to)).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
      const trainer=state.trainers.find(t=>t.id===tId);
      let totalHours=0;
      const rows = list.map(o=>{ let hrs=0; if(o.timeFrom && o.timeTo){ const s=parseDT(o.date,o.timeFrom), e=parseDT(o.date,o.timeTo); hrs = Math.max(0,(e-s)/3600000)*daysCount(o.date,o.dateTo); } totalHours+=hrs;
        return [o.serial, escapeHtml(o.title), dateRangeStr(o), (o.timeFrom||'')+'-'+(o.timeTo||''), hrs.toFixed(1)]; });
      doPrintDoc(buildReportDoc({ titleAr:`تقرير ساعات مقدم الفعالية: ${trainer?trainer.name:''}`, subtitle:`من ${from?fmtDate(from):'—'} إلى ${to?fmtDate(to):'—'}`,
        kpis:[{v:list.length,l:'عدد الفعاليات'},{v:totalHours.toFixed(1),l:'إجمالي الساعات'}],
        headers:['م','عنوان الفعالية','التاريخ (من — إلى)','الوقت','عدد الساعات'], rows }), true, 'A4');
    };
    document.getElementById('hr_pdf').onclick=()=>document.getElementById('hr_print').onclick();
  }
  drawStart();
}

/* ============ Simple SVG bar chart ============ */
function svgBarChart(items){
  const max = Math.max(1, ...items.map(i=>i.value));
  const barH=22, gap=10, maxW=320;
  const height = items.length*(barH+gap);
  const bars = items.map((it,i)=>{
    const w = Math.max(2, Math.round((it.value/max)*maxW));
    const y = i*(barH+gap);
    return `<rect x="0" y="${y}" width="${w}" height="${barH}" rx="4" fill="#8A1F42"></rect>
      <text x="${maxW+10}" y="${y+barH*0.72}" font-size="12" fill="#2a1116">${escapeHtml(it.name)} (${it.value})</text>`;
  }).join('');
  return `<div class="chart-wrap"><svg viewBox="0 0 ${maxW+180} ${height+10}" style="width:100%;max-width:560px;height:auto;">${bars}</svg></div>`;
}
const DONUT_COLORS = ['#8A1F42','#B08D57','#5A142F','#159669','#2F6FA8','#E99B27','#D9A3B4','#8C7D82'];
function svgDonutChart(items){
  const total = items.reduce((s,i)=>s+i.value,0) || 1;
  const cx=90, cy=90, r=70, sw=32;
  let angle=-90;
  const circumference = 2*Math.PI*r;
  const arcs = items.map((it,i)=>{
    const frac = it.value/total;
    const dash = frac*circumference;
    const el = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${DONUT_COLORS[i%DONUT_COLORS.length]}" stroke-width="${sw}"
      stroke-dasharray="${dash} ${circumference-dash}" stroke-dashoffset="${-angle/360*circumference}" transform="rotate(-90 ${cx} ${cy})"></circle>`;
    angle += frac*360;
    return el;
  }).join('');
  const legend = items.map((it,i)=>`<div style="display:flex;align-items:center;gap:6px;font-size:12.5px;margin-bottom:4px;">
    <span style="width:12px;height:12px;border-radius:3px;background:${DONUT_COLORS[i%DONUT_COLORS.length]};display:inline-block;"></span>
    ${escapeHtml(it.name)} — ${it.value} (${total?Math.round(it.value/total*100):0}%)</div>`).join('');
  return `<div class="chart-wrap" style="display:flex;gap:20px;flex-wrap:wrap;align-items:center;">
    <svg width="180" height="180" viewBox="0 0 180 180">${arcs}<text x="90" y="96" text-anchor="middle" font-size="18" font-weight="800" fill="#2a1116">${total}</text></svg>
    <div>${legend}</div>
  </div>`;
}

