/* Glasspad cars v2 — every one of the 1000 catalog cars gets its own original design.
   ~30 body archetypes (each built differently) + per-car random geometry, outline noise, surfacing, lights, aero,
   livery and wheels. Inspired by how real designers work (proportion, stance, surfacing, signature lights) —
   no real model is copied and no real brand is used. */
(function (G) {
  'use strict';
  const Art = G.Art; if (!Art) return;
  const shade = Art.shade;
  let uid = 50000;
  function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const f = n => (Math.round(n * 10) / 10).toString();
  const lerp = (a, b, t) => a + (b - a) * t;

  // rounded polyline: each vertex [x, y, radius]; radius 0 = sharp corner
  function rounded(pts) {
    let d = 'M' + f(pts[0][0]) + ',' + f(pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], a = pts[i - 1], b = pts[i + 1], r = p[2] || 0;
      if (r <= 0.6) { d += ' L' + f(p[0]) + ',' + f(p[1]); continue; }
      const la = Math.hypot(p[0] - a[0], p[1] - a[1]) || 1, lb = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1, rr = Math.min(r, la * 0.5, lb * 0.5);
      d += ' L' + f(p[0] + (a[0] - p[0]) * rr / la) + ',' + f(p[1] + (a[1] - p[1]) * rr / la) + ' Q' + f(p[0]) + ',' + f(p[1]) + ' ' + f(p[0] + (b[0] - p[0]) * rr / lb) + ',' + f(p[1] + (b[1] - p[1]) * rr / lb);
    }
    const e = pts[pts.length - 1]; return d + ' L' + f(e[0]) + ',' + f(e[1]);
  }

  // ---------- archetypes ----------
  // b: builder ('gen' generic monocoque, or special builders); ranges are [min,max]
  const AR = {
    wedgeSuper: { b: 'gen', L: [262, 290], rr: [21, 23.5], rf: [20, 22], wb: [.55, .6], bodyH: [26, 32], cabinH: [16, 21], roofLen: [22, 38], hood: [.17, .23], rake: [1.7, 2.4], slope: [2, 7], tail: ['kamm', 'duck', 'fast'], nose: ['wedge', 'shark'], roof: ['coupe', 'coupe', 'targa'], curvy: [.25, .6], intake: 1, aero: .7 },
    curvySuper: { b: 'gen', L: [260, 286], rr: [21, 23], rf: [20, 22], wb: [.55, .6], bodyH: [28, 34], cabinH: [17, 22], roofLen: [26, 42], hood: [.2, .26], rake: [1.5, 2], slope: [-1, 4], tail: ['fast', 'boat', 'duck'], nose: ['round', 'bullet'], roof: ['coupe', 'bubble'], curvy: [1.3, 2.3], intake: 1, aero: .4 },
    hyperCanopy: { b: 'gen', L: [276, 302], rr: [21, 23], rf: [20, 22], wb: [.55, .59], bodyH: [24, 30], cabinH: [18, 23], roofLen: [30, 46], hood: [.2, .25], rake: [1.4, 1.9], slope: [0, 5], tail: ['long', 'kamm'], nose: ['bullet', 'shark', 'wedge'], roof: ['bubble'], curvy: [.8, 1.8], intake: 1, aero: .9, fin: .5 },
    lemans: { b: 'gen', L: [286, 306], rr: [21, 22.5], rf: [21, 22.5], wb: [.52, .56], bodyH: [24, 28], cabinH: [18, 22], roofLen: [30, 40], hood: [.24, .3], rake: [1.3, 1.7], slope: [-2, 2], tail: ['long'], nose: ['bullet', 'shark'], roof: ['bubble'], curvy: [1, 1.8], intake: .6, aero: 1, fin: 1, skirt: .8 },
    fastbackGT: { b: 'gen', L: [266, 292], rr: [20, 22], rf: [20, 22], wb: [.56, .6], bodyH: [30, 35], cabinH: [19, 24], roofLen: [36, 54], hood: [.34, .42], rake: [1.3, 1.8], slope: [-2, 3], tail: ['fast', 'kamm', 'duck'], nose: ['round', 'shark', 'blunt'], roof: ['coupe'], curvy: [.8, 1.6], intake: .3, aero: .3 },
    targaGT: { b: 'gen', L: [256, 280], rr: [19.5, 21.5], rf: [19.5, 21.5], wb: [.55, .6], bodyH: [29, 34], cabinH: [17, 21], roofLen: [30, 44], hood: [.3, .38], rake: [1.3, 1.7], slope: [0, 4], tail: ['fast', 'duck'], nose: ['round', 'shark'], roof: ['targa', 'open'], curvy: [.9, 1.7], aero: .3 },
    shootingBrake: { b: 'gen', L: [268, 294], rr: [20, 22], rf: [20, 22], wb: [.57, .61], bodyH: [30, 35], cabinH: [20, 25], roofLen: [80, 106], hood: [.32, .4], rake: [1.2, 1.6], slope: [-1, 2], tail: ['kamm', 'box'], nose: ['shark', 'round', 'blunt'], roof: ['long'], curvy: [.6, 1.3], aero: .2 },
    sedan: { b: 'gen', L: [256, 284], rr: [19, 21], rf: [19, 21], wb: [.58, .63], bodyH: [31, 36], cabinH: [22, 27], roofLen: [66, 90], hood: [.26, .32], rake: [1, 1.4], slope: [-1, 2], tail: ['notch'], nose: ['blunt', 'round', 'shark'], roof: ['sedan'], curvy: [.6, 1.4], doors4: 1 },
    fastSedan: { b: 'gen', L: [262, 290], rr: [19.5, 21.5], rf: [19.5, 21.5], wb: [.59, .63], bodyH: [30, 34], cabinH: [21, 25], roofLen: [58, 78], hood: [.24, .3], rake: [1.3, 1.7], slope: [0, 3], tail: ['fast', 'duck'], nose: ['bullet', 'round', 'shark'], roof: ['sedan'], curvy: [.9, 1.7], doors4: 1 },
    limo: { b: 'gen', L: [298, 316], rr: [19, 21], rf: [19, 21], wb: [.64, .68], bodyH: [32, 36], cabinH: [23, 27], roofLen: [118, 150], hood: [.22, .27], rake: [.9, 1.2], slope: [-1, 1], tail: ['notch'], nose: ['blunt'], roof: ['sedan'], curvy: [.5, 1], doors4: 1, chrome: .6 },
    hatch: { b: 'gen', L: [214, 240], rr: [17, 19.5], rf: [17, 19.5], wb: [.6, .67], bodyH: [31, 36], cabinH: [24, 30], roofLen: [62, 82], hood: [.18, .25], rake: [.8, 1.2], slope: [-1, 3], tail: ['box', 'kamm'], nose: ['blunt', 'round', 'shark'], roof: ['sedan'], curvy: [.6, 1.6] },
    rallyHatch: { b: 'gen', L: [220, 244], rr: [18, 20], rf: [18, 20], wb: [.6, .66], bodyH: [30, 35], cabinH: [23, 28], roofLen: [60, 78], hood: [.2, .26], rake: [.9, 1.3], slope: [-1, 2], tail: ['box', 'kamm'], nose: ['blunt', 'shark'], roof: ['sedan'], curvy: [.4, 1], aero: .9, rally: 1, clear: [2, 5] },
    microcar: { b: 'gen', L: [168, 196], rr: [14, 16.5], rf: [14, 16.5], wb: [.6, .68], bodyH: [30, 38], cabinH: [32, 40], roofLen: [52, 68], hood: [.1, .16], rake: [.5, .9], slope: [-2, 2], tail: ['box'], nose: ['round', 'blunt'], roof: ['high'], curvy: [1.2, 2.2] },
    bubbleCar: { b: 'bubble', L: [160, 190], rr: [12, 14.5], rf: [12, 14.5] },
    van: { b: 'gen', L: [262, 292], rr: [19, 21.5], rf: [19, 21.5], wb: [.6, .66], bodyH: [36, 44], cabinH: [36, 46], roofLen: [150, 190], hood: [.1, .16], rake: [.55, .9], slope: [-1, 1], tail: ['box'], nose: ['blunt', 'round'], roof: ['high'], curvy: [.5, 1.3], doors4: 1, clear: [2, 5] },
    boxySUV: { b: 'gen', L: [252, 282], rr: [22, 25], rf: [22, 25], wb: [.58, .63], bodyH: [38, 46], cabinH: [30, 36], roofLen: [96, 124], hood: [.22, .3], rake: [.55, .85], slope: [-1, 1], tail: ['box'], nose: ['blunt'], roof: ['high'], curvy: [.2, .6], doors4: 1, clear: [6, 10], rack: .5, spare: .5 },
    crossover: { b: 'gen', L: [256, 284], rr: [21, 23], rf: [21, 23], wb: [.59, .63], bodyH: [36, 42], cabinH: [24, 30], roofLen: [84, 108], hood: [.24, .3], rake: [1.1, 1.5], slope: [1, 5], tail: ['kamm', 'fast'], nose: ['round', 'shark'], roof: ['long'], curvy: [.9, 1.6], doors4: 1, clear: [4, 7], cladding: 1 },
    offroader: { b: 'gen', L: [244, 272], rr: [25, 28], rf: [25, 28], wb: [.58, .64], bodyH: [34, 40], cabinH: [30, 36], roofLen: [76, 100], hood: [.24, .3], rake: [.45, .75], slope: [-1, 1], tail: ['box'], nose: ['blunt'], roof: ['high', 'open'], curvy: [.15, .5], clear: [12, 18], spare: .8, offroad: 1, snorkel: .5, lightbar: .6 },
    pickup: { b: 'gen', L: [276, 300], rr: [23, 26.5], rf: [23, 26.5], wb: [.6, .64], bodyH: [40, 48], cabinH: [30, 36], roofLen: [48, 76], hood: [.24, .3], rake: [.55, .85], slope: [-1, 1], tail: ['bed'], nose: ['blunt'], roof: ['high'], curvy: [.2, .6], clear: [8, 12], lightbar: .5, offroad: .4 },
    cyberTruck: { b: 'cyber', L: [276, 300], rr: [24, 27], rf: [24, 27] },
    tearEV: { b: 'gen', L: [256, 284], rr: [19, 21.5], rf: [19, 21.5], wb: [.6, .65], bodyH: [29, 34], cabinH: [22, 27], roofLen: [50, 72], hood: [.2, .26], rake: [1.5, 2.1], slope: [0, 3], tail: ['long', 'kamm'], nose: ['bullet', 'round'], roof: ['coupe', 'bubble'], curvy: [1.4, 2.4], skirt: .6, ev: 1 },
    muscle: { b: 'gen', L: [270, 296], rr: [21, 23.5], rf: [20, 22], wb: [.56, .6], bodyH: [33, 38], cabinH: [19, 24], roofLen: [44, 62], hood: [.36, .43], rake: [1.1, 1.5], slope: [-3, 1], tail: ['notch', 'fast', 'duck'], nose: ['blunt', 'shark'], roof: ['coupe', 'coupe', 'open'], curvy: [.4, 1], scoop: .7, stripes: .5 },
    lowrider: { b: 'gen', L: [296, 314], rr: [16, 18], rf: [16, 18], wb: [.6, .64], bodyH: [30, 34], cabinH: [21, 25], roofLen: [72, 96], hood: [.3, .36], rake: [1, 1.3], slope: [-1, 1], tail: ['notch', 'fin'], nose: ['blunt'], roof: ['sedan', 'open'], curvy: [.5, 1.1], chrome: 1, clear: [-4, -1], wire: 1, twoTone: .6 },
    tailfin: { b: 'gen', L: [290, 314], rr: [18, 20], rf: [18, 20], wb: [.58, .62], bodyH: [31, 35], cabinH: [21, 25], roofLen: [58, 80], hood: [.3, .36], rake: [1, 1.4], slope: [-2, 0], tail: ['fin'], nose: ['blunt', 'round'], roof: ['sedan', 'open'], curvy: [.8, 1.5], chrome: 1, twoTone: .7, whitewall: .7 },
    pontoon: { b: 'gen', L: [262, 286], rr: [18, 20], rf: [18, 20], wb: [.58, .62], bodyH: [34, 40], cabinH: [24, 28], roofLen: [56, 74], hood: [.3, .36], rake: [.9, 1.2], slope: [-1, 1], tail: ['notch', 'boat'], nose: ['round'], roof: ['sedan'], curvy: [1.8, 2.8], chrome: 1, whitewall: .6, twoTone: .5 },
    vintage: { b: 'vintage', L: [262, 292], rr: [18, 20.5], rf: [18, 20.5] },
    hotrod: { b: 'hotrod', L: [236, 262], rr: [23, 26], rf: [15, 17.5] },
    formula: { b: 'formula', L: [272, 300], rr: [21, 23], rf: [19, 21] },
    buggy: { b: 'buggy', L: [200, 228], rr: [21, 24], rf: [19, 22] }
  };
  // ---- v6: 71 more body types (100 total). Generic ones extend a base and add their own geometry + parts ----
  const X = (b, o) => Object.assign({}, AR[b], o);
  Object.assign(AR, {
    // hatch
    cityCar: X('hatch', { L: [196, 214], rr: [16, 18], rf: [16, 18], cabinH: [27, 33], roofLen: [58, 74], hood: [.13, .18], rake: [.6, .9], tail: ['box'], nose: ['round'], curvy: [1.4, 2.2], twoTone: .45, hl: ['round', 'dual'] }),
    hotHatch: X('hatch', { L: [224, 244], rr: [18.5, 20.5], rf: [18.5, 20.5], clear: [-1.5, .5], aero: 1, aeroT: ['wing', 'lip'], intake: .6, flares: .8, stripes: .45, ex: ['quad', 'center', 'dual'], wheels: ['split', 'mesh', 'spoke'], tail: ['kamm', 'box'], nose: ['shark', 'blunt'] }),
    keiCar: X('microcar', { L: [178, 198], rr: [13.5, 15], rf: [13.5, 15], bodyH: [30, 34], cabinH: [36, 42], roofLen: [80, 110], hood: [.05, .09], rake: [.2, .4], tail: ['box'], nose: ['blunt'], roof: ['high'], curvy: [.15, .45], hl: ['rect', 'round'], tl: ['block'] }),
    retroHatch: X('hatch', { L: [204, 224], curvy: [2.2, 3.2], nose: ['round'], tail: ['boat', 'kamm'], twoTone: .5, chrome: .7, whitewall: .35, hl: ['round'], wheels: ['steel', 'disc', 'spoke'] }),
    liftback: X('hatch', { L: [236, 258], rr: [18.5, 20.5], rf: [18.5, 20.5], tail: ['fast'], roofLen: [50, 66], rake: [1.2, 1.6], cabinH: [21, 25], hood: [.24, .3], hl: ['pop', 'slit', 'rect'], louvers: .4 }),
    tukTuk: { b: 'tuk', L: [150, 172], rr: [12, 13.5], rf: [11, 12.5] },
    // sedan
    wagon: X('sedan', { roof: ['long'], tail: ['box', 'kamm'], roofLen: [112, 140], rack: .85, L: [266, 292] }),
    hearse: X('limo', { L: [300, 318], roof: ['long'], tail: ['box'], cabinH: [26, 30], landau: 1, chrome: .8, curvy: [.4, .8] }),
    taxiCab: X('sedan', { taxi: 1, hl: ['rect', 'dual'], wheels: ['steel', 'disc'] }),
    sleeper: X('sedan', { clear: [-3, -.5], wheels: ['mesh', 'disc', 'split'], wcol: ['#2b2d38', '#16181f'], ex: ['quad'], curvy: [.3, .7], nose: ['blunt'], hl: ['rect', 'bar'] }),
    executive: X('sedan', { L: [284, 304], wb: [.62, .66], chrome: .95, roofLen: [80, 100], opera: .5, vinyl: .35, nose: ['blunt'], hl: ['rect', 'bar', 'dual'] }),
    armored: X('sedan', { bodyH: [37, 41], cabinH: [24, 28], curvy: [.1, .3], armored: 1, clear: [3, 6], nose: ['blunt'], rr: [21, 23], rf: [21, 23], wheels: ['steel', 'disc'] }),
    // suv
    coupeSUV: X('crossover', { tail: ['fast'], roofLen: [56, 76], rake: [1.3, 1.7], slope: [2, 5], curvy: [1, 1.8], aero: .4, aeroT: ['lip'] }),
    safari: X('offroader', { L: [256, 280], roof: ['high'], tent: 1, ladder: 1, snorkel: .9, bullbar: 1, lightbar: .3, spare: 0 }),
    sixWheeler: X('pickup', { L: [298, 316], wb: [.44, .48], oR: [.62, .66], six: 1, clear: [8, 12], offroad: 1, lightbar: .7, roof: ['high'], rr: [23, 25], rf: [23, 25] }),
    stretchSUV: X('boxySUV', { L: [300, 318], wb: [.66, .7], roofLen: [150, 185], chrome: .7, clear: [3, 6], rack: 0, spare: 0 }),
    minivan: X('van', { L: [250, 276], hood: [.16, .22], rake: [.9, 1.3], cabinH: [28, 34], bodyH: [34, 40], nose: ['round'], curvy: [1, 1.6], slope: [0, 2], clear: [2, 4], tail: ['box', 'kamm'] }),
    camper: X('van', { L: [272, 298], popTop: 1, ladder: .6, twoTone: .85, curvy: [1, 1.8] }),
    // ev
    kammEV: X('tearEV', { tail: ['kamm'], nose: ['bullet'], roof: ['long'], roofLen: [72, 96], skirt: 1, hl: ['bar'], tl: ['bar'] }),
    evSedan: X('fastSedan', { ev: 1, nose: ['bullet', 'round'], hl: ['bar', 'slit'], tl: ['bar'], curvy: [1.4, 2.2], skirt: .3, solar: .3 }),
    evCrossover: X('crossover', { ev: 1, nose: ['bullet', 'round'], hl: ['bar'], tl: ['bar'], curvy: [1.4, 2.1], cladding: 0 }),
    evHyper: X('hyperCanopy', { ev: 1, nose: ['shark', 'wedge'], roof: ['coupe'], fin: 0, aero: .5, hl: ['slit', 'bar'], tail: ['kamm', 'fast'], intake: .9, canards: .6 }),
    evVan: X('van', { ev: 1, nose: ['round'], hood: [.04, .08], rake: [.3, .6], curvy: [1.6, 2.6], twoTone: .6, hl: ['bar'], tl: ['bar'], L: [256, 282] }),
    evRoadster: X('targaGT', { roof: ['open'], ev: 1, nose: ['bullet', 'round'], curvy: [1.4, 2.2], L: [230, 252], tail: ['kamm', 'fast'], hl: ['bar', 'slit'] }),
    solarCar: { b: 'solar', L: [286, 306], rr: [13, 14.5], rf: [13, 14.5] },
    podCar: { b: 'pod', L: [168, 194], rr: [10, 11.5], rf: [10, 11.5] },
    // gt
    grandTourer: X('fastbackGT', { L: [284, 304], hood: [.38, .45], roofLen: [44, 60], chrome: .4, rake: [1.2, 1.5], hl: ['slit', 'round', 'bar'] }),
    speedster: X('targaGT', { roof: ['open'], L: [240, 262], tail: ['boat', 'fast'], speedster: 1, curvy: [1.4, 2.2] }),
    barchetta: X('targaGT', { roof: ['open'], L: [226, 248], curvy: [1.8, 2.8], nose: ['round'], tail: ['boat', 'kamm'], roundel: .7, wheels: ['wire', 'spoke'], hl: ['round'] }),
    boatTail: X('fastbackGT', { tail: ['boat'], roof: ['open', 'coupe'], L: [292, 314], chrome: .8, curvy: [1.6, 2.4] }),
    gullwing: X('fastbackGT', { gull: 1, roofLen: [36, 50], L: [256, 278] }),
    retroGT: X('fastbackGT', { curvy: [1.8, 2.8], chrome: .7, wheels: ['wire', 'spoke', 'disc'], hl: ['round', 'dual'], tail: ['kamm', 'fast'], stripes: .35, L: [250, 272] }),
    splitWindow: X('fastbackGT', { split: 1, tail: ['fast', 'boat'], curvy: [1.2, 2], L: [256, 276], chrome: .5, hl: ['pop'], louvers: .3 }),
    aeroCoupe: X('fastbackGT', { skirt: 1, curvy: [2.2, 3.2], nose: ['bullet'], tail: ['long'], wheels: ['disc', 'aero'], hl: ['round', 'slit'], fin: .4 }),
    // muscle
    gasser: X('muscle', { tilt: [-5.5, -3.5], rr: [22, 24], rf: [15, 17], clear: [3, 6], scoop: 1, hump: 1, flames: .4, wheels: ['steel', 'spoke'], roof: ['coupe'], tail: ['notch', 'box'], L: [250, 272] }),
    funnyCar: X('muscle', { rr: [27, 30], rf: [14, 16], L: [292, 314], wb: [.66, .7], aero: 1, aeroT: ['gt'], tail: ['duck', 'kamm'], nose: ['wedge'], clear: [-2, 0], stripes: .7, roundel: 1, scoop: 1, wbar: 1 }),
    proStreet: X('muscle', { rr: [26, 28], rf: [17, 19], clear: [-1, 1], hump: 1, scoop: 1, roofScoop: .5, flames: .3, wheels: ['mesh', 'spoke'], wbar: 1, tail: ['notch', 'fast'] }),
    muscleWagon: X('muscle', { roof: ['long'], tail: ['box', 'kamm'], roofLen: [96, 122], L: [276, 300] }),
    ponyCar: X('muscle', { L: [250, 270], tail: ['fast', 'duck'], hood: [.3, .36], louvers: .75, stripes: .85, hl: ['round', 'rect'] }),
    ratRod: { b: 'ratrod', L: [246, 272], rr: [22, 25], rf: [16, 18] },
    dragster: { b: 'dragster', L: [300, 318], rr: [30, 34], rf: [8, 9.5] },
    // super
    driftCar: X('fastbackGT', { L: [240, 262], flares: 1, aero: 1, aeroT: ['gt', 'wing'], drift: 1, clear: [-3, -1], hl: ['pop', 'rect'], wheels: ['mesh', 'split', 'spoke'], ex: ['side', 'center'] }),
    timeAttack: X('wedgeSuper', { aero: 1, aeroT: ['gt'], splitter: 1, canards: 1, flares: .7, roundel: 1, intake: 1 }),
    stanceCar: X('fastSedan', { clear: [-6, -4], rimF: [.74, .8], wheels: ['mesh', 'split', 'disc'], flares: .4, L: [240, 262], ex: ['quad'], doors4: 0 }),
    midTarga: X('wedgeSuper', { roof: ['targa'], curvy: [.3, .7], L: [236, 256], hl: ['pop'], louvers: .6 }),
    frontSuper: X('fastbackGT', { hood: [.42, .48], roofLen: [30, 40], intake: 1, aero: .5, nose: ['shark'], L: [272, 292], ex: ['quad', 'side'] }),
    trackToy: X('targaGT', { roof: ['open'], L: [218, 238], aero: 1, aeroT: ['wing', 'swan'], wheels: ['mesh', 'split'], curvy: [.4, .9], nose: ['wedge', 'shark'], splitter: 1 }),
    retroWedge: X('wedgeSuper', { curvy: [.04, .15], hl: ['pop'], louvers: 1, nose: ['wedge'], tail: ['kamm'], intake: 1, roof: ['coupe'] }),
    finSuper: X('curvySuper', { fin: 1, roof: ['bubble', 'coupe'], tail: ['long', 'fast'], canards: .5 }),
    // hyper
    longtail: X('hyperCanopy', { L: [298, 316], tail: ['long'], roof: ['coupe'], fin: .3, aero: .6, aeroT: ['wing'] }),
    lmpOpen: X('lemans', { roof: ['open'], fin: 1, skirt: 1, roundel: 1 }),
    sharkHyper: X('hyperCanopy', { nose: ['shark'], fin: 1, canards: 1, curvy: [.3, .8], aero: 1, aeroT: ['swan'] }),
    landSpeed: { b: 'landspeed', L: [300, 318], rr: [12, 13.5], rf: [12, 13.5] },
    indyCar: { b: 'indy', L: [276, 300], rr: [20, 22], rf: [18.5, 20] },
    jetCar: { b: 'jet', L: [284, 306], rr: [13, 15], rf: [11, 12.5] },
    kart: { b: 'kart', L: [150, 168], rr: [13, 14.5], rf: [12, 13] },
    // classic
    woodie: X('pontoon', { L: [270, 294], roof: ['long'], tail: ['box'], roofLen: [100, 130], wood: 1, curvy: [.8, 1.4], whitewall: .7, chrome: .7, nose: ['round', 'blunt'], twoTone: 0 }),
    artDeco: X('pontoon', { curvy: [2.6, 3.6], tail: ['boat'], skirt: 1, nose: ['bullet', 'round'], chrome: 1, L: [280, 304], hood: [.36, .42], twoTone: .6 }),
    townCar: X('limo', { L: [288, 306], vinyl: 1, opera: 1, chrome: 1, whitewall: .8, hood: [.32, .38] }),
    luxCoupe70: X('muscle', { L: [292, 312], hood: [.4, .46], vinyl: .85, opera: .85, chrome: 1, curvy: [.3, .7], nose: ['blunt'], tail: ['notch'], roof: ['coupe'], scoop: 0, stripes: 0, whitewall: .5 }),
    classicPickup: X('pickup', { curvy: [1.6, 2.4], twoTone: .6, chrome: .8, whitewall: .5, wheels: ['steel'], clear: [2, 5], nose: ['round'], lightbar: 0, offroad: 0, L: [262, 286] }),
    roadster30s: { b: 'roadster30', L: [270, 296], rr: [18, 20], rf: [18, 20] },
    gangster: { b: 'gangster', L: [274, 298], rr: [18, 20], rf: [18, 20] },
    // truck
    monsterTruck: X('pickup', { monster: [1.55, 1.75], bodyH: [32, 38], cabinH: [24, 29], clear: [1, 3], offroad: 1, lightbar: .8, roofLen: [44, 60] }),
    towTruck: X('pickup', { tow: 1, lightbar: 0, beacon: 1, L: [282, 304], offroad: 0 }),
    iceCream: X('van', { iceCream: 1, L: [256, 282], twoTone: 1, wheels: ['steel', 'disc'] }),
    trophyTruck: X('pickup', { L: [280, 300], clear: [16, 22], rr: [26, 28], rf: [26, 28], lightbar: 1, flares: 1, offroad: 1, cage: 1, nose: ['shark', 'blunt'] }),
    keiTruck: X('pickup', { L: [192, 212], rr: [14, 15.5], rf: [14, 15.5], hood: [.04, .08], rake: [.2, .4], cabinH: [30, 36], bodyH: [26, 30], roofLen: [30, 40], clear: [2, 4], lightbar: 0, offroad: 0, curvy: [.3, .7], hl: ['rect', 'round'] }),
    dually: X('pickup', { L: [298, 316], chrome: .5, rr: [23, 25], rf: [23, 25], flares: 1, dually: 1, lightbar: .2 }),
    boxTruck: { b: 'boxtruck', L: [292, 314], rr: [19, 21], rf: [19, 21] },
    cabOver: { b: 'cabover', L: [256, 280], rr: [21, 23], rf: [21, 23] }
  });
  const BY_CLASS = {
    hatch: ['hatch', 'rallyHatch', 'microcar', 'bubbleCar', 'cityCar', 'hotHatch', 'keiCar', 'retroHatch', 'tukTuk', 'liftback'],
    sedan: ['sedan', 'fastSedan', 'limo', 'shootingBrake', 'wagon', 'hearse', 'taxiCab', 'sleeper', 'executive', 'armored'],
    suv: ['boxySUV', 'crossover', 'offroader', 'van', 'coupeSUV', 'safari', 'sixWheeler', 'stretchSUV', 'minivan', 'camper'],
    ev: ['tearEV', 'cyberTruck', 'kammEV', 'solarCar', 'podCar', 'evSedan', 'evCrossover', 'evHyper', 'evVan', 'evRoadster'],
    gt: ['fastbackGT', 'targaGT', 'grandTourer', 'speedster', 'barchetta', 'boatTail', 'gullwing', 'retroGT', 'splitWindow', 'aeroCoupe'],
    muscle: ['muscle', 'hotrod', 'lowrider', 'gasser', 'ratRod', 'dragster', 'funnyCar', 'proStreet', 'muscleWagon', 'ponyCar'],
    super: ['wedgeSuper', 'curvySuper', 'driftCar', 'timeAttack', 'stanceCar', 'midTarga', 'frontSuper', 'trackToy', 'retroWedge', 'finSuper'],
    hyper: ['hyperCanopy', 'lemans', 'formula', 'landSpeed', 'longtail', 'indyCar', 'lmpOpen', 'jetCar', 'sharkHyper', 'kart'],
    classic: ['vintage', 'tailfin', 'pontoon', 'woodie', 'artDeco', 'roadster30s', 'townCar', 'luxCoupe70', 'classicPickup', 'gangster'],
    truck: ['pickup', 'buggy', 'monsterTruck', 'towTruck', 'boxTruck', 'cabOver', 'iceCream', 'trophyTruck', 'keiTruck', 'dually']
  };

  // ---------- shared parts ----------
  function wheel(x, yc, R, W, id) {
    // W: wheel style object
    let s = '<circle cx="' + f(x) + '" cy="' + f(yc) + '" r="' + f(R) + '" fill="#0b0b10"/>';
    if (W.tread) for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; s += '<rect x="' + f(x + Math.cos(a) * R - 1.6) + '" y="' + f(yc + Math.sin(a) * R - 1.6) + '" width="3.2" height="3.2" fill="#0b0b10" transform="rotate(' + (a * 57.3).toFixed(0) + ' ' + f(x + Math.cos(a) * R) + ' ' + f(yc + Math.sin(a) * R) + ')"/>'; }
    const rim = R * W.rimF;
    if (W.whitewall) s += '<circle cx="' + f(x) + '" cy="' + f(yc) + '" r="' + f(rim + (R - rim) * .45) + '" fill="none" stroke="#ececec" stroke-width="' + f((R - rim) * .45) + '"/>';
    s += '<circle cx="' + f(x) + '" cy="' + f(yc) + '" r="' + f(rim) + '" fill="url(#rd' + id + ')"/>';
    if (W.cal) s += '<path d="M' + f(x + rim * .25) + ',' + f(yc - rim * .78) + ' A' + f(rim * .82) + ',' + f(rim * .82) + ' 0 0 1 ' + f(x + rim * .82) + ',' + f(yc - rim * .1) + '" stroke="' + W.cal + '" stroke-width="' + f(rim * .22) + '" fill="none"/>';
    const st = W.style;
    if (st === 'disc' || st === 'aero') { s += '<circle cx="' + f(x) + '" cy="' + f(yc) + '" r="' + f(rim * .95) + '" fill="' + W.col + '" opacity=".95"/>'; if (st === 'aero') for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + .4; s += '<path d="M' + f(x + Math.cos(a) * rim * .3) + ',' + f(yc + Math.sin(a) * rim * .3) + ' Q' + f(x + Math.cos(a + .5) * rim * .7) + ',' + f(yc + Math.sin(a + .5) * rim * .7) + ' ' + f(x + Math.cos(a + .9) * rim * .9) + ',' + f(yc + Math.sin(a + .9) * rim * .9) + '" stroke="' + shade(W.col, -.35) + '" stroke-width="1.4" fill="none"/>'; } else s += '<circle cx="' + f(x) + '" cy="' + f(yc) + '" r="' + f(rim * .55) + '" fill="none" stroke="' + shade(W.col, -.3) + '" stroke-width="1.2"/>'; }
    else if (st === 'steel') { s += '<circle cx="' + f(x) + '" cy="' + f(yc) + '" r="' + f(rim * .9) + '" fill="' + W.col + '"/>'; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; s += '<circle cx="' + f(x + Math.cos(a) * rim * .55) + '" cy="' + f(yc + Math.sin(a) * rim * .55) + '" r="' + f(rim * .12) + '" fill="#15161c"/>'; } }
    else {
      const n = W.n, sw = st === 'wire' ? .035 : st === 'mesh' ? .06 : n <= 4 ? .22 : n <= 7 ? .14 : .08;
      const layers = st === 'mesh' ? 2 : 1;
      for (let L = 0; L < layers; L++) for (let k = 0; k < n; k++) {
        const a = k / n * Math.PI * 2 - Math.PI / 2 + L * Math.PI / n;
        if (st === 'split') { [-.12, .12].forEach(o => s += '<path d="M' + f(x + Math.cos(a) * rim * .2) + ',' + f(yc + Math.sin(a) * rim * .2) + ' L' + f(x + Math.cos(a + o) * rim * .92) + ',' + f(yc + Math.sin(a + o) * rim * .92) + '" stroke="' + W.col + '" stroke-width="' + f(rim * .09) + '" stroke-linecap="round"/>'); }
        else if (st === 'turbine') s += '<path d="M' + f(x + Math.cos(a) * rim * .2) + ',' + f(yc + Math.sin(a) * rim * .2) + ' Q' + f(x + Math.cos(a + .35) * rim * .6) + ',' + f(yc + Math.sin(a + .35) * rim * .6) + ' ' + f(x + Math.cos(a + .55) * rim * .93) + ',' + f(yc + Math.sin(a + .55) * rim * .93) + '" stroke="' + W.col + '" stroke-width="' + f(rim * .13) + '" fill="none" stroke-linecap="round"/>';
        else s += '<path d="M' + f(x) + ',' + f(yc) + ' L' + f(x + Math.cos(a) * rim * .93) + ',' + f(yc + Math.sin(a) * rim * .93) + '" stroke="' + W.col + '" stroke-width="' + f(rim * sw) + '" stroke-linecap="round"/>';
      }
      if (st !== 'wire') s += '<circle cx="' + f(x) + '" cy="' + f(yc) + '" r="' + f(rim * .93) + '" fill="none" stroke="' + W.col + '" stroke-width="' + f(rim * .07) + '"/>';
    }
    return s + '<circle cx="' + f(x) + '" cy="' + f(yc) + '" r="' + f(rim * .16) + '" fill="#2a2c36"/><circle cx="' + f(x - rim * .05) + '" cy="' + f(yc - rim * .05) + '" r="' + f(rim * .06) + '" fill="#9aa0b0"/>';
  }

  // ---------- the generic monocoque builder ----------
  function genBody(A, R2, RI2, pk, gauss, m) {
    const L = R2(A.L), x0 = 160 - L / 2 + R2(-3, 3), x1 = x0 + L;
    const rr = R2(A.rr), rf = A.rf ? Math.min(rr * 1.02, R2(A.rf)) : rr;
    const wb = L * R2(A.wb), oR = (L - wb) * R2(A.oR || [.4, .56]), xr = x0 + oR, xf = xr + wb;
    const xr2 = A.six ? xr - 2 * rr - R2(5, 9) : null;
    const GY = 130, clear = R2(A.clear || [0, 1.5]), sill = GY - Math.max(rr, rf) * R2([.6, .72]) - clear;
    const bodyH = R2(A.bodyH), slope = R2(A.slope || [0, 2]), beltR = sill - bodyH - slope, beltF = sill - bodyH + slope;
    const belt = x => lerp(beltR, beltF, (x - x0) / L);
    let cabinH = R2(A.cabinH); const roof = pk(A.roof), tail = pk(A.tail), nose = pk(A.nose);
    const roofY = Math.min(beltR, beltF) - cabinH;
    const ax = x1 - L * R2(A.hood), rfx = ax - cabinH * R2(A.rake);
    let rbx = Math.max(x0 + 8, rfx - R2(A.roofLen));
    const cv = R2(A.curvy || [.6, 1.4]), jit = R2([.8, 2.2]) * (A.roof.indexOf('open') >= 0 ? .6 : 1);
    const P = [], add = (x, y, r, nj) => P.push([x + (nj ? 0 : gauss() * jit), y + (nj ? 0 : gauss() * jit * .6), (r || 0) * cv]);
    const noseTop = belt(x1) + R2(A.noseDrop || [2, 8]);
    let cg = null; // rear glass base [x,y]
    // ---- tail ----
    const tRoofY = roof === 'open' ? Math.min(beltR, beltF) - R2(2, 6) : roofY;
    add(x0 + R2(4, 10), sill, 2, true);
    if (tail === 'box') { add(x0 + R2(-1, 2), sill - R2(4, 7), 4); add(x0 + R2(0, 4), tRoofY + R2(5, 9), 5); rbx = x0 + R2(4, 10); cg = [x0 + 6, belt(x0) - 2]; }
    else if (tail === 'bed') { const bt = belt(x0) - R2(0, 4), cab = Math.max(x0 + L * .32, rbx - R2(2, 6)); add(x0, sill - 5, 2); add(x0 - R2(0, 2), bt, 1.5); add(cab, bt, 1); add(cab + 1, tRoofY + R2(4, 8), 4); rbx = cab + R2(4, 8); cg = [cab + 3, belt(cab) - 2]; }
    else if (tail === 'notch') { const cbx = Math.max(x0 + L * .14, rbx - cabinH * R2(.7, 1.3)); add(x0, sill - R2(4, 7), 4); add(x0 + R2(0, 3), belt(x0) - R2(0, 4), 6); add(cbx, belt(cbx) - R2(1, 4), 6); cg = [cbx + 3, belt(cbx) - 2]; }
    else if (tail === 'fin') { const fl = R2(16, 30), cbx = Math.max(x0 + L * .2, rbx - cabinH * R2(.7, 1.2)); add(x0 + 2, sill - 6, 3); add(x0 - R2(2, 7), belt(x0) - R2(9, 18), 0); add(x0 + fl, belt(x0) + R2(-1, 2), 4); add(cbx, belt(cbx) - R2(1, 3), 6); cg = [cbx + 3, belt(cbx) - 2]; }
    else if (tail === 'boat') { add(x0 + L * .05, sill - 2, 6); add(x0, belt(x0) + R2(4, 10), 14); add(x0 + L * R2(.09, .15), belt(x0) - R2(1, 4), 16); const mx = lerp(x0 + L * .12, rbx, .5); add(mx, lerp(belt(x0), tRoofY, .55) - R2(0, 3), 22); cg = [mx, lerp(belt(x0), tRoofY, .55) + 4]; }
    else if (tail === 'long') { add(x0 + R2(0, 6), sill - R2(2, 4), 4); add(x0 - R2(0, 3), belt(x0) + R2(2, 6), 7); const mx = x0 + L * R2(.12, .2); add(mx, belt(mx) - R2(2, 6), 22); cg = [lerp(mx, rbx, .5), lerp(belt(mx), tRoofY, .5)]; }
    else if (tail === 'duck') { add(x0, sill - R2(4, 7), 4); add(x0 + R2(-1, 1), belt(x0) - R2(4, 8), 1.2); add(x0 + R2(8, 14), belt(x0) - R2(0, 3), 3); const mx = lerp(x0 + 12, rbx, .5); add(mx, lerp(belt(x0), tRoofY, .55) - R2(0, 3), 20); cg = [mx, lerp(belt(x0), tRoofY, .55) + 4]; }
    else if (tail === 'kamm') { add(x0 + R2(-1, 2), sill - R2(5, 8), 4); add(x0 + R2(0, 3), belt(x0) - R2(2, 8), 5); const mx = lerp(x0, rbx, R2(.35, .6)); add(mx, lerp(belt(x0) - 6, tRoofY, .6), 16); cg = [mx + 2, lerp(belt(x0) - 6, tRoofY, .6) + 4]; }
    else { add(x0, sill - R2(4, 7), 5); add(x0 + R2(2, 6), belt(x0) + R2(-2, 2), 6); const mx = lerp(x0, rbx, .55); add(mx, lerp(belt(x0), tRoofY, .58) - R2(1, 5), 28); cg = [mx, lerp(belt(x0), tRoofY, .58) + 3]; }
    // ---- roof ----
    let wsTop = null, glass = [], open = false, bubble = false, targa = false;
    if (roof === 'open') {
      open = true; const by = belt(rbx);
      add(rbx, by - R2(0, 2), 4, true); add(lerp(rbx, ax, .5), belt(lerp(rbx, ax, .5)) - R2(0, 1.5), 20, true);
      wsTop = [ax - R2(4, 9), belt(ax) - R2(11, 17)];
      wsTop.seat = [rbx + R2(6, 14), by]; wsTop.base = [ax, belt(ax)];
    } else if (roof === 'bubble') {
      bubble = true; const cy = roofY + R2(0, 4);
      add(rbx, cy + R2(4, 8), 14); add((rbx + rfx) / 2, cy - R2(2, 6), 26); add(rfx, cy + R2(3, 7), 14);
      glass.push([cg || [rbx, belt(rbx)], [rbx + 3, cy + 6], [(rbx + rfx) / 2, cy - 2], [rfx - 2, cy + 6], [ax - 2, belt(ax) - 1]]);
    } else {
      const ry = roof === 'high' ? roofY : roofY + R2(0, 2), cr = roof === 'high' ? 6 : roof === 'long' ? 10 : 14;
      add(rbx, ry, cr); if (rfx - rbx > 60) add((rbx + rfx) / 2 + R2(-10, 10), ry - R2(0, 3), 30); add(rfx, ry + R2(0, 2), cr);
      targa = roof === 'targa';
      const g0 = cg || [rbx + 2, belt(rbx) - 1];
      glass.push([[g0[0], Math.max(g0[1], belt(g0[0]) - 2)], [rbx + 3, ry + 3], [rfx - 2, ry + 3], [ax - 2, belt(ax) - 1]]);
    }
    add(ax, belt(ax) + R2(-1, 2), 4);
    // ---- hood & nose ----
    add(lerp(ax, x1, R2(.4, .6)), noseTop - (A.hump ? R2(5, 9) : R2(0, A.scoop ? 1 : 3)), A.hump ? 12 : 30);
    if (nose === 'wedge') { add(x1 - R2(2, 6), noseTop + R2(2, 5), 3); add(x1 + R2(0, 3), lerp(noseTop, sill, .62), 1.2); add(x1 - R2(2, 5), sill - 1, 2); }
    else if (nose === 'blunt') { add(x1, noseTop - R2(0, 2), 3); add(x1 + R2(0, 2), sill - 4, 3); }
    else if (nose === 'round') { add(x1, noseTop + 2, 14); add(x1, sill - 3, 10); }
    else if (nose === 'shark') { add(x1 + R2(2, 5), noseTop + R2(1, 3), 2); add(x1 - R2(1, 4), sill - 2, 4); }
    else { add(x1 + R2(0, 3), lerp(noseTop, sill, .5), 22); }
    add(x1 - R2(4, 9), sill, 2, true);
    // ---- bottom with arches ----
    const gap = R2(1.5, 4), arF = rf + gap, arR = rr + gap, ycF = GY - rf, ycR = GY - rr;
    const archTop = (xc, ar, yc) => yc - Math.sqrt(Math.max(0, ar * ar - (sill - yc) * (sill - yc)));
    let d = rounded(P);
    const axles = [[xf, arF, ycF], [xr, arR, ycR]].concat(xr2 ? [[xr2, arR, ycR]] : []);
    axles.forEach(a => { const dx = Math.sqrt(Math.max(1, a[1] * a[1] - (sill - a[2]) * (sill - a[2]))); d += ' L' + f(a[0] + dx) + ',' + f(sill) + ' A' + f(a[1]) + ',' + f(a[1]) + ' 0 ' + (sill > a[2] ? 1 : 0) + ' 0 ' + f(a[0] - dx) + ',' + f(sill); });
    d += ' Z';
    return { L, x0, x1, xr, xf, xr2, rr, rf, GY, ycF, ycR, sill, belt, beltR, beltF, roofY, ax, rfx, rbx, noseTop, nose, tail, roof, d, glass, open, bubble, targa, wsTop, cg, cv, arF, arR, archTop };
  }

  // ---------- special builders ----------
  function special(kind, A, R2, RI2, pk, gauss, col, id) {
    const r2 = () => R2(0, 1);
    const L = R2(A.L), x0 = 160 - L / 2, x1 = x0 + L, GY = 130;
    const rr = R2(A.rr), rf = R2(A.rf), dark = shade(col, -.55), light = shade(col, .35);
    let body = '', under = '', over = '', wheels = [];
    if (kind === 'formula') {
      const xr = x0 + L * R2(.1, .14), xf = x1 - L * R2(.17, .22), y = GY - rr * R2(.75, .9);
      const nose = 'M' + f(x1) + ',' + f(GY - 12) + ' Q' + f(x1 - 30) + ',' + f(GY - 22) + ' ' + f(xf - 10) + ',' + f(y - 6) + ' L' + f(x0 + L * .5) + ',' + f(y - R2(14, 20)) + ' Q' + f(x0 + L * .42) + ',' + f(y - R2(30, 38)) + ' ' + f(x0 + L * .35) + ',' + f(y - R2(16, 22)) + ' L' + f(xr + 6) + ',' + f(y - 10) + ' L' + f(x0 + 4) + ',' + f(y - 6) + ' L' + f(x0 + 4) + ',' + f(GY - 10) + ' L' + f(x1 - 6) + ',' + f(GY - 8) + ' Z';
      body = '<path d="' + nose + '" fill="url(#bb' + id + ')" stroke="' + dark + '" stroke-width="1"/>';
      body += '<path d="M' + f(x0 + L * .38) + ',' + f(y - 8) + ' Q' + f(x0 + L * .5) + ',' + f(y - 2) + ' ' + f(xf - 30) + ',' + f(y - 4) + '" stroke="' + light + '" stroke-width="1.2" fill="none"/>';
      body += '<circle cx="' + f(x0 + L * .53) + '" cy="' + f(y - R2(18, 22)) + '" r="6.5" fill="' + pk(['#f4f4f4', '#ffc21a', '#2f6bff', '#16181f']) + '"/><path d="M' + f(x0 + L * .53 - 1) + ',' + f(y - 21) + ' l7,0" stroke="#111" stroke-width="2.5"/>';
      body += '<path d="M' + f(x0 + L * .45) + ',' + f(y - 22) + ' Q' + f(x0 + L * .55) + ',' + f(y - 34) + ' ' + f(x0 + L * .62) + ',' + f(y - 16) + '" stroke="#1d1f28" stroke-width="2.6" fill="none"/>';
      over = '<path d="M' + f(x1 - 30) + ',' + f(GY - 6) + ' L' + f(x1 + 4) + ',' + f(GY - 6) + ' L' + f(x1 + 4) + ',' + f(GY - 12) + ' L' + f(x1 - 24) + ',' + f(GY - 10) + ' Z" fill="' + dark + '"/>' +
        '<path d="M' + f(x0 + 6) + ',' + f(y - 10) + ' L' + f(x0 + 2) + ',' + f(y - 40) + ' M' + f(x0 + 16) + ',' + f(y - 10) + ' L' + f(x0 + 14) + ',' + f(y - 40) + '" stroke="#15151c" stroke-width="2.5"/><path d="M' + f(x0 - 8) + ',' + f(y - 46) + ' L' + f(x0 + 30) + ',' + f(y - 48) + ' L' + f(x0 + 30) + ',' + f(y - 40) + ' L' + f(x0 - 8) + ',' + f(y - 39) + ' Z" fill="' + dark + '"/>';
      wheels = [[xr, rr], [xf, rf]];
      return { body, under, over, wheels, x0, x1, GY, exposed: true, tread: false };
    }
    if (kind === 'buggy') {
      const xr = x0 + L * R2(.2, .26), xf = x1 - L * R2(.18, .24), sy = GY - rr * .7;
      body = '<path d="M' + f(x0 + 6) + ',' + f(sy) + ' L' + f(x0 + 2) + ',' + f(sy - 18) + ' L' + f(xf - 20) + ',' + f(sy - 14) + ' L' + f(x1 - 6) + ',' + f(sy - 8) + ' L' + f(x1) + ',' + f(sy + 2) + ' Z" fill="url(#bb' + id + ')" stroke="' + dark + '"/>';
      const cg = '#1c1e26';
      body += '<path d="M' + f(x0 + 16) + ',' + f(sy - 16) + ' L' + f(x0 + 30) + ',' + f(sy - 62) + ' L' + f(xf - 50) + ',' + f(sy - 62) + ' L' + f(xf - 26) + ',' + f(sy - 14) + ' M' + f(x0 + 30) + ',' + f(sy - 62) + ' L' + f(x0 + L * .45) + ',' + f(sy - 16) + ' M' + f(xf - 50) + ',' + f(sy - 62) + ' L' + f(x0 + L * .45) + ',' + f(sy - 16) + '" stroke="' + cg + '" stroke-width="3.2" fill="none" stroke-linejoin="round"/>';
      body += '<path d="M' + f(x0 + L * .38) + ',' + f(sy - 16) + ' L' + f(x0 + L * .4) + ',' + f(sy - 40) + ' L' + f(x0 + L * .47) + ',' + f(sy - 40) + '" stroke="#2a2c36" stroke-width="5" fill="none"/>';
      body += '<rect x="' + f(x0 + 4) + '" y="' + f(sy - 30) + '" width="22" height="14" rx="3" fill="#3a3d48"/><path d="M' + f(x1 - 4) + ',' + f(sy - 12) + ' L' + f(x1 + 6) + ',' + f(sy - 12) + ' L' + f(x1 + 6) + ',' + f(sy + 4) + '" stroke="' + cg + '" stroke-width="3" fill="none"/>';
      wheels = [[xr, rr], [xf, rf]];
      return { body, under, over, wheels, x0, x1, GY, exposed: true, tread: true };
    }
    if (kind === 'vintage') {
      const xr = x0 + L * R2(.15, .19), xf = x1 - L * R2(.2, .25), sill = GY - rr * R2(.45, .6), hoodY = sill - R2(28, 34), roofY = sill - R2(62, 74);
      const cabX0 = xr - R2(6, 14), cabX1 = lerp(xr, xf, R2(.42, .55));
      // tub + cabin
      body += '<path d="M' + f(x0 + 8) + ',' + f(sill - 4) + ' Q' + f(x0 + 2) + ',' + f(hoodY + 10) + ' ' + f(x0 + 14) + ',' + f(hoodY + 2) + ' L' + f(cabX0) + ',' + f(hoodY) + ' L' + f(cabX0 + 2) + ',' + f(roofY + 6) + ' Q' + f(cabX0 + 3) + ',' + f(roofY) + ' ' + f(cabX0 + 12) + ',' + f(roofY) + ' L' + f(cabX1 - 6) + ',' + f(roofY) + ' L' + f(cabX1 + R2(3, 8)) + ',' + f(hoodY) + ' L' + f(x1 - 12) + ',' + f(hoodY + R2(0, 3)) + ' L' + f(x1 - 10) + ',' + f(sill - 4) + ' Z" fill="url(#bb' + id + ')" stroke="' + dark + '"/>';
      const tt = r2() < .5;
      if (tt) body += '<path d="M' + f(cabX0 + 1) + ',' + f(roofY + 1) + ' L' + f(cabX1 - 6) + ',' + f(roofY + 1) + ' L' + f(cabX1 - 4) + ',' + f(roofY + 8) + ' L' + f(cabX0 + 2) + ',' + f(roofY + 8) + ' Z" fill="#16181f"/>';
      body += '<path d="M' + f(cabX0 + 7) + ',' + f(hoodY - 2) + ' L' + f(cabX0 + 8) + ',' + f(roofY + 9) + ' L' + f(cabX1 - 7) + ',' + f(roofY + 9) + ' L' + f(cabX1 - 1) + ',' + f(hoodY - 2) + ' Z" fill="url(#gl' + id + ')"/><path d="M' + f((cabX0 + cabX1) / 2) + ',' + f(hoodY - 2) + ' L' + f((cabX0 + cabX1) / 2) + ',' + f(roofY + 9) + '" stroke="' + dark + '" stroke-width="3"/>';
      for (let k = 0; k < RI2(4, 9); k++) body += '<path d="M' + f(cabX1 + 14 + k * 6) + ',' + f(hoodY + 6) + ' l0,9" stroke="' + dark + '" stroke-width="1.4"/>';
      body += '<rect x="' + f(x1 - 13) + '" y="' + f(hoodY - 3) + '" width="7" height="' + f(sill - hoodY - 2) + '" rx="2" fill="#d8dbe6"/>';
      body += '<path d="M' + f(cabX0) + ',' + f(hoodY + 12) + ' L' + f(x1 - 14) + ',' + f(hoodY + 13) + '" stroke="' + light + '" stroke-width="1.2" opacity=".6"/>';
      // fenders (over the wheels) + running board
      const fr = 'M' + f(xr - rr - 6) + ',' + f(sill + 1) + ' Q' + f(xr - rr - 5) + ',' + f(GY - rr * 2 - 8) + ' ' + f(xr + 2) + ',' + f(GY - rr * 2 - 6) + ' Q' + f(xr + rr + 8) + ',' + f(GY - rr * 2 + 2) + ' ' + f(xr + rr + 10) + ',' + f(sill + 1) + ' Z';
      const ff = 'M' + f(xf - rf - R2(22, 34)) + ',' + f(sill + 2) + ' Q' + f(xf - rf - 4) + ',' + f(sill - 2) + ' ' + f(xf - rf + 2) + ',' + f(GY - rf * 1.7) + ' Q' + f(xf - 4) + ',' + f(GY - rf * 2 - 10) + ' ' + f(xf + rf * .6) + ',' + f(GY - rf * 2 - 4) + ' Q' + f(xf + rf + 10) + ',' + f(GY - rf * 1.6) + ' ' + f(xf + rf + 12) + ',' + f(GY - rf * .7) + ' L' + f(xf + rf + 4) + ',' + f(GY - rf * .75) + ' Q' + f(xf + rf) + ',' + f(GY - rf * 1.8) + ' ' + f(xf) + ',' + f(GY - rf * 1.95) + ' Q' + f(xf - rf) + ',' + f(GY - rf * 1.6) + ' ' + f(xf - rf - 6) + ',' + f(sill + 2) + ' Z';
      over += '<path d="' + fr + '" fill="url(#bb' + id + ')" stroke="' + dark + '"/><path d="' + ff + '" fill="url(#bb' + id + ')" stroke="' + dark + '"/>';
      over += '<rect x="' + f(xr + rr + 8) + '" y="' + f(sill) + '" width="' + f(xf - rf - R2(22, 30) - xr - rr - 6) + '" height="4" rx="1.5" fill="#16181f"/>';
      over += '<path d="M' + f(x1 - 4) + ',' + f(hoodY + 2) + ' l0,-6" stroke="#9aa0b0" stroke-width="1.6"/><circle cx="' + f(x1 - 2) + '" cy="' + f(hoodY - 7) + '" r="5" fill="#f1f8ff" stroke="#c9d2e0" stroke-width="1.5"/>';
      if (r2() < .6) over += '<circle cx="' + f(x0 + 4) + '" cy="' + f(hoodY + 12) + '" r="' + f(rr * .7) + '" fill="#111" stroke="' + light + '" stroke-width="2.5"/><circle cx="' + f(x0 + 4) + '" cy="' + f(hoodY + 12) + '" r="' + f(rr * .35) + '" fill="#d8dbe6"/>';
      wheels = [[xr, rr], [xf, rf]];
      return { body, under, over, wheels, x0, x1, GY, exposed: true, tread: false, whitewall: true };
    }
    if (kind === 'hotrod') {
      const xr = x0 + L * R2(.15, .2), xf = x1 - L * R2(.08, .12), sy = GY - rr * .8, roofY = sy - R2(44, 52), cab1 = x0 + L * R2(.5, .56);
      body += '<path d="M' + f(x0 + 4) + ',' + f(sy) + ' Q' + f(x0) + ',' + f(sy - 20) + ' ' + f(x0 + 14) + ',' + f(sy - 30) + ' L' + f(x0 + 26) + ',' + f(roofY + 6) + ' Q' + f(x0 + 30) + ',' + f(roofY) + ' ' + f(x0 + 40) + ',' + f(roofY) + ' L' + f(cab1 - 10) + ',' + f(roofY) + ' L' + f(cab1) + ',' + f(sy - 30) + ' L' + f(x1 - 20) + ',' + f(sy - 24) + ' L' + f(x1 - 16) + ',' + f(sy - 6) + ' L' + f(x0 + 4) + ',' + f(sy) + ' Z" fill="url(#bb' + id + ')" stroke="' + dark + '"/>';
      body += '<path d="M' + f(x0 + 30) + ',' + f(sy - 30) + ' L' + f(x0 + 34) + ',' + f(roofY + 5) + ' L' + f(cab1 - 12) + ',' + f(roofY + 5) + ' L' + f(cab1 - 4) + ',' + f(sy - 30) + ' Z" fill="url(#gl' + id + ')"/>';
      // exposed engine with blower and stacks
      const ex = cab1 + 6, ew = x1 - 26 - ex;
      body += '<rect x="' + f(ex) + '" y="' + f(sy - 44) + '" width="' + f(ew) + '" height="18" rx="3" fill="#8a8f9c"/><rect x="' + f(ex + 4) + '" y="' + f(sy - 54) + '" width="' + f(ew - 8) + '" height="10" rx="2" fill="#c9ced9"/>';
      for (let k = 0; k < 4; k++) body += '<rect x="' + f(ex + 6 + k * (ew - 12) / 4) + '" y="' + f(sy - 64) + '" width="5" height="10" fill="#d8dbe6"/>';
      if (rf < 17) body += '<path d="M' + f(x0 + 40) + ',' + f(sy - 6) + ' Q' + f(x0 + 70) + ',' + f(sy - 30) + ' ' + f(x0 + 100) + ',' + f(sy - 10) + ' Q' + f(x0 + 120) + ',' + f(sy - 26) + ' ' + f(cab1) + ',' + f(sy - 8) + '" stroke="#ff7a1a" stroke-width="5" fill="none" opacity=".9"/>';
      body += '<path d="M' + f(x1 - 16) + ',' + f(sy - 6) + ' L' + f(x1) + ',' + f(sy - 4) + '" stroke="#d8dbe6" stroke-width="3"/>';
      wheels = [[xr, rr], [xf, rf]];
      return { body, under, over, wheels, x0, x1, GY, exposed: true, tread: false };
    }
    if (kind === 'bubble') {
      const cx = 160 + R2(-6, 6), w = L / 2, top = GY - R2(76, 92), xr = cx - w * R2(.45, .55), xf = cx + w * R2(.45, .6);
      body = '<path d="M' + f(cx - w) + ',' + f(GY - rr * .7) + ' Q' + f(cx - w - 6) + ',' + f(top + 10) + ' ' + f(cx - w * .2) + ',' + f(top) + ' Q' + f(cx + w * .9) + ',' + f(top + 2) + ' ' + f(cx + w + 4) + ',' + f(GY - rr * 1.2) + ' L' + f(cx + w) + ',' + f(GY - rr * .7) + ' Z" fill="url(#bb' + id + ')" stroke="' + dark + '"/>';
      body += '<path d="M' + f(cx - w * .55) + ',' + f(top + 26) + ' Q' + f(cx - w * .2) + ',' + f(top + 6) + ' ' + f(cx + w * .55) + ',' + f(top + 18) + ' L' + f(cx + w * .65) + ',' + f(top + 34) + ' L' + f(cx - w * .55) + ',' + f(top + 34) + ' Z" fill="url(#gl' + id + ')"/>';
      body += '<circle cx="' + f(cx + w * .9) + '" cy="' + f(GY - rr * 1.8) + '" r="4" fill="#f1f8ff"/><path d="M' + f(cx - w * .6) + ',' + f(top + 40) + ' Q' + f(cx) + ',' + f(top + 44) + ' ' + f(cx + w * .8) + ',' + f(top + 40) + '" stroke="' + light + '" stroke-width="1.2" fill="none"/>';
      wheels = [[xr, rr], [xf, rf]];
      return { body, under, over, wheels, x0: cx - w, x1: cx + w, GY, exposed: false, tread: false };
    }
    // cyber truck: faceted wedge
    const xr = x0 + L * R2(.18, .22), xf = x1 - L * R2(.2, .24), sill = GY - rr * .55 - R2(6, 10), peak = x0 + L * R2(.5, .6), pY = sill - R2(70, 82);
    const arF = rf + 3, arR = rr + 3;
    const d = 'M' + f(x0) + ',' + f(sill) + ' L' + f(x0 - 2) + ',' + f(sill - R2(34, 42)) + ' L' + f(peak) + ',' + f(pY) + ' L' + f(x1 + 2) + ',' + f(sill - R2(34, 42)) + ' L' + f(x1) + ',' + f(sill) + ' L' + f(xf + arF) + ',' + f(sill) + ' L' + f(xf + arF * .7) + ',' + f(sill - arF * 1.1) + ' L' + f(xf - arF * .7) + ',' + f(sill - arF * 1.1) + ' L' + f(xf - arF) + ',' + f(sill) + ' L' + f(xr + arR) + ',' + f(sill) + ' L' + f(xr + arR * .7) + ',' + f(sill - arR * 1.1) + ' L' + f(xr - arR * .7) + ',' + f(sill - arR * 1.1) + ' L' + f(xr - arR) + ',' + f(sill) + ' Z';
    body = '<path d="' + d + '" fill="url(#bb' + id + ')" stroke="' + dark + '"/><path d="M' + f(peak - L * .22) + ',' + f(lerp(sill - 38, pY, .55) + 4) + ' L' + f(peak) + ',' + f(pY + 6) + ' L' + f(peak + L * .2) + ',' + f(lerp(sill - 38, pY, .5) + 6) + ' L' + f(peak + L * .2) + ',' + f(sill - 36) + ' L' + f(peak - L * .22) + ',' + f(sill - 38) + ' Z" fill="url(#gl' + id + ')"/>' +
      '<path d="M' + f(x1 - 40) + ',' + f(sill - 37) + ' L' + f(x1 + 2) + ',' + f(sill - 38) + '" stroke="#f1f8ff" stroke-width="2"/><path d="M' + f(x0 - 2) + ',' + f(sill - 36) + ' L' + f(x0 + 40) + ',' + f(sill - 34) + '" stroke="#ff2a3d" stroke-width="2"/>';
    wheels = [[xr, rr], [xf, rf]];
    return { body, under, over, wheels, x0, x1, GY, exposed: false, tread: R2(0, 1) < .5 };
  }

  // ---------- v6 special builders (13 new hand-built body types) ----------
  function special2(kind, A, R2, RI2, pk, col, id) {
    const GY = 130, L = R2(A.L), x0 = 160 - L / 2, x1 = x0 + L, rr = R2(A.rr), rf = R2(A.rf);
    const BB = 'url(#bb' + id + ')', GL = 'url(#gl' + id + ')', dark = shade(col, -.55), light = shade(col, .35);
    const P = pts => 'M' + pts.map(p => f(p[0]) + ',' + f(p[1])).join(' L') + ' Z';
    const RP = pts => rounded(pts) + ' Z';
    const pa = (d, fill, ex) => '<path d="' + d + '" fill="' + fill + '"' + (ex || '') + '/>';
    const SK = ' stroke="' + dark + '" stroke-width="1"';
    const ln = (pts, c, w, ex) => '<path d="M' + pts.map(p => f(p[0]) + ',' + f(p[1])).join(' L') + '" stroke="' + c + '" stroke-width="' + w + '" fill="none" stroke-linecap="round" stroke-linejoin="round"' + (ex || '') + '/>';
    const qb = (a, c, b, t) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
    // thick-stroke separate fenders (classic cars)
    const fender = (d, w) => '<path d="' + d + '" stroke="' + shade(col, -.7) + '" stroke-width="' + f(w + 2) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="' + d + '" stroke="' + col + '" stroke-width="' + f(w) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="' + d + '" stroke="' + light + '" stroke-width="1.2" fill="none" opacity=".55" transform="translate(0,-' + f(w * .28) + ')"/>';
    let body = '', under = '', over = '', wheels;
    const out = (o) => Object.assign({ body, under, over, wheels, x0, x1, GY, exposed: true, tread: false }, o || {});

    if (kind === 'tuk') {
      const xr = x0 + L * R2(.2, .25), xf = x1 - L * R2(.1, .13), fl = GY - rr * 1.15, top = fl - R2(64, 72), tubX = x0 + L * R2(.56, .62);
      const canC = pk(['#16181f', '#e8e2d4', '#1f6b3a', '#2a3f8a']);
      body += pa(RP([[x0 + 4, top + 10, 0], [x0 - 4, top + 2, 5], [x1 - L * .16, top - 2, 7], [x1 - L * .07, top + 10, 0]]), canC, ' stroke="#0b0c12" stroke-width=".8"');
      body += '<rect x="' + f(x0 - 2) + '" y="' + f(top + 7) + '" width="' + f(L * .9) + '" height="3" fill="' + pk(['#ffc21a', '#ff3355', '#1fd38c', '#ffffff']) + '"/>';
      body += ln([[x0 + 2, top + 10], [x0 + 4, fl - 26]], '#2a2c36', 2.4) + ln([[tubX - 4, top + 10], [tubX - 4, fl - 28]], '#2a2c36', 2.4);
      body += '<rect x="' + f(x0 + 8) + '" y="' + f(fl - 48) + '" width="' + f(tubX - x0 - 22) + '" height="22" rx="5" fill="' + pk(['#2a2228', '#4a1f24', '#1d2a3a']) + '"/>';
      body += pa(RP([[x0 + 8, fl + 6, 0], [x0, fl - 4, 7], [x0 + 2, fl - 28, 5], [tubX, fl - 30, 4], [tubX + 2, fl + 6, 0]]), BB, SK);
      body += pa(RP([[tubX - 2, fl + 4, 0], [tubX, fl - 9, 4], [xf - rf - 2, fl - 11, 8], [x1 - 4, fl - 44, 4], [x1 - 15, fl - 50, 0], [xf - rf - 10, fl - 24, 8], [tubX + 10, fl - 14, 0]]), BB, SK);
      body += pa(P([[x1 - 15, fl - 50], [x1 - L * .1, top + 10], [x1 - L * .1 - 8, top + 10], [x1 - 22, fl - 48]]), GL);
      body += ln([[tubX + 6, fl - 34], [tubX + 18, fl - 38], [tubX + 22, fl - 32]], '#2a2c36', 2.2);
      body += '<circle cx="' + f(x1 - 6) + '" cy="' + f(fl - 34) + '" r="4.2" fill="#eaf6ff" stroke="#c9d2e0"/><rect x="' + f(x0 - 1) + '" y="' + f(fl - 18) + '" width="4" height="7" fill="#ff2a3d"/>';
      body += '<path d="M' + f(x0 + 6) + ',' + f(fl - 14) + ' L' + f(tubX - 4) + ',' + f(fl - 15) + '" stroke="' + light + '" stroke-width="1.2" opacity=".6"/>';
      over = '<path d="M' + f(xf - rf - 3) + ',' + f(GY - rf) + ' A' + f(rf + 3) + ',' + f(rf + 3) + ' 0 0 1 ' + f(xf + rf + 3) + ',' + f(GY - rf) + '" stroke="' + dark + '" stroke-width="3" fill="none"/>';
      wheels = [[xr, rr], [xf, rf]];
      return out();
    }
    if (kind === 'solar') {
      const xr = x0 + L * R2(.18, .22), xf = x1 - L * R2(.18, .22), top = GY - R2(50, 58), bot = GY - 12;
      const a0 = [x0, bot - 6], c0 = [x0 + L * .25, top - 2], m0 = [x0 + L * .55, top], c1 = [x1 - L * .1, top + 4], a1 = [x1, bot - 4];
      const d = 'M' + f(a0[0]) + ',' + f(a0[1]) + ' Q' + f(c0[0]) + ',' + f(c0[1]) + ' ' + f(m0[0]) + ',' + f(m0[1]) + ' Q' + f(c1[0]) + ',' + f(c1[1]) + ' ' + f(a1[0]) + ',' + f(a1[1]) + ' Q' + f(x1) + ',' + f(bot) + ' ' + f(x1 - 10) + ',' + f(bot) + ' L' + f(x0 + 8) + ',' + f(bot) + ' Q' + f(x0) + ',' + f(bot) + ' ' + f(a0[0]) + ',' + f(a0[1]) + ' Z';
      const pts = []; for (let i = 0; i <= 12; i++) pts.push(qb(a0, c0, m0, i / 12)); for (let i = 1; i <= 12; i++) pts.push(qb(m0, c1, a1, i / 12));
      const band = pts.slice(2, -2), th = R2(8, 11);
      body = '<ellipse cx="' + f(x0 + L * R2(.5, .62)) + '" cy="' + f(top + 2) + '" rx="' + f(R2(18, 22)) + '" ry="' + f(R2(11, 13)) + '" fill="' + GL + '" stroke="#0b0c12" stroke-width=".8"/>';
      over = pa(d, BB, SK) + pa('M' + band.map(p => f(p[0]) + ',' + f(p[1] + 1)).join(' L') + ' L' + band.slice().reverse().map(p => f(p[0]) + ',' + f(p[1] + 1 + th)).join(' L') + ' Z', '#0d1a44');
      band.forEach((p, i) => { if (i % 2) over += '<path d="M' + f(p[0]) + ',' + f(p[1] + 1) + ' l0,' + f(th) + '" stroke="#3a5cb0" stroke-width=".8"/>'; });
      over += '<path d="M' + f(x0 + 14) + ',' + f(bot - 4) + ' L' + f(x1 - 16) + ',' + f(bot - 4) + '" stroke="' + pk(['#ffc21a', '#ffffff', '#ff3355']) + '" stroke-width="2.2"/>';
      over += '<circle cx="' + f(x1 - 6) + '" cy="' + f(bot - 8) + '" r="2" fill="#eaf6ff"/>';
      wheels = [[xr, rr], [xf, rf]];
      return out({ exposed: false });
    }
    if (kind === 'pod') {
      const top = GY - R2(84, 96), bot = GY - 11, xr = x0 + L * R2(.17, .21), xf = x1 - L * R2(.17, .21);
      body = pa(RP([[x0 + 30, bot, 0], [x0, bot - 2, 12], [x0 + 2, top, 26], [x1 - 2, top, 26], [x1, bot - 2, 12], [x1 - 30, bot, 0]]), BB, SK);
      body += '<rect x="' + f(x0 + 2) + '" y="' + f(bot - 16) + '" width="' + f(L - 4) + '" height="10" fill="#16181f" opacity=".85"/>';
      body += pa(RP([[x0 + 10, GY - 42, 0], [x0 + 10, top + 9, 16], [x1 - 10, top + 9, 16], [x1 - 10, GY - 42, 0]]), GL);
      body += '<path d="M160,' + f(top + 9) + ' L160,' + f(bot - 6) + '" stroke="' + dark + '" stroke-width="1.6"/><rect x="' + f(x1 - 4) + '" y="' + f(GY - 46) + '" width="3" height="16" rx="1.5" fill="#eaf6ff"/><rect x="' + f(x0 + 1) + '" y="' + f(GY - 46) + '" width="3" height="16" rx="1.5" fill="#ff2a3d"/>';
      body += '<rect x="148" y="' + f(top - 6) + '" width="24" height="6" rx="3" fill="#1d1f28"/><ellipse cx="160" cy="' + f(top - 7) + '" rx="6" ry="3" fill="#2a2c36"/>';
      body += '<circle cx="' + f(xr) + '" cy="' + f(GY - rr) + '" r="' + f(rr + 3) + '" fill="#07080d"/><circle cx="' + f(xf) + '" cy="' + f(GY - rf) + '" r="' + f(rf + 3) + '" fill="#07080d"/>';
      wheels = [[xr, rr], [xf, rf]];
      return out({ exposed: false });
    }
    if (kind === 'ratrod') {
      const xr = x0 + L * R2(.14, .18), xf = x1 - L * R2(.08, .12), sy = GY - rr * .58, roofY = sy - R2(32, 38), cab0 = x0 + L * R2(.26, .32), cab1 = x0 + L * R2(.5, .55);
      body += ln([[x0, sy + 2], [x1 - 4, sy + 1]], '#1b1c22', 5);
      body += pa(P([[x0 + 4, sy], [x0 + 2, sy - 18], [cab0, sy - 18], [cab0, sy]]), BB, SK);
      body += pa(RP([[cab0 - 2, sy, 0], [cab0 - 2, roofY, 4], [cab1 - 8, roofY, 4], [cab1 + 4, sy - 26, 3], [cab1 + 4, sy, 0]]), BB, SK);
      body += pa(P([[cab0 + 4, roofY + 5], [cab1 - 10, roofY + 5], [cab1 - 6, roofY + 12], [cab0 + 4, roofY + 12]]), GL);
      // patina / primer patches
      for (let k = 0; k < RI2(4, 8); k++) body += '<ellipse cx="' + f(R2(x0 + 8, cab1)) + '" cy="' + f(R2(roofY + 8, sy - 4)) + '" rx="' + f(R2(4, 12)) + '" ry="' + f(R2(3, 7)) + '" fill="' + pk(['#7a4a2a', '#5a5f66', '#8a5a32']) + '" opacity=".55"/>';
      const ex = cab1 + 8, ew = x1 - 24 - ex;
      body += '<rect x="' + f(ex) + '" y="' + f(sy - 28) + '" width="' + f(ew) + '" height="20" rx="3" fill="#3a3d48"/><ellipse cx="' + f(ex + ew / 2) + '" cy="' + f(sy - 32) + '" rx="' + f(ew * .38) + '" ry="5" fill="#c9ced9"/>';
      for (let k = 0; k < 3; k++) body += ln([[ex + 6 + k * 7, sy - 12], [ex + 2 + k * 6, sy - 2], [cab1 - 6 - k * 4, sy + 3]], '#a0522d', 2.4);
      body += '<rect x="' + f(x1 - 24) + '" y="' + f(sy - 34) + '" width="9" height="30" rx="2" fill="#c9ced9"/>';
      for (let k = 0; k < 5; k++) body += '<path d="M' + f(x1 - 24) + ',' + f(sy - 30 + k * 6) + ' l9,0" stroke="#5a5f6e" stroke-width="1.2"/>';
      body += ln([[xf - 6, GY - rf], [x1 - 12, sy + 3]], '#2a2c36', 3);
      wheels = [[xr, rr], [xf, rf]];
      return out();
    }
    if (kind === 'dragster') {
      const xr = x0 + rr + 4, xf = x1 - 14, ry = GY - rr;
      body = pa(P([[xr - 12, ry - 9], [xr + 34, ry - 12], [x1 - 6, GY - 17], [x1 + 3, GY - 13], [x1 - 6, GY - 9], [xr + 34, ry + 4], [xr - 12, ry + 8]]), BB, SK);
      body += '<path d="M' + f(xr + 40) + ',' + f(ry - 6) + ' L' + f(x1 - 12) + ',' + f(GY - 14) + '" stroke="' + light + '" stroke-width="1.2"/>';
      body += '<rect x="' + f(xr + 2) + '" y="' + f(ry - 30) + '" width="36" height="20" rx="3" fill="#3a3d48"/><rect x="' + f(xr + 6) + '" y="' + f(ry - 41) + '" width="28" height="11" rx="2" fill="#c9ced9"/><path d="M' + f(xr + 12) + ',' + f(ry - 41) + ' L' + f(xr + 18) + ',' + f(ry - 52) + ' L' + f(xr + 30) + ',' + f(ry - 50) + ' L' + f(xr + 30) + ',' + f(ry - 41) + ' Z" fill="#9aa0b0"/>';
      for (let k = 0; k < 4; k++) body += ln([[xr + 6 + k * 8, ry - 12], [xr + 2 + k * 8, ry - 22]], '#d8dbe6', 2.6);
      const ck = xr + 50;
      body += '<circle cx="' + f(ck) + '" cy="' + f(ry - 20) + '" r="7" fill="' + pk(['#f4f4f4', '#ffc21a', '#16181f', '#ff3355']) + '"/><path d="M' + f(ck + 1) + ',' + f(ry - 22) + ' l6,0" stroke="#111" stroke-width="3"/>';
      body += ln([[ck - 10, ry - 8], [ck - 6, ry - 32], [ck + 10, ry - 32], [ck + 16, ry - 8]], '#1d1f28', 2.2);
      const wy = ry - rr - R2(26, 34);
      over = ln([[xr - 8, ry - 6], [xr - 14, wy + 6]], '#15151c', 2.6) + ln([[xr + 6, ry - 8], [xr + 2, wy + 6]], '#15151c', 2.6);
      over += pa(P([[xr - 34, wy - 2], [xr + 16, wy - 6], [xr + 16, wy + 4], [xr - 32, wy + 7]]), dark) + '<rect x="' + f(xr - 36) + '" y="' + f(wy - 8) + '" width="4" height="20" fill="' + dark + '"/>';
      const wbx = Math.max(4, x0 - 26);
      over += ln([[xr - rr + 4, ry + 6], [wbx, GY - 6]], '#2a2c36', 2.4) + '<circle cx="' + f(wbx) + '" cy="' + f(GY - 3) + '" r="3" fill="#16181f" stroke="#9aa0b0"/>';
      wheels = [[xr, rr], [xf, rf]];
      return out({ tread: false });
    }
    if (kind === 'landspeed') {
      const top = GY - R2(40, 46), bot = GY - 10, xr = x0 + L * R2(.18, .22), xf = x1 - L * R2(.17, .2);
      const d = 'M' + f(x0) + ',' + f(bot - 10) + ' Q' + f(x0 + 6) + ',' + f(top + 2) + ' ' + f(x0 + L * .25) + ',' + f(top) + ' L' + f(x1 - L * .3) + ',' + f(top + 2) + ' Q' + f(x1 - 20) + ',' + f(top + 8) + ' ' + f(x1 + 4) + ',' + f(bot - 12) + ' Q' + f(x1 - 6) + ',' + f(bot) + ' ' + f(x1 - 30) + ',' + f(bot) + ' L' + f(x0 + 10) + ',' + f(bot) + ' Q' + f(x0) + ',' + f(bot) + ' ' + f(x0) + ',' + f(bot - 10) + ' Z';
      body = pa(P([[x0 + 2, top + 6], [x0 - 4, top - R2(34, 44)], [x0 + 12, top - R2(30, 40)], [x0 + L * .2, top + 2]]), BB, SK);
      body += '<ellipse cx="' + f(x1 - L * R2(.28, .36)) + '" cy="' + f(top + 1) + '" rx="13" ry="7" fill="' + GL + '"/>';
      body += pa(d, BB, SK) + '<path d="M' + f(x0 + 16) + ',' + f(lerp(top, bot, .55)) + ' L' + f(x1 - 26) + ',' + f(lerp(top, bot, .5)) + '" stroke="' + pk(['#ffffff', '#ffc21a', '#ff3355', '#2f6bff']) + '" stroke-width="3"/>';
      body += '<ellipse cx="' + f(x1 - L * .45) + '" cy="' + f(lerp(top, bot, .7)) + '" rx="10" ry="3.5" fill="#07080d"/>';
      over = [[xr, rr], [xf, rf]].map(w => pa('M' + f(w[0] - w[1] - 5) + ',' + f(GY - w[1] + 2) + ' A' + f(w[1] + 5) + ',' + f(w[1] + 5) + ' 0 0 1 ' + f(w[0] + w[1] + 5) + ',' + f(GY - w[1] + 2) + ' Z', BB, SK)).join('');
      wheels = [[xr, rr], [xf, rf]];
      return out({ exposed: false });
    }
    if (kind === 'indy') {
      const xr = x0 + L * R2(.11, .14), xf = x1 - L * R2(.17, .2), y = GY - rr * .8, X = t => x0 + L * t;
      body = pa(P([[X(.3), y - 30], [x0 + 10, y - 40], [x0 + 12, y - 28], [X(.32), y - 22]]), BB, SK);
      const d = 'M' + f(x1 - 2) + ',' + f(GY - 16) + ' L' + f(xf + 10) + ',' + f(GY - 24) + ' Q' + f(xf - 18) + ',' + f(y - 12) + ' ' + f(X(.58)) + ',' + f(y - 16) + ' L' + f(X(.48)) + ',' + f(y - 20) + ' L' + f(X(.37)) + ',' + f(y - 22) + ' Q' + f(X(.31)) + ',' + f(y - 36) + ' ' + f(X(.25)) + ',' + f(y - 26) + ' L' + f(xr + 10) + ',' + f(y - 14) + ' L' + f(x0 + 6) + ',' + f(y - 10) + ' L' + f(x0 + 6) + ',' + f(GY - 12) + ' L' + f(x1 - 8) + ',' + f(GY - 10) + ' Z';
      body += pa(d, BB, SK);
      body += pa(RP([[X(.3), y + 2, 0], [X(.3), y - 12, 4], [X(.52), y - 13, 8], [X(.56), y + 2, 0]]), shade(col, -.25), SK);
      body += '<rect x="' + f(X(.38)) + '" y="' + f(y - 10) + '" width="16" height="9" rx="2" fill="#f4f4f4"/><text x="' + f(X(.38) + 8) + '" y="' + f(y - 3) + '" font-size="7.5" font-weight="900" text-anchor="middle" fill="#111" font-family="Inter,Arial">' + RI2(2, 99) + '</text>';
      body += '<circle cx="' + f(X(.43)) + '" cy="' + f(y - 26) + '" r="6.3" fill="' + pk(['#f4f4f4', '#ffc21a', '#16181f', '#2f6bff']) + '"/>';
      body += '<path d="M' + f(X(.5)) + ',' + f(y - 20) + ' Q' + f(X(.48)) + ',' + f(y - 36) + ' ' + f(X(.4)) + ',' + f(y - 37) + ' L' + f(X(.37)) + ',' + f(y - 24) + '" fill="' + GL + '" stroke="#1d1f28" stroke-width="2"/>';
      over = '<rect x="' + f(x1 - 30) + '" y="' + f(GY - 9) + '" width="34" height="3" fill="' + dark + '"/><rect x="' + f(x1 - 26) + '" y="' + f(GY - 15) + '" width="28" height="3" fill="' + dark + '"/><rect x="' + f(x1 + 1) + '" y="' + f(GY - 18) + '" width="3" height="12" fill="' + dark + '"/>';
      over += '<rect x="' + f(x0 - 6) + '" y="' + f(y - 44) + '" width="32" height="5" fill="' + dark + '"/><rect x="' + f(x0 - 4) + '" y="' + f(y - 36) + '" width="26" height="4" fill="' + dark + '"/><rect x="' + f(x0 - 8) + '" y="' + f(y - 48) + '" width="3.5" height="18" fill="' + dark + '"/>' + ln([[x0 + 8, y - 32], [x0 + 12, y - 12]], '#15151c', 2.4);
      wheels = [[xr, rr], [xf, rf]];
      return out();
    }
    if (kind === 'jet') {
      const xr = x0 + L * R2(.2, .25), xf = x1 - L * R2(.14, .18), fy0 = GY - R2(50, 56), fy1 = GY - 26, nx = x0 + L * R2(.4, .46);
      under = pa(P([[x0 + 10, fy0 - 2], [x0 - R2(30, 44), fy0 + 4], [x0 + 10, fy0 + 10]]), '#ff7a1a', ' opacity=".85"') + pa(P([[x0 + 10, fy0 + 1], [x0 - R2(16, 24), fy0 + 4], [x0 + 10, fy0 + 7]]), '#fff1b0');
      body = pa(P([[x0 + 16, fy0 - 14], [x0 + 6, fy0 - 38], [x0 + 22, fy0 - 38], [x0 + 44, fy0 - 14]]), BB, SK);
      body += '<ellipse cx="' + f(x1 - L * .3) + '" cy="' + f(fy0 + 2) + '" rx="18" ry="8" fill="' + GL + '"/>';
      body += pa(RP([[x0 + L * .32, fy1, 0], [x0 + L * .3, fy0, 8], [x1 - L * .22, fy0 + 1, 22], [x1 + 3, (fy0 + fy1) / 2 + 3, 2], [x1 - L * .12, fy1, 8], [x0 + L * .34, fy1, 0]]), BB, SK);
      body += pa(RP([[x0 + 10, fy0 + 10, 0], [x0 + 8, fy0 - 16, 8], [nx, fy0 - 16, 8], [nx + 2, fy0 + 10, 0]]), shade(col, -.2), SK);
      body += '<ellipse cx="' + f(nx) + '" cy="' + f(fy0 - 3) + '" rx="3.5" ry="12" fill="#07080d"/><ellipse cx="' + f(x0 + 9) + '" cy="' + f(fy0 - 3) + '" rx="3" ry="12" fill="#3a3d48" stroke="#9aa0b0"/>';
      body += '<path d="M' + f(x0 + L * .36) + ',' + f(fy1 - 6) + ' L' + f(x1 - 14) + ',' + f(fy1 - 8) + '" stroke="' + pk(['#ffffff', '#ffc21a', '#ff3355']) + '" stroke-width="2.6"/>';
      body += ln([[xr, fy1], [xr, GY - rr]], '#2a2c36', 3.4) + ln([[xf, fy1], [xf, GY - rf]], '#2a2c36', 3.4);
      wheels = [[xr, rr], [xf, rf]];
      return out();
    }
    if (kind === 'kart') {
      const xr = x0 + rr + 4, xf = x1 - rf - 6, fy = GY - 12, sx = x0 + L * R2(.34, .4), suit = pk(['#ff3355', '#2f6bff', '#ffc21a', '#1fd38c', '#16181f', '#ffffff']);
      body = ln([[xr - rr - 2, fy - 4], [xf + rf + 4, fy - 2]], '#2a2c36', 3);
      body += '<rect x="' + f(xr - 8) + '" y="' + f(fy - 18) + '" width="18" height="12" rx="2" fill="#8a8f9c"/><ellipse cx="' + f(xr - 12) + '" cy="' + f(fy - 22) + '" rx="7" ry="4" fill="#c9ced9"/>';
      body += '<rect x="' + f(sx - 8) + '" y="' + f(fy - 24) + '" width="18" height="22" rx="5" fill="#16181f"/>';
      body += pa(RP([[sx - 2, fy - 4, 0], [sx - 6, fy - 30, 6], [sx + 8, fy - 34, 6], [sx + 14, fy - 10, 0]]), suit);
      body += ln([[sx + 10, fy - 9], [xf - 10, fy - 9]], suit, 8) + ln([[sx + 4, fy - 28], [sx + 24, fy - 22]], suit, 5);
      body += ln([[sx + 28, fy - 28], [sx + 22, fy - 10]], '#2a2c36', 2.4) + '<ellipse cx="' + f(sx + 27) + '" cy="' + f(fy - 27) + '" rx="2" ry="6" fill="none" stroke="#16181f" stroke-width="2"/>';
      body += '<circle cx="' + f(sx + 1) + '" cy="' + f(fy - 41) + '" r="8.5" fill="' + pk(['#f4f4f4', '#ffc21a', '#ff3355', '#2f6bff']) + '"/><path d="M' + f(sx + 2) + ',' + f(fy - 44) + ' q5,0 7.5,3" stroke="#111" stroke-width="3.4" fill="none"/>';
      body += pa(RP([[xr + rr + 1, fy + 2, 0], [xr + rr + 3, fy - 12, 4], [xf - rf - 5, fy - 10, 4], [xf - rf - 3, fy + 2, 0]]), BB, SK);
      body += pa(RP([[xf - rf + 2, fy + 2, 0], [xf - 2, fy - 16, 6], [x1 + 2, fy - 10, 5], [x1 + 4, fy + 2, 0]]), BB, SK);
      body += '<rect x="' + f(xf - 8) + '" y="' + f(fy - 14) + '" width="12" height="9" rx="2" fill="#f4f4f4"/><text x="' + f(xf - 2) + '" y="' + f(fy - 7.5) + '" font-size="7" font-weight="900" text-anchor="middle" fill="#111" font-family="Inter,Arial">' + RI2(1, 99) + '</text>';
      wheels = [[xr, rr], [xf, rf]];
      return out();
    }
    if (kind === 'roadster30') {
      const xr = x0 + L * R2(.16, .2), xf = x1 - L * R2(.17, .21), sill = GY - rr * R2(.58, .66), bl = sill - R2(24, 30), c0 = x0 + L * R2(.25, .3), c1 = c0 + L * R2(.15, .19);
      under = '<rect x="' + f(c0 + 4) + '" y="' + f(bl - 12) + '" width="' + f(c1 - c0 - 14) + '" height="16" rx="6" fill="' + pk(['#3a2a22', '#16181f', '#7a2e22']) + '"/><ellipse cx="' + f(c1 - 8) + '" cy="' + f(bl - 7) + '" rx="2.5" ry="7" fill="none" stroke="#1d1f28" stroke-width="2"/>';
      body = pa(RP([[x0 + L * .1, sill, 0], [x0, sill - 10, 12], [x0 + 4, bl + 6, 14], [x0 + L * .16, bl, 10], [c0, bl + 1, 6], [c1, bl + 2, 4], [x1 - 14, bl + 4, 6], [x1 - 6, sill - 6, 4], [x1 - 14, sill, 0]]), BB, SK);
      body += pa(P([[c1 + 2, bl + 2], [c1 - 6, bl - R2(14, 18)], [c1 - 2, bl - 18], [c1 + 6, bl + 2]]), GL, ' stroke="#d8dbe6" stroke-width="1.2"');
      for (let k = 0; k < RI2(5, 9); k++) body += '<path d="M' + f(c1 + 16 + k * 5) + ',' + f(bl + 7) + ' l0,8" stroke="' + dark + '" stroke-width="1.4"/>';
      body += '<path d="M' + f(x0 + 8) + ',' + f(bl + 4) + ' L' + f(x1 - 14) + ',' + f(bl + 6) + '" stroke="#e6e9f2" stroke-width="1.4" opacity=".85"/>' + ln([[x1 - 9, bl + 3], [x1 - 3, sill - 6]], '#d8dbe6', 5);
      const fd = 'M' + f(xf + rf + 8) + ',' + f(GY - rf * .95) + ' Q' + f(xf + rf + 4) + ',' + f(GY - 2 * rf - 6) + ' ' + f(xf) + ',' + f(GY - 2 * rf - 5) + ' Q' + f(xf - rf - 6) + ',' + f(GY - 2 * rf - 4) + ' ' + f(xf - rf - 20) + ',' + f(sill + 3) + ' L' + f(xr + rr + 12) + ',' + f(sill + 3) + ' Q' + f(xr + rr + 4) + ',' + f(GY - 2 * rr - 4) + ' ' + f(xr - 4) + ',' + f(GY - 2 * rr - 4) + ' Q' + f(xr - rr - 10) + ',' + f(GY - 2 * rr) + ' ' + f(xr - rr - 12) + ',' + f(GY - rr * .95);
      over = fender(fd, 8.5);
      over += '<circle cx="' + f(xf - rf - 26) + '" cy="' + f(sill - 10) + '" r="' + f(rf * .72) + '" fill="#111" stroke="' + col + '" stroke-width="3"/><circle cx="' + f(xf - rf - 26) + '" cy="' + f(sill - 10) + '" r="' + f(rf * .3) + '" fill="#d8dbe6"/>';
      over += ln([[x1 - 6, bl + 6], [x1 - 2, bl - 2]], '#9aa0b0', 1.6) + '<ellipse cx="' + f(x1 - 1) + '" cy="' + f(bl - 5) + '" rx="5.5" ry="5" fill="#f1f8ff" stroke="#c9d2e0" stroke-width="1.5"/><circle cx="' + f(x0 + 3) + '" cy="' + f(sill - 12) + '" r="2.4" fill="#ff2a3d"/>';
      wheels = [[xr, rr], [xf, rf]];
      return out({ whitewall: true });
    }
    if (kind === 'gangster') {
      const xr = x0 + L * R2(.16, .19), xf = x1 - L * R2(.19, .23), sill = GY - rr * R2(.52, .6), hoodY = sill - R2(30, 34), roofY = sill - R2(70, 78), c0 = x0 + L * R2(.13, .17), c1 = x0 + L * R2(.6, .64);
      const bd = RP([[x0 + 14, sill, 0], [x0 + 6, sill - 6, 4], [x0 + 6, hoodY + 4, 4], [c0, hoodY + 2, 2], [c0 + 2, roofY + 6, 6], [c0 + 8, roofY, 8], [c1 - 8, roofY, 6], [c1 + 2, hoodY - 2, 3], [x1 - 12, hoodY, 4], [x1 - 8, sill - 4, 3], [x1 - 14, sill, 0]]);
      body = '<rect x="' + f(x0 - 3) + '" y="' + f(hoodY - 4) + '" width="18" height="22" rx="2" fill="#16181f"/>' + ln([[x0 - 3, hoodY + 18], [x0 + 16, hoodY + 18]], '#d8dbe6', 1.6);
      body += '<clipPath id="gc' + id + '"><path d="' + bd + '"/></clipPath>' + pa(bd, BB, SK);
      body += '<g clip-path="url(#gc' + id + ')">' + (R2(0, 1) < .6 ? '<rect x="0" y="0" width="320" height="' + f(hoodY - 4) + '" fill="#14161d"/>' : '') + '</g>';
      const nwin = 3, wx0 = c0 + 8, wx1 = c1 - 4, ww = (wx1 - wx0) / nwin;
      for (let k = 0; k < nwin; k++) body += pa(P([[wx0 + k * ww + 2, roofY + 7], [wx0 + (k + 1) * ww - 2 + (k === nwin - 1 ? -2 : 0), roofY + 7], [wx0 + (k + 1) * ww - 2 + (k === nwin - 1 ? 4 : 0), hoodY - 6], [wx0 + k * ww + 2, hoodY - 6]]), GL);
      body += ln([[c1 - 12, roofY - 1], [c1 + 6, roofY + 3]], '#16181f', 3);
      body += '<path d="M' + f(wx0 + ww * 1.5) + ',' + f(hoodY - 4) + ' L' + f(wx0 + ww * 1.5) + ',' + f(sill - 3) + ' M' + f(wx0 + 2) + ',' + f(hoodY - 4) + ' L' + f(wx0 + 2) + ',' + f(sill - 3) + ' M' + f(wx1) + ',' + f(hoodY - 4) + ' L' + f(wx1) + ',' + f(sill - 3) + '" stroke="' + dark + '" stroke-width=".9" opacity=".7"/>';
      for (let k = 0; k < RI2(5, 8); k++) body += '<path d="M' + f(c1 + 14 + k * 5) + ',' + f(hoodY + 6) + ' l0,10" stroke="' + dark + '" stroke-width="1.4"/>';
      body += '<rect x="' + f(x1 - 14) + '" y="' + f(hoodY - 4) + '" width="8" height="' + f(sill - hoodY + 1) + '" rx="2" fill="#d8dbe6"/>' + ln([[x1 - 12, hoodY - 6], [x1 - 10, hoodY - 11]], '#d8dbe6', 1.6);
      const fd = 'M' + f(xf + rf + 9) + ',' + f(GY - rf * .8) + ' Q' + f(xf + rf + 6) + ',' + f(GY - 2 * rf - 7) + ' ' + f(xf) + ',' + f(GY - 2 * rf - 6) + ' Q' + f(xf - rf - 4) + ',' + f(GY - 2 * rf - 5) + ' ' + f(xf - rf - 14) + ',' + f(sill + 2) + ' L' + f(xr + rr + 10) + ',' + f(sill + 2) + ' Q' + f(xr + rr + 6) + ',' + f(GY - 2 * rr - 5) + ' ' + f(xr) + ',' + f(GY - 2 * rr - 5) + ' Q' + f(xr - rr - 8) + ',' + f(GY - 2 * rr - 2) + ' ' + f(xr - rr - 10) + ',' + f(GY - rr * .9);
      over = fender(fd, 9);
      over += '<circle cx="' + f(xf - rf - 18) + '" cy="' + f(sill - 14) + '" r="' + f(rf * .78) + '" fill="#111" stroke="' + col + '" stroke-width="3.4"/><circle cx="' + f(xf - rf - 18) + '" cy="' + f(sill - 14) + '" r="' + f(rf * .32) + '" fill="#d8dbe6"/>';
      over += '<circle cx="' + f(x1 - 3) + '" cy="' + f(hoodY + 2) + '" r="5.5" fill="#f1f8ff" stroke="#c9d2e0" stroke-width="1.6"/>';
      wheels = [[xr, rr], [xf, rf]];
      return out({ whitewall: true });
    }
    if (kind === 'boxtruck') {
      const xr = x0 + L * R2(.2, .25), xf = x1 - L * R2(.12, .15), fr = GY - Math.max(rr, rf) * 1.4, cab0 = x1 - L * R2(.26, .3), bx1 = cab0 - R2(3, 6), boxTop = GY - R2(100, 110), cabTop = GY - R2(76, 84), hoodY = GY - R2(46, 52);
      const boxC = pk(['#eef1f6', '#e9e4d8', '#d8dbe6', shade(col, .55)]);
      body = '<rect x="' + f(x0 + 4) + '" y="' + f(fr) + '" width="' + f(cab0 - x0) + '" height="7" fill="#16181f"/><rect x="' + f(lerp(xr, xf, .3)) + '" y="' + f(fr + 6) + '" width="' + f((xf - xr) * .3) + '" height="12" rx="5" fill="#c9ced9"/>';
      body += pa(RP([[x0, fr + 1, 0], [x0, boxTop, 3], [bx1, boxTop, 3], [bx1, fr + 1, 0]]), boxC, ' stroke="#9aa0b0" stroke-width="1"');
      const bm = lerp(boxTop, fr, R2(.45, .6));
      body += '<path d="M' + f(x0 + 2) + ',' + f(bm + 8) + ' C' + f(lerp(x0, bx1, .3)) + ',' + f(bm - 12) + ' ' + f(lerp(x0, bx1, .6)) + ',' + f(bm + 18) + ' ' + f(bx1 - 2) + ',' + f(bm - 4) + ' L' + f(bx1 - 2) + ',' + f(bm + 10) + ' C' + f(lerp(x0, bx1, .6)) + ',' + f(bm + 30) + ' ' + f(lerp(x0, bx1, .3)) + ',' + f(bm) + ' ' + f(x0 + 2) + ',' + f(bm + 20) + ' Z" fill="' + col + '" opacity=".95"/>';
      body += '<text x="' + f(lerp(x0, bx1, .5)) + '" y="' + f(boxTop + 22) + '" font-size="11" font-weight="900" text-anchor="middle" fill="' + shade(col, -.3) + '" font-family="Inter,Arial" letter-spacing="1">' + pk(['MOVE', 'FRESH', 'CARGO', 'PARCEL', 'EXPRESS', 'HAUL']) + '</text>';
      body += '<path d="M' + f(x0 + 6) + ',' + f(boxTop + 3) + ' L' + f(x0 + 6) + ',' + f(fr - 1) + '" stroke="#9aa0b0" stroke-width="1"/>';
      body += '<circle cx="' + f(xr) + '" cy="' + f(GY - rr) + '" r="' + f(rr + 3) + '" fill="#07080d"/>';
      const cd = RP([[cab0, GY - rf * .7, 0], [cab0, cabTop, 4], [cab0 + (x1 - cab0) * .45, cabTop, 6], [x1 - 10, hoodY, 6], [x1, hoodY + 4, 3], [x1, GY - rf * .7, 0]]);
      body += pa(cd, BB, SK) + '<circle cx="' + f(xf) + '" cy="' + f(GY - rf) + '" r="' + f(rf + 3) + '" fill="#07080d"/>';
      body += pa(P([[cab0 + 5, cabTop + 6], [cab0 + (x1 - cab0) * .42, cabTop + 6], [x1 - 13, hoodY - 2], [cab0 + 5, hoodY - 2]]), GL);
      body += '<path d="M' + f(cab0 + 3) + ',' + f(hoodY) + ' L' + f(cab0 + 3) + ',' + f(GY - rf * .7 - 2) + ' M' + f(lerp(cab0, x1, .55)) + ',' + f(cabTop + 4) + ' L' + f(lerp(cab0, x1, .58)) + ',' + f(GY - rf * 1.9) + '" stroke="' + dark + '" stroke-width="1" opacity=".7"/>';
      body += '<rect x="' + f(x1 - 4) + '" y="' + f(hoodY + 6) + '" width="5" height="7" rx="1" fill="#eaf6ff"/><rect x="' + f(x1 - 12) + '" y="' + f(GY - rf * .7 - 4) + '" width="14" height="6" rx="1" fill="#16181f"/><rect x="' + f(x0 - 1) + '" y="' + f(fr - 10) + '" width="4" height="8" fill="#ff2a3d"/>';
      over = ln([[cab0 + (x1 - cab0) * .5, cabTop + 10], [x1 + 4, cabTop + 8]], '#2a2c36', 1.6) + '<rect x="' + f(x1 + 2) + '" y="' + f(cabTop + 6) + '" width="3" height="10" fill="#2a2c36"/>';
      wheels = [[xr, rr], [xf, rf]];
      return out({ exposed: false });
    }
    if (kind === 'cabover') {
      const xf = x1 - L * R2(.12, .15), xr2 = x0 + L * R2(.13, .16), xr = xr2 + rr * 2 + R2(4, 7), cab0 = x1 - L * R2(.34, .38), cabTop = GY - R2(98, 104), fr = GY - rr * 1.5;
      body = '<rect x="' + f(x0) + '" y="' + f(fr) + '" width="' + f(cab0 - x0 + 4) + '" height="7" fill="#1b1c22"/><rect x="' + f((xr + xr2) / 2 - 18) + '" y="' + f(fr - 5) + '" width="36" height="5" rx="1" fill="#2a2c36"/>';
      body += '<rect x="' + f(cab0 - 52) + '" y="' + f(fr + 5) + '" width="44" height="16" rx="7" fill="#c9ced9"/><path d="M' + f(cab0 - 40) + ',' + f(fr + 6) + ' l0,14 M' + f(cab0 - 20) + ',' + f(fr + 6) + ' l0,14" stroke="#8a8f9c" stroke-width="1.2"/>';
      body += ln([[cab0 - 6, fr + 2], [cab0 - 6, cabTop - 8]], '#d8dbe6', 5) + '<rect x="' + f(cab0 - 9) + '" y="' + f(cabTop - 10) + '" width="6" height="4" fill="#9aa0b0"/>';
      body += '<rect x="' + f(x0 + 2) + '" y="' + f(GY - 30) + '" width="4" height="24" fill="#16181f"/>';
      const cd = RP([[cab0, GY - rf * .75, 0], [cab0, cabTop + 8, 4], [cab0 + 6, cabTop, 6], [x1 - 6, cabTop + 2, 6], [x1, cabTop + 12, 3], [x1 + 1, GY - rf * .75, 0]]);
      body += pa(P([[cab0 + 6, cabTop + 1], [cab0 + 22, cabTop - 14], [x1 - 24, cabTop - 14], [x1 - 14, cabTop + 2]]), BB, SK);
      body += pa(cd, BB, SK) + '<circle cx="' + f(xf) + '" cy="' + f(GY - rf) + '" r="' + f(rf + 3) + '" fill="#07080d"/>';
      body += pa(P([[x1 - 36, cabTop + 10], [x1 - 5, cabTop + 10], [x1 - 4, cabTop + 40], [x1 - 36, cabTop + 40]]), GL);
      body += '<path d="M' + f(x1 - 40) + ',' + f(cabTop + 6) + ' L' + f(x1 - 40) + ',' + f(GY - rf * 1.9) + '" stroke="' + dark + '" stroke-width="1" opacity=".7"/>';
      for (let k = 0; k < 6; k++) body += '<path d="M' + f(x1 - 4) + ',' + f(cabTop + 50 + k * 5) + ' l4,0" stroke="#d8dbe6" stroke-width="2"/>';
      body += '<rect x="' + f(x1 - 30) + '" y="' + f(GY - rf * .75 - 2) + '" width="14" height="3" fill="#2a2c36"/><rect x="' + f(x1 - 3) + '" y="' + f(cabTop + 82) + '" width="4" height="7" fill="#eaf6ff"/>';
      body += '<path d="M' + f(cab0 + 6) + ',' + f(cabTop + 46) + ' L' + f(x1 - 10) + ',' + f(cabTop + 46) + '" stroke="' + pk(['#ffffff', '#ffc21a', '#16181f', '#ff3355']) + '" stroke-width="4" opacity=".9"/>';
      wheels = [[xr2, rr], [xr, rr], [xf, rf]];
      return out({ exposed: false });
    }
    return null;
  }

  const NEW_SP = { tuk: 1, solar: 1, pod: 1, ratrod: 1, dragster: 1, landspeed: 1, indy: 1, jet: 1, kart: 1, roadster30: 1, gangster: 1, boxtruck: 1, cabover: 1 };
  // ---------- render one catalog car ----------
  function design(m) {
    if (m._d2) return m._d2;
    const r = rng(77000 + parseInt(String(m.id).replace(/\D/g, '') || '0', 10) * 7919);
    const R2 = (a, b) => Array.isArray(a) ? a[0] + r() * (a[1] - a[0]) : a + r() * (b - a), RI2 = (a, b) => Math.floor(a + r() * (b - a + 1)), pk = a => a[Math.floor(r() * a.length)];
    const gauss = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); };
    const arch = m._arch || pk(BY_CLASS[m.cls] || BY_CLASS.super);
    return (m._d2 = { r, R2, RI2, pk, gauss, arch, seed: r() });
  }
  function art(m, color, opt) {
    opt = opt || {}; const D = design(m); const A = AR[D.arch];
    const r = rng(77000 + parseInt(String(m.id).replace(/\D/g, '') || '0', 10) * 7919); r(); // fresh deterministic stream each render
    const R2 = (a, b) => Array.isArray(a) ? a[0] + r() * (a[1] - a[0]) : a + r() * (b - a), RI2 = (a, b) => Math.floor(a + r() * (b - a + 1)), pk = a => a[Math.floor(r() * a.length)];
    const gauss = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); };
    const id = ++uid, col = color || m.color, dark = shade(col, -.6), light = shade(col, .42);
    const W = { style: A.wheels ? pk(A.wheels) : pk(A.wire ? ['wire'] : A.offroad ? ['steel', 'split', 'spoke'] : A.ev ? ['aero', 'turbine', 'disc'] : ['spoke', 'spoke', 'split', 'mesh', 'turbine', 'disc']), n: pk([3, 4, 5, 5, 6, 7, 10, 12]), col: pk(A.wcol || ['#d8dbe6', '#d8dbe6', '#2b2d38', '#d4a64a', '#9a6b4a', '#eef2ff', '#3a3d48']), cal: r() < .7 ? pk(['#ff3355', '#ffc21a', '#2f6bff', '#1fd38c', '#8a8f9c', '#ff7a1a']) : null, rimF: A.rimF ? R2(A.rimF) : A.offroad ? R2([.5, .6]) : R2([.62, .74]), whitewall: r() < (A.whitewall || 0), tread: !!A.offroad };
    let defs = '<linearGradient id="bb' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + shade(col, .4) + '"/><stop offset=".42" stop-color="' + col + '"/><stop offset="1" stop-color="' + shade(col, -.6) + '"/></linearGradient>' +
      '<linearGradient id="gl' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + (r() < .4 ? '#3a4152' : '#a9c2ff') + '" stop-opacity=".9"/><stop offset=".5" stop-color="#1a2036"/><stop offset="1" stop-color="#090c16"/></linearGradient>' +
      '<radialGradient id="rd' + id + '"><stop offset="0" stop-color="#5a5e6e"/><stop offset="1" stop-color="#16171f"/></radialGradient>' +
      '<radialGradient id="sp' + id + '" cx=".5" cy=".75" r=".6"><stop offset="0" stop-color="' + col + '" stop-opacity=".42"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></radialGradient>' +
      '<filter id="fb' + id + '"><feGaussianBlur stdDeviation="4"/></filter>';
    let main = '', wheels = [], x0, x1, GY = 130, shadowW, refl = null;
    if (A.b !== 'gen') {
      const S = NEW_SP[A.b] ? special2(A.b, A, R2, RI2, pk, col, id) : special(A.b, A, R2, RI2, pk, gauss, col, id);
      x0 = S.x0; x1 = S.x1; shadowW = (x1 - x0) / 2 + 8;
      if (S.whitewall) W.whitewall = true; if (S.tread) W.tread = true;
      main = S.under + S.body + S.wheels.map(w => wheel(w[0], GY - w[1], w[1], W, id)).join('') + S.over;
    } else {
      const B = genBody(A, R2, RI2, pk, gauss, m); x0 = B.x0; x1 = B.x1; shadowW = B.L / 2 + 6;
      let lift = 0, tilt = 0, WRs = 1;
      if (A.monster) { WRs = R2(A.monster); lift = B.rr * (WRs - 1) + B.rr * WRs * .3; }
      if (A.tilt) tilt = R2(A.tilt);
      const tf = (lift || tilt) ? ' transform="' + (lift ? 'translate(0,' + f(-lift) + ') ' : '') + (tilt ? 'rotate(' + f(tilt) + ' ' + f(B.xr) + ' ' + f(B.ycR) + ')' : '') + '"' : '';
      if (!tf) refl = B.d;
      defs += '<clipPath id="cp' + id + '"><path d="' + B.d + '"/></clipPath>';
      let inner = '', back = '';
      // two-tone lower body / cladding
      if (r() < (A.twoTone || .12)) inner += '<rect x="0" y="' + f(lerp(B.belt(160), B.sill, R2([.45, .65]))) + '" width="320" height="80" fill="' + pk([shade(col, -.45), '#e8e2d4', '#16181f', '#d8dbe6']) + '" opacity=".95"/>';
      if (A.cladding) inner += '<rect x="0" y="' + f(B.sill - 7) + '" width="320" height="20" fill="#1b1d24" opacity=".9"/>';
      // body-side paint jobs (under the glass)
      if (A.drift) { const c1 = pk(['#ff2a6d', '#1fd3ff', '#ffe11a', '#7a3cff', '#16181f']), c2 = pk(['#ffffff', '#16181f', '#ff7a1a']); inner += '<path d="M' + f(lerp(x0, x1, R2([.2, .4]))) + ',0 L' + f(lerp(x0, x1, R2([.5, .7]))) + ',0 L' + f(lerp(x0, x1, R2([.3, .5]))) + ',200 L' + f(lerp(x0, x1, R2([.05, .2]))) + ',200 Z" fill="' + c1 + '" opacity=".9"/><path d="M' + f(x1 - 50) + ',0 L' + f(x1 - 40) + ',0 L' + f(x1 - 70) + ',200 L' + f(x1 - 80) + ',200 Z" fill="' + c2 + '" opacity=".85"/>'; const sy = lerp(B.belt(160), B.sill, .7); for (let k = 0; k < 3; k++) inner += '<rect x="' + f(lerp(B.xr + B.arR, B.xf - B.arF, .12 + k * .26)) + '" y="' + f(sy) + '" width="' + f(R2([14, 22])) + '" height="4" rx="1" fill="#f4f4f4" opacity=".9"/>'; }
      if (A.wood) { const wy0 = B.belt(160) + 3, wy1 = B.sill - 5, wa = x0 + 5, wz = B.ax - 6; inner += '<rect x="' + f(wa) + '" y="' + f(wy0) + '" width="' + f(wz - wa) + '" height="' + f(wy1 - wy0) + '" fill="' + pk(['#8a5630', '#9b6a3c', '#6e4424']) + '"/>'; for (let xx = wa + 14; xx < wz - 6; xx += R2([16, 24])) inner += '<path d="M' + f(xx) + ',' + f(wy0) + ' L' + f(xx) + ',' + f(wy1) + '" stroke="#e2cf9e" stroke-width="1.8"/>'; inner += '<rect x="' + f(wa) + '" y="' + f(wy0) + '" width="' + f(wz - wa) + '" height="' + f(wy1 - wy0) + '" fill="none" stroke="#e2cf9e" stroke-width="2.4"/>'; }
      if (A.taxi) { const ty = lerp(B.belt(160), B.sill, .42); let i = 0; for (let xx = x0; xx < x1; xx += 5, i++) for (let k = 0; k < 2; k++) if ((i + k) % 2) inner += '<rect x="' + f(xx) + '" y="' + f(ty + k * 5) + '" width="5" height="5" fill="#111"/>'; }
      if (A.flames && r() < A.flames) { const fy = lerp(B.noseTop, B.sill, .45); for (let k = 0; k < 4; k++) { const y = fy + (k - 1.5) * 5, fl = R2([40, 80]); inner += '<path d="M' + f(x1 + 4) + ',' + f(y - 3) + ' Q' + f(x1 - fl * .5) + ',' + f(y - 6) + ' ' + f(x1 - fl) + ',' + f(y + R2([-4, 4])) + ' Q' + f(x1 - fl * .55) + ',' + f(y + 3) + ' ' + f(x1 + 4) + ',' + f(y + 3) + ' Z" fill="' + (k % 2 ? '#ffc21a' : '#ff6a1a') + '" opacity=".92"/>'; } }
      // glass
      B.glass.forEach(g => inner += '<path d="M' + g.map(p => f(p[0]) + ',' + f(p[1])).join(' L') + ' Z" fill="url(#gl' + id + ')"/>');
      // glass reflection streak
      if (B.glass[0] && !B.open) { const g = B.glass[0]; inner += '<path d="M' + f(g[g.length - 1][0] - 6) + ',' + f(g[g.length - 1][1] - 2) + ' L' + f(g[2][0] - 8) + ',' + f(g[2][1] + 2) + '" stroke="rgba(255,255,255,.35)" stroke-width="3"/>'; }
      // pillars
      const nw = B.open || B.bubble ? 0 : (A.doors4 ? RI2(2, 3) : RI2(1, 2)) - 1, gx0 = B.glass[0] ? B.glass[0][0][0] : B.rbx, gx1 = B.ax;
      for (let i = 1; i <= nw; i++) { const px = lerp(gx0, gx1, i / (nw + 1)) + R2([-6, 6]); inner += '<path d="M' + f(px) + ',' + f(B.belt(px)) + ' L' + f(px + R2([0, 4])) + ',' + f(B.roofY - 2) + '" stroke="' + (r() < .5 ? '#0d0f16' : dark) + '" stroke-width="' + f(R2([2.5, 4.5])) + '"/>'; }
      if (B.targa) inner += '<rect x="' + f(lerp(gx0, gx1, .3)) + '" y="' + f(B.roofY - 4) + '" width="' + f(R2([10, 16])) + '" height="' + f(B.belt(160) - B.roofY + 4) + '" fill="' + pk(['#d8dbe6', '#16181f', dark]) + '"/>';
      // glass treatments: louvers, split, opera/landau, vinyl, solar, armor
      const g0 = B.glass[0], solidRoof = g0 && !B.open && !B.bubble;
      if (A.louvers && r() < A.louvers && solidRoof) for (let k = 1; k < 7; k++) { const t = k / 7; inner += '<path d="M' + f(lerp(g0[0][0], g0[1][0], t)) + ',' + f(lerp(g0[0][1], g0[1][1], t)) + ' l' + f(R2([9, 13])) + ',0" stroke="#07080d" stroke-width="2"/>'; }
      if (A.split && solidRoof) inner += '<path d="M' + f(g0[0][0] + 2) + ',' + f(g0[0][1] - 1) + ' L' + f(g0[1][0] + 2) + ',' + f(g0[1][1] + 1) + '" stroke="url(#bb' + id + ')" stroke-width="5"/><path d="M' + f(lerp(g0[0][0], g0[1][0], .5) + 9) + ',' + f(lerp(g0[0][1], g0[1][1], .5)) + ' l7,-1" stroke="' + dark + '" stroke-width="1.6"/>';
      if (((A.opera && r() < A.opera) || A.landau) && solidRoof) { const cx = lerp(B.rbx, B.rfx, A.landau ? R2([.42, .52]) : R2([.2, .28])), oy = lerp(B.roofY, B.belt(cx), .45);
        inner += '<path d="M' + f(g0[0][0] - 3) + ',' + f(g0[0][1] + 3) + ' L' + f(g0[1][0] - 3) + ',' + f(g0[1][1] - 4) + ' L' + f(cx) + ',' + f(B.roofY - 4) + ' L' + f(cx) + ',' + f(B.belt(cx) + 2) + ' Z" fill="url(#bb' + id + ')"/>';
        inner += A.landau ? '<path d="M' + f(lerp(g0[1][0], cx, .2)) + ',' + f(oy) + ' q' + f((cx - g0[1][0]) * .25) + ',-10 ' + f((cx - g0[1][0]) * .45) + ',0 t' + f((cx - g0[1][0]) * .3) + ',2" stroke="#e6e9f2" stroke-width="2.2" fill="none"/>' : '<ellipse cx="' + f(lerp(g0[1][0], cx, .55)) + '" cy="' + f(oy) + '" rx="3.2" ry="5" fill="url(#gl' + id + ')" stroke="#d8dbe6" stroke-width=".8"/>'; }
      if (A.vinyl && r() < A.vinyl && solidRoof) inner += '<rect x="' + f(B.rbx - 6) + '" y="' + f(B.roofY - 8) + '" width="' + f(B.rfx - B.rbx + 10) + '" height="' + f(R2([10, 13])) + '" fill="' + pk(['#16171d', '#e8e2d4', '#3a2a22']) + '" opacity=".95"/>';
      if (A.solar && r() < A.solar && solidRoof) { inner += '<rect x="' + f(B.rbx - 2) + '" y="' + f(B.roofY - 8) + '" width="' + f(B.rfx - B.rbx + 4) + '" height="' + f(R2([10, 12])) + '" fill="#0e1c46"/>'; for (let xx = B.rbx; xx < B.rfx; xx += 7) inner += '<path d="M' + f(xx) + ',' + f(B.roofY - 8) + ' l0,12" stroke="#3a5cb0" stroke-width=".8"/>'; }
      if (A.armored) { const by = B.belt(160), gh = by - B.roofY; inner += '<rect x="0" y="' + f(by - gh * .42) + '" width="320" height="' + f(gh * .42 + 2) + '" fill="url(#bb' + id + ')"/>'; for (let k = 0; k < 9; k++) inner += '<circle cx="' + f(lerp(x0 + 20, x1 - 20, k / 8)) + '" cy="' + f(by + 4) + '" r="1.1" fill="' + dark + '"/>'; }
      if (A.gull && solidRoof) { const ga = B.ax - 6, gb = lerp(gx0, gx1, .3); inner += '<path d="M' + f(gb) + ',' + f(B.roofY) + ' L' + f(ga) + ',' + f(B.roofY) + ' L' + f(ga + 2) + ',' + f(B.sill - 4) + ' L' + f(gb) + ',' + f(B.sill - 4) + ' Z" fill="#14161d"/><path d="M' + f(gb + 4) + ',' + f(B.belt(gb) + 4) + ' q-1,-14 8,-16 q7,2 6,16 Z" fill="#2a2c36"/>'; }
      if (A.iceCream) { const wx = lerp(B.rbx, B.rfx, .18), ww = (B.rfx - B.rbx) * .42, wy = B.belt(wx) - 20; inner += '<rect x="' + f(wx) + '" y="' + f(wy) + '" width="' + f(ww) + '" height="26" rx="2" fill="#141a2c"/><rect x="' + f(wx) + '" y="' + f(wy + 22) + '" width="' + f(ww) + '" height="4" fill="#d8dbe6"/>'; for (let k = 0; k < 14; k++) inner += '<circle cx="' + f(R2([x0 + 8, x1 - 8])) + '" cy="' + f(R2([B.belt(160) + 12, B.sill - 4])) + '" r="1.6" fill="' + pk(['#ff5fa2', '#1fd3ff', '#ffc21a', '#ffffff']) + '"/>'; }
      // surfacing: shoulder line, lower line, door cuts, handles
      const sy0 = lerp(B.belt(x0), B.sill, R2([.12, .3])), sy1 = lerp(B.belt(x1), B.sill, R2([.1, .4]));
      inner += '<path d="M' + f(x0 + 6) + ',' + f(sy0) + ' Q' + f(160 + R2([-40, 40])) + ',' + f((sy0 + sy1) / 2 + R2([-6, 6])) + ' ' + f(x1 - 6) + ',' + f(sy1) + '" stroke="' + light + '" stroke-width="1.3" fill="none" opacity=".6"/>';
      if (r() < .6) inner += '<path d="M' + f(B.xr + B.arR) + ',' + f(B.sill - R2([3, 7])) + ' L' + f(B.xf - B.arF) + ',' + f(B.sill - R2([3, 8])) + '" stroke="' + dark + '" stroke-width="1.4" opacity=".7"/>';
      const dA = B.ax - R2([0, 6]), dB = A.doors4 ? lerp(gx0, gx1, .5) : lerp(gx0, gx1, R2([.15, .35]));
      inner += '<path d="M' + f(dA) + ',' + f(B.belt(dA) + 1) + ' L' + f(dA + R2([-2, 4])) + ',' + f(B.sill - 2) + ' M' + f(dB) + ',' + f(B.belt(dB) + 1) + ' L' + f(dB + R2([-2, 3])) + ',' + f(B.sill - 2) + (A.doors4 ? ' M' + f(lerp(gx0, dB, .2)) + ',' + f(B.belt(gx0) + 1) + ' L' + f(lerp(gx0, dB, .2)) + ',' + f(B.sill - 4) : '') + '" stroke="' + dark + '" stroke-width=".9" opacity=".55" fill="none"/>';
      inner += '<rect x="' + f(dA - 14) + '" y="' + f(B.belt(dA) + 5) + '" width="8" height="2" rx="1" fill="' + dark + '" opacity=".7"/>';
      // intakes / gills
      if (A.intake && r() < A.intake && dB - (B.xr + B.arR) > 18) { const ix = B.xr + B.arR + R2([2, 8]), iw = (dB - ix) * R2([.5, .9]), ish = pk(['tri', 'slot', 'gill']); inner += ish === 'gill' ? [0, 1, 2].map(k => '<path d="M' + f(ix + 6 + k * 7) + ',' + f(B.sill - 8) + ' l' + f(iw * .25) + ',-14" stroke="#07080d" stroke-width="2.4"/>').join('') : ish === 'slot' ? '<rect x="' + f(ix) + '" y="' + f(lerp(B.belt(ix), B.sill, .35)) + '" width="' + f(iw) + '" height="5" rx="2.5" fill="#07080d"/>' : '<path d="M' + f(ix) + ',' + f(B.sill - 8) + ' L' + f(ix + iw) + ',' + f(B.belt(ix + iw) + 8) + ' L' + f(ix + iw * .3) + ',' + f(B.belt(ix) + 12) + ' Z" fill="#07080d"/>'; }
      if (r() < .25) inner += '<path d="M' + f(B.xf + B.arF + 4) + ',' + f(B.sill - 12) + ' l8,-6 m-8,10 l8,-6" stroke="#0a0b10" stroke-width="1.8"/>';
      // livery
      const lv = r(); if (A.stripes ? lv < A.stripes : lv < .14) { const sc = pk(['#ffffff', '#16181f', '#ffc21a', '#ff2a4d', '#2f6bff']); const y = lerp(B.belt(160), B.sill, R2([.3, .6])); inner += '<path d="M0,' + f(y) + ' L320,' + f(y + R2([-4, 4])) + '" stroke="' + sc + '" stroke-width="' + f(R2([2.5, 6])) + '" opacity=".92"/>' + (r() < .5 ? '<path d="M0,' + f(y + 7) + ' L320,' + f(y + 7) + '" stroke="' + sc + '" stroke-width="1.6" opacity=".9"/>' : ''); }
      if (r() < (A.roundel || .1)) { const nx = lerp(B.xr, B.xf, .45), ny = lerp(B.belt(nx), B.sill, .5); inner += '<circle cx="' + f(nx) + '" cy="' + f(ny) + '" r="8" fill="#f4f4f4"/><text x="' + f(nx) + '" y="' + f(ny + 3.5) + '" font-size="9.5" font-weight="900" text-anchor="middle" fill="#111" font-family="Inter,Arial">' + RI2(1, 99) + '</text>'; }
      if (A.rally) inner += '<path d="M' + f(x0) + ',' + f(B.sill - 18) + ' L' + f(x1) + ',' + f(B.sill - 26) + '" stroke="' + pk(['#ffffff', '#ffc21a', '#2f6bff']) + '" stroke-width="10" opacity=".85"/>';
      // chrome
      if (A.chrome && r() < A.chrome) inner += '<path d="M' + f(x0) + ',' + f(B.belt(x0) + 3) + ' L' + f(x1) + ',' + f(B.belt(x1) + 3) + '" stroke="#eef2ff" stroke-width="1.6" opacity=".9"/><path d="M' + f(x0) + ',' + f(B.sill - 3) + ' L' + f(x1) + ',' + f(B.sill - 3) + '" stroke="#d8dbe6" stroke-width="2.2" opacity=".85"/>';
      // highlights (paint gloss)
      inner += '<path d="M' + f(x0 + 20) + ',' + f(B.belt(x0 + 20) + 2) + ' Q160,' + f(B.belt(160) - 2) + ' ' + f(x1 - 30) + ',' + f(B.noseTop + 1) + '" stroke="rgba(255,255,255,.28)" stroke-width="2.5" fill="none"/>';
      // ---- lights ----
      const hs = A.hl ? pk(A.hl) : pk(B.nose === 'blunt' ? ['rect', 'round', 'dual', 'bar'] : ['slit', 'slit', 'bar', 'pop', 'round', 'dual']), hy = B.noseTop + R2([2, 5]);
      if (hs === 'slit') inner += '<path d="M' + f(x1 - R2([18, 30])) + ',' + f(hy - 1) + ' L' + f(x1) + ',' + f(hy + 2) + ' L' + f(x1 - 2) + ',' + f(hy + 5) + ' L' + f(x1 - 24) + ',' + f(hy + 2) + ' Z" fill="#eaf6ff"/>';
      else if (hs === 'bar') inner += '<path d="M' + f(x1 - R2([14, 22])) + ',' + f(hy) + ' L' + f(x1 + 2) + ',' + f(hy + 1) + '" stroke="#eaf6ff" stroke-width="2.4"/>';
      else if (hs === 'pop') inner += '<path d="M' + f(x1 - 26) + ',' + f(B.noseTop + 1) + ' l14,0" stroke="' + dark + '" stroke-width="1.2"/><circle cx="' + f(x1 - 4) + '" cy="' + f(hy + 6) + '" r="1.8" fill="#ffb347"/>';
      else if (hs === 'rect') inner += '<rect x="' + f(x1 - 10) + '" y="' + f(hy - 1) + '" width="10" height="' + f(R2([5, 9])) + '" rx="1.5" fill="#eaf6ff"/>';
      else if (hs === 'round') inner += '<circle cx="' + f(x1 - 5) + '" cy="' + f(hy + 3) + '" r="' + f(R2([3.5, 5])) + '" fill="#eaf6ff" stroke="#c9d2e0"/>';
      else inner += '<circle cx="' + f(x1 - 4) + '" cy="' + f(hy + 3) + '" r="3" fill="#eaf6ff"/><circle cx="' + f(x1 - 11) + '" cy="' + f(hy + 2.5) + '" r="2.6" fill="#eaf6ff"/>';
      if (B.nose === 'blunt' && r() < .7) inner += '<rect x="' + f(x1 - 4) + '" y="' + f(hy + 6) + '" width="5" height="' + f(Math.max(4, B.sill - hy - 12)) + '" fill="#0f1016"/>';
      const ts = A.tl ? pk(A.tl) : pk(['strip', 'block', 'round', 'bar']), ty = (B.tail === 'box' || B.tail === 'bed') ? B.belt(x0) + 2 : B.belt(x0) + 4;
      inner += ts === 'round' ? '<circle cx="' + f(x0 + 4) + '" cy="' + f(ty + 2) + '" r="3.2" fill="#ff2a3d"/>' : ts === 'block' ? '<rect x="' + f(x0 - 1) + '" y="' + f(ty) + '" width="6" height="' + ((B.tail === 'box' || B.tail === 'bed') ? 16 : 8) + '" rx="1" fill="#ff2a3d"/>' : ts === 'bar' ? '<path d="M' + f(x0) + ',' + f(ty) + ' L' + f(x0 + 28) + ',' + f(ty - 1) + '" stroke="#ff2a3d" stroke-width="2"/>' : '<path d="M' + f(x0) + ',' + f(ty + 1) + ' L' + f(x0 + 18) + ',' + f(ty) + '" stroke="#ff2a3d" stroke-width="3.2" stroke-linecap="round"/>';
      let pre = '';
      if (B.open && B.wsTop) { const w = B.wsTop, hx = w.seat[0], hy = w.seat[1]; if (A.speedster) back += '<path d="M' + f(hx - 16) + ',' + f(hy + 3) + ' Q' + f(hx - 2) + ',' + f(hy - 17) + ' ' + f(hx + 14) + ',' + f(hy + 3) + ' Z" fill="url(#bb' + id + ')" stroke="' + dark + '" stroke-width=".8"/>'; pre += '<path d="M' + f(hx) + ',' + f(hy + 2) + ' q-1,-11 7,-12 q6,1 5,12 Z" fill="#14161d"/>' + (r() < .5 ? '<path d="M' + f(hx + 16) + ',' + f(hy + 2) + ' q-1,-9 6,-10 q5,1 4,10 Z" fill="#14161d"/>' : ''); pre += '<path d="M' + f(w.base[0] - 1) + ',' + f(w.base[1] + 1) + ' L' + f(w[0]) + ',' + f(w[1]) + ' L' + f(w[0] + 3) + ',' + f(w[1] + 1) + ' L' + f(w.base[0] + 4) + ',' + f(w.base[1] + 1) + ' Z" fill="url(#gl' + id + ')" stroke="' + (r() < .5 ? '#d8dbe6' : '#14161d') + '" stroke-width="1.3"/>'; }
      if (A.cage) back += '<circle cx="' + f(lerp(x0, B.rbx, .45)) + '" cy="' + f(B.belt(x0) - 9) + '" r="11" fill="#15151c" stroke="#2a2c36" stroke-width="3.5"/>';
      main = back + pre + '<path d="' + B.d + '" fill="url(#bb' + id + ')"/><g clip-path="url(#cp' + id + ')">' + inner + '</g><path d="' + B.d + '" fill="none" stroke="' + shade(col, -.68) + '" stroke-width="1"/>';
      // ---- outside parts: mirrors, aero, roof gear, skirts ----
      if (!B.open && !B.bubble) { const mx = B.ax - R2([4, 10]), my = B.belt(mx) - R2([1, 3]), ms = R2([3.5, 5.5]); main += '<path d="M' + f(mx) + ',' + f(my) + ' l' + f(ms) + ',' + f(-ms * .8) + ' l' + f(ms) + ',' + f(ms * .3) + ' l' + f(-ms * .8) + ',' + f(ms * .9) + ' Z" fill="' + dark + '"/>'; }
      if (A.aero && r() < A.aero) { const sp = A.aeroT ? pk(A.aeroT) : pk(['lip', 'wing', 'wing', 'gt', 'swan']), sx = x0 + R2([4, 14]), sy = B.belt(x0) - R2([2, 6]);
        if (sp === 'lip') main += '<path d="M' + f(x0 + 1) + ',' + f(sy + 3) + ' L' + f(x0 + 18) + ',' + f(sy - 1) + ' L' + f(x0 + 20) + ',' + f(sy + 3) + ' Z" fill="' + dark + '"/>';
        else { const h = sp === 'gt' ? R2([16, 22]) : R2([8, 14]), wl = sp === 'gt' ? R2([38, 48]) : R2([26, 36]); main += sp === 'swan' ? '<path d="M' + f(sx + 12) + ',' + f(sy) + ' q-4,' + f(-h) + ' 6,' + f(-h - 4) + ' M' + f(sx + 26) + ',' + f(sy) + ' q-4,' + f(-h) + ' 6,' + f(-h - 4) + '" stroke="#15151c" stroke-width="2.4" fill="none"/><path d="M' + f(sx - 6) + ',' + f(sy - h - 4) + ' L' + f(sx - 6 + wl) + ',' + f(sy - h - 6) + ' L' + f(sx - 6 + wl) + ',' + f(sy - h) + ' L' + f(sx - 4) + ',' + f(sy - h + 1) + ' Z" fill="' + dark + '"/>' : '<path d="M' + f(sx + 6) + ',' + f(sy) + ' L' + f(sx + 4) + ',' + f(sy - h) + ' M' + f(sx + 22) + ',' + f(sy) + ' L' + f(sx + 20) + ',' + f(sy - h) + '" stroke="#15151c" stroke-width="2.6"/><path d="M' + f(sx - 8) + ',' + f(sy - h - 3) + ' L' + f(sx - 8 + wl) + ',' + f(sy - h - 5) + ' L' + f(sx - 8 + wl) + ',' + f(sy - h) + ' L' + f(sx - 6) + ',' + f(sy - h + 1) + ' Z" fill="' + dark + '"/>'; }
        if (r() < .5) main += '<path d="M' + f(x1 - 30) + ',' + f(B.sill + 1) + ' L' + f(x1 + 4) + ',' + f(B.sill + 1) + '" stroke="#0a0b10" stroke-width="2.6"/><path d="M' + f(x0 - 2) + ',' + f(B.sill) + ' L' + f(x0 + 28) + ',' + f(B.sill) + '" stroke="#0a0b10" stroke-width="3"/>';
      }
      if (A.fin && r() < A.fin) main += '<path d="M' + f(B.rbx - 2) + ',' + f(B.roofY + 4) + ' L' + f(x0 + 12) + ',' + f(B.belt(x0) - R2([10, 18])) + ' L' + f(x0 + 22) + ',' + f(B.belt(x0)) + ' Z" fill="' + dark + '" opacity=".95"/>';
      if (A.rack && r() < A.rack) main += '<path d="M' + f(B.rbx + 6) + ',' + f(B.roofY - 4) + ' L' + f(B.rfx - 6) + ',' + f(B.roofY - 4) + '" stroke="#1d1f28" stroke-width="3.5" stroke-linecap="round"/>';
      if (A.lightbar && r() < A.lightbar) main += '<rect x="' + f(B.rfx - 30) + '" y="' + f(B.roofY - 6) + '" width="26" height="4" rx="2" fill="#1d1f28"/><rect x="' + f(B.rfx - 28) + '" y="' + f(B.roofY - 5.5) + '" width="22" height="2" fill="#fff6d0"/>';
      if (A.snorkel && r() < A.snorkel) main += '<path d="M' + f(B.ax + 4) + ',' + f(B.belt(B.ax) + 8) + ' L' + f(B.ax - 2) + ',' + f(B.roofY + 2) + ' L' + f(B.ax + 6) + ',' + f(B.roofY) + '" stroke="#16171d" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
      if (A.spare && r() < A.spare && B.tail === 'box') main += '<circle cx="' + f(x0 - 4) + '" cy="' + f(lerp(B.belt(x0), B.sill, .4)) + '" r="13" fill="#15151c" stroke="' + dark + '" stroke-width="3"/>';
      if (A.scoop && r() < A.scoop) main += '<path d="M' + f(lerp(B.ax, x1, .3)) + ',' + f(B.noseTop - (A.hump ? 7 : 1)) + ' L' + f(lerp(B.ax, x1, .46)) + ',' + f(B.noseTop - (A.hump ? 15 : 7)) + ' L' + f(lerp(B.ax, x1, .55)) + ',' + f(B.noseTop - (A.hump ? 6 : 0)) + ' Z" fill="' + dark + '"/>';
      if (A.rally) main += '<rect x="' + f(B.xr + B.arR - 2) + '" y="' + f(B.sill - 2) + '" width="4" height="12" fill="#16181f"/><rect x="' + f(B.rbx + 10) + '" y="' + f(B.roofY - 6) + '" width="14" height="6" rx="2" fill="' + dark + '"/>';
      // v6 parts
      const rx0 = B.rbx, rx1 = B.rfx, ry = B.roofY;
      if (A.tent) main += '<rect x="' + f(rx0 + 4) + '" y="' + f(ry - 12) + '" width="' + f((rx1 - rx0) * R2([.6, .8])) + '" height="10" rx="2.5" fill="' + pk(['#2a2d36', '#4a5236', '#c9b48a']) + '"/><rect x="' + f(rx0 + 6) + '" y="' + f(ry - 5) + '" width="' + f((rx1 - rx0) * .55) + '" height="2" fill="' + pk(['#ff7a1a', '#ffc21a', '#1fd38c']) + '"/>';
      if (A.ladder && r() < A.ladder) { const lx = x0 - 3; main += '<path d="M' + f(lx) + ',' + f(B.sill - 6) + ' L' + f(lx) + ',' + f(ry + 2) + ' M' + f(lx + 5) + ',' + f(B.sill - 6) + ' L' + f(lx + 5) + ',' + f(ry + 2) + '" stroke="#2a2c36" stroke-width="1.6"/>'; for (let yy = ry + 8; yy < B.sill - 6; yy += 7) main += '<path d="M' + f(lx) + ',' + f(yy) + ' l5,0" stroke="#2a2c36" stroke-width="1.4"/>'; }
      if (A.bullbar) main += '<path d="M' + f(x1 - 3) + ',' + f(B.noseTop + 3) + ' L' + f(x1 + 6) + ',' + f(B.noseTop + 5) + ' L' + f(x1 + 7) + ',' + f(B.sill + 2) + ' L' + f(x1 - 4) + ',' + f(B.sill + 2) + ' M' + f(x1 + 6) + ',' + f(lerp(B.noseTop, B.sill, .5)) + ' L' + f(x1 - 2) + ',' + f(lerp(B.noseTop, B.sill, .5)) + '" stroke="#22242c" stroke-width="3" fill="none" stroke-linejoin="round"/>';
      if (A.flares && r() < A.flares) [[B.xr, B.ycR, B.arR, A.dually ? 9 : 4]].concat(B.xr2 ? [[B.xr2, B.ycR, B.arR, 4]] : []).concat([[B.xf, B.ycF, B.arF, 4]]).forEach(a => { const ar = a[2] + a[3] * .7, dy = B.sill - a[1], dx = Math.sqrt(Math.max(1, ar * ar - dy * dy)); main += '<path d="M' + f(a[0] - dx) + ',' + f(B.sill) + ' A' + f(ar) + ',' + f(ar) + ' 0 ' + (dy > 0 ? 1 : 0) + ' 1 ' + f(a[0] + dx) + ',' + f(B.sill) + '" stroke="' + shade(col, -.3) + '" stroke-width="' + f(a[3] + 2) + '" fill="none"/>'; });
      if (A.gull && solidRoof) { const ga = B.ax - 6, gb = lerp(gx0, gx1, .3), h1 = R2([26, 34]), h2 = R2([34, 42]); main += '<path d="M' + f(gb) + ',' + f(ry + 1) + ' L' + f(ga) + ',' + f(ry + 1) + ' L' + f(ga + 8) + ',' + f(ry - h1) + ' L' + f(gb + 12) + ',' + f(ry - h2) + ' Z" fill="url(#bb' + id + ')" stroke="' + dark + '"/><path d="M' + f(lerp(gb, gb + 12, .5) + 3) + ',' + f(ry - h2 * .5 - 2) + ' L' + f(lerp(ga, ga + 8, .5) - 3) + ',' + f(ry - h1 * .5) + ' L' + f(ga + 6) + ',' + f(ry - h1 + 4) + ' L' + f(gb + 13) + ',' + f(ry - h2 + 5) + ' Z" fill="url(#gl' + id + ')"/>'; }
      if (A.popTop) main += '<path d="M' + f(rx0 + 8) + ',' + f(ry + 1) + ' L' + f(rx0 + 14) + ',' + f(ry - R2([18, 24])) + ' L' + f(rx1 - 22) + ',' + f(ry - R2([8, 12])) + ' L' + f(rx1 - 12) + ',' + f(ry + 1) + ' Z" fill="#ece6d6" stroke="#b8b09c"/><rect x="' + f(rx0 + 30) + '" y="' + f(ry - 12) + '" width="22" height="7" rx="2" fill="#1a2036"/>';
      if (A.roofScoop && r() < A.roofScoop && solidRoof) main += '<path d="M' + f(rx1 - 26) + ',' + f(ry + 1) + ' L' + f(rx1 - 22) + ',' + f(ry - 7) + ' L' + f(rx1 - 6) + ',' + f(ry - 6) + ' L' + f(rx1 - 4) + ',' + f(ry + 1) + ' Z" fill="' + dark + '"/>';
      if (A.canards && r() < A.canards) main += [0, 1].map(k => '<path d="M' + f(x1 - 6) + ',' + f(B.sill - 8 - k * 7) + ' L' + f(x1 + 7) + ',' + f(B.sill - 11 - k * 7) + ' L' + f(x1 - 2) + ',' + f(B.sill - 5 - k * 7) + ' Z" fill="#15151c"/>').join('');
      if (A.splitter) main += '<path d="M' + f(x1 - 40) + ',' + f(B.sill + 1.5) + ' L' + f(x1 + 9) + ',' + f(B.sill + 1.5) + '" stroke="#0a0b10" stroke-width="3"/>';
      if (A.taxi) main += '<rect x="' + f((rx0 + rx1) / 2 - 11) + '" y="' + f(ry - 8) + '" width="22" height="7" rx="2" fill="#ffd21a" stroke="#16181f" stroke-width=".8"/><text x="' + f((rx0 + rx1) / 2) + '" y="' + f(ry - 2.6) + '" font-size="5" font-weight="900" text-anchor="middle" fill="#16181f" font-family="Inter,Arial">TAXI</text>';
      if (A.tow) { const b0 = x0 + B.L * .16, b1 = x0 + B.L * .26, by = B.belt(x0) - 2, tx = x0 + R2([3, 8]), tyy = ry + R2([2, 8]); main += '<path d="M' + f(b0) + ',' + f(by + 2) + ' L' + f(b0 + 4) + ',' + f(by - 14) + ' L' + f(b1 - 2) + ',' + f(by - 14) + ' L' + f(b1) + ',' + f(by + 2) + ' Z" fill="#2a2c36"/><path d="M' + f(b0 + 6) + ',' + f(by - 12) + ' L' + f(tx) + ',' + f(tyy) + '" stroke="#2a2c36" stroke-width="6" stroke-linecap="round"/><path d="M' + f(b0 + 4) + ',' + f(by - 13) + ' L' + f(lerp(b0, tx, .6)) + ',' + f(lerp(by - 12, tyy, .6) + 2) + '" stroke="#ffc21a" stroke-width="2.2"/><path d="M' + f(tx) + ',' + f(tyy) + ' L' + f(tx) + ',' + f(B.sill - 6) + '" stroke="#9aa0b0" stroke-width="1.2"/><path d="M' + f(tx) + ',' + f(B.sill - 6) + ' q0,5 4,4" stroke="#9aa0b0" stroke-width="2" fill="none"/>'; }
      if (A.beacon) main += '<rect x="' + f(rx1 - 22) + '" y="' + f(ry - 5) + '" width="16" height="5" rx="2" fill="#ffb21a"/><rect x="' + f(rx1 - 20) + '" y="' + f(ry - 4) + '" width="5" height="3" fill="#fff3c4"/>';
      if (A.cage) main += '<path d="M' + f(B.rbx + 2) + ',' + f(ry + 3) + ' L' + f(x0 + 10) + ',' + f(B.belt(x0) - R2([12, 18])) + ' L' + f(x0 + 2) + ',' + f(B.belt(x0) - 1) + ' M' + f(x0 + 10) + ',' + f(B.belt(x0) - 15) + ' L' + f(lerp(x0, B.rbx, .6)) + ',' + f(B.belt(x0) - 1) + '" stroke="#1d1f28" stroke-width="3" fill="none" stroke-linejoin="round"/>';
      if (A.iceCream) { const wx = lerp(B.rbx, B.rfx, .18), ww = (B.rfx - B.rbx) * .42, wy = B.belt(wx) - 20, ac = pk(['#ff5fa2', '#1fd3ff', '#ffc21a']), sw = (ww + 8) / 6; for (let k = 0; k < 6; k++) main += '<path d="M' + f(wx - 4 + k * sw) + ',' + f(wy - 4) + ' l' + f(sw) + ',0 l0,7 q' + f(-sw / 2) + ',4 ' + f(-sw) + ',0 Z" fill="' + (k % 2 ? '#ffffff' : ac) + '"/>';
        const cx = lerp(B.rbx, B.rfx, .55); main += '<path d="M' + f(cx - 6) + ',' + f(ry - 11) + ' L' + f(cx) + ',' + f(ry) + ' L' + f(cx + 6) + ',' + f(ry - 11) + ' Z" fill="#d9a35a" stroke="#a8743a"/><circle cx="' + f(cx) + '" cy="' + f(ry - 15) + '" r="7" fill="' + ac + '"/><circle cx="' + f(cx + 2) + '" cy="' + f(ry - 21) + '" r="4.5" fill="#fff4e0"/>'; }
      // wheels (+ third axle, monster scale)
      let wh = '', post = '';
      [[B.xr, B.rr], [B.xf, B.rf]].concat(B.xr2 ? [[B.xr2, B.rr]] : []).forEach(w => { const R = w[1] * WRs; wh += wheel(w[0], GY - R, R, W, id); });
      if (A.monster) { const sc = pk(['#ffc21a', '#ff3355', '#1fd38c', '#d8dbe6']); [[B.xr, B.rr], [B.xf, B.rf]].forEach(w => { const R = w[1] * WRs, cy = GY - R; wh += '<path d="M' + f(w[0] - 4) + ',' + f(cy) + ' L' + f(w[0] - 10) + ',' + f(B.sill - lift + 4) + ' M' + f(w[0] + 4) + ',' + f(cy) + ' L' + f(w[0] + 10) + ',' + f(B.sill - lift + 4) + '" stroke="' + sc + '" stroke-width="3.4" stroke-linecap="round"/>'; }); }
      if (A.skirt && r() < A.skirt) post += '<path d="M' + f(B.xr - B.arR) + ',' + f(B.sill) + ' A' + f(B.arR) + ',' + f(B.arR) + ' 0 0 1 ' + f(B.xr + B.arR) + ',' + f(B.sill) + ' L' + f(B.xr + B.arR) + ',' + f(B.sill + 2) + ' L' + f(B.xr - B.arR) + ',' + f(B.sill + 2) + ' Z" fill="url(#bb' + id + ')" stroke="' + dark + '" stroke-width=".8"/>';
      // exhaust
      const ex = A.ex ? pk(A.ex) : pk(['dual', 'quad', 'center', 'none', 'side']);
      if (ex !== 'none' && B.tail !== 'bed') { if (ex === 'side') post += '<rect x="' + f(B.xr + B.arR + 4) + '" y="' + f(B.sill - 1) + '" width="' + f(A.ex ? 34 : 22) + '" height="' + (A.ex ? 4 : 3) + '" rx="2" fill="#9aa0b0"/>'; else for (let i = 0; i < (ex === 'quad' ? 2 : 1); i++) post += '<rect x="' + f(x0 - 3) + '" y="' + f(B.sill - 3 - i * 4) + '" width="6" height="3" rx="1.5" fill="#3a3d48"/>'; }
      if (A.wbar) { const wbx = Math.max(4, x0 - 30); post += '<path d="M' + f(x0 + 6) + ',' + f(B.sill - 2) + ' L' + f(wbx) + ',' + f(GY - 5) + '" stroke="#2a2c36" stroke-width="2.4"/><circle cx="' + f(wbx) + '" cy="' + f(GY - 3) + '" r="3" fill="#16181f" stroke="#9aa0b0"/>'; }
      main = '<g' + tf + '>' + main + '</g>' + wh + '<g' + tf + '>' + post + '</g>';
    }
    const gy = GY;
    let s = '<svg viewBox="0 0 320 ' + (opt.bg ? 170 : 145) + '" xmlns="http://www.w3.org/2000/svg" class="art-car"><defs>' + defs + '</defs>';
    if (opt.bg) s += '<rect width="320" height="170" fill="#07080f"/><rect y="' + (gy - 4) + '" width="320" height="' + (170 - gy + 4) + '" fill="#0d0f1a"/><ellipse cx="160" cy="' + (gy - 20) + '" rx="190" ry="80" fill="url(#sp' + id + ')"/><path d="M0,' + (gy - 4) + ' L320,' + (gy - 4) + '" stroke="rgba(255,255,255,.08)"/>';
    s += '<ellipse cx="' + f((x0 + x1) / 2) + '" cy="' + gy + '" rx="' + f(shadowW) + '" ry="6" fill="#000" opacity=".7" filter="url(#fb' + id + ')"/>';
    if (opt.bg && refl) s += '<g opacity=".12" transform="translate(0,' + (gy * 2) + ') scale(1,-1)"><path d="' + refl + '" fill="' + col + '"/></g>';
    return s + main + '</svg>';
  }
  const LABEL = { wedgeSuper: 'Wedge supercar', curvySuper: 'Curvy supercar', hyperCanopy: 'Canopy hypercar', lemans: 'Endurance racer', fastbackGT: 'Fastback GT', targaGT: 'Targa / roadster', shootingBrake: 'Shooting brake', sedan: 'Sedan', fastSedan: 'Fastback sedan', limo: 'Limousine', hatch: 'Hatchback', rallyHatch: 'Rally hatch', microcar: 'Microcar', bubbleCar: 'Bubble car', van: 'Van', boxySUV: 'Boxy SUV', crossover: 'Crossover', offroader: 'Off-roader', pickup: 'Pickup', cyberTruck: 'Faceted truck', tearEV: 'Teardrop EV', muscle: 'Muscle car', lowrider: 'Lowrider', tailfin: 'Tailfin cruiser', pontoon: 'Pontoon classic', vintage: 'Vintage roadster', hotrod: 'Hot rod', formula: 'Open-wheel racer', buggy: 'Dune buggy',
    cityCar: 'City car', hotHatch: 'Hot hatch', keiCar: 'Kei box car', retroHatch: 'Retro hatch', liftback: 'Liftback', tukTuk: 'Three-wheeler', wagon: 'Estate wagon', hearse: 'Coachbuilt hearse', taxiCab: 'Taxi cab', sleeper: 'Sleeper sedan', executive: 'Executive saloon', armored: 'Armored sedan', coupeSUV: 'Coupe SUV', safari: 'Overland safari', sixWheeler: '6x6 truck', stretchSUV: 'Stretch SUV', minivan: 'Minivan', camper: 'Pop-top camper', kammEV: 'Kammback EV', solarCar: 'Solar racer', podCar: 'Autonomous pod', evSedan: 'EV sedan', evCrossover: 'EV crossover', evHyper: 'Electric hypercar', evVan: 'Electric van', evRoadster: 'EV roadster',
    grandTourer: 'Grand tourer', speedster: 'Speedster', barchetta: 'Barchetta', boatTail: 'Boat-tail coupe', gullwing: 'Gullwing coupe', retroGT: 'Retro GT', splitWindow: 'Split-window coupe', aeroCoupe: 'Streamliner coupe', gasser: 'Gasser', funnyCar: 'Funny car', proStreet: 'Pro-street', muscleWagon: 'Muscle wagon', ponyCar: 'Pony car', ratRod: 'Rat rod', dragster: 'Top-fuel dragster', driftCar: 'Drift car', timeAttack: 'Time-attack build', stanceCar: 'Stance build', midTarga: 'Mid-engine targa', frontSuper: 'Front-engine super', trackToy: 'Track toy', retroWedge: 'Retro wedge', finSuper: 'Fin supercar',
    longtail: 'Longtail hypercar', lmpOpen: 'Open prototype', sharkHyper: 'Shark-fin hyper', landSpeed: 'Land-speed streamliner', indyCar: 'Oval racer', jetCar: 'Jet car', kart: 'Race kart', woodie: 'Woodie wagon', artDeco: 'Art-deco streamliner', townCar: 'Town car', luxCoupe70: '70s luxury coupe', classicPickup: 'Classic pickup', roadster30s: '30s roadster', gangster: '20s sedan', monsterTruck: 'Monster truck', towTruck: 'Tow truck', iceCream: 'Ice-cream van', trophyTruck: 'Trophy truck', keiTruck: 'Kei truck', dually: 'Dually pickup', boxTruck: 'Box truck', cabOver: 'Cab-over tractor' };
  Art.DESIGN_LABEL = LABEL;
  Art.carArt2 = art; Art.AR = AR;
  const prev = Art.carArt;
  Art.carArt = function (m, color, opt) { if (m.brand !== 'Signature') return art(m, color || m.color, opt); return prev(m, color, opt); };
  // every car gets its own design type label
  // v6: each class cycles through its 10 body types so all 100 appear in the catalog
  const cnt = {};
  Art.CARS.forEach(m => { if (m.brand === 'Signature') return; const L2 = BY_CLASS[m.cls] || BY_CLASS.super, k = cnt[m.cls] = (cnt[m.cls] || 0) + 1; m._arch = L2[(k - 1) % L2.length]; delete m._d2; m.design = design(m).arch; });
  Art.BY_CLASS = BY_CLASS;
})(typeof window !== 'undefined' ? window : globalThis);
