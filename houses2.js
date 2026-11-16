/* Glasspad real estate v2: 50 building types, each with its own builder (massing, roof, facade, setting),
   plus per-listing random variation (time of day, materials, proportions, plants, extras).
   Original drawings: no real building is copied. */
(function (G) {
  'use strict';
  const Art = G.Art; if (!Art) return;
  const shade = Art.shade;
  let uid = 90000;
  function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const f = n => (Math.round(n * 10) / 10).toString();
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------------- drawing context: sky, backdrop, helpers ----------------
  function ctx(h, set) {
    const R = rng(8100 + parseInt(String(h.id).replace(/\D/g, '') || '0', 10) * 1543 + (h.v || 0) * 7);
    const R2 = (a, b) => a + R() * (b - a), RI2 = (a, b) => Math.floor(R2(a, b + 1)), pk = a => a[Math.floor(R() * a.length)];
    const id = ++uid, tod = h.tod || 'day', night = tod === 'night', day = tod === 'day', sunset = tod === 'sunset';
    const lit = night ? .55 : sunset ? .3 : .04;
    const C = { R, R2, RI2, pk, id, tod, night, day, sunset, lit, h, set };
    C.r = (x, y, w, hh, fill, ex) => '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(Math.max(0, w)) + '" height="' + f(Math.max(0, hh)) + '" fill="' + fill + '"' + (ex || '') + '/>';
    C.P = (pts, fill, ex) => '<path d="M' + pts.map(p => f(p[0]) + ',' + f(p[1])).join(' L') + ' Z" fill="' + fill + '"' + (ex || '') + '/>';
    C.L = (pts, c, w, ex) => '<path d="M' + pts.map(p => f(p[0]) + ',' + f(p[1])).join(' L') + '" stroke="' + c + '" stroke-width="' + w + '" fill="none"' + (ex || '') + '/>';
    C.E = (cx, cy, rx, ry, fill, ex) => '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + fill + '"' + (ex || '') + '/>';
    C.G = 'url(#hg' + id + ')'; C.POOL = 'url(#hp' + id + ')'; C.WATER = 'url(#hw' + id + ')';
    C.wc = on => on ? '#ffd27a' : day ? '#9cc8ee' : sunset ? '#5a4a7a' : '#1c2340';
    C.win = (x, y, w, hh, on) => C.r(x, y, w, hh, C.wc(on === undefined ? R() < lit : on));
    C.grid = (x, y, w, hh, cols, rows, ww, wh, fr) => { let o = ''; cols = Math.max(1, cols | 0); rows = Math.max(1, rows | 0); const gx = (w - cols * ww) / (cols + 1), gy = (hh - rows * wh) / (rows + 1); for (let a = 0; a < rows; a++) for (let b = 0; b < cols; b++) { const X = x + gx + b * (ww + gx), Y = y + gy + a * (wh + gy); o += C.win(X, Y, ww, wh); if (fr) o += '<rect x="' + f(X - .8) + '" y="' + f(Y - .8) + '" width="' + f(ww + 1.6) + '" height="' + f(wh + 1.6) + '" fill="none" stroke="' + fr + '" stroke-width="1"/>'; } return o; };
    C.glass = (x, y, w, hh, n, mc) => { let o = C.r(x, y, w, hh, C.G); n = n || Math.max(1, Math.round(w / 14)); for (let k = 1; k < n; k++) o += C.L([[x + w * k / n, y], [x + w * k / n, y + hh]], mc || '#2a2e3a', 1.1); if (!day) o += C.r(x, y + hh * .55, w, hh * .45, '#ffd27a', ' opacity="' + (night ? .35 : .18) + '"'); return o; };
    C.glow = (cx, cy, rx, ry, op) => day ? '' : C.E(cx, cy, rx, ry, 'url(#hl' + id + ')', ' opacity="' + (op || .4) + '"');
    C.pool = (x, y, w, hh, rx) => C.r(x - 4, y - 2, w + 8, 3, '#d9d2ca') + '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(hh) + '" rx="' + (rx || 0) + '" fill="' + C.POOL + '"/>' + (night ? C.r(x, y, w, hh, '#6ff3ff', ' opacity=".25"') : '');
    C.door = (x, y, w, hh, c) => C.r(x, y - hh, w, hh, c || '#3a2a20') + C.r(x + w - 3, y - hh * .5, 1.5, 1.5, '#d4a64a');
    C.vegC = () => night ? '#0b1a12' : day ? pk(['#2f6b3a', '#2b5a2b', '#3a7a3f', '#3f7a32']) : '#1a1230';
    C.veg = (x, y, sc, kind) => {
      const col = C.vegC();
      if (kind === 'palm') { const t = [x + 8 * sc, y - 60 * sc]; let p = '<path d="M' + f(x) + ',' + f(y) + ' Q' + f(x + 2 * sc) + ',' + f(y - 30 * sc) + ' ' + f(t[0]) + ',' + f(t[1]) + '" stroke="' + col + '" stroke-width="' + f(3 * sc) + '" fill="none" stroke-linecap="round"/>'; [[-24, 8], [-15, -6], [0, -11], [15, -6], [24, 8], [-8, 12], [10, 12]].forEach(q => p += '<path d="M' + f(t[0]) + ',' + f(t[1]) + ' Q' + f(t[0] + q[0] * .5 * sc) + ',' + f(t[1] + q[1] * .2 * sc - 7 * sc) + ' ' + f(t[0] + q[0] * sc) + ',' + f(t[1] + q[1] * sc) + '" stroke="' + col + '" stroke-width="' + f(2.4 * sc) + '" fill="none" stroke-linecap="round"/>'); return p; }
      if (kind === 'pine') return C.P([[x, y], [x + 8 * sc, y - 30 * sc], [x + 16 * sc, y]], col) + C.P([[x + 2 * sc, y - 12 * sc], [x + 8 * sc, y - 38 * sc], [x + 14 * sc, y - 12 * sc]], col);
      if (kind === 'snowpine') return C.veg(x, y, sc, 'pine') + C.P([[x + 5 * sc, y - 26 * sc], [x + 8 * sc, y - 38 * sc], [x + 11 * sc, y - 26 * sc]], '#f4f7ff');
      if (kind === 'cypress') return C.E(x, y - 22 * sc, 5 * sc, 24 * sc, col);
      if (kind === 'cactus') return '<path d="M' + f(x) + ',' + f(y) + ' l0,' + f(-28 * sc) + ' M' + f(x) + ',' + f(y - 16 * sc) + ' q' + f(-9 * sc) + ',0 ' + f(-9 * sc) + ',' + f(-9 * sc) + ' M' + f(x) + ',' + f(y - 20 * sc) + ' q' + f(9 * sc) + ',0 ' + f(9 * sc) + ',' + f(-11 * sc) + '" stroke="#2f6b3a" stroke-width="' + f(5 * sc) + '" stroke-linecap="round" fill="none"/>';
      if (kind === 'bush') return C.E(x, y - 4 * sc, 10 * sc, 6 * sc, col);
      if (kind === 'maple') return C.r(x - 1.5 * sc, y - 14 * sc, 3 * sc, 14 * sc, '#3a2a1a') + C.E(x, y - 22 * sc, 14 * sc, 11 * sc, night ? '#2a0e14' : pk(['#c2352b', '#d9542b', '#b02a4a']));
      if (kind === 'flowers') { let o = ''; for (let k = 0; k < 6; k++) o += C.E(x + (k - 3) * 4 * sc, y - R2(1, 4) * sc, 1.8 * sc, 1.8 * sc, pk(['#ff5fa2', '#ffc21a', '#ffffff', '#ff7a1a'])); return o; }
      return C.E(x, y - 10 * sc, 12 * sc, 11 * sc, col) + C.r(x - 1.5 * sc, y - 4 * sc, 3 * sc, 6 * sc, '#3a2a1a');
    };
    C.trees = (n, kind, y, avoid0, avoid1, sc) => { let o = ''; for (let k = 0; k < n; k++) { let x = R2(8, 312), g = 0; while (x > avoid0 - 10 && x < avoid1 + 6 && g++ < 6) x = R2(8, 312); if (x > avoid0 - 10 && x < avoid1 + 6) continue; o += C.veg(x, y, R2(.6, 1.1) * (sc || 1), kind); } return o; };
    C.chimney = (x, y, w, hh, c, smoke) => C.r(x, y - hh, w, hh, c || '#6a4a3a') + C.r(x - 1, y - hh - 2, w + 2, 3, shade(c || '#6a4a3a', -.3)) + (smoke ? '<path d="M' + f(x + w / 2) + ',' + f(y - hh - 4) + ' q-6,-8 0,-14 q6,-6 0,-14" stroke="#e8ecf5" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>' : '');
    C.gable = (x, y, w, hh, c, ov) => C.P([[x - (ov || 5), y], [x + w / 2, y - hh], [x + w + (ov || 5), y]], c);
    C.hip = (x, y, w, hh, c, ov) => C.P([[x - (ov || 6), y], [x + w * .22, y - hh], [x + w * .78, y - hh], [x + w + (ov || 6), y]], c);
    C.tile = (x, y, w, hh, ov) => { let o = C.hip(x, y, w, hh, '#b4532d', ov); for (let k = 1; k < 5; k++) o += C.L([[x - (ov || 6) + k * 1.3, y - hh * k / 5], [x + w + (ov || 6) - k * 1.3, y - hh * k / 5]], '#8a3a1d', .8); return o; };
    C.slab = (x, y, w, c) => C.r(x, y - 4, w, 4, c || '#e9e4dc');
    C.rail = (x, y, w, c) => C.r(x, y - 7, w, 7, c || 'rgba(200,225,255,.35)') + C.L([[x, y - 7], [x + w, y - 7]], '#e8ecf5', 1);
    C.nb = (x, w, hh, col) => C.r(x, gY() - hh, w, hh, col) + C.grid(x, gY() - hh, w, hh, Math.floor(w / 11), Math.floor(hh / 11), 4, 4);
    const gY = () => C.gY;
    // ---- defs + sky ----
    const SK = { day: [pk(['#3ea0ff', '#4aa8ff', '#5ab0f0']), '#9ad3ff', '#e6f6ff'], sunset: [pk(['#2b1a55', '#3a1d5c', '#24124a']), pk(['#e2577a', '#f06a5a', '#d9487d']), pk(['#ffb36b', '#ffc27a', '#ff9f6b'])], night: ['#03040b', pk(['#0c1433', '#101a3d', '#0a1029']), '#1b2550'] }[tod];
    C.defs = '<defs><linearGradient id="hs' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + SK[0] + '"/><stop offset=".62" stop-color="' + SK[1] + '"/><stop offset="1" stop-color="' + SK[2] + '"/></linearGradient>' +
      '<linearGradient id="hg' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + (day ? '#d6ecff' : '#ffe6a8') + '"/><stop offset="1" stop-color="' + (day ? '#7fb2df' : '#e49a3c') + '"/></linearGradient>' +
      '<linearGradient id="hp' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ff3ff"/><stop offset="1" stop-color="#1376d6"/></linearGradient>' +
      '<linearGradient id="hw' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (night ? '#14244d' : set === 'lagoon' ? '#3fd6e6' : '#2b7bd6') + '"/><stop offset="1" stop-color="' + (night ? '#060c20' : set === 'lagoon' ? '#1491b8' : '#0b2d66') + '"/></linearGradient>' +
      '<radialGradient id="hl' + id + '"><stop offset="0" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>';
    let s = '<rect width="320" height="180" fill="url(#hs' + id + ')"/>';
    if (night) for (let i = 0; i < RI2(18, 40); i++) s += '<circle cx="' + f(R2(0, 320)) + '" cy="' + f(R2(0, 90)) + '" r="' + f(R2(.4, 1.2)) + '" fill="#fff" opacity="' + f(R2(.3, .9)) + '"/>';
    const sx = R2(24, 296);
    s += day ? '<circle cx="' + f(sx) + '" cy="' + f(R2(20, 40)) + '" r="' + f(R2(11, 16)) + '" fill="#fff6c9"/>' : sunset ? '<circle cx="' + f(sx) + '" cy="' + f(R2(100, 124)) + '" r="' + f(R2(18, 30)) + '" fill="#ffd27a" opacity=".85"/>' : '<circle cx="' + f(sx) + '" cy="' + f(R2(18, 36)) + '" r="' + f(R2(7, 11)) + '" fill="#f4f1e0" opacity=".9"/>';
    if (day && R() < .6) for (let k = 0; k < RI2(1, 3); k++) { const cx = R2(20, 300), cy = R2(18, 60); s += C.E(cx, cy, R2(16, 30), R2(5, 8), '#ffffff', ' opacity=".75"') + C.E(cx + 10, cy - 4, R2(10, 16), R2(5, 8), '#ffffff', ' opacity=".75"'); }
    // ---- backdrop per setting ----
    let gy = 152; const dn = (a, b, c) => day ? a : night ? c : b;
    const skyline = (base, op) => { let bx = -10; while (bx < 330) { const bw = R2(14, 32), bh = R2(24, 90), by = base - bh; s += C.r(bx, by, bw, bh, dn('#7f93b8', '#2a1e48', '#141a33'), ' opacity="' + (op || (day ? .55 : .95)) + '"'); if (!day) s += C.grid(bx, by + 4, bw, bh - 8, Math.floor(bw / 8), Math.floor(bh / 9), 2.5, 2.5); bx += bw + R2(-2, 6); } };
    if (set === 'city' || set === 'canal') { skyline(R2(150, 160)); gy = set === 'canal' ? R2(136, 142) : R2(156, 166); }
    else if (set === 'coast' || set === 'cliff') { const hz = R2(106, 120); if (set === 'coast') skyline(hz, day ? .4 : .8); s += C.r(0, hz, 320, 180 - hz, C.WATER); gy = R2(148, 158); }
    else if (set === 'sea' || set === 'lagoon') { const hz = R2(92, 106); s += C.r(0, hz, 320, 180 - hz, C.WATER); gy = R2(128, 136); for (let k = 0; k < 10; k++) { const wx = R2(0, 300), wy = R2(hz + 10, 176); s += C.L([[wx, wy], [wx + R2(8, 20), wy]], '#ffffff', .8, ' opacity=".3"'); } }
    else if (set === 'hills' || set === 'suburb' || set === 'country') { for (let k = 0; k < 2; k++) { const y0 = R2(96, 120) + k * 14; s += '<path d="M0,' + f(y0) + ' Q' + f(R2(40, 120)) + ',' + f(y0 - R2(10, 34)) + ' ' + f(R2(150, 190)) + ',' + f(y0 - R2(-6, 14)) + ' T320,' + f(y0 - R2(0, 20)) + ' L320,180 L0,180 Z" fill="' + (set === 'country' && k ? dn('#9bb85a', '#4a3a48', '#121a22') : dn(k ? '#4f8a3f' : '#7da86a', k ? '#2a1638' : '#3a2048', k ? '#0d1424' : '#141c33')) + '"/>'; } if (!day && set !== 'country') for (let i = 0; i < 40; i++) s += '<circle cx="' + f(R2(0, 320)) + '" cy="' + f(R2(132, 150)) + '" r=".9" fill="#ffd27a" opacity=".7"/>'; gy = R2(148, 158); }
    else if (set === 'mountain' || set === 'snow') { let x = -20; const pts = [[-20, 130]]; while (x < 340) { x += R2(30, 70); pts.push([x, R2(24, 86)]); x += R2(20, 50); pts.push([x, R2(88, 122)]); } pts.push([340, 180], [-20, 180]); s += C.P(pts, dn('#6c7fa8', '#4a3a6e', '#26325e')); pts.forEach((p, i) => { if (i && i < pts.length - 2 && p[1] < 80) s += C.P([[p[0] - 12, p[1] + 16], [p[0], p[1]], [p[0] + 12, p[1] + 16]], '#f4f7ff', ' opacity=".9"'); }); s += '<path d="M0,' + f(R2(138, 148)) + ' Q160,' + f(R2(122, 138)) + ' 320,' + f(R2(138, 150)) + ' L320,180 L0,180 Z" fill="' + (set === 'snow' ? '#eef3fd' : dn('#4f8a3f', '#3a2a48', '#16202a')) + '"/>'; gy = R2(150, 158); }
    else if (set === 'desert') { for (let k = 0; k < RI2(1, 3); k++) { const mx = R2(0, 260), mw = R2(40, 100), mh = R2(18, 50); s += C.P([[mx, 130], [mx + 10, 130 - mh], [mx + mw - 10, 130 - mh], [mx + mw, 130]], night ? '#3a2a30' : '#c27b4a'); } s += '<path d="M0,' + f(R2(124, 136)) + ' Q80,' + f(R2(108, 124)) + ' 160,' + f(R2(120, 134)) + ' T320,' + f(R2(116, 130)) + ' L320,180 L0,180 Z" fill="' + (night ? '#3a2a24' : '#d9a066') + '"/>'; gy = R2(148, 158); }
    else if (set === 'lake') { let x = -10; while (x < 330) { s += C.veg(x, 116, R2(.6, 1.2), 'pine'); x += R2(10, 22); } s += C.r(0, 116, 320, 64, C.WATER); gy = R2(128, 136); }
    else if (set === 'forest') { for (let row = 0; row < 2; row++) { let x = -10; while (x < 330) { s += C.veg(x, 128 + row * 10, R2(.8, 1.5), 'pine'); x += R2(8, 18); } } gy = R2(150, 158); }
    else { /* island */ const hz = R2(92, 104); s += C.r(0, hz, 320, 90, C.WATER); gy = 124; }
    C.gY = gy;
    // ---- ground ----
    const gcol = { city: '#14161f', canal: '#2a2e3a', coast: '#1a1d28', cliff: '#1a1d28', hills: dn('#4f8a3f', '#2a1638', '#18122a'), suburb: dn('#5b9a4a', '#2a2040', '#141c26'), country: dn('#7da84a', '#3a2a40', '#141c20'), mountain: dn('#4f8a3f', '#3a2a48', '#16202a'), snow: '#eef3fd', desert: night ? '#2a1d18' : '#e8b980', lake: dn('#3f6a3a', '#2a2a3a', '#142018'), forest: dn('#3f6a3a', '#2a2238', '#101a14'), sea: '#000', lagoon: '#000', island: '#f3dca8' }[set];
    if (set === 'city' || set === 'suburb' || set === 'lake' || set === 'forest' || set === 'country' || set === 'canal') s += C.r(0, gy, 320, 180 - gy, gcol);
    if (set === 'canal') { s += C.r(0, gy + 12, 320, 180 - gy - 12, C.WATER) + C.r(0, gy + 10, 320, 3, '#5a4a40'); }
    if (set === 'coast') s += '<path d="M0,' + f(gy - 3) + ' Q160,' + f(gy - 10) + ' 320,' + f(gy - 2) + ' L320,180 L0,180 Z" fill="' + (night ? '#8a7a5a' : '#f3d9a4') + '"/>';
    if (set === 'island') { const iw = R2(116, 146), icx = R2(140, 180); s += C.E(icx, 132, iw + 20, 22, '#5fd1e6', ' opacity=".45"') + C.E(icx, 126, iw, 16, gcol) + C.E(icx, 122, iw * .72, 9, '#4f9d4a'); }
    C.s = s;
    return C;
  }

  // ---------------- the 50 building types ----------------
  // each: l label, c category, set settings, p places, base price, beds, sqft, n names, b builder(C) -> svg string
  const WALLS = ['#efe9e2', '#f6f2ee', '#e9e4dc', '#d8d2c6', '#c9d4e0', '#f0e2cf', '#e2d3c2'];
  const AR = {};
  const add = (k, o) => AR[k] = o;
  const cx = C => 160 + C.R2(-24, 24);

  // ===== Towers =====
  add('glassTower', { l: 'Glass skyscraper', c: 'tower', set: ['city', 'coast'], p: ['New York', 'Dubai', 'Singapore', 'Toronto', 'Miami'], base: 2.4e6, beds: [2, 4], sqft: [1600, 4200], n: ['Sky Glass Residence', 'Crystal Tower Unit', 'Glass Spire Home'], b: C => {
    const tw = C.R2(56, 80), th = C.R2(116, C.gY - 12), x = cx(C) - tw / 2, y = C.gY - th, col = C.pk(['#1d2747', '#22304f', '#2b3f5f', '#1a3a4a']);
    let o = C.nb(C.R2(10, 50), C.R2(30, 44), C.R2(50, 80), shade(col, -.3)) + C.nb(C.R2(240, 270), C.R2(30, 44), C.R2(40, 90), shade(col, -.35));
    const top = C.pk(['slope', 'flat', 'antenna', 'notch']);
    const pts = top === 'slope' ? [[x, y + 14], [x + tw, y], [x + tw, C.gY], [x, C.gY]] : top === 'notch' ? [[x, y], [x + tw * .6, y], [x + tw * .6, y + 10], [x + tw, y + 10], [x + tw, C.gY], [x, C.gY]] : [[x, y], [x + tw, y], [x + tw, C.gY], [x, C.gY]];
    o += C.P(pts, col) + C.P(pts, C.G, ' opacity=".38"');
    for (let xx = x + C.R2(5, 8); xx < x + tw - 2; xx += C.R2(6, 9)) o += C.L([[xx, y + (top === 'slope' ? 14 * (1 - (xx - x) / tw) : 0)], [xx, C.gY]], shade(col, .35), .8, ' opacity=".55"');
    for (let yy = y + 16; yy < C.gY - 4; yy += 7) { o += C.L([[x, yy], [x + tw, yy]], shade(col, -.3), .8); if (C.R() < C.lit * 1.4) o += C.r(x + C.R2(2, tw - 12), yy + 1, C.R2(6, 12), 5, '#ffd27a', ' opacity=".85"'); }
    if (top === 'antenna') o += C.L([[x + tw / 2, y], [x + tw / 2, y - C.R2(14, 24)]], '#9aa0b0', 1.6) + (C.day ? '' : C.E(x + tw / 2, y - 22, 1.6, 1.6, '#ff3355'));
    return o + C.glow(x + tw / 2, y + 20, tw, 40, .3);
  } });
  add('twistTower', { l: 'Twisting tower', c: 'tower', set: ['city', 'coast'], p: ['Dubai', 'Singapore', 'Toronto', 'Miami'], base: 3e6, beds: [2, 4], sqft: [1800, 4600], n: ['Twist Residence', 'Helix Tower Home', 'Spiral Sky Unit'], b: C => {
    const n = C.RI2(16, 22), fh = (C.gY - C.R2(14, 26)) / n, w = C.R2(48, 62), c0 = cx(C), amp = C.R2(6, 12), ph = C.R2(0, 6), slab = C.pk(['#e9e4dc', '#d8dbe6', '#c9d4e0']);
    let o = ''; for (let k = 0; k < n; k++) { const y = C.gY - (k + 1) * fh, ww = w * (1 - k * .008), x = c0 - ww / 2 + Math.sin(k * .3 + ph) * amp; o += C.r(x, y + 2, ww, fh - 2, C.G) + C.r(x - 2, y, ww + 4, 2.4, slab); if (C.R() < C.lit) o += C.r(x + C.R2(3, ww - 12), y + 3, C.R2(5, 10), fh - 4, '#ffd27a', ' opacity=".8"'); }
    return o + C.glow(c0, C.gY - n * fh * .6, 60, 60, .25);
  } });
  add('decoTower', { l: 'Art-deco setback tower', c: 'tower', set: ['city'], p: ['New York', 'Chicago', 'London'], base: 2.2e6, beds: [2, 4], sqft: [1500, 3800], n: ['Deco Tower Home', 'Setback Residence', 'Gilded Spire Unit'], b: C => {
    const c0 = cx(C), col = C.pk(['#c9b48a', '#b8a07a', '#2a2e3a', '#8a8f9c']), tiers = C.RI2(3, 4); let w = C.R2(76, 96), y = C.gY, o = '';
    for (let t = 0; t < tiers; t++) { const th = t === 0 ? C.R2(44, 56) : C.R2(20, 30), x = c0 - w / 2; y -= th; o += C.r(x, y, w, th, shade(col, -t * .05)); for (let xx = x + 5; xx < x + w - 4; xx += 8) o += C.r(xx, y + 3, 3, th - 4, C.wc(C.R() < C.lit)); for (let xx = x + 9; xx < x + w - 4; xx += 8) o += C.L([[xx, y], [xx, y + th]], shade(col, .25), 1.2); w *= C.R2(.66, .76); }
    o += C.P([[c0 - w / 2, y], [c0, y - C.R2(22, 34)], [c0 + w / 2, y]], C.pk(['#d4a64a', '#c9ced9', shade(col, .2)])) + C.L([[c0, y - 20], [c0, y - C.R2(40, 50)]], '#d4a64a', 1.6);
    return o + C.glow(c0, y + 10, 50, 40, .4);
  } });
  add('needleSpire', { l: 'Needle sky-pod', c: 'tower', set: ['city', 'coast'], p: ['Seattle', 'Toronto', 'Tokyo', 'Berlin'], base: 4.5e6, beds: [1, 3], sqft: [1200, 3000], n: ['Sky Pod Suite', 'Needle Loft', 'Orbit Residence'], b: C => {
    const c0 = cx(C), pod = C.R2(40, 56), py = C.R2(46, 62), col = C.pk(['#d8dbe6', '#e9e4dc', '#c9ced9']);
    let o = C.nb(C.R2(10, 60), C.R2(28, 40), C.R2(30, 60), C.day ? '#6a7a9a' : '#141a33') + C.nb(C.R2(230, 280), C.R2(28, 40), C.R2(30, 70), C.day ? '#6a7a9a' : '#141a33');
    o += C.P([[c0 - 12, C.gY], [c0 - 4, py], [c0 + 4, py], [c0 + 12, C.gY]], col) + C.L([[c0 - 8, C.gY], [c0 - 2, py + 8]], shade(col, -.3), 1.2) + C.L([[c0 + 8, C.gY], [c0 + 2, py + 8]], shade(col, -.3), 1.2);
    o += C.E(c0, py + 6, pod / 2 + 4, 4, shade(col, -.2)) + C.E(c0, py, pod / 2, 7, C.G) + C.E(c0, py - 7, pod / 2 - 6, 4, col) + C.L([[c0, py - 10], [c0, py - C.R2(28, 40)]], '#9aa0b0', 2);
    for (let k = 0; k < 8; k++) if (C.R() < C.lit + .2) o += C.r(c0 - pod / 2 + 4 + k * (pod - 8) / 8, py - 2, 3, 4, '#ffd27a', ' opacity=".9"');
    return o + C.glow(c0, py, 50, 26, .5);
  } });
  add('brutalist', { l: 'Brutalist block', c: 'tower', set: ['city'], p: ['London', 'Berlin', 'Paris', 'Toronto'], base: 1.1e6, beds: [1, 3], sqft: [900, 2400], n: ['Concrete Loft', 'Raw Block Flat', 'Monolith Residence'], b: C => {
    const col = C.pk(['#8a8a86', '#9a9890', '#7a7a78']), w = C.R2(120, 160), hh = C.R2(70, 96), x = 160 - w / 2 + C.R2(-14, 14), y = C.gY - hh;
    let o = C.r(x, y, w, hh, col); const cols = Math.floor(w / 20), rows = Math.floor(hh / 18);
    for (let a = 0; a < rows; a++) for (let b = 0; b < cols; b++) { const X = x + 4 + b * (w - 8) / cols, Y = y + 4 + a * (hh - 8) / rows; o += C.r(X, Y, (w - 8) / cols - 4, (hh - 8) / rows - 5, shade(col, -.45)) + C.r(X + 3, Y + 4, (w - 8) / cols - 10, (hh - 8) / rows - 11, C.wc(C.R() < C.lit)) + C.r(X, Y + (hh - 8) / rows - 6, (w - 8) / cols - 4, 2, shade(col, .2)); }
    const bx = x + C.R2(10, w - 60); o += C.r(bx, y - C.R2(20, 30), C.R2(44, 60), 30, shade(col, .08)) + C.r(bx + 4, y - 22, 30, 6, C.wc(C.R() < C.lit));
    return o;
  } });
  add('balconyCondo', { l: 'Balcony condo', c: 'tower', set: ['coast', 'city'], p: ['Miami', 'Lisbon', 'Barcelona', 'Tel Aviv', 'Rio'], base: 7e5, beds: [1, 3], sqft: [800, 2200], n: ['Bay Condo', 'Terrace Condo', 'Ocean-view Condo'], b: C => {
    const w = C.R2(96, 130), fl = C.RI2(6, 9), fh = C.R2(10, 13), x = cx(C) - w / 2, y = C.gY - fl * fh, wall = C.pk(['#efe9e2', '#f6f2ee', '#e2d3c2']);
    let o = C.r(x, y, w, fl * fh, wall);
    for (let k = 0; k < fl; k++) { const yy = y + k * fh; o += C.glass(x + 4, yy + 2, w - 8, fh - 4, Math.round(w / 18)) + C.slab(x - 5, yy + fh, w + 10, '#ffffff') + C.r(x - 5, yy + fh - 7, w + 10, 3, 'rgba(200,225,255,.35)'); }
    o += C.r(x - 3, y - 4, w + 6, 4, shade(wall, -.25));
    return o + (C.set === 'coast' ? C.veg(x - 16, C.gY + 4, .9, 'palm') + C.veg(x + w + 8, C.gY + 4, .8, 'palm') : '');
  } });
  add('twinTowers', { l: 'Twin towers', c: 'tower', set: ['city', 'coast'], p: ['Kuala Lumpur', 'Dubai', 'Singapore', 'Shanghai'], base: 2.8e6, beds: [2, 4], sqft: [1600, 4200], n: ['Twin Sky Residence', 'Bridge Tower Home', 'Gemini Unit'], b: C => {
    const c0 = cx(C), tw = C.R2(34, 44), gap = C.R2(24, 40), th = C.R2(110, C.gY - 16), col = C.pk(['#c9ced9', '#2b3f5f', '#22304f']), y = C.gY - th;
    let o = ''; [c0 - gap / 2 - tw, c0 + gap / 2].forEach((x, i) => { const hh = th - i * C.R2(0, 10); o += C.r(x, C.gY - hh, tw, hh, col) + C.grid(x, C.gY - hh + 6, tw, hh - 8, 3, Math.floor(hh / 8), 5, 3) + C.P([[x + 4, C.gY - hh], [x + tw / 2, C.gY - hh - C.R2(16, 26)], [x + tw - 4, C.gY - hh]], shade(col, .2)) + C.L([[x + tw / 2, C.gY - hh - 18], [x + tw / 2, C.gY - hh - 34]], '#9aa0b0', 1.4); });
    const by = y + th * C.R2(.35, .45); o += C.r(c0 - gap / 2, by, gap, 7, shade(col, -.2)) + C.r(c0 - gap / 2, by + 2, gap, 3, C.wc(C.R() < .5));
    return o + C.glow(c0, by, 60, 30, .3);
  } });
  add('cylTower', { l: 'Round tower', c: 'tower', set: ['city', 'coast'], p: ['Los Angeles', 'Chicago', 'Sydney', 'Tokyo'], base: 1.9e6, beds: [1, 3], sqft: [1200, 3200], n: ['Round Tower Unit', 'Ring Residence', 'Cylinder Home'], b: C => {
    const c0 = cx(C), w = C.R2(50, 66), th = C.R2(100, C.gY - 20), x = c0 - w / 2, y = C.gY - th, col = C.pk(['#e9e4dc', '#d8dbe6', '#c9b48a']);
    let o = '<defs><linearGradient id="cy' + C.id + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + shade(col, -.45) + '"/><stop offset=".55" stop-color="' + col + '"/><stop offset="1" stop-color="' + shade(col, -.25) + '"/></linearGradient></defs>';
    o += C.r(x, y, w, th, 'url(#cy' + C.id + ')') + C.E(c0, y, w / 2, 5, shade(col, .1));
    for (let yy = y + 8; yy < C.gY - 4; yy += 8) { o += '<path d="M' + f(x) + ',' + f(yy) + ' Q' + f(c0) + ',' + f(yy + 5) + ' ' + f(x + w) + ',' + f(yy) + '" stroke="' + shade(col, -.35) + '" stroke-width="1.6" fill="none"/>'; for (let k = 1; k < 6; k++) if (C.R() < C.lit + .1) o += C.r(x + k * w / 6 - 2, yy + 1.5, 3, 4, '#ffd27a', ' opacity=".9"'); }
    return o;
  } });
  add('sailTower', { l: 'Sail tower', c: 'tower', set: ['coast'], p: ['Dubai', 'Doha', 'Abu Dhabi'], base: 5.5e6, beds: [2, 5], sqft: [2400, 6000], n: ['Sail Suite', 'Mast Residence', 'Spinnaker Tower Home'], b: C => {
    const x = cx(C) - 30, th = C.R2(110, 128), y = C.gY - th, wd = C.R2(56, 70);
    let o = C.P([[x - 6, C.gY], [x - 6, y + 30], [x + 2, C.gY]], '#16181f');
    o += '<path d="M' + f(x) + ',' + f(C.gY) + ' L' + f(x) + ',' + f(y) + ' Q' + f(x + wd * 1.1) + ',' + f(y + th * .35) + ' ' + f(x + wd) + ',' + f(C.gY) + ' Z" fill="#f4f6fb"/>';
    o += '<path d="M' + f(x + 4) + ',' + f(C.gY) + ' L' + f(x + 4) + ',' + f(y + 16) + ' Q' + f(x + wd * .75) + ',' + f(y + th * .42) + ' ' + f(x + wd * .7) + ',' + f(C.gY) + ' Z" fill="' + C.G + '" opacity=".7"/>';
    for (let k = 1; k < 8; k++) o += C.L([[x + 2, y + th * k / 8], [x + wd * (.75 + .1 * Math.sin(k)), y + th * k / 8 + 8]], '#c9ced9', .9);
    o += C.L([[x, y], [x, y - C.R2(14, 24)]], '#d8dbe6', 2) + C.E(x + wd * .55, y + 28, 10, 2.4, '#d8dbe6');
    return o + C.glow(x + 30, y + 60, 60, 60, .35);
  } });
  add('skyPenthouse', { l: 'Rooftop-pool penthouse', c: 'tower', set: ['city', 'coast'], p: ['Dubai', 'Monaco', 'New York', 'Singapore', 'Miami'], base: 4.2e6, beds: [3, 5], sqft: [3000, 7000], n: ['Sky Penthouse', 'Infinity Penthouse', 'Cloud Penthouse'], b: C => {
    const tw = C.R2(74, 100), th = C.R2(96, 120), x = cx(C) - tw / 2, y = C.gY - th, col = C.pk(['#1d2747', '#2b2f3f', '#22304f']);
    let o = C.r(x, y, tw, th, col) + C.grid(x, y + 4, tw, th - 6, Math.floor(tw / 12), Math.floor(th / 11), 6, 5);
    const ph = C.R2(14, 18); o += C.r(x + tw * .3, y - ph, tw * .65, ph, C.G) + C.r(x + tw * .28, y - ph - 3, tw * .7, 3, '#e9e4dc');
    o += C.r(x - 2, y - 4, tw * .32, 4, C.POOL) + C.r(x - 2, y - 1, tw * .32, 3, '#6ff3ff', ' opacity=".6"');
    const hx = x + tw + C.R2(14, 30), hh = C.R2(60, 80); o += C.r(hx, C.gY - hh, 40, hh, shade(col, -.25)) + C.grid(hx, C.gY - hh, 40, hh, 3, Math.floor(hh / 11), 4, 4) + C.E(hx + 20, C.gY - hh - 2, 16, 3, '#2a2c36') + '<text x="' + f(hx + 20) + '" y="' + f(C.gY - hh) + '" font-size="5" font-weight="900" text-anchor="middle" fill="#ffc21a" font-family="Arial">H</text>';
    return o + C.glow(x + tw * .6, y - 8, tw, 26, .6);
  } });
  add('stackedTower', { l: 'Stacked-box tower', c: 'tower', set: ['city'], p: ['Singapore', 'Toronto', 'Rotterdam', 'Copenhagen'], base: 2.1e6, beds: [2, 4], sqft: [1500, 3800], n: ['Stack Residence', 'Block Tower Home', 'Cantilever Sky Unit'], b: C => {
    const c0 = cx(C), n = C.RI2(6, 9); let y = C.gY, o = '';
    for (let k = 0; k < n; k++) { const w = C.R2(44, 74), hh = C.R2(12, 17), x = c0 - w / 2 + C.R2(-20, 20); y -= hh; const dark = k % 2 === 0; o += C.r(x, y, w, hh, dark ? '#22304f' : C.pk(['#f4f6fb', '#e9e4dc', '#d8dbe6'])) + (dark ? C.glass(x + 3, y + 3, w - 6, hh - 6, Math.round(w / 12)) : C.grid(x, y, w, hh, Math.floor(w / 12), 1, 6, hh * .45)); }
    return o + C.glow(c0, y + 30, 60, 50, .3);
  } });
  add('waterTowerLoft', { l: 'Warehouse loft', c: 'tower', set: ['city'], p: ['New York', 'Chicago', 'Berlin', 'London', 'Brooklyn'], base: 1.4e6, beds: [1, 3], sqft: [1400, 3600], n: ['Warehouse Loft', 'Brick Loft', 'Factory Loft'], b: C => {
    const col = C.pk(['#7a3b2a', '#6a4030', '#8a4a32']), w = C.R2(110, 150), fl = C.RI2(4, 6), fh = C.R2(15, 18), x = 160 - w / 2 + C.R2(-16, 16), y = C.gY - fl * fh;
    let o = C.r(x, y, w, fl * fh, col); const nw = Math.floor(w / 22);
    for (let k = 0; k < fl; k++) for (let j = 0; j < nw; j++) { const wx = x + 6 + j * (w - 12) / nw, ww = (w - 12) / nw - 7, wy = y + k * fh + 3; o += '<path d="M' + f(wx) + ',' + f(wy + fh - 5) + ' L' + f(wx) + ',' + f(wy + ww / 2) + ' A' + f(ww / 2) + ',' + f(ww / 2) + ' 0 0 1 ' + f(wx + ww) + ',' + f(wy + ww / 2) + ' L' + f(wx + ww) + ',' + f(wy + fh - 5) + ' Z" fill="' + C.wc(C.R() < C.lit) + '"/>' + C.L([[wx + ww / 2, wy + 2], [wx + ww / 2, wy + fh - 5]], shade(col, -.4), .8); }
    o += C.r(x - 3, y - 5, w + 6, 5, shade(col, -.3));
    const tx = x + C.R2(10, w - 40); o += C.L([[tx + 2, y - 5], [tx + 2, y - 14], [tx + 4, y - 5]], '#3a2a20', 1.5) + C.L([[tx + 20, y - 5], [tx + 20, y - 14]], '#3a2a20', 1.5) + C.r(tx - 2, y - 30, 26, 16, '#5a3a26') + C.P([[tx - 4, y - 30], [tx + 11, y - 40], [tx + 26, y - 30]], '#3a2a20') + C.L([[tx - 2, y - 24], [tx + 24, y - 24]], '#3a2a20', 1);
    return o;
  } });
  // ===== Townhouses =====
  add('brownstone', { l: 'Brownstone', c: 'town', set: ['city'], p: ['New York', 'Boston', 'Brooklyn', 'Philadelphia'], base: 3.2e6, beds: [3, 6], sqft: [2400, 5200], n: ['Brownstone', 'Park Slope Townhouse', 'Stoop House'], b: C => {
    const n = C.RI2(3, 4), w = C.R2(50, 62), x0 = 160 - n * w / 2, hh = C.R2(70, 86); let o = '';
    for (let k = 0; k < n; k++) { const x = x0 + k * w, col = C.pk(['#6a3f2e', '#7b4a36', '#5a3528', '#8a5a40']), y = C.gY - hh; o += C.r(x, y, w, hh, col) + C.r(x - 1, y - 5, w + 2, 5, shade(col, -.35)); for (let b = 0; b < 4; b++) o += C.r(x + 6 + b * (w - 12) / 4, y - 2, 2, 3, shade(col, -.4));
      const bay = C.R() < .5; for (let fl = 0; fl < 3; fl++) { const wy = y + 8 + fl * 20; if (bay && fl < 2) o += C.r(x + w * .45, wy - 2, w * .45, 16, shade(col, .08)); for (let j = 0; j < 2; j++) o += C.win(x + 8 + j * (w * .5), wy, 9, 13) + C.r(x + 7 + j * (w * .5), wy - 2, 11, 2, '#d8d2c6'); }
      o += C.P([[x + 4, C.gY], [x + 4, C.gY - 14], [x + 18, C.gY - 14], [x + 30, C.gY]], shade(col, -.15)) + C.door(x + 6, C.gY - 14, 10, 16, '#2a1a12') + C.L([[x + 18, C.gY - 14], [x + 30, C.gY]], '#16181f', 1.4); }
    return o + C.veg(x0 - 10, C.gY + 4, .9, 'tree') + C.veg(x0 + n * w + 8, C.gY + 4, .8, 'tree') + C.L([[x0 + n * w + 26, C.gY], [x0 + n * w + 26, C.gY - 40]], '#16181f', 2) + C.E(x0 + n * w + 26, C.gY - 42, 3, 3, C.day ? '#d8dbe6' : '#ffd27a');
  } });
  add('rowHouses', { l: 'Pastel row house', c: 'town', set: ['city', 'coast'], p: ['Charleston', 'Copenhagen', 'Lisbon', 'San Francisco', 'Cape Town'], base: 1.6e6, beds: [2, 4], sqft: [1400, 3000], n: ['Pastel Row House', 'Painted Townhouse', 'Harbor Row Home'], b: C => {
    const n = C.RI2(4, 6), x0 = C.R2(20, 40), W = 320 - 2 * x0; let x = x0, o = '';
    for (let k = 0; k < n; k++) { const w = W / n, hh = C.R2(52, 74), y = C.gY - hh, col = C.pk(['#f7b2c4', '#a8e0c8', '#ffe08a', '#a9c8ff', '#ffc49a', '#d6b8ff', '#f4f1e8']); o += C.r(x, y, w, hh, col);
      const rt = C.pk(['gable', 'flat', 'step']); o += rt === 'gable' ? C.gable(x, y, w, C.R2(12, 20), shade(col, -.4), 1) : rt === 'step' ? C.P([[x, y], [x, y - 8], [x + w * .2, y - 8], [x + w * .2, y - 16], [x + w * .8, y - 16], [x + w * .8, y - 8], [x + w, y - 8], [x + w, y]], col) : C.r(x - 1, y - 4, w + 2, 4, shade(col, -.3));
      for (let fl = 0; fl < 3; fl++) for (let j = 0; j < 2; j++) if (fl < 2 || j) o += C.win(x + 6 + j * (w / 2 - 2), y + 8 + fl * 18, w / 2 - 10, 11) + C.r(x + 5 + j * (w / 2 - 2), y + 19 + fl * 18, w / 2 - 8, 1.6, '#ffffff');
      o += C.door(x + 6, C.gY, w / 2 - 12, 15, shade(col, -.5)); x += w; }
    return o;
  } });
  add('tenementStudio', { l: 'Walk-up studio', c: 'town', set: ['city'], p: ['New York', 'Berlin', 'Hong Kong', 'Chicago', 'Glasgow'], base: 1.4e5, beds: [0, 1], sqft: [350, 650], n: ['Trench Studio', 'Walk-up Studio', 'Micro Studio'], b: C => {
    const col = C.pk(['#4a3a3a', '#5a4038', '#3a3440', '#6a4a3a']), w = C.R2(90, 110), fl = 5, fh = C.R2(16, 19), x = 160 - w / 2 + C.R2(-30, 30), y = C.gY - fl * fh;
    let o = C.nb(x - 64, 60, C.R2(60, 90), shade(col, -.3)) + C.nb(x + w + 4, 60, C.R2(50, 80), shade(col, -.25)) + C.r(x, y, w, fl * fh, col) + C.r(x - 2, y - 4, w + 4, 4, shade(col, -.35));
    const my = C.RI2(1, 3); for (let k = 0; k < fl; k++) for (let j = 0; j < 3; j++) { const wx = x + 10 + j * (w - 20) / 3, wy = y + k * fh + 3; o += (k === my && j === 1 ? C.r(wx, wy, 12, fh - 6, '#5aa0ff') + C.E(wx + 6, wy + 6, 18, 14, '#5aa0ff', ' opacity=".18"') : C.win(wx, wy, 12, fh - 6)) + C.r(wx - 1, wy + fh - 6, 14, 1.6, '#a9a29a'); if (C.R() < .25) o += C.r(wx + 2, wy + fh - 10, 8, 5, '#c9ced9'); }
    const fx = x + w * .62; for (let k = 1; k < fl; k++) { const yy = y + k * fh; o += C.r(fx - 2, yy - 1, 30, 2, '#14161d') + C.L([[fx - 2, yy - 6], [fx + 28, yy - 6]], '#14161d', .8) + C.L([[fx + (k % 2 ? 2 : 24), yy], [fx + (k % 2 ? 24 : 2), yy + fh - 1]], '#14161d', 1.4); }
    return o + C.door(x + 10, C.gY, 12, 16, '#2a1a12');
  } });
  add('canalHouse', { l: 'Canal house', c: 'town', set: ['canal'], p: ['Amsterdam', 'Bruges', 'Copenhagen', 'Venice'], base: 1.9e6, beds: [2, 5], sqft: [1600, 3600], n: ['Canal House', 'Gabled Canal Home', 'Waterside Townhouse'], b: C => {
    const n = C.RI2(4, 5), w = C.R2(36, 46), x0 = 160 - n * w / 2; let o = '';
    for (let k = 0; k < n; k++) { const x = x0 + k * w, hh = C.R2(66, 92), y = C.gY - hh, col = C.pk(['#5a3528', '#7a3b2a', '#3a3440', '#6a4a3a', '#2a3a4a', '#8a6a4a']); o += C.r(x, y, w, hh, col);
      const g = C.pk(['step', 'bell', 'neck']); o += g === 'step' ? C.P([[x, y], [x, y - 6], [x + w * .2, y - 6], [x + w * .2, y - 12], [x + w * .4, y - 12], [x + w * .4, y - 18], [x + w * .6, y - 18], [x + w * .6, y - 12], [x + w * .8, y - 12], [x + w * .8, y - 6], [x + w, y - 6], [x + w, y]], col) : g === 'bell' ? '<path d="M' + f(x) + ',' + f(y) + ' Q' + f(x + w * .1) + ',' + f(y - 14) + ' ' + f(x + w * .35) + ',' + f(y - 14) + ' Q' + f(x + w * .5) + ',' + f(y - 26) + ' ' + f(x + w * .65) + ',' + f(y - 14) + ' Q' + f(x + w * .9) + ',' + f(y - 14) + ' ' + f(x + w) + ',' + f(y) + ' Z" fill="' + col + '"/>' : C.P([[x, y], [x + w * .25, y - 4], [x + w * .25, y - 20], [x + w * .75, y - 20], [x + w * .75, y - 4], [x + w, y]], col);
      o += C.L([[x + w / 2, y - 10], [x + w / 2 + 6, y - 10]], '#16181f', 1.6);
      for (let fl = 0; fl < 4; fl++) for (let j = 0; j < 2; j++) { const wy = y + 6 + fl * (hh - 10) / 4; o += C.win(x + 5 + j * (w / 2), wy, w / 2 - 9, (hh - 10) / 4 - 7) + '<rect x="' + f(x + 5 + j * (w / 2)) + '" y="' + f(wy) + '" width="' + f(w / 2 - 9) + '" height="' + f((hh - 10) / 4 - 7) + '" fill="none" stroke="#f4f4f4" stroke-width="1.2"/>'; } }
    return o + (C.R() < .7 ? (bx => C.P([[bx, C.gY + 20], [bx + 50, C.gY + 20], [bx + 44, C.gY + 28], [bx + 6, C.gY + 28]], '#2a5a3a') + C.r(bx + 12, C.gY + 15, 22, 5, '#e8e2d4'))(C.R2(30, 230)) : '');
  } });
  // ===== Modern =====
  add('boxVilla', { l: 'Modern box villa', c: 'modern', set: ['hills', 'coast', 'suburb'], p: ['Los Angeles', 'Ibiza', 'Miami', 'Bali', 'Cape Town'], base: 5e6, beds: [4, 7], sqft: [4500, 9500], n: ['Glass Villa', 'White Box Villa', 'Infinity Villa'], b: C => {
    const wall = C.pk(['#f6f2ee', '#efe9e2', '#e9e4dc']); let x = C.R2(50, 80), o = ''; const n = C.RI2(2, 3);
    for (let k = 0; k < n; k++) { const w = C.R2(60, 90), hh = C.R2(28, 40), y = C.gY - (k === 1 ? C.R2(26, 36) : 0); o += C.r(x, y - hh, w, hh, k % 2 ? shade(wall, -.12) : wall) + (C.R() < .6 ? C.glass(x + w * .08, y - hh * .86, w * .84, hh * .72) : C.r(x + 6, y - hh * .6, w - 12, hh * .2, C.G)) + C.r(x - 6, y - hh - 3, w + 12, 3, shade(wall, -.35)); x += w * C.R2(.6, .9); }
    o += C.pool(C.R2(60, 120), C.gY + 3, C.R2(90, 150), C.R2(8, 12)) + C.trees(C.RI2(2, 4), C.set === 'suburb' ? 'tree' : 'palm', C.gY + 4, 50, x, .9);
    return o + C.glow(160, C.gY - 30, 120, 40, .3);
  } });
  add('cantileverVilla', { l: 'Cantilever villa', c: 'modern', set: ['hills', 'coast'], p: ['Los Angeles', 'Malibu', 'Lake Como', 'Mykonos'], base: 7.5e6, beds: [4, 7], sqft: [5000, 10000], n: ['Cantilever Villa', 'Floating Box House', 'Overhang Villa'], b: C => {
    const lx = C.R2(70, 110), lw = C.R2(70, 90), lh = C.R2(28, 34), uw = C.R2(130, 170), uh = C.R2(26, 32), ux = lx - C.R2(0, 20), uy = C.gY - lh - uh, wall = C.pk(['#f6f2ee', '#2a2e3a', '#e9e4dc', '#8a8f9c']);
    let o = C.r(lx, C.gY - lh, lw, lh, '#2a2e3a') + C.glass(lx + 3, C.gY - lh + 3, lw - 6, lh - 6) + C.r(ux, uy, uw, uh, wall) + C.glass(ux + uw * .45, uy + 5, uw * .5, uh - 10) + C.r(ux + 6, uy + uh * .4, uw * .3, 3, shade(wall, -.4));
    o += C.pool(lx + lw + 6, C.gY + 3, C.R2(70, 110), 9) + C.r(ux + uw - 4, uy + uh, 4, 4, '#2a2e3a');
    return o + C.trees(C.RI2(1, 3), C.set === 'coast' ? 'palm' : 'cypress', C.gY + 4, ux, ux + uw) + C.glow(ux + uw * .7, uy + uh / 2, 90, 30, .4);
  } });
  add('glassPavilion', { l: 'Glass pavilion', c: 'modern', set: ['forest', 'lake', 'hills'], p: ['Connecticut', 'Lake Tahoe', 'Oslo', 'Vancouver'], base: 4.6e6, beds: [2, 4], sqft: [2400, 5200], n: ['Glass Pavilion', 'Forest Glass House', 'Transparent Retreat'], b: C => {
    const w = C.R2(130, 180), hh = C.R2(30, 38), x = 160 - w / 2 + C.R2(-10, 10), y = C.gY - 6 - hh;
    let o = C.r(x - 6, C.gY - 6, w + 12, 6, '#d8d2c6') + C.glass(x, y, w, hh, C.RI2(7, 11), '#16181f');
    o += C.r(x + w * .2, y + hh - 9, 26, 7, C.pk(['#3a3d48', '#8a5630', '#e8e2d4'])) + C.r(x + w * .62, y + hh - 14, 2, 12, '#16181f') + C.E(x + w * .62 + 1, y + hh - 16, 5, 3, C.day ? '#e8e2d4' : '#ffd27a');
    o += C.r(x - C.R2(14, 24), y - 4, w + C.R2(28, 44), 4, '#f4f4f4');
    return o + C.trees(C.RI2(3, 6), C.set === 'hills' ? 'tree' : 'pine', C.gY + 4, x, x + w, 1.1) + C.glow(160, y + hh / 2, w * .7, 30, .5);
  } });
  add('butterflyMCM', { l: 'Mid-century butterfly', c: 'modern', set: ['desert', 'suburb', 'hills'], p: ['Palm Springs', 'Scottsdale', 'Los Angeles', 'Austin'], base: 2.4e6, beds: [3, 5], sqft: [2200, 4200], n: ['Butterfly House', 'Mid-Century Modern', 'Desert Mod'], b: C => {
    const w = C.R2(140, 180), hh = C.R2(26, 32), x = 160 - w / 2 + C.R2(-10, 10), y = C.gY - hh, v = C.R2(8, 12), wall = C.pk(['#f4f1e8', '#e8d8b8', '#cfe3e0']);
    let o = C.r(x, y, w, hh, wall) + C.P([[x - 10, y - v - 4], [x + w * .5, y], [x + w + 10, y - v - 4], [x + w + 10, y - v], [x + w * .5, y + 3], [x - 10, y - v]], '#f4f4f4');
    o += C.P([[x + 2, y - v + 1], [x + w * .5, y + 2], [x + w - 2, y - v + 1], [x + w - 2, y + 4], [x + 2, y + 4]], C.G, ' opacity=".8"');
    const sw = w * .24; o += C.r(x + 4, y + 6, sw, hh - 6, '#b8a07a'); for (let k = 0; k < 18; k++) o += C.r(x + 5 + C.R() * (sw - 8), y + 7 + C.R() * (hh - 10), C.R2(3, 6), C.R2(2, 3.5), shade('#b8a07a', C.R2(-.25, .15)));
    o += C.glass(x + sw + 10, y + 6, w * .4, hh - 6, 5) + C.door(x + w * .72, C.gY, 10, hh - 6, C.pk(['#ff7a1a', '#ffc21a', '#1fb5a8', '#e2577a']));
    const cpx = x + w + 6; o += C.r(cpx, y - 2, 46, 3, '#f4f4f4') + C.L([[cpx + 42, y], [cpx + 42, C.gY]], '#f4f4f4', 1.6) + C.r(cpx + 6, C.gY - 9, 30, 8, C.pk(['#2f6bff', '#ffc21a', '#e8ecf5'])) + C.E(cpx + 12, C.gY - 1, 3.5, 3.5, '#111') + C.E(cpx + 30, C.gY - 1, 3.5, 3.5, '#111');
    return o + '<ellipse cx="' + f(x + w * .3) + '" cy="' + f(C.gY + 9) + '" rx="34" ry="6" fill="' + C.POOL + '"/>' + C.trees(C.RI2(1, 3), C.set === 'desert' ? 'palm' : 'tree', C.gY + 4, x, cpx + 46);
  } });
  add('desertModern', { l: 'Desert modern', c: 'modern', set: ['desert'], p: ['Scottsdale', 'Joshua Tree', 'Marfa', 'Dubai', 'Sedona'], base: 2.2e6, beds: [3, 6], sqft: [2400, 6500], n: ['Desert Modern', 'Canyon House', 'Mesa House'], b: C => {
    const w = C.R2(150, 200), hh = C.R2(26, 34), x = 160 - w / 2, y = C.gY - hh;
    let o = C.r(x, y, w * .45, hh, '#c9a37a'); for (let k = 1; k < 6; k++) o += C.r(x, y + hh * k / 6, w * .45, 1.6, shade('#c9a37a', C.R2(-.25, .1)));
    o += C.glass(x + w * .45, y + 2, w * .55, hh - 2, 6) + C.r(x - 14, y - 5, w + 30, 5, C.pk(['#2a2e3a', '#e9e4dc', '#8a6a4a']));
    o += C.pool(x + w * .5, C.gY + 3, w * .45, 8) + C.r(x - 20, C.gY - 18, 6, 18, '#b8875a');
    return o + C.trees(C.RI2(3, 5), 'cactus', C.gY + 4, x - 20, x + w + 14) + C.glow(x + w * .7, y + hh / 2, 80, 26, .4);
  } });
  add('cliffHouse', { l: 'Cliffside house', c: 'modern', set: ['cliff'], p: ['Big Sur', 'Amalfi', 'Santorini', 'Cape Town', 'Algarve'], base: 8e6, beds: [3, 6], sqft: [3000, 7500], n: ['Cliff House', 'Ocean Edge House', 'Precipice Villa'], b: C => {
    const cw = C.R2(150, 190), top = C.R2(96, 110), rock = C.pk(['#6a5a4a', '#5a4a3e', '#7a6a58']);
    let o = '<path d="M-5,180 L-5,' + f(top) + ' L' + f(cw * .7) + ',' + f(top - 2) + ' L' + f(cw) + ',' + f(top + 8) + ' L' + f(cw - 8) + ',' + f(top + 30) + ' L' + f(cw + 6) + ',' + f(top + 50) + ' L' + f(cw - 4) + ',180 Z" fill="' + rock + '"/>' + C.r(-5, top - 3, cw * .72, 4, C.day ? '#4f8a3f' : '#16202a');
    const hw = C.R2(80, 100), hx = cw - hw * C.R2(.45, .6), hh = C.R2(28, 34), y = top - hh - 2, wall = C.pk(['#f6f2ee', '#2a2e3a', '#8a8f9c']);
    o += C.r(hx, y, hw, hh, wall) + C.glass(hx + hw * .4, y + 4, hw * .56, hh - 8) + C.r(hx - 4, y - 3, hw + 8, 3, shade(wall, -.4)) + C.rail(hx + hw * .4, y + hh + 6, hw * .62) + C.r(hx + hw * .4, y + hh, hw * .62, 6, '#c9ced9');
    return o + C.veg(C.R2(20, 60), top, .7, 'cypress') + C.glow(hx + hw * .7, y + hh / 2, 70, 26, .45);
  } });
  add('hillsideStack', { l: 'Hillside terraces', c: 'modern', set: ['hills', 'coast'], p: ['Los Angeles', 'Monaco', 'Hong Kong', 'Positano'], base: 6.2e6, beds: [4, 7], sqft: [4200, 9000], n: ['Terrace House', 'Stepped Hill Villa', 'Cascade House'], b: C => {
    const y0 = C.R2(78, 92), sl = C.pk(['#6a5a4a', '#4f8a3f', '#5a6a3a']);
    let o = C.P([[-5, y0], [120, y0 + 10], [320, C.gY - 6], [320, 180], [-5, 180]], C.day ? sl : shade(sl, -.6)); let x = C.R2(40, 60), y = y0 + 6;
    for (let k = 0; k < C.RI2(3, 4); k++) { const w = C.R2(56, 72), hh = C.R2(22, 28), wall = k % 2 ? '#e9e4dc' : '#f6f2ee'; o += C.r(x, y - hh, w, hh, wall) + C.glass(x + 4, y - hh + 4, w - 8, hh - 8) + C.r(x - 4, y - hh - 3, w + 8, 3, '#2a2e3a') + C.rail(x + w, y + 2, 20); if (k === 1) o += C.r(x + w + 2, y - 3, 30, 5, C.POOL); x += w * C.R2(.75, .9); y += C.R2(18, 24); }
    return o + C.trees(C.RI2(2, 3), 'cypress', y0 + 8, 30, x) + C.glow(160, y0 + 30, 120, 40, .3);
  } });
  add('curvedVilla', { l: 'Organic curved villa', c: 'modern', set: ['hills', 'coast', 'desert'], p: ['Dubai', 'Ibiza', 'Bali', 'Mexico City', 'Tulum'], base: 6.8e6, beds: [4, 7], sqft: [4600, 9800], n: ['Wave House', 'Dune Villa', 'Swoop Residence'], b: C => {
    const w = C.R2(160, 200), x = 160 - w / 2, hh = C.R2(34, 44), wall = C.pk(['#f6f2ee', '#efe9e2', '#e8d8b8']);
    let o = '<path d="M' + f(x) + ',' + f(C.gY) + ' L' + f(x) + ',' + f(C.gY - hh * .6) + ' Q' + f(x + w * .2) + ',' + f(C.gY - hh * 1.4) + ' ' + f(x + w * .45) + ',' + f(C.gY - hh * .8) + ' Q' + f(x + w * .7) + ',' + f(C.gY - hh * .2) + ' ' + f(x + w) + ',' + f(C.gY - hh * 1.1) + ' L' + f(x + w) + ',' + f(C.gY) + ' Z" fill="' + wall + '"/>';
    o += '<path d="M' + f(x + 8) + ',' + f(C.gY - 4) + ' L' + f(x + 8) + ',' + f(C.gY - hh * .5) + ' Q' + f(x + w * .22) + ',' + f(C.gY - hh * 1.1) + ' ' + f(x + w * .45) + ',' + f(C.gY - hh * .6) + ' L' + f(x + w * .45) + ',' + f(C.gY - 4) + ' Z" fill="' + C.G + '"/>' + C.glass(x + w * .6, C.gY - hh * .7, w * .32, hh * .6, 4);
    return o + '<path d="M' + f(x + 20) + ',' + f(C.gY + 6) + ' Q' + f(x + w * .4) + ',' + f(C.gY + 16) + ' ' + f(x + w * .8) + ',' + f(C.gY + 6) + ' Q' + f(x + w * .5) + ',' + f(C.gY + 2) + ' ' + f(x + 20) + ',' + f(C.gY + 6) + ' Z" fill="' + C.POOL + '"/>' + C.trees(C.RI2(1, 3), C.set === 'desert' ? 'cactus' : 'palm', C.gY + 4, x, x + w) + C.glow(160, C.gY - hh / 2, w * .6, 30, .4);
  } });
  add('courtyardHouse', { l: 'Zen courtyard house', c: 'modern', set: ['hills', 'forest', 'suburb'], p: ['Kyoto', 'Tokyo', 'Seoul', 'Vancouver'], base: 2.9e6, beds: [2, 4], sqft: [1800, 3800], n: ['Zen House', 'Courtyard Home', 'Timber Eaves House'], b: C => {
    const w = C.R2(150, 190), x = 160 - w / 2, hh = C.R2(24, 30), y = C.gY - hh, wood = C.pk(['#3a2a20', '#2a2228', '#4a3428']);
    let o = C.r(x - 20, C.gY - 12, w + 40, 12, '#cfc8bc') + C.r(x - 20, C.gY - 14, w + 40, 2, '#3a3a3a');
    o += C.r(x, y, w, hh, wood); for (let k = 0; k < 8; k++) { const px = x + 6 + k * (w - 12) / 8; o += C.r(px, y + 4, (w - 12) / 8 - 3, hh - 6, C.day ? '#f4efe2' : '#ffe1a0') + C.L([[px, y + hh * .5], [px + (w - 12) / 8 - 3, y + hh * .5]], wood, .6) + C.L([[px + ((w - 12) / 8 - 3) / 2, y + 4], [px + ((w - 12) / 8 - 3) / 2, y + hh - 2]], wood, .6); }
    const eave = (yy, ww, d) => '<path d="M' + f(160 - ww / 2 - 10) + ',' + f(yy - 2) + ' Q' + f(160 - ww / 2) + ',' + f(yy) + ' ' + f(160 - ww / 2 + 8) + ',' + f(yy - d) + ' L' + f(160 + ww / 2 - 8) + ',' + f(yy - d) + ' Q' + f(160 + ww / 2) + ',' + f(yy) + ' ' + f(160 + ww / 2 + 10) + ',' + f(yy - 2) + ' Z" fill="#2a2c34"/>';
    o += eave(y, w + 10, 8) + C.r(160 - w * .3, y - 20, w * .6, 12, wood) + C.r(160 - w * .3 + 4, y - 18, w * .6 - 8, 8, C.day ? '#f4efe2' : '#ffe1a0') + eave(y - 20, w * .65, 9);
    return o + C.veg(x - 26, C.gY, 1, 'maple') + C.veg(x + w + 22, C.gY, .8, 'maple') + C.trees(2, 'bush', C.gY + 2, x - 30, x + w + 30) + C.glow(160, y + 10, w * .5, 22, .4);
  } });
  // ===== Classic =====
  add('colonialMansion', { l: 'Colonial mansion', c: 'classic', set: ['suburb', 'hills'], p: ['Virginia', 'Atlanta', 'Hamptons', 'Charleston', 'Nashville'], base: 9e6, beds: [6, 12], sqft: [8000, 20000], n: ['Column Mansion', 'Estate Manor', 'Plantation-style Estate'], b: C => {
    const w = C.R2(170, 210), hh = C.R2(52, 64), x = 160 - w / 2, y = C.gY - hh, wall = C.pk(['#f6f2ee', '#efe9e2', '#8a4a32', '#e2d3c2']);
    let o = C.r(x - 30, C.gY - hh * .7, 34, hh * .7, wall) + C.r(x + w - 4, C.gY - hh * .7, 34, hh * .7, wall) + C.hip(x - 30, C.gY - hh * .7, 34, 12, '#3a3f4f', 2) + C.hip(x + w - 4, C.gY - hh * .7, 34, 12, '#3a3f4f', 2);
    o += C.r(x, y, w, hh, wall) + C.hip(x, y, w, C.R2(24, 30), C.pk(['#3a3f4f', '#2a2e3a', '#5a3a24']), 4);
    for (let k = 0; k < 3; k++) { const dx = x + w * (.25 + k * .25) - 7; o += C.r(dx, y - 16, 14, 12, wall) + C.gable(dx, y - 16, 14, 7, '#3a3f4f', 2) + C.win(dx + 4, y - 13, 6, 8); }
    for (let fl = 0; fl < 2; fl++) for (let j = 0; j < 8; j++) { if (j === 3 || j === 4) continue; const wx = x + 10 + j * (w - 20) / 8, wy = y + 8 + fl * hh * .45; o += C.r(wx - 3, wy, 3, 15, '#2a3a2a') + C.win(wx, wy, 9, 15) + C.r(wx + 9, wy, 3, 15, '#2a3a2a'); }
    const pw = w * .3, px = 160 - pw / 2; o += C.P([[px - 6, y + 4], [160, y - C.R2(14, 20)], [px + pw + 6, y + 4]], shade(wall, .15)); for (let k = 0; k < 4; k++) o += C.r(px + k * (pw - 5) / 3, y + 4, 5, hh - 4, '#ffffff');
    o += C.door(156, C.gY, 10, 18, '#2a1a12') + C.chimney(x + 16, y - 10, 8, 18, '#7a3b2a') + C.chimney(x + w - 24, y - 10, 8, 18, '#7a3b2a');
    return o + C.P([[120, C.gY], [200, C.gY], [240, 180], [80, 180]], '#cdbfa8', ' opacity=".5"') + C.E(160, C.gY + 14, 9, 3, C.POOL) + C.trees(C.RI2(2, 4), 'tree', C.gY + 4, x - 34, x + w + 30);
  } });
  add('victorian', { l: 'Victorian turret house', c: 'classic', set: ['suburb', 'hills', 'city'], p: ['San Francisco', 'Cape May', 'Savannah', 'Boston'], base: 2.6e6, beds: [4, 6], sqft: [3000, 5600], n: ['Painted Lady', 'Turret House', 'Queen-Anne Home'], b: C => {
    const col = C.pk(['#5a8a8a', '#7a5a9a', '#e8c65a', '#c25a6a', '#6a9a6a']), trim = '#f6f2ee', x = C.R2(100, 130), w = C.R2(80, 96), hh = C.R2(56, 66), y = C.gY - hh;
    let o = C.r(x, y, w, hh, col) + C.gable(x + w * .35, y, w * .65, C.R2(26, 34), '#3a3040', 3) + C.gable(x - 4, y + 4, w * .4, 18, '#3a3040', 2);
    const tx = x - 14, tw = 26, th = hh + 16; o += C.r(tx, C.gY - th, tw, th, shade(col, .1)) + C.P([[tx - 3, C.gY - th], [tx + tw / 2, C.gY - th - C.R2(26, 34)], [tx + tw + 3, C.gY - th]], '#3a3040') + C.L([[tx + tw / 2, C.gY - th - 30], [tx + tw / 2, C.gY - th - 38]], '#16181f', 1.2);
    for (let fl = 0; fl < 2; fl++) { o += C.win(tx + 8, C.gY - th + 12 + fl * 22, 10, 14); for (let j = 0; j < 3; j++) o += C.win(x + 10 + j * (w - 20) / 3, y + 10 + fl * 22, 10, 14) + C.r(x + 8 + j * (w - 20) / 3, y + 8 + fl * 22, 14, 2, trim); }
    let sc = ''; for (let xx = x + w * .35; xx < x + w; xx += 6) sc += '<path d="M' + f(xx) + ',' + f(y + 2) + ' q3,4 6,0" stroke="' + trim + '" stroke-width="1.2" fill="none"/>'; o += sc;
    o += C.r(tx - 6, C.gY - 20, w + 40, 3, trim) + C.rail(tx - 6, C.gY - 2, w + 40, 'rgba(255,255,255,.0)'); for (let k = 0; k < 8; k++) o += C.r(tx - 4 + k * (w + 36) / 7, C.gY - 20, 2, 20, trim);
    return o + C.door(x + w * .5, C.gY, 10, 16, '#3a1a12') + C.trees(C.RI2(1, 3), 'tree', C.gY + 4, tx - 10, x + w + 10);
  } });
  add('craftsman', { l: 'Craftsman bungalow', c: 'classic', set: ['suburb'], p: ['Pasadena', 'Portland', 'Seattle', 'Austin', 'Denver'], base: 1.3e6, beds: [2, 4], sqft: [1500, 3000], n: ['Craftsman Bungalow', 'Porch Bungalow', 'Arts & Crafts Home'], b: C => {
    const w = C.R2(140, 170), hh = C.R2(32, 38), x = 160 - w / 2, y = C.gY - hh, col = C.pk(['#6a7a5a', '#8a6a4a', '#5a6a7a', '#a8945a']);
    let o = C.r(x, y, w, hh, col); for (let yy = y + 4; yy < C.gY; yy += 4) o += C.L([[x, yy], [x + w, yy]], shade(col, -.2), .6);
    o += C.P([[x - 14, y + 2], [160, y - C.R2(26, 32)], [x + w + 14, y + 2]], '#3a3a40') + C.L([[x - 14, y + 2], [160, y - 28]], '#f6f2ee', 1.4) + C.r(160 - 16, y - 14, 32, 12, col) + C.glass(160 - 12, y - 12, 24, 8, 3);
    const pw = w * .55, px = 160 - pw / 2; o += C.r(px - 4, y + 6, pw + 8, 4, '#3a3a40'); [0, 1, 2, 3].forEach(k => { const cx2 = px + k * pw / 3; o += C.P([[cx2 - 5, C.gY], [cx2 - 3, C.gY - 12], [cx2 + 3, C.gY - 12], [cx2 + 5, C.gY]], '#8a8478') + C.P([[cx2 - 3, C.gY - 12], [cx2 - 2, y + 10], [cx2 + 2, y + 10], [cx2 + 3, C.gY - 12]], '#f6f2ee'); });
    o += C.win(x + 10, y + 12, 18, 14) + C.win(x + w - 28, y + 12, 18, 14) + C.door(156, C.gY, 11, 18, '#6a3a1a');
    return o + C.trees(C.RI2(2, 3), 'tree', C.gY + 4, x - 16, x + w + 16) + C.L([[0, C.gY + 3], [320, C.gY + 3]], C.day ? '#3f7a32' : '#0d1a10', 6);
  } });
  add('ranch', { l: 'Ranch house', c: 'classic', set: ['suburb', 'country', 'desert'], p: ['Texas', 'Arizona', 'Montana', 'Oklahoma', 'Wyoming'], base: 9e5, beds: [3, 5], sqft: [1800, 3600], n: ['Ranch House', 'Single-story Ranch', 'Prairie Ranch'], b: C => {
    const w = C.R2(170, 210), hh = C.R2(24, 28), x = 160 - w / 2 - 10, y = C.gY - hh, col = C.pk(['#efe9e2', '#c9b48a', '#a8b8c8', '#e2d3c2']);
    let o = C.r(x, y, w, hh, col) + C.r(x, C.gY - 10, w * .7, 10, '#8a4a32') + C.hip(x, y, w, C.R2(12, 16), C.pk(['#5a5a62', '#3a3f4f', '#6a4a3a']), 8);
    const gx = x + w * .72; o += C.r(gx, y + 6, w * .25, hh - 6, shade(col, -.1)); for (let k = 1; k < 5; k++) o += C.L([[gx + 2, y + 6 + k * (hh - 6) / 5], [gx + w * .25 - 2, y + 6 + k * (hh - 6) / 5]], shade(col, -.3), .8);
    o += C.glass(x + 20, y + 6, 40, 12, 4) + C.win(x + w * .5, y + 7, 14, 10) + C.door(x + 70, C.gY, 10, 18, '#6a3a1a') + C.chimney(x + w * .35, y - 6, 8, 12, '#8a4a32');
    return o + C.L([[x + w + 24, C.gY], [x + w + 24, C.gY - 12]], '#3a3a40', 1.6) + C.r(x + w + 20, C.gY - 17, 9, 6, '#2f6bff') + C.trees(C.RI2(1, 3), C.set === 'desert' ? 'cactus' : 'tree', C.gY + 4, x - 10, x + w + 30);
  } });
  add('chateau', { l: 'Château', c: 'classic', set: ['country', 'hills'], p: ['Loire Valley', 'Bordeaux', 'Provence', 'Burgundy'], base: 14e6, beds: [8, 14], sqft: [12000, 26000], n: ['Château', 'Manor Château', 'Vineyard Château'], b: C => {
    const w = C.R2(130, 160), hh = C.R2(44, 52), x = 160 - w / 2, y = C.gY - hh, wall = C.pk(['#e9e1cf', '#d8d0bc', '#efe6d4']), slate = '#3a4250';
    let o = C.P([[x, y], [x + 8, y - 26], [x + w - 8, y - 26], [x + w, y]], slate) + C.r(x, y, w, hh, wall);
    for (let k = 0; k < 4; k++) { const dx = x + 16 + k * (w - 32) / 3 - 6; o += C.r(dx, y - 22, 12, 16, wall) + '<path d="M' + f(dx) + ',' + f(y - 22) + ' A6,6 0 0 1 ' + f(dx + 12) + ',' + f(y - 22) + ' Z" fill="' + wall + '"/>' + C.win(dx + 3, y - 18, 6, 9); }
    for (let fl = 0; fl < 2; fl++) for (let j = 0; j < 7; j++) C.R(), o += C.win(x + 8 + j * (w - 16) / 7, y + 8 + fl * 20, 8, 14);
    [x - 24, x + w].forEach(tx => { const th = hh + C.R2(10, 20); o += C.r(tx, C.gY - th, 24, th, wall) + C.P([[tx - 3, C.gY - th], [tx + 12, C.gY - th - C.R2(30, 40)], [tx + 27, C.gY - th]], slate) + C.win(tx + 8, C.gY - th + 10, 8, 12) + C.win(tx + 8, C.gY - th + 30, 8, 12); });
    o += C.chimney(x + 30, y - 22, 6, 18, wall) + C.chimney(x + w - 36, y - 22, 6, 18, wall) + C.door(155, C.gY, 12, 20, '#3a2a20');
    let hedge = ''; for (let k = 0; k < 8; k++) hedge += C.r(20 + k * 37, C.gY + 6, 22, 6, C.vegC()); return o + hedge + C.trees(C.RI2(2, 4), 'cypress', C.gY + 2, x - 30, x + w + 30);
  } });
  add('castle', { l: 'Castle', c: 'classic', set: ['hills', 'country', 'mountain'], p: ['Scotland', 'Bavaria', 'Ireland', 'Loire Valley', 'Transylvania'], base: 22e6, beds: [8, 16], sqft: [15000, 40000], n: ['Highland Castle', 'Stone Keep', 'Ridge Castle'], b: C => {
    const stone = C.pk(['#8a8478', '#9a9488', '#7a756c']), w = C.R2(120, 150), hh = C.R2(40, 50), x = 160 - w / 2, y = C.gY - hh;
    const cren = (x0, y0, ww) => { let o2 = ''; for (let xx = x0; xx < x0 + ww - 3; xx += 7) o2 += C.r(xx, y0 - 5, 4, 5, stone); return o2; };
    let o = C.r(x, y, w, hh, stone) + cren(x, y, w);
    [[x - 18, 1.5], [x + w - 6, 1.6], [160 - 12, 1.9]].forEach((t, i) => { const tw = 24, th = hh * t[1] * C.R2(.9, 1.05), tx = t[0]; o += C.r(tx, C.gY - th, tw, th, shade(stone, i * .05)) + (C.R() < .5 ? C.P([[tx - 3, C.gY - th], [tx + tw / 2, C.gY - th - C.R2(22, 32)], [tx + tw + 3, C.gY - th]], C.pk(['#3a4250', '#5a2a2a'])) : cren(tx, C.gY - th, tw)); for (let k = 0; k < 3; k++) o += C.r(tx + 10, C.gY - th + 10 + k * 16, 3, 8, C.wc(C.R() < C.lit + .1)); if (i === 2) o += C.L([[tx + 12, C.gY - th - 30], [tx + 12, C.gY - th - 44]], '#16181f', 1.2) + C.P([[tx + 12, C.gY - th - 44], [tx + 26, C.gY - th - 40], [tx + 12, C.gY - th - 36]], C.pk(['#c2352b', '#2f6bff', '#ffc21a'])); });
    o += '<path d="M' + f(160 - 10) + ',' + f(C.gY) + ' L' + f(160 - 10) + ',' + f(C.gY - 14) + ' A10,10 0 0 1 ' + f(160 + 10) + ',' + f(C.gY - 14) + ' L' + f(160 + 10) + ',' + f(C.gY) + ' Z" fill="#2a1a12"/>';
    for (let k = 0; k < 30; k++) o += C.r(x + C.R() * w, y + C.R() * hh, 6, 1, shade(stone, -.2), ' opacity=".5"');
    return o + C.trees(C.RI2(2, 4), C.set === 'mountain' ? 'pine' : 'tree', C.gY + 4, x - 24, x + w + 24);
  } });
  add('mediterranean', { l: 'Mediterranean villa', c: 'classic', set: ['coast', 'hills'], p: ['Mykonos', 'Amalfi', 'Côte d\'Azur', 'Mallorca', 'Monaco'], base: 6e6, beds: [4, 8], sqft: [4200, 10000], n: ['Riviera Villa', 'Terracotta Villa', 'Loggia Villa'], b: C => {
    const wall = C.pk(['#f6f2ee', '#f0e2cf', '#efe1c8']); let o = '', x = C.R2(60, 80);
    for (let k = 0; k < 2; k++) { const w = k ? C.R2(70, 90) : C.R2(90, 110), hh = k ? C.R2(30, 36) : C.R2(42, 50), y = C.gY - hh; o += C.r(x, y, w, hh, k ? shade(wall, -.06) : wall) + C.tile(x, y, w, C.R2(12, 16), 5);
      const n = Math.floor(w / 22); for (let j = 0; j < n; j++) { const ax = x + 6 + j * (w - 12) / n, aw = (w - 12) / n - 6; o += '<path d="M' + f(ax) + ',' + f(C.gY) + ' L' + f(ax) + ',' + f(C.gY - 14) + ' A' + f(aw / 2) + ',' + f(aw / 2) + ' 0 0 1 ' + f(ax + aw) + ',' + f(C.gY - 14) + ' L' + f(ax + aw) + ',' + f(C.gY) + ' Z" fill="' + (C.day ? '#2a2e3a' : '#ffd27a') + '" opacity="' + (C.day ? .7 : .6) + '"/>'; if (!k) o += C.win(ax + 2, y + 8, aw - 4, 12) + C.r(ax, y + 20, aw, 2, '#2a3a5a'); }
      x += w - 6; }
    return o + C.pool(C.R2(80, 120), C.gY + 4, C.R2(80, 120), 8) + C.trees(C.RI2(2, 4), 'cypress', C.gY + 2, 60, x) + C.veg(x + 8, C.gY + 2, .8, 'flowers');
  } });
  add('hacienda', { l: 'Hacienda', c: 'classic', set: ['desert', 'hills'], p: ['Santa Fe', 'Tucson', 'San Miguel', 'Oaxaca', 'Palm Springs'], base: 3.1e6, beds: [4, 7], sqft: [3600, 8000], n: ['Hacienda', 'Courtyard Hacienda', 'Adobe Estate'], b: C => {
    const w = C.R2(180, 220), hh = C.R2(28, 34), x = 160 - w / 2, y = C.gY - hh, wall = C.pk(['#d8b48c', '#e2c9a4', '#c9a37a']);
    let o = C.r(x, y, w, hh, wall) + C.r(x + w * .35, y - 16, w * .3, 16, wall) + C.tile(x + w * .35, y - 16, w * .3, 8, 3);
    o += C.P([[x - 8, y + 4], [x - 8, y + 1], [x + w + 8, y + 1], [x + w + 8, y + 4]], '#b4532d'); const n = 7;
    for (let j = 0; j < n; j++) { const ax = x + 8 + j * (w - 16) / n, aw = (w - 16) / n - 6; o += '<path d="M' + f(ax) + ',' + f(C.gY) + ' L' + f(ax) + ',' + f(y + 16) + ' A' + f(aw / 2) + ',' + f(aw / 2) + ' 0 0 1 ' + f(ax + aw) + ',' + f(y + 16) + ' L' + f(ax + aw) + ',' + f(C.gY) + ' Z" fill="' + shade(wall, -.45) + '"/>'; }
    for (let k = 0; k < 8; k++) o += C.r(x + 10 + k * (w - 20) / 8, y + 3, 3, 3, '#5a3a24');
    o += C.E(160, C.gY + 10, 12, 3, C.POOL) + C.r(157, C.gY + 2, 6, 8, '#c9a37a');
    for (let k = 0; k < 12; k++) o += C.E(x + w * .8 + C.R2(-10, 20), y + C.R2(-6, 14), C.R2(3, 6), C.R2(3, 5), C.pk(['#e2457a', '#ff5fa2', '#c2357a']));
    return o + C.trees(C.RI2(2, 4), C.set === 'desert' ? 'cactus' : 'palm', C.gY + 4, x - 10, x + w + 10);
  } });
  add('tudor', { l: 'Tudor manor', c: 'classic', set: ['suburb', 'country'], p: ['Surrey', 'Cotswolds', 'Kent', 'Greenwich'], base: 4.4e6, beds: [4, 7], sqft: [3800, 8000], n: ['Tudor Manor', 'Timber-frame House', 'Gabled Manor'], b: C => {
    const w = C.R2(140, 170), hh = C.R2(44, 52), x = 160 - w / 2, y = C.gY - hh, pl = '#efe9dc', tb = '#3a2a20';
    let o = C.r(x, y, w, hh, pl) + C.r(x, C.gY - 14, w, 14, '#8a4a32');
    [[x - 4, w * .42], [x + w * .5, w * .52]].forEach(g => { const gh = C.R2(30, 40); o += C.P([[g[0], y], [g[0] + g[1] / 2, y - gh], [g[0] + g[1], y]], pl) + C.L([[g[0] - 3, y + 1], [g[0] + g[1] / 2, y - gh - 2], [g[0] + g[1] + 3, y + 1]], '#3a3f4f', 4) + C.L([[g[0] + g[1] / 2, y - gh], [g[0] + g[1] / 2, y]], tb, 2) + C.L([[g[0] + g[1] * .25, y - gh / 2], [g[0] + g[1] * .25, y], [g[0] + g[1] / 2, y - gh * .6]], tb, 1.6) + C.L([[g[0] + g[1] * .75, y - gh / 2], [g[0] + g[1] * .75, y], [g[0] + g[1] / 2, y - gh * .6]], tb, 1.6); });
    o += C.r(x + w * .42 - 4, y - 18, w * .1 + 8, 18, '#3a3f4f');
    for (let xx = x + 8; xx < x + w; xx += 16) o += C.L([[xx, y], [xx, C.gY - 14]], tb, 2) + C.L([[xx, y], [xx + 8, y + (hh - 14) / 2], [xx, C.gY - 14]], tb, 1.2);
    o += C.L([[x, y + (hh - 14) / 2], [x + w, y + (hh - 14) / 2]], tb, 2);
    for (let j = 0; j < 4; j++) o += C.win(x + 14 + j * (w - 28) / 3 - 6, y + 6, 12, 10);
    return o + C.chimney(x + w * .82, y - 26, 9, 22, '#8a4a32', C.R() < .5) + C.door(x + w * .45, C.gY, 10, 14, '#3a2a20') + C.trees(C.RI2(2, 3), 'tree', C.gY + 4, x - 10, x + w + 10);
  } });
  // ===== Cabin & mountain =====
  add('aFrame', { l: 'A-frame cabin', c: 'cabin', set: ['forest', 'snow', 'lake'], p: ['Lake Tahoe', 'Big Bear', 'Catskills', 'Norway', 'Asheville'], base: 9e5, beds: [2, 4], sqft: [1000, 2400], n: ['A-Frame Cabin', 'Triangle Cabin', 'Peak A-Frame'], b: C => {
    const w = C.R2(80, 100), hh = C.R2(70, 84), x = 160 - w / 2 + C.R2(-20, 20), roofC = C.pk(['#2a2c34', '#3a2a20', '#5a3a24']);
    let o = C.P([[x - 8, C.gY], [x + w / 2, C.gY - hh], [x + w + 8, C.gY]], roofC) + C.P([[x + 8, C.gY], [x + w / 2, C.gY - hh + 16], [x + w - 8, C.gY]], C.G);
    for (let k = 1; k < 4; k++) o += C.L([[x + 8 + k * (w - 16) / 4, C.gY], [x + 8 + k * (w - 16) / 4, C.gY - (hh - 16) * (1 - Math.abs(k / 4 - .5) * 2)]], roofC, 1.4);
    o += C.L([[x + 18, C.gY - 28], [x + w - 18, C.gY - 28]], roofC, 1.4) + C.r(x - 20, C.gY - 6, w + 40, 6, '#6a4a30') + C.rail(x - 20, C.gY - 6, w + 40, 'rgba(0,0,0,0)');
    if (C.set === 'snow') o += C.L([[x - 8, C.gY - 2], [x + w / 2, C.gY - hh - 2], [x + w + 8, C.gY - 2]], '#f4f7ff', 3);
    return o + C.glow(x + w / 2, C.gY - 30, 60, 40, .5) + C.trees(C.RI2(3, 6), C.set === 'snow' ? 'snowpine' : 'pine', C.gY + 4, x - 24, x + w + 24, 1.2);
  } });
  add('logCabin', { l: 'Log cabin', c: 'cabin', set: ['forest', 'lake', 'mountain'], p: ['Montana', 'Colorado', 'Alaska', 'Ontario', 'Finland'], base: 7e5, beds: [2, 4], sqft: [1100, 2600], n: ['Log Cabin', 'Timber Cabin', 'Woodland Lodge'], b: C => {
    const w = C.R2(110, 140), hh = C.R2(34, 40), x = 160 - w / 2, y = C.gY - hh, lg = C.pk(['#8a5630', '#7a4a2a', '#9b6a3c']);
    let o = C.r(x, y, w, hh, lg); for (let yy = y + 4; yy < C.gY; yy += 5) { o += C.L([[x, yy], [x + w, yy]], shade(lg, -.35), 1.2) + C.E(x - 1, yy - 2.5, 2.6, 2.6, shade(lg, .2)) + C.E(x + w + 1, yy - 2.5, 2.6, 2.6, shade(lg, .2)); }
    o += C.gable(x, y, w, C.R2(22, 28), C.pk(['#3a3f4f', '#2a2228', '#5a3a24']), 8) + C.win(x + 14, y + 10, 16, 14, C.R() < C.lit + .3) + C.win(x + w - 30, y + 10, 16, 14, C.R() < C.lit + .3) + C.door(160 - 6, C.gY, 12, 22, '#4a2a14');
    const cx2 = x + w * .78; o += C.r(cx2, y - 30, 12, 30 + hh * .3, '#8a8478'); for (let k = 0; k < 6; k++) o += C.r(cx2 + 1, y - 28 + k * 5, 10, 1, '#6a655c'); o += '<path d="M' + f(cx2 + 6) + ',' + f(y - 32) + ' q-8,-8 0,-16 q8,-6 2,-16" stroke="#e8ecf5" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>';
    o += C.r(x - 4, C.gY - 18, w + 8, 2, '#5a3a24'); for (let k = 0; k < 6; k++) o += C.r(x - 4 + k * (w + 4) / 5, C.gY - 18, 2, 18, '#5a3a24');
    return o + C.glow(160, C.gY - 20, 70, 30, .5) + C.trees(C.RI2(3, 6), 'pine', C.gY + 4, x - 10, x + w + 10, 1.2);
  } });
  add('swissChalet', { l: 'Alpine chalet', c: 'cabin', set: ['snow', 'mountain'], p: ['Zermatt', 'St. Moritz', 'Courchevel', 'Aspen', 'Verbier'], base: 5.5e6, beds: [4, 7], sqft: [3200, 7500], n: ['Alpine Chalet', 'Ski Chalet', 'Peak Chalet'], b: C => {
    const w = C.R2(130, 160), hh = C.R2(50, 58), x = 160 - w / 2, y = C.gY - hh, wood = C.pk(['#6b4528', '#5a3a24', '#7a4a2a']);
    let o = C.r(x, C.gY - 18, w, 18, '#e9e4dc') + C.r(x, y, w, hh - 18, wood);
    o += C.P([[x - 18, y + 4], [160, y - C.R2(26, 32)], [x + w + 18, y + 4]], '#3a2a20') + C.L([[x - 18, y + 2], [160, y - 30], [x + w + 18, y + 2]], '#f4f7ff', 5);
    for (let k = 0; k < 2; k++) { const by = y + 14 + k * 17; o += C.r(x - 6, by, w + 12, 3, '#3a2414'); for (let xx = x - 4; xx < x + w + 6; xx += 5) o += C.r(xx, by - 7, 2.4, 7, '#8a5a32'); o += C.r(x - 6, by - 9, w + 12, 2, '#3a2414'); }
    for (let j = 0; j < 4; j++) { const wx = x + 12 + j * (w - 24) / 3 - 6; o += C.win(wx, y + 2, 12, 9) + C.win(wx, C.gY - 14, 12, 9) + C.r(wx - 1, C.gY - 5, 14, 3, '#5a3a24') + C.veg(wx + 6, C.gY - 4, .35, 'flowers'); }
    return o + C.glow(160, y + 20, 80, 40, .5) + C.trees(C.RI2(3, 6), 'snowpine', C.gY + 4, x - 20, x + w + 20, 1.1);
  } });
  add('skiLodge', { l: 'Timber ski lodge', c: 'cabin', set: ['snow'], p: ['Aspen', 'Whistler', 'Niseko', 'Vail', 'Chamonix'], base: 9e6, beds: [6, 10], sqft: [6000, 14000], n: ['Ski Lodge', 'Summit Lodge', 'Powder Lodge'], b: C => {
    let o = C.L([[0, C.R2(40, 60)], [320, C.R2(70, 100)]], '#2a2c34', .8); for (let k = 0; k < 3; k++) o += C.r(40 + k * 110, 50 + k * 14, 3, 60, '#3a3d48');
    const w = C.R2(190, 230), x = 160 - w / 2; o += C.r(x, C.gY - 12, w, 12, '#8a8478');
    [[x, w * .36, C.R2(46, 56)], [x + w * .34, w * .34, C.R2(62, 72)], [x + w * .66, w * .34, C.R2(40, 50)]].forEach(g => { const hh = g[2], y = C.gY - hh; o += C.r(g[0], y, g[1], hh - 12, C.pk(['#6b4528', '#5a3a24'])) + C.P([[g[0] + 4, y + 4], [g[0] + g[1] / 2, y - g[1] * .32 + 6], [g[0] + g[1] - 4, y + 4], [g[0] + g[1] - 4, C.gY - 12], [g[0] + 4, C.gY - 12]], C.G) + C.L([[g[0] - 8, y + 4], [g[0] + g[1] / 2, y - g[1] * .36], [g[0] + g[1] + 8, y + 4]], '#3a2a20', 6) + C.L([[g[0] - 8, y + 1], [g[0] + g[1] / 2, y - g[1] * .36 - 3], [g[0] + g[1] + 8, y + 1]], '#f4f7ff', 3); });
    return o + C.glow(160, C.gY - 30, w * .6, 40, .6) + C.trees(C.RI2(3, 5), 'snowpine', C.gY + 4, x - 10, x + w + 10, 1.2);
  } });
  add('treehouse', { l: 'Luxury treehouse', c: 'cabin', set: ['forest'], p: ['Costa Rica', 'Bali', 'Oregon', 'Sweden', 'New Zealand'], base: 1.2e6, beds: [1, 3], sqft: [600, 1600], n: ['Canopy Treehouse', 'Sky Nest', 'Forest Treehouse'], b: C => {
    const tx = C.R2(130, 170), ty = C.R2(80, 92), bark = '#5a3a24'; let o = C.P([[tx - 10, C.gY], [tx - 6, 30], [tx + 6, 30], [tx + 12, C.gY]], bark) + C.E(tx, 40, 70, 30, C.vegC()) + C.E(tx - 40, 56, 40, 20, C.vegC());
    const w = C.R2(60, 76), x = tx - w / 2, hh = C.R2(26, 32), wood = C.pk(['#8a5630', '#9b6a3c', '#6e4424']);
    o += C.r(x - 10, ty, w + 20, 4, '#5a3a24') + C.L([[x - 6, ty + 4], [tx - 4, ty + 26]], bark, 3) + C.L([[x + w + 6, ty + 4], [tx + 6, ty + 26]], bark, 3) + C.r(x, ty - hh, w, hh, wood) + C.glass(x + 8, ty - hh + 6, w * .45, hh - 12, 3) + C.P([[x - 6, ty - hh], [x + w * .5, ty - hh - C.R2(16, 22)], [x + w + 6, ty - hh]], '#2a2c34');
    o += C.L([[x + w - 10, ty + 4], [x + w - 10, C.gY]], '#8a6a4a', 1.4) + C.L([[x + w - 4, ty + 4], [x + w - 4, C.gY]], '#8a6a4a', 1.4); for (let yy = ty + 10; yy < C.gY; yy += 8) o += C.L([[x + w - 10, yy], [x + w - 4, yy]], '#8a6a4a', 1.2);
    const px = C.R2(250, 280); o += C.r(px - 4, ty - 4, 4, C.gY - ty + 4, bark) + C.r(px - 20, ty + 4, 36, 3, '#5a3a24') + '<path d="M' + f(x + w + 10) + ',' + f(ty + 2) + ' Q' + f((x + w + px) / 2) + ',' + f(ty + 18) + ' ' + f(px - 20) + ',' + f(ty + 4) + '" stroke="#c9b48a" stroke-width="1.6" fill="none"/>';
    return o + C.glow(tx, ty - 14, 50, 26, .6);
  } });
  add('barnConversion', { l: 'Barn conversion', c: 'cabin', set: ['country'], p: ['Vermont', 'Cotswolds', 'Hudson Valley', 'Napa', 'Tuscany'], base: 2.1e6, beds: [3, 5], sqft: [2600, 5200], n: ['Converted Barn', 'Modern Barn', 'Silo Barn House'], b: C => {
    const w = C.R2(110, 140), hh = C.R2(36, 44), x = 160 - w / 2 - 20, y = C.gY - hh, col = C.pk(['#8a2a22', '#16181f', '#2a2e3a', '#e9e4dc']);
    let o = C.r(x, y, w, hh, col) + C.P([[x - 6, y], [x + w * .12, y - 22], [x + w / 2, y - 34], [x + w * .88, y - 22], [x + w + 6, y]], C.pk(['#3a3f4f', '#5a5a62', '#16181f']));
    for (let xx = x + 4; xx < x + w; xx += 5) o += C.L([[xx, y], [xx, C.gY]], shade(col, -.25), .6);
    o += C.glass(160 - 20 - 20, C.gY - hh + 8, 40, hh - 8, 4) + C.L([[160 - 40, C.gY - hh + 8], [160, C.gY], [160 - 40, C.gY], [160, C.gY - hh + 8]], '#f4f4f4', 1.2, ' opacity=".6"') + C.P([[x + w / 2 - 8, y - 22], [x + w / 2, y - 30], [x + w / 2 + 8, y - 22], [x + w / 2 + 8, y - 14], [x + w / 2 - 8, y - 14]], C.wc(C.R() < C.lit + .2));
    const sx2 = x + w + 12, sh = C.R2(64, 80); o += C.r(sx2, C.gY - sh, 28, sh, '#c9ced9') + C.E(sx2 + 14, C.gY - sh, 14, 10, '#9aa0b0'); for (let yy = C.gY - sh + 8; yy < C.gY; yy += 8) o += C.L([[sx2, yy], [sx2 + 28, yy]], '#9aa0b0', .8);
    let fence = ''; for (let xx = 4; xx < 316; xx += 14) fence += C.r(xx, C.gY + 4, 2, 10, '#8a6a4a'); return o + fence + C.L([[0, C.gY + 8], [320, C.gY + 8]], '#8a6a4a', 1.4);
  } });
  // ===== Waterfront =====
  add('stiltBeach', { l: 'Beach house on stilts', c: 'water', set: ['coast'], p: ['Outer Banks', 'Malibu', 'Hamptons', 'Gold Coast', 'Tulum'], base: 4.5e6, beds: [3, 6], sqft: [2400, 6000], n: ['Stilt Beach House', 'Dune House', 'Shore House'], b: C => {
    const w = C.R2(110, 140), hh = C.R2(32, 38), x = 160 - w / 2, lift = C.R2(18, 24), y = C.gY - lift - hh, col = C.pk(['#cfe3e0', '#e9e4dc', '#a9c8ff', '#f4f1e8', '#d8c8a8']);
    let o = ''; for (let k = 0; k < 6; k++) o += C.r(x + 4 + k * (w - 10) / 5, C.gY - lift, 4, lift + 4, '#8a6c4a');
    o += C.r(x, y, w, hh, col); for (let yy = y + 4; yy < y + hh; yy += 4) o += C.L([[x, yy], [x + w, yy]], shade(col, -.15), .5);
    o += C.gable(x, y, w, C.R2(14, 20), C.pk(['#5a5a62', '#3a3f4f', '#8a8f9c']), 6) + C.glass(x + w * .3, y + 6, w * .5, hh - 10, 5) + C.r(x - 14, C.gY - lift, w + 28, 3, '#8a6c4a') + C.rail(x - 14, C.gY - lift, w + 28, 'rgba(0,0,0,0)'); for (let k = 0; k < 10; k++) o += C.r(x - 14 + k * (w + 26) / 9, C.gY - lift - 8, 1.4, 8, '#f4f4f4');
    o += C.L([[x + w + 14, C.gY - lift], [x + w + 34, C.gY + 2]], '#8a6c4a', 3) + C.P([[x - 22, C.gY - lift - 2], [x - 18, C.gY - lift - 30], [x - 14, C.gY - lift - 2]], C.pk(['#ff7a1a', '#1fd3ff', '#ffc21a']));
    return o + C.veg(C.R2(14, 40), C.gY + 4, .9, 'palm') + C.veg(C.R2(270, 300), C.gY + 4, .8, 'palm') + C.glow(160, y + hh / 2, 80, 30, .4);
  } });
  add('overwaterBungalow', { l: 'Overwater bungalow', c: 'water', set: ['lagoon'], p: ['Maldives', 'Bora Bora', 'Fiji', 'Tahiti'], base: 3.8e6, beds: [1, 3], sqft: [900, 2400], n: ['Overwater Villa', 'Lagoon Bungalow', 'Reef Villa'], b: C => {
    let o = C.r(0, C.gY + 4, 320, 3, '#8a6c4a'); const n = C.RI2(3, 4);
    for (let k = 0; k < n; k++) { const w = C.R2(50, 64), x = 20 + k * (280 / n) + C.R2(0, 10), y = C.gY - 2, hh = C.R2(16, 20); for (let j = 0; j < 4; j++) o += C.r(x + 2 + j * (w - 6) / 3, y, 2.4, 22, '#6a4a30'); o += C.r(x - 4, y, w + 8, 4, '#8a6c4a') + C.r(x, y - hh, w, hh, '#c9a37a') + C.glass(x + 6, y - hh + 4, w * .5, hh - 6, 3);
      o += C.P([[x - 10, y - hh + 2], [x + w / 2, y - hh - C.R2(20, 26)], [x + w + 10, y - hh + 2]], '#b8935a'); for (let j = 1; j < 6; j++) o += C.L([[x - 10 + j * (w + 20) / 6, y - hh + 2], [x + w / 2, y - hh - 22]], '#8a6a3a', .7);
      o += C.r(x + w + 2, y + 1, 10, 3, C.POOL) + C.glow(x + w / 2, y - 8, 30, 14, .6); }
    return o + C.veg(300, C.gY - 20, .7, 'palm');
  } });
  add('houseboat', { l: 'Houseboat', c: 'water', set: ['sea', 'canal'], p: ['Sausalito', 'Amsterdam', 'Seattle', 'Kerala', 'London'], base: 6.5e5, beds: [1, 3], sqft: [600, 1500], n: ['Houseboat', 'Floating Home', 'Harbor Houseboat'], b: C => {
    const w = C.R2(150, 180), x = 160 - w / 2, wy = C.gY + 6, col = C.pk(['#e9e4dc', '#cfe3e0', '#f7b2c4', '#a9c8ff', '#ffe08a']);
    let o = C.P([[x - 10, wy - 10], [x + w + 14, wy - 10], [x + w + 4, wy + 6], [x, wy + 6]], C.pk(['#2a2e3a', '#16181f', '#5a3a24'])) + C.r(x - 10, wy - 12, w + 24, 3, '#f4f4f4');
    const hw = w * .7, hx = x + 10, hh = C.R2(26, 32), y = wy - 12 - hh; o += C.r(hx, y, hw, hh, col); for (let xx = hx + 3; xx < hx + hw; xx += 4) o += C.L([[xx, y], [xx, y + hh]], shade(col, -.12), .5);
    o += C.r(hx - 4, y - 4, hw + 8, 4, '#3a3f4f') + C.rail(hx - 4, y - 4, hw + 8, 'rgba(0,0,0,0)'); for (let k = 0; k < 8; k++) o += C.r(hx - 4 + k * (hw + 6) / 7, y - 11, 1.2, 7, '#f4f4f4'); o += C.L([[hx - 4, y - 11], [hx + hw + 4, y - 11]], '#f4f4f4', 1);
    for (let j = 0; j < 4; j++) o += C.win(hx + 6 + j * (hw - 12) / 4, y + 8, (hw - 12) / 4 - 6, 12); o += C.E(hx + hw + 12, y + hh - 6, 5, 5, 'none', ' stroke="#ff3355" stroke-width="2.4"');
    o += C.r(x + w * .8, y - 20, 12, 8, C.pk(['#ffc21a', '#1fd38c'])) + C.E(x - 30, wy, 14, 3, '#e9eef5');
    return o + C.glow(hx + hw / 2, y + hh / 2, 80, 26, .5);
  } });
  add('floatingHouse', { l: 'Floating modern house', c: 'water', set: ['sea', 'lagoon'], p: ['Lake Geneva', 'Seattle', 'Copenhagen', 'Dubai'], base: 2.4e6, beds: [2, 4], sqft: [1400, 3200], n: ['Floating House', 'Pontoon Villa', 'Float Home'], b: C => {
    const w = C.R2(120, 150), x = 160 - w / 2, wy = C.gY + 4, hh = C.R2(28, 34), wall = C.pk(['#2a2e3a', '#f6f2ee', '#8a8f9c', '#6b4528']);
    let o = C.r(x - 14, wy - 6, w + 28, 8, '#c9ced9') + C.r(x, wy - 6 - hh, w, hh, wall) + C.glass(x + w * .2, wy - 6 - hh + 4, w * .7, hh - 8, 6) + C.r(x - 6, wy - 9 - hh, w + 12, 3, '#16181f');
    for (let k = 0; k < 5; k++) o += C.r(x + 8 + k * 16, wy - 15 - hh, 14, 6, '#0e1c46') + C.L([[x + 8 + k * 16, wy - 12 - hh], [x + 22 + k * 16, wy - 12 - hh]], '#3a5cb0', .6);
    o += '<g opacity=".25" transform="translate(0,' + f(wy * 2 + 4) + ') scale(1,-1)">' + C.r(x, wy - 6 - hh, w, hh, wall) + '</g>';
    return o + C.glow(160, wy - 20, w * .6, 26, .5);
  } });
  add('lighthouseHome', { l: 'Lighthouse home', c: 'water', set: ['cliff', 'coast'], p: ['Maine', 'Nova Scotia', 'Cornwall', 'Brittany', 'Cape Cod'], base: 1.8e6, beds: [2, 4], sqft: [1400, 3000], n: ['Lighthouse Keeper\'s House', 'Beacon Home', 'Harbor Light House'], b: C => {
    const rock = '#5a4e44', lx = C.R2(170, 210), base = C.gY; let o = C.P([[lx - 70, 180], [lx - 50, base - 6], [lx + 40, base - 10], [lx + 70, 180]], rock);
    const th = C.R2(90, 104), bw = 30, tw = 18; o += C.P([[lx - bw / 2, base - 6], [lx - tw / 2, base - 6 - th], [lx + tw / 2, base - 6 - th], [lx + bw / 2, base - 6]], '#f4f4f4');
    const bc = C.pk(['#c2352b', '#16181f', '#2f6bff']); for (let k = 1; k < 4; k += 2) { const y0 = base - 6 - th * k / 4, y1 = base - 6 - th * (k + 1) / 4, w0 = lerp(bw, tw, k / 4) / 2, w1 = lerp(bw, tw, (k + 1) / 4) / 2; o += C.P([[lx - w0, y0], [lx - w1, y1], [lx + w1, y1], [lx + w0, y0]], bc); }
    const ty = base - 6 - th; o += C.r(lx - 12, ty - 2, 24, 3, '#16181f') + C.r(lx - 8, ty - 14, 16, 12, C.night || C.sunset ? '#fff3b0' : C.G) + C.P([[lx - 10, ty - 14], [lx, ty - 24], [lx + 10, ty - 14]], bc);
    if (!C.day) o += C.P([[lx, ty - 8], [lx - 160, ty - 30], [lx - 160, ty + 14]], '#fff3b0', ' opacity=".18"') + C.glow(lx, ty - 8, 30, 20, .9);
    const cw = C.R2(50, 64), cxx = lx - bw / 2 - cw; o += C.r(cxx, base - 30, cw, 24, '#f4f1e8') + C.gable(cxx, base - 30, cw, 14, '#3a3f4f', 4) + C.win(cxx + 8, base - 24, 10, 10) + C.door(cxx + cw - 16, base - 6, 9, 14, '#2a3a5a');
    return o;
  } });
  add('islandVilla', { l: 'Private island', c: 'water', set: ['island'], p: ['Bahamas', 'Maldives', 'Fiji', 'Seychelles', 'Belize'], base: 30e6, beds: [6, 12], sqft: [8000, 20000], n: ['Private Island', 'Atoll Estate', 'Cay Retreat'], b: C => {
    const w = C.R2(70, 90), x = C.R2(120, 150), hh = C.R2(18, 22), y = 118, wall = C.pk(['#f6f2ee', '#efe1c8']);
    let o = C.r(x, y - hh, w, hh, wall) + C.glass(x + 6, y - hh + 4, w * .6, hh - 7, 4) + C.r(x - 4, y - hh - 3, w + 8, 3, '#2a2e3a') + C.r(x + w * .3, y - hh - 14, w * .5, 11, wall) + C.r(x + w * .3 - 3, y - hh - 16, w * .5 + 6, 2.4, '#2a2e3a') + C.r(x + w + 2, y - 4, 24, 4, C.POOL);
    for (let k = 0; k < C.RI2(3, 5); k++) o += C.veg(C.pk([C.R2(70, x - 6), C.R2(x + w + 26, 260)]), y + 2, C.R2(.5, .75), 'palm');
    const yx = C.R2(230, 270); o += C.P([[yx, 146], [yx + 50, 146], [yx + 42, 154], [yx + 6, 154]], '#f4f4f4') + C.r(yx + 12, 140, 26, 6, '#e9eef5') + C.r(yx + 16, 141, 16, 3, '#2a2e3a') + C.L([[yx + 4, 156], [yx - 20, 158]], '#ffffff', 1, ' opacity=".5"');
    return o + C.glow(x + w / 2, y - 10, 60, 20, .5);
  } });
  // ===== Unique =====
  add('geodesicDome', { l: 'Geodesic dome', c: 'unique', set: ['desert', 'forest', 'snow', 'hills'], p: ['Joshua Tree', 'Patagonia', 'Iceland', 'Big Sur', 'Sedona'], base: 8.5e5, beds: [1, 3], sqft: [900, 2200], n: ['Dome Home', 'Geo Dome', 'Star Dome'], b: C => {
    const r0 = C.R2(46, 60), c0 = 160 + C.R2(-30, 30), y0 = C.gY; let o = '<path d="M' + f(c0 - r0) + ',' + f(y0) + ' A' + f(r0) + ',' + f(r0) + ' 0 0 1 ' + f(c0 + r0) + ',' + f(y0) + ' Z" fill="' + C.pk(['#e9e4dc', '#f4f4f4', '#c9ced9']) + '"/>';
    const rows = 4; for (let a = 0; a <= rows; a++) { const ang0 = Math.PI * a / (rows * 2), ang1 = Math.PI * (a + 1) / (rows * 2); const n = 8 - a; for (let k = 0; k <= n; k++) { const t = Math.PI * k / n, x0 = c0 - Math.cos(t) * r0 * Math.cos(ang0), yA = y0 - r0 * Math.sin(ang0) * (a ? 1 : 0) - Math.sin(t) * 0, x1 = c0 - Math.cos(t + Math.PI / n / 2) * r0 * Math.cos(ang1), yB = y0 - r0 * Math.sin(ang1); if (a < rows) o += C.L([[x0, yA], [x1, yB]], '#5a5f6e', 1); } const yy = y0 - r0 * Math.sin(ang0), hw = r0 * Math.cos(ang0); if (a) o += C.L([[c0 - hw, yy], [c0 + hw, yy]], '#5a5f6e', 1); }
    for (let k = 0; k < 6; k++) { const t = C.R2(.25, 2.9), rr = r0 * C.R2(.45, .8); o += C.P([[c0 - Math.cos(t) * rr, y0 - Math.sin(t) * rr], [c0 - Math.cos(t + .2) * (rr + 9), y0 - Math.sin(t + .2) * (rr + 9)], [c0 - Math.cos(t + .3) * (rr - 4), y0 - Math.sin(t + .3) * (rr - 4)]], C.G, ' opacity=".9"'); }
    o += '<path d="M' + f(c0 - 8) + ',' + f(y0) + ' L' + f(c0 - 8) + ',' + f(y0 - 14) + ' A8,8 0 0 1 ' + f(c0 + 8) + ',' + f(y0 - 14) + ' L' + f(c0 + 8) + ',' + f(y0) + ' Z" fill="#2a2e3a"/>';
    const vk = { desert: 'cactus', forest: 'pine', snow: 'snowpine', hills: 'tree' }[C.set];
    return o + C.glow(c0, y0 - r0 / 2, r0 * 1.4, r0 * .8, .5) + C.trees(C.RI2(2, 4), vk, C.gY + 4, c0 - r0, c0 + r0, 1.1);
  } });
  add('containerHouse', { l: 'Container house', c: 'unique', set: ['desert', 'city', 'hills', 'coast'], p: ['Austin', 'Joshua Tree', 'Berlin', 'Melbourne', 'Cape Town'], base: 6e5, beds: [1, 3], sqft: [800, 2000], n: ['Container Home', 'Box Stack House', 'Cargo Loft'], b: C => {
    const cw = C.R2(70, 84), ch = 20; let o = '';
    const box = (x, y, col, gl) => { let s = C.r(x, y - ch, cw, ch, col); for (let xx = x + 3; xx < x + cw - 2; xx += 3) s += C.L([[xx, y - ch + 1], [xx, y - 1]], shade(col, -.25), .8); s += C.r(x, y - ch, cw, 2, shade(col, .2)) + C.r(x, y - 2, cw, 2, shade(col, -.4)); if (gl) s += C.glass(x + gl[0] * cw, y - ch + 3, gl[1] * cw, ch - 6, 3); return s; };
    const cols = ['#d9542b', '#2f6bff', '#1f8a5a', '#8a8f9c', '#ffc21a', '#c2352b', '#16181f'], x0 = 160 - cw + C.R2(-20, 10);
    o += box(x0, C.gY, C.pk(cols), [.1, .5]) + box(x0 + cw + 2, C.gY, C.pk(cols), [.4, .5]) + box(x0 + C.R2(20, 50), C.gY - ch - 1, C.pk(cols), [.05, .7]);
    if (C.R() < .7) o += box(x0 - C.R2(10, 30), C.gY - 2 * ch - 2, C.pk(cols), [.5, .45]);
    o += C.L([[x0 + 2 * cw + 4, C.gY], [x0 + 2 * cw - 18, C.gY - ch]], '#2a2c36', 2.4) + C.rail(x0 + C.R2(20, 50), C.gY - 2 * ch - 1, cw, 'rgba(200,225,255,.25)');
    return o + C.glow(160, C.gY - 30, 70, 30, .4) + C.trees(C.RI2(1, 3), C.set === 'desert' ? 'cactus' : C.set === 'coast' ? 'palm' : 'tree', C.gY + 4, x0 - 30, x0 + 2 * cw + 10);
  } });
  add('earthHouse', { l: 'Earth-sheltered home', c: 'unique', set: ['hills', 'country'], p: ['Wales', 'New Zealand', 'Shire Valley', 'Scotland', 'Vermont'], base: 9.5e5, beds: [2, 3], sqft: [1100, 2400], n: ['Hill Home', 'Burrow House', 'Grass Roof Hideaway'], b: C => {
    const c0 = 160 + C.R2(-30, 30), w = C.R2(150, 190); let o = '<path d="M' + f(c0 - w / 2) + ',' + f(C.gY + 2) + ' Q' + f(c0 - w * .3) + ',' + f(C.gY - 70) + ' ' + f(c0) + ',' + f(C.gY - 66) + ' Q' + f(c0 + w * .35) + ',' + f(C.gY - 62) + ' ' + f(c0 + w / 2) + ',' + f(C.gY + 2) + ' Z" fill="' + (C.day ? '#5b9a4a' : C.night ? '#16241a' : '#3a3048') + '"/>';
    o += C.E(c0, C.gY - 2, 22, 26, '#8a6a4a') + C.E(c0, C.gY - 2, 17, 21, C.pk(['#2a6a3a', '#c2352b', '#ffc21a', '#2f6bff'])) + C.E(c0 + 9, C.gY - 6, 2, 2, '#d4a64a') + C.r(c0 - 24, C.gY - 2, 48, 6, C.vegC());
    [-48, 44].forEach(dx => o += C.E(c0 + dx, C.gY - 18, 10, 10, '#8a6a4a') + C.E(c0 + dx, C.gY - 18, 7.5, 7.5, C.wc(C.R() < C.lit + .3)) + C.L([[c0 + dx - 7.5, C.gY - 18], [c0 + dx + 7.5, C.gY - 18]], '#8a6a4a', 1) + C.L([[c0 + dx, C.gY - 25.5], [c0 + dx, C.gY - 10.5]], '#8a6a4a', 1));
    o += C.chimney(c0 + w * .2, C.gY - 52, 7, 16, '#8a8478', true) + C.veg(c0 - 34, C.gY + 4, .6, 'flowers') + C.veg(c0 + 34, C.gY + 4, .6, 'flowers') + C.L([[c0, C.gY + 4], [c0 - 10, 180]], '#c9b48a', 8);
    return o + C.glow(c0, C.gY - 10, 50, 20, .5) + C.trees(C.RI2(1, 3), 'tree', C.gY + 4, c0 - w / 2, c0 + w / 2);
  } });
  add('tinyHouse', { l: 'Tiny house on wheels', c: 'unique', set: ['forest', 'country', 'lake', 'coast'], p: ['Oregon', 'Colorado', 'Vermont', 'Big Sur', 'Asheville'], base: 1.4e5, beds: [0, 1], sqft: [180, 400], n: ['Tiny House', 'Micro Cabin', 'Nomad Tiny Home'], b: C => {
    const w = C.R2(76, 92), hh = C.R2(36, 42), x = 160 - w / 2 + C.R2(-30, 30), y = C.gY - 14 - hh, wood = C.pk(['#9b6a3c', '#2a2e3a', '#cfe3e0', '#8a2a22', '#e9e4dc']);
    let o = C.r(x - 4, C.gY - 14, w + 8, 4, '#2a2c36') + C.L([[x + w + 4, C.gY - 12], [x + w + 24, C.gY - 6]], '#2a2c36', 2.4) + C.E(x + w * .45, C.gY - 7, 7, 7, '#111') + C.E(x + w * .45 + 16, C.gY - 7, 7, 7, '#111') + C.E(x + w * .45, C.gY - 7, 3, 3, '#8a8f9c') + C.E(x + w * .45 + 16, C.gY - 7, 3, 3, '#8a8f9c');
    o += C.r(x, y, w, hh, wood); for (let xx = x + 3; xx < x + w; xx += 4) o += C.L([[xx, y], [xx, y + hh]], shade(wood, -.2), .5);
    o += (C.R() < .5 ? C.P([[x - 4, y + 2], [x - 4, y - 6], [x + w + 4, y - 16], [x + w + 4, y + 2]], '#3a3f4f') : C.gable(x, y, w, 16, '#3a3f4f', 4)) + C.glass(x + 8, y + 8, w * .35, hh * .45, 2) + C.door(x + w * .62, y + hh, 11, hh - 6, C.pk(['#ffc21a', '#2f6bff', '#e2577a', '#3a2a20'])) + C.r(x + 6, y - 6, 22, 4, '#0e1c46');
    return o + C.glow(x + w / 2, y + hh / 2, 50, 24, .5) + C.trees(C.RI2(2, 4), C.set === 'coast' ? 'palm' : C.set === 'country' ? 'tree' : 'pine', C.gY + 4, x - 10, x + w + 30);
  } });

  // ---------------- categories (filter chips) ----------------
  const CATS = { tower: { label: 'Towers' }, town: { label: 'Townhouses' }, modern: { label: 'Modern' }, classic: { label: 'Classic' }, cabin: { label: 'Cabins & mountain' }, water: { label: 'Waterfront' }, unique: { label: 'Unique' } };
  const KEYS = Object.keys(AR);

  // ---------------- regenerate the 100 listings: each type appears twice, with its own variation ----------------
  const SIGCAT = { studio: 'town', condo: 'tower', chalet: 'cabin', penthouse: 'tower', villa: 'modern', beach: 'water', island: 'water' };
  const SIGL = { studio: 'Walk-up studio', condo: 'Balcony condo', chalet: 'Alpine chalet', penthouse: 'Rooftop-pool penthouse', villa: 'Modern box villa', beach: 'Beach house', island: 'Private island' };
  const sig = Art.HOUSES.filter(h => !/^h\d+$/.test(h.id));
  sig.forEach(h => { h.sigKind = h.sigKind || h.kind; h.kind = SIGCAT[h.sigKind] || 'modern'; h.archL = SIGL[h.sigKind] || ''; });
  const r = rng(60606), pick = a => a[Math.floor(r() * a.length)];
  const gen = [];
  for (let i = 0; i < 100; i++) {
    const key = KEYS[i % KEYS.length], A = AR[key], place = pick(A.p), mult = { Monaco: 2.6, Malibu: 2, 'New York': 1.8, Aspen: 1.8, London: 1.6, Zermatt: 1.6, Dubai: 1.4, 'Lake Como': 1.7, Maldives: 1.6, 'Los Angeles': 1.5, Singapore: 1.5, Hamptons: 1.8, 'St. Moritz': 2, Courchevel: 2 }[place] || pick([.7, .85, 1, 1.1, 1.25]);
    const beds = A.beds[0] + Math.floor(r() * (A.beds[1] - A.beds[0] + 1)), t = (beds - A.beds[0]) / Math.max(1, A.beds[1] - A.beds[0]);
    const sqft = Math.round((A.sqft[0] + (A.sqft[1] - A.sqft[0]) * (t * .7 + r() * .3)) / 10) * 10;
    const usd = Math.max(60000, Math.round(A.base * mult * (.65 + t * .8) * (.85 + r() * .3) / 5000) * 5000);
    gen.push({ id: 'h' + i, arch: key, archL: A.l, kind: A.c, set: pick(A.set), name: (beds ? beds + 'BR ' : '') + pick(A.n), place, usd, beds, baths: Math.max(1, beds - Math.floor(r() * 2)), sqft, tod: pick(['day', 'day', 'sunset', 'night']), v: i, blurb: pick(['Move-in ready.', 'Views all day.', 'Perfect for flex content.', 'Quiet street, loud bags.', 'Comes furnished.', 'Recently renovated.', 'Smart home, dumb money.', 'Seller is a whale who got rugged.', 'Bought with memecoin money once. Twice now.', 'Neighbors are all devs. Mostly honest.', 'Fiber internet, sub-10ms to the RPC.', 'Floor-to-ceiling glass for chart screens.']) });
  }
  Art.HOUSES.length = 0; sig.concat(gen).forEach(h => Art.HOUSES.push(h));
  Object.keys(Art.HOUSE_BY).forEach(k => delete Art.HOUSE_BY[k]); Art.HOUSES.forEach(h => Art.HOUSE_BY[h.id] = h);
  Object.keys(Art.KINDS).forEach(k => delete Art.KINDS[k]); Object.assign(Art.KINDS, CATS);

  function art(h) {
    const A = AR[h.arch]; const C = ctx(h, h.set || A.set[0]);
    let b = '';
    try { b = A.b(C); } catch (e) { b = ''; }
    return '<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" class="art-house">' + C.defs + C.s + b + '</svg>';
  }
  const prevHouse = Art.house;
  Art.houseArt = function (h) { if (h && h.arch && AR[h.arch]) return art(h); return prevHouse(h.sigKind || h.id, { wall: h.wall, seed: h.seed }); };
  Art.HOUSE_TYPES = AR; Art.HOUSE_CATS = CATS;
  Art.hctx = ctx; Art.hsvg = (C, b) => '<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" class="art-house">' + C.defs + C.s + b + '</svg>';
})(typeof window !== 'undefined' ? window : globalThis);
