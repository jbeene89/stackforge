import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT, COLORS } from "../constants";

const features = [
  { label: "TRAIN", sub: "Edge-native fine-tuning", color: COLORS.cyan },
  { label: "BUILD", sub: "Multi-agent pipelines", color: COLORS.gold },
  { label: "DEPLOY", sub: "Phone-ready inference", color: COLORS.emerald },
  { label: "EVOLVE", sub: "Recursive self-improvement", color: COLORS.violet },
];

export const Scene3Forge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spinning forge ring
  const ringRotation = frame * 0.8;
  const ringScale = interpolate(
    spring({ frame: frame - 5, fps, config: { damping: 20, stiffness: 120 } }),
    [0, 1],
    [0.3, 1]
  );
  const ringOpacity = interpolate(frame, [0, 20], [0, 0.6], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {/* Central forge ring */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) rotate(${ringRotation}deg) scale(${ringScale})`,
          width: 400,
          height: 400,
          borderRadius: "50%",
          border: `3px solid ${COLORS.gold}44`,
          opacity: ringOpacity,
          boxShadow: `0 0 60px ${COLORS.gold}22, inset 0 0 60px ${COLORS.gold}11`,
        }}
      >
        {/* Inner ring */}
        <div
          style={{
            position: "absolute",
            inset: 40,
            borderRadius: "50%",
            border: `1px solid ${COLORS.cyan}33`,
          }}
        />
        {/* Dots on ring */}
        {[0, 90, 180, 270].map((angle, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: features[i].color,
              transform: `rotate(${angle}deg) translateY(-200px) translate(-50%, -50%)`,
              boxShadow: `0 0 20px ${features[i].color}`,
            }}
          />
        ))}
      </div>

      {/* Feature labels at 4 corners */}
      {features.map((f, i) => {
        const delay = 20 + i * 20;
        const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 200 } });
        const opacity = interpolate(s, [0, 1], [0, 1]);
        const scale = interpolate(s, [0, 1], [0.7, 1]);

        const positions = [
          { left: 140, top: 180 },
          { right: 140, top: 180 },
          { left: 140, bottom: 180 },
          { right: 140, bottom: 180 },
        ];
        const pos = positions[i];

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              ...pos,
              opacity,
              transform: `scale(${scale})`,
              textAlign: i % 2 === 0 ? "left" : "right",
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 48,
                color: f.color,
                letterSpacing: "4px",
                textShadow: `0 0 30px ${f.color}44`,
              }}
            >
              {f.label}
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 400,
                fontSize: 16,
                color: COLORS.dimWhite,
                letterSpacing: "2px",
                marginTop: 8,
              }}
            >
              {f.sub}
            </div>
          </div>
        );
      })}

      {/* Center text */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          opacity: interpolate(frame, [70, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 32,
            color: COLORS.white,
            letterSpacing: "6px",
          }}
        >
          YOUR FORGE
        </div>
      </div>
    </AbsoluteFill>
  );
};
