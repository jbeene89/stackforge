import { motion } from "framer-motion";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred backdrop that lets the page content show through */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl shadow-primary/10"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
          <Lock className="h-7 w-7 text-primary" />
        </div>

        <div className="text-center space-y-2 mb-6">
          <h2 className="text-lg font-bold text-foreground">
            {featureName} needs credits
          </h2>
          <p className="text-sm text-muted-foreground">
            You're on the <span className="font-medium text-foreground capitalize">{currentTier}</span> plan.
            Grab a credit pack to unlock this instantly.
          </p>
        </div>

        <CreditTopUpPacks className="mb-6" />

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Go back
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate("/pricing")}
          >
            Compare plans
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
