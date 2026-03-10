import { useCredits } from "@/hooks/useCredits";
import { Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TierBadge } from "@/components/TierBadge";

export function CreditsBadge({ collapsed = false }: { collapsed?: boolean }) {
  const { data: credits } = useCredits();
  const navigate = useNavigate();

  if (!credits) return null;

  const pct = credits.monthly_allowance > 0
    ? (credits.credits_balance / credits.monthly_allowance) * 100
    : 0;
  const isLow = pct < 20;
  const isCritical = pct < 5;

  const badge = (
    <button
      onClick={() => navigate("/pricing")}
      className={cn(
        "flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
        "hover:bg-accent/50 cursor-pointer",
        isCritical
          ? "text-destructive bg-destructive/10"
          : isLow
          ? "text-yellow-500 bg-yellow-500/10"
          : "text-muted-foreground"
      )}
    >
      <Coins className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <div className="flex-1 text-left">
          <div className="flex items-center justify-between">
            <span>{credits.credits_balance} credits</span>
            <TierBadge tier={credits.tier} size="sm" showFlair={true} />
          </div>
          <div className="h-1 w-full bg-muted rounded-full mt-1 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isCritical ? "bg-destructive" : isLow ? "bg-yellow-500" : "bg-primary"
              )}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent side="right">
            {credits.credits_balance} / {credits.monthly_allowance} credits ({credits.tier})
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
