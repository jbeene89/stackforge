import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { HardDrive, Cpu, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Data ───────────────────────────────────────────────────
const BASE_MODELS = [
  { label: "Llama 3.2 1B", params: 1, fp16_gb: 2.0 },
  { label: "Llama 3.2 3B", params: 3, fp16_gb: 6.0 },
  { label: "Qwen 2.5 0.5B", params: 0.5, fp16_gb: 1.0 },
  { label: "Qwen 2.5 1.5B", params: 1.5, fp16_gb: 3.0 },
  { label: "Qwen 2.5 3B", params: 3, fp16_gb: 6.0 },
  { label: "Phi-3.5 Mini (3.8B)", params: 3.8, fp16_gb: 7.6 },
  { label: "Gemma 2 2B", params: 2, fp16_gb: 4.0 },
  { label: "TinyLlama 1.1B", params: 1.1, fp16_gb: 2.2 },
];

const QUANTIZATIONS = [
  { label: "Q2_K", bpw: 2.5, quality: "Low", speed: "Fastest" },
  { label: "Q3_K_S", bpw: 3.0, quality: "Fair", speed: "Fast" },
  { label: "Q3_K_M", bpw: 3.5, quality: "Fair+", speed: "Fast" },
  { label: "Q4_K_S", bpw: 4.0, quality: "Good", speed: "Balanced" },
  { label: "Q4_K_M", bpw: 4.5, quality: "Good+", speed: "Balanced" },
  { label: "Q5_K_S", bpw: 5.0, quality: "Great", speed: "Moderate" },
  { label: "Q5_K_M", bpw: 5.5, quality: "Great+", speed: "Moderate" },
  { label: "Q6_K", bpw: 6.0, quality: "Excellent", speed: "Slower" },
  { label: "Q8_0", bpw: 8.0, quality: "Near-FP16", speed: "Slowest" },
];

const DEVICES = [
  { label: "iPhone 12 / 13", ram_gb: 4 },
  { label: "iPhone 13 Pro / 14", ram_gb: 6 },
  { label: "iPhone 15 Pro / 16 Pro", ram_gb: 8 },
  { label: "Android — 4 GB RAM", ram_gb: 4 },
  { label: "Android — 6 GB RAM", ram_gb: 6 },
  { label: "Android — 8 GB RAM", ram_gb: 8 },
  { label: "Android — 12 GB RAM", ram_gb: 12 },
  { label: "Android — 16 GB RAM", ram_gb: 16 },
  { label: "Custom", ram_gb: 0 },
];

// OS + runtime overhead estimate
const OS_OVERHEAD_GB = 2.0;

function estimateGgufSize(fp16_gb: number, bpw: number): number {
  // GGUF size ~ fp16_size * (bpw / 16) + small overhead for metadata
  return fp16_gb * (bpw / 16) + 0.05;
}

function estimateRamNeeded(gguf_gb: number): number {
  // Runtime memory ~ 1.1-1.2x GGUF size (KV cache, buffers)
  return gguf_gb * 1.2;
}

type Verdict = "fits" | "tight" | "no";

function getVerdict(ramNeeded: number, availableRam: number): Verdict {
  const free = availableRam - OS_OVERHEAD_GB;
  if (ramNeeded <= free * 0.8) return "fits";
  if (ramNeeded <= free) return "tight";
  return "no";
}

// ─── Component ──────────────────────────────────────────────
export function RamChecker() {
  const [modelIdx, setModelIdx] = useState(0);
  const [quantIdx, setQuantIdx] = useState(3); // Q4_K_S default
  const [deviceIdx, setDeviceIdx] = useState(2); // iPhone 15 Pro
  const [customRam, setCustomRam] = useState(8);

  const model = BASE_MODELS[modelIdx];
  const quant = QUANTIZATIONS[quantIdx];
  const device = DEVICES[deviceIdx];
  const totalRam = device.ram_gb === 0 ? customRam : device.ram_gb;

  const calc = useMemo(() => {
    const ggufSize = estimateGgufSize(model.fp16_gb, quant.bpw);
    const ramNeeded = estimateRamNeeded(ggufSize);
    const verdict = getVerdict(ramNeeded, totalRam);
    const freeRam = totalRam - OS_OVERHEAD_GB;
    const usagePct = Math.min((ramNeeded / freeRam) * 100, 150);
    return { ggufSize, ramNeeded, verdict, freeRam, usagePct };
  }, [model, quant, totalRam]);

  const verdictConfig: Record<Verdict, { label: string; color: string; icon: typeof CheckCircle2; tip: string }> = {
    fits: {
      label: "Will fit comfortably",
      color: "text-[hsl(var(--forge-emerald))]",
      icon: CheckCircle2,
      tip: "Good headroom for KV cache and other apps.",
    },
    tight: {
      label: "Tight fit — may work",
      color: "text-[hsl(var(--forge-amber))]",
      icon: AlertTriangle,
      tip: "Close other apps before loading. Consider a smaller quant.",
    },
    no: {
      label: "Won't fit",
      color: "text-destructive",
      icon: AlertTriangle,
      tip: "Use a smaller quantization or a smaller base model.",
    },
  };

  const v = verdictConfig[calc.verdict];
  const VerdictIcon = v.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-[hsl(var(--forge-cyan))]" />
          RAM Compatibility Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Model */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Base Model
            </label>
            <Select
              value={String(modelIdx)}
              onValueChange={(v) => setModelIdx(Number(v))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BASE_MODELS.map((m, i) => (
                  <SelectItem key={i} value={String(i)} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantization */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Quantization
            </label>
            <Select
              value={String(quantIdx)}
              onValueChange={(v) => setQuantIdx(Number(v))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUANTIZATIONS.map((q, i) => (
                  <SelectItem key={i} value={String(i)} className="text-xs">
                    {q.label} — {q.quality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
</div>

          {/* Device */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Target Device
            </label>
            <Select
              value={String(deviceIdx)}
              onValueChange={(v) => setDeviceIdx(Number(v))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEVICES.map((d, i) => (
                  <SelectItem key={i} value={String(i)} className="text-xs">
                    {d.label}{d.ram_gb > 0 ? ` (${d.ram_gb} GB)` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom  RAM slider */}
        {device.ram_gb === 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Custom RAM</span>
              <span className="font-mono font-semibold">{customRam} GB</span>
            </div>
            <Slider
              value={[customRam]}
              onValueChange={([v]) => setCustomRam(v)}
              min={2}
              max={24}
              step={1}
            />
          </div>
        )}

        {/* Results */}
        <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 space-y-3in">
          {/* Numbers */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">GGUF Size</p>
              <p className="text-sm font-bold font-mono">{calc.ggufSize.toFixed(2)} GB</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">RAM Needed</p>
              <p className="text-sm font-bold font-mono">{calc.ramNeeded.toFixed(2)} GB</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Available</p>
              <p className="text-sm font-bold font-mono">{Math.max(0, calc.freeRam).toFixed(1)} GB</p>
              <p className="text-[9px] text-muted-foreground">({totalRam} GB - {OS_OVERHEAD_GB} GB OS)</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <Progress
              value={Math.min(calc.usagePct, 100)}
              className={cn(
                "h-2",
                calc.verdict === "fits" && "[&>div]:bg-[hsl(var(--forge-emerald))]",
                calc.verdict === "tight" && "[&>div]:bg-[hsl(var(--forge-amber))]",
                calc.verdict === "no" && "[&>div]:bg-destructive"
              )}
            />
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>0 GB</span>
              <span>{calc.freeRam.toFixed(1)} GB free</span>
            </div>
          </div>

          {/* Verdict */}
          <div className={cn("flex items-start gap-2 rounded-md p-2", v.color)}>
            <VerdictIcon className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold">{v.label}</p>
              <p className="text-[10px] opacity-80">{v.tip}</p>
            </div>
          </div>
        </div>

        {/* Info footnote */}
        <div className="flex items-start gap-1.5 text-[9px] text-muted-foreground">
          <Info className="h-3 w-3 shrink-0 mt-0.5" />
          <span>
            Estimates are approximate. Actual sizes vary by model architecture. RAM needed includes
            ~20% overhead for KV cache and runtime buffers. OS overhead estimated at {OS_OVERHEAD_GB} GB.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
