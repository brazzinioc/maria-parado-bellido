import { useEffect, useRef, useState } from 'react';
import type { Tour, Festivity, Location } from '../types';

interface MapMarker extends Location {
  id: string;
  title: string;
  type: 'tour' | 'festivity' | 'place';
  slug?: string;
  image?: string;
}

interface Props {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export default function InteractiveMap({
  markers = [],
  center = [-13.604606929004502, -74.23605195432597],
  zoom = 13,
  className = '',
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let map: any;
    let L: any;

    const initMap = async () => {
      try {
        // Dynamically import Leaflet only on client
        const leaflet = await import('leaflet');
        L = leaflet.default;

        // Import Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        if (!mapRef.current) return;

        // Initialize map
        map = L.map(mapRef.current).setView(center, zoom);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Custom icons
        const icons: Record<string, any> = {
          tour: L.divIcon({
            className: 'custom-marker',
            html: `
              <div class="relative">
                <div class="w-10 h-10 bg-indigo rounded-full shadow-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
                  </svg>
                </div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
          }),
          festivity: L.divIcon({
            className: 'custom-marker',
            html: `
              <div class="relative">
                <div class="w-10 h-10 bg-terracota rounded-full shadow-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
          }),
          place: L.divIcon({
            className: 'custom-marker',
            html: `
              <div class="relative">
                <div class="w-10 h-10 bg-mostaza rounded-full shadow-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
          }),
        };

        // Add markers
        markers.forEach((marker) => {
          const icon = icons[marker.type] || icons.place;
          const leafletMarker = L.marker([marker.lat, marker.lng], { icon }).addTo(map);

          // Popup content
          const popupContent = `
            <div class="p-2 min-w-[200px]">
              ${marker.image ? `<img src="${marker.image}" alt="${marker.title}" class="w-full h-32 object-cover rounded mb-2" />` : ''}
              <h3 class="font-semibold text-sm mb-1">${marker.title}</h3>
              ${marker.slug ? `<a href="/${marker.type === 'tour' ? 'tours' : marker.type === 'festivity' ? 'festivities' : 'places'}/${marker.slug}" class="text-xs text-indigo hover:underline">Ver detalles →</a>` : ''}
            </div>
          `;

          leafletMarker.bindPopup(popupContent);
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
      if (map) {
        map.remove();
      }
    };
  }, [markers, center, zoom]);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-crema z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Cargando mapa...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-crema z-10">
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

      <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />
    </div>
  );
}
