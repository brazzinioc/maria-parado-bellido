import { useEffect, useState, useRef } from "react";

interface Slide {
  image: string;
  alt: string;
}

interface HeroSliderProps {
  slides: Slide[];
  autoPlayInterval?: number;
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
      {/* Slide Images */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={index !== currentSlide}
        >
          <img
            src={slide.image}
            alt={slide.alt}
            className="w-full h-full object-cover object-bottom"
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "low"}
          />
        </div>
      ))}

    </div>
  );
}
