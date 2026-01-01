// Tipos para Tours
export interface Guide {
  id: string;
  name: string;
  phone: string;
  email?: string;
  bio?: string;
  image?: string;
}

export interface Location {
  name: string;
  lat: number;
  lng: number;
}

export interface Tour {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  duration_hours: number;
  price: number;
  currency: string;
  dates?: string[];
  locations: Location[];
  guide: Guide;
  images: string[];
  difficulty?: 'easy' | 'moderate' | 'hard';
  max_participants?: number;
}

// Tipos para Festividades
export interface Cargonte {
  name: string;
  role: string;
  notes?: string;
}

export interface ScheduleItem {
  date: string;
  activity: string;
  location: string;
}

export interface Festivity {
  id: string;
  name: string;
  slug: string;
  description: string;
  start_date: string;
  end_date: string;
  place: Location;
  cargontes: Cargonte[];
  images: string[];
  schedule: ScheduleItem[];
}

// Tipos para Lugares Turísticos
export interface TouristPlace {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: 'natural' | 'cultural' | 'historical' | 'archaeological';
  location: Location;
  images: string[];
  howToGetThere?: string;
  bestTimeToVisit?: string;
  entryFee?: number;
  currency?: string;
}

// Tipos para SEO
export interface SEOProps {
  title: string;
  description: string;
  image?: string;
  article?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  canonical?: string;
}
