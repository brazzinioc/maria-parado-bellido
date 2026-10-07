// Genera las ilustraciones que reemplazan a las fotos que aún no existen:
//   public/images/placeholders/lugar-<tipo>.svg  (según el tipo de lugar)
//   public/images/placeholders/ruta-<experiencia>-<1|2|3>.svg
//   public/images/placeholders/fiesta-<tipo>.svg   (festividades)
//   public/images/placeholders/evento-<tipo>.svg   (agenda del distrito)
//   public/images/placeholders/plato-<tipo>.svg    (gastronomía)
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
  // Neutra para rutas: no compite con el rojo de las acciones del sitio.
  arena: { sky: ["#f1eadf", "#faf6f0"], sun: "#e0a526", far: "#d8ccb8", mid: "#b7a283", near: "#7d6a52", ground: "#54473a", detail: "#faf6f0" },
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
const RUTA_PALETAS = ["verde", "tierra", "arena"];


// ------------------------------------------------------------------ personas y objetos
// Figura con poncho y sombrero (s = escala, desde los pies en x,y).
const person = (x, y, s, body, hat = body, skirt = null) => {
  let g = `<path d="M${x - 26 * s} ${y - 40 * s} L${x - 18 * s} ${y - 110 * s} L${x + 18 * s} ${y - 110 * s} L${x + 26 * s} ${y - 40 * s} Z" fill="${body}"/>`;
  g += skirt
    ? `<path d="M${x - 34 * s} ${y} L${x - 22 * s} ${y - 46 * s} L${x + 22 * s} ${y - 46 * s} L${x + 34 * s} ${y} Z" fill="${skirt}"/>`
    : `<rect x="${x - 16 * s}" y="${y - 44 * s}" width="${12 * s}" height="${44 * s}" fill="${hat}"/><rect x="${x + 4 * s}" y="${y - 44 * s}" width="${12 * s}" height="${44 * s}" fill="${hat}"/>`;
  g += `<circle cx="${x}" cy="${y - 126 * s}" r="${16 * s}" fill="#8a5a3c"/>`;
  g += `<rect x="${x - 26 * s}" y="${y - 144 * s}" width="${52 * s}" height="${7 * s}" rx="${3 * s}" fill="${hat}"/><rect x="${x - 13 * s}" y="${y - 162 * s}" width="${26 * s}" height="${20 * s}" rx="${5 * s}" fill="${hat}"/>`;
  return g;
};
const crowd = (p, y, n, s, x0 = 80, gap = 120) => {
  const cloth = ["#b5452a", p.near, "#e0a526", "#7a2e1d", p.mid];
  let g = "";
  for (let i = 0; i < n; i++) g += person(x0 + i * gap, y, s, cloth[i % cloth.length], p.ground, i % 2 ? cloth[(i + 2) % cloth.length] : null);
  return g;
};
const bunting = (p, y = 120) => {
  const c = ["#b5452a", "#e0a526", p.near, "#e91e8c", "#2a6fc0"];
  let g = `<path d="M0 ${y} Q600 ${y + 70} ${W} ${y}" stroke="${p.ground}" stroke-width="3" fill="none"/>`;
  for (let x = 30, i = 0; x < W; x += 70, i++) {
    const yy = y + 70 * (1 - Math.pow((x - 600) / 600, 2)) * 0.5 + 4;
    g += `<path d="M${x - 18} ${yy} L${x + 18} ${yy} L${x} ${yy + 36} Z" fill="${c[i % c.length]}"/>`;
  }
  return g;
};
const plaza = (p) => `<rect x="0" y="720" width="${W}" height="${H - 720}" fill="${p.mid}"/><rect x="0" y="720" width="${W}" height="10" fill="${p.near}"/>`;

// ------------------------------------------------------------------ festividades
const FIESTAS = {
  procesion: (p) => {
    // Procesión: andas con el santo bajo arco, estandartes y devotos.
    let s = sky(p) + sun(p, 980, 180) + range(p, 101) + plaza(p);
    s += `<rect x="520" y="560" width="160" height="16" fill="${p.ground}"/><rect x="540" y="576" width="10" height="60" fill="${p.ground}"/><rect x="650" y="576" width="10" height="60" fill="${p.ground}"/>`;
    s += `<path d="M530 560 L530 380 Q600 300 670 380 L670 560" stroke="#e0a526" stroke-width="12" fill="none"/>`;
    s += `<path d="M570 556 L580 440 L620 440 L630 556 Z" fill="${p.detail}"/><circle cx="600" cy="420" r="22" fill="${p.detail}"/><circle cx="600" cy="420" r="34" stroke="#e0a526" stroke-width="6" fill="none"/>`;
    for (const x of [300, 900]) s += `<rect x="${x}" y="360" width="8" height="380" fill="${p.ground}"/><path d="M${x + 8} 370 h90 v120 l-45 -24 l-45 24 Z" fill="${x < 600 ? "#b5452a" : "#2f5d46"}"/>`;
    return s + crowd(p, 860, 10, 0.95, 60, 120) + textile(p);
  },
  virgen: (p) => {
    // Fiesta mariana: la Virgen con manto en andas, flores y devotos.
    let s = sky(p) + sun(p, 220, 180) + range(p, 105) + plaza(p);
    s += `<rect x="520" y="580" width="160" height="16" fill="${p.ground}"/><rect x="540" y="596" width="10" height="50" fill="${p.ground}"/><rect x="650" y="596" width="10" height="50" fill="${p.ground}"/>`;
    s += `<path d="M600 380 L670 576 L530 576 Z" fill="#2a6fc0"/><path d="M600 410 L640 576 L560 576 Z" fill="${p.detail}"/><circle cx="600" cy="392" r="20" fill="${p.detail}"/>`;
    s += `<path d="M560 372 q40 -40 80 0" stroke="#e0a526" stroke-width="8" fill="none"/>`;
    for (const [x, c] of [[520, "#e91e8c"], [545, "#ffffff"], [655, "#e91e8c"], [680, "#ffffff"]]) s += `<circle cx="${x}" cy="572" r="14" fill="${c}"/>`;
    for (const x of [300, 900]) s += `<rect x="${x}" y="380" width="8" height="340" fill="${p.ground}"/><path d="M${x + 8} 390 h80 v100 l-40 -20 l-40 20 Z" fill="${x < 600 ? "#2a6fc0" : "#ffffff"}"/>`;
    return s + crowd(p, 860, 10, 0.95, 60, 120) + textile(p);
  },
  "semana-santa": (p) => {
    // Semana Santa: cruz con lienzo morado sobre el cerro y ramos de palma.
    let s = sky(p) + sun(p, 960, 200) + range(p, 107);
    s += `<path d="M300 ${H} Q600 420 900 ${H} Z" fill="${p.near}"/>`;
    s += `<rect x="588" y="330" width="24" height="260" fill="${p.ground}"/><rect x="520" y="390" width="160" height="22" fill="${p.ground}"/>`;
    s += `<path d="M560 412 Q600 470 640 412 L640 440 Q600 500 560 440 Z" fill="#6b3fa0"/>`;
    for (const [x, y, r] of [[200, 820, -20], [1000, 820, 20]]) s += `<g transform="rotate(${r} ${x} ${y})"><path d="M${x} ${y} L${x} ${y - 200}" stroke="${p.near}" stroke-width="6"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${x} ${y - 40 - i * 28} q-50 -10 -70 30 M${x} ${y - 40 - i * 28} q50 -10 70 30" stroke="#8fae6a" stroke-width="8" fill="none" stroke-linecap="round"/>`).join("")}</g>`;
    return s + crowd(p, 880, 6, 0.8, 300, 120) + textile(p);
  },
  carnaval: (p) => {
    // Carnaval: comparsa bajo banderines, con serpentinas.
    let s = sky(p) + bunting(p, 90) + range(p, 111) + plaza(p);
    for (const [x, y, c] of [[200, 260, "#e91e8c"], [420, 220, "#2a6fc0"], [760, 250, "#e0a526"], [980, 230, "#b5452a"]]) s += `<path d="M${x} ${y} q30 40 0 80 q-30 40 0 80" stroke="${c}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
    return s + crowd(p, 860, 9, 1.15, 90, 130) + textile(p);
  },
  civico: (p) => {
    // Aniversario: plaza con asta y bandera del Perú, desfile.
    let s = sky(p) + sun(p, 240, 190) + range(p, 121) + plaza(p);
    s += `<rect x="596" y="250" width="10" height="470" fill="${p.ground}"/><rect x="606" y="260" width="66" height="120" fill="#d42c2a"/><rect x="672" y="260" width="66" height="120" fill="#ffffff"/><rect x="738" y="260" width="66" height="120" fill="#d42c2a"/>`;
    s += `<rect x="540" y="700" width="120" height="24" fill="${p.near}"/>`;
    return s + crowd(p, 870, 9, 0.85, 70, 125) + textile(p);
  },
  difuntos: (p) => {
    // Todos los Santos: cruces con flores y velas al atardecer.
    let s = sky(p) + sun(p, 600, 380, 110) + range(p, 131) + `<rect x="0" y="700" width="${W}" height="${H - 700}" fill="${p.near}"/>`;
    for (const [x, h] of [[250, 220], [480, 280], [720, 240], [950, 200]]) {
      s += `<rect x="${x - 8}" y="${760 - h}" width="16" height="${h}" fill="${p.detail}"/><rect x="${x - 50}" y="${760 - h + 50}" width="100" height="16" fill="${p.detail}"/>`;
      s += `<circle cx="${x - 30}" cy="770" r="22" fill="#e0a526"/><circle cx="${x + 30}" cy="772" r="20" fill="#e91e8c"/><circle cx="${x}" cy="780" r="18" fill="#b5452a"/>`;
      s += `<rect x="${x + 60}" y="740" width="12" height="40" fill="${p.detail}"/><path d="M${x + 66} 724 q8 10 0 16 q-8 -6 0 -16" fill="#e0a526"/>`;
    }
    return s + textile(p);
  },
  navidad: (p) => {
    // Navidad: templo de noche con estrella.
    let s = `<rect width="${W}" height="${H}" fill="#1f2a44"/>` + ridge(141, 520, 120, "#2c3a5a", 150);
    for (const [x, y] of [[120, 120], [300, 200], [520, 90], [860, 160], [1080, 110], [980, 260]]) s += `<circle cx="${x}" cy="${y}" r="4" fill="#fbf0d6"/>`;
    s += `<path d="M600 60 l18 44 l46 4 l-36 30 l12 46 l-40 -26 l-40 26 l12 -46 l-36 -30 l46 -4 Z" fill="#e0a526"/>`;
    s += `<rect x="0" y="760" width="${W}" height="${H - 760}" fill="#34405e"/><rect x="440" y="470" width="320" height="290" fill="#efe6d6"/><path d="M440 470 L600 380 L760 470 Z" fill="#b5452a"/>`;
    for (const x of [380, 760]) s += `<rect x="${x}" y="360" width="60" height="400" fill="#efe6d6"/><path d="M${x} 360 Q${x + 30} 300 ${x + 60} 360 Z" fill="#b5452a"/><rect x="${x + 18}" y="400" width="24" height="36" rx="12" fill="#e0a526"/>`;
    s += `<path d="M555 760 L555 640 Q600 590 645 640 L645 760 Z" fill="#e0a526"/>`;
    return s + textile({ near: "#1f2a44", sun: "#e0a526" });
  },
};
const FIESTA_PALETA = { procesion: "atardecer", virgen: "puna", "semana-santa": "tierra", carnaval: "verde", civico: "puna", difuntos: "atardecer", navidad: "puna" };

// ------------------------------------------------------------------ agenda
const EVENTOS = {
  feria: (p) => {
    // Feria: puestos con toldos y canastas de productos.
    let s = sky(p) + sun(p, 1000, 170) + range(p, 151) + plaza(p);
    const awn = ["#b5452a", "#2f5d46", "#e0a526"];
    [140, 500, 860].forEach((x, i) => {
      s += `<rect x="${x}" y="540" width="220" height="12" fill="${p.ground}"/><rect x="${x + 6}" y="552" width="8" height="190" fill="${p.ground}"/><rect x="${x + 206}" y="552" width="8" height="190" fill="${p.ground}"/>`;
      for (let k = 0; k < 4; k++) s += `<path d="M${x + k * 55} 540 h55 v40 q-27 24 -55 0 Z" fill="${k % 2 ? p.detail : awn[i]}"/>`;
      s += `<rect x="${x}" y="660" width="220" height="16" fill="#a8775a"/>`;
      for (let k = 0; k < 5; k++) s += `<circle cx="${x + 24 + k * 43}" cy="646" r="16" fill="${["#c9a24a", "#8fae6a", "#b5452a", "#e0a526", "#6e4632"][(k + i) % 5]}"/>`;
    });
    return s + crowd(p, 880, 6, 0.75, 110, 190) + textile(p);
  },
  faena: (p) => {
    // Faena: comuneros con lampas limpiando el canal.
    let s = sky(p) + sun(p, 280, 190) + range(p, 161) + `<rect x="0" y="640" width="${W}" height="${H - 640}" fill="${p.near}"/>`;
    s += `<path d="M0 760 Q600 700 ${W} 770 L${W} 820 Q600 760 0 810 Z" fill="#a9c9d4"/>`;
    s += crowd(p, 740, 6, 0.9, 140, 180);
    for (const x of [175, 535, 895]) s += `<path d="M${x} 560 L${x + 70} 760" stroke="${p.ground}" stroke-width="8"/><path d="M${x + 58} 742 l30 -10 l14 40 l-30 10 Z" fill="#7d6a52"/>`;
    return s + textile(p);
  },
  asamblea: (p) => {
    // Asamblea o reunión: comuneros en semicírculo frente al local comunal.
    let s = sky(p) + sun(p, 1000, 180) + range(p, 171) + plaza(p);
    s += `<rect x="380" y="420" width="440" height="300" fill="#d9b48c"/><path d="M350 430 L600 320 L850 430 Z" fill="#b5452a"/><rect x="560" y="560" width="80" height="160" fill="${p.ground}"/><rect x="430" y="500" width="70" height="60" fill="${p.ground}"/><rect x="700" y="500" width="70" height="60" fill="${p.ground}"/>`;
    s += `<rect x="520" y="700" width="160" height="16" fill="${p.ground}"/>`;
    return s + crowd(p, 880, 9, 0.8, 70, 132) + textile(p);
  },
  minka: (p) => {
    // Minka: techado colectivo de una casa de adobe.
    let s = sky(p) + sun(p, 260, 190) + range(p, 181) + `<rect x="0" y="720" width="${W}" height="${H - 720}" fill="${p.mid}"/>`;
    s += `<rect x="380" y="500" width="440" height="220" fill="#d9b48c"/><path d="M360 510 L600 380 L840 510 Z" fill="none" stroke="${p.ground}" stroke-width="10"/>`;
    for (let x = 400; x <= 800; x += 50) s += `<path d="M${x} 510 L600 380" stroke="${p.ground}" stroke-width="6"/>`;
    s += `<path d="M360 510 L600 380 L620 392 L380 520 Z" fill="#c9a24a"/><rect x="560" y="600" width="70" height="120" fill="${p.ground}"/>`;
    return s + person(300, 860, 0.9, "#b5452a", p.ground) + person(900, 860, 0.9, p.near, p.ground) + person(1040, 860, 0.9, "#e0a526", p.ground, "#7a2e1d") + textile(p);
  },
  pollada: (p) => {
    // Actividad pro fondos: olla al fogón, mesas y música.
    let s = sky(p) + bunting(p, 80) + range(p, 191) + plaza(p);
    s += `<path d="M480 740 L520 640 L680 640 L720 740 Z" fill="${p.ground}"/><ellipse cx="600" cy="640" rx="100" ry="20" fill="#7d6a52"/>`;
    for (const x of [560, 600, 640]) s += `<path d="M${x} 600 q-20 -40 0 -80 q20 -40 0 -80" stroke="${p.detail}" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.85"/>`;
    s += `<path d="M500 760 q50 -50 100 0 q50 -50 100 0" fill="#e0a526"/>`;
    for (const x of [120, 900]) s += `<rect x="${x}" y="700" width="200" height="14" fill="#a8775a"/><rect x="${x + 10}" y="714" width="10" height="60" fill="#a8775a"/><rect x="${x + 180}" y="714" width="10" height="60" fill="#a8775a"/>`;
    return s + crowd(p, 880, 4, 0.75, 160, 300) + textile(p);
  },
};
const EVENTO_PALETA = { feria: "tierra", faena: "verde", asamblea: "arena", minka: "tierra", pollada: "atardecer" };

// ------------------------------------------------------------------ gastronomía
const plate = (cx, cy, r, c) => `<ellipse cx="${cx}" cy="${cy + 20}" rx="${r}" ry="${r * 0.32}" fill="#000" opacity="0.08"/><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.32}" fill="${c}"/>`;
const steam = (cx, cy, color) => [-50, 0, 50].map((d) => `<path d="M${cx + d} ${cy} q-22 -40 0 -80 q22 -40 0 -80" stroke="${color}" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.7"/>`).join("");
const table = (p) => {
  let s = `<rect width="${W}" height="${H}" fill="${p.sky[1]}"/><rect x="0" y="0" width="${W}" height="380" fill="${p.sky[0]}"/>`;
  s += `<rect x="0" y="380" width="${W}" height="${H - 380}" fill="#a8775a"/>`;
  for (let i = 0; i < 6; i++) s += `<rect x="0" y="${420 + i * 80}" width="${W}" height="4" fill="#8f6047" opacity="0.6"/>`;
  // Manta andina bajo el plato.
  s += `<rect x="160" y="520" width="880" height="300" fill="#b5452a"/>`;
  for (let y = 540; y < 820; y += 70) s += `<rect x="160" y="${y}" width="880" height="14" fill="#e0a526"/><rect x="160" y="${y + 22}" width="880" height="8" fill="#2f5d46"/>`;
  return s;
};
const PLATOS = {
  guiso: (p) => {
    // Guiso o picante: plato con papas en salsa roja y arroz.
    let s = table(p) + plate(600, 640, 300, "#faf6f0") + `<ellipse cx="600" cy="630" rx="230" ry="66" fill="#b5452a"/>`;
    for (const [x, y] of [[520, 610], [610, 600], [690, 630], [560, 650]]) s += `<ellipse cx="${x}" cy="${y}" rx="40" ry="22" fill="#e0a526"/>`;
    s += `<ellipse cx="760" cy="640" rx="70" ry="26" fill="#ffffff"/><path d="M620 590 l20 -12 l12 16 Z M560 600 l18 -8 l6 14 Z" fill="#2f5d46"/>`;
    return s;
  },
  sopa: (p) => {
    // Sopa o caldo: cuenco humeante con mote.
    let s = table(p) + steam(600, 500, "#ffffff");
    s += `<path d="M330 600 Q340 780 600 790 Q860 780 870 600 Z" fill="#7d6a52"/><ellipse cx="600" cy="600" rx="270" ry="64" fill="#e8c88f"/>`;
    for (const [x, y] of [[520, 590], [560, 610], [640, 595], [690, 612], [600, 580], [470, 605], [730, 594]]) s += `<circle cx="${x}" cy="${y}" r="12" fill="#faf6f0"/>`;
    s += `<path d="M590 590 l18 -10 l10 14 Z" fill="#2f5d46"/>`;
    return s;
  },
  pachamanca: (p) => {
    // Pachamanca: horno de tierra con piedras y vapor.
    let s = sky(p) + range(p, 201) + `<rect x="0" y="600" width="${W}" height="${H - 600}" fill="${p.near}"/>` + steam(600, 560, p.detail);
    s += `<ellipse cx="600" cy="700" rx="320" ry="110" fill="#6e4632"/>`;
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; s += `<circle cx="${600 + Math.cos(a) * 300}" cy="${700 + Math.sin(a) * 100}" r="30" fill="#8e8a84"/>`; }
    for (const [x, y, c] of [[520, 690, "#e0a526"], [600, 680, "#8fae6a"], [680, 700, "#c9a24a"], [560, 720, "#b5452a"], [650, 725, "#e0a526"]]) s += `<ellipse cx="${x}" cy="${y}" rx="36" ry="20" fill="${c}"/>`;
    return s + textile(p);
  },
  bebida: (p) => {
    // Bebida: tinaja de barro y vasos de chicha.
    let s = table(p);
    s += `<path d="M420 760 Q340 620 420 480 L500 440 L560 440 L640 480 Q720 620 640 760 Z" fill="#a8582f"/><rect x="480" y="420" width="100" height="30" rx="8" fill="#8f4a27"/>`;
    s += `<path d="M450 560 h160" stroke="#e0a526" stroke-width="8"/><path d="M440 600 h180" stroke="#2f5d46" stroke-width="6"/>`;
    for (const x of [760, 880]) s += `<path d="M${x - 50} 600 L${x - 40} 760 L${x + 40} 760 L${x + 50} 600 Z" fill="#faf6f0" opacity="0.9"/><path d="M${x - 46} 630 L${x - 40} 756 L${x + 40} 756 L${x + 46} 630 Z" fill="#e8b16a"/>`;
    return s;
  },
  queso: (p) => {
    // Queso fresco: ruedas de queso sobre hojas, con papas.
    let s = table(p) + plate(600, 650, 320, "#e7d8c0");
    s += `<path d="M380 650 l40 -90 h220 l40 90 Z" fill="#fbf0d6"/><ellipse cx="530" cy="560" rx="110" ry="30" fill="#fff8e6"/>`;
    s += `<path d="M640 640 L760 560 L820 640 Z" fill="#fbf0d6"/>`;
    for (const [x, y] of [[740, 690], [820, 680], [460, 700]]) s += `<ellipse cx="${x}" cy="${y}" rx="38" ry="24" fill="#c9a24a"/>`;
    return s;
  },
  trucha: (p) => {
    // Trucha: pescado frito en plato con papas y limón.
    let s = table(p) + plate(600, 650, 320, "#faf6f0");
    s += `<path d="M380 650 Q520 560 720 640 L800 590 L790 650 L800 710 L720 660 Q520 740 380 650 Z" fill="#c9824a"/><circle cx="420" cy="642" r="8" fill="${p.ground}"/>`;
    for (let x = 470; x < 700; x += 40) s += `<path d="M${x} 615 q10 35 0 70" stroke="#a8673a" stroke-width="5" fill="none"/>`;
    s += `<ellipse cx="820" cy="700" rx="36" ry="22" fill="#e0a526"/><path d="M430 712 a30 18 0 0 1 60 0 Z" fill="#c8d84a"/>`;
    return s;
  },
  general: (p) => {
    // Plato de la chacra: papa, choclo y habas.
    let s = table(p) + plate(600, 650, 320, "#faf6f0");
    s += `<rect x="440" y="600" width="170" height="60" rx="30" fill="#e0a526"/>`;
    for (let x = 455; x < 600; x += 22) s += `<circle cx="${x}" cy="630" r="8" fill="#f2d38a"/>`;
    for (const [x, y] of [[680, 620], [760, 650], [700, 680]]) s += `<ellipse cx="${x}" cy="${y}" rx="44" ry="28" fill="#c9a24a"/>`;
    for (const [x, y] of [[520, 690], [560, 700], [600, 688]]) s += `<ellipse cx="${x}" cy="${y}" rx="18" ry="11" fill="#8fae6a"/>`;
    return s;
  },
};
const PLATO_PALETA = { guiso: "tierra", sopa: "tierra", pachamanca: "verde", bebida: "tierra", queso: "arena", trucha: "arena", general: "tierra" };

mkdirSync(OUT, { recursive: true });
for (const [tipo, draw] of Object.entries(LUGARES)) {
  writeFileSync(new URL(`lugar-${tipo}.svg`, OUT), svg(draw(PALETTES[LUGAR_PALETA[tipo]])));
}
for (const [exp, draw] of Object.entries(RUTAS)) {
  RUTA_PALETAS.forEach((pal, i) => writeFileSync(new URL(`ruta-${exp}-${i + 1}.svg`, OUT), svg(draw(PALETTES[pal], i))));
}
for (const [set, prefix, paletas] of [[FIESTAS, "fiesta", FIESTA_PALETA], [EVENTOS, "evento", EVENTO_PALETA], [PLATOS, "plato", PLATO_PALETA]]) {
  for (const [tipo, draw] of Object.entries(set)) writeFileSync(new URL(`${prefix}-${tipo}.svg`, OUT), svg(draw(PALETTES[paletas[tipo]])));
}
// Procesión en otra paleta, para las fiestas de las comunidades.
writeFileSync(new URL("fiesta-comunidad.svg", OUT), svg(FIESTAS.procesion(PALETTES.verde)));
console.log(
  `${Object.keys(LUGARES).length} lugares + ${Object.keys(RUTAS).length * RUTA_PALETAS.length} rutas + ` +
    `${Object.keys(FIESTAS).length} fiestas + ${Object.keys(EVENTOS).length} eventos + ${Object.keys(PLATOS).length} platos`,
);
