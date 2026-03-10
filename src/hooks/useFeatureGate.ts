import { useCredits } from "@/hooks/useCredits";

export type GatedFeature = "export" | "robotics" | "edge-training";

const FEATURE_TIERS: Record<GatedFeature, string[]> = {
  export: ["builder", "pro"],
  robotics: ["pro"],
  "edge-training": ["pro"],
};

const FEATURE_LABELS: Record<GatedFeature, { name: string; requiredTier: string }> = {
  export: { name: "Export Studio", requiredTier: "Builder" },
  robotics: { name: "Robotics Controllers", requiredTier: "Pro" },
  "edge-training": { name: "Edge Training", requiredTier: "Pro" },
};

export function useFeatureGate(feature: GatedFeature) {
  const { data: credits, isLoading } = useCredits();

  const userTier = credits?.tier || "free";
  const allowedTiers = FEATURE_TIERS[feature];
  const hasAccess = allowedTiers.includes(userTier);
  const { name, requiredTier } = FEATURE_LABELS[feature];

  return { hasAccess, isLoading, featureName: name, requiredTier, userTier };
}
