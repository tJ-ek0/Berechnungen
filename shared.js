/* ============================================
   SHARED UTILITIES — Techniker Berechnungstools
   ============================================ */

// ============ THEME (Auto / Hell / Dunkel) ============
let _onThemeChanged = null;
const _darkMq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function getThemePref() {
    const t = getGlobalState().theme;
    return (t === 'light' || t === 'dark') ? t : 'auto';
}

function effectiveTheme(pref) {
    if (pref === 'auto') return (_darkMq && _darkMq.matches) ? 'dark' : 'light';
    return pref;
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', effectiveTheme(getThemePref()));
    updateThemeIcon();
    if (_onThemeChanged) _onThemeChanged();
}

function initTheme() {
    applyTheme();
    if (_darkMq) _darkMq.addEventListener('change', () => { if (getThemePref() === 'auto') applyTheme(); });
    // Druck immer in Hell — Dark-Mode-Farben sind auf Papier unleserlich
    window.addEventListener('beforeprint', () => document.documentElement.setAttribute('data-theme', 'light'));
    window.addEventListener('afterprint', applyTheme);
}

function toggleTheme() {
    // Zyklus: Auto → Hell → Dunkel → Auto
    const order = ['auto', 'light', 'dark'];
    const next = order[(order.indexOf(getThemePref()) + 1) % 3];
    saveGlobalState({ theme: next });
    applyTheme();
}

function onThemeChanged(callback) {
    _onThemeChanged = callback;
}

function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    const pref = getThemePref();
    icon.textContent = pref === 'auto' ? '🌓' : pref === 'light' ? '☀️' : '🌙';
    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.title = 'Theme: ' + (pref === 'auto' ? 'Automatisch (System)' : pref === 'light' ? 'Hell' : 'Dunkel');
        btn.setAttribute('aria-label', btn.title);
    }
}

// ============ GLOBAL STATE ============
function getGlobalState() {
    try { return JSON.parse(localStorage.getItem('techtools_state') || '{}'); } catch(e) { return {}; }
}

function saveGlobalState(updates) {
    try {
        const state = getGlobalState();
        Object.assign(state, updates);
        localStorage.setItem('techtools_state', JSON.stringify(state));
    } catch(e) {}
}

// ============ LAST USED TRACKING ============
function trackToolUsage(toolId) {
    const state = getGlobalState();
    if (!state.lastUsed) state.lastUsed = {};
    state.lastUsed[toolId] = {
        timestamp: Date.now(),
        count: (state.lastUsed[toolId]?.count || 0) + 1
    };
    saveGlobalState({ lastUsed: state.lastUsed });
}

// ============ VISIT & CALCULATION TRACKING ============
function trackPageVisit() {
    const state = getGlobalState();
    if (!state.stats) state.stats = {};
    if (!state.stats.visits) state.stats.visits = {};
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const today = new Date().toISOString().slice(0, 10);
    if (!state.stats.visits[page]) state.stats.visits[page] = {};
    state.stats.visits[page][today] = (state.stats.visits[page][today] || 0) + 1;
    state.stats.totalVisits = (state.stats.totalVisits || 0) + 1;
    // Aufräumen: Tageseinträge älter als 90 Tage entfernen (localStorage wächst sonst unbegrenzt)
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    Object.keys(state.stats.visits).forEach(p => {
        Object.keys(state.stats.visits[p]).forEach(d => { if (d < cutoff) delete state.stats.visits[p][d]; });
        if (Object.keys(state.stats.visits[p]).length === 0) delete state.stats.visits[p];
    });
    saveGlobalState({ stats: state.stats });
}

function trackCalculation(toolId) {
    const state = getGlobalState();
    if (!state.stats) state.stats = {};
    if (!state.stats.calculations) state.stats.calculations = {};
    state.stats.calculations[toolId] = (state.stats.calculations[toolId] || 0) + 1;
    state.stats.totalCalculations = (state.stats.totalCalculations || 0) + 1;
    saveGlobalState({ stats: state.stats });
}

// ============ COPY RESULTS ============
function copyResults() {
    const resultFields = document.querySelectorAll('.result-field');
    let text = '';
    resultFields.forEach(field => {
        const row = field.closest('tr');
        const label = field.dataset.label || row?.querySelector('td:first-child')?.textContent?.trim() || '';
        const value = field.textContent.trim();
        if (value) text += (label ? label + ': ' : '') + value + '\n';
    });
    if (!text) return;
    navigator.clipboard.writeText(text.trim()).then(() => {
        showBtnFeedback('copyBtn', 'Kopiert!', 'var(--text-success)');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text.trim();
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showBtnFeedback('copyBtn', 'Kopiert!', 'var(--text-success)');
    });
}

function showBtnFeedback(btnId, msg, color) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const orig = btn.innerHTML;
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/></svg> ' + msg;
    btn.style.color = color;
    btn.style.borderColor = color;
    setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; btn.style.borderColor = ''; }, 2000);
}

// ============ RESET FIELDS ============
function resetFields() {
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.value = input.defaultValue; // leer gedachte Felder bleiben leer
        input.classList.remove('input-error');
    });
    document.querySelectorAll('input[type="text"]').forEach(input => {
        if (input.id !== 'searchInput') input.value = input.defaultValue || '';
    });
    document.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
    document.querySelectorAll('.result-field span').forEach(s => s.textContent = '');
    document.querySelectorAll('.validation-msg').forEach(m => m.remove());
    const first = document.querySelector('input[type="number"]');
    if (first) first.dispatchEvent(new Event('input', { bubbles: true }));
    showBtnFeedback('resetBtn', 'Zurückgesetzt!', 'var(--text-secondary)');
}

// ============ VALIDATION ============
function validateInput(inputId, rules) {
    const input = document.getElementById(inputId);
    if (!input) return true;
    const value = parseFloat(input.value);
    let error = '';

    if (rules.required && (isNaN(value) || input.value.trim() === '')) error = 'Pflichtfeld';
    else if (rules.min !== undefined && value < rules.min) error = 'Min: ' + rules.min;
    else if (rules.max !== undefined && value > rules.max) error = 'Max: ' + rules.max;
    else if (rules.notZero && value === 0) error = 'Darf nicht 0 sein';
    else if (rules.greaterThan) {
        const other = parseFloat(document.getElementById(rules.greaterThan)?.value);
        if (!isNaN(other) && value <= other) error = 'Muss größer als ' + other + ' sein';
    }

    const existing = input.parentElement.querySelector('.validation-msg[data-for="' + inputId + '"]');
    if (existing) existing.remove();

    if (error) {
        input.classList.add('input-error');
        const msg = document.createElement('span');
        msg.className = 'validation-msg';
        msg.dataset.for = inputId;
        msg.textContent = error;
        input.insertAdjacentElement('afterend', msg);
        return false;
    }
    input.classList.remove('input-error');
    return true;
}

// ============ UNIT PRESETS ============
function saveUnitPresets(toolId) {
    try {
        const presets = {};
        document.querySelectorAll('select.input-field, select').forEach(s => {
            if (s.id) presets[s.id] = s.value;
        });
        localStorage.setItem('techtools_units_' + toolId, JSON.stringify(presets));
    } catch(e) {}
}

function loadUnitPresets(toolId) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const presets = JSON.parse(localStorage.getItem('techtools_units_' + toolId) || '{}');
        Object.entries(presets).forEach(([id, value]) => {
            if (urlParams.has(id)) return; // Share-Link/Verkettung hat Vorrang vor gemerkter Einheit
            const el = document.getElementById(id);
            if (el?.tagName === 'SELECT' && el.querySelector('option[value="' + value + '"]')) el.value = value;
        });
    } catch(e) {}
}

// ============ SHARE LINK ============
function generateShareLink() {
    const params = new URLSearchParams();
    document.querySelectorAll('input[type="number"], input[type="text"], select').forEach(el => {
        if (el.id && el.value && el.id !== 'searchInput') params.set(el.id, el.value);
    });
    const url = window.location.origin + window.location.pathname + '?' + params.toString();
    navigator.clipboard.writeText(url).then(() => {
        showBtnFeedback('shareBtn', 'Link kopiert!', 'var(--accent-fg)');
    }).catch(() => {
        prompt('Link kopieren:', url);
    });
}

function loadFromShareLink() {
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return;
    params.forEach((value, key) => {
        const el = document.getElementById(key);
        if (!el) return;
        el.value = value;
        // Selects sofort 'change' feuern: Typ-Umschalter bauen abhängige
        // Einheiten-Selects um, bevor deren Wert (späterer Parameter) gesetzt wird
        if (el.tagName === 'SELECT') el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    setTimeout(() => {
        const first = document.querySelector('input[type="number"]');
        if (first) first.dispatchEvent(new Event('input', { bubbles: true }));
    }, 100);
}

// ============ PDF EXPORT ============
function exportPagePDF(title) {
    if (!window.jspdf) {
        const s = document.createElement('script');
        s.src = 'lib/jspdf.umd.min.js'; // lokal gehostet, kein CDN
        s.onload = () => _genPDF(title);
        document.head.appendChild(s);
    } else {
        _genPDF(title);
    }
}

function _genPDF(title) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const date = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });

    pdf.setFontSize(20); pdf.setTextColor(15, 27, 45); pdf.text(title, 20, 20);
    pdf.setFontSize(10); pdf.setTextColor(100); pdf.text('Erstellt am: ' + date, 20, 28);
    pdf.setDrawColor(9, 105, 218); pdf.setLineWidth(0.5); pdf.line(20, 32, 190, 32);

    let y = 42;
    document.querySelectorAll('.container table').forEach(table => {
        table.querySelectorAll('tr').forEach(row => {
            if (y > 270) { pdf.addPage(); y = 20; } // Seitenumbruch VOR dem Schreiben prüfen
            const th = row.querySelector('th');
            if (th) {
                pdf.setFontSize(13); pdf.setTextColor(15, 27, 45); pdf.setFont(undefined, 'bold');
                pdf.text(th.textContent.trim(), 20, y); y += 8; return;
            }
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                const label = cells[0].textContent.trim();
                let value = '';
                const inputs = cells[1].querySelectorAll('input');
                if (inputs.length > 1) {
                    value = Array.from(inputs).map(i => i.value).join(' bis ');
                    const sel = cells[1].querySelector('select');
                    if (sel) value += ' ' + sel.options[sel.selectedIndex].text;
                } else {
                    const inp = cells[1].querySelector('input, select');
                    if (inp) value = inp.tagName === 'SELECT' ? inp.options[inp.selectedIndex].text : inp.value;
                    else value = cells[1].textContent.trim();
                }
                if (label && value) {
                    pdf.setFontSize(11); pdf.setFont(undefined, 'normal');
                    if (cells[1].classList.contains('result-field')) {
                        pdf.setFillColor(218, 251, 225); pdf.rect(18, y - 5, 174, 8, 'F'); pdf.setTextColor(26, 127, 55);
                    } else { pdf.setTextColor(87, 96, 106); }
                    pdf.text(label, 20, y); pdf.text(String(value), 110, y); y += 8;
                }
            }
        });
        y += 4;
    });

    pdf.setFontSize(9); pdf.setTextColor(150);
    pdf.text('Techniker Berechnungstools — Keine Gewähr für die Genauigkeit der Ergebnisse.', 20, 285);
    pdf.save(title.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_') + '.pdf');
    showBtnFeedback('pdfBtn', 'PDF erstellt!', 'var(--text-success)');
}

// ============ KEYBOARD SHORTCUTS ============
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

        // Ctrl+C: Copy results (only when NOT in an input field)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !inInput) {
            e.preventDefault();
            copyResults();
        }
        // Escape: Reset — bevorzugt den seitenspezifischen Reset, falls vorhanden
        if (e.key === 'Escape' && !inInput) {
            e.preventDefault();
            if (typeof window.resetAll === 'function') window.resetAll();
            else resetFields();
        }
        // Ctrl+P: PDF
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            const btn = document.getElementById('pdfBtn');
            if (btn) { e.preventDefault(); btn.click(); }
        }
        // Ctrl+L: Share
        if ((e.ctrlKey || e.metaKey) && e.key === 'l' && !inInput) {
            const btn = document.getElementById('shareBtn');
            if (btn) { e.preventDefault(); generateShareLink(); }
        }
    });
}

// ============ GERMAN NUMBER FORMAT ============
// Replaces dots with commas in result displays automatically
function formatDE(num, decimals) {
    return num.toFixed(decimals).replace('.', ',');
}

// Auto-format: watch all result fields and convert dots to commas
function initGermanFormat() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(m => {
            if (m.type === 'childList' || m.type === 'characterData') {
                const el = m.target.nodeType === 3 ? m.target.parentElement : m.target;
                const rf = el?.closest?.('.result-field');
                if (rf) {
                    // Only convert numbers, not other text
                    const spans = rf.querySelectorAll('span');
                    spans.forEach(span => {
                        const text = span.textContent;
                        // Nur unformatierte toFixed()-Ausgaben konvertieren:
                        // Texte mit Komma (bereits deutsch) oder mehreren Punkten (Tausenderpunkte) überspringen
                        if (text.includes(',')) return;
                        if ((text.match(/\d\.\d/g) || []).length > 1) return;
                        if (/\d+\.\d+/.test(text)) {
                            span.textContent = text.replace(/(\d+)\.(\d+)/g, '$1,$2');
                        }
                    });
                    // Ergebnis-Flash: kurz markieren, was sich geändert hat
                    if (!rf.classList.contains('result-flash')) {
                        rf.classList.add('result-flash');
                        rf.addEventListener('animationend', () => rf.classList.remove('result-flash'), { once: true });
                    }
                }
            }
        });
    });

    // Observe all result fields
    document.querySelectorAll('.result-field').forEach(field => {
        observer.observe(field, { childList: true, subtree: true, characterData: true });
    });
}

// ============ ICONS (SVG, Feather/Lucide-Stil — einheitlich statt Emojis) ============
const _ICONS = {
    zap:      '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    sliders:  '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    percent:  '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    plug:     '<path d="M9 2v6"/><path d="M15 2v6"/><path d="M6 8h12v4a6 6 0 0 1-12 0z"/><path d="M12 18v4"/>',
    gauge:    '<path d="M3.34 19a10 10 0 1 1 17.32 0"/><path d="m12 14 4-4"/>',
    flask:    '<path d="M10 2v7.5L4.7 20.6a1 1 0 0 0 .9 1.4h12.8a1 1 0 0 0 .9-1.4L14 9.5V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
    droplet:  '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    wind:     '<path d="M9.59 4.59A2 2 0 1 1 11 8H2"/><path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2"/><path d="M12.59 19.41A2 2 0 1 0 14 16H2"/>',
    thermo:   '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
    waves:    '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 1.3 0 1.9-.5 2.5-1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 1.3 0 1.9-.5 2.5-1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 1.3 0 1.9-.5 2.5-1"/>',
    ruler:    '<path d="M3 17 17 3l4 4L7 21z"/><path d="m8.5 8.5 1.5 1.5"/><path d="m11.5 5.5 1.5 1.5"/><path d="m14.5 2.5 1.5 1.5"/>',
    disc:     '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>',
    repeat:   '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    weight:   '<circle cx="12" cy="5" r="3"/><path d="M6.5 8h11L19 20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/>',
    book:     '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    arrows:   '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
    tank:     '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
    flame:    '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    radio:    '<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M7.76 16.24a6 6 0 0 1 0-8.49"/><path d="M4.93 19.07a10 10 0 0 1 0-14.14"/>',
    shield:   '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    rad:      '<circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="5" y1="5" x2="7.8" y2="7.8"/><line x1="16.2" y1="16.2" x2="19" y2="19"/><line x1="5" y1="19" x2="7.8" y2="16.2"/><line x1="16.2" y1="7.8" x2="19" y2="5"/>',
    atom:     '<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="10" ry="4.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)"/>',
    clock:    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    tray:     '<path d="M4 4v13a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V4"/><path d="M8 11h8"/>',
    cloud:    '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
    trending: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    filter:   '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    volume:   '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    wrench:   '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    alert:    '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    checklist:'<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    file:     '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    list:     '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    chart:    '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
};

function toolIconSvg(toolId) {
    const name = (_TOOL_META[toolId] && _TOOL_META[toolId].ic) || 'wrench';
    const inner = _ICONS[name] || _ICONS.wrench;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
}

// ============ RELATED TOOLS ============
const _TOOL_META = {
    stromausgang:    { title: 'Stromausgangsberechnung', href: 'Stromausgang.html',      ic: 'zap' },
    kalibrier:       { title: 'Kalibrierpunkte',         href: 'Kalibrierpunkte.html',   ic: 'sliders' },
    abweichung:      { title: 'Messwertabweichung',      href: 'Messwertabweichung.html',ic: 'percent' },
    burden:          { title: '4-20mA Bürdenrechner',    href: 'Buerdenrechner.html',    ic: 'plug' },
    druck:           { title: 'Druckkalibrierung',       href: 'Druckkalibrierung.html', ic: 'gauge' },
    ph:              { title: 'pH Steilheit',            href: 'PHWert.html',            ic: 'flask' },
    leitfaehigkeit:  { title: 'Leitfähigkeit',          href: 'Leitfaehigkeit.html',    ic: 'droplet' },
    sauerstoff:      { title: 'Sauerstoff',              href: 'Sauerstoff.html',        ic: 'wind' },
    tempsensor:      { title: 'Temperatursensor',        href: 'Temperatursensor.html',  ic: 'thermo' },
    impuls:          { title: 'Impulswertigkeit',        href: 'Impulswertigkeit.html',  ic: 'activity' },
    fliess:          { title: 'Fließgeschwindigkeit',    href: 'Fliessgeschwindigkeit.html', ic: 'waves' },
    einbau:          { title: 'Einlaufstrecken',         href: 'Einbaulaengen.html',     ic: 'ruler' },
    blende:          { title: 'Blenden/DP-Durchfluss',  href: 'BlendeDP.html',          ic: 'disc' },
    volmasse:        { title: 'Volumen-Masse',           href: 'VolumenMasse.html',      ic: 'repeat' },
    dichte:          { title: 'Dichteberechnung',        href: 'Dichteberechnung.html',  ic: 'weight' },
    dichtetab:       { title: 'Dichtetabelle',           href: 'Dichtetabelle.html',     ic: 'book' },
    viskositaet:     { title: 'Viskosität',              href: 'Viskositaet.html',       ic: 'droplet' },
    einheiten:       { title: 'Einheiten-Rechner',       href: 'Einheiten.html',         ic: 'arrows' },
    tank:            { title: 'Tankinhalt-Rechner',      href: 'Tankinhalt.html',        ic: 'tank' },
    dampf:           { title: 'Dampftabelle',            href: 'Dampftabelle.html',      ic: 'flame' },
    flansch:         { title: 'DN/Flansch-Tabelle',      href: 'Flansch.html',           ic: 'disc' },
    dkwerte:         { title: 'DK-Werte',                href: 'DKWerte.html',           ic: 'radio' },
    schutzart:       { title: 'Schutzarten',             href: 'Schutzarten.html',       ic: 'shield' },
    abstandsquadrat: { title: 'Abstandsquadratgesetz',  href: 'Abstandsquadrat.html',   ic: 'rad' },
    zerfall:         { title: 'Zerfallsrechner',         href: 'Zerfall.html',           ic: 'atom' },
    dosisleistung:   { title: 'Dosisleistung',           href: 'Dosisleistung.html',     ic: 'rad' },
    abschirmung:     { title: 'Abschirmungsrechner',     href: 'Abschirmung.html',       ic: 'shield' },
    aufenthaltszeit: { title: 'Aufenthaltszeit',         href: 'Aufenthaltszeit.html',   ic: 'clock' },
    isotopdaten:     { title: 'Isotopdaten-Tabelle',     href: 'Isotopdaten.html',       ic: 'book' },
    whg_gefaehrdung: { title: 'WHG Gefährdungsstufe',   href: 'WHG_Gefaehrdungsstufe.html', ic: 'droplet' },
    whg_rohrleitung: { title: 'Rohrleitungsinhalt',      href: 'WHG_Rohrleitungsinhalt.html', ic: 'ruler' },
    whg_auffangwanne:{ title: 'Auffangwanne',            href: 'WHG_Auffangwanne.html',  ic: 'tray' },
    whg_wgk:         { title: 'WGK-Nachschlagewerk',    href: 'WHG_WGK.html',           ic: 'book' },
    elektro:         { title: 'Elektro-Grundlagen',     href: 'Elektro_Grundlagen.html',ic: 'zap' },
    kabel:           { title: 'Kabelquerschnitt',        href: 'Kabelquerschnitt.html',  ic: 'plug' },
    waerme:          { title: 'Wärmetechnik',            href: 'Waermetechnik.html',     ic: 'flame' },
    normdurchfluss:  { title: 'Normdurchfluss',          href: 'Normdurchfluss.html',    ic: 'wind' },
    taupunkt:        { title: 'Taupunkt & Feuchte',      href: 'Taupunkt.html',          ic: 'cloud' },
    rohrklassen:     { title: 'Rohrklassen (ASME)',      href: 'Rohrklassen.html',       ic: 'ruler' },
    dp_durchfluss:   { title: 'DP-Durchfluss Skalierung',href: 'DPDurchfluss.html',      ic: 'trending' },
    konzentration:   { title: 'Konzentration aus Dichte',href: 'Konzentration.html',     ic: 'filter' },
    mid_lf:          { title: 'MID Leitfähigkeit',       href: 'MID_Leitfaehigkeit.html',ic: 'droplet' },
    schallgeschwindigkeit: { title: 'Schallgeschwindigkeit', href: 'Schallgeschwindigkeit.html', ic: 'volume' },
    loop_diagnose:   { title: '4-20 mA Loop-Diagnose',  href: 'Loop_Diagnose.html',     ic: 'wrench' },
    sil_pfd:         { title: 'SIL / PFD Rechner',       href: 'SIL_PFD.html',           ic: 'shield' },
    prozessanschluesse: { title: 'Prozessanschlüsse',   href: 'Prozessanschluesse.html',ic: 'wrench' },
    eh_fehlercodes:  { title: 'E+H Fehlercodes',         href: 'EH_Fehlercodes.html',    ic: 'alert' },
    inbetriebnahme:  { title: 'Inbetriebnahme',          href: 'Inbetriebnahme.html',    ic: 'checklist' },
    kalibrierprotokoll: { title: 'Kalibrierprotokoll',  href: 'Kalibrierprotokoll.html',ic: 'file' },
    csv:             { title: 'CSV-Umwandler',           href: 'csv.html',               ic: 'list' },
    csvvisu:         { title: 'CSV-Visualisierung',      href: 'csvauswertung.html',     ic: 'chart' },
};

const _TOOL_RELATIONS = {
    stromausgang:    ['kalibrier', 'abweichung', 'burden'],
    kalibrier:       ['stromausgang', 'abweichung', 'druck'],
    abweichung:      ['kalibrier', 'stromausgang', 'burden'],
    burden:          ['stromausgang', 'kalibrier', 'einheiten'],
    druck:           ['kalibrier', 'abweichung', 'einheiten'],
    ph:              ['leitfaehigkeit', 'sauerstoff', 'tempsensor'],
    leitfaehigkeit:  ['ph', 'sauerstoff', 'tempsensor'],
    sauerstoff:      ['ph', 'leitfaehigkeit', 'tempsensor'],
    tempsensor:      ['ph', 'leitfaehigkeit', 'einheiten'],
    impuls:          ['fliess', 'blende', 'volmasse'],
    fliess:          ['impuls', 'einbau', 'blende'],
    einbau:          ['fliess', 'impuls', 'blende'],
    blende:          ['fliess', 'impuls', 'einbau'],
    volmasse:        ['dichte', 'einheiten', 'impuls'],
    dichte:          ['volmasse', 'dichtetab', 'viskositaet'],
    dichtetab:       ['dichte', 'viskositaet', 'dkwerte'],
    viskositaet:     ['dichte', 'dichtetab', 'fliess'],
    einheiten:       ['volmasse', 'druck', 'viskositaet'],
    tank:            ['volmasse', 'dichtetab', 'whg_auffangwanne'],
    dampf:           ['waerme', 'einheiten', 'druck'],
    flansch:         ['whg_rohrleitung', 'fliess', 'einbau'],
    dkwerte:         ['dichtetab', 'sauerstoff', 'leitfaehigkeit'],
    schutzart:       ['isotopdaten', 'abstandsquadrat', 'flansch'],
    abstandsquadrat: ['zerfall', 'dosisleistung', 'abschirmung'],
    zerfall:         ['abstandsquadrat', 'dosisleistung', 'isotopdaten'],
    dosisleistung:   ['abstandsquadrat', 'abschirmung', 'aufenthaltszeit'],
    abschirmung:     ['dosisleistung', 'abstandsquadrat', 'aufenthaltszeit'],
    aufenthaltszeit: ['dosisleistung', 'abschirmung', 'isotopdaten'],
    isotopdaten:     ['zerfall', 'dosisleistung', 'abstandsquadrat'],
    whg_gefaehrdung: ['whg_auffangwanne', 'whg_rohrleitung', 'whg_wgk'],
    whg_rohrleitung: ['whg_auffangwanne', 'whg_gefaehrdung', 'flansch'],
    whg_auffangwanne:['whg_gefaehrdung', 'whg_rohrleitung', 'whg_wgk'],
    whg_wgk:         ['whg_gefaehrdung', 'whg_auffangwanne', 'dichtetab'],
    elektro:         ['kabel', 'stromausgang', 'burden'],
    kabel:           ['elektro', 'burden', 'stromausgang'],
    waerme:          ['dampf', 'einheiten', 'volmasse'],
    taupunkt:        ['dampf', 'sauerstoff', 'einheiten'],
    normdurchfluss:  ['fliess', 'volmasse', 'dampf'],
    rohrklassen:     ['flansch', 'whg_rohrleitung', 'fliess'],
    dp_durchfluss:   ['blende', 'stromausgang', 'impuls'],
    konzentration:   ['dichte', 'dichtetab', 'volmasse'],
    mid_lf:          ['leitfaehigkeit', 'fliess', 'einbau'],
    schallgeschwindigkeit: ['fliess', 'einbau', 'dichtetab'],
    loop_diagnose:   ['burden', 'stromausgang', 'eh_fehlercodes'],
    sil_pfd:         ['eh_fehlercodes', 'loop_diagnose', 'kalibrierprotokoll'],
    prozessanschluesse: ['flansch', 'rohrklassen', 'schutzart'],
    eh_fehlercodes:  ['loop_diagnose', 'inbetriebnahme', 'stromausgang'],
    inbetriebnahme:  ['kalibrierprotokoll', 'eh_fehlercodes', 'einbau'],
    kalibrierprotokoll: ['abweichung', 'kalibrier', 'stromausgang'],
    csv:             ['csvvisu', 'abweichung', 'kalibrierprotokoll'],
    csvvisu:         ['csv', 'abweichung', 'impuls'],
};

function injectRelatedTools(toolId) {
    const related = _TOOL_RELATIONS[toolId];
    if (!related || related.length === 0) return;

    const style = document.createElement('style');
    style.textContent = `
        .related-section { margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--border-default); }
        .related-title { font-size: 12px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 10px 0; }
        .related-grid { display: flex; gap: 10px; flex-wrap: wrap; }
        .related-card { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: 1px solid var(--border-default); border-radius: var(--radius-md); background: var(--bg-default); text-decoration: none; color: var(--text-primary); font-size: 13px; font-weight: 500; transition: border-color 0.15s, background 0.15s; flex: 1; min-width: 160px; }
        .related-card:hover { border-color: var(--accent-fg); background: var(--bg-subtle); }
        .related-card-icon { flex-shrink: 0; display: flex; align-items: center; color: var(--accent-fg); }
        .related-card-icon svg { width: 16px; height: 16px; }
    `;
    document.head.appendChild(style);

    const section = document.createElement('div');
    section.className = 'related-section';
    section.innerHTML = '<p class="related-title">Verwandte Tools</p><div class="related-grid" id="relatedGrid"></div>';

    const grid = section.querySelector('#relatedGrid');
    related.forEach(id => {
        const meta = _TOOL_META[id];
        if (!meta) return;
        const a = document.createElement('a');
        a.className = 'related-card';
        a.href = meta.href;
        a.innerHTML = '<span class="related-card-icon">' + toolIconSvg(id) + '</span><span>' + meta.title + '</span>';
        grid.appendChild(a);
    });

    const container = document.querySelector('.container');
    if (container) container.appendChild(section);
}

// ============ COMMAND PALETTE (Strg+K) ============
function initCommandPalette() {
    const overlay = document.createElement('div');
    overlay.id = 'cmdOverlay';
    overlay.innerHTML = '<div id="cmdBox"><input id="cmdInput" type="text" placeholder="Tool suchen … (↑↓ wählen, Enter öffnen)" autocomplete="off"><div id="cmdList"></div></div>';
    document.body.appendChild(overlay);
    const input = overlay.querySelector('#cmdInput');
    const list = overlay.querySelector('#cmdList');
    let sel = 0;

    function openPalette() { overlay.classList.add('open'); input.value = ''; renderList(''); input.focus(); }
    function closePalette() { overlay.classList.remove('open'); }

    function renderList(q) {
        const ql = q.toLowerCase().trim();
        const items = Object.entries(_TOOL_META).filter(([, m]) => m.title.toLowerCase().includes(ql)).slice(0, 10);
        sel = 0;
        list.innerHTML = items.length
            ? items.map(([id, m], i) => '<a class="cmd-item' + (i === 0 ? ' sel' : '') + '" href="' + m.href + '"><span class="cmd-ic">' + toolIconSvg(id) + '</span>' + m.title + '</a>').join('')
            : '<div class="cmd-empty">Kein Tool gefunden</div>';
    }

    input.addEventListener('input', () => renderList(input.value));
    input.addEventListener('keydown', (e) => {
        const els = list.querySelectorAll('.cmd-item');
        if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, els.length - 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); }
        else if (e.key === 'Enter') { e.preventDefault(); if (els[sel]) window.location.href = els[sel].getAttribute('href'); return; }
        else if (e.key === 'Escape') { closePalette(); return; }
        else return;
        els.forEach((el, i) => el.classList.toggle('sel', i === sel));
        if (els[sel]) els[sel].scrollIntoView({ block: 'nearest' });
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closePalette(); });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            overlay.classList.contains('open') ? closePalette() : openPalette();
        }
    });
}

// ============ BERECHNUNGS-VERLAUF (pro Tool) ============
function initHistory(toolId) {
    const KEY = 'techtools_hist_' + toolId;
    const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
    const save = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 5))); } catch (e) {} };

    function snapshot() {
        const data = {};
        document.querySelectorAll('input[type="number"], input[type="text"], select').forEach(el => {
            if (el.id && el.value !== '' && el.id !== 'searchInput' && !el.closest('#cmdBox')) data[el.id] = el.value;
        });
        return data;
    }

    function restore(data) {
        Object.entries(data).forEach(([id, v]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.value = v;
            // Selects 'change' feuern, damit abhängige Einheiten-Selects umgebaut
            // werden, bevor deren gespeicherter Wert (späterer Eintrag) gesetzt wird
            if (el.tagName === 'SELECT') el.dispatchEvent(new Event('change', { bubbles: true }));
        });
        const first = document.querySelector('input[type="number"]');
        if (first) first.dispatchEvent(new Event('input', { bubbles: true }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderHistory() {
        const list = load();
        let panel = document.getElementById('histPanel');
        if (!list.length) { if (panel) panel.style.display = 'none'; return; }
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'histPanel';
            panel.className = 'history-panel';
            panel.innerHTML = '<div class="history-header"><span>🕑 Letzte Berechnungen</span><button class="history-clear">Leeren</button></div><div id="histEntries"></div>';
            const container = document.querySelector('.container');
            if (!container) return;
            container.insertBefore(panel, container.querySelector('.related-section') || null);
            panel.querySelector('.history-clear').addEventListener('click', () => { save([]); renderHistory(); });
        }
        panel.style.display = '';
        const wrap = panel.querySelector('#histEntries');
        wrap.innerHTML = '';
        list.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'history-entry';
            div.title = 'Klicken zum Wiederherstellen';
            const time = document.createElement('span');
            time.className = 'history-time';
            time.textContent = new Date(entry.ts).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            const dataEl = document.createElement('span');
            dataEl.className = 'history-data';
            dataEl.textContent = Object.values(entry.data).slice(0, 6).join('  |  ');
            div.appendChild(time); div.appendChild(dataEl);
            div.addEventListener('click', () => restore(entry.data));
            wrap.appendChild(div);
        });
    }

    let timer = null;
    document.addEventListener('input', (e) => {
        if (!e.target.matches('input, select') || e.target.closest('#cmdBox')) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
            const snap = snapshot();
            if (Object.keys(snap).length === 0) return;
            const list = load();
            if (list.length && JSON.stringify(list[0].data) === JSON.stringify(snap)) return;
            list.unshift({ ts: Date.now(), data: snap });
            save(list);
            renderHistory();
        }, 4000);
    });

    renderHistory();
}

// ============ PWA: INSTALL-HINWEIS & UPDATE-BANNER ============
function showBanner(msg, btnLabel, onClick, onDismiss) {
    if (document.getElementById('appBanner')) return;
    const b = document.createElement('div');
    b.id = 'appBanner';
    b.innerHTML = '<span></span><button class="banner-btn"></button><button class="banner-close" aria-label="Schließen">×</button>';
    b.querySelector('span').textContent = msg;
    const btn = b.querySelector('.banner-btn');
    btn.textContent = btnLabel;
    btn.addEventListener('click', () => { onClick(); b.remove(); });
    b.querySelector('.banner-close').addEventListener('click', () => { b.remove(); if (onDismiss) onDismiss(); });
    document.body.appendChild(b);
}

function initPwaUx() {
    // Update-Banner: neuer Service Worker hat übernommen → einmal neu laden
    if ('serviceWorker' in navigator) {
        let hadController = !!navigator.serviceWorker.controller;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!hadController) { hadController = true; return; } // Erstinstallation, kein Banner
            showBanner('Neue Version verfügbar.', 'Neu laden', () => location.reload());
        });
    }
    // Install-Hinweis (einmalig, abweisbar)
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        if (getGlobalState().installDismissed) return;
        showBanner('Als App installieren — alle Tools offline nutzbar.', 'Installieren',
            () => e.prompt(),
            () => saveGlobalState({ installDismissed: true }));
    });
}

// ============ ZWEI-SPALTEN-LAYOUT (Desktop) ============
// Eingaben links, Ampel + Ergebniszeilen rechts (sticky). Generisch:
// Ergebniszeilen (tr mit td.result-field, ohne Eingabefelder) wandern pro
// Tabelle als Karten-Gruppe in die rechte Spalte — IDs und Event-Listener
// bleiben erhalten. Seiten ohne passende Struktur (Tabs, gemischte Zeilen)
// bleiben unverändert einspaltig; Opt-out per data-no-twocol am body.
function initTwoColumnLayout() {
    if (window.innerWidth < 1100) return;
    if (document.body.hasAttribute('data-no-twocol')) return;
    const container = document.querySelector('.container');
    if (!container) return;

    // Ergebniszeilen in Tabellen (Einheiten-Selects dürfen mit, Inputs nicht)
    const groups = [];
    container.querySelectorAll(':scope > table').forEach(table => {
        const rows = Array.from(table.querySelectorAll('tr')).filter(tr =>
            tr.querySelector('td.result-field') && !tr.querySelector('input, textarea'));
        if (!rows.length) return;
        const th = table.querySelector('th');
        groups.push({ table, rows, title: th ? th.textContent.trim() : '' });
    });

    const statusBar = container.querySelector(':scope > .status-bar');
    // Karten-Grids, Füllbalken und explizit markierte Blöcke gehören ebenfalls rechts hin
    const isResultBlock = (el) =>
        el === statusBar || el.dataset.pane === 'results' ||
        el.classList.contains('result-grid') || el.classList.contains('fill-bar');
    const blocks = Array.from(container.children).filter(el =>
        el.nodeType === 1 && isResultBlock(el) && el !== statusBar && !el.querySelector('input, textarea'));
    if (!groups.length && !blocks.length) return;

    const grid = document.createElement('div');
    grid.className = 'two-col-grid';
    const left = document.createElement('div');
    left.className = 'col-inputs';
    const right = document.createElement('div');
    right.className = 'col-results';
    grid.appendChild(left);
    grid.appendChild(right);

    // Ergebniszeilen als Karten-Gruppe; Titel als th, damit er auch im
    // PDF-Export (iteriert .container table) erhalten bleibt
    function buildResultGroup(g) {
        const box = document.createElement('div');
        box.className = 'result-group';
        const t = document.createElement('table');
        if (g.title) {
            const thead = document.createElement('thead');
            const trh = document.createElement('tr');
            const h = document.createElement('th');
            h.textContent = g.title;
            trh.appendChild(h);
            thead.appendChild(trh);
            t.appendChild(thead);
        }
        const tbody = document.createElement('tbody');
        g.rows.forEach(r => tbody.appendChild(r));
        t.appendChild(tbody);
        box.appendChild(t);
        // Quelltabelle ohne verbliebene Datenzeilen ausblenden
        if (!g.table.querySelector('td')) g.table.style.display = 'none';
        return box;
    }

    // Grid dort einsetzen, wo die Interaktion beginnt: beim ersten Ergebnis-
    // Element ODER beim ersten Block mit Eingabefeldern (so stehen z. B. bei
    // Tankinhalt die Eingaben links neben den Ergebnissen). Alles davor
    // (Action-Bar, Beschreibung, Preset-Zeilen) bleibt in voller Breite.
    const groupMap = new Map(groups.map(g => [g.table, g]));
    const anchor = Array.from(container.children).find(el =>
        el === statusBar || blocks.includes(el) || groupMap.has(el) ||
        el.querySelector('input, select, textarea'));
    if (!anchor) return;
    container.insertBefore(grid, anchor);

    // Nachfolgende Geschwister in DOM-Reihenfolge einsortieren; Karten-Gruppen
    // entstehen an der Position ihrer Quelltabelle — die rechte Spalte behält
    // dadurch die inhaltliche Reihenfolge der Seite
    let node = grid.nextSibling;
    while (node) {
        const next = node.nextSibling;
        if (node.nodeType === 1) {
            if (node === statusBar || blocks.includes(node)) {
                right.appendChild(node);
            } else {
                left.appendChild(node);
                const g = groupMap.get(node);
                if (g) right.appendChild(buildResultGroup(g));
            }
        }
        node = next;
    }

    container.classList.add('has-two-col');
}

// ============ INPUT-GROUPS: Einheit im Eingabefeld ============
// "[2000] mm" bzw. "[10] [m³/h ▾]" werden zu einer optischen Einheit
// zusammengefasst — kein Umbruch zwischen Feld und Einheit mehr
function initInputGroups() {
    const unitRe = /^[A-Za-zµΩ°³²%‰\/·().\-\s]{1,12}$/;
    document.querySelectorAll('.container input[type="number"]').forEach(input => {
        if (input.closest('.input-group')) return;

        // Fall 1: Einheiten-Text direkt hinter dem Feld ("mm", "m/s", "kg/l")
        const next = input.nextSibling;
        if (next && next.nodeType === 3) {
            const unit = next.textContent.trim();
            if (unit && unitRe.test(unit) && unit.split(/\s+/).length <= 2) {
                const group = document.createElement('span');
                group.className = 'input-group';
                input.parentNode.insertBefore(group, input);
                group.appendChild(input);
                const u = document.createElement('span');
                u.className = 'input-unit';
                u.textContent = unit;
                group.appendChild(u);
                next.parentNode.removeChild(next);
                return;
            }
            if (unit) return; // anderer Text dahinter — nicht anfassen
        }

        // Fall 2: Einheiten-Dropdown direkt hinter dem Feld
        let el = input.nextSibling;
        while (el && el.nodeType === 3 && !el.textContent.trim()) el = el.nextSibling;
        if (el && el.tagName === 'SELECT' && !el.hasAttribute('data-no-group') && el.options.length <= 16) {
            const group = document.createElement('span');
            group.className = 'input-group';
            input.parentNode.insertBefore(group, input);
            group.appendChild(input);
            group.appendChild(el);
        }
    });
}

// ============ TABELLEN-TOOLBAR: Suche, Zähler, Sortierung ============
function initTableToolbar() {
    // Seiten mit eigener Suche (Dichtetabelle, WGK …) bekommen keine zweite
    const ownSearch = document.querySelector('#searchInput, .table-search, input[type="search"], input[placeholder*="uche"], input[placeholder*="uchen"]');
    document.querySelectorAll('.container table').forEach(table => {
        if (table.hasAttribute('data-no-toolbar') || table.closest('.result-group')) return;
        const tbody = table.tBodies[0];
        if (!tbody) return;
        const rowCount = tbody.rows.length;
        if (rowCount < 16) return;

        // Sortierung über th-Klick — nur bei sauberem Spaltenraster
        const headRow = table.tHead && table.tHead.rows.length ? table.tHead.rows[table.tHead.rows.length - 1] : null;
        const messy = Array.from(tbody.rows).some(r => Array.from(r.cells).some(c => c.rowSpan > 1 || c.colSpan > 1));
        // Tabellen mit eigener Sortierung (onclick/Sortier-Pfeile) nicht doppelt verdrahten
        const ownSort = headRow && headRow.querySelector('[onclick], .sort-arrow');
        if (headRow && !ownSort && headRow.cells.length > 1 && !messy && !table.hasAttribute('data-no-sort')) {
            Array.from(headRow.cells).forEach((th, idx) => {
                if (th.colSpan > 1) return;
                th.classList.add('sortable');
                th.title = 'Klicken zum Sortieren';
                th.addEventListener('click', () => _sortTable(table, idx, th));
            });
        }

        // Suche + Trefferzähler nur für große statische Tabellen
        if (!ownSearch && rowCount >= 25) {
            const bar = document.createElement('div');
            bar.className = 'table-toolbar';
            const inp = document.createElement('input');
            inp.type = 'search';
            inp.className = 'input-field';
            inp.placeholder = 'Tabelle filtern …';
            inp.setAttribute('aria-label', 'Tabelle filtern');
            const count = document.createElement('span');
            count.className = 'toolbar-count';
            bar.appendChild(inp);
            bar.appendChild(count);
            table.parentNode.insertBefore(bar, table);
            const update = () => {
                const q = inp.value.toLowerCase().trim();
                let shown = 0;
                Array.from(tbody.rows).forEach(r => {
                    const hit = !q || r.textContent.toLowerCase().includes(q);
                    r.style.display = hit ? '' : 'none';
                    if (hit) shown++;
                });
                count.textContent = shown + ' von ' + tbody.rows.length + ' Zeilen';
            };
            inp.addEventListener('input', update);
            update();
        }
    });
}

function _sortTable(table, col, th) {
    const tbody = table.tBodies[0];
    const dir = th.classList.contains('sort-asc') ? -1 : 1;
    table.querySelectorAll('th.sortable').forEach(h => { h.classList.remove('sort-asc', 'sort-desc'); h.removeAttribute('aria-sort'); });
    th.classList.add(dir === 1 ? 'sort-asc' : 'sort-desc');
    th.setAttribute('aria-sort', dir === 1 ? 'ascending' : 'descending');
    // Deutsche Zahlen: "1.234,56" → 1234.56; Präfixe wie "DN50" → 50
    const parseNum = (s) => {
        const m = s.replace(/\./g, '').replace(',', '.').match(/-?\d+(\.\d+)?/);
        return m ? parseFloat(m[0]) : null;
    };
    const rows = Array.from(tbody.rows);
    const vals = rows.map(r => r.cells[col] ? r.cells[col].textContent.trim() : '');
    const numeric = vals.filter(v => v && parseNum(v) !== null).length >= vals.length * 0.8;
    rows.map((r, i) => ({ r, v: vals[i] }))
        .sort((a, b) => {
            if (numeric) {
                const na = parseNum(a.v), nb = parseNum(b.v);
                if (na === null && nb === null) return 0;
                if (na === null) return 1;   // Leere/Textzeilen immer ans Ende
                if (nb === null) return -1;
                return dir * (na - nb);
            }
            return dir * a.v.localeCompare(b.v, 'de', { numeric: true });
        })
        .forEach(x => tbody.appendChild(x.r));
}

// ============ „WEITERRECHNEN MIT" — TOOL-VERKETTUNG ============
// Link-Button, der ein Ziel-Tool mit vorbefüllten Feldern öffnet
// (Share-Link-Infrastruktur: URL-Parameter = Feld-IDs im Ziel-Tool)
function chainButton(label, targetHref, params) {
    const a = document.createElement('a');
    a.className = 'chain-btn';
    a.href = targetHref + '?' + new URLSearchParams(params).toString();
    a.textContent = '→ ' + label;
    a.title = 'Wert übernehmen und in „' + label + '" weiterrechnen';
    return a;
}

// ============ ERGEBNIS-FLASH ============
// Geändertes Ergebnis pulst kurz auf — man sieht, was die Eingabe bewirkt hat
function initResultFlash() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const readyAt = Date.now() + 1500; // initiales Befüllen beim Laden nicht anblitzen
    const observer = new MutationObserver((muts) => {
        if (Date.now() < readyAt) return;
        const seen = new Set();
        muts.forEach(m => {
            const el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
            const rf = el && el.closest('.result-field');
            if (!rf || seen.has(rf)) return;
            seen.add(rf);
            rf.classList.remove('flash');
            void rf.offsetWidth; // Reflow erzwingen, damit die Animation neu startet
            rf.classList.add('flash');
        });
    });
    document.querySelectorAll('.result-field').forEach(rf => {
        observer.observe(rf, { childList: true, characterData: true, subtree: true });
    });
}

// ============ BARRIEREFREIHEIT ============
function initA11y() {
    // Ampel-Statusänderungen an Screenreader melden
    document.querySelectorAll('.status-bar').forEach(b => {
        b.setAttribute('role', 'status');
        b.setAttribute('aria-live', 'polite');
    });
    // Eingaben programmatisch beschriften: Die Beschriftung steht im Tabellen-
    // Layout als loser Text in der ersten Zelle bzw. als <label> ohne for-
    // Attribut davor — als aria-label übernehmen, sonst hören Screenreader
    // nur "Eingabefeld"
    document.querySelectorAll('.container input, .container select, .container textarea').forEach(el => {
        if (el.type === 'hidden' || el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) return;
        if (el.id && document.querySelector('label[for="' + el.id + '"]')) return;
        if (el.closest('label')) return; // implizit beschriftet (z. B. Checkbox im Label)
        let label = '';
        const tr = el.closest('tr');
        if (tr && tr.cells.length > 1 && !tr.cells[0].contains(el)) label = tr.cells[0].textContent.trim();
        if (!label) {
            const ref = el.closest('.input-group') || el;
            const prev = ref.previousElementSibling;
            if (prev && prev.tagName === 'LABEL') label = prev.textContent.trim();
        }
        if (!label || label.length > 120) return;
        label = label.replace(/:\s*$/, '');
        if (el.tagName === 'SELECT' && tr && tr.querySelector('input')) label += ' — Einheit';
        el.setAttribute('aria-label', label);
    });
    // Skip-Link zur Hauptspalte (nur per Tastatur sichtbar)
    const main = document.querySelector('.container');
    if (main) {
        if (!main.id) main.id = 'inhalt';
        const skip = document.createElement('a');
        skip.href = '#' + main.id;
        skip.className = 'skip-link';
        skip.textContent = 'Zum Inhalt springen';
        document.body.insertBefore(skip, document.body.firstChild);
    }
}

// ============ ZEBRA FÜR GROSSE TABELLEN ============
function applyZebra() {
    document.querySelectorAll('table').forEach(t => {
        if (t.rows.length > 15) t.classList.add('zebra');
    });
}

// ============ SCROLL-TO-TOP ============
function initScrollTop() {
    const btn = document.createElement('button');
    btn.id = 'scrollTopBtn';
    btn.title = 'Nach oben';
    btn.setAttribute('aria-label', 'Nach oben scrollen');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><polyline points="18 15 12 9 6 15"/></svg>';
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(btn);
    let visible = false;
    window.addEventListener('scroll', () => {
        const show = window.scrollY > 600;
        if (show !== visible) { visible = show; btn.classList.toggle('visible', show); }
    }, { passive: true });
}

// ============ KLICK AUF ERGEBNIS = KOPIEREN ============
function initResultCopy() {
    document.addEventListener('click', (e) => {
        const rf = e.target.closest('.result-field');
        if (!rf) return;
        const txt = rf.textContent.trim();
        if (!txt || !navigator.clipboard) return;
        navigator.clipboard.writeText(txt).then(() => {
            rf.classList.add('copied');
            setTimeout(() => rf.classList.remove('copied'), 900);
        }).catch(() => {});
    });
    document.querySelectorAll('.result-field').forEach(rf => { rf.title = 'Klicken zum Kopieren'; });
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initKeyboardShortcuts();
    initGermanFormat();
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    loadFromShareLink();
    trackPageVisit();
    if (document.body.dataset.toolId) initTwoColumnLayout();
    initInputGroups();
    initTableToolbar();
    initScrollTop();
    initResultCopy();
    initCommandPalette();
    initPwaUx();
    initResultFlash();
    initA11y();
    applyZebra();
    setTimeout(applyZebra, 500); // zweiter Durchlauf für dynamisch befüllte Tabellen

    // PWA: Service Worker registrieren (offline-fähig)
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    // Auto-assign IDs to action buttons so showBtnFeedback works on all pages
    document.querySelectorAll('button[onclick]').forEach(btn => {
        if (!btn.id) {
            const oc = btn.getAttribute('onclick') || '';
            if (oc.includes('copyResults'))        btn.id = 'copyBtn';
            else if (oc.includes('resetFields'))   btn.id = 'resetBtn';
            else if (oc.includes('exportPagePDF')) btn.id = 'pdfBtn';
            else if (oc.includes('generateShareLink')) btn.id = 'shareBtn';
        }
    });

    // Mobile: numeric keyboard + suppress browser autocomplete on calculation inputs
    document.querySelectorAll('input[type="number"]').forEach(input => {
        if (!input.hasAttribute('inputmode'))    input.setAttribute('inputmode', 'decimal');
        if (!input.hasAttribute('autocomplete')) input.setAttribute('autocomplete', 'off');
    });

    const toolId = document.body.dataset.toolId;
    if (toolId) {
        document.body.classList.add('is-tool-page');
        trackToolUsage(toolId);
        loadUnitPresets(toolId);
        injectRelatedTools(toolId);
        initHistory(toolId);

        // Berechnungen zählen: jede Eingabe-Interaktion, gedrosselt auf max. 1×/10 s
        let _lastCalcTrack = 0;
        document.addEventListener('input', (e) => {
            if (!e.target.matches('input, select')) return;
            const now = Date.now();
            if (now - _lastCalcTrack > 10000) { _lastCalcTrack = now; trackCalculation(toolId); }
        });
        document.querySelectorAll('select').forEach(s => {
            s.addEventListener('change', () => saveUnitPresets(toolId));
        });

        // Make header logo+title a home link on tool pages
        const headerLeft = document.querySelector('.header-left');
        if (headerLeft && !headerLeft.querySelector('a')) {
            const a = document.createElement('a');
            a.href = 'index.html';
            a.className = 'header-home-link';
            a.title = 'Zurück zur Übersicht';
            while (headerLeft.firstChild) a.appendChild(headerLeft.firstChild);
            headerLeft.appendChild(a);
        }

        // Mobile: show tool name in header instead of brand name
        const toolMeta = _TOOL_META[toolId];
        if (toolMeta) {
            const titleEl = document.querySelector('.header-title');
            if (titleEl) titleEl.setAttribute('data-tool', toolMeta.title);
        }

        // Mobile: collapsible description box (toggle)
        const desc = document.querySelector('.description');
        if (desc && window.innerWidth <= 768) {
            desc.classList.add('desc-collapsed');
            const hint = document.createElement('div');
            hint.className = 'desc-expand-hint visible';
            hint.textContent = '▼ Info einblenden';
            desc.insertAdjacentElement('afterend', hint);
            function toggleDesc() {
                const collapsed = desc.classList.toggle('desc-collapsed');
                hint.textContent = collapsed ? '▼ Info einblenden' : '▲ Info ausblenden';
            }
            hint.addEventListener('click', toggleDesc);
            desc.addEventListener('click', toggleDesc);
        }
    }
});
