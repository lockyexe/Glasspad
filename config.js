/* Server config. Paste your Supabase Project URL and anon/publishable key here (or enter them in the app once). */
window.GP_SERVER = { url: 'https://owregguyzbcyrhrajfcw.supabase.co', key: 'sb_publishable__cTmHkGA5ZxdsFeEOaIoIQ_aJP01BYe' };
(function () {
  try { localStorage.removeItem('gp_sec'); } catch (e) { }
  let s = {}; try { s = JSON.parse(localStorage.getItem('gp_server') || '{}') || {}; } catch (e) { }
  let ls = null; try { ls = localStorage.getItem('gp_solo'); } catch (e) { }
  const solo = /[?&]solo=1/.test(location.search) || ls === '1';
  window.MP = { solo, url: s.url || window.GP_SERVER.url };
})();
