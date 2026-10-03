import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
};

const CREATOR_CARDS = [
  {
    id: "gigworth",
    name: "Gigworth",
    icon: "submit",
    tint: "#6366f1",
    logoUrl:
      "https://gtcgworgdcgyfwwvysbm.supabase.co/storage/v1/object/public/portfolio/users/d7777f8f-9ded-4dd8-8e01-b93543395445/consultants/ce0d4478-8853-447f-b568-c4c836136e22/logo/1790665921033-m_Icon.png",
  },
  {
    id: "hme-solutions",
    name: "HME Solutions",
    icon: "library",
    tint: "#22d3ee",
    logoUrl:
      "https://gtcgworgdcgyfwwvysbm.supabase.co/storage/v1/object/public/portfolio/users/140cfe0d-2602-4e2b-a97c-4d384d9279b9/consultants/8a7b6044-6f5d-4886-8e50-77232747554f/logo/1789954527275-HME_Solutions.jpg",
  },
  {
    id: "fastgeo",
    name: "FastGeo",
    icon: "review",
    tint: "#60a5fa",
    logoUrl:
      "https://gtcgworgdcgyfwwvysbm.supabase.co/storage/v1/object/public/portfolio/users/140cfe0d-2602-4e2b-a97c-4d384d9279b9/consultants/667d2d99-1a35-4d6f-988d-25295a577d0f/logo/1789954100442-FastGeo.jpg",
  },
  {
    id: "eigenform",
    name: "Eigenform",
    icon: "creators",
    tint: "#2dd4bf",
    logoUrl:
      "https://gtcgworgdcgyfwwvysbm.supabase.co/storage/v1/object/public/portfolio/users/140cfe0d-2602-4e2b-a97c-4d384d9279b9/consultants/b819cb53-21e9-4343-95d8-6c9272bb28b0/logo/1789950237319-eigenform_logo.jpg",
  },
  {
    id: "coretrack",
    name: "CoreTrack",
    icon: "requests",
    tint: "#818cf8",
    logoUrl:
      "https://gtcgworgdcgyfwwvysbm.supabase.co/storage/v1/object/public/portfolio/users/140cfe0d-2602-4e2b-a97c-4d384d9279b9/consultants/d1944e14-c249-4706-832f-2a87215b3d3e/logo/1789950990959-coretrack.jpg",
  },
];

const CARD_WIDTH = 228;
const CARD_GAP = 28;

const Scene = ({ opacity, children, y = 0 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity,
      transform: `translateY(${y}px)`,
    }}
  >
    {children}
  </div>
);

const MarketplaceGlyph = ({ name, stroke, strokeWidth = 1.8 }) => {
  if (name === "discover") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ width: 34, height: 34 }}>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M6.5 10.5V20h11V10.5" />
      </svg>
    );
  }

  if (name === "submit") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ width: 34, height: 34 }}>
        <rect x="4" y="5" width="16" height="14" rx="2.5" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
        <path d="M15.5 15.5v-4" />
        <path d="M13.5 13.5h4" />
      </svg>
    );
  }

  if (name === "requests") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ width: 34, height: 34 }}>
        <path d="M7 8h10" />
        <path d="M7 12h7" />
        <path d="M7 16h6" />
        <path d="M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-4 3v-5H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      </svg>
    );
  }

  if (name === "review") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ width: 34, height: 34 }}>
        <path d="m9 12 2 2 4-5" />
        <path d="M12 3l7 3v5c0 5-3.4 8.4-7 10-3.6-1.6-7-5-7-10V6l7-3Z" />
      </svg>
    );
  }

  if (name === "library") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ width: 34, height: 34 }}>
        <path d="M5.5 5.5h3v13h-3z" />
        <path d="M10.5 4.5h3v14h-3z" />
        <path d="m16.5 6 2.5-.5 1.5 12.5-2.5.5z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ width: 34, height: 34 }}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 19c1.6-2.7 4.1-4 7-4s5.4 1.3 7 4" />
    </svg>
  );
};

// Reuses the existing Vault lockup geometry and gradient styling from app/components/VaultLogo.jsx.
const VaultBrandMark = () => {
  return (
    <svg viewBox="0 0 1000 180" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }} role="img" aria-label="The Vault by YouMine">
      <defs>
        <linearGradient id="vaultBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id="vaultNeutral" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="54%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        <linearGradient id="youMineBlue" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      <text x="25" y="38" fill="#e2e8f0" fontFamily="Arial, sans-serif" fontSize="26" fontWeight="600">
        The
      </text>

      <g transform="translate(25 55) scale(0.86) translate(-25 -55)">
        <path
          fill="url(#vaultNeutral)"
          d="
            M25 55
            L50 55
            L95 128
            L140 55
            L165 55
            L108 146
            C102 156 88 156 82 146
            Z
          "
        />

        <path
          fill="url(#vaultBlue)"
          d="
            M172 161
            L198 161
            L242 73
            L287 161
            L313 161
            L257 56
            C250 45 236 45 229 56
            Z
          "
        />

        <path
          fill="url(#vaultNeutral)"
          d="
            M330 55
            H353
            V111
            C353 130 365 141 391 141
            C417 141 429 130 429 111
            V55
            H452
            V113
            C452 148 429 163 391 163
            C353 163 330 148 330 113
            Z
          "
        />

        <path
          fill="url(#vaultNeutral)"
          d="
            M478 55
            H501
            V140
            H568
            V161
            H478
            Z
          "
        />

        <path
          fill="url(#vaultNeutral)"
          d="
            M590 55
            H700
            V76
            H657
            V161
            H633
            V76
            H590
            Z
          "
        />
      </g>

      <rect x="680" y="72" width="1.5" height="73" fill="#cbd5e1" opacity="0.85" />

      <text x="714" y="142" fill="#e2e8f0" fontFamily="Arial, sans-serif" fontSize="27" fontWeight="500">
        by
      </text>

      <text x="756" y="146" fill="url(#youMineBlue)" fontFamily="Arial, sans-serif" fontSize="46" fontWeight="700" letterSpacing="-1.5">
        YouMine.
      </text>
    </svg>
  );
};

export const VaultReveal = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const launchIn = spring({
    frame: frame - 2,
    fps,
    config: {
      damping: 17,
      stiffness: 135,
      mass: 0.8,
    },
  });

  const logoFloat = interpolate(frame, [0, 60], [24, 0], clamp);
  const logoBlur = interpolate(frame, [0, 22], [18, 0], clamp);

  const sceneLaunchOpacity = interpolate(frame, [0, 14, 72, 96], [0, 1, 1, 0], clamp);
  const sceneWhatOpacity = interpolate(frame, [84, 108, 201, 225], [0, 1, 1, 0], clamp);
  const sceneCreatorsOpacity = interpolate(frame, [213, 240, 390, 414], [0, 1, 1, 0], clamp);
  const sceneCtaOpacity = interpolate(frame, [402, 426, 449], [0, 1, 1], clamp);

  const sceneLaunchRise = interpolate(frame, [0, 20], [12, 0], clamp);
  const sceneWhatRise = interpolate(frame, [84, 124], [16, 0], clamp);
  const sceneCreatorsRise = interpolate(frame, [213, 258], [18, 0], clamp);
  const sceneCtaRise = interpolate(frame, [402, 440], [16, 0], clamp);

  const glowPulse = interpolate(frame, [0, 165, 330, 449], [0.68, 1, 0.82, 0.64], clamp);

  const carouselProgress = interpolate(frame, [225, 405], [0, 1], clamp);
  const momentumProgress = Easing.bezier(0.16, 0.94, 0.28, 1)(carouselProgress);
  const trackLength = CREATOR_CARDS.length * (CARD_WIDTH + CARD_GAP);
  const travel = momentumProgress * trackLength * 0.88;

  const launchHeadlineOpacity = interpolate(frame, [16, 36, 56], [0, 1, 1], clamp);
  const launchTaglineOpacity = interpolate(frame, [28, 44, 56], [0, 1, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        fontFamily: '"Avenir Next", "Montserrat", "Segoe UI", Arial, sans-serif',
        background:
          "radial-gradient(circle at 12% 10%, rgba(56,189,248,0.2) 0%, rgba(9,13,26,0.12) 34%), radial-gradient(circle at 86% 16%, rgba(99,102,241,0.24) 0%, rgba(9,13,26,0.1) 32%), linear-gradient(162deg, #030712 0%, #091326 53%, #0f1f3b 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 830,
          height: 830,
          borderRadius: 999,
          left: -280,
          top: -330,
          background:
            "radial-gradient(circle, rgba(56,189,248,0.36) 0%, rgba(56,189,248,0.09) 52%, rgba(255,255,255,0) 74%)",
          filter: "blur(16px)",
          opacity: glowPulse,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 760,
          height: 760,
          borderRadius: 999,
          right: -260,
          bottom: -300,
          background:
            "radial-gradient(circle, rgba(129,140,248,0.34) 0%, rgba(99,102,241,0.08) 54%, rgba(255,255,255,0) 76%)",
          filter: "blur(16px)",
          opacity: glowPulse,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 46,
          borderRadius: 40,
          border: "1px solid rgba(148,163,184,0.25)",
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.62) 100%)",
          boxShadow:
            "0 38px 85px rgba(2,6,23,0.58), inset 0 1px 0 rgba(255,255,255,0.09)",
        }}
      />

      <Scene opacity={sceneLaunchOpacity} y={sceneLaunchRise}>
        <div
          style={{
            width: 900,
            textAlign: "center",
            transform: `translateY(${logoFloat}px) scale(${0.9 + launchIn * 0.1})`,
          }}
        >
          <div
            style={{
              margin: "0 auto",
              width: 700,
              height: 140,
              filter: `blur(${logoBlur}px)`,
              opacity: 0.55 + launchIn * 0.45,
              transform: "translateZ(0)",
              textShadow: "0 0 28px rgba(148,163,184,0.22)",
            }}
          >
            <VaultBrandMark />
          </div>

          <div
            style={{
              marginTop: 52,
              fontSize: 96,
              lineHeight: 1,
              fontWeight: 820,
              letterSpacing: "-2px",
              textTransform: "uppercase",
              background:
                "linear-gradient(90deg, #67e8f9 0%, #60a5fa 36%, #818cf8 72%, #c4b5fd 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              opacity: launchHeadlineOpacity,
              textShadow: "0 12px 34px rgba(59,130,246,0.34)",
            }}
          >
            NOW LIVE!
          </div>

          <div
            style={{
              marginTop: 16,
              fontSize: 25,
              lineHeight: 1.3,
              fontWeight: 520,
              letterSpacing: "0.4px",
              color: "#cbd5e1",
              opacity: launchTaglineOpacity,
            }}
          >
            A new digital workspace for mining teams and specialist creators.
          </div>
        </div>
      </Scene>

      <Scene opacity={sceneWhatOpacity} y={sceneWhatRise}>
        <div style={{ width: 860, textAlign: "center" }}>
          <div
            style={{
              fontSize: 66,
              lineHeight: 1.07,
              fontWeight: 760,
              letterSpacing: "-1.4px",
              color: "#f8fafc",
            }}
          >
            Digital tools built for the resources industry.
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 29,
              lineHeight: 1.34,
              fontWeight: 520,
              color: "#c7d2fe",
            }}
          >
            Templates, dashboards, planning tools and practical resources from practitioners.
          </div>
        </div>
      </Scene>

      <Scene opacity={sceneCreatorsOpacity} y={sceneCreatorsRise}>
        <div style={{ width: 930 }}>
          <div
            style={{
              textAlign: "center",
              fontSize: 46,
              lineHeight: 1.08,
              fontWeight: 730,
              letterSpacing: "-0.9px",
              color: "#f8fafc",
            }}
          >
            Tools from industry creators
          </div>

          <div
            style={{
              marginTop: 38,
              position: "relative",
              height: 274,
              overflow: "hidden",
            }}
          >
            {Array.from({ length: CREATOR_CARDS.length * 3 }).map((_, index) => {
              const item = CREATOR_CARDS[index % CREATOR_CARDS.length];
              const baseX = index * (CARD_WIDTH + CARD_GAP) - trackLength;
              const x = baseX - travel;
              const cardCenter = x + CARD_WIDTH / 2;
              const distanceFromCenter = Math.abs(cardCenter - 465);
              const focus = 1 - Math.min(1, distanceFromCenter / 340);
              const scale = 0.84 + focus * 0.2;
              const opacity = 0.34 + focus * 0.66;
              const yOffset = (1 - focus) * 16;

              return (
                <div
                  key={`${item.id}-${index}`}
                  style={{
                    position: "absolute",
                    left: x,
                    top: yOffset,
                    width: CARD_WIDTH,
                    height: 258,
                    borderRadius: 28,
                    border: `1px solid ${item.tint}4d`,
                    background:
                      "linear-gradient(170deg, rgba(15,23,42,0.86) 0%, rgba(15,23,42,0.64) 100%)",
                    boxShadow:
                      `0 22px 42px rgba(2,6,23,0.5), 0 0 24px ${item.tint}33, inset 0 1px 0 rgba(255,255,255,0.1)`,
                    opacity,
                    transform: `translateZ(0) scale(${scale})`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 18,
                  }}
                >
                  <div
                    style={{
                      width: 144,
                      height: 144,
                      borderRadius: 28,
                      border: `1px solid ${item.tint}66`,
                      background: "rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 0 22px ${item.tint}2e`,
                      overflow: "hidden",
                    }}
                  >
                    {item.logoUrl ? (
                      <img
                        src={item.logoUrl}
                        alt={item.name}
                        crossOrigin="anonymous"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          background: "rgba(2,6,23,0.45)",
                          padding: 11,
                        }}
                      />
                    ) : (
                      <MarketplaceGlyph name={item.icon} stroke={item.tint} strokeWidth={2} />
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 24,
                      lineHeight: 1.1,
                      fontWeight: 640,
                      color: "#e2e8f0",
                      letterSpacing: "-0.35px",
                    }}
                  >
                    {item.name}
                  </div>
                </div>
              );
            })}

            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 118,
                background:
                  "linear-gradient(90deg, rgba(9,15,31,0.94) 0%, rgba(9,15,31,0.66) 38%, rgba(9,15,31,0) 100%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: 118,
                background:
                  "linear-gradient(270deg, rgba(9,15,31,0.94) 0%, rgba(9,15,31,0.66) 38%, rgba(9,15,31,0) 100%)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      </Scene>

      <Scene opacity={sceneCtaOpacity} y={sceneCtaRise}>
        <div style={{ width: 900, textAlign: "center" }}>
          <div
            style={{
              margin: "0 auto",
              width: 680,
              height: 136,
              opacity: 0.96,
              filter: "drop-shadow(0 0 18px rgba(148,163,184,0.24))",
            }}
          >
            <VaultBrandMark />
          </div>

          <div
            style={{
              marginTop: 40,
              fontSize: 96,
              lineHeight: 1,
              fontWeight: 820,
              letterSpacing: "-2px",
              textTransform: "uppercase",
              background:
                "linear-gradient(90deg, #67e8f9 0%, #60a5fa 36%, #818cf8 72%, #c4b5fd 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              textShadow: "0 12px 34px rgba(59,130,246,0.34)",
            }}
          >
            NOW LIVE!
          </div>

          <div
            style={{
              margin: "18px auto 0",
              width: 280,
              height: 4,
              borderRadius: 999,
              background: "linear-gradient(90deg, rgba(103,232,249,0.04) 0%, rgba(99,102,241,0.9) 52%, rgba(196,181,253,0.04) 100%)",
              boxShadow: "0 0 22px rgba(99,102,241,0.44)",
            }}
          />
        </div>
      </Scene>
    </AbsoluteFill>
  );
};
