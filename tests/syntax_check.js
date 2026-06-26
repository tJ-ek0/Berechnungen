// Syntax-Check: prüft alle Inline-<script>-Blöcke und shared.js auf JS-Parse-Fehler
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..');
let fail = 0, checked = 0;

function checkSource(src, label) {
    try { new Function(src); checked++; }
    catch (e) { fail++; console.log('SYNTAXFEHLER  ' + label + '  →  ' + e.message); }
}

fs.readdirSync(dir).filter(f => f.endsWith('.html')).forEach(f => {
    const html = fs.readFileSync(path.join(dir, f), 'utf8');
    const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
    let m, idx = 0;
    while ((m = re.exec(html)) !== null) {
        idx++;
        if (m[1].trim()) checkSource(m[1], f + ' [script #' + idx + ']');
    }
});
checkSource(fs.readFileSync(path.join(dir, 'shared.js'), 'utf8'), 'shared.js');

console.log(checked + ' Skriptblöcke geprüft, ' + fail + ' Syntaxfehler');
process.exit(fail > 0 ? 1 : 0);
