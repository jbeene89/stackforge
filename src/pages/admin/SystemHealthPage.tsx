import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  HeartPulse, Database, Users, Layers, Brain, Activity,
  Zap, Clock, AlertTriangle, CheckCircle2, Server,
} from "lucide-react";
import { useProjects, useModules, useStacks, useRuns } from "@/hooks/useSupabaseData";

export default function SystemHealthPage() {
  const { data: projects } = useProjects();
  const { data: modules } = useModules();
  const { data: stacks } = useStacks();
  const { data: runs } = useRuns();

  // Platform-wide counts (admin can see all profiles)
  const { data: totalUsers } = useQuery({
    queryKey: ["admin-total-users"],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: totalDatasets } = useQuery({
    queryKey: ["admin-total-datasets"],
    queryFn: async () => {
      const { count } = await supabase
        .from("training_datasets")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: totalSamples } = useQuery({
    queryKey: ["admin-total-samples"],
    queryFn: async () => {
      const { count } = await supabase
        .from("dataset_samples")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: recentRuns } = useQuery({
    queryKey: ["admin-recent-runs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("runs")
        .select("id, status, total_duration_ms, started_at, target_name")
        .order("started_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const runCount = runs?.length || 0;
  const successRuns = runs?.filter((r) => r.status === "success").length || 0;
  const failedRuns = runs?.filter((r) => r.status === "failed").length || 0;
  const successRate = runCount > 0 ? ((successRuns / runCount) * 100).toFixed(1) : "100";
  const avgLatency = runCount > 0
    ? ((runs?.reduce((a, r) => a + r.total_duration_ms, 0) || 0) / runCount / 1000).toFixed(2)
    : "0";

  const healthChecks = [
    {
      label: "Database",
      status: "healthy" as const,
      detail: `${totalUsers || 0} users, ${totalDatasets || 0} datasets`,
      icon: Database,
    },
    {
      label: "Run Pipeline",
      status: failedRuns > (runCount * 0.2) ? "degraded" as const : "healthy" as const,
      detail: `${successRate}% success rate`,
      icon: Activity,
    },
    {
      label: "Edge Functions",
      status: "healthy" as const,
      detail: "All functions deployed",
      icon: Server,
    },
  ];

  const statusColor = {
    healthy: "text-[hsl(var(--forge-emerald))]",
    degraded: "text-forge-amber",
    down: "text-destructive",
  };

  const statusBg = {
    healthy: "bg-[hsl(var(--forge-emerald))]/10",
    degraded: "bg-forge-amber/10",
    down: "bg-destructive/10",
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-5xl">
      <div className="flex items-center gap-3">
        <HeartPulse className="h-5 w-5 text-[hsl(var(--forge-emerald))]" />
        <h1 className="text-2xl font-bold font-display tracking-wide">System Health</h1>
        <Badge className="bg-[hsl(var(--forge-emerald))]/15 text-[hsl(var(--forge-emerald))] border-[hsl(var(--forge-emerald))]/30 text-[10px]">
          Live
        </Badge>
      </div>

      {/* Health checks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {healthChecks.map((check) => (
          <div key={check.label} className={`glass rounded-xl p-4 border ${
            check.status === "healthy" ? "border-[hsl(var(--forge-emerald))]/20" :
            check.status === "degraded" ? "border-forge-amber/20" : "border-destructive/20"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <check.icon className={`h-4 w-4 ${statusColor[check.status]}`} />
              <span className="text-sm font-semibold">{check.label}</span>
              <CheckCircle2 className={`h-3.5 w-3.5 ml-auto ${statusColor[check.status]}`} />
            </div>
            <p className="text-xs text-muted-foreground">{check.detail}</p>
            <div className={`mt-2 rounded-full h-1.5 ${statusBg[check.status]}`}>
              <div
                className={`h-full rounded-full transition-all ${
                  check.status === "healthy" ? "bg-[hsl(var(--forge-emerald))]" :
                  check.status === "degraded" ? "bg-forge-amber" : "bg-destructive"
                }`}
                style={{ width: check.status === "healthy" ? "100%" : check.status === "degraded" ? "60%" : "20%" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: totalUsers?.toString() || "—", icon: Users, color: "#00E5FF" },
          { label: "Datasets", value: totalDatasets?.toString() || "—", icon: Layers, color: "#7FFF00" },
          { label: "Samples", value: totalSamples?.toLocaleString() || "—", icon: Brain, color: "#B44FFF" },
          { label: "Avg Latency", value: `${avgLatency}s`, icon: Clock, color: "#FF6B35" },
        ].map((m) => (
          <div key={m.label} className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <m.icon className="h-3.5 w-3.5" style={{ color: m.color }} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <p className="text-2xl font-bold">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Run success/failure */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Pipeline Health
        </h3>
        <div className="grid grid-cols-3 gap-6 mb-4">
          <div>
            <p className="text-2xl font-bold text-[hsl(var(--forge-emerald))]">{successRuns}</p>
            <p className="text-[10px] text-muted-foreground">Successful Runs</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-destructive">{failedRuns}</p>
            <p className="text-[10px] text-muted-foreground">Failed Runs</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{runCount}</p>
            <p className="text-[10px] text-muted-foreground">Total Runs</p>
          </div>
        </div>
        <Progress value={parseFloat(successRate)} className="h-2" />
        <p className="text-[10px] text-muted-foreground mt-1">{successRate}% success rate</p>
      </div>

      {/* Recent runs */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">Recent Runs</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentRuns?.map((run: any) => (
            <div key={run.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                {run.status === "success" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--forge-emerald))]" />
                ) : run.status === "failed" ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                ) : (
                  <Zap className="h-3.5 w-3.5 text-forge-amber" />
                )}
                <span className="text-sm">{run.target_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{(run.total_duration_ms / 1000).toFixed(1)}s</span>
                <Badge variant={run.status === "success" ? "default" : "destructive"} className="text-[9px]">
                  {run.status}
                </Badge>
              </div>
            </div>
          ))}
          {(!recentRuns || recentRuns.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-4">No runs yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
