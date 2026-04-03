import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Loader2, Sparkles, Zap, Image, MessageSquare, Bot, Layers, Rocket } from "lucide-react";
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
        {PACKS.map((pack) => (
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

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
      {PACKS.map((pack, i) => {
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

              {/* Usage breakdown — always visible as a compact bar chart */}
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">What you get</p>
                {breakdown.map((item) => {
                  const maxCount = Math.floor(1500 / item.cost); // normalize to largest pack
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
                {/* Legend on expand */}
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
  );
}
