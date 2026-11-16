/* iPhone / Safari support + boot watchdog (loaded first). */
(function () {
  'use strict';
  const ua = navigator.userAgent, isIOS = /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const root = document.documentElement; if (isIOS) root.classList.add('ios');
  if (window.navigator.standalone) root.classList.add('standalone');
  window.IOS_CLS = (isIOS ? ' ios' : '') + (window.navigator.standalone ? ' standalone' : '');
  // timestamps from the server (Safari is picky with 6-digit fractions)
  window.tparse = s => { if (!s) return 0; let t = Date.parse(s); if (isNaN(t)) t = Date.parse(String(s).replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1').replace(/\+00(:00)?$/, 'Z')); return isNaN(t) ? 0 : t; };
  // keyboard: keep the chat box above the iPhone keyboard
  const vv = window.visualViewport;
  if (vv) {
    const fit = () => {
      const c = document.getElementById('chat'); if (!c) return;
      if (c.classList.contains('on') && vv.height < window.innerHeight - 80) { c.style.height = vv.height + 'px'; c.style.top = vv.offsetTop + 'px'; c.style.bottom = 'auto'; const b = document.getElementById('chBody'); if (b) b.scrollTop = b.scrollHeight; }
      else { c.style.height = ''; c.style.top = ''; c.style.bottom = ''; }
    };
    vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit);
  }
  // boot watchdog: never sit on the loading screen silently
  const ERR = window.GP_ERR = []; window.GP_STAGE = 'starting scripts';
  window.gpStage = t => { window.GP_STAGE = t; const p = document.querySelector('#loader p'); if (p && !p._w) p.textContent = t + '…'; };
  addEventListener('error', e => { ERR.push((e.message || 'error') + ' (' + String(e.filename || '').split('/').pop() + ':' + e.lineno + ')'); });
  addEventListener('unhandledrejection', e => { const r = e.reason; ERR.push('promise: ' + (r && (r.message || r)) ); });
  setTimeout(function () {
    const l = document.getElementById('loader'); if (!l || l.classList.contains('off')) return;
    const p = l.querySelector('p'); if (!p) return;
    const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
    p._w = 1; p.innerHTML = 'Stuck at: <b>' + esc(window.GP_STAGE) + '</b>' + (ERR.length ? '<br><small style="color:#ff8fa3;display:block;margin-top:8px;word-break:break-word">' + ERR.slice(0, 4).map(esc).join('<br>') + '</small>' : '<br><small>Check your internet connection.</small>') +
      '<br><button onclick="location.reload()" style="margin-top:14px;padding:11px 20px;border-radius:13px;background:rgba(255,255,255,.14);color:#fff;font-weight:700">Reload</button>';
  }, 15000);
})();
