import { useEffect, useState, useRef } from "react";

interface Slide {
  type?: "image" | "video";
  /** Imagen del slide, o poster/fallback cuando type es "video". */
  image?: string;
  video?: string;
  webm?: string;
  /** Variantes livianas (menor resolución/peso) para viewports angostos. */
  mobileVideo?: string;
  mobileWebm?: string;
  alt: string;
}

interface HeroSliderProps {
  slides: Slide[];
  autoPlayInterval?: number;
}

// Conexiones donde no conviene autoreproducir video pesado de fondo.
function isSlowConnection(): boolean {
  const connection = (navigator as any).connection;
  if (!connection) return false;
  if (connection.saveData) return true;
  return typeof connection.effectiveType === "string" && /2g/.test(connection.effectiveType);
}

// Resuelve UNA sola URL de video (sin <source> hijos: en React, un <video>
// con <source> hijos dinámicos falla de forma intermitente e impredecible
// -confirmado con pruebas reales-, mientras que src directo en <video>
// siempre funciona). Elige mobile/desktop por ancho y webm/mp4 según lo
// que el navegador reporte poder reproducir.
function resolveVideoSrc(slide: Slide): string | undefined {
  const isNarrow = window.matchMedia("(max-width: 767px)").matches;
  const probe = document.createElement("video");
  const supportsWebm = probe.canPlayType('video/webm; codecs="vp9"') !== "";

  if (isNarrow) {
    if (supportsWebm && slide.mobileWebm) return slide.mobileWebm;
    if (slide.mobileVideo) return slide.mobileVideo;
  }
  if (supportsWebm && slide.webm) return slide.webm;
  return slide.video;
}

/**
 * Video de fondo del hero, cargado como mejora progresiva sobre su
 * poster (que ya se pinta de inmediato como <img>). No se monta en
 * absoluto si el usuario prefiere menos movimiento o la conexión es
 * lenta/con ahorro de datos, y se pausa cuando no es el slide activo,
 * la pestaña está oculta o sale del viewport, para no gastar batería
 * de más. En viewports angostos se sirve una variante más liviana
 * (ver <source media="(max-width: 767px)"> más abajo).
 */
function HeroVideoBackground({ slide, isActive }: { slide: Slide; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canShowVideo, setCanShowVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const evaluate = () => {
      setCanShowVideo(!reducedMotionQuery.matches && !isSlowConnection());
      setVideoSrc(resolveVideoSrc(slide));
    };

    // El video espera a que la página termine de cargar (poster, estilos, fuentes)
    // y a un momento libre del navegador: así no le quita ancho de banda a lo
    // que el visitante necesita primero.
    let idleId: number | undefined;
    const start = () => {
      const ric = (window as any).requestIdleCallback as ((cb: () => void, o?: object) => number) | undefined;
      idleId = ric ? ric(evaluate, { timeout: 2500 }) : window.setTimeout(evaluate, 1200);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    reducedMotionQuery.addEventListener("change", evaluate);

    return () => {
      window.removeEventListener("load", start);
      if (idleId !== undefined) ((window as any).cancelIdleCallback ?? window.clearTimeout)(idleId);
      reducedMotionQuery.removeEventListener("change", evaluate);
    };
  }, [slide]);

  // Al navegar a otra página (ClientRouter) se corta la descarga del video:
  // si sigue bajando en segundo plano, compite con la página nueva.
  useEffect(() => {
    const abort = () => {
      const video = videoRef.current;
      if (!video) return;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
    document.addEventListener("astro:before-preparation", abort);
    return () => {
      document.removeEventListener("astro:before-preparation", abort);
      abort();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canShowVideo) return;

    const play = () => {
      if (isActive && !document.hidden) video.play().catch(() => {});
    };
    const pause = () => video.pause();
    const handleVisibilityChange = () => (document.hidden ? pause() : play());

    if (isActive) play();
    else pause();

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? play() : pause()),
      { threshold: 0.1 }
    );
    observer.observe(video);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
    };
  }, [canShowVideo, isActive]);

  return (
    <>
      {/* El poster (LCP) lo pinta la página como <img> estático debajo de este
          componente: así no espera a React y usa el srcset del build. Si el video
          no se muestra o falla, queda visible ese poster. */}
      {canShowVideo && videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          className={`absolute inset-0 h-full w-full object-cover object-bottom transition-opacity duration-700 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          onCanPlay={() => setVideoReady(true)}
          onError={() => {
            // Si falló la fuente webm elegida, reintenta con su equivalente
            // mp4 antes de rendirse del todo (sin volver al patrón
            // <source>, que es el que causaba fallos intermitentes).
            if (videoSrc === slide.webm && slide.video) {
              setVideoSrc(slide.video);
              return;
            }
            if (videoSrc === slide.mobileWebm && slide.mobileVideo) {
              setVideoSrc(slide.mobileVideo);
              return;
            }
            setCanShowVideo(false);
          }}
        />
      )}
    </>
  );
}

export default function HeroSlider({
  slides,
  autoPlayInterval = 5500,
}: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (isPaused || prefersReducedMotion || slides.length <= 1) return;

    const nextSlide = () => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    timeoutRef.current = setTimeout(nextSlide, autoPlayInterval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentSlide, isPaused, autoPlayInterval, slides.length, prefersReducedMotion]);

  const handleMouseEnter = () => {
    if (!prefersReducedMotion) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  if (slides.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-label="Galería de imágenes del hero"
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={index !== currentSlide}
        >
          {slide.type === "video" ? (
            <HeroVideoBackground slide={slide} isActive={index === currentSlide} />
          ) : (
            <img
              src={slide.image}
              alt={slide.alt}
              className="w-full h-full object-cover object-bottom"
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "low"}
            />
          )}
        </div>
      ))}
    </div>
  );
}
