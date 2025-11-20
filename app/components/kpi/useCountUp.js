"use client";
import { useEffect, useRef, useState } from "react";

/**
 * useCountUp
 * target: final numeric value
 * Options:
 * - duration (ms)
 * - easing: custom function t->progress
 * - threshold: intersection ratio
 * - format: number formatter
 * - playOnMount: bypass intersection
 * - overshoot: number of units to overshoot before settling
 */
export function useCountUp(
  target,
  {
    // Optional: make it 2000 for a bit more drama
    duration = 1800,
    threshold = 0.3,
    overshoot = 0,
    playOnMount = false,
    format = (n) => n.toLocaleString(),
    easing = pronouncedEase // CHANGED: new default easing
  } = {}
) {
  const [value, setValue] = useState(target);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  const frameRef = useRef(null);
  const startTimeRef = useRef(0);
  const containerRef = useRef(null);
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = target;
    if (done && value !== target) {
      setStarted(false);
      setDone(false);
      setValue(target);
    }
  }, [target, done, value]);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduceMotion) {
      setValue(targetRef.current);
      setStarted(true);
      setDone(true);
      return;
    }
    if (playOnMount) {
      start();
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          start();
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduceMotion, threshold, playOnMount, started]);

  function start() {
    setStarted(true);
    setValue(0);
    startTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(tick);
  }

  function tick(now) {
    const elapsed = now - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easing(progress);
    const targetVal = targetRef.current;

    const display =
      progress < 1
        ? Math.round((targetVal + overshoot) * eased)
        : targetVal;

    setValue(display);

    if (progress < 1) {
      frameRef.current = requestAnimationFrame(tick);
    } else {
      setDone(true);
      setValue(targetVal);
    }
  }

  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    []
  );

  return {
    ref: containerRef,
    value,
    formatted: format(value),
    started,
    done
  };
}

// NEW: more pronounced slow-down
function pronouncedEase(t) {
  if (t <= 0.5) {
    // Quick ramp to ~75% by halfway
    const p = t / 0.5;
    return 0.75 * (1 - Math.pow(1 - p, 2)); // quad-out to 0.75
  } else if (t <= 0.8) {
    // Gentle glide from 75% -> 90%
    const p = (t - 0.5) / 0.3;
    return 0.75 + p * 0.15;
  } else {
    // Long, smooth exponential tail from 90% -> 100%
    const p = (t - 0.8) / 0.2;
    const expoOut = 1 - Math.pow(2, -10 * p); // easeOutExpo segment
    return 0.9 + expoOut * 0.1;
  }
}