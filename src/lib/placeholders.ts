import type { CommunityEvent, Festivity } from '../types';
import type { Dish } from './api';

// Ilustraciones que reemplazan a la foto mientras el CMS no tenga una real
// (public/images/placeholders, generadas con tools/generate-placeholders.mjs).
// El tipo se deduce del nombre o del tipo del registro.
const DIR = '/images/placeholders';

const FESTIVITY_RULES: [RegExp, string][] = [
  [/carnaval/, 'carnaval'],
  [/semana santa|ramos|pascua/, 'semana-santa'],
  [/virgen|mam(a|ita)|inmaculada/, 'virgen'],
  [/urihuana|[ñn]u[ñn]unhuaycco|huayllabamba|tucre/, 'comunidad'],
  [/aniversario|independencia|c[ií]vic/, 'civico'],
  [/todos los santos|difuntos/, 'difuntos'],
  [/navidad|ni[ñn]o dios/, 'navidad'],
];

export function festivityIllustration(f: Pick<Festivity, 'name' | 'slug'>): string {
  const text = `${f.name} ${f.slug}`.toLowerCase();
  const type = FESTIVITY_RULES.find(([re]) => re.test(text))?.[1] ?? 'procesion';
  return `${DIR}/fiesta-${type}.svg`;
}

export function festivityCoverImage(f: Festivity): string {
  return f.images?.[0] || festivityIllustration(f);
}

const EVENT_TYPE_ILLUSTRATION: Record<CommunityEvent['type'], string> = {
  faena: 'evento-faena',
  minka: 'evento-minka',
  asamblea: 'evento-asamblea',
  reunion: 'evento-asamblea',
  pollada: 'evento-pollada',
  aniversario: 'fiesta-civico',
  otro: 'evento-asamblea',
};

export function eventIllustration(e: Pick<CommunityEvent, 'type' | 'title'>): string {
  if (/feria|mercado|trueque/i.test(e.title)) return `${DIR}/evento-feria.svg`;
  return `${DIR}/${EVENT_TYPE_ILLUSTRATION[e.type] ?? 'evento-asamblea'}.svg`;
}

export function eventCoverImage(e: CommunityEvent): string {
  return e.images?.[0] || eventIllustration(e);
}

const DISH_RULES: [RegExp, string][] = [
  [/chicha|bebida|api\b|emoliente|refresco/, 'bebida'],
  [/caldo|sopa|mondongo|chupe|patachi|lawa|puchero/, 'sopa'],
  [/pachamanca|huatia|watia/, 'pachamanca'],
  [/queso|cachipa|leche/, 'queso'],
  [/trucha|pescado/, 'trucha'],
  [/picante|qapchi|kapchi|guiso|estofado/, 'guiso'],
];

export function dishIllustration(d: Pick<Dish, 'name' | 'slug'>): string {
  const text = `${d.name} ${d.slug}`.toLowerCase();
  const type = DISH_RULES.find(([re]) => re.test(text))?.[1] ?? 'general';
  return `${DIR}/plato-${type}.svg`;
}

export function dishCoverImage(d: Dish): string {
  return d.image || dishIllustration(d);
}
