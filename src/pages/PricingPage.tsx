import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits, useCreditTransactions } from "@/hooks/useCredits";
import { toast } from "sonner";
import {
  Check, X, Zap, CreditCard, ArrowRight, Crown, Sparkles,
  BarChart3, Coins, Loader2, TrendingDown, TrendingUp, Gift, Lock, ShoppingCart, Plus,
} from "lucide-react";

const TIERS = {
  free: { name: "Free", product_id: null, price_id: null, credits: 50 },
  builder: { name: "Builder", product_id: "prod_UD3IB1GkdTytBl", price_id: "price_1TEdBUEgO8H7yovM7UbhKdvP", credits: 500 },
  pro: { name: "Pro", product_id: "prod_UD4fLliAe5KKKE", price_id: "price_1TEeVhEgO8H7yovMxXABYtzr", credits: 2000 },
};

const TOPUP_PACKS = [
  { credits: 100, price: 4.99, priceId: "price_1TD61PEgO8H7yovM947iyWTY", label: "Starter" },
  { credits: 500, price: 19.99, priceId: "price_1TD62JEgO8H7yovM5HSx5vl2", label: "Popular", highlight: true },
  { credits: 1500, price: 59.99, priceId: "price_1TD62fEgO8H7yovMu0AHTCpt", label: "Best Value" },
];

const MODEL_COSTS = [
  { model: "Gemini Flash Lite", credits: 1 },
  { model: "Gemini Flash", credits: 2 },
  { model: "GPT-5 Nano", credits: 2 },
  { model: "GPT-5 Mini", credits: 3 },
  { model: "Gemini Pro", credits: 5 },
  { model: "GPT-5", credits: 8 },
  { model: "GPT-5.2", credits: 10 },
];

const plans = [
  {
    tier: "free" as const,
    monthlyPrice: 0,
    desc: "Explore and experiment. No card needed.",
    credits: 50,
    features: [
      { text: "50 credits/month", included: true },
      { text: "3 projects", included: true },
      { text: "5 AI modules", included: true },
      { text: "Community support", included: true },
      { text: "Export Studio", included: false, locked: true },
      { text: "Robotics Controllers", included: false, locked: true },
      { text: "Edge Training", included: false, locked: true },
    ],
    icon: Zap,
  },
  {
    tier: "builder" as const,
    monthlyPrice: 14.50,
    originalPrice: 29,
    desc: "For builders shipping real products.",
    credits: 500,
    features: [
      { text: "500 credits/month", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Unlimited modules", included: true },
      { text: "Export Studio", included: true },
      { text: "Version history", included: true },
      { text: "Robotics Controllers", included: false, locked: true },
      { text: "Edge Training", included: false, locked: true },
      { text: "Priority support", included: true },
    ],
    icon: Crown,
    badge: "Most Popular",
    highlight: true,
  },
  {
    tier: "pro" as const,
    monthlyPrice: 39.50,
    originalPrice: 79,
    desc: "For teams building at scale.",
    credits: 2000,
    features: [
      { text: "2,000 credits/month", included: true },
      { text: "Everything in Builder", included: true },
      { text: "Robotics Controllers", included: true },
      { text: "Edge Training", included: true },
      { text: "5 team members", included: true },
      { text: "Dedicated support", included: true },
    ],
    icon: Sparkles,
  },
];

const TX_ICONS: Record<string, typeof Coins> = {
  deduction: TrendingDown,
  bonus: Gift,
  topup: TrendingUp,
  reset: Zap,
};

export default function PricingPage() {
  const { user } = useAuth();
  const { data: credits } = useCredits();
  const { data: transactions } = useCreditTransactions(15);
  const [subscriptionData, setSubscriptionData] = useState<{
    subscribed: boolean;
    product_id: string | null;
    subscription_end: string | null;
  }>({ subscribed: false, product_id: null, subscription_end: null });
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [topUpLoading, setTopUpLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data) setSubscriptionData(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) checkSubscription();
    else setLoading(false);
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast.success("Subscription activated! Your credits have been upgraded.");
      checkSubscription();
      window.history.replaceState({}, "", "/pricing");
    }
    if (params.get("topup") === "success") {
      toast.success("Credits purchased! Your balance has been updated.");
      window.history.replaceState({}, "", "/pricing");
    }
  }, []);

  const currentTier = subscriptionData.subscribed
    ? Object.entries(TIERS).find(([, t]) => t.product_id === subscriptionData.product_id)?.[0] || credits?.tier || "free"
    : credits?.tier || "free";

  const handleCheckout = async (tier: string) => {
    const priceId = TIERS[tier as keyof typeof TIERS]?.price_id;
    if (!priceId) return;
    setCheckingOut(tier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setCheckingOut(null);
    }
  };

  const handleTopUp = async (priceId: string) => {
    if (!user) {
      toast.error("Please sign in to purchase credits");
      return;
    }
    setTopUpLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-credits", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setTopUpLoading(null);
    }
  };

  const handleManage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to open portal");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Pricing — Free, Builder & Pro Plans" description="Compare Soupy pricing plans. Start free with 50 credits, upgrade to Builder or Pro for more AI modules, pipeline runs, and advanced features. No credit card required." />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Pricing & Credits</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Every AI run costs credits. Pick a plan, or earn free credits by exploring.</p>

        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="glass w-fit">
            <TabsTrigger value="plans" className="text-xs gap-1.5"><Crown className="h-3 w-3" /> Plans</TabsTrigger>
            <TabsTrigger value="usage" className="text-xs gap-1.5"><BarChart3 className="h-3 w-3" /> Usage & History</TabsTrigger>
            <TabsTrigger value="topup" className="text-xs gap-1.5"><Plus className="h-3 w-3" /> Top Up</TabsTrigger>
            <TabsTrigger value="costs" className="text-xs gap-1.5"><Coins className="h-3 w-3" /> Credit Costs</TabsTrigger>
          </TabsList>

          {/* ── Plans Tab ── */}
          <TabsContent value="plans">
            {credits && (
              <div className="glass rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Coins className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{credits.credits_balance} <span className="text-sm font-normal text-muted-foreground">credits remaining</span></p>
                    <p className="text-xs text-muted-foreground">{credits.credits_used} used this cycle · {credits.monthly_allowance}/mo allowance</p>
                  </div>
                </div>
                {subscriptionData.subscribed && (
                  <Button variant="outline" size="sm" onClick={handleManage}>Manage Subscription</Button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, idx) => {
                const isCurrent = plan.tier === currentTier;
                const PlanIcon = plan.icon;
                return (
                  <motion.div
                    key={plan.tier}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "rounded-2xl p-7 flex flex-col relative",
                      plan.highlight ? "glass glow-primary border-primary/30" : "glass",
                      isCurrent && "ring-2 ring-primary"
                    )}
                  >
                    {plan.badge && (
                      <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 gradient-primary text-primary-foreground text-[10px] px-3">
                        {plan.badge}
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge className="absolute -top-2.5 right-4 bg-forge-emerald text-primary-foreground text-[10px]">
                        Current
                      </Badge>
                    )}

                    <div className="flex items-center gap-2 mb-1">
                      <PlanIcon className="h-4 w-4 text-primary" />
                      <h3 className="text-lg font-bold">{TIERS[plan.tier]?.name}</h3>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      {(plan as any).originalPrice && (
                        <span className="text-lg text-muted-foreground/60 line-through mr-1">${(plan as any).originalPrice}</span>
                      )}
                      <span className="text-4xl font-extrabold">${plan.monthlyPrice}</span>
                      {plan.monthlyPrice > 0 && <span className="text-muted-foreground text-sm">/mo</span>}
                      {(plan as any).originalPrice && (
                        <Badge className="ml-2 bg-destructive text-destructive-foreground text-[10px] px-2">50% OFF</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-4">
                      <Coins className="h-3 w-3 text-primary" />
                      <span className="text-sm font-medium text-primary">{plan.credits} credits/mo</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>

                    <ul className="space-y-2.5 mb-8 flex-1">
                      {plan.features.map((f: any) => (
                        <li key={f.text} className={cn("flex items-center gap-2 text-sm", !f.included && "text-muted-foreground/50")}>
                          {f.included ? (
                            <Check className="h-4 w-4 text-forge-emerald shrink-0" />
                          ) : f.locked ? (
                            <Lock className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                          )}
                          {f.text}
                          {f.locked && !f.included && <Badge variant="outline" className="text-[9px] px-1.5 py-0 ml-auto opacity-60">Upgrade</Badge>}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={cn("w-full", plan.highlight && "gradient-primary text-primary-foreground")}
                      variant={plan.highlight ? "default" : "outline"}
                      disabled={isCurrent || checkingOut === plan.tier || plan.tier === "free"}
                      onClick={() => handleCheckout(plan.tier)}
                    >
                      {checkingOut === plan.tier ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isCurrent ? (
                        "Current Plan"
                      ) : plan.tier === "free" ? (
                        "Free Forever"
                      ) : (
                        <>Upgrade <ArrowRight className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* ── Usage Tab ── */}
          <TabsContent value="usage">
            <div className="space-y-6">
              {/* Breakdown Summary */}
              {transactions && transactions.length > 0 && (() => {
                const summary = transactions.reduce((acc: Record<string, { total: number; count: number }>, tx: any) => {
                  const type = tx.transaction_type || "other";
                  if (!acc[type]) acc[type] = { total: 0, count: 0 };
                  acc[type].total += tx.amount;
                  acc[type].count += 1;
                  return acc;
                }, {});
                const totalSpent = Object.entries(summary)
                  .filter(([, v]) => (v as { total: number }).total < 0)
                  .reduce((s, [, v]) => s + Math.abs((v as { total: number }).total), 0);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(summary).map(([type, vals]) => {
                      const v = vals as { total: number; count: number };
                      const TxIcon = TX_ICONS[type] || Coins;
                      const isPositive = v.total >= 0;
                      return (
                        <div key={type} className="glass rounded-xl p-4 text-center">
                          <TxIcon className={cn("h-4 w-4 mx-auto mb-1.5", isPositive ? "text-forge-emerald" : "text-muted-foreground")} />
                          <p className={cn("text-lg font-bold", isPositive ? "text-forge-emerald" : "text-foreground")}>
                            {isPositive ? "+" : ""}{v.total}
                          </p>
                          <p className="text-[11px] text-muted-foreground capitalize">{type} · {v.count} tx</p>
                        </div>
                      );
                    })}
                    {totalSpent > 0 && (
                      <div className="glass rounded-xl p-4 text-center">
                        <BarChart3 className="h-4 w-4 mx-auto mb-1.5 text-primary" />
                        <p className="text-lg font-bold">{totalSpent}</p>
                        <p className="text-[11px] text-muted-foreground">Total spent</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Transaction List */}
              <div className="glass rounded-xl p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Credit History
                </h3>
                {transactions && transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.map((tx: any) => {
                      const TxIcon = TX_ICONS[tx.transaction_type] || Coins;
                      const isPositive = tx.amount > 0;
                      return (
                        <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/50">
                          <div className="flex items-center gap-3">
                            <TxIcon className={cn("h-4 w-4", isPositive ? "text-forge-emerald" : "text-muted-foreground")} />
                            <div>
                              <p className="text-sm">{tx.description}</p>
                              <p className="text-[11px] text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn("text-sm font-medium", isPositive ? "text-forge-emerald" : "text-muted-foreground")}>
                              {isPositive ? "+" : ""}{tx.amount}
                            </p>
                            <p className="text-[11px] text-muted-foreground">bal: {tx.balance_after}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Coins className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p>No credit activity yet. Run an AI module to see usage here.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Top Up Tab ── */}
          <TabsContent value="topup">
            <div className="space-y-4">
              <div className="glass rounded-xl p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-1">
                  <ShoppingCart className="h-4 w-4 text-primary" /> Buy Credit Packs
                </h3>
                <p className="text-sm text-muted-foreground mb-6">Need more credits? Top up instantly — credits never expire.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {TOPUP_PACKS.map((pack, idx) => (
                    <motion.div
                      key={pack.priceId}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className={cn(
                        "rounded-xl p-5 flex flex-col items-center text-center relative",
                        pack.highlight ? "glass glow-primary border-primary/30" : "glass"
                      )}
                    >
                      {pack.highlight && (
                        <Badge className="absolute -top-2.5 gradient-primary text-primary-foreground text-[10px] px-3">
                          {pack.label}
                        </Badge>
                      )}
                      {!pack.highlight && pack.label === "Best Value" && (
                        <Badge variant="outline" className="absolute -top-2.5 text-[10px] px-3">
                          {pack.label}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1.5 mb-2 mt-1">
                        <Coins className="h-5 w-5 text-primary" />
                        <span className="text-3xl font-extrabold">{pack.credits.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">credits</p>
                      <p className="text-lg font-bold mb-1">${pack.price}</p>
                      <p className="text-[11px] text-muted-foreground mb-4">
                        ${(pack.price / pack.credits * 100).toFixed(1)}¢ per credit
                      </p>
                      <Button
                        className={cn("w-full", pack.highlight && "gradient-primary text-primary-foreground")}
                        variant={pack.highlight ? "default" : "outline"}
                        size="sm"
                        disabled={topUpLoading === pack.priceId}
                        onClick={() => handleTopUp(pack.priceId)}
                      >
                        {topUpLoading === pack.priceId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>Buy Now <ArrowRight className="ml-1 h-3 w-3" /></>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Costs Tab ── */}
          <TabsContent value="costs">
            <div className="glass rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" /> Credits Per AI Run
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Each AI model costs a different number of credits per run. Cheaper models = more runs.</p>
              <div className="space-y-2">
                {MODEL_COSTS.map((m) => (
                  <div key={m.model} className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/50">
                    <span className="text-sm">{m.model}</span>
                    <div className="flex items-center gap-1">
                      <Coins className="h-3 w-3 text-primary" />
                      <span className="text-sm font-bold">{m.credits}</span>
                      <span className="text-xs text-muted-foreground">credits</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                💡 Tip: Use Gemini Flash Lite for simple tasks to stretch your credits 10× further than GPT-5.2.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
