import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";
import { loadFont as loadOrbitron } from "@remotion/google-fonts/Orbitron";
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono";
import { COLORS } from "./constants";

const { fontFamily: ORBITRON } = loadOrbitron("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin"],
});
const { fontFamily: MONO } = loadSpaceMono("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

// Persistent cosmic backdrop --------------------------------------------------
const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 80) * 30;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at ${50 + drift / 4}% ${30 + drift / 6}%, #102036 0%, ${COLORS.void} 55%, #04060c 100%)`,
      }}
    >
      {/* Star field */}
      {Array.from({ length: 60 }).map((_, i) => {
        const seed = i * 37.17;
        const x = (seed * 13) % 100;
        const y = (seed * 7) % 100;
        const size = ((seed * 3) % 3) + 1;
        const tw = 0.3 + (Math.sin(frame / 20 + i) + 1) / 2 * 0.7;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: 999,
              background: i % 7 === 0 ? COLORS.gold : COLORS.cyan,
              opacity: tw * 0.8,
              boxShadow: `0 0 ${size * 4}px currentColor`,
              color: i % 7 === 0 ? COLORS.gold : COLORS.cyan,
            }}
          />
        );
      })}
      {/* Scan grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
    </AbsoluteFill>
  );
};

// Phone silhouette -----------------------------------------------------------
const Phone: React.FC<{ progress: number }> = ({ progress }) => {
  const frame = useCurrentFrame();
  const float = Math.sin(frame / 30) * 8;
  return (
    <div
      style={{
        position: "relative",
        width: 360,
        height: 720,
        borderRadius: 56,
        background: "linear-gradient(180deg, #0c1424 0%, #050810 100%)",
        border: `2px solid ${COLORS.cyan}`,
        boxShadow: `0 0 80px rgba(0,212,255,0.5), inset 0 0 40px rgba(0,212,255,0.15)`,
        transform: `translateY(${float}px) scale(${0.6 + progress * 0.4})`,
        opacity: progress,
        overflow: "hidden",
      }}
    >
      {/* notch */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: "50%",
          transform: "translateX(-50%)",
          width: 110,
          height: 28,
          background: "#000",
          borderRadius: 999,
        }}
      />
      {/* inner screen content */}
      <div
        style={{
          position: "absolute",
          inset: 16,
          top: 60,
          borderRadius: 40,
          background: "radial-gradient(circle at 50% 30%, #0a3b5c 0%, #050810 70%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          padding: 24,
        }}
      >
        {/* pulsing core */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 999,
            background: `radial-gradient(circle, ${COLORS.cyan} 0%, transparent 70%)`,
            opacity: 0.5 + Math.sin(frame / 8) * 0.3,
          }}
        />
        <div
          style={{
            fontFamily: ORBITRON,
            fontWeight: 900,
            fontSize: 26,
            color: COLORS.white,
            letterSpacing: 4,
          }}
        >
          SOUPYLAB
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 14,
            color: COLORS.cyan,
            letterSpacing: 2,
          }}
        >
          // running offline
        </div>
        {/* status bars */}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 32,
                height: 6,
                borderRadius: 2,
                background:
                  (frame / 4 + i) % 6 < 3 ? COLORS.gold : "rgba(245,166,35,0.2)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Scene 1: Hook --------------------------------------------------------------
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleY = spring({ frame, fps, config: { damping: 18 } });
  const subFade = interpolate(frame, [25, 50], [0, 1], {
    extrapolateRight: "clamp",
  });
  const lineW = interpolate(frame, [40, 80], [0, 100], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 22,
          color: COLORS.gold,
          letterSpacing: 6,
          marginBottom: 30,
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        // COMING SOON
      </div>
      <div
        style={{
          fontFamily: ORBITRON,
          fontWeight: 900,
          fontSize: 110,
          color: COLORS.white,
          textAlign: "center",
          lineHeight: 1.05,
          letterSpacing: -2,
          transform: `translateY(${interpolate(titleY, [0, 1], [60, 0])}px)`,
          opacity: titleY,
        }}
      >
        YOUR AI.
        <br />
        <span style={{ color: COLORS.cyan }}>IN YOUR POCKET.</span>
      </div>
      <div
        style={{
          width: `${lineW}%`,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${COLORS.cyan}, transparent)`,
          marginTop: 40,
        }}
      />
      <div
        style={{
          fontFamily: MONO,
          fontSize: 28,
          color: COLORS.dimWhite,
          marginTop: 30,
          opacity: subFade,
          textAlign: "center",
        }}
      >
        SoupyLab Mobile is almost here.
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Problem -----------------------------------------------------------
const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [
    "No cloud.",
    "No API keys.",
    "No data leaks.",
    "No subscriptions.",
  ];
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: 100,
      }}
    >
      <div
        style={{
          fontFamily: ORBITRON,
          fontWeight: 700,
          fontSize: 58,
          color: COLORS.gold,
          marginBottom: 50,
          letterSpacing: 4,
          opacity: spring({ frame, fps, config: { damping: 20 } }),
        }}
      >
        NO STRINGS.
      </div>
      {items.map((t, i) => {
        const delay = i * 12;
        const s = spring({
          frame: frame - delay,
          fps,
          config: { damping: 14 },
        });
        return (
          <div
            key={t}
            style={{
              fontFamily: ORBITRON,
              fontWeight: 900,
              fontSize: 80,
              color: COLORS.white,
              marginBottom: 14,
              transform: `translateX(${interpolate(s, [0, 1], [-200, 0])}px)`,
              opacity: s,
              letterSpacing: -1,
            }}
          >
            <span style={{ color: COLORS.cyan, marginRight: 18 }}>✕</span>
            {t}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Scene 3: Phone reveal ------------------------------------------------------
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneP = spring({ frame, fps, config: { damping: 16 } });
  const labelP = interpolate(frame, [30, 60], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 60,
        padding: 60,
      }}
    >
      <Phone progress={phoneP} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 30,
          opacity: labelP,
          maxWidth: 540,
        }}
      >
        {[
          { k: "TRAIN", v: "your own small AI on your data" },
          { k: "RUN", v: "100% offline, on-device" },
          { k: "OWN", v: "the weights — forever" },
        ].map((row, i) => {
          const delay = 30 + i * 10;
          const s = spring({
            frame: frame - delay,
            fps,
            config: { damping: 18 },
          });
          return (
            <div
              key={row.k}
              style={{
                transform: `translateX(${interpolate(s, [0, 1], [80, 0])}px)`,
                opacity: s,
              }}
            >
              <div
                style={{
                  fontFamily: ORBITRON,
                  fontWeight: 900,
                  fontSize: 64,
                  color: COLORS.gold,
                  letterSpacing: 3,
                }}
              >
                {row.k}
              </div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 26,
                  color: COLORS.dimWhite,
                  marginTop: 6,
                }}
              >
                {row.v}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: CTA ---------------------------------------------------------------
const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoS = spring({ frame, fps, config: { damping: 12 } });
  const ctaS = spring({
    frame: frame - 25,
    fps,
    config: { damping: 14 },
  });
  const url = spring({
    frame: frame - 50,
    fps,
    config: { damping: 18 },
  });
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          fontFamily: ORBITRON,
          fontWeight: 900,
          fontSize: 140,
          color: COLORS.white,
          letterSpacing: -4,
          transform: `scale(${interpolate(logoS, [0, 1], [0.6, 1])})`,
          opacity: logoS,
          textShadow: `0 0 40px ${COLORS.cyan}`,
        }}
      >
        SOUPY<span style={{ color: COLORS.cyan }}>LAB</span>
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 30,
          color: COLORS.gold,
          letterSpacing: 4,
          marginTop: 20,
          opacity: ctaS,
        }}
      >
        // MOBILE APP — DROPPING SOON
      </div>
      <div
        style={{
          marginTop: 70,
          padding: "22px 50px",
          border: `2px solid ${COLORS.cyan}`,
          borderRadius: 8,
          fontFamily: ORBITRON,
          fontWeight: 700,
          fontSize: 38,
          color: COLORS.white,
          letterSpacing: 6,
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
          marginTop: 24,
          fontFamily: MONO,
          fontSize: 22,
          color: COLORS.dimWhite,
          letterSpacing: 2,
          opacity: url,
        }}
      >
        join the waitlist · get 50 free credits
      </div>
    </AbsoluteFill>
  );
};

// Main composition: 24s @ 30fps = 720 frames ---------------------------------
// Scene timing (no transitions, hard cuts): 1=120, 2=180, 3=210, 4=210
export const MobileAdVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.void }}>
      <Backdrop />
      <Sequence from={0} durationInFrames={120}>
        <Scene1 />
      </Sequence>
      <Sequence from={120} durationInFrames={180}>
        <Scene2 />
      </Sequence>
      <Sequence from={300} durationInFrames={210}>
        <Scene3 />
      </Sequence>
      <Sequence from={510} durationInFrames={210}>
        <Scene4 />
      </Sequence>
      {/* Subtle vignette over everything */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
