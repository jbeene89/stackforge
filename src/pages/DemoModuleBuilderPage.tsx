import { useState } from "react";
import { Link } from "react-router-dom";
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
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Play, Save, RotateCcw, Send, Sparkles, Shield, Zap, Brain,
  ArrowRight, Lock, LogIn, UserPlus,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const DEMO_PRESETS = [
  {
    name: "Email Classifier",
    role: "Classifies incoming emails into categories",
    type: "classifier",
    goal: "Sort emails by intent: support, sales, billing, spam",
    systemPrompt: "You are an email classifier. Given an email, respond with exactly one category: SUPPORT, SALES, BILLING, or SPAM. Then on the next line, provide a one-sentence reason.",
    temperature: 0.1,
    testInput: "Subject: Invoice #4521 overdue\n\nHi, I noticed my invoice from last month hasn't been paid yet. Can you check on this? Thanks, Sarah",
  },
  {
    name: "Scope Summarizer",
    role: "Summarizes project scope from raw notes",
    type: "specialist",
    goal: "Turn messy field notes into structured scope summaries",
    systemPrompt: "You are a construction scope summarizer. Given raw field notes or project descriptions, output a structured summary with: 1) Project Type, 2) Key Tasks, 3) Materials Needed, 4) Estimated Complexity (Low/Medium/High). Be concise and professional.",
    temperature: 0.3,
    testInput: "dock repair job, 40ft floating dock, about 12 pilings need replacing, some decking boards rotted through, customer wants LED lighting added, north side of marina, tide is an issue, need barge access",
  },
  {
    name: "Red Team Critic",
    role: "Finds flaws and risks in proposals",
    type: "critic",
    goal: "Identify weak points, missing info, and risks",
    systemPrompt: "You are a skeptical critic. Given any proposal, plan, or document, identify: 1) Missing information, 2) Logical weaknesses, 3) Risk factors, 4) Questions the author should answer. Be direct and specific. Don't soften your critique.",
    temperature: 0.5,
    testInput: "We plan to launch our new SaaS product next month. We'll offer a free tier and a $29/mo pro plan. Marketing will be through social media and word of mouth. We expect 1000 users in the first quarter.",
  },
];

async function streamDemoAI({
  messages,
  systemPrompt,
  onDelta,
  onDone,
}: {
  messages: { role: string; content: string }[];
  systemPrompt: string;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/demo-ai-generate`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ messages, systemPrompt }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Error ${resp.status}`);
  }

  if (!resp.body) throw new Error("No response stream");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { streamDone = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

export default function DemoModuleBuilderPage() {
  const [name, setName] = useState(DEMO_PRESETS[0].name);
  const [role, setRole] = useState(DEMO_PRESETS[0].role);
  const [type, setType] = useState(DEMO_PRESETS[0].type);
  const [goal, setGoal] = useState(DEMO_PRESETS[0].goal);
  const [systemPrompt, setSystemPrompt] = useState(DEMO_PRESETS[0].systemPrompt);
  const [temperature, setTemperature] = useState(DEMO_PRESETS[0].temperature);
  const [maxTokens, setMaxTokens] = useState(500);
  const [testInput, setTestInput] = useState(DEMO_PRESETS[0].testInput);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runsUsed, setRunsUsed] = useState(0);
  const [slmMode, setSlmMode] = useState(false);
  const [deterministic, setDeterministic] = useState(true);

  const loadPreset = (idx: number) => {
    const p = DEMO_PRESETS[idx];
    setName(p.name);
    setRole(p.role);
    setType(p.type);
    setGoal(p.goal);
    setSystemPrompt(p.systemPrompt);
    setTemperature(p.temperature);
    setTestInput(p.testInput);
    setTestOutput(null);
  };

  const runTest = async () => {
    if (!testInput.trim()) return;
    if (runsUsed >= 5) {
      toast.error("Demo limit reached!", {
        description: "Sign up free for unlimited module testing.",
        action: { label: "Sign Up", onClick: () => window.location.href = "/signup" },
      });
      return;
    }
    setIsRunning(true);
    setTestOutput("");
    const startTime = Date.now();
    try {
      await streamDemoAI({
        messages: [{ role: "user", content: testInput }],
        systemPrompt: systemPrompt || `You are ${name}. ${role}`,
        onDelta: (text) => setTestOutput(prev => (prev || "") + text),
        onDone: () => {
          setIsRunning(false);
          setRunsUsed(prev => prev + 1);
          const duration = Date.now() - startTime;
          toast.success(`Test completed in ${(duration / 1000).toFixed(1)}s`);
        },
      });
    } catch (err: any) {
      setIsRunning(false);
      if (err.message.includes("Demo limit")) {
        setRunsUsed(5);
        toast.error("Demo limit reached!", {
          description: "Sign up free for unlimited module testing.",
          action: { label: "Sign Up", onClick: () => window.location.href = "/signup" },
        });
      } else {
        setTestOutput(`Error: ${err.message}`);
        toast.error("Test failed");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Try the Module Builder — Free Demo | SoupyLab"
        description="Build and test AI modules live — no signup required. Try the classifier, summarizer, or critic preset and see results in seconds."
      />

      {/* Demo banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 via-forge-gold/10 to-forge-cyan/10 border-b border-primary/20 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-forge-gold" />
          <span className="font-semibold">Guest Demo</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground text-xs">
            {5 - runsUsed} test run{5 - runsUsed !== 1 ? "s" : ""} remaining
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold gap-1.5">
              <LogIn className="h-3 w-3" /> Log in
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="h-7 text-xs gradient-primary text-primary-foreground font-semibold gap-1.5">
              <UserPlus className="h-3 w-3" /> Sign up free <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Preset selector */}
      <div className="px-4 sm:px-6 py-3 border-b border-border flex items-center gap-3 overflow-x-auto">
        <span className="text-xs font-semibold text-muted-foreground shrink-0">Try a preset:</span>
        {DEMO_PRESETS.map((p, i) => (
          <Button
            key={p.name}
            variant={name === p.name ? "default" : "outline"}
            size="sm"
            className={`text-xs shrink-0 ${name === p.name ? "gradient-primary text-primary-foreground" : ""}`}
            onClick={() => loadPreset(i)}
          >
            {p.name}
          </Button>
        ))}
      </div>

      {/* Builder */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Config */}
        <div className="flex-1 border-r border-border overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border">
            <Brain className="h-5 w-5 text-forge-gold" />
            <h1 className="text-lg font-bold font-display tracking-wide">{name || "Untitled Module"}</h1>
            <Badge variant="outline" className="text-[10px]">{type}</Badge>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 sm:p-6 space-y-5">
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-3 w-3" /> Identity
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Role</Label>
                    <Input value={role} onChange={e => setRole(e.target.value)} className="h-8 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Goal</Label>
                  <Textarea value={goal} onChange={e => setGoal(e.target.value)} rows={2} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">System Prompt</Label>
                  <Textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={5} className="font-mono text-xs" />
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Zap className="h-3 w-3" /> Model Settings
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Temperature</Label>
                    <span className="text-xs text-muted-foreground font-mono">{temperature}</span>
                  </div>
                  <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} max={1} step={0.05} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Max Tokens</Label>
                    <span className="text-xs text-muted-foreground font-mono">{maxTokens}</span>
                  </div>
                  <Slider value={[maxTokens]} onValueChange={([v]) => setMaxTokens(v)} max={2000} step={100} />
                </div>
              </section>

              <Separator />

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Shield className="h-3 w-3" /> Flags
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "SLM Mode", value: slmMode, onChange: setSlmMode },
                    { label: "Deterministic", value: deterministic, onChange: setDeterministic },
                  ].map((flag) => (
                    <div key={flag.label} className="flex items-center justify-between glass rounded-lg px-3 py-2">
                      <Label className="text-xs">{flag.label}</Label>
                      <Switch checked={flag.value} onCheckedChange={flag.onChange} className="scale-75" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Save CTA */}
              <div className="glass rounded-xl p-5 border border-primary/20 text-center space-y-3">
                <Lock className="h-6 w-6 text-primary/60 mx-auto" />
                <p className="text-sm font-semibold">Want to save this module?</p>
                <p className="text-xs text-muted-foreground">Sign up free to save, version, and deploy your modules.</p>
                <Link to="/signup">
                  <Button size="sm" className="gradient-primary text-primary-foreground font-semibold gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" /> Create Free Account
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right: Test Panel */}
        <div className="w-full lg:w-[420px] flex flex-col bg-muted/30 border-t lg:border-t-0">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Play className="h-3.5 w-3.5 text-forge-emerald" /> Live Test
              <Badge variant="outline" className="text-[9px] ml-auto">
                {runsUsed}/5 used
              </Badge>
            </h2>
          </div>
          <div className="p-4 space-y-2">
            <Label className="text-xs">Test Input</Label>
            <Textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter test input…"
              rows={4}
              className="text-sm"
            />
            <Button
              onClick={runTest}
              disabled={isRunning || !testInput.trim() || runsUsed >= 5}
              size="sm"
              className="w-full gradient-primary text-primary-foreground"
            >
              {isRunning ? (
                <><RotateCcw className="h-3.5 w-3.5 mr-1 animate-spin" /> Running…</>
              ) : runsUsed >= 5 ? (
                <><Lock className="h-3.5 w-3.5 mr-1" /> Sign up for more</>
              ) : (
                <><Send className="h-3.5 w-3.5 mr-1" /> Run Test ({5 - runsUsed} left)</>
              )}
            </Button>
          </div>
          <Separator />
          <div className="flex-1 overflow-hidden flex flex-col min-h-[200px]">
            <div className="px-4 py-2 flex items-center justify-between">
              <Label className="text-xs">Output</Label>
              {testOutput && !isRunning && (
                <Badge variant="outline" className="text-[10px] text-forge-emerald border-forge-emerald/30">success</Badge>
              )}
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

          {/* Bottom signup nudge after first run */}
          {runsUsed > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border-t border-primary/20 bg-primary/5"
            >
              <p className="text-xs font-semibold mb-2 text-center">
                {runsUsed >= 5 ? "🎉 You've used all demo runs!" : "Like what you see?"}
              </p>
              <Link to="/signup" className="block">
                <Button size="sm" className="w-full gradient-primary text-primary-foreground font-semibold gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" /> Sign up for unlimited access <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
