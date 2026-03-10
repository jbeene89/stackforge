import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useReferralStats } from "@/hooks/useMarketplace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Users, Coins, Copy, Link, TrendingUp } from "lucide-react";

export default function ReferralSection() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useReferralStats();
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/signup?ref=${stats?.referralCode || ""}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">Referral Program</h2>
        <Badge variant="outline" className="text-[10px]">10% revenue share</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Share your referral link. When someone signs up and makes marketplace purchases, you earn 10% of the credits they spend.
      </p>

      <div className="flex gap-2">
        <Input
          value={referralLink}
          readOnly
          className="text-xs font-mono h-9"
        />
        <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0">
          {copied ? "Copied!" : <><Copy className="h-3 w-3 mr-1" /> Copy</>}
        </Button>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-strong rounded-lg p-3 text-center">
          <div className="text-2xl font-bold">{stats?.referralCount || 0}</div>
          <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <Users className="h-3 w-3" /> Referrals
          </div>
        </div>
        <div className="glass-strong rounded-lg p-3 text-center">
          <div className="text-2xl font-bold flex items-center justify-center gap-1">
            {stats?.totalEarned || 0} <Coins className="h-4 w-4 text-forge-amber" />
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <TrendingUp className="h-3 w-3" /> Credits Earned
          </div>
        </div>
      </div>

      {(stats?.earnings || []).length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">Recent Earnings</h3>
            {stats!.earnings.slice(0, 5).map((e: any) => (
              <div key={e.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{e.source_type} referral bonus</span>
                <Badge variant="secondary" className="text-[10px]">+{e.amount} credits</Badge>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
