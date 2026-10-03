import { useState, useEffect } from "react";

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
}

// Coordenadas de Pomabamba, María Parado de Bellido
const LAT = -13.6047074;
const LON = -74.2364904;

// WMO Weather interpretation codes
const weatherDescriptions: Record<number, string> = {
  0: "Despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Neblina",
  48: "Neblina helada",
  51: "Llovizna ligera",
  53: "Llovizna",
  55: "Llovizna intensa",
  61: "Lluvia ligera",
  63: "Lluvia",
  65: "Lluvia intensa",
  71: "Nevada ligera",
  73: "Nevada",
  75: "Nevada intensa",
  80: "Chubascos ligeros",
  81: "Chubascos",
  82: "Chubascos intensos",
  95: "Tormenta",
};

const weatherIcons: Record<number, string> = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  71: "❄️",
  73: "❄️",
  75: "❄️",
  80: "🌦️",
  81: "🌧️",
  82: "⛈️",
  95: "⛈️",
};

function getWeatherDescription(code: number): string {
  return weatherDescriptions[code] || "Variable";
}

function getWeatherIcon(code: number): string {
  return weatherIcons[code] || "🌤️";
}

// Datos por defecto
const defaultWeather: WeatherData = {
  temperature: 12,
  description: "Clima andino",
  icon: "⛅",
};

interface WeatherStatProps {
  /** "dark": pill de vidrio sobre foto/video oscuro. "light": tarjeta sobre fondo claro. */
  variant?: "dark" | "light";
}

export default function WeatherStat({ variant = "dark" }: WeatherStatProps) {
  const [weather, setWeather] = useState<WeatherData>(defaultWeather);
  const isDark = variant === "dark";

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&timezone=America%2FLima`,
        );

        if (!response.ok) {
          throw new Error("Error al obtener el clima");
        }

        const data = await response.json();

        if (data?.current) {
          setWeather({
            temperature: Math.round(data.current.temperature_2m),
            description: getWeatherDescription(data.current.weather_code),
            icon: getWeatherIcon(data.current.weather_code),
          });
        }
      } catch (err) {
        console.warn("Weather API error, using fallback:", err);
      }
    };

    fetchWeather();

    // Actualizar cada 30 minutos
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
        isDark
          ? "bg-white/15 backdrop-blur-sm border-white/20"
          : "bg-white border-line shadow-sm"
      }`}
    >
      <span className="text-base" role="img" aria-label={weather.description}>
        {weather.icon}
      </span>
      <span className={`font-bold text-lg ${isDark ? "text-amarillo" : "text-naranja"}`}>
        {weather.temperature}°
      </span>
      <span className={`text-sm hidden sm:inline ${isDark ? "text-white/70" : "text-ink-soft"}`}>
        Ahora · {weather.description}
      </span>
    </div>
  );
}
