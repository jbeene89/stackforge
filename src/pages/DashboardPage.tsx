import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, Search, Globe, Smartphone, Brain, Layers, Send,
  Sparkles, TrendingUp, Lightbulb, Clock, ArrowRight, Star, MoreHorizontal,
  Play, Pause, CheckCircle2, AlertCircle
} from "lucide-react";
import { mockProjects } from "@/data/mock-data";
import type { ProjectType } from "@/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

const suggestions = [
  { id: 1, icon: Lightbulb, title: "Add user authentication", desc: "Secure your app with login/signup flow", project: "Contractor Dashboard" },
  { id: 2, icon: TrendingUp, title: "Optimize AI module", desc: "Your Marine Estimator has 92% accuracy — try SLM mode", project: "Marine Estimator" },
  { id: 3, icon: Sparkles, title: "New template available", desc: "Field Inspector Pro matches your recent projects", project: null },
];

const recentActivity = [
  { id: 1, action: "Deployed", project: "Contractor Dashboard", time: "2 hours ago", status: "success" },
  { id: 2, action: "Test run completed", project: "Marine Estimator", time: "4 hours ago", status: "success" },
  { id: 3, action: "Build failed", project: "Field Inspector", time: "Yesterday", status: "error" },
  { id: 4, action: "Created", project: "Medical QA Bot", time: "2 days ago", status: "neutral" },
];

export default function DashboardPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [promptValue, setPromptValue] = useState("");
  const [favorites, setFavorites] = useState<string[]>(["p-1", "p-3"]);
  const navigate = useNavigate();

  const filtered = mockProjects.filter((p) => {
    if (filter !== "all" && p.type !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleQuickPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (promptValue.trim()) {
      navigate("/onboarding");
    }
  };

  const toggleFavorite = (projectId: string) => {
    setFavorites(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header with Quick Prompt */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Your projects, modules, and stacks.</p>
          </div>
          <Button className="gradient-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" /> New Project
          </Button>
        </div>

        {/* Quick Prompt Bar */}
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleQuickPrompt}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <Input
              placeholder="Describe what you want to build... (e.g., 'A CRM with lead tracking')"
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-muted-foreground/60"
            />
            <Button type="submit" size="sm" className="gradient-primary text-primary-foreground" disabled={!promptValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-3 pl-8">
            <span className="text-xs text-muted-foreground">Quick:</span>
            {["CRM Dashboard", "Mobile Inspector", "AI Classifier"].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setPromptValue(suggestion)}
                className="text-xs px-2 py-1 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </motion.form>
      </div>

      {/* Smart Suggestions */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Lightbulb className="h-4 w-4" /> Smart Suggestions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {suggestions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-lg p-4 hover:glow-primary transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm group-hover:text-primary transition-colors">{s.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
                  {s.project && (
                    <Badge variant="secondary" className="text-[10px] mt-2">{s.project}</Badge>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Filters and Search */}
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
        <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-secondary text-xs font-mono text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((project, i) => {
          const Icon = typeIcons[project.type];
          const isFavorite = favorites.includes(project.id);
          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/projects/${project.id}`}
                className="glass rounded-xl p-5 hover:glow-primary transition-all group block relative"
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(project.id);
                  }}
                  className={cn(
                    "absolute top-3 right-3 p-1.5 rounded-md transition-colors",
                    isFavorite ? "text-forge-amber" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                  )}
                >
                  <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
                </button>
                <div className="flex items-start justify-between mb-3 pr-8">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    project.type === "web" && "bg-primary/10",
                    project.type === "android" && "bg-forge-cyan/10",
                    project.type === "module" && "bg-forge-amber/10",
                    project.type === "stack" && "bg-forge-rose/10",
                    project.type === "hybrid" && "bg-forge-emerald/10",
                  )}>
                    <Icon className={cn("h-5 w-5", typeColors[project.type])} />
                  </div>
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
            </motion.div>
          );
        })}

        {/* Empty State / Create New */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: filtered.length * 0.05 }}
          onClick={() => navigate("/onboarding")}
          className="glass rounded-xl p-5 border-2 border-dashed border-border hover:border-primary/30 transition-all flex flex-col items-center justify-center min-h-[180px] group"
        >
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
            <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Create new project</span>
        </motion.button>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" /> Recent Activity
          </h2>
          <Button variant="ghost" size="sm" className="text-xs">
            View all <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <div className="glass rounded-xl divide-y divide-border">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                activity.status === "success" && "bg-forge-emerald/10",
                activity.status === "error" && "bg-destructive/10",
                activity.status === "neutral" && "bg-secondary",
              )}>
                {activity.status === "success" && <CheckCircle2 className="h-4 w-4 text-forge-emerald" />}
                {activity.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
                {activity.status === "neutral" && <Clock className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <span className="font-medium">{activity.action}</span>
                  <span className="text-muted-foreground"> · </span>
                  <span className="text-primary">{activity.project}</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
