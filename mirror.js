/* Live pump.fun feed → mirror market. Real launches + real trades (PumpPortal data websocket, free).
   Solo: this phone connects. Online: only the host connects and relays events in its frames, so every phone matches.
   If the feed is down, Sim.mirror switches off and simulated launches resume automatically. */
(function () {
  'use strict';
  const A = window.App, Sim = window.Sim, MP = window.MP || {}; if (!A || !Sim) return;
  const URL0 = 'wss://pumpportal.fun/api/data';
  const feedUrl = () => { try { return localStorage.getItem('gp_feed') || URL0; } catch (e) { return URL0; } };
  if (A.CFG.mirror == null) A.CFG.mirror = true;
  let ws = null, open = false, retry = 0, lastMsg = 0, Q = [], pend = [];
  const active = new Map(); // mint -> last activity (ms)
  const ST = { c: 0, t: 0, c0: 0, t0: 0, rate: [0, 0], at: Date.now() };
  const num = x => (typeof x === 'number' ? x : parseFloat(x)) || 0;
  const iAmSource = () => !Sim.mp || MP.host;
  const wantFeed = () => A.CFG.mirror && iAmSource();
  const healthy = () => open && Date.now() - lastMsg < 30000;

  function connect() {
    if (ws || !wantFeed()) return;
    try { ws = new WebSocket(feedUrl()); } catch (e) { ws = null; return; }
    ws.onopen = () => { open = true; retry = 0; send({ method: 'subscribeNewToken' }); const k = [...active.keys()]; for (let i = 0; i < k.length; i += 50) send({ method: 'subscribeTokenTrade', keys: k.slice(i, i + 50) }); };
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } lastMsg = Date.now(); onMsg(m); };
    ws.onclose = () => { open = false; ws = null; if (wantFeed()) setTimeout(connect, Math.min(30000, 1500 * Math.pow(2, retry++))); };
    ws.onerror = () => { };
  }
  function close() { if (ws) { try { ws.close(); } catch (e) { } ws = null; open = false; } }
  function send(o) { if (ws && open) try { ws.send(JSON.stringify(o)); } catch (e) { } }
  function onMsg(m) {
    if (!m || !m.mint) return; const t = m.txType;
    if (t === 'create') {
      ST.c++; active.set(m.mint, Date.now()); pend.push(m.mint);
      Q.push({ k: 'c', m: m.mint, n: m.name, y: m.symbol, u: m.uri, d: m.traderPublicKey, s: +num(m.solAmount).toFixed(6), tk: Math.round(num(m.initialBuy)), vs: +num(m.vSolInBondingCurve).toFixed(9), vt: Math.round(num(m.vTokensInBondingCurve)) });
    } else if (t === 'buy' || t === 'sell') {
      if (!active.has(m.mint)) return; ST.t++; active.set(m.mint, Date.now());
      Q.push({ k: 't', m: m.mint, b: t === 'buy' ? 1 : 0, w: m.traderPublicKey, s: +num(m.solAmount).toFixed(6), tk: Math.round(num(m.tokenAmount)), vs: +num(m.vSolInBondingCurve).toFixed(9), vt: Math.round(num(m.vTokensInBondingCurve)) });
    }
  }
  // subscriptions: follow each new coin's trades; drop quiet ones; cap how many we follow
  setInterval(() => {
    if (!open) return;
    if (pend.length) send({ method: 'subscribeTokenTrade', keys: pend.splice(0, 50) });
    const now = Date.now(), drop = []; for (const [k, t] of active) if (now - t > 360000) drop.push(k);
    const keepMax = window.QUAL === 'lo' ? 80 : 150;
    if (active.size - drop.length > keepMax) { const L = [...active].filter(x => drop.indexOf(x[0]) < 0).sort((a, b) => a[1] - b[1]); for (let i = 0; i < active.size - drop.length - keepMax; i++) drop.push(L[i][0]); }
    if (drop.length) { drop.forEach(k => active.delete(k)); for (let i = 0; i < drop.length; i += 50) send({ method: 'unsubscribeTokenTrade', keys: drop.slice(i, i + 50) }); }
  }, 1000);
  // feed events into the market (through the same command path as player trades, so multiplayer stays in sync)
  setInterval(() => {
    if (iAmSource()) Sim.mirror = !!(A.CFG.mirror && healthy());
    if (!Q.length) return; if (!iAmSource()) { Q = []; return; }
    Sim.cmd({ k: 'mir', e: Q.splice(0, 300) });
  }, 250);
  setInterval(() => { if (wantFeed()) connect(); else close(); }, 2000);
  setInterval(() => { const dt = (Date.now() - ST.at) / 60000; ST.rate = [(ST.c - ST.c0) / dt, (ST.t - ST.t0) / dt / 60]; ST.c0 = ST.c; ST.t0 = ST.t; ST.at = Date.now(); }, 30000);

  // real coin images (cosmetic, loaded only when you open the coin)
  const sh = document.getElementById('sheet');
  if (sh) new MutationObserver(() => { const c = A.OPEN; if (!sh.classList.contains('on') || !c || !c.mir || c.img || !c.uri || c._imgTry) return; c._imgTry = 1;
    fetch(c.uri).then(r => r.json()).then(j => { if (j && j.image) { c.img = j.image; const av = document.getElementById('shAv'); if (av) av.innerHTML = A.avatar(c, 40); } }).catch(() => { }); }).observe(sh, { attributes: true, attributeFilter: ['class'] });

  // UI: status chip in Pulse + settings row
  const lb = document.querySelector('.livebar');
  if (lb) { const ch = document.createElement('span'); ch.className = 'chip mir-chip'; ch.id = 'mirChip'; lb.insertBefore(ch, lb.firstChild.nextSibling);
    const up = () => { const on = Sim.mirror; ch.className = 'chip mir-chip' + (on ? ' on' : ''); ch.innerHTML = on ? '<i></i>REAL pump.fun' + (ST.rate[0] ? ' · ' + Math.round(ST.rate[0]) + ' launches/min' : '') : A.CFG.mirror ? (Sim.mp && !MP.host ? '🌐 host decides' : '🌐 connecting… (sim meanwhile)') : '🧪 Simulated market'; };
    up(); setInterval(up, 2000); }
  const th = document.getElementById('prioRow');
  if (th) { const el = document.createElement('div'); el.className = 'srow'; el.innerHTML = '<div><div class="t">🌐 Market source</div><div class="d">Real = live pump.fun coins & trades, your trades move the price. Online, the host\'s choice applies.</div></div><div class="minis" id="cfgMir"><button data-v="1">Real</button><button data-v="0">Sim</button></div>';
    th.parentNode.insertBefore(el, th.parentNode.firstChild);
    const paint = () => el.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.v === (A.CFG.mirror ? 1 : 0)));
    el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; A.CFG.mirror = b.dataset.v === '1'; A.saveC(); paint(); A.hap(8); A.toast('🌐', A.CFG.mirror ? 'Real market on' : 'Simulated market', A.CFG.mirror ? 'New real pump.fun launches will appear in Pulse' : 'Bots run the whole market', 'info'); });
    paint(); }
  window.Mirror = { stats: () => ({ open, healthy: healthy(), active: active.size, creates: ST.c, trades: ST.t, rate: ST.rate }) };
})();
