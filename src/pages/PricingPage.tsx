import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Check, X, Zap, CreditCard, Receipt,
  TrendingUp, ArrowRight, Crown, Sparkles,
  BarChart3, Clock, Hash, Coins, Loader2
} from "lucide-react";

const TIERS = {
  free: { name: "Free", product_id: null, price_id: null },
  pro: { name: "Pro", product_id: "prod_U7A3IhHjYVeMSC", price_id: "price_1T8vjqEgO8H7yovMYr4AlVvr" },
  team: { name: "Team", product_id: "prod_U7A4PumaFQmKPQ", price_id: "price_1T8vkaEgO8H7yovM9bBWWGwU" },
};

const plans = [
  {
    tier: "free" as const,
    monthlyPrice: 0,
    desc: "For personal projects and exploration.",
    features: [
      { text: "3 projects", included: true },
      { text: "5 AI modules", included: true },
      { text: "2 stacks", included: true },
      { text: "100 runs/month", included: true },
      { text: "Community support", included: true },
      { text: "Export code & configs", included: false },
      { text: "Version history", included: false },
      { text: "Team collaboration", included: false },
    ],
    icon: Zap,
  },
  {
    tier: "pro" as const,
    monthlyPrice: 29,
    desc: "For builders shipping real products.",
    features: [
      { text: "Unlimited projects", included: true },
      { text: "Unlimited modules", included: true },
      { text: "Unlimited stacks", included: true },
      { text: "5,000 runs/month", included: true },
      { text: "Priority support", included: true },
      { text: "Export code & configs", included: true },
      { text: "Version history", included: true },
      { text: "Team collaboration", included: false },
    ],
    icon: Crown,
    badge: "Most Popular",
    highlight: true,
  },
  {
    tier: "team" as const,
    monthlyPrice: 79,
    desc: "For teams building together.",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "5 team members", included: true },
      { text: "Shared workspace", included: true },
      { text: "Role-based access", included: true },
      { text: "Shared templates", included: true },
      { text: "Audit logs", included: true },
      { text: "Dedicated support", included: true },
      { text: "SSO integration", included: true },
    ],
    icon: Sparkles,
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<{
    subscribed: boolean;
    product_id: string | null;
    subscription_end: string | null;
  }>({ subscribed: false, product_id: null, subscription_end: null });
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
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

  // Check for success param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast.success("Subscription activated! Welcome aboard.");
      checkSubscription();
      window.history.replaceState({}, "", "/pricing");
    }
  }, []);

  const currentTier = subscriptionData.subscribed
    ? Object.entries(TIERS).find(([, t]) => t.product_id === subscriptionData.product_id)?.[0] || "free"
    : "free";

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
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Pricing & Billing</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Manage your subscription, view usage, and billing history.</p>

        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="glass w-fit">
            <TabsTrigger value="plans" className="text-xs gap-1.5"><Crown className="h-3 w-3" /> Plans</TabsTrigger>
            <TabsTrigger value="usage" className="text-xs gap-1.5"><BarChart3 className="h-3 w-3" /> Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            {subscriptionData.subscribed && (
              <div className="glass rounded-xl p-4 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Current plan: <span className="text-primary">{TIERS[currentTier as keyof typeof TIERS]?.name}</span></p>
                  {subscriptionData.subscription_end && (
                    <p className="text-xs text-muted-foreground">Renews {new Date(subscriptionData.subscription_end).toLocaleDateString()}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleManage}>Manage Subscription</Button>
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
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-extrabold">${plan.monthlyPrice}</span>
                      {plan.monthlyPrice > 0 && <span className="text-muted-foreground text-sm">/mo</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>

                    <ul className="space-y-2.5 mb-8 flex-1">
                      {plan.features.map((f) => (
                        <li key={f.text} className={cn("flex items-center gap-2 text-sm", !f.included && "text-muted-foreground/50")}>
                          {f.included ? <Check className="h-4 w-4 text-forge-emerald shrink-0" /> : <X className="h-4 w-4 text-muted-foreground/30 shrink-0" />}
                          {f.text}
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

          <TabsContent value="usage">
            <div className="glass rounded-xl p-6 text-center text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Usage tracking will populate as you use the platform.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={checkSubscription}>
                <Zap className="h-3 w-3 mr-1" /> Refresh Status
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
