// Contenido editorial (experiencias, planifica tu visita, galería).
// Primero intenta leer del CMS; si la tabla aún no existe o no hay registros
// publicados, usa los JSON de src/data como respaldo. Así la segunda iteración
// solo necesita crear las tablas en Supabase, sin tocar las páginas.
import { supabase, mediaUrl } from './supabase';
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
  /** Segunda foto, bajo el texto de "La experiencia". */
  secondaryImage?: { src: string; alt: string; caption?: string; position?: string };
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
  /** Crédito cargado en el CMS (fotos que no son del proyecto). */
  credit?: { author: string; url?: string };
}

// Con menos fotos la galería de inicio queda pobre: se usa la de respaldo.
const MIN_GALLERY_ITEMS = 3;

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

// Galería del CMS (t_gallery). Las columnas van explícitas: anon no puede leer
// created_by/updated_by, así que un select('*') fallaría.
async function fetchGallery(): Promise<GalleryItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('t_gallery')
      .select('alt_text, caption, credit_author, credit_url, t_media ( file_path )')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching gallery:', error.message);
      return null;
    }
    return (data ?? []).flatMap((row: any) => {
      const image = mediaUrl(row.t_media?.file_path);
      if (!image) return [];
      return [{
        image,
        alt: row.alt_text,
        caption: row.caption ?? undefined,
        credit: row.credit_author
          ? { author: row.credit_author, url: /^https?:\/\//.test(row.credit_url ?? '') ? row.credit_url : undefined }
          : undefined,
      }];
    });
  } catch {
    return null;
  }
}

export async function getGallery(): Promise<GalleryItem[]> {
  const items = await fetchGallery();
  return items && items.length >= MIN_GALLERY_ITEMS ? items : (galeriaFallback.items as GalleryItem[]);
}
