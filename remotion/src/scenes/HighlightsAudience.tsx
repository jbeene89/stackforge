import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT, COLORS } from "../constants";

const countries = [
  { code: "US", label: "United States", value: 36, color: COLORS.cyan },
  { code: "IT", label: "Italy", value: 3, color: COLORS.gold },
  { code: "GB", label: "United Kingdom", value: 2, color: COLORS.emerald },
  { code: "RU", label: "Russia", value: 1, color: COLORS.violet },
  { code: "TH", label: "Thailand", value: 1, color: COLORS.rose },
];

const devices = [
  { label: "Desktop", value: 56, pct: 70, color: COLORS.cyan },
  { label: "Mobile", value: 24, pct: 30, color: COLORS.gold },
];

export const HighlightsAudience: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 140px" }}>
      <div style={{
        fontFamily: FONT, fontSize: 22, color: COLORS.emerald,
        letterSpacing: 6, textTransform: "uppercase", fontWeight: 700,
        opacity: headerOp, marginBottom: 40,
      }}>
        Audience Breakdown
      </div>

      <div style={{ display: "flex", gap: 100 }}>
        {/* Countries */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: FONT, fontSize: 30, fontWeight: 700,
            color: COLORS.white, marginBottom: 24,
            opacity: interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" }),
          }}>
            Top Countries
          </div>
          {countries.map((c, i) => {
            const prog = spring({ frame: frame - 15 - i * 8, fps, config: { damping: 20 } });
            const barW = interpolate(prog, [0, 1], [0, (c.value / 36) * 350]);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18, opacity: prog }}>
                <div style={{ fontFamily: FONT, fontSize: 20, color: COLORS.dimWhite, width: 36, fontWeight: 700 }}>
                  {c.code}
                </div>
                <div style={{
                  height: 28, width: barW, borderRadius: 4,
                  background: `linear-gradient(90deg, ${c.color}, ${c.color}88)`,
                }} />
                <div style={{ fontFamily: FONT, fontSize: 20, color: COLORS.white, fontWeight: 700 }}>
                  {c.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Devices */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: FONT, fontSize: 30, fontWeight: 700,
            color: COLORS.white, marginBottom: 24,
            opacity: interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" }),
          }}>
            Devices
          </div>
          {devices.map((d, i) => {
            const prog = spring({ frame: frame - 30 - i * 12, fps, config: { damping: 15 } });
            return (
              <div key={i} style={{ marginBottom: 30, opacity: prog }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontFamily: FONT, fontSize: 24, color: COLORS.white, fontWeight: 700 }}>{d.label}</div>
                  <div style={{ fontFamily: FONT, fontSize: 24, color: d.color, fontWeight: 700 }}>{d.pct}%</div>
                </div>
                <div style={{ height: 16, borderRadius: 8, background: `${COLORS.voidLight}` }}>
                  <div style={{
                    height: "100%", borderRadius: 8,
                    width: `${d.pct * prog}%`,
                    background: `linear-gradient(90deg, ${d.color}, ${d.color}aa)`,
                  }} />
                </div>
              </div>
            );
          })}

          {/* Sources */}
          <div style={{
            marginTop: 30,
            opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" }),
          }}>
            <div style={{ fontFamily: FONT, fontSize: 22, color: COLORS.dimWhite, marginBottom: 12 }}>
              Top Sources
            </div>
            <div style={{ fontFamily: FONT, fontSize: 20, color: COLORS.white }}>
              Direct — 75 &nbsp;|&nbsp; lovable.dev — 4 &nbsp;|&nbsp; bing.com — 1
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
