import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Image, MessageSquare, Zap } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";

const GOAL_CONFIG: Record<string, { label: string; href: string; icon: React.ElementType; accent: string; desc: string }> = {
  module: { label: "AI MODULE BUILDER", href: "/modules", icon: Brain, accent: "#FF6B35", desc: "Continue building your AI module" },
  stack: { label: "AI PIPELINES", href: "/stacks", icon: Brain, accent: "#B44FFF", desc: "Continue building your pipeline" },
  web: { label: "IMAGE FORGE", href: "/image-forge", icon: Image, accent: "#B44FFF", desc: "Generate more AI images" },
  android: { label: "IMAGE FORGE", href: "/image-forge", icon: Image, accent: "#B44FFF", desc: "Generate more AI images" },
  tool: { label: "AI CHAT", href: "/inference", icon: MessageSquare, accent: "#00E5FF", desc: "Continue your AI conversation" },
  research: { label: "AI CHAT", href: "/inference", icon: MessageSquare, accent: "#00E5FF", desc: "Continue your research chat" },
};

export function ContinueWhereYouLeftOff() {
  const completed = localStorage.getItem("first_win_completed") === "true";
  const dismissed = localStorage.getItem("first_win_dismissed") === "true";
  const goal = localStorage.getItem("first_win_goal") || "web";
  const { data: credits } = useCredits();

  // Only show for returning users who completed first win
  if (!completed && !dismissed) return null;

  const config = GOAL_CONFIG[goal] || GOAL_CONFIG.web;
  const Icon = config.icon;
  const balance = credits?.credits_balance ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ marginBottom: 32 }}
    >
      <div
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderTop: `3px solid ${config.accent}`,
          padding: "24px 28px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
                background: `${config.accent}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon style={{ width: 16, height: 16, color: config.accent }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span
                  className="sl-heading"
                  style={{ fontSize: 12, letterSpacing: "0.08em", color: "hsl(var(--foreground))" }}
                >
                  CONTINUE WHERE YOU LEFT OFF
                </span>
              </div>
              <p
                className="sl-mono"
                style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", letterSpacing: "0.08em" }}
              >
                {config.desc}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Credits remaining badge */}
            <div
              className="sl-mono"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                padding: "6px 12px",
                fontSize: 10,
                letterSpacing: "0.15em",
              }}
            >
              <Zap style={{ width: 12, height: 12, color: "#7FFF00" }} />
              <span style={{ color: "#7FFF00", fontWeight: 700 }}>{balance}</span>
              <span style={{ color: "hsl(var(--muted-foreground))" }}>CREDITS LEFT</span>
            </div>

            <Link to={config.href} style={{ textDecoration: "none" }}>
              <button
                className="sl-btn-slash"
                style={{
                  background: config.accent,
                  color: "hsl(var(--primary-foreground))",
                  border: "none",
                  padding: "10px 20px",
                  fontSize: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  letterSpacing: "0.15em",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: 900,
                }}
              >
                {config.label}
                <ArrowRight style={{ width: 12, height: 12 }} />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}