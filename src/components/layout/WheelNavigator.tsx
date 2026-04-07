import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Flame, Hammer, Mountain, Wrench, Palette, Brain, Link2, Store, X,
} from "lucide-react";
import { useModelContext } from "@/hooks/useModelContext";

/* ── SPOKE DEFINITIONS ──────────────────────────────────────────────────── */
export interface SubRoute {
  label: string;
  path: string;
}

export interface Spoke {
  id: string;
  label: string;
  icon: React.ElementType;
  emoji: string;
  accent: string;
  glow: string;
  routes: string[];     // paths that belong to this spoke (for active detection)
  submenu: SubRoute[];
}

const SPOKES: Spoke[] = [
  {
    id: "smelt",
    label: "SMELT",
    icon: Flame,
    emoji: "🔥",
    accent: "#00E5FF",
    glow: "0 0 24px rgba(0,229,255,0.5)",
    routes: ["/slm-lab", "/review", "/capture", "/harvest"],
    submenu: [
      { label: "SLM Lab", path: "/slm-lab" },
      { label: "Dataset", path: "/slm-lab?step=1" },
      { label: "Capture", path: "/capture" },
      { label: "Harvest", path: "/harvest" },
    ],
  },
  {
    id: "forge",
    label: "FORGE",
    icon: Hammer,
    emoji: "⚒️",
    accent: "#7FFF00",
    glow: "0 0 24px rgba(127,255,0,0.5)",
    routes: ["/training", "/edge-training"],
    submenu: [
      { label: "Training", path: "/training" },
      { label: "Edge AI", path: "/edge-training" },
      { label: "White Paper", path: "/white-paper" },
    ],
  },
  {
    id: "grind",
    label: "GRIND",
    icon: Mountain,
    emoji: "🪨",
    accent: "#FF6B35",
    glow: "0 0 24px rgba(255,107,53,0.5)",
    routes: ["/review", "/lab"],
    submenu: [
      { label: "Swipe", path: "/review" },
      { label: "Test Lab", path: "/lab" },
      { label: "Slicer", path: "/lab/slicer" },
    ],
  },
  {
    id: "bench",
    label: "BENCH",
    icon: Wrench,
    emoji: "🪚",
    accent: "#FFD700",
    glow: "0 0 24px rgba(255,215,0,0.5)",
    routes: ["/export", "/deploy", "/self-host", "/deploy/phone", "/on-device", "/console"],
    submenu: [
      { label: "Export", path: "/export" },
      { label: "Deploy", path: "/deploy" },
      { label: "Phone", path: "/deploy/phone" },
      { label: "Self-Host", path: "/self-host" },
    ],
  },
  {
    id: "image",
    label: "IMAGE",
    icon: Palette,
    emoji: "🎨",
    accent: "#B44FFF",
    glow: "0 0 24px rgba(180,79,255,0.5)",
    routes: ["/image-forge"],
    submenu: [
      { label: "Image Forge", path: "/image-forge" },
      { label: "Forge AI", path: "/forge-ai" },
    ],
  },
  {
    id: "modules",
    label: "MODULES",
    icon: Brain,
    emoji: "🧠",
    accent: "#00E5FF",
    glow: "0 0 24px rgba(0,229,255,0.5)",
    routes: ["/modules", "/build-ai", "/forge-ai", "/templates"],
    submenu: [
      { label: "Modules", path: "/modules" },
      { label: "Build AI", path: "/build-ai" },
      { label: "Templates", path: "/templates" },
      { label: "Forge AI", path: "/forge-ai" },
    ],
  },
  {
    id: "stacks",
    label: "STACKS",
    icon: Link2,
    emoji: "🔗",
    accent: "#7FFF00",
    glow: "0 0 24px rgba(127,255,0,0.5)",
    routes: ["/stacks", "/pipelines", "/runs", "/inference"],
    submenu: [
      { label: "Stacks", path: "/stacks" },
      { label: "Pipelines", path: "/pipelines" },
      { label: "Runs", path: "/runs" },
      { label: "Inference", path: "/inference" },
    ],
  },
  {
    id: "market",
    label: "MARKET",
    icon: Store,
    emoji: "🏪",
    accent: "#FF6B35",
    glow: "0 0 24px rgba(255,107,53,0.5)",
    routes: ["/marketplace", "/models", "/solvers"],
    submenu: [
      { label: "Market", path: "/marketplace" },
      { label: "Models", path: "/models" },
      { label: "Solvers", path: "/solvers" },
    ],
  },
];

/* ── HEX LOGO MARK ─────────────────────────────────────────────────────── */
function HexCenter({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <polygon points="14,1 27,7.5 27,20.5 14,27 1,20.5 1,7.5" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="0.5" />
      <polygon points="14,8 20,11.5 20,16.5 14,20 8,16.5 8,11.5" fill="#00E5FF" />
    </svg>
  );
}

/* ── PIPELINE RING (inner ring overlay) ─────────────────────────────── */
const STAGE_COLORS: Record<string, string> = {
  data: "#00E5FF",
  train: "#7FFF00",
  test: "#FF6B35",
  export: "#FFD700",
  deploy: "#B44FFF",
};

function PipelineRing({
  expanded,
  navigate,
}: {
  expanded: boolean;
  navigate: (path: string) => void;
}) {
  const { activeModel, clearActiveModel } = useModelContext();
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  if (!activeModel) return null;

  const { stages, datasetName } = activeModel;
  const completedCount = stages.filter((s) => s.complete).length;

  return (
    <div className="w-full border-t border-[hsl(var(--border))] pt-2 pb-1">
      {/* Model name + close */}
      <div className="flex items-center gap-1 px-2 mb-1.5">
        <span
          className="text-[8px] font-bold tracking-[0.15em] truncate flex-1"
          style={{
            fontFamily: "'Orbitron', monospace",
            color: "#00E5FF",
          }}
        >
          {expanded ? datasetName.toUpperCase() : "⬡"}
        </span>
        {expanded && (
          <button
            onClick={clearActiveModel}
            className="p-0.5 rounded hover:bg-[hsl(var(--muted))] cursor-pointer"
          >
            <X size={10} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Progress bar (collapsed) */}
      {!expanded && (
        <div className="px-2 mb-1">
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: "hsl(var(--muted))" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #00E5FF, #7FFF00)" }}
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / stages.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Stage buttons */}
      {stages.map((stage) => {
        const color = STAGE_COLORS[stage.key] || "#00E5FF";
        const isHovered = hoveredStage === stage.key;

        return (
          <div key={stage.key} className="relative">
            <button
              onClick={() => {
                if (stage.complete || !stage.prerequisite) {
                  navigate(stage.route);
                }
              }}
              onMouseEnter={() => setHoveredStage(stage.key)}
              onMouseLeave={() => setHoveredStage(null)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1 transition-all cursor-pointer",
                !stage.complete && stage.prerequisite && "opacity-40"
              )}
              style={{
                background: stage.complete ? `${color}10` : "transparent",
              }}
            >
              {/* Stage dot */}
              <div
                className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[8px]"
                style={{
                  background: stage.complete ? color : "transparent",
                  border: `1.5px solid ${stage.complete ? color : "hsl(var(--muted-foreground))"}`,
                  boxShadow: stage.complete ? `0 0 8px ${color}50` : "none",
                }}
              >
                {stage.complete ? "✓" : ""}
              </div>

              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    className="text-[9px] font-bold tracking-[0.12em]"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: stage.complete ? color : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {stage.icon} {stage.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Prerequisite tooltip */}
            <AnimatePresence>
              {isHovered && !stage.complete && stage.prerequisite && expanded && (
                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="absolute left-full top-0 ml-2 z-50 px-3 py-2 rounded-md whitespace-nowrap"
                  style={{
                    background: "hsl(var(--card))",
                    border: `1px solid ${color}40`,
                    boxShadow: `0 4px 16px rgba(0,0,0,0.3), 0 0 8px ${color}20`,
                    maxWidth: 220,
                    whiteSpace: "normal",
                  }}
                >
                  <p
                    className="text-[9px] font-medium"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    {stage.prerequisite}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Progress summary */}
      {expanded && (
        <div className="px-3 pt-1">
          <span
            className="text-[8px] tracking-[0.1em]"
            style={{
              fontFamily: "'Space Mono', monospace",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            {completedCount}/{stages.length} COMPLETE
          </span>
        </div>
      )}
    </div>
  );
}

/* ── MAIN NAVIGATOR ──────────────────────────────────────────────────── */
export function WheelNavigator() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const [activeSpoke, setActiveSpoke] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Detect which spoke is active from current route
  const detectActive = useCallback(() => {
    const path = location.pathname;
    for (const spoke of SPOKES) {
      if (spoke.routes.some((r) => path === r || path.startsWith(r + "/"))) {
        return spoke.id;
      }
    }
    return null;
  }, [location.pathname]);

  useEffect(() => {
    setActiveSpoke(detectActive());
  }, [detectActive]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wheelRef.current && !wheelRef.current.contains(e.target as Node)) {
        if (isMobile) setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobile]);

  const handleSpokeClick = (spoke: Spoke) => {
    setActiveSpoke(spoke.id);
    // Navigate to the first submenu route
    navigate(spoke.submenu[0].path);
  };

  const handleSubClick = (path: string) => {
    navigate(path);
    if (isMobile) setExpanded(false);
  };

  /* ── DESKTOP: thin rail on left, expands on hover ── */
  if (!isMobile) {
    return (
      <div
        ref={wheelRef}
        className="relative flex-shrink-0 h-full z-30"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <motion.nav
          animate={{ width: expanded ? 220 : 56 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="h-full flex flex-col items-center py-3 gap-1 overflow-hidden"
          style={{
            background: "hsl(var(--background) / 0.95)",
            borderRight: "1px solid hsl(var(--border))",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Center hex */}
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-3 mt-1 hover:scale-110 transition-transform cursor-pointer"
            title="Dashboard"
          >
            <HexCenter size={expanded ? 36 : 28} />
          </button>

          {SPOKES.map((spoke) => {
            const Icon = spoke.icon;
            const isActive = activeSpoke === spoke.id;
            return (
              <div key={spoke.id} className="w-full">
                <button
                  onClick={() => handleSpokeClick(spoke)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-none transition-all duration-200 cursor-pointer",
                    "hover:bg-[hsl(var(--muted))]",
                    isActive && "relative"
                  )}
                  style={isActive ? {
                    background: `${spoke.accent}15`,
                    boxShadow: spoke.glow,
                  } : undefined}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="spoke-indicator"
                      className="absolute left-0 top-0 bottom-0 w-[3px]"
                      style={{ background: spoke.accent }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  <div
                    className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-sm"
                    style={isActive ? {
                      color: spoke.accent,
                      filter: `drop-shadow(0 0 6px ${spoke.accent})`,
                    } : {
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    <Icon size={18} />
                  </div>

                  <AnimatePresence>
                    {expanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="text-[10px] font-bold tracking-[0.2em] whitespace-nowrap"
                        style={{
                          fontFamily: "'Orbitron', monospace",
                          color: isActive ? spoke.accent : "hsl(var(--muted-foreground))",
                        }}
                      >
                        {spoke.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Ambient pulse for active */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-sm pointer-events-none"
                      animate={{ opacity: [0.05, 0.12, 0.05] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      style={{ background: spoke.accent }}
                    />
                  )}
                </button>

                {/* Submenu */}
                <AnimatePresence>
                  {expanded && isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {spoke.submenu.map((sub) => {
                        const isSubActive = location.pathname === sub.path || location.pathname + location.search === sub.path;
                        return (
                          <button
                            key={sub.path}
                            onClick={() => handleSubClick(sub.path)}
                            className="w-full text-left pl-14 pr-3 py-1.5 text-[10px] tracking-[0.1em] transition-colors cursor-pointer"
                            style={{
                              fontFamily: "'Space Mono', monospace",
                              color: isSubActive ? spoke.accent : "hsl(var(--muted-foreground))",
                              background: isSubActive ? `${spoke.accent}10` : "transparent",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = spoke.accent; }}
                            onMouseLeave={(e) => {
                              if (!isSubActive) e.currentTarget.style.color = "hsl(var(--muted-foreground))";
                            }}
                          >
                            {sub.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* ── MODEL PIPELINE RING ── */}
          <PipelineRing expanded={expanded} navigate={navigate} />

          {/* Bottom spacer + dashboard/settings */}
          <div className="flex-1" />
          <div className="w-full border-t border-[hsl(var(--border))] pt-2">
            {[
              { label: "HOME", path: "/dashboard", accent: "#00E5FF" },
              { label: "HUB", path: "/ai-hub", accent: "#7FFF00" },
              { label: "ACCT", path: "/account", accent: "#FF6B35" },
            ].map((item) => {
              const isItemActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 px-3 py-1.5 transition-colors cursor-pointer"
                  style={{
                    color: isItemActive ? item.accent : "hsl(var(--muted-foreground))",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = item.accent; }}
                  onMouseLeave={(e) => {
                    if (!isItemActive) e.currentTarget.style.color = "hsl(var(--muted-foreground))";
                  }}
                >
                  <span
                    className="text-[9px] font-bold tracking-[0.2em]"
                    style={{ fontFamily: "'Orbitron', monospace" }}
                  >
                    {expanded ? item.label : item.label[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.nav>
      </div>
    );
  }

  /* ── MOBILE: floating radial wheel ── */
  return (
    <>
      {/* Floating trigger */}
      {!expanded && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer"
          style={{
            background: "hsl(var(--card))",
            border: "2px solid hsl(var(--border))",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 12px rgba(0,229,255,0.2)",
          }}
          onClick={() => setExpanded(true)}
        >
          <HexCenter size={28} />
        </motion.button>
      )}

      {/* Full wheel overlay */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            ref={wheelRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "hsl(var(--background) / 0.92)", backdropFilter: "blur(16px)" }}
          >
            {/* Center hex */}
            <button
              onClick={() => { navigate("/dashboard"); setExpanded(false); }}
              className="absolute z-10 cursor-pointer"
            >
              <HexCenter size={44} />
            </button>

            {/* Spokes arranged in circle */}
            {SPOKES.map((spoke, i) => {
              const angle = (i * 360) / SPOKES.length - 90; // start from top
              const rad = (angle * Math.PI) / 180;
              const radius = 120;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;
              const Icon = spoke.icon;
              const isActive = activeSpoke === spoke.id;

              return (
                <motion.button
                  key={spoke.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: isActive ? 1 : 0.6,
                    scale: isActive ? 1.15 : 1,
                    x,
                    y,
                  }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute flex flex-col items-center gap-1 cursor-pointer"
                  onClick={() => handleSpokeClick(spoke)}
                  style={isActive ? { filter: `drop-shadow(${spoke.glow})` } : undefined}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: isActive ? `${spoke.accent}25` : "hsl(var(--card))",
                      border: `2px solid ${isActive ? spoke.accent : "hsl(var(--border))"}`,
                      boxShadow: isActive ? spoke.glow : "none",
                    }}
                  >
                    <Icon size={20} className={isActive ? "" : "text-muted-foreground"} style={isActive ? { color: spoke.accent } : undefined} />
                  </div>
                  <span
                    className="text-[8px] font-bold tracking-[0.15em]"
                    style={{
                      fontFamily: "'Orbitron', monospace",
                      color: isActive ? spoke.accent : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {spoke.label}
                  </span>

                  {/* Active pulse */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      animate={{ opacity: [0, 0.3, 0], scale: [1, 1.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ background: spoke.accent }}
                    />
                  )}
                </motion.button>
              );
            })}

            {/* Active spoke submenu (below the wheel) */}
            <AnimatePresence>
              {activeSpoke && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-24 flex gap-2 flex-wrap justify-center px-4"
                >
                  {SPOKES.find((s) => s.id === activeSpoke)?.submenu.map((sub) => {
                    const spoke = SPOKES.find((s) => s.id === activeSpoke)!;
                    const isSubActive = location.pathname === sub.path;
                    return (
                      <button
                        key={sub.path}
                        onClick={() => handleSubClick(sub.path)}
                        className="px-4 py-2 rounded-sm text-[10px] font-bold tracking-[0.1em] cursor-pointer transition-all"
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          background: isSubActive ? `${spoke.accent}20` : "hsl(var(--card))",
                          border: `1px solid ${isSubActive ? spoke.accent : "hsl(var(--border))"}`,
                          color: isSubActive ? spoke.accent : "hsl(var(--muted-foreground))",
                        }}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Close */}
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-6 right-6 text-[hsl(var(--muted-foreground))] text-xs tracking-[0.2em] cursor-pointer"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              CLOSE ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
