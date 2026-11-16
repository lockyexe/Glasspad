/* Glasspad market simulator v2 — pump-style bonding curve, strategy bots, generated chat.
   Every coin launches from zero: no volume, no holders. Every trader and commenter is a bot. */
(function (G) {
  'use strict';
  const SUP = 1e9, V_SOL0 = 30, V_TOK0 = 1073000000, CURVE_TOK = 793100000, GRAD_SOL = 85;
  const MAX_COINS = 260;
  // seeded stream for the shared (multiplayer) market; Math.random when solo. Cosmetic text uses an isolated stream.
  let RS = Math.random;
  const rnd = () => RS();
  function sfc32(a, b, c, d) { return function () { a |= 0; b |= 0; c |= 0; d |= 0; const t = (a + b | 0) + d | 0; d = d + 1 | 0; a = b ^ b >>> 9; b = c + (c << 3) | 0; c = (c << 21 | c >>> 11); c = c + t | 0; return (t >>> 0) / 4294967296; }; }
  function cbk(f, ...a) { const p = RS; RS = Math.random; try { return f(...a); } catch (e) { } finally { RS = p; } }
  function iso(f) { return function () { const p = RS; RS = Math.random; try { return f.apply(this, arguments); } finally { RS = p; } }; }
  const R = (a, b) => a + rnd() * (b - a);
  const RI = (a, b) => Math.floor(a + rnd() * (b - a + 1));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const pick = a => a[Math.floor(rnd() * a.length)];
  function gauss() { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v); }
  function poisson(l) {
    if (l <= 0) return 0;
    if (l > 20) return Math.max(0, Math.round(l + Math.sqrt(l) * gauss()));
    const L = Math.exp(-l); let k = 0, p = 1;
    do { k++; p *= rnd(); } while (p > L);
    return k - 1;
  }
  function wpick(ws) { let t = 0; for (const w of ws) t += w[1]; let r = rnd() * t; for (const w of ws) { r -= w[1]; if (r <= 0) return w[0]; } return ws[0][0]; }
  const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  function addr(n, suf) { n = n || 44; let s = ''; for (let i = 0; i < n; i++) s += B58[Math.floor(rnd() * 58)]; return suf ? s.slice(0, n - suf.length) + suf : s; }
  function fK(n) { const a = Math.abs(n); return a >= 1e9 ? (a / 1e9).toFixed(1) + 'B' : a >= 1e6 ? (a / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (a / 1e3).toFixed(0) + 'K' : a.toFixed(0); }

  const A = ['Baby', 'Turbo', 'Based', 'Giga', 'Mini', 'Super', 'Dark', 'Golden', 'Lil', 'Sir', 'Mega', 'Ultra', 'Cyber', 'Moon', 'Space', 'Chad', 'Sad', 'Happy', 'Angry', 'Smol', 'Big', 'Fat', 'Rich', 'Broke', 'Retro', 'Neon', 'Holy', 'Wild', 'Sleepy', 'Crazy', 'Quantum', 'Pixel', 'Laser', 'Diamond'];
  const N = ['Pepe', 'Doge', 'Cat', 'Frog', 'Hamster', 'Penguin', 'Monkey', 'Shiba', 'Bonk', 'Wojak', 'Goat', 'Duck', 'Otter', 'Panda', 'Fox', 'Owl', 'Bear', 'Bull', 'Whale', 'Shark', 'Dragon', 'Tiger', 'Hippo', 'Capybara', 'Sloth', 'Koala', 'Raccoon', 'Llama', 'Corgi', 'Pug', 'Toad', 'Snail', 'Crab', 'Bird', 'Goose', 'Banana', 'Pizza', 'Taco', 'Sushi', 'Rocket', 'Wizard', 'Ninja', 'Robot', 'Alien', 'Ghost', 'Gremlin', 'Goblin', 'Gnome', 'Mochi', 'Noodle'];
  const Z = ['', '', '', '', 'Coin', 'Inu', 'AI', 'Wif Hat', 'On Sol', '2.0', 'Classic', 'King', 'Club', 'Cult', 'Army', 'Mania', 'Protocol'];
  const EM = ['🐸', '🐶', '🐱', '🐹', '🐧', '🐵', '🦊', '🦉', '🐻', '🐂', '🐋', '🦈', '🐉', '🐯', '🦛', '🦥', '🐨', '🦝', '🦙', '🐌', '🦀', '🐦', '🍌', '🍕', '🌮', '🍣', '🚀', '🧙', '🥷', '🤖', '👽', '👻', '💎', '🔥', '🌙', '⚡', '🎩', '👑', '🍄', '🧠'];
  function genName() {
    const n = pick(N);
    const name = ((rnd() < .55 ? pick(A) + ' ' : '') + n + (rnd() < .35 ? ' ' + pick(Z) : '')).trim();
    let sym; const r = rnd();
    if (r < .4) sym = name.replace(/[^A-Za-z]/g, '').slice(0, RI(3, 6));
    else if (r < .7) sym = name.split(' ').map(w => w[0]).join('') + n.slice(0, 2);
    else sym = n.slice(0, RI(3, 5)) + (rnd() < .3 ? RI(1, 99) : '');
    return { name, sym: sym.toUpperCase().slice(0, 10), emoji: pick(EM) };
  }

  // ---------- chat generator ----------
  const U1 = ['degen', 'sol', 'ape', 'chad', 'moon', 'pepe', 'based', 'wagmi', 'gm', 'anon', 'whale', 'pump', 'jeet', 'diamond', 'paper', 'send', 'bag', 'alpha', 'sigma', 'giga', 'frog', 'doge', 'crypto', 'memelord', 'rekt', 'hodl', 'lambo', 'fomo', 'ser', 'fren', 'bonk', 'cope', 'nft', 'chart', 'candle'];
  const U2 = ['king', 'lord', 'hunter', 'maxi', 'boy', 'girl', 'guy', 'enjoyer', 'sniper', 'trader', 'farmer', 'bro', 'wizard', 'monk', 'cat', 'dog', '99', '420', '69', 'x', '_sol', '777', '_', 'god', 'andy'];
  const uname = () => { let s = pick(U1) + (rnd() < .6 ? pick(U2) : ''); if (rnd() < .45) s += RI(1, 999); return s.slice(0, 16); };
  const AVE = ['🐸', '🐶', '🐱', '🦊', '🐵', '🐼', '🐯', '🦁', '🐻', '🐨', '🐷', '🐮', '🐧', '🦄', '👽', '🤖', '💀', '👻', '😈', '🤡', '🥷', '🧙', '🦍', '🐳', '🦈', '🐙', '🦋', '🌚', '😎', '🤑'];
  const CM = {
    launch: ['first', 'first 🚀', "who's early", 'dev doxx?', 'LFG', "ape'd {S} sol", 'chart looks clean so far', '{SYM} to 1M', 'wen tg', 'x link?', 'early af', 'dev bought {S}, hmm', 'bundled?', 'snipers already in lol', 'name is fire', 'this has potential', 'buying more', 'gm early gang', "don't fade {SYM}", '100x incoming', 'who made this lol', 'sniped it 😎'],
    pump: ['🚀🚀🚀', 'LFG {SYM}', 'told you', 'we going to {DEX}', 'send it', '{X} already lol', 'bonding soon', 'paper hands ngmi', 'just bought more', '{SYM} is the next big one', 'who sold at {MC} 😂', 'this chart 🤤', 'up only', '{MC} → {BIG} easy', "i'm never selling", 'green candles only', 'KOLs are coming', 'where are the jeets', 'imagine not being in this', 'parabolic', 'should i take profit?', 'sold half, riding the rest'],
    dump: ['dev sold?', 'why is it dumping', 'buy the dip', 'shakeout before the send', 'hold the line', "it's over", 'who is selling??', 'jeets everywhere', 'dip = gift', "i'm down {P}% 😭", 'support at {MC}?', 'just a healthy pullback', 'bagholders unite', "i knew i should've sold", 'chart is cooked', 'stop selling guys', 'big wallet dumping', 'weak hands out 💪', 'averaged down', 'pain', 'red candle 😬', 'snipers took profit'],
    rug: ['RUGGED', 'dev rugged lmao', 'scam', 'reported', 'i lost {S} sol', 'never again', 'classic', 'dev sold everything 💀', 'bundles dumped', 'who could have seen this coming', 'rip', 'check the holders next time', 'another one', 'lol {P}% down', 'ofc it rugged', '💀💀💀', 'dev wallet was 8% 🙃', 'lesson learned'],
    mig: ['BONDED!!', 'we made it 🎓', '{DEX} lets go', 'post-bond dump incoming, careful', 'dexscreener paid?', 'trending soon', 'migration pump incoming', '{MC} and climbing', "now it's real", 'congrats holders', 'next stop {BIG}', 'curve complete 🎉'],
    dead: ['anyone still here?', 'dead coin', 'gm', 'dev?', 'cto?', "it's so over", 'is this alive', 'holding forever i guess', 'zero volume lol', 'ghost town', 'f'],
    mid: ['gm', "who's the dev", 'any tg?', 'chart?', 'this is the one', 'bullish', 'not selling', '{SYM} community strong', '{MC} is cheap', 'accumulating', 'what do you think', 'dyor', "nfa but i'm in", 'just vibes', 'looks like consolidation', 'volume picking up?', "i'm staying", 'we need a meme', 'raid time', 'holders growing', 'top 10 holders look ok', 'sideways for now'],
    whale: ['whale just aped 🐋', 'who bought {S} sol??', 'big buy!', 'someone knows something', 'whale alert', 'that buy 👀'],
    kol: ['KOL just called it 📣', 'saw this on X', 'here from the call', 'influencer bought', 'copy traders incoming', 'the call is in', 'lfg after that tweet'],
    kolsell: ['KOL dumped on us', 'called it then sold lmao', 'classic KOL exit liquidity', 'influencer sold already', 'we are exit liquidity 💀'],
    reply: ['@{U} facts', '@{U} ngmi', '@{U} based', '@{U} who asked', '@{U} this', '@{U} cope', '@{U} ser 🤝', '@{U} trust', '@{U} fud', '@{U} same', '@{U} lol', '@{U} so true', '@{U} wagmi', '@{U} you sold?', '@{U} 💯']
  };
  const RE_YOU = {
    neg: ['@you fud', '@you no it\'s not', '@you then sell', '@you 👀', '@you jeet behavior', '@you ok bear'],
    pos: ['@you LFG', '@you wagmi', '@you 🚀🚀', '@you we ride', '@you based', '@you ser 🤝'],
    q: ['@you dyor', '@you nfa', '@you yes', '@you idk ser', '@you check the chart', '@you probably'],
    any: ['@you facts', '@you who asked lol', '@you based', '@you true', '@you 💯', '@you gm', '@you ngmi', '@you same']
  };
  const ERA_CM = {
    prime: ['trenches are printing rn', 'AI agent szn', 'this is the next fartcoin', 'send it to raydium', 'the whole timeline is aping', 'everyone is a millionaire this week', 'buying a lambo off this', 'meme szn never ends', 'new ATHs everywhere', 'gm from dubai'],
    now: ['trenches are cooked rn', 'liquidity is so thin lately', 'another bundled launch smh', 'volume is fake probably', 'at least something is moving', 'pumpswap migration soon?', '1% bond rate and we made it lol', 'everyone left for perps', 'quiet market, early again']
  };
  const OPEN = ['ngl', 'honestly', 'bro', 'yo', 'ok', 'lol', 'fr', 'lowkey', 'guys', 'chat', 'real talk', 'wait', ''];
  const CLOSE = ['', '', '', 'fr', 'ngl', 'lol', '😭', '🚀', '💀', '🤝', '👀', '🔥', 'tbh', 'no cap', 'trust'];
  const EMO = ['🚀', '🔥', '💀', '😭', '👀', '💎', '🐸', '📈', '🤡', '🫡', '😤', '🙏'];
  function typo(s) {
    if (s.length < 5) return s;
    const i = RI(1, s.length - 2), r = rnd();
    if (r < .4) return s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2);
    if (r < .7) return s.slice(0, i) + s.slice(i + 1);
    return s.slice(0, i) + s[i] + s.slice(i);
  }
  function factLine(c, mood) {
    const hk = c.hk.length, m = '$' + fK(Sim.mcUsd(c)), prog = Sim.progress(c).toFixed(0);
    const devB = c.mine ? c.mineTok || 0 : (c.holders.get(c.dev) || 0), dp = (devB / SUP * 100).toFixed(1);
    const last = c.trades[0];
    const f = [
      hk + ' holders already', hk + ' holders and climbing', 'bonding at ' + prog + '%', m + ' mc is still early', 'mc ' + m + ' with ' + fK(c.buys + c.sells) + ' txns',
      devB > 0 ? 'dev still holds ' + dp + '% careful' : 'dev sold everything already', c.bundles.length ? c.bundles.length + ' bundle wallets in top holders 🚩' : 'no bundles i checked',
      last && last.s && last.sol > 2 ? 'who just bought ' + last.sol.toFixed(1) + ' sol 👀' : 'chart cooling off',
      last && !last.s && last.sol > 2 ? 'someone just dumped ' + last.sol.toFixed(1) + ' sol 😤' : 'holding strong'
    ];
    if (c.mine) f.push(Sim.rep < -20 ? 'this dev rugged before 🚩🚩' : 'dev is active on X at least', 'dev pls tweet', '@' + Sim.devName + ' burn the supply', c.burned ? 'dev burned ' + (c.burned * 100).toFixed(0) + '% respect' : 'is the dev legit?');
    return pick(f);
  }
  function compose(c, mood) {
    let t;
    const r = rnd();
    if (r < 0.5) t = pick(CM[mood] || CM.mid);
    else if (r < 0.72) t = (pick(OPEN) + ' ' + pick(CM[mood] || CM.mid) + ' ' + pick(CLOSE)).trim();
    else if (r < 0.9 || mood === 'dead') t = factLine(c, mood);
    else t = pick(ERA_CM[Sim.era] || ERA_CM.now);
    t = fillT(c, t);
    if (rnd() < 0.6) t = t.toLowerCase();
    if ((mood === 'pump' || mood === 'rug' || mood === 'mig') && rnd() < 0.12) t = t.toUpperCase();
    if (rnd() < 0.08) t = typo(t);
    if (rnd() < 0.22) { const e = pick(EMO); t += ' ' + (rnd() < .3 ? e + e + e : e); }
    return t;
  }
  let cmId = 0;
  function fillT(c, s) {
    return s.replace(/\{SYM\}/g, '$' + c.sym).replace(/\{S\}/g, R(0.1, 5).toFixed(1)).replace(/\{MC\}/g, '$' + fK(Sim.mcUsd(c)))
      .replace(/\{DEX\}/g, Sim.dex().toLowerCase()).replace(/\{BIG\}/g, pick(['1M', '10M', '100M', '1B'])).replace(/\{X\}/g, (Sim.mc(c) / c.m0).toFixed(1) + 'x').replace(/\{P\}/g, RI(30, 95));
  }
  // ---------- comment engine: authored by real wallets with real positions ----------
  const HTX = {
    moon: ['up {X} lfg', 'bought at {E} 😎', '{X} and not selling', 'told yall at {E}', '{X} on this ty dev', 'who else from {E}?', 'this paid my rent lol', '{X}... taking initials?', 'from {E} to {MC} 🤝'],
    up: ['+{P}% nice', 'taking initials soon', 'up {P}% holding', 'green is green', 'who is holding with me', 'comfy here', 'bought {E}, chilling'],
    down: ['down {P}% but holding', 'dev pls', 'buying more down here', "it's fine i'm fine", 'averaging down at {MC}', 'where are the buyers', 'bought the top at {E} 🤡'],
    rekt: ['-{P}% 💀', 'bagholding this to zero i guess', 'why did i ape at {E}', 'lesson learned', 'too small to sell lol', 'rip my {S} sol', 'never chasing again']
  };
  const TTX = { diamond: ['not selling till {BIG}', 'diamond hands 💎', 'never selling this'], paper: ['might sell soon tbh', 'gonna sell at {MC2}', 'scared money lol'], smart: ['accumulating', 'sized in', '👀'], kol: ['called this at {E} 📣', 'still holding from my call', 'my followers eating 🍽️'], sniper: ['ty for the liquidity', 'sniped at {E}'], momentum: ['volume looks real', 'riding the momentum', 'chart breaking out'], dip: ['bought the dip at {E}', 'dip bought, now we wait'], copy: ['saw the call, aped', 'following the kol on this'] };
  const DTX = { legit: ['dev here, not selling 🫡', 'building, site soon', 'burn coming if we hit {BIG}', 'thanks for the support fam', 'dev is here, ask anything'], serial: ['LFG 🚀🚀', 'dev here, locked in', 'not selling trust', 'community coin now 🤝', 'raid time'], farmer: ['dev here, raid time', 'we going to {BIG}', 'cto welcome'], newbie: ['first coin pls be nice', 'dev here, what should we do next?', 'how do i make a tg lol'] };
  const STX = { win: ['sold at {X} ty dev', 'took profits gl holders', 'out with {X}', 'scalped {X} gl', 'sold half at {X}'], loss: ['cut my losses', 'sold, this is cooked', 'out -{P}%', 'not worth it, sold'] };
  const QS = [['dev', ['is dev still holding?', 'dev wallet?', 'did dev sell?']], ['bundle', ['bundled?', 'is this bundled?', 'how many bundles?']], ['top', ['top holders ok?', 'anyone check holders?']], ['late', ['too late?', 'is it too late to ape?', 'still early?']], ['ca', ['ca?', 'whats the ca']], ['socials', ['socials?', 'tg?', 'x account?']], ['devhist', ['dev history?', 'anyone check the dev?', 'dev rugged before?']]];
  const SPAM = ['🚀 Join the #1 call group, 100x daily [link removed]', 'FREE AIRDROP for {SYM} holders, claim now [link removed]', 'need volume? we push any coin to 1M, DM me', '🔥 RAID NOW 🔥 [link removed]', 'dev check DM, we can get you trending', '{SYM} listed on our tracker, vote here [link removed]', 'best sniper bot on sol, 0.5% fee [link removed]'];
  const SPAMU = ['callz_vip', 'alpha_signals', 'pumpbot_pro', 'trend_maker', 'solcallsdaily', 'gem_hunter_bot', 'raid_central', 'volume_king'];
  function answer(c, key) {
    const S = Sim.stats(c), MCs = '$' + fK(Sim.mcUsd(c));
    switch (key) {
      case 'dev': return c.mine ? (S.dev > 0 ? 'dev holds ' + S.dev.toFixed(1) + '% and posts on X' : 'dev sold everything 🚩') : S.dev > 0 ? 'dev holds ' + S.dev.toFixed(1) + '% rn' : 'dev sold already 🚩';
      case 'bundle': return S.insiders > 0.5 ? 'bundles hold ' + S.insiders.toFixed(1) + '% 🚩' : c.bundles.length ? 'bundles already sold' : 'no bundles i checked, clean';
      case 'top': return 'top 10 hold ' + S.top10.toFixed(0) + '%' + (S.top10 > 40 ? ' 🚩' : ', looks ok');
      case 'late': { const ch = Sim.mc(c) / Sim.mcAgo(c, 60) - 1; return c.rug ? 'its rugged bro' : ch > 0.25 ? 'we just started 🚀' : ch < -0.2 ? 'ngl looks heavy rn' : MCs + ' mc is still early imo'; }
      case 'ca': return pick(['its on the page ser', 'scroll up', 'same as the ticker page lol']);
      case 'socials': return rnd() < .6 ? 'no socials 🚩' : 'tg in bio';
      case 'devhist': { const d = c.devP; if (!d) return c.mine ? (Sim.rep < -20 ? 'this dev rugged before 🚩' : 'dev seems legit so far') : 'fresh dev wallet'; return 'dev launched ' + d.launched + ' coins, ' + d.rugged + ' rugged' + (d.rugged / Math.max(1, d.launched) > .5 ? ' 🚩🚩' : d.bonded ? ', ' + d.bonded + ' bonded ✅' : ''); }
    }
    return 'idk';
  }
  function stylize(t, st) {
    st = st || { low: true, emo: .2, caps: .03, typo: .06, cat: null };
    if (st.low && rnd() < .85) t = t.toLowerCase();
    if (rnd() < st.caps) t = t.toUpperCase();
    if (rnd() < st.typo) t = typo(t);
    if (st.cat && rnd() < .3) t += ' ' + st.cat;
    if (rnd() < st.emo) { const e = pick(EMO); t += ' ' + (rnd() < .25 ? e + e + e : e); }
    return t;
  }
  function fillH(c, t, h, mult) {
    const pct = Math.abs(mult - 1) * 100;
    return fillT(c, t).replace(/\{E\}/g, '$' + fK((h ? h.e : c.m0) * Sim.solUsd)).replace(/\{X\}/g, mult.toFixed(mult >= 10 ? 0 : 1) + 'x').replace(/\{P\}/g, pct.toFixed(0)).replace(/\{MC2\}/g, '$' + fK(Sim.mcUsd(c) * R(1.5, 3)));
  }
  function authorOf(w, P) { return P ? { u: P.u, av: P.av, h: P.h, st: P.st } : { u: w.slice(0, 6).toLowerCase(), av: pick(AVE), h: RI(0, 359), st: null }; }
  function addComment(c, mood, o) {
    o = o || {};
    let au, txt, meta = {};
    if (o.txt != null) { au = o.you ? { u: o.u || 'you', av: o.av || '⭐', h: 220, st: { low: false, emo: 0, caps: 0, typo: 0 } } : authorOf(addr(), null); txt = o.txt; }
    else {
      const r = rnd(), age = (Sim.t - c.born) / 1000;
      const lastBig = c.trades.find(t => Sim.t - t.t < 12000 && t.sol > 2 && t.tag !== 'vol' && t.tag !== 'mev');
      const recentEv = c.events[0] && Sim.t - c.events[0].t < 20000 ? c.events[0] : null;
      let done = false;
      // 1) reactions to what just happened
      if (r < 0.14 && (lastBig || recentEv)) {
        if (recentEv && recentEv.icon === '👨‍💻') txt = pick(['dev sold?? 🚩', 'dev is selling wtf', 'dev jeeting lol', 'dev dumped on us']);
        else if (recentEv && recentEv.icon === '🎓') txt = pick(['BONDED', 'we on ' + Sim.dex().toLowerCase() + ' now', 'migration done 🎓']);
        else if (lastBig && lastBig.tag === 'smart' && lastBig.s) txt = pick(['smart wallet just bought 🧠', 'that 🧠 wallet is in, bullish']);
        else if (lastBig && lastBig.tag === 'boost') txt = 'boost buying 🚀';
        else if (lastBig) txt = lastBig.s ? pick(['who bought ' + lastBig.sol.toFixed(1) + ' sol 👀', 'big buy just came in', lastBig.sol.toFixed(1) + ' sol buy lfg']) : pick(['someone dumped ' + lastBig.sol.toFixed(1) + ' sol 😤', 'who is selling', 'big sell, relax']);
        if (txt) { au = authorOf(addr(), null); const H = holderPick(c); if (H) { au = authorOf(H.w, H.P); meta = holderMeta(c, H); } done = true; }
      }
      // 2) a real holder talking about their own position
      if (!done && r < 0.72) {
        const H = holderPick(c);
        if (H) {
          au = authorOf(H.w, H.P); meta = holderMeta(c, H);
          const mult = H.h ? Sim.mc(c) / H.h.e : 1;
          if (H.ty === 'dev' && c.devP) txt = fillH(c, pick(DTX[c.devP.style]), H.h, mult), meta.dev = true;
          else if (TTX[H.ty] && rnd() < 0.3) txt = fillH(c, pick(TTX[H.ty]), H.h, mult);
          else if (c.rug && rnd() < .7) txt = pick(CM.rug);
          else { const band = mult > 2.5 ? 'moon' : mult > 1.15 ? 'up' : mult > 0.75 ? null : mult > 0.35 ? 'down' : 'rekt'; txt = band ? fillH(c, pick(HTX[band]), H.h, mult) : compose(c, mood); }
          done = true;
        }
      }
      // 3) someone who just sold
      if (!done && r < 0.82 && c.exits.length) {
        const X = c.exits[Math.floor(rnd() * Math.min(8, c.exits.length))], P = Sim.PW.get(X.w);
        if (!P || (P.ty !== 'sniper' && P.ty !== 'bot')) { au = authorOf(X.w, P); txt = fillH(c, pick(X.mult >= 1.15 ? STX.win : STX.loss), null, X.mult); meta = { sold: X.mult }; done = true; }
      }
      // 4) a non-holder asking something; a holder answers with real stats a few seconds later
      if (!done && r < 0.92) {
        const q = pick(QS); au = authorOf(addr(), null); txt = pick(q[1]); meta = { hold: 0 };
        c.rq.push({ at: Sim.t + R(2000, 9000), ans: q[0], to: au.u });
        done = true;
      }
      // 5) spam bots
      if (!done && r < 0.965) { au = { u: pick(SPAMU) + RI(1, 99), av: '🤖', h: 200, st: { low: false, emo: 0, caps: 0, typo: 0 } }; txt = fillT(c, pick(SPAM)); meta = { spam: true }; done = true; }
      // 6) general chatter
      if (!done) { au = authorOf(addr(), null); txt = compose(c, mood); if (rnd() < .2 && c.cm.length) { const tg = pick(c.cm.slice(0, 6)); if (!tg.spam && tg.u !== au.u) { const rr = G.Brain && G.Brain.botReplyTo(c, tg); meta.rep = tg.u; txt = rr || pick(CM.reply).replace('{U}', tg.u); } } }
      if (!meta.spam) txt = stylize(G.Brain ? G.Brain.voice(txt, au.u) : txt, au.st);
      if (G.Brain && !meta.spam) { if (G.Brain.dup(txt) && (o._r || 0) < 6) return addComment(c, mood, Object.assign({}, o, { _r: (o._r || 0) + 1 })); }
    }
    const cm = {
      id: ++cmId, t: Sim.t, u: au.u, av: au.av, h: au.h, txt: fillT(c, txt),
      lk: o.lk != null ? o.lk : (rnd() < .3 ? RI(0, 3) : 0), lr: meta.spam ? 0 : rnd() * 0.06 + (mood === 'pump' || mood === 'rug' || mood === 'mig' ? 0.05 : 0.008),
      hold: o.hold != null ? (o.hold === true ? 0.01 : o.hold || 0) : (meta.hold || 0), pnl: meta.pnl != null ? meta.pnl : null, sold: meta.sold || null, dev: !!meta.dev, spam: !!meta.spam, ty: meta.ty || null, rep: o.rep || meta.rep || null, you: !!o.you
    };
    if (G.Brain && !o.you) G.Brain.mark(cm.txt);
    c.cm.unshift(cm); if (c.cm.length > 80) c.cm.length = 80; c.cmN++;
    return cm;
  }
  function holderPick(c) {
    for (let k = 0; k < 8 && c.hk.length; k++) {
      const w = c.hk[Math.floor(rnd() * c.hk.length)], h = c.hi.get(w), ty = h ? h.ty : 'retail';
      if (ty === 'mev' || ty === 'bot' || ty === 'bundle' || ty === 'vol' || ty === 'dust' || ty === 'cabal') continue;
      if ((ty === 'sniper' || ty === 'whale' || ty === 'smart') && rnd() < 0.8) continue; // big players rarely talk
      return { w, h, ty, P: Sim.PW.get(w) };
    }
    return null;
  }
  function holderMeta(c, H) { const bal = c.holders.get(H.w) || 0; return { hold: bal / SUP * 100, pnl: H.h ? Sim.mc(c) / H.h.e - 1 : 0, ty: H.ty }; }
  function burst(c, mood, n) { for (let i = 0; i < n; i++) addComment(c, mood); }
  function moodOf(c, age) {
    if (c.rug) return 'rug';
    if (c.grad && Sim.t - c.gradAt < 90000) return 'mig';
    if (age < 45) return 'launch';
    const ch = Sim.mc(c) / Sim.mcAgo(c, 60) - 1;
    if (ch > 0.25) return 'pump';
    if (ch < -0.2) return 'dump';
    if (c.hype < 0.06 && age > 180) return 'dead';
    return 'mid';
  }

  // Era presets, calibrated from pump.fun data:
  //  prime (Nov 2024 – Jan 2025): record ~71.7k launches/day, ~1.6% graduation, record fees
  //  now   (2026): ~37k launches/day, 0.3–1.8% graduation, ~70–79% of tokens dead on day one
  const ERA = {
    prime: { spawn: 1.9, bias: 0.06, hype: 1.1, life: 1.0, ev: 1.2, sol: 240 },
    now: { spawn: 1.0, bias: 0.03, hype: 0.85, life: 0.8, ev: 0.9, sol: 0 }
  };
  // ===== persistent trader personas (bankrolls, styles, PnL) and dev histories =====
  const PTYPES = [['retail', 300, [0.5, 8]], ['paper', 80, [0.5, 5]], ['diamond', 50, [2, 20]], ['momentum', 60, [5, 40]], ['dip', 40, [5, 50]], ['sniper', 30, [30, 300]],
    ['smart', 20, [200, 3000]], ['whale', 10, [2000, 20000]], ['kol', 15, [50, 600]], ['copy', 60, [2, 20]], ['bot', 20, [5, 50]]];
  const CATCH = ['gm', 'lfg', 'ser', '🫡', 'wagmi', 'nfa', 'trust', '🐸', '💎', 'send it', 'ngl', 'fr'];
  function mkPersona(ty, bank, fresh) {
    const w = addr();
    const p = { w, ty, bank, u: ty === 'sniper' || ty === 'bot' ? w.slice(0, 6).toLowerCase() : uname(), av: pick(AVE), h: RI(0, 359), fresh: !!fresh,
      st: { low: rnd() < .7, emo: rnd() * .5, caps: rnd() < .08 ? .4 : .03, typo: rnd() * .15, cat: rnd() < .35 ? pick(CATCH) : null },
      pnl: 0, wins: 0, losses: 0, trades: 0, kolF: ty === 'kol' ? Math.round(Math.exp(R(8.5, 13))) : 0 };
    Sim.PW.set(w, p); (Sim.BY[ty] || (Sim.BY[ty] = [])).push(p); return p;
  }
  function initPop() {
    Sim.PW = new Map(); Sim.BY = {};
    PTYPES.forEach(t => { for (let i = 0; i < t[1]; i++) mkPersona(t[0], Math.exp(R(Math.log(t[2][0]), Math.log(t[2][1])))); });
    // devs: serial ruggers, fee farmers, legit builders, newbies
    Sim.DEVS = [];
    [['serial', 50], ['farmer', 55], ['legit', 15], ['newbie', 40]].forEach(t => { for (let i = 0; i < t[1]; i++) { const d = { w: addr(), u: uname(), av: pick(AVE), h: RI(0, 359), style: t[0], launched: 0, rugged: 0, bonded: 0 };
      // history so far (what a dev-checker tool would show)
      const L = t[0] === 'serial' ? RI(8, 60) : t[0] === 'farmer' ? RI(5, 40) : t[0] === 'legit' ? RI(1, 6) : RI(0, 2);
      d.launched = L; d.rugged = Math.round(L * (t[0] === 'serial' ? R(.6, .9) : t[0] === 'farmer' ? R(.1, .3) : t[0] === 'legit' ? 0 : R(0, .5))); d.bonded = Math.round(L * (t[0] === 'legit' ? R(.1, .4) : R(0, .04)));
      Sim.DEVS.push(d); Sim.PW.set(d.w, { w: d.w, ty: 'dev', u: d.u, av: d.av, h: d.h, st: { low: true, emo: .3, caps: .02, typo: .05, cat: null }, dev: d, bank: 1e9, pnl: 0, wins: 0, losses: 0, trades: 0 }); } });
  }
  function pickPersona(ty, need) {
    const L = Sim.BY[ty];
    if (ty === 'retail' && (rnd() < 0.3 || !L) && Sim.PW.size < 5000) return mkPersona('retail', Math.exp(R(Math.log(0.3), Math.log(6))), true); // fresh wallets keep arriving (capped)
    if (L && L.length) for (let k = 0; k < 6; k++) { const p = L[Math.floor(rnd() * L.length)]; if (p.bank >= need * 0.3) return p; }
    if (ty === 'retail' || ty === 'paper' || ty === 'copy') { const p = L && L.length ? L[Math.floor(rnd() * L.length)] : null; if (p && rnd() < 0.5) { p.bank += Math.exp(R(Math.log(0.5), Math.log(5))); return p; } } // re-deposit
    if (ty !== 'whale' && ty !== 'smart' && ty !== 'kol') return pickPersona('retail', need);
    return null;
  }
  let tradeId = 0;
  const TYPES = { smart: '🧠', boost: '🚀', retail: '', sniper: '🎯', momentum: '📈', dip: '🪣', whale: '🐋', paper: '🧻', diamond: '💎', copy: '👥', kol: '📣', vol: '🔁', mev: '🥪', dev: '👨‍💻', bundle: '📦', bot: '🤖', you: '⭐', dust: '👻', cabal: '🕸️' };
  const TNAME = { smart: 'Smart money', boost: 'BOOST', retail: 'Retail', sniper: 'Sniper', momentum: 'Momentum', dip: 'Dip buyer', whale: 'Whale', paper: 'Paper hands', diamond: 'Diamond hands', copy: 'Copy trader', kol: 'KOL', vol: 'Volume bot', mev: 'MEV bot', dev: 'Dev', bundle: 'Bundle', bot: 'Bot', you: 'You', dust: 'Fake holder', cabal: 'Cabal' };
  const Sim = {
    SUP, V_SOL0, V_TOK0, GRAD_SOL, TYPES, TNAME,
    coins: new Map(), list: [], t: Date.now(),
    pool: [], poolUnused: [], poolKeys: new Set(),
    solUsd: 165, liveSol: 165, act: 1, chat: 1, mode: 'real', era: 'now', heat: 1, rep: 0, devName: 'you', launched: 0, nextSpawn: 0, txWindow: [], spawnTimes: [], ERA,
    onTrade: null, onEvent: null, onSpawn: null,
    R, RI, gauss, pick, addr, clamp
  };

  initPop();
  Sim.persona = w => Sim.PW && Sim.PW.get(w);
  Sim.seed = n => { n = n >>> 0; const g = sfc32(0x9E3779B9, n, Math.imul(n, 0x85EBCA6B), 0xC2B2AE35 ^ n); for (let i = 0; i < 12; i++) g(); RS = g; };
  Sim.unseed = () => { RS = Math.random; };
  Sim.mp = false; Sim.ME = 'YOU'; Sim.PL = {}; Sim.ph = {};
  Sim.isMe = w => w === 'YOU' || w === Sim.ME;
  Sim.isMine = c => !!c && c.mine && (!c.devW || c.devW === Sim.ME);
  Sim.who = w => Sim.PL[w] || null;
  const kept = c => Sim.mp ? !!(Sim.ph[c.id] && Sim.ph[c.id].length) : c.keep;
  function phAdd(id, w) { const a = Sim.ph[id] || (Sim.ph[id] = []); if (a.indexOf(w) < 0) a.push(w); }
  function phDel(id, w) { const a = Sim.ph[id]; if (!a) return; const i = a.indexOf(w); if (i >= 0) a.splice(i, 1); if (!a.length) delete Sim.ph[id]; }
  Sim.adopt = function (o) { if (Sim.PW.has(o.w)) return Sim.PW.get(o.w); if (Sim.mp) return null; const p = mkPersona(o.ty || 'smart', o.bank || 800); Sim.PW.delete(p.w); p.w = o.w; p.u = o.u || p.u; p.av = o.av || p.av; p.h = o.h != null ? o.h : p.h; p.pnl = o.pnl || 0; p.wins = o.wins || 0; p.losses = o.losses || 0; p.trades = o.trades || 0; if (o.kolF) p.kolF = o.kolF; Sim.PW.set(p.w, p); return p; };
  Sim.leaders = function (n, ty) { const L = []; for (const p of Sim.PW.values()) if (p.ty !== 'dev' && p.ty !== 'sniper' && p.ty !== 'bot' && (!ty || p.ty === ty) && p.trades > 3) L.push(p); L.sort((a, b) => b.pnl - a.pnl); return L.slice(0, n || 20); };
  Sim.addPool = function (t) {
    if (!t || !t.name || !t.sym) return;
    const key = (t.addr || (t.name + '|' + t.sym)).toLowerCase();
    if (Sim.poolKeys.has(key)) return;
    Sim.poolKeys.add(key);
    const e = { name: String(t.name).slice(0, 32), sym: String(t.sym).slice(0, 12).toUpperCase(), img: t.img || null, real: true, st: t.st || null };
    Sim.pool.push(e); Sim.poolUnused.push(e);
  };

  const price = c => c.vSol / c.vTok;
  Sim.price = price;
  Sim.mc = c => c.vSol / c.vTok * SUP;
  Sim.mcUsd = c => Sim.mc(c) * Sim.solUsd;
  Sim.priceUsd = c => price(c) * Sim.solUsd;
  Sim.progress = c => c.grad ? 100 : clamp((V_TOK0 - c.vTok) / CURVE_TOK * 100, 0, 100);
  Sim.liqUsd = c => (c.grad ? c.vSol * 2 : c.realSol) * Sim.solUsd;
  Sim.mcAgo = function (c, s) {
    const target = Math.floor(Sim.t / 1000) - s, cd = c.candles;
    for (let i = cd.length - 1; i >= 0; i--) if (cd[i][0] <= target) return cd[i][4];
    return c.m0;
  };
  Sim.change = (c, s) => (Sim.mc(c) / Sim.mcAgo(c, s) - 1) * 100;
  Sim.volSince = function (c, s) {
    const target = Math.floor(Sim.t / 1000) - s, cd = c.candles; let v = 0;
    for (let i = cd.length - 1; i >= 0 && cd[i][0] > target; i--) v += cd[i][5];
    return v;
  };
  Sim.likes = cm => Math.min(999, cm.lk + Math.floor((Sim.t - cm.t) / 1000 * cm.lr));

  // Real pump.fun fee schedule:
  //  bonding curve: 1.25% total (0.30% creator) since 13 May 2025; before that (prime era) 1%, no creator cut
  //  after graduation: PumpSwap tiered 1.25% → 0.30% floor by market cap (prime era: Raydium ~0.25%, no creator cut)
  Sim.fee = function (c) {
    const prime = Sim.era === 'prime';
    if (!c.grad) return prime ? [0.01, 0] : [0.0125, 0.003];
    if (prime) return [0.0025, 0];
    const mc = c.vSol / c.vTok * SUP, tot = clamp(0.0125 - 0.00095 * Math.log2(Math.max(1, mc / 420)), 0.003, 0.0125);
    return [tot, tot * 0.24];
  };
  Sim.dex = () => Sim.era === 'prime' ? 'Raydium' : 'PumpSwap';
  Sim.quoteBuy = (c, sol) => { const s = sol * (1 - Sim.fee(c)[0]), k = c.vSol * c.vTok; return c.vTok - k / (c.vSol + s); };
  Sim.quoteSell = (c, tok) => { const k = c.vSol * c.vTok; return (c.vSol - k / (c.vTok + tok)) * (1 - Sim.fee(c)[0]); };
  function doBuy(c, sol) { const s = sol * (1 - Sim.fee(c)[0]), k = c.vSol * c.vTok, nv = c.vSol + s, out = c.vTok - k / nv; c.vSol = nv; c.vTok -= out; c.realSol += s; return out; }
  function doSell(c, tok) { const f = Sim.fee(c)[0], k = c.vSol * c.vTok, nt = c.vTok + tok, out = c.vSol - k / nt; c.vSol -= out; c.vTok = nt; c.realSol = Math.max(0, c.realSol - out); return out * (1 - f); }

  function hAdd(c, w, amt, ty) {
    const cur = c.holders.get(w), m = Sim.mc(c);
    if (cur == null) { c.holders.set(w, amt); c.hk.push(w); c.hi.set(w, { ty: ty || 'retail', e: m, t: Sim.t, cost: 0 }); }
    else { c.holders.set(w, cur + amt); const h = c.hi.get(w); if (h) h.e = (h.e * cur + m * amt) / (cur + amt); }
  }
  function hSub(c, w, amt) {
    const n = (c.holders.get(w) || 0) - amt;
    if (n <= 1) { c.holders.delete(w); c.hi.delete(w); const i = c.hk.indexOf(w); if (i >= 0) { c.hk[i] = c.hk[c.hk.length - 1]; c.hk.pop(); } }
    else c.holders.set(w, n);
  }

  function ev(c, icon, text) { c.events.unshift({ t: Sim.t, icon, text }); if (c.events.length > 8) c.events.length = 8; if (Sim.onEvent) cbk(Sim.onEvent, c, icon, text); }

  function rec(c, side, w, sol, tok, tag) {
    const t = Sim.t - Math.floor(rnd() * 180), m = Sim.mc(c);
    c.vol += sol; if (side) c.buys++; else c.sells++;
    if (c.mine) c.fee += sol * Sim.fee(c)[1];
    c.exc = Math.min(1.2, (c.exc || 0) + (sol > 2 ? 0.08 : 0.025));
    const tr = { id: ++tradeId, t, s: side, w, sol, tok, m, tag };
    c.trades.unshift(tr); if (c.trades.length > 50) c.trades.length = 50;
    const sec = Math.floor(t / 1000), cd = c.candles, L = cd[cd.length - 1];
    if (!L || sec > L[0]) { const o = L ? L[4] : m; cd.push([sec, o, Math.max(o, m), Math.min(o, m), m, sol]); if (cd.length > 1300) cd.splice(0, cd.length - 1200); }
    else { if (m > L[2]) L[2] = m; if (m < L[3]) L[3] = m; L[4] = m; L[5] += sol; }
    if (m > c.ath) c.ath = m;
    c.lastT = t;
    Sim.txWindow.push(t);
    if (!c.grad && c.realSol >= GRAD_SOL) {
      c.grad = true; c.gradAt = t; c.boost += R(0.5, 2);
      c.postBond = rnd() < 0.5 ? R(0.3, 0.6) : -R(0.05, 0.2); if (c.postBond > 0) { c.mom = Math.max(c.mom, 1); c.boost += R(1, 2.5); }
      c.vSol = Math.max(V_SOL0, c.vSol - 1.5); // ~1.5 SOL migration fee leaves the pool
      if (c.tgt && c.tgt < Sim.mc(c) * 1.2) c.tgt = Sim.mc(c) * R(0.8, 3);
      { const age = (t - c.born) / 1000; c.life = Math.max(c.life, age * 0.6 + 120); c.h0 = Math.max(c.h0, (c.hype || 0.3) * R(0.9, 1.5) * Math.exp(age / c.life)); } // new listing = renewed attention
      if (Sim.era !== 'prime') c.boostLeft = R(14, 18); // BOOST: ~20% of migration liquidity market-buys & burns over 5 min
      ev(c, '🎓', 'Bonded — migrated to ' + Sim.dex());
      burst(c, 'mig', RI(3, 6));
      if (c.devP) c.devP.bonded++;
      if (Sim.onGrad) cbk(Sim.onGrad, c);
    }
    if (Sim.onTrade) cbk(Sim.onTrade, c, tr);
    return tr;
  }
  function buyAs(c, w, sol, ty) {
    const tok = doBuy(c, sol); hAdd(c, w, tok, ty); const h = c.hi.get(w); if (h) h.cost = (h.cost || 0) + sol;
    const P = Sim.PW.get(w); if (P) { if (P.ty !== 'dev') P.bank -= sol; P.trades++; }
    return rec(c, 1, w, sol, tok, ty);
  }
  function sellAs(c, w, tok) {
    const h = c.hi.get(w), ty = h ? h.ty : 'retail', bal = c.holders.get(w) || tok, fr = Math.min(1, tok / bal);
    const mult = h ? Sim.mc(c) / h.e : 1, costOut = h ? (h.cost || 0) * fr : 0;
    const sol = doSell(c, tok); hSub(c, w, tok);
    if (h && fr < 1) h.cost = (h.cost || 0) * (1 - fr);
    const P = Sim.PW.get(w); if (P) { P.bank += sol; P.pnl += sol - costOut; P.trades++; if (fr >= 0.999) { if (sol > costOut) P.wins++; else P.losses++; } }
    if (ty !== 'mev' && ty !== 'vol') { c.exits.unshift({ w, mult, t: Sim.t, full: fr >= 0.999, sol }); if (c.exits.length > 25) c.exits.length = 25; }
    if (ty === 'dev' && !c.rug && !c.mine) { c.devSells = (c.devSells || 0) + 1; ev(c, '👨‍💻', 'Dev sold ' + (fr * 100).toFixed(0) + '% of their bag'); }
    if (ty === 'cabal' && !c.cabalDump) { c.cabalDump = true; ev(c, '🕸️', 'Cabal wallets dumping together'); burst(c, 'rug', RI(1, 3)); c.mom -= 1.2; }
    if (ty === 'kol' && !c.kolSold) { c.kolSold = true; ev(c, '📣', 'KOL dumped their bag on followers'); burst(c, 'kolsell', RI(2, 4)); c.mom -= 1; }
    return rec(c, 0, w, sol, tok, ty);
  }

  function spawn(src) {
    const g = src || genName();
    const m0 = V_SOL0 / V_TOK0 * SUP;
    const real = Sim.mode === 'real';
    const c = {
      id: 't' + (++Sim.launched) + '_' + Math.floor(rnd() * 1e9).toString(36),
      name: g.name, sym: g.sym, img: g.img || null, emoji: g.emoji || pick(EM), real: !!g.real,
      hue: RI(0, 359), ca: addr(44, 'pump'), born: Sim.t,
      vSol: V_SOL0, vTok: V_TOK0, realSol: 0, grad: false, gradAt: 0, rug: false, dead: false,
      q: Math.pow(rnd(), real ? 2.6 : 2.2), life: R(20, 260), h0: 0, boost: 0, mom: R(0, .9), hype: 1,
      holders: new Map(), hk: [], hi: new Map(), trades: [], events: [], cm: [], cmN: 0, rq: [],
      candles: [[Math.floor(Sim.t / 1000), m0, m0, m0, m0, 0]],
      vol: 0, buys: 0, sells: 0, ath: m0, m0, dev: addr(), bundles: [], rugAt: Infinity, lastT: Sim.t, keep: false,
      brB: 0, tgt: 0, prof: null, vb: false, vbw: addr(), copyQ: 0, kolSold: false, mine: false, fee: 0, trust: 0, burned: 0, desc: '', exits: [], devP: null, qa: [],
      dust: 0, botVol: 0, vbN: 1, vbR: 0.25, vbws: [], cabal: [], cabalDump: false, cto: false, dexPaid: false, boosts: 0, kolCallAt: 0, kolPend: 0
    };
    c.h0 = Math.exp(gauss() * .8) * R(.3, 1.1) * (0.3 + c.q);
    const E = ERA[Sim.era] || ERA.now; c.life *= E.life;
    if (rnd() < (real ? 0.02 : 0.035)) { c.q = R(.8, 1); c.h0 *= 2.5; c.life = R(200, 600); }
    // dev identity & history decide behaviour (serial ruggers rug, fee farmers soft-rug, legit devs hold)
    if (!g.user) {
      const D = wpick([['serial', 4], ['farmer', 4], ['legit', 1], ['newbie', 2]]), pool = Sim.DEVS.filter(d => d.style === D), dv = pick(pool);
      c.devP = dv; c.dev = dv.w; dv.launched++;
      const rp = { serial: real ? 0.78 : 0.65, newbie: 0.25, farmer: 0.08, legit: 0 }[dv.style];
      if (rnd() < rp) c.rugAt = dv.style === 'serial' ? R(12, 200) : R(40, 400);
      if (dv.style === 'legit') { c.q = clamp(c.q + 0.12, 0, 1); }
    }
    // copy the behaviour profile of the real coin this name came from
    if (g.st && g.st.mc > 0) {
      const s = g.st; c.prof = { mc: s.mc, b: s.b, s: s.s, ch: s.ch, v: s.v };
      const tgtUsd = clamp(4500 * Math.pow(Math.max(1, s.mc / 4500), 0.38) * Math.exp(gauss() * 0.8 - 1.4) * (Sim.mode === 'real' ? 0.5 : 1), 5000, 2e7);
      c.tgt = tgtUsd / Sim.solUsd;
      c.q = clamp(Math.log(tgtUsd / 4500) / Math.log(20000), 0.03, 1);
      const tx = (s.b || 0) + (s.s || 0);
      c.h0 = Math.exp(gauss() * .5) * clamp(tx / 500, 0.4, 2.2) * (0.3 + c.q);
      c.brB = tx > 10 ? clamp((s.b / tx - 0.5) * 1.2, -0.3, 0.3) : 0;
      c.life = R(60, 300) * (0.6 + c.q);
      c.rugAt = s.ch < -60 ? R(30, 240) : (rnd() < 0.15 ? R(30, 300) : Infinity);
    }
    c.h0 *= E.hype;
    // most launches are duds: dev + a couple of snipers, dead within minutes
    if (!g.user && rnd() < (g.st ? 0.55 : Sim.era === 'prime' ? 0.45 : 0.6)) { c.dud = true; c.h0 *= 0.12; c.life *= 0.35; c.q *= 0.4; }
    c.vb = rnd() < 0.12; if (c.vb) { c.vbN = RI(2, 5); c.vbR = R(0.2, 1.4); for (let i = 0; i < c.vbN; i++) c.vbws.push(addr()); }
    if (!g.user) {
      buyAs(c, c.dev, R(0.1, 2.5), 'dev');
      const nb = rnd() < (c.devP && c.devP.style === 'serial' ? 0.65 : 0.25) ? RI(1, 5) : 0;
      for (let i = 0; i < nb; i++) { const w = addr(); c.bundles.push(w); buyAs(c, w, R(0.3, 3), 'bundle'); }
      if (nb >= 3 && rnd() < 0.5 && !c.vb) { c.vb = true; c.vbN = RI(2, 5); c.vbR = R(0.2, 1.4); for (let i = 0; i < c.vbN; i++) c.vbws.push(addr()); }
      const sty = c.devP ? c.devP.style : 'farmer';
      if (sty === 'serial' && rnd() < 0.4 && !c.vb) { c.vb = true; c.vbN = RI(2, 5); c.vbR = R(0.2, 1.4); for (let i = 0; i < c.vbN; i++) c.vbws.push(addr()); }
      // fake holders: dev sprays dust to fresh wallets so the holder count looks organic
      if ((sty === 'serial' || sty === 'farmer') && rnd() < (sty === 'serial' ? 0.45 : 0.25)) { const nd = RI(20, 140); for (let i = 0; i < nd; i++) hAdd(c, addr(), R(800, 25000), 'dust'); c.dust = nd; }
      // cabal: a coordinated group of linked wallets that buys together early and dumps together
      if ((sty === 'serial' || sty === 'farmer') && !c.dud && rnd() < 0.22) c.cabalAt = R(15, 70);
      // block-0 snipers: the same sniper bots hit almost every launch
      if (!c.dud || rnd() < .5) for (let i = 0, n = RI(0, 4); i < n; i++) { const P = pickPersona('sniper', 1); if (P) buyAs(c, P.w, Math.min(R(0.5, 3), P.bank * .1), 'sniper'); }
    }
    Sim.coins.set(c.id, c); Sim.list.unshift(c); Sim.spawnTimes.push(Sim.t);
    if (rnd() < 0.5) addComment(c, 'launch');
    if (Sim.onSpawn) cbk(Sim.onSpawn, c);
    return c;
  }
  Sim.spawn = spawn;

  function spawnNext() {
    let src = null;
    if (Sim.poolUnused.length && rnd() < 0.85) {
      const i = Math.floor(rnd() * Sim.poolUnused.length);
      src = Sim.poolUnused[i]; Sim.poolUnused[i] = Sim.poolUnused[Sim.poolUnused.length - 1]; Sim.poolUnused.pop();
    } else if (Sim.pool.length && rnd() < 0.5) src = pick(Sim.pool); // copycat launch of a real name
    return spawn(src);
  }

  function rug(c) {
    if (c.devP) c.devP.rugged++;
    c.rug = true; c.h0 *= 0.12; c.boost = 0; c.mom = -2.5; c.copyQ = 0;
    const b = c.holders.get(c.dev); if (b) sellAs(c, c.dev, b);
    for (const x of c.bundles) { const bb = c.holders.get(x); if (bb) sellAs(c, x, bb); }
    ev(c, '⚠️', 'Dev rugged — sold entire bag');
    burst(c, 'rug', RI(3, 8));
  }

  // ---------- strategies ----------
  function buyType(c, age, ch20, dd) {
    return wpick([['retail', 50], ['sniper', age < 15 ? 70 : age < 40 ? 8 : 0], ['momentum', ch20 > 0.1 ? 40 : 4], ['dip', (dd > 0.4 && c.q > 0.25 && !c.rug) ? 22 : 2],
      ['whale', Sim.mc(c) * Sim.solUsd > 25000 ? 2.2 : 0.5], ['paper', 16], ['diamond', 8], ['bot', 8], ['smart', age < 90 && !c.rug ? 14 * c.q * c.q : 0.5]]);
  }
  function buySize(ty, c) {
    // bigger coins attract bigger tickets
    const sc = clamp(Math.pow(Sim.mc(c) / c.m0, 0.2), 1, 3);
    return rawSize(ty, c) * (ty === 'sniper' || ty === 'bot' || ty === 'whale' ? 1 : sc);
  }
  function rawSize(ty, c) {
    switch (ty) {
      case 'smart': return Math.exp(gauss() * .6 - .2);
      case 'sniper': return R(0.5, 4);
      case 'momentum': return Math.exp(gauss() * .8 - 1);
      case 'dip': return Math.exp(gauss() * .8 - .8);
      case 'whale': return R(2, 12) * (c.grad ? 1.6 : 1);
      case 'paper': return Math.exp(gauss() * .8 - 1.8);
      case 'diamond': return Math.exp(gauss() * .9 - 1.2);
      case 'copy': return Math.exp(gauss() * .7 - 1.2);
      case 'bot': return R(0.01, 0.08);
      default: return Math.exp(gauss() - 1.4);
    }
  }
  function sellDesire(c, w, ch20) {
    const h = c.hi.get(w), ty = h ? h.ty : 'retail', mult = h ? Sim.mc(c) / h.e : 1, held = (Sim.t - (h ? h.t : Sim.t)) / 1000;
    switch (ty) {
      case 'sniper': return mult > 1.6 || held > 40 ? [0.95, 1] : [0.1, 1];
      case 'paper': return mult < 0.85 || mult > 1.25 ? [0.85, 1] : [0.12, 1];
      case 'diamond': return mult > 10 ? [0.4, 0.5] : [0.02, 0.25];
      case 'whale': return mult > 2 ? [0.6, 0.5] : mult < 0.7 ? [0.4, 1] : [0.05, 0.5];
      case 'momentum': return ch20 < -0.08 ? [0.8, 1] : mult > 1.6 ? [0.5, 1] : [0.1, 1];
      case 'copy': return c.kolSold ? [0.8, 1] : mult > 2 ? [0.35, 1] : [0.1, 1];
      case 'kol': return mult > 2.2 || held > 90 ? [0.85, 1] : [0.03, 1];
      case 'dip': return mult > 1.5 ? [0.6, 1] : mult < 0.75 ? [0.45, 1] : [0.06, 1];
      case 'dev': {
        if (c.rug) return [1, 1];
        const st = c.devP ? c.devP.style : 'farmer';
        if (st === 'legit') return [0, 1];
        if (st === 'farmer') return mult > 1.5 ? [0.3, pick([.2, .3, .4])] : [0.02, .2];   // soft rug in chunks
        if (st === 'newbie') return mult > 1.3 ? [0.35, 1] : [0.03, 1];                     // paper-hand dev
        return [0.03, pick([.25, .5])];
      }
      case 'bundle': return c.rug ? [1, 1] : mult > 3 ? [0.5, 1] : [0.03, 1];
      case 'mev': return [1, 1];
      case 'dust': return [0, 0];
      case 'cabal': return c.cabalDump || c.rug ? [1, 1] : mult > R(2.2, 3.5) ? [0.8, 1] : [0.02, 1];
      case 'smart': return mult > R(2.5, 4) || ch20 < -0.15 ? [0.9, 1] : [0.04, 1];
      default: return [0.15 + (mult > 2 ? 0.25 : 0) + (mult < 0.6 ? 0.2 : 0), rnd() < 0.45 ? 1 : pick([.25, .33, .5, .75])];
    }
  }

  function botTrade(c, pb, age, ch20) {
    const n = c.hk.length;
    if (n < 3 || rnd() < pb) {
      const dd = 1 - Sim.mc(c) / c.ath;
      let ty = buyType(c, age, ch20, dd), w, sol = clamp(buySize(ty, c), 0.005, 120);
      if ((ty === 'retail' || ty === 'diamond' || ty === 'dip') && n > 5 && (n > 1200 || rnd() < 0.15)) { w = c.hk[Math.floor(rnd() * n)]; const h = c.hi.get(w); if (h && (h.ty === 'dust' || h.ty === 'cabal' || h.ty === 'vol')) return; if (h) ty = h.ty; const P = Sim.PW.get(w); if (P && P.ty !== 'dev') sol = Math.min(sol, Math.max(0.01, P.bank * 0.5)); }
      else { const P = pickPersona(ty === 'bot' ? 'bot' : ty, sol); if (!P) return; w = P.w; if (P.ty !== 'dev' && Sim.mode !== 'arcade') sol = Math.min(sol, P.bank * (ty === 'whale' || ty === 'smart' ? 0.08 : 0.6)); }
      if (sol < 0.005) return;
      buyAs(c, w, sol, ty);
      if (ty === 'whale' && rnd() < 0.5) burst(c, 'whale', 1);
    } else {
      let best = null, bs = -1, bf = 1;
      for (let i = 0; i < Math.min(5, n); i++) {
        const w = c.hk[Math.floor(rnd() * n)]; if (w === c.dev && !c.rug && rnd() < 0.5) continue;
        const d = sellDesire(c, w, ch20), s = d[0] * (0.3 + rnd());
        if (s > bs) { bs = s; best = w; bf = d[1]; }
      }
      if (!best) return;
      const bal = c.holders.get(best); if (!bal) return;
      sellAs(c, best, bal * bf);
    }
  }

  function stepCoin(c, dt) {
    if (c.mir) return mirStep(c, dt);
    const age = (Sim.t - c.born) / 1000;
    c.boost *= Math.exp(-dt / 25);
    c.exc = (c.exc || 0) * Math.exp(-dt / 6);
    const hype = c.h0 * Math.exp(-age / c.life) + c.boost;
    c.mom += -0.3 * c.mom * dt + 0.75 * Math.sqrt(dt) * gauss();
    if (!c.rug && !c.mine && age > c.rugAt) rug(c);
    const E = ERA[Sim.era] || ERA.now;
    if (!c.rug && !c.mine && rnd() < dt * (Sim.mode === 'real' ? 0.0018 : 0.003) * E.ev * (0.3 + c.q) * (age < 600 ? 1 : 0.25)) {
      const e = wpick([['kol', 3], ['whale', 3], ['trend', 3], ['dex', 2], ['boost', (c.grad || Sim.progress(c) > 50) ? 2.5 : 0.6]]);
      if (e === 'kol') { const K = pickPersona('kol', 3) || mkPersona('kol', 300); const w = K.w; c.kolP = K; buyAs(c, w, Math.min(R(3, 15), K.bank * .3), 'kol'); c.kolSold = false; c.kolCallAt = Sim.t + R(4000, 15000); c.kolPend = RI(6, 25) * clamp(Math.log10(K.kolF || 1e4) / 4.5, .5, 1.6); }
      else if (e === 'whale') { const Wh = pickPersona('whale', 10) || mkPersona('whale', 5000); buyAs(c, Wh.w, Math.min(R(4, 18), Wh.bank * .03), 'whale'); c.mom += R(.3, 1); ev(c, '🐋', 'Whale wallet aped in'); burst(c, 'whale', RI(1, 3)); }
      else if (e === 'trend') { c.boost += R(.8, 4) * (0.5 + c.q); c.mom += R(.6, 1.6); ev(c, '🔥', 'Trending on socials'); burst(c, 'pump', RI(2, 4)); }
      else if (e === 'dex') { if (!c.dexPaid) { c.dexPaid = true; c.boost += R(.5, 2); ev(c, '💊', 'DEX paid — DexScreener profile updated'); } else { c.boost += R(.2, .8); } }
      else { const n = pick([10, 10, 30, 50, 100, 500]); c.boosts += n; c.boost += Math.log10(n) * R(.4, 1.1); c.mom += R(.2, .7); ev(c, '⚡', 'DexScreener boost x' + n + ' bought'); if (Sim.onBoost) cbk(Sim.onBoost, c, n); }
    }
    const ch = Sim.mc(c) / Sim.mcAgo(c, 20) - 1;
    let bias = c.rug && !c.cto ? -1.4 : (c.q * 1.35 * Math.exp(-age / c.life) - 0.56 - Math.min(0.6, age / 1500)) + c.brB;
    if (c.tgt && !c.rug) { const r = Sim.mc(c) / c.tgt; if (r < 0.7 && age < c.life * 1.6) bias += 0.12; else if (r > 1.1) bias -= 0.3; }
    if (Sim.mode === 'real') bias -= 0.21; else bias += 0.08;
    bias += E.bias + (Sim.heat - 1) * 0.08;
    if (c.grad && Sim.t - c.gradAt < 120000) bias += c.postBond; // bond reaction: listing pump or early-buyer dump
    if (c.mine && !c.rug) bias += c.trust;
    const pb = 1 / (1 + Math.exp(-1.5 * (c.mom + bias + clamp(ch, -.5, 1) * 0.2)));
    let act = (0.03 + 1.3 * hype) * (1 + clamp(Math.abs(ch), 0, 1.5)) * (1 + c.exc) * (c.grad ? 1.4 : 1) * Sim.act * Sim.heat;
    act = Math.min(act, 14);
    let n = poisson(act * dt); if (n > 15) n = 15;
    for (let i = 0; i < n; i++) botTrade(c, pb, age, ch);
    // BOOST: post-migration buy & burn (2026 pump.fun mechanic)
    if (c.boostLeft > 0) { const amt = Math.min(c.boostLeft, 16 / 300 * dt * R(0.5, 1.5)); c.boostLeft -= amt; const tk = doBuy(c, amt); rec(c, 1, 'BOOST', amt, tk, 'boost'); }
    if (c.kolCallAt && Sim.t >= c.kolCallAt) { c.kolCallAt = 0; c.copyQ += Math.round(c.kolPend); c.mom += R(.5, 1.2); ev(c, '📣', 'KOL ' + (c.kolP ? '@' + c.kolP.u : '') + ' posted the CA — followers aping'); burst(c, 'kol', RI(2, 4)); if (Sim.onKol) cbk(Sim.onKol, c, c.kolP, 'call'); }
    if (c.cabalAt && age > c.cabalAt && !c.rug) { c.cabalAt = 0; const nC = RI(4, 9), base = R(0.8, 3); for (let i = 0; i < nC; i++) { const w = addr(); c.cabal.push(w); buyAs(c, w, base * R(.7, 1.3), 'cabal'); } c.mom += R(.4, 1); }
    // community takeover: dev is gone but holders keep it alive (most CTOs still fade)
    if (!c.cto && (c.rug || (c.devSells || 0) >= 2) && c.hk.length >= 25 && age > 120 && age < 2400 && rnd() < dt * 0.0025) { c.cto = true; c.boost += R(.5, 2.5); c.h0 = Math.max(c.h0, R(.15, .6)); c.life += R(90, 300); c.mom += R(.5, 1.5); c.keep2 = true; ev(c, '🤝', 'Community takeover (CTO) — holders took over the socials'); burst(c, 'pump', RI(2, 4)); }
    // copy traders following a KOL call
    if (c.copyQ > 0) { const k = Math.min(c.copyQ, poisson(dt * 1.5)); for (let i = 0; i < k; i++) { const P = pickPersona('copy', 0.2) || mkPersona('copy', 5); buyAs(c, P.w, clamp(Math.min(buySize('copy', c), P.bank * .5), 0.01, 10), 'copy'); } c.copyQ -= k; }
    // wash-trading volume bot: buys and sells the same size instantly
    if (c.vb && !c.rug && age < 900) { const k = Math.min(8, poisson(dt * (c.vbR || 0.25) * Sim.act * (age < 300 ? 1 : 0.4))); for (let i = 0; i < k; i++) { const sz = R(0.05, 0.9), w = c.vbws && c.vbws.length ? c.vbws[Math.floor(rnd() * c.vbws.length)] : c.vbw; const tk = doBuy(c, sz); rec(c, 1, w, sz, tk, 'vol'); const out = doSell(c, tk); rec(c, 0, w, out, tk, 'vol'); c.botVol = (c.botVol || 0) + sz + out; } }
    c.hype = hype;
    // chat
    if (Sim.chat > 0) {
      const cr = (0.006 + 0.06 * Math.min(act, 6)) * Sim.chat * (Sim.era === 'prime' ? 1.2 : 0.75);
      let k = poisson(cr * dt); if (k > 3) k = 3;
      if (k) { const md = moodOf(c, age); for (let i = 0; i < k; i++) addComment(c, md); }
    }
    if (!kept(c) && age > 90 && hype < 0.05 && (Sim.t - c.lastT > 30000 || Sim.mc(c) < c.m0 * 1.3)) c.dead = true;
  }

  function runReplies(c) {
    for (let i = c.rq.length - 1; i >= 0; i--) {
      const r = c.rq[i]; if (Sim.t < r.at) continue;
      c.rq.splice(i, 1);
      if (r.raw) { const sp = r.sp || {}; const cm = addComment(c, 'mid', { txt: r.txt, rep: r.rep, lk: 0 }); cm.u = sp.u || cm.u; cm.av = sp.av || cm.av; cm.h = sp.h != null ? sp.h : cm.h; cm.hold = sp.hold || 0; cm.pnl = sp.role === 'holder' || sp.role === 'dev' ? sp.pnl : null; cm.sold = sp.sold || null; cm.dev = sp.role === 'dev'; cm.ai = !!r.ai; if (G.Brain) G.Brain.mark(cm.txt); continue; }
      if (r.ans) { const H = holderPick(c); const au = H ? authorOf(H.w, H.P) : authorOf(addr(), null); const ansT = (G.Brain && G.Brain.answerKey(c, r.ans)) || answer(c, r.ans); const cm = addComment(c, 'mid', { txt: '@' + r.to + ' ' + stylize(ansT, au.st), rep: r.to }); cm.u = au.u; cm.av = au.av; cm.h = au.h; if (H) { const m = holderMeta(c, H); cm.hold = m.hold; cm.pnl = m.pnl; } }
      else addComment(c, 'mid', { txt: r.txt, rep: 'you', hold: rnd() < 0.7 ? 0.05 + rnd() * 2 : 0 });
    }
  }

  // new money keeps arriving: broke wallets top up over time (deposits / CEX withdrawals)
  const BANK0 = {}; PTYPES.forEach(t => BANK0[t[0]] = t[2]);
  function inflow(dt) {
    const n = poisson(dt * 6);
    for (let i = 0; i < n; i++) { const t = pick(PTYPES)[0], L = Sim.BY[t]; if (!L || !L.length) continue; const p = L[Math.floor(rnd() * L.length)], b = BANK0[t]; if (p.bank < b[0]) p.bank += Math.exp(R(Math.log(b[0]), Math.log(b[1]))); }
  }
  Sim.step = function (dt) {
    inflow(dt);
    if (Sim.t >= Sim.nextSpawn) { if (!Sim.mirror) spawnNext(); Sim.nextSpawn = Sim.t + R(700, 2600) / Math.max(.3, Sim.act * Sim.heat * (ERA[Sim.era] || ERA.now).spawn); }
    const L = Sim.list;
    for (let i = 0; i < L.length; i++) { const c = L[i]; if (!c.dead) stepCoin(c, dt); if (c.rq.length) runReplies(c); }
    if (L.length > MAX_COINS) {
      for (let i = L.length - 1; i >= 0 && L.length > MAX_COINS; i--) {
        const c = L[i]; if (kept(c)) continue;
        if (c.dead || L.length > MAX_COINS + 30) { L.splice(i, 1); Sim.coins.delete(c.id); }
      }
    }
    const cut = Sim.t - 60000; const tw = Sim.txWindow; let k = 0; while (k < tw.length && tw[k] < cut) k++; if (k) tw.splice(0, k);
    const st = Sim.spawnTimes; let j = 0; while (j < st.length && st[j] < cut) j++; if (j) st.splice(0, j);
  };

  // ---------- user actions (the user is never in the bot holder map) ----------
  // o.sandwich: an MEV bot front-runs the buy, pushing the price up by up to o.maxPct, then sells right after.
  Sim.userBuy = function (c, sol, o) {
    o = o || {}; let sw = null;
    if (o.sandwich) {
      const p = Math.min(o.maxPct, R(2, 7)) / 100;
      const fs = (c.vSol * Math.sqrt(1 + p) - c.vSol) / 0.99;
      const w = addr(); const tk = doBuy(c, fs); hAdd(c, w, tk, 'mev'); rec(c, 1, w, fs, tk, 'mev');
      sw = { w, tk, fs };
    }
    const tok = doBuy(c, sol), uw = o.w || 'YOU';
    const tr = rec(c, 1, uw, sol, tok, uw === 'YOU' ? 'you' : 'pl');
    if (sw) { const out = doSell(c, sw.tk); hSub(c, sw.w, sw.tk); rec(c, 0, sw.w, out, sw.tk, 'mev'); sw.profit = out - sw.fs; }
    c.mom += Math.min(1.5, sol * 0.04); c.boost += Math.min(3, sol * 0.015);
    if (sol >= 3 && rnd() < 0.6) burst(c, 'whale', 1);
    return { tok, tr, sw };
  };
  Sim.userSell = function (c, tok, w) {
    const sol = doSell(c, tok), uw = w || 'YOU';
    const tr = rec(c, 0, uw, sol, tok, uw === 'YOU' ? 'you' : 'pl');
    c.mom -= Math.min(1.5, sol * 0.03);
    return { sol, tr };
  };
  Sim.userComment = function (c, txt, holds, pl) {
    const cm = addComment(c, 'mid', { txt: String(txt).slice(0, 300), u: pl ? pl.u : 'you', av: pl ? pl.av : '⭐', you: !pl || pl.w === Sim.ME, hold: holds ? 0.01 : 0, lk: 0 });
    if (pl) { cm.pw = pl.w; cm.real = true; }
    cm.lr = 0.02 + rnd() * 0.05;
    const n = rnd() < 0.85 ? RI(1, 3) : 0;
    const set = /rug|scam|dump|dead|sell|over/i.test(txt) ? 'neg' : /moon|pump|100x|send|lfg|bull|ape|buy|🚀/i.test(txt) ? 'pos' : /\?/.test(txt) ? 'q' : 'any';
    for (let i = 0; i < n; i++) c.rq.push({ at: Sim.t + R(1500, 9000) * (i + 1), txt: pick(RE_YOU[set]) });
    return cm;
  };

  // ---------- user-launched coins ----------
  // hype: 0..1+ from tweets/followers; the user is the dev and holds the dev buy in their own wallet
  Sim.launchUser = function (o) {
    const c = spawn({ name: o.name, sym: o.sym, img: o.img || null, emoji: o.emoji, user: true });
    c.mine = true; c.dev = o.w || 'YOU'; c.devW = o.w || null; c.desc = o.desc || ''; c.keep = true; c.rugAt = Infinity; c.bundles = [];
    const hype = Math.max(0, o.hype || 0), rep = Sim.rep;
    // hype helps, but most launches still fail: even hot launches rarely bond
    c.q = clamp(0.05 + hype * 0.3 + rep / 400 + gauss() * 0.12, 0.02, 0.9);
    c.h0 = (0.14 + hype * 0.95) * Math.exp(gauss() * 0.45) * (ERA[Sim.era] || ERA.now).hype * (rep < -20 ? 0.5 : 1);
    c.life = R(60, 220) * (0.5 + c.q);
    if (rnd() < 0.35 * (1 - Math.min(1, hype / 1.6))) { c.h0 *= 0.3; c.life *= 0.5; } // nobody cares launch
    c.trust = clamp(rep / 500, -0.15, 0.06);
    c.mom = 0.3 + hype * 0.6;
    const tok = doBuy(c, o.devSol); c.mineTok = tok; rec(c, 1, c.dev, o.devSol, tok, 'dev');
    // snipers watch new launches: more followers → more snipers
    const sn = clamp(Math.round(hype * 5 + Math.log10(1 + (o.followers || 0)) + rnd() * 3), 1, 18);
    for (let i = 0; i < sn; i++) buyAs(c, addr(), R(0.2, 2.5), 'sniper');
    addComment(c, 'launch'); addComment(c, 'launch');
    if (rep < -20) addComment(c, 'rug', { txt: 'wait isnt this the dev that rugged last time 🚩' });
    return { c, tok };
  };
  Sim.userRug = function (c) {
    c.rug = true; c.h0 *= 0.08; c.boost = 0; c.mom = -3; c.copyQ = 0; c.trust = 0;
    ev(c, '⚠️', 'Dev (you) rugged — sold the whole dev bag');
    burst(c, 'rug', RI(5, 10));
    Sim.rep = clamp(Sim.rep - 25, -100, 100);
  };
  Sim.userBurn = function (c, frac) {
    c.burned = Math.min(1, c.burned + frac);
    c.trust += 0.08 * frac + 0.04; c.boost += 1.5 + frac * 2; c.mom += 1.2; c.q = clamp(c.q + 0.12, 0, 1);
    ev(c, '🔥', 'Dev burned ' + (frac * 100).toFixed(0) + '% of their bag — community trust up');
    for (let i = 0; i < RI(3, 6); i++) addComment(c, 'pump', { txt: pick(['DEV BURNED 🔥', 'dev based af', 'burn = trust, im buying', 'this dev is different', 'locked in for the long run', 'respect for the burn 🫡']) });
    Sim.rep = clamp(Sim.rep + 6, -100, 100);
  };
  Sim.userUpdate = function (c, likes) {
    const b = clamp(Math.log10(1 + likes) / 2, 0, 2.5);
    c.boost += b; c.mom += b * 0.6;
    if (likes > 20) { ev(c, '🐦', 'Dev tweet getting traction (' + fK(likes) + ' likes)'); burst(c, 'kol', 1); }
  };
  // speakers for conversation: real holders (with entry + pnl), a recent seller, or lurkers
  Sim.speakers = iso(function (c, n) {
    const out = [], seen = new Set(['you']);
    for (let k = 0; k < n * 5 && out.length < n; k++) {
      const H = holderPick(c); if (!H) break;
      const au = authorOf(H.w, H.P); if (seen.has(au.u)) continue; seen.add(au.u);
      const m = holderMeta(c, H); out.push(Object.assign(au, { w: H.w, hold: m.hold, pnl: m.pnl, ty: H.ty, role: H.ty === 'dev' ? 'dev' : 'holder', e: H.h ? H.h.e : null }));
    }
    if (c.exits.length && rnd() < .55) { const X = c.exits[Math.floor(rnd() * Math.min(8, c.exits.length))], P = Sim.PW.get(X.w); if (!P || (P.ty !== 'sniper' && P.ty !== 'bot')) { const au = authorOf(X.w, P); if (!seen.has(au.u)) { seen.add(au.u); out.splice(Math.floor(rnd() * (out.length + 1)), 0, Object.assign(au, { hold: 0, pnl: X.mult - 1, role: 'seller', sold: X.mult, ty: P ? P.ty : 'retail' })); } } }
    while (out.length < n) { const au = authorOf(addr(), null); if (seen.has(au.u)) continue; seen.add(au.u); out.push(Object.assign(au, { hold: 0, pnl: 0, role: 'lurker', ty: 'retail' })); }
    return out.slice(0, n);
  });
  Sim.say = function (c, at, sp, txt, rep) { c.rq.push({ at, raw: true, sp, txt, rep: rep || null }); };
  addComment = iso(addComment); burst = iso(burst); runReplies = iso(runReplies);
  Sim.stylize = (t, st) => stylize(t, st);
  Sim.compose = (c, mood) => compose(c, mood || 'mid');
  Sim.moodOf = c => moodOf(c, (Sim.t - c.born) / 1000);
  Sim.factLine = c => factLine(c, 'mid');
  Sim.addComment = addComment;

  // security-style holder breakdown (% of supply)
  Sim.stats = function (c) {
    let top = [], sn = 0, ins = 0, sm = 0, dust = 0, cab = 0;
    for (const [w, a] of c.holders) {
      const h = c.hi.get(w), ty = h ? h.ty : 'retail';
      if (ty === 'sniper') sn += a; else if (ty === 'bundle') ins += a; else if (ty === 'smart') sm += a; else if (ty === 'dust') dust++; else if (ty === 'cabal') { cab += a; ins += a; }
      top.push(a);
    }
    top.sort((a, b) => b - a); let t10 = 0; for (let i = 0; i < 10 && i < top.length; i++) t10 += top[i];
    const dev = c.mine ? (c.mineTok || 0) : (c.holders.get(c.dev) || 0);
    const d = c.devP;
    return { top10: t10 / SUP * 100, snipers: sn / SUP * 100, insiders: ins / SUP * 100, smart: sm / SUP * 100, dev: dev / SUP * 100, devL: d ? d.launched : 0, devR: d ? d.rugged : 0, devB: d ? d.bonded : 0, dust, cabal: cab / SUP * 100, botVol: c.vol > 0 ? (c.botVol || 0) / c.vol * 100 : 0, real: Math.max(0, c.hk.length - dust), dexPaid: !!c.dexPaid, boosts: c.boosts || 0, cto: !!c.cto };
  };
  Sim.topHolders = function (c, n) {
    const arr = []; for (const [w, a] of c.holders) arr.push([w, a]);
    arr.sort((a, b) => b[1] - a[1]); return arr.slice(0, n || 20);
  };

  Sim.ser = c => {
    const top = Sim.topHolders(c, 120).map(x => [x[0], Math.round(x[1])]);
    return {
      id: c.id, name: c.name, sym: c.sym, img: c.img, emoji: c.emoji, real: c.real, hue: c.hue, ca: c.ca, born: c.born,
      vSol: c.vSol, vTok: c.vTok, realSol: c.realSol, grad: c.grad, gradAt: c.gradAt, rug: c.rug, q: c.q, life: c.life, h0: c.h0,
      boost: c.boost, mom: c.mom, vol: c.vol, buys: c.buys, sells: c.sells, ath: c.ath, m0: c.m0, dev: c.dev, bundles: c.bundles,
      rugAt: c.rugAt === Infinity ? -1 : c.rugAt, holders: top, hi: top.map(x => [x[0], c.hi.get(x[0]) || { ty: 'retail', e: c.m0, t: c.born }]),
      trades: c.trades.slice(0, 15).map(t => Object.assign({}, t, { m: +t.m.toPrecision(5), sol: +t.sol.toPrecision(4), tok: Math.round(t.tok) })), candles: c.candles.slice(-300).map(k => [k[0], +k[1].toPrecision(5), +k[2].toPrecision(5), +k[3].toPrecision(5), +k[4].toPrecision(5), +k[5].toPrecision(3)]), events: c.events.slice(0, 4), cm: c.cm.slice(0, 15), cmN: c.cmN,
      brB: c.brB, tgt: c.tgt, prof: c.prof, vb: c.vb, vbw: c.vbw, kolSold: c.kolSold, dust: c.dust, botVol: c.botVol, vbN: c.vbN, vbR: c.vbR, vbws: c.vbws, cabal: c.cabal, cabalDump: c.cabalDump, cto: c.cto, dexPaid: c.dexPaid, boosts: c.boosts,
      mine: c.mine, fee: c.fee, trust: c.trust, burned: c.burned, desc: c.desc, mineTok: c.mineTok
    };
  };
  Sim.restore = function (o) {
    if (Sim.coins.has(o.id)) return Sim.coins.get(o.id);
    const c = Object.assign({ boost: 0, cm: [], cmN: 0, brB: 0, tgt: 0, prof: null, vb: false, vbw: addr(), kolSold: false, dust: 0, botVol: 0, vbN: 1, vbR: .25, vbws: [], cabal: [], cabalDump: false, cto: false, dexPaid: false, boosts: 0, kolCallAt: 0, kolPend: 0, hype: 0, mine: false, fee: 0, trust: 0, burned: 0, desc: '', exits: [], qa: [], devP: null }, o);
    c.holders = new Map(o.holders); c.hk = o.holders.map(x => x[0]); c.hi = new Map(o.hi || []);
    c.rugAt = o.rugAt < 0 ? Infinity : o.rugAt; c.dead = false; c.keep = true; c.lastT = Sim.t; c.events = o.events || []; c.rq = []; c.copyQ = 0;
    Sim.coins.set(c.id, c); Sim.list.push(c);
    return c;
  };

  // ---------- commands: every player action runs through here (same order on every phone) ----------
  Sim.exec = function (m) {
    const c = m.cid ? Sim.coins.get(m.cid) : null;
    if (m.w && m.u) Sim.PL[m.w] = { u: m.u, av: m.av || '🙂', h: m.h || 200 };
    switch (m.k) {
      case 'buy': {
        if (!c) return { fail: 'gone' };
        const q = Sim.quoteBuy(c, m.sol); if (m.min && q < m.min) return { fail: 'slip', q };
        const b0 = c.vSol, r = Sim.userBuy(c, m.sol, { sandwich: m.sw, maxPct: m.mp || 0, w: m.w });
        if (c.mir) { c.offS = (c.offS || 0) + (c.vSol - b0); reactTo(c, m.sol); }
        if (m.w) phAdd(c.id, m.w); if (c.devW && c.devW === m.w) c.mineTok = (c.mineTok || 0) + r.tok;
        return { tok: r.tok, q, sw: r.sw ? { profit: r.sw.profit } : null };
      }
      case 'sell': {
        if (!c) return { fail: 'gone' };
        const q = Sim.quoteSell(c, m.tok); if (m.min && q < m.min) return { fail: 'slip', q };
        const s0 = c.vSol, r = Sim.userSell(c, m.tok, m.w);
        if (c.mir) c.offS = (c.offS || 0) + (c.vSol - s0);
        if (m.w && m.all) phDel(c.id, m.w); if (c.devW && c.devW === m.w) c.mineTok = Math.max(0, (c.mineTok || 0) - m.tok);
        return { sol: r.sol };
      }
      case 'cm': if (!c) return { fail: 'gone' }; Sim.userComment(c, m.txt, m.hold, m.w ? { u: m.u, av: m.av, w: m.w } : null); return { ok: 1 };
      case 'launch': { Sim.rep = m.rep || 0; const r = Sim.launchUser(m); if (m.hue != null) r.c.hue = m.hue; if (m.w) phAdd(r.c.id, m.w); return { cid: r.c.id, tok: r.tok }; }
      case 'rug': if (!c) return { fail: 'gone' }; Sim.rep = m.rep || 0; Sim.userRug(c); return { rep: Sim.rep };
      case 'burn': if (!c) return { fail: 'gone' }; Sim.rep = m.rep || 0; c.mineTok = (c.mineTok || 0) * (1 - m.frac); Sim.userBurn(c, m.frac); return { rep: Sim.rep };
      case 'upd': if (c && !c.rug) Sim.userUpdate(c, m.likes); return { ok: 1 };
      case 'claim': if (c) c.fee = 0; return { ok: 1 };
      case 'pool': Sim.addPool(m.t); return { ok: 1 };
      case 'mir': (m.e || []).forEach(e => { try { Sim.mirrorEvent(e); } catch (x) { } }); return { ok: 1 };
    }
    return { fail: 'bad' };
  };
  // ---------- MIRROR MARKET: real pump.fun coins & trades replayed into our curves ----------
  // Every real buy/sell is applied with its real size. Our curve = real curve + the SOL that you (and the bots
  // reacting to you) put in or took out (c.offS), so your trades move the price and the impact persists.
  Sim.mirror = false; Sim.MIR = {};
  const SNIPE_MS = 2500;
  function snapTo(c, vs, vt) { if (!(vs > 0 && vt > 0)) return; c.rvs = vs; c.rvt = vt; const k = vs * vt; c.vSol = Math.max(1e-6, vs + (c.offS || 0)); c.vTok = k / c.vSol; c.realSol = Math.max(0, c.vSol - V_SOL0); }
  function mirCreate(e) {
    if (Sim.MIR[e.m]) return Sim.coins.get(Sim.MIR[e.m]);
    const c = spawn({ name: String(e.n || 'Unknown').slice(0, 32), sym: String(e.y || '???').slice(0, 12).toUpperCase(), user: true, real: true, img: null });
    c.mir = true; c.mint = e.m; c.ca = e.m; c.dev = e.d || addr(); c.uri = e.u || ''; c.rugAt = Infinity; c.offS = 0; c.rx = []; c.lastRT = Sim.t; c.born = Sim.t;
    c.vSol = V_SOL0; c.vTok = V_TOK0; c.realSol = 0; c.candles = [[Math.floor(Sim.t / 1000), Sim.mc(c), Sim.mc(c), Sim.mc(c), Sim.mc(c), 0]]; c.m0 = Sim.mc(c); c.ath = c.m0;
    if (e.tk > 0) { hAdd(c, c.dev, e.tk, 'dev'); const h = c.hi.get(c.dev); if (h) h.cost = e.s || 0; }
    if (e.vs > 0) snapTo(c, e.vs, e.vt); else if (e.s > 0) doBuy(c, e.s);
    if (e.s > 0) rec(c, 1, c.dev, e.s, e.tk || 0, 'dev');
    c.devTok0 = e.tk || 0; Sim.MIR[e.m] = c.id; c.keepUntil = Sim.t + 120000;
    return c;
  }
  function mirTrade(e) {
    const id = Sim.MIR[e.m], c = id && Sim.coins.get(id); if (!c) return;
    const w = e.w || addr(), side = e.b ? 1 : 0, prev = c.rvs || c.vSol - (c.offS || 0);
    let sol = e.s > 0 ? e.s : Math.abs((e.vs || prev) - prev), tok = e.tk || 0;
    let ty = w === c.dev ? 'dev' : (c.hi.get(w) || {}).ty || (Sim.t - c.born < SNIPE_MS ? 'sniper' : 'retail');
    if (side) { if (tok > 0) { hAdd(c, w, tok, ty); const h = c.hi.get(w); if (h) h.cost = (h.cost || 0) + sol; } }
    else { const bal = c.holders.get(w) || 0; if (bal > 0) hSub(c, w, Math.min(bal, tok || bal)); }
    if (e.vs > 0) snapTo(c, e.vs, e.vt); else if (side) doBuy(c, sol); else if (tok > 0) doSell(c, tok);
    if (sol > 0 || tok > 0) rec(c, side, w, sol, tok, ty);
    c.lastRT = Sim.t;
    if (!side && w === c.dev && !c.rug) { const left = c.holders.get(c.dev) || 0; c.devSells = (c.devSells || 0) + 1;
      if (c.devTok0 > 0 && left < c.devTok0 * 0.2) { c.rug = true; ev(c, '⚠️', 'Dev dumped their bag (real on-chain sell)'); burst(c, 'rug', 3); }
      else ev(c, '👨‍💻', 'Dev sold some tokens'); }
  }
  Sim.mirrorEvent = e => { if (e.k === 'c') mirCreate(e); else if (e.k === 't') mirTrade(e); };
  // bots that react to YOUR trades on real coins (momentum chasers who buy after you and dump on you)
  function reactTo(c, sol) {
    if (!c.mir) return; const liq = Math.max(1, c.vSol), push = sol / liq;
    if (push < 0.004 && sol < 0.3) return;
    const n = Math.min(6, poisson(Math.min(4, push * 60 + sol * 0.4)));
    for (let i = 0; i < n; i++) { const w = addr(), b = R(0.05, 0.25) * Math.max(0.3, sol), at = Sim.t + R(800, 6000); c.rx.push({ at, s: 1, w, sol: b }); c.rx.push({ at: at + R(6000, 45000), s: 0, w, fr: R(0.7, 1) }); }
    c.rx.sort((a, b) => a.at - b.at);
  }
  function mirStep(c, dt) {
    while (c.rx && c.rx.length && c.rx[0].at <= Sim.t) {
      const r = c.rx.shift(), before = c.vSol;
      if (r.s) buyAs(c, r.w, r.sol, 'momentum'); else { const bal = c.holders.get(r.w) || 0; if (bal > 0) sellAs(c, r.w, bal * r.fr); }
      c.offS = (c.offS || 0) + (c.vSol - before);
    }
    const quiet = Sim.t - (c.lastRT || c.born);
    if (!c.dead && quiet > 420000 && Sim.t > (c.keepUntil || 0) && !kept(c) && !(c.rx && c.rx.length)) c.dead = true;
  }

  Sim.net = null; // set by the multiplayer layer
  Sim.cmd = m => Sim.net ? Sim.net(m) : Promise.resolve(Sim.exec(m));

  const SKIP = { rq: 1, keep: 1, el: 1 };
  function graph(root) {
    const cnt = new Map();
    (function walk(v) { if (!v || typeof v !== 'object') return; const n = (cnt.get(v) || 0) + 1; cnt.set(v, n); if (n > 1) return;
      if (v instanceof Map) { for (const [k, x] of v) { walk(k); walk(x); } } else if (v instanceof Set) { for (const x of v) walk(x); } else if (Array.isArray(v)) { for (const x of v) walk(x); } else for (const k in v) if (k[0] !== '_' && !SKIP[k]) walk(v[k]); })(root);
    const ids = new Map(); let n = 0;
    const E = v => {
      if (v === null || typeof v !== 'object') { if (typeof v === 'number' && !isFinite(v)) return { $n: String(v) }; return typeof v === 'function' ? undefined : v; }
      if (ids.has(v)) return { $r: ids.get(v) };
      let id = 0; if (cnt.get(v) > 1) { id = ++n; ids.set(v, id); }
      let o;
      if (v instanceof Map) o = { $m: Array.from(v, ([k, x]) => [E(k), E(x)]) };
      else if (v instanceof Set) o = { $s: Array.from(v, E) };
      else if (Array.isArray(v)) { if (!id) return v.map(E); o = { $a: v.map(E) }; }
      else { o = {}; for (const k in v) { if (k[0] === '_' || SKIP[k]) continue; let x = v[k]; if (typeof x === 'function' || x === undefined) continue; if (k === 'cm' && Array.isArray(x)) x = x.slice(0, 12); o[k] = E(x); } }
      if (id) o.$i = id; return o;
    };
    return E(root);
  }
  function ungraph(root) {
    const ids = new Map();
    const D = v => {
      if (v === null || typeof v !== 'object') return v;
      if (Array.isArray(v)) return v.map(D);
      if (v.$n) return Number(v.$n);
      if (v.$r) return ids.get(v.$r);
      let o;
      if (v.$m) { o = new Map(); if (v.$i) ids.set(v.$i, o); for (const [k, x] of v.$m) o.set(D(k), D(x)); return o; }
      if (v.$s) { o = new Set(); if (v.$i) ids.set(v.$i, o); for (const x of v.$s) o.add(D(x)); return o; }
      if (v.$a) { o = []; if (v.$i) ids.set(v.$i, o); for (const x of v.$a) o.push(D(x)); return o; }
      o = {}; if (v.$i) ids.set(v.$i, o); for (const k in v) if (k !== '$i') o[k] = D(v[k]); return o;
    };
    return D(root);
  }
  const STATE = ['mirror', 'MIR', 'coins', 'list', 'pool', 'poolUnused', 'poolKeys', 'solUsd', 'liveSol', 'act', 'chat', 'mode', 'era', 'heat', 'rep', 'devName', 'launched', 'nextSpawn', 'txWindow', 'spawnTimes', 'PW', 'BY', 'DEVS', 'PL', 'ph', 't'];
  Sim.dump = () => { const S = {}; STATE.forEach(k => S[k] = Sim[k]); return graph({ S, cmId, tradeId, v: 1 }); };
  Sim.load = d => {
    const o = ungraph(d); STATE.forEach(k => { if (o.S[k] !== undefined) Sim[k] = o.S[k]; });
    cmId = o.cmId || cmId; tradeId = o.tradeId || tradeId;
    for (const c of Sim.list) { c.rq = []; c.keep = false; if (!c.cm) c.cm = []; }
  };
  Sim.ck = () => {
    let h = 2166136261 | 0; const mix = x => { const s = typeof x === 'number' ? x.toPrecision(11) : String(x); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } };
    mix(Sim.list.length); mix(Sim.launched); mix(tradeId); mix(Sim.nextSpawn);
    for (const c of Sim.list) { mix(c.id); mix(c.vSol); mix(c.vTok); mix(c.holders.size); mix(c.buys + c.sells); }
    let pb = 0; for (const p of Sim.PW.values()) pb += p.bank; mix(pb);
    return (h >>> 0).toString(36);
  };

  G.Sim = Sim;
})(typeof window !== 'undefined' ? window : globalThis);
