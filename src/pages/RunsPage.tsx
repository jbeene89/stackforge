import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useRuns } from "@/hooks/useSupabaseData";
import type { DbRun } from "@/hooks/useSupabaseData";
import {
  Activity, Search, CheckCircle2, XCircle, Loader2, Clock,
  BarChart3, Layers, ChevronRight, ChevronDown, ArrowRight
} from "lucide-react";

const statusColors: Record<string, string> = {
  success: "bg-forge-emerald/15 text-forge-emerald",
  failed: "bg-destructive/15 text-destructive",
  running: "bg-forge-amber/15 text-forge-amber",
  pending: "bg-muted text-muted-foreground",
  paused: "bg-primary/15 text-primary",
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  success: CheckCircle2,
  failed: XCircle,
  running: Loader2,
  pending: Clock,
  paused: Clock,
};

function StepTraceView({ run }: { run: DbRun }) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const steps = Array.isArray(run.steps) ? run.steps as any[] : [];

  if (!steps.length) return <p className="text-sm text-muted-foreground">No steps recorded.</p>;

  return (
    <div className="space-y-1">
      {steps.map((step: any, i: number) => {
        const isExpanded = expandedStep === i;
        return (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
            {i > 0 && <div className="ml-[18px] h-4 border-l-2 border-dashed border-border" />}
            <div className="glass rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => setExpandedStep(isExpanded ? null : i)}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-forge-emerald/15 text-forge-emerald">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold">{step.label || step.nodeLabel || `Step ${i + 1}`}</span>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{step.durationMs || step.duration_ms || 0}ms</div>
                </div>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 border-t border-border/50 pt-3 grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1"><ArrowRight className="h-2.5 w-2.5" /> Input</label>
                        <div className="mt-1 text-xs font-mono glass rounded-lg p-3 max-h-[120px] overflow-auto">{step.input || "—"}</div>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1"><ArrowRight className="h-2.5 w-2.5" /> Output</label>
                        <div className="mt-1 text-xs font-mono glass rounded-lg p-3 max-h-[120px] overflow-auto">{step.output || "—"}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function WaterfallView({ run }: { run: DbRun }) {
  const steps = Array.isArray(run.steps) ? run.steps as any[] : [];
  const maxTime = run.total_duration_ms || 1;

  if (!steps.length) return <p className="text-sm text-muted-foreground">No steps recorded.</p>;

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border/50 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Execution Waterfall</span>
        <span className="ml-auto text-xs text-muted-foreground font-mono">{maxTime}ms total</span>
      </div>
      <div className="px-5 pb-4 pt-3 space-y-2">
        {steps.map((step: any, i: number) => {
          const dur = step.durationMs || step.duration_ms || 0;
          const startOffset = steps.slice(0, i).reduce((a: number, s: any) => a + (s.durationMs || s.duration_ms || 0), 0);
          const leftPct = (startOffset / maxTime) * 100;
          const widthPct = Math.max((dur / maxTime) * 100, 2);
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-40 text-xs truncate">{step.label || step.nodeLabel || `Step ${i + 1}`}</div>
              <div className="flex-1 h-7 bg-secondary/30 rounded relative overflow-hidden">
                <motion.div className="absolute top-0 h-full rounded bg-forge-emerald/60 flex items-center px-2"
                  initial={{ width: 0 }} animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.12 }}
                  style={{ left: `${leftPct}%` }}>
                  <span className="text-[10px] font-mono text-foreground/80 whitespace-nowrap">{dur}ms</span>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RunsPage() {
  const { data: runs, isLoading } = useRuns();
  const [selectedRun, setSelectedRun] = useState<DbRun | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredRuns = (runs || []).filter((run) => {
    const matchesSearch = run.target_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-[calc(100vh-3.5rem)] animate-fade-in">
      <div className={cn("border-r border-border flex flex-col transition-all", selectedRun ? "w-[380px]" : "flex-1")}>
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Execution Runs</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search runs…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-xs glass" />
            </div>
            <div className="flex gap-1">
              {["all", "success", "failed", "running"].map((status) => (
                <Button key={status} variant={statusFilter === status ? "default" : "ghost"} size="sm"
                  className="text-[10px] h-8 px-2.5 capitalize" onClick={() => setStatusFilter(status)}>{status}</Button>
              ))}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-3 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : !filteredRuns.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No runs yet.</p>
            </div>
          ) : (
            <div className="p-3 space-y-1.5">
              {filteredRuns.map((run) => {
                const Icon = statusIcons[run.status] || Clock;
                const isActive = selectedRun?.id === run.id;
                return (
                  <motion.div key={run.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedRun(run)}
                    className={cn("glass rounded-xl p-4 cursor-pointer transition-colors", isActive && "ring-1 ring-primary bg-primary/5")}>
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-4 w-4 shrink-0",
                        run.status === "success" && "text-forge-emerald",
                        run.status === "failed" && "text-destructive",
                        run.status === "running" && "text-forge-amber animate-spin",
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{run.target_name}</div>
                        <div className="text-[10px] text-muted-foreground">{run.target_type} · v{run.version} · {(Array.isArray(run.steps) ? run.steps : []).length} steps</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono">{(run.total_duration_ms / 1000).toFixed(1)}s</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(run.started_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      <AnimatePresence>
        {selectedRun && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 flex flex-col min-w-0">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">{selectedRun.target_name}</h2>
                  <Badge className={cn("text-[10px]", statusColors[selectedRun.status])}>{selectedRun.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{selectedRun.target_type} · v{selectedRun.version} · {new Date(selectedRun.started_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center"><div className="text-[10px] text-muted-foreground">Duration</div><div className="text-sm font-bold font-mono">{(selectedRun.total_duration_ms / 1000).toFixed(1)}s</div></div>
                <div className="text-center"><div className="text-[10px] text-muted-foreground">Steps</div><div className="text-sm font-bold">{(Array.isArray(selectedRun.steps) ? selectedRun.steps : []).length}</div></div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedRun(null)}><span className="text-xs">Close</span></Button>
              </div>
            </div>
            <Tabs defaultValue="trace" className="flex-1 flex flex-col min-h-0">
              <div className="px-6 pt-3">
                <TabsList className="glass w-fit">
                  <TabsTrigger value="trace" className="text-xs gap-1.5"><Layers className="h-3 w-3" /> Step Trace</TabsTrigger>
                  <TabsTrigger value="waterfall" className="text-xs gap-1.5"><BarChart3 className="h-3 w-3" /> Waterfall</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="trace" className="flex-1 min-h-0 mt-0">
                <ScrollArea className="h-full"><div className="p-6"><StepTraceView run={selectedRun} /></div></ScrollArea>
              </TabsContent>
              <TabsContent value="waterfall" className="flex-1 min-h-0 mt-0">
                <ScrollArea className="h-full"><div className="p-6"><WaterfallView run={selectedRun} /></div></ScrollArea>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
