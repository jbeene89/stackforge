import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { Button } from "@/components/ui/button";
import { Search, Command } from "lucide-react";

export function AppLayout() {
  const { open, setOpen } = useCommandPalette();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border px-4 glass-strong">
            <SidebarTrigger className="mr-4" />
            <Button
              variant="outline"
              size="sm"
              className="flex-1 max-w-md justify-start text-muted-foreground font-normal h-8"
              onClick={() => setOpen(true)}
            >
              <Search className="h-3.5 w-3.5 mr-2" />
              <span className="text-sm">Search or jump to...</span>
              <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                <Command className="h-3 w-3" />K
              </kbd>
            </Button>
            <div className="flex-1" />
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </SidebarProvider>
  );
}
