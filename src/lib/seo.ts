// Textos para buscadores y redes (título y descripción que se ven al compartir un enlace).

// Lugar que acompaña a cada título. «Ayacucho» va siempre: hay otras Pomabamba en el Perú.
export const LUGAR = "Pomabamba, Ayacucho";

// Google muestra unos 60 caracteres del título. Se usa la primera opción que cabe;
// si ninguna cabe, la más corta (la última), que igual nombra el lugar completo.
export function tituloCon(...opciones: string[]): string {
  return opciones.find((t) => t.length <= 60) ?? opciones[opciones.length - 1];
}

// Descripción de hasta `max` caracteres: termina en una oración completa si se puede
// y, si no, en una palabra completa con «…». Nunca corta una palabra a la mitad.
export function resumen(texto: string, max = 160): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max);
  const finOracion = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf(": "), corte.endsWith(".") ? corte.length - 1 : -1);
  if (finOracion >= max * 0.5) return limpio.slice(0, finOracion + 1).replace(/:$/, ".");
  return `${corte.slice(0, corte.lastIndexOf(" ")).replace(/[\s,;:.–-]+$/, "")}…`;
}
