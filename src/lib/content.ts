// Contenido editorial (experiencias, planifica tu visita, galería).
// Primero intenta leer del CMS; si la tabla aún no existe o no hay registros
// publicados, usa los JSON de src/data como respaldo. Así la segunda iteración
// solo necesita crear las tablas en Supabase, sin tocar las páginas.
import { supabase } from './supabase';
import experienciasFallback from '../data/experiencias.json';
import planificaFallback from '../data/planifica.json';
import galeriaFallback from '../data/galeria.json';

export interface ExperienceStat {
  label: string;
  value: string;
}

export interface Experience {
  slug: string;
  title: string;
  eyebrow: string;
  tagline: string;
  summary: string;
  description: string[];
  image: string;
  imageAlt: string;
  imagePosition?: string;
  /** Titular de la sección "La experiencia" (distinto del resumen del índice). */
  headline?: string;
  stats: ExperienceStat[];
  highlights: string[];
  /** Condición física o experiencia previa que se necesita. */
  level?: string;
  /** Qué vivir según la temporada: labores de la chacra y fiestas del periodo. */
  calendar?: { months: string; farm: string; festivities: string[] }[];
  packing?: { required: string[]; recommended: string[] };
  safety?: string[];
  faqs?: { question: string; answer: string }[];
  /** Slugs de t_places donde se vive la experiencia, en orden de prioridad. */
  places?: string[];
  seo: { title: string; description: string; keywords: string[] };
}

export interface VisitInfo {
  intro: string;
  highlights: ExperienceStat[];
  routes: { title: string; steps: string[] }[];
  seasons: { name: string; months: string; description: string }[];
  packing: string[];
  faqs: { question: string; answer: string }[];
  contact: { title: string; description: string; whatsappMessage: string };
}

export interface GalleryItem {
  image: string;
  alt: string;
  caption?: string;
}

// Lee `content` (jsonb) de los registros publicados de una tabla del CMS.
// Devuelve null ante cualquier error para que se use el respaldo.
async function fetchPublishedContent<T>(table: string): Promise<T[] | null> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('content')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    if (error || !data?.length) return null;
    return data.map((row: any) => row.content as T);
  } catch {
    return null;
  }
}

let experiencesCache: Experience[] | null = null;

export async function getExperiences(): Promise<Experience[]> {
  if (experiencesCache) return experiencesCache;
  experiencesCache =
    (await fetchPublishedContent<Experience>('t_experiences')) ??
    (experienciasFallback.items as Experience[]);
  return experiencesCache;
}

export async function getExperienceBySlug(slug: string): Promise<Experience | undefined> {
  return (await getExperiences()).find((e) => e.slug === slug);
}

export async function getVisitInfo(): Promise<VisitInfo> {
  const rows = await fetchPublishedContent<VisitInfo>('t_visit_info');
  return rows?.[0] ?? (planificaFallback as VisitInfo);
}

export async function getGallery(): Promise<GalleryItem[]> {
  return (
    (await fetchPublishedContent<GalleryItem>('t_gallery')) ??
    (galeriaFallback.items as GalleryItem[])
  );
}
