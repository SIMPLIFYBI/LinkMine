import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const BRANCH_RADIUS = 360;
const HUB_RADIUS = 160;

function polarOffset(degrees, radius = BRANCH_RADIUS) {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  };
}

const BRANCHES = [
  { label: "People", ...polarOffset(-145), color: "#38bdf8" },
  { label: "Jobs", ...polarOffset(-35), color: "#818cf8" },
  { label: "Knowledge", ...polarOffset(145), color: "#22d3ee" },
  { label: "Tools", ...polarOffset(90), color: "#14b8a6" },
  { label: "Talent", ...polarOffset(35), color: "#60a5fa" },
];

export const YouMineHomeReveal = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const HUB_AREA_WIDTH = 1568;
  const HUB_AREA_HEIGHT = 470;
  const HOME_CENTER_X = HUB_AREA_WIDTH / 2;
  const HOME_CENTER_Y = HUB_AREA_HEIGHT / 2;

  const clamp = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  };

  const logoSpring = spring({
    frame: frame - 6,
    fps,
    config: {
      damping: 18,
      stiffness: 110,
      mass: 0.9,
    },
  });

  const logoOpacity = interpolate(frame, [0, 18], [0, 1], clamp);
  const logoRise = interpolate(frame, [0, 20], [18, 0], clamp);

  const headlineOpacity = interpolate(frame, [24, 58], [0, 1], clamp);
  const headlineRise = interpolate(frame, [24, 58], [14, 0], clamp);

  const homeOpacity = interpolate(frame, [58, 88], [0, 1], clamp);
  const homeScale = spring({
    frame: frame - 58,
    fps,
    config: {
      damping: 18,
      stiffness: 120,
    },
  });

  const ambientPulse = interpolate(frame, [0, 130, 260, 359], [0.72, 1, 0.82, 0.72], clamp);

  return (
    <AbsoluteFill
      style={{
        fontFamily: '"Avenir Next", "Montserrat", "Segoe UI", Arial, sans-serif',
        background:
          "radial-gradient(circle at 16% 12%, rgba(56,189,248,0.22) 0%, rgba(2,6,23,0.05) 34%), radial-gradient(circle at 84% 12%, rgba(129,140,248,0.2) 0%, rgba(2,6,23,0.04) 32%), linear-gradient(180deg, #020617 0%, #0b1730 46%, #0f1d3b 100%)",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 860,
          height: 860,
          borderRadius: 999,
          background:
            "radial-gradient(circle, rgba(56,189,248,0.25) 0%, rgba(56,189,248,0.08) 52%, rgba(255,255,255,0) 76%)",
          top: -320,
          left: -250,
          filter: "blur(22px)",
          opacity: ambientPulse,
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 860,
          height: 860,
          borderRadius: 999,
          background:
            "radial-gradient(circle, rgba(129,140,248,0.24) 0%, rgba(129,140,248,0.08) 54%, rgba(255,255,255,0) 76%)",
          bottom: -340,
          right: -260,
          filter: "blur(22px)",
          opacity: ambientPulse,
        }}
      />

      <div
        style={{
          position: "relative",
          width: 1720,
          height: 920,
          borderRadius: 44,
          border: "1px solid rgba(148,163,184,0.24)",
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.86) 0%, rgba(15,23,42,0.72) 100%)",
          boxShadow:
            "0 36px 84px rgba(2,6,23,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          padding: "64px 76px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            marginTop: 0,
            textAlign: "center",
            opacity: headlineOpacity,
            transform: `translateY(${headlineRise}px)`,
          }}
        >
          <div
            style={{
              fontSize: 50,
              lineHeight: 1.14,
              fontWeight: 750,
              color: "#e2e8f0",
              letterSpacing: "-1.2px",
            }}
          >
            The digital home for the global mining industry
          </div>
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            height: HUB_AREA_HEIGHT,
            marginTop: 72,
            opacity: homeOpacity,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: HOME_CENTER_X,
              top: HOME_CENTER_Y,
              transform: `translate(-50%, -50%) scale(${0.7 + homeScale * 0.3})`,
              width: 320,
              height: 320,
              borderRadius: 999,
              background:
                "radial-gradient(circle at 40% 28%, rgba(125,211,252,0.34), rgba(30,41,59,0.92) 65%)",
              border: "1px solid rgba(125,211,252,0.35)",
              boxShadow: "0 0 0 14px rgba(14,116,144,0.16), 0 0 70px rgba(56,189,248,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div>
              <div
                style={{
                  margin: "0 auto",
                  fontSize: 44,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-0.2px",
                  padding: "0 6px",
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  background:
                    "linear-gradient(90deg, #38bdf8 0%, #60a5fa 48%, #818cf8 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                  textAlign: "center",
                }}
              >
                YouMine
              </div>
            </div>
          </div>

          {BRANCHES.map((branch, index) => {
            const start = 90 + index * 18;
            const branchProgress = spring({
              frame: frame - start,
              fps,
              config: {
                damping: 20,
                stiffness: 140,
                mass: 0.8,
              },
            });
            const labelOpacity = interpolate(frame, [start + 8, start + 24], [0, 1], clamp);

            const targetX = HOME_CENTER_X + branch.x;
            const targetY = HOME_CENTER_Y + branch.y;

            const currentX = HOME_CENTER_X + branch.x * branchProgress;
            const currentY = HOME_CENTER_Y + branch.y * branchProgress;

            const dx = targetX - HOME_CENTER_X;
            const dy = targetY - HOME_CENTER_Y;
            const centerDistance = Math.sqrt(dx * dx + dy * dy);
            const unitX = centerDistance === 0 ? 0 : dx / centerDistance;
            const unitY = centerDistance === 0 ? 0 : dy / centerDistance;

            const pillHalfWidth = 120;
            const pillHalfHeight = 34;
            const xReach = Math.abs(unitX) < 0.0001 ? Number.POSITIVE_INFINITY : pillHalfWidth / Math.abs(unitX);
            const yReach = Math.abs(unitY) < 0.0001 ? Number.POSITIVE_INFINITY : pillHalfHeight / Math.abs(unitY);
            const distanceFromPillCenterToEdge = Math.min(xReach, yReach);
            const startOffset = HUB_RADIUS;
            const lineLength = Math.max(0, centerDistance - distanceFromPillCenterToEdge - startOffset);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            const lineStartX = HOME_CENTER_X + unitX * startOffset;
            const lineStartY = HOME_CENTER_Y + unitY * startOffset;

            return (
              <React.Fragment key={branch.label}>
                <div
                  style={{
                    position: "absolute",
                    left: lineStartX,
                    top: lineStartY,
                    width: lineLength,
                    height: 2,
                    background: `linear-gradient(90deg, rgba(148,163,184,0.18) 0%, ${branch.color} 100%)`,
                    transformOrigin: "left center",
                    transform: `rotate(${angle}deg) scaleX(${branchProgress})`,
                    boxShadow: `0 0 14px ${branch.color}66`,
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: currentX - 120,
                    top: currentY - 34,
                    width: 240,
                    height: 68,
                    borderRadius: 999,
                    border: `1px solid ${branch.color}70`,
                    background: "rgba(15,23,42,0.74)",
                    boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 0 24px ${branch.color}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: labelOpacity,
                    transform: `scale(${0.88 + branchProgress * 0.12})`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#e2e8f0",
                      letterSpacing: "-0.4px",
                    }}
                  >
                    {branch.label}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

      </div>
    </AbsoluteFill>
  );
};
