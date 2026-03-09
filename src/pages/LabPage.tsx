import { useState, useEffect, useRef } from "react";
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
import { mockModules, mockStacks, mockRuns } from "@/data/mock-data";
import {
  FlaskConical, Play, Loader2, Zap, Clock, Hash, Coins,
  BarChart3, GitCompare, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronRight, ArrowRight, TrendingUp, TrendingDown, Minus,
  Copy, RotateCcw, Sparkles, Target, Shield
} from "lucide-react";

// ------- PLAYGROUND TAB -------

const sampleOutputs: Record<string, string[]> = {
  "mod-1": [
    "## Scope Summary\n\n**Project:** Miami Marina Dock Repair\n**Location:** Biscayne Bay, FL\n**Type:** Marine Structural Rehabilitation\n\n### Work Items\n1. **Concrete pile repair** — 12 piles showing spalling and rebar exposure\n2. **Deck replacement** — 2,400 sq ft of timber decking\n3. **Fender system upgrade** — New UHMW fender boards on 340 linear ft\n4. **Electrical conduit rerouting** — Relocate shore power connections\n\n### Constraints\n- Work must occur during low-tide windows\n- Marina remains partially operational\n- Environmental permits required for in-water work",
    "## Scope Summary\n\n**Project:** Seawall Reconstruction\n**Location:** Fort Lauderdale Intracoastal\n**Type:** Marine Civil Infrastructure\n\n### Work Items\n1. **Demolition** — Remove 200 linear ft of existing seawall\n2. **Sheet pile driving** — Install vinyl sheet piles\n3. **Cap pour** — Reinforced concrete cap beam\n4. **Backfill and grading** — Stabilize landside area\n\n### Notes\n- Dewatering system required\n- Marine turtle nesting season restrictions apply"
  ],
  "mod-2": [
    '{\n  "project": "Miami Marina Dock Repair",\n  "total": 287000,\n  "contingency": 28700,\n  "items": [\n    { "description": "Concrete pile repair (12 piles)", "cost": 96000 },\n    { "description": "Timber deck replacement (2,400 sqft)", "cost": 84000 },\n    { "description": "Fender system (340 LF)", "cost": 51000 },\n    { "description": "Electrical rerouting", "cost": 27300 }\n  ]\n}',
  ],
  "mod-3": [
    "## Red Team Analysis\n\n### Critical Weaknesses\n1. **No regulatory compliance mention** — FDA/EPA requirements unaddressed\n2. **Revenue model assumption** — 40% margin assumes zero competition\n3. **Timeline unrealistic** — 6 months for hardware + software MVP is aggressive\n\n### Moderate Risks\n4. **IP vulnerability** — No provisional patent filed\n5. **Team gap** — No embedded systems expertise listed\n\n### Suggested Mitigations\n- File provisional patent within 30 days\n- Add 3-month buffer to timeline\n- Engage regulatory consultant early",
  ],
};

function PlaygroundTab() {
  const [selectedTarget, setSelectedTarget] = useState("mod-1");
  const [input, setInput] = useState("Dock repair project in Miami Marina — 12 concrete piles need repair, 2400 sqft of timber decking needs replacement, plus fender system upgrade along 340 linear feet.");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<{ latency: number; tokens: number; cost: number } | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const allTargets = [
    ...mockModules.map((m) => ({ id: m.id, name: m.name, type: "module" as const })),
    ...mockStacks.map((s) => ({ id: s.id, name: s.name, type: "stack" as const })),
  ];

  const runTest = () => {
    setIsRunning(true);
    setOutput("");
    setMetrics(null);

    const outputs = sampleOutputs[selectedTarget] || ["Processing complete. No specific output configured for this target."];
    const fullOutput = outputs[Math.floor(Math.random() * outputs.length)];
    const chars = fullOutput.split("");
    let idx = 0;

    const interval = setInterval(() => {
      idx += Math.floor(Math.random() * 3) + 1;
      if (idx >= chars.length) {
        idx = chars.length;
        clearInterval(interval);
        setIsRunning(false);
        const tokens = Math.floor(fullOutput.length / 4);
        setMetrics({
          latency: +(Math.random() * 2 + 1.2).toFixed(1),
          tokens,
          cost: +(tokens * 0.000015).toFixed(4),
        });
      }
      setOutput(chars.slice(0, idx).join(""));
    }, 20);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Target selector */}
      <div className="flex items-center gap-3 mb-4">
        <Select value={selectedTarget} onValueChange={setSelectedTarget}>
          <SelectTrigger className="w-[280px] glass">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <div className="px-2 py-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Modules</div>
            {allTargets.filter((t) => t.type === "module").map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
            <Separator className="my-1" />
            <div className="px-2 py-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Stacks</div>
            {allTargets.filter((t) => t.type === "stack").map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={runTest}
          disabled={isRunning || !input.trim()}
          className="gradient-primary text-primary-foreground"
        >
          {isRunning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
          {isRunning ? "Running…" : "Run Test"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setOutput(""); setMetrics(null); setInput(""); }}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      </div>

      {/* Input / Output panels */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Input */}
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

        {/* Output */}
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

      {/* Metrics bar */}
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

// ------- BENCHMARKS TAB -------

interface BenchmarkScenario {
  id: string;
  name: string;
  description: string;
  input: string;
  expectedKeywords: string[];
  qualityScore: number | null;
  status: "idle" | "running" | "pass" | "fail";
  latency: number | null;
  tokens: number | null;
}

const initialScenarios: BenchmarkScenario[] = [
  {
    id: "bm-1", name: "Miami Dock Repair", description: "Standard dock repair scope extraction",
    input: "12 concrete piles need repair at Miami Marina, plus 2400sqft timber decking replacement.",
    expectedKeywords: ["concrete", "pile", "decking", "Miami"],
    qualityScore: null, status: "idle", latency: null, tokens: null,
  },
  {
    id: "bm-2", name: "Seawall Emergency", description: "Emergency seawall with tight constraints",
    input: "Urgent seawall failure at Fort Lauderdale. 200LF needs immediate replacement. Active erosion.",
    expectedKeywords: ["seawall", "emergency", "erosion", "Fort Lauderdale"],
    qualityScore: null, status: "idle", latency: null, tokens: null,
  },
  {
    id: "bm-3", name: "Commercial Marina Build", description: "Large-scale new marina construction",
    input: "New 80-slip commercial marina with fuel dock, pump-out station, and breakwater in Tampa Bay.",
    expectedKeywords: ["marina", "fuel", "breakwater", "Tampa"],
    qualityScore: null, status: "idle", latency: null, tokens: null,
  },
  {
    id: "bm-4", name: "Bridge Fender Replacement", description: "DOT bridge fender system upgrade",
    input: "Replace timber fender system on I-95 causeway bridge. 16 fender clusters, UHMW facing required.",
    expectedKeywords: ["fender", "bridge", "UHMW", "DOT"],
    qualityScore: null, status: "idle", latency: null, tokens: null,
  },
  {
    id: "bm-5", name: "Underwater Inspection", description: "Dive inspection report scope",
    input: "Level II underwater inspection of 24 concrete piles at Port Everglades cruise terminal.",
    expectedKeywords: ["underwater", "inspection", "pile", "Port Everglades"],
    qualityScore: null, status: "idle", latency: null, tokens: null,
  },
];

function BenchmarksTab() {
  const [scenarios, setScenarios] = useState<BenchmarkScenario[]>(initialScenarios);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const runScenario = async (id: string) => {
    setScenarios((prev) => prev.map((s) => s.id === id ? { ...s, status: "running" as const } : s));
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1500));
    const score = Math.floor(Math.random() * 25 + 75);
    const pass = score >= 80;
    setScenarios((prev) => prev.map((s) => s.id === id ? {
      ...s,
      status: pass ? "pass" : "fail",
      qualityScore: score,
      latency: +(Math.random() * 2 + 1).toFixed(1),
      tokens: Math.floor(Math.random() * 300 + 200),
    } : s));
  };

  const runAll = async () => {
    setIsRunningAll(true);
    for (const s of scenarios) {
      await runScenario(s.id);
    }
    setIsRunningAll(false);
  };

  const resetAll = () => setScenarios(initialScenarios);

  const completedCount = scenarios.filter((s) => s.status === "pass" || s.status === "fail").length;
  const passCount = scenarios.filter((s) => s.status === "pass").length;
  const avgScore = scenarios.filter((s) => s.qualityScore !== null).reduce((a, s) => a + (s.qualityScore ?? 0), 0) / (completedCount || 1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={runAll} disabled={isRunningAll} className="gradient-primary text-primary-foreground">
            {isRunningAll ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
            Run All ({scenarios.length})
          </Button>
          <Button variant="ghost" size="sm" onClick={resetAll}><RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset</Button>
        </div>
        {completedCount > 0 && (
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Avg Score:</span>
              <span className="font-semibold">{avgScore.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-forge-emerald" />
              <span className="font-semibold text-forge-emerald">{passCount}/{completedCount} passed</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress */}
      {isRunningAll && (
        <Progress value={(completedCount / scenarios.length) * 100} className="h-1.5" />
      )}

      {/* Scenarios */}
      <div className="space-y-2">
        {scenarios.map((scenario) => (
          <motion.div
            key={scenario.id}
            layout
            className="glass rounded-xl overflow-hidden"
          >
            <div
              className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => setExpandedId(expandedId === scenario.id ? null : scenario.id)}
            >
              {/* Status icon */}
              <div className="w-6">
                {scenario.status === "running" && <Loader2 className="h-4 w-4 text-forge-amber animate-spin" />}
                {scenario.status === "pass" && <CheckCircle2 className="h-4 w-4 text-forge-emerald" />}
                {scenario.status === "fail" && <XCircle className="h-4 w-4 text-destructive" />}
                {scenario.status === "idle" && <div className="h-4 w-4 rounded-full border-2 border-border" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{scenario.name}</div>
                <div className="text-xs text-muted-foreground truncate">{scenario.description}</div>
              </div>

              {scenario.qualityScore !== null && (
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-muted-foreground">Score</div>
                    <div className={cn("font-bold text-sm", scenario.qualityScore >= 80 ? "text-forge-emerald" : "text-destructive")}>
                      {scenario.qualityScore}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Latency</div>
                    <div className="font-semibold">{scenario.latency}s</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Tokens</div>
                    <div className="font-semibold">{scenario.tokens}</div>
                  </div>
                </div>
              )}

              {expandedId === scenario.id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>

            <AnimatePresence>
              {expandedId === scenario.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 pt-1 border-t border-border/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Test Input</label>
                        <div className="mt-1 text-xs font-mono glass rounded-lg p-3">{scenario.input}</div>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Expected Keywords</label>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {scenario.expectedKeywords.map((kw) => (
                            <Badge key={kw} variant="outline" className="text-[10px]">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => runScenario(scenario.id)} disabled={scenario.status === "running"}>
                        <Play className="h-3 w-3 mr-1" /> Re-run
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ------- VERSION COMPARISON TAB -------

interface VersionData {
  version: string;
  latency: string;
  quality: string;
  tokens: string;
  cost: string;
  output: string;
}

const versionA: VersionData = {
  version: "v7 (current)",
  latency: "2.1s",
  quality: "89%",
  tokens: "342",
  cost: "$0.0051",
  output: "## Scope Summary\n\n**Project:** Miami Dock Repair\n**Type:** Marine Structural\n\n### Items\n1. Concrete pile repair (12 piles)\n2. Timber deck replacement (2,400 sqft)\n3. Fender system upgrade (340 LF)\n4. Electrical conduit rerouting\n\n### Constraints\n- Low-tide work windows\n- Marina partially operational\n- Environmental permits required",
};

const versionB: VersionData = {
  version: "v6 (previous)",
  latency: "2.8s",
  quality: "82%",
  tokens: "410",
  cost: "$0.0062",
  output: "## Scope Summary\n\nProject: Miami Dock Repair\nType: Marine Structural\n\nWork Items:\n- Concrete pile repair — 12 piles\n- Deck replacement — 2400 sqft timber\n- Fender upgrade — 340 linear feet\n- Electrical work\n\nNotes:\n- Tide-dependent scheduling\n- Marina stays open during work",
};

const diffFields = [
  { field: "Latency", a: "2.1s", b: "2.8s", change: "-25%", positive: true },
  { field: "Quality Score", a: "89%", b: "82%", change: "+8.5%", positive: true },
  { field: "Token Usage", a: "342", b: "410", change: "-16.6%", positive: true },
  { field: "Cost per Run", a: "$0.0051", b: "$0.0062", change: "-17.7%", positive: true },
  { field: "Structured Output", a: "Markdown headers", b: "Plain text", change: "Improved", positive: true },
  { field: "Constraint Coverage", a: "3 items", b: "2 items", change: "+50%", positive: true },
];

function VersionCompareTab() {
  return (
    <div className="space-y-4">
      {/* Diff analysis */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Diff Analysis</span>
          <Badge className="ml-auto bg-forge-emerald/15 text-forge-emerald text-[10px]">v7 outperforms v6</Badge>
        </div>
        <div className="divide-y divide-border/50">
          {diffFields.map((d) => (
            <div key={d.field} className="flex items-center px-5 py-2.5 text-sm hover:bg-secondary/20 transition-colors">
              <span className="w-40 text-muted-foreground">{d.field}</span>
              <span className="w-28 font-mono text-xs">{d.a}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground mx-3" />
              <span className="w-28 font-mono text-xs text-muted-foreground">{d.b}</span>
              <span className={cn(
                "ml-auto font-semibold text-xs flex items-center gap-1",
                d.positive ? "text-forge-emerald" : "text-destructive"
              )}>
                {d.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {d.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-side output */}
      <div className="grid grid-cols-2 gap-4">
        {[versionA, versionB].map((v, idx) => (
          <div key={idx} className={cn("glass rounded-xl overflow-hidden", idx === 0 && "ring-1 ring-primary/30")}>
            <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={idx === 0 ? "default" : "outline"} className="text-[10px]">
                  {v.version}
                </Badge>
                {idx === 0 && <Sparkles className="h-3 w-3 text-forge-amber" />}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>{v.latency}</span>
                <span>{v.tokens} tok</span>
                <span>{v.cost}</span>
              </div>
            </div>
            <ScrollArea className="h-[300px]">
              <pre className="p-4 text-xs font-mono whitespace-pre-wrap">{v.output}</pre>
            </ScrollArea>
          </div>
        ))}
      </div>
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
        <Badge variant="outline" className="text-[10px]">Interactive</Badge>
      </div>

      <Tabs defaultValue="playground" className="flex-1 flex flex-col min-h-0">
        <TabsList className="glass w-fit mb-4">
          <TabsTrigger value="playground" className="text-xs gap-1.5"><Zap className="h-3 w-3" /> Playground</TabsTrigger>
          <TabsTrigger value="benchmarks" className="text-xs gap-1.5"><Target className="h-3 w-3" /> Benchmarks</TabsTrigger>
          <TabsTrigger value="compare" className="text-xs gap-1.5"><GitCompare className="h-3 w-3" /> Version Diff</TabsTrigger>
        </TabsList>

        <TabsContent value="playground" className="flex-1 min-h-0 mt-0">
          <PlaygroundTab />
        </TabsContent>
        <TabsContent value="benchmarks" className="flex-1 min-h-0 mt-0 overflow-auto">
          <BenchmarksTab />
        </TabsContent>
        <TabsContent value="compare" className="flex-1 min-h-0 mt-0 overflow-auto">
          <VersionCompareTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
