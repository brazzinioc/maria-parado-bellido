import type { TouristPlace } from '../types';

const CATEGORY_LABELS: Record<TouristPlace['category'], string> = {
  natural: 'Paisaje natural',
  archaeological: 'Sitio arqueológico',
  historical: 'Sitio histórico',
  cultural: 'Sitio cultural',
};


// Ilustración que reemplaza a la foto mientras el lugar no tenga una real
// (public/images/placeholders, generadas con tools/generate-placeholders.mjs).
// El tipo se deduce del nombre, slug y ubicación; si no hay pistas, de la categoría.
type Illustration =
  | 'montana' | 'mirador' | 'rio' | 'quebrada' | 'agua' | 'humedal'
  | 'roca' | 'arqueologico' | 'templo' | 'historico';

const ILLUSTRATION_RULES: [RegExp, Illustration][] = [
  [/templo|iglesia|capilla/, 'templo'],
  [/termal|manantial|puquio/, 'agua'],
  [/mojadal|humedal|bofedal|laguna|qocha|cocha/, 'humedal'],
  [/\br[ií]o\b|valle/, 'rio'],
  [/quebrada|kuchu|huayc?c?o/, 'quebrada'],
  [/mirador/, 'mirador'],
  [/formaci[oó]n (rocosa|natural)|rumi\b/, 'roca'],
];

export function placeIllustration(place: TouristPlace): string {
  let type: Illustration;
  if (place.category === 'archaeological') type = 'arqueologico';
  else if (place.category === 'historical') type = 'historico';
  else {
    const hints = `${place.name} ${place.slug} ${place.location?.name ?? ''}`.toLowerCase();
    // La descripción solo se usa para lo que el nombre no suele decir (rocas, aguas termales).
    const text = `${hints} ${/formaci[oó]n (rocosa|natural)|termal/.test(place.description?.toLowerCase() ?? '') ? place.description.toLowerCase() : ''}`;
    type = ILLUSTRATION_RULES.find(([re]) => re.test(text))?.[1] ?? (place.category === 'cultural' ? 'templo' : 'montana');
  }
  return `/images/placeholders/lugar-${type}.svg`;
}

export function placeCategoryLabel(category: TouristPlace['category']): string {
  return CATEGORY_LABELS[category] ?? 'Lugar';
}

export function placeCoverImage(place: TouristPlace): string {
  return place.images?.[0] || placeIllustration(place);
}

export function hasCoordinates(place: TouristPlace): boolean {
  return Boolean(place.location?.lat && place.location?.lng);
}
