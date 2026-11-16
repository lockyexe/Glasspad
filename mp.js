/* Glasspad multiplayer: one shared market for every player.
   One phone is the host (the earliest player online). It runs the market and broadcasts tiny "frames":
   the exact steps (time, dt, player commands) it applied. Every other phone replays the same steps with the
   same random seed, so all phones see the same coins, prices, bots and trades. A checksum per frame catches
   any drift and resyncs from a snapshot. If the host leaves, the next player takes over seamlessly. */
(function () {
  'use strict';
  const MP = window.MP = window.MP || {};
  if (MP.solo) return;
  const A = window.App, Sim = window.Sim; if (!A || !Sim) return;
  const STEP = 200, FSTEPS = 10, SNAP_EVERY = 300000, STALE = 7000;
  let B = null, ch = null, uid = null, me = null;
  let pres = [], stale = {}, hostUid = null, lastFrameAt = 0;
  let salt = 0, stepN = 0, frameN = 0, lastF = 0, FB = [], PQ = [], CQ = [], seenCmd = new Set(), PEND = {}, LATE = {}, cseq = 0;
  let playT = 0, hostT = 0, hostLast = 0, snapWanted = false, snapBusy = false, lastSnap = 0, syncing = false, early = [], joinAt = 0;
  let H = {};
  const HK = ['solUsd', 'liveSol', 'heat', 'act', 'mode', 'chat', 'era'];
  MP.on = false; MP.host = false; MP.online = () => pres.length;
  MP.status = () => !MP.on ? 'offline' : syncing ? 'syncing' : MP.host ? 'host' : 'live';

  // ---------- gzip helpers ----------
  async function gz(str) {
    if (!window.CompressionStream) return 'J:' + str;
    const cs = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip')); const buf = new Uint8Array(await new Response(cs).arrayBuffer());
    let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000)); return 'G:' + btoa(bin);
  }
  async function ungz(s) {
    if (s.slice(0, 2) === 'J:') return s.slice(2);
    const bin = atob(s.slice(2)), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  }

  // ---------- account gate (before the game starts) ----------
  MP.gate = async function () {
    for (; ;) {
      try {
        let cfg = Net.cfg(); if (!cfg.url) { await Acct.serverSetup(); cfg = Net.cfg(); }
        Acct.busy('Connecting…');
        B = MP.B = Net.connect(cfg);
        const s = (await B.session()) || (await B.anon()); uid = MP.uid = s.uid;
        let prof = (await B.select('profiles', { eq: { id: uid } }))[0];
        if (!prof) prof = await Acct.auth(B);
        setMe(prof);
        Acct.busy('Joining the market…');
        const g = await join();
        Acct.hide();
        return g;
      } catch (e) {
        const a = await Acct.error(String(e && e.message || e), true);
        if (a === 'server') await Acct.serverSetup();
      }
    }
  };
  function setMe(p) {
    me = MP.me = p; Sim.ME = p.wallet; Sim.PL[p.wallet] = { u: p.username, av: p.avatar, h: p.hue };
    const W = A.W;
    if (W.acct !== p.id && p.wal && typeof p.wal === 'object') { // account moved to this phone: bring the wallet along
      const keep = ['sol', 'pos', 'hist', 'mine', 'rep', 'x', 'assets', 'rent', 'orders', 'track', 'biz', 'nw'];
      keep.forEach(k => { if (p.wal[k] !== undefined) W[k] = p.wal[k]; });
    }
    W.acct = p.id; if (W.x) { W.x.handle = p.username; } A.saveW(); A.renderBal(false);
  }

  // ---------- joining ----------
  function hdrNow() { const h = {}; HK.forEach(k => h[k] = Sim[k]); return h; }
  async function join() {
    ch = B.channel('market', { uid });
    ch.on('fr', onFrame).on('cmd', onCmd).on('need', () => { if (MP.host) snapWanted = true; }).on('snap', m => { MP._snapMsg = m; });
    ch.onPresence(list => { pres = list; const tb = document.getElementById('mpOnline'); if (tb) tb.textContent = pres.length; if (MP.onPres) MP.onPres(pres); });
    await ch.subscribe();
    // listen briefly: is a host already running?
    await new Promise(r => setTimeout(r, 2200));
    joinAt = Math.max(Date.now(), lastFrameAt ? Date.now() + 1 : 0);
    await ch.track({ uid, at: joinAt, u: me.username, av: me.avatar, h: me.hue });
    await new Promise(r => setTimeout(r, 900));
    const hostAlive = lastFrameAt && Date.now() - lastFrameAt < 4000;
    if (hostAlive) {
      if (await syncFromHost()) return { loaded: true };
    }
    if (await loadSnap()) return { loaded: true };
    return { fresh: true };
  }
  async function syncFromHost() {
    syncing = true; MP._snapMsg = null; const t0 = Date.now();
    ch.send('need', { uid });
    while (!MP._snapMsg && Date.now() - t0 < 15000) await new Promise(r => setTimeout(r, 250));
    const ok = await loadSnap(MP._snapMsg && MP._snapMsg.ver);
    syncing = false; return ok;
  }
  async function loadSnap(ver) {
    const w = (await B.select('world', { eq: { id: 1 } }))[0]; if (!w) return false;
    if (ver && w.ver < ver) return false;
    const parts = await B.select('world_parts', { eq: { ver: w.ver }, order: ['part', true] });
    if (parts.length !== w.parts) return false;
    const o = JSON.parse(await ungz(parts.map(p => p.data).join('')));
    Sim.load(o.d); if (me) Sim.PL[Sim.ME] = { u: me.username, av: me.avatar, h: me.hue }; salt = o.meta.salt; stepN = o.meta.n; frameN = lastF = o.meta.f; H = o.meta.h || hdrNow();
    Sim.mp = true;
    // frames that arrived while downloading
    PQ = []; const ok = early.filter(f => f.f > lastF).sort((a, b) => a.f - b.f); early = [];
    for (const f of ok) { if (f.f !== lastF + 1) break; queueFrame(f); }
    return true;
  }

  // ---------- start (after load or a fresh warmup) ----------
  MP.start = function (g) {
    Sim.mp = true; Sim.net = send; MP.on = true;
    if (g.fresh) { salt = (Math.random() * 4294967295) >>> 0; stepN = 0; frameN = lastF = 0; H = hdrNow(); becomeHost(); snapWanted = true; }
    playT = setInterval(play, STEP);
    setInterval(elect, 1000);
    setInterval(syncProfile, 30000); setTimeout(syncProfile, 3000);
    document.addEventListener('visibilitychange', () => { if (document.hidden) { syncProfile(true); if (MP.host) publishSnap(); } });
    startPosts();
    if (MP.onStart) MP.onStart();
  };

  // ---------- election ----------
  function elected() {
    const now = Date.now();
    const L = pres.filter(p => p && p.uid && !(stale[p.uid] && now - stale[p.uid] < 60000)).sort((a, b) => (a.at - b.at) || (a.uid < b.uid ? -1 : 1));
    return L.length ? L[0].uid : uid;
  }
  function elect() {
    if (!MP.on) return;
    const now = Date.now();
    if (!MP.host && hostUid && hostUid !== uid && now - lastFrameAt > STALE) { stale[hostUid] = now; hostUid = null; }
    const e = elected();
    if (e === uid && !MP.host && !syncing && (!lastFrameAt || now - lastFrameAt > 2500 || hostUid === null)) becomeHost();
    else if (e !== uid && MP.host && lastFrameAt && now - lastFrameAt < 3000 && hostUid && hostUid !== uid) stepDown();
  }
  function becomeHost() {
    while (PQ.length) applyItem(PQ.shift());
    frameN = lastF; MP.host = true; hostUid = uid; hostLast = Date.now(); clearInterval(hostT); hostT = setInterval(hostStep, STEP);
    if (MP.onRole) MP.onRole('host');
  }
  function stepDown() { MP.host = false; clearInterval(hostT); FB = []; resync('host changed'); if (MP.onRole) MP.onRole('live'); }

  // ---------- applying steps (identical on every phone) ----------
  function applyStep(st) {
    if (st.h) Object.assign(H, st.h);
    HK.forEach(k => { if (H[k] !== undefined) Sim[k] = H[k]; });
    Sim.t = st.t; Sim.seed((salt ^ Math.imul(st.n, 2654435761)) >>> 0);
    for (const m of st.c) { let r; try { r = Sim.exec(m); } catch (e) { r = { fail: 'err' }; } done(m, r); }
    try { Sim.step(st.dt); } finally { Sim.unseed(); }
    stepN = st.n;
  }
  function applyItem(it) { applyStep(it.st); if (it.ck && Sim.ck() !== it.ck) resync('checksum'); }

  // ---------- host ----------
  function hostStep() {
    const now = Date.now(), dt = Math.round(Math.min(3, Math.max(0.05, (now - hostLast) / 1000)) * 1000) / 1000; hostLast = now;
    const cur = hdrNow(); let dh = null; HK.forEach(k => { if (cur[k] !== H[k]) { (dh = dh || {})[k] = cur[k]; } });
    const st = { n: stepN + 1, t: now, dt, c: CQ.splice(0, 30) }; if (dh) st.h = dh;
    applyStep(st); FB.push(st);
    if (FB.length >= FSTEPS) flush();
  }
  function flush() {
    const fr = { f: ++frameN, h: uid, salt, s: FB, ck: Sim.ck() }; FB = []; lastF = fr.f; lastFrameAt = Date.now();
    ch.send('fr', fr);
    if (snapWanted || Date.now() - lastSnap > SNAP_EVERY) publishSnap();
  }
  async function publishSnap() {
    if (snapBusy || !B) return; snapBusy = true; snapWanted = false; lastSnap = Date.now();
    try {
      const json = JSON.stringify({ meta: { f: lastF, n: stepN, salt, h: Object.assign({}, H) }, d: Sim.dump() });
      const b64 = await gz(json), ver = Date.now(), parts = [];
      for (let i = 0; i < b64.length; i += 180000) parts.push(b64.slice(i, i + 180000));
      for (let i = 0; i < parts.length; i++) await B.upsert('world_parts', { ver, part: i, data: parts[i] });
      await B.upsert('world', { id: 1, ver, frame: lastF, parts: parts.length, host: uid, updated_at: new Date().toISOString() });
      ch.send('snap', { ver, f: lastF });
      B.remove('world_parts', { lt: { ver } }).catch(() => { });
    } catch (e) { console.warn('snapshot failed', e); } finally { snapBusy = false; }
  }
  function onCmd(m) { if (!MP.host || !m || !m.id || seenCmd.has(m.id)) return; seenCmd.add(m.id); if (seenCmd.size > 5000) seenCmd = new Set(); CQ.push(m); }

  // ---------- follower ----------
  function onFrame(fr) {
    if (!fr || !fr.s) return;
    if (fr.h === uid) return;
    if (syncing || !MP.on) { early.push(fr); if (early.length > 60) early.shift(); lastFrameAt = Date.now(); hostUid = fr.h; return; }
    if (MP.host) { if (elected() !== uid) { stepDown(); } return; }
    hostUid = fr.h; lastFrameAt = Date.now(); delete stale[fr.h];
    if (fr.f <= lastF) return;
    if (fr.f !== lastF + 1 || fr.salt !== salt) { resync('gap'); return; }
    queueFrame(fr);
  }
  function queueFrame(fr) { fr.s.forEach((st, i) => PQ.push({ st, ck: i === fr.s.length - 1 ? fr.ck : null })); lastF = fr.f; }
  function play() {
    if (MP.host || syncing) return;
    const n = PQ.length > 20 ? 4 : PQ.length > 10 ? 2 : 1;
    for (let i = 0; i < n && PQ.length; i++) applyItem(PQ.shift());
  }
  let resyncAt = 0;
  async function resync(why) {
    if (syncing || Date.now() - resyncAt < 3000) return; resyncAt = Date.now();
    console.warn('resync:', why); PQ = []; early = [];
    if (MP.host) return;
    const ok = await syncFromHost();
    if (!ok) { syncing = false; setTimeout(() => resync('retry'), 4000); }
  }

  // ---------- commands ----------
  function send(m) {
    return new Promise(res => {
      m = JSON.parse(JSON.stringify(Object.assign({}, m, { id: uid.slice(0, 8) + '.' + Date.now().toString(36) + '.' + (++cseq), w: Sim.ME, u: me.username, av: me.avatar, h: me.hue })));
      PEND[m.id] = { res, m };
      if (MP.host) CQ.push(m); else ch.send('cmd', m);
      setTimeout(() => { if (PEND[m.id]) { delete PEND[m.id]; LATE[m.id] = m; res({ fail: 'timeout' }); } }, 15000);
    });
  }
  function done(m, r) {
    const p = PEND[m.id];
    if (p) { delete PEND[m.id]; setTimeout(() => p.res(r || {}), 0); return; }
    if (LATE[m.id]) { delete LATE[m.id]; lateFix(m, r); return; }
    if (m.w !== Sim.ME && MP.onOther) { try { MP.onOther(m, r); } catch (e) { } }
  }
  function lateFix(m, r) { // a trade we gave up on still landed: keep the wallet honest
    if (!r || r.fail) return; const W = A.W;
    if (m.k === 'buy') { const p = A.pos(m.cid); p.tok += r.tok; p.in += m.sol; W.sol -= m.sol; }
    else if (m.k === 'sell') { const p = W.pos[m.cid]; if (p) { p.tok = Math.max(0, p.tok - m.tok); p.out += r.sol; } W.sol += r.sol; }
    A.saveW(); A.renderBal(true);
  }
  // DexScreener names: only the host feeds them into the shared market
  const addPool = Sim.addPool;
  Sim.addPool = function (t) { if (!Sim.mp) return addPool(t); if (MP.host && !Sim._inExec) CQ.push(JSON.parse(JSON.stringify({ id: 'pool.' + Math.random().toString(36).slice(2), k: 'pool', t }))); };
  const exec = Sim.exec; Sim.exec = function (m) { if (m.k === 'pool') { Sim._inExec = true; try { addPool(m.t); } finally { Sim._inExec = false; } return { ok: 1 }; } return exec(m); };

  // ---------- my profile (balance, positions, wallet backup) ----------
  let lastWal = 0;
  function syncProfile(force) {
    if (!B || !me) return; const W = A.W; let inv = 0, pn = 0; const pos = [];
    for (const id in W.pos) { const p = W.pos[id], c = Sim.coins.get(id); if (!p) continue; const v = c && p.tok > 0 ? Sim.quoteSell(c, p.tok) : 0; inv += v; pn += v + p.out - p.in; if (c && p.tok > 0) pos.push({ id, sym: c.sym, em: c.emoji, v: +v.toFixed(4), pc: p.in ? Math.round((v + p.out - p.in) / p.in * 100) : 0 }); }
    pos.sort((a, b) => b.v - a.v);
    const wins = (W.hist || []).filter(h => !h.side).length;
    const patch = { sol: +W.sol.toFixed(4), worth: +(W.sol + inv).toFixed(4), pnl: +pn.toFixed(4), trades: (W.hist || []).length, wins, pos: pos.slice(0, 8), followers: Math.floor((W.x && W.x.followers) || 0), seen_at: new Date().toISOString() };
    if (force || Date.now() - lastWal > 120000) { lastWal = Date.now(); const keep = {}; ['sol', 'pos', 'mine', 'rep', 'assets', 'rent', 'orders', 'track', 'biz', 'nw'].forEach(k => { if (W[k] !== undefined) keep[k] = W[k]; }); keep.hist = (W.hist || []).slice(0, 40); if (W.x) keep.x = Object.assign({}, W.x, { tweets: (W.x.tweets || []).slice(0, 8) }); const s = JSON.stringify(keep); if (s.length < 150000) patch.wal = keep; }
    B.update('profiles', patch, { id: uid }).catch(() => { });
  }
  MP.syncProfile = syncProfile;

  // ---------- shared posts (X feed) ----------
  const PROF = {}; MP.prof = id => PROF[id];
  MP.getProfile = async id => { if (PROF[id] && Date.now() - PROF[id]._t < 20000) return PROF[id]; const p = (await B.select('profiles', { eq: { id } }))[0]; if (p) { p._t = Date.now(); PROF[id] = p; Sim.PL[p.wallet] = { u: p.username, av: p.avatar, h: p.hue }; } return p; };
  function feedPost(p) {
    if (!p || p.author === uid || !A.life || !A.life.feedAdd) return;
    MP.getProfile(p.author).then(a => { if (!a) return; const l = Math.max(1, p.likes || 0) * 3 + (a.followers || 0) * 0.02;
      A.life.feedAdd({ id: 'r' + p.id, t: window.tparse(p.created_at) || Date.now(), bot: { h: a.username, av: a.avatar, hue: a.hue, f: a.followers || 0, real: true, uid: a.id }, txt: p.txt, img: p.img || null, coin: p.coin || null, tg: { l, r: l * .2, c: l * .08, v: l * 40 }, rep: [], real: true }); }).catch(() => { });
  }
  function startPosts() {
    B.select('posts', { order: ['id', false], limit: 30 }).then(L => L.reverse().forEach(feedPost)).catch(() => { });
    B.listen('posts', (type, n) => { if (type === 'INSERT') feedPost(n); });
  }
  MP.onPost = tw => { if (!B || !MP.on) return; const img = tw.img && JSON.stringify(tw.img).length < 3000 ? tw.img : null; B.insert('posts', { author: uid, txt: tw.txt, img, coin: tw.coin }).catch(() => { }); };

  // ---------- other players' actions → toasts ----------
  MP.onOther = (m, r) => {
    if (!r || r.fail) return; const c = m.cid ? Sim.coins.get(m.cid) : null;
    if (m.k === 'launch') { const nc = Sim.coins.get(r.cid); if (nc) A.toast(m.av || '🚀', '@' + m.u + ' launched $' + nc.sym, 'Real player · tap Pulse → New', 'info'); }
    else if (m.k === 'buy' && c && (m.sol >= 1 || (A.W.pos[c.id] && A.W.pos[c.id].tok > 0))) A.toast(m.av || '🟢', '@' + m.u + ' bought ◎' + A.fSol(m.sol) + ' of $' + c.sym, 'Real player', 'info');
    else if (m.k === 'rug' && c) A.toast('🚩', '@' + m.u + ' rugged $' + c.sym, null, 'bad');
  };
  MP.onMyTrade = () => { clearTimeout(MP._pt); MP._pt = setTimeout(() => syncProfile(), 4000); };
  MP.dbg = () => ({ stepN, lastF, frameN, ck: Sim.ck(), host: MP.host, n: Sim.list.length, pq: PQ.length, syncing, hostUid, pres: pres.length });
  MP.logout = async () => { syncProfile(true); await new Promise(r => setTimeout(r, 800)); try { await B.signOut(); } catch (e) { } try { ['gp_w', 'gp_coins'].forEach(k => localStorage.removeItem(k)); } catch (e) { } location.reload(); };
})();
