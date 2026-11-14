"use client";

import { useEffect } from "react";

export default function HomeMotion() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (prefersReducedMotion.matches) return undefined;

    const root = document.documentElement;
    root.classList.add("home-motion-enabled");

    const heroFrame = window.requestAnimationFrame(() => {
      root.classList.add("home-motion-play");
    });

    const revealTargets = Array.from(document.querySelectorAll("[data-home-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-home-revealed", "true");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10%", threshold: 0.08 }
    );

    revealTargets.forEach((target) => observer.observe(target));

    return () => {
      window.cancelAnimationFrame(heroFrame);
      observer.disconnect();
      root.classList.remove("home-motion-enabled", "home-motion-play");
    };
  }, []);

  return null;
}