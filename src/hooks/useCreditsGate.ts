import { useCredits } from "@/hooks/useCredits";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useCreditsGate(minCredits = 1) {
  const { data: credits, isLoading } = useCredits();
  const navigate = useNavigate();

  const hasCredits = (credits?.credits_balance ?? 0) >= minCredits;
  const balance = credits?.credits_balance ?? 0;

  const requireCredits = useCallback(
    (onSuccess: () => void) => {
      if (!credits || credits.credits_balance < minCredits) {
        toast.error("You're out of credits!", {
          description: "Grab a credit pack to keep building.",
          action: { label: "Buy Credits", onClick: () => navigate("/pricing?tab=credits") },
        });
        return;
      }
      onSuccess();
    },
    [credits, minCredits, navigate]
  );

  return { hasCredits, balance, isLoading, requireCredits, tier: credits?.tier || "free" };
}
