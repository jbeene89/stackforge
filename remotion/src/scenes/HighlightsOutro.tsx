import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT, COLORS } from "../constants";

const stats = [
  { label: "Visitors", value: "81", color: COLORS.cyan },
  { label: "Pageviews", value: "90", color: COLORS.gold },
  { label: "Countries", value: "5", color: COLORS.emerald },
  { label: "Peak Day", value: "Sat", color: COLORS.rose },
];

export const HighlightsOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(
    spring({ frame, fps, config: { damping: 18 } }),
    [0, 1], [50, 0]
  );

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Glow */}
      <div style={{
        position: "absolute", width: 800, height: 800, borderRadius: "50%",
        background: `radial-gradient(circle, ${COLORS.gold}15 0%, transparent 60%)`,
        transform: `scale(${1 + Math.sin(frame * 0.06) * 0.03})`,
      }} />

      <div style={{ textAlign: "center", zIndex: 1 }}>
        {/* Stats row */}
        <div style={{ display: "flex", gap: 60, justifyContent: "center", marginBottom: 60 }}>
          {stats.map((s, i) => {
            const prog = spring({ frame: frame - 5 - i * 8, fps, config: { damping: 14 } });
            return (
              <div key={i} style={{ opacity: prog, transform: `scale(${prog})` }}>
                <div style={{
                  fontFamily: FONT, fontSize: 64, fontWeight: 700,
                  color: s.color, lineHeight: 1,
                }}>
                  {s.value}
                </div>
                <div style={{
                  fontFamily: FONT, fontSize: 18, color: COLORS.dimWhite,
                  marginTop: 8, letterSpacing: 2, textTransform: "uppercase",
                }}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Closing text */}
        <div style={{
          fontFamily: FONT, fontSize: 52, fontWeight: 700,
          color: COLORS.white, opacity: titleOp,
          transform: `translateY(${titleY}px)`, letterSpacing: -1,
        }}>
          Building momentum.
        </div>

        <div style={{
          width: interpolate(frame, [30, 60], [0, 300], { extrapolateRight: "clamp" }),
          height: 3,
          background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
          margin: "20px auto",
        }} />

        <div style={{
          fontFamily: FONT, fontSize: 26, color: COLORS.dimWhite,
          opacity: interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" }),
          letterSpacing: 4,
        }}>
          soupylab.lovable.app
        </div>
      </div>
    </AbsoluteFill>
  );
};
