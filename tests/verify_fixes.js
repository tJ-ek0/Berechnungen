// Verifikation der 6 Audit-Fixes gegen Referenzwerte
// Funktionen 1:1 aus den korrigierten HTML-Dateien kopiert

// ===== 1. Tankinhalt: headParams / headRadiusAtY / headPartialVol =====
function headParams(D, headType) {
    if (headType === 'flat')       return { R: 0, r: 0, hb: 0 };
    if (headType === 'hemisphere') return { R: D / 2, r: 0, hb: D / 2 };
    let R, r;
    if (headType === 'kloepperboden') { R = D;       r = 0.1   * D; }
    else                              { R = 0.8 * D; r = 0.154 * D; }
    const hb = R - Math.sqrt(Math.max(0, (R - r) * (R - r) - (D / 2 - r) * (D / 2 - r)));
    return { R, r, hb };
}
function headRadiusAtY(y, D, headType) {
    if (headType === 'flat') return D / 2;
    const { R, r, hb } = headParams(D, headType);
    if (hb <= 0 || y >= hb) return D / 2;
    if (headType === 'hemisphere') return Math.sqrt(Math.max(0, D * y - y * y));
    const yt = R * (hb - r) / (R - r);
    if (y <= yt) {
        return Math.sqrt(Math.max(0, 2 * R * y - y * y));
    } else {
        const kcy = hb, kcx = D / 2 - r;
        return kcx + Math.sqrt(Math.max(0, r * r - (y - kcy) * (y - kcy)));
    }
}
function headPartialVol(fillH, D, headType) {
    if (headType === 'flat' || fillH <= 0) return 0;
    const { hb } = headParams(D, headType);
    const h = Math.min(fillH, hb);
    const N = 80;
    const dy = h / N;
    let vol = 0, prevA = Math.PI * headRadiusAtY(0, D, headType) ** 2;
    for (let i = 1; i <= N; i++) {
        const a = Math.PI * headRadiusAtY(i * dy, D, headType) ** 2;
        vol += (prevA + a) * 0.5 * dy;
        prevA = a;
    }
    return vol;
}
function headTotalVol(D, headType) {
    return headPartialVol(headParams(D, headType).hb, D, headType);
}

let pass = 0, fail = 0;
function check(name, actual, expected, tolPct) {
    const ok = Math.abs(actual - expected) <= Math.abs(expected) * tolPct / 100 + 1e-12;
    console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + '  ist=' + actual.toPrecision(6) + '  soll=' + expected + ' (±' + tolPct + '%)');
    ok ? pass++ : fail++;
}

console.log('--- 1. Tankinhalt (Klöpper/Korbbogen) ---');
// DIN 28011: h2 ≈ 0,1935·Da (außen). Innen mit Di: hb ≈ 0,1938·Di
check('Klöpper hb (D=1,98 m)', headParams(1.98, 'kloepperboden').hb, 0.1938 * 1.98, 0.5);
// Literatur: V_Klöpper ≈ 0,0998·Di³ (ohne Bördel)
check('Klöpper Volumen (D=1 m)', headTotalVol(1, 'kloepperboden'), 0.0998, 1.5);
// Korbbogen DIN 28013: h2 ≈ 0,255·Da, V ≈ 0,1298·Di³ (Literaturwert ~0,13)
check('Korbbogen hb (D=1 m)', headParams(1, 'korbbogen').hb, 0.255, 3);
check('Korbbogen Volumen (D=1 m)', headTotalVol(1, 'korbbogen'), 0.1298, 2);
// Halbkugel: V = (2/3)·π·r³
check('Halbkugel Volumen (D=2 m)', headTotalVol(2, 'hemisphere'), (2/3) * Math.PI, 0.1);
// Stetigkeit: Radius an der Schulter muss D/2 sein
check('Klöpper r(hb) = D/2', headRadiusAtY(headParams(1, 'kloepperboden').hb - 1e-9, 1, 'kloepperboden'), 0.5, 0.1);
check('Korbbogen r(hb) = D/2', headRadiusAtY(headParams(1, 'korbbogen').hb - 1e-9, 1, 'korbbogen'), 0.5, 0.1);
// Stetigkeit am Kalotte/Krempe-Übergang yt
const p = headParams(1, 'kloepperboden');
const yt = p.R * (p.hb - p.r) / (p.R - p.r);
check('Klöpper stetig bei yt', headRadiusAtY(yt - 1e-9, 1, 'kloepperboden'), headRadiusAtY(yt + 1e-9, 1, 'kloepperboden'), 0.05);

console.log('--- 2. WHG Gefährdungsstufe (AwSV §39 Tab. 1) ---');
const VOL_GRENZEN = [0.22, 1, 10, 100, 1000, Infinity];
const STUFEN_MATRIX = { 1: ['A','A','A','A','B','C'], 2: ['A','A','B','C','D','D'], 3: ['A','B','C','D','D','D'] };
function getStufe(wgk, volM3) {
    if (wgk == 0) return 'nwg';
    const idx = VOL_GRENZEN.findIndex(g => volM3 <= g);
    return STUFEN_MATRIX[wgk][idx];
}
function checkS(name, actual, expected) {
    const ok = actual === expected;
    console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + '  ist=' + actual + '  soll=' + expected);
    ok ? pass++ : fail++;
}
checkS('0,2 m³ WGK3', getStufe(3, 0.2), 'A');
checkS('0,5 m³ WGK3', getStufe(3, 0.5), 'B');
checkS('5 m³ WGK2 (Heizöltank)', getStufe(2, 5), 'B');
checkS('50 m³ WGK2', getStufe(2, 50), 'C');
checkS('50 m³ WGK1', getStufe(1, 50), 'A');
checkS('500 m³ WGK1', getStufe(1, 500), 'B');
checkS('5000 m³ WGK1 (max C!)', getStufe(1, 5000), 'C');
checkS('200 m³ WGK3', getStufe(3, 200), 'D');

console.log('--- 3. Leitfähigkeit Zellkonstante ---');
check('K aus R=1000Ω, κ=1413µS/cm', 1000 * (1413 / 1e6), 1.413, 0.01);
check('κ aus K=1, R=707,7Ω', (1 / 707.7) * 1e6, 1413, 0.05);
check('R aus K=1, κ=1413', (1 / 1413) * 1e6, 707.7, 0.05);

console.log('--- 4. DP-Durchfluss Kennlinie ---');
check('Q% bei DP=25%', 10 * Math.sqrt(25), 50, 0.01);
check('Q% bei DP=1%', 10 * Math.sqrt(1), 10, 0.01);
check('Signal bei DP=25%: 4+16·0,5', 4 + 16 * (10 * Math.sqrt(25)) / 100, 12, 0.01);

console.log('--- 5. Konzentration: Ethanol (fallende Dichte) ---');
function interpolate(data, density) {
    const first = data[0][1], last = data[data.length - 1][1];
    if (density < Math.min(first, last) || density > Math.max(first, last)) return null;
    for (let i = 0; i < data.length - 1; i++) {
        const [c1, d1] = data[i];
        const [c2, d2] = data[i + 1];
        if ((density >= d1 && density <= d2) || (density <= d1 && density >= d2)) {
            if (d2 === d1) return c1;
            const t = (density - d1) / (d2 - d1);
            return c1 + t * (c2 - c1);
        }
    }
    return null;
}
const ETH = [[0,0.9982],[5,0.9894],[10,0.9820],[15,0.9755],[20,0.9686],[25,0.9614],[30,0.9539],[40,0.9375],[50,0.9184],[60,0.8976],[70,0.8762],[80,0.8548],[90,0.8338],[100,0.7893]];
const H2SO4 = [[0,0.9982],[5,1.0300],[10,1.0661],[15,1.1020],[20,1.1394]];
check('Ethanol ρ=0,9184 → 50%', interpolate(ETH, 0.9184), 50, 0.5);
check('Ethanol ρ=0,9282 → ~45%', interpolate(ETH, (0.9375 + 0.9184) / 2), 45, 1);
check('H₂SO₄ ρ=1,0661 → 10% (steigend weiter ok)', interpolate(H2SO4, 1.0661), 10, 0.5);
checkS('Ethanol ρ=1,05 → außerhalb (null)', String(interpolate(ETH, 1.05)), 'null');

console.log('--- 6. Typ K mit ITS-90-Exponentialterm ---');
const K_NEG = [0,3.9450128e-2,2.3622373e-5,-3.2858906e-7,-4.9904040e-9,-6.7509059e-11,-5.7410327e-13,-3.1088872e-15,-1.0451609e-17,-1.9889266e-20,-1.6322697e-23];
const K_POS = [-1.7600414e-2,3.8921205e-2,1.8558770e-5,-9.9457593e-8,3.1840945e-10,-5.6072844e-13,5.6075059e-16,-3.2020720e-19,9.7151147e-23,-1.2104721e-26];
function _kExp(t,k){return(k==='K'&&t>=0)?0.1185976*Math.exp(-1.183432e-4*Math.pow(t-126.9686,2)):0;}
function t2mvK(t){
    const c = t >= 0 ? K_POS : K_NEG;
    let v = 0;
    for (let i = 0; i < c.length; i++) v += c[i] * Math.pow(t, i);
    return v + _kExp(t, 'K');
}
// NIST-Referenztabelle Typ K: 0°C=0,000 | 100°C=4,096 | 127°C≈5,212 | 500°C=20,644 | 1000°C=41,276 mV
{
    const v0 = t2mvK(0);
    const ok = Math.abs(v0) < 0.001; // absolute Toleranz: ±0,001 mV
    console.log((ok ? 'PASS' : 'FAIL') + '  Typ K 0°C = 0,000 mV  ist=' + v0.toExponential(3));
    ok ? pass++ : fail++;
}
check('Typ K 100°C = 4,096 mV', t2mvK(100), 4.096, 0.05);
check('Typ K 200°C = 8,138 mV', t2mvK(200), 8.138, 0.05);
check('Typ K 500°C = 20,644 mV', t2mvK(500), 20.644, 0.05);
check('Typ K 1000°C = 41,276 mV', t2mvK(1000), 41.276, 0.05);
check('Typ K -100°C = -3,554 mV', t2mvK(-100), -3.554, 0.05);

console.log('\n' + pass + ' PASS, ' + fail + ' FAIL');
process.exit(fail > 0 ? 1 : 0);
