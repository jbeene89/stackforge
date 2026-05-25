/**
 * Central AI model registry.
 * Single source of truth for the Lovable AI Gateway models the app can call.
 * Edge functions mirror just the cost map; UI reads everything from here.
 */

export type ReasoningEffort = "minimal" | "low" | "medium" | "high" | "xhigh";

export type ModelTier = "free" | "builder" | "pro" | "admin";

export interface AIModel {
  id: string;
  label: string;
  provider: "google" | "openai";
  family: string;
  /** Credit cost per call (text models). */
  costCredits: number;
  /** Minimum subscription tier required to select this model. */
  minTier: ModelTier;
  /** Model supports a `reasoning.effort` request parameter. */
  reasoning: boolean;
  /** Image-generation model (different request shape). */
  image?: boolean;
  /** One-liner shown in pickers. */
  strength: string;
  /** Whether to feature in the "new arrivals" rail. */
  isNew?: boolean;
}

export const AI_MODELS: AIModel[] = [
  // ---------- Google Gemini — Text ----------
  {
    id: "google/gemini-3.5-flash",
    label: "Gemini 3.5 Flash",
    provider: "google",
    family: "gemini-3.5",
    costCredits: 2,
    minTier: "free",
    reasoning: true,
    strength: "Fast coding + agentic workflows",
    isNew: true,
  },
  {
    id: "google/gemini-3-flash-preview",
    label: "Gemini 3 Flash",
    provider: "google",
    family: "gemini-3",
    costCredits: 2,
    minTier: "free",
    reasoning: false,
    strength: "Default everyday workhorse",
  },
  {
    id: "google/gemini-3.1-flash-lite-preview",
    label: "Gemini 3.1 Flash Lite",
    provider: "google",
    family: "gemini-3.1",
    costCredits: 1,
    minTier: "free",
    reasoning: false,
    strength: "Cheapest, high-volume tasks",
    isNew: true,
  },
  {
    id: "google/gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro",
    provider: "google",
    family: "gemini-3.1",
    costCredits: 6,
    minTier: "builder",
    reasoning: true,
    strength: "Deep reasoning + big context",
    isNew: true,
  },
  {
    id: "google/gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    provider: "google",
    family: "gemini-2.5",
    costCredits: 5,
    minTier: "builder",
    reasoning: true,
    strength: "Multimodal heavyweight",
  },
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "google",
    family: "gemini-2.5",
    costCredits: 2,
    minTier: "free",
    reasoning: false,
    strength: "Balanced cost + capability",
  },
  {
    id: "google/gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite",
    provider: "google",
    family: "gemini-2.5",
    costCredits: 1,
    minTier: "free",
    reasoning: false,
    strength: "Tiny + cheap classifier",
  },

  // ---------- OpenAI GPT-5 line ----------
  {
    id: "openai/gpt-5.5",
    label: "GPT-5.5",
    provider: "openai",
    family: "gpt-5.5",
    costCredits: 14,
    minTier: "pro",
    reasoning: true,
    strength: "State of the art reasoning",
    isNew: true,
  },
  {
    id: "openai/gpt-5.5-pro",
    label: "GPT-5.5 Pro",
    provider: "openai",
    family: "gpt-5.5",
    costCredits: 22,
    minTier: "pro",
    reasoning: true,
    strength: "Hardest problems, extended reasoning",
    isNew: true,
  },
  {
    id: "openai/gpt-5.4",
    label: "GPT-5.4",
    provider: "openai",
    family: "gpt-5.4",
    costCredits: 12,
    minTier: "pro",
    reasoning: true,
    strength: "Top-tier reasoning + code",
    isNew: true,
  },
  {
    id: "openai/gpt-5.4-mini",
    label: "GPT-5.4 Mini",
    provider: "openai",
    family: "gpt-5.4",
    costCredits: 6,
    minTier: "builder",
    reasoning: true,
    strength: "Reasoning, smaller bill",
    isNew: true,
  },
  {
    id: "openai/gpt-5.4-nano",
    label: "GPT-5.4 Nano",
    provider: "openai",
    family: "gpt-5.4",
    costCredits: 3,
    minTier: "free",
    reasoning: true,
    strength: "Fast reasoning under budget",
    isNew: true,
  },
  {
    id: "openai/gpt-5",
    label: "GPT-5",
    provider: "openai",
    family: "gpt-5",
    costCredits: 8,
    minTier: "builder",
    reasoning: false,
    strength: "Powerful all-rounder",
  },
  {
    id: "openai/gpt-5-mini",
    label: "GPT-5 Mini",
    provider: "openai",
    family: "gpt-5",
    costCredits: 3,
    minTier: "free",
    reasoning: false,
    strength: "Mid-cost, high quality",
  },
  {
    id: "openai/gpt-5-nano",
    label: "GPT-5 Nano",
    provider: "openai",
    family: "gpt-5",
    costCredits: 2,
    minTier: "free",
    reasoning: false,
    strength: "Tiny + fast",
  },
  {
    id: "openai/gpt-5.2",
    label: "GPT-5.2",
    provider: "openai",
    family: "gpt-5.2",
    costCredits: 10,
    minTier: "pro",
    reasoning: true,
    strength: "Complex problem solving",
  },

  // ---------- Image Models ----------
  {
    id: "google/gemini-3.1-flash-image-preview",
    label: "Nano Banana 2 (Flash Image)",
    provider: "google",
    family: "image",
    costCredits: 3,
    minTier: "free",
    reasoning: false,
    image: true,
    strength: "Fast pro-quality images",
    isNew: true,
  },
  {
    id: "google/gemini-3-pro-image-preview",
    label: "Gemini 3 Pro Image",
    provider: "google",
    family: "image",
    costCredits: 5,
    minTier: "builder",
    reasoning: false,
    image: true,
    strength: "Best quality + text legibility",
    isNew: true,
  },
  {
    id: "google/gemini-2.5-flash-image",
    label: "Nano Banana (2.5)",
    provider: "google",
    family: "image",
    costCredits: 2,
    minTier: "free",
    reasoning: false,
    image: true,
    strength: "Budget image gen",
  },
];

export const MODEL_INDEX: Record<string, AIModel> = Object.fromEntries(
  AI_MODELS.map((m) => [m.id, m])
);

export const TEXT_MODELS = AI_MODELS.filter((m) => !m.image);
export const IMAGE_MODELS = AI_MODELS.filter((m) => m.image);
export const REASONING_MODELS = AI_MODELS.filter((m) => m.reasoning);
export const NEW_MODELS = AI_MODELS.filter((m) => m.isNew);

const TIER_ORDER: Record<ModelTier, number> = { free: 0, builder: 1, pro: 2, admin: 3 };

export function isModelAvailableForTier(model: AIModel, tier: ModelTier): boolean {
  return TIER_ORDER[tier] >= TIER_ORDER[model.minTier];
}

/** Max reasoning effort allowed for a given subscription tier. */
export function maxEffortForTier(tier: ModelTier): ReasoningEffort {
  switch (tier) {
    case "free":
      return "low";
    case "builder":
      return "medium";
    case "pro":
      return "high";
    case "admin":
      return "xhigh";
  }
}

const EFFORT_ORDER: ReasoningEffort[] = ["minimal", "low", "medium", "high", "xhigh"];

export function clampEffort(requested: ReasoningEffort, tier: ModelTier): ReasoningEffort {
  const cap = maxEffortForTier(tier);
  const reqIdx = EFFORT_ORDER.indexOf(requested);
  const capIdx = EFFORT_ORDER.indexOf(cap);
  return reqIdx <= capIdx ? requested : cap;
}

/** Smart defaults for specific app surfaces. */
export const SURFACE_DEFAULTS = {
  general: { model: "google/gemini-3-flash-preview", effort: "medium" as ReasoningEffort },
  code: { model: "openai/gpt-5.4-mini", effort: "medium" as ReasoningEffort },
  council: { model: "google/gemini-3.1-pro-preview", effort: "high" as ReasoningEffort },
  knowledge: { model: "google/gemini-2.5-flash", effort: "medium" as ReasoningEffort },
  knowledgeDeep: { model: "openai/gpt-5.4", effort: "high" as ReasoningEffort },
  imageDefault: { model: "google/gemini-3.1-flash-image-preview", effort: "medium" as ReasoningEffort },
};
