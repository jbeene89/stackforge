import { useState, useMemo, useRef, useEffect } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Brain, Plus, Trash2, Globe, Download, Play,
  Star, Check, X, FileText, Sparkles, Database,
  Cpu, RotateCcw, ExternalLink, Code, HelpCircle,
  CheckCircle2, Circle, ArrowRight, ArrowLeft, Package,
  Zap, BookOpen, ChevronRight, ChevronDown, Info, ThumbsUp, ThumbsDown,
  FolderDown, Terminal, MessageSquare, Send, User, Bot, Eye,
  Shield, Lightbulb, Heart, Layers, Wrench
} from "lucide-react";
import {
  useDatasets, useCreateDataset, useDeleteDataset,
  useSamples, useCreateSample, useUpdateSample, useDeleteSample,
  useScrapeForTraining, useTrainingJobs, useCreateTrainingJob,
  useStartInterview, useInterviewRespond, useFinishInterview,
  exportDatasetAsJsonl, generateTrainingScript,
  type TrainingDataset, type DatasetSample, type TrainingJob,
} from "@/hooks/useTrainingData";

// ── Perspective config ──
const PERSPECTIVE_CONFIG = {
  builder: { label: "BUILDER", icon: Wrench, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  red_team: { label: "RED TEAM", icon: Shield, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  systems: { label: "SYSTEMS", icon: Layers, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  frame_breaker: { label: "FRAME BREAKER", icon: Lightbulb, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  empath: { label: "EMPATH", icon: Heart, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  synthesis: { label: "SYNTHESIS", icon: Sparkles, color: "text-foreground", bg: "bg-white/5", border: "border-white/20" },
} as const;

// ── Helpful tooltip wrapper ──
function HelpTip({ children, tip }: { children: React.ReactNode; tip: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs"><p>{tip}</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── Step indicator ──
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 0, label: "Capture Your Mind", icon: MessageSquare, tip: "An AI interviews you to extract your unique expertise into training data." },
    { num: 1, label: "Create Dataset", icon: Database, tip: "Name your dataset and pick a domain." },
    { num: 2, label: "Add Data", icon: Globe, tip: "Scrape websites or type your own pairs." },
    { num: 3, label: "Review", icon: ThumbsUp, tip: "Check data quality and approve samples." },
    { num: 4, label: "Export", icon: Package, tip: "Download your complete training kit." },
  ];

  return (
    <div className="flex items-center justify-center gap-0.5 px-4 py-3 bg-muted/30 border-b border-border overflow-x-auto">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = currentStep === step.num;
        const isDone = currentStep > step.num;
        return (
          <div key={step.num} className="flex items-center">
            <HelpTip tip={step.tip}>
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
                isActive ? "bg-primary/15 border border-primary/40 text-primary" :
                isDone ? "text-forge-emerald" : "text-muted-foreground"
              }`}>
                {isDone ? <CheckCircle2 className="h-3.5 w-3.5 text-forge-emerald" /> : 
                  <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold border ${
                    isActive ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                  }`}>{step.num}</div>
                }
                <span className={`text-[11px] font-medium hidden md:inline ${isActive ? "text-primary" : ""}`}>{step.label}</span>
              </div>
            </HelpTip>
            {i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/30 mx-0.5" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Perspective Card (collapsible) ──
function PerspectiveCard({ perspKey, content, defaultOpen = false }: { perspKey: keyof typeof PERSPECTIVE_CONFIG; content: string; defaultOpen?: boolean }) {
  const config = PERSPECTIVE_CONFIG[perspKey];
  const Icon = config.icon;
  if (!content) return null;

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <Card className={`${config.border} ${config.bg} border`}>
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-2.5 flex items-center justify-between hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${config.color}`} />
              <span className={`text-xs font-bold tracking-wide ${config.color}`}>{config.label}</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ── Step 0: Founder Interview ──
function Step0Interview({ datasetId, domain, onDone, onSkip }: { datasetId: string; domain: string; onDone: () => void; onSkip: () => void }) {
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [exchangeCount, setExchangeCount] = useState(0);
  const [pairsCreated, setPairsCreated] = useState(0);
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState<{ pairs_extracted: number; syntheses: Array<{ topic: string; insight: string }> } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const startInterview = useStartInterview();
  const respond = useInterviewRespond();
  const finish = useFinishInterview();

  useEffect(() => {
    if (!interviewId) {
      startInterview.mutate({ dataset_id: datasetId }, {
        onSuccess: (data) => {
          setInterviewId(data.interview_id);
          setTranscript([{ role: "assistant", content: data.question }]);
        }
      });
    }
  }, [datasetId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  const handleSend = () => {
    if (!input.trim() || !interviewId || respond.isPending) return;
    const msg = input.trim();
    setInput("");
    const newTranscript = [...transcript, { role: "user", content: msg }];
    setTranscript(newTranscript);
    setExchangeCount(prev => prev + 1);

    respond.mutate({
      interview_id: interviewId,
      dataset_id: datasetId,
      message: msg,
      transcript: transcript,
      domain_hint: domain,
    }, {
      onSuccess: (data) => {
        setTranscript(prev => [...prev, { role: "assistant", content: data.follow_up }]);
        if (data.pair_created) setPairsCreated(prev => prev + 1);
      }
    });
  };

  const handleFinish = () => {
    if (!interviewId) return;
    finish.mutate({ interview_id: interviewId, dataset_id: datasetId }, {
      onSuccess: (data) => {
        setFinished(true);
        setSummary(data);
      }
    });
  };

  // Summary screen
  if (finished && summary) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 animate-fade-in">
        <div className="max-w-lg space-y-6 text-center">
          <div className="h-20 w-20 rounded-full bg-forge-emerald/10 flex items-center justify-center mx-auto">
            <Brain className="h-10 w-10 text-forge-emerald" />
          </div>
          <h2 className="text-2xl font-bold">Your Mind Has Been Captured 🧠</h2>
          <p className="text-muted-foreground">
            We extracted <strong className="text-foreground">{summary.pairs_extracted} training pairs</strong> from your knowledge.
            Here's what your model learned about how you think:
          </p>
          
          <div className="space-y-3 text-left">
            {summary.syntheses.map((s, i) => (
              <Card key={i} className="bg-white/5 border-white/20">
                <CardContent className="py-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{s.topic}</p>
                  <p className="text-sm">{s.insight}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={onDone} size="lg" className="gradient-primary text-primary-foreground">
            Continue to Dataset <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Chat interface
  return (
    <div className="h-full flex flex-col">
      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-forge-amber" />
          <span className="text-sm font-medium">Capture Your Mind</span>
          {pairsCreated > 0 && (
            <Badge variant="outline" className="text-[10px] text-forge-emerald border-forge-emerald/30">
              {pairsCreated} pairs captured
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={onSkip}>
            Skip Interview
          </Button>
          {exchangeCount >= 3 && (
            <Button variant="outline" size="sm" onClick={handleFinish} disabled={finish.isPending}>
              {finish.isPending ? <RotateCcw className="h-3 w-3 animate-spin mr-1" /> : null}
              I'm done for now
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-6 space-y-4">
        {transcript.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            {msg.role === "assistant" && (
              <div className="h-8 w-8 rounded-full bg-forge-amber/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-4 w-4 text-forge-amber" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.role === "user" 
                ? "bg-primary text-primary-foreground rounded-br-md" 
                : "bg-muted/50 rounded-bl-md"
            }`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
            {msg.role === "user" && (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
        ))}
        {respond.isPending && (
          <div className="flex gap-3 animate-fade-in">
            <div className="h-8 w-8 rounded-full bg-forge-amber/10 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-forge-amber" />
            </div>
            <div className="bg-muted/50 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border/50 p-4">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Share your experience..."
            className="flex-1 resize-none min-h-[48px] max-h-[120px] text-base"
            rows={1}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button onClick={handleSend} disabled={!input.trim() || respond.isPending} size="icon" className="h-12 w-12 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Each response silently generates a five-perspective training pair in the background
        </p>
      </div>
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
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Dataset Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., My Customer Support Bot" className="text-base" />
          </div>
          <div className="space-y-2">
            <Label>What's this model for?</Label>
            <div className="grid grid-cols-1 gap-2">
              {domains.map(d => (
                <button key={d.value} onClick={() => setDomain(d.value)}
                  className={`text-left rounded-lg px-4 py-3 border transition-all ${
                    domain === d.value ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}>
                  <p className="text-sm font-medium">{d.label}</p>
                  <p className="text-xs text-muted-foreground">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What will this AI model do?" rows={2} />
          </div>
          <Button onClick={handleCreate} disabled={create.isPending || !name.trim()} className="w-full gradient-primary text-primary-foreground h-12 text-base">
            {create.isPending ? <><RotateCcw className="h-4 w-4 mr-2 animate-spin" /> Creating…</> : <>Create Dataset <ArrowRight className="h-4 w-4 ml-2" /></>}
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
          Scrape websites with the <strong className="text-foreground">Five Perspective Pipeline</strong> — every URL gets analyzed by 5 AI perspectives simultaneously.
        </p>
      </div>

      {/* Progress */}
      <Card className="bg-muted/30">
        <CardContent className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
              sampleCount >= 50 ? "bg-forge-emerald/20 text-forge-emerald" : sampleCount >= 20 ? "bg-forge-amber/20 text-forge-amber" : "bg-muted text-muted-foreground"
            }`}>{sampleCount}</div>
            <div>
              <p className="text-sm font-medium">{sampleCount === 0 ? "No samples yet" : sampleCount < 20 ? "Getting started…" : sampleCount < 50 ? "Good progress!" : "Great dataset! 🎉"}</p>
              <p className="text-xs text-muted-foreground">{sampleCount < 50 ? `${Math.max(0, 50 - sampleCount)} more recommended` : "Ready to review"}</p>
            </div>
          </div>
          <Progress value={Math.min(100, (sampleCount / 50) * 100)} className="w-32 h-2" />
        </CardContent>
      </Card>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button variant={mode === "scrape" ? "default" : "outline"} onClick={() => setMode("scrape")} className="flex-1">
          <Globe className="h-4 w-4 mr-2" /> 5-Perspective Scrape
        </Button>
        <Button variant={mode === "manual" ? "default" : "outline"} onClick={() => setMode("manual")} className="flex-1">
          <Plus className="h-4 w-4 mr-2" /> Type Manually
        </Button>
      </div>

      {mode === "scrape" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-forge-amber" /> Five Perspective Pipeline Scraper
            </CardTitle>
            <CardDescription>
              Each URL is analyzed by 5 AI perspectives (Builder, Red Team, Systems, Frame Breaker, Empath) then synthesized into training pairs with emergent insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://docs.example.com/getting-started" className="flex-1 text-base"
                onKeyDown={e => e.key === "Enter" && handleScrape()} />
              <Button onClick={handleScrape} disabled={scrape.isPending || !url.trim()} className="px-6">
                {scrape.isPending ? <RotateCcw className="h-4 w-4 animate-spin" /> : <>Scrape <Sparkles className="h-4 w-4 ml-1" /></>}
              </Button>
            </div>
            {scrape.isPending && (
              <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">🔍 Running Five Perspective Pipeline…</p>
                <div className="grid grid-cols-5 gap-1">
                  {(["builder", "red_team", "systems", "frame_breaker", "empath"] as const).map(k => {
                    const cfg = PERSPECTIVE_CONFIG[k];
                    const Icon = cfg.icon;
                    return (
                      <div key={k} className={`${cfg.bg} rounded-md px-2 py-1.5 flex items-center justify-center gap-1 animate-pulse`}>
                        <Icon className={`h-3 w-3 ${cfg.color}`} />
                        <span className={`text-[9px] font-bold ${cfg.color}`}>{cfg.label.split(" ")[0]}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">5 AIs analyzing simultaneously → synthesis → training pairs</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" /> Add Your Own Example</CardTitle>
            <CardDescription>Type a question and the perfect answer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Question / Instruction</Label>
              <Textarea value={manualInput} onChange={e => setManualInput(e.target.value)} rows={2} placeholder="e.g., How do I reset my password?" className="text-base" />
            </div>
            <div className="space-y-1.5">
              <Label>Ideal Response</Label>
              <Textarea value={manualOutput} onChange={e => setManualOutput(e.target.value)} rows={3} placeholder="e.g., To reset your password..." className="text-base" />
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
          Tap any sample to see all <strong className="text-foreground">five perspectives</strong> and the synthesis.
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
            <p className="text-xs text-muted-foreground">Pending</p>
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
          <Button onClick={approveAll} variant="outline" className="flex-1 border-forge-emerald/30 text-forge-emerald hover:bg-forge-emerald/10">
            <Check className="h-4 w-4 mr-2" /> Approve All ({pending.length})
          </Button>
          <Button onClick={rejectLowQuality} variant="outline" className="flex-1 border-forge-rose/30 text-forge-rose hover:bg-forge-rose/10">
            <X className="h-4 w-4 mr-2" /> Reject Low Quality
          </Button>
        </div>
      )}

      {/* Sample list */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-2">
          {samples?.map(s => {
            const hasPerspectives = !!(s.builder || s.red_team || s.systems || s.frame_breaker || s.empath || s.synthesis);
            const isExpanded = expandedId === s.id;

            return (
              <Card key={s.id} className={`transition-all ${
                s.status === "approved" ? "border-forge-emerald/30 bg-forge-emerald/5" :
                s.status === "rejected" ? "border-forge-rose/30 bg-forge-rose/5 opacity-60" : ""
              }`}>
                <CardContent className="py-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Q: {s.input}</p>
                        {hasPerspectives && (
                          <Badge variant="outline" className="text-[9px] shrink-0">5P</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">A: {s.output}</p>
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

                  {/* Expanded: show perspectives */}
                  {isExpanded && hasPerspectives && (
                    <div className="space-y-1.5 pt-2 border-t border-border/50 animate-fade-in">
                      {/* Synthesis always expanded */}
                      {s.synthesis && (
                        <Card className="bg-white/5 border-white/20 border">
                          <div className="px-4 py-2.5 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-foreground" />
                            <span className="text-xs font-bold tracking-wide">SYNTHESIS</span>
                          </div>
                          <div className="px-4 pb-3">
                            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{s.synthesis}</p>
                          </div>
                        </Card>
                      )}
                      <PerspectiveCard perspKey="builder" content={s.builder} />
                      <PerspectiveCard perspKey="red_team" content={s.red_team} />
                      <PerspectiveCard perspKey="systems" content={s.systems} />
                      <PerspectiveCard perspKey="frame_breaker" content={s.frame_breaker} />
                      <PerspectiveCard perspKey="empath" content={s.empath} />
                    </div>
                  )}

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
                      {hasPerspectives && (
                        <button onClick={() => setExpandedId(isExpanded ? null : s.id)} className="text-[10px] text-primary flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {isExpanded ? "hide" : "view"} perspectives
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-forge-emerald hover:bg-forge-emerald/10"
                        onClick={() => update.mutate({ id: s.id, dataset_id: dataset.id, status: "approved" })}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-forge-rose hover:bg-forge-rose/10"
                        onClick={() => update.mutate({ id: s.id, dataset_id: dataset.id, status: "rejected" })}>
                        <X className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove.mutate({ id: s.id, dataset_id: dataset.id })}>
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
  const perspectiveSamples = approvedSamples.filter(s => s.builder || s.synthesis);

  const models = [
    { value: "phi-3-mini", label: "Phi-3 Mini (3.8B)", desc: "Great starter model", vram: "~6 GB" },
    { value: "llama-3.2-1b", label: "Llama 3.2 (1B)", desc: "Smallest & fastest", vram: "~3 GB" },
    { value: "llama-3.2-3b", label: "Llama 3.2 (3B)", desc: "Good balance", vram: "~5 GB" },
    { value: "gemma-2-2b", label: "Gemma 2 (2B)", desc: "Strong reasoning", vram: "~4 GB" },
    { value: "qwen2.5-1.5b", label: "Qwen 2.5 (1.5B)", desc: "Excellent for code", vram: "~3 GB" },
    { value: "mistral-7b", label: "Mistral (7B)", desc: "Most capable", vram: "~10 GB" },
  ];

  const downloadTrainingKit = () => {
    if (approvedSamples.length === 0) return;
    const jobName = `${dataset.name.toLowerCase().replace(/\s+/g, "-")}-training`;
    const job: TrainingJob = {
      id: "", user_id: "", dataset_id: dataset.id, name: jobName, base_model: baseModel, method: "lora",
      hyperparameters: { epochs, learning_rate: lr, batch_size: batchSize, lora_rank: loraRank },
      status: "draft", metrics: {}, created_at: "", updated_at: ""
    };

    exportDatasetAsJsonl(approvedSamples, dataset.name);
    
    const scriptContent = generateTrainingScript(job, dataset);
    const readmeContent = `# 🧠 SoupyForge Training Kit — Five Perspective Pipeline
## ${dataset.name}

### What's in this folder?
- **dataset.jsonl** — ${approvedSamples.length} curated examples with perspective tokens (<BUILDER>, <RED_TEAM>, etc.)
- **train.py** — Pre-configured for ${baseModel} with special perspective tokens registered
- **run.sh** / **run.bat** — One-click launchers

### Perspective Tokens
Your training data includes cognitive mode switch tokens:
- \`<BUILDER>\` — Practical, buildable knowledge
- \`<RED_TEAM>\` — Adversarial analysis, edge cases
- \`<SYSTEMS>\` — Hidden patterns, second-order effects
- \`<FRAME_BREAKER>\` — Paradigm challenges
- \`<EMPATH>\` — Human element, emotional reality
- \`<SYNTHESIS>\` — Emergent insights

### Quick Start
1. Put all files in one folder
2. Double-click \`run.sh\` (Mac/Linux) or \`run.bat\` (Windows)
3. Wait for training to finish — model saves to \`./output/\`

---
Generated by SoupyForge SLM Lab • ${new Date().toLocaleDateString()}
`;

    const runSh = `#!/bin/bash
echo "🧠 SoupyForge Local Trainer — Five Perspective Pipeline"
echo "========================================================"
python3 --version || python --version || { echo "❌ Python not found!"; exit 1; }
echo "Installing requirements..."
pip install unsloth transformers datasets torch trl 2>/dev/null || pip3 install unsloth transformers datasets torch trl
echo "🔥 Starting training..."
python3 train.py || python train.py
echo "✅ Done! Model in ./output/"
read -p "Press Enter to close..."
`;

    const runBat = `@echo off
echo SoupyForge Local Trainer — Five Perspective Pipeline
echo ========================================================
python --version || (echo Python not found! && pause && exit)
echo Installing requirements...
pip install unsloth transformers datasets torch trl
echo Starting training...
python train.py
echo Done! Model in .\\output\\
pause
`;

    const files = [
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
        a.href = url; a.download = f.name; a.click();
        URL.revokeObjectURL(url);
      }, (i + 1) * 300);
    });

    createJob.mutate({ dataset_id: dataset.id, name: jobName, base_model: baseModel, method: "lora",
      hyperparameters: { epochs, learning_rate: lr, batch_size: batchSize, lora_rank: loraRank } });

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
          Your dataset includes <strong className="text-foreground">perspective tokens</strong> that teach your model to think through multiple lenses.
        </p>
      </div>

      <Card className="bg-forge-emerald/5 border-forge-emerald/20">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-forge-emerald shrink-0" />
            <div>
              <p className="text-sm font-medium">{approvedSamples.length} approved samples ready</p>
              <p className="text-xs text-muted-foreground">{perspectiveSamples.length} with five-perspective analysis</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model selection */}
      <div className="space-y-3">
        <Label className="text-base">Pick a Base Model</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {models.map(m => (
            <button key={m.value} onClick={() => setBaseModel(m.value)}
              className={`text-left rounded-lg px-4 py-3 border transition-all ${
                baseModel === m.value ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-border hover:border-primary/30"
              }`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{m.label}</p>
                <Badge variant="outline" className="text-[10px]">{m.vram}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <AdvancedSettings epochs={epochs} setEpochs={setEpochs} lr={lr} setLr={setLr} batchSize={batchSize} setBatchSize={setBatchSize} loraRank={loraRank} setLoraRank={setLoraRank} />

      <Button onClick={downloadTrainingKit} disabled={approvedSamples.length === 0}
        className="w-full h-14 text-lg gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow">
        <FolderDown className="h-5 w-5 mr-2" /> Download Training Kit
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Downloads dataset with perspective tokens, training script, README, and launcher scripts
      </p>

      <div className="flex justify-start">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Review</Button>
      </div>
    </div>
  );
}

// ── Advanced Settings ──
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
        Advanced Settings (defaults work great)
      </button>
      {open && (
        <Card className="mt-2">
          <CardContent className="pt-4 space-y-4">
            {[
              { label: "Epochs", value: epochs, set: setEpochs, min: 1, max: 10, step: 1 },
              { label: "Learning Rate", value: lr, set: setLr, min: 0.00001, max: 0.001, step: 0.00001 },
              { label: "Batch Size", value: batchSize, set: setBatchSize, min: 1, max: 16, step: 1 },
              { label: "LoRA Rank", value: loraRank, set: setLoraRank, min: 4, max: 64, step: 4 },
            ].map(s => (
              <div key={s.label} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">{s.label}</Label>
                  <span className="text-xs font-mono text-muted-foreground">{s.value}</span>
                </div>
                <Slider value={[s.value]} onValueChange={([v]) => s.set(v)} min={s.min} max={s.max} step={s.step} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Main Page ──
export default function SLMLabPage() {
  const { data: datasets, isLoading: dsLoading } = useDatasets();
  const [step, setStep] = useState<number>(-1); // -1 = landing
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [showInterview, setShowInterview] = useState(false);

  const activeDataset = datasets?.find(d => d.id === activeDatasetId);

  const handleDatasetCreated = (id: string) => {
    setActiveDatasetId(id);
    setShowInterview(true);
    setStep(0);
  };

  const handleSelectExisting = (id: string) => {
    setActiveDatasetId(id);
    setStep(2);
  };

  if (dsLoading) return <div className="p-8 space-y-4"><Skeleton className="h-16 w-64 mx-auto" /><Skeleton className="h-[400px] max-w-lg mx-auto" /></div>;

  // Interview mode — full screen chat
  if (showInterview && activeDatasetId && step === 0) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
        <Step0Interview
          datasetId={activeDatasetId}
          domain={activeDataset?.domain || "general"}
          onDone={() => { setShowInterview(false); setStep(2); }}
          onSkip={() => { setShowInterview(false); setStep(2); }}
        />
      </div>
    );
  }

  // Landing: pick existing or create new
  if (step === -1) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
        <div className="flex items-center justify-center gap-3 px-6 py-4 border-b border-border">
          <Brain className="h-5 w-5 text-forge-amber" />
          <h1 className="text-lg font-bold">SLM Lab</h1>
          <Badge variant="outline" className="text-[10px]">Five Perspective Pipeline</Badge>
        </div>
        <div className="flex-1 overflow-auto">
          {datasets && datasets.length > 0 ? (
            <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
              <div className="text-center space-y-2">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Welcome back! 👋</h2>
                <p className="text-sm text-muted-foreground">Continue a dataset or start fresh.</p>
              </div>
              <div className="space-y-2">
                {datasets.map(ds => (
                  <button key={ds.id} onClick={() => handleSelectExisting(ds.id)}
                    className="w-full text-left rounded-xl px-5 py-4 border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group">
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
              <Button onClick={() => setStep(1)} variant="outline" className="w-full h-12">
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
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-forge-amber" />
          <h1 className="text-lg font-bold">SLM Lab</h1>
          {activeDataset && <Badge variant="outline" className="text-[10px]">{activeDataset.name}</Badge>}
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setStep(-1); setActiveDatasetId(null); }}>
          <ArrowLeft className="h-4 w-4 mr-1" /> All Datasets
        </Button>
      </div>

      <StepIndicator currentStep={step} />

      <div className="flex-1 overflow-auto">
        {step === 1 && <Step1CreateDataset onCreated={handleDatasetCreated} />}
        {step === 2 && activeDataset && <Step2AddData dataset={activeDataset} onNext={() => setStep(3)} />}
        {step === 3 && activeDataset && <Step3Review dataset={activeDataset} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && activeDataset && <Step4Export dataset={activeDataset} onBack={() => setStep(3)} />}
      </div>
    </div>
  );
}
