import { useState, useMemo, useCallback, useEffect } from "react";
import { triggerDownload } from "@/lib/downloadHelper";
import { DownloadFallbackDialog } from "@/components/DownloadFallbackDialog";
import { SEOHead } from "@/components/SEOHead";
import { useSearchParams } from "react-router-dom";
import { generateInjectionScript } from "@/hooks/useTrainingData";
import { useDatasets } from "@/hooks/useTrainingData";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IndependenceScorecard } from "@/components/IndependenceScorecard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Server,
  Package,
  HardDrive,
  Cpu,
  Database,
  Brain,
  Shield,
  Download,
  Copy,
  CheckCircle2,
  ChevronRight,
  Box,
  Layers,
  Terminal,
  Zap,
  Globe,
  Lock,
  Smartphone,
  FileCode,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useProjects } from "@/hooks/useSupabaseData";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";

// ─── Types ──────────────────────────────────────────────────
interface PackageComponent {
  id: string;
  label: string;
  description: string;
  icon: typeof Server;
  color: string;
  category: "core" | "ai" | "data" | "tools";
  required?: boolean;
  ramMb: number;
  diskMb: number;
  defaultEnabled: boolean;
  dockerImage?: string;
  port?: number;
}

interface PackageConfig {
  projectName: string;
  hostPort: number;
  gpuEnabled: boolean;
  components: Record<string, boolean>;
  ollamaModel: string;
  dataExport: boolean;
  httpsEnabled: boolean;
}

// ─── Component catalog ──────────────────────────────────────
const COMPONENTS: PackageComponent[] = [
  {
    id: "ollama",
    label: "Ollama Inference Server",
    description: "Local LLM inference engine — runs your GGUF models",
    icon: Brain,
    color: "var(--forge-cyan)",
    category: "core",
    required: true,
    ramMb: 512,
    diskMb: 200,
    defaultEnabled: true,
    dockerImage: "ollama/ollama:latest",
    port: 11434,
  },
  {
    id: "webui",
    label: "Open WebUI",
    description: "Chat interface for interacting with your models",
    icon: Globe,
    color: "var(--forge-emerald)",
    category: "core",
    ramMb: 256,
    diskMb: 150,
    defaultEnabled: true,
    dockerImage: "ghcr.io/open-webui/open-webui:main",
    port: 3000,
  },
  {
    id: "pipeline",
    label: "CDPT Pipeline Runner",
    description: "Runs the cognitive perspective pipeline offline via Python script",
    icon: Layers,
    color: "var(--forge-violet)",
    category: "ai",
    ramMb: 384,
    diskMb: 100,
    defaultEnabled: true,
  },
  {
    id: "training",
    label: "Training Environment",
    description: "LoRA fine-tuning with auto hardware detection (GPU/CPU)",
    icon: Zap,
    color: "var(--forge-gold)",
    category: "ai",
    ramMb: 2048,
    diskMb: 4000,
    defaultEnabled: false,
  },
  {
    id: "postgres",
    label: "Local Database",
    description: "PostgreSQL for dataset storage and job tracking",
    icon: Database,
    color: "var(--forge-amber)",
    category: "data",
    ramMb: 128,
    diskMb: 100,
    defaultEnabled: false,
    dockerImage: "postgres:16-alpine",
    port: 5432,
  },
  {
    id: "datasets",
    label: "Dataset Export",
    description: "Export all your training datasets, samples, and cognitive fingerprints",
    icon: HardDrive,
    color: "var(--forge-rose)",
    category: "data",
    ramMb: 0,
    diskMb: 0,
    defaultEnabled: true,
  },
  {
    id: "converter",
    label: "GGUF Converter",
    description: "Convert merged models to GGUF format for mobile deployment",
    icon: Box,
    color: "var(--forge-cyan)",
    category: "tools",
    ramMb: 512,
    diskMb: 500,
    defaultEnabled: false,
  },
  {
    id: "api",
    label: "REST API Gateway",
    description: "OpenAI-compatible API endpoint for external app integration",
    icon: Terminal,
    color: "var(--forge-emerald)",
    category: "tools",
    ramMb: 64,
    diskMb: 20,
    defaultEnabled: false,
    port: 8080,
  },
];

const CATEGORIES = [
  { key: "core", label: "Core Services", icon: Server },
  { key: "ai", label: "AI Pipeline", icon: Brain },
  { key: "data", label: "Data & Storage", icon: Database },
  { key: "tools", label: "Tools", icon: Package },
];

const PRESET_MODELS = [
  "llama3.2:1b",
  "llama3.2:3b",
  "qwen2.5:0.5b",
  "qwen2.5:1.5b",
  "phi3.5:latest",
  "gemma2:2b",
  "tinyllama:latest",
  "custom",
];

// ─── Generators ─────────────────────────────────────────────
function generateDockerCompose(config: PackageConfig, components: PackageComponent[]): string {
  const enabled = components.filter((c) => config.components[c.id]);
  let yaml = `# ${config.projectName} — Self-Hosted AI Factory\n`;
  yaml += `# Generated by Soupy Self-Host Package Generator\n`;
  yaml += `# Run: docker compose up -d\n\n`;
  yaml += `version: "3.9"\n\nservices:\n`;

  for (const comp of enabled) {
    if (!comp.dockerImage) continue;

    yaml += `\n  ${comp.id}:\n`;
    yaml += `    image: ${comp.dockerImage}\n`;
    yaml += `    container_name: ${config.projectName}-${comp.id}\n`;
    yaml += `    restart: unless-stopped\n`;

    if (comp.port) {
      const hostPort = comp.id === "webui" ? config.hostPort : comp.port;
      yaml += `    ports:\n      - "${hostPort}:${comp.port}"\n`;
    }

    if (comp.id === "ollama") {
      yaml += `    volumes:\n      - ollama_data:/root/.ollama\n`;
      if (config.gpuEnabled) {
        yaml += `    deploy:\n      resources:\n        reservations:\n          devices:\n            - driver: nvidia\n              count: all\n              capabilities: [gpu]\n`;
      }
    }

    if (comp.id === "webui") {
      yaml += `    volumes:\n      - webui_data:/app/backend/data\n`;
      yaml += `    environment:\n`;
      yaml += `      - OLLAMA_BASE_URL=http://ollama:11434\n`;
      yaml += `    depends_on:\n      - ollama\n`;
    }

    if (comp.id === "postgres") {
      yaml += `    volumes:\n      - pg_data:/var/lib/postgresql/data\n`;
      yaml += `    environment:\n`;
      yaml += `      - POSTGRES_USER=${config.projectName}\n`;
      yaml += `      - POSTGRES_PASSWORD=changeme\n`;
      yaml += `      - POSTGRES_DB=${config.projectName}\n`;
    }
  }

  // Volumes
  const volumeNames: string[] = [];
  if (config.components.ollama) volumeNames.push("ollama_data");
  if (config.components.webui) volumeNames.push("webui_data");
  if (config.components.postgres) volumeNames.push("pg_data");

  if (volumeNames.length > 0) {
    yaml += `\nvolumes:\n`;
    volumeNames.forEach((v) => { yaml += `  ${v}:\n`; });
  }

  return yaml;
}

function generateStartScript(config: PackageConfig): string {
  let script = `#!/bin/bash\n`;
  script += `# ${config.projectName} — Startup Script\n`;
  script += `# Generated by Soupy Self-Host Package Generator\n\n`;
  script += `set -e\n\n`;
  script += `echo "=== Starting ${config.projectName} AI Factory ==="\n`;
  script += `echo ""\n\n`;

  script += `# Check Docker\n`;
  script += `if ! command -v docker &> /dev/null; then\n`;
  script += `  echo "ERROR: Docker is not installed. Install it from https://docker.com"\n`;
  script += `  exit 1\n`;
  script += `fi\n\n`;

  script += `# Pull images and start\n`;
  script += `docker compose pull\n`;
  script += `docker compose up -d\n\n`;

  if (config.components.ollama && config.ollamaModel !== "custom") {
    script += `# Pull the default model\n`;
    script += `echo "Downloading model: ${config.ollamaModel}..."\n`;
    script += `docker exec ${config.projectName}-ollama ollama pull ${config.ollamaModel}\n\n`;
  }

  script += `echo ""\n`;
  script += `echo "=== ${config.projectName} is ready! ==="\n`;
  if (config.components.webui) {
    script += `echo "Open http://localhost:${config.hostPort} in your browser"\n`;
  }
  script += `echo ""\n`;

  return script;
}

function generateReadme(config: PackageConfig, components: PackageComponent[]): string {
  const enabled = components.filter((c) => config.components[c.id]);
  let md = `# ${config.projectName} - Self-Hosted AI Factory\n\n`;
  md += `Your personal AI infrastructure, running 100% on your hardware.\n`;
  md += `No cloud. No API keys. No data leaves your machine.\n\n`;
  md += `## Quick Start\n\n`;
  md += `\`\`\`bash\nchmod +x start.sh\n./start.sh\n\`\`\`\n\n`;
  md += `Or manually:\n\n`;
  md += `\`\`\`bash\ndocker compose up -d\n\`\`\`\n\n`;

  md += `## What's Included\n\n`;
  md += `| Component | Description | Port |\n`;
  md += `|-----------|-------------|------|\n`;
  enabled.forEach((c) => {
    md += `| ${c.label} | ${c.description} | ${c.port || "N/A"} |\n`;
  });

  md += `\n## System Requirements\n\n`;
  const totalRam = enabled.reduce((s, c) => s + c.ramMb, 0);
  const totalDisk = enabled.reduce((s, c) => s + c.diskMb, 0);
  md += `- **RAM:** ${(totalRam / 1024).toFixed(1)} GB minimum\n`;
  md += `- **Disk:** ${(totalDisk / 1024).toFixed(1)} GB minimum (plus model files)\n`;
  md += `- **Docker:** v20.10+\n`;
  if (config.gpuEnabled) md += `- **GPU:** NVIDIA with CUDA drivers\n`;

  md += `\n## Popcorn Injection (Bias Heat)\n\n`;
  md += `Included in \`scripts/\` when CDPT Pipeline is enabled:\n\n`;
  md += `- \`inject.py\` — Two modes: Sealed Bag (stock knowledge) and Open Air (your data)\n`;
  md += `- \`injection_config.json\` — Perspective weights & 4 bias presets\n`;
  md += `- Sealed: \`python3 scripts/inject.py\`\n`;
  md += `- Open Air: \`python3 scripts/inject.py --mode open-air\` (reads from \`to-train/\`)\n\n`;

  md += `## Stopping\n\n`;
  md += `\`\`\`bash\ndocker compose down\n\`\`\`\n\n`;
  md += `## Data Persistence\n\n`;
  md += `All data is stored in Docker volumes. To backup:\n\n`;
  md += `\`\`\`bash\ndocker compose down\n`;
  md += `docker run --rm -v ollama_data:/data -v $(pwd):/backup alpine tar czf /backup/ollama-backup.tar.gz /data\n`;
  md += `\`\`\`\n\n`;
  md += `---\n*Generated by Soupy*\n`;

  return md;
}

function generateEnvFile(config: PackageConfig): string {
  let env = `# ${config.projectName} Environment Configuration\n\n`;
  env += `PROJECT_NAME=${config.projectName}\n`;
  env += `HOST_PORT=${config.hostPort}\n`;
  env += `GPU_ENABLED=${config.gpuEnabled}\n`;
  if (config.components.ollama) env += `OLLAMA_MODEL=${config.ollamaModel}\n`;
  if (config.components.postgres) {
    env += `POSTGRES_USER=${config.projectName}\n`;
    env += `POSTGRES_PASSWORD=changeme\n`;
    env += `POSTGRES_DB=${config.projectName}\n`;
  }
  return env;
}

// ─── Main Page ──────────────────────────────────────────────
export default function SelfHostPage() {
  const [searchParams] = useSearchParams();
  const { data: projects } = useProjects();
  const { data: datasets } = useDatasets();
  const [selectedSource, setSelectedSource] = useState<string>("none");

  const [config, setConfig] = useState<PackageConfig>({
    projectName: "my-ai-factory",
    hostPort: 3000,
    gpuEnabled: false,
    components: Object.fromEntries(COMPONENTS.map((c) => [c.id, c.defaultEnabled])),
    ollamaModel: "llama3.2:1b",
    dataExport: true,
    httpsEnabled: false,
  });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [datasetPreview, setDatasetPreview] = useState<{ count: number; rows: Array<{ input: string; output: string }> } | null>(null);
  const [fallbackDialog, setFallbackDialog] = useState<{ open: boolean; blobUrl: string | null; filename: string }>({ open: false, blobUrl: null, filename: "" });
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Fetch dataset preview when a dataset is selected
  useEffect(() => {
    if (!selectedSource.startsWith("dataset:")) {
      setDatasetPreview(null);
      return;
    }
    const datasetId = selectedSource.split(":")[1];
    setLoadingPreview(true);
    (async () => {
      const { count } = await supabase
        .from("dataset_samples")
        .select("*", { count: "exact", head: true })
        .eq("dataset_id", datasetId)
        .eq("status", "approved");
      const { data: rows } = await supabase
        .from("dataset_samples")
        .select("input, output")
        .eq("dataset_id", datasetId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(3);
      setDatasetPreview({ count: count ?? 0, rows: rows ?? [] });
      setLoadingPreview(false);
    })();
  }, [selectedSource]);

  // Auto-select project from URL params
  useEffect(() => {
    const projectId = searchParams.get("project");
    const projectName = searchParams.get("name");
    if (projectId && projectName) {
      setSelectedSource(`project:${projectId}`);
      setConfig((c) => ({ ...c, projectName: projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") }));
    }
  }, [searchParams]);

  const toggleComponent = (id: string) => {
    const comp = COMPONENTS.find((c) => c.id === id);
    if (comp?.required) return;
    setConfig((c) => ({
      ...c,
      components: { ...c.components, [id]: !c.components[id] },
    }));
  };

  const enabledComponents = useMemo(
    () => COMPONENTS.filter((c) => config.components[c.id]),
    [config.components]
  );

  const totals = useMemo(() => {
    const ram = enabledComponents.reduce((s, c) => s + c.ramMb, 0);
    const disk = enabledComponents.reduce((s, c) => s + c.diskMb, 0);
    return { ramMb: ram, diskMb: disk, count: enabledComponents.length };
  }, [enabledComponents]);

  // ── Generate & download ZIP ───────────────────────────────
  const generatePackage = useCallback(async () => {
    setGenerating(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(config.projectName)!;

      folder.file("docker-compose.yml", generateDockerCompose(config, COMPONENTS));
      folder.file("start.sh", generateStartScript(config));
      folder.file("README.md", generateReadme(config, COMPONENTS));
      folder.file(".env", generateEnvFile(config));

      // Pipeline script stub
      if (config.components.pipeline) {
        folder.file(
          "scripts/run_pipeline.sh",
          `#!/bin/bash\n# CDPT Cognitive Pipeline Runner\n` +
          `# Place your cognitive_pipeline_offline.py in this directory\n` +
          `# Usage: ./run_pipeline.sh input.jsonl output.jsonl\n\n` +
          `python3 cognitive_pipeline_offline.py \\\n` +
          `  --input "\${1:-input.jsonl}" \\\n` +
          `  --output "\${2:-output.jsonl}" \\\n` +
          `  --model "${config.ollamaModel}" \\\n` +
          `  --ollama-url "http://localhost:11434"\n`
        );
      }

      // Training script stub
      if (config.components.training) {
        folder.file(
          "scripts/train.sh",
          `#!/bin/bash\n# Training Environment Setup\n` +
          `# This script sets up a venv, scans to-train/ for .json and .jsonl files, and trains\n\n` +
          `set -e\n\n` +
          `if [ ! -d "venv" ]; then\n` +
          `  python3 -m venv venv\n` +
          `  source venv/bin/activate\n` +
          `  pip install torch transformers peft datasets\n` +
          `else\n` +
          `  source venv/bin/activate\n` +
          `fi\n\n` +
          `# Auto-discover all .json and .jsonl files in to-train/\n` +
          `DATA_DIR="\${1:-to-train}"\n` +
          `FILES=$(find "$DATA_DIR" -maxdepth 1 -type f \\( -name "*.json" -o -name "*.jsonl" \\) | sort)\n\n` +
          `if [ -z "$FILES" ]; then\n` +
          `  echo "No .json or .jsonl files found in $DATA_DIR/"\n` +
          `  echo "Drop your training data into the to-train/ folder and re-run."\n` +
          `  exit 1\n` +
          `fi\n\n` +
          `echo "Found training files:"\n` +
          `echo "$FILES" | while read f; do echo "  → $f ($(wc -l < \\"$f\\") lines)"; done\n` +
          `echo ""\n\n` +
          `python3 scripts/train.py --data-dir "$DATA_DIR" --model ${config.ollamaModel}\n`
        );

        // Full train.py that auto-loads all files from to-train/
        folder.file(
          "scripts/train.py",
          `#!/usr/bin/env python3\n` +
          `"""Auto-loader training script — scans to-train/ for .json and .jsonl files."""\n` +
          `import argparse, json, glob, os, sys\n\n` +
          `def load_file(path):\n` +
          `    """Load a single .json or .jsonl file into a list of records."""\n` +
          `    rows = []\n` +
          `    with open(path, "r", encoding="utf-8") as f:\n` +
          `        # Try JSONL first (one JSON object per line)\n` +
          `        first_line = f.readline().strip()\n` +
          `        f.seek(0)\n` +
          `        if first_line.startswith("{"):\n` +
          `            for line in f:\n` +
          `                line = line.strip()\n` +
          `                if not line:\n` +
          `                    continue\n` +
          `                try:\n` +
          `                    rows.append(json.loads(line))\n` +
          `                except json.JSONDecodeError:\n` +
          `                    rows.append({"text": line})\n` +
          `        else:\n` +
          `            # Try as a single JSON array/object\n` +
          `            f.seek(0)\n` +
          `            data = json.load(f)\n` +
          `            if isinstance(data, list):\n` +
          `                rows.extend(data)\n` +
          `            else:\n` +
          `                rows.append(data)\n` +
          `    return rows\n\n` +
          `def main():\n` +
          `    parser = argparse.ArgumentParser(description="Train on all data in a folder")\n` +
          `    parser.add_argument("--data-dir", default="to-train", help="Folder to scan for .json/.jsonl")\n` +
          `    parser.add_argument("--model", default="llama3.2:1b", help="Base model name")\n` +
          `    parser.add_argument("--output", default="merged_training_data.jsonl", help="Merged output file")\n` +
          `    args = parser.parse_args()\n\n` +
          `    files = sorted(glob.glob(os.path.join(args.data_dir, "*.json")) +\n` +
          `                    glob.glob(os.path.join(args.data_dir, "*.jsonl")))\n\n` +
          `    if not files:\n` +
          `        print(f"❌ No .json or .jsonl files found in {args.data_dir}/")\n` +
          `        sys.exit(1)\n\n` +
          `    all_rows = []\n` +
          `    for fp in files:\n` +
          `        rows = load_file(fp)\n` +
          `        print(f"  📄 {os.path.basename(fp)}: {len(rows)} records")\n` +
          `        all_rows.extend(rows)\n\n` +
          `    print(f"\\n📊 Total: {len(all_rows)} records from {len(files)} file(s)")\n\n` +
          `    # Write merged dataset\n` +
          `    merged_path = os.path.join(args.data_dir, args.output)\n` +
          `    with open(merged_path, "w", encoding="utf-8") as out:\n` +
          `        for row in all_rows:\n` +
          `            out.write(json.dumps(row, ensure_ascii=False) + "\\n")\n` +
          `    print(f"✅ Merged dataset written to {merged_path}")\n` +
          `    print(f"\\nReady for training with: {args.model}")\n` +
          `    print(f"  → {merged_path} ({len(all_rows)} rows)")\n\n` +
          `if __name__ == "__main__":\n` +
          `    main()\n`
        );
      }

      // GGUF converter stub
      if (config.components.converter) {
        folder.file(
          "scripts/convert_to_gguf.sh",
          `#!/bin/bash\n# GGUF Converter\n` +
          `# Converts a merged model directory to GGUF format\n\n` +
          `MODEL_DIR="\${1:?Usage: ./convert_to_gguf.sh <model_dir> [quant_type]}\"\n` +
          `QUANT="\${2:-Q4_K_M}"\n\n` +
          `if [ ! -d "llama.cpp" ]; then\n` +
          `  git clone https://github.com/ggerganov/llama.cpp\n` +
          `  cd llama.cpp && make -j && cd ..\n` +
          `fi\n\n` +
          `python3 llama.cpp/convert_hf_to_gguf.py "$MODEL_DIR" --outfile model-f16.gguf\n` +
          `./llama.cpp/build/bin/llama-quantize model-f16.gguf "model-$QUANT.gguf" "$QUANT"\n\n` +
          `echo "Done! Output: model-$QUANT.gguf"\n`
        );
      }

      // Popcorn Injection — bias heat support
      if (config.components.pipeline) {
        const defaultWeights: Record<string, number> = { builder: 1, red_team: 1, systems: 1, frame_breaker: 1, empath: 1, synthesis: 1, debate: 1, gap_fill: 1, anti_pattern: 1 };
        const allPerspectives = Object.keys(defaultWeights);
        const injScript = generateInjectionScript(
          ["roots", "trunk", "canopy"], 1.5, allPerspectives,
          "meta-llama/Llama-3.2-1B-Instruct", config.ollamaModel, "general", defaultWeights
        );
        folder.file("scripts/inject.py", injScript);
        folder.file("scripts/injection_config.json", JSON.stringify({
          zones: ["roots", "trunk", "canopy"],
          intensity: 1.5,
          perspectives: allPerspectives,
          perspective_weights: defaultWeights,
          bias_presets: {
            even_heat: defaultWeights,
            novelty_seeker: { builder: 1, red_team: 0, systems: 0, frame_breaker: 3, empath: 1, synthesis: 1, debate: 1, gap_fill: 2, anti_pattern: 0 },
            paranoid_builder: { builder: 2, red_team: 3, systems: 1, frame_breaker: 0, empath: 0, synthesis: 1, debate: 2, gap_fill: 1, anti_pattern: 1 },
            deep_empathy: { builder: 0, red_team: 0, systems: 1, frame_breaker: 1, empath: 3, synthesis: 2, debate: 0, gap_fill: 1, anti_pattern: 0 },
          },
          layer_mapping: {
            roots: { start: 0, end: 6 },
            trunk: { start: 7, end: 24 },
            canopy: { start: 25, end: 31 },
          },
        }, null, 2));
        folder.file("scripts/POPCORN_README.md",
          `# Popcorn Injection - Bias Heat\n\n` +
          `Two modes: **Sealed Bag** (stock knowledge) and **Open Air** (your data).\n\n` +
          `## Sealed Bag (default)\n\n` +
          `Densify your model using its own knowledge. Zero data needed.\n\n` +
          `\`\`\`bash\npython3 scripts/inject.py\n# or explicitly:\npython3 scripts/inject.py --mode sealed\n\`\`\`\n\n` +
          `## 🍿 Open Air Popcorn\n\n` +
          `Throw YOUR data on the fire. Drop .json/.jsonl into \`to-train/\` and run:\n\n` +
          `\`\`\`bash\npython3 scripts/inject.py --mode open-air\n# custom seed folder:\npython3 scripts/inject.py --mode open-air --seed-dir my-data/\n\`\`\`\n\n` +
          `Each record gets expanded through every CDPT perspective burner.\n` +
          `DPO pairs, messages, plain text — all supported.\n\n` +
          `## Bias Presets\n\n` +
          `Edit \`scripts/injection_config.json\` to change weights (0-3x per perspective).\n` +
          `See presets: even_heat, novelty_seeker, paranoid_builder, deep_empathy.\n\n` +
          `## How It Works\n\n` +
          `Each CDPT perspective is a burner. Weight > 1x = multiple passes.\n` +
          `Output: \`injection_output/popcorn_dataset.jsonl\` (sealed) or \`open_air_dataset.jsonl\` (open air)\n`
        );
      }

      // ── Bundle dataset JSONL if a dataset is selected ──────────
      if (selectedSource.startsWith("dataset:")) {
        const datasetId = selectedSource.split(":")[1];
        const dataset = datasets?.find((d) => d.id === datasetId);
        const { data: samples } = await supabase
          .from("dataset_samples")
          .select("*")
          .eq("dataset_id", datasetId)
          .eq("status", "approved");

        if (samples && samples.length > 0) {
          const lines = samples.map((s) => {
            let assistantContent = "";
            if (s.builder || s.red_team || s.systems || s.frame_breaker || s.empath || s.synthesis) {
              assistantContent = [
                s.builder ? `<BUILDER>${s.builder}</BUILDER>` : "",
                s.red_team ? `<RED_TEAM>${s.red_team}</RED_TEAM>` : "",
                s.systems ? `<SYSTEMS>${s.systems}</SYSTEMS>` : "",
                s.frame_breaker ? `<FRAME_BREAKER>${s.frame_breaker}</FRAME_BREAKER>` : "",
                s.empath ? `<EMPATH>${s.empath}</EMPATH>` : "",
                s.synthesis ? `<SYNTHESIS>${s.synthesis}</SYNTHESIS>` : "",
              ].filter(Boolean).join("\n\n");
            } else {
              assistantContent = s.output;
            }
            return JSON.stringify({
              messages: [
                { role: "user", content: s.input },
                { role: "assistant", content: assistantContent },
              ],
            });
          });

          const datasetSlug = (dataset?.name || "dataset").toLowerCase().replace(/\s+/g, "-");
          folder.file(`to-train/${datasetSlug}.jsonl`, lines.join("\n"));
          folder.file(`to-train/README.md`,
            `# TO TRAIN\n\n` +
            `Drop any \`.json\` or \`.jsonl\` files into this folder.\n` +
            `The training script automatically discovers and merges everything here.\n\n` +
            `## Bundled Dataset: ${dataset?.name || "Unknown"}\n\n` +
            `- **Samples**: ${samples.length} approved pairs\n` +
            `- **Domain**: ${dataset?.domain || "general"}\n` +
            `- **Format**: JSONL (messages format)\n\n` +
            `## Supported Formats\n\n` +
            `| Format | Example |\n` +
            `|--------|---------|\n` +
            `| DPO pairs | \`{"prompt":"...","chosen":"...","rejected":"..."}\` |\n` +
            `| Messages | \`{"messages":[{"role":"user","content":"..."},...]}\` |\n` +
            `| Plain text | \`{"text":"..."}\` |\n` +
            `| JSON array | \`[{"input":"...","output":"..."},  ...]\` |\n\n` +
            `## Usage\n\n` +
            `\`\`\`bash\n` +
            `# Train on everything in to-train/\n` +
            `./scripts/train.sh\n\n` +
            `# Or run directly\n` +
            `python3 scripts/train.py --data-dir to-train/ --model ${config.ollamaModel}\n` +
            `\`\`\`\n`
          );
          toast.info(`Bundled ${samples.length} approved samples from "${dataset?.name}"`);
        } else {
          toast.warning("No approved samples found in this dataset — package generated without data.");
        }
      }

      // Always ensure data/ folder exists with a README even without a bundled dataset
      if (!selectedSource.startsWith("dataset:") || !(await supabase.from("dataset_samples").select("id", { count: "exact", head: true }).eq("dataset_id", selectedSource.split(":")[1] || "").eq("status", "approved")).count) {
        // Only add if data/README.md wasn't already added above
        if (!selectedSource.startsWith("dataset:")) {
          folder.file(`to-train/.gitkeep`, "");
          folder.file(`to-train/README.md`,
            `# TO TRAIN\n\n` +
            `Drop any \`.json\` or \`.jsonl\` files into this folder.\n` +
            `The training script automatically discovers and merges everything here.\n\n` +
            `## Supported Formats\n\n` +
            `| Format | Example |\n` +
            `|--------|---------|\n` +
            `| DPO pairs | \`{"prompt":"...","chosen":"...","rejected":"..."}\` |\n` +
            `| Messages | \`{"messages":[{"role":"user","content":"..."},...]}\` |\n` +
            `| Plain text | \`{"text":"..."}\` |\n` +
            `| JSON array | \`[{"input":"...","output":"..."},  ...]\` |\n\n` +
            `## Usage\n\n` +
            `\`\`\`bash\n` +
            `# Train on everything in to-train/\n` +
            `./scripts/train.sh\n\n` +
            `# Or run directly\n` +
            `python3 scripts/train.py --data-dir to-train/ --model ${config.ollamaModel}\n` +
            `\`\`\`\n`
          );
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const filename = `${config.projectName}.zip`;
      const blobUrl = triggerDownload(blob, filename);
      setFallbackDialog({ open: true, blobUrl, filename });

      setGenerated(true);
      toast.success("Package generated and downloading!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate package");
    } finally {
      setGenerating(false);
    }
  }, [config, selectedSource, datasets]);

  const copyDockerCompose = () => {
    navigator.clipboard.writeText(generateDockerCompose(config, COMPONENTS));
    toast.success("Docker Compose copied!");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SEOHead
        title="Self-Host — Run Your AI Stack Locally"
        description="Generate a complete Docker Compose package to self-host your AI stack. Ollama, PostgreSQL, monitoring — one click, runs on your hardware."
        ogTitle="Self-Host Your AI — Docker Compose in One Click"
        ogDescription="Generate a ready-to-run Docker Compose package with Ollama, PostgreSQL, and monitoring. Own your AI infrastructure."
        canonicalPath="/self-host"
      />
      {/* Hero */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Server className="h-6 w-6 text-[hsl(var(--forge-cyan))]" />
          <h1 className="text-2xl font-bold font-display">Self-Host Package</h1>
          <Badge variant="outline" className="text-[9px] h-4 gap-1">
            <Lock className="h-2.5 w-2.5" /> Independence
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Generate a complete self-hosted AI factory. Pick your components, configure your setup,
          and download a ready-to-run Docker package — zero cloud dependencies.
        </p>
      </div>

      {/* Independence Scorecard */}
      <IndependenceScorecard />

      {/* Independence banner */}
      <div className="rounded-xl border border-[hsl(var(--forge-emerald))]/20 bg-gradient-to-r from-[hsl(var(--forge-emerald))]/[0.04] to-[hsl(var(--forge-cyan))]/[0.04] p-4 flex items-center gap-4">
        <Shield className="h-8 w-8 text-[hsl(var(--forge-emerald))] shrink-0" />
        <div>
          <p className="text-sm font-semibold">100% Yours. 100% Private. Zero Lock-in.</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Everything runs on your hardware. Your data, models, and pipeline never leave your machine.
            Cancel anytime and keep everything.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: Config */}
        <div className="space-y-6">
          {/* Project settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCode className="h-4 w-4 text-[hsl(var(--forge-cyan))]" />
                Project Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Project Name
                  </label>
                  <Input
                    value={config.projectName}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, projectName: e.target.value.replace(/[^a-z0-9-]/g, "") }))
                    }
                    className="h-8 text-xs font-mono"
                    placeholder="my-ai-factory"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Default Model
                  </label>
                  <Select
                    value={config.ollamaModel}
                    onValueChange={(v) => setConfig((c) => ({ ...c, ollamaModel: v }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_MODELS.map((m) => (
                        <SelectItem key={m} value={m} className="text-xs font-mono">
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Web UI Port
                  </label>
                  <Input
                    type="number"
                    value={config.hostPort}
                    onChange={(e) => setConfig((c) => ({ ...c, hostPort: Number(e.target.value) }))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold">GPU Acceleration</p>
                    <p className="text-[10px] text-muted-foreground">NVIDIA CUDA support</p>
                  </div>
                  <Switch
                    checked={config.gpuEnabled}
                    onCheckedChange={(v) => setConfig((c) => ({ ...c, gpuEnabled: v }))}
                  />
                </div>
              </div>

              {/* Project / Dataset Picker */}
              <Separator />
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Bundle Your AI (Project or Dataset)
                </label>
                <p className="text-[10px] text-muted-foreground">
                  Include one of your projects or trained datasets in the self-host package instead of a generic setup.
                </p>
                <Select
                  value={selectedSource}
                  onValueChange={(v) => {
                    setSelectedSource(v);
                    // Auto-set project name from selection
                    if (v !== "none") {
                      const [type, id] = v.split(":");
                      if (type === "project") {
                        const proj = projects?.find((p) => p.id === id);
                        if (proj) setConfig((c) => ({ ...c, projectName: proj.name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") }));
                      } else if (type === "dataset") {
                        const ds = datasets?.find((d) => d.id === id);
                        if (ds) setConfig((c) => ({ ...c, projectName: ds.name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") }));
                      }
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="None — generic package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">None — generic package</SelectItem>
                    {(projects?.length ?? 0) > 0 && (
                      <>
                        <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Projects</div>
                        {projects?.map((p) => (
                          <SelectItem key={`project:${p.id}`} value={`project:${p.id}`} className="text-xs">
                            📁 {p.name} <span className="text-muted-foreground ml-1">({p.type})</span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {(datasets?.length ?? 0) > 0 && (
                      <>
                        <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Datasets</div>
                        {datasets?.map((d) => (
                          <SelectItem key={`dataset:${d.id}`} value={`dataset:${d.id}`} className="text-xs">
                            🧠 {d.name} <span className="text-muted-foreground ml-1">({d.sample_count} samples)</span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {selectedSource !== "none" && (
                  <p className="text-[10px] text-[hsl(var(--forge-emerald))]">
                    ✓ Your {selectedSource.startsWith("project") ? "project" : "dataset"} config will be bundled into the package
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Component picker */}
          {CATEGORIES.map((cat) => {
            const catComponents = COMPONENTS.filter((c) => c.category === cat.key);
            const CatIcon = cat.icon;
            return (
              <div key={cat.key} className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CatIcon className="h-3.5 w-3.5" /> {cat.label}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catComponents.map((comp) => {
                    const Icon = comp.icon;
                    const enabled = config.components[comp.id];
                    return (
                      <motion.div key={comp.id} layout>
                        <Card
                          className={cn(
                            "cursor-pointer transition-all",
                            enabled
                              ? "border-[hsl(var(--forge-cyan))]/30 shadow-[0_0_10px_hsl(var(--forge-cyan)/0.05)]"
                              : "opacity-60 hover:opacity-80",
                            comp.required && "cursor-default"
                          )}
                          onClick={() => toggleComponent(comp.id)}
                        >
                          <CardContent className="py-3">
                            <div className="flex items-start gap-3">
                              <div
                                className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                                style={{
                                  background: `hsl(${comp.color} / ${enabled ? 0.12 : 0.05})`,
                                  border: `1px solid hsl(${comp.color} / ${enabled ? 0.3 : 0.1})`,
                                }}
                              >
                                <Icon
                                  className="h-4 w-4"
                                  style={{ color: `hsl(${comp.color})` }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-semibold">{comp.label}</p>
                                  {comp.required && (
                                    <Badge variant="outline" className="text-[8px] h-3.5">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                                  {comp.description}
                                </p>
                                <div className="flex gap-3 mt-1.5 text-[9px] text-muted-foreground">
                                  {comp.ramMb > 0 && (
                                    <span className="flex items-center gap-0.5">
                                      <Cpu className="h-2.5 w-2.5" />
                                      {comp.ramMb >= 1024
                                        ? `${(comp.ramMb / 1024).toFixed(1)} GB`
                                        : `${comp.ramMb} MB`} RAM
                                    </span>
                                  )}
                                  {comp.diskMb > 0 && (
                                    <span className="flex items-center gap-0.5">
                                      <HardDrive className="h-2.5 w-2.5" />
                                      {comp.diskMb >= 1024
                                        ? `${(comp.diskMb / 1024).toFixed(1)} GB`
                                        : `${comp.diskMb} MB`}
                                    </span>
                                  )}
                                  {comp.port && (
                                    <span className="font-mono">:{comp.port}</span>
                                  )}
                                </div>
                              </div>
                              <Switch
                                checked={enabled}
                                disabled={comp.required}
                                onCheckedChange={() => toggleComponent(comp.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Summary & Generate */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-[hsl(var(--forge-cyan))]" />
                Package Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Counts */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-secondary/30 p-2">
                  <p className="text-lg font-bold font-mono">{totals.count}</p>
                  <p className="text-[9px] text-muted-foreground">Components</p>
                </div>
                <div className="rounded-lg bg-secondary/30 p-2">
                  <p className="text-lg font-bold font-mono">
                    {totals.ramMb >= 1024
                      ? `${(totals.ramMb / 1024).toFixed(1)}`
                      : totals.ramMb}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {totals.ramMb >= 1024 ? "GB RAM" : "MB RAM"}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/30 p-2">
                  <p className="text-lg font-bold font-mono">
                    {totals.diskMb >= 1024
                      ? `${(totals.diskMb / 1024).toFixed(1)}`
                      : totals.diskMb}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {totals.diskMb >= 1024 ? "GB Disk" : "MB Disk"}
                  </p>
                </div>
              </div>

              {/* Selected list */}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Included
                </p>
                {enabledComponents.map((c) => {
                  const Icon = c.icon;
                  return (
                    <div key={c.id} className="flex items-center gap-2 text-xs">
                      <CheckCircle2
                        className="h-3 w-3 shrink-0"
                        style={{ color: `hsl(${c.color})` }}
                      />
                      <span>{c.label}</span>
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* What you'll get */}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Package Contents
                </p>
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  <p className="flex items-center gap-1.5">
                    <ChevronRight className="h-2.5 w-2.5" /> docker-compose.yml
                  </p>
                  <p className="flex items-center gap-1.5">
                    <ChevronRight className="h-2.5 w-2.5" /> start.sh (one-click launcher)
                  </p>
                  <p className="flex items-center gap-1.5">
                    <ChevronRight className="h-2.5 w-2.5" /> .env (configuration)
                  </p>
                  <p className="flex items-center gap-1.5">
                    <ChevronRight className="h-2.5 w-2.5" /> README.md (full guide)
                  </p>
                  {config.components.pipeline && (
                    <p className="flex items-center gap-1.5">
                      <ChevronRight className="h-2.5 w-2.5" /> scripts/run_pipeline.sh
                    </p>
                  )}
                  {config.components.training && (
                    <p className="flex items-center gap-1.5">
                      <ChevronRight className="h-2.5 w-2.5" /> scripts/train.sh
                    </p>
                  )}
                  {config.components.converter && (
                    <p className="flex items-center gap-1.5">
                      <ChevronRight className="h-2.5 w-2.5" /> scripts/convert_to_gguf.sh
                    </p>
                  )}
                </div>
              </div>

              {/* Dataset preview */}
              {selectedSource.startsWith("dataset:") && (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Database className="h-3 w-3" /> Bundled Dataset
                    </p>
                    {loadingPreview ? (
                      <p className="text-[10px] text-muted-foreground animate-pulse">Loading preview…</p>
                    ) : datasetPreview ? (
                      <>
                        <p className="text-xs font-mono text-foreground">
                          {datasetPreview.count} <span className="text-muted-foreground font-sans">approved samples</span>
                        </p>
                        {datasetPreview.rows.length > 0 && (
                          <div className="space-y-1.5 mt-1">
                            {datasetPreview.rows.map((row, i) => (
                              <div key={i} className="rounded-md bg-secondary/40 p-1.5 text-[9px] space-y-0.5 overflow-hidden">
                                <p className="text-muted-foreground truncate">
                                  <span className="font-semibold text-foreground/70">Q:</span> {row.input.slice(0, 80)}{row.input.length > 80 ? "…" : ""}
                                </p>
                                <p className="text-muted-foreground truncate">
                                  <span className="font-semibold text-foreground/70">A:</span> {row.output.slice(0, 80)}{row.output.length > 80 ? "…" : ""}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                        {datasetPreview.count === 0 && (
                          <p className="text-[9px] text-[hsl(var(--forge-amber))]">No approved samples — approve some first to include them.</p>
                        )}
                      </>
                    ) : null}
                  </div>
                </>
              )}

              <Separator />

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  className="w-full gap-2"
                  onClick={generatePackage}
                  disabled={generating}
                >
                  {generating ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Generating...</>
                  ) : (
                    <><Download className="h-4 w-4" /> Generate & Download ZIP</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-[10px]"
                  onClick={copyDockerCompose}
                >
                  <Copy className="h-3 w-3" /> Copy Docker Compose
                </Button>
              </div>

              {generated && (
                <div className="rounded-lg bg-[hsl(var(--forge-emerald))]/5 border border-[hsl(var(--forge-emerald))]/20 p-2.5">
                  <p className="text-[10px] text-[hsl(var(--forge-emerald))] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Package ready!
                  </p>
                  <p className="text-[10px] text-foreground/60 mt-0.5">
                    Unzip, run <code className="px-1 rounded bg-secondary font-mono">./start.sh</code>, and you're live.
                  </p>
                </div>
              )}

              {/* Requirement note */}
              <div className="flex items-start gap-1.5 text-[9px] text-muted-foreground">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-[hsl(var(--forge-amber))]" />
                <span>
                  Requires Docker Desktop (Mac/Windows) or Docker Engine (Linux).
                  {config.gpuEnabled && " NVIDIA drivers + nvidia-container-toolkit needed for GPU."}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <DownloadFallbackDialog
        open={fallbackDialog.open}
        onOpenChange={(v) => setFallbackDialog(prev => ({ ...prev, open: v }))}
        blobUrl={fallbackDialog.blobUrl}
        filename={fallbackDialog.filename}
      />
    </div>
  );
}
