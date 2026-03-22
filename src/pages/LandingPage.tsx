import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Globe, Smartphone, Brain, Layers, ArrowRight, Zap, Shield, Eye,
  Play, CheckCircle2, ChevronRight, Command, GitBranch, Target, Cpu,
  FileCode, Workflow, Lock, BarChart3, Wrench, Scissors, Database, FlaskConical, Eraser,
  Menu, X, Moon, HardDrive, Upload, Fingerprint, Server, Store, Coins, Crown, Repeat
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { PyreflyBackground } from "@/components/PyreflyBackground";
import { FFXDivider, RuneCircle } from "@/components/FFXOrnament";
import { CompanionSprites } from "@/components/CompanionSprites";
import { InteractiveDemo } from "@/components/landing/InteractiveDemo";
import { SocialProof } from "@/components/landing/SocialProof";
import { TrustBar } from "@/components/landing/TrustBar";
import { HowItWorksVideos } from "@/components/landing/HowItWorksVideos";

// ------- ANIMATED COUNT-UP -------

function CountUp({ value, prefix = "", suffix = "", duration = 2000 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, value, duration]);

  return <span ref={ref}>{prefix}{inView ? display.toLocaleString() : 0}{suffix}</span>;
}

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
    <div className="ffx-card glass-strong rounded-xl p-4 sm:p-5 max-w-2xl mx-auto text-left">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-forge-rose/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-forge-gold/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-forge-emerald/50" />
        </div>
        <span className="text-[10px] text-muted-foreground ml-2 font-mono">soupy prompt</span>
      </div>
      <div className="font-mono text-xs sm:text-sm text-foreground min-h-[24px]">
        <span className="text-primary">❯ </span>
        {displayText}
        <span className="inline-block w-1.5 h-4 bg-forge-gold animate-pulse ml-0.5" />
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

// ------- ARCHITECTURE DIAGRAM - FFX style -------

function ArchitectureDiagram() {
  const nodes = [
    { label: "Classifier", x: 60, y: 40, color: "bg-forge-cyan/20 border-forge-cyan/40 text-forge-cyan" },
    { label: "Specialist", x: 220, y: 40, color: "bg-primary/20 border-primary/40 text-primary" },
    { label: "Critic", x: 380, y: 20, color: "bg-forge-rose/20 border-forge-rose/40 text-forge-rose" },
    { label: "Formatter", x: 380, y: 60, color: "bg-forge-gold/20 border-forge-gold/40 text-forge-gold" },
    { label: "Output", x: 530, y: 40, color: "bg-forge-emerald/20 border-forge-emerald/40 text-forge-emerald" },
  ];

  return (
    <>
      {/* Desktop diagram */}
      <div className="relative w-full max-w-[640px] h-[100px] mx-auto hidden sm:block">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 640 100" fill="none">
          <defs>
            <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0.6)" />
              <stop offset="100%" stopColor="hsl(var(--forge-cyan) / 0.6)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <motion.path d="M140,50 L210,50" stroke="url(#edge-grad)" strokeWidth="1.5" filter="url(#glow)" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} />
          <motion.path d="M300,50 L370,30" stroke="url(#edge-grad)" strokeWidth="1.5" filter="url(#glow)" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }} />
          <motion.path d="M300,50 L370,70" stroke="url(#edge-grad)" strokeWidth="1.5" filter="url(#glow)" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }} />
          <motion.path d="M460,30 L520,50" stroke="url(#edge-grad)" strokeWidth="1.5" filter="url(#glow)" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.6 }} />
          <motion.path d="M460,70 L520,50" stroke="url(#edge-grad)" strokeWidth="1.5" filter="url(#glow)" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.6 }} />
        </svg>
        {nodes.map((node, i) => (
          <motion.div
            key={node.label}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
            className={`absolute px-3 py-1.5 rounded-lg border text-[11px] font-semibold ${node.color} backdrop-blur-sm`}
            style={{ left: node.x, top: node.y, transform: "translate(-50%, -50%)" }}
          >
            {node.label}
          </motion.div>
        ))}
      </div>

      {/* Mobile diagram — vertical flow */}
      <div className="flex sm:hidden flex-col items-center gap-2 w-full">
        {nodes.map((node, i) => (
          <motion.div
            key={node.label}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2 w-full"
          >
            {i > 0 && (
              <div className="w-4 flex flex-col items-center">
                <div className="w-px h-3 bg-primary/30" />
                <ChevronRight className="h-3 w-3 text-primary/50 -rotate-90" />
              </div>
            )}
            {i === 0 && <div className="w-4" />}
            <div className={`flex-1 px-3 py-2 rounded-lg border text-[11px] font-semibold text-center ${node.color} backdrop-blur-sm`}>
              {node.label}
            </div>
          </motion.div>
        ))}
      </div>
    </>
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
    color: "from-forge-gold to-forge-rose",
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

const deepCustomization = [
  {
    icon: Eraser,
    title: "Selective Unlearning",
    desc: "Surgically remove unwanted behaviors from base models — corporate tone, hallucination patterns, hedging. Generate DPO-format training data with weighted rejection pairs.",
    tag: "Task Vector Subtraction",
    color: "text-forge-rose",
    bgColor: "bg-forge-rose/10 border-forge-rose/20",
  },
  {
    icon: Database,
    title: "Dataset Engineering",
    desc: "Build training datasets from scratch — scrape, interview, capture from mobile, import from HuggingFace. Every sample gets multi-perspective AI review before it enters your model.",
    tag: "5-Perspective Council",
    color: "text-forge-cyan",
    bgColor: "bg-forge-cyan/10 border-forge-cyan/20",
  },
  {
    icon: FlaskConical,
    title: "Perspective Training (CDPT)",
    desc: "Each data point is enriched through five cognitive lenses: Builder, Red Team, Systems Thinker, Empath, and Frame Breaker. Your model learns nuance, not just patterns.",
    tag: "Cognitive Dense Perspective",
    color: "text-forge-gold",
    bgColor: "bg-forge-gold/10 border-forge-gold/20",
  },
  {
    icon: Scissors,
    title: "Popcorn Injection",
    desc: "Densify specific traits into your model — inject curiosity, domain expertise, or reasoning style. Combine with selective unlearning for surgical personality control.",
    tag: "Trait Densification",
    color: "text-forge-violet",
    bgColor: "bg-forge-violet/10 border-forge-violet/20",
  },
  {
    icon: Moon,
    title: "Idle Self-Training",
    desc: "Your model remembers corrections and learnings in RAM during a session. When idle, it autonomously generates training data from those corrections and fine-tunes itself — a closed-loop that gets smarter while you sleep.",
    tag: "Session Memory → Auto-Train",
    color: "text-forge-emerald",
    bgColor: "bg-forge-emerald/10 border-forge-emerald/20",
  },
];

const realUseCases = [
  {
    industry: "Marine Construction",
    title: "Estimation Pipeline",
    desc: "Intake → scope → cost → risk → proposal. 5 specialist modules processing real job requests into client-ready proposals.",
    type: "Stack",
    modules: 5,
    color: "border-forge-cyan/40",
  },
  {
    industry: "Legal & Compliance",
    title: "Contract Risk Reviewer",
    desc: "Scans construction contracts clause-by-clause for risk, liability gaps, and missing protections.",
    type: "Module",
    modules: 1,
    color: "border-forge-rose/40",
  },
  {
    industry: "Field Operations",
    title: "Inspection App",
    desc: "Android app for on-site inspectors. Photo capture with annotation, GPS tagging, offline checklists.",
    type: "Android",
    modules: 0,
    color: "border-forge-emerald/40",
  },
  {
    industry: "R&D / Innovation",
    title: "Inventor Think Tank",
    desc: "Idea expander → engineering critic → red team → patent tightener → executive summary.",
    type: "Stack",
    modules: 5,
    color: "border-primary/40",
  },
];

// ------- PAGE -------

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <SEOHead
        title="No-Code AI Agent & Pipeline Builder"
        description="Soupy is a visual AI platform to design agents, build multi-model pipelines, and deploy smart apps to web, Android, or edge devices — no coding or ML experience needed. Start free today."
      />
      {/* Companion Sprites - they follow you everywhere */}
      <CompanionSprites />

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary glow-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold font-display tracking-wider">
              Soupy<span className="gradient-text">Forge</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-medium">
            <a href="#how-it-works" className="hover:text-primary transition-colors duration-300">How It Works</a>
            <a href="#use-cases" className="hover:text-primary transition-colors duration-300">Use Cases</a>
            <Link to="/pricing" className="hover:text-primary transition-colors duration-300">Pricing</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="hidden sm:block"><Button variant="ghost" size="sm" className="font-semibold">Log in</Button></Link>
            <Link to="/signup" className="hidden sm:block">
              <Button size="sm" className="gradient-primary text-primary-foreground font-semibold glow-primary">
                Start Building
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden glass-strong border-t border-border/50 px-4 py-4 space-y-3"
          >
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">How It Works</a>
            <a href="#use-cases" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Use Cases</a>
            <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
            <div className="flex gap-2 pt-2 border-t border-border/30">
              <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full font-semibold">Log in</Button>
              </Link>
              <Link to="/signup" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full gradient-primary text-primary-foreground font-semibold">Start Building</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ════════════════════ HERO ════════════════════ */}
      <section className="relative pt-24 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 gradient-mesh" />
        <PyreflyBackground count={50} />

        {/* Decorative rune circles - hidden on mobile to prevent overflow */}
        <div className="absolute top-20 -left-16 opacity-30 hidden sm:block">
          <RuneCircle size={200} />
        </div>
        <div className="absolute bottom-0 -right-20 opacity-20 hidden sm:block">
          <RuneCircle size={260} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full glass border border-forge-gold/20 text-xs font-semibold text-forge-gold"
            >
              <Sparkles className="h-3 w-3" />
              AI Development Kitchen
            </motion.div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-wide leading-[1.1] mb-5 sm:mb-7 text-balance">
              Cook up{" "}
              <span className="gradient-text">specialist AI systems</span>
              <br className="hidden md:block" />
              <span className="text-foreground/80"> not chatbots</span>
            </h1>

            <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed text-balance font-medium">
              Brew narrow-purpose AI modules. Stir them into multi-step pipelines.
              Serve Android apps for the field. Taste-test every step.
            </p>

             <p className="text-xs sm:text-sm text-forge-gold/80 font-semibold mb-6 sm:mb-8">
              ⚡ 50 free credits/month — no credit card needed
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 sm:mb-10">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="gradient-primary text-primary-foreground px-10 py-6 text-base font-bold group w-full sm:w-auto glow-primary">
                  Start Building Free <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto py-6 text-base font-semibold border-primary/20 hover:border-primary/40 hover:glow-primary transition-all">
                  <Play className="h-4 w-4" /> Explore Demo
                </Button>
              </Link>
            </div>

            <TypewriterDemo />
            <TrustBar />
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ════════════════════ ANTI-PATTERN ════════════════════ */}
      <section className="relative py-8 sm:py-10 px-4 sm:px-6">
        <FFXDivider className="mb-6" />
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            <span className="font-bold text-foreground font-display tracking-wide">Soupy is not a wrapper around ChatGPT.</span>{" "}
            It's a modular AI development kitchen where every ingredient has a defined role, explicit boundaries, and traceable flavor.
          </p>
        </div>
        <FFXDivider className="mt-6" />
      </section>

      {/* ════════════════════ INTERACTIVE DEMO ════════════════════ */}
      <InteractiveDemo />

      {/* ════════════════════ THREE DIFFERENTIATORS ════════════════════ */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12 sm:mb-20">
            <Badge variant="outline" className="text-[10px] mb-4 border-forge-gold/30 text-forge-gold font-semibold">
              What makes Soupy different
            </Badge>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-display font-bold text-balance tracking-wide">
              Three things we do that nobody else does
            </h2>
          </motion.div>

          <div className="space-y-16 sm:space-y-28">
            {differentiators.map((d, i) => (
              <motion.div
                key={d.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className={`flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} gap-8 sm:gap-12 items-center`}
              >
                <div className="flex-1 space-y-5">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${d.color} flex items-center justify-center glow-primary`}>
                    <d.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-2xl font-display font-bold mb-1 tracking-wide">{d.title}</h3>
                    <p className="text-sm font-semibold text-primary">{d.subtitle}</p>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{d.desc}</p>
                  <ul className="space-y-3">
                    {d.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4 text-forge-emerald shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 ffx-card glass rounded-xl p-5 sm:p-7 min-h-[200px] sm:min-h-[220px] flex items-center justify-center w-full">
                  {i === 0 && (
                    <div className="space-y-3 w-full">
                      {[
                        { icon: Brain, name: "Marine Scope Summarizer", sub: "specialist • temp 0.3 • deterministic", ver: "v6", iconColor: "text-forge-gold" },
                        { icon: Shield, name: "Red Team Critic", sub: "critic • temp 0.5 • skeptical tone", ver: "v3", iconColor: "text-forge-rose" },
                        { icon: Cpu, name: "Cost Estimator", sub: "specialist • SLM mode • JSON output", ver: "v9", iconColor: "text-forge-cyan" },
                      ].map((m) => (
                        <div key={m.name} className="flex items-center gap-3 glass rounded-lg px-3 sm:px-4 py-3 hover:glow-primary transition-all">
                          <m.icon className={`h-4 w-4 ${m.iconColor} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate">{m.name}</div>
                            <div className="text-[10px] text-muted-foreground">{m.sub}</div>
                          </div>
                          <Badge className="bg-forge-emerald/15 text-forge-emerald text-[9px] shrink-0 border-forge-emerald/20">{m.ver}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {i === 1 && <ArchitectureDiagram />}
                  {i === 2 && (
                    <div className="w-[200px] mx-auto">
                      <div className="ffx-card rounded-2xl border border-primary/20 bg-background/80 p-3 glow-primary">
                        <div className="rounded-xl bg-primary/10 h-9 flex items-center justify-center text-[11px] font-bold mb-2 text-primary font-display tracking-wide">
                          Field Inspector
                        </div>
                        <div className="space-y-1.5">
                          <div className="rounded-lg bg-forge-cyan/10 h-16 flex items-center justify-center text-[10px] text-forge-cyan font-semibold border border-forge-cyan/10">📷 Photo Capture</div>
                          <div className="rounded-lg bg-forge-emerald/10 h-7 flex items-center justify-center text-[10px] text-forge-emerald font-semibold border border-forge-emerald/10">📍 GPS Tagged</div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="rounded-lg bg-forge-gold/10 h-8 flex items-center justify-center text-[9px] text-forge-gold font-semibold border border-forge-gold/10">Checklist</div>
                            <div className="rounded-lg bg-primary/10 h-8 flex items-center justify-center text-[9px] text-primary font-semibold border border-primary/10">Sync ↑</div>
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

      {/* ════════════════════ ARCHITECTURE PHILOSOPHY ════════════════════ */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 overflow-hidden">
        {/* Subtle background */}
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <PyreflyBackground count={20} />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 sm:mb-14">
            <h2 className="text-lg sm:text-xl md:text-3xl font-display font-bold tracking-wide">Architecture Principles</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-3 font-medium">How Soupy thinks about AI systems.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {architecturePoints.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="ffx-card glass rounded-xl px-5 py-4 flex items-start gap-3 hover:glow-primary transition-all duration-500"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <p.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold font-display tracking-wide">{p.label}</div>
                  <div className="text-sm text-muted-foreground mt-0.5 font-medium">{p.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ DEEP CUSTOMIZATION ════════════════════ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} className="text-center mb-12 sm:mb-16">
            <Badge variant="outline" className="text-[10px] mb-4 border-forge-rose/30 text-forge-rose font-semibold">
              This is not normal AI building
            </Badge>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-display font-bold text-balance tracking-wide">
              Control what your model <span className="gradient-text">learns — and unlearns</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-4 max-w-2xl mx-auto font-medium leading-relaxed">
              Most platforms let you prompt a model. Soupy lets you <span className="text-foreground font-semibold">reshape</span> one — engineer datasets, inject reasoning styles, and surgically remove behaviors you don't want.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {deepCustomization.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="ffx-card glass rounded-xl p-6 sm:p-7 hover:glow-primary transition-all duration-500 group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${item.bgColor}`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-sm sm:text-base font-display font-bold tracking-wide">{item.title}</h3>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 opacity-70 font-mono shrink-0">{item.tag}</Badge>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-10 text-center"
          >
            <div className="inline-flex items-center gap-3 glass rounded-full px-6 py-3 text-xs sm:text-sm font-medium text-muted-foreground">
              <FlaskConical className="h-4 w-4 text-forge-gold" />
              <span>Train locally. No cloud dependency. Your data stays yours.</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════ YOUR BRAIN YOUR MODEL ════════════════════ */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-60" />
        <PyreflyBackground count={40} />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-14 sm:mb-20"
          >
            <Badge variant="outline" className="text-[10px] mb-5 border-primary/30 text-primary font-semibold tracking-wider">
              THE REAL POWER
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold tracking-wide leading-[1.15] mb-6">
              Put <span className="gradient-text">your brain</span> inside a model.
              <br className="hidden sm:block" />
              Train it on <span className="text-forge-gold">anything</span>. Run it on <span className="text-forge-cyan">any device</span>.
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
              Your knowledge. Your domain expertise. Your reasoning style. Your corrections.
              Inject it all into a small language model — then train on <span className="text-foreground font-bold">0 to 100,000+ data points</span>,
              on whatever hardware you have.
            </p>
          </motion.div>

          {/* The big stats / flex row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-14">
            {[
              {
                icon: Upload,
                stat: "Any Knowledge",
                desc: "Conversations, PDFs, voice memos, URLs, photos, HuggingFace datasets, browser history — if it's yours, it goes in.",
                color: "text-forge-gold",
                bgColor: "bg-forge-gold/10 border-forge-gold/20",
                glow: "hover:shadow-[0_0_30px_hsl(var(--forge-gold)/0.15)]",
              },
              {
                icon: Fingerprint,
                stat: "Your Reasoning",
                desc: "Cognitive Fingerprinting extracts how you think — your heuristics, domain bridges, reasoning patterns — and bakes them into training.",
                color: "text-primary",
                bgColor: "bg-primary/10 border-primary/20",
                glow: "hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]",
              },
              {
                icon: HardDrive,
                stat: "Any Device",
                desc: "Laptop CPU, AMD GPU, NVIDIA, Raspberry Pi, phone. If it can run Ollama or llama.cpp, it can run your model.",
                color: "text-forge-cyan",
                bgColor: "bg-forge-cyan/10 border-forge-cyan/20",
                glow: "hover:shadow-[0_0_30px_hsl(var(--forge-cyan)/0.15)]",
              },
            ].map((item, i) => (
              <motion.div
                key={item.stat}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className={`ffx-card glass-strong rounded-2xl p-7 sm:p-8 text-center border ${item.bgColor} ${item.glow} transition-all duration-500`}
              >
                <div className={`w-14 h-14 rounded-xl ${item.bgColor} border flex items-center justify-center mx-auto mb-5`}>
                  <item.icon className={`h-7 w-7 ${item.color}`} />
                </div>
                <h3 className={`text-lg sm:text-xl font-display font-bold mb-3 ${item.color} tracking-wide`}>{item.stat}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Data points scale visual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="ffx-card glass-strong rounded-2xl p-8 sm:p-10 glow-primary"
          >
            <div className="text-center mb-8">
              <h3 className="text-base sm:text-lg font-display font-bold tracking-wide mb-2">Scale as you go</h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                Start with zero training data and a personality. Or bring 100K samples. Soupy handles both.
              </p>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 max-w-3xl mx-auto">
              <span className="text-[10px] sm:text-xs font-mono font-bold text-muted-foreground shrink-0">0</span>
              <div className="flex-1 relative h-10 sm:h-12 rounded-full overflow-hidden bg-secondary/30 border border-border/30">
                {/* Gradient fill */}
                <motion.div
                  initial={{ width: "0%" }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(var(--forge-gold)/0.4), hsl(var(--primary)/0.6), hsl(var(--forge-cyan)/0.8))" }}
                />
                {/* Milestone markers */}
                {[
                  { pct: "5%", label: "Personality\nOnly", mobile: "5" },
                  { pct: "20%", label: "50\nSamples", mobile: "50" },
                  { pct: "45%", label: "500\nSamples", mobile: "500" },
                  { pct: "70%", label: "5,000\nSamples", mobile: "5K" },
                  { pct: "92%", label: "50K+\nSamples", mobile: "50K+" },
                ].map((m) => (
                  <div key={m.pct} className="absolute top-0 bottom-0 flex flex-col items-center justify-center" style={{ left: m.pct }}>
                    <div className="w-px h-full bg-background/40" />
                    <span className="absolute -bottom-6 text-[8px] sm:text-[9px] font-mono font-semibold text-muted-foreground whitespace-pre-wrap text-center leading-tight hidden sm:block">
                      {m.label}
                    </span>
                    <span className="absolute -bottom-5 text-[8px] font-mono font-semibold text-muted-foreground sm:hidden">
                      {m.mobile}
                    </span>
                  </div>
                ))}
              </div>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-forge-cyan shrink-0">∞</span>
            </div>

            <div className="mt-12 sm:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { label: "Zero to Model", value: "< 5 min", sub: "Personality-only deploy" },
                { label: "Full CDPT Run", value: "13 calls", sub: "Per data point" },
                { label: "Local Training", value: "100% offline", sub: "Your hardware, your data" },
                { label: "Device Target", value: "2–16 GB RAM", sub: "Phone to workstation" },
              ].map((s) => (
                <div key={s.label} className="glass rounded-xl p-3 sm:p-4">
                  <p className="text-lg sm:text-2xl font-display font-bold gradient-text">{s.value}</p>
                  <p className="text-[10px] sm:text-xs font-bold text-foreground mt-1">{s.label}</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">{s.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Closing punch */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-10 sm:mt-12 text-center"
          >
            <p className="text-sm sm:text-base text-muted-foreground font-semibold mb-6">
              <span className="text-foreground font-bold">This isn't fine-tuning a chatbot.</span>{" "}
              This is building a version of AI that thinks like you — runs on your hardware — and never phones home.
            </p>
            <Link to="/slm-lab">
              <Button size="lg" className="gradient-primary text-primary-foreground font-bold glow-primary px-8">
                <Brain className="h-4 w-4 mr-2" /> Open SLM Lab <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════ MONETIZE YOUR INTELLIGENCE ════════════════════ */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-14 sm:mb-20"
          >
            <Badge variant="outline" className="text-[10px] mb-5 border-forge-gold/40 text-forge-gold font-semibold tracking-wider">
              OWN IT · SELL IT · KEEP THE PROFITS
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold tracking-wide leading-[1.15] mb-6">
              Your model. <span className="gradient-text">Your revenue stream.</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
              Once you build and train an SLM with Soupy, <span className="text-foreground font-bold">it's yours forever</span>.
              Package it as a marketplace template, sell it to other builders, and earn credits every time someone buys your expertise.
              No royalties. No lock-in. No permission needed.
            </p>
          </motion.div>

          {/* Ownership lifecycle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6 mb-14">
            {[
              {
                icon: Brain,
                step: "01",
                title: "Train It",
                desc: "Feed your knowledge — conversations, docs, domain expertise — into a small language model using our 5-perspective pipeline.",
                color: "text-primary",
                bgColor: "bg-primary/10 border-primary/20",
              },
              {
                icon: HardDrive,
                step: "02",
                title: "Own It",
                desc: "The trained model runs on your hardware. No cloud dependency, no API bills, no expiry date. It's a file on your machine.",
                color: "text-forge-cyan",
                bgColor: "bg-forge-cyan/10 border-forge-cyan/20",
              },
              {
                icon: Store,
                step: "03",
                title: "Sell It",
                desc: "Package your module, stack, or full project as a marketplace template. Set your tier, write a description, hit publish.",
                color: "text-forge-gold",
                bgColor: "bg-forge-gold/10 border-forge-gold/20",
              },
              {
                icon: Coins,
                step: "04",
                title: "Earn Forever",
                desc: "Every purchase sends credits straight to your account. Refer other builders and earn 10% of their marketplace spend too.",
                color: "text-forge-emerald",
                bgColor: "bg-forge-emerald/10 border-forge-emerald/20",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className={`ffx-card glass-strong rounded-2xl p-6 sm:p-7 border ${item.bgColor} hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)] transition-all duration-500 relative`}
              >
                <span className="absolute top-4 right-4 text-[10px] font-mono font-bold text-muted-foreground/40">{item.step}</span>
                <div className={`w-12 h-12 rounded-xl ${item.bgColor} border flex items-center justify-center mb-4`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <h3 className={`text-base sm:text-lg font-display font-bold mb-2 ${item.color} tracking-wide`}>{item.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* The "why this matters" punch */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="ffx-card glass-strong rounded-2xl p-8 sm:p-10 border border-forge-gold/20 glow-primary"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-lg sm:text-xl font-display font-bold tracking-wide mb-4">
                  Why builders are switching to <span className="text-forge-gold">owned AI</span>
                </h3>
                <ul className="space-y-3">
                  {[
                    { icon: Lock, text: "No API keys = no surprise bills. Run your model offline, indefinitely." },
                    { icon: Crown, text: "You keep 100% of template sales. No platform cut on your work." },
                    { icon: Repeat, text: "Referral revenue: 10% of every credit your network spends on the marketplace." },
                    { icon: Shield, text: "Your training data never leaves your machine. Zero telemetry." },
                    { icon: Fingerprint, text: "Cognitive Fingerprinting means your model actually thinks like you — not a generic LLM." },
                  ].map((point, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                      className="flex items-start gap-3 text-sm text-muted-foreground font-medium"
                    >
                      <point.icon className="h-4 w-4 text-forge-gold shrink-0 mt-0.5" />
                      <span>{point.text}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                {[
                  { numValue: 100, suffix: "%", display: null, label: "Yours", sub: "No lock-in, no expiry" },
                  { numValue: 0, suffix: "", display: "$0", label: "API Costs", sub: "Runs on your hardware" },
                  { numValue: 10, suffix: "%", display: null, label: "Referral Cut", sub: "Passive credit income" },
                  { numValue: null, suffix: "", display: "∞", label: "Resale", sub: "Sell the same template forever" },
                ].map((s) => (
                  <div key={s.label} className="glass rounded-xl p-3 sm:p-4">
                    <p className="text-xl sm:text-2xl font-display font-bold gradient-text">
                      {s.numValue !== null ? <CountUp value={s.numValue} suffix={s.suffix} prefix={s.display === "$0" ? "$" : ""} /> : s.display}
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-foreground mt-1">{s.label}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border/20 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold mb-5">
                <span className="text-foreground font-bold">Other platforms rent you access.</span>{" "}
                Soupy gives you the training kit, the model, and the marketplace — then gets out of the way.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/marketplace">
                  <Button variant="outline" className="font-bold border-forge-gold/30 hover:border-forge-gold/60 hover:glow-primary transition-all">
                    <Store className="h-4 w-4 mr-2" /> Browse Marketplace <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/slm-lab">
                  <Button size="lg" className="gradient-primary text-primary-foreground font-bold glow-primary px-8">
                    <Brain className="h-4 w-4 mr-2" /> Start Building <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════ HOW IT WORKS VIDEOS ════════════════════ */}
      <HowItWorksVideos />

      {/* ════════════════════ REAL USE CASES ════════════════════ */}
      <section id="use-cases" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl md:text-4xl font-display font-bold mb-3 tracking-wide">Built for Real Industries</h2>
            <p className="text-xs sm:text-sm text-muted-foreground text-balance font-medium">Not toy demos. These are production patterns used by contractors, legal teams, and field operators.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {realUseCases.map((uc, i) => (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`ffx-card glass rounded-xl p-5 sm:p-7 border-l-4 ${uc.color} hover:glow-primary transition-all duration-500 cursor-pointer group`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] font-display">{uc.industry}</span>
                  <Badge variant="outline" className="text-[10px] border-primary/20 font-semibold">{uc.type}</Badge>
                </div>
                <h3 className="font-display font-bold text-base sm:text-lg mb-2 group-hover:text-primary transition-colors tracking-wide">{uc.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">{uc.desc}</p>
                {uc.modules > 0 && (
                  <div className="mt-3 text-[10px] text-primary/70 font-semibold">{uc.modules} specialist modules</div>
                )}
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/templates">
              <Button variant="outline" className="font-bold border-primary/20 hover:border-primary/40 hover:glow-primary transition-all">
                Browse All Templates <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════ SOCIAL PROOF ════════════════════ */}
      <SocialProof />

      {/* ════════════════════ CTA ════════════════════ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-40" />
        <PyreflyBackground count={30} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center ffx-card glass-strong rounded-2xl p-10 sm:p-14 glow-primary relative z-10"
        >
          <h2 className="text-xl sm:text-2xl md:text-4xl font-display font-bold mb-4 tracking-wide">
            Stop Prompting.{" "}
            <span className="gradient-text">Start Engineering.</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-8 max-w-lg mx-auto font-medium leading-relaxed">
            Build modular AI systems with defined roles, traceable behavior, and real-world deployment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="gradient-primary text-primary-foreground px-10 py-6 text-base font-bold w-full sm:w-auto glow-primary">
                Start Building Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto py-6 text-base font-semibold border-primary/20 hover:glow-primary">View Pricing</Button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 mt-8 text-xs sm:text-sm text-muted-foreground font-semibold">
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-forge-emerald" /> Free tier</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-forge-emerald" /> No credit card</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-forge-emerald" /> Export anytime</div>
          </div>
        </motion.div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer className="relative py-10 sm:py-14 px-4 sm:px-6">
        <FFXDivider className="mb-10" />
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
            <div>
              <Link to="/" className="flex items-center gap-2.5 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary glow-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-base font-bold font-display tracking-wider">Soupy<span className="gradient-text">Forge</span></span>
              </Link>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xs font-medium">The modular AI development kitchen for specialist systems.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="font-bold font-display tracking-wide mb-3 text-primary/80">Product</div>
                <div className="space-y-2 text-muted-foreground text-xs sm:text-sm font-medium">
                  <div><Link to="/templates" className="hover:text-primary transition-colors duration-300">Templates</Link></div>
                  <div><Link to="/pricing" className="hover:text-primary transition-colors duration-300">Pricing</Link></div>
                  <div><Link to="/marketplace" className="hover:text-primary transition-colors duration-300">Marketplace</Link></div>
                </div>
              </div>
              <div>
                <div className="font-bold font-display tracking-wide mb-3 text-primary/80">Resources</div>
                <div className="space-y-2 text-muted-foreground text-xs sm:text-sm font-medium">
                  <div><Link to="/white-paper" className="hover:text-primary transition-colors duration-300">White Paper</Link></div>
                  <div><Link to="/self-host" className="hover:text-primary transition-colors duration-300">Self-Host Guide</Link></div>
                  <div><Link to="/deploy/phone" className="hover:text-primary transition-colors duration-300">Phone Deploy</Link></div>
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="font-bold font-display tracking-wide mb-3 text-primary/80">Legal</div>
                <div className="space-y-2 text-muted-foreground text-xs sm:text-sm font-medium">
                  <div><Link to="/privacy" className="hover:text-primary transition-colors duration-300">Privacy Policy</Link></div>
                  <div><Link to="/terms" className="hover:text-primary transition-colors duration-300">Terms of Service</Link></div>
                  <div><a href="mailto:support@soupy.com" className="hover:text-primary transition-colors duration-300">Contact</a></div>
                </div>
              </div>
            </div>
          </div>
          <FFXDivider className="mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-muted-foreground font-medium">
            <span>© 2026 Soupy. All rights reserved.</span>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-primary transition-colors duration-300">Privacy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors duration-300">Terms</Link>
              <span className="text-muted-foreground/50 cursor-default">Status</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
