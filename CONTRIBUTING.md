# Cómo Contribuir al Proyecto

¡Gracias por tu interés en contribuir! Este es un proyecto comunitario creado para promover el turismo cultural en el distrito María Parado de Bellido, Cangallo, Ayacucho.

## ¿Quién puede contribuir?

- **Residentes o nativos** del distrito María Parado de Bellido
- **Profesionales del turismo** en Ayacucho y Perú
- **Desarrolladores** que quieran apoyar proyectos de impacto social
- **Fotógrafos** que tengan material del distrito o región
- **Investigadores** con conocimiento de la cultura, historia o geografía local
- **Diseñadores** interesados en mejorar la experiencia visual
- **Cualquier persona** con ideas para mejorar el sitio y promover nuestro distrito

## Tipos de contribuciones bienvenidas

### 📸 Contenido visual

- Fotografías de alta calidad de lugares turísticos
- Imágenes de festividades y celebraciones
- Videos cortos de la naturaleza, cultura o actividades
- Ilustraciones de patrones tradicionales ayacuchanos

### 📝 Contenido escrito

- Corrección de textos o información cultural
- Actualización de datos geográficos o históricos
- Traducciones a quechua o inglés
- Historias y testimonios de la comunidad
- Descripciones de tours o lugares

### 💻 Mejoras técnicas

- Corrección de bugs o errores
- Optimización de rendimiento
- Mejoras de accesibilidad (WCAG)
- Nuevas funcionalidades
- Mejoras en SEO

### 🐛 Reportes

- Reporte de errores o bugs
- Sugerencias de mejoras
- Problemas de usabilidad
- Enlaces rotos

### 💡 Ideas

- Sugerencias de nuevas funcionalidades
- Propuestas para mejorar la experiencia del usuario
- Ideas para promocionar el turismo local

## Proceso de contribución

### Para contribuidores técnicos (código)

1. **Fork el repositorio**

   ```bash
   # Haz click en "Fork" en GitHub
   ```

2. **Clona tu fork**

   ```bash
   git clone https://github.com/TU_USUARIO/maria-parado-bellido.git
   cd maria-parado-bellido
   ```

3. **Instala las dependencias**

   ```bash
   npm install
   ```

4. **Crea una rama para tu contribución**

   ```bash
   git checkout -b feature/mi-contribucion
   # Ejemplos de nombres de ramas:
   # - feature/agregar-tour-campina
   # - fix/corregir-mapa-interactivo
   # - docs/actualizar-readme
   ```

5. **Haz tus cambios**
   - Sigue las convenciones del código existente
   - Prueba tus cambios localmente con `npm run dev`
   - Construye el proyecto con `npm run build` para verificar que no haya errores

6. **Commit tus cambios**

   ```bash
   git add .
   git commit -m "Descripción clara del cambio"
   # Ejemplos de mensajes:
   # - "Agregar tour a la Represa de Pastocorralpata"
   # - "Corregir error en el mapa interactivo"
   # - "Actualizar información de festividades"
   ```

7. **Push a tu fork**

   ```bash
   git push origin feature/mi-contribucion
   ```

8. **Abre un Pull Request**
   - Ve a tu fork en GitHub
   - Click en "Compare & pull request"
   - Describe claramente qué cambios hiciste y por qué

### Para contribuidores no técnicos (contenido)

Si no estás familiarizado con Git o programación:

1. **Abre un Issue** en GitHub describiendo tu contribución:
   - Ve a la pestaña "Issues"
   - Click en "New Issue"
   - Describe tu aporte (fotos, textos, correcciones, etc.)
   - Adjunta archivos si es necesario

2. **O contacta directamente**:
   - Email: <dev@mariaparadodebellido.com>
   - Indica que quieres contribuir al sitio web

## Guías y estándares

### Código de conducta

- **Respeta** la cultura local y tradiciones
- **Valida** la información antes de publicar
- **Da crédito** apropiado a fuentes, fotógrafos y colaboradores
- **Mantén** el tono evocativo y cultural del proyecto
- **Sé respetuoso** con todos los contribuidores

### Estilo de contenido

- **Tono**: Cálido, evocativo, respetuoso con la cultura andina
- **Idioma**: Español (se aceptan traducciones al quechua e inglés)
- **Terminología**: Usa términos locales apropiados (cargontes, Pachamama, fiesta patronal, ayni, minka)

### Estilo de código

- **Framework**: Astro 5.x + React 19.x
- **Estilos**: Tailwind CSS 4.x con clases personalizadas
- **TypeScript**: Tipos definidos en `src/types/index.ts`
- **Formato**: Sigue las convenciones existentes del proyecto

### Fotografías e imágenes

- **Formato**: JPG o WebP preferiblemente
- **Resolución**: Mínimo 1920x1080px para heroes, 800x600px para cards
- **Tamaño**: Optimiza antes de subir (máx. 500KB por imagen)
- **Derechos**: Solo imágenes propias o con permiso de uso
- **Crédito**: Indica el autor en el commit o Pull Request

### Commits

- Mensajes claros y descriptivos en español
- Un commit por cambio lógico
- Referencia issues si aplica: `Cierra #123`

## Áreas prioritarias

Actualmente buscamos ayuda en:

1. **Contenido sobre festividades** - Detalles de las celebraciones locales
2. **Fotografías de lugares turísticos** - Especialmente de sitios menos conocidos
3. **Información gastronómica** - Recetas y platos tradicionales
4. **Traducciones** - Contenido en quechua e inglés
5. **Optimización móvil** - Mejorar la experiencia en dispositivos móviles
6. **Testimonios** - Historias de visitantes o residentes

## Preguntas frecuentes

**¿Necesito saber programar para contribuir?**
No. Puedes contribuir con contenido, fotos, correcciones, ideas o reportando problemas.

**¿Puedo usar el código para otro proyecto?**
Sí, el proyecto usa la licencia MIT. Puedes usar, modificar y distribuir el código libremente.

**¿Puedo replicar este sitio para otro distrito?**
¡Por supuesto! Ese es uno de los objetivos. Si quieres crear un sitio similar para otro distrito de Ayacucho o Perú, adelante.

**¿Cómo se da crédito a los contribuidores?**
Todos los contribuidores aparecen en el historial de commits de GitHub. Cuando haya suficientes contribuidores, crearemos una página dedicada en el sitio.

**¿Hay reuniones o comunicación entre contribuidores?**
Actualmente toda la comunicación es asíncrona via GitHub Issues y Pull Requests. Si el proyecto crece, evaluaremos crear un grupo de comunicación.

## Reconocimientos

Este proyecto existe gracias a:

- La comunidad de **María Parado de Bellido**
- Todos los **contribuidores** que aportan su tiempo y conocimiento
- Las tecnologías open source que hacen posible este proyecto

## Contacto

- **GitHub Issues**: Para reportes técnicos y sugerencias
- **Email**: <dev@mariaparadodebellido.com>
- **Sitio web**: <https://mariaparadodebellido.com>

---

¡Gracias por ayudar a promover el turismo y cultura de nuestro distrito! 🏔️❤️
