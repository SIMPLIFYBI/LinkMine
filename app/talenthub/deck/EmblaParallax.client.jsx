"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useState, useCallback } from "react";

export default function EmblaParallax({ slides = [], renderSlide, onOpen }) {
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
          {slides.map((slide, i) => (
            <div key={slide.id ?? i} className="embla__slide">
              <div
                className="embla__parallax"
                style={{ transform: `translateX(${(progress - i / (slides.length || 1)) * -18}%)` }}
                onClick={() => onOpen?.(slide.id)}
              >
                {renderSlide(slide, i)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="embla__controls">
        <button
          type="button"
          onClick={() => embla?.scrollPrev()}
          disabled={!canPrev}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 disabled:opacity-40"
        >
          Back
        </button>

        <div className="text-[11px] text-slate-400">Swipe or use arrows</div>

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
        :root { --embla-controls-h: 56px; } /* adjust if needed */

        /* Mobile: let the carousel shrink to fit the slide height so controls sit immediately below card.
           Use max-height to keep it from exceeding the viewport. */
        .embla {
          position: relative;
          height: auto;
        }

        .embla__viewport {
          overflow: hidden;
          height: auto; /* allow viewport to size to slides */
          max-height: calc(100svh - var(--embla-controls-h)); /* don't exceed viewport minus controls */
          max-height: calc(100vh - var(--embla-controls-h)); /* fallback */
        }

        .embla__container {
          display: flex;
          gap: 8px;
          padding: 4px 6px 0;
          align-items: flex-start; /* stack cards from top so they don't center and leave empty space */
        }

        .embla__slide {
          position: relative;
          flex: 0 0 86%; /* narrow to show peeks */
          min-width: 0;
          height: auto; /* let slide content define height */
        }

        .embla__parallax {
          will-change: transform;
          height: auto;
        }

        .embla__controls {
          height: var(--embla-controls-h);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: transparent;
        }

        @media (min-width: 768px) {
          /* Desktop: maintain larger slide sizing and full-height behavior */
          .embla__viewport {
            height: 100%;
            max-height: none;
          }
          .embla__container {
            gap: 24px;
            padding: 12px 8px;
            align-items: center;
          }
          .embla__slide {
            flex-basis: 68%;
            height: 100%;
          }
          .embla__parallax {
            height: 100%;
          }
          .embla__controls {
            height: auto;
            padding: 12px 16px;
          }
        }
      `}</style>
    </div>
  );
}