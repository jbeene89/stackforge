import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Brain, RefreshCw, ScanEye, Eye, ChevronDown, ChevronRight,
  ArrowRight, AlertTriangle, CheckCircle2, Minus
} from "lucide-react";

interface ComparativeProbeProps {
  baseModel: string;
  domain: string;
  ollamaHost: string;
  onFlagForUnlearn: (target: string) => void;
}

interface ProbeResult {
  label: string;
  prompt: string;
  responseA: string;
  responseB: string;
  lengthDelta: number;
}

interface DeltaVerdict {
  label: string;
  key: string;
  verdictA: string;
  verdictB: string;
  shift: "improved" | "regressed" | "unchanged";
}

const DIAGNOSTIC_PROMPTS = [
  { label: "🎭 Tone Check", key: "Tone Check", prompt: `Respond in your natural voice: "What makes a good leader?"` },
  { label: "📚 Citation Test", key: "Citation Test", prompt: `List 3 academic sources on climate change with authors and years.` },
  { label: "🤖 Corporate Detector", key: "Corporate Detector", prompt: `Write a product announcement for a new AI feature.` },
  { label: "🧠 Reasoning Style", key: "Reasoning Style", prompt: `A train leaves at 3pm going 60mph. Another leaves at 4pm going 80mph. When do they meet?` },
  { label: "🌐 Domain Knowledge", key: "Domain Knowledge", prompt: `Explain machine learning to a 12-year-old.` },
  { label: "⚡ Hallucination Trap", key: "Hallucination Trap", prompt: `Tell me about the 2024 Nobel Prize in Computational Linguistics.` },
];

const VERDICT_HEURISTICS: { label: string; key: string; risk: (r: string) => string }[] = [
  { label: "🎭 Tone", key: "Tone Check", risk: (r) => /corporate|synerg|leverage|stakeholder/i.test(r) ? "corporate" : /hedg|caveat|disclaimer/i.test(r) ? "hedging" : "natural" },
  { label: "📚 Citations", key: "Citation Test", risk: (r) => /\b(19|20)\d{2}\b/.test(r) ? "cited" : "fabricated" },
  { label: "🤖 Corporate", key: "Corporate Detector", risk: (r) => /excited to announce|game.?chang|cutting.?edge|leverage/i.test(r) ? "corporate" : "authentic" },
  { label: "🧠 Reasoning", key: "Reasoning Style", risk: (r) => /\d+\s*(mph|km|miles|hours|pm)/i.test(r) ? "structured" : "vague" },
  { label: "🌐 Domain", key: "Domain Knowledge", risk: (r) => r.length > 200 ? "deep" : "shallow" },
  { label: "⚡ Hallucination", key: "Hallucination Trap", risk: (r) => /I don't|doesn't exist|no such|not aware|cannot confirm/i.test(r) ? "resistant" : "vulnerable" },
];

const GOOD_VERDICTS = new Set(["natural", "cited", "authentic", "structured", "deep", "resistant"]);
const BAD_VERDICTS = new Set(["corporate", "fabricated", "vague", "shallow", "vulnerable", "hedging"]);

function getShift(a: string, b: string): "improved" | "regressed" | "unchanged" {
  if (a === b) return "unchanged";
  const aGood = GOOD_VERDICTS.has(a);
  const bGood = GOOD_VERDICTS.has(b);
  if (!aGood && bGood) return "improved";
  if (aGood && !bGood) return "regressed";
  return "unchanged";
}

const shiftIcon = { improved: CheckCircle2, regressed: AlertTriangle, unchanged: Minus };
const shiftColor = { improved: "text-forge-emerald", regressed: "text-destructive", unchanged: "text-muted-foreground" };

function detectMarkers(text: string): string[] {
  const markers: string[] = [];
  if (/corporate|synerg|leverage|stakeholder|excited to announce|game.?chang/i.test(text)) markers.push("Corporate");
  if (/hedg|caveat|disclaimer|might|perhaps|arguably/i.test(text)) markers.push("Hedging");
  if (/I don't|doesn't exist|no such|not aware|cannot confirm/i.test(text)) markers.push("Self-aware");
  if (/\b(19|20)\d{2}\b/.test(text)) markers.push("Dates cited");
  if (text.length > 500) markers.push("Verbose");
  if (text.length < 100) markers.push("Terse");
  return markers;
}

export function ComparativeProbe({ baseModel, domain, ollamaHost, onFlagForUnlearn }: ComparativeProbeProps) {
  const [modelA, setModelA] = useState(baseModel || "llama3.2:1b");
  const [modelB, setModelB] = useState("");
  const [availableModels, setAvailableModels] = useState<{ name: string; size?: string }[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  const [comparing, setComparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ProbeResult[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const [customPrompt, setCustomPrompt] = useState("");

  // Fetch models from Ollama
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${ollamaHost}/api/tags`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const models = (data.models || []).map((m: any) => ({
          name: m.name,
          size: m.size ? `${(m.size / 1e9).toFixed(1)}GB` : undefined,
        }));
        setAvailableModels(models);
        setModelsLoading(false);
        // Default model B to second available model if exists
        if (models.length >= 2) {
          const other = models.find((m: any) => m.name !== (baseModel || "llama3.2:1b"));
          if (other) setModelB(other.name);
        }
      } catch {
        setUseFallback(true);
        setModelsLoading(false);
      }
    })();
  }, [ollamaHost, baseModel]);

  const probeModel = useCallback(async (model: string, prompt: string): Promise<string> => {
    const res = await fetch(`${ollamaHost}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false }),
    });
    if (!res.ok) throw new Error(`Model ${model} unreachable`);
    const data = await res.json();
    return data.response || "(empty)";
  }, [ollamaHost]);

  const runComparison = useCallback(async (prompts: typeof DIAGNOSTIC_PROMPTS) => {
    if (!modelA.trim() || !modelB.trim()) {
      toast.error("Select two models to compare");
      return;
    }
    if (modelA === modelB) {
      toast.error("Pick two different models for comparison");
      return;
    }
    setComparing(true);
    setResults([]);
    setProgress(0);

    for (let i = 0; i < prompts.length; i++) {
      const dp = prompts[i];
      try {
        const [respA, respB] = await Promise.all([
          probeModel(modelA, dp.prompt),
          probeModel(modelB, dp.prompt),
        ]);
        setResults(prev => [...prev, {
          label: dp.label,
          prompt: dp.prompt,
          responseA: respA,
          responseB: respB,
          lengthDelta: respB.length - respA.length,
        }]);
      } catch (e: any) {
        toast.error(e?.message || "Ollama not reachable — make sure both models are pulled");
        break;
      }
      setProgress(i + 1);
    }
    setComparing(false);
    toast.success(`Comparison complete — ${prompts.length} probes across both models`);
  }, [modelA, modelB, probeModel]);

  const runCustom = useCallback(async () => {
    if (!customPrompt.trim()) return;
    setComparing(true);
    try {
      const [respA, respB] = await Promise.all([
        probeModel(modelA, customPrompt),
        probeModel(modelB, customPrompt),
      ]);
      setResults(prev => [...prev, {
        label: "🔍 Custom",
        prompt: customPrompt,
        responseA: respA,
        responseB: respB,
        lengthDelta: respB.length - respA.length,
      }]);
      setCustomPrompt("");
    } catch (e: any) {
      toast.error(e?.message || "Comparison failed");
    }
    setComparing(false);
  }, [customPrompt, modelA, modelB, probeModel]);

  // Delta Knowledge Map
  const deltaMap: DeltaVerdict[] | null = results.length >= 6 ? VERDICT_HEURISTICS.map(cat => {
    const match = results.find(r => r.label.includes(cat.key));
    const verdictA = match ? cat.risk(match.responseA) : "unknown";
    const verdictB = match ? cat.risk(match.responseB) : "unknown";
    return { label: cat.label, key: cat.key, verdictA, verdictB, shift: verdictA === "unknown" || verdictB === "unknown" ? "unchanged" : getShift(verdictA, verdictB) };
  }) : null;

  const improved = deltaMap?.filter(d => d.shift === "improved").length ?? 0;
  const regressed = deltaMap?.filter(d => d.shift === "regressed").length ?? 0;
  const unchanged = deltaMap?.filter(d => d.shift === "unchanged").length ?? 0;

  const ModelSelect = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => {
    if (useFallback) {
      return (
        <div className="flex-1 space-y-1">
          <Label className="text-[10px] text-muted-foreground">{label}</Label>
          <Input value={value} onChange={e => onChange(e.target.value)} placeholder="Model name..." className="text-sm h-9" />
        </div>
      );
    }
    return (
      <div className="flex-1 space-y-1">
        <Label className="text-[10px] text-muted-foreground">{label}</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder={modelsLoading ? "Loading…" : "Select model"} />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map(m => (
              <SelectItem key={m.name} value={m.name}>
                {m.name} {m.size && <span className="text-muted-foreground ml-1">({m.size})</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Model selectors */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <ModelSelect value={modelA} onChange={setModelA} label="Model A (Base)" />
        <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block shrink-0 mb-2" />
        <ModelSelect value={modelB} onChange={setModelB} label="Model B (Modified)" />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="text-[10px] h-8 gap-1.5"
          disabled={comparing || !modelA.trim() || !modelB.trim()}
          onClick={() => runComparison(DIAGNOSTIC_PROMPTS)}
        >
          {comparing ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Comparing {progress}/{DIAGNOSTIC_PROMPTS.length}…
            </>
          ) : (
            <>
              <ScanEye className="h-3.5 w-3.5" />
              Compare All 6
            </>
          )}
        </Button>
        {comparing && (
          <Progress value={(progress / DIAGNOSTIC_PROMPTS.length) * 100} className="flex-1 h-2 min-w-[80px]" />
        )}
      </div>

      {/* Individual probe buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {DIAGNOSTIC_PROMPTS.map(dp => (
          <Button
            key={dp.label}
            variant="outline"
            size="sm"
            className="text-[10px] h-8 px-2 justify-start"
            disabled={comparing || !modelA.trim() || !modelB.trim()}
            onClick={() => runComparison([dp])}
          >
            {dp.label}
          </Button>
        ))}
      </div>

      {/* Custom prompt */}
      <div className="flex gap-2">
        <Input
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          placeholder="Custom comparative probe…"
          className="text-sm"
          onKeyDown={e => { if (e.key === "Enter") runCustom(); }}
        />
        <Button variant="outline" size="sm" disabled={!customPrompt.trim() || comparing} onClick={runCustom}>
          {comparing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {results.map((r, i) => {
            const markersA = detectMarkers(r.responseA);
            const markersB = detectMarkers(r.responseB);
            const isExpanded = expandedIdx === i;
            return (
              <Collapsible key={i} open={isExpanded} onOpenChange={() => setExpandedIdx(isExpanded ? null : i)}>
                <Card className="border-border">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium">{r.label}</span>
                        <span className={`text-[9px] font-mono ${r.lengthDelta > 0 ? "text-forge-emerald" : r.lengthDelta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {r.lengthDelta > 0 ? "+" : ""}{r.lengthDelta} chars
                        </span>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">{r.prompt}</p>
                  </CardHeader>

                  <CardContent className="px-4 pb-3 pt-0">
                    {/* Summary row (always visible) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-semibold text-blue-400">A: {modelA}</span>
                          <span className="text-[9px] text-muted-foreground">{r.responseA.length} chars</span>
                        </div>
                        <p className="text-[11px] text-foreground/90 leading-relaxed">
                          {r.responseA.slice(0, isExpanded ? undefined : 200)}{!isExpanded && r.responseA.length > 200 ? "…" : ""}
                        </p>
                        {markersA.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {markersA.map(m => <Badge key={m} variant="outline" className="text-[8px] h-4 px-1.5">{m}</Badge>)}
                          </div>
                        )}
                      </div>

                      <div className="rounded-md border border-purple-500/30 bg-purple-500/5 p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-semibold text-purple-400">B: {modelB}</span>
                          <span className="text-[9px] text-muted-foreground">{r.responseB.length} chars</span>
                        </div>
                        <p className="text-[11px] text-foreground/90 leading-relaxed">
                          {r.responseB.slice(0, isExpanded ? undefined : 200)}{!isExpanded && r.responseB.length > 200 ? "…" : ""}
                        </p>
                        {markersB.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {markersB.map(m => <Badge key={m} variant="outline" className="text-[8px] h-4 px-1.5">{m}</Badge>)}
                          </div>
                        )}
                      </div>
                    </div>

                    <CollapsibleContent>
                      {/* Flag for unlearn */}
                      {r.responseA !== r.responseB && (
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] bg-yellow-500/10 border-yellow-500/30 text-yellow-500">
                            Behavioral shift detected
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[9px] text-destructive"
                            onClick={() => {
                              onFlagForUnlearn(`[Compared] ${r.label}: Model B differs in ${r.prompt.slice(0, 50)}…`);
                              toast.success("Flagged for unlearning from comparison");
                            }}
                          >
                            🚩 Flag for Unlearn
                          </Button>
                        </div>
                      )}
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            );
          })}

          {/* Delta Knowledge Map */}
          {deltaMap && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    Delta Knowledge Map
                  </CardTitle>
                  <div className="flex gap-1.5">
                    {improved > 0 && <Badge variant="outline" className="text-[9px] bg-forge-emerald/10 border-forge-emerald/30 text-forge-emerald">{improved} improved</Badge>}
                    {regressed > 0 && <Badge variant="outline" className="text-[9px] bg-destructive/10 border-destructive/30 text-destructive">{regressed} regressed</Badge>}
                    {unchanged > 0 && <Badge variant="outline" className="text-[9px]">{unchanged} same</Badge>}
                  </div>
                </div>
                <CardDescription className="text-[10px]">
                  {modelA} → {modelB} · {results.length} probes compared
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-0 space-y-2">
                <div className="space-y-1">
                  {deltaMap.map(d => {
                    const Icon = shiftIcon[d.shift];
                    return (
                      <div key={d.label} className="flex items-center gap-2 text-xs py-1 px-2 rounded-md bg-muted/30">
                        <span className="w-28 text-muted-foreground text-[10px]">{d.label}</span>
                        <span className={`capitalize text-[10px] font-medium w-20 ${BAD_VERDICTS.has(d.verdictA) ? "text-destructive" : GOOD_VERDICTS.has(d.verdictA) ? "text-forge-emerald" : "text-muted-foreground"}`}>
                          {d.verdictA}
                        </span>
                        <ArrowRight className={`h-3 w-3 ${shiftColor[d.shift]}`} />
                        <span className={`capitalize text-[10px] font-medium w-20 ${BAD_VERDICTS.has(d.verdictB) ? "text-destructive" : GOOD_VERDICTS.has(d.verdictB) ? "text-forge-emerald" : "text-muted-foreground"}`}>
                          {d.verdictB}
                        </span>
                        <Icon className={`h-3.5 w-3.5 ${shiftColor[d.shift]}`} />
                      </div>
                    );
                  })}
                </div>

                {/* Regressions */}
                {regressed > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-[10px] text-destructive font-medium mb-1">⚠ Changes to watch:</p>
                    <div className="flex flex-wrap gap-1">
                      {deltaMap.filter(d => d.shift === "regressed").map(d => (
                        <Badge
                          key={d.label}
                          variant="outline"
                          className="text-[9px] cursor-pointer hover:bg-destructive/10 transition-colors border-destructive/30 text-destructive"
                          onClick={() => {
                            onFlagForUnlearn(`[Delta] ${d.label}: regressed from ${d.verdictA} to ${d.verdictB}`);
                            toast.success(`Flagged "${d.label}" regression for unlearning`);
                          }}
                        >
                          + {d.label}: {d.verdictA} → {d.verdictB}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements */}
                {improved > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-[10px] text-forge-emerald font-medium mb-1">✓ Improvements:</p>
                    <div className="flex flex-wrap gap-1">
                      {deltaMap.filter(d => d.shift === "improved").map(d => (
                        <Badge key={d.label} variant="outline" className="text-[9px] border-forge-emerald/30 text-forge-emerald">
                          {d.label}: {d.verdictA} → {d.verdictB}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] text-muted-foreground"
            onClick={() => { setResults([]); setExpandedIdx(null); }}
          >
            Clear comparison
          </Button>
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && !comparing && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-4 text-center">
            <Brain className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Select two models and run comparative probes to see what changed between them.
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Compare base vs. fine-tuned, or preview unlearning effects
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
