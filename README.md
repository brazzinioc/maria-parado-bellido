# María Parado de Bellido - Sitio Web Turístico

Sitio web estático (SSG) para promover el turismo cultural en el distrito María Parado de Bellido, provincia de Cangallo, departamento de Ayacucho, Perú (3600 msnm).

## 🌄 Descripción

Plataforma web diseñada para mostrar al mundo la riqueza cultural, histórica, gastronómica y natural del distrito María Parado de Bellido. El sitio integra:

- Historia y cultura andina
- Tours guiados con información detallada
- Festividades costumbristas y sistema de cargontes
- Gastronomía tradicional
- Mapa interactivo de sitios turísticos
- Optimización SEO y accesibilidad

## 🚀 Stack Tecnológico

- **Astro 4.x** - Generador de sitios estáticos (SSG)
- **React 18.x** - Componentes interactivos (hidratación parcial)
- **Tailwind CSS 3.x** - Estilos utilitarios y diseño responsive
- **Leaflet** - Mapas interactivos
- **TypeScript** - Tipado estático

## 📁 Estructura del Proyecto

```
maria-parado-bellido/
├── public/
│   ├── images/                      # Imágenes estáticas (hero, tours, food, etc.)
│   ├── robots.txt
├── src/
│   ├── components/
│   │   ├── Hero.astro              # Hero banner reutilizable
│   │   ├── TourCard.astro          # Tarjeta de tour
│   │   ├── FestivityCard.astro     # Tarjeta de festividad
│   │   ├── InteractiveMap.tsx      # Mapa con Leaflet (React)
│   │   ├── SEO.astro               # Meta tags, Open Graph, Twitter Cards
│   │   └── StructuredData.astro    # JSON-LD para SEO
│   ├── layouts/
│   │   └── BaseLayout.astro        # Layout principal con header/footer
│   ├── lib/
│   │   └── api.ts                  # Funciones para fetch de datos (tours, festivities)
│   ├── pages/
│   │   ├── index.astro             # Home page
│   │   ├── about.astro             # Historia y cultura
│   │   ├── food.astro              # Gastronomía
│   │   ├── mapa.astro              # Mapa interactivo
│   │   ├── contact.astro           # Formulario de contacto
│   │   ├── tours/
│   │   │   ├── index.astro         # Listado de tours
│   │   │   └── [slug].astro        # Detalle de tour (dinámico)
│   │   └── festivities/
│   │       └── index.astro         # Listado de festividades
│   ├── styles/
│   │   └── global.css              # Estilos globales y Tailwind
│   └── types/
│       └── index.ts                # Definiciones TypeScript
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
└── package.json
```

## 🎨 Diseño y Estética

### Paleta de Colores (Inspirada en Tejidos Andinos)

- **Terracota**: `#B33A2B` - Pasión, tierra
- **Índigo**: `#27408B` - Cielo andino, profundidad
- **Mostaza**: `#D9982D` - Sol, cosecha
- **Tierra**: `#A67C52` - Conexión con la naturaleza
- **Crema**: `#F7F3EE` - Fondo suave y cálido

### Tipografías

- **Headings**: Lora (serif elegante)
- **Body**: Inter (legibilidad en pantalla)

### Patrones Visuales

- Patrón SVG con motivos andinos (chakana, rombos, zigzags)
- Overlays sutiles con baja opacidad
- Animaciones suaves (fade-in, slide-up)

## 🔧 Instalación y Desarrollo

### Prerrequisitos

- Node.js 18.x o superior
- npm, yarn o pnpm

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/brazzinioc/maria-parado-bellido.git
cd maria-parado-bellido

# Instalar dependencias
npm install
# o
yarn install
# o
pnpm install
```

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# URL base de la API (opcional)
PUBLIC_API_URL=https://api.example.com

# Formspree ID para formulario de contacto (opcional)
PUBLIC_FORMSPREE_ID=YOUR_FORMSPREE_ID
```

### Comandos Disponibles

```bash
# Desarrollo local (http://localhost:4321)
npm run dev

# Build estático para producción
npm run build

# Preview del build
npm run preview
```

## 🌐 Integración con API

El sitio consume datos de tours y festividades desde una API REST externa.

### Endpoints Esperados

#### `GET /api/tours`

Retorna un array de objetos `Tour`:

```json
[
  {
    "id": "t123",
    "title": "Tour al Mirador de Puka Pampa",
    "slug": "mirador-puka-pampa",
    "summary": "Caminata leve de 2 horas...",
    "description": "...",
    "duration_hours": 2,
    "price": 25.0,
    "currency": "PEN",
    "locations": [{ "name": "Mirador Puka Pampa", "lat": -13.3, "lng": -74.2 }],
    "guide": {
      "id": "g1",
      "name": "Rosa Quispe",
      "phone": "+51 999 888 777"
    },
    "images": ["https://..."],
    "difficulty": "easy",
    "max_participants": 15
  }
]
```

#### `GET /api/festivities`

Retorna un array de objetos `Festivity`:

```json
[
  {
    "id": "f456",
    "name": "Fiesta Patronal de San Juan",
    "slug": "fiesta-san-juan-2026",
    "description": "...",
    "start_date": "2026-06-24",
    "end_date": "2026-06-26",
    "place": { "name": "Plaza Principal", "lat": -13.31, "lng": -74.21 },
    "cargontes": [
      {
        "name": "Familia Quispe Huamán",
        "role": "Mayordomo",
        "notes": "Líder del cargo 2026"
      }
    ],
    "images": ["..."],
    "schedule": [
      {
        "date": "2026-06-24T09:00:00Z",
        "activity": "Misa",
        "location": "Iglesia"
      }
    ]
  }
]
```

### Estrategia de Datos

- **Build-time fetch**: Los datos se obtienen durante el build (`astro build`), generando páginas estáticas.
- **Fallback**: Si la API no está disponible, se usan datos de ejemplo definidos en `src/lib/api.ts`.
- **Rebuilds**: Para actualizar el sitio con nuevos datos, ejecuta `npm run build` o configura webhooks con tu proveedor de hosting.

## 📦 Despliegue

### Vercel

```bash
npm install -g vercel
vercel --prod
```

## 🔍 SEO y Rendimiento

### Features SEO

- ✅ Meta tags únicos por página
- ✅ Open Graph (Facebook)
- ✅ Twitter Cards
- ✅ JSON-LD structured data (WebSite, Organization, Event, TouristTrip, Place)
- ✅ Sitemap.xml generado automáticamente
- ✅ robots.txt
- ✅ Canonical URLs
- ✅ Alt text en imágenes

### Optimizaciones

- Lazy loading de imágenes
- Componentes React con hidratación parcial (`client:load`)
- Fuentes optimizadas (Google Fonts con preconnect)
- CSS inlineado para rutas críticas
- Build estático (SSG) para velocidad máxima

### Lighthouse Goals

- **Performance**: > 90
- **Accessibility**: > 90
- **Best Practices**: > 90
- **SEO**: > 90

## ♿ Accesibilidad

- Contraste AA mínimo (WCAG)
- Navegación por teclado
- ARIA labels en componentes interactivos
- Alt text descriptivo
- Tamaños táctiles adecuados (mobile first)

## 🗺️ Mapas Interactivos

El mapa usa **Leaflet** con tiles de OpenStreetMap.

- Marcadores con colores distintivos (tours, festividades, lugares)
- Popups con imagen y enlace
- Responsive (full-screen toggle en móvil)
- Clusters para mejor rendimiento

## 📝 Contenido y Tono

- Voz tranquila, evocadora y respetuosa
- Términos locales: cargontes, fiesta patronal, Pachamama, etc.
- Párrafos breves y escaneables
- Fotografías con color grading cálido y baja saturación

## 🛠️ Mantenimiento

### Actualizar Datos de Tours/Festividades

Si los datos provienen de la API, simplemente ejecuta un nuevo build:

```bash
npm run build
```

Si modificas datos en `src/lib/api.ts` (fallback), edita los arrays y haz rebuild.

### Añadir Nuevas Páginas

1. Crea un archivo `.astro` en `src/pages/`
2. Usa `BaseLayout` y componentes existentes
3. Añade SEO con el componente `<SEO>`
4. Rebuild

### Modificar Estilos

- Colores: edita `tailwind.config.mjs`
- Estilos globales: edita `src/styles/global.css`
- Componentes: usa clases de Tailwind

## 📄 Licencia

Este proyecto es de código abierto. Siéntete libre de usarlo y adaptarlo para tu comunidad.

## 🤝 Contribuciones

Contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📧 Contacto

Para consultas sobre el distrito María Parado de Bellido:

- **Email**: <info@mariaparadodebellido.com>
- **Teléfono**: +51 999 888 777
- **Ubicación**: Plaza Principal, María Parado de Bellido, Cangallo, Ayacucho

---

**Desarrollado con ❤️ para promover el turismo cultural en María Parado de Bellido, Ayacucho, Perú**
