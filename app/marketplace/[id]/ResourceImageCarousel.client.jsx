"use client";

import { useMemo, useState } from "react";

export default function ResourceImageCarousel({ images = [] }) {
  const safeImages = useMemo(() => Array.isArray(images) ? images.filter((item) => item?.url) : [], [images]);
  const [index, setIndex] = useState(0);

  if (!safeImages.length) return null;

  const activeImage = safeImages[Math.min(index, safeImages.length - 1)];

  function move(delta) {
    setIndex((current) => {
      const count = safeImages.length;
      if (count <= 1) return 0;
      return (current + delta + count) % count;
    });
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-4 ring-1 ring-white/10">
      <div className="lg:hidden">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50">
          <img
            src={activeImage.url}
            alt={activeImage.alt || "Resource preview image"}
            loading="lazy"
            className="h-[220px] w-full object-cover sm:h-[280px]"
          />

          {safeImages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => move(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-slate-950/65 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-900/85"
                aria-label="Previous image"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-slate-950/65 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-900/85"
                aria-label="Next image"
              >
                Next
              </button>
            </>
          ) : null}
        </div>

        {safeImages.length > 1 ? (
          <div className="mt-3 flex items-center justify-center gap-2">
            {safeImages.map((image, imageIndex) => (
              <button
                key={image.id || image.url || imageIndex}
                type="button"
                onClick={() => setIndex(imageIndex)}
                aria-label={`Preview image ${imageIndex + 1}`}
                className={[
                  "h-2.5 w-2.5 rounded-full transition",
                  imageIndex === index ? "bg-sky-300" : "bg-white/35 hover:bg-white/55",
                ].join(" ")}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="hidden lg:block">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50">
          <img
            src={activeImage.url}
            alt={activeImage.alt || "Resource preview image"}
            loading="lazy"
            className="h-[360px] w-full object-cover"
          />
        </div>

        {safeImages.length > 1 ? (
          <div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {safeImages.map((image, imageIndex) => {
                const selected = imageIndex === index;
                return (
                  <button
                    key={image.id || image.url || imageIndex}
                    type="button"
                    onClick={() => setIndex(imageIndex)}
                    aria-label={`Preview image ${imageIndex + 1}`}
                    aria-pressed={selected}
                    className={[
                      "group relative h-28 w-44 flex-none overflow-hidden rounded-xl border transition",
                      selected
                        ? "border-sky-300/70 ring-2 ring-sky-300/25"
                        : "border-white/15 hover:border-white/30",
                    ].join(" ")}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || `Resource preview image ${imageIndex + 1}`}
                      loading="lazy"
                      className={[
                        "h-full w-full object-cover transition duration-300",
                        selected ? "scale-105" : "group-hover:scale-105",
                      ].join(" ")}
                    />
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-xs text-slate-400">Click a photo to enlarge.</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
