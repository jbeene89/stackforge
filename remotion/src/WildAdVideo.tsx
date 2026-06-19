import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont as loadOrbitron } from "@remotion/google-fonts/Orbitron";
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono";
import { COLORS } from "./constants";

const { fontFamily: ORBITRON } = loadOrbitron("normal", {
  weights: ["700", "900"],
  subsets: ["latin"],
});
const { fontFamily: MONO } = loadSpaceMono("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

type Shot = {
  src: string;
  caption: string;
  sub: string;
};

const SHOTS_SQUARE: Shot[] = [
  { src: "images/fpv-phone-sidewalk-clean.jpg", caption: "ON THE STREET.", sub: "// no signal needed" },
  { src: "images/fpv-phone-cafe-clean.jpg", caption: "AT THE CAFE.", sub: "// no API keys" },
  { src: "images/fpv-phone-park-clean.jpg", caption: "IN THE PARK.", sub: "// no cloud" },
  { src: "images/fpv-phone-rooftop-clean.jpg", caption: "ON THE ROOF.", sub: "// no subscription" },
];

const SHOTS_VERTICAL: Shot[] = [
  { src: "images/fpv-phone-subway-clean.jpg", caption: "UNDERGROUND.", sub: "// still running" },
  { src: "images/fpv-phone-airport-clean.jpg", caption: "AIRPLANE MODE.", sub: "// still working" },
  { src: "images/fpv-phone-sidewalk-clean.jpg", caption: "ON THE STREET.", sub: "// no signal needed" },
  { src: "images/fpv-phone-rooftop-clean.jpg", caption: "AFTER HOURS.", sub: "// no subscription" },
];

// Each shot: 90 frames (3s). Stagger: zoom + caption slide.
const SHOT_DURATION = 90;

const ShotScene: React.FC<{ shot: Shot }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow Ken Burns zoom
  const scale = interpolate(frame, [0, SHOT_DURATION], [1.05, 1.18]);
  const drift = interpolate(frame, [0, SHOT_DURATION], [0, -20]);

  // Caption enter + exit
  const enterS = spring({ frame: frame - 8, fps, config: { damping: 18 } });
  const exitFade = interpolate(frame, [SHOT_DURATION - 12, SHOT_DURATION], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = enterS * exitFade;
  const ty = interpolate(enterS, [0, 1], [40, 0]);

  // Image fade in / out
  const imgFade = interpolate(
    frame,
    [0, 8, SHOT_DURATION - 10, SHOT_DURATION],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ background: COLORS.void }}>
      <AbsoluteFill style={{ opacity: imgFade }}>
        <Img
          src={staticFile(shot.src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale}) translateY(${drift}px)`,
          }}
        />
      </AbsoluteFill>
      {/* Cinematic gradient overlay */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.85) 100%)",
          opacity: imgFade,
        }}
      />
      {/* Caption block */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 100,
          opacity,
        }}
      >
        <div
          style={{
            transform: `translateY(${ty}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 22,
              color: COLORS.cyan,
              letterSpacing: 6,
              marginBottom: 14,
            }}
          >
            {shot.sub}
          </div>
          <div
            style={{
              fontFamily: ORBITRON,
              fontWeight: 900,
              fontSize: 78,
              color: COLORS.white,
              letterSpacing: -1,
              textShadow: "0 4px 30px rgba(0,0,0,0.8)",
            }}
          >
            {shot.caption}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  const lineW = interpolate(frame, [20, 60], [0, 100], { extrapolateRight: "clamp" });
  const fade = interpolate(frame, [60, 75], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, #0a1828 0%, ${COLORS.void} 70%)`,
        alignItems: "center",
        justifyContent: "center",
        opacity: fade,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 24,
          color: COLORS.gold,
          letterSpacing: 8,
          marginBottom: 30,
          opacity: s,
        }}
      >
        // YOUR AI · ANYWHERE
      </div>
      <div
        style={{
          fontFamily: ORBITRON,
          fontWeight: 900,
          fontSize: 110,
          color: COLORS.white,
          textAlign: "center",
          lineHeight: 1.05,
          letterSpacing: -3,
          transform: `translateY(${interpolate(s, [0, 1], [60, 0])}px)`,
          opacity: s,
        }}
      >
        NO CLOUD.
        <br />
        <span style={{ color: COLORS.cyan }}>NO LIMITS.</span>
      </div>
      <div
        style={{
          width: `${lineW}%`,
          maxWidth: 600,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${COLORS.cyan}, transparent)`,
          marginTop: 40,
        }}
      />
    </AbsoluteFill>
  );
};

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoS = spring({ frame, fps, config: { damping: 12 } });
  const ctaS = spring({ frame: frame - 20, fps, config: { damping: 14 } });
  const url = spring({ frame: frame - 40, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, #0a1828 0%, ${COLORS.void} 70%)`,
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          fontFamily: ORBITRON,
          fontWeight: 900,
          fontSize: 120,
          color: COLORS.white,
          letterSpacing: -3,
          transform: `scale(${interpolate(logoS, [0, 1], [0.7, 1])})`,
          opacity: logoS,
          textShadow: `0 0 50px ${COLORS.cyan}`,
        }}
      >
        SOUPY<span style={{ color: COLORS.cyan }}>LAB</span>
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 26,
          color: COLORS.gold,
          letterSpacing: 4,
          marginTop: 24,
          opacity: ctaS,
        }}
      >
        // MOBILE APP — DROPPING SOON
      </div>
      <div
        style={{
          marginTop: 60,
          padding: "20px 46px",
          border: `2px solid ${COLORS.cyan}`,
          borderRadius: 8,
          fontFamily: ORBITRON,
          fontWeight: 700,
          fontSize: 36,
          color: COLORS.white,
          letterSpacing: 5,
          background: "rgba(0,212,255,0.08)",
          boxShadow: `0 0 40px rgba(0,212,255,0.4)`,
          transform: `translateY(${interpolate(url, [0, 1], [40, 0])}px)`,
          opacity: url,
        }}
      >
        SOUPYLAB.COM
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: MONO,
          fontSize: 22,
          color: COLORS.dimWhite,
          letterSpacing: 2,
          opacity: url,
        }}
      >
        join the waitlist · 50 free credits
      </div>
    </AbsoluteFill>
  );
};

export const WildAdVideo: React.FC<{ vertical?: boolean }> = ({ vertical = false }) => {
  const shots = vertical ? SHOTS_VERTICAL : SHOTS_SQUARE;
  const HOOK = 75;
  const CTA = 105;
  return (
    <AbsoluteFill style={{ background: COLORS.void }}>
      <Sequence from={0} durationInFrames={HOOK}>
        <HookScene />
      </Sequence>
      {shots.map((shot, i) => (
        <Sequence
          key={i}
          from={HOOK + i * SHOT_DURATION}
          durationInFrames={SHOT_DURATION}
        >
          <ShotScene shot={shot} />
        </Sequence>
      ))}
      <Sequence from={HOOK + shots.length * SHOT_DURATION} durationInFrames={CTA}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};

export const WildAdVideoSquare: React.FC = () => <WildAdVideo vertical={false} />;
export const WildAdVideoVertical: React.FC = () => <WildAdVideo vertical={true} />;
