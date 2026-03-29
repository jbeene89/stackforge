import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT, COLORS } from "../constants";

export const HighlightsIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(
    spring({ frame, fps, config: { damping: 18, stiffness: 120 } }),
    [0, 1], [80, 0]
  );
  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });

  const subtitleOp = interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" });
  const subtitleY = interpolate(
    spring({ frame: frame - 15, fps, config: { damping: 20 } }),
    [0, 1], [40, 0]
  );

  const dateOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });

  const lineWidth = interpolate(frame, [10, 50], [0, 400], { extrapolateRight: "clamp" });

  const pulseScale = 1 + Math.sin(frame * 0.08) * 0.02;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Radial glow */}
      <div style={{
        position: "absolute",
        width: 600, height: 600,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${COLORS.cyan}20 0%, transparent 70%)`,
        transform: `scale(${pulseScale})`,
      }} />

      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{
          fontFamily: FONT,
          fontSize: 28,
          fontWeight: 700,
          color: COLORS.cyan,
          letterSpacing: 8,
          textTransform: "uppercase",
          opacity: dateOp,
          marginBottom: 20,
        }}>
          Mar 20 – Mar 26, 2026
        </div>

        <div style={{
          fontFamily: FONT,
          fontSize: 90,
          fontWeight: 700,
          color: COLORS.white,
          lineHeight: 1.1,
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          letterSpacing: -2,
        }}>
          Weekly Highlights
        </div>

        {/* Accent line */}
        <div style={{
          width: lineWidth,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
          margin: "24px auto",
        }} />

        <div style={{
          fontFamily: FONT,
          fontSize: 32,
          color: COLORS.dimWhite,
          opacity: subtitleOp,
          transform: `translateY(${subtitleY}px)`,
          letterSpacing: 2,
        }}>
          SoupyLab
        </div>
      </div>
    </AbsoluteFill>
  );
};
