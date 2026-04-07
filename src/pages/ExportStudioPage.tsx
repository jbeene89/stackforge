import { useState } from "react";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProjects, useModules, useStacks } from "@/hooks/useSupabaseData";
import { streamAI } from "@/hooks/useSupabaseData";
import {
  FileText, Download, Copy, Sparkles, Loader2, ChevronRight,
  BookOpen, Code2, MessageSquare, FileCode, Presentation,
  ScrollText, ClipboardList, Lightbulb, GraduationCap, Scale,
  CheckCircle2, ArrowRight, RefreshCw, Eye, Layers, Brain,
  Settings, Zap, X
} from "lucide-react";

type ExportFormat =
  | "whitepaper"
  | "system-prompt"
  | "technical-spec"
  | "api-docs"
  | "pitch-deck"
  | "readme";

interface FormatConfig {
  id: ExportFormat;
  label: string;
  icon: any;
  description: string;
  tone: string;
  lengthEstimate: string;
}

const exportFormats: FormatConfig[] = [
  { id: "whitepaper", label: "White Paper", icon: BookOpen, description: "Formal document with abstract, methodology, architecture, and analysis.", tone: "Academic / Formal", lengthEstimate: "15–25 pages" },
  { id: "system-prompt", label: "System Prompt", icon: MessageSquare, description: "Production-ready system prompt with persona, capabilities, and constraints.", tone: "Precise / Instructional", lengthEstimate: "2–5 pages" },
  { id: "technical-spec", label: "Technical Specification", icon: ClipboardList, description: "Engineering specification with requirements and architecture decisions.", tone: "Engineering / Precise", lengthEstimate: "10–20 pages" },
  { id: "api-docs", label: "API Documentation", icon: Code2, description: "OpenAPI-style documentation with endpoints and schemas.", tone: "Developer-friendly / Clear", lengthEstimate: "8–15 pages" },
  { id: "pitch-deck", label: "Pitch Deck Script", icon: Presentation, description: "Investor pitch narrative with problem/solution/market slides.", tone: "Persuasive / Compelling", lengthEstimate: "12–15 slides" },
  { id: "readme", label: "README.md", icon: FileCode, description: "GitHub-ready README with features, installation, and usage.", tone: "Developer-friendly / Markdown", lengthEstimate: "3–8 pages" },
];

export default function ExportStudioPage() {
  const { hasAccess, featureName, requiredTier, userTier } = useFeatureGate("export");
  const { data: projects } = useProjects();
  const { data: modules } = useModules();
  const { data: stacks } = useStacks();

  if (!hasAccess) {
    return <UpgradePrompt featureName={featureName} requiredTier={requiredTier} currentTier={userTier} />;
  }

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [customContext, setCustomContext] = useState("");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const allSources = [
    ...(projects || []).map(p => ({ id: p.id, name: p.name, type: "project" })),
    ...(modules || []).map(m => ({ id: m.id, name: m.name, type: "module" })),
    ...(stacks || []).map(s => ({ id: s.id, name: s.name, type: "stack" })),
  ];

  const selectedSourceData = allSources.find(s => s.id === selectedSource);

  const generate = async () => {
    if (!selectedFormat || !selectedSource) return;
    setIsGenerating(true);
    setOutput("");

    const source = selectedSourceData;
    const format = exportFormats.find(f => f.id === selectedFormat);

    const prompt = `Generate a ${format?.label} document for "${source?.name}" (${source?.type}). ${customContext ? `Additional context: ${customContext}` : ""} Use the ${format?.tone} tone. Be thorough and detailed.`;

    try {
      await streamAI({
        messages: [
          { role: "system", content: `You are a professional technical writer. Generate a ${format?.label} in ${format?.tone} tone.` },
          { role: "user", content: prompt },
        ],
        mode: "general",
        onDelta: (text) => setOutput(prev => prev + text),
        onDone: () => setIsGenerating(false),
      });
    } catch (err: any) {
      setIsGenerating(false);
      toast.error(err.message);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  };

  const [fallbackDialog, setFallbackDialog] = useState<{ open: boolean; blobUrl: string | null; filename: string }>({ open: false, blobUrl: null, filename: "" });

  const downloadOutput = () => {
    const blob = new Blob([output], { type: "text/markdown" });
    const filename = `${selectedFormat || "export"}.md`;
    const blobUrl = triggerDownload(blob, filename);
    setFallbackDialog({ open: true, blobUrl, filename });
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] animate-fade-in">
      {/* Left: Config */}
      <div className="w-[380px] border-r border-border flex flex-col">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Export Studio</h1>
          </div>
          <p className="text-xs text-muted-foreground">Generate professional documents from your projects.</p>
        </div>

        <ScrollArea className="flex-1 px-5 py-4">
          <div className="space-y-5">
            {/* Source selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</label>
              {allSources.length === 0 ? (
                <p className="text-xs text-muted-foreground">Create a project, module, or stack first.</p>
              ) : (
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger className="glass"><SelectValue placeholder="Select source…" /></SelectTrigger>
                  <SelectContent>
                    {(projects || []).length > 0 && (
                      <>
                        <div className="px-2 py-1 text-[10px] text-muted-foreground font-semibold">Projects</div>
                        {(projects || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </>
                    )}
                    {(modules || []).length > 0 && (
                      <>
                        <Separator className="my-1" />
                        <div className="px-2 py-1 text-[10px] text-muted-foreground font-semibold">Modules</div>
                        {(modules || []).map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                      </>
                    )}
                    {(stacks || []).length > 0 && (
                      <>
                        <Separator className="my-1" />
                        <div className="px-2 py-1 text-[10px] text-muted-foreground font-semibold">Stacks</div>
                        {(stacks || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Format selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Format</label>
              <div className="grid grid-cols-2 gap-2">
                {exportFormats.map((fmt) => {
                  const Icon = fmt.icon;
                  const isActive = selectedFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => setSelectedFormat(fmt.id)}
                      className={cn(
                        "glass rounded-lg p-3 text-left transition-all hover:border-primary/30",
                        isActive && "ring-2 ring-primary glow-primary"
                      )}
                    >
                      <Icon className="h-4 w-4 text-primary mb-1.5" />
                      <div className="text-xs font-semibold">{fmt.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{fmt.lengthEstimate}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom context */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Additional Context</label>
              <Textarea
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder="Add any extra context or instructions…"
                rows={3}
                className="text-sm"
              />
            </div>

            {/* Generate */}
            <Button
              className="w-full gradient-primary text-primary-foreground"
              disabled={!selectedFormat || !selectedSource || isGenerating}
              onClick={generate}
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generate Document</>
              )}
            </Button>
          </div>
        </ScrollArea>
      </div>

      {/* Right: Output */}
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Output</span>
            {isGenerating && <span className="h-2 w-2 rounded-full bg-forge-emerald animate-glow-pulse" />}
          </div>
          {output && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs" onClick={copyOutput}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={downloadOutput}>
                <Download className="h-3 w-3 mr-1" /> Download
              </Button>
            </div>
          )}
        </div>
        <ScrollArea className="flex-1">
          <pre className="p-6 text-sm font-mono whitespace-pre-wrap text-foreground/90 leading-relaxed">
            {output || <span className="text-muted-foreground italic">Generated document will appear here…</span>}
            {isGenerating && <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-glow-pulse" />}
          </pre>
        </ScrollArea>
      </div>
    </div>
  );
}
