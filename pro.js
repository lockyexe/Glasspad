/* Glasspad pro tools (Axiom-style):
   - limit orders, auto take-profit / stop-loss (they go through the same realistic execution: latency, drops, slippage)
   - PnL share cards (post on X)
   - wallet tracker with live feed + KOL alerts, wallet profiles (PnL, win rate, holdings, linked wallets)
   - holder bubble map (linked dev / bundle / cabal / fake-holder clusters)
   - settings: Jito tip (MEV protection), default TP/SL, tracker alerts */
(function () {
  'use strict';
  const A = window.App, Sim = window.Sim; if (!A || !Sim) return;
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const W = () => A.W, CFG = A.CFG, esc = A.esc;
  const now = () => Date.now();
  const f1 = n => (Math.round(n * 10) / 10).toString();
  const Pro = window.Pro = {};

  // ======================= orders =======================
  function orders() { const w = W(); if (!w.orders) w.orders = []; return w.orders; }
  let oid = now() % 1e6;
  function addOrder(o) { o.id = 'o' + (++oid); o.t = now(); orders().push(o); const c = Sim.coins.get(o.cid); if (c) c.keep = true; A.saveW(); return o; }
  function delOrder(id) { const w = W(); w.orders = orders().filter(o => o.id !== id); A.saveW(); }
  Pro.hasOrders = cid => orders().some(o => o.cid === cid);
  const KIND = { limit: 'Limit', tp: 'Take profit', sl: 'Stop loss' };
  function check() {
    const L = orders(); if (!L.length) return;
    for (const o of L.slice()) {
      const c = Sim.coins.get(o.cid);
      if (!c) { if (now() - o.t > 6 * 3600e3) delOrder(o.id); continue; }
      c.keep = true;
      const mc = Sim.mcUsd(c), hit = o.dir === 'below' ? mc <= o.trig : mc >= o.trig;
      if (!hit) continue;
      delOrder(o.id);
      const why = o.kind === 'limit' ? (o.side ? 'limit buy' : 'limit sell') : KIND[o.kind].toLowerCase();
      A.toast(o.kind === 'sl' ? '🛑' : '🎯', KIND[o.kind] + ' triggered · $' + c.sym, 'at ' + A.fUsd(mc) + ' MC, sending tx…', 'info');
      if (o.side) A.userBuy(c, o.sol, null, null, { why, ord: o });
      else { const p = W().pos[c.id]; if (p && p.tok > 0) A.userSell(c, o.frac, null, false, { why, ord: o }); }
    }
  }
  setInterval(check, 300);
  Pro.onFail = (c, side, o) => { // stop losses retry, like real bots do
    if (o && o.ord && o.ord.kind === 'sl') { const p = W().pos[c.id]; if (p && p.tok > 0) { const r = Object.assign({}, o.ord); delete r.id; addOrder(r); A.toast('🔁', 'Stop loss retrying', 'Your sell failed, trying again', 'info'); } }
  };
  function entryMc(p) { return p && p.tok > 0 && p.in > 0 ? p.in / p.tok * Sim.SUP * Sim.solUsd : 0; }
  function syncAuto(c) {
    const p = W().pos[c.id]; const w = W(); w.orders = orders().filter(o => !(o.cid === c.id && (o.kind === 'tp' || o.kind === 'sl')));
    if (p && p.tok > 0) { const e = entryMc(p);
      if (p.tp) addOrder({ cid: c.id, sym: c.sym, kind: 'tp', side: 0, dir: 'above', trig: e * (1 + p.tp / 100), frac: 0.5 });
      if (p.sl) addOrder({ cid: c.id, sym: c.sym, kind: 'sl', side: 0, dir: 'below', trig: e * (1 - p.sl / 100), frac: 1 }); }
    A.saveW();
  }
  Pro.onFill = (c, side, sol, tok) => {
    const p = W().pos[c.id]; if (!p) return;
    if (side) { if (p.tp == null) p.tp = +CFG.tp || 0; if (p.sl == null) p.sl = +CFG.sl || 0; if (p.tp || p.sl) syncAuto(c); }
    else if (p.tok <= 0) { const w = W(); w.orders = orders().filter(o => !(o.cid === c.id && o.side === 0)); A.saveW(); }
  };

  // ---- position card: auto sell + open orders + share PnL ----
  Pro.renderPos = function (c) {
    const box = $('#posX'); if (!box) return; const p = W().pos[c.id]; if (!p) return;
    const L = orders().filter(o => o.cid === c.id), e = entryMc(p);
    const key = c.id + '|' + (p.tp || 0) + '|' + (p.sl || 0) + '|' + L.map(o => o.id).join(',') + '|' + (p.tok > 0);
    if (box._k === key) return; box._k = key;
    const ch = (arr, cur, k) => arr.map(v => '<button data-' + k + '="' + v + '"' + ((+cur || 0) === v ? ' class="on"' : '') + '>' + (v ? (k === 'tp' ? '+' : '-') + v + '%' : 'Off') + '</button>').join('');
    box.innerHTML = (p.tok > 0 ? '<div class="px-r"><span>Take profit <em>(sells half)</em></span><div class="minis">' + ch([0, 50, 100, 300], p.tp, 'tp') + '</div></div><div class="px-r"><span>Stop loss <em>(sells all)</em></span><div class="minis">' + ch([0, 25, 40, 60], p.sl, 'sl') + '</div></div>' +
      (e ? '<div class="px-n mu">Avg entry ' + A.fUsd(e) + ' MC</div>' : '') : '') +
      (L.length ? '<div class="px-o">' + L.map(o => '<div><span>' + (o.side ? '🟢 ' : o.kind === 'sl' ? '🛑 ' : '🎯 ') + KIND[o.kind] + (o.side ? ' buy ◎' + A.fSol(o.sol) : ' ' + Math.round(o.frac * 100) + '%') + ' ' + (o.dir === 'below' ? '≤ ' : '≥ ') + A.fUsd(o.trig) + '</span><button data-x="' + o.id + '">✕</button></div>').join('') + '</div>' : '') +
      '<button class="sbtn px-sh">📸 Share PnL card</button>';
  };
  document.addEventListener('click', e => {
    const box = e.target.closest('#posX'); if (!box || !A.OPEN) return; const c = A.OPEN, p = W().pos[c.id]; if (!p) return;
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tp != null) { p.tp = +b.dataset.tp; syncAuto(c); A.hap(6); A.SND.tap(); box._k = null; Pro.renderPos(c); if (p.tp) A.toast('🎯', 'Take profit set', 'Sells half at +' + p.tp + '% (' + A.fUsd(entryMc(p) * (1 + p.tp / 100)) + ' MC)', 'ok'); }
    else if (b.dataset.sl != null) { p.sl = +b.dataset.sl; syncAuto(c); A.hap(6); A.SND.tap(); box._k = null; Pro.renderPos(c); if (p.sl) A.toast('🛑', 'Stop loss set', 'Sells all at -' + p.sl + '% (' + A.fUsd(entryMc(p) * (1 - p.sl / 100)) + ' MC). Can fail in a fast dump', 'ok'); }
    else if (b.dataset.x) { delOrder(b.dataset.x); box._k = null; Pro.renderPos(c); A.SND.tap(); }
    else if (b.classList.contains('px-sh')) shareCard(c);
  });

  // ---- limit order form (in the trade card) ----
  let lSide = 1, lTrig = 0, lAmt = 0.5;
  function renderLimit() {
    const box = $('#lBox'), c = A.OPEN; if (!box || !c) return; const mc = Sim.mcUsd(c), p = W().pos[c.id], held = p && p.tok > 0;
    if (!lTrig) lTrig = Math.round(mc * (lSide ? .75 : 1.5));
    const rel = lSide ? [-10, -25, -50] : [25, 50, 100, 300];
    box.innerHTML = '<div class="minis lside"><button data-ls="1"' + (lSide ? ' class="on"' : '') + '>Limit buy</button><button data-ls="0"' + (!lSide ? ' class="on"' : '') + '>Limit sell</button></div>' +
      '<div class="lrow"><span>When MC ' + (lSide ? 'drops to' : 'reaches') + '</span><input id="lTrig" class="mini-in" inputmode="decimal" value="' + Math.round(lTrig) + '"></div>' +
      '<div class="minis">' + rel.map(r => '<button data-rel="' + r + '">' + (r > 0 ? '+' : '') + r + '%</button>').join('') + '</div>' +
      '<div class="lrow"><span>' + (lSide ? 'Spend' : 'Sell') + '</span><div class="minis">' + (lSide ? [0.1, 0.5, 1, 2] : [25, 50, 100]).map(v => '<button data-la="' + v + '"' + ((lSide ? v === lAmt : v === lAmt) ? ' class="on"' : '') + '>' + (lSide ? '◎' + v : v + '%') + '</button>').join('') + '</div></div>' +
      '<button class="sbtn lgo"' + (!lSide && !held ? ' disabled' : '') + '>' + (lSide ? 'Place limit buy' : held ? 'Place limit sell' : 'Hold some first') + '</button>' +
      '<div class="mu" style="font-size:11px;margin-top:6px">Now ' + A.fUsd(mc) + ' MC. When it triggers, the order still has to land (latency + slippage).</div>';
  }
  document.addEventListener('toggle', e => { if (e.target && e.target.id === 'lAdv' && e.target.open) { lTrig = 0; lAmt = lSide ? 0.5 : 50; renderLimit(); } }, true);
  document.addEventListener('click', e => {
    const box = e.target.closest('#lBox'); if (!box || !A.OPEN) return; const c = A.OPEN, b = e.target.closest('button'); if (!b) return; A.hap(6);
    if (b.dataset.ls != null) { lSide = +b.dataset.ls; lTrig = 0; lAmt = lSide ? 0.5 : 50; renderLimit(); }
    else if (b.dataset.rel != null) { lTrig = Sim.mcUsd(c) * (1 + +b.dataset.rel / 100); renderLimit(); }
    else if (b.dataset.la != null) { lAmt = +b.dataset.la; renderLimit(); }
    else if (b.classList.contains('lgo')) {
      const t = parseFloat(String($('#lTrig').value).replace(/[$,k]/gi, m => m.toLowerCase() === 'k' ? '000' : '')); if (!(t > 0)) return A.toast('⚠️', 'Enter a market cap', null, 'bad');
      const mc = Sim.mcUsd(c);
      if (lSide) { if (lAmt > W().sol) return A.toast('◎', 'Not enough SOL', null, 'bad'); addOrder({ cid: c.id, sym: c.sym, kind: 'limit', side: 1, dir: t <= mc ? 'below' : 'above', trig: t, sol: lAmt }); }
      else addOrder({ cid: c.id, sym: c.sym, kind: 'limit', side: 0, dir: t >= mc ? 'above' : 'below', trig: t, frac: lAmt / 100 });
      A.SND.ok(); A.toast('📝', 'Limit ' + (lSide ? 'buy' : 'sell') + ' placed', '$' + c.sym + ' at ' + A.fUsd(t) + ' MC', 'ok'); $('#posX') && ($('#posX')._k = null); $('#lAdv').open = false;
    }
  });
  document.addEventListener('change', e => { if (e.target && e.target.id === 'lTrig') lTrig = parseFloat(e.target.value) || lTrig; });

  // ======================= PnL cards =======================
  function cardData(c) {
    const p = W().pos[c.id], v = p.tok > 0 ? Sim.quoteSell(c, p.tok) : 0, pn = v + p.out - p.in;
    const first = (W().hist || []).filter(h => h.id === c.id).pop();
    return { sym: c.sym, name: c.name, em: c.emoji, hue: c.hue, inv: p.in, out: p.out + v, pn, pc: p.in ? pn / p.in * 100 : 0, held: first ? now() - first.t : 0, open: p.tok > 0, sol: Sim.solUsd, d: new Date().toISOString().slice(0, 10), h: (W().x && W().x.handle) || 'you' };
  }
  Pro.pnlSvg = function (d) {
    const up = d.pn >= 0, c1 = up ? '#0f3d2a' : '#3d0f1a', c2 = up ? '#1fd38c' : '#ff3355', id = 'pc' + Math.floor(Math.random() * 1e9);
    const age = d.held < 3600e3 ? Math.max(1, Math.round(d.held / 60000)) + 'm' : d.held < 86400e3 ? Math.round(d.held / 3600e3) + 'h' : Math.round(d.held / 86400e3) + 'd';
    const big = (up ? '+' : '') + (Math.abs(d.pc) >= 1000 ? Math.round(d.pc).toLocaleString('en-US') : d.pc.toFixed(1)) + '%';
    return '<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#07080e"/><stop offset="1" stop-color="' + c1 + '"/></linearGradient><radialGradient id="' + id + 'g" cx=".85" cy=".2" r=".7"><stop offset="0" stop-color="' + c2 + '" stop-opacity=".35"/><stop offset="1" stop-color="' + c2 + '" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="320" height="180" rx="14" fill="url(#' + id + ')"/><rect width="320" height="180" rx="14" fill="url(#' + id + 'g)"/>' +
      '<text x="18" y="30" font-size="11" font-weight="800" fill="#9aa0b0" font-family="Inter,Arial" letter-spacing="1.5">GLASSPAD · SIM</text>' +
      '<text x="18" y="56" font-size="20" font-weight="900" fill="#fff" font-family="Inter,Arial">' + esc(d.em || '') + ' $' + esc(d.sym) + '</text>' +
      '<text x="18" y="106" font-size="42" font-weight="900" fill="' + c2 + '" font-family="Inter,Arial">' + big + '</text>' +
      '<text x="18" y="128" font-size="13" font-weight="800" fill="' + c2 + '" font-family="JetBrains Mono,monospace">' + (up ? '+' : '-') + '◎' + Math.abs(d.pn).toFixed(3) + ' · $' + Math.round(Math.abs(d.pn) * d.sol).toLocaleString('en-US') + '</text>' +
      '<text x="18" y="156" font-size="10.5" fill="#c9ced9" font-family="Inter,Arial">In ◎' + d.inv.toFixed(3) + '   ' + (d.open ? 'Worth' : 'Out') + ' ◎' + d.out.toFixed(3) + '   Held ' + age + '</text>' +
      '<text x="302" y="166" font-size="9" fill="#6b7180" text-anchor="end" font-family="Inter,Arial">@' + esc(d.h) + ' · ' + d.d + ' · simulated</text>' +
      '<circle cx="268" cy="62" r="30" fill="hsl(' + (d.hue || 200) + ',70%,45%)" opacity=".9"/><text x="268" y="73" font-size="30" text-anchor="middle">' + esc(d.em || '🪙') + '</text></svg>';
  };
  function shareCard(c) {
    const d = cardData(c), txt = (d.pn >= 0 ? pick(['$' + d.sym + ' paid me 🫡', 'another one. $' + d.sym, '$' + d.sym + ' printed', 'told yall about $' + d.sym]) : pick(['$' + d.sym + ' cooked me 💀', 'paid tuition on $' + d.sym, 'down bad on $' + d.sym + ', posting for accountability']));
    ov('<h4>📸 PnL card</h4><div class="pnlc">' + Pro.pnlSvg(d) + '</div><div class="mu" style="font-size:11.5px;margin:8px 2px">Cards are marked "simulated" on purpose.</div>', [['Close', null], ['Post on X', () => { A.life.post(txt, { img: { k: 'pnl', d }, coin: c.id }); A.toast('🐦', 'Posted your PnL', null, 'ok'); }]]);
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  // HTML modal (same overlay as the business screens)
  function ov(html, btns) {
    let o = document.getElementById('ov'); if (!o) { o = document.createElement('div'); o.id = 'ov'; document.body.appendChild(o); o.addEventListener('click', e => { if (e.target.id === 'ov') o.classList.remove('on'); }); }
    o.innerHTML = '<div class="mbox">' + html + '<div class="mbtns">' + (btns || []).map((b, i) => '<button data-i="' + i + '"' + (i === btns.length - 1 && btns.length > 1 ? ' class="buyb"' : '') + '>' + b[0] + '</button>').join('') + '</div></div>';
    o.querySelectorAll('.mbtns button').forEach(b => b.onclick = () => { o.classList.remove('on'); const f = btns[+b.dataset.i][1]; if (f) f(); });
    o.classList.add('on'); return o;
  }
  const closeOv = () => { const o = document.getElementById('ov'); if (o) o.classList.remove('on'); };

  // ======================= wallet tracker =======================
  const TF = []; // live feed of tracked wallets
  function tracked() { const w = W(); if (!w.track) { if (!Sim.BY || !Sim.BY.smart) return []; w.track = []; seedTrack(); } return w.track; }
  function seedTrack() {
    const pickT = (ty, n) => { let L = Sim.leaders(30, ty); if (L.length < n) L = L.concat((Sim.BY[ty] || []).filter(p => L.indexOf(p) < 0)); L.slice(0, n).forEach(p => { if (!W().track.some(x => x.w === p.w)) W().track.push(snap(p)); }); };
    pickT('smart', 3); pickT('kol', 2); pickT('whale', 1);
    if (W().track.length < 4) Sim.leaders(10).slice(0, 5).forEach(p => { if (!W().track.some(x => x.w === p.w)) W().track.push(snap(p)); });
    A.saveW();
  }
  const snap = p => ({ w: p.w, u: p.u, av: p.av, h: p.h, ty: p.ty, bank: p.bank, kolF: p.kolF || 0, pnl: p.pnl, wins: p.wins, losses: p.losses, trades: p.trades });
  let TS = new Set();
  function rebuild() { TS = new Set(tracked().map(t => t.w)); }
  // tracked wallets survive restarts: re-adopt them into the sim
  setTimeout(() => { tracked().forEach(t => Sim.adopt(t)); rebuild(); }, 0);
  setInterval(() => { tracked().forEach(t => { const p = Sim.persona(t.w); if (p) Object.assign(t, snap(p)); }); }, 15000);
  let lastAlert = 0;
  const prevTrade = Sim.onTrade;
  Sim.onTrade = (c, tr) => {
    if (prevTrade) prevTrade(c, tr);
    if (!TS.has(tr.w)) return;
    const p = Sim.persona(tr.w); TF.unshift({ t: Sim.t, w: tr.w, u: p ? p.u : tr.w.slice(0, 6), av: p ? p.av : '👛', h: p ? p.h : 200, ty: p ? p.ty : '', cid: c.id, sym: c.sym, s: tr.s, sol: tr.sol, mc: tr.m * Sim.solUsd }); if (TF.length > 120) TF.length = 120;
    if (CFG.kolAlerts && tr.s && tr.sol >= 0.5 && now() - lastAlert > 9000 && A.VIEW !== 'set') { lastAlert = now(); A.toast(p ? p.av : '🔔', '@' + (p ? p.u : tr.w.slice(0, 6)) + ' bought ◎' + A.fSol(tr.sol) + ' of $' + c.sym, 'at ' + A.fUsd(tr.m * Sim.solUsd) + ' MC · tracker', 'info'); }
  };
  const TYL = Sim.TNAME;
  Pro.renderTracker = function (box) {
    const T = tracked(); if (!T.length) { box.innerHTML = '<div class="empty">No wallets tracked. <button class="sbtn trk-add">Find top wallets</button></div>'; return; }
    const head = '<div class="trk-h"><b>Tracked wallets</b><span class="mu">' + T.length + '</span><button class="sbtn sm trk-add">+ Add</button><button class="sbtn sm trk-al">' + (CFG.kolAlerts ? '🔔 On' : '🔕 Off') + '</button></div>' +
      '<div class="trk-w">' + T.map(t => { const p = Sim.persona(t.w) || t, wr = p.wins + p.losses ? Math.round(p.wins / (p.wins + p.losses) * 100) : 0; return '<div class="trk-c" data-w="' + t.w + '"><span class="tav" style="--h:' + t.h + '">' + t.av + '</span><div><b>' + esc(t.u) + '</b><em>' + (TYL[t.ty] || '') + '</em><span class="' + (p.pnl >= 0 ? 'up' : 'dn') + '">' + (p.pnl >= 0 ? '+' : '') + A.fSol(p.pnl) + ' SOL · ' + wr + '% win</span></div></div>'; }).join('') + '</div>';
    const rows = TF.slice(0, 40).map(x => '<div class="trk-r ' + (x.s ? 'b' : 's') + '" data-id="' + x.cid + '"><span class="tav" style="--h:' + x.h + '">' + x.av + '</span><div><b>' + esc(x.u) + '</b> ' + (x.s ? '<span class="up">bought</span>' : '<span class="dn">sold</span>') + ' ◎' + A.fSol(x.sol) + ' <b>$' + esc(x.sym) + '</b><em>' + A.fUsd(x.mc) + ' MC</em></div><span class="mu">' + A.fAge(Sim.t - x.t) + '</span></div>').join('');
    const h = head + '<div class="trk-f"><div class="plh">Live trades</div>' + (rows || '<div class="mu" style="padding:10px">Waiting for your wallets to trade…</div>') + '</div>';
    if (box._h !== h) { box._h = h; box.innerHTML = h; }
  };
  document.addEventListener('click', e => {
    const box = e.target.closest('#trkBox'); if (!box) return;
    if (e.target.closest('.trk-add')) return leaderboard();
    if (e.target.closest('.trk-al')) { CFG.kolAlerts = !CFG.kolAlerts; A.saveC(); box._h = null; Pro.renderTracker(box); A.SND.tap(); return; }
    const wc = e.target.closest('[data-w]'); if (wc) return Pro.wallet(wc.dataset.w);
    const r = e.target.closest('[data-id]'); if (r) { const c = Sim.coins.get(r.dataset.id); if (c) A.openToken(c); }
  });
  function track(w, on) {
    const T = tracked(), i = T.findIndex(t => t.w === w);
    if (on && i < 0) { const p = Sim.persona(w); if (p) T.push(snap(p)); else T.push({ w, u: w.slice(0, 6).toLowerCase(), av: '👛', h: 200, ty: 'retail', pnl: 0, wins: 0, losses: 0, trades: 0 }); }
    if (!on && i >= 0) T.splice(i, 1);
    rebuild(); A.saveW(); const tb = $('#trkBox'); if (tb) tb._h = null;
  }
  function leaderboard() {
    const L = Sim.leaders(15).filter(p => !TS.has(p.w));
    ov('<h4>🏆 Top wallets right now</h4><div class="lb">' + L.map(p => { const wr = p.wins + p.losses ? Math.round(p.wins / (p.wins + p.losses) * 100) : 0; return '<div class="lb-r" data-w="' + p.w + '"><span class="tav" style="--h:' + p.h + '">' + p.av + '</span><div><b>' + esc(p.u) + '</b><em>' + (TYL[p.ty] || '') + (p.kolF ? ' · ' + A.fK(p.kolF) + ' followers' : '') + '</em></div><span class="' + (p.pnl >= 0 ? 'up' : 'dn') + '">' + (p.pnl >= 0 ? '+' : '') + A.fSol(p.pnl) + ' ◎<br><em>' + wr + '% win</em></span><button class="sbtn sm">Track</button></div>'; }).join('') + '</div>', [['Done', null]]);
  }
  document.addEventListener('click', e => { const r = e.target.closest('.lb-r'); if (!r) return; const b = e.target.closest('button'); if (b) { track(r.dataset.w, true); b.textContent = '✓ Tracking'; b.disabled = true; A.hap(8); A.SND.ok(); } else Pro.wallet(r.dataset.w); });

  // ---- wallet profile ----
  Pro.wallet = function (w, c0) {
    const p = Sim.persona(w), c = c0 || A.OPEN, h = c ? c.hi.get(w) : null, ty = h ? h.ty : p ? p.ty : 'retail';
    const linked = c && (w === c.dev || c.bundles.indexOf(w) >= 0 || (c.cabal || []).indexOf(w) >= 0 || ty === 'dust');
    const hold = []; for (const k of Sim.list) { const a = k.holders.get(w); if (a && !k.dead) hold.push([k, a]); if (hold.length > 8) break; }
    const wr = p && p.wins + p.losses ? Math.round(p.wins / (p.wins + p.losses) * 100) : null, isT = TS.has(w);
    const nm = p && p.ty !== 'sniper' && p.ty !== 'bot' ? p.u : w.slice(0, 4) + '…' + w.slice(-4);
    const note = { dust: 'Got a tiny airdrop from the dev wallet. Never bought, never sells. Only there to make the holder count look bigger.', bundle: 'Bought in the same block as the dev, funded from the same source. Usually sells with the dev.', cabal: 'Part of a group of linked wallets that bought together and will likely dump together.', vol: 'Wash-trading bot. Buys and sells the same amount to fake volume.', mev: 'MEV bot. Sandwiches big buys.', sniper: 'Sniper bot. Buys in the first block, sells into the first pump.', dev: 'The wallet that launched this coin.', kol: 'Influencer wallet. Buys before posting the CA, then sells to followers.', smart: 'Profitable trader. Buys early, sells into strength.', whale: 'Big wallet. Moves the price.', copy: 'Copy trader following a KOL.' }[ty];
    ov('<h4><span class="tav" style="--h:' + (p ? p.h : 200) + '">' + (p ? p.av : '👛') + '</span> ' + esc(nm) + '</h4>' +
      '<div class="mu" style="font-size:11px;font-family:var(--mono,monospace);word-break:break-all">' + w + '</div>' +
      '<div class="bizk"><div><span>Type</span><b>' + (Sim.TYPES[ty] || '') + ' ' + (TYL[ty] || 'Retail') + '</b></div><div><span>Realized PnL</span><b class="' + (p && p.pnl < 0 ? 'dn' : 'up') + '">' + (p ? (p.pnl >= 0 ? '+' : '') + A.fSol(p.pnl) + ' ◎' : '—') + '</b></div><div><span>Win rate</span><b>' + (wr != null ? wr + '%' : '—') + '</b></div><div><span>Trades</span><b>' + (p ? p.trades : '—') + '</b></div></div>' +
      (note ? '<div class="wnote' + (linked || ty === 'vol' ? ' bad' : '') + '">' + (linked ? '🔗 Linked to the dev. ' : '') + note + '</div>' : '') +
      (c && h ? '<div class="plh">In $' + esc(c.sym) + '</div><div class="mu" style="font-size:12.5px">Entry ' + A.fUsd(h.e * Sim.solUsd) + ' MC · now ' + (Sim.mc(c) / h.e).toFixed(2) + 'x · holds ' + ((c.holders.get(w) || 0) / Sim.SUP * 100).toFixed(2) + '%</div>' : '') +
      (hold.length ? '<div class="plh">Holding</div><div class="whold">' + hold.map(x => '<span data-id="' + x[0].id + '">' + x[0].emoji + ' $' + esc(x[0].sym) + ' <em>' + (x[1] / Sim.SUP * 100).toFixed(2) + '%</em></span>').join('') + '</div>' : ''),
      [['Close', null], [isT ? 'Untrack' : '👁 Track wallet', () => { track(w, !isT); A.toast('👁', isT ? 'Stopped tracking' : 'Tracking ' + nm, isT ? null : 'Their trades show in Pulse → Tracker', 'ok'); }]]);
  };
  document.addEventListener('click', e => {
    const fl = e.target.closest('#fList'); if (fl) { const r = e.target.closest('[data-w]'); if (r && !e.target.closest('.lkb')) Pro.wallet(r.dataset.w, A.OPEN); return; }
    const hs = e.target.closest('.whold [data-id]'); if (hs) { const c = Sim.coins.get(hs.dataset.id); if (c) { closeOv(); A.openToken(c); } }
  });

  // ======================= bubble map =======================
  const COL = { dev: '#ff3355', bundle: '#ff7a1a', cabal: '#b46cff', dust: '#6b7180', sniper: '#ffc21a', smart: '#1fd38c', whale: '#2f6bff', kol: '#ff5fa2', copy: '#ff9ed0', mev: '#9aa0b0', vol: '#9aa0b0', retail: '#1fb5a8', paper: '#5fb5c8', diamond: '#7ad3ff', momentum: '#4fc3a1', dip: '#3fa0a0', bot: '#9aa0b0', boost: '#ffffff' };
  function hash(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  Pro.bubbles = function (c, el) {
    if (el._id === c.id && now() - el._t < 3000) return; el._id = c.id; el._t = now();
    const top = Sim.topHolders(c, 38); const dust = []; for (const [w2] of c.holders) { const hh = c.hi.get(w2); if (hh && hh.ty === 'dust') { dust.push([w2, c.holders.get(w2)]); if (dust.length >= 10) break; } }
    const all = top.concat(dust.filter(d => !top.some(t => t[0] === d[0])));
    const isLink = (w, ty) => w === c.dev || ty === 'bundle' || ty === 'cabal' || ty === 'dust';
    const N = all.map(x => { const hh = c.hi.get(x[0]), ty = x[0] === c.dev ? 'dev' : hh ? hh.ty : 'retail', hs = hash(x[0]); return { w: x[0], a: x[1], ty, link: isLink(x[0], ty), r: Math.max(2.6, Math.sqrt(x[1] / Sim.SUP) * 75), x: 30 + hs % 260, y: 18 + (hs >> 9) % 130, vx: 0, vy: 0 }; });
    const hub = N.find(n => n.ty === 'dev') || N.find(n => n.link);
    for (let it = 0; it < 70; it++) {
      for (let i = 0; i < N.length; i++) { const a = N[i];
        for (let j = i + 1; j < N.length; j++) { const b = N[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .1, min = a.r + b.r + 3; if (d < min) { const k = (min - d) / d * .5; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k; } }
        if (a.link && hub && a !== hub) { a.x += (hub.x - a.x) * .04; a.y += (hub.y - a.y) * .04; }
        else if (!a.link) { a.x += (160 - a.x) * .004; a.y += (85 - a.y) * .004; }
        a.x = Math.max(a.r + 2, Math.min(318 - a.r, a.x)); a.y = Math.max(a.r + 2, Math.min(168 - a.r, a.y)); }
    }
    let lines = '', circ = '', lp = 0;
    N.forEach(n => { if (n.link && hub && n !== hub) lines += '<line x1="' + f1(hub.x) + '" y1="' + f1(hub.y) + '" x2="' + f1(n.x) + '" y2="' + f1(n.y) + '" stroke="#ff3355" stroke-opacity=".45" stroke-width=".8"/>'; if (n.link) lp += n.a; });
    N.forEach(n => { circ += '<circle data-w="' + n.w + '" cx="' + f1(n.x) + '" cy="' + f1(n.y) + '" r="' + f1(n.r) + '" fill="' + (COL[n.ty] || '#1fb5a8') + '" fill-opacity="' + (n.ty === 'dust' ? .45 : .8) + '" stroke="#fff" stroke-opacity=".25"/>'; });
    const sum = lp / Sim.SUP * 100, dn = N.filter(n => n.ty === 'dust').length;
    el.innerHTML = '<div class="bm-h"><b>Bubble map</b><span class="' + (sum > 15 ? 'dn' : 'mu') + '">🔗 Linked to dev: ' + sum.toFixed(1) + '%' + (c.dust ? ' · 👻 ' + c.dust + ' fake' : '') + '</span></div><svg viewBox="0 0 320 170">' + lines + circ + '</svg><div class="bm-l"><i style="--c:#ff3355"></i>dev <i style="--c:#ff7a1a"></i>bundle <i style="--c:#b46cff"></i>cabal <i style="--c:#6b7180"></i>fake <i style="--c:#ffc21a"></i>sniper <i style="--c:#1fd38c"></i>smart <i style="--c:#2f6bff"></i>whale <i style="--c:#1fb5a8"></i>retail</div>';
  };
  document.addEventListener('click', e => { const ci = e.target.closest('#bubMap circle[data-w]'); if (ci) Pro.wallet(ci.getAttribute('data-w'), A.OPEN); });

  // ======================= settings =======================
  (function settings() {
    const row = $('#prioRow'); if (!row) return;
    const mk = (id, t, d, opts) => { const el = document.createElement('div'); el.className = 'srow'; el.innerHTML = '<div><div class="t">' + t + '</div><div class="d">' + d + '</div></div><div class="minis" id="' + id + '">' + opts.map(o => '<button data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>'; return el; };
    const j = mk('cfgJito', 'MEV protection (Jito tip)', 'Tip validators: lands faster and can\'t be sandwiched', [[0, 'Off'], [0.001, '◎.001'], [0.005, '◎.005']]);
    const tp = mk('cfgTp', 'Auto take profit', 'Added to every new buy (sells half)', [[0, 'Off'], [50, '+50%'], [100, '+100%'], [300, '+300%']]);
    const sl = mk('cfgSl', 'Auto stop loss', 'Added to every new buy (sells all)', [[0, 'Off'], [25, '-25%'], [40, '-40%'], [60, '-60%']]);
    row.after(j); j.after(tp); tp.after(sl);
    const paint = () => { [['cfgJito', 'jito'], ['cfgTp', 'tp'], ['cfgSl', 'sl']].forEach(x => $$('#' + x[0] + ' button').forEach(b => b.classList.toggle('on', +b.dataset.v === (+CFG[x[1]] || 0)))); };
    [['cfgJito', 'jito'], ['cfgTp', 'tp'], ['cfgSl', 'sl']].forEach(x => $('#' + x[0]).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; CFG[x[1]] = +b.dataset.v; A.saveC(); paint(); A.hap(6); A.SND.tap(); }));
    paint();
  })();
  setInterval(() => { if (A.OPEN && $('#lAdv') && $('#lAdv').open) { const t = $('#lBox .mu'); if (t) t.textContent = 'Now ' + A.fUsd(Sim.mcUsd(A.OPEN)) + ' MC. When it triggers, the order still has to land (latency + slippage).'; } }, 1000);
})();
