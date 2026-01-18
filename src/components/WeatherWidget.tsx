import { useState, useEffect } from 'react';

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
}

// Coordenadas de Pomabamba, María Parado de Bellido
const LAT = -13.6014;
const LON = -74.2342;
const ALTITUDE = 3236; // metros sobre el nivel del mar

// WMO Weather interpretation codes
const weatherDescriptions: Record<number, string> = {
  0: 'Despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina helada',
  51: 'Llovizna ligera',
  53: 'Llovizna',
  55: 'Llovizna intensa',
  56: 'Llovizna helada',
  57: 'Llovizna helada intensa',
  61: 'Lluvia ligera',
  63: 'Lluvia',
  65: 'Lluvia intensa',
  66: 'Lluvia helada',
  67: 'Lluvia helada intensa',
  71: 'Nevada ligera',
  73: 'Nevada',
  75: 'Nevada intensa',
  77: 'Granizo',
  80: 'Chubascos ligeros',
  81: 'Chubascos',
  82: 'Chubascos intensos',
  85: 'Nevada ligera',
  86: 'Nevada intensa',
  95: 'Tormenta',
  96: 'Tormenta con granizo',
  99: 'Tormenta severa',
};

const weatherIcons: Record<number, string> = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  55: '🌧️',
  56: '🌨️',
  57: '🌨️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  66: '🌨️',
  67: '🌨️',
  71: '❄️',
  73: '❄️',
  75: '❄️',
  77: '🌨️',
  80: '🌦️',
  81: '🌧️',
  82: '⛈️',
  85: '🌨️',
  86: '🌨️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
};

function getWeatherDescription(code: number): string {
  return weatherDescriptions[code] || 'Variable';
}

function getWeatherIcon(code: number): string {
  return weatherIcons[code] || '🌤️';
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Open-Meteo API - Gratuita y sin API key
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=America%2FLima`
        );

        if (!response.ok) {
          throw new Error('Error al obtener el clima');
        }

        const data = await response.json();

        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          description: getWeatherDescription(data.current.weather_code),
          icon: getWeatherIcon(data.current.weather_code),
          humidity: data.current.relative_humidity_2m,
        });
        setError(null);
      } catch (err) {
        console.warn('Weather API error, using fallback:', err);
        setError('Sin conexión');
        // Fallback a datos típicos de la sierra
        setWeather({
          temperature: 12,
          description: 'Parcialmente nublado',
          icon: '⛅',
          humidity: 65,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();

    // Actualizar cada 30 minutos
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="w-16 h-5 bg-gray-200 rounded"></div>
            <div className="w-20 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/85 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-white/50 transition-all duration-300 hover:bg-white/95 hover:shadow-xl group">
      <div className="flex items-center gap-3">
        <span className="text-3xl group-hover:scale-110 transition-transform duration-300" role="img" aria-label={weather?.description}>
          {weather?.icon}
        </span>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-800">
              {weather?.temperature}°
            </span>
            <span className="text-sm text-gray-500">C</span>
          </div>
          <div className="text-xs text-gray-600 font-medium">
            {ALTITUDE.toLocaleString()} msnm
          </div>
          {error && (
            <div className="text-xs text-amber-600 mt-0.5">
              {error}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-200/50">
        <p className="text-xs text-gray-600">
          {weather?.description}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Humedad: {weather?.humidity}%
        </p>
      </div>
    </div>
  );
}
