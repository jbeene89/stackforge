import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Zap } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { CreditTopUpPacks } from "@/components/CreditTopUpPacks";

const LOW_CREDITS_THRESHOLD = 10;

export function LowCreditsNudge() {
  const { data: credits } = useCredits();
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

        <div className="flex flex-col gap-3 pr-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              {isZero ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <Zap className="h-5 w-5 text-destructive" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {isZero
                  ? "You're out of credits"
                  : `Only ${credits.credits_balance} credits remaining`}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isZero
                  ? "Top up instantly to keep building — no subscription needed."
                  : "Running low? Grab a credit pack and keep going."}
              </p>
            </div>
          </div>

          <CreditTopUpPacks compact />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
