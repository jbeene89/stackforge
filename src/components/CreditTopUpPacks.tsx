import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Loader2, Sparkles, Zap, Image, MessageSquare, Bot, Layers, Rocket, Package, ShieldCheck, Wifi, WifiOff, Brain, Fingerprint, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// What you can do with credits — used for the visual breakdown
const ACTIONS = [
  { icon: MessageSquare, label: "AI text generations", cost: 2 },
  { icon: Image, label: "Image generations", cost: 3 },
  { icon: Bot, label: "Module test runs", cost: 2 },
  { icon: Layers, label: "Perspective analyses", cost: 5 },
  { icon: Rocket, label: "Full Council runs", cost: 45 },
];

function getBreakdown(credits: number) {
  return ACTIONS.map((a) => ({
    ...a,
    count: Math.floor(credits / a.cost),
  }));
}

const PACKS = [
  { credits: 100, price: 4.99, priceId: "price_1TD61PEgO8H7yovM947iyWTY", label: "Starter", perCredit: "5¢", tagline: "Quick experiment" },
  { credits: 500, price: 19.99, priceId: "price_1TD62JEgO8H7yovM5HSx5vl2", label: "Popular", perCredit: "4¢", highlight: true, tagline: "Ship a feature" },
  { credits: 1500, price: 59.99, priceId: "price_1TD62fEgO8H7yovMu0AHTCpt", label: "Best Value", perCredit: "4¢", tagline: "Build a product" },
  {
    credits: 3000, price: 99.99, priceId: "price_1TIGZ7EgO8H7yovMg2v4QyAq",
    label: "Full Pipeline", perCredit: "3.3¢", tagline: "Train → Build → Ship",
    isPipeline: true,
  },
];

// Pipeline breakdown: what 3,000 credits covers for CDPT
const PIPELINE_STEPS = [
  { step: "1", label: "Train your SLM", detail: "~100 CDPT samples (27cr each)", credits: 2700, color: "hsl(var(--primary))" },
  { step: "2", label: "Test & evaluate", detail: "~10 Council runs + inference", credits: 150, color: "hsl(var(--accent))" },
  { step: "3", label: "Deploy to device", detail: "Export, convert & ship", credits: 50, color: "hsl(var(--primary))" },
  { step: "—", label: "Buffer credits", detail: "Extra runs, tweaks, iterations", credits: 100, color: "hsl(var(--muted-foreground))" },
];

const WHY_OWN_AI = [
  {
    icon: Fingerprint,
    title: "It thinks like you",
    desc: "CDPT training encodes your reasoning style, domain knowledge, and decision patterns — not generic internet averages.",
  },
  {
    icon: WifiOff,
    title: "Runs offline forever",
    desc: "Once trained, your SLM runs on your hardware with zero API calls, zero internet, zero monthly bills.",
  },
  {
    icon: Lock,
    title: "Your data stays yours",
    desc: "Nothing leaves your machine. No training OpenAI's next model with your proprietary knowledge.",
  },
  {
    icon: Brain,
    title: "Surgical precision",
    desc: "Selective Unlearning, Popcorn Injection, Perspective Training — reshape behavior in ways prompting never can.",
  },
];

interface CreditTopUpPacksProps {
  compact?: boolean;
  className?: string;
}

export function CreditTopUpPacks({ compact = false, className = "" }: CreditTopUpPacksProps) {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [expandedPack, setExpandedPack] = useState<string | null>(null);

  const handleBuy = async (e: React.MouseEvent, priceId: string) => {
    e.stopPropagation();
    setLoadingPack(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-credits", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Failed to start checkout", { description: err.message });
    } finally {
      setLoadingPack(null);
    }
  };

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {PACKS.filter((p) => !p.isPipeline).map((pack) => (
          <Button
            key={pack.priceId}
            size="sm"
            variant={pack.highlight ? "default" : "outline"}
            className={`h-8 gap-1.5 text-xs ${pack.highlight ? "gradient-primary text-primary-foreground" : ""}`}
            disabled={!!loadingPack}
            onClick={(e) => handleBuy(e, pack.priceId)}
          >
            {loadingPack === pack.priceId ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Coins className="h-3 w-3" />
            )}
            {pack.credits} for ${pack.price}
          </Button>
        ))}
      </div>
    );
  }

  const standardPacks = PACKS.filter((p) => !p.isPipeline);
  const pipelinePack = PACKS.find((p) => p.isPipeline)!;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Standard packs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {standardPacks.map((pack, i) => {
          const isExpanded = expandedPack === pack.priceId;
          const breakdown = getBreakdown(pack.credits);

          return (
            <motion.div
              key={pack.priceId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setExpandedPack(isExpanded ? null : pack.priceId)}
              className={`relative rounded-xl border p-4 text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                pack.highlight
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.25)] animate-[packGlow_3s_ease-in-out_infinite]"
                  : "border-border bg-card hover:border-primary/20"
              } ${loadingPack ? "opacity-60 pointer-events-none" : ""}`}
            >
              {pack.highlight && (
                <Badge className="absolute -top-2.5 right-3 gap-1 text-[10px] gradient-primary text-primary-foreground border-0">
                  <Sparkles className="h-3 w-3" /> {pack.label}
                </Badge>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-bold text-lg text-foreground">{pack.credits}</span>
                  <span className="text-xs text-muted-foreground">credits</span>
                </div>

                <p className="text-[11px] text-muted-foreground italic">{pack.tagline}</p>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">${pack.price}</span>
                  <span className="text-xs text-muted-foreground">({pack.perCredit}/cr)</span>
                </div>

                {/* Usage breakdown bar chart */}
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">What you get</p>
                  {breakdown.map((item) => {
                    const maxCount = Math.floor(3000 / item.cost);
                    const pct = Math.min((item.count / maxCount) * 100, 100);
                    return (
                      <div key={item.label} className="flex items-center gap-2">
                        <item.icon className="h-3 w-3 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-primary/60"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.2 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-foreground tabular-nums w-6 text-right">{item.count}</span>
                      </div>
                    );
                  })}
                  <motion.div
                    initial={false}
                    animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1.5 space-y-0.5">
                      {breakdown.map((item) => (
                        <div key={item.label} className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <item.icon className="h-2.5 w-2.5" />
                            {item.label}
                          </span>
                          <span className="text-foreground font-medium">~{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                  {!isExpanded && (
                    <p className="text-[9px] text-muted-foreground/60 text-center">tap for details</p>
                  )}
                </div>

                <Button
                  size="sm"
                  className={`w-full h-8 text-xs mt-1 ${pack.highlight ? "gradient-primary text-primary-foreground" : ""}`}
                  variant={pack.highlight ? "default" : "outline"}
                  disabled={!!loadingPack}
                  onClick={(e) => handleBuy(e, pack.priceId)}
                >
                  {loadingPack === pack.priceId ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>Buy {pack.credits} credits</>
                  )}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full Pipeline pack — spans full width */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={`relative rounded-xl border-2 border-accent/40 bg-accent/5 p-5 animate-[packGlow_3s_ease-in-out_infinite] ${
          loadingPack ? "opacity-60 pointer-events-none" : ""
        }`}
        style={{ "--tw-shadow-color": "hsl(var(--accent) / 0.25)" } as React.CSSProperties}
      >
        <Badge className="absolute -top-2.5 left-4 gap-1 text-[10px] bg-accent text-accent-foreground border-0">
          <Package className="h-3 w-3" /> Complete Pipeline
        </Badge>

        <div className="flex flex-col sm:flex-row gap-5">
          {/* Left: pricing */}
          <div className="sm:w-1/3 space-y-2">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-accent" />
              <span className="font-bold text-xl text-foreground">{pipelinePack.credits}</span>
              <span className="text-xs text-muted-foreground">credits</span>
            </div>
            <p className="text-sm font-medium text-foreground">{pipelinePack.tagline}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">${pipelinePack.price}</span>
              <span className="text-xs text-muted-foreground">({pipelinePack.perCredit}/cr)</span>
            </div>
            <Button
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={!!loadingPack}
              onClick={(e) => handleBuy(e, pipelinePack.priceId)}
            >
              {loadingPack === pipelinePack.priceId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>Buy Full Pipeline</>
              )}
            </Button>
          </div>

          {/* Right: pipeline step diagram */}
          <div className="sm:w-2/3 space-y-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pipeline breakdown</p>
            <div className="space-y-2">
              {PIPELINE_STEPS.map((step, idx) => {
                const pct = (step.credits / 3000) * 100;
                return (
                  <div key={step.label} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                          {step.step}
                        </span>
                        <span className="font-medium text-foreground">{step.label}</span>
                      </span>
                      <span className="text-muted-foreground tabular-nums">{step.credits} cr</span>
                    </div>
                    <div className="flex items-center gap-2 pl-7">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: step.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.4 + idx * 0.1, duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{step.detail}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground/70 italic pt-1">
              * Based on ~100 CDPT training samples (~27 credits each), which produce ~500 cognitive function questions for your SLM.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Why this vs ChatGPT */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-4"
      >
        <p className="text-xs font-semibold text-foreground text-center">
          Why build your own AI instead of using ChatGPT?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WHY_OWN_AI.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              className="flex gap-3 items-start"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground leading-tight">{item.title}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-border/40">
          <div className="flex-1 space-y-0.5">
            <p className="text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">ChatGPT</span> — $20/mo forever, they own the model, your data trains their AI, goes offline = you're stuck
            </p>
            <p className="text-[10px] text-muted-foreground">
              <span className="font-semibold text-primary">StackForge</span> — one-time credit purchase, you own the model, runs offline on your hardware, no recurring fees
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
