import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Check, X, Zap, CreditCard, Receipt,
  TrendingUp, ArrowRight, Crown, Sparkles,
  BarChart3, Clock, Hash, Coins
} from "lucide-react";

// ------- PLANS DATA -------

const plans = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
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
    cta: "Current Plan",
    highlight: false,
    icon: Zap,
  },
  {
    name: "Pro",
    monthlyPrice: 29,
    yearlyPrice: 290,
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
    cta: "Upgrade to Pro",
    highlight: true,
    icon: Crown,
    badge: "Most Popular",
  },
  {
    name: "Team",
    monthlyPrice: 79,
    yearlyPrice: 790,
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
    cta: "Contact Sales",
    highlight: false,
    icon: Sparkles,
  },
];

const billingHistory = [
  { id: "inv-1", date: "Mar 1, 2026", amount: "$29.00", status: "paid", plan: "Pro" },
  { id: "inv-2", date: "Feb 1, 2026", amount: "$29.00", status: "paid", plan: "Pro" },
  { id: "inv-3", date: "Jan 1, 2026", amount: "$29.00", status: "paid", plan: "Pro" },
  { id: "inv-4", date: "Dec 1, 2025", amount: "$0.00", status: "free", plan: "Free" },
  { id: "inv-5", date: "Nov 1, 2025", amount: "$0.00", status: "free", plan: "Free" },
];

const usageMetrics = [
  { label: "Runs Used", current: 2847, limit: 5000, icon: Zap, color: "text-primary" },
  { label: "Modules Created", current: 12, limit: null, icon: Hash, color: "text-forge-cyan" },
  { label: "Stacks Built", current: 4, limit: null, icon: BarChart3, color: "text-forge-amber" },
  { label: "API Calls", current: 15420, limit: 50000, icon: TrendingUp, color: "text-forge-emerald" },
];

// ------- MAIN PAGE -------

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const currentPlan = "Pro";

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
            <TabsTrigger value="billing" className="text-xs gap-1.5"><Receipt className="h-3 w-3" /> Billing History</TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans">
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className={cn("text-sm", billing === "monthly" ? "font-semibold" : "text-muted-foreground")}>Monthly</span>
              <button
                onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors",
                  billing === "yearly" ? "bg-primary" : "bg-secondary"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform",
                  billing === "yearly" ? "translate-x-6" : "translate-x-0.5"
                )} />
              </button>
              <span className={cn("text-sm", billing === "yearly" ? "font-semibold" : "text-muted-foreground")}>
                Yearly
              </span>
              {billing === "yearly" && (
                <Badge className="bg-forge-emerald/15 text-forge-emerald text-[10px]">Save 17%</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, idx) => {
                const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
                const isCurrent = plan.name === currentPlan;
                const PlanIcon = plan.icon;
                return (
                  <motion.div
                    key={plan.name}
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
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-extrabold">${price}</span>
                      {price > 0 && (
                        <span className="text-muted-foreground text-sm">
                          /{billing === "monthly" ? "mo" : "yr"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>

                    <ul className="space-y-2.5 mb-8 flex-1">
                      {plan.features.map((f) => (
                        <li key={f.text} className={cn("flex items-center gap-2 text-sm", !f.included && "text-muted-foreground/50")}>
                          {f.included ? (
                            <Check className="h-4 w-4 text-forge-emerald shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                          )}
                          {f.text}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={cn("w-full", plan.highlight && "gradient-primary text-primary-foreground")}
                      variant={plan.highlight ? "default" : "outline"}
                      disabled={isCurrent}
                    >
                      {isCurrent ? "Current Plan" : plan.cta}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {usageMetrics.map((metric, i) => {
                const Icon = metric.icon;
                const pct = metric.limit ? (metric.current / metric.limit) * 100 : null;
                return (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="glass rounded-xl p-5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={cn("h-4 w-4", metric.color)} />
                      <span className="text-sm font-semibold">{metric.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold">{metric.current.toLocaleString()}</span>
                      {metric.limit && (
                        <span className="text-sm text-muted-foreground">/ {metric.limit.toLocaleString()}</span>
                      )}
                      {!metric.limit && (
                        <Badge variant="outline" className="text-[10px]">Unlimited</Badge>
                      )}
                    </div>
                    {pct !== null && (
                      <div className="space-y-1">
                        <Progress value={pct} className="h-2" />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{pct.toFixed(0)}% used</span>
                          <span>{(metric.limit! - metric.current).toLocaleString()} remaining</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Billing Period
              </h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current period: Mar 1 – Mar 31, 2026</span>
                <span className="text-muted-foreground">Resets in <span className="font-semibold text-foreground">22 days</span></span>
              </div>
            </div>
          </TabsContent>

          {/* Billing History */}
          <TabsContent value="billing">
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="p-4">Invoice</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((inv) => (
                    <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="p-4 font-mono text-xs">{inv.id}</td>
                      <td className="p-4">{inv.date}</td>
                      <td className="p-4"><Badge variant="outline" className="text-[10px]">{inv.plan}</Badge></td>
                      <td className="p-4 font-semibold">{inv.amount}</td>
                      <td className="p-4">
                        <Badge className={cn(
                          "text-[10px]",
                          inv.status === "paid" ? "bg-forge-emerald/15 text-forge-emerald" : "bg-muted text-muted-foreground"
                        )}>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {inv.status === "paid" && (
                          <Button variant="ghost" size="sm" className="text-[10px] h-6">
                            <Receipt className="h-3 w-3 mr-1" /> Download
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
