import { useState, useEffect } from "react";
import {
  BookOpen, LayoutDashboard, FolderOpen, Brain, Layers, LayoutTemplate,
  FlaskConical, Activity, Shield, Settings, Sun, Moon, Cpu, Atom,
  Gamepad2, Box, Workflow, Radio, Joystick, Wand2, CircuitBoard,
  ScrollText, Flame, Rocket, Image, TabletSmartphone, LogOut, Store,
  Smartphone, SwatchBook, Terminal, Server, ChevronRight, ChevronDown,
  Zap, Hammer, Send, Compass, Cog, ToggleLeft, ToggleRight,
} from "lucide-react";
import { CreditsBadge } from "@/components/CreditsBadge";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel,
  SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarHeader, SidebarFooter, SidebarSeparator, useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

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

// ── TYPES ────────────────────────────────────────────────────────────────────
interface NavItem {
  title: string;
  url: string;
  icon: any;
  tip: string;
  desc?: string;        // plain-English subtitle for Simple mode
  hero?: boolean;
  soon?: boolean;
  accent?: string;
}

interface NavSubmenu {
  title: string;
  icon: any;
  desc: string;         // what this group does in plain English
  accent?: string;
  items: NavItem[];
}

interface NavSection {
  label: string;
  accent: string;
  submenus: NavSubmenu[];
}

// ══════════════════════════════════════════════════════════════════════════════
// SIMPLE MODE — outcome-based, grouped by "what do you want to do?"
// ══════════════════════════════════════════════════════════════════════════════
const simpleSections: NavSection[] = [
  {
    label: "GET STARTED",
    accent: "#00E5FF",
    submenus: [
      {
        title: "Home",
        icon: LayoutDashboard,
        desc: "Your overview & quick actions",
        items: [
          { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, tip: "Overview of your projects and activity", desc: "See everything at a glance" },
          { title: "Projects", url: "/projects", icon: FolderOpen, tip: "Manage your projects", desc: "All your apps and tools" },
        ],
      },
    ],
  },
  {
    label: "BUILD AI",
    accent: "#7FFF00",
    submenus: [
      {
        title: "Create Something",
        icon: Hammer,
        desc: "Build an AI from scratch or a template",
        accent: "#7FFF00",
        items: [
          { title: "Build-a-AI", url: "/build-ai", icon: Brain, tip: "Describe what you need in plain English", desc: "Just tell it what you want" },
          { title: "Forge AI", url: "/forge-ai", icon: Wand2, tip: "AI-powered code and content generation", desc: "Generate code & content" },
          { title: "Image Forge", url: "/image-forge", icon: Image, tip: "Generate and edit images with AI", desc: "Create images with AI" },
          { title: "Templates", url: "/templates", icon: LayoutTemplate, tip: "Pre-built starting points", desc: "Start from a ready-made blueprint" },
          { title: "Marketplace", url: "/marketplace", icon: Store, tip: "Community-built modules", desc: "Browse what others have built" },
        ],
      },
      {
        title: "Advanced Builder",
        icon: Cpu,
        desc: "Fine-grained control for power users",
        accent: "#7FFF00",
        items: [
          { title: "AI Modules", url: "/modules", icon: Cpu, tip: "Build single-purpose AI specialists", desc: "One AI, one job — with guardrails" },
          { title: "AI Pipelines", url: "/stacks", icon: Layers, tip: "Chain multiple AI steps together", desc: "Connect AIs in a sequence" },
          { title: "Solvers", url: "/solvers", icon: Atom, tip: "Reusable problem-solving patterns", desc: "Plug-and-play logic blocks" },
        ],
      },
    ],
  },
  {
    label: "TRAIN AI",
    accent: "#00E5FF",
    submenus: [
      {
        title: "Train Your Own Model",
        icon: Zap,
        desc: "Teach AI using your data",
        accent: "#00E5FF",
        items: [
          { title: "SLM Lab", url: "/slm-lab", icon: Brain, tip: "Train small language models", desc: "The main training workshop", hero: true, accent: "#00E5FF" },
          { title: "Swipe Review", url: "/review", icon: SwatchBook, tip: "Approve or reject training data", desc: "Swipe right on good data" },
          { title: "Training Jobs", url: "/training", icon: Activity, tip: "Monitor training progress", desc: "Watch your model learn" },
          { title: "Capture Data", url: "/capture", icon: Smartphone, tip: "Capture training data from your phone", desc: "Use your phone to gather data" },
        ],
      },
      {
        title: "Research & Docs",
        icon: BookOpen,
        desc: "Deep-dive into the methodology",
        accent: "#00E5FF",
        items: [
          { title: "White Paper", url: "/white-paper", icon: BookOpen, tip: "The CDPT research paper", desc: "How the training method works" },
          { title: "Testing Lab", url: "/lab", icon: FlaskConical, tip: "Benchmark modules in isolation", desc: "Test before you ship" },
          { title: "Model Zoo", url: "/models", icon: Box, tip: "Pre-trained model checkpoints", desc: "Download ready-made models" },
        ],
      },
    ],
  },
  {
    label: "DEPLOY",
    accent: "#FF6B35",
    submenus: [
      {
        title: "Ship It",
        icon: Send,
        desc: "Get your AI live and running",
        accent: "#FF6B35",
        items: [
          { title: "Deploy Guide", url: "/deploy", icon: Rocket, tip: "Step-by-step deployment", desc: "Launch your AI step by step" },
          { title: "To Your Phone", url: "/deploy/phone", icon: Smartphone, tip: "Deploy to Android/iOS", desc: "Run AI on your mobile device" },
          { title: "Self-Host", url: "/self-host", icon: Server, tip: "Run locally, zero cloud", desc: "Keep everything on your machine" },
          { title: "On-Device SLMs", url: "/on-device", icon: TabletSmartphone, tip: "Deploy to phones and edge devices", desc: "Tiny models for tiny devices" },
        ],
      },
      {
        title: "Run & Monitor",
        icon: Activity,
        desc: "Test, debug, and track performance",
        accent: "#FF6B35",
        items: [
          { title: "Inference", url: "/inference", icon: Terminal, tip: "Live inference playground", desc: "Chat with your model live" },
          { title: "Pipelines", url: "/pipelines", icon: Workflow, tip: "Data processing pipelines", desc: "Automate data flows" },
          { title: "Run History", url: "/runs", icon: Activity, tip: "Execution history", desc: "See past runs and results" },
          { title: "Device Console", url: "/console", icon: Smartphone, tip: "Monitor on-device performance", desc: "Debug models on hardware" },
          { title: "Export Studio", url: "/export", icon: ScrollText, tip: "Export datasets and configs", desc: "Download your work" },
        ],
      },
    ],
  },
  {
    label: "COMING SOON",
    accent: "#8899BB",
    submenus: [
      {
        title: "On the Roadmap",
        icon: Compass,
        desc: "Features we're building next",
        accent: "#8899BB",
        items: [
          { title: "Edge AI", url: "/edge-training", icon: CircuitBoard, tip: "Train on edge hardware", desc: "Train directly on devices", soon: true },
          { title: "Signal Lab", url: "/signals", icon: Radio, tip: "Real-time signal processing", desc: "Process live data streams", soon: true },
          { title: "Robotics", url: "/robotics", icon: Joystick, tip: "AI for robotic systems", desc: "Control robots with AI", soon: true },
          { title: "Game Engine", url: "/engine", icon: Gamepad2, tip: "AI-powered game logic", desc: "Smart NPCs and game AI", soon: true },
        ],
      },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// ADVANCED MODE — current technical layout
// ══════════════════════════════════════════════════════════════════════════════
const advancedSections: NavSection[] = [
  {
    label: "SLM LAB",
    accent: "#00E5FF",
    submenus: [{
      title: "SLM Lab",
      icon: Brain,
      desc: "Train small language models with the CDPT pipeline",
      items: [
        { title: "SLM Lab", url: "/slm-lab", icon: Brain, hero: true, tip: "Train small language models with the CDPT pipeline", accent: "#00E5FF" },
        { title: "Swipe Review", url: "/review", icon: SwatchBook, tip: "Tinder-style approve/reject for training samples" },
        { title: "Training Jobs", url: "/training", icon: Activity, tip: "Monitor active LoRA fine-tuning progress" },
        { title: "On-Device SLMs", url: "/on-device", icon: TabletSmartphone, tip: "Deploy models to phones and edge devices" },
        { title: "White Paper", url: "/white-paper", icon: BookOpen, tip: "Generate the CDPT academic research paper" },
      ],
    }],
  },
  {
    label: "BUILD",
    accent: "#7FFF00",
    submenus: [{
      title: "Build",
      icon: Hammer,
      desc: "Create and manage AI components",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, tip: "Overview of your projects, modules, and activity" },
        { title: "Projects", url: "/projects", icon: FolderOpen, tip: "Manage web, Android, and hybrid app projects" },
        { title: "AI Modules", url: "/modules", icon: Cpu, tip: "Build single-purpose AI specialists with guardrails" },
        { title: "Stacks", url: "/stacks", icon: Layers, tip: "Wire modules into multi-step intelligent pipelines" },
        { title: "Build-a-AI", url: "/build-ai", icon: Brain, tip: "Describe what you need in plain English" },
        { title: "Forge AI", url: "/forge-ai", icon: Wand2, tip: "AI-powered code and content generation" },
        { title: "Image Forge", url: "/image-forge", icon: Image, tip: "Generate and edit images with AI" },
        { title: "Templates", url: "/templates", icon: LayoutTemplate, tip: "Pre-built module and stack templates" },
        { title: "Marketplace", url: "/marketplace", icon: Store, tip: "Browse and share community-built modules" },
      ],
    }],
  },
  {
    label: "DEPLOY",
    accent: "#FF6B35",
    submenus: [{
      title: "Deploy",
      icon: Rocket,
      desc: "Ship and run your models",
      items: [
        { title: "Pipelines", url: "/pipelines", icon: Workflow, tip: "Create and manage data processing pipelines" },
        { title: "Deploy Pipeline", url: "/deploy", icon: Rocket, tip: "Step-by-step guide to deploy your model" },
        { title: "Phone Guide", url: "/deploy/phone", icon: Smartphone, tip: "Deploy models to Android/iOS with Capacitor" },
        { title: "Inference", url: "/inference", icon: Terminal, tip: "Test your models with live inference playground" },
        { title: "Self-Host", url: "/self-host", icon: Server, tip: "Run everything locally — zero cloud dependency" },
        { title: "Export Studio", url: "/export", icon: ScrollText, tip: "Export datasets, models, and configs" },
        { title: "Runs", url: "/runs", icon: Activity, tip: "Execution history and step-by-step run traces" },
      ],
    }],
  },
  {
    label: "EXPLORE",
    accent: "#B44FFF",
    submenus: [{
      title: "Explore",
      icon: Compass,
      desc: "Discover tools and resources",
      items: [
        { title: "Solvers", url: "/solvers", icon: Atom, tip: "Library of reusable problem-solving patterns" },
        { title: "Capture", url: "/capture", icon: Smartphone, tip: "Capture training data from your phone" },
        { title: "Testing Lab", url: "/lab", icon: FlaskConical, tip: "Benchmark and test modules in isolation" },
        { title: "Model Zoo", url: "/models", icon: Box, tip: "Browse and download pre-trained model checkpoints" },
        { title: "Signal Lab", url: "/signals", icon: Radio, soon: true, tip: "Real-time signal processing and analysis" },
        { title: "Edge AI", url: "/edge-training", icon: CircuitBoard, soon: true, tip: "Train models directly on edge hardware" },
        { title: "Robotics", url: "/robotics", icon: Joystick, soon: true, tip: "AI controllers for robotic systems" },
        { title: "Game Engine", url: "/engine", icon: Gamepad2, soon: true, tip: "AI-powered game logic and NPC behavior" },
        { title: "Device Console", url: "/console", icon: Smartphone, tip: "Monitor and debug on-device model performance" },
      ],
    }],
  },
];

const adminItems: NavItem[] = [
  { title: "Admin", url: "/admin", icon: Shield, tip: "Platform administration and user management" },
  { title: "Settings", url: "/account", icon: Settings, tip: "Account settings, API keys, and preferences" },
];

// ── SIDEBAR ──────────────────────────────────────────────────────────────────
export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();

  const [simpleMode, setSimpleMode] = useState(() => {
    const saved = localStorage.getItem("soupy-sidebar-mode");
    return saved ? saved === "simple" : true; // default to simple
  });

  useEffect(() => {
    localStorage.setItem("soupy-sidebar-mode", simpleMode ? "simple" : "advanced");
  }, [simpleMode]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const sections = simpleMode ? simpleSections : advancedSections;

  // Check if any item in a submenu is active
  const isSubmenuActive = (submenu: NavSubmenu) =>
    submenu.items.some((item) => isActive(item.url));

  const renderNavItem = (item: NavItem, accent: string) => {
    const active = isActive(item.url);
    return (
      <SidebarMenuItem key={item.url}>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton asChild isActive={active} tooltip={collapsed ? item.title : undefined}>
              <NavLink to={item.url} style={{ position: "relative", overflow: "hidden" }}>
                {active && (
                  <span
                    style={{
                      position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                      background: item.accent || accent,
                    }}
                  />
                )}
                <item.icon
                  style={{
                    width: 14, height: 14, flexShrink: 0,
                    color: active ? (item.accent || accent) : item.hero ? accent : "inherit",
                  }}
                />
                {!collapsed && (
                  <span className="sl-nav-item flex flex-col flex-1 min-w-0">
                    <span className="flex items-center gap-2" style={{
                      fontSize: 12, fontWeight: active ? 700 : 500,
                      color: active ? (item.accent || accent) : item.hero ? "#FAFCFF" : "inherit",
                      letterSpacing: item.hero ? "0.05em" : "normal",
                    }}>
                      {item.title}
                      {item.soon && (
                        <span className="sl-soon-badge" style={{
                          fontSize: 7, letterSpacing: "0.2em", padding: "2px 6px",
                          border: "1px solid rgba(136,153,187,0.3)", color: "#8899BB",
                          clipPath: "polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)",
                        }}>
                          SOON
                        </span>
                      )}
                    </span>
                    {simpleMode && item.desc && !collapsed && (
                      <span style={{ fontSize: 10, color: "#8899BB", lineHeight: 1.3, marginTop: 1 }}>
                        {item.desc}
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
  };

  const renderSubmenu = (submenu: NavSubmenu, accent: string) => {
    const active = isSubmenuActive(submenu);

    // In advanced mode or if there's only one submenu in a section, render flat
    if (!simpleMode) {
      return (
        <SidebarMenu key={submenu.title}>
          {submenu.items.map((item) => renderNavItem(item, accent))}
        </SidebarMenu>
      );
    }

    // In simple mode, render collapsible submenus
    return (
      <Collapsible key={submenu.title} defaultOpen={active} className="group/submenu">
        <CollapsibleTrigger className={cn(
          "flex items-center gap-2.5 w-full px-3 py-2 rounded transition-colors",
          "hover:bg-white/5",
          active && "bg-white/5"
        )}>
          <submenu.icon style={{ width: 14, height: 14, flexShrink: 0, color: submenu.accent || accent }} />
          {!collapsed && (
            <>
              <span className="sl-nav-item flex-1 text-left min-w-0" style={{ fontSize: 12, fontWeight: 600 }}>
                <span style={{ color: active ? "#FAFCFF" : "inherit" }}>{submenu.title}</span>
                <span className="block" style={{ fontSize: 10, color: "#8899BB", lineHeight: 1.3, marginTop: 1 }}>
                  {submenu.desc}
                </span>
              </span>
              <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform group-data-[state=open]/submenu:rotate-90" />
            </>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenu className="ml-3 border-l border-white/5 pl-2 mt-1">
            {submenu.items.map((item) => renderNavItem(item, accent))}
          </SidebarMenu>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const renderSection = (section: NavSection) => (
    <SidebarGroup key={section.label}>
      {!collapsed && (
        <SidebarGroupLabel
          className="sl-group-label px-3 mb-1"
          style={{
            fontSize: 9, letterSpacing: "0.35em",
            color: section.accent, opacity: 0.7, fontWeight: 700,
          }}
        >
          {section.label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        {section.submenus.map((sub) => renderSubmenu(sub, section.accent))}
      </SidebarGroupContent>
    </SidebarGroup>
  );

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

        {/* Simple / Advanced toggle */}
        {!collapsed && (
          <button
            onClick={() => setSimpleMode(!simpleMode)}
            className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded transition-colors hover:bg-white/5"
            style={{ fontSize: 9, letterSpacing: "0.15em", color: "#8899BB" }}
          >
            {simpleMode ? (
              <ToggleLeft style={{ width: 14, height: 14, color: "#00E5FF" }} />
            ) : (
              <ToggleRight style={{ width: 14, height: 14, color: "#7FFF00" }} />
            )}
            <span className="sl-group-label">
              {simpleMode ? "SIMPLE" : "ADVANCED"}
            </span>
          </button>
        )}
      </SidebarHeader>

      {/* NAV */}
      <SidebarContent style={{ paddingTop: 8 }}>
        {sections.map((section, i) => (
          <div key={section.label}>
            {renderSection(section)}
            {i < sections.length - 1 && (
              <SidebarSeparator style={{ background: `${section.accent}10`, margin: "4px 0" }} />
            )}
          </div>
        ))}

        <SidebarSeparator style={{ background: "rgba(136,153,187,0.06)", margin: "4px 0" }} />

        {/* Admin — always flat */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel
              className="sl-group-label px-3 mb-1"
              style={{ fontSize: 9, letterSpacing: "0.35em", color: "#8899BB", opacity: 0.7, fontWeight: 700 }}
            >
              SYSTEM
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => renderNavItem(item, "#8899BB"))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter
        style={{
          padding: "12px 8px", borderTop: "1px solid rgba(0,229,255,0.08)",
          gap: 6, display: "flex", flexDirection: "column",
        }}
      >
        <OfflineIndicator collapsed={collapsed} />
        <CreditsBadge collapsed={collapsed} />

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
