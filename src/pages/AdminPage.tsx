import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useProjects, useModules, useStacks, useRuns, useProfile } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield, Users, Settings, BarChart3, Activity,
  TrendingUp, Zap, Clock, Globe, Cpu, HardDrive, AlertTriangle,
  Brain, Layers
} from "lucide-react";

// ------- FEATURE FLAGS (local state, no DB table for these) -------
const featureFlags = [
  { name: "AI Module Builder", description: "Visual module configuration and prompt engineering", enabled: true, category: "core" },
  { name: "Stack Orchestration", description: "Multi-node pipeline builder with canvas editor", enabled: true, category: "core" },
  { name: "Android App Generation", description: "Generate native Android apps from AI specs", enabled: true, category: "generation" },
  { name: "SLM Mode", description: "Small Language Model optimization for edge deployment", enabled: false, category: "experimental" },
  { name: "Real-time Collaboration", description: "Live multi-user editing and cursors", enabled: false, category: "experimental" },
  { name: "Local Model Support", description: "Run models locally via Ollama or LM Studio", enabled: false, category: "experimental" },
  { name: "Auto-versioning", description: "Automatic version snapshots on every save", enabled: true, category: "core" },
  { name: "Usage Analytics", description: "Detailed per-user and per-project analytics", enabled: true, category: "analytics" },
];

export default function AdminPage() {
  const [flags, setFlags] = useState(featureFlags.map((f) => ({ ...f })));

  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: projects } = useProjects();
  const { data: modules } = useModules();
  const { data: stacks } = useStacks();
  const { data: runs } = useRuns();

  const projectCount = projects?.length || 0;
  const moduleCount = modules?.length || 0;
  const stackCount = stacks?.length || 0;
  const runCount = runs?.length || 0;

  const successRuns = runs?.filter(r => r.status === "success").length || 0;
  const failedRuns = runs?.filter(r => r.status === "failed").length || 0;
  const errorRate = runCount > 0 ? ((failedRuns / runCount) * 100).toFixed(1) : "0.0";
  const avgDuration = runCount > 0
    ? ((runs?.reduce((a, r) => a + r.total_duration_ms, 0) || 0) / runCount / 1000).toFixed(1)
    : "0.0";

  const deployedProjects = projects?.filter(p => p.status === "deployed").length || 0;

  const systemMetrics = [
    { label: "Projects", value: projectCount.toString(), icon: Globe },
    { label: "Modules", value: moduleCount.toString(), icon: Brain },
    { label: "Stacks", value: stackCount.toString(), icon: Layers },
    { label: "Total Runs", value: runCount.toString(), icon: Zap },
    { label: "Successful Runs", value: successRuns.toString(), icon: Activity },
    { label: "Avg Latency", value: `${avgDuration}s`, icon: Clock },
    { label: "Error Rate", value: `${errorRate}%`, icon: AlertTriangle },
    { label: "Deployed", value: deployedProjects.toString(), icon: Cpu },
  ];

  const toggleFlag = (name: string) => {
    setFlags((prev) => prev.map((f) => f.name === name ? { ...f, enabled: !f.enabled } : f));
  };

  return (
    <div className="p-6 h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <Badge variant="outline" className="text-[10px]">{profile?.display_name || user?.email}</Badge>
      </div>

      <Tabs defaultValue="metrics" className="flex-1 flex flex-col min-h-0">
        <TabsList className="glass w-fit mb-4">
          <TabsTrigger value="metrics" className="text-xs gap-1.5"><BarChart3 className="h-3 w-3" /> Overview</TabsTrigger>
          <TabsTrigger value="flags" className="text-xs gap-1.5"><Settings className="h-3 w-3" /> Feature Flags</TabsTrigger>
          <TabsTrigger value="recent" className="text-xs gap-1.5"><Activity className="h-3 w-3" /> Recent Runs</TabsTrigger>
        </TabsList>

        {/* System Metrics */}
        <TabsContent value="metrics" className="flex-1 min-h-0 mt-0 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {systemMetrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{m.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{m.label}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Resource gauges */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Projects Active", value: projectCount > 0 ? Math.round((deployedProjects / projectCount) * 100) : 0, color: "bg-primary" },
              { label: "Run Success Rate", value: runCount > 0 ? Math.round((successRuns / runCount) * 100) : 0, color: "bg-forge-emerald" },
              { label: "Modules with SLM", value: moduleCount > 0 ? Math.round(((modules?.filter(m => m.slm_mode).length || 0) / moduleCount) * 100) : 0, color: "bg-forge-cyan" },
            ].map((gauge) => (
              <div key={gauge.label} className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{gauge.label}</span>
                  <span className="text-sm font-bold">{gauge.value}%</span>
                </div>
                <Progress value={gauge.value} className="h-2" />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Feature Flags */}
        <TabsContent value="flags" className="flex-1 min-h-0 mt-0 overflow-auto">
          {["core", "generation", "analytics", "experimental"].map((cat) => {
            const catFlags = flags.filter((f) => f.category === cat);
            if (catFlags.length === 0) return null;
            return (
              <div key={cat} className="mb-6">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 capitalize">{cat}</h3>
                <div className="space-y-2">
                  {catFlags.map((flag) => (
                    <motion.div
                      key={flag.name}
                      layout
                      className="glass rounded-xl px-5 py-3.5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", flag.enabled ? "bg-forge-emerald" : "bg-muted-foreground/30")} />
                        <div>
                          <span className="text-sm font-medium">{flag.name}</span>
                          <p className="text-[10px] text-muted-foreground">{flag.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[10px]">{flag.enabled ? "active" : "disabled"}</Badge>
                        <Switch checked={flag.enabled} onCheckedChange={() => toggleFlag(flag.name)} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* Recent Runs */}
        <TabsContent value="recent" className="flex-1 min-h-0 mt-0 overflow-auto">
          {!runs?.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No runs recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {runs.map((run, i) => (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-lg px-4 py-3 flex items-center gap-4"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                    run.status === "success" ? "bg-forge-emerald/15 text-forge-emerald" : 
                    run.status === "failed" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
                  )}>
                    {run.target_type === "module" ? "M" : run.target_type === "stack" ? "S" : "R"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-semibold">{run.target_name}</span>
                      {" "}
                      <span className={cn("font-medium", run.status === "success" ? "text-forge-emerald" : "text-destructive")}>{run.status}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {run.target_type} · v{run.version} · {(Array.isArray(run.steps) ? run.steps : []).length} steps · {(run.total_duration_ms / 1000).toFixed(1)}s
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{new Date(run.started_at).toLocaleString()}</span>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
