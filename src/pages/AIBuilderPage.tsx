import { useState } from "react";
import { ExportToDialog } from "@/components/ExportToDialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Cpu, HardDrive, Gauge, Download, Play, RotateCcw,
  Send, CheckCircle2, AlertTriangle, Sparkles, Box,
  Smartphone, Monitor, Server, Zap, Brain, Shield,
  FileJson, Terminal, Clock, ChevronRight, Info
} from "lucide-react";

// ── Hover help tips ─────────────────────────────────────────
function HelpTip({ tip }: { tip: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary cursor-help inline-block ml-1 shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed">
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── Local model catalog ─────────────────────────────────────
const LOCAL_MODELS = [
  { id: "phi-3-mini", name: "Phi-3 Mini 3.8B", params: "3.8B", family: "Microsoft Phi", ramMin: 4, ramRec: 8, speed: "fast", quality: "good", formats: ["GGUF", "ONNX"], description: "Compact reasoning model. Great for classification, extraction, and structured output." },
  { id: "llama-3.2-3b", name: "Llama 3.2 3B", params: "3B", family: "Meta Llama", ramMin: 4, ramRec: 6, speed: "fast", quality: "good", formats: ["GGUF", "ONNX", "MLX"], description: "Meta's efficient small model. Strong instruction following and tool use." },
  { id: "llama-3.2-1b", name: "Llama 3.2 1B", params: "1B", family: "Meta Llama", ramMin: 2, ramRec: 4, speed: "very fast", quality: "moderate", formats: ["GGUF", "ONNX", "MLX"], description: "Ultra-lightweight. Best for edge devices and simple tasks." },
  { id: "gemma-2-2b", name: "Gemma 2 2B", params: "2B", family: "Google Gemma", ramMin: 3, ramRec: 6, speed: "fast", quality: "good", formats: ["GGUF", "ONNX"], description: "Google's compact model. Excellent at summarization and Q&A." },
  { id: "mistral-7b", name: "Mistral 7B", params: "7B", family: "Mistral AI", ramMin: 6, ramRec: 16, speed: "moderate", quality: "high", formats: ["GGUF", "ONNX", "MLX"], description: "High-quality general-purpose model. Needs more RAM but delivers strong results." },
  { id: "qwen-2.5-3b", name: "Qwen 2.5 3B", params: "3B", family: "Alibaba Qwen", ramMin: 4, ramRec: 8, speed: "fast", quality: "good", formats: ["GGUF", "ONNX"], description: "Multilingual model with strong coding and math capabilities." },
  { id: "tinyllama-1.1b", name: "TinyLlama 1.1B", params: "1.1B", family: "TinyLlama", ramMin: 1, ramRec: 2, speed: "very fast", quality: "basic", formats: ["GGUF"], description: "Smallest viable model. For IoT, embedded, and ultra-constrained environments." },
] as const;

const QUANT_OPTIONS = [
  { id: "Q4_K_M", label: "Q4_K_M", desc: "4-bit — Best balance of size and quality", sizeMultiplier: 0.35, qualityLoss: "minimal" },
  { id: "Q5_K_M", label: "Q5_K_M", desc: "5-bit — Higher quality, slightly larger", sizeMultiplier: 0.42, qualityLoss: "negligible" },
  { id: "Q8_0", label: "Q8_0", desc: "8-bit — Near full quality, 2x size of Q4", sizeMultiplier: 0.55, qualityLoss: "none" },
  { id: "F16", label: "F16", desc: "16-bit — Full precision, maximum size", sizeMultiplier: 1.0, qualityLoss: "none" },
] as const;

const DEPLOY_TARGETS = [
  { id: "android", label: "Android Device", icon: Smartphone, desc: "On-device via llama.cpp or MLC", requirements: "ARM64, 4GB+ RAM" },
  { id: "desktop", label: "Desktop (Win/Mac/Linux)", icon: Monitor, desc: "Via Ollama, LM Studio, or llama.cpp", requirements: "8GB+ RAM recommended" },
  { id: "edge", label: "Edge Server", icon: Server, desc: "Self-hosted API via vLLM or TGI", requirements: "GPU recommended, 16GB+ RAM" },
  { id: "browser", label: "In-Browser (WebLLM)", icon: Box, desc: "WebGPU-powered, no server needed", requirements: "Chrome 113+, 4GB+ VRAM" },
] as const;

// Format tooltips
const FORMAT_TIPS: Record<string, string> = {
  GGUF: "A file format for AI models. Think of it like a .zip for AI brains — it's how the model gets saved to your computer.",
  ONNX: "A universal AI format that works across different platforms, like a PDF for AI models.",
  MLX: "Apple's format optimized for Mac chips (M1/M2/M3). Runs fastest on Apple hardware.",
};

type BuildStep = "configure" | "tune" | "deploy";

// ── Simulated test output ───────────────────────────────────
function simulateLocalInference(model: string, prompt: string) {
  const responses: Record<string, string> = {
    classify: `{ "category": "structural_repair", "confidence": 0.94, "subcategory": "concrete_spalling", "urgency": "standard" }`,
    extract: `{ "items": [ { "description": "Pile cap repair", "quantity": 12, "unit": "EA" }, { "description": "Timber decking", "quantity": 2400, "unit": "SQFT" }, { "description": "Fender system", "quantity": 340, "unit": "LF" } ], "total_items": 3 }`,
    default: `{ "result": "processed", "tokens_used": 142, "latency_ms": 280, "model": "${model}" }`,
  };
  const lower = prompt.toLowerCase();
  if (lower.includes("classify") || lower.includes("category")) return responses.classify;
  if (lower.includes("extract") || lower.includes("items") || lower.includes("list")) return responses.extract;
  return responses.default;
}

// ── Components ──────────────────────────────────────────────
function ModelCard({
  model,
  selected,
  onSelect,
}: {
  model: typeof LOCAL_MODELS[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl p-4 border transition-all ${
        selected
          ? "border-primary bg-primary/5 glow-primary"
          : "border-border hover:border-primary/40 hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-sm font-semibold">{model.name}</h4>
          <p className="text-xs text-muted-foreground">{model.family}</p>
        </div>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div><Badge variant="outline" className="text-xs cursor-help">{model.params}</Badge></div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px] text-xs">
              "{model.params}" means this model has {model.params} parameters — the "brain cells" of the AI. More = smarter but needs more computer power.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{model.description}</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 cursor-help"><HardDrive className="h-3 w-3" /> {model.ramMin}–{model.ramRec}GB</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px] text-xs">
              RAM is your computer's short-term memory. This model needs {model.ramMin}–{model.ramRec}GB free. Check your computer's "About" page to see how much you have.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 cursor-help"><Gauge className="h-3 w-3" /> {model.speed}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[220px] text-xs">
              How quickly the AI responds. "Very fast" = near-instant, "moderate" = a few seconds per answer.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 cursor-help"><Sparkles className="h-3 w-3" /> {model.quality}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[220px] text-xs">
              How accurate and smart the AI's answers are. "High" = great answers, "basic" = simple tasks only.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex gap-1 mt-2">
        {model.formats.map((f) => (
          <TooltipProvider key={f} delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div><Badge variant="secondary" className="text-[10px] px-1.5 py-0 cursor-help">{f}</Badge></div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[240px] text-xs">
                {FORMAT_TIPS[f] || `${f} is a file format this model supports.`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </button>
  );
}

function StepIndicator({ step, current }: { step: BuildStep; current: BuildStep }) {
  const steps: BuildStep[] = ["configure", "tune", "deploy"];
  const idx = steps.indexOf(step);
  const currentIdx = steps.indexOf(current);
  const done = idx < currentIdx;
  const active = idx === currentIdx;

  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
        done ? "bg-forge-emerald text-primary-foreground" :
        active ? "gradient-primary text-primary-foreground" :
        "bg-muted text-muted-foreground"
      }`}>
        {done ? <CheckCircle2 className="h-3 w-3" /> : idx + 1}
      </div>
      <span className={`text-xs font-medium capitalize ${active ? "text-foreground" : "text-muted-foreground"}`}>
        {step}
      </span>
      {idx < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────
export default function AIBuilderPage() {
  const [currentStep, setCurrentStep] = useState<BuildStep>("configure");
  const [selectedModel, setSelectedModel] = useState<string>("phi-3-mini");
  const [quantization, setQuantization] = useState("Q4_K_M");
  const [deployTarget, setDeployTarget] = useState("desktop");

  // Identity
  const [aiName, setAiName] = useState("");
  const [aiRole, setAiRole] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");

  // Tuning
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [contextWindow, setContextWindow] = useState(4096);
  const [deterministic, setDeterministic] = useState(true);
  const [structuredOutput, setStructuredOutput] = useState(true);

  // Test
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const model = LOCAL_MODELS.find((m) => m.id === selectedModel)!;
  const quant = QUANT_OPTIONS.find((q) => q.id === quantization)!;
  const target = DEPLOY_TARGETS.find((t) => t.id === deployTarget)!;

  const estimatedSize = (parseFloat(model.params) * quant.sizeMultiplier).toFixed(1);

  const runTest = () => {
    if (!testInput.trim()) return;
    setIsRunning(true);
    setTestOutput(null);
    setTimeout(() => {
      setTestOutput(simulateLocalInference(model.name, testInput));
      setIsRunning(false);
    }, 1200);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-forge-amber" />
          <h1 className="text-lg font-bold">Build-a-AI</h1>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div><Badge className="bg-forge-cyan/15 text-forge-cyan border-forge-cyan/30 text-[10px] cursor-help">Local-First</Badge></div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px] text-xs">
                "Local-First" means the AI runs on YOUR device — your data never leaves your computer. No internet needed, no cloud fees, total privacy.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-3">
          <ExportToDialog context="ai-builder" projectName="Build-a-AI" />
          {(["configure", "tune", "deploy"] as BuildStep[]).map((s) => (
            <StepIndicator key={s} step={s} current={currentStep} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="flex-1 border-r border-border overflow-hidden">
          <Tabs value={currentStep} onValueChange={(v) => setCurrentStep(v as BuildStep)} className="h-full flex flex-col">
            <TabsList className="mx-4 mt-3 glass w-fit">
              <TabsTrigger value="configure">1. Configure</TabsTrigger>
              <TabsTrigger value="tune">2. Tune</TabsTrigger>
              <TabsTrigger value="deploy">3. Deploy</TabsTrigger>
            </TabsList>

            {/* ─── Step 1: Configure ─── */}
            <TabsContent value="configure" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-5">
                  {/* Identity */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-3 w-3" /> Identity
                      <HelpTip tip="Give your AI a name and personality. This is like naming a new team member and describing their job." />
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center">AI Name <HelpTip tip="A friendly name for your AI, like 'ScopeBot' or 'InvoiceHelper'. Just for your reference." /></Label>
                        <Input value={aiName} onChange={(e) => setAiName(e.target.value)} placeholder="e.g. ScopeBot" className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center">Role <HelpTip tip="What job does this AI do? e.g. 'Classifies invoices' or 'Answers customer questions'. This helps you remember its purpose." /></Label>
                        <Input value={aiRole} onChange={(e) => setAiRole(e.target.value)} placeholder="e.g. Invoice classifier" className="h-8 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center">System Prompt <HelpTip tip="Instructions that tell the AI how to behave — like a job description. For example: 'You are a helpful assistant that classifies construction documents.' The AI follows these rules for every conversation." /></Label>
                      <Textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="You are a specialist AI that..."
                        rows={4}
                        className="font-mono text-xs"
                      />
                    </div>
                  </section>

                  <Separator />

                  {/* Model Selection */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Cpu className="h-3 w-3" /> Base Model
                      <HelpTip tip="Choose which AI brain to use. Smaller models (1–3B) are faster and use less memory. Larger models (7B+) are smarter but need a beefier computer. Pick based on your device and how complex your tasks are." />
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {LOCAL_MODELS.map((m) => (
                        <ModelCard
                          key={m.id}
                          model={m}
                          selected={selectedModel === m.id}
                          onSelect={() => setSelectedModel(m.id)}
                        />
                      ))}
                    </div>
                  </section>

                  <Separator />

                  {/* Quantization */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Zap className="h-3 w-3" /> Quantization
                      <HelpTip tip="Quantization is like compressing a photo — it shrinks the AI model so it fits on your device. Lower numbers (4-bit) = smaller file, slightly less accurate. Higher numbers (16-bit) = full quality but much bigger file. For most people, Q4_K_M is the sweet spot." />
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {QUANT_OPTIONS.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => setQuantization(q.id)}
                          className={`text-left rounded-lg p-3 border transition-all ${
                            quantization === q.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-mono font-semibold">{q.label}</span>
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div><Badge variant="outline" className="text-xs cursor-help">~{(parseFloat(model.params) * q.sizeMultiplier).toFixed(1)}GB</Badge></div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[220px] text-xs">
                                  This is how much space the model will take on your hard drive — like downloading a {(parseFloat(model.params) * q.sizeMultiplier).toFixed(1)}GB file.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <p className="text-xs text-muted-foreground">{q.desc}</p>
                          <p className="text-xs text-muted-foreground mt-1">Quality loss: <span className="text-foreground">{q.qualityLoss}</span>
                            <HelpTip tip={
                              q.qualityLoss === "none" ? "No quality loss — the AI performs at full accuracy, identical to the original." :
                              q.qualityLoss === "negligible" ? "Almost no difference from full quality. You probably won't notice any change." :
                              "Very slight reduction in accuracy. For most tasks, the answers are just as good."
                            } />
                          </p>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ─── Step 2: Tune ─── */}
            <TabsContent value="tune" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-5">
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Gauge className="h-3 w-3" /> Inference Settings
                      <HelpTip tip="These settings control how the AI thinks and responds. Don't worry — the defaults work great for most use cases. Only tweak if you know what you're doing!" />
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs flex items-center">Temperature <HelpTip tip="Controls how creative vs. predictable the AI is. Low (0.0–0.3) = focused, consistent answers. High (0.7–1.0) = more creative, varied answers. For business tasks, keep it low." /></Label>
                        <span className="text-xs font-mono text-muted-foreground">{temperature}</span>
                      </div>
                      <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} max={1} step={0.05} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs flex items-center">Max Tokens <HelpTip tip="The maximum length of the AI's response. 1 token ≈ ¾ of a word. 1024 tokens ≈ about 750 words, which is plenty for most answers." /></Label>
                        <span className="text-xs font-mono text-muted-foreground">{maxTokens}</span>
                      </div>
                      <Slider value={[maxTokens]} onValueChange={([v]) => setMaxTokens(v)} min={128} max={4096} step={128} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs flex items-center">Context Window <HelpTip tip="How much text the AI can 'remember' in one conversation. Think of it as short-term memory. Bigger = can handle longer documents, but uses more RAM." /></Label>
                        <span className="text-xs font-mono text-muted-foreground">{contextWindow}</span>
                      </div>
                      <Slider value={[contextWindow]} onValueChange={([v]) => setContextWindow(v)} min={1024} max={32768} step={1024} />
                    </div>
                  </section>

                  <Separator />

                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Shield className="h-3 w-3" /> Behavior Flags
                      <HelpTip tip="These toggles change how the AI behaves. They're like 'modes' — turn them on or off depending on what you need." />
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Deterministic Mode", checked: deterministic, onChange: setDeterministic, tip: "When ON, the AI gives the same answer every time for the same question. Great for consistency. When OFF, answers may vary slightly each time." },
                        { label: "Structured Output (JSON)", checked: structuredOutput, onChange: setStructuredOutput, tip: "When ON, the AI formats answers as JSON — a structured data format that apps can read. When OFF, answers come as plain text." },
                      ].map((flag) => (
                        <div key={flag.label} className="flex items-center justify-between glass rounded-lg px-3 py-2">
                          <Label className="text-xs flex items-center">{flag.label} <HelpTip tip={flag.tip} /></Label>
                          <Switch checked={flag.checked} onCheckedChange={flag.onChange} className="scale-75" />
                        </div>
                      ))}
                    </div>
                  </section>

                  <Separator />

                  {/* Hardware estimate */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <HardDrive className="h-3 w-3" /> Hardware Requirements
                      <HelpTip tip="This shows what your computer needs to run this AI. Check if your device meets these specs before downloading." />
                    </h3>
                    <div className="glass rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-foreground">{estimatedSize}<span className="text-xs text-muted-foreground ml-0.5">GB</span></p>
                          <p className="text-xs text-muted-foreground flex items-center justify-center">Model Size <HelpTip tip="How much hard drive space the AI model file takes up. Similar to downloading a large app or game." /></p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-foreground">{model.ramRec}<span className="text-xs text-muted-foreground ml-0.5">GB</span></p>
                          <p className="text-xs text-muted-foreground flex items-center justify-center">RAM Needed <HelpTip tip="RAM is your computer's working memory (not storage). To check yours: Mac → Apple menu → About This Mac. Windows → Right-click Start → System." /></p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-foreground capitalize">{model.speed}</p>
                          <p className="text-xs text-muted-foreground flex items-center justify-center">Speed <HelpTip tip="How fast the AI will respond on typical hardware. 'Fast' = under 1 second, 'Moderate' = 2–5 seconds per response." /></p>
                        </div>
                      </div>
                      {parseFloat(estimatedSize) > 4 && (
                        <div className="flex items-start gap-2 rounded-lg px-3 py-2 bg-forge-amber/10 border border-forge-amber/20">
                          <AlertTriangle className="h-3.5 w-3.5 text-forge-amber shrink-0 mt-0.5" />
                          <span className="text-xs">This configuration may be slow on devices with less than {model.ramRec}GB RAM. Consider Q4_K_M quantization for smaller footprint.</span>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ─── Step 3: Deploy ─── */}
            <TabsContent value="deploy" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-5">
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Monitor className="h-3 w-3" /> Deploy Target
                      <HelpTip tip="Where do you want to run your AI? Pick the option that matches your device. 'Desktop' is the easiest for beginners." />
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {DEPLOY_TARGETS.map((t) => {
                        const targetTips: Record<string, string> = {
                          android: "Run the AI directly on your Android phone or tablet. Your data stays on-device — no internet needed after setup.",
                          desktop: "The easiest option! Run AI on your Windows, Mac, or Linux computer using a simple app called Ollama.",
                          edge: "For advanced users: run the AI on your own server so multiple people or apps can use it over a network.",
                          browser: "Experimental: runs AI right in your Chrome browser tab using your graphics card. No installs needed, but requires a modern GPU.",
                        };
                        return (
                          <button
                            key={t.id}
                            onClick={() => setDeployTarget(t.id)}
                            className={`text-left rounded-xl p-4 border transition-all ${
                              deployTarget === t.id
                                ? "border-primary bg-primary/5 glow-primary"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <t.icon className={`h-5 w-5 mb-2 ${deployTarget === t.id ? "text-primary" : "text-muted-foreground"}`} />
                            <h4 className="text-sm font-semibold flex items-center">{t.label} <HelpTip tip={targetTips[t.id]} /></h4>
                            <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                            <p className="text-xs text-muted-foreground mt-1 font-mono">{t.requirements}</p>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <Separator />

                  {/* Export Config */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <FileJson className="h-3 w-3" /> Export Configuration
                      <HelpTip tip="A summary of all your choices. You can export this as a config file or copy a ready-to-use command." />
                    </h3>
                    <div className="glass rounded-xl p-4 space-y-3">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between py-1"><span className="text-muted-foreground">Model</span><span className="font-mono">{model.name}</span></div>
                        <div className="flex justify-between py-1"><span className="text-muted-foreground">Quantization</span><span className="font-mono">{quantization}</span></div>
                        <div className="flex justify-between py-1"><span className="text-muted-foreground">Size</span><span className="font-mono">{estimatedSize} GB</span></div>
                        <div className="flex justify-between py-1"><span className="text-muted-foreground">Target</span><span className="font-mono">{target.label}</span></div>
                        <div className="flex justify-between py-1"><span className="text-muted-foreground">Temperature</span><span className="font-mono">{temperature}</span></div>
                        <div className="flex justify-between py-1"><span className="text-muted-foreground">Context</span><span className="font-mono">{contextWindow}</span></div>
                      </div>
                      <Separator />
                      <div className="flex gap-2">
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" className="flex-1 gradient-primary text-primary-foreground">
                                <Download className="h-3.5 w-3.5 mr-1.5" /> Export GGUF Config
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[240px] text-xs">
                              Downloads a settings file that tells tools like Ollama exactly how to set up your AI. Like a recipe card for your AI configuration.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" className="flex-1">
                                <Terminal className="h-3.5 w-3.5 mr-1.5" /> Copy Ollama Command
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[240px] text-xs">
                              Copies a ready-to-paste command for Ollama. Just open Terminal (Mac) or Command Prompt (Windows) and paste it.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* Setup instructions */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Terminal className="h-3 w-3" /> Quick Start
                      <HelpTip tip="Step-by-step commands to get your AI running. Click each one to copy it, then paste it where indicated. Hover over any command to see beginner-friendly instructions." />
                    </h3>
                    <div className="space-y-2">
                      {deployTarget === "desktop" && (
                        <>
                          <CodeBlock label="Install Ollama" code="curl -fsSL https://ollama.com/install.sh | sh" />
                          <CodeBlock label="Pull Model" code={`ollama pull ${model.id}:${quantization.toLowerCase()}`} />
                          <CodeBlock label="Run" code={`ollama run ${model.id} --system "${systemPrompt || 'You are a helpful AI assistant.'}"`} />
                          <CodeBlock label="API Access" code={`curl http://localhost:11434/api/generate -d '{"model":"${model.id}","prompt":"Hello"}'`} />
                        </>
                      )}
                      {deployTarget === "android" && (
                        <>
                          <CodeBlock label="1. Add llama.cpp dependency" code="implementation 'com.github.nicbarker:llama.cpp-android:latest'" />
                          <CodeBlock label="2. Load model" code={`LlamaModel model = new LlamaModel("${model.id}-${quantization.toLowerCase()}.gguf");`} />
                          <CodeBlock label="3. Run inference" code={`String result = model.generate("${systemPrompt || 'Classify this input'}");`} />
                        </>
                      )}
                      {deployTarget === "edge" && (
                        <>
                          <CodeBlock label="Docker" code={`docker run -p 8080:8080 ghcr.io/huggingface/text-generation-inference --model-id ${model.family.toLowerCase().replace(' ', '-')}/${model.id} --quantize ${quantization.toLowerCase()}`} />
                        </>
                      )}
                      {deployTarget === "browser" && (
                        <>
                          <CodeBlock label="Install WebLLM" code="npm install @mlc-ai/web-llm" />
                          <CodeBlock label="Load in browser" code={`import { CreateMLCEngine } from "@mlc-ai/web-llm";\nconst engine = await CreateMLCEngine("${model.id}-${quantization.toLowerCase()}-MLC");`} />
                        </>
                      )}
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Live Test Panel */}
        <div className="w-[400px] flex flex-col bg-muted/20">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Play className="h-3.5 w-3.5 text-forge-emerald" /> Simulated Local Test
              <HelpTip tip="This panel lets you test how your AI would respond — it's a simulation, not the real model. Use it to preview behavior before deploying." />
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Cpu className="h-3 w-3" />
              <span>{model.name}</span>
              <Badge variant="outline" className="text-xs">{quantization}</Badge>
            </div>
          </div>

          <div className="p-4 space-y-2 flex-shrink-0">
            <Label className="text-xs flex items-center">Test Prompt <HelpTip tip="Type a question or instruction here to see how the AI would respond. Try things like 'Classify this invoice' or 'Extract items from this list'." /></Label>
            <Textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter a test prompt for your local AI..."
              rows={4}
              className="text-sm"
            />
            <Button
              onClick={runTest}
              disabled={isRunning || !testInput.trim()}
              size="sm"
              className="w-full gradient-primary text-primary-foreground"
            >
              {isRunning ? (
                <><RotateCcw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Running locally...</>
              ) : (
                <><Send className="h-3.5 w-3.5 mr-1.5" /> Run Local Inference</>
              )}
            </Button>
          </div>

          <Separator />

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-2 flex items-center justify-between">
              <Label className="text-xs">Output</Label>
              {testOutput && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>~280ms</span>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div><Badge variant="outline" className="text-xs text-forge-emerald border-forge-emerald/30 cursor-help">local</Badge></div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[220px] text-xs">
                        This ran entirely on your device — no data was sent to the cloud. 280ms means it took about a quarter of a second.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
            <ScrollArea className="flex-1 px-4 pb-4">
              {testOutput ? (
                <pre className="text-xs font-mono whitespace-pre-wrap text-foreground leading-relaxed bg-card rounded-lg p-3 border border-border">{testOutput}</pre>
              ) : isRunning ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <RotateCcw className="h-8 w-8 animate-spin mb-3 text-primary" />
                  <p className="text-sm">Simulating local inference...</p>
                  <p className="text-xs">{model.name} · {quantization}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Cpu className="h-8 w-8 mb-3 animate-glow-pulse" />
                  <p className="text-sm">No output yet</p>
                  <p className="text-xs">Run a test to simulate local inference</p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Model summary footer */}
          <div className="px-4 py-3 border-t border-border">
            <div className="glass rounded-lg p-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs font-bold">{estimatedSize}GB</p>
                <p className="text-xs text-muted-foreground">Disk</p>
              </div>
              <div>
                <p className="text-xs font-bold">{model.ramMin}–{model.ramRec}GB</p>
                <p className="text-xs text-muted-foreground">RAM</p>
              </div>
              <div>
                <p className="text-xs font-bold capitalize">{model.speed}</p>
                <p className="text-xs text-muted-foreground">Speed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STEP_TIPS: Record<string, string> = {
  "Install Ollama": "1. This will open ollama.com in your browser\n2. Click the big 'Download' button\n3. Run the installer like any other app\n4. Ollama will appear in your system tray when ready",
  "Pull Model": "1. Open Terminal (Mac: Spotlight → type 'Terminal') or Command Prompt (Windows: Start → type 'cmd')\n2. Paste this command and press Enter\n3. Wait for the download to finish — it may take a few minutes",
  "Run": "1. Open Terminal or Command Prompt (same as above)\n2. Paste this command and press Enter\n3. Your AI will start! Type messages and press Enter to chat",
  "API Access": "1. Open Terminal or Command Prompt\n2. Paste this command and press Enter\n3. You'll see a JSON response — that means your AI is working as an API",
  "1. Add llama.cpp dependency": "1. Open your Android project in Android Studio\n2. Open the file called 'build.gradle'\n3. Find the 'dependencies' section\n4. Paste this line inside it and click 'Sync'",
  "2. Load model": "1. Add this code in your app's main activity file\n2. It loads the AI model so your app can use it",
  "3. Run inference": "1. Add this code where you want the AI to respond\n2. The result will contain the AI's answer",
  "Docker": "1. Install Docker Desktop from docker.com\n2. Open Terminal or Command Prompt\n3. Paste this command and press Enter\n4. Your AI server will start on port 8080",
  "Install WebLLM": "1. Open Terminal in your project folder\n2. Paste this command and press Enter\n3. This installs the library that runs AI in your browser",
  "Load in browser": "1. Add this code to your JavaScript/TypeScript file\n2. The AI model will download and run directly in the browser\n3. No server needed — it uses your GPU",
};

function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const tip = STEP_TIPS[label];

  const handleClick = () => {
    if (label === "Install Ollama") {
      window.open("https://ollama.com/download", "_blank");
      toast.success("Opened ollama.com in your browser");
      return;
    }
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`Command copied! ${label.includes("Terminal") || label.includes("Docker") || label.includes("Pull") || label.includes("Run") || label.includes("API") ? "Open your Terminal and paste it there." : "Paste it in your code editor."}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        className="w-full text-left group space-y-1.5 rounded-xl border border-border hover:border-primary/40 bg-card/50 hover:bg-primary/5 p-3 transition-all"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Terminal className="h-3 w-3" /> {label}
          </p>
          <span className="text-[10px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            {copied ? <><CheckCircle2 className="h-3 w-3" /> Copied</> : label === "Install Ollama" ? "Click to open download page" : "Click to copy"}
          </span>
        </div>
        <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground">{code}</pre>
      </button>

      {showTip && tip && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 glass-strong rounded-xl p-3 shadow-lg border border-primary/20 animate-fade-in">
          <p className="text-xs font-semibold text-primary mb-1.5 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> How to do this
          </p>
          <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{tip}</div>
        </div>
      )}
    </div>
  );
}
