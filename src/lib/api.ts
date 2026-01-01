import type { Tour, Festivity } from '../types';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'https://api.example.com';

// Cache para desarrollo
let toursCache: Tour[] | null = null;
let festivitiesCache: Festivity[] | null = null;

export async function fetchTours(): Promise<Tour[]> {
  // Si hay cache, retornar
  if (toursCache) return toursCache;

  try {
    const response = await fetch(`${API_BASE_URL}/api/tours`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    toursCache = data;
    return data;
  } catch (error) {
    console.error('Error fetching tours:', error);
    // Fallback data para desarrollo
    return getFallbackTours();
  }
}

export async function fetchFestivities(): Promise<Festivity[]> {
  if (festivitiesCache) return festivitiesCache;

  try {
    const response = await fetch(`${API_BASE_URL}/api/festivities`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    festivitiesCache = data;
    return data;
  } catch (error) {
    console.error('Error fetching festivities:', error);
    return getFallbackFestivities();
  }
}

export async function fetchTourById(id: string): Promise<Tour | null> {
  const tours = await fetchTours();
  return tours.find((tour) => tour.id === id) || null;
}

export async function fetchTourBySlug(slug: string): Promise<Tour | null> {
  const tours = await fetchTours();
  return tours.find((tour) => tour.slug === slug) || null;
}

export async function fetchFestivityById(id: string): Promise<Festivity | null> {
  const festivities = await fetchFestivities();
  return festivities.find((festivity) => festivity.id === id) || null;
}

export async function fetchFestivityBySlug(slug: string): Promise<Festivity | null> {
  const festivities = await fetchFestivities();
  return festivities.find((festivity) => festivity.slug === slug) || null;
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
      price: 50.0,
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
      images: ['/images/tours/default-photo.webp'],
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
      price: 40.0,
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
      images: ['/images/tours/default-photo.webp'],
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
      price: 45.0,
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
      images: ['/images/tours/default-photo.webp'],
      difficulty: 'easy',
      max_participants: 5,
    }
  ];
}

function getFallbackFestivities(): Festivity[] {
  return [
    {
      id: 'f1',
      name: 'Carnavales de Ayacucho',
      slug: 'carnavales-ayacucho-2026',
      description:
        'Los Carnavales de Ayacucho son una festividad costumbrista llena de alegría, color y tradición andina. Se celebran generalmente en febrero, aunque pueden extenderse hasta marzo. Durante los días centrales, las calles se llenan de comparsas, yunzas, música tradicional y el tradicional cortamonte. Los cargontes que liderarán las fiestas de agosto realizan el micuchinacuy o apaycu en febrero, una práctica de ayni (reciprocidad andina) donde apoyan en la organización de los carnavales, comprometiéndose a colaborar con la expectativa de recibir la devolución de este ayni en agosto durante sus propias fiestas patronales.',
      start_date: '2026-02-14',
      end_date: '2026-02-17',
      place: { name: 'Plaza Principal de Pomabamba', lat: -13.6014, lng: -74.2342 },
      cargontes: [
        { name: 'Familia Vilca Mendoza', role: 'Mayordomo Principal' },
        { name: 'Familia García Ayala', role: 'Alférez' },
        { name: 'Familia Rojas Poma', role: 'Encargado de Yunza' },
      ],
      images: ['/images/festivities/default-photo.webp'],
      schedule: [
        {
          date: '2026-02-14T09:00:00Z',
          activity: 'Inauguración de carnavales y entrada de comparsas',
          location: 'Plaza Principal de Pomabamba',
        },
        {
          date: '2026-02-14T14:00:00Z',
          activity: 'Micuchinacuy o Apaycu - Ayni de cargontes de agosto',
          location: 'Plaza Principal de Pomabamba',
        },
        {
          date: '2026-02-15T11:00:00Z',
          activity: 'Cortamonte y yunza tradicional',
          location: 'Plaza Principal de Pomabamba',
        },
        {
          date: '2026-02-16T14:00:00Z',
          activity: 'Concurso de danzas y música carnavalesca',
          location: 'Plaza Principal de Pomabamba',
        },
        {
          date: '2026-02-17T16:00:00Z',
          activity: 'Despedida de carnavales y entierro del ño carnavalón',
          location: 'Calles de Pomabamba',
        },
      ],
    },
   {
      id: 'f2',
      name: 'Fiesta Patronal de San Francisco de Asís',
      slug: 'fiesta-san-francisco-2026',
      description:
        'La festividad patronal más importante del distrito, celebrada cada 4 de octubre en honor a San Francisco de Asís. Los cargontes de Pomabamba organizan procesiones, misas solemnes, danzas tradicionales y eventos culturales que reúnen a toda la comunidad en una celebración de fe y tradición andina.',
      start_date: '2026-10-04',
      end_date: '2026-10-04',
      place: { name: 'Plaza Principal de Pomabamba', lat: -13.6014, lng: -74.2342 },
      cargontes: [
        {
          name: 'Familia Quispe Huamán',
          role: 'Mayordomo Principal',
          notes: 'Líder del cargo 2026',
        },
        { name: 'Familia Ccahuana Rojas', role: 'Alférez', notes: 'Encargados de la banda' },
        { name: 'Familia Palomino Cruz', role: 'Mayordoma de Comida' },
      ],
      images: ['/images/festivities/default-photo.webp'],
      schedule: [
        {
          date: '2026-10-04T06:00:00Z',
          activity: 'Diana y quema de castillos',
          location: 'Plaza Principal de Pomabamba',
        },
        {
          date: '2026-10-04T09:00:00Z',
          activity: 'Misa Solemne',
          location: 'Iglesia de Pomabamba',
        },
        {
          date: '2026-10-04T11:00:00Z',
          activity: 'Procesión por las calles de Pomabamba',
          location: 'Recorrido tradicional',
        },
        {
          date: '2026-10-04T15:00:00Z',
          activity: 'Danzas de tijeras y música tradicional',
          location: 'Plaza Principal de Pomabamba',
        },
      ],
    },
    {
      id: 'f3',
      name: 'Yarqa Aspiy - Fiestas Costumbristas',
      slug: 'yarqa-aspiy-2026',
      description:
        'El Yarqa Aspiy es una festividad costumbrista ancestral que combina el trabajo comunal de limpieza de canales de riego (acequias) con la celebración religiosa en honor a San Cristóbal y San José. Esta práctica de minka (trabajo comunitario) se realiza cada agosto, uniendo a toda la comunidad en la preparación de los sistemas de riego antes de la temporada de siembra. Durante diez días, las familias participan en la limpieza de las yarqas, comparten alimentos tradicionales, realizan ceremonias de agradecimiento a la Pachamama y celebran con danzas, música y procesiones en honor a los santos patronos.',
      start_date: '2026-08-11',
      end_date: '2026-08-20',
      place: { name: 'Canales de Riego y Plaza de Pomabamba', lat: -13.6014, lng: -74.2342 },
      cargontes: [
        { name: 'Familia Ayala Torres', role: 'Mayordomo de San Cristóbal' },
        { name: 'Familia Mendoza Pari', role: 'Mayordomo de San José' },
        { name: 'Familia Chávez Huamán', role: 'Encargado de Minka' },
      ],
      images: ['/images/festivities/default-photo.webp'],
      schedule: [
        {
          date: '2026-08-11T07:00:00Z',
          activity: 'Inicio de la limpieza de canales - Minka comunal',
          location: 'Canales de riego del distrito',
        },
        {
          date: '2026-08-15T10:00:00Z',
          activity: 'Misa en honor a San Cristóbal',
          location: 'Iglesia de Pomabamba',
        },
        {
          date: '2026-08-15T15:00:00Z',
          activity: 'Procesión de San Cristóbal y danzas tradicionales',
          location: 'Plaza Principal de Pomabamba',
        },
        {
          date: '2026-08-19T10:00:00Z',
          activity: 'Misa en honor a San José',
          location: 'Iglesia de Pomabamba',
        },
        {
          date: '2026-08-19T16:00:00Z',
          activity: 'Procesión de San José y música andina',
          location: 'Plaza Principal de Pomabamba',
        },
        {
          date: '2026-08-20T12:00:00Z',
          activity: 'Ceremonia de cierre y pago a la tierra',
          location: 'Canales de riego del distrito',
        },
      ],
    }
  ];
}
