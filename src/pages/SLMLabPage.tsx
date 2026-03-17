import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";
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
import { Switch } from "@/components/ui/switch";
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
  Shield, Lightbulb, Heart, Layers, Wrench, Upload, FileUp, Tablet, Copy, Wifi, Video, Subtitles, ScanEye
} from "lucide-react";
import {
  useDatasets, useCreateDataset, useDeleteDataset,
  useSamples, useCreateSample, useUpdateSample, useDeleteSample,
  useScrapeForTraining, useProcessChatExport, useTrainingJobs, useCreateTrainingJob,
  useStartInterview, useInterviewRespond, useFinishInterview,
  useHFSearch, useHFPreview, useHFImport,
  exportDatasetAsJsonl, generateTrainingScript, validatePythonScript,
  useCognitiveFingerprint, useGenerateCognitiveFingerprint,
  type TrainingDataset, type DatasetSample, type TrainingJob,
} from "@/hooks/useTrainingData";
import { parseExport, PROVIDER_INFO, type Provider, type ParsedConversation } from "@/lib/chatExportParsers";

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
  const [showTopics, setShowTopics] = useState(false);
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

  const TOPIC_SUGGESTIONS = [
    "Let's talk about failures and what you learned",
    "Tell me about your decision-making process",
    "How do you handle situations with incomplete information?",
    "What's your approach to training or mentoring others?",
    "Let's switch to a completely different area of your expertise",
    "Tell me about the tools or systems you've built",
  ];

  const handleTopicSteer = (topic: string) => {
    if (!interviewId || respond.isPending) return;
    const steerMsg = `[TOPIC SHIFT] The user wants to talk about: ${topic}. Ask a focused, curious question about this new topic.`;
    const newTranscript = [...transcript, { role: "user", content: `I'd like to talk about: ${topic}` }];
    setTranscript(newTranscript);
    setExchangeCount(prev => prev + 1);

    respond.mutate({
      interview_id: interviewId,
      dataset_id: datasetId,
      message: steerMsg,
      transcript: transcript,
      domain_hint: domain,
    }, {
      onSuccess: (data) => {
        setTranscript(prev => [...prev, { role: "assistant", content: data.follow_up }]);
        if (data.pair_created) setPairsCreated(prev => prev + 1);
      }
    });
  };


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
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => setShowTopics(!showTopics)}
          >
            <ArrowRight className="h-3 w-3 mr-1" />
            {showTopics ? "Hide Topics" : "Change Topic"}
          </Button>
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

      {/* Topic suggestions bar */}
      <AnimatePresence>
        {showTopics && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/50"
          >
            <div className="px-4 py-3 flex gap-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider self-center mr-1">Steer to:</span>
              {TOPIC_SUGGESTIONS.map((topic) => (
                <Button
                  key={topic}
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-7"
                  disabled={respond.isPending}
                  onClick={() => { handleTopicSteer(topic); setShowTopics(false); }}
                >
                  {topic}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

// ── Import Chats Sub-component ──
function ImportChatsPanel({ dataset }: { dataset: TrainingDataset }) {
  const [provider, setProvider] = useState<Provider>("openai");
  const [parsedConvos, setParsedConvos] = useState<ParsedConversation[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentTitle: "" });
  const [results, setResults] = useState<{ title: string; pairs: number; error?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processExport = useProcessChatExport();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        if (!text || text.length < 10) {
          toast.error("File appears empty or unreadable.");
          return;
        }
        let raw: any;
        try {
          raw = JSON.parse(text);
        } catch (parseErr) {
          console.error("JSON parse error:", parseErr);
          toast.error("Could not parse file. Make sure it's a valid JSON export.");
          return;
        }
        console.log("Parsed JSON type:", typeof raw, "isArray:", Array.isArray(raw), "keys:", raw && typeof raw === 'object' ? Object.keys(raw).slice(0, 10) : "N/A");
        let convos: ParsedConversation[] = [];
        try {
          convos = parseExport(provider, raw);
        } catch (exportErr) {
          console.error("parseExport error:", exportErr);
          toast.error("Error processing conversations. Check the console for details.");
          return;
        }
        if (convos.length === 0) {
          const topKeys = raw && typeof raw === 'object' && !Array.isArray(raw) ? Object.keys(raw).join(', ') : (Array.isArray(raw) ? `array of ${raw.length} items` : typeof raw);
          toast.error(`No conversations found. File structure: ${topKeys}. Make sure you selected the right provider.`);
          return;
        }
        setParsedConvos(convos);
        setSelectedIds(new Set(convos.map((_, i) => i)));
        setResults([]);
        toast.success(`Found ${convos.length} conversations!`);
      } catch (err: any) {
        console.error("handleFileUpload unexpected error:", err);
        toast.error("Unexpected error reading file: " + (err?.message || "unknown"));
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
    };
    reader.readAsText(file, "utf-8");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleConvo = (idx: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(parsedConvos.map((_, i) => i)));
  const deselectAll = () => setSelectedIds(new Set());

  const processSelected = async () => {
    const selected = parsedConvos.filter((_, i) => selectedIds.has(i));
    if (selected.length === 0) return;

    setProcessing(true);
    setResults([]);
    setProgress({ current: 0, total: selected.length, currentTitle: "" });

    const newResults: typeof results = [];

    for (let i = 0; i < selected.length; i++) {
      const conv = selected[i];
      setProgress({ current: i + 1, total: selected.length, currentTitle: conv.title });

      try {
        const data = await processExport.mutateAsync({
          conversation_text: conv.text,
          dataset_id: dataset.id,
          domain_hint: dataset.domain,
          provider,
          conversation_title: conv.title,
        });
        newResults.push({ title: conv.title, pairs: data.extracted });
      } catch (err: any) {
        newResults.push({ title: conv.title, pairs: 0, error: err.message });
        // If rate limited, wait 5s before continuing
        if (err.message?.includes("Rate limit")) {
          await new Promise(r => setTimeout(r, 5000));
        }
      }
      setResults([...newResults]);
    }

    setProcessing(false);
    const totalPairs = newResults.reduce((sum, r) => sum + r.pairs, 0);
    toast.success(`Done! Extracted ${totalPairs} training pairs from ${newResults.filter(r => r.pairs > 0).length} conversations`);
  };

  return (
    <div className="space-y-4">
      {/* Provider selection */}
      <div className="space-y-2">
        <Label>Which AI did you export from?</Label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(PROVIDER_INFO) as [Provider, typeof PROVIDER_INFO[Provider]][]).map(([key, info]) => (
            <button key={key} onClick={() => { setProvider(key); setParsedConvos([]); setResults([]); }}
              className={`text-left rounded-lg px-4 py-3 border transition-all ${
                provider === key ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-border hover:border-primary/30 hover:bg-muted/50"
              }`}>
              <p className="text-sm font-medium">{info.emoji} {info.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{info.exportGuide}</p>
            </button>
          ))}
        </div>
      </div>

      {/* File upload */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileUp className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Upload your {PROVIDER_INFO[provider].label} export</p>
              <p className="text-[10px] text-muted-foreground">Expected: {PROVIDER_INFO[provider].acceptedFiles}</p>
            </div>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Choose File
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
          </div>
        </CardContent>
      </Card>

      {/* Parsed conversations list */}
      {parsedConvos.length > 0 && !processing && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{parsedConvos.length} conversations found</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll}>Select All</Button>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={deselectAll}>Deselect All</Button>
            </div>
          </div>
          <ScrollArea className="h-[280px]">
            <div className="space-y-1.5">
              {parsedConvos.map((conv, i) => (
                <button key={i} onClick={() => toggleConvo(i)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 border transition-all flex items-center gap-3 ${
                    selectedIds.has(i) ? "border-primary/40 bg-primary/5" : "border-border/50 opacity-50"
                  }`}>
                  <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                    selectedIds.has(i) ? "bg-primary border-primary" : "border-muted-foreground/30"
                  }`}>
                    {selectedIds.has(i) && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{conv.title}</p>
                    <p className="text-[10px] text-muted-foreground">{conv.messageCount} messages · {Math.round(conv.text.length / 1000)}k chars</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
          <Button onClick={processSelected} disabled={selectedIds.size === 0} className="w-full gradient-primary text-primary-foreground h-11">
            <Sparkles className="h-4 w-4 mr-2" /> Process {selectedIds.size} Conversations Through 5-Perspective Pipeline
          </Button>
        </div>
      )}

      {/* Processing progress */}
      {processing && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Processing conversations…</p>
              <span className="text-xs text-muted-foreground">{progress.current}/{progress.total}</span>
            </div>
            <Progress value={(progress.current / progress.total) * 100} className="h-2" />
            <div className="flex items-center gap-2">
              <RotateCcw className="h-3 w-3 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground truncate">"{progress.currentTitle}" — running 5 perspectives…</p>
            </div>
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
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && !processing && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-forge-emerald" /> Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center justify-between text-xs px-2 py-1.5 rounded ${r.error ? "bg-forge-rose/5" : "bg-forge-emerald/5"}`}>
                <span className="truncate flex-1">{r.title}</span>
                {r.error ? (
                  <span className="text-forge-rose shrink-0 ml-2">⚠ {r.error.slice(0, 40)}</span>
                ) : (
                  <Badge variant="outline" className="text-[9px] text-forge-emerald border-forge-emerald/30 shrink-0 ml-2">
                    +{r.pairs} pairs
                  </Badge>
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-2">
              Total: {results.reduce((s, r) => s + r.pairs, 0)} training pairs extracted
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Hugging Face Dataset Panel ──
function HuggingFacePanel({ dataset }: { dataset: TrainingDataset }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDataset, setSelectedDataset] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [inputCol, setInputCol] = useState("");
  const [outputCol, setOutputCol] = useState("");
  const [importCount, setImportCount] = useState(100);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const hfSearch = useHFSearch();
  const hfPreview = useHFPreview();
  const hfImport = useHFImport();

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    hfSearch.mutate(searchQuery);
    setSelectedDataset(null);
    setPreviewData(null);
    setImportResult(null);
  };

  const handleSelectDataset = async (ds: any) => {
    setSelectedDataset(ds);
    setPreviewData(null);
    setInputCol("");
    setOutputCol("");
    setImportResult(null);
    hfPreview.mutate({ hf_dataset_id: ds.id, length: 5 }, {
      onSuccess: (data) => {
        setPreviewData(data);
        // Auto-detect columns
        const cols = data.columns || Object.keys(data.rows?.[0]?.row || {});
        const inputGuess = cols.find((c: string) => /instruction|input|question|prompt|human/i.test(c)) || "";
        const outputGuess = cols.find((c: string) => /output|response|answer|assistant|completion/i.test(c)) || "";
        setInputCol(inputGuess);
        setOutputCol(outputGuess);
      },
    });
  };

  const handleImport = async () => {
    if (!selectedDataset || !inputCol || !outputCol) return;
    setImporting(true);
    setImportResult(null);

    // Import in batches of 100
    let totalImported = 0;
    let totalSkipped = 0;
    const batchSize = 100;
    const batches = Math.ceil(importCount / batchSize);

    for (let i = 0; i < batches; i++) {
      const offset = i * batchSize;
      const length = Math.min(batchSize, importCount - offset);
      try {
        const result = await hfImport.mutateAsync({
          hf_dataset_id: selectedDataset.id,
          dataset_id: dataset.id,
          input_column: inputCol,
          output_column: outputCol,
          offset,
          length,
        });
        totalImported += result.imported;
        totalSkipped += result.skipped;
      } catch {
        break;
      }
    }

    setImportResult({ imported: totalImported, skipped: totalSkipped });
    setImporting(false);
  };

  const formatNum = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4 text-forge-amber" /> Hugging Face Datasets
        </CardTitle>
        <CardDescription>
          Search and import high-quality training data from the Hugging Face Hub. Thousands of curated instruction, Q&A, and chat datasets available.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="e.g. instruction tuning, code assistant, medical qa..."
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={hfSearch.isPending || !searchQuery.trim()}>
            {hfSearch.isPending ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
          </Button>
        </div>

        {/* Suggested searches */}
        {!hfSearch.data && !selectedDataset && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Popular categories:</p>
            <div className="flex flex-wrap gap-1.5">
              {["instruction tuning", "code generation", "chat", "reasoning", "math", "medical", "legal", "creative writing"].map(q => (
                <button key={q} onClick={() => { setSearchQuery(q); hfSearch.mutate(q); }}
                  className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search results */}
        {hfSearch.data && !selectedDataset && (
          <ScrollArea className="h-[320px]">
            <div className="space-y-2">
              {hfSearch.data.datasets.map((ds) => (
                <button key={ds.id} onClick={() => handleSelectDataset(ds)}
                  className="w-full text-left rounded-lg px-4 py-3 border border-border hover:border-primary/40 hover:bg-primary/5 transition-all space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{ds.id}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                      <span>⬇ {formatNum(ds.downloads)}</span>
                      <span>♥ {formatNum(ds.likes)}</span>
                    </div>
                  </div>
                  {ds.description && <p className="text-xs text-muted-foreground line-clamp-2">{ds.description}</p>}
                  {ds.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ds.tags.slice(0, 5).map((t: string) => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
              {hfSearch.data.datasets.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No datasets found. Try a different search.</p>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Selected dataset + preview */}
        {selectedDataset && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={() => { setSelectedDataset(null); setPreviewData(null); setImportResult(null); }}
                className="text-xs text-primary hover:underline flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to results
              </button>
              <a href={`https://huggingface.co/datasets/${selectedDataset.id}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                View on HF <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-sm font-medium">{selectedDataset.id}</p>
              <p className="text-xs text-muted-foreground mt-1">⬇ {formatNum(selectedDataset.downloads)} downloads · ♥ {formatNum(selectedDataset.likes)} likes</p>
            </div>

            {hfPreview.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                <RotateCcw className="h-4 w-4 animate-spin" /> Loading preview...
              </div>
            )}

            {previewData && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">{formatNum(previewData.num_rows)} total rows · Showing first {previewData.rows.length}</p>

                {/* Preview table */}
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="max-h-[200px]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50">
                            {(previewData.columns.length > 0 ? previewData.columns : Object.keys(previewData.rows[0]?.row || {})).map((col: string) => (
                              <th key={col} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.rows.map((row: any, i: number) => {
                            const r = row.row || row;
                            const cols = previewData.columns.length > 0 ? previewData.columns : Object.keys(r);
                            return (
                              <tr key={i} className="border-t border-border/50">
                                {cols.map((col: string) => (
                                  <td key={col} className="px-2 py-1.5 max-w-[200px] truncate text-muted-foreground">
                                    {typeof r[col] === "string" ? r[col].slice(0, 100) : JSON.stringify(r[col])?.slice(0, 100)}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                </div>

                {/* Column mapping */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Input column (question/instruction)</Label>
                    <Select value={inputCol} onValueChange={setInputCol}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select column" /></SelectTrigger>
                      <SelectContent>
                        {(previewData.columns.length > 0 ? previewData.columns : Object.keys(previewData.rows[0]?.row || {})).map((col: string) => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Output column (response/answer)</Label>
                    <Select value={outputCol} onValueChange={setOutputCol}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select column" /></SelectTrigger>
                      <SelectContent>
                        {(previewData.columns.length > 0 ? previewData.columns : Object.keys(previewData.rows[0]?.row || {})).map((col: string) => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Import count */}
                <div className="space-y-1.5">
                  <Label className="text-xs">How many rows to import?</Label>
                  <div className="flex gap-2">
                    {[50, 100, 200, 500].map(n => (
                      <button key={n} onClick={() => setImportCount(n)}
                        className={`text-xs px-3 py-1.5 rounded-md border transition-all ${
                          importCount === n ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30"
                        }`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Import button */}
                <Button onClick={handleImport}
                  disabled={importing || !inputCol || !outputCol}
                  className="w-full">
                  {importing ? (
                    <><RotateCcw className="h-4 w-4 mr-2 animate-spin" /> Importing from Hugging Face...</>
                  ) : (
                    <><Download className="h-4 w-4 mr-2" /> Import {importCount} rows into "{dataset.name}"</>
                  )}
                </Button>

                {/* Result */}
                {importResult && (
                  <div className="bg-forge-emerald/5 rounded-lg p-3 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-forge-emerald shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Imported {importResult.imported} training pairs!</p>
                      {importResult.skipped > 0 && (
                        <p className="text-xs text-muted-foreground">{importResult.skipped} rows skipped (too short or invalid)</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


function Step2AddData({ dataset, onNext }: { dataset: TrainingDataset; onNext: () => void }) {
  const [url, setUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; currentUrl: string; results: { url: string; pairs: number; error?: string }[] }>({ current: 0, total: 0, currentUrl: "", results: [] });
  const [manualInput, setManualInput] = useState("");
  const [manualOutput, setManualOutput] = useState("");
  const [mode, setMode] = useState<"scrape" | "import" | "manual" | "file" | "huggingface" | "video">("import");
  const [offloadPerspective, setOffloadPerspective] = useState<string>("");
  const [showOffloadSetup, setShowOffloadSetup] = useState(false);
   const [debateMode, setDebateMode] = useState(false);
   const [synthesisMode, setSynthesisMode] = useState<"oracle" | "teacher">("oracle");
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileProcessing, setFileProcessing] = useState(false);
  const [videoFrames, setVideoFrames] = useState<string[]>([]);
  const [videoFileName, setVideoFileName] = useState("");
  const [videoExtracting, setVideoExtracting] = useState(false);
  const [videoAnalyzing, setVideoAnalyzing] = useState(false);
  const [videoExtractProgress, setVideoExtractProgress] = useState(0);
  const [videoAnalysisText, setVideoAnalysisText] = useState("");
  const [videoInterval, setVideoInterval] = useState(2);
  const [videoMaxFrames, setVideoMaxFrames] = useState(20);
  const [smartKeyframe, setSmartKeyframe] = useState(false);
  const [smartThreshold, setSmartThreshold] = useState(15);
  const [extractCC, setExtractCC] = useState(true);
  const [videoCCText, setVideoCCText] = useState("");
  const videoUploadRef = useRef<HTMLInputElement>(null);
  const scrape = useScrapeForTraining();
  const createSample = useCreateSample();
  const processExport = useProcessChatExport();
  const { data: samples } = useSamples(dataset.id);
  const fileUploadRef = useRef<HTMLInputElement>(null);

  const workerUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/perspective-worker`;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const handleScrape = () => {
    if (!url.trim()) return;
    scrape.mutate({ url, dataset_id: dataset.id, domain_hint: dataset.domain, offload_perspective: offloadPerspective || undefined, debate_mode: debateMode, synthesis_mode: synthesisMode });
    setUrl("");
  };

  const extractDocxText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXml = await zip.file("word/document.xml")?.async("string");
    if (!docXml) throw new Error("No document.xml found in DOCX");
    // Extract text from <w:t> tags
    const matches = docXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    const paragraphs: string[] = [];
    let current = "";
    // Split by paragraph markers
    const parts = docXml.split(/<\/w:p>/);
    for (const part of parts) {
      const texts = part.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
      if (texts.length > 0) {
        const line = texts.map(t => t.replace(/<[^>]+>/g, "")).join("");
        if (line.trim()) paragraphs.push(line.trim());
      }
    }
    return paragraphs.join("\n\n");
  };

  const extractPptxText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slides: string[] = [];
    // PPTX slides are in ppt/slides/slide1.xml, slide2.xml, etc.
    const slideFiles = Object.keys(zip.files)
      .filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
        return numA - numB;
      });
    for (const slideFile of slideFiles) {
      const xml = await zip.file(slideFile)?.async("string");
      if (!xml) continue;
      // Extract text from <a:t> tags
      const texts = xml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
      const slideText = texts.map(t => t.replace(/<[^>]+>/g, "")).join(" ").trim();
      if (slideText) slides.push(slideText);
    }
    return slides.join("\n\n");
  };

  const handleRawFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.toLowerCase().split(".").pop();

    try {
      let fullText = "";
      let meta = "";

      if (ext === "pdf") {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((item: any) => item.str).join(" ") + "\n\n";
        }
        meta = `${pdf.numPages} pages`;
      } else if (ext === "docx") {
        const arrayBuffer = await file.arrayBuffer();
        fullText = await extractDocxText(arrayBuffer);
        meta = "DOCX";
      } else if (ext === "pptx") {
        const arrayBuffer = await file.arrayBuffer();
        fullText = await extractPptxText(arrayBuffer);
        meta = "PPTX";
      } else {
        // Plain text files
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsText(file);
        });
        fullText = text;
        meta = "text";
      }

      fullText = fullText.trim();
      if (fullText.length < 50) {
        toast.error("File has too little extractable text (need at least 50 characters).");
        return;
      }
      setFileText(fullText);
      setFileName(file.name);
      toast.success(`Extracted text from "${file.name}" (${Math.round(fullText.length / 1000)}k chars, ${meta})`);
    } catch (err: any) {
      console.error("File extraction error:", err);
      toast.error("Failed to extract text: " + (err?.message || "unknown error"));
    }

    if (fileUploadRef.current) fileUploadRef.current.value = "";
  };

  const handleProcessFile = async () => {
    if (!fileText.trim()) return;
    setFileProcessing(true);
    try {
      const data = await processExport.mutateAsync({
        conversation_text: fileText,
        dataset_id: dataset.id,
        domain_hint: dataset.domain,
        provider: "file-upload",
        conversation_title: fileName || "Uploaded File",
      });
      toast.success(`Extracted ${data.extracted} training pairs from "${fileName}"!`);
      setFileText("");
      setFileName("");
    } catch (err: any) {
      toast.error(err.message || "Failed to process file");
    } finally {
      setFileProcessing(false);
    }
  };

  // Compare two ImageData arrays for similarity (returns % difference 0-100)
  const computeFrameDiff = (a: ImageData, b: ImageData): number => {
    const d1 = a.data;
    const d2 = b.data;
    const len = d1.length;
    let totalDiff = 0;
    // Sample every 16th pixel for performance (RGBA stride = 4, so step 64)
    const step = 64;
    let samples = 0;
    for (let i = 0; i < len; i += step) {
      totalDiff += Math.abs(d1[i] - d2[i]); // R
      totalDiff += Math.abs(d1[i + 1] - d2[i + 1]); // G
      totalDiff += Math.abs(d1[i + 2] - d2[i + 2]); // B
      samples += 3;
    }
    return (totalDiff / samples / 255) * 100;
  };

  // Extract closed captions / subtitles from a video file's text tracks
  const extractClosedCaptions = (video: HTMLVideoElement): Promise<string> => {
    return new Promise((resolve) => {
      const tracks = video.textTracks;
      if (!tracks || tracks.length === 0) {
        resolve("");
        return;
      }

      // Try to enable the first available text track
      const track = tracks[0];
      track.mode = "hidden";

      // Wait briefly for cues to load
      const checkCues = () => {
        if (track.cues && track.cues.length > 0) {
          const lines: string[] = [];
          for (let i = 0; i < track.cues.length; i++) {
            const cue = track.cues[i] as VTTCue;
            if (cue.text) {
              lines.push(cue.text.replace(/<[^>]+>/g, "").trim());
            }
          }
          resolve(lines.filter(Boolean).join("\n"));
        } else {
          resolve("");
        }
      };

      // Some browsers need a moment to parse cues
      if (track.cues && track.cues.length > 0) {
        checkCues();
      } else {
        track.addEventListener("cuechange", checkCues, { once: true });
        setTimeout(checkCues, 2000);
      }
    });
  };

  const extractVideoFrames = async (
    file: File,
    intervalSec = 2,
    maxFrames = 20,
    useSmartKeyframe = false,
    diffThreshold = 15,
    shouldExtractCC = false
  ): Promise<{ frames: string[]; captions: string }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.muted = true;
      video.preload = "auto";
      video.crossOrigin = "anonymous";
      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadedmetadata = async () => {
        const duration = video.duration;
        // In smart mode, sample more densely (every 0.5s) and filter duplicates
        const sampleInterval = useSmartKeyframe ? 0.5 : intervalSec;
        const totalSamples = Math.ceil(duration / sampleInterval);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const frames: string[] = [];
        let prevImageData: ImageData | null = null;
        let currentSample = 0;
        let skippedCount = 0;

        // Extract CC if requested
        let captionText = "";
        if (shouldExtractCC) {
          try {
            captionText = await extractClosedCaptions(video);
          } catch { /* ignore CC errors */ }
        }

        const captureFrame = () => {
          if (currentSample >= totalSamples || frames.length >= maxFrames) {
            URL.revokeObjectURL(url);
            if (useSmartKeyframe && skippedCount > 0) {
              console.log(`Smart keyframe: kept ${frames.length}, skipped ${skippedCount} similar frames`);
            }
            resolve({ frames, captions: captionText });
            return;
          }

          const time = Math.min(currentSample * sampleInterval, duration - 0.01);
          video.currentTime = time;
        };

        video.onseeked = () => {
          canvas.width = Math.min(video.videoWidth, 1280);
          canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          if (useSmartKeyframe) {
            const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            if (prevImageData) {
              const diff = computeFrameDiff(prevImageData, currentImageData);
              if (diff < diffThreshold) {
                // Frame is too similar — skip
                skippedCount++;
                currentSample++;
                setVideoExtractProgress(Math.round((currentSample / totalSamples) * 100));
                captureFrame();
                return;
              }
            }
            prevImageData = currentImageData;
          }

          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          frames.push(dataUrl);
          currentSample++;
          setVideoExtractProgress(Math.round((currentSample / totalSamples) * 100));
          captureFrame();
        };

        video.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Failed to load video"));
        };

        captureFrame();
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load video file"));
      };
    });
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 100 * 1024 * 1024; // 100MB client limit
    if (file.size > maxSize) {
      toast.error("Video too large. Maximum size is 100MB.");
      return;
    }

    setVideoExtracting(true);
    setVideoExtractProgress(0);
    setVideoFrames([]);
    setVideoFileName(file.name);
    setVideoAnalysisText("");
    setVideoCCText("");

    try {
      const { frames, captions } = await extractVideoFrames(file, videoInterval, videoMaxFrames, smartKeyframe, smartThreshold, extractCC);
      if (frames.length === 0) {
        toast.error("Could not extract any frames from the video.");
        setVideoExtracting(false);
        return;
      }
      setVideoFrames(frames);
      if (captions) setVideoCCText(captions);
      const ccNote = captions ? ` + ${captions.split("\n").length} CC lines` : "";
      toast.success(`Extracted ${frames.length} frames${ccNote} from "${file.name}"`);
    } catch (err: any) {
      console.error("Video frame extraction error:", err);
      toast.error("Failed to extract video frames: " + (err?.message || "unknown error"));
    } finally {
      setVideoExtracting(false);
      if (videoUploadRef.current) videoUploadRef.current.value = "";
    }
  };

  const handleAnalyzeFrames = async () => {
    if (videoFrames.length === 0) return;
    setVideoAnalyzing(true);
    setVideoAnalysisText("");

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-video-frames`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          frames: videoFrames,
          domain_hint: dataset.domain,
          dataset_id: dataset.id,
          captions: videoCCText || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `Server error ${response.status}`);
      }

      const data = await response.json();
      if (!data.text || data.text.trim().length < 20) {
        toast.error("AI could not extract meaningful content from the video frames.");
        return;
      }
      setVideoAnalysisText(data.text);
      toast.success(`AI analyzed ${data.frame_count} frames and extracted content!`);
    } catch (err: any) {
      console.error("Video analysis error:", err);
      toast.error(err.message || "Failed to analyze video frames");
    } finally {
      setVideoAnalyzing(false);
    }

  };

  const handleProcessVideoText = async () => {
    if (!videoAnalysisText.trim()) return;
    setFileProcessing(true);
    try {
      const data = await processExport.mutateAsync({
        conversation_text: videoAnalysisText,
        dataset_id: dataset.id,
        domain_hint: dataset.domain,
        provider: "video-extraction",
        conversation_title: videoFileName || "Video Upload",
      });
      toast.success(`Extracted ${data.extracted} training pairs from video analysis!`);
      setVideoAnalysisText("");
      setVideoFrames([]);
      setVideoFileName("");
    } catch (err: any) {
      toast.error(err.message || "Failed to process video content");
    } finally {
      setFileProcessing(false);
    }
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
          Import your AI chat history, scrape websites, or add examples manually — all processed through the <strong className="text-foreground">Five Perspective Pipeline</strong>.
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
      <div className="flex gap-2 flex-wrap">
        <Button variant={mode === "import" ? "default" : "outline"} onClick={() => setMode("import")} className="flex-1">
          <Upload className="h-4 w-4 mr-2" /> Import AI Chats
        </Button>
        <Button variant={mode === "huggingface" ? "default" : "outline"} onClick={() => setMode("huggingface")} className="flex-1">
          <Database className="h-4 w-4 mr-2" /> Hugging Face
        </Button>
        <Button variant={mode === "scrape" ? "default" : "outline"} onClick={() => setMode("scrape")} className="flex-1">
          <Globe className="h-4 w-4 mr-2" /> Scrape URL
        </Button>
        <Button variant={mode === "file" ? "default" : "outline"} onClick={() => setMode("file")} className="flex-1">
          <FileText className="h-4 w-4 mr-2" /> Upload File
        </Button>
        <Button variant={mode === "manual" ? "default" : "outline"} onClick={() => setMode("manual")} className="flex-1">
          <Plus className="h-4 w-4 mr-2" /> Manual
        </Button>
        <Button variant={mode === "video" ? "default" : "outline"} onClick={() => setMode("video")} className="flex-1">
          <Video className="h-4 w-4 mr-2" /> Video
        </Button>
      </div>

      {mode === "import" ? (
        <ImportChatsPanel dataset={dataset} />
      ) : mode === "huggingface" ? (
        <HuggingFacePanel dataset={dataset} />
      ) : mode === "file" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Upload a File
            </CardTitle>
            <CardDescription>
              Upload a .pdf, .txt, .md, .csv, or .log file. Its contents will be run through the Five Perspective Pipeline to extract training pairs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Button onClick={() => fileUploadRef.current?.click()} variant="outline" className="flex-1">
                <Upload className="h-4 w-4 mr-2" /> {fileName ? `Change File` : `Choose File`}
              </Button>
              <input ref={fileUploadRef} type="file" accept=".pdf,.docx,.pptx,.txt,.md,.csv,.log,.text,.markdown" className="hidden" onChange={handleRawFileUpload} />
            </div>
            {fileName && (
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" /> {fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">{Math.round(fileText.length / 1000)}k characters loaded</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">{fileText.slice(0, 500)}{fileText.length > 500 ? "…" : ""}</p>
                </div>
                <Button onClick={handleProcessFile} disabled={fileProcessing} className="w-full">
                  {fileProcessing ? (
                    <><RotateCcw className="h-4 w-4 mr-2 animate-spin" /> Running Five Perspective Pipeline…</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> Process Through Pipeline</>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : mode === "video" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" /> Video Frame Analysis
            </CardTitle>
            <CardDescription>
              Upload a short video (slides, whiteboard, diagram). Frames are extracted client-side, then Gemini 2.5 Pro analyzes the visual content and converts it into text for the pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Smart Keyframe Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
              <div className="flex items-center gap-2">
                <ScanEye className="h-4 w-4 text-primary" />
                <div>
                  <Label className="text-sm font-medium cursor-pointer" htmlFor="smart-keyframe">Smart Keyframe Detection</Label>
                  <p className="text-xs text-muted-foreground">Skip duplicate/similar frames automatically</p>
                </div>
              </div>
              <Switch id="smart-keyframe" checked={smartKeyframe} onCheckedChange={setSmartKeyframe} disabled={videoExtracting} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!smartKeyframe && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Frame interval (seconds)</Label>
                  <div className="flex items-center gap-3">
                    <Slider min={1} max={10} step={1} value={[videoInterval]} onValueChange={([v]) => setVideoInterval(v)} className="flex-1" disabled={videoExtracting} />
                    <span className="text-sm font-mono w-6 text-right">{videoInterval}s</span>
                  </div>
                </div>
              )}
              {smartKeyframe && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Sensitivity threshold ({smartThreshold}%)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Slider min={3} max={40} step={1} value={[smartThreshold]} onValueChange={([v]) => setSmartThreshold(v)} className="flex-1" disabled={videoExtracting} />
                    <span className="text-sm font-mono w-8 text-right">{smartThreshold}%</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Lower = more frames kept, Higher = only big changes kept</p>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Max frames</Label>
                <div className="flex items-center gap-3">
                  <Slider min={5} max={30} step={5} value={[videoMaxFrames]} onValueChange={([v]) => setVideoMaxFrames(v)} className="flex-1" disabled={videoExtracting} />
                  <span className="text-sm font-mono w-6 text-right">{videoMaxFrames}</span>
                </div>
              </div>
            </div>

            {/* CC Extraction Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
              <div className="flex items-center gap-2">
                <Subtitles className="h-4 w-4 text-primary" />
                <div>
                  <Label className="text-sm font-medium cursor-pointer" htmlFor="extract-cc">Extract Closed Captions</Label>
                  <p className="text-xs text-muted-foreground">Read embedded subtitles/CC tracks from the video</p>
                </div>
              </div>
              <Switch id="extract-cc" checked={extractCC} onCheckedChange={setExtractCC} disabled={videoExtracting} />
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => videoUploadRef.current?.click()} variant="outline" className="flex-1" disabled={videoExtracting}>
                <Video className="h-4 w-4 mr-2" /> {videoFileName ? "Change Video" : "Choose Video"}
              </Button>
              <input ref={videoUploadRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov,.avi" className="hidden" onChange={handleVideoUpload} />
            </div>

            {videoExtracting && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                  Extracting frames… {videoExtractProgress}%
                </div>
                <Progress value={videoExtractProgress} className="h-1.5" />
              </div>
            )}

            {videoFrames.length > 0 && !videoExtracting && (
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Video className="h-4 w-4" /> {videoFileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {videoFrames.length} frames extracted{smartKeyframe ? " (smart keyframe)" : ""}
                    {videoCCText ? ` · ${videoCCText.split("\n").length} CC lines` : ""}
                  </p>
                </div>

                <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto rounded-lg bg-muted/30 p-2">
                  {videoFrames.map((frame, i) => (
                    <img key={i} src={frame} alt={`Frame ${i + 1}`} className="rounded border border-border/50 w-full aspect-video object-cover" />
                  ))}
                </div>

                {videoCCText && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground">
                        <Subtitles className="h-3.5 w-3.5 mr-2" />
                        {videoCCText.split("\n").length} closed caption lines extracted
                        <ChevronDown className="h-3 w-3 ml-auto" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-muted/30 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <p className="text-[11px] text-muted-foreground font-mono whitespace-pre-wrap">{videoCCText}</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {!videoAnalysisText && (
                  <Button onClick={handleAnalyzeFrames} disabled={videoAnalyzing} className="w-full">
                    {videoAnalyzing ? (
                      <><RotateCcw className="h-4 w-4 mr-2 animate-spin" /> Analyzing with Gemini 2.5 Pro…</>
                    ) : (
                      <><Eye className="h-4 w-4 mr-2" /> Analyze Frames with AI</>
                    )}
                  </Button>
                )}

                {videoAnalysisText && (
                  <div className="space-y-3">
                    <div className="bg-muted/30 rounded-lg p-3 max-h-48 overflow-y-auto">
                      <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                        {videoAnalysisText.slice(0, 800)}{videoAnalysisText.length > 800 ? "…" : ""}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{Math.round(videoAnalysisText.length / 1000)}k characters extracted from video</p>
                    <Button onClick={handleProcessVideoText} disabled={fileProcessing} className="w-full">
                      {fileProcessing ? (
                        <><RotateCcw className="h-4 w-4 mr-2 animate-spin" /> Running Five Perspective Pipeline…</>
                      ) : (
                        <><Sparkles className="h-4 w-4 mr-2" /> Process Through Pipeline</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : mode === "scrape" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-forge-amber" /> Five Perspective Pipeline Scraper
            </CardTitle>
            <CardDescription>
              Paste one URL per line. Each is analyzed by 5 AI perspectives then synthesized into training pairs. Results save after each URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={bulkUrls}
              onChange={e => setBulkUrls(e.target.value)}
              placeholder={"https://docs.example.com/getting-started\nhttps://blog.example.com/best-practices\nhttps://wiki.example.com/architecture"}
              rows={4}
              className="text-sm font-mono"
              disabled={bulkProcessing}
            />
            {(() => {
              const urls = bulkUrls.split("\n").map(u => u.trim()).filter(u => u.length > 0);
              return (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{urls.length} URL{urls.length !== 1 ? "s" : ""} ready</p>
                  <Button
                    onClick={async () => {
                      if (urls.length === 0) return;
                      setBulkProcessing(true);
                      const results: typeof bulkProgress.results = [];
                      setBulkProgress({ current: 0, total: urls.length, currentUrl: "", results: [] });

                      for (let i = 0; i < urls.length; i++) {
                        const u = urls[i];
                        setBulkProgress({ current: i + 1, total: urls.length, currentUrl: u, results: [...results] });
                        try {
                          const data = await scrape.mutateAsync({
                            url: u,
                            dataset_id: dataset.id,
                            domain_hint: dataset.domain,
                            offload_perspective: offloadPerspective || undefined,
                            debate_mode: debateMode,
                            synthesis_mode: synthesisMode,
                          });
                          results.push({ url: u, pairs: data.extracted });
                        } catch (err: any) {
                          results.push({ url: u, pairs: 0, error: err.message });
                          if (err.message?.includes("Rate limit")) {
                            await new Promise(r => setTimeout(r, 5000));
                          }
                        }
                        setBulkProgress({ current: i + 1, total: urls.length, currentUrl: u, results: [...results] });
                      }

                      setBulkProcessing(false);
                      const totalPairs = results.reduce((s, r) => s + r.pairs, 0);
                      toast.success(`Done! Extracted ${totalPairs} pairs from ${results.filter(r => r.pairs > 0).length}/${urls.length} URLs`);
                    }}
                    disabled={bulkProcessing || urls.length === 0}
                    className="px-6"
                  >
                    {bulkProcessing ? <RotateCcw className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    {bulkProcessing ? `Processing ${bulkProgress.current}/${bulkProgress.total}…` : `Scrape ${urls.length} URL${urls.length !== 1 ? "s" : ""}`}
                  </Button>
                </div>
              );
            })()}

            {bulkProcessing && (
              <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">🔍 Processing URL {bulkProgress.current}/{bulkProgress.total}</p>
                  <span className="text-xs text-muted-foreground">{Math.round((bulkProgress.current / bulkProgress.total) * 100)}%</span>
                </div>
                <Progress value={(bulkProgress.current / bulkProgress.total) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground truncate">{bulkProgress.currentUrl}</p>
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
              </div>
            )}

            {bulkProgress.results.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <p className="text-xs font-medium text-muted-foreground">Results ({bulkProgress.results.reduce((s, r) => s + r.pairs, 0)} total pairs)</p>
                {bulkProgress.results.map((r, i) => (
                  <div key={i} className={`flex items-center justify-between text-xs px-2 py-1.5 rounded ${r.error ? "bg-destructive/5" : "bg-forge-emerald/5"}`}>
                    <span className="truncate flex-1 font-mono">{r.url.replace(/^https?:\/\//, "").slice(0, 50)}</span>
                    {r.error ? (
                      <span className="text-destructive shrink-0 ml-2">⚠ {r.error.slice(0, 30)}</span>
                    ) : (
                      <Badge variant="outline" className="text-[9px] text-forge-emerald border-forge-emerald/30 shrink-0 ml-2">+{r.pairs} pairs</Badge>
                    )}
                  </div>
                ))}
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

      {/* Synthesis Mode Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Synthesis Voice</p>
            <p className="text-[10px] text-muted-foreground">How the final training pairs sound</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
          <button
            onClick={() => setSynthesisMode("oracle")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${synthesisMode === "oracle" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Oracle
          </button>
          <button
            onClick={() => setSynthesisMode("teacher")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${synthesisMode === "teacher" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Teacher
          </button>
        </div>
      </div>

      {/* Synthesis mode description */}
      <Card className={synthesisMode === "oracle" ? "border-primary/20 bg-primary/5" : "border-blue-500/20 bg-blue-500/5"}>
        <CardContent className="py-3">
          <div className="flex items-start gap-2">
            {synthesisMode === "oracle" ? (
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            ) : (
              <BookOpen className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="text-xs font-medium">{synthesisMode === "oracle" ? "Oracle Mode" : "Teacher Mode"}</p>
              <p className="text-[10px] text-muted-foreground">
                {synthesisMode === "oracle"
                  ? "The perspectives reason so the model doesn't have to. Training pairs contain settled knowledge — no hedging, no \"it depends.\" The model speaks as someone who already knows."
                  : "Training pairs show reasoning transparently. The model explains how it arrives at answers, walking through trade-offs. Good for educational use cases."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debate Mode Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-forge-amber/10 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-forge-amber" />
          </div>
          <div>
            <p className="text-sm font-medium">Debate Mode</p>
            <p className="text-[10px] text-muted-foreground">Perspectives challenge each other before synthesis — richer but uses 2× AI calls</p>
          </div>
        </div>
        <button
          onClick={() => setDebateMode(!debateMode)}
          className={`relative h-6 w-11 rounded-full transition-colors ${debateMode ? "bg-forge-amber" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${debateMode ? "translate-x-5" : ""}`} />
        </button>
      </div>

      {debateMode && (
        <Card className="border-forge-amber/30 bg-forge-amber/5">
          <CardContent className="py-3">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-forge-amber shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-forge-amber">Debate Round Active</p>
                <p className="text-[10px] text-muted-foreground">After initial analysis, each perspective reads ALL others and directly challenges their claims. Concessions, rebuttals, and meta-bridges feed into Dream Mode synthesis. Training pairs include <code className="text-[9px] bg-muted px-1 rounded">{"<DEBATE>"}</code> tokens for debate-born insights.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device Offload Panel */}
      <Collapsible open={showOffloadSetup} onOpenChange={setShowOffloadSetup}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
            <Tablet className="h-3.5 w-3.5" />
            <span>Offload a perspective to a secondary device (tablet)</span>
            <ChevronRight className={`h-3.5 w-3.5 ml-auto transition-transform ${showOffloadSetup ? "rotate-90" : ""}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2 border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" /> Distributed Pipeline
              </CardTitle>
              <CardDescription className="text-xs">
                Offload one perspective to a tablet or secondary machine running Ollama locally. The job gets queued and your tablet picks it up automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Which perspective to offload?</Label>
                <Select value={offloadPerspective} onValueChange={setOffloadPerspective}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="None — run all 5 in the cloud" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (all cloud)</SelectItem>
                    {(["builder", "red_team", "systems", "frame_breaker", "empath"] as const).map(k => {
                      const cfg = PERSPECTIVE_CONFIG[k];
                      return <SelectItem key={k} value={k}>{cfg.label}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>

              {offloadPerspective && (
                <div className="space-y-3">
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium">Setup on your tablet:</p>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Install Ollama: <code className="text-[10px] bg-muted px-1 rounded">curl -fsSL https://ollama.com/install.sh | sh</code></li>
                      <li>Pull a model: <code className="text-[10px] bg-muted px-1 rounded">ollama pull llama3.2:1b</code></li>
                      <li>Run the worker script below</li>
                    </ol>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Worker endpoint (for your tablet script):</Label>
                    <div className="flex gap-1.5">
                      <Input value={workerUrl} readOnly className="text-[10px] font-mono h-8" />
                      <Button variant="outline" size="sm" className="h-8 px-2 shrink-0" onClick={() => {
                        navigator.clipboard.writeText(workerUrl);
                        toast.success("URL copied!");
                      }}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Quick worker script:</Label>
                    <div className="bg-muted rounded-lg p-3 overflow-x-auto">
                      <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre">{`#!/bin/bash
# Save as tablet_worker.sh, then: chmod +x tablet_worker.sh && ./tablet_worker.sh
API="${workerUrl}"
KEY="${anonKey}"
MODEL="llama3.2:1b"

while true; do
  R=$(curl -s "$API?action=poll" -H "apikey: $KEY")
  JID=$(echo "$R" | python3 -c "import sys,json; j=json.load(sys.stdin); print(j['job']['id'] if j.get('job') else '')" 2>/dev/null)
  [ -z "$JID" ] && sleep 5 && continue
  
  P=$(echo "$R" | python3 -c "import sys,json; j=json.load(sys.stdin); print(j['job']['perspective'])")
  echo "⚡ Processing: $P"
  
  SP=$(echo "$R" | python3 -c "import sys,json; j=json.load(sys.stdin); print(j['job']['system_prompt'])")
  CT=$(echo "$R" | python3 -c "import sys,json; j=json.load(sys.stdin); print(j['job']['input_content'])")
  RES=$(echo "$SP\n\n$CT" | ollama run $MODEL 2>/dev/null)
  
  if [ -n "$RES" ]; then
    curl -s -X POST "$API?action=submit" -H "apikey: $KEY" \\
      -H "Content-Type: application/json" \\
      -d "{\\"job_id\\": \\"$JID\\", \\"result\\": $(echo "$RES" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")}"
    echo "  ✅ Done"
  else
    curl -s -X POST "$API?action=submit" -H "apikey: $KEY" \\
      -H "Content-Type: application/json" -d "{\\"job_id\\": \\"$JID\\", \\"error\\": \\"failed\\"}"
    echo "  ❌ Failed"
  fi
done`}</pre>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => {
                      const script = `#!/bin/bash\nAPI="${workerUrl}"\nKEY="${anonKey}"\nMODEL="llama3.2:1b"\n\nwhile true; do\n  R=$(curl -s "$API?action=poll" -H "apikey: $KEY")\n  JID=$(echo "$R" | python3 -c "import sys,json; j=json.load(sys.stdin); print(j['job']['id'] if j.get('job') else '')" 2>/dev/null)\n  [ -z "$JID" ] && sleep 5 && continue\n  P=$(echo "$R" | python3 -c "import sys,json; j=json.load(sys.stdin); print(j['job']['perspective'])")\n  echo "Processing: $P"\n  SP=$(echo "$R" | python3 -c "import sys,json; j=json.load(sys.stdin); print(j['job']['system_prompt'])")\n  CT=$(echo "$R" | python3 -c "import sys,json; j=json.load(sys.stdin); print(j['job']['input_content'])")\n  RES=$(echo "$SP\\n\\n$CT" | ollama run $MODEL 2>/dev/null)\n  if [ -n "$RES" ]; then\n    curl -s -X POST "$API?action=submit" -H "apikey: $KEY" -H "Content-Type: application/json" -d "{\\"job_id\\": \\"$JID\\", \\"result\\": $(echo "$RES" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")}"\n  else\n    curl -s -X POST "$API?action=submit" -H "apikey: $KEY" -H "Content-Type: application/json" -d "{\\"job_id\\": \\"$JID\\", \\"error\\": \\"failed\\"}"\n  fi\ndone`;
                      const blob = new Blob([script], { type: "application/x-sh" });
                      const u = URL.createObjectURL(blob);
                      const a = document.createElement("a"); a.href = u; a.download = "tablet_worker.sh"; a.click();
                      URL.revokeObjectURL(u);
                      toast.success("Worker script downloaded!");
                    }}>
                      <Download className="h-3.5 w-3.5 mr-1.5" /> Download tablet_worker.sh
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

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
  const { data: fingerprint, isLoading: fpLoading } = useCognitiveFingerprint(dataset.id);
  const generateFingerprint = useGenerateCognitiveFingerprint();
  const [showFingerprint, setShowFingerprint] = useState(false);

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

// ── Hardware profiles ──
const HARDWARE_PROFILES = {
  low_vram: { label: "🪶 Low VRAM (2-4 GB)", desc: "Integrated GPU or old card", defaults: { batchSize: 1, loraRank: 8, maxSeqLen: 1024, gradientCheckpoint: true, cpuOffload: true } },
  mid_vram: { label: "⚡ Mid VRAM (4-8 GB)", desc: "GTX 1060/1070, RTX 2060", defaults: { batchSize: 2, loraRank: 16, maxSeqLen: 2048, gradientCheckpoint: true, cpuOffload: false } },
  cpu_only: { label: "🖥️ CPU Only (16GB+ RAM)", desc: "No GPU — uses RAM instead", defaults: { batchSize: 1, loraRank: 8, maxSeqLen: 1024, gradientCheckpoint: true, cpuOffload: true } },
  good_gpu: { label: "🔥 Good GPU (8+ GB)", desc: "RTX 3060+, A100, etc.", defaults: { batchSize: 4, loraRank: 32, maxSeqLen: 2048, gradientCheckpoint: false, cpuOffload: false } },
} as const;
type HardwareProfile = keyof typeof HARDWARE_PROFILES;

// ── Step 4: Export & Train ──
function Step4Export({ dataset, onBack }: { dataset: TrainingDataset; onBack: () => void }) {
  const { data: samples } = useSamples(dataset.id);
  const [hwProfile, setHwProfile] = useState<HardwareProfile>("cpu_only");
  const [baseModel, setBaseModel] = useState("qwen2.5-1.5b");
  const [epochs, setEpochs] = useState(3);
  const [lr, setLr] = useState(0.0002);
  const [batchSize, setBatchSize] = useState(1);
  const [loraRank, setLoraRank] = useState(8);
  const [maxSeqLen, setMaxSeqLen] = useState(1024);
  const [cpuOffload, setCpuOffload] = useState(true);
  const [gradientCheckpoint, setGradientCheckpoint] = useState(true);
  const createJob = useCreateTrainingJob();

  const approvedSamples = samples?.filter(s => s.status === "approved") || [];
  const perspectiveSamples = approvedSamples.filter(s => s.builder || s.synthesis);

  const applyProfile = (profile: HardwareProfile) => {
    setHwProfile(profile);
    const d = HARDWARE_PROFILES[profile].defaults;
    setBatchSize(d.batchSize);
    setLoraRank(d.loraRank);
    setMaxSeqLen(d.maxSeqLen);
    setCpuOffload(d.cpuOffload);
    setGradientCheckpoint(d.gradientCheckpoint);
    // Auto-select best model for the profile
    if (profile === "cpu_only" || profile === "low_vram") {
      setBaseModel("qwen2.5-1.5b");
    } else if (profile === "mid_vram") {
      setBaseModel("qwen2.5-1.5b");
    }
  };

  const models = [
    { value: "llama-3.2-1b", label: "Llama 3.2 (1B)", desc: "Best for limited hardware", vram: "~3 GB", rec: ["cpu_only", "low_vram"] },
    { value: "qwen2.5-1.5b", label: "Qwen 2.5 (1.5B)", desc: "Excellent for code", vram: "~3 GB", rec: ["low_vram", "mid_vram"] },
    { value: "gemma-2-2b", label: "Gemma 2 (2B)", desc: "Strong reasoning", vram: "~4 GB", rec: ["mid_vram"] },
    { value: "phi-3-mini", label: "Phi-3 Mini (3.8B)", desc: "Great all-rounder", vram: "~6 GB", rec: ["mid_vram", "good_gpu"] },
    { value: "llama-3.2-3b", label: "Llama 3.2 (3B)", desc: "Good balance", vram: "~5 GB", rec: ["mid_vram", "good_gpu"] },
    { value: "mistral-7b", label: "Mistral (7B)", desc: "Most capable", vram: "~10 GB", rec: ["good_gpu"] },
  ];

  const downloadTrainingKit = () => {
    if (approvedSamples.length === 0) return;
    const jobName = `${dataset.name.toLowerCase().replace(/\s+/g, "-")}-training`;
    const job: TrainingJob = {
      id: "", user_id: "", dataset_id: dataset.id, name: jobName, base_model: baseModel, method: "lora",
      hyperparameters: { epochs, learning_rate: lr, batch_size: batchSize, lora_rank: loraRank, max_seq_length: maxSeqLen, cpu_offload: cpuOffload, gradient_checkpointing: gradientCheckpoint, hw_profile: hwProfile },
      status: "draft", metrics: {}, created_at: "", updated_at: ""
    };

    // JSONL is now bundled inside the ZIP — no separate download needed
    
    const scriptContent = generateTrainingScript(job, dataset);

    // Validate generated Python script for syntax issues before bundling
    const scriptErrors = validatePythonScript(scriptContent);
    if (scriptErrors.length > 0) {
      toast.error(`Script template has ${scriptErrors.length} issue(s): ${scriptErrors[0]}`);
      console.error("Script validation errors:", scriptErrors);
      return;
    }
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

    const hwLabel = hwProfile;
    const runSh = "#!/bin/bash\n" +
      'cd "$(dirname "$0")"\n' +
      'echo "🔧 SoupyForge Local Trainer — Five Perspective Pipeline"\n' +
      'echo "Hardware Profile: ' + hwLabel + '"\n' +
      'echo "========================================================"\n' +
      "python3 --version 2>/dev/null || python --version 2>/dev/null || { echo 'Python not found!'; exit 1; }\n" +
      'echo "📦 Installing requirements..."\n' +
      "pip install unsloth transformers datasets torch trl psutil 2>/dev/null || pip3 install unsloth transformers datasets torch trl psutil\n" +
      'echo "🔥 Starting training..."\n' +
      "python3 train.py || python train.py\n" +
      'echo "✅ Done! Model in ./output/"\n' +
      'read -p "Press Enter to close..."\n';

    const runBat = "@echo off\r\n" +
      "cd /d \"%~dp0\"\r\n" +
      "echo SoupyForge Local Trainer — Five Perspective Pipeline\r\n" +
      "echo Hardware Profile: " + hwLabel + "\r\n" +
      "echo ========================================================\r\n" +
      "python --version || (echo Python not found! && pause && exit)\r\n" +
      "echo Installing requirements...\r\n" +
      "pip install unsloth transformers datasets torch trl psutil\r\n" +
      "echo Starting training...\r\n" +
      "python train.py\r\n" +
      "echo Done! Model in .\\output\\\r\n" +
      "pause\r\n";

    // Bundle everything into a ZIP so all files are in one folder
    const zip = new JSZip();
    const folderName = dataset.name.toLowerCase().replace(/\s+/g, "-") + "-training-kit";
    const folder = zip.folder(folderName)!;
    
    // Add JSONL dataset directly into the ZIP
    const jsonlLines = approvedSamples
      .filter(s => s.status === "approved")
      .map(s => {
        let assistantContent = "";
        if (s.builder || s.red_team || s.systems || s.frame_breaker || s.empath || s.synthesis) {
          assistantContent = [
            s.builder ? `<BUILDER>${s.builder}</BUILDER>` : "",
            s.red_team ? `<RED_TEAM>${s.red_team}</RED_TEAM>` : "",
            s.systems ? `<SYSTEMS>${s.systems}</SYSTEMS>` : "",
            s.frame_breaker ? `<FRAME_BREAKER>${s.frame_breaker}</FRAME_BREAKER>` : "",
            s.empath ? `<EMPATH>${s.empath}</EMPATH>` : "",
            s.synthesis ? `<SYNTHESIS>${s.synthesis}</SYNTHESIS>` : "",
          ].filter(Boolean).join("\n\n");
        } else {
          assistantContent = s.output;
        }
        return JSON.stringify({ messages: [{ role: "user", content: s.input }, { role: "assistant", content: assistantContent }] });
      });
    const datasetFileName = `${dataset.name.toLowerCase().replace(/\s+/g, "-")}-dataset.jsonl`;
    folder.file(datasetFileName, jsonlLines.join("\n"));
    folder.file("train.py", scriptContent);
    folder.file("README.md", readmeContent);
    folder.file("run.sh", runSh);
    folder.file("run.bat", runBat);

    zip.generateAsync({ type: "blob" }).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${folderName}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    });

    createJob.mutate({ dataset_id: dataset.id, name: jobName, base_model: baseModel, method: "lora",
      hyperparameters: { epochs, learning_rate: lr, batch_size: batchSize, lora_rank: loraRank, max_seq_length: maxSeqLen, cpu_offload: cpuOffload, gradient_checkpointing: gradientCheckpoint, hw_profile: hwProfile } });

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

      {/* Hardware profile */}
      <div className="space-y-3">
        <Label className="text-base">What's your hardware?</Label>
        <p className="text-xs text-muted-foreground -mt-1">We'll auto-tune everything for your setup</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.entries(HARDWARE_PROFILES) as [HardwareProfile, typeof HARDWARE_PROFILES[HardwareProfile]][]).map(([key, profile]) => (
            <button key={key} onClick={() => applyProfile(key)}
              className={`text-left rounded-lg px-4 py-3 border transition-all ${
                hwProfile === key ? "border-primary bg-primary/10 ring-1 ring-primary/30" : "border-border hover:border-primary/30"
              }`}>
              <p className="text-sm font-medium">{profile.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{profile.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Model selection */}
      <div className="space-y-3">
        <Label className="text-base">Pick a Base Model</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {models.map(m => {
            const isRecommended = m.rec.includes(hwProfile);
            return (
              <button key={m.value} onClick={() => setBaseModel(m.value)}
                className={`text-left rounded-lg px-4 py-3 border transition-all ${
                  baseModel === m.value ? "border-primary bg-primary/10 ring-1 ring-primary/30" : 
                  isRecommended ? "border-border hover:border-primary/30" : "border-border/50 opacity-50 hover:opacity-75"
                }`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{m.label}</p>
                  <div className="flex items-center gap-1">
                    {isRecommended && <Badge variant="outline" className="text-[9px] text-forge-emerald border-forge-emerald/30">rec</Badge>}
                    <Badge variant="outline" className="text-[10px]">{m.vram}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hardware-specific note */}
      {(hwProfile === "cpu_only" || hwProfile === "low_vram") && (
        <Card className="bg-forge-amber/5 border-forge-amber/20">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-forge-amber shrink-0" />
              <p className="text-xs text-muted-foreground">
                {hwProfile === "cpu_only" 
                  ? "Training will use your CPU and RAM. A 1B model with 50 samples takes ~30-60 min on 16GB DDR4. Grab a coffee ☕" 
                  : "We've tuned batch size to 1, shortened sequences, and enabled gradient checkpointing to fit in your VRAM."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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

  const readSavedLabState = () => {
    if (typeof window === "undefined") return { step: -1 as number, activeDatasetId: null as string | null };
    try {
      const raw = sessionStorage.getItem("slm-lab-state");
      if (!raw) return { step: -1 as number, activeDatasetId: null as string | null };
      const parsed = JSON.parse(raw) as { step?: number; activeDatasetId?: string | null };
      const safeStep = typeof parsed.step === "number" ? parsed.step : -1;
      return {
        // Step 0 is interview-only and can't be resumed safely after remount
        step: safeStep === 0 ? 2 : safeStep,
        activeDatasetId: parsed.activeDatasetId ?? null,
      };
    } catch {
      return { step: -1 as number, activeDatasetId: null as string | null };
    }
  };

  const [step, setStep] = useState<number>(() => readSavedLabState().step); // -1 = landing
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(() => readSavedLabState().activeDatasetId);
  const [showInterview, setShowInterview] = useState(false);

  // Cache dataset so component doesn't unmount during query refetches
  const cachedDatasetRef = useRef<TrainingDataset | null>(null);
  const liveDataset = datasets?.find(d => d.id === activeDatasetId);
  if (liveDataset) {
    cachedDatasetRef.current = liveDataset;
  }
  const activeDataset = liveDataset || cachedDatasetRef.current;

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(
      "slm-lab-state",
      JSON.stringify({ step, activeDatasetId })
    );
  }, [step, activeDatasetId]);

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
