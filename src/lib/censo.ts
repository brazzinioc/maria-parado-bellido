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
  const tiene = (indicador: string, ambito: Ambito, campo: keyof Fila = "valor") =>
    datos.get(`${indicador}|${AMBITOS[ambito]}`)?.[campo] != null;
  const dato = (indicador: string, ambito: Ambito, campo: keyof Fila): number => {
    const n = datos.get(`${indicador}|${AMBITOS[ambito]}`)?.[campo];
    if (n === null || n === undefined) throw new Error(`Censo ${anio}: sin ${campo} para «${indicador}» en ${AMBITOS[ambito]}.`);
    return n;
  };
  return { anio, datos, dato, tiene };
}
type Censo = ReturnType<typeof cargar>;

const anio = CENSO_ACTUAL.anio;
const csv = archivoDe(anio);
const actual = cargar(anio, `npm run censo -- --anio ${anio}`);
const { datos, dato } = actual;

// Censo anterior del distrito (solo distrito), para "¿Cómo hemos cambiado?".
const { anterior } = CENSO_ACTUAL.evolucion;
const previo = cargar(anterior.anio, `npm run censo:${anterior.anio}`);

// Porcentaje; con "complemento" se usa 100 menos el dato (p. ej., "no sabe leer" → "sabe leer").
const pct = (i: { inei: string; complemento?: boolean }, ambito: Ambito, fuente = dato) => {
  const p = fuente(i.inei, ambito, "porcentaje");
  return i.complemento ? Math.round((100 - p) * 10) / 10 : p;
};

const fmt = (n: number) => n.toLocaleString("en-US");

/*
 * Operaciones: cada porcentaje con su numerador y su denominador (el «universo»), para
 * mostrar en /datos de dónde sale cada cifra. El universo de cada indicador está en
 * censo-<año>.json (indicadoresUniverso). Su total se toma del CSV si el INEI lo publica,
 * o de la suma de indicadores que lo completan; si no, se deduce del propio porcentaje
 * (valor ÷ porcentaje × 100) y se marca como aproximado.
 */
type ClaveUniverso = keyof typeof CENSO_ACTUAL.universos;
const UNIVERSOS = CENSO_ACTUAL.universos as Record<string, { texto: string; nombre: string; inei?: string; suma?: string[]; nota?: string }>;
const UNIVERSO_DE = CENSO_ACTUAL.indicadoresUniverso as Record<string, ClaveUniverso>;

function totalUniverso(c: Censo, clave: string, ambito: Ambito): number | null {
  const u = UNIVERSOS[clave];
  if (u.inei && c.tiene(u.inei, ambito)) return c.dato(u.inei, ambito, "valor");
  if (u.suma && u.suma.every((i) => c.tiene(i, ambito))) return u.suma.reduce((t, i) => t + c.dato(i, ambito, "valor"), 0);
  return null;
}

export interface Operacion {
  valor: number;
  porcentaje: number;
  base: number;
  exacta: boolean;
  universo: string;
}

export function operacion(inei: string, ambito: Ambito = "distrito", c: Censo = actual): Operacion {
  const clave = UNIVERSO_DE[inei];
  if (!clave) throw new Error(`Falta el universo de «${inei}» en indicadoresUniverso.`);
  const valor = c.dato(inei, ambito, "valor");
  const porcentaje = c.dato(inei, ambito, "porcentaje");
  const total = totalUniverso(c, clave, ambito);
  const base = total ?? Math.round((valor * 100) / porcentaje);
  // El porcentaje del INEI viene con un decimal: la cuenta propia debe dar lo mismo.
  if (total !== null && Math.abs((valor / base) * 100 - porcentaje) > 0.051) {
    throw new Error(`Censo ${c.anio}: ${valor} ÷ ${base} no da ${porcentaje}% en «${inei}» (${AMBITOS[ambito]}).`);
  }
  return { valor, porcentaje, base, exacta: total !== null, universo: UNIVERSOS[clave].texto };
}

// "2,884 ÷ 3,173 × 100 = 90.9%". Con complemento: la parte que sí (base − valor).
export function formula(op: Operacion, complemento = false): string {
  const n = complemento ? op.base - op.valor : op.valor;
  const p = complemento ? Math.round((100 - op.porcentaje) * 10) / 10 : op.porcentaje;
  return `${fmt(n)} ÷ ${base(op)} × 100 = ${p.toFixed(1)}%`;
}

// Denominador para mostrar. Si se dedujo de un porcentaje con un decimal, solo sus cifras
// confiables: «≈3,173» en el distrito, «≈31.6 millones» en el Perú.
export function base(op: Pick<Operacion, "base" | "exacta">): string {
  if (op.exacta) return fmt(op.base);
  return op.base >= 1_000_000 ? `≈${(op.base / 1_000_000).toFixed(1)} millones` : `≈${fmt(op.base)}`;
}

const piramide = [...datos.keys()]
  .filter((k) => k.startsWith("Población censada hombres de ") && k.endsWith(`|${AMBITOS.distrito}`))
  .map((k) => k.slice("Población censada hombres de ".length, -`|${AMBITOS.distrito}`.length))
  .map((grupo) => ({
    edad: grupo.replace(" y más años", "+").replace(" años", ""),
    hombres: dato(`Población censada hombres de ${grupo}`, "distrito", "valor"),
    mujeres: dato(`Población censada mujeres de ${grupo}`, "distrito", "valor"),
  }));

// Edad mediana a partir de la pirámide: posición (N + 1) / 2 y grupo de 5 años donde cae.
const total = dato("Población censada", "distrito", "valor");
const posicionMedio = (total + 1) / 2;
const grupoDe = (posicion: number) => {
  let acumulado = 0;
  return piramide.find((g) => (acumulado += g.hombres + g.mujeres) >= posicion)!;
};
const medianaGrupo = grupoDe(Math.ceil(posicionMedio));
if (grupoDe(Math.floor(posicionMedio)) !== medianaGrupo) throw new Error("La mediana cae entre dos grupos de edad: revisar el texto.");
const rangoEdad = (edad: string) => edad.replace("-", " a ").replace("+", " y más");

// Si el total se dedujo de un porcentaje con un decimal (p ± 0.05), solo se sabe que está
// entre x ÷ (p + 0.05) × 100 y x ÷ (p − 0.05) × 100.
export function intervaloBase(op: Operacion) {
  return {
    min: Math.ceil((op.valor * 100) / (op.porcentaje + 0.05)),
    max: Math.floor((op.valor * 100) / (op.porcentaje - 0.05)),
  };
}

// Comprobaciones de consistencia: las partes deben sumar el todo en los dos censos.
// Si una falla, el build se detiene: los datos se descargaron mal o el INEI los cambió.
const comprobaciones = [actual, previo].flatMap((c) => {
  const v = (i: string) => c.dato(i, "distrito", "valor");
  const piramideDe = (sexo: string) =>
    [...c.datos.entries()]
      .filter(([k]) => k.startsWith(`Población censada ${sexo} de `) && k.endsWith(`|${AMBITOS.distrito}`))
      .reduce((t, [, f]) => t + (f.valor ?? 0), 0);
  const lista = [
    { texto: "hombres + mujeres = población censada", partes: [v("Población censada hombres"), v("Población censada mujeres")], todo: v("Población censada") },
    {
      texto: "0 a 14 + 15 a 59 + 60 y más = población censada",
      partes: [v("Población censada de 0 a 14 años"), v("Población censada de 15 a 59 años"), v("Población censada de 60 años y más")],
      todo: v("Población censada"),
    },
    { texto: "suma de los grupos de edad de los hombres en la pirámide = hombres", partes: [piramideDe("hombres")], todo: v("Población censada hombres") },
    { texto: "suma de los grupos de edad de las mujeres en la pirámide = mujeres", partes: [piramideDe("mujeres")], todo: v("Población censada mujeres") },
  ];
  if (c === actual) {
    lista.push({
      texto: "saben leer y escribir + no saben = población de 15 años y más",
      partes: [v("Tasa de alfabetismo de la población de 15 años y más"), v("Población censada en edad de trabajar de 15 años y más que no sabe leer ni escribir")],
      todo: totalUniverso(c, "pob15", "distrito")!,
    });
  }
  return lista.map((x) => {
    const suma = x.partes.reduce((a, b) => a + b, 0);
    if (suma !== x.todo) throw new Error(`Censo ${c.anio}: no cuadra «${x.texto}» (${suma} ≠ ${x.todo}).`);
    return { anio: c.anio, ...x, cuenta: `${x.partes.map(fmt).join(" + ")} = ${fmt(suma)}` };
  });
});

// Universos con su total en cada censo (exacto o deducido del primer indicador que lo usa).
const universos = Object.entries(UNIVERSOS).map(([clave, u]) => {
  const indicador = Object.keys(UNIVERSO_DE).find((i) => UNIVERSO_DE[i] === clave && actual.tiene(i, "distrito", "porcentaje"))!;
  const de = (c: Censo) => {
    const exacto = totalUniverso(c, clave, "distrito");
    if (exacto !== null) return { n: exacto, exacta: true };
    const i = Object.keys(UNIVERSO_DE).find((x) => UNIVERSO_DE[x] === clave && c.tiene(x, "distrito", "porcentaje"));
    return i ? { n: operacion(i, "distrito", c).base, exacta: false } : null;
  };
  return { clave, ...u, ejemplo: indicador, actual: de(actual), anterior: de(previo) };
});

export const censo = {
  ...CENSO_ACTUAL,
  universos,
  comprobaciones,
  metodo: {
    superficie: Math.round((total / dato("Densidad de la población censada", "distrito", "valor")) * 10) / 10,
    densidad: dato("Densidad de la población censada", "distrito", "valor"),
    mediana: { valor: dato("Edad mediana", "distrito", "valor"), posicion: posicionMedio, grupo: rangoEdad(medianaGrupo.edad) },
    viviendas: {
      censadas: dato("Viviendas particulares censadas", "distrito", "valor"),
      habitadas: dato("Viviendas particulares con ocupantes presentes que viven permanentemente", "distrito", "valor"),
      desocupadas: dato("Viviendas particulares desocupadas", "distrito", "valor"),
    },
  },
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
  cien: CENSO_ACTUAL.cien.map((c) => {
    const complemento = "complemento" in c && Boolean(c.complemento);
    const op = operacion(c.inei);
    return { ...c, valor: Math.round(pct(c, "distrito")), peru: Math.round(pct(c, "peru")), exacto: pct(c, "distrito"), calculo: formula(op, complemento), universo: op.universo };
  }),
  hallazgos: CENSO_ACTUAL.hallazgos.map((h) => ({
    ...h,
    evidencia: h.evidencia.map((e) => {
      const nombre = e.ambito === "peru" ? "Perú" : "Pomabamba";
      const ambito = e.ambito as Ambito;
      if ("indice" in e && e.indice) {
        const [num, den] = e.indice.map((i) => dato(i, ambito, "valor"));
        return { nombre, dato: fmt(dato(e.inei, ambito, "valor")), calculo: `${fmt(num)} ÷ ${fmt(den)} × 100 = ${dato(e.inei, ambito, "valor")}` };
      }
      if (!actual.tiene(e.inei, ambito, "porcentaje")) return { nombre, dato: fmt(dato(e.inei, ambito, "valor")), calculo: "" };
      const op = operacion(e.inei, ambito);
      return { nombre, dato: `${op.porcentaje.toFixed(1)}%`, calculo: `${formula(op)} (${op.universo})` };
    }),
  })),
  edades: {
    grupos: CENSO_ACTUAL.edades.grupos,
    ambitos: (["distrito", "peru"] as const).map((a) => ({
      nombre: a === "distrito" ? "Pomabamba" : "Perú",
      valores: CENSO_ACTUAL.edades.grupos.map((g) => dato(g.inei, a, "porcentaje")),
    })),
    calculos: CENSO_ACTUAL.edades.grupos.map((g) => ({ etiqueta: g.etiqueta, calculo: formula(operacion(g.inei)) })),
  },
  envejecimiento: CENSO_ACTUAL.envejecimiento.map((e) => {
    const campo = e.campo as keyof Fila;
    const calculo =
      campo === "porcentaje"
        ? `${formula(operacion(e.inei))} (${operacion(e.inei).universo})`
        : `${fmt(dato("Población censada de 60 años y más", "distrito", "valor"))} personas de 60 años y más ÷ ${fmt(dato("Población censada de 0 a 14 años", "distrito", "valor"))} de 0 a 14 años × 100 = ${dato(e.inei, "distrito", "valor")}`;
    return { ...e, distrito: dato(e.inei, "distrito", campo), peru: dato(e.inei, "peru", campo), calculo };
  }),
  evolucion: {
    ...CENSO_ACTUAL.evolucion,
    anterior: { ...anterior, csv: archivoDe(anterior.anio), total: previo.dato("Población censada", "distrito", "valor") },
    indicadores: CENSO_ACTUAL.evolucion.indicadores.map((i) => ({
      ...i,
      antes: pct(i, "distrito", previo.dato),
      ahora: pct(i, "distrito"),
      calculoAntes: formula(operacion(i.inei, "distrito", previo), "complemento" in i && Boolean(i.complemento)),
      calculoAhora: formula(operacion(i.inei), "complemento" in i && Boolean(i.complemento)),
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
      calculo: formula(operacion(f.inei), "complemento" in f && Boolean(f.complemento)),
      universo: operacion(f.inei).universo,
    })),
  })),
};
