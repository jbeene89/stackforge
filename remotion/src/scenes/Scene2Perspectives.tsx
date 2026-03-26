import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT, COLORS } from "../MainVideo";

const perspectives = [
  { name: "AXIOM", role: "Builder", color: COLORS.cyan, symbol: "◆" },
  { name: "LYRA", role: "Empath", color: COLORS.rose, symbol: "♥" },
  { name: "FLUX", role: "Breaker", color: COLORS.gold, symbol: "⚡" },
  { name: "SENTINEL", role: "Red Team", color: COLORS.emerald, symbol: "◈" },
  { name: "PRISM", role: "Systems", color: COLORS.violet, symbol: "◎" },
];

export const Scene2Perspectives: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {/* Header */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 80,
          fontFamily: FONT,
          fontWeight: 400,
          fontSize: 18,
          color: COLORS.dimWhite,
          letterSpacing: "6px",
          textTransform: "uppercase",
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        FIVE COGNITIVE LENSES
      </div>

      {/* Perspective cards stagger in */}
      {perspectives.map((p, i) => {
        const delay = 10 + i * 18;
        const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 200 } });
        const x = interpolate(s, [0, 1], [-120, 0]);
        const opacity = interpolate(s, [0, 1], [0, 1]);

        // Card position
        const cardY = 200 + i * 140;
        const cardX = 120 + (i % 2 === 0 ? 0 : 60);

        // Pulse effect
        const pulse = 0.5 + Math.sin(frame * 0.06 + i * 1.2) * 0.3;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cardX + x,
              top: cardY,
              opacity,
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            {/* Icon circle */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                border: `2px solid ${p.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                color: p.color,
                boxShadow: `0 0 ${20 * pulse}px ${p.color}44`,
                background: `${p.color}11`,
              }}
            >
              {p.symbol}
            </div>

            {/* Text */}
            <div>
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: 36,
                  color: p.color,
                  letterSpacing: "3px",
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 400,
                  fontSize: 16,
                  color: COLORS.dimWhite,
                  letterSpacing: "4px",
                  textTransform: "uppercase",
                  marginTop: 4,
                }}
              >
                {p.role}
              </div>
            </div>
          </div>
        );
      })}

      {/* Right side: converging lines */}
      <div style={{ position: "absolute", right: 200, top: "50%", transform: "translateY(-50%)" }}>
        {perspectives.map((p, i) => {
          const delay = 30 + i * 15;
          const lineLen = interpolate(frame, [delay, delay + 30], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const angle = -40 + i * 20;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                right: 0,
                top: (i - 2) * 50,
                width: lineLen,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${p.color})`,
                transform: `rotate(${angle}deg)`,
                transformOrigin: "right center",
                boxShadow: `0 0 10px ${p.color}66`,
              }}
            />
          );
        })}

        {/* Convergence point */}
        <div
          style={{
            position: "absolute",
            right: -20,
            top: -20,
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `2px solid ${COLORS.gold}`,
            opacity: interpolate(frame, [80, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            boxShadow: `0 0 30px ${COLORS.gold}44`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
