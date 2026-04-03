import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Loader2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PACKS = [
  { credits: 100, price: 4.99, priceId: "price_1TD61PEgO8H7yovM947iyWTY", label: "Starter", perCredit: "5¢" },
  { credits: 500, price: 19.99, priceId: "price_1TD62JEgO8H7yovM5HSx5vl2", label: "Popular", perCredit: "4¢", highlight: true },
  { credits: 1500, price: 59.99, priceId: "price_1TD62fEgO8H7yovMu0AHTCpt", label: "Best Value", perCredit: "4¢" },
];

interface CreditTopUpPacksProps {
  compact?: boolean;
  className?: string;
}

export function CreditTopUpPacks({ compact = false, className = "" }: CreditTopUpPacksProps) {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  const handleBuy = async (priceId: string) => {
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
            onClick={() => handleBuy(pack.priceId)}
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
      {PACKS.map((pack, i) => (
        <motion.button
          key={pack.priceId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => handleBuy(pack.priceId)}
          disabled={!!loadingPack}
          className={`relative rounded-xl border p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
            pack.highlight
              ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/10"
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

            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">${pack.price}</span>
              <span className="text-xs text-muted-foreground">({pack.perCredit}/cr)</span>
            </div>

            {loadingPack === pack.priceId ? (
              <div className="flex items-center justify-center h-8">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : (
              <div className="text-xs font-medium text-primary">Buy now →</div>
            )}
          </div>
        </motion.button>
      ))}
    </div>
  );
}
