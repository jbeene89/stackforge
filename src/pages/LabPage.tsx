import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useModules, useStacks, useRuns, useCreateRun } from "@/hooks/useSupabaseData";
import { streamAI } from "@/hooks/useSupabaseData";
import {
  FlaskConical, Play, Loader2, Zap, Clock, Hash, Coins,
  BarChart3, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronRight,
  Copy, RotateCcw, Sparkles, Target, Shield, Brain, Layers
} from "lucide-react";

// ------- PLAYGROUND TAB -------

function PlaygroundTab() {
  const { data: modules } = useModules();
  const { data: stacks } = useStacks();
  const createRun = useCreateRun();

  const allTargets = [
    ...(modules || []).map((m) => ({ id: m.id, name: m.name, type: "module" as const })),
    ...(stacks || []).map((s) => ({ id: s.id, name: s.name, type: "stack" as const })),
  ];

  const [selectedTarget, setSelectedTarget] = useState(allTargets[0]?.id || "");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<{ latency: number; tokens: number; cost: number } | null>(null);

  const runTest = async () => {
    if (!input.trim() || !selectedTarget) return;
    setIsRunning(true);
    setOutput("");
    setMetrics(null);

    const target = allTargets.find(t => t.id === selectedTarget);
    const mod = modules?.find(m => m.id === selectedTarget);
    const startTime = Date.now();

    try {
      await streamAI({
        messages: [
          ...(mod?.system_prompt ? [{ role: "system", content: mod.system_prompt }] : []),
          { role: "user", content: input }
        ],
        mode: "general",
        onDelta: (text) => setOutput(prev => prev + text),
        onDone: () => {
          const duration = Date.now() - startTime;
          setIsRunning(false);
          setMetrics({
            latency: +(duration / 1000).toFixed(1),
            tokens: Math.floor(output.length / 4) + 100,
            cost: +((Math.floor(output.length / 4) + 100) * 0.000015).toFixed(4),
          });
          if (target) {
            createRun.mutate({
              target_type: target.type,
              target_id: target.id,
              target_name: target.name,
              status: "success",
              steps: [{ label: "AI Generation", durationMs: duration, input: input.slice(0, 200) }],
            });
          }
        },
      });
    } catch (err: any) {
      setIsRunning(false);
      setOutput(`Error: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        {allTargets.length > 0 ? (
          <Select value={selectedTarget} onValueChange={setSelectedTarget}>
            <SelectTrigger className="w-[280px] glass">
              <SelectValue placeholder="Select a target…" />
            </SelectTrigger>
            <SelectContent>
              {(modules || []).length > 0 && (
                <>
                  <div className="px-2 py-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Modules</div>
                  {(modules || []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </>
              )}
              {(stacks || []).length > 0 && (
                <>
                  <Separator className="my-1" />
                  <div className="px-2 py-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Stacks</div>
                  {(stacks || []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        ) : (
          <div className="text-sm text-muted-foreground">Create a module or stack first to test it here.</div>
        )}
        <Button onClick={runTest} disabled={isRunning || !input.trim() || !selectedTarget} className="gradient-primary text-primary-foreground">
          {isRunning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
          {isRunning ? "Running…" : "Run Test"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setOutput(""); setMetrics(null); setInput(""); }}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        <div className="flex flex-col glass rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Input</span>
            <Badge variant="outline" className="text-[10px]">{input.length} chars</Badge>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter test input…"
            className="flex-1 border-0 rounded-none resize-none bg-transparent focus-visible:ring-0 text-sm font-mono"
          />
        </div>

        <div className="flex flex-col glass rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Output</span>
              {isRunning && <span className="h-2 w-2 rounded-full bg-forge-emerald animate-glow-pulse" />}
            </div>
            {output && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => navigator.clipboard.writeText(output)}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            )}
          </div>
          <ScrollArea className="flex-1">
            <pre className="p-4 text-sm font-mono whitespace-pre-wrap text-foreground/90">
              {output || <span className="text-muted-foreground italic">Output will appear here…</span>}
              {isRunning && <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-glow-pulse" />}
            </pre>
          </ScrollArea>
        </div>
      </div>

      <AnimatePresence>
        {metrics && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 glass rounded-xl px-6 py-3 flex items-center gap-8"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-forge-cyan" />
              <span className="text-xs text-muted-foreground">Latency</span>
              <span className="text-sm font-semibold">{metrics.latency}s</span>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">Tokens</span>
              <span className="text-sm font-semibold">{metrics.tokens}</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="h-3.5 w-3.5 text-forge-amber" />
              <span className="text-xs text-muted-foreground">Cost</span>
              <span className="text-sm font-semibold">${metrics.cost}</span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-forge-emerald" />
              <span className="text-xs text-forge-emerald font-medium">Completed successfully</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ------- RECENT RUNS TAB -------

function RecentRunsTab() {
  const { data: runs } = useRuns();

  if (!runs?.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No runs recorded yet. Run a test in the Playground to see results here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {runs.slice(0, 10).map((run, i) => (
        <motion.div
          key={run.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className="glass rounded-lg px-4 py-3 flex items-center gap-4"
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
            run.status === "success" ? "bg-forge-emerald/15 text-forge-emerald" : "bg-destructive/15 text-destructive"
          )}>
            {run.target_type === "module" ? <Brain className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{run.target_name}</div>
            <div className="text-[10px] text-muted-foreground">
              {run.target_type} · v{run.version} · {(Array.isArray(run.steps) ? run.steps : []).length} steps · {(run.total_duration_ms / 1000).toFixed(1)}s
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[10px]",
            run.status === "success" ? "text-forge-emerald" : "text-destructive"
          )}>{run.status}</Badge>
          <span className="text-[10px] text-muted-foreground shrink-0">{new Date(run.started_at).toLocaleString()}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ------- MAIN PAGE -------

export default function LabPage() {
  return (
    <div className="p-6 h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <FlaskConical className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Testing Lab</h1>
        <Badge variant="outline" className="text-[10px]">Live</Badge>
      </div>

      <Tabs defaultValue="playground" className="flex-1 flex flex-col min-h-0">
        <TabsList className="glass w-fit mb-4">
          <TabsTrigger value="playground" className="text-xs gap-1.5"><Sparkles className="h-3 w-3" /> Playground</TabsTrigger>
          <TabsTrigger value="runs" className="text-xs gap-1.5"><BarChart3 className="h-3 w-3" /> Recent Runs</TabsTrigger>
        </TabsList>

        <TabsContent value="playground" className="flex-1 min-h-0 mt-0">
          <PlaygroundTab />
        </TabsContent>

        <TabsContent value="runs" className="flex-1 min-h-0 mt-0 overflow-auto">
          <RecentRunsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
