/* Full-screen bubble map + Clips (short vertical videos about launches, pumps, rugs and hype).
   Clips are generated from what is really happening in the market: hotter coins get more clips and more views. */
(function () {
  'use strict';
  const A = window.App, Sim = window.Sim; if (!A || !Sim) return;
  const $ = (s, r) => (r || document).querySelector(s), esc = A.esc, rnd = Math.random, pick = a => a[Math.floor(rnd() * a.length)], R = (a, b) => a + rnd() * (b - a);
  const fl = k => { if (window.Academy) Academy.flag(k); };
  const f1 = n => (Math.round(n * 10) / 10).toString();

  // ======================= full-screen bubble map =======================
  const COL = { dev: '#ff3355', bundle: '#ff7a1a', cabal: '#b46cff', dust: '#6b7180', sniper: '#ffc21a', smart: '#1fd38c', whale: '#2f6bff', kol: '#ff5fa2', copy: '#ff9ed0', mev: '#9aa0b0', vol: '#9aa0b0', retail: '#1fb5a8', paper: '#5fb5c8', diamond: '#7ad3ff', momentum: '#4fc3a1', dip: '#3fa0a0', bot: '#9aa0b0', boost: '#ffffff' };
  const GROUP = ty => ty === 'dev' || ty === 'bundle' || ty === 'dust' ? 'dev' : ty === 'cabal' ? 'cabal' : ty === 'sniper' || ty === 'mev' || ty === 'vol' || ty === 'bot' ? 'bots' : 'free';
  const GN = { dev: 'Dev cluster', cabal: 'Cabal', bots: 'Snipers & bots', free: 'Independent' };
  const GC = { dev: '#ff3355', cabal: '#b46cff', bots: '#ffc21a', free: '#1fb5a8' };
  function hash(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function openMap(c) {
    if (!c) return; fl('bubble');
    const W = 360, H = 520, top = Sim.topHolders(c, 70); const dust = [];
    for (const [w] of c.holders) { const h = c.hi.get(w); if (h && h.ty === 'dust') { dust.push([w, c.holders.get(w)]); if (dust.length >= 30) break; } }
    const all = top.concat(dust.filter(d => !top.some(t => t[0] === d[0])));
    const N = all.map(x => { const h = c.hi.get(x[0]), ty = x[0] === c.dev ? 'dev' : h ? h.ty : 'retail', g = GROUP(ty), hs = hash(x[0]); return { w: x[0], a: x[1], ty, g, r: Math.max(3, Math.sqrt(x[1] / Sim.SUP) * 120), x: 40 + hs % (W - 80), y: 40 + (hs >> 9) % (H - 80) }; });
    const ctr = { dev: [W * .3, H * .32], cabal: [W * .72, H * .3], bots: [W * .7, H * .72], free: [W * .32, H * .7] };
    for (let it = 0; it < 120; it++) for (let i = 0; i < N.length; i++) { const a = N[i];
      for (let j = i + 1; j < N.length; j++) { const b = N[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .1, min = a.r + b.r + 2.5; if (d < min) { const k = (min - d) / d * .5; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k; } }
      const t = ctr[a.g]; a.x += (t[0] - a.x) * (a.g === 'free' ? .012 : .035); a.y += (t[1] - a.y) * (a.g === 'free' ? .012 : .035);
      a.x = Math.max(a.r + 2, Math.min(W - 2 - a.r, a.x)); a.y = Math.max(a.r + 2, Math.min(H - 2 - a.r, a.y)); }
    const G = {}; N.forEach(n => { const g = G[n.g] || (G[n.g] = { n: 0, a: 0, xs: 0, ys: 0, L: [] }); g.n++; g.a += n.a; g.xs += n.x; g.ys += n.y; g.L.push(n); });
    let hulls = '', lines = '', circ = '';
    for (const k in G) { const g = G[k]; if (k === 'free' || g.n < 2) continue; const cx = g.xs / g.n, cy = g.ys / g.n; let rr = 0; g.L.forEach(n => rr = Math.max(rr, Math.hypot(n.x - cx, n.y - cy) + n.r)); hulls += '<circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(rr + 6) + '" fill="' + GC[k] + '" fill-opacity=".07" stroke="' + GC[k] + '" stroke-opacity=".5" stroke-dasharray="4 4"/><text x="' + f1(cx) + '" y="' + f1(Math.max(12, cy - rr - 10)) + '" text-anchor="middle" font-size="11" font-weight="800" fill="' + GC[k] + '">' + GN[k] + ' ' + (g.a / Sim.SUP * 100).toFixed(1) + '%</text>';
      const hub = g.L.find(n => n.ty === 'dev') || g.L[0]; g.L.forEach(n => { if (n !== hub) lines += '<line x1="' + f1(hub.x) + '" y1="' + f1(hub.y) + '" x2="' + f1(n.x) + '" y2="' + f1(n.y) + '" stroke="' + GC[k] + '" stroke-opacity=".35" stroke-width=".8"/>'; }); }
    N.forEach(n => { circ += '<circle class="bmn" data-w="' + n.w + '" cx="' + f1(n.x) + '" cy="' + f1(n.y) + '" r="' + f1(n.r) + '" fill="' + (COL[n.ty] || '#1fb5a8') + '" fill-opacity="' + (n.ty === 'dust' ? .45 : .85) + '" stroke="#fff" stroke-opacity=".3"/>'; if (n.r > 13) circ += '<text x="' + f1(n.x) + '" y="' + f1(n.y + 3.5) + '" text-anchor="middle" font-size="9.5" font-weight="800" fill="#fff" pointer-events="none">' + (n.a / Sim.SUP * 100).toFixed(1) + '%</text>'; });
    const linked = ((G.dev ? G.dev.a : 0) + (G.cabal ? G.cabal.a : 0)) / Sim.SUP * 100;
    const verdict = linked > 25 ? ['🚨', 'Highly concentrated: one group controls the chart', 'bad'] : linked > 10 ? ['⚠️', 'Noticeable linked supply: be careful', 'mid'] : ['✅', 'Mostly independent holders', 'ok'];
    let o = document.getElementById('bmFull'); if (!o) { o = document.createElement('div'); o.id = 'bmFull'; document.body.appendChild(o); }
    o.innerHTML = '<div class="bmf-top"><button class="ib" data-x="1"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button><div><b>🫧 Bubble map · $' + esc(c.sym) + '</b><span>Top ' + N.length + ' holders · tap a bubble</span></div></div>' +
      '<div class="bmf-v ' + verdict[2] + '">' + verdict[0] + ' ' + verdict[1] + ' <b>' + linked.toFixed(1) + '% linked</b></div>' +
      '<div class="bmf-svg"><svg viewBox="0 0 ' + W + ' ' + H + '">' + hulls + lines + circ + '</svg></div>' +
      '<div class="bmf-g">' + ['dev', 'cabal', 'bots', 'free'].filter(k => G[k]).map(k => '<div><i style="--c:' + GC[k] + '"></i><b>' + GN[k] + '</b><span>' + G[k].n + ' wallets · ' + (G[k].a / Sim.SUP * 100).toFixed(1) + '%</span></div>').join('') + '</div>';
    o.classList.add('on');
    o.onclick = e => { if (e.target.closest('[data-x]')) { o.classList.remove('on'); return; } const n = e.target.closest('.bmn'); if (n && window.Pro && Pro.wallet) Pro.wallet(n.getAttribute('data-w'), c); };
  }
  window.BubbleMap = { open: openMap };
  // buttons: on the small map + in the coin header
  document.addEventListener('click', e => { if (e.target.closest('#bubMap .bm-h, #bubMap .bm-open, #shBubble')) { e.stopPropagation(); openMap(A.OPEN); } }, true);
  const shTop = $('.sh-top'); if (shTop) { const b = document.createElement('button'); b.className = 'ib'; b.id = 'shBubble'; b.title = 'Bubble map'; b.textContent = '🫧'; b.style.fontSize = '18px'; const last = shTop.lastElementChild; shTop.insertBefore(b, last); }
  const ob = window.Pro && Pro.bubbles; if (ob) Pro.bubbles = function (c, el) { ob(c, el); const h = el.querySelector('.bm-h'); if (h && !h.querySelector('.bm-open')) h.insertAdjacentHTML('beforeend', '<button class="bm-open">⛶ Full map</button>'); };

  // ======================= Clips =======================
  const CL = document.createElement('div'); CL.id = 'clips'; CL.innerHTML = '<div class="cl-top"><button class="ib" id="clBack"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button><b>🎬 Clips</b><span class="cl-tabs"><button data-f="fy" class="on">For You</button><button data-f="new">Launches</button></span><button class="ib" id="clTts">🔇</button></div><div class="cl-feed" id="clFeed"></div>';
  document.body.appendChild(CL);
  const feed = $('#clFeed', CL); let filt = 'fy', tts = false, made = 0;
  const HASH = ['#memecoin', '#solana', '#crypto', '#pumpfun', '#trenches', '#100x', '#degen', '#fyp', '#cryptotok', '#altseason'];
  const SOUNDS = ['original sound', 'trench anthem (sped up)', 'money flow remix', 'chill lofi beat', 'phonk drift', 'dramatic boom'];
  function creators() { const L = Array.from(Sim.PW.values()).filter(p => p.ty === 'kol' || p.ty === 'smart' || p.ty === 'whale' || (p.ty === 'retail' && rnd() < .02)); return L.length ? L : Array.from(Sim.PW.values()); }
  function hype(c) { return (c.vol * 1200 + c.hk.length * 300 + Math.max(0, Sim.change(c, 300)) * 400 + (c.boosts || 0) * 800) * (c.grad ? 2 : 1); }
  function chartSvg(c, col) { const cd = c.candles.slice(-60); if (cd.length < 3) return ''; const lo = Math.min(...cd.map(k => k[3])), hi = Math.max(...cd.map(k => k[2])), sp = hi - lo || 1; const pts = cd.map((k, i) => f1(i / (cd.length - 1) * 300) + ',' + f1(150 - (k[4] - lo) / sp * 140)).join(' '); return '<svg class="cl-ch" viewBox="0 0 300 160" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="' + col + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" pathLength="1"/></svg>'; }
  function makeClip(onlyNew) {
    const live = Sim.list.filter(c => !c.dead), age = c => (Sim.t - c.born) / 1000;
    const fresh = live.filter(c => age(c) < 240 && !c.rug), pumps = live.filter(c => !c.rug && Sim.change(c, 300) > 60), rugs = Sim.list.filter(c => c.rug && Sim.t - c.lastT < 600000), bonds = live.filter(c => c.grad && Sim.t - c.gradAt < 900000), cab = live.filter(c => (c.cabal || []).length && !c.rug);
    const types = onlyNew ? [['launch', 1]] : [['launch', fresh.length ? 3 : 0], ['pump', pumps.length ? 4 : 0], ['rug', rugs.length ? 2 : 0], ['bond', bonds.length ? 2 : 0], ['cabal', cab.length ? 1.2 : 0], ['larp', 1.5], ['tip', 1.2]];
    let t = 0; types.forEach(x => t += x[1]); let r = rnd() * t, ty = 'tip'; for (const x of types) { r -= x[1]; if (r <= 0) { ty = x[0]; break; } }
    const cr = pick(creators()); let c = null, cap = '', big = '', vis = '', views;
    const weighted = L => { let s = 0; const w = L.map(c => { const h = hype(c) + 1; s += h; return h; }); let q = rnd() * s; for (let i = 0; i < L.length; i++) { q -= w[i]; if (q <= 0) return L[i]; } return L[0]; };
    if (ty === 'launch') { c = weighted(fresh.length ? fresh : live); const s = Sim.stats(c); cap = '$' + c.sym + ' launched ' + Math.round(age(c)) + 's ago 👀 ' + c.hk.length + ' holders already, dev ' + (s.dev > 0 ? s.dev.toFixed(1) + '%' : 'sold') + (s.snipers > 15 ? ', snipers ' + s.snipers.toFixed(0) + '% 🚩' : ''); big = 'NEW LAUNCH'; }
    else if (ty === 'pump') { c = weighted(pumps); cap = '$' + c.sym + ' is up ' + Sim.change(c, 300).toFixed(0) + '% in 5 minutes 🚀 ' + pick(['still early??', 'who caught this', 'chart is insane', 'dont fade this', 'is it too late?']); big = '+' + Sim.change(c, 300).toFixed(0) + '%'; }
    else if (ty === 'rug') { c = pick(rugs); cap = 'RUG ALERT 🚩 $' + c.sym + ' ' + pick(['dev dumped everything', 'bundles sold together', 'went to zero in seconds', 'cabal exited on everyone']) + '. check holders before you ape'; big = 'RUGGED'; }
    else if (ty === 'bond') { c = pick(bonds); cap = '$' + c.sym + ' just bonded 🎓 migrated to ' + Sim.dex() + ' at ' + A.fUsd(Sim.mcUsd(c)); big = 'BONDED'; }
    else if (ty === 'cabal') { c = pick(cab); cap = 'these ' + c.cabal.length + ' wallets are connected 🕸️ $' + c.sym + ' is a cabal play, they will dump together'; big = 'CABAL?'; }
    else if (ty === 'larp' && window.Art) { const car = rnd() < .6; if (car) { const m = pick(Art.CARS.filter(x => x.usd > 100000)); vis = '<div class="cl-art">' + Art.carArt(m, m.color, { bg: true }) + '</div>'; cap = 'memecoins bought me the ' + m.name + ' 🏎️ ' + pick(['not financial advice', 'trenches pay', 'from $200 to this']); } else { const h = pick(Art.HOUSES); vis = '<div class="cl-art">' + Art.houseArt(h) + '</div>'; cap = 'new crib in ' + h.place + ' 🌴 ' + pick(['one 100x changed everything', 'thanks $' + (pumps[0] || live[0] || { sym: 'BONK' }).sym, 'started with 1 sol']); } big = ''; }
    if (ty === 'tip' || (ty === 'larp' && !vis)) { const E = window.Academy ? Academy.E : []; const e = E.length ? pick(E) : null; const k = e ? pick(e.c) : ['Check holders first', 'Always look at the audit before buying.']; cap = (e ? e.em + ' ' : '💡 ') + k[0] + ': ' + k[1]; big = 'TIP'; vis = '<div class="cl-tip">' + esc(k[0]) + '</div>'; }
    views = c ? Math.max(300, hype(c) * R(.6, 1.6) * (ty === 'rug' ? 1.4 : 1)) : R(2000, 80000) * (cr.kolF ? 3 : 1);
    if (cr.kolF) views *= 1 + Math.log10(cr.kolF) / 3;
    const likes = views * R(.04, .12), cms = likes * R(.04, .1), hs = HASH.slice().sort(() => rnd() - .5).slice(0, 3).join(' ');
    return { id: 'cl' + (++made), ty, c, cr, cap, big, vis, views, likes, cms, hs, snd: pick(SOUNDS) + ' - ' + cr.u, hue: c ? c.hue : Math.floor(rnd() * 360) };
  }
  function clipEl(k) {
    const el = document.createElement('div'); el.className = 'clip ' + k.ty; el.style.setProperty('--h', k.hue); el._k = k;
    const words = k.cap.split(/\s+/).slice(0, 26), col = k.ty === 'rug' ? '#ff3355' : k.ty === 'pump' || k.ty === 'bond' ? '#3dffa0' : '#fff';
    const center = k.vis || (k.c ? '<div class="cl-coin">' + A.avatar(k.c, 120) + '</div>' + chartSvg(k.c, col) : '');
    el.innerHTML = '<div class="cl-bg"></div>' + (k.big ? '<div class="cl-big" style="color:' + col + '">' + esc(k.big) + '</div>' : '') + '<div class="cl-mid">' + center + '</div>' +
      '<div class="cl-cap">' + words.map((w, i) => '<span style="animation-delay:' + (0.25 + i * 0.16).toFixed(2) + 's">' + esc(w) + '</span>').join(' ') + '</div>' +
      '<div class="cl-rail"><span class="cl-av" style="--h:' + (k.cr.h || 200) + '">' + esc(k.cr.av || '🙂') + '</span><button class="cl-lk">❤<b>' + A.fK(k.likes) + '</b></button><span>💬<b>' + A.fK(k.cms) + '</b></span><span>↗<b>' + A.fK(k.likes * .1) + '</b></span>' + (k.c ? '<button class="cl-buy" data-id="' + k.c.id + '">' + k.c.emoji + '<b>$' + esc(k.c.sym) + '</b></button>' : '') + '</div>' +
      '<div class="cl-info"><b>@' + esc(k.cr.u) + '</b>' + (k.cr.kolF ? '<em>KOL</em>' : '') + '<p>' + esc(k.cap) + ' <i>' + esc(k.hs) + '</i></p><span>♫ ' + esc(k.snd) + ' · ' + A.fK(k.views) + ' views</span></div><div class="cl-prog"><i></i></div>';
    return el;
  }
  const IO = new IntersectionObserver(es => es.forEach(e => { const el = e.target; if (e.isIntersecting && e.intersectionRatio > .6) { el.classList.add('on'); fl('clip'); speak(el._k); const all = feed.children; if (el === all[all.length - 2] || el === all[all.length - 1]) more(5); } else el.classList.remove('on'); }), { root: feed, threshold: [0, .6, 1] });
  function more(n) { for (let i = 0; i < n; i++) { const el = clipEl(makeClip(filt === 'new')); feed.appendChild(el); IO.observe(el); } while (feed.children.length > 40) { IO.unobserve(feed.firstChild); const h = feed.firstChild.offsetHeight; feed.firstChild.remove(); feed.scrollTop -= h; } }
  function speak(k) { if (!tts || !window.speechSynthesis) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(k.cap.replace(/\$/g, '').replace(/[^\w\s%.,!?']/g, ' ')); u.rate = 1.12; u.pitch = 1.05; speechSynthesis.speak(u); } catch (e) { } }
  function openClips() { CL.classList.add('on'); if (!feed.children.length) more(6); fl('clip'); }
  function closeClips() { CL.classList.remove('on'); try { speechSynthesis.cancel(); } catch (e) { } }
  window.Clips = { open: openClips };
  $('#clBack', CL).onclick = closeClips;
  $('#clTts', CL).onclick = () => { tts = !tts; $('#clTts', CL).textContent = tts ? '🔊' : '🔇'; if (!tts) try { speechSynthesis.cancel(); } catch (e) { } else { const on = feed.querySelector('.clip.on'); if (on) speak(on._k); } };
  CL.querySelector('.cl-tabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; filt = b.dataset.f; CL.querySelectorAll('.cl-tabs button').forEach(x => x.classList.toggle('on', x === b)); feed.innerHTML = ''; feed.scrollTop = 0; more(6); };
  feed.addEventListener('click', e => {
    const b = e.target.closest('.cl-buy'); if (b) { const c = Sim.coins.get(b.dataset.id); if (c) { closeClips(); A.openToken(c); } return; }
    const l = e.target.closest('.cl-lk'); if (l) { l.classList.toggle('on'); A.hap(10); }
  });
  feed.addEventListener('dblclick', e => { const cl = e.target.closest('.clip'); if (!cl) return; const h = document.createElement('i'); h.className = 'cl-heart'; h.textContent = '❤'; h.style.left = e.offsetX + 'px'; h.style.top = e.offsetY + 'px'; cl.appendChild(h); setTimeout(() => h.remove(), 800); const l = cl.querySelector('.cl-lk'); if (l) l.classList.add('on'); });
  document.addEventListener('click', e => { if (e.target.closest('#clOpen')) openClips(); });
  const back = window.handleBack; window.handleBack = function () { if (CL.classList.contains('on')) { closeClips(); return true; } const bm = document.getElementById('bmFull'); if (bm && bm.classList.contains('on')) { bm.classList.remove('on'); return true; } const ac = document.getElementById('acad'); if (ac && ac.classList.contains('on')) { ac.classList.remove('on'); return true; } return back ? back() : false; };
})();
