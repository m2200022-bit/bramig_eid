/* بناء النظام: src/ (ملفات مقسّمة للتطوير) ← نسخة النشر المضغوطة + نسخة الملف الواحد
   الاستخدام:  node tools/build.js [مسار-الملف-الواحد-الاختياري]            */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { minify } = require('terser'); const csso = require('csso');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'src');
(async () => {
  const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  const css  = fs.readFileSync(path.join(SRC, 'app.css'), 'utf8');
  const order = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m => m[1]);
  const js = order.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('');
  const strip = h => h.replace(/\n?<script src="js\/[^"]+"><\/script>/g, '');
  /* 1) ملف واحد (للاختبار والتسليم) — مطابق تمامًا للبنية الأصلية */
  const single = strip(html).replace('<link rel="stylesheet" href="app.css">', `<style>${css}</style>`)
    .replace('</body>', `<script>\n${js}</script>\n</body>`);
  if (process.argv[2]) fs.writeFileSync(process.argv[2], single);
  /* 2) نسخة النشر: ملف CSS وملف JS مضغوطان بأسماء تتغيّر مع كل إصدار */
  const mj = (await minify(js, { compress: { keep_fnames: true, keep_classnames: true }, mangle: { keep_fnames: true },
    format: { comments: false, ascii_only: false } })).code;
  const mc = csso.minify(css, { restructure: false }).css;
  const h = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);
  const A = path.join(ROOT, 'assets'); fs.mkdirSync(A, { recursive: true });
  for (const f of fs.readdirSync(A)) if (/^app\.[0-9a-f]+\.(js|css)$/.test(f)) fs.unlinkSync(path.join(A, f));
  const jn = `app.${h(mj)}.js`, cn = `app.${h(mc)}.css`;
  fs.writeFileSync(path.join(A, jn), mj); fs.writeFileSync(path.join(A, cn), mc);
  const out = strip(html).replace('<link rel="stylesheet" href="app.css">', `<link rel="stylesheet" href="assets/${cn}">`)
    .replace('</body>', `<script src="assets/${jn}"></script>\n</body>`);
  fs.writeFileSync(path.join(ROOT, 'index.html'), out);
  console.log('built', jn, (mj.length/1024|0)+'KB', cn, (mc.length/1024|0)+'KB', 'index', (out.length/1024|0)+'KB');
})().catch(e => { console.error(e); process.exit(1); });
