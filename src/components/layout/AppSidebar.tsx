import { Badge } from "@/components/ui/badge";
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
  Sparkles,
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
import { Button } from "@/components/ui/button";

// SLM Lab — the hero feature, gets its own top-level group
const slmLabItems = [
  { title: "SLM Lab", url: "/slm-lab", icon: Sparkles, hero: true },
  { title: "Swipe Review", url: "/review", icon: SwatchBook },
  { title: "Training Jobs", url: "/training", icon: Activity },
  { title: "On-Device SLMs", url: "/on-device", icon: TabletSmartphone },
  { title: "White Paper", url: "/white-paper", icon: BookOpen },
];

// Build — creating AI modules, stacks, and apps
const buildItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "AI Modules", url: "/modules", icon: Brain },
  { title: "Stacks", url: "/stacks", icon: Layers },
  { title: "Build-a-AI", url: "/build-ai", icon: Cpu },
  { title: "Forge AI", url: "/forge-ai", icon: Wand2 },
  { title: "Image Forge", url: "/image-forge", icon: Image },
  { title: "Templates", url: "/templates", icon: LayoutTemplate },
  { title: "Marketplace", url: "/marketplace", icon: Store },
];

// Deploy & Run — testing, deployment, inference
const deployItems = [
  { title: "Pipelines", url: "/pipelines", icon: Workflow },
  { title: "Deploy Pipeline", url: "/deploy", icon: Rocket },
  { title: "Phone Guide", url: "/deploy/phone", icon: Smartphone },
  { title: "Inference", url: "/inference", icon: Terminal },
  { title: "Self-Host", url: "/self-host", icon: Server },
  { title: "Export Studio", url: "/export", icon: ScrollText },
  { title: "Runs", url: "/runs", icon: Activity },
];

// Explore — experimental and future features
const exploreItems = [
  { title: "Solvers", url: "/solvers", icon: Atom },
  { title: "Capture", url: "/capture", icon: Smartphone },
  { title: "Testing Lab", url: "/lab", icon: FlaskConical },
  { title: "Experimental", url: "/experimental", icon: Flame },
  { title: "Model Zoo", url: "/models", icon: Box, soon: true },
  { title: "Signal Lab", url: "/signals", icon: Radio, soon: true },
  { title: "Edge AI", url: "/edge-training", icon: CircuitBoard, soon: true },
  { title: "Robotics", url: "/robotics", icon: Joystick, soon: true },
  { title: "Game Engine", url: "/engine", icon: Gamepad2, soon: true },
  { title: "Device Console", url: "/console", icon: Smartphone, soon: true },
];

const adminItems = [
  { title: "Admin", url: "/admin", icon: Shield },
  { title: "Settings", url: "/account", icon: Settings },
];

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

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <NavLink to="/" className="flex items-center gap-2.5 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary glow-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold font-display tracking-wider">
              Soupy<span className="gradient-text">Forge</span>
            </span>
          )}
        </NavLink>
      </SidebarHeader>

      {/* FFX-style divider */}
      <div className="mx-3 ffx-divider" />

      <SidebarContent>
        {/* ══ SLM Lab — Hero Feature ══ */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-[10px] tracking-[0.15em] uppercase text-primary/80">
            🔥 SLM Lab
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {slmLabItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url}>
                      <item.icon className={`h-4 w-4 ${(item as any).hero ? "text-primary" : ""}`} />
                      {!collapsed && (
                        <span className={`font-semibold ${(item as any).hero ? "text-primary" : ""}`}>
                          {item.title}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ══ Build ══ */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60">Build</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {buildItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="font-semibold">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ══ Deploy & Run ══ */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60">Deploy & Run</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {deployItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="font-semibold">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ══ Explore ══ */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60">Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {exploreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title + ((item as any).soon ? " (Coming Soon)" : "")}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && (
                        <span className="font-semibold flex items-center gap-1.5">
                          {item.title}
                          {(item as any).soon && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 font-mono text-muted-foreground border-muted-foreground/30">
                              Soon
                            </Badge>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ══ System ══ */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60">System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="font-semibold">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-1">
        <OfflineIndicator collapsed={collapsed} />
        <CreditsBadge collapsed={collapsed} />
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start gap-2 font-semibold"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </Button>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={handleSignOut}
          className="w-full justify-start gap-2 text-destructive hover:text-destructive font-semibold"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
