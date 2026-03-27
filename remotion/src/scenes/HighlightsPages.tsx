import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT, COLORS } from "../constants";

const pages = [
  { path: "/", views: 72, pct: 80 },
  { path: "/login", views: 7, pct: 8 },
  { path: "/pricing", views: 2, pct: 2 },
  { path: "/signup", views: 1, pct: 1 },
  { path: "/marketplace", views: 1, pct: 1 },
  { path: "/white-paper", views: 1, pct: 1 },
];

export const HighlightsPages: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 200px" }}>
      <div style={{
        fontFamily: FONT, fontSize: 22, color: COLORS.violet,
        letterSpacing: 6, textTransform: "uppercase", fontWeight: 700,
        opacity: headerOp, marginBottom: 16,
      }}>
        Top Pages
      </div>

      <div style={{
        fontFamily: FONT, fontSize: 48, fontWeight: 700, color: COLORS.white,
        marginBottom: 50,
        opacity: interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        Where visitors spent their time
      </div>

      {pages.map((p, i) => {
        const prog = spring({ frame: frame - 15 - i * 7, fps, config: { damping: 18 } });
        const barW = interpolate(prog, [0, 1], [0, (p.views / 72) * 800]);
        const isTop = i === 0;
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 20,
            marginBottom: 16, opacity: prog,
          }}>
            <div style={{
              fontFamily: FONT, fontSize: 22, color: isTop ? COLORS.gold : COLORS.dimWhite,
              width: 160, fontWeight: 700, textAlign: "right",
            }}>
              {p.path}
            </div>
            <div style={{
              height: 32, width: barW, borderRadius: 6,
              background: isTop
                ? `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.gold}88)`
                : `linear-gradient(90deg, ${COLORS.violet}cc, ${COLORS.violet}55)`,
              boxShadow: isTop ? `0 0 16px ${COLORS.gold}33` : "none",
            }} />
            <div style={{
              fontFamily: FONT, fontSize: 22, fontWeight: 700,
              color: isTop ? COLORS.gold : COLORS.white,
            }}>
              {p.views}
            </div>
          </div>
        );
      })}

      {/* Insight */}
      {(() => {
        const insightOp = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });
        return (
          <div style={{
            marginTop: 40, fontFamily: FONT, fontSize: 24, color: COLORS.cyan,
            opacity: insightOp, fontWeight: 700,
          }}>
            80% of traffic landed on the homepage — strong single entry point
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
