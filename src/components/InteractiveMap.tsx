import { useEffect, useRef, useState } from 'react';
import type { Location } from '../types';
import 'leaflet/dist/leaflet.css';

export interface MapMarker extends Location {
  id: string;
  title: string;
  type: 'tour' | 'festivity' | 'place';
  slug?: string;
  image?: string;
  /** Línea bajo el título de la tarjeta (p. ej. «Sitio arqueológico»). */
  subtitle?: string;
  /** Color del pin y del punto de la tarjeta. */
  color?: string;
  /** Tipo de lugar, para el ícono del pin. */
  category?: 'natural' | 'archaeological' | 'historical' | 'cultural';
}

interface Props {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  /** Dibuja el límite del distrito (capa vectorial del INEI). */
  limite?: boolean;
  /** Encuadra el mapa para que se vea el distrito completo, en lugar de center/zoom. */
  ajustarAlDistrito?: boolean;
}

// Límite distrital oficial (INEI), en GeoJSON. Es un archivo de datos abiertos del sitio.
const LIMITE_URL = '/datos/limite-distrital-pomabamba-maria-parado-de-bellido-ayacucho.geojson';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

// Ícono blanco dentro del pin, según el tipo de lugar (trazos de 24×24).
const ICONOS: Record<string, string> = {
  archaeological: '<path d="M4 20h16M6 20V10m4 10V10m4 10V10m4 10V10M3 10l9-6 9 6z"/>',
  natural: '<path d="M3 20l6-10 4 6 3-4 5 8z"/>',
  historical: '<path d="M5 21V8l7-5 7 5v13M9 21v-6h6v6"/>',
  cultural: '<path d="M12 3v4m-6 4h12M7 11v10m10-10v10M4 21h16M12 7l-5 4h10z"/>',
  default: '<path d="M12 21s-7-6.5-7-12a7 7 0 1114 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
};

const pinHtml = (color: string, icono: string) => `
  <svg width="34" height="44" viewBox="0 0 34 44" aria-hidden="true">
    <path d="M17 43C17 43 3 27.5 3 17a14 14 0 1128 0C31 27.5 17 43 17 43z" fill="${color}" stroke="#fff" stroke-width="2.5"/>
    <g transform="translate(8 8) scale(.75)" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${icono}</g>
  </svg>`;

const rutaDe = (m: MapMarker) =>
  m.slug ? `/${m.type === 'tour' ? 'tours' : m.type === 'festivity' ? 'festividades' : 'lugares'}/${encodeURIComponent(m.slug)}/` : '';

// Tarjeta del pin: la misma estructura que las tarjetas de la lista junto al mapa.
const tarjetaHtml = (m: MapMarker, color: string) => {
  const href = rutaDe(m);
  const cuerpo = `
    ${m.image ? `<img src="${escapeHtml(m.image)}" alt="" class="mapa-tarjeta-img" loading="lazy" />` : ''}
    <span class="mapa-tarjeta-texto">
      <span class="mapa-tarjeta-titulo">${escapeHtml(m.title)}</span>
      ${m.subtitle ? `<span class="mapa-tarjeta-sub"><span class="mapa-tarjeta-punto" style="background:${color}"></span>${escapeHtml(m.subtitle)}</span>` : ''}
      ${href ? '<span class="mapa-tarjeta-ver">Ver lugar →</span>' : ''}
    </span>`;
  return href ? `<a href="${href}" class="mapa-tarjeta">${cuerpo}</a>` : `<div class="mapa-tarjeta">${cuerpo}</div>`;
};

const ICONO_EXPANDIR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
const ICONO_REDUCIR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';

export default function InteractiveMap({
  markers = [],
  center = [-13.604606929004502, -74.23605195432597],
  zoom = 13,
  className = '',
  limite = true,
  ajustarAlDistrito = false,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let map: any;
    let L: any;
    const limpiar: (() => void)[] = [];

    const initMap = async () => {
      try {
        // Dynamically import Leaflet only on client
        const leaflet = await import('leaflet');
        L = leaflet.default;

        if (!mapRef.current || !wrapperRef.current) return;

        // Initialize map
        map = L.map(mapRef.current).setView(center, zoom);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Pantalla completa. En iPhone no existe para elementos: ahí el mapa pasa a ocupar
        // la ventana con CSS (.mapa-ventana-completa) y se sale con el botón o con Escape.
        const wrapper = wrapperRef.current;
        const nativa = typeof wrapper.requestFullscreen === 'function' && document.fullscreenEnabled;
        let boton: HTMLAnchorElement | null = null;
        const enPantallaCompleta = () => document.fullscreenElement === wrapper || wrapper.classList.contains('mapa-ventana-completa');
        const actualizar = () => {
          const activo = enPantallaCompleta();
          if (boton) {
            boton.innerHTML = activo ? ICONO_REDUCIR : ICONO_EXPANDIR;
            boton.title = boton.ariaLabel = activo ? 'Salir de pantalla completa' : 'Ver en pantalla completa';
          }
          setTimeout(() => map.invalidateSize(), 120);
        };
        const alternar = () => {
          if (nativa) {
            if (document.fullscreenElement) document.exitFullscreen();
            else wrapper.requestFullscreen().catch(() => {});
          } else {
            wrapper.classList.toggle('mapa-ventana-completa');
            document.documentElement.classList.toggle('mapa-abierto', wrapper.classList.contains('mapa-ventana-completa'));
            actualizar();
          }
        };
        const Control = L.Control.extend({
          options: { position: 'topleft' },
          onAdd() {
            const div = L.DomUtil.create('div', 'leaflet-bar');
            boton = L.DomUtil.create('a', 'mapa-boton-completa', div) as HTMLAnchorElement;
            boton.href = '#';
            boton.setAttribute('role', 'button');
            L.DomEvent.disableClickPropagation(div);
            L.DomEvent.on(boton, 'click', (e: Event) => {
              L.DomEvent.preventDefault(e);
              alternar();
            });
            return div;
          },
        });
        map.addControl(new Control());
        actualizar();
        const alCambiar = () => actualizar();
        const alTecla = (e: KeyboardEvent) => {
          if (e.key === 'Escape' && wrapper.classList.contains('mapa-ventana-completa')) alternar();
        };
        document.addEventListener('fullscreenchange', alCambiar);
        document.addEventListener('keydown', alTecla);
        limpiar.push(() => {
          document.removeEventListener('fullscreenchange', alCambiar);
          document.removeEventListener('keydown', alTecla);
          document.documentElement.classList.remove('mapa-abierto');
        });

        // Límite del distrito: línea discontinua en verde puna (los marcadores son terracota y
        // las carreteras del mapa base, naranjas) sobre un borde blanco que la separa del fondo,
        // con un relleno muy leve. No recibe clics, para que los marcadores sigan funcionando.
        if (limite) {
          try {
            const res = await fetch(LIMITE_URL);
            if (res.ok) {
              const datos = await res.json();
              L.geoJSON(datos, {
                interactive: false,
                style: { color: '#ffffff', weight: 6, opacity: 0.85, fill: false },
              }).addTo(map);
              const capa = L.geoJSON(datos, {
                interactive: false,
                style: { color: '#2f5d46', weight: 3, opacity: 1, dashArray: '8 5', fillColor: '#2f5d46', fillOpacity: 0.06 },
              }).addTo(map);
              map.attributionControl.addAttribution('Límite distrital: INEI');
              if (ajustarAlDistrito) map.fitBounds(capa.getBounds(), { padding: [16, 16] });
            }
          } catch {
            // Sin el límite, el mapa sigue funcionando con los marcadores.
          }
        }

        // Pines: color e ícono según el tipo de lugar.
        markers.forEach((marker) => {
          const color = marker.color ?? '#b5452a';
          const icon = L.divIcon({
            className: 'mapa-pin',
            html: pinHtml(color, ICONOS[marker.category ?? ''] ?? ICONOS.default),
            iconSize: [34, 44],
            iconAnchor: [17, 43],
            popupAnchor: [0, -38],
          });
          L.marker([marker.lat, marker.lng], { icon, title: marker.title, alt: marker.title })
            .addTo(map)
            .bindPopup(tarjetaHtml(marker, color), { className: 'mapa-popup', minWidth: 240, maxWidth: 300 });
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('No se pudo cargar el mapa. Por favor, recarga la página.');
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      limpiar.forEach((f) => f());
      if (map) {
        map.remove();
      }
    };
  }, [markers, center, zoom, limite, ajustarAlDistrito]);

  return (
    <div ref={wrapperRef} className={`mapa-contenedor relative isolate z-0 overflow-hidden rounded-2xl ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-sand z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Cargando mapa...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-sand z-10">
          <div className="text-center p-6">
            <p className="text-red-600 mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary text-sm"
            >
              Recargar
            </button>
          </div>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full rounded-2xl" />
    </div>
  );
}
