import { useState } from "react";
import { ExportToDialog } from "@/components/ExportToDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search, Star, ShoppingCart, CheckCircle2, X, Eye, Plus,
  Brain, Cpu, Zap, Download, ArrowRight, TrendingUp,
  ChevronRight, BarChart3, Box, Layers, Target, Gauge,
  ImageIcon, MessageSquare, Music, Video, FileText, Globe
} from "lucide-react";

interface MLModel {
  id: string;
  name: string;
  description: string;
  category: "vision" | "nlp" | "audio" | "multimodal" | "generative" | "reinforcement" | "tabular" | "timeseries";
  architecture: string;
  params: string;
  size: string;
  latency: string;
  accuracy: string;
  dataset: string;
  framework: string[];
  quantizations: string[];
  tags: string[];
  rating: number;
  downloads: number;
  license: string;
  useCases: string[];
  benchmarks: { name: string; score: string }[];
}

const modelCatalog: MLModel[] = [
  // Vision
  {
    id: "ml-01", name: "EfficientDet-D7", description: "State-of-the-art object detection with compound scaling. Achieves excellent accuracy/speed tradeoff using BiFPN feature fusion and weighted feature aggregation.",
    category: "vision", architecture: "EfficientNet + BiFPN", params: "52M", size: "208MB", latency: "52ms @ T4", accuracy: "55.1 mAP (COCO)", dataset: "COCO 2017",
    framework: ["PyTorch", "TensorFlow", "ONNX"], quantizations: ["FP32", "FP16", "INT8", "TFLite"],
    tags: ["detection", "real-time", "edge-ready"], rating: 4.8, downloads: 89200, license: "Apache 2.0",
    useCases: ["Autonomous driving perception", "Retail shelf scanning", "Security surveillance", "Drone object tracking"],
    benchmarks: [{ name: "COCO mAP@0.5", score: "72.4%" }, { name: "COCO mAP@0.75", score: "59.8%" }, { name: "Latency (T4)", score: "52ms" }]
  },
  {
    id: "ml-02", name: "DINOv2-ViT-L", description: "Self-supervised vision transformer trained on 142M curated images. Produces universal visual features without fine-tuning, excelling at dense prediction tasks.",
    category: "vision", architecture: "Vision Transformer (ViT-L/14)", params: "307M", size: "1.2GB", latency: "18ms @ A100", accuracy: "84.5% ImageNet (linear)", dataset: "LVD-142M",
    framework: ["PyTorch", "ONNX"], quantizations: ["FP32", "FP16", "BF16"],
    tags: ["foundation", "self-supervised", "features"], rating: 4.9, downloads: 156000, license: "Apache 2.0",
    useCases: ["Visual search engines", "Medical image analysis", "Satellite imagery classification", "Fine-grained recognition"],
    benchmarks: [{ name: "ImageNet Linear", score: "84.5%" }, { name: "ADE20k mIoU", score: "47.3" }, { name: "Copy Detection", score: "92.1 µAP" }]
  },
  {
    id: "ml-03", name: "YOLO-NAS-L", description: "Neural Architecture Search optimized YOLO variant. Quantization-aware training built in, making INT8 deployment nearly lossless. Best edge detection model.",
    category: "vision", architecture: "QAT-NAS Backbone + RepVGG", params: "44M", size: "176MB", latency: "3.6ms @ T4 (INT8)", accuracy: "52.2 mAP (COCO)", dataset: "COCO + Objects365",
    framework: ["PyTorch", "ONNX", "TensorRT", "CoreML"], quantizations: ["FP32", "FP16", "INT8", "QAT-INT8"],
    tags: ["detection", "edge", "quantization-aware"], rating: 4.7, downloads: 67400, license: "AGPL-3.0",
    useCases: ["Mobile AR detection", "Industrial inspection", "Traffic monitoring", "Robotics perception"],
    benchmarks: [{ name: "COCO mAP", score: "52.2%" }, { name: "INT8 mAP", score: "51.8%" }, { name: "Latency INT8", score: "3.6ms" }]
  },
  // NLP
  {
    id: "ml-04", name: "ModernBERT-Large", description: "Modernized BERT with RoPE, Flash Attention, and unpadding. 8192 token context. Drop-in replacement for classic BERT with 2x speed and higher accuracy.",
    category: "nlp", architecture: "Transformer Encoder (RoPE + FlashAttn)", params: "395M", size: "1.5GB", latency: "8ms/seq @ A100", accuracy: "92.4 GLUE avg", dataset: "2T tokens web corpus",
    framework: ["PyTorch", "ONNX", "OpenVINO"], quantizations: ["FP32", "FP16", "BF16", "GPTQ-4bit"],
    tags: ["encoder", "retrieval", "classification"], rating: 4.8, downloads: 234000, license: "Apache 2.0",
    useCases: ["Semantic search", "Document classification", "Named entity recognition", "Sentiment analysis"],
    benchmarks: [{ name: "GLUE Average", score: "92.4" }, { name: "SQuAD v2 F1", score: "88.7" }, { name: "Speed vs BERT", score: "2.1x" }]
  },
  {
    id: "ml-05", name: "E5-Mistral-7B-Instruct", description: "Embedding model fine-tuned from Mistral-7B. Produces rich 4096-dim embeddings for retrieval tasks. State-of-the-art on MTEB benchmark across 56 datasets.",
    category: "nlp", architecture: "Mistral-7B + Contrastive FT", params: "7.1B", size: "14GB", latency: "45ms/doc @ A100", accuracy: "66.6 MTEB avg", dataset: "1.2B pairs",
    framework: ["PyTorch", "vLLM", "GGUF"], quantizations: ["FP16", "BF16", "GPTQ-4bit", "GGUF-Q5"],
    tags: ["embeddings", "retrieval", "RAG"], rating: 4.9, downloads: 312000, license: "MIT",
    useCases: ["RAG pipelines", "Semantic search at scale", "Cross-lingual retrieval", "Document clustering"],
    benchmarks: [{ name: "MTEB Average", score: "66.6" }, { name: "BEIR nDCG@10", score: "59.2" }, { name: "Dim", score: "4096" }]
  },
  {
    id: "ml-06", name: "Gemma-2-9B-IT", description: "Google's instruction-tuned compact LLM. Strong reasoning for its size, with RLHF and distillation from larger models. Runs efficiently on consumer GPUs.",
    category: "nlp", architecture: "Transformer Decoder (SWA + GQA)", params: "9.2B", size: "18GB", latency: "32 tok/s @ RTX 4090", accuracy: "72.3 MMLU", dataset: "8T tokens",
    framework: ["PyTorch", "JAX", "GGUF", "TensorRT-LLM"], quantizations: ["FP16", "BF16", "GPTQ-4bit", "AWQ", "GGUF-Q4_K_M"],
    tags: ["chat", "reasoning", "instruction"], rating: 4.7, downloads: 445000, license: "Gemma License",
    useCases: ["Conversational AI", "Code generation", "Summarization", "Question answering"],
    benchmarks: [{ name: "MMLU", score: "72.3" }, { name: "HumanEval", score: "54.2%" }, { name: "GSM8K", score: "68.6%" }]
  },
  // Audio
  {
    id: "ml-07", name: "Whisper-Large-v3-Turbo", description: "OpenAI's latest ASR model. 98 language support with timestamp alignment and language detection. Distilled for 4x faster inference vs v3 with minimal quality loss.",
    category: "audio", architecture: "Transformer Encoder-Decoder", params: "809M", size: "3.1GB", latency: "0.3x realtime @ T4", accuracy: "4.2 WER (en)", dataset: "5M hrs multilingual",
    framework: ["PyTorch", "ONNX", "CTranslate2", "CoreML"], quantizations: ["FP32", "FP16", "INT8", "CTranslate2-INT8"],
    tags: ["speech", "transcription", "multilingual"], rating: 4.9, downloads: 890000, license: "MIT",
    useCases: ["Meeting transcription", "Podcast indexing", "Voice assistants", "Subtitle generation"],
    benchmarks: [{ name: "LibriSpeech WER", score: "1.8%" }, { name: "CommonVoice WER", score: "4.2%" }, { name: "Speed vs v3", score: "4x" }]
  },
  {
    id: "ml-08", name: "XTTS-v2", description: "Cross-lingual text-to-speech with voice cloning from 6-second reference. 17 languages, emotional expressiveness, and streaming support for real-time synthesis.",
    category: "audio", architecture: "VQ-VAE + GPT-2 + HiFi-GAN", params: "467M", size: "1.8GB", latency: "0.8x realtime (streaming)", accuracy: "4.1 MOS", dataset: "Curated multilingual TTS",
    framework: ["PyTorch", "ONNX"], quantizations: ["FP32", "FP16"],
    tags: ["tts", "voice-cloning", "streaming"], rating: 4.6, downloads: 198000, license: "CPML",
    useCases: ["Audiobook generation", "Virtual assistants", "Content localization", "Accessibility tools"],
    benchmarks: [{ name: "MOS Score", score: "4.1/5" }, { name: "Speaker Similarity", score: "0.87" }, { name: "Languages", score: "17" }]
  },
  // Multimodal
  {
    id: "ml-09", name: "LLaVA-NeXT-72B", description: "Vision-language model combining Qwen-72B with SigLIP vision encoder. Dynamic high-resolution processing up to 672x672. Best open VLM on benchmarks.",
    category: "multimodal", architecture: "SigLIP-400M + Qwen2-72B", params: "72B", size: "145GB", latency: "2.1s/img @ 8xA100", accuracy: "83.7 MMBench", dataset: "Mixed multimodal",
    framework: ["PyTorch", "vLLM"], quantizations: ["FP16", "BF16", "GPTQ-4bit", "AWQ"],
    tags: ["vlm", "reasoning", "analysis"], rating: 4.8, downloads: 67000, license: "Apache 2.0",
    useCases: ["Document understanding", "Chart/diagram analysis", "Visual QA systems", "Multimodal agents"],
    benchmarks: [{ name: "MMBench", score: "83.7" }, { name: "MMMU", score: "58.3" }, { name: "DocVQA", score: "87.5" }]
  },
  // Generative
  {
    id: "ml-10", name: "Stable Diffusion 3.5 Large", description: "Latest SD with MMDiT architecture. Rectified flow training for fewer sampling steps. Excellent prompt adherence and photorealism with T5-XXL text encoder.",
    category: "generative", architecture: "MMDiT + VAE + T5-XXL + CLIP", params: "8B", size: "16GB", latency: "4.2s @ A100 (28 steps)", accuracy: "GenEval: 0.82", dataset: "Curated web-scale",
    framework: ["PyTorch", "Diffusers", "ComfyUI", "ONNX"], quantizations: ["FP16", "BF16", "FP8"],
    tags: ["image-gen", "photorealistic", "controlnet"], rating: 4.7, downloads: 1230000, license: "Stability AI CL",
    useCases: ["Marketing asset creation", "Product visualization", "Concept art generation", "Texture synthesis"],
    benchmarks: [{ name: "GenEval Overall", score: "0.82" }, { name: "FID (COCO-30K)", score: "8.4" }, { name: "CLIP Score", score: "32.1" }]
  },
  {
    id: "ml-11", name: "CogVideoX-5B", description: "Video generation from text/image prompts. 6-second clips at 720p with temporal consistency. Supports image-to-video and video extension workflows.",
    category: "generative", architecture: "3D VAE + Expert Transformer", params: "5B", size: "19GB", latency: "120s/6s clip @ A100", accuracy: "VBench: 81.6", dataset: "Web video corpus",
    framework: ["PyTorch", "Diffusers"], quantizations: ["FP16", "BF16"],
    tags: ["video-gen", "text-to-video", "i2v"], rating: 4.5, downloads: 89000, license: "CogVideoX License",
    useCases: ["Short-form content creation", "Product demos", "Animation prototyping", "Social media content"],
    benchmarks: [{ name: "VBench Quality", score: "81.6" }, { name: "Resolution", score: "720p" }, { name: "Duration", score: "6s" }]
  },
  // Reinforcement Learning
  {
    id: "ml-12", name: "DreamerV3", description: "World model RL agent that learns a latent dynamics model and plans within it. Achieves superhuman performance across diverse domains without domain-specific tuning.",
    category: "reinforcement", architecture: "RSSM + Actor-Critic", params: "200M", size: "800MB", latency: "500 env steps/s", accuracy: "Superhuman (Atari/DMLab)", dataset: "Self-play",
    framework: ["JAX", "PyTorch"], quantizations: ["FP32"],
    tags: ["world-model", "planning", "general"], rating: 4.8, downloads: 34000, license: "MIT",
    useCases: ["Game AI development", "Robotics simulation", "Resource optimization", "Autonomous navigation"],
    benchmarks: [{ name: "Atari-100K HNS", score: "1.82" }, { name: "DMLab-30", score: "143%" }, { name: "Minecraft Diamonds", score: "Yes" }]
  },
  // Tabular
  {
    id: "ml-13", name: "TabPFN-v2", description: "Prior-data fitted transformer for tabular prediction. Zero-shot inference: no training needed, just pass data. Beats XGBoost on datasets under 10K rows.",
    category: "tabular", architecture: "Tabular Transformer (PFN)", params: "120M", size: "480MB", latency: "0.8s inference (10K rows)", accuracy: "Rank #1 (AutoML Bench <10K)", dataset: "18K synthetic tasks",
    framework: ["PyTorch", "scikit-learn API"], quantizations: ["FP32", "FP16"],
    tags: ["automl", "zero-shot", "classification", "regression"], rating: 4.7, downloads: 56000, license: "Apache 2.0",
    useCases: ["Rapid prototyping", "Small dataset prediction", "Feature importance analysis", "Baseline model generation"],
    benchmarks: [{ name: "AutoML Bench (rank)", score: "#1" }, { name: "vs XGBoost (win%)", score: "67%" }, { name: "Inference 10K", score: "0.8s" }]
  },
  // Time Series
  {
    id: "ml-14", name: "TimesFM-1.0-200M", description: "Google's foundation model for time series forecasting. Zero-shot across domains. Trained on 100B time points from Google Trends, Wiki traffic, and synthetic data.",
    category: "timeseries", architecture: "Patched Decoder Transformer", params: "200M", size: "800MB", latency: "12ms/forecast @ T4", accuracy: "MASE 0.73 (zero-shot)", dataset: "100B timepoints",
    framework: ["JAX", "PyTorch", "ONNX"], quantizations: ["FP32", "BF16"],
    tags: ["forecasting", "zero-shot", "foundation"], rating: 4.6, downloads: 78000, license: "Apache 2.0",
    useCases: ["Demand forecasting", "Financial prediction", "Energy load planning", "Anomaly detection"],
    benchmarks: [{ name: "Monash MASE", score: "0.73" }, { name: "vs N-BEATS", score: "+12%" }, { name: "Zero-shot domains", score: "All" }]
  },
  {
    id: "ml-15", name: "Chronos-T5-Large", description: "Amazon's pretrained time series model. Tokenizes time series into bins and uses T5 architecture. Probabilistic forecasts with uncertainty quantification.",
    category: "timeseries", architecture: "T5 Encoder-Decoder", params: "710M", size: "2.8GB", latency: "28ms/forecast @ T4", accuracy: "WQL 0.024 (ETTh1)", dataset: "Diverse TS corpus",
    framework: ["PyTorch", "HuggingFace"], quantizations: ["FP32", "FP16", "BF16"],
    tags: ["probabilistic", "uncertainty", "pretrained"], rating: 4.5, downloads: 45000, license: "Apache 2.0",
    useCases: ["Risk-aware forecasting", "Capacity planning", "Weather prediction", "Sales projections"],
    benchmarks: [{ name: "WQL (ETTh1)", score: "0.024" }, { name: "CRPS Improvement", score: "+18%" }, { name: "Calibration", score: "0.94" }]
  },
];

const categoryIcons: Record<string, any> = {
  vision: ImageIcon, nlp: FileText, audio: Music, multimodal: Globe,
  generative: Zap, reinforcement: Target, tabular: BarChart3, timeseries: TrendingUp,
};
const categoryLabels: Record<string, string> = {
  vision: "Computer Vision", nlp: "NLP & Language", audio: "Audio & Speech",
  multimodal: "Multimodal", generative: "Generative", reinforcement: "Reinforcement Learning",
  tabular: "Tabular", timeseries: "Time Series",
};

export default function ModelZooPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [cart, setCart] = useState<string[]>([]);
  const [selected, setSelected] = useState<MLModel | null>(null);

  const filtered = modelCatalog.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase()) || m.tags.some(t => t.includes(search.toLowerCase()));
    const matchTab = activeTab === "all" || m.category === activeTab;
    return matchSearch && matchTab;
  });

  const toggleCart = (id: string) => {
    setCart(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const model = modelCatalog.find(m => m.id === id);
    if (model && !cart.includes(id)) toast.success(`${model.name} added to workspace`);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Main catalog */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-6 pb-0 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Model Zoo</h1>
              <p className="text-sm text-muted-foreground">{modelCatalog.length} production-ready ML models across {Object.keys(categoryLabels).length} domains</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1"><ShoppingCart className="h-3 w-3" />{cart.length}</Badge>
              {cart.length > 0 && (
                <Button size="sm" onClick={() => { toast.success(`${cart.length} models deployed to workspace`); setCart([]); }}>
                  <Download className="h-3 w-3 mr-1" /> Deploy All
                </Button>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search models, architectures, tags…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col p-6 pt-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 justify-start">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">All</TabsTrigger>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <TabsTrigger key={k} value={k} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">{v}</TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {filtered.map(m => {
                  const Icon = categoryIcons[m.category] || Box;
                  const inCart = cart.includes(m.id);
                  return (
                    <motion.div key={m.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      className={cn("border rounded-lg p-4 cursor-pointer transition-colors hover:bg-accent/10", selected?.id === m.id && "ring-2 ring-primary")}
                      onClick={() => setSelected(m)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2 rounded-md bg-primary/10 shrink-0"><Icon className="h-4 w-4 text-primary" /></div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{m.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{m.description}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="secondary" className="text-[10px]">{m.params}</Badge>
                              <Badge variant="secondary" className="text-[10px]">{m.architecture.split("(")[0].trim()}</Badge>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-current text-yellow-500" />{m.rating}</span>
                              <span className="text-[10px] text-muted-foreground">{(m.downloads / 1000).toFixed(0)}K ↓</span>
                            </div>
                          </div>
                        </div>
                        <Button size="icon" variant={inCart ? "default" : "outline"} className="h-7 w-7 shrink-0" onClick={e => { e.stopPropagation(); toggleCart(m.id); }}>
                          {inCart ? <CheckCircle2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 400, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="border-l bg-card overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{selected.name}</h2>
                    <Badge className="mt-1">{categoryLabels[selected.category]}</Badge>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
                </div>
                <p className="text-sm text-muted-foreground">{selected.description}</p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: "Parameters", v: selected.params },
                    { l: "Size", v: selected.size },
                    { l: "Latency", v: selected.latency },
                    { l: "Accuracy", v: selected.accuracy },
                    { l: "License", v: selected.license },
                    { l: "Architecture", v: selected.architecture },
                  ].map(({ l, v }) => (
                    <div key={l} className="p-2 rounded-md bg-muted/50">
                      <div className="text-[10px] text-muted-foreground">{l}</div>
                      <div className="text-xs font-medium mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>

                <Separator />
                <div>
                  <h4 className="text-xs font-semibold mb-2">Benchmarks</h4>
                  <div className="space-y-2">
                    {selected.benchmarks.map(b => (
                      <div key={b.name} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{b.name}</span>
                        <span className="font-mono font-semibold">{b.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />
                <div>
                  <h4 className="text-xs font-semibold mb-2">Frameworks</h4>
                  <div className="flex flex-wrap gap-1">{selected.framework.map(f => <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>)}</div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-2">Quantizations</h4>
                  <div className="flex flex-wrap gap-1">{selected.quantizations.map(q => <Badge key={q} variant="secondary" className="text-[10px]">{q}</Badge>)}</div>
                </div>

                <Separator />
                <div>
                  <h4 className="text-xs font-semibold mb-2">Use Cases</h4>
                  <ul className="space-y-1">{selected.useCases.map(u => (
                    <li key={u} className="text-xs text-muted-foreground flex items-center gap-1"><ChevronRight className="h-3 w-3 text-primary" />{u}</li>
                  ))}</ul>
                </div>

                <Separator />
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => toggleCart(selected.id)}>
                    {cart.includes(selected.id) ? <><CheckCircle2 className="h-3 w-3 mr-1" />In Workspace</> : <><Plus className="h-3 w-3 mr-1" />Add to Workspace</>}
                  </Button>
                  <Button variant="outline" onClick={() => toast.info("Model card & API docs opened")}>
                    <Eye className="h-3 w-3 mr-1" /> Docs
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
