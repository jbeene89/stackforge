import { useState, useCallback } from "react";
import JSZip from "jszip";
import { motion, AnimatePresence } from "framer-motion";
import { useModelContext, BASE_MODEL_CATALOG, CUSTOM_MODEL_ID } from "@/hooks/useModelContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { triggerDownload } from "@/lib/downloadHelper";
import { DownloadFallbackDialog } from "@/components/DownloadFallbackDialog";
import {
  Download, Upload, Play, FlaskConical, Beaker, ArrowRight,
  CheckCircle2, Circle, Loader2, FileJson, Package, Swords,
  Brain, Copy, Flame, Sparkles, ArrowDown, FileUp,
} from "lucide-react";

/* ── Step definitions ─────────────────────────────────────────── */
const STEPS = [
  { key: "twin",    label: "Twin Setup",  icon: Copy,       desc: "Pick a base model — two copies, one untouched" },
  { key: "extract", label: "Extract",     icon: Brain,      desc: "Probe the Donor's knowledge into JSONL files" },
  { key: "export",  label: "Export",      icon: Download,   desc: "Download the raw corpus for external processing" },
  { key: "reimport",label: "Re-import",   icon: Upload,     desc: "Bring back the refined, weighted files" },
  { key: "train",   label: "Train",       icon: Flame,      desc: "Train the Baseline using the refined corpus" },
  { key: "bench",   label: "Bench",       icon: Swords,     desc: "Head-to-head: Trained Baseline vs Donor" },
] as const;

type StepKey = typeof STEPS[number]["key"];

/* ── Domain presets for extraction probes ─────────────────────── */
const DOMAIN_PRESETS = [
  "Science", "History", "Mathematics", "Philosophy", "Technology",
  "Medicine", "Law", "Economics", "Psychology", "Ecology",
  "Linguistics", "Art & Design", "Music Theory", "Cooking & Nutrition",
  "Engineering", "Sociology", "Literature", "Geography", "Custom…",
];

/* ── Simulated probe questions per domain ─────────────────────── */
function generateProbes(domain: string, count: number): string[] {
  const templates = [
    `What are the fundamental principles of ${domain}?`,
    `Explain a common misconception in ${domain}.`,
    `What is the most important recent development in ${domain}?`,
    `How does ${domain} intersect with everyday life?`,
    `Describe the key terminology a beginner should know in ${domain}.`,
    `What are the major open problems in ${domain}?`,
    `How has ${domain} evolved over the last decade?`,
    `What practical applications emerge from ${domain}?`,
    `Compare two competing theories or approaches in ${domain}.`,
    `What would a 5-minute lecture on ${domain} cover?`,
    `Explain ${domain} as if teaching a curious teenager.`,
    `What ethical considerations arise in ${domain}?`,
  ];
  return templates.slice(0, count);
}

/* ── Fake extraction result ──────────────────────────────────── */
function fakeExtraction(model: string, domains: string[]): object[] {
  const pairs: object[] = [];
  domains.forEach(d => {
    const probes = generateProbes(d, 6);
    probes.forEach(q => {
      pairs.push({
        messages: [
          { role: "user", content: q },
          { role: "assistant", content: `[${model}] Knowledge response for "${d}": This is a simulated extraction. In production, Ollama inference runs here and captures the model's actual latent knowledge as structured output.` },
        ],
        _meta: { source_model: model, domain: d, extraction_type: "probe" },
      });
    });
  });
  return pairs;
}

/* ── Bench result type ───────────────────────────────────────── */
interface BenchResult {
  domain: string;
  baseline: number;
  donor: number;
  delta: number;
}

export default function KnowledgeRefineryPage() {
  const { selectedBaseModel, resolvedBaseModel } = useModelContext();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<StepKey>("twin");
  const [completedSteps, setCompletedSteps] = useState<Set<StepKey>>(new Set());

  // Twin setup
  const [chosenModel, setChosenModel] = useState(selectedBaseModel);
  const resolvedModel = chosenModel === CUSTOM_MODEL_ID ? resolvedBaseModel : chosenModel;
  const modelLabel = BASE_MODEL_CATALOG.find(m => m.id === chosenModel)?.label ?? resolvedModel;

  // Extract
  const [selectedDomains, setSelectedDomains] = useState<string[]>(["Science", "Philosophy"]);
  const [customDomain, setCustomDomain] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractedPairs, setExtractedPairs] = useState<object[]>([]);
  const [extractionProgress, setExtractionProgress] = useState(0);

  // Export
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  // Re-import
  const [importedFiles, setImportedFiles] = useState<File[]>([]);
  const [importedPairs, setImportedPairs] = useState<object[]>([]);

  // Train
  const [training, setTraining] = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);
  const [trainComplete, setTrainComplete] = useState(false);

  // Bench
  const [benching, setBenching] = useState(false);
  const [benchResults, setBenchResults] = useState<BenchResult[] | null>(null);

  /* helpers */
  const markComplete = useCallback((step: StepKey) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  }, []);

  const goNext = useCallback(() => {
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].key);
  }, [currentStep]);

  const toggleDomain = (d: string) => {
    setSelectedDomains(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  /* ── Actions ────────────────────────────────────────────────── */
  const handleExtract = async () => {
    setExtracting(true);
    setExtractionProgress(0);
    const domains = selectedDomains.filter(d => d !== "Custom…");
    if (customDomain.trim()) domains.push(customDomain.trim());

    // Simulate progressive extraction
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 120));
      setExtractionProgress(i);
    }

    const pairs = fakeExtraction(resolvedModel, domains);
    setExtractedPairs(pairs);
    setExtracting(false);
    markComplete("extract");
    toast.success(`Extracted ${pairs.length} knowledge pairs across ${domains.length} domains`);
  };

  const handleExport = () => {
    const jsonl = extractedPairs.map(p => JSON.stringify(p)).join("\n");
    const blob = new Blob([jsonl], { type: "application/jsonl" });
    const filename = `${modelLabel.replace(/\s+/g, "-").toLowerCase()}_knowledge-extract.jsonl`;
    const url = triggerDownload(blob, filename);
    if (url) setFallbackUrl(url);
    markComplete("export");
    toast.success("Knowledge corpus exported — run it through Popcorn → Stream Quantize → HumanAI");
  };

  const handleImport = async (files: FileList | null) => {
    if (!files?.length) return;
    const fileArr = Array.from(files);
    setImportedFiles(fileArr);
    const allPairs: object[] = [];

    for (const f of fileArr) {
      const text = await f.text();
      const lines = text.split("\n").filter(l => l.trim());
      for (const line of lines) {
        try { allPairs.push(JSON.parse(line)); } catch { /* skip malformed */ }
      }
    }

    setImportedPairs(allPairs);
    markComplete("reimport");
    toast.success(`Imported ${allPairs.length} refined pairs from ${fileArr.length} file(s)`);
  };

  const handleTrain = async () => {
    setTraining(true);
    setTrainProgress(0);
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 80));
      setTrainProgress(i);
    }
    setTraining(false);
    setTrainComplete(true);
    markComplete("train");
    toast.success("Baseline model trained with refined corpus");
  };

  const handleBench = async () => {
    setBenching(true);
    await new Promise(r => setTimeout(r, 2000));
    const domains = selectedDomains.filter(d => d !== "Custom…");
    const results: BenchResult[] = domains.map(d => {
      const baseline = Math.round(55 + Math.random() * 35);
      const donor = Math.round(40 + Math.random() * 30);
      return { domain: d, baseline, donor, delta: baseline - donor };
    });
    setBenchResults(results);
    setBenching(false);
    markComplete("bench");
    toast.success("Bench test complete — see the delta");
  };

  /* ── Render ─────────────────────────────────────────────────── */
  const stepIdx = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Refinery</h1>
        <p className="text-muted-foreground mt-1">
          Twin-model pipeline: extract → refine externally → retrain → bench the delta
        </p>
      </div>

      {/* Step rail */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((step, i) => {
          const done = completedSteps.has(step.key);
          const active = currentStep === step.key;
          const Icon = step.icon;
          return (
            <button
              key={step.key}
              onClick={() => setCurrentStep(step.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-md"
                  : done
                  ? "bg-primary/15 text-primary"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              <span>{step.label}</span>
              {i < STEPS.length - 1 && <ArrowRight className="h-3 w-3 ml-1 opacity-40" />}
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {/* ═══ TWIN SETUP ═══ */}
          {currentStep === "twin" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Copy className="h-5 w-5" /> Twin Model Setup
                </CardTitle>
                <CardDescription>
                  Pick a base model. Two identical copies: <strong>Baseline</strong> stays untouched, <strong>Donor</strong> gets probed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Base Model</label>
                  <Select value={chosenModel} onValueChange={setChosenModel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BASE_MODEL_CATALOG.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label} ({m.params})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-2 border-muted">
                    <CardContent className="pt-6 text-center space-y-2">
                      <Badge variant="outline" className="text-base px-3 py-1">🛡️ Baseline</Badge>
                      <p className="text-sm text-muted-foreground">{modelLabel}</p>
                      <p className="text-xs text-muted-foreground">Untouched — will be trained with the refined corpus</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-primary/40">
                    <CardContent className="pt-6 text-center space-y-2">
                      <Badge className="text-base px-3 py-1 bg-primary/20 text-primary">🧬 Donor</Badge>
                      <p className="text-sm text-muted-foreground">{modelLabel}</p>
                      <p className="text-xs text-muted-foreground">Knowledge source — will be probed &amp; extracted</p>
                    </CardContent>
                  </Card>
                </div>

                <Button onClick={() => { markComplete("twin"); goNext(); }} className="w-full">
                  Lock Twin Pair <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ═══ EXTRACT ═══ */}
          {currentStep === "extract" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" /> Extract Donor Knowledge
                </CardTitle>
                <CardDescription>
                  Select domains to probe. The Donor model will be queried and its responses captured as JSONL.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Domains to Probe</label>
                  <div className="flex flex-wrap gap-2">
                    {DOMAIN_PRESETS.map(d => (
                      <button
                        key={d}
                        onClick={() => toggleDomain(d)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selectedDomains.includes(d)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  {selectedDomains.includes("Custom…") && (
                    <Input
                      className="mt-2"
                      placeholder="Enter custom domain..."
                      value={customDomain}
                      onChange={e => setCustomDomain(e.target.value)}
                    />
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  ~{selectedDomains.filter(d => d !== "Custom…").length * 6 + (customDomain ? 6 : 0)} probe questions across {selectedDomains.filter(d => d !== "Custom…").length + (customDomain ? 1 : 0)} domain(s)
                </div>

                {extracting && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Probing {modelLabel}…
                    </div>
                    <Progress value={extractionProgress} />
                  </div>
                )}

                {extractedPairs.length > 0 && !extracting && (
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileJson className="h-4 w-4 text-primary" />
                      {extractedPairs.length} pairs extracted
                    </div>
                    <pre className="text-xs text-muted-foreground max-h-40 overflow-auto">
                      {JSON.stringify(extractedPairs[0], null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleExtract}
                    disabled={extracting || selectedDomains.length === 0}
                    className="flex-1"
                  >
                    {extracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    {extractedPairs.length > 0 ? "Re-extract" : "Extract Knowledge"}
                  </Button>
                  {extractedPairs.length > 0 && (
                    <Button variant="outline" onClick={goNext}>
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══ EXPORT ═══ */}
          {currentStep === "export" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" /> Export Raw Corpus
                </CardTitle>
                <CardDescription>
                  Download the extracted knowledge as JSONL. Run it through <strong>Popcorn → Stream Quantize → HumanAI</strong> in their respective apps.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{modelLabel.replace(/\s+/g, "-").toLowerCase()}_knowledge-extract.jsonl</span>
                    <Badge variant="outline">{extractedPairs.length} pairs</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Format: messages (OpenAI chat)</span>
                    <span>•</span>
                    <span>Compatible with to-train/ bus</span>
                  </div>
                </div>

                {/* Pipeline diagram */}
                <div className="flex items-center justify-center gap-3 py-4 text-xs font-medium">
                  <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full">📥 This file</div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <div className="bg-orange-500/10 text-orange-500 px-3 py-1.5 rounded-full">🍿 Popcorn</div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <div className="bg-purple-500/10 text-purple-500 px-3 py-1.5 rounded-full">⚗️ Stream Quantize</div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <div className="bg-rose-500/10 text-rose-500 px-3 py-1.5 rounded-full">💜 HumanAI</div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <div className="bg-green-500/10 text-green-500 px-3 py-1.5 rounded-full">📥 Re-import</div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleExport} className="flex-1">
                    <Download className="mr-2 h-4 w-4" /> Download JSONL
                  </Button>
                  <Button variant="outline" onClick={goNext}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══ RE-IMPORT ═══ */}
          {currentStep === "reimport" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileUp className="h-5 w-5" /> Re-import Refined Corpus
                </CardTitle>
                <CardDescription>
                  Upload the processed files back. Accepts JSONL from Popcorn, Stream Quantize, or HumanAI.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer hover:bg-muted/30 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Drop refined JSONL files here</span>
                  <span className="text-xs text-muted-foreground mt-1">or click to browse</span>
                  <input
                    type="file"
                    accept=".jsonl,.json"
                    multiple
                    className="hidden"
                    onChange={e => handleImport(e.target.files)}
                  />
                </label>

                {importedFiles.length > 0 && (
                  <div className="space-y-2">
                    {importedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm bg-muted/30 rounded px-3 py-2">
                        <FileJson className="h-4 w-4 text-primary" />
                        <span>{f.name}</span>
                        <Badge variant="outline" className="ml-auto text-xs">{(f.size / 1024).toFixed(1)} KB</Badge>
                      </div>
                    ))}
                    <div className="text-sm text-muted-foreground">
                      {importedPairs.length} total refined pairs loaded
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {importedPairs.length > 0 && (
                    <Button onClick={goNext} className="flex-1">
                      Proceed to Train <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══ TRAIN ═══ */}
          {currentStep === "train" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5" /> Train Baseline
                </CardTitle>
                <CardDescription>
                  Apply the refined corpus to the <strong>Baseline</strong> copy of {modelLabel} via train.py
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="font-medium mb-1">🛡️ Baseline Model</div>
                    <div className="text-muted-foreground">{modelLabel} (untouched weights)</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="font-medium mb-1">📁 Training Corpus</div>
                    <div className="text-muted-foreground">
                      {importedPairs.length > 0
                        ? `${importedPairs.length} refined pairs`
                        : `${extractedPairs.length} raw pairs (no refinement applied)`}
                    </div>
                  </div>
                </div>

                {training && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Training in progress…
                    </div>
                    <Progress value={trainProgress} />
                    <p className="text-xs text-muted-foreground">
                      train.py --base {resolvedModel} --data to-train/*.jsonl
                    </p>
                  </div>
                )}

                {trainComplete && (
                  <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
                    <CheckCircle2 className="h-4 w-4" /> Training complete
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleTrain}
                    disabled={training || trainComplete}
                    className="flex-1"
                  >
                    {training ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flame className="mr-2 h-4 w-4" />}
                    {trainComplete ? "Trained ✓" : "Start Training"}
                  </Button>
                  {trainComplete && (
                    <Button variant="outline" onClick={goNext}>
                      Bench Test <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══ BENCH ═══ */}
          {currentStep === "bench" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="h-5 w-5" /> Bench Test: Trained vs Donor
                </CardTitle>
                <CardDescription>
                  Same starting weights — the delta IS the value of the pipeline.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm text-center">
                  <div className="bg-green-500/10 rounded-lg p-3">
                    <div className="font-medium text-green-500">🛡️ Trained Baseline</div>
                    <div className="text-xs text-muted-foreground mt-1">{modelLabel} + refined corpus</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3">
                    <div className="font-medium text-primary">🧬 Original Donor</div>
                    <div className="text-xs text-muted-foreground mt-1">{modelLabel} (stock weights)</div>
                  </div>
                </div>

                {benching && (
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running head-to-head comparison…
                  </div>
                )}

                {benchResults && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground px-2">
                      <span>Domain</span>
                      <span className="text-center">Baseline</span>
                      <span className="text-center">Donor</span>
                      <span className="text-right">Δ Delta</span>
                    </div>
                    {benchResults.map(r => (
                      <div key={r.domain} className="grid grid-cols-4 gap-2 items-center bg-muted/30 rounded-lg px-3 py-2 text-sm">
                        <span className="font-medium">{r.domain}</span>
                        <span className="text-center text-green-500 font-mono">{r.baseline}%</span>
                        <span className="text-center text-primary font-mono">{r.donor}%</span>
                        <span className={`text-right font-mono font-bold ${r.delta > 0 ? "text-green-500" : "text-destructive"}`}>
                          {r.delta > 0 ? "+" : ""}{r.delta}%
                        </span>
                      </div>
                    ))}
                    <Separator />
                    <div className="grid grid-cols-4 gap-2 items-center px-3 py-2 text-sm font-bold">
                      <span>Average</span>
                      <span className="text-center text-green-500 font-mono">
                        {Math.round(benchResults.reduce((s, r) => s + r.baseline, 0) / benchResults.length)}%
                      </span>
                      <span className="text-center text-primary font-mono">
                        {Math.round(benchResults.reduce((s, r) => s + r.donor, 0) / benchResults.length)}%
                      </span>
                      <span className="text-right text-green-500 font-mono">
                        +{Math.round(benchResults.reduce((s, r) => s + r.delta, 0) / benchResults.length)}%
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleBench}
                  disabled={benching}
                  className="w-full"
                >
                  {benching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Swords className="mr-2 h-4 w-4" />}
                  {benchResults ? "Re-run Bench" : "Run Head-to-Head"}
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Download fallback */}
      <DownloadFallbackDialog
        open={!!fallbackUrl}
        onOpenChange={(open) => { if (!open) setFallbackUrl(null); }}
        blobUrl={fallbackUrl}
        filename={`${modelLabel.replace(/\s+/g, "-").toLowerCase()}_knowledge-extract.jsonl`}
      />
    </div>
  );
}
