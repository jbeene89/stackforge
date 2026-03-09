import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Globe, Smartphone, Brain, Layers } from "lucide-react";
import { mockProjects } from "@/data/mock-data";
import type { ProjectType } from "@/types";
import { cn } from "@/lib/utils";

const typeIcons: Record<ProjectType, React.ElementType> = {
  web: Globe,
  android: Smartphone,
  module: Brain,
  stack: Layers,
  hybrid: Layers,
};

const typeColors: Record<ProjectType, string> = {
  web: "text-primary",
  android: "text-forge-cyan",
  module: "text-forge-amber",
  stack: "text-forge-rose",
  hybrid: "text-forge-emerald",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  building: "bg-forge-amber/15 text-forge-amber",
  testing: "bg-primary/15 text-primary",
  deployed: "bg-forge-emerald/15 text-forge-emerald",
  archived: "bg-muted text-muted-foreground",
};

const filterTabs: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Web", value: "web" },
  { label: "Android", value: "android" },
  { label: "AI Module", value: "module" },
  { label: "Stack", value: "stack" },
];

export default function DashboardPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = mockProjects.filter((p) => {
    if (filter !== "all" && p.type !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your projects, modules, and stacks.</p>
        </div>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" /> New Project
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex gap-1 p-1 rounded-lg bg-secondary/50">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                filter === tab.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((project) => {
          const Icon = typeIcons[project.type];
          return (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="glass rounded-xl p-5 hover:glow-primary transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <Icon className={cn("h-5 w-5", typeColors[project.type])} />
                <Badge variant="secondary" className={cn("text-[10px]", statusColors[project.status])}>
                  {project.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{project.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>v{project.versionCount}</span>
                <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
