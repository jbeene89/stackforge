import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { mockRuns } from "@/data/mock-data";
import type { TestRun, RunStep } from "@/types";
import {
  Activity, Search, Filter, ChevronRight, ChevronDown,
  CheckCircle2, XCircle, Loader2, Clock, Zap,
  ArrowRight, Eye, BarChart3, GitBranch, Layers
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

// ------- STEP TRACE VIEW -------

function StepTraceView({ run }: { run: TestRun }) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      {run.steps.map((step, i) => {
        const Icon = statusIcons[step.status] || Clock;
        const isExpanded = expandedStep === step.id;
        const cumulativeTime = run.steps.slice(0, i + 1).reduce((a, s) => a + s.durationMs, 0);

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            {/* Connector line */}
            {i > 0 && (
              <div className="ml-[18px] h-4 border-l-2 border-dashed border-border" />
            )}

            <div className="glass rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => setExpandedStep(isExpanded ? null : step.id)}
              >
                {/* Step number */}
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  step.status === "success" && "bg-forge-emerald/15 text-forge-emerald",
                  step.status === "failed" && "bg-destructive/15 text-destructive",
                  step.status === "running" && "bg-forge-amber/15 text-forge-amber",
                )}>
                  {i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{step.nodeLabel}</span>
                    <Badge className={cn("text-[10px]", statusColors[step.status])}>{step.status}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Node: {step.nodeId} · {step.durationMs}ms · cumulative: {cumulativeTime}ms
                  </div>
                </div>

                <div className="text-xs font-mono text-muted-foreground">{step.durationMs}ms</div>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                            <ArrowRight className="h-2.5 w-2.5" /> Input
                          </label>
                          <div className="mt-1 text-xs font-mono glass rounded-lg p-3 max-h-[120px] overflow-auto">
                            {step.input}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                            <ArrowRight className="h-2.5 w-2.5" /> Output
                          </label>
                          <div className="mt-1 text-xs font-mono glass rounded-lg p-3 max-h-[120px] overflow-auto">
                            {step.output}
                          </div>
                        </div>
                      </div>
                      {/* Settings */}
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Settings</label>
                        <div className="mt-1 flex gap-2 flex-wrap">
                          {Object.entries(step.settings).map(([k, v]) => (
                            <Badge key={k} variant="outline" className="text-[10px] font-mono">{k}: {String(v)}</Badge>
                          ))}
                        </div>
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

// ------- WATERFALL VIEW -------

function WaterfallView({ run }: { run: TestRun }) {
  const maxTime = run.totalDurationMs;

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border/50 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Execution Waterfall</span>
        <span className="ml-auto text-xs text-muted-foreground font-mono">{maxTime}ms total</span>
      </div>

      {/* Time axis */}
      <div className="px-5 pt-3 pb-1 flex items-center">
        <div className="w-40" />
        <div className="flex-1 flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>0ms</span>
          <span>{Math.round(maxTime * 0.25)}ms</span>
          <span>{Math.round(maxTime * 0.5)}ms</span>
          <span>{Math.round(maxTime * 0.75)}ms</span>
          <span>{maxTime}ms</span>
        </div>
      </div>

      <div className="px-5 pb-4 space-y-2">
        {run.steps.map((step, i) => {
          const startOffset = run.steps.slice(0, i).reduce((a, s) => a + s.durationMs, 0);
          const leftPct = (startOffset / maxTime) * 100;
          const widthPct = (step.durationMs / maxTime) * 100;
          const Icon = statusIcons[step.status] || Clock;

          const barColors: Record<string, string> = {
            success: "bg-forge-emerald/60",
            failed: "bg-destructive/60",
            running: "bg-forge-amber/60",
            pending: "bg-muted-foreground/30",
          };

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div className="w-40 flex items-center gap-2 shrink-0">
                <Icon className={cn("h-3 w-3 shrink-0", step.status === "success" ? "text-forge-emerald" : "text-muted-foreground")} />
                <span className="text-xs truncate">{step.nodeLabel}</span>
              </div>
              <div className="flex-1 h-7 bg-secondary/30 rounded relative overflow-hidden">
                <motion.div
                  className={cn("absolute top-0 h-full rounded flex items-center px-2", barColors[step.status] || "bg-primary/40")}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
                  style={{ left: `${leftPct}%` }}
                >
                  <span className="text-[10px] font-mono text-foreground/80 whitespace-nowrap">{step.durationMs}ms</span>
                </motion.div>
                {/* Grid lines */}
                {[25, 50, 75].map((pct) => (
                  <div key={pct} className="absolute top-0 h-full border-l border-border/30" style={{ left: `${pct}%` }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ------- MAIN PAGE -------

export default function RunsPage() {
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredRuns = mockRuns.filter((run) => {
    const matchesSearch = run.targetName.toLowerCase().includes(search.toLowerCase()) ||
      run.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-[calc(100vh-3.5rem)] animate-fade-in">
      {/* Run List */}
      <div className={cn(
        "border-r border-border flex flex-col transition-all",
        selectedRun ? "w-[380px]" : "flex-1"
      )}>
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Execution Runs</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search runs…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-xs glass"
              />
            </div>
            <div className="flex gap-1">
              {["all", "success", "failed", "running"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "ghost"}
                  size="sm"
                  className="text-[10px] h-8 px-2.5 capitalize"
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1.5">
            {filteredRuns.map((run) => {
              const Icon = statusIcons[run.status];
              const isActive = selectedRun?.id === run.id;
              return (
                <motion.div
                  key={run.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedRun(run)}
                  className={cn(
                    "glass rounded-xl p-4 cursor-pointer transition-colors",
                    isActive && "ring-1 ring-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn(
                      "h-4 w-4 shrink-0",
                      run.status === "success" && "text-forge-emerald",
                      run.status === "failed" && "text-destructive",
                      run.status === "running" && "text-forge-amber animate-spin",
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{run.targetName}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {run.targetType} · v{run.version} · {run.steps.length} steps
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono">{(run.totalDurationMs / 1000).toFixed(1)}s</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(run.startedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedRun && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col min-w-0"
          >
            {/* Detail header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">{selectedRun.targetName}</h2>
                  <Badge className={cn("text-[10px]", statusColors[selectedRun.status])}>{selectedRun.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {selectedRun.id} · {selectedRun.targetType} · v{selectedRun.version} · {new Date(selectedRun.startedAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground">Duration</div>
                  <div className="text-sm font-bold font-mono">{(selectedRun.totalDurationMs / 1000).toFixed(1)}s</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground">Steps</div>
                  <div className="text-sm font-bold">{selectedRun.steps.length}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedRun(null)}>
                  <span className="text-xs">Close</span>
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="trace" className="flex-1 flex flex-col min-h-0">
              <div className="px-6 pt-3">
                <TabsList className="glass w-fit">
                  <TabsTrigger value="trace" className="text-xs gap-1.5"><Layers className="h-3 w-3" /> Step Trace</TabsTrigger>
                  <TabsTrigger value="waterfall" className="text-xs gap-1.5"><BarChart3 className="h-3 w-3" /> Waterfall</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="trace" className="flex-1 min-h-0 mt-0">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <StepTraceView run={selectedRun} />
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="waterfall" className="flex-1 min-h-0 mt-0">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <WaterfallView run={selectedRun} />
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state when no run selected */}
      {!selectedRun && filteredRuns.length > 0 && (
        <div className="hidden" /> // list takes full width
      )}
    </div>
  );
}
