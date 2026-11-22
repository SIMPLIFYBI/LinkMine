import world from "@/lib/intelligence/world-paths.json";

const [vx, vy, vw, vh] = world.viewBox;

// Draws one frame. All animation lives in the caller, so the same component can be rendered per frame for video.
export default function WorldMap({ values, colorFor, highlight, onPick, onHover, label, idPrefix = "yi" }) {
  const hatch = `${idPrefix}-hatch`;
  const fillOf = (iso) => (values[iso] == null ? `url(#${hatch})` : colorFor(values[iso]));
  const handlers = (iso, name) => ({
    onClick: onPick ? () => onPick(iso, name) : undefined,
    onMouseEnter: onHover ? () => onHover(iso, name) : undefined,
    onMouseLeave: onHover ? () => onHover(null, null) : undefined,
  });
  const highlighted = world.countries.find((c) => c.iso === highlight);

  return (
    <svg className="yi-map" viewBox={`${vx} ${vy} ${vw} ${vh}`} role="img" aria-label={label}>
      <defs>
        <pattern id={hatch} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="4" height="4" fill="var(--yi-sunken)" />
          <line x1="0" y1="0" x2="0" y2="4" stroke="var(--yi-rule-2)" strokeWidth="1.2" />
        </pattern>
      </defs>
      {world.countries.map((c) => (
        <path key={c.iso} d={c.d} fill={fillOf(c.iso)} className="yi-map-c" {...handlers(c.iso, c.name)} />
      ))}
      {world.dots.map((d) => (
        <circle key={d.iso} cx={d.cx} cy={d.cy} r="3.2" fill={fillOf(d.iso)} className="yi-map-d" {...handlers(d.iso, d.name)} />
      ))}
      {highlighted ? <path d={highlighted.d} className="yi-map-hl" /> : null}
    </svg>
  );
}
