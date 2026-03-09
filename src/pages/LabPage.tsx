import { Badge } from "@/components/ui/badge";
import { mockRuns } from "@/data/mock-data";

const statusColors: Record<string, string> = {
  success: "bg-forge-emerald/15 text-forge-emerald",
  failed: "bg-destructive/15 text-destructive",
  running: "bg-forge-amber/15 text-forge-amber",
  pending: "bg-muted text-muted-foreground",
  paused: "bg-primary/15 text-primary",
};

export default function LabPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Testing Lab</h1>
        <p className="text-sm text-muted-foreground">Test modules and stacks. Inspect every step.</p>
      </div>
      <div className="space-y-4">
        {mockRuns.map((run) => (
          <div key={run.id} className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm">{run.targetName}</h3>
                <span className="text-xs text-muted-foreground">{run.targetType} · v{run.version}</span>
              </div>
              <Badge className={statusColors[run.status]}>{run.status}</Badge>
            </div>
            <div className="space-y-2">
              {run.steps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-3 text-xs">
                  <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium">{i + 1}</span>
                  <span className="font-medium w-36 truncate">{step.nodeLabel}</span>
                  <Badge variant="outline" className={`text-[10px] ${statusColors[step.status]}`}>{step.status}</Badge>
                  <span className="text-muted-foreground">{step.durationMs}ms</span>
                  <span className="text-muted-foreground truncate flex-1">{step.output.substring(0, 60)}…</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-muted-foreground">
              Total: {run.totalDurationMs}ms · {new Date(run.startedAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
