import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { Button } from "@/components/ui/button";
import { Search, Command } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CompanionSprites } from "@/components/CompanionSprites";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User, Settings } from "lucide-react";

export function AppLayout() {
  const { open, setOpen } = useCommandPalette();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || "User";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b px-3 sm:px-4 glass-strong" style={{ borderColor: 'hsl(var(--primary) / 0.1)' }}>
            <SidebarTrigger className="mr-2 sm:mr-4" />
            <Button
              variant="outline"
              size="sm"
              className="flex-1 max-w-md justify-start text-muted-foreground font-medium h-8 border-primary/10 hover:border-primary/30"
              onClick={() => setOpen(true)}
            >
              <Search className="h-3.5 w-3.5 mr-2" />
              <span className="text-xs sm:text-sm">Search…</span>
              <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                <Command className="h-3 w-3" />K
              </kbd>
            </Button>
            <div className="flex-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Avatar className="h-7 w-7">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                    <AvatarFallback className="text-xs bg-primary/15 text-primary font-bold">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 glass-strong">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-bold truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/account")} className="font-semibold">
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive font-semibold">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <CompanionSprites />
      <CommandPalette open={open} onOpenChange={setOpen} />
    </SidebarProvider>
  );
}
