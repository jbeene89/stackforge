import { cn } from "@/lib/utils";
import { Crown, Flame, Zap, Star, ShieldCheck } from "lucide-react";

export type TierName = "free" | "builder" | "pro" | "admin";

const tierConfig: Record<TierName, {
  label: string;
  icon: React.ElementType;
  colors: string;
  glow: string;
  flair: string;
}> = {
  free: {
    label: "Free",
    icon: Star,
    colors: "bg-muted text-muted-foreground border-border",
    glow: "",
    flair: "",
  },
  builder: {
    label: "Builder",
    icon: Zap,
    colors: "bg-forge-amber/15 text-forge-amber border-forge-amber/30",
    glow: "shadow-[0_0_8px_hsl(var(--forge-amber)/0.3)]",
    flair: "✦",
  },
  pro: {
    label: "Pro",
    icon: Crown,
    colors: "bg-primary/15 text-primary border-primary/30",
    glow: "shadow-[0_0_12px_hsl(var(--primary)/0.4)]",
    flair: "⚡",
  },
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    colors: "bg-[hsl(var(--forge-emerald))]/15 text-[hsl(var(--forge-emerald))] border-[hsl(var(--forge-emerald))]/30",
    glow: "shadow-[0_0_14px_hsl(var(--forge-emerald)/0.5)]",
    flair: "🛡️",
  },
};

interface TierBadgeProps {
  tier: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showFlair?: boolean;
  className?: string;
}

export function TierBadge({ tier, size = "sm", showIcon = true, showFlair = true, className }: TierBadgeProps) {
  const config = tierConfig[(tier as TierName)] || tierConfig.free;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full border transition-all",
        config.colors,
        tier !== "free" && config.glow,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={cn(size === "sm" ? "h-2.5 w-2.5" : size === "md" ? "h-3 w-3" : "h-4 w-4")} />}
      {config.label}
      {showFlair && config.flair && <span className="ml-0.5">{config.flair}</span>}
    </span>
  );
}

/** Small flair dot for avatars / names — just the icon + glow */
export function TierFlair({ tier, className }: { tier: string; className?: string }) {
  const config = tierConfig[(tier as TierName)] || tierConfig.free;
  const Icon = config.icon;

  if (tier === "free") return null;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        tier === "pro" ? "text-primary" : "text-forge-amber",
        className
      )}
    >
      <Icon className="h-3 w-3" />
    </span>
  );
}
