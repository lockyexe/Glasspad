/* Glasspad UI */
(function () {
  'use strict';
  const Sim = window.Sim;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  // ---------- storage ----------
  const LS = {
    get(k, d) { try { const v = localStorage.getItem('gp_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('gp_' + k, JSON.stringify(v)); } catch (e) { } },
    clear() { try { Object.keys(localStorage).filter(k => k.indexOf('gp_') === 0).forEach(k => localStorage.removeItem(k)); } catch (e) { } }
  };
  let W = LS.get('w', null) || { sol: 0, pos: {}, hist: [] };
  const CFG = Object.assign({ jito: 0, tp: 0, sl: 0, kolAlerts: true, quick: 0.5, slip: 30, hap: true, snd: true, motion: true, auto: true, act: 1, mode: 'real', prio: 0.001, chat: 1, theme: 'sakura', petals: 2, era: 'now', live: true, music: true, mvol: 0.5, mstyle: 'crystal' }, LS.get('cfg', {}));
  let T = {};
  function readTheme() { const cs = getComputedStyle(document.documentElement), g = k => cs.getPropertyValue(k).trim(); T = { a1: g('--a1'), a2: g('--a2'), pink: g('--pink'), buy1: g('--buy1'), buy2: g('--buy2'), a1r: g('--a1r'), a2r: g('--a2r') }; }
  const saveW = () => LS.set('w', W);
  const saveC = () => LS.set('cfg', CFG);
  // saved coins are capped (~600k chars) so the wallet key can never be starved of storage
  function saveCoins() {
    const mine = new Set((W.mine || []).slice(-12)), held = [];
    for (const id in W.pos) if (W.pos[id].tok > 0) { const c = Sim.coins.get(id); if (c) held.push([W.pos[id].tok * Sim.price(c), c]); }
    held.sort((a, b) => b[0] - a[0]);
    const list = []; mine.forEach(id => { const c = Sim.coins.get(id); if (c) list.push(c); });
    held.forEach(h => { if (list.indexOf(h[1]) < 0) list.push(h[1]); });
    let arr = list.slice(0, 40).map(Sim.ser), js = JSON.stringify(arr);
    while (js.length > 600000 && arr.length > 1) { arr.pop(); js = JSON.stringify(arr); }
    try { localStorage.setItem('gp_coins', js); } catch (e) { try { localStorage.setItem('gp_coins', JSON.stringify(arr.slice(0, 5))); } catch (e2) { } }
  }

  // ---------- format ----------
  const SUBS = '₀₁₂₃₄₅₆₇₈₉';
  function fK(n, pre) {
    pre = pre || ''; const a = Math.abs(n), s = n < 0 ? '-' : '';
    if (a >= 1e9) return s + pre + (a / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return s + pre + (a / 1e6).toFixed(2) + 'M';
    if (a >= 1e4) return s + pre + (a / 1e3).toFixed(1) + 'K';
    if (a >= 1e3) return s + pre + (a / 1e3).toFixed(2) + 'K';
    if (a >= 1) return s + pre + a.toFixed(0);
    return s + pre + a.toFixed(2);
  }
  const fUsd = n => fK(n, '$');
  function fSol(n) {
    const a = Math.abs(n);
    if (a >= 1e6) return fK(n);
    if (a >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (a >= 100) return n.toFixed(1);
    if (a >= 1) return n.toFixed(2);
    if (a >= 0.01) return n.toFixed(3);
    if (a === 0) return '0.00';
    return n.toFixed(4);
  }
  function fPrice(p) {
    if (p >= 1) return '$' + p.toFixed(3);
    if (p >= 0.0001) return '$' + p.toFixed(6);
    const e = Math.floor(Math.log10(p)); const z = -e - 1;
    const d = Math.round(p * Math.pow(10, -e + 3)).toString().slice(0, 4);
    return '$0.0' + String(z).split('').map(x => SUBS[x]).join('') + d;
  }
  function fAge(ms) { const s = Math.max(0, ms / 1000 | 0); if (s < 60) return s + 's'; const m = s / 60 | 0; if (m < 60) return m + 'm'; const h = m / 60 | 0; if (h < 24) return h + 'h'; return (h / 24 | 0) + 'd'; }
  function fPct(x) { const a = Math.abs(x); const v = a >= 1e4 ? (a / 1000).toFixed(0) + 'K' : a >= 100 ? a.toFixed(0) : a.toFixed(1); return (x >= 0 ? '+' : '-') + v + '%'; }
  const short = w => Sim.isMe(w) ? 'YOU' : Sim.PL[w] ? '@' + Sim.PL[w].u : w.slice(0, 4) + '…' + w.slice(-4);
  function setT(el, t) { if (el._t !== t) { el._t = t; el.textContent = t; } }
  function setCls(el, c, on) { if (!!el.classList.contains(c) !== !!on) el.classList.toggle(c, !!on); }
  function flashEl(el, up) { el.classList.remove('fu', 'fd'); void el.offsetWidth; el.classList.add(up ? 'fu' : 'fd'); }

  function avatar(c, size) {
    return '<div class="av" style="--h:' + c.hue + ';--s:' + size + 'px"><span class="em">' + c.emoji + '</span>' +
      (c.img ? '<img src="' + esc(c.img) + '" referrerpolicy="no-referrer" loading="lazy" onerror="this.remove()">' : '') + '</div>';
  }

  // ---------- feedback ----------
  function hap(ms) { if (!CFG.hap) return; try { if (window.Android && Android.vibrate) Android.vibrate(ms || 10); else if (navigator.vibrate) navigator.vibrate(ms || 10); } catch (e) { } }
  const SND = {
    ctx: null,
    ensure() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; },
    tone(f, d, type, g, when, f2) {
      if (!CFG.snd) return; const c = this.ensure(); if (!c) return;
      const t = c.currentTime + (when || 0), o = c.createOscillator(), v = c.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(g || 0.06, t + 0.012); v.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(v); v.connect(c.destination); o.start(t); o.stop(t + d + 0.03);
    },
    buy() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.07, i * 0.055)); this.tone(2093, 0.4, 'sine', 0.03, 0.22); },
    sell() { [1047, 1319, 1568].forEach((f, i) => this.tone(f, 0.22, 'sine', 0.06, i * 0.06)); },
    cash() { for (let i = 0; i < 9; i++) this.tone(1100 + i * 140, 0.09, 'triangle', 0.035, i * 0.045); },
    err() { this.tone(200, 0.28, 'sawtooth', 0.05, 0, 90); },
    tap() { this.tone(1400, 0.03, 'sine', 0.018); },
    ok() { this.tone(660, 0.12, 'sine', 0.06); this.tone(990, 0.25, 'sine', 0.06, 0.09); }
  };

  // ---------- FX canvas ----------
  const FX = {
    ps: [], on: false,
    init() {
      this.cv = $('#fx'); this.cx = this.cv.getContext('2d');
      const rs = () => { this.dpr = Math.min(window.QUAL === 'hi' ? 1.75 : window.QUAL === 'lo' ? 1 : 1.25, window.devicePixelRatio || 1); this.cv.width = innerWidth * this.dpr; this.cv.height = innerHeight * this.dpr; this.cx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); };
      rs(); addEventListener('resize', rs);
    },
    add(p) { if (!CFG.motion) return; this.ps.push(p); if (!this.on) { this.on = true; requestAnimationFrame(() => this.loop()); } },
    burst(x, y, o) {
      const n = o.n || 36;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = (o.sp || 6) * (0.3 + Math.random());
        this.add({ t: o.type || 'dot', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up || 0), g: o.g == null ? 0.16 : o.g, l: 0, m: (o.life || 50) * (0.6 + Math.random() * 0.6), r: (o.r || 3) * (0.5 + Math.random()), c: o.cols[i % o.cols.length], rot: Math.random() * 6, vr: 0.1 + Math.random() * 0.25, drag: o.drag || 0.955 });
      }
    },
    ring(x, y, c, max, w) { this.add({ t: 'ring', x, y, l: 0, m: 32, r: 6, max: max || 110, c, w: w || 3 }); },
    txt(x, y, s, c) { this.add({ t: 'txt', x, y, vx: 0, vy: -1.5, g: 0.012, l: 0, m: 80, s, c, drag: 0.99 }); },
    rain(n) { for (let i = 0; i < n; i++) this.add({ t: 'coin', x: Math.random() * innerWidth, y: -30 - Math.random() * innerHeight * 0.7, vx: (Math.random() - .5) * 1.2, vy: 2 + Math.random() * 3, g: 0.14, l: 0, m: 150, r: 9 + Math.random() * 9, rot: Math.random() * 6, vr: 0.08 + Math.random() * 0.2, drag: 0.996 }); },
    loop() {
      const cx = this.cx, W_ = innerWidth, H_ = innerHeight;
      cx.clearRect(0, 0, W_, H_);
      for (let i = this.ps.length - 1; i >= 0; i--) {
        const p = this.ps[i]; p.l++;
        if (p.l > p.m) { this.ps.splice(i, 1); continue; }
        const k = 1 - p.l / p.m;
        if (p.t === 'ring') {
          const e = 1 - Math.pow(1 - p.l / p.m, 3), r = p.r + (p.max - p.r) * e;
          cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = k; cx.strokeStyle = p.c; cx.lineWidth = p.w * k + 0.5;
          cx.beginPath(); cx.arc(p.x, p.y, r, 0, 6.2832); cx.stroke(); continue;
        }
        p.vx *= p.drag; p.vy *= p.drag; p.vy += p.g; p.x += p.vx; p.y += p.vy; if (p.vr) p.rot += p.vr;
        if (p.t === 'petal') { if (p.y > H_ + 40) { p.l = p.m; continue; } if (window.Sakura) Sakura.drawP(cx, p, k); continue; }
        if (p.t === 'txt') {
          cx.globalCompositeOperation = 'source-over'; cx.globalAlpha = Math.min(1, k * 2.2);
          cx.font = '900 24px system-ui,Roboto,sans-serif'; cx.textAlign = 'center'; cx.lineWidth = 4; cx.strokeStyle = 'rgba(0,0,0,.55)';
          cx.strokeText(p.s, p.x, p.y); cx.fillStyle = p.c; cx.fillText(p.s, p.x, p.y); continue;
        }
        if (p.t === 'coin') {
          if (p.y > H_ + 40) { p.l = p.m; continue; }
          cx.globalCompositeOperation = 'source-over'; cx.globalAlpha = Math.min(1, k * 3);
          cx.save(); cx.translate(p.x, p.y); const sx = Math.cos(p.rot); cx.scale(Math.abs(sx) < 0.08 ? 0.08 : sx, 1);
          const g = cx.createLinearGradient(-p.r, -p.r, p.r, p.r); g.addColorStop(0, T.a1 || '#2f6bff'); g.addColorStop(1, T.a2 || '#ff2a4d');
          cx.fillStyle = g; cx.beginPath(); cx.arc(0, 0, p.r, 0, 6.2832); cx.fill();
          cx.fillStyle = 'rgba(255,255,255,.9)'; cx.font = '900 ' + (p.r * 1.1 | 0) + 'px system-ui'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('◎', 0, 1);
          cx.restore(); continue;
        }
        cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = k; cx.fillStyle = p.c; cx.strokeStyle = p.c;
        if (p.t === 'spark') { cx.lineWidth = p.r * 0.8; cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(p.x - p.vx * 3.5, p.y - p.vy * 3.5); cx.stroke(); }
        else if (p.t === 'star') { cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); const r = p.r * 1.6; cx.beginPath(); for (let j = 0; j < 4; j++) { cx.lineTo(0, -r); cx.lineTo(r * 0.25, -r * 0.25); cx.rotate(Math.PI / 2); } cx.fill(); cx.restore(); }
        else { cx.beginPath(); cx.arc(p.x, p.y, p.r * (0.4 + k * 0.6), 0, 6.2832); cx.fill(); }
      }
      cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
      if (this.ps.length) requestAnimationFrame(() => this.loop()); else { this.on = false; cx.clearRect(0, 0, W_, H_); }
    },
    flash(col) { if (!CFG.motion) return; const f = $('#flash'); f.style.setProperty('--c', col); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); },
    fly(fromEl, toEl, html, cb) {
      if (!fromEl || !toEl || !CFG.motion) { if (cb) cb(); return; }
      const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
      const d = document.createElement('div'); d.className = 'flyer'; d.innerHTML = html; document.body.appendChild(d);
      const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
      const mx = (x0 + x1) / 2 + (x1 > x0 ? -80 : 80), my = Math.min(y0, y1) - 160;
      const bz = t => [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1];
      const dur = 850, st = performance.now();
      const step = now => {
        let t = (now - st) / dur; if (t > 1) t = 1;
        const e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const p = bz(e), sc = 1 + Math.sin(e * Math.PI) * 0.6 - e * 0.55;
        d.style.transform = 'translate(' + (p[0] - 22) + 'px,' + (p[1] - 22) + 'px) scale(' + sc + ') rotate(' + (e * 540) + 'deg)';
        if (Math.random() < 0.9) this.add({ t: 'dot', x: p[0] + (Math.random() - .5) * 10, y: p[1] + (Math.random() - .5) * 10, vx: (Math.random() - .5), vy: (Math.random() - .5), g: 0.02, l: 0, m: 26, r: 2.5 + Math.random() * 3, c: Math.random() < .5 ? T.buy1 : T.a2, drag: 0.95 });
        if (t < 1) requestAnimationFrame(step);
        else { d.remove(); toEl.classList.remove('pop'); void toEl.offsetWidth; toEl.classList.add('pop'); this.burst(x1, y1, { n: 22, cols: [T.buy1, T.a2, '#ffffff'], sp: 4, g: 0, life: 32 }); this.ring(x1, y1, T.buy1, 50, 2); if (cb) cb(); }
      };
      requestAnimationFrame(step);
    }
  };
  const center = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  // ripple on buttons
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('button,.tap'); if (!b || !CFG.motion) return;
    const r = b.getBoundingClientRect(); const s = Math.max(r.width, r.height);
    const sp = document.createElement('span'); sp.className = 'ripple';
    sp.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
    const pos = getComputedStyle(b).position; if (pos === 'static') b.style.position = 'relative';
    b.style.overflow = 'hidden'; b.appendChild(sp); setTimeout(() => sp.remove(), 650);
  }, { passive: true });

  // ---------- toast / modal ----------
  function toast(icon, title, sub, kind) {
    const box = $('#toasts'); const t = document.createElement('div');
    t.className = 'toast ' + (kind || 'info');
    t.innerHTML = '<div class="ti">' + icon + '</div><div>' + esc(title) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
    box.prepend(t); while (box.children.length > 3) box.lastChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 360); }, 2600);
  }
  function modal(title, text, btns) {
    $('#mT').textContent = title; $('#mP').textContent = text;
    const b = $('#mB'); b.innerHTML = '';
    btns.forEach(x => { const el = document.createElement('button'); el.textContent = x.t; if (x.red) el.className = 'red'; el.onclick = () => { closeModal(); if (x.f) x.f(); }; b.appendChild(el); });
    $('#modal').classList.add('on');
  }
  function closeModal() { $('#modal').classList.remove('on'); }
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

  function animNum(el, from, to, fmt, dur) {
    if (!CFG.motion) { el.textContent = fmt(to); return; }
    const st = performance.now(); dur = dur || 700; el._anim = st;
    const f = now => { if (el._anim !== st) return; let t = (now - st) / dur; if (t > 1) t = 1; const e = 1 - Math.pow(1 - t, 3); el.textContent = fmt(from + (to - from) * e); if (t < 1) requestAnimationFrame(f); else el._t = el.textContent; };
    requestAnimationFrame(f);
  }

  // ---------- segmented control indicator ----------
  function segInd(seg) {
    const on = $('button.on', seg), ind = $('.seg-ind', seg); if (!on || !ind) return;
    ind.style.left = on.offsetLeft + 'px'; ind.style.width = on.offsetWidth + 'px';
  }
  function bindSeg(seg, cb) {
    seg.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('button', seg).forEach(x => x.classList.toggle('on', x === b)); segInd(seg); hap(6); SND.tap(); cb(b.dataset.k, b);
    });
  }

  // ---------- keyed list sync ----------
  function sync(box, items, make, upd) {
    const map = box._m || (box._m = new Map()); const seen = new Set(); let prev = null;
    for (let i = 0; i < items.length; i++) {
      const it = items[i]; let el = map.get(it.id);
      if (!el) { el = make(it); if (box._init) el.classList.add('enter'); map.set(it.id, el); el.addEventListener('animationend', function f(ev) { if (ev.animationName === 'enter' || ev.animationName === 'trIn') el.classList.remove('enter'); }); }
      seen.add(it.id); upd(el, it);
      const want = prev ? prev.nextSibling : box.firstChild;
      if (el !== want) box.insertBefore(el, want);
      prev = el;
    }
    for (const [id, el] of map) if (!seen.has(id)) { el.remove(); map.delete(id); }
    box._init = true;
  }

  // ---------- nav ----------
  let VIEW = 'pulse';
  function navInd() { const b = $('#nav button.on'), ind = $('.nav-ind'); if (!b) { ind.style.opacity = 0; return; } ind.style.opacity = 1; ind.style.left = (b.offsetLeft + 6) + 'px'; ind.style.width = (b.offsetWidth - 12) + 'px'; }
  function go(v) {
    if (v === VIEW) { const s = $('#v-' + v); s.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    VIEW = v; $$('.view').forEach(x => x.classList.toggle('on', x.id === 'v-' + v));
    $$('#nav button').forEach(x => x.classList.toggle('on', x.dataset.v === v)); navInd(); hap(8); SND.tap();
    if (v === 'port') { $('#pBadge').classList.remove('on'); }
    renderView(true);
  }
  $('#nav').addEventListener('click', e => { const b = e.target.closest('button'); if (b) go(b.dataset.v); });
  $('#balPill').addEventListener('click', () => go('port'));
  $('#gearBtn').addEventListener('click', () => go('set'));
  // ---------- music ----------
  function startMusic() { const ctx = SND.ensure(); if (!ctx) return; Music.attach(ctx); Music.setVol(CFG.mvol); if (!Music.on) Music.play(); }
  function renderMus() {
    const T = Music.track; setT($('#musName'), T.name); setT($('#musMeta'), T.bpm + ' BPM · ' + T.key);
    $('#musPlay').textContent = Music.on ? '⏸' : '▶'; $('#musShuf').classList.toggle('on', Music.shuffle);
    $('#musBtn').classList.toggle('on', Music.on);
    const l = $('#musList');
    if (l._b !== Music.style) { l.innerHTML = Music.TRACKS.map((t, i) => '<button data-i="' + i + '"><span class="mn">' + String(i + 1).padStart(2, '0') + '</span><b>' + esc(t.name) + '</b><span class="mu">' + t.bpm + ' · ' + t.key.split(' ')[0] + '</span></button>').join(''); l._b = Music.style; }
    $$('#musList button').forEach(b => b.classList.toggle('on', +b.dataset.i === Music.idx));
  }
  Music.onChange = () => { renderMus(); if (VIEW === 'set') renderSettings(); };
  $('#musBtn').addEventListener('click', () => { SND.ensure(); Music.attach(SND.ctx); renderMus(); $('#mus').classList.add('on'); hap(8); const on = $('#musList button.on'); if (on) on.scrollIntoView({ block: 'center' }); });
  $('#musClose').addEventListener('click', () => $('#mus').classList.remove('on'));
  $('#mus').addEventListener('click', e => { if (e.target.id === 'mus') $('#mus').classList.remove('on'); });
  $('#musPlay').addEventListener('click', () => { startMusicCtx(); Music.toggle(); CFG.music = Music.on; saveC(); hap(8); });
  $('#musNext').addEventListener('click', () => { startMusicCtx(); Music.next(); CFG.music = true; saveC(); hap(8); });
  $('#musPrev').addEventListener('click', () => { startMusicCtx(); Music.prev(); CFG.music = true; saveC(); hap(8); });
  $('#musShuf').addEventListener('click', () => { Music.shuffle = !Music.shuffle; renderMus(); hap(6); });
  $('#musList').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; startMusicCtx(); Music.play(+b.dataset.i); CFG.music = true; saveC(); hap(8); });
  function startMusicCtx() { const ctx = SND.ensure(); if (ctx) { Music.attach(ctx); Music.setVol(CFG.mvol); } }

  // ---------- header ----------
  let shownBal = W.sol;
  function renderBal(animate) {
    const el = $('#balTxt'), el2 = $('#sBal');
    if (animate && shownBal !== W.sol) { animNum(el, shownBal, W.sol, fSol); animNum(el2, shownBal, W.sol, fSol); $('#balPill').classList.remove('pop'); void $('#balPill').offsetWidth; $('#balPill').classList.add('pop'); }
    else if (!el._anim || shownBal === W.sol) { setT(el, fSol(W.sol)); setT(el2, fSol(W.sol)); }
    shownBal = W.sol;
  }

  // ---------- PULSE ----------
  let pSeg = 'new', query = '';
  bindSeg($('#pSeg'), k => { pSeg = k; $('#pList')._init = false; renderPulse(); $('#v-pulse').scrollTop = 0; });
  $('#q').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); renderPulse(); });

  function makeCard(c) {
    const el = document.createElement('div'); el.className = 'card glass'; el.dataset.id = c.id;
    const soc = '<span class="soc"><svg viewBox="0 0 24 24"><path d="M4 4l16 16M20 4L4 20"/></svg><svg viewBox="0 0 24 24"><path d="M21 4L3 11l6 2 2 6 3-4 5 4z"/></svg><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg></span>';
    el.innerHTML = '<div class="cl"><div class="ring">' + avatar(c, 46) + '</div><span class="age"></span></div>' +
      '<div class="mid"><div class="r1"><b class="nm">' + esc(c.name) + '</b><span class="sy">' + esc(c.sym) + '</span><span class="badge"></span></div>' +
      '<div class="r2">' + soc + '<span class="k">V</span><b class="vo"></b><span class="k">👥</span><b class="ho"></b><span class="k">TX</span><b class="tx"></b></div>' +
      '<div class="cxs"><i class="cx t10"></i><i class="cx dv"></i><i class="cx sn"></i><i class="cx ins"></i><i class="cx fk"></i><i class="cx bv"></i><i class="cx cn"></i></div></div>' +
      '<div class="rt"><div><span class="mcl">MC</span><span class="mc"></span></div><span class="pct"></span><button class="qb">⚡ <span class="qa"></span></button></div><i class="pbar"><b></b></i>';
    el._r = { ring: $('.ring', el), badge: $('.badge', el), age: $('.age', el), ho: $('.ho', el), tx: $('.tx', el), vo: $('.vo', el), dv: $('.dv', el), mc: $('.mc', el), pct: $('.pct', el), qa: $('.qa', el), cn: $('.cn', el), fk: $('.fk', el), bv: $('.bv', el), t10: $('.t10', el), sn: $('.sn', el), ins: $('.ins', el), pb: $('.pbar b', el) };
    return el;
  }
  const VIS = window.IntersectionObserver ? new IntersectionObserver(es => es.forEach(e => { const el = e.target; el._off = !e.isIntersecting; if (e.isIntersecting) { const c = Sim.coins.get(el.dataset.id); if (c) updCard(el, c); } }), { rootMargin: '250px 0px' }) : null;
  function updCard(el, c) {
    if (!el._io && VIS) { el._io = 1; VIS.observe(el); }
    if (el._off && el._r.mc._t) return;
    const r = el._r, m = Sim.mcUsd(c), p = Sim.progress(c), ch = Sim.change(c, 300);
    const pi = Math.round(p);
    if (r.ring._p !== pi) { r.ring._p = pi; r.ring.style.setProperty('--p', pi); }
    setCls(r.ring, 'grad', c.grad);
    setT(r.age, fAge(Sim.t - c.born));
    setT(r.ho, String(c.hk.length));
    setT(r.tx, fK(c.buys + c.sells));
    setT(r.vo, fUsd(c.vol * Sim.solUsd));
    setT(r.cn, '💬 ' + (c.cmN < 1000 ? String(c.cmN) : fK(c.cmN)));
    if (!el._st || Sim.t - el._stT > 1500) { el._st = Sim.stats(c); el._stT = Sim.t; }
    const st = el._st, chip = (e, txt, bad, good) => { setT(e, txt); setCls(e, 'bad', bad); setCls(e, 'good', good); };
    chip(r.t10, '🔟 ' + st.top10.toFixed(0) + '%', st.top10 > 40, st.top10 < 22);
    chip(r.dv, st.dev > 0 ? '👨‍💻 ' + st.dev.toFixed(1) + '%' : '👨‍💻 sold', st.dev > 5, st.dev === 0 && !c.rug);
    chip(r.sn, '🎯 ' + st.snipers.toFixed(0) + '%', st.snipers > 15, st.snipers < 5);
    chip(r.ins, '📦 ' + st.insiders.toFixed(0) + '%', st.insiders > 10, st.insiders === 0);
    chip(r.fk, '👻 ' + st.dust + ' fake', true, false); setCls(r.fk, 'hide', !st.dust);
    chip(r.bv, '🔁 ' + st.botVol.toFixed(0) + '% bot vol', st.botVol > 20, false); setCls(r.bv, 'hide', st.botVol < 8);
    r.pb.style.width = p.toFixed(1) + '%'; setCls(r.pb, 'full', c.grad);
    const mt = fUsd(m);
    if (r.mc._t !== mt) { if (r.mc._v != null && Math.abs(m - r.mc._v) / r.mc._v > 0.002) flashEl(r.mc, m > r.mc._v); r.mc._v = m; setT(r.mc, mt); }
    setT(r.pct, fPct(ch)); setCls(r.pct, 'up', ch >= 0); setCls(r.pct, 'dn', ch < 0);
    setT(r.qa, String(CFG.quick));
    const b = (c.rug ? '<span class="tag rug">' + (c.cto ? 'CTO' : 'RUGGED') + '</span>' : c.grad ? '<span class="tag grad">🎓</span>' : (W.pos[c.id] && W.pos[c.id].tok > 0 ? '<span class="tag ok">HOLDING</span>' : '')) + (c.dexPaid ? '<span class="tag dx">💊</span>' : '') + (c.boosts ? '<span class="tag bst">⚡' + c.boosts + '</span>' : '') + (c.cto && !c.rug ? '<span class="tag ok">CTO</span>' : '');
    if (r.badge._h !== b) { r.badge._h = b; r.badge.innerHTML = b; }
    setCls(el, 'hot', !c.rug && Sim.t - c.born > 45000 && Sim.change(c, 30) > 25);
    setCls(el, 'rug', c.rug); setCls(el, 'dead', c.dead);
  }
  function renderPulse() {
    const trk = pSeg === 'trk'; $('#pList').style.display = trk ? 'none' : ''; const tb = $('#trkBox'); if (tb) { tb.style.display = trk ? '' : 'none'; if (trk && window.Pro) window.Pro.renderTracker(tb); }
    const g = { new: [], fin: [], mig: [] };
    for (const c of Sim.list) {
      if (query && c.name.toLowerCase().indexOf(query) < 0 && c.sym.toLowerCase().indexOf(query) < 0) continue;
      if (c.grad) g.mig.push(c); else if (Sim.progress(c) >= 45) g.fin.push(c); else if (!c.dead || query) g.new.push(c);
    }
    g.fin.sort((a, b) => b.vSol - a.vSol); g.mig.sort((a, b) => b.gradAt - a.gradAt);
    setT($('#cN'), String(g.new.length)); setT($('#cF'), String(g.fin.length)); setT($('#cM'), String(g.mig.length));
    const items = (g[pSeg] || []).slice(0, 40);
    if (!trk) sync($('#pList'), items, makeCard, updCard);
    $('#pEmpty').style.display = items.length || trk ? 'none' : 'block';
    setT($('#liveStats'), Sim.list.length + ' pairs');
    const ms = $('#mStats'), bonded = Sim.list.filter(c => c.grad && Sim.t - c.gradAt < 3600e3).length;
    const solTxt = 'SOL $' + Sim.solUsd.toFixed(2) + (HEAT.sol != null && CFG.era !== 'prime' ? ' <em class="' + (HEAT.sol >= 0 ? 'up' : 'dn') + '">' + fPct(HEAT.sol) + '</em>' : '');
    const h = '<div><span>Solana</span><b>' + solTxt + '</b></div><div><span>Launches/min</span><b>' + Sim.spawnTimes.length + '</b></div><div><span>Bonded 1h</span><b>' + bonded + '</b></div><div><span>Trades/min</span><b>' + fK(Sim.txWindow.length) + '</b></div>';
    if (ms._h !== h) { ms._h = h; ms.innerHTML = h; }
  }
  function listClick(e) {
    const qb = e.target.closest('.qb'); const card = e.target.closest('[data-id]'); if (!card) return;
    const c = Sim.coins.get(card.dataset.id); if (!c) return;
    if (qb) { e.stopPropagation(); userBuy(c, CFG.quick, qb, $('.av', card)); return; }
    openToken(c);
  }
  $('#pList').addEventListener('click', listClick);
  $('#tList').addEventListener('click', listClick);
  $('#hList').addEventListener('click', listClick);

  // ---------- TRENDING ----------
  let tSort = 'vol';
  $('#tChips').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('#tChips button').forEach(x => x.classList.toggle('on', x === b)); tSort = b.dataset.k; hap(6); SND.tap();
    $('#tList')._init = false; renderTrend();
  });
  function spark(c, n) {
    const cd = c.candles, nowS = Math.floor(Sim.t / 1000), pts = [];
    let j = cd.length - 1, last = cd.length ? cd[cd.length - 1][4] : c.m0;
    const vals = [];
    for (let s = nowS; s > nowS - n; s--) { while (j >= 0 && cd[j][0] > s) j--; vals.push(j >= 0 ? cd[j][4] : c.m0); }
    vals.reverse();
    let lo = Infinity, hi = -Infinity; vals.forEach(v => { if (v < lo) lo = v; if (v > hi) hi = v; });
    const rg = hi - lo || 1;
    vals.forEach((v, i) => pts.push((i / (n - 1) * 62).toFixed(1) + ',' + (26 - (v - lo) / rg * 24).toFixed(1)));
    return { d: 'M' + pts.join('L'), up: vals[vals.length - 1] >= vals[0], last };
  }
  function makeRow(c) {
    const el = document.createElement('div'); el.className = 'card glass trow'; el.dataset.id = c.id;
    el.innerHTML = '<span class="rank"></span>' + avatar(c, 40) +
      '<div class="mid"><div class="r1"><b class="nm">' + esc(c.name) + '</b><span class="sy">' + esc(c.sym) + '</span></div>' +
      '<div class="r2"><span>MC <b class="mc2"></b></span><span>V <b class="vo"></b></span></div></div>' +
      '<svg class="spark" viewBox="0 0 62 28"><path/></svg><div class="rt"><span class="pct"></span><button class="qb">⚡ <span class="qa"></span></button></div>';
    el._r = { rank: $('.rank', el), mc: $('.mc2', el), vo: $('.vo', el), path: $('path', el), pct: $('.pct', el), qa: $('.qa', el) };
    return el;
  }
  function updRow(el, c) {
    const r = el._r; const ch = Sim.change(c, 300);
    setT(r.rank, String(el._rank)); setT(r.mc, fUsd(Sim.mcUsd(c))); setT(r.vo, fUsd(Sim.volSince(c, 300) * Sim.solUsd));
    const s = spark(c, 60); r.path.setAttribute('d', s.d); r.path.style.stroke = s.up ? 'var(--gr)' : 'var(--rd)';
    setT(r.pct, fPct(ch)); setCls(r.pct, 'up', ch >= 0); setCls(r.pct, 'dn', ch < 0); setT(r.qa, String(CFG.quick));
  }
  function renderTrend() {
    const arr = Sim.list.filter(c => !c.dead);
    const key = {
      vol: c => Sim.volSince(c, 300), gain: c => Sim.change(c, 300), lose: c => -Sim.change(c, 300),
      mc: c => Sim.mc(c), hold: c => c.hk.length
    }[tSort];
    const scored = arr.map(c => [key(c), c]).sort((a, b) => b[0] - a[0]).slice(0, 30).map(x => x[1]);
    scored.forEach((c, i) => { const el = $('#tList')._m && $('#tList')._m.get(c.id); if (el) el._rank = i + 1; c._rank = i + 1; });
    sync($('#tList'), scored, c => { const el = makeRow(c); el._rank = c._rank; return el; }, (el, c) => { el._rank = c._rank; updRow(el, c); });
  }

  // ---------- PORTFOLIO ----------
  function posVal(c, p) { return p.tok > 0 ? p.tok * Sim.price(c) : 0; }
  function portfolio() {
    let inv = 0, pnl = 0; const held = [];
    for (const id in W.pos) {
      const p = W.pos[id], c = Sim.coins.get(id);
      const v = c ? posVal(c, p) : 0; inv += v; pnl += v + p.out - p.in;
      if (c && p.tok > 0) held.push(c);
    }
    return { inv, pnl, held };
  }
  function makeHold(c) {
    const el = document.createElement('div'); el.className = 'card glass hrow'; el.dataset.id = c.id;
    el.innerHTML = avatar(c, 42) + '<div class="mid"><div class="r1"><b class="nm">' + esc(c.name) + '</b><span class="sy">' + esc(c.sym) + '</span></div><div class="r2"><span>MC <b class="m"></b></span><span class="tk"></span></div></div>' +
      '<div class="rt"><b class="v num"></b><span class="pct"></span></div>';
    el._r = { m: $('.m', el), tk: $('.tk', el), v: $('.v', el), pct: $('.pct', el) };
    return el;
  }
  function updHold(el, c) {
    const p = W.pos[c.id], r = el._r, v = posVal(c, p), pn = v + p.out - p.in, pc = p.in ? pn / p.in * 100 : 0;
    setT(r.m, fUsd(Sim.mcUsd(c))); setT(r.tk, fK(p.tok) + ' ' + c.sym); setT(r.v, '◎ ' + fSol(v));
    setT(r.pct, (pn >= 0 ? '+' : '') + fSol(pn) + ' (' + fPct(pc) + ')'); setCls(r.pct, 'up', pn >= 0); setCls(r.pct, 'dn', pn < 0);
  }
  function drawPf() {
    const cv = $('#pfChart'), d = W.nwh || []; if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), r = cv.getBoundingClientRect(), w = r.width, h = r.height; if (!w) return;
    cv.width = w * dpr; cv.height = h * dpr; const cx = cv.getContext('2d'); cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, w, h);
    if (d.length < 2) { cx.fillStyle = 'rgba(180,185,215,.5)'; cx.font = '500 12px Inter,system-ui'; cx.textAlign = 'center'; cx.fillText('Chart builds up as you trade', w / 2, h / 2); return; }
    let lo = Infinity, hi = -Infinity; d.forEach(p => { if (p[1] < lo) lo = p[1]; if (p[1] > hi) hi = p[1]; }); if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
    const t0 = d[0][0], t1 = d[d.length - 1][0], X = t => (t - t0) / Math.max(1, t1 - t0) * (w - 8) + 4, Y = v => 8 + (1 - (v - lo) / (hi - lo)) * (h - 16);
    const up = d[d.length - 1][1] >= d[0][1], col = up ? '#22f0a0' : '#ff4d6d';
    const g = cx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, up ? 'rgba(34,240,160,.3)' : 'rgba(255,77,109,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    cx.beginPath(); d.forEach((p, i) => i ? cx.lineTo(X(p[0]), Y(p[1])) : cx.moveTo(X(p[0]), Y(p[1]))); cx.lineTo(X(t1), h); cx.lineTo(X(t0), h); cx.closePath(); cx.fillStyle = g; cx.fill();
    cx.beginPath(); d.forEach((p, i) => i ? cx.lineTo(X(p[0]), Y(p[1])) : cx.moveTo(X(p[0]), Y(p[1]))); cx.strokeStyle = col; cx.lineWidth = 2; cx.stroke();
    setT($('#pcRange'), fAge(Date.now() - t0) + ' · ' + (up ? '+' : '') + fSol(d[d.length - 1][1] - d[0][1]) + ' SOL');
  }
  function renderPort() {
    const P = portfolio(), tot = W.sol + P.inv;
    let real = 0, wins = 0, closed = 0, best = null, n = 0;
    for (const id in W.pos) { const p = W.pos[id]; n++; if (p.tok <= 0 && p.in > 0) { closed++; const pn = p.out - p.in; real += pn; if (pn > 0) wins++; const c = Sim.coins.get(id); if (!best || pn > best[0]) best = [pn, c ? c.sym : '?']; } }
    const pr = $('#ptReal'); setT(pr, (real >= 0 ? '+' : '') + fSol(real)); setCls(pr, 'up', real > 0); setCls(pr, 'dn', real < 0);
    setT($('#ptWin'), closed ? Math.round(wins / closed * 100) + '%' : '–'); setT($('#ptBest'), best ? (best[0] >= 0 ? '+' : '') + fSol(best[0]) + ' ' + best[1] : '–'); setT($('#ptN'), String(W.hist.filter(x => x.k !== 'dep').length));
    if (!$('#pfChart')._t || Date.now() - $('#pfChart')._t > 2000) { $('#pfChart')._t = Date.now(); drawPf(); }
    setT($('#pfTot'), fSol(tot)); setT($('#pfUsd'), '$' + (tot * Sim.solUsd).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }));
    setT($('#pfCash'), '◎ ' + fSol(W.sol)); setT($('#pfInv'), '◎ ' + fSol(P.inv));
    const pe = $('#pfPnl'); setT(pe, (P.pnl >= 0 ? '+' : '') + fSol(P.pnl)); setCls(pe, 'up', P.pnl >= 0); setCls(pe, 'dn', P.pnl < 0);
    sync($('#hList'), P.held, makeHold, updHold);
    $('#hEmpty').style.display = P.held.length ? 'none' : 'block';
    const a = $('#aList'), h = W.hist.slice(0, 25);
    const key = h.length ? h[0].t + ':' + h.length : 'e';
    if (a._k !== key || a._tick !== (Sim.t / 10000 | 0)) {
      a._k = key; a._tick = Sim.t / 10000 | 0;
      a.innerHTML = h.length ? h.map(x => {
        const k = x.k === 'dep' ? 'd' : x.side ? 'b' : 's';
        const t = x.k === 'dep' ? 'Added balance' : (x.side ? 'Bought ' : 'Sold ') + esc(x.sym);
        const amt = x.k === 'dep' ? '+◎ ' + fSol(x.sol) : (x.side ? '-◎ ' : '+◎ ') + fSol(x.sol);
        return '<div class="act"><span class="ic ' + k + '">' + (k === 'd' ? '+' : k === 'b' ? 'B' : 'S') + '</span><div style="flex:1;min-width:0"><b>' + t + '</b><div class="mu" style="font-size:11px">' + (x.k === 'dep' ? '' : 'at ' + fUsd(x.mc) + ' MC · ') + fAge(Date.now() - x.t) + ' ago</div></div><b class="num ' + (k === 's' || k === 'd' ? 'up' : '') + '">' + amt + '</b></div>';
      }).join('') : '<div class="empty" style="padding:18px">No activity yet</div>';
    }
  }

  // ---------- SETTINGS ----------
  function renderSettings() {
    $$('.sw[data-k]').forEach(s => s.classList.toggle('on', !!CFG[s.dataset.k]));
    $$('#cfgSlip button').forEach(b => b.classList.toggle('on', +b.dataset.v === CFG.slip));
    $$('#cfgAct button').forEach(b => b.classList.toggle('on', +b.dataset.v === CFG.act));
    if (document.activeElement !== $('#cfgQuick')) $('#cfgQuick').value = CFG.quick;
    if (document.activeElement !== $('#cfgPrio')) $('#cfgPrio').value = CFG.prio;
    $$('#cfgMode button').forEach(b => b.classList.toggle('on', b.dataset.v === CFG.mode));
    $$('#cfgChat button').forEach(b => b.classList.toggle('on', +b.dataset.v === CFG.chat));
    $$('#cfgTheme button').forEach(b => b.classList.toggle('on', b.dataset.v === CFG.theme));
    $$('#cfgEra button').forEach(b => b.classList.toggle('on', b.dataset.v === CFG.era));
    $$('#cfgMStyle button').forEach(b => b.classList.toggle('on', b.dataset.v === CFG.mstyle));
    setT($('#eraD'), CFG.era === 'prime' ? 'Nov 2024–Jan 2025: ~72k launches/day, SOL ~$240, max euphoria' : '2026: ~37k launches/day, ~1–2% bond, tired trenches');
    $('#heatD').textContent = CFG.era === 'prime' ? 'Prime era runs at a fixed hot 1.25x' : 'Heat ' + Sim.heat.toFixed(2) + 'x · ' + (HEAT.sol != null ? 'SOL ' + fPct(HEAT.sol) + ' 24h · ' : '') + (HEAT.tx != null ? 'avg ' + fK(HEAT.tx) + ' tx/h per pair · ' : '') + 'time of day ' + HEAT.tod.toFixed(2) + 'x';
    setT($('#musD'), Music.on ? '▶ ' + Music.track.name + ' · ' + Music.track.bpm + ' BPM' : '50 original ' + Music.style + ' beats');
    if (document.activeElement !== $('#musVol')) $('#musVol').value = Math.round(CFG.mvol * 100);
    if (document.activeElement !== $('#cfgHandle')) $('#cfgHandle').value = '@' + ((W.x && W.x.handle) || '');
    $('#prioRow').style.display = CFG.mode === 'real' ? '' : 'none';
    setT($('#modeD'), CFG.mode === 'real' ? 'Fees, failed txs, MEV bots, ~3% of coins migrate' : 'No fees, more winners, easier');
    const n = Sim.pool.length;
    $('#dsStat').innerHTML = Data.ok ? '<span class="dot on"></span>Connected · ' + n.toLocaleString() + ' real tokens loaded · SOL $' + Sim.solUsd.toFixed(2) : '<span class="dot off"></span>Offline: using generated names';
  }
  $$('.sw[data-k]').forEach(s => s.addEventListener('click', () => {
    const k = s.dataset.k; CFG[k] = !CFG[k]; saveC(); applyCfg(); renderSettings(); hap(10); SND.tap();
    if (k === 'music') { if (CFG.music) startMusic(); else Music.stop(); }
  }));
  $('#cfgSlip').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; CFG.slip = +b.dataset.v; saveC(); renderSettings(); hap(6); });
  $('#cfgAct').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; CFG.act = +b.dataset.v; saveC(); applyCfg(); renderSettings(); hap(6); });
  $('#cfgMode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; CFG.mode = b.dataset.v; saveC(); applyCfg(); renderSettings(); hap(6); SND.tap(); toast(CFG.mode === 'real' ? '🧠' : '🕹️', CFG.mode === 'real' ? 'Realistic mode' : 'Arcade mode', CFG.mode === 'real' ? 'New launches follow real-world odds' : 'More winners, no fees', 'info'); });
  $('#cfgChat').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; CFG.chat = +b.dataset.v; saveC(); applyCfg(); renderSettings(); hap(6); SND.tap(); });
  $('#cfgTheme').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; CFG.theme = b.dataset.v; saveC(); applyCfg(); renderSettings(); hap(10); SND.ok(); FX.flash(T.a1); });
  $('#cfgEra').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; CFG.era = b.dataset.v; saveC(); applyCfg(); renderSettings(); hap(10); SND.ok(); toast(CFG.era === 'prime' ? '👑' : '📉', CFG.era === 'prime' ? 'Prime era activated' : 'Back to now', CFG.era === 'prime' ? 'Peak trenches: more launches, SOL $240, max hype' : 'Tired trenches, real 2026 odds', 'info'); });
  $('#cfgMStyle').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; CFG.mstyle = b.dataset.v; saveC(); applyCfg(); renderSettings(); hap(8); SND.tap(); if (CFG.music) startMusic(); });
  $('#musVol').addEventListener('input', e => { CFG.mvol = e.target.value / 100; Music.setVol(CFG.mvol); saveC(); });
  $('#cfgHandle').addEventListener('change', e => { const v = e.target.value.replace(/[^A-Za-z0-9_]/g, '').slice(0, 15); if (v.length >= 3 && W.x) { W.x.handle = v; saveW(); applyCfg(); } renderSettings(); });
  $('#cfgPrio').addEventListener('change', e => { const v = parseFloat(e.target.value); if (v >= 0 && v <= 1) { CFG.prio = v; saveC(); } renderSettings(); });
  $('#cfgQuick').addEventListener('change', e => { const v = parseFloat(e.target.value); if (v > 0) { CFG.quick = Math.round(v * 1000) / 1000; saveC(); } renderSettings(); });
  function applyCfg() {
    document.documentElement.className = 'th-' + CFG.theme + ' q-' + (window.QUAL || 'mid') + (window.IOS_CLS || ''); readTheme(); document.body.classList.toggle('nomotion', !CFG.motion);
    Sim.act = CFG.act; Sim.mode = CFG.mode; Sim.chat = CFG.chat; Sim.era = CFG.era;
    Sim.solUsd = CFG.era === 'prime' ? Sim.ERA.prime.sol : Sim.liveSol;
    Sim.rep = W.rep || 0; Sim.devName = (W.x && W.x.handle) || 'you';
    updHeat();
    if (window.Music) { Music.setStyle(CFG.mstyle); Music.setVol(CFG.mvol); }
  }
  // live market heat: DexScreener activity + SOL momentum + time of day (launch activity peaks during US hours)
  const HEAT = { sol: null, tx: null, val: 1, tod: 1 };
  function updHeat() {
    const h = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
    HEAT.tod = 0.85 + 0.17 * (Math.cos((h - 18) / 24 * Math.PI * 2) + 1) / 2 * 2;
    let v = HEAT.tod;
    if (HEAT.sol != null) v *= clamp(1 + HEAT.sol / 25, 0.7, 1.4);
    if (HEAT.tx != null) v *= clamp(1 + Math.log10(Math.max(30, HEAT.tx) / 400) / 2.5, 0.75, 1.4);
    HEAT.val = clamp(v, 0.5, 2);
    Sim.heat = CFG.era === 'prime' ? 1.25 : (CFG.live ? HEAT.val : 1);
  }

  $('#addPre').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const inp = $('#addAmt'); inp.value = String((parseFloat(inp.value) || 0) + (+b.dataset.v)); hap(6); SND.tap();
  });
  $('#addGo').addEventListener('click', () => {
    const inp = $('#addAmt'); const v = parseFloat(String(inp.value).replace(',', '.'));
    if (!(v > 0) || !isFinite(v)) { SND.err(); hap(40); toast('⚠️', 'Enter an amount', null, 'bad'); return; }
    const amt = Math.min(v, 1e12);
    W.sol += amt; W.hist.unshift({ k: 'dep', sol: amt, t: Date.now() }); if (W.hist.length > 200) W.hist.length = 200; saveW();
    inp.value = ''; inp.blur();
    renderBal(true); FX.rain(Math.min(90, 25 + Math.log10(amt + 1) * 15)); FX.flash(T.a1);
    const [x, y] = center($('#addGo')); FX.burst(x, y, { n: 50, cols: [T.a1, T.a2, '#ffffff', T.pink], sp: 8, type: 'star', life: 55 }); FX.ring(x, y, T.pink, 160, 4);
    SND.cash(); hap(30);
    toast('◎', 'Added ' + fSol(amt) + ' SOL', 'New balance ◎ ' + fSol(W.sol), 'ok');
  });
  $('#resetW').addEventListener('click', () => modal('Reset wallet?', 'This clears your balance, positions and history.', [
    { t: 'Cancel' }, { t: 'Reset', red: true, f: () => { const keepX = W.x, keepRep = W.rep; W = { sol: 0, pos: {}, hist: [], x: keepX, rep: keepRep }; if (App.life) App.life.normW(); saveW(); LS.set('coins', []); Sim.list.forEach(c => c.keep = false); renderBal(true); renderView(true); toast('🧹', 'Wallet reset', null, 'info'); } }
  ]));
  $('#dsRef').addEventListener('click', () => { toast('🔄', 'Refreshing DexScreener…'); Data.refresh().then(() => { renderSettings(); toast('✅', Sim.pool.length + ' real tokens loaded', null, 'ok'); }); });

  // ---------- TRADING ----------
  function pos(id) { return W.pos[id] || (W.pos[id] = { tok: 0, in: 0, out: 0 }); }
  // ---------- realistic execution ----------
  // A tx takes time to land. Speed and drop rate depend on priority fee, Jito tip and how busy the chain is.
  // Your quote is locked when you tap; if the price moves past your slippage before it lands, it fails (fees are gone).
  const PEND = [];
  function landTime() {
    if (CFG.mode !== 'real') return { ms: 0, drop: 0 };
    const p = (+CFG.prio || 0) + (+CFG.jito || 0) * 1.5, h = Math.max(.6, Sim.heat || 1);
    let lo, hi, drop;
    if (p >= .01) { lo = 250; hi = 700; drop = .003; } else if (p >= .003) { lo = 400; hi = 1300; drop = .008; } else if (p >= .001) { lo = 700; hi = 2200; drop = .02; } else if (p >= .0003) { lo = 1400; hi = 4500; drop = .05; } else { lo = 3000; hi = 9000; drop = .12; }
    return { ms: (lo + Math.random() * (hi - lo)) * Math.pow(h, .6), drop: Math.min(.4, drop * h), est: (lo + hi) / 2 * Math.pow(h, .6) };
  }
  function renderPend() { const el = $('#tPend'); if (!el) return; const L = PEND.filter(x => OPEN && x.c === OPEN); const h = L.map(x => '<span class="pend ' + (x.side ? 'b' : 's') + '"><i></i>' + (x.side ? 'Buying ◎' + fSol(x.sol) : 'Selling ' + Math.round(x.frac * 100) + '%') + (x.why ? ' · ' + x.why : '') + '</span>').join(''); if (el._h !== h) { el._h = h; el.innerHTML = h; } }
  function pendAdd(o) { PEND.push(o); renderPend(); } function pendDel(o) { const i = PEND.indexOf(o); if (i >= 0) PEND.splice(i, 1); renderPend(); }
  const fees = () => CFG.mode === 'real' ? { prio: +CFG.prio || 0, tip: +CFG.jito || 0, base: 0.000005 } : { prio: 0, tip: 0, base: 0 };
  function userBuy(c, sol, btn, avEl, o) {
    o = o || {}; sol = +sol;
    const real = CFG.mode === 'real', F = fees(), fee = F.prio + F.tip + F.base;
    if (!(sol > 0)) { SND.err(); toast('⚠️', 'Enter an amount', null, 'bad'); return false; }
    if (sol + fee > W.sol + 1e-9) {
      SND.err(); hap(60);
      toast('◎', 'Insufficient SOL', 'Add balance in Settings', 'bad');
      if (btn) { btn.style.animation = 'shake .4s'; setTimeout(() => btn.style.animation = '', 420); }
      return false;
    }
    const q0 = Sim.quoteBuy(c, sol), slip = CFG.slip, L = o.instant ? { ms: 0, drop: 0 } : Sim.mp ? { ms: 0, drop: landTime().drop } : landTime(), t0 = Date.now();
    W.sol -= sol + fee; saveW(); renderBal(true); c.keep = true;
    if (btn && btn.isConnected) { const [x, y] = center(btn); FX.ring(x, y, T.buy1, 70, 2); }
    hap(10);
    const P = { c, side: 1, sol, why: o.why || '' };
    const land = () => {
      if (!Sim.mp) pendDel(P);
      let secs = ((Date.now() - t0) / 1000).toFixed(1);
      if (real && Math.random() < L.drop) { pendDel(P); W.sol += sol; saveW(); renderBal(true); SND.err(); hap(60); toast('❌', 'Buy didn\'t land', 'Dropped in a busy block after ' + secs + 's. Fees lost (◎ ' + fSol(fee) + '). Higher priority fee = fewer drops', 'bad'); return; }
      const sandwich = real && !F.tip && slip >= 10 && sol >= 0.25 && Math.random() < 0.3;
      Sim.cmd({ k: 'buy', cid: c.id, sol, min: real && slip < 100 ? q0 * (1 - slip / 100) : 0, sw: sandwich, mp: Math.min(slip, 60) * 0.6 }).then(r => {
      pendDel(P); secs = ((Date.now() - t0) / 1000).toFixed(1);
      if (r.fail && r.fail !== 'slip') { W.sol += sol; saveW(); renderBal(true); SND.err(); toast('❌', 'Buy failed', r.fail === 'timeout' ? 'The network didn\'t confirm it in time. Refunded' : 'Coin is gone. Refunded', 'bad'); return; }
      const q = r.q;
      if (r.fail === 'slip') { W.sol += sol; saveW(); renderBal(true); SND.err(); hap(60); toast('⛔', 'Slippage exceeded', 'Price ran ' + ((q0 / q - 1) * 100).toFixed(1) + '% in the ' + secs + 's it took to land (max ' + slip + '%). Fees lost', 'bad'); return; }
      const p = pos(c.id);
      p.tok += r.tok; p.in += sol; if (!p.t0) p.t0 = Date.now();
      W.hist.unshift({ id: c.id, sym: c.sym, side: 1, sol, tok: r.tok, t: Date.now(), st: Sim.t, mc: Sim.mcUsd(c), lat: +secs }); if (W.hist.length > 200) W.hist.length = 200;
      saveW(); saveCoins();
      const b2 = btn && btn.isConnected ? btn : null;
      if (b2) {
        const [x, y] = center(b2);
        FX.burst(x, y, { n: 42, cols: [T.buy1, T.buy2, T.pink, '#ffffff'], sp: 7, type: 'spark', life: 45, g: 0.1 });
        FX.ring(x, y, T.buy1, 120, 4); FX.ring(x, y, T.a2, 80, 2);
        FX.txt(x, y - 20, '-◎' + fSol(sol), T.pink);
      }
      FX.flash(T.buy1);
      const sheetOpen = $('#sheet').classList.contains('on');
      if (avEl && avEl.isConnected) FX.fly(avEl, sheetOpen ? $('#shMc') : $('#navPort'), avatar(c, 44), () => { if (!sheetOpen) { $('#pBadge').textContent = Object.values(W.pos).filter(x => x.tok > 0).length; $('#pBadge').classList.add('on'); } });
      SND.buy(); hap(25); renderBal(true);
      const drift = (q / q0 - 1) * 100;
      toast(c.emoji, 'Bought ' + fK(r.tok) + ' ' + c.sym + (o.why ? ' · ' + o.why : ''), '◎ ' + fSol(sol) + ' at ' + fUsd(Sim.mcUsd(c)) + ' MC' + (real ? ' · landed in ' + secs + 's' + (Math.abs(drift) > 0.5 ? ' · ' + (drift < 0 ? 'price moved ' + drift.toFixed(1) + '%' : 'got ' + drift.toFixed(1) + '% more') : '') : ''), 'ok');
      if (r.sw) { const loss = (1 - r.tok / q) * 100; setTimeout(() => { toast('🥪', 'Sandwiched by an MEV bot', 'Got ' + loss.toFixed(1) + '% fewer tokens. A Jito tip (Settings) protects you', 'bad'); hap(40); }, 1100); }
      if (window.Pro) window.Pro.onFill(c, 1, sol, r.tok);
      if (window.MP && MP.onMyTrade) MP.onMyTrade(c, 1, sol);
      });
    };
    if (L.ms > 0 || Sim.mp) { pendAdd(P); if (L.ms > 0) setTimeout(land, L.ms); else land(); } else land();
    return true;
  }
  function userSell(c, frac, btn, force, o) {
    o = o || {};
    const p = W.pos[c.id];
    if (!p || p.tok <= 0) { SND.err(); toast('⚠️', 'You don\'t hold ' + c.sym, null, 'bad'); return false; }
    const real = CFG.mode === 'real', F = fees(), fee = F.prio + F.tip + F.base;
    if (fee > W.sol + 1e-9) { SND.err(); toast('◎', 'Not enough SOL for the fee', 'Need ◎ ' + fSol(fee) + ' in fees', 'bad'); return false; }
    const tok0 = frac >= 0.999 ? p.tok : p.tok * frac, q0 = Sim.quoteSell(c, tok0), slip = CFG.slip, L = force || o.instant ? { ms: 0, drop: 0 } : Sim.mp ? { ms: 0, drop: landTime().drop } : landTime(), t0 = Date.now();
    W.sol -= fee; saveW(); renderBal(true); hap(10);
    if (btn && btn.isConnected) { const [x, y] = center(btn); FX.ring(x, y, '#ffc94d', 70, 2); }
    const P = { c, side: 0, frac, why: o.why || '' };
    const land = () => {
      if (!Sim.mp) pendDel(P);
      let secs = ((Date.now() - t0) / 1000).toFixed(1); const pp = W.pos[c.id];
      if (!pp || pp.tok <= 0) { pendDel(P); return; }
      if (real && !force && Math.random() < L.drop) { pendDel(P); SND.err(); hap(60); toast('❌', 'Sell didn\'t land', 'Dropped after ' + secs + 's. Fees lost (◎ ' + fSol(fee) + '). Try again or raise priority', 'bad'); if (window.Pro) window.Pro.onFail(c, 0, o); return; }
      const tok = frac >= 0.999 ? pp.tok : Math.min(pp.tok, tok0);
      if (pp._sell) { pendDel(P); return; } pp._sell = 1;
      Sim.cmd({ k: 'sell', cid: c.id, tok, all: tok >= pp.tok - 1, min: real && !force && slip < 100 ? q0 * (tok / tok0) * (1 - slip / 100) : 0 }).then(r => {
      pendDel(P); delete pp._sell; secs = ((Date.now() - t0) / 1000).toFixed(1);
      if (r.fail && r.fail !== 'slip') { SND.err(); toast('❌', 'Sell failed', r.fail === 'timeout' ? 'The network didn\'t confirm it in time. Try again' : 'Coin is gone', 'bad'); if (window.Pro) window.Pro.onFail(c, 0, o); return; }
      const q = r.fail ? r.q : r.sol;
      if (r.fail === 'slip') { SND.err(); hap(60); toast('⛔', 'Slippage exceeded', 'Price dumped ' + ((1 - q / (q0 * tok / tok0)) * 100).toFixed(1) + '% before your sell landed (max ' + slip + '%). Fees lost', 'bad'); if (window.Pro) window.Pro.onFail(c, 0, o); return; }
      pp.tok -= tok; if (pp.tok < 1) pp.tok = 0; pp.out += r.sol; W.sol += r.sol;
      if (pp.tok === 0 && !Sim.isMine(c) && !(window.Pro && window.Pro.hasOrders(c.id))) c.keep = false;
      W.hist.unshift({ id: c.id, sym: c.sym, side: 0, sol: r.sol, tok, t: Date.now(), st: Sim.t, mc: Sim.mcUsd(c), lat: +secs }); if (W.hist.length > 200) W.hist.length = 200;
      saveW(); saveCoins();
      const pn = pp.out - pp.in + posVal(c, pp);
      const b2 = btn && btn.isConnected ? btn : null;
      if (b2) {
        const [x, y] = center(b2);
        FX.burst(x, y, { n: 30, cols: ['#ffc94d', '#ffe58a', '#ffffff'], sp: 7, type: 'star', life: 50 });
        FX.ring(x, y, '#ffc94d', 120, 4);
        FX.txt(x, y - 20, '+◎' + fSol(r.sol), '#ffe58a');
        for (let i = 0; i < 14; i++) FX.add({ t: 'coin', x: x + (Math.random() - .5) * 60, y, vx: (Math.random() - .5) * 6, vy: -6 - Math.random() * 6, g: 0.35, l: 0, m: 70, r: 8 + Math.random() * 5, rot: 0, vr: 0.3, drag: 0.99 });
      }
      FX.flash(pp.tok === 0 && pn >= 0 ? '#ffc94d' : '#ff4d6d');
      SND.sell(); hap(25); renderBal(true);
      toast('💰', 'Sold ' + fK(tok) + ' ' + c.sym + (o.why ? ' · ' + o.why : ''), 'for ◎ ' + fSol(r.sol) + (real && !force ? ' · landed in ' + secs + 's' : '') + (pp.tok === 0 ? ' · PnL ' + (pn >= 0 ? '+' : '') + fSol(pn) + ' SOL' : ''), pn >= 0 ? 'ok' : 'bad');
      if (window.Pro) window.Pro.onFill(c, 0, r.sol, tok);
      if (window.MP && MP.onMyTrade) MP.onMyTrade(c, 0, r.sol);
      });
    };
    if (L.ms > 0 || Sim.mp) { pendAdd(P); if (L.ms > 0) setTimeout(land, L.ms); else land(); } else land();
    return true;
  }

  // ---------- TOKEN SHEET ----------
  let OPEN = null, side = 'buy', feedTab = 'tr', TF = 5;
  const CH = { lo: 0, hi: 0, init: false };
  function openToken(c) {
    OPEN = c; c.keep = true; hap(8); SND.tap();
    clearTimeout(window._shT); window._shT = setTimeout(() => { if (OPEN) document.body.classList.add('shfull'); }, 620);
    $('#shAv').innerHTML = avatar(c, 40);
    $('#shName').textContent = c.name; $('#shSym').textContent = c.sym; $('#shCa').textContent = c.ca.slice(0, 4) + '…' + c.ca.slice(-4);
    $('#shBody').scrollTop = 0; CH.init = false;
    const fl = $('#fList'); fl._m = null; fl._init = false; fl.innerHTML = '';
    $('#shEv')._k = null; $('#shProf')._id = null; $('#cTxt').value = '';
    setSide('buy'); renderSheet(true);
    $('#sheet').classList.add('on'); $('#app').classList.add('dim'); $('#itb').classList.add('on');
    requestAnimationFrame(() => { segInd($('#tSide')); segInd($('#fSeg')); });
    startChart();
  }
  function closeToken() {
    if (!OPEN) return; const c = OPEN; OPEN = null;
    if (!(W.pos[c.id] && W.pos[c.id].tok > 0)) c.keep = false;
    clearTimeout(window._shT); document.body.classList.remove('shfull');
    $('#sheet').classList.remove('on'); $('#app').classList.remove('dim'); $('#itb').classList.remove('on'); hap(6);
  }
  $('#shBack').addEventListener('click', closeToken);
  $('#itb').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !OPEN) return;
    if (b.dataset.b) userBuy(OPEN, +b.dataset.b, b, $('#shAv .av')); else userSell(OPEN, +b.dataset.s, b);
    renderSheet(true);
  });
  // chart crosshair
  (function () {
    const cv = $('#chart'); const set = (x) => { const r = cv.getBoundingClientRect(); CH.hx = x == null ? null : (x - r.left); };
    cv.addEventListener('touchstart', e => set(e.touches[0].clientX), { passive: true });
    cv.addEventListener('touchmove', e => set(e.touches[0].clientX), { passive: true });
    cv.addEventListener('touchend', () => set(null));
    cv.addEventListener('mousemove', e => set(e.clientX)); cv.addEventListener('mouseleave', () => set(null));
  })();
  // swipe down to close
  (function () {
    let y0 = null, x0 = 0; const sh = $('#sheet'), top = $('.sh-top');
    top.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; }, { passive: true });
    top.addEventListener('touchmove', e => { if (y0 == null) return; const dy = e.touches[0].clientY - y0; if (dy > 0) { sh.style.transition = 'none'; sh.style.transform = 'translateY(' + dy + 'px)'; } }, { passive: true });
    top.addEventListener('touchend', e => { if (y0 == null) return; const dy = e.changedTouches[0].clientY - y0; sh.style.transition = ''; sh.style.transform = ''; y0 = null; if (dy > 110) closeToken(); });
  })();

  let tPick = null; // chosen preset value
  function setSide(s) {
    side = s; $$('#tSide button').forEach(b => b.classList.toggle('on', b.dataset.k === s)); segInd($('#tSide'));
    $('#tCard').classList.toggle('selling', s === 'sell');
    const pre = $('#tPre');
    if (s === 'buy') { const q = +CFG.quick || 0.5; tPick = [0.1, 0.25, 0.5, 1, 2, 5].indexOf(q) >= 0 ? q : 0.5; pre.innerHTML = [0.1, 0.25, 0.5, 1, 2, 5].map(v => '<button data-v="' + v + '">◎' + v + '</button>').join(''); $('#tUnit').textContent = 'SOL'; $('#tAmt').placeholder = 'SOL amount'; }
    else { tPick = 100; pre.innerHTML = [25, 50, 75, 100].map(v => '<button data-p="' + v + '">' + (v === 100 ? 'All' : v + '%') + '</button>').join(''); $('#tUnit').textContent = '%'; $('#tAmt').placeholder = '% of your bag'; }
    $('#tAmt').value = ''; updQuote();
  }
  $('#tSide').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { setSide(b.dataset.k); hap(6); SND.tap(); } });
  $('#tPre').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; hap(6); SND.tap();
    tPick = +(b.dataset.v || b.dataset.p); $('#tAmt').value = ''; updQuote();
  });
  $('#tAmt').addEventListener('input', () => { const v = parseFloat(String($('#tAmt').value).replace(',', '.')); if (v > 0) tPick = side === 'sell' ? Math.min(100, v) : v; updQuote(); });
  function tVal() { return tPick || 0; }
  $('#tGo').addEventListener('click', () => {
    if (!OPEN) return; const v = tVal();
    if ($('#tGo').dataset.act === 'add') { closeToken(); go('set'); setTimeout(() => { const a = $('#addAmt'); if (a) a.focus(); }, 400); return; }
    if (side === 'buy') userBuy(OPEN, v, $('#tGo'), $('#shAv .av'));
    else { if (!(v > 0)) { SND.err(); return; } userSell(OPEN, Math.min(100, v) / 100, $('#tGo')); }
    renderSheet(true);
  });
  function updQuote() {
    const c = OPEN; if (!c) return; const v = tVal(), go_ = $('#tGo'), p = W.pos[c.id], real = CFG.mode === 'real', prio = real ? +CFG.prio || 0 : 0;
    $$('#tPre button').forEach(b => b.classList.toggle('on', +(b.dataset.v || b.dataset.p) === v && !$('#tAmt').value));
    const held = p && p.tok > 0, val = held ? Sim.quoteSell(c, p.tok) : 0, pnl = held && p.in ? (val + p.out) / p.in - 1 : 0;
    setT($('#tHold'), side === 'buy' ? 'Wallet ◎ ' + fSol(W.sol) + (held ? ' · you hold ◎ ' + fSol(val) + ' of ' + c.sym : '') : held ? 'You hold ' + fK(p.tok) + ' ' + c.sym + ' · worth ◎ ' + fSol(val) + ' (' + (pnl >= 0 ? '+' : '') + (pnl * 100).toFixed(0) + '%)' : 'You don\'t own any ' + c.sym + ' yet');
    let html = '', label = '', cls = 'big-btn ' + side, dis = false, act = '';
    if (side === 'buy') {
      if (!(v > 0)) { html = '<span class="mu">Pick an amount</span>'; label = 'Buy ' + c.sym; dis = true; }
      else {
        const q = Sim.quoteBuy(c, v), spot = v * (1 - Sim.fee(c)[0]) / Sim.price(c), imp = (1 - q / spot) * 100;
        html = '<div class="tp-a"><span>You pay</span><b>◎ ' + fSol(v) + '</b><em>≈ ' + fUsd(v * Sim.solUsd) + '</em></div><div class="tp-arr">↓</div><div class="tp-a"><span>You get</span><b>' + fK(q) + ' ' + A_esc(c.sym) + '</b><em>≈ ' + (q / 1e9 * 100).toFixed(2) + '% of supply</em></div>';
        const notes = []; notes.push('Fee ◎ ' + fSol(v * Sim.fee(c)[0]) + (prio ? ' + ◎ ' + prio + ' priority' : '')); if (imp > 0.5) notes.push('price impact ' + imp.toFixed(1) + '%');
        if (imp > 12) notes.push('<b class="dn">⚠ big price impact ' + imp.toFixed(0) + '%. Size down</b>');
        if (real) { const LT = landTime(); notes.push('lands in ~' + (LT.est / 1000).toFixed(1) + 's' + (CFG.jito > 0 ? ' · MEV protected' : '')); }
        if (c.rug) notes.push('<b class="dn">⚠ this coin rugged</b>');
        html += '<div class="tp-n">' + notes.join(' · ') + '</div>';
        if (v + prio > W.sol + 1e-9) { label = 'Add SOL to buy'; act = 'add'; cls = 'big-btn add'; html += '<div class="tp-n"><b class="dn">You have ◎ ' + fSol(W.sol) + '. Add balance in Settings.</b></div>'; }
        else label = 'Buy ◎ ' + fSol(v) + ' of ' + c.sym;
      }
    } else {
      if (!held) { html = '<span class="mu">Buy some first, then you can sell here.</span>'; label = 'Nothing to sell'; dis = true; }
      else {
        const pc = Math.min(100, v || 0), tok = p.tok * pc / 100, q = Sim.quoteSell(c, tok), part = p.in * (tok / Math.max(1, p.tok + 0)) ;
        html = '<div class="tp-a"><span>You sell</span><b>' + (pc >= 100 ? 'All ' : pc + '% · ') + fK(tok) + ' ' + A_esc(c.sym) + '</b></div><div class="tp-arr">↓</div><div class="tp-a"><span>You get</span><b>◎ ' + fSol(q) + '</b><em>≈ ' + fUsd(q * Sim.solUsd) + '</em></div>' +
          '<div class="tp-n">Your whole position is <b class="' + (pnl >= 0 ? 'up' : 'dn') + '">' + (pnl >= 0 ? '+' : '') + (pnl * 100).toFixed(1) + '%</b> (in ◎ ' + fSol(p.in) + ', out ◎ ' + fSol(p.out) + ')' + (prio ? ' · fee ◎ ' + prio : '') + '</div>';
        label = (pc >= 100 ? 'Sell all' : 'Sell ' + pc + '%') + ' → ◎ ' + fSol(q); dis = !(pc > 0);
      }
    }
    const pv = $('#tPrev'); if (pv._h !== html) { pv._h = html; pv.innerHTML = html; } renderPend();
    go_.className = cls; go_.disabled = dis; go_.dataset.act = act; setT(go_, label);
    // advanced box keeps the old numbers too
    if (side === 'buy' && v > 0) { const q = Sim.quoteBuy(c, v), spot = v * (1 - Sim.fee(c)[0]) / Sim.price(c), imp = (1 - q / spot) * 100; setT($('#qOut'), '≈ ' + fK(q) + ' ' + c.sym); setT($('#qImp'), 'Impact ' + imp.toFixed(2) + '%'); $('#qImp').className = imp > CFG.slip ? 'dn' : ''; }
    else if (side === 'sell' && held) { setT($('#qOut'), 'Max slippage ' + (CFG.slip >= 100 ? '∞' : CFG.slip + '%')); setT($('#qImp'), ''); }
    else { setT($('#qOut'), ''); setT($('#qImp'), ''); }
  }
  const A_esc = t => esc(t);
  bindSeg($('#fSeg'), k => { feedTab = k; const fl = $('#fList'); fl._m = null; fl._init = false; fl.innerHTML = ''; renderFeed(true); });
  $('#tfs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; TF = +b.dataset.tf; $$('#tfs button').forEach(x => x.classList.toggle('on', x === b)); CH.init = false; hap(6); SND.tap(); });

  function renderSheet(full) {
    const c = OPEN; if (!c) return;
    const m = Sim.mcUsd(c), mcEl = $('#shMc'), mt = fUsd(m);
    if (mcEl._t !== mt) { if (mcEl._v) flashEl(mcEl, m > mcEl._v); mcEl._v = m; setT(mcEl, mt); }
    const ch = (Sim.mc(c) / c.m0 - 1) * 100, che = $('#shCh');
    setT(che, fPct(ch) + ' since launch'); setCls(che, 'up', ch >= 0); setCls(che, 'dn', ch < 0);
    setT($('#shPx'), fPrice(Sim.priceUsd(c))); setT($('#shAge'), '· ' + fAge(Sim.t - c.born) + ' old');
    const cg = $('#shChg'); let ch2 = '';
    [['1m', 60], ['5m', 300], ['15m', 900], ['1h', 3600]].forEach(x => { const v = Sim.change(c, x[1]); ch2 += '<span class="' + (v >= 0 ? 'up' : 'dn') + '"><i>' + x[0] + '</i>' + fPct(v) + '</span>'; });
    if (cg._h !== ch2) { cg._h = ch2; cg.innerHTML = ch2; }
    if (!$('#shAudit')._t || Sim.t - $('#shAudit')._t > 1000) {
      const ad = $('#shAudit'); ad._t = Sim.t; const S = Sim.stats(c), fe = Sim.fee(c);
      const it = [['✅', 'Mint revoked', 'good'], ['✅', 'Freeze revoked', 'good'], [c.grad ? '🔥' : '📈', c.grad ? 'LP burned · ' + Sim.dex() : 'On curve', c.grad ? 'good' : ''],
        ['🔟', 'Top 10 ' + S.top10.toFixed(1) + '%', S.top10 > 40 ? 'bad' : S.top10 < 22 ? 'good' : ''], ['👨‍💻', 'Dev ' + (S.dev ? S.dev.toFixed(1) + '%' : 'sold'), S.dev > 5 ? 'bad' : ''],
        ['🎯', 'Snipers ' + S.snipers.toFixed(1) + '%', S.snipers > 15 ? 'bad' : ''], ['📦', 'Insiders ' + S.insiders.toFixed(1) + '%', S.insiders > 10 ? 'bad' : ''], ['🧠', 'Smart $ ' + S.smart.toFixed(1) + '%', S.smart > 3 ? 'good' : ''],
        ['💸', 'Fee ' + (fe[0] * 100).toFixed(2) + '%', '']];
      it.push(['👻', S.dust ? S.dust + ' fake holders (' + S.real + ' real)' : 'No fake holders', S.dust ? 'bad' : 'good']);
      if (S.botVol >= 5) it.push(['🔁', 'Bot volume ' + S.botVol.toFixed(0) + '%', S.botVol > 20 ? 'bad' : '']);
      if (S.cabal > 0.05 || c.cabalDump) it.push(['🕸️', c.cabalDump ? 'Cabal dumped' : 'Cabal ' + S.cabal.toFixed(1) + '%', 'bad']);
      if (S.dexPaid) it.push(['💊', 'DEX paid', '']); if (S.boosts) it.push(['⚡', 'Boosted x' + S.boosts, '']); if (S.cto) it.push(['🤝', 'Community takeover', '']);
      if (S.devL) it.splice(4, 0, ['🕵️', 'Dev: ' + S.devL + ' launches · ' + S.devR + ' rugs' + (S.devB ? ' · ' + S.devB + ' bonded' : ''), S.devR / S.devL > 0.5 ? 'bad' : S.devB > 0 && S.devR / S.devL < 0.2 ? 'good' : '']);
      const h = it.map(x => '<span class="' + x[2] + '">' + x[0] + ' ' + x[1] + '</span>').join('');
      if (ad._h !== h) { ad._h = h; ad.innerHTML = h; }
    }
    const pf = $('#shProf');
    if (pf._id !== c.id) {
      pf._id = c.id;
      if (c.prof) { const P = c.prof; pf.innerHTML = '📊 Behavior modeled on the real <b>' + esc(c.name) + '</b> pair: MC <b>' + fUsd(P.mc) + '</b> · 1h <b class="up">' + fK(P.b || 0) + '</b> buys / <b class="dn">' + fK(P.s || 0) + '</b> sells' + (P.ch != null ? ' · 24h <b class="' + (P.ch >= 0 ? 'up' : 'dn') + '">' + fPct(P.ch) + '</b>' : '') + '. Started from zero here.'; pf.classList.add('on'); }
      else pf.classList.remove('on');
    }
    const b = c.rug ? '<span class="tag rug">RUGGED</span>' : c.grad ? '<span class="tag grad">MIGRATED</span>' : '';
    if ($('#shBadge')._h !== b) { $('#shBadge')._h = b; $('#shBadge').innerHTML = b; }
    const p = Sim.progress(c);
    $('#bondBar').style.width = p.toFixed(1) + '%'; setCls($('#bondBar'), 'full', c.grad);
    setT($('#bondL'), c.grad ? '🎓 Migrated to AMM' : 'Bonding curve ' + p.toFixed(1) + '%');
    setT($('#bondR'), c.grad ? 'Liquidity ' + fUsd(Sim.liqUsd(c)) : '◎ ' + c.realSol.toFixed(1) + ' / ' + Sim.GRAD_SOL);
    // stats
    const top = Sim.topHolders(c, 10); let t10 = 0; top.forEach(x => t10 += x[1]);
    const devB = c.mine ? (c.mineTok || 0) : (c.holders.get(c.dev) || 0);
    if (App.life) App.life.devPanel(c);
    const st = [
      ['Liquidity', fUsd(Sim.liqUsd(c))], ['Volume', fUsd(c.vol * Sim.solUsd)], ['Holders', c.dust ? c.hk.length + ' <span class="dn" style="font-size:10px">(' + c.dust + ' fake)</span>' : String(c.hk.length)], ['ATH', fUsd(c.ath * Sim.solUsd)],
      ['Buys', '<span class="up">' + fK(c.buys) + '</span>'], ['Sells', '<span class="dn">' + fK(c.sells) + '</span>'], ['Top 10', (t10 / Sim.SUP * 100).toFixed(1) + '%'], ['Dev', devB ? (devB / Sim.SUP * 100).toFixed(1) + '%' : '<span class="dn">Sold</span>']
    ];
    const se = $('#shStats');
    if (!se._b) { se.innerHTML = st.map(() => '<div class="st"><span></span><b></b></div>').join(''); se._b = $$('.st', se); }
    st.forEach((s, i) => { const d = se._b[i]; setT(d.firstChild, s[0]); if (d.lastChild._h !== s[1]) { d.lastChild._h = s[1]; d.lastChild.innerHTML = s[1]; } });
    // events
    const evk = c.events.length ? c.events[0].t + ':' + c.events.length : '';
    const evb = $('#shEv');
    if (evb._k !== evk) { evb._k = evk; evb.innerHTML = c.events.slice(0, 2).map(e => '<div class="evt' + (e.icon === '⚠️' ? ' bad' : '') + '"><span>' + e.icon + '</span><span style="flex:1">' + esc(e.text) + '</span><span class="mu">' + fAge(Sim.t - e.t) + '</span></div>').join(''); }
    // position
    const ps = W.pos[c.id], pe = $('#shPos');
    if (ps && (ps.tok > 0 || ps.in > 0)) {
      pe.classList.add('on');
      const v = posVal(c, ps), pn = v + ps.out - ps.in, pc = ps.in ? pn / ps.in * 100 : 0;
      setT($('#posVal'), '◎ ' + fSol(v)); setT($('#posIn'), '◎ ' + fSol(ps.in)); setT($('#posOut'), '◎ ' + fSol(ps.out));
      const pp = $('#posPnl'); setT(pp, (pn >= 0 ? '+' : '') + fSol(pn) + ' SOL (' + fPct(pc) + ')'); setCls(pp, 'up', pn >= 0); setCls(pp, 'dn', pn < 0);
      if (window.Pro) window.Pro.renderPos(c);
    } else pe.classList.remove('on');
    updQuote();
    renderFeed(full);
  }
  function chatHtml(txt) { return esc(txt).replace(/(^|\s)(@[\w]+)/g, '$1<span class="at">$2</span>'); }
  function renderFeed(full) {
    const c = OPEN; if (!c) return;
    const head = $('#fHead'), fl = $('#fList');
    setT($('#cmN'), c.cmN ? fK(c.cmN) : '');
    $('#cIn').classList.toggle('on', feedTab === 'cm');
    const bm = $('#bubMap'); if (bm) { bm.style.display = feedTab === 'ho' ? '' : 'none'; if (feedTab === 'ho' && window.Pro) window.Pro.bubbles(c, bm); }
    if (feedTab === 'tr') {
      head.style.display = '';
      if (head._k !== 'tr') { head._k = 'tr'; head.style.gridTemplateColumns = ''; head.innerHTML = '<span>Type</span><span>MC</span><span>SOL</span><span>Trader</span><span style="text-align:right">Age</span>'; }
      const items = c.trades.slice(0, 35);
      sync(fl, items, tr => {
        const el = document.createElement('div');
        const tagIc = Sim.TYPES[tr.tag] || '';
        el.className = 'tr ' + (tr.s ? 'b' : 's') + (Sim.isMe(tr.w) ? ' you' : Sim.PL[tr.w] ? ' pl' : '');
        el.innerHTML = '<span class="ty">' + (tr.s ? 'Buy' : 'Sell') + '</span><span class="num">' + fUsd(tr.m * Sim.solUsd) + '</span><span class="a num">' + fSol(tr.sol) + '</span><span class="wl">' + short(tr.w) + '<em>' + tagIc + '</em></span><span class="ag"></span>';
        if (!Sim.isMe(tr.w) && tr.w !== 'BOOST') el.dataset.w = tr.w;
        el._ag = el.lastChild; return el;
      }, (el, tr) => setT(el._ag, fAge(Sim.t - tr.t)));
    } else if (feedTab === 'cm') {
      head.style.display = 'none';
      const items = c.cm.slice(0, 50);
      sync(fl, items, cm => {
        const el = document.createElement('div'); el.className = 'cm' + (cm.you ? ' you' : '') + (cm.spam ? ' spam' : ''); el.dataset.cm = cm.id;
        const pnl = cm.pnl != null && cm.hold > 0 ? '<span class="pnlc ' + (cm.pnl >= 0 ? 'up' : 'dn') + '">' + (cm.pnl >= 0 ? '+' : '') + (Math.abs(cm.pnl) >= 10 ? Math.round(cm.pnl * 100).toLocaleString('en-US') : (cm.pnl * 100).toFixed(0)) + '%</span>' : '';
        const badge = cm.you ? '<span class="hb">YOU</span>' : cm.dev ? '<span class="hb devb">DEV</span>' + pnl : cm.spam ? '<span class="hb spamb">spam?</span>' : cm.sold ? '<span class="hb no">sold ' + cm.sold.toFixed(1) + 'x</span>' : cm.hold > 0 ? '<span class="hb">holder ' + (cm.hold < 0.01 ? '<0.01' : cm.hold.toFixed(2)) + '%</span>' + pnl : '<span class="hb no">not holding</span>';
        el.innerHTML = '<div class="cav" style="--h:' + cm.h + '">' + cm.av + '</div><div class="cb"><div class="chd"><b>' + esc(cm.u) + '</b>' + badge +
          '<span class="ag"></span></div><div class="ctx">' + chatHtml(cm.txt) + '</div></div>' +
          '<button class="lkb"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg><span></span></button>';
        el._ag = $('.ag', el); el._lk = $('.lkb span', el); el._lb = $('.lkb', el); return el;
      }, (el, cm) => { setT(el._ag, fAge(Sim.t - cm.t)); const n = Sim.likes(cm) + (cm.ul ? 1 : 0); setT(el._lk, n ? String(n) : ''); setCls(el._lb, 'on', !!cm.ul); });
    } else {
      head.style.display = '';
      if (head._k !== 'ho') { head._k = 'ho'; head.style.gridTemplateColumns = '24px 1fr 52px'; head.innerHTML = '<span>#</span><span>Wallet</span><span style="text-align:right">Share</span>'; }
      if (!full && fl._tick === (Date.now() / 1000 | 0)) return; fl._tick = Date.now() / 1000 | 0;
      const top = Sim.topHolders(c, 20); const circ = Sim.V_TOK0 - c.vTok, m = Sim.mc(c);
      const rows = [{ id: 'pool', w: c.grad ? 'AMM pool' : 'Bonding curve', a: Sim.SUP - circ, tag: '🏦', mult: 0 }];
      const yp = W.pos[c.id]; if (yp && yp.tok > 0) rows.push({ id: 'YOU', w: 'YOU', a: yp.tok, tag: '⭐', mult: yp.in ? (yp.tok * Sim.price(c) + yp.out) / yp.in : 0 });
      top.forEach(x => { const h = c.hi.get(x[0]), P = Sim.persona(x[0]); rows.push({ id: x[0], w: x[0], a: x[1], tag: h ? (Sim.TYPES[h.ty] || '') : '', ty: h ? Sim.TNAME[h.ty] : '', mult: h ? m / h.e : 0, nm: P && P.u && P.ty !== 'sniper' && P.ty !== 'bot' ? P.u : null }); });
      rows.sort((a, b) => b.a - a.a);
      const mx = rows.length ? rows[0].a : 1;
      sync(fl, rows.slice(0, 21), r => { const el = document.createElement('div'); el.className = 'tr hr' + (r.id === 'YOU' ? ' you' : ''); if (r.id !== 'YOU' && r.id !== 'pool') el.dataset.w = r.id; el.innerHTML = '<span class="mu"></span><div class="wl"><span></span><i class="hmult"></i><div class="hbar"></div></div><b class="num" style="text-align:right"></b>'; return el; },
        (el, r) => {
          const i = rows.indexOf(r) + 1; setT(el.children[0], String(i));
          const nm = (r.id === 'pool' || r.id === 'YOU' ? r.w : (r.nm ? r.nm + ' · ' : '') + short(r.w)) + ' ' + r.tag + (r.ty && r.ty !== 'Retail' ? ' ' + r.ty : ''); setT(el.children[1].children[0], nm);
          const mu = el.children[1].children[1]; const mt = r.mult ? r.mult.toFixed(r.mult >= 10 ? 0 : 1) + 'x' : ''; setT(mu, mt); setCls(mu, 'up', r.mult >= 1); setCls(mu, 'dn', r.mult && r.mult < 1);
          el.children[1].children[2].style.width = (r.a / mx * 100).toFixed(1) + '%'; setT(el.children[2], (r.a / Sim.SUP * 100).toFixed(2) + '%');
        });
    }
  }
  $('#fList').addEventListener('click', e => {
    const lb = e.target.closest('.lkb'); if (!lb || !OPEN) return;
    const id = +lb.closest('.cm').dataset.cm; const cm = OPEN.cm.find(x => x.id === id); if (!cm) return;
    cm.ul = !cm.ul; hap(10); SND.tap();
    if (cm.ul) { const [x, y] = center(lb); FX.burst(x, y, { n: 12, cols: ['#ff3355', '#ff8fa3', '#ffffff'], sp: 3.5, g: 0.05, life: 28 }); }
    renderFeed(true);
  });
  function sendComment() {
    const inp = $('#cTxt'), txt = inp.value.trim(); if (!txt || !OPEN) return;
    const p = W.pos[OPEN.id];
    Sim.cmd({ k: 'cm', cid: OPEN.id, txt, hold: p && p.tok > 0 }).then(() => renderFeed(true));
    inp.value = ''; hap(12); SND.tap();
    const [x, y] = center($('#cSend')); FX.burst(x, y, { n: 18, cols: [T.a1, T.a2, '#ffffff'], sp: 4, g: 0, life: 30 });
    renderFeed(true);
  }
  $('#cSend').addEventListener('click', sendComment);
  $('#cTxt').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendComment(); } });

  // ---------- chart ----------
  let chartRaf = 0, chartLast = 0, chartSig = '', chartDirty = false;
  ['pointerdown', 'pointermove', 'pointerup', 'click', 'touchmove'].forEach(k => document.addEventListener(k, e => { if (OPEN && e.target.closest && e.target.closest('.chartwrap')) chartDirty = true; }, { passive: true, capture: true }));
  if (window.ResizeObserver) new ResizeObserver(() => { const cv = $('#chart'); if (cv) cv._r = null; chartDirty = true; }).observe($('#chart'));
  function startChart() { if (!chartRaf) chartRaf = requestAnimationFrame(chartLoop); }
  function chartLoop(ts) {
    chartRaf = 0; if (!OPEN) return;
    const c = OPEN, cd = c.candles, lc = cd.length ? cd[cd.length - 1] : null;
    const sig = cd.length + ':' + (lc ? lc[4] : 0) + ':' + TF + ':' + c.hk.length + ':' + (W.pos[c.id] ? W.pos[c.id].tok : 0);
    const idle = window.QUAL === 'lo' ? 500 : window.QUAL === 'hi' ? 160 : 260;
    if ((sig !== chartSig && ts - chartLast > (window.QUAL === 'lo' ? 90 : 45)) || chartDirty || ts - chartLast > idle) { chartLast = ts; chartSig = sig; chartDirty = false; drawChart(); }
    chartRaf = requestAnimationFrame(chartLoop);
  }
  function drawChart() {
    const c = OPEN, cv = $('#chart'); if (!c || !cv) return;
    const dpr = Math.min(window.QUAL === 'lo' ? 1.5 : 2, window.devicePixelRatio || 1), rect = cv._r && cv._r.width ? cv._r : (cv._r = cv.getBoundingClientRect());
    const w = rect.width, h = rect.height; if (!w || !h) { cv._r = null; return; }
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const cx = cv.getContext('2d'); cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, w, h);
    const padR = 58, padT = 40, padB = 22, cw = w - padR - 6, chH = h - padT - padB;
    const N = Math.max(20, Math.floor(cw / 8)), tf = TF;
    const nowS = Math.floor(Sim.t / 1000), end = Math.floor(nowS / tf) * tf, start = end - (N - 1) * tf, born = Math.floor(c.born / 1000);
    const cd = c.candles;
    let j = cd.length - 1; while (j > 0 && cd[j][0] >= start) j--;
    let prev = cd.length && cd[j][0] < start ? cd[j][4] : c.m0; if (cd.length && cd[j][0] < start) j++; else j = 0;
    const bars = [];
    for (let b = 0; b < N; b++) {
      const bs = start + b * tf, be = bs + tf;
      if (be <= born) { bars.push(null); continue; }
      let o = prev, hi = prev, lo = prev, cl = prev, v = 0, has = false;
      while (j < cd.length && cd[j][0] < be) { const k = cd[j]; if (k[0] >= bs) { if (!has) { o = k[1]; hi = k[2]; lo = k[3]; has = true; } else { if (k[2] > hi) hi = k[2]; if (k[3] < lo) lo = k[3]; } cl = k[4]; v += k[5]; } j++; }
      if (has) { hi = Math.max(hi, o, cl); lo = Math.min(lo, o, cl); }
      bars.push([o, hi, lo, cl, v]); prev = cl;
    }
    let lo = Infinity, hi = -Infinity, vmax = 0;
    bars.forEach(b => { if (!b) return; if (b[2] < lo) lo = b[2]; if (b[1] > hi) hi = b[1]; if (b[4] > vmax) vmax = b[4]; });
    if (!isFinite(lo)) { lo = c.m0; hi = c.m0 * 1.1; }
    if (hi - lo < hi * 0.02) { const mid = (hi + lo) / 2; hi = mid * 1.01; lo = mid * 0.99; }
    const pad = (hi - lo) * 0.12; lo = Math.max(0, lo - pad); hi += pad;
    if (!CH.init) { CH.lo = lo; CH.hi = hi; CH.init = true; } else { CH.lo += (lo - CH.lo) * 0.18; CH.hi += (hi - CH.hi) * 0.18; }
    const L = CH.lo, H = CH.hi, y = v => padT + (1 - (v - L) / (H - L)) * chH, usd = Sim.solUsd;
    // grid
    cx.font = '600 10px system-ui,Roboto,sans-serif'; cx.textAlign = 'left'; cx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const v = L + (H - L) * i / 4, yy = y(v);
      cx.strokeStyle = 'rgba(255,255,255,.05)'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(0, yy); cx.lineTo(w - padR, yy); cx.stroke();
      cx.fillStyle = 'rgba(180,185,215,.55)'; cx.fillText(fUsd(v * usd), w - padR + 6, yy);
    }
    const bw = cw / N, body = Math.max(1.5, bw * 0.66);
    // area glow under closes
    cx.beginPath(); let started = false, lastX = 0;
    bars.forEach((b, i) => { if (!b) return; const x = i * bw + bw / 2; if (!started) { cx.moveTo(x, y(b[3])); started = true; } else cx.lineTo(x, y(b[3])); lastX = x; });
    if (started) {
      const g = cx.createLinearGradient(0, padT, 0, h - padB); g.addColorStop(0, 'rgba(' + T.a1r + ',.3)'); g.addColorStop(1, 'rgba(' + T.a1r + ',0)');
      cx.lineTo(lastX, h - padB); const fi = bars.findIndex(b => b); cx.lineTo(fi * bw + bw / 2, h - padB); cx.closePath(); cx.fillStyle = g; cx.fill();
    }
    // volume
    bars.forEach((b, i) => { if (!b || !vmax) return; const vh = b[4] / vmax * chH * 0.22; cx.fillStyle = b[3] >= b[0] ? 'rgba(34,240,160,.18)' : 'rgba(255,77,109,.18)'; cx.fillRect(i * bw + (bw - body) / 2, h - padB - vh, body, vh); });
    // candles
    bars.forEach((b, i) => {
      if (!b) return; const x = i * bw + bw / 2, up = b[3] >= b[0], col = up ? '#22f0a0' : '#ff4d6d';
      cx.strokeStyle = col; cx.fillStyle = col; cx.lineWidth = 1;
      cx.beginPath(); cx.moveTo(x, y(b[1])); cx.lineTo(x, y(b[2])); cx.stroke();
      const y1 = y(Math.max(b[0], b[3])), y2 = y(Math.min(b[0], b[3]));
      cx.fillRect(x - body / 2, y1, body, Math.max(1.2, y2 - y1));
    });
    // user markers
    W.hist.forEach(x => {
      if (x.id !== c.id || !x.st) return; const s = Math.floor(x.st / 1000); if (s < start || s > end + tf) return;
      const i = Math.floor((s - start) / tf), px = i * bw + bw / 2, py = y(x.mc / usd);
      cx.fillStyle = x.side ? '#22f0a0' : '#ff4d6d'; cx.beginPath(); cx.arc(px, py, 8, 0, 6.2832); cx.fill();
      cx.fillStyle = '#05050b'; cx.font = '900 10px system-ui'; cx.textAlign = 'center'; cx.fillText(x.side ? 'B' : 'S', px, py + 0.5);
    });
    // last price line
    const lc = Sim.mc(c), ly = y(lc), up = lc >= (bars[bars.length - 1] ? bars[bars.length - 1][0] : lc);
    cx.setLineDash([3, 4]); cx.strokeStyle = up ? 'rgba(34,240,160,.7)' : 'rgba(255,77,109,.7)'; cx.beginPath(); cx.moveTo(0, ly); cx.lineTo(w - padR, ly); cx.stroke(); cx.setLineDash([]);
    const lbl = fUsd(lc * usd); cx.font = '800 10.5px system-ui,Roboto,sans-serif';
    const lw = cx.measureText(lbl).width + 10; cx.fillStyle = up ? '#22f0a0' : '#ff4d6d';
    cx.beginPath(); if (cx.roundRect) cx.roundRect(w - padR + 2, ly - 9, lw, 18, 5); else cx.rect(w - padR + 2, ly - 9, lw, 18); cx.fill();
    cx.fillStyle = '#05050b'; cx.textAlign = 'left'; cx.fillText(lbl, w - padR + 7, ly + 0.5);
    // pulse dot
    const pr = 3 + (Math.sin(performance.now() / 180) + 1) * 2.5;
    cx.fillStyle = up ? 'rgba(34,240,160,.3)' : 'rgba(255,77,109,.3)'; cx.beginPath(); cx.arc(cw - bw / 2 + 0, ly, pr + 3, 0, 6.2832); cx.fill();
    cx.fillStyle = up ? '#22f0a0' : '#ff4d6d'; cx.beginPath(); cx.arc(cw - bw / 2, ly, 3, 0, 6.2832); cx.fill();
    if (CH.hx != null) {
      const i = clamp(Math.floor(CH.hx / bw), 0, bars.length - 1), b = bars[i];
      if (b) {
        const x = i * bw + bw / 2;
        cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.setLineDash([2, 3]); cx.beginPath(); cx.moveTo(x, padT - 6); cx.lineTo(x, h - padB); cx.stroke(); cx.setLineDash([]);
        const secAgo = (end - (start + i * tf)), lines = ['O ' + fUsd(b[0] * usd) + '  H ' + fUsd(b[1] * usd), 'L ' + fUsd(b[2] * usd) + '  C ' + fUsd(b[3] * usd), 'Vol ◎' + fSol(b[4]) + ' · ' + fAge(secAgo * 1000) + ' ago'];
        cx.font = '600 10.5px "JetBrains Mono",ui-monospace,monospace'; const tw = Math.max.apply(null, lines.map(l => cx.measureText(l).width)) + 16;
        const tx = clamp(x + 10, 4, w - tw - 4), ty = padT + 4;
        cx.fillStyle = 'rgba(10,12,28,.92)'; cx.strokeStyle = 'rgba(255,255,255,.15)'; cx.beginPath(); if (cx.roundRect) cx.roundRect(tx, ty, tw, 50, 8); else cx.rect(tx, ty, tw, 50); cx.fill(); cx.stroke();
        cx.fillStyle = '#e8ebff'; cx.textAlign = 'left'; lines.forEach((l, k) => cx.fillText(l, tx + 8, ty + 12 + k * 14));
      }
    }
  }

  // ---------- event toasts for held coins ----------
  Sim.onGrad = c => { if (Sim.isMine(c) && Sim.era === 'prime') { W.sol += 0.5; saveW(); renderBal(true); toast('🎓', '$' + c.sym + ' bonded! +◎ 0.5 creator reward', 'Prime-era bonding reward', 'ok'); } else if (c.mine) toast('🎓', '$' + c.sym + ' bonded to ' + Sim.dex() + '!', 'BOOST is buying & burning for 5 min', 'ok'); };
  Sim.onEvent = (c, icon, text) => { if (W.pos[c.id] && W.pos[c.id].tok > 0) toast(icon, c.sym + ': ' + text, null, icon === '⚠️' ? 'bad' : 'info'); };

  // ---------- render loop ----------
  function renderView(full) {
    if (OPEN && !full && document.body.classList.contains('shfull')) { renderBal(false); return; }
    if (VIEW === 'pulse') renderPulse(); else if (VIEW === 'trend') renderTrend(); else if (VIEW === 'port') renderPort(); else if (VIEW === 'set') renderSettings();
    else if (App.life) App.life.render(VIEW, full);
    renderBal(false);
    setT($('#eraChip'), (CFG.era === 'prime' ? '👑 PRIME' : '📉 NOW') + ' · SOL $' + Sim.solUsd.toFixed(0) + ' · ' + Sim.heat.toFixed(2) + 'x');
  }

  // ---------- DexScreener ----------
  const Data = {
    ok: false, ki: 0,
    kw: ['pump', 'bonk', 'pepe', 'doge', 'cat', 'frog', 'ai', 'trump', 'moon', 'inu', 'wif', 'popcat', 'meme', 'baby', 'elon', 'shib', 'based', 'chad', 'giga', 'wojak', 'hamster', 'penguin', 'monkey', 'ape', 'bear', 'bull', 'rocket', 'gm', 'cult', 'dog', 'goat', 'banana', 'sigma', 'grok', 'turbo', 'floki', 'kitty', 'neko', 'sushi', 'pizza', 'burger', 'coffee', 'beer', 'meow', 'woof', 'bird', 'fish', 'shark', 'whale', 'dragon', 'tiger', 'lion', 'fox', 'owl', 'duck', 'goose', 'chill', 'vibe', 'zen', 'magic', 'wizard', 'king', 'queen', 'gold', 'diamond', 'gem', 'pixel', 'robot', 'alien', 'ufo', 'space', 'mars', 'jup', 'mew', 'michi', 'mog', 'ponke', 'slerf', 'bome', 'myro', 'pnut', 'fwog', 'mother', 'retardio', 'chillguy', 'moodeng', 'hippo', 'otter', 'capy', 'sloth', 'koala', 'panda', 'corgi', 'pug', 'toad', 'snail', 'crab', 'taco', 'ninja', 'ghost', 'goblin', 'gnome', 'mochi', 'noodle', 'degen', 'wagmi', 'lfg', 'hodl', 'send', 'pumpfun', 'raydium', 'meteora', 'solana'],
    async j(u, ms) {
      const ac = window.AbortController ? new AbortController() : null; const t = setTimeout(() => ac && ac.abort(), ms || 7000);
      try { const r = await fetch(u, ac ? { signal: ac.signal } : {}); if (!r.ok) throw new Error(r.status); return await r.json(); } finally { clearTimeout(t); }
    },
    addPairs(pairs, icons) {
      let tx = 0, n = 0;
      (pairs || []).forEach(p => { if (p && p.chainId === 'solana' && p.txns && p.txns.h1) { tx += (+p.txns.h1.buys || 0) + (+p.txns.h1.sells || 0); n++; } });
      if (n >= 5) { const avg = tx / n; HEAT.tx = HEAT.tx == null ? avg : HEAT.tx * 0.7 + avg * 0.3; updHeat(); }
      (pairs || []).forEach(p => {
        if (!p || p.chainId !== 'solana' || !p.baseToken) return; const b = p.baseToken;
        if (!b.symbol || /^(SOL|WSOL|USDC|USDT)$/i.test(b.symbol)) return;
        const tx = p.txns && p.txns.h1 || {}, pc = p.priceChange || {}, vo = p.volume || {};
        const st = { mc: +(p.marketCap || p.fdv || 0), b: +(tx.buys || 0), s: +(tx.sells || 0), ch: pc.h24 != null ? +pc.h24 : null, v: +(vo.h24 || 0) };
        Sim.addPool({ name: b.name, sym: b.symbol, img: (p.info && p.info.imageUrl) || (icons && icons[b.address]) || null, addr: b.address, st: st.mc > 0 ? st : null });
      });
    },
    async sol() {
      try {
        const r = await this.j('https://api.dexscreener.com/tokens/v1/solana/So11111111111111111111111111111111111111112');
        let best = null; (r || []).forEach(p => { if (p.baseToken && p.baseToken.symbol === 'SOL' && p.quoteToken && /USD/.test(p.quoteToken.symbol) && p.priceUsd) { if (!best || ((p.liquidity && p.liquidity.usd) || 0) > ((best.liquidity && best.liquidity.usd) || 0)) best = p; } });
        if (best) { Sim.liveSol = +best.priceUsd; if (CFG.era !== 'prime') Sim.solUsd = Sim.liveSol; if (best.priceChange && best.priceChange.h24 != null) HEAT.sol = +best.priceChange.h24; updHeat(); this.ok = true; }
      } catch (e) { }
    },
    async profiles() {
      try {
        const urls = ['https://api.dexscreener.com/token-profiles/latest/v1', 'https://api.dexscreener.com/token-boosts/latest/v1', 'https://api.dexscreener.com/token-boosts/top/v1'];
        const res = await Promise.allSettled(urls.map(u => this.j(u)));
        const addrs = new Set(), icons = {};
        res.forEach(r => { if (r.status === 'fulfilled' && Array.isArray(r.value)) r.value.forEach(t => { if (t.chainId === 'solana' && t.tokenAddress) { addrs.add(t.tokenAddress); if (t.icon) icons[t.tokenAddress] = t.icon; } }); });
        const arr = Array.from(addrs);
        for (let i = 0; i < arr.length; i += 30) {
          try { const r = await this.j('https://api.dexscreener.com/tokens/v1/solana/' + arr.slice(i, i + 30).join(',')); this.addPairs(r, icons); this.ok = true; } catch (e) { }
        }
      } catch (e) { }
    },
    async search() {
      const k = this.kw[this.ki++ % this.kw.length];
      try { const r = await this.j('https://api.dexscreener.com/latest/dex/search?q=' + encodeURIComponent(k)); this.addPairs(r && r.pairs); this.ok = true; } catch (e) { }
    },
    refresh() { return Promise.allSettled([this.sol(), this.profiles(), this.search(), this.search()]); },
    start() {
      this.ki = Math.floor(Math.random() * this.kw.length);
      const first = Promise.allSettled([this.sol(), this.profiles(), this.search(), this.search(), this.search(), this.search()]);
      setInterval(() => this.search(), 6000); setInterval(() => this.profiles(), 120000); setInterval(() => this.sol(), 60000);
      return Promise.race([first, new Promise(r => setTimeout(r, 6000))]);
    }
  };

  // ---------- LOCK ----------
  function hash(s) { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < s.length; i++) { const ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16); }
  // loading screen (shown while the market loads, then fades away)
  const Loader = { done() { const l = $('#loader'); if (!l) return; l.classList.add('off'); setTimeout(() => l.remove(), 600); } };

  // ---------- Android hooks ----------
  window.handleBack = function () {
    if ($('#modal').classList.contains('on')) { closeModal(); return true; }
    if ($('#mus').classList.contains('on')) { $('#mus').classList.remove('on'); return true; }
    if (App.life && App.life.back()) return true;
    if (OPEN) { closeToken(); return true; }
    if (VIEW !== 'pulse') { go('pulse'); return true; }
    return false;
  };
  let musWas = false;
  window.onAppPause = function () {
    saveW(); saveCoins();
    if (window.__picking) return;
    musWas = Music.on; if (Music.on) Music.stop();
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) window.onAppPause(); });

  // ---------- shared API for life.js ----------
  const App = window.App = {
    get W() { return W; }, CFG, saveW, saveC, saveCoins, toast, modal, closeModal, FX, SND, hap, center, animNum, sync, setT, setCls, segInd, bindSeg,
    fSol, fUsd, fK, fAge, fPct, esc, avatar, renderBal, openToken, closeToken, go, userBuy, userSell, pos, posVal, applyCfg, landTime, renderFeed,
    get T() { return T; }, get VIEW() { return VIEW; }, get OPEN() { return OPEN; }, renderSheet, life: null
  };

  // ---------- boot ----------
  function warmup() {
    return new Promise(res => {
      const SPAN = 300, DT = 0.5; const target = Date.now(); Sim.t = target - SPAN * 1000; Sim.nextSpawn = 0;
      // seed a few older coins so every column has content
      for (let i = 0; i < 6; i++) { const c = Sim.spawn(null); c.q = 0.85 + Math.random() * 0.15; c.h0 *= 3; c.life = 400; }
      const total = SPAN / DT; let done = 0;
      const chunk = () => {
        for (let i = 0; i < 25 && Sim.t < target; i++) { Sim.step(DT); Sim.t += DT * 1000; done++; }
        const bp = $('#bootP'); if (bp) bp.style.width = Math.min(100, done / total * 100) + '%';
        if (Sim.t < target) setTimeout(chunk, 0); else { Sim.t = Date.now(); res(); }
      };
      chunk();
    });
  }
  function boot() {
    window.gpStage && gpStage('Loading market data'); applyCfg(); FX.init();
    renderBal(false);
    window.gpStage && gpStage('Restoring wallet'); if (!window.MP || MP.solo) (LS.get('coins', []) || []).forEach(o => { try { Sim.restore(o); } catch (e) { } });
    let G0 = null;
    Data.start().then(() => new Promise(r => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', r) : r())).then(() => { window.gpStage && gpStage('Connecting to server'); return window.MP && !MP.solo && MP.gate ? MP.gate() : { fresh: true }; }).then(g => { G0 = g || {}; return G0.loaded ? null : warmup(); }).then(() => {
      if (window.MP && !MP.solo) MP.start(G0);
      let last = Date.now();
      setInterval(() => { if (Sim.mp) { last = Date.now(); return; } const n = Date.now(); const dt = Math.min(3, (n - last) / 1000); last = n; Sim.t = n; Sim.step(dt); }, 200);
      setInterval(() => renderView(false), 500);
      setInterval(() => { if (OPEN) renderSheet(false); }, 250);
      setInterval(() => { (window.requestIdleCallback || (f => setTimeout(f, 1)))(() => saveCoins(), { timeout: 4000 }); }, 20000);
      document.addEventListener('visibilitychange', () => { if (document.hidden) { saveCoins(); saveW(); } }); addEventListener('pagehide', () => { saveCoins(); saveW(); });
      const nwSample = () => { const P = portfolio(); let nw = W.sol + P.inv; (W.assets || []).forEach(a => { const m = a.kind === 'car' ? Art.CAR_BY[a.model] : Art.HOUSE_BY[a.model]; if (m) nw += m.usd / Sim.solUsd * (a.kind === 'car' ? 0.85 : 0.92); }); if (window.Biz) nw += Biz.netWorthSol(); W.nwh = W.nwh || []; W.nwh.push([Date.now(), +nw.toFixed(4)]); if (W.nwh.length > 400) W.nwh.splice(0, W.nwh.length - 400); };
      nwSample(); setInterval(nwSample, 15000);
      renderView(true);
      Loader.done();
      requestAnimationFrame(() => { navInd(); segInd($('#pSeg')); });
    });
    addEventListener('resize', () => { navInd(); $$('.seg').forEach(segInd); });
  }
  boot();
})();
