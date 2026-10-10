/* Docker Course: shared runtime for index.html and every lesson page.
   To add a lesson: create NN-slug.html (copy an existing lesson) and add one line to LESSONS. */
var LESSONS = [
  { id: 'intro', file: 'why-docker.html', en: 'Why Docker?', fa: 'چرا Docker؟' },
  { id: '00', file: '00-install.html', en: 'Install Docker', fa: 'نصب Docker' },
  { id: '01', file: '01-images.html', en: 'Images', fa: 'ایمیج‌ها' },
  { id: '02', file: '02-run.html', en: 'Run a container', fa: 'اجرای کانتینر' },
  { id: '03', file: '03-background.html', en: 'Run in the background', fa: 'اجرا در پس‌زمینه' },
  { id: '04', file: '04-ports.html', en: 'Open it in the browser', fa: 'باز کردن در مرورگر' },
  { id: '05', file: '05-logs.html', en: 'Logs', fa: 'لاگ‌ها' },
  { id: '06', file: '06-exec.html', en: 'Go inside a container', fa: 'رفتن به داخل کانتینر' },
  { id: '07', file: '07-run-it.html', en: 'Run a command in a new container', fa: 'اجرای دستور در کانتینر جدید' },
  { id: '08', file: '08-volumes.html', en: 'Keep your data', fa: 'نگه داشتن داده‌ها' },
  { id: '09', file: '09-named-volumes.html', en: 'Named volumes', fa: 'Named volume' },
  { id: '10', file: '10-live-edit.html', en: 'Edit live', fa: 'ویرایش زنده' },
  { id: '11', file: '11-env.html', en: 'Settings with environment variables', fa: 'تنظیمات با متغیرهای محیطی' },
  { id: '12', file: '12-restart.html', en: 'Restart policies', fa: 'سیاست‌های راه‌اندازی مجدد' },
  { id: '13', file: '13-networks.html', en: 'Networks', fa: 'شبکه‌ها' },
  { id: '14', file: '14-compose.html', en: 'Docker Compose', fa: 'Docker Compose' },
  { id: '15', file: '15-compose-services.html', en: 'Compose: an app and its database', fa: 'Compose: برنامه و دیتابیس' },
  { id: '16', file: '16-commit.html', en: 'Save a container as an image', fa: 'ذخیره‌ی کانتینر به‌صورت ایمیج' },
  { id: '17', file: '17-dockerfile.html', en: 'Your first Dockerfile', fa: 'اولین Dockerfile' },
  { id: '18', file: '18-tags.html', en: 'Tags and versions', fa: 'تگ‌ها و نسخه‌ها' },
  { id: '19', file: '19-own-program.html', en: 'Package your own program', fa: 'بسته‌بندی برنامه‌ی خودتان' },
  { id: '20', file: '20-copy-project.html', en: 'Copy a whole project', fa: 'کپی کل پروژه' },
  { id: '21', file: '21-system-packages.html', en: 'System packages and a safer image', fa: 'بسته‌های سیستمی و ایمیج امن‌تر' },
  { id: '22', file: '22-api-db.html', en: 'Your own API + database', fa: 'API خودتان + دیتابیس' },
  { id: '23', file: '23-frontend.html', en: 'Frontend + backend + database', fa: 'Frontend + backend + دیتابیس' }
];

(function () {
  var LANG_KEY = 'docker-course-lang';
  var THEME_KEY = 'docker-course-theme';
  function progKey(id) { return 'docker-course-progress-' + id; }
  function totalKey(id) { return 'docker-course-total-' + id; }

  function load(k, fallback) { try { var v = localStorage.getItem(k); return v === null ? fallback : v; } catch (e) { return fallback; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function faNum(s) { return String(s).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }); }
  function bi(en, fa) { return '<span class="en">' + en + '</span><span class="fa">' + fa + '</span>'; }
  function isIntro(l) { return isNaN(Number(l.id)); }
  function lessonLabel(l) { return isIntro(l) ? bi('Introduction', 'مقدمه') : bi('Lesson ' + Number(l.id), 'درس ' + faNum(Number(l.id))); }
  function lessonState(id) { try { return JSON.parse(load(progKey(id), '{}')) || {}; } catch (e) { return {}; } }

  var page = document.body.dataset.lesson;                 // undefined on index.html
  var idx = LESSONS.findIndex(function (l) { return l.id === page; });
  var prev = idx > 0 ? LESSONS[idx - 1] : null;
  var next = idx >= 0 && idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null;

  /* ---------- Language ---------- */
  var langBtn = document.getElementById('langBtn');
  function setLang(lang) {
    document.body.classList.remove('lang-en', 'lang-fa');
    document.body.classList.add('lang-' + lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    langBtn.textContent = lang === 'fa' ? 'English' : 'فارسی';
    save(LANG_KEY, lang);
  }
  var urlLang = new URLSearchParams(location.search).get('lang');
  setLang(urlLang === 'fa' || urlLang === 'en' ? urlLang : load(LANG_KEY, 'en'));
  langBtn.onclick = function () { setLang(document.body.classList.contains('lang-fa') ? 'en' : 'fa'); };

  /* ---------- Theme ---------- */
  var savedTheme = load(THEME_KEY, '');
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  document.getElementById('themeBtn').onclick = function () {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    var next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    save(THEME_KEY, next);
  };

  /* ---------- Footer: GitHub star link ---------- */
  var foot = document.querySelector('footer');
  if (foot) {
    var star = el('a', 'star-link', '⭐ ' + bi('Star on GitHub', 'ستاره در GitHub'));
    star.href = 'https://github.com/smkh1985/docker-tutorial'; star.target = '_blank'; star.rel = 'noopener';
    foot.appendChild(star);
  }

  /* ---------- Index page: list of lessons ---------- */
  var list = document.getElementById('lessonList');
  if (list) {
    var allDone = 0, allTotal = 0;
    LESSONS.forEach(function (l) {
      var st = lessonState(l.id);
      var done = Object.keys(st).filter(function (k) { return st[k]; }).length;
      var total = Number(load(totalKey(l.id), 0));
      allDone += done; allTotal += total;
      var pct = total ? Math.round(done / total * 100) : 0;
      var a = el('a', 'lesson-row' + (total && done === total ? ' done' : ''));
      a.href = l.file;
      a.innerHTML =
        '<span class="num">' + (isIntro(l) ? '★' : bi(Number(l.id), faNum(Number(l.id)))) + '</span>' +
        '<span class="lesson-title"><small>' + lessonLabel(l) + '</small><b>' + bi(l.en, l.fa) + '</b></span>' +
        '<span class="lesson-prog"><span class="progress"><div style="width:' + pct + '%"></div></span>' +
        '<span class="progress-label">' + (total ? done + ' / ' + total : '—') + '</span></span>';
      list.appendChild(a);
    });
    var pct = allTotal ? Math.round(allDone / allTotal * 100) : 0;
    document.getElementById('bar').style.width = pct + '%';
    document.getElementById('plabel').textContent = allDone + ' / ' + allTotal + '  (' + pct + '%)';
    return;
  }

  /* ---------- Lesson page: top-bar title and prev/next ---------- */
  var cur = LESSONS[idx];
  document.title = isIntro(cur) ? cur.en : 'Lesson ' + Number(cur.id) + ' · ' + cur.en;
  document.getElementById('brandTitle').innerHTML = lessonLabel(cur);
  function navLink(l, dir) {
    var a = el('a', 'btn nav-btn');
    a.href = l.file;
    a.title = l.en;
    a.innerHTML = dir < 0 ? '‹' : '›';
    return a;
  }
  var navSlot = document.getElementById('navSlot');
  if (prev) navSlot.appendChild(navLink(prev, -1));
  if (next) navSlot.appendChild(navLink(next, 1));

  // Pager at the bottom of the lesson
  var pager = document.getElementById('pager');
  function pagerCard(l, dir) {
    var a = el('a', 'pager-card ' + (dir < 0 ? 'prev' : 'next'));
    a.href = l.file;
    a.innerHTML = '<small>' + (dir < 0 ? bi('← Previous', '→ قبلی') : bi('Next →', 'بعدی ←')) + '</small>' +
      '<b>' + lessonLabel(l) + ' · ' + bi(l.en, l.fa) + '</b>';
    return a;
  }
  if (prev) pager.appendChild(pagerCard(prev, -1)); else pager.appendChild(el('span'));
  if (next) pager.appendChild(pagerCard(next, 1));

  // "Next" line inside the completion banner
  var nextLine = document.getElementById('nextLine');
  nextLine.innerHTML = next
    ? bi('<b>Next:</b> <a href="' + next.file + '">Lesson ' + Number(next.id) + ' · ' + next.en + '</a>',
         '<b>قدم بعد:</b> <a href="' + next.file + '">درس ' + faNum(Number(next.id)) + ' · ' + next.fa + '</a>')
    : bi('That was the last lesson so far. <a href="index.html">Back to the course</a>.',
         'این آخرین درس فعلی بود. <a href="index.html">بازگشت به فهرست دوره</a>.');

  /* ---------- Checkboxes & progress ---------- */
  var KEY = progKey(cur.id);
  var boxes = Array.prototype.slice.call(document.querySelectorAll('input[type=checkbox][data-id]'));
  var state = lessonState(cur.id);
  save(totalKey(cur.id), boxes.length);
  boxes.forEach(function (b) { b.checked = !!state[b.dataset.id]; });

  function refresh() {
    var done = boxes.filter(function (b) { return b.checked; }).length;
    var pct = boxes.length ? Math.round(done / boxes.length * 100) : 0;
    document.getElementById('bar').style.width = pct + '%';
    document.getElementById('plabel').textContent = done + ' / ' + boxes.length + '  (' + pct + '%)';
    document.querySelectorAll('section.step').forEach(function (sec) {
      var inner = sec.querySelectorAll('input[type=checkbox]');
      var all = inner.length > 0 && Array.prototype.every.call(inner, function (b) { return b.checked; });
      sec.classList.toggle('done', all);
      var link = document.querySelector('nav.toc a[href="#' + sec.id + '"]');
      if (link) link.classList.toggle('done', all);
    });
    document.getElementById('doneBanner').classList.toggle('show', done === boxes.length);
  }
  boxes.forEach(function (b) {
    b.addEventListener('change', function () {
      state[b.dataset.id] = b.checked;
      save(KEY, JSON.stringify(state));
      refresh();
    });
  });
  document.getElementById('resetBtn').onclick = function () {
    var msg = document.body.classList.contains('lang-fa') ? 'همه‌ی تیک‌های این درس پاک شوند؟' : 'Clear all checkboxes in this lesson?';
    if (!confirm(msg)) return;
    state = {}; save(KEY, '{}');
    boxes.forEach(function (b) { b.checked = false; });
    refresh();
  };
  refresh();

  /* ---------- Command tooltips (dictionary in tips.js) ---------- */
  var G = window.TIPS_G || {}, T = window.TIPS_T || {};
  function lookup(tok, words) {
    var c1 = words[0] || '', c2 = c1 + ' ' + (words[1] || '');
    return (T[c2] && T[c2][tok]) || (T[c1] && T[c1][tok]) || G[tok] || null;
  }

  var SKIP = { 'output': 1, "just look, don't run": 1 };
  var tips = [];
  document.querySelectorAll('.code').forEach(function (block) {
    var lbl = block.querySelector('.lbl');
    if (lbl && SKIP[lbl.textContent]) return;
    var code = block.querySelector('code');
    var lines = code.textContent.split('\n');
    var lineIdx = 0;
    var walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var inComment = node.parentNode.classList && node.parentNode.classList.contains('c');
      var parts = node.nodeValue.split('\n');
      if (inComment) { lineIdx += parts.length - 1; return; }
      var frag = document.createDocumentFragment();
      parts.forEach(function (part, i) {
        if (i > 0) { frag.appendChild(document.createTextNode('\n')); lineIdx++; }
        var words = (lines[lineIdx] || '').trim().split(/\s+/);
        if (words[0] === 'sudo') words = words.slice(1);
        var re = /"[^"]*"|'[^']*'|\S+/g, last = 0, m;
        while ((m = re.exec(part))) {
          var tip = lookup(m[0], words);
          if (!tip) continue;
          if (m.index > last) frag.appendChild(document.createTextNode(part.slice(last, m.index)));
          var span = document.createElement('span');
          span.className = 'tok';
          span.tabIndex = 0;
          span.textContent = m[0];
          span.dataset.tip = tips.length;
          tips.push(tip);
          frag.appendChild(span);
          last = m.index + m[0].length;
        }
        if (last < part.length) frag.appendChild(document.createTextNode(part.slice(last)));
      });
      node.parentNode.replaceChild(frag, node);
    });
  });

  var tipEl = document.createElement('div');
  tipEl.className = 'cmd-tip';
  tipEl.setAttribute('role', 'tooltip');
  document.body.appendChild(tipEl);
  function showTip(span) {
    var fa = document.body.classList.contains('lang-fa');
    var t = tips[span.dataset.tip];
    tipEl.innerHTML = '';
    var head = document.createElement('code'); head.className = 't'; head.textContent = span.textContent;
    var body = document.createElement('div'); body.textContent = fa ? t[1] : t[0];
    body.dir = fa ? 'rtl' : 'ltr';
    tipEl.appendChild(head); tipEl.appendChild(body);
    tipEl.classList.add('show');
    var r = span.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    var left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
    var top = r.top - h - 8;
    if (top < 8) top = r.bottom + 8;
    tipEl.style.left = left + 'px';
    tipEl.style.top = top + 'px';
  }
  function hideTip() { tipEl.classList.remove('show'); }
  document.addEventListener('mouseover', function (e) { var s = e.target.closest && e.target.closest('.tok'); if (s) showTip(s); });
  document.addEventListener('mouseout', function (e) { if (e.target.closest && e.target.closest('.tok')) hideTip(); });
  document.addEventListener('focusin', function (e) { if (e.target.classList && e.target.classList.contains('tok')) showTip(e.target); });
  document.addEventListener('focusout', hideTip);
  document.addEventListener('click', function (e) {
    var s = e.target.closest && e.target.closest('.tok');
    if (s) showTip(s); else hideTip();
  });
  window.addEventListener('scroll', hideTip, { passive: true });

  /* ---------- Reveal blocks (recall practice): blurred until clicked ---------- */
  document.querySelectorAll('.code.reveal').forEach(function (block) {
    var hint = el('button', 'reveal-hint', '<span>' + bi('👁 Click to show the command', '👁 برای دیدن دستور کلیک کنید') + '</span>');
    hint.type = 'button';
    var toks = block.querySelectorAll('.tok');
    toks.forEach(function (t) { t.tabIndex = -1; });
    hint.onclick = function () {
      block.classList.add('shown');
      toks.forEach(function (t) { t.tabIndex = 0; });
      hint.remove();
    };
    block.appendChild(hint);
  });

  /* ---------- Copy buttons ---------- */
  document.querySelectorAll('.code').forEach(function (block) {
    var lbl = block.querySelector('.lbl');
    if (lbl && SKIP[lbl.textContent]) return;
    var btn = document.createElement('button');
    btn.className = 'copy';
    btn.textContent = 'Copy';
    btn.onclick = function () {
      // copy commands only, without trailing "# comments"
      var text = block.querySelector('code').innerText
        .split('\n').map(function (l) { return l.replace(/\s+#\s.*$/, ''); }).join('\n');
      var ok = function () { btn.textContent = '✓ Copied'; btn.classList.add('ok');
        setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('ok'); }, 1400); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(ok, function () {});
    };
    block.appendChild(btn);
  });
})();
