import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/TierBadge";
import { useCredits } from "@/hooks/useCredits";
import { CheckCircle2, ArrowRight, Sparkles, Coins } from "lucide-react";

const confettiColors = [
  "hsl(var(--primary))",
  "hsl(var(--forge-amber))",
  "hsl(var(--forge-emerald))",
  "#a855f7",
  "#ec4899",
];

function ConfettiPiece({ index }: { index: number }) {
  const color = confettiColors[index % confettiColors.length];
  const left = Math.random() * 100;
  const delay = Math.random() * 0.6;
  const size = 6 + Math.random() * 6;

  return (
    <motion.div
      className="absolute rounded-sm"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        left: `${left}%`,
        top: -10,
      }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{
        y: [0, 600 + Math.random() * 200],
        opacity: [1, 1, 0],
        rotate: [0, 360 + Math.random() * 360],
        x: [0, (Math.random() - 0.5) * 120],
      }}
      transition={{
        duration: 2 + Math.random(),
        delay,
        ease: "easeOut",
      }}
    />
  );
}

export default function SubscriptionSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: credits, refetch } = useCredits();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Fire Google Ads purchase conversion
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'conversion', {
        send_to: 'AW-17413895911/8119CPinsJUcEOfty-9A',
      });
    }
    // GTM custom event
    (window as any).dataLayer?.push({ event: 'subscription_purchase' });
    // Refetch credits after a short delay to allow webhook processing
    const timer = setTimeout(() => refetch(), 2000);
    const timer2 = setTimeout(() => refetch(), 5000);
    const confettiTimer = setTimeout(() => setShowConfetti(false), 4000);
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(confettiTimer);
    };
  }, [refetch]);

  const tier = credits?.tier || "free";
  const balance = credits?.credits_balance || 0;
  const allowance = credits?.monthly_allowance || 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden relative">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <ConfettiPiece key={i} index={i} />
          ))}
        </div>
      )}

      <motion.div
        className="max-w-lg w-full text-center space-y-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Success icon */}
        <motion.div
          className="mx-auto w-20 h-20 rounded-full bg-forge-emerald/15 border-2 border-forge-emerald/30 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <CheckCircle2 className="h-10 w-10 text-forge-emerald" />
        </motion.div>

        {/* Heading */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to the team! 🎉
          </h1>
          <p className="text-muted-foreground text-lg">
            Your subscription is now active.
          </p>
        </motion.div>

        {/* Tier card */}
        <motion.div
          className="bg-card border border-border rounded-2xl p-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-muted-foreground text-sm">Your plan:</span>
            <TierBadge tier={tier} size="lg" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-muted/50 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
                <Coins className="h-3.5 w-3.5" />
                Credits Balance
              </div>
              <p className="text-2xl font-bold text-foreground">{balance}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                Monthly Allowance
              </div>
              <p className="text-2xl font-bold text-foreground">{allowance}</p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button size="lg" onClick={() => navigate("/dashboard")} className="gap-2">
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/pricing")}>
            View Plan Details
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
