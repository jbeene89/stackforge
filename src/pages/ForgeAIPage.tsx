import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { streamAI } from "@/hooks/useSupabaseData";
import {
  Sparkles, Send, Loader2, CheckCircle2, Download,
  Code2, Cpu, Zap, Box, RotateCcw, Copy, Play,
  Atom, Brain, Radio, Workflow, Joystick, BarChart3,
  ChevronRight, FileCode, Package, Wand2
} from "lucide-react";

type GenerationDomain = "solver" | "ml-model" | "pipeline" | "signal" | "robotics" | "game-module";

interface GeneratedAsset {
  id: string;
  domain: GenerationDomain;
  name: string;
  description: string;
  spec: Record<string, any>;
  code: string;
  status: "generating" | "ready" | "deployed";
  timestamp: number;
}

const domainConfig: Record<GenerationDomain, { label: string; icon: any; color: string; placeholder: string; examples: string[] }> = {
  solver: { label: "Physics/Math Solver", icon: Atom, color: "text-cyan-500", placeholder: "Describe the solver you need…",
    examples: ["Lattice Boltzmann fluid solver for 2D cavity flow", "Runge-Kutta adaptive ODE integrator with error control", "Finite element solver for 2D heat equation with mesh refinement"] },
  "ml-model": { label: "ML Model Config", icon: Brain, color: "text-purple-500", placeholder: "Describe the model architecture…",
    examples: ["Lightweight image classifier for 10 classes, <5MB, mobile-ready", "Transformer encoder for sentiment analysis with 4 attention heads", "Autoencoder for anomaly detection on time-series sensor data"] },
  pipeline: { label: "Data Pipeline", icon: Workflow, color: "text-orange-500", placeholder: "Describe the data flow…",
    examples: ["CDC pipeline from PostgreSQL to Elasticsearch with transforms", "Real-time Kafka aggregator with 5-min tumbling windows", "ETL pipeline: S3 parquet → dedup → validate → Snowflake"] },
  signal: { label: "Signal Processor", icon: Radio, color: "text-green-500", placeholder: "Describe the signal processing chain…",
    examples: ["Adaptive noise canceller for ECG signals at 250Hz", "OFDM demodulator with channel estimation for 64 subcarriers", "Mel-spectrogram feature extractor for speech recognition"] },
  robotics: { label: "Robotics Controller", icon: Joystick, color: "text-rose-500", placeholder: "Describe the control system…",
    examples: ["PID cascade controller for quadcopter altitude hold", "Visual servoing controller for 6-DOF arm pick-and-place", "A* path planner with dynamic obstacle avoidance on 2D grid"] },
  "game-module": { label: "Game AI Module", icon: Zap, color: "text-yellow-500", placeholder: "Describe the game AI behavior…",
    examples: ["Behavior tree for guard NPC with patrol/chase/search states", "Procedural terrain generator with biome blending", "Dynamic difficulty adjustment based on player performance metrics"] },
};

// AI-powered generation using real streaming
async function generateWithAI(domain: GenerationDomain, prompt: string): Promise<GeneratedAsset> {
  const cfg = domainConfig[domain];
  const systemPrompt = `You are Forge AI, a code generation engine for the "${cfg.label}" domain. 
Given a user description, generate production-ready code. Output your response in this exact format:

NAME: <short class/module name>
DESCRIPTION: <one-line description>
SPEC:
- key: value (list 4-6 spec items)
---CODE---
<the actual code>
---END---

Generate real, working, well-commented code. Use TypeScript/Python as appropriate for the domain.`;

  let aiOutput = "";
  
  return new Promise((resolve, reject) => {
    streamAI({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      mode: "code",
      onDelta: (text) => { aiOutput += text; },
      onDone: () => {
        // Parse the AI response
        const nameMatch = aiOutput.match(/NAME:\s*(.+)/);
        const descMatch = aiOutput.match(/DESCRIPTION:\s*(.+)/);
        const codeMatch = aiOutput.match(/---CODE---\n?([\s\S]*?)---END---/);
        const specLines = aiOutput.match(/SPEC:\n([\s\S]*?)---CODE---/);
        
        const name = nameMatch?.[1]?.trim() || `Generated${domain.charAt(0).toUpperCase() + domain.slice(1)}`;
        const description = descMatch?.[1]?.trim() || `AI-generated ${cfg.label}: ${prompt.slice(0, 60)}`;
        const code = codeMatch?.[1]?.trim() || aiOutput; // fallback: use full output as code
        
        const spec: Record<string, any> = { domain: cfg.label, prompt: prompt.slice(0, 100) };
        if (specLines?.[1]) {
          specLines[1].split("\n").forEach(line => {
            const match = line.match(/^-\s*(.+?):\s*(.+)/);
            if (match) spec[match[1].trim()] = match[2].trim();
          });
        }
        
        resolve({
          id: `gen-${Date.now()}`,
          domain,
          name,
          description,
          spec,
          code,
          status: "ready",
          timestamp: Date.now(),
        });
      },
    }).catch(reject);
  });
}

export default function ForgeAIPage() {
  const [domain, setDomain] = useState<GenerationDomain>("solver");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const cfg = domainConfig[domain];

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const asset = await generateWithAI(domain, prompt);
      setAssets(prev => [asset, ...prev]);
      setSelectedAsset(asset);
      toast.success(`${asset.name} generated successfully`);
      setPrompt("");
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left: Generator */}
      <div className="w-[480px] border-r flex flex-col">
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wand2 className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">Forge AI</h1>
            </div>
            <p className="text-xs text-muted-foreground">Describe what you need. The SLM generates production-ready code in seconds.</p>
          </div>

          <Select value={domain} onValueChange={(v) => setDomain(v as GenerationDomain)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(domainConfig).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  <div className="flex items-center gap-2">
                    <v.icon className={cn("h-3.5 w-3.5", v.color)} />
                    {v.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-2">
            <Textarea
              placeholder={cfg.placeholder}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
              onKeyDown={e => { if (e.key === "Enter" && e.metaKey) generate(); }}
            />
            <Button className="w-full" onClick={generate} disabled={generating || !prompt.trim()}>
              {generating ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Generating…</> : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Generate</>}
            </Button>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground font-medium mb-1.5 uppercase tracking-wider">Try these</p>
            <div className="space-y-1">
              {cfg.examples.map((ex, i) => (
                <button key={i} onClick={() => setPrompt(ex)}
                  className="text-xs text-left text-muted-foreground hover:text-foreground transition-colors w-full p-1.5 rounded hover:bg-muted/50 flex items-start gap-1.5"
                >
                  <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-primary" />{ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* History */}
        <ScrollArea className="flex-1 p-4">
          <p className="text-[10px] text-muted-foreground font-medium mb-2 uppercase tracking-wider">Generated ({assets.length})</p>
          <div className="space-y-2">
            {assets.map(a => {
              const Icon = domainConfig[a.domain].icon;
              return (
                <motion.div key={a.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  className={cn("p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/10", selectedAsset?.id === a.id && "ring-2 ring-primary")}
                  onClick={() => setSelectedAsset(a)}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-3.5 w-3.5", domainConfig[a.domain].color)} />
                    <span className="text-sm font-medium truncate">{a.name}</span>
                    <Badge variant={a.status === "deployed" ? "default" : "secondary"} className="text-[9px] ml-auto shrink-0">{a.status}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{a.description}</p>
                </motion.div>
              );
            })}
            {assets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No assets generated yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Asset viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          {selectedAsset ? (
            <motion.div key={selectedAsset.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
              <div className="p-6 pb-0 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-primary" />
                    {selectedAsset.name}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedAsset.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(selectedAsset.code); toast.success("Copied to clipboard"); }}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Export dialog opened")}>
                    <Download className="h-3 w-3 mr-1" /> Export
                  </Button>
                  <Button size="sm" onClick={() => {
                    setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, status: "deployed" } : a));
                    setSelectedAsset({ ...selectedAsset, status: "deployed" });
                    toast.success(`${selectedAsset.name} deployed to workspace`);
                  }}>
                    <Play className="h-3 w-3 mr-1" /> Deploy
                  </Button>
                </div>
              </div>

              {/* Spec cards */}
              <div className="p-6 pb-0">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(selectedAsset.spec).filter(([, v]) => typeof v === "string").slice(0, 4).map(([k, v]) => (
                    <div key={k} className="p-2.5 rounded-md bg-muted/50 border">
                      <div className="text-[10px] text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1')}</div>
                      <div className="text-xs font-medium mt-0.5">{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code viewer */}
              <div className="flex-1 p-6 pt-4">
                <div className="h-full rounded-lg border bg-muted/30 overflow-hidden">
                  <div className="px-4 py-2 border-b bg-muted/50 flex items-center gap-2">
                    <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">Generated Code</span>
                    <Badge variant="outline" className="text-[9px] ml-auto">{selectedAsset.code.split("\n").length} lines</Badge>
                  </div>
                  <ScrollArea className="h-[calc(100%-36px)]">
                    <pre className="p-4 text-xs font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedAsset.code}</pre>
                  </ScrollArea>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Wand2 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-bold">Forge AI Generator</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">Pick a domain, describe what you need, and get production-ready code generated in seconds. Solvers, models, pipelines, controllers — all on demand.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
