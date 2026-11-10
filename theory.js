// =====================================================================
//  theory.js – hudební nauka: tóny, stupnice, akordy, prstoklady, nápady
//  Čisté funkce bez DOM (testuje tests/theory_test.js).
// =====================================================================
(function (root) {
  "use strict";

  const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
  const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
  const BLACK = [false, true, false, true, false, false, true, false, true, false, true, false];
  const mod = (n, m) => ((n % m) + m) % m;
  const isBlack = pc => BLACK[mod(pc, 12)];

  // ---------------------------------------------------------------- stupnice
  // deg = stupeň (0–6) pro každý tón -> pravopis (každý stupeň má své písmeno)
  // parent = 7tónová stupnice, ze které se berou akordy a modulace
  const SCALES = [
    { id: "major", group: "Dur a moll", name: "dur (jónská)", short: "dur",
      steps: [0, 2, 4, 5, 7, 9, 11], deg: [0, 1, 2, 3, 4, 5, 6], mode: 0,
      mood: "jasná, stabilní, „domácí“ – základ většiny písniček",
      color: null },
    { id: "minor", group: "Dur a moll", name: "moll přirozená (aiolská)", short: "moll",
      steps: [0, 2, 3, 5, 7, 8, 10], deg: [0, 1, 2, 3, 4, 5, 6], mode: 5,
      mood: "smutná, vážná, zasněná",
      color: null },
    { id: "harmonic", group: "Dur a moll", name: "moll harmonická", short: "moll harm.",
      steps: [0, 2, 3, 5, 7, 8, 11], deg: [0, 1, 2, 3, 4, 5, 6],
      mood: "dramatická, orientální – zvýšený 7. stupeň táhne k tónice",
      color: { i: 6, text: "zvětšená sekunda mezi 6. a 7. stupněm" } },
    { id: "melodic", group: "Dur a moll", name: "moll melodická (jazzová)", short: "moll mel.",
      steps: [0, 2, 3, 5, 7, 9, 11], deg: [0, 1, 2, 3, 4, 5, 6],
      mood: "moll s durovým koncem – jazz, filmová hudba",
      color: { i: 5, text: "velká sexta a velká septima v mollu" } },
    { id: "dorian", group: "Církevní módy", name: "dórská", short: "dórská",
      steps: [0, 2, 3, 5, 7, 9, 10], deg: [0, 1, 2, 3, 4, 5, 6], mode: 1,
      mood: "moll, ale světlejší – funk, jazz, Santana, irská hudba",
      color: { i: 5, text: "velká sexta (proti přirozené moll)" } },
    { id: "phrygian", group: "Církevní módy", name: "frygická", short: "frygická",
      steps: [0, 1, 3, 5, 7, 8, 10], deg: [0, 1, 2, 3, 4, 5, 6], mode: 2,
      mood: "temná, španělská, metal",
      color: { i: 1, text: "malá sekunda hned nad tónikou" } },
    { id: "lydian", group: "Církevní módy", name: "lydická", short: "lydická",
      steps: [0, 2, 4, 6, 7, 9, 11], deg: [0, 1, 2, 3, 4, 5, 6], mode: 3,
      mood: "zasněná, vznášivá – filmová hudba, Satriani",
      color: { i: 3, text: "zvětšená kvarta" } },
    { id: "mixolydian", group: "Církevní módy", name: "mixolydická", short: "mixolyd.",
      steps: [0, 2, 4, 5, 7, 9, 10], deg: [0, 1, 2, 3, 4, 5, 6], mode: 4,
      mood: "dur s „rockovým“ nádechem – blues, rock, country",
      color: { i: 6, text: "malá septima v duru" } },
    { id: "locrian", group: "Církevní módy", name: "lokrická", short: "lokrická",
      steps: [0, 1, 3, 5, 6, 8, 10], deg: [0, 1, 2, 3, 4, 5, 6], mode: 6,
      mood: "nestabilní, napjatá – zmenšená kvinta na tónice",
      color: { i: 4, text: "zmenšená kvinta" } },
    { id: "phrygdom", group: "Exotické", name: "frygická dominantní (španělská)", short: "španělská",
      steps: [0, 1, 4, 5, 7, 8, 10], deg: [0, 1, 2, 3, 4, 5, 6],
      mood: "flamenco, Blízký východ – 5. mód harmonické moll",
      color: { i: 2, text: "velká tercie po malé sekundě" } },
    { id: "pentaMajor", group: "Pentatoniky a blues", name: "pentatonika dur", short: "pent. dur",
      steps: [0, 2, 4, 7, 9], deg: [0, 1, 2, 4, 5], parent: "major",
      mood: "bez půltónů – nedá se „netrefit“, country, pop",
      color: null },
    { id: "pentaMinor", group: "Pentatoniky a blues", name: "pentatonika moll", short: "pent. moll",
      steps: [0, 3, 5, 7, 10], deg: [0, 2, 3, 4, 6], parent: "minor",
      mood: "rock a blues – první stupnice každého kytaristy",
      color: null },
    { id: "blues", group: "Pentatoniky a blues", name: "bluesová", short: "blues",
      steps: [0, 3, 5, 6, 7, 10], deg: [0, 2, 3, 4, 4, 6], parent: "minor",
      mood: "pentatonika moll + „blue note“ (zmenšená kvinta)",
      color: { i: 3, text: "blue note – zmenšená kvinta" } },
  ];
  const SCALE = Object.fromEntries(SCALES.map(s => [s.id, s]));

  // Intervaly durové stupnice – pro vzorec (1 2 ♭3 …) a římské číslice
  const MAJOR = [0, 2, 4, 5, 7, 9, 11];

  // ---------------------------------------------------------------- jména tónů
  // Tón = { pc: 0–11, letter: 0–6, acc: -2..2 }
  function noteOf(letter, acc) { return { pc: mod(LETTER_PC[mod(letter, 7)] + acc, 12), letter: mod(letter, 7), acc }; }

  const INT_ACC = { "-2": "𝄫", "-1": "♭", "0": "", "1": "♯", "2": "𝄪" };
  // Česky: H = B, B = Hes; Es, As; Cis, Des …
  function czName(n) {
    const L = LETTERS[n.letter];
    if (L === "B") return ["Heses", "B", "H", "His", "Hisis"][n.acc + 2];
    if (n.acc === 0) return L;
    if (n.acc > 0) return L + "is".repeat(n.acc);
    if (L === "E" || L === "A") return L + "s" + "es".repeat(-n.acc - 1);
    return L + "es".repeat(-n.acc);
  }
  function intName(n) { return LETTERS[n.letter] + INT_ACC[n.acc]; }
  function noteName(n, czech) { return czech ? czName(n) : intName(n); }

  // ---------------------------------------------------------------- pravopis
  // Postaví tóny stupnice od tónu root (s jeho písmenem).
  function spell(rootNote, scale) {
    return scale.steps.map((st, i) => {
      const letter = rootNote.letter + scale.deg[i];
      const pc = mod(rootNote.pc + st, 12);
      let acc = mod(pc - LETTER_PC[mod(letter, 7)] + 6, 12) - 6;
      return { pc, letter: mod(letter, 7), acc };
    });
  }
  const accCost = notes => notes.reduce((c, n) => c + (Math.abs(n.acc) === 2 ? 6 : Math.abs(n.acc)), 0);

  // Možné zápisy tóniky (pc) – ♯ i ♭ varianta.
  function rootSpellings(pc) {
    const out = [];
    for (let l = 0; l < 7; l++) {
      const acc = mod(pc - LETTER_PC[l] + 6, 12) - 6;
      if (Math.abs(acc) <= 1) out.push({ pc, letter: l, acc });
    }
    return out;
  }
  // Nejběžnější zápis tóniky pro danou stupnici (nejméně posuvek; remíza: Fis dur, jinak ♭).
  function bestRoot(pc, scaleId) {
    const sc = SCALE[scaleId];
    const cands = rootSpellings(pc).map(r => ({ r, cost: accCost(spell(r, sc)) }));
    cands.sort((a, b) => a.cost - b.cost || (pc === 6 ? b.r.acc - a.r.acc : a.r.acc - b.r.acc));
    return cands[0].r;
  }

  // Vzorec stupnice vůči duru: 1 2 ♭3 4 5 ♭6 ♭7
  function formula(scale) {
    return scale.steps.map((st, i) => {
      const d = scale.deg[i], diff = st - MAJOR[d];
      return (diff < 0 ? "♭".repeat(-diff) : "♯".repeat(diff)) + (d + 1);
    });
  }

  // Jméno tóniny: "C dur", "a moll", "D dórská"
  function keyName(rootNote, scaleId, czech) {
    const sc = SCALE[scaleId];
    const r = noteName(rootNote, czech);
    if (["minor", "harmonic", "melodic"].includes(scaleId)) return r.toLowerCase().replace(/^./, c => c) + " " + sc.short;
    if (scaleId === "major") return r + " dur";
    return r + " " + sc.short;
  }

  // ---------------------------------------------------------------- akordy
  const QUAL = {
    "4,7": { sym: "", rn: "upper", name: "durový" },
    "3,7": { sym: "m", rn: "lower", name: "mollový" },
    "3,6": { sym: "dim", rn: "lower", suf: "°", name: "zmenšený" },
    "4,8": { sym: "+", rn: "upper", suf: "+", name: "zvětšený" },
    "4,7,11": { sym: "maj7", rn: "upper", suf: "maj7", name: "velký septakord" },
    "4,7,10": { sym: "7", rn: "upper", suf: "7", name: "dominantní septakord" },
    "3,7,10": { sym: "m7", rn: "lower", suf: "7", name: "mollový septakord" },
    "3,6,10": { sym: "m7♭5", rn: "lower", suf: "ø7", name: "malý zmenšený septakord" },
    "3,6,9": { sym: "dim7", rn: "lower", suf: "°7", name: "zmenšený septakord" },
    "3,7,11": { sym: "m(maj7)", rn: "lower", suf: "(maj7)", name: "mollový s velkou septimou" },
    "4,8,11": { sym: "+maj7", rn: "upper", suf: "+maj7", name: "zvětšený s velkou septimou" },
    // nónové akordy (nóna = sekunda o oktávu výš, mod 12)
    "4,7,11,2": { sym: "maj9", rn: "upper", suf: "maj9", name: "velký nónový" },
    "4,7,10,2": { sym: "9", rn: "upper", suf: "9", name: "dominantní nónový" },
    "3,7,10,2": { sym: "m9", rn: "lower", suf: "9", name: "mollový nónový" },
    "3,7,10,1": { sym: "m7♭9", rn: "lower", suf: "7♭9", name: "mollový septakord s malou nónou" },
    "4,7,10,1": { sym: "7♭9", rn: "upper", suf: "7♭9", name: "dominantní s malou nónou" },
    "3,6,10,1": { sym: "m7♭5♭9", rn: "lower", suf: "ø7♭9", name: "malý zmenšený s malou nónou" },
    "3,6,10,2": { sym: "m9♭5", rn: "lower", suf: "ø9", name: "malý zmenšený nónový" },
    "3,7,11,2": { sym: "m(maj9)", rn: "lower", suf: "(maj9)", name: "mollový s velkou septimou a nónou" },
    "4,8,11,2": { sym: "+maj9", rn: "upper", suf: "+maj9", name: "zvětšený nónový" },
    "4,7,11,3": { sym: "maj7♯9", rn: "upper", suf: "maj7♯9", name: "velký septakord se zvětšenou nónou" },
    "3,6,9,1": { sym: "dim7♭9", rn: "lower", suf: "°7♭9", name: "zmenšený septakord s malou nónou" },
  };
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

  function chordQuality(rootPc, pcs) {
    const key = pcs.slice(1).map(p => mod(p - rootPc, 12)).join(",");
    return QUAL[key] || null;
  }
  function chordSymbol(rootNote, q, czech) { return noteName(rootNote, czech) + (q ? q.sym : "?"); }

  // Římská číslice stupně d (0–6) s tónem n vůči tónice t (♭/♯ podle durové stupnice).
  function roman(tonic, n, d, q) {
    const diff = mod(n.pc - tonic.pc - MAJOR[d] + 6, 12) - 6;
    let r = ROMAN[d];
    if (q && q.rn === "lower") r = r.toLowerCase();
    return (diff < 0 ? "♭".repeat(-diff) : "♯".repeat(diff)) + r + (q && q.suf ? q.suf : "");
  }

  // Diatonické akordy 7tónové stupnice. size: 3 kvintakordy, 4 septakordy, 5 nónové
  // (kvůli starším voláním i true = septakordy, false = kvintakordy).
  function diatonicChords(rootNote, scaleId, size) {
    const sc = SCALE[scaleId];
    const notes = spell(rootNote, sc);
    if (notes.length !== 7) return [];
    const n = size === true ? 4 : !size ? 3 : size;
    return notes.map((root, i) => {
      const n_ = root;
      const tones = [0, 2, 4, 6, 8].slice(0, n).map(k => notes[(i + k) % 7]);
      const q = chordQuality(n_.pc, tones.map(t => t.pc));
      return { degree: i, root: n_, tones, q, roman: roman(notes[0], n_, i, q) };
    });
  }

  // Funkce v duru/mollu (T, S, D)
  const FUNC = { 0: "T", 1: "S", 2: "T", 3: "S", 4: "D", 5: "T", 6: "D" };

  // ---------------------------------------------------------------- tóniny
  // Klíč = { root, scaleId } – pro modulace jen dur a moll (harmonická pro dominantu).
  function keyChords(key) {
    // dur: diatonické; moll: přirozená + V a vii° z harmonické
    const base = diatonicChords(key.root, key.scaleId === "major" ? "major" : "minor", false);
    if (key.scaleId !== "major") {
      const h = diatonicChords(key.root, "harmonic", false);
      base.push(Object.assign({}, h[4], { harm: true }), Object.assign({}, h[6], { harm: true }));
    }
    return base;
  }
  const chordId = c => c.root.pc + ":" + (c.q ? c.q.sym : "?");

  function transposeNote(n, letters, semis) {
    const letter = n.letter + letters;
    const pc = mod(n.pc + semis, 12);
    return { pc, letter: mod(letter, 7), acc: mod(pc - LETTER_PC[mod(letter, 7)] + 6, 12) - 6 };
  }
  function cleanKeyRoot(n, scaleId) {
    // zjednodušit zápis (Fes dur -> E dur, Gis dur -> As dur …)
    const sc = SCALE[scaleId];
    if (accCost(spell(n, sc)) > 7 || Math.abs(n.acc) > 1) return bestRoot(n.pc, scaleId);
    return n;
  }
  function relKey(key, letters, semis, scaleId) {
    return { root: cleanKeyRoot(transposeNote(key.root, letters, semis), scaleId), scaleId };
  }

  // Dominantní septakord tóniny
  function dominant7(key) {
    const root = transposeNote(key.root, 4, 7);
    const tones = [root, transposeNote(root, 2, 4), transposeNote(root, 4, 7), transposeNote(root, 6, 10)];
    return { root, tones, q: QUAL["4,7,10"] };
  }
  function triad(key, degree) {
    const ch = (key.scaleId === "major" ? diatonicChords(key.root, "major", false) : diatonicChords(key.root, "minor", false));
    return ch[degree];
  }

  // Pivotní (společné) akordy dvou tónin, seřazené: v cíli nejlépe subdominantní funkce (ii, IV, vi).
  function pivots(from, to) {
    const a = keyChords(from), b = keyChords(to);
    const out = [];
    for (const x of a) {
      if (x.harm) continue;
      for (const y of b) {
        if (chordId(x) !== chordId(y)) continue;
        if (y.degree === 0 || x.degree === 0 && y.degree === 4) continue;  // tónika cíle není přechod
        const score = { 1: 0, 3: 0, 5: 1, 2: 2, 4: 3, 6: 4 }[y.degree] + (x.degree === 0 ? 1 : 0);
        out.push({ chord: x, inFrom: x, inTo: y, score });
      }
    }
    out.sort((p, q) => p.score - q.score);
    return out;
  }

  // Nadřazená tónina (dur/moll), ze které vychází harmonie i předznamenání:
  // církevní mód -> rodičovská durová stupnice, pentatonika dur -> dur, ostatní -> moll na stejném tónu.
  function homeKey(rootNote, scaleId) {
    const sc = SCALE[scaleId];
    if (sc.mode !== undefined && sc.mode !== 0 && sc.mode !== 5)
      return { root: cleanKeyRoot(transposeNote(rootNote, -sc.mode, -MAJOR[sc.mode]), "major"), scaleId: "major" };
    if (scaleId === "major" || scaleId === "pentaMajor") return { root: rootNote, scaleId: "major" };
    return { root: rootNote, scaleId: "minor" };
  }

  // Předznamenání: počet ♯/♭, pořadí písmen a posuvka každého písmene podle předznamenání.
  const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6];   // F C G D A E H
  const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];    // B E A D G C F
  function keySignature(rootNote, scaleId) {
    const home = homeKey(rootNote, scaleId);
    const maj = home.scaleId === "major" ? home.root : cleanKeyRoot(transposeNote(home.root, 2, 3), "major");
    const notes = spell(maj, SCALE.major);
    const sharps = notes.filter(n => n.acc > 0).length, flats = notes.filter(n => n.acc < 0).length;
    const acc = [0, 0, 0, 0, 0, 0, 0];
    notes.forEach(n => acc[n.letter] = n.acc);
    return { sharps, flats, order: sharps ? SHARP_ORDER.slice(0, sharps) : FLAT_ORDER.slice(0, flats), acc, home };
  }

  // ---------------------------------------------------------------- nápady
  // Vrátí sekce nápadů pro zvolenou stupnici: [{ title, intro, items: [...] }]
  // item = { label, text, steps?: [akordy], go?: {root, scaleId} }
  function ideas(rootNote, scaleId, czech) {
    const sc = SCALE[scaleId];
    const N = n => noteName(n, czech);
    const K = k => keyName(k.root, k.scaleId, czech);
    const C = ch => chordSymbol(ch.root, ch.q, czech);
    const sections = [];

    const home = homeKey(rootNote, scaleId);
    const homeIsMajor = home.scaleId === "major";

    // --- 1) Modulace do příbuzných tónin (přes společný akord)
    const rel = [];
    const tonicMajor = homeIsMajor ? home : relKey(home, 2, 3, "major");   // paralelní dur
    const tonicMinor = homeIsMajor ? relKey(home, 5, 9, "minor") : home;
    const add = (k, why) => { if (!rel.some(r => r.k.root.pc === k.root.pc && r.k.scaleId === k.scaleId) &&
                                    !(k.root.pc === home.root.pc && k.scaleId === home.scaleId)) rel.push({ k, why }); };
    if (homeIsMajor) {
      add(relKey(home, 4, 7, "major"), "dominanta – o kvintu výš, +1 křížek");
      add(relKey(home, 3, 5, "major"), "subdominanta – o kvartu výš, +1 béčko");
      add(tonicMinor, "paralelní moll – stejné tóny");
      add(relKey(home, 2, 4, "minor"), "moll na III. stupni (paralelní k dominantě)");
      add(relKey(home, 1, 2, "minor"), "moll na II. stupni (paralelní k subdominantě)");
    } else {
      add(tonicMajor, "paralelní dur – stejné tóny");
      add(relKey(home, 4, 7, "minor"), "mollová dominanta – o kvintu výš");
      add(relKey(home, 3, 5, "minor"), "mollová subdominanta – o kvartu výš");
      add(relKey(home, 6, 10, "major"), "dur na VII. stupni");
      add(relKey(home, 5, 8, "major"), "dur na VI. stupni");
    }
    const modItems = rel.map(({ k, why }) => {
      const pv = pivots(home, k)[0];
      const V7 = dominant7(k);
      const tonic = triad(k, 0);
      const steps = [];
      let text;
      if (pv) {
        steps.push(pv.chord, V7, tonic);
        text = `${C(pv.chord)} je ${pv.inFrom.roman} v ${K(home)} i ${pv.inTo.roman} v ${K(k)} → ${C(V7)} (V7) → ${C(tonic)}`;
      } else {
        steps.push(V7, tonic);
        text = `${C(V7)} (dominanta cíle) → ${C(tonic)}`;
      }
      return { label: K(k), sub: why, text, steps, go: k };
    });
    sections.push({ id: "mod", title: "Modulace do příbuzných tónin",
      intro: "Nejhladší přechod: zahraj akord, který patří do obou tónin (pivot), pak dominantu nové tóniny a usaď se na její tónice.",
      items: modItems });

    // --- 2) Barevné (vzdálené) modulace
    const col = [];
    const T = triad(home, 0);
    if (homeIsMajor) {
      const par = relKey(home, 0, 0, "minor");
      col.push({ label: K(par), sub: "stejnojmenná moll", text:
        `Půjč si akordy z ${K(par)}: ${C(triad(par, 3))} (iv), ${C(triad(par, 5))} (♭VI), ${C(triad(par, 6))} (♭VII) – pak ${C(triad(par, 0))}.`,
        steps: [T, triad(par, 3), triad(par, 5), dominant7(par), triad(par, 0)], go: par });
    } else {
      const par = relKey(home, 0, 0, "major");
      col.push({ label: K(par), sub: "stejnojmenný dur", text:
        `Pikardská tercie: ${C(dominant7(home))} → ${C(triad(par, 0))} místo mollové tóniky – a jsi v duru.`,
        steps: [triad(home, 0), triad(home, 3), dominant7(home), triad(par, 0)], go: par });
    }
    const med = (letters, semis, sub, common) => {
      const k = relKey(home, letters, semis, home.scaleId);
      const t = triad(k, 0);
      col.push({ label: K(k), sub, text: `Chromatická medianta: rovnou ${C(T)} → ${C(t)} – ${common}`,
        steps: [T, t, dominant7(k), t], go: k });
    };
    med(2, 4, "o velkou tercii výš", "akordy sdílejí jeden tón, zní filmově");
    med(-2, -4, "o velkou tercii níž", "akordy sdílejí jeden tón");
    med(5, 9, "o malou tercii níž (stejný rod)", "výrazná změna barvy");
    const up = relKey(home, 1, 1, home.scaleId);
    col.push({ label: K(up), sub: "o půltón výš", text:
      `„Pop“ modulace: ${C(dominant7(up))} (dominanta o půltón výš) → ${C(triad(up, 0))}. Na konci písně přidá energii.`,
      steps: [T, dominant7(home), dominant7(up), triad(up, 0)], go: up });
    const up2 = relKey(home, 1, 2, home.scaleId);
    col.push({ label: K(up2), sub: "o celý tón výš", text:
      `${C(T)} → ${C(dominant7(up2))} → ${C(triad(up2, 0))} – klasika posledního refrénu.`,
      steps: [T, dominant7(up2), triad(up2, 0)], go: up2 });
    // zmenšený septakord – čtyři možná rozvedení
    const leading = transposeNote(home.root, 6, 11);
    const dimTargets = [0, 3, 6, 9].map(s => relKey({ root: transposeNote(home.root, [0, 2, 4, 5][s / 3], s) }, 0, 0, home.scaleId));
    const dimName = N(leading) + "dim7";
    col.push({ label: "zmenšený septakord", sub: "4 cesty jedním akordem", text:
      `${dimName} se skládá z malých tercií – stejný akord se dá rozvést do ${dimTargets.map(K).join(", ")}. Zahraj ho a rozveď kam chceš.`,
      steps: [T, { root: leading, q: QUAL["3,6,9"], tones: [leading, transposeNote(leading, 2, 3), transposeNote(leading, 4, 6), transposeNote(leading, 6, 9)] }, triad(dimTargets[1], 0)],
      go: dimTargets[1] });
    sections.push({ id: "color", title: "Barevné a vzdálené modulace",
      intro: "Odvážnější skoky – fungují i bez společného akordu, ucho je přijme díky dominantě nebo společnému tónu.",
      items: col });

    // --- 3) Módy na stejné tónině (stejný základ, jiná nálada)
    const modeIds = ["major", "lydian", "mixolydian", "dorian", "minor", "phrygian", "locrian", "harmonic", "melodic", "phrygdom"];
    const same = modeIds.filter(id => id !== scaleId).map(id => {
      const s = SCALE[id];
      const r = bestRoot(rootNote.pc, id);
      const notes = spell(r, s), mine = spell(rootNote, sc).map(n => n.pc);
      const diff = notes.filter(n => !mine.includes(n.pc)).map(N);
      return { label: keyName(r, id, czech), sub: s.mood, text: diff.length ? `Oproti tvé stupnici jiné tóny: ${diff.join(", ")}` : "Stejné tóny",
        go: { root: r, scaleId: id }, diffCount: diff.length };
    }).sort((a, b) => a.diffCount - b.diffCount);
    sections.push({ id: "same", title: `Jiná nálada na tónu ${N(rootNote)}`,
      intro: "Stejná tónika, jiná stupnice. Nad prodlevou (držený basový tón) můžeš mezi nimi přepínat – změní se jen barva. Nejbližší jsou nahoře.",
      items: same });

    // --- 4) Módy ze stejných tónů (relativní)
    const majNotes = spell(home.scaleId === "major" ? home.root : transposeNote(home.root, 2, 3), SCALE.major);
    const modesSameNotes = [0, 1, 2, 3, 4, 5, 6].map(m => {
      const id = ["major", "dorian", "phrygian", "lydian", "mixolydian", "minor", "locrian"][m];
      return { label: keyName(majNotes[m], id, czech), sub: SCALE[id].mood,
        text: `Hraj stejné tóny, ale točí se kolem ${N(majNotes[m])} – nad akordem ${C(diatonicChords(majNotes[0], "major", true)[m])}.`,
        go: { root: majNotes[m], scaleId: id } };
    }).filter(it => !(it.go.root.pc === rootNote.pc && it.go.scaleId === scaleId));
    sections.push({ id: "rel", title: "Stejné tóny, jiné centrum",
      intro: "Všech sedm módů durové stupnice používá stejné tóny – liší se tím, na kterém tónu „stojíš“. Hodí se, když se mění akord pod tebou.",
      items: modesSameNotes });

    // --- 5) Pentatoniky, které se do stupnice vejdou
    const myPcs = new Set(spell(rootNote, sc).map(n => n.pc));
    const pent = [];
    for (let pc = 0; pc < 12; pc++) {
      for (const id of ["pentaMajor", "pentaMinor"]) {
        const r = bestRoot(pc, id);
        const ps = spell(r, SCALE[id]);
        if (ps.every(n => myPcs.has(n.pc)) && !(pc === rootNote.pc && id === scaleId))
          pent.push({ label: keyName(r, id, czech), sub: ps.map(N).join(" "), text: "Všechny tóny sedí do tvé stupnice – bezpečná volba pro sóla.",
            go: { root: r, scaleId: id } });
      }
    }
    if (pent.length) sections.push({ id: "pent", title: "Pentatoniky, které pasují",
      intro: "Pětitónové stupnice bez „nebezpečných“ půltónů. Střídáním několika z nich zní sólo pestřeji.", items: pent });

    // --- 6) Vedlejší dominanty
    const tri = diatonicChords(home.root, homeIsMajor ? "major" : "minor", false);
    const sec = [];
    for (const target of tri) {
      if (target.degree === 0 || !target.q || target.q.sym === "dim") continue;
      const D = { root: transposeNote(target.root, 4, 7) };
      D.tones = [D.root, transposeNote(D.root, 2, 4), transposeNote(D.root, 4, 7), transposeNote(D.root, 6, 10)];
      D.q = QUAL["4,7,10"];
      sec.push({ label: `${C(D)} → ${C(target)}`, sub: `V7/${target.roman}`,
        text: `Dominanta k ${target.roman}. stupni – na chvíli „zatáhne“ jinam a vrátí se.`,
        steps: [triad(home, 0), D, target] });
    }
    sections.push({ id: "secdom", title: "Vedlejší dominanty",
      intro: "Septakord o kvintu nad kterýmkoli akordem tóniny ho na chvíli udělá cílem. Přidá napětí, aniž bys opustil tóninu.",
      items: sec });

    // --- 7) Postupy akordů
    const dc = homeIsMajor ? diatonicChords(home.root, "major", false) : diatonicChords(home.root, "minor", false);
    const d7 = homeIsMajor ? diatonicChords(home.root, "major", true) : diatonicChords(home.root, "minor", true);
    const prog = [];
    const P = (label, sub, arr) => prog.push({ label, sub, text: arr.map(C).join(" – "), steps: arr });
    if (homeIsMajor) {
      P("I – V – vi – IV", "pop (stovky hitů)", [dc[0], dc[4], dc[5], dc[3]]);
      P("ii7 – V7 – Imaj7", "jazz", [d7[1], dominant7(home), d7[0]]);
      P("I – vi – ii – V", "kolečko 50. let", [dc[0], dc[5], dc[1], dc[4]]);
      P("I – IV – I – V", "folk, country", [dc[0], dc[3], dc[0], dc[4]]);
      const dom = (deg) => { const r = dc[deg].root; return { root: r, q: QUAL["4,7,10"], tones: [r, transposeNote(r, 2, 4), transposeNote(r, 4, 7), transposeNote(r, 6, 10)] }; };
      P("12taktové blues", "I7 ×4, IV7 ×2, I7 ×2, V7, IV7, I7, V7", [dom(0), dom(0), dom(0), dom(0), dom(3), dom(3), dom(0), dom(0), dom(4), dom(3), dom(0), dom(4)]);
    } else {
      const hv = dominant7(home);
      P("i – ♭VII – ♭VI – V7", "andaluská kadence (flamenco)", [dc[0], dc[6], dc[5], hv]);
      P("i – iv – V7 – i", "klasická mollová", [dc[0], dc[3], hv, dc[0]]);
      P("i – ♭VI – ♭III – ♭VII", "epický rock / film", [dc[0], dc[5], dc[2], dc[6]]);
      P("iiø7 – V7 – i", "mollový jazz", [d7[1], hv, dc[0]]);
    }
    sections.push({ id: "prog", title: "Akordové postupy k improvizaci",
      intro: "Pusť si postup a zkoušej nad ním hrát – nejdřív tóny akordů, pak celou stupnici.", items: prog });

    return { home, sections };
  }

  // ---------------------------------------------------------------- klavír – prstoklady
  // Prstoklad jedné oktávy vzestupně (n tónů + horní tónika). hand: "R" | "L".
  // Hledá se opakující se vzor (jako u víceoktávových stupnic): ruka se dělí na skupiny 2–4 prstů,
  // palec nikdy na černou klávesu (pokud to jde), palec rád hned za černou klávesou.
  function pianoFingering(pcs, hand) {
    const n = pcs.length;
    let best = null;
    for (let mask = 1; mask < (1 << n); mask++) {
      const th = [];
      for (let i = 0; i < n; i++) if (mask & (1 << i)) th.push(i);
      let cost = 0, ok = true;
      for (let k = 0; k < th.length; k++) {
        const g = mod(th[(k + 1) % th.length] - th[k] - 1, n) + 1;   // velikost skupiny (cyklicky)
        const size = th.length === 1 ? n : g;
        if (size > 5) { ok = false; break; }
        cost += { 1: 6, 2: 1, 3: 0, 4: 0, 5: 6 }[size];
      }
      if (!ok) continue;
      for (const t of th) {
        const pc = pcs[t];
        if (isBlack(pc)) cost += 100;
        if (t === 0 && !isBlack(pcs[0])) cost -= 5;                  // palec na tónice (bílá) – C až H dur
        if (hand === "R") {
          const prev = pcs[mod(t - 1, n)];
          if (isBlack(prev)) cost -= 2; else if (mod(pc - prev, 12) === 1) cost -= 1;
        } else {
          const next = pcs[(t + 1) % n];
          if (isBlack(next)) cost -= 2;
          if (n === 7 && t === 4) cost -= 0.3;                       // L: palec na kvintě (5 4 3 2 1 3 2 1)
        }
      }
      if (!best || cost < best.cost) best = { cost, th };
    }
    const th = best.th, f = new Array(n);
    for (let i = 0; i < n; i++) {
      if (hand === "R") {
        // prsty rostou od palce: 1 2 3 (4)
        let back = 0;
        while (!th.includes(mod(i - back, n))) back++;
        f[i] = back + 1;
      } else {
        // levá ruka vzestupně: prsty klesají k palci
        let fwd = 0;
        while (!th.includes((i + fwd) % n)) fwd++;
        f[i] = fwd + 1;
      }
    }
    const out = f.slice();
    if (hand === "R") {
      out.push(Math.min(5, f[n - 1] + 1));          // nahoře prst, který následuje (C dur: 5)
    } else {
      // začátek: první skupina se protáhne až k dalšímu palci (C dur: 5 4 3 2 1)
      if (th.includes(0)) {
        const nextTh = th.find(t => t > 0);
        if (nextTh !== undefined && nextTh + 1 <= 5) out[0] = nextTh + 1;
      }
      out.push(f[0]);
    }
    return out;
  }

  // ---------------------------------------------------------------- kytara
  const GUITAR = { open: [40, 45, 50, 55, 59, 64], names: ["E", "A", "D", "G", "H", "e"] };

  // Prsty na jedné struně podle rozestupu pražců
  function stringFingers(frets) {
    if (frets[0] === 0) return frets.map(f => Math.min(4, f));   // prázdná struna = 0, dál prst = pražec
    const a = frets[0], span = frets[frets.length - 1] - a;
    return frets.map((f, i) => {
      const o = f - a;
      if (i === 0) return 1;
      if (i === frets.length - 1) return span >= 3 ? 4 : 1 + span;
      if (o === 1) return 2;
      if (o === 2) return span >= 4 ? 2 : 3;
      return 3;
    });
  }

  // ---------------------------------------------------------------- kytara – hmaty akordů
  // Otevřené akordy (pražce od struny E po e, -1 = nehrát). Klíč: "tónina:značka".
  const OPEN_CHORDS = {
    "0:": [-1, 3, 2, 0, 1, 0], "2:": [-1, -1, 0, 2, 3, 2], "4:": [0, 2, 2, 1, 0, 0], "7:": [3, 2, 0, 0, 0, 3], "9:": [-1, 0, 2, 2, 2, 0],
    "9:m": [-1, 0, 2, 2, 1, 0], "2:m": [-1, -1, 0, 2, 3, 1], "4:m": [0, 2, 2, 0, 0, 0],
    "0:7": [-1, 3, 2, 3, 1, 0], "2:7": [-1, -1, 0, 2, 1, 2], "4:7": [0, 2, 0, 1, 0, 0], "7:7": [3, 2, 0, 0, 0, 1], "9:7": [-1, 0, 2, 0, 2, 0], "11:7": [-1, 2, 1, 2, 0, 2],
    "9:m7": [-1, 0, 2, 0, 1, 0], "2:m7": [-1, -1, 0, 2, 1, 1], "4:m7": [0, 2, 0, 0, 0, 0],
    "0:maj7": [-1, 3, 2, 0, 0, 0], "2:maj7": [-1, -1, 0, 2, 2, 2], "4:maj7": [0, 2, 1, 1, 0, 0], "5:maj7": [-1, -1, 3, 2, 1, 0],
    "7:maj7": [3, 2, 0, 0, 0, 2], "9:maj7": [-1, 0, 2, 1, 2, 0],
  };
  // Posuvné tvary: posun proti pražci základního tónu na struně E (index 0) nebo A (index 1); null = nehrát.
  const SHAPES = {
    E: { "": [0, 2, 2, 1, 0, 0], "m": [0, 2, 2, 0, 0, 0], "7": [0, 2, 0, 1, 0, 0], "m7": [0, 2, 0, 0, 0, 0],
         "maj7": [0, null, 1, 1, 0, null], "m7♭5": [0, null, 0, 0, -1, null], "dim7": [0, null, -1, 0, -1, null],
         "m(maj7)": [0, null, 1, 0, 0, null], "+maj7": [0, null, 1, 1, 1, null] },
    A: { "": [null, 0, 2, 2, 2, 0], "m": [null, 0, 2, 2, 1, 0], "7": [null, 0, 2, 0, 2, 0], "m7": [null, 0, 2, 0, 1, 0],
         "maj7": [null, 0, 2, 1, 2, 0], "m7♭5": [null, 0, 1, 0, 1, null], "dim7": [null, 0, 1, -1, 1, null],
         "dim": [null, 0, 1, 2, 1, null], "+": [null, 0, -1, -2, -2, null], "m(maj7)": [null, 0, 2, 1, 1, 0],
         "9": [null, 0, -1, 0, 0, 0], "maj9": [null, 0, -1, 1, 0, null], "m9": [null, 0, -2, 0, 0, null],
         "7♭9": [null, 0, -1, 0, -1, null] },
  };
  // Hmat akordu: { frets: [6], barre: pražec | 0, open: bool } nebo null (tvar neznám).
  function guitarChord(ch) {
    if (!ch || !ch.q) return null;
    const sym = ch.q.sym;
    const open = OPEN_CHORDS[ch.root.pc + ":" + sym];
    if (open) return { frets: open.slice(), barre: 0, open: true };
    let best = null;
    [["E", 0], ["A", 1]].forEach(([name, st]) => {
      const tpl = SHAPES[name][sym];
      if (!tpl) return;
      let r = mod(ch.root.pc - GUITAR.open[st], 12);
      const offs = tpl.filter(o => o !== null);
      if (r + Math.min(...offs) < 1) r += 12;               // posuvný tvar bez prázdných strun
      const frets = tpl.map(o => o === null ? -1 : r + o);
      const atR = tpl.filter(o => o === 0).length;
      const cand = { frets, barre: atR >= 3 ? r : 0, open: false, r };
      if (!best || r < best.r) best = cand;
    });
    return best;
  }

  // Polohy: 7tónové -> 3 tóny na strunu (7 poloh), pentatoniky -> 2 tóny na strunu (5 poloh),
  // blues -> pentatonika moll + blue note.
  function guitarPositions(rootNote, scaleId) {
    const sc = SCALE[scaleId];
    const base = scaleId === "blues" ? SCALE.pentaMinor : sc;
    const per = base.steps.length === 7 ? 3 : 2;
    const k = base.steps.length;
    const pcs = base.steps.map(s => mod(rootNote.pc + s, 12));
    const positions = [];
    for (let start = 0; start < k; start++) {
      // první tón na struně E: stupeň start, co nejníž (pražec ≥ 0)
      let midi = GUITAR.open[0] + mod(pcs[start] - mod(GUITAR.open[0], 12), 12);
      const seq = [];
      // posloupnost tónů stupnice od midi nahoru
      let idx = start, m = midi;
      for (let j = 0; j < per * 6; j++) {
        seq.push({ midi: m, pc: pcs[idx], deg: idx });
        const nidx = (idx + 1) % k;
        m += mod(pcs[nidx] - pcs[idx], 12) || 12;
        idx = nidx;
      }
      let notes = [];
      for (let s = 0; s < 6; s++) {
        const chunk = seq.slice(s * per, s * per + per);
        const frets = chunk.map(c => c.midi - GUITAR.open[s]);
        const fingers = stringFingers(frets);
        chunk.forEach((c, i) => notes.push({ string: s, fret: frets[i], pc: c.pc, deg: c.deg, finger: fingers[i] }));
      }
      if (scaleId === "blues") notes = addBlueNotes(notes, mod(rootNote.pc + 6, 12));
      let min = Math.min(...notes.map(n => n.fret)), max = Math.max(...notes.map(n => n.fret));
      if (min < 0) { notes.forEach(n => n.fret += 12); min += 12; max += 12; }
      if (max > 17) { notes.forEach(n => n.fret -= 12); min -= 12; max -= 12; }   // vejít se do 17. pražce
      if (min === 0 || notes.some(n => n.fret === 0)) notes.forEach(n => { if (n.fret === 0) n.finger = 0; });
      positions.push({ index: positions.length, startDeg: start, min, max, notes });
    }
    return positions;   // poloha 1 = tónika na basové struně E, další navazují směrem nahoru
  }

  // Blue note přidá na každou strunu, kde leží uvnitř krabice polohy (i těsně za krajním tónem struny).
  function addBlueNotes(notes, bluePc) {
    const out = notes.slice();
    const lo = Math.min(...notes.map(n => n.fret)), hi = Math.max(...notes.map(n => n.fret));
    for (let s = 0; s < 6; s++) {
      const on = notes.filter(n => n.string === s).sort((a, b) => a.fret - b.fret);
      for (let f = Math.max(lo, on[0].fret - 1); f <= Math.min(hi, on[on.length - 1].fret + 1); f++) {
        if (mod(GUITAR.open[s] + f, 12) === bluePc) {
          out.push({ string: s, fret: f, pc: bluePc, deg: -1, blue: true, finger: Math.min(4, f - on[0].fret + 1) });
        }
      }
    }
    return out;
  }

  root.Theory = {
    LETTERS, LETTER_PC, SCALES, homeKey, keySignature, SCALE, GUITAR, isBlack, mod,
    noteOf, czName, intName, noteName, spell, bestRoot, rootSpellings, formula, keyName,
    diatonicChords, chordSymbol, guitarChord, FUNC, ideas, pianoFingering, guitarPositions, transposeNote, QUAL,
  };
})(typeof window !== "undefined" ? window : globalThis);
