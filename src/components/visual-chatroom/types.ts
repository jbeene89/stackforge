import { Hammer, Heart, Zap, ShieldAlert, Settings2 } from "lucide-react";

export interface ChatMessage {
  characterId: string;
  image: string | null;
  text?: string;
  round: number;
  isUserInjection?: boolean;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  avatar: string;
}

export const CHARACTERS: Character[] = [
  { id: "builder", name: "Axiom", role: "Builder", icon: Hammer, color: "hsl(var(--forge-cyan))", bgColor: "hsl(var(--forge-cyan) / 0.15)", borderColor: "hsl(var(--forge-cyan) / 0.3)", avatar: "⚒️" },
  { id: "empath", name: "Lyra", role: "Empath", icon: Heart, color: "hsl(var(--forge-rose))", bgColor: "hsl(var(--forge-rose) / 0.15)", borderColor: "hsl(var(--forge-rose) / 0.3)", avatar: "🌙" },
  { id: "frame_breaker", name: "Flux", role: "Frame Breaker", icon: Zap, color: "hsl(var(--forge-amber))", bgColor: "hsl(var(--forge-amber) / 0.15)", borderColor: "hsl(var(--forge-amber) / 0.3)", avatar: "⚡" },
  { id: "red_team", name: "Sentinel", role: "Red Team", icon: ShieldAlert, color: "hsl(var(--forge-emerald))", bgColor: "hsl(var(--forge-emerald) / 0.15)", borderColor: "hsl(var(--forge-emerald) / 0.3)", avatar: "🛡️" },
  { id: "systems", name: "Prism", role: "Systems", icon: Settings2, color: "hsl(var(--forge-violet))", bgColor: "hsl(var(--forge-violet) / 0.15)", borderColor: "hsl(var(--forge-violet) / 0.3)", avatar: "🔮" },
];
