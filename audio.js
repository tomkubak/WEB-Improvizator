// =====================================================================
//  audio.js – zvuk přímo v prohlížeči (Web Audio, bez nahrávek)
//  klavír: aditivní syntéza s útlumem, kytara: Karplus-Strong (drnkaná struna)
// =====================================================================
(function (root) {
  "use strict";
  let ctx = null, master = null;
  const live = new Set();     // běžící zdroje (kvůli Stop)
  let timers = [];

  function init() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 4;
      master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  const freq = m => 440 * Math.pow(2, (m - 69) / 12);

  function track(node, end) {
    live.add(node);
    node.onended = () => live.delete(node);
    node.stop(end);
  }

  function piano(m, t, vel) {
    const f = freq(m);
    const dur = Math.max(0.9, 3.2 - (m - 48) * 0.04);
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(vel, t + 0.006);
    out.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.25);
    out.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(Math.min(12000, f * 9), t);
    lp.frequency.exponentialRampToValueAtTime(Math.min(9000, f * 2.5), t + dur * 0.6);
    lp.connect(out); out.connect(master);
    [[1, 1, "sine"], [2, 0.35, "sine"], [3, 0.12, "triangle"], [4.01, 0.05, "sine"]].forEach(([h, g, type]) => {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = type; o.frequency.value = f * h; o.detune.value = (h - 1) * 1.5;
      og.gain.value = g;
      o.connect(og); og.connect(lp);
      o.start(t); track(o, t + dur + 0.05);
    });
  }

  const ksCache = new Map();
  function ksBuffer(m) {
    if (ksCache.has(m)) return ksCache.get(m);
    const sr = ctx.sampleRate, f = freq(m), N = Math.max(2, Math.round(sr / f));
    const len = Math.floor(sr * 2.6), buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    const ring = new Float32Array(N);
    let prev = 0;
    for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; prev = prev * 0.45 + r * 0.55; ring[i] = prev; }
    const decay = 0.996 - Math.max(0, m - 64) * 0.0004;
    let idx = 0;
    for (let i = 0; i < len; i++) {
      const nxt = (idx + 1) % N;
      const y = 0.5 * (ring[idx] + ring[nxt]) * decay;
      d[i] = ring[idx];
      ring[idx] = y;
      idx = nxt;
    }
    ksCache.set(m, buf);
    return buf;
  }
  function guitar(m, t, vel) {
    const src = ctx.createBufferSource(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    src.buffer = ksBuffer(m);
    lp.type = "lowpass"; lp.frequency.value = 5200;
    g.gain.setValueAtTime(vel * 1.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
    src.connect(lp); lp.connect(g); g.connect(master);
    src.start(t); track(src, t + 2.6);
  }

  function note(inst, m, t, vel) {
    init();
    (inst === "guitar" ? guitar : piano)(m, t === undefined ? ctx.currentTime + 0.01 : t, vel || 0.5);
  }

  function stop() {
    timers.forEach(clearTimeout); timers = [];
    live.forEach(n => { try { n.stop(); } catch (e) { /* už skončil */ } });
    live.clear();
  }

  // Zahraje řadu tónů; onStep(i) se volá ve chvíli, kdy tón zazní (kvůli zvýraznění).
  function sequence(inst, midis, bpm, onStep, onEnd) {
    init(); stop();
    const beat = 60 / bpm, t0 = ctx.currentTime + 0.05;
    midis.forEach((m, i) => {
      note(inst, m, t0 + i * beat, 0.5);
      timers.push(setTimeout(() => onStep && onStep(i), (0.05 + i * beat) * 1000));
    });
    timers.push(setTimeout(() => onEnd && onEnd(), (0.05 + midis.length * beat + 0.3) * 1000));
  }

  // Akord: kytara drnkne (postupně), klavír zahraje naráz.
  function chord(inst, midis, t, vel) {
    init();
    const start = t === undefined ? ctx.currentTime + 0.02 : t;
    midis.forEach((m, i) => note(inst, m, start + (inst === "guitar" ? i * 0.025 : 0), (vel || 0.32) * (i === 0 ? 1.2 : 1)));
  }

  // Řada akordů, každý na 2 doby.
  function progression(inst, list, bpm, onStep, onEnd) {
    init(); stop();
    const len = 2 * 60 / bpm, t0 = ctx.currentTime + 0.05;
    list.forEach((midis, i) => {
      chord(inst, midis, t0 + i * len);
      timers.push(setTimeout(() => onStep && onStep(i), (0.05 + i * len) * 1000));
    });
    timers.push(setTimeout(() => onEnd && onEnd(), (0.05 + list.length * len + 0.4) * 1000));
  }

  root.Sound = { init, note, chord, sequence, progression, stop };
})(window);
