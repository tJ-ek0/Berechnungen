// Service Worker — macht die Tools offline nutzbar (PWA)
// Strategie: Stale-While-Revalidate für alle Same-Origin-GETs,
// Kern-Dateien werden bei der Installation vorgeladen.
const CACHE = 'techtools-v2';

const CORE = [
    './',
    'index.html',
    'style.css',
    'shared.js',
    'manifest.json',
    'icon.svg',
    'lib/chart.umd.min.js',
    'lib/chartjs-plugin-zoom.min.js',
    'lib/jspdf.umd.min.js',
    'lib/jspdf.plugin.autotable.min.js',
    'fonts/ibm-plex-sans-v23-latin_latin-ext-regular.woff2',
    'fonts/ibm-plex-sans-v23-latin_latin-ext-500.woff2',
    'fonts/ibm-plex-sans-v23-latin_latin-ext-600.woff2',
    'fonts/ibm-plex-mono-v20-latin_latin-ext-regular.woff2',
    'fonts/ibm-plex-mono-v20-latin_latin-ext-500.woff2',
    // Alle Tool-Seiten — damit ist die komplette Sammlung offline nutzbar
    'Abschirmung.html', 'Abstandsquadrat.html', 'Aufenthaltszeit.html', 'BlendeDP.html',
    'Buerdenrechner.html', 'csv.html', 'csvauswertung.html', 'Dampftabelle.html',
    'Dichteberechnung.html', 'Dichtetabelle.html', 'DKWerte.html', 'Dosisleistung.html',
    'DPDurchfluss.html', 'Druckkalibrierung.html', 'EH_Fehlercodes.html', 'Einbaulaengen.html',
    'Einheiten.html', 'Elektro_Grundlagen.html', 'Flansch.html', 'Fliessgeschwindigkeit.html',
    'Impressum.html', 'Impulswertigkeit.html', 'Inbetriebnahme.html', 'Isotopdaten.html',
    'Kabelquerschnitt.html', 'Kalibrierprotokoll.html', 'Kalibrierpunkte.html', 'Kontakt.html',
    'Konzentration.html', 'Leitfaehigkeit.html', 'Loop_Diagnose.html', 'Messwertabweichung.html',
    'MID_Leitfaehigkeit.html', 'Normdurchfluss.html', 'PHWert.html', 'Prozessanschluesse.html',
    'Rohrklassen.html', 'Sauerstoff.html', 'Schallgeschwindigkeit.html', 'Schutzarten.html',
    'SIL_PFD.html', 'Statistiken.html', 'Stromausgang.html', 'Tankinhalt.html', 'Taupunkt.html',
    'Temperatursensor.html', 'Viskositaet.html', 'VolumenMasse.html', 'Waermetechnik.html',
    'WHG_Auffangwanne.html', 'WHG_Gefaehrdungsstufe.html', 'WHG_Rohrleitungsinhalt.html', 'WHG_WGK.html',
    'Zerfall.html'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE)
            .then(c => c.addAll(CORE))
            .catch(() => {}) // einzelne Fehlschläge dürfen die Installation nicht blockieren
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    if (url.origin !== location.origin) return;

    e.respondWith(
        caches.open(CACHE).then(async (cache) => {
            const cached = await cache.match(e.request);
            const network = fetch(e.request).then((resp) => {
                if (resp && resp.ok) cache.put(e.request, resp.clone());
                return resp;
            }).catch(() => cached);
            // Cache sofort liefern, im Hintergrund aktualisieren
            return cached || network;
        })
    );
});
