import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Zap, Brain, Image, MessageSquare, TrendingUp, DollarSign, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const GOALS = [
  {
    id: "train",
    label: "Train a Custom AI",
    icon: Brain,
    accent: "#FF6B35",
    steps: [
      { label: "CDPT Training", detail: "100 samples × 27cr", credits: 2700 },
      { label: "Test & Evaluate", detail: "10 Council runs + inference", credits: 150 },
      { label: "Deploy to Device", detail: "Export, convert, ship", credits: 50 },
      { label: "Buffer", detail: "Extra iterations", credits: 100 },
    ],
    totalCredits: 3000,
    packLabel: "Full Pipeline",
    packPrice: 99.99,
    salePrice: 50.00,
    comparison: [
      { label: "OpenAI API", cost: "$20–100/mo", period: "ongoing", annual: "$240–1,200/yr" },
      { label: "Fine-tuning service", cost: "$500–5,000+", period: "per model", annual: "$500–5,000" },
      { label: "ML engineer", cost: "$150k+/yr", period: "salary", annual: "$150,000+" },
    ],
    tagline: "Own your model forever. Zero recurring costs.",
    starterAngle: "Or start with 100 credits ($2.50) to explore training with a pre-built dataset first.",
  },
  {
    id: "content",
    label: "Generate AI Content",
    icon: Image,
    accent: "#B44FFF",
    steps: [
      { label: "Text Generations", detail: "250 AI responses", credits: 500 },
      { label: "Image Generations", detail: "~166 unique images", credits: 500 },
      { label: "Module Runs", detail: "~250 specialist tasks", credits: 500 },
    ],
    totalCredits: 500,
    packLabel: "Popular",
    packPrice: 19.99,
    salePrice: 10.00,
    comparison: [
      { label: "ChatGPT Plus", cost: "$20/mo", period: "ongoing", annual: "$240/yr" },
      { label: "Midjourney", cost: "$10–60/mo", period: "ongoing", annual: "$120–720/yr" },
      { label: "Jasper AI", cost: "$49/mo", period: "ongoing", annual: "$588/yr" },
    ],
    tagline: "500 generations for $10. No subscription lock-in.",
    starterAngle: "Or try 100 credits ($2.50) — enough for 50 text generations or 33 images.",
  },
  {
    id: "research",
    label: "Run Research Analysis",
    icon: MessageSquare,
    accent: "#00E5FF",
    steps: [
      { label: "Perspective Analyses", detail: "30 deep analyses", credits: 150 },
      { label: "AI Chat Sessions", detail: "~150 questions", credits: 300 },
      { label: "Council Deliberations", detail: "~1 full Council run", credits: 50 },
    ],
    totalCredits: 500,
    packLabel: "Popular",
    packPrice: 19.99,
    salePrice: 10.00,
    comparison: [
      { label: "ChatGPT Plus", cost: "$20/mo", period: "ongoing", annual: "$240/yr" },
      { label: "Perplexity Pro", cost: "$20/mo", period: "ongoing", annual: "$240/yr" },
      { label: "Research assistant", cost: "$25–50/hr", period: "hourly", annual: "$50k+/yr" },
    ],
    tagline: "Deep multi-perspective research for a one-time $10.",
    starterAngle: "Or start with 100 credits ($2.50) — enough for 50 AI questions to test the waters.",
  },
];

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>();

  useEffect(() => {
    const start = display;
    const diff = value - start;
    const duration = 600;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };

    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return <span className={className}>{display.toLocaleString()}</span>;
}

export function ROICalculator() {
  const [activeGoal, setActiveGoal] = useState("train");
  const goal = GOALS.find((g) => g.id === activeGoal)!;
  const Icon = goal.icon;
  const saleActive = Date.now() < new Date("2026-04-06T23:59:59").getTime();
  const displayPrice = saleActive ? goal.salePrice : goal.packPrice;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        <h2 className="text-base sm:text-lg font-bold">What Could You Build?</h2>
      </div>

      {/* Goal Toggle */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
        {GOALS.map((g) => {
          const GIcon = g.icon;
          return (
            <button
              key={g.id}
              onClick={() => setActiveGoal(g.id)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 rounded-lg px-3 sm:px-4 py-2.5 text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap min-h-[44px]",
                activeGoal === g.id
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "glass border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <GIcon className="h-3.5 w-3.5 shrink-0" />
              {g.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeGoal}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Credit Breakdown Bars */}
          <div className="glass rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <Icon className="h-4 w-4" style={{ color: goal.accent }} />
                Credit Breakdown
              </span>
              <span className="text-xs text-muted-foreground">
                <AnimatedNumber value={goal.totalCredits} className="font-bold text-foreground" /> credits total
              </span>
            </div>

            {goal.steps.map((step, i) => {
              const pct = (step.credits / goal.totalCredits) * 100;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] sm:text-xs">
                    <span className="font-medium text-foreground">{step.label}</span>
                    <span className="text-muted-foreground">{step.detail}</span>
                  </div>
                  <div className="h-2 sm:h-2.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: goal.accent }}
                    />
                  </div>
                  <div className="text-right text-[10px] text-muted-foreground">
                    <AnimatedNumber value={step.credits} /> cr
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Cost Comparison */}
          <div className="glass rounded-xl p-4 sm:p-5 space-y-3">
            <span className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-forge-emerald" />
              vs. Alternatives
            </span>

            <div className="space-y-2">
              {/* Soupy row — highlight */}
              <div
                className="rounded-lg p-3 flex items-center justify-between"
                style={{ background: `${goal.accent}12`, border: `1px solid ${goal.accent}30` }}
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5" style={{ color: goal.accent }} />
                  <span className="text-xs sm:text-sm font-bold">Soupy</span>
                  {saleActive && (
                    <span className="text-[9px] sm:text-[10px] bg-destructive text-destructive-foreground rounded px-1.5 py-0.5 font-medium">
                      SALE
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1.5">
                    {saleActive && (
                      <span className="text-xs text-muted-foreground/60 line-through">${goal.packPrice}</span>
                    )}
                    <span className="text-sm sm:text-base font-extrabold" style={{ color: goal.accent }}>
                      $<AnimatedNumber value={displayPrice} />
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">one-time</span>
                </div>
              </div>

              {/* Competitor rows */}
              {goal.comparison.map((comp) => (
                <div
                  key={comp.label}
                  className="rounded-lg p-3 flex items-center justify-between bg-background/50 border border-border"
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span className="text-xs sm:text-sm text-muted-foreground">{comp.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-medium text-foreground">{comp.cost}</span>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="h-2.5 w-2.5" />
                      {comp.period}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tagline + Starter angle */}
          <div className="text-center space-y-2 py-2">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm sm:text-base font-bold text-foreground"
            >
              {goal.tagline}
            </motion.p>
            <p className="text-[11px] sm:text-xs text-muted-foreground max-w-md mx-auto">
              {goal.starterAngle}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}