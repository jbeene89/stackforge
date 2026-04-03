import { motion } from "framer-motion";
import { Lock, Crown, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { CreditTopUpPacks } from "@/components/CreditTopUpPacks";

interface UpgradePromptProps {
  featureName: string;
  requiredTier: string;
  currentTier: string;
}

export function UpgradePrompt({ featureName, requiredTier, currentTier }: UpgradePromptProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-10 max-w-lg text-center space-y-6"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
          <Lock className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold">{featureName} is locked</h2>
          <p className="text-sm text-muted-foreground">
            This feature requires the{" "}
            <Badge variant="secondary" className="mx-1 gap-1">
              {requiredTier === "Pro" ? <Sparkles className="h-3 w-3" /> : <Crown className="h-3 w-3" />}
              {requiredTier}
            </Badge>{" "}
            plan or higher.
          </p>
          <p className="text-xs text-muted-foreground">
            You're currently on the <span className="font-medium text-foreground capitalize">{currentTier}</span> plan.
          </p>
        </div>

        <div className="space-y-3 text-left">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
            Or grab credits instantly — no subscription needed
          </p>
          <CreditTopUpPacks />
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/pricing")}
          >
            Compare all plans <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
