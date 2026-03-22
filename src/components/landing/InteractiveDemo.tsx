import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Brain, Layers, Smartphone, ChevronRight, Zap,
  CheckCircle2, Settings2, GitBranch, ArrowRight
} from "lucide-react";

const tabs = [
  {
    id: "module",
    label: "Build a Module",
    icon: Brain,
    color: "text-forge-gold",
    bgColor: "bg-forge-gold/10 border-forge-gold/30",
    activeColor: "bg-forge-gold/20 border-forge-gold/50 text-forge-gold",
  },
  {
    id: "stack",
    label: "Wire a Stack",
    icon: Layers,
    color: "text-primary",
    bgColor: "bg-primary/10 border-primary/30",
    activeColor: "bg-primary/20 border-primary/50 text-primary",
  },
  {
    id: "app",
    label: "Ship an App",
    icon: Smartphone,
    color: "text-forge-emerald",
    bgColor: "bg-forge-emerald/10 border-forge-emerald/30",
    activeColor: "bg-forge-emerald/20 border-forge-emerald/50 text-forge-emerald",
  },
] as const;

function ModuleDemo() {
  const steps = [
    { label: "Name your module", value: "Marine Scope Summarizer", done: true },
    { label: "Define its role", value: "specialist • classifier", done: true },
    { label: "Set guardrails", value: "3 constraints • deterministic mode", done: true },
    { label: "Test & version", value: "v6 — 94% accuracy", done: false },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 className="h-4 w-4 text-forge-gold" />
        <span className="text-xs font-bold font-display tracking-wide">Module Configuration</span>
      </div>
      {steps.map((step, i) => (
        <motion.div
          key={step.label}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12 }}
          className="flex items-center gap-3 glass rounded-lg px-4 py-3"
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-forge-emerald/20" : "bg-primary/10"}`}>
            {step.done ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-forge-emerald" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-muted-foreground font-medium">{step.label}</div>
            <div className="text-xs font-bold truncate">{step.value}</div>
          </div>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
        </motion.div>
      ))}
    </div>
  );
}

function StackDemo() {
  const nodes = [
    { label: "Intake", color: "bg-forge-cyan/20 border-forge-cyan/40 text-forge-cyan", x: 0 },
    { label: "Scope", color: "bg-primary/20 border-primary/40 text-primary", x: 1 },
    { label: "Cost", color: "bg-forge-gold/20 border-forge-gold/40 text-forge-gold", x: 2 },
    { label: "Risk", color: "bg-forge-rose/20 border-forge-rose/40 text-forge-rose", x: 2 },
    { label: "Proposal", color: "bg-forge-emerald/20 border-forge-emerald/40 text-forge-emerald", x: 3 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold font-display tracking-wide">Pipeline Canvas</span>
        <Badge variant="outline" className="text-[9px] ml-auto border-forge-emerald/30 text-forge-emerald">5 nodes • 5 edges</Badge>
      </div>
      <div className="space-y-2">
        {[
          { from: "Intake", to: "Scope", delay: 0 },
          { from: "Scope", to: "Cost + Risk", delay: 0.15, parallel: true },
          { from: "Cost + Risk", to: "Proposal", delay: 0.3 },
        ].map((edge, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: edge.delay }}
            className="flex items-center gap-2"
          >
            <div className="glass rounded-lg px-3 py-2 text-[11px] font-bold min-w-[60px] text-center">{edge.from}</div>
            <div className="flex-1 flex items-center">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/40 to-forge-cyan/40" />
              <ArrowRight className="h-3 w-3 text-primary/60 shrink-0 mx-1" />
            </div>
            <div className={`glass rounded-lg px-3 py-2 text-[11px] font-bold min-w-[60px] text-center ${edge.parallel ? "border border-forge-gold/20" : ""}`}>
              {edge.to}
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-[10px] text-forge-emerald font-mono text-center pt-2"
      >
        ✓ Pipeline validated • Est. 2.3s per run
      </motion.div>
    </div>
  );
}

function AppDemo() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Smartphone className="h-4 w-4 text-forge-emerald" />
        <span className="text-xs font-bold font-display tracking-wide">App Preview</span>
        <Badge variant="outline" className="text-[9px] ml-auto border-primary/30 text-primary">Android + PWA</Badge>
      </div>
      <div className="mx-auto w-[180px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-primary/20 bg-background/80 p-3 shadow-lg"
        >
          <div className="rounded-xl bg-primary/10 h-8 flex items-center justify-center text-[10px] font-bold mb-2 text-primary font-display">
            Field Inspector
          </div>
          <div className="space-y-1.5">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="rounded-lg bg-forge-cyan/10 h-14 flex items-center justify-center text-[10px] text-forge-cyan font-semibold border border-forge-cyan/10"
            >
              📷 Tap to Capture
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              className="rounded-lg bg-forge-emerald/10 h-6 flex items-center justify-center text-[9px] text-forge-emerald font-semibold border border-forge-emerald/10"
            >
              📍 GPS: 29.9511° N
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-1"
            >
              <div className="rounded-lg bg-forge-gold/10 h-7 flex items-center justify-center text-[8px] text-forge-gold font-semibold border border-forge-gold/10">✓ Checklist</div>
              <div className="rounded-lg bg-primary/10 h-7 flex items-center justify-center text-[8px] text-primary font-semibold border border-primary/10">↑ Sync</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="text-[10px] text-muted-foreground text-center font-mono"
      >
        Generated from: "Build an inspection app with photo capture"
      </motion.div>
    </div>
  );
}

export function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState<string>("module");

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 relative">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <Badge variant="outline" className="text-[10px] mb-4 border-forge-cyan/30 text-forge-cyan font-semibold">
            <Zap className="h-3 w-3 mr-1" /> See it in action
          </Badge>
          <h2 className="text-xl sm:text-2xl md:text-4xl font-display font-bold tracking-wide">
            Three clicks from idea to <span className="gradient-text">deployed AI</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-3 max-w-lg mx-auto font-medium">
            Pick a workflow. Watch it build itself.
          </p>
        </motion.div>

        {/* Tab buttons */}
        <div className="flex justify-center gap-2 sm:gap-3 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all duration-300 ${
                activeTab === tab.id ? tab.activeColor : "glass border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ").pop()}</span>
            </button>
          ))}
        </div>

        {/* Demo content */}
        <div className="ffx-card glass-strong rounded-2xl p-6 sm:p-8 min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "module" && <ModuleDemo />}
              {activeTab === "stack" && <StackDemo />}
              {activeTab === "app" && <AppDemo />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
