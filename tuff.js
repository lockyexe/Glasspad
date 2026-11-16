/* Ticker tape: a live strip of what's happening (real launches, rugs, bonds, big moves). Cheap: one transform animation. */
(function () {
  'use strict';
  const A = window.App, Sim = window.Sim; if (!A || !Sim) return;
  const hdr = document.getElementById('hdr'); if (!hdr) return;
  const tape = document.createElement('div'); tape.id = 'tape'; tape.innerHTML = '<div class="tp-in" id="tpIn"></div>'; hdr.after(tape);
  const IT = []; const push = (ic, txt, id, cls) => { IT.unshift({ ic, txt, id, cls }); if (IT.length > 16) IT.length = 16; };
  const oEv = Sim.onEvent; Sim.onEvent = function (c, icon, text) { if (oEv) oEv.apply(this, arguments); try { if (/rugged|dumped/i.test(text)) push('🚩', '$' + c.sym + ' rugged', c.id, 'dn'); else if (/Bonded/.test(text)) push('🎓', '$' + c.sym + ' bonded', c.id, 'up'); else if (/KOL/.test(text)) push('📣', '$' + c.sym + ' called by a KOL', c.id, ''); else if (/boost/i.test(text)) push('⚡', '$' + c.sym + ' boosted', c.id, ''); } catch (e) { } };
  let seen = new Set();
  function build() {
    const live = Sim.list.filter(c => !c.dead);
    live.filter(c => Sim.t - c.born < 60000 && !seen.has(c.id)).slice(0, 3).forEach(c => { seen.add(c.id); push(c.mir ? '🔴' : '🆕', (c.mir ? 'LIVE launch ' : 'New ') + '$' + c.sym, c.id, ''); });
    if (seen.size > 500) seen = new Set();
    const movers = live.filter(c => !c.rug).map(c => [c, Sim.change(c, 300)]).filter(x => Math.abs(x[1]) > 40).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 4);
    const items = IT.concat(movers.map(([c, ch]) => ({ ic: ch > 0 ? '🚀' : '📉', txt: '$' + c.sym + ' ' + (ch > 0 ? '+' : '') + ch.toFixed(0) + '%', id: c.id, cls: ch > 0 ? 'up' : 'dn' })));
    items.unshift({ ic: '◎', txt: 'SOL $' + Sim.solUsd.toFixed(2), id: '', cls: '' });
    const html = items.map(x => '<span class="tp-it ' + x.cls + '" data-id="' + x.id + '">' + x.ic + ' ' + A.esc(x.txt) + '</span>').join('<i>•</i>');
    const el = document.getElementById('tpIn'); el.innerHTML = html + '<i>•</i>' + html; // doubled for a seamless loop
    el.style.animationDuration = Math.max(20, items.length * 4.5) + 's';
  }
  build(); setInterval(() => { if (!window.IDLE) build(); }, 9000);
  tape.addEventListener('click', e => { const t = e.target.closest('[data-id]'); if (!t || !t.dataset.id) return; const c = Sim.coins.get(t.dataset.id); if (c) A.openToken(c); });
})();
