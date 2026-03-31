import { useCredits } from "@/hooks/useCredits";
import { UpgradePrompt } from "@/components/UpgradePrompt";

interface TierProtectedRouteProps {
  children: React.ReactNode;
  requiredTier: string;
  allowedTiers: string[];
  featureName: string;
}

export function TierProtectedRoute({
  children,
  requiredTier,
  allowedTiers,
  featureName,
}: TierProtectedRouteProps) {
  const { data: credits, isLoading } = useCredits();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const userTier = credits?.tier || "free";

  if (userTier !== "admin" && !allowedTiers.includes(userTier)) {
    return (
      <UpgradePrompt
        featureName={featureName}
        requiredTier={requiredTier}
        currentTier={userTier}
      />
    );
  }

  return <>{children}</>;
}
