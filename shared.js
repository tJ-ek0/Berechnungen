/* ============================================
   SHARED UTILITIES — Techniker Berechnungstools
   ============================================ */

// ============ THEME ============
let _onThemeChanged = null;

function initTheme() {
    try {
        const saved = localStorage.getItem('techtools_state');
        if (saved) {
            const state = JSON.parse(saved);
            if (state.theme) document.documentElement.setAttribute('data-theme', state.theme);
        }
    } catch(e) {}
    updateThemeIcon();
}

function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    updateThemeIcon();
    saveGlobalState({ theme: next });
    if (_onThemeChanged) _onThemeChanged();
}

function onThemeChanged(callback) {
    _onThemeChanged = callback;
}

function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
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
        const label = row?.querySelector('td:first-child')?.textContent?.trim() || '';
        const value = field.textContent.trim();
        if (value) text += label + ': ' + value + '\n';
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
        input.value = input.defaultValue || '0';
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
        const presets = JSON.parse(localStorage.getItem('techtools_units_' + toolId) || '{}');
        Object.entries(presets).forEach(([id, value]) => {
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
        if (el) el.value = value;
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
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js';
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
            if (y > 270) { pdf.addPage(); y = 20; }
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
        // Escape: Reset
        if (e.key === 'Escape' && !inInput) {
            e.preventDefault();
            resetFields();
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
                if (el?.closest?.('.result-field')) {
                    // Only convert numbers, not other text
                    const spans = el.closest('.result-field').querySelectorAll('span');
                    spans.forEach(span => {
                        const text = span.textContent;
                        // Match numbers with dots (e.g. 123.45) but not already converted
                        if (/\d+\.\d+/.test(text) && !span.dataset.formatted) {
                            span.dataset.formatted = '1';
                            span.textContent = text.replace(/(\d+)\.(\d+)/g, '$1,$2');
                            span.dataset.formatted = '';
                        }
                    });
                }
            }
        });
    });

    // Observe all result fields
    document.querySelectorAll('.result-field').forEach(field => {
        observer.observe(field, { childList: true, subtree: true, characterData: true });
    });
}

// ============ RELATED TOOLS ============
const _TOOL_META = {
    stromausgang:    { title: 'Stromausgangsberechnung', href: 'Stromausgang.html',      icon: '⚡' },
    kalibrier:       { title: 'Kalibrierpunkte',         href: 'Kalibrierpunkte.html',   icon: '🎯' },
    abweichung:      { title: 'Messwertabweichung',      href: 'Messwertabweichung.html',icon: '📏' },
    burden:          { title: '4-20mA Bürdenrechner',    href: 'Buerdenrechner.html',    icon: '🔌' },
    druck:           { title: 'Druckkalibrierung',       href: 'Druckkalibrierung.html', icon: '🔧' },
    ph:              { title: 'pH Steilheit',            href: 'PHWert.html',            icon: '🧪' },
    leitfaehigkeit:  { title: 'Leitfähigkeit',          href: 'Leitfaehigkeit.html',    icon: '💧' },
    sauerstoff:      { title: 'Sauerstoff',              href: 'Sauerstoff.html',        icon: '🫧' },
    tempsensor:      { title: 'Temperatursensor',        href: 'Temperatursensor.html',  icon: '🌡️' },
    impuls:          { title: 'Impulswertigkeit',        href: 'Impulswertigkeit.html',  icon: '📊' },
    fliess:          { title: 'Fließgeschwindigkeit',    href: 'Fliessgeschwindigkeit.html', icon: '🌊' },
    einbau:          { title: 'Einlaufstrecken',         href: 'Einbaulaengen.html',     icon: '📏' },
    blende:          { title: 'Blenden/DP-Durchfluss',  href: 'BlendeDP.html',          icon: '🔧' },
    volmasse:        { title: 'Volumen-Masse',           href: 'VolumenMasse.html',      icon: '🔄' },
    dichte:          { title: 'Dichteberechnung',        href: 'Dichteberechnung.html',  icon: '⚖️' },
    dichtetab:       { title: 'Dichtetabelle',           href: 'Dichtetabelle.html',     icon: '⚖️' },
    viskositaet:     { title: 'Viskosität',              href: 'Viskositaet.html',       icon: '💧' },
    einheiten:       { title: 'Einheiten-Rechner',       href: 'Einheiten.html',         icon: '📐' },
    tank:            { title: 'Tankinhalt-Rechner',      href: 'Tankinhalt.html',        icon: '🛢️' },
    dampf:           { title: 'Dampftabelle',            href: 'Dampftabelle.html',      icon: '♨️' },
    flansch:         { title: 'DN/Flansch-Tabelle',      href: 'Flansch.html',           icon: '🔩' },
    dkwerte:         { title: 'DK-Werte',                href: 'DKWerte.html',           icon: '📡' },
    schutzart:       { title: 'Schutzarten',             href: 'Schutzarten.html',       icon: '🛡️' },
    abstandsquadrat: { title: 'Abstandsquadratgesetz',  href: 'Abstandsquadrat.html',   icon: '☢️' },
    zerfall:         { title: 'Zerfallsrechner',         href: 'Zerfall.html',           icon: '⚛️' },
    dosisleistung:   { title: 'Dosisleistung',           href: 'Dosisleistung.html',     icon: '📡' },
    abschirmung:     { title: 'Abschirmungsrechner',     href: 'Abschirmung.html',       icon: '🛡️' },
    aufenthaltszeit: { title: 'Aufenthaltszeit',         href: 'Aufenthaltszeit.html',   icon: '⏱️' },
    isotopdaten:     { title: 'Isotopdaten-Tabelle',     href: 'Isotopdaten.html',       icon: '📋' },
    whg_gefaehrdung: { title: 'WHG Gefährdungsstufe',   href: 'WHG_Gefaehrdungsstufe.html', icon: '💧' },
    whg_rohrleitung: { title: 'Rohrleitungsinhalt',      href: 'WHG_Rohrleitungsinhalt.html', icon: '🔩' },
    whg_auffangwanne:{ title: 'Auffangwanne',            href: 'WHG_Auffangwanne.html',  icon: '🛡️' },
    whg_wgk:         { title: 'WGK-Nachschlagewerk',    href: 'WHG_WGK.html',           icon: '📋' },
    elektro:         { title: 'Elektro-Grundlagen',     href: 'Elektro_Grundlagen.html',icon: '⚡' },
    kabel:           { title: 'Kabelquerschnitt',        href: 'Kabelquerschnitt.html',  icon: '🔌' },
    waerme:          { title: 'Wärmetechnik',            href: 'Waermetechnik.html',     icon: '🌡️' },
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
    einheiten:       ['volmasse', 'druck', 'einheiten'],
    tank:            ['volmasse', 'dichte', 'einheiten'],
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
        .related-card-icon { font-size: 18px; flex-shrink: 0; }
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
        a.innerHTML = '<span class="related-card-icon">' + meta.icon + '</span><span>' + meta.title + '</span>';
        grid.appendChild(a);
    });

    const container = document.querySelector('.container');
    if (container) container.appendChild(section);
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initKeyboardShortcuts();
    initGermanFormat();
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    loadFromShareLink();
    trackPageVisit();

    const toolId = document.body.dataset.toolId;
    if (toolId) {
        trackToolUsage(toolId);
        loadUnitPresets(toolId);
        injectRelatedTools(toolId);
        document.querySelectorAll('select').forEach(s => {
            s.addEventListener('change', () => saveUnitPresets(toolId));
        });
    }
});
