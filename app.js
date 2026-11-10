// =====================================================================
//  app.js – uživatelské rozhraní: ovládání, klavír, kytara, kruh, nápady
// =====================================================================
(function () {
  "use strict";
  const T = window.Theory, S = window.Sound;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ------------------------------------------------------------- stav
  const state = { inst: "piano", pc: 0, spell: null, scale: "major", cz: true, hand: "R", pos: 0,
                  label: "finger", chordSize: 3, tempo: 110, chord: null, sheet: null };

  function load() {
    try { Object.assign(state, JSON.parse(localStorage.getItem("improvizator") || "{}")); } catch (e) { /* nic */ }
    const m = location.hash.match(/^#(piano|guitar)\/(\d+)(?:\.(\d)\.(-?\d))?\/(\w+)/);
    if (m) {
      state.inst = m[1]; state.pc = +m[2] % 12;
      state.spell = m[3] !== undefined ? { letter: +m[3], acc: +m[4] } : null;
      if (T.SCALE[m[5]]) state.scale = m[5];
    }
    if (!T.SCALE[state.scale]) state.scale = "major";
    if (![3, 4, 5].includes(state.chordSize)) state.chordSize = state.sevenths ? 4 : 3;   // starší uložený stav
    delete state.sevenths;
    state.chord = null; state.sheet = null;
  }
  function save() {
    try { localStorage.setItem("improvizator", JSON.stringify(Object.assign({}, state, { chord: null, sheet: null }))); } catch (e) { /* nic */ }
    const sp = state.spell ? `.${state.spell.letter}.${state.spell.acc}` : "";
    history.replaceState(null, "", `#${state.inst}/${state.pc}${sp}/${state.scale}`);
  }

  function rootNote() {
    if (state.spell) {
      const r = T.rootSpellings(state.pc).find(x => x.letter === state.spell.letter && x.acc === state.spell.acc);
      if (r) return r;
    }
    return T.bestRoot(state.pc, state.scale);
  }
  const N = n => T.noteName(n, state.cz);
  const KEY = (r, id) => T.keyName(r, id, state.cz);

  function data() {
    const r = rootNote(), sc = T.SCALE[state.scale];
    const notes = T.spell(r, sc), formula = T.formula(sc);
    const pcIdx = new Map();
    notes.forEach((n, i) => { if (!pcIdx.has(n.pc)) pcIdx.set(n.pc, i); });
    return { r, sc, notes, formula, pcIdx };
  }

  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.className = "show";
    clearTimeout(t._h); t._h = setTimeout(() => t.className = "", 2200);
  }

  // ------------------------------------------------------------- SVG pomocníci
  const SVGNS = "http://www.w3.org/2000/svg";
  function svgEl(markup, vb, cls) {
    return `<svg xmlns="${SVGNS}" viewBox="${vb}" class="${cls || ""}" role="img">${markup}</svg>`;
  }
  const DEFS = `<defs>
    <linearGradient id="ivory" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3e7cc"/><stop offset=".85" stop-color="#fff9ec"/><stop offset="1" stop-color="#d9c9a6"/></linearGradient>
    <linearGradient id="ebony" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a302a"/><stop offset=".8" stop-color="#14100d"/><stop offset="1" stop-color="#050403"/></linearGradient>
    <linearGradient id="brassBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d995"/><stop offset=".5" stop-color="#c9a35a"/><stop offset="1" stop-color="#7a5a26"/></linearGradient>
    <linearGradient id="felt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a2418"/><stop offset="1" stop-color="#3d0f09"/></linearGradient>
    <linearGradient id="rosewood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2216"/><stop offset=".5" stop-color="#2a170e"/><stop offset="1" stop-color="#1c0f08"/></linearGradient>
    <radialGradient id="amber" cx=".38" cy=".32"><stop offset="0" stop-color="#ffe7b0"/><stop offset=".5" stop-color="#ffb35c"/><stop offset="1" stop-color="#c46416"/></radialGradient>
    <radialGradient id="copper" cx=".38" cy=".32"><stop offset="0" stop-color="#ffd2b0"/><stop offset=".45" stop-color="#d9773c"/><stop offset="1" stop-color="#6e2a0c"/></radialGradient>
    <radialGradient id="dimbrass" cx=".38" cy=".32"><stop offset="0" stop-color="#a88a54"/><stop offset="1" stop-color="#4d3a1a"/></radialGradient>
    <radialGradient id="bluenote" cx=".38" cy=".32"><stop offset="0" stop-color="#e2f0ff"/><stop offset=".5" stop-color="#7fb2e6"/><stop offset="1" stop-color="#2c5a8c"/></radialGradient>
    <radialGradient id="brassKnob" cx=".38" cy=".32"><stop offset="0" stop-color="#fff3c8"/><stop offset=".45" stop-color="#c9a35a"/><stop offset="1" stop-color="#7a5a26"/></radialGradient>
    <radialGradient id="pearl" cx=".4" cy=".35"><stop offset="0" stop-color="#fffdf6"/><stop offset=".6" stop-color="#d9d2c0"/><stop offset="1" stop-color="#9c9480"/></radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="glowStrong" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity=".7"/></filter>
  </defs>`;
  const rivet = (x, y) => `<circle cx="${x}" cy="${y}" r="3.2" fill="url(#brassKnob)" stroke="#3b2810" stroke-width=".8"/>`;

  // značka tónu (kolečko s popiskem)
  function marker(cx, cy, r, fill, label, opts) {
    opts = opts || {};
    const fs = r * (String(label).length > 2 ? 0.72 : String(label).length > 1 ? 0.88 : 1.05);
    return `<g class="mk" filter="url(#shadow)">` +
      (opts.chord ? `<circle class="ring" cx="${cx}" cy="${cy}" r="${r + 4}"/>` : "") +
      `<circle class="dot" cx="${cx}" cy="${cy}" r="${r}" fill="url(#${fill})" stroke="${opts.stroke || "#3b2008"}" stroke-width="1.2"${opts.glow ? ' filter="url(#glow)"' : ""}/>` +
      (label !== "" ? `<text x="${cx}" y="${cy + fs * 0.36}" text-anchor="middle" font-family="EB Garamond,Georgia,serif" font-weight="700" font-size="${fs}" fill="${opts.text || "#2a1404"}">${esc(label)}</text>` : "") +
      `</g>`;
  }

  // ------------------------------------------------------------- KLAVÍR
  const P = { WK: 48, WH: 210, BK: 30, BH: 132, X0: 22, TOP: 50, LOW: 48, MIDI0: 48, MIDI1: 72 };

  function pianoLayout() {
    const keys = [];
    let wi = 0;
    for (let m = P.MIDI0; m <= P.MIDI1; m++) {
      const black = T.isBlack(m % 12);
      if (!black) { keys.push({ m, black, x: P.X0 + wi * P.WK, w: P.WK, h: P.WH }); wi++; }
      else keys.push({ m, black, x: P.X0 + wi * P.WK - P.BK / 2, w: P.BK, h: P.BH });
    }
    return { keys, width: P.X0 * 2 + wi * P.WK };
  }

  function drawPiano(d) {
    const { keys, width } = pianoLayout();
    const H = P.TOP + P.WH + P.LOW + 6;
    const r0 = P.MIDI0 + d.r.pc;
    const octave = d.notes.map(n => r0 + T.mod(n.pc - d.r.pc, 12)).concat([r0 + 12]);
    const pcs = d.notes.map(n => n.pc);
    const fR = T.pianoFingering(pcs, "R"), fL = T.pianoFingering(pcs, "L");
    const chord = state.chord ? new Set(state.chord.pcs) : null;
    const charPc = d.sc.color ? d.notes[d.sc.color.i].pc : -1;
    const y0 = P.TOP;
    let s = DEFS;
    // rám
    s += `<rect x="4" y="${y0 - 16}" width="${width - 8}" height="${P.WH + 30}" rx="8" fill="url(#brassBar)" stroke="#3b2810"/>`;
    s += `<rect x="${P.X0 - 4}" y="${y0 - 9}" width="${width - 2 * P.X0 + 8}" height="9" fill="url(#felt)"/>`;
    s += rivet(12, y0 - 7) + rivet(width - 12, y0 - 7) + rivet(12, y0 + P.WH + 4) + rivet(width - 12, y0 + P.WH + 4);
    const keyMarkup = k => {
      const pc = k.m % 12, inScale = d.pcIdx.has(pc), inOct = octave.includes(k.m);
      let g = `<g class="key" data-m="${k.m}" id="k${k.m}">`;
      g += `<rect class="kbody" x="${k.x + 0.5}" y="${y0}" width="${k.w - 1}" height="${k.h}" rx="${k.black ? 3 : 5}" fill="url(#${k.black ? "ebony" : "ivory"})" stroke="#3b2a1a" stroke-width="1"/>`;
      if (k.black) g += `<rect x="${k.x + 4}" y="${y0 + 2}" width="${k.w - 8}" height="${k.h - 14}" rx="2" fill="rgba(255,255,255,.07)"/>`;
      const cx = k.x + k.w / 2, cy = y0 + k.h - (k.black ? 22 : 28), rr = k.black ? 12.5 : 15;
      if (inScale) {
        const i = d.pcIdx.get(pc);
        const fill = pc === d.r.pc ? "copper" : (state.scale === "blues" && i === 3 ? "bluenote" : (inOct ? "amber" : "dimbrass"));
        g += marker(cx, cy, rr, fill, N(d.notes[i]), { glow: inOct, chord: chord && chord.has(pc), stroke: pc === charPc ? "#fff2c0" : null,
          text: inOct || pc === d.r.pc ? "#2a1404" : "#f1e4c8" });
      } else if (chord && chord.has(pc)) {
        g += `<circle class="ring" cx="${cx}" cy="${cy}" r="${rr - 3}"/>`;
      }
      return g + `</g>`;
    };
    keys.filter(k => !k.black).forEach(k => s += keyMarkup(k));
    keys.filter(k => k.black).forEach(k => s += keyMarkup(k));
    // prstoklady
    const fingerRow = (fs, y, fill, label) => {
      let r = `<text x="6" y="${y + 5}" font-family="Cinzel,serif" font-size="12" font-weight="700" fill="#c9a35a">${label}</text>`;
      octave.forEach((m, i) => {
        const k = keys.find(q => q.m === m);
        r += `<line x1="${k.x + k.w / 2}" y1="${y + (y < y0 ? 14 : -14)}" x2="${k.x + k.w / 2}" y2="${y < y0 ? y0 - 9 : y0 + P.WH + 2}" stroke="${fill === "brassKnob" ? "#c9a35a" : "#c0703f"}" stroke-width="1.2" stroke-dasharray="2 3" opacity=".7"/>`;
        r += marker(k.x + k.w / 2, y, 13, fill, fs[i], { text: "#2a1404" });
      });
      return r;
    };
    if (state.hand !== "L") s += fingerRow(fR, 20, "brassKnob", "P");
    if (state.hand !== "R") s += fingerRow(fL, y0 + P.WH + 30, "copper", "L");
    $("stage").className = "stage piano";
    $("stage").innerHTML = svgEl(s, `0 0 ${width} ${H}`);
    $("stage").querySelectorAll(".key").forEach(el => el.addEventListener("click", () => {
      const m = +el.dataset.m; S.note("piano", m + 12); flash("k" + m);
    }));

    $("legend").innerHTML =
      `<span><i style="background:radial-gradient(circle at 35% 30%,#ffd2b0,#d9773c 45%,#6e2a0c)"></i>tónika</span>` +
      `<span><i style="background:radial-gradient(circle at 35% 30%,#ffe7b0,#ffb35c 50%,#c46416)"></i>tóny stupnice (hraná oktáva)</span>` +
      `<span><i style="background:radial-gradient(circle,#a88a54,#4d3a1a)"></i>stejné tóny jinde</span>` +
      (state.hand !== "L" ? `<span><i style="background:radial-gradient(circle at 35% 30%,#fff3c8,#c9a35a 45%,#7a5a26)"></i>P = prsty pravé ruky (1 = palec)</span>` : "") +
      (state.hand !== "R" ? `<span><i style="background:radial-gradient(circle at 35% 30%,#ffd2b0,#d9773c 45%,#6e2a0c)"></i>L = prsty levé ruky</span>` : "") +
      (state.chord ? `<span><i style="border:3px solid #6cc4b0"></i>tóny akordu ${esc(state.chord.name)}</span>` : "");
    const fmt = f => f.join(" ");
    $("instHelp").innerHTML = `Prstoklad nahoru (dolů obráceně): pravá ruka <b>${fmt(fR)}</b>, levá ruka <b>${fmt(fL)}</b>. ` +
      `Palec (1) chodí na bílé klávesy – pod prsty se podsouvá hned za černou klávesou. Klepnutím na klávesu ji uslyšíš.`;
    return octave;
  }

  // ------------------------------------------------------------- KYTARA
  const G = { FRETS: 17, X0: 76, X1: 1110, Y0: 34, SP: 33 };
  const fx = f => G.X0 + (G.X1 - G.X0) * (1 - Math.pow(2, -f / 12)) / (1 - Math.pow(2, -G.FRETS / 12));
  const noteX = f => f === 0 ? G.X0 - 26 : (fx(f - 1) + fx(f)) / 2;
  const strY = s => G.Y0 + (5 - s) * G.SP;

  function drawGuitar(d) {
    const positions = T.guitarPositions(d.r, state.scale);
    if (state.pos >= positions.length) state.pos = 0;
    const pos = state.pos >= 0 ? positions[state.pos] : null;
    const inPos = new Map();
    if (pos) pos.notes.forEach(n => inPos.set(n.string + ":" + n.fret, n));
    const chord = state.chord ? new Set(state.chord.pcs) : null;
    const charPc = d.sc.color ? d.notes[d.sc.color.i].pc : -1;
    const W = G.X1 + 20, H = G.Y0 + 5 * G.SP + 52;
    let s = DEFS;
    const yTop = G.Y0 - 18, yBot = G.Y0 + 5 * G.SP + 18;
    s += `<rect x="${G.X0}" y="${yTop}" width="${G.X1 - G.X0}" height="${yBot - yTop}" fill="url(#rosewood)" stroke="#120a05"/>`;
    s += `<rect x="${G.X0}" y="${yTop}" width="${G.X1 - G.X0}" height="${yBot - yTop}" fill="url(#grain)" opacity=".25"/>`;
    // vykládání
    const inlay = (x, y) => `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" transform="rotate(45 ${x} ${y})" fill="url(#pearl)" opacity=".28"/>`;
    [3, 5, 7, 9, 15, 17].forEach(f => s += inlay(noteX(f), (yTop + yBot) / 2));
    s += inlay(noteX(12), G.Y0 + 1.5 * G.SP) + inlay(noteX(12), G.Y0 + 3.5 * G.SP);
    // vyznačená poloha
    if (pos) {
      const a = pos.min === 0 ? G.X0 - 44 : fx(pos.min - 1) + 2, b = fx(pos.max) - 2;
      s += `<rect x="${a}" y="${yTop - 10}" width="${b - a}" height="${yBot - yTop + 20}" rx="10" fill="rgba(243,217,149,.10)" stroke="#c9a35a" stroke-width="1.5" stroke-dasharray="6 4"/>`;
    }
    // pražce, nultý pražec
    for (let f = 1; f <= G.FRETS; f++) s += `<rect x="${fx(f) - 1.6}" y="${yTop}" width="3.2" height="${yBot - yTop}" fill="url(#brassBar)"/>`;
    s += `<rect x="${G.X0 - 7}" y="${yTop - 2}" width="8" height="${yBot - yTop + 4}" rx="2" fill="url(#ivory)" stroke="#5a4528"/>`;
    // struny
    const names = state.cz ? ["E", "A", "D", "G", "H", "e"] : ["E", "A", "D", "G", "B", "e"];
    for (let st = 0; st < 6; st++) {
      const y = strY(st), w = [3.2, 2.7, 2.2, 1.7, 1.3, 1][st];
      s += `<line x1="${G.X0 - 40}" y1="${y}" x2="${G.X1}" y2="${y}" stroke="${st < 3 ? "#c49a5c" : "#d8d4cc"}" stroke-width="${w}" opacity=".9"/>`;
      s += `<text x="${G.X0 - 60}" y="${y + 5}" text-anchor="middle" font-family="Cinzel,serif" font-weight="700" font-size="14" fill="#c9a35a">${names[st]}</text>`;
    }
    [3, 5, 7, 9, 12, 15, 17].forEach(f => s += `<text x="${noteX(f)}" y="${H - 8}" text-anchor="middle" font-family="EB Garamond,serif" font-size="15" fill="#b39b78">${f}</text>`);
    // tóny
    for (let st = 0; st < 6; st++) for (let f = 0; f <= G.FRETS; f++) {
      const pc = (T.GUITAR.open[st] + f) % 12;
      const inS = d.pcIdx.has(pc);
      const cx = noteX(f), cy = strY(st);
      if (!inS) {
        if (chord && chord.has(pc)) s += `<circle class="ring" cx="${cx}" cy="${cy}" r="8"/>`;
        continue;
      }
      const i = d.pcIdx.get(pc);
      const pn = inPos.get(st + ":" + f);
      const bright = !pos || !!pn;
      const isRoot = pc === d.r.pc, isBlue = state.scale === "blues" && i === 3;
      let label = "";
      if (bright) {
        if (state.label === "finger" && pn) label = pn.finger === 0 ? "0" : pn.finger;
        else if (state.label === "degree") label = d.formula[i];
        else label = N(d.notes[i]);
      }
      const id = `g${st}-${f}`;
      if (bright) {
        s += `<g class="gnote" id="${id}" data-m="${T.GUITAR.open[st] + f}">` +
          marker(cx, cy, 13, isRoot ? "copper" : isBlue ? "bluenote" : "amber", label,
                 { glow: true, chord: chord && chord.has(pc), stroke: pc === charPc ? "#fff2c0" : null }) + `</g>`;
      } else {
        s += `<g class="gnote" id="${id}" data-m="${T.GUITAR.open[st] + f}" opacity=".55">` +
          `<circle cx="${cx}" cy="${cy}" r="6" fill="url(#${isRoot ? "copper" : "dimbrass"})"/>` +
          (chord && chord.has(pc) ? `<circle class="ring" cx="${cx}" cy="${cy}" r="9"/>` : "") + `</g>`;
      }
    }
    const grain = `<pattern id="grain" width="40" height="6" patternUnits="userSpaceOnUse"><path d="M0 3 Q10 1 20 3 T40 3" stroke="#000" stroke-width=".8" fill="none"/></pattern>`;
    $("stage").className = "stage guitar";
    $("stage").innerHTML = svgEl(s.replace("</defs>", grain + "</defs>"), `0 0 ${W} ${H}`);
    $("stage").querySelectorAll(".gnote").forEach(el => el.addEventListener("click", () => {
      S.note("guitar", +el.dataset.m); flash(el.id);
    }));

    // volba polohy
    const seg = $("posSeg");
    seg.innerHTML = positions.map((p, i) =>
      `<button data-v="${i}" title="pražce ${p.min}–${p.max}">${i + 1}<small style="opacity:.7;font-size:.78em">&nbsp;(${p.min}–${p.max})</small></button>`).join("") +
      `<button data-v="-1">Celý hmatník</button>`;
    bindSeg("posSeg", String(state.pos), v => { state.pos = +v; render(); });

    $("legend").innerHTML =
      `<span><i style="background:radial-gradient(circle at 35% 30%,#ffd2b0,#d9773c 45%,#6e2a0c)"></i>tónika</span>` +
      `<span><i style="background:radial-gradient(circle at 35% 30%,#ffe7b0,#ffb35c 50%,#c46416)"></i>tóny ve zvolené poloze</span>` +
      (pos ? `<span><i style="background:radial-gradient(circle,#a88a54,#4d3a1a);opacity:.6"></i>stejné tóny jinde</span>` : "") +
      (state.scale === "blues" ? `<span><i style="background:radial-gradient(circle at 35% 30%,#e2f0ff,#7fb2e6 50%,#2c5a8c)"></i>blue note</span>` : "") +
      (state.chord ? `<span><i style="border:3px solid #6cc4b0"></i>tóny akordu ${esc(state.chord.name)}</span>` : "");
    const per = state.scale === "blues" || T.SCALE[state.scale].steps.length === 5 ? "dva tóny" : "tři tóny";
    $("instHelp").innerHTML = pos
      ? `Poloha ${state.pos + 1}: ${per} na strunu, prsty 1 = ukazováček … 4 = malíček, 0 = prázdná struna. Poloha 1 začíná tónikou na struně E, další na sebe navazují – ` +
        `naučené dvě sousední spojíš sklouznutím po struně. Klepnutím na tón ho uslyšíš.`
      : `Všechny tóny stupnice na hmatníku do 17. pražce. Tónika je měděná.`;
    return pos || positions[0];
  }

  // ------------------------------------------------------------- zvýraznění při hře
  function flash(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("hit");
    setTimeout(() => el.classList.remove("hit"), 320);
  }
  function flashTube(pc) {
    const t = document.querySelector(`.tube[data-pc="${pc}"]`);
    if (!t) return;
    t.classList.add("hit"); setTimeout(() => t.classList.remove("hit"), 320);
  }

  let lastScaleChords = null;   // akordy stupnice pro notový zápis
  let current = null;     // pro přehrání: { inst, seq:[{m, id}] }
  function drawInstrument() {
    const d = data();
    $("pianoOpts").hidden = state.inst !== "piano";
    $("guitarOpts").hidden = state.inst !== "guitar";
    $("instTitle").textContent = state.inst === "piano" ? "Klavír" : "Kytara";
    $("instSub").textContent = KEY(d.r, state.scale) + " · " + d.notes.map(N).join(" ");
    if (state.inst === "piano") {
      const oct = drawPiano(d);
      const up = oct.map(m => ({ m: m + 12, id: "k" + m, pc: m % 12 }));
      current = { inst: "piano", seq: up.concat(up.slice(0, -1).reverse()), n: up.length };
    } else {
      const p = drawGuitar(d);
      const byM = new Map();
      p.notes.slice().sort((a, b) => a.string - b.string || a.fret - b.fret).forEach(n => {
        const m = T.GUITAR.open[n.string] + n.fret;
        if (!byM.has(m)) byM.set(m, { m, id: `g${n.string}-${n.fret}`, pc: n.pc });
      });
      const up = [...byM.values()].sort((a, b) => a.m - b.m);
      current = { inst: "guitar", seq: up.concat(up.slice(0, -1).reverse()), n: up.length };
    }
    drawNotation(d);
  }


  // ------------------------------------------------------------- NOTY (černé na bílém)
  const MUSIC_FONT = `"Noto Music","Bravura","Apple Symbols","Segoe UI Symbol",serif`;
  const ACC_GLYPH = { "-2": "\u{1D12B}", "-1": "♭", "0": "♮", "1": "♯", "2": "\u{1D12A}" };
  const INK = "#141414";
  const LG = 10;                                       // rozestup linek osnovy
  // diatonický index tónu (oktáva * 7 + písmeno); spodní linka: E4 (houslový), G2 (basový)
  const BOTTOM = { treble: 4 * 7 + 2, bass: 2 * 7 + 4 };
  const KS_POS = { sharp: [38, 35, 39, 36, 33, 37, 34], flat: [34, 37, 33, 36, 32, 35, 31] };   // houslový klíč

  // Psaná oktáva tónu z MIDI čísla (Ces5 = H4 zní stejně, ale píše se jinak).
  const writtenOct = (midi, n) => (midi - T.LETTER_PC[n.letter] - n.acc) / 12 - 1;

  // Jedna osnova: vrací SVG. notes = [{ n, oct, id, above, below }]
  function staff(clef, top, ks, notes, xStart, gap, extra) {
    const bottomY = top + 4 * LG;
    const yOf = pos => bottomY - (pos - BOTTOM[clef]) * LG / 2;
    let s = "";
    const xEnd = xStart + notes.length * gap + 4;
    for (let i = 0; i < 5; i++) s += `<line x1="8" y1="${top + i * LG}" x2="${xEnd}" y2="${top + i * LG}" stroke="${INK}" stroke-width="1"/>`;
    s += `<line x1="8" y1="${top}" x2="8" y2="${bottomY}" stroke="${INK}" stroke-width="1.2"/>`;
    s += `<line x1="${xEnd}" y1="${top}" x2="${xEnd}" y2="${bottomY}" stroke="${INK}" stroke-width="1.2"/>` +
         `<line x1="${xEnd + 4}" y1="${top}" x2="${xEnd + 4}" y2="${bottomY}" stroke="${INK}" stroke-width="3.2"/>`;
    // klíč
    if (clef === "treble") {
      s += `<text x="12" y="${top + 4 * LG}" font-family='${MUSIC_FONT}' font-size="${LG * 4.1}" fill="${INK}">\u{1D11E}</text>`;   // spirála kolem linky g¹
      if (extra && extra.octaveDown) s += `<text x="25" y="${bottomY + 23}" font-family="EB Garamond,Georgia,serif" font-size="12" font-style="italic" fill="${INK}">8</text>`;
    } else {
      s += `<text x="12" y="${top + 3 * LG}" font-family='${MUSIC_FONT}' font-size="${LG * 3.6}" fill="${INK}">\u{1D122}</text>`;   // dvojtečka kolem linky f
    }
    // předznamenání
    const shift = clef === "bass" ? -14 : 0;
    const kind = ks.sharps ? "sharp" : "flat";
    ks.order.forEach((_, i) => {
      const y = yOf(KS_POS[kind][i] + shift);
      s += `<text x="${50 + i * 11}" y="${y + (kind === "flat" ? 3 : 5)}" font-family='${MUSIC_FONT}' font-size="${LG * 2.3}" fill="${INK}" text-anchor="middle">${kind === "sharp" ? ACC_GLYPH[1] : ACC_GLYPH[-1]}</text>`;
    });
    // řady popisků nad a pod osnovou – rovně, nad nejvyšší / pod nejnižší notou
    const ys = notes.map(nt => yOf(nt.oct * 7 + nt.n.letter));
    const rowAbove = Math.min(top - 16, ...ys.map(y => y - 42));
    const rowBelow = Math.max(bottomY + 24, ...ys.map(y => y + 48));
    // noty
    const measure = new Map();
    notes.forEach((nt, i) => {
      const x = xStart + i * gap + gap / 2, pos = nt.oct * 7 + nt.n.letter, y = yOf(pos), rel = pos - BOTTOM[clef];
      let g = `<g id="${nt.id}">`;
      for (let q = -2; q >= rel; q -= 2) g += `<line x1="${x - 10}" y1="${yOf(BOTTOM[clef] + q)}" x2="${x + 10}" y2="${yOf(BOTTOM[clef] + q)}" stroke="${INK}" stroke-width="1"/>`;
      for (let q = 10; q <= rel; q += 2) g += `<line x1="${x - 10}" y1="${yOf(BOTTOM[clef] + q)}" x2="${x + 10}" y2="${yOf(BOTTOM[clef] + q)}" stroke="${INK}" stroke-width="1"/>`;
      const cur = measure.has(pos) ? measure.get(pos) : ks.acc[nt.n.letter];
      if (nt.n.acc !== cur) {
        g += `<text x="${x - 15}" y="${y + (nt.n.acc < 0 ? 3 : 5)}" font-family='${MUSIC_FONT}' font-size="${LG * 2.3}" fill="${INK}" text-anchor="middle">${ACC_GLYPH[nt.n.acc]}</text>`;
        measure.set(pos, nt.n.acc);
      }
      g += `<ellipse cx="${x}" cy="${y}" rx="6.3" ry="4.6" transform="rotate(-20 ${x} ${y})" fill="${INK}"/>`;
      g += rel < 4 ? `<line x1="${x + 5.6}" y1="${y - 1}" x2="${x + 5.6}" y2="${y - 33}" stroke="${INK}" stroke-width="1.3"/>`
                   : `<line x1="${x - 5.6}" y1="${y + 1}" x2="${x - 5.6}" y2="${y + 33}" stroke="${INK}" stroke-width="1.3"/>`;
      if (nt.above !== undefined) g += `<text x="${x}" y="${rowAbove}" text-anchor="middle" font-family="EB Garamond,Georgia,serif" font-weight="700" font-size="15" fill="${INK}">${esc(nt.above)}</text>`;
      if (nt.below !== undefined) g += `<text x="${x}" y="${rowBelow}" text-anchor="middle" font-family="EB Garamond,Georgia,serif" font-weight="700" font-size="15" fill="${INK}">${esc(nt.below)}</text>`;
      s += g + `</g>`;
    });
    return { svg: s, yOf };
  }

  // Rozsah svislých poloh not -> kolik místa nad/pod osnovou
  // Místo nad / pod osnovou pro nejvyšší / nejnižší notu včetně nožičky a řady popisků
  function staffSpan(clef, notes) {
    const rel = notes.map(nt => nt.oct * 7 + nt.n.letter - BOTTOM[clef]);
    const hi = Math.max(...rel), lo = Math.min(...rel);
    return { above: Math.max(16, (hi - 8) * LG / 2 + 42) + 6, below: Math.max(24, -lo * LG / 2 + 48) + 6 };
  }


  // Akordy v notách: chords = [{ notes:[{n, oct}], id, above, below }] – každý akord svůj takt
  function chordStaff(clef, top, ks, chords, xStart, gap, extra) {
    const bottomY = top + 4 * LG;
    const yOf = pos => bottomY - (pos - BOTTOM[clef]) * LG / 2;
    const xEnd = xStart + chords.length * gap + 4;
    let s = "";
    for (let i = 0; i < 5; i++) s += `<line x1="8" y1="${top + i * LG}" x2="${xEnd}" y2="${top + i * LG}" stroke="${INK}" stroke-width="1"/>`;
    s += `<line x1="8" y1="${top}" x2="8" y2="${bottomY}" stroke="${INK}" stroke-width="1.2"/>`;
    if (clef === "treble") {
      s += `<text x="12" y="${top + 4 * LG}" font-family='${MUSIC_FONT}' font-size="${LG * 4.1}" fill="${INK}">\u{1D11E}</text>`;
      if (extra && extra.octaveDown) s += `<text x="25" y="${bottomY + 23}" font-family="EB Garamond,Georgia,serif" font-size="12" font-style="italic" fill="${INK}">8</text>`;
    } else s += `<text x="12" y="${top + 3 * LG}" font-family='${MUSIC_FONT}' font-size="${LG * 3.6}" fill="${INK}">\u{1D122}</text>`;
    const shift = clef === "bass" ? -14 : 0, kind = ks.sharps ? "sharp" : "flat";
    ks.order.forEach((_, i) => {
      const y = yOf(KS_POS[kind][i] + shift);
      s += `<text x="${50 + i * 11}" y="${y + (kind === "flat" ? 3 : 5)}" font-family='${MUSIC_FONT}' font-size="${LG * 2.3}" fill="${INK}" text-anchor="middle">${kind === "sharp" ? ACC_GLYPH[1] : ACC_GLYPH[-1]}</text>`;
    });
    const allYs = [];
    chords.forEach(c => c.notes.forEach(nt => allYs.push(yOf(nt.oct * 7 + nt.n.letter))));
    const rowAbove = Math.min(top - 16, ...allYs.map(y => y - 44)), rowBelow = Math.max(bottomY + 24, ...allYs.map(y => y + 50));
    chords.forEach((c, i) => {
      const x = xStart + i * gap + gap / 2 + 4;
      let g = `<g id="${c.id}">`;
      const ps = c.notes.map(nt => nt.oct * 7 + nt.n.letter);
      // pomocné linky
      const lo = Math.min(...ps) - BOTTOM[clef], hi = Math.max(...ps) - BOTTOM[clef];
      for (let q = -2; q >= lo; q -= 2) g += `<line x1="${x - 11}" y1="${yOf(BOTTOM[clef] + q)}" x2="${x + 11}" y2="${yOf(BOTTOM[clef] + q)}" stroke="${INK}" stroke-width="1"/>`;
      for (let q = 10; q <= hi; q += 2) g += `<line x1="${x - 11}" y1="${yOf(BOTTOM[clef] + q)}" x2="${x + 11}" y2="${yOf(BOTTOM[clef] + q)}" stroke="${INK}" stroke-width="1"/>`;
      // hlavičky (sekunda vedle sebe), posuvky ve sloupcích
      let prevP = null, prevShift = false, accCol = 0;
      const measure = new Map();
      const order = c.notes.map((nt, k) => k).sort((a, b) => ps[a] - ps[b]);
      order.forEach(k => {
        const nt = c.notes[k], p = ps[k], y = yOf(p);
        const sh = prevP !== null && p - prevP === 1 && !prevShift;
        const hx = x + (sh ? 12 : 0);
        const cur = measure.has(p) ? measure.get(p) : ks.acc[nt.n.letter];
        if (nt.n.acc !== cur) {
          g += `<text x="${x - 15 - (accCol % 3) * 10}" y="${y + (nt.n.acc < 0 ? 3 : 5)}" font-family='${MUSIC_FONT}' font-size="${LG * 2.3}" fill="${INK}" text-anchor="middle">${ACC_GLYPH[nt.n.acc]}</text>`;
          measure.set(p, nt.n.acc); accCol++;
        }
        g += `<ellipse cx="${hx}" cy="${y}" rx="6.3" ry="4.6" transform="rotate(-20 ${hx} ${y})" fill="${INK}"/>`;
        prevP = p; prevShift = sh;
      });
      const yLo = yOf(Math.min(...ps)), yHi = yOf(Math.max(...ps));
      const up = (lo + hi) / 2 < 4;
      g += up ? `<line x1="${x + 5.6}" y1="${yLo - 1}" x2="${x + 5.6}" y2="${yHi - 33}" stroke="${INK}" stroke-width="1.3"/>`
              : `<line x1="${x - 5.6}" y1="${yHi + 1}" x2="${x - 5.6}" y2="${yLo + 33}" stroke="${INK}" stroke-width="1.3"/>`;
      if (c.above) g += `<text x="${x}" y="${rowAbove}" text-anchor="middle" font-family="EB Garamond,Georgia,serif" font-weight="700" font-size="16" fill="${INK}">${esc(c.above)}</text>`;
      if (c.below) g += `<text x="${x}" y="${rowBelow}" text-anchor="middle" font-family="EB Garamond,Georgia,serif" font-weight="600" font-size="14" fill="#555">${esc(c.below)}</text>`;
      s += g + `</g>`;
      const bx = xStart + (i + 1) * gap + 4;
      s += i === chords.length - 1
        ? `<line x1="${bx}" y1="${top}" x2="${bx}" y2="${bottomY}" stroke="${INK}" stroke-width="1.2"/><line x1="${bx + 4}" y1="${top}" x2="${bx + 4}" y2="${bottomY}" stroke="${INK}" stroke-width="3.2"/>`
        : `<line x1="${bx}" y1="${top}" x2="${bx}" y2="${bottomY}" stroke="${INK}" stroke-width="1"/>`;
    });
    return { svg: s, above: top - rowAbove + 18, below: rowBelow - bottomY + 8 };
  }

  // Tóny akordu v sevřené poloze nad MIDI výškou základního tónu
  function stackTones(ch, rootMidi) {
    let last = rootMidi - 1;
    return ch.tones.map(t => {
      let m = rootMidi + T.mod(t.pc - ch.root.pc, 12);
      while (m <= last) m += 12;
      last = m;
      return { n: t, oct: writtenOct(m, t) };
    });
  }

  function drawChordSheet(d, ks, xStart) {
    const src = state.sheet || lastScaleChords;
    const list = src ? src.chords.filter(c => c && c.q && c.tones) : [];
    $("chordSheetTitle").textContent = state.sheet ? "Postup: " + state.sheet.title : (src ? src.title : "Akordy");
    $("bSheetBack").hidden = !state.sheet;
    if (!list.length) { $("chordSheet").innerHTML = ""; return; }
    const gap = list.length > 8 ? 62 : 74;
    const label = c => chordName(c);
    let svg, W, H;
    if (state.inst === "piano") {
      const rh = list.map((c, i) => ({ id: "sc" + i, above: label(c),
        notes: stackTones(c, 12 * 5 + T.LETTER_PC[c.root.letter] + c.root.acc) }));
      const lh = list.map((c, i) => {
        const oct = c.root.letter >= 3 ? 3 : 4;      // F–H o oktávu níž, ať se basa vejde do osnovy
        const m = 12 * oct + T.LETTER_PC[c.root.letter] + c.root.acc;
        return { id: "scL" + i, below: c.roman || "", notes: [{ n: c.root, oct: writtenOct(m, c.root) }] };
      });
      const probeT = chordStaff("treble", 500, ks, rh, xStart, gap), probeB = chordStaff("bass", 500, ks, lh, xStart, gap);
      const topT = probeT.above + 4, topB = topT + 4 * LG + probeT.below + probeB.above;
      const a = chordStaff("treble", topT, ks, rh, xStart, gap), b = chordStaff("bass", topB, ks, lh, xStart, gap);
      const brace = `<path d="M4 ${topT} C -6 ${topT + 20}, 6 ${(topT + topB + 40) / 2 - 12}, -2 ${(topT + topB + 40) / 2} C 6 ${(topT + topB + 40) / 2 + 12}, -6 ${topB + 20}, 4 ${topB + 40}" fill="none" stroke="${INK}" stroke-width="2.4"/>` +
        `<line x1="8" y1="${topT}" x2="8" y2="${topB + 4 * LG}" stroke="${INK}" stroke-width="1.4"/>`;
      svg = brace + a.svg + b.svg;
      W = xStart + list.length * gap + 20; H = topB + 4 * LG + probeB.below;
    } else {
      const ch = list.map((c, i) => {
        const g = T.guitarChord(c);
        let notes;
        if (g) {
          notes = g.frets.map((f, st) => f < 0 ? null : T.GUITAR.open[st] + f).filter(m => m !== null).map(m => {
            const t = c.tones.find(x => x.pc === m % 12);
            return { n: t, oct: writtenOct(m + 12, t) };
          });
        } else notes = stackTones(c, 12 * 4 + T.LETTER_PC[c.root.letter] + c.root.acc).map(x => ({ n: x.n, oct: x.oct + 1 }));
        return { id: "sc" + i, above: label(c), below: c.roman || (g ? "" : "(jiný hmat)"), notes };
      });
      const probe = chordStaff("treble", 500, ks, ch, xStart, gap, { octaveDown: true });
      const top = probe.above + 4;
      svg = chordStaff("treble", top, ks, ch, xStart, gap, { octaveDown: true }).svg;
      W = xStart + list.length * gap + 20; H = top + 4 * LG + probe.below;
    }
    $("chordSheet").innerHTML = `<svg xmlns="${SVGNS}" viewBox="0 0 ${W + 10} ${H}" style="min-width:${Math.min(W, 900)}px"><g transform="translate(10 0)">${svg}</g></svg>`;
  }

  function drawNotation(d) {
    const ks = T.keySignature(d.r, state.scale);
    const nameOf = n => N(n);
    const xStart = 50 + ks.order.length * 11 + 22;
    let svg = "", H = 0, W = 0;
    const ksText = ks.sharps ? `${ks.sharps} ♯` : ks.flats ? `${ks.flats} ♭` : "bez předznamenání";
    $("notesSub").textContent = `předznamenání ${KEY(ks.home.root, ks.home.scaleId)} (${ksText})`;
    if (state.inst === "piano") {
      const pcs = d.notes.map(n => n.pc);
      const fR = T.pianoFingering(pcs, "R"), fL = T.pianoFingering(pcs, "L");
      const rootMidi = 12 * 5 + T.LETTER_PC[d.r.letter] + d.r.acc;
      const seq = d.notes.concat([d.r]).map((n, i) => {
        const midi = rootMidi + (i === d.notes.length ? 12 : T.mod(n.pc - d.r.pc, 12));
        return { n, midi };
      });
      const gap = 50;
      const rh = seq.map((x, i) => ({ n: x.n, oct: writtenOct(x.midi, x.n), id: "sn" + i,
        above: state.hand !== "L" ? fR[i] : undefined, below: nameOf(x.n) }));
      const lh = seq.map((x, i) => ({ n: x.n, oct: writtenOct(x.midi - 12, x.n), id: "snL" + i,
        below: state.hand !== "R" ? fL[i] : undefined }));
      const sr = staffSpan("treble", rh), sl = staffSpan("bass", lh);
      const topT = 14 + sr.above, topB = topT + 4 * LG + sr.below + 18 + sl.above;
      const a = staff("treble", topT, ks, rh, xStart, gap), b = staff("bass", topB, ks, lh, xStart, gap);
      // akoláda spojující obě osnovy
      const brace = `<line x1="8" y1="${topT}" x2="8" y2="${topB + 4 * LG}" stroke="${INK}" stroke-width="1.4"/>` +
        `<path d="M4 ${topT} C -6 ${topT + 20}, 6 ${(topT + topB + 40) / 2 - 12}, -2 ${(topT + topB + 40) / 2} C 6 ${(topT + topB + 40) / 2 + 12}, -6 ${topB + 20}, 4 ${topB + 40}" fill="none" stroke="${INK}" stroke-width="2.4"/>`;
      svg = brace + a.svg + b.svg;
      W = xStart + rh.length * gap + 16; H = topB + 4 * LG + sl.below + 8;
      $("sheetHelp").innerHTML = `Nahoře pravá ruka (houslový klíč) s prstoklady, dole levá ruka (basový klíč) o oktávu níž` +
        (state.hand !== "R" ? " s prstoklady" : "") + `. Pod notami jsou jména tónů.`;
    } else {
      const positions = T.guitarPositions(d.r, state.scale);
      const pos = positions[state.pos >= 0 ? state.pos : 0];
      const byM = new Map();
      pos.notes.slice().sort((a, b) => a.string - b.string || a.fret - b.fret).forEach(nt => {
        const m = T.GUITAR.open[nt.string] + nt.fret;
        if (!byM.has(m)) byM.set(m, nt);
      });
      const list = [...byM.entries()].sort((a, b) => a[0] - b[0]);
      const gap = 40;
      const notes = list.map(([m, nt], i) => {
        const n = d.notes[d.pcIdx.get(nt.pc)];
        return { n, oct: writtenOct(m + 12, n), id: "sn" + i, below: nameOf(n), tab: nt };   // kytara zní o oktávu níž
      });
      const sp = staffSpan("treble", notes);
      const top = 14 + sp.above;
      const a = staff("treble", top, ks, notes, xStart, gap, { octaveDown: true });
      const tabTop = top + 4 * LG + sp.below + 14, TG = 13;
      let t = "";
      const xEnd = xStart + notes.length * gap + 4;
      for (let i = 0; i < 6; i++) t += `<line x1="8" y1="${tabTop + i * TG}" x2="${xEnd}" y2="${tabTop + i * TG}" stroke="${INK}" stroke-width="1"/>`;
      t += `<line x1="8" y1="${tabTop}" x2="8" y2="${tabTop + 5 * TG}" stroke="${INK}" stroke-width="1.2"/><line x1="${xEnd}" y1="${tabTop}" x2="${xEnd}" y2="${tabTop + 5 * TG}" stroke="${INK}" stroke-width="1.2"/>`;
      ["T", "A", "B"].forEach((c, i) => t += `<text x="24" y="${tabTop + 19 + i * 19}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="17" fill="${INK}">${c}</text>`);
      notes.forEach((nt, i) => {
        const x = xStart + i * gap + gap / 2, y = tabTop + (5 - nt.tab.string) * TG;
        t += `<rect x="${x - 8}" y="${y - 7}" width="16" height="14" fill="#fff"/>` +
             `<text x="${x}" y="${y + 5}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="14" fill="${INK}">${nt.tab.fret}</text>`;
      });
      svg = a.svg + t;
      W = xEnd + 16; H = tabTop + 5 * TG + 16;
      $("sheetHelp").innerHTML = `Poloha ${(state.pos >= 0 ? state.pos : 0) + 1} jako noty a tabulatura. Kytara zní o oktávu níž, než se píše ` +
        `(proto „8“ pod houslovým klíčem). V tabulatuře je nahoře nejtenčí struna, čísla jsou pražce.`;
    }
    $("sheet").innerHTML = `<svg xmlns="${SVGNS}" viewBox="0 0 ${W + 10} ${H}" style="min-width:${Math.min(W, 900)}px"><g transform="translate(10 0)">${svg}</g></svg>`;
    drawChordSheet(d, ks, xStart);
  }

  // ------------------------------------------------------------- kytarový hmat (diagram)
  function chordBox(ch) {
    const g = T.guitarChord(ch);
    if (!g) return `<div class="nobox">hmat –</div>`;
    const W = 74, H = 88, X0 = 14, SX = 9.6, Y0 = 20, SY = 13, ROWS = 5;
    const fretted = g.frets.filter(f => f > 0);
    const base = g.open || Math.max(...fretted) <= 4 ? 1 : Math.min(...fretted);
    let s = `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="6" fill="#fbf6ea"/>`;
    for (let i = 0; i < 6; i++) s += `<line x1="${X0 + i * SX}" y1="${Y0}" x2="${X0 + i * SX}" y2="${Y0 + ROWS * SY}" stroke="#2a2420" stroke-width="1"/>`;
    for (let r = 0; r <= ROWS; r++) s += `<line x1="${X0}" y1="${Y0 + r * SY}" x2="${X0 + 5 * SX}" y2="${Y0 + r * SY}" stroke="#2a2420" stroke-width="${r === 0 && base === 1 ? 3.5 : 1}"/>`;
    if (base > 1) s += `<text x="${X0 - 4}" y="${Y0 + SY * 0.75}" text-anchor="end" font-family="EB Garamond,Georgia,serif" font-size="10" font-weight="700" fill="#2a2420">${base}</text>`;
    if (g.barre) {
      const strs = g.frets.map((f, i) => f === g.barre ? i : -1).filter(i => i >= 0);
      const y = Y0 + (g.barre - base + 0.5) * SY;
      s += `<rect x="${X0 + strs[0] * SX - 4}" y="${y - 4}" width="${(strs[strs.length - 1] - strs[0]) * SX + 8}" height="8" rx="4" fill="#2a2420"/>`;
    }
    g.frets.forEach((f, i) => {
      const x = X0 + i * SX;
      if (f < 0) s += `<text x="${x}" y="${Y0 - 5}" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#2a2420">×</text>`;
      else if (f === 0) s += `<circle cx="${x}" cy="${Y0 - 8}" r="3" fill="none" stroke="#2a2420" stroke-width="1.1"/>`;
      else {
        const isRoot = (T.GUITAR.open[i] + f) % 12 === ch.root.pc;
        s += `<circle cx="${x}" cy="${Y0 + (f - base + 0.5) * SY}" r="4.3" fill="${isRoot ? "#b5552a" : "#2a2420"}"/>`;
      }
    });
    return `<svg class="cbox" viewBox="0 0 ${W} ${H}" aria-hidden="true">${s}</svg>`;
  }

  // ------------------------------------------------------------- tóny a akordy
  function chordMidis(ch) {
    const base = 48 + ch.root.pc - (ch.root.pc > 7 ? 12 : 0);
    const out = [base - 12];
    let last = base - 1;
    ch.tones.forEach(t => { let m = 36 + t.pc; while (m <= last) m += 12; out.push(m); last = m; });
    return out;
  }
  const chordName = ch => T.chordSymbol(ch.root, ch.q, state.cz);
  function setChord(ch, play) {
    state.chord = ch ? { pcs: ch.tones.map(t => t.pc), name: chordName(ch), tones: ch.tones } : null;
    if (ch && play) S.chord(state.inst, chordMidis(ch).map(m => m + (state.inst === "piano" ? 12 : 0)));
    drawInstrument();
    $("chordInfo").innerHTML = ch
      ? `Tóny akordu <b>${esc(chordName(ch))}</b>: ${ch.tones.map(N).join(" – ")}. ` +
        `V melodii nad ním zní nejjistěji – na ně můžeš frázi „přistát“.`
      : "Klepni na akord: uslyšíš ho a jeho tóny se vyznačí zeleně na nástroji.";
    document.querySelectorAll(".chord").forEach(b => b.classList.toggle("on", !!ch && b.dataset.id === (ch.root.pc + chordName(ch))));
  }

  function drawScaleCard(d) {
    const sc = d.sc;
    $("scaleSub").textContent = KEY(d.r, state.scale);
    $("tubes").innerHTML = d.notes.map((n, i) => {
      const cls = ["tube"];
      if (i === 0) cls.push("root");
      if (sc.color && sc.color.i === i) cls.push(state.scale === "blues" ? "blue" : "char");
      return `<div class="${cls.join(" ")}" data-pc="${n.pc}" data-i="${i}" title="${i + 1}. tón stupnice"><b>${esc(N(n))}</b><span>${esc(d.formula[i])}</span></div>`;
    }).join("");
    $("tubes").querySelectorAll(".tube").forEach(el => el.addEventListener("click", () => {
      const pc = +el.dataset.pc, m = 60 + T.mod(pc - d.r.pc, 12) + d.r.pc - (d.r.pc > 6 ? 12 : 0);
      S.note(state.inst, state.inst === "piano" ? m : m - 12); flashTube(pc);
    }));
    let mood = `<b>${esc(KEY(d.r, state.scale))}</b> – ${esc(sc.mood)}.`;
    if (sc.color) mood += ` Charakteristický tón: <b>${esc(N(d.notes[sc.color.i]))}</b> (${esc(sc.color.text)}) – na něm je barva stupnice nejvíc slyšet.`;
    mood += ` <span class="muted">Vzorec: ${esc(d.formula.join(" "))} (vůči durové stupnici).</span>`;
    $("mood").innerHTML = mood;

    // akordy
    let chords = [], title = "Akordy ve stupnici", fnNames = null;
    if (sc.steps.length === 7) {
      chords = T.diatonicChords(d.r, state.scale, state.chordSize);
      if (["major", "minor", "harmonic"].includes(state.scale)) fnNames = { T: "tónika", S: "subdominanta", D: "dominanta" };
    } else if (state.scale === "blues") {
      title = "Bluesové akordy";
      const dom = (l, s) => { const r = T.transposeNote(d.r, l, s); return { root: r, q: T.QUAL["4,7,10"], roman: ["I7", "IV7", "V7"][[0, 3, 4].indexOf(l)],
        tones: [r, T.transposeNote(r, 2, 4), T.transposeNote(r, 4, 7), T.transposeNote(r, 6, 10)], degree: l }; };
      chords = [dom(0, 0), dom(3, 5), dom(4, 7)];
    } else {
      const home = T.ideas(d.r, state.scale, state.cz).home;
      title = `Akordy z tóniny ${KEY(home.root, home.scaleId)}`;
      chords = T.diatonicChords(home.root, home.scaleId, state.chordSize);
    }
    $("chordsTitle").textContent = title;
    $("chordSeg").hidden = state.scale === "blues";
    $("chords").innerHTML = chords.map(c => {
      const fn = fnNames && c.degree !== undefined ? fnNames[T.FUNC[c.degree]] : "";
      return `<button class="chord" data-id="${c.root.pc + chordName(c)}" title="${esc(c.q ? c.q.name : "")}">` +
        `<span class="rn">${esc(c.roman)}</span><span class="sym">${esc(chordName(c))}</span>` +
        (fn ? `<span class="fn">${fn}</span>` : "") + (state.inst === "guitar" ? chordBox(c) : "") + `</button>`;
    }).join("");
    $("chords").classList.toggle("withbox", state.inst === "guitar");
    $("chords").querySelectorAll(".chord").forEach((b, i) => b.addEventListener("click", () => {
      const on = b.classList.contains("on");
      setChord(on ? null : chords[i], !on);
      if (!on) flash("sc" + i);
    }));
    lastScaleChords = { title: title, chords };
    setChord(null, false);
  }

  // ------------------------------------------------------------- kvintový kruh
  function drawCircle(home) {
    const cx = 220, cy = 220, R0 = 212, R1 = 150, R2 = 98;
    const arc = (r1, r2, a1, a2) => {
      const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      const [x1, y1] = p(r2, a1), [x2, y2] = p(r2, a2), [x3, y3] = p(r1, a2), [x4, y4] = p(r1, a1);
      return `M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`;
    };
    const homeMajPc = home.scaleId === "major" ? home.root.pc : (home.root.pc + 3) % 12;
    const homeIsMajor = home.scaleId === "major";
    let s = DEFS;
    s += `<circle cx="${cx}" cy="${cy}" r="${R0 + 6}" fill="url(#brassBar)" stroke="#3b2810" stroke-width="2"/>`;
    for (let i = 0; i < 12; i++) {
      const pc = (i * 7) % 12, a = (i * 30 - 90 - 15) * Math.PI / 180, b = (i * 30 - 90 + 15) * Math.PI / 180, mid = (i * 30 - 90) * Math.PI / 180;
      const dist = Math.min(Math.abs(i - (homeMajPc * 7) % 12), 12 - Math.abs(i - (homeMajPc * 7) % 12));
      const near = dist <= 1;
      const maj = T.bestRoot(pc, "major"), min = T.bestRoot((pc + 9) % 12, "minor");
      const majName = pc === 6 ? (state.cz ? "Fis/Ges" : "F♯/G♭") : N(maj);
      const minName = pc === 6 ? (state.cz ? "dis/es" : "d♯/e♭") : N(min).toLowerCase();
      const sig = i === 0 ? "" : i <= 6 ? `${i}♯` : `${12 - i}♭`;
      const isHomeMaj = homeIsMajor && pc === homeMajPc, isHomeMin = !homeIsMajor && pc === homeMajPc;
      const fillO = isHomeMaj ? "url(#copper)" : near ? "#5a3d1f" : "#2b1d14";
      const fillI = isHomeMin ? "url(#copper)" : near ? "#4a3219" : "#21160f";
      const [tx, ty] = [cx + (R0 + R1) / 2 * Math.cos(mid), cy + (R0 + R1) / 2 * Math.sin(mid)];
      const [ux, uy] = [cx + (R1 + R2) / 2 * Math.cos(mid), cy + (R1 + R2) / 2 * Math.sin(mid)];
      s += `<g class="sec" data-pc="${pc}" data-k="major"><path d="${arc(R1, R0, a, b)}" fill="${fillO}" stroke="#7a5a26" stroke-width="1.5"/>` +
        `<text x="${tx}" y="${ty + 2}" text-anchor="middle" font-family="EB Garamond,serif" font-weight="700" font-size="${majName.length > 4 ? 16 : 21}" fill="${isHomeMaj ? "#2b0d00" : near ? "#ffe3a3" : "#e8d6b0"}">${esc(majName)}</text>` +
        `<text x="${tx}" y="${ty + 19}" text-anchor="middle" font-family="EB Garamond,serif" font-size="12" fill="${isHomeMaj ? "#3b1505" : "#9c8662"}">${sig}</text></g>`;
      s += `<g class="sec" data-pc="${(pc + 9) % 12}" data-k="minor"><path d="${arc(R2, R1, a, b)}" fill="${fillI}" stroke="#5c4521" stroke-width="1.2"/>` +
        `<text x="${ux}" y="${uy + 5}" text-anchor="middle" font-family="EB Garamond,serif" font-weight="600" font-size="${minName.length > 4 ? 13 : 16}" fill="${isHomeMin ? "#2b0d00" : near ? "#ffd9a0" : "#c9b28c"}">${esc(minName)}</text></g>`;
    }
    // střed – ozubené kolo
    s += `<circle cx="${cx}" cy="${cy}" r="${R2 - 4}" fill="url(#rosewood)" stroke="#c9a35a" stroke-width="3"/>`;
    for (let k = 0; k < 16; k++) {
      const a = k * Math.PI / 8;
      s += `<rect x="${cx - 7}" y="${cy - R2 - 4}" width="14" height="12" rx="2" fill="url(#brassBar)" transform="rotate(${a * 180 / Math.PI} ${cx} ${cy})"/>`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="${R2 - 10}" fill="#1a110a" stroke="#7a5a26" stroke-width="2"/>`;
    s += `<text x="${cx}" y="${cy - 10}" text-anchor="middle" font-family="Cinzel,serif" font-size="12" font-weight="700" fill="#c9a35a" letter-spacing="2">TÓNINA</text>`;
    const hn = KEY(home.root, home.scaleId);
    s += `<text x="${cx}" y="${cy + 20}" text-anchor="middle" font-family="EB Garamond,serif" font-size="${hn.length > 8 ? 22 : 28}" font-weight="700" fill="#ffb35c" filter="url(#glow)">${esc(hn)}</text>`;
    $("circle").innerHTML = svgEl(s, "0 0 440 440");
    $("circle").querySelectorAll(".sec").forEach(g => g.addEventListener("click", () => {
      state.pc = +g.dataset.pc; state.scale = g.dataset.k; state.spell = null; state.pos = 0;
      if (g.dataset.k === "major" && state.pc === 6) state.spell = null;
      render();
    }));
  }

  // ------------------------------------------------------------- nápady
  let playingItem = null;
  function drawIdeas(d) {
    const res = T.ideas(d.r, state.scale, state.cz);
    $("ideasSub").textContent = "vychází z tóniny " + KEY(res.home.root, res.home.scaleId);
    $("ideas").innerHTML = res.sections.map((sec, si) =>
      `<details ${si < 2 ? "open" : ""}><summary>${esc(sec.title)}<small>${sec.items.length}</small></summary>` +
      `<p class="intro muted">${esc(sec.intro)}</p><div class="items">` +
      sec.items.map((it, ii) => `<div class="item" data-s="${si}" data-i="${ii}">` +
        `<h4>${esc(it.label)}</h4>${it.sub ? `<div class="sub">${esc(it.sub)}</div>` : ""}<p>${esc(it.text)}</p>` +
        `<div class="acts">${it.steps ? `<button class="btn small" data-a="play">▶ Poslechnout</button>` : ""}` +
        `${it.go ? `<button class="btn small sec" data-a="go">Přejít →</button>` : ""}</div></div>`).join("") +
      `</div></details>`).join("");
    $("ideas").querySelectorAll(".item button").forEach(b => b.addEventListener("click", () => {
      const box = b.closest(".item"), it = res.sections[+box.dataset.s].items[+box.dataset.i];
      if (b.dataset.a === "go") {
        S.stop();
        state.pc = it.go.root.pc; state.scale = it.go.scaleId; state.pos = 0;
        state.spell = { letter: it.go.root.letter, acc: it.go.root.acc };
        render();
        toast("Přepnuto: " + KEY(it.go.root, it.go.scaleId));
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        if (playingItem) playingItem.classList.remove("playing");
        playingItem = box; box.classList.add("playing");
        const list = it.steps.map(ch => chordMidis(ch).map(m => m + (state.inst === "piano" ? 12 : 0)));
        state.sheet = { title: `${it.label}${it.sub ? " – " + it.sub : ""}`, chords: it.steps };
        drawNotation(data());
        $("sheet").scrollIntoView({ behavior: "smooth", block: "center" });
        S.progression(state.inst, list, Math.max(60, state.tempo - 20), i => { setChord(it.steps[i], false); flash("sc" + i); },
          () => { box.classList.remove("playing"); playingItem = null; });
      }
    }));
  }

  // ------------------------------------------------------------- ovládání
  function bindSeg(id, value, onPick) {
    const seg = $(id);
    seg.querySelectorAll("button").forEach(b => {
      b.classList.toggle("on", b.dataset.v === String(value));
      b.onclick = () => onPick(b.dataset.v);
    });
  }

  function buildScaleSelect() {
    const groups = {};
    T.SCALES.forEach(s => (groups[s.group] = groups[s.group] || []).push(s));
    $("scaleSel").innerHTML = Object.entries(groups).map(([g, list]) =>
      `<optgroup label="${esc(g)}">${list.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</optgroup>`).join("");
    $("scaleSel").onchange = e => { state.scale = e.target.value; state.spell = null; state.pos = 0; render(); };
  }

  function drawControls(d) {
    bindSeg("instSeg", state.inst, v => { S.stop(); state.inst = v; render(); });
    bindSeg("nameSeg", state.cz ? "cz" : "int", v => { state.cz = v === "cz"; render(); });
    bindSeg("handSeg", state.hand, v => { state.hand = v; drawInstrument(); save(); });
    bindSeg("labelSeg", state.label, v => { state.label = v; drawInstrument(); save(); });
    bindSeg("chordSeg", String(state.chordSize), v => { state.chordSize = +v; state.sheet = null; drawScaleCard(data()); drawNotation(data()); save(); });
    $("scaleSel").value = state.scale;
    $("roots").innerHTML = Array.from({ length: 12 }, (_, pc) => {
      const best = T.bestRoot(pc, state.scale);
      const alt = T.isBlack(pc) ? T.rootSpellings(pc).find(r => r.letter !== best.letter) : null;   // His, Fes … ne
      return `<button class="knob${pc === state.pc ? " on" : ""}" data-pc="${pc}" title="${esc(KEY(best, state.scale))}">${esc(N(best))}` +
        (alt ? `<small>${esc(N(alt))}</small>` : "") + `</button>`;
    }).join("");
    $("roots").querySelectorAll(".knob").forEach(b => b.addEventListener("click", () => {
      state.pc = +b.dataset.pc; state.spell = null; state.pos = 0; render();
      S.note(state.inst, 48 + state.pc + (state.inst === "piano" ? 12 : 0));
    }));
    const alt = T.isBlack(state.pc) ? T.rootSpellings(state.pc).find(r => r.letter !== d.r.letter) : null;
    $("enh").innerHTML = alt ? `Zapsat jinak:<button id="bEnh">${esc(KEY(alt, state.scale))}</button>` : "";
    if (alt) $("bEnh").onclick = () => { state.spell = { letter: alt.letter, acc: alt.acc }; render(); };
    $("tempo").value = state.tempo; $("tempoV").textContent = state.tempo + " BPM";
  }

  function render() {
    S.stop();
    const d = data();
    drawControls(d);
    drawScaleCard(d);
    drawInstrument();
    const res = T.ideas(d.r, state.scale, state.cz);
    drawCircle(res.home);
    drawIdeas(d);
    document.title = `${KEY(d.r, state.scale)} – Improvizátor`;
    save();
  }

  // ------------------------------------------------------------- start
  load();
  buildScaleSelect();
  $("bPlay").onclick = () => {
    if (!current) return;
    const seq = current.seq;
    const n = current.n;
    S.sequence(current.inst, seq.map(x => x.m), state.tempo, i => {
      flash(seq[i].id); flashTube(seq[i].pc);
      const k = i < n ? i : 2 * n - 2 - i;               // index noty (nahoru i dolů)
      flash("sn" + k); flash("snL" + k);
    });
  };
  $("bStop").onclick = () => { S.stop(); if (playingItem) { playingItem.classList.remove("playing"); playingItem = null; } };
  $("bSheetBack").onclick = () => { state.sheet = null; drawNotation(data()); };
  $("tempo").oninput = e => { state.tempo = +e.target.value; $("tempoV").textContent = state.tempo + " BPM"; save(); };
  window.addEventListener("hashchange", () => { load(); render(); });
  render();
})();
