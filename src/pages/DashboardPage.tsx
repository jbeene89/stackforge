import { useState, useRef } from "react";
import { usePendingReferral } from "@/hooks/usePendingReferral";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Globe,
  Smartphone,
  Brain,
  Layers,
  Send,
  ArrowRight,
  CheckCircle2,
  Zap,
  GitBranch,
  Activity,
  Cpu,
  Rocket,
  Terminal,
} from "lucide-react";
import { useProjects, useModules, useStacks, useRuns } from "@/hooks/useSupabaseData";
import { useModelContext } from "@/hooks/useModelContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { TierBadge } from "@/components/TierBadge";
import { IndependenceScorecard } from "@/components/IndependenceScorecard";
import type { ProjectType } from "@/types";
import { motion } from "framer-motion";
import { OnboardingTour, type OnboardingTourHandle } from "@/components/OnboardingTour";
import { TourMenu } from "@/components/TourMenu";
import { FirstWinAccelerator } from "@/components/FirstWinAccelerator";
import { ContinueWhereYouLeftOff } from "@/components/ContinueWhereYouLeftOff";
import { LowCreditsNudge } from "@/components/LowCreditsNudge";

// ── FONTS ────────────────────────────────────────────────────────────────────
const DashFonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Space+Mono:wght@400;700&family=Chakra+Petch:wght@300;400;600;700&display=swap');
    .sl-dash { font-family: 'Chakra Petch', sans-serif; color: hsl(var(--foreground)); }
    .sl-dash h1, .sl-dash .sl-heading { font-family: 'Orbitron', monospace; }
    .sl-dash .sl-mono { font-family: 'Space Mono', monospace; }
    .sl-dash .sl-btn-slash {
      clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
      font-family: 'Orbitron', monospace;
      font-weight: 900;
      letter-spacing: 0.15em;
    }
    .sl-dash .sl-btn-slash-sm {
      clip-path: polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%);
    }
    .sl-card-hover { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s; }
    .sl-card-hover:hover { transform: translateY(-2px); }
    @keyframes sl-blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
    .sl-blink { animation: sl-blink 1.5s ease-in-out infinite; }
  `}</style>
);

// ── ICON MAP ─────────────────────────────────────────────────────────────────
const TYPE_ICONS: Record<ProjectType, React.ElementType> = {
  web: Globe,
  android: Smartphone,
  module: Brain,
  stack: Layers,
  hybrid: Layers,
};

const TYPE_ACCENTS: Record<ProjectType, string> = {
  web: "#00E5FF",
  android: "#7FFF00",
  module: "#FF6B35",
  stack: "#B44FFF",
  hybrid: "#0066FF",
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: "rgba(176,196,222,0.1)", color: "hsl(var(--muted-foreground))", label: "DRAFT" },
  building: { bg: "rgba(255,107,53,0.1)", color: "#FF6B35", label: "BUILDING" },
  testing: { bg: "rgba(0,229,255,0.1)", color: "#00E5FF", label: "TESTING" },
  deployed: { bg: "rgba(127,255,0,0.1)", color: "#7FFF00", label: "DEPLOYED" },
  archived: { bg: "rgba(176,196,222,0.08)", color: "hsl(var(--muted-foreground))", label: "ARCHIVED" },
};

const FILTERS = ["ALL", "STACK", "MODULE", "WEB", "ANDROID"];

// ── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  id,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className="sl-card-hover"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        padding: "20px 20px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span className="sl-mono" style={{ fontSize: 9, letterSpacing: "0.3em", color: "hsl(var(--muted-foreground))" }}>
          {label}
        </span>
        <div
          style={{
            width: 28,
            height: 28,
            clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
            background: `${accent}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon style={{ width: 12, height: 12, color: accent }} />
        </div>
      </div>
      <div className="sl-heading" style={{ fontSize: 28, fontWeight: 900, color: "hsl(var(--foreground))", lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

// ── PROJECT CARD ─────────────────────────────────────────────────────────────
function ProjectCard({ project, index }: { project: any; index: number }) {
  const Icon = TYPE_ICONS[project.type as ProjectType] || Layers;
  const accent = TYPE_ACCENTS[project.type as ProjectType] || "#00E5FF";
  const status = STATUS_STYLES[project.status] || STATUS_STYLES.draft;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Link
        to={`/projects/${project.id}`}
        className="sl-card-hover group block"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          padding: "24px",
          position: "relative",
          overflow: "hidden",
          textDecoration: "none",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = `${accent}30`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
        }}
      >
        {/* Top accent line */}
        <div
          style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: accent, opacity: 0.6 }}
        />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
              background: `${accent}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon style={{ width: 14, height: 14, color: accent }} />
          </div>
          <span
            className="sl-mono sl-btn-slash-sm"
            style={{
              fontSize: 8,
              letterSpacing: "0.2em",
              padding: "3px 8px",
              background: status.bg,
              color: status.color,
              border: `1px solid ${status.color}25`,
            }}
          >
            {status.label}
          </span>
        </div>

        <div
          className="sl-heading"
          style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 6, letterSpacing: "0.03em" }}
        >
          {project.name}
        </div>
        <p
          className="sl-chakra"
          style={{
            fontSize: 11,
            color: "hsl(var(--muted-foreground))",
            lineHeight: 1.6,
            marginBottom: 16,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontWeight: 300,
          }}
        >
          {project.description}
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            className="sl-mono"
            style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", letterSpacing: "0.1em", textTransform: "uppercase" }}
          >
            {project.type}
          </span>
          <ArrowRight
            style={{ width: 12, height: 12, color: accent, opacity: 0.6, transition: "transform 0.2s" }}
            className="group-hover:translate-x-1"
          />
        </div>
      </Link>
    </motion.div>
  );
}

// ── PAGE ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();
  const tourRef = useRef<OnboardingTourHandle>(null);
  usePendingReferral();

  const { data: projects, isLoading } = useProjects();
  const { data: modules } = useModules();
  const { data: stacks } = useStacks();
  const { data: runs } = useRuns();
  const { data: credits } = useCredits();

  const filtered = (projects || []).filter((p) => {
    if (filter !== "ALL" && p.type.toUpperCase() !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const deployedCount = (projects || []).filter((p) => p.status === "deployed").length;
  const lastRun = runs?.[0];

  const handlePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) navigate("/onboarding");
  };

  return (
    <div className="sl-dash" style={{ padding: "32px", maxWidth: 1400, margin: "0 auto" }}>
      <DashFonts />
      <OnboardingTour ref={tourRef} />

      {/* ── HEADER ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div
              className="sl-mono"
              style={{
                fontSize: 9,
                letterSpacing: "0.4em",
                color: "#00E5FF",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ width: 24, height: 2, background: "#00E5FF" }} />
              SOUPY LAB
            </div>
            {credits && <TierBadge tier={credits.tier} size="md" />}
            <TourMenu tourRef={tourRef} />
          </div>
          <h1
            id="tour-welcome"
            style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 0.9, letterSpacing: "-0.01em", marginBottom: 8 }}
          >
            DASHBOARD
          </h1>
          <p className="sl-mono" style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", letterSpacing: "0.15em" }}>
            YOUR PROJECTS · MODULES · STACKS
          </p>
        </div>
        <button
          id="tour-new-project"
          className="sl-btn-slash"
          onClick={() => navigate("/onboarding")}
          style={{
            background: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
            padding: "14px 28px",
            fontSize: 11,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#00E5FF";
            (e.currentTarget as HTMLElement).style.color = "hsl(var(--primary-foreground))";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "hsl(var(--primary-foreground))";
            (e.currentTarget as HTMLElement).style.color = "hsl(var(--foreground))";
          }}
        >
          <Plus style={{ width: 14, height: 14 }} /> NEW PROJECT
        </button>
      </div>

      {/* ── PROMPT BAR ── */}
      <motion.form
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handlePrompt}
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderTop: "3px solid #00E5FF",
          padding: "0",
          marginBottom: 32,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ padding: "14px 18px", borderRight: "1px solid rgba(0,229,255,0.1)" }}>
          <Terminal style={{ width: 16, height: 16, color: "#00E5FF" }} />
        </div>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to build…"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "Space Mono, monospace",
            fontSize: 11,
            letterSpacing: "0.1em",
            color: "hsl(var(--foreground))",
            padding: "14px 18px",
          }}
        />
        <button
          type="submit"
          disabled={!prompt.trim()}
          style={{
            background: prompt.trim() ? "#00E5FF" : "transparent",
            color: prompt.trim() ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
            border: "none",
            padding: "14px 20px",
            cursor: prompt.trim() ? "pointer" : "default",
            transition: "all 0.2s",
            borderLeft: "1px solid rgba(0,229,255,0.1)",
          }}
        >
          <Send style={{ width: 14, height: 14 }} />
        </button>
      </motion.form>

      {/* ── FIRST WIN / CONTINUE CARD ── */}
      <ContinueWhereYouLeftOff />
      <FirstWinAccelerator />

      {/* ── LOW CREDITS NUDGE ── */}
      <LowCreditsNudge />

      {/* ── INDEPENDENCE SCORECARD ── */}
      <div style={{ marginBottom: 32 }}>
        <IndependenceScorecard compact />
      </div>

      {/* ── STAT GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, marginBottom: 32 }}>
        <StatCard id={undefined} label="DEPLOYED" value={deployedCount} icon={CheckCircle2} accent="#7FFF00" />
        <StatCard id="tour-modules" label="MODULES" value={modules?.length || 0} icon={Cpu} accent="#FF6B35" />
        <StatCard id="tour-stacks" label="STACKS" value={stacks?.length || 0} icon={Layers} accent="#B44FFF" />
        <StatCard
          id={undefined}
          label="LAST RUN"
          value={lastRun ? `${(lastRun.total_duration_ms / 1000).toFixed(1)}s` : "—"}
          icon={Zap}
          accent="#00E5FF"
        />
      </div>

      {/* ── FILTER + SEARCH ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            gap: 2,
            background: "hsl(var(--card))",
            padding: 3,
            border: "1px solid hsl(var(--border))",
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="sl-mono sl-btn-slash-sm"
              style={{
                fontSize: 9,
                letterSpacing: "0.2em",
                padding: "7px 14px",
                background: filter === f ? "hsl(var(--foreground))" : "transparent",
                color: filter === f ? "hsl(var(--background))" : "hsl(var(--muted-foreground))",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, maxWidth: 300, position: "relative", display: "flex", alignItems: "center" }}>
          <Search style={{ position: "absolute", left: 12, width: 12, height: 12, color: "hsl(var(--muted-foreground))" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH PROJECTS…"
            style={{
              width: "100%",
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              outline: "none",
              padding: "8px 12px 8px 32px",
              fontFamily: "Space Mono, monospace",
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "hsl(var(--foreground))",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,229,255,0.25)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
          />
        </div>
      </div>

      {/* ── PROJECTS GRID ── */}
      {isLoading ? (
        <div
          className="sl-mono"
          style={{ textAlign: "center", padding: "80px 0", color: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: "0.3em" }}
        >
          LOADING…
        </div>
      ) : filtered.length === 0 && !search ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: "center", padding: "80px 0", border: "1px dashed rgba(0,229,255,0.12)" }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 20px",
              clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
              background: "rgba(0,229,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus style={{ width: 20, height: 20, color: "rgba(0,229,255,0.4)" }} />
          </div>
          <p className="sl-heading" style={{ fontSize: 14, color: "hsl(var(--foreground))", marginBottom: 8 }}>
            NO PROJECTS YET
          </p>
          <p className="sl-mono" style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", letterSpacing: "0.2em", marginBottom: 24 }}>
            CREATE YOUR FIRST PROJECT TO GET STARTED
          </p>
          <button
            className="sl-btn-slash sl-mono"
            onClick={() => navigate("/onboarding")}
            style={{
              background: "#00E5FF",
              color: "hsl(var(--primary-foreground))",
              border: "none",
              padding: "12px 28px",
              fontSize: 9,
              letterSpacing: "0.2em",
              cursor: "pointer",
            }}
          >
            START BUILDING
          </button>
        </motion.div>
      ) : (
        <div
          id="tour-projects"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 2 }}
        >
          {filtered.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      )}

      {/* ── QUICK LAUNCH STRIP ── */}
      <div
        style={{ marginTop: 40, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 2 }}
      >
        {[
          { label: "NEW MODULE", desc: "Single-purpose AI", href: "/modules", accent: "#FF6B35", icon: Cpu },
          { label: "NEW STACK", desc: "Multi-agent pipeline", href: "/stacks", accent: "#B44FFF", icon: Layers },
          { label: "SLM LAB", desc: "Train your model", href: "/slm-lab", accent: "#00E5FF", icon: Brain },
          { label: "DEPLOY", desc: "Ship to production", href: "/deploy", accent: "#7FFF00", icon: Rocket },
        ].map(({ label, desc, href, accent, icon: Icon }) => (
          <Link key={label} to={href} style={{ textDecoration: "none" }}>
            <div
              className="sl-card-hover"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                borderTop: `2px solid ${accent}`,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${accent}40`;
                (e.currentTarget as HTMLElement).style.borderTopColor = accent;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
                (e.currentTarget as HTMLElement).style.borderTopColor = accent;
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
                  background: `${accent}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon style={{ width: 14, height: 14, color: accent }} />
              </div>
              <div>
                <div
                  className="sl-heading"
                  style={{ fontSize: 11, letterSpacing: "0.1em", color: "hsl(var(--foreground))", marginBottom: 3 }}
                >
                  {label}
                </div>
                <div className="sl-mono" style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", letterSpacing: "0.1em" }}>
                  {desc}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
