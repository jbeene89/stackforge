import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Image, MessageSquare, ArrowRight, X } from "lucide-react";

const QUICK_WINS = [
  {
    label: "BUILD AN AI MODULE",
    desc: "Create a specialist AI agent in 60 seconds — just describe what it should do.",
    href: "/modules",
    icon: Brain,
    accent: "#FF6B35",
    cta: "BUILD NOW",
    time: "~1 min",
  },
  {
    label: "GENERATE AN IMAGE",
    desc: "Turn a text prompt into a unique AI image — see results instantly.",
    href: "/image-forge",
    icon: Image,
    accent: "#B44FFF",
    cta: "TRY IT",
    time: "~30 sec",
  },
  {
    label: "CHAT WITH AI",
    desc: "Test the inference playground — ask anything, see how models respond.",
    href: "/inference",
    icon: MessageSquare,
    accent: "#00E5FF",
    cta: "OPEN CHAT",
    time: "Instant",
  },
];

export function FirstWinAccelerator() {
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("first_win_dismissed") === "true"
  );
  const completed = localStorage.getItem("first_win_completed") === "true";

  // Hide if dismissed OR if user already completed first-win flow
  if (dismissed || completed) return null;

  const handleDismiss = () => {
    localStorage.setItem("first_win_dismissed", "true");
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        style={{ marginBottom: 32 }}
      >
        <div
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderTop: "3px solid #7FFF00",
            padding: "28px 28px 24px",
            position: "relative",
          }}
        >
          <button
            onClick={handleDismiss}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "hsl(var(--muted-foreground))",
              padding: 4,
            }}
            aria-label="Dismiss"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div
              style={{
                width: 28,
                height: 28,
                clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
                background: "rgba(127,255,0,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles style={{ width: 12, height: 12, color: "#7FFF00" }} />
            </div>
            <span
              className="sl-heading"
              style={{ fontSize: 13, letterSpacing: "0.08em", color: "hsl(var(--foreground))" }}
            >
              YOUR FIRST WIN
            </span>
            <span
              className="sl-mono"
              style={{ fontSize: 9, color: "#7FFF00", letterSpacing: "0.15em" }}
            >
              50 FREE CREDITS LOADED
            </span>
          </div>

          <p
            className="sl-mono"
            style={{
              fontSize: 10,
              color: "hsl(var(--muted-foreground))",
              letterSpacing: "0.1em",
              marginBottom: 20,
              maxWidth: 500,
            }}
          >
            PICK ONE TO TRY — EACH TAKES UNDER A MINUTE. YOUR CREDITS WON'T EXPIRE.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 2,
            }}
          >
            {QUICK_WINS.map(({ label, desc, href, icon: Icon, accent, cta, time }) => (
              <Link key={label} to={href} style={{ textDecoration: "none" }}>
                <div
                  className="sl-card-hover group"
                  style={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderLeft: `3px solid ${accent}`,
                    padding: "20px",
                    cursor: "pointer",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          flexShrink: 0,
                          clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
                          background: `${accent}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon style={{ width: 13, height: 13, color: accent }} />
                      </div>
                      <span
                        className="sl-heading"
                        style={{ fontSize: 11, letterSpacing: "0.08em", color: "hsl(var(--foreground))" }}
                      >
                        {label}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 11,
                        color: "hsl(var(--muted-foreground))",
                        lineHeight: 1.6,
                        marginBottom: 14,
                        fontWeight: 300,
                      }}
                    >
                      {desc}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      className="sl-mono"
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.2em",
                        color: accent,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {cta} <ArrowRight style={{ width: 10, height: 10 }} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span
                      className="sl-mono"
                      style={{ fontSize: 8, color: "hsl(var(--muted-foreground))", letterSpacing: "0.15em" }}
                    >
                      {time}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
