import { useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Cpu, Zap, Monitor, Copy, AlertTriangle, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OLLAMA_LOCAL_MODELS } from "@/lib/localModels";

// ─── GPU Database ────────────────────────────────────────────
export interface GPUProfile {
  id: string;
  name: string;
  vendor: "amd" | "nvidia" | "apple" | "cpu";
  vram_gb: number;
  backend: string;
  ollamaTag: string;
  setupCommands: string[];
  dockerFlags: string[];
  envVars: Record<string, string>;
  notes: string;
}

const GPU_PROFILES: GPUProfile[] = [
  {
    id: "rx580-win",
    name: "AMD RX 580 8GB (Windows · Vulkan)",
    vendor: "amd",
    vram_gb: 8,
    backend: "Vulkan (Ollama)",
    ollamaTag: "latest",
    setupCommands: [
      "# RX 580 (Polaris / gfx803) is NOT supported by ROCm or AMD HIP SDK on Windows.",
      "# Use current official Ollama with Vulkan; verify GPU use with ollama ps.",
      "",
      "# Option A — LM Studio (easiest, GUI):",
      "#   1. Download: https://lmstudio.ai",
      "#   2. Settings → Hardware → pick 'Vulkan' runtime",
      "#   3. Load any GGUF model, offload all layers to GPU",
      "",
      "# Option B — Official Ollama (PowerShell):",
      "winget install --id Ollama.Ollama -e",
      "ollama serve",
      "# In another PowerShell window:",
      "ollama run qwen3:1.7b",
      "ollama ps",
      "",
      "# Option C — llama.cpp Vulkan build (most control):",
      "#   Download from: https://github.com/ggerganov/llama.cpp/releases",
      "#   Pick the 'llama-bXXXX-bin-win-vulkan-x64.zip' asset",
    ],
    dockerFlags: [],
    envVars: {
      GGML_VK_VISIBLE_DEVICES: "0",
    },
    notes: "RX 580 is not officially supported by ROCm on Windows. Current Ollama includes Vulkan support; update your AMD driver, start with a small model, and check GPU use with ollama ps. Performance depends on your driver and card.",
  },
  {
    id: "rx580",
    name: "AMD RX 580 8GB (Linux · Vulkan)",
    vendor: "amd",
    vram_gb: 8,
    backend: "Vulkan (Ollama)",
    ollamaTag: "latest",
    setupCommands: [
      "# Install a Vulkan-capable AMD driver for your Linux distribution first.",
      "curl -fsSL https://ollama.com/install.sh | sh",
      "",
      "# Current Ollama enables installed Vulkan backends by default.",
      "",
      "ollama serve",
      "# In another terminal: ollama run qwen3:1.7b",
      "# Check GPU use: ollama ps",
    ],
    dockerFlags: [
      "--device=/dev/dri",
      "--group-add render",
    ],
    envVars: {
      GGML_VK_VISIBLE_DEVICES: "0",
    },
    notes: "Polaris is not an officially supported ROCm target. Use current Ollama with a Vulkan driver; GPU availability depends on your Linux driver and permissions. No ROCm override is required for Vulkan.",
  },
  {
    id: "rx6600",
    name: "AMD RX 6600 8GB",
    vendor: "amd",
    vram_gb: 8,
    backend: "ROCm",
    ollamaTag: "rocm",
    setupCommands: [
      "curl -fsSL https://ollama.com/install.sh | sh",
      "export HSA_OVERRIDE_GFX_VERSION=10.3.0",
      "ollama serve",
    ],
    dockerFlags: [
      "--device=/dev/kfd",
      "--device=/dev/dri",
      "--group-add video",
      "-e HSA_OVERRIDE_GFX_VERSION=10.3.0",
    ],
    envVars: { HSA_OVERRIDE_GFX_VERSION: "10.3.0" },
    notes: "RDNA 2 — native ROCm support. ~15-20 tok/s on 7B Q4.",
  },
  {
    id: "rx7900xtx",
    name: "AMD RX 7900 XTX 24GB",
    vendor: "amd",
    vram_gb: 24,
    backend: "ROCm",
    ollamaTag: "rocm",
    setupCommands: [
      "curl -fsSL https://ollama.com/install.sh | sh",
      "ollama serve",
    ],
    dockerFlags: ["--device=/dev/kfd", "--device=/dev/dri", "--group-add video"],
    envVars: {},
    notes: "RDNA 3 — full ROCm support. Runs 13B+ models easily. ~30-40 tok/s on 7B.",
  },
  {
    id: "rtx3060",
    name: "NVIDIA RTX 3060 12GB",
    vendor: "nvidia",
    vram_gb: 12,
    backend: "CUDA",
    ollamaTag: "latest",
    setupCommands: [
      "curl -fsSL https://ollama.com/install.sh | sh",
      "ollama serve",
    ],
    dockerFlags: ["--gpus all"],
    envVars: {},
    notes: "Ampere — excellent CUDA support. ~25-35 tok/s on 7B Q4.",
  },
  {
    id: "rtx4090",
    name: "NVIDIA RTX 4090 24GB",
    vendor: "nvidia",
    vram_gb: 24,
    backend: "CUDA",
    ollamaTag: "latest",
    setupCommands: [
      "curl -fsSL https://ollama.com/install.sh | sh",
      "ollama serve",
    ],
    dockerFlags: ["--gpus all"],
    envVars: {},
    notes: "Ada Lovelace — top-tier. Runs 13B at full speed, 70B Q4 fits in VRAM.",
  },
  {
    id: "cpu",
    name: "CPU Only (no GPU)",
    vendor: "cpu",
    vram_gb: 0,
    backend: "CPU",
    ollamaTag: "latest",
    setupCommands: [
      "curl -fsSL https://ollama.com/install.sh | sh",
      "ollama serve",
    ],
    dockerFlags: [],
    envVars: {},
    notes: "Runs on any machine. Slower (~2-5 tok/s on 7B) but fully functional.",
  },
];

// ─── Model Catalog with VRAM requirements ────────────────────
export interface OllamaModel {
  id: string;
  name: string;
  params: string;
  sizeGB: number;
  vramNeeded: number;
  speed: string;
  quality: string;
  pullCommand: string;
  recommended?: boolean;
}

const OLLAMA_MODELS: OllamaModel[] = OLLAMA_LOCAL_MODELS.flatMap(model => model.ollama ? [{
  id: model.ollama, name: model.label, params: model.params,
  sizeGB: model.downloadGB ?? 0, vramNeeded: model.memoryGB ?? 0,
  speed: "Hardware-dependent", quality: model.kind === "vision" ? "Text + images" : "Text",
  pullCommand: `ollama pull ${model.ollama}`,
}] : []);

function getModelsForGPU(gpu: GPUProfile): OllamaModel[] {
  return OLLAMA_MODELS.map((m) => ({
    ...m,
    recommended: m.vramNeeded <= gpu.vram_gb && m.vramNeeded >= gpu.vram_gb * 0.5,
  }));
}

function getVramVerdict(model: OllamaModel, gpu: GPUProfile): { label: string; color: string } {
  if (gpu.vendor === "cpu") return { label: "CPU mode", color: "text-[hsl(var(--forge-amber))]" };
  if (model.vramNeeded <= gpu.vram_gb * 0.7) return { label: "Comfortable", color: "text-[hsl(var(--forge-emerald))]" };
  if (model.vramNeeded <= gpu.vram_gb) return { label: "Tight fit", color: "text-[hsl(var(--forge-amber))]" };
  return { label: "Won't fit", color: "text-[hsl(var(--forge-rose))]" };
}

// ─── Component ───────────────────────────────────────────────
interface GPUSetupWizardProps {
  onGPUSelected?: (gpu: GPUProfile) => void;
  onModelSelected?: (model: OllamaModel) => void;
}

export default function GPUSetupWizard({ onGPUSelected, onModelSelected }: GPUSetupWizardProps) {
  const [selectedGPU, setSelectedGPU] = useState<string>("rx580-win");
  const [selectedModel, setSelectedModel] = useState<string>("llama3.2:3b");
  const [detecting, setDetecting] = useState(false);
  const [detectedName, setDetectedName] = useState<string | null>(null);

  const gpu = GPU_PROFILES.find((g) => g.id === selectedGPU) ?? GPU_PROFILES[0];
  const models = getModelsForGPU(gpu);
  const model = models.find((m) => m.id === selectedModel) || models[0];
  const verdict = getVramVerdict(model, gpu);

  const handleGPUChange = (id: string) => {
    setSelectedGPU(id);
    const g = GPU_PROFILES.find((p) => p.id === id);
    if (!g) return;
    onGPUSelected?.(g);
    const best = getModelsForGPU(g).filter((m) => m.recommended);
    if (best.length > 0) {
      const pick = best[best.length - 1];
      setSelectedModel(pick.id);
      onModelSelected?.(pick);
    }
  };

  const handleModelChange = (id: string) => {
    setSelectedModel(id);
    const m = models.find((x) => x.id === id);
    if (m) onModelSelected?.(m);
  };

  // WebGPU detection
  const detectGPU = useCallback(async () => {
    setDetecting(true);
    try {
      if (!("gpu" in navigator)) {
        toast.error("WebGPU not supported in this browser. Try Chrome 113+ or Edge 113+.");
        return;
      }
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (!adapter) {
        toast.error("No GPU adapter found. Your browser may be blocking GPU access.");
        return;
      }
      const info = await adapter.requestAdapterInfo?.() ?? (adapter as any).info;
      const desc = (info?.description || info?.device || "").toLowerCase();
      const vendor = (info?.vendor || "").toLowerCase();
      const fullName = info?.description || info?.device || "Unknown GPU";
      setDetectedName(fullName);

      // Match against known profiles
      const isWindows = typeof navigator !== "undefined" && /win/i.test(navigator.platform || navigator.userAgent || "");
      const match = GPU_PROFILES.find((p) => {
        if (desc.includes("rx 580") || desc.includes("rx580") || desc.includes("polaris")) {
          return p.id === (isWindows ? "rx580-win" : "rx580");
        }
        if (desc.includes("rx 6600") || desc.includes("rx6600") || desc.includes("navi 23")) return p.id === "rx6600";
        if (desc.includes("7900") || desc.includes("navi 31")) return p.id === "rx7900xtx";
        if (desc.includes("3060") || desc.includes("ga106")) return p.id === "rtx3060";
        if (desc.includes("4090") || desc.includes("ad102")) return p.id === "rtx4090";
        return false;
      });

      if (match) {
        handleGPUChange(match.id);
        toast.success(`Detected: ${fullName} → matched to ${match.name}`);
      } else if (vendor.includes("amd") || vendor.includes("ati") || desc.includes("radeon")) {
        const fallback = isWindows ? "rx580-win" : "rx580";
        handleGPUChange(fallback);
        toast.info(`Detected AMD GPU: ${fullName}. Defaulted to ${isWindows ? "Windows/Vulkan" : "Linux/ROCm"} profile — adjust if needed.`);
      } else if (vendor.includes("nvidia") || desc.includes("geforce") || desc.includes("rtx") || desc.includes("gtx")) {
        handleGPUChange("rtx3060");
        toast.info(`Detected NVIDIA GPU: ${fullName}. Defaulted to RTX 3060 profile — adjust if needed.`);
      } else {
        toast.info(`Detected: ${fullName}. Couldn't match a profile — please select manually.`);
      }
    } catch (e: any) {
      toast.error(e.message || "GPU detection failed");
    } finally {
      setDetecting(false);
    }
  }, [onGPUSelected, onModelSelected]);

  const setupScript = [
    ...gpu.setupCommands,
    "",
    `# Pull your model`,
    model.pullCommand,
    "",
    `# Test it`,
    `ollama run ${model.id} "Hello, what can you do?"`,
  ].join("\n");

  const copySetup = () => {
    navigator.clipboard.writeText(setupScript);
    toast.success("Setup commands copied!");
  };

  return (
    <div className="space-y-4">
      {/* Detect + GPU Selector */}
      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 h-9"
          onClick={detectGPU}
          disabled={detecting}
        >
          {detecting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Search className="h-3.5 w-3.5 mr-1.5" />}
          {detecting ? "Detecting…" : "Detect My GPU"}
        </Button>
        {detectedName && (
          <span className="text-[10px] text-muted-foreground truncate">
            Found: <span className="font-semibold text-foreground">{detectedName}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
            Your GPU
          </label>
          <Select value={selectedGPU} onValueChange={handleGPUChange}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GPU_PROFILES.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  <div className="flex items-center gap-2">
                    {g.vendor === "nvidia" && <Zap className="h-3 w-3 text-[hsl(var(--forge-emerald))]" />}
                    {g.vendor === "amd" && <Monitor className="h-3 w-3 text-[hsl(var(--forge-rose))]" />}
                    {g.vendor === "cpu" && <Cpu className="h-3 w-3 text-muted-foreground" />}
                    {g.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
            Model to Pull
          </label>
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => {
                const v = getVramVerdict(m, gpu);
                return (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <span>{m.name}</span>
                      <span className="text-[10px] text-muted-foreground">({m.sizeGB}GB)</span>
                      {m.recommended && <Badge variant="outline" className="text-[8px] h-4">Best fit</Badge>}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* GPU + Model Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Backend</div>
          <div className="text-sm font-bold flex items-center gap-1.5">
            {gpu.backend}
            {gpu.vendor === "amd" && <Badge variant="outline" className="text-[8px] h-4 border-[hsl(var(--forge-rose))]/40 text-[hsl(var(--forge-rose))]">AMD</Badge>}
            {gpu.vendor === "nvidia" && <Badge variant="outline" className="text-[8px] h-4 border-[hsl(var(--forge-emerald))]/40 text-[hsl(var(--forge-emerald))]">NVIDIA</Badge>}
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">VRAM Usage</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{model.vramNeeded}GB / {gpu.vram_gb || "∞"}GB</span>
              <span className={cn("text-[10px] font-semibold", verdict.color)}>{verdict.label}</span>
            </div>
            {gpu.vram_gb > 0 && (
              <Progress value={Math.min(100, (model.vramNeeded / gpu.vram_gb) * 100)} className="h-1.5" />
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Est. Speed</div>
          <div className="text-sm font-bold">{model.speed}</div>
          <div className="text-[10px] text-muted-foreground">{model.quality}</div>
        </div>
      </div>

      {/* AMD-specific notes */}
      {gpu.vendor === "amd" && Object.keys(gpu.envVars).length > 0 && (
        <div className="rounded-lg border border-[hsl(var(--forge-rose))]/20 bg-[hsl(var(--forge-rose))]/5 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--forge-rose))]" />
            <span className="text-[10px] font-semibold text-[hsl(var(--forge-rose))] uppercase tracking-wider">AMD Config Required</span>
          </div>
          <p className="text-xs text-foreground/80 mb-2">{gpu.notes}</p>
          <div className="space-y-1">
            {Object.entries(gpu.envVars).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-xs font-mono">
                <code className="bg-secondary/50 px-1.5 py-0.5 rounded text-[11px]">
                  export {k}={v}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Script */}
      <div className="relative rounded-lg border border-border/60 bg-secondary/30 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 bg-secondary/50">
          <span className="text-[10px] font-mono text-muted-foreground">Quick Setup — {gpu.name}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copySetup}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        <pre className="p-3 text-xs font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap">
          {setupScript}
        </pre>
      </div>

      {/* Docker flags for kit integration */}
      {gpu.dockerFlags.length > 0 && (
        <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Docker GPU Flags</div>
          <code className="text-[11px] font-mono text-foreground/80 break-all">
            docker run {gpu.dockerFlags.join(" ")} ollama/ollama:{gpu.ollamaTag}
          </code>
        </div>
      )}
    </div>
  );
}

export { GPU_PROFILES, OLLAMA_MODELS, getModelsForGPU, getVramVerdict };
