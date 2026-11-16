/* Glasspad — Sakura theme engine
   ambient falling petals (depth, 3D flip, sway, wind gusts, scroll parallax, tap repel, phone-tilt wind)
   blossom branch + moon + mountains scene, tap blossoms, petal bursts in every FX, circle-reveal page transitions,
   staggered sheet entrance, sakura logo, intro bloom. Everything respects Settings → Motion. */
(function () {
  'use strict';
  const A = window.App; if (!A) return;
  const CFG = A.CFG, FX = A.FX, $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const isM = () => CFG.theme === 'money', on = () => CFG.theme === 'sakura' || isM(), mo = () => on() && CFG.motion;
  const rnd = Math.random, TAU = Math.PI * 2;

  // one-time switch to the new theme for existing installs
  try { if (!localStorage.getItem('gp_sk1')) { localStorage.setItem('gp_sk1', '1'); CFG.theme = 'sakura'; if (CFG.petals == null) CFG.petals = 2; A.saveC(); A.applyCfg(); } } catch (e) { }
  if (CFG.petals == null) CFG.petals = 2;

  // ---------- petal sprites (pre-rendered, cheap to draw) ----------
  const COLS = [['#fff4f9', '#ffc2dc', '#f58bb8'], ['#ffe9f3', '#ffadd0', '#ec6fa6'], ['#fffafd', '#ffd6e8', '#f7a1c6'], ['#fff0f7', '#ff9fc8', '#e0589a'], ['#fbeaff', '#f2b8f0', '#c77dce']];
  function sprite(c) {
    const cv = document.createElement('canvas'), S = 64; cv.width = cv.height = S; const x = cv.getContext('2d'); x.translate(S / 2, S / 2);
    const g = x.createLinearGradient(0, 24, 0, -26); g.addColorStop(0, c[2]); g.addColorStop(.45, c[1]); g.addColorStop(1, c[0]);
    x.fillStyle = g; x.beginPath(); x.moveTo(0, 26); x.bezierCurveTo(-21, 10, -20, -17, -7, -26); x.quadraticCurveTo(-2, -20, 0, -19); x.quadraticCurveTo(2, -20, 7, -26); x.bezierCurveTo(20, -17, 21, 10, 0, 26); x.fill();
    x.globalAlpha = .45; x.strokeStyle = '#fff'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(0, 22); x.quadraticCurveTo(1.5, 0, 0, -16); x.stroke();
    x.globalAlpha = .25; x.beginPath(); x.moveTo(0, 18); x.quadraticCurveTo(-7, 2, -9, -12); x.moveTo(0, 18); x.quadraticCurveTo(7, 2, 9, -12); x.stroke();
    return cv;
  }
  const SPR = COLS.map(sprite);
  // soft, out-of-focus petals for the far layer (depth of field, pre-blurred once)
  const BOK = SPR.map(sp => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); try { x.filter = 'blur(3px)'; } catch (e) { } x.globalAlpha = .9; x.drawImage(sp, 6, 6, 52, 52); return c; });
  // ---- money sprites: bills, gold coins, $ glints (original designs) ----
  function bill(c1, c2, c3) {
    const cv = document.createElement('canvas'), S = 64; cv.width = cv.height = S; const x = cv.getContext('2d'); x.translate(S / 2, S / 2);
    const rr = (X, Y, w, h, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };
    const g = x.createLinearGradient(-30, -15, 30, 15); g.addColorStop(0, c1); g.addColorStop(.5, c2); g.addColorStop(1, c1);
    x.fillStyle = g; rr(-30, -15, 60, 30, 3); x.fill(); x.strokeStyle = c3; x.lineWidth = 1.4; rr(-27, -12, 54, 24, 2); x.stroke();
    x.fillStyle = c3; x.globalAlpha = .55; x.beginPath(); x.ellipse(0, 0, 9, 10, 0, 0, 6.29); x.fill(); x.globalAlpha = 1;
    x.fillStyle = '#eafff2'; x.font = '900 14px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', 0, 1);
    x.font = '800 6px Arial'; x.fillStyle = c3; x.fillText('100', -20, -6); x.fillText('100', 20, 7);
    return cv;
  }
  function coin() {
    const cv = document.createElement('canvas'), S = 64; cv.width = cv.height = S; const x = cv.getContext('2d'); x.translate(S / 2, S / 2);
    const g = x.createRadialGradient(-6, -8, 2, 0, 0, 22); g.addColorStop(0, '#fff3b0'); g.addColorStop(.45, '#ffcf3a'); g.addColorStop(1, '#b37a00');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, 20, 0, 6.29); x.fill(); x.strokeStyle = '#8a5d00'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 15, 0, 6.29); x.stroke();
    x.fillStyle = '#7a5200'; x.font = '900 20px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', 0, 1); return cv;
  }
  const MSP = [bill('#3fbf6e', '#7ee2a0', '#1d6b3c'), bill('#2fa95f', '#6fd894', '#175a33'), bill('#47c777', '#9cf0bb', '#1f7342'), coin(), bill('#36b467', '#86e6a8', '#1a6338')];
  const MBOK = MSP.map(sp => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); try { x.filter = 'blur(3px)'; } catch (e) { } x.globalAlpha = .85; x.drawImage(sp, 6, 6, 52, 52); return c; });
  const pickS = () => isM() ? MSP[(rnd() * MSP.length) | 0] : SPR[(rnd() * SPR.length) | 0];
  function drawP(cx, p, k) {
    p.x += Math.sin(p.l * 0.07 + p.ph) * 0.7; p.fl += 0.09;
    const sx = Math.cos(p.fl);
    cx.globalCompositeOperation = 'source-over'; cx.globalAlpha = Math.min(1, k * 2.4);
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.scale(Math.max(0.12, Math.abs(sx)), 1);
    cx.drawImage(p.sp, -p.r, -p.r, p.r * 2, p.r * 2); cx.restore();
  }
  window.Sakura = { drawP, retier: () => { if (typeof rs === 'function') { rs(); P.forEach(p => { if (p.far && window.QUAL !== 'hi') { p.far = false; p.sp = pickS(); } }); fill(); start(); } } };

  // ---------- scene: moon, mountains, blossom branch ----------
  const bg = $('#bg');
  const scene = document.createElement('div'); scene.className = 'sk-scene';
  const flower = (x, y, r, rot, d) => '<g class="skf" style="--d:' + d + 's" transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + r + ')"><g class="skf-in">' + [0, 72, 144, 216, 288].map(a => '<use href="#skPet" transform="rotate(' + a + ')"/>').join('') + '<circle r="3.2" fill="#ff7fb2"/>' + [0, 60, 120, 180, 240, 300].map(a => '<circle cx="' + (Math.cos(a * Math.PI / 180) * 5.5).toFixed(1) + '" cy="' + (Math.sin(a * Math.PI / 180) * 5.5).toFixed(1) + '" r="1.1" fill="#ffe08a"/>').join('') + '</g></g>';
  const bud = (x, y, rot, d) => '<g class="skf" style="--d:' + d + 's" transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')"><g class="skf-in"><ellipse rx="3.6" ry="5.5" fill="#ff8fbf"/><path d="M-3 3 Q0 9 3 3" fill="#7a3a52"/></g></g>';
  const FL = [[262, 40, .95, 10], [228, 74, .8, 40], [300, 88, 1.05, -20], [190, 112, .7, 70], [150, 150, .85, 15], [252, 140, .75, -40], [112, 186, .65, 30], [336, 30, .7, 55], [205, 32, .6, -10], [80, 224, .55, 80], [176, 196, .6, 20], [318, 160, .62, 5]];
  scene.innerHTML =
    '<div class="sk-moon"></div>' +
    '<svg class="sk-mtn" viewBox="0 0 400 120" preserveAspectRatio="none"><path d="M0 120 L0 92 Q40 78 70 84 L118 58 Q132 52 146 60 L176 46 Q200 26 214 30 L236 22 Q250 18 262 30 L290 52 Q320 66 346 60 L400 74 L400 120Z" fill="rgba(70,24,60,.55)"/><path d="M0 120 L0 104 Q60 92 110 100 Q160 88 210 96 Q270 84 330 98 Q370 92 400 98 L400 120Z" fill="rgba(40,12,34,.75)"/></svg>' +
    '<svg class="sk-branch" viewBox="0 0 360 260"><defs><radialGradient id="skPg" cx=".5" cy=".85" r=".9"><stop offset="0" stop-color="#ff86b9"/><stop offset=".55" stop-color="#ffc3dc"/><stop offset="1" stop-color="#fff2f8"/></radialGradient>' +
    '<linearGradient id="skBark" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a4a68"/><stop offset="1" stop-color="#5a2a46"/></linearGradient><path id="skPet" d="M0 0 C-6 -4 -8 -12 -4 -17 Q-1.5 -15 0 -15.5 Q1.5 -15 4 -17 C8 -12 6 -4 0 0Z" fill="url(#skPg)" stroke="rgba(255,255,255,.35)" stroke-width=".5"/></defs>' +
    '<g class="sk-sway"><path d="M372 -6 C320 30 300 60 250 92 C210 118 170 140 130 178 C110 196 92 214 70 236" stroke="url(#skBark)" stroke-width="9" fill="none" stroke-linecap="round"/>' +
    '<path d="M300 60 C318 90 330 120 326 168" stroke="url(#skBark)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M250 92 C236 70 222 52 200 30" stroke="url(#skBark)" stroke-width="4.5" fill="none" stroke-linecap="round"/>' +
    '<path d="M170 140 C190 160 200 180 186 204" stroke="url(#skBark)" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M372 -6 C352 6 340 18 330 34" stroke="url(#skBark)" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    FL.map((f, i) => flower(f[0], f[1], f[2], f[3], (0.3 + i * 0.12).toFixed(2))).join('') +
    bud(286, 112, 30, 1.8) + bud(140, 172, -20, 1.9) + bud(214, 52, 10, 2) + bud(326, 140, 60, 2.1) + '</g></svg>';
  bg.appendChild(scene);
  const mscene = document.createElement('div'); mscene.className = 'mn-scene';
  const stack = (x, n, w) => { let h = ''; for (let i = 0; i < n; i++) h += '<rect x="' + x + '" y="' + (112 - i * 6) + '" width="' + w + '" height="5.2" rx="1.5" fill="' + (i % 2 ? '#1c6b3d' : '#23824a') + '"/>'; return h; };
  const cstack = (x, n) => { let h = ''; for (let i = 0; i < n; i++) h += '<ellipse cx="' + x + '" cy="' + (114 - i * 4) + '" rx="13" ry="3.6" fill="' + (i % 2 ? '#c48f12' : '#e7b52c') + '"/>'; return h; };
  mscene.innerHTML = '<div class="mn-rays"></div><div class="mn-sign">$</div><svg class="mn-stacks" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice">' + stack(20, 9, 46) + stack(70, 5, 46) + cstack(140, 11) + cstack(168, 6) + stack(300, 7, 46) + stack(350, 12, 46) + cstack(262, 8) + '</svg>';
  bg.appendChild(mscene);

  // ---------- ambient petals ----------
  const cv = document.createElement('canvas'); cv.id = 'skPetals'; bg.appendChild(cv);
  const cx = cv.getContext('2d');
  let P = [], Wd = 0, Hd = 0, dpr = 1, gust = 0, nextGust = 0, tilt = 0, run = false, last = 0;
  function rs() { dpr = window.QUAL === 'hi' ? Math.min(1.25, devicePixelRatio || 1) : window.QUAL === 'mid' ? 0.75 : 0.6; Wd = innerWidth; Hd = innerHeight; cv.width = Wd * dpr; cv.height = Hd * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  rs(); addEventListener('resize', rs);
  const want = () => { const n = { lo: 10, mid: 18, hi: 30 }[window.QUAL] || 18; return CFG.petals === 1 ? Math.ceil(n / 2) : CFG.petals === 0 ? 0 : n; };
  function mk(top) {
    const z = Math.pow(rnd(), 1.4), far = z < 0.22 && window.QUAL === 'hi';
    const M = isM(); return { far, r0: 0, x: rnd() * Wd, y: top ? -30 - rnd() * 80 : rnd() * Hd, z, r: (M ? 8 : 5) + z * (M ? 14 : 11), vy: (M ? 0.25 : 0.3) + z * (M ? 0.7 : 0.85), vx: 0, ph: rnd() * TAU, fq: 0.5 + rnd() * 1.2, rot: rnd() * TAU, vr: (rnd() - .5) * 0.025, fl: rnd() * TAU, vf: 0.02 + rnd() * 0.05, sp: far ? (isM() ? MBOK : BOK)[(rnd() * 5) | 0] : pickS(), a: far ? 0.5 : 0.3 + z * 0.6, th: CFG.theme };
  }
  function fill() { const n = want(); while (P.length < n) P.push(mk(false)); if (P.length > n) P.length = n; P.sort((a, b) => a.z - b.z); }
  function frame(t) {
    if (!mo() || !want() || document.hidden) { run = false; cx.clearRect(0, 0, Wd, Hd); return; }
    if (document.body.classList.contains('shfull') || (window.QUAL !== 'hi' && t - last < 30)) { requestAnimationFrame(frame); return; }
    const dt = Math.min(3, (t - (last || t)) / 16.67); last = t;
    if (t > nextGust) { gust = (rnd() < .5 ? -1 : 1) * (1.2 + rnd() * 2.2); nextGust = t + 7000 + rnd() * 9000; scene.style.setProperty('--g', gust.toFixed(2)); scene.classList.remove('gust'); void scene.offsetWidth; scene.classList.add('gust'); }
    gust *= Math.pow(0.985, dt);
    cx.clearRect(0, 0, Wd, Hd);
    const sec = t / 1000;
    const th = CFG.theme;
    for (const p of P) {
      if (p.th !== th) Object.assign(p, mk(false));
      const wind = (gust + tilt * 0.6) * (0.4 + p.z);
      p.vx += ((Math.sin(sec * p.fq + p.ph) * 0.5 + wind) - p.vx) * 0.04 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt * (1 + Math.abs(gust) * 0.15);
      p.rot += p.vr * dt + p.vx * 0.004; p.fl += p.vf * dt;
      if (p.y > Hd + 30 || p.x < -60 || p.x > Wd + 60) { Object.assign(p, mk(true)); if (gust > 0.5) p.x = -20 - rnd() * 40, p.y = rnd() * Hd * .6; else if (gust < -0.5) p.x = Wd + 20 + rnd() * 40, p.y = rnd() * Hd * .6; }
      const sx = Math.cos(p.fl);
      cx.globalAlpha = p.a * (0.55 + 0.45 * Math.abs(sx));
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.scale(Math.max(0.1, Math.abs(sx)), 1);
      cx.drawImage(p.sp, -p.r, -p.r, p.r * 2, p.r * 2); cx.restore();
    }
    cx.globalAlpha = 1; requestAnimationFrame(frame);
  }
  function start() { fill(); if (!run && mo() && want()) { run = true; last = 0; requestAnimationFrame(frame); } }
  document.addEventListener('visibilitychange', start);
  // scroll parallax: petals drift against the content
  let lastSc = new WeakMap();
  document.addEventListener('scroll', e => {
    if (!run) return; const el = e.target; if (!el || !el.scrollTop && el.scrollTop !== 0) return;
    const prev = lastSc.get(el); lastSc.set(el, el.scrollTop); if (prev == null) return;
    const d = Math.max(-40, Math.min(40, el.scrollTop - prev)); for (const p of P) p.y -= d * 0.12 * (0.3 + p.z);
  }, true);
  // tap: nearby petals get blown away from the finger
  document.addEventListener('pointerdown', e => {
    if (!run) return; for (const p of P) { const dx = p.x - e.clientX, dy = p.y - e.clientY, d = Math.hypot(dx, dy); if (d < 140) { const f = (1 - d / 140) * 7; p.vx += dx / (d || 1) * f; p.y += dy / (d || 1) * f * 2; p.vr += (rnd() - .5) * 0.2; } }
  }, { passive: true });
  // phone tilt pushes the wind and parallaxes the scene
  addEventListener('deviceorientation', e => { if (e.gamma == null) return; tilt = Math.max(-1.5, Math.min(1.5, e.gamma / 25)); scene.style.setProperty('--tx', (tilt * -6).toFixed(1) + 'px'); }, { passive: true });

  // ---------- petal FX: every burst / rain gets petals ----------
  function petals(x, y, n, o) {
    o = o || {};
    for (let i = 0; i < n; i++) {
      const a = o.dir != null ? o.dir + (rnd() - .5) * (o.spread || 1.6) : rnd() * TAU, s = (o.sp || 5) * (0.35 + rnd());
      FX.add({ t: 'petal', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up == null ? 1.5 : o.up), g: o.g == null ? 0.05 : o.g, l: 0, m: (o.life || 85) * (0.7 + rnd() * 0.6), r: (o.r || 8) * (0.6 + rnd() * 0.8), rot: rnd() * TAU, vr: (rnd() - .5) * 0.22, drag: 0.962, ph: rnd() * TAU, fl: rnd() * TAU, sp: pickS() });
    }
  }
  const ob = FX.burst.bind(FX), orain = FX.rain.bind(FX);
  FX.burst = function (x, y, o) {
    if (!on()) return ob(x, y, o);
    const n = o.n || 36; ob(x, y, Object.assign({}, o, { n: Math.ceil(n * 0.45) })); petals(x, y, Math.ceil(n * 0.7), { sp: (o.sp || 6) * 0.85, life: (o.life || 50) * 1.7 });
  };
  FX.rain = function (n) {
    if (!on()) return orain(n);
    orain(Math.ceil(n * 0.3));
    for (let i = 0; i < n * 1.6; i++) FX.add({ t: 'petal', x: rnd() * innerWidth * 1.2 - innerWidth * .1, y: -20 - rnd() * innerHeight * 0.8, vx: 0.6 + rnd() * 1.4, vy: 1.4 + rnd() * 2.2, g: 0.015, l: 0, m: 300, r: 7 + rnd() * 10, rot: rnd() * TAU, vr: (rnd() - .5) * 0.15, drag: 0.996, ph: rnd() * TAU, fl: rnd() * TAU, sp: pickS() });
  };
  Sakura.petals = petals; Sakura.storm = n => FX.rain(n || 60);

  // ---------- tap blossom ----------
  const FLW = '<svg viewBox="-20 -20 40 40">' + [0, 72, 144, 216, 288].map(a => '<path transform="rotate(' + a + ')" d="M0 0 C-6 -4 -8 -12 -4 -17 Q-1.5 -15 0 -15.5 Q1.5 -15 4 -17 C8 -12 6 -4 0 0Z" fill="#ffc6de" stroke="#fff" stroke-opacity=".5" stroke-width=".6"/>').join('') + '<circle r="3" fill="#ff7fb2"/></svg>';
  let lastTap = 0;
  document.addEventListener('pointerdown', e => {
    if (!mo()) return; const b = e.target.closest('button,.tap,.card,[data-w]'); if (!b) return;
    const t = performance.now(); if (t - lastTap < 90) return; lastTap = t;
    const f = document.createElement('i'); f.className = 'sk-tap'; f.innerHTML = isM() ? '<b class="mn-tap">$</b>' : FLW; f.style.left = e.clientX + 'px'; f.style.top = e.clientY + 'px'; f.style.setProperty('--r', ((rnd() - .5) * 120 | 0) + 'deg');
    document.body.appendChild(f); setTimeout(() => f.remove(), 700);
    petals(e.clientX, e.clientY, 4, { sp: 2.6, up: 1, life: 55, r: 6 });
  }, { passive: true });

  // ---------- page transitions: circle reveal from the finger ----------
  let px = innerWidth / 2, py = innerHeight - 40;
  document.addEventListener('pointerdown', e => { px = e.clientX; py = e.clientY; }, { passive: true, capture: true });
  const mob = new MutationObserver(ms => {
    for (const m of ms) {
      const el = m.target; const now = el.classList.contains('on'), was = (m.oldValue || '').split(' ').indexOf('on') >= 0;
      if (!now || was || !mo() || !el.animate) continue;
      if (el.classList.contains('view') && window.QUAL === 'lo') { petals(px, py, 6, { sp: 5, up: 2, life: 50 }); }
      else if (el.classList.contains('view')) {
        const r = el.getBoundingClientRect(), x = px - r.left, y = py - r.top, R = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y)) + 20;
        el.animate([{ clipPath: 'circle(0px at ' + x + 'px ' + y + 'px)', filter: 'brightness(1.6) saturate(1.3)' }, { clipPath: 'circle(' + R + 'px at ' + x + 'px ' + y + 'px)', filter: 'none' }], { duration: 620, easing: 'cubic-bezier(.22,.9,.25,1)' });
        petals(px, py, 16, { sp: 7, up: 2.5, life: 70 });
        const h = el.querySelector('h1'); if (h) h.animate([{ letterSpacing: '6px', opacity: 0, transform: 'translateY(8px)' }, { letterSpacing: '-.6px', opacity: 1, transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.2,.9,.2,1)' });
      } else if (el.id === 'sheet') {
        el.classList.add('sk-stag'); clearTimeout(el._skT); el._skT = setTimeout(() => el.classList.remove('sk-stag'), 1500);
        setTimeout(() => petals(innerWidth / 2, 70, 22, { dir: Math.PI / 2, spread: 2.4, sp: 6, up: 0, life: 90 }), 120);
      }
    }
  });
  $$('.view').concat([$('#sheet')]).filter(Boolean).forEach(el => mob.observe(el, { attributes: true, attributeFilter: ['class'], attributeOldValue: true }));

  // ---------- logo ----------
  const lg = $('.lg-mark'); if (lg) { const s = document.createElement('i'); s.className = 'sk-logo'; s.innerHTML = FLW; lg.appendChild(s); const m = document.createElement('i'); m.className = 'mn-logo'; m.textContent = '$'; lg.appendChild(m); }

  // ---------- settings: petal density ----------
  (function () {
    const th = $('#cfgTheme'); if (!th) return; const row = th.closest('.srow'); if (!row) return;
    const el = document.createElement('div'); el.className = 'srow sk-only'; el.innerHTML = '<div class="t"><span class="sk-lbl">🌸 Falling petals</span><span class="mn-lbl">💵 Falling cash</span></div><div class="minis" id="cfgPetals"><button data-v="0">Off</button><button data-v="1">Light</button><button data-v="2">Full</button></div>';
    row.after(el);
    const paint = () => $$('#cfgPetals button').forEach(b => b.classList.toggle('on', +b.dataset.v === CFG.petals));
    el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; CFG.petals = +b.dataset.v; A.saveC(); paint(); fill(); start(); if (CFG.petals) Sakura.storm(25); });
    paint();
    th.addEventListener('click', e => { const b = e.target.closest('button'); if (b && (b.dataset.v === 'sakura' || b.dataset.v === 'money')) setTimeout(() => { if (b.dataset.v === 'sakura') bloom(); Sakura.storm(70); start(); }, 60); else setTimeout(start, 60); });
    document.addEventListener('click', e => { if (e.target.closest('.sw[data-k="motion"]')) setTimeout(start, 80); });
  })();

  // ---------- money mode sounds: register ka-ching on buys/sells ----------
  const S = A.SND, sb = S.buy.bind(S), ss = S.sell.bind(S);
  function kaching(up) {
    const c = S.ensure(); if (!c || !CFG.snd) return; const t = c.currentTime;
    // drawer slide (filtered noise)
    const n = c.createBuffer(1, c.sampleRate * 0.12, c.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (rnd() * 2 - 1) * (1 - i / d.length);
    const src = c.createBufferSource(), bp = c.createBiquadFilter(), gv = c.createGain(); src.buffer = n; bp.type = 'bandpass'; bp.frequency.value = 2400; gv.gain.value = 0.05;
    src.connect(bp); bp.connect(gv); gv.connect(c.destination); src.start(t);
    S.tone(up ? 2637 : 1760, 0.5, 'sine', 0.06, 0.09); S.tone(up ? 3520 : 2349, 0.6, 'sine', 0.045, 0.15); S.tone(up ? 5274 : 3520, 0.25, 'triangle', 0.02, 0.15);
  }
  S.buy = () => isM() ? kaching(false) : sb(); S.sell = () => isM() ? kaching(true) : ss();
  window.Money = { retier: () => Sakura.retier() };

  // ---------- intro bloom ----------
  function bloom() { scene.classList.remove('bloom'); void scene.offsetWidth; scene.classList.add('bloom'); }
  bloom(); start();
  setTimeout(() => { if (mo() && lg) { const r = lg.getBoundingClientRect(); petals(r.left + r.width / 2, r.top + r.height / 2, 26, { dir: 0.6, spread: 1.6, sp: 7, up: 0.5, life: 110 }); } }, 900);
  setInterval(() => { if (!run) start(); }, 2000);
})();
