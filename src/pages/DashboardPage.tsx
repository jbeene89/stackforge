import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus, Search, Globe, Smartphone, Brain, Layers, Send,
  Sparkles, ArrowRight, Star, Clock, CheckCircle2, AlertCircle,
  Zap, BarChart3, GitBranch
} from "lucide-react";
import { useProjects, useModules, useStacks, useRuns } from "@/hooks/useSupabaseData";
import { useCredits } from "@/hooks/useCredits";
import { TierBadge } from "@/components/TierBadge";
import { IndependenceScorecard } from "@/components/IndependenceScorecard";
import type { ProjectType } from "@/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { OnboardingTour } from "@/components/OnboardingTour";

const typeIcons: Record<ProjectType, React.ElementType> = {
  web: Globe, android: Smartphone, module: Brain, stack: Layers, hybrid: Layers,
};

const typeColors: Record<ProjectType, string> = {
  web: "text-primary", android: "text-forge-cyan", module: "text-forge-amber", stack: "text-forge-rose", hybrid: "text-forge-emerald",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground", building: "bg-forge-amber/15 text-forge-amber",
  testing: "bg-primary/15 text-primary", deployed: "bg-forge-emerald/15 text-forge-emerald", archived: "bg-muted text-muted-foreground",
};

const filterTabs = [
  { label: "All", value: "all" },
  { label: "Stacks", value: "stack" },
  { label: "Modules", value: "module" },
  { label: "Web", value: "web" },
  { label: "Android", value: "android" },
];

export default function DashboardPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [promptValue, setPromptValue] = useState("");
  const navigate = useNavigate();

  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: modules } = useModules();
  const { data: stacks } = useStacks();
  const { data: runs } = useRuns();
  const { data: credits } = useCredits();

  const filtered = (projects || []).filter((p) => {
    if (filter !== "all" && p.type !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleQuickPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (promptValue.trim()) navigate("/onboarding");
  };

  const deployedCount = (projects || []).filter((p) => p.status === "deployed").length;
  const totalModules = modules?.length || 0;
  const totalStacks = stacks?.length || 0;
  const lastRun = runs?.[0];

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 animate-fade-in max-w-7xl mx-auto">
      <OnboardingTour />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 id="tour-welcome" className="text-xl sm:text-2xl font-bold">Dashboard</h1>
            {credits && <TierBadge tier={credits.tier} size="md" />}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Your projects, modules, and stacks.</p>
        </div>
        <Button className="gradient-primary text-primary-foreground w-full sm:w-auto" onClick={() => navigate("/onboarding")}>
          <Plus className="h-4 w-4 mr-2" /> New Project
        </Button>
      </div>

      {/* Quick Prompt */}
      <motion.form
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleQuickPrompt}
        className="glass-strong rounded-xl p-3 sm:p-4"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <Input
            placeholder="Describe what you want to build…"
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-sm sm:text-base placeholder:text-muted-foreground/50"
          />
          <Button type="submit" size="sm" className="gradient-primary text-primary-foreground shrink-0" disabled={!promptValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </motion.form>

      {/* Independence Scorecard */}
      <IndependenceScorecard compact />

      {/* Status bar */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {[
          { label: "Deployed", value: deployedCount, icon: CheckCircle2, color: "text-forge-emerald" },
          { label: "Modules", value: totalModules, icon: Brain, color: "text-forge-amber" },
          { label: "Stacks", value: totalStacks, icon: Layers, color: "text-forge-rose" },
          { label: "Last Run", value: lastRun ? `${(lastRun.total_duration_ms / 1000).toFixed(1)}s` : "—", icon: Zap, color: "text-forge-cyan", sub: lastRun?.status },
        ].map((m) => (
          <div key={m.label} className="glass-hover rounded-xl px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3">
            <div className={cn("w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-card", m.color === "text-forge-emerald" && "bg-forge-emerald/10", m.color === "text-forge-amber" && "bg-forge-amber/10", m.color === "text-forge-rose" && "bg-forge-rose/10", m.color === "text-forge-cyan" && "bg-forge-cyan/10")}>
              <m.icon className={cn("h-4 w-4", m.color)} />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold leading-none">{m.value}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 overflow-x-auto no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                filter === tab.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
      </div>

      {/* Project Grid */}
      {loadingProjects ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
      ) : filtered.length === 0 && !search ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/5 flex items-center justify-center">
            <Plus className="h-8 w-8 opacity-40" />
          </div>
          <p className="text-sm font-medium">No projects yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first project to get started.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((project, i) => {
            const Icon = typeIcons[project.type as ProjectType] || Layers;
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={`/projects/${project.id}`}
                  className="glass-hover rounded-xl p-4 sm:p-5 group block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center",
                      project.type === "web" && "bg-primary/10",
                      project.type === "android" && "bg-forge-cyan/10",
                      project.type === "module" && "bg-forge-amber/10",
                      project.type === "stack" && "bg-forge-rose/10",
                      project.type === "hybrid" && "bg-forge-emerald/10",
                    )}>
                      <Icon className={cn("h-4 w-4", typeColors[project.type as ProjectType] || "text-primary")} />
                    </div>
                    <Badge variant="secondary" className={cn("text-[10px]", statusColors[project.status] || "")}>
                      {project.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{project.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>v{project.version_count}</span>
                    <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filtered.length * 0.04 }}
            onClick={() => navigate("/onboarding")}
            className="glass rounded-xl p-5 border-2 border-dashed border-border hover:border-primary/30 transition-all flex flex-col items-center justify-center min-h-[160px] group"
          >
            <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">New project</span>
          </motion.button>
        </div>
      )}

      {/* Recent runs */}
      {runs && runs.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" /> Recent Runs
            </h2>
            <Link to="/runs">
              <Button variant="ghost" size="sm" className="text-xs">View all <ArrowRight className="h-3 w-3 ml-1" /></Button>
            </Link>
          </div>
          <div className="glass rounded-xl divide-y divide-border/50 overflow-hidden">
            {runs.slice(0, 5).map((run) => (
              <Link to="/runs" key={run.id} className="flex items-center gap-3 p-3 hover:bg-secondary/20 transition-colors">
                <CheckCircle2 className={cn("h-4 w-4 shrink-0", run.status === "success" ? "text-forge-emerald" : "text-destructive")} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{run.target_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(Array.isArray(run.steps) ? run.steps : []).length} steps · {(run.total_duration_ms / 1000).toFixed(1)}s
                  </span>
                </div>
                <span className="text-xs text-muted-foreground hidden sm:block">{new Date(run.started_at).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
