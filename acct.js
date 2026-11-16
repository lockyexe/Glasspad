/* Account + server screens (shown before you can play). */
(function () {
  'use strict';
  const Acct = window.Acct = {};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const AV = ['🐸', '🦊', '🐼', '🐯', '🦁', '🐵', '🐧', '🦄', '👽', '🤖', '🐺', '🐲', '😎', '🥷', '🧠', '💎', '🚀', '🐋'];
  function box() { let o = document.getElementById('acct'); if (!o) { o = document.createElement('div'); o.id = 'acct'; document.body.appendChild(o); } return o; }
  const LOGO = '<div class="ac-logo"><span class="lg-mark"></span><b>glass</b><span>pad</span></div>';
  Acct.show = html => { const lk = document.getElementById('loader'); if (lk) lk.remove(); const o = box(); o.innerHTML = '<div class="ac-box">' + LOGO + html + '</div>'; o.classList.add('on'); return o; };
  Acct.hide = () => { const o = document.getElementById('acct'); if (o) o.classList.remove('on'); };
  Acct.busy = t => Acct.show('<div class="ac-spin"></div><p class="ac-sub">' + esc(t) + '</p>');
  Acct.error = (t, canServer) => new Promise(res => {
    const o = Acct.show('<div class="ac-err big">⚠️ ' + esc(t) + '</div><button class="ac-go" data-a="retry">Try again</button>' + (canServer ? '<button class="ac-link" data-a="server">Change server</button>' : ''));
    o.querySelectorAll('button').forEach(b => b.onclick = () => res(b.dataset.a));
  });
  Acct.serverSetup = msg => new Promise(res => {
    const c = window.Net ? Net.cfg() : { url: '', key: '' };
    const o = Acct.show('<h2>Connect your server</h2><p class="ac-sub">Accounts, the shared market and chat run on your free Supabase project. Paste its Project URL and anon (publishable) key. You only do this once.</p>' + (msg ? '<div class="ac-err">' + esc(msg) + '</div>' : '') +
      '<label>Project URL</label><input id="acUrl" placeholder="https://xxxx.supabase.co" value="' + esc(c.url) + '" autocomplete="off" autocapitalize="off" spellcheck="false">' +
      '<label>Anon / publishable key</label><input id="acKey" placeholder="eyJhbGciOi… or sb_publishable_…" value="' + esc(c.key) + '" autocomplete="off" autocapitalize="off" spellcheck="false">' +
      '<button class="ac-go" id="acSave">Connect</button>' +
      '<details class="ac-how"><summary>How do I get these? (5 min, free, no card)</summary><ol>' +
      '<li>Go to <b>supabase.com</b> → Start your project → sign in with GitHub or email.</li>' +
      '<li><b>New project</b>: any name, set a database password, pick a region near you, Create.</li>' +
      '<li><b>Authentication → Sign In / Providers</b> → turn on <b>Allow anonymous sign-ins</b> → Save.</li>' +
      '<li><b>SQL Editor → New query</b> → paste the setup SQL → <b>Run</b>. <button class="ac-copy" id="acCopy">📋 Copy setup SQL</button></li>' +
      '<li>Click <b>Connect</b> at the top of the project (or Project Settings → API keys). Copy the <b>Project URL</b> and the <b>anon / publishable</b> key into the boxes above.</li>' +
      '</ol><p>Friends use the same URL and key. Never paste the secret / service_role key here.</p></details>');
    const cp = o.querySelector('#acCopy'); if (cp) cp.onclick = () => { const t = window.GP_SQL || ''; const done = () => { cp.textContent = '✓ Copied'; setTimeout(() => cp.textContent = '📋 Copy setup SQL', 2000); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, () => fb()); else fb();
      function fb() { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(ta); ta.focus(); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { } ta.remove(); } };
    o.querySelector('#acSave').onclick = () => {
      const url = o.querySelector('#acUrl').value.trim().replace(/\/+$/, ''), key = o.querySelector('#acKey').value.trim();
      if (!/^(https:\/\/|wss?:\/\/)/.test(url)) return Acct.serverSetup('The URL should look like https://xxxx.supabase.co').then(res);
      if (key.length < 4) return Acct.serverSetup('Paste the anon key too').then(res);
      Net.setCfg(url, key); res();
    };
  });
  function wallet() { const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'; let s = ''; const r = new Uint32Array(44); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(r) : r.forEach((_, i) => r[i] = Math.random() * 4e9); for (let i = 0; i < 44; i++) s += B58[r[i] % 58]; return s; }
  Acct.auth = (B, note) => new Promise(res => {
    let tab = 'new', av = AV[Math.floor(Math.random() * AV.length)];
    const draw = (msg, keep) => {
      const v = keep || {};
      const o = Acct.show('<div class="ac-tabs"><button data-t="new"' + (tab === 'new' ? ' class="on"' : '') + '>Create account</button><button data-t="in"' + (tab === 'in' ? ' class="on"' : '') + '>Log in</button></div>' +
        (note ? '<p class="ac-sub">' + esc(note) + '</p>' : '') + (msg ? '<div class="ac-err">' + esc(msg) + '</div>' : '') +
        '<label>Username</label><div class="ac-row"><input id="acName" maxlength="16" placeholder="3–16 letters, numbers, _" value="' + esc(v.n || '') + '" autocomplete="off" autocapitalize="off" spellcheck="false"><span id="acFree"></span></div>' +
        '<label>Password</label><input id="acPass" type="password" maxlength="64" placeholder="at least 4 characters" value="' + esc(v.p || '') + '">' +
        (tab === 'new' ? '<label>Avatar</label><div class="ac-avs">' + AV.map(a => '<button data-av="' + a + '"' + (a === av ? ' class="on"' : '') + '>' + a + '</button>').join('') + '</div>' : '') +
        '<button class="ac-go" id="acGo">' + (tab === 'new' ? 'Create account & play' : 'Log in') + '</button>' +
        '<p class="ac-fine">' + (tab === 'new' ? 'Usernames are unique: once taken, nobody else can use it. Other players can see your balance, positions and posts.' : 'Logging in here moves your account to this phone.') + '</p>');
      o.querySelectorAll('.ac-tabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; draw(null, { n: o.querySelector('#acName').value, p: o.querySelector('#acPass').value }); });
      o.querySelectorAll('.ac-avs button').forEach(b => b.onclick = () => { av = b.dataset.av; o.querySelectorAll('.ac-avs button').forEach(x => x.classList.toggle('on', x === b)); });
      const nm = o.querySelector('#acName'), fr = o.querySelector('#acFree'); let tm = 0;
      nm.oninput = () => { clearTimeout(tm); fr.textContent = ''; fr.className = ''; const n = nm.value.trim(); if (tab !== 'new' || n.length < 3) return; if (!/^[A-Za-z0-9_]{3,16}$/.test(n)) { fr.textContent = 'letters, numbers, _'; fr.className = 'no'; return; }
        tm = setTimeout(() => B.rpc('name_free', { p_name: n }).then(ok => { if (nm.value.trim() !== n) return; fr.textContent = ok ? '✓ free' : '✕ taken'; fr.className = ok ? 'ok' : 'no'; }).catch(() => { }), 350); };
      o.querySelector('#acGo').onclick = async () => {
        const n = nm.value.trim(), p = o.querySelector('#acPass').value;
        if (!/^[A-Za-z0-9_]{3,16}$/.test(n)) return draw('Username must be 3–16 letters, numbers or _', { n, p });
        if (p.length < 4) return draw('Password must be at least 4 characters', { n, p });
        Acct.busy(tab === 'new' ? 'Creating @' + n + '…' : 'Logging in…');
        try {
          const prof = tab === 'new' ? await B.rpc('register', { p_name: n, p_pass: p, p_av: av, p_hue: Math.floor(Math.random() * 360), p_wallet: wallet() }) : await B.rpc('login', { p_name: n, p_pass: p });
          res(Array.isArray(prof) ? prof[0] : prof);
        } catch (e) { draw(String(e.message || e).replace(/^.*?:\s*(?=[A-Z])/, ''), { n, p }); }
      };
    };
    draw();
  });
})();
