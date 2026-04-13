import { Link } from "react-router-dom";
import bgNight from "@/assets/bg-landscape.jpg";
import bgDay from "@/assets/bg-landscape-day.jpg";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Globe, Smartphone, Brain, Layers, ArrowRight, Zap, Shield, Eye,
  Play, CheckCircle2, ChevronRight, Command, GitBranch, Target, Cpu,
  FileCode, Workflow, Lock, BarChart3, Wrench, Scissors, Database, FlaskConical, Eraser,
  Menu, X, Moon, Sun, HardDrive, Upload, Fingerprint, Server, Store, Coins, Crown, Repeat, Timer,
  WifiOff, Download
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { FFXDivider } from "@/components/FFXOrnament";
import { useTheme } from "@/providers/ThemeProvider";

import { InteractiveDemo } from "@/components/landing/InteractiveDemo";
import { HowItWorksVideos } from "@/components/landing/HowItWorksVideos";
import { ForgeDoodle } from "@/components/landing/ForgeDoodle";
import { PhotoTransform } from "@/components/landing/PhotoTransform";
import { WhatsNewPanel } from "@/components/landing/WhatsNewPanel";
import { OfflineDemo } from "@/components/landing/OfflineDemo";

// ------- SALE COUNTDOWN BANNER -------

function SaleBanner() {
  const saleEnd = new Date("2026-04-06T23:59:59").getTime();
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, saleEnd - Date.now()));

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => {
      const remaining = Math.max(0, saleEnd - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [saleEnd, timeLeft <= 0]);

  if (timeLeft <= 0) return null;

  const days = Math.floor(timeLeft / 86400000);
  const hours = Math.floor((timeLeft % 86400000) / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-14 inset-x-0 z-40"
    >
      <div className="bg-gradient-to-r from-forge-amber/90 via-forge-gold/90 to-forge-amber/90 dark:from-forge-amber/80 dark:via-forge-gold/80 dark:to-forge-amber/80 backdrop-blur-sm border-b border-forge-gold/30 py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <div className="flex items-center gap-2 text-background dark:text-background font-bold text-sm sm:text-base">
            <Zap className="h-4 w-4 animate-pulse" />
            <span>🔥 Easter Sale — 50% off all credit packs!</span>
          </div>
          <div className="flex items-center gap-1.5 text-background/90 dark:text-background/90 font-mono text-xs sm:text-sm font-semibold">
            <Timer className="h-3.5 w-3.5" />
            <span>Ends in</span>
            <span className="bg-background/20 rounded px-1.5 py-0.5">{days}d</span>
            <span className="bg-background/20 rounded px-1.5 py-0.5">{String(hours).padStart(2, "0")}h</span>
            <span className="bg-background/20 rounded px-1.5 py-0.5">{String(minutes).padStart(2, "0")}m</span>
            <span className="bg-background/20 rounded px-1.5 py-0.5">{String(seconds).padStart(2, "0")}s</span>
          </div>
          <Link to="/pricing" className="text-background dark:text-background text-xs sm:text-sm font-bold underline underline-offset-2 hover:no-underline">
            Grab the deal →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

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

// ------- HERO VIDEO -------

function HeroVideo() {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.7 }}
      className="relative max-w-3xl mx-auto mt-10 sm:mt-12"
    >
      <div className="relative rounded-xl overflow-hidden border border-primary/20 glow-primary aspect-video bg-background/80">
        <video
          ref={videoRef}
          src="/videos/soupy-forge-awakening.mp4"
          muted
          playsInline
          loop
          poster=""
          className="w-full h-full object-cover"
          onEnded={() => setPlaying(false)}
        />
        {!playing && (
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-background/40 group cursor-pointer transition-all hover:bg-background/30"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full gradient-primary flex items-center justify-center glow-primary group-hover:scale-110 transition-transform">
              <Play className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground ml-1" />
            </div>
            <span className="absolute bottom-4 text-xs sm:text-sm font-semibold text-foreground/80">
              Watch the 15s overview
            </span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ------- INLINE SOCIAL PROOF (compact, above-fold) -------

function InlineSocialProof() {
  const testimonials = [
    {
      quote: "Replaced three AI tools with one Soupy stack. Proposal turnaround went from 3 days to 20 minutes.",
      name: "Marcus R.",
      role: "Marine Construction",
      color: "border-forge-cyan/40",
    },
    {
      quote: "The module system clicks instantly. Each AI does one thing well — no prompt wrestling.",
      name: "Dr. Priya N.",
      role: "BioTech R&D",
      color: "border-forge-gold/40",
    },
    {
      quote: "Generated an Android inspection app for our field team in an afternoon. Using it the next morning.",
      name: "Jake T.",
      role: "Infrastructure Ops",
      color: "border-forge-emerald/40",
    },
  ];

  return (
    <div className="py-0">
      <div className="max-w-full">
        {/* Stats row — 2x2 on mobile, 4-col on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-8 sm:mb-10"
        >
          {[
            { value: "12", label: "Module Types", color: "text-primary" },
            { value: "< 5 min", label: "Idea → Deploy", color: "text-forge-gold" },
            { value: "✓", label: "Offline AI Inference", color: "text-forge-cyan" },
            { value: "$0", label: "To Start", color: "text-forge-emerald" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-xl p-3 sm:p-4 text-center"
            >
              <div className={`text-lg sm:text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[9px] sm:text-xs text-muted-foreground font-medium mt-0.5 sm:mt-1">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials — horizontal scroll on mobile, grid on desktop */}
        <div className="flex md:grid md:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-3 px-3 md:mx-0 md:px-0">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className={`glass rounded-xl p-4 sm:p-5 border-l-4 ${t.color} min-w-[280px] md:min-w-0 snap-center shrink-0 md:shrink`}
            >
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium italic mb-2 sm:mb-3">
                "{t.quote}"
              </p>
              <div className="text-[11px] font-bold">{t.name}</div>
              <div className="text-[10px] text-muted-foreground">{t.role}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ------- ARCHITECTURE DIAGRAM -------

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
      <div className="relative w-full max-w-[640px] h-[100px] mx-auto hidden sm:block">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 640 100" fill="none">
          <defs>
            <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0.6)" />
              <stop offset="100%" stopColor="hsl(var(--forge-cyan) / 0.6)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
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
    desc: "Surgically remove unwanted behaviors from base models — corporate tone, hallucination patterns, hedging.",
    tag: "Task Vector Subtraction",
    color: "text-forge-rose",
    bgColor: "bg-forge-rose/10 border-forge-rose/20",
  },
  {
    icon: Database,
    title: "Dataset Engineering",
    desc: "Build training datasets from scratch — scrape, interview, capture from mobile, harvest with Chrome extension, import from HuggingFace.",
    tag: "Chrome Extension + 5 Perspectives",
    color: "text-forge-cyan",
    bgColor: "bg-forge-cyan/10 border-forge-cyan/20",
  },
  {
    icon: FlaskConical,
    title: "Perspective Training (CDPT)",
    desc: "Each data point is enriched through five cognitive lenses. Your model learns nuance, not just patterns.",
    tag: "Cognitive Dense Perspective",
    color: "text-forge-gold",
    bgColor: "bg-forge-gold/10 border-forge-gold/20",
  },
  {
    icon: Scissors,
    title: "Popcorn Injection",
    desc: "Densify specific traits into your model — inject curiosity, domain expertise, or reasoning style.",
    tag: "Trait Densification",
    color: "text-forge-violet",
    bgColor: "bg-forge-violet/10 border-forge-violet/20",
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
  const [pastHero, setPastHero] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark = theme === "system" ? resolvedTheme === "dark" : theme === "dark";

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  return (
    <div
      className="min-h-screen overflow-hidden relative"
      style={{
        backgroundImage: `url(${isDark ? bgNight : bgDay})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-background/50 dark:bg-background/45 pointer-events-none" />
      <WhatsNewPanel />
      <SEOHead
        title="No-Code AI Agent & Pipeline Builder"
        description="Soupy is a visual AI platform to design agents, build multi-model pipelines, and deploy smart apps to web, Android, or edge devices — no coding or ML experience needed. Start free today."
      />

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary glow-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold font-display tracking-wider">
              Soupy<span className="gradient-text">Lab</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-medium">
            <a href="#how-it-works" className="hover:text-primary transition-colors duration-300">How It Works</a>
            <a href="#use-cases" className="hover:text-primary transition-colors duration-300">Use Cases</a>
            <Link to="/pricing" className="hover:text-primary transition-colors duration-300">Pricing</Link>
            <Link to="/slm-lab" className="hover:text-primary transition-colors duration-300">Try Demo</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hidden sm:inline-flex"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link to="/login" className="hidden sm:block"><Button variant="ghost" size="sm" className="font-semibold">Log in</Button></Link>
            <Link to="/signup" className="hidden sm:block">
              <Button size="sm" className="gradient-primary text-primary-foreground font-semibold glow-primary">
                Start Free
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

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden glass-strong border-t border-border/50 px-4 py-4 space-y-3"
          >
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">How It Works</a>
            <a href="#use-cases" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Use Cases</a>
            <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
            <Link to="/slm-lab" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Try Demo</Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
              className="w-full justify-start gap-2 font-semibold"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              Switch to {isDark ? "light" : "dark"} mode
            </Button>
            <div className="flex gap-2 pt-2 border-t border-border/30">
              <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full font-semibold">Log in</Button>
              </Link>
              <Link to="/signup" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full gradient-primary text-primary-foreground font-semibold">Start Free</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      <SaleBanner />

      {/* ════════════════════ HERO ════════════════════ */}
      <section ref={heroRef} className="relative pt-28 sm:pt-40 pb-6 sm:pb-12 px-3 sm:px-6 overflow-hidden">
        {/* gradient-mesh removed to prevent flicker with bg image */}

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="inline-flex items-center gap-2 mb-4 sm:mb-5 px-3 sm:px-4 py-1.5 rounded-full glass border border-forge-gold/20 text-[10px] sm:text-xs font-semibold text-forge-gold"
            >
              <Sparkles className="h-3 w-3" />
              No-Code AI Development Kitchen
            </motion.div>

            {/* Mobile: tighter, punchier hero text */}
            <h1 className="text-[1.7rem] leading-[1.15] sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-wide sm:leading-[1.1] mb-4 sm:mb-5 text-balance">
              Build <span className="gradient-text">specialist AI</span> that{" "}
              <span className="text-foreground/80">actually works</span>
            </h1>

            <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-5 sm:mb-6 leading-relaxed text-balance font-medium px-1 sm:px-0">
              Design single-purpose AI modules. Wire them into pipelines.
              Deploy to web, Android, or your own hardware.
              <span className="text-foreground font-semibold"> No coding required.</span>
            </p>

            {/* Mobile: full-width stacked buttons with bigger touch targets */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 mb-4">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="gradient-primary text-primary-foreground px-8 sm:px-10 py-5 sm:py-6 text-sm sm:text-base font-bold group w-full sm:w-auto glow-primary min-h-[52px]">
                  Start Building Free <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/demo/module-builder" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto py-5 sm:py-6 text-sm sm:text-base font-semibold border-primary/20 hover:border-primary/40 hover:glow-primary transition-all min-h-[52px]">
                  <Play className="h-4 w-4" /> Try Live Demo
                </Button>
              </Link>
            </div>

            {/* Mobile: horizontal scroll trust badges */}
            <div className="flex items-center justify-center gap-3 sm:gap-8 text-[10px] sm:text-xs text-muted-foreground font-medium overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <CheckCircle2 className="h-3.5 w-3.5 text-forge-emerald/70 shrink-0" />
                <span>50 free credits</span>
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <Shield className="h-3.5 w-3.5 text-forge-emerald/70 shrink-0" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <Lock className="h-3.5 w-3.5 text-forge-emerald/70 shrink-0" />
                <span>Your data stays yours</span>
              </div>
            </div>

            {/* AI Doodle — unique for every visitor */}
            <ForgeDoodle />

            {/* Hero video */}
            <HeroVideo />
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ════════════════════ INTERACTIVE DEMO (high up for instant value) ════════════════════ */}
      <InteractiveDemo />

      {/* ════════════════════ TWO-ROW: SOCIAL PROOF + OFFLINE ════════════════════ */}
      <section className="py-8 sm:py-14 px-3 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Left: Social proof & stats */}
          <div>
            <InlineSocialProof />
          </div>
          {/* Right: Offline demo — high up for technical users */}
          <div className="flex flex-col justify-center">
            <div className="mb-4 text-center lg:text-left">
              <Badge variant="outline" className="text-[10px] mb-2 border-forge-emerald/30 text-forge-emerald font-semibold">
                <WifiOff className="h-3 w-3 mr-1" /> Works Offline
              </Badge>
              <h3 className="text-base sm:text-xl font-display font-bold tracking-wide">
                AI that runs on <span className="gradient-text">your device</span>
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-medium">
                No server. No API key. No internet. Your data never leaves your machine.
              </p>
            </div>
            <OfflineDemo />
          </div>
        </div>
      </section>

      {/* ════════════════════ TWO-ROW: PHOTO TRANSFORM + ANTI-PATTERN ════════════════════ */}
      <section className="py-6 sm:py-10 px-3 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
          <PhotoTransform />
          <div className="text-center lg:text-left">
            <FFXDivider className="mb-5 lg:hidden" />
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              <span className="font-bold text-foreground font-display tracking-wide">Soupy is not a wrapper around ChatGPT.</span>{" "}
              It's a modular AI development kitchen where every ingredient has a defined role, explicit boundaries, and traceable flavor.
            </p>
            <FFXDivider className="mt-5 lg:hidden" />
          </div>
        </div>
      </section>

      {/* ════════════════════ THREE DIFFERENTIATORS ════════════════════ */}
      <section id="how-it-works" className="py-12 sm:py-24 px-3 sm:px-6 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8 sm:mb-20">
            <Badge variant="outline" className="text-[10px] mb-3 sm:mb-4 border-forge-gold/30 text-forge-gold font-semibold">
              What makes Soupy different
            </Badge>
            <h2 className="text-lg sm:text-2xl md:text-4xl font-display font-bold text-balance tracking-wide">
              Three things we do that nobody else does
            </h2>
          </motion.div>

          <div className="space-y-10 sm:space-y-28">
            {differentiators.map((d, i) => (
              <motion.div
                key={d.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className={`flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} gap-5 sm:gap-12 items-center`}
              >
                {/* Text content — more compact on mobile */}
                <div className="flex-1 space-y-3 sm:space-y-5">
                  <div className="flex items-center gap-3 sm:block">
                    <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${d.color} flex items-center justify-center glow-primary shrink-0`}>
                      <d.icon className="h-5 w-5 sm:h-7 sm:w-7 text-primary-foreground" />
                    </div>
                    <div className="sm:mt-3">
                      <h3 className="text-base sm:text-2xl font-display font-bold tracking-wide">{d.title}</h3>
                      <p className="text-xs sm:text-sm font-semibold text-primary">{d.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">{d.desc}</p>
                  <ul className="grid grid-cols-1 sm:block gap-1.5 sm:space-y-3">
                    {d.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-2 sm:gap-2.5 text-[11px] sm:text-sm font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-forge-emerald shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 ffx-card glass rounded-xl p-4 sm:p-7 min-h-[160px] sm:min-h-[220px] flex items-center justify-center w-full">
                  {i === 0 && (
                    <div className="space-y-2 sm:space-y-3 w-full">
                      {[
                        { icon: Brain, name: "Marine Scope Summarizer", sub: "specialist • temp 0.3 • deterministic", ver: "v6", iconColor: "text-forge-gold" },
                        { icon: Shield, name: "Red Team Critic", sub: "critic • temp 0.5 • skeptical tone", ver: "v3", iconColor: "text-forge-rose" },
                        { icon: Cpu, name: "Cost Estimator", sub: "specialist • SLM mode • JSON output", ver: "v9", iconColor: "text-forge-cyan" },
                      ].map((m) => (
                        <div key={m.name} className="flex items-center gap-2.5 sm:gap-3 glass rounded-lg px-3 py-2.5 sm:py-3 hover:glow-primary transition-all">
                          <m.icon className={`h-4 w-4 ${m.iconColor} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] sm:text-xs font-bold truncate">{m.name}</div>
                            <div className="text-[9px] sm:text-[10px] text-muted-foreground truncate">{m.sub}</div>
                          </div>
                          <Badge className="bg-forge-emerald/15 text-forge-emerald text-[8px] sm:text-[9px] shrink-0 border-forge-emerald/20">{m.ver}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {i === 1 && <ArchitectureDiagram />}
                  {i === 2 && (
                    <div className="w-[180px] sm:w-[200px] mx-auto">
                      <div className="ffx-card rounded-2xl border border-primary/20 bg-background/80 p-2.5 sm:p-3 glow-primary">
                        <div className="rounded-xl bg-primary/10 h-8 sm:h-9 flex items-center justify-center text-[10px] sm:text-[11px] font-bold mb-1.5 sm:mb-2 text-primary font-display tracking-wide">
                          Field Inspector
                        </div>
                        <div className="space-y-1 sm:space-y-1.5">
                          <div className="rounded-lg bg-forge-cyan/10 h-12 sm:h-16 flex items-center justify-center text-[9px] sm:text-[10px] text-forge-cyan font-semibold border border-forge-cyan/10">📷 Photo Capture</div>
                          <div className="rounded-lg bg-forge-emerald/10 h-6 sm:h-7 flex items-center justify-center text-[9px] sm:text-[10px] text-forge-emerald font-semibold border border-forge-emerald/10">📍 GPS Tagged</div>
                          <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                            <div className="rounded-lg bg-forge-gold/10 h-7 sm:h-8 flex items-center justify-center text-[8px] sm:text-[9px] text-forge-gold font-semibold border border-forge-gold/10">Checklist</div>
                            <div className="rounded-lg bg-primary/10 h-7 sm:h-8 flex items-center justify-center text-[8px] sm:text-[9px] text-primary font-semibold border border-primary/10">Sync ↑</div>
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
      <section className="relative py-10 sm:py-20 px-3 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-6 sm:mb-14">
            <h2 className="text-base sm:text-xl md:text-3xl font-display font-bold tracking-wide">Architecture Principles</h2>
            <p className="text-[11px] sm:text-sm text-muted-foreground mt-2 sm:mt-3 font-medium">How Soupy thinks about AI systems.</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-5">
            {architecturePoints.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="ffx-card glass rounded-xl px-3 py-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row items-start gap-2 sm:gap-3 hover:glow-primary transition-all duration-500"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <p.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
                <div>
                  <div className="text-[11px] sm:text-sm font-bold font-display tracking-wide">{p.label}</div>
                  <div className="text-[10px] sm:text-sm text-muted-foreground mt-0.5 font-medium leading-snug">{p.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ DEEP CUSTOMIZATION ════════════════════ */}
      <section className="py-10 sm:py-24 px-3 sm:px-6 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} className="text-center mb-8 sm:mb-16">
            <Badge variant="outline" className="text-[10px] mb-3 sm:mb-4 border-forge-rose/30 text-forge-rose font-semibold">
              This is not normal AI building
            </Badge>
            <h2 className="text-lg sm:text-2xl md:text-4xl font-display font-bold text-balance tracking-wide">
              Control what your model <span className="gradient-text">learns — and unlearns</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            {deepCustomization.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="ffx-card glass rounded-xl p-4 sm:p-6 hover:glow-primary transition-all duration-500 group"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg border flex items-center justify-center shrink-0 ${item.bgColor}`}>
                    <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <h3 className="text-xs sm:text-base font-display font-bold tracking-wide">{item.title}</h3>
                      <Badge variant="outline" className="text-[8px] sm:text-[9px] px-1.5 py-0 opacity-70 font-mono shrink-0">{item.tag}</Badge>
                    </div>
                    <p className="text-[11px] sm:text-sm text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ YOUR BRAIN YOUR MODEL ════════════════════ */}
      <section className="relative py-14 sm:py-28 px-3 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-60" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-14"
          >
            <Badge variant="outline" className="text-[10px] mb-4 sm:mb-5 border-primary/30 text-primary font-semibold tracking-wider">
              THE REAL POWER
            </Badge>
            <h2 className="text-xl sm:text-3xl md:text-5xl font-display font-bold tracking-wide leading-[1.15] mb-4 sm:mb-6">
              Put <span className="gradient-text">your brain</span> inside a model.
            </h2>
            <p className="text-xs sm:text-base text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed px-1 sm:px-0">
              Your knowledge. Your domain expertise. Your reasoning style.
              Inject it all into a small language model — then train on <span className="text-foreground font-bold">0 to 100,000+ data points</span>,
              on whatever hardware you have.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-8 mb-8 sm:mb-14">
            {[
              { icon: Upload, stat: "Any Knowledge", desc: "Conversations, PDFs, voice memos, URLs, photos, HuggingFace datasets.", color: "text-forge-gold", bgColor: "bg-forge-gold/10 border-forge-gold/20" },
              { icon: Fingerprint, stat: "Your Reasoning", desc: "Cognitive Fingerprinting extracts how you think and bakes it into training.", color: "text-primary", bgColor: "bg-primary/10 border-primary/20" },
              { icon: HardDrive, stat: "Any Device", desc: "Laptop, AMD GPU, NVIDIA, Raspberry Pi, phone. If it runs Ollama, it runs your model.", color: "text-forge-cyan", bgColor: "bg-forge-cyan/10 border-forge-cyan/20" },
            ].map((item, i) => (
              <motion.div
                key={item.stat}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className={`ffx-card glass-strong rounded-2xl p-5 sm:p-7 text-center border ${item.bgColor} hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)] transition-all duration-500`}
              >
                <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl ${item.bgColor} border flex items-center justify-center mx-auto mb-3 sm:mb-5`}>
                  <item.icon className={`h-5 w-5 sm:h-7 sm:w-7 ${item.color}`} />
                </div>
                <h3 className={`text-base sm:text-lg font-display font-bold mb-2 sm:mb-3 ${item.color} tracking-wide`}>{item.stat}</h3>
                <p className="text-[11px] sm:text-sm text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <Link to="/slm-lab">
              <Button size="lg" className="gradient-primary text-primary-foreground font-bold glow-primary px-6 sm:px-8 min-h-[48px]">
                <Brain className="h-4 w-4 mr-2" /> Open SLM Lab <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════ REAL USE CASES ════════════════════ */}
      <section id="use-cases" className="py-10 sm:py-24 px-3 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-6 sm:mb-14">
            <h2 className="text-lg sm:text-2xl md:text-4xl font-display font-bold mb-2 sm:mb-3 tracking-wide">Built for Real Industries</h2>
            <p className="text-[11px] sm:text-sm text-muted-foreground text-balance font-medium">Not toy demos. Production patterns used by contractors, legal teams, and field operators.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            {realUseCases.map((uc, i) => (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`ffx-card glass rounded-xl p-4 sm:p-7 border-l-4 ${uc.color} hover:glow-primary transition-all duration-500 cursor-pointer group`}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] font-display">{uc.industry}</span>
                  <Badge variant="outline" className="text-[9px] sm:text-[10px] border-primary/20 font-semibold">{uc.type}</Badge>
                </div>
                <h3 className="font-display font-bold text-sm sm:text-lg mb-1.5 sm:mb-2 group-hover:text-primary transition-colors tracking-wide">{uc.title}</h3>
                <p className="text-[11px] sm:text-sm text-muted-foreground leading-relaxed font-medium">{uc.desc}</p>
                {uc.modules > 0 && (
                  <div className="mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-primary/70 font-semibold">{uc.modules} specialist modules</div>
                )}
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-6 sm:mt-10">
            <Link to="/templates">
              <Button variant="outline" className="font-bold border-primary/20 hover:border-primary/40 hover:glow-primary transition-all text-sm min-h-[44px]">
                Browse All Templates <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════ HOW IT WORKS VIDEOS (deep-dive, lower priority) ════════════════════ */}
      <HowItWorksVideos />

      {/* ════════════════════ CTA ════════════════════ */}
      <section className="py-10 sm:py-24 px-3 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-40" />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center ffx-card glass-strong rounded-2xl p-6 sm:p-14 glow-primary relative z-10"
        >
          <h2 className="text-lg sm:text-2xl md:text-4xl font-display font-bold mb-3 sm:mb-4 tracking-wide">
            Stop Prompting.{" "}
            <span className="gradient-text">Start Engineering.</span>
          </h2>
          <p className="text-[11px] sm:text-sm text-muted-foreground mb-5 sm:mb-8 max-w-lg mx-auto font-medium leading-relaxed">
            Build modular AI systems with defined roles, traceable behavior, and real-world deployment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="gradient-primary text-primary-foreground px-8 sm:px-10 py-5 sm:py-6 text-sm sm:text-base font-bold w-full sm:w-auto glow-primary min-h-[48px]">
                Start Building Free <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Link to="/pricing" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto py-5 sm:py-6 text-sm sm:text-base font-semibold border-primary/20 hover:glow-primary min-h-[48px]">View Pricing</Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 sm:gap-8 mt-5 sm:mt-8 text-[10px] sm:text-sm text-muted-foreground font-semibold">
            <div className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-forge-emerald" /> Free tier</div>
            <div className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-forge-emerald" /> No card</div>
            <div className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-forge-emerald" /> Export</div>
          </div>
        </motion.div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer className="relative py-8 sm:py-14 px-3 sm:px-6">
        <FFXDivider className="mb-6 sm:mb-10" />
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 sm:gap-8 mb-6 sm:mb-10">
            <div>
              <Link to="/" className="flex items-center gap-2.5 mb-2 sm:mb-3">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg gradient-primary glow-primary">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
                </div>
                <span className="text-sm sm:text-base font-bold font-display tracking-wider">Soupy<span className="gradient-text">Lab</span></span>
              </Link>
              <p className="text-[11px] sm:text-sm text-muted-foreground max-w-xs font-medium">The modular AI development kitchen for specialist systems.</p>
            </div>
            <div className="grid grid-cols-3 gap-4 sm:gap-8 text-xs sm:text-sm w-full md:w-auto">
              <div>
                <div className="font-bold font-display tracking-wide mb-2 sm:mb-3 text-primary/80 text-[11px] sm:text-sm">Product</div>
                <div className="space-y-1.5 sm:space-y-2 text-muted-foreground text-[11px] sm:text-sm font-medium">
                  <div><Link to="/templates" className="hover:text-primary transition-colors duration-300">Templates</Link></div>
                  <div><Link to="/pricing" className="hover:text-primary transition-colors duration-300">Pricing</Link></div>
                  <div><Link to="/marketplace" className="hover:text-primary transition-colors duration-300">Marketplace</Link></div>
                </div>
              </div>
              <div>
                <div className="font-bold font-display tracking-wide mb-2 sm:mb-3 text-primary/80 text-[11px] sm:text-sm">Resources</div>
                <div className="space-y-1.5 sm:space-y-2 text-muted-foreground text-[11px] sm:text-sm font-medium">
                  <div><Link to="/white-paper" className="hover:text-primary transition-colors duration-300">White Paper</Link></div>
                  <div><Link to="/self-host" className="hover:text-primary transition-colors duration-300">Self-Host</Link></div>
                  <div><Link to="/deploy/phone" className="hover:text-primary transition-colors duration-300">Phone Deploy</Link></div>
                </div>
              </div>
              <div>
                <div className="font-bold font-display tracking-wide mb-2 sm:mb-3 text-primary/80 text-[11px] sm:text-sm">Legal</div>
                <div className="space-y-1.5 sm:space-y-2 text-muted-foreground text-[11px] sm:text-sm font-medium">
                  <div><Link to="/privacy" className="hover:text-primary transition-colors duration-300">Privacy</Link></div>
                  <div><Link to="/terms" className="hover:text-primary transition-colors duration-300">Terms</Link></div>
                  <div><a href="mailto:support@soupy.com" className="hover:text-primary transition-colors duration-300">Contact</a></div>
                </div>
              </div>
            </div>
          </div>
          <FFXDivider className="mb-4 sm:mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[10px] sm:text-sm text-muted-foreground font-medium">
            <span>© 2026 Soupy. All rights reserved.</span>
            <div className="flex gap-4 sm:gap-6">
              <Link to="/privacy" className="hover:text-primary transition-colors duration-300">Privacy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors duration-300">Terms</Link>
              <span className="text-muted-foreground/50 cursor-default">Status</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Sticky mobile CTA ── */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: pastHero ? 0 : 80 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed bottom-0 inset-x-0 z-50 md:hidden"
      >
        <div className="glass-strong border-t border-primary/15 px-4 py-3 flex items-center gap-3">
          <p className="text-xs font-medium text-muted-foreground flex-1 leading-tight">
            50 free credits — no card needed
          </p>
          <Button asChild size="sm" className="gradient-primary glow-primary min-h-[44px] px-5 text-sm font-bold shrink-0">
            <Link to="/signup">Start Free</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
