import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import bgLandscape from "@/assets/bg-landscape.jpg";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Settings, Search, Command } from "lucide-react";

const LayoutFonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Space+Mono:wght@400;700&family=Chakra+Petch:wght@400;600&display=swap');
    .sl-layout { font-family: 'Chakra Petch', sans-serif; }
    .sl-layout .sl-header { font-family: 'Space Mono', monospace; }
    .sl-layout .sl-search {
      font-family: 'Space Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.2em;
      background: rgba(0,229,255,0.04);
      border: 1px solid rgba(0,229,255,0.12);
      color: rgba(136,153,187,0.8);
      display: flex; align-items: center; gap: 10px;
      padding: 6px 14px; cursor: pointer;
      clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
      transition: border-color 0.2s, color 0.2s;
      max-width: 320px; width: 100%;
    }
    .sl-layout .sl-search:hover {
      border-color: rgba(0,229,255,0.3);
      color: rgba(250,252,255,0.8);
    }
  `}</style>
);

export function AppLayout() {
  const { open, setOpen } = useCommandPalette();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || "User";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <LayoutFonts />
      <div className="sl-layout min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* ── HEADER ── */}
          <header
            className="sl-header flex items-center h-12 px-4 gap-3"
            style={{
              background: "hsl(var(--background) / 0.95)",
              borderBottom: "1px solid hsl(var(--border))",
              backdropFilter: "blur(8px)",
              flexShrink: 0,
            }}
          >
            <SidebarTrigger className="text-muted-foreground" />

            {/* Search bar */}
            <button className="sl-search" onClick={() => setOpen(true)}>
              <Search style={{ width: 12, height: 12, flexShrink: 0 }} />
              <span style={{ flex: 1, textAlign: "left" }}>SEARCH…</span>
              <span style={{ display: "flex", alignItems: "center", gap: 2, opacity: 0.4, fontSize: 9 }}>
                <Command style={{ width: 10, height: 10 }} />K
              </span>
            </button>

            <div style={{ flex: 1 }} />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "1px solid rgba(0,229,255,0.2)",
                    padding: 0,
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "transparent",
                    flexShrink: 0,
                  }}
                >
                  <Avatar style={{ width: 30, height: 30 }}>
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                    <AvatarFallback
                      style={{
                        background: "rgba(0,229,255,0.1)",
                        color: "#00E5FF",
                        fontSize: 10,
                        fontFamily: "Space Mono, monospace",
                        fontWeight: 700,
                      }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52"
                style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0 }}
              >
                <div style={{ padding: "12px 14px", borderBottom: "1px solid hsl(var(--border))" }}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "hsl(var(--foreground))",
                      fontFamily: "Orbitron, monospace",
                      letterSpacing: "0.05em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {displayName.toUpperCase()}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: "hsl(var(--muted-foreground))",
                      fontFamily: "Space Mono, monospace",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginTop: 2,
                    }}
                  >
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator style={{ background: "hsl(var(--border))" }} />
                <DropdownMenuItem
                  onClick={() => navigate("/account")}
                  style={{
                    fontFamily: "Space Mono, monospace",
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    color: "hsl(var(--muted-foreground))",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--foreground))")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}
                >
                  <Settings style={{ width: 12, height: 12, marginRight: 8 }} /> SETTINGS
                </DropdownMenuItem>
                <DropdownMenuSeparator style={{ background: "hsl(var(--border))" }} />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  style={{
                    fontFamily: "Space Mono, monospace",
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    color: "#FF6B35",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#FF4500")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#FF6B35")}
                >
                  <LogOut style={{ width: 12, height: 12, marginRight: 8 }} /> SIGN OUT
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* ── MAIN CONTENT ── */}
          <main className="flex-1 overflow-auto bg-background">
            <Outlet />
          </main>
        </div>
      </div>
      
      <CommandPalette open={open} onOpenChange={setOpen} />
    </SidebarProvider>
  );
}
