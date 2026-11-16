/* Glasspad speed governor: picks a graphics tier (lo / mid / hi) for the phone, then watches real frame times
   and steps down instantly if frames drop, so it never stays laggy. Settings → Graphics can force a tier. */
(function () {
  'use strict';
  let cfg = {}; try { cfg = JSON.parse(localStorage.getItem('gp_cfg') || '{}') || {}; } catch (e) { }
  const forced = cfg.gfx && cfg.gfx !== 'auto' ? cfg.gfx : null;
  let learned = null; try { learned = localStorage.getItem('gp_qual'); } catch (e) { }
  function guess() {
    if (/iP(hone|ad|od)/.test(navigator.userAgent)) return 'mid';
    const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
    if (mem <= 3 || cores <= 4) return 'lo';
    if (mem >= 8 && cores >= 8) return 'hi';
    return 'mid';
  }
  window.QUAL = forced || learned || guess();
  window.QMAX = { lo: 140, mid: 260, hi: 420 }; // FX particle caps
  const ORDER = ['lo', 'mid', 'hi'];
  function apply(q, why) {
    if (q === window.QUAL) return; window.QUAL = q;
    const h = document.documentElement; h.className = h.className.replace(/\bq-\w+/, '') + ' q-' + q;
    try { if (!forced) localStorage.setItem('gp_qual', q); } catch (e) { }
    if (window.App && App.FX && App.FX.cv) { try { dispatchEvent(new Event('resize')); } catch (e) { } }
    if (window.Sakura && Sakura.retier) Sakura.retier(); if (window.Money && Money.retier) Money.retier();
    window.QLOG = (window.QLOG || []).concat([q + ' ' + (why || '')]);
  }
  window.setQual = apply;
  // ---- idle sleep: no touches for 12s → freeze decoration, render less (the market keeps running) ----
  let lastIn = Date.now(); window.IDLE = false;
  const wake = () => { lastIn = Date.now(); if (window.IDLE) { window.IDLE = false; document.body && document.body.classList.remove('idle'); if (window.Sakura && Sakura.retier) Sakura.retier(); } };
  ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'].forEach(k => addEventListener(k, wake, { passive: true, capture: true }));
  setInterval(() => { if (!window.IDLE && Date.now() - lastIn > 12000 && document.body) { window.IDLE = true; document.body.classList.add('idle'); } }, 2000);

  // ---- governor: sample ~2s of frames every few seconds ----
  let upTried = 0, goodRuns = 0;
  function sample() {
    if (document.hidden || (window.App && App.CFG && App.CFG.gfx && App.CFG.gfx !== 'auto')) return setTimeout(sample, 4000);
    const ts = []; let last = 0; const t0 = performance.now();
    const f = n => { if (last) ts.push(n - last); last = n; if (n - t0 < 2000) requestAnimationFrame(f); else judge(ts); };
    requestAnimationFrame(f);
  }
  function judge(ts) {
    if (ts.length < 20) return setTimeout(sample, 3000); // idle page (no frames) – nothing to judge
    const s = ts.slice().sort((a, b) => a - b), med = s[s.length >> 1];
    const vs = Math.min(16.7, Math.max(6.9, med)); // display refresh (60/90/120Hz)
    const p10 = s[Math.floor(s.length * .1)], p90 = s[Math.floor(s.length * .9)];
    if (p10 > 28 && p90 < 40) { setTimeout(sample, 5000); return; } // steady 30fps = Low Power Mode cap, not lag
    const bad = ts.filter(x => x > vs * 2.2).length / ts.length, awful = ts.filter(x => x > 50).length;
    const i = ORDER.indexOf(window.QUAL);
    if ((bad > 0.07 || awful >= 3 || med > 24) && i > 0) { apply(ORDER[i - 1], 'drop ' + Math.round(bad * 100) + '%'); goodRuns = 0; return setTimeout(sample, 2500); }
    if (bad < 0.01 && med <= vs * 1.15) goodRuns++; else goodRuns = 0;
    if (goodRuns >= 6 && i < 2 && upTried < 1) { upTried++; goodRuns = 0; apply(ORDER[i + 1], 'try up'); }
    setTimeout(sample, 5000);
  }
  setTimeout(sample, 6000);

  // ---- settings row + FX particle cap (after the app exists) ----
  function late() {
    const A = window.App; if (!A || !A.FX) return setTimeout(late, 200);
    const add = A.FX.add.bind(A.FX);
    A.FX.add = p => { if (A.FX.ps.length >= window.QMAX[window.QUAL]) return; add(p); };
    if (A.CFG.gfx == null) A.CFG.gfx = 'auto';
    const th = document.getElementById('cfgTheme'); const row = th && th.closest('.srow'); if (!row) return;
    const el = document.createElement('div'); el.className = 'srow';
    el.innerHTML = '<div><div class="t">⚡ Graphics</div><div class="d" id="gfxNow"></div></div><div class="minis" id="cfgGfx"><button data-v="auto">Auto</button><button data-v="lo">Smooth</button><button data-v="mid">Balanced</button><button data-v="hi">Ultra</button></div>';
    row.before(el);
    const paint = () => { el.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === A.CFG.gfx)); document.getElementById('gfxNow').textContent = 'Now: ' + { lo: 'Smooth', mid: 'Balanced', hi: 'Ultra' }[window.QUAL] + (A.CFG.gfx === 'auto' ? ' (auto, never lags)' : ''); };
    el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; A.CFG.gfx = b.dataset.v; A.saveC(); if (b.dataset.v !== 'auto') apply(b.dataset.v, 'user'); else { try { localStorage.removeItem('gp_qual'); } catch (x) { } upTried = 0; } paint(); });
    paint(); setInterval(() => { if (A.VIEW === 'set') paint(); }, 2000);
  }
  late();
})();
