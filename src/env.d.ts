/// <reference path="../.astro/types.d.ts" />

// Tipos para Google Analytics
interface Window {
  dataLayer: any[];
  gtag: (...args: any[]) => void;
}