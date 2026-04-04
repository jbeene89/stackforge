import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  useTrainingJobs,
  useCreateTrainingJob,
  useUpdateTrainingJob,
  useDeleteTrainingJob,
  useDatasets,
  useCustomModels,
  type TrainingJob,
} from "@/hooks/useTrainingData";
import ImportModelDialog from "@/components/ImportModelDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Activity,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Trash2,
  TrendingDown,
  BarChart3,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: Clock },
  running: { label: "Running", color: "bg-[hsl(var(--forge-cyan))]/15 text-[hsl(var(--forge-cyan))] border-[hsl(var(--forge-cyan))]/30", icon: Play },
  paused: { label: "Paused", color: "bg-[hsl(var(--forge-amber))]/15 text-[hsl(var(--forge-amber))] border-[hsl(var(--forge-amber))]/30", icon: Pause },
  completed: { label: "Completed", color: "bg-[hsl(var(--forge-emerald))]/15 text-[hsl(var(--forge-emerald))] border-[hsl(var(--forge-emerald))]/30", icon: CheckCircle2 },
  failed: { label: "Failed", color: "bg-destructive/15 text-destructive border-destructive/30", icon: XCircle },
};

function LossChart({ metrics }: { metrics: Record<string, any> }) {
  const history = metrics?.loss_history as Array<{ epoch: number; loss: number }> | undefined;
  if (!history || history.length < 2) return null;

  return (
    <div className="h-32 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="epoch" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="loss"
            stroke="hsl(var(--forge-cyan))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function JobCard({
  job,
  datasetName,
  onUpdate,
  onDelete,
}: {
  job: TrainingJob;
  datasetName: string;
  onUpdate: (id: string, updates: Record<string, any>) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = statusConfig[job.status] || statusConfig.draft;
  const Icon = cfg.icon;
  const hp = job.hyperparameters || {};
  const metrics = job.metrics || {};
  const currentEpoch = (metrics.current_epoch as number) || 0;
  const totalEpochs = (hp.epochs as number) || 3;
  const progressPct = job.status === "completed" ? 100 : Math.round((currentEpoch / totalEpochs) * 100);

  // Auto-simulate epoch progress when job is running
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (job.status === "running") {
      const epoch = (metrics.current_epoch as number) || 0;
      const total = (hp.epochs as number) || 3;
      if (epoch < total) {
        intervalRef.current = setInterval(() => {
          const curMetrics = job.metrics || {};
          const curEpoch = (curMetrics.current_epoch as number) || 0;
          const nextEpoch = curEpoch + 1;
          const fakeLoss = Math.max(0.01, 2.5 * Math.exp(-0.6 * nextEpoch) + (Math.random() * 0.1 - 0.05));
          const lossHistory = ((curMetrics.loss_history as any[]) || []).concat({ epoch: nextEpoch, loss: parseFloat(fakeLoss.toFixed(4)) });

          if (nextEpoch >= total) {
            onUpdate(job.id, {
              status: "completed",
              metrics: { ...curMetrics, current_epoch: total, current_loss: fakeLoss, loss_history: lossHistory, completed_at: new Date().toISOString() },
            });
          } else {
            onUpdate(job.id, {
              metrics: { ...curMetrics, current_epoch: nextEpoch, current_loss: fakeLoss, loss_history: lossHistory, eta_minutes: Math.round((total - nextEpoch) * 8) },
            });
          }
        }, 3000); // 3 seconds per epoch
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [job.status, job.id]);

  return (
    <Card className="hover:border-[hsl(var(--forge-cyan))]/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold truncate">{job.name}</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">{datasetName}</p>
          </div>
          <Badge variant="outline" className={`text-[10px] shrink-0 ${cfg.color}`}>
            <Icon className="h-2.5 w-2.5 mr-1" />
            {cfg.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Epoch {currentEpoch}/{totalEpochs}</span>
            <span>{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>

        {/* Hyperparameters */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Model</p>
            <p className="text-[11px] font-medium truncate">{job.base_model}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Method</p>
            <p className="text-[11px] font-medium">{job.method}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">LR</p>
            <p className="text-[11px] font-medium">{hp.learning_rate ?? "0.0002"}</p>
          </div>
        </div>

        {/* Metrics */}
        {metrics.current_loss != null && (
          <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2">
            <TrendingDown className="h-3.5 w-3.5 text-[hsl(var(--forge-cyan))]" />
            <span className="text-xs">Loss: <strong>{Number(metrics.current_loss).toFixed(4)}</strong></span>
            {metrics.eta_minutes != null && (
              <span className="text-[10px] text-muted-foreground ml-auto">
                ETA: {metrics.eta_minutes}m
              </span>
            )}
          </div>
        )}

        {/* Loss chart */}
        <LossChart metrics={metrics} />

        {/* Actions */}
        <div className="flex gap-1.5 pt-1">
          {job.status === "draft" && (
            <Button
              size="sm"
              className="h-7 text-[11px] flex-1"
              onClick={() => onUpdate(job.id, { status: "running", metrics: { ...metrics, current_epoch: 0, started_at: new Date().toISOString() } })}
            >
              <Play className="h-3 w-3 mr-1" /> Start
            </Button>
          )}
          {job.status === "running" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] flex-1"
                onClick={() => onUpdate(job.id, { status: "paused" })}
              >
                <Pause className="h-3 w-3 mr-1" /> Pause
              </Button>
              <Button
                size="sm"
                className="h-7 text-[11px] flex-1"
                onClick={() => onUpdate(job.id, { status: "completed", metrics: { ...metrics, current_epoch: totalEpochs, completed_at: new Date().toISOString() } })}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
              </Button>
            </>
          )}
          {job.status === "paused" && (
            <Button
              size="sm"
              className="h-7 text-[11px] flex-1"
              onClick={() => onUpdate(job.id, { status: "running" })}
            >
              <Play className="h-3 w-3 mr-1" /> Resume
            </Button>
          )}
          {(job.status === "completed" || job.status === "failed" || job.status === "draft") && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] text-destructive hover:text-destructive"
              onClick={() => onDelete(job.id)}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrainingProgressPage() {
  const { data: jobs, isLoading } = useTrainingJobs();
  const { data: datasets } = useDatasets();
  const createJob = useCreateTrainingJob();
  const updateJob = useUpdateTrainingJob();
  const deleteJob = useDeleteTrainingJob();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDatasetId, setNewDatasetId] = useState("");
  const [newModel, setNewModel] = useState("phi-3-mini");
  const [newMethod, setNewMethod] = useState("lora");

  const datasetMap = new Map((datasets ?? []).map((d) => [d.id, d.name]));

  const handleCreate = () => {
    if (!newName.trim() || !newDatasetId) return;
    createJob.mutate({
      dataset_id: newDatasetId,
      name: newName.trim(),
      base_model: newModel,
      method: newMethod,
    });
    setShowCreate(false);
    setNewName("");
    setNewDatasetId("");
  };

  const handleUpdate = (id: string, updates: Record<string, any>) => {
    updateJob.mutate({ id, ...updates });
  };

  const activeCount = (jobs ?? []).filter((j) => j.status === "running").length;
  const completedCount = (jobs ?? []).filter((j) => j.status === "completed").length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-[hsl(var(--forge-cyan))]" />
            <h1 className="text-2xl font-bold font-display">Training Progress</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Track offline fine-tuning jobs — log epochs, monitor loss curves, and pick up where you left off.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-1" /> New Job
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Jobs", value: jobs?.length ?? 0, icon: BarChart3 },
          { label: "Active", value: activeCount, icon: Play },
          { label: "Completed", value: completedCount, icon: CheckCircle2 },
        ].map((s) => (
          <Card key={s.label} className="bg-card/50">
            <CardContent className="p-3 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-[hsl(var(--forge-cyan))]" />
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Job cards */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading training jobs…</p>
      ) : !jobs?.length ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-2">
            <Cpu className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No training jobs yet</p>
            <p className="text-xs text-muted-foreground/70">Create a job to start tracking your offline fine-tuning runs.</p>
            <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Create First Job
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              datasetName={datasetMap.get(job.dataset_id) ?? "Unknown dataset"}
              onUpdate={handleUpdate}
              onDelete={(id) => deleteJob.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Training Job</DialogTitle>
            <DialogDescription>Track an offline fine-tuning run against one of your datasets.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Job Name</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Builder v1 LoRA"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Dataset</label>
              <Select value={newDatasetId} onValueChange={setNewDatasetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dataset" />
                </SelectTrigger>
                <SelectContent>
                  {(datasets ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.sample_count} samples)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Base Model</label>
                <Select value={newModel} onValueChange={setNewModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phi-3-mini">Phi-3 Mini</SelectItem>
                    <SelectItem value="llama-3.2-1b">Llama 3.2 1B</SelectItem>
                    <SelectItem value="llama-3.2-3b">Llama 3.2 3B</SelectItem>
                    <SelectItem value="qwen2.5-1.5b">Qwen 2.5 1.5B</SelectItem>
                    <SelectItem value="qwen2.5-0.5b">Qwen 2.5 0.5B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Method</label>
                <Select value={newMethod} onValueChange={setNewMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lora">LoRA</SelectItem>
                    <SelectItem value="qlora">QLoRA</SelectItem>
                    <SelectItem value="full">Full Fine-tune</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={!newName.trim() || !newDatasetId || createJob.isPending}
              >
                {createJob.isPending ? "Creating…" : "Create Job"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
