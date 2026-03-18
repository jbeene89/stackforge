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
  TabletSmartphone,
  LogOut,
  Store,
  Smartphone,
  SwatchBook,
  Terminal,
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

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "AI Modules", url: "/modules", icon: Brain },
  { title: "Stacks", url: "/stacks", icon: Layers },
  { title: "Build-a-AI", url: "/build-ai", icon: Cpu },
  { title: "Solvers", url: "/solvers", icon: Atom },
  { title: "Model Zoo", url: "/models", icon: Box },
  { title: "Pipelines", url: "/pipelines", icon: Workflow },
  { title: "Signal Lab", url: "/signals", icon: Radio },
  { title: "Robotics", url: "/robotics", icon: Joystick },
  { title: "Game Engine", url: "/engine", icon: Gamepad2 },
  { title: "Forge AI", url: "/forge-ai", icon: Wand2 },
  { title: "Edge AI", url: "/edge-training", icon: CircuitBoard },
  { title: "SLM Lab", url: "/slm-lab", icon: Sparkles },
  { title: "Templates", url: "/templates", icon: LayoutTemplate },
  { title: "Marketplace", url: "/marketplace", icon: Store },
  { title: "Experimental", url: "/experimental", icon: Flame },
];

const toolItems = [
  { title: "Capture", url: "/capture", icon: Smartphone },
  { title: "Swipe Review", url: "/review", icon: SwatchBook },
  { title: "On-Device SLMs", url: "/on-device", icon: Smartphone },
  { title: "Deploy Pipeline", url: "/deploy", icon: Rocket },
  { title: "Phone Guide", url: "/deploy/phone", icon: TabletSmartphone },
  { title: "Inference", url: "/inference", icon: Terminal },
  { title: "Device Console", url: "/console", icon: Smartphone },
  { title: "Self-Host", url: "/self-host", icon: Server },
  { title: "Export Studio", url: "/export", icon: ScrollText },
  { title: "White Paper", url: "/white-paper", icon: BookOpen },
  { title: "Testing Lab", url: "/lab", icon: FlaskConical },
  { title: "Training Jobs", url: "/training", icon: Activity },
  { title: "Runs", url: "/runs", icon: Activity },
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
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
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

        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60">Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
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

        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60">System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
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
