import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const featureFlags = [
  { name: "AI Module Builder", enabled: true },
  { name: "Stack Orchestration", enabled: true },
  { name: "Android App Generation", enabled: true },
  { name: "SLM Mode", enabled: false },
  { name: "Real-time Collaboration", enabled: false },
  { name: "Local Model Support", enabled: false },
];

const metrics = [
  { label: "Total Users", value: "1,247" },
  { label: "Projects Created", value: "3,891" },
  { label: "Module Runs", value: "28,450" },
  { label: "Stack Executions", value: "12,300" },
];

export default function AdminPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{m.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-6">
        <h2 className="font-semibold mb-4">Feature Flags</h2>
        <div className="space-y-3">
          {featureFlags.map((f) => (
            <div key={f.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm">{f.name}</span>
                <Badge variant="outline" className="text-[10px]">{f.enabled ? "active" : "disabled"}</Badge>
              </div>
              <Switch defaultChecked={f.enabled} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
