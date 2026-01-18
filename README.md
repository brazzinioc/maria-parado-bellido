# María Parado de Bellido - Portal Turístico y Cultural

Portal web híbrido (turístico-informativo) para promover el turismo cultural y brindar información útil sobre el distrito María Parado de Bellido, provincia de Cangallo, departamento de Ayacucho, Perú (3,236 msnm).

## Descripción

Plataforma web comunitaria diseñada para mostrar la riqueza cultural, histórica, gastronómica y natural del distrito María Parado de Bellido. El sitio funciona como un portal híbrido que combina promoción turística con información útil para visitantes y residentes.

### Características principales

- **Historia y cultura** - Reseña histórica desde los Chancas hasta la actualidad
- **Sitios turísticos** - Lugares arqueológicos, naturales e históricos
- **Festividades** - Calendario de celebraciones y sistema de cargontes
- **Gastronomía** - Platos tradicionales ayacuchanos
- **Comunidad** - Información sobre eventos y actividades comunales
- **Directorio** - Negocios y servicios locales verificados
- **Widget de clima** - Información meteorológica en tiempo real
- **SEO optimizado** - Structured data, breadcrumbs, meta tags
- **Cumplimiento legal** - Política de privacidad conforme a Ley N° 29733 (Perú)

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Astro** | 5.x | Generador de sitios estáticos (SSG) |
| **React** | 19.x | Componentes interactivos (hidratación parcial) |
| **Tailwind CSS** | 4.x | Estilos utilitarios y diseño responsive |
| **Leaflet** | 1.9.x | Mapas interactivos |
| **TypeScript** | 5.x | Tipado estático |

## Estructura del Proyecto

```
maria-parado-bellido/
├── public/
│   ├── images/                    # Imágenes estáticas
│   └── robots.txt                 # Configuración para crawlers
├── src/
│   ├── components/
│   │   ├── Hero.astro             # Hero banner principal
│   │   ├── PageHeader.astro       # Header reutilizable para páginas
│   │   ├── WeatherStat.tsx        # Widget de clima (React)
│   │   ├── InteractiveMap.tsx     # Mapa con Leaflet (React)
│   │   ├── FeedbackWidget.astro   # Widget de feedback flotante
│   │   ├── WhatsAppCTA.astro      # Botón flotante de WhatsApp
│   │   ├── TourCard.astro         # Tarjeta de tour
│   │   ├── FestivityCard.astro    # Tarjeta de festividad
│   │   ├── PlaceCard.astro        # Tarjeta de lugar turístico
│   │   ├── BusinessCard.astro     # Tarjeta de negocio/servicio
│   │   ├── CommunityEventCard.astro # Tarjeta de evento comunal
│   │   ├── SEO.astro              # Meta tags, Open Graph, Twitter Cards
│   │   ├── StructuredData.astro   # JSON-LD para SEO
│   │   ├── GoogleAnalytics.astro  # Integración GA4
│   │   └── [Decorativos]          # AyacuchoPatterns, Pompones, RetabloFlores, etc.
│   ├── layouts/
│   │   └── BaseLayout.astro       # Layout principal con header/footer/nav
│   ├── lib/
│   │   └── api.ts                 # Funciones para fetch de datos
│   ├── pages/
│   │   ├── index.astro            # Home page
│   │   ├── about.astro            # Historia y cultura
│   │   ├── places.astro           # Sitios turísticos
│   │   ├── food.astro             # Gastronomía
│   │   ├── privacy.astro          # Política de privacidad (Ley 29733)
│   │   ├── festivities/
│   │   │   └── index.astro        # Listado de festividades
│   │   ├── comunidad/
│   │   │   └── index.astro        # Actividades comunales
│   │   └── directorio/
│   │       └── index.astro        # Negocios y servicios
│   ├── styles/
│   │   └── global.css             # Estilos globales, colores, animaciones
│   └── types/
│       └── index.ts               # Definiciones TypeScript
├── .env.example                   # Variables de entorno de ejemplo
├── astro.config.mjs
├── tsconfig.json
├── CONTRIBUTING.md                # Guía de contribución
└── package.json
```

## Paleta de Colores

Inspirada en los tejidos tradicionales ayacuchanos y la cultura andina:

| Color | Código | Inspiración |
|-------|--------|-------------|
| **Rojo** | `#d42c2a` | Danzantes de tijera |
| **Fucsia** | `#e91e8c` | Pompones y tejidos Paracas |
| **Naranja** | `#ff6b35` | Frutos de molle y retablos |
| **Amarillo** | `#fdb913` | Sol andino |
| **Verde** | `#27ae60` | Naturaleza |
| **Turquesa** | `#00b5cc` | Cielos andinos |
| **Azul** | `#2e4c8a` | Cielo nocturno |
| **Púrpura** | `#8b4789` | Textiles ceremoniales |
| **Crema** | `#fff8f0` | Fondo cálido |

### Tipografías

- **Headings**: Montserrat, Lora (serif)
- **Body**: Poppins, Inter (sans-serif)
- **Decorativa**: Pacifico (cursive)

## Instalación y Desarrollo

### Prerrequisitos

- Node.js 18.x o superior
- npm, yarn o pnpm

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/brazzinioc/maria-parado-de-bellido.git
cd maria-parado-bellido

# Instalar dependencias
npm install
```

### Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
# API Configuration
PUBLIC_API_URL=https://api.example.com

# Site URL (para SEO y canonical URLs)
PUBLIC_SITE_URL=https://mariaparadodebellido.com

# Google Analytics 4
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXX

# WhatsApp Contact Number
PUBLIC_WHATSAPP_NUMBER=+51XXXXXXXX

# Feedback Form URL (Google Forms, Typeform, etc.)
PUBLIC_FEEDBACK_URL=https://forms.gle/XXXXXXX

# Contact Email (para ejercer derechos ARCO)
PUBLIC_CONTACT_EMAIL=contacto@example.com
```

### Comandos Disponibles

```bash
# Desarrollo local (http://localhost:4321) con acceso de red
npm run dev

# Build estático para producción
npm run build

# Preview del build
npm run preview
```

## SEO y Structured Data

### Tipos de Schema.org implementados

- `WebSite` - Información general del sitio
- `Organization` - Datos del proyecto comunitario
- `TouristDestination` - Destino turístico principal
- `TouristAttraction` - Lugares turísticos individuales
- `Event` - Festividades y celebraciones
- `LocalBusiness` - Negocios del directorio
- `Article` - Contenido histórico/cultural
- `BreadcrumbList` - Navegación estructurada
- `ItemList` - Listas de elementos

### Características SEO

- Meta tags únicos por página
- Open Graph (Facebook) y Twitter Cards
- Canonical URLs
- Hreflang tags (es-PE, es, x-default)
- Sitemap XML automático
- robots.txt configurado
- Keywords optimizados para turismo regional

## Cumplimiento Legal

### Política de Privacidad (Ley N° 29733)

El sitio cumple con la normativa peruana de protección de datos:

- **Ley N° 29733** - Ley de Protección de Datos Personales
- **DS N° 003-2013-JUS** - Reglamento de la Ley
- **Derechos ARCO** - Acceso, Rectificación, Cancelación, Oposición

Datos recopilados:
- Google Analytics (datos anonimizados de tráfico)
- WhatsApp (solo interacción voluntaria del usuario)

## Despliegue

El sitio genera archivos estáticos compatibles con cualquier hosting:

```bash
# Build de producción
npm run build

# Los archivos se generan en /dist
```

### Plataformas recomendadas

- **Vercel** (recomendado)
- **Netlify**
- **Cloudflare Pages**
- **GitHub Pages**

## Accesibilidad

- Contraste WCAG AA mínimo
- Navegación por teclado completa
- ARIA labels en componentes interactivos
- Skip links para navegación
- Focus visible en todos los elementos interactivos
- Reducción de movimiento respetada (`prefers-reduced-motion`)

## Contribuciones

Las contribuciones son bienvenidas. Consulta [CONTRIBUTING.md](./CONTRIBUTING.md) para:

- Guías de contribución técnica y de contenido
- Estándares de código y estilo
- Proceso de Pull Requests
- Código de conducta

## Licencia

Este proyecto es de código abierto bajo licencia MIT. Siéntete libre de usarlo y adaptarlo para tu comunidad.

## Contacto

- **GitHub Issues**: Para reportes técnicos y sugerencias
- **Sitio web**: [mariaparadodebellido.com](https://mariaparadodebellido.com)

---

**Proyecto comunitario desarrollado con cariño para promover el turismo y cultura de María Parado de Bellido, Cangallo, Ayacucho, Perú**
