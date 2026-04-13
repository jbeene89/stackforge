import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Cpu, Database, Zap, Play, CheckCircle2, Loader2, Sparkles
} from "lucide-react";

/* ── Fake catalog ──────────────────────────────────────────────── */
const MODELS = [
  { id: "tinyllama-1b", label: "TinyLlama 1.1B", params: "1.1B" },
  { id: "llama-3b", label: "Llama 3.2 3B", params: "3B" },
  { id: "gemma-2b", label: "Gemma 2 2B", params: "2B" },
  { id: "qwen-1.7b", label: "Qwen 3 1.7B", params: "1.7B" },
  { id: "phi-3.8b", label: "Phi-4 Mini", params: "3.8B" },
];

const DATASETS = [
  { id: "science", label: "🔬 Lab Science Notes", samples: 847, icon: "🧪" },
  { id: "cooking", label: "🍳 Chef's Recipes", samples: 1203, icon: "👨‍🍳" },
  { id: "fitness", label: "💪 Personal Trainer", samples: 634, icon: "🏋️" },
  { id: "code", label: "💻 Code Reviews", samples: 2100, icon: "🤖" },
  { id: "music", label: "🎵 Music Theory", samples: 512, icon: "🎹" },
];

type OutputEntry = { text: string; type: "log" | "result" };

const PERSONA_OUTPUTS: Record<string, { logs: string[]; greeting: string; answer: string }> = {
  science: {
    logs: [
      "Loading base weights…",
      "Injecting 847 lab science samples…",
      "Running LoRA fine-tune (3 epochs)…",
      "Applying CDPT perspective enrichment…",
      "Compiling to GGUF…",
    ],
    greeting: "What's in the lab today, boss?",
    answer: "I've got the centrifuge calibrated and the PCR primers thawed. Want me to run the electrophoresis on yesterday's samples while you review the spectrometry results? The pH buffer's at 7.4 — right in the sweet spot. 🧪",
  },
  cooking: {
    logs: [
      "Loading base weights…",
      "Injecting 1,203 recipe samples…",
      "Fine-tuning flavor profile associations…",
      "Calibrating temperature intuitions…",
      "Packaging kitchen-ready model…",
    ],
    greeting: "Chef, what are we cooking tonight?",
    answer: "I'm thinking we sear those duck breasts skin-side down — low and slow — while I reduce the blackberry port sauce. The risotto needs about 18 minutes of stirring. Want me to prep the mise en place while you pick the wine? 🍷",
  },
  fitness: {
    logs: [
      "Loading base weights…",
      "Injecting 634 training program samples…",
      "Learning progressive overload patterns…",
      "Mapping recovery windows…",
      "Building your coach model…",
    ],
    greeting: "Ready to crush it today?",
    answer: "You hit chest yesterday so we're going pull day — 4×8 weighted pull-ups, superset with face pulls. Your deadlift's been climbing so let's test 5 lbs over last week's PR. I'll keep your rest at 90 seconds. Hydrate up. 💪",
  },
  code: {
    logs: [
      "Loading base weights…",
      "Injecting 2,100 code review samples…",
      "Learning architecture patterns…",
      "Absorbing naming conventions…",
      "Deploying review assistant…",
    ],
    greeting: "Got a PR for me to review?",
    answer: "I see you're extracting that service layer — good call. Lines 42-58 could use early returns instead of nested ifs. Also, that useEffect on line 87 is missing the dependency array cleanup. Want me to draft the refactor? 🧑‍💻",
  },
  music: {
    logs: [
      "Loading base weights…",
      "Injecting 512 music theory samples…",
      "Learning harmonic progressions…",
      "Mapping modal interchange patterns…",
      "Tuning the model ear…",
    ],
    greeting: "What key are we jamming in today?",
    answer: "That chord progression you sketched — I-vi-IV-V — is solid but predictable. Try borrowing the ♭VII from Mixolydian in bar 3 for some lift, then resolve through a tritone sub back to the I. It'll give you that Radiohead tension. 🎶",
  },
};

/* ── Component ─────────────────────────────────────────────────── */

export function InteractiveDemo() {
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [phase, setPhase] = useState<"pick" | "training" | "done">("pick");
  const [logLines, setLogLines] = useState<OutputEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logLines]);

  const handleTrain = () => {
    if (!selectedDataset) return;
    setPhase("training");
    setLogLines([]);
    setProgress(0);

    const persona = PERSONA_OUTPUTS[selectedDataset];
    const model = MODELS.find((m) => m.id === selectedModel);
    const logs = [`> soupy train --model ${model?.label} --dataset ${selectedDataset}`, ...persona.logs];

    // Drip-feed logs
    logs.forEach((log, i) => {
      setTimeout(() => {
        setLogLines((prev) => [...prev, { text: log, type: "log" }]);
        setProgress(Math.round(((i + 1) / logs.length) * 90));
      }, i * 700);
    });

    // Show result
    setTimeout(() => {
      setProgress(100);
      setLogLines((prev) => [
        ...prev,
        { text: "✓ Training complete! Testing your model…", type: "log" },
        { text: "", type: "log" },
        { text: `You: Hey, what's up?`, type: "log" },
        { text: `AI: ${persona.greeting}`, type: "result" },
        { text: "", type: "log" },
        { text: `You: Walk me through what you'd do right now.`, type: "log" },
        { text: `AI: ${persona.answer}`, type: "result" },
      ]);
      setPhase("done");
    }, logs.length * 700 + 400);
  };

  const handleReset = () => {
    setPhase("pick");
    setSelectedDataset(null);
    setLogLines([]);
    setProgress(0);
  };

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 relative">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-10"
        >
          <Badge variant="outline" className="text-[10px] mb-4 border-forge-cyan/30 text-forge-cyan font-semibold">
            <Zap className="h-3 w-3 mr-1" /> Try it yourself
          </Badge>
          <h2 className="text-xl sm:text-2xl md:text-4xl font-display font-bold tracking-wide">
            Train a personality in <span className="gradient-text">30 seconds</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-3 max-w-lg mx-auto font-medium">
            Pick a model. Pick your data. Watch it become <em>yours</em>.
          </p>
        </motion.div>

        <div className="ffx-card glass-strong rounded-2xl overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-muted/30">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-forge-rose/60" />
              <div className="w-3 h-3 rounded-full bg-forge-gold/60" />
              <div className="w-3 h-3 rounded-full bg-forge-emerald/60" />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground ml-2">soupy-lab — interactive demo</span>
            <Badge variant="outline" className="text-[8px] ml-auto border-forge-emerald/30 text-forge-emerald">
              Simulated
            </Badge>
          </div>

          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait">
              {phase === "pick" ? (
                <motion.div
                  key="pick"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-5"
                >
                  {/* Model selector */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold font-display tracking-wide">Base Model</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {MODELS.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedModel(m.id)}
                          className={`px-3 py-2 rounded-lg text-[11px] font-bold border transition-all ${
                            selectedModel === m.id
                              ? "bg-primary/15 border-primary/50 text-primary"
                              : "glass border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                          }`}
                        >
                          {m.label}
                          <span className="text-[9px] font-normal ml-1 opacity-60">{m.params}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dataset selector */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="h-4 w-4 text-forge-gold" />
                      <span className="text-xs font-bold font-display tracking-wide">Training Dataset</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DATASETS.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDataset(d.id)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                            selectedDataset === d.id
                              ? "bg-forge-gold/10 border-forge-gold/50"
                              : "glass border-border/50 hover:border-border"
                          }`}
                        >
                          <span className="text-lg">{d.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate">{d.label}</div>
                            <div className="text-[10px] text-muted-foreground">{d.samples.toLocaleString()} samples</div>
                          </div>
                          {selectedDataset === d.id && (
                            <CheckCircle2 className="h-4 w-4 text-forge-gold shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Train button */}
                  <div className="flex justify-center pt-2">
                    <Button
                      size="lg"
                      onClick={handleTrain}
                      disabled={!selectedDataset}
                      className="gradient-primary text-primary-foreground font-bold font-display tracking-wide gap-2 px-8"
                    >
                      <Play className="h-4 w-4" />
                      Train It
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="training"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                        {phase === "training" ? (
                          <><Loader2 className="h-3 w-3 animate-spin text-primary" /> Training…</>
                        ) : (
                          <><Sparkles className="h-3 w-3 text-forge-gold" /> Complete!</>
                        )}
                      </span>
                      <span className="font-mono text-muted-foreground">{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-forge-cyan"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  </div>

                  {/* Terminal output */}
                  <div
                    ref={terminalRef}
                    className="bg-background/80 rounded-lg border border-border/50 p-4 font-mono text-[11px] leading-relaxed h-[280px] sm:h-[320px] overflow-y-auto"
                  >
                    {logLines.map((line, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={
                          line.type === "result"
                            ? "text-forge-gold font-semibold"
                            : line.text.startsWith(">")
                            ? "text-forge-cyan font-semibold"
                            : line.text.startsWith("You:")
                            ? "text-primary"
                            : line.text.startsWith("✓")
                            ? "text-forge-emerald font-semibold"
                            : "text-muted-foreground"
                        }
                      >
                        {line.text || "\u00A0"}
                      </motion.div>
                    ))}
                    {phase === "training" && (
                      <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse" />
                    )}
                  </div>

                  {/* Try again */}
                  {phase === "done" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
                    >
                      <Button variant="outline" onClick={handleReset} className="text-xs font-bold gap-2">
                        ↻ Try another dataset
                      </Button>
                      <Button asChild className="gradient-primary text-primary-foreground text-xs font-bold gap-2">
                        <a href="/signup">
                          <Sparkles className="h-3.5 w-3.5" />
                          Build yours for real — free
                        </a>
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-3 font-mono">
          Simulated demo · Real training runs on your hardware via Soupy Lab
        </p>
      </div>
    </section>
  );
}