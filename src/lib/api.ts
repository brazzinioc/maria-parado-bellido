import type {
  Tour,
  Festivity,
  TouristPlace,
  CommunityEvent,
  Business,
} from '../types';
import { supabase, mediaUrl } from './supabase';

// Cache en memoria durante el build (evita llamadas duplicadas por pagina)
let toursCache: Tour[] | null = null;
let festivitiesCache: Festivity[] | null = null;

// ---------------------------------------------------------------------------
// Helpers de mapeo (fila de Supabase -> tipo del sitio)
// ---------------------------------------------------------------------------

// Imagenes que vienen del stored procedure como objetos { file_path, ... }
function mapSpImages(arr: unknown): string[] {
  return ((arr as { file_path?: string }[] | null) ?? [])
    .map((im) => mediaUrl(im.file_path))
    .filter((u): u is string => Boolean(u));
}

// Imagenes que vienen de una tabla junction: { sort_order, t_media: { file_path } }
function mapJunctionImages(arr: unknown): string[] {
  return ((arr as { sort_order: number; t_media: { file_path?: string } | null }[] | null) ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => mediaUrl(r.t_media?.file_path))
    .filter((u): u is string => Boolean(u));
}

function mapTourFromDB(t: any): Tour {
  return {
    id: t.id,
    title: t.title,
    slug: t.slug,
    summary: t.summary,
    description: t.description,
    duration_hours: Number(t.duration_hours),
    price: Number(t.price),
    currency: t.currency ?? 'PEN',
    dates: t.dates ?? undefined,
    locations: (t.locations ?? []).map((l: any) => ({
      name: l.name,
      lat: Number(l.lat),
      lng: Number(l.lng),
    })),
    guide: t.guide
      ? {
          id: t.guide.id,
          name: t.guide.name,
          phone: t.guide.phone ?? '',
          email: t.guide.email ?? undefined,
          bio: t.guide.bio ?? undefined,
          image: mediaUrl(t.guide.image_path),
        }
      : { id: '', name: 'Guía por asignar', phone: '' },
    images: mapSpImages(t.images),
    difficulty: t.difficulty ?? undefined,
    max_participants: t.max_participants ?? undefined,
    experience: t.experience ?? undefined,
  };
}

function mapFestivityFromDB(f: any): Festivity {
  return {
    id: f.id,
    name: f.name,
    slug: f.slug,
    description: f.description,
    start_date: f.start_date,
    end_date: f.end_date,
    place: {
      name: f.location_name ?? '',
      lat: Number(f.location_lat ?? 0),
      lng: Number(f.location_lng ?? 0),
    },
    cargontes: (f.cargontes ?? []).map((c: any) => ({
      name: c.name,
      role: c.role,
      notes: c.notes ?? undefined,
    })),
    images: mapSpImages(f.images),
    schedule: (f.schedule ?? []).map((s: any) => ({
      date: s.date,
      activity: s.activity,
      location: s.location,
    })),
  };
}

// ---------------------------------------------------------------------------
// Tours y Festividades (via stored procedures del CMS)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Ajustes del sitio (CMS → Ajustes → "Precios en el sitio")
// ---------------------------------------------------------------------------

export interface SiteSettings {
  /** false: no se muestran precios; el pago es un aporte voluntario. */
  showPrices: boolean;
}

let siteSettingsCache: SiteSettings | null = null;

// Se lee de t_page_content (page_key 'site_settings'). Si falta o falla, no se muestran
// precios: es la opción segura mientras el sitio está en modo aporte voluntario.
export async function fetchSiteSettings(): Promise<SiteSettings> {
  if (siteSettingsCache) return siteSettingsCache;
  const { data, error } = await supabase
    .from('t_page_content')
    .select('content')
    .eq('page_key', 'site_settings')
    .maybeSingle();
  if (error) console.error('Error fetching site settings:', error);
  const content = (data?.content ?? {}) as { show_prices?: unknown };
  siteSettingsCache = { showPrices: content.show_prices === true };
  return siteSettingsCache;
}

export async function fetchTours(): Promise<Tour[]> {
  if (toursCache) return toursCache;

  try {
    const { data, error } = await supabase.rpc('sp_get_tours', {
      p_published_only: true,
    });
    if (error) throw error;

    const tours = ((data as any[]) ?? []).map(mapTourFromDB);
    toursCache = tours;
    return tours;
  } catch (error) {
    console.error('Error fetching tours, usando fallback:', error);
    return getFallbackTours();
  }
}

export async function fetchFestivities(): Promise<Festivity[]> {
  if (festivitiesCache) return festivitiesCache;

  try {
    const { data, error } = await supabase.rpc('sp_get_festivities', {
      p_published_only: true,
    });
    if (error) throw error;

    const festivities = ((data as any[]) ?? []).map(mapFestivityFromDB);
    festivitiesCache = festivities;
    return festivities;
  } catch (error) {
    // Sin datos de ejemplo: las festividades salen siempre del CMS.
    console.error('Error fetching festivities:', error);
    return [];
  }
}

export async function fetchTourById(id: string): Promise<Tour | null> {
  const tours = await fetchTours();
  return tours.find((tour) => tour.id === id) || null;
}

export async function fetchTourBySlug(slug: string): Promise<Tour | null> {
  try {
    const { data, error } = await supabase.rpc('sp_get_tour_by_slug', {
      p_slug: slug,
    });
    if (error) throw error;
    return data ? mapTourFromDB(data) : null;
  } catch (error) {
    console.error('Error fetching tour by slug, usando fallback:', error);
    const tours = await fetchTours();
    return tours.find((tour) => tour.slug === slug) || null;
  }
}

export async function fetchFestivityById(id: string): Promise<Festivity | null> {
  const festivities = await fetchFestivities();
  return festivities.find((festivity) => festivity.id === id) || null;
}

export async function fetchFestivityBySlug(slug: string): Promise<Festivity | null> {
  try {
    const { data, error } = await supabase.rpc('sp_get_festivity_by_slug', {
      p_slug: slug,
    });
    if (error) throw error;
    return data ? mapFestivityFromDB(data) : null;
  } catch (error) {
    console.error('Error fetching festivity by slug:', error);
    const festivities = await fetchFestivities();
    return festivities.find((festivity) => festivity.slug === slug) || null;
  }
}

// ---------------------------------------------------------------------------
// Entidades nuevas (consulta directa a tablas, filtradas por is_published)
// ---------------------------------------------------------------------------

export async function fetchPlaces(): Promise<TouristPlace[]> {
  const { data, error } = await supabase
    .from('t_places')
    .select('*, t_place_images ( sort_order, t_media ( file_path ) )')
    .eq('is_published', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching places:', error);
    return [];
  }

  return (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    category: p.category,
    location: {
      name: p.location_name ?? '',
      lat: Number(p.location_lat ?? 0),
      lng: Number(p.location_lng ?? 0),
    },
    images: mapJunctionImages(p.t_place_images),
    howToGetThere: p.how_to_get_there ?? undefined,
    bestTimeToVisit: p.best_time_to_visit ?? undefined,
    entryFee: p.entry_fee != null ? Number(p.entry_fee) : undefined,
    currency: p.currency ?? undefined,
  }));
}

export async function fetchEvents(): Promise<CommunityEvent[]> {
  const { data, error } = await supabase
    .from('t_events')
    .select('*, t_event_images ( sort_order, t_media ( file_path ) )')
    .eq('is_published', true)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return (data ?? []).map((e: any) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    type: e.type,
    description: e.description,
    date: e.date,
    time: e.time ?? undefined,
    location: {
      name: e.location_name ?? '',
      lat: Number(e.location_lat ?? 0),
      lng: Number(e.location_lng ?? 0),
    },
    organizer: e.organizer ?? undefined,
    isRecurring: e.is_recurring,
    recurrencePattern: e.recurrence_pattern ?? undefined,
    images: mapJunctionImages(e.t_event_images),
  }));
}

export async function fetchBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase
    .from('t_businesses')
    .select('*, t_business_images ( sort_order, t_media ( file_path ) )')
    .eq('is_published', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching businesses:', error);
    return [];
  }

  return (data ?? []).map((b: any) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    category: b.category,
    description: b.description,
    address: b.address,
    location:
      b.location_name || b.location_lat != null
        ? {
            name: b.location_name ?? '',
            lat: Number(b.location_lat ?? 0),
            lng: Number(b.location_lng ?? 0),
          }
        : undefined,
    phone: b.phone ?? undefined,
    whatsapp: b.whatsapp ?? undefined,
    hours: b.hours ?? undefined,
    priceRange: b.price_range ?? undefined,
    images: mapJunctionImages(b.t_business_images),
    services: Array.isArray(b.services) ? b.services : undefined,
    isVerified: b.is_verified,
  }));
}

export interface Dish {
  id: string;
  name: string;
  slug: string;
  description: string;
  ingredients: string[];
  image?: string;
}

export async function fetchDishes(): Promise<Dish[]> {
  const { data, error } = await supabase
    .from('t_dishes')
    .select('*, t_media ( file_path )')
    .eq('is_published', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching dishes:', error);
    return [];
  }

  return (data ?? []).map((d: any) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    description: d.description,
    ingredients: Array.isArray(d.ingredients) ? d.ingredients : [],
    image: mediaUrl(d.t_media?.file_path),
  }));
}

export interface HeroSlide {
  image: string;
  alt: string;
}

export async function fetchHeroSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from('t_hero_slides')
    .select('*, t_media ( file_path )')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching hero slides:', error);
    return [];
  }

  return (data ?? [])
    .map((s: any) => ({
      image: mediaUrl(s.t_media?.file_path) ?? '',
      alt: s.alt_text ?? s.title ?? '',
    }))
    .filter((s: HeroSlide) => Boolean(s.image));
}

// Datos de fallback para desarrollo/demo
function getFallbackTours(): Tour[] {
  return [
    {
      id: 't1',
      title: 'Trekking por Caminos Rurales y Montañas',
      slug: 'trekking-caminos-rurales-montanas',
      summary: 'Trekking por caminos rurales que atraviesan montañas, pampas y pastos naturales del distrito.',
      description:
        'Este trekking sigue antiguos caminos rurales y senderos de montaña del distrito de María Parado de Bellido, conectando comunidades, miradores y áreas de pastoreo. La ruta sube por laderas y crestas, pasando por montañas y valles donde se interpretan los pisos ecológicos, el uso tradicional del territorio y la relación de la población con la ganadería y la agricultura de altura.',
      duration_hours: 8,
      price: 0,
      currency: 'PEN',
      locations: [
        { name: 'Caminos Rurales y Laderas de Montaña', lat: -13.590, lng: -74.250 }
      ],
      guide: {
        id: 'g1',
        name: 'Eusebio Paredes',
        phone: '+51 9XX XXX XXX',
        email: 'eusebio.paredes@mariaparadodebellido.com',
      },
      images: [],
      difficulty: 'moderate',
      max_participants: 12,
    },
    {
      id: 't2',
      title: 'Cicloturismo por carreteras, pampas y montañas',
      slug: 'cicloturismo-caminos-rurales',
      summary: 'Recorrido en bicicleta por carreteras, pampas y montañas del distrito.',
      description:
        'Ruta en bicicleta por carreteras, pampas y montañas del distrito de María Parado de Bellido, conectando chacras, comunidades y paisajes abiertos de la sierra. El recorrido permite conocer la organización comunal, la agricultura familiar y la geografía andina, con paradas interpretativas y contacto directo con la población local. Se transita por carreteras rurales, extensas pampas y tramos ascendentes entre montañas, ofreciendo vistas panorámicas y experiencias culturales.',
      duration_hours: 8,
      price: 0,
      currency: 'PEN',
      locations: [
        { name: 'Ruta Rural Pomabamba y Comunidades', lat: -13.605, lng: -74.240 }
      ],
      guide: {
        id: 'g2',
        name: 'Ana Huamán',
        phone: '+51 9XX XXX XXX',
        email: 'ana.huaman@mariaparadodebellido.com',
      },
      images: [],
      difficulty: 'hard',
      max_participants: 8,
    },
    {
      id: 't3',
      title: 'Turismo Vivencial en Chacras Andinas',
      slug: 'turismo-vivencial-chacras',
      summary: 'Participación en actividades agrícolas y vida comunal del distrito.',
      description:
        'Comparte una experiencia vivencial junto a familias del distrito de María Parado de Bellido, participando en labores agrícolas en chacras según la temporada. El tour incluye la explicación de prácticas tradicionales como la minka, la preparación de alimentos locales y el intercambio cultural con la comunidad.',
      duration_hours: 4,
      price: 0,
      currency: 'PEN',
      locations: [
        { name: 'Chacras Comunales de Pomabamba', lat: -13.600, lng: -74.233 }
      ],
      guide: {
        id: 'g3',
        name: 'Rosa Quispe',
        phone: '+51 9XX XXX XXX',
        email: 'rosa.quispe@mariaparadodebellido.com',
      },
      images: [],
      difficulty: 'easy',
      max_participants: 5,
    }
  ];
}

