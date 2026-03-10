import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Play, Save, RotateCcw, Send,
  Sparkles, Shield, Zap, Brain, Clock, MessageSquare
} from "lucide-react";
import { useModule, useUpdateModule, useCreateRun, streamAI } from "@/hooks/useSupabaseData";
import DiscussionThread from "@/components/DiscussionThread";
import PublishToMarketplace from "@/components/PublishToMarketplace";

export default function ModuleBuilderPage() {
  const { id } = useParams();
  const { data: mod, isLoading } = useModule(id || "");
  const updateModule = useUpdateModule();
  const createRun = useCreateRun();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [goal, setGoal] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(1500);
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("config");

  useEffect(() => {
    if (mod) {
      setName(mod.name);
      setRole(mod.role || "");
      setGoal(mod.goal || "");
      setSystemPrompt(mod.system_prompt || "");
      setTemperature(Number(mod.temperature) || 0.3);
      setMaxTokens(mod.max_tokens || 1500);
    }
  }, [mod]);

  if (isLoading) return <div className="p-6"><Skeleton className="h-12 w-64 mb-4" /><Skeleton className="h-[400px]" /></div>;
  if (!mod) return <div className="p-6 text-muted-foreground">Module not found.</div>;

  const handleSave = () => {
    updateModule.mutate({
      id: mod.id,
      name,
      role,
      goal,
      system_prompt: systemPrompt,
      // temperature and max_tokens would need the update type to accept them
    });
  };

  const runTest = async () => {
    if (!testInput.trim()) return;
    setIsRunning(true);
    setTestOutput("");
    const startTime = Date.now();
    try {
      await streamAI({
        messages: [
          { role: "system", content: systemPrompt || `You are ${name}. ${role}` },
          { role: "user", content: testInput },
        ],
        mode: "code",
        onDelta: (text) => setTestOutput(prev => (prev || "") + text),
        onDone: () => {
          setIsRunning(false);
          const duration = Date.now() - startTime;
          createRun.mutate({
            target_type: "module",
            target_id: mod.id,
            target_name: mod.name,
            status: "success",
            steps: [{ label: "AI Generation", durationMs: duration, input: testInput.slice(0, 200) }],
          });
          toast.success(`Test completed in ${(duration / 1000).toFixed(1)}s`);
        },
      });
    } catch (err: any) {
      setIsRunning(false);
      setTestOutput(`Error: ${err.message}`);
      toast.error("Test failed");
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-forge-amber" />
          <h1 className="text-lg font-bold">{mod.name}</h1>
          <Badge variant="outline" className="text-[10px]">{mod.type}</Badge>
          {mod.slm_mode && <Badge className="bg-forge-cyan/15 text-forge-cyan border-forge-cyan/30 text-[10px]">SLM</Badge>}
          <span className="text-xs text-muted-foreground">v{mod.version_count}</span>
        </div>
        <div className="flex items-center gap-2">
          <PublishToMarketplace
            type="module"
            sourceId={mod.id}
            sourceName={mod.name}
            templateData={{ name: mod.name, role: mod.role, type: mod.type, system_prompt: mod.system_prompt, goal: mod.goal, temperature: mod.temperature, max_tokens: mod.max_tokens }}
          />
          <DiscussionThread targetType="module" targetId={mod.id} targetName={mod.name} />
          <Button size="sm" className="gradient-primary text-primary-foreground" onClick={handleSave} disabled={updateModule.isPending}>
            <Save className="h-4 w-4 mr-1" /> {updateModule.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 border-r border-border overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-4 mt-3 glass w-fit">
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="guardrails">Guardrails</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-5">
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Sparkles className="h-3 w-3" /> Identity</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label className="text-xs">Name</Label><Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Role</Label><Input value={role} onChange={e => setRole(e.target.value)} className="h-8 text-sm" /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">Goal</Label><Textarea value={goal} onChange={e => setGoal(e.target.value)} rows={2} className="text-sm" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">System Prompt</Label><Textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={5} className="font-mono text-xs" /></div>
                  </section>

                  <Separator />

                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Zap className="h-3 w-3" /> Model Settings</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between"><Label className="text-xs">Temperature</Label><span className="text-xs text-muted-foreground font-mono">{temperature}</span></div>
                      <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} max={1} step={0.05} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between"><Label className="text-xs">Max Tokens</Label><span className="text-xs text-muted-foreground font-mono">{maxTokens}</span></div>
                      <Slider value={[maxTokens]} onValueChange={([v]) => setMaxTokens(v)} max={4000} step={100} />
                    </div>
                  </section>

                  <Separator />

                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Shield className="h-3 w-3" /> Flags</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "SLM Mode", value: mod.slm_mode },
                        { label: "Deterministic", value: mod.deterministic_mode },
                        { label: "Memory", value: mod.memory_enabled },
                        { label: "Tool Access", value: mod.tool_access_enabled },
                      ].map((flag) => (
                        <div key={flag.label} className="flex items-center justify-between glass rounded-lg px-3 py-2">
                          <Label className="text-xs">{flag.label}</Label>
                          <Switch defaultChecked={flag.value} className="scale-75" />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="guardrails" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Constraints</Label>
                    {(mod.constraints || []).map((c, i) => (
                      <div key={i} className="flex items-center gap-2 glass rounded-lg px-3 py-2">
                        <Shield className="h-3 w-3 text-forge-rose shrink-0" />
                        <span className="text-sm flex-1">{c}</span>
                      </div>
                    ))}
                    {!(mod.constraints?.length) && <p className="text-xs text-muted-foreground">No constraints defined.</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Guardrails</Label>
                    {(mod.guardrails || []).map((g, i) => (
                      <div key={i} className="flex items-center gap-2 glass rounded-lg px-3 py-2">
                        <Shield className="h-3 w-3 text-forge-amber shrink-0" />
                        <span className="text-sm flex-1">{g}</span>
                      </div>
                    ))}
                    {!(mod.guardrails?.length) && <p className="text-xs text-muted-foreground">No guardrails defined.</p>}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Test Panel */}
        <div className="w-[420px] flex flex-col bg-muted/30">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Play className="h-3.5 w-3.5 text-forge-emerald" /> Live Test</h2>
          </div>
          <div className="p-4 space-y-2">
            <Label className="text-xs">Test Input</Label>
            <Textarea value={testInput} onChange={(e) => setTestInput(e.target.value)} placeholder="Enter test input…" rows={4} className="text-sm" />
            <Button onClick={runTest} disabled={isRunning || !testInput.trim()} size="sm" className="w-full gradient-primary text-primary-foreground">
              {isRunning ? <><RotateCcw className="h-3.5 w-3.5 mr-1 animate-spin" /> Running…</> : <><Send className="h-3.5 w-3.5 mr-1" /> Run Test</>}
            </Button>
          </div>
          <Separator />
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-2 flex items-center justify-between">
              <Label className="text-xs">Output</Label>
              {testOutput && !isRunning && <Badge variant="outline" className="text-[10px] text-forge-emerald border-forge-emerald/30">success</Badge>}
            </div>
            <ScrollArea className="flex-1 px-4 pb-4">
              {testOutput ? (
                <pre className="text-xs font-mono whitespace-pre-wrap text-foreground leading-relaxed">{testOutput}</pre>
              ) : isRunning ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <RotateCcw className="h-8 w-8 animate-spin mb-3 text-primary" />
                  <p className="text-sm">Processing…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mb-3 animate-glow-pulse" />
                  <p className="text-sm">No output yet</p>
                  <p className="text-[10px]">Run a test to see AI output</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
