/* Glasspad beat engine — 50 original dark-trap beats generated live with WebAudio.
   Style reference (analysed from the user's track): ~92 BPM with double-time hats, centred on Eb,
   heavy 808 sub on the root, 2-bar loop moving root → b2 (dark half step) and root → 4th, triplet hat rolls. */
(function (G) {
  'use strict';
  function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const KEYN = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const W1 = ['Trench', 'Rug', 'Bonded', 'Jeet', 'Sniper', 'Whale', 'Lambo', 'Dubai', 'Moon', 'Exit', 'Bag', 'Candle', 'Raydium', 'Degen', 'Paper', 'Diamond', 'Liquidity', 'Pump', 'Wick', 'Floor', 'Bundle', 'Dev', 'KOL', 'Alpha', 'Larp', 'Lobby', 'Penthouse', 'Solana', 'Curve', 'Mint'];
  const W2 = ['Season', 'Szn', 'Anthem', 'Freestyle', 'Flow', 'Mode', 'Talk', 'Life', 'Dreams', 'Nights', 'Paranoia', 'Rush', 'Theory', 'Gang', 'Wave', 'Run', 'Pressure', 'Riches', 'Ritual', 'Fever'];
  const SCALES = { phrygian: [0, 1, 3, 5, 7, 8, 10], hminor: [0, 2, 3, 5, 7, 8, 11], phrydom: [0, 1, 4, 5, 7, 8, 10], minor: [0, 2, 3, 5, 7, 8, 10] };
  const PROGS = [[0, 1], [0, 5], [0, 1, 0, 5], [0, -1, 0, 5], [0, 8, 5, 1], [0, 3, 1, 0], [0, 1, 3, 1], [0, 5, 3, 1], [0, -2, -4, -1], [0, 0, 1, 1]];
  const KICKS = [
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0], [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0], [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0]
  ];

  function makeTrack(i) {
    const r = rng(9001 + i * 7919);
    const pick = a => a[Math.floor(r() * a.length)];
    const wpick = ws => { let t = 0; ws.forEach(w => t += w[1]); let x = r() * t; for (const w of ws) { x -= w[1]; if (x <= 0) return w[0]; } return ws[0][0]; };
    const root = wpick([[3, 14], [2, 2], [4, 2], [5, 2], [1, 2], [0, 1], [6, 1]]);
    const scaleName = wpick([['phrygian', 4], ['hminor', 3], ['phrydom', 2], ['minor', 2]]);
    const scale = SCALES[scaleName];
    const bpm = pick([86, 88, 90, 92, 92, 92, 94, 96, 98]);
    const prog = pick(PROGS);
    const kick = pick(KICKS);
    const halftime = r() < 0.45;
    const lead = pick(['bell', 'bell', 'pluck', 'flute', 'keys']);
    const counter = r() < 0.5 ? pick(['bell', 'pluck', 'flute']) : null;
    const pad = r() < 0.7;
    // two-bar melody motif on a 16th grid, mostly root / b2 / 5th like the reference
    const mel = [];
    for (let s = 0; s < 32; s++) {
      if (r() < (s % 4 === 0 ? 0.62 : s % 2 === 0 ? 0.34 : 0.14)) {
        const deg = wpick([[0, 5], [1, 3], [2, 2], [4, 3], [5, 2], [6, 1], [3, 1]]);
        mel.push({ s, deg, oct: r() < 0.2 ? 1 : 0, len: pick([1, 2, 2, 3, 4]) });
      }
    }
    const cmel = counter ? mel.filter(() => r() < 0.5).map(n => ({ s: (n.s + 2) % 32, deg: (n.deg + 2) % 7, oct: 1, len: 1 })) : [];
    const hatRate = pick([2, 2, 1]); // 2 = 16ths, 1 = 8ths
    const rollP = 0.12 + r() * 0.2;
    const name = W1[Math.floor(r() * W1.length)] + ' ' + W2[Math.floor(r() * W2.length)];
    return { i, name, root, scale, scaleName, bpm, prog, kick, halftime, lead, counter, pad, mel, cmel, hatRate, rollP, seed: 9001 + i * 7919, key: KEYN[root] + (scaleName === 'phrydom' ? ' phrygian dom.' : scaleName === 'hminor' ? ' harmonic minor' : scaleName === 'phrygian' ? ' phrygian' : ' minor') };
  }
  const TRAP = []; for (let i = 0; i < 50; i++) TRAP.push(makeTrack(i));

  // ---------- CRYSTAL style (default) ----------
  // Re-analysis of the reference: drums ≈3% of energy and soft, melody = glassy bell tones in octaves 5–7
  // with long ringing decays, slow phrasing (~1 note / 2 beats), clean sustained sub, Eb minor / dorian colour.
  const CW1 = ['Crystal', 'Glass', 'Diamond', 'Prism', 'Ice', 'Halo', 'Mirror', 'Neon', 'Satellite', 'Aurora', 'Starlight', 'Opal', 'Frost', 'Velvet', 'Silver', 'Moonlit', 'Cloud', 'Echo', 'Angel', 'Lucid'];
  const CW2 = ['Bitcoin', 'Trenches', 'Wallet', 'Dreams', 'Chart', 'Curve', 'Candles', 'Nights', 'Rain', 'Skyline', 'Bags', 'Heart', 'Signals', 'Lobby', 'Penthouse', 'Highs', 'Tears', 'Waves', 'Ledger', 'Runner'];
  const QUAL = { m9: [0, 3, 7, 10, 14], maj7: [0, 4, 7, 11, 14], m7: [0, 3, 7, 10], sus2: [0, 2, 7, 12], add9: [0, 4, 7, 14], m11: [0, 3, 7, 10, 17], dom9: [0, 4, 10, 14] };
  // roots are semitones from the key centre (Eb by default)
  const CPROGS = [
    [[0, 'm9'], [8, 'maj7'], [3, 'maj7'], [10, 'add9']],      // i  VI  III  VII
    [[0, 'm9'], [5, 'm7'], [10, 'sus2'], [3, 'maj7']],        // i  iv  VII  III
    [[8, 'maj7'], [10, 'add9'], [0, 'm9'], [0, 'm11']],       // VI VII i  i
    [[0, 'm11'], [-2, 'add9'], [-4, 'maj7'], [-2, 'sus2']],   // i  VII VI VII
    [[3, 'maj7'], [10, 'add9'], [0, 'm9'], [8, 'maj7']],      // III VII i VI
    [[0, 'm9'], [3, 'maj7'], [8, 'maj7'], [5, 'm7']],         // i  III VI iv
    [[5, 'm9'], [0, 'm7'], [8, 'maj7'], [10, 'dom9']],        // iv i  VI VII
    [[0, 'm9'], [0, 'm9'], [8, 'maj7'], [10, 'sus2']]         // i  i  VI VII
  ];
  const DORIAN = [0, 2, 3, 5, 7, 9, 10], AEOL = [0, 2, 3, 5, 7, 8, 10];
  function makeCrystal(i) {
    const r = rng(4242 + i * 6007);
    const pick = a => a[Math.floor(r() * a.length)];
    const wpick = ws => { let t = 0; ws.forEach(w => t += w[1]); let x = r() * t; for (const w of ws) { x -= w[1]; if (x <= 0) return w[0]; } return ws[0][0]; };
    const root = wpick([[3, 16], [1, 3], [5, 3], [8, 2], [10, 2], [6, 2]]);
    const scale = r() < 0.6 ? DORIAN : AEOL;
    const bpm = pick([88, 90, 92, 92, 92, 94, 96]);
    const prog = pick(CPROGS);
    // slow, singing hook: one note on most half-beats of a 4-bar phrase, mostly on beats, with twinkle grace notes
    const hook = [];
    for (let s = 0; s < 64; s += 2) {
      const onBeat = s % 4 === 0, p = onBeat ? (s % 16 === 0 ? 0.8 : s % 8 === 0 ? 0.42 : 0.22) : 0.05;
      if (r() < p) {
        const deg = wpick([[0, 4], [2, 4], [4, 4], [1, 2], [5, 2], [6, 2], [3, 1]]);
        hook.push({ s, deg, oct: wpick([[5, 5], [6, 4], [7, 1]]), len: pick([4, 6, 8, 8]), grace: r() < 0.15 });
      }
    }
    const answer = hook.filter(() => r() < 0.3).map(n => ({ s: (n.s + 32) % 64, deg: (n.deg + pick([2, 4, -1])) | 0, oct: n.oct, len: n.len, grace: false }));
    const ratio = pick([3.01, 3.5, 4.0, 5.0, 7.0]);  // bell / glass partial ratios
    const glitter = 0.25 + r() * 0.5;
    const hats = pick(['eighth', 'eighth', 'sixteenth', 'sparse']);
    const kickPat = pick([[0, 10], [0, 7, 10], [0, 11], [0, 6, 10], [0]]);
    const half = r() < 0.6;
    const name = CW1[Math.floor(r() * CW1.length)] + ' ' + CW2[Math.floor(r() * CW2.length)];
    return { i, style: 'crystal', name, root, scale, bpm, prog, hook, answer, ratio, glitter, hats, kickPat, half, seed: 4242 + i * 6007,
      key: KEYN[root] + (scale === DORIAN ? ' dorian' : ' minor') };
  }
  const CRYSTAL = []; for (let i = 0; i < 50; i++) CRYSTAL.push(makeCrystal(i));
  // song form for crystal: intro / verse / pre / chorus / break / chorus / outro  (bars)
  const CPLAN = [['intro', 4], ['verse', 8], ['pre', 4], ['chorus', 8], ['break', 4], ['chorus', 8], ['outro', 4]];
  const CPLAN_BARS = CPLAN.reduce((a, p) => a + p[1], 0);
  function csec(bar) { let b = bar; for (const p of CPLAN) { if (b < p[1]) return [p[0], b, p[1]]; b -= p[1]; } return ['outro', 0, 4]; }
  let TRACKS = CRYSTAL;
  // section plan in bars: intro, A, B, break, A, outro  (~32 bars ≈ 80 s at 92 BPM, like the reference)
  const PLAN = [['intro', 4], ['A', 8], ['B', 8], ['break', 2], ['A', 8], ['outro', 2]];
  const PLAN_BARS = PLAN.reduce((a, p) => a + p[1], 0);
  function sectionAt(bar) { let b = bar % PLAN_BARS; for (const p of PLAN) { if (b < p[1]) return p[0]; b -= p[1]; } return 'A'; }

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  const M = {
    style: 'crystal', get TRACKS() { return this.style === 'trap' ? TRAP : CRYSTAL; }, ctx: null, out: null, on: false, idx: 0, vol: 0.55, shuffle: false, onChange: null,
    step: 0, nextT: 0, timer: null, noise: null, verb: null, dist: null,
    attach(ctx) {
      if (!ctx || this.ctx === ctx) return;
      this.ctx = ctx;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
      this.out = ctx.createGain(); this.out.gain.value = this.vol * 0.9;
      comp.connect(this.out); this.out.connect(ctx.destination); this.bus = comp;
      // noise buffer
      const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = nb;
      // reverb (generated impulse)
      const len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const x = ir.getChannelData(ch); for (let i = 0; i < len; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
      this.verb = ctx.createConvolver(); this.verb.buffer = ir;
      const vg = ctx.createGain(); vg.gain.value = 0.32; this.verb.connect(vg); vg.connect(comp);
      // 808 distortion
      this.dist = ctx.createWaveShaper(); const cv = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; cv[i] = Math.tanh(x * 2.6); }
      this.dist.curve = cv; const dg = ctx.createGain(); dg.gain.value = 0.55; this.dist.connect(dg); dg.connect(comp);
      // crystal buses: long shimmer reverb, dotted-8th delay, soft drum bus, ducking sub
      const len2 = ctx.sampleRate * 3.8, ir2 = ctx.createBuffer(2, len2, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const x = ir2.getChannelData(ch); let lp = 0; for (let i = 0; i < len2; i++) { const n = Math.random() * 2 - 1; lp = lp * 0.35 + n * 0.65; x[i] = lp * Math.pow(1 - i / len2, 2.4); } }
      this.hall = ctx.createConvolver(); this.hall.buffer = ir2; const hg = ctx.createGain(); hg.gain.value = 0.55; this.hall.connect(hg); hg.connect(comp);
      this.dly = ctx.createDelay(2); this.dlyFb = ctx.createGain(); this.dlyFb.gain.value = 0.26; const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 5200;
      this.dly.connect(dlp); dlp.connect(this.dlyFb); this.dlyFb.connect(this.dly); const dg2 = ctx.createGain(); dg2.gain.value = 0.18; dlp.connect(dg2); dg2.connect(comp); dg2.connect(this.hall);
      this.glass = ctx.createGain(); this.glass.gain.value = 1; this.glass.connect(comp); this.glass.connect(this.hall); this.glass.connect(this.dly);
      this.drums = ctx.createGain(); this.drums.gain.value = 1.35; this.drums.connect(comp);
      this.dverb = ctx.createGain(); this.dverb.gain.value = 0.5; this.dverb.connect(this.hall);
      this.subBus = ctx.createGain(); this.subBus.gain.value = 1; this.subBus.connect(comp);
      // melody filter (opened up after the intro)
      this.melF = ctx.createBiquadFilter(); this.melF.type = 'lowpass'; this.melF.frequency.value = 9000; this.melF.connect(comp); this.melF.connect(this.verb);
    },
    get track() { return this.TRACKS[this.idx]; },
    setStyle(st) { if (st === this.style) return; this.style = st; if (this.on) this.play(this.idx); else if (this.onChange) this.onChange(); },
    play(i) {
      if (!this.ctx) return false;
      if (i != null) this.idx = ((i % 50) + 50) % 50;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.on = true; this.step = 0; this.nextT = this.ctx.currentTime + 0.08;
      clearInterval(this.timer); this.timer = setInterval(() => this.tick(), 25);
      if (this.onChange) this.onChange();
      return true;
    },
    stop() { this.on = false; clearInterval(this.timer); this.timer = null; if (this.onChange) this.onChange(); },
    toggle() { if (this.on) this.stop(); else this.play(); },
    next() { this.play(this.shuffle ? Math.floor(Math.random() * 50) : this.idx + 1); },
    prev() { this.play(this.idx - 1); },
    setVol(v) { this.vol = v; if (this.out) this.out.gain.setTargetAtTime(v * 0.9, this.ctx.currentTime, 0.05); },
    tick() {
      const ctx = this.ctx; if (!ctx || !this.on) return;
      const T = this.track, spb = 60 / T.bpm / 4; // seconds per 16th
      while (this.nextT < ctx.currentTime + 0.14) {
        const bar = Math.floor(this.step / 16);
        if (bar >= (T.style === 'crystal' ? CPLAN_BARS : PLAN_BARS)) { this.next(); return; }
        if (T.style === 'crystal') this.schedC(T, this.step, this.nextT, spb); else this.sched(T, this.step, this.nextT, spb);
        this.nextT += spb; this.step++;
      }
    },
    sched(T, step, t, spb) {
      const bar = Math.floor(step / 16), s = step % 16, sec = sectionAt(bar), s32 = step % 32;
      const pr = T.prog[bar % T.prog.length];
      const full = sec === 'A' || sec === 'B';
      // melody filter sweep in the intro
      if (s === 0) { const f = sec === 'intro' ? 900 + bar * 700 : sec === 'break' ? 1400 : sec === 'outro' ? 1200 : 9000; this.melF.frequency.setTargetAtTime(f, t, 0.3); }
      // lead
      for (const n of T.mel) if (n.s === s32) this.voice(T.lead, t, this.note(T, n.deg, 5 + n.oct, pr * 0), n.len * spb * 1.6, sec === 'B' ? 0.2 : 0.17);
      if (sec === 'B' && T.counter) for (const n of T.cmel) if (n.s === s32) this.voice(T.counter, t, this.note(T, n.deg, 6, 0), spb * 1.4, 0.06);
      if (T.pad && s === 0 && sec !== 'outro') this.pad(t, T, pr, spb * 16);
      if (!full) { if (sec === 'break' && T.hatRate) this.hats(T, s, t, spb, 0.7); return; }
      // drums
      if (T.kick[s]) { this.kick(t); this.b808(t, T.root + 24 + pr, spb * (T.kick[(s + 1) % 16] ? 1 : 4), s === 0 && bar % 2 === 1 ? T.root + 24 + pr + 12 : null); }
      const snareSteps = T.halftime ? [8] : [4, 12];
      if (snareSteps.indexOf(s) >= 0) this.snare(t, T.i % 3 === 0);
      if (!T.halftime && s === 15 && bar % 4 === 3) this.snare(t + spb * 0.5, true, 0.5);
      this.hats(T, s, t, spb, 1);
    },
    schedC(T, step, t, spb) {
      const bar = Math.floor(step / 16), s = step % 16, S = csec(bar), sec = S[0], sb = S[1], sl = S[2];
      const ch = T.prog[bar % 4], chordRoot = 12 * 5 + T.root + ch[0], tones = QUAL[ch[1]];
      const beatT = spb * 4;
      if (step === 0) this.dly.delayTime.setValueAtTime(spb * 3, t);
      // pad + sub sustain per bar
      if (s === 0) {
        if (sec !== 'outro' || sb < 2) this.cpad(t, chordRoot, tones, spb * 16, sec === 'intro' ? 0.6 : sec === 'chorus' ? 1.1 : 0.85);
        if (sec !== 'intro' && sec !== 'break') this.sub(t, 12 * 2 + T.root + ch[0], spb * 16, sec === 'chorus' ? 1 : 0.8);
        if (sec === 'pre' && sb === sl - 1) this.riser(t, spb * 16);
        if (sec === 'chorus' && sb === 0) this.impact(t);
      }
      // hook: verse plays first half of phrase quietly, chorus plays hook + answer, octave lift on the second chorus
      const ph = step % 64;
      const lift = sec === 'chorus' && bar >= CPLAN_BARS - 12 ? 12 : 0;
      const hv = sec === 'chorus' ? 0.17 : sec === 'verse' ? 0.12 : sec === 'pre' ? 0.13 : sec === 'intro' ? 0.1 : sec === 'break' ? 0.11 : 0.08;
      for (const n of T.hook) if (n.s === ph && (sec !== 'verse' || ph < 48)) {
        const m = this.note(T, n.deg, n.oct, 0) + lift;
        if (n.grace && sec !== 'intro') this.crystal(t - spb * 0.25, m + 2, spb * 0.5, hv * 0.45, T.ratio);
        this.crystal(t, m, n.len * spb, hv, T.ratio);
      }
      if (sec === 'chorus' || sec === 'break') for (const n of T.answer) if (n.s === ph) this.crystal(t, this.note(T, n.deg, n.oct + 1, 0) + lift, n.len * spb, hv * 0.5, T.ratio * 1.5);
      // glitter: music-box sparkle on chord tones (triplet feel)
      if ((sec === 'chorus' || sec === 'break') && s % 4 === 0 && Math.random() < T.glitter * 0.3) {
        const k = Math.random() < 0.5 ? 3 : 2;
        for (let j = 0; j < k; j++) this.twinkle(t + j * spb * 4 / 3 / k * (k === 3 ? 1 : 1.5), chordRoot + 24 + tones[Math.floor(Math.random() * tones.length)], 0.045);
      }
      if (sec === 'intro' || sec === 'outro' && sb >= 2) return;
      // soft drums
      const drumsOn = sec === 'verse' || sec === 'pre' || sec === 'chorus';
      if (!drumsOn) { if (sec === 'break' && s % 4 === 2) this.chat(t, 0.05); return; }
      if (T.kickPat.indexOf(s) >= 0) { this.ckick(t); this.duck(t); }
      if (s === (T.half ? 8 : 4) || (!T.half && s === 12)) this.cclap(t);
      if (T.hats === 'sixteenth' || (T.hats === 'eighth' && s % 2 === 0) || (T.hats === 'sparse' && s % 4 === 2)) this.chat(t, (s % 4 === 0 ? 0.075 : 0.05) * (sec === 'chorus' ? 1.15 : 0.9));
      if (s % 4 === 3 && Math.random() < 0.12 && sec === 'chorus') for (let k = 0; k < 3; k++) this.chat(t + k * spb / 3, 0.04 + k * 0.012);
    },
    crystal(t, midi, dur, v, ratio) {
      const c = this.ctx, f = mtof(midi), g = c.createGain(), d = Math.max(1.4, dur * 2.2);
      const car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain();
      car.type = 'sine'; car.frequency.value = f; mod.frequency.value = f * ratio;
      mg.gain.setValueAtTime(f * 1.6, t); mg.gain.exponentialRampToValueAtTime(f * 0.04, t + 0.9);
      mod.connect(mg); mg.connect(car.frequency); car.connect(g);
      const sh = c.createOscillator(), sg = c.createGain(); sh.type = 'sine'; sh.frequency.value = f * 2.003; sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(0.32, t + 0.01); sg.gain.exponentialRampToValueAtTime(0.001, t + d * 0.8); sh.connect(sg); sg.connect(g);
      const bd = c.createOscillator(), bg = c.createGain(); bd.type = 'triangle'; bd.frequency.value = f * 0.5; bg.gain.setValueAtTime(0.18, t); bg.gain.exponentialRampToValueAtTime(0.001, t + 0.5); bd.connect(bg); bg.connect(g);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(v * 0.35, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0008, t + d);
      const ai = c.createOscillator(), ag = c.createGain(); ai.type = 'sine'; ai.frequency.value = Math.min(16000, f * 6.01); ag.gain.setValueAtTime(0.1, t); ag.gain.exponentialRampToValueAtTime(0.0005, t + d * 0.5); ai.connect(ag); ag.connect(g);
      g.connect(this.glass);
      this.noiseHit(t, 0.14, 'highpass', 9500, 0.7, v * 1.1, this.glass);
      [car, mod, sh, bd, ai].forEach(o => { o.start(t); o.stop(t + d + 0.05); });
    },
    twinkle(t, midi, v) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = mtof(midi);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.45);
      o.connect(g); g.connect(this.glass); o.start(t); o.stop(t + 0.5);
    },
    cpad(t, rootMidi, tones, dur, v) {
      const c = this.ctx, g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6;
      lp.frequency.setValueAtTime(700, t); lp.frequency.linearRampToValueAtTime(1500, t + dur * 0.5); lp.frequency.linearRampToValueAtTime(800, t + dur);
      lp.connect(g); g.connect(this.hall); g.connect(this.bus);
      tones.slice(0, 4).forEach((iv, k) => [-7, 7].forEach(dt => { const o = c.createOscillator(); o.type = k === 0 ? 'triangle' : 'sawtooth'; o.frequency.value = mtof(rootMidi - 12 + iv); o.detune.value = dt; o.connect(lp); o.start(t); o.stop(t + dur + 0.6); }));
      const air = c.createOscillator(), ag = c.createGain(); air.type = 'sine'; air.frequency.value = mtof(rootMidi + 12 + tones[2 % tones.length]); ag.gain.value = 0.25; air.connect(ag); ag.connect(lp); air.start(t); air.stop(t + dur + 0.6);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.022 * v, t + Math.min(1.2, dur * 0.3)); g.gain.setValueAtTime(0.022 * v, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
    },
    sub(t, midi, dur, v) {
      const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), g2 = c.createGain();
      o.type = 'sine'; o.frequency.value = mtof(midi); o2.type = 'sine'; o2.frequency.value = mtof(midi + 12); g2.gain.value = 0.22;
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.subBus);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.38 * v, t + 0.03); g.gain.setValueAtTime(0.38 * v, t + dur - 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
      o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
    },
    duck(t) { const g = this.subBus.gain; g.cancelScheduledValues(t); g.setValueAtTime(0.45, t); g.linearRampToValueAtTime(1, t + 0.22); },
    ckick(t) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.08);
      g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(g); g.connect(this.drums); o.start(t); o.stop(t + 0.22);
    },
    cclap(t) {
      for (let k = 0; k < 3; k++) this.noiseHit(t + k * 0.012, 0.025, 'bandpass', 2100, 1.4, 0.32, this.drums);
      this.noiseHit(t + 0.036, 0.22, 'bandpass', 1900, 0.9, 0.22, this.drums); this.noiseHit(t + 0.036, 0.4, 'bandpass', 2400, 0.8, 0.35, this.dverb);
    },
    chat(t, v) { this.noiseHit(t, 0.035, 'highpass', 8000, 0.7, v * 3.4, this.drums); this.noiseHit(t, 0.03, 'bandpass', 12000, 1.2, v * 2.6, this.drums); },
    riser(t, dur) {
      const c = this.ctx, src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(9000, t + dur);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + dur * 0.95); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
      src.connect(f); f.connect(g); g.connect(this.hall); g.connect(this.bus); src.start(t); src.stop(t + dur + 0.1);
    },
    impact(t) { this.noiseHit(t, 1.6, 'lowpass', 3000, 0.5, 0.18, this.hall); const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.8); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.9); o.connect(g); g.connect(this.subBus); o.start(t); o.stop(t + 1); },
    note(T, deg, oct, shift) { const sc = T.scale; const d = ((deg % 7) + 7) % 7; return 12 * (oct + 1) + T.root + sc[d] + shift; },
    hats(T, s, t, spb, g) {
      const r = (T.seed + s * 13 + Math.floor(t * 2)) % 97 / 97;
      if (s % 4 === 3 && Math.random() < T.rollP) { // triplet or 32nd roll leading into the beat
        const n = Math.random() < 0.5 ? 3 : 4; for (let k = 0; k < n; k++) this.hat(t + k * spb / n, 0.11 * g * (0.6 + k / n * 0.5));
        return;
      }
      if (T.hatRate === 2 || s % 2 === 0) this.hat(t, (s % 2 === 0 ? 0.13 : 0.08) * g);
      if (s === 6 && r < 0.4) this.hat(t, 0.08 * g, true);
    },
    kick(t) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.09);
      g.gain.setValueAtTime(0.75, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.3);
    },
    b808(t, midi, dur, glideTo) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
      const f = mtof(midi); o.frequency.setValueAtTime(f * 1.9, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
      if (glideTo != null) { o.frequency.setValueAtTime(f, t + dur * 0.55); o.frequency.exponentialRampToValueAtTime(mtof(glideTo), t + dur * 0.8); }
      const d = Math.max(0.25, dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.42, t + 0.006); g.gain.setValueAtTime(0.42, t + d * 0.6); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g); g.connect(this.dist); o.start(t); o.stop(t + d + 0.05);
    },
    noiseHit(t, dur, type, freq, q, gain, dest) {
      const c = this.ctx, src = c.createBufferSource(); src.buffer = this.noise;
      const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 0.7;
      const g = c.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(f); f.connect(g); g.connect(dest || this.bus); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
    },
    hat(t, v, open) { this.noiseHit(t, open ? 0.24 : 0.04, 'highpass', 6500, 0.8, v * 2.4); this.noiseHit(t, open ? 0.2 : 0.03, 'bandpass', 10500, 1.1, v * 1.6); },
    snare(t, clap, v) {
      v = v || 1;
      if (clap) { for (let k = 0; k < 3; k++) this.noiseHit(t + k * 0.011, 0.02, 'bandpass', 1800, 1.2, 0.5 * v); this.noiseHit(t + 0.033, 0.18, 'bandpass', 1300, 0.9, 0.3 * v, this.verb); this.noiseHit(t + 0.033, 0.16, 'bandpass', 1300, 0.9, 0.3 * v); }
      else {
        this.noiseHit(t, 0.17, 'highpass', 2200, 0.7, 0.6 * v); this.noiseHit(t, 0.08, 'bandpass', 5000, 0.8, 0.3 * v);
        const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.08);
        g.gain.setValueAtTime(0.25 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1); o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.12);
      }
    },
    voice(kind, t, midi, dur, v) {
      const c = this.ctx, f = mtof(midi), g = c.createGain(); g.connect(this.melF);
      if (kind === 'bell') {
        const car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain();
        car.frequency.value = f; mod.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.1, t + 0.5);
        mod.connect(mg); mg.connect(car.frequency); car.connect(g);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.001, t + Math.max(0.6, dur * 2));
        car.start(t); mod.start(t); car.stop(t + Math.max(0.7, dur * 2.1)); mod.stop(t + Math.max(0.7, dur * 2.1));
      } else if (kind === 'pluck') {
        const o = c.createOscillator(), lp = c.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass';
        lp.frequency.setValueAtTime(4200, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.25); o.connect(lp); lp.connect(g);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * 0.75, t + 0.004); g.gain.exponentialRampToValueAtTime(0.001, t + Math.max(0.3, dur));
        o.start(t); o.stop(t + Math.max(0.35, dur + 0.05));
      } else if (kind === 'keys') {
        [1, 2.001].forEach((m, k) => { const o = c.createOscillator(); o.type = k ? 'sine' : 'triangle'; o.frequency.value = f * m; o.connect(g); o.start(t); o.stop(t + dur + 0.6); });
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * 0.8, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.55);
      } else { // flute
        const o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(); o.type = 'triangle'; o.frequency.value = f;
        lfo.frequency.value = 5.2; lg.gain.value = f * 0.012; lfo.connect(lg); lg.connect(o.frequency); o.connect(g);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * 0.9, t + 0.06); g.gain.setValueAtTime(v * 0.9, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.2);
        o.start(t); lfo.start(t); o.stop(t + dur + 0.25); lfo.stop(t + dur + 0.25);
      }
    },
    pad(t, T, pr, dur) {
      const c = this.ctx, g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.connect(g); g.connect(this.melF);
      const chord = [0, 2, 4].map(d => this.note(T, d, 4, 0) + pr);
      chord.forEach(m => [-6, 6].forEach(dt => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt; o.connect(lp); o.start(t); o.stop(t + dur + 0.1); }));
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.028, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    }
  };
  G.Music = M;
})(typeof window !== 'undefined' ? window : globalThis);
