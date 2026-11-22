# YouMine report house style

Three worked examples live beside this file. Read the HTML — it is the reference
implementation, and this document is the reasoning behind it.

- `energy-flip.html` — *The Energy Flip*
- `peak-was-yesterday.html` — *Peak Was Yesterday*
- `reserve-report.html` — *Reserve Rich, Production Poor*

---

## 1. What these are for

The brief: a library of **provocative, surprising, highly shareable** reports —
data-driven clickbait backed by credible data and transparent methodology.

> The LinkedIn post should generate curiosity, but the YouMine website should
> provide the full answer.
>
> The key is that our figures must be defensible, even if the headline is
> deliberately provocative.

Equal consideration to mining and oil & gas, global rather than Australia-only.

**That second line is the whole design constraint.** The headline does the
provoking; the page does the proving. Every one of these reports is built so a
sceptical reader who scrolls can find the number, the source, the method and the
caveat. If a design choice makes the claim louder but the evidence weaker, it is
the wrong choice.

### The editorial formula

1. **A headline that sounds like an opinion but is a measurement.** "Peak Was
   Yesterday" is a claim; the page shows nine minerals indexed to their own peak.
2. **The counter-intuitive turn in the first paragraph.** Say the surprising
   thing immediately. Don't build to it.
3. **One chart that carries the argument.** Not a dashboard. One idea, drawn well.
4. **The caveat stated in the body, not a footnote.** Where the data is weak, say
   so in the same typeface and size as the claim. This is the credibility move
   and it is non-negotiable.
5. **Method and sources at the foot**, specific enough to reproduce.

A worked example of (4): *Peak Was Yesterday* uses **3-year centred moving
averages** because single-year peaks turned out to be reporting artefacts — talc
jumped 77.8 → 100 → 71.4 across 1996–98 on one country's revision. The report
says so. The first draft didn't, and its rankings were wrong.

---

## 2. Typography

The IBM Plex trio, from Google Fonts. One link tag:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
```

| face | role |
|---|---|
| **IBM Plex Serif** | body prose. Long-form reading, and it signals "report" not "dashboard" |
| **IBM Plex Sans** | headlines, labels, UI chrome, chart axis labels |
| **IBM Plex Mono** | every number that matters — figures, units, table cells, axis values |

Always declare real fallback stacks; a blocked font request must not reflow the
page into something unreadable.

**Numbers go in mono.** This is the most load-bearing rule in the system. It
makes figures scannable, aligns them in tables and columns, and visually
separates measurement from assertion. A number set in the body serif reads as
rhetoric; the same number in mono reads as data.

Body text sits at `1.0625rem`/`1.65` with a `36rem` measure for prose, inside a
wider `60rem` page. Prose is narrow, charts are wide.

---

## 3. Colour architecture

Every colour is a token on `:root`. Dark mode is **selected, not flipped** — the
dark values are chosen against the dark surface, never derived by inverting.

The three-block pattern is mandatory, because the viewer's theme has three
states (explicit light, explicit dark, and system default):

```css
:root{ /* every token, light values */ }

@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){ /* dark values */ color-scheme:dark; }
}

:root[data-theme="dark"]{ /* the SAME dark values again */ color-scheme:dark; }
```

Omit the third block and an explicit dark toggle silently fails on a system-light
machine. No colour may have its only definition inside a media query, and `body`
always sets an explicit token background.

### Token scales

Three ink levels, two rule weights, two or three surfaces — then the accents:

```
--ink / --ink-2 / --ink-3        primary, secondary, muted text
--rule / --rule-2               hairlines, then emphasis borders
--surface / --raised / --sunken  page, cards, wells
--<accent> / --<accent>-soft     series colour + its low-alpha fill
```

### Accents are per report, and validated

Each report picks its own accent pair to suit the argument. Shipped and checked:

| report | light | dark | meaning |
|---|---|---|---|
| Peak Was Yesterday | `#1259a6` line, `#b07314` peak | `#4a8fd0`, `#ad7c1a` | series vs the peak marker |
| The Energy Flip | `#2a78d6` gain, `#eb6834` lost | `#3987e5`, `#d95926` | direction of change |

**Do not invent an accent pair by eye.** The constraint is colour-vision
deficiency separation: adjacent series must stay distinguishable under deuter-
and protanopia, and the normal-vision separation must be comfortably above the
floor. The shipped pairs were validated with a checker; new pairs must be too.
Light accents sit in roughly the L 0.43–0.77 band, dark accents L 0.48–0.67.

**Text never wears the series colour.** Values, labels and legends stay in ink
tokens; a coloured mark beside them carries the identity. Colour is never the
only channel — pair it with a label, a position or a shape.

---

## 4. Charts

Hand-written inline SVG. No chart library. These are small, specific and
deliberate; a library would add weight and take away control.

Rules that produced the shipped look:

- **One axis. Never a dual-axis chart.** Two measures of different scale become
  two charts, small multiples, or an index to a common base. Indexing is usually
  the honest move: *Peak Was Yesterday* indexes nine minerals to peak = 100,
  which is the only way they belong on one scale.
- **Small multiples over a crowded single chart.** Nine minerals, nine panels,
  identical scales, sorted meaningfully.
- **Thin marks, recessive grid.** 2px lines, hairline axes in `--rule`, no
  gridline heavier than the data.
- **Direct labels on the few points that matter.** Never a number on every point.
  A single series needs no legend — the title names it.
- **Area fills at ~10–14% alpha** of the line colour (`--fill` / `--*-soft`).
- Charts get `overflow-x:auto` wrappers; nothing else may exceed the viewport.

---

## 5. Page mechanics

Learned the hard way; skipping these produces pages that break on phones.

```css
.wrap{
  max-width:60rem; margin:0 auto;
  padding-left:max(16px,env(safe-area-inset-left,0px));
  padding-right:max(16px,env(safe-area-inset-right,0px));
  padding-block:0 4rem;
}
```

- A **16px minimum side gutter at every width**, written as `max()` with the
  safe-area inset so it clears a phone's rounded corners and side bar.
- `padding-block` for vertical space — never a `padding` shorthand, which would
  zero the sides.
- Must work at **~400px wide with no horizontal page scroll**. Only tables,
  charts and code blocks may scroll, each inside its own container.
- Any flex or grid child holding text, code or a table needs `min-width:0`, or
  long content pushes the page wider instead of wrapping.
- `img{max-width:100%}`, and the same on any `aspect-ratio` box.

---

## 6. Porting these into the app

The reports are standalone HTML by design — each is one self-contained file with
no build step, which is what makes them fast to write and easy to publish.

When these become a React/Next surface, **port the tokens, not the markup.**

1. Lift the `:root` token blocks into the app's global CSS unchanged, including
   all three theme blocks.
2. Keep the IBM Plex trio and the mono-for-numbers rule — that single rule does
   most of the visual work.
3. Rebuild charts as components, but keep the constraints: one axis, small
   multiples, thin marks, direct labels, validated accents.
4. Keep the editorial structure as a layout primitive: narrow prose measure
   inside a wide page, charts breaking out to full width.

The reports and the app should share one token file. If they drift, the reports
stop looking like the product.

---

## 7. Checklist before publishing a new report

- [ ] Headline is a claim the page actually proves
- [ ] The surprising thing is in the first paragraph
- [ ] One chart carries the argument
- [ ] Every number is in mono
- [ ] The weakness in the data is stated in the body, same size as the claim
- [ ] Method and sources are specific enough to reproduce
- [ ] Accent pair validated for colour-vision deficiency
- [ ] All three theme blocks present; explicit dark toggle tested on a
      system-light machine
- [ ] No horizontal scroll at 400px
- [ ] Attribution present for any CC BY source (GEM data requires it — it is a
      licence condition, not a courtesy)
- [ ] No commercial price series republished
      (`core.price_series.provider_is_commercial`)
