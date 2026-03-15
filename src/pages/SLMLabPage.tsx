import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Brain, Plus, Trash2, Globe, Download, Play,
  Star, Check, X, FileText, Sparkles, Database,
  Cpu, RotateCcw, ExternalLink, Code, HelpCircle,
  CheckCircle2, Circle, ArrowRight, ArrowLeft, Package,
  Zap, BookOpen, ChevronRight, Info, ThumbsUp, ThumbsDown,
  FolderDown, Terminal
} from "lucide-react";
import {
  useDatasets, useCreateDataset, useDeleteDataset,
  useSamples, useCreateSample, useUpdateSample, useDeleteSample,
  useScrapeForTraining, useTrainingJobs, useCreateTrainingJob,
  exportDatasetAsJsonl, generateTrainingScript,
  type TrainingDataset, type DatasetSample, type TrainingJob,
} from "@/hooks/useTrainingData";

// ── Helpful tooltip wrapper ──
function HelpTip({ children, tip }: { children: React.ReactNode; tip: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <p>{tip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── Step indicator ──
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: "Create Dataset", icon: Database, tip: "Name your dataset and pick a domain so the AI knows what kind of data to look for." },
    { num: 2, label: "Add Training Data", icon: Globe, tip: "Scrape websites or type your own question/answer pairs. The more data, the smarter your model." },
    { num: 3, label: "Review & Approve", icon: ThumbsUp, tip: "Check your data for quality. Approve the good stuff, reject the bad. Only approved data gets used." },
    { num: 4, label: "Export & Train", icon: Package, tip: "Download everything you need — dataset, training script, and a one-click launcher for your machine." },
  ];

  return (
    <div className="flex items-center justify-center gap-1 px-6 py-4 bg-muted/30 border-b border-border">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = currentStep === step.num;
        const isDone = currentStep > step.num;
        return (
          <div key={step.num} className="flex items-center">
            <HelpTip tip={step.tip}>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                isActive ? "bg-primary/15 border border-primary/40 text-primary" :
                isDone ? "text-forge-emerald" : "text-muted-foreground"
              }`}>
                {isDone ? <CheckCircle2 className="h-4 w-4 text-forge-emerald" /> : 
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                    isActive ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                  }`}>{step.num}</div>
                }
                <span className={`text-xs font-medium hidden sm:inline ${isActive ? "text-primary" : ""}`}>{step.label}</span>
              </div>
            </HelpTip>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground/40 mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Create Dataset ──
function Step1CreateDataset({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("general");
  const [description, setDescription] = useState("");
  const create = useCreateDataset();

  const domains = [
    { value: "general", label: "🌐 General Purpose", desc: "Good for chatbots and assistants" },
    { value: "code", label: "💻 Code / Programming", desc: "Code generation, debugging, documentation" },
    { value: "science", label: "🔬 Science / Research", desc: "Scientific Q&A, paper summaries" },
    { value: "support", label: "🎧 Customer Support", desc: "Help desk, FAQ, troubleshooting" },
    { value: "creative", label: "✍️ Creative Writing", desc: "Stories, poetry, content creation" },
    { value: "legal", label: "⚖️ Legal / Compliance", desc: "Legal questions, policy analysis" },
    { value: "medical", label: "🏥 Medical / Health", desc: "Health Q&A, clinical summaries" },
  ];

  const handleCreate = () => {
    if (!name.trim()) return;
    create.mutate({ name, domain, description }, {
      onSuccess: (ds) => onCreated(ds.id)
    });
  };

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Database className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Create Your Training Dataset</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          A dataset is a collection of question/answer pairs that teach your AI model how to respond. 
          Give it a name and pick what topic it covers.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Dataset Name
              <HelpTip tip="Pick a descriptive name like 'Customer Support Bot' or 'Python Code Helper'. This helps you find it later.">
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </HelpTip>
            </Label>
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g., My Customer Support Bot"
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              What's this model for?
              <HelpTip tip="This helps our AI scraper understand what kind of training data to extract from websites.">
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </HelpTip>
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {domains.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDomain(d.value)}
                  className={`text-left rounded-lg px-4 py-3 border transition-all ${
                    domain === d.value 
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30" 
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <p className="text-sm font-medium">{d.label}</p>
                  <p className="text-xs text-muted-foreground">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Description <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="What will this AI model do? e.g., Answer customer questions about our SaaS product"
              rows={2}
            />
          </div>

          <Button 
            onClick={handleCreate} 
            disabled={create.isPending || !name.trim()} 
            className="w-full gradient-primary text-primary-foreground h-12 text-base"
          >
            {create.isPending ? (
              <><RotateCcw className="h-4 w-4 mr-2 animate-spin" /> Creating…</>
            ) : (
              <>Create Dataset <ArrowRight className="h-4 w-4 ml-2" /></>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Step 2: Add Training Data ──
function Step2AddData({ dataset, onNext }: { dataset: TrainingDataset; onNext: () => void }) {
  const [url, setUrl] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [manualOutput, setManualOutput] = useState("");
  const [mode, setMode] = useState<"scrape" | "manual">("scrape");
  const scrape = useScrapeForTraining();
  const createSample = useCreateSample();
  const { data: samples } = useSamples(dataset.id);

  const handleScrape = () => {
    if (!url.trim()) return;
    scrape.mutate({ url, dataset_id: dataset.id, domain_hint: dataset.domain });
    setUrl("");
  };

  const handleAddManual = () => {
    if (!manualInput.trim() || !manualOutput.trim()) return;
    createSample.mutate(
      { dataset_id: dataset.id, input: manualInput, output: manualOutput, quality_score: 4 },
      { onSuccess: () => { setManualInput(""); setManualOutput(""); } }
    );
  };

  const sampleCount = samples?.length || 0;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Globe className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Add Training Data to "{dataset.name}"</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Feed your model with knowledge! Scrape websites automatically or type your own examples. 
          <strong className="text-foreground"> Aim for at least 50 samples</strong> for decent results.
        </p>
      </div>

      {/* Progress indicator */}
      <Card className="bg-muted/30">
        <CardContent className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
              sampleCount >= 50 ? "bg-forge-emerald/20 text-forge-emerald" : 
              sampleCount >= 20 ? "bg-forge-amber/20 text-forge-amber" : "bg-muted text-muted-foreground"
            }`}>
              {sampleCount}
            </div>
            <div>
              <p className="text-sm font-medium">
                {sampleCount === 0 ? "No samples yet" : 
                 sampleCount < 20 ? "Getting started…" :
                 sampleCount < 50 ? "Good progress!" : "Great dataset! 🎉"}
              </p>
              <p className="text-xs text-muted-foreground">
                {sampleCount < 50 ? `${Math.max(0, 50 - sampleCount)} more recommended` : "Ready to review"}
              </p>
            </div>
          </div>
          <Progress value={Math.min(100, (sampleCount / 50) * 100)} className="w-32 h-2" />
        </CardContent>
      </Card>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button 
          variant={mode === "scrape" ? "default" : "outline"} 
          onClick={() => setMode("scrape")}
          className="flex-1"
        >
          <Globe className="h-4 w-4 mr-2" /> Scrape from Website
        </Button>
        <Button 
          variant={mode === "manual" ? "default" : "outline"} 
          onClick={() => setMode("manual")}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" /> Type Manually
        </Button>
      </div>

      {mode === "scrape" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-forge-amber" /> AI-Powered Web Scraper
            </CardTitle>
            <CardDescription>
              Paste any website URL and our AI will automatically extract question/answer pairs from the content. 
              Works great with documentation pages, FAQ sections, blog posts, and knowledge bases.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://docs.example.com/getting-started"
                className="flex-1 text-base"
                onKeyDown={e => e.key === "Enter" && handleScrape()}
              />
              <HelpTip tip="Click to scrape this URL. Our AI will read the page and create training examples from it automatically.">
                <Button onClick={handleScrape} disabled={scrape.isPending || !url.trim()} className="px-6">
                  {scrape.isPending ? <RotateCcw className="h-4 w-4 animate-spin" /> : <>Scrape <Sparkles className="h-4 w-4 ml-1" /></>}
                </Button>
              </HelpTip>
            </div>
            {scrape.isPending && (
              <div className="bg-primary/5 rounded-lg p-4 space-y-2 animate-pulse">
                <p className="text-sm font-medium">🔍 Scraping & extracting training pairs…</p>
                <p className="text-xs text-muted-foreground">This usually takes 10-30 seconds</p>
                <Progress value={45} className="h-1.5" />
              </div>
            )}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium mb-1.5">💡 Tips for best results:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Documentation pages and FAQ sections work best</li>
                <li>• Each URL typically gives you 3-8 training pairs</li>
                <li>• Scrape multiple pages to build up your dataset quickly</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Your Own Example
            </CardTitle>
            <CardDescription>
              Type a question someone might ask, then type the perfect answer you'd want your AI to give.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                Question / Instruction
                <HelpTip tip="What would a user ask your AI? e.g., 'How do I reset my password?' or 'Write a Python function to sort a list'">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </HelpTip>
              </Label>
              <Textarea value={manualInput} onChange={e => setManualInput(e.target.value)} rows={2} placeholder="e.g., How do I reset my password?" className="text-base" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                Ideal Response
                <HelpTip tip="What's the perfect answer? Be detailed and helpful — this teaches your AI exactly how to respond.">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </HelpTip>
              </Label>
              <Textarea value={manualOutput} onChange={e => setManualOutput(e.target.value)} rows={3} placeholder="e.g., To reset your password, go to Settings > Security > Change Password…" className="text-base" />
            </div>
            <Button onClick={handleAddManual} disabled={createSample.isPending || !manualInput.trim() || !manualOutput.trim()} className="w-full">
              {createSample.isPending ? "Adding…" : "Add This Example"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={sampleCount === 0} size="lg" className="gradient-primary text-primary-foreground">
          Review My Data <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: Review & Approve ──
function Step3Review({ dataset, onNext, onBack }: { dataset: TrainingDataset; onNext: () => void; onBack: () => void }) {
  const { data: samples, isLoading } = useSamples(dataset.id);
  const update = useUpdateSample();
  const remove = useDeleteSample();

  const approved = samples?.filter(s => s.status === "approved") || [];
  const pending = samples?.filter(s => s.status === "pending") || [];
  const rejected = samples?.filter(s => s.status === "rejected") || [];

  const approveAll = () => {
    pending.forEach(s => update.mutate({ id: s.id, dataset_id: dataset.id, status: "approved" }));
    toast.success(`Approved ${pending.length} samples`);
  };

  const rejectLowQuality = () => {
    const low = (samples || []).filter(s => s.quality_score <= 2 && s.status !== "rejected");
    low.forEach(s => update.mutate({ id: s.id, dataset_id: dataset.id, status: "rejected" }));
    toast.success(`Rejected ${low.length} low-quality samples`);
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-64" /></div>;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <ThumbsUp className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Review Your Training Data</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Only <strong className="text-foreground">approved</strong> samples will be included in your training data. 
          Check each one and approve ✓ or reject ✗ it. Better data = smarter model!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-forge-emerald/5 border-forge-emerald/20">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-forge-emerald">{approved.length}</p>
            <p className="text-xs text-muted-foreground">Approved ✓</p>
          </CardContent>
        </Card>
        <Card className="bg-forge-amber/5 border-forge-amber/20">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-forge-amber">{pending.length}</p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="bg-forge-rose/5 border-forge-rose/20">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-forge-rose">{rejected.length}</p>
            <p className="text-xs text-muted-foreground">Rejected ✗</p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk actions */}
      {pending.length > 0 && (
        <div className="flex gap-2">
          <HelpTip tip="Approve all pending samples at once. You can always reject individual ones after.">
            <Button onClick={approveAll} variant="outline" className="flex-1 border-forge-emerald/30 text-forge-emerald hover:bg-forge-emerald/10">
              <Check className="h-4 w-4 mr-2" /> Approve All Pending ({pending.length})
            </Button>
          </HelpTip>
          <HelpTip tip="Auto-reject any samples rated 2 stars or below. Quick way to clean up bad data.">
            <Button onClick={rejectLowQuality} variant="outline" className="flex-1 border-forge-rose/30 text-forge-rose hover:bg-forge-rose/10">
              <X className="h-4 w-4 mr-2" /> Reject Low Quality
            </Button>
          </HelpTip>
        </div>
      )}

      {/* Sample list */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {samples?.map(s => (
            <Card key={s.id} className={`transition-all ${
              s.status === "approved" ? "border-forge-emerald/30 bg-forge-emerald/5" :
              s.status === "rejected" ? "border-forge-rose/30 bg-forge-rose/5 opacity-60" : ""
            }`}>
              <CardContent className="py-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Q: {s.input}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">A: {s.output}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n}
                        className={`h-3.5 w-3.5 cursor-pointer transition-colors ${n <= s.quality_score ? "text-forge-amber fill-forge-amber" : "text-muted-foreground/20 hover:text-forge-amber/50"}`}
                        onClick={() => update.mutate({ id: s.id, dataset_id: dataset.id, quality_score: n })}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {s.source_url && (
                      <a href={s.source_url} target="_blank" rel="noopener" className="text-[10px] text-muted-foreground flex items-center gap-1 hover:text-primary">
                        <ExternalLink className="h-3 w-3" /> source
                      </a>
                    )}
                    <Badge variant="outline" className={`text-[10px] ${
                      s.status === "approved" ? "text-forge-emerald border-forge-emerald/30" :
                      s.status === "rejected" ? "text-forge-rose border-forge-rose/30" : ""
                    }`}>{s.status}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <HelpTip tip="Approve this sample — it will be included in your training data">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-forge-emerald hover:bg-forge-emerald/10"
                        onClick={() => update.mutate({ id: s.id, dataset_id: dataset.id, status: "approved" })}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                    </HelpTip>
                    <HelpTip tip="Reject this sample — it won't be used for training">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-forge-rose hover:bg-forge-rose/10"
                        onClick={() => update.mutate({ id: s.id, dataset_id: dataset.id, status: "rejected" })}>
                        <X className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </HelpTip>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove.mutate({ id: s.id, dataset_id: dataset.id })}>
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" /> Add More Data</Button>
        <Button onClick={onNext} disabled={approved.length === 0} size="lg" className="gradient-primary text-primary-foreground">
          Export & Train <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 4: Export & Train ──
function Step4Export({ dataset, onBack }: { dataset: TrainingDataset; onBack: () => void }) {
  const { data: samples } = useSamples(dataset.id);
  const [baseModel, setBaseModel] = useState("phi-3-mini");
  const [epochs, setEpochs] = useState(3);
  const [lr, setLr] = useState(0.0002);
  const [batchSize, setBatchSize] = useState(4);
  const [loraRank, setLoraRank] = useState(16);
  const createJob = useCreateTrainingJob();

  const approvedSamples = samples?.filter(s => s.status === "approved") || [];

  const models = [
    { value: "phi-3-mini", label: "Phi-3 Mini (3.8B)", desc: "Great starter model, runs on most GPUs", vram: "~6 GB" },
    { value: "llama-3.2-1b", label: "Llama 3.2 (1B)", desc: "Smallest & fastest, works on laptops", vram: "~3 GB" },
    { value: "llama-3.2-3b", label: "Llama 3.2 (3B)", desc: "Good balance of speed & quality", vram: "~5 GB" },
    { value: "gemma-2-2b", label: "Gemma 2 (2B)", desc: "Google's compact model, strong reasoning", vram: "~4 GB" },
    { value: "qwen2.5-1.5b", label: "Qwen 2.5 (1.5B)", desc: "Excellent for code tasks", vram: "~3 GB" },
    { value: "mistral-7b", label: "Mistral (7B)", desc: "Most capable, needs more GPU memory", vram: "~10 GB" },
  ];

  const downloadTrainingKit = () => {
    if (approvedSamples.length === 0) return;

    const jobName = `${dataset.name.toLowerCase().replace(/\s+/g, "-")}-training`;
    const job: TrainingJob = {
      id: "", user_id: "", dataset_id: dataset.id,
      name: jobName, base_model: baseModel, method: "lora",
      hyperparameters: { epochs, learning_rate: lr, batch_size: batchSize, lora_rank: loraRank },
      status: "draft", metrics: {}, created_at: "", updated_at: ""
    };

    // Generate all files
    const jsonlLines = approvedSamples.map(s => JSON.stringify({
      messages: [
        { role: "user", content: s.input },
        { role: "assistant", content: s.output },
      ]
    }));
    const datasetContent = jsonlLines.join("\n");
    const scriptContent = generateTrainingScript(job, dataset);
    
    const readmeContent = `# 🧠 SoupyForge Training Kit
## ${dataset.name}

### What's in this folder?
- **dataset.jsonl** — Your curated training data (${approvedSamples.length} examples)
- **train.py** — Python training script (pre-configured for ${baseModel})
- **run.sh** / **run.bat** — One-click launcher scripts

### Quick Start (3 easy steps!)

#### Step 1: Install Python requirements
\`\`\`bash
pip install unsloth transformers datasets torch trl
\`\`\`

#### Step 2: Double-click the launcher
- **Mac/Linux**: Double-click \`run.sh\` (or run \`bash run.sh\` in terminal)
- **Windows**: Double-click \`run.bat\`

#### Step 3: Wait for training to finish
The script will automatically:
- Download the base model (${baseModel})
- Fine-tune it with your data
- Save the trained model in \`./output/\`

### Hardware Requirements
- **GPU**: NVIDIA with ${models.find(m => m.value === baseModel)?.vram || "4+ GB"} VRAM
- **RAM**: 16 GB recommended
- **Disk**: ~10 GB free space

### Settings Used
- Base Model: ${baseModel}
- Method: LoRA (Low-Rank Adaptation)
- Epochs: ${epochs}
- Learning Rate: ${lr}
- Batch Size: ${batchSize}
- LoRA Rank: ${loraRank}

---
Generated by SoupyForge SLM Lab • ${new Date().toLocaleDateString()}
`;

    const runSh = `#!/bin/bash
echo "🧠 SoupyForge Local Trainer"
echo "=========================="
echo ""
echo "Checking Python..."
python3 --version || python --version || { echo "❌ Python not found! Install Python 3.10+ first."; exit 1; }
echo ""
echo "Installing requirements..."
pip install unsloth transformers datasets torch trl 2>/dev/null || pip3 install unsloth transformers datasets torch trl
echo ""
echo "🔥 Starting training..."
python3 train.py || python train.py
echo ""
echo "✅ Done! Your trained model is in the ./output/ folder"
read -p "Press Enter to close..."
`;

    const runBat = `@echo off
echo 🧠 SoupyForge Local Trainer
echo ==========================
echo.
echo Checking Python...
python --version || (echo ❌ Python not found! Install Python 3.10+ first. && pause && exit)
echo.
echo Installing requirements...
pip install unsloth transformers datasets torch trl
echo.
echo 🔥 Starting training...
python train.py
echo.
echo ✅ Done! Your trained model is in the .\\output\\ folder
pause
`;

    // Download each file
    const files = [
      { name: "dataset.jsonl", content: datasetContent, type: "application/jsonl" },
      { name: "train.py", content: scriptContent, type: "text/x-python" },
      { name: "README.md", content: readmeContent, type: "text/markdown" },
      { name: "run.sh", content: runSh, type: "application/x-sh" },
      { name: "run.bat", content: runBat, type: "application/x-bat" },
    ];

    files.forEach((f, i) => {
      setTimeout(() => {
        const blob = new Blob([f.content], { type: f.type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = f.name;
        a.click();
        URL.revokeObjectURL(url);
      }, i * 300); // Stagger downloads
    });

    // Also save job to DB
    createJob.mutate({
      dataset_id: dataset.id, name: jobName, base_model: baseModel, method: "lora",
      hyperparameters: { epochs, learning_rate: lr, batch_size: batchSize, lora_rank: loraRank }
    });

    toast.success("Training kit downloading! Check your downloads folder 📂");
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Package className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Download Your Training Kit</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Choose a base model and configure settings. Then hit the big button — you'll get everything you need 
          to train on your own computer. <strong className="text-foreground">No coding required!</strong>
        </p>
      </div>

      {/* Dataset summary */}
      <Card className="bg-forge-emerald/5 border-forge-emerald/20">
        <CardContent className="py-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-forge-emerald shrink-0" />
          <div>
            <p className="text-sm font-medium">{approvedSamples.length} approved training examples ready</p>
            <p className="text-xs text-muted-foreground">from "{dataset.name}" dataset</p>
          </div>
        </CardContent>
      </Card>

      {/* Model selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-base">
          Pick a Base Model
          <HelpTip tip="This is the pre-trained AI model that will be fine-tuned with your data. Smaller models train faster and need less GPU memory.">
            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
          </HelpTip>
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {models.map(m => (
            <button
              key={m.value}
              onClick={() => setBaseModel(m.value)}
              className={`text-left rounded-lg px-4 py-3 border transition-all ${
                baseModel === m.value 
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30" 
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{m.label}</p>
                <Badge variant="outline" className="text-[10px]">{m.vram}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced settings (collapsible feel via a simple toggle) */}
      <AdvancedSettings epochs={epochs} setEpochs={setEpochs} lr={lr} setLr={setLr} batchSize={batchSize} setBatchSize={setBatchSize} loraRank={loraRank} setLoraRank={setLoraRank} />

      {/* Download button */}
      <Button 
        onClick={downloadTrainingKit} 
        disabled={approvedSamples.length === 0}
        className="w-full h-14 text-lg gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
      >
        <FolderDown className="h-5 w-5 mr-2" /> Download Training Kit
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Downloads 5 files: dataset, training script, README with instructions, and launcher scripts for Mac/Windows
      </p>

      {/* What happens next */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" /> What happens after downloading?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { step: "1", title: "Put all files in one folder", desc: "Create a folder on your computer and move all 5 downloaded files into it." },
            { step: "2", title: "Install Python (if you haven't)", desc: "Download Python 3.10+ from python.org. The installer does everything for you." },
            { step: "3", title: "Double-click the launcher", desc: "Mac/Linux: run.sh • Windows: run.bat — It installs everything and starts training automatically." },
            { step: "4", title: "Wait & enjoy", desc: "Training takes 10 minutes to a few hours depending on your GPU and data size. Your model saves to the output/ folder." },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{s.step}</div>
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-start">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Review</Button>
      </div>
    </div>
  );
}

// ── Advanced Settings (collapsed by default) ──
function AdvancedSettings({ epochs, setEpochs, lr, setLr, batchSize, setBatchSize, loraRank, setLoraRank }: {
  epochs: number; setEpochs: (v: number) => void;
  lr: number; setLr: (v: number) => void;
  batchSize: number; setBatchSize: (v: number) => void;
  loraRank: number; setLoraRank: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
        Advanced Settings (optional — defaults work great)
      </button>
      {open && (
        <Card className="mt-2">
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs flex items-center gap-1">
                  Epochs
                  <HelpTip tip="How many times the model reads through all your data. More epochs = more learning, but too many can cause overfitting. 3 is usually good.">
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </HelpTip>
                </Label>
                <span className="text-xs font-mono text-muted-foreground">{epochs}</span>
              </div>
              <Slider value={[epochs]} onValueChange={([v]) => setEpochs(v)} min={1} max={10} step={1} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs flex items-center gap-1">
                  Learning Rate
                  <HelpTip tip="How fast the model learns. Too high = unstable, too low = slow. 0.0002 is a safe default.">
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </HelpTip>
                </Label>
                <span className="text-xs font-mono text-muted-foreground">{lr}</span>
              </div>
              <Slider value={[lr]} onValueChange={([v]) => setLr(v)} min={0.00001} max={0.001} step={0.00001} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs flex items-center gap-1">
                  Batch Size
                  <HelpTip tip="How many examples the model processes at once. Higher = faster but uses more GPU memory. 4 is safe for most GPUs.">
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </HelpTip>
                </Label>
                <span className="text-xs font-mono text-muted-foreground">{batchSize}</span>
              </div>
              <Slider value={[batchSize]} onValueChange={([v]) => setBatchSize(v)} min={1} max={16} step={1} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs flex items-center gap-1">
                  LoRA Rank
                  <HelpTip tip="Controls how much the model can learn. Higher rank = more capacity but slower training. 16 is a good balance.">
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </HelpTip>
                </Label>
                <span className="text-xs font-mono text-muted-foreground">{loraRank}</span>
              </div>
              <Slider value={[loraRank]} onValueChange={([v]) => setLoraRank(v)} min={4} max={64} step={4} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Main Page ──
export default function SLMLabPage() {
  const { data: datasets, isLoading: dsLoading } = useDatasets();
  const [step, setStep] = useState(1);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);

  const activeDataset = datasets?.find(d => d.id === activeDatasetId);

  // If they have existing datasets, show a dataset picker
  const [showPicker, setShowPicker] = useState(true);

  const handleDatasetCreated = (id: string) => {
    setActiveDatasetId(id);
    setStep(2);
    setShowPicker(false);
  };

  const handleSelectExisting = (id: string) => {
    setActiveDatasetId(id);
    setStep(2);
    setShowPicker(false);
  };

  if (dsLoading) return <div className="p-8 space-y-4"><Skeleton className="h-16 w-64 mx-auto" /><Skeleton className="h-[400px] max-w-lg mx-auto" /></div>;

  // Landing: pick existing or create new
  if (showPicker && (!activeDatasetId || step === 1)) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
        <div className="flex items-center justify-center gap-3 px-6 py-4 border-b border-border">
          <Brain className="h-5 w-5 text-forge-amber" />
          <h1 className="text-lg font-bold">SLM Lab</h1>
          <Badge variant="outline" className="text-[10px]">Train Your Own AI</Badge>
        </div>

        <div className="flex-1 overflow-auto">
          {datasets && datasets.length > 0 ? (
            <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
              <div className="text-center space-y-2">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Welcome back! 👋</h2>
                <p className="text-sm text-muted-foreground">Continue working on a dataset or start fresh.</p>
              </div>

              <div className="space-y-2">
                {datasets.map(ds => (
                  <button
                    key={ds.id}
                    onClick={() => handleSelectExisting(ds.id)}
                    className="w-full text-left rounded-xl px-5 py-4 border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-medium group-hover:text-primary transition-colors">{ds.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]">{ds.domain}</Badge>
                          <span className="text-xs text-muted-foreground">{ds.sample_count} samples</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))}
              </div>

              <Separator />

              <Button 
                onClick={() => { setShowPicker(false); setStep(1); }} 
                variant="outline" 
                className="w-full h-12"
              >
                <Plus className="h-4 w-4 mr-2" /> Create New Dataset
              </Button>
            </div>
          ) : (
            <Step1CreateDataset onCreated={handleDatasetCreated} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-forge-amber" />
          <h1 className="text-lg font-bold">SLM Lab</h1>
          {activeDataset && <Badge variant="outline" className="text-[10px]">{activeDataset.name}</Badge>}
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setShowPicker(true); setActiveDatasetId(null); setStep(1); }}>
          <ArrowLeft className="h-4 w-4 mr-1" /> All Datasets
        </Button>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={step} />

      {/* Step content */}
      <div className="flex-1 overflow-auto">
        {step === 1 && <Step1CreateDataset onCreated={handleDatasetCreated} />}
        {step === 2 && activeDataset && <Step2AddData dataset={activeDataset} onNext={() => setStep(3)} />}
        {step === 3 && activeDataset && <Step3Review dataset={activeDataset} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && activeDataset && <Step4Export dataset={activeDataset} onBack={() => setStep(3)} />}
      </div>
    </div>
  );
}
