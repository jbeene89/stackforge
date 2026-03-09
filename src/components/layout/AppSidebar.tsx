import {
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
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
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
  { title: "Templates", url: "/templates", icon: LayoutTemplate },
];

const toolItems = [
  { title: "Testing Lab", url: "/lab", icon: FlaskConical },
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
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <NavLink to="/" className="flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold tracking-tight">
              StackForge <span className="text-primary">AI</span>
            </span>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
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
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
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
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
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
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start gap-2"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
