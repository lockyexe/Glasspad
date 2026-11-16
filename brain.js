/* Glasspad brain: makes bots actually talk to you.
   - Understands what you wrote (questions, takes, greetings, accusations, @mentions).
   - Answers with the coin's real numbers (dev %, bundles, top 10, holders, bonding, mc, your position).
   - Every reply comes from a real wallet with its own entry and PnL, so opinions match positions.
   - Remembers the conversation per coin and never repeats a line.
   - Optional: plug in a free AI key (Groq, Google Gemini, OpenRouter, or any OpenAI-compatible URL).
     Falls back to the built-in engine whenever the AI is off, slow, or out of free quota. */
(function (G) {
  'use strict';
  const Sim = G.Sim; if (!Sim) return;
  const B = {};
  const rnd = Math.random, R = (a, b) => a + rnd() * (b - a), RI = (a, b) => Math.floor(R(a, b + 1)), pick = a => a[Math.floor(rnd() * a.length)];
  const fK = n => { n = Math.abs(n); return n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'K' : n.toFixed(0); };
  const usd = n => '$' + fK(n);
  const pct = x => (x >= 0 ? '+' : '') + (x * 100).toFixed(Math.abs(x) < .1 ? 1 : 0) + '%';

  // ---------------- never repeat ----------------
  const RING = [], SEEN = new Map();
  const norm = s => String(s || '').toLowerCase().replace(/@\w+/g, '').replace(/[^a-z0-9$%. ]/g, '').replace(/\s+/g, ' ').trim();
  B.dup = t => { const k = norm(t); return k.length > 2 && SEEN.has(k); };
  B.mark = t => { const k = norm(t); if (k.length < 3) return; SEEN.set(k, (SEEN.get(k) || 0) + 1); RING.push(k); if (RING.length > 700) { const o = RING.shift(); const n = SEEN.get(o) - 1; if (n <= 0) SEEN.delete(o); else SEEN.set(o, n); } };
  function fresh(gen, tries) { let t = ''; for (let i = 0; i < (tries || 8); i++) { t = gen(); if (t && !B.dup(t)) break; } if (t) B.mark(t); return t; }

  // ---------------- understanding the user ----------------
  const INT = [
    ['bot', /\b(bots?|npcs?|ai|chatgpt|real (people|person|humans?)|are (you|u|yall|y'all) real|fake (chat|people))\b/i],
    ['greet', /^\s*(gm+|gn|hi+|hey+|hello|yo+|sup|wsg|wassup|whats up|what's up|good (morning|evening)|evening|morning)\b/i],
    ['thanks', /\b(thanks|thank you|thank u|ty|thx|tysm|appreciate)\b/i],
    ['insult', /\b(idiot|stupid|dumb|loser|losers|clown|clowns|shut up|stfu|moron|chopped|broke|npc|npcs|ngmi|mid|bum|bozo|fraud|larper|weirdo|noob|cringe|jeet|jeets|trash|garbage|L take)\b|-\d+ aura/i],
    ['praise', /\b(goat|goated|based|respect|legend|king|real one|love (you|u|yall|this)|you'?re (right|smart|goated|the best)|good call|nice call|w (bot|take|call|guy|chat|human|comm)|\+\d+ aura|appreciate)\b/i],
    ['disagree', /\b(cap|capping|wrong|lying|liar|cope|coping|delulu|delusional|no way|nah|not true|bs|ratio)\b/i],
    ['devq', /\b(dev|deployer|creator|team)\b/i],
    ['rugq', /\b(rug|rugpull|rugged|scam|honeypot|safe)\b/i],
    ['bundleq', /\b(bundles?|bundled|insiders?|snipers?|sniped)\b/i],
    ['holdersq', /\b(holders?|top ?10|top holders|distribution|whales?)\b/i],
    ['sellq', /\b(sell|take profits?|tp|exit|cash out|paper)\b/i],
    ['buyq', /\b(buy|ape|aping|enter|get in|too late|still early|early|worth it|entry point)\b/i],
    ['targetq', /\b(how high|target|prediction|where (is|will) (it|this)|go to|reach|1m|10m|100m|1b|ath|flip|moon)\b/i],
    ['mcq', /\b(mc|mcap|market ?cap|price|chart|volume|vol|liquidity|bond|bonding|curve|graduat\w*|migrat\w*|raydium|pumpswap)\b/i],
    ['whoq', /\b(who|anyone|anybody|somebody|yall|y'all|u guys|you guys)\b/i],
    ['entryq', /\b(entry|bought at|avg|average|your (bag|position)|how much (you|u|yall) (got|have|hold|in))\b/i],
    ['myposq', /\b(am i|my (bag|position|entry|pnl)|i'?m (up|down)|i bought|i aped|i sold)\b/i],
    ['bull', /(🚀|📈|💎|\b(lfg|pump|send(ing)?|bull(ish)?|100x|1000x|wagmi|ripping|up only|gem|cook(ing)?|let'?s go|we up|green)\b)/i],
    ['bear', /(📉|\b(dump(ing)?|dead|over|cooked|rugged|scam|trash|jeets?|down bad|ngmi|rekt|bleed(ing)?|red|bearish|zero)\b)/i],
    ['joke', /(😂|🤣|💀|\b(lol|lmao|lmfao|haha+|kek)\b)/i]
  ];
  function understand(txt) {
    const t = String(txt || ''), q = /\?\s*$/.test(t) || /^\s*(is|are|do|does|did|should|can|will|wen|when|why|how|who|what|where|any|anyone)\b/i.test(t);
    const set = new Set(); INT.forEach(x => { if (x[1].test(t)) set.add(x[0]); });
    const at = (t.match(/@(\w{2,20})/) || [])[1] || null;
    const words = t.toLowerCase().replace(/[^a-z0-9$ ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOP.has(w));
    const key = words.sort((a, b) => b.length - a.length)[0] || null;
    return { t, q, set, at, key };
  }
  const STOP = new Set('this that with what when where your have from they them will would could should about just like dont doesnt cant really think know going been were there their here then than also some more much very into over guys chat coin token'.split(' '));

  // ---------------- facts about a coin ----------------
  function facts(c) {
    const S = Sim.stats(c), mc = Sim.mcUsd(c), ch1 = Sim.mc(c) / Math.max(1e-9, Sim.mcAgo(c, 60)) - 1, ch5 = Sim.mc(c) / Math.max(1e-9, Sim.mcAgo(c, 300)) - 1;
    const age = (Sim.t - c.born) / 1000, prog = Sim.progress(c), d = c.devP;
    const A = G.App, p = A && A.W && A.W.pos ? A.W.pos[c.id] : null, my = p && p.tok > 0 ? { val: p.tok * Sim.price(c), cost: p.in || 0, out: p.out || 0, tok: p.tok } : null;
    if (my) my.pnl = my.cost > 0 ? (my.val + my.out) / my.cost - 1 : 0;
    const last = c.trades[0];
    return { c, S, mc, ch1, ch5, age, prog, d, my, sym: '$' + c.sym, holders: c.hk.length, rug: !!c.rug, grad: !!c.grad, dex: Sim.dex ? Sim.dex() : 'Raydium', ath: c.ath ? c.ath * Sim.solUsd : mc, txns: c.buys + c.sells, last,
      devPct: S.dev, devSold: S.dev <= 0.05, bund: S.insiders, snip: S.snipers, top10: S.top10, mine: !!c.mine };
  }
  const pumping = F => F.ch1 > 0.15 || F.ch5 > 0.4, dumping = F => F.ch1 < -0.15 || F.ch5 < -0.35;

  // ---------------- answer builders (fact sentences, many phrasings) ----------------
  const ANS = {
    devq: F => F.mine ? [F.devSold ? 'dev (the guy who launched it) already sold' : 'dev still holds ' + F.devPct.toFixed(1) + '%', 'dev is active on X at least'] :
      [F.devSold ? pick(['dev sold already', 'dev wallet is empty', 'dev is out, sold the whole bag', 'dev dumped his bag already']) : pick(['dev still holds ' + F.devPct.toFixed(1) + '%', 'dev wallet has ' + F.devPct.toFixed(1) + '% rn', F.devPct.toFixed(1) + '% sitting in the dev wallet', 'dev hasn\'t sold, ' + F.devPct.toFixed(1) + '% still there']),
        F.d ? (F.d.launched > 1 ? pick(['he launched ' + F.d.launched + ' coins before, ' + F.d.rugged + ' rugged', 'dev history: ' + F.d.launched + ' launches, ' + F.d.rugged + ' rugs' + (F.d.bonded ? ', ' + F.d.bonded + ' bonded' : ''), F.d.rugged / F.d.launched > .5 ? 'serial launcher, ' + F.d.rugged + '/' + F.d.launched + ' rugged 🚩' : 'his past coins were mostly ok']) : 'fresh dev wallet, no history') : 'no dev history i could find'],
    rugq: F => [F.rug ? 'it already rugged bro' : F.devSold && F.bund < 1 ? 'dev is out and no bundles left so a classic rug isn\'t really possible anymore' : 'risk is ' + (F.devPct > 5 || F.bund > 8 ? 'real' : 'there like every coin') + ', dev ' + (F.devSold ? 'sold' : 'has ' + F.devPct.toFixed(1) + '%') + ', bundles ' + F.bund.toFixed(1) + '%',
      'top 10 hold ' + F.top10.toFixed(0) + '%' + (F.top10 > 40 ? ' which is a lot' : ', not crazy')],
    bundleq: F => [F.bund > 0.5 ? pick(['bundles still hold ' + F.bund.toFixed(1) + '%', F.bund.toFixed(1) + '% in bundle wallets 🚩', 'yeah ' + F.bund.toFixed(1) + '% bundled']) : pick(['bundles already sold', 'no bundles left that i can see', 'looks clean on bundles']),
      F.snip > 1 ? 'snipers hold ' + F.snip.toFixed(1) + '%' : 'snipers mostly out'],
    holdersq: F => [pick([F.holders + ' holders', F.holders + ' holders rn', 'holder count is ' + F.holders]), 'top 10 own ' + F.top10.toFixed(0) + '%' + (F.top10 > 45 ? ' 🚩' : F.top10 < 25 ? ', nice spread' : '')],
    mcq: F => [F.grad ? 'it bonded, trading on ' + F.dex.toLowerCase() + ' at ' + usd(F.mc) : 'mc ' + usd(F.mc) + ', bonding ' + F.prog.toFixed(0) + '%', pick(['last 5 min ' + pct(F.ch5), F.txns + ' txns so far', 'ath was ' + usd(F.ath)])],
    buyq: F => [F.rug ? 'its rugged, don\'t' : pumping(F) ? pick(['it\'s running ' + pct(F.ch5) + ' in 5 min, chasing is risky', 'you\'re buying a green candle, wait for a dip maybe']) : dumping(F) ? pick(['it\'s dipping ' + pct(F.ch5) + ', could be an entry or a falling knife', 'falling right now, i\'d wait for it to settle']) : pick(['at ' + usd(F.mc) + ' it\'s not crazy', usd(F.mc) + ' mc, small size if you ape', 'chart is calm at ' + usd(F.mc)]),
      F.grad ? 'already bonded so less rug risk' : 'only ' + F.prog.toFixed(0) + '% to bonding'],
    sellq: F => [F.my ? (F.my.pnl > 1 ? 'you\'re up ' + pct(F.my.pnl) + ', take your initial out at least' : F.my.pnl > 0 ? 'you\'re ' + pct(F.my.pnl) + ', your call' : 'you\'re ' + pct(F.my.pnl) + ', selling now locks the loss') : pick(['depends on your entry', 'take initials if you\'re up, that\'s the rule']), dumping(F) ? 'momentum is down rn' : pumping(F) ? 'momentum is still up' : 'chart is flat'],
    targetq: F => [F.rug ? 'target is zero, it rugged' : pick(['from ' + usd(F.mc) + '? ' + usd(F.mc * R(2, 6)) + ' if volume holds', F.grad ? 'it already bonded, next stop is ' + usd(F.mc * R(2, 4)) : 'bonding first, that\'s ~' + usd(Sim.solUsd * 410) + ' mc', 'honestly no one knows, ' + usd(F.mc) + ' now', 'ath ' + usd(F.ath) + ' is the first target']), pumping(F) ? 'volume is there' : 'needs more volume tho'],
    myposq: F => F.my ? ['your bag is worth ' + usd(F.my.val * Sim.solUsd) + ', ' + pct(F.my.pnl), F.my.pnl > 0 ? 'you\'re in profit' : 'you\'re underwater for now'] : ['you don\'t hold any ' + F.sym + ' tho', 'your wallet shows nothing in this'],
  };

  // stance flavor from position
  function stance(sp) { if (sp.role === 'dev') return 'dev'; if (sp.role === 'seller') return sp.pnl > 0.1 ? 'took' : 'burned'; if (sp.role === 'lurker') return 'watch'; return sp.pnl > 1 ? 'rich' : sp.pnl > 0.1 ? 'bull' : sp.pnl > -0.35 ? 'hold' : 'rekt'; }
  const TAIL = {
    dev: ['not going anywhere 🫡', 'building', 'trust the process', 'we\'re early'],
    rich: ['i\'m up ' + '{P}' + ' so i\'m chill', 'i\'m playing with house money', 'riding it'],
    bull: ['i\'m holding', 'not selling', 'still bullish', 'comfy'],
    hold: ['holding for now', 'i\'m in, nervous tho', 'we\'ll see', 'holding my bag'],
    rekt: ['i\'m down {P} so idk', 'pain', 'i\'m bagholding lol', 'can\'t sell this low'],
    took: ['i already took profit', 'sold mine at {X} gl', 'i\'m out but gl'],
    burned: ['sold at a loss, careful', 'i got out red', 'i\'m out, not worth it'],
    watch: ['just watching', 'not in yet', 'thinking about it', 'dyor']
  };
  function tail(sp) { const s = stance(sp); return pick(TAIL[s]).replace('{P}', pct(sp.pnl)).replace('{X}', sp.sold ? sp.sold.toFixed(1) + 'x' : ''); }
  const OPEN = ['', '', '', 'ngl ', 'honestly ', 'bro ', 'ok so ', 'fr ', 'ser ', 'tbh ', 'lol ', 'look '];
  const AT = () => rnd() < .55 ? '@you ' : '';
  function join(parts) { return parts.filter(Boolean).join(pick([', ', '. ', ' — ', ', '])); }
  let USED = new Set(); // facts already said in this reply batch
  function take(a) { if (!a) return null; const f = a.filter(x => x && !USED.has(norm(x))); const x = f.length ? f[0] : null; if (x) USED.add(norm(x)); return x; }

  // a reply from one speaker to one parsed user message
  function replyLine(c, U, sp, i, F) {
    const st = stance(sp), ints = U.set, aimed = sp.named || sp.targeted;
    if (ints.has('insult') && (aimed || i === 0)) return roast(c, sp, F);
    if (ints.has('insult') && i > 0) return pick(['lmaooo he cooked you', 'ratio\'d', 'nah he\'s got a point tho', 'chat is getting heated 🍿', 'fight fight fight', 'both of y\'all chopped']);
    if (ints.has('praise') && !U.q) return praise(sp);
    if (ints.has('disagree') && aimed) return argue(c, sp, F);
    const rc = recall(c, sp, U, F); if (rc && (i === 0 || rnd() < .3)) return rc;
    // addressed directly
    if (U.at && sp.named) {
      if (ints.has('entryq') || ints.has('whoq')) return AT() + (sp.role === 'lurker' ? pick(['not in yet', 'i\'m not holding', 'zero, just watching']) : sp.role === 'seller' ? 'i sold at ' + (sp.sold ? sp.sold.toFixed(1) + 'x' : 'a loss') + ', out now' : 'got ' + sp.hold.toFixed(2) + '% of supply, ' + pct(sp.pnl) + (sp.e ? ' from ' + usd(sp.e * Sim.solUsd) : ''));
      if (U.q) return AT() + join([pick(['idk ser', 'my take:', 'honestly']), pick(ANSWER(c, ints, F) || [Sim.factLine(c)]), tail(sp)]);
      if (ints.has('insult')) return AT() + pick(['ok bud', 'relax lol', 'say it to my pnl', 'cope']);
      if (ints.has('bear')) return AT() + (st === 'rich' || st === 'bull' || st === 'dev' ? pick(['you\'re fudding because you sold', 'we\'ll see who\'s right', 'fud noted']) : pick(['yeah agreed', 'facts', 'you\'re not wrong']));
      return AT() + pick(['what\'s up', 'yeah?', 'talk to me', 'hm', 'say less']) + ' ' + tail(sp);
    }
    if (ints.has('bot')) return AT() + pick(['lmao not a bot, just poor', 'bot? i\'m literally bagholding this', 'if i was a bot i\'d have sold the top', 'i wish i was a bot, they make money', 'nah real degen here 😭', 'we\'re all bots on this blessed day']);
    if (ints.has('greet') && !U.q) return AT() + pick(['gm', 'gm ser', 'gm gm', 'yo', 'gm, ' + (pumping(F) ? 'chart woke up early' : dumping(F) ? 'rough morning for ' + F.sym : 'quiet in here'), 'gm. ' + F.sym + ' at ' + usd(F.mc), 'wsg']);
    if (ints.has('thanks')) return AT() + pick(['np', 'gl ser', 'anytime', 'no worries', '🤝', 'np, dyor tho', 'yw', 'all good', 'gl with the bag', 'np, don\'t ape your rent']);
    if (ints.has('insult') && !U.q) return pick(['ok bud', 'who hurt you lol', 'mods?', 'relax', 'rough day?', 'someone got rugged']);
    if (ints.has('myposq') && F.my) return AT() + join([pick(ANS.myposq(F)), st === 'watch' ? 'i can see your wallet in holders lol' : tail(sp)]);
    if (U.q || ints.has('devq') || ints.has('rugq') || ints.has('bundleq') || ints.has('holdersq') || ints.has('mcq')) {
      const a = ANSWER(c, ints, F);
      if (a) { const lead = pick(OPEN), f1 = take(a); if (!f1) return AT() + pick(['what they said', '^ this', 'yeah that', 'agree with above', 'can confirm']) + ', ' + tail(sp); const f2 = i === 0 && rnd() < .5 ? take(a) : null; return AT() + lead + join([f1, f2 || tail(sp)]); }
      if (ints.has('whoq')) return sp.role === 'lurker' ? pick(['not me, watching', 'not in yet']) : sp.role === 'seller' ? pick(['i was, sold', 'was in, out now']) : pick(['me, ' + pct(sp.pnl), 'i\'m in', 'holding ' + sp.hold.toFixed(1) + '%', 'yeah since ' + usd((sp.e || c.m0) * Sim.solUsd)]);
      return AT() + pick(['idk ser, ' + Sim.factLine(c), 'good question, ' + Sim.factLine(c), 'no clue, dyor', 'nobody knows lol', 'check the holders tab']);
    }
    if (ints.has('bull')) return (st === 'rich' || st === 'bull' || st === 'dev' || st === 'hold') ? AT() + pick(['LFG', 'we ride', 'facts', 'that\'s the spirit', (F.grad ? 'bonded, next stop ' + usd(F.mc * 3) : 'bonding ' + F.prog.toFixed(0) + '% let\'s finish it'), usd(F.mc) + ' is nothing', 'yessir']) + (rnd() < .4 ? ' ' + tail(sp) : '')
      : st === 'took' || st === 'burned' ? AT() + pick(['you said that at ' + usd(F.ath), 'hope so for your sake', 'gl, i\'m out']) : AT() + pick(['might ape then', 'convince me', 'you in?', 'what\'s your entry']);
    if (ints.has('bear')) return (st === 'rich' || st === 'bull' || st === 'dev') ? AT() + pick(['fud', 'then sell and leave', 'dev ' + (F.devSold ? 'is out already, nothing to rug' : 'still holds, relax'), 'top 10 at ' + F.top10.toFixed(0) + '%, it\'s fine', 'ok bear']) : (st === 'rekt' || st === 'burned') ? AT() + pick(['yeah i\'m down too', 'facts', 'should\'ve listened to you earlier', 'pain']) : AT() + pick(['why tho', 'source?', 'what happened?']);
    if (ints.has('joke')) return pick(['lmao', '😭', '💀💀', 'lol', 'real']) + (rnd() < .4 ? ' ' + tail(sp) : '');
    // something else entirely: react to the user's own words
    if (U.key) return AT() + pick([U.key + '? ', 'what about ' + U.key + ' ', 'idk about ' + U.key + ', ', U.key + ' lol ']) + pick(['anyway ' + Sim.factLine(c), tail(sp), 'chart says ' + (pumping(F) ? 'up' : dumping(F) ? 'down' : 'sideways')]);
    return AT() + pick(['true', 'hm', 'based', 'ok']) + ' ' + tail(sp);
  }
  // ================= voices: how each person talks (stable per username) =================
  const VOICES = ['trench', 'trench', 'trench', 'rot', 'rot', 'rot', 'larp', 'unc', 'kol', 'quiet'];
  function vOf(name) { let h = 7; for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) | 0; return VOICES[Math.abs(h) % VOICES.length]; }
  const SW = [
    [/\bhonestly\b/g, ['icl', 'ngl', 'lowkey', 'deadass']], [/\bngl\b/g, ['ngl', 'icl']], [/\breally\b/g, ['lowkey', 'hella', 'deadass']], [/\bfor real\b/g, ['fr', 'fr fr', 'ong']],
    [/\bbro\b/g, ['bro', 'twin', 'gng', 'lil bro', 'dawg']], [/\bser\b/g, ['ser', 'twin', 'gng', 'king']], [/\bnice\b/g, ['tuff', 'hard', 'clean']], [/\bvery\b/g, ['hella', 'mad']],
    [/\blol\b/g, ['lmao', '💀', 'lol', '😭']], [/\bi'?m holding\b/g, ['im locked in', 'diamond hands', 'not jeeting']], [/\bsold\b/g, ['sold', 'jeeted', 'dumped']], [/\bscared\b/g, ['crashing out']],
    [/\bpain\b/g, ['pain', 'it\'s so over', 'cooked']], [/\bbad\b/g, ['chopped', 'cooked', 'mid']], [/\bgood\b/g, ['tuff', 'hard', 'solid']], [/\bcareful\b/g, ['careful', 'watch out twin']], [/\bdyor\b/g, ['dyor', 'nfa dyor']]
  ];
  // tags carry a mood: + bullish, - bearish, 0 neutral (so nobody says "+1000 aura" while down 60%)
  const TAG = {
    trench: ['+lfg', '+we\'re so back', '0trenches never sleep', '+send it', '+runner fr', '0cto energy', '+no jeets allowed', '-cabal coin?', '0trench life', '+dev based', '-exit liquidity behavior', '-need a stimmy', '0tryna make it out the trenches', '-it\'s so over'],
    rot: ['0💀', '0fr', '0ong', '0no cap', '--1000 aura', '++1000 aura', '06 7', '0chat is this real', '-it\'s so over', '+we\'re so back', '+lock in', '0unc behavior', '-😭', '+tuff', '0icl', '-crash out incoming', '-cooked'],
    larp: ['0(sent from my lambo)', '0dinner in dubai rn', '0my 4th wallet up 40x', '0up 300 sol this week trust', '0just copped another rolex', '0private jet wifi is mid', '0already made it out the trenches', '0my driver is waiting'],
    unc: ['0back in 2021 we had real coins', '0unc has seen this movie', '0kids these days', '+unc approves', '0been here since doge', '0my knees hurt but i\'m holding'],
    kol: ['0NFA', '+🚀🚀', '+I CALLED THIS', '+my alpha group knew', '0DYOR', '+BIGGEST CALL OF THE WEEK'], quiet: []
  };
  const POS = /(🚀|📈|💎|\b(lfg|send|sending|pump|bull|up|green|moon|ath|bonded|holding|bought|ape|aped|w|tuff|respect|appreciate|twin|congrats|nice|based|ripping|runner|we ride)\b|\+\d)/i, NEG = /(📉|💀|\b(dump|dumped|rug|rugged|dead|down|red|rekt|cooked|over|sold|jeet|pain|bleed|careful|scam|cope|chopped|loss|out)\b|-\d)/i;
  function mood(t) { const p = POS.test(t), n = NEG.test(t); return p && !n ? '+' : n && !p ? '-' : '0'; }
  function voice(t, name) {
    const v = vOf(name); let s = String(t); if (v === 'quiet' || !s) return s;
    const k = v === 'rot' ? .7 : v === 'trench' ? .5 : v === 'larp' ? .45 : v === 'kol' ? .5 : .3;
    SW.forEach(([re, alts]) => { if (rnd() < k) s = s.replace(re, () => pick(alts)); });
    if (rnd() < k * .5 && TAG[v].length && s.length < 90) { const md = mood(s), ok = TAG[v].filter(x => x[0] === '0' || x[0] === md); const tg = ok.length ? pick(ok).slice(1) : ''; if (tg && s.toLowerCase().indexOf(tg.toLowerCase()) < 0) s = rnd() < .8 ? s + ' ' + tg : tg + ' ' + s; }
    if (v === 'kol' && rnd() < .45) s = s.toUpperCase();
    else if (v === 'unc' && rnd() < .5) s = s.charAt(0).toUpperCase() + s.slice(1) + (rnd() < .5 ? '.' : '...');
    return s;
  }
  B.voice = voice; B.voiceOf = vOf;
  function sty(line, st, name) { line = String(line).replace(/\s+/g, ' ').trim(); const vv = x => name == null ? x : voice(x, name); const m = line.match(/^(@\w+ )(.*)$/); return m ? m[1] + Sim.stylize(vv(m[2]), st) : Sim.stylize(vv(line), st); }

  // ================= long-term memory (survives app restarts) =================
  const MEMO = (() => { try { return JSON.parse(localStorage.getItem('gp_memo')) || {}; } catch (e) { return {}; } })();
  MEMO.msgs = MEMO.msgs || []; MEMO.bots = MEMO.bots || {}; MEMO.calls = MEMO.calls || [];
  let memoT = 0;
  function saveMemo() { clearTimeout(memoT); memoT = setTimeout(() => { const ks = Object.keys(MEMO.bots); if (ks.length > 90) ks.sort((a, b) => MEMO.bots[a].t - MEMO.bots[b].t).slice(0, ks.length - 90).forEach(k => delete MEMO.bots[k]); try { localStorage.setItem('gp_memo', JSON.stringify(MEMO)); } catch (e) { } }, 600); }
  function bot(u) { return MEMO.bots[u] || (MEMO.bots[u] = { beef: 0, love: 0, n: 0, said: [], t: Date.now() }); }
  function ago(t) { const s = (Date.now() - t) / 1000; return s < 90 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + 'h ago' : Math.round(s / 86400) + 'd ago'; }
  const INSULT_RE = INT.find(x => x[0] === 'insult')[1];
  // store what the user said, who it was aimed at, and any calls (bull/bear/rug) with the market cap at that moment
  B.remember = function (txt, c, where) {
    const U = understand(txt), F = c ? facts(c) : null;
    MEMO.msgs.push({ t: Date.now(), w: where || 'chat', sym: c ? c.sym : null, cid: c ? c.id : null, txt: String(txt).slice(0, 160), mc: F ? F.mc : null }); if (MEMO.msgs.length > 80) MEMO.msgs.shift();
    if (c && F) { const kind = U.set.has('rugq') && !U.q ? 'rug' : U.set.has('bull') && !U.q ? 'bull' : U.set.has('bear') && !U.q ? 'bear' : null; if (kind && !MEMO.calls.some(x => x.cid === c.id && x.kind === kind && Date.now() - x.t < 1800e3)) { MEMO.calls.push({ cid: c.id, sym: c.sym, kind, mc: F.mc, t: Date.now() }); if (MEMO.calls.length > 40) MEMO.calls.shift(); } }
    let tg = U.at ? [U.at] : []; if (!tg.length && c) { const m = mem(c); if (m.lastRep && Date.now() - m.lastRepT < 150e3) tg = m.lastRep.slice(0, 2); }
    tg.forEach(u => { const b = bot(u); b.n++; b.t = Date.now(); b.said.unshift({ t: Date.now(), txt: String(txt).slice(0, 100) }); b.said.length = Math.min(b.said.length, 6); if (U.set.has('insult')) b.beef = Math.min(6, b.beef + 1); if (U.set.has('praise') || U.set.has('thanks')) { b.love = Math.min(6, b.love + 1); b.beef = Math.max(0, b.beef - .5); } if (U.set.has('disagree') && !U.set.has('insult')) b.beef = Math.min(6, b.beef + .4); });
    saveMemo(); return tg;
  };
  B.rememberX = function (tw) { const cash = (String(tw.txt).match(/\$([A-Za-z0-9]{2,12})/) || [])[1], coin = cash ? Sim.list.find(c => c.sym.toLowerCase() === cash.toLowerCase()) : null; return B.remember(tw.txt, coin, 'x'); };
  function noteRepliers(c, sps) { const m = mem(c); m.lastRep = sps.map(s => s.u); m.lastRepT = Date.now(); sps.forEach(sp => { const b = MEMO.bots[sp.u]; if (b) { b.av = sp.av; b.h = sp.h; } else if (rnd() < .5) { const nb = bot(sp.u); nb.av = sp.av; nb.h = sp.h; } }); saveMemo(); }
  B.memo = MEMO;

  // callbacks to the past: grudges, friendships, old calls, repeated messages
  function recall(c, sp, U, F) {
    const b = MEMO.bots[sp.u];
    if (b && b.beef >= 4 && rnd() < .5) return pick(['not replying to you anymore 🔇', 'muted. -1000 aura', 'we\'re done talking twin', 'blocked in my heart fr']);
    if (b && b.beef >= 2 && rnd() < .6) { const ins = b.said.find(s => INSULT_RE.test(s.txt)); return AT() + pick(['oh it\'s you again 🙄', 'still crashing out from earlier?', 'lil bro back for round ' + (Math.round(b.beef) + 1), ins ? 'you said "' + ins.txt.slice(0, 40) + '" ' + ago(ins.t) + ' and now you want answers? 💀' : 'after how you talked to me earlier? nah', 'not you talking to me after earlier 💀', 'the opp is back']); }
    if (b && b.love >= 2 && rnd() < .5) return AT() + pick(['my twin is back 🫡', 'real one returns', 'gm to my favorite degen', 'you again, w human', 'ride or die is here']) + (rnd() < .5 ? ', ' + Sim.factLine(c) : '');
    const cl = MEMO.calls.filter(x => x.cid === c.id && Date.now() - x.t > 60e3).pop();
    if (cl && rnd() < .55) { const r = F.mc / cl.mc;
      if (cl.kind === 'bull') { if (F.rug) return AT() + pick(['you said this was sending ' + ago(cl.t) + ' and it rugged 💀', 'remember your call on this? yeah it rugged']); if (r < .6) return AT() + pick(['you said this was sending at ' + usd(cl.mc) + ' ' + ago(cl.t) + ', it\'s ' + usd(F.mc) + ' now 💀', 'remember calling this at ' + usd(cl.mc) + '? -1000 aura', 'your ' + usd(cl.mc) + ' call aged like milk']); if (r > 1.5) return AT() + pick(['ok you called this at ' + usd(cl.mc) + ' ' + ago(cl.t) + ', respect 🫡', 'you said send at ' + usd(cl.mc) + ' and it sent. aura +1000', 'caller of the century, ' + usd(cl.mc) + ' → ' + usd(F.mc)]); }
      if (cl.kind === 'bear' || cl.kind === 'rug') { if (F.rug) return AT() + pick(['you called the rug ' + ago(cl.t) + ' fr', 'you were right, it rugged. respect']); if (r > 1.5) return AT() + pick(['you said rug at ' + usd(cl.mc) + ' and it ' + r.toFixed(1) + 'x\'d lmao', 'fudded at ' + usd(cl.mc) + ', now ' + usd(F.mc) + '. chopped call', 'still waiting on that rug you promised ' + ago(cl.t)]); } }
    const oc = MEMO.calls.filter(x => x.cid !== c.id && x.kind === 'bull').pop();
    if (oc && rnd() < .2) { const o2 = Sim.list.find(x => x.id === oc.cid); if (o2) { const now = Sim.mcUsd(o2); if (o2.rug || now < oc.mc * .5) return AT() + pick(['aren\'t you the one who shilled $' + oc.sym + ' at ' + usd(oc.mc) + '? ' + (o2.rug ? 'it rugged' : 'it\'s ' + usd(now) + ' now') + ' 💀', 'last time you shilled $' + oc.sym + '... we remember']); if (now > oc.mc * 2) return AT() + pick(['you called $' + oc.sym + ' at ' + usd(oc.mc) + ', ngl i trust you now', 'the $' + oc.sym + ' caller is here 🫡']); } }
    const same = MEMO.msgs.slice(0, -1).reverse().find(m => norm(m.txt) === norm(U.t) && Date.now() - m.t > 20e3);
    if (same && rnd() < .7) return AT() + pick(['you said the exact same thing ' + ago(same.t), 'deja vu, you typed this ' + ago(same.t), 'broken record twin']);
    return null;
  }
  function roast(c, sp, F) {
    const my = F.my, o = [];
    if (my && my.pnl < -.2) o.push('says the guy down ' + pct(my.pnl) + ' on this 💀', 'you\'re ' + pct(my.pnl) + ' and talking? sit down');
    if (!my) o.push('you don\'t even hold this, why are you here', 'zero bag and all that talk');
    const j = (G.App && G.App.W && G.App.W.hist || []).find(h => h.id === c.id && h.side === 0); if (j) o.push('you jeeted this at ' + usd(j.mc) + ', relax', 'paper hands talking big');
    return AT() + pick(o.concat(['lil bro crashed out over a ' + usd(F.mc) + ' coin 💀', '-1000 aura for that', 'who let the exit liquidity talk', 'ratio + you jeeted the bottom', 'touch grass then come back', 'bro thinks he\'s the main character of the trenches', 'put the fries in the bag lil bro', 'not you aura farming in a pump.fun chat', 'keep crying, my bag is ' + (sp.pnl > 0 ? 'green' : 'still here'), 'imagine fudding a coin you can\'t afford', 'your pnl is chopped twin', 'that\'s crazy, anyway', 'typed that with your whole chest huh', 'npc dialogue', 'mad cause you missed the entry']));
  }
  function praise(sp) { const b = MEMO.bots[sp.u], loved = b && b.love >= 2; return AT() + pick(['appreciate you twin 🫡', 'real recognize real', 'w human', 'aura +1000 for that', 'you\'re one of the good ones', 'say less, love the energy', 'we ride together', 'glazing me rn but i\'ll take it', 'finally someone with taste'].concat(loved ? ['ride or die fr', 'my favorite person in this chat no cap'] : [])); }
  function argue(c, sp, F) { if (rnd() < .25) return AT() + pick(['aight fair', 'ok maybe you got a point', 'fair point twin', 'hm ok i see it']); return AT() + pick(['nah i\'m right, ' + Sim.factLine(c), 'check the chart, ' + (pumping(F) ? 'it\'s ripping' : dumping(F) ? 'it\'s bleeding' : 'it\'s flat') + '. cope', 'cope harder', 'bet. screenshot this', 'you\'ll see', 'say that again when it ' + (stance(sp) === 'bull' || stance(sp) === 'rich' ? 'sends' : 'dumps')]); }
  B.sty = sty;
  // fresh answer for the sim's own bot-to-bot Q&A
  const QMAP = { dev: 'devq', devhist: 'devq', bundle: 'bundleq', top: 'holdersq', late: 'buyq' };
  B.answerKey = function (c, key) { const k = QMAP[key]; if (!k) return null; const F = facts(c); const a = ANS[k](F); return fresh(() => pick(a) + (rnd() < .4 ? ', ' + pick(['dyor', 'check it yourself', 'not financial advice lol', 'just looked']) : '')); };
  function ANSWER(c, ints, F) {
    const order = ['rugq', 'devq', 'bundleq', 'holdersq', 'sellq', 'buyq', 'targetq', 'myposq', 'mcq'];
    for (const k of order) if (ints.has(k) && ANS[k]) return ANS[k](F);
    return null;
  }

  // ---------------- per-coin memory ----------------
  const MEM = new Map(); // coinId -> { asked: {intent: count}, last: t }
  function mem(c) { let m = MEM.get(c.id); if (!m) { m = { asked: {}, n: 0 }; MEM.set(c.id, m); } return m; }

  // local: who replies to the user, and what they say
  B.localCoinReplies = function (c, txt, tg) {
    const U = understand(txt), F = facts(c), M = mem(c); M.n++;
    const key = ANSWER(c, U.set, F) ? Array.from(U.set).sort().join(',') : null; const rep = key ? (M.asked[key] = (M.asked[key] || 0) + 1) : 0;
    let n = U.at ? 1 : U.q ? RI(1, 3) : (U.set.has('greet') || U.set.has('bot') || U.set.has('thanks')) ? RI(1, 2) : rnd() < .8 ? RI(1, 2) : 0; if (F.holders < 4) n = Math.min(n, 1);
    const sps = Sim.speakers(c, Math.max(1, n));
    if (U.at) { const named = c.cm.find(x => x.u.toLowerCase() === U.at.toLowerCase() && !x.you); if (named) { sps[0] = { u: named.u, av: named.av, h: named.h, st: null, hold: named.hold || 0, pnl: named.pnl || 0, role: named.dev ? 'dev' : named.sold ? 'seller' : named.hold > 0 ? 'holder' : 'lurker', sold: named.sold, named: true }; } else n = 0; }
    // replying in a thread: the bots you answered speak first
    if (!U.at && tg && tg.length) { tg.forEach((u, k) => { const prev = c.cm.find(x => x.u === u && !x.you); if (prev) { sps.splice(k, 0, { u, av: prev.av, h: prev.h, hold: prev.hold || 0, pnl: prev.pnl || 0, role: prev.dev ? 'dev' : prev.sold ? 'seller' : prev.hold > 0 ? 'holder' : 'lurker', sold: prev.sold, targeted: true }); n = Math.max(n, k + 1); } }); }
    // someone you have history with shows up
    if (!U.at && rnd() < .25) { const ks = Object.keys(MEMO.bots).filter(u => (MEMO.bots[u].beef >= 2 || MEMO.bots[u].love >= 2) && MEMO.bots[u].av && !sps.slice(0, n).some(s => s.u === u)); if (ks.length) { const u = pick(ks), b = MEMO.bots[u]; sps.splice(n, 0, { u, av: b.av, h: b.h, hold: 0, pnl: 0, role: 'lurker' }); n++; } }
    const out = []; USED = new Set();
    for (let i = 0; i < n; i++) {
      const sp = sps[i]; let line;
      if (rep > 1 && i === 0 && rnd() < .6) line = AT() + pick(['already answered that:', 'same as before:', 'scroll up ser,', 'asked and answered,', 'again?']) + ' ' + (ANSWER(c, U.set, F) || [''])[0];
      else line = fresh(() => replyLine(c, U, sp, i, F));
      out.push({ sp, txt: sty(line, sp.st, sp.u), delay: (i + 1) * R(1800, 5200) + String(line).length * 35 });
    }
    // sometimes a second wave: someone disagrees with the first reply
    if (out.length && !U.at && rnd() < .25 && F.holders > 6) { const a = out[0], sp2 = Sim.speakers(c, 1)[0]; const s1 = stance(a.sp), s2 = stance(sp2); if ((s1 === 'bull' || s1 === 'rich') !== (s2 === 'bull' || s2 === 'rich')) out.push({ sp: sp2, txt: sty('@' + a.sp.u + ' ' + fresh(() => pick(['nah ', 'disagree, ', 'lol no ', 'eh ']) + tail(sp2)), sp2.st, sp2.u), delay: out.length * 4200 + R(2000, 6000), rep: a.sp.u }); }
    if (out.length) noteRepliers(c, out.map(o => o.sp));
    return out;
  };

  // bot answering another bot's message (instead of empty "@x facts")
  B.botReplyTo = function (c, tg) {
    const U = understand(tg.txt), F = facts(c), sp = { role: tg.hold > 0 ? 'holder' : 'lurker', pnl: 0, hold: 0 };
    let line = null;
    if (U.q) { const a = ANSWER(c, U.set, F); line = a ? pick(a) : pick(['dyor', 'no idea', Sim.factLine(c)]); }
    else if (U.set.has('bear')) line = pick(['fud', 'relax', 'you sold didn\'t you', 'it\'s just a dip', 'agreed tbh', 'yeah looks heavy']);
    else if (U.set.has('bull')) line = pick(['we ride', 'facts', 'hope so', 'said that yesterday too', 'need volume first', 'lfg']);
    else if (tg.pnl != null && tg.pnl > 1) line = pick(['congrats on the ' + (1 + tg.pnl).toFixed(1) + 'x', 'share some', 'nice entry', 'take initials']);
    else if (tg.pnl != null && tg.pnl < -.4) line = pick(['same boat', 'it\'ll come back maybe', 'pain', 'average down?']);
    if (!line) return null;
    const t = '@' + tg.u + ' ' + line; return B.dup(t) ? null : t;
  };

  // ---------------- X (twitter) replies ----------------
  B.localXReply = function (tw, ctx) {
    ctx = ctx || {}; const U = understand(tw.txt), cash = (tw.txt.match(/\$([A-Za-z0-9]{2,12})/) || [])[1];
    const coin = cash ? Sim.list.find(c => c.sym.toLowerCase() === cash.toLowerCase()) : null, F = coin ? facts(coin) : null;
    const A = G.App, rep = A && A.W ? (A.W.rep || 0) : 0, img = tw.img, other = ctx.prev || [];
    return fresh(() => {
      if (ctx.to) { const b = MEMO.bots[ctx.to], F0 = coin ? F : null;
        if (U.set.has('insult')) return pick(['ratio + you\'re down bad', 'lil bro crashed out on the timeline 💀', '-1000 aura for that reply', 'quote tweeting this so everyone sees', 'typed that with your whole chest', 'who let the exit liquidity tweet', 'muted. go touch grass']);
        if (U.set.has('praise') || U.set.has('thanks')) return pick(['appreciate you twin 🫡', 'real recognize real', 'w mutual', 'aura +1000', 'you\'re one of the good ones']);
        if (b && b.beef >= 2) return pick(['oh you again 🙄', 'still mad from earlier?', 'not you replying after what you said ' + (b.said[1] ? ago(b.said[1].t) : 'earlier'), 'the opp is in my replies']);
        if (U.set.has('disagree')) return pick(['cope', 'bet, screenshot this', 'you\'ll see', 'aight fair maybe', 'we\'ll see who\'s right']);
        if (U.q) return pick(['idk twin', 'probably fr', 'depends on the chart', 'dyor but yes', 'ask me tomorrow']);
        return pick(['fair', 'nah', 'lol ok', 'we\'ll see', 'say less', 'true', 'cope', 'real', 'facts twin']); }
      { const cl = MEMO.calls.filter(x => x.kind === 'bull').pop(); if (cl && rnd() < .25) { const o = Sim.list.find(k => k.id === cl.cid); if (o) { const now = Sim.mcUsd(o); if (o.rug || now < cl.mc * .5) return pick(['this from the guy who shilled $' + cl.sym + ' at ' + usd(cl.mc) + '? 💀', 'remember $' + cl.sym + '? yeah']); if (now > cl.mc * 2) return pick(['you called $' + cl.sym + ' early ngl, i listen now', 'the $' + cl.sym + ' caller speaks 🫡']); } } }
      if (rep < -20 && rnd() < .3) return pick(['rugger 🚩', 'you rugged last time', 'not touching anything you launch', 'exit liquidity again?', 'remember $' + ((Sim.list.find(c => c.mine && c.rug) || {}).sym || 'your last coin') + '?']);
      if (img && tw.rented && rnd() < .45) return pick(['rented 💀', 'that\'s a hotel lobby lol', 'nice rental bro', 'larp detected', 'return it by 10am']);
      if (img && img.k === 'pnl' && img.d) { const d = img.d; return d.pn >= 0 ? pick(['+' + Math.round(d.pc) + '% on $' + d.sym + ' 👀 entry?', 'screenshot or it didn\'t happen', 'pnl card larp detected', 'teach me twin', 'W, now take initials', 'aura +1000', 'you sold the top or nah?']) : pick(['respect for posting the L', 'down bad but honest 🫡', 'paid tuition fr', 'we all been there', 'buy high sell low speedrun 💀', '-1000 aura but real']); }
      if (img && img.k === 'biz' && G.Biz) { const x = G.Biz.BY[img.id]; if (x) { const t = G.Biz.T[x.type]; return pick(['a ' + t.l.toLowerCase() + '?? actual real yield', 'business owner arc 🏪', 'how much does it clear a month', 'smart, cash flow > memes', x.place + ' is a good market for that', 'the ' + t.l.toLowerCase() + ' grind is real', 'buying businesses with memecoin money is peak', 'do you even work there lol', 'what multiple did you pay']); } }
      if (img && img.k !== 'biz' && img.k !== 'pnl') { const m = img.k === 'car' ? G.Art.CAR_BY[img.id] : G.Art.HOUSE_BY[img.id]; if (m) return pick(['the ' + m.name + '?? congrats king', m.name + ' is crazy', '$' + fK(m.usd) + ' off memecoins lmao', img.k === 'car' ? 'what\'s the 0-60' : 'view must be insane', 'which coin paid for this', 'goals', 'teach me ser', img.k === 'house' && m.place ? m.place + ' life hits different' : 'clean spec']); }
      if (coin && F) {
        if (F.rug) return pick(['$' + coin.sym + ' rugged tho', 'that one rugged ser', 'bro $' + coin.sym + ' is dead']);
        if (Sim.isMine(coin) && rep < -20) return pick(['you rugged last time 🚩', 'not touching your coin', 'exit liquidity again?']);
        return pick(['$' + coin.sym + ' at ' + usd(F.mc) + ' 👀', 'aping $' + coin.sym, 'chart is ' + (pumping(F) ? 'ripping' : dumping(F) ? 'bleeding' : 'ok'), F.holders + ' holders on $' + coin.sym + ' already', 'dev still holds ' + F.devPct.toFixed(1) + '%?', (F.grad ? 'bonded and still running' : 'bonding ' + F.prog.toFixed(0) + '% lfg'), 'top 10 at ' + F.top10.toFixed(0) + '% careful', 'ca?', 'bundled?']);
      }
      if (U.set.has('greet')) return pick(['gm', 'gm king', 'gm ser', 'gm, coffee and charts', 'gm gm']);
      if (U.q) return pick(['depends on the chart', 'probably yes', 'no lol', 'nobody knows', 'dyor but yes', 'ask me tomorrow']);
      if (U.set.has('bear')) return pick(['bearish take', 'you sold the bottom didn\'t you', 'agreed', 'the trenches are always cooked until they aren\'t']);
      if (U.set.has('bull')) return pick(['LFG', 'bullish', 'we are so back', 'wagmi', 'real', 'this']);
      if (U.key) return pick([U.key + ' is underrated', 'thoughts on ' + U.key + '?', 'say more about ' + U.key, U.key + ' szn']);
      return pick(['real', 'this', 'based', 'ok and?', 'facts', '🔥', 'who asked lol', 'ratio']);
    });
  };

  // ======================= optional AI =======================
  const AI = B.ai = {};
  const LS = { get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
  const DEF = { prov: 'off', key: '', model: '', base: '', replies: true, chatter: true, cap: 300 };
  AI.cfg = () => Object.assign({}, DEF, LS.get('gp_ai') || {});
  AI.save = o => { LS.set('gp_ai', Object.assign(AI.cfg(), o)); };
  AI.usage = () => { const u = LS.get('gp_ai_use') || {}; const d = new Date().toISOString().slice(0, 10); return u.d === d ? u : { d, n: 0, err: 0 }; };
  function bump(err) { const u = AI.usage(); u.n++; if (err) u.err++; LS.set('gp_ai_use', u); }
  AI.enabled = () => { const C = AI.cfg(); return C.prov !== 'off' && !!C.key && AI.usage().n < C.cap; };
  AI.status = 'off'; AI.lastErr = ''; let busy = false, lastCall = 0, cool = 0;
  const PROV = {
    groq: { base: 'https://api.groq.com/openai/v1', pref: ['llama-3.3-70b', 'gpt-oss-120b', 'llama-4-maverick', 'qwen3', 'gpt-oss-20b', 'llama-4-scout', 'llama-3.1-8b'] },
    openrouter: { base: 'https://openrouter.ai/api/v1', pref: ['llama-3.3-70b', 'gemma', 'qwen', 'nemotron', 'mistral', 'deepseek', 'llama'] },
    gemini: { base: 'https://generativelanguage.googleapis.com/v1beta', pref: ['flash-lite', 'flash'] },
    custom: { base: '', pref: [] }
  };
  const BAD = /whisper|tts|guard|embed|audio|image|vision-only|transcribe|playai|orpheus|moderation|live|veo|imagen|lyria|robotics|computer|native/i;
  async function getJSON(url, opt) { const r = await fetch(url, opt); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { } if (!r.ok) { const msg = (j && (j.error && (j.error.message || j.error))) || t.slice(0, 160) || ('HTTP ' + r.status); const e = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)); e.status = r.status; throw e; } return j; }
  AI.pickModel = async function () {
    const C = AI.cfg(); if (C.model) return C.model;
    const P = PROV[C.prov]; let ids = [];
    if (C.prov === 'gemini') { const j = await getJSON(P.base + '/models?pageSize=200&key=' + encodeURIComponent(C.key)); ids = (j.models || []).filter(m => (m.supportedGenerationMethods || []).indexOf('generateContent') >= 0).map(m => m.name.replace(/^models\//, '')).filter(n => /gemini/.test(n) && /flash/.test(n) && !BAD.test(n) && !/preview-0|exp|thinking/.test(n)); ids.sort((a, b) => (parseFloat(b.match(/(\d+(\.\d+)?)/)[1]) - parseFloat(a.match(/(\d+(\.\d+)?)/)[1]))); }
    else { const base = C.prov === 'custom' ? C.base.replace(/\/$/, '') : P.base; const j = await getJSON(base + '/models', { headers: { Authorization: 'Bearer ' + C.key } }); ids = (j.data || []).map(m => m.id).filter(n => !BAD.test(n)); if (C.prov === 'openrouter') ids = ids.filter(n => /:free$/.test(n)); }
    if (!ids.length) throw new Error('No usable free chat model found for this key');
    for (const p of P.pref) { const hit = ids.find(n => n.toLowerCase().indexOf(p) >= 0); if (hit) { AI.save({ autoModel: hit }); return hit; } }
    AI.save({ autoModel: ids[0] }); return ids[0];
  };
  const SYS = 'You write chat for a memecoin trading SIMULATOR game (fake coins, no real money). You voice several different people in a pump.fun / Axiom style coin chat. ' +
    'They talk like real 2024-25 Solana trench degens and TikTok-era zoomers, NOT like customer support and NOT like a brand account. ' +
    'STYLE: lowercase, short (2-16 words), messy, little punctuation, abbreviations. Mix trench slang (jeet, jeeted, aped, bags, cabal, bundled, kol, cto, runner, exit liquidity, the trenches, made it out the trenches, stimmy, send it, dev based, dev sold, we\'re so back, it\'s so over) ' +
    'with tiktok slang (aura, -1000 aura, aura farming, chopped, cooked, crash out, glazing, twin, gng, lil bro, unc, ong, fr, icl, ngl, lowkey, no cap, 6 7, tuff, lock in, W, L, ratio, bro thinks, chat is this real, put the fries in the bag). 1-2 slang bits per message, not every word. ' +
    'Characters: some are larpers who flex fake wealth (lambo, dubai, "my 4th wallet up 40x"), some are uncs with 2021 stories, some are kols shilling in caps with NFA, most are regular trenchers. ' +
    'ATTITUDE: people have egos. If the user insults or disrespects someone, that person roasts back hard and clever (about their bags, pnl, aura, jeeting) and others may pile on or take sides. If the user is nice, they appreciate it and hype them. If the user disagrees, they argue with facts, sometimes they concede. ' +
    'Hard limits: no slurs, nothing about race, religion, gender or sexuality, no sexual content, no threats, no real people. ' +
    'MEMORY: you get what the user said before and how each person feels about them. Reference it naturally ("you said this was sending 2h ago 💀", "my twin is back 🫡", "still mad from earlier?"). Hold grudges, remember favors. ' +
    'FACTS: use only the numbers given, never invent numbers. If asked something, answer it with the facts. Never repeat a line from recent chat. ' +
    'Vibe examples: "dev still holds 4% icl im not worried" | "lil bro jeeted at 12k and came back to cry 💀" | "appreciate you twin 🫡" | "chat is this real or are we cooked" | "back in 2021 we had real coins, this is chopped" | "you said send at 40k its 9k now -1000 aura" | "MY ALPHA GROUP CALLED THIS 🚀 NFA". ' +
    'Never mention being an AI. No links, no hashtags. Reply with JSON only: {"replies":[{"u":"<username from the list>","t":"<message>"}]}';
  function memBlock(c, names) {
    const L = [], msgs = MEMO.msgs.slice(-9, -1).map(m => '- ' + ago(m.t) + (m.w === 'x' ? ' on X' : m.sym ? ' in $' + m.sym : '') + ': "' + m.txt + '"');
    if (msgs.length) L.push('WHAT THE USER SAID BEFORE:\n' + msgs.join('\n'));
    const calls = MEMO.calls.slice(-5).map(x => { const o = Sim.list.find(k => k.id === x.cid); return '- ' + x.kind + ' call on $' + x.sym + ' at ' + usd(x.mc) + ' ' + ago(x.t) + (o ? ', now ' + (o.rug ? 'RUGGED' : usd(Sim.mcUsd(o))) : ''); });
    if (calls.length) L.push('USER\'S CALLS:\n' + calls.join('\n'));
    const rel = (names || []).map(u => { const b = MEMO.bots[u]; if (!b || (!b.beef && !b.love && !b.said.length)) return null; return '- ' + u + ': ' + (b.beef >= 2 ? 'beef with the user (' + b.beef.toFixed(0) + '/6)' : b.love >= 2 ? 'likes the user (' + b.love.toFixed(0) + '/6)' : 'neutral') + (b.said[0] ? ', user told them "' + b.said[0].txt + '" ' + ago(b.said[0].t) : ''); }).filter(Boolean);
    if (rel.length) L.push('RELATIONSHIPS:\n' + rel.join('\n'));
    return L.length ? '\n' + L.join('\n') : '';
  }
  function voiceList(sps) { return sps.map(s => s.u + '=' + ({ trench: 'trencher', rot: 'tiktok zoomer', larp: 'larper', unc: 'unc', kol: 'kol', quiet: 'quiet type' })[vOf(s.u)]).join(', '); }
  function ctxBlock(c) {
    const F = facts(c), recent = c.cm.slice(0, 10).reverse().map(x => (x.you ? 'you' : x.u) + ': ' + x.txt).join('\n');
    return { F, text: 'COIN: ' + c.name + ' (' + F.sym + ')\nmarket cap ' + usd(F.mc) + ', ath ' + usd(F.ath) + ', change 1m ' + pct(F.ch1) + ', 5m ' + pct(F.ch5) + '\n' +
      (F.rug ? 'STATUS: RUGGED\n' : F.grad ? 'STATUS: bonded, trading on ' + F.dex + '\n' : 'STATUS: on bonding curve, ' + F.prog.toFixed(0) + '% to bonding\n') +
      'holders ' + F.holders + ', top10 ' + F.top10.toFixed(0) + '%, dev ' + (F.devSold ? 'sold everything' : 'holds ' + F.devPct.toFixed(1) + '%') + (F.mine ? ' (the dev is the user "you")' : '') + ', bundles ' + F.bund.toFixed(1) + '%, snipers ' + F.snip.toFixed(1) + '%' +
      (F.d ? ', dev history ' + F.d.launched + ' launches / ' + F.d.rugged + ' rugged / ' + F.d.bonded + ' bonded' : '') + '\n' +
      'user position: ' + (F.my ? 'holds ' + usd(F.my.val * Sim.solUsd) + ' worth, pnl ' + pct(F.my.pnl) : 'none') + '\nRECENT CHAT:\n' + (recent || '(empty)') };
  }
  function spList(sps) { return sps.map(s => s.u + ' (' + (s.role === 'lurker' ? 'not holding' : s.role === 'seller' ? 'sold at ' + pct(s.pnl) : s.role === 'dev' ? 'the dev' : 'holds ' + s.hold.toFixed(2) + '% supply, pnl ' + pct(s.pnl)) + ')').join(', '); }
  function clean(t) { return String(t || '').replace(/https?:\/\/\S+/g, '').replace(/#\w+/g, '').replace(/\b(as an ai|language model)\b.*$/i, '').replace(/\s+/g, ' ').trim().slice(0, 160); }
  function parse(txt) {
    if (!txt) return [];
    let s = String(txt).replace(/```(json)?/g, ''); const i = s.indexOf('{'), j = s.lastIndexOf('}');
    if (i >= 0 && j > i) { try { const o = JSON.parse(s.slice(i, j + 1)); const arr = o.replies || o.messages || o.chat || []; if (Array.isArray(arr)) return arr.map(x => ({ u: String(x.u || x.user || x.name || ''), t: clean(x.t || x.text || x.message) })).filter(x => x.t); } catch (e) { } }
    return s.split('\n').map(l => { const m = l.match(/^\s*[-*]?\s*@?(\w{2,20})\s*[:\-]\s*(.+)$/); return m ? { u: m[1], t: clean(m[2]) } : null; }).filter(Boolean);
  }
  async function call(user) {
    const C = AI.cfg(); if (!AI.enabled()) throw new Error('off');
    if (Date.now() < cool) throw new Error('cooling down');
    const wait = 2500 - (Date.now() - lastCall); if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastCall = Date.now();
    const model = await AI.pickModel(); let out = '';
    try {
      if (C.prov === 'gemini') {
        const body = { systemInstruction: { parts: [{ text: SYS }] }, contents: [{ role: 'user', parts: [{ text: user }] }], generationConfig: { temperature: 1.05, maxOutputTokens: 1200, responseMimeType: 'application/json' } };
        let j; try { j = await getJSON(PROV.gemini.base + '/models/' + model + ':generateContent?key=' + encodeURIComponent(C.key), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
        catch (e) { if (e.status !== 400) throw e; delete body.generationConfig.responseMimeType; j = await getJSON(PROV.gemini.base + '/models/' + model + ':generateContent?key=' + encodeURIComponent(C.key), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
        out = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(p => p.text || '').join('');
      } else {
        const base = C.prov === 'custom' ? C.base.replace(/\/$/, '') : PROV[C.prov].base;
        const body = { model, messages: [{ role: 'system', content: SYS }, { role: 'user', content: user }], temperature: 1.05, max_tokens: 700, response_format: { type: 'json_object' } };
        if (/gpt-oss/.test(model)) body.reasoning_effort = 'low';
        const h = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + C.key }; if (C.prov === 'openrouter') h['X-Title'] = 'Glasspad sim';
        let j; try { j = await getJSON(base + '/chat/completions', { method: 'POST', headers: h, body: JSON.stringify(body) }); }
        catch (e) { if (e.status !== 400 && e.status !== 422) throw e; delete body.response_format; delete body.reasoning_effort; j = await getJSON(base + '/chat/completions', { method: 'POST', headers: h, body: JSON.stringify(body) }); }
        out = (((j.choices || [])[0] || {}).message || {}).content || '';
      }
      bump(false); AI.status = 'ok'; AI.lastErr = '';
    } catch (e) {
      bump(true); AI.status = 'error'; AI.lastErr = String(e.message || e).slice(0, 140);
      if (e.status === 429) cool = Date.now() + 60000; if (e.status === 401 || e.status === 403) cool = Date.now() + 300000;
      if (e.status === 404) AI.save({ autoModel: '' });
      throw e;
    }
    return parse(out);
  }
  AI.test = async function () { AI.save({ autoModel: '' }); const m = await AI.pickModel(); const r = await call('COIN: TEST ($TEST)\nmarket cap $12K\nSPEAKERS: degen42 (holds 1.2% supply, pnl +40%)\nUSER said: "gm is this thing on?"\nWrite 1 reply to @you from degen42.'); return { model: m, sample: r[0] ? r[0].t : '(empty reply)' }; };

  // AI replies to the user in a coin chat
  async function aiCoinReplies(c, txt, tg) {
    const U = understand(txt); let n = U.at ? 1 : U.q ? RI(1, 3) : RI(1, 2);
    const sps = Sim.speakers(c, Math.max(2, n + 1));
    if (U.at) { const named = c.cm.find(x => x.u.toLowerCase() === U.at.toLowerCase() && !x.you); if (named) sps.unshift({ u: named.u, av: named.av, h: named.h, hold: named.hold || 0, pnl: named.pnl || 0, role: named.dev ? 'dev' : named.sold ? 'seller' : named.hold > 0 ? 'holder' : 'lurker', sold: named.sold }); }
    else if (tg && tg.length) tg.slice().reverse().forEach(u => { const prev = c.cm.find(x => x.u === u && !x.you); if (prev && !sps.some(s => s.u === u)) sps.unshift({ u, av: prev.av, h: prev.h, hold: prev.hold || 0, pnl: prev.pnl || 0, role: prev.dev ? 'dev' : prev.sold ? 'seller' : prev.hold > 0 ? 'holder' : 'lurker', sold: prev.sold }); });
    const X = ctxBlock(c);
    const prompt = X.text + memBlock(c, sps.map(s => s.u)) + '\nSPEAKERS: ' + spList(sps) + '\nVOICES: ' + voiceList(sps) + '\nUSER ("you") just said: "' + String(txt).slice(0, 200) + '"\n' + (U.at ? 'They are talking to ' + U.at + '. Only ' + U.at + ' replies.' : tg && tg.length ? 'They are replying to ' + tg.join(' and ') + ' (who answered them a moment ago). ' + tg[0] + ' answers first, then maybe someone else. Write ' + Math.max(n, 1) + ' replies.' : 'Write ' + n + ' replies to @you from different speakers (start with "@you " when answering directly).') + ' Keep it consistent with each speaker\'s position, voice and history with the user.';
    const arr = await call(prompt);
    return arr.slice(0, Math.max(1, n)).map((r, i) => { const sp = sps.find(s => s.u.toLowerCase() === r.u.toLowerCase().replace(/^@/, '')) || sps[i % sps.length]; return { sp, txt: r.t, delay: (i + 1) * R(1500, 4000) + r.t.length * 30, ai: true }; });
  }
  // AI background chatter while a coin is open
  async function aiChatter(c) {
    const sps = Sim.speakers(c, 5), X = ctxBlock(c);
    const prompt = X.text + '\nSPEAKERS: ' + spList(sps) + '\nVOICES: ' + voiceList(sps) + '\nWrite ' + RI(3, 5) + ' new chat messages from these speakers reacting to the current situation (price moves, dev, holders, each other). Some can reply to someone in recent chat with "@name ". Do not repeat recent chat.';
    const arr = await call(prompt);
    return arr.map((r, i) => { const sp = sps.find(s => s.u.toLowerCase() === r.u.toLowerCase().replace(/^@/, '')) || sps[i % sps.length]; return { sp, txt: r.t, delay: (i + 1) * R(3000, 9000), ai: true }; });
  }
  // AI replies under the user's tweet
  async function aiXReplies(tw, bots, n) {
    const cash = (tw.txt.match(/\$([A-Za-z0-9]{2,12})/) || [])[1], coin = cash ? Sim.list.find(c => c.sym.toLowerCase() === cash.toLowerCase()) : null;
    let ctx = 'You are now writing REPLIES ON X (twitter) to the user\'s post. Same rules, JSON format, "u" = handle from the list.\nUSER POST: "' + tw.txt + '"';
    if (tw.img && tw.img.k === 'biz' && G.Biz) { const x = G.Biz.BY[tw.img.id]; if (x) ctx += '\nThe post has a photo of a business they bought: ' + x.name + ', a ' + G.Biz.T[x.type].l + ' in ' + x.place + ' (asking $' + fK(x.price) + ', about $' + fK(x.sde - x.mgr) + '/yr cash flow)'; }
    else if (tw.img) { const m = tw.img.k === 'car' ? G.Art.CAR_BY[tw.img.id] : G.Art.HOUSE_BY[tw.img.id]; if (m) ctx += '\nThe post has a photo of their ' + (tw.img.k === 'car' ? 'car: ' : 'property: ') + m.name + ' ($' + fK(m.usd) + ')' + (tw.rented ? ' — it is actually a RENTAL, some people can tell' : ''); }
    if (coin) { const F = facts(coin); ctx += '\nThe coin $' + coin.sym + ': mc ' + usd(F.mc) + ', ' + (F.rug ? 'RUGGED' : F.grad ? 'bonded' : F.prog.toFixed(0) + '% bonding') + ', ' + F.holders + ' holders, dev ' + (F.devSold ? 'sold' : F.devPct.toFixed(1) + '%'); }
    const A = G.App; if (A && A.W && (A.W.rep || 0) < -20) ctx += '\nThe user rugged a coin before; some people remember.';
    ctx += memBlock(null, bots.map(b => b.h)) + '\nHANDLES: ' + bots.map(b => b.h).join(', ') + '\nVOICES: ' + bots.map(b => b.h + '=' + ({ trench: 'trencher', rot: 'tiktok zoomer', larp: 'larper', unc: 'unc', kol: 'kol', quiet: 'quiet type' })[vOf(b.h)]).join(', ') + (tw.to ? '\nThe user is replying directly to ' + tw.to + ', so ' + tw.to + ' answers first.' : '') + '\nWrite ' + n + ' different replies.';
    const arr = await call(ctx);
    return arr.slice(0, n).map((r, i) => ({ b: bots.find(b => b.h.toLowerCase() === r.u.toLowerCase().replace(/^@/, '')) || bots[i % bots.length], t: r.t }));
  }
  AI.xReplies = aiXReplies;

  // ---------------- hook into the sim ----------------
  const origUC = Sim.userComment;
  Sim.userComment = function (c, txt, holds) {
    const before = c.rq.length;
    const cm = origUC.call(Sim, c, txt, holds);
    c.rq.splice(before); // drop the old canned replies
    const tg = B.remember(txt, c, 'chat');
    const local = () => B.localCoinReplies(c, txt, tg).forEach(r => Sim.say(c, Sim.t + r.delay, r.sp, r.txt, r.rep || 'you'));
    const C = AI.cfg();
    if (AI.enabled() && C.replies && !busy) {
      busy = true; const t0 = Sim.t;
      aiCoinReplies(c, txt, tg).then(arr => { if (!arr.length) return local(); noteRepliers(c, arr.map(r => r.sp)); arr.forEach(r => { Sim.say(c, Math.max(Sim.t, t0) + r.delay, r.sp, sty(r.txt, r.sp.st, null), 'you'); c.rq[c.rq.length - 1].ai = true; }); })
        .catch(() => local()).finally(() => { busy = false; });
    } else local();
    return cm;
  };
  // background AI chatter for the coin you have open
  let chatT = 0;
  setInterval(() => {
    const C = AI.cfg(), A = G.App; if (!AI.enabled() || !C.chatter || busy || !A || !A.OPEN) return;
    const c = A.OPEN; if (!c || c.dead || Date.now() < chatT) return;
    chatT = Date.now() + R(40000, 70000); busy = true; const t0 = Sim.t;
    aiChatter(c).then(arr => arr.forEach(r => Sim.say(c, t0 + r.delay, r.sp, sty(r.txt, r.sp.st, null), null))).catch(() => { }).finally(() => busy = false);
  }, 5000);

  B.understand = understand; B.facts = facts; AI.call = call;
  G.Brain = B;
})(typeof window !== 'undefined' ? window : globalThis);
