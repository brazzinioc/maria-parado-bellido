// Censo 2017 del distrito, desde REDATAM del INEI, con los mismos nombres de indicador que el CSV de 2025.
//
//   npm run censo:2017
//
// El censo 2017 no está en la plataforma del censo 2025: sus datos por distrito solo se consultan
// en REDATAM (censos2017.inei.gob.pe/redatam). Este script le envía un programa REDATAM
// (el mismo que se puede pegar en "Programa Redatam" de esa web), lee las tablas que devuelve
// y escribe public/datos/censo-2017-pomabamba-maria-parado-de-bellido-ayacucho.csv.
//
// Ojo al comparar: 2017 fue un censo "de hecho" (cada persona donde estaba el día del censo) y
// 2025 uno "de derecho" (donde vive habitualmente). Quien estaba fuera ese domingo de 2017 no
// se contó en el distrito.
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SERVIDOR = "https://censos2017.inei.gob.pe/bininei";
const DISTRITO = "050204";
const AMBITO = "María Parado de Bellido (distrito)";

const PROGRAMA = `RUNDEF Job
    SELECTION INLINE,
     DISTRITO ${DISTRITO}

TABLE EDAD AS CROSSTABS OF POBLACIO.EDQUINQ BY POBLACIO.C5P2
TABLE LENGUA AS FREQUENCY OF POBLACIO.C5P11
TABLE LEER AS CROSSTABS OF POBLACIO.P03GQ15M BY POBLACIO.C5P12
TABLE NIVEL AS CROSSTABS OF POBLACIO.P03GQ15M BY POBLACIO.C5P13NIV
TABLE SECUNDARIA AS CROSSTABS OF POBLACIO.P03GQ15M BY POBLACIO.C5P13ANIOS
TABLE AGUA AS CROSSTABS OF VIVIENDA.C2P2 BY VIVIENDA.C2P6
TABLE DESAGUE AS CROSSTABS OF VIVIENDA.C2P2 BY VIVIENDA.C2P10
TABLE LUZ AS CROSSTABS OF VIVIENDA.C2P2 BY VIVIENDA.C2P11
TABLE INTERNET AS FREQUENCY OF HOGAR.C3P213
TABLE COCINA AS CROSSTABS OF HOGAR.C3P11 BY HOGAR.C3P12
TABLE GASNATURAL AS FREQUENCY OF HOGAR.C3P13
TABLE TIPOHOGAR AS FREQUENCY OF HOGAR.TIPOHRES
`;

async function pedir(url, opciones = {}) {
  for (let intento = 1; ; intento++) {
    try {
      const res = await fetch(url, { ...opciones, signal: AbortSignal.timeout(180000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (error) {
      if (intento >= 4) throw new Error(`${url}: ${error.message}`);
      await new Promise((r) => setTimeout(r, 4000 * intento));
    }
  }
}

const texto = (html) =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&([a-z]+);/gi, (m, e) => ({ aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ", uuml: "ü", Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", Ntilde: "Ñ", amp: "&" })[e] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();

// Cada tabla de salida: filas de celdas no vacías.
function filas(html) {
  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((tr) => [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => texto(c[1])).filter(Boolean))
    .filter((f) => f.length);
}
const num = (s) => (s === "-" ? 0 : Number(s.replace(/\s/g, "").replace("%", "").replace(",", ".")));

// 1) Ejecutar el programa.
const cuerpo = new URLSearchParams({ MAIN: "WebServerMain.inl", BASE: "CPV2017DI", LANG: "esp", CODIGO: "XXUSUARIOXX", ITEM: "PROGRED", MODE: "RUN", CMDSET: PROGRAMA, Submit: "Ejecutar" });
const salida = await pedir(`${SERVIDOR}/RpWebStats.exe/CmdSet?`, { method: "POST", body: cuerpo });
if (/Exception/.test(salida)) throw new Error(`REDATAM devolvió un error:\n${texto(salida).slice(0, 600)}`);
const enlaces = [...salida.matchAll(/src="([^"]*Text\?LFN=[^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
const nombres = [...PROGRAMA.matchAll(/^TABLE (\w+)/gm)].map((m) => m[1]);
if (enlaces.length !== nombres.length) throw new Error(`Se esperaban ${nombres.length} tablas y llegaron ${enlaces.length}.`);
const tablas = Object.fromEntries(await Promise.all(nombres.map(async (n, i) => [n, filas(await pedir(enlaces[i]))])));

// Fila de una tabla por su rótulo (primera celda) y el valor de la columna indicada.
const fila = (t, rotulo) => {
  const f = tablas[t].find((x) => x[0].replace(/\s+/g, " ") === rotulo);
  if (!f) throw new Error(`Tabla ${t}: no está la fila «${rotulo}».`);
  return f.slice(1).map(num);
};
const encabezado = (t) => tablas[t].find((f) => f.at(-1) === "Total" && f.length > 2);
const columna = (t, nombre) => {
  const i = encabezado(t).indexOf(nombre);
  if (i < 0) throw new Error(`Tabla ${t}: no está la columna «${nombre}».`);
  return i;
};

// 2) Calcular los indicadores.
const edad = tablas.EDAD.filter((f) => /^De \d/.test(f[0])).map((f) => ({ rotulo: f[0].replace(/\s+/g, " "), h: num(f[1]), m: num(f[2]) }));
const [hombres, mujeres, total] = fila("EDAD", "Total");
const rango = (desde, hasta) => edad.filter((g) => { const a = Number(g.rotulo.match(/\d+/)[0]); return a >= desde && a <= hasta; }).reduce((s, g) => s + g.h + g.m, 0);
const ninos = rango(0, 14), adultos = rango(15, 59), mayores = rango(60, 200);

const lenguaTotal = fila("LENGUA", "Total")[0];
const quechua = fila("LENGUA", "Quechua")[0];
const [, noLee, pob15] = fila("LEER", "Total");
const niveles = fila("NIVEL", "Total"); // Sin nivel, Primaria, Secundaria, Superiores…, Total
const superior = niveles.slice(3, -1).reduce((a, b) => a + b, 0);
const quintoSec = fila("SECUNDARIA", "Total")[columna("SECUNDARIA", "Quinto año")];
const viv = (t, cols) => { const f = fila(t, "Ocupada, con personas presentes"); return { n: cols.reduce((s, c) => s + f[columna(t, c)], 0), total: f.at(-1) }; };
const agua = viv("AGUA", ["Red pública dentro de la vivienda", "Red pública fuera de la vivienda, pero dentro de la edificación"]);
const desague = viv("DESAGUE", ["Red pública de desagüe dentro de la vivienda", "Red pública de desagüe fuera de la vivienda, pero dentro de la edificación"]);
const luz = viv("LUZ", ["Sí tiene alumbrado eléctrico"]);
const hogares = fila("INTERNET", "Total")[0];
const internet = fila("INTERNET", "Sí tiene conexión a internet")[0];
const gasNatural = tablas.GASNATURAL.find((f) => /^Sí/.test(f[0]));
if (gasNatural && num(gasNatural[1]) > 0) throw new Error("Hay hogares con gas natural: súmalos a la energía limpia.");
const sinElecNiGas = fila("COCINA", "No usa electricidad")[0];
const unipersonales = fila("TIPOHOGAR", "Unipersonal")[0];

const pct = (n, d) => (Math.round((n / d) * 1000) / 10).toFixed(1);
const r = [];
const add = (tema, indicador, valor, porcentaje = "") => r.push([tema, indicador, AMBITO, valor, porcentaje]);
add("Demográficos", "Población censada", total, "100.0");
add("Demográficos", "Población censada hombres", hombres, pct(hombres, total));
add("Demográficos", "Población censada mujeres", mujeres, pct(mujeres, total));
add("Demográficos", "Población censada de 0 a 14 años", ninos, pct(ninos, total));
add("Demográficos", "Población censada de 15 a 59 años", adultos, pct(adultos, total));
add("Demográficos", "Población censada de 60 años y más", mayores, pct(mayores, total));
add("Demográficos", "Índice de envejecimiento", Math.round((mayores / ninos) * 1000) / 10);
add("Educación", "Población de 15 años y más con secundaria completa u otro nivel mayor alcanzado", quintoSec + superior, pct(quintoSec + superior, pob15));
add("Etnicidad", "Población censada de 3 años y más que aprendió a hablar quechua en su niñez", quechua, pct(quechua, lenguaTotal));
add("Población en edad de trabajar", "Población censada en edad de trabajar de 15 años y más que no sabe leer ni escribir", noLee, pct(noLee, pob15));
add("Servicios básicos de la vivienda", "Viviendas particulares con ocupantes presentes que viven permanentemente con abastecimiento de agua por red pública", agua.n, pct(agua.n, agua.total));
add("Servicios básicos de la vivienda", "Viviendas particulares con ocupantes presentes que viven permanentemente con servicio higiénico conectado a red pública", desague.n, pct(desague.n, desague.total));
add("Servicios básicos de la vivienda", "Viviendas particulares con ocupantes presentes que viven permanentemente con suministro de energía eléctrica por red pública", luz.n, pct(luz.n, luz.total));
add("Características del hogar", "Hogares censados", hogares, "100.0");
add("Características del hogar", "Hogares que utilizan energía o combustible limpios para cocinar", hogares - sinElecNiGas, pct(hogares - sinElecNiGas, hogares));
add("Composición del hogar", "Porcentaje de hogares unipersonales", unipersonales, pct(unipersonales, hogares));
add("Equipamiento del hogar", "Hogares que tienen conexión a internet", internet, pct(internet, hogares));

// Pirámide con los mismos 18 grupos que el censo 2025 (85 y más agrupado).
const grupos = edad.reduce((acc, g) => {
  const a = Number(g.rotulo.match(/\d+/)[0]);
  const clave = a >= 85 ? "85 y más años" : `${a}-${a + 4} años`;
  const x = acc.get(clave) ?? { h: 0, m: 0 };
  acc.set(clave, { h: x.h + g.h, m: x.m + g.m });
  return acc;
}, new Map());
for (const [sexo, k] of [["hombres", "h"], ["mujeres", "m"]]) {
  for (const [clave, g] of grupos) add("Pirámide de población", `Población censada ${sexo} de ${clave}`, g[k], pct(g[k], total));
}

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const archivo = join(raiz, "public/datos/censo-2017-pomabamba-maria-parado-de-bellido-ayacucho.csv");
const csv = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v);
await writeFile(archivo, "﻿" + [["tema", "indicador", "ambito", "valor", "porcentaje"], ...r].map((f) => f.map(csv).join(",")).join("\r\n") + "\r\n");
console.log(`Censo 2017: ${total} personas censadas en el distrito (${hombres} hombres, ${mujeres} mujeres).`);
console.log(`Escrito ${archivo.replace(raiz + "/", "")}`);
