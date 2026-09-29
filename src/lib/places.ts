import type { TouristPlace } from '../types';

const CATEGORY_LABELS: Record<TouristPlace['category'], string> = {
  natural: 'Paisaje natural',
  archaeological: 'Sitio arqueológico',
  historical: 'Sitio histórico',
  cultural: 'Sitio cultural',
};

export const PLACE_FALLBACK_IMAGE = '/images/default-photo.webp';

export function placeCategoryLabel(category: TouristPlace['category']): string {
  return CATEGORY_LABELS[category] ?? 'Lugar';
}

export function placeCoverImage(place: TouristPlace): string {
  return place.images?.[0] || PLACE_FALLBACK_IMAGE;
}

export function hasCoordinates(place: TouristPlace): boolean {
  return Boolean(place.location?.lat && place.location?.lng);
}
