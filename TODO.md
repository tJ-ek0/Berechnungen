# TODO — Stand 12.06.2026 (nach Fix-Runde 2 + UI-Runde + globale Grundlagen)

## ✅ Globale Grundlagen (12.06.2026, vor der Tool-für-Tool-Runde)

- [x] **Command Palette (Strg+K)**: von jeder Seite Tool suchen & öffnen (`initCommandPalette` in shared.js war schon geschrieben — jetzt verkabelt + CSS ergänzt)
- [x] **Berechnungs-Verlauf pro Tool**: letzte 5 Eingabe-Schnappschüsse in localStorage, Klick stellt wieder her (`initHistory` verkabelt; CSS existierte bereits)
- [x] **PWA-Banner**: „Als App installieren" (einmalig, abweisbar) + „Neue Version verfügbar — neu laden" bei SW-Update (`initPwaUx` verkabelt + CSS); **SW-Cache auf v2** erhöht
- [x] **Theme „Auto"** (System) als dritter Zustand — war bereits vollständig umgesetzt
- [x] **Ergebnis-Flash**: geänderte `.result-field`-Werte pulsen kurz auf (MutationObserver; respektiert `prefers-reduced-motion`; via box-shadow/brightness, da background `!important` ist)
- [x] **Print-Stylesheet**: `@media print` blendet Header/Footer/Buttons/Verwandte/Verlauf aus; Druck erzwingt helles Theme (`beforeprint`/`afterprint`)
- [x] **Barrierefreiheit**: `aria-live="polite"` + `role="status"` auf der Ampel, `aria-label` auf Theme-Toggle und Favoriten-Stern, Skip-Link „Zum Inhalt springen"
- Verifiziert: `node tests/verify_fixes.js` (32 PASS) + `node tests/syntax_check.js` (110 Blöcke, 0 Fehler)

## ✅ Layout-Fundament (12.06.2026, zweiter Teil — alles generisch in shared.js/style.css)

- [x] **Zwei-Spalten-Layout Desktop (≥1100px)**: `initTwoColumnLayout()` verschiebt automatisch Ampel, Ergebniszeilen (`tr` mit `td.result-field` ohne Inputs — Einheiten-Selects dürfen mit), `.result-grid`-Karten, `.fill-bar` und per `data-pane="results"` markierte Blöcke in eine sticky rechte Spalte. Ergebniszeilen werden pro Quelltabelle zu Karten-Gruppen (`.result-group`, Titel als `th` → bleibt im PDF-Export erhalten). IDs/Listener bleiben erhalten (Nodes werden verschoben, nicht kopiert). **27 von 55 Seiten** bekommen das Layout automatisch; Tab-Tools (Temperatursensor, Viskosität, Schutzarten) und reine Nachschlagewerke bleiben korrekt einspaltig. Opt-out: `data-no-twocol` am body. Mobile (<1100px) unverändert inkl. Sticky-Ampel.
- [x] **Input-Groups**: `initInputGroups()` fasst `[Zahl] mm`-Textsuffixe und direkt folgende Einheiten-Selects (≤16 Optionen, Opt-out `data-no-group`) generisch zu `.input-group` zusammen — kein Umbruch zwischen Feld und Einheit mehr
- [x] **Tabellen-Toolbar**: `initTableToolbar()` — Spalten-Sortierung per th-Klick (deutsche Zahlen, aria-sort, ab 16 Zeilen, nicht bei colspan/rowspan oder eigener Sortierung wie Dichtetabelle/WGK) + Suchfeld mit „X von Y Zeilen"-Zähler (ab 25 Zeilen, nur wenn die Seite keine eigene Suche hat). Opt-out: `data-no-toolbar`/`data-no-sort`
- [x] **„Weiterrechnen mit"-Verkettung**: `chainButton()`-Helper + `.chain-btn`/`.chain-link`-CSS; umgesetzt: Dichtetabelle → Volumen↔Masse (Dichte+Einheit), WGK-Tabelle → Gefährdungsstufe (WGK), Rohrklassen → Fließgeschwindigkeit (di klickbar). Fix dabei: `loadUnitPresets` überschreibt keine URL-Parameter mehr (Share-Link/Verkettung hat Vorrang)
- [x] Flagship-Marker: Tank-SVG (Tankinhalt), Loop-Visualisierung (Bürdenrechner) → `data-pane="results"`
- [x] **Impulswertigkeit-Check** (12.06., abends): Rechenlogik verifiziert (Einheiten-Umrechnung, 50%-DC-Impulsbreite, effektives Limit). Gefixt: (1) Share-Link/Verlauf mit Masse-Typ — `loadFromShareLink` und History-Restore feuern jetzt `change` auf Selects, damit Typ-Umschalter die abhängigen Einheiten-Selects umbauen, bevor deren Wert gesetzt wird (generisch, hilft auch Tankinhalt-Bodenform etc.); (2) eigenes `resetAll()` — `resetFields` ließ Masse-Einheiten-Optionen bei typ=Volumen stehen und Preset-Markierungen aktiv; (3) Frequenz-Gauge, Messpunkt-Tabelle („Frequenz & Impulsbreite nach Durchfluss-Anteil") und Diagramm als Ausgaben nach rechts (`data-pane="results"`); Totalizer-Hochrechnung bewusst links unter der Hauptberechnung (rechte Spalte soll ohne Scrollen passen), Ergebniskarten dafür als 2×2-Raster (Seiten-CSS); (4) generisch: Karten-Gruppen entstehen jetzt an der Position ihrer Quelltabelle (rechte Spalte in inhaltlicher Reihenfolge — vorher landete der Totalizer über den Hauptergebnissen) und der Grid-Anker ist das erste Eingabe-Element (Tankinhalt: Eingaben jetzt wirklich links neben den Ergebnissen); tote Funktion `getImpulsEinheitLabel()` entfernt. Dedizierter Test: `.smoketest/impuls.js` (21 Checks)
- [x] **Impulswertigkeit-Ausbau mit E+H-Fokus** (12.06., spät): (1) **Feste Impulsbreite** als optionales Systemlimit-Feld (E+H-Parameter „Impulsbreite"): Prüfung rechnet dann mit konstanter Breite statt 50% DC, f_max = 1000/(2·B), Engpass-Badge „Impulsbreite", Konflikt-Warnung wenn B < SPS-Mindestbreite, Ergebnis-Label wechselt auf „(konfiguriert)", Messpunkt-Tabelle nutzt konstante Breite; (2) **Rundwert-Vorschlag (1-2-5-Reihe)** in der Rückrechnung mit resultierender Frequenz und Limit-Check (aufgerundet = sichere Richtung); (3) **„Beispiel"-Button** (Promag, 45 m³/h, 10 ltr/Imp, langsame SPS); (4) Rückrechnungs-Sektionen als einklappbare `<details>` (Titel-th bleibt für PDF, per CSS versteckt); (5) Reduced-Motion für Fehler-Puls, Preset-Buttons mobil größer, Aktivfarben theme-fest; (6) **Generisch in shared.js (initA11y): programmatische `aria-label`** für alle Eingaben aus Zeilen-Label (erste Tabellenzelle, Selects mit Suffix „— Einheit") bzw. vorangehendem `<label>` — wirkt auf allen 55 Seiten. Tests: `.smoketest/impuls.js` jetzt 44 Checks
- [x] **Stromausgang-Check + Ausbau** (12.06., spät): Rechenlogik und NAMUR-NE43-Grenzen verifiziert. Gefixt: (1) **NaN-Anzeige** — „Messwert → Signal" und „Prozent →" zeigten bei geleertem Feld „NaN", geleerter Messbereich ergab NaN/stale Ergebnisse (jetzt Guards + Schnelltabelle wird geleert); (2) **Sättigungshinweise**: berechnete Signale außerhalb 3,8–20,5 mA („außerhalb des linearen Bereichs") bzw. außerhalb 3,6–21 mA („NE43-Fehlerbereich — reale Geräte sättigen") werden in beiden Richtungen markiert, bei 0–20 mA/0–10 V gegen den Signalbereich geprüft. Neu: (3) **NAMUR-Skala** (SVG, nur 4–20 mA): NE43-Zonen rot/gelb/grün mit beschrifteten Grenzen 3,6/4/20/20,5/21 und Marker für den eingegebenen Signalwert, theme-fähig über CSS-Variablen, rechts unter der Ampel; (4) Schnelltabelle als Ausgabe nach rechts (`data-pane="results"`), Ergebniskarten kompakt (Wert + % nebeneinander, Seiten-CSS); (5) explizite aria-labels für Messbereich Anfang/Ende. Tests: `.smoketest/stromausgang.js` (33 Checks)
- [x] **Tankinhalt-Prüfstand + Umbau** (12.06., nachts — Nutzer-Recherche zu Datenblättern): (1) **Gerätedatenbank ersetzt** — alte Liste war falsch („FMR50 76 GHz" → FMR5x war 26 GHz; „FMR10 6 GHz"; FMU-Blockdistanzen pauschal 250 mm): jetzt Micropilot-B-Serie 80 GHz (FMR10B/20B/30B: 8°=40 mm/4°=80 mm; FMR43/60B/62B/63B/66B/67B mit Winkelsätzen laut Datenblatt), Prosonic FMU30(1½″/2″)/40/41/42/43/44 mit korrekten BDs (250/350/250/350/400/600/500 mm) und Winkeln (11/11/11/11/9/6/11°); **Antennen-Varianten-Auswahl** setzt den Abstrahlwinkel; (2) **Einbau-Bewertung neu** (Ampel + Checkliste rechts unter der Visualisierung): Strahlkegel-Ø auf LRV-Höhe vs. Wandabstand inkl. **Stutzen-Versatz HmSt** (war totes Eingabefeld!), Strahl im Stutzenrohr vs. RSt, Sperrbereich vs. Stutzen/Tankdecke (B-Serie BD=0 → Hinweis Vollabgleich ≥ Stutzen+10 mm), Sondenlänge vs. Tankhöhe (≥10 mm Bodenabstand) + LRV vs. Sondenende+BDB, Gerät bei Seiten-/Boden-Stutzen → Fehler, URV vs. Tankhöhe; (3) **SVG**: Stutzen/Gerät am HmSt-Versatz, Abstrahlkegel nicht mehr stumm geclippt — **Wandkontakt rot markiert**, zu lange Sonde rot; (4) **Linearisierungstabelle korrigiert**: „Füllstand (%)" zeigte Volumen-% — jetzt getrennte Spalten „Füllstand (% v. MB)" (= Transmitter-Prozent) und „Volumen (%)", Punkte über Tankhöhe rot markiert, CSV angepasst; URV-Default 5000→4500 (lag über der Default-Tankhöhe 4837). Tests: `.smoketest/tankinhalt.js` (30 Checks, Harness jetzt mit voller Init-Kette via runScripts dangerously+beforeParse)
- [x] **Tankinhalt Runde 2: Zeichnungs-Korrektheit + Formatierung** (12.06., nachts): (1) **Stutzen-Positionierung sichtbar** — `onNozzlePosChange()` lief nie beim Init, der HmSt-Versatz („Stutzen-Position auf dem Deckel") war bei Default „Oben" unsichtbar; Label klarer, negativer Versatz erlaubt; (2) **Passstück HP war totes Feld** — geht jetzt in die Sensor-Referenzhöhe ein (oben +HP, unten −HP); (3) **Zeichnung für ALLE Bodenarten korrekt**: konischer Boden/Deckel, schräger Boden (symmetrische Keil-Näherung) und freier Radius wurden vorher als Flachboden gezeichnet → Füllstand-/LRV-Linien saßen falsch; neuer profilbasierter Pfad-Builder, Zeichnungshöhe == Rechenhöhe für alle Formen (Test: Fülllinie bei 100% exakt an Oberkante, Δ 0,0 px); (4) **Formatierung**: Inline-Hinweistexte als `.field-hint` auf eigener Zeile (brachen in der linken Spalte wild um), rechte Spalte mit einheitlichen Block-Abständen; (5) Tests massiv erweitert: `.smoketest/tankinhalt.js` jetzt **47 Checks**, darunter systematisch „Eingabe → wirkt auf Zeichnung" für Da/S/L/Boden-/Deckelart/Füllstand/HmSt/LRV/Abstrahlwinkel/Seiten-Stutzen/HP
- [x] **Dichteberechnung-Check + Ausbau** (12.06., nachts): Rechenlogik verifiziert (Mittelwert, Stichproben-Stabw, g/ml=kg/l). Gefixt: (1) **Share-Link/Verlauf verloren die Messwerte** — dynamische Messzeilen hatten keine IDs; jetzt `messung_N`-IDs + Init-Pre-Scan, der Zeilen aus URL-Parametern wieder anlegt; (2) **negative Netto-Gewichte** (Tara > Messung) liefen stumm in negative Dichte — jetzt Fehler-/Warn-Ampel; (3) neue **Qualitäts-Ampel** (idle/ρ+Streuung+Qualität/hohe Streuung ≥2%/unplausibel >25 kg/l/Netto≤0) statt nur Badge in der Statistik; (4) Statistik-Box + neuer **Chain-Link** („mit dieser Dichte in Volumen↔Masse weiterrechnen", href live aktualisiert) als Ausgaben nach rechts (`data-pane`); (5) Beispiel-Button (100-ml-Kolben, Tara 50 g, 3 Wägungen), aria-labels für Messzeilen, resetAll setzt jetzt auch Rückrechnungs-Selects zurück, `.signal-label`-CSS ergänzt (war undefiniert). Tests: `.smoketest/dichteberechnung.js` (20 Checks)
- Verifiziert: jsdom-Smoke-Tests über alle 55 Seiten (Invarianten: keine verlorenen result-fields/IDs, keine Eingabefelder rechts) + Funktionstests (Rechnen/Sortieren/Filtern/Reset/Verkettung nach Umbau) in `../.smoketest/` (außerhalb des Repos), dazu `tests/verify_fixes.js` (32 PASS) und `tests/syntax_check.js` (0 Fehler)

## 🔭 Ideen für die Tool-für-Tool-Runde

- [ ] Tools, die noch einspaltig sind, einzeln prüfen: Tab-Tools (Temperatursensor, Viskosität) und Seiten ohne markierte Ergebnisblöcke (Druckkalibrierung, Leitfähigkeit, Sauerstoff, Kalibrierpunkte …) — ggf. `data-pane="results"` setzen oder Markup auf `.result-grid` umstellen
- [ ] Weitere Verkettungen (z. B. Dampftabelle → Normdurchfluss, Isotopdaten → Zerfall/Dosisleistung)
- [ ] Bespoke-Suchen der Nachschlagewerke optisch an die `.table-toolbar` angleichen

## ✅ UI-Runde (11.06.2026, abends)

- [x] **SVG-Icon-System statt Emojis**: 35 einheitliche Stroke-Icons (Feather-Stil) in shared.js (`_ICONS` + `toolIconSvg()`); genutzt von Tool-Karten (Startseite), „Verwandte Tools" und „Zuletzt benutzt". Beschreibungs-Emojis und Ampel-Symbole (✓/⚠/✕) bewusst belassen (Text-Ebene, konsistent).
- [x] **Startseite**: „Zuletzt benutzt"-Zeile (aus vorhandenem lastUsed-Tracking), Such-Verbesserungen (×-Button, Enter öffnet ersten Treffer, `<mark>`-Hervorhebung im Titel)
- [x] **Sticky Tabellenköpfe** (Desktop) + **Zebra-Streifen** (automatisch auf Tabellen >15 Zeilen) + **Scroll-to-Top-Button** (global ab 600 px)
- [x] **Sticky Ergebnis-Ampel auf Mobile** (Statusleiste klebt unter dem Header)
- [x] **„Beispiel laden"-Buttons** in Stromausgang und Messwertabweichung
- [x] **Klick auf Ergebnisfeld kopiert den Wert** (global, mit „✓ kopiert"-Feedback)
- [x] **Footer mit Impressum/Kontakt/Statistiken auf allen 55 Seiten** (Impressumspflicht)
- [x] **PWA**: manifest.json, sw.js (Precache aller 68 Dateien + Stale-While-Revalidate), Icons (SVG + 512/192/180 PNG) — Seite ist installierbar und komplett offline nutzbar
- [⏸] Ergebnis-Darstellung vereinheitlichen (Tabellen vs. Karten): bewusst zurückgestellt — erfordert Umbau von ~40 Tool-Layouts; CSS-Polish (Hover/Copy) ist drin



Alle 6 kritischen Rechenfehler sowie die Prioritäten 1–3 aus dem Audit sind **umgesetzt und verifiziert**
(32 Referenztests + Syntax-Check über alle 110 Inline-Skriptblöcke: `node tests/verify_fixes.js`, `node tests/syntax_check.js`).

## ✅ Erledigt in dieser Runde

**Sicherheit & Datenschutz**
- [x] Chart.js 4.4.0, chartjs-plugin-zoom, jsPDF 2.4.0, jspdf-autotable **lokal gehostet** (`lib/`) — kein CDN, keine ungepinnten Versionen mehr, SRI damit obsolet
- [x] IBM Plex Sans/Mono **selbst gehostet** (`fonts/`) — kein Google-Fonts-Abruf mehr (DSGVO)
- [x] Kalibrierprotokoll: localStorage-Werte werden nur noch als validierte Zahlen per `el.value` gesetzt (keine Attribut-Injection)
- [x] localStorage-Statistik wird automatisch auf 90 Tage begrenzt

**Funktionale Bugs**
- [x] initGermanFormat: zerstört keine Tausenderpunkte mehr (Komma-/Mehrpunkt-Erkennung); fmt-Funktionen in Fließgeschwindigkeit/BlendeDP/Viskosität liefern immer eine Dezimalstelle
- [x] Stromausgang: 0 mA = NAMUR-Fehler (Drahtbruch), leeres Feld = idle; Labels „Messwert/Signal (berechnet)"
- [x] Messwertabweichung: leere Zeilen zählen nicht mehr als Messpunkte (Start-Inputs jetzt leer, Chart mit Lücken); PDF-Statusfarbe über Ampel-Klasse statt Textsuche
- [x] Kalibrierpunkte: Reset leert jetzt Istwerte, Verteilung und Custom-Punkte
- [x] NaN-Guards: Bürdenrechner (leeres Stromfeld), Druckkalibrierung (leeres patm-Feld)
- [x] pH: Steilheit > 105 % ist auch im 3-Punkt-Modus Fehler (inkl. „zu hoch"-Begründung)
- [x] Dark-Mode-Flash (FOUC): Inline-Theme-Skript im `<head>` aller 55 Seiten
- [x] Statistiken: Tool-Namen aus `_TOOL_META` generiert (alle Tools); Berechnungszähler funktioniert jetzt überall (gedrosseltes Auto-Tracking in shared.js)
- [x] Kontakt: Tool-Dropdown aus `_TOOL_META` generiert (vollständig, alphabetisch)
- [x] Verwandte Tools: 17 fehlende Einträge ergänzt, Einheiten-Selbstlink entfernt
- [x] shared.js resetFields füllt leere Felder nicht mehr mit „0"; Esc nutzt seitenspezifisches `resetAll()`, falls vorhanden
- [x] Normdurchfluss: tote Funktion `getPbAbs()` entfernt
- [x] Tankinhalt: Stützpunkte-Kürzung behält URV-Punkt

**Fachliche Hinweise (UI)**
- [x] Abschirmung: Buildup-Warnhinweis
- [x] Dosisleistung + Abstandsquadrat: Quellen-/Einordnungshinweis zu Γ-Konstanten und Zonen-Richtwerten
- [x] Fließgeschwindigkeit: Hinweis DN ≈ Innendurchmesser mit Link aufs Rohrklassen-Tool
- [x] BlendeDP: Gültigkeitshinweis (ohne ε, exakt für Flüssigkeiten)
- [x] Normdurchfluss: Z = Zb dokumentiert (Zn = 1)
- [x] Temperatursensor: R/S-Toleranzen nach IEC 60584-1 präzisiert
- [x] Loop-Diagnose: Tippfehler „Sättigungs" behoben

**UX & Architektur**
- [x] **Frontpage: alle Tool-Icons einheitlich** in einer Farbe (`--bg-accent`) — Kategorie-Färbung und CAT_COLOR/cat-\*-CSS komplett entfernt (Nutzerwunsch)
- [x] index: Tool-Karten sind echte `<a>`-Links (Mittelklick, neuer Tab, Tastatur)
- [x] CSV-Umwandler: Vorschau auf 500 Zeilen begrenzt (Exporte bleiben vollständig)
- [x] PDF-Export (shared.js): Seitenumbruch wird vor dem Schreiben geprüft
- [x] README: B36.19-Versprechen korrigiert, lokale Libs/Fonts dokumentiert
- [x] Tests im Repo: `tests/verify_fixes.js` (32 Referenzwerte) + `tests/syntax_check.js`

## 🔲 Noch offen (bewusst zurückgestellt)

- [ ] **Committen & pushen** — alle Änderungen sind nur lokal; erst danach ist die Live-Seite korrigiert!
- [ ] Ctrl+L-Shortcut (Teilen) kapert weiterhin die Browser-Adressleiste — Änderung würde die Shortcut-Hinweistexte auf ~20 Seiten betreffen; bei Gelegenheit auf z. B. Ctrl+Shift+S umstellen
- [ ] Tool-Metadaten-Zentralisierung Teil 2: `DEFAULT_TOOLS` in index.html (Beschreibungen/Tags) bleibt eigene Liste — könnte mit `_TOOL_META` zu einer Quelle verschmolzen werden (größerer Umbau)
- [ ] JS-Helfer-Duplikate (`getSignalConfig`, `fmt`-Varianten, `getChartColors`, `switchTab` mit implizitem `event`) in shared.js konsolidieren — reiner Wartbarkeits-Refactor, kein Bug
- [ ] Generik-PDF: Charts/SVGs einbetten (aktuell nur Tabellen; Messwertabweichung/CSV haben eigene PDF-Exporte mit Chart)
- [ ] Optional: ASME-B36.19-Edelstahlreihen (5S/10S/40S) als Daten ins Rohrklassen-Tool aufnehmen
- [ ] Optional: CSP-Meta-Tag (`Content-Security-Policy`) — durch das Self-Hosting deutlich an Dringlichkeit verloren
- [ ] Bei neuen/geänderten Formeln: `tests/verify_fixes.js` um Referenzwerte erweitern
