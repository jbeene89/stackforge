import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, ArrowRight, RotateCcw, Zap, Image as ImageIcon, MessageSquare, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── Goal → demo config mapping
const DEMO_CONFIGS: Record<string, {
  label: string;
  icon: React.ElementType;
  accent: string;
  prompt: string;
  type: "image" | "chat" | "train";
  creditCost: number;
}> = {
  module: {
    label: "Quick AI Training Demo",
    icon: Brain,
    accent: "#FF6B35",
    prompt: "Build a customer support assistant that responds with empathy and actionable solutions",
    type: "train",
    creditCost: 2,
  },
  stack: {
    label: "Quick AI Training Demo",
    icon: Brain,
    accent: "#B44FFF",
    prompt: "Create a multi-step research pipeline that summarizes, analyzes, and reports findings",
    type: "train",
    creditCost: 2,
  },
  web: {
    label: "AI Image Generation",
    icon: ImageIcon,
    accent: "#B44FFF",
    prompt: "A futuristic dashboard interface floating in space, glowing cyan and chartreuse accents, dark background, ultra detailed digital art",
    type: "image",
    creditCost: 2,
  },
  android: {
    label: "AI Image Generation",
    icon: ImageIcon,
    accent: "#B44FFF",
    prompt: "A sleek mobile app interface hovering above a hand, holographic UI elements, neon purple and green glow, cinematic lighting",
    type: "image",
    creditCost: 2,
  },
  tool: {
    label: "Chat with AI",
    icon: MessageSquare,
    accent: "#00E5FF",
    prompt: "What are the top 3 ways AI can automate repetitive business processes? Give me specific examples with estimated time savings.",
    type: "chat",
    creditCost: 1,
  },
  research: {
    label: "Chat with AI",
    icon: MessageSquare,
    accent: "#00E5FF",
    prompt: "Summarize the current state of small language models (SLMs) in 2026. What makes them different from large language models, and why are they gaining traction?",
    type: "chat",
    creditCost: 1,
  },
};

const DEFAULT_CONFIG = DEMO_CONFIGS.web;

// ── Credit Spend Indicator
function CreditSpendBadge({ spent, total }: { spent: number; total: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2"
    >
      <motion.div
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Zap className="h-3.5 w-3.5 text-primary" />
      </motion.div>
      <span className="text-xs font-medium text-foreground">
        Used <span className="text-primary font-bold">{spent}</span> of{" "}
        <span className="font-bold">{total}</span> free credits
      </span>
    </motion.div>
  );
}

// ── Phase states
type Phase = "running" | "result" | "celebrate";

export default function FirstWinPage() {
  const [searchParams] = useSearchParams();
  const goal = searchParams.get("goal") || "web";
  const config = DEMO_CONFIGS[goal] || DEFAULT_CONFIG;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: credits } = useCredits();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>("running");
  const [result, setResult] = useState<string>("");
  const [progress, setProgress] = useState(0);

  const totalCredits = 50;
  const Icon = config.icon;

  // Run the demo action automatically
  const runDemo = useCallback(async () => {
    if (!user) return;

    // Animate progress
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + Math.random() * 15;
      });
    }, 300);

    try {
      if (config.type === "image") {
        const { data, error } = await supabase.functions.invoke("ai-generate", {
          body: {
            prompt: config.prompt,
            model: "google/gemini-2.5-flash-image",
            modalities: ["image", "text"],
          },
        });
        if (error) throw error;
        const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url
          || data?.imageUrl || data?.image_url || "";
        setResult(imageUrl || "demo-complete");
      } else if (config.type === "chat") {
        const { data, error } = await supabase.functions.invoke("ai-generate", {
          body: {
            prompt: config.prompt,
            model: "google/gemini-2.5-flash",
          },
        });
        if (error) throw error;
        setResult(data?.choices?.[0]?.message?.content || data?.text || "AI response generated successfully!");
      } else {
        // Training demo — simulate since actual training is async
        await new Promise((r) => setTimeout(r, 2500));
        setResult("training-demo-complete");
      }
    } catch (err: any) {
      console.error("First-win demo error:", err);
      // Still show a result even on error to not block the flow
      setResult("demo-fallback");
    } finally {
      clearInterval(interval);
      setProgress(100);
      // Refetch credits
      queryClient.invalidateQueries({ queryKey: ["user-credits"] });
      setTimeout(() => setPhase("result"), 600);
      setTimeout(() => setPhase("celebrate"), 1800);
    }
  }, [user, config, queryClient]);

  useEffect(() => {
    // Mark that user has completed first win
    localStorage.setItem("first_win_completed", "true");
    localStorage.setItem("first_win_goal", goal);
    runDemo();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeepExploring = () => {
    navigate("/dashboard", { replace: true });
  };

  const handleTryAnother = () => {
    // Cycle to a different demo type
    const types = Object.keys(DEMO_CONFIGS).filter((k) => k !== goal);
    const next = types[Math.floor(Math.random() * types.length)];
    navigate(`/first-win?goal=${next}`, { replace: true });
    setPhase("running");
    setResult("");
    setProgress(0);
    // Need to re-trigger
    setTimeout(() => runDemo(), 100);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Chakra+Petch:wght@300;400;600&display=swap');
        .fw-heading { font-family: 'Orbitron', monospace; }
        .fw-body { font-family: 'Chakra Petch', sans-serif; }
      `}</style>

      <AnimatePresence mode="wait">
        {/* ── RUNNING PHASE ── */}
        {phase === "running" && (
          <motion.div
            key="running"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center max-w-lg w-full space-y-8"
          >
            {/* Pulsing icon */}
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: `${config.accent}18` }}
            >
              <Icon className="h-10 w-10" style={{ color: config.accent }} />
            </motion.div>

            <div>
              <h1 className="fw-heading text-xl font-bold tracking-wide text-foreground mb-2">
                {config.label}
              </h1>
              <p className="fw-body text-sm text-muted-foreground font-light">
                Running your first AI action — sit back, this takes a few seconds…
              </p>
            </div>

            {/* Progress bar */}
            <div className="max-w-xs mx-auto space-y-3">
              <div className="h-1 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: config.accent }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="fw-body text-xs text-muted-foreground">
                {progress < 30 ? "Initializing…" : progress < 70 ? "Generating…" : progress < 100 ? "Almost there…" : "Done!"}
              </p>
            </div>

            {/* Prompt preview */}
            <div
              className="mx-auto max-w-sm rounded-lg border border-border bg-card p-4 text-left"
            >
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 fw-body">
                Prompt
              </p>
              <p className="text-sm text-foreground/80 fw-body font-light leading-relaxed line-clamp-3">
                "{config.prompt}"
              </p>
            </div>
          </motion.div>
        )}

        {/* ── RESULT PHASE ── */}
        {(phase === "result" || phase === "celebrate") && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-lg w-full space-y-6"
          >
            {/* Celebration glow — subtle ring pulse, not confetti */}
            {phase === "celebrate" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.5, 2] }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0 mx-auto my-auto w-40 h-40 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${config.accent}30 0%, transparent 70%)`,
                }}
              />
            )}

            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
              className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: `${config.accent}18` }}
            >
              <Sparkles className="h-8 w-8" style={{ color: config.accent }} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="fw-heading text-xl font-bold tracking-wide text-foreground mb-2">
                Your first AI result!
              </h1>
              <p className="fw-body text-sm text-muted-foreground font-light">
                That's how fast it works. You just used Soupy to create something real.
              </p>
            </motion.div>

            {/* Result display */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              {config.type === "image" && result && result !== "demo-complete" && result !== "demo-fallback" ? (
                <img
                  src={result}
                  alt="AI Generated"
                  className="w-full max-h-64 object-cover"
                />
              ) : config.type === "chat" && result && result !== "demo-fallback" ? (
                <div className="p-4 text-left max-h-48 overflow-y-auto">
                  <p className="text-sm text-foreground/90 fw-body font-light leading-relaxed whitespace-pre-wrap">
                    {result.slice(0, 500)}{result.length > 500 ? "…" : ""}
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Brain className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <p className="text-sm text-foreground fw-body">
                    Training pipeline initialized! Your model is ready to learn from your data.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Credit spend badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center"
            >
              <CreditSpendBadge
                spent={config.creditCost}
                total={totalCredits}
              />
            </motion.div>

            {/* Action buttons */}
            {phase === "celebrate" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-3 pt-2"
              >
                <Button
                  variant="outline"
                  onClick={handleTryAnother}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Try Another
                </Button>
                <Button
                  onClick={handleKeepExploring}
                  className="gradient-primary text-primary-foreground gap-2"
                >
                  Keep Exploring
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}