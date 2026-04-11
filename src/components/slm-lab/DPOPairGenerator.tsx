import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Sparkles, Plus, Trash2, Download, Loader2, Copy, X,
  FileText, Zap, RotateCcw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DPOPair {
  prompt: string;
  chosen: string;
  rejected: string;
}

interface DPOPairGeneratorProps {
  defaultBehavior?: string;
}

export function DPOPairGenerator({ defaultBehavior = "" }: DPOPairGeneratorProps) {
  const [behavior, setBehavior] = useState(defaultBehavior);
  const [prompts, setPrompts] = useState<string[]>([""]);
  const [pairsPerPrompt, setPairsPerPrompt] = useState(1);
  const [pairs, setPairs] = useState<DPOPair[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const addPrompt = () => setPrompts(prev => [...prev, ""]);
  const removePrompt = (i: number) => setPrompts(prev => prev.filter((_, j) => j !== i));
  const updatePrompt = (i: number, val: string) =>
    setPrompts(prev => prev.map((p, j) => (j === i ? val : p)));

  const activePrompts = bulkMode
    ? bulkText.split("\n").map(l => l.trim()).filter(Boolean)
    : prompts.filter(p => p.trim());

  const generate = async () => {
    if (!behavior.trim() || activePrompts.length === 0) {
      toast.error("Enter a behavior and at least one prompt");
      return;
    }

    setIsGenerating(true);
    setProgress(10);
    const newPairs: DPOPair[] = [];

    try {
      // Call the MCP-backed edge function for DPO pair generation
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      // We'll call the AI generate function with a specialized prompt
      // that produces DPO pairs in the correct format
      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < activePrompts.length; i += batchSize) {
        batches.push(activePrompts.slice(i, i + batchSize));
      }

      for (let bIdx = 0; bIdx < batches.length; bIdx++) {
        const batch = batches[bIdx];
        setProgress(10 + ((bIdx / batches.length) * 80));

        const systemPrompt = `You are a DPO training data generator. For each user prompt below, generate ${pairsPerPrompt} DPO preference pair(s) targeting the behavior: "${behavior}".

Output ONLY valid JSON array. Each element must have exactly these fields:
- "prompt": the original prompt
- "chosen": the GOOD response (what the model SHOULD say)
- "rejected": the BAD response exhibiting the unwanted behavior "${behavior}"

Make rejected responses realistic — they should subtly exhibit the target behavior, not be obviously terrible. Chosen responses should be genuinely helpful and natural.

Output raw JSON array, no markdown fences, no explanation.`;

        const userContent = batch.map((p, i) => `Prompt ${i + 1}: ${p}`).join("\n");

        let fullOutput = "";

        await new Promise<void>((resolve, reject) => {
          const invokeAI = async () => {
            try {
              const resp = await supabase.functions.invoke("ai-generate", {
                body: {
                  messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userContent },
                  ],
                  mode: "general",
                },
              });

              if (resp.error) throw new Error(resp.error.message);

              // The response may be streamed or a direct response
              const text = typeof resp.data === "string" ? resp.data : JSON.stringify(resp.data);
              fullOutput = text;
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          invokeAI();
        });

        // Parse the JSON output
        try {
          // Try to extract JSON array from the response
          const jsonMatch = fullOutput.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as DPOPair[];
            newPairs.push(...parsed);
          }
        } catch (parseErr) {
          console.warn("Failed to parse batch", bIdx, parseErr);
          toast.error(`Failed to parse batch ${bIdx + 1} — try simpler prompts`);
        }
      }

      setPairs(prev => [...prev, ...newPairs]);
      setProgress(100);
      toast.success(`Generated ${newPairs.length} DPO pair${newPairs.length !== 1 ? "s" : ""}`);
    } catch (err: any) {
      toast.error(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const downloadJsonl = () => {
    if (pairs.length === 0) return;
    const lines = pairs.map(p => JSON.stringify(p)).join("\n");
    const blob = new Blob([lines], { type: "application/jsonl" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dpo_pairs_${Date.now()}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded dpo_pairs.jsonl");
  };

  const copyAll = () => {
    const lines = pairs.map(p => JSON.stringify(p)).join("\n");
    navigator.clipboard.writeText(lines);
    toast.success("Copied to clipboard");
  };

  const removePair = (i: number) => setPairs(prev => prev.filter((_, j) => j !== i));

  return (
    <div className="space-y-4">
      <Card className="glass border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-forge-amber" />
            <CardTitle className="text-sm">DPO Pair Generator</CardTitle>
            <Badge variant="outline" className="text-[9px]">CLOUD AI</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Generate chosen/rejected preference pairs for DPO training. Describe the behavior to suppress,
            add prompts, and get structured JSONL output ready for fine-tuning.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Behavior input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Target Behavior to Suppress</Label>
            <Input
              value={behavior}
              onChange={e => setBehavior(e.target.value)}
              placeholder="e.g. 'generic corporate tone', 'hallucinated citations', 'excessive hedging'"
              className="text-sm"
            />
          </div>

          {/* Prompts */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Test Prompts</Label>
              <div className="flex gap-1">
                <Button
                  variant={bulkMode ? "default" : "ghost"}
                  size="sm"
                  className="h-6 text-[10px]"
                  onClick={() => setBulkMode(!bulkMode)}
                >
                  {bulkMode ? "Bulk" : "Individual"}
                </Button>
              </div>
            </div>

            {bulkMode ? (
              <Textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder="One prompt per line:&#10;How do I train a dog?&#10;What is quantum computing?&#10;Write me a poem about rain"
                className="text-sm font-mono min-h-[100px]"
              />
            ) : (
              <div className="space-y-2">
                {prompts.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={p}
                      onChange={e => updatePrompt(i, e.target.value)}
                      placeholder={`Prompt ${i + 1}…`}
                      className="text-sm"
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addPrompt();
                        }
                      }}
                    />
                    {prompts.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removePrompt(i)} className="shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addPrompt} className="text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add Prompt
                </Button>
              </div>
            )}
          </div>

          {/* Pairs per prompt */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Pairs per Prompt</Label>
              <span className="text-xs font-mono text-muted-foreground">{pairsPerPrompt}</span>
            </div>
            <Slider
              value={[pairsPerPrompt]}
              onValueChange={([v]) => setPairsPerPrompt(v)}
              min={1} max={5} step={1}
            />
            <p className="text-[10px] text-muted-foreground">
              Will generate ~{activePrompts.length * pairsPerPrompt} pairs total
            </p>
          </div>

          {/* Generate button */}
          {progress > 0 && <Progress value={progress} className="h-1.5" />}
          <Button
            onClick={generate}
            disabled={isGenerating || !behavior.trim() || activePrompts.length === 0}
            className="w-full gradient-primary text-primary-foreground"
          >
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate DPO Pairs</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {pairs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="glass">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">Generated Pairs</CardTitle>
                    <Badge variant="outline" className="text-[10px]">{pairs.length} pairs</Badge>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={copyAll}>
                      <Copy className="h-3 w-3 mr-1" /> Copy JSONL
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={downloadJsonl}>
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] text-destructive" onClick={() => { setPairs([]); toast("Cleared all pairs"); }}>
                      <RotateCcw className="h-3 w-3 mr-1" /> Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-2">
                    {pairs.map((pair, i) => (
                      <div key={i} className="glass rounded-lg p-3 space-y-2 relative group">
                        <button
                          onClick={() => removePair(i)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Prompt</span>
                          <p className="text-xs font-mono">{pair.prompt}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="rounded-md bg-emerald-500/5 border border-emerald-500/20 p-2">
                            <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">✓ Chosen</span>
                            <p className="text-xs mt-1 text-foreground/80 line-clamp-4">{pair.chosen}</p>
                          </div>
                          <div className="rounded-md bg-destructive/5 border border-destructive/20 p-2">
                            <span className="text-[10px] text-destructive uppercase tracking-wider font-semibold">✗ Rejected</span>
                            <p className="text-xs mt-1 text-foreground/80 line-clamp-4">{pair.rejected}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
