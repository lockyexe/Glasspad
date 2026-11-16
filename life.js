/* Glasspad life: X feed, tweet-driven launch hype, your own coin launches (rug or stay loyal), garage & real estate. */
(function () {
  'use strict';
  const A = window.App, Sim = window.Sim, Art = window.Art;
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const R = (a, b) => a + Math.random() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const gauss = Sim.gauss;
  const W = () => A.W;
  const now = () => Date.now();

  function normW() {
    const w = W();
    w.x = w.x || { handle: 'anon' + RI(100, 9999), followers: 120, tweets: [], last: 0 };
    w.rep = w.rep || 0; w.assets = w.assets || []; w.rent = w.rent || []; w.mine = w.mine || [];
  }
  normW();
  A.applyCfg();

  // ---------- bots on X ----------
  const BN1 = ['trench', 'larp', 'solana', 'dubai', 'memecoin', 'degen', 'chart', 'bonding', 'raydium', 'lambo', 'sniper', 'whale', 'exit', 'alpha', 'pump', 'candle', 'jeet', 'diamond', 'lobby', 'yacht'];
  const BN2 = ['lord', 'king', 'queen', 'szn', 'maxi', 'enjoyer', 'god', 'boy', 'girl', 'capital', 'calls', 'trades', 'whisperer', 'andy', 'og', 'dev', 'labs', 'club', 'mom', 'dad'];
  const AV = ['🐸', '😎', '🦍', '🐳', '🦊', '🤑', '👑', '🧙', '🥷', '🐶', '🐱', '👽', '💎', '🔥', '🌴', '🏎️', '🎩', '🦁', '🐯', '😈'];
  const BOTS = [];
  for (let i = 0; i < 48; i++) { const h = pick(BN1) + (Math.random() < .5 ? '_' : '') + pick(BN2) + (Math.random() < .4 ? RI(1, 99) : ''); BOTS.push({ n: h.replace(/_/g, ' ').replace(/\d+/, '').replace(/\b\w/g, m => m.toUpperCase()).trim(), h, av: pick(AV), hue: RI(0, 359), v: Math.random() < .35, f: Math.round(Math.exp(R(6, 12.5))) }); }
  const FEED = []; let twId = 0;

  // ---------- engagement model ----------
  function engage(txt, o) {
    o = o || {}; const f = W().x.followers; let q = 1;
    if (/\$[A-Za-z0-9]{2,10}/.test(txt)) q += 0.3;
    if (/[\u{1F300}-\u{1FAFF}]/u.test(txt)) q += 0.15;
    if (txt.length > 30 && txt.length < 220) q += 0.2;
    if (/lfg|gm|send|moon|100x|ape|bullish|larp|lambo|trench|cook|based/i.test(txt)) q += 0.15;
    if (o.img) q += 0.6;
    if (Sim.era === 'prime') q += 0.45;
    q *= Sim.heat;
    const since = (now() - W().x.last) / 1000; if (since < 20) q *= 0.35; else if (since < 60) q *= 0.7;
    if (W().rep < -20) q *= 0.6;
    if (o.rented) q *= 0.85;
    // realistic engagement: ~1–3% of followers like a normal post; virality is rare
    let likes = (1 + f * 0.02) * q * Math.exp(gauss() * 0.6), viral = false;
    if (Math.random() < 0.025 + (Sim.era === 'prime' ? 0.015 : 0)) { likes *= R(5, 25); viral = true; }
    return { l: likes, r: likes * R(.08, .22), c: likes * R(.03, .1), v: likes * R(25, 70) + f * R(.3, .8), viral };
  }
  const cur = (tw, k, tau) => Math.floor(tw.tg[k] * (1 - Math.exp(-(now() - tw.t) / (tau || 35000))));

  const REPLY = {
    any: ['ser 🤝', 'LFG', 'based', 'this', 'wen', 'bullish', 'ngmi if you fade', 'real', 'gm', 'who asked lol', 'facts', '🔥🔥', 'trust', 'ok and?'],
    coin: ['ca?', 'aping', 'just bought', 'chart looks clean', 'wen raydium', 'dev doxx?', 'sending it', 'bundled?', 'how many holders?'],
    flex: ['congrats king 👑', 'goals', 'what coin was it', 'teach me', 'insane', 'drop the CA', 'we are so back'],
    rented: ['rented 💀', 'nice rental bro', 'that\'s a hotel lobby lol', 'larp detected'],
    rugger: ['rugger 🚩', 'you rugged last time', 'not touching this', 'exit liquidity again?']
  };
  function botReply(tw) {
    let pool = REPLY.any.slice();
    if (/\$[A-Za-z]/.test(tw.txt)) pool = pool.concat(REPLY.coin);
    if (tw.img) pool = pool.concat(REPLY.flex);
    if (tw.rented && Math.random() < 0.45) pool = REPLY.rented;
    if (W().rep < -20 && Math.random() < 0.4) pool = REPLY.rugger;
    if (tw.aiq && tw.aiq.length) { const r = tw.aiq.shift(); if (r && r.b && r.t) return { h: r.b.h, av: r.b.av, hue: r.b.hue, txt: r.t, t: now(), ai: true }; }
    const used = new Set(tw.rep.map(x => x.h)); let b = pick(BOTS), g = 0; while (used.has(b.h) && g++ < 10) b = pick(BOTS);
    let to = null; if (tw.to && !tw.rep.some(x => x.h === tw.to)) { const bb = BOTS.find(x => x.h.toLowerCase() === tw.to.toLowerCase()); if (bb) { b = bb; to = bb.h; } }
    let txt = window.Brain ? window.Brain.localXReply(tw, { to }) : pick(pool); if (window.Brain) txt = window.Brain.voice(txt, b.h); if (window.Brain && to) { const bb = window.Brain.memo.bots[b.h] || (window.Brain.memo.bots[b.h] = { beef: 0, love: 0, n: 0, said: [], t: Date.now() }); bb.t = Date.now(); }
    return { h: b.h, av: b.av, hue: b.hue, txt, t: now() };
  }

  function post(txt, o) {
    o = o || {}; const x = W().x;
    const tw = { id: 'u' + now() + RI(0, 999), t: now(), txt: String(txt).slice(0, 280), img: o.img || null, rented: !!o.rented, coin: o.coin || null, applied: false, lastL: 0, rep: [], rq: [] };
    const e = engage(tw.txt, o); tw.tg = { l: e.l, r: e.r, c: e.c, v: e.v }; tw.viral = e.viral;
    const n = clamp(Math.round(Math.log2(2 + e.c)), 1, 6); for (let i = 0; i < n; i++) tw.rq.push(now() + R(2000, 40000) * (i + 1) / n);
    const tgX = window.Brain ? window.Brain.rememberX(tw) : [];
    const toM = tw.txt.match(/^\s*@(\w{2,30})/); if (toM && BOTS.some(x => x.h.toLowerCase() === toM[1].toLowerCase())) { tw.to = toM[1]; tw.rq[0] = now() + R(2500, 7000); }
    const Br = window.Brain; if (Br && Br.ai.enabled() && Br.ai.cfg().replies) { const pool2 = BOTS.slice().sort(() => Math.random() - .5).slice(0, n); if (tw.to) { const bb = BOTS.find(x => x.h.toLowerCase() === tw.to.toLowerCase()); if (bb) pool2[0] = bb; } Br.ai.xReplies(tw, pool2, n).then(arr => { Object.defineProperty(tw, 'aiq', { value: arr, writable: true, enumerable: false, configurable: true }); }).catch(() => { }); }
    x.tweets.unshift(tw); if (x.tweets.length > 60) x.tweets.length = 60; x.last = now();
    if (window.MP && MP.onPost) MP.onPost(tw);
    A.saveW();
    if (e.viral) setTimeout(() => A.toast('🚀', 'Your post is going viral', fK(e.l) + ' likes incoming', 'ok'), 6000);
    return tw;
  }
  const fK = n => n < 1000 ? String(Math.max(0, Math.floor(n))) : A.fK(n);

  // ---------- For-you feed ----------
  const LARP_CAR = ['just picked up the {N} 🏎️ trenches pay', 'new whip off ${S} profits. we are so back', '{N} > your entire portfolio', 'parked the {N} outside the hotel lobby. gm', 'second {N} this month. memecoins are a real job'];
  const LARP_HOUSE = ['new crib in {P} 🌴', 'woke up in my {N}. gm to everyone except jeets', '{P} life hits different after a 50x', 'signed for the {N} today. ${S} paid for it', 'view from the {N} tonight 🌃'];
  const ERA_TW = {
    prime: ['AI agent coins are the meta rn', 'everyone i know made money this week', 'trenches printing 24/7', 'new ATH every hour', 'this is the craziest market i have ever seen', 'quit my job. memecoins full time'],
    now: ['trenches feel dead but something always runs', '1% bond rate and i still caught one', 'liquidity is so thin lately', 'everyone left for perps lol', 'quiet markets = early', 'another bundled launch. checking holders first now']
  };
  function botTweet() {
    const b = pick(BOTS), live = Sim.list.filter(c => !c.dead);
    const hot = live.slice().sort((a, c) => Sim.change(c, 300) - Sim.change(a, 300))[0];
    const rug = live.find(c => c.rug && Sim.t - c.lastT < 120000);
    const mine = (W().mine || []).map(id => Sim.coins.get(id)).filter(Boolean);
    let txt, img = null, coin = null;
    const k = pick(['kol', 'kol', 'larp', 'larp', 'larp', 'rug', 'era', 'era', 'market'].concat(mine.length ? ['mention', 'mention'] : []));
    if (k === 'kol' && hot) { coin = hot.id; txt = pick(['$' + hot.sym + ' just sent 🚀 called it at ' + A.fUsd(Sim.mcUsd(hot) / R(2, 5)), '$' + hot.sym + ' chart is insane rn', 'aped $' + hot.sym + ', dyor nfa 🤫', 'if you faded $' + hot.sym + ' you are ngmi']); }
    else if (k === 'rug' && rug) { coin = rug.id; txt = '$' + rug.sym + ' ' + pick(['dev rugged. check holders next time', 'rugged me for ' + R(0.5, 8).toFixed(1) + ' sol 💀', 'bundles dumped on everyone', 'classic dev exit']); }
    else if (k === 'larp' || (k === 'kol' && !hot) || (k === 'rug' && !rug)) {
      const S = hot ? hot.sym : 'BONK';
      if (Math.random() < .55) { const c = pick(Art.CARS.filter(x => x.usd > 120000)); img = { k: 'car', id: c.id, color: c.color }; txt = pick(LARP_CAR).replace('{N}', c.name).replace('{S}', S); }
      else { const h = pick(Art.HOUSES); img = { k: 'house', id: h.id }; txt = pick(LARP_HOUSE).replace('{N}', h.name).replace('{P}', h.place).replace('{S}', S); }
    } else if (k === 'mention' && mine.length) {
      const c = pick(mine); coin = c.id; const hh = '@' + W().x.handle;
      txt = c.rug ? pick([hh + ' rugged $' + c.sym + ' 🚩 stay away', 'never trusting ' + hh + ' again after $' + c.sym, hh + ' sold the whole dev bag on $' + c.sym + ' lmao'])
        : c.burned ? pick(['respect to ' + hh + ' for burning on $' + c.sym, '$' + c.sym + ' dev is actually legit 🫡']) : pick(['$' + c.sym + ' by ' + hh + ' looking clean 👀', 'anyone in $' + c.sym + '? dev ' + hh + ' seems active', 'is ' + hh + ' going to rug $' + c.sym + '?']);
    } else if (k === 'market') txt = pick(['SOL $' + Sim.solUsd.toFixed(0) + ' and the trenches are ' + (Sim.heat > 1.1 ? 'heating up 🔥' : Sim.heat < .9 ? 'cold 🥶' : 'mid'), Sim.list.filter(c => c.grad && Sim.t - c.gradAt < 3600e3).length + ' coins bonded in the last hour', Sim.txWindow.length + ' trades a minute on the curve rn']);
    else txt = pick(ERA_TW[Sim.era] || ERA_TW.now);
    const f = b.f; let l = (2 + f * 0.012) * Math.exp(gauss() * 0.7) * (img ? 1.6 : 1) * (Sim.era === 'prime' ? 1.5 : 1);
    const tw = { id: 'b' + (++twId), t: now(), bot: b, txt, img, coin, tg: { l, r: l * R(.08, .25), c: l * R(.03, .12), v: l * R(30, 80) }, rep: [] };
    FEED.unshift(tw); if (FEED.length > 40) FEED.length = 40;
  }
  for (let i = 0; i < 8; i++) { botTweet(); FEED[0].t -= RI(20, 600) * 1000; }
  // KOLs post the CA after they already bought (front-running their own followers)
  Sim.onKol = (c, K, kind) => { if (!K) return; const b = { h: K.u, av: K.av, hue: K.h, f: K.kolF || 20000, kol: true };
    const txt = pick(['$' + c.sym + ' 🎯 sized in, this one is different', 'CA: ' + c.ca.slice(0, 6) + '…' + c.ca.slice(-4) + ' $' + c.sym + ' early. nfa', 'aping $' + c.sym + ' with the boys 🤝 dyor', '$' + c.sym + ' chart looks ready. not financial advice', 'my alpha group is in $' + c.sym + ' 👀', 'biggest call of the week: $' + c.sym]);
    const l = (40 + b.f * 0.004) * Math.exp(gauss() * 0.5); FEED.unshift({ id: 'b' + (++twId), t: now(), bot: b, txt, img: null, coin: c.id, kolCall: true, tg: { l, r: l * R(.15, .3), c: l * R(.05, .12), v: l * R(40, 90) }, rep: [] }); if (FEED.length > 40) FEED.length = 40; };

  // ---------- rendering helpers ----------
  function linkify(t) { return A.esc(t).replace(/\$([A-Za-z0-9]{2,12})/g, '<span class="cash" data-sym="$1">$$$1</span>').replace(/(^|\s)(@\w+)/g, '$1<span class="at">$2</span>'); }
  function artFor(img) {
    if (!img) return '';
    if (img.k === 'car') { const c = Art.CAR_BY[img.id]; return c ? Art.carArt(c, img.color, { bg: true }) : ''; }
    if (img.k === 'biz') { const x = window.Biz && Biz.BY[img.id]; return x ? Biz.art(x) : ''; }
    if (img.k === 'pnl') return window.Pro ? Pro.pnlSvg(img.d) : '';
    const h = Art.HOUSE_BY[img.id]; return h ? Art.houseArt(h) : '';
  }
  const VER = '<svg class="ver" viewBox="0 0 24 24"><path d="M12 2l2.4 2.2 3.2-.4.9 3.1 2.9 1.5-1 3.1 1 3.1-2.9 1.5-.9 3.1-3.2-.4L12 22l-2.4-2.2-3.2.4-.9-3.1-2.9-1.5 1-3.1-1-3.1 2.9-1.5.9-3.1 3.2.4z"/><path d="M8 12l3 3 5-6" stroke="#fff" stroke-width="2" fill="none"/></svg>';
  function makeTw(tw) {
    const el = document.createElement('div'); el.className = 'tw' + (tw.bot ? '' : ' mine'); el.dataset.id = tw.id;
    const me = W().x, au = tw.bot || { n: 'You', h: me.handle, av: '⭐', hue: 220, v: me.followers > 10000 };
    el.innerHTML = '<div class="tw-av" style="--h:' + au.hue + '">' + au.av + '</div><div class="tw-b"><div class="tw-h"' + (au.real ? ' data-ruid="' + au.uid + '"' : '') + '><b>' + A.esc(au.n || au.h) + '</b>' + (au.v ? VER : '') + (au.real ? '<em class="ch-real">player</em>' : '') + '<span class="mu">@' + A.esc(au.h) + ' · <i class="ag"></i></span></div>' +
      '<div class="tw-t">' + linkify(tw.txt) + '</div>' + (tw.img ? '<div class="tw-img">' + artFor(tw.img) + '</div>' : '') +
      '<div class="tw-a"><span>💬 <i class="c"></i></span><span>🔁 <i class="r"></i></span><span class="tlk">♥ <i class="l"></i></span><span>📊 <i class="v"></i></span></div><div class="tw-rs"></div></div>';
    el._r = { ag: $('.ag', el), c: $('.c', el), r: $('.r', el), l: $('.l', el), v: $('.v', el), rs: $('.tw-rs', el) };
    return el;
  }
  function updTw(el, tw) {
    const r = el._r; A.setT(r.ag, A.fAge(now() - tw.t));
    A.setT(r.c, fK(Math.max(tw.rep.length, cur(tw, 'c', 60000)))); A.setT(r.r, fK(cur(tw, 'r', 50000))); A.setT(r.l, fK(cur(tw, 'l'))); A.setT(r.v, fK(cur(tw, 'v', 45000)));
    const rk = tw.rep.length;
    if (r.rs._k !== rk) { r.rs._k = rk; r.rs.innerHTML = tw.rep.slice(-3).map(x => '<div class="tw-r" data-h="' + A.esc(x.h) + '"><span class="tw-ra" style="--h:' + x.hue + '">' + x.av + '</span><b>@' + A.esc(x.h) + '</b> ' + linkify(x.txt) + '</div>').join(''); }
  }
  let xTab = 'fy';
  A.bindSeg($('#xSeg'), k => { xTab = k; $('#xFeed')._m = null; $('#xFeed').innerHTML = ''; $('#xFeed')._init = false; renderFeed(); });
  function renderFeed() { A.sync($('#xFeed'), xTab === 'fy' ? FEED.slice(0, 25) : W().x.tweets.slice(0, 25), makeTw, updTw); }
  document.addEventListener('click', e => {
    const c = e.target.closest('.cash'); if (!c) return;
    const sym = c.dataset.sym.toUpperCase();
    const tw = e.target.closest('.tw'); let coin = null;
    if (tw) { const t = FEED.concat(W().x.tweets).find(x => x.id === tw.dataset.id); if (t && t.coin) coin = Sim.coins.get(t.coin); }
    if (!coin) coin = Sim.list.filter(x => x.sym === sym).sort((a, b) => Sim.mc(b) - Sim.mc(a))[0];
    if (coin) A.openToken(coin); else A.toast('🔎', '$' + sym + ' not found', 'It may have died already', 'info');
  });

  // ---------- profile + composer ----------
  function repLabel() { const r = W().rep; return r <= -40 ? ['🚩 Serial rugger', 'bad'] : r <= -15 ? ['⚠️ Known rugger', 'bad'] : r >= 25 ? ['🛡️ Trusted dev', 'ok'] : r >= 8 ? ['✅ Legit dev', 'ok'] : ['😐 Unknown dev', '']; }
  function renderProf() {
    const x = W().x, rl = repLabel(), el = $('#xProf');
    const k = x.handle + '|' + Math.floor(x.followers) + '|' + x.tweets.length + '|' + W().rep + '|' + W().mine.length;
    if (el._k === k) return; el._k = k;
    el.innerHTML = '<div class="xp-av">⭐</div><div style="flex:1;min-width:0"><b>@' + A.esc(x.handle) + '</b><div class="mu" style="font-size:12px">' + fK(Math.floor(x.followers)) + ' followers · ' + x.tweets.length + ' posts · ' + W().mine.length + ' launches</div></div><span class="tag ' + rl[1] + '">' + rl[0] + '</span>';
  }
  $('#xFeed').addEventListener('click', e => { const r = e.target.closest('.tw-r'); if (!r || !r.dataset.h) return; const t = $('#xTxt'); t.value = '@' + r.dataset.h + ' '; t.focus(); t.scrollIntoView({ block: 'center', behavior: 'smooth' }); A.hap(6); });
  $('#xPost').addEventListener('click', () => {
    const t = $('#xTxt').value.trim(); if (!t) { A.toast('✍️', 'Write something first', null, 'bad'); return; }
    const tw = post(t); $('#xTxt').value = ''; A.hap(15); A.SND.ok();
    const [x, y] = A.center($('#xPost')); A.FX.burst(x, y, { n: 24, cols: [A.T.a1, A.T.a2, '#fff'], sp: 5, g: 0, life: 34 });
    A.toast('🐦', 'Posted', tw.viral ? 'This one is going to fly…' : 'Engagement rolling in', 'ok');
    xTab = 'me'; $$('#xSeg button').forEach(b => b.classList.toggle('on', b.dataset.k === 'me')); A.segInd($('#xSeg')); $('#xFeed')._m = null; $('#xFeed').innerHTML = ''; renderFeed(); renderHype();
  });

  // ---------- launch form ----------
  const EMOS = ['🐸', '🐶', '🐱', '🦊', '🐵', '🐳', '🦈', '🐉', '🦄', '👽', '🤖', '👻', '💎', '🔥', '🚀', '👑', '🍌', '🍕', '🧠', '🌙'];
  const LF = { emoji: '🐸', hue: RI(0, 359), img: null, dev: 1, ann: true };
  $('#lfEmo').innerHTML = EMOS.map(e => '<button>' + e + '</button>').join('');
  function lfPreview() { $('#lfImg').innerHTML = '<div class="av" style="--h:' + LF.hue + ';--s:64px"><span class="em">' + LF.emoji + '</span>' + (LF.img ? '<img src="' + LF.img + '">' : '') + '</div>'; }
  lfPreview();
  $('#lfEmo').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; LF.emoji = b.textContent; LF.hue = RI(0, 359); LF.img = null; lfPreview(); A.hap(6); A.SND.tap(); });
  $('#lfImg').addEventListener('click', () => { LF.hue = (LF.hue + 47) % 360; lfPreview(); A.hap(5); });
  $('#lfUpBtn').addEventListener('click', () => { window.__picking = true; setTimeout(() => window.__picking = false, 60000); });
  $('#lfFile').addEventListener('change', e => {
    window.__picking = false; const f = e.target.files && e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { const im = new Image(); im.onload = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 160; const s = Math.min(im.width, im.height); cv.getContext('2d').drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 160, 160); LF.img = cv.toDataURL('image/jpeg', 0.85); lfPreview(); A.toast('🖼️', 'Image added', null, 'ok'); }; im.src = rd.result; };
    rd.readAsDataURL(f); e.target.value = '';
  });
  $('#lfDev').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; LF.dev = +b.dataset.v; $$('#lfDev button').forEach(x => x.classList.toggle('on', x === b)); A.hap(6); });
  $('#lfAnn').addEventListener('click', () => { LF.ann = !LF.ann; $('#lfAnn').classList.toggle('on', LF.ann); A.hap(6); });
  $('#lfSym').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); renderHype(); });

  function hypeFor(sym) {
    if (!sym) return { h: 0, likes: 0, n: 0 };
    const re = new RegExp('\\$' + sym + '\\b', 'i'); let likes = 0, n = 0;
    W().x.tweets.forEach(t => { if (now() - t.t < 20 * 60000 && re.test(t.txt)) { likes += cur(t, 'l') + cur(t, 'r', 50000) * 2; n++; } });
    const h = clamp(Math.log10(1 + likes) / 3 + Math.log10(1 + W().x.followers) / 8 - (W().rep < -20 ? 0.2 : 0), 0, 1.6);
    return { h, likes, n };
  }
  function renderHype() {
    const sym = $('#lfSym').value, H = hypeFor(sym);
    const lab = H.h < 0.25 ? 'Dead 💤' : H.h < 0.45 ? 'Mid 😐' : H.h < 0.7 ? 'Warm 🌡️' : H.h < 1 ? 'Hot 🔥' : 'Viral 🚀';
    A.setT($('#hypeL'), lab); $('#hypeBar').style.width = (H.h / 1.6 * 100).toFixed(0) + '%';
    A.setT($('#hypeD'), sym ? H.n + ' posts mention $' + sym + ' · ' + fK(H.likes) + ' engagement · ' + fK(W().x.followers) + ' followers' + (W().rep < -20 ? ' · rug history hurts trust' : '') : 'Pick a ticker, then tweet about it to build hype');
  }

  $('#lfGo').addEventListener('click', () => {
    const name = $('#lfName').value.trim(), sym = $('#lfSym').value.trim();
    if (name.length < 2) return A.toast('✍️', 'Give your coin a name', null, 'bad');
    if (sym.length < 2) return A.toast('✍️', 'Ticker needs 2–10 letters', null, 'bad');
    const prio = A.CFG.mode === 'real' ? A.CFG.prio : 0;
    if (LF.dev + prio > W().sol) { A.SND.err(); return A.toast('◎', 'Not enough SOL for the dev buy', 'Add balance in Settings', 'bad'); }
    const H = hypeFor(sym);
    W().sol -= LF.dev + prio;
    $('#lfGo').disabled = true;
    Sim.cmd({ k: 'launch', name, sym, img: LF.img && (!Sim.mp || LF.img.length < 24000) ? LF.img : null, emoji: LF.emoji, desc: $('#lfDesc').value.trim().slice(0, 300), devSol: LF.dev, hype: H.h, followers: W().x.followers, hue: LF.hue, rep: W().rep }).then(rr => {
    $('#lfGo').disabled = false;
    if (rr.fail) { W().sol += LF.dev + prio; A.saveW(); A.renderBal(true); return A.toast('❌', 'Launch failed', 'The network didn\'t confirm it. Refunded', 'bad'); }
    const r = { c: Sim.coins.get(rr.cid), tok: rr.tok };
    const p = A.pos(r.c.id); p.tok += r.tok; p.in += LF.dev;
    W().mine.push(r.c.id); W().hist.unshift({ id: r.c.id, sym, side: 1, sol: LF.dev, tok: r.tok, t: now(), st: Sim.t, mc: Sim.mcUsd(r.c) });
    if (LF.ann) post('🚀 $' + sym + ' is live. ' + pick(['dev buy done, not selling', 'community coin, lfg', 'this one is different', 'early gang get in', 'send it']) + ' CA: ' + r.c.ca.slice(0, 6) + '…pump', { coin: r.c.id });
    A.saveW(); A.saveCoins(); A.renderBal(true);
    // rocket VFX
    const [x, y] = A.center($('#lfGo')); const rk = document.createElement('div'); rk.className = 'rocket'; rk.textContent = '🚀'; rk.style.left = (x - 22) + 'px'; rk.style.top = (y - 22) + 'px'; document.body.appendChild(rk);
    const st = performance.now();
    const step = t => { const k = Math.min(1, (t - st) / 900); const yy = y - k * k * (y + 120); rk.style.transform = 'translateY(' + (yy - y) + 'px) rotate(-45deg) scale(' + (1 + k) + ')';
      A.FX.add({ t: 'dot', x: x + R(-6, 6), y: yy + 30, vx: R(-1, 1), vy: R(1, 3), g: 0.05, l: 0, m: 40, r: R(3, 6), c: pick(['#ffc94d', '#ff7a1a', A.T.a2, '#fff']), drag: .96 });
      if (k < 1) requestAnimationFrame(step); else { rk.remove(); A.FX.flash(A.T.a1); A.openToken(r.c); } };
    requestAnimationFrame(step);
    A.FX.burst(x, y, { n: 60, cols: [A.T.a1, A.T.a2, '#ffc94d', '#fff'], sp: 9, type: 'star', life: 55 }); A.FX.ring(x, y, A.T.pink, 180, 4);
    A.SND.cash(); A.hap(40);
    A.toast('🚀', '$' + sym + ' launched!', 'Hype: ' + $('#hypeL').textContent + ' · ' + Math.round(H.h * 100) + '% · snipers incoming', 'ok');
    $('#lfName').value = ''; $('#lfSym').value = ''; $('#lfDesc').value = ''; LF.img = null; lfPreview(); renderHype();
    });
  });

  // ---------- your coins ----------
  function makeMine(c) {
    const el = document.createElement('div'); el.className = 'card glass trow'; el.dataset.id = c.id;
    el.innerHTML = A.avatar(c, 42) + '<div class="mid"><div class="r1"><b class="nm">' + A.esc(c.name) + '</b><span class="sy">' + A.esc(c.sym) + '</span><span class="st"></span></div><div class="r2"><span>MC <b class="m"></b></span><span>👥 <b class="h"></b></span><span>Fees <b class="f"></b></span></div></div><div class="rt"><span class="pct"></span></div>';
    el._r = { st: $('.st', el), m: $('.m', el), h: $('.h', el), f: $('.f', el), pct: $('.pct', el) }; return el;
  }
  function updMine(el, c) {
    const r = el._r, ch = (Sim.mc(c) / c.m0 - 1) * 100;
    const st = c.rug ? '<span class="tag rug">RUGGED</span>' : c.burned ? '<span class="tag ok">🔥 BURNED</span>' : c.grad ? '<span class="tag grad">🎓</span>' : '<span class="tag ok">LIVE</span>';
    if (r.st._h !== st) { r.st._h = st; r.st.innerHTML = st; }
    A.setT(r.m, A.fUsd(Sim.mcUsd(c))); A.setT(r.h, String(c.hk.length)); A.setT(r.f, '◎ ' + A.fSol(c.fee));
    A.setT(r.pct, A.fPct(ch)); A.setCls(r.pct, 'up', ch >= 0); A.setCls(r.pct, 'dn', ch < 0);
  }
  $('#myList').addEventListener('click', e => { const c = e.target.closest('[data-id]'); if (c && Sim.coins.get(c.dataset.id)) A.openToken(Sim.coins.get(c.dataset.id)); });

  // ---------- dev panel (token sheet) ----------
  function devPanel(c) {
    const el = $('#shDev');
    if (!Sim.isMine(c)) { el.style.display = 'none'; el._id = null; return; }
    el.style.display = 'block';
    const p = W().pos[c.id] || { tok: 0 }, pct = p.tok / Sim.SUP * 100, rl = repLabel();
    if (el._id !== c.id) {
      el._id = c.id;
      el.innerHTML = '<div class="devh"><b>👨‍💻 Dev panel</b><span class="tag" id="dvRep"></span></div>' +
        '<div class="pos-g"><div><span>Your dev bag</span><b class="num" id="dvBag"></b></div><div><span>Bag value</span><b class="num" id="dvVal"></b></div><div><span>Creator fees</span><b class="num" id="dvFee"></b></div></div>' +
        '<div class="devb"><button data-a="tweet">🐦 Tweet update</button><button data-a="burn">🔥 Burn 50%</button><button data-a="claim">💰 Claim fees</button><button data-a="rug" class="red">⚠️ Rug</button></div>' +
        '<div class="mu" style="font-size:11px;margin-top:8px">Stay loyal: tweet, burn and keep holding to build trust. Rugging pays now, but your reputation follows you to every future launch.</div>';
    }
    A.setT($('#dvBag'), pct.toFixed(2) + '%'); A.setT($('#dvVal'), '◎ ' + A.fSol(p.tok * Sim.price(c))); A.setT($('#dvFee'), '◎ ' + A.fSol(c.fee));
    const rp = $('#dvRep'); A.setT(rp, rl[0]); rp.className = 'tag ' + rl[1];
    $$('#shDev .devb button').forEach(b => { b.disabled = c.rug && b.dataset.a !== 'claim'; });
  }
  $('#shDev').addEventListener('click', e => {
    const b = e.target.closest('button'); const c = A.OPEN; if (!b || !c || !Sim.isMine(c)) return;
    const p = W().pos[c.id] || { tok: 0 };
    const a = b.dataset.a; A.hap(10);
    if (a === 'claim') {
      if (c.fee < 0.0005) return A.toast('💰', 'No fees to claim yet', 'Fees build up as people trade', 'info');
      const f = c.fee; Sim.cmd({ k: 'claim', cid: c.id }); W().sol += f; A.saveW(); A.renderBal(true); A.SND.cash();
      const [x, y] = A.center(b); A.FX.burst(x, y, { n: 30, cols: ['#ffc94d', '#fff'], sp: 6, type: 'star' }); A.toast('💰', 'Claimed ◎ ' + A.fSol(f) + ' in creator fees', null, 'ok');
    } else if (a === 'tweet') {
      const txt = '$' + c.sym + ' ' + pick(['update: dev still here, not selling 🫡', 'holders ' + c.hk.length + ' and growing. we cook', 'community is insane. next stop ' + pick(['100k', '1M', 'raydium']), 'chart looks healthy, building the meme', 'big things coming for $' + c.sym + ' 👀', 'dev not selling. ever.']);
      post(txt, { coin: c.id }); A.toast('🐦', 'Posted update', 'Hype hits the chart as likes roll in', 'ok'); A.SND.ok();
    } else if (a === 'burn') {
      if (p.tok <= 0) return A.toast('🔥', 'You have no dev tokens left', null, 'bad');
      A.modal('Burn 50% of your dev bag?', 'You give up ' + A.fK(p.tok / 2) + ' $' + c.sym + ' (~◎ ' + A.fSol(p.tok / 2 * Sim.price(c)) + '). Holders trust you more, the chart gets a boost, your rep goes up.', [{ t: 'Cancel' }, { t: '🔥 Burn', f: () => {
        p.tok /= 2; Sim.cmd({ k: 'burn', cid: c.id, frac: 0.5, rep: W().rep }).then(r => { if (r.rep != null) W().rep = r.rep; A.saveW(); }); A.saveW(); A.saveCoins();
        const [x, y] = A.center($('#shDev')); A.FX.burst(x, y, { n: 60, cols: ['#ff7a1a', '#ffc94d', '#ff3355'], sp: 8, type: 'spark', life: 50, g: -0.05 }); A.FX.flash('#ff7a1a'); A.SND.ok();
        A.toast('🔥', 'Burned 50% of your bag', 'Reputation ' + (W().rep >= 0 ? '+' : '') + W().rep, 'ok');
      } }]);
    } else if (a === 'rug') {
      if (p.tok <= 0) return A.toast('⚠️', 'Nothing left to dump', null, 'bad');
      const val = Sim.quoteSell(c, p.tok);
      A.modal('Rug $' + c.sym + '?', 'You dump your whole dev bag for about ◎ ' + A.fSol(val) + '. Holders get wrecked, the chat turns on you, followers unfollow and your next launches get way less trust.', [{ t: 'Stay loyal' }, { t: '⚠️ Rug it', red: true, f: () => {
        A.userSell(c, 1, $('#shDev'), true); Sim.cmd({ k: 'rug', cid: c.id, rep: W().rep }).then(r => { if (r.rep != null) W().rep = r.rep; A.saveW(); });
        const x = W().x, lost = Math.floor(x.followers * R(0.1, 0.25)); x.followers -= lost; A.saveW(); A.saveCoins();
        document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
        A.FX.flash('#ff3355'); A.hap(120);
        setTimeout(() => A.toast('🚩', lost + ' followers unfollowed you', 'Reputation now ' + W().rep, 'bad'), 1200);
        for (let i = 0; i < 2; i++) botTweet(); FEED[0].txt = '@' + x.handle + ' just rugged $' + c.sym + ' 🚩 stay away'; FEED[0].coin = c.id;
      } }]);
    }
    A.renderSheet(true);
  });

  // ---------- lifestyle ----------
  const carM = id => Art.CAR_BY[id], houseM = id => Art.HOUSE_BY[id];
  function solOf(usd) { return usd / Sim.solUsd; }
  function assetVal(a) { const m = a.kind === 'car' ? carM(a.model) : houseM(a.model); return m ? solOf(m.usd) * (a.kind === 'car' ? 0.85 : 0.92) : 0; }
  function netWorth() { let v = W().sol + (window.Biz ? Biz.netWorthSol() : 0); for (const id in W().pos) { const c = Sim.coins.get(id), p = W().pos[id]; if (c && p.tok > 0) v += p.tok * Sim.price(c); } W().assets.forEach(a => v += assetVal(a)); return v; }
  const SH = { k: 'car', q: '', f: 'all', sort: 'pa', n: 12 };
  $('#nCars').textContent = Art.CARS.length; $('#nHouses').textContent = Art.HOUSES.length; if (window.Biz) $('#nBiz').textContent = Biz.LIST.length;
  function shopChips() {
    const opts = SH.k === 'biz' ? Biz.chips() : SH.k === 'car' ? [['all', 'All']].concat(Object.keys(Art.CLASSES).map(k => [k, Art.CLASSES[k].label])) : [['all', 'All']].concat(Object.keys(Art.KINDS).map(k => [k, Art.KINDS[k].label]));
    $('#shopChips').innerHTML = opts.map(o => '<button data-f="' + o[0] + '"' + (o[0] === SH.f ? ' class="on"' : '') + '>' + o[1] + '</button>').join('');
  }
  A.bindSeg($('#shopSeg'), k => { SH.k = k; SH.f = 'all'; SH.n = 12; shopChips(); renderShop(true); });
  $('#shopChips').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; SH.f = b.dataset.f; SH.n = 12; shopChips(); renderShop(true); A.hap(5); });
  $('#shopQ').addEventListener('input', e => { SH.q = e.target.value.trim().toLowerCase(); SH.n = 12; renderShop(true); });
  $('#shopSort').addEventListener('change', e => { SH.sort = e.target.value; SH.n = 12; renderShop(true); });
  $('#shopMore').addEventListener('click', () => { SH.n += 12; renderShop(true); A.hap(5); });
  shopChips();
  function shopList() {
    if (SH.k === 'biz') return Biz.list(SH);
    const car = SH.k === 'car', src = car ? Art.CARS : Art.HOUSES, q = SH.q;
    let l = src.filter(m => (SH.f === 'all' || (car ? m.cls === SH.f : m.kind === SH.f)) && (!q || (m.name + ' ' + (m.brand || '') + ' ' + (m.place || '') + ' ' + (m.cls || m.kind)).toLowerCase().indexOf(q) >= 0));
    const key = { pa: m => m.usd, pd: m => -m.usd, perf: m => -(car ? m.hp : m.sqft), new: m => -(car ? m.year : m.beds) }[SH.sort];
    return l.slice().sort((a, b) => key(a) - key(b));
  }
  function specs(m) {
    if (SH.k === 'car' || m.hp) return '<div class="specs"><span>' + (m.year || '') + '</span><span>' + (m.hp || '?') + ' hp</span>' + (m.z60 ? '<span>0-60 ' + m.z60 + 's</span>' : '') + (m.top ? '<span>' + m.top + ' mph</span>' : '') + '<span>' + (m.design && Art.DESIGN_LABEL ? Art.DESIGN_LABEL[m.design] : ((Art.CLASSES[m.cls] || {}).label || '')) + '</span></div>';
    return '<div class="specs"><span>' + (m.beds ? m.beds + ' bd' : 'Studio') + '</span><span>' + (m.baths || 1) + ' ba</span><span>' + (m.sqft || 0).toLocaleString('en-US') + ' sqft</span><span>' + (m.archL || (Art.KINDS[m.kind] || {}).label || '') + '</span></div>';
  }
  function renderShop(force) {
    const box = $('#shop'), k = SH.k + '|' + SH.f + '|' + SH.q + '|' + SH.sort + '|' + SH.n + '|' + Math.round(Sim.solUsd);
    if (box._k === k && !force) return; if (box._k === k) return; box._k = k;
    const all = shopList(), list = all.slice(0, SH.n), car = SH.k === 'car';
    A.setT($('#shopCount'), all.length.toLocaleString('en-US') + (car ? ' cars' : SH.k === 'biz' ? ' businesses for sale' : ' listings'));
    $('#shopMore').style.display = all.length > SH.n ? '' : 'none';
    if (SH.k === 'biz') { box.innerHTML = list.map(Biz.card).join('') || '<div class="empty">Nothing matches.</div>'; return; }
    box.innerHTML = list.map(m => '<div class="shopc glass" data-m="' + m.id + '"><div class="art">' + (car ? Art.carArt(m, null, { bg: true }) : Art.houseArt(m)) + (m.brand === 'Signature' || (!car && !m.tod) ? '<span class="sig">SIGNATURE</span>' : '') + '</div>' +
      '<div class="sc-b"><div class="sc-t"><b>' + A.esc(m.name) + '</b><span class="mu">' + (car ? (m.brand !== 'Signature' ? m.brand : '') : m.place) + '</span></div>' + specs(m) + '<div class="mu" style="font-size:12px;margin-top:6px">' + m.blurb + '</div>' +
      '<div class="sc-p"><b>$' + m.usd.toLocaleString('en-US') + '</b><span class="num">◎ ' + A.fSol(solOf(m.usd)) + '</span></div>' +
      '<div class="sc-btns"><button class="big-btn buy sm" data-a="buy">Buy</button>' + (car ? '<button class="sbtn" data-a="rent">Rent 24h · ◎ ' + A.fSol(solOf(m.usd) * 0.005) + '</button>' : '') + '</div></div></div>').join('') || '<div class="empty">Nothing matches.</div>';
  }
  $('#shop').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const id = b.closest('[data-m]').dataset.m;
    if (SH.k === 'biz') return Biz.buyFlow(id, b);
    if (SH.k === 'car') { const m = carM(id); if (b.dataset.a === 'rent') rent(m, b); else paintPicker(m, b); }
    else buy('house', houseM(id), null, b);
  });
  function ov(html) { let o = $('#ov'); if (!o) { o = document.createElement('div'); o.id = 'ov'; document.body.appendChild(o); o.addEventListener('click', e => { if (e.target.id === 'ov') o.classList.remove('on'); }); } o.innerHTML = '<div class="mbox">' + html + '</div>'; o.classList.add('on'); return o; }
  function paintPicker(m, srcBtn) {
    let col = m.color;
    const o = ov('<h4>' + A.esc(m.name) + '</h4><div class="mu" style="font-size:12px">' + (m.year || '') + ' · ' + (m.hp || '') + ' hp · pick your paint</div><div class="pp-art" id="ppArt"></div><div class="swatches">' + Art.PAINTS.map(c => '<button style="background:' + c + '" data-c="' + c + '"></button>').join('') + '</div><div class="mbtns"><button id="ppNo">Cancel</button><button id="ppGo" class="buyb">Buy · ◎ ' + A.fSol(solOf(m.usd)) + '</button></div>');
    const draw = () => { $('#ppArt').innerHTML = Art.carArt(m, col, { bg: true }); $$('.swatches button', o).forEach(x => x.classList.toggle('on', x.dataset.c === col)); };
    draw();
    $('.swatches', o).addEventListener('click', e => { const s2 = e.target.closest('button'); if (!s2) return; col = s2.dataset.c; draw(); A.hap(6); A.SND.tap(); });
    $('#ppNo').onclick = () => o.classList.remove('on');
    $('#ppGo').onclick = () => { o.classList.remove('on'); buy('car', m, col, srcBtn); };
  }
  function buy(kind, m, color, btn) {
    const cost = solOf(m.usd);
    if (cost > W().sol) { A.SND.err(); A.hap(60); return A.toast('◎', 'Not enough SOL', 'You need ◎ ' + A.fSol(cost) + '. Win some trades or add balance', 'bad'); }
    W().sol -= cost; W().assets.push({ id: 'a' + now() + RI(0, 999), kind, model: m.id, color: color || m.color, sol: cost, t: now() }); A.saveW(); A.renderBal(true);
    const [x, y] = A.center(btn); A.FX.burst(x, y, { n: 60, cols: ['#ffc94d', A.T.a1, A.T.a2, '#fff'], sp: 9, type: 'star', life: 60 }); A.FX.ring(x, y, '#ffc94d', 170, 4); A.FX.rain(30); A.FX.flash('#ffc94d');
    A.SND.cash(); A.hap(40);
    A.toast(kind === 'car' ? '🏎️' : '🏠', 'You bought the ' + m.name, 'Flex it on X for followers', 'ok');
    $('#ownCars')._k = $('#ownHouses')._k = null; renderLife(true);
  }
  function rent(m, btn) {
    const cost = solOf(m.usd) * 0.005; // exotic rentals run roughly 0.5% of the car's price per day
    if (cost > W().sol) return A.toast('◎', 'Not enough SOL to rent', null, 'bad');
    W().sol -= cost; W().rent.push({ model: m.id, color: m.color, until: now() + 24 * 3600e3 }); A.saveW(); A.renderBal(true);
    const [x, y] = A.center(btn); A.FX.burst(x, y, { n: 30, cols: ['#ffc94d', '#fff'], sp: 6, type: 'star' }); A.SND.ok();
    A.toast('⏳', 'Rented the ' + m.name + ' for 24h', 'Perfect for a larp photoshoot. People might notice…', 'info');
    $('#ownCars')._k = null; renderLife(true);
  }
  function owned() {
    W().rent = W().rent.filter(r => r.until > now());
    const cars = W().assets.filter(a => a.kind === 'car' && carM(a.model)).map(a => Object.assign({ rented: false }, a)).concat(W().rent.filter(r => carM(r.model)).map(r => ({ id: 'r' + r.until, kind: 'car', model: r.model, color: r.color, rented: true, until: r.until })));
    return { cars, houses: W().assets.filter(a => a.kind === 'house' && houseM(a.model)) };
  }
  function renderOwn(box, list, kind) {
    const k = list.map(a => a.id).join(',');
    if (box._k === k) { $$('.own-c', box).forEach(el => { const r = list.find(a => a.id === el.dataset.id); if (r && r.rented) { const m = Math.max(0, Math.ceil((r.until - now()) / 60000)); A.setT($('.ttl', el), '⏳ ' + (m >= 60 ? Math.floor(m / 60) + 'h' : m + 'm')); } }); return; }
    box._k = k;
    box.innerHTML = list.length ? list.map(a => { const m = kind === 'car' ? carM(a.model) : houseM(a.model); return '<div class="own-c glass" data-id="' + a.id + '">' + (kind === 'car' ? Art.carArt(m, a.color, { bg: true }) : Art.houseArt(m)) + '<div class="own-n"><b>' + A.esc(m.name) + '</b>' + (a.rented ? '<span class="tag dev ttl"></span>' : '<span class="mu num">◎ ' + A.fSol(assetVal(a)) + '</span>') + '</div></div>'; }).join('')
      : '<div class="empty" style="padding:14px">' + (kind === 'car' ? 'No cars yet. The trenches are waiting 🏎️' : 'Still living in the trenches 🏚️') + '</div>';
  }
  function assetMenu(a, kind) {
    const m = kind === 'car' ? carM(a.model) : houseM(a.model);
    const o = ov('<h4>' + A.esc(m.name) + (a.rented ? ' (rented)' : '') + '</h4><div class="pp-art">' + (kind === 'car' ? Art.carArt(m, a.color, { bg: true }) : Art.houseArt(m)) + '</div><div class="mu" style="font-size:12px;margin-bottom:12px">' + (a.rented ? 'Rental. Can\'t be sold.' : 'Resale value ' + (kind === 'car' ? '85%' : '92% after selling costs') + ' of list price.') + '</div><div class="mbtns" style="flex-wrap:wrap"><button id="amFlex" class="buyb">📸 Flex on X</button>' + (a.rented ? '' : '<button id="amSell">Sell · ◎ ' + A.fSol(assetVal(a)) + '</button>') + '<button id="amNo">Close</button></div>');
    $('#amNo').onclick = () => o.classList.remove('on');
    $('#amFlex').onclick = () => { o.classList.remove('on'); flex(a, kind); };
    if (!a.rented) $('#amSell').onclick = () => { o.classList.remove('on'); const v = assetVal(a); W().sol += v; W().assets = W().assets.filter(x => x.id !== a.id); A.saveW(); A.renderBal(true); A.SND.sell(); A.toast('💸', 'Sold the ' + m.name, '+◎ ' + A.fSol(v), 'ok'); $('#ownCars')._k = $('#ownHouses')._k = null; renderLife(true); };
  }
  $('#ownBiz').addEventListener('click', e => {
    const sp = e.target.closest('#bzSpeed button'); if (sp) { Biz.setSpeed(sp.dataset.v); A.hap(6); A.SND.tap(); A.toast('⏱️', sp.dataset.v === 'fast' ? 'Fast clock: 1 hour = 1 business day' : 'Real-time clock: 1 day = 1 day', null, 'info'); return; }
    const card = e.target.closest('.bzo'); if (!card) return; const b = Biz.owned().find(x => x.id === card.dataset.id); if (!b) return;
    if (e.target.closest('.bzcol')) Biz.collect(b, e.target.closest('.bzcol')); else Biz.menu(b);
  });
  $('#ownCars').addEventListener('click', e => { const c = e.target.closest('.own-c'); if (!c) return; const a = owned().cars.find(x => x.id === c.dataset.id); if (a) assetMenu(a, 'car'); });
  $('#ownHouses').addEventListener('click', e => { const c = e.target.closest('.own-c'); if (!c) return; const a = owned().houses.find(x => x.id === c.dataset.id); if (a) assetMenu(a, 'house'); });
  function flex(a, kind) {
    const m = kind === 'car' ? carM(a.model) : houseM(a.model);
    const best = Object.keys(W().pos).map(id => Sim.coins.get(id)).filter(Boolean).sort((x, y) => Sim.mc(y) - Sim.mc(x))[0];
    const S = best ? best.sym : 'SOL';
    const txt = (kind === 'car' ? pick(LARP_CAR) : pick(LARP_HOUSE)).replace('{N}', m.name).replace('{P}', m.place || '').replace('{S}', S);
    post(txt, { img: kind === 'car' ? { k: 'car', id: m.id, color: a.color } : { k: 'house', id: m.id }, rented: a.rented });
    A.toast('📸', 'Flex posted', a.rented ? 'Hope nobody notices it\'s rented…' : 'The timeline is watching', 'ok'); A.SND.ok(); A.hap(15);
    A.go('launch'); xTab = 'me'; $$('#xSeg button').forEach(b => b.classList.toggle('on', b.dataset.k === 'me')); A.segInd($('#xSeg')); $('#xFeed')._m = null; $('#xFeed').innerHTML = '';
  }
  $('#flexBtn').addEventListener('click', () => {
    const o2 = owned(), all = o2.cars.map(a => [a, 'car']).concat(o2.houses.map(a => [a, 'house']));
    if (!all.length) return A.toast('📸', 'Nothing to flex yet', 'Buy or rent a car first', 'info');
    const o = ov('<h4>What are we flexing?</h4><div class="flexl">' + all.map((x, i) => { const m = x[1] === 'car' ? carM(x[0].model) : houseM(x[0].model); return '<button data-i="' + i + '">' + (x[1] === 'car' ? Art.carArt(m, x[0].color) : Art.houseArt(m)) + '<span>' + A.esc(m.name) + (x[0].rented ? ' ⏳' : '') + '</span></button>'; }).join('') + '</div>');
    $('.flexl', o).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; o.classList.remove('on'); const x = all[+b.dataset.i]; flex(x[0], x[1]); });
  });
  function renderLife(full) {
    const nw = netWorth(), o2 = owned();
    A.setT($('#nwSol'), A.fSol(nw)); A.setT($('#nwUsd'), '$' + Math.round(nw * Sim.solUsd).toLocaleString('en-US'));
    A.setT($('#nwCars'), String(o2.cars.length)); A.setT($('#nwHouses'), String(o2.houses.length)); A.setT($('#nwFol'), fK(Math.floor(W().x.followers)));
    renderOwn($('#ownCars'), o2.cars, 'car'); renderOwn($('#ownHouses'), o2.houses, 'house');
    if (window.Biz) { Biz.renderOwned(full); A.setT($('#nwBiz'), String(Biz.count())); }
    renderShop();
  }

  // ---------- tick: engagement, followers, replies, bot feed ----------
  let nextBot = now() + 4000;
  setInterval(() => {
    const x = W().x; let ch = false;
    x.tweets.forEach(tw => {
      const l = cur(tw, 'l');
      if (l > tw.lastL) { x.followers += (l - tw.lastL) * (tw.viral ? 0.025 : 0.012); tw.lastL = l; ch = true; }
      while (tw.rq && tw.rq.length && tw.rq[0] <= now()) { tw.rq.shift(); tw.rep.push(botReply(tw)); ch = true; }
      if (tw.coin && !tw.applied && now() - tw.t > 12000) { tw.applied = true; const c = Sim.coins.get(tw.coin); if (c && !c.rug && Sim.isMine(c)) Sim.cmd({ k: 'upd', cid: c.id, likes: l }); }
    });
    if (now() > nextBot) { botTweet(); nextBot = now() + R(5000, 11000) / Math.max(0.5, Sim.heat * (Sim.era === 'prime' ? 1.4 : 1)); }
    if (ch && Math.random() < 0.2) A.saveW();
  }, 1000);

  function render(view, full) {
    if (view === 'launch') {
      renderProf(); renderHype(); renderFeed();
      const mine = W().mine.map(id => Sim.coins.get(id)).filter(Boolean).reverse();
      A.sync($('#myList'), mine, makeMine, updMine); $('#myEmpty').style.display = mine.length ? 'none' : 'block';
      if (full) requestAnimationFrame(() => A.segInd($('#xSeg')));
    } else if (view === 'life') { renderLife(full); if (full) requestAnimationFrame(() => A.segInd($('#shopSeg'))); }
  }
  function back() { const o = $('#ov'); if (o && o.classList.contains('on')) { o.classList.remove('on'); return true; } return false; }
  function feedAdd(tw) { if (FEED.some(x => x.id === tw.id)) return; FEED.push(tw); FEED.sort((a, b) => b.t - a.t); if (FEED.length > 60) FEED.length = 60; }
  A.life = { render, devPanel, back, post, normW, feedAdd };
})();
