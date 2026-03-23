import {
  BookOpen,
  LayoutDashboard,
  FolderOpen,
  Brain,
  Layers,
  LayoutTemplate,
  FlaskConical,
  Activity,
  Shield,
  Settings,
  Sun,
  Moon,
  Cpu,
  Atom,
  Gamepad2,
  Box,
  Workflow,
  Radio,
  Joystick,
  Wand2,
  CircuitBoard,
  ScrollText,
  Flame,
  Rocket,
  Image,
  TabletSmartphone,
  LogOut,
  Store,
  Smartphone,
  SwatchBook,
  Terminal,
  Server,
  ChevronRight,
} from "lucide-react";
import { CreditsBadge } from "@/components/CreditsBadge";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ── FONT INJECTION ──────────────────────────────────────────────────────────
const SidebarFonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Space+Mono:wght@400;700&family=Chakra+Petch:wght@400;600&display=swap');
    .sl-sidebar { font-family: 'Chakra Petch', sans-serif; }
    .sl-sidebar .sl-logo { font-family: 'Orbitron', monospace; }
    .sl-sidebar .sl-group-label { font-family: 'Space Mono', monospace; }
    .sl-sidebar .sl-nav-item { font-family: 'Chakra Petch', sans-serif; }
    .sl-sidebar .sl-soon-badge { font-family: 'Space Mono', monospace; }
  `}</style>
);

// ── HEX MARK ────────────────────────────────────────────────────────────────
function HexMark({ size = 28, accent = "#00E5FF" }: { size?: number; accent?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
      <polygon points="14,1 27,7.5 27,20.5 14,27 1,20.5 1,7.5" fill="#050810" />
      <polygon points="14,8 20,11.5 20,16.5 14,20 8,16.5 8,11.5" fill={accent} />
    </svg>
  );
}

// ── NAV DATA ────────────────────────────────────────────────────────────────
const slmLabItems = [
  {
    title: "SLM Lab",
    url: "/slm-lab",
    icon: Brain,
    hero: true,
    tip: "Train small language models with the CDPT pipeline",
    accent: "#00E5FF",
  },
  { title: "Swipe Review", url: "/review", icon: SwatchBook, tip: "Tinder-style approve/reject for training samples" },
  { title: "Training Jobs", url: "/training", icon: Activity, tip: "Monitor active LoRA fine-tuning progress" },
  {
    title: "On-Device SLMs",
    url: "/on-device",
    icon: TabletSmartphone,
    tip: "Deploy models to phones and edge devices",
  },
  { title: "White Paper", url: "/white-paper", icon: BookOpen, tip: "Generate the CDPT academic research paper" },
];

const buildItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    tip: "Overview of your projects, modules, and activity",
  },
  { title: "Projects", url: "/projects", icon: FolderOpen, tip: "Manage web, Android, and hybrid app projects" },
  { title: "AI Modules", url: "/modules", icon: Cpu, tip: "Build single-purpose AI specialists with guardrails" },
  { title: "Stacks", url: "/stacks", icon: Layers, tip: "Wire modules into multi-step intelligent pipelines" },
  { title: "Build-a-AI", url: "/build-ai", icon: Brain, tip: "Describe what you need in plain English" },
  { title: "Forge AI", url: "/forge-ai", icon: Wand2, tip: "AI-powered code and content generation" },
  { title: "Image Forge", url: "/image-forge", icon: Image, tip: "Generate and edit images with AI" },
  { title: "Templates", url: "/templates", icon: LayoutTemplate, tip: "Pre-built module and stack templates" },
  { title: "Marketplace", url: "/marketplace", icon: Store, tip: "Browse and share community-built modules" },
];

const deployItems = [
  { title: "Pipelines", url: "/pipelines", icon: Workflow, tip: "Create and manage data processing pipelines" },
  { title: "Deploy Pipeline", url: "/deploy", icon: Rocket, tip: "Step-by-step guide to deploy your model" },
  { title: "Phone Guide", url: "/deploy/phone", icon: Smartphone, tip: "Deploy models to Android/iOS with Capacitor" },
  { title: "Inference", url: "/inference", icon: Terminal, tip: "Test your models with live inference playground" },
  { title: "Self-Host", url: "/self-host", icon: Server, tip: "Run everything locally — zero cloud dependency" },
  { title: "Export Studio", url: "/export", icon: ScrollText, tip: "Export datasets, models, and configs" },
  { title: "Runs", url: "/runs", icon: Activity, tip: "Execution history and step-by-step run traces" },
];

const exploreItems = [
  { title: "Solvers", url: "/solvers", icon: Atom, tip: "Library of reusable problem-solving patterns" },
  { title: "Capture", url: "/capture", icon: Smartphone, tip: "Capture training data from your phone" },
  { title: "Testing Lab", url: "/lab", icon: FlaskConical, tip: "Benchmark and test modules in isolation" },
  { title: "Experimental", url: "/experimental", icon: Flame, tip: "Bleeding-edge features and prototypes" },
  { title: "Model Zoo", url: "/models", icon: Box, tip: "Browse and download pre-trained model checkpoints" },
  { title: "Signal Lab", url: "/signals", icon: Radio, soon: true, tip: "Real-time signal processing and analysis" },
  { title: "Edge AI", url: "/edge-training", icon: CircuitBoard, tip: "Train models directly on edge hardware" },
  { title: "Robotics", url: "/robotics", icon: Joystick, soon: true, tip: "AI controllers for robotic systems" },
  { title: "Game Engine", url: "/engine", icon: Gamepad2, soon: true, tip: "AI-powered game logic and NPC behavior" },
  { title: "Device Console", url: "/console", icon: Smartphone, tip: "Monitor and debug on-device model performance" },
];

const adminItems = [
  { title: "Admin", url: "/admin", icon: Shield, tip: "Platform administration and user management" },
  { title: "Settings", url: "/account", icon: Settings, tip: "Account settings, API keys, and preferences" },
];

// ── ACCENT COLORS PER GROUP ──────────────────────────────────────────────────
const GROUP_ACCENTS: Record<string, string> = {
  "SLM LAB": "#00E5FF",
  BUILD: "#7FFF00",
  DEPLOY: "#FF6B35",
  EXPLORE: "#B44FFF",
  SYSTEM: "#8899BB",
};

// ── SIDEBAR ──────────────────────────────────────────────────────────────────
export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const renderGroup = (label: string, items: typeof buildItems) => {
    const accent = GROUP_ACCENTS[label] || "#00E5FF";
    return (
      <SidebarGroup key={label}>
        {!collapsed && (
          <SidebarGroupLabel
            className="sl-group-label px-3 mb-1"
            style={{
              fontSize: 9,
              letterSpacing: "0.35em",
              color: accent,
              opacity: 0.7,
              fontWeight: 700,
            }}
          >
            {label}
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              const active = isActive(item.url);
              const isHero = (item as any).hero;
              const isSoon = (item as any).soon;
              return (
                <SidebarMenuItem key={item.title}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild isActive={active} tooltip={collapsed ? item.title : undefined}>
                        <NavLink to={item.url} style={{ position: "relative", overflow: "hidden" }}>
                          {/* Active indicator stripe */}
                          {active && (
                            <span
                              style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: 3,
                                background: (item as any).accent || accent,
                              }}
                            />
                          )}
                          <item.icon
                            style={{
                              width: 14,
                              height: 14,
                              flexShrink: 0,
                              color: active ? (item as any).accent || accent : isHero ? accent : "inherit",
                            }}
                          />
                          {!collapsed && (
                            <span
                              className="sl-nav-item flex items-center gap-2 flex-1"
                              style={{
                                fontSize: 12,
                                fontWeight: active ? 700 : 500,
                                color: active ? (item as any).accent || accent : isHero ? "#FAFCFF" : "inherit",
                                letterSpacing: isHero ? "0.05em" : "normal",
                              }}
                            >
                              {item.title}
                              {isSoon && (
                                <span
                                  className="sl-soon-badge"
                                  style={{
                                    fontSize: 7,
                                    letterSpacing: "0.2em",
                                    padding: "2px 6px",
                                    border: "1px solid rgba(136,153,187,0.3)",
                                    color: "#8899BB",
                                    clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)",
                                  }}
                                >
                                  SOON
                                </span>
                              )}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {!collapsed && (
                      <TooltipContent side="right" className="max-w-[220px] text-xs">
                        {item.tip}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon" className="sl-sidebar" style={{ borderRight: "1px solid rgba(0,229,255,0.08)" }}>
      <SidebarFonts />

      {/* HEADER */}
      <SidebarHeader style={{ padding: "16px 12px 12px", borderBottom: "1px solid rgba(0,229,255,0.08)" }}>
        <NavLink to="/" className="flex items-center gap-2.5">
          <HexMark size={collapsed ? 24 : 28} />
          {!collapsed && (
            <span className="sl-logo font-black tracking-widest" style={{ fontSize: 13, color: "#FAFCFF" }}>
              SOUPY<span style={{ color: "#00E5FF" }}>LAB</span>
            </span>
          )}
        </NavLink>
      </SidebarHeader>

      {/* NAV */}
      <SidebarContent style={{ paddingTop: 8 }}>
        {/* SLM LAB — hero section */}
        <div style={{ margin: "0 8px 4px", padding: "4px 0 8px", borderBottom: "1px solid rgba(0,229,255,0.08)" }}>
          {renderGroup("SLM LAB", slmLabItems)}
        </div>

        <SidebarSeparator style={{ background: "rgba(0,229,255,0.06)", margin: "4px 0" }} />
        {renderGroup("BUILD", buildItems)}
        <SidebarSeparator style={{ background: "rgba(255,107,53,0.06)", margin: "4px 0" }} />
        {renderGroup("DEPLOY", deployItems)}
        <SidebarSeparator style={{ background: "rgba(180,79,255,0.06)", margin: "4px 0" }} />
        {renderGroup("EXPLORE", exploreItems)}
        <SidebarSeparator style={{ background: "rgba(136,153,187,0.06)", margin: "4px 0" }} />
        {renderGroup("SYSTEM", adminItems)}
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter
        style={{
          padding: "12px 8px",
          borderTop: "1px solid rgba(0,229,255,0.08)",
          gap: 6,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <OfflineIndicator collapsed={collapsed} />
        <CreditsBadge collapsed={collapsed} />

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-2.5 w-full px-3 py-2 transition-colors rounded"
          style={{ color: "#8899BB" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FAFCFF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#8899BB")}
        >
          {theme === "dark" ? (
            <Sun style={{ width: 14, height: 14, flexShrink: 0 }} />
          ) : (
            <Moon style={{ width: 14, height: 14, flexShrink: 0 }} />
          )}
          {!collapsed && (
            <span className="sl-nav-item" style={{ fontSize: 11, letterSpacing: "0.1em" }}>
              {theme === "dark" ? "LIGHT MODE" : "DARK MODE"}
            </span>
          )}
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2 transition-colors rounded"
          style={{ color: "#FF6B35" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FF4500")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#FF6B35")}
        >
          <LogOut style={{ width: 14, height: 14, flexShrink: 0 }} />
          {!collapsed && (
            <span className="sl-nav-item" style={{ fontSize: 11, letterSpacing: "0.1em" }}>
              SIGN OUT
            </span>
          )}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
