"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useState, useCallback } from "react";

export default function EmblaParallax({ slides, renderSlide, onOpen }) {
  const [emblaRef, embla] = useEmblaCarousel({ align: "center", loop: false });
  const [progress, setProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!embla) return;
    setProgress(embla.scrollProgress());
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.on("scroll", onSelect);
    embla.on("resize", onSelect);
    embla.on("select", onSelect);
    onSelect();
    return () => {
      embla.off("scroll", onSelect);
      embla.off("resize", onSelect);
      embla.off("select", onSelect);
    };
  }, [embla, onSelect]);

  return (
    <div className="embla">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {(slides || []).map((slide, i) => (
            <div key={slide.id ?? i} className="embla__slide">
              <div
                className="embla__parallax"
                style={{ transform: `translateX(${(progress - i / (slides.length || 1)) * -20}%)` }}
                onClick={() => onOpen?.(slide.id)}
              >
                {renderSlide(slide, i)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => embla?.scrollPrev()}
          disabled={!canPrev}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 disabled:opacity-40"
        >
          Back
        </button>
        <div className="text-xs text-slate-400">Swipe or use arrows</div>
        <button
          type="button"
          onClick={() => embla?.scrollNext()}
          disabled={!canNext}
          className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-100 disabled:opacity-40"
        >
          Next
        </button>
      </div>

      <style jsx>{`
        .embla {
          position: relative;
        }
        .embla__viewport {
          overflow: hidden;
        }
        .embla__container {
          display: flex;
          gap: 24px;
          padding: 12px 8px;
        }
        .embla__slide {
          position: relative;
          flex: 0 0 85%;
          min-width: 0;
        }
        @media (min-width: 768px) {
          .embla__slide {
            flex-basis: 68%;
          }
        }
        .embla__parallax {
          will-change: transform;
        }
      `}</style>
    </div>
  );
}