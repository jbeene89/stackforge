import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { HighlightsIntro } from "./scenes/HighlightsIntro";
import { HighlightsTraffic } from "./scenes/HighlightsTraffic";
import { HighlightsAudience } from "./scenes/HighlightsAudience";
import { HighlightsPages } from "./scenes/HighlightsPages";
import { HighlightsOutro } from "./scenes/HighlightsOutro";
import { COLORS } from "./constants";

const PersistentBG: React.FC = () => {
  const frame = useCurrentFrame();
  const dx = Math.sin(frame * 0.006) * 10;
  const dy = Math.cos(frame * 0.008) * 8;

  return (
    <AbsoluteFill>
      <div style={{
        width: "100%", height: "100%",
        background: `radial-gradient(ellipse at ${50 + dx}% ${45 + dy}%, #111830 0%, ${COLORS.void} 55%, #04060d 100%)`,
      }} />
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: interpolate(frame, [0, 40], [0, 0.04], { extrapolateRight: "clamp" }),
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 79px, ${COLORS.cyan}18 80px), repeating-linear-gradient(90deg, transparent, transparent 79px, ${COLORS.cyan}18 80px)`,
        backgroundSize: "80px 80px",
      }} />
      {/* Particles */}
      {[...Array(8)].map((_, i) => {
        const x = (i * 240 + frame * (0.2 + i * 0.04)) % 1920;
        const y = 300 + Math.sin(frame * 0.015 + i * 1.5) * 250 + i * 50;
        const s = 2 + Math.sin(i * 2.5) * 1;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, width: s, height: s,
            borderRadius: "50%",
            background: i % 2 === 0 ? COLORS.cyan : COLORS.gold,
            opacity: 0.12 + Math.sin(frame * 0.025 + i) * 0.06,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

export const HighlightsVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.void }}>
      <PersistentBG />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={100}>
          <HighlightsIntro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={130}>
          <HighlightsTraffic />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={130}>
          <HighlightsAudience />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-top" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={130}>
          <HighlightsPages />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 25 })}
        />
        <TransitionSeries.Sequence durationInFrames={120}>
          <HighlightsOutro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
