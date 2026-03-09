import { useState } from "react";
import { useParams } from "react-router-dom";
import { mockModules } from "@/data/mock-data";
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
import {
  Play, Save, RotateCcw, History, Copy, Trash2, Send,
  Sparkles, Shield, Zap, Brain, Clock, ChevronRight
} from "lucide-react";

const mockTestResponses = [
  { input: "Dock repair project at Miami Marina. Aging wooden pilings need replacement, 40 slips affected.", output: "## Scope Summary\n\n**Project:** Dock Repair — Miami Marina\n**Type:** Marine Structural Rehabilitation\n\n### Work Items\n1. Wooden piling replacement (40 slips)\n2. Structural assessment of existing dock framework\n3. Marine-grade hardware replacement\n4. Environmental compliance documentation\n\n### Constraints\n- Active marina — phased approach required\n- Hurricane season consideration (Jun–Nov)\n- Marine wildlife protection protocols", duration: 2400 },
  { input: "Underwater inspection of bridge foundation supports, saltwater environment, depth 30ft.", output: "## Scope Summary\n\n**Project:** Bridge Foundation Inspection\n**Type:** Marine Infrastructure Assessment\n\n### Work Items\n1. Underwater visual inspection (30ft depth)\n2. Structural integrity mapping of foundation supports\n3. Corrosion assessment in saltwater environment\n4. Photographic/video documentation\n\n### Constraints\n- Dive team safety protocols required\n- Current/tide scheduling\n- Bridge traffic management coordination", duration: 1800 },
];

const versionHistory = [
  { version: 6, date: "Mar 5, 2026", note: "Tightened task boundaries", status: "current" as const },
  { version: 5, date: "Mar 1, 2026", note: "Added guardrails for ambiguous input", status: "previous" as const },
  { version: 4, date: "Feb 22, 2026", note: "Switched to gpt-4o", status: "previous" as const },
  { version: 3, date: "Feb 15, 2026", note: "Reduced temperature to 0.3", status: "previous" as const },
  { version: 2, date: "Feb 8, 2026", note: "Added output format constraints", status: "previous" as const },
  { version: 1, date: "Jan 10, 2026", note: "Initial version", status: "previous" as const },
];

export default function ModuleBuilderPage() {
  const { id } = useParams();
  const mod = mockModules.find((m) => m.id === id);
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [temperature, setTemperature] = useState(mod?.temperature ?? 0.3);
  const [maxTokens, setMaxTokens] = useState(mod?.maxTokens ?? 1500);
  const [activeTab, setActiveTab] = useState("config");

  if (!mod) {
    return <div className="p-6 text-muted-foreground">Module not found.</div>;
  }

  const runTest = () => {
    if (!testInput.trim()) return;
    setIsRunning(true);
    setTestOutput(null);
    const mock = mockTestResponses[Math.floor(Math.random() * mockTestResponses.length)];
    setTimeout(() => {
      setTestOutput(mock.output);
      setIsRunning(false);
    }, mock.duration);
  };

  const loadExample = (idx: number) => {
    setTestInput(mockTestResponses[idx].input);
    setTestOutput(null);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-forge-amber" />
          <h1 className="text-lg font-bold">{mod.name}</h1>
          <Badge variant="outline" className="text-[10px]">{mod.type}</Badge>
          {mod.slmMode && <Badge className="bg-forge-cyan/15 text-forge-cyan border-forge-cyan/30 text-[10px]">SLM</Badge>}
          <span className="text-xs text-muted-foreground">v{mod.versionCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm"><History className="h-4 w-4 mr-1" /> History</Button>
          <Button variant="ghost" size="sm"><Copy className="h-4 w-4 mr-1" /> Clone</Button>
          <Button size="sm" className="gradient-primary text-primary-foreground"><Save className="h-4 w-4 mr-1" /> Save</Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Config */}
        <div className="flex-1 border-r border-border overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-4 mt-3 glass w-fit">
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="guardrails">Guardrails</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-5">
                  {/* Identity */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-3 w-3" /> Identity
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label className="text-xs">Name</Label><Input defaultValue={mod.name} className="h-8 text-sm" /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Role</Label><Input defaultValue={mod.role} className="h-8 text-sm" /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">Goal</Label><Textarea defaultValue={mod.goal} rows={2} className="text-sm" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">System Prompt</Label><Textarea defaultValue={mod.systemPrompt} rows={5} className="font-mono text-xs" /></div>
                  </section>

                  <Separator />

                  {/* Behavior */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Zap className="h-3 w-3" /> Behavior
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label className="text-xs">Task Boundaries</Label><Textarea defaultValue={mod.taskBoundaries} rows={2} className="text-sm" /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Output Format</Label><Input defaultValue={mod.outputFormat} className="h-8 text-sm" /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">Tone</Label><Input defaultValue={mod.tone} className="h-8 text-sm" /></div>
                  </section>

                  <Separator />

                  {/* Model Settings */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Brain className="h-3 w-3" /> Model
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label className="text-xs">Provider</Label><Input defaultValue={mod.provider} className="h-8 text-sm" /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Model</Label><Input defaultValue={mod.model} className="h-8 text-sm" /></div>
                    </div>
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

                  {/* Toggles */}
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Shield className="h-3 w-3" /> Flags
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "SLM Mode", key: "slmMode" },
                        { label: "Deterministic", key: "deterministicMode" },
                        { label: "Low Context Window", key: "lowContextWindow" },
                        { label: "Concise Output", key: "conciseOutput" },
                        { label: "Memory", key: "memoryEnabled" },
                        { label: "Tool Access", key: "toolAccessEnabled" },
                      ].map((flag) => (
                        <div key={flag.key} className="flex items-center justify-between glass rounded-lg px-3 py-2">
                          <Label className="text-xs">{flag.label}</Label>
                          <Switch defaultChecked={(mod as any)[flag.key]} className="scale-75" />
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
                    {mod.constraints.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 glass rounded-lg px-3 py-2">
                        <Shield className="h-3 w-3 text-forge-rose shrink-0" />
                        <span className="text-sm flex-1">{c}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full text-xs">+ Add Constraint</Button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Guardrails</Label>
                    {mod.guardrails.map((g, i) => (
                      <div key={i} className="flex items-center gap-2 glass rounded-lg px-3 py-2">
                        <Shield className="h-3 w-3 text-forge-amber shrink-0" />
                        <span className="text-sm flex-1">{g}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full text-xs">+ Add Guardrail</Button>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Allowed Inputs</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {mod.allowedInputs.map((inp) => (
                        <Badge key={inp} variant="secondary" className="text-[10px]">{inp}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Expected Outputs</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {mod.expectedOutputs.map((out) => (
                        <Badge key={out} variant="secondary" className="text-[10px]">{out}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="versions" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {versionHistory.map((v) => (
                    <div key={v.version} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${v.status === "current" ? "glass glow-primary" : "hover:bg-muted/50"}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${v.status === "current" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {v.version}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{v.note}</p>
                        <p className="text-[10px] text-muted-foreground">{v.date}</p>
                      </div>
                      {v.status === "current" && <Badge className="text-[10px] bg-forge-emerald/15 text-forge-emerald">current</Badge>}
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Test Panel */}
        <div className="w-[420px] flex flex-col bg-muted/30">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Play className="h-3.5 w-3.5 text-forge-emerald" /> Live Test</h2>
            <div className="flex gap-1">
              {mockTestResponses.map((_, i) => (
                <Button key={i} variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={() => loadExample(i)}>Example {i + 1}</Button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 space-y-2">
            <Label className="text-xs">Test Input</Label>
            <Textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter test input for this module..."
              rows={4}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={runTest} disabled={isRunning || !testInput.trim()} size="sm" className="flex-1 gradient-primary text-primary-foreground">
                {isRunning ? <><RotateCcw className="h-3.5 w-3.5 mr-1 animate-spin" /> Running...</> : <><Send className="h-3.5 w-3.5 mr-1" /> Run Test</>}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Output */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-2 flex items-center justify-between">
              <Label className="text-xs">Output</Label>
              {testOutput && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>~{(mockTestResponses[0].duration / 1000).toFixed(1)}s</span>
                  <Badge variant="outline" className="text-[10px] text-forge-emerald border-forge-emerald/30">success</Badge>
                </div>
              )}
            </div>
            <ScrollArea className="flex-1 px-4 pb-4">
              {testOutput ? (
                <pre className="text-xs font-mono whitespace-pre-wrap text-foreground leading-relaxed">{testOutput}</pre>
              ) : isRunning ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <RotateCcw className="h-8 w-8 animate-spin mb-3 text-primary" />
                  <p className="text-sm">Processing...</p>
                  <p className="text-[10px]">Simulating {mod.model} response</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mb-3 animate-glow-pulse" />
                  <p className="text-sm">No output yet</p>
                  <p className="text-[10px]">Run a test or load an example</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
