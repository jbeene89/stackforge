import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Globe, Smartphone, Brain, Layers, ArrowRight, Zap, Shield, Eye,
  Play, CheckCircle2, ChevronRight, Command, GitBranch, Target, Cpu,
  FileCode, Workflow, Lock, BarChart3, Wrench
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

// ------- HERO TYPEWRITER -------

function TypewriterDemo() {
  const prompts = [
    { text: "Build an AI that classifies marine repair requests by urgency", output: "→ Specialist Module • classifier • 3 guardrails" },
    { text: "Chain scope → cost → risk → proposal into a pipeline", output: "→ Stack • 5 nodes • 5 edges • parallel branches" },
    { text: "Generate an Android inspection app with offline photo capture", output: "→ Android App • 4 screens • GPS + camera + sync" },
  ];
  const [idx, setIdx] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [showOutput, setShowOutput] = useState(false);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const prompt = prompts[idx];
    if (isTyping) {
      if (displayText.length < prompt.text.length) {
        const timer = setTimeout(() => setDisplayText(prompt.text.slice(0, displayText.length + 1)), 35);
        return () => clearTimeout(timer);
      } else {
        setTimeout(() => setShowOutput(true), 300);
        setTimeout(() => setIsTyping(false), 3000);
      }
    } else {
      setShowOutput(false);
      if (displayText.length > 0) {
        const timer = setTimeout(() => setDisplayText(displayText.slice(0, -1)), 15);
        return () => clearTimeout(timer);
      } else {
        setIdx((prev) => (prev + 1) % prompts.length);
        setIsTyping(true);
      }
    }
  }, [displayText, isTyping, idx]);

  return (
    <div className="glass-strong rounded-xl p-4 sm:p-5 max-w-2xl mx-auto text-left">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-forge-rose/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-forge-amber/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-forge-emerald/50" />
        </div>
        <span className="text-[10px] text-muted-foreground ml-2 font-mono">soupyforge prompt</span>
      </div>
      <div className="font-mono text-xs sm:text-sm text-foreground min-h-[24px]">
        <span className="text-primary">❯ </span>
        {displayText}
        <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5" />
      </div>
      {showOutput && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-[11px] sm:text-xs text-forge-emerald mt-2 pl-4"
        >
          {prompts[idx].output}
        </motion.div>
      )}
    </div>
  );
}

// ------- ARCHITECTURE DIAGRAM -------

function ArchitectureDiagram() {
  const nodes = [
    { label: "Classifier", x: 60, y: 40, color: "bg-forge-cyan/20 border-forge-cyan/40 text-forge-cyan" },
    { label: "Specialist", x: 220, y: 40, color: "bg-primary/20 border-primary/40 text-primary" },
    { label: "Critic", x: 380, y: 20, color: "bg-forge-rose/20 border-forge-rose/40 text-forge-rose" },
    { label: "Formatter", x: 380, y: 60, color: "bg-forge-amber/20 border-forge-amber/40 text-forge-amber" },
    { label: "Output", x: 530, y: 40, color: "bg-forge-emerald/20 border-forge-emerald/40 text-forge-emerald" },
  ];

  return (
    <div className="relative w-full max-w-[640px] h-[100px] mx-auto hidden sm:block">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 640 100" fill="none">
        <motion.path d="M140,50 L210,50" stroke="hsl(var(--border))" strokeWidth="1.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} />
        <motion.path d="M300,50 L370,30" stroke="hsl(var(--border))" strokeWidth="1.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }} />
        <motion.path d="M300,50 L370,70" stroke="hsl(var(--border))" strokeWidth="1.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }} />
        <motion.path d="M460,30 L520,50" stroke="hsl(var(--border))" strokeWidth="1.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.6 }} />
        <motion.path d="M460,70 L520,50" stroke="hsl(var(--border))" strokeWidth="1.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.6 }} />
      </svg>
      {nodes.map((node, i) => (
        <motion.div
          key={node.label}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12 }}
          className={`absolute px-3 py-1.5 rounded-lg border text-[11px] font-semibold ${node.color}`}
          style={{ left: node.x, top: node.y, transform: "translate(-50%, -50%)" }}
        >
          {node.label}
        </motion.div>
      ))}
    </div>
  );
}

// ------- DATA -------

const differentiators = [
  {
    icon: Brain,
    title: "Specialist AI Modules",
    subtitle: "Not chatbots. Single-purpose AIs.",
    desc: "Each module does one thing with precision: classify, estimate, critique, extract, or format. Define its goal, guardrails, boundaries, and output format.",
    details: ["Deterministic mode for repeatable outputs", "SLM mode for cost-optimized deployment", "Built-in guardrails and task boundaries", "Per-module temperature and constraints"],
    color: "from-forge-amber to-forge-rose",
  },
  {
    icon: Layers,
    title: "Stack Orchestration",
    subtitle: "Wire modules into intelligent pipelines.",
    desc: "Drag specialist modules onto a canvas, connect them with edges, add conditional routing and human approval gates.",
    details: ["Visual canvas with drag-to-connect edges", "Parallel branches and conditional routing", "Human-in-the-loop approval gates", "Step-by-step execution tracing"],
    color: "from-primary to-forge-cyan",
  },
  {
    icon: Smartphone,
    title: "Android App Generation",
    subtitle: "Describe it. Get a native app.",
    desc: "Generate field-ready Android apps from plain English. Photo capture, GPS tagging, offline checklists, barcode scanning.",
    details: ["Native device access via Capacitor", "Offline-first with background sync", "Camera, GPS, sensors, push notifications", "PWA fallback for instant sharing"],
    color: "from-forge-cyan to-forge-emerald",
  },
];

const architecturePoints = [
  { icon: Target, label: "Narrow scope", desc: "Each module has explicit task boundaries" },
  { icon: Eye, label: "Full tracing", desc: "See every input, output, and decision" },
  { icon: GitBranch, label: "Version control", desc: "Snapshot and rollback any component" },
  { icon: Lock, label: "Guardrails built-in", desc: "Prevent drift with constraints and flags" },
  { icon: Wrench, label: "Test in isolation", desc: "Benchmark modules before wiring them up" },
  { icon: Workflow, label: "Compose, don't prompt", desc: "Build systems, not conversations" },
];

const realUseCases = [
  {
    industry: "Marine Construction",
    title: "Estimation Pipeline",
    desc: "Intake → scope → cost → risk → proposal. 5 specialist modules processing real job requests into client-ready proposals.",
    type: "Stack",
    modules: 5,
    color: "border-forge-cyan/30",
  },
  {
    industry: "Legal & Compliance",
    title: "Contract Risk Reviewer",
    desc: "Scans construction contracts clause-by-clause for risk, liability gaps, and missing protections.",
    type: "Module",
    modules: 1,
    color: "border-forge-rose/30",
  },
  {
    industry: "Field Operations",
    title: "Inspection App",
    desc: "Android app for on-site inspectors. Photo capture with annotation, GPS tagging, offline checklists.",
    type: "Android",
    modules: 0,
    color: "border-forge-emerald/30",
  },
  {
    industry: "R&D / Innovation",
    title: "Inventor Think Tank",
    desc: "Idea expander → engineering critic → red team → patent tightener → executive summary.",
    type: "Stack",
    modules: 5,
    color: "border-primary/30",
  },
];

// ------- PAGE -------

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold">Soupy<span className="text-primary">Forge</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#use-cases" className="hover:text-foreground transition-colors">Use Cases</a>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/signup"><Button size="sm" className="gradient-primary text-primary-foreground text-xs sm:text-sm">Start Building</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 relative overflow-hidden gradient-mesh">
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-4 sm:mb-6 text-balance">
              Cook up <span className="gradient-text">specialist AI systems</span>,
              <br className="hidden md:block" /> not chatbots
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed text-balance">
              Brew narrow-purpose AI modules. Stir them into multi-step pipelines.
              Serve Android apps for the field. Taste-test every step.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 sm:mb-10">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="gradient-primary text-primary-foreground px-8 group w-full sm:w-auto">
                  Start Building <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                  <Play className="h-4 w-4" /> Explore Demo
                </Button>
              </Link>
            </div>
            <TypewriterDemo />
          </motion.div>
        </div>
      </section>

      {/* Anti-pattern statement */}
      <section className="py-8 sm:py-10 px-4 sm:px-6 border-y border-border bg-secondary/20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">SoupyForge is not a wrapper around ChatGPT.</span>{" "}
            It's a modular AI development kitchen where every ingredient has a defined role, explicit boundaries, and traceable flavor.
          </p>
        </div>
      </section>

      {/* Three Differentiators */}
      <section id="how-it-works" className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 sm:mb-16">
            <Badge variant="outline" className="text-[10px] mb-4">What makes StackForge different</Badge>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-balance">Three things we do that nobody else does</h2>
          </motion.div>

          <div className="space-y-12 sm:space-y-20">
            {differentiators.map((d, i) => (
              <motion.div
                key={d.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className={`flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} gap-6 sm:gap-8 items-center`}
              >
                <div className="flex-1 space-y-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${d.color} flex items-center justify-center`}>
                    <d.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold mb-1">{d.title}</h3>
                    <p className="text-sm font-medium text-primary">{d.subtitle}</p>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{d.desc}</p>
                  <ul className="space-y-2">
                    {d.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-forge-emerald shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 glass rounded-xl p-4 sm:p-6 min-h-[180px] sm:min-h-[200px] flex items-center justify-center w-full">
                  {i === 0 && (
                    <div className="space-y-3 w-full">
                      <div className="flex items-center gap-3 glass rounded-lg px-3 sm:px-4 py-2.5">
                        <Brain className="h-4 w-4 text-forge-amber shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">Marine Scope Summarizer</div>
                          <div className="text-[10px] text-muted-foreground">specialist • temp 0.3 • deterministic</div>
                        </div>
                        <Badge className="bg-forge-emerald/15 text-forge-emerald text-[9px] shrink-0">v6</Badge>
                      </div>
                      <div className="flex items-center gap-3 glass rounded-lg px-3 sm:px-4 py-2.5">
                        <Shield className="h-4 w-4 text-forge-rose shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">Red Team Critic</div>
                          <div className="text-[10px] text-muted-foreground">critic • temp 0.5 • skeptical tone</div>
                        </div>
                        <Badge className="bg-forge-emerald/15 text-forge-emerald text-[9px] shrink-0">v3</Badge>
                      </div>
                      <div className="flex items-center gap-3 glass rounded-lg px-3 sm:px-4 py-2.5">
                        <Cpu className="h-4 w-4 text-forge-cyan shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">Cost Estimator</div>
                          <div className="text-[10px] text-muted-foreground">specialist • SLM mode • JSON output</div>
                        </div>
                        <Badge className="bg-primary/15 text-primary text-[9px] shrink-0">v9</Badge>
                      </div>
                    </div>
                  )}
                  {i === 1 && <ArchitectureDiagram />}
                  {i === 2 && (
                    <div className="w-[180px] mx-auto">
                      <div className="rounded-2xl border-2 border-border bg-background p-2 shadow-xl">
                        <div className="rounded-xl bg-secondary/50 h-8 flex items-center justify-center text-[10px] font-semibold mb-1.5">Field Inspector</div>
                        <div className="space-y-1">
                          <div className="rounded-lg bg-forge-cyan/10 h-16 flex items-center justify-center text-[9px] text-forge-cyan">📷 Photo Capture</div>
                          <div className="rounded-lg bg-forge-emerald/10 h-6 flex items-center justify-center text-[9px] text-forge-emerald">📍 GPS Tagged</div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="rounded bg-forge-amber/10 h-8 flex items-center justify-center text-[8px] text-forge-amber">Checklist</div>
                            <div className="rounded bg-primary/10 h-8 flex items-center justify-center text-[8px] text-primary">Sync ↑</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture philosophy */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-secondary/20 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8 sm:mb-10">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Architecture principles</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">How StackForge thinks about AI systems.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {architecturePoints.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="glass rounded-lg px-4 py-3 flex items-start gap-3"
              >
                <p.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold">{p.label}</div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Real use cases */}
      <section id="use-cases" className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Built for real industries</h2>
            <p className="text-xs sm:text-sm text-muted-foreground text-balance">Not toy demos. These are production patterns used by contractors, legal teams, and field operators.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {realUseCases.map((uc, i) => (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`glass rounded-xl p-4 sm:p-6 border-l-4 ${uc.color} hover:glow-primary transition-all cursor-pointer group`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{uc.industry}</span>
                  <Badge variant="outline" className="text-[10px]">{uc.type}</Badge>
                </div>
                <h3 className="font-bold text-base sm:text-lg mb-2 group-hover:text-primary transition-colors">{uc.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{uc.desc}</p>
                {uc.modules > 0 && (
                  <div className="mt-3 text-[10px] text-muted-foreground">{uc.modules} specialist modules</div>
                )}
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/templates">
              <Button variant="outline">Browse All Templates <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center glass-strong rounded-2xl p-8 sm:p-12 glow-primary"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">Stop prompting. Start engineering.</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
            Build modular AI systems with defined roles, traceable behavior, and real-world deployment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="gradient-primary text-primary-foreground px-8 w-full sm:w-auto">
                Start Building Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/pricing" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">View Pricing</Button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-forge-emerald" /> Free tier</div>
            <div className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-forge-emerald" /> No credit card</div>
            <div className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-forge-emerald" /> Export anytime</div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-base font-bold">StackForge <span className="text-primary">AI</span></span>
              </Link>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">The modular AI development environment for specialist systems.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="font-semibold mb-3">Product</div>
                <div className="space-y-2 text-muted-foreground text-xs sm:text-sm">
                  <div><Link to="/templates" className="hover:text-foreground transition-colors">Templates</Link></div>
                  <div><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></div>
                  <div><a href="#" className="hover:text-foreground transition-colors">Changelog</a></div>
                </div>
              </div>
              <div>
                <div className="font-semibold mb-3">Resources</div>
                <div className="space-y-2 text-muted-foreground text-xs sm:text-sm">
                  <div><a href="#" className="hover:text-foreground transition-colors">Documentation</a></div>
                  <div><a href="#" className="hover:text-foreground transition-colors">API Reference</a></div>
                  <div><a href="#" className="hover:text-foreground transition-colors">Community</a></div>
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="font-semibold mb-3">Company</div>
                <div className="space-y-2 text-muted-foreground text-xs sm:text-sm">
                  <div><a href="#" className="hover:text-foreground transition-colors">About</a></div>
                  <div><a href="#" className="hover:text-foreground transition-colors">Blog</a></div>
                  <div><a href="#" className="hover:text-foreground transition-colors">Careers</a></div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border text-xs sm:text-sm text-muted-foreground">
            <span>© 2026 StackForge AI. All rights reserved.</span>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <a href="#" className="hover:text-foreground transition-colors">Status</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
