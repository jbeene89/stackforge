import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home, Folder, Brain, Layers, FlaskConical, History, Settings, User,
  Plus, Sun, Moon, Search, FileText, Sparkles, Zap, Globe, Smartphone
} from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { mockProjects, mockModules, mockStacks } from "@/data/mock-data";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const runCommand = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => navigate("/onboarding"))}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
            <span className="ml-auto text-xs text-muted-foreground">⌘N</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/modules/new"))}>
            <Brain className="mr-2 h-4 w-4" />
            New AI Module
            <span className="ml-auto text-xs text-muted-foreground">⌘⇧M</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/stacks/new"))}>
            <Layers className="mr-2 h-4 w-4" />
            New Stack
            <span className="ml-auto text-xs text-muted-foreground">⌘⇧S</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))}>
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/projects"))}>
            <Folder className="mr-2 h-4 w-4" />
            Projects
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/modules"))}>
            <Brain className="mr-2 h-4 w-4" />
            AI Modules
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/stacks"))}>
            <Layers className="mr-2 h-4 w-4" />
            Stacks
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/templates"))}>
            <FileText className="mr-2 h-4 w-4" />
            Templates
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/lab"))}>
            <FlaskConical className="mr-2 h-4 w-4" />
            Testing Lab
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/runs"))}>
            <History className="mr-2 h-4 w-4" />
            Run History
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Recent Projects">
          {mockProjects.slice(0, 4).map((project) => (
            <CommandItem
              key={project.id}
              onSelect={() => runCommand(() => navigate(`/projects/${project.id}`))}
            >
              {project.type === "web" && <Globe className="mr-2 h-4 w-4 text-primary" />}
              {project.type === "android" && <Smartphone className="mr-2 h-4 w-4 text-forge-cyan" />}
              {project.type === "module" && <Brain className="mr-2 h-4 w-4 text-forge-amber" />}
              {project.type === "stack" && <Layers className="mr-2 h-4 w-4 text-forge-rose" />}
              {project.type === "hybrid" && <Sparkles className="mr-2 h-4 w-4 text-forge-emerald" />}
              {project.name}
              <span className="ml-auto text-xs text-muted-foreground capitalize">{project.type}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => setTheme(theme === "dark" ? "light" : "dark"))}>
            {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            Toggle {theme === "dark" ? "Light" : "Dark"} Mode
            <span className="ml-auto text-xs text-muted-foreground">⌘.</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/account"))}>
            <User className="mr-2 h-4 w-4" />
            Account Settings
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/admin"))}>
            <Settings className="mr-2 h-4 w-4" />
            Admin Panel
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}
