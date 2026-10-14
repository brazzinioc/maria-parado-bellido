/**
 * Créditos de las fotos que no son del proyecto (src/data/creditos.json).
 * Para acreditar una foto nueva basta con agregarla al JSON: la (i) sobre la foto
 * (FotoCredito) y la página /creditos/ la toman de ahí.
 */
import datos from "../data/creditos.json";

type Fuente = keyof typeof datos.fuentes;

export const fotosAcreditadas = datos.fotos.map((f) => ({
  ...f,
  credito: datos.fuentes[f.fuente as Fuente].credito,
}));

// Crédito de una foto por su ruta. Acepta URLs completas y variantes con ?query.
export function creditoDe(src?: string): string | undefined {
  if (!src) return undefined;
  const ruta = src.split(/[?#]/)[0];
  return fotosAcreditadas.find((f) => ruta === f.src || ruta.endsWith(f.src))?.credito;
}
