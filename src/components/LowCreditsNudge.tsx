import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ArrowRight, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCredits } from "@/hooks/useCredits";

const LOW_CREDITS_THRESHOLD = 10;

export function LowCreditsNudge() {
  const { data: credits } = useCredits();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (
    dismissed ||
    !credits ||
    credits.credits_balance >= LOW_CREDITS_THRESHOLD ||
    credits.tier !== "free"
  ) {
    return null;
  }

  const isZero = credits.credits_balance <= 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative rounded-xl border border-destructive/30 bg-destructive/5 p-4 backdrop-blur-sm"
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            {isZero ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Zap className="h-5 w-5 text-destructive" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <p className="text-sm font-semibold text-foreground">
              {isZero
                ? "You're out of credits"
                : `Only ${credits.credits_balance} credits remaining`}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isZero
                ? "Upgrade to Builder or Pro to keep building without interruption."
                : "Running low? Upgrade your plan for more monthly credits and unlock premium features."}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                className="h-7 gap-1.5 text-xs gradient-primary text-primary-foreground"
                onClick={() => navigate("/pricing")}
              >
                View Plans <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
