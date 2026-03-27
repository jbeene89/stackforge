import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT, COLORS } from "../constants";

const dailyData = [
  { day: "Thu", value: 0 },
  { day: "Fri", value: 12 },
  { day: "Sat", value: 28 },
  { day: "Sun", value: 11 },
  { day: "Mon", value: 19 },
  { day: "Tue", value: 7 },
  { day: "Wed", value: 4 },
];
const maxVal = 28;

export const HighlightsTraffic: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const bigNumberScale = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 100 } });
  const bigNumberOp = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 140px" }}>
      {/* Section label */}
      <div style={{
        fontFamily: FONT, fontSize: 22, color: COLORS.cyan,
        letterSpacing: 6, textTransform: "uppercase", fontWeight: 700,
        opacity: headerOp, marginBottom: 12,
      }}>
        Total Visitors
      </div>

      {/* Big number */}
      <div style={{
        fontFamily: FONT, fontSize: 180, fontWeight: 700, color: COLORS.white,
        lineHeight: 1, opacity: bigNumberOp,
        transform: `scale(${bigNumberScale})`,
        marginBottom: 8,
      }}>
        81
      </div>

      <div style={{
        fontFamily: FONT, fontSize: 28, color: COLORS.dimWhite,
        opacity: bigNumberOp, marginBottom: 50, letterSpacing: 1,
      }}>
        visitors across 90 pageviews
      </div>

      {/* Bar chart */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 28, height: 220 }}>
        {dailyData.map((d, i) => {
          const barProgress = interpolate(
            spring({ frame: frame - 25 - i * 6, fps, config: { damping: 15, stiffness: 80 } }),
            [0, 1], [0, 1]
          );
          const barHeight = (d.value / maxVal) * 180 * barProgress;
          const isMax = d.value === maxVal;

          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              {/* Value label */}
              <div style={{
                fontFamily: FONT, fontSize: 18, fontWeight: 700,
                color: isMax ? COLORS.gold : COLORS.dimWhite,
                opacity: barProgress,
              }}>
                {d.value > 0 ? d.value : ""}
              </div>
              {/* Bar */}
              <div style={{
                width: 60, height: barHeight, borderRadius: 6,
                background: isMax
                  ? `linear-gradient(180deg, ${COLORS.gold}, ${COLORS.gold}88)`
                  : `linear-gradient(180deg, ${COLORS.cyan}, ${COLORS.cyan}66)`,
                boxShadow: isMax ? `0 0 20px ${COLORS.gold}44` : "none",
                minHeight: d.value > 0 ? 8 : 0,
              }} />
              {/* Day label */}
              <div style={{
                fontFamily: FONT, fontSize: 16, color: COLORS.dimWhite,
                opacity: barProgress,
              }}>
                {d.day}
              </div>
            </div>
          );
        })}
      </div>

      {/* Peak callout */}
      {(() => {
        const peakOp = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp" });
        return (
          <div style={{
            marginTop: 30, fontFamily: FONT, fontSize: 22, color: COLORS.gold,
            opacity: peakOp, fontWeight: 700, letterSpacing: 1,
          }}>
            ▲ Peak: 28 visitors on Saturday
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
