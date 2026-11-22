import { divergingColor, divergingGradient, sequentialColor } from "./frames";
import { fmt, tonnes } from "./format";

const gradientOf = (colorAt) => `linear-gradient(90deg, ${[0, 0.25, 0.5, 0.75, 1].map(colorAt).join(", ")})`;

const SHARE_MAX = 60; // percent; the scale is fixed so every year is comparable
const shareT = (v) => Math.sqrt(Math.max(0, Math.min(v, SHARE_MAX)) / SHARE_MAX);

const T_MIN = 1e3; // tonnes
const T_MAX = 6e6;
const tonnesT = (v) => (Math.log10(Math.max(v, T_MIN)) - Math.log10(T_MIN)) / (Math.log10(T_MAX) - Math.log10(T_MIN));

// Each scale: how a value is shaded, the legend, how it reads in words, and the floor used when blending years.
export const SCALES = {
  selfSufficiency: {
    colorFor: divergingColor,
    gradient: divergingGradient(),
    floor: 0.1,
    low: "produces less than it burns",
    high: "produces more",
    read: (v) => `${v >= 1000 ? Math.round(v).toLocaleString("en-US") : v.toFixed(0)}% of its own demand`,
  },
  share: {
    colorFor: (v) => sequentialColor(shareT(v)),
    gradient: gradientOf(sequentialColor),
    floor: 0.01,
    low: "0%",
    high: `${SHARE_MAX}% or more (stretched at the low end)`,
    read: (v) => `${v < 0.05 ? "0" : v < 10 ? v.toFixed(1) : fmt(v)}% of its electricity from wind and solar`,
  },
  tonnes: {
    colorFor: (v) => sequentialColor(tonnesT(v)),
    gradient: gradientOf(sequentialColor),
    floor: 0.5,
    low: "1 thousand tonnes or less",
    high: "6 million tonnes (log scale)",
    read: (v) => `${v < 1 ? "0 t" : tonnes(v)} of copper mined`,
  },
};
