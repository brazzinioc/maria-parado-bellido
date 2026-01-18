# Guía de Contribución

Gracias por tu interés en contribuir a este proyecto comunitario que promueve el turismo y cultura del distrito María Parado de Bellido, Cangallo, Ayacucho.

## Quiénes pueden contribuir

- **Residentes o nativos** del distrito María Parado de Bellido
- **Profesionales del turismo** en Ayacucho y Perú
- **Desarrolladores** que quieran apoyar proyectos de impacto social
- **Fotógrafos** con material del distrito o región
- **Investigadores** con conocimiento de la cultura, historia o geografía local
- **Diseñadores** interesados en mejorar la experiencia visual
- **Cualquier persona** con ideas para mejorar el portal

## Tipos de contribuciones

### Contenido visual

- Fotografías de alta calidad de lugares turísticos
- Imágenes de festividades y celebraciones
- Videos cortos de naturaleza, cultura o actividades
- Ilustraciones de patrones tradicionales ayacuchanos

### Contenido escrito

- Corrección de textos o información cultural
- Actualización de datos geográficos o históricos
- Traducciones a quechua o inglés
- Historias y testimonios de la comunidad
- Descripciones de lugares o tradiciones

### Mejoras técnicas

- Corrección de bugs
- Optimización de rendimiento
- Mejoras de accesibilidad (WCAG)
- Nuevas funcionalidades
- Mejoras en SEO

### Reportes y sugerencias

- Reporte de errores
- Problemas de usabilidad
- Enlaces rotos
- Ideas para nuevas funcionalidades

## Proceso de contribución

### Para contribuidores técnicos

1. **Fork el repositorio**

   Click en "Fork" en GitHub

2. **Clona tu fork**

   ```bash
   git clone https://github.com/TU_USUARIO/maria-parado-de-bellido.git
   cd maria-parado-bellido
   ```

3. **Instala las dependencias**

   ```bash
   npm install
   ```

4. **Crea una rama para tu contribución**

   ```bash
   git checkout -b feature/mi-contribucion
   ```

   Ejemplos de nombres de ramas:
   - `feature/agregar-lugar-turistico`
   - `fix/corregir-contraste-boton`
   - `docs/actualizar-readme`
   - `seo/mejorar-structured-data`

5. **Haz tus cambios**

   - Sigue las convenciones del código existente
   - Prueba localmente con `npm run dev`
   - Verifica el build con `npm run build`

6. **Commit tus cambios**

   ```bash
   git add .
   git commit -m "Descripción clara del cambio"
   ```

   Ejemplos de mensajes:
   - "Agregar nuevo lugar turístico Tacsaorcco"
   - "Corregir contraste en botón CTA de /places"
   - "Actualizar información de festividades 2026"

7. **Push y Pull Request**

   ```bash
   git push origin feature/mi-contribucion
   ```

   Luego abre un Pull Request en GitHub describiendo tus cambios.

### Para contribuidores no técnicos

Si no estás familiarizado con Git:

1. **Abre un Issue** en GitHub:
   - Ve a la pestaña "Issues"
   - Click en "New Issue"
   - Describe tu aporte (fotos, textos, correcciones)
   - Adjunta archivos si es necesario

2. **O contacta directamente** a través de GitHub Issues

## Estándares del proyecto

### Stack tecnológico

| Tecnología | Versión |
|------------|---------|
| Astro | 5.x |
| React | 19.x |
| Tailwind CSS | 4.x |
| TypeScript | 5.x |

### Estructura de archivos

```
src/
├── components/     # Componentes reutilizables (.astro, .tsx)
├── layouts/        # Layouts de página
├── pages/          # Páginas del sitio
├── lib/            # Utilidades y funciones
├── styles/         # Estilos globales
└── types/          # Definiciones TypeScript
```

### Convenciones de código

- **Componentes Astro**: Para UI estática y layouts
- **Componentes React**: Solo para interactividad (con `client:load`)
- **Estilos**: Tailwind CSS con clases utilitarias
- **Tipos**: Definidos en `src/types/index.ts`

### Paleta de colores

Usa los colores definidos en el proyecto:

| Variable | Color | Uso |
|----------|-------|-----|
| `rojo` | #d42c2a | Acentos, alertas |
| `fucsia` | #e91e8c | Primario, enlaces |
| `naranja` | #ff6b35 | CTAs, destacados |
| `amarillo` | #fdb913 | Advertencias, sol |
| `verde` | #27ae60 | Éxito, naturaleza |
| `turquesa` | #00b5cc | Info, cielo |
| `azul` | #2e4c8a | Headers, profundidad |
| `crema` | #fff8f0 | Fondo principal |

### Estilo de contenido

- **Tono**: Cálido, evocativo, respetuoso con la cultura andina
- **Idioma**: Español (se aceptan traducciones al quechua e inglés)
- **Terminología local**: Usa términos como cargontes, Pachamama, ayni, minka

### Fotografías e imágenes

| Tipo | Resolución mínima | Tamaño máximo |
|------|-------------------|---------------|
| Hero | 1920x1080px | 500KB |
| Cards | 800x600px | 200KB |
| Thumbnails | 400x300px | 100KB |

- **Formato**: WebP preferido, JPG aceptado
- **Derechos**: Solo imágenes propias o con permiso
- **Crédito**: Indica el autor en el commit

### Commits

- Mensajes claros y descriptivos en español
- Un commit por cambio lógico
- Referencia issues si aplica: `Cierra #123`

## Áreas prioritarias

Actualmente buscamos ayuda en:

1. **Fotografías de lugares turísticos** - Especialmente Allcaqapata, Tururumi, Muyumuyu
2. **Información de negocios locales** - Para completar el directorio
3. **Datos de eventos comunales** - Faenas, asambleas, actividades
4. **Traducciones** - Contenido en quechua e inglés
5. **Testing de accesibilidad** - Verificar cumplimiento WCAG AA

## Código de conducta

- **Respeta** la cultura local y tradiciones
- **Valida** la información antes de publicar
- **Da crédito** apropiado a fuentes y colaboradores
- **Mantén** el tono cultural del proyecto
- **Sé respetuoso** con todos los contribuidores

## Preguntas frecuentes

**¿Necesito saber programar para contribuir?**

No. Puedes aportar contenido, fotos, correcciones o ideas.

**¿Puedo usar el código para otro proyecto?**

Sí, el proyecto usa licencia MIT.

**¿Puedo replicar este sitio para otro distrito?**

Sí, ese es uno de los objetivos del proyecto.

**¿Cómo se reconoce a los contribuidores?**

A través del historial de commits en GitHub.

## Contacto

- **GitHub Issues**: Para reportes y sugerencias
- **Sitio web**: [mariaparadodebellido.com](https://mariaparadodebellido.com)

---

Gracias por ayudar a promover el turismo y cultura de nuestro distrito.
