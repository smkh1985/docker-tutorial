/* Docker course — motion deck engine (shared by every motion lesson).
   Slides: <section class="slide" data-scene="name" data-title-en="" data-title-fa="">
   Steps:  any element with data-step="N" appears when the slide reaches step N (→ advances steps, then slides).
   Terminal: <div class="run" data-step="1"><div class="cmd">docker image ls</div><pre class="out">…</pre></div>
             add class "recall" + data-reveal="N" to blur the command until step N (or a click).
   Scenes: window.SCENES[name] = (slide, api) => ({ step(k, instant), stop() }) */
(() => {
'use strict';
const W = 1600, H = 900;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const LANG_KEY = 'docker-course-lang';
const stage = $('#stage');
const slides = $$('.slide');
let scale = 1, cur = -1, step = 0, scene = null, timers = [];
const isFa = () => document.body.classList.contains('lang-fa');

/* ---------- scale ---------- */
function fit() { scale = Math.min(innerWidth / W, innerHeight / H); stage.style.transform = `scale(${scale})`; }
addEventListener('resize', fit); fit();

/* ---------- language (shared with the text lessons) ---------- */
function load(k, f) { try { const v = localStorage.getItem(k); return v === null ? f : v; } catch (e) { return f; } }
function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
const langBtn = $('#langBtn');
function setLang(l) {
  document.body.classList.remove('lang-en', 'lang-fa'); document.body.classList.add('lang-' + l);
  document.documentElement.lang = l; document.documentElement.dir = l === 'fa' ? 'rtl' : 'ltr';
  if (langBtn) langBtn.textContent = l === 'fa' ? 'English' : 'فارسی';
  save(LANG_KEY, l); buildOverview(); updateChrome(); if (typeof narrate === 'function' && cur >= 0) narrate();
  if (cur >= 0) {
    const s = slides[cur]; s.classList.remove('active'); void s.offsetWidth; s.classList.add('active');
    endScene(); const name = s.dataset.scene;
    scene = name && window.SCENES && window.SCENES[name] ? window.SCENES[name](s, api) : null;
    if (scene && scene.step) scene.step(step, true);
  }
}
if (langBtn) langBtn.onclick = () => setLang(isFa() ? 'en' : 'fa');

/* ---------- split headings ---------- */
$$('.split').forEach(el => {
  let i = 0; const frag = document.createDocumentFragment();
  const add = (text, cls) => text.split(/([ \t\n\r]+)/).forEach(tok => {
    if (!tok) return;
    if (/^[ \t\n\r]+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
    const w = document.createElement('span'); w.className = 'w';
    const s = document.createElement('span'); s.textContent = tok; if (cls) s.className = cls;
    s.style.setProperty('--i', i++); w.appendChild(s); frag.appendChild(w);
  });
  [...el.childNodes].forEach(n => n.nodeType === 3 ? add(n.textContent, '') : add(n.textContent, n.className));
  el.textContent = ''; el.appendChild(frag);
});

/* ---------- helpers for scenes ---------- */
function later(fn, s) { const id = setTimeout(fn, s * 1000); timers.push(id); return id; }
function loop(fn) {
  let alive = true; const t0 = performance.now();
  const f = t => { if (!alive) return; fn((t - t0) / 1000); requestAnimationFrame(f); };
  requestAnimationFrame(f); return () => { alive = false; };
}
function setupCanvas(cv) {
  const p = cv.parentElement, w = p.clientWidth, h = p.clientHeight, d = Math.min(2.5, (devicePixelRatio || 1) * scale);
  cv.width = w * d; cv.height = h * d; cv.style.width = w + 'px'; cv.style.height = h + 'px';
  const ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0); return { ctx, w, h };
}
function countUp(el) {
  const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), t0 = performance.now(), dur = 1400;
  const f = t => { const k = 1 - Math.pow(1 - clamp((t - t0) / dur), 3); el.textContent = (to * k).toFixed(dec); if (k < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}

/* ---------- tooltips (dictionary from tips.js, same lookup as the text lessons) ---------- */
const G = window.TIPS_G || {}, T = window.TIPS_T || {};
function lookup(tok, words) {
  const c1 = words[0] || '', c2 = c1 + ' ' + (words[1] || '');
  return (T[c2] && T[c2][tok]) || (T[c1] && T[c1][tok]) || G[tok] || null;
}
const tipEl = document.createElement('div'); tipEl.id = 'tip'; document.body.appendChild(tipEl);
function showTip(el) {
  const t = el._tip; if (!t) return;
  tipEl.innerHTML = `<b></b><span></span>`; tipEl.firstChild.textContent = el.textContent; tipEl.lastChild.textContent = isFa() ? t[1] : t[0];
  const r = el.getBoundingClientRect(); tipEl.classList.add('show');
  const tw = tipEl.offsetWidth; tipEl.style.left = clamp(r.left + r.width / 2 - tw / 2, 10, innerWidth - tw - 10) + 'px'; tipEl.style.top = (r.bottom + 12) + 'px';
}
const hideTip = () => tipEl.classList.remove('show');
function tokenize(cmdEl, text) {
  const words = text.trim().split(/\s+/);
  cmdEl.innerHTML = '';
  text.split(/(\s+)/).forEach(part => {
    if (!part) return;
    if (/^\s+$/.test(part)) { cmdEl.appendChild(document.createTextNode(part)); return; }
    const s = document.createElement('span'); s.className = 'tok'; s.textContent = part; s._tip = lookup(part, words);
    if (s._tip) { s.onmouseenter = () => showTip(s); s.onmouseleave = hideTip; } else s.style.cursor = 'text';
    cmdEl.appendChild(s);
  });
}

/* ---------- terminal runs ---------- */
$$('.run').forEach(run => {
  const cmd = $('.cmd', run); run._cmd = cmd.textContent.trim(); cmd.textContent = '';
  $$('.out', run).forEach(o => { o.innerHTML = o.innerHTML.replace(/^\n/, '').split('\n').map(l => `<span class="ol">${l || ' '}</span>`).join(''); });
  if (run.classList.contains('recall')) {
    const h = document.createElement('div'); h.className = 'hint';
    // data-task-en / data-task-fa: what the student should do (the command itself stays blurred)
    const task = (l) => run.dataset['task' + l] ? `<b class="task">${run.dataset['task' + l]}</b>` : '';
    h.innerHTML = `<span class="en">${task('En')}🧠 You've used this command before. Type it yourself, then click or press → to check.</span><span class="fa">${task('Fa')}🧠 این دستور را قبلاً استفاده کرده‌اید. خودتان تایپش کنید، بعد کلیک کنید یا → را بزنید تا ببینید.</span>`;
    run.insertBefore(h, cmd);
    cmd.addEventListener('click', () => { if (!run.classList.contains('revealed')) reveal(run, false); });
  }
});
function resetRun(run) {
  run._token = (run._token || 0) + 1; run._busy = false; run.classList.remove('revealed', 'typed');
  $('.cmd', run).textContent = ''; $$('.ol', run).forEach(l => l.classList.remove('show'));
}
function showOut(run, instant, tok) {
  $$('.ol', run).forEach((l, i) => { if (instant) l.classList.add('show'); else setTimeout(() => { if (run._token === tok) l.classList.add('show'); }, 180 + i * 150); });
  const n = $$('.ol', run).length;
  setTimeout(() => { if (run._token === tok) run.dispatchEvent(new CustomEvent('run-done', { bubbles: true })); }, instant ? 0 : 180 + n * 150 + 200);
}
function typeRun(run, instant) {
  resetRun(run); const tok = run._token, cmd = $('.cmd', run), text = run._cmd;
  if (run.classList.contains('recall') && !run._revealNow) { tokenize(cmd, text); return; } // blurred, waiting
  if (instant) { tokenize(cmd, text); run.classList.add('typed', 'revealed'); showOut(run, true, tok); return; }
  run._busy = true; let i = 0; const caret = '<span class="caret"></span>';
  const tick = () => {
    if (run._token !== tok) return;
    if (i <= text.length) { cmd.innerHTML = ''; cmd.append(text.slice(0, i)); cmd.insertAdjacentHTML('beforeend', caret); i++; setTimeout(tick, 28 + Math.random() * 40); }
    else { tokenize(cmd, text); run.classList.add('typed'); showOut(run, false, tok); }
  };
  setTimeout(tick, 250);
}
function reveal(run, instant) {
  run._revealNow = true; run.classList.add('revealed');
  const tok = run._token; tokenize($('.cmd', run), run._cmd); showOut(run, instant, tok);
  const k = +(run.dataset.reveal || 0); if (k > step) { step = k; applyStep(false, true); }
}

/* ---------- steps ---------- */
const maxStep = s => Math.max(0, ...$$('[data-step]', s).map(e => +e.dataset.step), ...$$('[data-only]', s).flatMap(e => e.dataset.only.split(' ').map(Number)),...$$('[data-reveal]', s).map(e => +e.dataset.reveal), +(s.dataset.steps || 0));
function applyStep(instant, skipRuns) {
  const s = slides[cur];
  $$('[data-step]', s).forEach(el => {
    const on = step >= +el.dataset.step, was = el.classList.contains('in');
    el.classList.toggle('in', on);
    if (on && !was) {
      if (el.classList.contains('run') && !skipRuns) { el._revealNow = el.dataset.reveal ? step >= +el.dataset.reveal : false; typeRun(el, instant); }
      $$('[data-count]', el).forEach(countUp); if (el.dataset.count) countUp(el);
    }
    if (!on && was && el.classList.contains('run')) resetRun(el);
  });
  // data-only="k" (or "k m"): visible on exactly those steps, e.g. captions that replace each other
  $$('[data-only]', s).forEach(el => el.classList.toggle('in', el.dataset.only.split(' ').includes(String(step))));
  $$('.run.recall[data-reveal]', s).forEach(r => {
    const on = step >= +r.dataset.reveal;
    if (on && !r.classList.contains('revealed') && r.classList.contains('in')) reveal(r, instant);
    if (!on && r.classList.contains('revealed')) { r._revealNow = false; typeRun(r, true); }
  });
  if (scene && scene.step) scene.step(step, instant);
  updateChrome(); narrate();
}

/* ---------- navigation ---------- */
function endScene() { timers.forEach(clearTimeout); timers = []; if (scene && scene.stop) scene.stop(); scene = null; hideTip(); }
function go(n, dir, atEnd) {
  n = clamp(n, 0, slides.length - 1); if (n === cur) return;
  dir = dir ?? (n > cur ? 1 : -1);
  const prev = slides[cur]; endScene();
  if (prev) {
    prev.classList.remove('active', 'enter-fwd', 'enter-back'); prev.classList.add(dir > 0 ? 'leave-fwd' : 'leave-back');
    setTimeout(() => { if (!prev.classList.contains('active')) { prev.classList.remove('leave-fwd', 'leave-back'); $$('[data-step]', prev).forEach(e => e.classList.remove('in')); $$('.run', prev).forEach(resetRun); } }, 700);
  }
  const s = slides[n]; s.classList.remove('leave-fwd', 'leave-back', 'enter-fwd', 'enter-back');
  $$('[data-step]', s).forEach(e => e.classList.remove('in')); $$('.run', s).forEach(resetRun);
  void s.offsetWidth; s.classList.add('active', dir > 0 ? 'enter-fwd' : 'enter-back');
  cur = n; step = atEnd ? maxStep(s) : 0;
  const name = s.dataset.scene;
  scene = name && window.SCENES && window.SCENES[name] ? window.SCENES[name](s, api) : null;
  $$('[data-count]', s).forEach(el => { if (!el.closest('[data-step]')) later(() => countUp(el), +(el.dataset.delay || .6)); });
  applyStep(!!atEnd);
  history.replaceState(null, '', '#' + (n + 1));
}
function next() { if (step < maxStep(slides[cur])) { step++; applyStep(false); } else go(cur + 1, 1); }
function prev() { if (step > 0) { step--; applyStep(true); } else go(cur - 1, -1, true); }
const api = { loop, later, setupCanvas, isFa, countUp, get step() { return step; }, next };

/* ---------- chrome ---------- */
const prog = $('#progress'), count = $('#count'), stepsEl = $('#steps');
function title(s) { return (isFa() ? s.dataset.titleFa : s.dataset.titleEn) || ''; }
function updateChrome() {
  if (cur < 0) return;
  const m = maxStep(slides[cur]);
  prog.style.width = ((cur + (m ? step / (m + 1) : 0) + 1) / slides.length * 100) + '%';
  if (count) count.textContent = `${cur + 1} / ${slides.length}`;
  if (stepsEl) stepsEl.innerHTML = m ? Array.from({ length: m + 1 }, (_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('') : '';
  $$('#overview button').forEach((b, i) => b.classList.toggle('on', i === cur));
}
const ov = $('#overview');
function buildOverview() {
  if (!ov) return; const g = $('.g', ov); g.innerHTML = '';
  slides.forEach((s, i) => { const b = document.createElement('button'); b.innerHTML = `<small>${String(i + 1).padStart(2, '0')}</small>`; b.append(title(s)); b.onclick = () => { ov.classList.remove('show'); go(i); }; g.appendChild(b); });
}
$('#prevBtn')?.addEventListener('click', prev); $('#nextBtn')?.addEventListener('click', next);
$('#ovBtn')?.addEventListener('click', () => ov.classList.toggle('show'));
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); next(); }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); prev(); }
  else if (k === 'Home') go(0); else if (k === 'End') go(slides.length - 1);
  else if (k === 'l' || k === 'L') setLang(isFa() ? 'en' : 'fa');
  else if (k === 'o' || k === 'O') ov.classList.toggle('show');
  else if (k === 'Escape') ov.classList.remove('show');
  else if (k === 'f' || k === 'F') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
});
let tx = null;
addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
addEventListener('touchend', e => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) (dx < 0) === !isFa() ? next() : prev(); tx = null; });

/* ---------- background: drifting container network ---------- */
const bg = $('#bg'), bx = bg.getContext('2d'), glow = $('#glow');
let BW, BH, P = [], mouse = { x: -999, y: -999 };
function sizeBg() {
  const d = Math.min(2, devicePixelRatio || 1); BW = innerWidth; BH = innerHeight; bg.width = BW * d; bg.height = BH * d; bx.setTransform(d, 0, 0, d, 0, 0);
  P = Array.from({ length: Math.round(Math.min(110, BW * BH / 16000)) }, () => ({ x: Math.random() * BW, y: Math.random() * BH, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, s: Math.random() < .18 }));
}
sizeBg(); addEventListener('resize', sizeBg);
addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; if (glow) { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; } });
(function frame(t) {
  bx.clearRect(0, 0, BW, BH);
  const g = bx.createRadialGradient(BW * .2, BH * .25, 0, BW * .2, BH * .25, BW * .6); g.addColorStop(0, 'rgba(29,99,237,.20)'); g.addColorStop(1, 'rgba(29,99,237,0)'); bx.fillStyle = g; bx.fillRect(0, 0, BW, BH);
  const g2 = bx.createRadialGradient(BW * .85, BH * .85, 0, BW * .85, BH * .85, BW * .5); g2.addColorStop(0, 'rgba(60,207,127,.08)'); g2.addColorStop(1, 'rgba(60,207,127,0)'); bx.fillStyle = g2; bx.fillRect(0, 0, BW, BH);
  for (const p of P) {
    const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
    if (d < 140 && d > 0) { p.vx += dx / d * .05; p.vy += dy / d * .05; }
    p.vx *= .985; p.vy *= .985; p.x += p.vx + .06; p.y += p.vy;
    if (p.x > BW + 10) p.x = -10; if (p.x < -10) p.x = BW + 10; if (p.y > BH + 10) p.y = -10; if (p.y < -10) p.y = BH + 10;
  }
  for (let i = 0; i < P.length; i++) {
    const a = P[i];
    for (let j = i + 1; j < P.length; j++) { const b = P[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 130) { bx.strokeStyle = `rgba(110,155,255,${(1 - d / 130) * .15})`; bx.beginPath(); bx.moveTo(a.x, a.y); bx.lineTo(b.x, b.y); bx.stroke(); } }
    if (a.s) { bx.strokeStyle = 'rgba(110,155,255,.45)'; bx.strokeRect(a.x - 4, a.y - 3, 8, 6); }
    else { bx.fillStyle = 'rgba(110,155,255,.5)'; bx.beginPath(); bx.arc(a.x, a.y, 1.3, 0, 6.283); bx.fill(); }
  }
  requestAnimationFrame(frame);
})(0);

/* ---------- voiceover: Kokoro clips made by tools/narrate.py (English only) ----------
   audio/<deck>/index.js sets window.NARRATION[slide][step] = clip seconds (0 = silent step).
   When the voice is on, each step plays its clip, then the deck advances by itself. */
const DECK = decodeURIComponent(location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
const VOICE_KEY = 'docker-course-voice';
const voice = new Audio(); voice.preload = 'auto';
let voiceOn = load(VOICE_KEY, '0') === '1', voiceTimer = null, voiceDone = true;
const voiceBtn = document.createElement('button'); voiceBtn.className = 'pill'; voiceBtn.id = 'voiceBtn'; voiceBtn.hidden = true;
voiceBtn.title = 'Voiceover: plays each step and moves on by itself (V)';
($('#ovBtn') || langBtn)?.before(voiceBtn);
function updVoice() { voiceBtn.textContent = voiceOn ? '🔊 Voice on' : '🔇 Voice off'; voiceBtn.classList.toggle('on', voiceOn); }
function setVoice(on) { voiceOn = on; save(VOICE_KEY, on ? '1' : '0'); updVoice(); narrate(); }
voiceBtn.onclick = () => setVoice(!voiceOn);
function narrate() {
  clearTimeout(voiceTimer); voice.onended = null; voice.pause(); voiceDone = true;
  if (!voiceOn || !window.NARRATION || isFa() || cur < 0) return;
  const d = (window.NARRATION[cur] || [])[step] || 0;
  voiceDone = false;
  if (d) {
    voice.src = `audio/${DECK}/s${String(cur + 1).padStart(2, '0')}-${step}.mp3`;
    voice.onended = () => { voiceDone = true; tryAdvance(); };
    voice.play().catch(() => { voiceOn = false; updVoice(); }); // autoplay blocked until the viewer clicks
  } else voiceTimer = setTimeout(() => { voiceDone = true; tryAdvance(); }, 1500);
}
function tryAdvance() {
  if (!voiceOn || !voiceDone || isFa()) return;
  if ($$('.run', slides[cur]).some(r => r._busy)) return; // wait for the terminal to finish typing
  if (cur === slides.length - 1 && step >= maxStep(slides[cur])) return;
  clearTimeout(voiceTimer); voiceTimer = setTimeout(next, 700);
}
document.addEventListener('run-done', e => { e.target._busy = false; tryAdvance(); });
addEventListener('keydown', e => { if ((e.key === 'v' || e.key === 'V') && !e.metaKey && !e.ctrlKey && !e.altKey && !voiceBtn.hidden) setVoice(!voiceOn); });
const narrScript = document.createElement('script'); narrScript.src = `audio/${DECK}/index.js`;
narrScript.onload = () => { if (window.NARRATION) { voiceBtn.hidden = false; updVoice(); narrate(); } };
document.head.appendChild(narrScript);

/* ---------- start ---------- */
const urlLang = new URLSearchParams(location.search).get('lang');
setLang(urlLang === 'fa' || urlLang === 'en' ? urlLang : load(LANG_KEY, 'en'));
const start = parseInt(location.hash.slice(1), 10);
go(Number.isFinite(start) ? start - 1 : 0, 1);
})();
