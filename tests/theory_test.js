// Spuštění: jsc tests/theory_test.js  (macOS JavaScriptCore)  nebo  node tests/theory_test.js
if (typeof load === "function") load("theory.js"); else require("../theory.js");
const T = globalThis.Theory;
let fails = 0, checks = 0;
const log = typeof print === "function" ? print : console.log;
function eq(got, exp, msg) { checks++; if (JSON.stringify(got) !== JSON.stringify(exp)) { fails++; log("FAIL " + msg + ": " + JSON.stringify(got) + " != " + JSON.stringify(exp)); } }

// --- pravopis a jména
const names = (pc, id, cz) => { const r = T.bestRoot(pc, id); return T.spell(r, T.SCALE[id]).map(n => T.noteName(n, cz)); };
eq(names(0, "major", true), ["C","D","E","F","G","A","H"], "C dur");
eq(names(6, "major", true), ["Fis","Gis","Ais","H","Cis","Dis","Eis"], "Fis dur");
eq(names(10, "major", true), ["B","C","D","Es","F","G","A"], "B dur (Hes)");
eq(names(10, "major", false), ["B♭","C","D","E♭","F","G","A"], "Bb dur int");
eq(names(3, "minor", true), ["Es","F","Ges","As","B","Ces","Des"], "es moll");
eq(names(8, "major", true), ["As","B","C","Des","Es","F","G"], "As dur");
eq(names(9, "harmonic", true), ["A","H","C","D","E","F","Gis"], "a harm");
eq(names(4, "phrygdom", false), ["E","F","G♯","A","B","C","D"], "E frygická dominantní");
eq(names(0, "blues", true), ["C","Es","F","Ges","G","B"], "C blues");
eq(names(4, "pentaMinor", true), ["E","G","A","H","D"], "e pent moll");
eq(T.keyName(T.bestRoot(6, "minor"), "minor", true), "fis moll", "fis moll");
eq(T.keyName(T.bestRoot(3, "minor"), "minor", true), "es moll", "es moll");
eq(T.formula(T.SCALE.dorian).join(" "), "1 2 ♭3 4 5 6 ♭7", "vzorec dórská");

// --- akordy
const ch = T.diatonicChords(T.bestRoot(0, "major"), "major", true).map(c => T.chordSymbol(c.root, c.q, true) + " " + c.roman);
eq(ch, ["Cmaj7 Imaj7","Dm7 ii7","Em7 iii7","Fmaj7 IVmaj7","G7 V7","Am7 vi7","Hm7♭5 viiø7"], "C dur septakordy");
const chm = T.diatonicChords(T.bestRoot(9, "minor"), "minor", false).map(c => c.roman);
eq(chm, ["i","ii°","♭III","iv","v","♭VI","♭VII"], "a moll číslice");

// --- prstoklady klavír (učebnicové durové stupnice)
const RH = { 0:"12312345", 7:"12312345", 2:"12312345", 9:"12312345", 4:"12312345", 11:"12312345",
             5:"12341234", 10:"41231234", 3:"31234123", 8:"34123123", 1:"23123412", 6:"23412312" };
const LH = { 0:"54321321", 7:"54321321", 2:"54321321", 9:"54321321", 4:"54321321", 11:"43214321",
             5:"54321321", 10:"32143213", 3:"32143213", 8:"32143213", 1:"32143213", 6:"43213214" };
for (let pc = 0; pc < 12; pc++) {
  const r = T.bestRoot(pc, "major"), pcs = T.spell(r, T.SCALE.major).map(n => n.pc);
  eq(T.pianoFingering(pcs, "R").join(""), RH[pc], "RH " + T.czName(r) + " dur");
  eq(T.pianoFingering(pcs, "L").join(""), LH[pc], "LH " + T.czName(r) + " dur");
}
// palec nikdy na černé, pokud stupnice má bílé klávesy
for (const sc of T.SCALES) for (let pc = 0; pc < 12; pc++) {
  const r = T.bestRoot(pc, sc.id), pcs = T.spell(r, sc).map(n => n.pc);
  for (const h of ["R", "L"]) {
    const f = T.pianoFingering(pcs, h);
    checks++;
    if (f.length !== pcs.length + 1 || f.some(x => x < 1 || x > 5)) { fails++; log("FAIL rozsah " + sc.id + " " + pc + h + " " + f); }
    const thumbBlack = pcs.some((p, i) => f[i] === 1 && T.isBlack(p));
    if (thumbBlack && pcs.filter(p => !T.isBlack(p)).length >= 2) { fails++; log("FAIL palec na černé " + sc.id + " " + T.czName(r) + h + " " + f); }
  }
}

// --- kytara
for (const sc of T.SCALES) for (let pc = 0; pc < 12; pc++) {
  const r = T.bestRoot(pc, sc.id), pos = T.guitarPositions(r, sc.id);
  checks++;
  const want = sc.id === "blues" ? 5 : sc.steps.length;
  if (pos.length !== want) { fails++; log("FAIL poloh " + sc.id + " " + pc + ": " + pos.length); }
  const scalePcs = T.spell(r, sc).map(n => n.pc);
  for (const p of pos) {
    checks++;
    const bad = p.notes.filter(n => n.fret < 0 || n.fret > 24 || !scalePcs.includes(n.pc) || (n.string >= 0 && T.mod(T.GUITAR.open[n.string] + n.fret, 12) !== n.pc));
    if (bad.length) { fails++; log("FAIL poloha " + sc.id + " " + pc + " " + JSON.stringify(bad[0])); }
    const span = p.max - p.min;
    if (span > 7) { fails++; log("FAIL rozpětí " + sc.id + " " + T.czName(r) + " poloha " + p.index + ": " + span); }
    // všechny tóny stupnice v poloze
    if (!scalePcs.every(x => p.notes.some(n => n.pc === x))) { fails++; log("FAIL chybí tón " + sc.id + " " + pc); }
  }
}
const em = T.guitarPositions(T.bestRoot(4, "pentaMinor"), "pentaMinor")[0];
eq(em.notes.filter(n => n.string === 0).map(n => n.fret), [0, 3], "e pent moll 1. poloha E struna");
const ab = T.guitarPositions(T.bestRoot(9, "blues"), "blues")[0];
eq(ab.notes.filter(n => n.blue).map(n => n.string + "/" + n.fret).sort(), ["1/6", "3/8"], "A blues poloha 1 – blue note");
const am = T.guitarPositions(T.bestRoot(9, "pentaMinor"), "pentaMinor")[0];
eq(am.notes.filter(n => n.string === 0).map(n => n.fret + "/" + n.finger), ["5/1", "8/4"], "a pent moll poloha 1 od 5. pražce");
const gm = T.guitarPositions(T.bestRoot(7, "major"), "major")[0];
eq(gm.notes.filter(n => n.string === 0).map(n => n.fret + "/" + n.finger), ["3/1", "5/2", "7/4"], "G dur poloha 1 (3NPS)");

// --- nápady: všechny tóniny a stupnice bez chyb
for (const sc of T.SCALES) for (let pc = 0; pc < 12; pc++) for (const cz of [true, false]) {
  const r = T.bestRoot(pc, sc.id);
  let res;
  try { res = T.ideas(r, sc.id, cz); } catch (e) { fails++; log("FAIL výjimka " + sc.id + " " + pc + ": " + e + "\n" + e.stack); continue; }
  const txt = JSON.stringify(res.sections.map(s => s.items.map(i => [i.label, i.sub, i.text])));
  checks++;
  if (/undefined|NaN|\?|null/.test(txt)) { fails++; log("FAIL text " + sc.id + " " + T.czName(r) + ": " + txt.match(/.{60}(undefined|NaN|\?|null).{20}/)[0]); }
  for (const s of res.sections) for (const it of s.items) for (const st of (it.steps || [])) {
    checks++;
    if (!st || !st.root || !st.q || !st.tones) { fails++; log("FAIL krok " + sc.id + " " + pc + " " + s.id + " " + it.label); }
  }
}
// ukázka
const id = T.ideas(T.bestRoot(0, "major"), "major", true);
for (const s of id.sections) { log("## " + s.title); for (const it of s.items.slice(0, 3)) log("  " + it.label + " – " + it.text); }
// --- předznamenání
const ks = (pc, id) => { const k = T.keySignature(T.bestRoot(pc, id), id); return k.sharps ? k.sharps + "#" : k.flats + "b"; };
eq([ks(0,"major"), ks(7,"major"), ks(5,"major"), ks(9,"minor"), ks(2,"dorian"), ks(3,"minor"), ks(6,"major"), ks(4,"phrygian"), ks(9,"harmonic"), ks(9,"pentaMinor")],
   ["0b","1#","1b","0b","0b","6b","6#","0b","0b","0b"], "předznamenání");
log((fails ? "SELHALO " + fails : "OK") + " (" + checks + " kontrol, po předznamenání)");
