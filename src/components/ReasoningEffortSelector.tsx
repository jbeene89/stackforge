import { Brain, Gauge, Zap, Sparkles, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReasoningEffort, ModelTier } from "@/lib/aiModels";
import { maxEffortForTier } from "@/lib/aiModels";
import { motion } from "framer-motion";

const EFFORTS: { id: ReasoningEffort; label: string; icon: typeof Brain; tone: string }[] = [
  { id: "minimal", label: "Minimal", icon: Zap, tone: "text-muted-foreground" },
  { id: "low", label: "Low", icon: Gauge, tone: "text-forge-cyan" },
  { id: "medium", label: "Medium", icon: Brain, tone: "text-primary" },
  { id: "high", label: "High", icon: Sparkles, tone: "text-forge-gold" },
  { id: "xhigh", label: "Max", icon: Flame, tone: "text-forge-rose" },
];

interface Props {
  value: ReasoningEffort;
  onChange: (v: ReasoningEffort) => void;
  tier?: ModelTier;
  /** Disabled when the selected model isn't a reasoning model. */
  disabled?: boolean;
  className?: string;
}

/**
 * Sci-fi reasoning effort dial.
 * Tiers below the user's plan are visible but locked (clicking shows upgrade hint).
 */
export function ReasoningEffortSelector({
  value,
  onChange,
  tier = "free",
  disabled = false,
  className,
}: Props) {
  const cap = maxEffortForTier(tier);
  const capIdx = EFFORTS.findIndex((e) => e.id === cap);

  return (
    <div
      className={cn(
        "ffx-card glass rounded-lg border border-primary/20 p-2",
        disabled && "opacity-50",
        className
      )}
    >
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <Brain className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-display font-bold tracking-wider uppercase">
            Reasoning Effort
          </span>
        </div>
        <span className="text-[9px] text-muted-foreground font-mono">
          Cap: {cap}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {EFFORTS.map((e, i) => {
          const locked = i > capIdx;
          const active = value === e.id;
          const Icon = e.icon;
          return (
            <button
              key={e.id}
              type="button"
              disabled={disabled || locked}
              onClick={() => onChange(e.id)}
              title={locked ? `Requires higher plan` : `${e.label} effort`}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-md py-1.5 px-1 border transition-all",
                active
                  ? "border-primary bg-primary/15 glow-primary"
                  : "border-transparent hover:border-primary/30 hover:bg-primary/5",
                locked && "opacity-40 cursor-not-allowed"
              )}
            >
              <Icon className={cn("h-3 w-3", active ? "text-primary" : e.tone)} />
              <span className="text-[9px] font-semibold tracking-wide">{e.label}</span>
              {active && (
                <motion.div
                  layoutId="effort-pulse"
                  className="absolute inset-0 rounded-md ring-1 ring-primary/40 pointer-events-none"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
