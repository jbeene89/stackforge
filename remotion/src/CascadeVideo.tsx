import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { FONT, COLORS } from "./constants";

// Scene A: Data streams converging
const SceneDataStream: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const streams = [
    { label: "TEXT", y: 200, color: COLORS.cyan, delay: 0 },
    { label: "CHAT LOGS", y: 380, color: COLORS.gold, delay: 8 },
    { label: "CODE", y: 560, color: COLORS.emerald, delay: 16 },
    { label: "VOICE", y: 740, color: COLORS.rose, delay: 24 },
  ];

  return (
    <AbsoluteFill>
      {/* Scanline effect */}
      <div style={{
        position: "absolute", inset: 0,
        background: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${COLORS.void}44 4px)`,
        opacity: 0.3,
      }} />

      {/* Header */}
      <div style={{
        position: "absolute", left: 100, top: 80,
        fontFamily: FONT, fontWeight: 400, fontSize: 14,
        color: COLORS.dimWhite, letterSpacing: "6px",
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        DATA INGESTION
      </div>

      {streams.map((s, i) => {
        const sp = spring({ frame: frame - s.delay, fps, config: { damping: 20, stiffness: 160 } });
        const lineX = interpolate(sp, [0, 1], [-800, 0]);
        const labelOp = interpolate(frame, [s.delay + 15, s.delay + 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

        // Flowing data dots
        const dots = Array.from({ length: 8 }, (_, d) => {
          const dotX = ((frame - s.delay) * 12 + d * 180) % 1920;
          const dotOp = frame > s.delay + 10 ? 0.4 + Math.sin(frame * 0.1 + d + i) * 0.3 : 0;
          return { x: dotX, opacity: dotOp };
        });

        return (
          <div key={i}>
            {/* Stream line */}
            <div style={{
              position: "absolute", left: lineX, top: s.y,
              width: 1920, height: 2,
              background: `linear-gradient(90deg, transparent 0%, ${s.color} 30%, ${s.color}44 100%)`,
              boxShadow: `0 0 15px ${s.color}44`,
            }} />

            {/* Label */}
            <div style={{
              position: "absolute", left: 100, top: s.y - 35,
              fontFamily: FONT, fontWeight: 700, fontSize: 28,
              color: s.color, letterSpacing: "4px", opacity: labelOp,
            }}>
              {s.label}
            </div>

            {/* Flowing dots */}
            {dots.map((dot, d) => (
              <div key={d} style={{
                position: "absolute", left: dot.x, top: s.y - 3,
                width: 8, height: 8, borderRadius: "50%",
                background: s.color, opacity: dot.opacity,
                boxShadow: `0 0 10px ${s.color}`,
              }} />
            ))}
          </div>
        );
      })}

      {/* Convergence zone */}
      <div style={{
        position: "absolute", right: 200, top: "50%", transform: "translateY(-50%)",
        width: 120, height: 500,
        background: `linear-gradient(180deg, ${COLORS.cyan}11, ${COLORS.gold}22, ${COLORS.emerald}11)`,
        borderLeft: `2px solid ${COLORS.gold}33`,
        opacity: interpolate(frame, [40, 60], [0, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }} />
    </AbsoluteFill>
  );
};

// Scene B: Processing / The Five Minds
const SceneProcessing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const minds = [
    { icon: "◆", name: "AXIOM", color: COLORS.cyan },
    { icon: "♥", name: "LYRA", color: COLORS.rose },
    { icon: "⚡", name: "FLUX", color: COLORS.gold },
    { icon: "◈", name: "SENTINEL", color: COLORS.emerald },
    { icon: "◎", name: "PRISM", color: COLORS.violet },
  ];

  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute", left: "50%", top: 60, transform: "translateX(-50%)",
        fontFamily: FONT, fontWeight: 400, fontSize: 14,
        color: COLORS.dimWhite, letterSpacing: "6px",
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        COGNITIVE PROCESSING
      </div>

      {/* Five nodes in a pentagon */}
      {minds.map((m, i) => {
        const angle = (i * 72 - 90) * (Math.PI / 180);
        const radius = 280;
        const cx = 960 + Math.cos(angle) * radius;
        const cy = 540 + Math.sin(angle) * radius;

        const delay = 10 + i * 12;
        const sp = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 180 } });
        const scale = interpolate(sp, [0, 1], [0, 1]);
        const opacity = interpolate(sp, [0, 1], [0, 1]);

        const pulse = 0.7 + Math.sin(frame * 0.08 + i * 1.2) * 0.3;

        return (
          <div key={i}>
            {/* Node */}
            <div style={{
              position: "absolute",
              left: cx - 45, top: cy - 45,
              width: 90, height: 90,
              borderRadius: 20,
              border: `2px solid ${m.color}`,
              background: `${m.color}15`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 4,
              transform: `scale(${scale})`, opacity,
              boxShadow: `0 0 ${30 * pulse}px ${m.color}33`,
            }}>
              <div style={{ fontSize: 28, color: m.color }}>{m.icon}</div>
              <div style={{
                fontFamily: FONT, fontWeight: 700, fontSize: 10,
                color: m.color, letterSpacing: "2px",
              }}>{m.name}</div>
            </div>

            {/* Connection line to center */}
            {frame > delay + 20 && (
              <div style={{
                position: "absolute",
                left: Math.min(cx, 960), top: Math.min(cy, 540),
                width: Math.abs(cx - 960), height: Math.abs(cy - 540),
                opacity: 0.2,
              }}>
                <svg width="100%" height="100%" style={{ position: "absolute" }}>
                  <line
                    x1={cx < 960 ? Math.abs(cx - 960) : 0}
                    y1={cy < 540 ? Math.abs(cy - 540) : 0}
                    x2={cx < 960 ? 0 : Math.abs(cx - 960)}
                    y2={cy < 540 ? 0 : Math.abs(cy - 540)}
                    stroke={m.color}
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                </svg>
              </div>
            )}
          </div>
        );
      })}

      {/* Center synthesis point */}
      <div style={{
        position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        opacity: interpolate(frame, [70, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          border: `2px solid ${COLORS.gold}`,
          background: `${COLORS.gold}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 40px ${COLORS.gold}33`,
        }}>
          <div style={{
            fontFamily: FONT, fontWeight: 700, fontSize: 14,
            color: COLORS.gold, letterSpacing: "1px",
          }}>SYN</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene C: Output / Result
const SceneOutput: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sp = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 160 } });
  const scale = interpolate(sp, [0, 1], [0.6, 1]);
  const opacity = interpolate(sp, [0, 1], [0, 1]);

  const statsSp = spring({ frame: frame - 40, fps, config: { damping: 18 } });

  const stats = [
    { label: "QUALITY SCORE", value: "97.3%", color: COLORS.emerald },
    { label: "PERSPECTIVES", value: "5/5", color: COLORS.cyan },
    { label: "LATENCY", value: "1.2s", color: COLORS.gold },
  ];

  return (
    <AbsoluteFill>
      {/* Result card */}
      <div style={{
        position: "absolute", left: "50%", top: "38%",
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity, textAlign: "center",
      }}>
        <div style={{
          fontFamily: FONT, fontWeight: 700, fontSize: 72,
          color: COLORS.white, letterSpacing: "-2px",
        }}>
          INTELLIGENCE
        </div>
        <div style={{
          fontFamily: FONT, fontWeight: 700, fontSize: 72,
          color: COLORS.gold, letterSpacing: "-2px",
          textShadow: `0 0 40px ${COLORS.gold}44`,
        }}>
          AMPLIFIED
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        position: "absolute", left: "50%", top: "65%",
        transform: "translate(-50%, -50%)",
        display: "flex", gap: 80,
      }}>
        {stats.map((s, i) => {
          const delay = 50 + i * 12;
          const ssp = spring({ frame: frame - delay, fps, config: { damping: 16 } });
          const y = interpolate(ssp, [0, 1], [30, 0]);
          const op = interpolate(ssp, [0, 1], [0, 1]);
          return (
            <div key={i} style={{
              textAlign: "center", opacity: op,
              transform: `translateY(${y}px)`,
            }}>
              <div style={{
                fontFamily: FONT, fontWeight: 700, fontSize: 40,
                color: s.color,
              }}>{s.value}</div>
              <div style={{
                fontFamily: FONT, fontWeight: 400, fontSize: 12,
                color: COLORS.dimWhite, letterSpacing: "3px", marginTop: 8,
              }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* URL */}
      <div style={{
        position: "absolute", left: "50%", bottom: 80,
        transform: "translateX(-50%)",
        fontFamily: FONT, fontWeight: 400, fontSize: 18,
        color: COLORS.dimWhite, letterSpacing: "3px",
        opacity: interpolate(frame, [80, 100], [0, 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>
        stackforge.lovable.app
      </div>
    </AbsoluteFill>
  );
};

export const CascadeVideo: React.FC = () => {
  const frame = useCurrentFrame();

  // Background
  const drift = Math.sin(frame * 0.006) * 10;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.void }}>
      {/* Animated gradient bg */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at ${45 + drift}% 50%, #0f172a 0%, ${COLORS.void} 70%)`,
      }} />

      {/* Subtle particles */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = (i * 230 + frame * (0.2 + i * 0.04)) % 1920;
        const y = 100 + Math.sin(frame * 0.015 + i * 1.7) * 400 + i * 80;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y,
            width: 3, height: 3, borderRadius: "50%",
            background: i % 2 === 0 ? COLORS.gold : COLORS.cyan,
            opacity: 0.12 + Math.sin(frame * 0.04 + i) * 0.08,
            boxShadow: `0 0 8px ${i % 2 === 0 ? COLORS.gold : COLORS.cyan}`,
          }} />
        );
      })}

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={130}>
          <SceneDataStream />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />
        <TransitionSeries.Sequence durationInFrames={140}>
          <SceneProcessing />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 25 })}
        />
        <TransitionSeries.Sequence durationInFrames={140}>
          <SceneOutput />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
