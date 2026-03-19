# Techniker Berechnungstools

Sammlung von Berechnungstools für die Prozessmesstechnik — speziell für Servicetechniker im Bereich Durchfluss, Füllstand, Druck, Temperatur und Analytik. Gehostet auf GitHub Pages.

## 20 Tools

### Kalibrierung & Signal
| Tool | Beschreibung |
|------|-------------|
| **Stromausgangsberechnung** | Signal ↔ Messwert (4–20 mA / 0–20 mA / 0–10 V) mit NAMUR NE43 Bewertung und Kalibriertabelle |
| **Kalibrierpunkte** | Kalibriertabelle für alle Signaltypen mit wählbarer Einheit (0% bis 100%) |
| **Messwertabweichung** | Soll-Ist-Vergleich mit Toleranzprüfung, Statistik, Balkendiagramm und PDF-Protokollexport |
| **4-20mA Bürdenrechner** | Schleifenwiderstand, max. Kabellänge, HART-Prüfung, Schaltplan-Visualisierung |

### Durchfluss
| Tool | Beschreibung |
|------|-------------|
| **Impulswertigkeitsberechnung** | Impulswertigkeit, Totalizer (Schicht/Tag/Woche), Rückrechnung, Max. Durchfluss |
| **Fließgeschwindigkeit** | DN-Standardgrößen, Ampel-Bewertung, Rückrechnungen, Vergleichstabelle aller DN |
| **Blenden/DP-Durchflussrechner** | Durchfluss aus Differenzdruck nach ISO 5167 — K-Faktor oder Blendengeometrie |
| **Einlaufstrecken-Rechner** | Gerade Ein-/Auslaufstrecken für 6 Messgerätetypen × 9 Störquellen mit Rohrleitungs-SVG |

### Umrechnung
| Tool | Beschreibung |
|------|-------------|
| **Volumen-Masse-Umrechnung** | Beide Richtungen gleichzeitig + Volumenstrom ↔ Massenstrom mit Dichte |
| **Einheiten-Universalrechner** | 8 Kategorien: Druck, Temperatur, Länge, Fläche, Volumen, Masse, Durchfluss, Geschwindigkeit |
| **Viskositäts-Umrechner** | Dynamisch ↔ Kinematisch, alle Einheiten, Medien-Referenztabelle mit 40 Stoffen |
| **Tankinhalt-Rechner** | Füllvolumen aus Füllstand für stehenden/liegenden Zylinder, Kugel und Konus |

### Analytik & Sensoren
| Tool | Beschreibung |
|------|-------------|
| **Dichteberechnung** | Flexible Messungen, Tara, Streuungsanalyse, 3 Einheiten gleichzeitig, Rückrechnung |
| **pH Steilheit** | Nernst-Temperaturkompensation, Steilheit in %, Nullpunkt, Kennlinien-Chart |
| **Temperatursensor-Rechner** | Pt100/Pt1000 (Callendar-Van-Dusen) und Thermoelemente Typ K, J, T, E, N |
| **Dampftabelle** | Sattdampf: Druck ↔ Temperatur, Enthalpie, Dichte, spez. Volumen (52 Stützpunkte) |

### Nachschlagewerke
| Tool | Beschreibung |
|------|-------------|
| **Schutzarten-Nachschlagewerk** | IP-Decoder, Zündschutzarten, Explosionsgruppen, Temperaturklassen, Ex-Zonen |
| **DN/Flansch-Tabelle** | DIN EN 1092-1 Flanschabmessungen für PN10–PN40, DN10–DN600, ANSI-Vergleich |

### CSV-Tools
| Tool | Beschreibung |
|------|-------------|
| **CSV-Umwandler** | Drag & Drop, Auto-Trennzeichen, Encoding-Auswahl, Spaltenfilter, Dezimalformat, 4 Exportformate |
| **CSV-Visualisierung** | MultiRecorder-Daten als interaktive Graphen mit Zoom, Statistik und PDF-Export |

## Features

- **Design** — GitHub-inspiriertes Design mit Dark/Light Mode
- **Startseite** — Drag & Drop Sortierung, Favoriten, Kategoriefilter, Suchfeld
- **Alle Tools** — Live-Berechnung bei Eingabe, Ergebnisse in Echtzeit
- **Ampel-Bewertung** — Farbliche Statusanzeige (grün/gelb/rot) auf den meisten Tools
- **Tastenkürzel** — Ctrl+C (Kopieren), Esc (Zurücksetzen), Ctrl+P (PDF), Ctrl+L (Teilen)
- **Teilen** — URL-Parameter für vorausgefüllte Werte
- **PDF-Export** — auf allen Tools verfügbar
- **Deutsche Zahlenformatierung** — Komma als Dezimalzeichen in Ergebnisfeldern
- **Kontaktformular** — Vorschläge und Fehlermeldungen per E-Mail
- **Statistiken** — Lokale Nutzungsstatistiken (Seitenaufrufe, Tool-Nutzung)
- **Responsive** — Funktioniert auf Desktop und Mobilgeräten
- **Offline-fähig** — Alle Tools sind clientseitig, keine Server-Berechnung

## Technologie

- Reines HTML, CSS, JavaScript — kein Framework, kein Build-Prozess
- Chart.js für Diagramme
- jsPDF + autoTable für PDF-Export
- GitHub Pages für Hosting
- localStorage für Theme, Favoriten, Sortierung und Statistiken

## Dateien

```
index.html              — Startseite / Dashboard
shared.js               — Gemeinsame Funktionen (Theme, Shortcuts, PDF, etc.)
style.css               — Design-System (CSS-Variablen, Dark/Light Mode)
Stromausgang.html       — Stromausgangsberechnung
Dichteberechnung.html   — Dichteberechnung
Impulswertigkeit.html   — Impulswertigkeitsberechnung
VolumenMasse.html       — Volumen-Masse-Umrechnung
Fliessgeschwindigkeit.html — Fließgeschwindigkeit
Kalibrierpunkte.html    — Kalibrierpunkte
Messwertabweichung.html — Messwertabweichung
PHWert.html             — pH Steilheit
csv.html                — CSV-Umwandler
csvauswertung.html      — CSV-Visualisierung
Temperatursensor.html   — Temperatursensor-Rechner
Einheiten.html          — Einheiten-Universalrechner
Tankinhalt.html         — Tankinhalt-Rechner
Dampftabelle.html       — Dampftabelle
Einbaulaengen.html      — Einlaufstrecken-Rechner
Buerdenrechner.html     — 4-20mA Bürdenrechner
BlendeDP.html           — Blenden/DP-Durchflussrechner
Schutzarten.html        — Schutzarten-Nachschlagewerk
Flansch.html            — DN/Flansch-Tabelle
Viskositaet.html        — Viskositäts-Umrechner
Kontakt.html            — Kontaktformular
Statistiken.html        — Nutzungsstatistiken
Impressum.html          — Impressum
```
