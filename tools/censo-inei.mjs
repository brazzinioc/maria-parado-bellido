// Descarga los resultados del censo del INEI para el distrito y arma el CSV que usa /datos.
//
//   npm run censo                         → censo 2025 (por defecto)
//   npm run censo -- --anio 2035
//
// Fuente: la plataforma de resultados del INEI (censos2025.inei.gob.pe), la misma que
// consulta su tablero público. Trae los 95 indicadores del árbol temático "Población" y la
// pirámide de población para el distrito, la provincia de Cangallo, Ayacucho y el Perú.
//
// Escribe public/datos/censo-<año>-pomabamba-maria-parado-de-bellido-ayacucho.csv.
// La página lee las cifras de ese CSV (src/lib/censo.ts); los textos (hallazgos, titulares,
// preguntas) están en src/data/censo-<año>.json y hay que revisarlos a mano con cada censo.
// Si el INEI publica un censo nuevo en otra plataforma, cambia API más abajo.
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://censos2025.inei.gob.pe/api/v1";
const ARBOL_POBLACION = 346; // página "Población" del árbol temático del tablero
const AMBITOS = [
  { id: "9050204", nombre: "María Parado de Bellido (distrito)" },
  { id: "8050200", nombre: "Cangallo (provincia)" },
  { id: "7050000", nombre: "Ayacucho (departamento)" },
  { id: "1000000", nombre: "Perú" },
];

const args = process.argv.slice(2);
const anio = Number(args[args.indexOf("--anio") + 1] || 2025);
if (args.includes("--anio") && !Number.isInteger(anio)) throw new Error("Uso: --anio 2025");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const salida = join(root, `public/datos/censo-${anio}-pomabamba-maria-parado-de-bellido-ayacucho.csv`);

// El servidor del INEI corta conexiones de vez en cuando: se reintenta.
async function get(path) {
  for (let intento = 1; ; intento++) {
    try {
      const res = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      if (body.success === false) throw new Error(body.message);
      return body.data;
    } catch (error) {
      if (intento >= 5) throw new Error(`${path}: ${error.message}`);
      await new Promise((r) => setTimeout(r, 3000 * intento));
    }
  }
}

// Indicadores en el orden del tablero, con su tema (el nivel inmediatamente superior).
const arbol = await get(`/catalogo/arbol-tematico/pagina/${ARBOL_POBLACION}`);
const indicadores = [];
const vistos = new Set();
(function recorrer(nodos, tema) {
  for (const n of nodos ?? []) {
    if (n.idIndicador && !vistos.has(n.idIndicador)) {
      vistos.add(n.idIndicador);
      indicadores.push({ id: n.idIndicador, tema, nombre: n.nombTema.trim() });
    }
    recorrer(n.children, n.idIndicador ? tema : n.nombTema.trim());
  }
})(Array.isArray(arbol) ? arbol : [arbol], "");

const ids = indicadores.map((i) => i.id).join(",");
// Valor: entero si lo es, si no con un decimal. Porcentaje: siempre con un decimal.
const redondeo = (n) => (n === null || n === undefined ? "" : Number.isInteger(n) ? n : Math.round(n * 10) / 10);
const porcentaje = (n) => (n === null || n === undefined ? "" : n.toFixed(1));
const csv = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v);

const filas = [];
const valores = new Map(); // ámbito -> idIndicador -> dato
for (const a of AMBITOS) {
  const datos = await get(`/resultados/dashboard-kpis?idTiempo=${anio}&idGeografia=${a.id}&indicadores=${ids}`);
  if (!datos.length) throw new Error(`El INEI no tiene datos de ${anio} para ${a.nombre}.`);
  valores.set(a.id, new Map(datos.map((d) => [d.idIndicador, d])));
}

for (const ind of indicadores) {
  // Si ningún ámbito tiene el dato, el indicador no se publicó: se omite.
  if (!AMBITOS.some((a) => valores.get(a.id).get(ind.id)?.vAbsolutoSinFormt != null)) continue;
  for (const a of AMBITOS) {
    const d = valores.get(a.id).get(ind.id);
    // Celda vacía: el INEI no publica ese dato para el ámbito (p. ej., sin inmigrantes).
    filas.push([ind.tema, ind.nombre, a.nombre, redondeo(d?.vAbsolutoSinFormt), porcentaje(d?.vPorcentajeSinFormt)]);
  }
}

// Pirámide: personas por grupo de edad y sexo.
const piramides = [];
for (const a of AMBITOS) {
  const { historico } = await get(`/resultados/piramide-historico?idGeografia=${a.id}`);
  const censo = historico.find((h) => h.year === anio);
  if (!censo) throw new Error(`Sin pirámide ${anio} para ${a.nombre}.`);
  piramides.push({ ambito: a, grupos: censo.data });
}
const grupos = piramides[0].grupos.map((g) => g.ageRange);
for (const sexo of [["male", "hombres"], ["female", "mujeres"]]) {
  for (const edad of grupos) {
    for (const { ambito, grupos: datos } of piramides) {
      const g = datos.find((x) => x.ageRange === edad);
      filas.push(["Pirámide de población", `Población censada ${sexo[1]} de ${edad}`, ambito.nombre, redondeo(g?.[sexo[0]]), porcentaje(g?.[`${sexo[0]}Pct`])]);
    }
  }
}

// UTF-8 con BOM y fin de línea CRLF: Excel lo abre con tildes y eñes correctas.
const texto = [["tema", "indicador", "ambito", "valor", "porcentaje"], ...filas].map((f) => f.map(csv).join(",")).join("\r\n");
await mkdir(dirname(salida), { recursive: true });
await writeFile(salida, "﻿" + texto + "\r\n");

const total = valores.get(AMBITOS[0].id).get(52)?.vAbsolutoSinFormt;
console.log(`Censo ${anio}: ${filas.length / AMBITOS.length} indicadores (${grupos.length} grupos de edad), población del distrito ${total}.`);
console.log(`Escrito ${salida.replace(root + "/", "")}`);
console.log(`Siguiente paso: revisar los textos de src/data/censo-${anio}.json (hallazgos, titulares y preguntas).`);
