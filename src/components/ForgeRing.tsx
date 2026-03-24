import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

// ── FONTS ─────────────────────────────────────────────────────────────────────
const Fonts = ({ isMobile }: { isMobile: boolean }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Mono:wght@400;700&family=Chakra+Petch:wght@300;400;600;700&display=swap');

    * { margin:0; padding:0; box-sizing:border-box; }

    .fr-root {
      font-family: 'Chakra Petch', sans-serif;
      background: #050810;
      color: #FAFCFF;
      position: fixed;
      inset: 0;
      z-index: 50;
      overflow: hidden;
      touch-action: none;
      -webkit-user-select: none;
      user-select: none;
    }

    .fr-bg {
      position: fixed; inset: 0; z-index: 0;
      transition: background 1.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .fr-bg-noise {
      position: fixed; inset: 0; z-index: 1; pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
      opacity: 0.5;
    }

    .fr-grid {
      position: fixed; inset: 0; z-index: 1; pointer-events: none;
      background-image:
        linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px);
      background-size: 48px 48px;
      transition: opacity 0.8s;
    }

    .fr-ring {
      position: fixed; left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      z-index: 10; pointer-events: none;
    }

    .fr-scroll {
      position: fixed; inset: 0; z-index: 5;
      overflow-y: ${isMobile ? 'hidden' : 'scroll'};
      scroll-snap-type: ${isMobile ? 'none' : 'y mandatory'};
      scrollbar-width: none;
      touch-action: ${isMobile ? 'none' : 'auto'};
    }
    .fr-scroll::-webkit-scrollbar { display: none; }

    .fr-snap-section {
      height: 100vh;
      scroll-snap-align: ${isMobile ? 'none' : 'start'};
      scroll-snap-stop: ${isMobile ? 'normal' : 'always'};
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    /* ── STATION DOTS (left) — hidden on mobile ── */
    .fr-station-ring {
      position: fixed; left: 48px; top: 50%;
      transform: translateY(-50%); z-index: 20;
      display: ${isMobile ? 'none' : 'flex'};
      flex-direction: column; gap: 12px; align-items: center;
    }

    .fr-station-dot {
      width: 10px; height: 10px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.2);
      background: transparent; cursor: pointer;
      transition: all 0.3s; position: relative;
    }
    .fr-station-dot.active { width: 14px; height: 14px; border-width: 2px; }
    .fr-station-dot-label {
      position: absolute; left: 22px; top: 50%;
      transform: translateY(-50%);
      font-family: 'Space Mono', monospace; font-size: 8px;
      letter-spacing: 0.3em; white-space: nowrap;
      opacity: 0; transition: opacity 0.3s; pointer-events: none;
    }
    .fr-station-dot:hover .fr-station-dot-label,
    .fr-station-dot.active .fr-station-dot-label { opacity: 1; }

    /* ── CONTENT PANEL ── */
    .fr-panel {
      position: relative; z-index: 15;
      width: ${isMobile ? '100vw' : 'min(680px, 90vw)'};
      padding: ${isMobile ? '0 20px' : '0'};
      max-height: ${isMobile ? 'calc(100vh - 120px)' : 'none'};
      overflow-y: ${isMobile ? 'auto' : 'visible'};
      -webkit-overflow-scrolling: touch;
    }

    .fr-panel-inner {
      border: 1px solid rgba(255,255,255,0.07);
      position: relative; overflow: hidden;
      ${isMobile ? 'border-radius: 12px;' : ''}
    }

    .fr-station-header {
      padding: ${isMobile ? '20px 20px 16px' : '32px 40px 28px'};
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex; align-items: flex-start;
      gap: ${isMobile ? '14px' : '20px'};
      position: relative;
    }

    .fr-station-icon {
      width: ${isMobile ? '44px' : '56px'};
      height: ${isMobile ? '44px' : '56px'};
      clip-path: polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      font-size: ${isMobile ? '18px' : '22px'};
      position: relative;
    }

    .fr-station-num {
      font-family: 'Orbitron', monospace;
      font-size: ${isMobile ? '9px' : '10px'};
      letter-spacing: 0.4em; margin-bottom: 6px;
    }

    .fr-station-name {
      font-family: 'Orbitron', monospace;
      font-size: ${isMobile ? '20px' : '28px'};
      font-weight: 900; line-height: 1;
      letter-spacing: 0.03em; margin-bottom: 6px;
    }

    .fr-station-sub {
      font-family: 'Space Mono', monospace;
      font-size: ${isMobile ? '9px' : '10px'};
      letter-spacing: 0.2em;
      color: rgba(255,255,255,0.4);
    }

    .fr-station-body {
      padding: ${isMobile ? '16px 16px 20px' : '32px 40px'};
    }

    .fr-action-list {
      display: flex; flex-direction: column;
      gap: ${isMobile ? '6px' : '8px'};
      margin-bottom: ${isMobile ? '20px' : '32px'};
    }

    .fr-action-item {
      display: flex; align-items: center;
      gap: ${isMobile ? '10px' : '14px'};
      padding: ${isMobile ? '12px 14px' : '16px 20px'};
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      cursor: pointer; transition: all 0.2s;
      position: relative; overflow: hidden;
      text-decoration: none;
    }
    .fr-action-item::before {
      content: ''; position: absolute;
      left: 0; top: 0; bottom: 0; width: 3px;
      transform: scaleY(0); transform-origin: bottom;
      transition: transform 0.25s cubic-bezier(0.16,1,0.3,1);
    }
    .fr-action-item:hover::before { transform: scaleY(1); }
    .fr-action-item:hover { background: rgba(255,255,255,0.055); }

    .fr-action-icon {
      width: ${isMobile ? '30px' : '36px'};
      height: ${isMobile ? '30px' : '36px'};
      clip-path: polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
      display: flex; align-items: center; justify-content: center;
      font-size: ${isMobile ? '13px' : '14px'};
      flex-shrink: 0;
    }

    .fr-action-title {
      font-family: 'Orbitron', monospace;
      font-size: ${isMobile ? '10px' : '12px'};
      font-weight: 700; letter-spacing: 0.08em; margin-bottom: 2px;
    }

    .fr-action-desc {
      font-family: 'Chakra Petch', sans-serif;
      font-size: ${isMobile ? '11px' : '12px'};
      color: rgba(255,255,255,0.4); font-weight: 300;
    }

    .fr-action-arrow {
      margin-left: auto; font-size: 12px;
      opacity: 0.3; transition: opacity 0.2s, transform 0.2s;
    }
    .fr-action-item:hover .fr-action-arrow {
      opacity: 1; transform: translateX(4px);
    }

    .fr-cta {
      font-family: 'Orbitron', monospace;
      font-size: ${isMobile ? '10px' : '11px'};
      font-weight: 900; letter-spacing: 0.2em;
      padding: ${isMobile ? '14px 24px' : '16px 32px'};
      border: none; cursor: pointer;
      clip-path: polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);
      display: flex; align-items: center; gap: 10px;
      transition: all 0.2s; width: 100%; justify-content: center;
      text-decoration: none; color: #050810;
    }

    .fr-scroll-hint {
      position: fixed; bottom: ${isMobile ? '20px' : '32px'};
      left: 50%; transform: translateX(-50%); z-index: 20;
      display: flex; flex-direction: column; align-items: center; gap: 6px;
    }
    .fr-scroll-arrow {
      width: 20px; height: 20px;
      border-right: 2px solid; border-bottom: 2px solid;
      transform: rotate(45deg);
      animation: fr-bounce 1.6s ease-in-out infinite;
    }
    .fr-scroll-arrow:nth-child(2) { margin-top: -12px; animation-delay: 0.2s; opacity: 0.5; }
    @keyframes fr-bounce {
      0%,100% { transform: rotate(45deg) translateY(0); opacity: 1; }
      50%      { transform: rotate(45deg) translateY(5px); opacity: 0.4; }
    }
    .fr-scroll-label {
      font-family: 'Space Mono', monospace; font-size: 8px;
      letter-spacing: 0.35em; opacity: 0.3;
    }

    .fr-embers {
      position: fixed; inset: 0; z-index: 2;
      pointer-events: none; overflow: hidden;
    }
    .fr-ember {
      position: absolute; border-radius: 50%;
      animation: fr-ember-rise linear infinite;
    }
    @keyframes fr-ember-rise {
      0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 0.6; }
      100% { transform: translateY(-100vh) translateX(var(--drift)) scale(0.3); opacity: 0; }
    }

    .fr-progress-arc {
      position: fixed; right: 48px; top: 50%;
      transform: translateY(-50%); z-index: 20;
      display: ${isMobile ? 'none' : 'block'};
    }

    .fr-connector {
      position: fixed; left: 53px; z-index: 19; width: 1px;
      background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent);
      pointer-events: none;
      display: ${isMobile ? 'none' : 'block'};
    }

    @keyframes fr-glow-pulse {
      0%,100% { box-shadow: 0 0 20px var(--glow), 0 0 40px var(--glow-fade); }
      50%      { box-shadow: 0 0 40px var(--glow), 0 0 80px var(--glow-fade); }
    }
    .fr-glow-pulse { animation: fr-glow-pulse 3s ease-in-out infinite; }

    .fr-complete-badge {
      position: absolute; top: 20px; right: 24px;
      font-family: 'Space Mono', monospace; font-size: 8px;
      letter-spacing: 0.3em; padding: 4px 10px;
      clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%);
    }

    /* ── MOBILE BOTTOM DOTS ── */
    .fr-mobile-dots {
      position: fixed; bottom: 56px; left: 50%;
      transform: translateX(-50%); z-index: 25;
      display: flex; gap: 10px; align-items: center;
    }
    .fr-mobile-dot {
      width: 8px; height: 8px; border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,0.25);
      background: transparent; cursor: pointer;
      transition: all 0.3s;
    }
    .fr-mobile-dot.active {
      width: 10px; height: 10px; border-width: 2px;
    }

    /* ── MOBILE BADGE ── */
    .fr-mobile-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-family: 'Space Mono', monospace;
      font-size: 8px; letter-spacing: 0.15em;
      padding: 3px 8px; border-radius: 3px;
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.5);
      margin-bottom: 12px;
    }
  `}</style>
);

// ── STATION DATA ──────────────────────────────────────────────────────────────
// Mobile-appropriate actions only — things you can actually do on a phone/tablet
type StationAction = {
  icon: string;
  title: string;
  desc: string;
  href: string;
  mobileOnly?: boolean;    // show only on mobile
  desktopOnly?: boolean;   // hide on mobile
};

type Station = {
  id: string;
  num: string;
  name: string;
  sub: string;
  mobileSub?: string;
  emoji: string;
  accent: string;
  accentFade: string;
  glow: string;
  glowFade: string;
  bg: string;
  description: string;
  mobileDescription?: string;
  actions: StationAction[];
  cta: string;
  ctaHref: string;
  emberColor: string;
};

const STATIONS: Station[] = [
  {
    id: "smelt",
    num: "01",
    name: "SMELTER",
    sub: "RAW MATERIAL IN — REFINE YOUR ORE",
    mobileSub: "CAPTURE RAW DATA ON THE GO",
    emoji: "🔥",
    accent: "#FF6B35",
    accentFade: "rgba(255,107,53,0.08)",
    glow: "rgba(255,107,53,0.3)",
    glowFade: "rgba(255,107,53,0.05)",
    bg: "radial-gradient(ellipse 80% 60% at 30% 60%, rgba(255,107,53,0.07) 0%, transparent 60%), radial-gradient(ellipse 50% 80% at 80% 20%, rgba(255,60,0,0.04) 0%, transparent 60%)",
    description: "Bring in raw knowledge. Every great model starts with quality ore.",
    mobileDescription: "Capture raw knowledge from anywhere. Voice interviews and file uploads work great on mobile.",
    actions: [
      { icon: "🧠", title: "FOUNDER INTERVIEW", desc: "AI extracts your expertise through conversation", href: "/slm-lab?step=0" },
      { icon: "🌐", title: "WEB SCRAPE", desc: "Pull structured knowledge from URLs", href: "/slm-lab?step=2&mode=scrape", desktopOnly: true },
      { icon: "📁", title: "IMPORT FILE", desc: "Upload docs, exports, or raw text", href: "/slm-lab?step=2&mode=file" },
      { icon: "📸", title: "MOBILE CAPTURE", desc: "Snap photos, voice memos, quick notes", href: "/capture", mobileOnly: true },
      { icon: "🤗", title: "HUGGING FACE", desc: "Import from thousands of curated datasets", href: "/slm-lab?step=2&mode=huggingface" },
    ],
    cta: "START SMELTING",
    ctaHref: "/slm-lab?step=1",
    emberColor: "#FF6B35",
  },
  {
    id: "forge",
    num: "02",
    name: "FORGE",
    sub: "SHAPE IT — APPLY HEAT AND PERSPECTIVE",
    mobileSub: "MONITOR YOUR PIPELINE",
    emoji: "⚒️",
    accent: "#00E5FF",
    accentFade: "rgba(0,229,255,0.08)",
    glow: "rgba(0,229,255,0.3)",
    glowFade: "rgba(0,229,255,0.05)",
    bg: "radial-gradient(ellipse 80% 60% at 70% 40%, rgba(0,229,255,0.06) 0%, transparent 60%), radial-gradient(ellipse 40% 70% at 20% 80%, rgba(0,102,255,0.05) 0%, transparent 60%)",
    description: "Five cognitive lenses reshape raw data into structured intelligence.",
    mobileDescription: "Heavy compute runs on desktop. Check pipeline status and tweak settings from here.",
    actions: [
      { icon: "🍿", title: "POPCORN INJECTION", desc: "Densify stock knowledge — zero data needed", href: "/slm-lab?step=4&mode=popcorn", desktopOnly: true },
      { icon: "🔨", title: "CDPT PIPELINE", desc: "Builder · Red Team · Systems · Frame Breaker · Empath", href: "/slm-lab?step=2&mode=cdpt", desktopOnly: true },
      { icon: "🧬", title: "COGNITIVE FINGERPRINT", desc: "View your model's reasoning profile", href: "/slm-lab?fingerprint=true" },
      { icon: "📊", title: "TRAINING PROGRESS", desc: "Monitor active training jobs in real-time", href: "/training" },
      { icon: "🎛️", title: "BIAS WEIGHTS", desc: "Dial in perspective ratios before forging", href: "/slm-lab?step=4&mode=bias", desktopOnly: true },
    ],
    cta: "VIEW PIPELINE",
    ctaHref: "/training",
    emberColor: "#00E5FF",
  },
  {
    id: "grind",
    num: "03",
    name: "GRINDSTONE",
    sub: "SHARPEN IT — APPROVE, REJECT, REFINE",
    mobileSub: "SWIPE TO CURATE YOUR DATA",
    emoji: "🪨",
    accent: "#7FFF00",
    accentFade: "rgba(127,255,0,0.08)",
    glow: "rgba(127,255,0,0.25)",
    glowFade: "rgba(127,255,0,0.04)",
    bg: "radial-gradient(ellipse 70% 60% at 50% 70%, rgba(127,255,0,0.05) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 20% 30%, rgba(0,200,0,0.04) 0%, transparent 60%)",
    description: "Every pair gets judged. Sharpen what's good. Discard what's dull.",
    mobileDescription: "Swipe through training samples like a deck of cards. Built for touch.",
    actions: [
      { icon: "👆", title: "SWIPE REVIEW", desc: "Tinder-style approve / reject — perfect for touch", href: "/review" },
      { icon: "🔍", title: "QUALITY SCAN", desc: "Auto-flag low-quality or duplicate pairs", href: "/slm-lab?step=3&mode=scan" },
      { icon: "✏️", title: "MANUAL EDIT", desc: "Rewrite individual samples by hand", href: "/slm-lab?step=3&mode=edit", desktopOnly: true },
      { icon: "📊", title: "DATASET STATS", desc: "Coverage, balance, and quality metrics", href: "/slm-lab?step=3&mode=stats" },
    ],
    cta: "START SWIPING",
    ctaHref: "/review",
    emberColor: "#7FFF00",
  },
  {
    id: "bench",
    num: "04",
    name: "WORKBENCH",
    sub: "FINISH IT — PACKAGE AND SHIP",
    mobileSub: "DEPLOY TO YOUR PHONE",
    emoji: "🪚",
    accent: "#B44FFF",
    accentFade: "rgba(180,79,255,0.08)",
    glow: "rgba(180,79,255,0.25)",
    glowFade: "rgba(180,79,255,0.05)",
    bg: "radial-gradient(ellipse 80% 50% at 60% 30%, rgba(180,79,255,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 30% 70%, rgba(100,0,200,0.04) 0%, transparent 60%)",
    description: "The finished blade. Package your training kit and deploy your model.",
    mobileDescription: "Get your model running on this device. Follow the phone deploy guide.",
    actions: [
      { icon: "📦", title: "EXPORT TRAINING KIT", desc: "JSONL + train.py + config — ready to run", href: "/slm-lab?step=4&mode=export", desktopOnly: true },
      { icon: "📱", title: "PHONE DEPLOY", desc: "Ship your model to Android via Termux/Ollama", href: "/deploy/phone" },
      { icon: "💬", title: "INFERENCE PLAYGROUND", desc: "Chat with your model over LAN", href: "/inference" },
      { icon: "🚀", title: "DEPLOY PIPELINE", desc: "Step-by-step guide to train on your machine", href: "/deploy", desktopOnly: true },
      { icon: "🖥️", title: "SELF-HOST SETUP", desc: "Docker + Ollama + Open WebUI — zero cloud", href: "/self-host", desktopOnly: true },
    ],
    cta: "DEPLOY TO PHONE",
    ctaHref: "/deploy/phone",
    emberColor: "#B44FFF",
  },
];

// ── EMBER PARTICLES ───────────────────────────────────────────────────────────
function Embers({ color, active, reduced }: { color: string; active: boolean; reduced?: boolean }) {
  const count = reduced ? 6 : 12;
  return (
    <div className="fr-embers" style={{ opacity: active ? 1 : 0, transition: "opacity 1s" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="fr-ember" style={{
          width: i % 3 === 0 ? 3 : 2,
          height: i % 3 === 0 ? 3 : 2,
          background: color,
          left: `${8 + (i * 7.3) % 84}%`,
          bottom: `-${10 + (i * 3) % 20}px`,
          animationDuration: `${4 + (i * 0.7) % 5}s`,
          animationDelay: `${(i * 0.4) % 4}s`,
          "--drift": `${(i % 2 === 0 ? 1 : -1) * (20 + (i * 8) % 40)}px`,
          boxShadow: `0 0 4px ${color}`,
          opacity: 0.6 + (i % 3) * 0.1,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

// ── PROGRESS ARC SVG ──────────────────────────────────────────────────────────
function ProgressArc({ current, total, accent }: { current: number; total: number; accent: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const progress = (current + 1) / total;
  const dash = circ * progress;

  return (
    <div className="fr-progress-arc">
      <svg width={80} height={80} viewBox="0 0 80 80">
        <circle cx={40} cy={40} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
        <circle cx={40} cy={40} r={r} fill="none"
          stroke={accent} strokeWidth={2}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1), stroke 0.8s" }} />
        <text x={40} y={36} textAnchor="middle" fill={accent}
          style={{ fontFamily: "Orbitron, monospace", fontSize: 11, fontWeight: 900 }}>
          {current + 1}
        </text>
        <text x={40} y={50} textAnchor="middle" fill="rgba(255,255,255,0.3)"
          style={{ fontFamily: "Space Mono, monospace", fontSize: 8 }}>
          OF {total}
        </text>
      </svg>
    </div>
  );
}

// ── STATION PANEL ─────────────────────────────────────────────────────────────
function StationPanel({ station, isActive, direction, isMobile }: {
  station: Station;
  isActive: boolean;
  direction: number;
  isMobile: boolean;
}) {
  const filteredActions = station.actions.filter(a => {
    if (isMobile) return !a.desktopOnly;
    return !a.mobileOnly;
  });

  const description = isMobile && station.mobileDescription ? station.mobileDescription : station.description;
  const sub = isMobile && station.mobileSub ? station.mobileSub : station.sub;

  // Mobile CTA overrides
  const cta = isMobile ? (station.id === "forge" ? "VIEW PIPELINE" : station.id === "bench" ? "DEPLOY TO PHONE" : station.cta) : station.cta;
  const ctaHref = isMobile ? (station.id === "forge" ? "/training" : station.id === "bench" ? "/deploy/phone" : station.ctaHref) : station.ctaHref;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div className="fr-panel"
          key={station.id}
          initial={{ opacity: 0, y: direction * 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: direction * -40, scale: 0.98 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
          <div className="fr-panel-inner fr-glow-pulse"
            style={{
              "--glow": station.glow,
              "--glow-fade": station.glowFade,
              background: "#080A12",
              borderColor: `${station.accent}20`,
            } as React.CSSProperties}>

            {/* Top accent bar */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${station.accent}, ${station.accent}44, transparent)` }} />

            {/* Header */}
            <div className="fr-station-header">
              <div className="fr-station-icon"
                style={{ background: station.accentFade, boxShadow: `0 0 24px ${station.glow}` }}>
                <span>{station.emoji}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div className="fr-station-num" style={{ color: station.accent }}>{station.num} / 04</div>
                <div className="fr-station-name" style={{ color: "#FAFCFF" }}>{station.name}</div>
                <div className="fr-station-sub">{sub}</div>
              </div>
            </div>

            {/* Body */}
            <div className="fr-station-body">
              {isMobile && (
                <div className="fr-mobile-badge">
                  📱 MOBILE VIEW — {filteredActions.length} actions available
                </div>
              )}

              <p style={{
                fontFamily: "Chakra Petch, sans-serif",
                fontSize: isMobile ? 13 : 14,
                color: "rgba(255,255,255,0.5)",
                marginBottom: isMobile ? 16 : 24,
                fontWeight: 300, lineHeight: 1.7
              }}>
                {description}
              </p>

              {/* Actions */}
              <div className="fr-action-list">
                {filteredActions.map((action, i) => (
                  <motion.a key={action.title} href={action.href}
                    className="fr-action-item"
                    style={{ "--stripe": station.accent, textDecoration: "none", color: "inherit" } as React.CSSProperties}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${station.accent}30`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                    }}>
                    <style>{`.fr-action-item:hover::before { background: ${station.accent}; }`}</style>
                    <div className="fr-action-icon" style={{ background: station.accentFade }}>
                      <span style={{ fontSize: 15 }}>{action.icon}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="fr-action-title" style={{ color: "#FAFCFF" }}>{action.title}</div>
                      <div className="fr-action-desc">{action.desc}</div>
                    </div>
                    <span className="fr-action-arrow" style={{ color: station.accent }}>→</span>
                  </motion.a>
                ))}
              </div>

              {/* CTA */}
              <motion.a href={ctaHref}
                style={{ textDecoration: "none" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}>
                <button className="fr-cta"
                  style={{ background: station.accent, color: "#050810" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "brightness(1)"; }}>
                  {station.emoji} {cta}
                  <span style={{ fontFamily: "Space Mono, monospace", fontSize: 14 }}>→</span>
                </button>
              </motion.a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── FORGE RING MAIN ───────────────────────────────────────────────────────────
export function ForgeRing() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const lastScrollTime = useRef(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime.current < 50) return;
      lastScrollTime.current = now;

      const idx = Math.round(el.scrollTop / window.innerHeight);
      const clamped = Math.max(0, Math.min(STATIONS.length - 1, idx));

      if (clamped !== activeIndex) {
        const dir = clamped > activeIndex ? 1 : -1;
        setPrevIndex(activeIndex);
        setDirection(dir);
        setActiveIndex(clamped);
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [activeIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") scrollToStation(Math.min(activeIndex + 1, STATIONS.length - 1));
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") scrollToStation(Math.max(activeIndex - 1, 0));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex]);

  const scrollToStation = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: idx * window.innerHeight, behavior: "smooth" });
  };

  const station = STATIONS[activeIndex];

  return (
    <div className="fr-root">
      <Fonts isMobile={isMobile} />

      {/* ── AMBIENT BACKGROUND ── */}
      <div className="fr-bg" style={{ background: station.bg }} />
      <div className="fr-bg-noise" />
      <div className="fr-grid" />

      {/* ── EMBERS ── */}
      {STATIONS.map((s, i) => (
        <Embers key={s.id} color={s.emberColor} active={i === activeIndex} reduced={isMobile} />
      ))}

      {/* ── STATION DOTS (left — desktop only) ── */}
      <div className="fr-station-ring">
        <div className="fr-connector" style={{ top: "calc(50% - 80px)", height: 160 }} />
        {STATIONS.map((s, i) => (
          <button key={s.id} className={`fr-station-dot ${i === activeIndex ? "active" : ""}`}
            style={{
              borderColor: i === activeIndex ? s.accent : "rgba(255,255,255,0.2)",
              background: i === activeIndex ? s.accent : "transparent",
              boxShadow: i === activeIndex ? `0 0 12px ${s.glow}` : "none",
            }}
            onClick={() => scrollToStation(i)}>
            <span className="fr-station-dot-label" style={{ color: s.accent }}>
              {s.name}
            </span>
          </button>
        ))}
      </div>

      {/* ── PROGRESS ARC (right — desktop only) ── */}
      <ProgressArc current={activeIndex} total={STATIONS.length} accent={station.accent} />

      {/* ── MOBILE BOTTOM DOTS ── */}
      {isMobile && (
        <div className="fr-mobile-dots">
          {STATIONS.map((s, i) => (
            <button key={s.id}
              className={`fr-mobile-dot ${i === activeIndex ? "active" : ""}`}
              style={{
                borderColor: i === activeIndex ? s.accent : "rgba(255,255,255,0.25)",
                background: i === activeIndex ? s.accent : "transparent",
                boxShadow: i === activeIndex ? `0 0 8px ${s.glow}` : "none",
              }}
              onClick={() => scrollToStation(i)}
            />
          ))}
        </div>
      )}

      {/* ── SCROLL HINT ── */}
      {activeIndex < STATIONS.length - 1 && (
        <motion.div className="fr-scroll-hint"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
          <div className="fr-scroll-arrow" style={{ borderColor: station.accent }} />
          <div className="fr-scroll-arrow" style={{ borderColor: station.accent }} />
          <span className="fr-scroll-label" style={{ color: station.accent }}>
            {isMobile ? "SWIPE UP" : "NEXT STATION"}
          </span>
        </motion.div>
      )}

      {/* ── STATION NAME WATERMARK ── */}
      <div style={{
        position: "fixed", bottom: -20, right: -20,
        fontFamily: "Orbitron, monospace",
        fontSize: isMobile ? "clamp(50px, 15vw, 80px)" : "clamp(80px, 12vw, 160px)",
        fontWeight: 900,
        color: `${station.accent}06`,
        pointerEvents: "none", zIndex: 3,
        letterSpacing: "0.05em", lineHeight: 1,
        transition: "color 1s", userSelect: "none",
      }}>
        {station.name}
      </div>

      {/* ── SCROLL CONTAINER ── */}
      <div ref={scrollRef} className="fr-scroll">
        {STATIONS.map((s, i) => (
          <div key={s.id} className="fr-snap-section">
            <StationPanel station={s} isActive={i === activeIndex} direction={direction} isMobile={isMobile} />
          </div>
        ))}
      </div>

      {/* ── TOP NAV BAR ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0,
        height: isMobile ? 44 : 52, zIndex: 30,
        background: "rgba(5,8,16,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${station.accent}15`,
        display: "flex", alignItems: "center",
        padding: isMobile ? "0 12px" : "0 24px",
        gap: isMobile ? 8 : 16,
        transition: "border-color 0.8s",
      }}>
        {/* Hex logo */}
        <svg width={isMobile ? 20 : 24} height={isMobile ? 20 : 24} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <polygon points="12,1 23,6.5 23,17.5 12,23 1,17.5 1,6.5" fill="#050810" stroke={station.accent} strokeWidth={1.5} />
          <polygon points="12,7 17,9.5 17,14.5 12,17 7,14.5 7,9.5" fill={station.accent} opacity={0.8} />
        </svg>
        <span style={{
          fontFamily: "Orbitron, monospace", fontWeight: 900,
          fontSize: isMobile ? 11 : 13, letterSpacing: "0.15em", color: "#FAFCFF"
        }}>
          SOUPY<span style={{ color: station.accent }}>LAB</span>
        </span>
        <div style={{ flex: 1 }} />
        {/* Station breadcrumb — hide text on mobile, just show station name */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "Space Mono, monospace", fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)" }}>
              SLM LAB
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>›</span>
            <span style={{ fontFamily: "Space Mono, monospace", fontSize: 9, letterSpacing: "0.3em", color: station.accent, transition: "color 0.5s" }}>
              {station.name}
            </span>
          </div>
        )}
        {/* Station progress pills */}
        <div style={{ display: "flex", gap: 4 }}>
          {STATIONS.map((s, i) => (
            <button key={s.id}
              style={{
                width: i === activeIndex ? (isMobile ? 20 : 28) : (isMobile ? 10 : 16),
                height: 4, border: "none", cursor: "pointer",
                background: i === activeIndex ? s.accent : i < activeIndex ? `${s.accent}50` : "rgba(255,255,255,0.1)",
                transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
              }}
              onClick={() => scrollToStation(i)} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ForgeRing;
