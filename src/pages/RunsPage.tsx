import { Badge } from "@/components/ui/badge";
import { mockRuns } from "@/data/mock-data";

const statusColors: Record<string, string> = {
  success: "bg-forge-emerald/15 text-forge-emerald",
  failed: "bg-destructive/15 text-destructive",
  running: "bg-forge-amber/15 text-forge-amber",
  pending: "bg-muted text-muted-foreground",
  paused: "bg-primary/15 text-primary",
};

export default function RunsPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Execution Runs</h1>
        <p className="text-sm text-muted-foreground">History of all module and stack executions.</p>
      </div>
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="p-3">Run</th>
              <th className="p-3">Target</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Duration</th>
              <th className="p-3">Version</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {mockRuns.map((run) => (
              <tr key={run.id} className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer">
                <td className="p-3 font-mono text-xs">{run.id}</td>
                <td className="p-3 font-medium">{run.targetName}</td>
                <td className="p-3"><Badge variant="outline" className="text-[10px] capitalize">{run.targetType}</Badge></td>
                <td className="p-3"><Badge className={statusColors[run.status]}>{run.status}</Badge></td>
                <td className="p-3 text-muted-foreground">{(run.totalDurationMs / 1000).toFixed(1)}s</td>
                <td className="p-3 text-muted-foreground">v{run.version}</td>
                <td className="p-3 text-muted-foreground">{new Date(run.startedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
