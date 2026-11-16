/* Settings card for the optional AI bot brain. */
(function () {
  'use strict';
  const B = window.Brain, A = window.App; if (!B || !A) return;
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const HELP = {
    off: 'Bots read your message and answer with the coin\'s real numbers. Works offline, unlimited.',
    groq: 'Get a free key at console.groq.com/keys (no card needed). Roughly 1,000 requests a day on the free plan.',
    gemini: 'Get a free key at aistudio.google.com/apikey. The free tier covers the Flash and Flash-Lite models.',
    openrouter: 'Get a free key at openrouter.ai/keys. Only models ending in ":free" are used (about 50 requests a day).',
    custom: 'Any OpenAI-compatible server, for example LM Studio or Ollama on your Wi-Fi.'
  };
  function render() {
    const C = B.ai.cfg(), on = C.prov !== 'off';
    $('#aiProv').value = C.prov; $('#aiKey').value = C.key || ''; $('#aiModel').value = C.model || ''; $('#aiBase').value = C.base || '';
    $$('.ai-k').forEach(el => el.style.display = on ? '' : 'none'); $$('.ai-c').forEach(el => el.style.display = C.prov === 'custom' ? '' : 'none');
    $('#aiD').textContent = on ? (C.key ? 'AI on, built-in brain takes over if it fails' : 'Paste a key to switch the AI on') : 'Built-in brain (offline, unlimited)';
    $('#aiHelp').textContent = HELP[C.prov] + (on ? ' Your key stays on this phone and is only sent to the provider you picked.' : '');
    $$('.sw[data-ai]').forEach(s => s.classList.toggle('on', !!C[s.dataset.ai]));
    stat();
  }
  function stat(msg) {
    const C = B.ai.cfg(), u = B.ai.usage();
    if (C.prov === 'off') return;
    $('#aiStat').textContent = msg || ((C.model || C.autoModel ? (C.model || C.autoModel) + ' · ' : '') + u.n + '/' + C.cap + ' today' + (B.ai.lastErr ? ' · last error: ' + B.ai.lastErr : B.ai.status === 'ok' ? ' · working ✓' : ''));
  }
  $('#aiProv').addEventListener('change', e => { B.ai.save({ prov: e.target.value, autoModel: '' }); render(); A.hap(6); });
  $('#aiKey').addEventListener('change', e => { B.ai.save({ key: e.target.value.trim(), autoModel: '' }); render(); });
  $('#aiModel').addEventListener('change', e => { B.ai.save({ model: e.target.value.trim(), autoModel: '' }); render(); });
  $('#aiBase').addEventListener('change', e => { B.ai.save({ base: e.target.value.trim(), autoModel: '' }); render(); });
  $$('.sw[data-ai]').forEach(s => s.addEventListener('click', () => { const k = s.dataset.ai, C = B.ai.cfg(); B.ai.save({ [k]: !C[k] }); render(); A.hap(8); A.SND.tap(); }));
  $('#aiTest').addEventListener('click', async () => {
    const C = B.ai.cfg(); if (!C.key) { A.toast('🔑', 'Paste a key first', null, 'bad'); return; }
    if (C.prov === 'custom' && !C.base) { A.toast('🔗', 'Add the base URL first', null, 'bad'); return; }
    stat('testing…'); $('#aiTest').disabled = true;
    try { const r = await B.ai.test(); stat(r.model + ' · works ✓'); A.toast('🧠', 'AI connected', '"' + r.sample.slice(0, 60) + '"', 'ok'); A.SND.ok(); }
    catch (e) { stat('failed: ' + String(e.message || e).slice(0, 120)); A.toast('⚠️', 'AI test failed', String(e.message || e).slice(0, 80), 'bad'); A.SND.err(); }
    $('#aiTest').disabled = false;
  });
  setInterval(() => { if (A.VIEW === 'set') stat(); }, 4000);
  render();
})();
