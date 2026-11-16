/* Glasspad chat: Lobby (everyone), DMs (private, real players), People (online, top players, search, bots).
   Unfiltered by design; you can block anyone. Bots in the lobby are labelled and only the host posts them.
   Also: the smarter bot brain (grounded in the real shared market + real players). */
(function () {
  'use strict';
  const A = window.App, Sim = window.Sim, MP = window.MP; if (!A || !Sim || !MP || MP.solo) return;
  const $ = (s, r) => (r || document).querySelector(s), esc = A.esc;
  const now = () => Date.now(), pick = a => a[Math.floor(Math.random() * a.length)], R = (a, b) => a + Math.random() * (b - a);
  const LS = { get: (k, d) => { try { const v = localStorage.getItem('gp_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem('gp_' + k, JSON.stringify(v)); } catch (e) { } } };
  let B = null, uid = null, me = null;
  const ROOMS = {}; // room -> {msgs:[], other:{id,username,...}, last}
  const SEEN = LS.get('chat_seen', {}); let BLOCK = new Set(); let PRES = []; let view = { tab: 'lobby', room: null };
  const BOTDM = LS.get('botdm', {});
  const room = r => ROOMS[r] || (ROOMS[r] = { msgs: [], ids: new Set(), other: null });
  const dmRoom = (a, b) => 'dm:' + [a.toLowerCase(), b.toLowerCase()].sort().join('|');
  const ago = t => { const s = Math.max(0, (now() - t) / 1000); return s < 60 ? 'now' : s < 3600 ? Math.floor(s / 60) + 'm' : s < 86400 ? Math.floor(s / 3600) + 'h' : Math.floor(s / 86400) + 'd'; };
  const avh = (av, h, sz) => '<span class="ch-av" style="--h:' + (h || 200) + ';' + (sz ? 'width:' + sz + 'px;height:' + sz + 'px;font-size:' + Math.round(sz * .55) + 'px' : '') + '">' + esc(av || '🙂') + '</span>';
  const link = t => esc(t).replace(/\$([A-Za-z0-9]{2,12})/g, '<b class="ch-sym" data-sym="$1">$$$1</b>').replace(/(^|\s)@(\w{2,20})/g, '$1<b class="ch-at" data-u="$2">@$2</b>');

  // ---------- UI shell ----------
  const btn = document.createElement('button'); btn.className = 'hb2'; btn.id = 'chatBtn'; btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/></svg><i class="ch-badge" id="chBadge"></i>';
  const hr = $('.hdr-r'); if (hr) hr.insertBefore(btn, hr.firstChild);
  const P = document.createElement('div'); P.id = 'chat'; P.innerHTML =
    '<div class="ch-top"><button class="ib" id="chBack"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button><div class="ch-title" id="chTitle">Chat</div><span class="ch-on"><i></i><b id="mpOnline">0</b> online</span></div>' +
    '<div class="seg ch-seg" id="chSeg"><span class="seg-ind"></span><button data-k="lobby" class="on">🌍 Lobby</button><button data-k="dms">✉️ DMs <i id="chDmN"></i></button><button data-k="people">👥 People</button></div>' +
    '<div class="ch-body" id="chBody"></div>' +
    '<div class="ch-in" id="chIn"><input id="chTxt" maxlength="1000" placeholder="Message" autocomplete="off"><button id="chSend"><svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-2-6z"/></svg></button></div>';
  document.body.appendChild(P);
  const body = $('#chBody', P);
  btn.addEventListener('click', () => { A.hap(8); open(); });
  $('#chBack', P).addEventListener('click', () => { if (view.room && view.tab !== 'lobby') { view.room = null; render(); } else close(); });
  A.bindSeg($('#chSeg', P), k => { view.tab = k; view.room = k === 'lobby' ? 'lobby' : null; render(); });
  function open() { P.classList.add('on'); if (!view.room && view.tab === 'lobby') view.room = 'lobby'; render(); requestAnimationFrame(() => A.segInd($('#chSeg', P))); }
  function close() { P.classList.remove('on'); $('#chTxt', P).blur(); }
  MP.openChat = (u) => { open(); if (u) openDm(u); };

  // ---------- data ----------
  function addMsg(m, quiet) {
    if (!m || !m.room) return; const r = room(m.room); if (r.ids.has(m.id)) return; r.ids.add(m.id);
    m.t = window.tparse(m.created_at) || now();
    if (m._tmp) { r.msgs.push(m); } else { const i = r.msgs.findIndex(x => x._tmp && x.sender === m.sender && x.txt === m.txt); if (i >= 0) r.msgs.splice(i, 1, m); else r.msgs.push(m); }
    if (r.msgs.length > 200) r.msgs.splice(0, r.msgs.length - 200);
    r.last = m.t;
    if (m.sender && m.sender !== uid && !m.bot && MP.getProfile) MP.getProfile(m.sender).catch(() => { });
    if (!quiet) { badge(); if (P.classList.contains('on') && view.room === m.room) render(true); else if (m.room.indexOf('dm:') === 0 && m.sender !== uid && !BLOCK.has(m.sender)) { MP.getProfile(m.sender).then(p => { if (p) { room(m.room).other = room(m.room).other || p; A.toast(p.avatar, 'DM from @' + p.username, m.txt.slice(0, 60), 'info'); } }).catch(() => { }); } }
    if (!m.bot && m.room === 'lobby' && m.sender !== uid && MP.host && !quiet) botAnswer(m);
  }
  function unread(r) { const R0 = ROOMS[r]; if (!R0) return 0; const s = SEEN[r] || 0; return R0.msgs.filter(m => m.id > s && m.sender !== uid && !BLOCK.has(m.sender)).length; }
  function badge() {
    let dm = 0; for (const r in ROOMS) if (r.indexOf('dm:') === 0) dm += unread(r);
    const lob = unread('lobby'); const b = $('#chBadge'); if (b) { b.textContent = dm ? dm : lob ? '•' : ''; b.className = 'ch-badge' + (dm ? ' on dm' : lob ? ' on' : ''); }
    const d = $('#chDmN', P); if (d) d.textContent = dm ? dm : '';
  }
  function markSeen(r) { const R0 = ROOMS[r]; if (!R0 || !R0.msgs.length) return; const mx = Math.max(...R0.msgs.filter(m => !m._tmp).map(m => m.id || 0), 0); if (mx > (SEEN[r] || 0)) { SEEN[r] = mx; LS.set('chat_seen', SEEN); badge(); } }

  async function start() {
    B = MP.B; uid = MP.uid; me = MP.me;
    try { (await B.select('blocks', { eq: { blocker: uid } })).forEach(b => BLOCK.add(b.blocked)); } catch (e) { }
    try { (await B.select('messages', { eq: { room: 'lobby' }, order: ['id', false], limit: 80 })).reverse().forEach(m => addMsg(m, true)); } catch (e) { }
    try { (await B.select('messages', { not_null: 'recipient', order: ['id', false], limit: 300 })).reverse().forEach(m => addMsg(m, true)); } catch (e) { }
    for (const r in ROOMS) if (r.indexOf('dm:') === 0) { const m = ROOMS[r].msgs[0]; const o = m.sender === uid ? m.recipient : m.sender; if (o) MP.getProfile(o).then(p => { ROOMS[r].other = p; }).catch(() => { }); }
    B.listen('messages', (type, n, o) => { if (type === 'INSERT') addMsg(n); else if (type === 'DELETE' && (o || n)) { const id = (o && o.id) || (n && n.id); for (const r in ROOMS) { const i = ROOMS[r].msgs.findIndex(m => m.id === id); if (i >= 0) ROOMS[r].msgs.splice(i, 1); } if (P.classList.contains('on')) render(true); } });
    badge();
    setInterval(() => { if (MP.host) lobbyBot(); }, 15000);
    // settings: account row
    const set = $('#v-set .pad'); if (set && !$('#acRow')) { const d = document.createElement('div'); d.id = 'acRow'; d.className = 'glass ac-set'; d.innerHTML = avh(me.avatar, me.hue, 40) + '<div><b>@' + esc(me.username) + '</b><span>' + (B.kind === 'mock' ? 'test server' : esc(Net.cfg().url.replace(/^https?:\/\//, ''))) + '</span></div><button class="sbtn sm" id="acOut">Log out</button>'; set.after(d);
      d.querySelector('#acOut').onclick = () => ovl('<h4>Log out?</h4><p class="mu" style="margin:6px 0 4px">Your wallet is saved to your account. Log back in anytime with your username and password, on any phone.</p>', [['Cancel', null], ['Log out', () => MP.logout()]]); }
    // pulse: live players chip
    const lb = $('.livebar'); if (lb && !$('#mpChip')) { const c = document.createElement('span'); c.className = 'chip mp-chip'; c.id = 'mpChip'; lb.insertBefore(c, lb.children[1] || null); c.onclick = () => { open(); view.tab = 'people'; view.room = null; render(); };
      const up = () => { c.innerHTML = '<i></i>' + PRES.length + ' online' + (MP.status() === 'syncing' ? ' · syncing' : ''); }; up(); setInterval(up, 2000); }
  }
  const pStart = MP.onStart; MP.onStart = () => { if (pStart) pStart(); start(); };
  const pPres = MP.onPres; MP.onPres = list => { if (pPres) pPres(list); PRES = list; if (P.classList.contains('on') && view.tab === 'people' && !view.room) render(true); };

  // ---------- render ----------
  function msgRow(m, prev) {
    const mine = m.sender === uid && !m.bot; let who;
    if (m.bot) who = { u: m.bot.u, av: m.bot.av, h: m.bot.h, bot: true }; else { const p = mine ? me : MP.prof(m.sender); who = p ? { u: p.username, av: p.avatar, h: p.hue, id: p.id } : { u: '…', av: '🙂', h: 200, id: m.sender }; }
    const cont = prev && !prev.bot === !m.bot && prev.sender === m.sender && (!m.bot || prev.bot.u === m.bot.u) && m.t - prev.t < 120000;
    return '<div class="ch-m' + (mine ? ' me' : '') + (cont ? ' cont' : '') + '" data-id="' + m.id + '">' + (mine ? '' : '<div class="ch-mav" ' + (who.id ? 'data-pid="' + who.id + '"' : '') + '>' + (cont ? '' : avh(who.av, who.h, 30)) + '</div>') +
      '<div class="ch-bub">' + (cont || mine ? '' : '<div class="ch-n" ' + (who.id ? 'data-pid="' + who.id + '"' : '') + '><b>' + esc(who.u) + '</b>' + (who.bot ? '<em class="ch-bot">bot</em>' : '') + '<span>' + ago(m.t) + '</span></div>') +
      '<div class="ch-t">' + link(m.txt) + '</div></div></div>';
  }
  function renderMsgs(r, keep) {
    const R0 = room(r), L = R0.msgs.filter(m => !BLOCK.has(m.sender) || m.bot);
    const atBottom = keep && body.scrollHeight - body.scrollTop - body.clientHeight < 80;
    let h = ''; for (let i = 0; i < L.length; i++) h += msgRow(L[i], L[i - 1]);
    if (!L.length) h = '<div class="ch-empty">' + (r === 'lobby' ? '👋 Say gm to everyone playing' : 'No messages yet. Say hi!') + '</div>';
    body.innerHTML = '<div class="ch-list">' + h + '</div>';
    if (!keep || atBottom) body.scrollTop = body.scrollHeight;
    markSeen(r);
  }
  function render(keep) {
    const tin = $('#chIn', P), ttl = $('#chTitle', P);
    $$('#chSeg button', P).forEach(b => b.classList.toggle('on', b.dataset.k === view.tab)); A.segInd($('#chSeg', P));
    if (view.room) {
      tin.style.display = '';
      if (view.room === 'lobby') { ttl.textContent = '🌍 Lobby'; renderMsgs('lobby', keep); }
      else if (view.room.indexOf('bot:') === 0) { const b = view.room.slice(4); ttl.textContent = '🤖 ' + b; renderBot(b, keep); }
      else { const o = room(view.room).other; ttl.textContent = o ? '@' + o.username : 'DM'; renderMsgs(view.room, keep); }
      return;
    }
    tin.style.display = 'none';
    if (view.tab === 'dms') { ttl.textContent = '✉️ Messages'; renderDms(); }
    else { ttl.textContent = '👥 People'; renderPeople(keep); }
  }
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  function renderDms() {
    const L = Object.keys(ROOMS).filter(r => r.indexOf('dm:') === 0 && ROOMS[r].msgs.length).map(r => ({ r, R: ROOMS[r] })).sort((a, b) => b.R.last - a.R.last);
    const bots = Object.keys(BOTDM).map(b => ({ b, L: BOTDM[b] })).filter(x => x.L.length);
    body.innerHTML = '<div class="ch-dl">' + (L.length || bots.length ? '' : '<div class="ch-empty">No DMs yet. Tap someone in 👥 People to message them.</div>') +
      L.map(x => { const m = x.R.msgs[x.R.msgs.length - 1], o = x.R.other, u = unread(x.r); return '<div class="ch-dm" data-room="' + x.r + '">' + avh(o ? o.avatar : '🙂', o ? o.hue : 200, 42) + '<div><b>' + (o ? esc(o.username) : '…') + '</b><span>' + (m.sender === uid ? 'You: ' : '') + esc(m.txt.slice(0, 60)) + '</span></div><em>' + ago(m.t) + (u ? '<i>' + u + '</i>' : '') + '</em></div>'; }).join('') +
      bots.map(x => { const m = x.L[x.L.length - 1], p = botP(x.b); return '<div class="ch-dm" data-bot="' + esc(x.b) + '">' + avh(p ? p.av : '🤖', p ? p.h : 280, 42) + '<div><b>' + esc(x.b) + ' <em class="ch-bot">bot</em></b><span>' + esc(m.t.slice(0, 60)) + '</span></div><em>' + ago(m.at) + '</em></div>'; }).join('') + '</div>';
  }
  let peopleQ = '', topCache = null, topAt = 0, searchRes = null;
  async function renderPeople(keep) {
    if (!keep || !body.querySelector('.ch-pp')) body.innerHTML = '<div class="ch-pp"><div class="search ch-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="chQ" placeholder="Find a player by username" value="' + esc(peopleQ) + '" autocomplete="off" autocapitalize="off"></div><div id="chPL"></div></div>';
    const q = $('#chQ', body); q.oninput = () => { peopleQ = q.value.trim(); clearTimeout(q._t); q._t = setTimeout(async () => { searchRes = peopleQ.length >= 2 ? await B.select('profiles', { ilike: { username: '%' + peopleQ.replace(/[%_]/g, '') + '%' }, limit: 20 }).catch(() => []) : null; drawPL(); }, 300); };
    if (now() - topAt > 20000) { topAt = now(); topCache = await B.select('profiles', { order: ['worth', false], limit: 25 }).catch(() => topCache || []); }
    drawPL();
  }
  function prow(p, extra) { const on = PRES.some(x => x.uid === p.id); return '<div class="ch-p" data-pid="' + p.id + '">' + avh(p.avatar, p.hue, 38) + '<div><b>' + esc(p.username) + (on ? ' <i class="ch-dot"></i>' : '') + '</b><span>◎ ' + A.fSol(p.worth || 0) + ' · ' + ((p.pnl || 0) >= 0 ? '+' : '') + A.fSol(p.pnl || 0) + ' PnL</span></div>' + (extra || '') + '</div>'; }
  function drawPL() {
    const el = $('#chPL', body); if (!el) return;
    if (searchRes) { el.innerHTML = '<div class="plh">Results</div>' + (searchRes.length ? searchRes.map(p => prow(p)).join('') : '<div class="ch-empty">Nobody with that name</div>'); return; }
    const on = PRES.filter(x => x.uid !== uid);
    const bots = Sim.leaders(8);
    el.innerHTML = '<div class="plh">Online now · ' + PRES.length + '</div>' + (on.length ? on.map(x => '<div class="ch-p" data-pid="' + x.uid + '">' + avh(x.av, x.h, 38) + '<div><b>' + esc(x.u) + ' <i class="ch-dot"></i></b><span>playing now</span></div></div>').join('') : '<div class="ch-empty sm">Just you right now. Share the app with friends!</div>') +
      '<div class="plh">🏆 Top players</div>' + (topCache || []).map((p, i) => prow(p, '<em class="ch-rank">#' + (i + 1) + '</em>')).join('') +
      '<div class="plh">🤖 Bots you can DM</div>' + bots.map(p => '<div class="ch-p" data-bot="' + esc(p.u) + '">' + avh(p.av, p.h, 38) + '<div><b>' + esc(p.u) + ' <em class="ch-bot">bot</em></b><span>' + (Sim.TNAME[p.ty] || '') + ' · ' + (p.pnl >= 0 ? '+' : '') + A.fSol(p.pnl) + ' ◎ PnL</span></div></div>').join('');
  }

  // ---------- actions ----------
  body.addEventListener('click', e => {
    const s = e.target.closest('.ch-sym'); if (s) { const c = Sim.list.find(c => c.sym.toUpperCase() === s.dataset.sym.toUpperCase() && !c.dead) || Sim.list.find(c => c.sym.toUpperCase() === s.dataset.sym.toUpperCase()); if (c) { close(); A.openToken(c); } return; }
    const at = e.target.closest('.ch-at'); if (at) { B.select('profiles', { ilike: { username: at.dataset.u }, limit: 1 }).then(L => { if (L[0]) profile(L[0].id); else if (botP(at.dataset.u)) openBot(at.dataset.u); }); return; }
    const pid = e.target.closest('[data-pid]'); if (pid) { if (pid.dataset.pid !== uid) profile(pid.dataset.pid); return; }
    const rm = e.target.closest('[data-room]'); if (rm) { view.room = rm.dataset.room; render(); return; }
    const bt = e.target.closest('[data-bot]'); if (bt) { openBot(bt.dataset.bot); return; }
    const mm = e.target.closest('.ch-m.me'); if (mm && e.detail >= 2) { const id = +mm.dataset.id; if (id) B.remove('messages', { eq: { id } }).catch(() => { }); }
  });
  function sendMsg() {
    const inp = $('#chTxt', P), txt = inp.value.trim(); if (!txt || !view.room) return; inp.value = ''; A.hap(8); A.SND.tap(); if (window.Academy) Academy.flag('chat');
    if (view.room.indexOf('bot:') === 0) return botDm(view.room.slice(4), txt);
    const r = view.room, o = room(r).other;
    const row = { room: r, sender: uid, txt }; if (r.indexOf('dm:') === 0) { if (!o) return A.toast('⚠️', 'Still loading this chat', null, 'bad'); row.recipient = o.id; }
    addMsg(Object.assign({ id: 'tmp' + now(), _tmp: true, created_at: new Date().toISOString() }, row), true); render(true);
    B.insert('messages', row).then(L => { const m = L && L[0]; if (m) { const R0 = room(r); const i = R0.msgs.findIndex(x => x._tmp && x.txt === txt); if (i >= 0) R0.msgs.splice(i, 1); addMsg(m, true); if (view.room === r) render(true); if (r === 'lobby' && MP.host) botAnswer(m); } })
      .catch(err => { A.toast('❌', 'Message not sent', String(err.message || err).slice(0, 80), 'bad'); const R0 = room(r); R0.msgs = R0.msgs.filter(x => !(x._tmp && x.txt === txt)); render(true); });
  }
  $('#chSend', P).addEventListener('click', sendMsg);
  $('#chTxt', P).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendMsg(); } });
  async function openDm(u) {
    const p = typeof u === 'object' ? u : await MP.getProfile(u); if (!p) return;
    const r = dmRoom(me.username, p.username); room(r).other = p; view.tab = 'dms'; view.room = r;
    if (!room(r).msgs.length) { try { (await B.select('messages', { eq: { room: r }, order: ['id', false], limit: 80 })).reverse().forEach(m => addMsg(m, true)); } catch (e) { } }
    open(); render();
  }
  async function profile(id) {
    const p = await MP.getProfile(id).catch(() => null); if (!p) return;
    const on = PRES.some(x => x.uid === p.id), blocked = BLOCK.has(p.id);
    const pos = (p.pos || []).map(x => '<span data-cid="' + esc(x.id) + '">' + esc(x.em || '') + ' $' + esc(x.sym) + ' <em class="' + (x.pc >= 0 ? 'up' : 'dn') + '">◎' + A.fSol(x.v) + ' · ' + (x.pc >= 0 ? '+' : '') + x.pc + '%</em></span>').join('');
    const usd = v => A.fUsd((v || 0) * Sim.solUsd);
    const o = ovl('<div class="ch-prof"><div class="ch-ph">' + avh(p.avatar, p.hue, 64) + '<div><h3>@' + esc(p.username) + '</h3><span class="mu">' + (on ? '<i class="ch-dot"></i> online now' : 'seen ' + ago(window.tparse(p.seen_at) || 0) + ' ago') + ' · ' + A.fK(p.followers || 0) + ' followers</span></div></div>' +
      '<div class="bizk"><div><span>Net worth</span><b>◎ ' + A.fSol(p.worth || 0) + '</b><em>' + usd(p.worth) + '</em></div><div><span>Cash</span><b>◎ ' + A.fSol(p.sol || 0) + '</b></div><div><span>PnL</span><b class="' + ((p.pnl || 0) >= 0 ? 'up' : 'dn') + '">' + ((p.pnl || 0) >= 0 ? '+' : '') + A.fSol(p.pnl || 0) + ' ◎</b></div><div><span>Trades</span><b>' + (p.trades || 0) + '</b></div></div>' +
      (pos ? '<div class="plh">Holding</div><div class="whold">' + pos + '</div>' : '<div class="mu" style="margin:10px 2px">No open positions</div>') + '</div>',
      [[blocked ? 'Unblock' : '🚫 Block', () => toggleBlock(p)], ['💬 Message', () => openDm(p)]]);
    o.querySelectorAll('[data-cid]').forEach(s => s.onclick = () => { const c = Sim.coins.get(s.dataset.cid); if (c) { o.classList.remove('on'); close(); A.openToken(c); } });
  }
  MP.profile = profile;
  async function toggleBlock(p) {
    if (BLOCK.has(p.id)) { BLOCK.delete(p.id); B.remove('blocks', { eq: { blocker: uid, blocked: p.id } }).catch(() => { }); A.toast('✅', 'Unblocked @' + p.username, null, 'ok'); }
    else { BLOCK.add(p.id); B.insert('blocks', { blocker: uid, blocked: p.id }).catch(() => { }); A.toast('🚫', 'Blocked @' + p.username, 'You won\'t see their messages', 'ok'); }
    render(true);
  }
  function ovl(html, btns) {
    let o = document.getElementById('ov'); if (!o) { o = document.createElement('div'); o.id = 'ov'; document.body.appendChild(o); o.addEventListener('click', e => { if (e.target.id === 'ov') o.classList.remove('on'); }); }
    o.innerHTML = '<div class="mbox">' + html + '<div class="mbtns">' + btns.map((b, i) => '<button data-i="' + i + '"' + (i === btns.length - 1 ? ' class="buyb"' : '') + '>' + b[0] + '</button>').join('') + '</div></div>';
    o.querySelectorAll('.mbtns button').forEach(b => b.onclick = () => { o.classList.remove('on'); const f = btns[+b.dataset.i][1]; if (f) f(); });
    o.classList.add('on'); return o;
  }
  // tap a real player's name in the X feed → their profile
  document.addEventListener('click', e => { const t = e.target.closest('[data-ruid]'); if (t) profile(t.dataset.ruid); });

  // ======================= smarter bots =======================
  const MEM = LS.get('botmem', {}); // per bot: { users: {name: {beef, love, n, coin, last}} }
  const memOf = (b, u) => { const M = MEM[b] || (MEM[b] = { users: {} }); return M.users[u] || (M.users[u] = { beef: 0, love: 0, n: 0, coin: null, said: [] }); };
  function botP(name) { for (const p of Sim.PW.values()) if (p.u === name) return p; return null; }
  function coinIn(txt, mem) {
    const m = txt.match(/\$([A-Za-z0-9]{2,12})/); const live = Sim.list.filter(c => !c.dead);
    if (m) return live.find(c => c.sym.toUpperCase() === m[1].toUpperCase()) || Sim.list.find(c => c.sym.toUpperCase() === m[1].toUpperCase());
    const w = txt.toLowerCase(); const byName = live.find(c => c.name.length > 3 && w.indexOf(c.name.toLowerCase()) >= 0) || live.find(c => c.sym.length > 2 && new RegExp('\\b' + c.sym.toLowerCase() + '\\b').test(w));
    if (byName) return byName;
    if (/\b(it|this|that|the coin)\b/i.test(txt) && mem && mem.coin) return Sim.coins.get(mem.coin);
    return null;
  }
  function myBag(p, c) { if (!p || !c) return null; const a = c.holders.get(p.w); if (!a) return null; const h = c.hi.get(p.w); return { pct: a / Sim.SUP * 100, x: h && h.e ? Sim.mc(c) / h.e : 1, e: h ? h.e * Sim.solUsd : 0 }; }
  function hotCoins() { return Sim.list.filter(c => !c.dead && !c.rug).map(c => ({ c, s: Sim.change(c, 300) + Math.log10(1 + c.vol) * 6 })).sort((a, b) => b.s - a.s).slice(0, 3).map(x => x.c); }
  function realBuys() { return (MP._recent || []).filter(x => now() - x.t < 600000); }
  const pStart2 = MP.onOther; MP.onOther = (m, r) => { if (pStart2) pStart2(m, r); if (!r || r.fail) return; if (m.k === 'buy' || m.k === 'launch') { (MP._recent = MP._recent || []).unshift({ u: m.u, k: m.k, sol: m.sol, cid: m.cid || r.cid, t: now() }); MP._recent.length = Math.min(MP._recent.length, 30); } };
  function coinTake(c, p, intents) {
    const S = Sim.stats(c), mc = A.fUsd(Sim.mcUsd(c)), ch = Sim.change(c, 300), bag = myBag(p, c);
    const risk = []; if (S.dev > 6) risk.push('dev still holds ' + S.dev.toFixed(0) + '%'); if (S.insiders > 10) risk.push('bundles ' + S.insiders.toFixed(0) + '%'); if (S.snipers > 15) risk.push('snipers ' + S.snipers.toFixed(0) + '%'); if (S.top10 > 40) risk.push('top10 ' + S.top10.toFixed(0) + '%'); if (S.dust) risk.push(S.dust + ' fake holders'); if (S.botVol > 25) risk.push(S.botVol.toFixed(0) + '% bot volume'); if (S.cabal > 3) risk.push('cabal wallets ' + S.cabal.toFixed(0) + '%');
    const lines = [];
    if (c.rug) return pick(['$' + c.sym + ' is dead bro, dev rugged it', 'nah $' + c.sym + ' got rugged, chart is a flatline', '$' + c.sym + '? rugged. move on']);
    if (intents.has('rugq') || intents.has('bundleq') || intents.has('devq') || intents.has('holdersq')) {
      lines.push(risk.length ? 'checked $' + c.sym + ': ' + risk.slice(0, 3).join(', ') + (risk.length > 2 ? '. thats a lot of red flags' : '. careful') : '$' + c.sym + ' looks clean ngl: dev ' + (S.dev > 0 ? S.dev.toFixed(1) + '%' : 'sold') + ', top10 ' + S.top10.toFixed(0) + '%, ' + S.real + ' real holders');
    } else if (intents.has('buyq')) {
      const good = risk.length <= 1 && ch > -15;
      lines.push(good ? pick(['$' + c.sym + ' at ' + mc + ' is still a decent entry imo', 'if you want in on $' + c.sym + ' size small, ' + mc + ' mc rn', '$' + c.sym + ' holding up, ' + (ch >= 0 ? '+' : '') + ch.toFixed(0) + '% 5m']) : pick(['wouldnt chase $' + c.sym + ' here, ' + (risk[0] || 'chart is bleeding'), '$' + c.sym + ' at ' + mc + ' with ' + (risk[0] || 'that chart') + '? id wait', 'nah, $' + c.sym + ' ' + (ch < 0 ? 'down ' + Math.abs(ch).toFixed(0) + '% in 5m' : 'too many red flags')]));
    } else if (intents.has('sellq')) {
      lines.push(bag && bag.x > 1.5 ? 'i took some off $' + c.sym + ' at ' + bag.x.toFixed(1) + 'x, never wrong to take profit' : ch < -20 ? '$' + c.sym + ' dumping ' + ch.toFixed(0) + '% in 5m, i would cut it' : 'id hold $' + c.sym + ' a bit, ' + mc + ' mc and volume still there');
    } else {
      lines.push('$' + c.sym + ' ' + mc + ' mc, ' + (ch >= 0 ? '+' : '') + ch.toFixed(0) + '% 5m, ' + c.hk.length + ' holders' + (c.grad ? ', bonded' : ', ' + Sim.progress(c).toFixed(0) + '% bonding'));
    }
    if (bag) lines.push(pick(['im in it btw, ' + bag.x.toFixed(2) + 'x from my entry at ' + A.fUsd(bag.e), 'full disclosure im holding ' + bag.pct.toFixed(1) + '% (' + bag.x.toFixed(1) + 'x)', 'i hold some, entry ' + A.fUsd(bag.e)]));
    return lines.join('. ');
  }
  function smartReply(p, from, txt) {
    const M = memOf(p.u, from), U = window.Brain ? Brain.understand(txt) : { set: new Set(), q: /\?/.test(txt) };
    const I = U.set || U.intents || new Set(); const c = coinIn(txt, M);
    if (c) M.coin = c.id; M.n++;
    let out;
    if (/\b(washed|trash|garbage|terrible|you suck|u suck|ur bad|bad trader|cooked|jeet|exit liquidity|no bitches|ugly)\b/i.test(txt)) I.add('insult');
    if (I.has('insult')) { M.beef++; out = M.beef > 2 ? pick(['you been crying at me all day @' + from + ', whats your pnl again', 'blocked in my heart @' + from, 'keep talking, my bags are bigger']) : pick(['say that with a pnl screenshot @' + from, 'ratio + you are down bad', 'imagine being this pressed in a sim lol', 'cope harder @' + from]); if (p.pnl > 0) out += ' (im up ' + A.fSol(p.pnl) + ' sol btw)'; }
    else if (I.has('praise') || I.has('thanks')) { M.love++; out = pick(['appreciate you @' + from + ' 🫡', 'we eat together', 'thats love fr', 'you a real one @' + from]); }
    else if (c) out = coinTake(c, p, I);
    else if (/\b(hot|pump|pumping|alpha|call|calls|best|what.*(buy|ape)|anything good|whats moving|runner)\b/i.test(txt)) { const H = hotCoins(); out = H.length ? 'watching ' + H.map(x => '$' + x.sym + ' (' + A.fUsd(Sim.mcUsd(x)) + ')').join(', ') + '. ' + pick(['$' + H[0].sym + ' has the best volume rn', 'nfa, check holders first', 'first one looks strongest']) : 'market is dead rn, nothing worth aping'; const rb = realBuys()[0]; if (rb && Math.random() < .6) { const rc = Sim.coins.get(rb.cid); if (rc) out += '. also @' + rb.u + ' just ' + (rb.k === 'launch' ? 'launched' : 'aped ◎' + A.fSol(rb.sol) + ' into') + ' $' + rc.sym; } }
    else if (/\b(pnl|you up|ur up|how much (you|u) (make|made)|your bags?|holding|portfolio|winning)\b/i.test(txt)) { const held = Sim.list.filter(x => x.holders.get(p.w)).slice(0, 3); out = (p.pnl >= 0 ? 'up ' : 'down ') + A.fSol(Math.abs(p.pnl)) + ' sol realized, ' + p.wins + 'W ' + p.losses + 'L' + (held.length ? '. holding ' + held.map(x => '$' + x.sym).join(', ') : '. sitting in cash rn'); }
    else if (/\b(who|richest|top player|leaderboard|best player)\b/i.test(txt)) { const L = Sim.leaders(3); out = 'top bots rn: ' + L.map(x => x.u + ' +' + A.fSol(x.pnl)).join(', '); }
    else if (I.has('greet')) out = pick(['gm @' + from, 'gm gm', 'yo @' + from + ' 🫡', 'wsg']) + (Math.random() < .5 ? ', ' + pick(['market is ' + (Sim.heat > 1.1 ? 'heating up 🔥' : Sim.heat < .9 ? 'cold today' : 'mid'), 'you trading today?']) : '');
    else if (I.has('bot')) out = pick(['yeah im a bot, but my pnl is real (in here)', 'bot yes, npc no', 'im a bot running in this sim, ask me about any coin']);
    else if (U.q) out = pick(['depends, which coin? drop the $ticker', 'ask me about a specific $ticker and ill check it', 'not sure what you mean, name a coin']);
    else out = pick(['real', 'facts', 'lol', 'we will see', 'ngl you might be right', 'trenches are wild today']);
    if (M.said.indexOf(out) >= 0) out = out + ' ' + pick(['fr', 'again', 'no cap', '']); M.said.push(out); if (M.said.length > 12) M.said.shift(); LS.set('botmem', MEM);
    return window.Brain ? Brain.voice(out, p.u) : out;
  }
  async function aiReply(p, from, txt, hist) {
    if (!window.Brain || !Brain.ai || !Brain.ai.enabled() || !Brain.ai.call) return null;
    const c = coinIn(txt, memOf(p.u, from)); const F = c ? Brain.facts(c) : null, bag = myBag(p, c), H = hotCoins();
    const ctx = 'YOU ARE @' + p.u + ' (' + (Sim.TNAME[p.ty] || 'trader') + ', realized pnl ' + p.pnl.toFixed(2) + ' SOL, ' + p.wins + 'W/' + p.losses + 'L).\n' +
      (c ? 'COIN: $' + c.sym + ' mc ' + A.fUsd(Sim.mcUsd(c)) + ', 5m ' + Sim.change(c, 300).toFixed(0) + '%, holders ' + c.hk.length + (F ? ', dev ' + F.devPct.toFixed(1) + '%, top10 ' + F.top10.toFixed(0) + '%, bundles ' + F.bund.toFixed(0) + '%, snipers ' + F.snip.toFixed(0) + '%' : '') + (c.rug ? ', RUGGED' : '') + (bag ? '. YOU HOLD ' + bag.pct.toFixed(1) + '% at ' + bag.x.toFixed(2) + 'x' : '') + '\n' : '') +
      'HOT: ' + H.map(x => '$' + x.sym + ' ' + A.fUsd(Sim.mcUsd(x))).join(', ') + '\nSOL $' + Sim.solUsd.toFixed(0) + '\n' + (hist || []).slice(-6).map(x => x).join('\n') + '\n@' + from + ': ' + txt + '\nReply ONCE as @' + p.u + ', short (max 25 words), grounded in the numbers above, in trench slang. JSON {"replies":[{"u":"' + p.u + '","t":"..."}]}';
    try { const r = await Brain.ai.call(ctx); return r && r[0] && r[0].t ? r[0].t : null; } catch (e) { return null; }
  }
  // DM a bot (local conversation, remembers you)
  function openBot(name) { if (!BOTDM[name]) BOTDM[name] = []; view.tab = 'dms'; view.room = 'bot:' + name; open(); render(); }
  function renderBot(name, keep) {
    const L = BOTDM[name] || [], p = botP(name);
    body.innerHTML = '<div class="ch-list">' + (L.length ? '' : '<div class="ch-empty">Ask ' + esc(name) + ' about any $ticker, what\'s hot, or their PnL.</div>') + L.map((m, i) => { const mine = m.me; const prev = L[i - 1]; const cont = prev && prev.me === m.me; return '<div class="ch-m' + (mine ? ' me' : '') + (cont ? ' cont' : '') + '">' + (mine ? '' : '<div class="ch-mav">' + (cont ? '' : avh(p ? p.av : '🤖', p ? p.h : 280, 30)) + '</div>') + '<div class="ch-bub"><div class="ch-t">' + link(m.t) + '</div></div></div>'; }).join('') + (BOTDM._typing === name ? '<div class="ch-typing"><i></i><i></i><i></i></div>' : '') + '</div>';
    body.scrollTop = body.scrollHeight;
  }
  async function botDm(name, txt) {
    const p = botP(name); const L = BOTDM[name] || (BOTDM[name] = []); L.push({ me: true, t: txt, at: now() }); BOTDM._typing = name; render(true);
    const hist = L.slice(-8).map(m => (m.me ? '@' + me.username : '@' + name) + ': ' + m.t);
    const wait = new Promise(r => setTimeout(r, R(900, 2600)));
    let out = p ? await aiReply(p, me.username, txt, hist) : null; if (!out) out = p ? smartReply(p, me.username, txt) : 'this bot left the market';
    await wait; BOTDM._typing = null; L.push({ me: false, t: out, at: now() }); if (L.length > 80) L.splice(0, L.length - 80); LS.set('botdm', BOTDM);
    if (view.room === 'bot:' + name && P.classList.contains('on')) render(true); else A.toast(p ? p.av : '🤖', name + ' replied', out.slice(0, 60), 'info');
  }
  // lobby bots (host only, so everyone sees the same bot messages)
  let nextBotAt = now() + R(20000, 60000);
  function botFrom() { const L = Sim.leaders(25).concat(Array.from(Sim.PW.values()).filter(p => p.ty === 'kol' || p.ty === 'smart').slice(0, 20)); return L.length ? pick(L) : null; }
  function postBot(p, txt) { if (!p || !txt) return; B.insert('messages', { room: 'lobby', sender: uid, bot: { u: p.u, av: p.av, h: p.h }, txt: txt.slice(0, 400) }).catch(() => { }); }
  function lobbyBot() {
    if (now() < nextBotAt) return; nextBotAt = now() + R(45000, 140000) / Math.max(.5, Sim.heat);
    const p = botFrom(); if (!p) return; const H = hotCoins(), rb = realBuys()[0];
    const opts = [];
    if (H[0]) opts.push(() => '$' + H[0].sym + ' ' + pick(['is running, ' + A.fUsd(Sim.mcUsd(H[0])) + ' mc', 'volume is crazy rn', 'chart looks ready 👀']));
    if (rb) { const c = Sim.coins.get(rb.cid); if (c) opts.push(() => '@' + rb.u + ' ' + (rb.k === 'launch' ? 'launched $' + c.sym + ', anyone in?' : 'aped ◎' + A.fSol(rb.sol) + ' into $' + c.sym + ' 👀 following')); }
    const rug = Sim.list.find(c => c.rug && Sim.t - c.lastT < 180000); if (rug) opts.push(() => '$' + rug.sym + ' rugged. check holders before aping people');
    opts.push(() => pick(['gm trenches', 'who is up today', 'sol at $' + Sim.solUsd.toFixed(0) + ', ' + (Sim.heat > 1.1 ? 'trenches heating up' : 'slow day'), 'drop your bags, ill rate them', 'anyone else watching the new launches']));
    const txt = pick(opts)(); postBot(p, window.Brain ? Brain.voice(txt, p.u) : txt);
  }
  async function botAnswer(m) {
    const t = m.txt || ''; const mention = (t.match(/@(\w{2,20})/) || [])[1]; let p = mention ? botP(mention) : null;
    const askAll = /\?|\$[A-Za-z]|gm|anyone|bots?/i.test(t);
    if (!p && (!askAll || Math.random() > 0.55)) return; p = p || botFrom(); if (!p) return;
    const from = (MP.prof(m.sender) || {}).username || 'anon';
    await new Promise(r => setTimeout(r, R(2500, 8000)));
    const out = (await aiReply(p, from, t)) || smartReply(p, from, t);
    postBot(p, (mention ? '' : '@' + from + ' ') + out);
  }
})();
