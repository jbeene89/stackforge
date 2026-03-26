import { AbsoluteFill, useCurrentFrame, interpolate, Sequence } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { Scene1Awakening } from "./scenes/Scene1Awakening";
import { Scene2Perspectives } from "./scenes/Scene2Perspectives";
import { Scene3Forge } from "./scenes/Scene3Forge";
import { Scene4Tagline } from "./scenes/Scene4Tagline";
import { FONT, COLORS } from "./constants";

const PersistentBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame * 0.008) * 8;
  const drift2 = Math.cos(frame * 0.006) * 12;

  return (
    <AbsoluteFill>
      {/* Deep gradient base */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `radial-gradient(ellipse at ${50 + drift}% ${40 + drift2}%, #1a1035 0%, ${COLORS.void} 60%, #050810 100%)`,
        }}
      />

      {/* Subtle hex grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(frame, [0, 60], [0, 0.06], { extrapolateRight: "clamp" }),
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 59px, ${COLORS.gold}22 60px), repeating-linear-gradient(90deg, transparent, transparent 59px, ${COLORS.gold}22 60px)`,
          backgroundSize: "60px 60px",
          transform: `translateY(${Math.sin(frame * 0.01) * 3}px)`,
        }}
      />

      {/* Floating amber particles */}
      {[...Array(12)].map((_, i) => {
        const x = (i * 167 + frame * (0.3 + i * 0.05)) % 1920;
        const y = 200 + Math.sin(frame * 0.02 + i * 1.3) * 300 + i * 60;
        const size = 2 + Math.sin(i * 2.1) * 1.5;
        const opacity = 0.15 + Math.sin(frame * 0.03 + i) * 0.1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: i % 3 === 0 ? COLORS.gold : i % 3 === 1 ? COLORS.cyan : COLORS.violet,
              opacity,
              boxShadow: `0 0 ${size * 4}px ${i % 3 === 0 ? COLORS.gold : COLORS.cyan}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.void }}>
      <PersistentBackground />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={120}>
          <Scene1Awakening />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={140}>
          <Scene2Perspectives />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 25 })}
        />
        <TransitionSeries.Sequence durationInFrames={130}>
          <Scene3Forge />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-top" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={150}>
          <Scene4Tagline />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
