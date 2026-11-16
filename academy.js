/* Glasspad Academy: 20 episodes on how memecoins really work, each with a quiz and a practice mission in the sim.
   Plus "Why you lost": after a losing trade or a rug, it shows the red flags that were there when you bought. */
(function () {
  'use strict';
  const A = window.App, Sim = window.Sim; if (!A || !Sim) return;
  const $ = (s, r) => (r || document).querySelector(s), esc = A.esc;
  const LS = { get: (k, d) => { try { const v = localStorage.getItem('gp_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem('gp_' + k, JSON.stringify(v)); } catch (e) { } } };
  const PR = LS.get('acad', { done: {}, quiz: {}, flags: {}, cur: 1 });
  const save = () => LS.set('acad', PR);
  const flag = k => { PR.flags[k] = Date.now(); save(); checkMission(); };
  const since = (k, t) => (PR.flags[k] || 0) >= (t || 0);

  // ---------------- the 20 episodes ----------------
  const E = [
    { t: 'What a memecoin really is', em: '🐸', c: [
      ['No product, just attention', 'A memecoin is a token whose value comes only from people wanting it: a joke, a meme, a trend. No company, no revenue. Price = how much attention it gets, minus how many people want out.'],
      ['Most die fast', 'On launchpads like pump.fun, tens of thousands of coins launch every day. The vast majority go to zero within hours. Only around 1% ever "bond" (graduate). That is the base rate you fight against every trade.'],
      ['Who makes money', 'Mostly: early insiders, the dev, snipers, and a small group of skilled traders. Most people who buy lose. Glasspad uses fake SOL so you can learn the patterns without paying for them.']],
      q: ['What gives a memecoin its value?', ['Its company profits', 'Attention and demand', 'Government backing'], 1, 'There is no business behind it. If attention leaves, the price leaves.'],
      m: ['Open any coin and look at its page.', 'open'] },
    { t: 'The bonding curve', em: '📈', c: [
      ['Price set by a formula', 'New coins trade on a bonding curve: a smart contract that sells tokens at a price that rises as more SOL goes in. No order book, no seller needed. Every buy pushes the price up, every sell pushes it down.'],
      ['Why early is cheap', 'At launch the market cap is a few thousand dollars, so small buys move the price a lot. That is why snipers fight to buy in the first block.'],
      ['The progress bar', 'The "bonding curve %" shows how full the curve is. At 100% the coin graduates and moves to a normal DEX pool.']],
      q: ['On a bonding curve, what happens when you buy?', ['Price goes down', 'Nothing changes', 'Price goes up'], 2, 'Your SOL goes into the curve and the formula raises the price for the next buyer.'],
      m: ['Find a coin whose bonding curve is above 50% (Pulse → Stretch).', 'stretch'] },
    { t: 'Market cap, price & supply', em: '🔢', c: [
      ['Watch MC, not price', 'Every pump.fun coin has 1 billion tokens, so the tiny "price" is useless. Market cap = price × supply. Traders talk in MC: "bought at 10k, sold at 40k" means 4x.'],
      ['Your multiple', 'If you buy at $8K MC and sell at $24K MC, you made about 3x (minus fees and slippage).'],
      ['ATH and drawdown', 'ATH is the highest MC so far. A coin 80% below its ATH is not "cheap", it is usually dying.']],
      q: ['You buy at $10K MC and sell at $30K MC. Roughly how much did you make?', ['3x', '30%', '10x'], 0, '30K / 10K = 3x before fees and slippage.'],
      m: ['Buy any coin with a small amount (◎0.1 is fine).', 'buy'] },
    { t: 'Liquidity, slippage & size', em: '💧', c: [
      ['Small pools move a lot', 'A new coin has only a few SOL in its curve. A 2 SOL buy can move the price 10–20% by itself. Then when you sell, you push it back down. Big size in tiny coins = you pay twice.'],
      ['Slippage', 'Slippage is the max price change you accept between clicking and landing. Too low: your trade fails in fast markets. Too high: you get filled at a terrible price.'],
      ['Size rule', 'Look at the "price impact" line before buying. If it says more than ~5%, your size is too big for that coin.']],
      q: ['Why do big buys hurt more on brand-new coins?', ['Fees are higher', 'The pool is tiny, so you move the price against yourself', 'Big buys are illegal'], 1, 'Low liquidity means your own order changes the price a lot, both in and out.'],
      m: ['Check the trade panel and buy with price impact under 5%.', 'smallimpact'] },
    { t: 'Fees, priority & MEV', em: '⚡', c: [
      ['Every trade costs', 'Platform fee (~1%), network fee, plus a priority fee so validators include your transaction quickly. Ten round trips at 2–3% each eat a big part of your stack.'],
      ['Landing time', 'Your transaction is not instant. Low priority = slower and can be dropped in busy blocks. The price can move while you wait.'],
      ['Sandwich bots', 'MEV bots see your big buy, buy right before you, and sell right after, so you get fewer tokens. A Jito tip (Settings) routes around them.']],
      q: ['What does a sandwich bot do?', ['Buys before you and sells after you', 'Gives you free tokens', 'Cancels your trade'], 0, 'It front-runs your buy to profit from the price move you cause.'],
      m: ['Turn on MEV protection (Settings → Jito tip).', 'jito'] },
    { t: 'Reading the chart', em: '🕯️', c: [
      ['Candles', 'Each candle shows open, high, low, close for a time window. Green = closed higher, red = lower. Long wicks mean someone sold (or bought) hard into the move.'],
      ['Volume tells the truth', 'A pump on tiny volume is fragile. A pump with rising volume and many unique buyers is stronger. Falling volume after a pump = attention is leaving.'],
      ['Timeframes', 'Use 1s/5s to time entries, 1m to see the trend. A coin can look great on 5s and be in a clear downtrend on 1m.']],
      q: ['A coin pumps 50% but volume is tiny. What does that suggest?', ['Very strong move', 'Fragile move, few real buyers', 'Guaranteed bonding'], 1, 'Little volume means a few wallets moved it. It can reverse just as fast.'],
      m: ['Switch the chart timeframe on any coin.', 'tf'] },
    { t: 'Your trading screen', em: '🎛️', c: [
      ['Presets & quick buy', 'Preset amounts and the ⚡ quick-buy button exist for speed. Speed matters, but most losses come from clicking too fast, not too slow.'],
      ['Limit orders', 'A limit buy waits for a lower MC; a limit sell waits for your target. It still has to land, so it can miss in a fast dump.'],
      ['Pending transactions', 'The spinner chip shows your trade is in flight. Don\'t spam: three buys at once means three fees and a worse average.']],
      q: ['A limit sell triggers during a crash. Is the fill guaranteed?', ['Yes, always', 'No, it still has to land and can slip or fail'], 1, 'Triggers send a real transaction, with the same latency and slippage as any trade.'],
      m: ['Place a limit order on any coin (Trade card → Limit order).', 'limit'] },
    { t: 'Take profit & stop loss', em: '🎯', c: [
      ['Plan the exit first', 'Before you buy, decide: where do I take profit, where am I wrong? Without a plan you hold winners until they are losers.'],
      ['Take profit in parts', 'Selling half at 2x gets your initial back. The rest is a free ride. In memecoins, unsold profit is not profit.'],
      ['Stop losses', 'A stop loss caps the damage. It can fail in a vertical rug (nobody to sell to), which is why position size matters even more.']],
      q: ['Why sell half at 2x?', ['To pay less tax', 'You get your initial back, the rest is risk-free', 'It pumps the chart'], 1, 'Taking initials removes the chance of turning a winner into a loss.'],
      m: ['Set a take profit or stop loss on a position.', 'tpsl'] },
    { t: 'How rugs happen', em: '🚩', c: [
      ['The dev dump', 'The dev buys at launch, waits for buyers, then sells everything at once. The price collapses because there is no one on the other side.'],
      ['Warning signs', 'Dev holds a big % (over ~5%), dev already rugged other coins (dev history), bundled wallets, fake holders. Check the audit chips before buying.'],
      ['Soft rugs', 'Not every rug is one sell. Devs and insiders can drip-sell into every pump. A chart that dumps on every green candle is being farmed.']],
      q: ['Which is the biggest rug warning?', ['Dev holds 18% and rugged 4 coins before', 'Lots of comments', 'Green candles'], 0, 'A big dev bag plus a history of rugs is the classic setup.'],
      m: ['Open a coin\'s audit and check the dev chip (🕵️ dev history).', 'audit'] },
    { t: 'Bundles & snipers', em: '📦', c: [
      ['Bundles', 'The dev buys from many wallets in the same block as the launch, to hide how much they own. Those wallets usually sell together with the dev.'],
      ['Snipers', 'Bots buy in the first seconds and sell into the first pump. A coin with 20%+ snipers is a coin where the first buyers are waiting to dump on you.'],
      ['How to read it', '📦 Insiders and 🎯 Snipers chips on every card. High numbers = most early supply is held by people who plan to sell soon.']],
      q: ['Why are bundled wallets dangerous?', ['They hide how much the dev really owns', 'They lower fees', 'They lock liquidity'], 0, 'Bundles make supply look spread out when it is really one person.'],
      m: ['Buy a coin with insiders under 10% and snipers under 15%.', 'cleanbuy'] },
    { t: 'Fake holders & fake volume', em: '👻', c: [
      ['Fake holders', 'Devs airdrop dust to hundreds of fresh wallets so the holder count looks big. These wallets never bought and never sell. The 👻 chip counts them.'],
      ['Wash trading', 'Volume bots buy and sell the same coin over and over so it shows up on "trending". The 🔁 bot volume chip shows how much is fake.'],
      ['Real demand', 'What matters: real holders, unique buyers, and volume that is not just bots trading with themselves.']],
      q: ['A coin has 400 holders, 300 are dust airdrops. How many real holders?', ['400', '100', '700'], 1, 'Dust wallets are props to fake popularity.'],
      m: ['Find a coin with a 👻 fake-holder chip and open its holders tab.', 'holders'] },
    { t: 'Bubble maps', em: '🫧', c: [
      ['See who is connected', 'A bubble map draws the top holders as circles sized by how much they hold, and links wallets that are funded by the same source.'],
      ['Clusters = one person', 'A big red cluster linked to the dev means the "decentralized" supply is actually one group. If they hold 30%, they control the chart.'],
      ['Use it every time', 'Before you ape: open the bubble map. Clean coins have many separate bubbles, scams have one big connected blob.']],
      q: ['The bubble map shows 8 big wallets all linked to the dev. What does it mean?', ['Healthy distribution', 'Supply is concentrated in one group', 'The coin bonded'], 1, 'Linked wallets act as one seller.'],
      m: ['Open the full-screen bubble map on any coin.', 'bubble'] },
    { t: 'Cabals & coordinated dumps', em: '🕸️', c: [
      ['What a cabal is', 'A group of wallets (often a trading group) that buys a coin together, pumps it with posts and calls, and sells together into the buyers they attracted.'],
      ['The tell', 'Several wallets buy within seconds of each other, then a wave of hype appears. The 🕸️ cabal chip and bubble map clusters show it.'],
      ['Don\'t be exit liquidity', 'If you are buying because a group is shouting about it, ask who is selling to you.']],
      q: ['Who is a cabal pump usually for?', ['The cabal members, so they can sell to late buyers', 'New traders'], 0, 'Late buyers are the exit.'],
      m: ['Look at a wallet profile (tap any wallet in Trades or Holders).', 'wallet'] },
    { t: 'KOLs & paid calls', em: '📣', c: [
      ['Key Opinion Leaders', 'Influencers with big followings post coins. Many buy first, post second, and sell into their followers\' buys.'],
      ['Front-running', 'By the time you see the post, the KOL is already up. The followers\' buys are their exit.'],
      ['Track the wallet, not the tweet', 'Tracking what a wallet actually does beats reading what it says. Pulse → 👁 Tracker.']],
      q: ['A KOL posts a coin with "just aped". When did they buy?', ['After posting', 'Usually before posting'], 1, 'The post is how they get exit liquidity.'],
      m: ['Track a wallet (Pulse → 👁 Tracker, or a wallet profile).', 'track'] },
    { t: 'Bonding & migration', em: '🎓', c: [
      ['Graduation', 'When the curve fills (~85 SOL), the coin migrates to a DEX pool (PumpSwap/Raydium). Liquidity gets locked/burned.'],
      ['Sell the news', 'Many traders buy to "front-run the bond" and sell right at migration. Bonding is often a local top.'],
      ['After migration', 'Some coins run after bonding on new attention, many fade. Same rules: volume, holders, distribution.']],
      q: ['What often happens right at bonding?', ['Guaranteed pump', 'People who front-ran the bond take profit'], 1, 'Bonding itself is known in advance, so it\'s often priced in.'],
      m: ['Open a coin from Pulse → Migrated.', 'migrated'] },
    { t: 'Smart money', em: '🧠', c: [
      ['Wallets that win', 'Some wallets are consistently profitable. Their buys are a signal, but they also sell fast.'],
      ['Copy-trading trap', 'If you copy a smart wallet with a delay, you buy higher and they sell to you. Use their buys as a reason to look, not to ape.'],
      ['Check the stats', 'Wallet profiles show PnL and win rate. A KOL with a 30% win rate is selling the dream, not winning.']],
      q: ['Copying a smart wallet 30 seconds late is...', ['Free money', 'Risky: you buy higher, they may sell to you'], 1, 'Latency turns their edge into yours to pay.'],
      m: ['Open the Tracker and look at the live feed.', 'tracker'] },
    { t: 'Hype cycles & social', em: '🎬', c: [
      ['Attention moves price', 'Clips, X posts and Telegram calls bring buyers. More views = more buyers, for a while.'],
      ['The cycle', 'Discovery → hype → peak attention → late buyers → insiders sell → fade. By the time a coin is everywhere, the early buyers are leaving.'],
      ['Read the room', 'Watch Clips to see what is getting attention, then check the chart and audit. Hype without clean distribution is a trap.']],
      q: ['A coin is all over your feed. What stage is it probably in?', ['Discovery', 'Late hype, early buyers selling'], 1, 'Peak attention is usually near the top.'],
      m: ['Watch a clip in 🎬 Clips (Trending → Clips).', 'clip'] },
    { t: 'DEX paid, boosts & CTOs', em: '💊', c: [
      ['DEX paid', 'Paying for a token profile on DEX screeners. Cheap, shows effort, proves nothing about safety.'],
      ['Boosts', 'Paid visibility on trending lists. Brings eyes, often bought by the dev or a cabal right before they sell.'],
      ['Community takeover', 'When the dev abandons or rugs, holders sometimes take over the coin. Most CTOs still fade, a few revive.']],
      q: ['Does "DEX paid" mean a coin is safe?', ['Yes', 'No, it just means someone paid for a profile'], 1, 'It is marketing, not an audit.'],
      m: ['Find a coin with a 💊 or ⚡ boost badge.', 'boosted'] },
    { t: 'Psychology: FOMO & tilt', em: '🧘', c: [
      ['FOMO', 'Fear of missing out makes you buy green candles. The sim data shows chasing pumps is the worst strategy: buyers of +15% candles lose on average.'],
      ['Revenge trading', 'After a loss you size up to "make it back". That is how small losses become wipeouts.'],
      ['Rules beat feelings', 'Fixed size per trade, exit plan before entry, and a daily stop. If you break your rules three times, close the app.']],
      q: ['After two losses in a row, the best move is...', ['Double your size', 'Stick to the same size or take a break'], 1, 'Sizing up on tilt is the classic way to blow up.'],
      m: ['Use the 📸 Share PnL card on one of your positions.', 'pnl'] },
    { t: 'Your playbook', em: '📋', c: [
      ['Before every buy', '1) Audit chips: dev %, bundles, snipers, fake holders, bot volume. 2) Bubble map: one cluster? 3) Chart + volume on 1m. 4) Size: price impact under 5%. 5) Exit plan: TP and SL set.'],
      ['After every trade', 'Read the "Why you lost/won" card. Patterns repeat. The game keeps a history in Wallet → Activity.'],
      ['Real life warning', 'Real memecoin trading is mostly a losing game: rugs, bots and insiders take most of the money. Never put in money you can\'t lose. Everything here is simulated.']],
      q: ['What should you check first before aping?', ['The meme', 'Audit + bubble map + your size and exit plan', 'How many emojis are in chat'], 1, 'Signals first, meme second.'],
      m: ['Make a full trade: buy a clean coin with TP/SL set, then close it.', 'roundtrip'] }
  ];
  const REWARD = 2; // SIM SOL per completed episode

  // ---------------- mission checks (flags set by hooks below) ----------------
  function startT(n) { return (PR.st || {})[n] || 0; }
  function missionDone(n) { const ep = E[n - 1]; return since(ep.m[1], startT(n)); }
  function checkMission() {
    const n = PR.cur; if (!n || PR.done[n]) return; const ep = E[n - 1]; if (!ep) return;
    if (PR.quiz[n] && missionDone(n)) complete(n);
    const el = $('#acMis'); if (el) paintMission(n);
  }
  function complete(n) {
    if (PR.done[n]) return; PR.done[n] = Date.now(); A.W.sol += REWARD; A.saveW(); A.renderBal(true); save();
    A.toast('🎓', 'Episode ' + n + ' complete!', '+◎' + REWARD + ' SIM reward' + (n < E.length ? ' · Episode ' + (n + 1) + ' unlocked' : ' · Academy finished 🏆'), 'ok');
    try { const [x, y] = [innerWidth / 2, innerHeight / 2]; A.FX.burst(x, y, { n: 40, cols: [A.T.a1, A.T.a2, '#fff', '#ffcf3a'], sp: 7, type: 'star', life: 50 }); } catch (e) { }
    if (n < E.length) PR.cur = n + 1; save(); render();
  }

  // ---------------- UI ----------------
  const ov = document.createElement('div'); ov.id = 'acad'; document.body.appendChild(ov);
  function open(n) { if (n) { PR.cur = n; (PR.st = PR.st || {})[n] = PR.st[n] || Date.now(); save(); } ov.classList.add('on'); render(); flag('acad'); }
  function close() { ov.classList.remove('on'); }
  window.Academy = { open, flag, E };
  function unlocked(n) { return n === 1 || PR.done[n - 1] || PR.done[n]; }
  function list() {
    const dn = Object.keys(PR.done).length;
    return '<div class="ac-top"><button class="ib" data-x="close"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button><b>🎓 Academy</b><span class="mu">' + dn + '/20</span></div>' +
      '<div class="ac-prog"><i style="width:' + (dn / 20 * 100) + '%"></i></div>' +
      '<p class="ac-intro">20 short episodes on how memecoins really work. Each has a 1-question quiz and a mission in the game. Finish one to unlock the next (+◎' + REWARD + ' SIM each).</p>' +
      '<div class="ac-eps">' + E.map((e, i) => { const n = i + 1, d = PR.done[n], u = unlocked(n); return '<button class="ac-ep' + (d ? ' done' : '') + (!u ? ' lock' : '') + (PR.cur === n && !d ? ' cur' : '') + '" data-ep="' + n + '"><span class="ac-n">' + (d ? '✓' : u ? n : '🔒') + '</span><span class="ac-em">' + e.em + '</span><span class="ac-t">' + esc(e.t) + '</span></button>'; }).join('') + '</div>';
  }
  let view = null, card = 0;
  function episode(n) {
    const e = E[n - 1], k = e.c.length, q = e.q, qd = PR.quiz[n];
    let body;
    if (card < k) body = '<div class="ac-card" key="' + card + '"><div class="ac-cn">' + (card + 1) + ' / ' + k + '</div><h3>' + esc(e.c[card][0]) + '</h3><p>' + esc(e.c[card][1]) + '</p></div><div class="ac-nav"><button class="sbtn" data-x="prev"' + (card ? '' : ' disabled') + '>Back</button><button class="sbtn ac-go2" data-x="next">' + (card < k - 1 ? 'Next' : 'Quiz →') + '</button></div>';
    else body = '<div class="ac-card"><div class="ac-cn">Quiz</div><h3>' + esc(q[0]) + '</h3><div class="ac-qs">' + q[1].map((a, i) => '<button data-q="' + i + '" class="' + (qd != null ? (i === q[2] ? 'ok' : i === qd ? 'no' : '') : '') + '"' + (qd != null ? ' disabled' : '') + '>' + esc(a) + '</button>').join('') + '</div>' + (qd != null ? '<p class="ac-why">' + (qd === q[2] ? '✅ ' : '❌ ') + esc(q[3]) + '</p>' : '') + '</div>' +
      '<div class="ac-mis" id="acMis"></div><div class="ac-nav"><button class="sbtn" data-x="prev">Back</button>' + (PR.done[n] && n < E.length ? '<button class="sbtn ac-go2" data-ep="' + (n + 1) + '">Next episode →</button>' : '<button class="sbtn ac-go2" data-x="play">Go do it ▶</button>') + '</div>';
    return '<div class="ac-top"><button class="ib" data-x="list"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button><b>' + e.em + ' Ep ' + n + '</b><span class="mu">' + esc(e.t) + '</span></div>' +
      '<div class="ac-dots">' + Array.from({ length: k + 1 }, (_, i) => '<i class="' + (i === card ? 'on' : i < card ? 'past' : '') + '"></i>').join('') + '</div>' + body;
  }
  function paintMission(n) {
    const el = $('#acMis'); if (!el) return; const e = E[n - 1], qd = PR.quiz[n] != null, md = missionDone(n) || PR.done[n];
    el.innerHTML = '<div class="ac-mh">🎯 Mission</div><p>' + esc(e.m[0]) + '</p><div class="ac-ms"><span class="' + (qd ? 'ok' : '') + '">' + (qd ? '✓' : '○') + ' Quiz</span><span class="' + (md ? 'ok' : '') + '">' + (md ? '✓' : '○') + ' Mission</span>' + (PR.done[n] ? '<span class="ok">🎓 Done</span>' : '') + '</div>';
  }
  function render() {
    if (!ov.classList.contains('on')) return;
    ov.innerHTML = '<div class="ac-wrap">' + (view ? episode(view) : list()) + '</div>';
    if (view && card >= E[view - 1].c.length) paintMission(view);
  }
  ov.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; A.hap(6); A.SND.tap();
    if (b.dataset.ep) { const n = +b.dataset.ep; if (!unlocked(n)) return A.toast('🔒', 'Finish episode ' + (n - 1) + ' first', null, 'info'); view = n; card = 0; PR.cur = n; (PR.st = PR.st || {})[n] = PR.st[n] || Date.now(); save(); render(); return; }
    const x = b.dataset.x;
    if (x === 'close') close(); else if (x === 'list') { view = null; render(); }
    else if (x === 'next') { card++; render(); } else if (x === 'prev') { if (card) card--; else view = null; render(); }
    else if (x === 'play') { close(); A.toast('🎯', 'Mission', E[view - 1].m[0], 'info'); }
    else if (b.dataset.q != null && view) { PR.quiz[view] = +b.dataset.q; save(); if (+b.dataset.q === E[view - 1].q[2]) A.SND.ok(); else A.SND.err(); render(); checkMission(); }
  });
  // entry points: Trending tab card + Pulse chip
  const tr = $('#v-trend .pad'); if (tr) { const d = document.createElement('div'); d.className = 'ac-entry'; d.innerHTML = '<button class="glass" id="acOpen"><span>🎓</span><b>Academy</b><em>20 episodes · learn the trenches</em></button><button class="glass" id="clOpen"><span>🎬</span><b>Clips</b><em>launches & hype</em></button>'; tr.insertBefore(d, tr.children[1] || null); d.querySelector('#acOpen').onclick = () => { view = null; open(); }; }
  // first-time nudge
  if (!PR.seen) setTimeout(() => { PR.seen = 1; save(); A.toast('🎓', 'New: Academy', 'Learn how memecoins work: Trending → Academy', 'info'); }, 15000);

  // ---------------- hooks that power missions ----------------
  const sh = document.getElementById('sheet'); if (sh) new MutationObserver(() => { if (!sh.classList.contains('on')) return; const c = A.OPEN; flag('open'); if (c) { if (!c.grad && Sim.progress(c) >= 50) flag('stretch'); if (c.grad) flag('migrated'); if (c.dexPaid || c.boosts) flag('boosted'); } }).observe(sh, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('.tfs button, [data-tf]')) flag('tf');
    if (t.closest('#fSeg button[data-k="ho"]')) { flag('holders'); const c = A.OPEN; if (c && !c.dust) delete PR.flags.holders; }
    if (t.closest('#shAudit') || t.closest('.audit')) flag('audit');
    if (t.closest('#posX [data-tp], #posX [data-sl]')) flag('tpsl');
    if (t.closest('#lBox .lgo')) flag('limit');
    if (t.closest('#cfgJito button[data-v]') && +t.closest('button').dataset.v > 0) flag('jito');
    if (t.closest('#pSeg button[data-k="trk"]')) flag('tracker');
    if (t.closest('.px-sh')) flag('pnl');
  }, true);
  setInterval(() => { const W = A.W; if (A.OPEN && document.querySelector('#shAudit')) { const r = document.querySelector('#shAudit').getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) flag('audit'); } if ((W.track || []).length > 6) flag('track'); }, 3000);
  const pTrack = A.W.track ? A.W.track.length : 0; setInterval(() => { if ((A.W.track || []).length > pTrack) flag('track'); }, 4000);

  // ---------------- "Why you lost / won" ----------------
  function snap(c) { const s = Sim.stats(c); return { age: Math.round((Sim.t - c.born) / 1000), dev: s.dev, ins: s.insiders, sn: s.snipers, dust: s.dust, bv: s.botVol, t10: s.top10, cab: s.cabal || 0, ch1: Sim.change(c, 60), devR: s.devR || 0, devL: s.devL || 0, imp: 0 }; }
  function flagsOf(e) {
    const f = [];
    if (e.age < 30) f.push('bought ' + e.age + 's after launch: snipers dump on the first buyers');
    if (e.dev > 5) f.push('dev held ' + e.dev.toFixed(0) + '% (big bag = rug risk)');
    if (e.devL > 1 && e.devR / e.devL > 0.5) f.push('dev rugged ' + e.devR + ' of ' + e.devL + ' earlier coins');
    if (e.ins > 10) f.push('bundles/insiders held ' + e.ins.toFixed(0) + '%');
    if (e.sn > 15) f.push('snipers held ' + e.sn.toFixed(0) + '%');
    if (e.dust) f.push(e.dust + ' fake holders (airdropped dust)');
    if (e.bv > 25) f.push(e.bv.toFixed(0) + '% of volume was bots');
    if (e.cab > 3) f.push('cabal wallets held ' + e.cab.toFixed(0) + '%');
    if (e.t10 > 40) f.push('top 10 wallets held ' + e.t10.toFixed(0) + '%');
    if (e.ch1 > 20) f.push('you chased a +' + e.ch1.toFixed(0) + '% candle');
    return f;
  }
  function postMortem(c, p, why) {
    const e = p.ent; if (!e || Sim.isMine(c)) return; const pn = p.out - p.in, pc = p.in ? pn / p.in * 100 : 0, f = flagsOf(e);
    const good = pn >= 0;
    const html = '<h4>' + (good ? '✅ Why you won' : '📋 Why you lost') + ' · $' + esc(c.sym) + '</h4><div class="pm-r ' + (good ? 'up' : 'dn') + '">' + (good ? '+' : '') + A.fSol(pn) + ' ◎ (' + (pc >= 0 ? '+' : '') + pc.toFixed(0) + '%)' + (why ? ' · ' + esc(why) : '') + '</div>' +
      (f.length ? '<div class="pm-h">' + (good ? 'You won despite these red flags (lucky):' : 'Red flags that were there when you bought:') + '</div><ul class="pm-l">' + f.map(x => '<li>🚩 ' + esc(x) + '</li>').join('') + '</ul>' : '<div class="pm-h">' + (good ? 'Clean entry: no major red flags at your buy. That\'s how it\'s done.' : 'No major red flags at your entry: sometimes clean coins just fade. Size small and keep a stop loss.') + '</div>') +
      '<div class="pm-tip">' + (f.length && !good ? 'Tip: Academy episodes 9–13 cover these signals.' : 'Every trade is a lesson: Trending → 🎓 Academy.') + '</div>';
    let o = document.getElementById('ov'); if (!o) { o = document.createElement('div'); o.id = 'ov'; document.body.appendChild(o); o.addEventListener('click', ev => { if (ev.target.id === 'ov') o.classList.remove('on'); }); }
    o.innerHTML = '<div class="mbox pm">' + html + '<div class="mbtns"><button data-a="0">Close</button><button class="buyb" data-a="1">🎓 Academy</button></div></div>';
    o.querySelectorAll('.mbtns button').forEach(b => b.onclick = () => { o.classList.remove('on'); if (b.dataset.a === '1') { view = null; open(); } });
    o.classList.add('on');
  }
  const P = window.Pro || {}; const oFill = P.onFill;
  P.onFill = function (c, side, sol, tok) {
    if (oFill) oFill.apply(this, arguments);
    const p = A.W.pos[c.id]; if (!p) return;
    if (side) { if (!p.ent || p.tok - tok < 1) { p.ent = snap(c); } flag('buy'); const e = p.ent; if (e.ins < 10 && e.sn < 15) flag('cleanbuy'); if (Sim.quoteBuy && sol > 0) { const q = Sim.quoteBuy(c, sol), mc = Sim.mcUsd(c); } A.saveW(); }
    else if (p.tok <= 0) { const e = p.ent; if (e && !flagsOf(e).length && (p.tp || p.sl || PR.flags.tpsl)) flag('roundtrip'); else if (PR.flags.tpsl && PR.flags.cleanbuy) flag('roundtrip'); if (e && (p.out - p.in < 0 || flagsOf(e).length)) { const d = { ent: e, in: p.in, out: p.out }; setTimeout(() => postMortem(c, d), 900); } p.ent = null; A.saveW(); }
  };
  window.Pro = P;
  // rugs on coins you hold
  const oEv = Sim.onEvent; Sim.onEvent = function (c, icon, text) { if (oEv) oEv.apply(this, arguments); try { if ((icon === '⚠️' || /rugged|dumping together/i.test(text)) && !Sim.isMine(c)) { const p = A.W.pos[c.id]; if (p && p.tok > 0 && p.ent && !p._pmShown) { p._pmShown = 1; setTimeout(() => { A.toast('🚩', '$' + c.sym + ' just got rugged', 'Tap to see what warned you', 'bad'); postMortem(c, { ent: p.ent, in: p.in, out: p.out + (p.tok > 0 ? Sim.quoteSell(c, p.tok) : 0) }, 'rugged while holding'); }, 400); } } } catch (e) { } };
  // impact mission: watch the quote line
  setInterval(() => { const el = document.getElementById('tPrev') || document.querySelector('.tq'); if (!el || !A.OPEN) return; const m = (el.textContent || '').match(/impact\s*([\d.]+)%/i); if (m && +m[1] < 5 && A.W.pos[A.OPEN.id] && A.W.pos[A.OPEN.id].tok > 0) flag('smallimpact'); }, 1500);
  // chat & clips & bubble flags come from their modules via Academy.flag
})();
