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

/**
 * Video de fondo del hero, cargado como mejora progresiva sobre su
 * poster (que ya se pinta de inmediato como <img>). No se monta en
 * absoluto si el usuario prefiere menos movimiento o la conexión es
 * lenta/con ahorro de datos, y se pausa cuando no es el slide activo,
 * la pestaña está oculta o sale del viewport, para no gastar batería
 * de más. En viewports angostos se sirve una variante más liviana
 * (ver <source media="(max-width: 767px)"> más abajo), no se bloquea
 * el video por completo.
 */
function HeroVideoBackground({ slide, isActive }: { slide: Slide; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canShowVideo, setCanShowVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const evaluate = () => {
      setCanShowVideo(!reducedMotionQuery.matches && !isSlowConnection());
    };

    evaluate();
    reducedMotionQuery.addEventListener("change", evaluate);

    return () => {
      reducedMotionQuery.removeEventListener("change", evaluate);
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
      {/* Poster: pintado inmediato (LCP), y fallback real si el video no se muestra o falla. */}
      <img
        src={slide.image}
        alt={slide.alt}
        className="absolute inset-0 h-full w-full object-cover object-bottom"
        loading="eager"
        fetchPriority="high"
      />
      {canShowVideo && slide.video && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover object-bottom transition-opacity duration-700 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          onCanPlay={() => setVideoReady(true)}
          onError={() => setCanShowVideo(false)}
        >
          {/* En viewports angostos, el navegador prueba primero estas fuentes livianas. */}
          {slide.mobileWebm && (
            <source media="(max-width: 767px)" src={slide.mobileWebm} type="video/webm" />
          )}
          {slide.mobileVideo && (
            <source media="(max-width: 767px)" src={slide.mobileVideo} type="video/mp4" />
          )}
          {slide.webm && <source src={slide.webm} type="video/webm" />}
          <source src={slide.video} type="video/mp4" />
        </video>
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
