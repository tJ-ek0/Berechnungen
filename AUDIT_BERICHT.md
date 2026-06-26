# Komplett-Audit „Techniker Berechnungstools"

**Datum:** 11.06.2026
**Umfang:** Alle 52 Tools + Infrastruktur (shared.js, style.css, index.html, Impressum/Kontakt/Statistiken) — 55 Dateien, ~1,2 MB Code
**Methode:** Vollständige Code-Durchsicht; Formeln gegen Normen/Literatur nachgerechnet (DIN 28011, ISO 5167, IEC 60751/60584, AwSV, StrlSchV, IAPWS-IF97, CRC); Sicherheits-Querschnittsanalyse (XSS, Supply-Chain, Datenschutz)

---

## 1. Gesamtbewertung

Die Codebasis ist für ein Hobby-Projekt **bemerkenswert hochwertig**: konsistente Architektur, durchdachte UX (Ampeln, Live-Berechnung, Share-Links, PDF), saubere CSV-Parser, korrekte Statistik (Stichproben-σ), gute Mobiloptimierung. Die große Mehrheit der nachgerechneten Formeln und Stoffdaten ist **korrekt**.

Es gibt jedoch **5 kritische Rechen-/Inhaltsfehler**, die falsche Ergebnisse an Nutzer ausgeben — zwei davon in Tools mit Sicherheits- bzw. Rechtsbezug (Tankinhalt, WHG-Gefährdungsstufe). Diese sollten vor allem anderen behoben werden.

| Kategorie | Anzahl |
|---|---|
| 🔴 Kritisch (falsche Ergebnisse) | 5 |
| 🟠 Sicherheit/Datenschutz | 3 |
| 🟡 Funktionale Bugs (mittel) | ~12 |
| 🔵 Fachliche Hinweise (Vereinfachungen dokumentieren) | ~8 |
| ⚪ Verbesserungspotential (UX/Code) | ~15 |

---

## 2. 🔴 Kritische Fehler (falsche Ergebnisse)

### 2.1 Tankinhalt.html — Klöpper-/Korbbogenboden ~70 % zu viel Volumen

`headParams()` (ca. Zeile 774) berechnet die Bodenhöhe falsch:

```js
// FALSCH:
const hb = R + r - Math.sqrt(Math.max(0, (R - r) * (R - r) - (D / 2 - r) * (D / 2 - r)));
// KORREKT:
const hb = R - Math.sqrt(Math.max(0, (R - r) * (R - r) - (D / 2 - r) * (D / 2 - r)));
```

**Nachweis:** Klöpperboden (DIN 28011, R=D, r=0,1·D) hat eine gewölbte Höhe h2 ≈ 0,1935·Da. Der Code liefert 0,294·D statt 0,194·D. Bei Da=2000 mm, S=10 mm: Engine rechnet mit 582 mm Bodenhöhe — die **eigene Anzeige** (`headParamsDIN_mm()`, die die korrekte DIN-Formel nutzt) zeigt gleichzeitig h2 = 382 mm. Anzeige und Volumenberechnung widersprechen sich im selben Tool.

**Volumenfehler** (nachintegriert): Klöpperboden korrekt ≈ 0,0998·D³, Code ≈ 0,17·D³ → **+70 % pro Boden**. Oberhalb des Tangentenpunkts wird ein unphysikalischer, sich wieder verengender Ring integriert.

**Folgefix nötig:** `headRadiusAtY()` intern anpassen: `kcy = hb` (statt `hb − r`) und `yt = R·(hb − r)/(R − r)` (statt `R·(hb − 2r)/(R − r)`).

**Betroffen:** stehender Zylinder, liegender Zylinder, Gesamthöhe, Füllstandsergebnis, Linearisierungstabelle, CSV-Export, Volumen→Füllstand-Rückrechnung. Kugel, Konus, Rechteck, Halbkugelboden und Flachboden sind korrekt.

Zusätzlich: `volVCyl` ist **doppelt definiert** (Z. 824 alte Signatur, Z. 989 neue) — die alte ist toter Code und sollte entfernt werden.

### 2.2 WHG_Gefaehrdungsstufe.html — Schwellenwerte entsprechen nicht der AwSV

```js
// Code:
const SCHWELLEN = { 1: [1000, 10000, 100000], 2: [100, 1000, 10000], 3: [10, 100, 1000] };
```

AwSV § 39 Tabelle 1 ist aber eine Matrix mit den Volumengrenzen **0,22 / 1 / 10 / 100 / 1000 m³**:

| Volumen | WGK 1 | WGK 2 | WGK 3 |
|---|---|---|---|
| ≤ 0,22 m³ | A | A | A |
| > 0,22–1 m³ | A | A | B |
| > 1–10 m³ | A | B | C |
| > 10–100 m³ | A | C | D |
| > 100–1000 m³ | B | D | D |
| > 1000 m³ | C | D | D |

**Beispiel:** 50 m³ WGK 2 → Code: Stufe **A** (keine ZÜS-Prüfung) — AwSV: Stufe **C** (ZÜS-Prüfung alle 2,5 Jahre, Betriebstagebuch). Da das Tool Prüfpflichten ausgibt, ist das rechtlich relevant. Außerdem existiert für WGK 1 keine Stufe D (Maximum ist C).

### 2.3 Leitfaehigkeit.html — Zellkonstanten-Rechner Faktor 100 falsch

Alle drei Formeln in `calcCell()` sind konsistent um Faktor 100 daneben:

```js
const K_calc = R * (kappa / 1e6) * 100;   // FALSCH → ohne *100
const kappa_calc = (K / R) * 1e6 / 100;   // FALSCH → ohne /100
const R_calc = (K / kappa) * 1e4;         // FALSCH → *1e6 statt *1e4
```

**Nachweis mit den eigenen Beispielwerten** (R = 1000 Ω, κ = 1413 µS/cm): physikalisch K = R·κ = 1000 · 1413·10⁻⁶ S/cm = **1,413 cm⁻¹**. Code liefert **141,3 cm⁻¹**. Temperaturkompensation und TDS im selben Tool sind korrekt.

### 2.4 DPDurchfluss.html — Kennlinien-Tabelle Faktor 10 falsch

```js
const qPct = Math.sqrt(dpPct);   // FALSCH → 10 * Math.sqrt(dpPct)
```

Q/Qmax = √(DP/DPmax) ⇒ bei DP = 25 % ist Q = 50 %. Die Tabelle zeigt **5 %**, dazu falsche Q-Werte und falsches mA-Signal (4,80 statt 12,00 mA). Der Code-Kommentar nennt sogar die richtige Absicht („nice Q% values 10,20,…,100%"). Die Hauptberechnung darüber ist korrekt — nur die Tabelle (und deren Highlight-Logik) ist betroffen.

### 2.5 Konzentration.html — Ethanol komplett funktionslos

`interpolate()` setzt aufsteigend sortierte Dichten voraus. Bei Ethanol **fällt** die Dichte mit der Konzentration (0,998 → 0,789 g/cm³), daher greift der Bereichscheck `density < data[0][1]` für jede gültige Eingabe → immer „Außerhalb Tabellenbereich". Fix: Richtung der Daten erkennen (oder Ethanol-Tabelle invertiert ablegen und Interpolation generisch über min/max prüfen). H₂SO₄/NaOH/HCl/Brix sind korrekt (CRC-Werte stichprobengeprüft).

### 2.6 (Grenzfall) Temperatursensor.html — Typ K ohne ITS-90-Exponentialterm

Die NIST/ITS-90-Funktion für Typ K (t > 0 °C) enthält zusätzlich `a₀·exp(a₁·(t−126,9686)²)` mit a₀ = 0,1186 mV. Der Code nutzt nur das Polynom → Fehler bis **~0,12 mV ≈ 3 °C** um 127 °C; bei 0 °C liefert der Code −0,0176 mV statt 0 mV (das c₀ = −0,0176 ist nur zusammen mit dem Exponentialterm korrekt). Für ein Kalibrier-Referenztool relevant. Alle anderen Typen (J, T, E, N, R, S) und Pt100/Pt1000 (Callendar-Van-Dusen inkl. Newton-Iteration) sind korrekt.

---

## 3. 🟠 Sicherheit & Datenschutz

**Positiv vorweg:** Kein `eval`/`document.write`, URL-Share-Parameter werden nur als `.value` gesetzt (kein XSS-Pfad), CSV-Zellen werden mit `escHtml()` escaped, korrekter Quote-Parser, kein Server, keine Cookies, kein Tracking Dritter, kein `target="_blank"`-Tabnabbing. Die Angriffsfläche einer statischen Seite ist insgesamt klein.

### 3.1 CDN-Skripte ungepinnt und ohne SRI (Supply-Chain)

- `csvauswertung.html`, `Messwertabweichung.html`, `PHWert.html`, `Statistiken.html` laden Chart.js **ohne Versionsangabe** (`cdn.jsdelivr.net/npm/chart.js` = jeweils neueste Version): ein Breaking Change oder eine kompromittierte Release bricht/infiziert die Seite jederzeit. `Impulswertigkeit.html` pinnt dagegen korrekt `chart.js@4.4.0` — inkonsistent.
- **Kein einziges** `integrity`-Attribut (SRI) im Repo; jsPDF 2.4.0 (2021) wird zudem in `shared.js` zur Laufzeit nachgeladen.
- **Empfehlung:** Alle CDN-URLs auf exakte Versionen pinnen + SRI-Hashes (`integrity` + `crossorigin="anonymous"`), oder die 3 Bibliotheken lokal ins Repo legen (bei GitHub Pages problemlos, eliminiert die Abhängigkeit komplett). Zusätzlich eine CSP via `<meta http-equiv="Content-Security-Policy">` erwägen.

### 3.2 Google Fonts vom Google-Server (DSGVO)

`style.css` lädt IBM Plex per `@import url('https://fonts.googleapis.com/...')`. Dabei wird die IP-Adresse jedes Besuchers ohne Einwilligung an Google übertragen — in Deutschland abmahnrelevant (LG München I, Az. 3 O 17493/20). Da die Seite ein Impressum führt und auf eine deutsche Zielgruppe ausgerichtet ist, sollte das ernst genommen werden. **Empfehlung:** Fonts self-hosten (z. B. via google-webfonts-helper, 4 WOFF2-Dateien ins Repo) — nebenbei schneller und offline-fähig.

### 3.3 Kleinere Härtungen

- `Kalibrierprotokoll.html`: gespeicherte Istwerte aus localStorage werden unescaped in `value="…"`-Attribute eingefügt — nur Self-XSS-Potential, aber leicht zu härten (Escaping oder `el.value = …` statt String-Templating).
- `localStorage`-Statistik (`techtools_state.stats.visits` pro Tag/Seite) wächst unbegrenzt — Aufräumlogik (z. B. >90 Tage löschen) ergänzen.

---

## 4. 🟡 Funktionale Bugs (mittlere Priorität)

| # | Datei | Problem |
|---|---|---|
| 1 | `shared.js` | `initGermanFormat` (MutationObserver) zerstört Tausenderpunkt-Zahlen: aus `1.234.567` (toLocaleString) wird `1,234.567`. Betrifft Impulswertigkeit (Totalizer), Fließgeschwindigkeit, BlendeDP u. a. Der `dataset.formatted`-Schutz ist wirkungslos (wird sofort zurückgesetzt). Empfehlung: Formatierung den Tools überlassen (formatDE/toLocaleString) und den Observer entfernen. |
| 2 | `shared.js` | „Verwandte Tools" fehlen für 16 Tools komplett (tank, taupunkt, normdurchfluss, rohrklassen, dp_durchfluss, konzentration, mid_lf, schallgeschwindigkeit, loop_diagnose, sil_pfd, prozessanschluesse, eh_fehlercodes, inbetriebnahme, kalibrierprotokoll, csv, csvvisu) — `_TOOL_RELATIONS` hat keine Einträge. Und `einheiten` verlinkt auf **sich selbst** (`einheiten: [...,'einheiten']`). |
| 3 | `shared.js` | `resetFields()` setzt Zahlenfelder auf `defaultValue \|\| '0'` — optionale/leer gedachte Felder werden mit 0 gefüllt. |
| 4 | `Stromausgang.html` | NAMUR-Prüfung wertet **0 mA als „kein Wert"** (idle) statt als Gerätefehler/Drahtbruch (< 3,6 mA). `signalwert === 0` aus der Idle-Bedingung entfernen. |
| 5 | `Messwertabweichung.html` | Leere Zeilen zählen als Messpunkte (`\|\| 0`): direkt nach dem Laden meldet die Ampel „✓ Alle 5 Messpunkte innerhalb der Toleranz — Prüfung bestanden" ohne eine einzige Eingabe. Leere Inputs wie in Kalibrierpunkte/Dichteberechnung ausschließen. |
| 6 | `Messwertabweichung.html` | PDF-Statusfarbe sucht das Wort „bestanden" — die AFL-OK-Texte enthalten es nicht → grüner Status wird **rot** gedruckt. |
| 7 | `Kalibrierpunkte.html` | Reset löscht eingetragene Istwerte und die Verteilungsauswahl nicht (prev-Mechanismus restauriert sie). |
| 8 | `Buerdenrechner.html` | `iMax <= 0` fängt NaN nicht (NaN-Vergleich = false) → leeres Stromfeld zeigt „NaN Ω" überall. Gleiche NaN-Lücke: `Druckkalibrierung.html` (leeres patm-Feld → „NaN bar"). |
| 9 | `PHWert.html` | Steilheit > 105 %: im 2-Punkt-Modus Fehler (rot), im 3-Punkt-Modus nur „akzeptabel" — Obergrenze fehlt in `updateAmpel3p`. |
| 10 | `Statistiken.html` | `TOOL_NAMES` enthält nur 20 von 52 Tools → Nutzung aller Strahlenschutz-, WHG-, Elektro-Tools etc. erscheint nie in Chart/Tabelle. Außerdem rufen nur 4 Tools `trackCalculation()` auf → „Berechnungen gesamt" bleibt für ~48 Tools 0. Entweder flächendeckend tracken oder die Kachel entfernen. Tipp: `TOOL_NAMES` aus `_TOOL_META` (shared.js) generieren statt duplizieren. |
| 11 | `Kontakt.html` | Tool-Dropdown veraltet — nur 20 von 52 Tools wählbar. Ebenfalls aus `_TOOL_META` generierbar. |
| 12 | `style.css`/alle Seiten | **Dark-Mode-Flash (FOUC):** `data-theme="light"` ist hartkodiert, das Theme wird erst bei DOMContentLoaded gesetzt → heller Blitz bei jedem Seitenwechsel. Fix: 3-Zeilen-Inline-Skript im `<head>` vor dem CSS. |
| 13 | `Normdurchfluss.html` | Tote Funktion `getPbAbs()` mit widersprüchlichen Kommentaren — entfernen (Logik ist in `calc()` dupliziert). |
| 14 | `Tankinhalt.html` | `buildStuetzpunkte20()`: `all.slice(0, 20)` kann den URV-Endpunkt abschneiden. |

---

## 5. 🔵 Fachliche Hinweise (dokumentieren oder verbessern)

1. **Abschirmung.html:** Reine HVL-Exponentialrechnung ohne **Aufbaufaktor (Buildup)** — bei dicken Schilden (Beton, Wasser) wird die nötige Dicke systematisch unterschätzt. Mindestens als Warnhinweis ins UI („Richtwert ohne Buildup, Zuschlag einplanen"), da sicherheitsrelevant.
2. **Dosisleistung.html:** Γ-Konstanten sind Luftkerma-basiert (Co-60: 0,309); für Strahlenschutz üblich/konservativer wäre H*(10) (≈ 0,354). Quelle im UI angeben.
3. **Dosisleistung + Abstandsquadrat:** Zonen-Richtwerte Kontrollbereich 300 µSv/h / Überwachungsbereich 10 µSv/h sind unübliche Ableitungen — die Standard-Ableitung der StrlSchV über 2000 h/a ergibt 3 bzw. 0,5 µSv/h. Sperrbereich 3 mSv/h ist korrekt. Quelle angeben oder anpassen.
4. **Fliessgeschwindigkeit.html:** DN wird als Innendurchmesser angenommen (DN50 = 50,0 mm) — reale Rohre weichen ab. Das eigene Rohrklassen-/WHG-Tool hat echte Innendurchmesser; zumindest Hinweis ergänzen, besser DN→di-Lookup wie in `WHG_Rohrleitungsinhalt.html`.
5. **BlendeDP.html:** Expansionszahl ε fehlt → exakt nur für Flüssigkeiten; Hinweis für Gasanwendungen ergänzen.
6. **Normdurchfluss.html:** Einzelner Z-Faktor wirkt als Zb (Zn=1 angenommen) — Vereinfachung dokumentieren.
7. **Temperatursensor.html:** R/S-Toleranzformeln vereinfacht (IEC 60584 Kl. 1: ±1 °C bis 1100 °C, darüber 1+0,003·(t−1100)).
8. **Sauerstoff.html:** Druckkorrektur linear ohne Wasserdampfdruck-Abzug; **Dampftabelle.html:** „Druck (absolut)" explizit beschriften.

---

## 6. ⚪ Verbesserungspotential (UX, Architektur, Performance)

### UX
- **index.html:** Tool-Karten sind `div` + `window.location.href` statt `<a>` → kein Mittelklick/„in neuem Tab öffnen", keine Tastaturnavigation, schlechter für SEO. Karten als echte Links rendern (Drag&Drop bleibt mit `draggable` möglich).
- **Ctrl+L** für „Teilen" kapert den Browser-Standard (Adressleiste fokussieren) — anderes Kürzel erwägen.
- **Esc-Reset ≠ Reset-Button** auf Seiten mit eigenem `resetAll()` (z. B. Messwertabweichung: Esc entfernt hinzugefügte Zeilen nicht).
- **csv.html:** 50-MB-Dateien werden komplett als DOM-Tabelle gerendert → Browser-Freeze. Vorschau auf z. B. 500 Zeilen begrenzen („… und 12.000 weitere Zeilen"), Export weiter über die vollen Daten.
- PDF-Export (shared.js): Seitenumbruch-Prüfung erst **nach** dem Schreiben der Zeile; Charts/SVGs fehlen im Generik-PDF.
- Loop_Diagnose: Tippfehler Badge „Sättigungs" → „Sättigung". Stromausgang: Label „Messwert calc:" → „Messwert (berechnet)".

### Architektur / Wartbarkeit
- **Massive Duplikation:** Header/Footer/Action-Bar-Markup in 55 Dateien kopiert; `getSignalConfig()`, `fmt()`/`formatZahl()`, `getChartColors()`, `switchTab()` (mit deprecated implizitem `event`) existieren in zig Varianten. Bei „kein Build-Prozess" als Konzept: zumindest die JS-Helfer in shared.js konsolidieren; Tool-Metadaten (`DEFAULT_TOOLS` in index.html, `_TOOL_META` in shared.js, `TOOL_NAMES` in Statistiken, Dropdown in Kontakt) **vierfach** gepflegt → eine Quelle (shared.js) + Generierung.
- **Tests:** Für die Rechenkerne (Tankgeometrie, Umrechnungen, Thermoelemente) wäre eine kleine Test-HTML/Node-Testdatei Gold wert — drei der fünf kritischen Fehler (Klöpper, Zellkonstante, DP-Tabelle) wären mit je einem Referenzwert-Test sofort aufgefallen.
- README: „51 Tools" und „ASME B36.19" stimmen nicht mehr (52 Tools; B36.19-Edelstahlreihen fehlen im Rohrklassen-Tool).
- cat-Farbklassen doppelt definiert (style.css + index.html).

---

## 7. Tool-für-Tool-Status

| Tool | Status | Anmerkung |
|---|---|---|
| Stromausgang | 🟡 | NAMUR 0 mA-Bug; Rechnung korrekt |
| Kalibrierpunkte | 🟡 | Reset unvollständig; Rechnung korrekt |
| Messwertabweichung | 🟡 | Leere Punkte zählen; PDF-Farbe im AFL-Modus |
| Bürdenrechner | 🟡 | NaN-Anzeige; Formeln korrekt |
| Druckkalibrierung | 🟡 | NaN bei leerem patm; Faktoren korrekt |
| Loop-Diagnose | ✅ | Tippfehler; fachlich korrekt |
| Impulswertigkeit | 🟡 | Zahlenformat ≥1 Mio; Umrechnungen korrekt |
| Fließgeschwindigkeit | 🔵 | DN=di-Annahme; Logik korrekt |
| BlendeDP | ✅ | ISO 5167 korrekt (ε-Hinweis fehlt) |
| Einlaufstrecken | ✅ | — |
| Normdurchfluss | 🟡 | Toter Code; Physik korrekt |
| DP-Durchfluss-Skalierung | 🔴 | Kennlinien-Tabelle Faktor 10 |
| Dichteberechnung | ✅ | Statistik korrekt |
| Dichtetabelle | ✅ | — |
| pH Steilheit | 🟡 | >105 % inkonsistent; Nernst korrekt |
| Leitfähigkeit | 🔴 | Zellkonstante Faktor 100 |
| Sauerstoff | ✅ | Benson-Krause korrekt |
| Temperatursensor | 🔴/🔵 | Typ K Exponentialterm fehlt; Rest korrekt |
| MID Leitfähigkeit | ✅ | — |
| Konzentration | 🔴 | Ethanol defekt; Rest korrekt |
| Schallgeschwindigkeit | ✅ | Bilaniuk-Wong korrekt |
| Volumen-Masse | ✅ | — |
| Einheiten | ✅ | Alle Faktoren korrekt (Selbstlink „Verwandte Tools") |
| Viskosität | ✅ | — |
| Tankinhalt | 🔴 | Klöpper/Korbbogen-Geometrie (+70 % Bodenvolumen) |
| Taupunkt | ✅ | Magnus korrekt |
| Dampftabelle | ✅ | IF97-Daten korrekt |
| Wärmetechnik | ✅ | — |
| Schutzarten | ✅ | — |
| Flansch | ✅ | EN 1092-1 stichprobengeprüft |
| DK-Werte | ✅ | — |
| Rohrklassen | ✅ | B36.19 fehlt (README-Versprechen) |
| Prozessanschlüsse | ✅ | statisch |
| E+H Fehlercodes | ✅ | statisch |
| Abstandsquadrat | 🔵 | 1/r² korrekt; Zonengrenzen prüfen |
| Zerfall | ✅ | HWZ-Daten korrekt |
| Dosisleistung | 🔵 | Γ/A/r² korrekt; Γ-Quelle + Zonengrenzen dokumentieren |
| Abschirmung | 🔵 | korrekt, aber ohne Buildup-Hinweis |
| Aufenthaltszeit | ✅ | StrlSchG-Grenzwerte korrekt |
| Isotopdaten | ✅ | statisch |
| WHG Gefährdungsstufe | 🔴 | AwSV-Tabelle falsch |
| Rohrleitungsinhalt | ✅ | DIN EN 10255 korrekt |
| Auffangwanne | ✅ | max(größter, 10 %)-Regel korrekt |
| WGK-Nachschlagewerk | ✅ | statisch |
| Elektro-Grundlagen | ✅ | — |
| Kabelquerschnitt | ✅ | VDE-Logik korrekt (cos φ vereinfacht) |
| Inbetriebnahme | ✅ | statisch |
| Kalibrierprotokoll | 🟡 | Attribut-Injection härten; Logik korrekt |
| SIL/PFD | ✅ | λ·TI/2 korrekt |
| CSV-Umwandler | 🟡 | XSS sauber escaped; Performance bei Großdateien |
| CSV-Visualisierung | ✅ | — |
| Statistiken | 🟡 | nur 20 Tools erfasst, Berechnungszähler tot |

---

## 8. Priorisierte Maßnahmenliste

**Sofort (falsche Ergebnisse):** — ✅ **alle 6 am 11.06.2026 behoben** (verifiziert mit 32 Referenzwert-Tests, `verify_fixes.js`)
1. ✅ Tankinhalt: `headParams`-Formel + `headRadiusAtY` korrigiert, toter `volVCyl` gelöscht (Klöpper-Volumen jetzt 0,0990·D³ vs. Literatur 0,0998; hb=383,7 mm vs. DIN 382,5 mm bei Da=2000/S=10)
2. ✅ WHG Gefährdungsstufe: AwSV-Matrix (§ 39 Tab. 1) mit Volumengrenzen 0,22/1/10/100/1000 m³ implementiert
3. ✅ Leitfähigkeit: Zellkonstanten-Formeln korrigiert (Faktor 1e6 statt 1e4/·100)
4. ✅ DPDurchfluss: `10 * Math.sqrt(dpPct)` in der Kennlinien-Tabelle
5. ✅ Konzentration: Interpolation richtungsunabhängig (Ethanol funktioniert)
6. ✅ Temperatursensor: Typ-K-ITS-90-Exponentialterm ergänzt (0 °C → 0,000 mV; 100 °C → 4,096 mV)

**Kurzfristig (Sicherheit/Datenschutz):**
7. CDN-Versionen pinnen + SRI, oder Chart.js/jsPDF/autotable lokal hosten
8. Google Fonts self-hosten

**Mittelfristig (Bugs/UX):**
9. initGermanFormat-Observer entfernen, Formatierung vereinheitlichen
10. NaN-Guards (Bürde, Druckkalibrierung), NAMUR-0mA, Messwertabweichung-Leerzeilen + PDF-Farbe
11. Theme-Inline-Skript gegen Dark-Mode-Flash
12. Tool-Metadaten zentralisieren (Verwandte Tools, Statistiken, Kontakt-Dropdown aus einer Quelle)
13. index-Karten als echte `<a>`-Links

**Langfristig:**
14. Mini-Testdatei für Rechenkerne (Referenzwerte aus Normen)
15. CSV-Vorschau-Limit, PDF-Export-Verbesserungen, Buildup-/Quellen-Hinweise Strahlenschutz

---

*Audit durchgeführt mit vollständiger Code-Durchsicht aller 55 Dateien. Formelnachweise: DIN 28011 (h2≈0,1935·Da), AwSV §39 Tab. 1, NIST ITS-90 Typ K, CRC Handbook (Dichten), IAPWS-IF97 (Sattdampf), ISO 5167, IEC 60751/60584, StrlSchV/StrlSchG.*
