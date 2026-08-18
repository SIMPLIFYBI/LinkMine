import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const VaultReveal = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const clamp = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  };

  const fadeIn = (start, duration = 12) =>
    interpolate(frame, [start, start + duration], [0, 1], clamp);

  const riseIn = (start, duration = 12, distance = 12) =>
    interpolate(frame, [start, start + duration], [distance, 0], clamp);

  const finalFade = interpolate(frame, [270, 299], [1, 0], clamp);

  const logoSpring = spring({
    frame: frame - 25,
    fps,
    config: {
      damping: 20,
      stiffness: 90,
      mass: 0.8,
    },
  });

  const typingStart = 28;
  const framesPerLetter = 7;

  const lettersToShow = Math.max(
    0,
    Math.min(5, Math.floor((frame - typingStart) / framesPerLetter) + 1)
  );

  const vaultLetters = ["V", "Λ", "U", "L", "T"];

  const dividerProgress = interpolate(frame, [75, 91], [0, 1], clamp);

  const brandFade = fadeIn(96, 16);
  const brandRise = riseIn(96, 16, 8);

  const comingSoonFade = fadeIn(140, 18);
  const comingSoonRise = riseIn(140, 18, 7);
  const glowPulse = interpolate(frame, [0, 120, 240, 299], [0.6, 1, 0.75, 0.6], clamp);

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 18% 12%, #e0f2fe 0%, #f8fafc 30%, #eef2ff 58%, #f8fafc 100%)",
        justifyContent: "center",
        alignItems: "center",
        opacity: finalFade,
        overflow: "hidden",
        fontFamily:
          'Avenir Next, Montserrat, "Segoe UI", Arial, sans-serif',
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 760,
          height: 760,
          borderRadius: 999,
          background:
            "radial-gradient(circle, rgba(56, 189, 248, 0.26) 0%, rgba(99, 102, 241, 0.08) 52%, rgba(255, 255, 255, 0) 76%)",
          top: -220,
          left: -170,
          filter: "blur(10px)",
          opacity: glowPulse,
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 690,
          height: 690,
          borderRadius: 999,
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(14, 116, 144, 0.06) 56%, rgba(255, 255, 255, 0) 78%)",
          right: -210,
          bottom: -240,
          filter: "blur(14px)",
          opacity: glowPulse,
        }}
      />

      <div
        style={{
          width: "94%",
          maxWidth: 1040,
          height: "78%",
          maxHeight: 840,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${1.08 + logoSpring * 0.03})`,
          borderRadius: 40,
          padding: "52px 54px",
          background:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(244, 248, 255, 0.84) 100%)",
          border: "1px solid rgba(148, 163, 184, 0.22)",
          boxShadow:
            "0 40px 90px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(2px)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              paddingRight: 32,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -44,
                left: 2,
                fontSize: 32,
                lineHeight: 1,
                fontWeight: 600,
                letterSpacing: "-0.5px",
                color: "#111827",
                opacity: fadeIn(10, 12),
                transform: `translateY(${riseIn(10, 12, 8)}px)`,
              }}
            >
              The
            </div>

            <div
              style={{
                height: 130,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                whiteSpace: "nowrap",
                fontSize: 126,
                lineHeight: "130px",
                fontWeight: 750,
                letterSpacing: "-5px",
                color: "#111827",
                textShadow: "0 1px 0 rgba(255, 255, 255, 0.8)",
              }}
            >
              {vaultLetters.map((letter, index) => {
                const visible = index < lettersToShow;

                return (
                  <span
                    key={index}
                    style={{
                      display: visible ? "inline" : "none",
                      ...(letter === "Λ"
                        ? {
                            background:
                              "linear-gradient(90deg, #38bdf8 0%, #3b82f6 48%, #6366f1 100%)",
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            color: "transparent",
                            WebkitTextFillColor: "transparent",
                            textShadow: "none",
                          }
                        : {
                            color: "#111827",
                          }),
                    }}
                  >
                    {letter}
                  </span>
                );
              })}
            </div>
          </div>

          <div
            style={{
              width: 2,
              height: 102,
              background:
                "linear-gradient(180deg, rgba(56, 189, 248, 0.76) 0%, rgba(148, 163, 184, 0.46) 100%)",
              transform: `scaleY(${dividerProgress})`,
              transformOrigin: "top center",
              opacity: fadeIn(75, 10),
              flexShrink: 0,
              boxShadow: "0 0 12px rgba(56, 189, 248, 0.35)",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "baseline",
              paddingLeft: 32,
              whiteSpace: "nowrap",
              opacity: brandFade,
              transform: `translateY(${brandRise}px)`,
            }}
          >
            <span
              style={{
                marginRight: 9,
                fontSize: 34,
                lineHeight: 1,
                fontWeight: 500,
                letterSpacing: "-0.5px",
                color: "#6b7280",
              }}
            >
              by
            </span>

            <span
              style={{
                fontSize: 64,
                lineHeight: 1,
                fontWeight: 800,
                letterSpacing: "-2.8px",
                background:
                  "linear-gradient(90deg, #38bdf8 0%, #3b82f6 48%, #6366f1 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                textShadow: "0 0 20px rgba(59, 130, 246, 0.2)",
              }}
            >
              YouMine.
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: 58,
            display: "block",
            fontSize: 24,
            lineHeight: "32px",
            fontWeight: 650,
            letterSpacing: "8px",
            color: "#64748b",
            whiteSpace: "nowrap",
            textTransform: "uppercase",
            opacity: comingSoonFade,
            transform: `translateY(${comingSoonRise}px)`,
            padding: "10px 22px 8px",
            borderRadius: 999,
            border: "1px solid rgba(148, 163, 184, 0.35)",
            background: "rgba(255, 255, 255, 0.66)",
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
          }}
        >
          COMING SOON
        </div>
      </div>
    </AbsoluteFill>
  );
};
