# Improvizátor

**Stupnice, prstoklady a nápady na modulace pro klavír a kytaru** – ve steampunkovém kabátě.

👉 **Spustit: https://tomkubak.github.io/WEB-Improvizator/**

Webová aplikace pro všechny, kdo rádi improvizují. Vybereš nástroj, tóniku a stupnici – a uvidíš,
jak ji hrát, z jakých akordů se skládá a kam se z ní dá hudebně „utéct“.

## Co umí

### Klavír
- Klaviatura na dvě oktávy s vyznačenými tóny stupnice a **prstoklady pravé i levé ruky**
  (u durových stupnic odpovídají učebnicovým, u ostatních je spočítá pravidlo:
  palec na bílé klávesy, podsazení hned za černou klávesou).
- Klepnutím na klávesu ji uslyšíš, celou stupnici si můžeš pustit nahoru i dolů.

### Kytara
- Hmatník do 17. pražce, **polohy po celém krku**: sedmitónové stupnice tři tóny na strunu
  (7 poloh), pentatoniky dva tóny na strunu (5 „krabic“), bluesová stupnice s blue note.
- Popisky podle volby: **prsty** (1 = ukazováček … 4 = malíček, 0 = prázdná struna), **tóny** nebo **stupně**.

### Noty
Stupnice i v klasickém notovém zápisu – černé noty na bílém papíře, s předznamenáním podle tóniny
a posuvkami jen tam, kde se stupnice od předznamenání liší.
- **Klavír:** dvojitá osnova (pravá ruka v houslovém, levá v basovém klíči) s prstoklady a jmény tónů.
- **Kytara:** houslový klíč s osmičkou (kytara zní o oktávu níž) a pod ním **tabulatura** zvolené polohy.
- Při přehrávání stupnice se právě znějící nota zbarví.

### Stupnice
Dur, moll (přirozená, harmonická, melodická), církevní módy (dórská, frygická, lydická,
mixolydická, lokrická), frygická dominantní (španělská), pentatonika dur a moll, bluesová.
U každé je popsaná nálada a **charakteristický tón**, který jí dává barvu.

### Akordy
Akordy ve stupnici (kvintakordy i septakordy) s římskými číslicemi a funkcí (tónika, subdominanta,
dominanta). Klepnutím akord zazní a jeho tóny se vyznačí na nástroji.

### Nápady k improvizaci
- **Modulace do příbuzných tónin** přes společný (pivotní) akord – např. z C dur do G dur:
  *Am je vi v C dur i ii v G dur → D7 → G*.
- **Barevné modulace** – stejnojmenná tónina, chromatické medianty, posun o půltón / celý tón,
  zmenšený septakord se čtyřmi možnými rozvedeními.
- **Jiná nálada na stejné tónice** (C dur → C lydická, C mixolydická …) a **stejné tóny,
  jiné centrum** (C dur → D dórská, E frygická …).
- **Pentatoniky, které do stupnice pasují**, **vedlejší dominanty** a **akordové postupy**
  (pop, jazz ii–V–I, 12taktové blues, andaluská kadence …).
- Každý nápad si můžeš **poslechnout** (zazní akordy a ukážou se na nástroji) a nad ním hrát,
  nebo se do nové stupnice jedním klepnutím **přepnout**.

### Další
- **Kvintový kruh** – klepnutím zvolíš tóninu, zvýrazní příbuzné tóniny.
- Názvy tónů **česky** (H, B, Fis, Es …) nebo **mezinárodně** (B, B♭, F♯, E♭ …),
  správný pravopis podle tóniny (Fis dur má Eis, ne F).
- Zvuk se generuje přímo v prohlížeči (klavír i drnkaná struna), bez nahrávek a bez internetu.
- Nastavení se pamatuje; odkaz v adresním řádku (např. `#guitar/9/blues`) se dá poslat dál.

## Technika

Čisté HTML, CSS a JavaScript – žádná instalace, žádný build, žádný server. Stačí otevřít `index.html`.

| Soubor | Obsah |
|---|---|
| `theory.js` | hudební nauka: pravopis tónů, stupnice, akordy, prstoklady, polohy na kytaře, nápady |
| `app.js` | vykreslení klaviatury, hmatníku, kvintového kruhu a nápadů (SVG) |
| `audio.js` | zvuk přes Web Audio API (aditivní klavír, Karplus-Strong kytara) |
| `style.css` | steampunkový vzhled |
| `tests/theory_test.js` | testy hudební nauky (prstoklady durových stupnic, pravopis, polohy …) |

Testy: `node tests/theory_test.js` (nebo na Macu `jsc tests/theory_test.js`).
