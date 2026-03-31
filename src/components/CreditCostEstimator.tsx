import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Calculator, Brain, Zap, Shield, Lightbulb, Heart,
  Wrench, Layers, HelpCircle, Coins, DollarSign,
} from "lucide-react";

const COST_PER_AI_CALL = 2; // credits
const CDPT_CALLS_PER_SAMPLE = 14; // 5 perspectives + cross-challenge + synthesis + gap-fill + anti-pattern etc.
const POPCORN_CALLS_PER_SAMPLE = 6;
const ADVANCED_MODE_CALLS = 4; // per sample, average across modes

const SALE_END = new Date("2026-04-06T23:59:59").getTime();
const isSaleActive = () => Date.now() < SALE_END;

const CREDIT_PACKS = [
  { credits: 100, price: 4.99 },
  { credits: 500, price: 19.99 },
  { credits: 1500, price: 59.99 },
];

const TIERS = [
  { label: "Free", monthly: 50 },
  { label: "Builder", monthly: 500 },
  { label: "Pro", monthly: 2000 },
];

interface EstimateBreakdown {
  cdptCredits: number;
  popcornCredits: number;
  advancedCredits: number;
  totalCredits: number;
  dollarsNeeded: number;
  bestPack: string;
  monthsOnTier: Record<string, number>;
}

export function CreditCostEstimator() {
  const [sampleCount, setSampleCount] = useState(50);
  const [useCDPT, setUseCDPT] = useState(true);
  const [usePopcorn, setUsePopcorn] = useState(true);
  const [advancedModes, setAdvancedModes] = useState(0); // 0-4 modes enabled

  const estimate = useMemo((): EstimateBreakdown => {
    const cdptCredits = useCDPT ? sampleCount * CDPT_CALLS_PER_SAMPLE * COST_PER_AI_CALL : 0;
    const popcornCredits = usePopcorn ? sampleCount * POPCORN_CALLS_PER_SAMPLE * COST_PER_AI_CALL : 0;
    const advancedCredits = advancedModes * sampleCount * ADVANCED_MODE_CALLS * COST_PER_AI_CALL;
    const totalCredits = cdptCredits + popcornCredits + advancedCredits;

    // Find cheapest pack combination
    let dollarsNeeded = 0;
    let remaining = totalCredits;
    const packsSorted = [...CREDIT_PACKS].sort((a, b) => (a.price / a.credits) - (b.price / b.credits));
    
    while (remaining > 0) {
      const best = packsSorted.find(p => p.credits <= remaining) || packsSorted[packsSorted.length - 1];
      const qty = Math.ceil(remaining / best.credits);
      dollarsNeeded += qty * best.price;
      remaining -= qty * best.credits;
    }

    // Recalculate with a cleaner greedy approach
    const saleMultiplier = isSaleActive() ? 0.5 : 1;
    dollarsNeeded = 0;
    remaining = totalCredits;
    while (remaining > 0) {
      if (remaining >= 1500) {
        const packs = Math.floor(remaining / 1500);
        dollarsNeeded += packs * 59.99 * saleMultiplier;
        remaining -= packs * 1500;
      } else if (remaining >= 500) {
        dollarsNeeded += 19.99 * saleMultiplier;
        remaining -= 500;
      } else {
        dollarsNeeded += 4.99 * saleMultiplier;
        remaining -= 100;
      }
    }

    const bestPack = totalCredits >= 1000 ? `$${(59.99 * saleMultiplier).toFixed(2)} / 1500cr` : totalCredits >= 200 ? `$${(19.99 * saleMultiplier).toFixed(2)} / 500cr` : `$${(4.99 * saleMultiplier).toFixed(2)} / 100cr`;

    const monthsOnTier: Record<string, number> = {};
    for (const tier of TIERS) {
      monthsOnTier[tier.label] = tier.monthly > 0 ? Math.ceil(totalCredits / tier.monthly) : Infinity;
    }

    return { cdptCredits, popcornCredits, advancedCredits, totalCredits, dollarsNeeded, bestPack, monthsOnTier };
  }, [sampleCount, useCDPT, usePopcorn, advancedModes]);

  return (
    <Card className="border-border/60 bg-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calculator className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Credit Cost Estimator</CardTitle>
            <p className="text-[10px] text-muted-foreground">Estimate before you train</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Sample count slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Training Samples</Label>
            <Badge variant="outline" className="text-xs font-mono tabular-nums">
              {sampleCount}
            </Badge>
          </div>
          <Slider
            value={[sampleCount]}
            onValueChange={([v]) => setSampleCount(v)}
            min={10}
            max={500}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>10</span>
            <span>250</span>
            <span>500</span>
          </div>
        </div>

        {/* Pipeline toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <Brain className="h-3.5 w-3.5 text-primary" />
                    <Label className="text-xs cursor-help">CDPT Pipeline</Label>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-xs">
                  <p>Five-perspective enrichment: Builder, Red Team, Systems, Empath, Frame Breaker + synthesis. ~14 AI calls per sample.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Switch checked={useCDPT} onCheckedChange={setUseCDPT} />
          </div>
          <div className="flex items-center justify-between">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <Zap className="h-3.5 w-3.5 text-[hsl(var(--forge-amber))]" />
                    <Label className="text-xs cursor-help">Popcorn Injection</Label>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-xs">
                  <p>Kernel activation to densify traits using the model's own latent knowledge. ~6 AI calls per sample.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Switch checked={usePopcorn} onCheckedChange={setUsePopcorn} />
          </div>
          <div className="space-y-1.5">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <Lightbulb className="h-3.5 w-3.5 text-[hsl(var(--forge-gold))]" />
                    <Label className="text-xs cursor-help">Advanced Modes</Label>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-xs">
                  <p>Socratic Adversary, Dream Synthesis, Contradiction Mining, etc. Each adds ~4 AI calls per sample.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => setAdvancedModes(n)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                    advancedModes === n
                      ? "bg-[hsl(var(--forge-gold))]/20 text-[hsl(var(--forge-gold))] border border-[hsl(var(--forge-gold))]/40"
                      : "bg-muted/40 text-muted-foreground border border-transparent hover:bg-muted"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Results */}
        <motion.div
          key={estimate.totalCredits}
          initial={{ opacity: 0.7, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {/* Breakdown */}
          <div className="space-y-1.5">
            {useCDPT && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Brain className="h-3 w-3" /> CDPT
                </span>
                <span className="font-mono tabular-nums">{estimate.cdptCredits.toLocaleString()} cr</span>
              </div>
            )}
            {usePopcorn && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Zap className="h-3 w-3" /> Popcorn
                </span>
                <span className="font-mono tabular-nums">{estimate.popcornCredits.toLocaleString()} cr</span>
              </div>
            )}
            {advancedModes > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Lightbulb className="h-3 w-3" /> {advancedModes} Advanced Mode{advancedModes > 1 ? "s" : ""}
                </span>
                <span className="font-mono tabular-nums">{estimate.advancedCredits.toLocaleString()} cr</span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">Total Estimated</span>
              </div>
              <span className="text-lg font-bold font-mono tabular-nums text-primary">
                {estimate.totalCredits.toLocaleString()} cr
              </span>
            </div>
            {estimate.totalCredits > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">
                  ~${estimate.dollarsNeeded.toFixed(2)} via top-up packs
                </span>
              </div>
            )}
          </div>

          {/* Tier timeline */}
          {estimate.totalCredits > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Or use monthly allowance
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TIERS.map(tier => {
                  const months = estimate.monthsOnTier[tier.label];
                  return (
                    <div
                      key={tier.label}
                      className="rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2 text-center"
                    >
                      <p className="text-[10px] text-muted-foreground font-medium">{tier.label}</p>
                      <p className="text-sm font-bold font-mono tabular-nums">
                        {months <= 12 ? `${months} mo` : "12+ mo"}
                      </p>
                      <p className="text-[9px] text-muted-foreground">{tier.monthly} cr/mo</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {estimate.totalCredits === 0 && (
            <p className="text-xs text-muted-foreground text-center italic">
              Enable at least one pipeline to see estimates
            </p>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
