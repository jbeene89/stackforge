import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useDatasets, useSamples, exportDatasetAsJsonl, generateInjectionScript, type DatasetSample } from "@/hooks/useTrainingData";
import { useDeployStatus, DEPLOY_STEPS, type DeployStepKey } from "@/hooks/useDeployStatus";
import { onDeviceSLMTemplates } from "@/data/on-device-slm-templates";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Rocket,
  Download,
  Package,
  Smartphone,
  Terminal,
  CheckCircle2,
  ArrowRight,
  Cpu,
  HardDrive,
  FileText,
  Copy,
  ChevronDown,
  ChevronUp,
  Layers,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

// ─── Training Script Generator ───────────────────────────────
function generateTrainScript(
  datasetName: string,
  baseModel: string,
  epochs: number,
  loraRank: number,
  lr: number
): string {
  const slug = datasetName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `#!/usr/bin/env python3
"""
SoupyForge Training Kit — ${datasetName}
Auto-generated. Double-click to run (or: python train.py)
"""
import os, sys, json, subprocess

# ── Config ────────────────────────────────────────────────────
DATASET     = "dataset.jsonl"
BASE_MODEL  = "${baseModel}"
OUTPUT_DIR  = "output-${slug}"
EPOCHS      = ${epochs}
LORA_RANK   = ${loraRank}
LR          = ${lr}
BATCH_SIZE  = 4

def check_deps():
    """Install deps if missing."""
    try:
        import torch, peft, transformers, datasets
    except ImportError:
        print("Installing dependencies (one-time)...")
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "--quiet",
            "torch", "transformers", "peft", "datasets", "accelerate", "bitsandbytes"
        ])

def detect_hardware():
    """Auto-detect GPU vs CPU."""
    try:
        import torch
        if torch.cuda.is_available():
            name = torch.cuda.get_device_name(0)
            print(f"GPU detected: {name}")
            return "cuda"
    except Exception:
        pass
    print("No GPU detected — training on CPU (slower but works!)")
    return "cpu"

def main():
    check_deps()
    device = detect_hardware()

    from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
    from peft import LoraConfig, get_peft_model, TaskType
    from datasets import load_dataset

    print(f"\\nLoading {BASE_MODEL}...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    load_kwargs = {}
    if device == "cuda":
        load_kwargs["device_map"] = "auto"
        load_kwargs["load_in_8bit"] = True

    model = AutoModelForCausalLM.from_pretrained(BASE_MODEL, trust_remote_code=True, **load_kwargs)

    lora = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=LORA_RANK,
        lora_alpha=LORA_RANK * 2,
        lora_dropout=0.05,
        target_modules=["q_proj", "v_proj"],
    )
    model = get_peft_model(model, lora)
    model.print_trainable_parameters()

    print(f"Loading dataset from {DATASET}...")
    ds = load_dataset("json", data_files=DATASET, split="train")

    def tokenize(example):
        msgs = example["messages"]
        text = ""
        for m in msgs:
            text += f"<|{m['role']}|>\\n{m['content']}\\n"
        out = tokenizer(text, truncation=True, max_length=2048, padding="max_length")
        out["labels"] = out["input_ids"].copy()
        return out

    ds = ds.map(tokenize, remove_columns=ds.column_names)

    args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        learning_rate=LR,
        logging_steps=10,
        save_strategy="epoch",
        fp16=(device == "cuda"),
        report_to="none",
    )

    from transformers import Trainer
    trainer = Trainer(model=model, args=args, train_dataset=ds, tokenizer=tokenizer)

    print(f"\\nTraining for {EPOCHS} epochs...")
    trainer.train()

    print(f"\\nSaving merged model to {OUTPUT_DIR}/merged...")
    merged = model.merge_and_unload()
    merged.save_pretrained(f"{OUTPUT_DIR}/merged")
    tokenizer.save_pretrained(f"{OUTPUT_DIR}/merged")

    print(f"\\nDone! Merged model saved to {OUTPUT_DIR}/merged/")
    print(f"Next step: Convert to GGUF with llama.cpp")

if __name__ == "__main__":
    main()
`;
}

function generateConvertScript(datasetName: string): string {
  const slug = datasetName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `#!/usr/bin/env bash
# SoupyForge GGUF Conversion Script
# Converts merged model to phone-ready GGUF format
# Requires: llama.cpp (git clone https://github.com/ggerganov/llama.cpp)

set -e

MODEL_DIR="output-${slug}/merged"
LLAMA_CPP_DIR="./llama.cpp"
OUTPUT_GGUF="${slug}.Q4_K_M.gguf"

echo "=== SoupyForge GGUF Converter ==="

# Check llama.cpp
if [ ! -d "$LLAMA_CPP_DIR" ]; then
  echo "Cloning llama.cpp..."
  git clone https://github.com/ggerganov/llama.cpp
fi

# Convert to GGUF
echo "Converting to GGUF..."
python3 "$LLAMA_CPP_DIR/convert_hf_to_gguf.py" "$MODEL_DIR" --outfile "${slug}.f16.gguf"

# Quantize to Q4_K_M (phone-friendly)
echo "Quantizing to Q4_K_M..."
"$LLAMA_CPP_DIR/build/bin/llama-quantize" "${slug}.f16.gguf" "$OUTPUT_GGUF" Q4_K_M

# Cleanup
rm -f "${slug}.f16.gguf"

echo ""
echo "Done! Phone-ready model: $OUTPUT_GGUF"
echo "Transfer this file to your phone and load it in:"
echo "  - iOS: LM Studio / MLC Chat"  
echo "  - Android: MLC Chat / Ollama (Termux)"
`;
}

// ─── ZIP Bundle Generator ────────────────────────────────────
async function downloadTrainingKit(
  samples: DatasetSample[],
  datasetName: string,
  baseModel: string,
  epochs: number,
  loraRank: number,
  lr: number,
  fullOffline: boolean = false,
  systemPrompt?: string,
  templateSlug?: string
) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const slug = datasetName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // dataset.jsonl
  const approved = samples.filter((s) => s.status === "approved");
  const lines = approved.map((s) => {
    let content = "";
    if (s.builder || s.red_team || s.systems || s.frame_breaker || s.empath || s.synthesis) {
      content = [
        s.builder ? `<BUILDER>${s.builder}</BUILDER>` : "",
        s.red_team ? `<RED_TEAM>${s.red_team}</RED_TEAM>` : "",
        s.systems ? `<SYSTEMS>${s.systems}</SYSTEMS>` : "",
        s.frame_breaker ? `<FRAME_BREAKER>${s.frame_breaker}</FRAME_BREAKER>` : "",
        s.empath ? `<EMPATH>${s.empath}</EMPATH>` : "",
        s.synthesis ? `<SYNTHESIS>${s.synthesis}</SYNTHESIS>` : "",
      ].filter(Boolean).join("\n\n");
    } else {
      content = s.output;
    }
    return JSON.stringify({ messages: [{ role: "user", content: s.input }, { role: "assistant", content }] });
  });
  zip.file("dataset.jsonl", lines.join("\n"));

  // train.py
  zip.file("train.py", generateTrainScript(datasetName, baseModel, epochs, loraRank, lr));

  // convert.sh
  zip.file("convert.sh", generateConvertScript(datasetName));

  if (fullOffline) {
    // config.json — full manifest
    const config = {
      project: "SoupyForge Offline Bundle",
      generated: new Date().toISOString(),
      dataset: { name: datasetName, slug, samples: approved.length, format: "instruction" },
      training: { base_model: baseModel, method: "lora", epochs, lora_rank: loraRank, learning_rate: lr, max_seq_length: 1024 },
      template: templateSlug || null,
      system_prompt: systemPrompt || null,
      special_tokens: ["<BUILDER>", "</BUILDER>", "<RED_TEAM>", "</RED_TEAM>", "<SYSTEMS>", "</SYSTEMS>", "<FRAME_BREAKER>", "</FRAME_BREAKER>", "<EMPATH>", "</EMPATH>", "<SYNTHESIS>", "</SYNTHESIS>"],
      output: { gguf_quantization: "Q4_K_M", estimated_size_mb: "400-800" },
      popcorn_injection: {
        enabled: true,
        perspectives: ["builder", "red_team", "systems", "frame_breaker", "empath", "synthesis", "debate", "gap_fill", "anti_pattern"],
        bias_presets: {
          even_heat: { builder: 1, red_team: 1, systems: 1, frame_breaker: 1, empath: 1, synthesis: 1, debate: 1, gap_fill: 1, anti_pattern: 1 },
          novelty_seeker: { builder: 1, red_team: 0, systems: 0, frame_breaker: 3, empath: 1, synthesis: 1, debate: 1, gap_fill: 2, anti_pattern: 0 },
          paranoid_builder: { builder: 2, red_team: 3, systems: 1, frame_breaker: 0, empath: 0, synthesis: 1, debate: 2, gap_fill: 1, anti_pattern: 1 },
          deep_empathy: { builder: 0, red_team: 0, systems: 1, frame_breaker: 1, empath: 3, synthesis: 2, debate: 0, gap_fill: 1, anti_pattern: 0 },
        },
      },
    };
    zip.file("config.json", JSON.stringify(config, null, 2));

    // system-prompt.txt
    if (systemPrompt) {
      zip.file("system-prompt.txt", systemPrompt);
    }

    // Modelfile for Ollama
    const modelfile = `# SoupyForge — ${datasetName}
# Import this with: ollama create ${slug} -f Modelfile
FROM ./${slug}.Q4_K_M.gguf
${systemPrompt ? `\nSYSTEM """${systemPrompt}"""` : ""}

PARAMETER temperature 0.4
PARAMETER top_p 0.9
PARAMETER num_ctx 1024
PARAMETER stop "<|user|>"
PARAMETER stop "<|assistant|>"
`;
    zip.file("Modelfile", modelfile);

    // inference.py — standalone local inference
    const inferencePy = `#!/usr/bin/env python3
"""
SoupyForge Offline Inference — ${datasetName}
Runs your trained GGUF model locally. No internet needed.

Install: pip install llama-cpp-python
Usage:   python inference.py
"""
import sys, os

MODEL_PATH = "./${slug}.Q4_K_M.gguf"
SYSTEM_PROMPT = ${systemPrompt ? `"""${systemPrompt.replace(/"/g, '\\"')}"""` : '""'}

def main():
    try:
        from llama_cpp import Llama
    except ImportError:
        print("Installing llama-cpp-python (one-time)...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "llama-cpp-python"])
        from llama_cpp import Llama

    if not os.path.exists(MODEL_PATH):
        print(f"Model not found: {MODEL_PATH}")
        print(f"Place your trained GGUF file here and rename it to {os.path.basename(MODEL_PATH)}")
        sys.exit(1)

    print(f"Loading {MODEL_PATH}...")
    llm = Llama(model_path=MODEL_PATH, n_ctx=1024, n_gpu_layers=0)
    print("Model loaded! Type your input (Ctrl+C to quit)\\n")

    while True:
        try:
            user_input = input("You: ").strip()
            if not user_input:
                continue

            messages = []
            if SYSTEM_PROMPT:
                messages.append({"role": "system", "content": SYSTEM_PROMPT})
            messages.append({"role": "user", "content": user_input})

            response = llm.create_chat_completion(
                messages=messages,
                max_tokens=512,
                temperature=0.4,
                top_p=0.9,
            )
            answer = response["choices"][0]["message"]["content"]
            print(f"\\nAssistant: {answer}\\n")

        except KeyboardInterrupt:
            print("\\nGoodbye!")
            break

if __name__ == "__main__":
    main()
`;
    zip.file("inference.py", inferencePy);

    // batch_inference.py — process a file of inputs
    const batchPy = `#!/usr/bin/env python3
"""
SoupyForge Batch Inference — Process multiple inputs offline.
Usage: python batch_inference.py inputs.txt > outputs.jsonl
"""
import sys, json, os

MODEL_PATH = "./${slug}.Q4_K_M.gguf"
SYSTEM_PROMPT = ${systemPrompt ? `"""${systemPrompt.replace(/"/g, '\\"')}"""` : '""'}

def main():
    from llama_cpp import Llama

    input_file = sys.argv[1] if len(sys.argv) > 1 else "inputs.txt"
    if not os.path.exists(input_file):
        print(f"Create {input_file} with one input per line, then re-run.")
        sys.exit(1)

    llm = Llama(model_path=MODEL_PATH, n_ctx=1024, n_gpu_layers=0, verbose=False)
    
    with open(input_file, "r", encoding="utf-8") as f:
        inputs = [line.strip() for line in f if line.strip()]

    print(f"Processing {len(inputs)} inputs...", file=sys.stderr)

    for i, inp in enumerate(inputs, 1):
        messages = []
        if SYSTEM_PROMPT:
            messages.append({"role": "system", "content": SYSTEM_PROMPT})
        messages.append({"role": "user", "content": inp})

        resp = llm.create_chat_completion(messages=messages, max_tokens=512, temperature=0.4)
        output = resp["choices"][0]["message"]["content"]
        print(json.dumps({"input": inp, "output": output}))
        print(f"  [{i}/{len(inputs)}] done", file=sys.stderr)

if __name__ == "__main__":
    main()
`;
    zip.file("batch_inference.py", batchPy);

    // Popcorn Injection Kit — bias heat presets included
    const defaultWeights = { builder: 1, red_team: 1, systems: 1, frame_breaker: 1, empath: 1, synthesis: 1, debate: 1, gap_fill: 1, anti_pattern: 1 };
    const allPerspectives = Object.keys(defaultWeights);
    const domain = templateSlug || "general";
    const injScript = generateInjectionScript(
      ["roots", "trunk", "canopy"], 1.5, allPerspectives,
      baseModel, "llama3.2:1b", domain, defaultWeights
    );
    zip.file("inject.py", injScript);
    zip.file("injection_config.json", JSON.stringify({
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
        roots: { start: 0, end: 6, focus: "embedding, tokenization, conceptual anchors" },
        trunk: { start: 7, end: 24, focus: "knowledge, associations, domain expertise" },
        canopy: { start: 25, end: 31, focus: "output formatting, reasoning, voice" },
      },
    }, null, 2));
    zip.file("POPCORN_README.md",
      `# CDPT Popcorn Injection - Bias Heat Edition\n\n` +
      `## Zero data. Zero cloud. Pure expansion.\n\n` +
      `The base model is a bag of popcorn. Its knowledge = kernels. CDPT perspectives = heat.\n` +
      `Bias heat lets you crank specific perspectives to shape the model's cognitive profile.\n\n` +
      `## Quick Start\n\n` +
      `\`\`\`bash\n` +
      `# Default even heat (all perspectives at 1x)\n` +
      `python3 inject.py\n\n` +
      `# Then train on the output\n` +
      `# The generated popcorn_dataset.jsonl goes into your training pipeline\n` +
      `\`\`\`\n\n` +
      `## Bias Presets\n\n` +
      `Edit \`injection_config.json\` to apply a preset:\n\n` +
      `| Preset | Style | Key Weights |\n` +
      `|--------|-------|-------------|\n` +
      `| Even Heat | Balanced expansion | All at 1x |\n` +
      `| Novelty Seeker | Creative/divergent | Frame Breaker 3x, Gap Fill 2x |\n` +
      `| Paranoid Builder | Security-focused | Red Team 3x, Builder 2x, Debate 2x |\n` +
      `| Deep Empathy | Human-centered | Empath 3x, Synthesis 2x |\n\n` +
      `## Custom Bias\n\n` +
      `Set any perspective weight from 0 (off) to 3 (triple heat) in \`injection_config.json\`.\n` +
      `Weight > 1 runs that perspective multiple times per round with increasing temperature.\n\n` +
      `## How It Works\n\n` +
      `1. Each perspective is a "burner" that pops the model's stock knowledge\n` +
      `2. Weight = how many times that burner fires per round\n` +
      `3. Multiple passes on the same perspective go deeper each time\n` +
      `4. Output is CDPT-enriched JSONL ready for LoRA training\n` +
      `5. No internet, no API keys, no data upload — ever\n`
    );

    zip.file(
      "README.md",
      `# ${datasetName} — Full Offline Bundle

Generated by SoupyForge · ${new Date().toISOString()}

## What's Inside

| File | Purpose |
|------|---------|
| \`dataset.jsonl\` | ${approved.length} curated training samples |
| \`train.py\` | Auto-detecting training script (GPU/CPU) |
| \`convert.sh\` | GGUF conversion + Q4_K_M quantization |
| \`config.json\` | Full training manifest & metadata |
${systemPrompt ? `| \`system-prompt.txt\` | Pre-configured system prompt |\n` : ""}| \`Modelfile\` | Ollama model import file |
| \`inference.py\` | Interactive local chat (llama-cpp-python) |
| \`batch_inference.py\` | Process file of inputs → JSONL output |

## Quick Start (Complete Offline Flow)

\`\`\`bash
# 1. Train
python train.py

# 2. Convert to GGUF
bash convert.sh

# 3. Test locally
python inference.py

# 4. Batch process
echo "What is machine learning?" > inputs.txt
python batch_inference.py inputs.txt > outputs.jsonl

# 5. Deploy to phone
#    iOS:     AirDrop the .gguf → LM Studio
#    Android: ollama create ${slug} -f Modelfile
\`\`\`

## Configuration

- **Base model:** ${baseModel}
- **Method:** LoRA (rank ${loraRank})
- **Epochs:** ${epochs}
- **Learning rate:** ${lr}
- **Samples:** ${approved.length}
- **Quantization:** Q4_K_M (~400-800MB)

## No Internet Required After Export

Once you have this bundle, everything runs 100% offline:
- Training → your computer
- Inference → your computer or phone
- No API calls, no cloud, no data leaves your machine.
`
    );
  } else {
    // Simple README for training kit only
    zip.file(
      "README.md",
      `# ${datasetName} — Training Kit\n\nGenerated by SoupyForge.\n\n## Quick Start\n\n1. **Install Python 3.10+**\n2. **Run:** \`python train.py\`\n3. **Convert to GGUF:** \`bash convert.sh\`\n4. **Deploy:** Transfer the .gguf file to your phone\n\n## Contents\n\n- \`dataset.jsonl\` — ${approved.length} curated training samples\n- \`train.py\` — Auto-detecting training script (GPU/CPU)\n- \`convert.sh\` — GGUF conversion + quantization\n- \`README.md\` — This file\n\n## Configuration\n\n- Base model: ${baseModel}\n- Epochs: ${epochs}\n- LoRA rank: ${loraRank}\n- Learning rate: ${lr}\n- Samples: ${approved.length}\n`
    );
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}-${fullOffline ? "offline-bundle" : "training-kit"}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Code Block Component ────────────────────────────────────
function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="relative group rounded-lg border border-border/60 bg-secondary/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 bg-secondary/50">
        <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => {
            navigator.clipboard.writeText(code);
            toast.success("Copied!");
          }}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <pre className="p-3 text-xs font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}

// ─── Step Card ───────────────────────────────────────────────
function StepCard({
  step,
  title,
  description,
  icon: Icon,
  active,
  completed,
  onToggleComplete,
  children,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
  active: boolean;
  completed: boolean;
  onToggleComplete?: () => void;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(active);

  return (
    <Card
      className={`transition-all ${
        active
          ? "border-[hsl(var(--forge-cyan))]/50 shadow-[0_0_15px_hsl(var(--forge-cyan)/0.1)]"
          : completed
          ? "border-[hsl(var(--forge-emerald))]/30 opacity-90"
          : "opacity-60"
      }`}
    >
      <CardHeader
        className="cursor-pointer pb-2"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              completed
                ? "bg-[hsl(var(--forge-emerald))]/15 text-[hsl(var(--forge-emerald))]"
                : active
                ? "gradient-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {completed ? <CheckCircle2 className="h-4 w-4" /> : step}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {title}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {description}
            </CardDescription>
          </div>
          {onToggleComplete && active && (
            <Button
              variant={completed ? "outline" : "default"}
              size="sm"
              className="text-[10px] h-7 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete();
              }}
            >
              {completed ? "Undo" : "Mark Done"}
            </Button>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {expanded && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function DeployPipelinePage() {
  const [searchParams] = useSearchParams();
  const { data: datasets, isLoading } = useDatasets();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");

  // Pre-select dataset from URL query param
  useEffect(() => {
    const paramId = searchParams.get("dataset");
    if (paramId && !selectedDatasetId && datasets?.some((d) => d.id === paramId)) {
      setSelectedDatasetId(paramId);
    }
  }, [searchParams, datasets, selectedDatasetId]);
  const [baseModel, setBaseModel] = useState("meta-llama/Llama-3.2-1B-Instruct");
  const [epochs, setEpochs] = useState(3);
  const [loraRank, setLoraRank] = useState(16);
  const [lr] = useState(0.0002);
  const [downloading, setDownloading] = useState(false);

  const selectedDataset = datasets?.find((d) => d.id === selectedDatasetId);
  const { data: samples } = useSamples(selectedDatasetId);
  const { isStepCompleted, completedCount, totalSteps, toggleStep } = useDeployStatus(
    selectedDatasetId || undefined
  );

  const approvedCount = useMemo(
    () => samples?.filter((s) => s.status === "approved").length ?? 0,
    [samples]
  );

  const matchedTemplate = useMemo(() => {
    if (!selectedDataset) return null;
    return onDeviceSLMTemplates.find((t) =>
      selectedDataset.domain === t.slug ||
      selectedDataset.name.toLowerCase().includes(t.slug)
    );
  }, [selectedDataset]);

  const readiness = useMemo(() => {
    if (!selectedDataset) return 0;
    const minSamples = matchedTemplate?.minSamples ?? 50;
    return Math.min(100, Math.round((approvedCount / minSamples) * 100));
  }, [approvedCount, matchedTemplate, selectedDataset]);

  const handleDownloadKit = async (fullOffline: boolean = false) => {
    if (!samples || !selectedDataset) return;
    setDownloading(true);
    try {
      await downloadTrainingKit(
        samples, selectedDataset.name, baseModel, epochs, loraRank, lr,
        fullOffline,
        matchedTemplate?.systemPrompt,
        matchedTemplate?.slug
      );
      toast.success(fullOffline ? "Full offline bundle downloaded!" : "Training kit downloaded!");
    } catch (e: any) {
      toast.error(e.message);
    }
    setDownloading(false);
  };

  const handleExportJsonl = () => {
    if (!samples || !selectedDataset) return;
    exportDatasetAsJsonl(samples, selectedDataset.name);
    toast.success("JSONL exported!");
  };

  const handleToggleStep = (stepKey: DeployStepKey) => {
    toggleStep.mutate({
      stepKey,
      completed: !isStepCompleted(stepKey),
      metadata: stepKey === "export" ? { base_model: baseModel, epochs, lora_rank: loraRank } : {},
    });
  };

  const currentStep = !selectedDatasetId ? 0 : readiness < 100 ? 1 : 2;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Rocket className="h-6 w-6 text-[hsl(var(--forge-cyan))]" />
          <h1 className="text-2xl font-bold font-display">Deploy Pipeline</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Export → Train → Convert → Deploy to Phone — one connected flow.
        </p>
      </div>

      {/* Overall Progress */}
      {selectedDatasetId && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Pipeline Progress</span>
              <span className="text-xs font-bold text-[hsl(var(--forge-cyan))]">
                {completedCount}/{totalSteps} steps
              </span>
            </div>
            <Progress value={(completedCount / totalSteps) * 100} className="h-2" />
            {completedCount === totalSteps && (
              <p className="text-[10px] text-[hsl(var(--forge-emerald))] mt-2 font-semibold">
                🎉 Pipeline complete — your SLM is deployed and running on-device!
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dataset Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 min-w-0">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Select Dataset
              </label>
              <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoading ? "Loading…" : "Pick a dataset to deploy"} />
                </SelectTrigger>
                <SelectContent>
                  {datasets?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.sample_count} samples)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedDataset && (
              <div className="flex flex-col items-end gap-1">
                <Badge variant="outline" className="text-[10px]">
                  {selectedDataset.domain}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {approvedCount} approved samples
                </span>
              </div>
            )}
          </div>

          {selectedDataset && (
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Dataset readiness
                  {matchedTemplate && ` (min: ${matchedTemplate.minSamples})`}
                </span>
                <span
                  className={`font-semibold ${
                    readiness >= 100
                      ? "text-[hsl(var(--forge-emerald))]"
                      : readiness >= 60
                      ? "text-[hsl(var(--forge-amber))]"
                      : "text-[hsl(var(--forge-rose))]"
                  }`}
                >
                  {readiness}%
                </span>
              </div>
              <Progress value={readiness} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Steps */}
      <div className="space-y-3">
        {/* Step 1: Export */}
        <StepCard
          step={1}
          title="Export Training Kit"
          description="Download everything you need to train offline"
          icon={Package}
          active={currentStep >= 1}
          completed={isStepCompleted("export")}
          onToggleComplete={() => handleToggleStep("export")}
        >
          <div className="space-y-4 pt-2">
            {/* Config */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                  Base Model
                </label>
                <Select value={baseModel} onValueChange={setBaseModel}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meta-llama/Llama-3.2-1B-Instruct">
                      Llama 3.2 1B
                    </SelectItem>
                    <SelectItem value="Qwen/Qwen2.5-0.5B-Instruct">
                      Qwen 2.5 0.5B
                    </SelectItem>
                    <SelectItem value="Qwen/Qwen2.5-1.5B-Instruct">
                      Qwen 2.5 1.5B
                    </SelectItem>
                    <SelectItem value="microsoft/Phi-3-mini-4k-instruct">
                      Phi-3 Mini
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                  Epochs
                </label>
                <Select value={String(epochs)} onValueChange={(v) => setEpochs(Number(v))}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 5, 8].map((e) => (
                      <SelectItem key={e} value={String(e)}>
                        {e} epochs
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                  LoRA Rank
                </label>
                <Select value={String(loraRank)} onValueChange={(v) => setLoraRank(Number(v))}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[8, 16, 32, 64].map((r) => (
                      <SelectItem key={r} value={String(r)}>
                        r={r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Kit contents preview */}
            <div className="rounded-lg border border-border/40 bg-secondary/20 p-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Kit Contains
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-[hsl(var(--forge-cyan))]" />
                  <span>dataset.jsonl ({approvedCount} samples)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Terminal className="h-3 w-3 text-[hsl(var(--forge-emerald))]" />
                  <span>train.py (auto-detecting)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Terminal className="h-3 w-3 text-[hsl(var(--forge-amber))]" />
                  <span>convert.sh (GGUF export)</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span>README.md</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => handleDownloadKit(true)}
                disabled={!selectedDatasetId || approvedCount === 0 || downloading}
                className="flex-1"
              >
                <Package className="h-4 w-4 mr-1" />
                {downloading ? "Bundling…" : "Full Offline Bundle (.zip)"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDownloadKit(false)}
                disabled={!selectedDatasetId || approvedCount === 0 || downloading}
              >
                <Download className="h-4 w-4 mr-1" />
                Training Kit
              </Button>
              <Button
                variant="outline"
                onClick={handleExportJsonl}
                disabled={!selectedDatasetId || approvedCount === 0}
              >
                <FileText className="h-4 w-4 mr-1" />
                JSONL Only
              </Button>
            </div>

            {/* Offline bundle contents */}
            <div className="rounded-lg border border-[hsl(var(--forge-emerald))]/20 bg-[hsl(var(--forge-emerald))]/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--forge-emerald))] font-semibold mb-1.5">
                🔌 Full Offline Bundle Includes
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-foreground/80">
                <span>✓ dataset.jsonl</span>
                <span>✓ train.py</span>
                <span>✓ convert.sh</span>
                <span>✓ config.json</span>
                <span>✓ inference.py</span>
                <span>✓ batch_inference.py</span>
                <span>✓ Modelfile (Ollama)</span>
                {matchedTemplate?.systemPrompt && <span>✓ system-prompt.txt</span>}
              </div>
            </div>
          </div>
        </StepCard>

        {/* Step 2: Train */}
        <StepCard
          step={2}
          title="Train on Your Computer"
          description="Run the training script offline — GPU or CPU"
          icon={Cpu}
          active={currentStep >= 1}
          completed={isStepCompleted("train")}
          onToggleComplete={() => handleToggleStep("train")}
        >
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">
              Unzip the training kit, open a terminal, and run:
            </p>
            <CodeBlock
              label="Terminal"
              code={`cd ${selectedDataset?.name.toLowerCase().replace(/\\s+/g, "-") ?? "training-kit"}\npython train.py`}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className="h-3.5 w-3.5 text-[hsl(var(--forge-emerald))]" />
                  <span className="text-xs font-semibold">With GPU</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  ~15-30 min on RTX 3060+. Auto-detected, uses 8-bit quantized loading + LoRA.
                </p>
              </div>
              <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Cpu className="h-3.5 w-3.5 text-[hsl(var(--forge-amber))]" />
                  <span className="text-xs font-semibold">CPU Only</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  ~2.5-3 hrs for 165 samples. Works on any modern laptop. ~154s/step.
                </p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground italic">
              Output: <code className="bg-secondary/50 px-1 rounded">output-*/merged/</code> — a
              full HuggingFace model ready for GGUF conversion.
            </p>
          </div>
        </StepCard>

        {/* Step 3: Convert */}
        <StepCard
          step={3}
          title="Convert to GGUF"
          description="Quantize to phone-friendly format"
          icon={HardDrive}
          active={currentStep >= 1}
          completed={isStepCompleted("convert")}
          onToggleComplete={() => handleToggleStep("convert")}
        >
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">
              The training kit includes <code className="bg-secondary/50 px-1 rounded">convert.sh</code> —
              it clones llama.cpp and quantizes to Q4_K_M automatically:
            </p>
            <CodeBlock label="Terminal" code="bash convert.sh" />

            <Tabs defaultValue="auto" className="mt-2">
              <TabsList className="h-8">
                <TabsTrigger value="auto" className="text-xs h-6">
                  Auto (included)
                </TabsTrigger>
                <TabsTrigger value="manual" className="text-xs h-6">
                  Manual Steps
                </TabsTrigger>
              </TabsList>
              <TabsContent value="auto">
                <p className="text-xs text-muted-foreground">
                  The script handles everything: clone llama.cpp → convert HF → quantize Q4_K_M →
                  cleanup. Output: a single <code>.gguf</code> file (~400MB–1.2GB).
                </p>
              </TabsContent>
              <TabsContent value="manual">
                <div className="space-y-2">
                  <CodeBlock
                    label="1. Clone llama.cpp"
                    code="git clone https://github.com/ggerganov/llama.cpp\ncd llama.cpp && make"
                  />
                  <CodeBlock
                    label="2. Convert to GGUF"
                    code="python3 convert_hf_to_gguf.py ../output-*/merged/ --outfile model.f16.gguf"
                  />
                  <CodeBlock
                    label="3. Quantize"
                    code="./build/bin/llama-quantize model.f16.gguf model.Q4_K_M.gguf Q4_K_M"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </StepCard>

        {/* Step 4: Deploy */}
        <StepCard
          step={4}
          title="Deploy to Phone"
          description="Get your model running on iOS or Android"
          icon={Smartphone}
          active={currentStep >= 1}
          completed={isStepCompleted("deploy")}
          onToggleComplete={() => handleToggleStep("deploy")}
        >
          <div className="space-y-4 pt-2">
            <Tabs defaultValue="ios">
              <TabsList className="h-8">
                <TabsTrigger value="ios" className="text-xs h-6">
                  iOS
                </TabsTrigger>
                <TabsTrigger value="android" className="text-xs h-6">
                  Android
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ios" className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Badge className="shrink-0 text-[10px]">Option A</Badge>
                    <div>
                      <p className="text-xs font-semibold">LM Studio (Recommended)</p>
                      <ol className="text-[11px] text-muted-foreground space-y-1 mt-1 list-decimal list-inside">
                        <li>Install <strong>LM Studio</strong> from the App Store</li>
                        <li>AirDrop or iCloud Drive the <code>.gguf</code> file to your iPhone</li>
                        <li>Open in LM Studio → Import Model</li>
                        <li>Chat interface ready — processes captures locally</li>
                      </ol>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      Option B
                    </Badge>
                    <div>
                      <p className="text-xs font-semibold">MLC Chat</p>
                      <ol className="text-[11px] text-muted-foreground space-y-1 mt-1 list-decimal list-inside">
                        <li>Install <strong>MLC Chat</strong> from the App Store</li>
                        <li>Transfer .gguf via Files app</li>
                        <li>Add as custom model in MLC settings</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="android" className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Badge className="shrink-0 text-[10px]">Option A</Badge>
                    <div>
                      <p className="text-xs font-semibold">MLC Chat (Recommended)</p>
                      <ol className="text-[11px] text-muted-foreground space-y-1 mt-1 list-decimal list-inside">
                        <li>Install <strong>MLC Chat</strong> from Play Store</li>
                        <li>Transfer .gguf to phone via USB / cloud storage</li>
                        <li>Import model in MLC Chat settings</li>
                        <li>Chat interface ready</li>
                      </ol>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      Option B
                    </Badge>
                    <div>
                      <p className="text-xs font-semibold">Ollama via Termux</p>
                      <ol className="text-[11px] text-muted-foreground space-y-1 mt-1 list-decimal list-inside">
                        <li>Install <strong>Termux</strong> from F-Droid</li>
                        <li>
                          Run:{" "}
                          <code className="bg-secondary/50 px-1 rounded">
                            pkg install ollama
                          </code>
                        </li>
                        <li>
                          Create Modelfile:{" "}
                          <code className="bg-secondary/50 px-1 rounded">
                            FROM ./model.gguf
                          </code>
                        </li>
                        <li>
                          <code className="bg-secondary/50 px-1 rounded">
                            ollama create mymodel -f Modelfile
                          </code>
                        </li>
                        <li>
                          <code className="bg-secondary/50 px-1 rounded">
                            ollama run mymodel
                          </code>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Phone specs */}
            <div className="rounded-lg border border-[hsl(var(--forge-cyan))]/20 bg-[hsl(var(--forge-cyan))]/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--forge-cyan))] font-semibold mb-1.5">
                📱 Minimum Phone Specs
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-foreground/80">
                <div>
                  <strong>RAM:</strong> 6GB+ (8GB recommended)
                </div>
                <div>
                  <strong>Storage:</strong> 1-2GB free per model
                </div>
                <div>
                  <strong>iOS:</strong> iPhone 12+ (A14 chip)
                </div>
                <div>
                  <strong>Android:</strong> Snapdragon 8 Gen 1+
                </div>
              </div>
            </div>
          </div>
        </StepCard>

        {/* Step 5: Run */}
        <StepCard
          step={5}
          title="Run — Process Captures Locally"
          description="Your SLM now processes mobile captures on-device"
          icon={Zap}
          active={currentStep >= 1}
          completed={isStepCompleted("run")}
          onToggleComplete={() => handleToggleStep("run")}
        >
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">
              Once deployed, your on-device SLM can process captures from the SoupyForge Capture
              page. The flow:
            </p>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {[
                "📸 Capture",
                "→",
                "🤖 On-Device SLM",
                "→",
                "📋 Structured Output",
                "→",
                "📤 Sync to Cloud",
              ].map((label, i) => (
                <span
                  key={i}
                  className={
                    label === "→"
                      ? "text-muted-foreground"
                      : "px-2 py-1 rounded-md bg-secondary/50 border border-border/40 font-medium"
                  }
                >
                  {label}
                </span>
              ))}
            </div>

            {matchedTemplate && (
              <div className="rounded-lg border border-[hsl(var(--forge-emerald))]/20 bg-[hsl(var(--forge-emerald))]/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--forge-emerald))] font-semibold mb-1">
                  {matchedTemplate.icon} {matchedTemplate.name} — On-Device
                </p>
                <p className="text-xs text-foreground/80">
                  {matchedTemplate.onDeviceCapability}
                </p>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground italic">
              ✨ Zero internet. Zero latency. 100% private. Your data never leaves your phone.
            </p>
          </div>
        </StepCard>
      </div>
    </div>
  );
}
