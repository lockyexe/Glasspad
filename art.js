/* Glasspad art — original SVG illustrations: 1000+ fictional cars and 100+ houses, generated deterministically. */
(function (G) {
  'use strict';
  let uid = 0;
  function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function shade(h, f) { const c = hex2rgb(h).map(v => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)); return '#' + c.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join(''); }

  // ================= CARS =================
  const SHAPES = {
    wedge: { body: 'M22,104 L24,88 Q26,80 40,78 L118,70 Q150,46 192,44 Q224,46 252,68 L298,84 Q308,88 306,100 L304,106 L266,106 A26,26 0 0 0 214,106 L106,106 A26,26 0 0 0 54,106 L26,106 Z', win: 'M128,69 Q155,51 190,50 Q215,52 238,67 Z', wheels: [[80, 106, 22], [240, 106, 22]], vent: 'M118,84 L164,80 L152,97 L122,99 Z', head: 'M284,84 L303,90 L299,94 L280,88 Z', tail: 'M24,88 L38,86 L38,91 L24,93 Z', line: 'M42,82 L120,74', stripe: 'M30,92 L300,94', wingAt: [38, 78] },
    gt: { body: 'M20,102 Q20,86 34,84 Q60,80 96,76 Q128,52 178,50 Q214,50 238,70 Q272,76 296,84 Q308,90 304,104 L268,106 A25,25 0 0 0 218,106 L104,106 A25,25 0 0 0 54,106 L24,106 Z', win: 'M108,74 Q134,56 176,55 Q206,56 226,70 Z', wheels: [[79, 106, 21], [243, 106, 21]], vent: 'M124,86 L156,84 L150,92 L126,93 Z', head: 'M280,82 L300,88 L297,92 L278,87 Z', tail: 'M21,90 L34,87 L34,93 L21,95 Z', line: 'M36,88 Q160,78 290,90', stripe: 'M28,96 Q160,88 298,98', wingAt: [36, 84] },
    spyder: { body: 'M22,104 L24,88 Q26,80 40,79 L150,75 L196,66 L212,62 L216,66 L206,73 L298,84 Q308,88 306,100 L304,106 L266,106 A26,26 0 0 0 214,106 L106,106 A26,26 0 0 0 54,106 L26,106 Z', win: 'M198,66 L214,58 L218,61 L206,70 Z', wheels: [[80, 106, 22], [240, 106, 22]], vent: 'M118,86 L160,82 L150,97 L122,99 Z', head: 'M284,84 L303,90 L299,94 L280,88 Z', tail: 'M24,88 L38,86 L38,91 L24,93 Z', line: 'M42,83 L150,77', stripe: 'M30,93 L300,95', wingAt: [38, 79],
      extra: c => '<path d="M118,77 Q124,60 140,61 L146,76 Z" fill="' + shade(c, -0.35) + '"/><path d="M150,76 Q156,63 170,64 L174,74 Z" fill="' + shade(c, -0.35) + '"/><path d="M112,78 L196,70" stroke="#14141c" stroke-width="5" stroke-linecap="round"/>' },
    hyper: { body: 'M14,100 L16,90 Q20,82 34,80 L124,74 Q154,54 186,52 Q214,54 240,72 L300,88 Q312,94 306,104 L268,106 A25,25 0 0 0 218,106 L104,106 A25,25 0 0 0 54,106 L18,106 Z', win: 'M134,73 Q158,58 186,57 Q210,59 228,71 Z', wheels: [[79, 106, 21], [243, 106, 21]], vent: 'M110,86 L170,80 L160,98 L114,100 Z', head: 'M286,88 L305,94 L301,97 L282,92 Z', tail: 'M15,90 L40,88 L40,92 L15,94 Z', line: 'M36,84 L126,77', stripe: 'M24,95 L302,99', wingAt: [30, 80], under: true,
      extra: c => '<path d="M56,80 L114,58 L126,75 Z" fill="' + shade(c, -0.45) + '"/><path d="M16,98 L48,98 L46,104 L18,104 Z" fill="#111"/>' },
    suv: { body: 'M22,108 L22,70 Q22,58 34,56 L74,54 L96,30 Q100,26 108,26 L214,26 Q222,26 226,32 L246,54 L290,58 Q302,60 302,72 L302,108 L272,108 A28,28 0 0 0 216,108 L108,108 A28,28 0 0 0 52,108 Z', win: 'M104,34 L150,34 L150,54 L84,54 Z M156,34 L212,34 L232,54 L156,54 Z', wheels: [[80, 110, 24], [244, 110, 24]], head: 'M290,64 L302,64 L302,74 L290,74 Z', tail: 'M22,66 L30,66 L30,80 L22,80 Z', line: 'M24,82 L300,82', stripe: 'M24,92 L300,92',
      extra: c => '<circle cx="15" cy="84" r="13" fill="#15151c" stroke="' + shade(c, -0.3) + '" stroke-width="3"/><path d="M104,22 L214,22" stroke="#22222a" stroke-width="4" stroke-linecap="round"/>' },
    ev: { body: 'M24,102 Q22,84 40,80 Q80,74 112,68 Q150,44 200,46 Q240,50 266,72 Q296,80 302,92 Q304,104 296,106 L268,106 A25,25 0 0 0 218,106 L106,106 A25,25 0 0 0 56,106 L28,106 Z', win: 'M120,68 Q154,50 198,51 Q232,54 252,70 Z', wheels: [[81, 106, 21], [243, 106, 21]], head: 'M272,76 L300,88 L298,90 L270,79 Z', tail: 'M24,88 L60,84 L60,87 L24,91 Z', line: 'M40,90 Q170,80 296,94', stripe: 'M34,96 Q170,88 298,99' },
    sedan: { body: 'M20,104 L22,86 Q24,80 36,78 L78,76 L106,54 Q112,50 122,50 L196,50 Q206,50 214,56 L242,74 L294,80 Q306,84 304,100 L302,106 L268,106 A25,25 0 0 0 218,106 L104,106 A25,25 0 0 0 54,106 L24,106 Z', win: 'M112,56 L156,56 L156,74 L92,74 Z M162,56 L204,56 Q210,57 214,62 L230,74 L162,74 Z', wheels: [[79, 106, 21], [243, 106, 21]], head: 'M286,82 L302,86 L300,91 L284,88 Z', tail: 'M21,86 L33,84 L33,90 L21,92 Z', line: 'M30,90 L298,92', stripe: 'M28,96 L300,98' },
    muscle: { body: 'M18,104 L18,84 Q20,76 34,74 L96,70 L132,52 Q140,48 152,48 L196,48 Q206,48 214,56 L232,70 L298,76 Q308,78 308,90 L306,106 L270,106 A25,25 0 0 0 220,106 L104,106 A25,25 0 0 0 54,106 L20,106 Z', win: 'M138,54 Q144,52 152,52 L194,52 Q204,52 210,58 L224,70 L118,70 Z', wheels: [[79, 106, 22], [245, 106, 22]], head: 'M298,80 L308,82 L308,90 L298,88 Z', tail: 'M18,82 L28,80 L28,88 L18,90 Z', line: 'M24,86 L304,88', stripe: 'M22,94 L306,96', wingAt: [34, 74],
      extra: c => '<path d="M244,72 L264,66 L272,72 Z" fill="' + shade(c, -0.5) + '"/>' },
    classic: { body: 'M22,102 Q18,88 32,84 Q70,78 104,74 Q122,56 150,54 Q180,52 200,62 Q214,70 222,74 Q270,76 296,84 Q312,90 304,104 L268,106 A24,24 0 0 0 220,106 L104,106 A24,24 0 0 0 56,106 L26,106 Z', win: 'M116,74 Q132,60 152,59 Q176,58 194,66 L206,74 Z', wheels: [[80, 106, 20], [244, 106, 20]], head: 'M291,86 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0 Z', tail: 'M22,90 L30,88 L30,94 L22,96 Z', line: 'M30,95 Q160,90 300,97', stripe: 'M30,88 Q160,82 300,90', chrome: true },
    truck: { body: 'M16,110 L16,74 Q16,66 26,66 L120,66 L120,40 Q120,30 130,30 L196,30 Q204,30 210,38 L228,62 L292,66 Q304,68 304,80 L304,110 L274,110 A28,28 0 0 0 218,110 L110,110 A28,28 0 0 0 54,110 Z', win: 'M128,38 L166,38 L166,60 L128,60 Z M172,38 L200,38 Q204,38 207,42 L220,60 L172,60 Z', wheels: [[82, 112, 25], [246, 112, 25]], head: 'M292,72 L304,72 L304,82 L292,82 Z', tail: 'M16,72 L24,72 L24,86 L16,86 Z', line: 'M18,88 L302,88', stripe: 'M18,96 L302,96',
      extra: c => '<path d="M16,66 L120,66" stroke="' + shade(c, -0.5) + '" stroke-width="3"/>' },
    hatch: { body: 'M40,104 L40,80 Q42,70 56,68 L82,66 L108,46 Q114,42 124,42 L188,42 Q198,42 206,50 L228,66 L276,72 Q288,76 288,92 L286,106 L258,106 A22,22 0 0 0 214,106 L114,106 A22,22 0 0 0 70,106 L44,106 Z', win: 'M112,50 L150,50 L150,66 L92,66 Z M156,50 L190,50 Q198,50 202,55 L214,66 L156,66 Z', wheels: [[92, 106, 19], [236, 106, 19]], head: 'M272,76 L286,80 L285,86 L271,83 Z', tail: 'M40,74 L48,73 L48,84 L40,85 Z', line: 'M44,86 L284,88', stripe: 'M44,94 L284,96', wingAt: [60, 64] }
  };
  function wheel(x, y, r, accent, id, style, rimCol) {
    rimCol = rimCol || '#d8dbe6';
    let s = '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#0a0a0f"/><circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.7).toFixed(1) + '" fill="url(#rim' + id + ')"/>' +
      '<rect x="' + (x + r * 0.18) + '" y="' + (y - r * 0.42) + '" width="' + (r * 0.22) + '" height="' + (r * 0.5) + '" rx="2" fill="' + accent + '"/>';
    const n = style === 'multi' ? 10 : style === 'wire' ? 16 : style === 'dish' ? 0 : 5, w = style === 'multi' ? 0.07 : style === 'wire' ? 0.03 : 0.13;
    if (style === 'dish') s += '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.6).toFixed(1) + '" fill="' + rimCol + '" opacity=".85"/><circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.4).toFixed(1) + '" fill="none" stroke="#555a66" stroke-width="1.2"/>';
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 - Math.PI / 2; s += '<path d="M' + x + ',' + y + ' L' + (x + Math.cos(a) * r * 0.64).toFixed(1) + ',' + (y + Math.sin(a) * r * 0.64).toFixed(1) + '" stroke="' + rimCol + '" stroke-width="' + (r * w).toFixed(2) + '" stroke-linecap="round"/>'; }
    return s + '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.14).toFixed(1) + '" fill="#2b2d38"/>';
  }
  function car(shape, color, opt) {
    opt = opt || {}; const S = SHAPES[shape] || SHAPES.wedge, id = ++uid, accent = opt.accent || '#ff3355';
    const gy = Math.max.apply(null, S.wheels.map(w => w[1] + w[2]));
    let s = '<svg viewBox="0 0 320 ' + (opt.bg ? 170 : 140) + '" xmlns="http://www.w3.org/2000/svg" class="art-car"><defs>' +
      '<linearGradient id="b' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + shade(color, 0.35) + '"/><stop offset=".45" stop-color="' + color + '"/><stop offset="1" stop-color="' + shade(color, -0.55) + '"/></linearGradient>' +
      '<linearGradient id="w' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + (opt.tint ? '#3a4152' : '#9fb8ff') + '" stop-opacity=".85"/><stop offset=".5" stop-color="#1a2036"/><stop offset="1" stop-color="#0b0e18"/></linearGradient>' +
      '<radialGradient id="rim' + id + '"><stop offset="0" stop-color="#5a5e6e"/><stop offset="1" stop-color="#1b1d26"/></radialGradient>' +
      '<radialGradient id="sp' + id + '" cx=".5" cy=".75" r=".6"><stop offset="0" stop-color="' + (opt.glow || color) + '" stop-opacity=".45"/><stop offset="1" stop-color="' + (opt.glow || color) + '" stop-opacity="0"/></radialGradient>' +
      '<filter id="f' + id + '"><feGaussianBlur stdDeviation="4"/></filter></defs>';
    if (opt.bg) s += '<rect width="320" height="170" fill="#07080f"/><rect y="' + (gy - 4) + '" width="320" height="' + (170 - gy + 4) + '" fill="#0d0f1a"/><ellipse cx="160" cy="' + (gy - 20) + '" rx="190" ry="80" fill="url(#sp' + id + ')"/><path d="M0,' + (gy - 4) + ' L320,' + (gy - 4) + '" stroke="rgba(255,255,255,.08)"/>';
    s += '<ellipse cx="162" cy="' + gy + '" rx="150" ry="7" fill="#000" opacity=".7" filter="url(#f' + id + ')"/>';
    if (opt.bg) s += '<g opacity=".13" transform="translate(0,' + (gy * 2) + ') scale(1,-1)"><path d="' + S.body + '" fill="' + color + '"/></g>';
    s += (S.extra && S.under ? S.extra(color) : '') + '<path d="' + S.body + '" fill="url(#b' + id + ')" stroke="' + shade(color, -0.6) + '" stroke-width="1"/>' +
      (opt.stripe ? '<path d="' + S.stripe + '" stroke="' + opt.stripe + '" stroke-width="4" fill="none" opacity=".9"/><path d="' + S.stripe + '" stroke="' + opt.stripe + '" stroke-width="1.5" fill="none" transform="translate(0,6)" opacity=".9"/>' : '') +
      (S.extra && !S.under ? S.extra(color) : '') + '<path d="' + S.win + '" fill="url(#w' + id + ')"/>' + (S.vent ? '<path d="' + S.vent + '" fill="#0b0b12" opacity=".85"/>' : '') +
      '<path d="' + S.line + '" stroke="' + (S.chrome ? 'rgba(235,240,255,.85)' : 'rgba(255,255,255,.45)') + '" stroke-width="' + (S.chrome ? 2 : 1.3) + '" fill="none"/>' +
      '<path d="' + S.head + '" fill="#e9f6ff"/><path d="' + S.tail + '" fill="#ff2a3d"/>' +
      (opt.wing && S.wingAt ? '<path d="M' + S.wingAt[0] + ',' + S.wingAt[1] + ' L' + (S.wingAt[0] + 6) + ',' + (S.wingAt[1] - 14) + '" stroke="#15151c" stroke-width="4"/><path d="M' + (S.wingAt[0] - 16) + ',' + (S.wingAt[1] - 18) + ' L' + (S.wingAt[0] + 30) + ',' + (S.wingAt[1] - 21) + ' L' + (S.wingAt[0] + 30) + ',' + (S.wingAt[1] - 15) + ' L' + (S.wingAt[0] - 14) + ',' + (S.wingAt[1] - 12) + ' Z" fill="' + shade(color, -0.5) + '"/>' : '') +
      S.wheels.map(w => wheel(w[0], w[1], w[2], accent, id, opt.rimStyle, opt.rim)).join('') + '</svg>';
    return s;
  }
  // legacy "signature" cars (keep ids for saved games)
  const SIG = [
    { id: 'strada', name: 'Strada GT', shape: 'gt', usd: 185000, color: '#2f6bff', blurb: 'Grand tourer. Your first "I made it" car.', cls: 'gt', brand: 'Signature', year: 2025, hp: 520 },
    { id: 'eclipse', name: 'Eclipse EV', shape: 'ev', usd: 140000, color: '#e8ecf5', blurb: 'Silent, fast, very "tech founder".', cls: 'ev', brand: 'Signature', year: 2026, hp: 670 },
    { id: 'bastion', name: 'Bastion 4x4', shape: 'suv', usd: 195000, color: '#16181f', blurb: 'The boxy SUV every trencher parks outside the hotel.', cls: 'suv', brand: 'Signature', year: 2025, hp: 577 },
    { id: 'vento', name: 'Vento Spyder', shape: 'spyder', usd: 240000, color: '#ffc21a', blurb: 'Roof off, bags up.', cls: 'super', brand: 'Signature', year: 2024, hp: 610 },
    { id: 'corsa', name: 'Corsa RS', shape: 'wedge', usd: 330000, color: '#ff2a4d', wing: true, blurb: 'Track wing for driving to the bank.', cls: 'super', brand: 'Signature', year: 2025, hp: 720 },
    { id: 'monarch', name: 'Monarch Coupe', shape: 'gt', usd: 410000, color: '#5a2bd8', blurb: 'Old money look, new money wallet.', cls: 'gt', brand: 'Signature', year: 2026, hp: 690 },
    { id: 'fulmine', name: 'Fulmine V12', shape: 'wedge', usd: 520000, color: '#1fd38c', blurb: 'The wedge. The poster. The larp.', cls: 'super', brand: 'Signature', year: 2025, hp: 780 },
    { id: 'nebula', name: 'Nebula Hyper', shape: 'hyper', usd: 2800000, color: '#c9ced9', blurb: 'Hypercar. Only bought after a 1000x.', cls: 'hyper', brand: 'Signature', year: 2026, hp: 1500 }
  ];
  const PAINTS = ['#ff2a4d', '#2f6bff', '#ffc21a', '#1fd38c', '#16181f', '#e8ecf5', '#5a2bd8', '#ff7a1a', '#0e7c86', '#8a8f9c', '#b0123b', '#2b3a67'];
  const BRANDS = ['Vantor', 'Corvanti', 'Zephyra', 'Halvorsen', 'Montaro', 'Kyrex', 'Stellan', 'Arvane', 'Borealis', 'Draxa', 'Elyon', 'Falcora', 'Gravis', 'Ionis', 'Juvena', 'Kalder', 'Maranzo', 'Novaro', 'Pallas', 'Quintor', 'Rovane', 'Saetta', 'Torvan', 'Ulmera', 'Vexor', 'Wyvar', 'Xanthe', 'Zorvia', 'Aureon', 'Celeste'];
  const MODELS = ['Velox', 'Aurion', 'Kestra', 'Zephon', 'Orvano', 'Brisa', 'Calyx', 'Draven', 'Elara', 'Fyra', 'Garda', 'Helix', 'Ivra', 'Jolt', 'Kova', 'Lumen', 'Myra', 'Nexa', 'Onyx', 'Pyra', 'Quasar', 'Ryze', 'Solace', 'Trion', 'Umbra', 'Vanta', 'Wren', 'Xyra', 'Yara', 'Zeal', 'Strale', 'Corvo', 'Nimbus', 'Tundra', 'Sirocca', 'Lyra', 'Talon', 'Vesper', 'Astra', 'Cobalt'];
  const CLASSES = {
    hatch: { label: 'Hatch', shapes: ['hatch'], p: [24e3, 62e3], hp: [150, 330], w: 8, blurbs: ['The starter trencher car.', 'Cheap, quick, honest.', 'First car energy.'] },
    sedan: { label: 'Sedan', shapes: ['sedan'], p: [45e3, 230e3], hp: [250, 650], w: 12, blurbs: ['Executive vibes for executive bags.', 'Looks like a business. Is a memecoin.', 'Four doors, zero worries.'] },
    suv: { label: 'SUV', shapes: ['suv'], p: [75e3, 420e3], hp: [400, 800], w: 12, blurbs: ['Hotel-lobby parking spot energy.', 'Tall, loud, expensive.', 'Moves the whole squad.'] },
    ev: { label: 'EV', shapes: ['ev'], p: [55e3, 260e3], hp: [400, 1100], w: 10, blurbs: ['Silent launch, like a stealth coin.', 'Instant torque, instant gains.', 'Plugged in like your bots.'] },
    gt: { label: 'GT', shapes: ['gt'], p: [140e3, 420e3], hp: [450, 720], w: 12, blurbs: ['Grand tourer for grand trips.', 'Long hood, long hold.', 'Cruise between penthouses.'] },
    muscle: { label: 'Muscle', shapes: ['muscle'], p: [45e3, 190e3], hp: [450, 850], w: 10, blurbs: ['V8 noise, diamond hands.', 'All torque, no utility. Like a memecoin.', 'Loud enough for the whole timeline.'] },
    super: { label: 'Supercar', shapes: ['wedge', 'spyder'], p: [220e3, 750e3], hp: [600, 850], w: 16, blurbs: ['The poster car.', 'Peak larp material.', 'Scissor doors not included.'] },
    hyper: { label: 'Hypercar', shapes: ['hyper'], p: [1.5e6, 4.5e6], hp: [900, 1600], w: 6, blurbs: ['Only after a 1000x.', 'Limited run. Unlimited flex.', 'Faster than a rug pull.'] },
    classic: { label: 'Classic', shapes: ['classic'], p: [85e3, 3.5e6], hp: [180, 400], w: 7, blurbs: ['Old money disguise.', 'Collector grade. Appreciates (sometimes).', 'Chrome and nostalgia.'] },
    truck: { label: 'Truck', shapes: ['truck'], p: [50e3, 160e3], hp: [300, 700], w: 7, blurbs: ['Hauls bags. Literally.', 'Ranch dev energy.', 'Built for off-chain terrain.'] }
  };
  const CLS_KEYS = Object.keys(CLASSES);
  const CARS = SIG.slice();
  (function genCars() {
    const r = rng(777);
    const pick = a => a[Math.floor(r() * a.length)];
    let tw = 0; CLS_KEYS.forEach(k => tw += CLASSES[k].w);
    const used = new Set();
    for (let i = 0; i < 1000; i++) {
      let x = r() * tw, cls = CLS_KEYS[0]; for (const k of CLS_KEYS) { x -= CLASSES[k].w; if (x <= 0) { cls = k; break; } }
      const C = CLASSES[cls], shape = pick(C.shapes), brand = pick(BRANDS);
      let name, tries = 0; do { name = brand + ' ' + pick(MODELS) + pick(['', '', ' GT', ' RS', ' S', ' R', ' Sport', ' Evo', ' ' + (Math.floor(r() * 9) + 1) * 100, ' LM', ' X', ' Turbo', ' Coupe', ' Spyder', ' One', ' Apex', ' Nero', ' Bianco']); if (++tries > 30) name += ' ' + (i + 1); } while (used.has(name));
      used.add(name);
      const t = r(), hp = Math.round(C.hp[0] + (C.hp[1] - C.hp[0]) * t);
      const usd = Math.round((C.p[0] * Math.pow(C.p[1] / C.p[0], Math.pow(t, 1.1) * 0.85 + r() * 0.15)) / 1000) * 1000;
      const year = cls === 'classic' ? 1956 + Math.floor(r() * 24) : 2018 + Math.floor(r() * 10);
      const z60 = Math.max(1.9, (cls === 'truck' || cls === 'suv' ? 6.8 : 7.6) - hp / 230 + r() * 0.6);
      const top = Math.round(130 + hp * 0.11 + (cls === 'hyper' ? 40 : 0) + r() * 15);
      CARS.push({
        id: 'c' + i, name, brand, cls, shape, usd, year, hp, z60: +z60.toFixed(1), top,
        color: pick(PAINTS), accent: pick(['#ff3355', '#ffc21a', '#2f6bff', '#1fd38c', '#e8ecf5']),
        rim: pick(['#d8dbe6', '#d8dbe6', '#2b2d38', '#d4a64a', '#9a6b4a']), rimStyle: pick(cls === 'classic' ? ['wire', 'dish'] : ['spoke5', 'spoke5', 'multi', 'dish']),
        wing: (cls === 'super' || cls === 'hyper' || cls === 'muscle' || cls === 'hatch') && r() < 0.35,
        stripe: (cls === 'muscle' || cls === 'classic' || cls === 'super' || cls === 'hatch') && r() < 0.3 ? pick(['#ffffff', '#16181f', '#ffc21a', '#ff2a4d']) : null,
        tint: r() < 0.4, blurb: pick(C.blurbs)
      });
    }
  })();

  // ================= PROCEDURAL CAR BODIES =================
  // Every catalog car gets its own geometry: length, wheelbase, wheel size, ride height, roof height/length/position,
  // hood length, windshield rake, tail type, nose shape, lights, spoiler, vents, trim and wheel design.
  const CG = {
    hatch: { L: [214, 238], r: [17, 19.5], wb: [.6, .66], hood: [.2, .26], rake: [.8, 1.2], roofH: [58, 66], roofLen: [66, 84], hoodH: [33, 38], tail: ['hatch'], clear: [0, 2], round: [8, 14], win: [2] },
    sedan: { L: [258, 282], r: [19, 21], wb: [.58, .63], hood: [.26, .32], rake: [1, 1.4], roofH: [56, 63], roofLen: [70, 92], hoodH: [33, 38], tail: ['notch'], clear: [0, 2], round: [6, 12], win: [2, 3] },
    suv: { L: [256, 284], r: [21.5, 25], wb: [.58, .62], hood: [.24, .3], rake: [.6, .95], roofH: [72, 84], roofLen: [96, 122], hoodH: [44, 52], tail: ['box'], clear: [6, 10], round: [5, 10], win: [2, 3] },
    ev: { L: [258, 282], r: [19, 21.5], wb: [.6, .65], hood: [.22, .28], rake: [1.3, 1.8], roofH: [56, 62], roofLen: [56, 80], hoodH: [32, 37], tail: ['fast'], clear: [0, 2], round: [12, 18], win: [2] },
    gt: { L: [266, 292], r: [20, 22], wb: [.56, .6], hood: [.36, .42], rake: [1.3, 1.8], roofH: [52, 58], roofLen: [38, 58], hoodH: [33, 38], tail: ['fast', 'fast', 'notch'], clear: [0, 1], round: [8, 14], win: [1, 2] },
    muscle: { L: [270, 294], r: [21, 23], wb: [.56, .6], hood: [.36, .42], rake: [1.1, 1.5], roofH: [53, 59], roofLen: [44, 60], hoodH: [36, 41], tail: ['notch', 'fast'], clear: [0, 2], round: [3, 7], win: [1, 2] },
    super: { L: [262, 288], r: [21, 23], wb: [.56, .6], hood: [.18, .24], rake: [1.6, 2.1], roofH: [48, 54], roofLen: [26, 42], hoodH: [30, 35], tail: ['fast', 'deck'], clear: [0, 0], round: [7, 12], win: [1] },
    hyper: { L: [274, 298], r: [21, 23], wb: [.56, .6], hood: [.2, .26], rake: [1.8, 2.3], roofH: [45, 50], roofLen: [24, 36], hoodH: [28, 32], tail: ['deck', 'fast'], clear: [0, 0], round: [8, 14], win: [1] },
    classic: { L: [250, 282], r: [18, 20], wb: [.56, .6], hood: [.3, .38], rake: [1, 1.4], roofH: [53, 60], roofLen: [48, 70], hoodH: [34, 39], tail: ['notch', 'fast'], clear: [1, 3], round: [14, 22], win: [1, 2] },
    truck: { L: [274, 298], r: [23, 26.5], wb: [.6, .64], hood: [.24, .3], rake: [.5, .8], roofH: [78, 88], roofLen: [54, 72], hoodH: [48, 56], tail: ['bed'], clear: [8, 12], round: [4, 8], win: [2] }
  };
  function genGeom(m) {
    const r = rng(9100 + parseInt(String(m.id).replace(/\D/g, '') || '0', 10) * 131), R2 = a => a[0] + r() * (a[1] - a[0]), pk = a => a[Math.floor(r() * a.length)];
    const C = CG[m.cls] || CG.super;
    const L = R2(C.L), wr = R2(C.r), x0 = 160 - L / 2 + R2([-4, 4]), x1 = x0 + L;
    const wb = L * R2(C.wb), oR = (L - wb) * R2([.42, .55]), xr = x0 + oR, xf = xr + wb;
    const GY = 128, wcY = GY - wr, sill = wcY + wr * 0.28 - R2(C.clear), hoodY = sill - R2(C.hoodH), roofY = sill - R2(C.roofH);
    const noseY = hoodY + R2([2, m.cls === 'truck' || m.cls === 'suv' ? 4 : 10]), nr = R2([4, 13]);
    const ax = x1 - L * R2(C.hood), rfx = ax - (hoodY - roofY) * R2(C.rake), rbx = rfx - R2(C.roofLen), tail = pk(C.tail);
    const tr = R2(C.round), crown = R2([1, 7]);
    const tailTop = tail === 'fast' ? sill - R2([26, 34]) : tail === 'deck' ? sill - R2([30, 36]) : tail === 'notch' ? sill - R2([32, 39]) : tail === 'hatch' ? roofY + R2([4, 10]) : tail === 'bed' ? sill - R2([30, 38]) : roofY + 4;
    const cbx = tail === 'notch' ? rbx - (tailTop - roofY) * R2([.8, 1.3]) : tail === 'deck' ? rbx - R2([18, 30]) : rbx;
    return {
      L, wr, x0, x1, xr, xf, GY, wcY, sill, hoodY, roofY, noseY, nr, ax, rfx, rbx, tail, tr, crown, tailTop, cbx,
      arch: wr + R2([2, 5]), win: pk(C.win), belt: R2([2, 6]), head: pk(m.cls === 'classic' ? ['round', 'round', 'dual'] : m.cls === 'truck' || m.cls === 'suv' ? ['rect', 'rect', 'slit'] : ['slit', 'slit', 'rect', 'dual']),
      tl: pk(['strip', 'block', 'round']), spoiler: m.wing ? pk(['wing', 'gtwing']) : pk(m.cls === 'muscle' || m.cls === 'classic' ? ['duck', 'none', 'lip'] : m.cls === 'super' || m.cls === 'hyper' ? ['lip', 'duck', 'none'] : ['none', 'none', 'lip']),
      intake: m.cls === 'super' || m.cls === 'hyper' ? R2([.6, 1]) : m.cls === 'gt' || m.cls === 'muscle' ? (r() < .5 ? R2([.3, .5]) : 0) : 0,
      flare: m.cls === 'muscle' || m.cls === 'hyper' || (m.cls === 'super' && r() < .5) ? R2([2, 4]) : 0,
      fin: m.cls === 'hyper' && r() < .5, scoop: m.cls === 'muscle' && r() < .6, rack: m.cls === 'suv' && r() < .5, lightbar: m.cls === 'truck' && r() < .5, snorkel: m.cls === 'truck' && r() < .25,
      chrome: m.cls === 'classic' || (m.cls === 'sedan' && r() < .3), twoTone: r() < (m.cls === 'classic' ? .4 : .15), roundel: (m.cls === 'super' || m.cls === 'hyper' || m.cls === 'classic') && r() < .12 ? Math.floor(r() * 98) + 1 : 0,
      spokes: pk(m.rimStyle === 'wire' ? [24] : m.rimStyle === 'multi' ? [10, 12, 14] : m.rimStyle === 'dish' ? [0] : [5, 5, 6, 7, 3]), aero: m.cls === 'ev' && r() < .5, whitewall: m.cls === 'classic' && r() < .5,
      caliper: pk(['#ff3355', '#ffc21a', '#2f6bff', '#1fd38c', '#8a8f9c']), exhaust: pk(['dual', 'quad', 'center', 'none']), mirrorS: R2([.8, 1.2]), splitter: m.cls === 'super' || m.cls === 'hyper' || (m.cls === 'hatch' && r() < .4)
    };
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  function pcar(m, color, opt) {
    opt = opt || {}; const g = m._g || (m._g = genGeom(m)), id = ++uid, f = n => n.toFixed(1);
    const { x0, x1, xr, xf, wcY, sill, hoodY, roofY, noseY, nr, ax, rfx, rbx, tail, tr, crown, tailTop, cbx, arch } = g;
    // ---- body outline ----
    let d = 'M' + f(x0 + 5) + ',' + f(sill) + ' Q' + f(x0) + ',' + f(sill) + ' ' + f(x0) + ',' + f(sill - 6);
    if (tail === 'box') d += ' L' + f(x0 + 1) + ',' + f(roofY + tr) + ' Q' + f(x0 + 1) + ',' + f(roofY) + ' ' + f(x0 + 1 + tr) + ',' + f(roofY);
    else if (tail === 'bed') { const cab = rbx - 4; d += ' L' + f(x0) + ',' + f(tailTop) + ' L' + f(cab) + ',' + f(tailTop) + ' L' + f(cab) + ',' + f(roofY + tr) + ' Q' + f(cab) + ',' + f(roofY) + ' ' + f(cab + tr) + ',' + f(roofY); }
    else if (tail === 'hatch') d += ' L' + f(x0 + 2) + ',' + f(tailTop) + ' Q' + f(x0 + 4) + ',' + f(roofY + 1) + ' ' + f(rbx) + ',' + f(roofY);
    else {
      d += ' L' + f(x0) + ',' + f(tailTop + tr * .6) + ' Q' + f(x0) + ',' + f(tailTop) + ' ' + f(x0 + tr) + ',' + f(tailTop);
      if (tail === 'fast') d += ' Q' + f(lerp(x0, rbx, .55)) + ',' + f(lerp(tailTop, roofY, .55) - 4) + ' ' + f(rbx) + ',' + f(roofY);
      else d += ' L' + f(cbx) + ',' + f(tailTop - (tail === 'deck' ? 3 : 0)) + ' Q' + f(lerp(cbx, rbx, .4)) + ',' + f(lerp(tailTop, roofY, .7)) + ' ' + f(rbx) + ',' + f(roofY);
    }
    d += ' Q' + f((rbx + rfx) / 2) + ',' + f(roofY - crown) + ' ' + f(rfx) + ',' + f(roofY);
    d += ' Q' + f(lerp(rfx, ax, .35)) + ',' + f(lerp(roofY, hoodY, .25)) + ' ' + f(ax) + ',' + f(hoodY);
    d += ' Q' + f(lerp(ax, x1, .55)) + ',' + f(lerp(hoodY, noseY, .2) - 1.5) + ' ' + f(x1 - nr) + ',' + f(noseY);
    d += ' Q' + f(x1) + ',' + f(noseY) + ' ' + f(x1) + ',' + f(noseY + nr) + ' L' + f(x1) + ',' + f(sill - 4) + ' Q' + f(x1) + ',' + f(sill) + ' ' + f(x1 - 5) + ',' + f(sill);
    d += ' L' + f(xf + arch) + ',' + f(sill) + ' A' + f(arch) + ',' + f(arch) + ' 0 0 0 ' + f(xf - arch) + ',' + f(sill) + ' L' + f(xr + arch) + ',' + f(sill) + ' A' + f(arch) + ',' + f(arch) + ' 0 0 0 ' + f(xr - arch) + ',' + f(sill) + ' Z';
    // ---- greenhouse ----
    const beltY = hoodY - g.belt, t1 = (hoodY - beltY) / Math.max(1, hoodY - roofY), wx = lerp(ax, rfx, t1);
    let bx, by; if (tail === 'box') { bx = x0 + 3; by = roofY + 6; } else if (tail === 'bed') { bx = rbx - 2; by = roofY + 6; } else if (tail === 'hatch') { bx = x0 + 3; by = tailTop; } else if (tail === 'fast') { bx = lerp(x0, rbx, .55); by = lerp(tailTop, roofY, .55); } else { bx = cbx; by = tailTop; }
    const t2 = (beltY - roofY) / Math.max(1, by - roofY), rx = tail === 'box' || tail === 'bed' ? bx + 1 : lerp(rbx, bx, Math.min(1, t2));
    const win = 'M' + f(wx - 1) + ',' + f(beltY) + ' L' + f(rfx - 1.5) + ',' + f(roofY + 3) + ' L' + f(rbx + 2) + ',' + f(roofY + 3) + ' L' + f(rx + 2) + ',' + f(beltY) + ' Z';
    const dark = shade(color, -0.6), light = shade(color, 0.4);
    let pillars = ''; for (let i = 1; i < g.win; i++) { const px = lerp(rx, wx, i / g.win); pillars += '<path d="M' + f(px) + ',' + f(beltY) + ' L' + f(px + 2) + ',' + f(roofY + 2) + '" stroke="' + (opt.twoTone || g.twoTone ? '#0d0f16' : dark) + '" stroke-width="3"/>'; }
    // ---- details ----
    let det = '';
    const doorX = lerp(rx, wx, g.win >= 2 ? 0.5 : 0.35);
    det += '<path d="M' + f(wx - 2) + ',' + f(beltY + 1) + ' L' + f(wx + 3) + ',' + f(sill - 6) + ' M' + f(doorX) + ',' + f(beltY + 1) + ' L' + f(doorX + 2) + ',' + f(sill - 5) + '" stroke="' + dark + '" stroke-width=".9" opacity=".55" fill="none"/>';
    const lineY0 = Math.max(beltY + 6, (tail === 'box' || tail === 'hatch') ? beltY + 6 : tailTop + 6), lineX0 = tail === 'bed' ? rbx - 2 : x0 + 8;
    det += '<path d="M' + f(lineX0) + ',' + f(lineY0) + ' Q' + f((x0 + x1) / 2) + ',' + f(beltY + 3) + ' ' + f(x1 - nr - 4) + ',' + f(noseY + 4) + '" stroke="' + light + '" stroke-width="1.2" opacity=".55" fill="none"/>';
    if (g.intake) { const ix = xr + g.arch + 4, iw = (doorX - ix) * g.intake; det += '<path d="M' + f(ix) + ',' + f(sill - 8) + ' L' + f(ix + iw) + ',' + f(beltY + 10) + ' L' + f(ix + iw * 0.35) + ',' + f(beltY + 12) + ' Z" fill="#07080d" opacity=".9"/>'; }
    if (g.flare) [xr, xf].forEach(x => det += '<path d="M' + f(x - arch - 2) + ',' + f(sill - 1) + ' A' + f(arch + g.flare) + ',' + f(arch + g.flare) + ' 0 0 1 ' + f(x + arch + 2) + ',' + f(sill - 1) + '" stroke="' + dark + '" stroke-width="1.6" fill="none" opacity=".6"/>');
    if (g.scoop) det += '<path d="M' + f(lerp(ax, x1, .3)) + ',' + f(hoodY - 1) + ' L' + f(lerp(ax, x1, .48)) + ',' + f(hoodY - 6) + ' L' + f(lerp(ax, x1, .55)) + ',' + f(hoodY) + ' Z" fill="' + dark + '"/>';
    if (g.fin) det += '<path d="M' + f(rbx - 4) + ',' + f(roofY + 2) + ' L' + f(x0 + 18) + ',' + f(tailTop - 8) + ' L' + f(x0 + 24) + ',' + f(tailTop) + ' Z" fill="' + dark + '"/>';
    if (g.rack) det += '<path d="M' + f(rbx + 6) + ',' + f(roofY - 4) + ' L' + f(rfx - 6) + ',' + f(roofY - 4) + '" stroke="#1d1f28" stroke-width="3.5" stroke-linecap="round"/><path d="M' + f(rbx + 12) + ',' + f(roofY - 4) + ' l0,4 M' + f(rfx - 12) + ',' + f(roofY - 4) + ' l0,4" stroke="#1d1f28" stroke-width="2"/>';
    if (g.lightbar) det += '<rect x="' + f(rfx - 30) + '" y="' + f(roofY - 6) + '" width="26" height="4" rx="2" fill="#1d1f28"/><rect x="' + f(rfx - 28) + '" y="' + f(roofY - 5.5) + '" width="22" height="2" fill="#fff6d0"/>';
    if (g.snorkel) det += '<path d="M' + f(ax + 4) + ',' + f(hoodY + 6) + ' L' + f(ax - 2) + ',' + f(roofY + 2) + ' L' + f(ax + 6) + ',' + f(roofY)+ '" stroke="#16171d" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
    if (g.chrome) det += '<path d="M' + f(x0 + 4) + ',' + f(Math.max(beltY + 2, tail === 'box' || tail === 'hatch' ? 0 : tailTop + 4)) + ' L' + f(x1 - nr) + ',' + f(noseY + 2) + '" stroke="#eef2ff" stroke-width="1.6" opacity=".85"/><path d="M' + f(x0 - 1) + ',' + f(sill - 5) + ' l10,0 M' + f(x1 - 9) + ',' + f(sill - 5) + ' l10,0" stroke="#e8ecf5" stroke-width="3"/>';
    if (g.splitter) det += '<path d="M' + f(x1 - 30) + ',' + f(sill + 1) + ' L' + f(x1 + 4) + ',' + f(sill + 1) + '" stroke="#0a0b10" stroke-width="2.5"/><path d="M' + f(x0 - 2) + ',' + f(sill) + ' L' + f(x0 + 26) + ',' + f(sill) + '" stroke="#0a0b10" stroke-width="3"/>';
    if (g.roundel) det += '<circle cx="' + f(doorX - 10) + '" cy="' + f((beltY + sill) / 2) + '" r="7" fill="#f4f4f4"/><text x="' + f(doorX - 10) + '" y="' + f((beltY + sill) / 2 + 3.2) + '" font-size="8.5" font-weight="900" text-anchor="middle" fill="#111" font-family="Inter,Arial">' + g.roundel + '</text>';
    if (m.stripe) det += '<path d="M' + f(x0 + 4) + ',' + f((beltY + sill) / 2 + 2) + ' L' + f(x1 - 4) + ',' + f((beltY + sill) / 2 + 2) + '" stroke="' + m.stripe + '" stroke-width="3.5" opacity=".9"/>';
    // mirror
    const ms = 4 * g.mirrorS; det += '<path d="M' + f(wx + 3) + ',' + f(beltY - 1) + ' l' + f(ms) + ',' + f(-ms * .9) + ' l' + f(ms * .9) + ',' + f(ms * .3) + ' l-' + f(ms * .8) + ',' + f(ms * .9) + ' Z" fill="' + dark + '"/>';
    // lights
    const hx = x1 - nr * .6 - 2, hy = noseY + 2.5;
    det += g.head === 'round' ? '<circle cx="' + f(x1 - 4) + '" cy="' + f(noseY + nr * .6 + 2) + '" r="4.2" fill="#f1f8ff" stroke="#c9d2e0"/>'
      : g.head === 'rect' ? '<rect x="' + f(x1 - 9) + '" y="' + f(noseY + 2) + '" width="9" height="7" rx="1.5" fill="#eef7ff"/>'
        : g.head === 'dual' ? '<circle cx="' + f(x1 - 4) + '" cy="' + f(noseY + nr * .5 + 2) + '" r="3" fill="#f1f8ff"/><circle cx="' + f(x1 - 11) + '" cy="' + f(noseY + nr * .5 + 1.5) + '" r="2.6" fill="#f1f8ff"/>'
          : '<path d="M' + f(hx - 16) + ',' + f(hy - 1) + ' L' + f(x1 - 1) + ',' + f(hy + 3) + ' L' + f(x1 - 3) + ',' + f(hy + 6) + ' L' + f(hx - 18) + ',' + f(hy + 2) + ' Z" fill="#e9f6ff"/>';
    const ty0 = (tail === 'box' || tail === 'hatch') ? beltY + 4 : tailTop + 3;
    det += g.tl === 'round' ? '<circle cx="' + f(x0 + 3.5) + '" cy="' + f(ty0 + 3) + '" r="3.2" fill="#ff2a3d"/>' : g.tl === 'block' ? '<rect x="' + f(x0 - .5) + '" y="' + f(ty0) + '" width="6" height="' + (tail === 'box' || tail === 'bed' ? 14 : 7) + '" rx="1" fill="#ff2a3d"/>' : '<path d="M' + f(x0) + ',' + f(ty0 + 1) + ' L' + f(x0 + 22) + ',' + f(ty0) + '" stroke="#ff2a3d" stroke-width="3" stroke-linecap="round"/>';
    // exhaust
    if (g.exhaust !== 'none' && tail !== 'bed') { const n = g.exhaust === 'quad' ? 2 : 1; for (let i = 0; i < n; i++) det += '<rect x="' + f(x0 - 3) + '" y="' + f(sill - 3 - i * 4) + '" width="6" height="3" rx="1.5" fill="#3a3d48"/>'; }
    // spoiler
    let spo = '';
    const sx = tail === 'fast' ? x0 + tr : cbx > x0 ? x0 + 6 : x0 + 6, sy = tail === 'box' || tail === 'hatch' ? roofY + 1 : tailTop;
    if (g.spoiler === 'lip') spo = '<path d="M' + f(x0 + 1) + ',' + f(sy + 1) + ' L' + f(x0 + 16) + ',' + f(sy - 3) + ' L' + f(x0 + 18) + ',' + f(sy + 1) + ' Z" fill="' + dark + '"/>';
    else if (g.spoiler === 'duck') spo = '<path d="M' + f(x0) + ',' + f(sy + 2) + ' Q' + f(x0 - 2) + ',' + f(sy - 5) + ' ' + f(x0 + 10) + ',' + f(sy - 1) + ' L' + f(x0 + 18) + ',' + f(sy + 1) + ' Z" fill="' + shade(color, -0.2) + '"/>';
    else if (g.spoiler === 'wing' || g.spoiler === 'gtwing') { const hgt = g.spoiler === 'gtwing' ? 18 : 11, wl = g.spoiler === 'gtwing' ? 40 : 30; spo = '<path d="M' + f(sx + 6) + ',' + f(sy) + ' L' + f(sx + 4) + ',' + f(sy - hgt) + ' M' + f(sx + 22) + ',' + f(sy) + ' L' + f(sx + 20) + ',' + f(sy - hgt) + '" stroke="#15151c" stroke-width="2.6"/><path d="M' + f(sx - 8) + ',' + f(sy - hgt - 3) + ' L' + f(sx - 8 + wl) + ',' + f(sy - hgt - 5) + ' L' + f(sx - 8 + wl) + ',' + f(sy - hgt) + ' L' + f(sx - 6) + ',' + f(sy - hgt + 1) + ' Z" fill="' + dark + '"/>'; }
    // wheels
    const whl = (x) => {
      const R = g.wr, rim = m.rim || '#d8dbe6';
      let w = '<circle cx="' + f(x) + '" cy="' + f(wcY) + '" r="' + f(R) + '" fill="#0a0a0f"/>' + (g.whitewall ? '<circle cx="' + f(x) + '" cy="' + f(wcY) + '" r="' + f(R * .82) + '" fill="none" stroke="#e8e8e8" stroke-width="' + f(R * .13) + '"/>' : '') +
        '<circle cx="' + f(x) + '" cy="' + f(wcY) + '" r="' + f(R * .68) + '" fill="url(#rim' + id + ')"/>' + '<rect x="' + f(x + R * .16) + '" y="' + f(wcY - R * .42) + '" width="' + f(R * .2) + '" height="' + f(R * .48) + '" rx="2" fill="' + g.caliper + '"/>';
      if (g.aero) w += '<circle cx="' + f(x) + '" cy="' + f(wcY) + '" r="' + f(R * .62) + '" fill="' + rim + '" opacity=".92"/><path d="M' + f(x - R * .5) + ',' + f(wcY) + ' A' + f(R * .5) + ',' + f(R * .5) + ' 0 0 1 ' + f(x + R * .5) + ',' + f(wcY) + '" stroke="#555a66" stroke-width="1.2" fill="none"/>';
      else if (!g.spokes) w += '<circle cx="' + f(x) + '" cy="' + f(wcY) + '" r="' + f(R * .58) + '" fill="' + rim + '" opacity=".85"/><circle cx="' + f(x) + '" cy="' + f(wcY) + '" r="' + f(R * .38) + '" fill="none" stroke="#555a66" stroke-width="1.2"/>';
      else { const n = g.spokes, sw = n >= 20 ? .028 : n >= 10 ? .07 : n === 3 ? .2 : .13; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 - Math.PI / 2; w += '<path d="M' + f(x) + ',' + f(wcY) + ' L' + f(x + Math.cos(a) * R * .64) + ',' + f(wcY + Math.sin(a) * R * .64) + '" stroke="' + rim + '" stroke-width="' + (R * sw).toFixed(2) + '" stroke-linecap="round"/>'; } }
      return w + '<circle cx="' + f(x) + '" cy="' + f(wcY) + '" r="' + f(R * .13) + '" fill="#2b2d38"/>';
    };
    const gy = g.GY;
    let s = '<svg viewBox="0 0 320 ' + (opt.bg ? 170 : 140) + '" xmlns="http://www.w3.org/2000/svg" class="art-car"><defs>' +
      '<linearGradient id="b' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + shade(color, 0.35) + '"/><stop offset=".45" stop-color="' + color + '"/><stop offset="1" stop-color="' + shade(color, -0.55) + '"/></linearGradient>' +
      '<linearGradient id="w' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + (m.tint ? '#3a4152' : '#9fb8ff') + '" stop-opacity=".85"/><stop offset=".5" stop-color="#1a2036"/><stop offset="1" stop-color="#0b0e18"/></linearGradient>' +
      '<radialGradient id="rim' + id + '"><stop offset="0" stop-color="#5a5e6e"/><stop offset="1" stop-color="#1b1d26"/></radialGradient>' +
      '<radialGradient id="sp' + id + '" cx=".5" cy=".75" r=".6"><stop offset="0" stop-color="' + color + '" stop-opacity=".45"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></radialGradient>' +
      '<filter id="f' + id + '"><feGaussianBlur stdDeviation="4"/></filter></defs>';
    if (opt.bg) s += '<rect width="320" height="170" fill="#07080f"/><rect y="' + (gy - 4) + '" width="320" height="' + (170 - gy + 4) + '" fill="#0d0f1a"/><ellipse cx="160" cy="' + (gy - 20) + '" rx="190" ry="80" fill="url(#sp' + id + ')"/><path d="M0,' + (gy - 4) + ' L320,' + (gy - 4) + '" stroke="rgba(255,255,255,.08)"/>' +
      '<g opacity=".13" transform="translate(0,' + (gy * 2) + ') scale(1,-1)"><path d="' + d + '" fill="' + color + '"/></g>';
    s += '<ellipse cx="' + f((x0 + x1) / 2) + '" cy="' + gy + '" rx="' + f(g.L / 2 + 6) + '" ry="6" fill="#000" opacity=".7" filter="url(#f' + id + ')"/>';
    s += '<path d="' + d + '" fill="url(#b' + id + ')" stroke="' + shade(color, -0.65) + '" stroke-width="1"/>';
    if (g.twoTone) s += '<path d="' + win + '" fill="#0d0f16" stroke="#0d0f16" stroke-width="5" stroke-linejoin="round"/>';
    s += '<path d="' + win + '" fill="url(#w' + id + ')"/>' + pillars + det + spo + whl(xr) + whl(xf) + '</svg>';
    return s;
  }
  const CAR_BY = {}; CARS.forEach(c => CAR_BY[c.id] = c);
  function carArt(m, color, opt) { opt = opt || {}; if (m.brand !== 'Signature') return pcar(m, color || m.color, opt); return car(m.shape, color || m.color, Object.assign({ wing: m.wing, accent: m.accent, rim: m.rim, rimStyle: m.rimStyle, stripe: m.stripe, tint: m.tint }, opt)); }

  // ================= HOUSES =================
  function palm(x, y, h, s, col) {
    s = s || 1; col = col || '#0b1a12';
    const top = [x + 8 * s, y - h];
    let p = '<path d="M' + x + ',' + y + ' Q' + (x + 2 * s) + ',' + (y - h * 0.5) + ' ' + top[0] + ',' + top[1] + '" stroke="' + col + '" stroke-width="' + (3.2 * s) + '" fill="none" stroke-linecap="round"/>';
    [[-26, 8], [-16, -6], [0, -12], [16, -6], [26, 8], [-8, 12], [10, 13]].forEach(f => { p += '<path d="M' + top[0] + ',' + top[1] + ' Q' + (top[0] + f[0] * 0.5 * s) + ',' + (top[1] + f[1] * 0.2 * s - 8 * s) + ' ' + (top[0] + f[0] * s) + ',' + (top[1] + f[1] * s) + '" stroke="' + col + '" stroke-width="' + (2.6 * s) + '" fill="none" stroke-linecap="round"/>'; });
    return p;
  }
  function stars(n, h, seed) { let s = '', a = seed || 7; for (let i = 0; i < n; i++) { a = (a * 9301 + 49297) % 233280; const x = a / 233280 * 320; a = (a * 9301 + 49297) % 233280; const y = a / 233280 * h; s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (i % 3 ? 0.7 : 1.1) + '" fill="#fff" opacity="' + (0.4 + (i % 5) / 10) + '"/>'; } return s; }
  function windows(x, y, cols, rows, w, h, gx, gy, lit, seed, day) {
    let s = '', a = seed || 3;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { a = (a * 9301 + 49297) % 233280; const on = a / 233280 < lit; s += '<rect x="' + (x + c * (w + gx)) + '" y="' + (y + r * (h + gy)) + '" width="' + w + '" height="' + h + '" fill="' + (on ? '#ffd27a' : day ? '#9cc8ee' : '#1c2340') + '"/>'; }
    return s;
  }
  const SKY = { day: ['#3ea0ff', '#9ad3ff', '#e6f6ff'], sunset: ['#2b1a55', '#e2577a', '#ffb36b'], night: ['#03040b', '#0c1433', '#1b2550'] };
  function house(kind, opt) {
    opt = opt || {};
    const id = ++uid, tod = opt.tod || ({ studio: 'night', condo: 'sunset', penthouse: 'night', villa: 'sunset', beach: 'day', chalet: 'night', island: 'day', mansion: 'sunset', loft: 'night', desert: 'sunset', lake: 'day' }[kind] || 'day');
    const sk = SKY[tod], night = tod === 'night', day = tod === 'day', lit = night ? 0.5 : tod === 'sunset' ? 0.3 : 0.05, wall = opt.wall || '#efe9e2', seed = opt.seed || 7;
    const dark = night ? '#0a0f22' : day ? '#2a4a2a' : '#1a1230';
    let d = '<defs><linearGradient id="sk' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sk[0] + '"/><stop offset=".6" stop-color="' + sk[1] + '"/><stop offset="1" stop-color="' + sk[2] + '"/></linearGradient>' +
      '<radialGradient id="gl' + id + '"><stop offset="0" stop-color="#ffd27a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="gls' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + (day ? '#cfe9ff' : '#ffe3a3') + '"/><stop offset="1" stop-color="' + (day ? '#7fb6e6' : '#e09b3d') + '"/></linearGradient>' +
      '<linearGradient id="pool' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5ff0ff"/><stop offset="1" stop-color="#1376d6"/></linearGradient>' +
      '<linearGradient id="sea' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (night ? '#14244d' : '#2b7bd6') + '"/><stop offset="1" stop-color="' + (night ? '#060c20' : '#0b2d66') + '"/></linearGradient></defs>';
    let s = '<rect width="320" height="180" fill="url(#sk' + id + ')"/>' + (night ? stars(30, 80, seed) : '') +
      (day ? '<circle cx="' + (40 + seed % 240) + '" cy="36" r="16" fill="#fff6c9"/>' : tod === 'sunset' ? '<circle cx="' + (60 + seed % 200) + '" cy="118" r="24" fill="#ffd27a" opacity=".85"/>' : '<circle cx="' + (40 + seed % 240) + '" cy="30" r="10" fill="#f4f1e0" opacity=".9"/>');
    const W = (x, y, c, r, w, h, gx, gy) => windows(x, y, c, r, w, h, gx, gy, lit, seed + x, day);
    if (kind === 'studio') {
      s += '<rect x="40" y="30" width="240" height="150" fill="#2a2430"/>' + W(56, 44, 6, 5, 22, 18, 16, 10) + '<rect x="132" y="100" width="22" height="18" fill="#7fb4ff"/><circle cx="143" cy="109" r="22" fill="#5aa0ff" opacity=".18"/>';
      if (!day) for (let i = 0; i < 40; i++) s += '<path d="M' + (i * 8 + (i % 3) * 3) + ',' + ((i * 37) % 180) + ' l-4,12" stroke="#9fb5ff" stroke-width=".8" opacity=".35"/>';
      s += '<rect y="170" width="320" height="10" fill="#0d0e14"/>';
    } else if (kind === 'condo') {
      s += '<rect y="138" width="320" height="42" fill="url(#sea' + id + ')"/><rect x="96" y="22" width="92" height="140" fill="#1d2747"/>';
      for (let r = 0; r < 12; r++) s += '<rect x="92" y="' + (30 + r * 11) + '" width="100" height="2.5" fill="#cfd6ff" opacity=".55"/>' + W(100, 26 + r * 11, 6, 1, 12, 5, 3, 0);
      s += '<rect x="196" y="70" width="60" height="92" fill="#18203c"/>' + W(202, 76, 4, 8, 9, 6, 5, 4) + palm(70, 160, 70, 1, dark) + palm(266, 162, 56, 0.85, dark) + '<rect y="160" width="320" height="20" fill="' + dark + '"/>';
    } else if (kind === 'penthouse') {
      [[10, 90, 30], [44, 70, 26], [250, 60, 28], [282, 96, 30], [214, 104, 26]].forEach((b, i) => s += '<rect x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + (180 - b[1]) + '" fill="#141a33" opacity="' + (day ? .7 : 1) + '"/>' + W(b[0] + 4, b[1] + 6, 3, 12, 4, 4, 4, 5));
      s += '<path d="M120,180 L128,40 L160,8 L192,40 L200,180 Z" fill="#1b2446"/>' + W(134, 60, 6, 14, 6, 5, 4, 3) + '<rect x="124" y="40" width="72" height="16" fill="url(#gls' + id + ')"/><rect x="128" y="34" width="64" height="6" fill="url(#pool' + id + ')"/>' + (day ? '' : '<ellipse cx="160" cy="46" rx="70" ry="22" fill="url(#gl' + id + ')" opacity=".55"/>') + '<rect y="160" width="320" height="20" fill="url(#sea' + id + ')"/>';
    } else if (kind === 'villa') {
      s += '<path d="M0,120 Q60,90 120,104 Q200,80 320,110 L320,180 L0,180 Z" fill="' + dark + '"/>';
      if (!day) for (let i = 0; i < 60; i++) s += '<circle cx="' + ((i * 53) % 320) + '" cy="' + (150 + (i * 17) % 28) + '" r=".9" fill="#ffd27a" opacity=".7"/>';
      s += '<rect x="70" y="70" width="140" height="40" fill="' + wall + '"/><rect x="76" y="76" width="128" height="30" fill="url(#gls' + id + ')"/><rect x="120" y="44" width="130" height="30" fill="' + shade(wall, 0.3) + '"/><rect x="126" y="50" width="118" height="20" fill="url(#gls' + id + ')"/>' +
        '<rect x="60" y="110" width="200" height="6" fill="#d9d2ca"/><rect x="80" y="116" width="150" height="12" fill="url(#pool' + id + ')"/>' + (day ? '' : '<ellipse cx="150" cy="90" rx="120" ry="40" fill="url(#gl' + id + ')" opacity=".25"/>') + palm(46, 128, 74, 1, dark) + palm(276, 128, 60, .85, dark);
    } else if (kind === 'beach') {
      s += '<rect y="112" width="320" height="34" fill="url(#sea' + id + ')"/>';
      for (let i = 0; i < 6; i++) s += '<path d="M' + (i * 60 - 10) + ',' + (126 + (i % 2) * 8) + ' q15,-6 30,0 t30,0" stroke="#fff" stroke-width="1.6" fill="none" opacity=".6"/>';
      s += '<path d="M0,146 Q160,132 320,148 L320,180 L0,180 Z" fill="' + (night ? '#8a7a5a' : '#f3d9a4') + '"/><rect x="132" y="90" width="120" height="44" fill="' + wall + '"/><rect x="138" y="96" width="70" height="32" fill="url(#gls' + id + ')"/><rect x="214" y="96" width="32" height="32" fill="url(#gls' + id + ')"/><rect x="126" y="86" width="132" height="6" fill="#d8d8d8"/>' +
        '<path d="M140,134 L140,150 M244,134 L244,150 M192,134 L192,150" stroke="#8a6c4a" stroke-width="3"/>' + palm(110, 150, 70, 1, night ? '#0b1a12' : '#2b5a2b') + palm(280, 152, 58, .8, night ? '#0b1a12' : '#2b5a2b');
    } else if (kind === 'chalet') {
      s += '<path d="M0,120 L60,50 L110,100 L170,30 L240,96 L280,60 L320,96 L320,180 L0,180 Z" fill="' + (day ? '#6c7fa8' : '#26325e') + '"/><path d="M60,50 L48,64 L72,64 Z M170,30 L156,46 L184,46 Z M280,60 L270,72 L290,72 Z" fill="#f4f7ff"/><path d="M0,150 Q160,136 320,150 L320,180 L0,180 Z" fill="#eef3fd"/>' +
        '<path d="M110,150 L160,74 L210,150 Z" fill="#5a3a24"/><path d="M128,150 L160,98 L192,150 Z" fill="url(#gls' + id + ')"/><path d="M104,152 L160,68 L216,152" stroke="#f4f7ff" stroke-width="5" fill="none"/>' + (day ? '' : '<ellipse cx="160" cy="130" rx="70" ry="30" fill="url(#gl' + id + ')" opacity=".4"/>');
    } else if (kind === 'island') {
      s += '<rect y="96" width="320" height="84" fill="url(#sea' + id + ')"/><ellipse cx="150" cy="128" rx="120" ry="22" fill="#5fd1e6" opacity=".45"/><ellipse cx="150" cy="122" rx="96" ry="16" fill="#f3dca8"/><ellipse cx="150" cy="118" rx="70" ry="10" fill="#4f9d4a"/>' +
        '<rect x="122" y="96" width="60" height="22" fill="' + wall + '"/><rect x="128" y="101" width="48" height="12" fill="url(#gls' + id + ')"/><rect x="118" y="93" width="68" height="4" fill="#ddd"/>' + palm(92, 120, 56, .9, '#2b5a2b') + palm(206, 118, 50, .8, '#2b5a2b') +
        '<path d="M250,150 L292,150 L284,160 L256,160 Z" fill="#fff"/><path d="M262,150 L262,132 L276,150 Z" fill="#e9eef5"/>';
    } else if (kind === 'mansion') {
      s += '<rect y="140" width="320" height="40" fill="' + (day ? '#4f8a3f' : dark) + '"/><rect x="50" y="62" width="220" height="78" fill="' + wall + '"/><path d="M40,64 L160,24 L280,64 Z" fill="' + shade(wall, -0.45) + '"/>' +
        '<rect x="140" y="92" width="40" height="48" fill="' + shade(wall, -0.6) + '"/>' + [70, 100, 196, 226].map(x => '<rect x="' + x + '" y="76" width="18" height="24" fill="url(#gls' + id + ')"/><rect x="' + x + '" y="110" width="18" height="24" fill="url(#gls' + id + ')"/>').join('') +
        [130, 150, 170, 190].map(x => '<rect x="' + (x - 2) + '" y="70" width="4" height="70" fill="#fff" opacity=".85"/>').join('') + '<path d="M120,140 L200,140 L230,180 L90,180 Z" fill="#cdbfa8" opacity=".6"/><circle cx="160" cy="160" r="8" fill="url(#pool' + id + ')"/>';
    } else if (kind === 'loft') {
      s += '<rect x="30" y="50" width="160" height="130" fill="#7a3b2a"/>' + [0, 1, 2].map(r => [0, 1, 2].map(c => '<rect x="' + (44 + c * 48) + '" y="' + (62 + r * 38) + '" width="38" height="30" fill="url(#gls' + id + ')"/><path d="M' + (63 + c * 48) + ',' + (62 + r * 38) + ' l0,30 M' + (44 + c * 48) + ',' + (77 + r * 38) + ' l38,0" stroke="#2a1a14" stroke-width="2"/>').join('')).join('') +
        '<rect x="200" y="80" width="100" height="100" fill="#3a3f55"/>' + W(208, 88, 5, 6, 12, 8, 6, 6) + '<rect x="30" y="44" width="160" height="8" fill="#4a2418"/><rect y="172" width="320" height="8" fill="#111"/>';
    } else if (kind === 'desert') {
      s += '<path d="M0,130 Q80,112 160,126 Q240,140 320,120 L320,180 L0,180 Z" fill="' + (night ? '#3a2a24' : '#d9a066') + '"/><path d="M0,146 L320,146 L320,180 L0,180 Z" fill="' + (night ? '#2a1d18' : '#e8b980') + '"/>' +
        '<rect x="70" y="96" width="170" height="44" fill="' + wall + '"/><rect x="60" y="90" width="190" height="8" fill="' + shade(wall, -0.2) + '"/><rect x="80" y="104" width="110" height="30" fill="url(#gls' + id + ')"/><rect x="200" y="104" width="30" height="36" fill="' + shade(wall, -0.4) + '"/><rect x="90" y="140" width="130" height="8" fill="url(#pool' + id + ')"/>' +
        '<path d="M270,146 l0,-34 M270,124 q-10,0 -10,-10 M270,120 q10,0 10,-12" stroke="#2f6b3a" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M36,146 l0,-24 M36,132 q8,0 8,-8" stroke="#2f6b3a" stroke-width="5" stroke-linecap="round" fill="none"/>';
    } else { // lake
      s += '<path d="M0,110 L50,70 L100,104 L150,60 L210,100 L260,72 L320,104 L320,120 L0,120 Z" fill="' + (day ? '#3f6a5a' : '#1f3346') + '"/><rect y="118" width="320" height="62" fill="url(#sea' + id + ')"/>' +
        '<rect x="110" y="84" width="110" height="36" fill="' + wall + '"/><path d="M104,86 L165,62 L226,86 Z" fill="' + shade(wall, -0.5) + '"/><rect x="118" y="92" width="94" height="22" fill="url(#gls' + id + ')"/><rect x="200" y="118" width="80" height="4" fill="#6a4a30"/>' +
        '<path d="M110,126 Q165,132 220,126" stroke="#ffd27a" opacity="' + (day ? 0 : .4) + '" fill="none"/>';
      for (let i = 0; i < 5; i++) s += '<path d="M' + (20 + i * 14) + ',118 l7,-26 l7,26 Z" fill="' + (day ? '#24503a' : '#0f2318') + '"/>';
    }
    return '<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" class="art-house">' + d + s + '</svg>';
  }
  const HSIG = [
    { id: 'studio', kind: 'studio', name: 'Trench Studio', place: 'Somewhere rainy', usd: 95000, blurb: 'Where every trencher starts. One window, three monitors.' },
    { id: 'condo', kind: 'condo', name: 'Miami Bay Condo', place: 'Miami', usd: 780000, blurb: 'Balcony, sunset, palm trees. Perfect for flex videos.' },
    { id: 'chalet', kind: 'chalet', name: 'Alpine Chalet', place: 'The Alps', usd: 6000000, blurb: 'Ski in, ski out, chart in.' },
    { id: 'penthouse', kind: 'penthouse', name: 'Marina Penthouse', place: 'Dubai', usd: 4500000, blurb: 'Rooftop pool, skyline view, peak larp.' },
    { id: 'villa', kind: 'villa', name: 'Hills Villa', place: 'Los Angeles', usd: 8900000, blurb: 'Glass walls, infinity pool, city lights below.' },
    { id: 'beach', kind: 'beach', name: 'Beach House', place: 'Malibu', usd: 12000000, blurb: 'Waves outside, green candles inside.' },
    { id: 'island', kind: 'island', name: 'Private Island', place: 'Caribbean', usd: 45000000, blurb: 'Only after a $1B+ coin. Comes with a yacht.' }
  ];
  HSIG.forEach(h => { h.beds = { studio: 1, condo: 2, chalet: 5, penthouse: 4, villa: 6, beach: 5, island: 8 }[h.kind]; h.sqft = { studio: 450, condo: 1400, chalet: 4800, penthouse: 4200, villa: 7800, beach: 5200, island: 12000 }[h.kind]; h.tod = null; });
  const KINDS = {
    studio: { label: 'Studio', base: 140e3, beds: [0, 1], sqft: [350, 650], names: ['Trench Studio', 'Micro Loft', 'Starter Studio', 'Cozy Studio'] },
    condo: { label: 'Condo', base: 650e3, beds: [1, 3], sqft: [800, 2200], names: ['Bay Condo', 'Skyline Condo', 'Harbor Condo', 'Tower Condo'] },
    loft: { label: 'Loft', base: 1.4e6, beds: [1, 3], sqft: [1400, 3600], names: ['Warehouse Loft', 'Brick Loft', 'Artist Loft', 'Industrial Loft'] },
    penthouse: { label: 'Penthouse', base: 3.6e6, beds: [3, 5], sqft: [2800, 7000], names: ['Sky Penthouse', 'Rooftop Penthouse', 'Marina Penthouse', 'Cloud Penthouse'] },
    villa: { label: 'Villa', base: 5e6, beds: [4, 8], sqft: [4500, 11000], names: ['Hills Villa', 'Glass Villa', 'Infinity Villa', 'Cliff Villa'] },
    mansion: { label: 'Mansion', base: 9e6, beds: [6, 12], sqft: [8000, 22000], names: ['Estate Mansion', 'Gated Mansion', 'Column Mansion', 'Manor'] },
    beach: { label: 'Beach house', base: 6e6, beds: [3, 7], sqft: [3000, 8000], names: ['Beach House', 'Oceanfront House', 'Dune House', 'Shore House'] },
    chalet: { label: 'Chalet', base: 3.5e6, beds: [3, 7], sqft: [2800, 7500], names: ['Alpine Chalet', 'Ski Chalet', 'Peak Chalet', 'Snow Lodge'] },
    lake: { label: 'Lake house', base: 2.8e6, beds: [3, 6], sqft: [2500, 6000], names: ['Lake House', 'Dock House', 'Waterfront Cabin', 'Pine Lake Home'] },
    desert: { label: 'Desert modern', base: 2.2e6, beds: [3, 6], sqft: [2400, 6500], names: ['Desert Modern', 'Canyon House', 'Mesa House', 'Dune Modern'] },
    island: { label: 'Island', base: 25e6, beds: [6, 12], sqft: [8000, 20000], names: ['Private Island', 'Atoll Estate', 'Cay Retreat', 'Lagoon Island'] }
  };
  const CITIES = [['Miami', 1.2, ['condo', 'penthouse', 'villa', 'beach']], ['Dubai', 1.4, ['penthouse', 'villa', 'mansion']], ['Los Angeles', 1.5, ['villa', 'mansion', 'loft']], ['Malibu', 2, ['beach', 'villa']], ['New York', 1.8, ['loft', 'penthouse', 'condo', 'studio']],
    ['London', 1.6, ['penthouse', 'loft', 'mansion']], ['Monaco', 2.6, ['penthouse', 'villa']], ['Aspen', 1.8, ['chalet', 'mansion']], ['Zermatt', 1.6, ['chalet']], ['Tokyo', 1.2, ['condo', 'loft', 'penthouse', 'studio']], ['Bali', 0.55, ['villa', 'beach']],
    ['Lisbon', 0.8, ['condo', 'loft', 'studio']], ['Berlin', 0.7, ['loft', 'studio', 'condo']], ['Scottsdale', 0.9, ['desert', 'mansion']], ['Palm Springs', 1, ['desert', 'villa']], ['Lake Tahoe', 1.3, ['lake', 'chalet']], ['Lake Como', 1.7, ['lake', 'villa']],
    ['Bahamas', 1.5, ['island', 'beach']], ['Ibiza', 1.3, ['villa', 'beach']], ['Singapore', 1.5, ['penthouse', 'condo']], ['Toronto', 0.9, ['condo', 'loft']], ['Mykonos', 1.2, ['villa', 'beach']], ['Cape Town', 0.7, ['villa', 'beach']], ['Maldives', 1.6, ['island']], ['Austin', 0.8, ['lake', 'loft', 'desert']]];
  const WALLS = ['#efe9e2', '#f6f2ee', '#e9e4dc', '#d8d2c6', '#c9d4e0', '#f0e2cf', '#e2d3c2'];
  const HOUSES = HSIG.slice();
  (function genHouses() {
    const r = rng(4243); const pick = a => a[Math.floor(r() * a.length)];
    for (let i = 0; i < 100; i++) {
      const city = pick(CITIES), kind = pick(city[2]), K = KINDS[kind];
      const beds = K.beds[0] + Math.floor(r() * (K.beds[1] - K.beds[0] + 1)), t = (beds - K.beds[0]) / Math.max(1, K.beds[1] - K.beds[0]);
      const sqft = Math.round((K.sqft[0] + (K.sqft[1] - K.sqft[0]) * (t * 0.7 + r() * 0.3)) / 10) * 10;
      const usd = Math.round(K.base * city[1] * (0.6 + t * 0.9) * (0.8 + r() * 0.4) / 5000) * 5000;
      HOUSES.push({ id: 'h' + i, kind, name: (beds ? beds + 'BR ' : '') + pick(K.names), place: city[0], usd, beds, baths: Math.max(1, beds - Math.floor(r() * 2)), sqft, tod: pick(['day', 'sunset', 'night']), wall: pick(WALLS), seed: 11 + i * 17, blurb: pick(['Move-in ready.', 'Views all day.', 'Perfect for flex content.', 'Quiet street, loud bags.', 'Comes furnished.', 'Recently renovated.', 'Smart home, dumb money.']) });
    }
  })();

  // ================= PROCEDURAL BUILDINGS =================
  // Each listing is composed from its own backdrop, building masses, roof types, window patterns, features and plants.
  const SETTING = { studio: ['city'], condo: ['city', 'coast'], loft: ['city'], penthouse: ['city', 'coast'], villa: ['hills', 'coast'], mansion: ['suburb', 'hills'], beach: ['coast'], chalet: ['mountain'], lake: ['lake'], desert: ['desert'], island: ['island'] };
  const COASTAL = { Miami: 1, Dubai: 1, Monaco: 1, Singapore: 1, Lisbon: 1, Bali: 1, Ibiza: 1, Mykonos: 1, 'Cape Town': 1, Bahamas: 1, Maldives: 1, Malibu: 1 };
  function pHouse(h) {
    const R = rng(5150 + parseInt(String(h.id).replace(/\D/g, '') || '0', 10) * 977), R2 = (a, b) => a + R() * (b - a), RI2 = (a, b) => Math.floor(R2(a, b + 1)), pk = a => a[Math.floor(R() * a.length)];
    const id = ++uid, tod = h.tod || 'day', night = tod === 'night', day = tod === 'day';
    let set = pk(SETTING[h.kind] || ['suburb']); if ((set === 'city') && COASTAL[h.place] && R() < .5) set = 'coast';
    const lit = night ? .55 : tod === 'sunset' ? .3 : .04;
    const SK = { day: [pk(['#3ea0ff', '#4aa8ff', '#5ab0f0']), '#9ad3ff', '#e6f6ff'], sunset: [pk(['#2b1a55', '#3a1d5c', '#24124a']), pk(['#e2577a', '#f06a5a', '#d9487d']), pk(['#ffb36b', '#ffc27a', '#ff9f6b'])], night: ['#03040b', pk(['#0c1433', '#101a3d', '#0a1029']), '#1b2550'] }[tod];
    let d = '<defs><linearGradient id="hs' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + SK[0] + '"/><stop offset=".62" stop-color="' + SK[1] + '"/><stop offset="1" stop-color="' + SK[2] + '"/></linearGradient>' +
      '<linearGradient id="hg' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + (day ? '#d6ecff' : '#ffe6a8') + '"/><stop offset="1" stop-color="' + (day ? '#7fb2df' : '#e49a3c') + '"/></linearGradient>' +
      '<linearGradient id="hp' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ff3ff"/><stop offset="1" stop-color="#1376d6"/></linearGradient>' +
      '<linearGradient id="hw' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (night ? '#14244d' : '#2b7bd6') + '"/><stop offset="1" stop-color="' + (night ? '#060c20' : '#0b2d66') + '"/></linearGradient>' +
      '<radialGradient id="hl' + id + '"><stop offset="0" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>';
    let s = '<rect width="320" height="180" fill="url(#hs' + id + ')"/>';
    if (night) s += stars(RI2(18, 40), 90, RI2(1, 999));
    const cx0 = R2(30, 290);
    s += day ? '<circle cx="' + cx0.toFixed(0) + '" cy="' + R2(22, 46).toFixed(0) + '" r="' + R2(12, 18).toFixed(0) + '" fill="#fff6c9"/>' : tod === 'sunset' ? '<circle cx="' + cx0.toFixed(0) + '" cy="' + R2(100, 124).toFixed(0) + '" r="' + R2(18, 30).toFixed(0) + '" fill="#ffd27a" opacity=".85"/>' : '<circle cx="' + cx0.toFixed(0) + '" cy="' + R2(20, 40).toFixed(0) + '" r="' + R2(8, 12).toFixed(0) + '" fill="#f4f1e0" opacity=".9"/>';
    const win = (x, y, w, hh, on) => '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + (on ? '#ffd27a' : day ? '#9cc8ee' : '#1c2340') + '"/>';
    const grid = (x, y, w, hh, cols, rows, ww, wh) => { let o = ''; const gx = (w - cols * ww) / (cols + 1), gy = (hh - rows * wh) / (rows + 1); for (let a = 0; a < rows; a++) for (let b = 0; b < cols; b++) o += win(x + gx + b * (ww + gx), y + gy + a * (wh + gy), ww, wh, R() < lit); return o; };
    const veg = (x, y, sc, kind) => {
      const col = night ? '#0b1a12' : day ? pk(['#2f6b3a', '#2b5a2b', '#3a7a3f']) : '#1a1230';
      if (kind === 'palm') { const t = [x + 8 * sc, y - 60 * sc]; let p = '<path d="M' + x + ',' + y + ' Q' + (x + 2 * sc) + ',' + (y - 30 * sc) + ' ' + t[0] + ',' + t[1] + '" stroke="' + col + '" stroke-width="' + 3 * sc + '" fill="none" stroke-linecap="round"/>'; [[-24, 8], [-15, -6], [0, -11], [15, -6], [24, 8], [-8, 12], [10, 12]].forEach(q => p += '<path d="M' + t[0] + ',' + t[1] + ' Q' + (t[0] + q[0] * .5 * sc) + ',' + (t[1] + q[1] * .2 * sc - 7 * sc) + ' ' + (t[0] + q[0] * sc) + ',' + (t[1] + q[1] * sc) + '" stroke="' + col + '" stroke-width="' + 2.4 * sc + '" fill="none" stroke-linecap="round"/>'); return p; }
      if (kind === 'pine') return '<path d="M' + x + ',' + y + ' l' + (8 * sc) + ',' + (-30 * sc) + ' l' + (8 * sc) + ',' + (30 * sc) + ' Z" fill="' + col + '"/><path d="M' + (x + 2 * sc) + ',' + (y - 12 * sc) + ' l' + (6 * sc) + ',' + (-24 * sc) + ' l' + (6 * sc) + ',' + (24 * sc) + ' Z" fill="' + col + '"/>';
      if (kind === 'cactus') return '<path d="M' + x + ',' + y + ' l0,' + (-28 * sc) + ' M' + x + ',' + (y - 16 * sc) + ' q' + (-9 * sc) + ',0 ' + (-9 * sc) + ',' + (-9 * sc) + ' M' + x + ',' + (y - 20 * sc) + ' q' + (9 * sc) + ',0 ' + (9 * sc) + ',' + (-11 * sc) + '" stroke="#2f6b3a" stroke-width="' + 5 * sc + '" stroke-linecap="round" fill="none"/>';
      return '<ellipse cx="' + x + '" cy="' + (y - 10 * sc) + '" rx="' + 12 * sc + '" ry="' + 11 * sc + '" fill="' + col + '"/><rect x="' + (x - 1.5 * sc) + '" y="' + (y - 4 * sc) + '" width="' + 3 * sc + '" height="' + 6 * sc + '" fill="#3a2a1a"/>';
    };
    // ---- backdrop ----
    let gY = 150;
    if (set === 'city' || set === 'coast') {
      const hz = set === 'coast' ? R2(108, 122) : 180; let bx = -10;
      while (bx < 330) { const bw = R2(16, 34), bh = R2(30, 105), by = (set === 'coast' ? hz : 160) - bh; s += '<rect x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" fill="' + (day ? '#7f93b8' : '#141a33') + '" opacity="' + (day ? .55 : .95) + '"/>'; if (!day) s += grid(bx, by + 4, bw, bh - 8, Math.max(1, Math.floor(bw / 8)), Math.max(2, Math.floor(bh / 9)), 3, 3); if (R() < .15) s += '<path d="M' + (bx + bw / 2).toFixed(1) + ',' + by.toFixed(1) + ' l0,-' + R2(6, 14).toFixed(0) + '" stroke="' + (day ? '#7f93b8' : '#141a33') + '" stroke-width="1.5"/>'; bx += bw + R2(-2, 6); }
      if (set === 'coast') s += '<rect y="' + hz.toFixed(1) + '" width="320" height="' + (180 - hz).toFixed(1) + '" fill="url(#hw' + id + ')"/>';
      gY = set === 'coast' ? R2(148, 160) : R2(156, 168);
    } else if (set === 'hills' || set === 'suburb') {
      for (let k = 0; k < 2; k++) { const y0 = R2(96, 120) + k * 14; s += '<path d="M0,' + y0.toFixed(0) + ' Q' + R2(40, 120).toFixed(0) + ',' + (y0 - R2(10, 34)).toFixed(0) + ' ' + R2(150, 190).toFixed(0) + ',' + (y0 - R2(-6, 14)).toFixed(0) + ' T320,' + (y0 - R2(0, 20)).toFixed(0) + ' L320,180 L0,180 Z" fill="' + (day ? (k ? '#4f8a3f' : '#7da86a') : night ? (k ? '#0d1424' : '#141c33') : (k ? '#2a1638' : '#3a2048')) + '"/>'; }
      if (!day) for (let i = 0; i < 50; i++) s += '<circle cx="' + R2(0, 320).toFixed(0) + '" cy="' + R2(140, 176).toFixed(0) + '" r=".9" fill="#ffd27a" opacity=".7"/>';
      gY = R2(146, 160);
    } else if (set === 'mountain') {
      let x = -20; const pts = ['M-20,130']; while (x < 340) { x += R2(30, 70); pts.push('L' + x.toFixed(0) + ',' + R2(26, 90).toFixed(0)); x += R2(20, 50); pts.push('L' + x.toFixed(0) + ',' + R2(90, 125).toFixed(0)); }
      s += '<path d="' + pts.join(' ') + ' L340,180 L-20,180 Z" fill="' + (day ? '#6c7fa8' : '#26325e') + '"/>' + '<path d="M0,' + R2(140, 150).toFixed(0) + ' Q160,' + R2(124, 140).toFixed(0) + ' 320,' + R2(140, 152).toFixed(0) + ' L320,180 L0,180 Z" fill="#eef3fd"/>';
      gY = R2(150, 158);
    } else if (set === 'desert') {
      for (let k = 0; k < RI2(1, 3); k++) { const mx = R2(0, 260), mw = R2(40, 100), mh = R2(18, 50); s += '<path d="M' + mx.toFixed(0) + ',130 L' + (mx + 10).toFixed(0) + ',' + (130 - mh).toFixed(0) + ' L' + (mx + mw - 10).toFixed(0) + ',' + (130 - mh).toFixed(0) + ' L' + (mx + mw).toFixed(0) + ',130 Z" fill="' + (night ? '#3a2a30' : '#c27b4a') + '"/>'; }
      s += '<path d="M0,' + R2(124, 136).toFixed(0) + ' Q80,' + R2(108, 124).toFixed(0) + ' 160,' + R2(120, 134).toFixed(0) + ' T320,' + R2(116, 130).toFixed(0) + ' L320,180 L0,180 Z" fill="' + (night ? '#3a2a24' : '#d9a066') + '"/>';
      gY = R2(148, 158);
    } else if (set === 'lake') {
      let x = -10; while (x < 330) { const sc = R2(.6, 1.2); s += veg(x, 118, sc, 'pine'); x += R2(10, 22); }
      s += '<rect y="118" width="320" height="62" fill="url(#hw' + id + ')"/>'; gY = R2(128, 136);
    } else { s += '<rect y="' + R2(92, 104).toFixed(0) + '" width="320" height="90" fill="url(#hw' + id + ')"/>'; gY = 128; }
    // ---- ground ----
    const gcol = { city: '#14161f', coast: '#1a1d28', hills: day ? '#4f8a3f' : '#18122a', suburb: day ? '#5b9a4a' : '#141c26', mountain: '#eef3fd', desert: night ? '#2a1d18' : '#e8b980', lake: day ? '#3f6a3a' : '#142018', island: '#f3dca8' }[set];
    if (set === 'island') { const iw = R2(110, 150), icx = R2(130, 190); s += '<ellipse cx="' + icx.toFixed(0) + '" cy="132" rx="' + (iw + 20).toFixed(0) + '" ry="22" fill="#5fd1e6" opacity=".45"/><ellipse cx="' + icx.toFixed(0) + '" cy="126" rx="' + iw.toFixed(0) + '" ry="16" fill="' + gcol + '"/><ellipse cx="' + icx.toFixed(0) + '" cy="122" rx="' + (iw * .7).toFixed(0) + '" ry="9" fill="#4f9d4a"/>'; gY = 122; }
    else if (set === 'coast' && (h.kind === 'beach' || R() < .5)) s += '<path d="M0,' + (gY - 4).toFixed(0) + ' Q160,' + (gY - 12).toFixed(0) + ' 320,' + (gY - 2).toFixed(0) + ' L320,180 L0,180 Z" fill="' + (night ? '#8a7a5a' : '#f3d9a4') + '"/>';
    else if (set !== 'mountain' && set !== 'desert' && set !== 'hills') s += '<rect y="' + gY.toFixed(0) + '" width="320" height="' + (180 - gY).toFixed(0) + '" fill="' + gcol + '"/>';
    // ---- building(s) ----
    const wall = h.wall || '#efe9e2', wall2 = shade(wall, -R2(.1, .3)), roofC = pk(['#3a3f4f', '#5a3a24', '#a4532d', '#2a2e3a', '#6b6f7a', '#7a2f1f']);
    const roof = (x, y, w, type, hh) => {
      if (type === 'gable') return '<path d="M' + (x - 5) + ',' + y + ' L' + (x + w / 2) + ',' + (y - hh) + ' L' + (x + w + 5) + ',' + y + ' Z" fill="' + roofC + '"/>';
      if (type === 'hip' || type === 'tile') { let o = '<path d="M' + (x - 6) + ',' + y + ' L' + (x + w * .2) + ',' + (y - hh) + ' L' + (x + w * .8) + ',' + (y - hh) + ' L' + (x + w + 6) + ',' + y + ' Z" fill="' + (type === 'tile' ? '#b4532d' : roofC) + '"/>'; if (type === 'tile') for (let k = 1; k < 5; k++) o += '<path d="M' + (x - 6 + k * 1.2) + ',' + (y - hh * k / 5) + ' L' + (x + w + 6 - k * 1.2) + ',' + (y - hh * k / 5) + '" stroke="#8a3a1d" stroke-width=".8"/>'; return o; }
      if (type === 'shed') return '<path d="M' + (x - 4) + ',' + y + ' L' + (x - 4) + ',' + (y - hh * .6) + ' L' + (x + w + 6) + ',' + (y - hh) + ' L' + (x + w + 6) + ',' + y + ' Z" fill="' + roofC + '"/>';
      return '<rect x="' + (x - R2(2, 8)) + '" y="' + (y - 4) + '" width="' + (w + R2(4, 16)) + '" height="4" fill="' + shade(wall, -.35) + '"/>';
    };
    const facade = (x, y, w, hh, style) => {
      if (style === 'glass') { let o = '<rect x="' + (x + w * .08) + '" y="' + (y + hh * .14) + '" width="' + (w * .84) + '" height="' + (hh * .72) + '" fill="url(#hg' + id + ')"/>'; const n = RI2(2, 5); for (let k = 1; k < n; k++) o += '<path d="M' + (x + w * .08 + w * .84 * k / n) + ',' + (y + hh * .14) + ' l0,' + (hh * .72) + '" stroke="' + shade(wall, -.5) + '" stroke-width="1.2"/>'; return o; }
      if (style === 'arch') { let o = ''; const n = Math.max(2, Math.floor(w / 26)); for (let k = 0; k < n; k++) { const wx = x + (k + .5) * w / n - 6; o += '<path d="M' + wx + ',' + (y + hh * .75) + ' L' + wx + ',' + (y + hh * .35) + ' A6,6 0 0 1 ' + (wx + 12) + ',' + (y + hh * .35) + ' L' + (wx + 12) + ',' + (y + hh * .75) + ' Z" fill="' + (R() < lit + .3 && !day ? '#ffd27a' : 'url(#hg' + id + ')') + '"/>'; } return o; }
      if (style === 'ribbon') { let o = ''; const n = Math.max(1, Math.floor(hh / 16)); for (let k = 0; k < n; k++) o += '<rect x="' + (x + 3) + '" y="' + (y + 5 + k * hh / n) + '" width="' + (w - 6) + '" height="' + (hh / n * .45) + '" fill="url(#hg' + id + ')"/>'; return o; }
      return grid(x, y, w, hh, Math.max(1, Math.floor(w / 18)), Math.max(1, Math.floor(hh / 18)), 9, 9);
    };
    let b = '';
    const urban = h.kind === 'studio' || h.kind === 'condo' || h.kind === 'loft' || h.kind === 'penthouse';
    if (urban) {
      const tw = R2(56, 100), th = h.kind === 'penthouse' ? R2(120, 150) : h.kind === 'condo' ? R2(100, 140) : R2(70, 110), tx = R2(70, 250 - tw), ty = gY - th;
      const col = h.kind === 'loft' ? pk(['#7a3b2a', '#6a4030', '#5b5b66']) : h.kind === 'studio' ? pk(['#2a2430', '#3a3440', '#4a3a3a']) : pk(['#1d2747', '#22304f', '#2b2f3f', '#3a4a6a']);
      b += '<rect x="' + tx + '" y="' + ty + '" width="' + tw + '" height="' + th + '" fill="' + col + '"/>';
      const fs = h.kind === 'loft' ? 'arch' : pk(['grid', 'ribbon', 'grid', 'glassgrid']);
      if (fs === 'glassgrid') { b += '<rect x="' + (tx + 3) + '" y="' + (ty + 3) + '" width="' + (tw - 6) + '" height="' + (th - 6) + '" fill="url(#hg' + id + ')" opacity=".35"/>'; for (let y = ty + 10; y < gY - 6; y += R2(8, 12)) b += '<path d="M' + tx + ',' + y + ' l' + tw + ',0" stroke="#cfd6ff" stroke-width="1" opacity=".5"/>'; b += grid(tx, ty, tw, th, Math.floor(tw / 12), Math.floor(th / 11), 6, 4); }
      else if (fs === 'arch') { const fl = Math.max(3, Math.floor(th / 26)); for (let k = 0; k < fl; k++) b += facade(tx, ty + k * th / fl, tw, th / fl, 'arch'); if (R() < .5) b += '<path d="M' + (tx + tw * .7) + ',' + (ty - 2) + ' l0,-14 l14,0 l0,14 M' + (tx + tw * .7 - 2) + ',' + (ty - 16) + ' l18,0" stroke="#3a2a20" stroke-width="2.5" fill="#5a3a26"/>'; }
      else if (fs === 'ribbon') b += facade(tx, ty, tw, th, 'ribbon');
      else b += grid(tx, ty, tw, th, Math.floor(tw / 13), Math.floor(th / 13), 7, 7);
      const top = h.kind === 'penthouse' ? pk(['pool', 'crown', 'glass']) : pk(['flat', 'flat', 'setback', 'spire', 'water']);
      if (top === 'pool' || top === 'glass') b += '<rect x="' + (tx + 4) + '" y="' + (ty - 14) + '" width="' + (tw - 8) + '" height="14" fill="url(#hg' + id + ')"/>' + (top === 'pool' ? '<rect x="' + (tx + 8) + '" y="' + (ty - 18) + '" width="' + (tw - 16) + '" height="4" fill="url(#hp' + id + ')"/>' : '') + (day ? '' : '<ellipse cx="' + (tx + tw / 2) + '" cy="' + (ty - 8) + '" rx="' + tw * .8 + '" ry="18" fill="url(#hl' + id + ')" opacity=".6"/>');
      else if (top === 'crown') b += '<path d="M' + tx + ',' + ty + ' L' + (tx + tw / 2) + ',' + (ty - R2(20, 34)) + ' L' + (tx + tw) + ',' + ty + ' Z" fill="' + shade(col, .15) + '"/>';
      else if (top === 'setback') b += '<rect x="' + (tx + tw * .2) + '" y="' + (ty - 16) + '" width="' + (tw * .6) + '" height="16" fill="' + shade(col, .1) + '"/>' + grid(tx + tw * .2, ty - 16, tw * .6, 16, 3, 1, 6, 6);
      else if (top === 'spire') b += '<path d="M' + (tx + tw / 2) + ',' + ty + ' l0,-' + R2(18, 30) + '" stroke="' + shade(col, .2) + '" stroke-width="2"/>';
      else if (top === 'water') b += '<path d="M' + (tx + 10) + ',' + ty + ' l0,-8 M' + (tx + 22) + ',' + ty + ' l0,-8" stroke="#3a2a20" stroke-width="1.5"/><rect x="' + (tx + 8) + '" y="' + (ty - 20) + '" width="16" height="12" rx="2" fill="#5a3a26"/><path d="M' + (tx + 6) + ',' + (ty - 20) + ' L' + (tx + 16) + ',' + (ty - 27) + ' L' + (tx + 26) + ',' + (ty - 20) + ' Z" fill="#3a2a20"/>';
      if (h.kind === 'studio') b += '<rect x="' + (tx + tw * .4) + '" y="' + (ty + th * .55) + '" width="12" height="10" fill="#7fb4ff"/><circle cx="' + (tx + tw * .4 + 6) + '" cy="' + (ty + th * .55 + 5) + '" r="16" fill="#5aa0ff" opacity=".18"/>';
      if (R() < .5) { const nx = tx > 160 ? R2(10, tx - 60) : R2(tx + tw + 8, 260), nw = R2(36, 60), nh = R2(50, th * .8); b += '<rect x="' + nx + '" y="' + (gY - nh) + '" width="' + nw + '" height="' + nh + '" fill="' + shade(col, -.25) + '"/>' + grid(nx, gY - nh, nw, nh, Math.floor(nw / 12), Math.floor(nh / 12), 5, 5); }
      if (set === 'coast' && R() < .6) { b += veg(R2(20, 60), gY + 6, R2(.8, 1.1), 'palm') + veg(R2(260, 300), gY + 6, R2(.7, 1), 'palm'); }
    } else if (h.kind === 'chalet') {
      const w = R2(80, 130), x = R2(80, 230 - w), hh = R2(70, 95), y = gY;
      if (R() < .55) { b += '<path d="M' + x + ',' + y + ' L' + (x + w / 2) + ',' + (y - hh) + ' L' + (x + w) + ',' + y + ' Z" fill="' + pk(['#5a3a24', '#6b4528', '#4a2e1c']) + '"/><path d="M' + (x + w * .18) + ',' + y + ' L' + (x + w / 2) + ',' + (y - hh * .7) + ' L' + (x + w * .82) + ',' + y + ' Z" fill="url(#hg' + id + ')"/><path d="M' + (x - 6) + ',' + (y + 2) + ' L' + (x + w / 2) + ',' + (y - hh - 6) + ' L' + (x + w + 6) + ',' + (y + 2) + '" stroke="#f4f7ff" stroke-width="5" fill="none"/>'; }
      else { const bh = hh * .6; b += '<rect x="' + x + '" y="' + (y - bh) + '" width="' + w + '" height="' + bh + '" fill="' + pk(['#6b4528', '#5a3a24']) + '"/>' + facade(x, y - bh, w, bh, 'glass') + roof(x, y - bh, w, 'gable', hh * .45) + '<path d="M' + (x - 6) + ',' + (y - bh) + ' L' + (x + w / 2) + ',' + (y - bh - hh * .45 - 4) + ' L' + (x + w + 6) + ',' + (y - bh) + '" stroke="#f4f7ff" stroke-width="4" fill="none"/><rect x="' + (x - 4) + '" y="' + (y - bh * .5) + '" width="' + (w + 8) + '" height="3" fill="#3a2414"/>'; }
      if (!day) b += '<ellipse cx="' + (x + w / 2) + '" cy="' + (y - hh * .3) + '" rx="' + w * .7 + '" ry="30" fill="url(#hl' + id + ')" opacity=".4"/>';
      for (let k = 0; k < RI2(2, 6); k++) b += veg(pk([R2(10, x - 20), R2(x + w + 10, 300)]), gY + 4, R2(.6, 1.2), 'pine');
      if (R() < .5) b += '<path d="M' + (x + w * .72) + ',' + (y - hh * .5) + ' l0,-' + R2(14, 24) + ' l8,0 l0,' + R2(10, 16) + '" fill="#4a4a52"/>';
    } else {
      // low-rise houses: 1-3 masses
      const style = h.kind === 'mansion' ? pk(['classic', 'modern', 'med']) : h.kind === 'villa' ? pk(['modern', 'modern', 'med']) : h.kind === 'desert' ? 'desert' : h.kind === 'beach' ? pk(['modern', 'stilts']) : h.kind === 'lake' ? pk(['cabin', 'modern']) : h.kind === 'island' ? pk(['modern', 'med']) : 'modern';
      const sc = h.kind === 'island' ? .55 : 1, n = style === 'classic' ? 1 : RI2(1, 3);
      let x = R2(50, 110) * (h.kind === 'island' ? 1.3 : 1), baseY = gY - (style === 'stilts' ? 16 : 0), totalW = 0;
      if (style === 'classic') {
        const w = R2(140, 200) * sc, hh = R2(50, 70) * sc; x = 160 - w / 2;
        b += '<rect x="' + x + '" y="' + (baseY - hh) + '" width="' + w + '" height="' + hh + '" fill="' + wall + '"/>' + roof(x, baseY - hh, w, pk(['hip', 'gable', 'hip']), R2(22, 40) * sc);
        b += grid(x, baseY - hh, w, hh, Math.floor(w / 22), 2, 12 * sc, 16 * sc);
        const cols = RI2(4, 6), cw = w * .36; for (let k = 0; k < cols; k++) b += '<rect x="' + (160 - cw / 2 + k * cw / (cols - 1) - 2) + '" y="' + (baseY - hh * .92) + '" width="4" height="' + hh * .92 + '" fill="#fff" opacity=".9"/>';
        b += '<path d="M' + (160 - cw / 2 - 8) + ',' + (baseY - hh * .92) + ' L160,' + (baseY - hh - R2(14, 24)) + ' L' + (160 + cw / 2 + 8) + ',' + (baseY - hh * .92) + ' Z" fill="' + shade(wall, .2) + '"/><rect x="152" y="' + (baseY - 26 * sc) + '" width="16" height="' + 26 * sc + '" fill="' + shade(wall, -.6) + '"/>';
        b += '<path d="M120,' + baseY + ' L200,' + baseY + ' L230,180 L90,180 Z" fill="#cdbfa8" opacity=".5"/>' + (R() < .6 ? '<circle cx="160" cy="' + (baseY + 14) + '" r="7" fill="url(#hp' + id + ')"/>' : '');
        totalW = w;
      } else {
        for (let k = 0; k < n; k++) {
          const w = R2(60, 110) * sc, hh = (style === 'desert' ? R2(28, 40) : style === 'cabin' ? R2(34, 46) : R2(32, 52)) * sc;
          const y = baseY - (k > 0 && R() < .6 ? R2(26, 42) * sc : 0);
          const col = k % 2 ? wall2 : wall;
          b += '<rect x="' + x + '" y="' + (y - hh) + '" width="' + w + '" height="' + hh + '" fill="' + (style === 'cabin' ? '#6b4528' : style === 'desert' ? pk(['#d8b48c', '#c9a37a', '#e2c9a4']) : col) + '"/>';
          b += facade(x, y - hh, w, hh, style === 'med' ? 'arch' : style === 'cabin' ? 'grid' : pk(['glass', 'glass', 'ribbon', 'grid']));
          const rt = style === 'med' ? 'tile' : style === 'cabin' ? 'gable' : style === 'desert' ? 'flat' : pk(['flat', 'flat', 'flat', 'shed']);
          b += roof(x, y - hh, w, rt, R2(14, 26) * sc);
          if (R() < .3 && style !== 'desert') b += '<rect x="' + (x + w * .1) + '" y="' + (y - hh * .48) + '" width="' + w * .8 + '" height="2" fill="#fff" opacity=".8"/><path d="M' + (x + w * .1) + ',' + (y - hh * .48) + ' l0,8 M' + (x + w * .9) + ',' + (y - hh * .48) + ' l0,8" stroke="#fff" opacity=".6"/>';
          if (R() < .2 && k === 0) b += '<rect x="' + (x + w * .65) + '" y="' + (y - hh) + '" width="7" height="' + R2(10, 18) + '" transform="translate(0,-14)" fill="' + shade(col, -.3) + '"/>';
          x += w * R2(.55, .95); totalW = x;
        }
        if (style === 'stilts') for (let k = 0; k < 4; k++) b += '<path d="M' + (90 + k * (totalW - 90) / 3) + ',' + baseY + ' l0,16" stroke="#8a6c4a" stroke-width="3"/>';
        if (h.kind !== 'lake' && h.kind !== 'island' && R() < .75) { const px = R2(60, 140), pw = R2(80, 150); b += '<rect x="' + px + '" y="' + (gY + 2) + '" width="' + pw + '" height="' + R2(8, 14) + '" rx="' + pk([0, 3, 6]) + '" fill="url(#hp' + id + ')"/><rect x="' + (px - 6) + '" y="' + gY + '" width="' + (pw + 12) + '" height="3" fill="#d9d2ca"/>'; }
        if (h.kind === 'lake') b += '<rect x="' + R2(150, 220) + '" y="' + (gY + 4) + '" width="' + R2(60, 90) + '" height="4" fill="#6a4a30"/>' + (R() < .6 ? '<path d="M' + R2(230, 270) + ',' + (gY + 16) + ' l30,0 l-6,8 l-20,0 Z" fill="#f4f4f4"/>' : '');
        if (h.kind === 'island' || (set === 'coast' && R() < .5)) b += '<path d="M' + R2(240, 270) + ',' + (gY + 26) + ' l40,0 l-8,10 l-26,0 Z" fill="#fff"/><path d="M' + R2(252, 262) + ',' + (gY + 26) + ' l0,-18 l14,18 Z" fill="#e9eef5"/>';
      }
      if (!day) b += '<ellipse cx="' + (totalW / 2 + 60) + '" cy="' + (baseY - 30) + '" rx="120" ry="40" fill="url(#hl' + id + ')" opacity=".25"/>';
      const vk = set === 'desert' ? 'cactus' : set === 'lake' || set === 'mountain' ? 'pine' : set === 'suburb' ? 'tree' : 'palm';
      for (let k = 0; k < RI2(1, 4); k++) b += veg(pk([R2(14, 60), R2(250, 306)]), gY + (set === 'island' ? 0 : 4), R2(.6, 1.1) * (h.kind === 'island' ? .8 : 1), vk);
      if (set === 'suburb' && R() < .6) b += '<path d="M0,' + (gY + 2) + ' L320,' + (gY + 2) + '" stroke="' + (day ? '#3f7a32' : '#0d1a10') + '" stroke-width="7"/>';
    }
    return '<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" class="art-house">' + d + s + b + '</svg>';
  }
  const HOUSE_BY = {}; HOUSES.forEach(h => HOUSE_BY[h.id] = h);
  function houseArt(h) { if (h.tod) return pHouse(h); return house(h.kind || h.id, { wall: h.wall, seed: h.seed }); }

  G.Art = { car, carArt, house, houseArt, CARS, HOUSES, CAR_BY, HOUSE_BY, CLASSES, KINDS, PAINTS, shade };
})(typeof window !== 'undefined' ? window : globalThis);
