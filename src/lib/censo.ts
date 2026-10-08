/**
 * Censo del distrito para /datos.
 *
 * Las cifras salen del CSV que genera tools/censo-inei.mjs (public/datos/censo-<año>-….csv);
 * src/data/censo-<año>.json aporta los textos y el nombre exacto de cada indicador del INEI.
 * Para un censo nuevo: correr el script con --anio, copiar el JSON con el año nuevo, revisar
 * sus textos y cambiar CENSO_ACTUAL. Si falta un indicador en el CSV, el build se detiene.
 * El censo anterior (2017) sale de REDATAM: tools/censo-2017-redatam.mjs.
 */
import textos from "../data/censo-2025.json";

const CENSO_ACTUAL = textos;

const archivos = import.meta.glob<string>("/public/datos/censo-*.csv", { query: "?raw", import: "default", eager: true });

const AMBITOS = {
  distrito: "María Parado de Bellido (distrito)",
  cangallo: "Cangallo (provincia)",
  ayacucho: "Ayacucho (departamento)",
  peru: "Perú",
} as const;
type Ambito = keyof typeof AMBITOS;

interface Fila {
  valor: number | null;
  porcentaje: number | null;
}

// CSV simple del INEI: comillas solo en campos con comas.
function parse(texto: string): string[][] {
  return texto
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((linea) => [...linea.matchAll(/("(?:[^"]|"")*"|[^,]*)(?:,|$)/g)].map((m) => m[1].replace(/^"|"$/g, "").replace(/""/g, '"')).slice(0, 5));
}

const archivoDe = (anio: number) => `/datos/censo-${anio}-pomabamba-maria-parado-de-bellido-ayacucho.csv`;

// Cifras de un censo: indicador|ámbito -> valor y porcentaje.
function cargar(anio: number, comando: string) {
  const raw = archivos[`/public${archivoDe(anio)}`];
  if (!raw) throw new Error(`Falta ${archivoDe(anio)}. Genéralo con: ${comando}`);
  const datos = new Map<string, Fila>();
  for (const [, indicador, ambito, valor, porcentaje] of parse(raw).slice(1)) {
    datos.set(`${indicador}|${ambito}`, {
      valor: valor === "" ? null : Number(valor),
      porcentaje: porcentaje === "" ? null : Number(porcentaje),
    });
  }
  const dato = (indicador: string, ambito: Ambito, campo: keyof Fila): number => {
    const n = datos.get(`${indicador}|${AMBITOS[ambito]}`)?.[campo];
    if (n === null || n === undefined) throw new Error(`Censo ${anio}: sin ${campo} para «${indicador}» en ${AMBITOS[ambito]}.`);
    return n;
  };
  return { datos, dato };
}

const anio = CENSO_ACTUAL.anio;
const csv = archivoDe(anio);
const { datos, dato } = cargar(anio, `npm run censo -- --anio ${anio}`);

// Censo anterior del distrito (solo distrito), para "¿Cómo hemos cambiado?".
const { anterior } = CENSO_ACTUAL.evolucion;
const previo = cargar(anterior.anio, `npm run censo:${anterior.anio}`);

// Porcentaje; con "complemento" se usa 100 menos el dato (p. ej., "no sabe leer" → "sabe leer").
const pct = (i: { inei: string; complemento?: boolean }, ambito: Ambito, fuente = dato) => {
  const p = fuente(i.inei, ambito, "porcentaje");
  return i.complemento ? Math.round((100 - p) * 10) / 10 : p;
};

const fmt = (n: number) => n.toLocaleString("en-US");

const piramide = [...datos.keys()]
  .filter((k) => k.startsWith("Población censada hombres de ") && k.endsWith(`|${AMBITOS.distrito}`))
  .map((k) => k.slice("Población censada hombres de ".length, -`|${AMBITOS.distrito}`.length))
  .map((grupo) => ({
    edad: grupo.replace(" y más años", "+").replace(" años", ""),
    hombres: dato(`Población censada hombres de ${grupo}`, "distrito", "valor"),
    mujeres: dato(`Población censada mujeres de ${grupo}`, "distrito", "valor"),
  }));

export const censo = {
  ...CENSO_ACTUAL,
  csv,
  poblacion: {
    total: dato("Población censada", "distrito", "valor"),
    hombres: dato("Población censada hombres", "distrito", "valor"),
    mujeres: dato("Población censada mujeres", "distrito", "valor"),
  },
  // Número de indicadores del CSV (sin contar la pirámide), para el texto de descarga.
  indicadores: new Set([...datos.keys()].filter((k) => !k.startsWith("Población censada hombres de ") && !k.startsWith("Población censada mujeres de ")).map((k) => k.split("|")[0])).size,
  resumen: CENSO_ACTUAL.resumen.map((r) => {
    const v = dato(r.inei, "distrito", "valor");
    const peru = "conPeru" in r && r.conPeru ? ` (Perú: ${fmt(dato(r.inei, "peru", "valor"))})` : "";
    return { ...r, valor: `${fmt(v)}${"sufijo" in r ? r.sufijo : ""}`, etiqueta: `${r.etiqueta}${peru}` };
  }),
  piramide,
  cien: CENSO_ACTUAL.cien.map((c) => ({ ...c, valor: Math.round(pct(c, "distrito")), peru: Math.round(pct(c, "peru")) })),
  edades: {
    grupos: CENSO_ACTUAL.edades.grupos,
    ambitos: (["distrito", "peru"] as const).map((a) => ({
      nombre: a === "distrito" ? "Pomabamba" : "Perú",
      valores: CENSO_ACTUAL.edades.grupos.map((g) => dato(g.inei, a, "porcentaje")),
    })),
  },
  envejecimiento: CENSO_ACTUAL.envejecimiento.map((e) => {
    const campo = e.campo as keyof Fila;
    return { ...e, distrito: dato(e.inei, "distrito", campo), peru: dato(e.inei, "peru", campo) };
  }),
  evolucion: {
    ...CENSO_ACTUAL.evolucion,
    anterior: { ...anterior, csv: archivoDe(anterior.anio), total: previo.dato("Población censada", "distrito", "valor") },
    indicadores: CENSO_ACTUAL.evolucion.indicadores.map((i) => ({
      ...i,
      antes: pct(i, "distrito", previo.dato),
      ahora: pct(i, "distrito"),
    })),
  },
  comparativo: CENSO_ACTUAL.comparativo.map((g) => ({
    ...g,
    filas: g.filas.map((f) => ({
      ...f,
      distrito: pct(f, "distrito"),
      cangallo: pct(f, "cangallo"),
      ayacucho: pct(f, "ayacucho"),
      peru: pct(f, "peru"),
    })),
  })),
};
