import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT, COLORS } from "../MainVideo";

export const Scene4Tagline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Main tagline reveal - word by word
  const words = ["BUILD", "DIFFERENT."];
  const wordElements = words.map((word, i) => {
    const delay = 15 + i * 25;
    const s = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 200 } });
    const y = interpolate(s, [0, 1], [60, 0]);
    const opacity = interpolate(s, [0, 1], [0, 1]);
    const scale = interpolate(s, [0, 1], [0.8, 1]);
    return { word, y, opacity, scale, color: i === 1 ? COLORS.gold : COLORS.white };
  });

  // URL reveal
  const urlOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const urlY = interpolate(frame, [80, 100], [15, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Bottom line
  const bottomLineWidth = interpolate(frame, [90, 120], [0, 400], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Final glow pulse
  const finalGlow = frame > 100 ? 0.15 + Math.sin((frame - 100) * 0.06) * 0.1 : 0;

  return (
    <AbsoluteFill>
      {/* Cinematic center glow */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "45%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${COLORS.gold}${Math.round(finalGlow * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
        }}
      />

      {/* Main tagline */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          gap: 30,
          alignItems: "baseline",
        }}
      >
        {wordElements.map((w, i) => (
          <div
            key={i}
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 120,
              color: w.color,
              letterSpacing: "-3px",
              transform: `translateY(${w.y}px) scale(${w.scale})`,
              opacity: w.opacity,
              textShadow: i === 1 ? `0 0 50px ${COLORS.gold}44` : "none",
            }}
          >
            {w.word}
          </div>
        ))}
      </div>

      {/* URL */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "60%",
          transform: `translate(-50%, 0) translateY(${urlY}px)`,
          opacity: urlOpacity,
          fontFamily: FONT,
          fontWeight: 400,
          fontSize: 22,
          color: COLORS.dimWhite,
          letterSpacing: "4px",
        }}
      >
        stackforge.lovable.app
      </div>

      {/* Bottom accent line */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "67%",
          transform: "translateX(-50%)",
          width: bottomLineWidth,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
        }}
      />

      {/* Tiny badge */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 100,
          transform: "translateX(-50%)",
          opacity: interpolate(frame, [110, 130], [0, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          fontFamily: FONT,
          fontWeight: 400,
          fontSize: 12,
          color: COLORS.dimWhite,
          letterSpacing: "6px",
          textTransform: "uppercase",
        }}
      >
        POWERED BY POPCORN INJECTION
      </div>
    </AbsoluteFill>
  );
};
