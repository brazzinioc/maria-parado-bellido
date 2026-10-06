// Genera las ilustraciones que reemplazan a las fotos que aún no existen:
//   public/images/placeholders/lugar-<tipo>.svg  (según el tipo de lugar)
//   public/images/placeholders/ruta-<experiencia>-<1|2|3>.svg
// Uso: node tools/generate-placeholders.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = new URL("../public/images/placeholders/", import.meta.url);
const W = 1200;
const H = 900;

// Paletas tomadas de los colores del sitio (sand, primary, secondary, accent, ink).
const PALETTES = {
  verde: { sky: ["#dfe9e2", "#f6f1e7"], sun: "#e0a526", far: "#b7cbbc", mid: "#6f9a7d", near: "#2f5d46", ground: "#234635", detail: "#faf6f0" },
  tierra: { sky: ["#f3dcc0", "#faf1e4"], sun: "#e0a526", far: "#d2b49a", mid: "#a8775a", near: "#6e4632", ground: "#4a2f22", detail: "#faf6f0" },
  atardecer: { sky: ["#efc6b4", "#fbefd8"], sun: "#fbf0d6", far: "#d59a82", mid: "#b5452a", near: "#7a2e1d", ground: "#4f1d13", detail: "#fbf0d6" },
  puna: { sky: ["#d8e2ea", "#f5f2ea"], sun: "#f2d38a", far: "#c3ccd2", mid: "#8e9f96", near: "#55705f", ground: "#3a4d40", detail: "#ffffff" },
};

// Montañas reproducibles: misma semilla, misma silueta.
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}
function ridge(seed, baseY, amp, color, step = 120) {
  const r = rng(seed);
  let d = `M0 ${H} L0 ${baseY - r() * amp}`;
  for (let x = step; x <= W + step; x += step) {
    const y = baseY - r() * amp;
    d += ` L${x - step / 2} ${y - amp * 0.35 * r()} L${x} ${y}`;
  }
  return `<path d="${d} L${W} ${H} Z" fill="${color}"/>`;
}
const sky = (p) => `
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>`;
const sun = (p, x = 900, y = 210, r = 70) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.sun}" opacity="0.9"/>`;
const range = (p, seed) => ridge(seed, 420, 140, p.far, 150) + ridge(seed + 7, 540, 120, p.mid, 110);
const tree = (x, y, s, c) =>
  `<rect x="${x - 4 * s}" y="${y}" width="${8 * s}" height="${30 * s}" fill="${c}"/><circle cx="${x}" cy="${y - 6 * s}" r="${24 * s}" fill="${c}"/><circle cx="${x - 18 * s}" cy="${y + 4 * s}" r="${16 * s}" fill="${c}"/><circle cx="${x + 18 * s}" cy="${y + 4 * s}" r="${16 * s}" fill="${c}"/>`;
const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${body}</svg>\n`;

// Franja con motivo textil andino (rombos escalonados).
function textile(p, y = 860) {
  let s = `<rect x="0" y="${y}" width="${W}" height="40" fill="${p.near}"/>`;
  for (let x = 0; x < W; x += 60) {
    s += `<path d="M${x + 30} ${y + 6} L${x + 46} ${y + 20} L${x + 30} ${y + 34} L${x + 14} ${y + 20} Z" fill="${p.sun}"/>`;
    s += `<rect x="${x + 26}" y="${y + 16}" width="8" height="8" fill="${p.near}"/>`;
  }
  return s;
}

// ------------------------------------------------------------------ lugares
const LUGARES = {
  montana: (p) => {
    // Cerro o cumbre: pico central con nieve y queñuales.
    let s = sky(p) + sun(p, 260, 200) + ridge(3, 430, 120, p.far, 150);
    s += `<path d="M180 ${H} L600 230 L1020 ${H} Z" fill="${p.mid}"/><path d="M520 320 L600 230 L680 320 L640 300 L600 330 L560 300 Z" fill="${p.detail}"/>`;
    s += ridge(11, 700, 70, p.near, 100) + tree(170, 690, 1.1, p.ground) + tree(1040, 700, 1.3, p.ground) + tree(960, 720, 0.9, p.ground);
    return s;
  },
  mirador: (p) => {
    // Mirador: plataforma con baranda sobre el valle.
    let s = sky(p) + sun(p) + range(p, 5) + ridge(15, 640, 40, p.near, 140);
    s += `<path d="M0 ${H} L0 720 L520 690 L640 ${H} Z" fill="${p.ground}"/>`;
    s += `<rect x="60" y="640" width="420" height="10" fill="${p.detail}"/>`;
    for (let x = 70; x <= 470; x += 50) s += `<rect x="${x}" y="640" width="8" height="60" fill="${p.detail}"/>`;
    s += `<circle cx="300" cy="566" r="16" fill="${p.ground}"/><path d="M286 584 h28 l8 70 h-44 Z" fill="${p.ground}"/>`;
    return s;
  },
  rio: (p) => {
    // Río o valle: cauce que serpentea hacia el horizonte.
    let s = sky(p) + sun(p, 300, 220) + range(p, 9);
    s += `<path d="M0 ${H} L0 600 Q600 560 ${W} 610 L${W} ${H} Z" fill="${p.near}"/>`;
    s += `<path d="M560 600 Q650 650 540 700 Q400 770 520 830 Q620 880 560 ${H} L760 ${H} Q820 860 700 820 Q600 770 720 700 Q820 640 620 600 Z" fill="#a9c9d4"/>`;
    s += tree(180, 700, 1, p.ground) + tree(980, 690, 1.2, p.ground);
    return s;
  },
  quebrada: (p) => {
    // Quebrada: laderas en V con arroyo y árboles.
    let s = sky(p) + sun(p, 600, 170, 60) + ridge(21, 380, 100, p.far, 150);
    s += `<path d="M0 260 L520 ${H} L0 ${H} Z" fill="${p.mid}"/><path d="M${W} 240 L680 ${H} L${W} ${H} Z" fill="${p.near}"/>`;
    s += `<path d="M580 520 Q610 640 570 760 Q550 840 600 ${H} L640 ${H} Q600 840 620 760 Q660 640 620 520 Z" fill="#a9c9d4"/>`;
    s += tree(260, 600, 1.1, p.ground) + tree(150, 720, 1.3, p.ground) + tree(930, 620, 1.1, p.ground) + tree(1060, 740, 1.3, p.ground);
    return s;
  },
  agua: (p) => {
    // Agua termal o manantial: poza con vapor entre piedras.
    let s = sky(p) + sun(p) + range(p, 13) + ridge(17, 680, 40, p.near, 140);
    s += `<ellipse cx="600" cy="780" rx="330" ry="80" fill="#9cc3cf"/><ellipse cx="600" cy="770" rx="250" ry="45" fill="#c3dde4"/>`;
    for (const [x, y, r] of [[290, 790, 40], [350, 830, 30], [880, 800, 44], [940, 760, 28], [820, 850, 30]]) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.ground}"/>`;
    for (const x of [480, 600, 720]) s += `<path d="M${x} 700 q-26 -40 0 -80 q26 -40 0 -80" stroke="${p.detail}" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.85"/>`;
    return s;
  },
  humedal: (p) => {
    // Humedal o laguna: espejos de agua, juncos y aves.
    let s = sky(p) + sun(p, 280, 210) + range(p, 25);
    s += `<rect x="0" y="620" width="${W}" height="${H - 620}" fill="${p.near}"/>`;
    for (const [x, y, rx] of [[330, 720, 220], [860, 690, 180], [700, 820, 260]]) s += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx / 6}" fill="#a9c9d4"/>`;
    for (let x = 80; x < W; x += 95) s += `<path d="M${x} 860 l-6 -90 M${x + 12} 860 l4 -110 M${x + 24} 860 l10 -80" stroke="${p.ground}" stroke-width="6" stroke-linecap="round"/>`;
    for (const [x, y] of [[700, 300], [760, 270], [820, 310]]) s += `<path d="M${x} ${y} q16 -14 30 0 q14 -14 30 0" stroke="${p.ground}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    return s;
  },
  roca: (p) => {
    // Formación rocosa: gran peñón en primer plano.
    let s = sky(p) + sun(p, 260, 210) + range(p, 31) + ridge(35, 720, 50, p.near, 140);
    s += `<path d="M560 ${H} L600 470 L680 380 L760 420 L800 520 L790 640 L840 ${H} Z" fill="${p.ground}"/>`;
    s += `<path d="M680 380 L700 520 L640 640 M760 420 L740 560" stroke="${p.mid}" stroke-width="8" fill="none"/>`;
    return s;
  },
  arqueologico: (p) => {
    // Sitio arqueológico: andenes y muro de piedra con vano trapezoidal.
    let s = sky(p) + sun(p) + range(p, 41);
    for (let i = 0; i < 4; i++) {
      const y = 600 + i * 70;
      s += `<rect x="${-40 + i * 30}" y="${y}" width="${W + 80 - i * 60}" height="70" fill="${i % 2 ? p.mid : p.near}"/>`;
      for (let x = (i % 2) * 40; x < W; x += 80) s += `<rect x="${x}" y="${y + 6}" width="72" height="28" rx="6" fill="${p.ground}" opacity="0.35"/>`;
    }
    s += `<rect x="420" y="430" width="360" height="170" fill="${p.ground}"/>`;
    for (let y = 440; y < 590; y += 34) for (let x = 430 + ((y / 34) % 2) * 20; x < 770; x += 56) s += `<rect x="${x}" y="${y}" width="48" height="26" rx="5" fill="${p.mid}"/>`;
    s += `<path d="M570 600 L582 480 L618 480 L630 600 Z" fill="${p.sky[1]}"/>`;
    return s;
  },
  templo: (p) => {
    // Templo: iglesia colonial con dos campanarios frente a la plaza.
    let s = sky(p) + sun(p, 220, 200) + range(p, 47);
    s += `<rect x="0" y="760" width="${W}" height="${H - 760}" fill="${p.near}"/>`;
    s += `<rect x="440" y="470" width="320" height="290" fill="${p.detail}"/><path d="M440 470 L600 380 L760 470 Z" fill="${p.mid}"/>`;
    for (const x of [380, 760]) s += `<rect x="${x}" y="360" width="60" height="400" fill="${p.detail}"/><path d="M${x} 360 Q${x + 30} 300 ${x + 60} 360 Z" fill="${p.mid}"/><rect x="${x + 27}" y="270" width="6" height="40" fill="${p.ground}"/><rect x="${x + 17}" y="282" width="26" height="6" fill="${p.ground}"/><rect x="${x + 18}" y="400" width="24" height="36" rx="12" fill="${p.ground}"/>`;
    s += `<path d="M555 760 L555 640 Q600 590 645 640 L645 760 Z" fill="${p.ground}"/><circle cx="600" cy="530" r="22" fill="${p.ground}"/>`;
    return s;
  },
  historico: (p) => {
    // Sitio histórico: arco de piedra y muro en ruinas.
    let s = sky(p) + sun(p) + range(p, 53) + ridge(57, 740, 30, p.near, 140);
    s += `<path d="M430 760 L430 520 Q600 380 770 520 L770 760 L700 760 L700 540 Q600 450 500 540 L500 760 Z" fill="${p.ground}"/>`;
    s += `<path d="M770 760 L770 600 L840 620 L860 660 L940 650 L960 760 Z" fill="${p.ground}"/><path d="M260 760 L280 680 L350 690 L360 760 Z" fill="${p.ground}"/>`;
    for (let y = 540; y < 760; y += 40) s += `<path d="M430 ${y} h70 M700 ${y} h70" stroke="${p.mid}" stroke-width="4"/>`;
    return s;
  },
};
// Paleta por tipo de lugar
const LUGAR_PALETA = {
  montana: "puna", mirador: "atardecer", rio: "verde", quebrada: "verde", agua: "puna",
  humedal: "verde", roca: "tierra", arqueologico: "tierra", templo: "atardecer", historico: "tierra",
};

// ------------------------------------------------------------------ rutas
const RUTAS = {
  trekking: (p, v) => {
    // Sendero en zigzag hacia la cumbre, con banderín.
    let s = sky(p) + sun(p, 250 + v * 200, 200) + ridge(60 + v, 430, 130, p.far, 150);
    s += `<path d="M150 ${H} L640 260 L1130 ${H} Z" fill="${p.mid}"/>`;
    s += `<path d="M560 ${H} L700 800 L520 700 L700 590 L560 480 L660 380 L640 270" stroke="${p.detail}" stroke-width="10" stroke-dasharray="22 18" fill="none" stroke-linecap="round"/>`;
    s += `<rect x="636" y="200" width="6" height="70" fill="${p.ground}"/><path d="M642 204 L700 220 L642 238 Z" fill="${p.sun}"/>`;
    s += tree(220, 760, 1.2, p.ground) + tree(1010, 740, 1.1, p.ground);
    return s + textile(p);
  },
  cicloturismo: (p, v) => {
    // Camino rural que serpentea y una bicicleta en primer plano.
    let s = sky(p) + sun(p, 900 - v * 250, 200) + range(p, 70 + v) + ridge(80 + v, 660, 50, p.near, 140);
    s += `<path d="M520 ${H} Q300 760 700 680 Q1000 620 720 560 Q560 530 640 500" stroke="${p.sky[1]}" stroke-width="70" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M520 ${H} Q300 760 700 680 Q1000 620 720 560 Q560 530 640 500" stroke="${p.sun}" stroke-width="6" stroke-dasharray="26 22" fill="none"/>`;
    const b = `stroke="${p.ground}" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
    s += `<circle cx="230" cy="770" r="70" ${b}/><circle cx="430" cy="770" r="70" ${b}/>`;
    s += `<path d="M230 770 L300 660 L400 660 L430 770 M300 660 L330 770 L400 660 M290 640 h40 M400 660 l10 -40 h30" ${b}/>`;
    return s + textile(p);
  },
  "turismo-vivencial": (p, v) => {
    // Chacras en terrazas, casa de adobe y franja textil.
    let s = sky(p) + sun(p, 260 + v * 300, 190) + ridge(90 + v, 420, 120, p.far, 150);
    const fields = [p.mid, "#c9a24a", p.near, "#8fae6a", p.mid];
    fields.forEach((c, i) => {
      s += `<path d="M0 ${520 + i * 70} Q600 ${490 + i * 70} ${W} ${530 + i * 70} L${W} ${H} L0 ${H} Z" fill="${c}"/>`;
    });
    s += `<rect x="740" y="560" width="240" height="140" fill="#d9b48c"/><path d="M720 570 L860 490 L1000 570 Z" fill="#b5452a"/>`;
    s += `<rect x="830" y="620" width="50" height="80" fill="${p.ground}"/><rect x="760" y="600" width="44" height="36" fill="${p.ground}"/>`;
    s += tree(200, 600, 1, p.ground);
    return s + textile(p);
  },
};
const RUTA_PALETAS = ["verde", "tierra", "atardecer"];

mkdirSync(OUT, { recursive: true });
for (const [tipo, draw] of Object.entries(LUGARES)) {
  writeFileSync(new URL(`lugar-${tipo}.svg`, OUT), svg(draw(PALETTES[LUGAR_PALETA[tipo]])));
}
for (const [exp, draw] of Object.entries(RUTAS)) {
  RUTA_PALETAS.forEach((pal, i) => writeFileSync(new URL(`ruta-${exp}-${i + 1}.svg`, OUT), svg(draw(PALETTES[pal], i))));
}
console.log(`${Object.keys(LUGARES).length} lugares + ${Object.keys(RUTAS).length * RUTA_PALETAS.length} rutas`);
