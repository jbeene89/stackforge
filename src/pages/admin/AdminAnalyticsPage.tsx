import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, CreditCard, Layers } from "lucide-react";
import { format, subDays } from "date-fns";

export default function AdminAnalyticsPage() {
  // Tier distribution
  const { data: tierDistribution } = useQuery({
    queryKey: ["admin-tier-distribution"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_credits")
        .select("tier");
      if (!data) return {};
      const counts: Record<string, number> = {};
      data.forEach((r: any) => {
        counts[r.tier] = (counts[r.tier] || 0) + 1;
      });
      return counts;
    },
  });

  // Recent signups (profiles created in last 7 days)
  const { data: recentSignups } = useQuery({
    queryKey: ["admin-recent-signups"],
    queryFn: async () => {
      const since = subDays(new Date(), 7).toISOString();
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since);
      return count || 0;
    },
  });

  // Total credits used platform-wide
  const { data: platformCreditsUsed } = useQuery({
    queryKey: ["admin-credits-used"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_credits")
        .select("credits_used");
      return data?.reduce((sum: number, r: any) => sum + r.credits_used, 0) || 0;
    },
  });

  // Marketplace templates
  const { data: templateCount } = useQuery({
    queryKey: ["admin-template-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("marketplace_templates")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const tiers = tierDistribution || {};
  const totalUsers = Object.values(tiers).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-5xl">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold font-display tracking-wide">Platform Analytics</h1>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "New Users (7d)", value: recentSignups?.toString() || "0", icon: TrendingUp, color: "#7FFF00" },
          { label: "Total Users", value: totalUsers.toString(), icon: Users, color: "#00E5FF" },
          { label: "Credits Used", value: platformCreditsUsed?.toLocaleString() || "0", icon: CreditCard, color: "#FF6B35" },
          { label: "Marketplace Items", value: templateCount?.toString() || "0", icon: Layers, color: "#B44FFF" },
        ].map((m) => (
          <div key={m.label} className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <m.icon className="h-3.5 w-3.5" style={{ color: m.color }} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <p className="text-2xl font-bold">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Tier distribution */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Tier Distribution</h3>
        <div className="space-y-3">
          {Object.entries(tiers).sort(([, a], [, b]) => (b as number) - (a as number)).map(([tier, count]) => {
            const pct = totalUsers > 0 ? ((count as number) / totalUsers) * 100 : 0;
            const colors: Record<string, string> = {
              free: "bg-muted-foreground",
              builder: "bg-forge-amber",
              pro: "bg-primary",
              admin: "bg-[hsl(var(--forge-emerald))]",
            };
            return (
              <div key={tier}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium capitalize">{tier}</span>
                  <span className="text-xs text-muted-foreground">{count as number} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${colors[tier] || "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
