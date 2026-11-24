import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { AUTHOR } from "@/lib/intelligence/author";

// IBM Plex (SIL Open Font License), bundled so slide rendering never depends on a font fetch.
const FONT_DIR = path.join(process.cwd(), "app", "intelligence", "social", "fonts");
let fontsPromise;

export function loadFonts() {
  fontsPromise ||= Promise.all([
    ["IBMPlexSans-Regular.ttf", "Plex Sans", 400],
    ["IBMPlexSans-SemiBold.ttf", "Plex Sans", 600],
    ["IBMPlexSans-Bold.ttf", "Plex Sans", 700],
    ["IBMPlexMono-Medium.ttf", "Plex Mono", 500],
    ["IBMPlexMono-SemiBold.ttf", "Plex Mono", 600],
  ].map(async ([file, name, weight]) => ({ name, weight, style: "normal", data: await readFile(path.join(FONT_DIR, file)) })));
  return fontsPromise;
}

// The author's photo is drawn on every slide so a screenshot still says who made it.
let avatarPromise;
export function loadAvatar() {
  avatarPromise ||= readFile(path.join(process.cwd(), AUTHOR.avatarFile))
    .then((buf) => `data:image/jpeg;base64,${buf.toString("base64")}`)
    .catch(() => null);
  return avatarPromise;
}

export const SIZES ={ square: { width: 1080, height: 1080 }, portrait: { width: 1080, height: 1350 } };

const PAPER = "#fbfaf6";
const INK = "#16160f";
const INK2 = "#4a4a42";
const INK3 = "#6f6f64";
const RULE = "#cfcec8";
const ACCENT = { rent: "#2a78d6", trade: "#eb6834", lost: "#eb6834", gain: "#2a78d6" };
const PAD = 72;

const flex = { display: "flex" };

function Frame({ w, h, page, total, source, dark, lead, avatar, children }) {
  const muted = dark ? "#a9a99f" : INK3;
  return (
    <div style={{ ...flex, flexDirection: "column", width: w, height: h, padding: PAD, background: lead ? "linear-gradient(145deg, #101b28, #173c43)" : dark ? INK : PAPER, color: dark ? PAPER : INK, fontFamily: "Plex Sans" }}>
      <div style={{ ...flex, justifyContent: "space-between", alignItems: "center", paddingBottom: 22, borderBottom: `2px solid ${dark ? "#4a4a42" : INK}` }}>
        <div style={{ ...flex, alignItems: "center" }}>
          {avatar ? <img src={avatar} width={60} height={60} style={{ borderRadius: 30, marginRight: 18 }} /> : null}
          <div style={{ ...flex, flexDirection: "column" }}>
            <div style={{ ...flex, fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{AUTHOR.name}</div>
            <div style={{ ...flex, fontSize: 19, fontWeight: 600, letterSpacing: 3, color: muted, marginTop: 4 }}>
              {`${AUTHOR.xHandle.toUpperCase()} · YOUMINE INTELLIGENCE`}
            </div>
          </div>
        </div>
        <div style={{ ...flex, fontFamily: "Plex Mono", fontSize: 24, color: muted }}>{`${page} / ${total}`}</div>
      </div>
      <div style={{ ...flex, flexDirection: "column", flex: 1, justifyContent: "center" }}>{children}</div>
      <div style={{ ...flex, fontSize: 21, lineHeight: 1.3, color: muted, paddingTop: 18, borderTop: `1px solid ${dark ? "#4a4a42" : RULE}` }}>{source}</div>
    </div>
  );
}

function Lead({ s, h }) {
  const trackWidth = SIZES.square.width - PAD * 2;
  const portrait = h > 1200;
  return (
    <div style={{ ...flex, flexDirection: "column" }}>
      <div style={{ ...flex, width: 76, height: 5, background: "#79e6ca", marginBottom: 22 }} />
      <div style={{ ...flex, fontWeight: 700, fontSize: portrait ? 74 : 64, lineHeight: 1.05, letterSpacing: -2 }}>{s.title}</div>
      <div style={{ ...flex, color: "#c4d4df", fontSize: 28, lineHeight: 1.25, marginTop: 20 }}>{s.context}</div>
      <div style={{ ...flex, flexDirection: "column", marginTop: portrait ? 58 : 32, gap: portrait ? 32 : 18 }}>
        {s.bars.map(([label, value], i) => (
          <div key={label} style={{ ...flex, flexDirection: "column" }}>
            <div style={{ ...flex, alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ ...flex, fontSize: 30, fontWeight: 600 }}>{label}</div>
              <div style={{ ...flex, fontFamily: "Plex Mono", fontSize: 44, fontWeight: 600, color: i === 0 ? "#79e6ca" : "#ffb579" }}>{`${value}${s.unit}`}</div>
            </div>
            <div style={{ ...flex, width: trackWidth, height: 14, background: "#36515b", borderRadius: 7 }}>
              <div style={{ ...flex, width: trackWidth * value / s.max, height: 14, background: i === 0 ? "#79e6ca" : "#ffb579", borderRadius: 7 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ s, kicker }) {
  const innerW = SIZES.square.width - PAD * 2;
  const size = Math.min(300, Math.floor(innerW / (s.big.length * 0.62)));
  const accent = ACCENT[s.accent] || ACCENT.rent;
  return (
    <div style={{ ...flex, flexDirection: "column" }}>
      <div style={{ ...flex, fontFamily: "Plex Mono", fontWeight: 500, fontSize: 28, letterSpacing: 3, color: INK3, textTransform: "uppercase", marginBottom: 28 }}>{kicker}</div>
      <div style={{ ...flex, fontFamily: "Plex Mono", fontWeight: 600, fontSize: size, lineHeight: 1, letterSpacing: -4, color: accent }}>{s.big}</div>
      <div style={{ ...flex, fontSize: 54, fontWeight: 700, lineHeight: 1.15, marginTop: 40 }}>{s.label}</div>
      <div style={{ ...flex, fontSize: 32, lineHeight: 1.35, color: INK2, marginTop: 26 }}>{s.sub}</div>
    </div>
  );
}

function Bars({ s, h }) {
  const accent = ACCENT[s.accent] || ACCENT.rent;
  const fromColor = s.fromColor || RULE;
  const fromHeight = s.fromColor ? 24 : 14;
  const portrait = h > 1200;
  const k = portrait ? 1.22 : 1;
  const labelW = 340;
  const valW = 118;
  const trackW = SIZES.square.width - PAD * 2 - labelW - valW;
  const max = s.max || 100;
  const px = (v) => Math.max(3, Math.round((v / max) * trackW));
  return (
    <div style={{ ...flex, flexDirection: "column", flex: 1, justifyContent: "space-between", paddingTop: 30, paddingBottom: 6 }}>
      <div style={{ ...flex, flexDirection: "column" }}>
        <div style={{ ...flex, fontSize: 54, fontWeight: 700, lineHeight: 1.1 }}>{s.title}</div>
        {s.subtitle && <div style={{ ...flex, fontSize: 28, color: INK2, marginTop: 12 }}>{s.subtitle}</div>}
        <div style={{ ...flex, alignItems: "center", marginTop: 20, fontSize: 26, color: INK2 }}>
          <div style={{ ...flex, width: 28, height: s.fromColor ? 22 : 14, background: fromColor, marginRight: 10 }} />
          <div style={{ ...flex, marginRight: 34 }}>{s.fromLabel}</div>
          <div style={{ ...flex, width: 28, height: 22, background: accent, marginRight: 10 }} />
          <div style={{ ...flex }}>{s.toLabel}</div>
        </div>
      </div>
      <div style={{ ...flex, flexDirection: "column", justifyContent: "space-around", flex: 1, paddingTop: 16 }}>
        {s.rows.map((r) => (
          <div key={r.label} style={{ ...flex, alignItems: "center" }}>
            <div style={{ ...flex, flexDirection: "column", width: labelW }}>
              <div style={{ ...flex, fontSize: Math.round(33 * k), fontWeight: 700, lineHeight: 1.12 }}>{r.label}</div>
              <div style={{ ...flex, fontSize: Math.round(23 * k), color: INK3, lineHeight: 1.2 }}>{r.detail}</div>
            </div>
            <div style={{ ...flex, flexDirection: "column", width: trackW }}>
              <div style={{ ...flex, width: px(r.from), height: Math.round(fromHeight * k), background: fromColor }} />
              <div style={{ ...flex, width: px(r.to), height: Math.round(24 * k), background: accent, marginTop: 6 }} />
            </div>
            <div style={{ ...flex, flexDirection: "column", width: valW, alignItems: "flex-end" }}>
              <div style={{ ...flex, fontFamily: "Plex Mono", fontWeight: s.fromColor ? 600 : 500, fontSize: Math.round((s.fromColor ? 30 : 22) * k), color: s.fromColor || INK3, lineHeight: 1.1 }}>{`${r.from}${s.unit ?? "%"}`}</div>
              <div style={{ ...flex, fontFamily: "Plex Mono", fontWeight: 600, fontSize: Math.round(30 * k), color: s.fromColor ? accent : INK, lineHeight: 1.1, marginTop: 6 }}>{`${r.to}${s.unit ?? "%"}`}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Points({ s, h }) {
  const accent = ACCENT[s.accent] || ACCENT.rent;
  const k = h > 1200 ? 1.12 : 1;
  return (
    <div style={{ ...flex, flexDirection: "column", flex: 1, justifyContent: "space-between", paddingTop: 30, paddingBottom: 6 }}>
      <div style={{ ...flex, fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>{s.title}</div>
      <div style={{ ...flex, flexDirection: "column", justifyContent: "space-around", flex: 1, paddingTop: 20 }}>
        {s.points.map((p, i) => (
          <div key={p.head} style={{ ...flex, alignItems: "flex-start" }}>
            <div style={{ ...flex, width: 92, fontFamily: "Plex Mono", fontWeight: 600, fontSize: 44, lineHeight: 1.1, color: accent }}>{`0${i + 1}`}</div>
            <div style={{ ...flex, flexDirection: "column", flex: 1 }}>
              <div style={{ ...flex, fontSize: Math.round(40 * k), fontWeight: 700, lineHeight: 1.15 }}>{p.head}</div>
              <div style={{ ...flex, fontSize: Math.round(31 * k), lineHeight: 1.35, color: INK2, marginTop: 8 }}>{p.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cta({ kit }) {
  return (
    <div style={{ ...flex, flexDirection: "column" }}>
      <div style={{ ...flex, fontFamily: "Plex Mono", fontWeight: 500, fontSize: 28, letterSpacing: 3, color: "#eb6834", textTransform: "uppercase", marginBottom: 30 }}>The full analysis</div>
      <div style={{ ...flex, fontSize: 92, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Read the whole thing on YouMine</div>
      <div style={{ ...flex, fontSize: 44, fontWeight: 600, lineHeight: 1.2, color: "#a9a99f", marginTop: 36 }}>{kit.kicker}</div>
      <div style={{ ...flex, fontSize: 32, lineHeight: 1.35, color: "#cfcec8", marginTop: 14 }}>Method, sources, every number and every caveat.</div>
      <div style={{ ...flex, alignItems: "center", marginTop: 56 }}>
        <div style={{ ...flex, fontFamily: "Plex Mono", fontWeight: 600, fontSize: 56 }}>youmine.io</div>
        <div style={{ ...flex, marginLeft: 36, padding: "12px 26px", border: "2px solid #eb6834", color: "#eb6834", fontSize: 30, fontWeight: 600 }}>Link in the comments</div>
      </div>
    </div>
  );
}

// Last slide is always the call to action; the kit supplies the others.
export function slideCount(kit) {
  return kit.slides.length + 1;
}

export function buildSlide(kit, index, fmt, avatar = null) {
  const { width: w, height: h } = SIZES[fmt] || SIZES.square;
  const total = slideCount(kit);
  const isCta = index === total;
  const s = kit.slides[index - 1];
  const isLead = s?.type === "lead";
  let body;
  if (isCta) body = <Cta kit={kit} />;
  else if (isLead) body = <Lead s={s} h={h} />;
  else if (s.type === "stat") body = <Stat s={s} kicker={kit.kicker} />;
  else if (s.type === "bars") body = <Bars s={s} h={h} />;
  else body = <Points s={s} h={h} />;
  return {
    width: w,
    height: h,
    element: (
      <Frame w={w} h={h} page={index} total={total} source={kit.sourceLine} dark={isCta || isLead} lead={isLead} avatar={avatar}>
        {body}
      </Frame>
    ),
  };
}
