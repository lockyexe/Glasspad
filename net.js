/* Glasspad network adapter: one small API, two backends.
   - Supabase (real, free): Postgres tables + Realtime broadcast/presence + anonymous auth
   - Mock (ws://…, key "mock"): a local test server with the same behaviour */
(function () {
  'use strict';
  const Net = window.Net = {};
  Net.cfg = () => { let s = {}; try { s = JSON.parse(localStorage.getItem('gp_server') || '{}') || {}; } catch (e) { } const c = window.GP_SERVER || {}; return { url: (s.url || c.url || '').trim(), key: (s.key || c.key || '').trim() }; };
  Net.setCfg = (url, key) => { try { localStorage.setItem('gp_server', JSON.stringify({ url: url.trim(), key: key.trim() })); } catch (e) { } };
  Net.connect = cfg => /^wss?:\/\//.test(cfg.url) ? Mock(cfg.url) : Supa(cfg.url, cfg.key);
  const err = e => { const x = new Error((e && (e.message || e.error_description || e.msg)) || String(e)); x.code = e && e.code; return x; };

  // ---------------- Supabase ----------------
  function Supa(url, key) {
    if (!window.supabase) throw new Error('Supabase library missing');
    if (!/^https:\/\/.+/.test(url)) throw new Error('Project URL must start with https://');
    const sb = window.supabase.createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'gp_sb' }, realtime: { params: { eventsPerSecond: 40 } } });
    const B = { kind: 'supabase', sb };
    const q0 = (q, o) => {
      o = o || {};
      for (const k in (o.eq || {})) q = q.eq(k, o.eq[k]);
      for (const k in (o.neq || {})) q = q.neq(k, o.neq[k]);
      for (const k in (o.in || {})) q = q.in(k, o.in[k]);
      for (const k in (o.gt || {})) q = q.gt(k, o.gt[k]);
      for (const k in (o.lt || {})) q = q.lt(k, o.lt[k]);
      for (const k in (o.ilike || {})) q = q.ilike(k, o.ilike[k]);
      if (o.not_null) q = q.not(o.not_null, 'is', null);
      if (o.or) q = q.or(o.or);
      return q;
    };
    B.session = async () => { const { data } = await sb.auth.getSession(); return data && data.session ? { uid: data.session.user.id } : null; };
    B.anon = async () => {
      const { data, error } = await sb.auth.signInAnonymously();
      if (error) { const e = err(error); if (/anonymous/i.test(e.message)) e.message = 'Anonymous sign-ins are off. In Supabase: Authentication → Sign In / Providers → turn on "Allow anonymous sign-ins".'; throw e; }
      return { uid: data.user.id };
    };
    B.signOut = async () => { try { await sb.auth.signOut(); } catch (e) { } };
    B.rpc = async (fn, a) => { const { data, error } = await sb.rpc(fn, a || {}); if (error) throw err(error); return data; };
    B.select = async (t, o) => { o = o || {}; let q = q0(sb.from(t).select(o.cols || '*'), o); if (o.order) q = q.order(o.order[0], { ascending: !!o.order[1] }); if (o.limit) q = q.limit(o.limit); const { data, error } = await q; if (error) throw err(error); return data || []; };
    B.insert = async (t, row) => { const { data, error } = await sb.from(t).insert(row).select(); if (error) throw err(error); return data || []; };
    B.update = async (t, patch, o) => { const { error } = await q0(sb.from(t).update(patch), { eq: o }); if (error) throw err(error); };
    B.upsert = async (t, row) => { const { error } = await sb.from(t).upsert(row); if (error) throw err(error); };
    B.remove = async (t, o) => { const { error } = await q0(sb.from(t).delete(), o); if (error) throw err(error); };
    B.listen = (t, cb) => { const ch = sb.channel('db_' + t + '_' + Math.random().toString(36).slice(2, 8)).on('postgres_changes', { event: '*', schema: 'public', table: t }, p => cb(p.eventType, p.new, p.old)).subscribe(); return () => sb.removeChannel(ch); };
    B.channel = (name, me) => {
      const ch = sb.channel(name, { config: { broadcast: { self: false, ack: false }, presence: { key: me.uid } } });
      const api = {
        on(ev, cb) { ch.on('broadcast', { event: ev }, m => cb(m.payload)); return api; },
        onPresence(cb) { ch.on('presence', { event: 'sync' }, () => { const st = ch.presenceState(); cb(Object.keys(st).map(k => st[k][st[k].length - 1]).filter(Boolean)); }); return api; },
        subscribe() { return new Promise((res, rej) => { let done = false; ch.subscribe(s => { if (api.onStatus) api.onStatus(s); if (s === 'SUBSCRIBED' && !done) { done = true; res(); } else if ((s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') && !done) { done = true; rej(new Error('Realtime ' + s)); } }); }); },
        track(state) { return ch.track(state); },
        send(ev, payload) { return ch.send({ type: 'broadcast', event: ev, payload }); },
        leave() { return sb.removeChannel(ch); }
      };
      return api;
    };
    return B;
  }

  // ---------------- Mock (local test server) ----------------
  function Mock(url) {
    let ws, seq = 0, uid = null; try { uid = localStorage.getItem('gp_mock_uid'); } catch (e) { }
    const wait = {}, subs = {}, chans = {};
    let ready = null;
    const open = () => ready = new Promise((res, rej) => {
      ws = new WebSocket(url); ws.onopen = () => res(); ws.onerror = () => rej(new Error('Cannot reach server'));
      ws.onclose = () => { ready = null; setTimeout(() => { open().then(() => { if (uid) call('hello', {}); Object.keys(subs).forEach(t => call('listen', { t })); Object.keys(chans).forEach(n => chans[n].st && call('join', { ch: n, state: chans[n].st })); }).catch(() => { }); }, 800); };
      ws.onmessage = e => {
        const m = JSON.parse(e.data);
        if (m.re) { const w = wait[m.re]; delete wait[m.re]; if (w) m.err ? w[1](new Error(m.err)) : w[0](m.data); }
        else if (m.ev === 'change') (subs[m.t] || []).forEach(cb => cb(m.type, m.new, m.old));
        else if (m.ev === 'bc') { const c = chans[m.ch]; if (c) (c.h[m.name] || []).forEach(cb => cb(m.payload)); }
        else if (m.ev === 'pres') { const c = chans[m.ch]; if (c) c.p.forEach(cb => cb(m.list)); }
      };
    });
    const call = async (op, a) => { if (!ready) open(); await ready; const id = ++seq; return new Promise((res, rej) => { wait[id] = [res, rej]; ws.send(JSON.stringify(Object.assign({ id, op, uid }, a))); }); };
    const B = { kind: 'mock' };
    B.session = async () => { if (!uid) return null; try { await call('hello', {}); return { uid }; } catch (e) { return null; } };
    B.anon = async () => { const r = await call('anon', {}); uid = r.uid; try { localStorage.setItem('gp_mock_uid', uid); } catch (e) { } await call('hello', {}); return { uid }; };
    B.signOut = async () => { uid = null; try { localStorage.removeItem('gp_mock_uid'); } catch (e) { } };
    B.rpc = (fn, args) => call('rpc', { fn, args: args || {} });
    B.select = (t, o) => call('select', { t, o: o || {} });
    B.insert = (t, row) => call('insert', { t, row });
    B.update = (t, patch, eq) => call('update', { t, patch, eq });
    B.upsert = (t, row) => call('upsert', { t, row });
    B.remove = (t, o) => call('remove', { t, o });
    B.listen = (t, cb) => { (subs[t] = subs[t] || []).push(cb); call('listen', { t }); return () => { }; };
    B.channel = name => {
      const c = chans[name] = { h: {}, p: [], st: null };
      const api = {
        on(ev, cb) { (c.h[ev] = c.h[ev] || []).push(cb); return api; },
        onPresence(cb) { c.p.push(cb); return api; },
        subscribe() { return call('sub', { ch: name }); },
        track(state) { c.st = state; return call('join', { ch: name, state }); },
        send(ev, payload) { return call('bc', { ch: name, name: ev, payload }); },
        leave() { return call('leave', { ch: name }); }
      };
      return api;
    };
    return B;
  }
})();
