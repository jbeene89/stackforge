import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  Wifi,
  WifiOff,
  ChevronRight,
  Server,
  Brain,
  Database,
  Smartphone,
  HardDrive,
  Layers,
  Zap,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Capability definitions ─────────────────────────────────
type IndependenceLevel = "local" | "hybrid" | "cloud";

interface Capability {
  id: string;
  label: string;
  description: string;
  level: IndependenceLevel;
  icon: typeof Shield;
  actionLabel?: string;
  actionUrl?: string;
  tip?: string;
}

const CAPABILITIES: Capability[] = [
  {
    id: "inference",
    label: "Model Inference",
    description: "Run prompts against your SLM",
    level: "local",
    icon: Brain,
    tip: "WebGPU in-browser inference or Ollama on-device via Inference Playground",
    actionLabel: "Open Console",
    actionUrl: "/console",
  },
  {
    id: "training",
    label: "Model Training",
    description: "LoRA fine-tuning on your data",
    level: "local",
    icon: Zap,
    tip: "Training kit runs locally via venv with auto hardware detection",
    actionLabel: "Deploy Pipeline",
    actionUrl: "/deploy",
  },
  {
    id: "data-capture",
    label: "Data Capture",
    description: "Voice, photo, and text capture on mobile",
    level: "hybrid",
    icon: Smartphone,
    tip: "Capture works offline via PWA; syncs to cloud when online",
    actionLabel: "Capture",
    actionUrl: "/capture",
  },
  {
    id: "pipeline",
    label: "CDPT Pipeline",
    description: "13-call cognitive perspective analysis",
    level: "local",
    icon: Layers,
    tip: "cognitive_pipeline_offline.py runs entirely via local Ollama",
    actionLabel: "Self-Host",
    actionUrl: "/self-host",
  },
  {
    id: "data-storage",
    label: "Data Storage",
    description: "Datasets, samples, and fingerprints",
    level: "hybrid",
    icon: Database,
    tip: "Stored in cloud DB with offline IndexedDB cache; exportable via Self-Host",
    actionLabel: "Export Data",
    actionUrl: "/self-host",
  },
  {
    id: "model-conversion",
    label: "GGUF Conversion",
    description: "Convert models for mobile deployment",
    level: "local",
    icon: HardDrive,
    tip: "llama.cpp runs locally; included in self-host package",
  },
  {
    id: "deployment",
    label: "Self-Hosted Deploy",
    description: "Full Docker-based infrastructure",
    level: "local",
    icon: Server,
    tip: "Self-Host Package Generator creates a complete offline stack",
    actionLabel: "Generate Package",
    actionUrl: "/self-host",
  },
  {
    id: "auth",
    label: "Authentication",
    description: "User login and session management",
    level: "cloud",
    icon: Lock,
    tip: "Currently requires cloud auth; self-host package removes this dependency",
  },
  {
    id: "marketplace",
    label: "Marketplace",
    description: "Template sharing and purchases",
    level: "cloud",
    icon: Cloud,
    tip: "Community features require cloud connectivity",
  },
  {
    id: "payments",
    label: "Payments & Credits",
    description: "Subscription and credit management",
    level: "cloud",
    icon: Cloud,
    tip: "Stripe integration requires internet; self-hosted version has no paywalls",
  },
];

const LEVEL_CONFIG: Record<IndependenceLevel, { label: string; color: string; icon: typeof CheckCircle2; badgeClass: string }> = {
  local: {
    label: "Fully Local",
    color: "text-[hsl(var(--forge-emerald))]",
    icon: WifiOff,
    badgeClass: "bg-[hsl(var(--forge-emerald))]/10 text-[hsl(var(--forge-emerald))] border-[hsl(var(--forge-emerald))]/20",
  },
  hybrid: {
    label: "Hybrid",
    color: "text-[hsl(var(--forge-amber))]",
    icon: Wifi,
    badgeClass: "bg-[hsl(var(--forge-amber))]/10 text-[hsl(var(--forge-amber))] border-[hsl(var(--forge-amber))]/20",
  },
  cloud: {
    label: "Cloud",
    color: "text-muted-foreground",
    icon: Cloud,
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
};

// ─── Component ──────────────────────────────────────────────
export function IndependenceScorecard({ compact = false }: { compact?: boolean }) {
  const score = useMemo(() => {
    const local = CAPABILITIES.filter((c) => c.level === "local").length;
    const hybrid = CAPABILITIES.filter((c) => c.level === "hybrid").length;
    const cloud = CAPABILITIES.filter((c) => c.level === "cloud").length;
    const total = CAPABILITIES.length;
    // Local = 100%, hybrid = 50%, cloud = 0%
    const pct = Math.round(((local + hybrid * 0.5) / total) * 100);
    return { local, hybrid, cloud, total, pct };
  }, []);

  if (compact) {
    return (
      <Link to="/self-host" className="block">
        <Card className="hover:border-[hsl(var(--forge-emerald))]/30 transition-all cursor-pointer">
          <CardContent className="py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-[hsl(var(--forge-emerald))]/10 shrink-0">
              <Shield className="h-4 w-4 text-[hsl(var(--forge-emerald))]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Independence Score</p>
                <span className="text-sm font-bold font-mono text-[hsl(var(--forge-emerald))]">
                  {score.pct}%
                </span>
              </div>
              <Progress
                value={score.pct}
                className="h-1.5 mt-1.5 [&>div]:bg-[hsl(var(--forge-emerald))]"
              />
              <div className="flex gap-3 mt-1 text-[9px] text-muted-foreground">
                <span>{score.local} local</span>
                <span>{score.hybrid} hybrid</span>
                <span>{score.cloud} cloud</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-[hsl(var(--forge-emerald))]" />
            Independence Scorecard
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-[hsl(var(--forge-emerald))]">
              {score.pct}%
            </span>
            <span className="text-[10px] text-muted-foreground">independent</span>
          </div>
        </div>
        <Progress
          value={score.pct}
          className="h-2 mt-1 [&>div]:bg-gradient-to-r [&>div]:from-[hsl(var(--forge-emerald))] [&>div]:to-[hsl(var(--forge-cyan))]"
        />
        <div className="flex gap-4 mt-2">
          {(["local", "hybrid", "cloud"] as const).map((level) => {
            const cfg = LEVEL_CONFIG[level];
            const count = CAPABILITIES.filter((c) => c.level === level).length;
            const Icon = cfg.icon;
            return (
              <div key={level} className={cn("flex items-center gap-1.5 text-[10px]", cfg.color)}>
                <Icon className="h-3 w-3" />
                <span className="font-semibold">{count}</span>
                <span className="text-muted-foreground">{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {CAPABILITIES.map((cap) => {
          const lvl = LEVEL_CONFIG[cap.level];
          const LvlIcon = lvl.icon;
          const CapIcon = cap.icon;

          return (
            <div
              key={cap.id}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-secondary/30 transition-colors group"
            >
              <CapIcon className={cn("h-4 w-4 shrink-0", lvl.color)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold truncate">{cap.label}</p>
                  <Badge variant="outline" className={cn("text-[8px] h-3.5 shrink-0", lvl.badgeClass)}>
                    <LvlIcon className="h-2 w-2 mr-0.5" />
                    {lvl.label}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{cap.tip || cap.description}</p>
              </div>
              {cap.actionUrl && (
                <Link
                  to={cap.actionUrl}
                  className="text-[9px] text-[hsl(var(--forge-cyan))] font-semibold opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex items-center gap-0.5"
                >
                  {cap.actionLabel} <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
