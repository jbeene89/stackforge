import { motion } from "framer-motion";
import { Coins, Crown, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useCredits } from "@/hooks/useCredits";

interface CreditPaywallProps {
  featureName?: string;
  creditCost?: number;
}

export function CreditPaywall({ featureName = "This feature", creditCost }: CreditPaywallProps) {
  const navigate = useNavigate();
  const { data: credits } = useCredits();

  const balance = credits?.credits_balance ?? 0;
  const tier = credits?.tier ?? "free";

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-10 max-w-md text-center space-y-6"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mx-auto">
          <Coins className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold">Out of Credits</h2>
          <p className="text-sm text-muted-foreground">
            {featureName} requires{" "}
            {creditCost && (
              <Badge variant="secondary" className="mx-1 gap-1">
                <Zap className="h-3 w-3" />
                {creditCost} credits
              </Badge>
            )}
            {!creditCost && "credits "}
            but you only have{" "}
            <span className="font-bold text-foreground">{balance}</span> remaining.
          </p>
          <p className="text-xs text-muted-foreground">
            You're on the <span className="font-medium text-foreground capitalize">{tier}</span> plan.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full gradient-primary text-primary-foreground"
            onClick={() => navigate("/pricing")}
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Plan <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
