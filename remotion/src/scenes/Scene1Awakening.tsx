import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FONT, COLORS } from "../MainVideo";

export const Scene1Awakening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dramatic line that slashes across screen
  const lineWidth = interpolate(frame, [10, 35], [0, 1920], { extrapolateRight: "clamp" });
  const lineOpacity = interpolate(frame, [10, 20, 90, 110], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Title springs in
  const titleSpring = spring({ frame: frame - 25, fps, config: { damping: 15, stiffness: 180 } });
  const titleY = interpolate(titleSpring, [0, 1], [80, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  // Subtitle fades in
  const subOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subY = interpolate(frame, [50, 70], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Hex ring rotation
  const rotation = frame * 0.5;

  // Pulsing glow
  const glowIntensity = 0.3 + Math.sin(frame * 0.08) * 0.15;

  return (
    <AbsoluteFill>
      {/* Central glow */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.gold}${Math.round(glowIntensity * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
        }}
      />

      {/* Rotating hex ring */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          width: 300,
          height: 300,
          opacity: interpolate(frame, [15, 40], [0, 0.25], { extrapolateRight: "clamp" }),
        }}
      >
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 4,
              height: 80,
              background: `linear-gradient(to bottom, ${COLORS.gold}, transparent)`,
              transformOrigin: "top center",
              transform: `rotate(${angle}deg) translateY(-120px)`,
              opacity: 0.6 + Math.sin(frame * 0.05 + i) * 0.3,
            }}
          />
        ))}
      </div>

      {/* Slash line */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: lineWidth,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${COLORS.gold}, ${COLORS.cyan}, transparent)`,
          opacity: lineOpacity,
          boxShadow: `0 0 20px ${COLORS.gold}`,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          transform: `translate(-50%, -50%) translateY(${titleY}px)`,
          opacity: titleOpacity,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 96,
            color: COLORS.white,
            letterSpacing: "-2px",
            textShadow: `0 0 40px ${COLORS.gold}55`,
          }}
        >
          SOUPY
          <span style={{ color: COLORS.gold }}> LAB</span>
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "58%",
          transform: `translate(-50%, -50%) translateY(${subY}px)`,
          opacity: subOpacity,
          fontFamily: FONT,
          fontWeight: 400,
          fontSize: 28,
          color: COLORS.dimWhite,
          letterSpacing: "8px",
          textTransform: "uppercase",
        }}
      >
        THE FORGE AWAKENS
      </div>
    </AbsoluteFill>
  );
};
